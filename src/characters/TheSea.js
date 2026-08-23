import * as THREE from 'three';
import { mulberry32, lerp, clamp } from '../utils/math.js';

// The Sea — the story's antagonist, and the only other character with
// agency. It is not weather: it watches, it asks, it takes, and it lets
// go. Built from torn ink paper so it belongs to the same handmade world
// as the keeper, but it never resolves into a solid body.
//
// Moods are targets, not events. `setMood` names a state and the class
// eases toward it, so scrubbing backwards un-takes a name as cleanly as
// scrolling forwards took it.
//
//   absent     — below the surface, only a darkening
//   watching   — a face half-formed in the swell, patient
//   demanding  — risen, crowned, tendrils out and open-handed
//   striking   — committed forward, the moment it takes a name
//   receding   — dissolving back into ordinary water
const MOODS = {
  absent: { rise: -3.2, open: 0, reach: 0, crown: 0.1, ink: 0.15, spread: 0.4 },
  watching: { rise: -0.7, open: 0.25, reach: 0.1, crown: 0.35, ink: 0.45, spread: 0.7 },
  demanding: { rise: 0.9, open: 0.8, reach: 0.75, crown: 1, ink: 0.85, spread: 1 },
  striking: { rise: 1.4, open: 1, reach: 1, crown: 1, ink: 1, spread: 1.25 },
  receding: { rise: -1.8, open: 0.1, reach: 0, crown: 0.2, ink: 0.25, spread: 0.55 }
};

const TENDRILS = 7;
const SEGMENTS = 9;

export class TheSea {
  constructor(kit, { scale = 1, shardCount = 46 } = {}) {
    this.kit = kit;
    this.root = new THREE.Group();
    this.root.scale.setScalar(scale);

    this.state = { ...MOODS.absent };
    this._target = { ...MOODS.absent };
    this._reachPoint = new THREE.Vector3(0, 1, 4);
    this._dummy = new THREE.Object3D();
    this._rnd = mulberry32(404);

    /* ---- the face: a torn sheet with two hollows, never fully solid ---- */
    this.mask = new THREE.Group();
    this.root.add(this.mask);

    const faceShape = new THREE.Shape();
    faceShape.moveTo(-1.5, -1.9);
    faceShape.bezierCurveTo(-2.1, 0.2, -1.4, 2.1, 0, 2.4);
    faceShape.bezierCurveTo(1.4, 2.1, 2.1, 0.2, 1.5, -1.9);
    faceShape.bezierCurveTo(0.8, -1.2, -0.8, -1.2, -1.5, -1.9);
    for (const s of [-1, 1]) {
      const socket = new THREE.Path();
      socket.absellipse(s * 0.62, 0.55, 0.34, 0.5, 0, Math.PI * 2, false, s * 0.2);
      faceShape.holes.push(socket);
    }
    this.faceMat = new THREE.MeshBasicMaterial({
      map: kit.tex('paper'),
      color: '#0a1b26',
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false
    });
    this.face = new THREE.Mesh(new THREE.ShapeGeometry(faceShape, 18), this.faceMat);
    this.mask.add(this.face);

    // A second, offset copy in a colder ink reads as depth in the water
    // and stops the face looking like a flat sticker.
    this.faceBackMat = this.faceMat.clone();
    this.faceBackMat.color.set('#123043');
    this.faceBack = new THREE.Mesh(this.face.geometry, this.faceBackMat);
    this.faceBack.position.set(0.18, -0.12, -0.5);
    this.faceBack.scale.setScalar(1.12);
    this.mask.add(this.faceBack);

    /* ---- crown of torn wave shards, instanced ---- */
    this.crown = kit.makeShardInstances(shardCount, '#0e2736');
    this.crown.material.opacity = 0;
    this.crownSeeds = [];
    for (let i = 0; i < shardCount; i++) {
      this.crownSeeds.push({
        a: (i / shardCount) * Math.PI * 2 + this._rnd() * 0.3,
        r: 1.8 + this._rnd() * 1.9,
        y: 0.4 + this._rnd() * 2.4,
        s: 0.5 + this._rnd() * 1.5,
        spin: (this._rnd() - 0.5) * 1.4,
        phase: this._rnd() * Math.PI * 2
      });
    }
    this.root.add(this.crown);

    /* ---- tendrils: what actually reaches for a name ---- */
    this.tendrils = [];
    for (let i = 0; i < TENDRILS; i++) {
      const pts = [];
      for (let j = 0; j <= SEGMENTS; j++) pts.push(new THREE.Vector3());
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: '#16394b', transparent: true, opacity: 0 })
      );
      line.userData = {
        origin: new THREE.Vector3(
          Math.cos((i / TENDRILS) * Math.PI * 2) * 1.6,
          -0.4 + this._rnd() * 1.4,
          Math.sin((i / TENDRILS) * Math.PI * 2) * 0.7
        ),
        phase: this._rnd() * Math.PI * 2,
        wander: 0.5 + this._rnd() * 0.9
      };
      this.root.add(line);
      this.tendrils.push(line);
    }

    /* ---- the cold light it casts back at the keeper ---- */
    this.glow = new THREE.PointLight('#2f7f96', 0, 16, 2);
    this.glow.position.y = 1;
    this.root.add(this.glow);
  }

  /** Aim the tendrils at a world point — usually a name the keeper holds. */
  reachToward(point) {
    this._reachPoint.copy(point);
  }

  setMood(name) {
    const m = MOODS[name] || MOODS.absent;
    this._target = m;
  }

  /**
   * Blend directly between two moods by weight. Scenes use this instead of
   * setMood when the sea's state is a continuous function of scroll.
   */
  blendMood(a, b, w) {
    const A = MOODS[a] || MOODS.absent;
    const B = MOODS[b] || MOODS.absent;
    const t = clamp(w, 0, 1);
    this._target = {
      rise: lerp(A.rise, B.rise, t),
      open: lerp(A.open, B.open, t),
      reach: lerp(A.reach, B.reach, t),
      crown: lerp(A.crown, B.crown, t),
      ink: lerp(A.ink, B.ink, t),
      spread: lerp(A.spread, B.spread, t)
    };
  }

  update(time, dt = 0.016, motion = 1) {
    // ease toward the target mood; framerate independent, still reversible
    // because the target itself is derived from scroll every frame
    const e = Math.min(1, dt * 3.4);
    for (const key of Object.keys(this._target)) {
      this.state[key] += (this._target[key] - this.state[key]) * e;
    }
    const st = this.state;

    /* face */
    this.mask.position.y = st.rise;
    this.mask.rotation.z = Math.sin(time * 0.4) * 0.05 * motion;
    this.mask.rotation.y = Math.sin(time * 0.27) * 0.16 * motion * st.open;
    const breathe = 1 + Math.sin(time * 0.8) * 0.03 * motion;
    this.mask.scale.set(breathe * (0.9 + st.spread * 0.35), breathe * (0.85 + st.open * 0.45), 1);
    this.faceMat.opacity = st.ink * 0.88;
    this.faceBackMat.opacity = st.ink * 0.42;

    /* crown */
    this.crown.material.opacity = st.crown * 0.85;
    if (st.crown > 0.01) {
      for (let i = 0; i < this.crownSeeds.length; i++) {
        const c = this.crownSeeds[i];
        const swirl = time * 0.35 * motion + c.phase;
        const r = c.r * st.spread;
        this._dummy.position.set(
          Math.cos(c.a + swirl * 0.3) * r,
          st.rise + c.y * st.crown + Math.sin(swirl) * 0.28 * motion,
          Math.sin(c.a + swirl * 0.3) * r * 0.5 - 0.4
        );
        this._dummy.rotation.set(swirl * 0.2, c.a, swirl * c.spin * 0.4);
        this._dummy.scale.setScalar(c.s * (0.5 + st.crown * 0.8));
        this._dummy.updateMatrix();
        this.crown.setMatrixAt(i, this._dummy.matrix);
      }
      this.crown.instanceMatrix.needsUpdate = true;
    }

    /* tendrils curl out toward whatever the sea currently wants */
    const target = this._reachPoint;
    for (const line of this.tendrils) {
      const u = line.userData;
      line.material.opacity = st.reach * 0.7;
      if (st.reach < 0.01) continue;
      const attr = line.geometry.attributes.position;
      for (let j = 0; j <= SEGMENTS; j++) {
        const t = j / SEGMENTS;
        // base curl in local space, then bend toward the target by reach
        const curl = Math.sin(t * 3.2 + time * u.wander * motion + u.phase);
        const bx = u.origin.x * (1 + t * 1.4) + curl * 0.5 * t;
        const by = u.origin.y + st.rise + t * 1.9 + Math.sin(t * 2.4 + time * motion + u.phase) * 0.4;
        const bz = u.origin.z * (1 + t * 1.2) + curl * 0.3 * t;
        const pull = st.reach * t * t;
        attr.setXYZ(
          j,
          lerp(bx, target.x, pull),
          lerp(by, target.y, pull),
          lerp(bz, target.z, pull)
        );
      }
      attr.needsUpdate = true;
    }

    this.glow.position.y = st.rise + 1.2;
    this.glow.intensity = st.ink * 1.6;
  }
}
