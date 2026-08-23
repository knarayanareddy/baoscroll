import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Lenis owns wheel smoothing; GSAP's ticker drives Lenis; Lenis feeds
// ScrollTrigger. The WebGL timeline reads `progress` (0..1 across the
// whole story) every frame — scrubbing, not tweening, so reverse
// scrolling simply plays the film backwards.
export class ScrollController {
  constructor(sections) {
    this.sections = sections;
    this.progress = 0;
    this.velocity = 0;

    this.lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      touchMultiplier: 1.5
    });

    this.lenis.on('scroll', (e) => {
      this.progress = e.limit > 0 ? e.scroll / e.limit : 0;
      this.velocity = e.velocity;
      ScrollTrigger.update();
    });

    gsap.ticker.add((time) => {
      this.lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  setGentle(on) {
    // reduced-motion: shorter smoothing tail, still scrubbed
    this.lenis.options.duration = on ? 0.55 : 1.15;
  }

  scrollToChapter(index) {
    const el = this.sections[index];
    if (el) this.lenis.scrollTo(el, { duration: 1.8, offset: 2 });
  }

  toTop() {
    this.lenis.scrollTo(0, { duration: 2.6 });
  }

  stop() {
    this.lenis.stop();
  }

  start() {
    this.lenis.start();
  }
}
