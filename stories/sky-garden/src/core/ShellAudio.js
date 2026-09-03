// ShellAudio — synthesized ambience (wind + chimes + rain bus) with
// per-chapter mixes and narration ducking. Web Audio only; no samples.
export class ShellAudio {
  constructor() {
    this.enabled = false;
    this.paused = false;
    this.duck = false;
    this.chapter = 0;
    this.ctx = null;
    // [wind, chime, rain] per chapter
    this.mix = [
      [0.5, 0.2, 0.0], // I nursery — dry wind
      [0.45, 0.25, 0.05], // II first seed
      [0.8, 0.3, 0.0], // III wind maze — strong wind
      [0.5, 0.4, 0.35], // IV orchard — storm
      [0.3, 0.5, 0.05], // V sun terrace — dry shimmer
      [0.4, 0.3, 0.9] // VI rain returns
    ];
  }

  _init() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = (this.ctx = new Ctx());
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    // wind: filtered noise
    const noise = ctx.createBuffer(1, ctx.sampleRate * 2.5, ctx.sampleRate);
    const d = noise.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) { last = last * 0.97 + (Math.random() * 2 - 1) * 0.05; d[i] = last * 3; }
    this.windGain = ctx.createGain();
    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.value = 420;
    const ws = ctx.createBufferSource();
    ws.buffer = noise; ws.loop = true;
    ws.connect(this.windFilter).connect(this.windGain).connect(this.master);
    ws.start();
    this.rainGain = ctx.createGain();
    this.rainFilter = ctx.createBiquadFilter();
    this.rainFilter.type = 'bandpass';
    this.rainFilter.frequency.value = 1200;
    const rs = ctx.createBufferSource();
    rs.buffer = noise; rs.loop = true; rs.playbackRate.value = 1.2;
    rs.connect(this.rainFilter).connect(this.rainGain).connect(this.master);
    rs.start();
    // chimes bus
    this.chimeGain = ctx.createGain();
    this.chimeGain.connect(this.master);
    this._scheduleChime();
    this._applyMix();
  }

  _scheduleChime() {
    clearTimeout(this._chimeTimer);
    this._chimeTimer = setTimeout(() => {
      if (this.enabled && !this.paused && this.ctx && this.mix[this.chapter][1] > 0.05) {
        const notes = [392, 440, 523.3, 587.3, 659.3];
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = notes[Math.floor(Math.random() * notes.length)];
        const g = this.ctx.createGain();
        const t = this.ctx.currentTime;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.05 * this.mix[this.chapter][1] * 2, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
        osc.connect(g).connect(this.chimeGain);
        osc.start(t); osc.stop(t + 3.2);
      }
      this._scheduleChime();
    }, 4000 + Math.random() * 8000);
  }

  _target() {
    if (!this.enabled || this.paused) return 0;
    return this.duck ? 0.25 : 0.8;
  }

  _applyMix(tc = 1.6) {
    if (!this.ctx) return;
    const [w, c, r] = this.mix[this.chapter];
    const t = this.ctx.currentTime;
    this.windGain.gain.setTargetAtTime(0.18 * w, t, tc);
    this.rainGain.gain.setTargetAtTime(0.12 * r, t, tc);
    this.windFilter.frequency.setTargetAtTime(300 + w * 400, t, tc);
  }

  setChapter(i) { this.chapter = i; this._applyMix(); }
  setNarrationDuck(on) {
    this.duck = on;
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(this._target(), this.ctx.currentTime, 0.35);
  }
  setEnabled(on) {
    this.enabled = on;
    if (on && !this.ctx) this._init();
    if (!this.ctx) return;
    if (on) this.ctx.resume();
    this.master.gain.setTargetAtTime(this._target(), this.ctx.currentTime, 0.6);
  }
  setPaused(p) {
    this.paused = p;
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(this._target(), this.ctx.currentTime, 0.4);
  }
}
