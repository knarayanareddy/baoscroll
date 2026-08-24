// Screenshot comparison harness. Run the first approved capture with
// VISUAL_UPDATE=1 to create committed baselines, then run normally in CI.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const baselineDir = 'visual-baselines';
const candidateDir = 'shots';
const diffDir = 'artifacts/visual-diff';
const threshold = Number(process.env.VISUAL_PIXEL_THRESHOLD || 0.035);
const update = process.env.VISUAL_UPDATE === '1';

if (!existsSync(candidateDir)) {
  throw new Error(`No candidate screenshots in ${candidateDir}. Run SMOKE_SHOTS=1 npm run smoke first.`);
}
await mkdir(diffDir, { recursive: true });
const candidates = (await readdir(candidateDir)).filter((file) => file.endsWith('.png')).sort();
if (!candidates.length) throw new Error('No PNG milestone screenshots found.');

if (update) {
  await mkdir(baselineDir, { recursive: true });
  for (const file of candidates) await writeFile(join(baselineDir, file), await readFile(join(candidateDir, file)));
  console.log(`visual baselines updated: ${candidates.length} frames`);
  process.exit(0);
}

if (!existsSync(baselineDir)) {
  throw new Error(`Missing ${baselineDir}. Capture approved frames with VISUAL_UPDATE=1.`);
}

let failed = 0;
for (const file of candidates) {
  const baseline = join(baselineDir, file);
  if (!existsSync(baseline)) throw new Error(`Missing baseline: ${baseline}`);
  const actual = PNG.sync.read(await readFile(join(candidateDir, file)));
  const expected = PNG.sync.read(await readFile(baseline));
  if (actual.width !== expected.width || actual.height !== expected.height) throw new Error(`Dimension mismatch for ${file}`);
  const diff = new PNG({ width: actual.width, height: actual.height });
  const pixels = pixelmatch(expected.data, actual.data, diff.data, actual.width, actual.height, { threshold: 0.12, includeAA: false });
  const ratio = pixels / (actual.width * actual.height);
  await writeFile(join(diffDir, file), PNG.sync.write(diff));
  console.log(`${file}: ${(ratio * 100).toFixed(3)}% changed`);
  if (ratio > threshold) failed++;
}
if (failed) throw new Error(`${failed} visual milestone frame(s) exceed ${(threshold * 100).toFixed(2)}% pixel diff threshold.`);
console.log('visual regression: clean');
