/** Phone overlay, mission-complete card, paper evidence viewer. */
import type { PhoneScript } from '../data/mission1.ts';
import type { EvidenceDef } from '../systems/investigation.ts';

const $ = (id: string) => document.getElementById(id)!;

export function showPhone(script: PhoneScript, onDone: () => void) {
  const overlay = $('phone');
  overlay.classList.remove('hidden');
  $('phone-from').textContent = script.from;
  $('phone-time').textContent = script.time;
  const body = $('phone-body');
  body.innerHTML = '';
  const okBtn = $('phone-ok');
  okBtn.style.visibility = 'hidden';

  script.messages.forEach((m, i) => {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'phone-msg' + (m.sys ? ' sys' : '');
      el.textContent = m.text;
      body.appendChild(el);
      body.scrollTop = body.scrollHeight;
      if (i === script.messages.length - 1) okBtn.style.visibility = 'visible';
    }, 500 + i * 950);
  });

  const handler = () => {
    okBtn.removeEventListener('click', handler);
    overlay.classList.add('hidden');
    onDone();
  };
  okBtn.addEventListener('click', handler);
}

export interface MissionCardStats {
  trust: string;
  closeness: string;
  clues: string;
  deductions: string;
  promise: string;
}

export function showMissionCard(stats: MissionCardStats, onContinue: () => void, onQuit: () => void) {
  const wrap = $('mission-card');
  wrap.classList.remove('hidden');
  wrap.innerHTML = `
    <div class="overlay-panel card-panel">
      <div class="card-kicker">MISSION COMPLETE</div>
      <div class="card-title">MONDAY MORNING</div>
      <div class="card-sub">One man. Two ledgers. A very specific number.</div>
      <div class="card-stats">
        <div class="card-stat"><div class="v">${stats.clues}</div><div class="k">CLUES FOUND</div></div>
        <div class="card-stat"><div class="v">${stats.deductions}</div><div class="k">DEDUCTIONS</div></div>
        <div class="card-stat"><div class="v">${stats.trust}</div><div class="k">KEERTHY: TRUST</div></div>
        <div class="card-stat"><div class="v">${stats.closeness}</div><div class="k">KEERTHY: CLOSENESS</div></div>
        <div class="card-stat"><div class="v">${stats.promise}</div><div class="k">FRIDAY</div></div>
      </div>
      <div class="card-btns">
        <button id="card-continue" class="big-btn">KEEP EXPLORING</button>
        <button id="card-quit" class="big-btn ghost">SAVE & TITLE</button>
      </div>
      <div style="margin-top:22px;font-size:12px;color:#8f95a8;">NEXT — MISSION 2: THE MISSING AMOUNT</div>
    </div>`;
  wrap.querySelector('#card-continue')!.addEventListener('click', onContinue);
  wrap.querySelector('#card-quit')!.addEventListener('click', onQuit);
}

export function hideMissionCard() {
  $('mission-card').classList.add('hidden');
}

/** Paper-style evidence viewer (remittance slips, payment orders). */
export function showEvidencePaper(def: EvidenceDef, rows: Array<[string, string]>, stamp: string, onDone: () => void) {
  const wrap = $('evidence-view');
  wrap.classList.remove('hidden');
  wrap.innerHTML = `
    <div class="overlay-panel evidence-card">
      <h3>${def.title.toUpperCase()}</h3>
      <table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>
      <div style="margin-top:16px"><span class="evidence-stamp">${stamp}</span></div>
      <div class="evidence-close"><button id="ev-close" class="term-btn">Put it back</button></div>
    </div>`;
  wrap.querySelector('#ev-close')!.addEventListener('click', () => {
    wrap.classList.add('hidden');
    onDone();
  });
}
