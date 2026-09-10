import * as THREE from './vendor/three.module.js';

let sharedBeamTexture = null;

function getBeamTexture() {
  if (sharedBeamTexture) return sharedBeamTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Vertical gradient: intense near the lamp top, smoothly tapering toward the bottom
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  grad.addColorStop(0.12, 'rgba(255, 255, 255, 0.65)');
  grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.22)');
  grad.addColorStop(0.85, 'rgba(255, 255, 255, 0.05)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 256);

  sharedBeamTexture = new THREE.CanvasTexture(canvas);
  return sharedBeamTexture;
}

export function createHazeBeams() {
  const group = new THREE.Group();
  group.name = 'volumetric-haze-beams';

  const beamMaterial = new THREE.MeshBasicMaterial({
    map: getBeamTexture(),
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  // Create angled light cones / fan sheets along both ceiling lighting strips
  const beams = [];
  const beamCount = 6; // 3 on each side (left strip & right strip)

  for (let side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      // Tapered cone: small at top (radius 0.05), spreading to 1.1m at base
      const geo = new THREE.CylinderGeometry(0.04, 0.95, 3.5, 24, 1, true);
      // Shift pivot to top of cone
      geo.translate(0, -1.75, 0);

      const mesh = new THREE.Mesh(geo, beamMaterial.clone());
      group.add(mesh);
      beams.push({mesh, side, index: i, baseRotX: 0.15 + i * 0.08, baseRotZ: side * 0.12});
    }
  }

  let time = 0;

  return {
    group,
    update(roomSize, club, dt) {
      time += dt;
      const beamHeight = Math.max(2, roomSize.y - 0.1);
      const stripX = roomSize.x * 0.42;

      // Color scheme: normal daylight vs moody club lighting
      const targetColor = club ? (time % 10 < 5 ? 0x72d6a4 : 0x6ca3f0) : 0xf2efd9;
      const targetOpacity = club ? 0.24 : 0.09;

      beams.forEach((b, idx) => {
        const zRatio = (b.index / 2 - 0.5) * 0.7; // distributed along length
        const beamZ = zRatio * roomSize.z;
        const beamX = b.side * stripX;

        b.mesh.position.set(beamX, roomSize.y - 0.02, beamZ);
        b.mesh.scale.set(1, beamHeight / 3.5, 1);

        // Gentle breathing animation
        const sway = Math.sin(time * 0.8 + idx) * 0.04;
        b.mesh.rotation.x = b.baseRotX + sway;
        b.mesh.rotation.z = b.baseRotZ + Math.cos(time * 0.6 + idx) * 0.03;

        b.mesh.material.color.set(targetColor);
        b.mesh.material.opacity = targetOpacity + Math.sin(time * 1.2 + idx) * 0.03;
      });
    },
    setVisible(visible) {
      group.visible = visible;
    }
  };
}
