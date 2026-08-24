import './style.css';
import { ClockmakerExperience } from './ClockmakerExperience.js';
import { GearTowerScene } from './GearTowerScene.js';
const experience=new ClockmakerExperience(document.getElementById('clockmaker-canvas'),GearTowerScene);window.__clockmaker=experience;
const progress=document.getElementById('progress'),beat=document.getElementById('beat');const lines=[[0,'Every tooth locks behind the apprentice.'],[.3,'The pendulum does not wait for a second attempt.'],[.55,'Above the city, time becomes a climb.'],[.86,'At the top, the missing minute hand begins to fracture.']];let last=performance.now();
function frame(now){const max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight),p=Math.max(0,Math.min(1,window.scrollY/max)),dt=Math.min(.05,(now-last)/1000);last=now;experience.tick(p,dt);progress.style.transform=`scaleX(${p})`;let text=lines[0][1];for(const [at,line]of lines)if(p>=at)text=line;beat.textContent=text;requestAnimationFrame(frame);}requestAnimationFrame(frame);
