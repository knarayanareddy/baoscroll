// Device capability + preference probes, evaluated once at boot.

export const isTouch =
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer: coarse)').matches;

export const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 'high' — full desktop cinema; 'medium' — tablets / small laptops;
// 'low' — phones and low-memory devices (fewer particles, no AA, lower DPR).
//
// ?quality=low|medium|high forces a tier. This exists for the headless
// smoke test, which runs on software GL and cannot afford the high tier,
// and it is handy for eyeballing the phone build on a desktop.
export function qualityTier() {
  const forced = new URLSearchParams(window.location.search).get('quality');
  if (forced === 'low' || forced === 'medium' || forced === 'high') return forced;

  const mem = navigator.deviceMemory || 8;
  const small = window.innerWidth < 820;
  if (isTouch && (small || mem <= 4)) return 'low';
  if (isTouch || small || mem <= 4) return 'medium';
  return 'high';
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl'))
    );
  } catch {
    return false;
  }
}
