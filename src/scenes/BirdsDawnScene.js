import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { Keeper } from '../characters/Keeper.js';
import { TheSea } from '../characters/TheSea.js';
import { SeaSurface } from '../effects/SeaSurface.js';
import { ParallaxLayers } from '../effects/ParallaxLayers.js';
import { PALETTES } from '../utils/constants.js';
import { win, easeOut, easeInOut, clamp, lerp, mulberry32 } from '../utils/math.js';

const P = PALETTES.dawn;

// Chapter 6 — Birds of Morning.
// Spatial proposition: RELEASE. This is the only chapter whose camera
// ends further away than it began. Everything else in the story has been
// a push-in; the ending is a pull-out, and the last thing the reader
// sees is a coast with more movement in it than the harbour had at dusk.
//
// The storm does not get switched off. It physically walks off frame to
// the left while the dawn wash comes up behind it, so the change of
// weather is something you watch happen rather than something you notice
// has already happened.
const CAM = [
  { t: 0.0, pos: [1.2, 7.7, 4.4], look: [-2.4, 7.0, -10], fov: 52 },
  { t: 0.18, pos: [2.6, 7.6, 5.6], look: [-1.0, 7.4, -12], fov: 48 },
  { t: 0.34, pos: [4.4, 7.4, 6.2], look: [0.4, 7.6, -6], fov: 44 },
  { t: 0.5, pos: [3.6, 7.9, 4.2], look: [0.6, 7.8, -2], fov: 38 },
  { t: 0.66, pos: [6.4, 8.4, 8.0], look: [1.0, 8.4, -8], roll: -0.02, fov: 46 },
  { t: 0.8, pos: [11.0, 9.6, 15.0], look: [0, 7.0, -10], fov: 52 },
  { t: 0.92, pos: [18.0, 11.5, 26.0], look: [-1, 5.0, -12], roll: 0.02, fov: 58 },
  { t: 1.0, pos: [26.0, 14.0, 38.0], look: [-2, 3.5, -14], roll: 0.03, fov: 62 }
];

const BEATS = [
  { at: 0, text: 'Morning. The storm walks backwards off the coast, taking its wall with it.' },
  { at: 0.24, text: 'Dawn comes through the stained glass in colours the lantern room has not held for years.' },
  { at: 0.46, text: 'One by one, the names fold themselves into birds.' },
  { at: 0.66, text: 'They leave along the beam and cross the harbour.' },
  { at: 0.86, text: 'The keeper stays: small, and finished, and at peace, above a coast full of movement again.' }
];

export class BirdsDawnScene extends BaseScene {
  build() {
    const kit = this.experience.kit;
    const rnd = mulberry32(131);
    this._dummy = new THREE.Object3D();
    this.parallax = new ParallaxLayers();

    /* ---- water, wide and calm again ---- */
    this.sea = new SeaSurface();
    this.sea.mesh.position.y = -1.2;
    this.sea.mesh.scale.setScalar(1.6);
    this.group.add(this.sea.mesh);
    // lamp and sun both lie down on the water as long soft streaks
    this.reflections = [];
    for (let i = 0; i < 9; i++) {
      const streak = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5 + rnd() * 2.6, 0.1),
        new THREE.MeshBasicMaterial({ color: '#ffd9a0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })
      );
      streak.rotation.x = -Math.PI / 2;
      streak.position.set(-3 + rnd() * 8, -1.1, 2 + i * 2.4);
      this.group.add(streak);
      this.reflections.push({ node: streak, ph: rnd() * Math.PI * 2, w: streak.geometry.parameters.width });
    }

    /* ---- the storm, leaving ---- */
    this.stormBank = new THREE.Group();
    this.group.add(this.stormBank);
    for (let i = 0; i < this.tiered(9, 6, 4); i++) {
      const slab = kit.makeCloud(10 + i * 2.6, 0.72, '#2b4250');
      slab.position.set(-4 + (i % 3) * 5, 6 + (i % 4) * 2.6, -16 - (i % 3) * 5);
      slab.userData = { x: slab.position.x, sp: 0.6 + (i % 4) * 0.25 };
      this.stormBank.add(slab);
    }
    this.stormRidge = kit.makeSeaRidge({ width: 70, height: 13, seed: 31, color: '#12303c', lean: 0.5 });
    this.stormRidge.position.set(-10, 0, -26);
    this.group.add(this.stormRidge);

    /* ---- the dawn itself: watercolor washes coming up behind ---- */
    this.dawnBands = [];
    for (let i = 0; i < 6; i++) {
      const band = kit.makeCloud(14 - i * 1.2, 0, i % 2 ? P.peach : P.cream);
      band.position.set(2 + i * 2.4, 4.4 + i * 1.9, -30 + i * 1.4);
      this.group.add(band);
      this.parallax.add(band, { drift: 0.06 + i * 0.02, wrap: 64, bob: 0.12, phase: i * 1.1 });
      this.dawnBands.push(band);
    }
    this.sun = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: kit.tex('glow'), color: '#ffdda4', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })
    );
    this.sun.position.set(14, 3.4, -34);
    this.sun.scale.setScalar(16);
    this.group.add(this.sun);

    /* ---- the lantern room, from outside, with stained glass ---- */
    // Every height in this chapter is derived from the tower rather than
    // guessed, so the keeper stands on the gallery instead of beside it.
    const TOWER_BASE = 0.4;
    const TOWER_H = 7.4;
    this.towerAxis = new THREE.Vector2(0, -0.6);
    this.galleryY = TOWER_BASE + TOWER_H + 0.07;
    this.lampY = TOWER_BASE + TOWER_H + 0.6;

    this.tower = kit.makeLighthouse({ height: TOWER_H, wall: '#f3e6ca', band: P.coral });
    this.tower.position.set(this.towerAxis.x, TOWER_BASE, this.towerAxis.y);
    this.group.add(this.tower);
    this.stained = [];
    const stainColors = ['#e2705f', '#f0b463', '#8fc3b8', '#c98fb0', '#f2dc98', '#7fa9c4'];
    for (let i = 0; i < 12; i++) {
      const pane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.62, 1.5),
        new THREE.MeshBasicMaterial({
          color: stainColors[i % stainColors.length],
          transparent: true,
          opacity: 0.12,
          side: THREE.DoubleSide,
          depthWrite: false,
          toneMapped: false
        })
      );
      const a = (i / 12) * Math.PI * 2;
      pane.position.set(Math.cos(a) * 1.06, this.lampY, Math.sin(a) * 1.06 - 0.6);
      pane.rotation.y = -a + Math.PI / 2;
      this.group.add(pane);
      this.stained.push(pane);
    }
    // colour thrown onto the gallery floor by the glass
    this.stainedFloor = new THREE.Mesh(
      new THREE.CircleGeometry(2.6, 24),
      new THREE.MeshBasicMaterial({ color: '#f0b463', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })
    );
    this.stainedFloor.rotation.x = -Math.PI / 2;
    this.stainedFloor.scale.setScalar(0.52);
    this.stainedFloor.position.set(0, this.galleryY + 0.02, -0.6);
    this.group.add(this.stainedFloor);

    this.lampCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 14, 10),
      new THREE.MeshBasicMaterial({ color: '#fff3cd', transparent: true, opacity: 0.9, toneMapped: false })
    );
    this.lampCore.position.set(0, this.lampY, -0.6);
    this.group.add(this.lampCore);
    this.beam = new THREE.Mesh(
      new THREE.ConeGeometry(2.8, 24, 22, 1, true),
      new THREE.MeshBasicMaterial({
        color: '#ffe3ab',
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false
      })
    );
    this.beam.rotation.z = Math.PI / 2;
    this.beam.position.set(-11.5, 0, 0);
    this.beamRig = new THREE.Group();
    this.beamRig.position.set(0, this.lampY, -0.6);
    this.beamRig.add(this.beam);
    this.group.add(this.beamRig);

    /* ---- names, and the birds they become ---- */
    this.flock = [];
    const count = this.tiered(38, 26, 14);
    for (let i = 0; i < count; i++) {
      const glyph = kit.makeNameGlyph(i, '#ffd47b');
      glyph.material.opacity = 0;
      this.group.add(glyph);
      const gull = kit.makeGull(i % 4 ? '#f7ead0' : P.bird);
      gull.userData.mat.transparent = true;
      gull.userData.mat.opacity = 0;
      gull.scale.setScalar(0.9 + (i % 5) * 0.22);
      this.group.add(gull);
      this.flock.push({
        glyph,
        gull,
        delay: (i / count) * 0.62,
        // each bird gets its own arc across the harbour
        radius: 5 + (i % 7) * 3.4,
        arc: -0.6 + (i % 9) * 0.22,
        rise: (i % 6) * 0.7,
        speed: 0.75 + (i % 5) * 0.14,
        wob: rnd() * Math.PI * 2
      });
    }

    /* ---- the coast, alive ---- */
    this.village = [];
    for (let i = 0; i < 14; i++) {
      const cottage = kit.makeCottage({ w: 1.1 + rnd() * 0.5, h: 0.85 + rnd() * 0.4, wall: i % 3 ? '#f2e3c4' : '#e8cfa8', roof: i % 2 ? '#8a5347' : '#4c5a5c' });
      const a = -1.35 + (i / 13) * 2.3;
      cottage.position.set(Math.sin(a) * 17 - 2, -0.7, Math.cos(a) * 7 - 12);
      cottage.rotation.y = -a * 0.7;
      this.group.add(cottage);
      this.village.push(cottage);
    }
    this.smoke = [];
    for (let i = 0; i < this.tiered(10, 7, 4); i++) {
      const puff = kit.makeCloud(0.9 + rnd() * 0.7, 0, '#f6e8d2');
      this.group.add(puff);
      this.smoke.push({ node: puff, from: this.village[(i * 3) % this.village.length].position, ph: rnd() * Math.PI * 2, sp: 0.2 + rnd() * 0.2 });
    }
    this.boats = [];
    for (let i = 0; i < 6; i++) {
      const dory = kit.makeDory({ sail: true, hull: i % 2 ? '#6b4535' : '#7a5240' });
      dory.position.set(-16 + i * 6.4, -0.9, 2 + (i % 3) * 5);
      dory.scale.setScalar(0.9 + (i % 3) * 0.2);
      this.group.add(dory);
      this.boats.push({ node: dory, base: dory.position.clone(), sp: 0.25 + (i % 4) * 0.12, ph: i * 1.3 });
    }
    this.headlands = [];
    for (let i = 0; i < 3; i++) {
      const land = kit.makeHeadland({ width: 40 - i * 6, height: 4 + i * 1.6, seed: 41 + i, color: i ? '#4a6a63' : '#31514f' });
      land.position.set(-14 + i * 12, -1, -22 - i * 5);
      this.group.add(land);
      this.parallax.add(land, { drift: 0.04 + i * 0.015, wrap: 90, bob: 0.06, phase: i * 2.1 });
      this.headlands.push(land);
    }

    /* ---- the sea, finally letting go ---- */
    this.seaSelf = new TheSea(kit, { scale: 3, shardCount: this.tiered(40, 26, 14) });
    this.seaSelf.root.position.set(-14, 1, -22);
    this.group.add(this.seaSelf.root);

    /* ---- the keeper, on his gallery, done ---- */
    // On the gallery deck, at the rail, looking out over the harbour.
    this.keeperStand = new THREE.Vector3(0.95, this.galleryY, 0.02);
    this.keeper = new Keeper(kit);
    this.keeper.group.position.copy(this.keeperStand);
    this.keeper.group.rotation.y = 1.0;
    this.keeper.group.scale.setScalar(0.95);
    this.group.add(this.keeper.group);

    this.fog = new THREE.Fog(new THREE.Color(P.fog), 18, 88);
    this._sky = new THREE.Color();
    this._stormSky = new THREE.Color('#22394a');
    this._dawnSky = new THREE.Color(P.bg);
  }

  update(p, time, dt) {
    const exp = this.experience;
    const motion = this.motion;
    const t = time * motion;

    const recede = easeInOut(win(p, 0, 0.34));
    const dawn = easeInOut(win(p, 0.18, 0.58));
    const fold = win(p, 0.44, 0.74);
    const flight = win(p, 0.6, 0.94);
    const retreat = win(p, 0.84, 1);

    // the sky is a wash that moves, not a swap
    this._sky.copy(this._stormSky).lerp(this._dawnSky, dawn);
    this.fog.color.copy(this._sky).lerp(new THREE.Color(P.fog), 0.6);
    this.fog.far = lerp(58, 108, dawn);
    exp.setSky('#' + this._sky.getHexString(), this.fog);
    this.narrate(BEATS, p);

    /* ---- the storm physically leaves ---- */
    this.stormBank.children.forEach((slab, i) => {
      const u = slab.userData;
      slab.position.x = u.x - recede * 34 * u.sp;
      slab.position.y = 6 + (i % 4) * 2.6 + recede * 3.4;
      slab.material.opacity = 0.72 * (1 - recede * 0.95);
    });
    this.stormRidge.position.x = -10 - recede * 30;
    this.stormRidge.position.y = -recede * 7;
    this.stormRidge.material.opacity = 1 - recede * 0.9;
    this.stormRidge.material.transparent = true;

    /* ---- dawn comes up behind it ---- */
    this.dawnBands.forEach((band, i) => {
      band.material.opacity = dawn * (0.7 - i * 0.07);
      band.position.y = 4.4 + i * 1.9 + Math.sin(t * 0.08 + i) * 0.3;
    });
    this.sun.material.opacity = clamp(dawn * 0.9, 0, 1);
    this.sun.position.y = lerp(1.4, 5.6, dawn);
    this.sun.scale.setScalar(lerp(11, 20, dawn));
    this.parallax.update(t, motion);

    /* ---- stained glass catches it ---- */
    this.stained.forEach((pane, i) => {
      const facing = 0.5 + 0.5 * Math.cos((i / 12) * Math.PI * 2 - 0.7);
      pane.material.opacity = 0.1 + dawn * facing * 0.55;
    });
    this.stainedFloor.material.opacity = dawn * 0.4;
    this.stainedFloor.rotation.z = t * 0.06;

    /* ---- the lamp hands its names over and then rests ---- */
    const lampPower = 1 - easeOut(win(p, 0.68, 1)) * 0.85;
    this.lampCore.scale.setScalar(0.7 + lampPower * 0.6);
    this.lampCore.material.opacity = 0.35 + lampPower * 0.6;
    this.beamRig.rotation.y = t * 0.5;
    this.beam.material.opacity = lampPower * 0.13 * (1 - dawn * 0.5);
    this.tower.userData.setGlow(lampPower);

    /* ---- names fold into birds and go ---- */
    this.flock.forEach((f, i) => {
      const k = clamp((fold - f.delay * 0.5) * 2.4, 0, 1);
      const fl = clamp((flight - f.delay * 0.6) * 1.9, 0, 1);
      // they start on the beam, at the lamp
      const spin = this.beamRig.rotation.y + f.arc;
      const startX = Math.cos(spin) * (1.4 + f.delay * 3);
      const startZ = -0.6 - Math.sin(spin) * (1.4 + f.delay * 3);

      // the glyph folds: it narrows and tips as the bird takes over
      f.glyph.position.set(startX, this.lampY + Math.sin(t + f.wob) * 0.12, startZ);
      f.glyph.rotation.set(k * 1.4, spin, Math.sin(t * 1.4 + f.wob) * 0.3);
      f.glyph.scale.set(1 - k * 0.85, 1 - k * 0.4, 1);
      f.glyph.material.opacity = Math.min(k * 2.4, 1) * (1 - k) * 1.6;

      // the bird leaves along its own arc across the harbour
      const travel = easeOut(fl);
      const a = spin + travel * f.speed * 2.4;
      const r = 1.6 + travel * f.radius;
      f.gull.position.set(
        startX + Math.cos(a) * r * travel + travel * 4,
        this.lampY + f.rise * travel + Math.sin(t * 1.6 + f.wob) * (0.3 + travel * 0.8) - travel * travel * 2.2,
        startZ - Math.sin(a) * r * travel - travel * 6
      );
      f.gull.rotation.set(
        Math.sin(t * 1.2 + f.wob) * 0.12,
        -a + Math.PI / 2,
        Math.sin(t * 0.9 + f.wob) * 0.22
      );
      f.gull.userData.flap(t * f.speed + f.wob, 0.5 + travel * 0.6);
      f.gull.userData.mat.opacity = clamp(k * 1.4, 0, 1) * (1 - Math.max(0, travel - 0.9) * 6);
      f.gull.visible = f.gull.userData.mat.opacity > 0.01;
      f.glyph.visible = f.glyph.material.opacity > 0.01;
    });

    /* ---- the coast fills with movement ---- */
    const alive = easeOut(win(p, 0.5, 1));
    this.village.forEach((c, i) => c.userData.setGlow(clamp(0.9 - dawn * 0.7, 0.08, 1) * (0.5 + (i % 3) * 0.25)));
    this.smoke.forEach((s) => {
      const rise = (t * s.sp + s.ph) % 1;
      s.node.position.set(s.from.x + rise * 1.4 + Math.sin(t * 0.3 + s.ph), s.from.y + 1.2 + rise * 3.4, s.from.z);
      s.node.material.opacity = alive * Math.sin(rise * Math.PI) * 0.32;
      s.node.scale.setScalar(0.9 + rise * 1.6);
    });
    this.boats.forEach((b) => {
      b.node.position.set(
        b.base.x + Math.sin(t * b.sp + b.ph) * 3.2 * alive,
        b.base.y + Math.sin(t * 1.2 + b.ph) * 0.12,
        b.base.z + Math.cos(t * b.sp * 0.7 + b.ph) * 1.6 * alive
      );
      b.node.rotation.y = Math.cos(t * b.sp + b.ph) * 0.4;
      b.node.rotation.z = Math.sin(t * 1.2 + b.ph) * 0.07;
    });
    this.reflections.forEach((r, i) => {
      r.node.position.x = Math.sin(t * 0.3 + r.ph) * 1.6 + 1;
      r.node.scale.x = 1 + Math.sin(t * 0.7 + r.ph) * 0.24;
      r.node.material.opacity = (0.1 + dawn * 0.28) * (0.6 + 0.4 * Math.sin(t * 0.9 + r.ph));
    });

    /* ---- the keeper, alone and finished ---- */
    const k = this.keeper;
    k.setPose(retreat > 0.4 ? 'sit' : 'idle', time, retreat);
    k.setForce(0.1, time * 0.5);
    k.setLantern(false);
    k.setBook(true);
    k.setHeadLook(0.2 + flight * 0.25, -0.12 - flight * 0.1);
    // when he finally sits, he settles back against the rail
    if (retreat > 0.4) k.group.position.set(this.keeperStand.x, this.galleryY, this.keeperStand.z + 0.25);

    /* ---- the sea withdraws for good ---- */
    this.seaSelf.setMood('receding');
    this.seaSelf.update(t, dt, motion);
    this.seaSelf.root.position.set(-14 - recede * 12, 1 - recede * 3, -22);

    this.sea.update(t, 0, 0.06, -1.2);

    this.shot(CAM, p);
    exp.setLights({
      hemi: 0.7 + dawn * 0.5,
      key: 0.6 + dawn * 0.6,
      rim: 0.4,
      accent: { pos: [14, 5.6, -30], intensity: dawn * 2.4, color: '#ffcf8f' }
    });
  }
}
