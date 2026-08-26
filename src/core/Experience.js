import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { AssetLoader } from './AssetLoader.js';
import { Renderer } from './Renderer.js';
import { Camera } from './Camera.js';
import { ScrollController } from './ScrollController.js';
import { AudioController } from './AudioController.js';
import { NarrationController } from './NarrationController.js';

import { InkSpreadEffect } from '../effects/InkSpreadEffect.js';
import { WatercolorEffect } from '../effects/WatercolorEffect.js';
import { PaperParticleSystem } from '../effects/PaperParticleSystem.js';
import { TransitionManager } from '../effects/TransitionManager.js';

import { HarborDuskScene } from '../scenes/HarborDuskScene.js';
import { StormWallScene } from '../scenes/StormWallScene.js';
import { FirstNameScene } from '../scenes/FirstNameScene.js';
import { BeaconScene } from '../scenes/BeaconScene.js';
import { WreckMemoriesScene } from '../scenes/WreckMemoriesScene.js';
import { BirdsDawnScene } from '../scenes/BirdsDawnScene.js';

import { createPaperKit } from '../utils/paperKit.js';
import { chapterRanges } from '../utils/constants.js';
import { clamp } from '../utils/math.js';
import { qualityTier, isTouch, prefersReducedMotion } from '../utils/device.js';

// The conductor. One fixed canvas, one scroll-scrubbed timeline:
// every frame we map global scroll progress to (chapter, local
// progress), update only that chapter's scene, then composite the
// ink/watercolor overlay passes on top.
export class Experience {
  constructor({ canvas, sections }) {
    this.canvas = canvas;
    this.sections = sections;
    this.quality = qualityTier();
    this.isTouch = isTouch;
    this.reducedMotion = prefersReducedMotion;
    this.paused = false;
    this.exploreMode = false;
    this.storyTime = 0;
    this.activeChapter = -1;
    this.ranges = chapterRanges();
    this.pointer = new THREE.Vector2(0, 0);
    this.pointerWorld = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();
    this.cursorHot = false;
    this.onChapterChange = null;
    this._idlePreloads = new Set();
    this._rayDir = new THREE.Vector3();
    this._skyColor = new THREE.Color();
  }

  async init(onProgress) {
    this.assets = new AssetLoader();
    await this.assets.generate(onProgress);
    this.kit = createPaperKit(this.assets);

    this.scene = new THREE.Scene();
    this.world = new THREE.Group();
    this.scene.add(this.world);

    this.rendererWrap = new Renderer(this.canvas, this.quality);
    this.renderer = this.rendererWrap.instance;
    this.camera = new Camera(this);

    this.lights = {
      hemi: new THREE.HemisphereLight('#fff2dc', '#6b6257', 0.9),
      key: new THREE.DirectionalLight('#ffe6c4', 1.1),
      rim: new THREE.DirectionalLight('#8fb7d1', 0.4),
      accent: new THREE.PointLight('#ffb45e', 0, 22)
    };
    this.lights.key.position.set(4, 7, 6);
    this.lights.rim.position.set(-5, 5, -7);
    this.scene.add(this.lights.hemi, this.lights.key, this.lights.rim, this.lights.accent);

    // Gentle bloom over the whole frame — turns lanterns, the glowing
    // scroll fragments, the gold temple backlight, the koi and the
    // sunrise luminous, and gives the paper a soft dreamlike haze that
    // suits the handmade/magical direction. Off on the low tier.
    this.usePost = this.quality !== 'low';
    if (this.usePost) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera.instance));
      this.bloom = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        this.quality === 'high' ? 0.55 : 0.45, // strength
        0.6, // radius
        0.9 // threshold — only near-white glows bloom; bright paper stays crisp
      );
      this.composer.addPass(this.bloom);
    }

    this.scroll = new ScrollController(this.sections);
    if (this.reducedMotion) this.scroll.setGentle(true);
    this.audio = new AudioController();
    this.narration = new NarrationController(this.audio);
    this.ink = new InkSpreadEffect();
    this.wash = new WatercolorEffect();
    this.transition = new TransitionManager(this);
    this.particles = new PaperParticleSystem(this);
    this.world.add(this.particles.mesh);

    this.scenes = [
      new HarborDuskScene(this),
      new FirstNameScene(this),
      new StormWallScene(this),
      new WreckMemoriesScene(this),
      new BeaconScene(this),
      new BirdsDawnScene(this)
    ];
    this.scenes[0].ensure();

    window.addEventListener('pointermove', (e) => {
      this.pointer.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
    });
    window.addEventListener('resize', () => this.resize());

    gsap.ticker.add((time, deltaMs) => this.tick(time, deltaMs / 1000));
    document.body.classList.toggle('reduced-motion', this.reducedMotion);
  }

  chapterAt(g) {
    for (let i = 0; i < this.ranges.length; i++) {
      const r = this.ranges[i];
      if (g <= r.end || i === this.ranges.length - 1) {
        return { index: i, local: clamp((g - r.start) / (r.end - r.start), 0, 1) };
      }
    }
    return { index: 0, local: 0 };
  }

  setSky(color, fog) {
    this._skyColor.set(color);
    this.renderer.setClearColor(this._skyColor);
    if (fog) this.scene.fog = fog;
  }

  setLights({ hemi, key, rim, accent }) {
    if (hemi !== undefined) this.lights.hemi.intensity = hemi;
    if (key !== undefined) this.lights.key.intensity = key;
    if (rim !== undefined) this.lights.rim.intensity = rim;
    if (accent) {
      this.lights.accent.position.set(accent.pos[0], accent.pos[1], accent.pos[2]);
      this.lights.accent.intensity = accent.intensity;
      if (accent.color) this.lights.accent.color.set(accent.color);
    } else {
      this.lights.accent.intensity = 0;
    }
  }

  tick(elapsed, delta) {
    delta = Math.min(delta, 0.05);
    const effDt = this.paused ? 0 : delta;
    this.storyTime += effDt;

    const g = this.scroll.progress;
    const { index, local } = this.chapterAt(g);

    if (index !== this.activeChapter) {
      this.activeChapter = index;
      this.audio.setChapter(index);
      this.particles.setMode(index);
      if (this.onChapterChange) this.onChapterChange(index);
    }
    this.chapterLocal = local;
    this.narration.update(index, local);

    // Lazy-build the active chapter, then use idle time to amortize the next
    // chapter's construction before its transition can enter the viewport.
    this.scenes[index].ensure();
    if (index < 5 && local > 0.38 && !this._idlePreloads.has(index + 1)) {
      this._idlePreloads.add(index + 1);
      const preload = () => this.scenes[index + 1].ensure();
      if ('requestIdleCallback' in window) window.requestIdleCallback(preload, { timeout: 1200 });
      else setTimeout(preload, 0);
    }
    // Fast scrolls bypass idle time; retain this synchronous safety net.
    if (index < 5 && local > 0.7) this.scenes[index + 1].ensure();

    this.scenes.forEach((s, i) => s.setVisible(i === index));

    if (this.exploreMode) {
      this.scenes[5].setVisible(true);
      this.scenes[5].update(1, this.storyTime, effDt);
      this.controls.update();
    } else {
      this.scenes[index].update(local, this.storyTime, effDt);
    }

    // pointer projected ~6 units into the scene for particle repulsion
    this.raycaster.setFromCamera(this.pointer, this.camera.instance);
    this.pointerWorld
      .copy(this.raycaster.ray.direction)
      .multiplyScalar(6)
      .add(this.raycaster.ray.origin);

    this.transition.update(g, this.storyTime);
    this.particles.update(effDt, this.pointerWorld);
    this.camera.update(delta);

    if (this.usePost) this.composer.render();
    else this.renderer.render(this.scene, this.camera.instance);
    // overlay passes composite on top of the bloomed frame
    this.ink.render(this.renderer);
    this.wash.render(this.renderer, this.storyTime);
  }

  setPaused(v) {
    this.paused = v;
    this.audio.setPaused(v);
    this.narration.setPaused(v);
  }

  setReducedMotion(v) {
    this.reducedMotion = v;
    this.scroll.setGentle(v);
    document.body.classList.toggle('reduced-motion', v);
  }

  enterExplore() {
    if (!this.controls) {
      this.controls = new OrbitControls(this.camera.instance, this.canvas);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.minDistance = 4;
      this.controls.maxDistance = 26;
      this.controls.maxPolarAngle = Math.PI * 0.52;
      this.controls.target.set(0, 2, -3);
    }
    this.controls.enabled = true;
    this.exploreMode = true;
    this.scroll.stop();
  }

  exitExplore() {
    if (this.controls) this.controls.enabled = false;
    this.exploreMode = false;
    this.scroll.start();
  }

  replay() {
    this.exitExplore();
    this.scroll.toTop();
  }

  resize() {
    this.rendererWrap.resize();
    this.camera.resize();
    this.ink.resize();
    if (this.composer) this.composer.setSize(window.innerWidth, window.innerHeight);
    ScrollTrigger.refresh();
  }
}
