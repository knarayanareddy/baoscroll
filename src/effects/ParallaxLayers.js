// Registers objects as drifting parallax layers. True depth parallax
// comes free from the 3D camera; this adds the hand-made wobble —
// slow horizontal drift with wraparound, and a gentle bob so paper
// layers never sit perfectly still.
export class ParallaxLayers {
  constructor() {
    this.layers = [];
  }

  add(object, { drift = 0, wrap = 0, bob = 0, phase = 0 } = {}) {
    this.layers.push({
      object,
      drift,
      wrap,
      bob,
      phase,
      baseX: object.position.x,
      baseY: object.position.y
    });
  }

  update(time, motion = 1) {
    for (const l of this.layers) {
      if (l.drift) {
        let x = l.baseX + time * l.drift * motion;
        if (l.wrap > 0) {
          const half = l.wrap / 2;
          x = ((((x + half) % l.wrap) + l.wrap) % l.wrap) - half;
        }
        l.object.position.x = x;
      }
      if (l.bob) {
        l.object.position.y = l.baseY + Math.sin(time * 0.6 + l.phase) * l.bob * motion;
      }
    }
  }
}
