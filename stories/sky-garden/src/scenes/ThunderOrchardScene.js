// Chapter IV — The Thunder Orchard (Phase 3 technical benchmark).
// "Harvest a storm": vertical orchard of thunder fruit; rain stored in
// seed pods; the gardener climbs, catches, and opens the fruit over the
// cloud reservoir.
//
// Beat table (plan):
//   0-.22   enters dry orchard — fruit glows faintly, branches sag
//   .22-.55 climbs wet branch ladder — branches wake and grow leaves
//   .55-.78 catches thunder fruit — lightning travels through felt veins
//   .78-1   opens fruit over reservoir — local rain begins, sun retreats
//
// Contacts: feet/hands -> branches; hands -> fruit; fruit -> reservoir.
// Reversible: branch wake, climb position, fruit path, rain and sun heat
// are all pure functions of local progress.
import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { CloudGardener } from '../kit/CloudGardener.js';
import { CloudReservoir } from '../kit/CloudReservoir.js';
import { PlantGrowth } from '../kit/PlantGrowth.js';
import { DrySunSystem } from '../kit/DrySunSystem.js';
import { RainSystem } from '../kit/RainSystem.js';
import { WindField } from '../kit/WindField.js';
import { lerp, clamp, win, mulberry32 } from '../utils/math.js';

export class ThunderOrchardScene extends BaseScene {
  build(ctx) {
    super.build(ctx);
    const kit = this.kit;
    const tier = ctx.tier;
    this.growth = new PlantGrowth(kit);

    // ---- orchard: vertical branch ladder on a cloud island ----
    const island = kit.cloud({ puffs: 6, scale: 1.6, dark: true });
    island.position.set(0, -2.2, 0);
    this.group.add(island);
    const bed = kit.soilBed({ w: 8, d: 5 });
    bed.position.y = -1.6;
    this.group.add(bed);

    this.branches = [];
    const n = 4;
    for (let i = 0; i < n; i++) {
      const b = this.growth.branch({ length: 2.6 + i * 0.5, seed: 21 + i * 7 });
      b.position.set(-1.2 + (i % 2) * 2.4, -1.3, -0.8 + (i % 3) * 0.7);
      b.rotation.set(0, (i - 1.5) * 0.25, 0);
      this.group.add(b);
      this.branches.push(b);
    }
    // shared leaf wake (pure)
    this._leaves = this.branches.map((b) => b); // growth.setLeafWake per branch

    // ---- thunder fruit: glows faintly dry, lightning through felt veins ----
    this.fruitGroup = new THREE.Group();
    const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), kit.matThunder);
    this.fruitGroup.add(fruit);
    this.veins = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const vein = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.02, 0.6, 4),
        new THREE.MeshBasicMaterial({ color: '#bcd2ff', transparent: true, opacity: 0.2 })
      );
      vein.position.set(Math.cos(a) * 0.28, Math.sin(a) * 0.2, 0);
      vein.rotation.z = a;
      this.fruitGroup.add(vein);
      this.veins.push(vein);
    }
    // pod: the rain is stored inside (opens at .78)
    this.pod = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), new THREE.MeshLambertMaterial({ color: '#8a97b8', side: THREE.DoubleSide }));
    this.pod.rotation.x = Math.PI;
    this.fruitGroup.add(this.pod);
    // hangs from the highest branch tip when dry; follows the gardener after catch
    this.group.add(this.fruitGroup);
    this._fruitHang = new THREE.Vector3(1.2, 2.6, -0.1);
    this.fruitGroup.position.copy(this._fruitHang);

    // ---- gardener: enters (0-.22), climbs (.22-.55), catches (.55-.78), opens over reservoir (.78-1) ----
    this.gardener = new CloudGardener(kit);
    this.group.add(this.gardener.group);
    // branch anchors for contact verification
    this._branchAnchors = [new THREE.Vector3(-1.2, -0.5, -0.8), new THREE.Vector3(1.2, 0.2, -0.1), new THREE.Vector3(-1.2, 1.0, -0.1), new THREE.Vector3(1.2, 1.7, 0.6)];

    // ---- reservoir + sun + rain + wind (shared systems) ----
    this.reservoir = new CloudReservoir(kit, { puffs: 6 });
    this.reservoir.position.set(0, 0.4, 2.6);
    this.group.add(this.reservoir);
    this.sun = new DrySunSystem(kit);
    this.sun.position.set(5.5, 4.5, -6);
    this.group.add(this.sun);
    this.rain = new RainSystem(kit, ctx.quality, { max: tier.rain });
    this.rain.mesh.position.y = 1.5;
    this.group.add(this.rain.mesh);
    this.wind = new WindField(kit, ctx.quality);
    this.wind.group.position.set(-4, 1, -5);
    this.group.add(this.wind.group);
  }

  update(local, dt, t) {
    const dry = 1 - win(local, 0.22, 0.4);        // branches sag dry -> wake
    const wake = win(local, 0.26, 0.55, 0.06);    // leaves grow (pure)
    for (const b of this.branches) {
      b.rotation.z = dry * 0.12;                  // sag when dry
      b.children[0].scale.y = 1;                  // trunk stays
      this.growth.setLeafWake(wake);
    }
    // gardener path: enter -> climb -> reach fruit -> carry to reservoir
    const climbT = win(local, 0.22, 0.55);
    const carryT = win(local, 0.55, 0.78);
    const openT = win(local, 0.78, 1);
    const gx = lerp(-3.2, this._fruitHang.x, climbT) * (1 - carryT * 0.4) ;
    const gy = lerp(-1.2, this._fruitHang.y, climbT) + (1 - carryT) * 0;
    this.gardener.group.position.set(gx, gy, -0.2);
    const action = local < 0.22 ? 'walk' : local < 0.55 ? 'climb' : local < 0.7 ? 'reach' : local < 0.78 ? 'reach' : 'water';
    this.gardener.pose(action, t.time * (1 - this.ctx.reducedMotion * 0.7), t.wind);
    // contact: feet -> branch anchor nearest the climb
    const nearest = this._branchAnchors[Math.min(3, Math.floor(climbT * 3.99))];
    this._contactDist = this.gardener.anchorDistance(this.gardener.footR, nearest);

    // fruit: hangs dry; caught at .55 (snaps to hand); carried; opens over reservoir
    if (carryT <= 0) {
      this.fruitGroup.position.copy(this._fruitHang);
      this.fruitGroup.rotation.z = Math.sin(t.time * 0.6) * 0.08 * (1 - this.ctx.reducedMotion);
    } else {
      const hand = this.gardener.handR;
      const hv = new THREE.Vector3();
      hand.getWorldPosition(hv);
      const resTarget = this.reservoir.position.clone().add(new THREE.Vector3(0, 0.7, 0));
      this.fruitGroup.position.lerpVectors(hv, resTarget, win(local, 0.7, 0.85));
    }
    // lightning through felt veins while catching (.55-.78)
    const storm = win(local, 0.55, 0.78, 0.04);
    const flash = storm * (0.5 + 0.5 * Math.sin(t.time * 9)) * (this.ctx.reducedMotion ? 0.3 : 1);
    for (const v of this.veins) v.material.opacity = 0.15 + flash * 0.85;
    this.pod.visible = openT < 0.999;             // pod opens as fruit empties
    this.pod.rotation.x = Math.PI - openT * 1.9;

    // water transfer -> reservoir level (pure in openT)
    this.reservoir.setLevel(0.15 + openT * 0.85, local);
    // local rain consequence (.78-1)
    this.rain.setIntensity(openT * 0.85, t.time);
    // sun retreats briefly as rain returns
    this.sun.setHeat(lerp(0.85, 0.25, win(local, 0.74, 0.95)), t.time);
    // wind field response (pure + transient velocity)
    this.wind.setVelocity(t.velocity, dt);
    this.wind.update(local, t.time, dt);
  }

  structuralState() {
    const g = this.gardener.group.position;
    const f = this.fruitGroup.position;
    const b0 = this.branches[0].rotation.z;
    const leaf = this.branches[0].children.length ? this.growth.leaves[0].scale.x : 0;
    return [g.x, g.y, g.z, f.x, f.y, f.z, this.reservoir.level, this.rain.intensity, this.sun.heat, b0, leaf];
  }

  camera(local, t, cam) {
    // four story shots:
    //  0-.22  setup: the dry orchard, branches sagging
    //  .22-.55 CLOSE follow of the climb (the gardener rises, big in frame)
    //  .55-.78 CLOSE on the catch: hand -> thunder fruit
    //  .78-1  consequence: fruit over the reservoir, rain begins
    const climbT = win(local, 0.22, 0.55);
    const carryT = win(local, 0.55, 0.78);
    const openT = win(local, 0.78, 1);
    const gx = lerp(-3.2, 1.2, climbT) * (1 - carryT * 0.4);
    const gy = lerp(-1.2, 2.6, climbT);
    let px = -4.2, py = 0.2, pz = 5.0;
    let lx = 0, ly = 0.2, lz = -0.5;
    let cs = 1.3;
    // climb follow (close, rides the gardener up)
    const a = win(local, 0.18, 0.28);
    px = lerp(px, gx + 2.0, a); py = lerp(py, gy + 0.7, a); pz = lerp(pz, 2.8, a);
    lx = lerp(lx, gx, a); ly = lerp(ly, gy + 0.2, a); lz = lerp(lz, 0, a);
    cs = lerp(cs, 1.45, a);
    // catch close (fruit at 1.2, 2.6, -0.1)
    const b = win(local, 0.51, 0.61);
    px = lerp(px, 2.6, b); py = lerp(py, 2.7, b); pz = lerp(pz, 1.4, b);
    lx = lerp(lx, 1.2, b); ly = lerp(ly, 2.55, b); lz = lerp(lz, -0.1, b);
    cs = lerp(cs, 1.55, b);
    // open over the reservoir (0, 0.4, 2.6)
    const c = win(local, 0.74, 0.86);
    px = lerp(px, 1.8, c); py = lerp(py, 1.3, c); pz = lerp(pz, 4.8, c);
    lx = lerp(lx, 0.2, c); ly = lerp(ly, 0.9, c); lz = lerp(lz, 2.2, c);
    cs = lerp(cs, 1.35, c);
    // per-shot push-in: ride the camera 1/cs closer along the view ray
    // (contact shots big, wide shots wide) — with FOV 42 the story fills
    // the frame instead of floating in it
    const f = 1 / cs;
    cam.position.set(lx + (px - lx) * f, ly + (py - ly) * f, lz + (pz - lz) * f);
    cam.lookAt(lx, ly, lz);
  }

  dispose() {
    this.rain.dispose();
    this.wind.dispose();
  }
}
