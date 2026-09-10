import * as THREE from 'three';

/**
 * Procedural 3D Sound Isolation Envelope assemblies:
 * 1. Resilient Floating Dancefloor & Elastomeric Puck Matrix
 * 2. Decoupled Double-Stud Perimeter Walls with Resilient Sound Clips
 * 3. Suspended Spring-Isolated Ceiling Grid with Vibration Hangers
 * 4. Broadband Corner Low-Frequency Bass Traps (4 Room Tri-Corners)
 * 5. Acoustic Airlock / Sound-Lock Entryway Vestibule
 */
export function createSoundIsolationEnvelope(room, specs) {
 const group = new THREE.Group();
 group.name = 'sound-isolation-envelope';

 const {width: w, depth: d, height: h} = room;
 const iso = specs;

 // Materials
 const puckMat = new THREE.MeshStandardMaterial({color: 0x44aa77, roughness: 0.4, metalness: 0.1});
 const floatingFloorMat = new THREE.MeshStandardMaterial({
  color: 0x88bb99,
  roughness: 0.3,
  transparent: true,
  opacity: 0.72,
  side: THREE.DoubleSide
 });
 const subFloorGridMat = new THREE.LineBasicMaterial({color: 0x2e4438, transparent: true, opacity: 0.5});
 
 const wallStudMat = new THREE.MeshStandardMaterial({color: 0x6ca0dc, roughness: 0.5, metalness: 0.2});
 const wallPanelMat = new THREE.MeshStandardMaterial({
  color: 0x3d6b99,
  roughness: 0.3,
  transparent: true,
  opacity: 0.25,
  side: THREE.DoubleSide,
  depthWrite: false
 });
 const clipMat = new THREE.MeshStandardMaterial({color: 0xff6b4a, roughness: 0.3, metalness: 0.4});
 
 const springMat = new THREE.MeshStandardMaterial({color: 0xe9b96a, roughness: 0.4, metalness: 0.6});
 const ceilingGridMat = new THREE.LineBasicMaterial({color: 0xd4a055, transparent: true, opacity: 0.6});
 const ceilingPanelMat = new THREE.MeshStandardMaterial({
  color: 0x8b6e3f,
  roughness: 0.4,
  transparent: true,
  opacity: 0.28,
  side: THREE.DoubleSide,
  depthWrite: false
 });

 const trapMat = new THREE.MeshStandardMaterial({
  color: 0x7c9c64,
  roughness: 0.6,
  transparent: true,
  opacity: 0.65,
  side: THREE.DoubleSide
 });

 const airlockMat = new THREE.MeshStandardMaterial({
  color: 0x5a7d9a,
  roughness: 0.4,
  transparent: true,
  opacity: 0.45,
  side: THREE.DoubleSide
 });
 const doorMat = new THREE.MeshStandardMaterial({color: 0x334e68, roughness: 0.5, metalness: 0.3});

 // -------------------------------------------------------------
 // 1. FLOATING FLOOR & ELASTOMER ISOLATOR MATRIX
 // -------------------------------------------------------------
 const floorGroup = new THREE.Group();
 floorGroup.name = 'floating-floor-assembly';

 // Decoupled floating slab (raised by 0.06m on top of pucks)
 const slabThick = 0.05;
 const puckHeight = 0.045;
 const slabY = puckHeight + slabThick / 2;
 const floorGeom = new THREE.BoxGeometry(w - 0.1, slabThick, d - 0.1);
 const floorMesh = new THREE.Mesh(floorGeom, floatingFloorMat);
 floorMesh.position.y = slabY;
 floorGroup.add(floorMesh);

 // Elastomer isolator pucks (instanced or grouped cylinders)
 const puckGeom = new THREE.CylinderGeometry(0.04, 0.04, puckHeight, 12);
 puckGeom.translate(0, puckHeight / 2, 0);

 const pucksX = iso.floatingFloor.pucksX;
 const pucksZ = iso.floatingFloor.pucksZ;
 const puckInstanced = new THREE.InstancedMesh(puckGeom, puckMat, pucksX * pucksZ);
 const dummy = new THREE.Object3D();
 let puckIdx = 0;
 for (let ix = 0; ix < pucksX; ix++) {
  const px = (ix / (pucksX - 1) - 0.5) * (w - 0.3);
  for (let iz = 0; iz < pucksZ; iz++) {
   const pz = (iz / (pucksZ - 1) - 0.5) * (d - 0.3);
   dummy.position.set(px, 0.002, pz);
   dummy.updateMatrix();
   puckInstanced.setMatrixAt(puckIdx++, dummy.matrix);
  }
 }
 puckInstanced.instanceMatrix.needsUpdate = true;
 floorGroup.add(puckInstanced);

 // Sub-floor structural perimeter outline
 const subfloorLineGeom = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-w / 2, 0.005, -d / 2),
  new THREE.Vector3(w / 2, 0.005, -d / 2),
  new THREE.Vector3(w / 2, 0.005, d / 2),
  new THREE.Vector3(-w / 2, 0.005, d / 2),
  new THREE.Vector3(-w / 2, 0.005, -d / 2)
 ]);
 floorGroup.add(new THREE.Line(subfloorLineGeom, subFloorGridMat));
 group.add(floorGroup);

 // -------------------------------------------------------------
 // 2. DECOUPLED PERIMETER WALLS & RESILIENT SOUND CLIPS
 // -------------------------------------------------------------
 const wallGroup = new THREE.Group();
 wallGroup.name = 'decoupled-perimeter-walls';
 const wallInset = 0.08; // decoupled air gap

 // 4 Inner decoupled wall sheets
 const sideWallGeom = new THREE.PlaneGeometry(d - 0.2, h - 0.15);
 const endWallGeom = new THREE.PlaneGeometry(w - 0.2, h - 0.15);

 // Left decoupled wall
 const leftWall = new THREE.Mesh(sideWallGeom, wallPanelMat);
 leftWall.position.set(-w / 2 + wallInset, h / 2, 0);
 leftWall.rotation.y = Math.PI / 2;
 wallGroup.add(leftWall);

 // Right decoupled wall
 const rightWall = new THREE.Mesh(sideWallGeom, wallPanelMat);
 rightWall.position.set(w / 2 - wallInset, h / 2, 0);
 rightWall.rotation.y = -Math.PI / 2;
 wallGroup.add(rightWall);

 // Stage rear decoupled wall
 const rearWall = new THREE.Mesh(endWallGeom, wallPanelMat);
 rearWall.position.set(0, h / 2, -d / 2 + wallInset);
 wallGroup.add(rearWall);

 // Vertical studs along sidewalls
 const studGeom = new THREE.BoxGeometry(0.04, h - 0.1, 0.06);
 const clipGeom = new THREE.BoxGeometry(0.06, 0.05, 0.04);
 const numStudsX = Math.max(4, Math.round(d / 0.6));
 for (let i = 0; i < numStudsX; i++) {
  const sz = (i / (numStudsX - 1) - 0.5) * (d - 0.3);
  // Left stud
  const sL = new THREE.Mesh(studGeom, wallStudMat);
  sL.position.set(-w / 2 + wallInset + 0.03, h / 2, sz);
  wallGroup.add(sL);
  // Resilient clip on stud
  const cL = new THREE.Mesh(clipGeom, clipMat);
  cL.position.set(-w / 2 + wallInset / 2, h * 0.45, sz);
  wallGroup.add(cL);

  // Right stud
  const sR = new THREE.Mesh(studGeom, wallStudMat);
  sR.position.set(w / 2 - wallInset - 0.03, h / 2, sz);
  wallGroup.add(sR);
  // Resilient clip
  const cR = new THREE.Mesh(clipGeom, clipMat);
  cR.position.set(w / 2 - wallInset / 2, h * 0.45, sz);
  wallGroup.add(cR);
 }
 group.add(wallGroup);

 // -------------------------------------------------------------
 // 3. SUSPENDED SPRING-ISOLATED CEILING
 // -------------------------------------------------------------
 const ceilingGroup = new THREE.Group();
 ceilingGroup.name = 'suspended-spring-ceiling';
 const ceilingDrop = 0.18; // 180mm isolated plenum
 const ceilingY = h - ceilingDrop;

 const ceilMesh = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.2, d - 0.2), ceilingPanelMat);
 ceilMesh.position.set(0, ceilingY, 0);
 ceilMesh.rotation.x = Math.PI / 2;
 ceilingGroup.add(ceilMesh);

 // Spring hangers
 const springGeom = new THREE.CylinderGeometry(0.025, 0.025, ceilingDrop, 8);
 springGeom.translate(0, ceilingDrop / 2, 0);

 const springsX = Math.max(3, Math.round(w / 1.2));
 const springsZ = Math.max(4, Math.round(d / 1.2));
 for (let ix = 0; ix < springsX; ix++) {
  const sx = (ix / (springsX - 1) - 0.5) * (w - 0.6);
  for (let iz = 0; iz < springsZ; iz++) {
   const sz = (iz / (springsZ - 1) - 0.5) * (d - 0.6);
   const hanger = new THREE.Mesh(springGeom, springMat);
   hanger.position.set(sx, ceilingY, sz);
   ceilingGroup.add(hanger);
  }
 }
 group.add(ceilingGroup);

 // -------------------------------------------------------------
 // 4. CORNER LOW-FREQUENCY ISOLATION TRAPS (4 CORNERS)
 // -------------------------------------------------------------
 const trapsGroup = new THREE.Group();
 trapsGroup.name = 'corner-lf-traps';
 const trapSize = iso.cornerTraps.depth;

 for (const sx of [-1, 1]) {
  for (const sz of [-1, 1]) {
   const trapShape = new THREE.Shape();
   trapShape.moveTo(0, 0);
   trapShape.lineTo(sx * trapSize, 0);
   trapShape.lineTo(0, sz * trapSize);
   trapShape.closePath();

   const extrudeSettings = {depth: h - 0.1, bevelEnabled: false};
   const geom = new THREE.ExtrudeGeometry(trapShape, extrudeSettings);
   geom.rotateX(Math.PI / 2);
   const trapMesh = new THREE.Mesh(geom, trapMat);
   trapMesh.position.set(sx * (w / 2 - 0.05), h - 0.05, sz * (d / 2 - 0.05));
   trapsGroup.add(trapMesh);
  }
 }
 group.add(trapsGroup);

 // -------------------------------------------------------------
 // 5. ACOUSTIC AIRLOCK / SOUND-LOCK ENTRYWAY
 // -------------------------------------------------------------
 const airlockGroup = new THREE.Group();
 airlockGroup.name = 'acoustic-sound-lock';
 const alW = iso.soundLock.width;
 const alD = iso.soundLock.depth;
 const alH = Math.min(2.4, h - 0.2);

 // Vestibule walls at front entrance (z = d/2)
 const alWallGeom = new THREE.BoxGeometry(0.08, alH, alD);
 const leftAlWall = new THREE.Mesh(alWallGeom, airlockMat);
 leftAlWall.position.set(-alW / 2, alH / 2, d / 2 - alD / 2);
 airlockGroup.add(leftAlWall);

 const rightAlWall = new THREE.Mesh(alWallGeom, airlockMat);
 rightAlWall.position.set(alW / 2, alH / 2, d / 2 - alD / 2);
 airlockGroup.add(rightAlWall);

 // Airlock ceiling
 const alRoof = new THREE.Mesh(new THREE.BoxGeometry(alW, 0.08, alD), airlockMat);
 alRoof.position.set(0, alH, d / 2 - alD / 2);
 airlockGroup.add(alRoof);

 // Inner acoustic heavy door (staggered slightly ajar 20°)
 const doorGeom = new THREE.BoxGeometry(alW * 0.48, alH * 0.9, 0.06);
 const door1 = new THREE.Mesh(doorGeom, doorMat);
 door1.position.set(-alW * 0.22, alH * 0.48, d / 2 - alD + 0.05);
 door1.rotation.y = 0.35;
 airlockGroup.add(door1);

 // Outer acoustic door
 const door2 = new THREE.Mesh(doorGeom, doorMat);
 door2.position.set(alW * 0.22, alH * 0.48, d / 2 - 0.05);
 door2.rotation.y = -0.3;
 airlockGroup.add(door2);

 group.add(airlockGroup);

 return group;
}
