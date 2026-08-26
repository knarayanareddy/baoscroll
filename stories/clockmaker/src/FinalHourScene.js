import * as THREE from 'three';
import { ClockmakerSceneBase } from './ClockmakerSceneBase.js';
import { Apprentice } from './Apprentice.js';
import { MasterClock } from './MasterClock.js';
import { PocketWatch } from './PocketWatch.js';
import { ClockworkCity } from './ClockworkCity.js';

const clamp=v=>Math.max(0,Math.min(1,v));const ease=v=>{v=clamp(v);return v*v*(3-2*v)};const win=(p,a,b)=>ease((p-a)/(b-a));
const CAM=[
 {at:0,pos:[-6,3.5,12],look:[0,4,0],fov:44},
 {at:.25,pos:[-3,2.6,7],look:[0,4,0],fov:38},
 {at:.5,pos:[2.2,3.2,5.4],look:[0,4.2,.2],fov:32},
 {at:.72,pos:[1.4,4.4,4.2],look:[0,4.6,.25],fov:30},
 {at:.9,pos:[-4,6.5,11],look:[0,3,-5],fov:44},
 {at:1,pos:[-9,9,18],look:[0,0,-7],fov:48}
];
function shot(p,pos,look){let i=0;while(i<CAM.length-2&&p>=CAM[i+1].at)i++;const a=CAM[i],b=CAM[i+1],t=ease((p-a.at)/(b.at-a.at));pos.set(...a.pos).lerp(new THREE.Vector3(...b.pos),t);look.set(...a.look).lerp(new THREE.Vector3(...b.look),t);return a.fov+(b.fov-a.fov)*t;}

export class FinalHourScene extends ClockmakerSceneBase {
  build(){const {kit,group:g}=this;this._hand=new THREE.Vector3();this._target=new THREE.Vector3();this._delta=new THREE.Vector3();
    const floor=new THREE.Mesh(new THREE.CircleGeometry(10,48),kit.material('wood','#50392e'));floor.rotation.x=-Math.PI/2;g.add(floor);
    for(let i=0;i<16;i++){const gear=kit.gear({radius:.7+(i%4)*.15,teeth:12+(i%5)*2});const a=i/16*Math.PI*2;gear.position.set(Math.cos(a)*7,.3,Math.sin(a)*3);gear.rotation.x=Math.PI/2;g.add(gear);}
    this.master=new MasterClock(kit);this.master.root.position.set(0,4,-.4);g.add(this.master.root);
    this.apprentice=new Apprentice(kit);this.apprentice.group.position.set(1.7,0,1.2);this.apprentice.group.rotation.y=-2.2;g.add(this.apprentice.group);
    this.watch=new PocketWatch(kit);this.watch.root.position.set(1.1,1.1,1.4);g.add(this.watch.root);
    this.thread=kit.redThread([new THREE.Vector3(1.7,1.6,1.1),new THREE.Vector3(.7,3.6,.5),new THREE.Vector3(0,7.5,-.1)]);this.thread.visible=false;g.add(this.thread);
    this.city=new ClockworkCity(kit,{count:36});this.city.root.position.set(0,-6,-9);this.city.root.scale.setScalar(.48);g.add(this.city.root);
    this.light=new THREE.PointLight('#ffd47b',0,28,2);this.light.position.set(0,4,.2);g.add(this.light);
    this.fog=new THREE.Fog('#1b2840',8,46);
  }
  update(p,time){const exp=this.experience;const approach=win(p,.02,.3),release=win(p,.28,.55),thread=win(p,.48,.78),strike=win(p,.72,1);
    exp.setSky('#1b2840',this.fog);exp.setLights({hemi:.42+strike*.4,key:.5+strike*1.1,rim:.45,accent:{pos:[0,4,.2],intensity:1+strike*4,color:'#ffd47b'}});
    this.apprentice.group.position.set(1.7-approach*.65,0,1.2-approach*.45);this.apprentice.group.rotation.y=-2.2+approach*.12;this.apprentice.setPose(thread>.02?'reachThread':release>.02?'placeHand':'holdWatch',time,thread);
    const target=thread>.02?this.master.threadAnchor:this.master.releaseAnchor;this.master.root.updateMatrixWorld(true);this.apprentice.group.updateMatrixWorld(true);target.getWorldPosition(this._target);this.apprentice.rightHand.anchor.getWorldPosition(this._hand);this._delta.subVectors(this._target,this._hand);this.apprentice.group.position.add(this._delta);
    this.master.setFinalHour(Math.max(release,thread));this.thread.visible=thread>.02;this.thread.material.opacity=thread;this.watch.setTime(.75+strike*.25,.5+strike*.5);
    this.city.setDisagreement(1-strike,time);this.light.intensity=1+strike*5;this.master.dial.userData.minute.rotation.z=-strike*Math.PI*2;
    const fov=shot(p,this._cameraPosition,this._cameraLook);exp.camera.setView(this._cameraPosition,this._cameraLook,0,fov);this.debugState={progress:p,redHand:this.master.redHand.visible,threadVisible:this.thread.visible,finite: Number.isFinite(this.apprentice.group.position.x)};
  }
}
