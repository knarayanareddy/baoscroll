import * as THREE from 'three';

export class MasterClock {
  constructor(kit) {
    this.root = new THREE.Group();
    this.dial = kit.clockFace({ radius:4.2, color:'#eee1bd', handColor:'#b33432' }); this.root.add(this.dial);
    this.housing = new THREE.Mesh(new THREE.CylinderGeometry(4.65,4.65,.5,40), kit.material('brass','#8b632c')); this.housing.position.z=-.28; this.root.add(this.housing);
    this.sealedHand = new THREE.Group(); const hand = new THREE.Mesh(new THREE.BoxGeometry(.12,3.3,.1),kit.material('brass','#b98a43'));hand.position.y=1.65;this.sealedHand.add(hand);this.sealedHand.position.z=.2;this.root.add(this.sealedHand);
    this.releaseAnchor = new THREE.Object3D();this.releaseAnchor.position.set(0,3.25,.24);this.sealedHand.add(this.releaseAnchor);
    this.releaseAnchorLeft = new THREE.Object3D();this.releaseAnchorLeft.position.set(-.16,3.12,.24);this.sealedHand.add(this.releaseAnchorLeft);
    this.releaseAnchorRight = new THREE.Object3D();this.releaseAnchorRight.position.set(.16,3.12,.24);this.sealedHand.add(this.releaseAnchorRight);
    this.redHand = new THREE.Mesh(new THREE.BoxGeometry(.11,3.55,.12),kit.material('thread','#b33432'));this.redHand.position.set(0,1.78,.28);this.redHand.visible=false;this.root.add(this.redHand);
    this.threadAnchor = new THREE.Object3D();this.threadAnchor.position.set(0,3.5,.3);this.redHand.add(this.threadAnchor);
    this.threadAnchorLeft = new THREE.Object3D();this.threadAnchorLeft.position.set(-.14,3.36,.3);this.redHand.add(this.threadAnchorLeft);
    this.threadAnchorRight = new THREE.Object3D();this.threadAnchorRight.position.set(.14,3.36,.3);this.redHand.add(this.threadAnchorRight);
    this.light=new THREE.PointLight('#ffd47b',0,24,2);this.root.add(this.light);
  }
  setFinalHour(progress) { this.sealedHand.rotation.z = -progress*Math.PI*.9; this.redHand.visible=progress>.48; this.redHand.rotation.z=(1-progress)*-.4;this.light.intensity=Math.max(0,(progress-.48)*5); }
}
