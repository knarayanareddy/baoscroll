import * as THREE from 'three';
import { ClockmakerSceneBase } from './ClockmakerSceneBase.js';
import { Apprentice } from './Apprentice.js';
import { PocketWatch } from './PocketWatch.js';
import { MasterClock } from './MasterClock.js';
const clamp=v=>Math.max(0,Math.min(1,v));const ease=v=>{v=clamp(v);return v*v*(3-2*v)};const win=(p,a,b)=>ease((p-a)/(b-a));
const CAM=[{at:0,pos:[-5,3,10],look:[0,1.4,0],fov:44},{at:.25,pos:[-2,2.2,5.8],look:[0,1.2,.2],fov:37},{at:.55,pos:[1.8,2.5,5.4],look:[0,3,-1.2],fov:38},{at:.8,pos:[0,4,8],look:[0,4,-2],fov:43},{at:1,pos:[0,8,13],look:[0,0,-3],fov:47}];
function shot(p,pos,look){let i=0;while(i<CAM.length-2&&p>=CAM[i+1].at)i++;const a=CAM[i],b=CAM[i+1],t=ease((p-a.at)/(b.at-a.at));pos.set(...a.pos).lerp(new THREE.Vector3(...b.pos),t);look.set(...a.look).lerp(new THREE.Vector3(...b.look),t);return a.fov+(b.fov-a.fov)*t;}
export class WorkshopWakesScene extends ClockmakerSceneBase {
 build(){const {kit,group:g}=this;this._hand=new THREE.Vector3();this._crown=new THREE.Vector3();this._delta=new THREE.Vector3();
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(18,12),kit.material('wood','#50392e'));floor.rotation.x=-Math.PI/2;g.add(floor);
  this.bench=new THREE.Group();g.add(this.bench);const top=new THREE.Mesh(new THREE.BoxGeometry(6,.2,2.7),kit.material('wood','#6c4b38'));top.position.y=1.1;this.bench.add(top);for(const [x,z]of [[-2.5,-1],[2.5,-1],[-2.5,1],[2.5,1]]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.16,1.1,.16),kit.material('wood','#3c2c25'));leg.position.set(x,.55,z);this.bench.add(leg)}
  this.watch=new PocketWatch(kit);this.watch.root.position.set(-.5,1.28,.35);this.bench.add(this.watch.root);this.crownAnchor=this.watch.crown;
  this.master=new MasterClock(kit);this.master.root.scale.setScalar(.46);this.master.root.position.set(0,3.4,-2.8);g.add(this.master.root);
  this.apprentice=new Apprentice(kit);this.apprentice.group.position.set(.5,0,2.1);this.apprentice.group.rotation.y=Math.PI;g.add(this.apprentice.group);
  this.blueprints=[];for(let i=0;i<8;i++){const b=kit.blueprint({width:1.2,height:.85});b.position.set(-3+(i%4)*1.8,1.25+(i%2)*.05,-.7+Math.floor(i/4)*1.3);b.rotation.x=-Math.PI/2;b.userData.base=b.position.clone();this.bench.add(b);this.blueprints.push(b)}
  this.clocks=[];for(let i=0;i<9;i++){const c=kit.clockFace({radius:.32+(i%3)*.08});c.position.set(-5+(i%5)*2.4,1.4+Math.floor(i/5)*1.4,-3);g.add(c);this.clocks.push(c)}
  this.masterLight=new THREE.PointLight('#ffd47b',0,16,2);this.masterLight.position.set(0,3.4,-1.8);g.add(this.masterLight);this.fog=new THREE.Fog('#1b2840',7,35);
 }
 update(p,time){const exp=this.experience,wind=win(p,.1,.42),wake=win(p,.28,.72),route=win(p,.68,1);exp.setSky('#1b2840',this.fog);exp.setLights({hemi:.45+wake*.3,key:.5+wake*.7,rim:.3,accent:{pos:[-.5,1.3,.35],intensity:.6+wake*3,color:'#ffd47b'}});
  this.apprentice.group.position.set(.5,0,2.1);this.apprentice.group.rotation.y=Math.PI;this.apprentice.setPose(wind>.02?'windKey':'idle',time,wind);this.watch.root.updateMatrixWorld(true);this.apprentice.group.updateMatrixWorld(true);this.crownAnchor.getWorldPosition(this._crown);this.apprentice.keyAnchor.getWorldPosition(this._hand);this._delta.subVectors(this._crown,this._hand);this.apprentice.group.position.add(this._delta);
  this.watch.setTime(wind,.25+wind*.75);this.master.setFinalHour(0);this.masterLight.intensity=wake*3;this.clocks.forEach((clock,i)=>{clock.userData.minute.rotation.z=-wake*(i+1)*.45;clock.scale.setScalar(.7+wake*.3);});this.blueprints.forEach((b,i)=>{b.position.y=b.userData.base.y+wake*(.15+(i%3)*.09);b.rotation.z=Math.sin(time+i)*.04*wake;});
  const fov=shot(p,this._cameraPosition,this._cameraLook);exp.camera.setView(this._cameraPosition,this._cameraLook,0,fov);this.debugState={progress:p,watchWound:wind,workshopAwake:wake,route:route,finite:Number.isFinite(this.apprentice.group.position.x)};
 }
}
