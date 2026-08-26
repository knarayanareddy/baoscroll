import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { Keeper } from '../characters/Keeper.js';
import { TheSea } from '../characters/TheSea.js';
import { UnderwaterCaustics } from '../effects/UnderwaterCaustics.js';
import { PALETTES } from '../utils/constants.js';
import { win, bell, easeInOut, easeOut, clamp, lerp, mulberry32 } from '../utils/math.js';

const P = PALETTES.wrecks;

// Chapter 4 — What the Water Kept.
// Spatial proposition: A DESCENDING CORRIDOR. Every other chapter is
// something you look across; this is the only one you fall through. The
// camera starts above the chop, punches the surface, and keeps going
// down past silt, past drifting letters, into a wreck that still has
// somebody's boots in it.
//
// The rule for this chapter: nothing is a card on a floor. Every memory
// is inside something — a bubble, a hull, a sail — and has to be reached
// into and taken out.
const CAM = [
  { t: 0.0, pos: [0, 4.6, 13], look: [0, 1.6, 2], fov: 46 },
  { t: 0.12, pos: [0, 0.9, 8.2], look: [0, -1.4, 0], fov: 44 },
  { t: 0.26, pos: [0.8, -2.6, 6.4], look: [0, -4.4, -1.6], fov: 46 },
  { t: 0.44, pos: [4.4, -4.4, 6.8], look: [-1.4, -6.8, -3.4], fov: 48 },
  // Keyframes stay outside the hull: the ribs are a silhouette to read
  // the wreck by, not a cage to sit inside.
  { t: 0.6, pos: [1.2, -6.4, 1.8], look: [-3.0, -7.8, -3.4], fov: 44 },
  { t: 0.76, pos: [-1.2, -7.2, -0.2], look: [-4.2, -7.7, -3.0], fov: 34 },
  { t: 0.88, pos: [-0.6, -6.9, 0.8], look: [-3.8, -7.6, -2.8], fov: 38 },
  { t: 1.0, pos: [-1.0, -4.2, 4.4], look: [-2.0, -2.2, -2.0], roll: -0.03, fov: 46 }
];

const BEATS = [
  { at: 0, text: 'The keeper goes down into the water after them.' },
  { at: 0.24, text: 'Everything the sea has taken is still here, drifting: torn letters, and names held inside bubbles of held breath.' },
  { at: 0.5, text: 'Inside the wreck there are torn sails, a boot, a tin cup, and a compass that still points north.' },
  { at: 0.78, text: 'The keeper reaches into the last bubble. One name comes back gold in his hands.' }
];

export class WreckMemoriesScene extends BaseScene {
  build() {
    const kit = this.experience.kit;
    const rnd = mulberry32(71);
    this._dummy = new THREE.Object3D();
    this._v = new THREE.Vector3();
    this._memoryHand = new THREE.Vector3();
    this._memoryCore = new THREE.Vector3();
    this._memoryContactDelta = new THREE.Vector3();

    /* ---- the ceiling of the world: the surface, seen from beneath ---- */
    this.surface = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 120, 40, 34),
      new THREE.MeshBasicMaterial({ color: '#2c7f92', transparent: true, opacity: 0.55, side: THREE.DoubleSide, toneMapped: false })
    );
    this.surface.rotation.x = -Math.PI / 2;
    this.surface.position.y = 0.4;
    this.group.add(this.surface);
    this.surfaceBase = this.surface.geometry.attributes.position.array.slice();

    /* ---- god rays punching through from above ---- */
    this.rays = [];
    for (let i = 0; i < this.tiered(7, 5, 3); i++) {
      const ray = new THREE.Mesh(
        new THREE.ConeGeometry(1.1 + rnd() * 1.4, 13, 10, 1, true),
        new THREE.MeshBasicMaterial({
          color: '#a9e9e0',
          transparent: true,
          opacity: 0.07,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          toneMapped: false
        })
      );
      ray.position.set(-9 + rnd() * 18, -5.6, -8 + rnd() * 12);
      ray.rotation.z = (rnd() - 0.5) * 0.28;
      this.group.add(ray);
      this.rays.push({ node: ray, ph: rnd() * Math.PI * 2 });
    }

    /* ---- the seabed and its watercolor light ---- */
    // Oversized on purpose: fog has to eat the far edge, or the seabed
    // draws a hard horizon line straight across the middle of the frame.
    const bed = new THREE.Mesh(new THREE.PlaneGeometry(160, 140), kit.paperMat(P.silt, { lit: true }));
    bed.rotation.x = -Math.PI / 2;
    bed.position.y = -9.4;
    this.group.add(bed);
    this.caustics = new UnderwaterCaustics({ width: 40, height: 34, tint: '#7fe6cf', bleed: '#2f8fa6' });
    this.caustics.mesh.position.set(0, -9.3, -2);
    this.group.add(this.caustics.mesh);
    // a second, tighter set thrown across the wreck itself
    this.hullCaustics = new UnderwaterCaustics({ width: 16, height: 12, scale: 7, tint: '#bff3e4', bleed: '#3d7f96' });
    this.hullCaustics.mesh.position.set(-3.4, -6.2, -3.4);
    this.hullCaustics.mesh.rotation.x = -Math.PI / 2 + 0.4;
    this.group.add(this.hullCaustics.mesh);

    for (let i = 0; i < 14; i++) {
      const rock = kit.makeRock(i + 4, '#24413f');
      rock.position.set(-16 + rnd() * 32, -9.2, -12 + rnd() * 18);
      rock.scale.multiplyScalar(0.8 + rnd() * 1.9);
      this.group.add(rock);
    }

    /* ---- suspended silt ---- */
    this.silt = kit.makeMotes(this.tiered(34, 22, 12), '#bfe6dd', [24, 9, 16], 3);
    this.silt.position.set(0, -5, -2);
    this.group.add(this.silt);

    /* ---- drifting torn letters ---- */
    this.letters = kit.makeShardInstances(this.tiered(56, 34, 18), P.paper);
    this.letters.material.opacity = 0.8;
    this.group.add(this.letters);
    this.letterSeeds = [];
    for (let i = 0; i < this.letters.count; i++) {
      this.letterSeeds.push({
        x: -14 + rnd() * 28,
        y: -1 - rnd() * 8,
        z: -12 + rnd() * 18,
        s: 0.5 + rnd() * 1.1,
        sp: 0.1 + rnd() * 0.3,
        ph: rnd() * Math.PI * 2,
        spin: (rnd() - 0.5) * 0.7
      });
    }

    /* ---- the wreck: ribs, spine, torn sails, and what was aboard ---- */
    this.wreck = new THREE.Group();
    this.wreck.position.set(-3.6, -8.4, -3.6);
    this.wreck.rotation.set(0.12, 0.5, -0.16);
    this.group.add(this.wreck);

    const keel = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.4, 0.6), kit.woodMat(P.hull));
    this.wreck.add(keel);
    for (let i = 0; i < 11; i++) {
      const t = i / 10;
      const span = Math.sin(t * Math.PI) * 1.75 + 0.5;
      for (const s of [-1, 1]) {
        const rib = new THREE.Mesh(new THREE.TorusGeometry(span, 0.075, 5, 10, Math.PI * 0.62), kit.woodMat(i % 2 ? '#3a342d' : P.hull));
        rib.position.set(-4.3 + t * 8.6, span * 0.42, 0);
        rib.rotation.set(0, Math.PI / 2, s > 0 ? Math.PI * 0.19 : Math.PI - Math.PI * 0.19);
        rib.scale.z = 0.6;
        this.wreck.add(rib);
      }
      // planking that has not yet fallen away
      if (i % 3 === 0) {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 0.5), kit.woodMat('#403830'));
        plank.position.set(-3.4 + t * 7, span * 0.3, (i % 2 ? 1 : -1) * span * 0.5);
        plank.rotation.z = (rnd() - 0.5) * 0.3;
        this.wreck.add(plank);
      }
    }
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 6.4, 7), kit.woodMat('#463c31'));
    mast.position.set(-0.6, 2.4, 0);
    mast.rotation.z = -0.62;
    this.wreck.add(mast);
    // Torn-sail alpha art is loaded through AssetLoader; the original paper
    // material remains the intentional fallback if a constrained host misses it.
    const sailMat = this.experience.assets.has('sailMask')
      ? new THREE.MeshLambertMaterial({
          map: this.experience.assets.get('paper'), alphaMap: this.experience.assets.get('sailMask'),
          color: '#c9bda1', transparent: true, opacity: 0.86, side: THREE.DoubleSide, depthWrite: false
        })
      : kit.paperMat('#c9bda1', { lit: true, side: THREE.DoubleSide, opacity: 0.82 });
    // torn sails: paper planes with ragged, drifting corners
    this.sails = [];
    for (let i = 0; i < 3; i++) {
      const sail = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4 - i * 0.5, 2.9 - i * 0.6, 5, 5),
        sailMat.clone()
      );
      sail.position.set(-1.9 + i * 1.5, 2.2 + i * 0.9, (i % 2 ? 0.5 : -0.5));
      sail.rotation.set(0.2, i * 0.6, -0.5);
      this.wreck.add(sail);
      this.sails.push({ node: sail, base: sail.geometry.attributes.position.array.slice(), ph: i * 1.4 });
    }

    // personal objects: the reason this is a grave and not a set
    const objects = new THREE.Group();
    objects.position.set(-1.6, 0.4, 0.3);
    this.wreck.add(objects);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.62), kit.paperMat('#3b2b25', { lit: true }));
    boot.position.set(-1.2, 0.1, 0.5);
    boot.rotation.set(0.4, 0.6, 0.2);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.24, 9), kit.brassMat('#8b8378'));
    cup.position.set(0.5, 0.06, -0.4);
    cup.rotation.z = 1.3;
    const compassBody = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.09, 14), kit.brassMat('#b08b45'));
    compassBody.rotation.x = -Math.PI / 2 + 0.3;
    this.compassNeedle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.28, 0.012), new THREE.MeshBasicMaterial({ color: '#ffe6ab', toneMapped: false }));
    this.compassNeedle.position.z = 0.06;
    compassBody.add(this.compassNeedle);
    compassBody.position.set(1.5, 0.08, 0.4);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.024, 5, 12), kit.brassMat('#d0aa5c'));
    ring.position.set(0.1, 0.03, 0.8);
    ring.rotation.x = -Math.PI / 2;
    objects.add(boot, cup, compassBody, ring);

    /* ---- memories, each held inside a bubble of somebody's last breath -- */
    this.bubbles = [];
    const bubbleCount = this.tiered(9, 7, 5);
    for (let i = 0; i < bubbleCount; i++) {
      const holder = new THREE.Group();
      // Transmission is expensive and reads as a wireframe on weak GPUs.
      // Two cheap shells do the job better: a faint inner fill, and an
      // additive back-facing skin that lights up at the silhouette only.
      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(0.62, 16, 12),
        new THREE.MeshBasicMaterial({
          color: '#9fd8d4',
          transparent: true,
          opacity: 0.12,
          side: THREE.FrontSide,
          depthWrite: false,
          toneMapped: false
        })
      );
      const rim = new THREE.Mesh(
        new THREE.SphereGeometry(0.66, 16, 12),
        new THREE.MeshBasicMaterial({ color: '#dffaf4', transparent: true, opacity: 0.3, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })
      );
      // a specular kiss on the top-left of each bubble, so they read round
      const kiss = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: kit.tex('glow'), color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })
      );
      kiss.scale.setScalar(0.4);
      kiss.position.set(-0.22, 0.3, 0.4);
      const card = kit.makeNameCard(i, P.paper);
      card.scale.setScalar(0.42);
      card.userData.setState(1, 0);
      const glyph = kit.makeNameGlyph(i, P.gold);
      glyph.scale.setScalar(0.7);
      glyph.material.opacity = 0;
      glyph.position.y = 0.05;
      holder.add(shell, rim, kiss, card, glyph);
      holder.position.set(-11 + (i % 5) * 4.4 + rnd() * 1.4, -2.6 - (i % 4) * 1.5, -9 + (i % 3) * 4 + rnd() * 2);
      this.group.add(holder);
      this.bubbles.push({
        node: holder,
        card,
        glyph,
        shell,
        rim,
        kiss,
        base: holder.position.clone(),
        ph: rnd() * Math.PI * 2,
        reveal: (i / bubbleCount) * 0.55
      });
    }
    // the one he actually reaches into, kept close to the wreck
    this.hero = this.bubbles[this.bubbles.length - 1];
    this.hero.base.set(-4.4, -7.6, -3.0);
    this.hero.node.position.copy(this.hero.base);

    /* ---- things that live down here ---- */
    this.jellies = [];
    for (let i = 0; i < this.tiered(5, 4, 2); i++) {
      const jelly = new THREE.Group();
      const bellMat = new THREE.MeshBasicMaterial({
        color: '#d6b6e8',
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false
      });
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), bellMat);
      jelly.add(dome);
      const tendrils = [];
      for (let j = 0; j < 6; j++) {
        const pts = [];
        for (let s = 0; s <= 6; s++) pts.push(new THREE.Vector3(0, -s * 0.22, 0));
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: '#e6cff5', transparent: true, opacity: 0.4 })
        );
        const a = (j / 6) * Math.PI * 2;
        line.position.set(Math.cos(a) * 0.3, -0.05, Math.sin(a) * 0.3);
        jelly.add(line);
        tendrils.push({ line, a });
      }
      jelly.position.set(-13 + rnd() * 26, -2 - rnd() * 5, -11 + rnd() * 14);
      this.group.add(jelly);
      this.jellies.push({ node: jelly, dome, tendrils, base: jelly.position.clone(), ph: rnd() * Math.PI * 2, sp: 0.3 + rnd() * 0.4 });
    }

    // a school, instanced, wheeling around the wreck
    this.school = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(0.26, 0.1),
      new THREE.MeshBasicMaterial({ color: '#9fd6cc', transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }),
      this.tiered(70, 44, 22)
    );
    this.school.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.school.frustumCulled = false;
    this.group.add(this.school);
    this.fishSeeds = [];
    for (let i = 0; i < this.school.count; i++) {
      this.fishSeeds.push({ r: 3 + rnd() * 4, y: -3 - rnd() * 4.5, a: rnd() * Math.PI * 2, sp: 0.35 + rnd() * 0.3, ph: rnd() * Math.PI * 2 });
    }

    /* ---- the sea is here too, but grieving rather than hunting ---- */
    this.seaSelf = new TheSea(kit, { scale: 2.2, shardCount: this.tiered(34, 22, 12) });
    this.seaSelf.root.position.set(6, -6.6, -12);
    this.group.add(this.seaSelf.root);

    /* ---- the keeper, out of his element ---- */
    this.keeper = new Keeper(kit);
    this.keeper.setGrounded(false);
    this.keeper.group.scale.setScalar(0.88);
    this.group.add(this.keeper.group);
    // He is a dark shape in dark water, so he gets his own cold backlight
    // to carve an edge off his coat and keep the silhouette readable.
    this.keeperRim = new THREE.PointLight('#8fe0dd', 1.4, 9, 2);
    this.group.add(this.keeperRim);

    this.fog = new THREE.Fog(new THREE.Color(P.fog), 4, 26);
  }

  update(p, time, dt) {
    const exp = this.experience;
    const motion = this.motion;
    const t = time * motion;

    exp.setSky(P.bg, this.fog);
    this.narrate(BEATS, p);

    const dive = win(p, 0.06, 0.62); // the long descent
    const search = win(p, 0.5, 0.76); // swimming the wreck
    const retrieve = win(p, 0.76, 0.93); // reaching into the bubble
    const rise = win(p, 0.9, 1);

    /* ---- the keeper descends, searches, reaches, lifts ---- */
    const k = this.keeper;
    const depth = lerp(0.6, -7.7, easeInOut(dive));
    if (retrieve > 0.02) {
      k.group.position.set(-3.5, -7.7 + rise * 1.9, -1.5);
      k.group.rotation.y = 2.5;
      k.setPose('reach', time, retrieve);
    } else {
      k.group.position.set(lerp(0.4, -3.5, easeInOut(dive + search * 0.4)), depth, lerp(3.4, -1.5, easeInOut(dive)));
      k.group.rotation.y = 2.2 + search * 0.4;
      k.setPose('swim', time);
    }
    // slow, heavy cloth: underwater everything trails
    k.setForce(0.35 + Math.sin(t * 0.7) * 0.1, time * 0.4);
    k.setLantern(true, 0.7 + retrieve * 0.3, time);
    k.setBook(false);
    k.setAir(0);
    k.group.rotation.z = Math.sin(t * 0.5) * 0.08;
    this.keeperRim.position.set(k.group.position.x - 1.6, k.group.position.y + 2.2, k.group.position.z - 1.4);

    /* ---- the surface breathes above everything ---- */
    const pos = this.surface.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const bx = this.surfaceBase[i * 3];
      const by = this.surfaceBase[i * 3 + 1];
      pos.setZ(i, Math.sin(bx * 0.3 + t * 0.9) * 0.34 + Math.sin(by * 0.24 - t * 0.7) * 0.26);
    }
    pos.needsUpdate = true;
    this.surface.material.opacity = 0.5 - dive * 0.2;

    this.rays.forEach((r, i) => {
      r.node.material.opacity = (0.05 + Math.sin(t * 0.4 + r.ph) * 0.02) * (0.5 + dive * 0.9);
      r.node.rotation.z = Math.sin(t * 0.2 + r.ph) * 0.12;
    });

    this.caustics.update(t, 0.5 + dive * 0.8);
    this.hullCaustics.update(t * 1.2 + 3, search * 0.35 + 0.12);

    /* ---- silt and letters drift on the same slow current ---- */
    this.silt.userData.update(t * 0.5, motion, 0.5 + dive * 0.4);
    for (let i = 0; i < this.letters.count; i++) {
      const s = this.letterSeeds[i];
      const drift = t * s.sp;
      this._dummy.position.set(
        s.x + Math.sin(drift + s.ph) * 1.4,
        s.y + Math.sin(drift * 0.6 + s.ph) * 0.7 + Math.sin(t * 0.2) * 0.3,
        s.z + Math.cos(drift * 0.7 + s.ph) * 1.1
      );
      this._dummy.rotation.set(drift * s.spin, drift * 0.4 + s.ph, Math.sin(drift + s.ph) * 0.5);
      this._dummy.scale.setScalar(s.s);
      this._dummy.updateMatrix();
      this.letters.setMatrixAt(i, this._dummy.matrix);
    }
    this.letters.instanceMatrix.needsUpdate = true;
    this.letters.material.opacity = 0.35 + dive * 0.45;

    /* ---- torn sails answer the current ---- */
    this.sails.forEach((s) => {
      const attr = s.node.geometry.attributes.position;
      for (let i = 0; i < attr.count; i++) {
        const bx = s.base[i * 3];
        const by = s.base[i * 3 + 1];
        attr.setZ(i, Math.sin(bx * 1.1 + t * 0.8 + s.ph) * 0.16 + Math.cos(by * 0.9 - t * 0.6) * 0.12);
      }
      attr.needsUpdate = true;
    });
    this.compassNeedle.rotation.z = Math.sin(t * 0.3) * 0.08;

    /* ---- the memories reveal, and one of them comes home ---- */
    this.bubbles.forEach((b, i) => {
      const shown = clamp((dive - b.reveal) * 2.6, 0, 1);
      b.node.visible = shown > 0.02;
      b.node.position.set(
        b.base.x + Math.sin(t * 0.3 + b.ph) * 0.5,
        b.base.y + Math.sin(t * 0.42 + b.ph) * 0.34,
        b.base.z + Math.cos(t * 0.26 + b.ph) * 0.4
      );
      b.node.rotation.y = t * 0.12 + b.ph;
      b.shell.material.opacity = 0.12 * shown;
      b.rim.material.opacity = 0.3 * shown;
      b.kiss.material.opacity = 0.35 * shown;
      const gold = b === this.hero ? easeOut(retrieve) : bell(p, 0.3 + i * 0.05, 0.75 + i * 0.03) * 0.35;
      b.card.userData.setState(shown, gold);
      b.glyph.material.opacity = gold * 0.9;
      b.glyph.position.y = 0.05 + gold * 0.5;
      b.glyph.scale.setScalar(0.7 + gold * 0.5);
    });
    // the hero bubble opens and the name lifts into his hands
    const taken = easeOut(retrieve);
    this.hero.shell.scale.setScalar(1 + taken * 0.9);
    this.hero.rim.scale.setScalar(1 + taken * 0.9);
    this.hero.shell.material.opacity = 0.12 * (1 - taken);
    this.hero.rim.material.opacity = 0.3 * (1 - taken);
    this.hero.card.position.set(0, taken * 0.5, taken * 0.6);
    this.hero.card.scale.setScalar(0.42 + taken * 0.24);
    if (retrieve > 0.02) {
      this.hero.node.updateMatrixWorld(true);
      k.group.updateMatrixWorld(true);
      this.hero.glyph.getWorldPosition(this._memoryCore);
      k.handR.getWorldPosition(this._memoryHand);
      this._memoryContactDelta.subVectors(this._memoryCore, this._memoryHand);
      k.group.position.add(this._memoryContactDelta);
    }

    /* ---- the living things ---- */
    this.jellies.forEach((j) => {
      const pulse = 0.5 + 0.5 * Math.sin(t * j.sp * 2 + j.ph);
      j.node.position.set(j.base.x, j.base.y + Math.sin(t * j.sp + j.ph) * 1.2, j.base.z);
      j.dome.scale.set(1 + pulse * 0.2, 1 - pulse * 0.24, 1 + pulse * 0.2);
      j.dome.material.opacity = 0.18 + dive * 0.2;
      j.tendrils.forEach((tn, i) => {
        tn.line.rotation.x = Math.sin(t * j.sp * 2 + i) * 0.2;
        tn.line.rotation.z = Math.cos(t * j.sp * 2 + i * 0.7) * 0.2;
        tn.line.material.opacity = (0.2 + dive * 0.25) * (0.6 + pulse * 0.4);
      });
    });

    for (let i = 0; i < this.school.count; i++) {
      const f = this.fishSeeds[i];
      const a = f.a + t * f.sp;
      const x = -3.6 + Math.cos(a) * f.r;
      const z = -3.6 + Math.sin(a) * f.r * 0.8;
      this._dummy.position.set(x, f.y + Math.sin(t * 0.8 + f.ph) * 0.5, z);
      this._dummy.rotation.set(0, -a + Math.PI / 2, Math.sin(t * 6 + f.ph) * 0.25);
      this._dummy.scale.setScalar(1);
      this._dummy.updateMatrix();
      this.school.setMatrixAt(i, this._dummy.matrix);
    }
    this.school.instanceMatrix.needsUpdate = true;
    this.school.material.opacity = 0.35 + dive * 0.3;

    /* ---- the sea watches him take it back, and does not stop him ---- */
    this.seaSelf.blendMood('watching', 'receding', win(p, 0.62, 1));
    this._v.copy(this.hero.node.position);
    this.seaSelf.reachToward(this._v);
    this.seaSelf.update(t, dt, motion);

    this.shot(CAM, p);
    exp.setLights({
      hemi: 0.5 + dive * 0.15,
      key: 0.42,
      rim: 0.85,
      accent: retrieve > 0.02
        ? { pos: [this.hero.node.position.x, this.hero.node.position.y, this.hero.node.position.z], intensity: taken * 3.4, color: P.gold }
        : null
    });
  }
}
