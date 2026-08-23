import * as THREE from 'three';

// Tone mapping stays off on purpose: the paper-cutout look relies on
// exact, art-directed flat colors (MeshBasicMaterial everywhere except
// characters), so we want no film curve between palette and pixels.
export class Renderer {
  constructor(canvas, quality) {
    this.instance = new THREE.WebGLRenderer({
      canvas,
      antialias: quality !== 'low',
      powerPreference: 'high-performance',
      stencil: false
    });
    this.maxDpr = quality === 'high' ? 2 : quality === 'medium' ? 1.6 : 1.25;
    this.instance.outputColorSpace = THREE.SRGBColorSpace;
    this.instance.setClearColor('#f2dfb7');
    this.resize();
  }

  resize() {
    this.instance.setSize(window.innerWidth, window.innerHeight);
    this.instance.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.maxDpr));
  }

  dispose() {
    this.instance.dispose();
  }
}
