import assert from 'node:assert/strict';
import {speedOfSound,surfaces,firstReflection,traceRay,earlyPaths,beamGain,sabine,roomModes,modalShape,treatmentPanels} from '../dist/acoustic-physics.js';
import {placements,configuration} from '../dist/config.js';
const near=(a,b,eps=1e-7)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);
const room={width:8,height:3,depth:10},o={walls:.1,floor:.1,ceiling:.1,panelAlpha:.8,temperature:20,treated:false};
const source={position:[-2,1,0],beam:null},receiver=[2,1,0];
near(speedOfSound(20),343.21462268,.001);
const left=surfaces(room)[0],p=firstReflection(source.position,receiver,left);assert.deepEqual(p,[-4,1,0]);
const paths=earlyPaths(room,[source],receiver,o);near(paths[0].distance,4);const reflected=paths.find(p=>p.wall?.id==='left');near(reflected.distance,8);near(reflected.energy,.9/64);
const ray=traceRay(room,source,[1,0,0],o,[],2);assert.deepEqual(ray.map(s=>s.b[0]),[4,-4,4]);near(ray[0].end,6);near(ray[1].end,14);near(ray[1].energy,.9);near(ray[2].energy,.81);
const treated={...o,treated:true,panelAlpha:1},panels=[{wall:surfaces(room)[1],center:[4,1,0],width:1.2,height:1.2}];assert.equal(traceRay(room,source,[1,0,0],treated,panels,4).length,1);
const angle=50*Math.PI/180;near(10*Math.log10(beamGain([Math.sin(angle),0,Math.cos(angle)],{h:100,up:50,down:50,conical:true})),-6);
for(const [degrees,sign] of [[10,1],[50,-1]]){const a=degrees*Math.PI/180;near(10*Math.log10(beamGain([0,Math.sin(a)*sign,Math.cos(a)],{h:110,up:10,down:50})),-6);}
const modes=roomModes(room,20);const axial=modes.find(m=>m.n.join(',')==='1,0,0');near(axial.f,speedOfSound(20)/16);near(modalShape(room,[1,0,0],[0,1,0]),0);near(modalShape(room,[1,0,0],[-4,1,0]),1);near(modalShape(room,[1,0,0],[4,1,0]),-1);
const treatment=treatmentPanels(room,paths);assert.ok(sabine(room,{...o,treated:true},treatment)<sabine(room,o));
let cases=0;for(let width=4;width<=16;width+=.5)for(let depth=5;depth<=20;depth+=.5)for(const cluster of [false,true]){const p=placements({width,depth,cluster,model:'auto'}),c=configuration(width*depth);assert.equal(p.length,c.tops+c.subs);for(const s of p){assert.ok(Math.abs(s.x)+s.size[0]/2<=width/2+.001);assert.ok(Math.abs(s.z)+s.size[2]/2<=depth/2+.001);assert.ok(s.y+s.size[1]<2.5);cases++;}}
console.log('PASS: analytical image paths, inverse-square energy, reflection direction/loss, full absorption, beam angles, modal frequencies/nodes, Sabine treatment, and '+cases+' cabinet bounds.');
