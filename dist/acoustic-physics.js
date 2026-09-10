// Pure SI-unit acoustics. No renderer dependencies.
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const mul=(a,k)=>a.map(v=>v*k);
export const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const length=a=>Math.hypot(...a);
export const unit=a=>mul(a,1/(length(a)||1));
export const distance=(a,b)=>length(sub(a,b));
export const speedOfSound=t=>331.3*Math.sqrt(1+t/273.15);
export function surfaces(r){return [
 {id:'left',name:'Left wall',axis:0,bound:-r.width/2,u:2,v:1,area:r.depth*r.height},
 {id:'right',name:'Right wall',axis:0,bound:r.width/2,u:2,v:1,area:r.depth*r.height},
 {id:'floor',name:'Floor',axis:1,bound:0,u:0,v:2,area:r.width*r.depth},
 {id:'ceiling',name:'Ceiling',axis:1,bound:r.height,u:0,v:2,area:r.width*r.depth},
 {id:'stage',name:'Stage wall',axis:2,bound:-r.depth/2,u:0,v:1,area:r.width*r.height},
 {id:'rear',name:'Rear wall',axis:2,bound:r.depth/2,u:0,v:1,area:r.width*r.height}];}
export const alpha=(wall,o)=>wall.id==='floor'?o.floor:wall.id==='ceiling'?o.ceiling:o.walls;
export function beamGain(dir,beam){
 if(!beam)return 1;
 if(beam.conical){const angle=Math.acos(Math.max(-1,Math.min(1,unit(dir)[2])))*180/Math.PI;return 10**(-.6*(angle/(beam.h/2))**2);}
 const az=Math.atan2(dir[0],dir[2])*180/Math.PI,el=Math.atan2(dir[1],Math.hypot(dir[0],dir[2]))*180/Math.PI;
 return 10**(-.6*((az/(beam.h/2))**2+(el/(el>=0?beam.up:beam.down))**2));
}
export function firstReflection(source,receiver,wall){
 const image=source.slice();image[wall.axis]=2*wall.bound-source[wall.axis];const delta=sub(image,receiver),t=(wall.bound-receiver[wall.axis])/delta[wall.axis];
 if(!Number.isFinite(t)||t<=0||t>=1)return null;
 return add(receiver,mul(delta,t));
}
export function pathEnergy(source,points,reflectionFactors=[]){const dist=points.slice(1).reduce((s,p,i)=>s+distance(p,points[i]),0);const gain=beamGain(sub(points[1],points[0]),source.beam);return {distance:dist,energy:gain*reflectionFactors.reduce((e,v)=>e*v,1)/Math.max(dist*dist,.01)};}
export function earlyPaths(room,sources,receiver,o,panels=[]){
 const result=[];
 for(const source of sources){const points=[source.position,receiver];result.push({source,points,wall:null,...pathEnergy(source,points)});
 for(const wall of surfaces(room)){const point=firstReflection(source.position,receiver,wall);if(!point)continue;const a=absorptionAt(point,wall,o,panels);const points=[source.position,point,receiver];result.push({source,points,wall,...pathEnergy(source,points,[1-a])});}}
 return result;
}
export function absorptionAt(point,wall,o,panels){if(o.treated&&panels.some(p=>p.wall.id===wall.id&&Math.abs(point[wall.u]-p.center[wall.u])<=p.width/2+1e-7&&Math.abs(point[wall.v]-p.center[wall.v])<=p.height/2+1e-7))return Math.max(alpha(wall,o),o.panelAlpha);return alpha(wall,o);}
export function treatmentPanels(room,paths){
 // First-order mirror points at the chosen receiver; only walls/ceiling, not floor.
 const results=[],bounds=[[-room.width/2,room.width/2],[0,room.height],[-room.depth/2,room.depth/2]];
 const sorted=paths.filter(p=>p.wall&&p.wall.id!=='floor'&&p.energy>1e-7).sort((a,b)=>b.energy-a.energy);
 for(const path of sorted){const wall=path.wall,center=path.points[1].slice(),width=Math.min(1.2,bounds[wall.u][1]-bounds[wall.u][0]-.04),height=Math.min(1.2,bounds[wall.v][1]-bounds[wall.v][0]-.04);for(const [axis,extent] of [[wall.u,width],[wall.v,height]])center[axis]=Math.max(bounds[axis][0]+extent/2,Math.min(bounds[axis][1]-extent/2,center[axis]));
 if(results.some(p=>p.wall.id===wall.id&&Math.abs(center[wall.u]-p.center[wall.u])<(p.width+width)/2&&Math.abs(center[wall.v]-p.center[wall.v])<(p.height+height)/2))continue;
 results.push({wall,center,width,height,path});}
 return results;
}
export function traceRay(room,source,direction,o,panels=[],maxBounces=4){
 let p=source.position.slice(),d=unit(direction),energy=beamGain(d,source.beam),travel=0;const segments=[],walls=surfaces(room);
 for(let bounce=0;bounce<=maxBounces;bounce++){
 let nearest=Infinity,hits=[];
 for(const wall of walls){const t=(wall.bound-p[wall.axis])/d[wall.axis];if(t>1e-7&&t<nearest-1e-7){nearest=t;hits=[wall];}else if(t>1e-7&&Math.abs(t-nearest)<1e-7)hits.push(wall);}
 if(!Number.isFinite(nearest))break;
 const end=add(p,mul(d,nearest));segments.push({a:p,b:end,start:travel,end:travel+nearest,energy,bounce,wall:hits[0]});travel+=nearest;
 for(const wall of hits){energy*=1-absorptionAt(end,wall,o,panels);d[wall.axis]*=-1;}
 p=end;if(energy<1e-6)break;
 }
 return segments;
}
export function sabine(room,o,panels=[]){let A=surfaces(room).reduce((a,w)=>a+w.area*alpha(w,o),0);if(o.treated)for(const p of panels)A+=p.width*p.height*(Math.max(alpha(p.wall,o),o.panelAlpha)-alpha(p.wall,o));return 24*Math.log(10)*room.width*room.height*room.depth/(speedOfSound(o.temperature)*Math.max(A,.001));}
export function roomModes(room,temperature,maxFrequency=150){const c=speedOfSound(temperature),dims=[room.width,room.height,room.depth],modes=[];const limits=dims.map(d=>Math.floor(maxFrequency*2*d/c));for(let x=0;x<=limits[0];x++)for(let y=0;y<=limits[1];y++)for(let z=0;z<=limits[2];z++){if(x+y+z===0)continue;const n=[x,y,z],f=c/2*Math.hypot(...n.map((v,i)=>v/dims[i]));if(f>=20&&f<=maxFrequency)modes.push({n,f});}return modes.sort((a,b)=>a.f-b.f);}
export function modalShape(room,n,p){const pos=[p[0]+room.width/2,p[1],p[2]+room.depth/2],dims=[room.width,room.height,room.depth];return n.reduce((a,v,i)=>a*Math.cos(Math.PI*v*pos[i]/dims[i]),1);}
export function sourceCoupling(room,n,sources){if(!sources.length)return 0;return sources.reduce((s,p)=>s+modalShape(room,n,p.position),0)/sources.length;}

const DEFAULT_REF_SPL={
 'dc12':122,
 'gc410':132,
 'obslk':104,
 'gc118-sub':130,
 'gc218':134
};

export function calculatePointSPL(point,sources){
 if(!sources.length)return 0;
 let totalEnergy=0;
 for(const source of sources){
  const delta=sub(point,source.position);
  const d=Math.max(length(delta),0.4);
  const gain=beamGain(delta,source.beam);
  const baseSPL=DEFAULT_REF_SPL[source.productId]||115;
  // Incoherent direct acoustic energy summation: E = 10^(SPL0/10) * gain / d^2
  totalEnergy+=Math.pow(10,baseSPL/10)*gain/(d*d);
 }
 return 10*Math.log10(Math.max(totalEnergy,1e-6));
}

export function calculateSPLGrid(room,sources,resX=36,resZ=48,y=1.2){
 const total=resX*resZ;
 const values=new Float32Array(total);
 let minSPL=Infinity,maxSPL=-Infinity;
 for(let j=0;j<resZ;j++){
  const z=(j/(resZ-1)-.5)*room.depth;
  for(let i=0;i<resX;i++){
   const x=(i/(resX-1)-.5)*room.width;
   const spl=calculatePointSPL([x,y,z],sources);
   const idx=j*resX+i;
   values[idx]=spl;
   if(spl<minSPL)minSPL=spl;
   if(spl>maxSPL)maxSPL=spl;
  }
 }
 return {values,resX,resZ,minSPL,maxSPL};
}
export function calculateBoundaryExposure(room,sources){
 const boundaries=[
  {id:'rear',name:'Stage rear wall',normal:[0,0,1],point:[0,room.height/2,-room.depth/2]},
  {id:'front',name:'Entrance wall',normal:[0,0,-1],point:[0,room.height/2,room.depth/2]},
  {id:'left',name:'Left sidewall',normal:[1,0,0],point:[-room.width/2,room.height/2,0]},
  {id:'right',name:'Right sidewall',normal:[-1,0,0],point:[room.width/2,room.height/2,0]},
  {id:'floor',name:'Floor slab',normal:[0,1,0],point:[0,0,0]},
  {id:'ceiling',name:'Ceiling boundary',normal:[0,-1,0],point:[0,room.height,0]}
 ];
 const results={};let peakSPL=0,peakBoundary='floor';
 for(const b of boundaries){
  let maxSPLOnSurface=0;
  const samples=[
   b.point,
   b.id==='rear'||b.id==='front'?[-room.width*.35,room.height*.3,b.point[2]]:b.id==='left'||b.id==='right'?[b.point[0],room.height*.3,-room.depth*.35]:[-room.width*.35,b.point[1],-room.depth*.35],
   b.id==='rear'||b.id==='front'?[room.width*.35,room.height*.3,b.point[2]]:b.id==='left'||b.id==='right'?[b.point[0],room.height*.3,room.depth*.35]:[room.width*.35,b.point[1],room.depth*.35]
  ];
  for(const pt of samples){
   let spl=calculatePointSPL(pt,sources);
   if(b.id==='floor'||b.id==='rear')spl+=3.0;
   if(spl>maxSPLOnSurface)maxSPLOnSurface=spl;
  }
  results[b.id]={id:b.id,name:b.name,spl:maxSPLOnSurface};
  if(maxSPLOnSurface>peakSPL){peakSPL=maxSPLOnSurface;peakBoundary=b.id;}
 }
 return {boundaries:results,peakSPL,peakBoundary};
}

export function calculateIsolationAssemblies(room,sources,targetOutdoorSPL=45){
 const exposure=calculateBoundaryExposure(room,sources);
 const reqTL=Math.max(25,Math.round(exposure.peakSPL-targetOutdoorSPL));
 const puckSpacing=0.5;
 const pucksX=Math.max(3,Math.ceil(room.width/puckSpacing));
 const pucksZ=Math.max(4,Math.ceil(room.depth/puckSpacing));
 const totalPucks=pucksX*pucksZ;
 const floorResonanceHz=8.5;
 const wallCavityDepthMm=reqTL>60?150:100;
 const wallResonanceHz=Math.round(1900/Math.sqrt(45*(wallCavityDepthMm/1000*1000)));
 const clipSpacingMm=600;
 const springGridSpacing=1.2;
 const springCount=Math.max(4,Math.ceil(room.width/springGridSpacing)*Math.ceil(room.depth/springGridSpacing));
 const ceilingCavityDepthMm=200;
 const springResonanceHz=6.2;
 const cornerDepth=Math.min(0.65,room.width*0.08+0.3);
 const soundLockDepth=1.8;
 const soundLockWidth=Math.min(2.4,room.width*0.4);
 const airlockAttenuationDb=26;
 return {
  exposure,
  reqTL,
  targetOutdoorSPL,
  floatingFloor:{puckSpacing,pucksX,pucksZ,totalPucks,floorResonanceHz,slabThicknessMm:100,elastomerType:'Sylomer SR-110'},
  walls:{cavityDepthMm:wallCavityDepthMm,resonanceHz:wallResonanceHz,clipSpacingMm,gypsumLayers:2,mineralWoolDensityKgM3:45},
  ceiling:{springCount,gridSpacing:springGridSpacing,cavityDepthMm:ceilingCavityDepthMm,springResonanceHz},
  cornerTraps:{count:4,depth:cornerDepth},
  soundLock:{width:soundLockWidth,depth:soundLockDepth,attenuationDb:airlockAttenuationDb}
 };
}
