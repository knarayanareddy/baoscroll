import * as THREE from 'three';

// The lamp. Deliberately not a glass-and-chrome lens: it is a paper-light
// mechanism — cream vellum prisms in a gold brass cage, the same material
// language as the rest of the coast, so when it finally turns on it reads
// as the world's own paper catching fire rather than as a light source
// borrowed from another render.
//
// Everything is a function of (power, time). The wheel is geared to the
// rotation, so turning the wheel back turns the lamp back.
export class FresnelLamp {
  constructor(kit) {
    this.root = new THREE.Group();
    this.tiers = [];
    this.panels = [];

    // brass cage: four uprights and a crown, the structure that holds the
    // paper in a ring
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const upright = new THREE.Mesh(new THREE.BoxGeometry(0.09, 2.5, 0.09), kit.brassMat('#a17a3c'));
      upright.position.set(Math.cos(a) * 1.28, 0.35, Math.sin(a) * 1.28);
      this.root.add(upright);
    }
    for (const y of [-0.92, 1.6]) {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.055, 6, 24), kit.brassMat('#8a6329'));
      hoop.rotation.x = Math.PI / 2;
      hoop.position.y = y;
      this.root.add(hoop);
    }

    // five tiers of vellum prisms; each tier counter-rotates against its
    // neighbours, which is what makes the light look mechanical
    for (let i = 0; i < 5; i++) {
      const radius = 0.56 + i * 0.15;
      const tier = new THREE.Group();
      tier.position.y = -0.6 + i * 0.32;
      this.root.add(tier);
      this.tiers.push(tier);

      const rim = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.04, 0.032, 6, 26), kit.brassMat(i % 2 ? '#b08b45' : '#8a6329'));
      rim.rotation.x = Math.PI / 2;
      tier.add(rim);

      const count = 14 + i * 2;
      for (let j = 0; j < count; j++) {
        const a = (j / count) * Math.PI * 2;
        const panel = new THREE.Mesh(
          new THREE.PlaneGeometry(0.2, 0.28 + i * 0.02),
          new THREE.MeshBasicMaterial({
            map: kit.tex('paper'),
            color: '#f6e6bd',
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            depthWrite: false,
            toneMapped: false
          })
        );
        panel.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
        panel.rotation.y = -a;
        tier.add(panel);
        this.panels.push({ node: panel, tier: i, index: j });
      }
    }

    /* ---- the core: where names are held once they are inside ---- */
    this.coreMat = new THREE.MeshBasicMaterial({ color: '#ffe3a0', transparent: true, opacity: 0.9, toneMapped: false });
    this.core = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), this.coreMat);
    this.root.add(this.core);
    this.coreHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: kit.tex('glow'), color: '#fff3cd', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })
    );
    this.coreHalo.scale.setScalar(2);
    this.root.add(this.coreHalo);
    this.light = new THREE.PointLight('#ffd278', 0, 44, 2);
    this.root.add(this.light);

    /* ---- the wheel he turns, with real handles to grip ---- */
    this.wheel = new THREE.Group();
    this.wheel.position.set(1.5, -0.5, 0);
    this.root.add(this.wheel);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.055, 8, 22), kit.brassMat('#bd8740'));
    this.wheel.add(rim);
    for (let i = 0; i < 6; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.82, 0.06), kit.brassMat('#a17a3c'));
      spoke.rotation.z = (i * Math.PI) / 3;
      this.wheel.add(spoke);
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.16, 6), kit.woodMat('#5b4030'));
      const a = (i * Math.PI) / 3;
      handle.position.set(Math.cos(a) * 0.42, Math.sin(a) * 0.42, 0.1);
      handle.rotation.x = Math.PI / 2;
      this.wheel.add(handle);
    }
    this.gripA = new THREE.Object3D();
    this.gripA.position.set(0.42, 0, 0.14);
    this.wheel.add(this.gripA);
    this.gripB = new THREE.Object3D();
    this.gripB.position.set(-0.42, 0, 0.14);
    this.wheel.add(this.gripB);

    // the gearing between wheel and lamp, visible so the link is legible
    this.pinion = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 12), kit.brassMat('#8a6329'));
    this.pinion.position.set(0.95, -0.5, 0);
    this.root.add(this.pinion);
  }

  /**
   * power 0..1 — how much of the lamp is alight.
   * Returns the current rotation so scenes can hang the beam (and the
   * chapter transition) off the same number.
   */
  setPower(power, time) {
    const spin = time * (0.25 + power * 0.55);
    this.tiers.forEach((tier, i) => {
      tier.rotation.y = spin * (i % 2 ? 1 : -1) * (0.6 + i * 0.14) + power * (i % 2 ? 1 : -1) * 0.8;
      tier.position.y = -0.6 + i * 0.32 + Math.sin(time * 0.9 + i) * 0.012 * power;
    });
    this.panels.forEach((p) => {
      // panels catch the core light in sequence as the tiers turn
      const phase = Math.sin(time * 2 + p.index * 0.6 + p.tier * 1.1);
      p.node.material.opacity = 0.18 + power * (0.35 + phase * 0.3);
    });

    this.core.scale.setScalar(0.6 + power * 1.1);
    this.coreMat.opacity = 0.55 + power * 0.45;
    this.coreMat.color.setStyle('#ffcf85').lerp(new THREE.Color('#fff8dc'), power);
    this.coreHalo.material.opacity = power * 0.75;
    this.coreHalo.scale.setScalar(1.6 + power * 3.4);
    this.light.intensity = power * 5.2;

    this.wheel.rotation.z = -power * Math.PI * 3.4;
    this.pinion.rotation.y = power * Math.PI * 6;
    return spin;
  }
}
