import * as THREE from 'three';

// Production Clockmaker Apprentice. This rig is intentionally deterministic:
// every pose is a pure function of action, time, phase and force. Scenes solve
// world-space anchor deltas; this rig provides the expressive body response.
export class ClockmakerApprentice {
  constructor(kit) {
    this.kit = kit;
    const paper = (color, opts = {}) => kit.material(opts.kind || 'paper', color, opts);
    this.group = new THREE.Group();
    this.body = new THREE.Group(); this.body.position.y = .94; this.group.add(this.body);

    /* ---------------- silhouette / torso ---------------- */
    const coat = new THREE.Mesh(new THREE.CylinderGeometry(.28, .42, .72, 8), paper('#294766')); coat.position.y = .12; this.body.add(coat);
    const shirt = new THREE.Mesh(new THREE.CylinderGeometry(.2, .25, .54, 8), paper('#c18c48')); shirt.position.y = .25; this.body.add(shirt);
    this.coatTail = new THREE.Group(); this.coatTail.position.set(0, -.25, -.27); this.body.add(this.coatTail);
    this.coatPanels = [];
    for (let i = 0; i < 5; i++) { const panel = new THREE.Mesh(new THREE.PlaneGeometry(.19, .46), paper('#203a55')); panel.position.set((i - 2) * .16, -.24, 0); panel.userData.base = panel.rotation.x; this.coatTail.add(panel); this.coatPanels.push(panel); }
    this.satchel = new THREE.Group(); this.satchel.position.set(-.36, .12, .25); this.body.add(this.satchel);
    const bag = new THREE.Mesh(new THREE.BoxGeometry(.3, .42, .14), paper('#59392c', { kind: 'wood' })); this.satchel.add(bag);
    const strap = new THREE.Mesh(new THREE.BoxGeometry(.05, 1.05, .035), paper('#4a3027', { kind: 'wood' })); strap.position.set(.24, .12, -.1); strap.rotation.z = -.42; this.satchel.add(strap);

    /* ---------------- head / hair / gaze ---------------- */
    this.head = new THREE.Group(); this.head.position.y = .7; this.body.add(this.head);
    const face = new THREE.Mesh(new THREE.SphereGeometry(.22, 12, 9), paper('#cf9875')); this.head.add(face);
    for (let i = 0; i < 7; i++) { const curl = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), paper('#4b3023')); curl.position.set((i - 3) * .06, .17 + (i % 2) * .04, .12); this.head.add(curl); }
    this.gaze = new THREE.Object3D(); this.gaze.position.set(0, .02, .24); this.head.add(this.gaze);

    /* ---------------- limbs and contact anchors ---------------- */
    this.left = this.createArm(-1, paper); this.right = this.createArm(1, paper);
    this.leftLeg = this.createLeg(-1, paper); this.rightLeg = this.createLeg(1, paper);
    this.leftHand = this.left.anchor; this.rightHand = this.right.anchor;
    this.leftFoot = this.leftLeg.anchor; this.rightFoot = this.rightLeg.anchor;
    // Every named anchor is a separate child so props may attach without
    // relying on the generic hand transform.
    this.keyAnchor = this.makeAnchor(this.rightHand, new THREE.Vector3(.02, 0, .08));
    this.toolAnchor = this.makeAnchor(this.rightHand, new THREE.Vector3(.04, -.015, .09));
    this.watchAnchor = this.makeAnchor(this.leftHand, new THREE.Vector3(.02, 0, .1));
    this.threadAnchor = this.makeAnchor(this.rightHand, new THREE.Vector3(.02, 0, .11));
    this.pendulumGripAnchor = this.makeAnchor(this.rightHand, new THREE.Vector3(.02, 0, .12));
    this.gearFootAnchor = this.makeAnchor(this.leftFoot, new THREE.Vector3(0, 0, .05));
    this.minuteHandAnchor = this.makeAnchor(this.rightHand, new THREE.Vector3(.02, 0, .13));

    /* ---------------- held props / moving secondary detail ---------------- */
    this.keyRing = new THREE.Group(); this.keyRing.position.set(.02, -.02, .1); this.rightHand.add(this.keyRing);
    for (let i = 0; i < 3; i++) { const key = new THREE.Mesh(new THREE.TorusGeometry(.05, .012, 5, 10), paper('#b98942', { kind: 'brass' })); key.position.set((i - 1) * .06, -.08 - i * .05, 0); this.keyRing.add(key); }
    this.threadSpool = new THREE.Group(); this.threadSpool.position.set(-.16, -.18, -.12); this.body.add(this.threadSpool);
    const spool = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .18, 10), paper('#b33432', { kind: 'brass' })); spool.rotation.x = Math.PI / 2; this.threadSpool.add(spool);
    this.watchChain = new THREE.Group(); this.watchChain.position.set(.1, .22, .28); this.body.add(this.watchChain);
    for (let i = 0; i < 7; i++) { const link = new THREE.Mesh(new THREE.TorusGeometry(.028, .008, 5, 8), paper('#a87835', { kind: 'brass' })); link.position.set((i - 3) * .025, -.05 - i * .04, 0); link.rotation.x = i % 2 ? Math.PI / 2 : 0; this.watchChain.add(link); }

    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(.42, 18), new THREE.MeshBasicMaterial({ color: '#111824', transparent: true, opacity: .26, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.position.y = .01; this.group.add(this.shadow);
    this._air = 0; this.debug = { action: 'idle', force: 0, anchors: {} };
  }

  createArm(side, paper) {
    const shoulder = new THREE.Group(); shoulder.position.set(side * .34, .42, 0); this.body.add(shoulder);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(.075, .28, 3, 7), paper('#294766')); upper.position.y = -.18; shoulder.add(upper);
    const elbow = new THREE.Group(); elbow.position.y = -.36; shoulder.add(elbow);
    const fore = new THREE.Mesh(new THREE.CapsuleGeometry(.065, .2, 3, 7), paper('#203a55')); fore.position.y = -.14; elbow.add(fore);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(.076, .076, .06, 8), paper('#42617a')); cuff.position.y = -.24; elbow.add(cuff);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), paper('#cf9875')); hand.position.y = -.29; elbow.add(hand);
    const anchor = new THREE.Object3D(); anchor.position.set(0, -.35, .08); elbow.add(anchor);
    return { shoulder, elbow, anchor };
  }

  createLeg(side, paper) {
    const hip = new THREE.Group(); hip.position.set(side * .14, -.3, 0); this.body.add(hip);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(.09, .25, 3, 7), paper('#353a46')); thigh.position.y = -.17; hip.add(thigh);
    const knee = new THREE.Group(); knee.position.y = -.34; hip.add(knee);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(.078, .18, 3, 7), paper('#353a46')); shin.position.y = -.12; knee.add(shin);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(.17, .11, .29), paper('#3d302b', { kind: 'wood' })); boot.position.set(0, -.25, .08); knee.add(boot);
    const anchor = new THREE.Object3D(); anchor.position.set(0, -.31, .08); knee.add(anchor);
    return { hip, knee, anchor };
  }

  makeAnchor(parent, offset) { const anchor = new THREE.Object3D(); anchor.position.copy(offset); parent.add(anchor); return anchor; }

  reset() {
    this.body.position.set(0, .94, 0); this.body.rotation.set(0, 0, 0); this.head.rotation.set(0, 0, 0);
    this.left.shoulder.rotation.set(0, 0, .1); this.right.shoulder.rotation.set(0, 0, -.1); this.left.elbow.rotation.set(0, 0, 0); this.right.elbow.rotation.set(0, 0, 0);
    this.leftLeg.hip.rotation.set(0, 0, 0); this.rightLeg.hip.rotation.set(0, 0, 0); this.leftLeg.knee.rotation.set(0, 0, 0); this.rightLeg.knee.rotation.set(0, 0, 0);
  }

  setAction(action, time = 0, phase = 0, force = 0) {
    const aliases = { wind: 'windKey', catch: 'catchPendulum', climb: 'climbGear', watch: 'holdWatch', thread: 'threadMinuteHand', place: 'setWatchDown' };
    action = aliases[action] || action; this.reset(); const s = Math.sin;
    if (action === 'walk' || action === 'run') { const f = time * (action === 'run' ? 7.2 : 4.1); const a = action === 'run' ? .92 : .45; this.leftLeg.hip.rotation.x = -s(f) * a; this.rightLeg.hip.rotation.x = s(f) * a; this.leftLeg.knee.rotation.x = Math.max(0, s(f + .55)) * a; this.rightLeg.knee.rotation.x = Math.max(0, s(f + Math.PI + .55)) * a; this.left.shoulder.rotation.x = s(f) * a * .72; this.right.shoulder.rotation.x = -s(f) * a * .72; this.body.rotation.x = action === 'run' ? .18 : .06; }
    if (action === 'windKey' || action === 'repair') { this.body.rotation.x = .25; this.right.shoulder.rotation.x = -1.42; this.right.elbow.rotation.x = -.72; this.left.shoulder.rotation.x = -.82; this.left.elbow.rotation.x = -.35; }
    if (action === 'catchPendulum' || action === 'hangPendulum') { this.body.rotation.x = .31; this.left.shoulder.rotation.x = -2.02; this.right.shoulder.rotation.x = -2.12; this.left.elbow.rotation.x = -.42; this.right.elbow.rotation.x = -.46; this.leftLeg.hip.rotation.x = -.28; this.rightLeg.hip.rotation.x = .2; }
    if (action === 'climbGear') { const f = time * 4; this.left.shoulder.rotation.x = -2 + s(f) * .42; this.right.shoulder.rotation.x = -2 - s(f) * .42; this.leftLeg.hip.rotation.x = -.72 - s(f) * .28; this.rightLeg.hip.rotation.x = -.72 + s(f) * .28; this.leftLeg.knee.rotation.x = .58 + s(f) * .2; this.rightLeg.knee.rotation.x = .58 - s(f) * .2; }
    if (action === 'holdWatch') { this.body.rotation.x = .2; this.left.shoulder.rotation.x = -1.18; this.right.shoulder.rotation.x = -1.05; this.left.elbow.rotation.x = -.42; this.right.elbow.rotation.x = -.38; }
    if (action === 'reachMemory') { this.body.rotation.x = .28; this.right.shoulder.rotation.x = -1.9; this.right.elbow.rotation.x = -.48; this.left.shoulder.rotation.x = -.65; }
    if (action === 'releaseHand') { this.body.rotation.x = -.12; this.left.shoulder.rotation.x = -1.9; this.right.shoulder.rotation.x = -1.95; this.left.shoulder.rotation.z = .45; this.right.shoulder.rotation.z = -.45; }
    if (action === 'threadMinuteHand' || action === 'placeHand') { this.body.rotation.x = .23; this.left.shoulder.rotation.x = -1.62; this.right.shoulder.rotation.x = -1.74; this.left.elbow.rotation.x = -.32; this.right.elbow.rotation.x = -.32; }
    if (action === 'setWatchDown') { this.body.rotation.x = .43; this.left.shoulder.rotation.x = -1.25; this.right.shoulder.rotation.x = -.82; this.left.elbow.rotation.x = -.48; }
    if (action === 'lookUp') { this.head.rotation.x = -.42; this.body.rotation.x = -.1; }
    if (action === 'brace') { this.body.rotation.x = .26; this.leftLeg.hip.rotation.z = .26; this.rightLeg.hip.rotation.z = -.26; this.left.shoulder.rotation.x = -1.4; this.right.shoulder.rotation.x = -.9; }
    this.setForce(force, time, action === 'run' ? 1 : .4);
    this.debug.action = action; this.debug.force = force;
  }

  setForce(force = 0, time = 0, direction = 1) {
    const f = clamp(force); this.coatTail.rotation.x = -.1 - f * .55 * direction + Math.sin(time * 3.2) * (.04 + f * .12);
    this.coatPanels.forEach((panel, i) => { panel.rotation.x = panel.userData.base - f * (.25 + i * .06) + Math.sin(time * 4 + i) * (.03 + f * .13); });
    this.satchel.rotation.z = Math.sin(time * 2.2) * (.03 + f * .14); this.keyRing.rotation.z = Math.sin(time * 6) * (.08 + f * .3); this.threadSpool.rotation.z = time * (.18 + f * .75); this.watchChain.rotation.z = Math.sin(time * 2.8) * (.05 + f * .18);
  }

  setHeadLook(yaw = 0, pitch = 0) { this.head.rotation.y += yaw; this.head.rotation.x += pitch; }
  setAir(height = 0) { this._air = height; this.group.position.y = height; this.shadow.position.y = .01 - height; const s = Math.max(.22, 1 - height * .4); this.shadow.scale.setScalar(s); this.shadow.material.opacity = .26 * s; }
  setGrounded(on) { this.shadow.visible = on; }
  captureContacts() { this.group.updateMatrixWorld(true); const out = this.debug.anchors; for (const [name, anchor] of Object.entries({ leftHand:this.leftHand,rightHand:this.rightHand,leftFoot:this.leftFoot,rightFoot:this.rightFoot,key:this.keyAnchor,tool:this.toolAnchor,watch:this.watchAnchor,thread:this.threadAnchor,pendulum:this.pendulumGripAnchor,gearFoot:this.gearFootAnchor,minuteHand:this.minuteHandAnchor })) { out[name] = anchor.getWorldPosition(new THREE.Vector3()).toArray(); } return out; }
}
function clamp(v) { return Math.max(0, Math.min(1, v)); }
