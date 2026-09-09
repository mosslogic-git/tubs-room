import assert from 'node:assert/strict';
import {Group,Mesh,BoxGeometry,MeshBasicMaterial,PerspectiveCamera,Vector2,Vector3,Raycaster} from '../dist/vendor/three.module.js';
import {speakerFrame,pickSpeaker,bindSpeakerSelection} from '../dist/speaker-focus.js';
import {speakerSpecs} from '../dist/speaker-specs.js';

for(const spec of Object.values(speakerSpecs))for(const aspect of [.3,.5,1,1.8,2.5]){
 const object=new Group();object.position.set(2,1,-4);
 const {position,target}=speakerFrame({object,size:spec.size},aspect);
 const camera=new PerspectiveCamera(45,aspect,.08,150);camera.position.copy(position);camera.lookAt(target);camera.updateMatrixWorld(true);
 const [w,h,d]=spec.size;
 for(const x of [-w/2,w/2])for(const y of [0,h])for(const z of [-d/2,d/2]){
  const projected=new Vector3(x,y,z).add(object.position).project(camera);
  assert.ok(Math.abs(projected.x)<1&&Math.abs(projected.y)<1&&Math.abs(projected.z)<1,'Cabinet fits the camera');
 }
 const close=target.clone().add(new Vector3(w/4,0,0)).project(camera);
 camera.zoom=3;camera.updateProjectionMatrix();
 const closer=target.clone().add(new Vector3(w/4,0,0)).project(camera);
 assert.ok(Math.abs(closer.x-close.x*3)<1e-9,'Detail zoom magnifies around selected cabinet');
}
function cabinet(x,y,z){const object=new Group();object.position.set(x,y,z);const mesh=new Mesh(new BoxGeometry(1,1,1),new MeshBasicMaterial());object.add(mesh);object.updateMatrixWorld(true);return {object,scale:1,size:[1,1,1]};}
const left=cabinet(-2,0,0),right=cabinet(2,0,0),behind=cabinet(2,0,-2),upper=cabinet(2,2,0);
const camera=new PerspectiveCamera(45,1,.08,150);camera.position.set(2,0,5);camera.lookAt(2,0,0);camera.updateMatrixWorld(true);
const ray=new Raycaster();ray.setFromCamera(new Vector2(),camera);
assert.equal(pickSpeaker(ray,[left,behind,right,upper]),right);
right.scale=0;assert.equal(pickSpeaker(ray,[left,behind,right,upper]),behind);
camera.position.set(2,2,5);camera.lookAt(2,2,0);camera.updateMatrixWorld(true);ray.setFromCamera(new Vector2(),camera);
assert.equal(pickSpeaker(ray,[left,behind,right,upper]),upper);

const surface=new EventTarget(),selections=[];
bindSpeakerSelection(surface,(x,y)=>selections.push([x,y]));
function pointer(type,id,x,y=0){const e=new Event(type);Object.assign(e,{button:0,pointerId:id,clientX:x,clientY:y});surface.dispatchEvent(e);}
pointer('pointerdown',1,10);pointer('pointerup',1,10);assert.deepEqual(selections,[[10,0]]);
pointer('pointerdown',1,10);pointer('pointermove',1,30);pointer('pointermove',1,10);pointer('pointerup',1,10);assert.equal(selections.length,1);
pointer('pointerdown',1,10);pointer('pointerdown',2,50);pointer('pointerup',2,50);pointer('pointerup',1,10);assert.equal(selections.length,1);
pointer('pointerdown',1,10);pointer('pointercancel',1,10);pointer('pointerup',1,10);assert.equal(selections.length,1);
pointer('pointerdown',1,10);pointer('lostpointercapture',1,10);pointer('pointerup',1,10);assert.equal(selections.length,1);
console.log('Speaker inspection: cabinet framing across screen ratios, detail zoom, exact/nearest instance selection, and tap versus drag/pinch/cancel passed.');
