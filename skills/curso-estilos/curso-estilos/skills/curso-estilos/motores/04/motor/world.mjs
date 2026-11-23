// Deterministic voxel world: snowy pine forest + log cabin at blue hour.
// x = right, y = up, z = away from camera (north). 1 voxel = 1 unit.
export const NX = 176, NY = 80, NZ = 260;

export const M = {
  AIR: 0, SNOW: 1, PATH: 2, DIRT: 3, STONE: 4, LOGX: 5, LOGZ: 6, LOGY: 7, PLANK: 8, ROOF: 9,
  NEEDLE: 10, SNOWNEEDLE: 11, WINDOW: 12, DOOR: 13, ICE: 14, COBBLE: 15, BARK: 16, INTERIOR: 17, ROCK: 18, SNOWROOF: 19,
  ROCKET: 20, ROCKETDARK: 21, PAD: 22, LAMP: 23, STEEL: 24,
};
// average linear albedo per material (used by the bake; shader textures average to roughly these)
export const ALBEDO = {
  1: [0.80, 0.84, 0.90], 2: [0.62, 0.66, 0.74], 3: [0.20, 0.13, 0.08], 4: [0.30, 0.30, 0.32],
  5: [0.30, 0.18, 0.10], 6: [0.30, 0.18, 0.10], 7: [0.22, 0.13, 0.07], 8: [0.36, 0.23, 0.12], 9: [0.18, 0.10, 0.07],
  10: [0.035, 0.07, 0.045], 11: [0.42, 0.47, 0.50], 12: [0.9, 0.6, 0.3], 13: [0.20, 0.11, 0.06], 14: [0.35, 0.50, 0.65],
  15: [0.28, 0.27, 0.28], 16: [0.16, 0.10, 0.06], 17: [0.3, 0.2, 0.1], 18: [0.32, 0.33, 0.35], 19: [0.50, 0.48, 0.50],
  20: [0.70, 0.70, 0.68], 21: [0.045, 0.045, 0.05], 22: [0.30, 0.30, 0.31], 23: [0.6, 0.1, 0.08], 24: [0.22, 0.23, 0.25],
};

export function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function h2(x, z, s = 0) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(z | 0, 668265263) ^ Math.imul(s, 1442695041); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, z, s) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = h2(xi, zi, s), b = h2(xi + 1, zi, s), c = h2(xi, zi + 1, s), d = h2(xi + 1, zi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, z, s, o = 4) { let f = 0, a = 0.5, fr = 1; for (let i = 0; i < o; i++) { f += a * vnoise(x * fr, z * fr, s + i * 17); a *= 0.5; fr *= 2.03; } return f; }
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- layout
export const CABIN = { x0: 92, x1: 102, z0: 52, z1: 60, y0: 11, wallTop: 15 }; // inclusive voxel ranges
export const GROUND = 10; // top snow voxel y near cabin
export const POND = { x: 81.5, z: 46.5, r: 5.2 };
export const SPOT = { x: 73.5, z: 54.5, r: 5.5 }; // clearing where the 'bomb' sits
export const ICECAM = { x: 78.5, z: 38.5, r: 4.5 }; // keep trees off the THIN ICE camera
// earlier pilot: a launch pad + rocket standing left-behind the cabin (screen right). ROCKET=0 in env disables it.
const _noRocket = typeof process !== 'undefined' && process.env ? process.env.ROCKET === '0' : (typeof location !== 'undefined' && new URLSearchParams(location.search).has('norocket'));
export const ROCKET = { on: !_noRocket, x: 83.5, z: 68.5, R: 2.7, padR: 8.5, h: 30, nose: 9 };
// path and stream are art-directed in SCREEN space (sx, view depth) and converted to ground curves
function catmull(pts, n = 12) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
let _curves = null;
export function curves() {
  if (_curves) return _curves;
  const path = catmull([...[[395, 7], [430, 14], [405, 23], [345, 33]].map(([sx, d]) => groundAt(sx, d)), [97.5, 50.5]]);
  const stream = catmull([[-260, 14], [-80, 16], [150, 19], [360, 23], [560, 28], [760, 34], [960, 44], [1250, 70]].map(([sx, d]) => groundAt(sx, d)).concat([[40, 110], [34, 160], [30, 220]]));
  _curves = { path, stream };
  return _curves;
}
function distPoly(poly, x, z) {
  let best = 1e9, bt = 0;
  for (let i = 0; i < poly.length - 1; i++) {
    const [ax, az] = poly[i], [bx, bz] = poly[i + 1];
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    const t = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / l2));
    const d = Math.hypot(x - ax - t * dx, z - az - t * dz);
    if (d < best) { best = d; bt = i + t; }
  }
  return best;
}
export const distPath = (x, z) => distPoly(curves().path, x, z);
export const distStream = (x, z) => distPoly(curves().stream, x, z);

export function terrainH(x, z) {
  let h = GROUND + (fbm(x * 0.06, z * 0.06, 3) - 0.5) * 3.2;
  // distant hills rising behind the cabin, layered ridges
  const back = smooth(66, 250, z);
  h += back * 34 + (fbm(x * 0.025, z * 0.025, 9) - 0.5) * 14 * back;
  // valley walls left/right
  h += Math.pow(Math.max(0, Math.abs(x - 90) - 34) * 0.16, 1.3) * (0.6 + back);
  // flatten around cabin & path
  const dc = Math.hypot((x - 97) / 13, (z - 56) / 11);
  const flatC = 1 - smooth(0.8, 1.5, dc);
  h = h * (1 - flatC) + GROUND * flatC;
  { const dp = distPath(x + 0.5, z + 0.5); const f = 1 - smooth(2.0, 6.0, dp); h = h * (1 - f) + GROUND * f; }
  { const ds = distStream(x + 0.5, z + 0.5); const f = 1 - smooth(3.0, 7.0, ds); h = h * (1 - f) + GROUND * f; }
  if (ROCKET.on) { const dr = Math.hypot(x + 0.5 - ROCKET.x, z + 0.5 - ROCKET.z); const f = 1 - smooth(ROCKET.padR + 1, ROCKET.padR + 6, dr); h = h * (1 - f) + GROUND * f; }
  return Math.round(h);
}

export function buildWorld() {
  const vox = new Uint8Array(NX * NY * NZ);
  const I = (x, y, z) => x + NX * (y + NY * z);
  const inb = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < NX && y < NY && z < NZ;
  const set = (x, y, z, m) => { if (inb(x, y, z)) vox[I(x, y, z)] = m; };
  const get = (x, y, z) => inb(x, y, z) ? vox[I(x, y, z)] : 0;
  const rnd = mulberry32(20261002);
  const H = new Int16Array(NX * NZ);

  // ---- terrain + stream
  for (let z = 0; z < NZ; z++) for (let x = 0; x < NX; x++) {
    let h = terrainH(x, z);
    const ds = distStream(x + 0.5, z + 0.5);
    let ice = false;
    const sw = 2.1 + 0.9 * vnoise(x * 0.15, z * 0.15, 21);
    const dpond = Math.hypot((x + 0.5 - POND.x) / 1.25, z + 0.5 - POND.z) + (vnoise(x * 0.3, z * 0.3, 41) - 0.5) * 1.6;
    if (ds < sw || dpond < POND.r) { h = Math.min(h, GROUND - 1); ice = true; }
    // a metre of fresh snow everywhere, except the dug-out footpath and the porch
    const isPath = z < CABIN.z0 && distPath(x + 0.5, z + 0.5) < 1.05 + 0.45 * vnoise(x * 0.3, z * 0.3, 5);
    const porch = x >= 94 && x <= 100 && z >= CABIN.z0 - 3 && z < CABIN.z0;
    if (!ice && !isPath && !porch) {
      h += 1;
      // wind-blown drifts in the open snow (keep the path walls, banks and the cabin clearing clean)
      const away = Math.min(distPath(x + 0.5, z + 0.5) - 2.5, distStream(x + 0.5, z + 0.5) - 3.5, Math.hypot((x - 97) / 9, (z - 56) / 8) * 8 - 9);
      if (away > 0) h += Math.round(Math.min(1, away / 3) * Math.max(0, fbm(x * 0.11, z * 0.11, 31) - 0.42) * 5.0);
    }
    H[x + NX * z] = h;
    for (let y = 0; y <= h; y++) {
      let m = y < h - 3 ? M.STONE : (y < h - 1 ? M.DIRT : M.SNOW);
      set(x, y, z, m);
    }
    if (ice) set(x, h, z, M.ICE);
  }
  // footpath (trampled snow), slightly sunken look via material only
  for (let z = 0; z < CABIN.z0; z++) for (let x = 40; x < 130; x++) {
    const d = distPath(x + 0.5, z + 0.5);
    const w = 1.05 + 0.45 * vnoise(x * 0.3, z * 0.3, 5);
    if (d < w && get(x, GROUND, z) === M.SNOW && H[x + NX * z] === GROUND) set(x, GROUND, z, M.PATH);
    // little plank bridge where the path crosses the frozen stream
    if (d < 1.6 && get(x, GROUND - 1, z) === M.ICE) { set(x, GROUND, z, M.PLANK); }
  }

  // ---- cabin
  const C = CABIN;
  for (let x = C.x0 - 1; x <= C.x1 + 1; x++) for (let z = C.z0 - 1; z <= C.z1 + 1; z++) {
    for (let y = GROUND - 2; y <= GROUND; y++) set(x, y, z, M.COBBLE); // stone foundation
  }
  for (let x = C.x0; x <= C.x1; x++) for (let z = C.z0; z <= C.z1; z++) for (let y = C.y0; y <= C.wallTop; y++) {
    const edgeX = x === C.x0 || x === C.x1, edgeZ = z === C.z0 || z === C.z1;
    if (edgeX && edgeZ) set(x, y, z, (y - C.y0) % 2 === 0 ? M.LOGX : M.LOGZ); // interlocking corner notches
    else if (edgeZ) set(x, y, z, M.LOGX);
    else if (edgeX) set(x, y, z, M.LOGZ);
    else set(x, y, z, M.INTERIOR);
  }
  // corner posts poke up one
  // log ends sticking out past the corners, alternating per course
  for (let y = C.y0; y <= C.wallTop; y++) {
    if ((y - C.y0) % 2 === 0) for (const [x, z] of [[C.x0 - 1, C.z0], [C.x1 + 1, C.z0], [C.x0 - 1, C.z1], [C.x1 + 1, C.z1]]) set(x, y, z, M.LOGX);
    else for (const [x, z] of [[C.x0, C.z0 - 1], [C.x1, C.z0 - 1], [C.x0, C.z1 + 1], [C.x1, C.z1 + 1]]) set(x, y, z, M.LOGZ);
  }
  // door + windows (front wall z0 faces the camera, west wall x0 also visible)
  for (let y = C.y0; y <= C.y0 + 1; y++) set(97, y, C.z0, M.DOOR);
  set(97, C.y0 + 2, C.z0, M.PLANK); // lintel
  const windows = [
    { axis: 2, plane: C.z0, sign: -1, a0: 93, a1: 95, y0: 12, y1: 14 },   // front left (x range)
    { axis: 2, plane: C.z0, sign: -1, a0: 99, a1: 101, y0: 12, y1: 14 },  // front right
    { axis: 0, plane: C.x0, sign: -1, a0: 54, a1: 56, y0: 12, y1: 14 },   // west (z range)
    { axis: 0, plane: C.x0, sign: -1, a0: 57, a1: 59, y0: 12, y1: 14 },   // west 2
  ];
  for (const w of windows) for (let a = w.a0; a < w.a1; a++) for (let y = w.y0; y < w.y1; y++) {
    if (w.axis === 2) set(a, y, w.plane, M.WINDOW); else set(w.plane, y, a, M.WINDOW);
  }
  // window sills (plank under each window, sticking out)
  for (const w of windows) for (let a = w.a0; a < w.a1; a++) {
    if (w.axis === 2) set(a, w.y0 - 1, w.plane - 1, M.PLANK); else set(w.plane - 1, w.y0 - 1, a, M.PLANK);
  }
  // gable roof, ridge along x, stepped, overhang 1, snow on top of every step
  const zr0 = C.z0 - 2, zr1 = C.z1 + 2;
  const roofTop = [];
  for (let k = 0; ; k++) {
    const za = zr0 + k, zb = zr1 - k;
    if (za > zb) break;
    const y = C.wallTop + 1 + k;
    for (let x = C.x0 - 2; x <= C.x1 + 2; x++) {
      set(x, y, za, M.ROOF); set(x, y, zb, M.ROOF);
      if (zb - za <= 1) for (let z = za; z <= zb; z++) set(x, y, z, M.ROOF);
    }
    // gable fill (planks) inside walls
    for (let x = C.x0; x <= C.x1; x += C.x1 - C.x0) for (let z = za + 1; z < zb; z++) set(x, y, z, M.PLANK);
    for (let x = C.x0 + 1; x < C.x1; x++) for (let z = za + 1; z < zb; z++) set(x, y, z, M.INTERIOR);
    roofTop.push(y);
  }
  // porch roof over door: small plank awning
  for (let x = 95; x <= 99; x++) { set(x, C.y0 + 3, C.z0 - 1, M.ROOF); }
  // chimney on east gable, outside wall
  for (let y = GROUND - 1; y <= C.wallTop + 9; y++) for (let x = C.x1 + 1; x <= C.x1 + 2; x++) for (let z = 55; z <= 56; z++) {
    if (y > C.wallTop + 8 && x === C.x1 + 1 && z === 55) continue; // notch top
    set(x, y, z, M.COBBLE);
  }
  const chimneyTop = [C.x1 + 2.0, C.wallTop + 10, 56.0];
  // woodpile against west wall (log ends face west -> LOGX)
  for (let z = C.z1 - 1; z <= C.z1 + 1; z++) for (let y = C.y0; y <= C.y0 + 1; y++) set(C.x0 - 1, y, z, M.LOGX);
  set(C.x0 - 1, C.y0 + 2, C.z1, M.LOGX);
  // little bench/barrel? stone step at door
  set(97, GROUND, C.z0 - 1, M.PLANK); set(96, GROUND, C.z0 - 1, M.PLANK); set(98, GROUND, C.z0 - 1, M.PLANK);

  // ---- earlier pilot: launch pad, rocket, service tower
  if (ROCKET.on) {
    const RX = ROCKET.x, RZ = ROCKET.z, R = ROCKET.R, y0 = GROUND + 2, top = y0 + ROCKET.h;
    // concrete pad, raised one block, snow left on its outer ring
    for (let x = Math.floor(RX - ROCKET.padR - 1); x <= RX + ROCKET.padR + 1; x++) for (let z = Math.floor(RZ - ROCKET.padR - 1); z <= RZ + ROCKET.padR + 1; z++) {
      const d = Math.hypot(x + 0.5 - RX, z + 0.5 - RZ); if (d > ROCKET.padR) continue;
      for (let y = GROUND - 2; y <= GROUND + 1; y++) set(x, y, z, M.PAD);
      for (let y = GROUND + 2; y <= GROUND + 8; y++) set(x, y, z, M.AIR);
      H[x + NX * z] = GROUND + 1;
    }
    // body: round in voxels, roll-pattern checker low, a dark band high
    for (let y = y0; y <= top + ROCKET.nose; y++) {
      const k = y - top; const r = k <= 0 ? R : R * Math.pow(1 - k / (ROCKET.nose + 0.6), 0.75) + 0.15;
      for (let x = Math.floor(RX - R - 1); x <= RX + R + 1; x++) for (let z = Math.floor(RZ - R - 1); z <= RZ + R + 1; z++) {
        const dx = x + 0.5 - RX, dz = z + 0.5 - RZ; if (Math.hypot(dx, dz) > r) continue;
        let m = M.ROCKET;
        const quad = (dx > 0) !== (dz > 0);
        if (y >= y0 + 4 && y <= y0 + 8 && quad) m = M.ROCKETDARK;          // roll-pattern checker
        if (y >= y0 + 9 && y <= y0 + 13 && !quad) m = M.ROCKETDARK;
        if (y === y0 + 21 || y === y0 + 22) m = M.ROCKETDARK;              // band
        if (y === top || y === top + 1) m = M.ROCKETDARK;                   // nose seam
        set(x, y, z, m);
      }
    }
    set(Math.floor(RX), top + ROCKET.nose + 1, Math.floor(RZ), M.LAMP);
    // engine skirt under the body
    for (let x = Math.floor(RX - R); x <= RX + R; x++) for (let z = Math.floor(RZ - R); z <= RZ + R; z++) {
      const d = Math.hypot(x + 0.5 - RX, z + 0.5 - RZ); if (d < R - 0.4 && d > R - 1.6) set(x, y0 - 1, z, M.STEEL);
    }
    // four fins, swept down to the pad
    for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      for (let s2 = Math.ceil(R); s2 <= R + 3.2; s2++) {
        const out = (s2 - R) / 3.2, hgt = Math.round(8 - out * 6);
        for (let y = y0 - 1; y <= y0 - 1 + hgt; y++) set(Math.floor(RX + ax * s2), y, Math.floor(RZ + az * s2), M.ROCKETDARK);
      }
      set(Math.floor(RX + ax * (R + 3.2)), y0 + 2, Math.floor(RZ + az * (R + 3.2)), M.LAMP);
    }
  }

  // ---- rocks along the stream
  const rocks = [[610, 34], [560, 46], [690, 62]].map(([sx, d]) => groundAt(sx, d));
  for (const [rx, rz] of rocks) {
    const r = 1.6 + rnd() * 0.8;
    for (let x = Math.floor(rx - 3); x <= rx + 3; x++) for (let z = Math.floor(rz - 3); z <= rz + 3; z++) {
      const g = H[x + NX * z];
      for (let y = g; y <= g + 2; y++) {
        const d = Math.hypot(x + 0.5 - rx, (y - g) * 1.4, z + 0.5 - rz);
        if (d < r) set(x, y, z, M.ROCK);
      }
    }
  }

  // ---- pines
  const trees = [];
  const forbid = (x, z) => {
    if (x > C.x0 - 6 && x < C.x1 + 6 && z > C.z0 - 6 && z < C.z1 + 6) return true;
    if (distPath(x, z) < 4.5) return true;
    if (distStream(x, z) < 4.5) return true;
    if (ROCKET.on && Math.hypot(x - ROCKET.x, z - ROCKET.z) < ROCKET.padR + 5) return true;
    if (Math.hypot(x - POND.x, z - POND.z) < POND.r + 4 || Math.hypot(x - SPOT.x, z - SPOT.z) < SPOT.r + 3 || Math.hypot(x - ICECAM.x, z - ICECAM.z) < ICECAM.r + 2) return true;
    return false;
  };
  // hand-placed framing trees (foreground left/right, flanking the cabin)
  // framing trees placed by where they land on screen: [screen x, view depth, height, crown radius]
  const hand = [[-170, 21, 30, 4.4], [850, 22, 27, 4.5], [60, 50, 24, 4.4], [660, 52, 22, 4.2], [250, 68, 25, 4.6], [520, 72, 23, 4.4], [640, 34, 14, 2.6]];
  for (const [sx, zc, h, r] of hand) { const [x, z] = groundAt(sx, zc); if (ROCKET.on && Math.hypot(x - ROCKET.x, z - ROCKET.z) < ROCKET.padR + 5) continue; if (Math.hypot(x - POND.x, z - POND.z) < POND.r + 3 || Math.hypot(x - ICECAM.x, z - ICECAM.z) < ICECAM.r + 3) continue; trees.push({ x, z, h, r, hand: true }); }
  for (let gz = 6; gz < NZ - 4; gz += 6) for (let gx = 4; gx < NX - 4; gx += 6) {
    const x = gx + Math.floor(rnd() * 6), z = gz + Math.floor(rnd() * 6);
    const far = smooth(40, 120, z);
    const dens = 0.18 + 0.55 * far + 0.3 * smooth(30, 60, Math.abs(x - 92));
    if (rnd() > dens) continue;
    if (forbid(x, z)) continue;
    { // keep the view corridor in front of the cabin clear (framing trees are hand placed)
      const [sx, , zc, F] = toScreen(x + 0.5, GROUND + 6, z + 0.5);
      const cabD = toScreen(97, 14, 56)[2];
      const half = (2.6 + 12 * 0.13) * F / Math.max(zc, 1);
      if (zc > 0 && zc < cabD + 3 && sx + half > 90 && sx - half < 630) continue;
      if (Math.hypot(x - CAM.p0[0], z - CAM.p0[2]) < 10 || Math.hypot(x - CAM.p1[0], z - CAM.p1[2]) < 10) continue;
    }
    if (trees.some(t => Math.hypot(t.x - x, t.z - z) < t.r + 1.2)) continue;
    const h = 11 + Math.floor(rnd() * 13 + far * 4);
    trees.push({ x, z, h, r: 2.2 + h * 0.13 + rnd() * 0.8 });
  }
  for (const t of trees) {
    const g = H[t.x + NX * t.z];
    if (get(t.x, g, t.z) === M.ICE) continue;
    const s = Math.floor(rnd() * 1e6);
    const top = g + t.h;
    for (let y = g + 1; y <= top - 2; y++) set(t.x, y, t.z, M.BARK);
    const yb = g + 3;
    for (let y = yb; y <= top; y++) {
      const u = (y - yb) / (top - yb);
      // tiers: radius saw-tooth that droops outward at the bottom of each tier
      const tierLen = 3 + (t.h > 18 ? 1 : 0);
      const ph = ((top - y) % tierLen) / tierLen;
      let r = t.r * Math.pow(1 - u, 0.95) * (0.62 + 0.38 * ph) + 0.6;
      if (y === top) r = 0.5;
      const R = Math.ceil(r) + 1;
      for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) {
        const d = Math.hypot(dx, dz) + (vnoise((t.x + dx) * 0.9, (y + dz) * 0.9 + s, 7) - 0.5) * 1.3;
        if (d <= r) { if (get(t.x + dx, y, t.z + dz) === 0) set(t.x + dx, y, t.z + dz, M.NEEDLE); }
      }
    }
    set(t.x, top + 1, t.z, M.NEEDLE);
  }
  // snow on needles: exposed top -> snowy needles; some chunky snow caps
  for (let z = 0; z < NZ; z++) for (let y = NY - 2; y > 0; y--) for (let x = 0; x < NX; x++) {
    const i = I(x, y, z);
    if (vox[i] !== M.NEEDLE) continue;
    if (vox[I(x, y + 1, z)] !== 0) continue;
    vox[i] = M.SNOWNEEDLE;
    // cap only where it rests on more needles (edges stay feathery)
    const support = (get(x + 1, y, z) ? 1 : 0) + (get(x - 1, y, z) ? 1 : 0) + (get(x, y, z + 1) ? 1 : 0) + (get(x, y, z - 1) ? 1 : 0);
    if (support >= 3 && h2(x * 7 + y, z * 3, 99) < 0.42) set(x, y + 1, z, M.SNOW);
  }
  // roof purlins / ridge beam: log ends peeking out of both gables under the snow
  { const ridgeY = C.wallTop + 1 + Math.floor((C.z1 - C.z0 + 4) / 2) - 1;
    for (const x of [C.x0 - 3, C.x1 + 3]) { set(x, ridgeY, 56, M.LOGX); set(x, C.wallTop + 2, C.z0 + 1, M.LOGX); set(x, C.wallTop + 2, C.z1 - 1, M.LOGX); } }
  // snowy stump by the path (axe added as a mesh)
  { const sx = 91, sz = 40; set(sx, H[sx + NX * sz] + 1, sz, M.BARK); }
  // snow on roof steps and sills, chimney top
  for (let z = 0; z < NZ; z++) for (let y = NY - 2; y > GROUND; y--) for (let x = 0; x < NX; x++) {
    const m = vox[I(x, y, z)];
    if ((m === M.ROOF || m === M.COBBLE || m === M.LOGY || m === M.LOGX || m === M.ROCK || m === M.ROCKET || m === M.ROCKETDARK || m === M.STEEL || (m === M.PAD && h2(x, z, 5) < 0.55)) && vox[I(x, y + 1, z)] === 0) {
      if (m === M.COBBLE && x >= C.x1 + 1 && y > C.wallTop + 7) continue; // keep chimney mouth clear
      if (m === M.ROOF) {
        const r = h2(x * 3 + y, z * 5, 77);
        if (r < 0.13 && y > C.wallTop + 1) continue;           // bare shingles where the snow slid off
        vox[I(x, y, z)] = M.SNOWROOF;                          // thin snow layer: white cap + ragged fringe over the shingles
        const nearChimney = x >= C.x1 - 1 && x <= C.x1 + 2 && z >= 53 && z <= 58;
        if (r > 0.86 || nearChimney) set(x, y + 1, z, M.SNOW);  // thicker lumps, drift banked against the chimney
        continue;
      }
      if (m === M.LOGX && y < C.y0 + 3) { set(x, y + 1, z, M.SNOW); continue; }
      set(x, y + 1, z, M.SNOW);
    }
  }

  const lights = {
    interior: [97.5, 13.0, 56.0],      // warm lamp/fire inside, beams through windows
    interiorR: 0.9,
    lantern: [98.75, 13.25, C.z0 - 0.55], // hanging lantern right of the door
    chimneyTop,
    windows,
  };
  return { vox, H, lights, trees, I, get };
}

// ---------------------------------------------------------------- camera (shared so the world can place framing trees by screen position)
export const CAM = {
  fov: 52, aspect: 9 / 16,
  p0: [73.5, 18.6, 14.0], p1: [74.9, 18.3, 16.8],   // slow push-in with a slight crab right over 10 s
  t0: [97.5, 18.7, 56.0], t1: [97.7, 18.5, 56.0],
};
// pinhole projection of CAM at t=0 -> [px, py, depth] on the 720x1280 frame
export function toScreen(x, y, z) {
  const p = CAM.p0, t = CAM.t0;
  let f = [t[0] - p[0], t[1] - p[1], t[2] - p[2]]; const fl = Math.hypot(...f); f = f.map(v => v / fl);
  let r = [f[2], 0, -f[0]]; const rl = Math.hypot(...r); r = r.map(v => -v / rl); // right = f x up
  r = [-f[2], 0, f[0]].map(v => v / rl);
  const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  const d = [x - p[0], y - p[1], z - p[2]];
  const zc = d[0] * f[0] + d[1] * f[1] + d[2] * f[2];
  const xc = d[0] * r[0] + d[1] * r[1] + d[2] * r[2], yc = d[0] * u[0] + d[1] * u[1] + d[2] * u[2];
  const F = 640 / Math.tan(CAM.fov * Math.PI / 360);
  return [360 + xc / zc * F, 640 - yc / zc * F, zc, F];
}
// ground point (x,z) seen at screen column px with view depth zc
export function groundAt(px, zc) {
  const p = CAM.p0, t = CAM.t0;
  let f = [t[0] - p[0], 0, t[2] - p[2]]; const fl = Math.hypot(...f); f = f.map(v => v / fl);
  const r = [-f[2], 0, f[0]];
  const F = 640 / Math.tan(CAM.fov * Math.PI / 360);
  const xc = (px - 360) / F * zc;
  return [Math.round(p[0] + f[0] * zc + r[0] * xc), Math.round(p[2] + f[2] * zc + r[2] * xc)];
}
