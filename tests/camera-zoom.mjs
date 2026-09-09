import assert from 'node:assert/strict';
import {PerspectiveCamera} from '../dist/vendor/three.module.js';
import {createCameraZoom,bindCameraGestures} from '../dist/camera-zoom.js';
class Control extends EventTarget {
 value = '1';
 setAttribute(name, value) { this[name] = value; }
}
const slider=new Control(), output=new Control(), minus=new Control(), plus=new Control();
const camera=new PerspectiveCamera(65,1,.08,150);
const zoom=createCameraZoom({getCamera:()=>camera,slider,output,minus,plus});
for (const fov of [65,45,108]) {
 camera.fov=fov;zoom.reset();
 const projection=camera.projectionMatrix.elements[0];
 const position=camera.position.clone(), rotation=camera.quaternion.clone();
 plus.dispatchEvent(new Event('click'));
 assert.equal(camera.zoom,1.1);
 assert.ok(Math.abs(camera.projectionMatrix.elements[0]/projection-1.1)<1e-12);
 assert.ok(camera.position.equals(position));assert.ok(camera.quaternion.equals(rotation));
 slider.value='2';slider.dispatchEvent(new Event('input'));assert.equal(camera.zoom,2);
 assert.equal(output.textContent,'200%');
 minus.dispatchEvent(new Event('click'));assert.equal(camera.zoom,1.9);
}
zoom.set(999);assert.equal(camera.zoom,3);assert.equal(plus.disabled,true);
zoom.set(-999);assert.equal(camera.zoom,.75);assert.equal(minus.disabled,true);
zoom.set(NaN);assert.equal(camera.zoom,.75);
zoom.reset();assert.equal(camera.zoom,1);assert.equal(output.textContent,'100%');
console.log('Camera zoom: controls, projection, stable viewpoint, limits and reset passed.');

class Surface extends EventTarget {
 captures=new Set();clientHeight=600;
 setPointerCapture(id){this.captures.add(id);}
 hasPointerCapture(id){return this.captures.has(id);}
 releasePointerCapture(id){this.captures.delete(id);}
}
const surface=new Surface(),drags=[];
bindCameraGestures(surface,zoom,{onDrag:(x,y)=>drags.push([x,y])});
function pointer(type,id,x,y=0,pointerType='touch') {
 const e=new Event(type,{cancelable:true});
 Object.assign(e,{pointerId:id,clientX:x,clientY:y,pointerType});
 surface.dispatchEvent(e);return e;
}
pointer('pointerdown',1,0);pointer('pointermove',1,10);
assert.deepEqual(drags,[[10,0]]);
pointer('pointerdown',2,110);pointer('pointermove',2,210);
assert.equal(zoom.value,2);assert.equal(camera.zoom,2);assert.equal(output.textContent,'200%');
assert.equal(drags.length,1);
pointer('pointermove',2,110);assert.equal(zoom.value,1);
pointer('pointerup',2,110);pointer('pointermove',1,15);
assert.deepEqual(drags.at(-1),[5,0]);
pointer('pointerdown',2,115);pointer('pointercancel',2,115);
pointer('pointermove',1,20);assert.deepEqual(drags.at(-1),[5,0]);
pointer('lostpointercapture',1,20);assert.equal(surface.captures.size,0);
// A new pinch rebases after cancellation; zero separation never produces NaN.
pointer('pointerdown',3,0);pointer('pointerdown',4,0);
pointer('pointermove',4,100);assert.equal(zoom.value,1);
pointer('pointermove',4,10000);assert.equal(zoom.value,3);
pointer('pointermove',4,9000);assert.equal(zoom.value,2.7);
pointer('pointerdown',5,200);pointer('pointermove',4,8000);assert.equal(zoom.value,2.7);
pointer('pointerup',5,200);pointer('pointermove',4,4000);assert.equal(zoom.value,1.35);
pointer('pointerup',3,0);pointer('pointerup',4,4000);
const mouse=pointer('pointerdown',6,0,0,'mouse');assert.equal(mouse.defaultPrevented,false);
zoom.reset();
for (const deltaMode of [0,1,2]) {
 const e=new Event('wheel',{cancelable:true});Object.assign(e,{deltaY:-1,deltaMode});
 const before=zoom.value;surface.dispatchEvent(e);assert.ok(zoom.value>before);assert.ok(e.defaultPrevented);
}
console.log('Gestures: pinch in/out, drag transitions, cancellation, capture loss, limits, third finger and wheel passed.');
