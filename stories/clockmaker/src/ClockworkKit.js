import * as THREE from 'three';

// Shared authored vocabulary for every Clockmaker scene. Scenes compose these
// objects; they do not invent untextured gears or generic steampunk clutter.
export class ClockworkKit {
  constructor() {
    this.geometries = new Map();
    this.materials = new Map();
  }

  material(kind, color, { transparent = false, opacity = 1, emissive = null } = {}) {
    const key = `${kind}:${color}:${opacity}:${emissive || ''}`;
    if (!this.materials.has(key)) {
      const options = { color, transparent: transparent || opacity < 1, opacity, flatShading: true };
      if (kind === 'brass') options.emissive = emissive || '#241708';
      this.materials.set(key, kind === 'brass' ? new THREE.MeshLambertMaterial(options) : new THREE.MeshLambertMaterial(options));
    }
    return this.materials.get(key);
  }

  gear({ teeth = 18, radius = 1, depth = 0.22, color = '#b98a43' } = {}) {
    const root = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * .82, radius * .82, depth, 24), this.material('brass', color));
    rim.rotation.x = Math.PI / 2; root.add(rim);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * .2, radius * .2, depth * 1.35, 12), this.material('brass', '#8b632c'));
    hub.rotation.x = Math.PI / 2; root.add(hub);
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(radius * .22, radius * .11, depth * 1.1), this.material('brass', color));
      tooth.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0);
      tooth.rotation.z = a; root.add(tooth);
    }
    root.userData.radius = radius;
    return root;
  }

  clockFace({ radius = 1.4, color = '#eee1bd', handColor = '#a74137' } = {}) {
    const root = new THREE.Group();
    const face = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), this.material('enamel', color)); root.add(face);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, .055, 8, 48), this.material('brass', '#a87938')); root.add(rim);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2; const tick = new THREE.Mesh(new THREE.BoxGeometry(.035, radius * .14, .025), this.material('ink', '#2a2830'));
      tick.position.set(Math.sin(a) * radius * .78, Math.cos(a) * radius * .78, .04); tick.rotation.z = -a; root.add(tick);
    }
    const minutePivot = new THREE.Group(); const minute = new THREE.Mesh(new THREE.BoxGeometry(.045, radius * .72, .045), this.material('thread', handColor)); minute.position.y = radius * .36; minutePivot.add(minute); minutePivot.position.z = .08; root.add(minutePivot);
    const hourPivot = new THREE.Group(); const hour = new THREE.Mesh(new THREE.BoxGeometry(.055, radius * .48, .05), this.material('brass', '#6f512c')); hour.position.y = radius * .24; hourPivot.position.z = .1; hourPivot.add(hour); root.add(hourPivot);
    root.userData.minute = minutePivot; root.userData.hour = hourPivot;
    return root;
  }

  pendulum({ length = 4, color = '#b98a43' } = {}) {
    const root = new THREE.Group(); const rod = new THREE.Mesh(new THREE.BoxGeometry(.08, length, .08), this.material('brass', color)); rod.position.y = -length / 2; root.add(rod);
    const bob = new THREE.Mesh(new THREE.SphereGeometry(.35, 16, 12), this.material('brass', '#c79a4e')); bob.position.y = -length; root.add(bob);
    return root;
  }

  blueprint({ width = 4, height = 3 } = {}) {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 384; const c = canvas.getContext('2d');
    c.fillStyle = '#e9dfc6'; c.fillRect(0, 0, 512, 384); c.strokeStyle = 'rgba(49,70,91,.55)'; c.lineWidth = 2;
    for (let x = 28; x < 512; x += 55) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 384); c.stroke(); }
    for (let y = 28; y < 384; y += 48) { c.beginPath(); c.moveTo(0, y); c.lineTo(512, y); c.stroke(); }
    c.strokeStyle = '#34546e'; c.lineWidth = 4; c.beginPath(); c.arc(256, 190, 82, 0, Math.PI * 2); c.stroke(); c.strokeRect(136, 72, 240, 236);
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
    return mesh;
  }

  redThread(points) {
    return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 48, .025, 6, false), this.material('thread', '#b33432'));
  }
}
