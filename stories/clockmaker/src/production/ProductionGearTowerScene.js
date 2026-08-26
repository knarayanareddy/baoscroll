import * as THREE from 'three';
import { ProductionBaseScene } from './ProductionBaseScene.js';
import { ClockmakerApprentice } from './ClockmakerApprentice.js';
import { UnspentHour } from './UnspentHour.js';

const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
const win = (p, a, b) => ease((p - a) / (b - a));
const SHOTS = [
  { at: 0, pos: [-9, 4.2, 15], look: [0, 3, 0], fov: 46 },
  { at: .15, pos: [-5.4, 3.2, 10], look: [-2, 2.3, .1], fov: 42 },
  { at: .33, pos: [-2.2, 4.4, 7.2], look: [.7, 6.6, -.4], fov: 38 },
  { at: .50, pos: [2.9, 8.2, 7.9], look: [3.2, 8.8, -.5], fov: 36 },
  { at: .68, pos: [1.2, 12.6, 6.5], look: [0, 13.6, -1], fov: 34 },
  { at: .84, pos: [2.1, 17.5, 5.5], look: [0, 18.2, -1.2], fov: 31 },
  { at: 1, pos: [-5.5, 20, 14], look: [0, 18, -3], fov: 47 }
];
function shot(p, pos, look) { let i = 0; while (i < SHOTS.length - 2 && p >= SHOTS[i + 1].at) i++; const a = SHOTS[i], b = SHOTS[i + 1], t = ease((p - a.at) / (b.at - a.at)); pos.set(...a.pos).lerp(new THREE.Vector3(...b.pos), t); look.set(...a.look).lerp(new THREE.Vector3(...b.look), t); return a.fov + (b.fov - a.fov) * t; }

// Production Gear Tower: a vertical action machine. The apprentice's route,
// pendulum catch, feet, city depth, chamber fracture, and red thread all
// share the same scroll state.
export class ProductionGearTowerScene extends ProductionBaseScene {
  build() {
    const { group: g, kit } = this;
    this._hand = new THREE.Vector3(); this._handLeft = new THREE.Vector3(); this._pendulumGrip = new THREE.Vector3(); this._pendulumGripLeft = new THREE.Vector3(); this._foot = new THREE.Vector3(); this._delta = new THREE.Vector3();

    /* ---------------- city far below ---------------- */
    this.city = new THREE.Group(); this.city.position.set(0, -8.8, -10); this.city.scale.setScalar(.58); g.add(this.city);
    this.cityClocks = [];
    for (let i = 0; i < 40; i++) {
      const building = kit.miniatureBuilding({ w: .7 + (i % 4) * .17, h: .8 + (i % 5) * .28, d: .75 + (i % 3) * .15 });
      building.position.set(-5 + (i % 8) * 1.42, 0, -3 + Math.floor(i / 8) * 1.38); this.city.add(building);
      if (i % 3 === 0) { const clock = kit.clockFace({ radius: .2 }); clock.position.set(building.position.x, building.position.y + .85, building.position.z + .45); this.city.add(clock); this.cityClocks.push({ node: clock, phase: i * .51 }); }
    }
    this.cityTrain = kit.train(); this.cityTrain.position.set(-5.2, .2, 3.1); this.city.add(this.cityTrain);
    const cityLight = new THREE.PointLight('#ffd47b', .65, 12, 2); cityLight.position.set(0, 3, 0); this.city.add(cityLight);

    /* ---------------- tower shaft, braces, route gears ---------------- */
    this.tower = new THREE.Group(); g.add(this.tower);
    const leftRail = new THREE.Mesh(new THREE.BoxGeometry(.22, 22, .24), kit.material('brass', '#6d512b')); leftRail.position.set(-5, 10, -1.5); this.tower.add(leftRail);
    const rightRail = new THREE.Mesh(new THREE.BoxGeometry(.22, 22, .24), kit.material('brass', '#6d512b')); rightRail.position.set(5, 10, -1.5); this.tower.add(rightRail);
    for (let i = 0; i < 9; i++) { const brace = new THREE.Mesh(new THREE.BoxGeometry(10, .12, .12), kit.material('brass', i % 2 ? '#9b7436' : '#714f2b')); brace.position.set(0, 1.2 + i * 2.2, -1.5); this.tower.add(brace); }

    const layout = [
      { x: -3.2, y: 2.2, r: 2.55, teeth: 20, dir: -1 },
      { x: 1.2, y: 5.15, r: 2.1, teeth: 18, dir: 1 },
      { x: -1.25, y: 8.55, r: 2.8, teeth: 24, dir: -1 },
      { x: 2.6, y: 11.7, r: 2.15, teeth: 18, dir: 1 },
      { x: -.25, y: 15.0, r: 3.0, teeth: 26, dir: -1 }
    ];
    this.gears = []; this.treads = [];
    layout.forEach((spec, gearIndex) => {
      const gear = kit.gear({ radius: spec.r, teeth: spec.teeth, color: gearIndex % 2 ? '#c4964c' : '#a87835', spokes: 5 + gearIndex % 2 });
      gear.position.set(spec.x, spec.y, 0); const wear=new THREE.Mesh(new THREE.CircleGeometry(spec.r*.84,32),new THREE.MeshBasicMaterial({map:kit.asset('gearWear'),transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide,blending:THREE.MultiplyBlending}));wear.position.z=.14;gear.add(wear); this.tower.add(gear); this.gears.push({ gear, wear, ...spec });
      for (let tooth = 0; tooth < spec.teeth; tooth++) this.treads.push({ gear, gearIndex, tooth, pos: new THREE.Vector3(), rot: 0 });
    });

    /* ---------------- pendulum catch machine ---------------- */
    this.pendulum = kit.pendulum({ length: 6.4 }); this.pendulum.position.set(3.6, 10.7, -.7); this.tower.add(this.pendulum);
    this.pendulumGrip = this.pendulum.userData.grip; this.pendulumGripLeft = this.pendulum.userData.gripLeft;
    const pendulumArch = new THREE.Mesh(new THREE.TorusGeometry(2.1, .12, 8, 24, Math.PI), kit.material('brass', '#a87835')); pendulumArch.position.set(3.6, 10.7, -.9); this.tower.add(pendulumArch);
    // Weighted counterbalances, chain links and a paper blueprint sleeve make
    // the pendulum read as a machine with mass rather than a single rod.
    this.counterweights = [];
    for (let i = 0; i < 3; i++) { const weight = new THREE.Mesh(new THREE.BoxGeometry(.46, .78, .34), kit.material('brass', i ? '#8a6329' : '#b98942')); weight.position.set(3.6 + (i - 1) * .34, 13.5 + i * .46, -.8); this.tower.add(weight); this.counterweights.push({ node: weight, base: weight.position.clone(), phase: i * .8 }); }
    this.chains = [];
    for (const x of [-4.5, -3.95, 3.95, 4.5]) { const chain = new THREE.Group(); for (let y = 0; y < 19; y++) { const link = new THREE.Mesh(new THREE.TorusGeometry(.075, .018, 5, 8), kit.material('brass', '#75552e')); link.position.y = y * 1.12; link.rotation.x = y % 2 ? Math.PI / 2 : 0; chain.add(link); } chain.position.set(x, .2, -1.1); this.tower.add(chain); this.chains.push(chain); }
    this.blueprintRibbons = [];
    for (let i = 0; i < 9; i++) { const paper = kit.blueprint({ width: 1.5 + (i % 3) * .3, height: .95 }); paper.position.set(-4.4 + (i % 5) * 2.1, 2.2 + Math.floor(i / 5) * 7.3, -1.72); paper.userData = { base: paper.position.clone(), phase: i * .71 }; this.tower.add(paper); this.blueprintRibbons.push(paper); }
    // Narrow shafts make the city depth and pendulum mass readable; their
    // opacity follows the hostile-hour state rather than a generic bloom pass.
    this.lightShafts=[];for(let i=0;i<5;i++){const shaft=new THREE.Mesh(new THREE.ConeGeometry(.75+i*.22,12,10,1,true),new THREE.MeshBasicMaterial({color:'#8fb7d1',transparent:true,opacity:.04,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));shaft.position.set(-3.8+i*1.9,6+i*1.6,-2.1);shaft.rotation.z=(i-2)*.11;this.tower.add(shaft);this.lightShafts.push({node:shaft,phase:i*.61});}
    this.pendulumShadow=new THREE.Mesh(new THREE.PlaneGeometry(3.6,8.8),new THREE.MeshBasicMaterial({color:'#091321',transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide}));this.pendulumShadow.position.set(3.6,7.4,-1.62);this.tower.add(this.pendulumShadow);

    /* ---------------- fractured minute-hand chamber ---------------- */
    this.chamber = new THREE.Group(); this.chamber.position.set(0, 18.4, -1.3); g.add(this.chamber);
    const dial = kit.clockFace({ radius: 2.85, face: '#eee1bd' }); this.chamber.add(dial);
    this.enamelField=experience.effects.enamelFace({radius:2.72});this.enamelField.position.z=.12;this.chamber.add(this.enamelField);
    this.timeField=experience.effects.timeFractureField({radius:3.25});this.timeField.position.z=.2;this.chamber.add(this.timeField);
    this.fractures = [];
    for (let i = 0; i < 10; i++) {
      const shard = new THREE.Mesh(new THREE.PlaneGeometry(.2, 1.45), kit.material('enamel', '#dfcfab'));
      const a = i / 10 * Math.PI * 2; shard.userData.base = new THREE.Vector3(Math.cos(a) * 2.3, Math.sin(a) * 2.3, .13); shard.position.copy(shard.userData.base); shard.rotation.z = a; this.chamber.add(shard); this.fractures.push(shard);
    }
    this.chamberLight = new THREE.PointLight('#ffd47b', 0, 18, 2); this.chamber.add(this.chamberLight);
    this.unspentHour = new UnspentHour(kit,{particleCount:this.tiered(70,42,22),scale:1.15}).attachTo(this.chamber,new THREE.Vector3(0,0,.35));
    this.towerClocks = [];
    for (let i = 0; i < 8; i++) { const face = kit.clockFace({ radius: .38 + (i % 3) * .08, face: i % 2 ? '#dfcfab' : '#eee1bd' }); face.position.set(i % 2 ? -4.72 : 4.72, 2.1 + i * 1.9, -.92); face.rotation.y = i % 2 ? Math.PI / 2 : -Math.PI / 2; this.tower.add(face); this.towerClocks.push({ node: face, phase: i * .63 }); }
    // Dust, paper fibres, and warm tooth sparks make the vertical route feel
    // like a working tower rather than a clean diagram.
    this.motes = [];
    const moteMaterial = new THREE.MeshBasicMaterial({ color: '#d9c49b', transparent: true, opacity: .45, depthWrite: false });
    for (let i = 0; i < this.tiered(120, 76, 38); i++) { const mote = new THREE.Mesh(new THREE.PlaneGeometry(.025 + (i % 4) * .012, .025 + (i % 3) * .01), moteMaterial.clone()); mote.position.set(-5 + (i * 37 % 10), 1 + (i * 23 % 19), -1.3 + (i % 6) * .28); mote.userData = { base: mote.position.clone(), phase: i * .37, rise: .1 + (i % 5) * .04 }; this.tower.add(mote); this.motes.push(mote); }
    this.sparks = [];
    for (let i = 0; i < this.tiered(56, 34, 18); i++) { const spark = new THREE.Mesh(new THREE.PlaneGeometry(.04, .16), new THREE.MeshBasicMaterial({ color: '#ffd47b', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); spark.userData = { gear: i % layout.length, phase: i * .29, radius: .6 + (i % 5) * .16 }; this.tower.add(spark); this.sparks.push(spark); }

    /* ---------------- hero and red route ---------------- */
    this.apprentice = new ClockmakerApprentice(kit); this.apprentice.group.position.set(-5.1, 1.4, .35); this.apprentice.group.rotation.y = Math.PI / 2; g.add(this.apprentice.group);
    this.thread = experience.effects.redThreadGlow([new THREE.Vector3(-5.1, 1.4, .35), new THREE.Vector3(1.2, 5.2, .35), new THREE.Vector3(-1.25, 8.6, .35), new THREE.Vector3(2.6, 11.7, .35), new THREE.Vector3(-.25, 15, .25), new THREE.Vector3(0, 18.4, -1.1)]); this.thread.visible = false; g.add(this.thread);
    this.fog = new THREE.Fog('#18263c', 10, 52);
  }

  update(p, time) {
    const run = win(p, .02, .30), catchPendulum = win(p, .28, .55), climb = win(p, .50, .87), arrival = win(p, .84, 1);
    const exp = this.experience;
    exp.renderer.setClearColor('#18263c'); exp.scene.fog = this.fog;
    exp.lights.hemi.intensity = .38 + arrival * .14; exp.lights.key.intensity = .48 + arrival * .38; exp.lights.rim.intensity = .62; exp.lights.accent.position.set(0, 18.4, -1.2); exp.lights.accent.intensity = arrival * 3.4;

    /* Dynamic tooth contact positions are recomputed from current gear rotation. */
    this.gears.forEach(({ gear, dir, teeth, r, x, y }, gi) => {
      gear.rotation.z = dir * (time * .35 + p * (1.3 + gi * .22));
      for (const tread of this.treads.filter((item) => item.gearIndex === gi)) {
        const angle = tread.tooth / teeth * Math.PI * 2 + gear.rotation.z;
        tread.pos.set(x + Math.cos(angle) * r, y + Math.sin(angle) * r, .32);
        tread.rot = -angle + Math.PI / 2;
      }
    });

    this.cityClocks.forEach(({ node, phase }) => { node.userData.minute.rotation.z = -time * (.35 + Math.sin(phase) * .2) - (1 - arrival) * Math.sin(phase) * 1.8; });
    this.cityTrain.position.x = -5.2 + arrival * 10.4;
    this.towerClocks.forEach(({ node, phase }) => { node.userData.minute.rotation.z = -time * (1.1 + Math.sin(phase) * .45); node.userData.hour.rotation.z = -time * .12; });
    this.counterweights.forEach(({ node, base, phase }) => { node.position.y = base.y + Math.sin(time * 1.4 + phase) * .24 * (1 - arrival * .5); });
    this.blueprintRibbons.forEach((paper) => { paper.position.y = paper.userData.base.y + Math.sin(time * .55 + paper.userData.phase) * .25; paper.rotation.z = Math.sin(time * .7 + paper.userData.phase) * .12; });
    this.lightShafts.forEach(({node,phase})=>{node.material.opacity=.025+(.08*catchPendulum)+(.05*climb);node.rotation.z=(phase-1.2)*.08+Math.sin(time*.22+phase)*.04;});
    this.pendulumShadow.rotation.z=this.pendulum.rotation.z;this.pendulumShadow.material.opacity=.12+.16*catchPendulum;
    this.motes.forEach((mote) => { mote.position.set(mote.userData.base.x + Math.sin(time * .4 + mote.userData.phase) * .35, mote.userData.base.y + Math.sin(time * mote.userData.rise + mote.userData.phase) * .55, mote.userData.base.z); mote.material.opacity = .18 + .28 * (1 - arrival); });
    this.sparks.forEach((spark) => { const source = this.gears[spark.userData.gear]; const a = time * 2.2 + spark.userData.phase + source.gear.rotation.z; spark.position.set(source.x + Math.cos(a) * (source.r + spark.userData.radius), source.y + Math.sin(a) * (source.r + spark.userData.radius), .45); spark.rotation.z = a; spark.material.opacity = .08 + catchPendulum * .46 + climb * .2; });

    const k = this.apprentice;
    if (catchPendulum > .02 && catchPendulum < .98) {
      k.group.position.set(2.45, 7.2, .16); k.group.rotation.y = -.92; k.setAction('catch', time, catchPendulum, .75);
      this.pendulum.rotation.z = Math.sin(time * 1.4) * (1 - catchPendulum * .72);
      this.pendulum.updateMatrixWorld(true); k.group.updateMatrixWorld(true);
      this.pendulumGrip.getWorldPosition(this._pendulumGrip); this.pendulumGripLeft.getWorldPosition(this._pendulumGripLeft);
      k.right.anchor.getWorldPosition(this._hand); k.left.anchor.getWorldPosition(this._handLeft);
      // Correct the body to the midpoint between the two real grips/hand anchors.
      this._pendulumGrip.add(this._pendulumGripLeft).multiplyScalar(.5); this._hand.add(this._handLeft).multiplyScalar(.5);
      this._delta.subVectors(this._pendulumGrip, this._hand); k.group.position.add(this._delta);
    } else if (climb > .02) {
      const index = Math.min(this.treads.length - 1, Math.floor(climb * (this.treads.length - 1))); const tread = this.treads[index];
      k.group.position.copy(tread.pos); k.group.rotation.y = tread.rot; k.setAction('climb', time, climb, .48);
      k.group.updateMatrixWorld(true); const leadFoot = index % 2 ? k.rightLeg.anchor : k.leftLeg.anchor; leadFoot.getWorldPosition(this._foot); this._delta.subVectors(tread.pos, this._foot); k.group.position.add(this._delta);
    } else {
      const index = Math.min(this.treads.length - 1, Math.floor(run * (this.treads.length - 1) * .28)); const tread = this.treads[index];
      k.group.position.copy(tread.pos); k.group.rotation.y = tread.rot; k.setAction('run', time, run, .35);
      this.pendulum.rotation.z = Math.sin(time * 1.4);
    }

    this.enamelField.userData.setEnamel(.35+arrival*.65,0);this.timeField.userData.setTimeFracture(.55+arrival*.45,time);this.thread.visible = climb > .03; this.thread.userData.setThread(climb * (1 - arrival * .25));
    this.fractures.forEach((shard, i) => { shard.position.copy(shard.userData.base).multiplyScalar(1 + arrival * .22); shard.material.opacity = .96 - arrival * .72; });
    this.chamberLight.intensity = arrival * 3;this.unspentHour.setMood('hostile');this.unspentHour.setProgress(arrival);this.unspentHour.update(time,0,1);
    const fov = shot(p, this.experience._pos, this.experience._look); this.experience.camera.set(this.experience._pos, this.experience._look, fov);
    this.debugState = { contacts:this.apprentice.captureContacts(), progress: p, threadVisible: this.thread.visible, finiteTreads: this.treads.every((t) => Number.isFinite(t.pos.x) && Number.isFinite(t.pos.y)), pendulumCatch: catchPendulum, arrival };
  }
}
