import * as THREE from 'three';
import { ClockworkPaperKit } from './ClockworkPaperKit.js';
import { ProductionBaseScene } from './ProductionBaseScene.js';
import { ProductionRememberedHourScene } from './ProductionRememberedHourScene.js';
import { ProductionGearTowerScene } from './ProductionGearTowerScene.js';
import { ProductionFinalHourScene } from './ProductionFinalHourScene.js';
import { ProductionWorkshopWakesScene } from './ProductionWorkshopWakesScene.js';
import { ProductionCityDisagreesScene } from './ProductionCityDisagreesScene.js';
import { ProductionNewClockTicksScene } from './ProductionNewClockTicksScene.js';
import { ClockmakerMaterialEffects } from './ClockmakerMaterialEffects.js';

class CameraRig { constructor(){this.instance=new THREE.PerspectiveCamera(44,innerWidth/innerHeight,.1,100);this.target=new THREE.Vector3();} set(pos,look,fov){this.instance.position.copy(pos);this.target.copy(look);this.instance.lookAt(this.target);this.instance.fov=fov;this.instance.updateProjectionMatrix();} resize(){this.instance.aspect=innerWidth/innerHeight;this.instance.updateProjectionMatrix();} }
class HoldingScene extends ProductionBaseScene { build(){const card=this.kit.blueprint({width:6,height:4});card.position.set(0,3,-4);this.group.add(card);} update(){this.experience.camera.set(new THREE.Vector3(0,3,10),new THREE.Vector3(0,2,-4),44);} }
export class ClockmakerStoryExperience {
  constructor(canvas){this.canvas=canvas;const forced=new URLSearchParams(window.location.search).get('quality');this.quality=['low','medium','high'].includes(forced)?forced:(window.innerWidth<820?'low':'high');this.scene=new THREE.Scene();this.world=new THREE.Group();this.scene.add(this.world);this.renderer=new THREE.WebGLRenderer({canvas,antialias:true});this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));this.renderer.setSize(innerWidth,innerHeight);this.camera=new CameraRig();this._pos=new THREE.Vector3();this._look=new THREE.Vector3();this.kit=new ClockworkPaperKit();this.effects=new ClockmakerMaterialEffects(this.kit,this.quality);this.lights={hemi:new THREE.HemisphereLight('#ead8ac','#1b2a42',.5),key:new THREE.DirectionalLight('#ffd47b',.55),rim:new THREE.DirectionalLight('#7ca1c7',.5),accent:new THREE.PointLight('#ffd47b',0,18,2)};this.lights.key.position.set(4,6,4);this.lights.rim.position.set(-4,3,-5);this.scene.add(...Object.values(this.lights));this.scenes=[new ProductionWorkshopWakesScene(this,0),new ProductionCityDisagreesScene(this,1),new ProductionGearTowerScene(this,2),new ProductionRememberedHourScene(this,3),new ProductionFinalHourScene(this,4),new ProductionNewClockTicksScene(this,5)];this.scenes.forEach(s=>s.ensure());this.elapsed=0;window.addEventListener('resize',()=>this.resize());}
  tick(progress,dt){this.elapsed+=dt;const i=Math.min(5,Math.floor(progress*6));const local=Math.max(0,Math.min(1,progress*6-i));this.scenes.forEach((s,index)=>s.setVisible(index===i));this.scenes[i].update(local,this.elapsed,dt);this.renderer.render(this.scene,this.camera.instance);this.activeChapter=i;this.local=local;}
  resize(){this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));this.renderer.setSize(innerWidth,innerHeight);this.camera.resize();}
}
