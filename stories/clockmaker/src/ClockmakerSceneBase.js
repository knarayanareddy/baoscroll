import * as THREE from 'three';

export class ClockmakerSceneBase {
  constructor(experience, kit) {
    this.experience = experience;
    this.kit = kit;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.built = false;
    this._cameraPosition = new THREE.Vector3();
    this._cameraLook = new THREE.Vector3();
    experience.world.add(this.group);
  }
  ensure() { if (!this.built) { this.build(); this.built = true; } }
  setVisible(on) { this.group.visible = on; }
  get motion() { return this.experience.reducedMotion ? .25 : 1; }
  build() {}
  update(progress, time, dt) {}
}
