import * as THREE from 'three';

// Couples transform reconstruction with material reconstruction: enamel cracks
// close, brass warms, blueprint ink returns and fragments gain opacity in the
// same local-progress window. No global time rewinding is required.
export class MaterialTimeReversal {
  constructor(){this.items=[];}
  register(node,{broken,whole,delay=0,duration=.5,brokenColor='#243249',wholeColor='#d9c89d'}={}){const copy=(state)=>({position:state.position.clone(),quaternion:state.quaternion.clone(),scale:state.scale.clone()});this.items.push({node,broken:copy(broken),whole:copy(whole),delay,duration,brokenColor:new THREE.Color(brokenColor),wholeColor:new THREE.Color(wholeColor)});}
  set(progress){this.items.forEach(({node,broken,whole,delay,duration,brokenColor,wholeColor})=>{const p=Math.max(0,Math.min(1,(progress-delay)/duration));node.position.lerpVectors(broken.position,whole.position,p);node.quaternion.slerpQuaternions(broken.quaternion,whole.quaternion,p);node.scale.lerpVectors(broken.scale,whole.scale,p);if(node.material?.color)node.material.color.copy(brokenColor).lerp(wholeColor,p);if(node.material&&'opacity' in node.material)node.material.opacity=.15+p*.85;node.visible=p>.001;});}
}
