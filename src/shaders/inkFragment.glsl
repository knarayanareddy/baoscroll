// Ink-blot transition + rice-paper cover.
// Two layers in one pass:
//   uPaper    — opacity of a full-screen rice paper sheet (chapter 1 opening)
//   uProgress — radius of an ink blot spreading from uCenter (0 none .. 1 covers screen)
// The blot alpha uses fbm noise so its edge bleeds like wet ink on fibrous paper.
precision highp float;

varying vec2 vUv;

uniform float uProgress;
uniform float uPaper;
uniform float uTime;
uniform float uAspect;
uniform vec2 uCenter;
uniform vec3 uInkColor;
uniform vec3 uPaperColor;

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
    p *= 2.13;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 d2 = vUv - uCenter;
  d2.x *= uAspect;
  float d = length(d2);

  // wet edge wobble
  float n = fbm(vUv * 5.0 + uTime * 0.03) * 0.22;

  float r = uProgress * 1.45;
  float blot = 1.0 - smoothstep(r - 0.16, r + 0.02, d + n);

  // paper fibers inside painted areas
  float fiber = 0.955 + 0.045 * noise(vUv * vec2(150.0, 38.0));
  float speck = 0.985 + 0.015 * noise(vUv * 70.0);

  vec3 paperCol = uPaperColor * fiber * speck;
  vec3 inkCol = uInkColor * (0.9 + 0.1 * fiber);

  // paper sheet under, ink blot over
  float alpha = max(uPaper, blot);
  vec3 col = mix(paperCol, inkCol, blot);

  if (alpha < 0.003) discard;
  gl_FragColor = vec4(col, alpha);
}
