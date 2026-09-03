// SkyGardenKit — the shared production foundation (plan Phase 2):
// procedural cloud/felt/kite/rain materials + geometry builders.
// Every plant/flower uses painted or felt/fibre surfaces, never generic
// spheres (plan QA: "Asset and material quality").
import * as THREE from 'three';
import { mulberry32 } from '../utils/math.js';

function tex(draw, size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const PAPER_NOISE = (ctx, s, base, blobs) => {
  ctx.fillStyle = base; ctx.fillRect(0, 0, s, s);
  const rnd = mulberry32(11);
  for (let i = 0; i < blobs; i++) {
    const x = rnd() * s, y = rnd() * s, r = 4 + rnd() * 18;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${0.05 + rnd() * 0.08})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = `rgba(120,100,80,${0.02 + rnd() * 0.03})`;
    ctx.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 2, 1);
  }
};

export class SkyGardenKit {
  constructor(tier = 'medium') {
    this.tier = tier;
    this.mats = new Map();
    this.geos = new Map();
    // ---- textures ----
    this.cloudTex = tex((ctx, s) => { PAPER_NOISE(ctx, s, '#eef2f4', 26); });
    this.cloudDarkTex = tex((ctx, s) => { PAPER_NOISE(ctx, s, '#c9d4dc', 26); });
    this.soilTex = tex((ctx, s) => { PAPER_NOISE(ctx, s, '#b8a98c', 30); });
    this.soilWetTex = tex((ctx, s) => { PAPER_NOISE(ctx, s, '#8d8268', 30); });
    this.feltTex = tex((ctx, s) => {
      const rnd = mulberry32(7);
      ctx.fillStyle = '#f2e9d8'; ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 900; i++) {
        const x = rnd() * s, y = rnd() * s;
        ctx.strokeStyle = `rgba(140,110,80,${0.05 + rnd() * 0.05})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.lineTo(x + (rnd() - 0.5) * 14, y + (rnd() - 0.5) * 14); ctx.stroke();
      }
    });
    this.kiteTex = tex((ctx, s) => {
      ctx.fillStyle = '#f4d9a8'; ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = 'rgba(150,90,40,0.5)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s, s); ctx.moveTo(s, 0); ctx.lineTo(0, s); ctx.stroke();
      for (let i = 0; i < 300; i++) { ctx.fillStyle = 'rgba(180,120,60,0.05)'; ctx.fillRect(Math.random() * s, Math.random() * s, 3, 3); }
    });
    // ---- materials ----
    this.matCloud = new THREE.MeshLambertMaterial({ map: this.cloudTex, transparent: true, opacity: 0.96 });
    this.matCloudDark = new THREE.MeshLambertMaterial({ map: this.cloudDarkTex, transparent: true, opacity: 0.96 });
    this.matSoil = new THREE.MeshLambertMaterial({ map: this.soilTex });
    this.matSoilWet = new THREE.MeshLambertMaterial({ map: this.soilWetTex });
    this.matFelt = new THREE.MeshLambertMaterial({ map: this.feltTex, side: THREE.DoubleSide });
    this.matKite = new THREE.MeshLambertMaterial({ map: this.kiteTex, side: THREE.DoubleSide });
    this.matLeaf = new THREE.MeshLambertMaterial({ color: '#8fae7a', side: THREE.DoubleSide });
    this.matVine = new THREE.MeshLambertMaterial({ color: '#6d9455' });
    this.matThunder = new THREE.MeshLambertMaterial({ color: '#5a6ea8', emissive: '#2a3a68' });
    this.matWater = new THREE.MeshLambertMaterial({ color: '#9fc4dd', transparent: true, opacity: 0.85 });
    this.matRain = new THREE.MeshBasicMaterial({ color: '#bcd8e8', transparent: true, opacity: 0.75 });
    this.matSun = new THREE.MeshBasicMaterial({ color: '#ffe9b0' });
    this.matSunThread = new THREE.MeshBasicMaterial({ color: '#ffdf8a', transparent: true, opacity: 0.55 });
    this.matCape = new THREE.MeshLambertMaterial({ color: '#b9cdd9', side: THREE.DoubleSide });
    this.matBody = new THREE.MeshLambertMaterial({ color: '#e8ddc8' });
    this.matBoots = new THREE.MeshLambertMaterial({ color: '#6b543c' });
    this.matCan = new THREE.MeshLambertMaterial({ color: '#8a9aa8' });
  }

  mat(kind) { return this['mat' + kind.charAt(0).toUpperCase() + kind.slice(1)] || this.matCloud; }

  // puffy paper cloud: layered flattened icosahedra
  cloud({ puffs = 5, scale = 1, dark = false } = {}) {
    const g = new THREE.Group();
    const rnd = mulberry32(4 + puffs);
    for (let i = 0; i < puffs; i++) {
      const m = new THREE.Mesh(
        new THREE.IcosahedronGeometry((0.5 + rnd() * 0.5) * scale, 1),
        dark ? this.matCloudDark : this.matCloud
      );
      m.position.set((rnd() - 0.5) * 2.4 * scale, (rnd() - 0.5) * 0.4 * scale, (rnd() - 0.5) * 1.2 * scale);
      m.scale.y = 0.55;
      g.add(m);
    }
    return g;
  }

  // felt flower: layered petal planes + stem — the felt/fibre plant language
  flower({ color = '#e8a0b4', petals = 6, scale = 1 } = {}) {
    const g = new THREE.Group();
    const petalGeo = new THREE.CircleGeometry(0.32 * scale, 8, 0, Math.PI);
    const petalMat = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide, map: this.feltTex });
    for (let i = 0; i < petals; i++) {
      const p = new THREE.Mesh(petalGeo, petalMat);
      p.position.y = 0.12 * scale;
      p.rotation.set(-0.5, 0, 0);
      const holder = new THREE.Object3D();
      holder.rotation.y = (i / petals) * Math.PI * 2;
      holder.add(p);
      g.add(holder);
    }
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.14 * scale, 8, 6), new THREE.MeshLambertMaterial({ color: '#e8c86a' }));
    core.position.y = 0.16 * scale;
    g.add(core);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025 * scale, 0.035 * scale, 0.9 * scale, 5), this.matVine);
    stem.position.y = -0.45 * scale;
    g.add(stem);
    return g;
  }

  kite({ scale = 1 } = {}) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.PlaneGeometry(0.9 * scale, 1.1 * scale), this.matKite);
    body.rotation.y = 0.4;
    g.add(body);
    const tail = new THREE.Mesh(new THREE.PlaneGeometry(0.06 * scale, 1.4 * scale), this.matKite);
    tail.position.set(0, -1.1 * scale, 0);
    g.add(tail);
    return g;
  }

  // cloud soil bed: flat rounded slab
  soilBed({ w = 6, d = 4 } = {}) {
    const g = new THREE.Group();
    const bed = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, d, 4, 1, 4), this.matSoil);
    g.add(bed);
    return g;
  }

  // ---- shared geometry cache for instanced elements ----
  geo(key, make) {
    if (!this.geos.has(key)) this.geos.set(key, make());
    return this.geos.get(key);
  }

  // rain bead: elongated translucent box
  rainBeadGeometry() {
    return this.geo('rainBead', () => new THREE.BoxGeometry(0.02, 0.22, 0.02));
  }

  dispose() {
    this.geos.forEach((g) => g.dispose());
    this.geos.clear();
  }
}
