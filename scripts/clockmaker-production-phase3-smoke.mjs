import puppeteer from 'puppeteer';
import { mkdir } from 'node:fs/promises';

const url=process.env.CLOCKMAKER_PRODUCTION_URL||'http://localhost:4173/stories/clockmaker/production/?dpr=1&reduced=0';
const chapter=3;
const local=[0,.25,.5,.75,1];
const labels=['00-broken','25-reconstruction','50-memory','75-contact','100-collapse'];
const out='stories/clockmaker/visual-baselines/candidates/remembered-hour';
const browser=await puppeteer.launch({headless:'new',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage();await page.setViewport({width:1100,height:700,deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto(url,{waitUntil:'networkidle0',timeout:60000});await page.waitForFunction(()=>Boolean(window.__clockmakerProduction),{timeout:30000});const max=await page.evaluate(()=>document.documentElement.scrollHeight-window.innerHeight);await mkdir(out,{recursive:true});const samples=[];
for(let i=0;i<local.length;i++){const global=(chapter+local[i])/6;await page.evaluate(y=>window.scrollTo(0,y),Math.round(max*global));await new Promise(r=>setTimeout(r,300));const state=await page.evaluate(()=>window.__clockmakerProduction.scenes[3].debugState);samples.push(state);await page.screenshot({path:`${out}/${labels[i]}.png`});}
for(let i=local.length-1;i>=0;i--){const global=(chapter+local[i])/6;await page.evaluate(y=>window.scrollTo(0,y),Math.round(max*global));await new Promise(r=>setTimeout(r,150));const state=await page.evaluate(()=>window.__clockmakerProduction.scenes[3].debugState);if(!state?.finite)errors.push(`non-finite fragment state at reverse ${local[i]}`);}
if(!samples.every(s=>s?.finite))errors.push('non-finite fragment state during forward scrub');if(samples[0]?.redThreadVisible)errors.push('red thread visible at broken milestone');if(samples[2]?.mentorOpacity<=.05)errors.push('mentor missing at memory milestone');if(!samples[3]?.redThreadVisible)errors.push('red thread missing at contact milestone');await browser.close();console.log('remembered-hour samples:',JSON.stringify(samples));if(errors.length){console.error(errors.join('\n'));process.exit(1)}console.log('clockmaker production phase 3 smoke: clean');
