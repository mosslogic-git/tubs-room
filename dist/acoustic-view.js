import * as THREE from 'three';
import {configuration,placements} from './config.js';
import {speakerSpecs} from './speaker-specs.js';
import {speedOfSound,earlyPaths,treatmentPanels,sabine,roomModes,modalShape,sourceCoupling,distance,calculatePointSPL,calculateSPLGrid,calculateIsolationAssemblies} from './acoustic-physics.js';
import {createSoundIsolationEnvelope} from './sound-isolation.js';
const TRAIL_POINTS=12,TRAIL_LENGTH=.65;
const $=id=>document.getElementById(id),V=p=>new THREE.Vector3(...p);
export function createAcousticView(scene,initial,reduced,actions){
 let room={...initial},enabled=false,clock=0,playing=!reduced,mode='rays',group=new THREE.Group(),rayData=[],particles=null,modeMesh=null,modeValues=null,modeFrequency=63,coupling=1,cycle=.3,pending=null,splMesh=null;
 scene.add(group);group.visible=false;
 const o={frequency:1000,temperature:20,walls:.08,floor:.05,ceiling:.10,panelAlpha:.8,treated:false,lx:.5,lz:.65,ly:1.2,slow:40};
 const clear=()=>{group.traverse(m=>{m.geometry?.dispose();if(m.material){if(m.material.map)m.material.map.dispose();m.material.dispose();}});group.clear();rayData=[];particles=modeMesh=splMesh=null;};
 function line(points,color,opacity=.7){const g=new THREE.BufferGeometry().setFromPoints(points.map(V));group.add(new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity,depthTest:true})));}
 function listener(p){const ball=new THREE.Mesh(new THREE.SphereGeometry(.075,12,8),new THREE.MeshBasicMaterial({color:0xdea3cf}));ball.position.copy(V(p));group.add(ball);line([[p[0],.02,p[2]],p],0xdea3cf,.5);const ring=new THREE.Mesh(new THREE.RingGeometry(.17,.19,32),new THREE.MeshBasicMaterial({color:0xdea3cf,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(p[0],.015,p[2]);group.add(ring);}
 function allSources(){return placements(room).map(p=>({position:[p.x,p.y+p.height*.7,p.z+p.size[2]/2+.01],beam:speakerSpecs[p.productId].beam,productId:p.productId,role:p.role}));}
 function showSpecs(){const c=configuration(room.width*room.depth);$('ac-specs').innerHTML=c.products.map(p=>{const s=speakerSpecs[p.id];return `<p><b>${s.name}</b> · ${s.range[0]}–${s.range[1]} Hz<br>${s.dispersion}<br>${s.power}<br>${s.output}${s.dimensionNote?'<br>'+s.dimensionNote:''}<br><a href="${s.sheet}" target="_blank" rel="noopener">Manufacturer sheet ↗</a></p>`;}).join('');}
 function splToColor(db,target){
  const t=THREE.MathUtils.clamp((db-80)/(115-80),0,1);
  if(t<0.3){const f=t/0.3;target.setRGB(0.05+0.06*f,0.12+0.24*f,0.24+0.23*f);}
  else if(t<0.6){const f=(t-0.3)/0.3;target.setRGB(0.11+0.16*f,0.36+0.29*f,0.47+0.08*f);}
  else if(t<0.8){const f=(t-0.6)/0.2;target.setRGB(0.27+0.67*f,0.65-0.20*f,0.55-0.30*f);}
  else{const f=(t-0.8)/0.2;target.setRGB(0.94+0.03*f,0.45+0.42*f,0.25-0.12*f);}
 }
 function buildSPL(receiver){
  const sources=allSources(),resX=40,resZ=50;
  const grid=calculateSPLGrid(room,sources,resX,resZ,receiver[1]);
  const geometry=new THREE.PlaneGeometry(room.width,room.depth,resX-1,resZ-1);
  geometry.rotateX(-Math.PI/2);
  const colors=new Float32Array(resX*resZ*3),tempColor=new THREE.Color();
  for(let i=0;i<grid.values.length;i++){
   splToColor(grid.values[i],tempColor);
   colors[i*3]=tempColor.r;colors[i*3+1]=tempColor.g;colors[i*3+2]=tempColor.b;
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  splMesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:0.85,side:THREE.DoubleSide,depthWrite:false}));
  splMesh.position.y=0.005;group.add(splMesh);
  const listenerVal=calculatePointSPL(receiver,sources);
  $('ac-spl-listener-val').textContent=listenerVal.toFixed(1)+' dB';
  $('ac-spl-peak-val').textContent=grid.maxSPL.toFixed(1)+' dB';
  $('ac-spl-pill').textContent='Listener: '+listenerVal.toFixed(1)+' dB';
  $('ac-clock').textContent=`Direct SPL dancefloor coverage · ear height ${o.ly.toFixed(1)} m`;
 }
 function buildIsolation(){
  const sources=allSources();
  const isoSpecs=calculateIsolationAssemblies(room,sources,45);
  const env=createSoundIsolationEnvelope(room,isoSpecs);
  group.add(env);
  $('ac-iso-req-tl').textContent=`${isoSpecs.reqTL} dB`;
  $('ac-iso-peak-spl').textContent=`${isoSpecs.exposure.peakSPL.toFixed(1)} dB (${isoSpecs.exposure.boundaries[isoSpecs.exposure.peakBoundary].name})`;
  $('ac-iso-floor-pucks').textContent=`${isoSpecs.floatingFloor.totalPucks} pads · ${isoSpecs.floatingFloor.floorResonanceHz} Hz f₀`;
  $('ac-iso-wall-cavity').textContent=`${isoSpecs.walls.cavityDepthMm} mm · ${isoSpecs.walls.mineralWoolDensityKgM3} kg/m³`;
  $('ac-iso-ceiling-springs').textContent=`${isoSpecs.ceiling.springCount} spring hangers · ${isoSpecs.ceiling.springResonanceHz} Hz`;
  $('ac-iso-soundlock').textContent=`+${isoSpecs.soundLock.attenuationDb} dB attenuation (2 doors)`;
  $('ac-clock').textContent=`Sound isolation envelope · Peak ${isoSpecs.exposure.peakSPL.toFixed(1)} dB → Target 45 dBA`;
 }
 function rebuild(){
 clear();clock=0;showSpecs();const receiver=[(o.lx-.5)*room.width,Math.min(o.ly,room.height-.15),(o.lz-.5)*room.depth],c=speedOfSound(o.temperature);listener(receiver);
 actions?.setIsolationMode?.(mode==='isolation');
 $('ac-speed').textContent=`Sound speed ${c.toFixed(1)} m/s. Animation at ${o.slow===1?'real time':o.slow+'× slower than real time'}.`;
 $('ac-ray-controls').hidden=mode==='modes'||mode==='spl'||mode==='isolation';
 $('ac-mode-controls').hidden=mode!=='modes';
 $('ac-spl-controls').hidden=mode!=='spl';
 $('ac-isolation-controls').hidden=mode!=='isolation';
 document.querySelectorAll('#ac-legend>span').forEach((el,i)=>el.hidden=mode==='modes'||mode==='spl'||mode==='isolation'||(i===1&&mode==='rays')||(i===2&&mode!=='treatment'));
 $('ac-mode-legend').hidden=mode!=='modes';
 $('ac-spl-legend').hidden=mode!=='spl';
 $('ac-isolation-legend').hidden=mode!=='isolation';
 $('ac-treatment-wrap').hidden=mode!=='treatment';
 if(mode==='modes'){buildModes(receiver,c);group.visible=enabled;return;}
 if(mode==='spl'){buildSPL(receiver);group.visible=enabled;return;}
 if(mode==='isolation'){buildIsolation();group.visible=enabled;return;}
 const sources=allSources().filter(s=>{const spec=speakerSpecs[s.productId];return o.frequency>=spec.range[0]&&o.frequency<=spec.range[1];});
 const baseline=earlyPaths(room,sources,receiver,{...o,treated:false}),panels=treatmentPanels(room,baseline),paths=earlyPaths(room,sources,receiver,o,panels);
 $('ac-beam').textContent=sources.length?`${[...new Set(sources.map(s=>speakerSpecs[s.productId].name+' · '+speakerSpecs[s.productId].dispersion))].join('; ')}. Nominal beam approximation, not measured polar data.`:'No cabinet covers this band.';
 const direct=paths.filter(p=>!p.wall),directEnergy=direct.reduce((s,p)=>s+p.energy,0),maxEnergy=Math.max(...paths.map(p=>p.energy),1e-12);
 $('ac-arrival').textContent=direct.length?(Math.min(...direct.map(p=>p.distance))/c*1000).toFixed(1)+' ms':'—';
 const before=sabine(room,{...o,treated:false}),after=sabine(room,{...o,treated:true},panels);$('ac-rt').textContent=(o.treated?after:before).toFixed(2)+' s';
 $('ac-treatment-result').textContent=`${panels.length} non-overlapping 1.2 × 1.2 m panels at strongest available first-reflection points. Estimated decay: ${before.toFixed(2)} → ${after.toFixed(2)} s if applied. Reflections are receiver-specific; this is a treatment starting point.`;
 $('ac-reflections').innerHTML=panels.map((p,i)=>{const matching=paths.find(x=>x.source===p.path.source&&x.wall?.id===p.wall.id)||p.path;const db=10*Math.log10(Math.max(matching.energy,1e-12)/Math.max(directEnergy,1e-12));return `<li>${p.wall.name}<small>${(matching.distance/c*1000).toFixed(1)} ms · ${db.toFixed(1)} dB vs summed direct energy</small></li>`;}).join('');
 const visibleDirect=direct.slice().sort((a,b)=>b.energy-a.energy).slice(0,4);
 const selectedPanels=[];
 for(const side of [-1,1]){
  const sidePanels=panels.filter(p=>(side<0?p.path.source.position[0]<0:p.path.source.position[0]>0));
  const sideWalls=new Set();
  for(const p of sidePanels){
   if(sideWalls.has(p.wall.id))continue;
   sideWalls.add(p.wall.id);
   selectedPanels.push(p);
   if(sideWalls.size>=2)break;
  }
 }
 const visiblePaths=[...visibleDirect];
 if(mode!=='rays')for(const panel of selectedPanels){const p=paths.find(p=>p.source===panel.path.source&&p.wall?.id===panel.wall.id);if(p)visiblePaths.push(p);}
 visiblePaths.forEach(p=>{
  const strength=Math.min(1,Math.sqrt(p.energy/maxEnergy));
  line(p.points,p.wall?0xe9b96a:0x8acbff,(p.wall?.13:.22)*strength);
  let start=0;const segments=[];
  for(let i=1;i<p.points.length;i++){
   const a=p.points[i-1],b=p.points[i],end=start+distance(a,b);
   segments.push({a,b,start,end,bounce:i-1,energy:p.energy/maxEnergy});start=end;
  }
  // Small travelling fronts are direction cues, not a calculated pressure surface.
  const front=new THREE.Mesh(new THREE.RingGeometry(.86,1,40),new THREE.MeshBasicMaterial({color:0x8acbff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));
  group.add(front);segments.front=front;rayData.push(segments);
 });
 if(mode==='treatment')for(const panel of selectedPanels){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(panel.width,panel.height),new THREE.MeshBasicMaterial({color:0x8cc271,transparent:true,opacity:o.treated?.6:.22,side:THREE.DoubleSide,depthWrite:false}));const center=panel.center.slice();center[panel.wall.axis]+=panel.wall.bound<=0?.018:-.018;m.position.copy(V(center));if(panel.wall.axis===0)m.rotation.y=Math.PI/2;else if(panel.wall.axis===1)m.rotation.x=-Math.PI/2;group.add(m);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(rayData.length*TRAIL_POINTS*3),3));geometry.setAttribute('color',new THREE.BufferAttribute(new Float32Array(rayData.length*TRAIL_POINTS*3),3));particles=new THREE.Points(geometry,new THREE.PointsMaterial({size:.085,vertexColors:true,transparent:true,opacity:.9,depthWrite:false}));particles.frustumCulled=false;group.add(particles);cycle=Math.max(.03,...rayData.map(r=>(r.at(-1).end+TRAIL_LENGTH)/c))+.02;
 if(reduced)clock=cycle*.3;group.visible=enabled;renderFrame();
 }
 function buildModes(receiver,c){
 const modes=roomModes(room,o.temperature),old=$('ac-eigenmode').value;let selected=modes.find(m=>m.n.join(',')===old)||modes.reduce((a,b)=>Math.abs(b.f-63)<Math.abs(a.f-63)?b:a,modes[0]);
 $('ac-eigenmode').innerHTML=modes.map(m=>`<option value="${m.n.join(',')}">${m.f.toFixed(1)} Hz · (${m.n.join(', ')})</option>`).join('');$('ac-eigenmode').value=selected.n.join(',');modeFrequency=selected.f;
 const sources=allSources().filter(s=>{const spec=speakerSpecs[s.productId];return selected.f>=spec.range[0]&&selected.f<=spec.range[1];});coupling=sourceCoupling(room,selected.n,sources);
 $('ac-mode-note').textContent=`${selected.f.toFixed(1)} Hz · wavelength ${(c/selected.f).toFixed(2)} m · ${sources.length} in-range sources. Equal-phase modal coupling ${coupling.toFixed(2)} (−1 to +1). ${Math.abs(coupling)<.01?'This mode is barely excited under these source assumptions.':''}`;
 const geometry=new THREE.PlaneGeometry(room.width,room.depth,64,64);geometry.rotateX(-Math.PI/2);const pos=geometry.attributes.position;modeValues=new Float32Array(pos.count);for(let i=0;i<pos.count;i++)modeValues[i]=modalShape(room,selected.n,[pos.getX(i),receiver[1],pos.getZ(i)])*coupling;geometry.setAttribute('color',new THREE.BufferAttribute(new Float32Array(pos.count*3),3));modeMesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.65,side:THREE.DoubleSide,depthWrite:false}));modeMesh.position.y=receiver[1];group.add(modeMesh);cycle=1/selected.f;
 renderFrame();
 }
 function renderFrame(){
 if(mode==='modes'&&modeMesh){const colors=modeMesh.geometry.attributes.color,phase=Math.cos(2*Math.PI*modeFrequency*clock),color=new THREE.Color();for(let i=0;i<modeValues.length;i++){const a=modeValues[i]*phase;color.set(a>=0?0x70bcf0:0xd58abf);color.multiplyScalar(.025+.975*Math.abs(a));colors.setXYZ(i,color.r,color.g,color.b);}colors.needsUpdate=true;$('ac-clock').textContent=`Ideal rigid-room mode · ${(clock*1000).toFixed(1)} ms · ${o.slow}× slower · normalized pressure`;
 }else if(particles){
 const pos=particles.geometry.attributes.position,col=particles.geometry.attributes.color,c=speedOfSound(o.temperature),d=clock*c,color=new THREE.Color();
 rayData.forEach((path,i)=>{
  const head=path.find(s=>d>=s.start&&d<s.end),front=path.front;
  front.visible=!!head;
  if(head){
   const t=(d-head.start)/(head.end-head.start);
   front.position.copy(V(head.a)).lerp(V(head.b),t);
   front.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),V(head.b).sub(V(head.a)).normalize());
   front.scale.setScalar(Math.min(.42,.10+d*.025));
   front.material.color.set(head.bounce?0xe9b96a:0x8acbff);
   const fade=Math.min(1,d/.3,(path.at(-1).end-d)/.4);
   front.material.opacity=.38*Math.sqrt(head.energy)*Math.max(0,fade);
  }
  for(let j=0;j<TRAIL_POINTS;j++){
   const index=i*TRAIL_POINTS+j,travel=d-j*TRAIL_LENGTH/(TRAIL_POINTS-1),segment=path.find(s=>travel>=s.start&&travel<s.end);
   if(!segment){pos.setXYZ(index,0,-1000,0);col.setXYZ(index,0,0,0);continue;}
   const t=(travel-segment.start)/(segment.end-segment.start);
   pos.setXYZ(index,segment.a[0]+(segment.b[0]-segment.a[0])*t,segment.a[1]+(segment.b[1]-segment.a[1])*t,segment.a[2]+(segment.b[2]-segment.a[2])*t);
   color.set(segment.bounce?0xe9b96a:0x8acbff);
   color.multiplyScalar(Math.sqrt(segment.energy)*(1-j/TRAIL_POINTS)**1.5);
   col.setXYZ(index,color.r,color.g,color.b);
  }
 });
 pos.needsUpdate=col.needsUpdate=true;$('ac-clock').textContent=`${mode==='rays'?'Direct sound':mode==='treatment'?'Reflection treatment':'Early reflections'} · ${o.slow===1?'real time':o.slow+'× slower'}`;
 }

 }
 function show(on){enabled=on;group.visible=on;$('ac-legend').hidden=!on;$('sound-btn').setAttribute('aria-pressed',String(on));if(!on)actions?.setIsolationMode?.(false);if(on)rebuild();}
 $('sound-btn').disabled=false;$('sound-btn').addEventListener('click',()=>{if(enabled){show(false);return;}show(true);actions.overview();actions.open();});
 $('tab-sound').addEventListener('click',()=>show(true));$('ac-hide').addEventListener('click',()=>show(false));$('ac-overview').addEventListener('click',actions.overview);
 $('ac-play').textContent=playing?'Pause':'Play';$('ac-play').setAttribute('aria-pressed',String(playing));$('ac-play').addEventListener('click',()=>{playing=!playing;$('ac-play').textContent=playing?'Pause':'Play';$('ac-play').setAttribute('aria-pressed',String(playing));});
 $('ac-mode').addEventListener('change',e=>{mode=e.target.value;rebuild();});$('ac-eigenmode').addEventListener('change',rebuild);$('ac-frequency').addEventListener('change',e=>{o.frequency=+e.target.value;rebuild();});$('ac-slow').addEventListener('change',e=>{o.slow=+e.target.value;rebuild();});$('ac-treatment').addEventListener('change',e=>{o.treated=e.target.checked;rebuild();});
 const controls=[['walls','walls',1,''],['floor','floor',1,''],['ceiling','ceiling',1,''],['panel','panelAlpha',1,''],['listener-x','lx',.01,'%'],['listener-z','lz',.01,'%'],['listener-y','ly',1,' m'],['temperature','temperature',1,'°C']];
 for(const [id,key,factor,suffix] of controls)$('ac-'+id).addEventListener('input',e=>{o[key]=+e.target.value*factor;$('ac-'+id+'-out').textContent=(suffix?e.target.value:(+e.target.value).toFixed(2))+suffix;rebuild();});
 rebuild();
 return {update(next){room={...next};clearTimeout(pending);group.visible=false;pending=setTimeout(rebuild,350);},tick(dt){if(!enabled||!group.visible)return;if(playing)clock=(clock+dt/o.slow)%cycle;renderFrame();}};
}
