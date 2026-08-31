// Chapter V — The Garden Meets the Sun (Phase 5, second in plan order).
// "Ask the sky to soften": a high exposed terrace where heat rays are
// physical threads; the gardener weaves through them, shields the final
// seed with a felt canopy, plants it in direct light, and it blooms into
// a rain halo that cools the sun.
//
// Beat table (plan):
//   0-.28   approaches the hot terrace — plants bleach, heat distortion rises
//   .28-.58 protects the seed with a canopy — cloud/felt layers shade it
//   .58-.82 plants the final seed in sunlight — sun rays become root-like threads
//   .82-1   the seed blooms into a rain halo — heat becomes warm light
//
// Contacts: hands -> seed/canopy; seed -> sun-thread field.
// Reversible: bleaching, canopy, seed position, thread droop, halo and
// heat are pure in local progress; velocity only shimmers a frame.
import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { CloudGardener } from '../kit/CloudGardener.js';
import { DrySunSystem } from '../kit/DrySunSystem.js';
import { RainSystem } from '../kit/RainSystem.js';
import { lerp, clamp, win, mulberry32 } from '../utils/math.js';

export class SunTerraceScene extends BaseScene {
  build(ctx) {
    super.build(ctx);
    const kit = this.kit;
    const rnd = mulberry32(31);

    // ---- exposed terrace: high flat cloud platform ----
    const bed = kit.soilBed({ w: 8, d: 5 });
    bed.position.y = -0.9;
    this.group.add(bed);
    const under = kit.cloud({ puffs: 7, scale: 1.8, dark: true });
    under.position.y = -1.7;
    this.group.add(under);
    for (let i = 0; i < 3; i++) {
      const b = kit.cloud({ puffs: 3, scale: 1 + rnd() });
      b.position.set(-7 + i * 7, 3 + rnd() * 3, -7 - rnd() * 4);
      this.group.add(b);
    }

    // ---- the dry sun: disc high above, heat threads fanning down across
    // the terrace (physical rays the gardener weaves through) ----
    this.sun = new DrySunSystem(kit);
    this.sun.position.set(0, 6.8, -4.5);
    this.sun.rotation.x = 0.5; // tilt the thread fan toward the terrace
    this.group.add(this.sun);

    // ---- plants that bleach with heat, re-wet when the halo blooms ----
    this.plants = [];
    for (let i = 0; i < 4; i++) {
      const f = kit.flower({ color: i % 2 ? '#e8a0b4' : '#9fbf8f', scale: 0.8 });
      f.position.set(-2.6 + i * 1.7, -0.55, -1 + (i % 2) * 1.6);
      this.group.add(f);
      // register every petal/core material for bleach (dry straw -> living color)
      f.traverse((n) => {
        if (n.isMesh) this.sun.registerBleach(n, '#d8cf9e', new THREE.Color(n.material.color).clone());
      });
      this.plants.push(f);
    }

    // ---- the final seed: held in hand, planted in direct light ----
    this.seedAnchor = new THREE.Object3D();
    this.seedAnchor.position.set(0.6, -0.5, 0.4);
    this.group.add(this.seedAnchor);
    this.seed = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 10, 8),
      new THREE.MeshLambertMaterial({ color: '#d99a3d', emissive: new THREE.Color('#d99a3d').multiplyScalar(0.3) })
    );
    this.group.add(this.seed);

    // ---- felt canopy: the shadow the gardener carries (hand -> canopy) ----
    this.canopy = new THREE.Group();
    const felt = new THREE.Mesh(new THREE.CircleGeometry(0.85, 18), kit.matFelt);
    felt.rotation.x = -Math.PI / 2 + 0.12;
    this.canopy.add(felt);
    const shade = kit.cloud({ puffs: 3, scale: 0.5, dark: true });
    shade.position.y = 0.12;
    this.canopy.add(shade);
    this.canopy.scale.setScalar(0.001);
    this.group.add(this.canopy);

    // ---- rain halo: bead ring + bloom that cools the sun (0.82-1) ----
    this.halo = new THREE.Group();
    this.halo.position.set(0.6, -0.35, 0.4);
    this.haloBeads = [];
    const beadGeo = kit.rainBeadGeometry();
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const bead = new THREE.Mesh(beadGeo, kit.matWater);
      bead.position.set(Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9);
      this.halo.add(bead);
      this.haloBeads.push({ node: bead, a });
    }
    this.bloom = kit.flower({ color: '#f2d8a0', petals: 8, scale: 0.9 });
    this.bloom.position.y = 0.35;
    this.bloom.scale.setScalar(0.001);
    this.halo.add(this.bloom);
    this.group.add(this.halo);

    // ---- light rain as the halo opens ----
    this.rain = new RainSystem(kit, ctx.quality, { max: Math.floor(ctx.tier.rain * 0.5) });
    this.rain.mesh.position.set(0.6, 1.5, 0.4);
    this.group.add(this.rain.mesh);

    // ---- gardener ----
    this.gardener = new CloudGardener(kit);
    this.group.add(this.gardener.group);
    this.warmLight = new THREE.PointLight('#ffe9b0', 0.6, 14);
    this.warmLight.position.set(0, 3.5, 2);
    this.group.add(this.warmLight);
  }

  update(local, dt, t) {
    const reduced = this.ctx.reducedMotion;
    const approachT = win(local, 0, 0.28);
    const plantT = win(local, 0.58, 0.82);
    const bloomT = win(local, 0.82, 1);
    // transient velocity shimmer (decays; no persistent state)
    this._vel = (this._vel || 0) * Math.max(0, 1 - dt * 3) + clamp(t.velocity, -1, 1) * 0.12;
    const vel = reduced ? 0 : this._vel;

    // heat: full dry-sun on approach, cools as the halo blooms; heat
    // distortion rises with it (thread reach + shimmer in the kit)
    const heat = lerp(0.9, 0.28, win(local, 0.74, 1)) + Math.abs(vel) * 0.15;
    this.sun.setHeat(heat, t.time);
    // plants bleach with heat, re-wet with the halo (seed -> world consequence)
    const wet = lerp(0.12, 0.95, win(local, 0.8, 1));
    this.sun.setWetness(wet);
    // thread field droops toward the planted seed (sun rays become
    // root-like threads) — the seed -> sun-thread contact
    const droop = win(local, 0.58, 0.85);
    this.sun.threads.forEach((th, i) => {
      const base = th.node.rotation.z;
      th.node.rotation.z = base + droop * 0.5 + Math.sin(t.time * 1.2 + i) * 0.03 + vel * 0.25;
      th.node.material.color.setRGB(1, lerp(0.87, 0.75, droop), lerp(0.54, 0.3, droop));
    });

    // gardener: approach -> shield -> plant -> release
    const gx = lerp(-3.4, 0.2, approachT);
    this.gardener.group.position.set(gx, -0.55, 0.6 - approachT * 0.2);
    const action = local < 0.28 ? 'walk' : local < 0.82 ? 'water' : 'reach';
    this.gardener.pose(action, t.time * (1 - reduced * 0.7), 0.2, plantT * 0.25);

    // canopy: rises with the gardener, shades the seed while protecting.
    // Anchored to the (pure) gardener position, not the swinging hand, so
    // reverse scrubbing is deterministic.
    const canopyS = 0.001 + win(local, 0.26, 0.4) * (1 - win(local, 0.56, 0.7));
    this.canopy.scale.setScalar(canopyS);
    const gp = this.gardener.group.position;
    this.canopy.position.set(gp.x - 0.35, gp.y + 0.95, gp.z + 0.15);
    // seed: held at a stable carry point until the plant beat, then into
    // the soil (pure in local — the hand reaches to it, not vice versa)
    const carry = new THREE.Vector3(gp.x + 0.3, gp.y + 0.45, gp.z + 0.2);
    const planted = this.seedAnchor.position.clone();
    this.seed.position.lerpVectors(carry, planted, plantT);
    this.seed.scale.setScalar(1 + droop * 0.3);
    // contact distance (hand -> seed) for QA anchors
    const hv = new THREE.Vector3();
    this.gardener.handR.getWorldPosition(hv);
    this._contactDist = this.seed.position.distanceTo(hv);

    // rain halo: beads orbit-open, bloom unfurls, light rain begins
    this.haloBeads.forEach((b, i) => {
      b.node.position.set(Math.cos(b.a) * (0.4 + bloomT * 0.7), bloomT * 0.5 + Math.sin(t.time * 2 + i) * 0.05, Math.sin(b.a) * (0.4 + bloomT * 0.7));
      b.node.scale.set(1, 1 + bloomT, 1);
    });
    this.bloom.scale.setScalar(0.001 + bloomT * 1);
    this.halo.position.y = -0.35 + bloomT * 0.5;
    this.rain.setIntensity(bloomT * 0.4, t.time);
    // heat becomes warm light: the sun's color softens, warm light rises
    this.warmLight.intensity = 0.4 + bloomT * 1.2;
    this.sun.sun.scale.setScalar(0.8 + heat * 0.5 - bloomT * 0.3);
  }

  structuralState() {
    const g = this.gardener.group.position;
    return [
      g.x, g.y, g.z,
      this.canopy.scale.x,
      this.seed.position.x, this.seed.position.y,
      this.bloom.scale.x,
      this.rain.intensity
    ];
  }

  camera(local, t, cam) {
    // setup: high exposed approach -> contact: low at the seed and threads
    // -> consequence: pull back as the halo cools the sun
    const approachT = win(local, 0, 0.28);
    const contactT = win(local, 0.28, 0.7);
    const bloomT = win(local, 0.82, 1);
    cam.position.set(
      lerp(-3.2, 1.6, contactT) - bloomT * 1.2,
      lerp(4.4, 1.1, contactT) + bloomT * 1.6,
      lerp(8.6, 5.2, contactT) + bloomT * 2.2
    );
    cam.lookAt(lerp(-1, 0.6, approachT + contactT * 0.5), lerp(0.2, -0.4, contactT) + bloomT * 0.6, -0.5 + bloomT * 1.2);
  }

  dispose() {
    this.rain.dispose();
  }
}
