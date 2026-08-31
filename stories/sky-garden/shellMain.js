// Unified six-chapter shell boot (Phase 4): one canvas, six native scroll
// sections, router, shared camera, transitions, narration, smoke hooks.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ShellExperience } from './src/core/ShellExperience.js';
import { ShellAudio } from './src/core/ShellAudio.js';
import { NarrationController } from './src/core/NarrationController.js';
import { NARRATION_CUES } from './src/data/narrationCues.js';
import { CHAPTERS } from './src/utils/constants.js';
import { webglAvailable } from './src/utils/webgl.js';
import { PlaceholderScene } from './src/scenes/PlaceholderScene.js';
import { ThunderOrchardScene } from './src/scenes/ThunderOrchardScene.js';
import { WindMazeScene } from './src/scenes/WindMazeScene.js';
import { FirstSeedScene } from './src/scenes/FirstSeedScene.js';
import { SunTerraceScene } from './src/scenes/SunTerraceScene.js';

gsap.registerPlugin(ScrollTrigger);
const $ = (id) => document.getElementById(id);

// Phase 5 replaces placeholders in plan order: III -> V -> II -> I -> VI.
const SCENES = [
  PlaceholderScene,      // I  Dry Cloud Nursery   (placeholder)
  FirstSeedScene,        // II First Seed          (Phase 5 — built)
  WindMazeScene,         // III Wind Maze          (Phase 5 — built)
  ThunderOrchardScene,   // IV Thunder Orchard     (Phase 3 benchmark — mounted)
  SunTerraceScene,       // V  Garden Meets the Sun (Phase 5 — built)
  PlaceholderScene       // VI Rain Returns        (placeholder)
];

async function boot() {
  const loader = $('loader');
  if (!webglAvailable()) {
    loader.classList.add('done');
    $('no-webgl').hidden = false;
    return;
  }
  const sections = CHAPTERS.map((c) => document.querySelector(`section[data-chapter="${c.index}"]`));
  sections.forEach((s, i) => { s.style.height = '160vh'; }); // 6 sections, scroll track

  const experience = new ShellExperience({ canvas: $('webgl'), sections });
  experience.registerScenes(SCENES);
  await experience.init((p) => loader.classList.add('done'));
  experience.audio = new ShellAudio();
  const narration = new NarrationController(experience.audio, { cues: NARRATION_CUES });

  experience.onChapterChange = (i) => {
    const c = CHAPTERS[i];
    $('chapter-num').textContent = c.numeral;
    $('chapter-name').textContent = c.title;
    $('chapter-live').textContent = `Chapter ${i + 1} — ${c.title}. ${c.proposition}.`;
  };

  const fill = $('progress-fill');
  gsap.ticker.add(() => {
    fill.style.transform = `scaleX(${experience.global || 0})`;
  });

  // ---- controls ----
  $('btn-sound').addEventListener('click', (e) => {
    const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', String(on));
    experience.audio.setEnabled(on);
  });
  $('btn-voice').addEventListener('click', (e) => {
    const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', String(on));
    e.currentTarget.setAttribute('aria-label', on ? 'Turn narration off' : 'Turn narration on');
    narration.setEnabled(on);
    if (on) narration.startAtCurrentChapter();
  });
  $('btn-pause').addEventListener('click', (e) => {
    const p = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', String(p));
    experience.setPaused(p);
    narration.setPaused(p);
  });
  $('btn-replay').addEventListener('click', () => experience.scrollToChapter(0));

  // narration follows chapter changes (chapter-addressed cues)
  const origChange = experience.onChapterChange;
  experience.onChapterChange = (i) => {
    origChange(i);
    narration.update(i, experience.local);
  };

  // ---- smoke hooks (scene-logic + browser smoke) ----
  window.__skyGarden = {
    get activeChapter() { return experience.activeChapter; },
    get local() { return experience.local; },
    get quality() { return experience.quality; },
    get drawCalls() { return experience._drawCalls; },
    get triangles() { return experience._triangles; },
    scenes: experience.sceneList.map((s, i) => ({ i, name: s.name, built: !!experience.scenes.get(i) })),
    scrub(p) {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, Math.round(total * Math.min(1, Math.max(0, p))));
    }
  };
}

boot().catch((err) => {
  console.error('Failed to start the sky garden:', err);
  const loader = $('loader');
  if (loader) loader.querySelector('.note').textContent = `something spilled the ink — ${err ? err.message : 'unknown error'}`;
});
