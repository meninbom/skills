// project key points for candidate cameras -> screen px (1080x1920), to frame stills without rendering
import * as THREE from 'three';
const cam = new THREE.PerspectiveCamera(50, 9 / 16, 0.1, 1000);
const pr = (p, t, fov, pts) => { cam.fov = fov; cam.position.set(...p); cam.lookAt(new THREE.Vector3(...t)); cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
  return Object.fromEntries(Object.entries(pts).map(([k, v]) => { const q = new THREE.Vector3(...v).project(cam); return [k, [Math.round((q.x * .5 + .5) * 1080), Math.round((-q.y * .5 + .5) * 1920), q.z < 1 ? '' : 'BEHIND']]; })); };
const DY = 10, SX = 73.5, SZ = 54.5, RX = 83.5, RZ = 68.5;
const wide = { guyFeet: [SX + 0.45, DY, SZ - 1.1], guyHead: [SX + 0.45, DY + 1.2, SZ - 1.1], device: [SX + 0.5, DY + 0.4, SZ - 0.4], rocketTop: [RX, DY + 2 + 30 + 10, RZ], rocketBase: [RX, DY + 1, RZ], finL: [RX - 6, DY + 2, RZ], finR: [RX + 6, DY + 2, RZ] };
for (const [p, t, f] of [[[SX - 3, DY + 2.4, SZ - 12], [RX - 2.5, DY + 12.5, RZ], 62], [[SX - 6, DY + 1.2, SZ - 22], [RX - 3, DY + 16, RZ], 58], [[SX - 4, DY + 0.9, SZ - 20], [RX - 4.5, DY + 17, RZ], 62], [[SX - 2.5, DY + 0.8, SZ - 9], [RX - 4, DY + 18, RZ], 74]])
  console.log('WIDE', JSON.stringify(p), JSON.stringify(t), f, JSON.stringify(pr(p, t, f, wide)));
const ice = { guyFeet: [81.1, 10, 44.9], guyHead: [81.1, 11.6, 44.9], sign: [81.6, 11.4, 41.9], cabin: [97, 14, 52], cabinR: [102, 14, 52] };
for (const [p, t, f] of [[[77, 11.6, 35], [83.5, 11.0, 47.5], 52], [[76.5, 11.4, 34.5], [82.8, 11.2, 46.5], 50], [[78.0, 11.5, 36.0], [82.4, 11.0, 46.0], 50]])
  console.log('ICE', JSON.stringify(p), JSON.stringify(t), f, JSON.stringify(pr(p, t, f, ice)));
const sx = SX + 0.45, sz = SZ - 1.12;
const ots = { head: [sx, DY + 1.55, sz], shoulder: [sx, DY + 1.25, sz], rocketTop: [RX, DY + 42, RZ], rocketBase: [RX, DY + 1, RZ], device: [SX + 0.5, DY + 0.4, SZ - 0.4] };
for (const [p, t, f] of [[[sx + 0.9, DY + 1.25, sz - 2.2], [RX - 1.5, DY + 19, RZ], 62], [[sx + 1.1, DY + 1.1, sz - 2.6], [RX - 1, DY + 20, RZ], 66], [[sx + 0.8, DY + 1.0, sz - 2.0], [RX - 2, DY + 18, RZ], 70]])
  console.log('OTS', JSON.stringify(p), JSON.stringify(t), f, JSON.stringify(pr(p, t, f, ots)));
for (const [back, off, h, ty, f] of [[2.2, 0.5, 1.3, 19, 66], [2.6, 0.55, 1.15, 20, 64], [3.0, 0.7, 1.2, 19, 62], [2.4, 0.45, 1.0, 21, 68]]) {
  const d = [0.534, 0.845], q = [0.845, -0.534]; const p = [sx - back * d[0] + off * q[0], DY + h, sz - back * d[1] + off * q[1]];
  console.log('OTS2', back, off, h, ty, f, JSON.stringify(pr(p, [RX, DY + ty, RZ], f, ots)));
}
const st = { feet: [sx, DY, sz], head: [sx, DY + 1.62, sz], rocketTop: [RX, DY + 42, RZ], rocketBase: [RX, DY + 1, RZ], noseStart: [RX, DY + 32, RZ] };
for (const [back, off, h, ty, f] of [[5, 0.8, 0.6, 14, 70], [6, 1.0, 0.5, 15, 74], [4, 0.6, 0.45, 15, 78], [7, 1.2, 0.7, 14, 70]]) {
  const d = [0.534, 0.845], q = [0.845, -0.534]; const p = [sx - back * d[0] + off * q[0], DY + h, sz - back * d[1] + off * q[1]];
  console.log('LOW', back, off, h, ty, f, JSON.stringify(p.map(v => +v.toFixed(2))), JSON.stringify(pr(p, [RX, DY + ty, RZ], f, st)));
}
const dv = { label: [SX + 0.5, DY + 0.30, SZ - 0.1], devBottom: [SX + 0.5, DY, SZ - 0.1], head: [SX + 0.45, DY + 1.25, SZ - 1.2], chin: [SX + 0.45, DY + 0.82, SZ - 1.1] };
for (const [p, t, f] of [[[SX + 0.25, DY + 1.25, SZ + 2.5], [SX + 0.45, DY + 0.66, SZ - 0.9], 44], [[SX + 0.25, DY + 1.55, SZ + 2.4], [SX + 0.45, DY + 0.38, SZ - 0.9], 44], [[SX + 0.25, DY + 1.7, SZ + 2.2], [SX + 0.45, DY + 0.3, SZ - 0.9], 46]])
  console.log('CLOSE', JSON.stringify(p.map(v=>+v.toFixed(2))), JSON.stringify(t), f, JSON.stringify(pr(p, t, f, dv)));
const ic = { feet: [81.1, 10, 44.9], head: [81.1, 11.55, 44.9], signTop: [81.6, 11.8, 41.9], signBot: [81.6, 10.9, 41.9] };
for (const [p, t, f] of [[[79.0, 11.4, 39.2], [81.6, 10.7, 46.0], 50], [[78.6, 11.6, 38.6], [81.4, 10.6, 46.0], 50], [[79.4, 11.5, 39.6], [81.3, 10.8, 46.0], 52]])
  console.log('ICE2', JSON.stringify(p), JSON.stringify(t), f, JSON.stringify(pr(p, t, f, ic)));
