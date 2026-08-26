import puppeteer from 'puppeteer';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const chapter = Number(process.env.CLOCKMAKER_CHAPTER || 0);
const quality = process.env.CLOCKMAKER_QUALITY || 'low';
const baseUrl = process.env.CLOCKMAKER_PRODUCTION_URL || `http://localhost:4173/stories/clockmaker/production/?dpr=1&quality=${quality}`;
const milestone = [0, .25, .5, .75, 1];
const labels = ['00', '25', '50', '75', '100'];
const chapterNames = ['workshop','city','tower','remembered-hour','final-hour','dawn'];
const name = chapterNames[chapter];
const candidateDir = `stories/clockmaker/visual-baselines/candidates/${name}`;
const baselineDir = `stories/clockmaker/visual-baselines/${name}`;
const diffDir = `artifacts/clockmaker-visual-diff/${name}`;
const budget = JSON.parse(await readFile('stories/clockmaker/performance-budgets.json','utf8'))[quality]?.[String(chapter)];
if (!budget) throw new Error(`Missing ${quality} budget for Clockmaker chapter ${chapter}`);

const browser = await puppeteer.launch({ headless:'new', args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--disable-dev-shm-usage'] });
const page = await browser.newPage();
await page.setViewport({ width:1100, height:700, deviceScaleFactor:quality === 'low' ? 1 : 2 });
const problems=[]; page.on('pageerror',e=>problems.push(`pageerror: ${e.message}`)); page.on('console',m=>{if(m.type()==='error')problems.push(`console: ${m.text()}`)}); page.on('requestfailed',r=>problems.push(`request: ${r.url()}`));
await page.goto(baseUrl,{waitUntil:'networkidle0',timeout:60000}); await page.waitForFunction(()=>Boolean(window.__clockmakerProduction),{timeout:30000});
const max=await page.evaluate(()=>document.documentElement.scrollHeight-window.innerHeight); await mkdir(candidateDir,{recursive:true}); await mkdir(diffDir,{recursive:true});
const samples=[];
for(let i=0;i<milestone.length;i++){
  await page.evaluate(y=>window.scrollTo(0,y),Math.round(max*(chapter+milestone[i])/6)); await new Promise(r=>setTimeout(r,300));
  const state=await page.evaluate(index=>{const exp=window.__clockmakerProduction,scene=exp.scenes[index];const particles=(scene.motes?.length||0)+(scene.clockDust?.length||0)+(scene.threadMotes?.length||0)+(scene.unspentHour?.dust?.length||0);return {chapter:exp.activeChapter,debug:scene.debugState,drawCalls:exp.renderer.info.render.calls,triangles:exp.renderer.info.render.triangles,particles};},chapter);
  samples.push(state); await page.screenshot({path:`${candidateDir}/${labels[i]}.png`});
}
for(let i=milestone.length-1;i>=0;i--){await page.evaluate(y=>window.scrollTo(0,y),Math.round(max*(chapter+milestone[i])/6));await new Promise(r=>setTimeout(r,120));const state=await page.evaluate(index=>window.__clockmakerProduction.scenes[index].debugState,chapter);if(state?.finite===false||state?.finiteTreads===false)problems.push(`non-finite state at reverse ${labels[i]}`);}
for(const sample of samples){if(sample.drawCalls>budget.drawCalls)problems.push(`draw calls ${sample.drawCalls} exceed ${budget.drawCalls}`);if(sample.triangles>budget.triangles)problems.push(`triangles ${sample.triangles} exceed ${budget.triangles}`);if(sample.particles>budget.particles)problems.push(`particles ${sample.particles} exceed ${budget.particles}`);}
const mid=samples[2]?.debug||{};
if(chapter===0&&!mid.watchWound)problems.push('Workshop watch did not wind');
if(chapter===1&&!mid.repair)problems.push('City repair contact missing');
if(chapter===2&&!mid.finiteTreads)problems.push('Tower tread state invalid');
if(chapter===3&&!(mid.mentorOpacity>0))problems.push('Mentor memory missing');
if(chapter===4&&!mid.redHand)problems.push('Final hour red hand missing');
if(chapter===5&&!mid.tick)problems.push('Dawn tick missing');
if(existsSync(baselineDir)){
  for(const label of labels){const actual=PNG.sync.read(await readFile(`${candidateDir}/${label}.png`));const expected=PNG.sync.read(await readFile(`${baselineDir}/${label}.png`));if(actual.width!==expected.width||actual.height!==expected.height){problems.push(`baseline dimensions differ for ${label}`);continue;}const diff=new PNG({width:actual.width,height:actual.height});const changed=pixelmatch(expected.data,actual.data,diff.data,actual.width,actual.height,{threshold:.12,includeAA:false})/(actual.width*actual.height);await writeFile(`${diffDir}/${label}.png`,PNG.sync.write(diff));if(changed>.04)problems.push(`${label} visual diff ${(changed*100).toFixed(2)}% exceeds 4%`);else if(changed>.02)console.warn(`${label} visual warning ${(changed*100).toFixed(2)}% exceeds 2%`);}
}
await browser.close(); console.log('clockmaker samples:',JSON.stringify(samples)); if(problems.length){console.error(problems.join('\n'));process.exit(1)} console.log(`clockmaker ${name} smoke: clean`);
