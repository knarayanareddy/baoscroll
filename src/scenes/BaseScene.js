import * as THREE from 'three';
import { evalPath } from '../utils/math.js';

// Chapter scene contract: build lazily on first approach, update only
// while active, stay a pure function of (localProgress, storyTime).
//
// The shared helpers below exist so a chapter file is spent on staging
// and performance rather than on the same four lines of camera and
// caption plumbing six times over.
export class BaseScene {
  constructor(experience) {
    this.experience = experience;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.built = false;
    this._pos = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this._beat = -1;
    experience.world.add(this.group);
  }

  // heavy construction goes here, deferred until the chapter is near
  build() {}

  ensure() {
    if (!this.built) {
      this.build();
      this.built = true;
    }
  }

  setVisible(v) {
    this.group.visible = v;
    if (!v) this._beat = -1;
  }

  /** 1 normally, 0.25 when the reader has asked for calmer motion. */
  get motion() {
    return this.experience.reducedMotion ? 0.25 : 1;
  }

  /** Instance count for atmospherics, scaled to the device tier. */
  tiered(high, medium, low) {
    const q = this.experience.quality;
    return q === 'high' ? high : q === 'medium' ? medium : low;
  }

  /**
   * Drive the camera from a keyframe path. Roll is suppressed entirely in
   * reduced-motion mode, where a rolling horizon is the worst offender.
   */
  shot(keys, p) {
    const view = evalPath(keys, p, this._pos, this._look);
    this.experience.camera.setView(
      this._pos,
      this._look,
      this.experience.reducedMotion ? 0 : view.roll,
      view.fov
    );
  }

  /**
   * Narrate the chapter's beats for screen readers and for anyone who
   * cannot see the action. Fires only when the beat actually changes, in
   * either scroll direction.
   */
  narrate(lines, p) {
    let index = 0;
    for (let i = 0; i < lines.length; i++) {
      if (p >= lines[i].at) index = i;
    }
    if (index !== this._beat) {
      this._beat = index;
      const live = document.getElementById('chapter-live');
      if (live) live.textContent = lines[index].text;
    }
  }

  /* eslint-disable-next-line no-unused-vars */
  update(localProgress, time, dt) {}
}
