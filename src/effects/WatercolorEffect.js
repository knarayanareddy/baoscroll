import * as THREE from 'three';
import inkVertex from '../shaders/inkVertex.glsl?raw';

// A soft full-screen pigment wash — cyan/violet/pink blooms creeping in
// from the frame edges like wet paint on soaked paper. Scenes push a
// strength every frame they want it (river, finale); it decays to zero
// on its own, so it needs no cleanup on chapter changes.
const washFragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uStrength;
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 3; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; }
  return v;
}

void main() {
  float edge = distance(vUv, vec2(0.5, 0.5));
  float n1 = fbm(vUv * 3.5 + uTime * 0.04);
  float n2 = fbm(vUv * 5.5 - uTime * 0.03 + 7.3);
  vec3 col = mix(uColorA, uColorB, n1);
  col = mix(col, uColorC, n2 * 0.6);
  float alpha = smoothstep(0.25, 0.75, edge + (n1 - 0.5) * 0.4) * uStrength * 0.4;
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(col, alpha);
}
`;

export class WatercolorEffect {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.strength = 0;
    this._current = 0;

    this.material = new THREE.ShaderMaterial({
      vertexShader: inkVertex,
      fragmentShader: washFragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uStrength: { value: 0 },
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color('#38b6c9') },
        uColorB: { value: new THREE.Color('#7b6bc9') },
        uColorC: { value: new THREE.Color('#e77fae') }
      }
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    quad.frustumCulled = false;
    this.scene.add(quad);
  }

  setColors(a, b, c) {
    this.material.uniforms.uColorA.value.set(a);
    this.material.uniforms.uColorB.value.set(b);
    this.material.uniforms.uColorC.value.set(c);
  }

  render(renderer, time) {
    this._current += (this.strength - this._current) * 0.08;
    this.strength = 0; // scenes must re-assert every frame
    if (this._current < 0.005) return;
    this.material.uniforms.uStrength.value = this._current;
    this.material.uniforms.uTime.value = time;
    const prev = renderer.autoClear;
    renderer.autoClear = false;
    renderer.render(this.scene, this.camera);
    renderer.autoClear = prev;
  }
}
