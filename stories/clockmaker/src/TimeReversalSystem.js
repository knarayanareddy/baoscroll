import * as THREE from 'three';

// A deterministic reconstruction system. Objects have authored broken and
// whole transforms; `set(progress)` interpolates directly, so upward scroll
// reconstructs and downward scroll unbuilds without event state to undo.
export class TimeReversalSystem {
  constructor() { this.items = []; }

  register(node, { broken, whole, delay = 0, duration = 1, spin = 0 } = {}) {
    this.items.push({ node, broken: broken.clone(), whole: whole.clone(), delay, duration, spin });
    return node;
  }

  set(progress) {
    this.items.forEach(({ node, broken, whole, delay, duration, spin }, index) => {
      const p = Math.max(0, Math.min(1, (progress - delay) / duration));
      node.position.lerpVectors(broken.position, whole.position, p);
      node.quaternion.slerpQuaternions(broken.quaternion, whole.quaternion, p);
      node.scale.lerpVectors(broken.scale, whole.scale, p);
      node.rotation.z += (1 - p) * spin * .002;
      node.visible = p > .001;
      node.userData.reconstruction = p;
      node.userData.index = index;
    });
  }

  static state(node) {
    return { position: node.position.clone(), quaternion: node.quaternion.clone(), scale: node.scale.clone() };
  }
}
