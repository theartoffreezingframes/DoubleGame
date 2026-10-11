/** Akshay's notebook: clues, deduction connections, and Keerthy's page. */
import { EVIDENCE, DEDUCTIONS } from '../data/content.ts';
import type { InvestigationState } from '../systems/investigation.ts';
import {
  type RelationshipState, trustLabel, closenessLabel, suspicionLabel,
} from '../systems/relationship.ts';
import { AudioBus } from '../core/audio.ts';

const $ = (id: string) => document.getElementById(id)!;

export class NotebookUI {
  open = false;
  private selected: string[] = [];

  constructor(
    private audio: AudioBus,
    private getRel: () => RelationshipState,
    private getInv: () => InvestigationState,
    private onCombine: (a: string, b: string) => { ok: boolean; message: string },
  ) {
    document.querySelectorAll('.nb-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nb-tab').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = (btn as HTMLElement).dataset.tab!;
        $('nb-clues').classList.toggle('hidden', tab !== 'clues');
        $('nb-deduce').classList.toggle('hidden', tab !== 'deduce');
        $('nb-keerthy').classList.toggle('hidden', tab !== 'keerthy');
        this.audio.uiBlip();
      });
    });
    document.querySelector('[data-close="notebook"]')!.addEventListener('click', () => this.close());
  }

  toggle() {
    if (this.open) this.close();
    else this.openUp();
  }

  openUp() {
    this.selected = [];
    this.render();
    $('notebook').classList.remove('hidden');
    this.open = true;
    this.audio.uiBlip();
  }

  close() {
    $('notebook').classList.add('hidden');
    this.open = false;
  }

  private render() {
    this.renderClues();
    this.renderDeduce();
    this.renderKeerthy();
  }

  private renderClues() {
    const inv = this.getInv();
    const wrap = $('nb-clues');
    wrap.innerHTML = '';
    const items = [...inv.found].reverse();
    if (items.length === 0) {
      wrap.innerHTML = '<div class="empty-note">Nothing yet. The ledger keeps its secrets for now.</div>';
      return;
    }
    for (const id of items) {
      const ev = EVIDENCE[id];
      if (!ev) continue;
      const card = document.createElement('div');
      card.className = `clue-card ${ev.kind}`;
      card.innerHTML = `<h4>${ev.title}</h4><div class="clue-src">${kindLabel(ev.kind)} · ${ev.source}</div><p>${ev.body}</p>`;
      wrap.appendChild(card);
    }
  }

  private renderDeduce() {
    const inv = this.getInv();
    const wrap = $('nb-deduce');
    wrap.innerHTML = '';

    const known = [...inv.found, ...inv.deduced];
    if (known.length < 2) {
      wrap.innerHTML = '<div class="empty-note">Collect more clues, then connect two of them here. Deduction is a two-thread business.</div>';
      return;
    }

    // Made deductions
    for (const id of inv.deduced) {
      const d = DEDUCTIONS.find((x) => x.id === id);
      if (!d) continue;
      const el = document.createElement('div');
      el.className = 'dedu-result';
      el.innerHTML = `<h4>✦ ${d.title}</h4><p>${d.body}</p>`;
      wrap.appendChild(el);
    }

    const slot = document.createElement('div');
    slot.className = 'dedu-slot';
    const label = document.createElement('span');
    label.style.cssText = 'font-size:12px;color:#8f95a8;letter-spacing:1px;margin-right:4px;';
    label.textContent = 'CONNECT:';
    slot.appendChild(label);

    for (const id of known) {
      const title = EVIDENCE[id]?.title ?? DEDUCTIONS.find((d) => d.id === id)?.title ?? id;
      const chip = document.createElement('button');
      chip.className = 'dedu-chip' + (this.selected.includes(id) ? ' sel' : '');
      chip.textContent = title;
      chip.addEventListener('click', () => {
        if (this.selected.includes(id)) {
          this.selected = this.selected.filter((s) => s !== id);
        } else {
          if (this.selected.length >= 2) this.selected.shift();
          this.selected.push(id);
          this.audio.uiBlip();
        }
        this.renderDeduce();
      });
      slot.appendChild(chip);
    }

    const connect = document.createElement('button');
    connect.className = 'dedu-btn';
    connect.textContent = 'Connect ✦';
    connect.style.marginLeft = 'auto';
    connect.disabled = this.selected.length !== 2;
    connect.addEventListener('click', () => {
      if (this.selected.length !== 2) return;
      const res = this.onCombine(this.selected[0], this.selected[1]);
      this.selected = [];
      if (res.ok) this.audio.deduction();
      this.render();
    });
    slot.appendChild(connect);
    wrap.appendChild(slot);

    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:11px;color:#6f7688;margin-top:8px;font-style:italic;';
    hint.textContent = 'Select two known clues, then connect them. Wrong pairs waste nothing but pride.';
    wrap.appendChild(hint);
  }

  private renderKeerthy() {
    const r = this.getRel();
    const wrap = $('nb-keerthy');
    wrap.innerHTML = '';

    const meter = (label: string, val: number, cls: string, text: string, min = 0) => {
      const span = ((val - min) / (100 - min)) * 100;
      return `<div class="rel-meter"><div class="rel-label"><span>${label.toUpperCase()}</span><span>${text}</span></div>
        <div class="rel-bar"><div class="rel-fill ${cls}" style="width:${Math.max(2, Math.min(100, span))}%"></div></div></div>`;
    };

    wrap.innerHTML += meter('Trust', r.trust, 'trust', trustLabel(r.trust), -100);
    wrap.innerHTML += meter('Closeness', r.closeness, 'closeness', closenessLabel(r.closeness));
    wrap.innerHTML += meter('Suspicion', r.suspicion, 'suspicion', suspicionLabel(r.suspicion));

    const promises = r.promises.map(
      (p) => `<div class="promise ${p.status}">Promise — ${p.text}<span class="p-status">${p.status.toUpperCase()}</span></div>`,
    ).join('');
    if (promises) wrap.innerHTML += `<h4 style="margin:14px 0 6px;color:#f4d98a;font-size:12px;letter-spacing:2px;">PROMISES</h4>${promises}`;

    const mem = r.memories.length
      ? `<ul class="memory-list">${r.memories.map((m) => `<li>${m}</li>`).join('')}</ul>`
      : '<div class="empty-note">No shared memories yet. Give it a lunch break.</div>';
    wrap.innerHTML += `<h4 style="margin:14px 0 6px;color:#f4d98a;font-size:12px;letter-spacing:2px;">SHARED MEMORIES</h4>${mem}`;

    if (r.revelations.length) {
      wrap.innerHTML += `<h4 style="margin:14px 0 6px;color:#f4d98a;font-size:12px;letter-spacing:2px;">WHAT SHE KNOWS</h4>
        <ul class="memory-list">${r.revelations.map((m) => `<li>${m}</li>`).join('')}</ul>`;
    }
  }
}

function kindLabel(k: string): string {
  switch (k) {
    case 'record': return 'Confirmed record';
    case 'testimony': return 'Testimony (unverified)';
    case 'physical': return 'Physical evidence';
    case 'document': return 'Document';
    default: return 'Clue';
  }
}
