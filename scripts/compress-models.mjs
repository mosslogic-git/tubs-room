import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {simplify,meshopt,cloneDocument,textureCompress} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptSimplifier} from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'node:fs/promises';
await MeshoptEncoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder});
const out=process.argv[2];
for(let i=0;i<4;i++){
 const high=await io.read(`${out}/speaker-${i}.glb`),low=cloneDocument(high);
 await low.transform(simplify({simplifier:MeshoptSimplifier,ratio:1/6,error:.02}),textureCompress({encoder:sharp,resize:[512,512],targetFormat:'jpeg',quality:85}),meshopt({encoder:MeshoptEncoder,level:'medium'}));
 await high.transform(meshopt({encoder:MeshoptEncoder,level:'medium'}));
 await io.write(`${out}/speaker-${i}.glb`,high);await io.write(`${out}/speaker-${i}-lod.glb`,low);
 console.log(i,'high MB',(await fs.stat(`${out}/speaker-${i}.glb`)).size/1e6,'low MB',(await fs.stat(`${out}/speaker-${i}-lod.glb`)).size/1e6);
}
