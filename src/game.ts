/**
 * DOUBLE GAME — Game orchestrator.
 * Wires world, player, NPCs, dialogue, investigation, relationship,
 * mission phases, cinematics and save/resume for Milestone 1.
 */
import * as THREE from 'three';
import { Engine } from './core/engine.ts';
import { Input } from './core/input.ts';
import { AudioBus } from './core/audio.ts';
import { CollisionWorld } from './core/collision.ts';
import { type SaveGame, readSave, writeSave, SAVE_VERSION } from './core/save.ts';
import { buildWorld, type BuildResult } from './world/build.ts';
import { Player } from './entities/player.ts';
import { Npc } from './entities/npc.ts';
import { Hud } from './ui/hud.ts';
import { DialogueRunner } from './ui/dialogue.ts';
import { NotebookUI } from './ui/notebook.ts';
import { TerminalUI } from './ui/terminal.ts';
import { showPhone, showMissionCard, hideMissionCard, showEvidencePaper } from './ui/misc.ts';
import { showTitle, showIntro, hideMenu, showPause } from './ui/menus.ts';
import {
  newRelationship, applyDelta, addMemory, addRevelation, keerthyBelieves as kBelieves,
  addPromise, trustLabel, closenessLabel, deserializeRelationship, type RelationshipState, type RelDelta,
} from './systems/relationship.ts';
import {
  newInvestigation, discover, combine, deserializeInvestigation, type InvestigationState,
} from './systems/investigation.ts';
import type { Effect, DialogueGraph } from './systems/dialogue-types.ts';
import { EVIDENCE, DEDUCTIONS, BAD_PAIR_QUIPS } from './data/content.ts';
import {
  RAO_GRAPH, MEERA_GRAPH, NAVEEN_GRAPH, KEERTHY_GRAPH, MURAL_GRAPH, CAFE_SKETCH_GRAPH,
  WALK_BEATS, KEERTHY_SMALLTALK, RAO_SMALLTALK, MEERA_SMALLTALK, NAVEEN_SMALLTALK,
  PHONES, OBJECTIVES,
} from './data/mission1.ts';

type Phase = 'commute' | 'checkin' | 'desk' | 'meera' | 'naveen' | 'lunch' | 'keerthy' | 'walk' | 'cafe' | 'return' | 'done';
const PHASE_ORDER: Phase[] = ['commute', 'checkin', 'desk', 'meera', 'naveen', 'lunch', 'keerthy', 'walk', 'cafe', 'return', 'done'];

const COMBINED_SKETCH: DialogueGraph = { ...CAFE_SKETCH_GRAPH, ...MURAL_GRAPH };

export class Game {
  private engine: Engine;
  private input: Input;
  private audio = new AudioBus();
  private hud = new Hud();
  private cw = new CollisionWorld();
  private build!: BuildResult;
  private player!: Player;
  private dialogue!: DialogueRunner;
  private notebook!: NotebookUI;
  private terminal!: TerminalUI;

  private npcs!: {
    rao: Npc; meera: Npc; naveen: Npc; keerthy: Npc; peds: Npc[];
  };

  // State
  private rel: RelationshipState = newRelationship();
  private inv: InvestigationState = newInvestigation();
  private flags: Record<string, boolean | string | number> = {};
  private phase: Phase = 'commute';
  private walkIndex = 0;
  private clockMin = 9 * 60 + 2;
  private missionComplete = false;
  private dialogueSeen = new Set<string>();

  // Modes
  private started = false;
  private paused = false;
  private cinematic = false;
  private phoneOpen = false;
  private pointerWanted = false;

  // Beacons / walk
  private beacon: [number, number] | null = null;
  private keerthyQuipCooldown = 0;
  private sedanActive = false;
  private sedanToastDone = false;
  private smalltalkIdx = 0;
  private interactTarget: string | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas);
    this.input = new Input(canvas);
    this.build = buildWorld(this.engine.scene, this.cw);
    this.createNpcs();

    this.player = new Player(this.cw, this.input, this.audio, this.engine.scene, this.build.refs.spawn);

    this.dialogue = new DialogueRunner(
      this.input,
      this.audio,
      (e) => this.applyEffect(e),
      () => this.onDialogueEnd(),
    );

    this.notebook = new NotebookUI(
      this.audio,
      () => this.rel,
      () => this.inv,
      (a, b) => this.tryCombine(a, b),
    );

    this.terminal = new TerminalUI({
      onInspect: (row) => { if (row.locked) this.audio.uiBlip(); },
      onReport: () => this.onTerminalReport(),
      onClose: () => {
        this.input.muted = false;
        this.player.setControl(true);
        this.ensureLocked();
      },
    });

    this.input.setLockListener((locked) => this.onLockChange(locked));
    this.input.setAnyKeyListener(() => this.audio.init());

    // Trigger behaviors
    this.cw.getTrigger('bank-entry')!.onEnter = () => {
      if (!this.flags.bankGreeted) {
        this.flags.bankGreeted = true;
        this.hud.toast('Janapriya Bank — est. 1962. The air-conditioning says welcome.', 'teal');
      }
      if (this.phase === 'commute') this.setPhase('checkin');
    };
    this.cw.getTrigger('cafe-arrival')!.onEnter = () => {
      if (this.phase === 'lunch') this.setPhase('keerthy');
    };
    this.cw.getTrigger('hook')!.onEnter = () => {
      if (this.phase === 'return') this.startHook();
    };

    this.engine.onUpdate((dt) => this.update(dt));
    this.engine.start();
  }

  /* ================= NPC creation ================= */
  private createNpcs() {
    const s = this.engine.scene;
    this.npcs = {
      rao: new Npc(s, { skin: 0xa97850, shirt: 0x3a3f4a, pants: 0x23262e, hair: 0x666666, accent: 0x8a2f2f }, 10.2, 0.15, 22.6, 'stand', Math.PI),
      meera: new Npc(s, { skin: 0xc29a6e, shirt: 0x2f8f83, pants: 0x7a4a6e, hair: 0x1a1512, accent: 0xd98b2b }, -6.5, 0.15, 15.4, 'stand', Math.PI),
      naveen: new Npc(s, { skin: 0xb9895f, shirt: 0xd98b2b, pants: 0x33415a, hair: 0x201a16, accent: 0x2f8f83 }, -10.2, 0.15, 20.9, 'stand', 0),
      keerthy: new Npc(s, { skin: 0xc29a6e, shirt: 0x93334f, pants: 0x3d3a4f, hair: 0x14100e, accent: 0xe8b93c }, this.build.refs.keerthySeat.x, 0.15, this.build.refs.keerthySeat.z, 'stand', Math.PI / 2),
      peds: [],
    };
    const pedStyles = [
      { skin: 0xa97850, shirt: 0x7a8a99, pants: 0x3a3d46, hair: 0x201a16 },
      { skin: 0xc29a6e, shirt: 0xb04a2f, pants: 0x2a2d36, hair: 0x14100e },
      { skin: 0x9a6a45, shirt: 0x4a7f3f, pants: 0x4a3d2f, hair: 0x302620 },
    ];
    this.build.refs.pedestrianPaths.forEach((path, i) => {
      const ped = new Npc(s, pedStyles[i % pedStyles.length], path.minX + Math.random() * (path.maxX - path.minX), 0.15, path.z, 'wander', 0);
      ped.setWanderRange(path.minX, path.maxX, path.z);
      ped.speed = 1.1 + Math.random() * 0.6;
      this.npcs.peds.push(ped);
    });
    const seat0 = this.build.refs.keerthySeat;
    this.npcs.keerthy.pos.set(seat0.x, 0.15, seat0.z);
    this.npcs.keerthy.sit();
    this.npcs.keerthy.humanoid.facing = seat0.facing;
    this.npcs.keerthy.humanoid.group.rotation.y = seat0.facing;
  }

  /* ================= Boot flows ================= */
  showMainMenu() {
    this.started = false;
    const save = readSave();
    showTitle({
      hasSave: !!save,
      saveInfo: save ? `${OBJECTIVES[(save.phase as Phase)]?.text ?? save.phase}` : undefined,
      onNew: () => {
        this.audio.init();
        this.audio.uiSelect();
        showIntro(() => {
          this.resetState();
          hideMenu();
          this.beginPlay();
        });
      },
      onContinue: () => {
        this.audio.init();
        this.audio.uiSelect();
        const s = readSave();
        if (s) {
          this.loadFromSave(s);
          hideMenu();
          this.beginPlay();
        }
      },
    });
  }

  private beginPlay() {
    this.started = true;
    this.paused = false;
    this.hud.show(true);
    this.hud.fade(true);
    window.setTimeout(() => this.hud.fade(false), 120);
    this.input.requestLock(); // optional nicety; drag-to-look works without it
    this.save();
  }

  private resetState() {
    this.rel = newRelationship();
    this.inv = newInvestigation();
    this.flags = {};
    this.missionComplete = false;
    this.dialogueSeen.clear();
    this.walkIndex = 0;
    this.clockMin = 9 * 60 + 2;
    this.beacon = null;
    this.sedanActive = false;
    this.build.refs.sedan.visible = false;
    const sp = this.build.refs.spawn;
    this.player.teleport(sp.x, sp.y, sp.z, sp.yaw);
    this.player.snapCamera(this.engine.camera);
    this.terminal.reset();
    this.placeKeerthyFor('commute');
    this.setPhase('commute', true);
    this.hud.toast('Monday. 9:02 a.m. Street One smells like rain and filter coffee.', 'gold', 5200);
  }

  /* ================= Phase machine ================= */
  private phaseAtLeast(p: Phase): boolean {
    return PHASE_ORDER.indexOf(this.phase) >= PHASE_ORDER.indexOf(p);
  }

  private setPhase(next: Phase, silent = false) {
    this.phase = next;
    const obj = OBJECTIVES[next];
    this.hud.setObjective(obj.text, obj.sub);
    this.beacon = obj.beacon ?? null;

    if (next === 'lunch' || next === 'keerthy') this.clockMin = 13 * 60 + 5;
    if (next === 'return') this.clockMin = 13 * 60 + 48;
    if (next === 'done') this.clockMin = 14 * 60 + 15;

    if (!this.dialogue.active) this.syncKeerthyToPhase();
    if (!silent) {
      this.hud.toast('Objective updated.', 'teal', 2500);
      this.save();
    }
  }

  private placeKeerthyFor(phase: Phase) {
    const k = this.npcs.keerthy;
    const seat = this.build.refs.keerthySeat;
    const activity = this.flags.activity;
    if (phase === 'walk') {
      // stands up wherever the walk left her (starts from the café seat)
      k.stand();
      k.speed = 2.6;
      return;
    }
    if (phase === 'return' || phase === 'done') {
      if (activity === 'walk') {
        const wp = this.build.refs.walkWaypoints[this.build.refs.walkWaypoints.length - 1];
        k.pos.set(wp.x, 0.15, wp.z);
        k.stand();
        k.humanoid.facing = -Math.PI / 2;
        k.humanoid.group.rotation.y = -Math.PI / 2;
        return;
      }
    }
    // default: seated at the café
    k.pos.set(seat.x, 0.15, seat.z);
    k.sit();
    k.humanoid.facing = seat.facing;
    k.humanoid.group.rotation.y = seat.facing;
  }

  private syncKeerthyToPhase() {
    this.placeKeerthyFor(this.phase);
  }

  /* ================= Save / load ================= */
  private save(manual = false) {
    if (!this.started) return;
    const k = this.npcs.keerthy;
    const save: SaveGame = {
      v: SAVE_VERSION,
      savedAt: new Date().toISOString(),
      phase: this.phase,
      walkIndex: this.walkIndex,
      clockMinutes: this.clockMin,
      player: { x: this.player.pos.x, y: this.player.pos.y, z: this.player.pos.z, yaw: this.player.humanoid.facing },
      keerthy: { x: k.pos.x, z: k.pos.z, facing: k.humanoid.facing, seated: (k as unknown as { seated?: boolean }).seated === true },
      flags: { ...this.flags },
      rel: JSON.parse(JSON.stringify(this.rel)),
      inv: { found: [...this.inv.found], deduced: [...this.inv.deduced], attempts: this.inv.attempts },
      dialogueSeen: [...this.dialogueSeen],
      missionComplete: this.missionComplete,
    };
    if (writeSave(save) && manual) this.hud.toast('Progress saved.', 'teal', 2200);
  }

  private loadFromSave(s: SaveGame) {
    this.rel = deserializeRelationship(s.rel);
    this.inv = deserializeInvestigation(s.inv);
    this.flags = { ...s.flags };
    this.walkIndex = s.walkIndex;
    this.clockMin = s.clockMinutes;
    this.missionComplete = s.missionComplete;
    this.dialogueSeen = new Set(s.dialogueSeen);
    this.player.teleport(s.player.x, Math.max(0.15, s.player.y), s.player.z, s.player.yaw);
    this.player.snapCamera(this.engine.camera);
    const k = this.npcs.keerthy;
    if (s.keerthy) {
      k.pos.set(s.keerthy.x, 0.15, s.keerthy.z);
      if (s.keerthy.seated) { k.sit(); } else { k.stand(); }
      k.humanoid.facing = s.keerthy.facing;
      k.humanoid.group.rotation.y = s.keerthy.facing;
    }
    if (String(this.flags.terminalDone) === 'true') this.terminal.markReported();
    this.setPhase(s.phase as Phase, true);
    this.hud.toast('Progress restored. Welcome back to Monday.', 'gold', 3600);
    // If the save landed mid-hook-cinematic, replay the payoff instead of soft-locking.
    if (this.flags.hookDone && !this.missionComplete && this.phase === 'return') {
      window.setTimeout(() => this.finishMission(), 400);
    }
  }

  /* ================= Effects ================= */
  private applyEffect(e: Effect) {
    switch (e.type) {
      case 'rel': {
        const notes = applyDelta(this.rel, e as RelDelta);
        if (notes.length) {
          const positive = (e.trust ?? 0) >= 0 && (e.closeness ?? 0) >= 0 && (e.suspicion ?? 0) <= 0;
          this.hud.toast(`Keerthy — ${notes.join(' · ')}`, positive ? 'gold' : 'red', 3000);
          if (positive) this.audio.heartWarm();
        }
        break;
      }
      case 'evidence':
        this.discoverEvidence(e.id);
        break;
      case 'flag':
        this.flags[e.key] = e.value;
        break;
      case 'memory':
        addMemory(this.rel, e.text);
        break;
      case 'reveal':
        addRevelation(this.rel, e.text);
        break;
      case 'believes':
        kBelieves(this.rel, e.text);
        break;
      case 'promise':
        addPromise(this.rel, e.id, e.text);
        break;
      case 'toast':
        this.hud.toast(e.text, e.tone ?? 'teal');
        break;
      case 'phase':
        this.setPhase(e.id as Phase);
        break;
      case 'phone': {
        const script = PHONES[e.id];
        if (script) {
          this.flags[`phone:${e.id}`] = true;
          this.dialogueSuspended = true;
          this.phoneOpen = true;
          this.audio.phoneVibrate();
          showPhone(script, () => {
            this.phoneOpen = false;
            this.dialogueSuspended = false;
          });
        }
        break;
      }
    }
  }

  private dialogueSuspended = false;

  private discoverEvidence(id: string) {
    if (discover(this.inv, id)) {
      const ev = EVIDENCE[id];
      this.hud.toast(`Clue added to notebook — ${ev?.title ?? id}`, 'gold', 3800);
      this.audio.clueFound();
      this.save();
    }
  }

  private tryCombine(a: string, b: string): { ok: boolean; message: string } {
    const res = combine(this.inv, a, b, DEDUCTIONS, () => {
      const idx = Math.max(0, this.inv.attempts - 1) % BAD_PAIR_QUIPS.length;
      return BAD_PAIR_QUIPS[idx];
    });
    if (res.ok) {
      const d = DEDUCTIONS.find((x) => x.id === res.id);
      this.hud.toast(`Deduction — ${d?.title}. The notebook approves.`, 'gold', 4200);
      this.save();
    } else {
      this.hud.toast(res.message, 'teal', 3200);
    }
    return { ok: res.ok, message: res.message };
  }

  /* ================= Terminal ================= */
  private onTerminalReport() {
    this.flags.terminalDone = true;
    this.discoverEvidence('E1');
    this.discoverEvidence('E5');
    this.terminal.closeDown();
    this.input.muted = false;
    this.player.setControl(true);
    this.hud.toast('Anomaly report filed. Deeper rows stay locked behind “P. AUTH”.', 'gold', 5000);
    this.setPhase('meera');
    this.ensureLocked();
  }

  /* ================= Dialogue ================= */
  private startDialogue(graph: DialogueGraph, nodeId: string, faceNpc?: Npc) {
    this.input.muted = true;
    this.player.setControl(false);
    this.input.releaseLock();
    if (faceNpc) faceNpc.lookAt(this.player.pos.clone().setY(this.player.pos.y + 1.4));
    this.dialogue.start(graph, nodeId);
    this.hud.hideInteract();
  }

  private onDialogueEnd() {
    this.input.muted = false;
    for (const n of [this.npcs.rao, this.npcs.meera, this.npcs.naveen, this.npcs.keerthy]) {
      n.lookAt(null);
    }
    if (this.cinematic) return;
    this.player.setControl(true);
    this.syncKeerthyToPhase();
    this.ensureLocked();
    this.save();
  }

  /* ================= Interaction ================= */
  private getInteractInfo(id: string): { enabled: boolean; label: string } {
    const st = (label: string) => ({ enabled: true, label });
    const off = { enabled: false, label: '' };
    switch (id) {
      case 'rao':
        if (this.phase === 'checkin') return st('Check in with Mr. Rao');
        return this.flags.metRao ? st('Mr. Rao') : off;
      case 'meera':
        if (this.phase === 'meera') return st('Ask Meera about Sunday night');
        return this.phaseAtLeast('meera') ? st('Meera') : off;
      case 'naveen':
        if (this.phase === 'naveen') return st('Ask Naveen about the Sunday logs');
        return this.phaseAtLeast('naveen') ? st('Naveen') : off;
      case 'terminal':
        if (this.phase === 'desk' && !this.flags.terminalDone) return st('Open reconciliation queue (JPC-07)');
        return this.flags.terminalDone ? st('Terminal JPC-07 (locked by compliance)') : off;
      case 'slip':
        return this.phaseAtLeast('desk') ? st(this.flags.slipSeen ? 'Read the remittance slip again' : 'Inspect the discarded remittance slip') : off;
      case 'keerthy':
        if (this.phase === 'keerthy') return st('Talk to the woman with the sketchbook');
        if (this.phase === 'cafe') return st('Keerthy (try the sketchbook instead)');
        if (this.phaseAtLeast('return')) return st('Talk to Keerthy');
        return off;
      case 'sketchbook':
        if (this.phase === 'cafe' && !this.flags.sketchDone) return st('Look through Keerthy’s sketchbook');
        return off;
      case 'mural':
        return this.phaseAtLeast('return') || this.flags.revealDone
          ? st('Look at “Two Ledgers”')
          : st('The freshly painted mural wall');
      case 'fountain': return st('The plaza fountain');
      case 'apartment': return st('Your apartment');
      case 'cafecounter': return st('Order filter coffee');
      default: return off;
    }
  }

  private doInteract(id: string) {
    this.audio.interact();
    switch (id) {
      case 'rao':
        if (this.phase === 'checkin') {
          this.startDialogue(RAO_GRAPH, 'rao1', this.npcs.rao);
        } else {
          this.hud.toast(RAO_SMALLTALK, 'teal');
        }
        break;
      case 'meera':
        if (this.phase === 'meera') this.startDialogue(MEERA_GRAPH, 'meera1', this.npcs.meera);
        else this.hud.toast(MEERA_SMALLTALK, 'teal');
        break;
      case 'naveen':
        if (this.phase === 'naveen') this.startDialogue(NAVEEN_GRAPH, 'nav1', this.npcs.naveen);
        else this.hud.toast(NAVEEN_SMALLTALK, 'teal');
        break;
      case 'terminal':
        if (this.phase === 'desk' && !this.flags.terminalDone) {
          this.flags.terminalSeen = true;
          this.input.releaseLock();
          this.input.muted = true;
          this.player.setControl(false);
          this.terminal.openUp();
        } else if (this.flags.terminalDone) {
          this.hud.toast('The queue is frozen under a compliance review. Your access, “under routine attention”.', 'red');
        }
        break;
      case 'slip':
        this.input.releaseLock();
        this.player.setControl(false);
        showEvidencePaper(
          EVIDENCE.E1B,
          [
            ['Bank', 'Janapriya Bank — Street One'],
            ['Reference', 'KA-1127'],
            ['Amount', '₹49,900'],
            ['Beneficiary', 'SRI KAVERI INFRA SOLN'],
            ['Dated', 'SUN 02:38'],
            ['Filed under', '— nothing. It was in the tray.'],
          ],
          'NOT FILED',
          () => {
            if (!this.flags.slipSeen) {
              this.flags.slipSeen = true;
              this.discoverEvidence('E1B');
            }
            this.player.setControl(true);
            this.ensureLocked();
          },
        );
        break;
      case 'keerthy': {
        const k = this.npcs.keerthy;
        if (this.phase === 'keerthy') {
          this.startDialogue(KEERTHY_GRAPH, 'k1', k);
        } else if (this.phase === 'cafe') {
          this.hud.toast('She taps the sketchbook. “It’s all in here, banker. Look.”', 'teal');
        } else if (this.phaseAtLeast('return')) {
          const line = KEERTHY_SMALLTALK[this.smalltalkIdx % KEERTHY_SMALLTALK.length];
          this.smalltalkIdx++;
          this.startDialogue({
            small: { id: 'small', speaker: 'narrator', text: line, end: true },
          }, 'small', k);
        }
        break;
      }
      case 'sketchbook':
        if (this.phase === 'cafe' && !this.flags.sketchDone) {
          this.flags.sketchDone = true;
          this.startDialogue(COMBINED_SKETCH, 's1', this.npcs.keerthy);
        }
        break;
      case 'mural':
        if (this.flags.revealDone) {
          this.hud.toast('“Two Ledgers” — the city counting its money, and the city counting its people. You know which side to watch now.', 'gold', 6000);
        } else {
          this.hud.toast('Fresh paint, sharp lines. A small brass plate reads “Kalpa Designs”.', 'teal');
        }
        break;
      case 'fountain':
        this.hud.toast('The fountain has better work-life balance than the bank. It stopped working at five and means it.', 'teal');
        break;
      case 'apartment':
        this.hud.toast('Your apartment. The bed can wait — the ledger has already had its coffee.', 'teal');
        break;
      case 'cafecounter':
        this.hud.toast('“One honest filter coffee, coming up.” …You’re on the clock, sort of. Keerthy’s table looks more interesting.', 'teal');
        break;
    }
  }

  /* ================= Hook cinematic ================= */
  private startHook() {
    if (this.flags.hookDone) return;
    this.flags.hookDone = true;
    this.cinematic = true;
    this.player.setControl(false);
    this.input.releaseLock();
    this.hud.letterbox(true);
    this.audio.tense();
    this.sedanActive = true;
    this.sedanToastDone = false;
    const sedan = this.build.refs.sedan;
    sedan.visible = true;
    sedan.position.set(95, 0.02, 3);
    this.hud.setObjective('…', 'Something is different today.');
    this.beacon = null;

    showPhone(PHONES['naveen-warning'], () => {
      showPhone(PHONES['compliance-email'], () => {
        const honesty = String(this.flags.honesty ?? 'deflect');
        const script = honesty === 'honest' ? PHONES['keerthy-honest'] : honesty === 'lie' ? PHONES['keerthy-lie'] : PHONES['keerthy-deflect'];
        showPhone(script, () => {
          if (honesty === 'honest') {
            this.discoverEvidence('E6');
            applyDelta(this.rel, { trust: 4 });
            this.hud.toast('Keerthy — +4 Trust (she came through)', 'gold');
          } else if (honesty === 'lie') {
            applyDelta(this.rel, { suspicion: 8 });
            this.hud.toast('Keerthy — +8 Suspicion (she noticed the leak)', 'red');
          } else {
            applyDelta(this.rel, { closeness: 1 });
          }
          this.finishMission();
        });
      });
    });
  }

  private finishMission() {
    this.cinematic = false;
    this.missionComplete = true;
    this.hud.letterbox(false);
    this.setPhase('done');
    this.audio.missionComplete();
    const promise = this.flags.exhibition === 'promise' ? 'PROMISED' : this.flags.exhibition === 'maybe' ? '“MAYBE”' : this.flags.exhibition === 'declined' ? 'DECLINED' : '—';
    showMissionCard(
      {
        trust: trustLabel(this.rel.trust),
        closeness: closenessLabel(this.rel.closeness),
        clues: `${this.inv.found.length}/7`,
        deductions: `${this.inv.deduced.length}/2`,
        promise,
      },
      () => {
        hideMissionCard();
        this.player.setControl(true);
        this.save();
        this.ensureLocked();
      },
      () => {
        hideMissionCard();
        this.save();
        this.toTitle();
      },
    );
  }

  private toTitle() {
    this.save();
    this.started = false;
    this.hud.show(false);
    this.player.setControl(false);
    this.input.releaseLock();
    this.showMainMenu();
  }

  /* ================= Pointer lock management ================= */
  private ensureLocked() {
    if (!this.started || this.cinematic) return;
    if (this.dialogue.active || this.notebook.open || this.terminal.open || this.phoneOpen || this.paused) return;
    this.pointerWanted = true;
    this.input.requestLock(); // if the browser/iframe refuses, drag-to-look still works
  }

  private onLockChange(locked: boolean) {
    if (locked) {
      this.hud.hideClickToPlay();
      return;
    }
    if (!this.started || this.paused) return;
    if (this.dialogue.active || this.notebook.open || this.terminal.open || this.phoneOpen || this.cinematic) return;
    // Pointer lock escaped outside of any UI → pause.
    this.openPause();
  }

  private openPause() {
    this.paused = true;
    this.player.setControl(false);
    showPause({
      muted: this.audio.muted,
      onResume: () => this.closePause(),
      onSave: () => this.save(true),
      onToggleMute: () => {
        this.audio.init();
        this.audio.setMuted(!this.audio.muted);
      },
      onQuit: () => {
        this.save();
        this.paused = false;
        this.toTitle();
      },
    });
  }

  private closePause() {
    this.paused = false;
    hideMenu();
    this.player.setControl(true);
    this.ensureLocked();
  }

  /* ================= Walk with Keerthy ================= */
  private updateWalk(dt: number) {
    const k = this.npcs.keerthy;
    if (this.dialogue.active) return;
    const wps = this.build.refs.walkWaypoints;
    if (this.walkIndex >= wps.length) {
      // At the mural — start the conversation when the player is close.
      const d = Math.hypot(this.player.pos.x - k.pos.x, this.player.pos.z - k.pos.z);
      if (d < 4.2 && !this.flags.muralTalked) {
        this.flags.muralTalked = true;
        this.startDialogue(COMBINED_SKETCH, 'm1', k);
      } else {
        k.lookAt(this.player.pos.clone().setY(k.pos.y + 1.3));
      }
      return;
    }
    const target = wps[this.walkIndex];
    const distPlayer = Math.hypot(this.player.pos.x - k.pos.x, this.player.pos.z - k.pos.z);
    if (distPlayer > 13) {
      // She waits for you.
      k.lookAt(this.player.pos.clone().setY(k.pos.y + 1.3));
      this.keerthyQuipCooldown -= dt;
      if (this.keerthyQuipCooldown <= 0) {
        this.keerthyQuipCooldown = 9;
        this.hud.toast('Keerthy waits ahead: “The mural doesn’t bite. The pigeons might.”', 'gold');
      }
      return;
    }
    const arrived = k.walkToward(new THREE.Vector3(target.x, 0.15, target.z), dt, 0.3);
    if (arrived) {
      const beatIdx = this.walkIndex === 0 ? 0 : this.walkIndex === 2 ? 1 : this.walkIndex === 4 ? 2 : -1;
      this.walkIndex++;
      if (beatIdx >= 0 && !this.dialogueSeen.has(`beat${beatIdx}`)) {
        this.dialogueSeen.add(`beat${beatIdx}`);
        const beat = WALK_BEATS[beatIdx];
        this.startDialogue({
          beat: { id: 'beat', speaker: beat.speaker, text: beat.text, end: true },
        }, 'beat', k);
      }
      this.save();
    }
  }

  /* ================= Main update ================= */
  private update(dt: number) {
    // Looping traffic always animates
    for (const c of this.build.refs.loopCars) {
      c.group.position.x += c.dir * c.speed * dt;
      if (c.group.position.x > c.maxX) c.group.position.x = c.minX;
      if (c.group.position.x < c.minX) c.group.position.x = c.maxX;
    }
    if (this.sedanActive) {
      const sedan = this.build.refs.sedan;
      sedan.position.x -= 6.2 * dt;
      if (!this.sedanToastDone && sedan.position.x < 4) {
        this.sedanToastDone = true;
        this.audio.tense();
        this.hud.toast('A black sedan slows as it passes the bank. Then it moves on.', 'red', 5200);
      }
      if (sedan.position.x < -105) {
        sedan.visible = false;
        this.sedanActive = false;
      }
    }

    if (!this.started || this.paused) { this.input.endFrame(); return; }

    // Clock
    this.clockMin += dt * 0.4;
    const hh = Math.floor(this.clockMin / 60) % 24;
    const mm = Math.floor(this.clockMin % 60);
    this.hud.setClock(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);

    // Dialogue
    if (this.dialogue.active && !this.dialogueSuspended) this.dialogue.update(dt);

    // Notebook / pause keys
    if (!this.dialogue.active && !this.terminal.open && !this.phoneOpen) {
      if (this.input.hit('Tab') && !this.cinematic) {
        if (this.notebook.open) {
          this.notebook.close();
          this.input.muted = false;
          this.player.setControl(true);
          this.ensureLocked();
        } else {
          this.input.releaseLock();
          this.input.muted = true;
          this.player.setControl(false);
          this.notebook.openUp();
        }
      }
    }
    if (this.notebook.open && this.input.hit('Escape')) {
      this.notebook.close();
      this.input.muted = false;
      this.player.setControl(true);
      this.ensureLocked();
    }
    if (this.terminal.open && this.input.hit('Escape')) {
      this.terminal.closeDown();
      this.input.muted = false;
      this.player.setControl(true);
      this.ensureLocked();
    }

    // Player + camera
    if (this.dialogue.active) this.input.muted = true;
    this.player.update(dt);
    this.player.applyCamera(this.engine.camera, dt);

    // NPCs
    this.npcs.rao.update(dt);
    this.npcs.meera.update(dt);
    this.npcs.naveen.update(dt);
    this.npcs.keerthy.update(dt);
    for (const p of this.npcs.peds) p.update(dt);

    // Walk logic
    if (this.phase === 'walk' && !this.flags.muralTalked) this.updateWalk(dt);
    else if (this.phase === 'walk' && this.flags.muralTalked && !this.flags.revealDone) {
      this.npcs.keerthy.lookAt(this.player.pos.clone().setY(this.npcs.keerthy.pos.y + 1.3));
    }

    // Triggers
    for (const t of this.cw.triggers) {
      if (!t.enabled || (t.once && t.fired)) continue;
      const d = this.cw.distanceXZ(this.player.pos.x, this.player.pos.z, t.x, t.z);
      if (d < t.radius) {
        t.fired = true;
        t.onEnter();
      }
    }

    // Interact scan
    if (!this.dialogue.active && !this.notebook.open && !this.terminal.open && !this.phoneOpen && !this.cinematic) {
      let best: string | null = null;
      let bestD = 1e9;
      for (const it of this.build.interactables) {
        const info = this.getInteractInfo(it.id);
        if (!info.enabled) continue;
        const d = this.cw.distanceXZ(this.player.pos.x, this.player.pos.z, it.x, it.z);
        if (d < it.radius && d < bestD) { bestD = d; best = it.id; }
      }
      if (best) {
        this.interactTarget = best;
        this.hud.showInteract(this.getInteractInfo(best).label);
        if (this.input.hit('KeyE')) this.doInteract(best);
      } else {
        this.interactTarget = null;
        this.hud.hideInteract();
      }
    } else {
      this.hud.hideInteract();
    }

    // Compass toward beacon
    if (this.beacon) {
      const dx = this.beacon[0] - this.player.pos.x;
      const dz = this.beacon[1] - this.player.pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 4) {
        const worldAng = Math.atan2(dx, dz);
        let rel = worldAng - this.player.camYaw + Math.PI;
        const deg = (rel * 180) / Math.PI - 90;
        this.hud.setCompass(deg, dist);
      } else {
        this.hud.setCompass(null);
      }
    } else {
      this.hud.setCompass(null);
    }

    this.input.endFrame();
  }
}
