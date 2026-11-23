// city.js - set STREET (ours): an ordinary residential-commercial street, late morning. Street along z, left sidewalk
// x -6..-3.5 (Taku walks at x -4.6), road -3.5..3.5, right sidewalk 3.5..6. Facades painted in canvas (window bays,
// AC units, signs), utility poles with sagging wires, vending machine, traffic mirror, crosswalk, cumulus.
// The piano building: left, z -5..5, 19 m, beam + pulley at y 15.6 over P = (-4.6, 0, 0).
import * as THREE from 'three';
import { canvasTex, mulb, puffs, cumulusList, cloudMaterial, taperTube, mergeGeos } from './lib.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;

// window-bay facade tile: 4 m wide x 3 m tall per tile (u, v in tiles)
function facadeTex(seed, o = {}) {
  return canvasTex(256, 192, (x, w, h) => {
    const r = mulb(seed);
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) { x.fillStyle = `rgba(${190 + r() * 50 | 0},${185 + r() * 50 | 0},${190 + r() * 50 | 0},0.18)`; x.beginPath(); x.ellipse(r() * w, r() * h, 8 + r() * 30, 5 + r() * 14, 0, 0, TAU); x.fill(); }
    // floor band
    x.fillStyle = 'rgba(120,110,140,0.35)'; x.fillRect(0, h - 12, w, 12);
    x.fillStyle = 'rgba(255,255,255,0.5)'; x.fillRect(0, h - 14, w, 2);
    // window
    const ww = o.wide ? w * 0.7 : w * 0.46, wh = h * 0.48, wx = (w - ww) / 2, wy = h * 0.18;
    x.fillStyle = '#4a5478'; x.fillRect(wx - 5, wy - 5, ww + 10, wh + 10);
    const g = x.createLinearGradient(wx, wy, wx + ww, wy + wh); g.addColorStop(0, '#bcd6f2'); g.addColorStop(0.5, '#7f9cc8'); g.addColorStop(1, '#5a6c9e');
    x.fillStyle = g; x.fillRect(wx, wy, ww, wh);
    x.fillStyle = 'rgba(255,255,255,0.55)'; x.beginPath(); x.moveTo(wx + ww * 0.1, wy + wh); x.lineTo(wx + ww * 0.35, wy); x.lineTo(wx + ww * 0.5, wy); x.lineTo(wx + ww * 0.25, wy + wh); x.fill();
    if (r() < 0.55) { x.fillStyle = ['#f4e6c8', '#e8d0e0', '#d8e8d0'][Math.floor(r() * 3)]; x.fillRect(wx, wy, ww * (0.25 + r() * 0.3), wh); }
    x.strokeStyle = '#3a3a58'; x.lineWidth = 3; x.strokeRect(wx, wy, ww, wh); x.beginPath(); x.moveTo(wx + ww / 2, wy); x.lineTo(wx + ww / 2, wy + wh); x.stroke();
    // sill
    x.fillStyle = '#e8e4ee'; x.fillRect(wx - 8, wy + wh + 5, ww + 16, 5);
    // AC unit / laundry pole
    if (r() < 0.5) { const ax = r() < 0.5 ? wx - 46 : wx + ww + 10; x.fillStyle = '#eeeef2'; x.fillRect(ax, wy + wh - 30, 36, 28); x.strokeStyle = '#4a4a66'; x.lineWidth = 2; x.strokeRect(ax, wy + wh - 30, 36, 28); x.beginPath(); x.arc(ax + 18, wy + wh - 16, 9, 0, TAU); x.stroke(); }
    // rain stains
    for (let i = 0; i < 3; i++) { const sx = r() * w, gg = x.createLinearGradient(0, wy + wh, 0, h); gg.addColorStop(0, 'rgba(110,100,130,0.25)'); gg.addColorStop(1, 'rgba(110,100,130,0)'); x.fillStyle = gg; x.fillRect(sx, wy + wh + 10, 4 + r() * 6, h * 0.3); }
  });
}
function shopTex(seed, sign) {   // ground floor shop front (one tile 8 m x 3.2 m)
  return canvasTex(512, 204, (x, w, h) => {
    const r = mulb(seed);
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
    x.fillStyle = sign; x.fillRect(0, 8, w, 46);
    x.fillStyle = 'rgba(255,255,255,0.9)'; for (let i = 0; i < 5; i++) x.fillRect(40 + i * 46 + r() * 10, 18, 26 + r() * 10, 26);
    x.strokeStyle = '#3a3050'; x.lineWidth = 3; x.strokeRect(1, 8, w - 2, 46);
    // awning stripes
    for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#ffffff' : sign; x.beginPath(); x.moveTo(i * 32, 54); x.lineTo(i * 32 + 32, 54); x.lineTo(i * 32 + 28, 76); x.lineTo(i * 32 - 4, 76); x.fill(); }
    x.strokeStyle = '#3a3050'; x.beginPath(); x.moveTo(0, 76); x.lineTo(w, 76); x.stroke();
    // glass + goods
    const g = x.createLinearGradient(0, 80, 0, h); g.addColorStop(0, '#5a6890'); g.addColorStop(1, '#8aa0c8'); x.fillStyle = g; x.fillRect(20, 84, w - 40, h - 92);
    for (let i = 0; i < 14; i++) { x.fillStyle = ['#f0c060', '#e07070', '#70b0e0', '#f0f0f0', '#90d090'][Math.floor(r() * 5)]; x.fillRect(30 + r() * (w - 80), 120 + r() * 50, 14 + r() * 20, 12 + r() * 20); }
    x.fillStyle = 'rgba(255,255,255,0.45)'; x.beginPath(); x.moveTo(80, h - 8); x.lineTo(150, 84); x.lineTo(190, 84); x.lineTo(120, h - 8); x.fill();
    x.strokeStyle = '#2e2a44'; x.lineWidth = 4; x.strokeRect(20, 84, w - 40, h - 92); x.beginPath(); x.moveTo(w / 2, 84); x.lineTo(w / 2, h - 8); x.stroke();
  });
}
function roadTex() {   // 7 m x 8 m tile: asphalt dabs + dashed centre line
  return canvasTex(256, 256, (x, w, h) => {
    const r = mulb(9);
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) { const v = 200 + r() * 55 | 0; x.fillStyle = `rgba(${v},${v},${v + 8},0.35)`; x.fillRect(r() * w, r() * h, 2 + r() * 8, 1 + r() * 3); }
    for (let i = 0; i < 6; i++) { x.strokeStyle = 'rgba(90,90,110,0.35)'; x.lineWidth = 1.5; x.beginPath(); let px = r() * w, py = r() * h; x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (r() - 0.5) * 30; py += (r() - 0.5) * 30; x.lineTo(px, py); } x.stroke(); }
    x.fillStyle = '#fffbe8'; x.fillRect(w / 2 - 3, 0, 6, h * 0.55);
    x.fillStyle = '#fffbe8'; x.fillRect(6, 0, 4, h); x.fillRect(w - 10, 0, 4, h);
  });
}
function pavingTex() {   // 1 m tiles
  return canvasTex(128, 128, (x, w, h) => {
    const r = mulb(13);
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 80; i++) { const v = 215 + r() * 40 | 0; x.fillStyle = `rgba(${v},${v - 5},${v - 10},0.4)`; x.fillRect(r() * w, r() * h, 3 + r() * 10, 2 + r() * 6); }
    x.strokeStyle = 'rgba(110,100,120,0.55)'; x.lineWidth = 2; x.strokeRect(1, 1, w - 2, h - 2); x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.stroke();
  });
}
// box with uvs in tiles of (tw, th) metres on every face
function tiledBox(sx, sy, sz, tw, th) {
  const g = new THREE.BoxGeometry(sx, sy, sz), uv = g.attributes.uv;
  const dims = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / tw, uv.getY(i) * dims[f][1] / th); }
  return g;
}

export function create(ctx) {
  const { A } = ctx, G = ctx.sets.STREET, rng = mulb(2024);
  const ID = A.ID;
  // ground
  const road = new THREE.Mesh(new THREE.PlaneGeometry(7, 400).rotateX(-Math.PI / 2), A.paintedMaterial({ color: '#8a8ea6', color2: '#7a7e98', shade: '#5a5a80', map: roadTex(), id: ID.GROUND, varScale: 0.2, varAmt: 0.3, dab: 0.2, blob: true }));
  { const uv = road.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i) * 50); }
  road.position.set(0, 0, -100); G.add(road);
  const pave = A.paintedMaterial({ color: '#d8d0c6', color2: '#cfc4c0', shade: '#8a86a8', map: pavingTex(), id: ID.GROUND, varScale: 0.3, varAmt: 0.3, dab: 0.2, blob: true });
  for (const s of [-1, 1]) {
    const g = new THREE.PlaneGeometry(2.5, 400).rotateX(-Math.PI / 2); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2.5, uv.getY(i) * 400);
    const m = new THREE.Mesh(g, pave); m.position.set(s * 4.75, 0.12, -100); G.add(m);
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 400), A.paintedMaterial({ color: '#e4e0e4', shade: '#8a88aa', id: ID.PAINT, varAmt: 0.2 }));
    curb.position.set(s * 3.55, 0.06, -100); G.add(curb);
  }
  // crosswalk
  for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 3.2).rotateX(-Math.PI / 2), A.paintedMaterial({ color: '#f6f4ee', shade: '#a8a8c8', id: ID.GROUND, varAmt: 0.2 })); m.position.set(-2.7 + i * 1.08, 0.01, -26); G.add(m); }

  // buildings
  const walls = ['#f1e4cf', '#f3d4c8', '#d3dcea', '#d6e6d4', '#efe8dc', '#e8d8ea', '#f4ecd0'];
  const facades = [0, 1, 2, 3].map((i) => facadeTex(100 + i, { wide: i % 2 === 1 }));
  const shops = [['#d8504a', 201], ['#3a7ac8', 202], ['#e8a030', 203], ['#4aa070', 204]].map(([c, s]) => shopTex(s, c));
  const building = (side, z0, z1, h, k, shop) => {
    const d = 12, wz = z1 - z0, cx = side * (6 + d / 2), cz = (z0 + z1) / 2;
    const mat = A.paintedMaterial({ color: walls[k % walls.length], color2: walls[(k + 3) % walls.length], shade: '#8f8ab8', map: facades[k % 4], id: ID.PAINT, varScale: 0.08, varAmt: 0.25, dab: 0.2, rim: 0.4, rimColor: '#fff6e0' });
    const b = new THREE.Mesh(tiledBox(d, h, wz - 0.3, 4, 3), mat); b.position.set(cx, h / 2 + 3.2, cz); G.add(b);
    // ground floor shop / entrance
    const gm = A.paintedMaterial({ color: '#ffffff', shade: '#8a86b0', map: shop ? shops[k % 4] : facades[(k + 1) % 4], id: ID.PAINT, varAmt: 0.15, dab: 0.15 });
    const gf = new THREE.Mesh(tiledBox(d, 3.2, wz - 0.3, shop ? Math.max(4, wz - 0.3) : 4, 3.2), gm); gf.position.set(cx, 1.6, cz); G.add(gf);
    // parapet + roof stuff
    const par = new THREE.Mesh(new THREE.BoxGeometry(d + 0.3, 0.5, wz), A.paintedMaterial({ color: '#c8c4d8', shade: '#7a76a0', id: ID.PAINT, varAmt: 0.2 })); par.position.set(cx, h + 3.45, cz); G.add(par);
    if (rng() < 0.6) { const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.6, 12), A.paintedMaterial({ color: '#dcdce8', shade: '#8080a8', id: ID.PAINT })); tank.position.set(cx - side * 2, h + 4.5, cz + (rng() - 0.5) * wz * 0.5); G.add(tank); }
    // vertical sign
    if (shop && rng() < 0.8) {
      const sg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.6, 0.9), A.celMaterial({ base: ['#f4f0e0', '#ffd860', '#e8f0ff'][k % 3], id: ID.PROP + 2, highlight: 0.2 }));
      sg.position.set(side * 5.8, 5.6, z1 - 1); G.add(sg);
    }
  };
  let z = 22, k = 0;
  while (z > -170) { const wz = 6 + Math.floor(rng() * 4) * 2; const pianoB = z > 5 && z - wz < -5; if (!(z - wz < 5 && z > -5)) building(-1, z - wz, z, 9 + Math.floor(rng() * 4) * 3, k, rng() < 0.6); z -= wz; k++; }
  z = 22; k = 3;
  while (z > -170) { const wz = 6 + Math.floor(rng() * 4) * 2; building(1, z - wz, z, 9 + Math.floor(rng() * 4) * 3, k, rng() < 0.6); z -= wz; k++; }
  // the piano building (left, z -5..5) - taller, brick-red, beam + pulley + open window
  {
    const h = 15.8;
    const mat = A.paintedMaterial({ color: '#e9c6b0', color2: '#e0b8a8', shade: '#8a80b0', map: facades[0], id: ID.PAINT, varScale: 0.08, varAmt: 0.25, dab: 0.2, rim: 0.4, rimColor: '#fff6e0' });
    const b = new THREE.Mesh(tiledBox(12, h, 10, 4, 3), mat); b.position.set(-12, h / 2 + 3.2, 0); G.add(b);
    const gm = A.paintedMaterial({ color: '#ffffff', shade: '#8a86b0', map: shops[1], id: ID.PAINT, varAmt: 0.15, dab: 0.15 });
    const gf = new THREE.Mesh(tiledBox(12, 3.2, 10, 10, 3.2), gm); gf.position.set(-12, 1.6, 0); G.add(gf);
    const par = new THREE.Mesh(new THREE.BoxGeometry(12.3, 0.6, 10.2), A.paintedMaterial({ color: '#c8b8c8', shade: '#7a76a0', id: ID.PAINT })); par.position.set(-12, h + 3.5, 0); G.add(par);
    // open double window (dark interior) under the beam
    const win = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.4).rotateY(Math.PI / 2), A.celMaterial({ base: '#3a3658', shade: '#26243c', id: ID.PROP + 3, highlight: 0 }));
    win.position.set(-5.98, 15.2, 0); G.add(win);
    const iron = A.celMaterial({ base: '#5a5a74', shade: '#2e2e44', id: ID.PROP + 4, highlight: 0.5, rimColor: '#ffe8c8' });
    const beam = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.22, 0.22), iron); beam.position.set(-5.4, 17.0, 0); G.add(beam);
    const brace = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.12), iron); brace.position.set(-5.5, 16.4, 0); brace.rotation.z = 0.6; G.add(brace);
    const pulley = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 18), iron); pulley.position.set(-4.6, 16.78, 0); G.add(pulley);
    ctx.api.cityPulley = V3(-4.6, 16.62, 0);
  }

  // utility poles + wires (right sidewalk, every 11 m) and a few on the left
  const conc = A.celMaterial({ base: '#d8d2ca', shade: '#9896b4', id: ID.PROP + 5, highlight: 0.1, rimColor: '#fff4e0' });
  const dark = A.celMaterial({ base: '#4a4a5e', shade: '#2a2a3a', id: ID.PROP + 6, highlight: 0.2 });
  const poleTops = [];
  for (let i = 0; i < 18; i++) {
    const pz = 14 - i * 11, px = 3.9;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 11, 10), conc); p.position.set(px, 5.5, pz); G.add(p);
    for (const yy of [9.6, 8.6]) { const cb = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.1), dark); cb.position.set(px - 0.3, yy, pz); G.add(cb); }
    if (i % 2 === 0) { const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.9, 12), A.celMaterial({ base: '#9aa0b0', shade: '#5a5e7a', id: ID.PROP + 7, highlight: 0.4 })); tr.position.set(px + 0.45, 7.6, pz); G.add(tr); }
    poleTops.push(pz);
  }
  const wireParts = [];
  for (let i = 0; i < poleTops.length - 1; i++) {
    for (const [dx, yy] of [[-1.1, 9.62], [-0.3, 9.62], [0.5, 9.62], [-0.9, 8.62], [0.3, 8.62]]) {
      const a = V3(3.9 + dx, yy, poleTops[i]), b = V3(3.9 + dx, yy, poleTops[i + 1]), m = a.clone().lerp(b, 0.5); m.y -= 0.55;
      wireParts.push({ geo: taperTube([a, a.clone().lerp(m, 0.6).setY(lerpY(a.y, m.y, 0.85)), m, b.clone().lerp(m, 0.6).setY(lerpY(b.y, m.y, 0.85)), b], 0.018, 0.018, 4, 14) });
    }
    // service drops across the street to the left buildings
    if (i % 2 === 1) { const a = V3(3.3, 8.6, poleTops[i]), b = V3(-6, 7.4, poleTops[i] - 3), m = a.clone().lerp(b, 0.5); m.y -= 0.6; wireParts.push({ geo: taperTube([a, m, b], 0.014, 0.014, 4, 10) }); }
  }
  // wire from the piano building across the street (the wires the piano will fall past)
  wireParts.push({ geo: taperTube([V3(3.3, 9.6, 2.5), V3(-1, 9.0, 1.4), V3(-6, 10.5, 0.2)], 0.016, 0.016, 4, 12) });
  G.add(new THREE.Mesh(mergeGeos(wireParts), A.celMaterial({ base: '#2e2e3e', shade: '#1a1a26', id: ID.PROP + 8, highlight: 0, flat: true })));
  function lerpY(a, b, k) { return a + (b - a) * k; }

  // vending machine + traffic mirror near P
  {
    const vm = new THREE.Group(); vm.position.set(-5.55, 0.12, 3.4); vm.rotation.y = Math.PI / 2; G.add(vm);
    vm.add(new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.8, 0.75).translate(0, 0.9, 0), A.celMaterial({ base: '#d8343a', shade: '#8a1e32', id: ID.PROP + 9, highlight: 0.4 })));
    const pan = canvasTex(128, 160, (x, w, h) => { x.fillStyle = '#e8f2ff'; x.fillRect(0, 0, w, h); const cs = ['#f0c040', '#40a0e0', '#e05050', '#60c060', '#f08030', '#a060d0']; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { x.fillStyle = cs[(r * 4 + c) % 6]; x.fillRect(10 + c * 28, 14 + r * 44, 18, 30); x.strokeStyle = '#2a2a40'; x.lineWidth = 2; x.strokeRect(10 + c * 28, 14 + r * 44, 18, 30); x.fillStyle = '#2a2a40'; x.fillRect(10 + c * 28, 48 + r * 44, 18, 4); } }, { clamp: true });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.95), A.celMaterial({ base: '#ffffff', id: ID.PROP + 10, map: pan, flat: true, emissive: '#ffffff', emissiveAmt: 0.15 }));
    p.position.set(-0.05, 1.25, 0.38); vm.add(p);
    const mp = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 8), A.celMaterial({ base: '#f08a30', shade: '#a8482a', id: ID.PROP + 11 })); mp.position.set(3.7, 1.6, -9); G.add(mp);
    const mr = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 20).rotateX(Math.PI / 2), A.celMaterial({ base: '#f08a30', shade: '#a8482a', id: ID.PROP + 11 })); mr.position.set(3.55, 3.2, -9); mr.rotation.y = -0.6; G.add(mr);
    const mf = new THREE.Mesh(new THREE.CircleGeometry(0.38, 20), A.celMaterial({ base: '#cfe0f4', shade: '#8aa0c8', id: ID.PROP + 12, highlight: 0.9, hiSize: 0.9 })); mf.position.set(3.52, 3.2, -8.94); mf.rotation.y = -0.6; G.add(mf);
    // potted plants by the shop door
    for (const [px, pz] of [[-5.7, -3.2], [-5.7, -4.2]]) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.4, 12), A.celMaterial({ base: '#c8784a', shade: '#8a4a3a', id: ID.PROP + 13 })); pot.position.set(px, 0.32, pz); G.add(pot);
    }
    const leaf = A.cardMaterial({ map: A.foliageAtlas({ kind: 'leaf', seed: 31 }), cells: 4, ramp: ['#2a4a50', '#3f7a52', '#7ab45a', '#d8eea0'], alt: '#fff0a0', altAmt: 0.4, ink: '#18302a', sway: 0.02, id: ID.STROKE });
    G.add(A.cardInstances(leaf, A.foliageItems(rng, [{ c: V3(-5.7, 0.85, -3.2), r: V3(0.35, 0.4, 0.35), n: 14 }, { c: V3(-5.7, 0.8, -4.2), r: V3(0.3, 0.35, 0.3), n: 12 }], { sun: V3(0.5, 0.8, 0.45), size: 0.7 }), { base: false }));
  }
  // street trees on the right sidewalk (painted cards)
  {
    const leafM = A.cardMaterial({ map: A.foliageAtlas({ kind: 'leaf', seed: 41 }), cells: 4, ramp: ['#2c4a5a', '#3e7a5a', '#82b85a', '#e4f2a0'], alt: '#fff3a8', altAmt: 0.45, ink: '#1a2e2a', sway: 0.025 });
    const trunk = A.celMaterial({ base: '#7a5a4a', shade: '#4a3440', id: ID.PROP + 14 });
    const clumps = [];
    for (let i = 0; i < 9; i++) {
      const tz = 8.5 - i * 22; const tx = 4.9;
      const tg = taperTube([V3(tx, 0, tz), V3(tx + 0.1, 2, tz), V3(tx - 0.1, 3.4, tz + 0.2)], 0.16, 0.08, 7, 8); G.add(new THREE.Mesh(tg, trunk));
      clumps.push({ c: V3(tx - 0.2, 4.4, tz), r: V3(1.7, 1.4, 1.7), n: 60 }, { c: V3(tx - 0.8, 4.0, tz + 0.6), r: V3(1.1, 0.9, 1.1), n: 26 }, { c: V3(tx + 0.4, 5.1, tz - 0.4), r: V3(1.1, 0.9, 1.1), n: 26 });
    }
    G.add(A.cardInstances(leafM, A.foliageItems(rng, clumps, { sun: V3(0.5, 0.8, 0.45), size: 0.8 }), { base: false }));
  }
  // far city at the end of the street
  for (let i = 0; i < 26; i++) {
    const h = 20 + rng() * 60, wdt = 10 + rng() * 20;
    const m = new THREE.Mesh(new THREE.BoxGeometry(wdt, h, 10), A.paintedMaterial({ color: '#b8c8e4', color2: '#c8d0ea', shade: '#8a9ac8', id: ID.PAINT, varAmt: 0.3, light: 0.5 }));
    m.position.set((i / 25 - 0.5) * 200 + (rng() - 0.5) * 10, h / 2, -230 - rng() * 60); G.add(m);
  }
  // cumulus
  const cm = cloudMaterial({ color: '#ffffff', color2: '#f4f6ff', shade: '#b4bce8', rimColor: '#fffdf4', mass: [0, 0, 0, 0] });
  const geo = new THREE.SphereGeometry(1, 16, 12);
  for (const [cx, cy, cz, w] of [[-60, 70, -300, 90], [80, 90, -380, 120], [10, 120, -500, 150], [-150, 60, -200, 70], [130, 55, -180, 60], [-40, 160, 120, 140], [60, 140, 60, 110]]) {
    const r2 = mulb(cx * 7 + cy | 0);
    G.add(puffs(geo, cm, cumulusList(r2, V3(cx, cy, cz), w, w * 0.5, 14, { bumps: 2 })));
  }
  return { update(st) {} };
}
