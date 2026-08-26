import * as THREE from 'three';
import { ClockmakerSceneBase } from './ClockmakerSceneBase.js';
import { Apprentice } from './Apprentice.js';
import { ClockworkCity } from './ClockworkCity.js';

const clamp=(v)=>Math.max(0,Math.min(1,v));
const ease=(v)=>{v=clamp(v);return v*v*(3-2*v)};
const win=(p,a,b)=>ease((p-a)/(b-a));
const shot=(keys,p,pos,look)=>{let i=0;while(i<keys.length-2&&p>=keys[i+1].at)i++;const a=keys[i],b=keys[i+1],t=ease((p-a.at)/(b.at-a.at));pos.set(...a.pos).lerp(new THREE.Vector3(...b.pos),t);look.set(...a.look).lerp(new THREE.Vector3(...b.look),t);return a.fov+(b.fov-a.fov)*t;};
const CAM=[
  {at:0,pos:[-9,4,15],look:[0,3,0],fov:46},
  {at:.24,pos:[-4,4,9],look:[0,3,0],fov:40},
  {at:.48,pos:[2,8,8],look:[1,7,0],fov:38},
  {at:.7,pos:[4,12,7],look:[2,13,-1],fov:35},
  {at:.88,pos:[1,17,6],look:[0,18,-1],fov:32},
  {at:1,pos:[-5,19,13],look:[0,18,-2],fov:46}
];

// Phase 4 benchmark: a vertical action scene where every contact has a real
// moving target and every gear state is a pure scroll/time function.
export class GearTowerScene extends ClockmakerSceneBase {
  build(){const {kit,group:g}=this;this._hand=new THREE.Vector3();this._pendulumGrip=new THREE.Vector3();this._foot=new THREE.Vector3();this._delta=new THREE.Vector3();
    this.city=new ClockworkCity(kit,{count:30});this.city.root.position.set(0,-8,-8);this.city.root.scale.setScalar(.42);g.add(this.city.root);
    this.gears=[];this.treads=[];
    const layout=[[-3,2,2.4,20],[1,5,2.1,18],[-1,8,2.7,22],[2,11,2.2,18],[0,14,2.9,24]];
    layout.forEach(([x,y,r,teeth],gi)=>{const gear=kit.gear({radius:r,teeth});gear.position.set(x,y,0);g.add(gear);this.gears.push({gear,base:x,r,teeth,dir:gi%2?1:-1});for(let t=0;t<teeth;t++){const a=t/teeth*Math.PI*2;this.treads.push({gear,gi,tooth:t,pos:new THREE.Vector3(x+Math.cos(a)*r,y+Math.sin(a)*r,.3),rot:-a+Math.PI/2});}});
    this.pendulum=kit.pendulum({length:6});this.pendulum.position.set(3.6,10,-.6);g.add(this.pendulum);this.pendulumGrip=new THREE.Object3D();this.pendulumGrip.position.set(0,-3.2,.1);this.pendulum.add(this.pendulumGrip);
    this.apprentice=new Apprentice(kit);this.apprentice.group.position.copy(this.treads[0].pos);g.add(this.apprentice.group);
    this.thread=kit.redThread([new THREE.Vector3(-4,2,.3),new THREE.Vector3(1,8,.4),new THREE.Vector3(2,14,.2),new THREE.Vector3(0,18,-1)]);this.thread.visible=false;g.add(this.thread);
    this.chamber=new THREE.Group();this.chamber.position.set(0,18,-1);g.add(this.chamber);const dial=kit.clockFace({radius:2.8,color:'#eee1bd'});this.chamber.add(dial);this.fractures=[];for(let i=0;i<8;i++){const shard=new THREE.Mesh(new THREE.PlaneGeometry(.22,1.4),kit.material('enamel','#d8c9a8'));const a=i/8*Math.PI*2;shard.position.set(Math.cos(a)*2.2,Math.sin(a)*2.2,.15);shard.rotation.z=a;shard.userData.base=shard.position.clone();this.chamber.add(shard);this.fractures.push(shard);}this.chamberLight=new THREE.PointLight('#ffd47b',0,18,2);this.chamber.add(this.chamberLight);
    this.fog=new THREE.Fog('#18263c',10,48);
  }
  update(p,time){const exp=this.experience,motion=this.motion;const run=win(p,.02,.32),catchPendulum=win(p,.3,.55),climb=win(p,.5,.86),arrival=win(p,.84,1);exp.setSky('#18263c',this.fog);exp.setLights({hemi:.42,key:.52,rim:.62,accent:{pos:[0,18,-1],intensity:arrival*3,color:'#ffd47b'}});
    this.city.setDisagreement(1-arrival,time*motion);this.gears.forEach(({gear,dir},i)=>gear.rotation.z=dir*(time*.5*motion+p*(i%2?2:-2)));
    this.treads.forEach((tread)=>{const {gear,gi,tooth,r}=tread;const angle=tooth/(this.gears[gi].teeth)*Math.PI*2+gear.rotation.z;tread.pos.set(gear.position.x+Math.cos(angle)*r,gear.position.y+Math.sin(angle)*r,.3);tread.rot=-angle+Math.PI/2;});
    const k=this.apprentice;
    if(catchPendulum>.02&&catchPendulum<.98){k.group.position.set(2.55,7.2,.15);k.group.rotation.y=-.9;k.setPose('catchPendulum',time,catchPendulum);this.pendulum.updateMatrixWorld(true);k.group.updateMatrixWorld(true);this.pendulumGrip.getWorldPosition(this._pendulumGrip);k.rightHand.anchor.getWorldPosition(this._hand);this._delta.subVectors(this._pendulumGrip,this._hand);k.group.position.add(this._delta);}
    else if(climb>.02){const index=Math.min(this.treads.length-1,Math.floor(climb*(this.treads.length-1)));const tread=this.treads[index];k.group.position.copy(tread.pos);k.group.rotation.y=tread.rot;k.setPose('climbGear',time,climb);k.group.updateMatrixWorld(true);k.leftFoot.anchor.getWorldPosition(this._foot);this._delta.subVectors(tread.pos,this._foot);k.group.position.add(this._delta);}
    else {const index=Math.min(this.treads.length-1,Math.floor(run*(this.treads.length-1)*.35));const tread=this.treads[index];k.group.position.copy(tread.pos);k.group.rotation.y=tread.rot;k.setPose('run',time,run);}
    this.pendulum.rotation.z=Math.sin(time*1.4*motion)*(1-catchPendulum*.72);this.thread.visible=climb>.05;this.thread.material.opacity=climb*(1-arrival*.3);this.fractures.forEach((shard)=>{shard.position.copy(shard.userData.base).multiplyScalar(1+arrival*.18);shard.material.opacity=.95-arrival*.7;});this.chamberLight.intensity=arrival*3;
    const fov=shot(CAM,p,this._cameraPosition,this._cameraLook);exp.camera.setView(this._cameraPosition,this._cameraLook,0,fov);this.debugState={progress:p,finiteTreads:this.treads.every(t=>Number.isFinite(t.pos.x)&&Number.isFinite(t.pos.y)),threadVisible:this.thread.visible,arrival};
  }
}
