// SURTO ZUMBI · DIA 1 na fazenda (formato "DIA 1" de sobrevivência no nosso 3D chapado). Cada quadro é função pura de t.
import { THREE, mat, between, cyl, ball, box, mesh, cl, lerp, ss, plain, mkTex, paint, IMG, TINT, U, Y } from './kit3d.js';
import { criaGente } from './gente.js';
import { criaGente as criaGente2 } from './gente2.js';
import { criaCao } from './cao.js';
import { bloco2 } from './b2.js';
import { bloco3 } from './b3.js';
import { bloco4 } from './b4.js';
import { bloco5 } from './b5.js';

await document.fonts.load('700 60px RC');
const W = 1080, H = 1920;
window.END = 10.0;
const out = document.getElementById('c'), X = out.getContext('2d');
const gl = document.createElement('canvas'); gl.width = W; gl.height = H;
const R3 = new THREE.WebGLRenderer({ canvas: gl, antialias: true, alpha: true, preserveDrawingBuffer: true });
R3.setSize(W, H, false); R3.setClearColor(0x000000, 0); R3.shadowMap.enabled = true; R3.shadowMap.type = THREE.PCFSoftShadowMap; R3.shadowMap.autoUpdate = false;
const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xc9cdb6, 30, 170);
const cam = new THREE.PerspectiveCamera(40, W / H, 0.1, 400);
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
function rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = rng(7), back = k => { k = cl(k); const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };

// ---------- luz: sol baixo da manhã + céu
const sun = new THREE.DirectionalLight(0xffe2b8, 3.4); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04; sun.shadow.radius = 3;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(0xbfd0d8, 0x6a6a48, 1.0); scene.add(hemi);
if (new URLSearchParams(location.search).has('pbr')) { const ec = document.createElement('canvas'); ec.width = 64; ec.height = 1024; const g = ec.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 1024); [[0, '#1c2a4a'], [0.3, '#4a5a80'], [0.44, '#d08a5a'], [0.5, '#ffb468'], [0.54, '#b06a3a'], [1, '#3a2a1c']].forEach(([p, c]) => gr.addColorStop(p, c)); g.fillStyle = gr; g.fillRect(0, 0, 64, 1024);
  const et = new THREE.CanvasTexture(ec); et.colorSpace = THREE.SRGBColorSpace; et.mapping = THREE.EquirectangularReflectionMapping; scene.environment = new THREE.PMREMGenerator(R3).fromEquirectangular(et).texture; }
const fill = new THREE.PointLight(0xffc890, 0, 9, 1.4); scene.add(fill);
const redL = new THREE.PointLight(0xff3a2a, 0, 3, 1.4); scene.add(redL);
const dawn = () => { houseTick(TNOW); setSun(4, 0, 4, -40, 9.5, 12, 48); sun.color.set(0xffa25a); sun.intensity = 5.2; hemi.color.set(0x6a84b8); hemi.groundColor.set(0x3a2c1c); hemi.intensity = 0.62; scene.fog.color.set(0xd9905c); };
function setSun(tx, ty, tz, dx, dy, dz, span, far = 160) { sun.position.set(tx + dx, ty + dy, tz + dz); sun.target.position.set(tx, ty, tz); Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 1, far }); sun.shadow.camera.updateProjectionMatrix();
  U.shadeDir.value.set(dx, dy, dz).normalize(); U.rimDir.value.set(dx, dy * 0.4, dz).normalize(); }

// ---------- materiais de cenário (Lambert com textura pintada)
const T = (key, tint, a, rx, ry, crop = 0.04) => { const t = plain(key, tint, a, crop, 0, 1024); t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.repeat.set(rx, ry); return t; };
const L = (map, color = 0xffffff, e = {}) => new THREE.MeshLambertMaterial({ map, color, ...e });
const M = { grass: L(T('grass', '#5f7d3a', 0.6, 150, 150), 0xffffff), dirt: L(T('dirt', '#b08a5c', 0.86, 2, 46)), yard: L(T('dirt', '#b08a5c', 0.86, 9, 9)), siding: L(T('siding', '#e8e2d2', 0.5, 2, 1.2)), redbarn: L(T('redbarn', '#a23a2c', 0.5, 2.5, 1.2)),
  roof: L(T('roof', '#4a5560', 0.5, 2.5, 1.5)), plank: L(T('plank', '#8a8576', 0.6, 2, 1)), wood: L(T('wood', '#7a5a3c', 0.5, 1, 1)), woodD: L(T('wood', '#4c3626', 0.5, 1, 1)), floor: L(T('wood', '#6a4a30', 0.5, 3, 3)), brick: L(T('brick', '#9a5a44', 0.4, 1, 1)),
  wall: L(T('plank', '#4f6f6c', 0.7, 2.5, 1.4)), white: L(null, 0xf0ece0), dark: L(null, 0x2a2c2e), glass: new THREE.MeshBasicMaterial({ color: 0x8fa6ae }), steel: L(T('steel', '#8a929c', 0.5, 1, 1, 0.16)), green: L(T('canvas', '#3f6b3a', 0.8, 1, 1)) };
const add = (geo, m, x, y, z, o = {}) => { const k = new THREE.Mesh(geo, m); k.position.set(x, y, z); k.castShadow = o.cast ?? true; k.receiveShadow = o.recv ?? true; if (o.ry) k.rotation.y = o.ry; if (o.rx) k.rotation.x = o.rx; if (o.rz) k.rotation.z = o.rz; (o.to ?? scene).add(k); return k; };
const BX = (w, h, d) => new THREE.BoxGeometry(w, h, d);
function prism(w, h, d) { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); return g; }

// ---------- fazenda
const farm = new THREE.Group(); scene.add(farm);
{ const g = add(new THREE.PlaneGeometry(420, 420), M.grass, 0, 0, 0, { rx: -Math.PI / 2, cast: false, to: farm });
  add(new THREE.PlaneGeometry(3.4, 80), M.dirt, 0.4, 0.02, 44, { rx: -Math.PI / 2, cast: false, to: farm });
  add(new THREE.CircleGeometry(7.5, 40), M.yard, 2, 0.015, 5, { rx: -Math.PI / 2, cast: false, to: farm });
  for (const m of [M.yard, M.dirt]) { m.map.wrapS = m.map.wrapT = THREE.RepeatWrapping; m.map.needsUpdate = true; } M.yard.map.repeat.set(2.2, 2.2); M.dirt.map.repeat.set(1, 14); M.yard.color.set(0xd8c8b0); M.dirt.color.set(0xd8c8b0); }
{ const blot = mkTex(1024, 1024, (g, w, h) => { g.clearRect(0, 0, w, h); const r = rng(5); for (let i = 0; i < 260; i++) { const x = r() * w, y = r() * h, q = 20 + r() * 90, lt = r() < 0.4, gr = g.createRadialGradient(x, y, 0, x, y, q); gr.addColorStop(0, lt ? `rgba(230,210,120,${0.1 + r() * 0.14})` : `rgba(14,26,10,${0.14 + r() * 0.22})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - q, y - q, q * 2, q * 2); } });
  blot.wrapS = blot.wrapT = THREE.ClampToEdgeWrapping; const m = add(new THREE.PlaneGeometry(260, 260), new THREE.MeshBasicMaterial({ map: blot, transparent: true, depthWrite: false }), 2, 0.012, 6, { rx: -Math.PI / 2, cast: false, recv: false, to: farm }); m.renderOrder = 1;
}
// vegetação em cartões recortados: lâminas e folhas desenhadas, luz como a do chão
const cardTex = fn => { const t = mkTex(256, 256, (g, w, h) => { g.clearRect(0, 0, w, h); fn(g, w, h); }); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; };
const tuftTex = cardTex((g, w, h) => { const r = rng(31); g.strokeStyle = '#fff'; g.lineCap = 'round'; for (let i = 0; i < 16; i++) { const a = (i / 15 - 0.5) * 1.5 + (r() - 0.5) * 0.2, len = h * (0.55 + r() * 0.4), x0 = w / 2 + (r() - 0.5) * 50; g.lineWidth = 7 + r() * 7;
    for (let k = 0; k < 2; k++) { g.beginPath(); g.moveTo(x0, h); g.quadraticCurveTo(x0 + Math.sin(a) * len * 0.35, h - len * 0.6, x0 + Math.sin(a) * len * 0.95, h - Math.cos(a * 0.7) * len); g.lineWidth *= 0.45; g.stroke(); } } });
const cropTex = cardTex((g, w, h) => { g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineWidth = 7; for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 2.3, len = h * (0.5 + 0.35 * Math.cos(a)); g.save(); g.translate(w / 2, h); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -len * 0.5); g.stroke(); g.beginPath(); g.ellipse(0, -len * 0.62, len * 0.17, len * 0.4, 0, 0, 7); g.fill(); g.restore(); } });
const leafTex = cardTex((g, w, h) => { const r = rng(57); g.fillStyle = '#fff'; g.beginPath(); g.arc(w / 2, h / 2, w * 0.27, 0, 7); g.fill();
  for (let i = 0; i < 150; i++) { const a = r() * 6.283, d = (0.18 + 0.82 * Math.sqrt(r())) * w * 0.43, x = w / 2 + Math.cos(a) * d, y = h / 2 + Math.sin(a) * d, s = 9 + r() * 10; g.save(); g.translate(x, y); g.rotate(a + (r() - 0.5) * 1.2); g.beginPath(); g.moveTo(-s, 0); g.quadraticCurveTo(0, -s * 0.7, s * 1.25, 0); g.quadraticCurveTo(0, s * 0.7, -s, 0); g.fill(); g.restore(); } });
function crossGeo(wd, ht, flat = 0) { const pos = [], uv = [], nor = [], idx = []; for (let k = 0; k < 2; k++) { const c = Math.cos(k * Math.PI / 2 + 0.4), sn = Math.sin(k * Math.PI / 2 + 0.4), b = k * 4;
    for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { pos.push((u - 0.5) * wd * c, v * ht, (u - 0.5) * wd * sn); uv.push(u, v); nor.push(0, 1, 0); } idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  if (flat) { const b = 8, q = wd * flat / 2; for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { pos.push((u - 0.5) * 2 * q, ht * 0.5, (v - 0.5) * 2 * q); uv.push(u, 0.25 + v * 0.75); nor.push(0, 1, 0); } idx.push(b, b + 2, b + 1, b, b + 3, b + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g; }
const cardMat = map => new THREE.MeshLambertMaterial({ map, alphaTest: 0.45, side: THREE.DoubleSide, color: 0xffffff });
function scatter(geo, map, n, where, tone, seed, sz = [0.7, 1.5]) { const im = new THREE.InstancedMesh(geo, cardMat(map), n), d = new THREE.Object3D(), col = new THREE.Color(), r = rng(seed);
  for (let i = 0; i < n; i++) { const [x, z] = where(r); d.position.set(x, 0, z); d.rotation.set(0, r() * 6.28, 0); const k = sz[0] + r() * (sz[1] - sz[0]); d.scale.set(k, k * (0.75 + r() * 0.6), k); d.updateMatrix(); im.setMatrixAt(i, d.matrix); im.setColorAt(i, col.setHSL(tone[0] + r() * tone[1], tone[2] + r() * 0.2, tone[3] + r() * tone[4])); }
  im.receiveShadow = true; im.castShadow = false; farm.add(im); return im; }
const livre = (x, z) => !(Math.hypot(x - 2, z - 5) < 7.4 || (Math.abs(x - 0.4) < 2.0 && z > 4) || (x > 7.6 && x < 21.4 && z > 8.5 && z < 31.5) || (Math.abs(x) < 3.7 && Math.abs(z) < 3.2) || (x > 8.2 && x < 14 && z > -2.8 && z < 3.2) || (Math.abs(x - 0.4) < 5.5 && z > 25.5) || (x < -16.5 && z > 13 && z < 23) || Math.hypot(x - 21.5, z - 2.5) < 4.2);
scatter(crossGeo(0.62, 0.5), tuftTex, 14000, r => { let x, z; do { x = -26 + r() * 56; z = -22 + r() * 66; } while (!livre(x, z)); return [x, z]; }, [0.2, 0.07, 0.42, 0.2, 0.16], 19);
scatter(crossGeo(0.75, 0.7), tuftTex, 5000, r => { let x, z; do { x = -9 + r() * 22; z = 12 + r() * 21; } while (!livre(x, z)); return [x, z]; }, [0.17, 0.08, 0.4, 0.24, 0.2], 23, [0.6, 1.15]);
scatter(crossGeo(0.5, 0.42), tuftTex, 900, r => { const a = r() * 6.283, d = 6.6 + r() * 1.4; return r() < 0.5 ? [2 + Math.cos(a) * d, 5 + Math.sin(a) * d] : [0.4 + (r() < 0.5 ? -1 : 1) * (1.75 + r() * 0.5), 12 + r() * 60]; }, [0.15, 0.06, 0.35, 0.3, 0.14], 29);

// casa: base de tijolo, tábuas com cantoneira, telhado com beiral, varanda com guarda-corpo, janelas com veneziana
const house = new THREE.Group(); farm.add(house);
const SMOKE = [], porchL = new THREE.PointLight(0xffb060, 0, 7, 1.5), winL = new THREE.PointLight(0xffc070, 0, 6, 1.6);
{ const o = { to: house }, shut = L(null, 0x2f4a3a), warm = new THREE.MeshBasicMaterial({ color: 0xffc66e, fog: false }), pane = new THREE.MeshLambertMaterial({ color: 0x1c2630, emissive: 0x0c141c }), trim = M.white, dk = L(null, 0x30343a), gold = L(null, 0xd8a84a);
  const PITCH = Math.atan2(2.2, 3.2), SL = Math.hypot(3.2, 2.2) + 0.55;
  add(BX(6.7, 0.5, 5.5), M.brick, 0, 0.25, 0, o);
  add(BX(6.4, 3.0, 5.2), M.siding, 0, 2.0, 0, o); add(prism(6.4, 2.2, 5.2), M.siding, 0, 3.5, 0, o);
  for (const sx of [-1, 1]) { const r = add(BX(SL, 0.14, 6.3), M.roof, sx * (1.6 + 0.22), 3.5 + 1.1 + 0.02, 0, o); r.rotation.z = -sx * PITCH;
    for (const z of [-3.16, 3.16]) { const f = add(BX(SL, 0.22, 0.07), trim, sx * (1.6 + 0.22), 3.5 + 1.1 - 0.08, z, o); f.rotation.z = -sx * PITCH; }
    add(BX(0.09, 0.2, 6.3), trim, sx * 3.66, 3.36, 0, o); add(new THREE.CylinderGeometry(0.05, 0.05, 2.9, 8), dk, sx * 3.27, 1.95, 2.52, o); }
  add(BX(0.34, 0.14, 6.4), dk, 0, 5.74, 0, o);
  for (const [x, z] of [[-3.2, -2.6], [3.2, -2.6], [-3.2, 2.6], [3.2, 2.6]]) add(BX(0.16, 3.0, 0.16), trim, x, 2.0, z, o);
  add(BX(6.44, 0.16, 5.24), trim, 0, 0.58, 0, o);
  // chaminé
  add(BX(0.8, 2.9, 0.8), M.brick, 1.9, 5.0, -0.8, o); add(BX(1.0, 0.14, 1.0), dk, 1.9, 6.5, -0.8, o); add(BX(0.5, 0.2, 0.5), dk, 1.9, 6.65, -0.8, o);
  for (let i = 0; i < 9; i++) { const m = add(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xe6cdb4, transparent: true, opacity: 0.2, depthWrite: false }), 1.9, 6.8, -0.8, { ...o, cast: false, recv: false }); SMOKE.push(m); }
  // varanda: deque, degraus, colunas com base e mão-francesa, guarda-corpo, telhadinho
  add(BX(7.0, 0.3, 2.3), M.wood, 0, 0.5, 3.75, o); add(BX(1.8, 0.2, 0.4), M.wood, 0, 0.36, 5.1, o); add(BX(1.8, 0.2, 0.4), M.wood, 0, 0.16, 5.48, o);
  const PX = [-3.25, -1.15, 1.15, 3.25];
  for (const x of PX) { add(BX(0.16, 2.4, 0.16), trim, x, 1.85, 4.72, o); add(BX(0.26, 0.14, 0.26), trim, x, 0.72, 4.72, o); add(BX(0.26, 0.1, 0.26), trim, x, 3.0, 4.72, o);
    for (const sx of [-1, 1]) { if ((x < -3 && sx < 0) || (x > 3 && sx > 0)) continue; const b = add(BX(0.42, 0.07, 0.07), trim, x + sx * 0.16, 2.82, 4.72, o); b.rotation.z = sx * 0.78; } }
  const rail = (x0, z0, x1, z1) => { const len = Math.hypot(x1 - x0, z1 - z0), ry = -Math.atan2(z1 - z0, x1 - x0); for (const y of [0.86, 1.5]) add(BX(len, 0.07, 0.08), trim, (x0 + x1) / 2, y, (z0 + z1) / 2, { ...o, ry });
    const n = Math.round(len / 0.2); for (let i = 1; i < n; i++) add(BX(0.045, 0.6, 0.045), trim, lerp(x0, x1, i / n), 1.18, lerp(z0, z1, i / n), o); };
  rail(PX[0], 4.72, PX[1], 4.72); rail(PX[2], 4.72, PX[3], 4.72); rail(PX[0], 2.7, PX[0], 4.72); rail(PX[3], 2.7, PX[3], 4.72);
  add(BX(7.5, 0.12, 2.75), M.roof, 0, 3.3, 3.85, { ...o, rx: 0.17 }); add(BX(7.5, 0.2, 0.08), trim, 0, 3.02, 5.2, o); add(BX(7.0, 0.12, 0.12), trim, 0, 3.02, 4.72, o);
  // porta com almofadas, bandeira acesa, lanterna
  add(BX(1.34, 2.5, 0.1), trim, 0, 1.9, 2.62, o); add(BX(1.06, 2.05, 0.08), M.woodD, 0, 1.7, 2.67, o); for (const [x, y, h] of [[-0.25, 2.2, 0.7], [0.25, 2.2, 0.7], [-0.25, 1.2, 0.9], [0.25, 1.2, 0.9]]) add(BX(0.36, h, 0.03), M.wood, x, y, 2.72, o);
  add(new THREE.SphereGeometry(0.05, 10, 8), gold, 0.4, 1.65, 2.74, o); add(BX(1.06, 0.26, 0.06), warm, 0, 2.93, 2.67, { ...o, cast: false });
  add(BX(0.16, 0.26, 0.16), dk, 0.95, 2.55, 2.74, o); add(BX(0.11, 0.17, 0.11), warm, 0.95, 2.53, 2.76, { ...o, cast: false }); porchL.position.set(0.95, 2.5, 3.1); house.add(porchL); winL.position.set(-2.05, 2.1, 3.2); house.add(winL);
  add(BX(1.0, 0.03, 0.6), L(null, 0x7a4a30), 0, 0.67, 3.1, o);
  // janelas
  const win = (x, y, z, ry, lit, w = 1.0, h = 1.35, sh = true) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; house.add(g); const q = { to: g };
    add(BX(w + 0.22, h + 0.22, 0.08), trim, 0, 0, 0, q); add(BX(w, h, 0.06), lit ? warm : pane, 0, 0, 0.03, { ...q, cast: false }); add(BX(0.05, h, 0.08), trim, 0, 0, 0.04, q); add(BX(w, 0.05, 0.08), trim, 0, 0.08, 0.04, q); add(BX(w + 0.36, 0.08, 0.2), trim, 0, -h / 2 - 0.12, 0.06, q);
    if (lit) add(BX(w * 0.36, h, 0.02), new THREE.MeshBasicMaterial({ color: 0xe89a50, fog: false }), -w * 0.32, 0, 0.065, { ...q, cast: false });
    if (sh) for (const sx of [-1, 1]) { add(BX(0.42, h + 0.1, 0.05), shut, sx * (w / 2 + 0.34), 0, 0.02, q); for (let i = 0; i < 7; i++) add(BX(0.34, 0.02, 0.06), L(null, 0x24382c), sx * (w / 2 + 0.34), -h / 2 + 0.16 + i * (h - 0.2) / 7, 0.03, q); } return g; };
  win(-2.05, 2.15, 2.62, 0, true); win(2.05, 2.15, 2.62, 0, false); win(0, 4.45, 2.62, 0, true, 0.8, 0.8, false);
  win(-3.22, 2.15, 0.2, -Math.PI / 2, false); win(3.22, 2.15, 0.9, Math.PI / 2, false); win(-3.22, 2.15, -1.6, -Math.PI / 2, false, 0.8, 1.1, false);
  // floreiras, cadeira de balanço, lenha, balde
  for (const x of [-2.05, 2.05]) { add(BX(1.3, 0.2, 0.26), M.woodD, x, 1.24, 2.82, o); for (let i = 0; i < 6; i++) { const f = add(new THREE.SphereGeometry(0.11, 8, 6), L(null, [0xd8503a, 0xf2c23c, 0xe88aa0][i % 3]), x - 0.5 + i * 0.2, 1.42 + (i % 2) * 0.04, 2.85, o); f.scale.y = 0.8; } }
  { const g = new THREE.Group(); g.position.set(-2.3, 0.65, 3.75); g.rotation.y = 0.5; house.add(g); const q = { to: g }; add(BX(0.6, 0.06, 0.55), M.wood, 0, 0.45, 0, q); add(BX(0.6, 0.8, 0.06), M.wood, 0, 0.85, -0.27, { ...q, rx: -0.15 }); for (const sx of [-1, 1]) { add(BX(0.06, 0.45, 0.06), M.woodD, sx * 0.27, 0.24, 0.2, q); add(BX(0.06, 0.45, 0.06), M.woodD, sx * 0.27, 0.24, -0.22, q); add(BX(0.06, 0.05, 0.95), M.woodD, sx * 0.27, 0.04, 0, q); add(BX(0.06, 0.05, 0.55), M.woodD, sx * 0.3, 0.68, 0, q); } }
  for (let r = 0; r < 4; r++) for (let i = 0; i < 7 - r; i++) { const lg = add(new THREE.CylinderGeometry(0.13, 0.13, 0.9, 8), i % 3 ? M.woodD : M.wood, 3.95 + (i - (6 - r) / 2) * 0.27 * 0 + 0.0, 0.13 + r * 0.24, -1.9 + i * 0.27 + r * 0.135, o); lg.rotation.z = Math.PI / 2; }
  add(new THREE.CylinderGeometry(0.2, 0.15, 0.34, 12), M.steel, 2.6, 0.82, 3.3, o);
  for (const [x, z] of [[0.1, 6.3], [-0.2, 7.2], [0.25, 8.1]]) add(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 9), L(null, 0x8a8478), x, 0.04, z, { ...o, cast: false }); }
// celeiro vermelho com X branco
const barn = new THREE.Group(); barn.position.set(13, 0, -7); barn.rotation.y = -0.5; farm.add(barn);
{ const o = { to: barn }; add(BX(7.5, 4.6, 10), M.redbarn, 0, 2.3, 0, o); add(prism(8.2, 3.0, 10.8), M.roof, 0, 4.6, 0, o);
  const dt = mkTex(512, 512, (g, w, h) => { g.fillStyle = '#8f3024'; g.fillRect(0, 0, w, h); paint(g, w, h, 'redbarn', '#8f3024', 0.5, 0.04); g.strokeStyle = '#efe9da'; g.lineWidth = 26; g.strokeRect(13, 13, w - 26, h - 26); g.beginPath(); g.moveTo(13, 13); g.lineTo(w - 13, h - 13); g.moveTo(w - 13, 13); g.lineTo(13, h - 13); g.stroke(); });
  for (const x of [-1.4, 1.4]) add(BX(2.7, 3.3, 0.1), L(dt), x, 1.7, 5.03, o); add(BX(6.0, 0.22, 0.12), M.white, 0, 3.5, 5.03, o); add(BX(1.3, 1.1, 0.1), M.dark, 0, 5.5, 5.42, o); }
// galpão, caixa d'água e poço
{ add(BX(4, 2.6, 3.4), M.plank, -10, 1.3, -5, { to: farm }); add(prism(4.6, 1.2, 3.9), M.roof, -10, 2.6, -5, { to: farm });
  for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) add(BX(0.16, 4.2, 0.16), M.woodD, -6 + x, 2.1, 3 + z, { to: farm });
  add(new THREE.CylinderGeometry(1.3, 1.3, 1.9, 24), M.steel, -6, 5.1, 3, { to: farm }); add(new THREE.ConeGeometry(1.45, 0.6, 24), M.roof, -6, 6.35, 3, { to: farm });
  add(new THREE.CylinderGeometry(0.6, 0.6, 0.7, 20), M.brick, -3.6, 0.35, 5.6, { to: farm }); add(BX(0.5, 0.6, 0.4), M.steel, -3.6, 0.95, 5.6, { to: farm }); }
// lavoura
{ const soil = L(T('dirt', '#5a3e28', 0.8, 1, 6)); for (let i = 0; i < 9; i++) add(BX(0.9, 0.14, 22), soil, 8.5 + i * 1.5, 0.07, 20, { to: farm, cast: false });
  scatter(crossGeo(0.75, 0.62, 1.1), cropTex, 9 * 34, (() => { let i = 0; return r => { const k = i++; return [8.5 + (k % 9) * 1.5 + (r() - 0.5) * 0.12, 9.5 + Math.floor(k / 9) * 0.63 + (r() - 0.5) * 0.1]; }; })(), [0.27, 0.05, 0.5, 0.26, 0.12], 37, [0.85, 1.25]).position.y = 0.12; }
// cerca com porteira
const FENCE = { x0: -24, x1: 26, z0: -22, z1: 30 };
{ const post = BX(0.16, 1.25, 0.16), o = { to: farm }; const seg = (x0, z0, x1, z1) => { const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 3); for (let i = 0; i <= n; i++) add(post, M.woodD, lerp(x0, x1, i / n), 0.62, lerp(z0, z1, i / n), o);
    for (const y of [0.45, 0.95]) { const r = add(BX(Math.hypot(x1 - x0, z1 - z0), 0.09, 0.06), M.wood, (x0 + x1) / 2, y, (z0 + z1) / 2, o); r.rotation.y = -Math.atan2(z1 - z0, x1 - x0); } };
  const F = FENCE; seg(F.x0, F.z0, F.x1, F.z0); seg(F.x0, F.z0, F.x0, F.z1); seg(F.x1, F.z0, F.x1, F.z1); seg(F.x0, F.z1, -1.6, F.z1); seg(2.4, F.z1, F.x1, F.z1); }
// árvores e horizonte
const barkT = T('bark', '#6a5444', 0.5, 2, 2, 0.07), barkM = L(barkT);
const trunkGeo = (() => { const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push(new THREE.Vector2(0.24 * (1 + 0.9 * Math.pow(1 - u, 3)) * (1 - 0.35 * u), u * 3.4)); } return new THREE.LatheGeometry(pts, 14); })();
const leafMats = [[0.29, 0.5, 0.11], [0.26, 0.5, 0.17], [0.22, 0.52, 0.24], [0.17, 0.55, 0.31]].map(([h, sa, l]) => { const c = new THREE.Color().setHSL(h, sa, l); return new THREE.MeshLambertMaterial({ map: leafTex, alphaTest: 0.4, side: THREE.DoubleSide, color: c, emissive: c.clone().multiplyScalar(0.12) }); });
const leafDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: leafTex, alphaTest: 0.4 }), coreM = L(null, 0x18280f), leafGeo = new THREE.PlaneGeometry(1, 1), ZAX = V3(0, 0, 1), _dir = V3(), _q = new THREE.Quaternion();
function copa(g, cx, cy, cz, rad, n) { const core = add(new THREE.SphereGeometry(rad * 0.62, 12, 9), coreM, cx, cy, cz, { to: g }); core.scale.y = 0.9;
  for (let i = 0; i < n; i++) { const a = (i + R()) / n * 6.283 * 3.1, y = -0.55 + 1.5 * ((i + R()) / n), rr = Math.sqrt(Math.max(0.05, 1 - Math.min(0.95, y * y)));
    _dir.set(Math.cos(a) * rr, y, Math.sin(a) * rr).normalize(); const m = new THREE.Mesh(leafGeo, leafMats[y > 0.55 ? 3 : y > 0.15 ? 2 : y > -0.2 ? 1 : 0]);
    m.position.set(cx + _dir.x * rad * 0.8, cy + _dir.y * rad * 0.72, cz + _dir.z * rad * 0.8);
    _dir.x += (R() - 0.5) * 0.5; _dir.y += (R() - 0.5) * 0.5 + 0.15; _dir.z += (R() - 0.5) * 0.5; m.quaternion.setFromUnitVectors(ZAX, _dir.normalize()); m.rotateZ(R() * 6.283);
    const k = rad * (1.0 + R() * 0.5); m.scale.set(k, k, 1); m.castShadow = true; m.receiveShadow = false; m.customDepthMaterial = leafDepth; g.add(m); } }
const brM = barkM;
function galho(g, a, b, r0, r1) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, 1, 8, 1), brM); const d = V3().subVectors(b, a), l = d.length(); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(Y, d.normalize()); m.scale.y = l; m.castShadow = true; g.add(m); }
function tree(x, z, s = 1) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = R() * 6.28; g.scale.setScalar(s); farm.add(g); const tr = add(trunkGeo, barkM, 0, 0, 0, { to: g }); tr.scale.set(1.25, 0.82, 1.25);
  // copa larga em cachos: um grande no alto, quatro em volta mais baixos, dois pequenos de topo
  const C = [[0, 4.9, 0, 1.75, 30], [1.9, 4.0, 0.4, 1.3, 22], [-1.7, 4.1, 0.7, 1.35, 22], [0.5, 3.9, -1.8, 1.3, 22], [-0.6, 3.8, 1.9, 1.25, 20], [0.9, 5.7, -0.5, 1.0, 14], [-0.9, 5.6, 0.3, 1.0, 14]];
  for (const [cx, cy, cz, r, n] of C) copa(g, cx + (R() - 0.5) * 0.3, cy + (R() - 0.5) * 0.3, cz + (R() - 0.5) * 0.3, r * (0.92 + R() * 0.16), n);
  const top = V3(0, 2.7, 0); for (const [cx, cy, cz] of C.slice(1, 5)) galho(g, top, V3(cx * 0.8, cy - 0.5, cz * 0.8), 0.15, 0.06); galho(g, top, V3(0, 4.3, 0), 0.2, 0.1); }
function bush(x, z, s = 1) { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); farm.add(g); copa(g, 0, 0.5, 0, 0.75, 16); copa(g, 0.65, 0.38, 0.2, 0.55, 12); copa(g, -0.5, 0.35, -0.3, 0.5, 10); }
for (const [x, z, s] of [[-5.5, -3, 1.2], [6.2, 2.5, 1.0], [-13, 6, 1.1], [18, 6, 1.0], [-17, -12, 1.3], [5, -14, 1.2], [21, -16, 1.1], [-8, 20, 1.0], [15, 27.5, 0.9], [-19, 24, 1.2]]) tree(x, z, s);
for (const [x, z, s] of [[-3.9, 2.9, 1], [3.9, 2.9, 0.9], [-4.4, -1.5, 1.1], [-8, -2.5, 1], [8.6, -1, 1.1], [-2.6, 30.4, 1], [3.6, 30.6, 0.9], [-11.5, 13, 1.2], [6.5, 12, 0.9], [-6, 27, 1.1], [24.8, -4, 1.2], [-21, 4, 1.1]]) bush(x, z, s);
{ const far = L(null, 0x55704a), hill = L(null, 0x8c9a66); for (let i = 0; i < 90; i++) { const a = i / 90 * 6.283 + R() * 0.05, r = 75 + R() * 30, b = add(new THREE.SphereGeometry(5 + R() * 5, 10, 8), far, Math.cos(a) * r, 2.5, Math.sin(a) * r, { to: farm, cast: false, recv: false }); b.scale.y = 0.9; }
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, b = add(new THREE.SphereGeometry(60, 20, 10), hill, Math.cos(a) * 190, -22, Math.sin(a) * 190, { to: farm, cast: false, recv: false }); b.scale.y = 0.55; } }

// ---------- cozinha (palco à parte, longe da fazenda)
const KX = 400, kit = new THREE.Group(); kit.position.set(KX, 0, 0); scene.add(kit);
{ const o = { to: kit }; add(BX(9, 0.2, 9), M.floor, 0, -0.1, 0, o); const wb = add(BX(9, 4, 0.2), M.wall, 0, 2, -2.6, { ...o, cast: false }); add(BX(0.2, 4, 9), M.wall, -3.2, 2, 0, { ...o, cast: false });
  add(BX(9, 0.9, 0.08), M.wood, 0, 0.45, -2.48, o); add(BX(9, 0.06, 0.12), M.woodD, 0, 0.92, -2.46, o);
  // janela estourada de luz
  add(BX(1.9, 1.5, 0.06), new THREE.MeshBasicMaterial({ color: 0xffe2a8, fog: false }), 0.5, 2.05, -2.47, { ...o, cast: false }); add(BX(2.1, 0.1, 0.14), M.white, 0.5, 2.85, -2.44, o); add(BX(2.1, 0.12, 0.2), M.white, 0.5, 1.26, -2.42, o);
  for (const x of [-0.5, 0.5, 1.5]) add(BX(0.09, 1.6, 0.12), M.white, x, 2.05, -2.44, o); add(BX(2.0, 0.07, 0.12), M.white, 0.5, 2.05, -2.44, o);
  // mesa, cadeira, louça
  add(BX(1.5, 0.07, 0.9), M.wood, 0.75, 0.78, 0, o); for (const [x, z] of [[0.1, -0.36], [1.4, -0.36], [0.1, 0.36], [1.4, 0.36]]) add(BX(0.08, 0.78, 0.08), M.woodD, x, 0.39, z, o);
  add(BX(0.46, 0.05, 0.46), M.woodD, -0.38, 0.5, 0, o); add(BX(0.05, 0.6, 0.46), M.woodD, -0.6, 0.8, 0, o); for (const [x, z] of [[-0.58, -0.2], [-0.18, -0.2], [-0.58, 0.2], [-0.18, 0.2]]) add(BX(0.05, 0.5, 0.05), M.woodD, x, 0.25, z, o);
  add(new THREE.CylinderGeometry(0.17, 0.11, 0.07, 20), M.white, 0.45, 0.85, 0, o); add(new THREE.CylinderGeometry(0.05, 0.045, 0.1, 14), L(null, 0x3f6f8a), 0.95, 0.865, -0.18, o); add(new THREE.SphereGeometry(0.11, 14, 10), L(null, 0xc98a4a), 1.2, 0.86, 0.14, o).scale.set(1.5, 0.7, 1);
}

// ---------- elenco e objetos
const QS = new URLSearchParams(location.search), Z4 = QS.has('z4'), Z3 = QS.has('z3') || Z4, Z2 = QS.has('z2') || Z3, G3 = Z4 ? await import('./gente4.js') : Z3 ? await import('./gente3.js') : null; if (Z4) await G3.prepara('zumbi');   // z4 = boneco novo (gente4, ?p=ze3) com os movimentos de mov2/
const mkGente = Z3 ? G3.criaGente : Z2 ? criaGente2 : criaGente; const ze = mkGente(); scene.add(ze.root);
const cao = criaCao(); scene.add(cao.root);
// movimentos escolhidos por plano (mov/sel.json: { id: 'arquivo.json' }); sem o arquivo, o plano usa a pose feita à mão
const MV = {}; if (Z3) { try { const pm = Z4 ? 'mov2/' : 'mov/', sel = await (await fetch(pm + (Z4 ? 'sel4.json' : 'sel.json'))).json(); for (const [k, f] of Object.entries(sel)) MV[k] = await G3.carregaMov(pm + f); } catch (e) { console.log('sem mov/sel.json'); } }
const spoon = new THREE.Group(); scene.add(spoon); { const h = box(0.012, 0.14, 0.012, 0xb8bcc0, { metal: 0.8 }); h.position.y = 0.05; spoon.add(h); const b = ball(1, 0xc8ccd0, { metal: 0.8 }); b.scale.set(0.022, 0.008, 0.03); b.position.y = 0.13; spoon.add(b); }
const phoneTex = mkTex(512, 1024, (g, w, h) => { g.fillStyle = '#c2271c'; g.fillRect(0, 0, w, h); const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,90,60,0.5)'); gr.addColorStop(1, 'rgba(90,0,0,0.5)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.strokeStyle = '#fff'; g.lineWidth = 12; g.lineJoin = 'round'; g.beginPath(); g.moveTo(w / 2, 120); g.lineTo(w / 2 + 78, 250); g.lineTo(w / 2 - 78, 250); g.closePath(); g.stroke(); g.font = '700 96px RC'; g.fillText('!', w / 2, 240);
  g.font = '700 44px RC'; g.fillText('ALERTA DE EMERGÊNCIA', w / 2, 340); g.fillRect(70, 366, w - 140, 5);
  g.font = '700 104px RC'; g.fillText('FIQUE', w / 2, 500); g.fillText('ONDE ESTÁ', w / 2, 610);
  g.font = '700 50px RC'; g.fillText('EVITE', w / 2, 740); g.fillText('ÁREAS POVOADAS', w / 2, 800); g.globalAlpha = 0.7; g.font = '700 30px RC'; g.fillText('DEFESA CIVIL · 06:41', w / 2, 930); });
phoneTex.wrapS = phoneTex.wrapT = THREE.ClampToEdgeWrapping;
const phone = new THREE.Group(); scene.add(phone); { const b = box(0.086, 0.176, 0.012, 0x16161a, { rim: 0 }); phone.add(b); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.078, 0.166), new THREE.MeshBasicMaterial({ map: phoneTex, fog: false })); s.position.z = -0.0065; s.rotation.y = Math.PI; phone.add(s); }

// ---------- 2D: céu, pós, HUD, legenda
const lay = [0, 1, 2].map(() => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; });
const BLOOM = document.createElement('canvas'); BLOOM.width = W / 4; BLOOM.height = H / 4;
const DUST = []; { const r = rng(8); for (let i = 0; i < 60; i++) DUST.push({ x: r(), y: r(), p: r() * 6.28, s: r() }); }
let DOTS = null; const MONO = document.createElement('canvas'); MONO.width = W; MONO.height = H;
function sky(c, S) { const g = c.createLinearGradient(0, 0, 0, H * 0.7); g.addColorStop(0, S.sky?.[0] ?? '#27344f'); g.addColorStop(0.55, S.sky?.[1] ?? '#c9785a'); g.addColorStop(1, S.sky?.[2] ?? '#f6c078'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (S.sunXY) { const r = c.createRadialGradient(S.sunXY[0], S.sunXY[1], 0, S.sunXY[0], S.sunXY[1], 1000); r.addColorStop(0, 'rgba(255,236,190,1)'); r.addColorStop(0.12, 'rgba(255,196,120,0.8)'); r.addColorStop(1, 'rgba(255,150,80,0)'); c.fillStyle = r; c.fillRect(0, 0, W, H); } }
const RAYS = Array.from({ length: 9 }, (_, i) => ({ a: 0.08 + i * 0.13 + (i % 3) * 0.03, w: 0.018 + (i % 4) * 0.012, p: i * 1.7 }));
const FG = []; { const r = rng(4); for (let i = 0; i < 46; i++) FG.push({ x: r() * 1400 - 160, h: 260 + r() * 520, lean: (r() - 0.5) * 0.5, w: 10 + r() * 22, p: r() * 6.28 }); }
function post(c, t, S) {
  // raios do sol atravessando o quadro
  if (S.rays) { const [sx, sy, amp] = S.rays; c.save(); c.globalCompositeOperation = 'lighter'; c.filter = 'blur(14px)'; for (const q of RAYS) { const a = q.a + Math.sin(t * 0.25 + q.p) * 0.012, al = amp * (0.5 + 0.5 * Math.sin(t * 0.6 + q.p)); c.fillStyle = `rgba(255,190,110,${al})`; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(a - q.w) * 2600, sy + Math.sin(a - q.w) * 2600); c.lineTo(sx + Math.cos(a + q.w) * 2600, sy + Math.sin(a + q.w) * 2600); c.fill(); } c.restore(); }
  c.globalCompositeOperation = 'lighter'; for (const d of DUST) { const x = ((d.x + t * 0.006 * (0.5 + d.s)) % 1) * W, y = ((d.y + Math.sin(t * 0.3 + d.p) * 0.01) % 1) * H; c.fillStyle = `rgba(255,200,130,${0.16 + 0.16 * Math.sin(t + d.p)})`; c.beginPath(); c.arc(x, y, 1.6 + d.s * 3, 0, 7); c.fill(); }
  c.globalCompositeOperation = 'source-over';
  // capim desfocado em primeiro plano
  if (S.capim) { c.save(); c.filter = 'blur(7px)'; for (const b of FG) { const sway = Math.sin(t * 1.1 + b.p) * 0.05, x = b.x, y = H + 30; c.fillStyle = 'rgba(14,20,10,0.94)'; c.beginPath(); c.moveTo(x - b.w, y); c.quadraticCurveTo(x + (b.lean + sway) * b.h * 0.5, y - b.h * 0.6 * S.capim, x + (b.lean + sway) * b.h, y - b.h * S.capim); c.quadraticCurveTo(x + (b.lean + sway) * b.h * 0.5 + b.w, y - b.h * 0.5 * S.capim, x + b.w, y); c.fill(); } c.restore(); }
  let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `rgba(8,10,18,${S.topo ?? 0.55})`); g.addColorStop(0.22, 'rgba(8,10,18,0)'); g.addColorStop(0.72, 'rgba(8,6,4,0)'); g.addColorStop(1, `rgba(8,6,4,${S.base ?? 0.7})`); c.fillStyle = g; c.fillRect(0, 0, W, H);
  g = c.createRadialGradient(W / 2, H * 0.5, 420, W / 2, H * 0.5, 1200); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(6,4,2,${S.vig ?? 0.72})`); c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (!DOTS) { const p = document.createElement('canvas'); p.width = p.height = 6; const q = p.getContext('2d'); q.fillStyle = 'rgba(255,255,255,0.045)'; q.beginPath(); q.arc(3, 3, 1.1, 0, 7); q.fill(); DOTS = c.createPattern(p, 'repeat'); }
  c.fillStyle = DOTS; c.fillRect(0, 0, W, H); }
const RED = '#e2362b', YEL = '#f2c23c';
const pop = (t, t0, d = 0.28) => t < t0 ? 0 : back((t - t0) / d);
function tagBox(c, txt, x, y, k, o = {}) { if (k <= 0) return; c.save(); c.translate(x, y); c.scale(k, k); c.font = `700 ${o.size ?? 54}px RC`; c.textAlign = 'center'; c.textBaseline = 'middle'; const w = c.measureText(txt).width + (o.pad ?? 44), h = (o.size ?? 54) * 1.5;
  c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 16; c.shadowOffsetY = 6; c.fillStyle = o.bg ?? RED; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, o.r ?? 8); c.fill(); c.shadowColor = 'transparent'; if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = 4; c.stroke(); }
  c.fillStyle = o.fg ?? '#fff'; c.fillText(txt, 0, 3); c.restore(); }
function bigText(c, txt, x, y, k, size = 150, color = '#fff') { if (k <= 0) return; c.save(); c.translate(x, y); c.scale(k, k); c.font = `700 ${size}px RC`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 22; c.shadowOffsetY = 8; c.strokeStyle = 'rgba(20,14,10,0.9)'; c.lineWidth = size * 0.09; c.strokeText(txt, 0, 0); c.shadowColor = 'transparent'; c.fillStyle = color; c.fillText(txt, 0, 0); c.restore(); }
const proj = (x, y, z) => { const v = V3(x, y, z).project(cam); return [(v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * H, v.z]; };
// etiqueta de recurso presa a um ponto do mundo, com linha
function resLabel(c, txt, wp, off, k, icon) { if (k <= 0) return; const [x, y] = proj(...wp), lx = cl(x + off[0], 190, W - 190), ly = y + off[1]; c.save(); c.globalAlpha = cl(k); c.strokeStyle = '#d8a84a'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.lineTo(lx, ly); c.stroke(); c.fillStyle = '#f2d79a'; c.beginPath(); c.arc(x, y, 9, 0, 7); c.fill(); c.stroke(); c.restore();
  tagBox(c, txt, lx, ly, k, { bg: 'rgba(18,14,10,0.9)', fg: '#f2d79a', size: 46, pad: 50, r: 10, stroke: '#d8a84a' }); }
// legenda: 2–4 palavras, caixa alta, sem caixa; *vermelho* e _amarelo_
const CAPS = [[0.0, 1.05, 'SE O APOCALIPSE *ZUMBI*'], [1.05, 2.0, 'COMEÇAR ENQUANTO VOCÊ'], [2.0, 3.0, 'TÁ NUMA FAZENDA...'], [3.0, 4.15, 'NÃO CORRE PRA CIDADE'], [4.25, 5.6, 'PORQUE, SEM PERCEBER,'], [5.6, 6.9, 'VOCÊ JÁ TÁ NUM DOS'], [6.9, 8.2, 'MELHORES LUGARES'], [8.2, 9.05, 'PRA SOBREVIVER'], [9.05, 10.2, 'MAS SÓ SE...']];
function captions(c, t, capY = 0.645) { if (CHUNKS) return capVoz(c, TN, capY); const cap = CAPS.find(k => t >= k[0] && t < k[1]); if (!cap) return; const parts = cap[2].split(/([*_][^*_]+[*_])/).filter(Boolean), y = H * capY; c.font = '700 60px RC'; c.textBaseline = 'middle'; c.textAlign = 'left'; c.lineJoin = 'round';
  const clean = s => s.replace(/[*_]/g, ''); let x = W / 2 - c.measureText(parts.map(clean).join('')).width / 2;
  for (const s of parts) { const tx = clean(s); c.shadowColor = 'rgba(0,0,0,0.7)'; c.shadowBlur = 12; c.shadowOffsetY = 4; c.strokeStyle = 'rgba(16,12,8,0.92)'; c.lineWidth = 8; c.strokeText(tx, x, y); c.shadowColor = 'transparent'; c.fillStyle = s[0] === '*' ? RED : s[0] === '_' ? YEL : '#fff'; c.fillText(tx, x, y); x += c.measureText(tx).width; } }

let TN = 0;
function capVoz(c, tn, capY) { const ch = CHUNKS.find(k => tn >= k.s - 0.04 && tn < k.fim); if (!ch) return; const y = H * capY; c.font = '700 62px RC'; c.textBaseline = 'middle'; c.textAlign = 'left'; c.lineJoin = 'round'; const sp = c.measureText(' ').width, ws = ch.parts.map(p => c.measureText(p.tx).width); let x = W / 2 - (ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1)) / 2;
  ch.parts.forEach((p, i) => { c.shadowColor = 'rgba(0,0,0,0.7)'; c.shadowBlur = 12; c.shadowOffsetY = 4; c.strokeStyle = 'rgba(16,12,8,0.92)'; c.lineWidth = 8; c.strokeText(p.tx, x, y); c.shadowColor = 'transparent'; c.fillStyle = p.col; c.fillText(p.tx, x, y); x += ws[i] + sp; }); }
// ---------- planos
// cada plano: a, b, run(t, u) → { cam:[pos, alvo], foco:[perto, longe], bl:[fundo, frente], hud(c,t) }
const C1 = 2.0, C2 = 4.15, C3 = 6.1, C4 = 9.1;
const RES = [['TERRA', [-8, 0, 17], [-40, 120]], ['ÁGUA', [-6, 5.5, 3], [-190, -60]], ['FERRAMENTAS', [12, 4, -6], [-30, -150]], ['COMBUSTÍVEL', [-10, 2.6, -5], [-120, -170]], ['COMIDA', [13, 0.5, 19], [-60, 130]]];
function houseTick(t, on = 1) { porchL.intensity = 7 * on * (0.92 + 0.08 * Math.sin(t * 11)); winL.intensity = 5 * on;
  SMOKE.forEach((m, i) => { const k = ((t * 0.16 + i / SMOKE.length) % 1); m.position.set(1.9 + k * 2.6 + Math.sin(k * 5 + i) * 0.25, 6.8 + k * 3.4, -0.8 + Math.sin(i * 2.1) * 0.2); m.scale.setScalar(0.16 + k * 0.55); m.material.opacity = 0.2 * Math.sin(Math.PI * Math.min(1, k * 1.15)); }); }
const HIDE = [];
const hideAll = () => { HIDE.forEach(f => f()); ze.root.visible = cao.root.visible = spoon.visible = phone.visible = false; farm.visible = kit.visible = false; fill.intensity = redL.intensity = 0; porchL.intensity = winL.intensity = 0; };
const SHOTS = [
  { a: 0, b: C1, sky: ['#f6c078', '#f6c078', '#f6c078'], vig: 0.8, rays: [330, 520, 0.085], base: 0.8, topo: 0.7, run(t) { kit.visible = true; setSun(KX, 0.8, 0, -3.2, 3.4, -7, 9, 40); sun.color.set(0xffb070); sun.intensity = 7; hemi.color.set(0x5a76a8); hemi.groundColor.set(0x2a1c12); hemi.intensity = 0.5; fill.position.set(KX + 1.4, 2.0, 2.6); fill.intensity = 1.6; scene.fog.color.set(0x402a1c); TINT.set(0.86, 0.72, 0.62);
      // Zé sentado comendo: a colher sobe e desce
      const k = 0.5 + 0.5 * Math.sin(t * 2.6 - 0.6), e = ss(k); ze.root.visible = true; ze.root.position.set(KX - 0.36, 0, 0); ze.root.rotation.y = Math.PI / 2;
      toca(ze, 'come', 0.9 + rt(0), { dy: 0.2 }) || ze.pose({ t, hipY: 0.565, footL: [0, 0.36], footR: [0, 0.42], lean: 0.2 - 0.05 * e, head: [0.22 - 0.1 * e, 0, 0], armR: [-0.05, -0.2, 0.14, -0.01, lerp(-0.16, 0.12, e), lerp(0.4, 0.25, e)], armL: [0.05, -0.22, 0.16, 0.0, -0.17, 0.42], look: [0, -0.6], mouth: e > 0.85 ? 'o' : '' });
      spoon.visible = true; ze.root.updateMatrixWorld(true); ze.arms.R.hand.getWorldPosition(spoon.position); spoon.rotation.set(0, 0, 1.2 - 0.5 * e); spoon.position.y += 0.02;
      cao.root.visible = true; cao.root.position.set(KX + 0.42, 0, 1.55); cao.root.rotation.y = -Math.PI / 2 - 0.35; cao.pose({ modo: 'dorme', t });
      return { cam: [[KX + 0.3 - 0.04 * t, 1.25, 4.5 - 0.2 * t], [KX + 0.25, 0.78, 0]], foco: [2.2, 7.4], bl: [2.5, 6] }; } },
  { a: C1, b: C2, sky: ['#f6c078', '#f6c078', '#f6c078'], vig: 0.85, rays: [760, 420, 0.06], base: 0.75, topo: 0.6, run(t) { const u = (t - C1) / (C2 - C1); kit.visible = true; setSun(KX, 1.2, 0, -3.2, 3.4, -7, 9, 40); sun.color.set(0xffb070); sun.intensity = 4.5; hemi.color.set(0x5a76a8); hemi.groundColor.set(0x2a1c12); hemi.intensity = 0.4; fill.intensity = 0; fill.color.set(0xffc890); fill.distance = 9; scene.fog.color.set(0x402a1c); TINT.set(0.6, 0.5, 0.48);
      // de costas, por cima do ombro: o celular sobe com o alerta
      const up = ss((t - C1) / 0.45); ze.root.visible = true; ze.root.position.set(KX + 0.12, 0, 0.9); ze.root.rotation.y = Math.PI + 0.12;
      (Z4 && toca(ze, 'celular', Math.min(0.5 + rt(C1), 3.6))) || ze.pose({ t, head: [0.16, -0.12, 0], armR: [-0.12, -0.16, 0.16, -0.14, lerp(-0.3, 0.1, up), lerp(0.2, 0.38, up)], lean: 0.03 });
      phone.visible = true; ze.root.updateMatrixWorld(true); const hp = V3(); ze.arms.R.hand.getWorldPosition(hp); phone.position.set(hp.x, hp.y + 0.16, hp.z - 0.012); phone.rotation.set(-0.12, Math.PI + 0.12 + 0.1, 0.05 * Math.sin(t * 9) * (1 - up)); phone.scale.setScalar(2.3);
      redL.position.set(hp.x, hp.y + 0.12, hp.z + 0.28); redL.intensity = 5.5 * up * (0.85 + 0.15 * Math.sin(t * 12)); U.rimCol.value.set(0xff3828);
      return Z3 ? { cam: [[KX + 1.05 + 0.03 * u, 1.72, 2.55 - 0.1 * u], [KX + 0.5, 1.5, 0.5]], foco: [1.5, 3.2], bl: [5, 8], capY: 0.8 } : { cam: [[KX + 0.66 + 0.02 * u, 1.62, 1.82 - 0.08 * u], [KX + 0.36, 1.58, 0.5]], foco: [1.08, 2.4], bl: [6, 9], capY: 0.8 }; } },
  { a: C2, b: C3, sunXY: [120, 700], rays: [120, 700, 0.1], capim: 1, fog: [22, 150], run(t) { const u = (t - C2) / (C3 - C2); farm.visible = true; dawn(); TINT.set(1, 0.96, 0.9); U.rimCol.value.set(0xffb060);
      return { cam: [[5.5 - 1.6 * u, 2.2 + 0.5 * u, 30 - 2.6 * u], [2.2, 2.9, 0]], foco: [12, 70], bl: [2.2, 4],
        hud(c) { tagBox(c, 'SURTO ZUMBI', W / 2, 330, pop(t, C2 + 0.15)); bigText(c, 'DIA 1', W / 2, 500, pop(t, C2 + 0.85), 170); tagBox(c, '6:42 DA MANHÃ', W / 2, 640, pop(t, C2 + 1.1), { bg: '#2a241c', fg: YEL, size: 40, r: 30 }); } }; } },
  { a: C3, b: C4, sunXY: [120, 700], rays: [-100, 500, 0.06], fog: [40, 260], vig: 0.6, base: 0.35, topo: 0.3, lift: true, run(t) { const u = ss((t - C3) / (C4 - C3)); farm.visible = true; dawn(); TINT.set(1, 0.96, 0.9);
      // a câmera sobe até a vista de cima; os recursos pipocam
      const h = lerp(3.2, 76, u), zz = lerp(27, 9, u); const k = i => pop(t, C3 + 1.25 + i * 0.3);
      return { cam: [[lerp(3.9, 2.6, u), h, zz], [2.6, lerp(2.9, 0, cl(u * 2.5)), lerp(0, 6, u)]], foco: [Math.max(6, h * 0.5), 200], bl: [0.5, 2],
        hud(c) { RES.forEach(([n, wp, off], i) => resLabel(c, n, wp, off, k(i))); } }; } },
  { a: C4, b: 99, rays: [-100, 500, 0.06], fog: [40, 260], vig: 0.6, base: 0.35, topo: 0.3, lift: true, run(t) { const u = (t - C4) / 1.0; farm.visible = true; dawn();
      return { cam: [[2.6 + 0.4 * u, 80 + 5 * u, 9.4], [2.6 + 0.4 * u, 0, 6.2]], foco: [30, 200], bl: [0, 0], hud(c) { RES.forEach(([n, wp, off]) => resLabel(c, n, wp, off, 1)); } }; } },
];
// tempo REAL (da voz) desde o instante de roteiro a: os planos são esticados pela fala, mas o corpo tem que andar na velocidade de verdade
const inv = b => { if (!WARP) return b; for (let i = 1; i < WARP.length; i++) if (b <= WARP[i][1]) { const [a0, b0] = WARP[i - 1], [a1, b1] = WARP[i]; return a0 + (a1 - a0) * (b - b0) / ((b1 - b0) || 1); } return WARP[WARP.length - 1][0]; }, rt = a => (WARP ? TN : TNOW) - inv(a);
const ANIM = Z4 ? (QS.get('anim') || 'gram') : 'liso';   // ?anim=liso | em2 | gram (em dois + gramática de anime)
const toca = (g, id, ts, o) => { const M = MV[id]; if (!M || !g.poseMov) return false; g.poseMov(M, Math.max(0, ts), { local: true, em2: ANIM === 'em2', gram: ANIM === 'gram', ...o }); return true; };
const CTX = { toca, rt,  THREE, W, H, scene, farm, kit, KX, add, BX, prism, M, L, T, ze, cao, phone, setSun, dawn, sun, hemi, fill, redL, TINT, U, tagBox, bigText, resLabel, proj, pop, RED, YEL, lerp, cl, ss, back, V3, R, rng, mkTex, paint, plain, mat, box, ball, cyl, mesh, between, SHOTS, CAPS, HIDE, FENCE, barn, house, criaGente: mkGente, Z2, Z3, Z4, G3, MV, criaCao, houseTick, RES, tree: typeof tree === 'function' ? tree : null, bush: typeof bush === 'function' ? bush : null };
for (const b of [bloco2, bloco3, bloco4, bloco5]) b(CTX);
if (CTX.END) window.END = CTX.END;
// ---------- voz: ?voz=A lê voz/narr_A.words.json; os planos são retemporizados pela fala (a voz nunca é acelerada)
const VOZ = new URLSearchParams(location.search).get('voz'), OFF = 0.3; let WORDS = null, WARP = null, CHUNKS = null;
if (VOZ) { const j = await (await fetch(`voz/narr_${VOZ}.words.json`)).json(); WORDS = (j.words || j).map(w => ({ w: w.w ?? w.word ?? w.text, s: w.start + OFF, e: w.end + OFF }));
  const nrm = x => x.toLowerCase().normalize('NFD').replace(/[^a-z0-9 ]/g, ''), W2 = WORDS.map(w => nrm(w.w)); let from = 0;
  const at = ph => { const q = nrm(ph).split(' '); for (let i = from; i <= W2.length - q.length; i++) if (q.every((x, k) => W2[i + k] === x)) { from = i + 1; return WORDS[i].s; } throw new Error('frase não achada na voz: ' + ph); };
  // [tempo antigo do corte, frase em que o plano passa a começar]
  const ANC = [[2.0, 'num sitio'], [4.15, 'porque sem'], [6.1, 'voce ja ta'], [9.1, 'pra sobreviver'], [10.0, 'mas so se'], [12.6, 'o primeiro instinto'], [15.0, 'pegar o trator'], [16.8, 'e exatamente'], [18.9, 'em vez disso'], [22.8, 'primeiro agua'], [24.6, 'porque o poco'], [26.35, 'quando a energia'], [27.0, 'o poco morre'],
    [28.0, 'ele tem um gerador'], [31.3, 'num sitio em'], [32.3, 'um motor'], [34.4, 'a centenas'], [36.0, 'e o ze nao'], [37.6, 'doze vacas'], [38.9, 'um cavalo'], [40.0, 'e um caramelo'], [42.9, 'ou seja'], [44.9, 'quase impossivel'], [45.9, 'entao ele tranca'], [47.3, 'a porteira'], [48.6, 'traz os bichos'], [49.6, 'e comeca a contar'], [50.6, 'tudo que tem'],
    [53.2, 'so tinha'], [55.0, 'um problema'], [56.0, 'alguem ja'], [57.0, 'do lado de dentro']];
  WARP = [[0, 0], ...ANC.map(([o, ph]) => [at(ph) - 0.12, o])]; const fim = WORDS[WORDS.length - 1].e + 0.55; WARP.push([fim, 58.8], [fim + 2.9, 61.5]); window.END = fim + 2.9;
  for (let i = 1; i < WARP.length; i++) if (WARP[i][0] <= WARP[i - 1][0]) throw new Error('âncora fora de ordem: ' + i);
  // legenda pela fala: 2–4 palavras, quebra na pontuação
  const REDW = new Set(['zumbi', 'idiota', 'nao vai', 'morre', 'impossivel', 'problema', 'dentro', 'cerca', 'vai']), YELW = new Set(['trinta', 'minutos', 'agua', 'eletrica', 'silencio', 'motor', 'semanas', 'quieto', 'tudo']);
  CHUNKS = []; let cur = []; const flush = () => { if (cur.length) { CHUNKS.push({ s: cur[0].s, e: cur[cur.length - 1].e, ws: cur }); cur = []; } };
  WORDS.forEach((w, i) => { cur.push(w); const len = cur.map(x => x.w).join(' ').length, pt = /[.,:!?…]$/.test(w.w), nx = WORDS[i + 1]; if (pt || cur.length >= 4 || len >= 17 || (nx && nx.s - w.e > 0.3)) flush(); }); flush();
  CHUNKS.forEach((c, i) => { c.fim = Math.min(c.e + 0.7, CHUNKS[i + 1] ? CHUNKS[i + 1].s : c.e + 0.7); { const ct = WARP.find(w => w[0] > c.s + 0.05); if (ct) c.fim = Math.min(c.fim, Math.max(c.e + 0.05, ct[0])); } c.parts = c.ws.map(w => { const k = nrm(w.w); return { tx: w.w.toUpperCase(), col: (REDW.has(k) && !(k === 'vai' && !/\.$/.test(w.w))) ? RED : YELW.has(k) && k !== 'tudo' ? YEL : '#fff' }; }); if (c.parts.length === 2 && /^VAI\./.test(c.parts[1].tx)) c.parts.forEach(q => q.col = RED); }); }
const warp = tn => { if (!WARP) return tn; for (let i = 1; i < WARP.length; i++) if (tn <= WARP[i][0]) { const [a0, b0] = WARP[i - 1], [a1, b1] = WARP[i]; return b0 + (b1 - b0) * (tn - a0) / (a1 - a0) - (i < WARP.length - 1 && tn > a1 - 1e-4 ? 1e-4 : 0); } return WARP[WARP.length - 1][1]; };
const _t = V3();
let TNOW = 0;
function draw(t) { TNOW = t;
  const S = SHOTS.find(s => t >= s.a && t < s.b); hideAll(); U.rimCol.value.set(0xffb060);
  const r = S.run(t);
  if (S.lift) { hemi.intensity = 1.25; sun.intensity = 4.4; }
  if (r.flat) { X.filter = 'none'; X.globalCompositeOperation = 'source-over'; X.globalAlpha = 1; r.flat(X); if (!DOTS) post(X, t, { vig: 0 }); else { X.fillStyle = DOTS; X.fillRect(0, 0, W, H); } captions(X, t, r.capY); return; }
  cam.position.set(...r.cam[0]); cam.up.set(0, 1, 0); if (Math.abs(r.cam[0][0] - r.cam[1][0]) + Math.abs(r.cam[0][2] - r.cam[1][2]) < 6 && r.cam[0][1] > 30) cam.up.set(0, 0, -1); cam.lookAt(_t.set(...r.cam[1]));
  scene.fog.near = S.fog?.[0] ?? 10; scene.fog.far = S.fog?.[1] ?? 60;
  R3.shadowMap.needsUpdate = true;
  const [n, f] = r.foco, cuts = [[f - 0.3, 400, r.bl[0]], [n, f, 0], [0.1, n + 0.15, r.bl[1]]];
  cuts.forEach(([a, b], i) => { cam.near = a; cam.far = b; cam.updateProjectionMatrix(); R3.clear(); R3.render(scene, cam); const lc = lay[i].getContext('2d'); lc.clearRect(0, 0, W, H); lc.drawImage(gl, 0, 0); });
  X.filter = 'none'; X.globalCompositeOperation = 'source-over'; X.globalAlpha = 1; sky(X, S);
  cuts.forEach(([, , b], i) => { X.filter = b ? `blur(${b}px)` : 'none'; X.drawImage(lay[i], 0, 0); }); X.filter = 'none';
  { const bc = BLOOM.getContext('2d'); bc.filter = 'none'; bc.globalCompositeOperation = 'copy'; bc.drawImage(out, 0, 0, W / 4, H / 4);
    X.save(); X.globalCompositeOperation = 'screen'; X.globalAlpha = 0.5; X.filter = 'brightness(0.78) contrast(2.6) blur(12px)'; X.drawImage(BLOOM, 0, 0, W, H); X.globalAlpha = 0.36; X.filter = 'brightness(0.72) contrast(3) blur(40px)'; X.drawImage(BLOOM, 0, 0, W, H); X.restore(); X.filter = 'none'; }
  cam.near = 0.1; cam.far = 400; cam.updateProjectionMatrix();
  if (S.mono) { const g = MONO.getContext('2d'); g.filter = 'none'; g.globalCompositeOperation = 'copy'; g.drawImage(out, 0, 0); X.filter = 'grayscale(1) contrast(1.2)'; X.drawImage(MONO, 0, 0); X.filter = 'none'; }
  if (S.lift) { const g = MONO.getContext('2d'); g.filter = 'none'; g.globalCompositeOperation = 'copy'; g.drawImage(out, 0, 0); X.filter = 'contrast(1.18) saturate(1.12) brightness(1.18)'; X.drawImage(MONO, 0, 0); X.filter = 'none'; }
  post(X, t, S);
  if (S.lift) { X.save(); X.strokeStyle = 'rgba(242,215,154,0.07)'; X.lineWidth = 2; for (let x = 90; x < W; x += 90) { X.beginPath(); X.moveTo(x, 0); X.lineTo(x, H); X.stroke(); } for (let y = 60; y < H; y += 90) { X.beginPath(); X.moveTo(0, y); X.lineTo(W, y); X.stroke(); }
    X.strokeStyle = 'rgba(242,215,154,0.55)'; X.lineWidth = 5; for (const [x, y, sx, sy] of [[50, 170, 1, 1], [W - 50, 170, -1, 1], [50, H - 330, 1, -1], [W - 50, H - 330, -1, -1]]) { X.beginPath(); X.moveTo(x + sx * 70, y); X.lineTo(x, y); X.lineTo(x, y + sy * 70); X.stroke(); } X.restore(); }
  if (r.hud) r.hud(X); captions(X, t, r.capY);
}
window.seek = async tn => { TN = tn; draw(warp(tn)); };
document.fonts.load('700 60px RC').then(() => { draw(0); draw(0); window.READY = true; });
