const MIX=[[.16,.1,.18],[.2,.2,.12],[.28,.38,.08],[.08,.12,.32],[.16,.3,.5],[.1,.2,.42]];
export class ClockmakerAudioController {
  constructor(){this.enabled=false;this.paused=false;this.chapter=0;this.duck=1;this.ctx=null;}
  init(){if(this.ctx)return;const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;this.ctx=new Ctx();this.master=this.ctx.createGain();this.master.gain.value=0;this.master.connect(this.ctx.destination);this.tickGain=this.ctx.createGain();this.gearGain=this.ctx.createGain();this.airGain=this.ctx.createGain();this.tickGain.connect(this.master);this.gearGain.connect(this.master);this.airGain.connect(this.master);this.noise=this.noiseBuffer();this.scheduleTick();this.applyMix(0);}
  noiseBuffer(){const b=this.ctx.createBuffer(1,this.ctx.sampleRate*2,this.ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.12;return b;}
  scheduleTick(){setTimeout(()=>{if(this.enabled&&!this.paused)this.tick();this.scheduleTick();},650);}
  tick(){const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='triangle';o.frequency.value=520+this.chapter*25;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.055,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+.15);o.connect(g).connect(this.tickGain);o.start(t);o.stop(t+.18);}
  applyMix(seconds=.6){if(!this.ctx)return;const [tick,gear,air]=MIX[this.chapter];const t=this.ctx.currentTime;this.tickGain.gain.setTargetAtTime(tick,t,seconds);this.gearGain.gain.setTargetAtTime(gear,t,seconds);this.airGain.gain.setTargetAtTime(air,t,seconds);this.master.gain.setTargetAtTime((this.enabled&&!this.paused)? .75*this.duck : 0,t,seconds);}
  setEnabled(on){this.enabled=on;if(on){this.init();this.ctx?.resume();}this.applyMix();}
  setPaused(on){this.paused=on;this.applyMix(.25);}
  setChapter(i){this.chapter=i;this.applyMix();}
  setNarrationDuck(on){this.duck=on?.4:1;this.applyMix(on?.18:.8);}
}
