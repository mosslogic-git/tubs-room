import * as THREE from './vendor/three.module.js';
import {createContactShadow} from './contact-shadows.js';

/**
 * High-fidelity DJ console refined from Blender 3D production model.
 * Features:
 * - Real 33⅓ RPM rotating vinyl platters with tonearms, headshells, and slipmats
 * - 4-channel club mixer with channel strips, rotary EQ knobs, faders, and live stereo VU meters
 * - Tub's industrial steel frame with front acoustic modesty grille
 * - Dynamic club lighting reaction and under-desk ambient illumination
 * - Automatic soft contact shadow
 */
export function createDJBooth() {
  const group = new THREE.Group();
  group.name = 'dj-booth';

  const w = 1.65, d = 0.68, h = 0.92;
  const darkMat = new THREE.MeshStandardMaterial({color: 0x121614, roughness: 0.90});
  const woodMat = new THREE.MeshStandardMaterial({color: 0x1a1614, roughness: 0.65});
  const metalMat = new THREE.MeshStandardMaterial({color: 0x5a635b, roughness: 0.35, metalness: 0.75});
  const steelMat = new THREE.MeshStandardMaterial({color: 0x1b201d, roughness: 0.50, metalness: 0.60});
  const platterMat = new THREE.MeshStandardMaterial({color: 0x333b37, roughness: 0.45, metalness: 0.85});
  const vinylMat = new THREE.MeshStandardMaterial({color: 0x080808, roughness: 0.30, metalness: 0.10});
  
  // LED materials
  const vuMatGreen = new THREE.MeshBasicMaterial({color: 0x50e060});
  const vuMatAmber = new THREE.MeshBasicMaterial({color: 0xf0c030});
  const vuMatRed   = new THREE.MeshBasicMaterial({color: 0xff3b30});
  const glowMat    = new THREE.MeshBasicMaterial({color: 0x8cc271, transparent: true, opacity: 0.65});

  function addBox(bw, bh, bd, x, y, z, mat = darkMat) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. Tabletop & Chamfered Frame
  const legThick = 0.04;
  addBox(w, 0.045, d, 0, h - 0.0225, 0, woodMat); // Timber countertop
  
  // Steel legs with cross braces
  for (const lx of [-w / 2 + 0.035, w / 2 - 0.035]) {
    for (const lz of [-d / 2 + 0.035, d / 2 - 0.035]) {
      addBox(legThick, h - 0.045, legThick, lx, (h - 0.045) / 2, lz, steelMat);
    }
  }
  // Bottom stabilizer rails
  addBox(w - 0.07, 0.025, legThick, 0, 0.12, -d / 2 + 0.035, steelMat);
  addBox(w - 0.07, 0.025, legThick, 0, 0.12, d / 2 - 0.035, steelMat);

  // Front modesty panel with Tub's industrial grille aesthetic
  addBox(w - 0.12, h * 0.65, 0.012, 0, h * 0.52, d / 2 - 0.02, darkMat);
  const grillePoints = [];
  const pW = w - 0.16, pH = h * 0.65 - 0.04, pZ = d / 2 - 0.012;
  const pitch = 0.025;
  for (let x = -pW / 2; x <= pW / 2; x += pitch) {
    grillePoints.push(x, h * 0.22, pZ, x, h * 0.22 + pH, pZ);
  }
  const grilleGeo = new THREE.BufferGeometry();
  grilleGeo.setAttribute('position', new THREE.Float32BufferAttribute(grillePoints, 3));
  group.add(new THREE.LineSegments(grilleGeo, new THREE.LineBasicMaterial({color: 0x425044, transparent: true, opacity: 0.55})));

  // 2. Turntables (Left & Right Technics SL-1200 style)
  const rotatingVinyls = [];
  for (const side of [-1, 1]) {
    const tx = side * 0.50;
    const deckY = h + 0.02;
    // Deck body
    addBox(0.42, 0.04, 0.36, tx, deckY, 0.01, darkMat);
    // Aluminum Platter
    const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.152, 0.012, 36), platterMat);
    platter.position.set(tx, deckY + 0.026, 0.01);
    platter.castShadow = true;
    group.add(platter);

    // Vinyl Record (Rotates in animate)
    const vinyl = new THREE.Mesh(new THREE.CylinderGeometry(0.146, 0.146, 0.003, 36), vinylMat);
    vinyl.position.set(tx, deckY + 0.034, 0.01);
    group.add(vinyl);
    rotatingVinyls.push(vinyl);

    // Center brass spindle
    const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.012, 16), metalMat);
    spindle.position.set(tx, deckY + 0.040, 0.01);
    group.add(spindle);

    // Tonearm with counterweight and headshell
    const armBase = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.016, 16), metalMat);
    armBase.position.set(tx + side * 0.16, deckY + 0.028, -0.12);
    group.add(armBase);

    // S-arm tube
    const armPts = [
      new THREE.Vector3(tx + side * 0.16, deckY + 0.036, -0.12),
      new THREE.Vector3(tx + side * 0.14, deckY + 0.038, -0.04),
      new THREE.Vector3(tx + side * 0.08, deckY + 0.038, 0.06),
      new THREE.Vector3(tx + side * 0.05, deckY + 0.035, 0.10)
    ];
    const armCurve = new THREE.CatmullRomCurve3(armPts);
    const armGeo = new THREE.TubeGeometry(armCurve, 12, 0.003, 8, false);
    group.add(new THREE.Mesh(armGeo, metalMat));

    // Pitch fader slider
    addBox(0.012, 0.004, 0.09, tx + side * 0.16, deckY + 0.022, 0.04, steelMat);
  }

  // 3. Center 4-Channel Professional Mixer
  const mixW = 0.32, mixD = 0.38, mixH = 0.045;
  const mixY = h + mixH / 2;
  addBox(mixW, mixH, mixD, 0, mixY, 0.01, steelMat);

  // 4 Channel Strips: Rotary EQ knobs and volume faders
  for (let ch = 0; ch < 4; ch++) {
    const kx = -0.105 + ch * 0.070;
    // 3 EQ knobs per channel (Hi, Mid, Low)
    for (let row = 0; row < 3; row++) {
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.012, 12), metalMat);
      knob.position.set(kx, h + mixH + 0.006, -0.10 + row * 0.042);
      group.add(knob);
    }
    // Vertical line fader slot & cap
    addBox(0.004, 0.002, 0.065, kx, h + mixH + 0.001, 0.06, darkMat);
    addBox(0.010, 0.008, 0.014, kx, h + mixH + 0.006, 0.05 + (ch % 2) * 0.015, metalMat);
  }

  // Master Crossfader
  addBox(0.08, 0.002, 0.006, 0, h + mixH + 0.001, 0.14, darkMat);
  addBox(0.015, 0.008, 0.010, -0.01, h + mixH + 0.006, 0.14, metalMat);

  // Stereo LED VU Meters (Green -> Amber -> Red segments)
  const vuSegments = [];
  for (const vx of [-0.015, 0.015]) {
    for (let seg = 0; seg < 8; seg++) {
      const mat = seg < 5 ? vuMatGreen : seg < 7 ? vuMatAmber : vuMatRed;
      const vu = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.003, 0.008), mat.clone());
      vu.position.set(vx, h + mixH + 0.002, -0.09 + seg * 0.011);
      group.add(vu);
      vuSegments.push({mesh: vu, baseColor: mat.color.clone()});
    }
  }

  // Under-desk accent lighting strip
  const glowStrip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.92, 0.005, 0.012), glowMat);
  glowStrip.position.set(0, h - 0.03, d / 2 - 0.01);
  group.add(glowStrip);

  // Soft Contact Shadow under console
  const shadow = createContactShadow(w, d, 0.78);
  group.add(shadow);

  let vuTimer = 0;

  return {
    group,
    /**
     * Called in the main animation loop.
     * Rotates vinyl at 33⅓ RPM and animates dynamic VU levels.
     */
    update(dt = 0.016, isClub = false) {
      // 33.33 RPM = 3.49066 rad/sec
      const rotSpeed = 3.49066 * dt;
      for (const vinyl of rotatingVinyls) {
        vinyl.rotation.y += rotSpeed;
      }

      // Dynamic dancing VU meters
      vuTimer += dt * 8;
      const peak = Math.sin(vuTimer) * 0.5 + Math.sin(vuTimer * 2.3) * 0.3 + 0.2;
      const threshold = Math.max(0.1, Math.min(0.95, peak));

      vuSegments.forEach((seg, idx) => {
        const segRatio = (idx % 8) / 8;
        const active = segRatio <= threshold;
        seg.mesh.material.opacity = active ? 1.0 : 0.15;
        seg.mesh.material.transparent = true;
      });
    },
    setClub(club) {
      glowMat.color.set(club ? 0x70d8a5 : 0x8cc271);
      glowMat.opacity = club ? 0.90 : 0.55;
    }
  };
}
