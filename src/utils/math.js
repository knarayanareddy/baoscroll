// Pure math helpers. Everything in the story is a deterministic
// function of scroll progress, which is what makes reverse
// scrolling play the film backwards for free.

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ilerp = (a, b, v) => (b === a ? 0 : clamp((v - a) / (b - a), 0, 1));
export const remap = (v, a, b, c, d) => lerp(c, d, ilerp(a, b, v));

export const smoothstep = (a, b, v) => {
  const t = ilerp(a, b, v);
  return t * t * (3 - 2 * t);
};

export const easeInOut = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t) => t * t * t;

// Progress inside a [a, b] window of a chapter, clamped 0..1.
export const win = (p, a, b) => ilerp(a, b, p);

// Bell curve peaking at the middle of a [a, b] window (0 at edges).
export const bell = (p, a, b) => {
  const t = ilerp(a, b, p);
  return Math.sin(t * Math.PI);
};

// Parabolic jump arc: 0 at k=0 and k=1, peaks 1 at k=0.5.
export const arc = (k) => 4 * k * (1 - k);

// Deterministic PRNG so procedural layouts are stable across frames.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Frame-rate independent damping factor.
export const damp = (smoothing, dt) => 1 - Math.pow(smoothing, dt);

/**
 * Evaluate a camera path at t (0..1).
 * keys: [{ t, pos: [x,y,z], look: [x,y,z], roll?, fov? }] sorted by t.
 * Writes into outPos/outLook (any object with .set(x,y,z)).
 * Returns { roll, fov }.
 */
export function evalPath(keys, t, outPos, outLook) {
  if (t <= keys[0].t) {
    const k = keys[0];
    outPos.set(k.pos[0], k.pos[1], k.pos[2]);
    outLook.set(k.look[0], k.look[1], k.look[2]);
    return { roll: k.roll || 0, fov: k.fov || 42 };
  }
  const last = keys[keys.length - 1];
  if (t >= last.t) {
    outPos.set(last.pos[0], last.pos[1], last.pos[2]);
    outLook.set(last.look[0], last.look[1], last.look[2]);
    return { roll: last.roll || 0, fov: last.fov || 42 };
  }
  let i = 0;
  while (i < keys.length - 2 && keys[i + 1].t < t) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const s = smoothstep(a.t, b.t, t);
  outPos.set(
    lerp(a.pos[0], b.pos[0], s),
    lerp(a.pos[1], b.pos[1], s),
    lerp(a.pos[2], b.pos[2], s)
  );
  outLook.set(
    lerp(a.look[0], b.look[0], s),
    lerp(a.look[1], b.look[1], s),
    lerp(a.look[2], b.look[2], s)
  );
  return {
    roll: lerp(a.roll || 0, b.roll || 0, s),
    fov: lerp(a.fov || 42, b.fov || 42, s)
  };
}
