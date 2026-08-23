import * as THREE from 'three';

// The Keeping Book — the object the whole story is about. A weathered
// ledger of every sailor the coast has sent out, open on the desk.
//
// The erasure is not a fade. Ink is dissolved along a noise field shaped
// like laid-paper fibres, with a wet reddish bleed running just ahead of
// the front, so the name looks like it is being drawn out of the sheet
// rather than turned transparent. It is a pure function of (erase, time),
// so scrolling back re-absorbs the name exactly.

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uInk;
  uniform float uErase;
  uniform float uTime;
  uniform float uGlow;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  // Fibres are long and horizontal, so the noise is stretched in x.
  float fibre(vec2 p) {
    float n = 0.0;
    n += noise(p * vec2(2.0, 9.0)) * 0.55;
    n += noise(p * vec2(5.0, 21.0)) * 0.30;
    n += noise(p * vec2(11.0, 47.0)) * 0.15;
    return n;
  }

  void main() {
    vec4 ink = texture2D(uInk, vUv);
    if (ink.a < 0.01) discard;

    float f = fibre(vUv + vec2(uTime * 0.006, 0.0));
    // the dissolve front crosses the word, but wanders with the fibres
    float front = uErase * 1.5 - 0.25;
    float d = vUv.x * 0.72 + f * 0.46;
    float gone = smoothstep(front - 0.14, front + 0.05, d);

    // wet bleed: pigment pushed ahead of the front before it lets go
    float bleed = smoothstep(0.0, 0.4, gone) * smoothstep(1.0, 0.5, gone);

    vec3 dry = vec3(0.28, 0.20, 0.16);
    vec3 wet = vec3(0.52, 0.20, 0.22);
    vec3 lit = vec3(1.0, 0.86, 0.55);
    vec3 col = mix(dry, wet, bleed);
    col = mix(col, lit, uGlow);

    float alpha = ink.a * (1.0 - gone) + ink.a * bleed * 0.5;
    alpha = max(alpha, ink.a * uGlow * 0.85 * (1.0 - gone));
    gl_FragColor = vec4(col, alpha);
  }
`;

function pageTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 700;
  const x = c.getContext('2d');
  x.fillStyle = '#e9dcbf';
  x.fillRect(0, 0, c.width, c.height);
  // foxing and damp staining at the edges
  for (let i = 0; i < 90; i++) {
    const px = Math.random() * c.width;
    const py = Math.random() * c.height;
    const r = 8 + Math.random() * 70;
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, `rgba(150,116,74,${0.02 + Math.random() * 0.05})`);
    g.addColorStop(1, 'rgba(150,116,74,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, c.width, c.height);
  }
  x.strokeStyle = 'rgba(140,110,74,0.5)';
  x.lineWidth = 3;
  x.strokeRect(34, 30, c.width - 68, c.height - 60);
  x.strokeStyle = 'rgba(150,126,92,0.42)';
  x.lineWidth = 1.6;
  for (let i = 0; i < 9; i++) {
    x.beginPath();
    x.moveTo(96, 190 + i * 54);
    x.lineTo(c.width - 96, 190 + i * 54);
    x.stroke();
  }
  // the centre gutter, so it reads as a bound spread
  const gutter = x.createLinearGradient(c.width / 2 - 26, 0, c.width / 2 + 26, 0);
  gutter.addColorStop(0, 'rgba(96,72,48,0)');
  gutter.addColorStop(0.5, 'rgba(96,72,48,0.3)');
  gutter.addColorStop(1, 'rgba(96,72,48,0)');
  x.fillStyle = gutter;
  x.fillRect(c.width / 2 - 26, 30, 52, c.height - 60);

  x.fillStyle = 'rgba(96,72,54,0.85)';
  x.font = 'italic 26px Georgia, serif';
  x.fillText('The Keeping Book — Lantern House, North Head', 96, 112);
  x.font = 'italic 22px Georgia, serif';
  x.fillText('sailed', 700, 112);

  // earlier entries, already faint with age
  const past = ['Mara Venn', 'Tomas Reed', 'Jun Orr', 'Sera Vale', 'Nadi Floe', 'Fen Ard', 'Lio March'];
  x.font = 'italic 30px Georgia, serif';
  past.forEach((name, i) => {
    x.fillStyle = `rgba(74,56,46,${0.34 + (i % 3) * 0.08})`;
    x.fillText(name, 110, 238 + i * 54);
    x.fillText(`18${52 + i * 3}`, 720, 238 + i * 54);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// The hero name, alone on transparent ground so the shader can dissolve
// it without touching the page underneath.
function nameTexture(name) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 200;
  const x = c.getContext('2d');
  x.font = 'italic 116px Georgia, serif';
  x.textBaseline = 'middle';
  x.fillStyle = '#ffffff';
  x.fillText(name, 40, 108);
  // a second slightly offset pass thickens the stroke like a wet nib
  x.globalAlpha = 0.55;
  x.fillText(name, 42, 106);
  const t = new THREE.CanvasTexture(c);
  return t;
}

export class KeepingBook {
  constructor(kit, { name = 'ELIAS RUNE' } = {}) {
    this.root = new THREE.Group();

    const cover = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.16, 2.6), kit.paperMat('#5d3634', { lit: true }));
    cover.position.y = -0.09;
    this.root.add(cover);
    // the block of pages beneath the open spread
    const block = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.1, 2.45), kit.paperMat('#dccfae', { lit: true }));
    block.position.y = -0.02;
    this.root.add(block);

    this.pageMat = new THREE.MeshBasicMaterial({ map: pageTexture(), side: THREE.DoubleSide, toneMapped: false });
    this.page = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.32), this.pageMat);
    this.page.rotation.x = -Math.PI / 2;
    this.page.position.y = 0.035;
    this.root.add(this.page);

    this.inkUniforms = {
      uInk: { value: nameTexture(name) },
      uErase: { value: 0 },
      uTime: { value: 0 },
      uGlow: { value: 0 }
    };
    this.inkMat = new THREE.ShaderMaterial({
      uniforms: this.inkUniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.nameMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.51), this.inkMat);
    this.nameMesh.rotation.x = -Math.PI / 2;
    this.nameMesh.position.set(-0.24, 0.04, 0.62);
    this.root.add(this.nameMesh);

    // Ink that has already left the page, lifting as dry flecks.
    this.flecks = new THREE.Group();
    this.root.add(this.flecks);
    for (let i = 0; i < 30; i++) {
      const fleck = new THREE.Mesh(
        new THREE.PlaneGeometry(0.035 + (i % 4) * 0.012, 0.035 + (i % 3) * 0.01),
        new THREE.MeshBasicMaterial({ color: i % 4 ? '#4a382f' : '#8c3940', transparent: true, opacity: 0, depthWrite: false, toneMapped: false })
      );
      fleck.userData = {
        x: -1.4 + (i % 10) * 0.28,
        z: 0.5 + ((i * 7) % 5) * 0.06,
        delay: (i % 10) / 10,
        spin: (i % 5) - 2
      };
      this.flecks.add(fleck);
    }

    // where names leave from, for chapter five
    this.nameAnchor = new THREE.Object3D();
    this.nameAnchor.position.set(-0.24, 0.1, 0.62);
    this.root.add(this.nameAnchor);

    const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 1.5), kit.paperMat('#a75b42', { lit: true, side: THREE.DoubleSide }));
    ribbon.rotation.x = -Math.PI / 2;
    ribbon.position.set(0.9, 0.045, 0.4);
    ribbon.rotation.z = 0.2;
    this.root.add(ribbon);
  }

  /** 0 = the name is whole, 1 = the page is blank where it stood. */
  setErasure(k, time) {
    this.inkUniforms.uErase.value = k;
    this.inkUniforms.uTime.value = time;
    this.flecks.children.forEach((fleck, i) => {
      const u = fleck.userData;
      const lift = Math.max(0, Math.min(1, (k - u.delay * 0.55) * 2.2));
      fleck.position.set(
        u.x + Math.sin(time * 1.3 + i) * 0.06 * lift,
        0.05 + lift * (0.42 + (i % 5) * 0.12),
        u.z + Math.cos(time * 0.9 + i) * 0.05 * lift
      );
      fleck.rotation.set(lift * u.spin * 0.9, time * 0.4 + i, lift * 1.6);
      // bright as it leaves, gone once it is above the lamp
      fleck.material.opacity = Math.sin(lift * Math.PI) * 0.85;
    });
  }

  /** Chapter five: what survived, lit from inside the paper. */
  setGlow(k) {
    this.inkUniforms.uGlow.value = k;
  }
}
