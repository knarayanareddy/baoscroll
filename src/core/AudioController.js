// Procedural ambience for a coast — zero audio files needed.
//   wind  : looped filtered noise, LFO on the filter for gusts
//   water : band-passed noise; surf when open, muffled when submerged
//   bell  : a bell buoy out in the channel, struck by the swell
//
// PRODUCTION ASSET NOTE: to replace with recorded ambience, drop
// looping OGG/M4A stems (44.1kHz, -18 LUFS) into /public/audio
// (wind.ogg, surf.ogg, buoy.ogg) and load them here into the same
// gain nodes; every important cue also has a visual equivalent on
// screen, so audio stays optional.
//
// Starts muted — browsers require a user gesture, and the story reads
// fully without sound.

const CHAPTER_MIX = [
  // [wind, water, bell, filterHz]
  [0.35, 0.5, 0.8, 520], // I   harbour at dusk — lapping, a buoy far out
  [0.5, 0.22, 0.35, 300], // II  lantern room — weather heard through glass
  [1.0, 1.0, 0.15, 220], // III storm wall — the buoy is drowned out
  [0.05, 0.7, 0.5, 170], // IV  underwater — no air, everything low-passed
  [0.75, 0.5, 0.9, 420], // V   the lamp — the bell finds its voice again
  [0.3, 0.45, 1.0, 660] // VI  morning — open, bright, and moving
];

export class AudioController {
  constructor() {
    this.enabled = false;
    this.paused = false;
    this.chapter = 0;
    this.ctx = null;
    this._chimeTimer = null;
  }

  _init() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = (this.ctx = new Ctx());

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    const noiseBuffer = this._noise(ctx, 2.5);

    // wind
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0.16;
    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.value = 420;
    const windSrc = ctx.createBufferSource();
    windSrc.buffer = noiseBuffer;
    windSrc.loop = true;
    windSrc.connect(this.windFilter).connect(this.windGain).connect(this.master);
    windSrc.start();
    // slow gusts
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 130;
    lfo.connect(lfoGain).connect(this.windFilter.frequency);
    lfo.start();

    // water
    this.waterGain = ctx.createGain();
    this.waterGain.gain.value = 0;
    const waterFilter = ctx.createBiquadFilter();
    waterFilter.type = 'bandpass';
    waterFilter.frequency.value = 950;
    waterFilter.Q.value = 0.8;
    const waterSrc = ctx.createBufferSource();
    waterSrc.buffer = noiseBuffer;
    waterSrc.loop = true;
    waterSrc.playbackRate.value = 0.85;
    waterSrc.connect(waterFilter).connect(this.waterGain).connect(this.master);
    waterSrc.start();

    // chimes bus
    this.chimeGain = ctx.createGain();
    this.chimeGain.gain.value = 0.5;
    this.chimeGain.connect(this.master);

    this._applyMix(this.chapter, 0.01);
    this._scheduleChime();
  }

  _noise(ctx, seconds) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      // pink-ish: integrate white noise slightly
      last = last * 0.97 + (Math.random() * 2 - 1) * 0.05;
      data[i] = last * 3.2;
    }
    return buf;
  }

  _scheduleChime() {
    clearTimeout(this._chimeTimer);
    const next = 5000 + Math.random() * 9000;
    this._chimeTimer = setTimeout(() => {
      if (this.enabled && !this.paused && this.ctx) {
        const mix = CHAPTER_MIX[this.chapter];
        if (mix[2] > 0.05) this._pluck(mix[2]);
      }
      this._scheduleChime();
    }, next);
  }

  // A bell buoy is inharmonic: a struck bronze shell, not a tuned note.
  // Three detuned partials over one fundamental get most of the way there.
  _pluck(level) {
    const ctx = this.ctx;
    const roots = [146.8, 174.6, 196.0, 220.0];
    const root = roots[Math.floor(Math.random() * roots.length)];
    const t = ctx.currentTime;
    [1, 2.03, 3.41, 5.12].forEach((ratio, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.value = root * ratio;
      const g = ctx.createGain();
      const amp = 0.085 * level * Math.pow(0.55, i);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(amp, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.4 - i * 0.5);
      osc.connect(g).connect(this.chimeGain);
      osc.start(t);
      osc.stop(t + 3.6);
    });
  }

  _applyMix(index, seconds = 1.8) {
    if (!this.ctx) return;
    const [wind, water, , filterHz] = CHAPTER_MIX[index];
    const t = this.ctx.currentTime;
    this.windGain.gain.setTargetAtTime(0.16 * wind, t, seconds);
    this.waterGain.gain.setTargetAtTime(0.12 * water, t, seconds);
    this.windFilter.frequency.setTargetAtTime(filterHz, t, seconds);
  }

  setChapter(index) {
    this.chapter = index;
    this._applyMix(index);
  }

  setEnabled(on) {
    this.enabled = on;
    if (on && !this.ctx) this._init();
    if (!this.ctx) return;
    if (on) this.ctx.resume();
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(on && !this.paused ? 0.8 : 0, t, 0.6);
  }

  setPaused(paused) {
    this.paused = paused;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.enabled && !paused ? 0.8 : 0, t, 0.4);
  }
}
