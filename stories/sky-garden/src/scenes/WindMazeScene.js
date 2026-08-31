// Chapter III — The Wind Maze (Phase 5, built first in plan order).
// "Cross moving islands": a lateral kite-island maze with shifting wind
// lanes. The gardener reads the ribbons, grabs a kite sail, and threads
// through gusts to the thunder orchard gate.
//
// Beat table (plan):
//   0-.24   reads wind ribbons — islands drift, kites pull at anchors
//   .24-.54 grabs a kite sail — the wind lane becomes a traversable route
//   .54-.80 runs/floats across the path — fast scroll intensifies bend/spray
//   .80-1   reaches the thunder orchard gate — distant thunder lights branches
//
// Contacts: hand -> kite grip; feet -> moving island platform.
// Reversible: island drift, gardener path, kite fill, lane opacity, gate
// glow are pure in local progress; scroll velocity only bends a frame.
import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { CloudGardener } from '../kit/CloudGardener.js';
import { WindField } from '../kit/WindField.js';
import { lerp, clamp, win, mulberry32 } from '../utils/math.js';

const ISLANDS = [
  { x: 0, y: 0, z: 0 },
  { x: 2.6, y: 0.25, z: -0.8 },
  { x: 5.2, y: -0.2, z: 0.6 },
  { x: 7.8, y: 0.35, z: -0.5 },
  { x: 10.4, y: 0.1, z: 0 }   // gate island
];

export class WindMazeScene extends BaseScene {
  build(ctx) {
    super.build(ctx);
    const kit = this.kit;
    this.group.position.x = -4; // center the lateral maze in view

    // ---- moving island platforms (drift: pure in (i, local, t)) ----
    this.islands = ISLANDS.map((p, i) => {
      const g = new THREE.Group();
      const bed = kit.soilBed({ w: 2.2, d: 1.6 });
      g.add(bed);
      const puff = kit.cloud({ puffs: 4, scale: 0.9, dark: i % 2 });
      puff.position.y = -0.75;
      g.add(puff);
      g.position.set(p.x, p.y, p.z);
      this.group.add(g);
      return { node: g, base: { ...p } };
    });

    // ---- wind field + readable ribbons ----
    this.wind = new WindField(kit, ctx.quality);
    this.wind.group.position.set(2, 1.2, -3.5);
    this.group.add(this.wind.group);

    // ---- kites anchored on islands (pull at anchors) ----
    this.kites = [0, 1, 3].map((idx, i) => {
      const k = kit.kite({ scale: 0.8 + (i % 2) * 0.3 });
      k.position.set(ISLANDS[idx].x + (i - 1) * 0.5, ISLANDS[idx].y + 1.1, ISLANDS[idx].z + 0.3);
      this.group.add(k);
      return { node: k, island: idx, ph: mulberry32(i * 9 + 2)() * 6.28, grabbed: false };
    });
    // the sail the gardener grabs (island 1) — hand -> kite grip
    this.kite = this.kites[1];
    this.lane = new THREE.Mesh(
      new THREE.PlaneGeometry(7.6, 0.16),
      new THREE.MeshBasicMaterial({ color: '#bcd8e8', transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    this.lane.position.set(6, 0.75, 0);
    this.lane.rotation.y = 0.06;
    this.group.add(this.lane);

    // ---- gardener ----
    this.gardener = new CloudGardener(kit);
    this.group.add(this.gardener.group);

    // ---- thunder orchard gate (beat 4): arch + distant thunder branches ----
    this.gate = new THREE.Group();
    const archMat = new THREE.MeshLambertMaterial({ color: '#8fa8bf' });
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.2, 6), archMat);
      post.position.set(s * 0.9, 1.1, 0);
      this.gate.add(post);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.14, 0.14), archMat);
    lintel.position.y = 2.25;
    this.gate.add(lintel);
    this.gate.position.set(ISLANDS[4].x + 1.1, ISLANDS[4].y, ISLANDS[4].z);
    this.group.add(this.gate);
    this.thunderBrs = [];
    for (let i = 0; i < 3; i++) {
      const br = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.05, 2.4, 5),
        new THREE.MeshLambertMaterial({ color: '#5a6ea8', emissive: '#1a2448' })
      );
      br.position.set(ISLANDS[4].x + 3 + i * 0.8, 1 + i * 0.3, -5 - i);
      this.group.add(br);
      this.thunderBrs.push(br);
    }
    this.gateLight = new THREE.PointLight('#7f8fb8', 0, 8);
    this.gateLight.position.set(ISLANDS[4].x + 1.1, 2.4, ISLANDS[4].z + 1);
    this.group.add(this.gateLight);
  }

  // island platform height under the gardener (feet contact)
  _platformY(x, t) {
    let best = ISLANDS[0], bd = Infinity;
    for (const p of ISLANDS) {
      const d = Math.abs(p.x - x);
      if (d < bd) { bd = d; best = p; }
    }
    const drift = this.wind.drift(ISLANDS.indexOf(best), 0, t);
    // crossing arc between adjacent islands
    for (let i = 0; i < ISLANDS.length - 1; i++) {
      if (x >= ISLANDS[i].x && x <= ISLANDS[i + 1].x) {
        const u = (x - ISLANDS[i].x) / (ISLANDS[i + 1].x - ISLANDS[i].x);
        return lerp(ISLANDS[i].y, ISLANDS[i + 1].y, u) + Math.sin(u * Math.PI) * 0.35;
      }
    }
    return best.y + drift.y;
  }

  update(local, dt, t) {
    const reduced = this.ctx.reducedMotion;
    // islands drift (pure in (i, local, time))
    this.islands.forEach((isl, i) => {
      const d = this.wind.drift(i, local, t.time, reduced);
      isl.node.position.x = isl.base.x + d.x * 0.4;
      isl.node.position.y = isl.base.y + d.y;
    });
    // kites pull at anchors (transient wind + velocity)
    const s = this.wind.strength(local, t.time, reduced);
    const vel = clamp(t.velocity, -1, 1);
    this.wind.setVelocity(t.velocity, dt);
    this.wind.update(local, t.time, dt);
    for (const k of this.kites) {
      if (k === this.kite && k.grabbed) continue;
      const pull = s * 0.3 + Math.sin(t.time * 1.4 + k.ph) * 0.12 * (1 - reduced);
      k.node.rotation.z = pull + vel * 0.25;
      k.node.position.y += (Math.sin(t.time * 2 + k.ph) * 0.02 * s) * dt * 60 * 0.016;
    }
    // grab at .24 — hand -> kite grip
    const grabT = win(local, 0.24, 0.3);
    this.kite.grabbed = grabT > 0.5;
    if (this.kite.grabbed) {
      const gw = new THREE.Vector3();
      this.gardener.group.getWorldPosition(gw);
      this.kite.node.position.set(gw.x + 0.35, gw.y + 0.5, gw.z + 0.1);
      this.kite.node.rotation.z = -0.5 + vel * 0.3;
      // the wind lane becomes a traversable route
      this.lane.material.opacity = win(local, 0.28, 0.5) * 0.5;
    } else {
      this.lane.material.opacity = 0;
    }
    // gardener path: read (0-.24) -> grab (on island 1) -> cross (.24-.80) -> gate (.80-1)
    const crossT = win(local, 0.24, 0.8);
    const gx = lerp(ISLANDS[0].x, ISLANDS[4].x - 0.4, crossT);
    const gy = this._platformY(gx, t.time);
    this.gardener.group.position.set(gx, gy, lerp(0, -0.2, crossT));
    const running = local > 0.3 && local < 0.8;
    const action = local < 0.24 ? 'walk' : local < 0.3 ? 'reach' : running ? 'run' : 'walk';
    this.gardener.pose(action, t.time * (1 - reduced * 0.7), s, running ? vel * 0.3 : 0);
    // feet -> platform contact distance (smoke/QA anchor)
    this._contactDist = Math.abs(this.gardener.anchorDistance(this.gardener.footR, new THREE.Vector3(gx, gy, 0)));
    // gate: distant thunder lights branches (.8-1)
    const glow = win(local, 0.8, 1);
    const flash = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(t.time * 7);
    this.gateLight.intensity = glow * 1.6 * flash;
    for (const br of this.thunderBrs) {
      br.material.emissive.setRGB(0.1 * glow * flash, 0.15 * glow * flash, 0.35 * glow * flash);
    }
  }

  structuralState() {
    const g = this.gardener.group.position;
    const k = this.kite.node.position;
    return [g.x, g.y, g.z, k.x, k.y, this.lane.material.opacity, this.gateLight.intensity];
  }

  camera(local, t, cam) {
    // lateral tracking dolly: follows the gardener, pulls wide at the gate
    const gx = lerp(ISLANDS[0].x, ISLANDS[4].x, win(local, 0.2, 0.85));
    const wide = win(local, 0.8, 1);
    cam.position.set(gx + 0.6 - wide * 1.6, 1.7 + wide * 0.9, 5.4 - wide * 1.2);
    cam.lookAt(gx + wide * 2.2, 1.0, 0);
  }
}
