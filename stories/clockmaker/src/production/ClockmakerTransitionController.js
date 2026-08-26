const TRANSITIONS=['blueprint','grid','fracture','thread','strike'];
export class ClockmakerTransitionController {
  constructor(){this.el=document.getElementById('clock-transition');}
  update(global){const boundaries=[1/6,2/6,3/6,4/6,5/6];let index=-1,strength=0;boundaries.forEach((at,i)=>{const s=Math.max(0,1-Math.abs(global-at)/.018);if(s>strength){strength=s;index=i;}});if(!this.el)return;this.el.dataset.mode=index>=0?TRANSITIONS[index]:'';this.el.style.opacity=String(strength);this.el.style.transform=`rotate(${index===2?45:-15}deg) scale(${1+strength*.18})`;}
}
