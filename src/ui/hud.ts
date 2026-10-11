/** HUD: objectives, clock, interact prompt, toasts, letterbox, fade. */

const $ = (id: string) => document.getElementById(id)!;

export class Hud {
  private objective = $('objective-text');
  private objectiveSub = $('objective-sub');
  private clock = $('clock-text');
  private prompt = $('interact-prompt');
  private promptLabel = $('interact-label');
  private toasts = $('toast-wrap');
  private compass = $('compass');
  private compassArrow = $('compass-arrow');
  private compassDist = $('compass-dist');

  show(on: boolean) {
    $('hud').classList.toggle('hidden', !on);
  }

  setObjective(text: string, sub?: string) {
    this.objective.textContent = text;
    if (sub) {
      this.objectiveSub.textContent = sub;
      this.objectiveSub.classList.remove('hidden');
    } else {
      this.objectiveSub.classList.add('hidden');
    }
  }

  setClock(text: string) {
    this.clock.textContent = text;
  }

  showInteract(label: string) {
    this.promptLabel.textContent = label;
    this.prompt.classList.remove('hidden');
  }
  hideInteract() {
    this.prompt.classList.add('hidden');
  }

  toast(text: string, tone: 'teal' | 'gold' | 'red' = 'teal', ms = 4200) {
    const el = document.createElement('div');
    el.className = `toast ${tone}`;
    el.textContent = text;
    this.toasts.appendChild(el);
    setTimeout(() => el.classList.add('fadeout'), ms - 600);
    setTimeout(() => el.remove(), ms);
    // Cap visible toasts
    while (this.toasts.children.length > 4) this.toasts.firstChild?.remove();
  }

  setCompass(angleDeg: number | null, distM?: number) {
    if (angleDeg === null) {
      this.compass.classList.add('hidden');
      return;
    }
    this.compass.classList.remove('hidden');
    this.compassArrow.style.transform = `rotate(${angleDeg}deg)`;
    this.compassDist.textContent = distM !== undefined ? `${Math.round(distM)}m` : '';
  }

  letterbox(on: boolean) {
    $('letterbox').classList.toggle('active', on);
  }

  fade(toBlack: boolean) {
    $('fade').classList.toggle('black', toBlack);
  }

  hideClickToPlay() { $('click-to-play').classList.add('hidden'); }
  showClickToPlay(onClick: () => void) {
    const el = $('click-to-play');
    el.classList.remove('hidden');
    const handler = () => { el.removeEventListener('click', handler); onClick(); };
    el.addEventListener('click', handler);
  }
}
