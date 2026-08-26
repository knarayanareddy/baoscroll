import * as THREE from 'three';

export class ProductionBaseScene {
  constructor(experience, index) {
    this.experience = experience; this.index = index; this.group = new THREE.Group(); this.group.visible = false; this.built = false;
    experience.world.add(this.group);
  }
  ensure() { if (!this.built) { this.build(); this.built = true; } }
  setVisible(on) { this.group.visible = on; }
  tiered(high, medium, low) { const q = this.experience.quality || 'high'; return q === 'high' ? high : q === 'medium' ? medium : low; }
  build() {}
  update(progress, time, delta) {}
}
