import * as THREE from 'three';

// Painted-workshop atlas: compact, deterministic, and applied as tangible
// bench planes so focal tools are not bare primitives.
export class WorkshopSurfaceAtlas {
  constructor() {
    const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d');
    x.fillStyle='#e6d9bc';x.fillRect(0,0,1024,512);
    const drawGear=(cx,cy,r)=>{x.strokeStyle='#8b632c';x.lineWidth=15;x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.stroke();x.strokeStyle='#c79a4e';x.lineWidth=6;for(let i=0;i<12;i++){const a=i/12*Math.PI*2;x.beginPath();x.moveTo(cx+Math.cos(a)*r*.25,cy+Math.sin(a)*r*.25);x.lineTo(cx+Math.cos(a)*r*.85,cy+Math.sin(a)*r*.85);x.stroke();}};
    drawGear(150,150,80);drawGear(355,145,58);
    x.strokeStyle='#4b3328';x.lineWidth=18;x.beginPath();x.moveTo(530,95);x.lineTo(750,285);x.stroke();x.strokeStyle='#b98942';x.lineWidth=14;x.beginPath();x.moveTo(555,105);x.lineTo(710,242);x.stroke();
    x.strokeStyle='#3a6079';x.lineWidth=7;x.strokeRect(70,310,350,140);x.beginPath();x.arc(245,380,55,0,Math.PI*2);x.stroke();x.strokeStyle='#b33432';x.lineWidth=5;x.beginPath();x.moveTo(245,380);x.lineTo(275,330);x.stroke();
    x.strokeStyle='#a87835';x.lineWidth=10;x.beginPath();x.moveTo(810,100);x.lineTo(920,230);x.lineTo(840,280);x.stroke();
    for(let i=0;i<500;i++){x.fillStyle=`rgba(65,45,31,${.03+(i%4)*.015})`;x.fillRect((i*47)%1024,(i*79)%512,2+(i%5),1);}
    this.texture=new THREE.CanvasTexture(c);this.texture.colorSpace=THREE.SRGBColorSpace;this.cards=[];
    new THREE.TextureLoader().load(new URL('../../assets/tool-atlas.webp', import.meta.url).href,(texture)=>{texture.colorSpace=THREE.SRGBColorSpace;this.texture=texture;this.cards.forEach(card=>{card.material.map=texture;card.material.needsUpdate=true;});});
  }
  toolCard(width=.7,height=.45){const card=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:this.texture,side:THREE.DoubleSide,transparent:true}));this.cards.push(card);return card;}
}
