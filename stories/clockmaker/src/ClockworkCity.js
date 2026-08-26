import * as THREE from 'three';

export class ClockworkCity {
  constructor(kit, { count = 24 } = {}) {
    this.root = new THREE.Group(); this.clocks=[]; this.bridges=[];
    for(let i=0;i<count;i++) {
      const x=(i%6-2.5)*2.1,z=(Math.floor(i/6)-1.5)*2.1;
      const building=new THREE.Mesh(new THREE.BoxGeometry(1.25,.8+(i%3)*.42,1.25),kit.material('paper',i%2?'#c8bda4':'#ddd0b1'));building.position.set(x,building.geometry.parameters.height/2,z);this.root.add(building);
      if(i%3===0){const clock=kit.clockFace({radius:.34,color:'#efe2c4'});clock.position.set(x,building.position.y+.55,z+.64);this.root.add(clock);this.clocks.push({clock,phase:i*.71});}
    }
    this.train=new THREE.Group();const carriage=new THREE.Mesh(new THREE.BoxGeometry(1.3,.5,.48),kit.material('brass','#b98a43'));this.train.add(carriage);this.train.position.set(-6,.3,3);this.root.add(this.train);
  }
  setDisagreement(progress,time) { this.clocks.forEach(({clock,phase})=>{clock.userData.minute.rotation.z=-time*(.4+Math.sin(phase)*.3)-progress*Math.sin(phase)*2;});this.train.position.x=-6+progress*12; }
}
