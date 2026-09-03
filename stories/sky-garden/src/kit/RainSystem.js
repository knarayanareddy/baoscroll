// RainSystem — rain as beads (instanced, no per-frame allocation) + wash.
// Placement is a deterministic function of (index, progress) so reverse
// scrubbing is exact; intensity gates the visible count (tier contracts).
import * as THREE from 'three';
import { clamp, hash2 } from '../utils/math.js';

export class RainSystem {
  constructor(kit, tier, { max = 900 } = {}) {
    this.kit = kit;
    this.max = max;
    this.geo = kit.rainBeadGeometry();
    this.mesh = new THREE.InstancedMesh(this.geo, kit.matRain, max);
    this.mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    this.mesh.visible = false;
    this.dummy = new THREE.Object3D();
    this.intensity = 0;
  }

  // intensity 0..1 pure in story state; drops fall within a column volume
  // and wrap vertically with (progress) so reversing is deterministic
  setIntensity(intensity, t = 0) {
    this.intensity = clamp(intensity, 0, 1);
    const count = Math.floor(this.max * this.intensity);
    this.mesh.count = count;
    this.mesh.visible = count > 0;
    if (!this.mesh.visible) return;
    const H = 14;
    for (let i = 0; i < count; i++) {
      const x = (hash2(i, 1) - 0.5) * 16;
      const z = (hash2(i, 2) - 0.5) * 10 - 2;
      const phase = hash2(i, 3);
      const y = H - ((phase * H + t * 6) % H);
      const streak = 1 + 0.6 * hash2(i, 4) * this.intensity;
      this.dummy.position.set(x, y, z);
      this.dummy.scale.set(1, streak, 1);
      this.dummy.rotation.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    this.mesh.geometry.dispose();
  }
}
