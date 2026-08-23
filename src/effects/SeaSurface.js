import * as THREE from 'three';

const vertex = /* glsl */`
  uniform float uTime;
  uniform float uStorm;
  varying vec2 vUv;
  varying float vWave;
  void main(){
    vUv=uv;
    vec3 p=position;
    float longWave=sin(p.x*.22+uTime*.72)*.18+sin(p.z*.31-uTime*.54)*.12;
    float chop=sin(p.x*.92+p.z*.63+uTime*1.7)*.045;
    float height=(longWave+chop)*(1.0+uStorm*2.5);
    p.y+=height;vWave=height;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
  }
`;
const fragment = /* glsl */`
  uniform float uStorm;
  uniform float uDawn;
  varying vec2 vUv;
  varying float vWave;
  void main(){
    vec3 deep=vec3(.018,.11,.16), harbor=vec3(.07,.34,.40), sunrise=vec3(.76,.36,.21);
    vec3 c=mix(deep,harbor,.42+vUv.y*.35);
    c=mix(c,sunrise,uDawn*(.12+vUv.y*.2));
    c=mix(c,deep,uStorm*.5);
    float foam=smoothstep(.18,.38,abs(vWave))*(.18+uStorm*.35);
    c+=foam*vec3(.65,.78,.72);
    gl_FragColor=vec4(c,.94);
  }
`;
export class SeaSurface {
  constructor(){
    this.material=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uStorm:{value:0},uDawn:{value:0}},vertexShader:vertex,fragmentShader:fragment,transparent:true,side:THREE.DoubleSide});
    this.mesh=new THREE.Mesh(new THREE.PlaneGeometry(78,68,110,110),this.material);this.mesh.rotation.x=-Math.PI/2;this.mesh.position.y=-.85;
  }
  update(time,storm,dawn,tide){this.material.uniforms.uTime.value=time;this.material.uniforms.uStorm.value=storm;this.material.uniforms.uDawn.value=dawn;this.mesh.position.y=tide;}
}
