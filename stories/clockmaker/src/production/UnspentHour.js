import * as THREE from 'three';

// The Unspent Hour is a persistent time force, not a single missing hand.
// Every scene mounts the same authored vocabulary—unfinished dial, sealed hand,
// stopped-second dust, fracture shards and blue-ink fog—then sets a chapter mood.
const MOODS = {
  dormant:     { ink:'#253550', brass:'#8a6329', dust:.16, shards:.12, glow:.18, rate:.08 },
  discordant:  { ink:'#243a5a', brass:'#b56b43', dust:.38, shards:.42, glow:.34, rate:.55 },
  hostile:     { ink:'#101c30', brass:'#c16f45', dust:.72, shards:.85, glow:.56, rate:1.25 },
  remembering: { ink:'#32415c', brass:'#e1b66c', dust:.42, shards:.32, glow:.68, rate:.24 },
  releasing:   { ink:'#506078', brass:'#ffd47b', dust:.22, shards:.2, glow:1, rate:.16 },
  resolved:    { ink:'#e1a977', brass:'#ffd47b', dust:.05, shards:.04, glow:.36, rate:.03 }
};

export class UnspentHour {
  constructor(kit, { particleCount = 48, scale = 1 } = {}) {
    this.kit = kit;
    this.root = new THREE.Group();
    this.root.scale.setScalar(scale);
    this.mood = 'dormant'; this.progress = 0; this.time = 0; this.target = null;

    this.dial = kit.clockFace({ radius: .72, face:'#dde0d5', hand:'#b33432' });
    this.root.add(this.dial);
    this.dial.userData.minute.visible = false; // the missing hand is the central wound
    this.sealedHand = new THREE.Group();
    const hand = new THREE.Mesh(new THREE.BoxGeometry(.065,.58,.05), kit.material('brass','#8a6329'));
    hand.position.y=.29; this.sealedHand.add(hand); this.sealedHand.position.z=.08; this.root.add(this.sealedHand);
    this.sealedHand.userData.anchor = new THREE.Object3D(); this.sealedHand.userData.anchor.position.set(0,.58,.1); this.sealedHand.add(this.sealedHand.userData.anchor);

    this.fractures=[];
    for(let i=0;i<12;i++){
      const shard=new THREE.Mesh(new THREE.PlaneGeometry(.035+(i%4)*.02,.28+(i%3)*.09),kit.material('enamel','#d7c5a3'));
      const a=i/12*Math.PI*2; shard.userData={a,base:new THREE.Vector3(Math.cos(a)*.64,Math.sin(a)*.64,.1),phase:i*.63}; shard.position.copy(shard.userData.base); shard.rotation.z=a; this.root.add(shard); this.fractures.push(shard);
    }
    this.dust=[];
    for(let i=0;i<particleCount;i++){
      const mote=new THREE.Mesh(new THREE.PlaneGeometry(.018+(i%4)*.009,.018+(i%3)*.01),new THREE.MeshBasicMaterial({color:'#9eb9d1',transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));
      mote.userData={radius:.4+(i%8)*.1,phase:i*.41,height:(i%7-3)*.08}; this.root.add(mote); this.dust.push(mote);
    }
    this.core=new THREE.Sprite(new THREE.SpriteMaterial({color:'#8aaec9',transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending})); this.core.scale.setScalar(1.5); this.root.add(this.core);
    this.light=new THREE.PointLight('#8aaec9',0,7,2); this.root.add(this.light);
  }

  attachTo(target, offset = new THREE.Vector3()) {
    this.target = target;
    target.add(this.root);
    this.root.position.copy(offset);
    return this;
  }

  setMood(mood) {
    if (!MOODS[mood]) throw new Error(`Unknown Unspent Hour mood: ${mood}`);
    this.mood = mood;
  }

  setProgress(progress) { this.progress = Math.max(0, Math.min(1, progress)); }

  update(time, delta = 0, motion = 1) {
    this.time = time;
    const state = MOODS[this.mood];
    const ink = new THREE.Color(state.ink), brass = new THREE.Color(state.brass);
    this.dial.userData.dial.material.color.copy(ink).lerp(new THREE.Color('#e9dfc0'), .45 - state.dust*.22);
    this.sealedHand.children[0].material.color.copy(brass);
    this.sealedHand.rotation.z = Math.sin(time * state.rate * motion) * (.08 + state.shards*.12) + this.progress * .18;
    this.dial.rotation.z = Math.sin(time * state.rate * .5 * motion) * .025 * state.shards;
    this.fractures.forEach((shard,i)=>{
      const drift=(.12+state.shards*.8)*(1-this.progress*.25);
      const a=shard.userData.a+Math.sin(time*state.rate+i)*drift;
      shard.position.set(Math.cos(a)*(.64+state.shards*.15),Math.sin(a)*(.64+state.shards*.15),.1);
      shard.rotation.z=a+Math.sin(time*state.rate+shard.userData.phase)*.3*state.shards;
      shard.material.color.copy(brass).lerp(ink,.35);
      shard.material.opacity=.15+state.shards*.8;
    });
    this.dust.forEach((mote,i)=>{
      const a=time*state.rate*motion+mote.userData.phase;
      const r=mote.userData.radius+Math.sin(a*1.7)*.08*state.shards;
      mote.position.set(Math.cos(a)*r,Math.sin(a)*r+mote.userData.height,.16);
      mote.rotation.z=a;
      mote.material.opacity=state.dust*(.35+.4*Math.sin(a+i));
    });
    this.core.material.color.copy(brass).lerp(ink,.45);
    this.core.material.opacity=state.glow*(.3+.25*Math.sin(time*.8*motion));
    this.core.scale.setScalar(.9+state.glow*1.7+this.progress*.25);
    this.light.color.copy(brass); this.light.intensity=state.glow*1.35;
    this.root.visible=this.mood !== 'resolved' || this.progress < .92;
    this.debugState={mood:this.mood,progress:this.progress,particleCount:this.dust.length,finite:this.dust.every(m=>Number.isFinite(m.position.x)&&Number.isFinite(m.position.y))};
  }
}
