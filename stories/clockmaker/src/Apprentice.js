import * as THREE from 'three';

export class Apprentice {
  constructor(kit) {
    const mat = (color) => kit.material('paper', color);
    this.group = new THREE.Group(); this.body = new THREE.Group(); this.body.position.y = .9; this.group.add(this.body);
    const coat = new THREE.Mesh(new THREE.ConeGeometry(.42, .9, 7), mat('#294766')); coat.position.y = .05; this.body.add(coat);
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(.26, .31, .68, 8), mat('#c18c48')); torso.position.y = .28; this.body.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.23, 12, 9), mat('#cf9875')); head.position.y = .75; this.body.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(.25, 10, 8), mat('#4b3023')); hair.position.y = .9; hair.scale.y = .55; this.body.add(hair);
    this.leftHand = this.makeArm(-1, mat); this.rightHand = this.makeArm(1, mat);
    this.leftFoot = this.makeLeg(-1, mat); this.rightFoot = this.makeLeg(1, mat);
    this.watchAnchor = new THREE.Object3D(); this.watchAnchor.position.set(.02, -.02, .12); this.leftHand.anchor.add(this.watchAnchor);
    this.keyAnchor = new THREE.Object3D(); this.keyAnchor.position.set(.02, -.02, .12); this.rightHand.anchor.add(this.keyAnchor);
    this.threadAnchor = new THREE.Object3D(); this.threadAnchor.position.set(.02, -.02, .12); this.rightHand.anchor.add(this.threadAnchor);
    this.satchel = new THREE.Mesh(new THREE.BoxGeometry(.28, .38, .12), mat('#5a3b2d')); this.satchel.position.set(-.34,.15,.24); this.body.add(this.satchel);
    this.coatTail = new THREE.Mesh(new THREE.PlaneGeometry(.5,.48), mat('#203a55')); this.coatTail.position.set(0,-.34,-.27); this.body.add(this.coatTail);
  }

  makeArm(side, mat) {
    const shoulder = new THREE.Group(); shoulder.position.set(side * .31, .43, 0); this.body.add(shoulder);
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(.075,.28,3,7), mat('#294766')); sleeve.position.y = -.18; shoulder.add(sleeve);
    const elbow = new THREE.Group(); elbow.position.y = -.36; shoulder.add(elbow);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(.07,8,6), mat('#cf9875')); hand.position.y = -.25; elbow.add(hand);
    const anchor = new THREE.Object3D(); anchor.position.y = -.31; elbow.add(anchor);
    return { shoulder, elbow, anchor };
  }

  makeLeg(side, mat) {
    const hip = new THREE.Group(); hip.position.set(side * .14,-.3,0); this.body.add(hip);
    const trouser = new THREE.Mesh(new THREE.CapsuleGeometry(.09,.25,3,7), mat('#343946')); trouser.position.y=-.17; hip.add(trouser);
    const foot = new THREE.Object3D(); foot.position.set(0,-.42,.08); hip.add(foot);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(.16,.1,.28), mat('#3d302b')); boot.position.copy(foot.position); hip.add(boot);
    return { hip, anchor: foot };
  }

  setPose(mode, time = 0, phase = 0) {
    const s = Math.sin; this.body.rotation.set(0,0,0); this.leftHand.shoulder.rotation.set(0,0,.1); this.rightHand.shoulder.rotation.set(0,0,-.1); this.leftHand.elbow.rotation.set(0,0,0); this.rightHand.elbow.rotation.set(0,0,0); this.leftFoot.hip.rotation.set(0,0,0); this.rightFoot.hip.rotation.set(0,0,0);
    if (mode === 'run') { const f=time*7; this.leftFoot.hip.rotation.x=-s(f)*.9; this.rightFoot.hip.rotation.x=s(f)*.9; this.leftHand.shoulder.rotation.x=s(f)*.75; this.rightHand.shoulder.rotation.x=-s(f)*.75; this.body.rotation.x=.16; }
    if (mode === 'windKey' || mode === 'repair') { this.body.rotation.x=.24; this.rightHand.shoulder.rotation.x=-1.35; this.rightHand.elbow.rotation.x=-.65; this.leftHand.shoulder.rotation.x=-.75; }
    if (mode === 'catchPendulum') { this.body.rotation.x=.3; this.leftHand.shoulder.rotation.x=-2.1; this.rightHand.shoulder.rotation.x=-1.9; }
    if (mode === 'climbGear') { const f=time*4; this.leftHand.shoulder.rotation.x=-2+s(f)*.4; this.rightHand.shoulder.rotation.x=-2-s(f)*.4; this.leftFoot.hip.rotation.x=-.7-s(f)*.3; this.rightFoot.hip.rotation.x=-.7+s(f)*.3; }
    if (mode === 'holdWatch') { this.leftHand.shoulder.rotation.x=-1.1; this.rightHand.shoulder.rotation.x=-1.0; this.body.rotation.x=.15; }
    if (mode === 'reachThread' || mode === 'placeHand') { this.leftHand.shoulder.rotation.x=-1.6; this.rightHand.shoulder.rotation.x=-1.7; this.body.rotation.x=.22; }
    if (mode === 'setWatchDown') { this.body.rotation.x=.42; this.leftHand.shoulder.rotation.x=-1.2; this.rightHand.shoulder.rotation.x=-.8; }
    this.coatTail.rotation.x=-.12-Math.abs(s(time*3))*.12;
  }
}
