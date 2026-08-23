import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { Keeper } from '../characters/Keeper.js';
import { TheSea } from '../characters/TheSea.js';
import { SeaSurface } from '../effects/SeaSurface.js';
import { PALETTES } from '../utils/constants.js';
import { win, bell, easeOut, easeInOut, remap, clamp, mulberry32 } from '../utils/math.js';

const P = PALETTES.storm;

// Chapter 3 — The Storm Wall.
// Spatial proposition: EXPOSED AND VERTICAL. Chapter one was a long
// horizontal read and chapter two was a closed circle; this one puts the
// camera down at dock level and lets a single moving surface fill the
// top of the frame. The lighthouse is deliberately tiny and warm in the
// corner — the whole composition is one small light against one huge
// wave, and the keeper is smaller still.
const CAM = [
  { t: 0.0, pos: [-13, 1.5, 9.5], look: [-8, 3.4, -4], fov: 52 },
  { t: 0.2, pos: [-8.6, 1.3, 7.4], look: [-5.5, 4.2, -6], roll: 0.02, fov: 50 },
  { t: 0.36, pos: [-5.4, 1.15, 5.6], look: [-3.6, 5.4, -8], roll: 0.04, fov: 54 },
  { t: 0.52, pos: [-3.6, 1.05, 3.4], look: [-2.6, 1.6, -1], roll: 0.03, fov: 42 },
  { t: 0.7, pos: [-1.9, 1.25, 3.0], look: [-2.4, 1.3, -0.4], roll: -0.03, fov: 38 },
  { t: 0.84, pos: [-2.2, 1.6, 5.2], look: [-3.2, 4.6, -7], roll: 0.07, fov: 56 },
  { t: 1.0, pos: [0.6, 2.3, 8.4], look: [7.2, 5.2, -5], roll: 0.03, fov: 48 }
];

const BEATS = [
  { at: 0, text: 'The sea stands up. A wall of black water, taller than the light.' },
  { at: 0.3, text: 'The keeper runs the dock as the first sheets come over the boards.' },
  { at: 0.46, text: 'He braces and hauls the dory line while the harbour goes under fog.' },
  { at: 0.78, text: 'The sea asks for the names, takes one, and the rope goes slack in his hands.' }
];

// Authored lightning: keyed to scroll, not to the clock, so a flash is
// always in the same place in the story and reverses cleanly.
const strike = (p, at, w) => Math.pow(Math.max(0, 1 - Math.abs(p - at) / w), 3);

export class StormWallScene extends BaseScene {
  build() {
    const kit = this.experience.kit;
    const rnd = mulberry32(53);
    this._dummy = new THREE.Object3D();

    /* ---- the water we are standing on ---- */
    this.sea = new SeaSurface();
    this.sea.mesh.position.y = -0.6;
    this.group.add(this.sea.mesh);

    /* ---- THE WALL: stacked torn sheets, each taller and further back --- */
    this.wall = new THREE.Group();
    this.group.add(this.wall);
    this.wallLayers = [];
    const layers = this.tiered(7, 5, 4);
    for (let i = 0; i < layers; i++) {
      const t = i / (layers - 1);
      const ridge = kit.makeSeaRidge({
        width: 52 - i * 2,
        height: 7 + t * 15,
        seed: 21 + i * 7,
        color: i % 2 ? P.inkWall : P.swell,
        lean: 0.25 + t * 0.5
      });
      ridge.position.set(-3 + i * 0.6, -1.2, -9 - i * 2.6);
      ridge.userData = { x: ridge.position.x, sway: 0.5 + t * 1.4, phase: i * 0.8 };
      this.wall.add(ridge);
      this.wallLayers.push(ridge);
    }
    // the curling lip: foam instances riding the top of the nearest sheet
    this.crest = kit.makeFoamInstances(this.tiered(64, 40, 22), P.foam);
    this.group.add(this.crest);
    this.crestSeeds = [];
    for (let i = 0; i < this.crest.count; i++) {
      this.crestSeeds.push({
        x: -26 + rnd() * 52,
        y: 4 + rnd() * 9,
        z: -9 - rnd() * 10,
        s: 1.2 + rnd() * 2.6,
        sp: 0.3 + rnd() * 0.8,
        ph: rnd() * Math.PI * 2
      });
    }

    /* ---- rain, as instanced sheets rather than individual boxes ---- */
    this.rain = kit.makeRainInstances(this.tiered(420, 240, 120), P.rain);
    this.group.add(this.rain);
    this.rainSeeds = [];
    for (let i = 0; i < this.rain.count; i++) {
      this.rainSeeds.push({
        x: -22 + rnd() * 44,
        z: -14 + rnd() * 22,
        y: rnd() * 16,
        sp: 9 + rnd() * 12,
        len: 0.7 + rnd() * 1.5
      });
    }
    // spray kicked off the dock edge where water hits timber
    this.spray = kit.makeFoamInstances(this.tiered(30, 18, 10), '#dceeea');
    this.group.add(this.spray);
    this.spraySeeds = [];
    for (let i = 0; i < this.spray.count; i++) {
      this.spraySeeds.push({ x: -11 + rnd() * 13, z: 0.4 + rnd() * 2.4, ph: rnd() * Math.PI * 2, s: 0.5 + rnd() * 1.1 });
    }

    /* ---- lightning lives inside the cloud layers ---- */
    this.clouds = [];
    for (let i = 0; i < 5; i++) {
      const cloud = kit.makeCloud(9 + i * 2.6, 0.5, '#22394a');
      cloud.position.set(-16 + i * 8, 9 + (i % 3) * 2.4, -18 - (i % 3) * 4);
      this.group.add(cloud);
      this.clouds.push(cloud);
    }
    this.flash = new THREE.PointLight('#cfe6ff', 0, 60, 1.6);
    this.flash.position.set(-6, 12, -14);
    this.group.add(this.flash);

    /* ---- the harbour, going under ---- */
    this.village = new THREE.Group();
    this.group.add(this.village);
    for (let i = 0; i < 8; i++) {
      const cottage = kit.makeCottage({ w: 1.1, h: 0.9, wall: '#8d9a99', roof: '#33424a' });
      cottage.position.set(-18 + i * 2.2, -0.6, -7 - (i % 3) * 1.8);
      this.village.add(cottage);
    }
    this.fogBanks = [];
    for (let i = 0; i < 7; i++) {
      const bank = kit.makeCloud(6 + (i % 3) * 3, 0, '#8fa3a8');
      bank.position.set(-19 + i * 3.1, 0.6 + (i % 3) * 0.5, -6 - (i % 4));
      this.group.add(bank);
      this.fogBanks.push(bank);
    }

    /* ---- the dock, the boat, the rope: what he is trying to keep ---- */
    this.dock = kit.makeDeck({ planks: 22, width: 0.62, depth: 4.2 });
    this.dock.position.set(-11.5, -0.22, 0.8);
    this.group.add(this.dock);
    for (let i = 0; i < 7; i++) {
      const piling = kit.makePiling({ height: 1.6, rope: i % 3 === 0 });
      piling.position.set(-11.2 + i * 2.1, -1.5, i % 2 ? 2.5 : -0.8);
      this.group.add(piling);
    }
    this.dory = kit.makeDory({ sail: false });
    this.dory.position.set(-0.9, -0.1, 3.2);
    this.group.add(this.dory);
    this.rope = kit.makeRope(
      new THREE.Vector3(-2.5, 0.25, 1.1),
      new THREE.Vector3(-0.9, 0.05, 2.9),
      { color: P.rope, sag: 1.1 }
    );
    this.group.add(this.rope);

    /* ---- the lighthouse: small, warm, still there ---- */
    this.tower = kit.makeLighthouse({ height: 6.2 });
    this.tower.position.set(7.4, -0.6, -5);
    this.tower.scale.setScalar(0.92);
    this.group.add(this.tower);
    this.towerLight = new THREE.PointLight(P.ember, 1.6, 30, 2);
    this.towerLight.position.set(7.4, 5.6, -5);
    this.group.add(this.towerLight);

    // the beam, deliberately broken into segments so water and glass can
    // eat pieces of it rather than dimming it uniformly
    this.beam = new THREE.Group();
    this.beam.position.set(7.4, 5.4, -5);
    this.group.add(this.beam);
    this.beamSegments = [];
    for (let i = 0; i < 6; i++) {
      const seg = new THREE.Mesh(
        new THREE.ConeGeometry(1.1 + i * 0.75, 4.6, 18, 1, true),
        new THREE.MeshBasicMaterial({
          color: '#ffe0a2',
          transparent: true,
          opacity: 0.16,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          toneMapped: false
        })
      );
      seg.rotation.z = Math.PI / 2;
      seg.position.x = -2.4 - i * 4.4;
      this.beam.add(seg);
      this.beamSegments.push(seg);
    }

    /* ---- the antagonist, in front of its own wall ---- */
    this.sea3 = new TheSea(kit, { scale: 2.6, shardCount: this.tiered(56, 34, 18) });
    this.sea3.root.position.set(-4.5, 0.4, -7.5);
    this.group.add(this.sea3.root);

    /* ---- the keeper ---- */
    this.keeper = new Keeper(kit);
    this.keeper.group.position.set(-11, 0, 1.1);
    this.group.add(this.keeper.group);

    this.fog = new THREE.Fog(new THREE.Color(P.fog), 6, 38);
    this._reach = new THREE.Vector3();
  }

  update(p, time, dt) {
    const exp = this.experience;
    const motion = this.motion;
    const t = time * motion;

    exp.setSky(P.bg, this.fog);
    this.narrate(BEATS, p);

    const run = win(p, 0.04, 0.3);
    const brace = win(p, 0.3, 0.46);
    const haul = win(p, 0.46, 0.76);
    const take = win(p, 0.76, 1);

    /* ---- the keeper's fight ---- */
    const k = this.keeper;
    const wind = 0.4 + brace * 0.4 + haul * 0.2;
    if (take > 0.02) {
      // the line goes slack: he stumbles back a step and drops to a knee
      k.group.position.set(-2.9 + take * 0.7, 0, 1.25);
      k.group.rotation.y = 1.2;
      k.setPose(take < 0.45 ? 'fall' : 'kneel', time, take < 0.45 ? take / 0.45 : (take - 0.45) / 0.55);
      k.setForce(0.9, time);
    } else if (haul > 0.02) {
      k.group.position.set(-2.9, 0, 1.25);
      k.group.rotation.y = 1.15;
      k.setPose('haul', time, (haul * 4) % 1);
      k.setForce(0.75, time);
    } else if (brace > 0.02) {
      k.group.position.set(-4.4 + brace * 1.5, 0, 1.2);
      k.group.rotation.y = 1.6;
      k.setPose('brace', time);
      k.setForce(0.95, time);
    } else {
      k.group.position.set(remap(easeInOut(run), 0, 1, -11, -4.4), 0, 1.15);
      k.group.rotation.y = Math.PI / 2;
      k.setPose('run', time);
      k.setForce(0.6, time);
    }
    k.setLantern(true, 0.5 - take * 0.4, time);
    k.setBook(false);

    /* ---- the rope: tight through the haul, dead after the take ---- */
    const tension = easeOut(haul) * (1 - easeInOut(take));
    this.rope.userData.setTension(tension * 0.96, (1 - take) * (0.4 + haul * 0.6), t);
    this.rope.userData.setEnds(
      new THREE.Vector3(-2.5, 0.25, 1.1),
      new THREE.Vector3(this.dory.position.x, this.dory.position.y + 0.15, this.dory.position.z - 0.5)
    );
    // the boat is being pulled away again the moment he loses the line
    this.dory.position.set(
      -0.9 + take * 2.6,
      -0.1 + Math.sin(t * 2.4) * (0.16 + take * 0.2),
      3.2 + take * 1.8
    );
    this.dory.rotation.z = Math.sin(t * 2.4) * (0.14 + take * 0.24);
    this.dory.rotation.x = Math.sin(t * 1.7) * 0.1;

    /* ---- the wall moves as one body ---- */
    const surge = 0.35 + brace * 0.3 + haul * 0.25 + take * 0.5;
    this.wallLayers.forEach((layer, i) => {
      const u = layer.userData;
      layer.position.x = u.x + Math.sin(t * 0.4 * u.sway + u.phase) * (0.6 + i * 0.28);
      layer.position.y = -1.2 + surge * (0.8 + i * 0.5) + Math.sin(t * 0.6 + u.phase) * 0.28;
      layer.rotation.z = Math.sin(t * 0.33 + u.phase) * 0.035;
      layer.scale.y = 1 + surge * 0.28;
    });

    /* ---- crest foam riding the lip ---- */
    for (let i = 0; i < this.crest.count; i++) {
      const c = this.crestSeeds[i];
      const drift = ((c.x + t * c.sp * 2) % 52) - 26;
      this._dummy.position.set(drift, c.y + surge * 3.4 + Math.sin(t * c.sp + c.ph) * 0.5, c.z);
      this._dummy.rotation.set(0, 0, Math.sin(t * 0.6 + c.ph) * 0.2);
      this._dummy.scale.setScalar(c.s * (0.7 + surge * 0.6));
      this._dummy.updateMatrix();
      this.crest.setMatrixAt(i, this._dummy.matrix);
    }
    this.crest.instanceMatrix.needsUpdate = true;
    this.crest.material.opacity = 0.35 + surge * 0.5;

    /* ---- rain and spray ---- */
    for (let i = 0; i < this.rain.count; i++) {
      const r = this.rainSeeds[i];
      const y = 16 - ((r.y + t * r.sp) % 16);
      this._dummy.position.set(r.x + y * 0.34, y - 1, r.z);
      this._dummy.rotation.set(0, 0, 0.32);
      this._dummy.scale.set(1, r.len * (1 + surge), 1);
      this._dummy.updateMatrix();
      this.rain.setMatrixAt(i, this._dummy.matrix);
    }
    this.rain.instanceMatrix.needsUpdate = true;
    this.rain.material.opacity = 0.3 + surge * 0.35;

    for (let i = 0; i < this.spray.count; i++) {
      const s = this.spraySeeds[i];
      const burst = Math.max(0, Math.sin(t * 1.7 + s.ph));
      this._dummy.position.set(s.x, -0.4 + burst * (1.4 + surge * 1.8), s.z);
      this._dummy.rotation.set(0, 0, s.ph);
      this._dummy.scale.setScalar(s.s * burst * (0.8 + surge));
      this._dummy.updateMatrix();
      this.spray.setMatrixAt(i, this._dummy.matrix);
    }
    this.spray.instanceMatrix.needsUpdate = true;
    this.spray.material.opacity = 0.5 * (0.5 + surge);

    /* ---- lightning inside the clouds ---- */
    const bolt = Math.max(strike(p, 0.33, 0.035), strike(p, 0.58, 0.028), strike(p, 0.8, 0.04));
    const reduced = exp.reducedMotion ? 0.25 : 1;
    this.flash.intensity = bolt * 26 * reduced;
    this.clouds.forEach((cloud, i) => {
      cloud.position.x += Math.sin(t * 0.05 + i) * 0.01;
      cloud.material.opacity = 0.45 + bolt * 0.4 * reduced;
      cloud.material.color.setStyle('#22394a').lerp(new THREE.Color('#93b7cc'), bolt * reduced);
    });

    /* ---- the harbour disappears into fog ---- */
    const swallow = win(p, 0.34, 0.82);
    this.fogBanks.forEach((bank, i) => {
      bank.position.x = -19 + i * 3.1 + Math.sin(t * 0.11 + i) * 2.4;
      bank.material.opacity = swallow * (0.55 - (i % 3) * 0.08);
    });
    this.village.children.forEach((c, i) => c.userData.setGlow(clamp(1 - swallow * 1.5, 0, 1) * (0.6 + (i % 3) * 0.2)));

    /* ---- the beam, fractured by water and glass ---- */
    this.beam.rotation.y = t * 0.55;
    this.beamSegments.forEach((seg, i) => {
      // segments further out are eaten by the wall and by rain
      const reach = clamp(1 - i * 0.14 - surge * 0.5, 0, 1);
      const chop = 0.5 + 0.5 * Math.sin(t * 6 + i * 1.7);
      seg.material.opacity = 0.2 * reach * (0.55 + chop * 0.45) + bolt * 0.1;
      seg.visible = reach > 0.04;
    });
    this.towerLight.intensity = 1.4 + bolt * 2;
    this.tower.userData.setGlow(0.55);

    /* ---- the antagonist takes what it came for ---- */
    this.sea3.blendMood('watching', 'demanding', win(p, 0.1, 0.62));
    if (take > 0.001) this.sea3.blendMood('demanding', 'striking', easeInOut(take));
    // it reaches for the keeper's hands, where the rope is
    this._reach.set(-2.6, 1.2, 1.3);
    this.sea3.reachToward(this._reach);
    this.sea3.update(t, dt, motion);
    this.sea3.root.position.set(-4.5 + Math.sin(t * 0.2) * 1.4, 0.4 + surge * 1.6, -7.5 + take * 3.4);

    this.sea.update(t, 1, 0, -0.6 + surge * 0.5);

    this.shot(CAM, p);
    exp.setLights({
      hemi: 0.3 + bolt * 0.4,
      key: 0.34 + bolt * 0.6,
      rim: 0.75,
      accent: { pos: [7.4, 5.6, -5], intensity: 1.2, color: P.ember }
    });
  }
}
