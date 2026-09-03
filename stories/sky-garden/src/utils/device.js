// Quality tiers + input detection (mirrors the lighthouse/clockmaker pattern).
export const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
export function qualityTier() {
  const p = new URLSearchParams(location.search).get('quality');
  if (p === 'low' || p === 'medium' || p === 'high') return p;
  const mem = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
  const maxTex = gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 4096;
  if (isTouch || mem <= 4 || cores <= 4 || maxTex < 4096) return 'low';
  if (mem <= 8 && cores <= 8) return 'medium';
  return 'high';
}
// per-tier count contracts (plan: "tier contracts exist"; no per-frame allocation)
export const TIERS = {
  low:    { rain: 220, pollen: 40,  petals: 24,  clouds: 7,  ribbons: 4,  dpr: 1 },
  medium: { rain: 480, pollen: 90,  petals: 48,  clouds: 11, ribbons: 6,  dpr: 1.5 },
  high:   { rain: 900, pollen: 160, petals: 96,  clouds: 16, ribbons: 8,  dpr: 2 }
};
