// WindField — wind as a PURE function of (chapter local progress, time,
// reduced-motion). Scroll velocity may modulate a transient frame (bend,
// spray) but never creates persistent state (plan: reversibility rule).
import * as THREE from 'three';
import { clamp, lerp, hash2 } from '../utils/math.js';

export class WindField {
  constructor(kit, tier) {
    this.kit = kit;
    this.count = { low: 4, medium: 6, high: 8 }[tier] || 6;
    this.group = new THREE.Group();
    // wind ribbons: long curved line-tubes that read the lane direction
    this.ribbons = [];
    for (let i = 0; i < this.count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.55 + i * 0.02, 0.25, 0.85),
        transparent: true, opacity: 0.4
      });
      const r = new THREE.Mesh(new THREE.TorusGeometry(3 + i * 0.7, 0.02, 4, 40, Math.PI * 0.9), mat);
      r.position.set(-6 + i * 2, 1.5 + (i % 3) * 0.9, -4 - (i % 4));
      r.rotation.set(0.4, 0.3, i * 0.2);
      this.group.add(r);
      this.ribbons.push({ node: r, base: r.rotation.z, ph: hash2(i, 3) * 6.28 });
    }
  }

  // strength 0..1 — deterministic in (local, t); velocity adds transient only
  strength(local, t, reduced = false) {
    const base = 0.35 + 0.3 * Math.sin(local * Math.PI * 2.2 + 0.6);
    const gust = reduced ? 0 : 0.15 * Math.sin(t * 0.7);
    return clamp(base + gust, 0, 1);
  }

  // island/platform drift: pure in (local, t) — reversible
  drift(i, local, t, reduced = false) {
    const s = reduced ? 0.4 : 1;
    return {
      x: Math.sin(local * 6.28 + hash2(i, 1) * 6.28) * 0.8 * s,
      y: Math.sin(local * 12.56 + hash2(i, 2) * 6.28) * 0.25 * s
    };
  }

  // transient velocity modulation (decays; never persists)
  setVelocity(v, dt) {
    this._vel = (this._vel || 0) * Math.max(0, 1 - dt * 2.5) + clamp(v, -1, 1) * 0.15;
  }

  update(local, t, dt) {
    const s = this.strength(local, t);
    const vel = this._vel || 0;
    for (const r of this.ribbons) {
      r.node.rotation.z = r.base + Math.sin(t * 0.5 + r.ph) * 0.3 * s + vel * 0.4;
      r.node.material.opacity = 0.25 + s * 0.35;
    }
  }

  dispose() {
    this.ribbons.forEach((r) => { r.node.geometry.dispose(); r.node.material.dispose(); });
  }
}
