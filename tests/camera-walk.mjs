import assert from 'node:assert/strict';
import {createRoomWalk,bindRoomWalk,WALK_SPEED} from '../dist/camera-walk.js';
const room={width:8,depth:10}, walk=createRoomWalk();
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
walk.reset(room);walk.press('w','forward');
for(let i=0;i<60;i++)walk.tick(1/60,0,room);
near(walk.position.z,3.6-WALK_SPEED);near(walk.position.x,0);
walk.reset(room);walk.press('w','forward');walk.tick(.1,Math.PI/2,room);
near(walk.position.x,.2);near(walk.position.z,3.6);
walk.reset(room);walk.press('w','forward');walk.press('d','right');walk.tick(.1,0,room);
near(Math.hypot(walk.position.x,walk.position.z-3.6),.2);
walk.reset(room);walk.press('w','forward');walk.press('s','back');walk.tick(.1,0,room);near(walk.position.z,3.6);
walk.release('s');for(let i=0;i<1000;i++)walk.tick(.1,0,room);near(walk.position.z,-4.65);
walk.stop();walk.position.x=7;walk.position.z=9;walk.tick(0,0,{width:4,depth:5});
near(walk.position.x,1.65);near(walk.position.z,2.15);
walk.reset(room);walk.press('w','forward');walk.tick(30,0,room);near(walk.position.z,3.4);
walk.stop();assert.equal(walk.moving,false);

class Element extends EventTarget {
 constructor(move){super();this.dataset={move};}
 setPointerCapture(){}
}
const surface=new Element(),pad=new Element(),win=new Element(),doc=new Element();
const buttons=['forward','back','left','right'].map(d=>new Element(d));
pad.querySelectorAll=()=>buttons;pad.contains=e=>buttons.includes(e)||e===pad;
let enabled=true,starts=0;
bindRoomWalk({surface,pad,win,doc,walk,enabled:()=>enabled,onStart:()=>starts++});
function send(target,type,props={}){const e=new Event(type,{cancelable:true});Object.assign(e,props);target.dispatchEvent(e);return e;}
send(surface,'keydown',{key:'w'});assert.ok(walk.moving);
send(win,'keyup',{key:'w'});assert.ok(!walk.moving);
send(surface,'keydown',{key:'ArrowUp'});send(win,'blur');assert.ok(!walk.moving);
send(buttons[0],'pointerdown',{button:0,pointerId:1});assert.ok(walk.moving);
send(buttons[0],'pointercancel',{pointerId:1});assert.ok(!walk.moving);
send(buttons[0],'pointerdown',{button:0,pointerId:1});send(buttons[0],'lostpointercapture',{pointerId:1});assert.ok(!walk.moving);
send(buttons[0],'keydown',{key:' '});assert.ok(walk.moving);
send(buttons[0],'keyup',{key:' '});assert.ok(!walk.moving);
send(surface,'keydown',{key:'d'});doc.hidden=true;send(doc,'visibilitychange');assert.ok(!walk.moving);
send(surface,'keydown',{key:'a'});send(doc,'focusin');assert.ok(!walk.moving);
enabled=false;const before=starts;send(surface,'keydown',{key:'w'});send(buttons[0],'pointerdown',{button:0,pointerId:1});assert.equal(starts,before);assert.ok(!walk.moving);
enabled=true;send(surface,'keydown',{key:'w',metaKey:true});assert.ok(!walk.moving);
console.log('Walk: speed, heading, diagonal movement, opposite inputs, walls, room shrink, reset, keyboard/touch release, cancellation, blur and mode guards passed.');
