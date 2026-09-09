export const WALK_SPEED = 2;
const MARGIN = 0.35;

export function createRoomWalk() {
 const position = {x:0,z:3.6};
 const held = new Map();
 const clamp = (room) => {
  position.x = Math.max(-room.width/2+MARGIN,Math.min(room.width/2-MARGIN,position.x));
  position.z = Math.max(-room.depth/2+MARGIN,Math.min(room.depth/2-MARGIN,position.z));
 };
 return {
  position,
  press: (source,direction) => held.set(source,direction),
  release: source => held.delete(source),
  stop: () => held.clear(),
  get moving() { return held.size > 0; },
  reset(room) { held.clear();position.x=0;position.z=room.depth*.36;clamp(room); },
  tick(dt,yaw,room) {
   const directions = new Set(held.values());
   let forward=Number(directions.has('forward'))-Number(directions.has('back'));
   let right=Number(directions.has('right'))-Number(directions.has('left'));
   const length=Math.hypot(forward,right);
   if(length){forward/=length;right/=length;const step=WALK_SPEED*Math.max(0,Math.min(dt,.1));
    position.x+=(Math.sin(yaw)*forward+Math.cos(yaw)*right)*step;
    position.z+=(-Math.cos(yaw)*forward+Math.sin(yaw)*right)*step;
   }
   clamp(room);return position;
  }
 };
}

export function bindRoomWalk({surface,pad,walk,enabled,onStart,win=window,doc=document}) {
 const keys={w:'forward',ArrowUp:'forward',s:'back',ArrowDown:'back',a:'left',ArrowLeft:'left',d:'right',ArrowRight:'right'};
 const direction=e=>keys[e.key.length===1?e.key.toLowerCase():e.key];
 const start=(source,dir)=>{if(!enabled())return false;onStart();walk.press(source,dir);return true;};
 for(const element of [surface,pad])element.addEventListener('keydown',e=>{
  const dir=direction(e);if(!dir||e.ctrlKey||e.metaKey||e.altKey||!enabled())return;
  e.preventDefault();start('key:'+dir,dir);
 });
 win.addEventListener('keyup',e=>{const dir=direction(e);if(dir)walk.release('key:'+dir);});
 for(const button of pad.querySelectorAll('[data-move]')){
  button.addEventListener('pointerdown',e=>{
   if(e.button!==0||!start('pointer:'+e.pointerId,button.dataset.move))return;
   e.preventDefault();button.setPointerCapture(e.pointerId);
  });
  const end=e=>walk.release('pointer:'+e.pointerId);
  for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,end);
  // Space/Enter activate the focused movement button without requiring a pointer.
  button.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();start('button:'+button.dataset.move,button.dataset.move);}});
  button.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter')walk.release('button:'+button.dataset.move);});
 }
 win.addEventListener('blur',()=>walk.stop());
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden)walk.stop();});
 doc.addEventListener('focusin',e=>{if(e.target!==surface&&!pad.contains(e.target))walk.stop();});
 pad.addEventListener('focusout',()=>walk.stop());
}
