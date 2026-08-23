import './styles/global.css';
import './styles/interface.css';
import './styles/responsive.css';
import 'lenis/dist/lenis.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Experience } from './core/Experience.js';
import { CHAPTERS } from './utils/constants.js';
import { webglAvailable, isTouch } from './utils/device.js';

gsap.registerPlugin(ScrollTrigger);

const $ = (id) => document.getElementById(id);

// which chapters sit on light vs dark backdrops (for UI contrast)
const CHAPTER_TONE = ['light', 'light', 'dark', 'light', 'dark', 'light'];

async function boot() {
  const loader = $('loader');

  if (!webglAvailable()) {
    loader.classList.add('done');
    $('no-webgl').hidden = false;
    return;
  }

  // scroll track heights come from the chapter table
  const sections = CHAPTERS.map((c) => {
    const el = document.querySelector(`section[data-chapter="${c.index}"]`);
    el.style.height = `${c.vh}vh`;
    return el;
  });

  const enso = document.querySelector('.enso-stroke');
  const experience = new Experience({ canvas: $('webgl'), sections });
  // handle for the headless smoke test in scripts/smoke.mjs
  window.__experience = experience;
  await experience.init((p) => {
    enso.style.strokeDashoffset = String(289 * (1 - p));
  });

  // ---- reveal the stage ----
  loader.classList.add('done');
  const ui = $('ui');
  ui.hidden = false;
  const hint = $('scroll-hint');
  setTimeout(() => hint.classList.add('show'), 600);

  $('title-card').removeAttribute('aria-hidden'); // the h1 must stay readable to AT

  /* ---------- chapter indicator + navigation ---------- */

  const nav = $('chapter-nav');
  const navButtons = CHAPTERS.map((c) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Go to chapter ${c.index + 1}: ${c.title}`);
    b.innerHTML = `<span class="tip">${c.numeral} · ${c.title}</span>`;
    b.addEventListener('click', () => experience.scroll.scrollToChapter(c.index));
    nav.appendChild(b);
    return b;
  });

  experience.onChapterChange = (i) => {
    const c = CHAPTERS[i];
    $('chapter-num').textContent = c.numeral;
    $('chapter-name').textContent = c.title;
    $('chapter-live').textContent = `Chapter ${i + 1} — ${c.title}. ${c.caption}`;
    navButtons.forEach((b, bi) => b.classList.toggle('active', bi === i));
    ui.classList.toggle('on-dark', CHAPTER_TONE[i] === 'dark');
    ui.classList.toggle('on-light', CHAPTER_TONE[i] === 'light');
  };
  experience.onChapterChange(0);

  /* ---------- progress line + hint + final card state ---------- */

  const fill = $('progress-fill');
  const finalCard = $('final-card');
  gsap.ticker.add(() => {
    const g = experience.scroll.progress;
    fill.style.transform = `scaleX(${g})`;
    if (g > 0.008) hint.classList.add('gone');
    const showFinal = g > 0.988 || experience.exploreMode;
    finalCard.classList.toggle('active', showFinal);
    finalCard.setAttribute('aria-hidden', showFinal ? 'false' : 'true');
  });

  /* ---------- title painted in by scroll (chapter 1) ---------- */

  const titleMain = $('title-main');
  const chars = [];
  const words = titleMain.textContent.split(' ');
  titleMain.textContent = '';
  words.forEach((word, wi) => {
    const wordSpan = document.createElement('span');
    wordSpan.className = 'word';
    for (const ch of word) {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = ch;
      wordSpan.appendChild(span);
      chars.push(span);
    }
    titleMain.appendChild(wordSpan);
    if (wi < words.length - 1) {
      const gap = document.createElement('span');
      gap.className = 'char space';
      gap.innerHTML = '&nbsp;';
      titleMain.appendChild(gap);
      chars.push(gap);
    }
  });

  gsap
    .timeline({
      scrollTrigger: { trigger: sections[0], start: '8% top', end: '55% top', scrub: true }
    })
    .to('.title-eyebrow', { opacity: 0.75, duration: 0.12 })
    .to(
      chars,
      { opacity: 1, y: 0, filter: 'blur(0px)', stagger: 0.012, duration: 0.34, ease: 'none' },
      0.06
    )
    .to('.title-sub', { opacity: 0.9, duration: 0.14 }, '>-0.08')
    .to({}, { duration: 0.18 })
    .to('#title-card', { opacity: 0, duration: 0.22 });

  /* ---------- river quote (chapter 4) ---------- */

  gsap
    .timeline({
      scrollTrigger: { trigger: sections[3], start: '35% top', end: '80% top', scrub: true }
    })
    .to('#river-quote', { opacity: 1, duration: 0.28 })
    .to('#river-quote', { opacity: 1, duration: 0.4 })
    .to('#river-quote', { opacity: 0, duration: 0.32 });

  /* ---------- closing card (chapter 6) ---------- */

  gsap.to('#final-card', {
    opacity: 1,
    scrollTrigger: { trigger: sections[5], start: '78% bottom', end: '97% bottom', scrub: true }
  });

  /* ---------- controls ---------- */

  const btnSound = $('btn-sound');
  btnSound.addEventListener('click', () => {
    const on = btnSound.getAttribute('aria-pressed') !== 'true';
    btnSound.setAttribute('aria-pressed', String(on));
    btnSound.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
    experience.audio.setEnabled(on);
  });

  const btnPause = $('btn-pause');
  btnPause.addEventListener('click', () => {
    const paused = btnPause.getAttribute('aria-pressed') !== 'true';
    btnPause.setAttribute('aria-pressed', String(paused));
    btnPause.setAttribute('aria-label', paused ? 'Resume ambient animation' : 'Pause ambient animation');
    btnPause.querySelector('.icon-pause').hidden = paused;
    btnPause.querySelector('.icon-play').hidden = !paused;
    experience.setPaused(paused);
  });

  const btnMotion = $('btn-motion');
  btnMotion.setAttribute('aria-pressed', String(experience.reducedMotion));
  btnMotion.addEventListener('click', () => {
    const on = btnMotion.getAttribute('aria-pressed') !== 'true';
    btnMotion.setAttribute('aria-pressed', String(on));
    btnMotion.setAttribute('aria-label', on ? 'Restore full motion' : 'Reduce motion');
    experience.setReducedMotion(on);
  });

  const btnFullscreen = $('btn-fullscreen');
  if (!document.documentElement.requestFullscreen) {
    btnFullscreen.hidden = true;
  } else {
    btnFullscreen.addEventListener('click', () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        btnFullscreen.setAttribute('aria-label', 'Enter fullscreen');
      } else {
        document.documentElement.requestFullscreen();
        btnFullscreen.setAttribute('aria-label', 'Exit fullscreen');
      }
    });
  }

  const replay = () => experience.replay();
  $('btn-replay').addEventListener('click', replay);
  $('btn-replay-final').addEventListener('click', replay);

  const btnExplore = $('btn-explore');
  btnExplore.addEventListener('click', () => {
    if (experience.exploreMode) {
      experience.exitExplore();
      btnExplore.textContent = 'Keep the beacon lit';
    } else {
      experience.enterExplore();
      btnExplore.textContent = 'Return to the story';
    }
  });

  /* ---------- brush-tip cursor (desktop) ---------- */

  if (!isTouch && window.matchMedia('(pointer: fine)').matches) {
    document.body.classList.add('has-cursor');
    const cursor = $('brush-cursor');
    let tx = -100;
    let ty = -100;
    let cx = -100;
    let cy = -100;
    window.addEventListener('pointermove', (e) => {
      tx = e.clientX;
      ty = e.clientY;
    });
    let hotEl = false;
    document.addEventListener('pointerover', (e) => {
      hotEl = !!e.target.closest('button, a');
    });
    gsap.ticker.add(() => {
      cx += (tx - cx) * 0.35;
      cy += (ty - cy) * 0.35;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -30%) rotate(-32deg)`;
      cursor.classList.toggle('grow', hotEl || experience.cursorHot);
    });
  }
}

boot().catch((err) => {
  console.error('Failed to start the story:', err);
  const loader = $('loader');
  if (loader) loader.querySelector('.loader-note').textContent = 'something spilled the ink — please refresh';
});
