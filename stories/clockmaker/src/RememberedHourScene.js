import * as THREE from 'three';
import { ClockmakerSceneBase } from './ClockmakerSceneBase.js';
import { Apprentice } from './Apprentice.js';
import { PocketWatch } from './PocketWatch.js';
import { TimeReversalSystem } from './TimeReversalSystem.js';

const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
const win = (p, a, b) => ease((p - a) / (b - a));

const CAMERAS = [
  { at: 0.0, pos: [-4.6, 3.2, 10.5], look: [0, 1.4, 0], fov: 44 },
  { at: 0.2, pos: [-2.8, 2.4, 6.1], look: [0, 1.25, 0], fov: 40 },
  { at: 0.48, pos: [2.8, 2.45, 5.6], look: [.2, 1.45, .2], fov: 36 },
  { at: 0.67, pos: [1.4, 2.05, 3.25], look: [.1, 1.2, .45], fov: 30 },
  { at: 0.84, pos: [-1.8, 2.7, 5.8], look: [0, 1.6, 0], fov: 42 },
  { at: 1.0, pos: [-5.4, 3.8, 10.8], look: [0, 1.8, -1.2], fov: 47 }
];

function applyShot(camera, p, outPos, outLook) {
  let i = 0; while (i < CAMERAS.length - 2 && p >= CAMERAS[i + 1].at) i++;
  const a = CAMERAS[i], b = CAMERAS[i + 1]; const t = ease((p - a.at) / (b.at - a.at));
  outPos.set(...a.pos).lerp(new THREE.Vector3(...b.pos), t);
  outLook.set(...a.look).lerp(new THREE.Vector3(...b.look), t);
  return a.fov + (b.fov - a.fov) * t;
}

// Benchmark scene: all Clockmaker systems meet here. It is deliberately
// intimate; action is measured through a hand, a watch, and an impossible
// reconstruction instead of through generic visual spectacle.
export class RememberedHourScene extends ClockmakerSceneBase {
  build() {
    const { kit, group: g } = this;
    this.reverse = new TimeReversalSystem();
    this.contactDelta = new THREE.Vector3(); this.handWorld = new THREE.Vector3(); this.watchWorld = new THREE.Vector3();

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 14), kit.material('wood', '#563d31')); floor.rotation.x = -Math.PI / 2; g.add(floor);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), kit.material('paper', '#1c2d45')); wall.position.set(0, 4, -4); g.add(wall);
    this.bench = new THREE.Group(); this.bench.position.set(.4, 0, .15); g.add(this.bench);
    const top = new THREE.Mesh(new THREE.BoxGeometry(5.4, .18, 2.4), kit.material('wood', '#6c4b38')); top.position.y = 1.1; this.bench.add(top);
    for (const [x,z] of [[-2.25,-.9],[2.25,-.9],[-2.25,.9],[2.25,.9]]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(.16,1.1,.16),kit.material('wood','#3c2c25'));leg.position.set(x,.55,z);this.bench.add(leg); }

    this.watch = new PocketWatch(kit); this.watch.root.position.set(.1, 1.25, .2); this.bench.add(this.watch.root);
    this.apprentice = new Apprentice(kit); this.apprentice.group.position.set(-.1,0,2.1); this.apprentice.group.rotation.y = Math.PI; g.add(this.apprentice.group);

    // Mentor is intentionally paper-light: a recollection with no physical body.
    this.mentor = new THREE.Group(); this.mentor.position.set(2.3, .2, -.7); g.add(this.mentor);
    const mentorBody = new THREE.Mesh(new THREE.PlaneGeometry(1.05,2.2),new THREE.MeshBasicMaterial({color:'#ffe0a3',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending})); mentorBody.position.y=1.25; this.mentor.add(mentorBody);
    const mentorGlow = new THREE.PointLight('#ffd47b',0,10,2); mentorGlow.position.set(0,1.4,.1); this.mentor.add(mentorGlow); this.mentor.userData = { body:mentorBody, light:mentorGlow };

    this.fragments = [];
    for (let i=0;i<46;i++) {
      const type=i%4; const node=type===0?kit.gear({teeth:10+(i%5)*2,radius:.18+(i%4)*.06}):type===1?kit.blueprint({width:.42,height:.3}):new THREE.Mesh(new THREE.BoxGeometry(.12+(i%3)*.05,.08,.08),kit.material(type===2?'brass':'paper',type===2?'#b98a43':'#e6d9bc'));
      const whole=new THREE.Object3D(); whole.position.set(-2.25+(i%10)*.5,1.25+(i%4)*.18,-.5+(i%5)*.33); whole.rotation.set(0,0,(i%6)*.2); whole.scale.setScalar(type===1?.7:1);
      const broken=whole.clone(); broken.position.add(new THREE.Vector3(-5+(i*13%10),-2+(i*17%7),-2-(i*7%8))); broken.rotation.set(i*.8,i*.4,i*1.1); broken.scale.multiplyScalar(.2+(i%5)*.12);
      node.position.copy(broken.position);node.quaternion.copy(broken.quaternion);node.scale.copy(broken.scale);g.add(node);
      this.reverse.register(node,{broken:TimeReversalSystem.state(broken),whole:TimeReversalSystem.state(whole),delay:(i%15)*.022,duration:.48,spin:(i%2?1:-1)*(1+i%3)}); this.fragments.push(node);
    }

    this.redThread = kit.redThread([new THREE.Vector3(-.2,1.3,.45),new THREE.Vector3(.8,1.55,.2),new THREE.Vector3(2.25,1.45,-.6)]); this.redThread.visible=false;g.add(this.redThread);
    this.timeLight = new THREE.PointLight('#ffd47b',0,16,2); this.timeLight.position.set(.2,1.5,.5);g.add(this.timeLight);
  }

  update(p,time) {
    const reconstruct=win(p,.02,.57), conversation=win(p,.25,.68), resist=win(p,.58,.84), collapse=win(p,.82,1);
    this.reverse.set(reconstruct*(1-collapse));
    this.watch.setTime(p,.38+conversation*.62);
    this.apprentice.setPose(resist>.02?'holdWatch':'repair',time,resist);
    this.apprentice.group.position.set(-.1,0,2.1-resist*.7); this.apprentice.group.rotation.y=Math.PI-.16*resist;
    // Hand holds the real watch anchor while trying to stop the hour.
    if (resist>.02) { this.watch.root.updateMatrixWorld(true);this.apprentice.group.updateMatrixWorld(true);this.watch.root.getWorldPosition(this.watchWorld);this.apprentice.watchAnchor.getWorldPosition(this.handWorld);this.contactDelta.subVectors(this.watchWorld,this.handWorld);this.apprentice.group.position.add(this.contactDelta); }
    this.mentor.userData.body.material.opacity=conversation*(1-collapse)*.58;this.mentor.userData.light.intensity=conversation*(1-collapse)*2.4;this.mentor.position.y=.2+Math.sin(time*.7)*.06;
    this.redThread.visible=resist>.18; this.redThread.material.opacity=resist*(1-collapse);
    this.timeLight.intensity=conversation*2.5+resist*3.5; this.timeLight.position.copy(this.watch.root.position);
    this.debugState = {
      progress: p,
      reconstruction: reconstruct * (1 - collapse),
      redThreadVisible: this.redThread.visible,
      mentorOpacity: this.mentor.userData.body.material.opacity,
      finiteFragments: this.fragments.every((node) => Number.isFinite(node.position.x) && Number.isFinite(node.position.y) && Number.isFinite(node.position.z))
    };
    const fov=applyShot(this.experience.camera.instance,p,this._cameraPosition,this._cameraLook);
    this.experience.camera.setView(this._cameraPosition,this._cameraLook,0,fov);
    this.experience.setSky('#18263c',new THREE.Fog('#31455a',6,35));
    this.experience.setLights({hemi:.45,key:.55,rim:.5,accent:{pos:[.1,1.5,.5],intensity:this.timeLight.intensity,color:'#ffd47b'}});
  }
}
