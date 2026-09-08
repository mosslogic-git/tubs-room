import {NodeIO} from '@gltf-transform/core';
import {weld,simplify,prune,textureCompress} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'node:fs/promises';
const input=process.argv[2],out=process.argv[3];
const files=['Meshy_AI_Dual_Fan_Cabinet_0826014119_generate.glb','Meshy_AI_Meshy_AI_Industrial_D_0828112539_generate (1).glb','Meshy_AI_Honeycomb_Speaker_0828103132_texture.glb','Meshy_AI__0826020149_texture.glb'];
const io=new NodeIO();
for(let i=0;i<files.length;i++){
 let bytes=await fs.readFile(`${input}/${files[i]}`);
 // Incomplete uploads may still contain complete geometry. Strip broken image references
 // only in the working copy; never alter originals or synthesize missing texture data.
 if(bytes.readUInt32LE(8)>bytes.length){
  const n=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+n).toString());
  delete json.images;delete json.textures;delete json.materials;
  for(const mesh of json.meshes)for(const p of mesh.primitives){delete p.material;delete p.attributes.TEXCOORD_0;}
  const end=Math.max(...json.accessors.map(a=>{const v=json.bufferViews[a.bufferView];return (v.byteOffset||0)+v.byteLength;}));
  const bin=bytes.subarray(28+n,28+n+end);json.buffers[0].byteLength=bin.length;
  json.bufferViews=json.bufferViews.filter(v=>(v.byteOffset||0)+v.byteLength<=bin.length);
  const j=Buffer.from(JSON.stringify(json));const jp=Buffer.alloc(Math.ceil(j.length/4)*4,32);j.copy(jp);const bp=Buffer.alloc(Math.ceil(bin.length/4)*4);bin.copy(bp);
  bytes=Buffer.alloc(28+jp.length+bp.length);bytes.writeUInt32LE(0x46546c67,0);bytes.writeUInt32LE(2,4);bytes.writeUInt32LE(bytes.length,8);bytes.writeUInt32LE(jp.length,12);bytes.writeUInt32LE(0x4e4f534a,16);jp.copy(bytes,20);bytes.writeUInt32LE(bp.length,20+jp.length);bytes.writeUInt32LE(0x004e4942,24+jp.length);bp.copy(bytes,28+jp.length);
 }
 const doc=await io.readBinary(bytes);const root=doc.getRoot();
 const before=root.listMeshes().reduce((n,m)=>n+m.listPrimitives().reduce((n,p)=>n+p.getIndices().getCount()/3,0),0);
 await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:180000/before,error:.004}),prune(),textureCompress({encoder:sharp,targetFormat:'jpeg',resize:[2048,2048],quality:92}));
 for(const mesh of root.listMeshes())for(const p of mesh.listPrimitives()){
  if(!p.getMaterial())p.setMaterial(doc.createMaterial('Satin cabinet').setBaseColorFactor(i===1?[.17,.19,.16,1]:[.23,.25,.21,1]).setMetallicFactor(.16).setRoughnessFactor(.58));
 }
 await io.write(`${out}/speaker-${i}.glb`,doc);
 const after=root.listMeshes().reduce((n,m)=>n+m.listPrimitives().reduce((n,p)=>n+p.getIndices().getCount()/3,0),0);
 console.log(JSON.stringify({model:i,before,after,MB:(await fs.stat(`${out}/speaker-${i}.glb`)).size/1e6,textures:root.listTextures().length}));
}
