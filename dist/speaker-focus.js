import {Vector3} from './vendor/three.module.js';

// Fit the selected cabinet at 100%; lens zoom can then inspect its details.
export function speakerFrame(speaker,aspect,yaw=0,pitch=0) {
 const [width,height,depth]=speaker.size;
 const target=speaker.object.position.clone().add(new Vector3(0,height/2,0));
 const vertical=Math.PI/8; // Half of a 45-degree vertical field of view.
 const horizontal=Math.atan(Math.tan(vertical)*Math.max(.1,aspect));
 const radius=Math.hypot(width,height,depth)/2;
 const distance=radius/Math.sin(Math.min(vertical,horizontal))*1.15;
 const turn=Math.max(-1.2,Math.min(1.2,yaw));
 const tilt=Math.max(-.45,Math.min(.6,pitch));
 const position=target.clone().add(new Vector3(Math.sin(turn)*Math.cos(tilt),Math.sin(tilt),Math.cos(turn)*Math.cos(tilt)).multiplyScalar(distance));
 return {target,position};
}

export function pickSpeaker(raycaster,speakers) {
 const active=speakers.filter(s=>s.scale===1);
 const hits=raycaster.intersectObjects(active.map(s=>s.object),true);
 for(const hit of hits){
  for(let obj=hit.object;obj;obj=obj.parent){
   const speaker=active.find(s=>s.object===obj);
   if(speaker)return speaker;
  }
 }
 return null;
}

// Observe before drag/pinch handlers; never steal their events.
export function bindSpeakerSelection(surface,onSelect) {
 const active=new Set();let candidate=null;
 surface.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;
  active.add(e.pointerId);
  candidate=active.size===1?{id:e.pointerId,x:e.clientX,y:e.clientY,time:e.timeStamp}:null;
 },{capture:true});
 surface.addEventListener('pointermove',e=>{
  if(candidate?.id===e.pointerId&&Math.hypot(e.clientX-candidate.x,e.clientY-candidate.y)>8)candidate=null;
 },{capture:true});
 const end=e=>{
  const select=e.type==='pointerup'&&candidate?.id===e.pointerId&&e.timeStamp-candidate.time<500&&Math.hypot(e.clientX-candidate.x,e.clientY-candidate.y)<=8;
  candidate=null;active.delete(e.pointerId);
  if(select)onSelect(e.clientX,e.clientY);
 };
 for(const type of ['pointerup','pointercancel','lostpointercapture'])surface.addEventListener(type,end,{capture:true});
}
