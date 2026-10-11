/** Title, intro cards and pause menus. */

const $ = (id: string) => document.getElementById(id)!;

export interface TitleOptions {
  hasSave: boolean;
  saveInfo?: string;
  onNew: () => void;
  onContinue: () => void;
}

export function showTitle(opts: TitleOptions) {
  const menu = $('menu');
  menu.classList.remove('hidden');
  menu.innerHTML = `
    <div class="menu-inner">
      <div class="menu-city">HYDERABAD · STREET ONE · 9:02 AM</div>
      <div class="menu-title">DOUBLE<span>GAME</span></div>
      <div class="menu-tag">One man. Two identities. A billion-rupee secret.</div>
      <div class="menu-btns">
        <button id="btn-new" class="menu-btn">NEW GAME — MISSION 1: MONDAY MORNING</button>
        ${opts.hasSave ? `<button id="btn-continue" class="menu-btn">CONTINUE${opts.saveInfo ? ` — ${opts.saveInfo}` : ''}</button>` : ''}
      </div>
      <div class="menu-controls">
        <b>WASD</b> move · <b>Mouse</b> camera (drag if pointer-lock unavailable) · <b>Shift</b> sprint · <b>Space</b> jump · <b>E</b> interact<br>
        <b>Tab</b> notebook &amp; clue board · <b>1–3</b> dialogue choices · <b>Esc</b> pause
      </div>
      <div class="menu-note">MILESTONE 1 VERTICAL SLICE · ORIGINAL FICTIONAL CITY · KEYBOARD + MOUSE</div>
    </div>`;
  menu.querySelector('#btn-new')!.addEventListener('click', opts.onNew);
  menu.querySelector('#btn-continue')?.addEventListener('click', opts.onContinue);
}

const INTRO_LINES = [
  '<strong>Janapriya Bank</strong>, Street One. Monday, 9:02 a.m.<br><strong>Akshay</strong> — sharp-eyed, ambitious, allergic to rounding errors — is about to have a very ordinary morning.',
  'Except that Friday’s reconciliation queue contains a number that shouldn’t exist. Three times. Under the threshold. In the dark.',
  'And at the chai place next door, a woman with a sketchbook is about to make Mondays complicated in an entirely different way.',
  '<strong>DOUBLE GAME</strong> — a story about money, masks, and who gets counted.',
];

export function showIntro(onDone: () => void) {
  const menu = $('menu');
  menu.classList.remove('hidden');
  let idx = 0;
  const render = () => {
    menu.innerHTML = `
      <div class="menu-inner">
        <div class="intro-line">${INTRO_LINES[idx]}</div>
        <div class="menu-btns">
          ${idx < INTRO_LINES.length - 1
            ? '<button id="btn-next" class="menu-btn">CONTINUE</button>'
            : '<button id="btn-next" class="menu-btn">BEGIN THE MORNING</button>'}
          <button id="btn-skip" class="menu-btn ghost intro-skip">SKIP INTRO</button>
        </div>
        <div style="font-size:11px;color:#525b76;">${idx + 1} / ${INTRO_LINES.length}</div>
      </div>`;
    menu.querySelector('#btn-next')!.addEventListener('click', () => {
      idx += 1;
      if (idx >= INTRO_LINES.length) onDone();
      else render();
    });
    menu.querySelector('#btn-skip')!.addEventListener('click', onDone);
  };
  render();
}

export function hideMenu() {
  $('menu').classList.add('hidden');
  $('menu').innerHTML = '';
}

export interface PauseOptions {
  muted: boolean;
  onResume: () => void;
  onSave: () => void;
  onToggleMute: () => void;
  onQuit: () => void;
}

export function showPause(opts: PauseOptions) {
  const menu = $('menu');
  menu.classList.remove('hidden');
  menu.innerHTML = `
    <div class="menu-inner">
      <div class="menu-title" style="font-size:38px;">PAUSED</div>
      <div class="pause-sub">The city waits. The ledger doesn’t care.</div>
      <div class="checkline"><input type="checkbox" id="chk-mute" ${opts.muted ? 'checked' : ''}><label for="chk-mute">Mute audio</label></div>
      <div class="menu-btns">
        <button id="p-resume" class="menu-btn">RESUME</button>
        <button id="p-save" class="menu-btn ghost">SAVE PROGRESS</button>
        <button id="p-quit" class="menu-btn ghost">SAVE & TITLE</button>
      </div>
      <div class="menu-controls">
        <b>WASD</b> move · <b>Mouse</b> camera (drag if pointer-lock unavailable) · <b>Shift</b> sprint · <b>Space</b> jump · <b>E</b> interact<br>
        <b>Tab</b> notebook &amp; clue board · <b>1–3</b> dialogue choices · <b>Esc</b> pause
      </div>
    </div>`;
  menu.querySelector('#p-resume')!.addEventListener('click', opts.onResume);
  menu.querySelector('#p-save')!.addEventListener('click', opts.onSave);
  menu.querySelector('#p-quit')!.addEventListener('click', opts.onQuit);
  menu.querySelector('#chk-mute')!.addEventListener('change', opts.onToggleMute);
}
