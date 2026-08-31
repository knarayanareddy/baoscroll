// Sky Garden scene-logic smoke (no browser): builds every shell scene with
// the real Three.js graph in plain Node and scrubs each forward AND reverse.
// Fails on any scene that dereferences state its build never created, any
// non-finite transform, or any state that differs between the forward and
// reverse pass at the same local progress (plan: "Is reverse scroll
// deterministic" — Technical lens).
//
//   node scripts/sky-garden-shell-smoke.mjs
import * as THREE from 'three';

/* ---------------- DOM stubs (must exist before scene imports) ---------------- */
function make2DContext() {
  const gradient = { addColorStop() {} };
  const core = {
    canvas: { width: 0, height: 0 },
    createRadialGradient: () => gradient,
    createLinearGradient: () => gradient,
    measureText: () => ({ width: 0 }),
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) })
  };
  return new Proxy(core, {
    get(target, prop) {
      if (typeof prop === 'symbol') return undefined;
      if (prop in target) return target[prop];
      return () => {};
    },
    set() { return true; }
  });
}
globalThis.document = {
  createElement(tag) {
    if (tag === 'canvas') {
      const c = { width: 0, height: 0, style: {} };
      c.getContext = () => make2DContext();
      return c;
    }
    return {
      style: {}, hidden: false, textContent: '', innerHTML: '',
      classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      addEventListener() {}, removeEventListener() {}, setAttribute() {}, removeAttribute() {},
      appendChild() {}, querySelector: () => null
    };
  },
  getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  body: { classList: { add() {}, remove() {}, toggle() {} } },
  addEventListener() {}, removeEventListener() {}
};
globalThis.window = globalThis;
globalThis.location = { search: '?quality=low' };
globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
globalThis.devicePixelRatio = 1;
globalThis.innerWidth = 1280;
globalThis.innerHeight = 800;
globalThis.Image = class { set src(_v) { setTimeout(() => this.onerror && this.onerror(new Error('offline stub')), 0); } };

/* ---------------- helpers ---------------- */
const failures = [];
const report = [];
const note = (scene, ok, detail) => { report.push({ scene, ok, detail }); if (!ok) failures.push(`${scene}: ${detail}`); };

function assertFiniteSubtree(root) {
  let bad = 0;
  root.traverse((node) => {
    for (const v of [node.position, node.scale, node.quaternion]) {
      if (v && [v.x, v.y, v.z, v.w].some((c) => c !== undefined && !Number.isFinite(c))) bad++;
    }
  });
  return bad;
}

const approxEq = (a, b) => a.length > 0 && a.every((v, i) => Math.abs(v - b[i]) < 1e-4);

const tCtx = (timeRef) => ({ time: timeRef.t, velocity: 0, wind: 0.3 });
const step = (scene, local, timeRef, dt) => { timeRef.t += dt; scene.update(local, timeRef.t, tCtx(timeRef)); };

async function scrub(scene, steps, timeRef, dt) {
  // forward 0 -> 0.5 (capture structural state at 0.5) -> 1.0
  for (let i = 0; i <= Math.floor(steps / 2); i++) step(scene, (i / Math.floor(steps / 2)) * 0.5, timeRef, dt);
  const atHalf = scene.structuralState();
  for (let i = Math.floor(steps / 2); i <= steps; i++) step(scene, i / steps, timeRef, dt);
  const fwdBad = assertFiniteSubtree(scene.group);
  // reverse 1.0 -> 0
  for (let i = steps; i >= 0; i--) step(scene, i / steps, timeRef, dt);
  const revBad = assertFiniteSubtree(scene.group);
  // forward 0 -> 0.5 again: structural state must match the first pass
  for (let i = 0; i <= Math.floor(steps / 2); i++) step(scene, (i / Math.floor(steps / 2)) * 0.5, timeRef, dt);
  const backToHalf = scene.structuralState();
  return { fwdBad, revBad, deterministic: approxEq(atHalf, backToHalf) };
}

/* ---------------- run ---------------- */
const { SkyGardenKit } = await import('../stories/sky-garden/src/kit/SkyGardenKit.js');
const { PlaceholderScene } = await import('../stories/sky-garden/src/scenes/PlaceholderScene.js');
const { WindMazeScene } = await import('../stories/sky-garden/src/scenes/WindMazeScene.js');
const { FirstSeedScene } = await import('../stories/sky-garden/src/scenes/FirstSeedScene.js');
const { DryCloudNurseryScene } = await import('../stories/sky-garden/src/scenes/DryCloudNurseryScene.js');
const { RainReturnsScene } = await import('../stories/sky-garden/src/scenes/RainReturnsScene.js');
const { ThunderOrchardScene } = await import('../stories/sky-garden/src/scenes/ThunderOrchardScene.js');
const { SunTerraceScene } = await import('../stories/sky-garden/src/scenes/SunTerraceScene.js');

const CH_NAMES = ['I Nursery', 'II First Seed', 'III Wind Maze', 'IV Thunder Orchard', 'V Sun Terrace', 'VI Rain Returns'];
const SCENES = [DryCloudNurseryScene, FirstSeedScene, WindMazeScene, ThunderOrchardScene, SunTerraceScene, RainReturnsScene];
const kit = new SkyGardenKit('low');
const ctx = (chapter) => ({ kit, chapter, tier: { low: 1, medium: 1.5, high: 2 }['low'], reducedMotion: false, quality: 'low' });

for (let i = 0; i < SCENES.length; i++) {
  const scene = new SCENES[i]();
  try {
    scene.build(ctx(i));
    const timeRef = { t: 0 };
    const r = await scrub(scene, 40, timeRef, 0.03);
    note(`sky-garden:${CH_NAMES[i]}`, r.fwdBad === 0 && r.revBad === 0 && r.deterministic,
      `fwd non-finite=${r.fwdBad}, rev non-finite=${r.revBad}, reverse-deterministic=${r.deterministic}`);
    scene.dispose?.();
  } catch (e) {
    note(`sky-garden:${CH_NAMES[i]}`, false, `threw: ${e.message.split('\n')[0]}`);
  }
}

report.forEach((r) => console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.scene}  —  ${r.detail}`));
if (failures.length) { console.error(`\n${failures.length} failure(s)`); process.exit(1); }
console.log(`\nsky-garden scene-logic: clean (${report.length} scenes scrubbed forward + reverse, determinism verified)`);
