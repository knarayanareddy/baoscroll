// Self-contained math helpers (sky-garden module — no cross-module imports).
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const win = (x, a, b, feather = 0) => {
  // windowed 0..1 ramp between a and b with feathered edges
  const lo = a - feather, hi = b + feather;
  if (feather <= 0) return x < a ? 0 : x >= b ? 1 : (x - a) / (b - a);
  if (x <= lo || x >= hi) return 0;
  if (x < a) return (x - lo) / feather;
  if (x > b) return (hi - x) / feather;
  return 1;
};
export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
export const easeOut = (t) => 1 - (1 - t) ** 3;
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// deterministic per-instance hash in [0,1) — used for reversible particle placement
export const hash2 = (i, salt = 0) => {
  const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
