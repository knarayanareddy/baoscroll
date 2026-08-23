// Procedural asset factory. Every texture the experience uses is
// painted on a <canvas> at boot so the project runs with zero
// downloads. Each entry documents its production replacement:
//
//   name        replacement asset                       destination
//   ----------- --------------------------------------- ----------------------------
//   paper       scanned salt-stained cotton rag, 1024px  /public/textures/paper.webp
//   plank       wet dock timber, tileable 1024px         /public/textures/plank.webp
//   brass       oxidised brass sheet, tileable 512px     /public/textures/brass.webp
//   cloud       soft cloud cutout w/ alpha, 512px PNG    /public/textures/cloud.png
//   glow        radial glow sprite, 256px PNG            /public/textures/glow.png
//   inkblot     wet ink blot w/ alpha, 512px PNG         /public/textures/inkblot.png
//   shard       torn paper scrap w/ alpha, 256px PNG     /public/textures/shard.png
//   foam        torn wave-crest foam w/ alpha, 512px     /public/textures/foam.png
//   streak      rain streak, 512x64 PNG                  /public/textures/streak.png
//   salt        salt-bloom stain overlay, tileable 512   /public/textures/salt.png
//   name0..3    handwritten sailor names, 256px PNG      /public/textures/names/
//
// To swap one in, replace the generator body with a TextureLoader load
// (keep the same cache name) — everything downstream is untouched.

import * as THREE from 'three';
import { mulberry32 } from '../utils/math.js';

function canvas(size, h = size) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = h;
  return c;
}

export class AssetLoader {
  constructor() {
    this.cache = new Map();
  }

  get(name) {
    const t = this.cache.get(name);
    if (!t) throw new Error(`AssetLoader: unknown asset "${name}"`);
    return t;
  }

  store(name, canvasEl, { srgb = true, repeat = false } = {}) {
    const tex = new THREE.CanvasTexture(canvasEl);
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    this.cache.set(name, tex);
    return tex;
  }

  async generate(onProgress = () => {}) {
    const tasks = [
      () => this.paper(),
      () => this.plank(),
      () => this.brass(),
      () => this.cloud(),
      () => this.glow(),
      () => this.inkblot(),
      () => this.shard(),
      () => this.foam(),
      () => this.streak(),
      () => this.salt(),
      () => this.name(0, 11),
      () => this.name(1, 29),
      () => this.name(2, 47),
      () => this.name(3, 83)
    ];
    for (let i = 0; i < tasks.length; i++) {
      tasks[i]();
      onProgress((i + 1) / tasks.length);
      // yield so the lamp loader keeps animating
      await new Promise((r) => setTimeout(r, 16));
    }
  }

  // Cotton rag that has lived by the sea: warm fibre, cool salt bloom.
  paper() {
    const c = canvas(512);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f6efdf';
    ctx.fillRect(0, 0, 512, 512);
    const rnd = mulberry32(7);
    for (let i = 0; i < 900; i++) {
      const x = rnd() * 512;
      const y = rnd() * 512;
      const len = 6 + rnd() * 26;
      const ang = (rnd() - 0.5) * 0.9;
      ctx.strokeStyle = `rgba(${164 + rnd() * 40}, ${150 + rnd() * 40}, ${120 + rnd() * 40}, ${0.04 + rnd() * 0.05})`;
      ctx.lineWidth = 0.6 + rnd();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      ctx.stroke();
    }
    // salt bloom: pale cool rings where seawater dried in the fibre
    for (let i = 0; i < 14; i++) {
      const x = rnd() * 512;
      const y = rnd() * 512;
      const r = 30 + rnd() * 90;
      const g = ctx.createRadialGradient(x, y, r * 0.35, x, y, r);
      g.addColorStop(0, 'rgba(226,236,236,0)');
      g.addColorStop(0.78, 'rgba(214,228,230,0.16)');
      g.addColorStop(1, 'rgba(190,206,209,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 512, 512);
    }
    for (let i = 0; i < 2400; i++) {
      ctx.fillStyle = `rgba(116, 106, 86, ${0.02 + rnd() * 0.04})`;
      ctx.fillRect(rnd() * 512, rnd() * 512, 1 + rnd() * 1.6, 1 + rnd() * 1.6);
    }
    return this.store('paper', c, { repeat: true });
  }

  // Dock timber, always slightly wet: long grain plus dark water lines.
  plank() {
    const c = canvas(512);
    const ctx = c.getContext('2d');
    const rnd = mulberry32(19);
    ctx.fillStyle = '#8d6a52';
    ctx.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 3) {
      const shade = 0.06 + Math.abs(Math.sin(y * 0.11 + rnd() * 0.4)) * 0.14;
      ctx.strokeStyle = `rgba(48, 32, 22, ${shade})`;
      ctx.lineWidth = 1 + rnd() * 2.2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(160, y + (rnd() - 0.5) * 9, 340, y + (rnd() - 0.5) * 9, 512, y + (rnd() - 0.5) * 5);
      ctx.stroke();
    }
    // knots
    for (let i = 0; i < 7; i++) {
      const x = rnd() * 512;
      const y = rnd() * 512;
      for (let r = 16; r > 0; r -= 2.4) {
        ctx.strokeStyle = `rgba(40, 26, 18, ${0.05 + (16 - r) * 0.012})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.62, rnd(), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // standing water darkening the low grain
    for (let i = 0; i < 20; i++) {
      const x = rnd() * 512;
      const y = rnd() * 512;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 30 + rnd() * 60);
      g.addColorStop(0, 'rgba(24,32,34,0.22)');
      g.addColorStop(1, 'rgba(24,32,34,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 512, 512);
    }
    return this.store('plank', c, { repeat: true });
  }

  // Oxidised brass for the lamp housing, wheel and rails.
  brass() {
    const c = canvas(256);
    const ctx = c.getContext('2d');
    const rnd = mulberry32(53);
    ctx.fillStyle = '#c79a4e';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 240; i++) {
      const x = rnd() * 256;
      const y = rnd() * 256;
      const r = 4 + rnd() * 26;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const verdigris = rnd() < 0.34;
      g.addColorStop(0, verdigris ? 'rgba(104,142,120,0.24)' : 'rgba(247,222,160,0.26)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
    }
    // fine lathe lines
    for (let y = 0; y < 256; y += 2) {
      ctx.strokeStyle = `rgba(80, 56, 20, ${0.03 + rnd() * 0.05})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }
    return this.store('brass', c, { repeat: true });
  }

  cloud() {
    const c = canvas(256);
    const ctx = c.getContext('2d');
    const rnd = mulberry32(21);
    for (let i = 0; i < 9; i++) {
      const x = 40 + rnd() * 176;
      const y = 90 + rnd() * 70;
      const r = 28 + rnd() * 46;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.85)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
    }
    return this.store('cloud', c);
  }

  glow() {
    const c = canvas(128);
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return this.store('glow', c);
  }

  inkblot() {
    const c = canvas(256);
    const ctx = c.getContext('2d');
    const rnd = mulberry32(5);
    for (let i = 0; i < 16; i++) {
      const x = 70 + rnd() * 116;
      const y = 70 + rnd() * 116;
      const r = 18 + rnd() * 58;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(10,14,18,0.92)');
      g.addColorStop(0.7, 'rgba(10,14,18,0.55)');
      g.addColorStop(1, 'rgba(10,14,18,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
    }
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(10,14,18,${0.3 + rnd() * 0.5})`;
      ctx.beginPath();
      ctx.arc(rnd() * 256, rnd() * 256, 1 + rnd() * 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    return this.store('inkblot', c);
  }

  shard() {
    const c = canvas(128);
    const ctx = c.getContext('2d');
    const rnd = mulberry32(31);
    ctx.translate(64, 64);
    ctx.beginPath();
    const points = 11;
    for (let i = 0; i <= points; i++) {
      const a = (i / points) * Math.PI * 2;
      const r = 34 + rnd() * 22;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r * 1.15;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.98)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(150,138,116,0.5)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    return this.store('shard', c);
  }

  // Torn wave-crest foam: a hard-edged top with a lacy, dissolving underside.
  foam() {
    const c = canvas(256, 128);
    const ctx = c.getContext('2d');
    const rnd = mulberry32(67);
    ctx.beginPath();
    ctx.moveTo(0, 128);
    for (let x = 0; x <= 256; x += 8) {
      const crest = 42 + Math.sin(x * 0.05) * 16 + Math.sin(x * 0.14 + 1.7) * 9 + rnd() * 8;
      ctx.lineTo(x, crest);
    }
    ctx.lineTo(256, 128);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 20, 0, 128);
    g.addColorStop(0, 'rgba(255,255,255,0.96)');
    g.addColorStop(0.45, 'rgba(240,250,248,0.6)');
    g.addColorStop(1, 'rgba(220,240,238,0)');
    ctx.fillStyle = g;
    ctx.fill();
    // spray droplets flung off the crest
    for (let i = 0; i < 170; i++) {
      const x = rnd() * 256;
      const y = 18 + rnd() * 70;
      ctx.fillStyle = `rgba(255,255,255,${0.16 + rnd() * 0.6})`;
      ctx.beginPath();
      ctx.arc(x, y, 0.6 + rnd() * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    return this.store('foam', c);
  }

  streak() {
    const c = canvas(256, 32);
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 256, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.2, 'rgba(255,255,255,0.7)');
    g.addColorStop(0.8, 'rgba(255,255,255,0.7)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 8, 256, 14);
    return this.store('streak', c);
  }

  // Overlay stain multiplied onto tower and hull surfaces.
  salt() {
    const c = canvas(256);
    const ctx = c.getContext('2d');
    const rnd = mulberry32(97);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 60; i++) {
      const x = rnd() * 256;
      const y = rnd() * 256;
      const r = 8 + rnd() * 52;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const rust = rnd() < 0.4;
      g.addColorStop(0, rust ? 'rgba(150,86,62,0.22)' : 'rgba(118,132,132,0.18)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
    }
    // vertical weather runs
    for (let i = 0; i < 26; i++) {
      const x = rnd() * 256;
      ctx.strokeStyle = `rgba(126,116,102,${0.05 + rnd() * 0.09})`;
      ctx.lineWidth = 1 + rnd() * 4;
      ctx.beginPath();
      ctx.moveTo(x, rnd() * 90);
      ctx.lineTo(x + (rnd() - 0.5) * 12, 140 + rnd() * 116);
      ctx.stroke();
    }
    return this.store('salt', c, { repeat: true });
  }

  // Handwritten sailor names — looping cursive built from bezier
  // strokes. Deliberately not legible words, so no unintended meaning.
  name(slot, seed) {
    const c = canvas(256, 96);
    const ctx = c.getContext('2d');
    const rnd = mulberry32(seed);
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    let x = 18;
    const baseline = 60;
    const letters = 6 + Math.floor(rnd() * 4);
    ctx.lineWidth = 3 + rnd() * 2;
    ctx.beginPath();
    ctx.moveTo(x, baseline);
    for (let i = 0; i < letters; i++) {
      const w = 16 + rnd() * 14;
      const h = 16 + rnd() * 26;
      const up = i === 0 || rnd() < 0.28 ? h * 1.5 : h;
      ctx.bezierCurveTo(x + w * 0.2, baseline - up, x + w * 0.8, baseline - up * 0.4, x + w, baseline - (rnd() - 0.5) * 6);
      x += w;
    }
    ctx.stroke();
    // the crossing stroke and the full stop of a signature
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(22, baseline + 12);
    ctx.quadraticCurveTo(x * 0.6, baseline + 20, x - 6, baseline + 10);
    ctx.stroke();
    return this.store(`name${slot}`, c);
  }
}
