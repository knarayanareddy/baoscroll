// Chapter II — The First Seed (Phase 5, third in plan order).
// "Grow a bridge": a wide floating-island gap crossed by one growing vine.
// The gardener plants the first seed, guides the vine as it grows in
// visible segments, crosses the bridge as it weaves itself, and reaches
// the next island as wind begins to destabilize the path.
//
// Beat table (plan):
//   0-.25   plants the first seed at the island edge — cloud soil darkens/wets
//   .25-.55 waters and guides the vine — it grows in visible segments
//   .55-.82 crosses the growing bridge — flowers open beneath the feet
//   .82-1   reaches the next island — wind destabilizes the path
//
// Contacts: hand -> vine guide/tendril; feet -> vine bridge segments.
// Reversible: segment visibility, wetness, flower bloom, gardener path and
// wind destabilization are pure in local progress; sway is frame-level.
import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { CloudGardener } from '../kit/CloudGardener.js';
import { PlantGrowth } from '../kit/PlantGrowth.js';
import { lerp, win, mulberry32 } from '../utils/math.js';

export class FirstSeedScene extends BaseScene {
  build(ctx) {
    super.build(ctx);
    const kit = this.kit;
    const rnd = mulberry32(42);

    // ---- two cloud islands with a wide gap ----
    for (const side of [-1, 1]) {
      const island = new THREE.Group();
      const bed = kit.soilBed({ w: 4.6, d: 3.2 });
      island.add(bed);
      const puffs = kit.cloud({ puffs: 6, scale: 1.5, dark: true });
      puffs.position.y = -0.9;
      island.add(puffs);
      island.position.set(side * 6.2, -0.55, 0);
      this.group.add(island);
    }
    // backdrop depth
    for (let i = 0; i < 4; i++) {
      const b = kit.cloud({ puffs: 3, scale: 1.2 + rnd() * 1.5, dark: rnd() > 0.5 });
      b.position.set(-10 + i * 6, 2.5 + rnd() * 4, -8 - rnd() * 6);
      this.group.add(b);
    }

    // ---- the vine: pre-built segments, revealed by visibility (no
    // per-frame allocation) ----
    this.growth = new PlantGrowth(kit);
    const vine = this.growth.vine({ from: [-4.1, -0.42, 0.1], to: [4.1, -0.42, -0.1], segments: 10, sag: 1.15, seed: 7 });
    this.vineCurve = vine.curve;
    this.segPts = vine.curve.getPoints(vine.segments);
    this.vineSegs = [];
    for (let i = 0; i < vine.segments; i++) {
      const a = this.segPts[i], b = this.segPts[i + 1];
      const mid = a.clone().lerp(b, 0.5);
      const len = a.distanceTo(b);
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.04, len, 5), kit.matVine);
      seg.position.copy(mid);
      seg.lookAt(b);
      seg.rotateX(Math.PI / 2);
      seg.visible = false;
      this.group.add(seg);
      this.vineSegs.push(seg);
    }
    // flowers at segment tips — open as the gardener passes (pure in crossT)
    this.flowerUs = [0.18, 0.34, 0.5, 0.66, 0.82];
    this.flowers = this.flowerUs.map((u) => {
      const f = kit.flower({ color: '#d9a0b0', petals: 6, scale: 0.55 });
      const p = vine.curve.getPoint(u);
      f.position.set(p.x, p.y + 0.16, p.z);
      f.scale.setScalar(0.001);
      this.group.add(f);
      return f;
    });
    // the growing tip (visible while the vine is still extending)
    this.tip = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), kit.matVine);
    this.group.add(this.tip);
    // guide tendril: hand -> vine tip while guiding
    this.tendril = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, 1, 4), kit.matVine);
    this.tendril.visible = false;
    this.group.add(this.tendril);

    // ---- wet patch: soil darkens/wets at the planting spot ----
    this.wetPatch = new THREE.Mesh(new THREE.CircleGeometry(0.75, 18), kit.matSoilWet);
    this.wetPatch.rotation.x = -Math.PI / 2;
    this.wetPatch.position.set(-3.9, -0.28, 0.12);
    this.wetPatch.scale.setScalar(0.001);
    this.group.add(this.wetPatch);
    // the planted seed (stays in the soil)
    this.seed = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 8, 6),
      new THREE.MeshLambertMaterial({ color: '#7fae6e', emissive: new THREE.Color('#7fae6e').multiplyScalar(0.25) })
    );
    this.seed.position.set(-3.9, -0.26, 0.12);
    this.group.add(this.seed);

    // ---- wind hint (arrive beat): ribbons appear from the right ----
    this.windHints = [];
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(
        new THREE.TorusGeometry(2.2 + i * 0.6, 0.02, 4, 32, Math.PI * 0.8),
        new THREE.MeshBasicMaterial({ color: '#bcd8e8', transparent: true, opacity: 0 })
      );
      r.position.set(6.5 + i * 1.2, 0.6 + i * 0.7, -2 - i * 1.5);
      r.rotation.set(0.3, 0.4, i * 0.3);
      this.group.add(r);
      this.windHints.push(r);
    }

    // ---- gardener ----
    this.gardener = new CloudGardener(kit);
    this.group.add(this.gardener.group);
    this._growthT = 0;
  }

  update(local, dt, t) {
    const reduced = this.ctx.reducedMotion;
    const plantT = win(local, 0, 0.25);
    const growthT = win(local, 0.25, 0.55);
    const crossT = win(local, 0.55, 0.82);
    const arriveT = win(local, 0.82, 1);
    this._growthT = growthT;

    // soil wets as the seed is planted (pure)
    this.wetPatch.scale.setScalar(0.001 + plantT * 1);
    this.seed.scale.setScalar(0.001 + win(local, 0.1, 0.2) * 1);

    // vine reveals in visible segments (pure count)
    const n = this.vineSegs.length;
    const visible = Math.floor(growthT * (n + 0.999));
    for (let i = 0; i < n; i++) this.vineSegs[i].visible = i < visible;
    const front = Math.min(1, (growthT * n) / n); // reveal front u along the curve
    // growing tip sits at the reveal front while extending
    this.tip.visible = growthT > 0.001 && growthT < 0.999;
    if (this.tip.visible) this.tip.position.copy(this.vineCurve.getPoint(Math.max(0.001, front)));
    // frame-level sway grows with the arrive beat (transient; excluded
    // from structural state)
    const destab = arriveT * (reduced ? 0.3 : 1);
    this.vineSegs.forEach((seg, i) => {
      seg.rotation.z = Math.sin(t.time * 1.6 + i * 0.9) * 0.035 * destab;
    });

    // ---- gardener: plant -> guide -> cross -> arrive ----
    const gp = this.gardener.group.position;
    if (local < 0.25) {
      // at the left island edge, watering the planted seed
      gp.set(-4.3, -0.28, 0.2);
      this.gardener.pose('water', t.time * 0.5 * (1 - reduced * 0.7), 0.1, 0.12);
      this.tendril.visible = false;
      this._contactHand = 0;
    } else if (local < 0.55) {
      // guides the vine: hand -> growing tip (tendril)
      gp.set(-3.6, -0.28, 0.15);
      this.gardener.pose('reach', t.time * 0.4 * (1 - reduced * 0.7), 0.15, 0);
      const hv = new THREE.Vector3();
      this.gardener.handR.getWorldPosition(hv);
      const p = this.vineCurve.getPoint(Math.max(0.001, front));
      this.tendril.visible = true;
      const mid = hv.clone().lerp(p, 0.5);
      this.tendril.position.copy(mid);
      this.tendril.lookAt(p);
      this.tendril.rotateX(Math.PI / 2);
      this.tendril.scale.set(1, hv.distanceTo(p), 1);
      this._contactHand = 0; // hand holds the tip by construction
    } else {
      // crosses the bridge: feet -> vine (pure: position ON the curve)
      const u = 0.02 + crossT * 0.96;
      const p = this.vineCurve.getPoint(u);
      gp.set(p.x, p.y + 0.14, p.z);
      this.gardener.pose('walk', t.time * (1 - reduced * 0.6), 0.12, 0);
      this.tendril.visible = false;
      // feet contact: distance from the foot anchor to the bridge
      const fv = new THREE.Vector3();
      this.gardener.footR.getWorldPosition(fv);
      this._contactFeet = Math.abs(fv.y - p.y - 0.14);
      // flowers open beneath the feet as the gardener passes (pure in crossT)
      this.flowers.forEach((f, i) => {
        const fu = this.flowerUs[i];
        const open = win(crossT * 0.96 + 0.02, fu - 0.03, fu + 0.09);
        f.scale.setScalar(Math.max(0.001, open));
      });
    }
    if (local < 0.55) this.flowers.forEach((f) => f.scale.setScalar(0.001));
    // arrive: wind destabilizes — hint ribbons fade in
    this.windHints.forEach((r, i) => {
      r.material.opacity = arriveT * (0.3 + i * 0.12);
      r.rotation.z += (reduced ? 0 : 0.003) * (1 + i * 0.4);
    });
    gp.y += arriveT * 0.1; // settle onto the right island
  }

  structuralState() {
    const g = this.gardener.group.position;
    return [
      g.x, g.y, g.z,
      this._growthT,
      this.wetPatch.scale.x,
      this.seed.scale.x,
      ...this.flowers.map((f) => f.scale.x),
      this.windHints[0].material.opacity
    ];
  }

  camera(local, t, cam) {
    // four story shots:
    //  0-.25  CLOSE on the planting contact (gardener + seed bed)
    //  .25-.55 medium side: the vine is born (gardener left, tip centre)
    //  .55-.82 one wide beat (the 12-unit gap IS the proposition) ->
    //          close tracking across the vine
    //  .82-1  the right island, wind ribbons beyond
    const plantT = win(local, 0, 0.25);
    const growT = win(local, 0.25, 0.55);
    const crossT = win(local, 0.55, 0.82);
    const arriveT = win(local, 0.82, 1);
    const u = 0.02 + crossT * 0.96;
    const p = this.vineCurve.getPoint(u);
    // shot A: planting close
    let px = lerp(-3.1, -2.8, plantT), py = lerp(0.15, 0.25, plantT), pz = 1.9;
    let lx = -4.35, ly = -0.2, lz = 0.2;
    // shot B: vine birth, medium side (gardener left, growing tip centre)
    const b = win(local, 0.21, 0.31);
    px = lerp(px, lerp(-1.2, 0.6, growT), b);
    py = lerp(py, lerp(0.4, 0.5, growT), b);
    pz = lerp(pz, lerp(3.8, 3.6, growT), b);
    lx = lerp(lx, lerp(-2.6, -1.2, growT), b);
    ly = lerp(ly, lerp(-0.35, -0.5, growT), b);
    lz = lerp(lz, 0.1, b);
    // shot C: wide gap (the proposition) -> close tracking across:
    // blend B -> wide at 0.55-0.63, wide -> track at 0.61-0.69
    const wA = win(local, 0.55, 0.63);
    const wB = win(local, 0.61, 0.69);
    const wideX = 0, wideY = 2.6, wideZ = 10.8;
    const trackX = p.x + 1.4, trackY = p.y + 1.0, trackZ = 3.0;
    const wideLookX = 0, wideLookY = -0.6, wideLookZ = 0;
    const trackLookX = p.x + 0.6, trackLookY = p.y + 0.15, trackLookZ = 0.05;
    const toWide = wA, toTrack = wB;
    px = lerp(px, wideX, toWide); py = lerp(py, wideY, toWide); pz = lerp(pz, wideZ, toWide);
    lx = lerp(lx, wideLookX, toWide); ly = lerp(ly, wideLookY, toWide); lz = lerp(lz, wideLookZ, toWide);
    px = lerp(px, trackX, toTrack); py = lerp(py, trackY, toTrack); pz = lerp(pz, trackZ, toTrack);
    lx = lerp(lx, trackLookX, toTrack); ly = lerp(ly, trackLookY, toTrack); lz = lerp(lz, trackLookZ, toTrack);
    // shot D: arrival island, wind beyond
    const d = win(local, 0.78, 0.88);
    px = lerp(px, 6.4, d); py = lerp(py, 0.9, d); pz = lerp(pz, 3.4, d);
    lx = lerp(lx, 4.5, d); ly = lerp(ly, -0.25, d); lz = lerp(lz, -0.2, d);
    cam.position.set(px, py, pz);
    cam.lookAt(lx, ly, lz);
  }

  dispose() {}
}
