// 34 — "Antes da chuva": a mensageira Ivi vê a chuva subindo o vale, corre pela mata de outono com a lanterna,
// atravessa a ponte do riacho e pendura a luz no alpendre da cabana no instante em que o temporal chega.
// Motor: three.js (troncos torneados, sol baixo com sombra, névoa, 3 passes de profundidade
// com desfoque, boneco chapado de 2 tons + fio de luz + trama de tecido no shader, bloom), cenário e boneco novos.
import * as THREE from 'three';
import { criaIvi, TINT, U as UB } from './mensageira3d.js';

const W = 1080, H = 1920, END = 31.0; window.END = END;
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k, ss = k => { k = cl(k); return k * k * (3 - 2 * k); };
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
function rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = rng(34);
const out = document.getElementById('c'), X = out.getContext('2d');
const gl = document.createElement('canvas'); gl.width = W; gl.height = H;
const R3 = new THREE.WebGLRenderer({ canvas: gl, antialias: true, alpha: true, preserveDrawingBuffer: true });
R3.setSize(W, H, false); R3.setClearColor(0x000000, 0); R3.shadowMap.enabled = true; R3.shadowMap.type = THREE.PCFSoftShadowMap; R3.shadowMap.autoUpdate = false;
const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x5d5a55, 10, 140);
const cam = new THREE.PerspectiveCamera(36, W / H, 0.1, 400);
const mkTex = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const ld = new THREE.TextureLoader(), img = (f, rep = 1) => { const t = ld.load(f); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8; return t; };

// ---------- terreno: mata em platô, vale caindo para -x, riacho cruzando o caminho, clareira da cabana
const pathZ = x => 0.55 * Math.sin(x * 0.14) - 0.25 * Math.sin(x * 0.31 + 1);
const creekX = z => 16.5 + Math.sin(z * 0.13) * 1.4 + Math.sin(z * 0.045 + 0.4) * 2.2 - Math.sin(0.4) * 2.2;
const CAB = { x: 31.2, z: 0.0 };
function hgt(x, z) {
  let y = Math.sin(x * 0.21 + z * 0.13) * 0.22 + Math.sin(x * 0.07 - z * 0.19) * 0.4 + Math.sin(z * 0.33 + 1) * 0.1 + Math.sin(x * 0.9 + z * 0.7) * 0.04;
  y *= lerp(0.08, 1, ss((Math.abs(z - pathZ(x)) - 0.9) / 4));
  y *= ss((Math.hypot(x - CAB.x, z - CAB.z) - 6.5) / 5);
  y -= 15 * ss((-x - 4) / 34) + 2.2 * ss((-x - 3) / 5);
  const dc = Math.abs(x - creekX(z)); y -= 1.3 * (1 - ss((dc - 1.0) / 1.7));
  return y;
}
const BR = { x0: 13.3, x1: 19.7 };
const deckY = x => 0.14 + 0.24 * Math.sin(Math.PI * cl((x - BR.x0) / (BR.x1 - BR.x0)));
const PORCH = { x0: 27.0, y: 0.36 };
function groundAt(x) { const z = pathZ(x); if (x > BR.x0 - 0.3 && x < BR.x1 + 0.3) return Math.max(hgt(x, z), deckY(x)); if (x > PORCH.x0 - 0.75) return lerp(hgt(x, z), x < PORCH.x0 - 0.3 ? 0.18 : PORCH.y, ss((x - PORCH.x0 + 0.75) / 0.12)); return hgt(x, z); }

const groundTex = mkTex(1024, 1024, (c, w, h) => { c.fillStyle = '#9a8a70'; c.fillRect(0, 0, w, h); const r = rng(3);
  for (let i = 0; i < 1400; i++) { const k = r(); c.fillStyle = k < 0.35 ? `rgba(70,40,18,${0.08 + r() * 0.1})` : k < 0.7 ? `rgba(235,140,50,${0.1 + r() * 0.14})` : k < 0.85 ? `rgba(200,60,30,${0.08 + r() * 0.12})` : `rgba(240,200,90,${0.1 + r() * 0.12})`;
    c.save(); c.translate(r() * w, r() * h); c.rotate(r() * 6.3); const s = 4 + r() * 10; c.beginPath(); c.moveTo(-s, 0); c.quadraticCurveTo(0, -s * 0.6, s, 0); c.quadraticCurveTo(0, s * 0.6, -s, 0); c.fill(); c.restore(); }
  for (let i = 0; i < 200; i++) { c.strokeStyle = `rgba(60,40,20,${0.15 + r() * 0.2})`; c.lineWidth = 1 + r() * 2; const x = r() * w, y = r() * h; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 40, y + (r() - 0.5) * 40); c.stroke(); } });
groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping; groundTex.repeat.set(40, 40);
let groundMat;
{ const g = new THREE.PlaneGeometry(170, 130, 340, 260); g.rotateX(-Math.PI / 2); g.translate(5, 0, 0);
  const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color(), r = rng(7);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = hgt(x, z); p.setY(i, y);
    const dp = Math.abs(z - pathZ(x)), dc = Math.abs(x - creekX(z)), slope = Math.abs(hgt(x + 0.3, z) - y) + Math.abs(hgt(x, z + 0.3) - y);
    c.setHSL(0.09 + r() * 0.03, 0.42, 0.38 + r() * 0.05);                                                 // folhiço cor de ferrugem
    if (r() < 0.25) c.setHSL(0.16 + r() * 0.05, 0.32, 0.33);                                             // capim seco oliva
    if (dp < 0.85 && x > -4 && x < 27) c.setHSL(0.075, 0.3, 0.46 + r() * 0.04);                       // trilha batida
    if (dc < 2.4) c.setHSL(0.07, 0.25, 0.22 + r() * 0.04);                                              // barranco de lama
    if (slope > 0.5) c.lerp(new THREE.Color(0x5a4a3c), 0.5);
    if (x < -10) c.setHSL(0.08 + r() * 0.06, 0.4, 0.32 + r() * 0.06);
    c.toArray(col, i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  groundMat = new THREE.MeshLambertMaterial({ map: groundTex, vertexColors: true, flatShading: true });
  const m = new THREE.Mesh(g, groundMat); m.receiveShadow = true; scene.add(m); }

// ---------- riacho: faixa que acompanha o leito, correnteza desenhada em textura que desliza
const waterTex = mkTex(256, 1024, (c, w, h) => { c.fillStyle = '#3d5a5e'; c.fillRect(0, 0, w, h); const r = rng(11);
  for (let i = 0; i < 260; i++) { const x = r() * w, y = r() * h, l = 20 + r() * 90; c.strokeStyle = `rgba(${r() < 0.3 ? '255,190,120' : '170,210,210'},${0.15 + r() * 0.35})`; c.lineWidth = 1.5 + r() * 3; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (r() - 0.5) * 12, y + l / 2, x + (r() - 0.5) * 6, y + l); c.stroke(); } });
waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping; waterTex.repeat.set(1, 14);
const water = (() => { const g = new THREE.PlaneGeometry(3.4, 130, 1, 260); g.rotateX(-Math.PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i); p.setX(i, p.getX(i) + creekX(z)); p.setY(i, -0.9); }
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: waterTex, color: 0xb0c4c4 })); scene.add(m); return m; })();
const reflTex = mkTex(64, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,190,90,0)'); g.addColorStop(0.5, 'rgba(255,180,80,1)'); g.addColorStop(1, 'rgba(255,190,90,0)'); c.fillStyle = g; c.fillRect(w * 0.3, 0, w * 0.4, h); });
const refl = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 1.6), new THREE.MeshBasicMaterial({ map: reflTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); refl.rotation.x = -Math.PI / 2; scene.add(refl);

// ---------- materiais de madeira e pedra
const barkT = img('tex/bark.jpg'), woodT = img('tex/wood.jpg');
const L = (map, color, o = {}) => new THREE.MeshLambertMaterial({ map, color, ...o });
const woodM = L(woodT, 0xb89878), woodD = L(woodT, 0x8a7060), iron = L(null, 0x2a2624);
function rock(x, z, s, sy = 0.55) { const g = new THREE.IcosahedronGeometry(1, 1).toNonIndexed(); const p = g.attributes.position, col = new Float32Array(p.count * 3), cA = new THREE.Color(0x5c5850), cB = new THREE.Color(0x4a5a2a), r = rng((x * 100 + z * 7) | 0);
  for (let i = 0; i < p.count; i += 3) { const y = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, c = y > 0.35 && r() < 0.7 ? cB : cA.clone().multiplyScalar(0.85 + r() * 0.3); for (let k = 0; k < 3; k++) c.toArray(col, (i + k) * 3); }
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (0.85 + Math.sin(i * 1.7) * 0.0), p.getY(i), p.getZ(i));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })); m.scale.set(s, s * sy, s * (0.7 + R() * 0.4)); m.rotation.y = R() * 6; m.position.set(x, hgt(x, z) - s * 0.15, z); m.castShadow = m.receiveShadow = true; scene.add(m); return m; }

// ---------- árvores de outono: tronco torneado com casca pintada + copa em cachos de cartões de folha (instanciados)
const leafTex = mkTex(256, 256, (g, w, h) => { const r = rng(57); g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; g.beginPath(); g.arc(w / 2, h / 2, w * 0.27, 0, 7); g.fill();
  for (let i = 0; i < 150; i++) { const a = r() * 6.283, d = (0.18 + 0.82 * Math.sqrt(r())) * w * 0.43, x = w / 2 + Math.cos(a) * d, y = h / 2 + Math.sin(a) * d, s = 9 + r() * 10; g.save(); g.translate(x, y); g.rotate(a + (r() - 0.5) * 1.2); g.beginPath(); g.moveTo(-s, 0); g.quadraticCurveTo(0, -s * 0.7, s * 1.25, 0); g.quadraticCurveTo(0, s * 0.7, -s, 0); g.fill(); g.restore(); } });
const trunkGeo = (() => { const pts = []; for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push(new THREE.Vector2(0.24 * (1 + 0.9 * Math.pow(1 - u, 3)) * (1 - 0.4 * u), u * 4.2)); } const g = new THREE.LatheGeometry(pts, 14);
  const uv = g.attributes.uv, pos = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2, pos.getY(i) / 2.4); return g; })();
const barkM = new THREE.MeshLambertMaterial({ map: barkT, color: 0xc8b8a8 });
const LEAF = [], CORE = [], TRUNKS = [], BRANCH = [];
const PAL = [[0.02, 0.7, 0.36], [0.055, 0.8, 0.44], [0.09, 0.8, 0.5], [0.12, 0.75, 0.52], [0.035, 0.62, 0.3], [0.18, 0.45, 0.36]];
const _dir = V3(0, 0, 1), ZAX = V3(0, 0, 1), _q = new THREE.Quaternion(), _o = new THREE.Object3D();
function copa(T, cx, cy, cz, rad, n, pal) {
  CORE.push({ p: V3(cx, cy, cz), s: rad * 0.62, c: new THREE.Color().setHSL(pal[0], pal[1] * 0.8, pal[2] * 0.35) });
  for (let i = 0; i < n; i++) { const a = (i + R()) / n * 6.283 * 3.1, y = -0.55 + 1.5 * ((i + R()) / n), rr = Math.sqrt(Math.max(0.05, 1 - Math.min(0.95, y * y)));
    _dir.set(Math.cos(a) * rr, y, Math.sin(a) * rr).normalize(); const p = V3(cx + _dir.x * rad * 0.8, cy + _dir.y * rad * 0.72, cz + _dir.z * rad * 0.8);
    _dir.x += (R() - 0.5) * 0.5; _dir.y += (R() - 0.5) * 0.5 + 0.15; _dir.z += (R() - 0.5) * 0.5; const q = new THREE.Quaternion().setFromUnitVectors(ZAX, _dir.normalize()); q.multiply(_q.setFromAxisAngle(ZAX, R() * 6.283));
    const lv = y > 0.55 ? 1.18 : y > 0.15 ? 1.05 : y > -0.2 ? 0.88 : 0.7, k = rad * (1.0 + R() * 0.5);
    LEAF.push({ p, q, k, c: new THREE.Color().setHSL(pal[0] + (R() - 0.5) * 0.02, pal[1], cl(pal[2] * lv + (R() - 0.5) * 0.05)), T }); } }
function tree(x, z, s = 1) { const T = { x, z, s, sway: R() * 6.28 }; const y0 = hgt(x, z), ry = R() * 6.28, cs = Math.cos(ry), sn = Math.sin(ry);
  const pal = PAL[(R() * PAL.length) | 0]; TRUNKS.push({ x, y: y0, z, s, ry });
  const C = [[0, 5.5, 0, 1.75, 30], [1.9, 4.6, 0.4, 1.3, 22], [-1.7, 4.7, 0.7, 1.35, 22], [0.5, 4.5, -1.8, 1.3, 22], [-0.6, 4.4, 1.9, 1.25, 20], [0.9, 6.3, -0.5, 1.0, 14], [-0.9, 6.2, 0.3, 1.0, 14]];
  for (const [cx, cy, cz, r, n] of C) { const lx = (cx + (R() - 0.5) * 0.3), lz = (cz + (R() - 0.5) * 0.3); copa(T, x + (lx * cs + lz * sn) * s, y0 + (cy + (R() - 0.5) * 0.3) * s, z + (-lx * sn + lz * cs) * s, r * s * (0.92 + R() * 0.16), n, pal);
    if (cx || cz) BRANCH.push({ a: V3(x, y0 + 3.1 * s, z), b: V3(x + (cx * cs + cz * sn) * 0.8 * s, y0 + (cy - 0.5) * s, z + (-cx * sn + cz * cs) * 0.8 * s), r: 0.13 * s }); }
  return T; }
const TREES = [];
const livre = (x, z, m = 0) => Math.abs(z - pathZ(x)) > 2.6 + m && Math.abs(x - creekX(z)) > 3.0 + m && Math.hypot(x - CAB.x, z - CAB.z) > 7.5 + m && !TREES.some(t => Math.hypot(t.x - x, t.z - z) < 3.4);
// árvores que compõem planos específicos
for (const [x, z, s] of [[-2.2, -3.6, 1.05], [2.6, 3.4, 1.0], [6.5, -3.4, 0.95], [9.5, 3.6, 1.1], [11.2, -3.8, 1.0], [12.0, 4.4, 0.95], [21.5, -3.6, 1.0], [22.5, 4.0, 1.1], [25.2, -5.0, 1.0], [26.0, 5.6, 1.05], [34.5, -6.0, 1.1], [36.5, 4.5, 1.0], [33.0, 7.2, 0.95], [29.5, -8.0, 1.0]]) TREES.push(tree(x, z, s));
for (let i = 0; i < 260 && TREES.length < 95; i++) { const x = -3 + R() * 46, z = (R() < 0.5 ? -1 : 1) * (3 + Math.pow(R(), 0.8) * 30); if (!livre(x, z)) continue; TREES.push(tree(x, z, 0.85 + R() * 0.35)); }
{ const im = new THREE.InstancedMesh(trunkGeo, barkM, TRUNKS.length); TRUNKS.forEach((t, i) => { _o.position.set(t.x, t.y - 0.1, t.z); _o.rotation.set(0, t.ry, 0); _o.scale.set(1.2 * t.s, t.s, 1.2 * t.s); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix); }); im.castShadow = im.receiveShadow = true; scene.add(im);
  const bg = new THREE.CylinderGeometry(0.5, 1, 1, 7, 1); const bm = new THREE.InstancedMesh(bg, barkM, BRANCH.length), d = V3();
  BRANCH.forEach((b, i) => { d.subVectors(b.b, b.a); const l = d.length(); _o.position.copy(b.a).addScaledVector(d, 0.5); _o.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); _o.scale.set(b.r, l, b.r); _o.updateMatrix(); bm.setMatrixAt(i, _o.matrix); }); bm.castShadow = true; scene.add(bm);
  const cm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), CORE.length);
  CORE.forEach((c, i) => { _o.position.copy(c.p); _o.quaternion.identity(); _o.scale.set(c.s, c.s * 0.9, c.s); _o.updateMatrix(); cm.setMatrixAt(i, _o.matrix); cm.setColorAt(i, c.c); }); cm.castShadow = true; scene.add(cm); }
const leafMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshLambertMaterial({ map: leafTex, alphaTest: 0.4, side: THREE.DoubleSide, color: 0xffffff }), LEAF.length);
leafMesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: leafTex, alphaTest: 0.4 });
LEAF.forEach((l, i) => leafMesh.setColorAt(i, l.c)); leafMesh.castShadow = true; scene.add(leafMesh);
function swayLeaves(t, wind) { LEAF.forEach((l, i) => { const T = l.T, w = Math.sin(t * 1.3 + T.sway) * 0.04 * wind + Math.sin(t * 3.1 + i) * 0.015 * wind; _o.position.set(l.p.x + w * (l.p.y - hgt(T.x, T.z)) * 0.3, l.p.y, l.p.z + w * 0.4); _o.quaternion.copy(l.q); _o.scale.set(l.k, l.k, 1); _o.updateMatrix(); leafMesh.setMatrixAt(i, _o.matrix); }); leafMesh.instanceMatrix.needsUpdate = true; }
// árvores do vale (longe): cones e bolas facetadas
{ const coneG = new THREE.ConeGeometry(1, 1, 6), ballG = new THREE.IcosahedronGeometry(1, 0), N = 900;
  const cm = new THREE.InstancedMesh(coneG, new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), N), bm = new THREE.InstancedMesh(ballG, new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), N), c = new THREE.Color(); let nc = 0, nb = 0;
  for (let i = 0; i < 2600 && (nc < N || nb < N); i++) { const x = -78 + R() * 72, z = -62 + R() * 124; if (x > -15) continue; const y = hgt(x, z), s = 1.6 + R() * 2.2;
    if (R() < 0.45 && nc < N) { _o.position.set(x, y + s * 1.6, z); _o.rotation.set(0, R() * 3, 0); _o.scale.set(s * 0.8, s * 3.6, s * 0.8); _o.updateMatrix(); cm.setMatrixAt(nc, _o.matrix); cm.setColorAt(nc++, c.setHSL(0.3 + R() * 0.08, 0.3, 0.2 + R() * 0.06)); }
    else if (nb < N) { _o.position.set(x, y + s * 1.4, z); _o.rotation.set(R(), R() * 3, 0); _o.scale.set(s * 1.4, s * 1.3, s * 1.4); _o.updateMatrix(); bm.setMatrixAt(nb, _o.matrix); const p = PAL[(R() * 5) | 0]; bm.setColorAt(nb++, c.setHSL(p[0], p[1] * 0.8, p[2] * 0.8)); } }
  cm.count = nc; bm.count = nb; cm.castShadow = bm.castShadow = true; cm.receiveShadow = bm.receiveShadow = true; scene.add(cm, bm);
  const hill = new THREE.MeshLambertMaterial({ color: 0x3c4450, flatShading: true }); for (let i = 0; i < 14; i++) { const a = Math.PI * (0.55 + i / 13 * 0.9), r = 120 + R() * 40, m = new THREE.Mesh(new THREE.IcosahedronGeometry(40 + R() * 25, 1), hill); m.position.set(Math.cos(a) * r - 10, -38 + R() * 10, Math.sin(a) * r); m.scale.y = 0.6 + R() * 0.4; scene.add(m); } }

// ---------- vegetação baixa: capim seco e folhas caídas em cartões instanciados; samambaias secas
const tuftTex = mkTex(256, 256, (g, w, h) => { const r = rng(31); g.clearRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineCap = 'round'; for (let i = 0; i < 16; i++) { const a = (i / 15 - 0.5) * 1.5 + (r() - 0.5) * 0.2, len = h * (0.55 + r() * 0.4), x0 = w / 2 + (r() - 0.5) * 50; g.lineWidth = 7 + r() * 7;
  for (let k = 0; k < 2; k++) { g.beginPath(); g.moveTo(x0, h); g.quadraticCurveTo(x0 + Math.sin(a) * len * 0.35, h - len * 0.6, x0 + Math.sin(a) * len * 0.95, h - Math.cos(a * 0.7) * len); g.lineWidth *= 0.45; g.stroke(); } } });
tuftTex.wrapS = tuftTex.wrapT = THREE.ClampToEdgeWrapping;
function crossGeo(wd, ht) { const pos = [], uv = [], nor = [], idx = []; for (let k = 0; k < 2; k++) { const c = Math.cos(k * Math.PI / 2 + 0.4), sn = Math.sin(k * Math.PI / 2 + 0.4), b = k * 4;
    for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { pos.push((u - 0.5) * wd * c, v * ht, (u - 0.5) * wd * sn); uv.push(u, v); nor.push(0, 1, 0); } idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g; }
{ const n = 9000, im = new THREE.InstancedMesh(crossGeo(0.62, 0.55), new THREE.MeshLambertMaterial({ map: tuftTex, alphaTest: 0.45, side: THREE.DoubleSide }), n), c = new THREE.Color(); let k = 0;
  for (let i = 0; i < n * 3 && k < n; i++) { const x = -6 + R() * 46, z = -22 + R() * 44, dp = Math.abs(z - pathZ(x)); if ((x > 4 && x < 14 && z - pathZ(x) < -3.4 && z - pathZ(x) > -5.8) || (dp < 0.75 && x < 27) || Math.abs(x - creekX(z)) < 1.4 || (x > 26.5 && x < 34 && Math.abs(z) < 3.6)) continue;
    _o.position.set(x, hgt(x, z) - 0.03, z); _o.rotation.set(0, R() * 6.28, 0); const s = (0.7 + R() * 0.8) * (dp < 1.6 ? 0.7 : 1); _o.scale.set(s, s * (0.8 + R() * 0.6), s); _o.updateMatrix(); im.setMatrixAt(k, _o.matrix); im.setColorAt(k++, c.setHSL(0.1 + R() * 0.07, 0.45 + R() * 0.2, 0.38 + R() * 0.16)); }
  im.count = k; im.receiveShadow = true; scene.add(im); }
const oneLeaf = mkTex(64, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(4, 32); g.quadraticCurveTo(30, 4, 60, 32); g.quadraticCurveTo(30, 60, 4, 32); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(6, 32); g.lineTo(58, 32); g.stroke(); });
const leafMatSmall = new THREE.MeshLambertMaterial({ map: oneLeaf, alphaTest: 0.4, side: THREE.DoubleSide });
{ const n = 7000, im = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.16, 0.16), leafMatSmall, n), c = new THREE.Color(); let k = 0;
  for (let i = 0; i < n * 2 && k < n; i++) { const x = -5 + R() * 40, z = pathZ(x) + (R() - 0.5) * 12; if (x > BR.x0 - 0.5 && x < BR.x1 + 0.5 && Math.abs(z - pathZ(x)) < 1.2) continue; if (Math.abs(x - creekX(z)) < 1.6) continue;
    _o.position.set(x, hgt(x, z) + 0.025, z); _o.rotation.set(-Math.PI / 2 + (R() - 0.5) * 0.5, 0, R() * 6.28); const s = 0.8 + R() * 0.8; _o.scale.set(s, s, s); _o.updateMatrix(); im.setMatrixAt(k, _o.matrix); const p = PAL[(R() * 5) | 0]; im.setColorAt(k++, c.setHSL(p[0], p[1], p[2] * (0.75 + R() * 0.4))); }
  im.count = k; im.receiveShadow = true; scene.add(im); }
const frondTex = mkTex(512, 160, (c, w, h) => { c.strokeStyle = '#ffffff'; c.fillStyle = '#ffffff'; c.lineWidth = 5; c.beginPath(); c.moveTo(4, h / 2); c.lineTo(w - 6, h / 2); c.stroke();
  for (let i = 0; i < 26; i++) { const u = i / 25, x = 18 + u * (w - 40), l = (h * 0.47) * Math.sin(Math.PI * (0.12 + u * 0.86)) * (1 - u * 0.25);
    for (const s of [-1, 1]) { c.save(); c.translate(x, h / 2); c.rotate(s * 1.2); c.beginPath(); c.ellipse(l * 0.5, 0, l * 0.5, 8.5 - u * 4, 0, 0, 7); c.fill(); c.restore(); } } });
const FG = (() => { const g = new THREE.PlaneGeometry(1, 0.31, 10, 1); g.translate(0.5, 0, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, p.getY(i)); p.setY(i, 1.0 * x - 0.85 * x * x); } g.computeVertexNormals(); return g; })();
const FERNS = [];
function fern(x, z, s) { const g = new THREE.Group(), n = 7 + (R() * 4 | 0), a0 = R() * 6.28, hue = 0.06 + R() * 0.06;
  for (let i = 0; i < n; i++) { const col = new THREE.Color().setHSL(hue + R() * 0.02, 0.65, 0.34 + R() * 0.1); const m = new THREE.MeshLambertMaterial({ map: frondTex, alphaTest: 0.5, side: THREE.DoubleSide, color: col, emissive: col.clone().multiplyScalar(0.25), emissiveMap: frondTex });
    const f = new THREE.Mesh(FG, m); f.rotation.y = a0 + i / n * 6.28 + (R() - 0.5) * 0.5; f.scale.setScalar(s * (0.75 + R() * 0.5)); f.receiveShadow = true; g.add(f); }
  g.position.set(x, hgt(x, z) + 0.02, z); scene.add(g); FERNS.push(g); return g; }
for (let i = 0; i < 70; i++) { const x = -3 + R() * 32, z = pathZ(x) + (R() < 0.5 ? -1 : 1) * (1.1 + R() * 4); if (Math.abs(x - creekX(z)) < 2.6 || (x > 26 && Math.abs(z) < 4)) continue; fern(x, z, 0.45 + R() * 0.35); }
for (const [x, dz] of [[7.2, -2.0], [8.4, -1.6], [9.6, -2.3], [10.6, -1.5], [5.6, -1.9], [3.0, 1.4], [-0.6, 1.5], [1.2, -1.6]]) fern(x, pathZ(x) + dz, 0.75);
for (let i = 0; i < 22; i++) { const z = (R() - 0.5) * 30, x = creekX(z) + (R() < 0.5 ? -1 : 1) * (1.2 + R() * 1.0); rock(x, z, 0.25 + R() * 0.4); }
rock(15.3, pathZ(15.3) - 2.6, 0.55); rock(17.6, pathZ(17.6) - 3.2, 0.5); rock(-3.4, 0.9, 0.7, 0.5); rock(-4.4, -1.3, 0.9, 0.45);

// ---------- ponte de tábuas em arco com corrimão
{ const G = new THREE.Group(); scene.add(G); const n = 30, z0 = pathZ((BR.x0 + BR.x1) / 2);
  for (let i = 0; i < n; i++) { const x = lerp(BR.x0, BR.x1, (i + 0.5) / n), z = pathZ(x); const p = new THREE.Mesh(new THREE.BoxGeometry((BR.x1 - BR.x0) / n - 0.025, 0.06, 1.25 + (R() - 0.5) * 0.08), i % 3 ? woodM : woodD);
    const sl = (deckY(x + 0.01) - deckY(x - 0.01)) / 0.02; p.position.set(x, deckY(x) - 0.03, z + (R() - 0.5) * 0.03); p.rotation.set(0, -Math.atan(0.55 * 0.14 * Math.cos(x * 0.14)), Math.atan(sl)); p.castShadow = p.receiveShadow = true; G.add(p); }
  for (const s of [-1, 1]) { for (let i = 0; i <= 6; i++) { const x = lerp(BR.x0 + 0.1, BR.x1 - 0.1, i / 6), z = pathZ(x) + s * 0.66, y0 = Math.min(hgt(x, z), -0.9); const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1, 7), woodD); post.position.set(x, (y0 + deckY(x) + 0.95) / 2, z); post.scale.y = deckY(x) + 0.95 - y0; post.castShadow = true; G.add(post); }
    const pts = []; for (let i = 0; i <= 20; i++) { const x = lerp(BR.x0 + 0.1, BR.x1 - 0.1, i / 20); pts.push(V3(x, deckY(x) + 0.92, pathZ(x) + s * 0.66)); } const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.035, 6), woodM); rail.castShadow = true; G.add(rail);
    const pts2 = pts.map(p => V3(p.x, p.y - 0.42, p.z)); const r2 = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts2), 40, 0.022, 6), woodD); G.add(r2);
    const pts3 = pts.map(p => V3(p.x, deckY(p.x) - 0.14, p.z * 0 + pathZ(p.x) + s * 0.45)); const beam = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts3), 40, 0.09, 6), woodD); beam.castShadow = true; G.add(beam); } }

// ---------- cabana de toras com alpendre, gancho da lanterna, janela acesa, chaminé
const STOP = 28.05;
const HOOK = V3(STOP + 0.16, PORCH.y + 1.83, pathZ(STOP) + 0.3);
const SMOKE = []; const winL = new THREE.PointLight(0xffb060, 0, 7, 1.5); scene.add(winL);
{ const G = new THREE.Group(); scene.add(G); const x0 = 29.3, x1 = 33.6, zH = 2.7, logM = new THREE.MeshLambertMaterial({ map: barkT, color: 0x9a7a62 }), logG = new THREE.CylinderGeometry(0.15, 0.15, 1, 10);
  const log = (a, b, y, m = logM) => { const mm = new THREE.Mesh(logG, m); const d = V3().subVectors(b, a); mm.position.copy(a).addScaledVector(d, 0.5).setY(y); mm.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); mm.scale.y = a.distanceTo(b); mm.castShadow = mm.receiveShadow = true; G.add(mm); };
  for (let i = 0; i < 9; i++) { const y = 0.2 + i * 0.29, o = i % 2 ? 0.28 : 0.12; log(V3(x0, 0, -zH - o), V3(x0, 0, zH + o), y + 0.145); log(V3(x1, 0, -zH - o), V3(x1, 0, zH + o), y + 0.145); log(V3(x0 - 0.28 + o, 0, -zH), V3(x1 + 0.28 - o, 0, -zH), y); log(V3(x0 - 0.28 + o, 0, zH), V3(x1 + 0.28 - o, 0, zH), y); }
  // empena (triângulo) de tábuas e telhado de duas águas com beiral sobre o alpendre
  const top = 0.2 + 9 * 0.29, ridge = top + 1.6, sh = new THREE.Shape(); sh.moveTo(-zH - 0.1, 0); sh.lineTo(zH + 0.1, 0); sh.lineTo(0, ridge - top); sh.closePath();
  for (const x of [x0, x1]) { const gb = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false }), woodD); gb.rotation.y = Math.PI / 2; gb.position.set(x + 0.06, top, 0); gb.castShadow = true; G.add(gb); }
  const roofM = new THREE.MeshLambertMaterial({ map: woodT, color: 0x6a5a52 }), pitch = Math.atan2(1.6, zH + 0.1), sl = Math.hypot(1.6, zH + 0.1) + 0.7;
  for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(x1 - PORCH.x0 + 0.9, 0.14, sl), roofM); r.position.set((PORCH.x0 - 0.5 + x1 + 0.4) / 2, top + 0.8 + 0.12, s * (zH + 0.1) / 2 + s * 0.22); r.rotation.x = s * pitch; r.castShadow = r.receiveShadow = true; G.add(r);
    for (let i = 0; i < 14; i++) { const sh2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, sl), roofM); sh2.position.set(PORCH.x0 - 0.3 + i * 0.5, top + 0.8 + 0.2, s * (zH + 0.1) / 2 + s * 0.22); sh2.rotation.x = s * pitch; sh2.castShadow = true; G.add(sh2); } }
  const rd = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, x1 - PORCH.x0 + 0.9, 8), logM); rd.rotation.z = Math.PI / 2; rd.position.set((PORCH.x0 - 0.5 + x1 + 0.4) / 2, ridge + 0.12, 0); G.add(rd);
  // alpendre: deque, degraus, esteios, vigas (uma delas segura o gancho)
  const dk = new THREE.Mesh(new THREE.BoxGeometry(x0 - PORCH.x0, 0.12, 2 * zH + 0.4), woodM); dk.position.set((x0 + PORCH.x0) / 2, PORCH.y - 0.06, 0); dk.receiveShadow = dk.castShadow = true; G.add(dk);
  for (let i = 0; i < 2; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 1.6), woodD); st.position.set(PORCH.x0 - 0.2 - i * 0.32, PORCH.y - 0.17 - i * 0.17, pathZ(PORCH.x0)); st.castShadow = st.receiveShadow = true; G.add(st); }
  for (const z of [-zH, zH]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 2.6, 8), logM); p.position.set(PORCH.x0 + 0.15, PORCH.y + 1.25, z); p.castShadow = true; G.add(p); }
  const fb = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 2 * zH + 0.6, 8), logM); fb.rotation.x = Math.PI / 2; fb.position.set(PORCH.x0 + 0.15, PORCH.y + 2.5, 0); fb.castShadow = true; G.add(fb);
  for (const z of [-1.4, HOOK.z, 1.6]) { const j = new THREE.Mesh(new THREE.BoxGeometry(x0 - PORCH.x0 + 0.2, 0.14, 0.1), woodD); j.position.set((x0 + PORCH.x0) / 2, HOOK.y + 0.3, z); j.castShadow = true; G.add(j); }
  { const hk = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.009, 6, 14, 4.2), iron); hk.position.set(HOOK.x, HOOK.y + 0.05, HOOK.z); hk.rotation.y = Math.PI / 2; G.add(hk); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 5), iron); st.position.set(HOOK.x, HOOK.y + 0.17, HOOK.z); G.add(st); }
  // porta, janela acesa com cortina, floreira, lenha, barril, banco
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.95, 0.95), L(woodT, 0x6a4a36)); door.position.set(x0 - 0.12, PORCH.y + 0.98, 0.0); G.add(door);
  for (const y of [0.5, 1.5]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.95), iron); b.position.set(x0 - 0.17, PORCH.y + y, 0); G.add(b); }
  const warm = new THREE.MeshBasicMaterial({ color: 0xffc06a, fog: false }), frameM = L(woodT, 0x5a4232);
  const win = (z) => { const f = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.95, 0.95), frameM); f.position.set(x0 - 0.13, PORCH.y + 1.25, z); G.add(f); const g2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.8), warm); g2.position.set(x0 - 0.17, PORCH.y + 1.25, z); G.add(g2);
    for (const [dy, dz, w, h] of [[0, 0, 0.05, 0.8], [0, 0, 0.8, 0.05]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.08, h, w === 0.8 ? 0.8 : 0.05), frameM); m.position.set(x0 - 0.2, PORCH.y + 1.25 + dy, z + dz); G.add(m); }
    const cu = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.8, 0.26), new THREE.MeshBasicMaterial({ color: 0xc8603a, fog: false })); cu.position.set(x0 - 0.19, PORCH.y + 1.25, z + 0.27); G.add(cu);
    const bx = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 1.0), woodD); bx.position.set(x0 - 0.28, PORCH.y + 0.72, z); G.add(bx);
    for (let i = 0; i < 6; i++) { const fl = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), L(null, [0xd8503a, 0xf2a23c, 0xe0c050][i % 3], { flatShading: true })); fl.position.set(x0 - 0.3, PORCH.y + 0.84, z - 0.4 + i * 0.16); G.add(fl); } };
  win(-1.6); win(1.75); winL.position.set(x0 - 1.0, PORCH.y + 1.3, 1.75);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 6 - r; i++) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.8, 8), i % 2 ? logM : woodD); lg.rotation.x = Math.PI / 2; lg.position.set(x0 - 0.4 - i * 0.23 - r * 0.115, PORCH.y + 0.11 + r * 0.2, -2.15); lg.castShadow = true; G.add(lg); }
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.27, 0.75, 14), L(woodT, 0x7a5a40)); barrel.position.set(PORCH.x0 - 0.7, hgt(PORCH.x0 - 0.7, 2.4) + 0.37, 2.4); barrel.castShadow = true; G.add(barrel);
  for (const y of [0.15, 0.6]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.015, 6, 20), iron); h.rotation.x = Math.PI / 2; h.position.set(PORCH.x0 - 0.7, hgt(PORCH.x0 - 0.7, 2.4) + y, 2.4); G.add(h); }
  const bench = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.07, 1.5), woodM); bench.position.set(x0 - 0.35, PORCH.y + 0.45, -1.0); bench.castShadow = true; G.add(bench);
  // chaminé de pedra
  for (let i = 0; i < 12; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.42, 0.75), L(null, 0x7a7068, { flatShading: true })); st.position.set(x1 - 0.6 + (R() - 0.5) * 0.05, 0.2 + i * 0.42, -1.4); st.rotation.y = (R() - 0.5) * 0.1; st.castShadow = true; G.add(st); }
  for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshLambertMaterial({ color: 0xc8c0b8, transparent: true, opacity: 0.22, depthWrite: false, flatShading: true })); scene.add(m); SMOKE.push(m); } }

// ---------- cortina de chuva subindo o vale + céu de tempestade
const curtainTex = mkTex(512, 512, (c, w, h) => { c.clearRect(0, 0, w, h); const r = rng(21); for (let i = 0; i < 900; i++) { const x = r() * w, y = r() * h; c.strokeStyle = `rgba(255,255,255,${0.15 + r() * 0.35})`; c.lineWidth = 1 + r() * 1.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 6, y + 50 + r() * 60); c.stroke(); }
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.15, 'rgba(0,0,0,0)'); c.globalCompositeOperation = 'destination-out'; c.fillStyle = g; c.fillRect(0, 0, w, h); });
curtainTex.wrapS = curtainTex.wrapT = THREE.RepeatWrapping;
const CURT = []; for (let k = 0; k < 5; k++) { const t = curtainTex.clone(); t.needsUpdate = true; t.repeat.set(5, 1.6); t.offset.x = k * 0.37;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(150, 46), new THREE.MeshBasicMaterial({ map: t, color: 0x9aa8b4, transparent: true, opacity: 0.5 - k * 0.06, depthWrite: false, fog: false, side: THREE.DoubleSide })); m.rotation.y = Math.PI / 2; scene.add(m); CURT.push(m);
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(150, 46), new THREE.MeshBasicMaterial({ color: 0x46525c, transparent: true, opacity: 0.16, depthWrite: false, fog: false, side: THREE.DoubleSide })); veil.rotation.y = Math.PI / 2; scene.add(veil); m.userData.veil = veil; }
const xCurt = t => -64 + 4.3 * t;
const SUN = V3(-0.55, 0.2, 0.81).normalize();
const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { sunD: { value: SUN }, storm: { value: 0 }, time: { value: 0 }, fogC: { value: new THREE.Color() } },
  vertexShader: `varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
  fragmentShader: `uniform vec3 sunD; uniform float storm; uniform float time; uniform vec3 fogC; varying vec3 vD;
    float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h2(i), h2(i+vec2(1,0)), f.x), mix(h2(i+vec2(0,1)), h2(i+vec2(1,1)), f.x), f.y); }
    float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++){ s += a * n2(p); p *= 2.03; a *= 0.5; } return s; }
    void main(){ vec3 d = normalize(vD); float h = d.y, sd = max(dot(d, sunD), 0.0);
      vec3 zen = vec3(0.06, 0.08, 0.11), hor = vec3(0.36, 0.25, 0.19);
      vec3 c = mix(hor, zen, smoothstep(-0.02, 0.5, h));
      c += vec3(1.0, 0.45, 0.16) * pow(sd, 5.0) * 0.8 * (1.0 - storm * 0.7) + vec3(1.0, 0.65, 0.35) * pow(sd, 80.0) * 2.0 * (1.0 - storm * 0.8);
      vec2 p = d.xz / (max(h, 0.03) + 0.22) * 1.3 + vec2(time * 0.05, time * 0.01);
      float n = fbm(p), side = smoothstep(0.35, -0.75, d.x);
      float cov = clamp(n * 1.5 - 0.62 + side * 0.85 + storm * 0.55, 0.0, 1.0);
      vec3 cloud = mix(vec3(0.05, 0.06, 0.075), vec3(0.75, 0.38, 0.18), pow(sd, 2.5) * (1.0 - storm * 0.6) * (1.0 - side * 0.6));
      cloud *= 0.75 + 0.5 * n;
      c = mix(c, cloud, cov * smoothstep(-0.02, 0.1, h));
      c = mix(c, fogC, smoothstep(0.06, -0.08, h));
      gl_FragColor = vec4(c, 1.0); }` }));
scene.add(sky);

// ---------- luz
const sun = new THREE.DirectionalLight(0xffb070, 5.2); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2.5;
Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 140 }); scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(0x6a7a88, 0x3a2a1a, 0.9); scene.add(hemi);
const lampL = new THREE.PointLight(0xffa040, 0, 7.5, 1.5); scene.add(lampL);

// ---------- lanterna (objeto da cena: na mão até o gancho)
const lamp = new THREE.Group(); scene.add(lamp);
{ const brass = L(null, 0x8a6a3a), glow = new THREE.MeshBasicMaterial({ color: 0xffd890, fog: false });
  const hd = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.006, 6, 16, Math.PI), iron); hd.position.y = -0.05; lamp.add(hd);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.07, 8), iron); cap.position.y = -0.1; lamp.add(cap);
  const g = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.058, 0.13, 8), glow); g.position.y = -0.2; lamp.add(g);
  for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.14, 0.01), iron); const a = i / 4 * 6.283 + 0.4; p.position.set(Math.cos(a) * 0.06, -0.2, Math.sin(a) * 0.06); lamp.add(p); }
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.035, 8), brass); base.position.y = -0.285; lamp.add(base);
  const haloT = mkTex(128, 128, (c) => { const gr = c.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,200,120,0.9)'); gr.addColorStop(0.25, 'rgba(255,150,60,0.35)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); });
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloT, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true })); halo.scale.set(0.9, 0.9, 1); halo.position.y = -0.2; lamp.add(halo); lamp.userData.halo = halo; }
lamp.traverse(o => { if (o.isMesh) o.castShadow = false; });

// ---------- chuva: riscos instanciados num volume em volta do assunto; folhas caindo
const RAIN_N = 7000, rainMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.008, 0.55, 0.008), new THREE.MeshBasicMaterial({ color: 0xc8d8e4, transparent: true, opacity: 0.42, depthWrite: false }), RAIN_N);
const RAIN = []; { const r = rng(77); for (let i = 0; i < RAIN_N; i++) RAIN.push({ x: r(), z: r(), y: r(), s: 0.85 + r() * 0.3 }); } scene.add(rainMesh); rainMesh.frustumCulled = false;
function rain(t, ctr, amt) { const n = Math.floor(RAIN_N * amt); let k = 0; const BX = 26, BZ = 26, BY = 12;
  for (let i = 0; i < RAIN_N && k < n; i++) { const d = RAIN[i]; const x = ctr.x + (d.x - 0.5) * BX, z = ctr.z + (d.z - 0.5) * BZ; let y = ((d.y - t * 9.5 * d.s / BY) % 1 + 1) % 1 * BY + ctr.y - 3;
    if (x > PORCH.x0 - 0.35 && x < 34 && Math.abs(z) < 3.2) continue; if (Math.hypot(x - cam.position.x, z - cam.position.z) < 1.6) continue; const gy = hgt(x, z); if (y < gy) continue;
    _o.position.set(x + (y - ctr.y) * 0.14, y, z); _o.rotation.set(0, 0, -0.14); _o.scale.set(1, 1, 1); _o.updateMatrix(); rainMesh.setMatrixAt(k++, _o.matrix); }
  rainMesh.count = k; rainMesh.instanceMatrix.needsUpdate = true; }
const FALL_N = 160, fallMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.11, 0.11), leafMatSmall, FALL_N); scene.add(fallMesh); fallMesh.frustumCulled = false;
{ const r = rng(5), c = new THREE.Color(); for (let i = 0; i < FALL_N; i++) { const p = PAL[(r() * 5) | 0]; fallMesh.setColorAt(i, c.setHSL(p[0], p[1], p[2])); } }
const FALL = []; { const r = rng(15); for (let i = 0; i < FALL_N; i++) FALL.push({ x: r(), y: r(), z: r(), p: r() * 6.28, s: 0.6 + r() * 0.8 }); }
function falling(t, ctr, wind) { FALL.forEach((f, i) => { const yy = ((f.y - t * 0.09 * f.s) % 1 + 1) % 1, xx = ((f.x + t * 0.03 * wind * f.s) % 1 + 1) % 1;
  _o.position.set(ctr.x + (xx - 0.5) * 16 + Math.sin(t * 1.7 + f.p) * 0.4, ctr.y - 1 + yy * 7, ctr.z + (f.z - 0.5) * 16); _o.rotation.set(t * 2.1 * f.s + f.p, t * 1.3 + f.p, t * 0.7); _o.scale.setScalar(f.s); _o.updateMatrix(); fallMesh.setMatrixAt(i, _o.matrix); }); fallMesh.instanceMatrix.needsUpdate = true; }

// ---------- personagem: velocidade integrada (corre e freia exatamente no alpendre)
const ivi = criaIvi(); scene.add(ivi.root);
const blobSh = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({ color: 0x0c0604, transparent: true, opacity: 0.35, depthWrite: false })); blobSh.rotation.x = -Math.PI / 2; blobSh.scale.set(0.42, 0.3, 1); scene.add(blobSh);
const VMAX = 2.35, TA = 5.35, DT = 1 / 600;
function profile(td) { const xs = [0]; let x = 0; for (let i = 1; i <= END / DT; i++) { const t = i * DT; const v = VMAX * ss((t - TA) / 1.1) * (1 - ss((t - td) / 1.5)); x += v * DT; xs.push(x); } return xs; }
let XS, TD; { let a = 10, b = 20; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; const xs = profile(m); if (xs[xs.length - 1] > STOP) b = m; else a = m; } TD = (a + b) / 2; XS = profile(TD); }
const xAt = t => XS[Math.min(XS.length - 1, Math.max(0, Math.round(t / DT)))];
const vAt = t => (xAt(t + 0.02) - xAt(t - 0.02)) / 0.04;
const T_REACH = [20.0, 20.85], T_REL = 21.15, T_DOWN = [21.25, 21.9], T_TURN = [22.15, 23.0], T_WIPE = [25.6, 27.0];
const headingAt = (x, t) => { const dz = (pathZ(x + 0.05) - pathZ(x - 0.05)) / 0.1, h = Math.atan2(1, dz);
  if (t < 5.6) return lerp(-Math.PI / 2 + 0.25, h, ss((t - 4.75) / 0.85));
  if (t > T_TURN[0]) return lerp(Math.PI / 2, -Math.PI / 2 + 0.55, ss((t - T_TURN[0]) / (T_TURN[1] - T_TURN[0])));
  return t > 18 ? lerp(h, Math.PI / 2, ss((t - 18) / 0.6)) : h; };
const STATE = {};
function pose(t) { const x = xAt(t), z = pathZ(x), y = groundAt(x), v = vAt(t), run = cl(v / VMAX);
  const turning = t > 4.75 && t < 5.6, turning2 = t > T_TURN[0] && t < T_TURN[1];
  const V = turning || turning2 ? 0.55 : v, T = lerp(1.0, 0.6, run);
  const UD = ivi.root.userData; UD.run = run; UD.wind = t < 5 ? 0.8 : t > 15 ? 0.6 + 0.4 * ss((t - 15) / 5) : 0.5;
  UD.headYaw = t < 4.75 ? -0.15 + 0.12 * Math.sin(t * 0.9) + (t > 3.6 ? -0.5 * ss((t - 3.6) / 0.6) : 0) : turning ? -0.5 * (1 - ss((t - 4.75) / 0.85)) : t > 23.2 ? 0.25 * Math.sin((t - 23.2) * 0.8) - 0.1 : 0;
  UD.headPitch = t < 4.75 ? 0.04 : t > 19.2 && t < 21.4 ? -0.42 * ss((t - 19.2) / 0.5) * (1 - ss((t - 21.0) / 0.4)) : t > 23.0 ? -0.08 : 0;
  UD.puff = t > 17.6 ? cl((t - 17.6) / 0.5) * (1 - 0.6 * ss((t - 24) / 4)) : 0; UD.stance = t > 18.6 ? 1 : 0;
  UD.reach = t < T_REACH[0] ? 0 : t < T_DOWN[0] ? ss((t - T_REACH[0]) / (T_REACH[1] - T_REACH[0])) : 1 - ss((t - T_DOWN[0]) / (T_DOWN[1] - T_DOWN[0]));
  UD.wipe = t > T_WIPE[0] && t < T_WIPE[1] ? Math.sin(Math.PI * (t - T_WIPE[0]) / (T_WIPE[1] - T_WIPE[0])) : 0;
  if (UD.wipe) UD.headPitch = (UD.headPitch ?? 0) + 0.12 * UD.wipe;
  UD.lean = t > 18.2 && t < 19.5 ? 0.12 * Math.sin(Math.PI * (t - 18.2) / 1.3) : 0;
  ivi.root.position.set(x, y, z); ivi.root.rotation.y = headingAt(x, t);
  ivi.root.updateMatrixWorld(true); UD.reachPt = ivi.root.worldToLocal(V3(HOOK.x, HOOK.y - 0.02, HOOK.z));
  ivi.update(t, V, T); Object.assign(STATE, { x, y, z, v, run });
  blobSh.position.set(x, y + 0.012, z); blobSh.rotation.z = -ivi.root.rotation.y; }
const _hp = V3(), _ax = V3();
function lampPose(t) { ivi.root.updateMatrixWorld(true); const UD = ivi.root.userData; let swing, swing2 = 0;
  if (t < T_REL) { UD.handR.getWorldPosition(_hp); _hp.y -= 0.02; const run = STATE.run; swing = run * 0.4 * Math.sin(t / lerp(1.0, 0.6, run) * 2 * Math.PI + 1.2) + 0.08 * Math.sin(t * 2.3) + (t > 4.75 && t < 5.8 ? 0.4 * Math.sin((t - 4.75) * 6) * (1 - (t - 4.75)) : 0) - run * 0.25;
    if (t > T_REACH[0]) _hp.lerp(V3(HOOK.x, HOOK.y - 0.02, HOOK.z), ss((t - T_REACH[1] + 0.25) / 0.25)); }
  else { const s = t - T_REL; _hp.copy(HOOK); swing = 0.32 * Math.exp(-s * 0.45) * Math.sin(s * 3.4 + 0.3) + 0.03 * Math.sin(t * 1.9); swing2 = 0.12 * Math.exp(-s * 0.4) * Math.sin(s * 2.9) + 0.02 * Math.sin(t * 1.3); }
  lamp.position.copy(_hp); const hd = ivi.root.rotation.y; _ax.set(Math.cos(hd), 0, -Math.sin(hd)); lamp.quaternion.setFromAxisAngle(_ax, swing); lamp.rotateZ(swing2);
  lamp.updateMatrixWorld(true); lamp.userData.halo.getWorldPosition(lampL.position); lampL.intensity = 3.4 + Math.sin(t * 13) * 0.25 + Math.sin(t * 29) * 0.15; lamp.userData.halo.material.opacity = 0.85 + Math.sin(t * 17) * 0.1;
  UB.lampPos.value.copy(lampL.position); UB.lampK.value = 1.0;
  const dc = Math.abs(lampL.position.x - creekX(lampL.position.z)); refl.visible = dc < 1.5; refl.position.set(lampL.position.x, -0.89, lampL.position.z + 0.6); refl.material.opacity = 0.7; }

// ---------- planos (câmera sempre com destino)
const P = () => V3(STATE.x, STATE.y, STATE.z);
const E = (a, b, u, p = 2) => lerp(a, b, 1 - Math.pow(1 - cl(u), p));
const SHOTS = [
  // 1 — de costas, no alto: ela olha a chuva subindo o vale; a câmera chega no ombro dela
  { a: 0, b: 4.2, fov: 40, cam: (t, p, u) => [V3(p.x + E(4.2, 2.6, u), p.y + E(1.55, 1.6, u), p.z + E(1.6, 0.9, u)), V3(p.x - 30, p.y - 4.5 + u * 0.8, p.z - 6.0)], dof: [3.2, 1.6, 0.9, 6], tint: [0.66, 0.6, 0.6] },
  // 2 — de frente, rosto: ela vira e dispara; a câmera gira atrás dela pelo caminho
  { a: 4.2, b: 8.0, fov: 34, cam: (t, p, u) => { const k = ss((t - 5.2) / 2.4); return [V3(p.x + lerp(-1.75, -2.2, k), lerp(1.35, 1.3, k) + p.y, p.z + lerp(1.15, 1.6, k)), V3(p.x + lerp(0.05, 2.4, k), p.y + lerp(1.38, 1.05, k), p.z + lerp(0, -0.4, k))]; }, dof: [2.4, 1.0, 0.7, 7], tint: [0.6, 0.54, 0.53] },
  // 3 — lateral contra o sol: corrida com troncos passando na frente
  { a: 8.0, b: 11.3, fov: 38, cam: (t, p, u) => [V3(p.x + 0.9 - u * 0.5, 1.3 + p.y * 0.6, p.z - 4.6), V3(p.x + 0.7, p.y + 0.95, p.z)], dof: [3.0, 1.3, 1.0, 7], tint: [0.56, 0.5, 0.5] },
  // 4 — de dentro do riacho: ela cruza a ponte contra o céu
  { a: 11.3, b: 14.8, fov: 40, cam: (t, p, u) => [V3(creekX(-6) + 0.2 + u * 0.4, -0.45 + u * 0.35, pathZ(16) - 6.4 + u * 1.6), V3(lerp(p.x, 16.5, 0.35), p.y + 1.0, p.z)], dof: [5.5, 2.4, 0.8, 5], tint: [0.56, 0.5, 0.5] },
  // 5 — por cima do ombro: a cabana acesa à frente, os primeiros pingos
  { a: 14.8, b: 17.6, fov: 36, cam: (t, p, u) => [V3(p.x - E(3.8, 3.0, u), p.y + 1.45, p.z - 1.2), V3(p.x + 7, p.y + 1.1, p.z + 0.7)], dof: [2.4, 1.2, 0.9, 6], tint: [0.56, 0.5, 0.5] },
  // 6 — alpendre: sobe o degrau, recupera o fôlego, pendura a lanterna
  { a: 17.6, b: 22.3, fov: 38, cam: (t, p, u) => [V3(STOP + E(0.75, 0.95, u), PORCH.y + E(1.2, 1.35, u), pathZ(STOP) + E(2.45, 1.9, u)), V3(lerp(p.x, STOP, ss((t - 17.6) / 1.2)) + 0.3, PORCH.y + lerp(1.2, 1.65, ss((t - 19.3) / 1.5)), pathZ(STOP) + 0.45)], dof: [3.4, 1.4, 1.0, 6], tint: [0.56, 0.5, 0.5] },
  // 7 — close: ela se vira para a chuva, a lanterna balançando acima
  { a: 22.3, b: 26.0, fov: 30, cam: (t, p, u) => [V3(STOP - E(2.5, 1.9, u), PORCH.y + E(1.05, 1.2, u), pathZ(STOP) - E(1.1, 0.75, u)), V3(STOP, PORCH.y + 1.62, pathZ(STOP) + 0.12)], dof: [2.3, 1.0, 0.9, 7], tint: [0.56, 0.5, 0.5] },
  // 8 — aberto, na chuva: a câmera se aproxima da luz pendurada
  { a: 26.0, b: 99, fov: 36, cam: (t, p, u) => [V3(STOP - E(6.8, 5.4, u), PORCH.y + E(0.9, 1.5, u), pathZ(STOP) - E(6.2, 4.6, u)), V3(STOP + 0.6, PORCH.y + 1.55, pathZ(STOP) + 0.2)], dof: [7.0, 2.6, 0.8, 4], tint: [0.56, 0.5, 0.5] },
];

// ---------- pós em 2D (como no motor): 3 camadas de profundidade com desfoque, bloom, névoa quente, vinheta, retícula, grão
const lay = [0, 1, 2].map(() => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; });
const BLOOM = document.createElement('canvas'); BLOOM.width = W / 4; BLOOM.height = H / 4; let DOTS = null;
const GRAIN = [0, 1, 2, 3].map(k => { const c = document.createElement('canvas'); c.width = 540; c.height = 960; const g = c.getContext('2d'), d = g.createImageData(540, 960), r = rng(100 + k); for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (r() - 0.5) * 120; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); return c; });
const DROPS = []; { const r = rng(44); for (let i = 0; i < 90; i++) DROPS.push({ x: r(), y: r(), s: 0.5 + r(), p: r() }); }
const _sp = V3();
function toScreen(v) { _sp.copy(v).project(cam); return [(_sp.x * 0.5 + 0.5) * W, (-_sp.y * 0.5 + 0.5) * H, _sp.z]; }
function post(t, S, rainK, sunK) {
  // bloom
  { const bc = BLOOM.getContext('2d'); bc.filter = 'none'; bc.globalCompositeOperation = 'copy'; bc.drawImage(out, 0, 0, W / 4, H / 4);
    X.save(); X.globalCompositeOperation = 'screen'; X.globalAlpha = 0.55; X.filter = 'brightness(0.8) contrast(2.4) blur(10px)'; X.drawImage(BLOOM, 0, 0, W, H);
    X.globalAlpha = 0.35; X.filter = 'brightness(0.8) contrast(2.4) blur(34px)'; X.drawImage(BLOOM, 0, 0, W, H); X.restore(); X.filter = 'none'; }
  const c = X;
  // névoa quente do lado do sol (some com a tempestade) e poça quente da lanterna
  c.globalCompositeOperation = 'lighter';
  const sp = toScreen(V3(cam.position.x + SUN.x * 100, cam.position.y + SUN.y * 100, cam.position.z + SUN.z * 100));
  if (sp[2] < 1) { const gx = cl(sp[0], -300, W + 300), gy = cl(sp[1], -200, H * 0.8); let g = c.createRadialGradient(gx, gy, 0, gx, gy, 1000); g.addColorStop(0, `rgba(255,140,50,${0.3 * sunK})`); g.addColorStop(0.45, `rgba(200,90,30,${0.08 * sunK})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  { const lp = toScreen(lampL.position); if (lp[2] < 1) { const g = c.createRadialGradient(lp[0], lp[1], 0, lp[0], lp[1], 520); g.addColorStop(0, 'rgba(255,150,60,0.16)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); } }
  c.globalCompositeOperation = 'source-over';
  // gotas que riscam a lente (1º plano, desfocadas)
  if (rainK > 0.05) { c.save(); c.filter = 'blur(2px)'; c.strokeStyle = `rgba(210,225,235,${0.22 * rainK})`; c.lineCap = 'round';
    for (const d of DROPS) { if (d.p > rainK) continue; const y = ((d.y + t * 2.4 * d.s) % 1) * (H + 400) - 200, x = d.x * W + (y / H) * 60; c.lineWidth = 1.5 + d.s * 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 18, y + 130 * d.s); c.stroke(); } c.restore(); }
  // grade: sombras puxadas para o petróleo, altas para o âmbar
  c.globalCompositeOperation = 'soft-light'; c.fillStyle = `rgba(30,80,90,${0.32 + rainK * 0.12})`; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over';
  // vinheta
  let g = c.createRadialGradient(W / 2, H * 0.5, 420, W / 2, H * 0.5, 1180); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(4,6,8,0.7)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (!DOTS) { const p = document.createElement('canvas'); p.width = p.height = 6; const q = p.getContext('2d'); q.fillStyle = 'rgba(255,255,255,0.045)'; q.beginPath(); q.arc(3, 3, 1.1, 0, 7); q.fill(); DOTS = c.createPattern(p, 'repeat'); }
  c.fillStyle = DOTS; c.fillRect(0, 0, W, H);
  c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.09; c.drawImage(GRAIN[Math.floor(t * 30) % 4], 0, 0, W, H); c.restore();
}

function draw(t) {
  const S = SHOTS.find(s => t >= s.a && t < s.b), u = (t - S.a) / (Math.min(S.b, END) - S.a);
  const rainK = ss((t - 14.6) / 6.5), sunK = 1 - 0.82 * ss((t - 11) / 10);
  pose(t); lampPose(t);
  const p = P(), [cp, look] = S.cam(t, p, u); cam.position.copy(cp); cam.fov = S.fov; cam.lookAt(look); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  // luz e tempo
  sun.intensity = 5.0 * sunK; sun.position.copy(p).addScaledVector(SUN, 60); sun.target.position.copy(p); sun.target.updateMatrixWorld();
  hemi.intensity = 0.9 + rainK * 0.6; hemi.color.setRGB(lerp(0.42, 0.36, rainK), lerp(0.46, 0.44, rainK), lerp(0.5, 0.52, rainK));
  const fogC = new THREE.Color().setRGB(lerp(0.62, 0.3, rainK), lerp(0.46, 0.34, rainK), lerp(0.36, 0.36, rainK)); scene.fog.color.copy(fogC); sky.material.uniforms.fogC.value.copy(fogC);
  scene.fog.near = lerp(14, 5, rainK); scene.fog.far = lerp(150, 46, rainK); sky.material.uniforms.storm.value = cl(t / 22); sky.material.uniforms.time.value = t; sky.position.copy(cam.position);
  groundMat.color.setScalar(lerp(1, 0.8, rainK));
  UB.rimCol.value.setRGB(1.0, 0.6, 0.27).multiplyScalar(lerp(0.25, 1, sunK)); TINT.set(...S.tint);
  winL.intensity = 2.2; waterTex.offset.y = -t * 0.35;
  CURT.forEach((m, k) => { const x = xCurt(t) - k * 7; m.position.set(x, -8, 0); m.visible = x < -6; m.userData.veil.position.set(x - 3, -8, 0); m.userData.veil.visible = m.visible; m.material.map.offset.y = t * (1.6 + k * 0.2); });
  SMOKE.forEach((m, i) => { const ph = ((t * 0.18 + i / SMOKE.length) % 1); m.position.set(33.0 + ph * 2.6, 5.6 + ph * 3.2, -1.4 + Math.sin(ph * 5 + i) * 0.3); m.scale.setScalar(0.25 + ph * 1.1); m.material.opacity = 0.26 * (1 - ph) * (1 - rainK * 0.5); });
  swayLeaves(t, 1 + rainK); falling(t, V3(cam.position.x * 0.5 + p.x * 0.5, p.y, cam.position.z * 0.5 + p.z * 0.5), 1 + rainK * 2); fallMesh.visible = rainK < 0.9;
  rain(t, V3(p.x, p.y, p.z), rainK);
  R3.shadowMap.needsUpdate = true;
  // 3 passes por profundidade: fundo (desfoque leve), assunto (nítido), 1º plano (desfoque forte)
  const d = cam.position.distanceTo(V3(p.x, p.y + 1.1, p.z)), [bgOff, fgOff, bgBlur, fgBlur] = S.dof;
  const cuts = [[d + bgOff, 400, bgBlur], [Math.max(0.1, d - fgOff - 0.3), d + bgOff + 0.6, 0], [0.1, Math.max(0.12, d - fgOff), fgBlur]];
  cuts.forEach(([n, f], i) => { cam.near = n; cam.far = f; cam.updateProjectionMatrix(); sky.visible = i === 0; R3.clear(); R3.render(scene, cam); const lc = lay[i].getContext('2d'); lc.clearRect(0, 0, W, H); lc.drawImage(gl, 0, 0); });
  cam.near = 0.1; cam.far = 400; cam.updateProjectionMatrix();
  X.filter = 'none'; X.globalCompositeOperation = 'source-over'; X.fillStyle = '#10161a'; X.fillRect(0, 0, W, H);
  cuts.forEach(([, , b], i) => { X.filter = b ? `blur(${b}px)` : 'none'; X.drawImage(lay[i], 0, 0); }); X.filter = 'none';
  post(t, S, rainK, sunK);
}
window.seek = async t => draw(t);
window.SHOTS = SHOTS.map(s => [s.a, Math.min(s.b, END)]);
THREE.DefaultLoadingManager.onLoad = () => { draw(0); draw(0); window.READY = true; };
