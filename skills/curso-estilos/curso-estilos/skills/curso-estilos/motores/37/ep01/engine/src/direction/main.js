// direction/main.js - PATINETE (ep01) direction (ours): st.plan for every department, a pure function of film time.
// Characters on twos (tw), FX on threes (th), camera on ones (direction/late.js). Shot table + cues: shots.js.
import { groundH } from '../field.js';

export const P0 = [-4.6, 0.12, 0];          // street impact point (sidewalk top 0.12)
const PI = Math.PI;
export const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const sst = (a, b, x) => { const t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const io = (x) => { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2; };
export const oc = (x) => 1 - (1 - cl(x)) ** 3;
export const tw = (t) => Math.floor(t * 12 + 1e-6) / 12;
export const th = (t) => Math.floor(t * 8 + 1e-6) / 8;
export const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const L3 = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));

function mixPose(a, b, k) {
  const o = {}; const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const j of keys) o[j] = L3(a[j] ?? [0, 0, 0], b[j] ?? [0, 0, 0], k);
  return o;
}
const STAND = { shoulderL: [0.05, 0, 0.12], shoulderR: [0.05, 0, -0.12], elbowL: [-0.2, 0, 0], elbowR: [-0.2, 0, 0] };
function walk(t, amp = 1, phone = false) {
  const ph = tw(t) * PI * 2 * 0.95;
  const s = Math.sin(ph), c = Math.cos(ph);
  const p = {
    hipL: [-0.42 * s * amp, 0, 0.03], hipR: [0.42 * s * amp, 0, -0.03],
    kneeL: [0.15 + 0.75 * Math.max(0, Math.sin(ph + 1.3)) * amp, 0, 0], kneeR: [0.15 + 0.75 * Math.max(0, Math.sin(ph + PI + 1.3)) * amp, 0, 0],
    ankleL: [0.1 * s, 0, 0], ankleR: [-0.1 * s, 0, 0],
    shoulderL: [0.3 * s * amp, 0, 0.1], elbowL: [-0.35, 0, 0],
    shoulderR: [-0.3 * s * amp, 0, -0.1], elbowR: [-0.35, 0, 0],
    spine: [0.04, 0.06 * s, 0], neck: [0, -0.04 * s, 0], head: [0, 0, 0],
  };
  if (phone) Object.assign(p, { shoulderR: [-0.45, 0.2, -0.12], elbowR: [-1.45, 0.35, 0], wristR: [0.25, 0, 0], neck: [0.14, 0, 0], head: [0.2, 0, 0], spine: [0.1, 0.03 * s, 0] });
  return { pose: p, hipsY: 0.95 - 0.025 * Math.abs(c) };
}
// startled: leans back, arms up, one knee lifted (cartoon "eek")
const EEK = { ...STAND, spine: [-0.22, 0, 0], neck: [-0.1, 0, 0], head: [-0.05, 0, 0], shoulderL: [-2.1, 0, 0.7], elbowL: [-0.9, 0, 0], shoulderR: [-2.0, 0.2, -0.8], elbowR: [-0.9, 0, 0],
  hipL: [-0.9, 0, 0.1], kneeL: [1.3, 0, 0], ankleL: [0.3, 0, 0], hipR: [0.1, 0, 0], kneeR: [0.25, 0, 0] };
const SPLAT = (t) => { const k = (Math.floor(tw(t) * 12) % 3) / 2; return { shoulderL: [0, 0, 1.35], shoulderR: [0, 0, -1.35], elbowL: [-0.2, 0, 0], elbowR: [-0.2, 0, 0], hipL: [0, 0, 0.3], hipR: [0, 0, -0.3], kneeL: [0.2 + 1.1 * k, 0, 0], kneeR: [1.0 - 0.8 * k, 0, 0], ankleL: [0.5, 0, 0], ankleR: [0.5, 0, 0], head: [0, 0.5, 0] }; };

// ------------------------------------------------------------ street timing
export const heroZ = (t) => Math.min(0, -1.25 * (8.2 - t));
export const scootZ = (t) => (t >= 8.2 ? 0.55 : heroZ(t) + 0.55 + (8.2 - t) * 9);
// ------------------------------------------------------------ FX builders
function starsOrbit(t, c, r = 0.45, n = 3, s = 0.2, k = 'star') {
  const T = th(t), out = [];
  for (let i = 0; i < n; i++) { const a = T * 4.5 + i * PI * 2 / n; out.push({ k, p: [c[0] + Math.cos(a) * r, c[1] + Math.sin(a * 2) * 0.05, c[2] + Math.sin(a) * r * 0.6], s }); }
  return out;
}
function dustBurst(t, t0, c, n = 14, R = 1.6, size = 0.35) {
  const T = th(t), age = T - t0, out = []; if (age < 0 || age > 1.6) return out;
  for (let i = 0; i < n; i++) {
    const a = i / n * PI * 2 + hash(i) * 0.4, rr = R * oc(age / 0.7) * (0.7 + 0.5 * hash(i + 4));
    const sc = size * (0.6 + 0.6 * hash(i + 7)) * (1 - sst(0.7, 1.6, age)) * (0.5 + 0.5 * oc(age / 0.3));
    out.push({ p: [c[0] + Math.cos(a) * rr, c[1] + sc * 0.6 + age * 0.15, c[2] + Math.sin(a) * rr], r: sc });
  }
  return out;
}
function trailPuffs(t, pathFn, t0, t1, n = 10, size = 0.16) {   // little dust balls left behind a moving thing
  const T = th(t), out = [];
  for (let i = 0; i < n; i++) {
    const born = T - i * 0.125; if (born < t0 || born > t1) continue; const age = T - born, p = pathFn(born);
    const sc = size * (1 - age / (n * 0.125)) * (0.7 + 0.5 * hash(i + Math.floor(born * 8)));
    out.push({ p: [p[0] + (hash(born * 8) - 0.5) * 0.2, p[1] + 0.08 + age * 0.25, p[2]], r: Math.max(0, sc) });
  }
  return out;
}

// ------------------------------------------------------------ field: the scooter's joy ride (circle around the origin)
export const RIDE = { c: [0, -1.5], R: 3.2 };
export const rideAng = (t) => { const u = cl((t - 21.0) / 5.0); return -PI / 2 + PI * 2 * 1.15 * (u * (1.15 - 0.15 * u)) ; };   // slows near the end
export function ridePos(t) { const a = rideAng(t); const x = RIDE.c[0] + Math.cos(a) * RIDE.R, z = RIDE.c[1] + Math.sin(a) * RIDE.R; return [x, groundH(x, z), z]; }
export const SZ = -42;

// ------------------------------------------------------------ the plan
export function plan(t, st) {
  const sid = st?.sid ?? '';
  const hero = { on: true, pos: [0, 0, 0], ry: 0, face: 'normal', pose: STAND, prop: {} };
  const fx = { sprites: [], shadows: [], puffs: [], rings: [], chips: [] };
  let scooter = { on: false }, slime = null, bloom = null;
  const T = tw(t);
  if (t < 11.4) {
    // ---------------- STREET
    const z = heroZ(T);
    hero.pos = [P0[0], P0[1], z];
    const zs = scootZ(t);
    scooter = { on: true, pos: [P0[0] + 0.05, P0[1], zs], ry: PI, spin: -t * 18, face: 'idle', light: 1 };
    if (t < 7.0) { const w = walk(T, 1, true); hero.pose = w.pose; hero.hipsY = w.hipsY; hero.face = 'tired'; hero.prop = { R: 'phone' }; if (Math.abs(t - 4.2) < 0.09) hero.face = 'closed'; }
    else if (t < 8.2) {
      const k = sst(7.0, 7.4, T);
      hero.pos[2] = heroZ(7.0) + (T - 7.0) * 0.4;
      hero.pose = mixPose(walk(7.0, 0.5, true).pose, EEK, k); hero.prop = { R: 'phone' };
      hero.face = T < 7.25 ? 'dazed' : 'shock'; hero.idle = T < 7.3;
      if (T > 7.3) fx.sprites.push({ k: 'sweat', rel: [1, 0.2, sst(7.3, 8.1, T)], s: 0.075 });
      scooter.face = 'scared';
    }
    if (t >= 8.2) {
      // run over: Ryo face-down on the sidewalk, legs twitching; scooter on its side, front wheel still spinning
      hero.pos = [P0[0] + 0.05, 0.15, -1.4]; hero.rx = PI / 2; hero.ry = PI + 0.25; hero.pose = SPLAT(t); hero.face = 'closed'; hero.prop = {};
      scooter = { on: true, pos: [P0[0] + 0.75, P0[1] + 0.02, 0.1], ry: PI - 0.9, roll: 1.3, spin: -t * 22, face: 'scared', light: 1 };
      if (t > 8.7) fx.sprites.push(...starsOrbit(t, [P0[0] - 0.05, 0.42, -2.6], 0.3, 3, 0.13));
      if (t > 8.6) fx.sprites.push({ k: 'swirl', p: [P0[0] + 0.8, 0.4, -0.05], s: 0.16 });
    } else if (t < 8.4 && t >= 8.2) { hero.pose = EEK; hero.face = 'shock'; }
  } else if (t < 15.4) {
    hero.on = false;
    for (let i = 0; i < 14; i++) { const a = i * 2.4, r = 0.6 + (i % 5) * 0.35, y = 1 + ((th(t) * 0.4 + i * 0.37) % 2.4); fx.sprites.push({ k: 'spark', p: [Math.cos(a) * r, y, -2 + Math.sin(a) * r], s: 0.12 + 0.08 * Math.sin(th(t) * 6 + i) ** 2 }); }
  } else {
    // ---------------- FIELD: Ryo IS the scooter now
    hero.on = false;
    const gy = (x, z) => groundH(x, z);
    const y0 = gy(0, 0);
    if (t < 18.0) {   // lying on its side in the grass, wakes up
      scooter = { on: true, pos: [0, y0 + 0.22, 0], ry: 0.3, roll: 1.32, face: T < 16.4 ? 'closed' : (Math.abs(T - 17.2) < 0.09 ? 'closed' : 'open'), light: 0 };
      if (T > 16.4 && T < 16.9) fx.sprites.push({ k: 'spark', p: [-0.55, y0 + 0.35, 0.3], s: 0.12 * (1 - sst(16.4, 16.9, T)) + 0.04 });
    } else if (t < 21.0) {   // stands up by itself (hop), looks around: wow
      const k = io(sst(18.3, 18.8, T)), hop = Math.sin(cl((T - 18.7) / 0.35) * PI) * 0.35;
      scooter = { on: true, pos: [0, y0 + lerp(0.22, 0, k) + hop, 0], ry: lerp(0.3, 0.3 + 0.6 * Math.sin(cl((T - 19.4) / 1.4) * PI), sst(19.2, 19.6, T)), roll: lerp(1.32, 0, k), face: T < 18.9 ? 'open' : 'wow', light: 1 };
      if (T > 18.9) for (let i = 0; i < 4; i++) { const a = th(t) * 3 + i * 1.57; fx.sprites.push({ k: 'spark', p: [Math.cos(a) * 0.4, y0 + 1.15 + Math.sin(a) * 0.25, 0.1 + Math.sin(a) * 0.2], s: 0.09 }); }
      
    } else if (t < 27.0) {   // joy ride in a circle, then the battery drains: slows, droops
      const p = ridePos(Math.min(t, 26.0)), a = rideAng(Math.min(t, 26.0));
      const sp = t < 24.5 ? 1 : 1 - sst(24.6, 26.0, t);
      const pct = t < 24.5 ? 100 - 6 * sst(21.0, 24.5, t) : t < 25.6 ? lerp(94, 5, io(sst(24.7, 25.6, t))) : 5;
      scooter = { on: true, pos: [p[0], p[1] + Math.abs(Math.sin(T * 9)) * 0.05 * sp, p[2]], ry: -a, roll: -0.28 * sp, spin: t * 28 * sp,
        face: t < 24.5 ? 'happy' : t < 25.6 ? 'worry' : 'sweat', pct: t >= 24.5 ? pct : null, blinkRed: t > 25.6 && Math.floor(t * 4) % 2 === 0, droop: sst(25.4, 26.6, T) * 0.6, light: 1 };
      bloom = { c: RIDE.c, r: lerp(0, 9, oc((t - 21.2) / 3.4)), w: 1.4, big: true };
      if (t < 24.5) for (let i = 0; i < 3; i++) { const age = (th(t) - 21.2 - i * 0.4) % 1.2; if (age < 0) continue; fx.sprites.push({ k: i % 2 ? 'note' : 'note2', p: [p[0], p[1] + 1.2 + age * 0.8, p[2]], s: 0.22 * sst(0, 0.2, age) * (1 - sst(0.9, 1.2, age)) }); }
    } else {
      const p = ridePos(26.0), a = rideAng(26.0);
      bloom = { c: RIDE.c, r: 9, w: 1.4, big: true };
      scooter = { on: true, pos: [p[0], p[1], p[2]], ry: -a, droop: 0.6, face: 'sweat', pct: 3, blinkRed: Math.floor(t * 4) % 2 === 0, light: 1 };
      const sx = p[0];
      if (t < 29.0) {   // tremor: the Slime King rises behind the ridge; the scooter turns to look
        const k = io(sst(27.3, 28.8, T));
        slime = { on: true, pos: [0, gy(0, SZ) - lerp(17, 0, k), SZ], R: 9.5, sq: 1 + 0.06 * Math.sin(T * 8) * (1 - k), face: 'angry', jig: 0.6 };
        scooter.ry = lerp(-a, PI, io(sst(27.6, 28.1, T))); scooter.face = T < 27.9 ? 'sweat' : 'scared';
        fx.puffs.push(...dustBurst(t, 27.4, [0, gy(0, -31) - 0.3, -31], 14, 10, 1.1));
        scooter.pos[1] += Math.abs(Math.sin(T * 30)) * 0.02;
      } else if (t < 30.3) {   // roar
        slime = { on: true, pos: [0, gy(0, SZ), SZ], R: 9.5, sq: T < 29.4 ? 0.94 : 1.08, face: T < 29.4 ? 'angry' : 'roar', jig: 1 };
        scooter.ry = PI; scooter.face = 'scared';
        if (T > 29.4) fx.sprites.push({ k: 'vein', p: [4.2, gy(0, SZ) + 13.2, SZ + 5], s: 2.2 });
      } else if (t < 31.8) {   // flee! wheels spin, it barely moves; 1% -> 0% -> screen dead
        slime = { on: true, pos: [0, gy(0, SZ), SZ], R: 9.5, sq: 1, face: 'roar', jig: 0.8 };
        const mv = sst(30.4, 31.2, t) * 0.35;
        scooter.ry = 0; scooter.pos[2] = p[2] + mv; scooter.spin = t * 40 * (t < 31.3 ? 1 : 0);
        scooter.pct = t < 31.0 ? 1 : 0; scooter.face = t < 31.4 ? 'scared' : 'dead'; scooter.light = t < 31.4 ? 1 : 0;
        scooter.droop = t < 31.4 ? 0.3 : 0.6 + 0.4 * sst(31.4, 31.7, T);
      } else {   // flop on its side, dead; the Slime King comes close and pokes it, confused
        scooter.ry = 0; scooter.pos[2] = p[2] + 0.35; scooter.face = 'dead'; scooter.light = 0; scooter.pct = null; scooter.droop = 1;
        const kf = io(sst(32.0, 32.3, T)); scooter.roll = lerp(0, 1.3, kf); scooter.pos[1] = p[1] + 0.16 * kf + Math.sin(cl((T - 32.3) / 0.25) * PI) * 0.06;
        const pk = sst(34.2, 34.6, T) * (1 - sst(34.9, 35.3, T)) + sst(35.8, 36.2, T) * (1 - sst(36.5, 36.9, T));
        const SX = sx - 12.3, SZz = p[2] - 7.7;
        slime = { on: true, pos: [SX, gy(SX, SZz) - 1.5, SZz], ry: 1.02, R: 9.5, sq: 1, face: t < 33.4 ? 'roar' : 'confused', jig: 0.3, poke: pk };
        if (t > 33.4) fx.sprites.push({ k: 'sweat', p: [SX + 6.4, gy(SX, SZz) + 12.4, SZz + 5.0], s: 1.6 });
      }
    }
  }
  return { hero, props: {}, scooter, fx, slime, bloom, part: 0 };
}

export function create(ctx) {
  return { update(st) { st.plan = plan(st.t, st); } };
}
