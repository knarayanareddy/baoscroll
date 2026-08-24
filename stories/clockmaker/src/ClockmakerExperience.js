import * as THREE from 'three';
import { ClockworkKit } from './ClockworkKit.js';
import { RememberedHourScene } from './RememberedHourScene.js';

class ClockmakerCamera {
  constructor() {
    this.instance = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, .1, 100);
    this.target = new THREE.Vector3();
  }
  setView(position, look, roll = 0, fov = 44) {
    this.instance.position.copy(position);
    this.target.copy(look);
    this.instance.lookAt(this.target);
    this.instance.rotateZ(roll);
    this.instance.fov = fov;
    this.instance.updateProjectionMatrix();
  }
  resize() { this.instance.aspect = window.innerWidth / window.innerHeight; this.instance.updateProjectionMatrix(); }
}

export class ClockmakerExperience {
  constructor(canvas, SceneClass = RememberedHourScene) {
    this.canvas = canvas;
    this.world = new THREE.Group();
    this.scene = new THREE.Scene(); this.scene.add(this.world);
    this.camera = new ClockmakerCamera();
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    const params = new URLSearchParams(window.location.search);
    this.dprCap = params.get('dpr') === '1' ? 1 : 2;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.dprCap));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.reducedMotion = params.get('reduced') === '1' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.lights = {
      hemi: new THREE.HemisphereLight('#e8d4ae','#18263c',.65),
      key: new THREE.DirectionalLight('#ffd47b',.55),
      rim: new THREE.DirectionalLight('#7ea4c9',.5),
      accent: new THREE.PointLight('#ffd47b',0,16,2)
    };
    this.lights.key.position.set(3,6,4);this.lights.rim.position.set(-4,3,-5);this.scene.add(...Object.values(this.lights));
    this.kit = new ClockworkKit();
    this.activeStoryScene = new SceneClass(this, this.kit); this.activeStoryScene.ensure(); this.activeStoryScene.setVisible(true);
    // Backward-compatible debug handle for the Phase 3 harness.
    this.rememberedHour = this.activeStoryScene;
    this.elapsed = 0;
    window.addEventListener('resize',()=>this.resize());
  }
  setSky(color, fog) { this.renderer.setClearColor(color); this.scene.fog = fog; }
  setLights({hemi,key,rim,accent}) { if(hemi!==undefined)this.lights.hemi.intensity=hemi;if(key!==undefined)this.lights.key.intensity=key;if(rim!==undefined)this.lights.rim.intensity=rim;if(accent){this.lights.accent.position.set(...accent.pos);this.lights.accent.intensity=accent.intensity;this.lights.accent.color.set(accent.color);} }
  tick(progress, delta) { this.elapsed += delta; this.activeStoryScene.update(progress,this.elapsed,delta); this.renderer.render(this.scene,this.camera.instance); }
  resize() { this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,this.dprCap));this.renderer.setSize(window.innerWidth,window.innerHeight);this.camera.resize(); }
}
