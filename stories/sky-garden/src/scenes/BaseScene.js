// Scene contract for the unified shell (Phase 4).
// A scene is a pure function of (local progress, time, reduced-motion):
// reverse scrubbing must replay exactly (plan: reversibility rule).
import * as THREE from 'three';

export class BaseScene {
  constructor() {
    this.kit = null;
    this.ctx = null;
    this.group = new THREE.Group();
    this.node = this.group;
  }

  // override — ctx: { kit, chapter, tier, reducedMotion, quality }
  build(ctx) {
    this.ctx = ctx;
    this.kit = ctx.kit;
  }
  update(local, dt, t) {}
  camera(local, t, cam) {
    // default dolly; scenes override for their camera consequence
    cam.position.set(0, 1.2 + local * 0.3, 6 - local * 1.2);
    cam.lookAt(0, 0.8, 0);
  }
  // structural state — the PURE-in-local part of the scene (hero position,
  // growth levels, water levels, heat). Transient frame effects (walk
  // cycles, gust sway, rain phase) are deliberately excluded; the smoke
  // test asserts this is identical on forward and reverse scrub.
  structuralState() { return []; }
  dispose() {}
}
