import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { Keeper } from '../characters/Keeper.js';
import { TheSea } from '../characters/TheSea.js';
import { KeepingBook } from '../props/KeepingBook.js';
import { RainGlass } from '../effects/RainGlass.js';
import { PALETTES } from '../utils/constants.js';
import { win, bell, easeOut, mulberry32 } from '../utils/math.js';

const P = PALETTES.firstName;

// Chapter 2 — The First Name.
// Spatial proposition: INTIMATE AND CIRCULAR, after chapter one's long
// horizontal. The camera comes in out of the rain, through the glass,
// and closes to a macro insert on a single line of handwriting. The
// whole chapter happens inside eleven feet of lantern room.
//
// This is also where the antagonist is introduced — not as a storm, but
// as one wave standing still on the horizon, watching, while the keeper
// is busy failing to hold a page down.
const CAM = [
  { t: 0.0, pos: [0, 3.4, 17], look: [0, 2.6, 0], fov: 44 },
  { t: 0.14, pos: [0.4, 2.9, 9.6], look: [0, 2.1, 0], fov: 40 },
  { t: 0.3, pos: [1.1, 2.5, 4.6], look: [0.1, 1.5, 0.2], fov: 38 },
  { t: 0.44, pos: [0.5, 2.15, 2.9], look: [-0.15, 1.3, 0.5], fov: 33 },
  // the macro insert: high enough that the near edge of the desk stays
  // out of the frame, and square onto the line of handwriting
  { t: 0.6, pos: [-0.26, 2.05, 1.95], look: [-0.24, 1.19, 0.62], fov: 27 },
  { t: 0.74, pos: [-0.6, 2.15, 2.5], look: [-0.2, 1.3, 0.5], fov: 31 },
  { t: 0.88, pos: [0.6, 2.3, 3.0], look: [-1.6, 2.2, -5], fov: 40 },
  { t: 1.0, pos: [1.2, 2.5, 3.6], look: [-3.4, 2.6, -13], roll: -0.02, fov: 46 }
];

const BEATS = [
  { at: 0, text: 'Night rain. Inside the lantern room, the keeper is writing the day into the book.' },
  { at: 0.34, text: 'A name begins to lift out of the page: Elias Rune, held there for a hundred years.' },
  { at: 0.62, text: 'The keeper reaches to hold the page still. The ink leaves anyway.' },
  { at: 0.86, text: 'Far out beyond the glass, a wave is standing where no wave should stand.' }
];

export class FirstNameScene extends BaseScene {
  build() {
    const kit = this.experience.kit;
    const rnd = mulberry32(29);

    /* ---- the room: planked floor, curved wall, glazed upper half ---- */
    const floor = new THREE.Mesh(new THREE.CircleGeometry(4.6, 32), kit.woodMat('#5a4133'));
    floor.rotation.x = -Math.PI / 2;
    this.group.add(floor);
    // boards are chorded to the circle so none of them overhang the wall
    for (let i = 0; i < 16; i++) {
      const x = (i - 7.5) * 0.53;
      const chord = 2 * Math.sqrt(Math.max(0.04, 4.5 * 4.5 - x * x));
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, chord), kit.woodMat(i % 2 ? '#6b4d3c' : '#5c4132'));
      board.position.set(x, 0.02, 0);
      this.group.add(board);
    }
    const wainscot = new THREE.Mesh(
      new THREE.CylinderGeometry(4.55, 4.55, 1.5, 24, 1, true),
      kit.woodMat(P.timberDark, { side: THREE.DoubleSide })
    );
    wainscot.position.y = 0.75;
    this.group.add(wainscot);

    this.glass = new THREE.Group();
    this.rainPanes = [];
    this.group.add(this.glass);
    const panes = this.tiered(14, 12, 8);
    for (let i = 0; i < panes; i++) {
      const a = (i / panes) * Math.PI * 2;
      const pane = new THREE.Mesh(
        new THREE.PlaneGeometry(2.0, 3.4),
        new THREE.MeshBasicMaterial({ color: P.glass, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })
      );
      pane.position.set(Math.cos(a) * 4.5, 3.1, Math.sin(a) * 4.5);
      pane.rotation.y = -a + Math.PI / 2;
      this.glass.add(pane);

      // rain lives on the outside face of the glass, not in the air
      const wet = new RainGlass(2.0, 3.4);
      wet.mesh.position.copy(pane.position).multiplyScalar(1.01);
      wet.mesh.position.y = 3.1;
      wet.mesh.rotation.y = pane.rotation.y;
      this.glass.add(wet.mesh);
      this.rainPanes.push(wet);

      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.09, 3.5, 0.09), kit.paperMat(P.ink, { lit: true }));
      mullion.position.set(Math.cos(a + Math.PI / panes) * 4.55, 3.1, Math.sin(a + Math.PI / panes) * 4.55);
      this.glass.add(mullion);
    }
    const ceiling = new THREE.Mesh(new THREE.ConeGeometry(4.8, 1.6, 24), kit.paperMat(P.ink, { lit: true, side: THREE.DoubleSide }));
    ceiling.position.y = 5.6;
    this.group.add(ceiling);

    /* ---- the desk and the book ---- */
    this.desk = new THREE.Group();
    this.desk.position.set(-0.2, 0, 0.6);
    this.group.add(this.desk);
    const top = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.14, 2.9), kit.woodMat('#6b4b3c'));
    top.position.y = 1.1;
    this.desk.add(top);
    for (const [dx, dz] of [[-1.9, -1.2], [1.9, -1.2], [-1.9, 1.2], [1.9, 1.2]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.1, 0.16), kit.woodMat('#4a352b'));
      leg.position.set(dx, 0.55, dz);
      this.desk.add(leg);
    }

    this.book = new KeepingBook(kit, { name: 'ELIAS RUNE' });
    this.book.root.position.set(-0.2, 1.18, 0.5);
    this.book.root.rotation.y = -0.06;
    this.group.add(this.book.root);

    /* ---- brass tools: the texture of a job done by hand ---- */
    const tools = new THREE.Group();
    tools.position.set(-0.2, 1.17, 0.6);
    this.group.add(tools);
    const inkwell = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.2, 10), kit.brassMat('#8a6329'));
    inkwell.position.set(1.5, 0.1, -0.7);
    const inkSurface = new THREE.Mesh(new THREE.CircleGeometry(0.11, 12), new THREE.MeshBasicMaterial({ color: '#1b1410', toneMapped: false }));
    inkSurface.rotation.x = -Math.PI / 2;
    inkSurface.position.set(1.5, 0.2, -0.7);
    const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.022, 0.62, 6), kit.paperMat('#e8dcc0', { lit: true }));
    pen.position.set(1.16, 0.06, -0.34);
    pen.rotation.set(0, 0.4, Math.PI / 2 - 0.3);
    const oilcan = new THREE.Group();
    const canBody = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.24, 10), kit.brassMat('#a17a3c'));
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.032, 0.42, 6), kit.brassMat('#8a6329'));
    spout.position.set(0.14, 0.2, 0);
    spout.rotation.z = -0.7;
    oilcan.add(canBody, spout);
    oilcan.position.set(-1.72, 0.12, -0.62);
    const dividers = new THREE.Group();
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.5, 0.022), kit.brassMat('#b08b45'));
      leg.position.set(s * 0.06, 0.24, 0);
      leg.rotation.z = -s * 0.24;
      dividers.add(leg);
    }
    dividers.position.set(-1.3, 0.02, 0.72);
    dividers.rotation.set(-Math.PI / 2 + 0.2, 0, 0.5);
    const keyring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.014, 5, 14), kit.brassMat('#b08b45'));
    keyring.rotation.x = -Math.PI / 2;
    keyring.position.set(1.75, 0.02, 0.62);
    tools.add(inkwell, inkSurface, pen, oilcan, dividers, keyring);

    // the desk lamp: the only warm thing in the room
    this.deskLamp = new THREE.Group();
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.1, 10), kit.brassMat('#8a6329'));
    const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 6), kit.brassMat('#a17a3c'));
    lampStem.position.y = 0.24;
    const lampGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.17, 0.3, 10),
      new THREE.MeshBasicMaterial({ color: '#ffdb95', transparent: true, opacity: 0.8, toneMapped: false })
    );
    lampGlass.position.y = 0.58;
    this.deskLamp.add(lampBase, lampStem, lampGlass);
    this.deskLamp.position.set(-1.95, 1.17, 0.1);
    this.group.add(this.deskLamp);
    this.deskLight = new THREE.PointLight('#ffcf85', 2.1, 9, 2);
    this.deskLight.position.set(-1.9, 1.95, 0.2);
    this.group.add(this.deskLight);

    /* ---- the unlit Fresnel overhead: a promise, not yet a payoff ---- */
    this.lensStack = new THREE.Group();
    this.lensStack.position.set(0, 4.3, -0.4);
    this.group.add(this.lensStack);
    for (let i = 0; i < 5; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62 + i * 0.14, 0.04, 6, 26), kit.brassMat('#6f5228'));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -0.3 + i * 0.15;
      this.lensStack.add(ring);
    }

    /* ---- weather, outside, seen through glass ---- */
    this.stormLayers = [];
    for (let i = 0; i < 4; i++) {
      const layer = kit.makeCloud(7 + i * 2.4, 0.4 - i * 0.06, '#33505d');
      layer.position.set(-4 + i * 3, 4.2 + i * 0.7, -12 - i * 3.4);
      this.group.add(layer);
      this.stormLayers.push(layer);
    }
    this.distantSea = kit.makeSeaRidge({ width: 60, height: 3.4, seed: 12, color: '#15303d', lean: 0.3 });
    this.distantSea.position.set(-2, -0.4, -19);
    this.group.add(this.distantSea);

    /* ---- the antagonist's first appearance ---- */
    this.sea = new TheSea(kit, { scale: 1.5, shardCount: this.tiered(40, 26, 14) });
    this.sea.root.position.set(-6, -0.6, -21);
    this.group.add(this.sea.root);

    /* ---- the keeper ---- */
    this.keeper = new Keeper(kit);
    this.keeper.group.position.set(-0.2, 0, 2.5);
    this.keeper.group.rotation.y = Math.PI;
    this.keeper.setGrounded(false);
    this.group.add(this.keeper.group);
    // in here the lantern hangs on the desk hook, not in his hand
    this.keeper.setLantern(false);
    this.keeper.setBook(false);

    this.fog = new THREE.Fog(new THREE.Color(P.fog), 9, 40);
    this._reach = new THREE.Vector3();
  }

  update(p, time, dt) {
    const exp = this.experience;
    const motion = this.motion;

    exp.setSky(P.bg, this.fog);
    this.narrate(BEATS, p);

    const writing = win(p, 0.12, 0.38);
    const erase = win(p, 0.34, 0.74);
    const reach = win(p, 0.62, 0.88);
    const turn = win(p, 0.84, 1);

    /* ---- the page loses its name ---- */
    this.book.setErasure(easeOut(erase), time * motion);
    this.book.setGlow(0);
    this.book.root.rotation.z = Math.sin(time * 0.6) * 0.006 * motion;

    /* ---- the keeper: writing, then trying to hold the page ---- */
    const k = this.keeper;
    if (turn > 0.02) {
      // he stands and turns to the window, the book forgotten
      k.group.position.set(-0.9, 0, 1.9);
      k.group.rotation.y = Math.PI - turn * 1.15;
      k.setPose('idle', time);
      k.setHeadLook(-0.2 - turn * 0.3, -0.05);
    } else if (reach > 0.02) {
      k.group.position.set(-0.2, 0, 2.3);
      k.group.rotation.y = Math.PI;
      k.setPose('reach', time, reach);
      // the hand goes exactly where the ink is leaving
      this._reach.set(-0.44, 1.35, 1.12);
    } else {
      k.group.position.set(-0.2, 0, 2.42);
      k.group.rotation.y = Math.PI;
      k.setPose('page', time, writing);
    }
    k.setForce(0.05, time);
    k.setLantern(false);
    k.setBook(false);

    /* ---- the sea, standing still and watching ---- */
    // it only becomes visible as the name finishes leaving
    this.sea.blendMood('absent', 'watching', win(p, 0.5, 0.95));
    this.sea.reachToward(this._reach.set(-0.44, 1.35, 1.12));
    this.sea.update(time * motion, dt, motion);
    this.sea.root.position.x = -6 + Math.sin(time * 0.12) * 1.2 * motion;

    /* ---- weather on the glass and in the distance ---- */
    const rainLevel = 0.5 + erase * 0.5;
    this.rainPanes.forEach((pane, i) => pane.update(time * motion + i * 0.7, rainLevel));
    this.stormLayers.forEach((layer, i) => {
      layer.position.x = -4 + i * 3 + Math.sin(time * 0.07 + i) * 2.6 * motion;
      layer.material.opacity = (0.4 - i * 0.06) * (0.7 + erase * 0.5);
    });
    this.distantSea.position.y = -0.4 + erase * 0.35;

    /* ---- the desk lamp gutters as the room loses something ---- */
    const gutter = 1 - bell(p, 0.42, 0.78) * 0.45;
    this.deskLight.intensity = 2.1 * gutter * (0.96 + Math.sin(time * 9) * 0.04 * motion);
    this.lensStack.rotation.y = time * 0.05 * motion;

    this.shot(CAM, p);
    exp.setLights({
      hemi: 0.42,
      key: 0.5,
      rim: 0.5 + erase * 0.25,
      accent: { pos: [-1.9, 1.95, 0.2], intensity: 1.5 * gutter, color: '#ffcf85' }
    });
  }
}
