import * as THREE from 'three';
import { ProductionBaseScene } from './ProductionBaseScene.js';
import { ClockmakerApprentice } from './ClockmakerApprentice.js';
import { PocketWatch } from '../PocketWatch.js';
import { MasterClock } from '../MasterClock.js';
import { UnspentHour } from './UnspentHour.js';
import { WorkshopSurfaceAtlas } from './WorkshopSurfaceAtlas.js';

const clamp=v=>Math.max(0,Math.min(1,v));const ease=v=>{v=clamp(v);return v*v*(3-2*v)};const win=(p,a,b)=>ease((p-a)/(b-a));
const SHOTS=[
 {at:0,pos:[-6,3.2,10],look:[0,1.15,0],fov:44},
 {at:.16,pos:[-3.2,2.25,6.1],look:[-.3,1.25,.25],fov:39},
 {at:.36,pos:[1.1,2.15,4.6],look:[-.2,1.28,.35],fov:32},
 {at:.58,pos:[2.6,2.7,6.4],look:[0,3.6,-2.8],fov:39},
 {at:.78,pos:[.2,4.6,8.7],look:[0,5,-3.2],fov:43},
 {at:1,pos:[0,8.6,14],look:[0,0,-4],fov:48}
];
function shot(p,pos,look){let i=0;while(i<SHOTS.length-2&&p>=SHOTS[i+1].at)i++;const a=SHOTS[i],b=SHOTS[i+1],t=ease((p-a.at)/(b.at-a.at));pos.set(...a.pos).lerp(new THREE.Vector3(...b.pos),t);look.set(...a.look).lerp(new THREE.Vector3(...b.look),t);return a.fov+(b.fov-a.fov)*t;}

// Production Workshop: a small room that becomes architectural as blueprints
// fold outward. The first act establishes every object the story will ask us
// to care about: watch, key, master clock, thread, diagrams, tools.
export class ProductionWorkshopWakesScene extends ProductionBaseScene {
 build(){const {group:g,kit}=this;this._hand=new THREE.Vector3();this._crown=new THREE.Vector3();this._delta=new THREE.Vector3();
  /* ---------------- room and workshop furniture ---------------- */
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(20,14),kit.material('wood','#50382d'));floor.rotation.x=-Math.PI/2;g.add(floor);
  const backWall=new THREE.Mesh(new THREE.PlaneGeometry(16,8),kit.material('paper','#1c2a40'));backWall.position.set(0,4,-4.1);g.add(backWall);
  const sideWall=new THREE.Mesh(new THREE.PlaneGeometry(10,8),kit.material('paper','#26364e'));sideWall.position.set(-7.5,4,0);sideWall.rotation.y=Math.PI/2;g.add(sideWall);
  this.window=new THREE.Group();this.window.position.set(4.8,3.7,-3.95);g.add(this.window);const frame=new THREE.Mesh(new THREE.BoxGeometry(3.5,3.6,.12),kit.material('wood','#3e2a22'));this.window.add(frame);const night=new THREE.Mesh(new THREE.PlaneGeometry(3.25,3.35),new THREE.MeshBasicMaterial({color:'#42627d',transparent:true,opacity:.25,side:THREE.DoubleSide,depthWrite:false}));night.position.z=.08;this.window.add(night);for(let i=-1;i<=1;i++){const bar=new THREE.Mesh(new THREE.BoxGeometry(.06,3.4,.13),kit.material('wood','#35251f'));bar.position.set(i*1.05,0,.12);this.window.add(bar);}
  this.bench=kit.workbench();this.bench.position.set(.1,0,.2);g.add(this.bench);
  this.toolAtlas=new WorkshopSurfaceAtlas();this.toolCards=[];for(let i=0;i<6;i++){const card=this.toolAtlas.toolCard(.7,.45);card.position.set(-2.35+(i%3)*1.15,1.235,-.78+Math.floor(i/3)*1.15);card.rotation.x=-Math.PI/2;card.rotation.z=(i%3-.8)*.12;this.bench.add(card);this.toolCards.push(card);}
  /* ---------------- shelves, drawers, and dormant clocks ---------------- */
  this.shelfClocks=[];this.shelfGears=[];
  for(const sx of[-5.8,5.8]){const shelf=new THREE.Group();shelf.position.set(sx,2.7,-3.7);g.add(shelf);for(let level=0;level<3;level++){const plank=new THREE.Mesh(new THREE.BoxGeometry(2.3,.12,.48),kit.material('wood','#5b4031'));plank.position.set(0,level*1.05,0);shelf.add(plank);for(let slot=0;slot<3;slot++){const jar=new THREE.Mesh(new THREE.CylinderGeometry(.15,.18,.35,8),kit.material('enamel',slot%2?'#d8c9aa':'#8da5ae',{opacity:.78}));jar.position.set(-.72+slot*.72,level*.0+level*1.05+.25,.1);shelf.add(jar);}}}
  for(let i=0;i<6;i++){const tall=new THREE.Group();tall.position.set(-4.8+i*1.75,.2,-3.65);const housing=new THREE.Mesh(new THREE.BoxGeometry(.7,2.05,.34),kit.material('wood',i%2?'#5b4031':'#473129'));housing.position.y=1.02;tall.add(housing);const face=kit.clockFace({radius:.23});face.position.set(0,1.55,.2);tall.add(face);const pendulum=new THREE.Mesh(new THREE.BoxGeometry(.04,.55,.03),kit.material('brass','#b98942'));pendulum.position.set(0,.65,.21);tall.add(pendulum);pendulum.userData.phase=i*.74;g.add(tall);this.shelfClocks.push({tall,face,pendulum,phase:i*.74});}
  this.blueprintWall=[];for(let i=0;i<7;i++){const drawing=kit.blueprint({width:1.05,height:.72});drawing.position.set(-3.8+(i%4)*2.3,4.7+Math.floor(i/4)*1.05,-3.88);drawing.rotation.y=Math.PI;drawing.userData={base:drawing.position.clone(),phase:i*.55};g.add(drawing);this.blueprintWall.push(drawing);}
  this.apprentice=new ClockmakerApprentice(kit);this.apprentice.group.position.set(.6,0,2.05);this.apprentice.group.rotation.y=Math.PI;g.add(this.apprentice.group);
  this.watch=new PocketWatch(kit);this.watch.root.position.set(-.45,1.26,.32);this.bench.add(this.watch.root);this.crown=this.watch.crown;
  this.deskLight=new THREE.PointLight('#ffd47b',0,10,2);this.deskLight.position.set(-1.85,2.05,.2);g.add(this.deskLight);const lamp=new THREE.Mesh(new THREE.SphereGeometry(.16,12,8),new THREE.MeshBasicMaterial({color:'#ffe3a0',transparent:true,opacity:.2}));lamp.position.set(-1.85,1.75,.2);this.bench.add(lamp);this.lampGlow=lamp;
  /* ---------------- tools / resting clocks ---------------- */
  this.tools=[];for(let i=0;i<24;i++){const type=i%5;const node=type<2?kit.gear({teeth:10+(i%6)*2,radius:.11+(i%5)*.045}):type===2?new THREE.Mesh(new THREE.BoxGeometry(.7,.05,.08),kit.material('brass','#b98942')):type===3?new THREE.Mesh(new THREE.CylinderGeometry(.025,.045,.54,6),kit.material('wood','#4b3328')):kit.blueprint({width:.52,height:.35});node.position.set(-2.4+(i%8)*.58,1.26+(i%3)*.024,-.72+Math.floor(i/8)*.95);node.rotation.set(0,(i%5)*.4,(i%7)*.1);node.userData={base:node.position.clone(),phase:i*.43};this.bench.add(node);this.tools.push(node);}
  this.wallClocks=[];for(let i=0;i<10;i++){const clock=kit.clockFace({radius:.28+(i%3)*.08});clock.position.set(-5.7+(i%5)*1.45,2.15+Math.floor(i/5)*1.65,-3.9);clock.scale.setScalar(.72);g.add(clock);this.wallClocks.push({node:clock,phase:i*.57});}
  /* ---------------- master clock and blueprint city ---------------- */
  this.master=new MasterClock(kit);this.master.root.scale.setScalar(.5);this.master.root.position.set(0,3.8,-2.9);g.add(this.master.root);
  this.unspentHour=new UnspentHour(kit,{particleCount:this.tiered(48,30,16),scale:.72}).attachTo(this.master.root,new THREE.Vector3(0,0,.45));
  this.blueprints=[];for(let i=0;i<14;i++){const sheet=kit.blueprint({width:1.4+(i%3)*.25,height:.95});sheet.userData={base:new THREE.Vector3(-5.7+(i%5)*2.85,1.6+Math.floor(i/5)*1.15,-1.65),phase:i*.62};sheet.position.copy(sheet.userData.base);sheet.rotation.z=(i%4-.5)*.16;g.add(sheet);this.blueprints.push(sheet);}
  this.foldLines=[];for(let i=0;i<22;i++){const line=new THREE.Mesh(new THREE.BoxGeometry(.02,1.8+(i%4)*.4,.02),kit.material('brass','#b33432'));line.userData={base:new THREE.Vector3(-4.8+(i%11)*.96,1.1+Math.floor(i/11)*1.25,-1.52),phase:i*.31};line.position.copy(line.userData.base);line.visible=false;g.add(line);this.foldLines.push(line);}
  this.foldCity=new THREE.Group();this.foldCity.position.set(0,1.3,-.9);g.add(this.foldCity);this.foldBuildings=[];for(let i=0;i<18;i++){const building=kit.miniatureBuilding({w:.35+(i%3)*.09,h:.45+(i%4)*.13,d:.35+(i%2)*.08});building.userData={flat:new THREE.Vector3(-2.7+(i%6)*.9,.02,-.8+Math.floor(i/6)*.7),rise:new THREE.Vector3(-2.7+(i%6)*.9,.55+(i%4)*.18,-.8+Math.floor(i/6)*.7),phase:i*.44};building.position.copy(building.userData.flat);building.scale.y=.03;this.foldCity.add(building);this.foldBuildings.push(building);}
  this.foldSurface=experience.effects.blueprintFold({width:5.8,height:3.6});this.foldSurface.position.set(0,4.2,-3.82);g.add(this.foldSurface);
  this.routeMaskPlane=new THREE.Mesh(new THREE.PlaneGeometry(5.65,3.45),new THREE.MeshBasicMaterial({map:kit.asset('blueprintRoute'),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));this.routeMaskPlane.position.set(0,4.2,-3.78);g.add(this.routeMaskPlane);
  this.timeField=experience.effects.timeFractureField({radius:1.1});this.timeField.position.set(0,3.8,-2.25);g.add(this.timeField);
  this.thread=experience.effects.redThreadGlow([new THREE.Vector3(-.45,1.3,.4),new THREE.Vector3(.8,1.55,.15),new THREE.Vector3(0,4,-2.7),new THREE.Vector3(0,7,-4)]);this.thread.visible=false;g.add(this.thread);
  this.motes=[];for(let i=0;i<this.tiered(100,64,32);i++){const mote=new THREE.Mesh(new THREE.PlaneGeometry(.02+(i%4)*.01,.02+(i%3)*.01),new THREE.MeshBasicMaterial({color:'#e8d4ae',transparent:true,opacity:.25,depthWrite:false}));mote.userData={base:new THREE.Vector3(-8+(i*29%16),.4+(i*17%7),-1.2+(i%6)*.28),phase:i*.37};mote.position.copy(mote.userData.base);g.add(mote);this.motes.push(mote);}
  this.wakeLight=new THREE.PointLight('#ffd47b',0,18,2);this.wakeLight.position.set(-.45,1.3,.4);g.add(this.wakeLight);this.fog=new THREE.Fog('#1b2840',7,38);
 }
 update(p,time){const wind=win(p,.08,.38),wake=win(p,.25,.7),reveal=win(p,.62,1);const exp=this.experience;exp.renderer.setClearColor('#1b2840');exp.scene.fog=this.fog;exp.lights.hemi.intensity=.42+wake*.25;exp.lights.key.intensity=.48+wake*.65;exp.lights.rim.intensity=.32;exp.lights.accent.position.set(-.45,1.3,.4);exp.lights.accent.intensity=.5+wake*3;
  this.apprentice.group.position.set(.6,0,2.05);this.apprentice.group.rotation.y=Math.PI;this.apprentice.setAction(wind>.02?'wind':'repair',time,wind,.12+wind*.25);this.watch.root.updateMatrixWorld(true);this.apprentice.group.updateMatrixWorld(true);this.crown.getWorldPosition(this._crown);this.apprentice.keyAnchor.getWorldPosition(this._hand);this._delta.subVectors(this._crown,this._hand);this.apprentice.group.position.add(this._delta);
  this.watch.setTime(wind,.2+wind*.8);this.deskLight.intensity=.25+wake*2;this.lampGlow.material.opacity=.08+wake*.62;this.wakeLight.intensity=.5+wake*3;this.master.setFinalHour(0);this.unspentHour.setMood('dormant');this.unspentHour.setProgress(wind);this.unspentHour.update(time,0,1);this.wallClocks.forEach(({node,phase},i)=>{node.userData.minute.rotation.z=-wake*(i+1)*.38-Math.sin(time*.2+phase)*.04;node.scale.setScalar(.72+wake*.28);});
  this.shelfClocks.forEach(({tall,face,pendulum,phase},i)=>{face.userData.minute.rotation.z=-wake*(.6+i*.22)-time*.12*wake;pendulum.rotation.z=Math.sin(time*1.4+phase)*.18*wake;tall.position.y=Math.sin(time*.5+phase)*.025*wake;});this.blueprintWall.forEach(sheet=>{sheet.position.y=sheet.userData.base.y+Math.sin(time*.32+sheet.userData.phase)*.07*wake;sheet.material.opacity=.3+wake*.55;});
  this.tools.forEach(tool=>{tool.position.y=tool.userData.base.y+Math.sin(time*.55+tool.userData.phase)*.05*wake;tool.rotation.z=Math.sin(time*.4+tool.userData.phase)*.05*wake;});this.blueprints.forEach(sheet=>{sheet.position.y=sheet.userData.base.y+wake*(.1+Math.sin(time*.4+sheet.userData.phase)*.12);sheet.rotation.z=Math.sin(time*.55+sheet.userData.phase)*.14*wake;sheet.material.opacity=.72+wake*.22;});this.foldLines.forEach((line,i)=>{const fold=clamp((reveal-i*.025)*2.2);line.visible=fold>.01;line.position.y=line.userData.base.y+fold*2.2;line.rotation.z=Math.sin(time*.8+line.userData.phase)*.12*fold;line.material.opacity=fold*.85;});this.toolCards.forEach((card,i)=>{card.rotation.z=(i%3-.8)*.12+Math.sin(time*.7+i)*.03*wake;card.material.opacity=.35+wake*.65;});this.foldBuildings.forEach(building=>{const fold=clamp((reveal-building.userData.phase*.04)*1.8);building.position.lerpVectors(building.userData.flat,building.userData.rise,fold);building.scale.y=.03+fold*.97;});this.foldSurface.userData.setFold(reveal,time);this.routeMaskPlane.material.opacity=reveal*.42;this.timeField.userData.setTimeFracture(1-wind,time);this.thread.visible=reveal>.06;this.thread.userData.setThread(reveal);this.motes.forEach(m=>{m.position.set(m.userData.base.x+Math.sin(time*.3+m.userData.phase)*.25,m.userData.base.y+Math.sin(time*.21+m.userData.phase)*.18,m.userData.base.z);m.material.opacity=.12+wake*.3;});
  const fov=shot(p,this.experience._pos,this.experience._look);this.experience.camera.set(this.experience._pos,this.experience._look,fov);this.debugState={contacts:this.apprentice.captureContacts(),progress:p,watchWound:wind,blueprintRoute:reveal,foldCityRaised:this.foldBuildings.filter(node=>node.scale.y>.5).length,finite:Number.isFinite(this.apprentice.group.position.x)};
 }
}
