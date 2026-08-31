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
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120); // telephoto: the story fills the frame
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
    this._velocity = (this._velocity || 0) * Math.max(0, 1 - dt * 3);
    // smoke hook: per-frame counters
    this._drawCalls = this.renderer.info.render.calls;
    this._triangles = this.renderer.info.render.triangles;
  }

  /* ---------- transitions (Phase 6 transition language) ---------- */
  _initTransitions() {
    // rising CLOUD BANK: fully opaque paper-cream cover with a soft,
    // lobbied cloud edge along the bottom — the sky garden's own medium,
    // not a jagged white slab (and it fully covers the screen at peak)
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#f0e9da';
    x.fillRect(0, 0, 512, 256);
    // paper grain
    for (let i = 0; i < 700; i++) {
      x.fillStyle = `rgba(150, 135, 110, ${0.02 + (i % 5) * 0.008})`;
      x.fillRect((i * 61) % 512, (i * 97) % 256, 1 + (i % 2), 1);
    }
    // soft cloud lobes along the TOP edge — the leading edge both when the
    // bank rises over the old chapter and falls to reveal the new one
    for (let i = 0; i <= 24; i++) {
      const cx = i * 22;
      const cy = (i * 13) % 10;
      const r = 30 + ((i * 37) % 18);
      const g = x.createRadialGradient(cx, cy, r * 0.25, cx, cy, r);
      g.addColorStop(0, 'rgba(240, 233, 218, 1)');
      g.addColorStop(0.7, 'rgba(240, 233, 218, 1)');
      g.addColorStop(1, 'rgba(240, 233, 218, 0)');
      x.fillStyle = g;
      x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
    }
    const paperTex = new THREE.CanvasTexture(c);
    paperTex.colorSpace = THREE.SRGBColorSpace;
    // SCREEN-SPACE OVERLAY: the wipe + motifs are children of the camera
    // (no depth test, high render order) so they composite over the story
    // in the SAME render pass. A second render pass would clear the canvas
    // to black first — which is how the old transition showed a black
    // screen with cream hill silhouettes.
    this._transGroup = new THREE.Group();
    this._transGroup.visible = false;
    const overlayMat = (opts) => new THREE.MeshBasicMaterial(Object.assign({ transparent: true, depthTest: false }, opts));
    this._wipe = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      overlayMat({ map: paperTex, side: THREE.DoubleSide })
    );
    this._wipe.position.set(0, -1.8, -2.0); // below the screen at rest
    this._wipe.renderOrder = 998;
    this._transGroup.add(this._wipe);
    // motifs play at screen centre (camera space at z -1.9: half-height of
    // the frame is 1.9*tan(21deg) = 0.73 units, so scale 0.73 keeps the
    // intended 30-50% of frame sizes)
    this._motifGroup = new THREE.Group();
    this._motifGroup.position.set(0, 0, -1.9);
    this._motifGroup.scale.setScalar(0.73);
    this._transGroup.add(this._motifGroup);
    // ---- per-boundary morph elements (Phase 6 transition language).
    // Each is a pure function of the cover value, so scrubbing backwards
    // replays the morph in reverse.
    const accentMat = (color) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthTest: false });
    const toMotif = (m) => { m.renderOrder = 999; this._motifGroup.add(m); };
    // I->II root line: a single line that draws itself across the page
    this._morphRoot = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.035), accentMat('#7fae6e'));
    this._morphRoot.scale.x = 0.001;
    toMotif(this._morphRoot);
    // II->III vine braid -> wind ribbon: two interlaced strands that
    // straighten into one flowing ribbon
    this._braidA = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.035), accentMat('#8fae7a'));
    this._braidB = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.035), accentMat('#8fb3c9'));
    for (const m of [this._braidA, this._braidB]) { m.scale.x = 0.001; toMotif(m); }
    // III->IV kite cloth -> thunder leaf: a diamond that rounds into a leaf
    this._kite = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), accentMat({ color: '#f4d9a8', side: THREE.DoubleSide }));
    this._kite.rotation.z = Math.PI / 4;
    this._kite.scale.setScalar(0.001);
    toMotif(this._kite);
    // IV->V rain bead -> sun lens: a bead that thins into a lens ring
    // IV->V rain bead -> sun lens: pre-built ring variants, big and central
    this._beadGeos = [];
    for (let i = 0; i < 16; i++) {
      const r = i / 15;
      this._beadGeos.push(new THREE.RingGeometry(0.3 + r * 0.1, 0.55 - r * 0.15, 24));
    }
    this._bead = new THREE.Mesh(this._beadGeos[0], accentMat({ color: '#e0b45e', side: THREE.DoubleSide }));
    this._bead.scale.setScalar(0.001);
    toMotif(this._bead);
    // V->VI sun thread -> rain halo: a sunburst that opens into a halo ring
    this._halo = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 28), accentMat({ color: '#8fa8bf', side: THREE.DoubleSide }));
    this._halo.scale.setScalar(0.001);
    toMotif(this._halo);
    this._threads = [];
    for (let i = 0; i < 8; i++) {
      const th = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.028), accentMat({ color: '#ffdf8a' }));
      const holder = new THREE.Object3D();
      holder.rotation.z = (i / 8) * Math.PI * 2;
      th.position.x = 0.4;
      th.renderOrder = 999;
      holder.add(th);
      this._motifGroup.add(holder);
      this._threads.push({ th, holder });
    }
    this._activeMorph = null;
    // the camera must be in the scene for its children to render
    this.camera.add(this._transGroup);
    this.scene.add(this.camera);
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
      if (Math.abs(d) < 0.02) { bp = 1 - Math.abs(d) / 0.02; idx = i; break; } // a decisive crossing
    }
    // aspect-aware wipe width: the plane must cover the frame at any aspect
    this._wipe.scale.x = this.camera.aspect;
    if (idx >= 0 && bp > 0.001) {
      const def = TRANSITIONS[idx];
      const cover = Math.sin(bp * Math.PI); // 0 -> 1 -> 0 (reversible in scroll)
      this._bp = bp;
      // the bank rises from below the screen to FULL cover (plane at 0
      // covers the whole frame at any aspect) and back — the story is
      // visible again as it falls, no black, no held slabs
      this._wipe.position.y = -1.8 + cover * 1.8;
      // fade all morphs, then drive the active one (pure in cover)
      for (const name of ['root', 'braid', 'kite', 'bead', 'halo']) this._setMorphOpacity(name, 0);
      this._activeMorph = def.name;
      this._morphDrive(def.name, cover);
      this._setMorphOpacity(def.name, Math.min(1, cover * 1.6));
      this._transGroup.visible = true;
    } else {
      this._transGroup.visible = false;
      this._activeMorph = null;
      for (const name of ['root', 'braid', 'kite', 'bead', 'halo']) this._setMorphOpacity(name, 0);
    }
  }

  _morphDrive(name, cover) {
    // the motif plays at screen CENTRE, 30-50% of the frame, while the
    // cloud bank covers. Every value is a pure function of cover, so
    // scrubbing backwards replays the morph in reverse.
    if (name === 'root') {
      this._morphRoot.scale.x = Math.max(0.001, cover);          // draws itself
    } else if (name === 'braid') {
      // two interlaced strands straighten into one flowing ribbon
      const r = Math.min(1, cover * 1.3);
      const spread = (1 - r) * 0.05;
      const wave = (1 - r) * 0.05;
      this._braidA.scale.set(Math.max(0.001, cover), 1, 1);
      this._braidB.scale.set(Math.max(0.001, cover), 1, 1);
      this._braidA.position.y = spread + Math.sin(r * 6) * wave;
      this._braidB.position.y = -spread + Math.sin(r * 6 + Math.PI) * wave;
      this._braidA.rotation.z = (1 - r) * 0.1;
      this._braidB.rotation.z = -(1 - r) * 0.1;
    } else if (name === 'kite') {
      // diamond (kite cloth) rounds into a leaf: squash X, grow Y, settle
      const r = Math.min(1, cover * 1.4);
      this._kite.scale.set(0.001 + (1 - r * 0.45) * r * 1.6, 0.001 + r * 1.5, 1);
      this._kite.rotation.z = Math.PI / 4 - r * 0.6;
    } else if (name === 'bead') {
      // bead thins into a lens ring (pre-built variants, no allocation)
      const r = Math.min(1, cover * 1.3);
      this._bead.geometry = this._beadGeos[Math.min(15, Math.round(r * 15))];
      this._bead.scale.setScalar(Math.max(0.001, 0.55 + r * 0.5));
    } else if (name === 'halo') {
      // sunburst threads open outward and join into a halo ring
      const r = Math.min(1, cover * 1.3);
      for (const { th } of this._threads) {
        th.scale.x = 0.55 + r * 0.8;
        th.position.x = 0.35 + r * 0.5;
      }
      this._halo.scale.setScalar(Math.max(0.001, r * 1.15));
      this._halo.material.opacity = r * 0.9;
      this._threads.forEach(({ th }) => { th.material.opacity = (1 - r * 0.7) * 0.85; });
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
