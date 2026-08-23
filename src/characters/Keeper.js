import * as THREE from 'three';

// The Keeper — an old lighthouse keeper built as a cut-paper puppet from
// low-segment flat-shaded parts: indigo oilskin coat, navy knit cap,
// white beard, rust scarf, brass lantern, leather Keeping Book.
//
// Every pose is a pure function of (mode, t, k) so the character animates
// deterministically under scroll scrubbing:
//   t = looping story time, for cycles and breathing
//   k = 0..1 phase inside a progress-window action (haul, reach, wheel…)
// Nothing here stores animation state, which is why reverse scroll plays
// the performance backwards exactly.
//
// Contact points are exposed as anchors (hands, feet) so scenes can bind
// rope, wheel handles and stair treads to the body rather than parking
// the puppet next to a prop and hoping.
//
// PRODUCTION ASSET NOTE: to replace with a rigged model, export a glTF
// (draco, < 2MB) to /public/models/keeper.glb and map this same pose API
// onto its animation clips; scenes only ever call setPose()/setForce().

const COAT = '#2c4a5c';
const COAT_DARK = '#1f3746';
const CAP = '#182a34';
const SKIN = '#c99271';
const BEARD = '#ece5d7';
const SCARF = '#a75b42';
const TROUSER = '#22333c';
const BOOT = '#191f24';

export class Keeper {
  constructor(kit) {
    this.kit = kit;
    const mat = (color) => kit.paperMat(color, { lit: true });

    this.group = new THREE.Group();

    /* ---- body root: all bob/lean happens here, feet stay on the ground ---- */
    this.body = new THREE.Group();
    this.body.position.y = 0.92;
    this.group.add(this.body);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.42, 0.78, 8), mat(COAT));
    torso.position.y = 0.14;
    this.body.add(torso);

    // The coat skirt is a separate group so it can trail behind the body
    // under wind and acceleration instead of moving as one rigid block.
    this.coat = new THREE.Group();
    this.coat.position.y = -0.2;
    this.body.add(this.coat);
    const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.92, 8, 1, true), mat(COAT));
    skirt.position.y = -0.34;
    skirt.rotation.x = Math.PI;
    this.coat.add(skirt);
    this.hem = [];
    for (let i = 0; i < 5; i++) {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.5), kit.paperMat(COAT_DARK, { lit: true, side: THREE.DoubleSide }));
      const a = Math.PI * 0.25 + (i / 4) * Math.PI * 1.5;
      panel.position.set(Math.cos(a) * 0.42, -0.72, Math.sin(a) * 0.42);
      panel.rotation.y = -a + Math.PI / 2;
      panel.userData.base = panel.rotation.x;
      this.coat.add(panel);
      this.hem.push(panel);
    }

    // lapels and buttons keep the silhouette from reading as a barrel
    for (const s of [-1, 1]) {
      const lapel = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.56), kit.paperMat('#3d6272', { lit: true, side: THREE.DoubleSide }));
      lapel.position.set(s * 0.17, 0.16, 0.31);
      lapel.rotation.z = s * 0.2;
      this.body.add(lapel);
    }
    for (let i = 0; i < 3; i++) {
      const button = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), kit.brassMat('#c79a4e'));
      button.position.set(0.03, 0.3 - i * 0.22, 0.35);
      this.body.add(button);
    }

    /* ---- head ---- */
    this.head = new THREE.Group();
    this.head.position.y = 0.66;
    this.body.add(this.head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), mat(SKIN));
    skull.scale.set(1, 1.08, 0.96);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.215, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(CAP));
    cap.position.y = 0.04;
    const brim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 6, 14), mat(CAP));
    brim.rotation.x = Math.PI / 2;
    brim.position.y = 0.03;
    this.head.add(skull, cap, brim);
    // beard: overlapping cones read as carded wool at any distance
    for (let i = 0; i < 5; i++) {
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.075 + (i % 2) * 0.02, 0.26, 5), mat(BEARD));
      tuft.position.set((i - 2) * 0.055, -0.16 - Math.abs(i - 2) * 0.012, 0.13);
      tuft.rotation.x = 0.3;
      tuft.rotation.z = (i - 2) * 0.1;
      this.head.add(tuft);
    }
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.035, 0.06), mat(BEARD));
    brow.position.set(0, 0.06, 0.18);
    this.head.add(brow);
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 5), new THREE.MeshBasicMaterial({ color: '#2b2019', toneMapped: false }));
      eye.position.set(s * 0.075, 0.005, 0.185);
      this.head.add(eye);
    }

    /* ---- scarf: collar plus a tail that always answers the wind ---- */
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.06, 6, 14), mat(SCARF));
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.5;
    this.body.add(collar);
    this.scarfTail = new THREE.Group();
    this.scarfTail.position.set(-0.1, 0.48, -0.16);
    this.body.add(this.scarfTail);
    const tail = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.62), kit.paperMat(SCARF, { lit: true, side: THREE.DoubleSide }));
    tail.position.y = -0.3;
    this.scarfTail.add(tail);

    /* ---- arms: shoulder → elbow → hand anchor ---- */
    const makeArm = (side) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.36, 0.4, 0);
      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.28, 3, 7), mat(COAT));
      upper.position.y = -0.18;
      shoulder.add(upper);
      const elbow = new THREE.Group();
      elbow.position.y = -0.34;
      shoulder.add(elbow);
      const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.24, 3, 7), mat(COAT_DARK));
      fore.position.y = -0.15;
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.07, 8), mat('#3d6272'));
      cuff.position.y = -0.26;
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), mat(SKIN));
      hand.position.y = -0.32;
      elbow.add(fore, cuff, hand);
      const anchor = new THREE.Object3D();
      anchor.position.y = -0.38;
      elbow.add(anchor);
      this.body.add(shoulder);
      return { shoulder, elbow, anchor };
    };
    const left = makeArm(-1);
    const right = makeArm(1);
    this.shoulderL = left.shoulder;
    this.elbowL = left.elbow;
    this.handL = left.anchor;
    this.shoulderR = right.shoulder;
    this.elbowR = right.elbow;
    this.handR = right.anchor;

    /* ---- legs: hip → knee → foot anchor ---- */
    const makeLeg = (side) => {
      const hip = new THREE.Group();
      hip.position.set(side * 0.15, -0.3, 0);
      const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.24, 3, 7), mat(TROUSER));
      thigh.position.y = -0.16;
      hip.add(thigh);
      const knee = new THREE.Group();
      knee.position.y = -0.32;
      hip.add(knee);
      const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.088, 0.22, 3, 7), mat(TROUSER));
      shin.position.y = -0.14;
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.11, 0.3), mat(BOOT));
      boot.position.set(0, -0.29, 0.06);
      knee.add(shin, boot);
      const anchor = new THREE.Object3D();
      anchor.position.set(0, -0.34, 0.06);
      knee.add(anchor);
      this.body.add(hip);
      return { hip, knee, anchor };
    };
    const legL = makeLeg(-1);
    const legR = makeLeg(1);
    this.hipL = legL.hip;
    this.kneeL = legL.knee;
    this.footL = legL.anchor;
    this.hipR = legR.hip;
    this.kneeR = legR.knee;
    this.footR = legR.anchor;

    /* ---- props ---- */
    this.lantern = kit.makeHandLantern();
    this.lantern.position.y = -0.12;
    this.handR.add(this.lantern);

    this.book = new THREE.Group();
    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.4), mat('#6b3b39'));
    const pages = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.05, 0.37), kit.paperMat('#e9dcc0', { lit: true }));
    pages.position.y = 0.012;
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.42), mat('#4a2a29'));
    this.book.add(cover, pages, strap);
    this.book.position.set(0.06, -0.1, 0.06);
    this.book.rotation.z = 0.2;
    this.handL.add(this.book);

    /* ---- contact shadow ---- */
    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.42, 18),
      new THREE.MeshBasicMaterial({ color: '#0d1518', transparent: true, opacity: 0.26, depthWrite: false, toneMapped: false })
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.02;
    this.group.add(this.shadow);

    this._air = 0;
  }

  /** Neutral stance. Every pose starts here so nothing leaks between beats. */
  _reset() {
    this.body.position.set(0, 0.92, 0);
    this.body.rotation.set(0, 0, 0);
    this.head.rotation.set(0, 0, 0);
    this.shoulderL.rotation.set(0, 0, 0.1);
    this.shoulderR.rotation.set(0, 0, -0.1);
    this.elbowL.rotation.set(-0.25, 0, 0);
    this.elbowR.rotation.set(-0.25, 0, 0);
    this.hipL.rotation.set(0, 0, 0.03);
    this.hipR.rotation.set(0, 0, -0.03);
    this.kneeL.rotation.set(0.06, 0, 0);
    this.kneeR.rotation.set(0.06, 0, 0);
    this.coat.rotation.set(0, 0, 0);
  }

  /**
   * Pose dispatch.
   * mode: 'idle'|'walk'|'run'|'brace'|'haul'|'climb'|'page'|'reach'|
   *       'wheel'|'swim'|'release'|'kneel'|'sit'|'fall'
   * t = looping time, k = 0..1 phase inside progress-window actions.
   */
  setPose(mode, t = 0, k = 0) {
    this._reset();
    const s = Math.sin;

    switch (mode) {
      case 'walk': {
        // An old man's walk: short stride, heavy plant, slight forward carry.
        const f = t * 4.2;
        this.hipL.rotation.x = -s(f) * 0.46;
        this.hipR.rotation.x = s(f) * 0.46;
        this.kneeL.rotation.x = Math.max(0, s(f + 0.6)) * 0.5;
        this.kneeR.rotation.x = Math.max(0, s(f + 0.6 + Math.PI)) * 0.5;
        this.shoulderL.rotation.x = s(f) * 0.34;
        this.shoulderR.rotation.x = -s(f) * 0.2;
        this.body.position.y = 0.92 + Math.abs(s(f)) * 0.03;
        this.body.rotation.x = 0.07;
        this.body.rotation.z = s(f) * 0.03;
        this.head.rotation.z = -s(f) * 0.03;
        break;
      }

      case 'run': {
        const f = t * 7.4;
        this.body.rotation.x = 0.24;
        this.hipL.rotation.x = -s(f) * 0.95;
        this.hipR.rotation.x = s(f) * 0.95;
        this.kneeL.rotation.x = Math.max(0, s(f + 0.5)) * 1.05;
        this.kneeR.rotation.x = Math.max(0, s(f + 0.5 + Math.PI)) * 1.05;
        this.shoulderL.rotation.x = s(f) * 0.85;
        this.shoulderR.rotation.x = -s(f) * 0.6;
        this.elbowL.rotation.x = -1.05;
        this.elbowR.rotation.x = -0.9;
        this.body.position.y = 0.92 + Math.abs(s(f)) * 0.055;
        this.head.rotation.x = -0.16;
        break;
      }

      case 'brace': {
        // Braced against the sea: wide base, shoulder into the wind, one
        // arm across the face, lantern held low and away.
        this.hipL.rotation.z = 0.34;
        this.hipR.rotation.z = -0.34;
        this.hipL.rotation.x = -0.3;
        this.hipR.rotation.x = 0.22;
        this.kneeL.rotation.x = 0.42;
        this.body.rotation.x = 0.3 + s(t * 3.1) * 0.02;
        this.body.rotation.z = 0.08;
        this.body.position.y = 0.86;
        this.shoulderL.rotation.x = -1.9;
        this.shoulderL.rotation.z = 0.5;
        this.elbowL.rotation.x = -1.5;
        this.shoulderR.rotation.x = 0.5;
        this.shoulderR.rotation.z = -0.35;
        this.head.rotation.x = 0.3;
        break;
      }

      case 'haul': {
        // One full rope-pull cycle: reach out, drop the weight back, plant
        // and pull through. k drives it so the rope and the body agree.
        const c = k * Math.PI * 2;
        const pull = (1 - Math.cos(c)) * 0.5; // 0 at reach, 1 at full haul
        this.body.rotation.x = 0.14 - pull * 0.42;
        this.body.position.y = 0.92 - pull * 0.1;
        this.body.position.z = pull * 0.12;
        this.shoulderL.rotation.x = -1.5 + pull * 1.1;
        this.shoulderR.rotation.x = -1.62 + pull * 1.15;
        this.shoulderL.rotation.z = 0.3;
        this.shoulderR.rotation.z = -0.28;
        this.elbowL.rotation.x = -0.3 - pull * 1.5;
        this.elbowR.rotation.x = -0.35 - pull * 1.55;
        this.hipL.rotation.x = -0.5 + pull * 0.2;
        this.hipR.rotation.x = 0.34 - pull * 0.3;
        this.kneeL.rotation.x = 0.62;
        this.kneeR.rotation.x = 0.18 + pull * 0.3;
        this.head.rotation.x = -0.1 + pull * 0.3;
        break;
      }

      case 'climb': {
        // Alternating reach up the spiral rail. Feet land on real treads —
        // scenes snap the body to a step, this only sells the effort.
        const f = t * 3.4;
        this.body.rotation.x = -0.18;
        this.shoulderL.rotation.x = -2.1 + s(f) * 0.55;
        this.shoulderR.rotation.x = -2.1 - s(f) * 0.55;
        this.shoulderL.rotation.z = 0.34;
        this.shoulderR.rotation.z = -0.34;
        this.elbowL.rotation.x = -0.7 - Math.max(0, s(f)) * 0.5;
        this.elbowR.rotation.x = -0.7 - Math.max(0, -s(f)) * 0.5;
        this.hipL.rotation.x = -0.62 - s(f) * 0.42;
        this.hipR.rotation.x = -0.62 + s(f) * 0.42;
        this.kneeL.rotation.x = 0.85 + s(f) * 0.4;
        this.kneeR.rotation.x = 0.85 - s(f) * 0.4;
        this.body.position.y = 0.9 + Math.abs(s(f)) * 0.02;
        this.head.rotation.x = -0.3;
        break;
      }

      case 'page': {
        // Standing at the desk over the open book: both hands down, one
        // hand smoothing the page, spine curved over the work.
        const turn = s(k * Math.PI);
        this.body.rotation.x = 0.34;
        this.body.position.y = 0.88;
        this.shoulderL.rotation.x = -0.95;
        this.shoulderL.rotation.z = 0.42;
        this.elbowL.rotation.x = -0.85;
        this.shoulderR.rotation.x = -1.05 - turn * 0.5;
        this.shoulderR.rotation.z = -0.3 - turn * 0.35;
        this.elbowR.rotation.x = -0.7 - turn * 0.6;
        this.head.rotation.x = 0.42;
        this.hipL.rotation.z = 0.1;
        this.hipR.rotation.z = -0.1;
        break;
      }

      case 'reach': {
        // Trying to hold something that is already leaving: extend, open
        // the hand, then let the arm fall as k passes its peak.
        const out = s(Math.min(1, k) * Math.PI);
        const late = Math.max(0, k - 0.6) / 0.4;
        this.body.rotation.x = -0.1 - out * 0.18;
        this.body.position.y = 0.92 + out * 0.05;
        this.shoulderR.rotation.x = -0.4 - out * 1.9 + late * 0.9;
        this.shoulderR.rotation.z = -0.2 - out * 0.2;
        this.elbowR.rotation.x = -0.6 + out * 0.5;
        this.shoulderL.rotation.x = -0.3 - out * 0.5;
        this.elbowL.rotation.x = -0.5;
        this.head.rotation.x = -0.2 - out * 0.25 + late * 0.5;
        this.hipL.rotation.x = -0.16;
        this.kneeR.rotation.x = 0.2;
        break;
      }

      case 'wheel': {
        // Cranking the lamp wheel: hands on opposite handles, body weight
        // dropping into each quarter turn.
        const a = k * Math.PI * 2;
        const effort = (1 - Math.cos(a * 2)) * 0.5;
        this.body.rotation.z = 0.1 + s(a) * 0.07;
        this.body.rotation.x = 0.16 + effort * 0.1;
        this.body.position.y = 0.92 - effort * 0.05;
        this.shoulderL.rotation.x = -1.15 + s(a) * 0.4;
        this.shoulderR.rotation.x = -1.15 - s(a) * 0.4;
        this.shoulderL.rotation.z = 0.5 + Math.cos(a) * 0.2;
        this.shoulderR.rotation.z = -0.5 + Math.cos(a) * 0.2;
        this.elbowL.rotation.x = -0.85 - Math.max(0, s(a)) * 0.5;
        this.elbowR.rotation.x = -0.85 - Math.max(0, -s(a)) * 0.5;
        this.hipL.rotation.z = 0.14;
        this.hipR.rotation.z = -0.14;
        this.hipR.rotation.x = -0.26 + effort * 0.16;
        this.kneeR.rotation.x = 0.34;
        this.head.rotation.x = -0.14;
        break;
      }

      case 'swim': {
        // Descending through the wreck field: slow breaststroke, legs
        // trailing, whole body rolling with the current.
        const f = t * 1.9;
        this.body.rotation.x = 1.15;
        this.body.rotation.z = s(f * 0.7) * 0.14;
        this.shoulderL.rotation.x = -1.4 + s(f) * 0.9;
        this.shoulderR.rotation.x = -1.4 + s(f + 0.5) * 0.9;
        this.shoulderL.rotation.z = 0.6;
        this.shoulderR.rotation.z = -0.6;
        this.elbowL.rotation.x = -0.8 - Math.max(0, s(f)) * 0.7;
        this.elbowR.rotation.x = -0.8 - Math.max(0, s(f + 0.5)) * 0.7;
        this.hipL.rotation.x = -0.3 + s(f * 0.8) * 0.2;
        this.hipR.rotation.x = -0.3 - s(f * 0.8) * 0.2;
        this.kneeL.rotation.x = 0.3;
        this.kneeR.rotation.x = 0.42;
        this.head.rotation.x = -0.5;
        break;
      }

      case 'release': {
        // Opening both hands upward — the gesture the whole story is for.
        const open = s(Math.min(1, k) * Math.PI * 0.5);
        this.body.rotation.x = -0.16 - open * 0.2;
        this.body.position.y = 0.92 + open * 0.04;
        this.shoulderL.rotation.x = -0.5 - open * 2.1;
        this.shoulderR.rotation.x = -0.5 - open * 2.2;
        this.shoulderL.rotation.z = 0.3 + open * 0.5;
        this.shoulderR.rotation.z = -0.3 - open * 0.5;
        this.elbowL.rotation.x = -0.5 + open * 0.45;
        this.elbowR.rotation.x = -0.5 + open * 0.45;
        this.head.rotation.x = -0.24 - open * 0.34;
        this.hipL.rotation.z = 0.06;
        this.hipR.rotation.z = -0.06;
        break;
      }

      case 'kneel': {
        const down = Math.min(1, k);
        this.body.position.y = 0.92 - down * 0.42;
        this.body.rotation.x = 0.24 * down;
        this.hipR.rotation.x = -1.5 * down;
        this.kneeR.rotation.x = 1.7 * down;
        this.hipL.rotation.x = -1.1 * down;
        this.kneeL.rotation.x = 1.4 * down;
        this.shoulderL.rotation.x = -0.5 * down;
        this.shoulderR.rotation.x = -0.75 * down;
        this.head.rotation.x = 0.3 * down;
        break;
      }

      case 'sit': {
        this.body.position.y = 0.62;
        this.hipL.rotation.x = -1.5;
        this.hipR.rotation.x = -1.5;
        this.kneeL.rotation.x = 1.5;
        this.kneeR.rotation.x = 1.5;
        this.shoulderL.rotation.x = -0.3;
        this.shoulderR.rotation.x = -0.35;
        this.head.rotation.x = 0.12 + s(t * 1.1) * 0.02;
        this.body.position.y += s(t * 1.1) * 0.006;
        break;
      }

      case 'fall': {
        this.body.rotation.x = -0.4 - k * 0.5;
        this.shoulderL.rotation.x = -2.4;
        this.shoulderR.rotation.x = -2.5;
        this.shoulderL.rotation.z = 0.7;
        this.shoulderR.rotation.z = -0.7;
        this.hipL.rotation.x = -0.7;
        this.hipR.rotation.x = -0.4;
        this.kneeL.rotation.x = 0.9;
        this.head.rotation.x = -0.3;
        break;
      }

      default: {
        // idle: breath, a slow weight shift, the lantern never quite still
        this.body.position.y = 0.92 + s(t * 1.4) * 0.012;
        this.body.rotation.z = s(t * 0.5) * 0.02;
        this.shoulderL.rotation.x = s(t * 1.4) * 0.05;
        this.shoulderR.rotation.x = s(t * 1.4 + 0.5) * 0.05;
        this.head.rotation.y = s(t * 0.37) * 0.16;
        this.head.rotation.x = s(t * 0.6) * 0.04;
      }
    }
  }

  /**
   * Secondary motion. `force` is how hard the world is pushing (wind,
   * speed, current); applied after setPose so cloth trails the body
   * instead of moving with it.
   */
  setForce(force = 0, t = 0, dir = 1) {
    const f = Math.min(1, Math.max(0, force));
    this.coat.rotation.x += (-0.06 - f * 0.5) * dir;
    this.coat.rotation.z += Math.sin(t * 3.4) * 0.03 * (0.3 + f);
    this.hem.forEach((panel, i) => {
      panel.rotation.x = panel.userData.base - f * 0.7 - Math.sin(t * 5 + i * 0.9) * (0.05 + f * 0.22);
    });
    this.scarfTail.rotation.x = -0.3 - f * 1.1 + Math.sin(t * 4.2) * (0.08 + f * 0.3);
    this.scarfTail.rotation.z = Math.sin(t * 3.1) * (0.06 + f * 0.4);
    this.lantern.rotation.z = Math.sin(t * 2.6) * (0.05 + f * 0.35);
    this.lantern.rotation.x = Math.sin(t * 2.1 + 1) * (0.04 + f * 0.25);
  }

  /** Where the head is pointed, in radians, layered on top of the pose. */
  setHeadLook(yaw = 0, pitch = 0) {
    this.head.rotation.y += yaw;
    this.head.rotation.x += pitch;
  }

  /** Height above the ground plane; the contact shadow answers for it. */
  setAir(height) {
    this._air = height;
    this.group.position.y = height;
    this.shadow.position.y = 0.02 - height;
    const k = Math.max(0.2, 1 - height * 0.4);
    this.shadow.scale.setScalar(k);
    this.shadow.material.opacity = 0.26 * k;
  }

  /** Underwater and in the lantern room there is no ground to shadow onto. */
  setGrounded(on) {
    this.shadow.visible = on;
  }

  setLantern(on, k = 1, t = 0) {
    this.lantern.visible = on;
    if (on) this.lantern.userData.setFlame(k, t);
    this.lantern.userData.light.visible = on;
  }

  setBook(on) {
    this.book.visible = on;
  }
}
