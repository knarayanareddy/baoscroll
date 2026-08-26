import { CLOCKMAKER_CUES } from './ClockmakerNarrationCues.js';
export class ClockmakerNarrationController {
  constructor(audio){this.audio=audio;this.enabled=false;this.paused=false;this.active=null;this.narrated=-1;this.chapter=0;this.caption=document.getElementById('clock-caption');this.live=document.getElementById('clock-live');}
  setEnabled(on){this.enabled=on;if(!on)this.stop();}
  setPaused(on){this.paused=on;if(this.active){if(on)this.active.pause();else this.active.play().catch(()=>{});}}
  update(chapter){this.chapter=chapter;if(this.enabled&&!this.paused&&this.narrated!==chapter)this.playChapter(chapter);}
  playChapter(chapter){const cue=CLOCKMAKER_CUES[chapter];if(!cue)return;this.stop();this.narrated=chapter;const [file,text]=cue;const el=new Audio(`./audio/narration/clockmaker/${file}`);el.volume=.92;el.addEventListener('ended',()=>this.finish());el.addEventListener('error',()=>this.finish());this.active=el;this.audio.setNarrationDuck(true);this.setCaption(text,true);el.play().catch(()=>this.finish());}
  stop(){if(this.active)this.active.pause();this.finish();}
  finish(){this.active=null;this.audio.setNarrationDuck(false);this.setCaption('',false);}
  setCaption(text,on){if(this.caption){this.caption.textContent=text;this.caption.classList.toggle('active',on);}if(this.live)this.live.textContent=text;}
}
