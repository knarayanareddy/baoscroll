import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { Keeper } from '../characters/Keeper.js';
import { KeepingBook } from '../props/KeepingBook.js';
import { FresnelLamp } from '../props/FresnelLamp.js';
import { RainGlass } from '../effects/RainGlass.js';
import { StormWindowLayers } from '../effects/StormWindowLayers.js';
import { PALETTES } from '../utils/constants.js';
import { win, easeOut, easeInOut, clamp, lerp, mulberry32 } from '../utils/math.js';

const P = PALETTES.beacon;

// Chapter 5 — The Lamp Rekindled.
// Spatial proposition: VERTICAL, then ROTATIONAL. The chapter climbs a
// real staircase and then stops climbing and starts turning: once the
// lamp is lit, the composition is driven by a sweeping beam instead of a
// travelling camera, and that sweep is what hands the story to chapter six.
//
// The causal chain is the point, and it must survive being scrubbed:
//   page -> lifted stroke -> keeper's hands -> Fresnel core -> beam -> harbour
const CAM = [
  // The room is only 4.4 across, so interior keyframes stay inside a
  // radius of about 4 and above eye height; anything lower ends up with
  // the desk or the keeper's back filling half the frame.
  { t: 0.0, pos: [4.6, 0.6, 6.4], look: [0.6, 2.2, 0], fov: 46 },
  { t: 0.16, pos: [4.0, 2.6, 5.0], look: [0.4, 3.6, -0.4], fov: 42 },
  { t: 0.32, pos: [3.2, 5.2, 4.2], look: [0.3, 5.9, -0.3], fov: 40 },
  { t: 0.44, pos: [1.9, 7.8, 1.0], look: [0.05, 7.05, 2.4], fov: 38 },
  { t: 0.56, pos: [3.3, 7.6, 1.6], look: [1.5, 7.0, -0.2], fov: 34 },
  { t: 0.7, pos: [1.9, 8.1, 1.4], look: [0, 7.62, -0.4], fov: 30 },
  { t: 0.82, pos: [3.0, 8.1, 2.6], look: [0.2, 7.5, -0.5], fov: 48 },
  { t: 0.92, pos: [2.0, 8.3, 4.6], look: [-1.6, 7.2, -8], roll: 0.02, fov: 54 },
  { t: 1.0, pos: [0.6, 8.6, 7.4], look: [-3.0, 6.6, -16], roll: 0.03, fov: 58 }
];

const BEATS = [
  { at: 0, text: 'The keeper climbs the stair with the recovered name still in his hands.' },
  { at: 0.3, text: 'On the desk, the surviving names lift off the page as strokes of light.' },
  { at: 0.52, text: 'He sets his hands on the brass wheel and turns. The lamp takes the names in.' },
  { at: 0.74, text: 'The beam opens the storm — a turning cone with every name inside it.' },
  { at: 0.9, text: 'Each sweep gives another piece of the harbour back.' }
];

export class BeaconScene extends BaseScene {
  build() {
    const kit = this.experience.kit;
    const rnd = mulberry32(89);
    this._dummy = new THREE.Object3D();

    /* ---- lantern room floor: boards, brass inlay, a real edge ---- */
    const floor = new THREE.Group();
    floor.position.y = 6.0;
    this.group.add(floor);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.55, 0.24, 28), kit.woodMat(P.timberDark));
    disc.position.y = -0.12;
    floor.add(disc);
    for (let i = 0; i < 18; i++) {
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.03, 8.8), kit.woodMat(i % 2 ? '#6f523e' : '#5e4534'));
      board.position.set((i - 8.5) * 0.49, 0.015, 0);
      floor.add(board);
    }
    const inlay = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.05, 6, 30), kit.brassMat('#8a6329'));
    inlay.rotation.x = Math.PI / 2;
    inlay.position.y = 0.04;
    floor.add(inlay);

    /* ---- the spiral stair, with treads the keeper's feet actually use -- */
    this.stairs = new THREE.Group();
    this.group.add(this.stairs);
    this.treads = [];
    const stepCount = 30;
    for (let i = 0; i < stepCount; i++) {
      const a = i * 0.42;
      const y = 0.2 + i * 0.196;
      const tread = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.6), kit.woodMat(i % 2 ? '#6f523e' : '#5b4132'));
      tread.position.set(Math.cos(a) * 2.4, y, Math.sin(a) * 2.4);
      tread.rotation.y = -a;
      this.stairs.add(tread);
      this.treads.push({ pos: new THREE.Vector3(tread.position.x, y + 0.06, tread.position.z), rot: -a + Math.PI });
      if (i % 2 === 0) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.78, 6), kit.brassMat('#9d7138'));
        post.position.set(Math.cos(a) * 3.15, y + 0.45, Math.sin(a) * 3.15);
        this.stairs.add(post);
      }
    }
    const railPts = [];
    for (let i = 0; i <= stepCount * 2; i++) {
      const a = i * 0.21;
      railPts.push(new THREE.Vector3(Math.cos(a) * 3.15, 0.98 + i * 0.098, Math.sin(a) * 3.15));
    }
    this.stairs.add(
      new THREE.Line(new THREE.BufferGeometry().setFromPoints(railPts), new THREE.LineBasicMaterial({ color: '#d3a657' }))
    );
    // the central column the stair wraps
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 6.2, 12), kit.paperMat('#4c4136', { lit: true }));
    column.position.y = 3.1;
    this.group.add(column);

    /* ---- glazing, rain on the outside, painted storm beyond that ---- */
    this.glass = new THREE.Group();
    this.rainPanes = [];
    this.group.add(this.glass);
    const panes = this.tiered(14, 12, 8);
    for (let i = 0; i < panes; i++) {
      const a = (i / panes) * Math.PI * 2;
      const pane = new RainGlass(2.0, 3.2);
      pane.mesh.position.set(Math.cos(a) * 4.3, 7.6, Math.sin(a) * 4.3);
      pane.mesh.rotation.y = -a + Math.PI / 2;
      this.glass.add(pane.mesh);
      this.rainPanes.push(pane);
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.07, 3.3, 0.07), kit.paperMat(P.ink, { lit: true }));
      mullion.position.set(Math.cos(a + Math.PI / panes) * 4.34, 7.6, Math.sin(a + Math.PI / panes) * 4.34);
      this.glass.add(mullion);
    }
    const cap = new THREE.Mesh(new THREE.ConeGeometry(4.7, 1.5, 24), kit.paperMat(P.ink, { lit: true, side: THREE.DoubleSide }));
    cap.position.y = 10;
    this.group.add(cap);

    this.stormLayers = new StormWindowLayers();
    this.stormLayers.root.position.y = 4.4;
    this.group.add(this.stormLayers.root);

    /* ---- the desk and the book the names come out of ---- */
    const desk = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.16, 1.9), kit.woodMat(P.timber));
    desk.position.set(0, 6.9, 2.5);
    this.group.add(desk);
    for (const dx of [-1.2, 1.2]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.82, 0.14), kit.woodMat(P.timberDark));
      leg.position.set(dx, 6.42, 2.5);
      this.group.add(leg);
    }
    this.book = new KeepingBook(kit, { name: 'ELIAS RUNE' });
    this.book.root.position.set(0, 7.0, 2.5);
    this.book.root.scale.setScalar(0.62);
    this.group.add(this.book.root);

    /* ---- the lamp ---- */
    this.lamp = new FresnelLamp(kit);
    this.lamp.root.position.set(0, 7.6, -0.4);
    this.lamp.root.scale.setScalar(1.15);
    this.group.add(this.lamp.root);

    /* ---- names as luminous calligraphic strokes ---- */
    this.strokes = [];
    const strokeCount = this.tiered(54, 34, 18);
    for (let i = 0; i < strokeCount; i++) {
      const glyph = kit.makeNameGlyph(i, i % 3 ? P.gold : P.core);
      glyph.material.opacity = 0;
      glyph.scale.setScalar(0.5 + (i % 4) * 0.12);
      this.group.add(glyph);
      this.strokes.push({
        node: glyph,
        delay: (i / strokeCount) * 0.55,
        orbit: (i / strokeCount) * Math.PI * 2,
        radius: 0.35 + (i % 6) * 0.12,
        height: -0.4 + (i % 7) * 0.14,
        wob: rnd() * Math.PI * 2
      });
    }
    // fixed waypoints for the routing, so no vectors are allocated per frame
    this.pageAt = new THREE.Vector3(0, 7.06, 2.42);
    this.handAt = new THREE.Vector3(1.15, 6.95, 0.35);
    this.coreAt = new THREE.Vector3(0, 7.6, -0.4);

    /* ---- the beam: a volumetric cone with names travelling inside it ---- */
    this.beamRig = new THREE.Group();
    this.beamRig.position.copy(this.coreAt);
    this.group.add(this.beamRig);
    this.beamCones = [];
    for (let i = 0; i < 2; i++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(3.4, 26, 26, 1, true),
        new THREE.MeshBasicMaterial({
          color: '#ffe5ab',
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          toneMapped: false
        })
      );
      cone.rotation.z = Math.PI / 2;
      cone.position.x = -13;
      cone.rotation.y = i * Math.PI;
      this.beamRig.add(cone);
      this.beamCones.push(cone);
    }
    // dust and names carried along the beam
    this.beamMotes = kit.makeShardInstances(this.tiered(48, 30, 16), '#ffe9b8');
    this.beamMotes.material.blending = THREE.AdditiveBlending;
    this.beamMotes.material.opacity = 0;
    this.beamRig.add(this.beamMotes);
    this.moteSeeds = [];
    for (let i = 0; i < this.beamMotes.count; i++) {
      this.moteSeeds.push({ d: rnd(), a: rnd() * Math.PI * 2, r: rnd(), s: 0.3 + rnd() * 0.7, sp: 0.3 + rnd() * 0.6 });
    }

    /* ---- the harbour below, restored one sweep at a time ---- */
    this.harbor = new THREE.Group();
    this.harbor.position.set(-2, -2.6, -14);
    this.group.add(this.harbor);
    this.harborLights = [];
    for (let i = 0; i < 12; i++) {
      const cottage = kit.makeCottage({ w: 1.2, h: 0.95, wall: '#7d8a8c', roof: '#3b4a50' });
      const angle = -1.1 + (i / 11) * 2.2;
      cottage.position.set(Math.sin(angle) * 13, 0, Math.cos(angle) * 4 - 2);
      cottage.rotation.y = -angle;
      this.harbor.add(cottage);
      this.harborLights.push({ node: cottage, angle });
    }

    /* ---- the keeper ---- */
    this.keeper = new Keeper(kit);
    this.keeper.setGrounded(false);
    this.group.add(this.keeper.group);

    this.fog = new THREE.Fog(new THREE.Color(P.fog), 8, 44);
  }

  update(p, time, dt) {
    const exp = this.experience;
    const motion = this.motion;
    const t = time * motion;

    exp.setSky(P.bg, this.fog);
    this.narrate(BEATS, p);

    const climb = win(p, 0.02, 0.4);
    const gather = win(p, 0.32, 0.56); // strokes leave the page
    const wheel = win(p, 0.5, 0.8); // he cranks
    const ignite = win(p, 0.68, 1); // the lamp takes hold
    const sweep = win(p, 0.8, 1); // the harbour comes back

    /* ---- the climb lands on real treads ---- */
    const k = this.keeper;
    if (wheel > 0.02) {
      k.group.position.set(1.5, 6.05, 0.75);
      k.group.rotation.y = -2.05;
      k.setPose('wheel', time, (wheel * 2.5) % 1);
      k.setForce(0.2 + ignite * 0.5, time);
    } else if (climb < 0.995) {
      const i = Math.min(this.treads.length - 1, Math.floor(easeInOut(climb) * (this.treads.length - 1)));
      const tread = this.treads[i];
      k.group.position.copy(tread.pos);
      k.group.rotation.y = tread.rot;
      k.setPose('climb', time);
      k.setForce(0.12, time);
    } else {
      k.group.position.set(1.1, 6.05, 1.4);
      k.group.rotation.y = -2.2;
      k.setPose('idle', time);
      k.setForce(0.15 + ignite * 0.4, time);
    }
    k.setLantern(!(wheel > 0.02), 0.6, time);
    k.setBook(false);
    k.setHeadLook(0, ignite > 0.4 ? -0.2 : 0);

    /* ---- the book gives up what it kept ---- */
    this.book.setErasure(0.34, t);
    this.book.setGlow(easeOut(gather));

    /* ---- name strokes: page -> hands -> core -> beam ---- */
    const power = easeOut(ignite);
    const toHand = easeInOut(gather);
    const toCore = easeInOut(win(p, 0.54, 0.78));
    const intoBeam = easeInOut(win(p, 0.76, 0.98));
    const A = this.pageAt;
    const B = this.handAt;
    const C = this.coreAt;
    this.strokes.forEach((s, i) => {
      const g = clamp((toHand - s.delay * 0.6) * 2.2, 0, 1);
      const c = clamp((toCore - s.delay * 0.4) * 2.2, 0, 1);
      const b = clamp((intoBeam - s.delay * 0.5) * 2.4, 0, 1);
      // arithmetic interpolation, no per-frame vector allocation
      const x1 = A.x + (B.x - A.x) * g;
      const y1 = A.y + (B.y - A.y) * g + Math.sin(s.wob + t) * 0.06 * g;
      const z1 = A.z + (B.z - A.z) * g;
      const x2 = x1 + (C.x - x1) * c;
      const y2 = y1 + (C.y - y1) * c;
      const z2 = z1 + (C.z - z1) * c;
      // then out along the turning beam
      const spin = this.beamRig.rotation.y;
      const out = 3 + (i % 9) * 1.6;
      const bx = C.x + Math.cos(spin) * out;
      const by = C.y + s.height * 0.6;
      const bz = C.z - Math.sin(spin) * out;
      s.node.position.set(x2 + (bx - x2) * b, y2 + (by - y2) * b, z2 + (bz - z2) * b);
      s.node.rotation.z = Math.sin(t * 0.8 + s.wob) * 0.3 + b * 0.6;
      s.node.rotation.y = -spin * b;
      s.node.material.opacity = Math.max(g * 0.8, c * 0.95, b * 0.8) * (1 - b * 0.25);
      s.node.scale.setScalar((0.5 + (i % 4) * 0.12) * (1 + c * 0.4));
    });

    /* ---- the lamp ---- */
    const spin = this.lamp.setPower(power, t);
    // the beam and the lamp share one rotation; the transition manager
    // reads the same number, so the sweep IS the chapter handoff
    this.beamRig.rotation.y = spin * 1.6;
    exp.beamAngle = this.beamRig.rotation.y;
    this.beamCones.forEach((cone, i) => {
      cone.material.opacity = power * (0.13 + Math.sin(t * 1.7 + i) * 0.02);
    });
    for (let i = 0; i < this.beamMotes.count; i++) {
      const m = this.moteSeeds[i];
      const travel = (m.d + t * m.sp * 0.14) % 1;
      const dist = 1.5 + travel * 22;
      const spread = travel * 3.1 * m.r;
      this._dummy.position.set(-dist, Math.sin(m.a) * spread, Math.cos(m.a) * spread);
      this._dummy.rotation.set(0, 0, m.a + t * 0.4);
      this._dummy.scale.setScalar(m.s * (0.4 + travel));
      this._dummy.updateMatrix();
      this.beamMotes.setMatrixAt(i, this._dummy.matrix);
    }
    this.beamMotes.instanceMatrix.needsUpdate = true;
    this.beamMotes.material.opacity = power * 0.55;

    /* ---- the storm gives way where the beam actually points ---- */
    this.stormLayers.update(t, power);
    this.rainPanes.forEach((pane, i) => pane.update(t + i * 0.6, (1 - power * 0.75) * motion));

    /* ---- each sweep restores a slice of the harbour ---- */
    this.harborLights.forEach((h) => {
      // how closely the beam is pointing at this cottage right now
      const delta = Math.cos(this.beamRig.rotation.y - (h.angle + Math.PI));
      const hit = clamp((delta - 0.55) / 0.45, 0, 1);
      // once a sweep has reached it, it keeps a floor of light: the harbour
      // is being given back, not flickered at
      const restored = clamp(sweep * 1.4 - Math.abs(h.angle) * 0.35, 0, 1);
      h.node.userData.setGlow(Math.max(restored * 0.7, hit * power));
    });

    this.shot(CAM, p);
    exp.setLights({
      hemi: 0.45 + power * 0.3,
      key: 0.5 + power * 0.7,
      rim: 0.5,
      accent: { pos: [0, 7.6, -0.4], intensity: 0.8 + power * 4.6, color: P.gold }
    });
  }
}
