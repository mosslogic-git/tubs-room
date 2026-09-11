// Generative living moss simulation running in native Canvas 2D
// Derived from Moss Logic's jely moss system (760x620 virtual composition).

export function createMossCanvas(width = 760, height = 620) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const VW = 760, VH = 620;
  const Hl = { x: 298, y: 222 }, Cd = { x: 402, y: 332 }, Rd = 214, Cb = { x: 398, y: 322 };

  // Deterministic RNG
  function mulberry32(a) {
    return function() {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const rnd = mulberry32(20240823);
  function rr(a, b) { return a + (b - a) * rnd(); }

  // 2D Perlin noise generator
  function makeNoise2D(seed = 7) {
    const p = new Uint8Array(512);
    let s = seed | 0;
    function r() {
      s = (s * 1664525 + 1013904223) | 0;
      return ((s >>> 0) / 4294967296);
    }
    const perm = new Uint8Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const t = perm[i]; perm[i] = perm[j]; perm[j] = t;
    }
    for (let i = 0; i < 512; i++) p[i] = perm[i & 255];

    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function lerp(t, a, b) { return a + t * (b - a); }
    function grad(hash, x, y) {
      const h = hash & 7;
      const u = h < 4 ? x : y;
      const v = h < 4 ? y : x;
      return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
    }
    return function noise(x, y = 0) {
      const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
      x -= Math.floor(x); y -= Math.floor(y);
      const u = fade(x), v = fade(y);
      const A = p[X] + Y, B = p[X + 1] + Y;
      const val = lerp(v,
        lerp(u, grad(p[A], x, y), grad(p[B], x - 1, y)),
        lerp(u, grad(p[A + 1], x, y - 1), grad(p[B + 1], x - 1, y - 1))
      );
      return Math.max(0, Math.min(1, (val + 1) * 0.5));
    };
  }
  const noise = makeNoise2D(7);

  // Palette: vibrant moss greens (emerald -> chartreuse)
  const DARK = [52, 92, 38], DK2 = [72, 122, 48], MID = [102, 158, 66],
        LT = [142, 196, 88], CHR = [182, 226, 98], BRT = [218, 245, 132];

  function inside(x, y) {
    const ang = Math.atan2(y - Cd.y, x - Cd.x);
    const r = Rd * (1 + 0.02 * Math.sin(3 * ang + 0.6));
    return ((x - Cd.x) * (x - Cd.x) + ((y - Cd.y) / 0.985) * ((y - Cd.y) / 0.985)) < r * r;
  }
  function bright(x, y) {
    let b = 1 - Math.min(1, Math.hypot(x - Hl.x, y - Hl.y) / (1.35 * Rd));
    b -= Math.max(0, ((x - Cd.x) + (y - Cd.y)) / (2 * Rd)) * 0.5;
    return Math.max(0, Math.min(1, b));
  }
  function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }

  const MAXLEN = 17;
  const blades = [], spores = [], bed = [], tendrils = [];

  function upAngle(x, y, splay) {
    let nx = x - Cd.x, ny = y - Cd.y, nl = Math.hypot(nx, ny) || 1;
    nx /= nl; ny /= nl;
    let dx = nx * 0.42, dy = ny * 0.42 - 0.95, jl = Math.hypot(dx, dy) || 1;
    return Math.atan2(dy / jl, dx / jl) + rr(-splay, splay);
  }

  // Build generative elements
  const step = 5.4;
  for (let y = Cd.y - Rd; y < Cd.y + Rd; y += step) {
    for (let x = Cd.x - Rd; x < Cd.x + Rd; x += step) {
      const jx = x + rr(-2.4, 2.4), jy = y + rr(-2.4, 2.4);
      if (!inside(jx, jy)) continue;
      const b = bright(jx, jy);
      if (rnd() < 0.10 + 0.45 * b) continue;
      const len = 3.6 + 8.5 * (1 - b) + rr(0, 3.6);
      const col = b > 0.72 ? pick([CHR, BRT, LT]) : b > 0.5 ? pick([LT, CHR, MID]) : b > 0.3 ? pick([MID, LT, DK2]) : pick([DARK, DK2, DARK, MID]);
      blades.push({
        x: jx, y: jy, len, ang: upAngle(jx, jy, 0.30), col,
        sw: 0.65 + 0.65 * (1 - b), a: (130 + 105 * (1 - b)) / 255, ph: rr(0, Math.PI * 2), stiff: 0.7 + 0.6 * rnd()
      });
    }
  }

  for (let i = 0; i < 190; i++) {
    const a = rr(0, Math.PI * 2);
    if (Math.sin(a) > 0.4 && rnd() < 0.55) continue;
    const rrad = Rd * rr(0.9, 1.0);
    const px = Cd.x + Math.cos(a) * rrad, py = Cd.y + Math.sin(a) * rrad * 0.985;
    const b = bright(px, py);
    spores.push({
      x: px, y: py, len: 9 + rr(0, 22), ang: upAngle(px, py, 0.22),
      col: b < 0.45 ? DARK : (b > 0.7 ? CHR : MID), cap: (i % 2 === 0), ph: rr(0, Math.PI * 2)
    });
  }

  for (let j = 0; j < 230; j++) {
    const bx = Cb.x + rr(-210, 210), dist = Math.abs(bx - Cb.x) / 210;
    const by = 556 + rr(-6, 14) + dist * 14, bl = 5 + rr(0, 12) * (1 - 0.5 * dist), bb = 1 - dist;
    bed.push({
      x: bx, y: by, len: bl, ang: -Math.PI / 2 + rr(-0.5, 0.5),
      col: bb < 0.5 ? pick([DARK, DK2, MID]) : pick([DK2, MID, LT]), a: (90 + 100 * bb) / 255, ph: rr(0, Math.PI * 2)
    });
  }

  for (let k = 0; k < 6; k++) {
    tendrils.push({ x0: 332 + rr(-4, 4), col: (k % 2 ? CHR : DARK), ph: rr(0, Math.PI * 2), n: 24, seed: rr(0, 100) });
  }

  const NB = 72;
  const windCols = new Float32Array(NB);
  let ambientElapsed = 0;
  const S = Math.min(width / VW, height / VH);
  const ox = (width - VW * S) / 2, oy = (height - VH * S) / 2;

  function blade(x, y, len, ang, wx, swayK) {
    const bend = wx * (len / MAXLEN) * swayK;
    const ex = x + Math.cos(ang) * len + bend;
    const ey = y + Math.sin(ang) * len;
    const cx = x + Math.cos(ang) * len * 0.5 + bend * 0.4;
    const cy = y + Math.sin(ang) * len * 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(cx, cy, ex, ey);
    ctx.stroke();
    return { ex, ey };
  }

  function ellipseArc(cx, cy, rx, ry) {
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.12) {
      const x = cx + rx * Math.cos(a) * (1 + 0.02 * Math.sin(3 * a + 0.6));
      const y = cy + ry * Math.sin(a);
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  function render(dt = 0.016) {
    ambientElapsed += dt * 1000;
    const t = ambientElapsed * 0.001;

    // Transparent background - seamlessly integrates directly onto the acoustic room wall
    ctx.clearRect(0, 0, width, height);

    // Wind dynamics
    const gust = Math.sin(t * 0.5) * 0.4 + Math.sin(t * 0.23) * 0.25;
    for (let i = 0; i < NB; i++) {
      windCols[i] = ((noise(i * 0.16, t * 0.22) - 0.5) * 2 + gust) * 8.0;
    }

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(S, S);
    ctx.lineCap = 'round';

    const pulse = Math.sin(t * 0.95);
    const br = 1 + 0.010 * Math.sin(t * 0.6);
    const squash = pulse * 0.025;
    const drift = Math.sin(t * 0.7) * 4;

    // Moss bed (behind)
    for (let k = 0; k < bed.length; k++) {
      const o = bed[k];
      const bk = Math.floor((o.x / VW) * NB);
      const wx = windCols[Math.max(0, Math.min(NB - 1, bk))] * 0.7 + Math.sin(t * 0.9 + o.ph) * 0.8;
      ctx.strokeStyle = `rgba(${o.col[0]}, ${o.col[1]}, ${o.col[2]}, ${Math.max(o.a, 0.75)})`;
      ctx.lineWidth = 0.9;
      blade(o.x, o.y, o.len, o.ang, wx, 1.1);
    }

    ctx.save();
    ctx.translate(Cd.x + drift, Cd.y + pulse * 3);
    ctx.scale(br * (1 + squash), br / (1 + squash));
    ctx.translate(-Cd.x, -Cd.y);

    // Faint dome outlines
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = 'rgba(102, 158, 66, 0.55)';
    ellipseArc(Cb.x, Cb.y + 4, 252, 246);
    ctx.strokeStyle = 'rgba(72, 122, 48, 0.65)';
    ellipseArc(Cd.x, Cd.y, Rd, Rd * 0.985);

    // Orb filaments
    for (let k = 0; k < blades.length; k++) {
      const o = blades[k];
      const bk = Math.floor((o.x / VW) * NB);
      const wx = windCols[Math.max(0, Math.min(NB - 1, bk))] + Math.sin(t * 0.8 + o.ph) * 0.5;
      ctx.strokeStyle = `rgba(${o.col[0]}, ${o.col[1]}, ${o.col[2]}, ${Math.max(o.a, 0.82)})`;
      ctx.lineWidth = Math.max(o.sw, 1.0);
      blade(o.x, o.y, o.len, o.ang, wx, o.stiff);
    }

    // Sporophytes + capsules
    for (let k = 0; k < spores.length; k++) {
      const o = spores[k];
      const bk = Math.floor((o.x / VW) * NB);
      const wx = windCols[Math.max(0, Math.min(NB - 1, bk))] * 1.3 + Math.sin(t * 0.7 + o.ph) * 1.2;
      ctx.strokeStyle = `rgba(${o.col[0]}, ${o.col[1]}, ${o.col[2]}, 0.92)`;
      ctx.lineWidth = 1.0;
      const tip = blade(o.x, o.y, o.len, o.ang, wx, 1.4);
      if (o.cap) {
        ctx.fillStyle = `rgba(${o.col[0]}, ${o.col[1]}, ${o.col[2]}, 0.95)`;
        ctx.save();
        ctx.translate(tip.ex, tip.ey);
        ctx.rotate(Math.atan2(tip.ey - o.y, tip.ex - o.x) - Math.PI / 2);
        ctx.beginPath();
        ctx.ellipse(0, 0, 2.0, 2.9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Standalone waving tendrils
    ctx.lineWidth = 1.0;
    for (let k = 0; k < tendrils.length; k++) {
      const o = tendrils[k];
      ctx.strokeStyle = `rgba(${o.col[0]}, ${o.col[1]}, ${o.col[2]}, 0.85)`;
      ctx.beginPath();
      let px = o.x0, py = 90;
      ctx.moveTo(px, py + 18);
      for (let j = 0; j < o.n; j++) {
        const sway = Math.sin(t * 1.1 + j * 0.5 + o.ph) * (j * 0.14);
        px += (noise(o.seed + j * 0.3) - 0.5) * 5 + sway;
        py -= 2.4;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.fillStyle = `rgba(${o.col[0]}, ${o.col[1]}, ${o.col[2]}, 0.90)`;
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // orb
    ctx.restore(); // virtual space
  }

  // Initial draw
  render(0);

  return {
    canvas,
    update(dt) {
      render(dt);
    }
  };
}
