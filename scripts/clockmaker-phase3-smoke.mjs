import puppeteer from 'puppeteer';
import { mkdir } from 'node:fs/promises';

const url = process.env.CLOCKMAKER_URL || 'http://localhost:4173/stories/clockmaker/?dpr=1&reduced=0';
const capture = process.env.CLOCKMAKER_SHOTS !== '0';
const fractions = [0, .25, .5, .75, 1];
const labels = ['00-broken', '25-reconstruction', '50-memory', '75-contact', '100-collapse'];
const problems = [];
const browser = await puppeteer.launch({ headless:'new', args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--disable-dev-shm-usage'] });
const page = await browser.newPage();
await page.setViewport({ width:1100, height:700, deviceScaleFactor:1 });
page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
page.on('console', (message) => { if (message.type() === 'error') problems.push(`console: ${message.text()}`); });
await page.goto(url, { waitUntil:'networkidle0', timeout:60000 });
await page.waitForFunction(() => Boolean(window.__clockmaker), { timeout:30000 });
const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
const forward = [];
if (capture) await mkdir('stories/clockmaker/visual-baselines/candidates', { recursive:true });
for (let i=0;i<fractions.length;i++) {
  await page.evaluate((y) => window.scrollTo(0,y), Math.round(max*fractions[i]));
  await new Promise((resolve) => setTimeout(resolve, 250));
  const state = await page.evaluate(() => window.__clockmaker.rememberedHour.debugState);
  forward.push(state);
  if (capture) await page.screenshot({ path:`stories/clockmaker/visual-baselines/candidates/${labels[i]}.png` });
}
for (let i=fractions.length-1;i>=0;i--) {
  await page.evaluate((y) => window.scrollTo(0,y), Math.round(max*fractions[i]));
  await new Promise((resolve) => setTimeout(resolve, 120));
  const state = await page.evaluate(() => window.__clockmaker.rememberedHour.debugState);
  if (!state?.finiteFragments) problems.push(`non-finite fragment state at reverse ${fractions[i]}`);
}
if (!forward.every((state) => state?.finiteFragments)) problems.push('non-finite fragment state during forward reconstruction');
if (forward[0].redThreadVisible) problems.push('red thread visible at broken workshop milestone');
if (!forward[3].redThreadVisible) problems.push('red thread missing at resistance/contact milestone');
if (forward[2].mentorOpacity <= 0.05) problems.push('mentor memory missing at reconstruction milestone');
await browser.close();
console.log('clockmaker phase 3 samples:', JSON.stringify(forward));
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('clockmaker phase 3 smoke: clean');
