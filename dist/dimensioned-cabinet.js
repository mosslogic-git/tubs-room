import * as THREE from './vendor/three.module.js';

// Dimensioned visual representations, not manufacturer CAD or internal designs.
// Build at metre scale; never stretch cones or grille geometry to fit a cabinet.
export function dimensionedCabinet(id,size){
 const [w,h,d]=size,group=new THREE.Group();
 const shell=new THREE.MeshStandardMaterial({color:0xb5b9ae,roughness:.82});
 const dark=new THREE.MeshStandardMaterial({color:0x111514,roughness:.92});
 const cone=new THREE.MeshStandardMaterial({color:0x252c29,roughness:.85});
 const metal=new THREE.MeshStandardMaterial({color:0x6b746d,roughness:.45,metalness:.65});
 const wall=.018;
 function box(x,y,z,px,py,pz,material=shell){const m=new THREE.Mesh(new THREE.BoxGeometry(x,y,z),material);m.position.set(px,py,pz);m.castShadow=m.receiveShadow=true;group.add(m);return m;}
 box(w,wall,d,0,wall/2,0);box(w,wall,d,0,h-wall/2,0);
 box(wall,h-2*wall,d,-w/2+wall/2,h/2,0);box(wall,h-2*wall,d,w/2-wall/2,h/2,0);
 box(w-2*wall,h-2*wall,wall,0,h/2,-d/2+wall/2);
 box(w-2*wall,h-2*wall,.015,0,h/2,d/2-.075,dark);
 // Driver positions are illustrative; cabinet envelopes follow the spec table.
 const count=id==='gc218'?2:['dc12','gc118-sub'].includes(id)?1:0;
 const nominal=id==='dc12'?.3048:id.startsWith('gc')?.4572:Math.min(w*.65,.24);
 const radius=Math.min(nominal/2,(w/count-.065)/2,(h-.1)/2);
 for(let i=0;i<count;i++){
  const x=(i-(count-1)/2)*w/count,y=h/2,z=d/2-.048;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.009,8,64),dark);ring.position.set(x,y,z);group.add(ring);
  const diaphragm=new THREE.Mesh(new THREE.ConeGeometry(radius-.012,.035,64,1,true),cone);diaphragm.rotation.x=Math.PI/2;diaphragm.position.set(x,y,z-.022);group.add(diaphragm);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(radius*.24,24,12),dark);cap.scale.z=.35;cap.position.set(x,y,z-.01);group.add(cap);
 }
 // Constant-pitch grille: its openings never change shape with the cabinet size.
 const points=[],pitch=.012,front=d/2-.012;
 for(let x=-w/2+.03;x<w/2-.025;x+=pitch)points.push(x,.03,front,x,h-.03,front);
 for(let y=.03;y<h-.025;y+=pitch)points.push(-w/2+.03,y,front,w/2-.03,y,front);
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
 group.add(new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0x68736a,transparent:true,opacity:.48})));
 for(const x of [-w/2+.035,w/2-.035])for(const y of [.035,h-.035]){const bolt=new THREE.Mesh(new THREE.CylinderGeometry(.003,.003,.004,8),metal);bolt.rotation.x=Math.PI/2;bolt.position.set(x,y,d/2-.006);group.add(bolt);}
 group.userData.dimensioned=true;return group;
}
