// direction/late.js - PATINETE cameras (on ones, after the departments so they can frame Ryo / the scooter) + LOOKS.
import * as THREE from 'three';
import { cl, lerp, sst, io, oc, tw, heroZ, scootZ, P0, ridePos, rideAng, RIDE, SZ } from './main.js';
import { groundH } from '../field.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const noise1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };
function shake(t, amp, freq = 18) { return V(noise1(t * freq) * amp, noise1(t * freq + 37) * amp, noise1(t * freq + 71) * amp * 0.5); }

export function create(ctx) {
  const H = () => ctx.api.hero, SC = () => ctx.api.scooter;
  const y0 = groundH(0, 0);
  const cams = {
    s01: (lt, d, t) => { const z = heroZ(t); return { pos: V(-3.55, 0.6, z + 4.6 - lt * 0.25), look: V(-4.55, 2.2, z - 6), fov: 50 }; },
    s02: (lt, d, t) => { const h = H().anchor('head'); return { pos: h.clone().add(V(0.22, -0.2, 1.0 - lt * 0.1)), look: h.clone().add(V(0, -0.1, 0)), fov: 32 }; },
    // low on the sidewalk behind Ryo's heels, looking down the street: the scooter grows toward us
    s03: (lt, d, t) => { const z = heroZ(t); return { pos: V(-4.15, 0.28, z + 1.2).add(shake(t, 0.004 + 0.01 * lt)), look: V(-4.6, 0.55, z + 12), fov: 15 }; },
    s04: (lt, d, t) => { const h = H().anchor('head'); const k = oc(sst(0.35, 0.5, lt)); return { pos: h.clone().add(V(0.18, -0.05 + 0.02 * k, 0.95 - 0.3 * k)).add(shake(t, 0.008 * k)), look: h.clone().add(V(0, -0.02, 0)), fov: lerp(34, 30, k) }; },
    s05: (lt, d, t) => ({ pos: V(-2.2, 1.0, 2.2), look: V(-4.6, 0.9, 0.3), fov: 50 }),
    s06: (lt, d, t) => ({ pos: V(-3.0 - lt * 0.04, 3.7 - lt * 0.08, 1.9 - lt * 0.1).add(shake(t, 0.08 * Math.exp(-lt * 3))), look: V(-4.45, 0.1, -0.85), fov: 40 }),
    s07: () => ({ pos: V(0, 1.6, 3), look: V(0, 1.6, -2), fov: 45 }),
    // top-down-ish close on the display lying in the grass
    s08: (lt, d, t) => { const s = SC().anchor('screen'), n = SC().normal(); return { pos: s.clone().add(n.multiplyScalar(0.62 - lt * 0.04)).add(V(0, 0.18, 0)), look: s.clone(), fov: 34, roll: +(ctx.q.get('r8') ?? -72) }; },
    s09: (lt, d, t) => { const k = io(sst(0.9, 2.8, lt)); const a = lerp(Math.PI - 0.25, 0.3, k), R = lerp(1.5, 3.4, k);
      const c = V(Math.sin(a) * R, y0 + lerp(0.85, 1.35, k), Math.cos(a) * R); const L = V(0, y0 + 0.8, 0).lerp(V(-18, y0 + 5, -150), k * k);
      return { pos: c, look: L, fov: lerp(40, 52, k) }; },
    s10: (lt, d, t) => { const p = ridePos(t); return { pos: V(RIDE.c[0] + 2.6, y0 + 1.25, RIDE.c[1] + 5.0), look: V(p[0], p[1] + 0.45, p[2]), fov: 42 }; },
    s11: (lt, d, t) => { const s = SC().anchor('screen'), n = SC().normal(); n.y = 0; n.normalize(); const k = io(sst(0, 1.2, lt));
      return { pos: s.clone().add(n.multiplyScalar(lerp(1.4, 0.62, k))).add(V(0, lerp(0.25, 0.06, k), 0)), look: s.clone().add(V(0, lerp(-0.25, 0, k), 0)), fov: 34 }; },
    s12: (lt, d, t) => { const p = ridePos(26); const k = io(sst(0.3, 1.8, lt)); const c = V(p[0] + 0.7, p[1] + 0.75, p[2] + 2.3);
      const a = V(p[0], p[1] + 0.75, p[2]), b = V(0, groundH(0, SZ) + 7.5, SZ); return { pos: c.add(shake(t, 0.025 * sst(0.1, 0.4, lt))), look: a.lerp(b, k * 0.92), fov: 50 }; },
    s13: (lt, d, t) => ({ pos: V(1.4, y0 + 6.2, -18.5 - lt * 0.8).add(shake(t, t > 29.4 ? 0.12 : 0.03)), look: V(0, y0 + 7.6, -34), fov: 42 }),
    s14: (lt, d, t) => { const s = SC().anchor('screen'); return { pos: s.clone().add(V(0.35, 0.05, -0.75)).add(shake(t, 0.006)), look: s.clone().add(V(0, -0.12, 0)), fov: 36 }; },
    s15: (lt, d, t) => { const p = ridePos(26); return { pos: V(p[0] + 1.0, p[1] + 1.5, p[2] + 1.6), look: V(p[0] - 0.1, p[1] + 0.2, p[2] + 0.3), fov: 42 }; },
    s16: (lt, d, t) => { const p = ridePos(26); const k = io(sst(1.2, 4.8, lt)); const dx = -0.85, dz = -0.53, nx = 0.53, nz = -0.85;
      const c0 = V(p[0] - dx * 1.5 + nx * 0.25, p[1] + 1.35, p[2] - dz * 1.5 + nz * 0.25), c1 = V(p[0] + nx * 5 - dx * 5, p[1] + 6.5, p[2] + nz * 5 - dz * 5);
      const l0 = V(p[0] + dx * 3, p[1] + 1.0, p[2] + dz * 3), l1 = V(p[0] + dx * 5, p[1] + 2.5, p[2] + dz * 5);
      return { pos: c0.lerp(c1, k), look: l0.lerp(l1, k), fov: lerp(62, 56, k) }; },
  };
  return {
    update(st) {
      if (st.test && st.q.has('cam')) return;
      const f = cams[st.sid]; if (!f) return;
      const c = f(st.lt, st.dur, st.t, st);
      st.cam.pos = c.pos; st.cam.look = c.look; st.cam.fov = c.fov; st.cam.roll = c.roll ?? 0;
      st.cam.near = c.near ?? 0.03; st.cam.far = 6000;
    },
  };
}

const imp = (t, t0) => (t >= t0 && t < t0 + 0.1 ? 1 : t >= t0 + 0.1 && t < t0 + 0.2 ? 2 : 0);
export const LOOKS = {
  s02: { key: { dir: [0.05, -0.15, 1], color: '#d4ecff', tint: 0.35 } },
  s03: (lt, d, t) => ({ speed: lt > 0.6 ? { amount: 0.6 + 0.6 * sst(0.6, 1.8, lt), centre: [0.5, 0.56] } : 0 }),
  s04: (lt, d, t) => ({ key: { color: '#9a9ed8', tint: 0.5 }, speed: lt > 0.4 ? { amount: 1.0, centre: [0.5, 0.5] } : 0 }),
  s05: (lt, d, t) => ({ impact: imp(t, 8.2), impactCentre: [0.55, 0.5] }),
  s06: (lt, d, t) => ({ fade: sst(2.4, 3.0, lt), fadeColor: '#ffffff' }),
  s07: (lt, d, t) => ({ fade: 0.55, fadeColor: '#ffffff', softBloom: 0.5 }),
  s08: (lt, d, t) => ({ fade: 1 - sst(0.0, 0.7, lt), fadeColor: '#ffffff' }),
  s10: (lt, d, t) => ({ speed: { amount: 0.45, centre: [0.5, 0.6] } }),
  s12: { key: { dir: [0.3, 0.6, -0.75] } },
  s13: (lt, d, t) => ({ speed: t > 29.4 ? { amount: 1.1, centre: [0.5, 0.42] } : 0, impact: t >= 29.4 && t < 29.47 ? 1 : 0, impactCentre: [0.5, 0.42] }),
  s14: (lt, d, t) => ({ speed: t < 31.3 ? { amount: 0.8, centre: [0.5, 0.5] } : 0, flash: t > 31.4 && t < 31.45 ? 0.3 : 0 }),
  s16: { key: { dir: [0.3, 0.6, -0.75] } },
};
