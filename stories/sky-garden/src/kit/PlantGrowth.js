// PlantGrowthSystem — roots, vines and branch leaves as PURE growth
// functions of progress (plan: "plant growth and wind are pure scroll
// functions"; visible segments, no one-time events).
import * as THREE from 'three';
import { mulberry32, lerp, win } from '../utils/math.js';

export class PlantGrowth {
  constructor(kit) {
    this.kit = kit;
  }

  // vine/root curve: n segments appear as t crosses each 1/n step
  vine({ from = [0, 0, 0], to = [4, 0.4, 0], segments = 8, sag = 0.5, seed = 1, thickness = 0.035 } = {}) {
    const rnd = mulberry32(seed);
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      pts.push(new THREE.Vector3(
        lerp(from[0], to[0], t),
        lerp(from[1], to[1], t) - Math.sin(t * Math.PI) * sag + (rnd() - 0.5) * 0.12,
        lerp(from[2], to[2], t) + (rnd() - 0.5) * 0.2
      ));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    return { curve, segments };
  }

  // build visible portion of a vine as a tube + felt flowers at segment tips
  buildVine(vine, t, { flowers = 0, flowerScale = 0.5 } = {}) {
    const g = new THREE.Group();
    const visible = Math.floor(clamp01(t) * (vine.segments + 0.999));
    if (visible > 0) {
      const pts = vine.curve.getPoints(vine.segments * 2).slice(0, Math.max(2, Math.ceil(visible * 2)));
      const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), visible * 2, 0.035, 5, false);
      g.add(new THREE.Mesh(geo, this.kit.matVine));
      for (let i = 1; i <= Math.min(flowers, visible); i++) {
        const f = this.kit.flower({ scale: flowerScale, color: '#d9a0b0' });
        const p = vine.curve.getPoint(i / (vine.segments + 1));
        f.position.copy(p);
        g.add(f);
      }
    }
    return g;
  }

  // branch with leaves that wake as t passes (orchard beat: branches grow leaves)
  branch({ length = 3, seed = 5 } = {}) {
    const rnd = mulberry32(seed);
    const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, length * 0.4, 0), new THREE.Vector3(0.2, length * 0.75, 0.1), new THREE.Vector3(0.1, length, 0)];
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 10, 0.05 + rnd() * 0.03, 5, false);
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: '#7a6a4f' }));
    g.add(trunk);
    this.leaves = [];
    const n = 8;
    for (let i = 0; i < n; i++) {
      const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.16, 7, 0, Math.PI * 2), this.kit.matLeaf);
      const p = curve.getPoint(0.3 + (i / n) * 0.68);
      leaf.position.set(p.x + (rnd() - 0.5) * 0.3, p.y, p.z + (rnd() - 0.5) * 0.3);
      leaf.scale.setScalar(0.001); // grown by setLeafWake
      leaf.rotation.set(rnd() * 3, rnd() * 3, 0);
      g.add(leaf);
      this.leaves.push(leaf);
    }
    return g;
  }

  // pure: leaf scale from wake 0..1
  setLeafWake(wake) {
    if (!this.leaves) return;
    const n = this.leaves.length;
    this.leaves.forEach((leaf, i) => {
      const s = win(wake, i / n, (i + 1) / n, 0.08);
      leaf.scale.setScalar(Math.max(0.001, s));
    });
  }
}

function clamp01(v) { return Math.min(1, Math.max(0, v)); }
