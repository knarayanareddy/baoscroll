import * as THREE from 'three';
import { mulberry32 } from '../utils/math.js';

// One pooled InstancedMesh of tumbling paper scraps, restyled per
// chapter. The pool is allocated once; mode changes only recolor and
// re-seed velocities — no allocation during the story.
//
// The colour rule from the visual bible holds here too: gold only ever
// means memory, so it appears in the air exactly twice — underwater,
// where names are being kept, and in the beam, where they are given back.
const MODES = [
  // I   sea spray and dust off the dock boards, drifting inland
  { colors: ['#efe2c8', '#cdbb9a', '#b8d4d0'], size: 0.7, speed: 0.3, up: 0.02, area: [18, 6, 10] },
  // II  paper fibre and lifted ink inside the lantern room
  { colors: ['#e9dcc0', '#4a382f', '#8c3940'], size: 0.45, speed: 0.22, up: 0.05, area: [7, 5, 7] },
  // III torn foam and rain shrapnel, moving fast and level
  { colors: ['#b7d3d0', '#0e2736', '#9fc4c6'], size: 0.85, speed: 1.9, up: 0.0, area: [18, 9, 11] },
  // IV  silt and gold memory, hanging almost still in the water
  { colors: ['#2c4b4e', '#e6d8bb', '#f1bb63'], size: 0.5, speed: 0.14, up: 0.04, area: [16, 10, 13] },
  // V   sparks off the lamp and paper caught in the beam
  { colors: ['#ffd47b', '#fff5c9', '#bf8d43'], size: 0.6, speed: 0.45, up: 0.11, area: [11, 15, 10] },
  // VI  down, feathers and morning haze over an open coast
  { colors: ['#f7e2bd', '#efad76', '#ffd680', '#6ba5ae'], size: 1.0, speed: 0.35, up: 0.07, area: [22, 11, 14] }
];

export class PaperParticleSystem {
  constructor(experience) {
    this.experience = experience;
    const tier = experience.quality;
    this.count = tier === 'high' ? 240 : tier === 'medium' ? 130 : 60;

    const geometry = new THREE.PlaneGeometry(0.12, 0.16);
    this.material = new THREE.MeshBasicMaterial({
      map: experience.assets.get('shard'),
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false
    });
    this.mesh = new THREE.InstancedMesh(geometry, this.material, this.count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;

    this.pos = new Float32Array(this.count * 3);
    this.vel = new Float32Array(this.count * 3);
    this.rot = new Float32Array(this.count * 3);
    this.rotV = new Float32Array(this.count * 3);
    this.scale = new Float32Array(this.count);

    this._dummy = new THREE.Object3D();
    this._color = new THREE.Color();
    this._center = new THREE.Vector3();
    this.mode = -1;
    this.setMode(0);
  }

  setMode(index) {
    if (index === this.mode) return;
    this.mode = index;
    const cfg = MODES[index];
    const rnd = mulberry32(index * 31 + 5);
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      this.pos[i3] = (rnd() - 0.5) * cfg.area[0];
      this.pos[i3 + 1] = (rnd() - 0.5) * cfg.area[1];
      this.pos[i3 + 2] = (rnd() - 0.5) * cfg.area[2];
      this.vel[i3] = (rnd() - 0.5) * 0.4;
      this.vel[i3 + 1] = (rnd() - 0.3) * 0.25 + cfg.up * 4;
      this.vel[i3 + 2] = (rnd() - 0.5) * 0.25;
      this.rot[i3] = rnd() * Math.PI * 2;
      this.rot[i3 + 1] = rnd() * Math.PI * 2;
      this.rot[i3 + 2] = rnd() * Math.PI * 2;
      this.rotV[i3] = (rnd() - 0.5) * 2.2;
      this.rotV[i3 + 1] = (rnd() - 0.5) * 2.2;
      this.rotV[i3 + 2] = (rnd() - 0.5) * 2.2;
      this.scale[i] = cfg.size * (0.5 + rnd());
      this._color.set(cfg.colors[i % cfg.colors.length]);
      this.mesh.setColorAt(i, this._color);
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  update(dt, pointerWorld) {
    const exp = this.experience;
    if (exp.paused) return;
    const cfg = MODES[this.mode];
    const motion = exp.reducedMotion ? 0.25 : 1;
    const speed = cfg.speed * motion;

    // the cloud follows the camera's focus so it always fills the frame
    this._center.copy(exp.camera.baseLook);
    const [ax, ay, az] = cfg.area;

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      this.pos[i3] += this.vel[i3] * dt * speed;
      this.pos[i3 + 1] += this.vel[i3 + 1] * dt * speed;
      this.pos[i3 + 2] += this.vel[i3 + 2] * dt * speed;

      // cursor repulsion (desktop only)
      if (pointerWorld && !exp.isTouch) {
        const dx = this.pos[i3] + this._center.x - pointerWorld.x;
        const dy = this.pos[i3 + 1] + this._center.y - pointerWorld.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 1.44 && d2 > 0.0001) {
          const f = (1.2 - Math.sqrt(d2)) * dt * 2.4 * motion;
          const inv = 1 / Math.sqrt(d2);
          this.pos[i3] += dx * inv * f;
          this.pos[i3 + 1] += dy * inv * f;
        }
      }

      // wrap inside the chapter's volume
      if (this.pos[i3] > ax / 2) this.pos[i3] -= ax;
      if (this.pos[i3] < -ax / 2) this.pos[i3] += ax;
      if (this.pos[i3 + 1] > ay / 2) this.pos[i3 + 1] -= ay;
      if (this.pos[i3 + 1] < -ay / 2) this.pos[i3 + 1] += ay;
      if (this.pos[i3 + 2] > az / 2) this.pos[i3 + 2] -= az;
      if (this.pos[i3 + 2] < -az / 2) this.pos[i3 + 2] += az;

      this.rot[i3] += this.rotV[i3] * dt * motion;
      this.rot[i3 + 1] += this.rotV[i3 + 1] * dt * motion;
      this.rot[i3 + 2] += this.rotV[i3 + 2] * dt * motion;

      this._dummy.position.set(
        this.pos[i3] + this._center.x,
        this.pos[i3 + 1] + this._center.y,
        this.pos[i3 + 2] + this._center.z
      );
      this._dummy.rotation.set(this.rot[i3], this.rot[i3 + 1], this.rot[i3 + 2]);
      this._dummy.scale.setScalar(this.scale[i]);
      this._dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this._dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
