import {speakerSpecs} from './speaker-specs.js';
import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {MeshoptDecoder} from './vendor/meshopt_decoder.mjs';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';
import {configuration,stages,placements,dimensionsForArea,monitorPlacements} from './config.js';
import {speakerFrame,pickSpeaker,bindSpeakerSelection} from './speaker-focus.js';
import {createRoomWalk,bindRoomWalk} from './camera-walk.js';
import {createCameraZoom,bindCameraGestures} from './camera-zoom.js';
import {createAcousticView} from './acoustic-view.js';
const $=id=>document.getElementById(id),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const state={width:8,depth:10,height:3.5,model:'auto',cluster:false,view:'inside',focus:null,club:false};
let scene,camera,renderer,controls,room,art,ceiling,back,sideWalls=[],strips=[],templates=[],speakers=[],frame,last=0,ready=false,currentStage='',drag=null,yaw=0,pitch=0;
let ambient,key,rim,fill,wallMaterial,floorMaterial,artMaterial,acoustics;
const targetSize=new THREE.Vector3(8,3.5,10),currentSize=targetSize.clone(),nextCam=new THREE.Vector3(),nextLook=new THREE.Vector3(),look=new THREE.Vector3(0,1,-4),scaleVector=new THREE.Vector3();
const zoom=createCameraZoom({getCamera:()=>camera,slider:$('camera-zoom'),output:$('camera-zoom-out'),minus:$('zoom-out'),plus:$('zoom-in')});
const walk=createRoomWalk();
let focusedSpeaker=null;
const nav=$('products');
nav.innerHTML=stages.map(s=>`<section class="product-group" data-group="${s.id}"><button class="group-button" data-stage="${s.id}" aria-expanded="false" aria-controls="list-${s.id}"><span>${s.family}</span><span>${s.tier}</span></button><div class="product-list"><div id="list-${s.id}" inert>${s.products.map(p=>`<button class="product-item" data-product="${p.id}"><span>${p.name}</span><span class="qty">×${p.count}</span></button>`).join('')}</div></div></section>`).join('');
nav.querySelectorAll('[data-stage]').forEach(b=>b.addEventListener('click',()=>{const s=stages.find(s=>s.id===b.dataset.stage);Object.assign(state,dimensionsForArea(s.area));update();}));
nav.querySelectorAll('[data-product]').forEach(b=>b.addEventListener('click',()=>{const p=configuration(state.width*state.depth).products.find(p=>p.id===b.dataset.product);if(p)focusProduct(p);}));
function syncNavigation(config){
 document.querySelectorAll('[data-group]').forEach(g=>{const active=g.dataset.group===config.id;g.classList.toggle('current',active);g.querySelector('.group-button').setAttribute('aria-expanded',String(active));g.querySelector('.product-list>div').inert=!active;});
 nav.querySelectorAll('[data-product]').forEach(b=>{const active=b.dataset.product===(state.focus||config.products[0].id);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 if(currentStage!==config.id){currentStage=config.id;$('system-status').textContent=`${config.family}: ${config.products.map(p=>p.count+' '+p.name).join(', ')}. Concept pairing.`;}
}
function update(){
 state.focus=null;focusedSpeaker=null;document.body.classList.remove('focused');$('focus-info').hidden=true;
 const area=state.width*state.depth,config=configuration(area);
 $('area').textContent=Math.round(area);$('size').value=area;
 ['width','depth','height'].forEach(k=>{$(k).value=state[k];$(k+'-out').textContent=state[k].toFixed(1)+' m';});
 $('room-label').textContent=`${state.width.toFixed(1)} × ${state.depth.toFixed(1)} × ${state.height.toFixed(1)} m`;
 $('system-name').textContent=config.name;$('chapter').textContent=config.tier+' / '+config.family.toUpperCase();$('total-count').textContent=config.tops+config.subs;
 document.querySelectorAll('[data-area]').forEach(b=>{const active=configuration(+b.dataset.area).id===config.id;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
 $('layout').disabled=config.subs===0;
 syncNavigation(config);targetSize.set(state.width,state.height,state.depth);
 if(ready){arrange();acoustics?.update(state);if(state.view!=='inside')setView(state.view);}
}
$('size').addEventListener('input',e=>{Object.assign(state,dimensionsForArea(+e.target.value,state.width/state.depth));update();});
['width','depth','height'].forEach(k=>$(k).addEventListener('input',e=>{state[k]=+e.target.value;update();}));
document.querySelectorAll('[data-area]').forEach(b=>b.addEventListener('click',()=>{Object.assign(state,dimensionsForArea(+b.dataset.area));update();}));
$('model').addEventListener('change',e=>{state.model=e.target.value;update();});$('layout').addEventListener('change',e=>{state.cluster=e.target.checked;update();});
function toggleDetails(open){walk.stop();$('details').hidden=!open;$('details-btn').setAttribute('aria-expanded',String(open));if(open)$('close-details').focus();else $('details-btn').focus();}
const tabs=[...document.querySelectorAll('[data-tab]')];
function selectTab(tab){tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;$('panel-'+t.dataset.tab).hidden=!active;});}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectTab(tab));tab.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();selectTab(tabs[n]);tabs[n].focus();});});
$('details-btn').addEventListener('click',()=>toggleDetails($('details').hidden));$('close-details').addEventListener('click',()=>toggleDetails(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('details').hidden)toggleDetails(false);else clearFocus();}});
$('reset').addEventListener('click',()=>{zoom.reset();walk.reset({width:8,depth:10});Object.assign(state,{width:8,depth:10,height:3.5,model:'auto',cluster:false});$('model').value='auto';$('layout').checked=false;update();setView('inside');});
$('reset-view').addEventListener('click',()=>{zoom.reset();walk.reset(state);clearFocus();setView('inside');});document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
$('lighting').addEventListener('click',()=>{state.club=!state.club;document.body.classList.toggle('club',state.club);$('lighting').setAttribute('aria-pressed',state.club);applyLighting();});
$('unfocus').addEventListener('click',clearFocus);
function clearFocus(){state.focus=null;focusedSpeaker=null;$('focus-info').hidden=true;document.body.classList.remove('focused');syncNavigation(configuration(state.width*state.depth));yaw=pitch=0;}
function focusProduct(product,speaker=null){if(!ready)return;if(!$('details').hidden)toggleDetails(false);focusedSpeaker=speaker||speakers.find(s=>s.productId===product.id&&s.scale===1);if(!focusedSpeaker)return;state.focus=product.id;zoom.reset();setView('inside',true);$('focus-info').hidden=false;$('focus-title').textContent=product.name;$('focus-desc').textContent='Drag to inspect. Pinch or scroll for a closer look.';$('product-link').href=`https://tubs-audio-nz.netlify.app/products/${product.id}`;document.body.classList.add('focused');syncNavigation(configuration(state.width*state.depth));}
$('inspect-in').addEventListener('click',()=>zoom.set(zoom.value*1.2));
$('inspect-out').addEventListener('click',()=>zoom.set(zoom.value/1.2));
$('inspect-fit').addEventListener('click',()=>{zoom.reset();yaw=pitch=0;});

function setView(view,retainFocus=false){
 state.view=view;walk.stop();drag=null;$('walk-controls').hidden=view!=='inside'||!ready;document.body.classList.toggle('inside-view',view==='inside');yaw=pitch=0;if(!retainFocus)clearFocus();
 document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-pressed',String(b.dataset.view===view));});
 $('look-hint').textContent=view==='inside'?'WASD or arrow keys to move. Drag to look around. Pinch or scroll to zoom.':'Drag to orbit. Pinch or scroll to zoom.';
 if(!camera||!ceiling)return;controls.enabled=view!=='inside';ceiling.visible=view==='inside';sideWalls.forEach(w=>{w.material.opacity=view==='inside'?1:.1;w.material.depthWrite=view==='inside';});back.material.opacity=view==='inside'?1:.22;back.material.depthWrite=view==='inside';
 if(view!=='inside'){const s=Math.max(state.width,state.depth),mobile=camera.aspect<.7?1.7:1.2;controls.target.set(0,.8,0);camera.fov=45;camera.position.set(view==='plan'?0:s*.9*mobile,s*(view==='plan'?1.7:1.05)*mobile,view==='plan'?.01:s*1.15*mobile);camera.lookAt(controls.target);camera.updateProjectionMatrix();controls.update();}
}
function createCabinet(item){
 const obj=new THREE.LOD();obj.addLevel(templates[item.index].high.clone(true),0);obj.addLevel(templates[item.index].low.clone(true),11,.15);if(item.role==='bass')obj.rotation.z=Math.PI/2;
 obj.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(obj),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
 obj.position.set(-center.x,-box.min.y,-center.z);
 obj.traverse(m=>{if(m.isMesh){m.material=m.material.clone();m.castShadow=true;m.receiveShadow=true;}});
 const scaled=new THREE.Group();scaled.add(obj);scaled.scale.set(item.size[0]/size.x,item.size[1]/size.y,item.size[2]/size.z);
 const shell=new THREE.Group();shell.add(scaled);scene.add(shell);shell.scale.setScalar(reduced?1:.001);shell.position.set(item.x,item.y,item.z);
 return {object:shell,position:new THREE.Vector3(),scale:1,key:`${item.zone||"main"}-${item.index}-${item.productId}`,role:item.role,productId:item.productId,size:[...item.size]};
}
function arrange(){
 const old=[...speakers],next=[];
 for(const item of [...placements(state),...monitorPlacements(state)]){const key=`${item.zone||"main"}-${item.index}-${item.productId}`,i=old.findIndex(s=>s.key===key),s=i<0?createCabinet(item):old.splice(i,1)[0];s.position.set(item.x,item.y,item.z);s.object.rotation.y=item.rotation||0;s.scale=1;next.push(s);}
 old.forEach(s=>s.scale=0);speakers=[...next,...old];
}
function floorTexture(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),data=x.createImageData(128,128);let seed=38;for(let i=0;i<data.data.length;i+=4){seed=(seed*16807)%2147483647;const n=125+seed%18;data.data.set([n,n,n,255],i);}x.putImageData(data,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(18,18);return t;}
function makePlane(material,x,y,z,rx=0,ry=0){const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),material);m.position.set(x,y,z);m.rotation.set(rx,ry,0);m.receiveShadow=true;room.add(m);return m;}
function applyLighting(){if(!ambient||!artMaterial)return;const club=state.club;scene.background.set(club?0x070b0d:0x171d13);scene.fog.color.copy(scene.background);scene.fog.density=club?.032:.018;ambient.intensity=club?.9:2.25;key.intensity=club?3.3:4.4;key.color.set(club?0xa8df75:0xf2efd9);rim.intensity=club?5:2.5;rim.color.set(club?0x7ca8e7:0xb9d298);fill.intensity=club?1.2:2.4;floorMaterial.color.set(club?0x18201c:0x535747);wallMaterial.color.set(club?0x080c10:0x171c20);sideWalls.forEach(w=>w.material.color.set(club?0x151d1a:0x434b3a));ceiling.material.color.set(club?0x202b3b:0x465361);artMaterial.opacity=club?.65:.85;strips.forEach(s=>s.material.color.set(club?0x92b3d5:0xc5d8af));}
async function init(){
 try{
 scene=new THREE.Scene();scene.background=new THREE.Color(0x171d13);scene.fog=new THREE.FogExp2(0x171d13,.018);
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;$('viewport').appendChild(renderer.domElement);
 const studio=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(studio,.04).texture;scene.environmentIntensity=.3;studio.dispose();pmrem.dispose();
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);$('loading').hidden=false;$('loading').querySelector('p').textContent='3D view paused. Reload to restore the room.';});
 camera=new THREE.PerspectiveCamera(65,1,.08,150);camera.position.set(0,1.65,3.8);controls=new OrbitControls(camera,renderer.domElement);controls.enabled=false;controls.enableDamping=!reduced;controls.minDistance=5;controls.maxDistance=90;controls.maxPolarAngle=Math.PI/2-.025;controls.enablePan=false;controls.enableZoom=false;zoom.set(zoom.value);
 ambient=new THREE.HemisphereLight(0xe4eddc,0x283320,2.25);scene.add(ambient);key=new THREE.DirectionalLight(0xf2efd9,4.4);key.position.set(-3,7,4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-13,right:13,top:12,bottom:-12,near:.1,far:45});key.shadow.bias=-.0006;key.shadow.normalBias=.02;scene.add(key);
 rim=new THREE.DirectionalLight(0xb9d298,2.5);rim.position.set(5,3,-8);scene.add(rim);fill=new THREE.DirectionalLight(0xd3e3f0,2.4);fill.position.set(0,3,7);scene.add(fill);
 room=new THREE.Group();scene.add(room);floorMaterial=new THREE.MeshStandardMaterial({color:0x535747,roughness:.8,map:floorTexture()});makePlane(floorMaterial,0,0,0,-Math.PI/2);
 wallMaterial=new THREE.MeshStandardMaterial({color:0x171c20,roughness:1,side:THREE.DoubleSide,transparent:true});back=makePlane(wallMaterial,0,.5,-.5);
 sideWalls=[makePlane(wallMaterial.clone(),-.5,.5,0,0,Math.PI/2),makePlane(wallMaterial.clone(),.5,.5,0,0,-Math.PI/2),makePlane(wallMaterial.clone(),0,.5,.5,0,Math.PI)];
 ceiling=makePlane(new THREE.MeshStandardMaterial({color:0x465361,roughness:1,side:THREE.DoubleSide}),0,1,0,Math.PI/2);
 // Architectural floor joints and wall ribs, scaled with the room envelope.
 const linePoints=[];for(let i=0;i<=12;i++){const p=i/12-.5;linePoints.push(new THREE.Vector3(p,.001,-.5),new THREE.Vector3(p,.001,.5),new THREE.Vector3(-.5,.001,p),new THREE.Vector3(.5,.001,p));}
 room.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(linePoints),new THREE.LineBasicMaterial({color:0x9baa8a,transparent:true,opacity:.10})));
 for(const x of [-.499,.499]){for(let i=0;i<6;i++){const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,0,i/5-.5),new THREE.Vector3(x,1,i/5-.5)]);room.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color:0xa6b599,transparent:true,opacity:.16})));}}
 for(const x of [-.42,.42]){const strip=new THREE.Mesh(new THREE.BoxGeometry(.003,.002,.84),new THREE.MeshBasicMaterial({color:0xc5d8af}));strip.position.set(x,.996,0);room.add(strip);strips.push(strip);}
 const threshold=new THREE.Mesh(new THREE.BoxGeometry(.96,.003,.002),new THREE.MeshBasicMaterial({color:0xa6c58a,transparent:true,opacity:.45}));threshold.position.set(0,.003,-.46);room.add(threshold);
 artMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:.85,depthWrite:false,side:THREE.DoubleSide});art=new THREE.Mesh(new THREE.PlaneGeometry(1,1),artMaterial);scene.add(art);
 const tex=await new THREE.TextureLoader().loadAsync('./assets/tubs-lady.webp');tex.colorSpace=THREE.SRGBColorSpace;artMaterial.map=tex;artMaterial.needsUpdate=true;
 new ResizeObserver(()=>{const w=$('viewport').clientWidth,h=$('viewport').clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();if(state.view!=='inside')setView(state.view);}).observe($('viewport'));
 const vp=$('viewport');
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 bindSpeakerSelection(vp,(x,y)=>{if(!ready)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);raycaster.setFromCamera(pointer,camera);const speaker=pickSpeaker(raycaster,speakers);if(speaker){const product=configuration(state.width*state.depth).products.find(p=>p.id===speaker.productId)||{id:speaker.productId,...speakerSpecs[speaker.productId]};if(product)focusProduct(product,speaker);}});
 bindCameraGestures(vp,zoom,{onStart:()=>{drag=null;vp.focus({preventScroll:true});},onDrag:(dx,dy)=>{if(state.view==='inside'){yaw-=dx*.002;pitch=THREE.MathUtils.clamp(pitch+dy*.0015,-1.2,1.2);if(state.focus){yaw=THREE.MathUtils.clamp(yaw,-1.2,1.2);pitch=THREE.MathUtils.clamp(pitch,-.45,.6);}}else{controls.rotateLeft(2*Math.PI*dx/vp.clientHeight);controls.rotateUp(2*Math.PI*dy/vp.clientHeight);controls.update();}}});
 vp.addEventListener('pointerdown',e=>{if(state.view!=='inside'||e.button!==0)return;vp.focus({preventScroll:true});drag={x:e.clientX,y:e.clientY,yaw,pitch};vp.setPointerCapture(e.pointerId);});vp.addEventListener('pointermove',e=>{if(!drag)return;yaw=drag.yaw-(e.clientX-drag.x)*.002;pitch=THREE.MathUtils.clamp(drag.pitch+(e.clientY-drag.y)*.0015,-1.2,1.2);if(state.focus){yaw=THREE.MathUtils.clamp(yaw,-1.2,1.2);pitch=THREE.MathUtils.clamp(pitch,-.45,.6);drag={x:e.clientX,y:e.clientY,yaw,pitch};}});const stop=()=>drag=null;vp.addEventListener('pointerup',stop);vp.addEventListener('pointercancel',stop);vp.addEventListener('lostpointercapture',stop);
 bindRoomWalk({surface:vp,pad:$('walk-controls'),walk,enabled:()=>ready&&state.view==='inside'&&$('details').hidden,onStart:()=>{
  if(state.focus){const direction=camera.getWorldDirection(new THREE.Vector3()),position=camera.position.clone();clearFocus();walk.position.x=position.x;walk.position.z=position.z;yaw=Math.atan2(direction.x,-direction.z);pitch=Math.asin(direction.y);}
 }});
 window.addEventListener('blur',()=>{drag=null;});

 applyLighting();
 function animate(time){frame=requestAnimationFrame(animate);if(document.hidden)return;const dt=Math.min((time-last)/1000,.1)||.016;last=time;const t=reduced?1:1-Math.exp(-5*dt);currentSize.lerp(targetSize,t);room.scale.copy(currentSize);
 const artHeight=Math.min(currentSize.y*.84,3.9);art.scale.set(artHeight*1000/1636,artHeight,1);art.position.set(0,artHeight/2+.06,-currentSize.z/2+.022);
 for(const s of speakers){s.object.position.lerp(s.position,t);scaleVector.setScalar(s.scale);s.object.scale.lerp(scaleVector,t);}
 speakers=speakers.filter(s=>{if(s.scale===0&&s.object.scale.x<.004){scene.remove(s.object);s.object.traverse(m=>{if(m.isMesh)m.material.dispose();});return false;}return true;});
 if(state.view==='inside'){
  const subject=state.focus&&focusedSpeaker?.scale===1?focusedSpeaker:null;
  if(subject){const frame=speakerFrame(subject,camera.aspect,yaw,pitch);nextCam.copy(frame.position);nextLook.copy(frame.target);}
  else {const pos=walk.tick(dt,yaw,{width:currentSize.x,depth:currentSize.z});nextCam.set(pos.x,Math.min(1.65,currentSize.y*.6),pos.z);nextLook.copy(nextCam).add(new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)));}
  camera.position.lerp(nextCam,t);if(!subject){camera.position.x=THREE.MathUtils.clamp(camera.position.x,-currentSize.x/2+.35,currentSize.x/2-.35);camera.position.z=THREE.MathUtils.clamp(camera.position.z,-currentSize.z/2+.35,currentSize.z/2-.35);look.copy(camera.position).add(nextLook.sub(nextCam));}else look.lerp(nextLook,t);camera.lookAt(look);
  const fov=subject?45:camera.aspect<.8?Math.min(108,2*Math.atan(Math.tan(THREE.MathUtils.degToRad(65/2))/.8*1.05/camera.aspect)*180/Math.PI):65;camera.fov=THREE.MathUtils.lerp(camera.fov,fov,t);camera.updateProjectionMatrix();
 }else controls.update();acoustics?.tick(dt);renderer.render(scene,camera);
 }
 frame=requestAnimationFrame(animate);
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);let loaded=0;
 async function loadCabinet(i,suffix=''){
  const gltf=await loader.loadAsync(`./assets/speaker-${i}${suffix}.glb`);
  gltf.scene.traverse(child=>{if(child.isMesh){
   // Preserve imported PBR maps, UVs and normals; only fill absent normals.
   if(!child.geometry.getAttribute('normal'))child.geometry.computeVertexNormals();
   const material=child.material;
   material.envMapIntensity=.65;
   for(const name of ['map','normalMap','roughnessMap','metalnessMap'])if(material[name])material[name].anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  }});
  return gltf.scene;
 }
 templates=await Promise.all([0,1,2,3].map(async i=>{
  const [high,low]=await Promise.all([loadCabinet(i),loadCabinet(i,'-lod')]);
  $('loading').querySelector('p').textContent=`Preparing the system… ${++loaded}/4`;
  return {high,low};
 }));
 ready=true;acoustics=createAcousticView(scene,state,reduced,{open:()=>{toggleDetails(true);selectTab($('tab-sound'));},overview:()=>setView('overview')});$('loading').hidden=true;update();setView('inside');
 }catch(error){console.error(error);$('loading').hidden=false;$('loading').querySelector('p').textContent='The 3D room could not load. Reload or try a WebGL-enabled browser. Room and product controls remain available.';}
}
update();init();
