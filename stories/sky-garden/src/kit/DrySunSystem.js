// DrySunSystem — heat shimmer, sun-thread rays and per-object bleach.
// NOT a global yellow overlay (plan QA): bleach is applied to specific
// plant/cloud materials, and threads are physical geometry.
import * as THREE from 'three';
import { lerp, clamp } from '../utils/math.js';

export class DrySunSystem extends THREE.Group {
  constructor(kit) {
    super();
    this.kit = kit;
    this.group = this;
    this.sun = new THREE.Mesh(new THREE.CircleGeometry(1.2, 32), kit.matSun);
    this.add(this.sun);
    this.threads = [];
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const th = new THREE.Mesh(new THREE.BoxGeometry(0.02, 4.5, 0.02), kit.matSunThread);
      th.position.set(Math.cos(a) * 2.2, Math.sin(a) * 2.2, -0.2);
      th.rotation.z = a + Math.PI / 2;
      this.add(th);
      this.threads.push({ node: th, ph: i * 0.5 });
    }
    this.bleached = [];
  }

  // heat 0..1: thread reach/opacity + shimmer (pure in (heat, t))
  setHeat(heat, t = 0) {
    this.heat = clamp(heat, 0, 1);
    for (const th of this.threads) {
      const s = 0.4 + this.heat * 0.8 + Math.sin(t * 2 + th.ph) * 0.05 * this.heat;
      th.node.scale.set(1, Math.max(0.05, s), 1);
      th.node.material.opacity = 0.2 + this.heat * 0.4;
    }
    this.sun.scale.setScalar(0.8 + this.heat * 0.5);
    this.sun.material.color.setRGB(1, lerp(0.9, 0.72, this.heat), lerp(0.68, 0.4, this.heat));
  }

  // register a material for story-driven bleach (dry -> wet color)
  registerBleach(mesh, dryColor, wetColor) {
    this.bleached.push({ mesh, dry: new THREE.Color(dryColor), wet: new THREE.Color(wetColor) });
  }

  // wetness 0..1 pure in story state: 0 = fully dry/bleached
  setWetness(wet) {
    for (const b of this.bleached) {
      b.mesh.material.color.copy(b.dry).lerp(b.wet, clamp(wet, 0, 1));
    }
  }
}
