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
  const texLoader = typeof document !== 'undefined' ? new THREE.TextureLoader() : null;
  const standNormal = texLoader ? texLoader.load('./assets/stand-normal.png') : null;
  if (standNormal) {
    standNormal.wrapS = standNormal.wrapT = THREE.RepeatWrapping;
    standNormal.repeat.set(2, 4);
  }
  const standRoughness = texLoader ? texLoader.load('./assets/stand-roughness.png') : null;
  if (standRoughness) {
    standRoughness.wrapS = standRoughness.wrapT = THREE.RepeatWrapping;
    standRoughness.repeat.set(2, 4);
  }
  const castIronMat = new THREE.MeshStandardMaterial({
    color: 0x141618,
    roughness: 0.82,
    metalness: 0.22,
    normalMap: standNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: standRoughness
  });
  const neopreneMat = new THREE.MeshStandardMaterial({
    color: 0x090b0d,
    roughness: 0.94,
    metalness: 0.04
  });
  const armrestMat = new THREE.MeshStandardMaterial({
    color: 0x0f1113,
    roughness: 0.85
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

  // Clean desktop cable grommets / passthroughs
  for (const cx of [-0.65, 0.65]) {
    createBox(0.08, 0.005, 0.04, darkMetalMat, cx, 0.771, -0.32, deskGroup);
  }

  // 3. PEDESTAL SPEAKER STANDS (Flanking Desk, Acoustic Decoupled)
  const standGroup = new THREE.Group();
  group.add(standGroup);

  const stands = [];
  const standSides = [-1, 1];

  for (const side of standSides) {
    const sG = new THREE.Group();
    sG.position.set(side * 1.75, 0, -1.45);
    standGroup.add(sG);

    // A. Base Assembly (Resting flat on the floor with isolation spikes)
    const baseGroup = new THREE.Group();
    sG.add(baseGroup);

    // Heavy cast-iron base plate with beveled rim
    createBox(0.44, 0.038, 0.44, castIronMat, 0, 0.024, 0, baseGroup);
    for (const sx of [-0.185, 0.185]) {
      for (const sz of [-0.185, 0.185]) {
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(0.012, 0.022, 16),
          chromeMat
        );
        spike.rotation.x = Math.PI;
        spike.position.set(sx, 0.009, sz);
        baseGroup.add(spike);
      }
    }

    // Twin heavy structural pillars (dual column for vibration stability)
    for (const cx of [-0.075, 0.075]) {
      createBox(0.08, 0.865, 0.08, castIronMat, cx, 0.475, 0, baseGroup);
    }
    // Middle stabilizing bridge clamp with hex bolt accents
    createBox(0.24, 0.045, 0.09, darkMetalMat, 0, 0.50, 0, baseGroup);

    // B. Top Head Assembly (Rotates with toe-in to cradle the monitor)
    const topHead = new THREE.Group();
    topHead.rotation.y = -side * 0.32;
    sG.add(topHead);

    // Top sub-plate / column collar
    createBox(0.24, 0.022, 0.24, darkMetalMat, 0, 0.918, 0, topHead);

    // Decoupled top mounting plate (framed for studio monitors)
    const topPlateW = 0.24;
    const topPlateD = 0.32;
    const topPlateH = 0.020;
    const topPlateY = 0.938;
    const topPlate = createBox(topPlateW, topPlateH, topPlateD, castIronMat, 0, topPlateY, 0, topHead);

    // Subtle chamfered edge trim for top plate
    for (const ex of [-1, 1]) {
      const bevel = new THREE.Mesh(
        new THREE.BoxGeometry(0.010, topPlateH * 0.9, topPlateD - 0.01),
        darkMetalMat
      );
      bevel.position.set(ex * (topPlateW / 2 - 0.004), topPlateY, 0);
      bevel.rotation.z = ex * Math.PI / 4;
      topHead.add(bevel);
    }

    // 4 High-Density Neoprene Isolation Damping Pucks
    // Speaker sits at y = 0.965m; Top plate is at y = 0.938 + 0.010 = 0.948m
    // Pucks are 0.017m tall (from 0.948m to 0.965m). Top of pucks sits at 0.965m EXACTLY!
    const puckH = 0.017;
    const puckY = 0.948 + puckH / 2;
    const puckGeo = new THREE.CylinderGeometry(0.020, 0.020, puckH, 20);
    const pucks = [];
    const defaultKx = 0.076; // fits ADAM Audio A7V (0.20m wide)
    const defaultKz = 0.106; // fits ADAM Audio A7V (0.28m deep)

    for (const px of [-defaultKx, defaultKx]) {
      for (const pz of [-defaultKz, defaultKz]) {
        const puck = new THREE.Mesh(puckGeo, neopreneMat);
        puck.position.set(px, puckY, pz);
        puck.castShadow = true;
        topHead.add(puck);
        pucks.push(puck);
      }
    }

    stands.push({
      group: sG,
      baseGroup,
      topHead,
      topPlate,
      topPlateW,
      topPlateD,
      pucks,
      side
    });
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

  // 5. ARCHITECTURAL SLATTED ACOUSTIC WALL DIFFUSERS (Left and Right Walls)
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
      // Clean desk without DAW screen updates
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
    syncStands(speakers, suiteWorldZ = 0) {
      if (!speakers || !stands.length) return;
      const tops = speakers.filter(s => s.role === 'top' && s.scale > 0.01);
      if (tops.length === 0) return;
      const sorted = [...tops].sort((a, b) => a.position.x - b.position.x);
      for (let i = 0; i < stands.length; i++) {
        const stand = stands[i];
        const spk = sorted[i] || (stand.side < 0 ? sorted[0] : sorted[sorted.length - 1]);
        if (!spk) continue;

        // Position stand in suite local coordinates
        stand.group.position.x = spk.position.x;
        stand.group.position.z = spk.position.z - suiteWorldZ;

        // Rotate top assembly to match exact monitor toe-in
        stand.topHead.rotation.y = spk.object.rotation.y;

        // Dynamically frame isolation pucks and top plate under speaker base
        if (spk.size && spk.size.length >= 3) {
          const sw = spk.size[0] || 0.20;
          const sd = spk.size[2] || 0.28;
          const kx = sw * 0.38;
          const kz = sd * 0.38;
          if (stand.pucks.length === 4) {
            stand.pucks[0].position.set(-kx, 0.9565, -kz);
            stand.pucks[1].position.set(-kx, 0.9565,  kz);
            stand.pucks[2].position.set( kx, 0.9565, -kz);
            stand.pucks[3].position.set( kx, 0.9565,  kz);
          }
          const baseW = stand.topPlateW || 0.24;
          const baseD = stand.topPlateD || 0.32;
          stand.topPlate.scale.set(
            (sw + 0.035) / baseW,
            1,
            (sd + 0.035) / baseD
          );
        }
      }
    },
    getStandPositions() {
      return stands.map(s => ({ x: s.group.position.x, z: s.group.position.z }));
    }
  };
}
