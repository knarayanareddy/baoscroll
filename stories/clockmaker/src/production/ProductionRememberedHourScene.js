import * as THREE from 'three';
import { ProductionBaseScene } from './ProductionBaseScene.js';
import { ClockmakerApprentice } from './ClockmakerApprentice.js';
import { MaterialTimeReversal } from './MaterialTimeReversal.js';
import { PocketWatch } from '../PocketWatch.js';

const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
const win = (p, a, b) => ease((p - a) / (b - a));

const SHOTS = [
  { at: 0, pos: [-5.4, 3.55, 11.4], look: [0, 1.35, 0], fov: 44 },
  { at: .13, pos: [-3.4, 2.9, 7.7], look: [-.3, 1.3, .15], fov: 41 },
  { at: .30, pos: [-1.6, 2.35, 4.8], look: [0, 1.38, .2], fov: 37 },
  { at: .51, pos: [2.6, 2.65, 5.8], look: [.65, 1.48, .15], fov: 35 },
  { at: .67, pos: [1.15, 2.1, 3.1], look: [.12, 1.24, .47], fov: 29 },
  { at: .82, pos: [-1.9, 3.1, 6.3], look: [0, 1.65, -.2], fov: 41 },
  { at: 1, pos: [-5.8, 4.15, 11.8], look: [0, 1.55, -2.1], fov: 47 }
];

function interpolateShot(p, position, look) {
  let i = 0;
  while (i < SHOTS.length - 2 && p >= SHOTS[i + 1].at) i++;
  const a = SHOTS[i], b = SHOTS[i + 1];
  const t = ease((p - a.at) / (b.at - a.at));
  position.set(...a.pos).lerp(new THREE.Vector3(...b.pos), t);
  look.set(...a.look).lerp(new THREE.Vector3(...b.look), t);
  return a.fov + (b.fov - a.fov) * t;
}

function transformOf(node) {
  return { position: node.position.clone(), quaternion: node.quaternion.clone(), scale: node.scale.clone() };
}

// Production benchmark: each visible object belongs to the remembered
// workshop and has a broken state, a whole state, a material state, or all
// three. This is deliberately a real room, not fragments in empty space.
export class ProductionRememberedHourScene extends ProductionBaseScene {
  build() {
    const { group: g, experience, kit } = this;
    this.reverse = new MaterialTimeReversal();
    this._hand = new THREE.Vector3();
    this._watch = new THREE.Vector3();
    this._delta = new THREE.Vector3();
    this._workbenchLights = [];

    /* ---------------- workshop architecture ---------------- */
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 14), kit.material('wood', '#4d352b'));
    floor.rotation.x = -Math.PI / 2; g.add(floor);
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), kit.material('paper', '#1c2d45'));
    backWall.position.set(0, 4, -4.1); g.add(backWall);
    const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), kit.material('paper', '#26364e'));
    sideWall.position.set(-7.5, 4, 0); sideWall.rotation.y = Math.PI / 2; g.add(sideWall);

    // Tall workshop window: it is the blue-black present outside the warm
    // remembered room, visually separating memory from resurrection.
    this.window = new THREE.Group(); this.window.position.set(4.8, 3.7, -3.95); g.add(this.window);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3.6, .12), kit.material('wood', '#3e2a22')); this.window.add(frame);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(3.25, 3.35), new THREE.MeshBasicMaterial({ color: '#6f9bb3', transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false })); glass.position.z = .08; this.window.add(glass);
    for (let i = -1; i <= 1; i++) { const muntin = new THREE.Mesh(new THREE.BoxGeometry(.06, 3.4, .13), kit.material('wood', '#35251f')); muntin.position.set(i * 1.05, 0, .12); this.window.add(muntin); }
    for (let i = -1; i <= 1; i++) { const muntin = new THREE.Mesh(new THREE.BoxGeometry(3.3, .06, .13), kit.material('wood', '#35251f')); muntin.position.set(0, i * 1.05, .12); this.window.add(muntin); }

    /* ---------------- lived-in workbench ---------------- */
    this.bench = kit.workbench(); this.bench.position.set(.15, 0, .15); g.add(this.bench);
    this.watch = new PocketWatch(kit); this.watch.root.position.set(.12, 1.26, .26); this.bench.add(this.watch.root);
    this.deskLight = new THREE.PointLight('#ffd47b', 0, 10, 2); this.deskLight.position.set(-1.8, 2.05, .3); g.add(this.deskLight);
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(.17, .2, .1, 10), kit.material('brass', '#8a6329')); lampBase.position.set(-1.8, 1.22, .3); this.bench.add(lampBase);
    const lampGlow = new THREE.Mesh(new THREE.SphereGeometry(.15, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffe3a0', transparent: true, opacity: .2 })); lampGlow.position.set(-1.8, 1.75, .3); this.bench.add(lampGlow); this.lampGlow = lampGlow;

    this.tools = [];
    for (let i = 0; i < 16; i++) {
      const kind = i % 4;
      const node = kind === 0 ? kit.gear({ teeth: 10 + (i % 5) * 2, radius: .12 + (i % 4) * .05 })
        : kind === 1 ? new THREE.Mesh(new THREE.BoxGeometry(.65, .05, .08), kit.material('brass', '#b98942'))
        : kind === 2 ? new THREE.Mesh(new THREE.CylinderGeometry(.025, .045, .55, 6), kit.material('wood', '#4b3328'))
        : kit.blueprint({ width: .6, height: .42 });
      const whole = new THREE.Object3D(); whole.position.set(-2.25 + (i % 8) * .55, 1.26 + (i % 3) * .025, -.65 + Math.floor(i / 8) * 1.15); whole.rotation.set(0, (i % 5) * .4, (i % 7) * .12); whole.scale.setScalar(kind === 3 ? .72 : 1);
      const broken = whole.clone(); broken.position.add(new THREE.Vector3(-3.2 + (i * 7 % 6), -1.5 + (i * 11 % 5), -1.7 - (i % 4))); broken.rotation.set(i * .61, i * .29, i * .93); broken.scale.multiplyScalar(.18 + (i % 4) * .14);
      node.position.copy(broken.position); node.quaternion.copy(broken.quaternion); node.scale.copy(broken.scale); this.bench.add(node);
      this.reverse.register(node, { broken: transformOf(broken), whole: transformOf(whole), delay: (i % 12) * .025, duration: .44, brokenColor: '#263850', wholeColor: kind === 0 || kind === 1 ? '#b98942' : '#d9c9aa' });
      this.tools.push(node);
    }

    /* ---------------- wall clocks and shelves ---------------- */
    this.wallClocks = [];
    for (let i = 0; i < 7; i++) {
      const clock = kit.clockFace({ radius: .34 + (i % 3) * .08 });
      const whole = new THREE.Object3D(); whole.position.set(-5.8 + (i % 4) * 1.55, 2.25 + Math.floor(i / 4) * 1.65, -3.9); whole.scale.setScalar(1);
      const broken = whole.clone(); broken.position.add(new THREE.Vector3(-2 + (i % 4), -2.5 + (i % 3), .7)); broken.rotation.set(0, 0, i * .8); broken.scale.setScalar(.2);
      clock.position.copy(broken.position); clock.quaternion.copy(broken.quaternion); clock.scale.copy(broken.scale); g.add(clock);
      this.reverse.register(clock, { broken: transformOf(broken), whole: transformOf(whole), delay: .08 + (i % 7) * .035, duration: .5, brokenColor: '#20324a', wholeColor: '#eee1bd' });
      this.wallClocks.push(clock);
    }

    /* ---------------- mentor as memory, not body ---------------- */
    this.mentor = new THREE.Group(); this.mentor.position.set(2.45, .16, -.8); g.add(this.mentor);
    const mentorCoat = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 1.72), new THREE.MeshBasicMaterial({ color: '#ffe5aa', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); mentorCoat.position.y = 1.08; this.mentor.add(mentorCoat);
    const mentorHead = new THREE.Mesh(new THREE.CircleGeometry(.32, 16), new THREE.MeshBasicMaterial({ color: '#fff0c6', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); mentorHead.position.set(0, 2.04, .02); this.mentor.add(mentorHead);
    const mentorGlow = new THREE.PointLight('#ffd47b', 0, 10, 2); mentorGlow.position.set(0, 1.45, .1); this.mentor.add(mentorGlow);
    this.mentor.userData = { coat: mentorCoat, head: mentorHead, glow: mentorGlow };

    /* ---------------- reconstruction field ---------------- */
    this.fragments = [];
    for (let i = 0; i < 92; i++) {
      const type = i % 6;
      const node = type < 2 ? kit.gear({ teeth: 10 + (i % 6) * 2, radius: .11 + (i % 5) * .055 })
        : type === 2 ? kit.blueprint({ width: .34, height: .24 })
        : type === 3 ? new THREE.Mesh(new THREE.BoxGeometry(.11 + (i % 3) * .05, .08, .08), kit.material('brass', '#b98942'))
        : new THREE.Mesh(new THREE.PlaneGeometry(.14 + (i % 4) * .04, .12 + (i % 3) * .04), kit.material('enamel', '#e5d6b7'));
      const whole = new THREE.Object3D(); whole.position.set(-2.6 + (i % 13) * .42, 1.28 + (i % 6) * .16, -.58 + (i % 7) * .28); whole.rotation.set(0, 0, (i % 8) * .13); whole.scale.setScalar(type === 2 ? .58 : 1);
      const broken = whole.clone(); broken.position.add(new THREE.Vector3(-5 + (i * 13 % 11), -2.3 + (i * 17 % 8), -2.4 - (i * 5 % 9))); broken.rotation.set(i * .67, i * .31, i * 1.11); broken.scale.multiplyScalar(.16 + (i % 5) * .12);
      node.position.copy(broken.position); node.quaternion.copy(broken.quaternion); node.scale.copy(broken.scale); g.add(node);
      this.reverse.register(node, { broken: transformOf(broken), whole: transformOf(whole), delay: (i % 20) * .015, duration: .52, brokenColor: '#1b2a42', wholeColor: type === 3 ? '#b98942' : '#e4d2af' });
      this.fragments.push(node);
    }

    this.thread = kit.redThread([new THREE.Vector3(-.14, 1.3, .44), new THREE.Vector3(.78, 1.55, .2), new THREE.Vector3(2.42, 1.48, -.75)]); this.thread.visible = false; g.add(this.thread);
    this.timeLight = new THREE.PointLight('#ffd47b', 0, 18, 2); this.timeLight.position.set(.1, 1.45, .5); g.add(this.timeLight);
    this.fog = new THREE.Fog('#1b2a42', 6, 38);
  }

  update(p, time) {
    const reconstruct = win(p, .02, .58);
    const memory = win(p, .23, .68);
    const resist = win(p, .58, .84);
    const collapse = win(p, .82, 1);
    const materialProgress = reconstruct * (1 - collapse);
    this.reverse.set(materialProgress);

    this.watch.setTime(p, .32 + memory * .68);
    this.apprentice.group.position.set(-.1, 0, 2.1 - resist * .74);
    this.apprentice.group.rotation.y = Math.PI - .16 * resist;
    this.apprentice.setAction(resist > .02 ? 'watch' : 'repair', time, resist, .18 + resist * .46);
    if (resist > .02) {
      this.watch.root.updateMatrixWorld(true); this.apprentice.group.updateMatrixWorld(true);
      this.watch.root.getWorldPosition(this._watch); this.apprentice.watchAnchor.getWorldPosition(this._hand);
      this._delta.subVectors(this._watch, this._hand); this.apprentice.group.position.add(this._delta);
    }

    const mentorOpacity = memory * (1 - collapse);
    this.mentor.userData.coat.material.opacity = mentorOpacity * .58;
    this.mentor.userData.head.material.opacity = mentorOpacity * .62;
    this.mentor.userData.glow.intensity = mentorOpacity * 2.8;
    this.mentor.position.y = .16 + Math.sin(time * .62) * .055;
    this.thread.visible = resist > .14;
    this.thread.material.opacity = resist * (1 - collapse);

    this.deskLight.intensity = .35 + materialProgress * 1.8;
    this.lampGlow.material.opacity = .1 + materialProgress * .65;
    this.timeLight.intensity = memory * 2.3 + resist * 3.8;
    this.timeLight.position.copy(this.watch.root.position);
    this.wallClocks.forEach((clock, i) => { clock.userData.minute.rotation.z = -p * (i + 1) * .35; });

    const fov = interpolateShot(p, this._cameraPosition, this._cameraLook);
    this.experience.camera.set(this._cameraPosition, this._cameraLook, fov);
    this.experience.renderer.setClearColor('#1b2a42'); this.experience.scene.fog = this.fog;
    this.experience.lights.hemi.intensity = .42 + memory * .15;
    this.experience.lights.key.intensity = .45 + materialProgress * .35;
    this.experience.lights.rim.intensity = .48 + resist * .16;
    this.experience.lights.accent.position.copy(this.timeLight.position); this.experience.lights.accent.intensity = this.timeLight.intensity;
    this.debugState = { progress: p, reconstruction: materialProgress, mentorOpacity, redThreadVisible: this.thread.visible, finite: this.fragments.every((node) => Number.isFinite(node.position.x) && Number.isFinite(node.position.y) && Number.isFinite(node.position.z)) };
  }
}
