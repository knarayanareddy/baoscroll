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
    this.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 120);
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
    const camFn = cur?.built?.camera;
    if (camFn) camFn(this.local, { time: this.storyTime, reduced: this.reducedMotion }, this.camera);
    // global camera fallback when scene has no camera (placeholders)
    if (!camFn && this.camera.position.lengthSq() === 0) {
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
    // accent line (root/vine/kite/bead/thread per boundary)
    this._accent = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 0.03),
      new THREE.MeshBasicMaterial({ color: '#9fbf8f', transparent: true, opacity: 0.9 })
    );
    this._accent.position.y = -1.2;
    this._transScene.add(this._accent);
  }

  // boundary progress: each transition owns the outer 6% of the boundary
  _transitionTick() {
    const g = this.global || 0;
    const n = CHAPTERS.length;
    let bp = 0, idx = -1;
    for (let i = 0; i < n - 1; i++) {
      const boundary = (i + 1) / n;
      const d = g - boundary;
      if (Math.abs(d) < 0.05) { bp = 1 - Math.abs(d) / 0.05; idx = i; break; }
    }
    if (idx >= 0 && bp > 0.001) {
      const def = TRANSITIONS[idx];
      const cover = Math.sin(bp * Math.PI); // 0 -> 1 -> 0
      this._wipe.material.opacity = cover;
      this._wipe.position.y = -1.2 + cover * 1.15;
      this._accent.material.color.set(def.accent);
      this._accent.material.opacity = cover * 0.9;
      this._accent.position.y = this._wipe.position.y + 0.06;
      this._transVisible = true;
    } else {
      this._transVisible = false;
      this._wipe.material.opacity = 0;
      this._accent.material.opacity = 0;
    }
  }

  renderTransitionPass(renderer) {
    if (this._transVisible && (this._wipe.material.opacity > 0.01 || this._accent.material.opacity > 0.01)) {
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
    this.renderer.dispose();
  }
}
