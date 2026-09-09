import {speakerSpecs} from './speaker-specs.js';
// Editorial concept pairings, NOT manufacturer-approved acoustic recommendations.
// Product names/categories follow https://tubs-audio-nz.netlify.app/.
export const stages=[
 {id:'hifi',family:'HiFi',name:'Close listening',tier:'01',area:30,tops:2,subs:0,model:1,copy:'Your own corner of sound.\nSpace to listen a little closer.',products:[{id:'obslk',name:'OBSLK',description:'2-way floorstander',role:'top',count:2}]},
 {id:'bigfi',family:'BigFi',name:'Small club',tier:'02',area:80,tops:2,subs:4,model:2,copy:'A little more room.\nA lot more possibility.',products:[{id:'dc12',name:'DC12',description:'Dual concentric',role:'top',count:2},{id:'gc118-sub',name:'GC118 Sub',description:'Subwoofer',role:'bass',count:4}]},
 {id:'stack',family:'Stack',name:'Full floor',tier:'03',area:180,tops:4,subs:8,model:0,copy:'Room for everyone.\nSound that brings us together.',products:[{id:'gc410',name:'GC410',description:'Point source top',role:'top',count:4},{id:'gc218',name:'GC218',description:'Subwoofer',role:'bass',count:8}]}
];
export function configuration(area){return stages[area<50?0:area<120?1:2];}
export function dimensionsForArea(area,ratio=.8){let width=Math.sqrt(area*ratio),depth=area/width;if(width<4){width=4;depth=area/width;}if(width>16){width=16;depth=area/width;}if(depth<5){depth=5;width=area/depth;}if(depth>20){depth=20;width=area/depth;}return {width,depth};}
export function placements(state){
 const c=configuration(state.width*state.depth),topId=c.products.find(p=>p.role==='top').id,bassId=c.products.find(p=>p.role==='bass')?.id;
 const ts=speakerSpecs[topId].size,bs=bassId?speakerSpecs[bassId].size:[0,0,0],model=state.model==='auto'?c.model:Number(state.model),items=[],n=c.subs/2,gap=.035;
 const cols=n>1?2:1,stackWidth=n?cols*bs[0]+(cols-1)*gap:ts[0],spread=Math.min(4.8,state.width/2-stackWidth/2-.3),z=-state.depth/2+Math.min(2.8,state.depth*.44);
 for(const side of [-1,1]){
  for(let i=0;i<n;i++){
   let x=side*spread+(n>1?(i%2-.5)*(bs[0]+gap):0),y=Math.floor(i/2)*bs[1],zz=z;
   if(state.cluster){const j=(side<0?0:n)+i,k=Math.max(1,Math.min(4,Math.floor((state.width-.5)/(bs[0]+gap))));x=(j%k-(k-1)/2)*(bs[0]+gap);y=0;zz=z+.7+Math.floor(j/k)*(bs[2]+gap);}
   items.push({index:3,role:'bass',productId:bassId,x,y,z:zz,height:bs[1],size:bs});
  }
  for(let i=0;i<c.tops/2;i++)items.push({index:model,role:'top',productId:topId,x:side*spread+(i-(c.tops/2-1)/2)*(bs[0]+gap),y:state.cluster?0:Math.ceil(n/2)*bs[1],z:z,height:ts[1],size:ts});
 }
 return items;
}

// Floor-standing DJ monitor stacks; base cabinets share the main sub dimensions.
export function monitorPlacements(state){
 const config=configuration(state.width*state.depth);
 const bassId=config.products.find(p=>p.role==='bass')?.id||'gc118-sub';
 const bs=speakerSpecs[bassId].size,ts=speakerSpecs.dc12.size;
 const x=Math.min(1.65,state.width/2-bs[0]/2-.3),z=-state.depth/2+1.15;
 return [-1,1].flatMap(side=>{
  const rotation=Math.atan2(-side*x,-.6);
  return [
   {index:3,role:'bass',productId:bassId,x:side*x,y:0,z,size:bs,height:bs[1],zone:'monitor',rotation},
   {index:2,role:'top',productId:'dc12',x:side*x,y:bs[1],z,size:ts,height:ts[1],zone:'monitor',rotation}
  ];
 });
}
