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
    // audio is optional: clips land with the Phase 6 audio pass; until
    // then the caption + live region carry the narration
    if (cue.file && this.basePath) {
      const el = new Audio(`${this.basePath}/${cue.file}`);
      el.volume = 0.92;
      this.active = el;
      el.addEventListener('ended', () => this.finish());
      el.addEventListener('error', () => this.finish());
      this.ambience?.setNarrationDuck(true);
      el.play().catch(() => this.finish());
    }
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
