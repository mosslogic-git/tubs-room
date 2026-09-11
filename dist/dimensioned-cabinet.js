import * as THREE from './vendor/three.module.js';

// Dimensioned visual representations refined from Blender production models.
// Built at metre scale with exact Tub's satin green (20% darker than side walls),
// recessed front baffle, realistic driver cones, dispersion horns, and reflex ports.
export function dimensionedCabinet(id, size, color = 0x363c2e, tilt = 0) {
  const [w, h, d] = size, group = new THREE.Group();
  const bodyGroup = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({color, roughness: 0.78});
  shell.name = 'cabinet-shell';
  const dark = new THREE.MeshStandardMaterial({color: 0x111514, roughness: 0.92});
  const cone = new THREE.MeshStandardMaterial({color: 0x252c29, roughness: 0.85});
  const metal = new THREE.MeshStandardMaterial({color: 0x6b746d, roughness: 0.35, metalness: 0.85});
  const steel = new THREE.MeshStandardMaterial({color: 0x1a201c, roughness: 0.45, metalness: 0.75});
  const wall = 0.018;

  function box(x, y, z, px, py, pz, material = shell) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x, y, z), material);
    m.position.set(px, py, pz);
    m.castShadow = m.receiveShadow = true;
    bodyGroup.add(m);
    return m;
  }

  // Outer beveled cabinet enclosure
  box(w, wall, d, 0, wall / 2, 0);
  box(w, wall, d, 0, h - wall / 2, 0);
  box(wall, h - 2 * wall, d, -w / 2 + wall / 2, h / 2, 0);
  box(wall, h - 2 * wall, d, w / 2 - wall / 2, h / 2, 0);
  box(w - 2 * wall, h - 2 * wall, wall, 0, h / 2, -d / 2 + wall / 2);

  // Recessed internal baffle plate
  box(w - 2 * wall, h - 2 * wall, 0.015, 0, h / 2, d / 2 - 0.075, dark);

  // Acoustic Driver Configurations
  const isSub = id.includes('sub') || id === 'gc218';
  const isTop = id === 'dc12' || id === 'gc410';
  const isFloorstander = id === 'obslk';

  function addDriver(x, y, radius) {
    const z = d / 2 - 0.048;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.009, 8, 48), dark);
    ring.position.set(x, y, z);
    bodyGroup.add(ring);
    const diaphragm = new THREE.Mesh(new THREE.ConeGeometry(radius - 0.012, 0.035, 48, 1, true), cone);
    diaphragm.rotation.x = Math.PI / 2;
    diaphragm.position.set(x, y, z - 0.022);
    bodyGroup.add(diaphragm);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.24, 20, 10), dark);
    cap.scale.z = 0.35;
    cap.position.set(x, y, z - 0.01);
    bodyGroup.add(cap);
  }

  if (id === 'gc218') {
    addDriver(-w * 0.25, h / 2, 0.21);
    addDriver(w * 0.25, h / 2, 0.21);
  } else if (id === 'gc118-sub') {
    addDriver(0, h * 0.52, 0.21);
  } else if (id === 'gc410') {
    const r10 = 0.11, dx = 0.15, dy = 0.15;
    addDriver(-dx, h / 2 - dy, r10);
    addDriver(dx, h / 2 - dy, r10);
    addDriver(-dx, h / 2 + dy, r10);
    addDriver(dx, h / 2 + dy, r10);
  } else if (id === 'dc12') {
    addDriver(0, h / 2, 0.145);
  } else if (id === 'obslk') {
    addDriver(0, h * 0.42, 0.125);
  } else {
    addDriver(0, h / 2, Math.min(w * 0.25, h * 0.25));
  }

  // High-Frequency Dispersion Horn
  if ((id === 'dc12' || id === 'obslk') && h > 0.35) {
    const hornY = id === 'obslk' ? h * 0.76 : h * 0.78;
    const hornW = Math.min(w * 0.45, 0.22);
    const hornH = Math.min(h * 0.22, 0.12);
    const hornZ = d / 2 - 0.052;
    box(hornW, hornH, 0.022, 0, hornY, hornZ, dark);
    const throat = new THREE.Mesh(new THREE.CylinderGeometry(hornW * 0.35, hornW * 0.15, 0.015, 24), dark);
    throat.rotation.x = Math.PI / 2;
    throat.position.set(0, hornY, hornZ - 0.008);
    bodyGroup.add(throat);
  }

  // Bass Reflex Port (for Subwoofers)
  if (isSub) {
    const portH = 0.032;
    const portW = w * 0.65;
    const portY = wall + portH / 2 + 0.015;
    box(portW, portH, 0.04, 0, portY, d / 2 - 0.055, dark);
  }

  // Constant-pitch protective acoustic grille
  const points = [], pitch = 0.012, front = d / 2 - 0.012;
  for (let x = -w / 2 + 0.03; x < w / 2 - 0.025; x += pitch) {
    points.push(x, 0.03, front, x, h - 0.03, front);
  }
  for (let y = 0.03; y < h - 0.025; y += pitch) {
    points.push(-w / 2 + 0.03, y, front, w / 2 - 0.03, y, front);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  bodyGroup.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({color: 0x68736a, transparent: true, opacity: 0.48})));

  // Corner Protector Brackets & Screws (Chassis Hardware)
  for (const x of [-w / 2 + 0.032, w / 2 - 0.032]) {
    for (const y of [0.032, h - 0.032]) {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.004, 8), metal);
      bolt.rotation.x = Math.PI / 2;
      bolt.position.set(x, y, d / 2 - 0.006);
      bodyGroup.add(bolt);
    }
  }

  // Upward tilt & industrial side mounting brackets (for DJ booth monitors aiming at DJ head)
  const tiltAngle = tilt > 0 ? tilt : 0;

  if (tiltAngle > 0) {
    const pivotY = 0.02;
    const pivotZ = -d / 2 + 0.05;

    // Side chassis reinforcement plates on speaker body
    for (const sx of [-1, 1]) {
      const cabPlate = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.045, 0.16), steel);
      cabPlate.position.set(sx * (w / 2 + 0.0015), 0.07, 0.02);
      cabPlate.castShadow = true;
      bodyGroup.add(cabPlate);
    }

    const pivotGroup = new THREE.Group();
    pivotGroup.position.set(0, pivotY, pivotZ);
    bodyGroup.position.set(0, -pivotY, -pivotZ);
    // Negative rotation around X pitches the front face (+Z) UPWARDS towards the DJ's head
    pivotGroup.rotation.x = -tiltAngle;
    pivotGroup.add(bodyGroup);
    group.add(pivotGroup);

    // Industrial Steel Side Mounting Tilt Brackets bolted to sub top
    const bracketThick = 0.008;
    for (const sx of [-1, 1]) {
      const bx = sx * (w / 2 + bracketThick / 2 + 0.003);

      // Base bracket runner plate bolted securely to subwoofer top
      const basePlate = new THREE.Mesh(new THREE.BoxGeometry(bracketThick, 0.035, 0.28), steel);
      basePlate.position.set(bx, 0.017, pivotZ + 0.06);
      basePlate.castShadow = true;
      group.add(basePlate);

      // Subwoofer mounting anchor bolts
      for (const bz of [pivotZ - 0.05, pivotZ + 0.07, pivotZ + 0.16]) {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, bracketThick + 0.004, 8), metal);
        b.rotation.z = Math.PI / 2;
        b.position.set(bx, 0.022, bz);
        group.add(b);
      }

      // Upright hinge bracket ear connecting base plate to rear pivot point
      const arm = new THREE.Mesh(new THREE.BoxGeometry(bracketThick, pivotY + 0.025, 0.045), steel);
      arm.position.set(bx, (pivotY + 0.025) / 2, pivotZ);
      arm.castShadow = true;
      group.add(arm);

      // Main pivot hinge pin
      const pivotPin = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, bracketThick + 0.012, 16), metal);
      pivotPin.rotation.z = Math.PI / 2;
      pivotPin.position.set(bx, pivotY, pivotZ);
      group.add(pivotPin);

      // Heavy-duty diagonal angle locking strut holding the front baffle lifted
      const strut = new THREE.Mesh(new THREE.BoxGeometry(bracketThick * 0.85, 0.022, 0.155), steel);
      strut.position.set(bx, 0.087, 0.033);
      strut.rotation.x = -61.5 * Math.PI / 180;
      strut.castShadow = true;
      group.add(strut);

      // Angle clamp knob / lock bolt clamping strut to cabinet side chassis plate
      const lockBolt = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.0075, bracketThick + 0.014, 12), metal);
      lockBolt.rotation.z = Math.PI / 2;
      lockBolt.position.set(bx, 0.154, -0.003);
      group.add(lockBolt);
    }
  } else {
    group.add(bodyGroup);
  }

  group.userData.dimensioned = true;
  return group;
}
