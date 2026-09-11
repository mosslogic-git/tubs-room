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
  const isStudio = id.startsWith('adam') || id.startsWith('mackie');

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

  if (id === 'adam-a7v') {
    // ADAM Audio A7V: Chamfered baffle, X-ART ribbon tweeter with HPS waveguide, MLM woofer, dual ports
    for (const sx of [-1, 1]) {
      const chamfer = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.028, d * 0.4), dark);
      chamfer.position.set(sx * (w / 2 - 0.008), h - 0.008, d / 2 - d * 0.2);
      chamfer.rotation.z = sx * Math.PI / 4;
      bodyGroup.add(chamfer);
    }
    const hpsY = h * 0.73, hpsZ = d / 2 - 0.032;
    const hpsDish = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.038, 0.014, 32), dark);
    hpsDish.rotation.x = Math.PI / 2;
    hpsDish.position.set(0, hpsY, hpsZ - 0.006);
    bodyGroup.add(hpsDish);
    box(0.024, 0.038, 0.008, 0, hpsY, hpsZ - 0.008, dark);
    const goldMat = new THREE.MeshStandardMaterial({color: 0xdfb43b, metalness: 0.85, roughness: 0.25});
    for (let py = -0.014; py <= 0.014; py += 0.0045) {
      const pleat = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.0018, 0.003), goldMat);
      pleat.position.set(0, hpsY + py, hpsZ - 0.005);
      bodyGroup.add(pleat);
    }
    for (let sy = -0.012; sy <= 0.012; sy += 0.008) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.0016, 0.002), dark);
      bar.position.set(0, hpsY + sy, hpsZ - 0.002);
      bodyGroup.add(bar);
    }
    const wooferY = h * 0.36, wooferZ = d / 2 - 0.032, wooferR = 0.076;
    const surround = new THREE.Mesh(new THREE.TorusGeometry(wooferR, 0.0075, 12, 48), dark);
    surround.position.set(0, wooferY, wooferZ);
    bodyGroup.add(surround);
    const mineralCone = new THREE.Mesh(new THREE.ConeGeometry(wooferR - 0.008, 0.026, 48, 1, true), cone);
    mineralCone.rotation.x = Math.PI / 2;
    mineralCone.position.set(0, wooferY, wooferZ - 0.016);
    bodyGroup.add(mineralCone);
    const dustCap = new THREE.Mesh(new THREE.SphereGeometry(wooferR * 0.32, 24, 12), dark);
    dustCap.scale.set(1, 1, 0.3);
    dustCap.position.set(0, wooferY, wooferZ - 0.008);
    bodyGroup.add(dustCap);
    for (const sx of [-1, 1]) {
      const port = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.011, 0.035, 24), dark);
      port.rotation.x = Math.PI / 2;
      port.position.set(sx * (w * 0.31), h * 0.095, d / 2 - 0.03);
      bodyGroup.add(port);
      const flare = new THREE.Mesh(new THREE.TorusGeometry(0.013, 0.0025, 8, 24), dark);
      flare.position.set(sx * (w * 0.31), h * 0.095, d / 2 - 0.018);
      bodyGroup.add(flare);
    }
    const logoPlate = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.008, 0.002), new THREE.MeshStandardMaterial({color: 0xc8d0c6, metalness: 0.6, roughness: 0.4}));
    logoPlate.position.set(0, h * 0.095, d / 2 - 0.018);
    bodyGroup.add(logoPlate);
  } else if (id === 'mackie-hr824') {
    // Mackie HR824 Mk2: Cast Aluminum Zero Edge baffle, Titanium dome waveguide, 8.75" woofer, Mackie green badge
    box(w - 0.008, h - 0.008, 0.022, 0, h / 2, d / 2 - 0.02, dark);
    const twY = h * 0.75, twZ = d / 2 - 0.016;
    const wg = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.032, 0.014, 36), dark);
    wg.rotation.x = Math.PI / 2;
    wg.position.set(0, twY, twZ - 0.007);
    bodyGroup.add(wg);
    const tiMat = new THREE.MeshStandardMaterial({color: 0xb5bfb8, metalness: 0.85, roughness: 0.25});
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.016, 24, 12), tiMat);
    dome.scale.set(1, 1, 0.45);
    dome.position.set(0, twY, twZ - 0.004);
    bodyGroup.add(dome);
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.003, 0.003), dark);
    lens.position.set(0, twY, twZ);
    bodyGroup.add(lens);
    const wfY = h * 0.38, wfZ = d / 2 - 0.016, wfR = 0.098;
    const wfSurround = new THREE.Mesh(new THREE.TorusGeometry(wfR, 0.0085, 12, 48), dark);
    wfSurround.position.set(0, wfY, wfZ);
    bodyGroup.add(wfSurround);
    const wfCone = new THREE.Mesh(new THREE.ConeGeometry(wfR - 0.01, 0.032, 48, 1, true), cone);
    wfCone.rotation.x = Math.PI / 2;
    wfCone.position.set(0, wfY, wfZ - 0.018);
    bodyGroup.add(wfCone);
    const wfCap = new THREE.Mesh(new THREE.SphereGeometry(wfR * 0.35, 24, 12), dark);
    wfCap.scale.set(1, 1, 0.35);
    wfCap.position.set(0, wfY, wfZ - 0.008);
    bodyGroup.add(wfCap);
    const mackieGreen = new THREE.MeshStandardMaterial({color: 0x62cc3b, emissive: 0x225514, roughness: 0.3});
    const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.003, 24), mackieGreen);
    badge.rotation.x = Math.PI / 2;
    badge.position.set(0, h * 0.09, d / 2 - 0.008);
    bodyGroup.add(badge);
    const icon = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.009, 0.001), new THREE.MeshBasicMaterial({color: 0xffffff}));
    icon.position.set(0, h * 0.09, d / 2 - 0.006);
    bodyGroup.add(icon);
  } else if (id === 'mackie-cr5') {
    // Mackie CR5-X: Compact reference, green trim ring, illuminated volume knob
    box(w - 0.006, h - 0.006, 0.016, 0, h / 2, d / 2 - 0.018, dark);
    const twY = h * 0.76, twZ = d / 2 - 0.014;
    const twDish = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.02, 0.008, 24), dark);
    twDish.rotation.x = Math.PI / 2;
    twDish.position.set(0, twY, twZ - 0.004);
    bodyGroup.add(twDish);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 8), dark);
    dome.scale.set(1, 1, 0.4);
    dome.position.set(0, twY, twZ - 0.002);
    bodyGroup.add(dome);
    const wfY = h * 0.38, wfZ = d / 2 - 0.014, wfR = 0.058;
    const greenTrim = new THREE.Mesh(new THREE.TorusGeometry(wfR + 0.004, 0.0025, 8, 36), new THREE.MeshStandardMaterial({color: 0x62cc3b, roughness: 0.3}));
    greenTrim.position.set(0, wfY, wfZ);
    bodyGroup.add(greenTrim);
    const wfSurround = new THREE.Mesh(new THREE.TorusGeometry(wfR, 0.0055, 8, 36), dark);
    wfSurround.position.set(0, wfY, wfZ);
    bodyGroup.add(wfSurround);
    const wfCone = new THREE.Mesh(new THREE.ConeGeometry(wfR - 0.006, 0.02, 36, 1, true), cone);
    wfCone.rotation.x = Math.PI / 2;
    wfCone.position.set(0, wfY, wfZ - 0.012);
    bodyGroup.add(wfCone);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.008, 24), dark);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(w * 0.28, h * 0.12, d / 2 - 0.012);
    bodyGroup.add(knob);
    const knobRing = new THREE.Mesh(new THREE.TorusGeometry(0.01, 0.0016, 8, 24), new THREE.MeshStandardMaterial({color: 0x62cc3b, emissive: 0x225514}));
    knobRing.position.set(w * 0.28, h * 0.12, d / 2 - 0.012);
    bodyGroup.add(knobRing);
  } else if (id === 'adam-sub10') {
    // ADAM Audio Sub10 Mk2: 10" cone + front flared port
    const wfY = h * 0.52, wfZ = d / 2 - 0.035, wfR = 0.125;
    const wfSurround = new THREE.Mesh(new THREE.TorusGeometry(wfR, 0.011, 12, 48), dark);
    wfSurround.position.set(0, wfY, wfZ);
    bodyGroup.add(wfSurround);
    const wfCone = new THREE.Mesh(new THREE.ConeGeometry(wfR - 0.012, 0.038, 48, 1, true), cone);
    wfCone.rotation.x = Math.PI / 2;
    wfCone.position.set(0, wfY, wfZ - 0.024);
    bodyGroup.add(wfCone);
    const wfCap = new THREE.Mesh(new THREE.SphereGeometry(wfR * 0.35, 24, 12), dark);
    wfCap.scale.set(1, 1, 0.3);
    wfCap.position.set(0, wfY, wfZ - 0.012);
    bodyGroup.add(wfCap);
    const port = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.032, 0.05, 32), dark);
    port.rotation.x = Math.PI / 2;
    port.position.set(0, h * 0.18, d / 2 - 0.03);
    bodyGroup.add(port);
    const portFlare = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.005, 8, 32), dark);
    portFlare.position.set(0, h * 0.18, d / 2 - 0.016);
    bodyGroup.add(portFlare);
  } else if (id === 'gc218') {
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

  // High-Frequency Dispersion Horn (for PA cabinets)
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
  if (isSub && !id.startsWith('adam')) {
    const portH = 0.032;
    const portW = w * 0.65;
    const portY = wall + portH / 2 + 0.015;
    box(portW, portH, 0.04, 0, portY, d / 2 - 0.055, dark);
  }

  // Only PA speakers use protective wire grilles & corner chassis bolts
  if (!isStudio) {
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

    for (const x of [-w / 2 + 0.032, w / 2 - 0.032]) {
      for (const y of [0.032, h - 0.032]) {
        const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.004, 8), metal);
        bolt.rotation.x = Math.PI / 2;
        bolt.position.set(x, y, d / 2 - 0.006);
        bodyGroup.add(bolt);
      }
    }
  } else {
    // Studio monitors: 4 acoustic decoupling rubber feet on base
    const feetMat = new THREE.MeshStandardMaterial({color: 0x111312, roughness: 0.95});
    for (const fx of [-w / 2 + 0.03, w / 2 - 0.03]) {
      for (const fz of [-d / 2 + 0.03, d / 2 - 0.03]) {
        const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.006, 16), feetMat);
        foot.position.set(fx, 0.003, fz);
        bodyGroup.add(foot);
      }
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
