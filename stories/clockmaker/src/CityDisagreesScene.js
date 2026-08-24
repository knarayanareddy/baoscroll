import * as THREE from 'three';
import { ClockmakerSceneBase } from './ClockmakerSceneBase.js';
import { Apprentice } from './Apprentice.js';
import { ClockworkCity } from './ClockworkCity.js';
const clamp=v=>Math.max(0,Math.min(1,v));const ease=v=>{v=clamp(v);return v*v*(3-2*v)};const win=(p,a,b)=>ease((p-a)/(b-a));
const CAM=[{at:0,pos:[0,12,14],look:[0,0,0],fov:45},{at:.25,pos:[-5,5,9],look:[-2,1,0],fov:39},{at:.52,pos:[0,3,7],look:[1,2,0],fov:36},{at:.78,pos:[4,5,10],look:[0,8,-2],fov:41},{at:1,pos:[2,9,14],look:[0,12,-3],fov:47}];
function shot(p,pos,look){let i=0;while(i<CAM.length-2&&p>=CAM[i+1].at)i++;const a=CAM[i],b=CAM[i+1],t=ease((p-a.at)/(b.at-a.at));pos.set(...a.pos).lerp(new THREE.Vector3(...b.pos),t);look.set(...a.look).lerp(new THREE.Vector3(...b.look),t);return a.fov+(b.fov-a.fov)*t;}
export class CityDisagreesScene extends ClockmakerSceneBase {
 build(){const {kit,group:g}=this;this._hand=new THREE.Vector3();this._crown=new THREE.Vector3();this._delta=new THREE.Vector3();this.city=new ClockworkCity(kit,{count:42});g.add(this.city.root);this.apprentice=new Apprentice(kit);this.apprentice.group.position.set(-4,0,2);this.apprentice.group.rotation.y=Math.PI/2;g.add(this.apprentice.group);
  this.streetClock=kit.clockFace({radius:.82});this.streetClock.position.set(-1,1.5,.8);g.add(this.streetClock);this.crown=new THREE.Object3D();this.crown.position.set(0,.98,.15);this.streetClock.add(this.crown);
  this.thread=kit.redThread([new THREE.Vector3(-4,.3,2),new THREE.Vector3(-1,.6,.8),new THREE.Vector3(2,.8,-1),new THREE.Vector3(0,10,-3)]);this.thread.visible=false;g.add(this.thread);
  this.tower=new THREE.Group();this.tower.position.set(0,10,-3);g.add(this.tower);for(let i=0;i<5;i++){const gear=kit.gear({radius:1.2+i*.25,teeth:16+i*2});gear.position.y=i*1.5;this.tower.add(gear)}this.fog=new THREE.Fog('#19263d',9,45);
 }
 update(p,time){const exp=this.experience,repair=win(p,.18,.48),chase=win(p,.45,.78),route=win(p,.72,1);exp.setSky('#19263d',this.fog);exp.setLights({hemi:.4,key:.55,rim:.45,accent:{pos:[-1,1.5,.8],intensity:.8+repair*2,color:'#ffd47b'}});this.city.setDisagreement(1-repair,time);
  this.apprentice.group.position.set(-4+chase*5,0,2-chase*2);this.apprentice.group.rotation.y=Math.PI/2;this.apprentice.setPose(repair>.02?'windKey':chase>.02?'run':'walk',time,chase);if(repair>.02){this.streetClock.updateMatrixWorld(true);this.apprentice.group.updateMatrixWorld(true);this.crown.getWorldPosition(this._crown);this.apprentice.keyAnchor.getWorldPosition(this._hand);this._delta.subVectors(this._crown,this._hand);this.apprentice.group.position.add(this._delta)}this.streetClock.userData.minute.rotation.z=-time*(1-repair* .8);this.thread.visible=route>.02;this.thread.material.opacity=route;this.tower.children.forEach((gear,i)=>gear.rotation.z=time*(i%2?-.5:.5));
  const fov=shot(p,this._cameraPosition,this._cameraLook);exp.camera.setView(this._cameraPosition,this._cameraLook,0,fov);this.debugState={progress:p,repair,chase,route,finite:Number.isFinite(this.apprentice.group.position.x)};
 }
}
