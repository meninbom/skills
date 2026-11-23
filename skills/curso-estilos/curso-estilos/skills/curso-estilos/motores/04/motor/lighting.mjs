// Light rig shared by the CPU bake (Node) and the renderer (browser imports this same module).
// All intensities are in "irradiance / pi" units so lambert = albedo * value.
import { CABIN } from './world.mjs';

const nrm = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
export const L = {
  moonDir: nrm([-0.62, 0.58, 0.56]),           // points TO the moon (behind the cabin, screen-right)
  moonCol: [0.075, 0.100, 0.165],
  skyZen: [0.0012, 0.0036, 0.021],
  skyHor: [0.014, 0.030, 0.072],
  aurora: [0.003, 0.030, 0.015],
  interior: [97.5, 14.7, 55.5],                 // warm hearth/lamp inside the cabin
  interiorR: 0.9,
  beamI: [200.0, 86.0, 22.0],
  paneLe: [4.2, 1.9, 0.55],
  lantern: [98.6, 13.15, CABIN.z0 - 0.62],
  lantCol: [1.5, 0.72, 0.2],
  posts: [[80.2, 13.45, 31.6], [90.4, 13.45, 35.6]],   // lantern posts along the footpath (base on the snow at y=12)
  fox: [88.8, 11.0, 40.4],
  stump: [91.5, 13.0, 40.5],
  windows: [
    { axis: 2, plane: CABIN.z0, a0: 93, a1: 95, y0: 12, y1: 14 },
    { axis: 2, plane: CABIN.z0, a0: 99, a1: 101, y0: 12, y1: 14 },
    { axis: 0, plane: CABIN.x0, a0: 54, a1: 56, y0: 12, y1: 14 },
    { axis: 0, plane: CABIN.x0, a0: 57, a1: 59, y0: 12, y1: 14 },
  ],
};

export function skyRad(dx, dy, dz) {
  if (dy < 0) return [L.skyHor[0] * 0.5, L.skyHor[1] * 0.5, L.skyHor[2] * 0.5];
  const t = Math.pow(dy, 0.5);
  const el = Math.asin(Math.min(1, dy)), az = Math.atan2(dx, dz);
  const a = Math.exp(-(((el - 0.55) / 0.32) ** 2)) * Math.exp(-((az / 1.1) ** 2));
  return [0, 1, 2].map(i => L.skyHor[i] + (L.skyZen[i] - L.skyHor[i]) * t + L.aurora[i] * a);
}

const sat = x => Math.min(1, Math.max(0, x));
// Warm light from the interior lamp passing through the window openings (crisp frame/mullion shadows,
// penumbra growing with distance). Returns [r,g,b, distance from p to the window plane along the ray].
export function beamAt(px, py, pz, n) {
  const Lp = L.interior;
  for (const w of L.windows) {
    const pa = w.axis === 2 ? pz : px, La = w.axis === 2 ? Lp[2] : Lp[0];
    if (!(pa < w.plane - 0.002 && La > w.plane)) continue;
    const s = (w.plane - pa) / (La - pa);
    const qx = px + s * (Lp[0] - px), qy = py + s * (Lp[1] - py), qz = pz + s * (Lp[2] - pz);
    const qa = w.axis === 2 ? qx : qz;
    const dl = Math.hypot(Lp[0] - px, Lp[1] - py, Lp[2] - pz);
    const pen = Math.min(1.5, Math.max(0.02, L.interiorR * (s * dl) / ((1 - s) * dl)));
    const fr = 0.1, bw = 0.06;
    const inside = sat((qa - w.a0 - fr) / pen + 0.5) * sat((w.a1 - fr - qa) / pen + 0.5) * sat((qy - w.y0 - fr) / pen + 0.5) * sat((w.y1 - fr - qy) / pen + 0.5);
    if (inside <= 0) continue;
    const ma = (w.a0 + w.a1) / 2, my = (w.y0 + w.y1) / 2;
    const T = inside * sat((Math.abs(qa - ma) - bw) / pen + 0.5) * sat((Math.abs(qy - my) - bw) / pen + 0.5);
    const lx = (Lp[0] - px) / dl, ly = (Lp[1] - py) / dl, lz = (Lp[2] - pz) / dl;
    const c = Math.max(0, lx * n[0] + ly * n[1] + lz * n[2]);
    const e = T * c / (dl * dl);
    return [L.beamI[0] * e, L.beamI[1] * e, L.beamI[2] * e, s * dl];
  }
  return [0, 0, 0, 0];
}
