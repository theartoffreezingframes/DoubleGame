/**
 * Original procedural audio via Web Audio API — no external assets.
 * Ambient city pad, footsteps, UI feedback and small cinematic stingers.
 */

export class AudioBus {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private _muted = false;

  get muted() { return this._muted; }

  /** Must be called from a user gesture (button click). */
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
      this.startAmbience();
    } catch {
      this.ctx = null;
    }
  }

  setMuted(m: boolean) {
    this._muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.55, this.ctx.currentTime, 0.1);
    }
  }

  private startAmbience() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    this.ambienceGain = ctx.createGain();
    this.ambienceGain.gain.value = 0.05;
    this.ambienceGain.connect(this.master);

    // Low warm pad — two detuned triangles through a slow-breathing lowpass.
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    filter.Q.value = 0.6;
    filter.connect(this.ambienceGain);

    const freqs = [65.4, 98.0, 130.8]; // C2, G2, C3 — open, hopeful
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 2 ? 'sine' : 'triangle';
      osc.frequency.value = f;
      osc.detune.value = i * 4 - 4;
      const g = ctx.createGain();
      g.gain.value = 0.33;
      osc.connect(g);
      g.connect(filter);
      osc.start();
    });

    // Slow LFO on filter cutoff for "city breathing".
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 140;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    // Occasional distant horn: scheduled soft sine dips.
    const scheduleHorn = () => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + 14 + Math.random() * 22;
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(196, t);
      o.frequency.linearRampToValueAtTime(185, t + 1.4);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.015, t + 0.3);
      g.gain.linearRampToValueAtTime(0, t + 1.6);
      o.connect(g); g.connect(this.master!);
      o.start(t); o.stop(t + 1.8);
      setTimeout(scheduleHorn, (t - this.ctx.currentTime) * 1000);
    };
    scheduleHorn();
  }

  footstep(sprint: boolean) {
    if (!this.ctx || !this.master || this._muted) return;
    const ctx = this.ctx;
    const dur = 0.09;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.2);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = sprint ? 1000 : 700;
    const g = ctx.createGain();
    g.gain.value = sprint ? 0.16 : 0.1;
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start();
  }

  private tone(freq: number, dur: number, gain: number, type: OscillatorType = 'sine', when = 0) {
    if (!this.ctx || !this.master || this._muted) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  uiBlip() { this.tone(660, 0.08, 0.06, 'triangle'); }
  uiSelect() { this.tone(520, 0.1, 0.07, 'triangle'); this.tone(780, 0.12, 0.05, 'triangle', 0.06); }
  interact() { this.tone(880, 0.1, 0.06, 'sine'); }

  clueFound() {
    this.tone(523.25, 0.16, 0.08, 'sine');
    this.tone(783.99, 0.2, 0.08, 'sine', 0.12);
    this.tone(1046.5, 0.3, 0.07, 'sine', 0.24);
  }

  deduction() {
    [392, 493.88, 587.33, 783.99].forEach((f, i) => this.tone(f, 0.34, 0.07, 'sine', i * 0.11));
  }

  heartWarm() {
    this.tone(440, 0.2, 0.06, 'sine');
    this.tone(554.37, 0.26, 0.06, 'sine', 0.14);
    this.tone(659.25, 0.34, 0.05, 'sine', 0.28);
  }

  tense() {
    this.tone(110, 0.7, 0.09, 'sawtooth');
    this.tone(116.5, 0.7, 0.07, 'sawtooth', 0.05);
  }

  missionComplete() {
    const seq = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    seq.forEach((f, i) => this.tone(f, 0.32, 0.07, 'triangle', i * 0.16));
    this.tone(130.8, 1.4, 0.05, 'sine', 0);
  }

  phoneVibrate() { this.tone(220, 0.09, 0.09, 'square'); this.tone(220, 0.09, 0.09, 'square', 0.14); }
}
