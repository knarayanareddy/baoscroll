// Shared factory for the handcrafted coast. One kit instance per
// Experience: geometries and materials are cached and reused across
// chapters (the same cottage geometry appears in the harbor, behind the
// storm, and again at dawn), so six chapters cost close to one.
//
// Everything here is cut paper, wet timber or oxidised brass. Nothing is
// an untextured primitive — that is the whole point of the kit, and the
// reason chapters must build through it rather than around it.
//
// PRODUCTION ASSET NOTE: these are procedural stand-ins. Drop scanned
// cotton-rag, timber and brass textures into /public/textures and swap
// them in AssetLoader; the kit picks them up through assets.get().

import * as THREE from 'three';
import { mulberry32 } from './math.js';

export function createPaperKit(assets) {
  const materialCache = new Map();
  const geoCache = new Map();

  function cachedMat(kind, map, color, opts) {
    const key = `${kind}:${color}:${opts.opacity ?? 1}:${opts.side ?? 0}:${opts.depthWrite ?? 1}:${opts.lit ? 1 : 0}`;
    if (!materialCache.has(key)) {
      const base = {
        map: assets.get(map),
        color,
        transparent: (opts.opacity ?? 1) < 1,
        opacity: opts.opacity ?? 1,
        side: opts.side ?? THREE.FrontSide,
        depthWrite: opts.depthWrite ?? true
      };
      materialCache.set(
        key,
        opts.lit
          ? new THREE.MeshLambertMaterial(base)
          : new THREE.MeshBasicMaterial({ ...base, toneMapped: false })
      );
    }
    return materialCache.get(key);
  }

  /** Salt-stained cut paper — walls, sails, cards, sea cutouts. */
  const paperMat = (color, opts = {}) => cachedMat('p', 'paper', color, opts);
  /** Wet dock timber — planks, pilings, hulls, desks, stairs. */
  const woodMat = (color, opts = {}) => cachedMat('w', 'plank', color, opts);
  /** Oxidised brass — lamp housing, wheel, rails, lantern frames. */
  const brassMat = (color, opts = {}) => cachedMat('b', 'brass', color, { lit: true, ...opts });

  function geo(key, make) {
    if (!geoCache.has(key)) geoCache.set(key, make());
    return geoCache.get(key);
  }

  /* ---- torn silhouettes: headlands and standing water ---- */

  // A single torn-paper contour. `crest` shapes the profile, so the same
  // routine cuts both rock headlands and the wall of a standing wave.
  function tornGeometry(width, height, crest, seed) {
    const rnd = mulberry32(seed);
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    const steps = 64;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = -width / 2 + t * width;
      const y = height * crest(t, rnd) + (rnd() - 0.5) * height * 0.06;
      shape.lineTo(x, Math.max(y, height * 0.08));
    }
    shape.lineTo(width / 2, 0);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }

  function makeHeadland({ width = 30, height = 4, peaks = 3, seed = 1, color = '#21393a' } = {}) {
    const crest = (t, rnd) =>
      0.35 + (Math.sin(t * Math.PI * peaks + rnd() * 0.5) * 0.5 + 0.5) * 0.65;
    return new THREE.Mesh(
      geo(`head:${width}:${height}:${peaks}:${seed}`, () => tornGeometry(width, height, crest, seed)),
      paperMat(color, { side: THREE.DoubleSide })
    );
  }

  // Wave ridges are steeper and more asymmetric than rock: they lean.
  function makeSeaRidge({ width = 34, height = 6, seed = 3, color = '#194859', lean = 0.4 } = {}) {
    const crest = (t, rnd) => {
      const skew = Math.pow(t, 1 + lean);
      return 0.25 + (Math.sin(skew * Math.PI * 2.2 + rnd() * 0.4) * 0.5 + 0.5) * 0.75;
    };
    return new THREE.Mesh(
      geo(`ridge:${width}:${height}:${seed}:${lean}`, () => tornGeometry(width, height, crest, seed)),
      paperMat(color, { side: THREE.DoubleSide })
    );
  }

  function makeCloud(scale = 1, opacity = 0.85, color = '#ffffff') {
    const mesh = new THREE.Mesh(
      geo('cloud', () => new THREE.PlaneGeometry(3.2, 1.5)),
      new THREE.MeshBasicMaterial({
        map: assets.get('cloud'),
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        toneMapped: false
      })
    );
    mesh.scale.setScalar(scale);
    return mesh;
  }

  /* ---- the harbor village ---- */

  // Steep-roofed coastal cottage. The lit window is the emotional unit of
  // chapter one and chapter six, so it is exposed as setGlow().
  function makeCottage({ w = 1.2, h = 0.9, d = 1, wall = '#efe2c8', roof = '#4a3b3a', chimney = true } = {}) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(geo(`cot:${w}x${h}x${d}`, () => new THREE.BoxGeometry(w, h, d)), paperMat(wall));
    body.position.y = h / 2;
    const cap = new THREE.Mesh(
      geo(`cotRoof:${w}:${h}`, () => new THREE.ConeGeometry(w * 0.86, h * 0.7, 4)),
      paperMat(roof)
    );
    cap.rotation.y = Math.PI / 4;
    cap.position.y = h + h * 0.34;
    g.add(body, cap);
    if (chimney) {
      const stack = new THREE.Mesh(
        geo('chimney', () => new THREE.BoxGeometry(0.16, 0.42, 0.16)),
        paperMat('#7d6250')
      );
      stack.position.set(w * 0.26, h + h * 0.5, 0);
      g.add(stack);
    }
    const paneMat = new THREE.MeshBasicMaterial({ color: '#ffd782', transparent: true, opacity: 0.2, toneMapped: false });
    const pane = new THREE.Mesh(geo('cotPane', () => new THREE.PlaneGeometry(0.22, 0.26)), paneMat);
    pane.position.set(0, h * 0.52, d / 2 + 0.004);
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: assets.get('glow'), color: '#ffc46a', transparent: true, opacity: 0, depthWrite: false, fog: false })
    );
    halo.scale.setScalar(0.9);
    halo.position.copy(pane.position);
    g.add(pane, halo);
    g.userData.setGlow = (k) => {
      paneMat.opacity = 0.16 + 0.8 * k;
      halo.material.opacity = 0.5 * k;
    };
    return g;
  }

  /* ---- the lighthouse itself ---- */

  // Painted off-white with rust weathering and a coral band — never a
  // clean white cylinder. Returns anchors so scenes can hang lamps,
  // stairs and keepers off it without guessing at geometry.
  function makeLighthouse({ height = 6.6, wall = '#efe2c8', band = '#b8584b', trim = '#182b32' } = {}) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      geo(`lhBody:${height}`, () => new THREE.CylinderGeometry(0.92, 1.3, height, 18, 1, true)),
      paperMat(wall, { side: THREE.DoubleSide })
    );
    body.position.y = height / 2;
    g.add(body);

    // weathering: a salt/rust wash sleeve just outside the wall
    const weather = new THREE.Mesh(
      geo(`lhWeather:${height}`, () => new THREE.CylinderGeometry(0.935, 1.315, height, 18, 1, true)),
      new THREE.MeshBasicMaterial({
        map: assets.get('salt'),
        color: '#c8b49a',
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false
      })
    );
    weather.position.y = height / 2;
    g.add(weather);

    const stripe = new THREE.Mesh(
      geo('lhBand', () => new THREE.CylinderGeometry(0.99, 1.06, 0.5, 18, 1, true)),
      paperMat(band, { side: THREE.DoubleSide })
    );
    stripe.position.y = height * 0.56;
    g.add(stripe);

    const door = new THREE.Mesh(geo('lhDoor', () => new THREE.PlaneGeometry(0.5, 0.98)), woodMat('#3d2f28'));
    door.position.set(0, 0.49, 1.27);
    g.add(door);

    for (let i = 0; i < 3; i++) {
      const win = new THREE.Mesh(
        geo('lhWin', () => new THREE.PlaneGeometry(0.3, 0.5)),
        new THREE.MeshBasicMaterial({ color: '#ffd782', transparent: true, opacity: 0.62, toneMapped: false })
      );
      const y = 1.7 + i * 1.5;
      const r = 1.3 - (y / height) * 0.38;
      win.position.set(0, y, r + 0.02);
      g.add(win);
    }

    const gallery = new THREE.Mesh(
      geo('lhGallery', () => new THREE.CylinderGeometry(1.34, 1.34, 0.14, 18)),
      brassMat('#7d6338')
    );
    gallery.position.y = height;
    g.add(gallery);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const rail = new THREE.Mesh(geo('lhRail', () => new THREE.CylinderGeometry(0.022, 0.022, 0.4, 5)), brassMat('#95763f'));
      rail.position.set(Math.cos(a) * 1.28, height + 0.27, Math.sin(a) * 1.28);
      g.add(rail);
    }

    const lanternRoom = new THREE.Mesh(
      geo('lhGlass', () => new THREE.CylinderGeometry(1.06, 1.06, 1.0, 14, 1, true)),
      new THREE.MeshBasicMaterial({ color: '#cfe4e2', transparent: true, opacity: 0.26, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })
    );
    lanternRoom.position.y = height + 0.6;
    g.add(lanternRoom);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const mullion = new THREE.Mesh(geo('lhMullion', () => new THREE.BoxGeometry(0.05, 1.02, 0.05)), paperMat(trim));
      mullion.position.set(Math.cos(a) * 1.07, height + 0.6, Math.sin(a) * 1.07);
      g.add(mullion);
    }

    const roof = new THREE.Mesh(geo('lhRoof', () => new THREE.ConeGeometry(1.42, 1.05, 14)), paperMat(trim));
    roof.position.y = height + 1.62;
    const finial = new THREE.Mesh(geo('lhFinial', () => new THREE.SphereGeometry(0.1, 8, 6)), brassMat('#c79a4e'));
    finial.position.y = height + 2.2;
    g.add(roof, finial);

    const lampAnchor = new THREE.Object3D();
    lampAnchor.position.y = height + 0.6;
    g.add(lampAnchor);

    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: assets.get('glow'), color: '#ffd27a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })
    );
    halo.position.y = height + 0.6;
    halo.scale.setScalar(4.5);
    g.add(halo);

    g.userData.lampAnchor = lampAnchor;
    g.userData.galleryY = height;
    g.userData.setGlow = (k) => {
      halo.material.opacity = 0.62 * k;
      halo.scale.setScalar(3.4 + k * 3.6);
    };
    return g;
  }

  /* ---- working harbor: dock, boats, gear ---- */

  function makePiling({ height = 1.4, rope = true } = {}) {
    const g = new THREE.Group();
    const post = new THREE.Mesh(
      geo(`piling:${height}`, () => new THREE.CylinderGeometry(0.1, 0.14, height, 8)),
      woodMat('#4c382f')
    );
    post.position.y = height / 2;
    g.add(post);
    // the wet band where the tide sits, and a rope collar
    const tideMark = new THREE.Mesh(
      geo('tideMark', () => new THREE.CylinderGeometry(0.115, 0.135, 0.3, 8, 1, true)),
      paperMat('#2c3f3c', { side: THREE.DoubleSide, opacity: 0.85 })
    );
    tideMark.position.y = height * 0.22;
    g.add(tideMark);
    if (rope) {
      for (let i = 0; i < 3; i++) {
        const coil = new THREE.Mesh(
          geo('coil', () => new THREE.TorusGeometry(0.13, 0.022, 5, 12)),
          paperMat('#c2a071')
        );
        coil.rotation.x = Math.PI / 2;
        coil.position.y = height * 0.72 + i * 0.05;
        g.add(coil);
      }
    }
    return g;
  }

  function makeDeck({ planks = 20, width = 0.6, depth = 4.2 } = {}) {
    const g = new THREE.Group();
    for (let i = 0; i < planks; i++) {
      const plank = new THREE.Mesh(
        geo(`plank:${width}:${depth}`, () => new THREE.BoxGeometry(width, 0.11, depth)),
        woodMat(i % 2 ? '#735343' : '#5f463b')
      );
      plank.position.set(i * (width + 0.02), 0, (i % 3) * 0.02);
      g.add(plank);
    }
    return g;
  }

  // A working dory: planked hull, thwart, oars, and a folded sail. Used
  // moored in ch1, straining in ch3, sunk in ch4, and afloat again in ch6.
  function makeDory({ sail = true, hull = '#653f34' } = {}) {
    const g = new THREE.Group();
    const shell = new THREE.Mesh(geo('doryHull', () => new THREE.SphereGeometry(1.15, 14, 8)), woodMat(hull));
    shell.scale.set(1, 0.34, 0.46);
    shell.position.y = -0.42;
    const gunwale = new THREE.Mesh(geo('gunwale', () => new THREE.TorusGeometry(1.02, 0.045, 6, 20)), woodMat('#7d5a45'));
    gunwale.rotation.x = Math.PI / 2;
    gunwale.scale.set(1, 0.46, 1);
    gunwale.position.y = -0.16;
    const thwart = new THREE.Mesh(geo('thwart', () => new THREE.BoxGeometry(1.5, 0.06, 0.24)), woodMat('#87664e'));
    thwart.position.y = -0.2;
    g.add(shell, gunwale, thwart);
    if (sail) {
      const mast = new THREE.Mesh(geo('mast', () => new THREE.CylinderGeometry(0.045, 0.055, 2.7, 6)), woodMat('#543d35'));
      mast.position.y = 0.9;
      const canvasSail = new THREE.Mesh(
        geo('sail', () => new THREE.PlaneGeometry(1.3, 1.7, 6, 6)),
        paperMat('#e8dcc0', { side: THREE.DoubleSide })
      );
      canvasSail.position.set(0.66, 1.16, 0);
      g.add(mast, canvasSail);
      g.userData.sail = canvasSail;
    }
    return g;
  }

  function makeBuoy(color = '#b8584b') {
    const g = new THREE.Group();
    const float = new THREE.Mesh(geo('buoy', () => new THREE.SphereGeometry(0.22, 10, 8)), paperMat(color));
    const collar = new THREE.Mesh(geo('buoyCollar', () => new THREE.TorusGeometry(0.2, 0.045, 5, 12)), paperMat('#e8dcc0'));
    collar.rotation.x = Math.PI / 2;
    const pole = new THREE.Mesh(geo('buoyPole', () => new THREE.CylinderGeometry(0.02, 0.02, 0.6, 5)), woodMat('#4c382f'));
    pole.position.y = 0.34;
    g.add(float, collar, pole);
    return g;
  }

  function makeCrate(scale = 1) {
    const g = new THREE.Group();
    const box = new THREE.Mesh(geo('crate', () => new THREE.BoxGeometry(0.5, 0.42, 0.44)), woodMat('#6d5140'));
    g.add(box);
    for (const y of [-0.13, 0.13]) {
      const strap = new THREE.Mesh(geo('strap', () => new THREE.BoxGeometry(0.52, 0.05, 0.46)), woodMat('#4a382c'));
      strap.position.y = y;
      g.add(strap);
    }
    g.scale.setScalar(scale);
    return g;
  }

  function makeBarrel(scale = 1) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(geo('barrel', () => new THREE.CylinderGeometry(0.24, 0.21, 0.56, 10)), woodMat('#775740'));
    g.add(body);
    for (const y of [-0.16, 0.16]) {
      const hoop = new THREE.Mesh(geo('hoop', () => new THREE.CylinderGeometry(0.245, 0.245, 0.05, 10)), brassMat('#7d6338'));
      hoop.position.y = y;
      g.add(hoop);
    }
    g.scale.setScalar(scale);
    return g;
  }

  // A hanging net: cheap crossed lines, but it reads instantly as a
  // working harbor and catches lamp light along the top edge.
  function makeNet({ width = 1.6, height = 1.2, cells = 7 } = {}) {
    const pts = [];
    for (let i = 0; i <= cells; i++) {
      const x = -width / 2 + (i / cells) * width;
      pts.push(new THREE.Vector3(x, 0, 0), new THREE.Vector3(x + 0.16, -height, 0));
      const y = -(i / cells) * height;
      pts.push(new THREE.Vector3(-width / 2, y, 0), new THREE.Vector3(width / 2, y, 0));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#9c8a68', transparent: true, opacity: 0.7 }));
  }

  /* ---- rope that can be told to strain ---- */

  // A catenary between two points. `tension` 0 = slack loop, 1 = a
  // straight, singing line — chapter three's whole argument in one prop.
  function makeRope(from, to, { segments = 18, color = '#c2a071', sag = 0.9 } = {}) {
    const points = [];
    for (let i = 0; i <= segments; i++) points.push(new THREE.Vector3());
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color })
    );
    const a = from.clone();
    const b = to.clone();
    line.userData.setTension = (tension, jitter = 0, time = 0) => {
      const attr = line.geometry.attributes.position;
      const droop = sag * (1 - tension);
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const hang = Math.sin(t * Math.PI) * droop;
        const shiver = Math.sin(time * 26 + t * 9) * jitter * Math.sin(t * Math.PI) * 0.06;
        attr.setXYZ(
          i,
          a.x + (b.x - a.x) * t,
          a.y + (b.y - a.y) * t - hang + shiver,
          a.z + (b.z - a.z) * t
        );
      }
      attr.needsUpdate = true;
    };
    line.userData.setEnds = (na, nb) => {
      a.copy(na);
      b.copy(nb);
    };
    line.userData.setTension(0);
    return line;
  }

  /* ---- memory: name cards and drifting glyphs ---- */

  // The recovered memory of one sailor: a torn card with a handwritten
  // name that can fade, lift and be carried into the lamp.
  function makeNameCard(index = 0, tint = '#e6d8bb') {
    const g = new THREE.Group();
    const card = new THREE.Mesh(geo('cardPlane', () => new THREE.PlaneGeometry(1.15, 0.74)), paperMat(tint, { side: THREE.DoubleSide, opacity: 0.98 }));
    const inkMat = new THREE.MeshBasicMaterial({
      map: assets.get(`name${index % 4}`),
      color: '#4a3830',
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      toneMapped: false
    });
    const ink = new THREE.Mesh(geo('cardInk', () => new THREE.PlaneGeometry(0.9, 0.34)), inkMat);
    ink.position.set(0, -0.02, 0.006);
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: assets.get('glow'), color: '#ffe6ab', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })
    );
    halo.scale.setScalar(1.6);
    g.add(card, ink, halo);
    g.userData.setState = (visible, remembered) => {
      card.material = paperMat(tint, { side: THREE.DoubleSide, opacity: Math.max(0.001, visible) });
      inkMat.opacity = 0.9 * visible * (0.35 + 0.65 * remembered);
      inkMat.color.setStyle('#4a3830').lerp(new THREE.Color('#ffe6ab'), remembered);
      halo.material.opacity = 0.55 * remembered * visible;
    };
    return g;
  }

  function makeNameGlyph(i = 0, color = '#ffd47b') {
    const mat = new THREE.MeshBasicMaterial({
      map: assets.get(`name${i % 4}`),
      transparent: true,
      color,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending
    });
    return new THREE.Mesh(geo('glyphPlane', () => new THREE.PlaneGeometry(0.6, 0.24)), mat);
  }

  /* ---- birds ---- */

  // Cut-paper gull. Wings are two mirrored shapes so the flap reads in
  // silhouette even at dawn-flock distance.
  function makeGull(color = '#f2e3c4') {
    const g = new THREE.Group();
    const wingG = geo('gullWing', () => {
      const s = new THREE.Shape();
      s.moveTo(0, 0);
      s.quadraticCurveTo(0.2, 0.1, 0.42, 0.04);
      s.quadraticCurveTo(0.24, 0.02, 0.2, -0.06);
      s.lineTo(0, -0.02);
      s.closePath();
      return new THREE.ShapeGeometry(s);
    });
    const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, toneMapped: false });
    const left = new THREE.Mesh(wingG, mat);
    const right = new THREE.Mesh(wingG, mat);
    right.scale.x = -1;
    const body = new THREE.Mesh(geo('gullBody', () => new THREE.SphereGeometry(0.055, 6, 5)), mat);
    body.scale.set(1.7, 0.85, 0.85);
    g.add(left, right, body);
    g.userData.mat = mat;
    g.userData.flap = (t, amount = 1) => {
      const a = Math.sin(t * 7) * 0.75 * amount;
      left.rotation.y = a;
      right.rotation.y = -a;
      left.rotation.z = a * 0.22;
      right.rotation.z = -a * 0.22;
    };
    return g;
  }

  /* ---- keeper's handheld lantern ---- */

  function makeHandLantern() {
    const g = new THREE.Group();
    const cage = new THREE.Mesh(geo('lanternCage', () => new THREE.CylinderGeometry(0.1, 0.11, 0.24, 8, 1, true)), brassMat('#a17a3c'));
    const capG = geo('lanternCap', () => new THREE.CylinderGeometry(0.07, 0.11, 0.06, 8));
    const top = new THREE.Mesh(capG, brassMat('#8a6329'));
    top.position.y = 0.14;
    const bottom = new THREE.Mesh(capG, brassMat('#8a6329'));
    bottom.position.y = -0.14;
    bottom.rotation.x = Math.PI;
    const bail = new THREE.Mesh(geo('lanternBail', () => new THREE.TorusGeometry(0.07, 0.012, 4, 10, Math.PI)), brassMat('#a17a3c'));
    bail.position.y = 0.19;
    const flameMat = new THREE.MeshBasicMaterial({ color: '#ffd37d', toneMapped: false });
    const flame = new THREE.Mesh(geo('lanternFlame', () => new THREE.SphereGeometry(0.05, 8, 6)), flameMat);
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: assets.get('glow'), color: '#ffc46a', transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })
    );
    halo.scale.setScalar(0.85);
    const light = new THREE.PointLight('#ffd37d', 0.5, 5, 2);
    g.add(cage, top, bottom, bail, flame, halo, light);
    g.userData.light = light;
    g.userData.setFlame = (k, t) => {
      const flicker = 0.85 + Math.sin(t * 11) * 0.1 + Math.sin(t * 23) * 0.05;
      flame.scale.setScalar((0.7 + k * 0.6) * flicker);
      halo.material.opacity = (0.25 + k * 0.5) * flicker;
      halo.scale.setScalar((0.7 + k * 0.9) * flicker);
      light.intensity = (0.3 + k * 1.5) * flicker;
      flameMat.color.setStyle('#ffb347').lerp(new THREE.Color('#fff2c4'), k);
    };
    return g;
  }

  function makeRock(seed = 1, color = '#3a4a46') {
    const rnd = mulberry32(seed * 97 + 13);
    const mesh = new THREE.Mesh(
      geo(`rock:${seed % 3}`, () => new THREE.DodecahedronGeometry(0.55, 0)),
      new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.95 })
    );
    mesh.scale.set(0.8 + rnd() * 0.6, 0.55 + rnd() * 0.5, 0.8 + rnd() * 0.5);
    mesh.rotation.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI);
    return mesh;
  }

  /* ---- instanced atmospherics ---- */

  function shardMaterial(color = '#efe2c8', opacity = 1) {
    return new THREE.MeshBasicMaterial({
      map: assets.get('shard'),
      transparent: true,
      opacity,
      color,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false
    });
  }

  function makeShardInstances(count, color = '#efe2c8') {
    const mesh = new THREE.InstancedMesh(geo('shardPlane', () => new THREE.PlaneGeometry(0.5, 0.62)), shardMaterial(color), count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    return mesh;
  }

  // Foam crests, instanced: the storm's cheapest and loudest texture.
  function makeFoamInstances(count, color = '#cfe6e0') {
    const mesh = new THREE.InstancedMesh(
      geo('foamPlane', () => new THREE.PlaneGeometry(2.4, 1.2)),
      new THREE.MeshBasicMaterial({
        map: assets.get('foam'),
        color,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false
      }),
      count
    );
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    return mesh;
  }

  // Rain as instanced streaks — one draw call for the whole downpour.
  function makeRainInstances(count, color = '#9fc4c6') {
    const mesh = new THREE.InstancedMesh(
      geo('rainPlane', () => new THREE.PlaneGeometry(0.03, 0.7)),
      new THREE.MeshBasicMaterial({
        map: assets.get('streak'),
        color,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        toneMapped: false
      }),
      count
    );
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    return mesh;
  }

  /* ---- drifting motes: fireflies at dusk, silt underwater ---- */

  function makeMotes(count = 14, color = '#ffe6a0', spread = [12, 4, 8], seedOffset = 0) {
    const group = new THREE.Group();
    const rnd = mulberry32(count * 13 + 3 + seedOffset);
    const sprites = [];
    for (let i = 0; i < count; i++) {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: assets.get('glow'),
          color,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          fog: false
        })
      );
      const base = new THREE.Vector3((rnd() - 0.5) * spread[0], rnd() * spread[1] + 0.4, (rnd() - 0.5) * spread[2]);
      s.position.copy(base);
      s.scale.setScalar(0.22 + rnd() * 0.28);
      s.userData = { base, phase: rnd() * Math.PI * 2, speed: 0.3 + rnd() * 0.5, rad: 0.4 + rnd() * 0.9, blink: 0.5 + rnd() * 1.6 };
      group.add(s);
      sprites.push(s);
    }
    group.userData.update = (time, motion = 1, level = 1) => {
      for (const s of sprites) {
        const u = s.userData;
        s.position.set(
          u.base.x + Math.sin(time * u.speed + u.phase) * u.rad * motion,
          u.base.y + Math.cos(time * u.speed * 0.7 + u.phase) * u.rad * 0.6 * motion,
          u.base.z + Math.sin(time * u.speed * 0.5 + u.phase * 1.3) * u.rad * motion
        );
        s.material.opacity = (0.32 + 0.34 * Math.sin(time * u.blink + u.phase)) * level;
      }
    };
    return group;
  }

  return {
    /** Raw texture access, for the rare material a scene must build itself. */
    tex: (name) => assets.get(name),
    paperMat,
    woodMat,
    brassMat,
    geo,
    makeHeadland,
    makeSeaRidge,
    makeCloud,
    makeCottage,
    makeLighthouse,
    makePiling,
    makeDeck,
    makeDory,
    makeBuoy,
    makeCrate,
    makeBarrel,
    makeNet,
    makeRope,
    makeNameCard,
    makeNameGlyph,
    makeGull,
    makeHandLantern,
    makeRock,
    shardMaterial,
    makeShardInstances,
    makeFoamInstances,
    makeRainInstances,
    makeMotes
  };
}
