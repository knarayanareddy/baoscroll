// CloudReservoir — the transformation object: begins depleted, ends as a
// living rain system. Water level is a PURE function of story state, so
// scrubbing backwards dries it again (plan: reversible state).
import * as THREE from 'three';
import { clamp, win } from '../utils/math.js';

export class CloudReservoir extends THREE.Group {
  constructor(kit, { puffs = 8 } = {}) {
    super();
    this.kit = kit;
    this.group = this;
    this.cloud = kit.cloud({ puffs, scale: 1.4, dark: true });
    this.add(this.cloud);
    // water surface inside the cloud hollow
    this.water = new THREE.Mesh(new THREE.CircleGeometry(1.5, 24), kit.matWater);
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.y = -0.35;
    this.add(this.water);
    // drip bead (nursery beat: "cloud reservoir drips once")
    this.drip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), kit.matWater);
    this.drip.visible = false;
    this.add(this.drip);
    this.level = 0;
  }

  // level 0..1 pure in story state; drip fires on the 0.5 beat
  setLevel(level, local = 0) {
    this.level = clamp(level, 0, 1);
    const s = 0.25 + this.level * 0.9;
    this.water.scale.set(s, s, s);
    this.water.position.y = -0.35 - (1 - this.level) * 0.15;
    this.water.material.opacity = 0.4 + this.level * 0.5;
    const dripT = win(local, 0.495, 0.545, 0.02);
    this.drip.visible = dripT > 0 && dripT < 1;
    if (this.drip.visible) this.drip.position.y = -0.4 - (1 - dripT) * 0.9;
  }

  // the rain it releases (used by orchard/sun/rain chapters)
  releaseAmount() { return this.level; }
}
