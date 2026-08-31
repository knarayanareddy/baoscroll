// Chapter I — The Dry Cloud Nursery (Phase 5, fourth in plan order).
// "Find the last seeds": an intimate cloud nursery suspended above a dry
// world far below. The gardener walks the beds, opens the seed satchel
// (six seeds, each color identifying a chapter), waters the first seed,
// and follows the root line to the island edge — where the root becomes
// the bridge transition into Chapter II.
//
// Beat table (plan):
//   0-.20   walks the nursery beds — dry leaves curl; the reservoir drips once
//   .20-.50 opens the seed satchel — six seed colors identify the chapters
//   .50-.78 waters the first seed — a root line appears through the cloud soil
//   .78-1   follows the root toward the edge — the root becomes the bridge
//
// Contacts: can spout -> first seed; seed -> cloud soil.
// Reversible: leaf curl, satchel reveal, seed pulse, wet patch, water
// stream, root segment reveal and runner extension are pure in local
// progress; the drip is a one-window effect of local (replays on scrub).
import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { CloudGardener } from '../kit/CloudGardener.js';
import { CloudReservoir } from '../kit/CloudReservoir.js';
import { SeedSatchel } from '../kit/SeedSatchel.js';
import { PlantGrowth } from '../kit/PlantGrowth.js';
import { lerp, win, mulberry32 } from '../utils/math.js';

export class DryCloudNurseryScene extends BaseScene {
  build(ctx) {
    super.build(ctx);
    const kit = this.kit;
    const rnd = mulberry32(5);

    // ---- intimate nursery island: raised cloud beds in an arc ----
    const under = kit.cloud({ puffs: 8, scale: 2.2, dark: true });
    under.position.y = -1.6;
    this.group.add(under);
    this.beds = [];
    for (let i = 0; i < 3; i++) {
      const bed = new THREE.Group();
      const slab = kit.soilBed({ w: 2.2, d: 1.4 });
      bed.add(slab);
      const puff = kit.cloud({ puffs: 3, scale: 0.7 });
      puff.position.y = -0.55;
      bed.add(puff);
      const a = -0.5 + i * 0.5;
      bed.position.set(-1.9 + i * 1.5, -0.55, 0.9 - Math.abs(i - 1) * 0.5);
      bed.rotation.y = -a * 0.4;
      this.group.add(bed);
      this.beds.push(bed);
    }

    // ---- the first seed's bed (front-centre) + seed in the soil ----
    this.seedBedPos = new THREE.Vector3(0.1, -0.28, 0.42);
    this.seed = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 8, 6),
      new THREE.MeshLambertMaterial({ color: '#c9a86a', emissive: new THREE.Color('#c9a86a').multiplyScalar(0.2) })
    );
    this.seed.position.copy(this.seedBedPos).add(new THREE.Vector3(0, 0.03, 0));
    this.group.add(this.seed);
    // wet patch: soil darkens where the water lands (contact: seed -> soil)
    this.wetPatch = new THREE.Mesh(new THREE.CircleGeometry(0.55, 16), kit.matSoilWet);
    this.wetPatch.rotation.x = -Math.PI / 2;
    this.wetPatch.position.copy(this.seedBedPos).add(new THREE.Vector3(0, 0.02, 0));
    this.wetPatch.scale.setScalar(0.001);
    this.group.add(this.wetPatch);

    // ---- withered plants: dry leaves that curl as the chapter opens ----
    this.withered = [];
    for (const [bx, bz] of [[-1.9, 0.7], [-0.4, 1.1], [1.5, 0.5], [-2.6, 0.2], [2.4, 0.1], [0.9, 1.2]]) {
      const plant = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.4, 4), new THREE.MeshLambertMaterial({ color: '#9a8f6a' }));
      stem.position.y = 0.2;
      plant.add(stem);
      const leaves = [];
      for (let l = 0; l < 3; l++) {
        const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.11, 6, 0, Math.PI * 2), new THREE.MeshLambertMaterial({ color: '#b3a878', side: THREE.DoubleSide }));
        leaf.position.y = 0.3 + l * 0.07;
        leaf.rotation.x = 0.6;
        const holder = new THREE.Object3D();
        holder.rotation.y = l * 2.1;
        holder.add(leaf);
        plant.add(holder);
        leaves.push(leaf);
      }
      plant.userData = { leaves };
      plant.position.set(bx, -0.55, bz);
      this.group.add(plant);
      this.withered.push(plant);
    }

    // ---- the last cloud reservoir (depleted; drips once on beat 1) ----
    this.reservoir = new CloudReservoir(kit, { puffs: 6 });
    this.reservoir.position.set(-2.9, 0.7, -1.2);
    this.reservoir.scale.setScalar(1.0);
    this.group.add(this.reservoir);

    // ---- seed satchel: six seeds, chapter colors (reveal beat) ----
    this.satchel = new SeedSatchel(kit);
    this.satchel.group.position.set(0.95, 0.15, 0.6); // beside the gardener's stopping point
    this.satchel.group.scale.setScalar(1.6);
    this.group.add(this.satchel.group);
    this._satchelT = 0;

    // ---- the root line: vertical (through the soil) + runner to the
    // island edge — pre-built segments revealed by visibility (no
    // per-frame allocation); the runner foreshadows the II bridge ----
    this.growth = new PlantGrowth(kit);
    const root = this.growth.vine({ from: [0.1, -0.25, 0.42], to: [0.1, -1.5, 0.42], segments: 4, sag: 0.08, seed: 11 });
    this.rootSegs = this._buildSegments(root, kit, 0.028);
    const runner = this.growth.vine({ from: [0.1, -0.24, 0.42], to: [3.4, -0.18, 0.2], segments: 6, sag: 0.3, seed: 12 });
    this.runnerSegs = this._buildSegments(runner, kit, 0.034);
    this.runnerEnd = runner.curve.getPoint(1).clone();
    this._runnerT = 0;

    // ---- water stream: spout -> seed (visible in the watering window) ----
    this.stream = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, 1, 5), kit.matWater);
    this.stream.visible = false;
    this.group.add(this.stream);

    // ---- the dry world far below (context, far and faint) ----
    const ground = new THREE.Mesh(new THREE.CircleGeometry(26, 24), new THREE.MeshLambertMaterial({ color: '#cfc3a4' }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -6.5;
    this.group.add(ground);
    for (let i = 0; i < 7; i++) {
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 1.6 + rnd() * 1.2, 4), new THREE.MeshLambertMaterial({ color: '#8d8266' }));
      br.position.set(-9 + i * 3 + rnd() * 2, -5.7, -4 - rnd() * 6);
      br.rotation.z = (rnd() - 0.5) * 0.5;
      this.group.add(br);
    }

    // ---- gardener ----
    this.gardener = new CloudGardener(kit);
    this.group.add(this.gardener.group);
  }

  _buildSegments(vine, kit, radius) {
    const pts = vine.curve.getPoints(vine.segments);
    const segs = [];
    for (let i = 0; i < vine.segments; i++) {
      const a = pts[i], b = pts[i + 1];
      const mid = a.clone().lerp(b, 0.5);
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.8, radius, a.distanceTo(b), 5), kit.matVine);
      seg.position.copy(mid);
      seg.lookAt(b);
      seg.rotateX(Math.PI / 2);
      seg.visible = false;
      this.group.add(seg);
      segs.push(seg);
    }
    return segs;
  }

  update(local, dt, t) {
    const reduced = this.ctx.reducedMotion;

    // beat 1: dry leaves curl (desiccation, pure in local)
    const curl = win(local, 0, 0.3);
    this.withered.forEach((plant, pi) => {
      plant.userData.leaves.forEach((leaf, li) => {
        const c = curl * (0.7 + 0.3 * ((pi + li) % 3) / 2);
        leaf.scale.setScalar(Math.max(0.5, 1 - c * 0.5));
        leaf.rotation.x = 0.6 + c * 0.9;
      });
    });
    // beat 1: the reservoir drips ONCE (drip window remapped into 0-.2)
    this.reservoir.setLevel(0.06, Math.min(1, local * 4));

    // beat 2: satchel reveal — six seeds fan out, chapter colors pulse
    this._satchelT = win(local, 0.2, 0.5);
    this.satchel.setReveal(this._satchelT);
    this.satchel.group.position.y = 0.15 + this._satchelT * 0.25;
    this.satchel.seeds.forEach((s, i) => {
      s.material.emissiveIntensity = 0.6 + win(local, 0.24 + i * 0.045, 0.44 + i * 0.045, 0.05) * 1.4;
    });

    // gardener: walk the beds (0-.2) -> stop at the satchel (.2-.5) ->
    // water the first seed (.5-.78) -> follow the root to the edge (.78-1)
    const gp = this.gardener.group.position;
    const walkT = win(local, 0, 0.2);
    const seedT = win(local, 0.5, 0.78);
    const edgeT = win(local, 0.78, 1);
    const pathX = lerp(-1.4, 0.62, walkT);            // along the beds
    const waterX = lerp(pathX, 0.55, seedT);
    const edgeX = lerp(waterX, 2.9, edgeT);
    const z = lerp(1.35, 0.75, walkT);
    gp.set(edgeX, -0.28, z);
    const action = local < 0.2 ? 'walk' : local < 0.5 ? 'idle' : local < 0.78 ? 'water' : 'walk';
    this.gardener.pose(action, t.time * (1 - reduced * 0.7), 0.1, local < 0.5 ? 0 : 0.1);

    // beats 3-4: water the seed — spout -> seed stream, soil wets
    const streamOn = win(local, 0.5, 0.56) * (1 - win(local, 0.7, 0.76));
    this.stream.visible = streamOn > 0.02;
    if (this.stream.visible) {
      const spout = new THREE.Vector3();
      this.gardener.canSpout.getWorldPosition(spout);
      const target = this.seed.position.clone();
      const mid = spout.clone().lerp(target, 0.5);
      this.stream.position.copy(mid);
      this.stream.lookAt(target);
      this.stream.rotateX(Math.PI / 2);
      this.stream.scale.set(1, spout.distanceTo(target) * 0.85, 1);
      this.stream.material.opacity = 0.5 + streamOn * 0.35;
      // contact: spout -> seed
      this._contactSpout = spout.distanceTo(target);
    }
    this.wetPatch.scale.setScalar(0.001 + win(local, 0.52, 0.72));

    // beat 3: the root line appears through the cloud soil (pure count)
    const rootT = win(local, 0.5, 0.72);
    const rvis = Math.floor(rootT * (this.rootSegs.length + 0.999));
    this.rootSegs.forEach((s, i) => { s.visible = i < rvis; s.material.opacity = 1; });
    // beat 4: the runner follows the root to the edge — it becomes the
    // bridge (runner end meets the island edge at local ~1)
    this._runnerT = win(local, 0.78, 0.995);
    const uvis = Math.floor(this._runnerT * (this.runnerSegs.length + 0.999));
    this.runnerSegs.forEach((s, i) => { s.visible = i < uvis; });
    // the runner brightens slightly as it "becomes the bridge"
    const bridgeGlow = win(local, 0.9, 1);
    this.runnerSegs.forEach((s) => {
      s.material.color.setRGB(lerp(0.43, 0.55, bridgeGlow), lerp(0.58, 0.7, bridgeGlow), lerp(0.33, 0.5, bridgeGlow));
    });

    // idle drift on the withered plants (frame-level, excluded from state)
    this.withered.forEach((p, i) => {
      p.rotation.z = Math.sin(t.time * 0.6 + i) * 0.02 * (1 - reduced);
    });
  }

  structuralState() {
    const g = this.gardener.group.position;
    return [
      g.x, g.y, g.z,
      this._satchelT,
      this.wetPatch.scale.x,
      this.rootSegs.filter((s) => s.visible).length,
      this._runnerT,
      this.runnerSegs.filter((s) => s.visible).length,
      this.reservoir.level
    ];
  }

  camera(local, t, cam) {
    // four story shots on the beat windows:
    //  0-.20  setup: the nursery arc, beds, reservoir behind
    //  .2-.5  CLOSE on the satchel reveal (seeds fanning out)
    //  .5-.78 CLOSE on the watering contact (spout -> seed)
    //  .78-1  follow the root runner to the island edge (exit)
    const walkT = win(local, 0, 0.2);
    const satchelT = win(local, 0.2, 0.5);
    const waterT = win(local, 0.5, 0.78);
    const edgeT = win(local, 0.78, 1);
    const shot = win(local, 0.16, 0.26);        // setup -> satchel
    const shot2 = win(local, 0.46, 0.56);       // satchel -> watering
    const shot3 = win(local, 0.74, 0.84);       // watering -> exit
    // setup
    let px = lerp(-3.6, -2.6, walkT), py = lerp(0.9, 1.0, walkT), pz = lerp(4.4, 4.0, walkT);
    let lx = -0.2, ly = -0.3, lz = 0.5;
    // satchel (close)
    px = lerp(px, lerp(2.3, 1.9, satchelT), shot);
    py = lerp(py, lerp(0.35, 0.3, satchelT), shot);
    pz = lerp(pz, lerp(2.6, 2.3, satchelT), shot);
    lx = lerp(lx, 0.8, shot); ly = lerp(ly, 0.1, shot); lz = lerp(lz, 0.6, shot);
    // watering (close contact)
    px = lerp(px, lerp(1.9, 1.55, waterT), shot2);
    py = lerp(py, lerp(0.15, 0.05, waterT), shot2);
    pz = lerp(pz, lerp(2.0, 1.7, waterT), shot2);
    lx = lerp(lx, 0.3, shot2); ly = lerp(ly, -0.15, shot2); lz = lerp(lz, 0.45, shot2);
    // root runner to the edge (exit)
    px = lerp(px, lerp(1.6, 3.4, edgeT), shot3);
    py = lerp(py, lerp(0.3, 0.4, edgeT), shot3);
    pz = lerp(pz, lerp(1.9, 2.8, edgeT), shot3);
    lx = lerp(lx, lerp(1.0, 3.4, edgeT), shot3);
    ly = lerp(ly, lerp(-0.25, -0.15, edgeT), shot3);
    lz = lerp(lz, lerp(0.4, 0.25, edgeT), shot3);
    cam.position.set(px, py, pz);
    cam.lookAt(lx, ly, lz);
  }

  dispose() {}
}
