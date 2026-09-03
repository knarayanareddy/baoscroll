// Placeholder chapters (pre-Phase 5): each is individualized with its
// chapter data — proposition card, spatial hint silhouette, beat list —
// so the shell's six sections are real until Phase 5 replaces them in
// plan order (III -> V -> II -> I -> VI). NOT a shallow blockout: the
// placeholder renders the shared kit (clouds, reservoir, gardener) in the
// chapter's spatial proposition so shell integration (router, transitions,
// narration, smoke hooks) is already proven.
import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { CHAPTERS } from '../utils/constants.js';
import { CloudGardener } from '../kit/CloudGardener.js';
import { CloudReservoir } from '../kit/CloudReservoir.js';
import { mulberry32, win } from '../utils/math.js';

export class PlaceholderScene extends BaseScene {
  build(ctx) {
    super.build(ctx);
    this.group = new (this.group.constructor)();
    this.node = this.group;
    const c = CHAPTERS[ctx.chapter];
    const rnd = mulberry32(ctx.chapter * 17 + 3);
    const kit = this.kit;

    // cloud bed — chapter-specific island silhouette (spatial hint)
    const bed = kit.soilBed({ w: 7, d: 4 });
    bed.position.y = -0.6;
    this.group.add(bed);
    const island = kit.cloud({ puffs: 4 + (ctx.chapter % 3) * 2, scale: 1.2 + (ctx.chapter % 2) * 0.5 });
    island.position.y = -1.1;
    this.group.add(island);
    // backdrop clouds at chapter-specific depth
    const backdrop = { low: 3, medium: 5, high: 8 }[ctx.quality] || 5;
    for (let i = 0; i < backdrop; i++) {
      const b = kit.cloud({ puffs: 3, scale: 0.8 + rnd() * 1.4, dark: rnd() > 0.6 });
      b.position.set(-8 + rnd() * 16, 2 + rnd() * 5, -8 - rnd() * 10);
      this.group.add(b);
    }
    // reservoir hint (the transformation object is always present)
    this.reservoir = new CloudReservoir(kit);
    this.reservoir.position.set(2.4, 0.3, -1.5);
    this.reservoir.scale.setScalar(0.8);
    this.group.add(this.reservoir);
    // gardener standing on the bed (contact: feet -> platform)
    this.gardener = new CloudGardener(kit);
    this.gardener.group.position.set(-1.6, -0.3, 0.4);
    this.group.add(this.gardener.group);
    // accent light in the chapter color
    this.accent = new THREE.PointLight(new THREE.Color(c.accent), 0.8, 12);
    this.accent.position.set(0, 2.5, 1.5);
    this.group.add(this.accent);
  }

  update(local, dt, t) {
    // pure in (local, time): walk across the bed, check the reservoir
    const walkT = Math.min(1, local * 1.2);
    this.gardener.group.position.x = -1.6 + walkT * 2.6;
    const action = local < 0.55 ? 'walk' : local < 0.8 ? 'idle' : 'water';
    this.gardener.pose(action, t.time * (1 - this.ctx.reducedMotion * 0.7), t.wind);
    this.reservoir.setLevel(win(local, 0.4, 0.9) * 0.4);
    this.accent.intensity = 0.5 + 0.4 * Math.sin(t.time * 0.8 + this.ctx.chapter);
  }

  structuralState() {
    const g = this.gardener.group.position;
    return [g.x, g.y, g.z, this.reservoir.level];
  }

  camera(local, t, cam) {
    // setup -> mid (contact height) -> consequence pull-back
    cam.position.set(-2.5 + local * 4.5, 1.4 + Math.sin(local * Math.PI) * 0.7, 5.5 - local * 1.5);
    cam.lookAt(-0.5 + local * 1.5, 0.4, 0);
  }
}
