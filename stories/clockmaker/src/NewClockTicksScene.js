import * as THREE from 'three';
import { ClockmakerSceneBase } from './ClockmakerSceneBase.js';
import { Apprentice } from './Apprentice.js';
import { PocketWatch } from './PocketWatch.js';
import { MasterClock } from './MasterClock.js';
import { ClockworkCity } from './ClockworkCity.js';
const clamp=v=>Math.max(0,Math.min(1,v));const ease=v=>{v=clamp(v);return v*v*(3-2*v)};const win=(p,a,b)=>ease((p-a)/(b-a));
const CAM=[{at:0,pos:[1,2.2,5],look:[0,3,.1],fov:33},{at:.25,pos:[0,5,10],look:[0,0,-5],fov:42},{at:.55,pos:[-4,3,7],look:[-.2,1,.2],fov:38},{at:.8,pos:[-8,8,15],look:[0,0,-6],fov:46},{at:1,pos:[-13,11,22],look:[0,0,-8],fov:50}];
function shot(p,pos,look){let i=0;while(i<CAM.length-2&&p>=CAM[i+1].at)i++;const a=CAM[i],b=CAM[i+1],t=ease((p-a.at)/(b.at-a.at));pos.set(...a.pos).lerp(new THREE.Vector3(...b.pos),t);look.set(...a.look).lerp(new THREE.Vector3(...b.look),t);return a.fov+(b.fov-a.fov)*t;}
export class NewClockTicksScene extends ClockmakerSceneBase {
 build(){const {kit,group:g}=this;this.city=new ClockworkCity(kit,{count:45});this.city.root.position.set(0,-4,-8);this.city.root.scale.setScalar(.65);g.add(this.city.root);this.master=new MasterClock(kit);this.master.root.scale.setScalar(.55);this.master.root.position.set(0,2,-8);g.add(this.master.root);this.apprentice=new Apprentice(kit);this.apprentice.group.position.set(-.2,0,1.8);this.apprentice.group.rotation.y=Math.PI;g.add(this.apprentice.group);this.watch=new PocketWatch(kit);this.watch.root.position.set(-.2,1.18,.35);g.add(this.watch.root);this.blueprint=kit.blueprint({width:3.2,height:2.2});this.blueprint.rotation.x=-Math.PI/2;this.blueprint.position.set(-.2,1.08,.35);g.add(this.blueprint);this.light=new THREE.PointLight('#ffd47b',0,26,2);this.light.position.set(0,2,-8);g.add(this.light);this.fog=new THREE.Fog('#d8a874',15,75);}
 update(p,time){const exp=this.experience,tick=win(p,.02,.28),sync=win(p,.18,.62),place=win(p,.54,.82),retreat=win(p,.78,1);exp.setSky('#d8a874',this.fog);exp.setLights({hemi:1,key:1.1,rim:.2,accent:{pos:[0,2,-8],intensity:1+tick*4,color:'#ffd47b'}});this.master.setFinalHour(1);this.city.setDisagreement(1-sync,time);this.watch.setTime(1,.4+tick*.6);this.light.intensity=1+tick*4;this.apprentice.setPose(place>.02?'setWatchDown':'idle',time,place);this.apprentice.group.position.set(-.2,0,1.8-place*.55);this.watch.root.position.set(-.2,1.18-place*.72,.35+place*.22);this.blueprint.material.opacity=1-place*.25;
 const fov=shot(p,this._cameraPosition,this._cameraLook);exp.camera.setView(this._cameraPosition,this._cameraLook,0,fov);this.debugState={progress:p,tick,sync,place,retreat,finite:Number.isFinite(this.watch.root.position.y)};
 }
}
