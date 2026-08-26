import * as THREE from 'three';

export class PocketWatch {
  constructor(kit) {
    this.root = new THREE.Group();
    const caseRing = new THREE.Mesh(new THREE.TorusGeometry(.32,.055,8,24), kit.material('brass','#b98a43')); this.root.add(caseRing);
    this.face = kit.clockFace({ radius:.28, color:'#f0e4c4', handColor:'#b33432' }); this.face.scale.setScalar(.82); this.face.position.z=.04; this.root.add(this.face);
    this.crown = new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.14,8), kit.material('brass','#8b632c')); this.crown.position.y=.39; this.root.add(this.crown);
    this.light = new THREE.PointLight('#ffd47b',0,5,2); this.root.add(this.light);
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ color:'#ffe9ad', transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending })); this.glow.scale.setScalar(1.2); this.root.add(this.glow);
  }
  setTime(progress, power = 1) {
    this.face.userData.minute.rotation.z = -progress * Math.PI * 2;
    this.face.userData.hour.rotation.z = -progress * Math.PI / 6;
    this.light.intensity = power * 1.4;
    this.glow.material.opacity = power * .45;
  }
}
