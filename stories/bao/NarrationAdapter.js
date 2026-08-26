import { NarrationController } from '../../src/core/NarrationController.js';
import { BAO_NARRATION_CUES } from './narrationCues.js';

// Drop-in adapter for a Bao-compatible scroll runtime. The host only needs
// to call update(chapterIndex, chapterLocalProgress) from its render tick and
// call setEnabled(true) from a user gesture.
export class BaoNarrationAdapter {
  constructor(ambience) {
    this.controller = new NarrationController(ambience, {
      cues: BAO_NARRATION_CUES,
      basePath: './audio/narration/bao'
    });
  }

  update(chapterIndex, chapterLocalProgress) {
    this.controller.update(chapterIndex, chapterLocalProgress);
  }

  setEnabled(on) {
    this.controller.setEnabled(on);
    if (on) this.controller.startAtCurrentChapter();
  }

  setPaused(paused) {
    this.controller.setPaused(paused);
  }
}
