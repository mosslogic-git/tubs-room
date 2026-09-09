export const MIN_ZOOM = 0.75;
export const MAX_ZOOM = 3;

// All input methods change the lens, preserving camera position and look direction.
export function createCameraZoom({getCamera, slider, output, minus, plus}) {
 let value = 1;
 function set(next) {
  if (!Number.isFinite(next)) return;
  value = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
  const camera = getCamera();
  if (camera) { camera.zoom = value; camera.updateProjectionMatrix(); }
  slider.value = String(value);
  output.textContent = `${Math.round(value * 100)}%`;
  slider.setAttribute('aria-valuetext', output.textContent);
  minus.disabled = value <= MIN_ZOOM;
  plus.disabled = value >= MAX_ZOOM;
 }
 slider.addEventListener('input', () => set(Number(slider.value)));
 minus.addEventListener('click', () => set(value - 0.1));
 plus.addEventListener('click', () => set(value + 0.1));
 set(1);
 return {set, reset: () => set(1), get value() { return value; }};
}

export function bindCameraGestures(surface, zoom, {onDrag, onStart = () => {}}) {
 const pointers = new Map();
 let distance = 0;
 const span = () => {
  if (pointers.size !== 2) return 0;
  const [a,b] = [...pointers.values()];
  return Math.hypot(a.x-b.x,a.y-b.y);
 };
 const consume = e => { e.preventDefault(); e.stopImmediatePropagation(); };
 surface.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch') return;
  consume(e);onStart();
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  surface.setPointerCapture(e.pointerId);
  distance = span();
 }, {capture:true});
 surface.addEventListener('pointermove', e => {
  const previous = pointers.get(e.pointerId);
  if (!previous) return;
  consume(e);
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if (pointers.size === 2) {
   const next = span();
   if (distance > 0 && next > 0) zoom.set(zoom.value * next / distance);
   distance = next;
  } else if (pointers.size === 1) onDrag(e.clientX-previous.x,e.clientY-previous.y);
 }, {capture:true});
 const end = e => {
  if (!pointers.has(e.pointerId)) return;
  consume(e);pointers.delete(e.pointerId);distance = span();
  if (surface.hasPointerCapture(e.pointerId)) surface.releasePointerCapture(e.pointerId);
 };
 for (const type of ['pointerup','pointercancel','lostpointercapture']) surface.addEventListener(type,end,{capture:true});
 surface.addEventListener('wheel', e => {
  consume(e);
  const units = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? surface.clientHeight : 1;
  zoom.set(zoom.value * Math.exp(-Math.max(-100,Math.min(100,e.deltaY*units))*.002));
 }, {capture:true,passive:false});
}
