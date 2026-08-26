// Scrolls the whole story in a headless browser and fails on any console
// error, page error or failed request. Every chapter gets built and
// updated, so a typo in a scene that only appears at 80% scroll still
// gets caught here rather than by a reader.
import puppeteer from 'puppeteer';
import { readFile } from 'node:fs/promises';

// Software GL cannot carry the high tier, so the run is pinned to the low
// one. That still builds every scene and runs every update path.
const URL = (process.env.SMOKE_URL || 'http://localhost:4173/') + '?quality=low';
const SHOTS = process.env.SMOKE_SHOTS === '1';

const problems = [];

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--disable-dev-shm-usage']
});
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 700, deviceScaleFactor: 1 });

page.on('console', (m) => {
  if (m.type() === 'error') problems.push(`console: ${m.text()}`);
});
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('requestfailed', (r) => problems.push(`request: ${r.url()} ${r.failure()?.errorText}`));

function fail(message) {
  problems.push(message);
  console.error(`\n${problems.length} problem(s):`);
  [...new Set(problems)].forEach((p) => console.error('  - ' + p));
  return browser.close().then(() => process.exit(1));
}

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
// software GL is slow: asset generation plus first compile can take a while
try {
  await page.waitForFunction(() => document.getElementById('loader')?.classList.contains('done'), {
    timeout: 180000,
    polling: 500
  });
} catch {
  // the collected page errors say why boot never finished; the timeout does not
  await fail('boot never completed: the loader never reached its done state');
}
if (await page.evaluate(() => !document.getElementById('no-webgl').hidden)) {
  await fail('WebGL unavailable: page fell back to the static story');
}

const height = await page.evaluate(() => document.body.scrollHeight - window.innerHeight);
const steps = Number(process.env.SMOKE_STEPS || 36);
const shotEvery = Number(process.env.SMOKE_SHOT_EVERY || 3);
const chapterSamples = [];
let lastSampledChapter = -1;
for (let i = 0; i <= steps; i++) {
  const y = Math.round((i / steps) * height);
  await page.evaluate((to) => window.scrollTo(0, to), y);
  await new Promise((r) => setTimeout(r, 80));
  const sample = await page.evaluate(() => ({
    chapter: window.__experience?.activeChapter,
    drawCalls: window.__experience?.renderer?.info?.render?.calls ?? null,
    triangles: window.__experience?.renderer?.info?.render?.triangles ?? null
  }));
  if (sample.chapter !== lastSampledChapter) {
    chapterSamples.push({ step: i, ...sample });
    lastSampledChapter = sample.chapter;
  }
  if (SHOTS && i % shotEvery === 0) {
    await new Promise((r) => setTimeout(r, 250));
    await page.screenshot({ path: `shots/${String(i).padStart(2, '0')}.png` });
  }
}
// and back up again: every scene must survive being scrubbed in reverse
for (let i = steps; i >= 0; i -= 2) {
  await page.evaluate((to) => window.scrollTo(0, to), Math.round((i / steps) * height));
  await new Promise((r) => setTimeout(r, 45));
}

const report = await page.evaluate(() => {
  const e = window.__experience;
  if (!e) return null;
  return { chapter: e.activeChapter, built: e.scenes.map((s) => s.built), drawCalls: e.renderer?.info?.render?.calls ?? null };
});

await browser.close();

const budgetFile = process.env.SMOKE_BUDGETS || 'performance-budgets.json';
const budgetConfig = JSON.parse(await readFile(budgetFile, 'utf8'));
const budgets = budgetConfig.smokeLow;
for (const sample of chapterSamples) {
  const budget = budgets[String(sample.chapter)];
  if (!budget) continue;
  if (sample.drawCalls !== null && sample.drawCalls > budget.drawCalls) {
    problems.push(`chapter ${sample.chapter} draw calls ${sample.drawCalls} exceed budget ${budget.drawCalls}`);
  }
  if (sample.triangles !== null && sample.triangles > budget.triangles) {
    problems.push(`chapter ${sample.chapter} triangles ${sample.triangles} exceed budget ${budget.triangles}`);
  }
}

console.log('scene report:', JSON.stringify(report));
console.log('chapter render samples:', JSON.stringify(chapterSamples));
console.log('performance budgets:', budgetFile);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  [...new Set(problems)].forEach((p) => console.error('  - ' + p));
  process.exit(1);
}
console.log('smoke: clean');
