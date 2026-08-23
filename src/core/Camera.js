import * as THREE from 'three';
import { damp } from '../utils/math.js';

// The scripted rig: scenes push a base view (position/look/roll/fov)
// evaluated from their keyframe paths; this class layers gentle mouse
// sway on top and smooths fov changes. In explore mode (finale) it
// steps aside for OrbitControls.
export class Camera {
  constructor(experience) {
    this.experience = experience;
    this.instance = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      260
    );
    this.instance.position.set(0, 2, 10);

    this.basePos = new THREE.Vector3(0, 2, 10);
    this.baseLook = new THREE.Vector3(0, 1, 0);
    this.roll = 0;
    this.fovTarget = 42;

    this._mouse = new THREE.Vector2();
    this._target = new THREE.Vector3();
  }

  setView(pos, look, roll = 0, fov = 42) {
    this.basePos.copy(pos);
    this.baseLook.copy(look);
    this.roll = roll;
    this.fovTarget = fov;
  }

  update(dt) {
    const exp = this.experience;
    if (exp.exploreMode) return; // OrbitControls drives the camera

    const motion = exp.reducedMotion ? 0 : exp.isTouch ? 0.3 : 1;

    this._mouse.lerp(exp.pointer, damp(0.005, dt));

    this._target.copy(this.basePos);
    this._target.x += this._mouse.x * 0.32 * motion;
    this._target.y += this._mouse.y * 0.18 * motion;

    this.instance.position.lerp(this._target, damp(0.0005, dt));
    this.instance.lookAt(this.baseLook);

    // roll is applied after lookAt in local space; suppressed for
    // reduced motion and softened on touch devices
    if (this.roll !== 0 && motion > 0) {
      this.instance.rotateZ(this.roll * motion);
    }

    this.instance.fov += (this.fovTarget - this.instance.fov) * Math.min(1, dt * 5);
    this.instance.updateProjectionMatrix();
  }

  resize() {
    this.instance.aspect = window.innerWidth / window.innerHeight;
    this.instance.updateProjectionMatrix();
  }
}
