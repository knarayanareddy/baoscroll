// Flowing watercolor pigment: layered fbm pulls cyan, violet and
// pink through each other like wet paint on soaked paper, with
// loose white reflection streaks.
precision highp float;

varying vec2 vUv;
varying float vWave;

uniform float uTime;
uniform float uFlow;
uniform vec3 uColorA; // cyan
uniform vec3 uColorB; // violet
uniform vec3 uColorC; // pink
uniform vec3 uColorDeep;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.07;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv * vec2(3.0, 6.0);
  uv.y -= uTime * uFlow;

  float n1 = fbm(uv);
  float n2 = fbm(uv * 1.7 + vec2(4.2, -1.3) + n1 * 1.5);

  vec3 col = mix(uColorA, uColorB, smoothstep(0.22, 0.78, n1));
  col = mix(col, uColorC, smoothstep(0.52, 0.95, n2) * 0.75);
  col = mix(uColorDeep, col, 0.72 + 0.28 * (0.5 + 0.5 * vWave));

  // loose brush-stroke reflections
  float streak = smoothstep(0.78, 0.95, noise(vec2(uv.x * 7.0, uv.y * 1.1 + uTime * 0.15)));
  col += streak * 0.14;

  // pigment blooming through wet paper
  col += (fbm(uv * 0.55 + uTime * 0.02) - 0.5) * 0.07;

  gl_FragColor = vec4(col, 1.0);
}
