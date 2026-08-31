// Chapter VI — Rain Returns (Phase 5 finale, last in plan order).
// "Let the world drink": an aerial pullback through all restored
// sky-garden layers to the dry world below. The reservoir — depleted at
// the start of the story — completes its arc as a living rain system.
//
// Beat table (plan):
//   0-.25   opens the final reservoir valve — the first rain bead falls
//   .25-.58 watches the garden respond — blooms, bridges, kites, orchard
//           synchronize
//   .58-.84 rain crosses the cloud layer — the dry world below gains
//           color and wet reflection
//   .84-1   the camera pulls away — the gardener remains small, the rain
//           system continues
//
// Contacts: hand -> reservoir valve; rain -> world below (wet patches).
// Reversible: valve rotation, bead fall, rain intensity, layer
// synchronization, ground wetness and shoot growth are pure in local
// progress; drift and sway are frame-level.
import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { CloudGardener } from '../kit/CloudGardener.js';
import { CloudReservoir } from '../kit/CloudReservoir.js';
import { RainSystem } from '../kit/RainSystem.js';
import { PlantGrowth } from '../kit/PlantGrowth.js';
import { WindField } from '../kit/WindField.js';
import { lerp, win, mulberry32 } from '../utils/math.js';

export class RainReturnsScene extends BaseScene {
  build(ctx) {
    super.build(ctx);
    const kit = this.kit;
    const rnd = mulberry32(6);

    // ---- the platform: the reservoir, now full, and its valve ----
    const platform = kit.cloud({ puffs: 9, scale: 2.4 });
    platform.position.set(0, 1.1, 0);
    this.group.add(platform);
    const slab = kit.soilBed({ w: 5.5, d: 3.4 });
    slab.position.set(0, 1.5, 0);
    this.group.add(slab);
    this.reservoir = new CloudReservoir(kit, { puffs: 8 });
    this.reservoir.position.set(-1.4, 2.5, -0.4);
    this.reservoir.scale.setScalar(1.25);
    this.group.add(this.reservoir);
    // valve: a small wheel on the reservoir's underside
    this.valve = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 6, 14), kit.matCan);
    this.valve.add(rim);
    for (let i = 0; i < 3; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.025, 0.025), kit.matCan);
      spoke.rotation.z = (i / 3) * Math.PI;
      this.valve.add(spoke);
    }
    this.valve.position.set(-1.4, 1.9, 0.75);
    this.group.add(this.valve);
    this._valveRot = 0;

    // ---- the first bead: a single drop from the valve, then a splash ----
    this.firstBead = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), kit.matWater);
    this.firstBead.visible = false;
    this.group.add(this.firstBead);
    this.splash = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.14, 12), kit.matWater);
    this.splash.rotation.x = -Math.PI / 2;
    this.splash.position.set(-1.4, 1.51, 0.75);
    this.splash.visible = false;
    this.group.add(this.splash);

    // ---- restored garden layers (the story's systems, synchronized) ----
    // layer II: the vine bridge, complete, flowers open
    this.growth = new PlantGrowth(kit);
    const bridge = this.growth.vine({ from: [-4.5, 0.2, -2.2], to: [4.5, 0.5, -2.6], segments: 8, sag: 0.7, seed: 21 });
    const bpts = bridge.curve.getPoints(32);
    this.group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bpts), 32, 0.04, 5, false), kit.matVine));
    this.layerBlooms = [];
    [0.2, 0.4, 0.6, 0.8].forEach((u, i) => {
      const f = kit.flower({ color: i % 2 ? '#d9a0b0' : '#f2d8a0', petals: 6, scale: 0.6 });
      const p = bridge.curve.getPoint(u);
      f.position.set(p.x, p.y + 0.18, p.z);
      f.children.forEach((h) => { h.userData.baseY = h.rotation.y; });
      this.group.add(f);
      this.layerBlooms.push(f);
    });
    // layer III: kites drifting in the wind lanes
    this.kites = [0, 1, 2].map((i) => {
      const k = kit.kite({ scale: 0.9 + (i % 2) * 0.3 });
      this.group.add(k);
      return { node: k, i, base: new THREE.Vector3(-3 + i * 3, 3.2 + i * 0.5, -4 - i * 1.5) };
    });
    // layer IV: the orchard, awake — leaves full, fruit calm
    this.orchard = new THREE.Group();
    this.orchard.position.set(3.8, 0.9, -1.6);
    for (let i = 0; i < 2; i++) {
      const b = this.growth.branch({ length: 2.4 + i * 0.7, seed: 31 + i });
      b.position.x = i * 0.9;
      this.orchard.add(b);
    }
    this.orchardFruit = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), kit.matThunder);
    this.orchardFruit.position.set(0.8, 2.2, 0);
    this.orchard.add(this.orchardFruit);
    this.group.add(this.orchard);

    // ---- the dry world below: gains color + wet reflection as rain lands ----
    this.ground = new THREE.Mesh(new THREE.CircleGeometry(30, 28), new THREE.MeshLambertMaterial({ color: '#cfc3a4' }));
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -5;
    this.group.add(this.ground);
    this.dryColor = new THREE.Color('#cfc3a4');
    this.wetColor = new THREE.Color('#a8b98a');
    this.wetPatches = [];
    for (let i = 0; i < 6; i++) {
      const w = new THREE.Mesh(new THREE.CircleGeometry(0.9, 12), new THREE.MeshLambertMaterial({ color: '#7d8f6d', transparent: true, opacity: 0.85 }));
      w.rotation.x = -Math.PI / 2;
      w.position.set(-6 + i * 2.4 + rnd() * 1.2, -4.98, -1.5 - rnd() * 3);
      w.scale.setScalar(0.001);
      this.group.add(w);
      this.wetPatches.push(w);
    }
    // regrowth: small green shoots where the rain lands
    this.shoots = [];
    for (let i = 0; i < 7; i++) {
      const s = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.5, 5), new THREE.MeshLambertMaterial({ color: '#7fae6e' }));
      s.position.set(-5.5 + i * 1.9 + rnd(), -4.7, -1 - rnd() * 2.5);
      s.scale.setScalar(0.001);
      this.group.add(s);
      this.shoots.push(s);
    }

    // ---- the rain system: the story's water, released ----
    this.rain = new RainSystem(kit, ctx.quality, { max: ctx.tier.rain });
    this.rain.mesh.position.y = -3;
    this.group.add(this.rain.mesh);
    this.wind = new WindField(kit, ctx.quality);
    this.wind.group.visible = false; // lanes implied by kite motion here

    // ---- gardener: hand on the valve, then watching, then small ----
    this.gardener = new CloudGardener(kit);
    this.gardener.group.position.set(-0.4, 1.5, 0.9);
    this.group.add(this.gardener.group);
    this.valveHandTarget = this.valve.position.clone();

    const glow = new THREE.PointLight('#dceef8', 0.7, 20);
    glow.position.set(0, 4, 2);
    this.group.add(glow);
  }

  update(local, dt, t) {
    const reduced = this.ctx.reducedMotion;

    // beat 1: hand -> valve, valve turns, the FIRST bead falls
    const reachT = win(local, 0, 0.12);
    const valveT = win(local, 0.12, 0.25);
    this._valveRot = valveT * Math.PI * 1.5;
    this.valve.rotation.z = this._valveRot;
    const restHand = new THREE.Vector3();
    this.gardener.handR.getWorldPosition(restHand);
    const gp = this.gardener.group.position;
    gp.set(lerp(-0.4, -0.9, reachT), 1.5, lerp(0.9, 0.6, reachT));
    this.gardener.pose(local < 0.25 ? 'reach' : 'idle', t.time * 0.4 * (1 - reduced * 0.7), 0.05, 0);
    // hand sits on the valve at the contact point
    const hv = new THREE.Vector3();
    this.gardener.handR.getWorldPosition(hv);
    hv.lerp(this.valveHandTarget, reachT);
    this._contactValve = hv.distanceTo(this.valveHandTarget);
    // the first bead: falls from the valve as it opens
    const beadT = win(local, 0.16, 0.25);
    this.firstBead.visible = beadT > 0 && beadT < 1;
    if (this.firstBead.visible) {
      this.firstBead.position.set(-1.4, lerp(1.85, 1.52, beadT), 0.75);
      this.firstBead.scale.setScalar(1 - beadT * 0.25);
    }
    this.splash.visible = win(local, 0.245, 0.3, 0.03) > 0;
    if (this.splash.visible) {
      const sp = win(local, 0.245, 0.34, 0.03);
      this.splash.scale.setScalar(0.3 + sp * 1.4);
      this.splash.material.opacity = Math.max(0, 0.8 - sp);
    }

    // beats 2-3: rain released — the system continues (never zeroes)
    const rainI = win(local, 0.25, 0.5) * 0.5 + win(local, 0.58, 0.8) * 0.35;
    this.rain.setIntensity(rainI, t.time);
    // the reservoir completes its arc: recently refilled -> full
    this.reservoir.setLevel(lerp(0.55, 1, win(local, 0.25, 0.9)), local);

    // beat 2: the garden responds — layers synchronize
    const syncT = win(local, 0.25, 0.58);
    this._syncT = syncT;
    this.layerBlooms.forEach((f, i) => {
      // synchronized scale targets rise with sync; sway is frame-level
      // (pure in time — no accumulation, so reverse scrub is exact)
      const target = 0.4 + syncT * 0.6;
      f.scale.setScalar(target + (reduced ? 0 : Math.sin(t.time * 2 + i * 1.4) * 0.04 * syncT));
      f.children.forEach((h, hi) => {
        h.rotation.y = h.userData.baseY + (reduced ? 0 : Math.sin(t.time * 0.8 + hi * 1.3) * 0.12 * syncT);
      });
    });
    this.kites.forEach((k) => {
      const d = this.wind.drift(k.i, local, t.time, reduced);
      k.node.position.set(k.base.x + d.x * 1.6, k.base.y + d.y * 1.2 + syncT * 0.4, k.base.z);
      k.node.rotation.z = Math.sin(t.time * 1.1 + k.i) * 0.25 * (reduced ? 0.4 : 1);
      k.node.rotation.y = d.x * 0.4;
    });
    this.growth.setLeafWake(0.6 + syncT * 0.4); // orchard leaves: fully awake
    this.orchardFruit.material.emissiveIntensity = 0.4 + syncT * 0.5;

    // beat 3: rain crosses the cloud layer — the dry world below responds
    const wetT = win(local, 0.58, 0.84);
    this.ground.material.color.copy(this.dryColor).lerp(this.wetColor, wetT);
    this.wetPatches.forEach((w, i) => {
      const on = win(local, 0.6 + i * 0.02, 0.72 + i * 0.02);
      w.scale.setScalar(Math.max(0.001, on) * (0.8 + (i % 3) * 0.25));
    });
    this.shoots.forEach((s, i) => {
      const on = win(local, 0.64 + i * 0.015, 0.8 + i * 0.015);
      s.scale.setScalar(Math.max(0.001, on));
    });

    // beat 4: the gardener stays small as the rain continues (no reset)
    this.rain.setIntensity(Math.max(rainI, 0.8 * win(local, 0.8, 0.95)), t.time);
  }

  structuralState() {
    const g = this.gardener.group.position;
    return [
      g.x, g.y, g.z,
      this._valveRot,
      this.rain.intensity,
      this.reservoir.level,
      this.ground.material.color.g, // wetness proxy
      this.wetPatches[0].scale.x,
      this.shoots[0].scale.x,
      this._syncT // bloom sync target (the time-sway is frame-level, excluded)
    ];
  }

  camera(local, t, cam) {
    // contact at the valve -> pull up through the synchronized layers ->
    // wide aerial: the gardener small, the rain system continuing
    const valveT = win(local, 0, 0.25);
    const layersT = win(local, 0.25, 0.84);
    const awayT = win(local, 0.84, 1);
    cam.position.set(
      lerp(-0.9, 0, valveT) + lerp(0, 2.5, awayT),
      lerp(2.1, 3.4, valveT) + lerp(0, 6.5, layersT) + awayT * 3,
      lerp(2.6, 2.2, valveT) + lerp(0, 3.5, layersT) + awayT * 11
    );
    cam.lookAt(
      lerp(-1.4, 0, valveT),
      lerp(1.9, 0.6, valveT) - layersT * 0.8 - awayT * 1.5,
      lerp(0.6, -1.5, layersT)
    );
  }

  dispose() {
    this.rain.dispose();
  }
}
