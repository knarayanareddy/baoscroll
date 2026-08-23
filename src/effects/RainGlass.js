import * as THREE from 'three';

const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const fragment = `
uniform float uTime; uniform float uStorm; varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
  vec2 uv=vUv; float rain=0.0;
  for(float i=0.0;i<18.0;i++){
    float x=hash(vec2(i,1.7)); float speed=.22+hash(vec2(i,5.4))*.42;
    float y=fract(hash(vec2(i,9.2))-uTime*speed);
    float line=smoothstep(.022,0.0,abs(uv.x-x))*smoothstep(.22,0.0,abs(uv.y-y));
    rain+=line;
  }
  float edge=smoothstep(.0,.12,uv.x)*smoothstep(.0,.12,uv.y)*smoothstep(.0,.12,1.0-uv.x)*smoothstep(.0,.12,1.0-uv.y);
  vec3 glass=mix(vec3(.24,.42,.46),vec3(.72,.86,.84),rain*.65);
  gl_FragColor=vec4(glass,edge*(.06+rain*.32)*uStorm);
}`;
export class RainGlass {
  constructor(width,height){
    this.material=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uStorm:{value:1}},vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:false,side:THREE.DoubleSide});
    this.mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),this.material);
  }
  update(time,storm=1){this.material.uniforms.uTime.value=time;this.material.uniforms.uStorm.value=storm;}
}
