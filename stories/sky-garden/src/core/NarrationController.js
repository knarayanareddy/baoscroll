// Self-contained narration controller (sky-garden module): chapter-
// addressed cues, caption overlay, aria-live text, ambience ducking.
// Voice is optional foreground storytelling; scroll stays canonical.
export class NarrationController {
  constructor(ambience, { cues, basePath = '' } = {}) {
    this.ambience = ambience;
    this.cues = cues;
    this.basePath = basePath;
    this.enabled = false;
    this.paused = false;
    this.played = new Set();
    this.active = null;
    this.narratedChapter = -1;
    this.currentChapter = 0;
    this.currentLocal = 0;
    this.caption = document.getElementById('sg-caption');
    this.live = document.getElementById('sg-live');
  }

  setEnabled(on) {
    this.enabled = on;
    if (!on) this.stop();
  }

  setPaused(p) {
    this.paused = p;
    if (!this.active) return;
    if (p) this.active?.pause();
    else this.active?.play().catch(() => {});
  }

  startAtCurrentChapter() {
    if (!this.enabled || this.paused) return;
    this.playChapter(this.currentChapter);
  }

  update(chapter, local) {
    this.currentChapter = chapter;
    this.currentLocal = local;
    if (this.enabled && !this.paused && this.narratedChapter !== chapter) {
      this.playChapter(chapter);
    }
  }

  playChapter(chapter) {
    const cue = this.cues[chapter]?.[0];
    if (!cue) return;
    this.stop();
    this.narratedChapter = chapter;
    this.played.add(cue.id);
    this.setCaption(cue.caption, true);
    // voice: clips ride a gesture-resumed AudioContext (via a media
    // element source) so the line plays even where cross-origin preview
    // iframes block plain <audio> playback — the same policy class as the
    // ambience, which is proven to work in the preview
    if (cue.file && this.basePath) {
      const el = new Audio(`${this.basePath}/${cue.file}`);
      el.preload = 'auto';
      el.volume = 0.92;
      const ctx = this._ensureCtx();
      if (ctx) {
        try {
          if (ctx.state === 'suspended') ctx.resume().catch(() => {});
          const node = ctx.createMediaElementSource(el);
          node.connect(ctx.destination);
          this._node = node;
        } catch (e) {
          // fall back to direct element playback (some hosts forbid
          // media element sources); the error path below still surfaces
        }
      }
      this.active = el;
      el.addEventListener('ended', () => this.finish());
      el.addEventListener('error', () => this.fail('narration clip failed to load'));
      this.ambience?.setNarrationDuck(true);
      el.play().catch((err) => this.fail(`narration blocked (${err ? err.name : 'unknown'})`));
    }
  }

  _ensureCtx() {
    if (this._ctx) return this._ctx;
    const Ctx = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
    if (!Ctx) return null;
    try { this._ctx = new Ctx(); } catch { return null; }
    return this._ctx;
  }

  // visible failure: the caption shows what went wrong (and console)
  // instead of the button silently doing nothing
  fail(msg) {
    console.warn('[sky-garden narration]', msg);
    if (this.active) { this.active.pause(); this.active = null; }
    this.ambience?.setNarrationDuck(false);
    this.setCaption(msg, true);
    clearTimeout(this._failTimer);
    this._failTimer = setTimeout(() => this.setCaption('', false), 4000);
  }

  finish() {
    if (this.active) { this.active.pause(); this.active = null; }
    this.ambience?.setNarrationDuck(false);
    this.setCaption('', false);
  }

  stop() {
    if (this.active) this.finish();
    else { this.ambience?.setNarrationDuck(false); this.setCaption('', false); }
  }

  setCaption(text, visible) {
    if (this.caption) {
      this.caption.textContent = text;
      this.caption.classList.toggle('active', visible);
    }
    if (this.live) this.live.textContent = text;
  }
}
