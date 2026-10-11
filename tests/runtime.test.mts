/**
 * Headless runtime harness: boots the real Game in jsdom with a stubbed
 * WebGL context, then script-plays Mission 1 end-to-end via simulated
 * keyboard/click input. Catches runtime wiring errors that tsc cannot.
 *
 * Run: npm run test:runtime
 */
declare const process: { exit(code?: number): void };

import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) console.log(`  ✔ ${name}`);
  else { failures++; console.error(`  ✘ ${name} ${detail}`); }
}

/* ---------------- DOM + GL stubs ---------------- */
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  .replace(/<script[^>]*src="\/src\/main.ts"[^>]*><\/script>/, '');
const dom = new JSDOM(html, { url: 'http://localhost:5173/', pretendToBeVisual: false });
const w = dom.window as unknown as Record<string, unknown>;

function make2DStub(): Record<string, unknown> {
  const gradient = { addColorStop() {} };
  return new Proxy({}, {
    get(_t, prop: string) {
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient' || prop === 'createPattern') return () => gradient;
      if (prop === 'measureText') return () => ({ width: 10 });
      if (prop === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (prop === 'canvas') return null;
      return () => undefined;
    },
    set() { return true; },
  });
}

const GL_CONSTANTS: Record<string, number> = {
  VERSION: 0x1f02, SHADING_LANGUAGE_VERSION: 0x8b8c, VENDOR: 0x1f00, RENDERER: 0x1f01,
  MAX_TEXTURE_SIZE: 0x0d33, MAX_CUBE_MAP_TEXTURE_SIZE: 0x851c,
  MAX_TEXTURE_IMAGE_UNITS: 0x8872, MAX_VERTEX_TEXTURE_IMAGE_UNITS: 0x8b4c,
  MAX_COMBINED_TEXTURE_IMAGE_UNITS: 0x8b4d, MAX_VERTEX_ATTRIBS: 0x8869,
  MAX_VERTEX_UNIFORM_VECTORS: 0x8dfb, MAX_FRAGMENT_UNIFORM_VECTORS: 0x8dfd,
  MAX_VARYING_VECTORS: 0x8dfc, MAX_RENDERBUFFER_SIZE: 0x84e8,
  ALIASED_LINE_WIDTH_RANGE: 0x846e, ALIASED_POINT_SIZE_RANGE: 0x846d,
  MAX_SAMPLES: 0x8d57, MAX_COLOR_ATTACHMENTS: 0x8cdf, MAX_DRAW_BUFFERS: 0x8824,
  STENCIL_BITS: 0x0d57, DEPTH_BITS: 0x0d56,
  RED_BITS: 0x0d52, GREEN_BITS: 0x0d53, BLUE_BITS: 0x0d54, ALPHA_BITS: 0x0d55,
  SUBPIXEL_BITS: 0x0d50, MAX_VIEWPORT_DIMS: 0x0d3a,
  FRAMEBUFFER_BINDING: 0x8ca6, RENDERBUFFER_BINDING: 0x8ca7,
  TEXTURE_2D: 0x0de1, TEXTURE_CUBE_MAP: 0x8513, TEXTURE_3D: 0x806f, TEXTURE_2D_ARRAY: 0x8c1a,
  RGBA8: 0x8058, RGBA: 0x1908, UNSIGNED_BYTE: 0x1401, FLOAT: 0x1406,
  ARRAY_BUFFER: 0x8892, ELEMENT_ARRAY_BUFFER: 0x8893,
  COLOR_BUFFER_BIT: 0x4000, DEPTH_BUFFER_BIT: 0x0100, STENCIL_BUFFER_BIT: 0x0400,
  COMPILE_STATUS: 0x8b81, LINK_STATUS: 0x8b82,
  FRAMEBUFFER_COMPLETE: 0x8cd5,
};

function makeGLStub(canvas: unknown): Record<string, unknown> {
  const numeric: Record<string, number> = { drawingBufferWidth: 1280, drawingBufferHeight: 720 };
  return new Proxy({}, {
    get(_t, prop: string) {
      if (prop === 'canvas') return canvas;
      if (prop in numeric) return numeric[prop];
      if (prop in GL_CONSTANTS) return GL_CONSTANTS[prop];
      if (/^[A-Z][A-Z0-9_]*$/.test(prop)) return 0x9000 + ((prop.length * 31) % 500);
      switch (prop) {
        case 'getParameter':
          return (pname: number) => {
            if (pname === GL_CONSTANTS.VERSION) return 'WebGL 2.0 (headless-stub)';
            if (pname === GL_CONSTANTS.SHADING_LANGUAGE_VERSION) return 'WebGL GLSL ES 3.00 (headless-stub)';
            if (pname === GL_CONSTANTS.VENDOR) return 'Arena Headless';
            if (pname === GL_CONSTANTS.RENDERER) return 'Stub Renderer';
            if (pname === GL_CONSTANTS.ALIASED_LINE_WIDTH_RANGE || pname === GL_CONSTANTS.ALIASED_POINT_SIZE_RANGE) return new Float32Array([1, 512]);
            if (pname === GL_CONSTANTS.MAX_VIEWPORT_DIMS) return new Int32Array([16384, 16384]);
            if (pname === GL_CONSTANTS.STENCIL_BITS) return 8;
            if (pname === GL_CONSTANTS.DEPTH_BITS) return 24;
            if (pname === GL_CONSTANTS.RED_BITS || pname === GL_CONSTANTS.GREEN_BITS || pname === GL_CONSTANTS.BLUE_BITS || pname === GL_CONSTANTS.ALPHA_BITS) return 8;
            if (pname === GL_CONSTANTS.SUBPIXEL_BITS) return 4;
            if (pname === GL_CONSTANTS.MAX_SAMPLES) return 4;
            if (pname === GL_CONSTANTS.MAX_VERTEX_ATTRIBS) return 16;
            if (pname === GL_CONSTANTS.MAX_TEXTURE_IMAGE_UNITS) return 16;
            if (pname === GL_CONSTANTS.MAX_COMBINED_TEXTURE_IMAGE_UNITS) return 32;
            if (pname === GL_CONSTANTS.MAX_VERTEX_UNIFORM_VECTORS || pname === GL_CONSTANTS.MAX_FRAGMENT_UNIFORM_VECTORS) return 1024;
            if (pname === GL_CONSTANTS.MAX_VARYING_VECTORS) return 30;
            return 4096;
          };
        case 'getShaderParameter': case 'getProgramParameter': return () => true;
        case 'getExtension': return () => null;
        case 'getSupportedExtensions': return () => [];
        case 'getShaderInfoLog': case 'getProgramInfoLog': return () => '';
        case 'getShaderPrecisionFormat': return () => ({ rangeMin: 127, rangeMax: 127, precision: 23 });
        case 'getUniformLocation': return () => ({});
        case 'getAttribLocation': return () => 0;
        case 'getActiveUniform': return () => ({ name: 'stubUniform', size: 1, type: GL_CONSTANTS.FLOAT });
        case 'getActiveAttrib': return () => ({ name: 'stubAttrib', size: 1, type: GL_CONSTANTS.FLOAT });
        case 'getUniformBlockIndex': return () => 0;
        case 'getActiveUniformBlockParameter': return () => 0;
        case 'getActiveUniformBlockName': return () => 'stubBlock';
        case 'getTransformFeedbackVarying': return () => null;
        case 'getBufferParameter': return () => 0;
        case 'getTexParameter': return () => 0;
        case 'getInternalformatParameter': return () => [];
        case 'getSyncParameter': return () => 0;
        case 'clientWaitSync': return () => 0x911d;
        case 'getFragDataLocation': return () => 0;
        case 'getContextAttributes': return () => ({ alpha: true, antialias: true, depth: true, stencil: true, premultipliedAlpha: true, preserveDrawingBuffer: false });
        case 'isContextLost': return () => false;
        case 'checkFramebufferStatus': return () => GL_CONSTANTS.FRAMEBUFFER_COMPLETE;
        case 'createTexture': case 'createBuffer': case 'createProgram': case 'createShader':
        case 'createFramebuffer': case 'createRenderbuffer': case 'createVertexArray':
        case 'fenceSync': return () => ({});
        default: return () => undefined;
      }
    },
    set() { return true; },
  });
}

const canvasProto = w.HTMLCanvasElement as { prototype: { getContext: (t: string) => unknown } };
canvasProto.prototype.getContext = function (this: unknown, type: string) {
  if (type === '2d') return make2DStub();
  return makeGLStub(this);
};

// Globals expected by the game modules
const g = globalThis as Record<string, unknown>;
const defineGlobal = (key: string, value: unknown) => {
  try {
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  } catch {
    g[key] = value;
  }
};
defineGlobal('window', w);
defineGlobal('document', w.document);
defineGlobal('navigator', w.navigator);
defineGlobal('localStorage', w.localStorage);
defineGlobal('HTMLElement', w.HTMLElement);
defineGlobal('HTMLCanvasElement', w.HTMLCanvasElement);
defineGlobal('KeyboardEvent', w.KeyboardEvent);
defineGlobal('MouseEvent', w.MouseEvent);
defineGlobal('CustomEvent', w.CustomEvent);
defineGlobal('requestAnimationFrame', () => 0); // keep the engine's rAF loop inert; we step manually
defineGlobal('cancelAnimationFrame', () => {});
defineGlobal('devicePixelRatio', 1);
(w as Record<string, unknown>).devicePixelRatio = 1;
(w as Record<string, unknown>).requestAnimationFrame = () => 0;
(w as Record<string, unknown>).cancelAnimationFrame = () => {};

/* ---------------- Import game ---------------- */
const { Game } = await import('../src/game.ts');
const { readSave } = await import('../src/core/save.ts');

const canvas = w.document.getElementById('game-canvas') as HTMLElement & {
  requestPointerLock?: () => void;
};
canvas.requestPointerLock = () => undefined;

console.log('— boot —');
let game: InstanceType<typeof Game>;
try {
  game = new Game(canvas as never);
  check('Game constructor succeeds', true);
} catch (err) {
  check('Game constructor succeeds', false, String(err));
  console.error((err as Error).stack);
  process.exit(1);
}

const G = game as unknown as Record<string, never> & {
  phase: string;
  flags: Record<string, unknown>;
  rel: { trust: number; closeness: number; suspicion: number };
  inv: { found: string[]; deduced: string[] };
  missionComplete: boolean;
  started: boolean;
  player: { pos: { x: number; y: number; z: number }; teleport: (x: number, y: number, z: number, yaw?: number) => void };
  npcs: Record<string, unknown>;
  input: { keys: Set<string>; pointerLocked: boolean };
  update: (dt: number) => void;
  showMainMenu: () => void;
};

const doc = w.document as Document;

function frames(n: number, dt = 1 / 60) {
  for (let i = 0; i < n; i++) G.update(dt);
}
function keyDown(code: string) {
  w.dispatchEvent(new (w.KeyboardEvent as unknown as { new (t: string, o: object): KeyboardEvent })('keydown', { code }));
}
function keyUp(code: string) {
  w.dispatchEvent(new (w.KeyboardEvent as unknown as { new (t: string, o: object): KeyboardEvent })('keyup', { code }));
}
function tapKey(code: string, framesAfter = 3) {
  keyDown(code);
  frames(framesAfter);
  keyUp(code);
  frames(2);
}
function click(el: Element | null) {
  if (!el) throw new Error('element not found for click');
  el.dispatchEvent(new (w.MouseEvent as unknown as { new (t: string, o: object): MouseEvent })('mousedown', { bubbles: true }));
  el.dispatchEvent(new (w.MouseEvent as unknown as { new (t: string, o: object): MouseEvent })('click', { bubbles: true }));
}

/* ---------------- Title → intro → play ---------------- */
console.log('— title & intro —');
game.showMainMenu();
check('title menu rendered', !!doc.querySelector('#btn-new'));
click(doc.querySelector('#btn-new'));
check('intro card shown', doc.querySelector('#menu')!.textContent!.includes('Janapriya Bank'));
for (let i = 0; i < 4; i++) {
  const next = doc.querySelector('#btn-next');
  if (!next) break;
  click(next);
  frames(2);
}
check('play started after intro', G.started === true);
check('phase is commute', G.phase === 'commute', `got ${G.phase}`);

/* ---------------- Movement helper (camera yaw fixed at 3π/2 → W=+x, A=-z) ---------------- */
/* ---- Pathfinding over the real collision boxes ---- */
interface Box { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number; ghost?: boolean; }
const boxes: Box[] = (game as unknown as { cw: { boxes: Box[] } }).cw.boxes;

const GRID = { minX: -60, maxX: 70, minZ: -10, maxZ: 26, step: 0.5 };
const RADIUS = 0.4;
const NX = Math.round((GRID.maxX - GRID.minX) / GRID.step);
const NZ = Math.round((GRID.maxZ - GRID.minZ) / GRID.step);

function cellBlocked(cx: number, cz: number): boolean {
  const x = GRID.minX + cx * GRID.step;
  const z = GRID.minZ + cz * GRID.step;
  for (const b of boxes) {
    if (b.ghost) continue;
    if ((b.maxY - b.minY) <= 0.4) continue; // step-up-able (sidewalks, curbs)
    if (b.minY > 1.4) continue; // floating above head height (lintels, roofs, awnings)
    if (x + RADIUS > b.minX && x - RADIUS < b.maxX && z + RADIUS > b.minZ && z - RADIUS < b.maxZ) return true;
  }
  return false;
}

function findPath(sx: number, sz: number, tx: number, tz: number): Array<[number, number]> | null {
  const sc = [Math.round((sx - GRID.minX) / GRID.step), Math.round((sz - GRID.minZ) / GRID.step)];
  const tc = [Math.round((tx - GRID.minX) / GRID.step), Math.round((tz - GRID.minZ) / GRID.step)];
  const clampC = (c: number[], ): void => { c[0] = Math.max(0, Math.min(NX - 1, c[0])); c[1] = Math.max(0, Math.min(NZ - 1, c[1])); };
  clampC(sc); clampC(tc);
  // If target cell blocked, search nearest free neighbor
  let target = tc;
  if (cellBlocked(tc[0], tc[1])) {
    let best: [number, number] | null = null; let bd = 1e9;
    for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
      const nx = tc[0] + dx, nz = tc[1] + dz;
      if (nx < 0 || nz < 0 || nx >= NX || nz >= NZ) continue;
      if (!cellBlocked(nx, nz)) {
        const d = dx * dx + dz * dz;
        if (d < bd) { bd = d; best = [nx, nz]; }
      }
    }
    if (!best) return null;
    target = best;
  }
  const start = sc;
  if (cellBlocked(start[0], start[1])) {
    // nudge start to nearest free cell
    let best: [number, number] | null = null; let bd = 1e9;
    for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
      const nx = start[0] + dx, nz = start[1] + dz;
      if (nx < 0 || nz < 0 || nx >= NX || nz >= NZ) continue;
      if (!cellBlocked(nx, nz)) { const d = dx * dx + dz * dz; if (d < bd) { bd = d; best = [nx, nz]; } }
    }
    if (!best) return null;
    start[0] = best[0]; start[1] = best[1];
  }
  const key = (x: number, z: number) => x * 100000 + z;
  const prev = new Map<number, number>();
  const q: Array<[number, number]> = [[start[0], start[1]]];
  const seen = new Set<number>([key(start[0], start[1])]);
  let found = false;
  while (q.length) {
    const [x, z] = q.shift()!;
    if (x === target[0] && z === target[1]) { found = true; break; }
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx, nz = z + dz;
      if (nx < 0 || nz < 0 || nx >= NX || nz >= NZ) continue;
      const k = key(nx, nz);
      if (seen.has(k)) continue;
      if (cellBlocked(nx, nz)) continue;
      seen.add(k); prev.set(k, key(x, z));
      q.push([nx, nz]);
    }
  }
  if (!found) return null;
  const path: Array<[number, number]> = [];
  let cur = key(target[0], target[1]);
  const startKey = key(start[0], start[1]);
  while (cur !== startKey) {
    const x = Math.floor(cur / 100000), z = cur % 100000;
    path.push([GRID.minX + x * GRID.step, GRID.minZ + z * GRID.step]);
    const p = prev.get(cur);
    if (p === undefined) break;
    cur = p;
  }
  path.reverse();
  return path;
}

const ALL_MOVE_KEYS = ['KeyW', 'KeyS', 'KeyA', 'KeyD'];
function releaseMoveKeys() { ALL_MOVE_KEYS.forEach(keyUp); }

/** Smooth steering: hold keys until the axis error flips, like a human would. */
function steerTo(tx: number, tz: number, budgetFrames = 6000): boolean {
  let heldX: string | null = null;
  let heldZ: string | null = null;
  let bestDist = Infinity, noImprove = 0;
  for (let i = 0; i < budgetFrames; i++) {
    const p = G.player.pos;
    const dx = tx - p.x, dz = tz - p.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.7) { releaseMoveKeys(); return true; }
    if (dialogueActive()) {
      // The mural conversation (has a phone interlude) is owned by the main flow — yield.
      if (G.flags.muralTalked) { releaseMoveKeys(); return true; }
      releaseMoveKeys(); heldX = heldZ = null; advanceDialogue(); frames(3); noImprove = 0; bestDist = Math.min(bestDist, dist); continue;
    }
    // stuck-recovery: no distance improvement for a long time → back off briefly
    if (dist < bestDist - 0.02) { bestDist = dist; noImprove = 0; } else { noImprove += 2; }
    if (noImprove > 500) {
      releaseMoveKeys(); heldX = heldZ = null;
      keyDown(dx > 0 ? 'KeyS' : 'KeyW'); frames(25); keyUp('KeyS'); keyUp('KeyW');
      noImprove = 0; bestDist = Infinity;
    }
    const wantX = Math.abs(dx) > 0.18 ? (dx > 0 ? 'KeyW' : 'KeyS') : null;
    const wantZ = Math.abs(dz) > 0.18 ? (dz < 0 ? 'KeyA' : 'KeyD') : null;
    if (wantX !== heldX) { if (heldX) keyUp(heldX); if (wantX) keyDown(wantX); heldX = wantX; }
    if (wantZ !== heldZ) { if (heldZ) keyUp(heldZ); if (wantZ) keyDown(wantZ); heldZ = wantZ; }
    frames(2);
  }
  releaseMoveKeys();
  return false;
}

function navigateTo(tx: number, tz: number, label = ''): boolean {
  const p = G.player.pos;
  const path = findPath(p.x, p.z, tx, tz);
  if (!path) { console.log(`    [nav ${label}] no path from (${p.x.toFixed(1)},${p.z.toFixed(1)}) to (${tx},${tz})`); return false; }
  for (const [wx, wz] of path) {
    if (!steerTo(wx, wz, 2500)) { console.log(`    [nav ${label}] stuck at (${G.player.pos.x.toFixed(1)},${G.player.pos.z.toFixed(1)}) heading (${wx.toFixed(1)},${wz.toFixed(1)})`); return false; }
    if (dialogueActive()) advanceDialogue();
  }
  frames(5);
  return true;
}

function dialogueActive(): boolean {
  return !(doc.getElementById('dialogue') as HTMLElement).classList.contains('hidden');
}

function advanceDialogue(maxSteps = 60): void {
  for (let i = 0; i < maxSteps; i++) {
    if (!dialogueActive()) return;
    const choices = doc.querySelectorAll('#dialogue-choices .dlg-choice');
    if (choices.length > 0) {
      tapKey('Digit1', 4);
      frames(4);
      continue;
    }
    tapKey('KeyE', 4);
    frames(4);
  }
}

/* ---------------- Commute → bank ---------------- */
console.log('— commute —');
check('walk to bank door', navigateTo(0, 9.0, 'door'), 'player could not reach the bank door');
check('walk into banking hall', navigateTo(0, 13.0, 'hall'), 'player could not enter the bank');
frames(10);
check('phase advanced to checkin', G.phase === 'checkin', `got ${G.phase}`);

/* ---------------- Rao ---------------- */
console.log('— check in with Rao —');
check('walk to cabin', navigateTo(10.2, 20.8, 'cabin'), 'could not reach Rao’s cabin door');
tapKey('KeyE', 5);
check('Rao dialogue opened', dialogueActive());
advanceDialogue();
check('Rao dialogue completed → desk phase', G.phase === 'desk', `got ${G.phase}`);

/* ---------------- Terminal ---------------- */
console.log('— terminal investigation —');
check('walk to desk', navigateTo(3.5, 16.6, 'desk'), 'could not reach desk');
tapKey('KeyE', 5);
const termPanel = doc.querySelector('#terminal .terminal-panel');
check('terminal opened', !!termPanel);
// inspect the three suspicious rows + the locked row
const rows = doc.querySelectorAll('#terminal .term-row');
check('terminal rendered 8 rows', rows.length === 8, `got ${rows.length}`);
(rows[2] as HTMLElement).click(); frames(2);
(rows[3] as HTMLElement).click(); frames(2);
(rows[4] as HTMLElement).click(); frames(2);
(rows[7] as HTMLElement).click(); frames(2);
const reportBtn = doc.querySelector('#term-report') as HTMLButtonElement;
check('report button unlocked after inspecting anomalies', reportBtn.disabled === false);
reportBtn.click(); frames(5);
check('E1 + E5 discovered', G.inv.found.includes('E1') && G.inv.found.includes('E5'));
check('phase → meera', G.phase === 'meera', `got ${G.phase}`);

/* ---------------- Optional physical evidence: the slip ---------------- */
tapKey('Tab', 3); // open notebook once to prove it works
check('notebook opens', !(doc.getElementById('notebook') as HTMLElement).classList.contains('hidden'));
tapKey('Tab', 3);
check('notebook closes', (doc.getElementById('notebook') as HTMLElement).classList.contains('hidden'));

check('walk to printer', navigateTo(-1.5, 14.9, 'printer'), 'could not reach printer');
tapKey('KeyE', 5);
const evView = doc.getElementById('evidence-view') as HTMLElement;
check('slip viewer opened', !evView.classList.contains('hidden'));
click(evView.querySelector('#ev-close'));
frames(5);
check('E1B discovered', G.inv.found.includes('E1B'));

/* ---------------- Meera ---------------- */
console.log('— Meera —');
check('walk to Meera', navigateTo(-6.5, 12.4, 'meera'), 'could not reach Meera');
tapKey('KeyE', 5);
check('Meera dialogue opened', dialogueActive());
advanceDialogue();
check('E2 discovered', G.inv.found.includes('E2'));
check('phase → naveen', G.phase === 'naveen', `got ${G.phase}`);

/* ---------------- Naveen ---------------- */
console.log('— Naveen —');
check('walk to Naveen', navigateTo(-10.4, 20.2, 'naveen'), 'could not reach Naveen');
tapKey('KeyE', 5);
check('Naveen dialogue opened', dialogueActive());
advanceDialogue();
check('E3 discovered', G.inv.found.includes('E3'));
check('phase → lunch', G.phase === 'lunch', `got ${G.phase}`);

/* ---------------- Lunch → Keerthy ---------------- */
console.log('— lunch & Keerthy —');
check('walk to café', navigateTo(31, 8.6, 'cafe'), 'could not reach the café');
frames(10);
check('cafe arrival → keerthy phase', G.phase === 'keerthy', `got ${G.phase}`);
check('walk to Keerthy’s table', navigateTo(33, 10.4, 'keerthy'), 'could not reach Keerthy');
tapKey('KeyE', 5);
check('Keerthy dialogue opened', dialogueActive());
advanceDialogue(80);
check('Keerthy intro completed → walk phase', G.phase === 'walk', `got ${G.phase}`);
check('opener flag set', typeof G.flags.opener === 'string');
check('honesty flag = honest (picked choice 1)', G.flags.honesty === 'honest', `got ${String(G.flags.honesty)}`);
check('exhibition promise made', G.flags.exhibition === 'promise', `got ${String(G.flags.exhibition)}`);
check('rel trust grew', G.rel.trust > 0, `trust=${G.rel.trust}`);

/* ---------------- Walk beats to the mural ---------------- */
console.log('— the walk —');
// Follow Keerthy's route. She leads; beat dialogues and (eventually) the mural
// conversation interrupt the walk — interruption by the mural conversation IS success.
const waypoints = [
  [35.5, 9.2], [41, 8.6], [46.5, 9.2], [51, 13.2], [56, 13.8], [61, 12.6], [63.8, 10.6],
];
let muralStartedEarly = false;
for (let wi = 0; wi < waypoints.length; wi++) {
  if (dialogueActive() && G.flags.muralTalked) { muralStartedEarly = true; break; }
  const [wx, wz] = waypoints[wi];
  navigateTo(wx, wz, 'wp' + wi); // may be cut short by the mural conversation starting
  frames(10);
}
// Close any remaining beat dialogue, then get to the mural if not already there
if (!dialogueActive() && !G.flags.muralTalked) {
  navigateTo(63.5, 10.4, 'mural');
}
// Wait for the mural conversation (needs player within 4.2m of Keerthy)
let muralTries = 0;
while (!dialogueActive() && muralTries < 40) {
  if (!G.flags.muralTalked) navigateTo(63.8, 10.6, 'mural2');
  frames(20);
  muralTries++;
}
check('mural conversation opened', dialogueActive() || G.flags.muralTalked === true);

/* ---------------- Mural conversation with phone interlude ---------------- */
advanceDialogue(20);
// phone overlay for the Kaveri cancellation appears mid-dialogue
let phoneTries = 0;
while ((doc.getElementById('phone') as HTMLElement).classList.contains('hidden') && phoneTries < 40 && dialogueActive()) {
  tapKey('KeyE', 4);
  frames(10);
  phoneTries++;
}
const phoneEl = doc.getElementById('phone') as HTMLElement;
if (!phoneEl.classList.contains('hidden')) {
  check('kaveri-cancel phone shown', true);
  await sleep(4800); // let messages stream in
  const okBtn = doc.getElementById('phone-ok') as HTMLButtonElement;
  okBtn.click();
  frames(5);
} else {
  check('kaveri-cancel phone shown', false, 'phone never appeared');
}
advanceDialogue(30);
check('E4 discovered', G.inv.found.includes('E4'));
check('told Keerthy (choice 1)', G.flags.toldKeerthy === true, `got ${String(G.flags.toldKeerthy)}`);
check('phase → return', G.phase === 'return', `got ${G.phase}`);

/* ---------------- Deduction in the notebook ---------------- */
console.log('— deductions —');
tapKey('Tab', 3);
// select E1 + E3 and connect → D1
const clueChips = () => Array.from(doc.querySelectorAll('#nb-deduce .dedu-chip')) as HTMLElement[];
const clickChip = (title: string) => {
  const chip = clueChips().find((c) => c.textContent!.includes(title));
  if (!chip) throw new Error(`chip not found: ${title}`);
  chip.click();
  frames(2);
};
clickChip('₹49,900'); // E1
clickChip('Missing Logs'); // E3
const connectBtn = doc.querySelector('#nb-deduce .dedu-btn') as HTMLButtonElement;
check('connect enabled', connectBtn.disabled === false);
connectBtn.click(); frames(5);
check('D1 deduced', G.inv.deduced.includes('D1'));
clickChip('Blind Window'); // D1
clickChip('Matching Amount'); // E4
const connectBtn2 = doc.querySelector('#nb-deduce .dedu-btn') as HTMLButtonElement;
connectBtn2.click(); frames(5);
check('D2 deduced', G.inv.deduced.includes('D2'));
tapKey('Tab', 3);

/* ---------------- Return & hook cinematic ---------------- */
console.log('— hook cinematic —');
// Hook trigger sits at (0,12.8) r3.6 — approach the entrance. The cinematic locks
// controls the moment it fires, so assert on game state, not bot arrival.
navigateTo(0, 9.6, 'return');
frames(30);
let hookTries = 0;
while (G.flags.hookDone !== true && hookTries < 30) {
  const p = G.player.pos;
  const d = Math.hypot(p.x - 0, p.z - 12.8);
  if (d > 3.4) navigateTo(0, 9.4, 'return2');
  frames(20);
  hookTries++;
}
check('hook cinematic fired', G.flags.hookDone === true);
// phones: naveen-warning → compliance → keerthy-honest
for (let i = 0; i < 3; i++) {
  let tries = 0;
  while ((doc.getElementById('phone') as HTMLElement).classList.contains('hidden') && tries < 30) {
    frames(10);
    tries++;
  }
  if ((doc.getElementById('phone') as HTMLElement).classList.contains('hidden')) break;
  await sleep(4800);
  (doc.getElementById('phone-ok') as HTMLButtonElement).click();
  frames(5);
}
check('E6 discovered (honest path)', G.inv.found.includes('E6'));
check('mission card shown', !(doc.getElementById('mission-card') as HTMLElement).classList.contains('hidden'));
check('mission complete flag', G.missionComplete === true);
click(doc.getElementById('card-continue'));
frames(5);
check('phase → done', G.phase === 'done', `got ${G.phase}`);

/* ---------------- Save / resume ---------------- */
console.log('— save & resume —');
const save = readSave();
check('save exists', !!save);
check('save phase is done', save?.phase === 'done');
check('save carries trust', (save?.rel.trust ?? 0) > 0);
check('save carries deductions', (save?.inv.deduced ?? []).includes('D2'));
check('save carries promise', (save?.rel.promises ?? []).some((p) => p.id === 'exhibition' && p.status === 'pending'));

// Simulate a fresh boot resuming from the save (title → Continue)
const savedPos = { x: G.player.pos.x, z: G.player.pos.z };
(game as unknown as { toTitle: () => void }).toTitle();
frames(3);
check('returned to title', !!(doc.querySelector('#btn-continue')));
click(doc.querySelector('#btn-continue'));
frames(10);
check('resume restores phase', G.phase === 'done', `got ${G.phase}`);
check('resume restores trust', G.rel.trust === save?.rel.trust);
check('resume restores deductions', G.inv.deduced.includes('D1') && G.inv.deduced.includes('D2'));
check('resume restores player position', Math.abs(G.player.pos.x - savedPos.x) < 0.01 && Math.abs(G.player.pos.z - savedPos.z) < 0.01);
check('resume keeps mission complete', G.missionComplete === true);

console.log('— final state —');
console.log(`  trust=${G.rel.trust} closeness=${G.rel.closeness} suspicion=${G.rel.suspicion}`);
console.log(`  clues: ${G.inv.found.join(', ')}`);
console.log(`  deductions: ${G.inv.deduced.join(', ')}`);

if (failures > 0) {
  console.error(`\n${failures} runtime check(s) FAILED`);
  process.exit(1);
}
console.log('\nRuntime playthrough PASSED ✓');
process.exit(0);
