// SeedSatchel — six impossible seeds; each color identifies a chapter
// (plan ch. I: "seed colours identify future chapters").
import * as THREE from 'three';
import { CHAPTERS } from '../utils/constants.js';

export class SeedSatchel {
  constructor(kit) {
    this.kit = kit;
    this.group = new THREE.Group();
    const pouch = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), kit.matBoots);
    pouch.scale.set(1.1, 0.8, 0.8);
    this.group.add(pouch);
    this.seeds = [];
    CHAPTERS.forEach((c, i) => {
      const seed = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 8, 6),
        new THREE.MeshLambertMaterial({ color: c.seed, emissive: new THREE.Color(c.seed).multiplyScalar(0.25) })
      );
      const a = (i / 6) * Math.PI * 2;
      seed.position.set(Math.cos(a) * 0.18, 0.24, Math.sin(a) * 0.18);
      this.group.add(seed);
      this.seeds.push(seed);
    });
  }

  // fanned reveal (nursery beat .20-.50): pure in t
  setReveal(t) {
    this.seeds.forEach((s, i) => {
      const on = Math.min(1, Math.max(0, t * 6 - i));
      const a = (i / 6) * Math.PI * 2;
      s.position.set(Math.cos(a) * (0.12 + on * 0.22), 0.22 + on * 0.1, Math.sin(a) * (0.12 + on * 0.22));
      s.scale.setScalar(0.5 + on * 0.6);
    });
  }
}
