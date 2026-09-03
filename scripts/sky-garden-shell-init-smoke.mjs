// Shell-init smoke (no browser): runs the REAL ShellExperience.init() +
// frame loop + chapter routing + transition pass in plain Node, with only
// the WebGL renderer stubbed (module-load hook). Catches boot-time throws
// and router wiring bugs the scene-logic smoke cannot see (it builds
// scenes directly and never drives the shell).
//
//   node scripts/sky-garden-shell-init-smoke.mjs
import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

// locate the three module in the (possibly symlinked) node_modules
const threePath = '/home/user/baoscroll/node_modules/three/build/three.module.js';
if (!existsSync(threePath)) {
  console.error(`three.module.js not found at ${threePath} — adjust the path for this workspace`);
  process.exit(2);
}
const threeSrc = readFileSync(threePath, 'utf8')
  .replace('class WebGLRenderer', 'class WebGLRendererOrig')
  .replace('WebGLRenderer, WebGLUtils', 'WebGLRendererOrig, WebGLUtils') + `
class WebGLRenderer {
  constructor() { this.info = { render: { calls: 0, triangles: 0 } }; this.renderCalls = 0; }
  render() { this.renderCalls++; this.info.render.calls++; }
  setSize() {}
  setPixelRatio() {}
  dispose() {}
}
export { WebGLRenderer };
`;
registerHooks({
  load(url, context, next) {
    if (url.replace('file://', '').startsWith(threePath)) {
      return { format: 'module', source: threeSrc, shortCircuit: true };
    }
    return next(url, context);
  }
});

/* ---- DOM/browser stubs ---- */
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
    get(t, p) { if (typeof p === 'symbol') return undefined; if (p in t) return t[p]; return () => {}; },
    set() { return true; }
  });
}
const styleStub = () => new Proxy({ display: '', setProperty() {}, removeProperty() {}, getPropertyValue: () => '' }, {
  get(t, k) { if (k in t) return t[k]; return ''; },
  set(t, k, v) { t[k] = v; return true; }
});
const el = () => ({
  style: styleStub(), hidden: false, textContent: '', innerHTML: '',
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  addEventListener() {}, removeEventListener() {}, setAttribute() {}, removeAttribute() {},
  appendChild() {}, removeChild() {}, querySelector: () => null,
  getBoundingClientRect: () => ({ top: 0, left: 0, width: 1280, height: 800 })
});
const _et = new EventTarget();
globalThis.addEventListener = (t, f, o) => _et.addEventListener(t, f, o);
globalThis.removeEventListener = (t, f, o) => _et.removeEventListener(t, f, o);
globalThis.dispatchEvent = (e) => _et.dispatchEvent(e);
globalThis.document = {
  createElement: (tag) => (tag === 'canvas' ? (() => { const c = { width: 0, height: 0, style: styleStub() }; c.getContext = () => make2DContext(); return c; })() : el()),
  getElementById: () => null,
  querySelector: () => el(),
  querySelectorAll: () => [],
  addEventListener() {}, removeEventListener() {}, hasAttribute: () => false, style: styleStub(),
  documentElement: Object.assign(el(), { scrollHeight: 5000, clientWidth: 1280, clientHeight: 800, tagName: 'HTML', ownerDocument: null, hasAttribute: () => false }),
  body: Object.assign(el(), { tagName: 'BODY', offsetWidth: 1280, offsetHeight: 800, hasAttribute: () => false })
};
globalThis.window = globalThis;
globalThis.location = { search: '?quality=low', pathname: '/' };
globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
globalThis.devicePixelRatio = 1;
globalThis.innerWidth = 1280;
globalThis.innerHeight = 800;
globalThis.scrollY = 0;
globalThis.history = { scrollRestoration: 'auto' };
globalThis.visualViewport = null;
globalThis.pageXOffset = 0;
globalThis.pageYOffset = 0;
globalThis.Window = class Window {};
globalThis.HTMLElement = class HTMLElement {};
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
const rafQueue = [];
globalThis.requestAnimationFrame = (cb) => { rafQueue.push(cb); return rafQueue.length; };
globalThis.cancelAnimationFrame = () => {};

/* ---- run the real shell ---- */
const BASE = 'file://' + new URL('..', import.meta.url).pathname;
const { ShellExperience } = await import(BASE + 'stories/sky-garden/src/core/ShellExperience.js');
const { PlaceholderScene } = await import(BASE + 'stories/sky-garden/src/scenes/PlaceholderScene.js');
const { FirstSeedScene } = await import(BASE + 'stories/sky-garden/src/scenes/FirstSeedScene.js');
const { WindMazeScene } = await import(BASE + 'stories/sky-garden/src/scenes/WindMazeScene.js');
const { ThunderOrchardScene } = await import(BASE + 'stories/sky-garden/src/scenes/ThunderOrchardScene.js');
const { SunTerraceScene } = await import(BASE + 'stories/sky-garden/src/scenes/SunTerraceScene.js');
const { DryCloudNurseryScene } = await import(BASE + 'stories/sky-garden/src/scenes/DryCloudNurseryScene.js');
const { RainReturnsScene } = await import(BASE + 'stories/sky-garden/src/scenes/RainReturnsScene.js');

const failures = [];
const pump = (n) => { for (let i = 0; i < n; i++) { const q = rafQueue.splice(0); q.forEach((cb) => cb(performance.now())); } };

const experience = new ShellExperience({ canvas: { style: {} }, sections: Array(6).fill(null).map(() => el()) });
experience.registerScenes([DryCloudNurseryScene, FirstSeedScene, WindMazeScene, ThunderOrchardScene, SunTerraceScene, RainReturnsScene]);
await experience.init(() => {});
pump(6);
console.log(`init + 6 frames OK; activeChapter=${experience.activeChapter}; render calls=${experience.renderer.renderCalls}`);
if (experience.activeChapter !== 0) failures.push(`expected chapter 0 at boot, got ${experience.activeChapter}`);

// route through every chapter (each mount exercises the router +
// transition pass at the boundaries)
const TOTAL = 4200; // scrollHeight 5000 - innerHeight 800
for (const want of [0, 1, 2, 3, 4, 5]) {
  const frac = (want + 0.5) / 6; // chapter centre
  globalThis.scrollY = TOTAL * frac;
  experience._syncFromScroll(TOTAL);
  pump(8);
  const got = experience.activeChapter;
  if (got !== want) failures.push(`chapter at g=${frac}: expected ${want}, got ${got}`);
  else console.log(`routed to chapter ${want} OK (g=${frac})`);
}
// reverse: back to zero — every scene must unmount cleanly
globalThis.scrollY = 0;
experience._syncFromScroll(TOTAL);
pump(8);
if (experience.activeChapter !== 0) failures.push(`reverse routing failed: ${experience.activeChapter}`);
else console.log('reverse routing to chapter 0 OK');

if (failures.length) {
  failures.forEach((f) => console.error('  - ' + f));
  console.error(`\nshell-init smoke: FAIL (${failures.length})`);
  process.exit(1);
}
console.log('\nshell-init smoke: clean (boot, all six chapter mounts, transitions, reverse unmount)');
process.exit(0);
