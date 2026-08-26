import './style.css';
import { ClockmakerExperience } from './ClockmakerExperience.js';

const canvas = document.getElementById('clockmaker-canvas');
const experience = new ClockmakerExperience(canvas);
window.__clockmaker = experience;
const progress = document.getElementById('progress');
const beat = document.getElementById('beat');
const lines = [
  [0, 'Broken time is not the same as lost time.'],
  [.25, 'The workshop remembers every hand that made it.'],
  [.58, 'But an hour held too tightly cannot remain an hour.'],
  [.84, 'The past returns only long enough to teach the next minute how to begin.']
];
let last = performance.now();
function frame(now) {
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const p = Math.max(0, Math.min(1, window.scrollY / max));
  const delta = Math.min(.05, (now-last)/1000); last=now;
  experience.tick(p, delta); progress.style.transform=`scaleX(${p})`;
  let text=lines[0][1];for(const [at,line] of lines)if(p>=at)text=line;beat.textContent=text;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
