// ShellExperience — the Phase 4 unified shell: one fixed WebGL canvas,
// six native scroll sections, one story router, shared camera, named
// transitions, narration/audio interfaces, smoke hooks, quality tiers.
//
// Scene contract (src/scenes/BaseScene.js):
//   build(exp)                 once per mount
//   update(local, dt, ctx)     every frame; MUST be pure in (local, time)
//   camera(local, ctx, cam)    shared camera rig (position + lookAt)
//   dispose()                  on unmount
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { TIERS, qualityTier, prefersReducedMotion } from '../utils/device.js';
import { CHAPTERS, TRANSITIONS } from '../utils/constants.js';
import { SkyGardenKit } from '../kit/SkyGardenKit.js';

gsap.registerPlugin(ScrollTrigger);

export class ShellExperience {
  constructor({ canvas, sections }) {
    this.canvas = canvas;
    this.sections = sections;
    this.quality = qualityTier();
    this.tier = TIERS[this.quality];
    this.reducedMotion = prefersReducedMotion();
    this.paused = false;
    this.activeChapter = -1;
    this.local = 0;
    this.onChapterChange = null;
    this.scenes = new Map(); // chapter -> { node, built }
    this.sceneList = [];
    this.storyTime = 0;
    this._wind = 0;
  }

  async init(onProgress) {
    const renderer = (this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: this.quality !== 'low', powerPreference: 'high-performance' }));
    renderer.setPixelRatio(this.tier.dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(new THREE.Color('#dfe8ee'), 8, 42);
    this.camera = new THREE.PerspectiveCamera(56, 1, 0.1, 120); // wider FOV: chapters must read, not peek
    this._resize();
    window.addEventListener('resize', () => this._resize());

    this.hemi = new THREE.HemisphereLight('#eaf4ff', '#c9bda6', 0.9);
    this.scene.add(this.hemi);
    this.sunLight = new THREE.DirectionalLight('#fff2d8', 1.1);
    this.sunLight.position.set(4, 8, 3);
    this.scene.add(this.sunLight);

    // shared kit + systems (Phase 2 foundation) are created lazily per
    // scene mount through the context passed to build()
    this.kit = null;

    // ---- scroll: Lenis + ScrollTrigger map -> (chapter, local) ----
    this.lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    const total = document.documentElement.scrollHeight - window.innerHeight;
    this.lenis.on('scroll', () => this._syncFromScroll(total));
    this._syncFromScroll(total);

    // velocity: transient wind feedback only (reversibility rule)
    this._lastY = 0; this._lastT = performance.now();
    window.addEventListener('scroll', () => {
      const t = performance.now();
      const v = (window.scrollY - this._lastY) / Math.max(1, t - this._lastT);
      this._velocity = Math.max(-1.5, Math.min(1.5, v * 2));
      this._lastY = window.scrollY; this._lastT = t;
    }, { passive: true });

    // ---- transitions: separate ortho overlay ----
    this._initTransitions();

    this._clock = new THREE.Clock();
    this._raf = 0;
    const tick = () => {
      this._raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, this._clock.getDelta());
      this.storyTime += dt;
      this.lenis.raf(this.storyTime * 1000);
      if (!this.paused) this._tick(dt);
    };
    tick();
    onProgress?.(1);
  }

  _syncFromScroll(total) {
    if (total <= 0) return;
    const g = Math.min(1, Math.max(0, window.scrollY / total));
    const n = CHAPTERS.length;
    const chapter = Math.min(n - 1, Math.floor(g * n));
    const local = Math.min(1, Math.max(0, g * n - chapter));
    this.global = g;
    if (chapter !== this.activeChapter) {
      this._setChapter(chapter);
    }
    this.local = local;
  }

  _setChapter(i) {
    this.activeChapter = i;
    // unmount previous scene
    if (this._prevBuilt !== undefined && this._prevBuilt !== i) {
      const prev = this.scenes.get(this._prevBuilt);
      if (prev) {
        this.scene.remove(prev.node);
        prev.built.dispose?.();
        this.scenes.delete(this._prevBuilt);
      }
    }
    // sceneList holds the scene CLASSES directly
    const SceneCls = this.sceneList[i];
    if (!SceneCls) return;
    // kit + shared systems (Phase 2 foundation) mount with the first scene
    if (!this.kit) this.kit = new SkyGardenKit(this.quality);
    const built = new SceneCls(this);
    built.build(this._ctx(i));
    const node = built.node;
    this.scene.add(node);
    this.scenes.set(i, { node, built });
    this._prevBuilt = i;
    this.audio?.setChapter(i);
    this.onChapterChange?.(i);
  }

  _ctx(i) {
    return {
      kit: this.kit,
      chapter: i,
      tier: this.tier,
      reducedMotion: this.reducedMotion,
      quality: this.quality
    };
  }

  _tick(dt) {
    const cur = this.scenes.get(this._prevBuilt);
    if (cur?.built?.update) {
      const vel = this.reducedMotion ? 0 : (this._velocity || 0);
      cur.built.update(this.local, dt, { time: this.storyTime, velocity: vel, wind: 0.3 + 0.3 * Math.sin(this.local * 6.28) });
    }
    // call as a METHOD so `this` is the scene — scene cameras read scene
    // state (e.g. FirstSeed's vineCurve); an unbound call would lose it
    if (cur?.built?.camera) cur.built.camera(this.local, { time: this.storyTime, reduced: this.reducedMotion }, this.camera);
    // global camera fallback when scene has no camera (placeholders)
    if (!cur?.built?.camera && this.camera.position.lengthSq() === 0) {
      this.camera.position.set(0, 1.2, 6);
      this.camera.lookAt(0, 0.8, 0);
    }
    this._transitionTick();
    this.renderer.render(this.scene, this.camera);
    this.renderTransitionPass(this.renderer);
    this._velocity = (this._velocity || 0) * Math.max(0, 1 - dt * 3);
    // smoke hook: per-frame counters
    this._drawCalls = this.renderer.info.render.calls;
    this._triangles = this.renderer.info.render.triangles;
  }

  /* ---------- transitions (Phase 6 transition language) ---------- */
  _initTransitions() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const x = c.getContext('2d');
    // torn-paper horizontal edge
    x.fillStyle = '#f4efe2';
    x.beginPath();
    x.moveTo(0, 0); x.lineTo(512, 0); x.lineTo(512, 140);
    for (let i = 512; i >= 0; i -= 16) x.lineTo(i, 140 + Math.sin(i * 0.11) * 14 + ((i * 7919) % 13));
    x.closePath(); x.fill();
    const paperTex = new THREE.CanvasTexture(c);
    paperTex.colorSpace = THREE.SRGBColorSpace;
    this._transScene = new THREE.Scene();
    this._transCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
    this._wipe = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({ map: paperTex, transparent: true, side: THREE.DoubleSide })
    );
    this._wipe.position.y = -1.2;
    this._transScene.add(this._wipe);
    // ---- per-boundary morph elements (Phase 6 transition language).
    // Each is a pure function of the cover value, so scrubbing backwards
    // replays the morph in reverse.
    const accentMat = (color) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
    // I->II root line: a single line that draws itself across the paper
    this._morphRoot = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.025), accentMat('#7fae6e'));
    this._morphRoot.position.y = -1.2;
    this._morphRoot.scale.x = 0.001;
    this._transScene.add(this._morphRoot);
    // II->III vine braid -> wind ribbon: two interlaced strands that
    // straighten into one flowing ribbon
    this._braidA = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.022), accentMat('#8fae7a'));
    this._braidB = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.022), accentMat('#8fb3c9'));
    for (const m of [this._braidA, this._braidB]) { m.position.y = -1.2; m.scale.x = 0.001; this._transScene.add(m); }
    // III->IV kite cloth -> thunder leaf: a diamond that rounds into a leaf
    this._kite = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ color: '#f4d9a8', transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
    this._kite.rotation.z = Math.PI / 4;
    this._kite.position.y = -1.2;
    this._kite.scale.setScalar(0.001);
    this._transScene.add(this._kite);
    // IV->V rain bead -> sun lens: a bead that thins into a lens ring
    // bead -> lens ring: pre-built geometry variants (no per-frame
    // allocation — plan QA criterion)
    this._beadGeos = [];
    for (let i = 0; i < 16; i++) {
      const r = i / 15;
      this._beadGeos.push(new THREE.RingGeometry(0.16 + r * 0.06, 0.3 - r * 0.09, 20));
    }
    this._bead = new THREE.Mesh(this._beadGeos[0], new THREE.MeshBasicMaterial({ color: '#e0b45e', transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
    this._bead.position.y = -1.2;
    this._bead.scale.setScalar(0.001);
    this._transScene.add(this._bead);
    // V->VI sun thread -> rain halo: a sunburst that opens into a halo ring
    this._halo = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.24, 24), new THREE.MeshBasicMaterial({ color: '#8fa8bf', transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
    this._halo.position.y = -1.2;
    this._halo.scale.setScalar(0.001);
    this._transScene.add(this._halo);
    this._threads = [];
    for (let i = 0; i < 8; i++) {
      const th = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.018), new THREE.MeshBasicMaterial({ color: '#ffdf8a', transparent: true, opacity: 0.85 }));
      const holder = new THREE.Object3D();
      holder.rotation.z = (i / 8) * Math.PI * 2;
      th.position.x = 0.3;
      holder.add(th);
      holder.position.y = -1.2;
      this._transScene.add(holder);
      this._threads.push({ th, holder });
    }
    // keep morph elements hidden until their boundary is active
    this._activeMorph = null;
  }

  _setMorphOpacity(name, o) {
    const map = {
      root: [this._morphRoot],
      braid: [this._braidA, this._braidB],
      kite: [this._kite],
      bead: [this._bead],
      halo: [this._halo, ...this._threads.map((t) => t.th)]
    };
    (map[name] || []).forEach((m) => { m.material.opacity = o * (m.userData?.baseOpacity ?? 0.9); });
  }

  // boundary progress: each transition owns the outer 6% of the boundary
  _transitionTick() {
    const g = this.global || 0;
    const n = CHAPTERS.length;
    let bp = 0, idx = -1;
    for (let i = 0; i < n - 1; i++) {
      const boundary = (i + 1) / n;
      const d = g - boundary;
      if (Math.abs(d) < 0.045) { bp = 1 - Math.abs(d) / 0.045; idx = i; break; } // ~1 viewport of scroll for the full wipe at 400vh sections
    }
    const wipeY = () => -1.2 + Math.sin((this._bp || 0) * Math.PI) * 1.15;
    if (idx >= 0 && bp > 0.001) {
      const def = TRANSITIONS[idx];
      const cover = Math.sin(bp * Math.PI); // 0 -> 1 -> 0 (reversible in scroll)
      this._bp = bp;
      this._wipe.material.opacity = cover;
      this._wipe.position.y = wipeY();
      // fade all morphs, then drive the active one (pure in cover)
      for (const name of ['root', 'braid', 'kite', 'bead', 'halo']) this._setMorphOpacity(name, 0);
      this._activeMorph = def.name;
      this._morphDrive(def.name, cover, wipeY());
      this._setMorphOpacity(def.name, Math.min(1, cover * 1.6));
      this._transVisible = true;
    } else {
      this._transVisible = false;
      this._activeMorph = null;
      this._wipe.material.opacity = 0;
      for (const name of ['root', 'braid', 'kite', 'bead', 'halo']) this._setMorphOpacity(name, 0);
    }
  }

  _morphDrive(name, cover, y) {
    // cover: 0 -> 1 -> 0 as the boundary is crossed; every value below is
    // a pure function of cover (scrubbing backwards replays the morph)
    if (name === 'root') {
      this._morphRoot.scale.x = Math.max(0.001, cover);          // draws itself
      this._morphRoot.position.y = y;
    } else if (name === 'braid') {
      // two interlaced strands straighten into a single ribbon line
      const spread = (1 - cover) * 0.05;
      const wave = (1 - cover) * 0.03;
      this._braidA.scale.x = this._braidB.scale.x = Math.max(0.001, cover);
      this._braidA.position.y = y + spread + Math.sin(cover * 6) * wave;
      this._braidB.position.y = y - spread + Math.sin(cover * 6 + Math.PI) * wave;
      this._braidA.rotation.z = (1 - cover) * 0.12;
      this._braidB.rotation.z = -(1 - cover) * 0.12;
    } else if (name === 'kite') {
      // diamond (kite cloth) rounds into a leaf: squash X, grow Y, settle
      const r = Math.min(1, cover * 1.5);
      this._kite.scale.set(0.001 + (1 - r * 0.4) * r * 1.4, 0.001 + r * 1.7, 1);
      this._kite.rotation.z = Math.PI / 4 - r * 0.5;
      this._kite.position.y = y;
    } else if (name === 'bead') {
      // bead (filled) thins into a lens ring: inner radius closes in
      // (geometry variants pre-built — pure in cover, no allocation)
      const r = Math.min(1, cover * 1.4);
      this._bead.geometry = this._beadGeos[Math.min(15, Math.round(r * 15))];
      this._bead.scale.setScalar(Math.max(0.001, 0.3 + r * 1.1));
      this._bead.position.y = y;
    } else if (name === 'halo') {
      // sunburst threads open outward and join into a halo ring
      const r = Math.min(1, cover * 1.3);
      for (const { th, holder } of this._threads) {
        holder.rotation.z += 0; // keep base angles
        th.scale.x = 0.3 + r * 0.9;
        th.position.x = 0.18 + r * 0.34;
      }
      this._halo.scale.setScalar(Math.max(0.001, r * 0.9));
      this._halo.material.opacity = r * 0.9;
      this._threads.forEach(({ th }) => { th.material.opacity = (1 - r * 0.7) * 0.85; });
    }
  }

  renderTransitionPass(renderer) {
    if (this._transVisible && this._wipe.material.opacity > 0.01) {
      renderer.render(this._transScene, this._transCam);
    }
  }

  /* ---------- public API (shellMain + smoke hooks) ---------- */
  registerScenes(list) { this.sceneList = list; }
  scrollToChapter(i) {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    this.lenis.scrollTo(total * (i + 0.001) / CHAPTERS.length);
  }
  setPaused(p) { this.paused = p; }
  setReducedMotion(on) { this.reducedMotion = on; }
  _resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
  dispose() {
    cancelAnimationFrame(this._raf);
    this.lenis?.destroy();
    this.scenes.forEach((s) => s.built.dispose?.());
    this.scenes.clear();
    this.kit?.dispose();
    this._beadGeos?.forEach((g) => g.dispose());
    this.renderer.dispose();
  }
}
