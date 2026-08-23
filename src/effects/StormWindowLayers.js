import * as THREE from 'three';

function washTexture(seed) {
  const c=document.createElement('canvas');c.width=768;c.height=256;const x=c.getContext('2d');
  x.clearRect(0,0,c.width,c.height);
  for(let i=0;i<42;i++){const n=Math.sin((i+seed)*91.7)*.5+.5;const px=(i*83+seed*37)%820-30,py=(i*47+seed*19)%270-10;const w=90+n*210,h=18+n*55;const g=x.createRadialGradient(px,py,0,px,py,w);g.addColorStop(0,i%3?'rgba(9,22,34,.72)':'rgba(31,56,70,.62)');g.addColorStop(1,'rgba(6,14,23,0)');x.fillStyle=g;x.save();x.translate(px,py);x.rotate((n-.5)*.35);x.fillRect(-w,-h,w*2,h*2);x.restore();}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
export class StormWindowLayers {
  constructor(){this.root=new THREE.Group();this.layers=[];
    for(let i=0;i<5;i++){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(19-i*.8,6.6+i*.5),new THREE.MeshBasicMaterial({map:washTexture(i+3),transparent:true,depthWrite:false,opacity:.78-i*.07}));mesh.position.set((i-2)*.5,4.1+i*.55,-10-i*1.15);mesh.userData={x:mesh.position.x,y:mesh.position.y,side:i%2?-1:1};this.root.add(mesh);this.layers.push(mesh);}
  }
  update(time,open){this.layers.forEach((layer,i)=>{const drift=Math.sin(time*(.16+i*.04)+i)*.35;layer.position.x=layer.userData.x+drift+layer.userData.side*open*(2.1+i*.45);layer.position.y=layer.userData.y+open*(i%2?.4:-.25);layer.material.opacity=(.78-i*.07)*(1-open*.94);});}
}
