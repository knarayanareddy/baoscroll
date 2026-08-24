import { CHAPTER_CUES } from '../data/narrationCues.js';

// Voice is optional foreground storytelling. It never drives world state;
// scroll remains canonical and works completely muted/reversed.
export class NarrationController {
  constructor(ambience, { cues = CHAPTER_CUES, prologue = PROLOGUE, basePath = './audio/narration' } = {}) {
    this.ambience = ambience;
    this.cues = cues;
    this.prologue = prologue;
    this.basePath = basePath;
    this.enabled = false;
    this.paused = false;
    this.played = new Set();
    this.active = null;
    this.narratedChapter = -1;
    this.currentChapter = 0;
    this.currentLocal = 0;
    this.caption = document.getElementById('narration-caption');
    this.live = document.getElementById('narration-live');
  }

  setEnabled(on) {
    this.enabled = on;
    if (!on) this.stop();
  }

  setPaused(paused) {
    this.paused = paused;
    if (!this.active) return;
    if (paused) this.active.pause();
    else this.active.play().catch(() => {});
  }

  startAtCurrentChapter() {
    if (!this.enabled || this.paused) return;
    this.playChapter(this.currentChapter);
  }

  update(chapter, local) {
    this.currentChapter = chapter;
    this.currentLocal = local;
    // Narration is chapter-addressed, not milestone-addressed: every time the
    // reader crosses a chapter boundary, its corresponding line starts.
    if (this.enabled && !this.paused && this.narratedChapter !== chapter) {
      this.playChapter(chapter);
    }
  }

  playChapter(chapter) {
    const cue = this.cues[chapter]?.[0];
    if (!cue) return;
    this.stop();
    this.play(cue);
  }

  play(cue) {
    if (!this.enabled || this.paused) return;
    const audio = new Audio(`${this.basePath}/${cue.file}`);
    audio.preload = 'auto';
    audio.volume = 0.92;
    audio.addEventListener('ended', () => this.finish(cue.id));
    audio.addEventListener('error', () => this.finish(cue.id));
    this.active = audio;
    this.narratedChapter = this.currentChapter;
    this.played.add(cue.id);
    this.setCaption(cue.caption, true);
    this.ambience?.setNarrationDuck(true);
    audio.play().catch(() => this.finish(cue.id));
  }

  finish() {
    if (this.active) {
      this.active.pause();
      this.active = null;
    }
    this.ambience?.setNarrationDuck(false);
    this.setCaption('', false);
  }

  stop() {
    if (!this.active) return;
    this.finish();
  }

  setCaption(text, visible) {
    if (this.caption) {
      this.caption.textContent = text;
      this.caption.classList.toggle('active', visible);
    }
    if (this.live) this.live.textContent = text;
  }
}
