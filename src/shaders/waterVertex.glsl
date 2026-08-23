// Watercolor river surface — gentle two-axis swell.
// The plane is authored in XY and rotated flat by the scene,
// so local +Z is world up.
varying vec2 vUv;
varying float vWave;

uniform float uTime;
uniform float uAmp;

void main() {
  vUv = uv;
  vec3 p = position;

  float w = sin(p.x * 0.8 + uTime * 1.1) * 0.5
          + sin(p.y * 1.35 + uTime * 0.7) * 0.5;
  p.z += w * uAmp;
  vWave = w;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
