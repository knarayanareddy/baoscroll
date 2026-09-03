// Standalone benchmark harness: mounts only Chapter IV (Thunder Orchard)
// at full height for Phase 3 QA (vertical climb, fruit contact, lightning,
// rain transfer, reversible state).
import { ShellExperience } from '../src/core/ShellExperience.js';
import { ShellAudio } from '../src/core/ShellAudio.js';
import { ThunderOrchardScene } from '../src/scenes/ThunderOrchardScene.js';
import { CHAPTERS } from '../src/utils/constants.js';

const c4 = CHAPTERS[3];
const sec = document.createElement('section');
sec.style.height = '400vh';
document.body.appendChild(sec);

async function boot() {
  const experience = new ShellExperience({ canvas: document.getElementById('webgl'), sections: [sec] });
  experience.registerScenes([ThunderOrchardScene]);
  experience.audio = new ShellAudio();
  experience.onChapterChange = () => {};
  await experience.init();
  const beat = document.getElementById('beat');
  (function gsapTick() {
    requestAnimationFrame(() => {
      const l = experience.local;
      const b = c4.beats.find(([a, b2]) => l >= a && l < b2);
      if (b) beat.textContent = `${b[0].toFixed(2)}–${b[1].toFixed(2)}  ${b[2]}`;
      requestAnimationFrame(gsapTick);
    });
  })();
  window.__skyGardenBench = {
    get local() { return experience.local; },
    get drawCalls() { return experience._drawCalls; },
    get triangles() { return experience._triangles; },
    scrub(p) { window.scrollTo(0, Math.round((document.documentElement.scrollHeight - innerHeight) * Math.min(1, Math.max(0, p)))); }
  };
}

boot().catch((e) => console.error('benchmark failed:', e));
