// CloudGardener — the paper-craft hero rig (plan: "visually legible
// silhouette; rain cape, seed satchel, watering tool, boots").
// Named anchors let scenes verify contacts: handL/handR, footL/footR,
// satchel, canSpout, head.
// Poses are pure functions of (progress, action, wind) — reversible.
import * as THREE from 'three';
import { lerp, clamp } from '../utils/math.js';

export class CloudGardener {
  constructor(kit) {
    this.kit = kit;
    this.group = new THREE.Group();
    this.body = new THREE.Group();
    this.group.add(this.body);

    // legs + boots (boots are part of the silhouette contract)
    this.legL = new THREE.Group(); this.legR = new THREE.Group();
    for (const [leg, x] of [[this.legL, -0.11], [this.legR, 0.11]]) {
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.34, 6), kit.matBody);
      thigh.position.y = -0.17;
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.1, 0.2), kit.matBoots);
      boot.position.set(0, -0.37, 0.04);
      leg.add(thigh, boot);
      leg.position.x = x;
      this['foot' + (x < 0 ? 'L' : 'R')] = boot;
      this.body.add(leg);
    }
    // torso + rain cape (cape flutters with wind, transient)
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.42, 8), kit.matBody);
    torso.position.y = 0.21;
    this.body.add(torso);
    this.cape = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5, 4, 4), kit.matCape);
    this.cape.position.set(0, 0.16, -0.12);
    this.cape.rotation.x = 0.25;
    this.body.add(this.cape);
    // head
    this.head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), kit.matBody);
    this.head.position.y = 0.5;
    this.body.add(this.head);
    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.16, 8), kit.matCape);
    hood.position.y = 0.56;
    this.body.add(hood);
    // arms
    this.armL = new THREE.Group(); this.armR = new THREE.Group();
    for (const [arm, x] of [[this.armL, -0.19], [this.armR, 0.19]]) {
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.34, 6), kit.matBody);
      upper.position.y = -0.17;
      arm.add(upper);
      this['hand' + (x < 0 ? 'L' : 'R')] = new THREE.Object3D();
      this['hand' + (x < 0 ? 'L' : 'R')].position.y = -0.35;
      arm.add(this['hand' + (x < 0 ? 'L' : 'R')]);
      arm.position.set(x, 0.38, 0);
      this.body.add(arm);
    }
    // seed satchel (left hip)
    this.satchel = new THREE.Group();
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), kit.matBoots);
    bag.scale.set(1, 0.8, 0.7);
    this.satchel.add(bag);
    this.satchel.position.set(-0.2, 0.02, 0.05);
    this.body.add(this.satchel);
    // watering can (right hand) with named spout anchor
    this.can = new THREE.Group();
    const canBody = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.14, 8), kit.matCan);
    this.can.add(canBody);
    this.canSpout = new THREE.Object3D();
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 0.26, 6), kit.matCan);
    spout.position.set(0.13, 0.06, 0);
    spout.rotation.z = -0.8;
    this.can.add(spout);
    this.canSpout.position.set(0.24, 0.12, 0);
    this.can.add(this.canSpout);
    this.can.position.set(0.22, 0.05, 0.08);
    this.body.add(this.can);
  }

  // action: 'idle' | 'walk' | 'water' | 'climb' | 'run' | 'reach'
  // t: cycle time for walk/run; wind: transient bend; lean: climb lean
  pose(action, t = 0, wind = 0, lean = 0) {
    const swing = Math.sin(t * 6) * 0.5;
    const setLeg = (leg, a) => { leg.rotation.x = a; };
    const setArm = (arm, x, z) => { arm.rotation.set(x, 0, z); };
    switch (action) {
      case 'walk':
        setLeg(this.legL, swing * 0.7); setLeg(this.legR, -swing * 0.7);
        setArm(this.armL, -swing * 0.4, 0); setArm(this.armR, swing * 0.4, 0);
        break;
      case 'run':
        setLeg(this.legL, swing); setLeg(this.legR, -swing);
        setArm(this.armL, -swing * 0.8, 0); setArm(this.armR, swing * 0.8, 0);
        this.body.rotation.x = 0.18;
        break;
      case 'water':
        setLeg(this.legL, -0.1); setLeg(this.legR, 0.1);
        setArm(this.armR, -1.9, 0);      // raise can, spout toward target
        setArm(this.armL, 0.2, 0);
        this.can.rotation.z = -0.5;
        break;
      case 'climb':
        setLeg(this.legL, -0.9); setLeg(this.legR, 0.5);
        setArm(this.armR, -2.2, 0); setArm(this.armL, -1.8, 0.2);
        this.body.rotation.x = -0.2;
        break;
      case 'reach':
        setArm(this.armR, -2.6, 0); setArm(this.armL, -2.2, 0);
        break;
      default: // idle
        setArm(this.armL, 0.1, 0); setArm(this.armR, -0.15, 0);
    }
    // transient wind bend (reversible: pure function of the wind input)
    this.body.rotation.z = -wind * 0.12;
    this.cape.rotation.x = 0.25 + wind * 0.5;
    this.body.rotation.x += lean;
  }

  // distance from an anchor's world position to a world point
  anchorDistance(anchor, worldPoint) {
    const v = new THREE.Vector3();
    anchor.getWorldPosition(v);
    return v.distanceTo(worldPoint);
  }
}
