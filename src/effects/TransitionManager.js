import { chapterRanges, TRANSITION_WIDTH } from '../utils/constants.js';

// Wipes at chapter boundaries. Cover strength is a pure function of
// global scroll progress: a bell that hits exactly 1.0 on the boundary —
// the very frame the active scene index flips — so scene swaps always
// happen under full cover and reverse identically.
//
// The wipes are not all the same. The story descends for three chapters
// and comes back for two, and the transitions say so: the first three
// boundaries close over in progressively colder ink, and the last two
// open in gold and then in dawn. Crossing from the wreck into the lamp
// is the one moment the screen fills with light instead of water, which
// is the turn of the whole piece.
const WIPES = [
  // I -> II   out of the weather and into a lit room
  { color: '#16262e', center: [0.42, 0.52], light: false },
  // II -> III the sea takes the page
  { color: '#0b1a24', center: [0.62, 0.62], light: false },
  // III -> IV under
  { color: '#062430', center: [0.5, 0.8], light: false },
  // IV -> V   he surfaces holding a name: the first light wipe
  { color: '#f1bb63', center: [0.5, 0.42], light: true },
  // V -> VI   the beam sweeps, and morning is already on the other side
  { color: '#f7e2bd', center: [0.36, 0.4], light: true }
];

export class TransitionManager {
  constructor(experience) {
    this.experience = experience;
    this.boundaries = chapterRanges()
      .slice(0, -1)
      .map((r) => r.end);
    this.basePaper = 0;
    this.baseInk = 0;
  }

  update(globalProgress, time) {
    let ink = this.baseInk;
    let active = null;
    const w = TRANSITION_WIDTH;
    for (let i = 0; i < this.boundaries.length; i++) {
      const d = Math.abs(globalProgress - this.boundaries[i]);
      if (d < w) {
        const strength = 1 - d / w;
        if (strength >= ink) {
          ink = strength;
          active = WIPES[i] || WIPES[0];
        }
      }
    }

    if (active) {
      this.experience.ink.material.uniforms.uInkColor.value.set(active.color);
    }
    this.experience.ink.set({
      ink,
      paper: this.basePaper,
      time,
      center: active ? active.center : undefined
    });

    // The lamp's rotation is the handoff for the two light boundaries: a
    // beam sweeps across the screen instead of ink closing over it.
    const beam = document.getElementById('beam-transition');
    if (beam) {
      const sweeping = active && active.light ? ink : 0;
      beam.classList.toggle('active', sweeping > 0.02);
      beam.style.opacity = String(Math.pow(sweeping, 0.55));
      beam.style.transform = `rotate(-18deg) translateX(${((globalProgress * 900) % 160) - 80}%)`;
    }

    this.basePaper = 0;
    this.baseInk = 0;
  }
}
