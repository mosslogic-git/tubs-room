import * as THREE from './vendor/three.module.js';

export function createStudioSuite() {
  const group = new THREE.Group();
  group.name = 'studio-suite';

  // Materials
  const blackDeskMat = new THREE.MeshStandardMaterial({
    color: 0x141619,
    roughness: 0.45,
    metalness: 0.15
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1c1f24,
    roughness: 0.35,
    metalness: 0.8
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0x8a929b,
    roughness: 0.2,
    metalness: 0.95
  });
  const armrestMat = new THREE.MeshStandardMaterial({
    color: 0x0f1113,
    roughness: 0.85
  });
  const rackPanelMat = new THREE.MeshStandardMaterial({
    color: 0x181c20,
    roughness: 0.5,
    metalness: 0.4
  });
  const silverFaceMat = new THREE.MeshStandardMaterial({
    color: 0xabb4be,
    roughness: 0.3,
    metalness: 0.75
  });
  const amberVuMat = new THREE.MeshBasicMaterial({
    color: 0xffaa33
  });
  const blueLedMat = new THREE.MeshBasicMaterial({
    color: 0x2288ff
  });
  const greenLedMat = new THREE.MeshBasicMaterial({
    color: 0x33dd66
  });
  const meshChairMat = new THREE.MeshStandardMaterial({
    color: 0x1e2226,
    roughness: 0.88,
    metalness: 0.1
  });
  const rugMat = new THREE.MeshStandardMaterial({
    color: 0x6e747b,
    roughness: 0.96
  });
  const slatWoodMat = new THREE.MeshStandardMaterial({
    color: 0x181b1f,
    roughness: 0.75,
    metalness: 0.1
  });

  // Helper box
  function createBox(w, h, d, mat, px = 0, py = 0, pz = 0, parent = group) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(px, py, pz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // 1. PLUSH STUDIO AREA RUG (Floor)
  const rugW = 3.6, rugD = 2.8;
  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(rugW, rugD),
    rugMat
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.003, -0.7);
  rug.receiveShadow = true;
  group.add(rug);

  // 2. MAIN MIXING CONSOLE DESK
  const deskGroup = new THREE.Group();
  deskGroup.position.set(0, 0, -1.35);
  group.add(deskGroup);

  // Desk heavy pedestals / legs
  for (const lx of [-1.15, 1.15]) {
    // Floor foot
    createBox(0.28, 0.05, 0.9, darkMetalMat, lx, 0.025, 0, deskGroup);
    // Vertical column
    createBox(0.18, 0.65, 0.22, darkMetalMat, lx, 0.375, 0, deskGroup);
    createBox(0.24, 0.04, 0.7, darkMetalMat, lx, 0.71, 0, deskGroup);
  }
  // Central cable / cross beam
  createBox(2.1, 0.14, 0.08, darkMetalMat, 0, 0.35, 0, deskGroup);

  // Main work surface & frame
  const deskWidth = 2.65;
  createBox(deskWidth, 0.06, 0.96, blackDeskMat, 0, 0.74, 0.05, deskGroup);

  // Padded leatherette armrest on front edge
  const armrest = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, deskWidth, 24),
    armrestMat
  );
  armrest.rotation.z = Math.PI / 2;
  armrest.position.set(0, 0.75, 0.52);
  armrest.castShadow = true;
  deskGroup.add(armrest);

  // Angled Rack Bays & Mixing Surface (Left, Center-Left, Center-Right, Right)
  const bayW = 0.58;
  const bayGroup = new THREE.Group();
  bayGroup.position.set(0, 0.77, 0.08);
  deskGroup.add(bayGroup);

  // Slanted console face
  const consoleAngle = -0.22; // ~12 degrees slant towards engineer
  const faceGroup = new THREE.Group();
  faceGroup.rotation.x = consoleAngle;
  bayGroup.add(faceGroup);

  for (let b = 0; b < 4; b++) {
    const bx = (b - 1.5) * (bayW + 0.04);
    createBox(bayW, 0.42, 0.03, rackPanelMat, bx, 0.21, 0, faceGroup);

    if (b === 0 || b === 3) {
      // Analog Outboard Fader/Knob Channel Strips
      for (let ch = 0; ch < 6; ch++) {
        const cx = bx - bayW / 2 + 0.05 + ch * 0.095;
        createBox(0.012, 0.16, 0.01, darkMetalMat, cx, 0.11, 0.018, faceGroup);
        createBox(0.024, 0.018, 0.016, silverFaceMat, cx, 0.11 + (ch % 3) * 0.03, 0.026, faceGroup);
        for (let k = 0; k < 3; k++) {
          const knob = new THREE.Mesh(
            new THREE.CylinderGeometry(0.012, 0.012, 0.012, 16),
            darkMetalMat
          );
          knob.rotation.x = Math.PI / 2;
          knob.position.set(cx, 0.25 + k * 0.055, 0.02);
          faceGroup.add(knob);
        }
      }
    } else {
      // Mastering Equalizers, Compressors & Glowing VU meters
      createBox(bayW - 0.03, 0.12, 0.02, silverFaceMat, bx, 0.09, 0.018, faceGroup);
      for (const vx of [-0.12, 0.12]) {
        const vuBezel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.034, 0.034, 0.01, 24),
          darkMetalMat
        );
        vuBezel.rotation.x = Math.PI / 2;
        vuBezel.position.set(bx + vx, 0.1, 0.026);
        faceGroup.add(vuBezel);

        const vuFace = new THREE.Mesh(
          new THREE.CircleGeometry(0.028, 24),
          amberVuMat
        );
        vuFace.position.set(bx + vx, 0.1, 0.032);
        faceGroup.add(vuFace);

        const needle = new THREE.Mesh(
          new THREE.BoxGeometry(0.002, 0.024, 0.001),
          blackDeskMat
        );
        needle.position.set(bx + vx + 0.004, 0.104, 0.033);
        needle.rotation.z = -0.3;
        faceGroup.add(needle);
      }

      createBox(bayW - 0.03, 0.13, 0.02, rackPanelMat, bx, 0.24, 0.018, faceGroup);
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 8; col++) {
          const btn = new THREE.Mesh(
            new THREE.BoxGeometry(0.032, 0.024, 0.008),
            (col % 2 === 0) ? blueLedMat : greenLedMat
          );
          btn.position.set(bx - 0.2 + col * 0.056, 0.21 + row * 0.045, 0.028);
          faceGroup.add(btn);
        }
      }
    }
  }

  // Top Meter Bridge Shelf
  const bridgeY = 0.96;
  createBox(deskWidth + 0.06, 0.05, 0.36, blackDeskMat, 0, bridgeY, -0.22, deskGroup);

  // 3. CENTRAL WIDESCREEN DAW DISPLAY (Spectrum Analyzer)
  const dCanvas = document.createElement('canvas');
  dCanvas.width = 512;
  dCanvas.height = 256;
  const dCtx = dCanvas.getContext('2d');
  const dTexture = new THREE.CanvasTexture(dCanvas);
  dTexture.colorSpace = THREE.SRGBColorSpace;

  const dawScreenMat = new THREE.MeshBasicMaterial({
    map: dTexture
  });

  const screenW = 1.05, screenH = 0.58;
  const monitorFrame = createBox(screenW + 0.04, screenH + 0.04, 0.04, darkMetalMat, 0, bridgeY + 0.38, -0.28, deskGroup);
  const monitorDisplay = new THREE.Mesh(
    new THREE.PlaneGeometry(screenW, screenH),
    dawScreenMat
  );
  monitorDisplay.position.set(0, 0, 0.022);
  monitorFrame.add(monitorDisplay);

  // Stand
  createBox(0.28, 0.03, 0.22, darkMetalMat, 0, bridgeY + 0.03, -0.32, deskGroup);
  createBox(0.06, 0.35, 0.05, darkMetalMat, 0, bridgeY + 0.19, -0.32, deskGroup);

  function renderDawScreen(time = 0, soundLevel = 0.75) {
    dCtx.fillStyle = '#0a0d12';
    dCtx.fillRect(0, 0, 512, 256);

    // DAW Top Bar
    dCtx.fillStyle = '#141a22';
    dCtx.fillRect(0, 0, 512, 24);
    dCtx.fillStyle = '#4ade80';
    dCtx.font = 'bold 11px system-ui, sans-serif';
    dCtx.fillText('MASTERING SUITE — 96kHz / 32-bit float', 14, 16);
    dCtx.fillStyle = '#94a3b8';
    dCtx.fillText('PEAK: -0.3 dBFS   RMS: -14.2 LUFS', 320, 16);

    // Grid lines
    dCtx.strokeStyle = '#1e293b';
    dCtx.lineWidth = 1;
    for (let y = 40; y < 240; y += 32) {
      dCtx.beginPath();
      dCtx.moveTo(0, y);
      dCtx.lineTo(512, y);
      dCtx.stroke();
    }
    for (let x = 32; x < 512; x += 64) {
      dCtx.beginPath();
      dCtx.moveTo(x, 24);
      dCtx.lineTo(x, 240);
      dCtx.stroke();
    }

    // Spectrum Analyzer Bars
    const numBars = 48;
    const barW = 8;
    const spacing = 10.4;
    for (let i = 0; i < numBars; i++) {
      const freq = i / numBars;
      const wave = Math.sin(time * 4.5 + i * 0.35) * 0.25 + Math.cos(time * 3.2 - i * 0.2) * 0.18;
      const bassBoost = Math.max(0, 1 - freq * 2.2) * 0.45;
      const rolloff = Math.exp(-freq * 1.5);
      const hNorm = Math.min(1, Math.max(0.08, (rolloff * 0.75 + bassBoost + wave) * soundLevel));
      const barH = hNorm * 180;
      const bx = 12 + i * spacing;
      const by = 238 - barH;

      const grad = dCtx.createLinearGradient(0, 238, 0, 58);
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.5, '#10b981');
      grad.addColorStop(0.85, '#f59e0b');
      grad.addColorStop(1, '#ef4444');

      dCtx.fillStyle = grad;
      dCtx.fillRect(bx, by, barW, barH);

      dCtx.fillStyle = '#ffffff';
      dCtx.fillRect(bx, Math.max(48, by - 4), barW, 2);
    }
    dTexture.needsUpdate = true;
  }
  renderDawScreen(0, 0.75);

  // 4. PEDESTAL SPEAKER STANDS (Flanking Console)
  const standGroup = new THREE.Group();
  group.add(standGroup);

  const standPositions = [
    { x: -1.75, z: -1.45 },
    { x:  1.75, z: -1.45 }
  ];

  for (const pos of standPositions) {
    const sG = new THREE.Group();
    sG.position.set(pos.x, 0, pos.z);
    standGroup.add(sG);

    createBox(0.46, 0.045, 0.46, darkMetalMat, 0, 0.0225, 0, sG);
    for (const sx of [-0.19, 0.19]) {
      for (const sz of [-0.19, 0.19]) {
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(0.012, 0.02, 12),
          chromeMat
        );
        spike.rotation.x = Math.PI;
        spike.position.set(sx, 0.008, sz);
        sG.add(spike);
      }
    }
    for (const cx of [-0.08, 0.08]) {
      createBox(0.09, 0.88, 0.09, darkMetalMat, cx, 0.485, 0, sG);
    }
    createBox(0.36, 0.025, 0.36, darkMetalMat, 0, 0.94, 0, sG);
    for (const px of [-0.12, 0.12]) {
      for (const pz of [-0.12, 0.12]) {
        createBox(0.05, 0.01, 0.05, blackDeskMat, px, 0.957, pz, sG);
      }
    }
  }

  // 5. ERGONOMIC STUDIO TASK CHAIR (Aeron Style at Sweet Spot)
  const chairGroup = new THREE.Group();
  chairGroup.position.set(0, 0, -0.42);
  group.add(chairGroup);

  const baseCenter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, 0.06, 16),
    darkMetalMat
  );
  baseCenter.position.set(0, 0.12, 0);
  chairGroup.add(baseCenter);

  for (let a = 0; a < 5; a++) {
    const angle = (a * Math.PI * 2) / 5;
    const legLen = 0.32;
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.025, legLen),
      darkMetalMat
    );
    leg.position.set(
      Math.sin(angle) * (legLen / 2),
      0.11,
      Math.cos(angle) * (legLen / 2)
    );
    leg.rotation.y = angle;
    chairGroup.add(leg);

    const castor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.025, 12),
      blackDeskMat
    );
    castor.rotation.z = Math.PI / 2;
    castor.position.set(
      Math.sin(angle) * legLen,
      0.035,
      Math.cos(angle) * legLen
    );
    chairGroup.add(castor);
  }

  const cylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.028, 0.32, 16),
    chromeMat
  );
  cylinder.position.set(0, 0.28, 0);
  chairGroup.add(cylinder);

  createBox(0.24, 0.06, 0.24, darkMetalMat, 0, 0.44, 0, chairGroup);

  const seatGeo = new THREE.BoxGeometry(0.52, 0.04, 0.48);
  const seat = new THREE.Mesh(seatGeo, meshChairMat);
  seat.position.set(0, 0.49, -0.02);
  seat.rotation.x = -0.06;
  chairGroup.add(seat);

  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.48, 0.04),
    darkMetalMat
  );
  spine.position.set(0, 0.76, 0.24);
  spine.rotation.x = -0.15;
  chairGroup.add(spine);

  const backGeo = new THREE.BoxGeometry(0.48, 0.54, 0.03);
  const chairBack = new THREE.Mesh(backGeo, meshChairMat);
  chairBack.position.set(0, 0.82, 0.22);
  chairBack.rotation.x = -0.12;
  chairGroup.add(chairBack);

  for (const ax of [-0.29, 0.29]) {
    createBox(0.035, 0.24, 0.035, darkMetalMat, ax, 0.62, 0.02, chairGroup);
    createBox(0.08, 0.03, 0.24, armrestMat, ax, 0.74, -0.01, chairGroup);
  }

  // 6. SIDE OUTBOARD EQUIPMENT RACKS (Low Credenzas Left & Right)
  const credenzaW = 1.05, credenzaH = 0.72, credenzaD = 0.54;
  for (const side of [-1, 1]) {
    const credGroup = new THREE.Group();
    const cx = side * 2.35;
    credGroup.position.set(cx, 0, -0.45);
    credGroup.rotation.y = -side * 0.18;
    group.add(credGroup);

    createBox(credenzaW, credenzaH, credenzaD, blackDeskMat, 0, credenzaH / 2, 0, credGroup);

    for (let bay = 0; bay < 2; bay++) {
      const rx = (bay - 0.5) * 0.48;
      for (const railX of [-0.22, 0.22]) {
        createBox(0.015, credenzaH - 0.08, 0.02, darkMetalMat, rx + railX, credenzaH / 2, credenzaD / 2 - 0.02, credGroup);
      }

      for (let unit = 0; unit < 4; unit++) {
        const uy = 0.12 + unit * 0.14;
        const isTube = (unit + bay) % 2 === 0;
        const faceMat = isTube ? silverFaceMat : rackPanelMat;
        createBox(0.43, 0.12, 0.03, faceMat, rx, uy, credenzaD / 2 - 0.015, credGroup);

        for (const hx of [-0.19, 0.19]) {
          const handle = new THREE.Mesh(
            new THREE.BoxGeometry(0.01, 0.08, 0.025),
            darkMetalMat
          );
          handle.position.set(rx + hx, uy, credenzaD / 2 + 0.005);
          credGroup.add(handle);
        }

        if (isTube) {
          const vu = new THREE.Mesh(
            new THREE.CircleGeometry(0.022, 16),
            amberVuMat
          );
          vu.position.set(rx, uy, credenzaD / 2 + 0.002);
          credGroup.add(vu);
        } else {
          for (let led = 0; led < 6; led++) {
            const ind = new THREE.Mesh(
              new THREE.BoxGeometry(0.008, 0.008, 0.004),
              (led > 4) ? amberVuMat : greenLedMat
            );
            ind.position.set(rx - 0.08 + led * 0.032, uy, credenzaD / 2 + 0.002);
            credGroup.add(ind);
          }
        }
      }
    }

    if (side === 1) {
      const ttBase = createBox(0.42, 0.05, 0.36, darkMetalMat, 0.1, credenzaH + 0.025, 0, credGroup);
      const platter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.02, 32),
        silverFaceMat
      );
      platter.position.set(0, 0.035, 0);
      ttBase.add(platter);
      const vinyl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.13, 0.003, 32),
        blackDeskMat
      );
      vinyl.position.set(0, 0.012, 0);
      platter.add(vinyl);
      const dustcover = new THREE.Mesh(
        new THREE.BoxGeometry(0.41, 0.09, 0.35),
        new THREE.MeshStandardMaterial({
          color: 0x99aebb,
          roughness: 0.1,
          metalness: 0.2,
          transparent: true,
          opacity: 0.35
        })
      );
      dustcover.position.set(0, 0.07, 0);
      ttBase.add(dustcover);
    }
  }

  // 7. ARCHITECTURAL SLATTED ACOUSTIC WALL DIFFUSERS (Left and Right Walls)
  const diffuserGroup = new THREE.Group();
  group.add(diffuserGroup);

  const slatCount = 18;
  const slatWidth = 0.038;
  const slatDepth = 0.065;
  const slatHeight = 2.4;
  const slatSpacing = 0.065;

  for (const side of [-1, 1]) {
    const wallX = side * 2.85;
    const panelW = slatCount * slatSpacing + 0.08;
    const backPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, slatHeight + 0.1, panelW),
      blackDeskMat
    );
    backPanel.position.set(wallX, 1.45, -0.6);
    diffuserGroup.add(backPanel);

    for (let s = 0; s < slatCount; s++) {
      const sz = -0.6 - panelW / 2 + 0.06 + s * slatSpacing;
      const depthVar = slatDepth * (0.85 + 0.3 * Math.sin(s * 1.2));
      const slat = new THREE.Mesh(
        new THREE.BoxGeometry(depthVar, slatHeight, slatWidth),
        slatWoodMat
      );
      slat.position.set(wallX - side * (0.02 + depthVar / 2), 1.45, sz);
      slat.castShadow = true;
      diffuserGroup.add(slat);
    }
  }

  // 8. ARCHITECTURAL COVE LIGHT STRIPS (Soft Wall Grazing Wash)
  const coveLights = [];
  for (const side of [-1, 1]) {
    const coveMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.02, 3.2),
      new THREE.MeshBasicMaterial({ color: 0xebf2fa })
    );
    coveMesh.position.set(side * 2.82, 2.75, -0.6);
    group.add(coveMesh);

    const wallWash = new THREE.PointLight(0xd5e2f0, 0.85, 4.5, 1.8);
    wallWash.position.set(side * 2.65, 2.6, -0.6);
    group.add(wallWash);
    coveLights.push(wallWash);
  }

  return {
    group,
    update(dt, time, soundEnergy = 0.75) {
      renderDawScreen(time, soundEnergy);
    },
    setVisible(visible) {
      group.visible = visible;
      coveLights.forEach(l => l.visible = visible);
    },
    setClub(club) {
      coveLights.forEach(l => {
        l.color.set(club ? 0x7ca8e7 : 0xd5e2f0);
        l.intensity = club ? 0.6 : 0.85;
      });
    },
    getStandPositions() {
      return standPositions;
    }
  };
}
