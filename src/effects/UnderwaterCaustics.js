import * as THREE from 'three';

// Watercolor caustics. Not the usual hard voronoi cells: two passes are
// composited, a bright filament and a wide soft bleed behind it, so the
// light on the seabed reads as pigment blooming in water rather than as
// a procedural pattern. Additive, so it can be laid over silt and hulls.

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uStrength;
  uniform float uScale;
  uniform vec3 uTint;
  uniform vec3 uBleed;
  varying vec2 vUv;

  // Interfering wave sets; four octaves is enough to lose the grid.
  float weave(vec2 p, float t) {
    float acc = 0.0;
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      vec2 q = p * (1.0 + fi * 0.85) + vec2(sin(t * 0.31 + fi * 1.7) * 1.4, cos(t * 0.27 + fi) * 1.2);
      acc += (sin(q.x + sin(q.y + t * 0.55 + fi)) + sin(q.y * 1.27 - sin(q.x * 0.83 - t * 0.44))) / (1.0 + fi * 0.8);
    }
    return acc;
  }

  void main() {
    vec2 uv = (vUv - 0.5) * uScale;
    float c = weave(uv, uTime);
    float a = abs(c);

    // the filament: thin, bright, always moving
    float filament = smoothstep(1.35, 2.2, a);
    // the bleed: wide and pale, the way wet paper carries pigment out.
    // Kept well below the filament or the whole plane turns into haze.
    float bleed = smoothstep(0.9, 1.9, a);
    // edge falloff so the plane never shows its own rectangle
    vec2 d = abs(vUv - 0.5) * 2.0;
    float edge = (1.0 - smoothstep(0.55, 1.0, d.x)) * (1.0 - smoothstep(0.55, 1.0, d.y));

    vec3 col = uTint * filament * 1.35 + uBleed * bleed * 0.3;
    float alpha = (filament * 0.65 + bleed * 0.06) * uStrength * edge;
    gl_FragColor = vec4(col, alpha);
  }
`;

export class UnderwaterCaustics {
  constructor({ width = 34, height = 30, scale = 4.4, tint = '#8ff0d8', bleed = '#3f9fb5' } = {}) {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uStrength: { value: 1 },
        uScale: { value: scale },
        uTint: { value: new THREE.Color(tint) },
        uBleed: { value: new THREE.Color(bleed) }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), this.material);
    this.mesh.rotation.x = -Math.PI / 2;
  }

  update(time, strength = 1) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uStrength.value = strength;
  }
}
