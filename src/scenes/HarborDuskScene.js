import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { Keeper } from '../characters/Keeper.js';
import { SeaSurface } from '../effects/SeaSurface.js';
import { ParallaxLayers } from '../effects/ParallaxLayers.js';
import { PALETTES } from '../utils/constants.js';
import { win, remap, easeInOut, easeOut, mulberry32, clamp } from '../utils/math.js';

const P = PALETTES.harbor;

// Chapter 1 — Harbor at Dusk.
// Spatial proposition: WIDE AND HORIZONTAL. The camera travels left to
// right along a working dock, the way you read a line of text, and the
// lighthouse waits at the end of the sentence.
//
// The keeper has an ordinary job to finish before the story can start:
// walk the dock, haul the last dory in against the tide, climb to the
// lamp and light it. Everything the reader will lose in later chapters
// is established here as tangible and safe.
const CAM = [
  { t: 0.0, pos: [-16, 3.4, 15], look: [-8, 1.2, 0], fov: 47 },
  { t: 0.18, pos: [-11, 2.6, 10], look: [-6.5, 1.1, 0.6], fov: 44 },
  { t: 0.4, pos: [-4.5, 2.4, 8.4], look: [-2.4, 1.0, 0.8], fov: 42 },
  { t: 0.56, pos: [-1.6, 1.8, 5.4], look: [-1.6, 0.7, 1.1], fov: 38 },
  { t: 0.72, pos: [1.4, 2.3, 7.2], look: [1.2, 1.0, 0.4], fov: 41 },
  { t: 0.88, pos: [6, 4.6, 12], look: [6.6, 4.2, -3], fov: 44 },
  { t: 1.0, pos: [10, 6.4, 16], look: [6.6, 5.4, -3], roll: 0.02, fov: 46 }
];

const BEATS = [
  { at: 0, text: 'Dusk over the harbour. The keeper walks out along the dock as the boats come home.' },
  { at: 0.44, text: 'The keeper hauls the last dory tight against the turning tide.' },
  { at: 0.7, text: 'The keeper climbs the headland to the lighthouse.' },
  { at: 0.88, text: 'The lamp wakes, and the coast has a name again.' }
];

export class HarborDuskScene extends BaseScene {
  build() {
    const exp = this.experience;
    const kit = exp.kit;
    const rnd = mulberry32(11);
    this.parallax = new ParallaxLayers();

    /* ---- water ---- */
    this.sea = new SeaSurface();
    this.sea.mesh.position.y = -0.72;
    this.group.add(this.sea.mesh);

    /* ---- the sky, painted rather than cleared ---- */
    // A flat clear colour reads as daylight no matter how blue it is.
    // Dusk is a gradient: cold overhead, warm where the sun just went.
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 8;
    skyCanvas.height = 256;
    const sctx = skyCanvas.getContext('2d');
    const grad = sctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#23485f');
    grad.addColorStop(0.42, '#3b6c84');
    grad.addColorStop(0.72, '#7d9c9c');
    grad.addColorStop(0.88, '#d8a274');
    grad.addColorStop(1, '#e8b585');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 8, 256);
    const skyTex = new THREE.CanvasTexture(skyCanvas);
    skyTex.colorSpace = THREE.SRGBColorSpace;
    this.sky = new THREE.Mesh(
      new THREE.PlaneGeometry(150, 60),
      new THREE.MeshBasicMaterial({ map: skyTex, depthWrite: false, fog: false, toneMapped: false })
    );
    this.sky.position.set(0, 12, -44);
    this.group.add(this.sky);
    // the sun, already below the headlands, still lighting their edges
    this.afterglow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: kit.tex('glow'), color: '#ffb877', transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })
    );
    this.afterglow.scale.setScalar(22);
    this.afterglow.position.set(-9, 0.5, -34);
    this.group.add(this.afterglow);

    /* ---- distance: torn headlands and a soft sky ---- */
    const bands = [
      { z: -26, h: 5.4, peaks: 3, seed: 4, color: '#20404c' },
      { z: -20, h: 4.2, peaks: 4, seed: 9, color: '#27505a' },
      { z: -15, h: 3.2, peaks: 5, seed: 17, color: '#2e5d64' }
    ];
    for (const b of bands) {
      const ridge = kit.makeHeadland({ width: 66, height: b.h, peaks: b.peaks, seed: b.seed, color: b.color });
      ridge.position.set(0, -0.7, b.z);
      this.group.add(ridge);
    }
    for (let i = 0; i < 6; i++) {
      const cloud = kit.makeCloud(2.2 + (i % 3) * 1.1, 0.5, '#e8cfae');
      cloud.position.set(-20 + i * 8, 5.2 + (i % 3) * 1.6, -13 - (i % 4) * 3);
      this.group.add(cloud);
      this.parallax.add(cloud, { drift: 0.1 + (i % 3) * 0.05, wrap: 54, bob: 0.14, phase: i * 1.6 });
    }

    /* ---- the shore the village actually stands on ---- */
    // A flat ground plane would read as a card floating on the water, so
    // the waterline is cut as a wandering shape and given a lip of wet
    // sand where it meets the sea.
    // Shape coordinates are XY; the -90 degree rotation below maps shape y
    // to world -z, so the inland edge is the larger y.
    const shore = new THREE.Shape();
    shore.moveTo(-28, 18);
    shore.lineTo(28, 18);
    shore.lineTo(28, 4.4);
    for (let i = 14; i >= 0; i--) {
      const x = -28 + (i / 14) * 56;
      shore.lineTo(x, 4.4 + Math.sin(i * 1.7 + 0.6) * 0.9 + Math.sin(i * 0.6) * 0.7);
    }
    shore.closePath();
    const land = new THREE.Mesh(new THREE.ShapeGeometry(shore), kit.paperMat('#4d6a5f', { lit: true }));
    land.rotation.x = -Math.PI / 2;
    land.position.y = -0.64;
    this.group.add(land);
    const wetSand = new THREE.Mesh(new THREE.ShapeGeometry(shore), kit.paperMat('#7d8f74', { lit: true }));
    wetSand.rotation.x = -Math.PI / 2;
    wetSand.position.set(0, -0.7, 0.7);
    this.group.add(wetSand);
    for (let i = 0; i < 9; i++) {
      const rock = kit.makeRock(i + 21, '#3d5750');
      rock.position.set(-22 + i * 5.2 + rnd() * 2, -0.72, -5.2 - rnd() * 1.4);
      rock.scale.multiplyScalar(0.5 + rnd() * 0.7);
      this.group.add(rock);
    }

    /* ---- the village, waking window by window ---- */
    this.cottages = [];
    for (let i = 0; i < 11; i++) {
      const x = -19 + (i % 6) * 2.5 + (i > 5 ? 1.2 : 0);
      const z = -8.5 - Math.floor(i / 6) * 2.4;
      const cottage = kit.makeCottage({
        w: 1.1 + (i % 3) * 0.22,
        h: 0.85 + (i % 4) * 0.2,
        wall: i % 2 ? '#e6d6b8' : P.paper,
        roof: i % 3 ? '#4a3b3a' : '#57453f'
      });
      cottage.position.set(x, -0.66, z);
      cottage.rotation.y = (rnd() - 0.5) * 0.5;
      this.group.add(cottage);
      this.cottages.push(cottage);
    }

    /* ---- the dock: the reader's path through the chapter ---- */
    this.dock = kit.makeDeck({ planks: 26, width: 0.62, depth: 4.4 });
    this.dock.position.set(-13.5, -0.3, 1);
    this.group.add(this.dock);
    for (let i = 0; i < 9; i++) {
      const piling = kit.makePiling({ height: 1.5, rope: i % 2 === 0 });
      piling.position.set(-13.2 + i * 2.05, -1.5, i % 2 ? 2.7 : -0.7);
      this.group.add(piling);
    }
    // harbour clutter — the tangible foreground the visual bible asks for
    for (let i = 0; i < 7; i++) {
      const prop = i % 3 === 0 ? kit.makeBarrel(0.9 + rnd() * 0.3) : kit.makeCrate(0.85 + rnd() * 0.4);
      prop.position.set(-12 + i * 1.9 + rnd(), -0.02, 1 + (rnd() - 0.5) * 1.6);
      prop.rotation.y = rnd() * Math.PI;
      this.group.add(prop);
    }
    const net = kit.makeNet({ width: 1.8, height: 1.3 });
    net.position.set(-8.2, 0.9, 0.2);
    this.group.add(net);

    /* ---- the dory the keeper has come out to secure ---- */
    this.dory = kit.makeDory({ sail: true });
    this.dory.position.set(-1.4, -0.2, 3.4);
    this.dory.rotation.y = 0.3;
    this.group.add(this.dory);
    this.doryHome = new THREE.Vector3(-1.9, -0.2, 2.1);
    this.doryAway = new THREE.Vector3(-0.6, -0.2, 4.3);

    this.rope = kit.makeRope(
      new THREE.Vector3(-2.6, 0.2, 1.2),
      new THREE.Vector3(-1.4, 0.1, 3.2),
      { color: P.paperShade, sag: 0.85 }
    );
    this.group.add(this.rope);

    for (let i = 0; i < 3; i++) {
      const buoy = kit.makeBuoy(i % 2 ? P.coral : '#d9c9a6');
      buoy.position.set(1.6 + i * 2.4, -0.5, 4 + (i % 2) * 1.8);
      this.group.add(buoy);
    }

    /* ---- the lighthouse, waiting at the end of the walk ---- */
    this.headland = kit.makeRock(3, '#28433f');
    this.headland.scale.set(9, 2.4, 6);
    this.headland.position.set(7, -1.1, -3);
    this.group.add(this.headland);

    this.tower = kit.makeLighthouse({ height: 6.4 });
    this.tower.position.set(6.6, -0.1, -3);
    this.group.add(this.tower);
    this.lamp = new THREE.PointLight(P.window, 0, 26, 2);
    this.lamp.position.set(6.6, this.tower.position.y + this.tower.userData.lampY, -3);
    this.group.add(this.lamp);

    // the path up the headland the keeper actually walks
    this.steps = [];
    for (let i = 0; i < 12; i++) {
      const t = i / 11;
      const step = new THREE.Mesh(
        kit.geo('harborStep', () => new THREE.BoxGeometry(1.1, 0.13, 0.62)),
        kit.woodMat(i % 2 ? '#6b5040' : '#5b4436')
      );
      const x = 1.6 + t * 4.6;
      const y = -0.32 + t * 1.5;
      const z = 1.2 - t * 3.6;
      step.position.set(x, y, z);
      step.rotation.y = -0.6;
      this.group.add(step);
      this.steps.push(new THREE.Vector3(x, y + 0.07, z));
    }

    /* ---- warm light lying down on quiet water ---- */
    // Real reflections would cost a second render pass for very little;
    // what sells dusk is that the warm light is *long*, *broken* and
    // slower than the waves, so it is built as stretched additive
    // streaks that breathe under each source.
    this.reflections = [];
    const sources = [
      { x: 6.6, z: -3, color: P.window, spread: 1.5, n: 7 },
      { x: -14, z: -8, color: '#ffcf8a', spread: 2.6, n: 4 },
      { x: -6, z: -8.5, color: '#ffc178', spread: 2.2, n: 4 }
    ];
    for (const s of sources) {
      for (let i = 0; i < s.n; i++) {
        const streak = new THREE.Mesh(
          new THREE.PlaneGeometry(0.24 + rnd() * 0.5, 0.9 + rnd() * 2.4),
          new THREE.MeshBasicMaterial({
            color: s.color,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false
          })
        );
        streak.rotation.x = -Math.PI / 2;
        streak.position.set(s.x + (rnd() - 0.5) * s.spread, -0.7, s.z + 3 + i * 1.5);
        this.group.add(streak);
        this.reflections.push({ node: streak, ph: rnd() * Math.PI * 2, near: i / s.n });
      }
    }

    /* ---- life ---- */
    this.gulls = [];
    for (let i = 0; i < 7; i++) {
      const gull = kit.makeGull('#f2e3c4');
      this.group.add(gull);
      this.gulls.push({ node: gull, r: 4 + rnd() * 5, y: 3 + rnd() * 3, a: rnd() * Math.PI * 2, sp: 0.2 + rnd() * 0.25 });
    }
    this.motes = kit.makeMotes(this.tiered(20, 12, 6), '#ffdf9f', [22, 3.4, 8]);
    this.motes.position.set(-6, 0.4, 1.5);
    this.group.add(this.motes);

    /* ---- the keeper ---- */
    this.keeper = new Keeper(kit);
    this.keeper.group.position.set(-13, 0, 1);
    this.keeper.group.rotation.y = Math.PI / 2;
    this.group.add(this.keeper.group);

    this.fog = new THREE.Fog(new THREE.Color(P.fog), 14, 52);
  }

  update(p, time) {
    const exp = this.experience;
    const motion = this.motion;

    exp.setSky(P.bg, this.fog);
    this.narrate(BEATS, p);

    /* ---- action windows ---- */
    const walk = win(p, 0.05, 0.42); // out along the dock
    const haul = win(p, 0.44, 0.68); // three pulls on the dory line
    const stairs = win(p, 0.7, 0.9); // up the headland
    const light = win(p, 0.86, 1); // the lamp wakes

    /* ---- the keeper's continuous path through the chapter ---- */
    const k = this.keeper;
    if (stairs > 0.001) {
      // walking the steps: snap to real treads so the feet land on wood
      const i = Math.min(this.steps.length - 1, Math.floor(easeInOut(stairs) * (this.steps.length - 1)));
      const step = this.steps[i];
      k.group.position.set(step.x, step.y, step.z);
      k.group.rotation.y = -0.95;
      k.setPose('walk', time * 0.8);
      k.setForce(0.15, time);
    } else if (haul > 0.001) {
      k.group.position.set(-2.9, 0, 1.35);
      k.group.rotation.y = 1.15;
      // three complete pull cycles across the window
      k.setPose('haul', time, (haul * 3) % 1);
      k.setForce(0.25 + haul * 0.2, time);
    } else {
      const x = remap(easeInOut(walk), 0, 1, -13, -3.2);
      k.group.position.set(x, 0, 1.35);
      k.group.rotation.y = Math.PI / 2;
      k.setPose(walk > 0.002 && walk < 0.998 ? 'walk' : 'idle', time);
      k.setForce(0.2, time);
    }
    k.setLantern(true, 0.35 + light * 0.5, time);
    k.setBook(true);
    k.setAir(0);
    k.setHeadLook(Math.sin(time * 0.4) * 0.1 * motion, 0);

    /* ---- the rope answers the haul, and the boat answers the rope ---- */
    const tension = easeOut(haul);
    this.rope.userData.setTension(tension * 0.92, tension * (1 - haul * 0.5), time);
    this.dory.position.lerpVectors(this.doryAway, this.doryHome, easeInOut(haul));
    this.dory.position.y = -0.2 + Math.sin(time * 0.9) * 0.07 * motion;
    this.dory.rotation.z = Math.sin(time * 0.9) * (0.05 + tension * 0.06) * motion;
    this.dory.rotation.y = 0.3 - easeInOut(haul) * 0.5;
    if (this.dory.userData.sail) {
      this.dory.userData.sail.rotation.y = Math.sin(time * 0.7) * 0.14 * motion;
    }
    // rope stays attached to the boat as it comes in
    this.rope.userData.setEnds(
      new THREE.Vector3(-2.6, 0.2, 1.2),
      new THREE.Vector3(this.dory.position.x + 0.1, 0.15, this.dory.position.z - 0.6)
    );

    /* ---- the village lights up behind the keeper as dusk settles ---- */
    this.cottages.forEach((c, i) => {
      const seq = win(p, 0.1 + i * 0.045, 0.2 + i * 0.045);
      c.userData.setGlow(seq);
    });

    /* ---- the lamp, last and brightest ---- */
    const beam = easeOut(light);
    this.tower.userData.setGlow(beam);
    this.lamp.intensity = beam * 3.4;
    this.tower.rotation.y = Math.sin(time * 0.15) * 0.02 * motion;

    /* ---- the warm light lies down on the water as dusk deepens ---- */
    const dusk = win(p, 0.05, 0.85);
    this.reflections.forEach((r, i) => {
      const breathe = 0.55 + 0.45 * Math.sin(time * 0.6 * motion + r.ph);
      // nearer streaks are longer and fainter, the way a reflection frays
      // as it comes towards the viewer
      r.node.scale.set(1 + Math.sin(time * 0.9 * motion + r.ph) * 0.3, 1 + r.near * 1.8, 1);
      r.node.position.x += Math.sin(time * 0.4 * motion + r.ph) * 0.004 * motion;
      const source = i < 7 ? Math.max(dusk * 0.35, beam) : dusk;
      r.node.material.opacity = source * breathe * (0.34 - r.near * 0.16);
    });

    /* ---- ambient life ---- */
    this.sea.update(time * motion, 0, 0.1, -0.72 + p * 0.1);
    this.parallax.update(time, motion);
    this.motes.userData.update(time, motion, win(p, 0.2, 0.6) * 0.7);
    this.gulls.forEach((g, i) => {
      const a = g.a + time * g.sp * motion;
      g.node.position.set(-4 + Math.cos(a) * g.r, g.y + Math.sin(a * 1.7) * 0.5, -2 + Math.sin(a) * g.r * 0.5);
      g.node.rotation.y = -a + Math.PI / 2;
      g.node.rotation.z = Math.sin(a) * 0.28;
      g.node.userData.flap(time * 1.1 + i, 0.7);
      // the flock leaves as the light comes on
      g.node.visible = clamp(1 - light * 1.6, 0, 1) > 0.05;
    });

    this.shot(CAM, p);
    exp.setLights({
      hemi: 0.9 - light * 0.2,
      key: 1 - light * 0.25,
      rim: 0.32,
      accent: { pos: [6.6, this.lamp.position.y, -3], intensity: 0.4 + beam * 2.2, color: P.window }
    });
  }
}
