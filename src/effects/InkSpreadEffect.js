import * as THREE from 'three';
import inkVertex from '../shaders/inkVertex.glsl?raw';
import inkFragment from '../shaders/inkFragment.glsl?raw';

// The signature effect: one clip-space quad that plays three roles —
// the rice-paper sheet the film opens on, the ink drop that becomes
// the mountains, and the ink wipe bridging every chapter boundary.
export class InkSpreadEffect {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.material = new THREE.ShaderMaterial({
      vertexShader: inkVertex,
      fragmentShader: inkFragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uProgress: { value: 0 },
        uPaper: { value: 1 },
        uTime: { value: 0 },
        uAspect: { value: window.innerWidth / window.innerHeight },
        uCenter: { value: new THREE.Vector2(0.5, 0.55) },
        uInkColor: { value: new THREE.Color('#14100c') },
        uPaperColor: { value: new THREE.Color('#f6ead2') }
      }
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    quad.frustumCulled = false;
    this.scene.add(quad);
  }

  set({ ink, paper, time, center }) {
    const u = this.material.uniforms;
    if (ink !== undefined) u.uProgress.value = ink;
    if (paper !== undefined) u.uPaper.value = paper;
    if (time !== undefined) u.uTime.value = time;
    if (center) u.uCenter.value.set(center[0], center[1]);
  }

  get coverage() {
    const u = this.material.uniforms;
    return Math.max(u.uProgress.value, u.uPaper.value);
  }

  render(renderer) {
    const u = this.material.uniforms;
    if (u.uProgress.value <= 0.001 && u.uPaper.value <= 0.001) return;
    const prev = renderer.autoClear;
    renderer.autoClear = false;
    renderer.render(this.scene, this.camera);
    renderer.autoClear = prev;
  }

  resize() {
    this.material.uniforms.uAspect.value = window.innerWidth / window.innerHeight;
  }
}
