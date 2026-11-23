// Ajudantes do herói: carga das texturas, materiais PBR, geometria paramétrica e IK. As medidas da arte ficam em _heroi_body.js.
// Atarracado: ombros 0,94 m de largura, elmo 0,33 m, pernas curtas (quadril a 0,52 m). Modelo olhando para +z; +x é a esquerda dele.
import * as THREE from 'three';
export const TX = 1;
const loadImg = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
export const IMG = Object.fromEntries(await Promise.all([...['steel', 'navy', 'crimson', 'leather', 'bark', 'ground', 'gold', 'wood', 'grass', 'stone'].map(k => [k, 'tex/' + k + '.jpg']),
  ...['rock', 'road', 'quilt', 'wool', 'bronze', 'drygrass', 'serra'].map(k => [k, 'tex_novo/' + k + '.jpg'])].map(async ([k, f]) => [k, await loadImg(f)])));
export function paint(g, w, h, key, tint, a = 0.55, crop = 0.16, rot = false) { const im = IMG[key]; if (!im) return false; const c = im.width * crop, sz = im.width - 2 * c;
  if (rot) { g.save(); g.translate(w / 2, h / 2); g.rotate(Math.PI / 2); g.drawImage(im, c, c, sz, sz, -h / 2, -w / 2, h, w); g.restore(); } else g.drawImage(im, c, c, sz, sz, 0, 0, w, h);
  if (tint) { g.save(); g.globalCompositeOperation = 'color'; g.globalAlpha = a; g.fillStyle = tint; g.fillRect(0, 0, w, h); g.restore(); } return true; }
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k, ss = k => { k = cl(k); return k * k * (3 - 2 * k); };
export const TINT = new THREE.Vector3(0.8, 0.74, 0.72);
export const RIM = { dir: { value: new THREE.Vector3(-0.6, 0.3, -0.5).normalize() }, col: { value: new THREE.Color(0xff9a4a) } };
export const LOOK = { metal: 0.86, rough: 0.32, env: 1.3, dent: 5.5 };   // aço: ajustável de fora (estúdio × filme)
const METALS = [], MATTE = []; export function metalEnv(k, kd = 1) { METALS.forEach(m => m.envMapIntensity = LOOK.env * k); MATTE.forEach(m => m.envMapIntensity = 0.5 * kd); }
function mat(hex, o = {}) {
  if ((o.keep ?? 0) >= 1) return new THREE.MeshBasicMaterial({ color: hex, side: o.side ?? THREE.FrontSide, fog: false, toneMapped: false });
  const metal = o.metal ?? 0, m = new THREE.MeshStandardMaterial({ color: hex, map: o.map ?? null, side: o.side ?? THREE.FrontSide,
    metalness: metal * LOOK.metal, roughness: o.rough ?? (o.roughMap ? 1 : metal ? LOOK.rough : Math.max(0.42, 0.92 - (o.spec ?? 0) * 0.9)), roughnessMap: o.roughMap ?? null, envMapIntensity: metal ? LOOK.env : 0.5,
    bumpMap: o.bumpTex ?? (o.bump === 0 ? null : (o.map ?? null)), bumpScale: o.bumpTex ? (o.bump ?? LOOK.dent) : o.map ? (o.bump ?? (metal ? 1.0 : 2.2)) : 0 });
  if ((o.keep ?? 0) > 0) { m.emissive = new THREE.Color(hex).multiplyScalar(0.05 * o.keep); m.emissiveMap = o.map ?? null; }
  (metal ? METALS : MATTE).push(m);
  const rimK = o.rim ?? 1;
  m.onBeforeCompile = sh => { sh.uniforms.rimDirV = RIM.dir; sh.uniforms.rimCol = RIM.col; sh.uniforms.rimK = { value: rimK };
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 rimDirV; uniform vec3 rimCol; uniform float rimK;')
      .replace('#include <opaque_fragment>', 'float rimF = pow(1.0 - saturate(dot(normalize(normal), normalize(vViewPosition))), 2.4) * smoothstep(0.05, 0.65, dot(normalize(normal), rimDirV)); outgoingLight += rimCol * rimK * rimF * 0.9;\n#include <opaque_fragment>'); };
  return m;
}
const Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1), _d = new THREE.Vector3(), _p = new THREE.Vector3(), dir = new THREE.Vector3();
function between(m, a, b) { _d.subVectors(b, a); const l = _d.length(); m.position.copy(a).addScaledVector(_d, 0.5); m.quaternion.setFromUnitVectors(Y, _d.normalize()); m.scale.set(1, l, 1); }
function place(m, a, b) { _d.subVectors(b, a); m.position.copy(a).addScaledVector(_d, 0.5); m.quaternion.setFromUnitVectors(Y, _d.normalize()); }
const mesh = (geo, hex, o) => new THREE.Mesh(geo, mat(hex, o));
const cyl = (rTop, rBot, hex, o) => mesh(new THREE.CylinderGeometry(rTop, rBot, 1, 20, 1), hex, o);
const ball = (r, hex, o) => mesh(new THREE.SphereGeometry(r, 28, 18), hex, o);
const box = (x, y, z, hex, o) => mesh(new THREE.BoxGeometry(x, y, z), hex, o);
const lathe = (pts, hex, o, seg = 36, p0 = 0, pl = Math.PI * 2) => mesh(new THREE.LatheGeometry(pts.map(q => new THREE.Vector2(q[0], q[1])), seg, p0, pl), hex, o);
// superfície paramétrica fn(u, v, p) e tubo ao longo de fn(u, p)
function surfGeo(fn, nu, nv) { const n = (nu + 1) * (nv + 1), pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const k = j * (nu + 1) + i; fn(i / nu, j / nv, _p); pos[k * 3] = _p.x; pos[k * 3 + 1] = _p.y; pos[k * 3 + 2] = _p.z; uv[k * 2] = i / nu; uv[k * 2 + 1] = 1 - j / nv; }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; }
const surf = (fn, nu, nv, hex, o) => mesh(surfGeo(fn, nu, nv), hex, { side: THREE.DoubleSide, ...o });
function tube(fn, n, r, hex, o, closed = false) { const pts = []; for (let i = 0; i < (closed ? n : n + 1); i++) { fn(i / n, _p); pts.push(_p.clone()); }
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, closed), n * 3, r, 10, closed), hex, o); }
function horn(fn, n, rad, hex, o, m = 14) { const c0 = new THREE.Vector3(), c1 = new THREE.Vector3(), T = new THREE.Vector3(), N = new THREE.Vector3(), Bv = new THREE.Vector3();
  return surf((u, v, p) => { const u0 = Math.min(u, 0.99); fn(u0, c0); fn(u0 + 0.01, c1); T.subVectors(c1, c0).normalize(); N.crossVectors(T, Z).normalize(); Bv.crossVectors(T, N); fn(u, c0); const th = v * Math.PI * 2, r = rad(u, th);
    p.copy(c0).addScaledVector(N, Math.cos(th) * r).addScaledVector(Bv, Math.sin(th) * r * 0.8); }, n, m, hex, o); }
// faixa em arco de elipse em torno de y: a0..a1 (0 = frente, + para +x), abre "flare" para baixo
const strip = (cx, cz, rx, rz, flare, a0, a1, y0, y1, bot) => (u, v, p) => { const a = lerp(a0, a1, u), k = 1 + flare * v; p.set(cx + Math.sin(a) * rx * k, lerp(y0, bot ? bot(u) : y1, v), cz + Math.cos(a) * rz * k); };
const rnd = s0 => { let s = s0; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
const mkTex = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
const wear = (g, w, h, seed, n = 60) => { const r = rnd(seed);
  for (let i = 0; i < 26; i++) { const x = r() * w, y = r() * h, q = 30 + r() * 90, gr = g.createRadialGradient(x, y, 0, x, y, q); gr.addColorStop(0, `rgba(${r() < 0.6 ? '20,22,30' : '255,255,255'},${0.05 + r() * 0.09})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - q, y - q, q * 2, q * 2); }
  for (let i = 0; i < n; i++) { g.strokeStyle = `rgba(${r() < 0.5 ? '255,255,255' : '30,34,44'},${0.12 + r() * 0.22})`; g.lineWidth = 1 + r() * 1.5; const x = r() * w, y = r() * h, a = r() * 6.28, l = 6 + r() * 30; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } };
// aço batido em três mapas casados: cor (manchas, riscos claros, furinhos), rugosidade (zonas espelhadas × foscas, escovado) e relevo (marteladas, riscos, furos)
const steelSet = (seed, dots = 240, base = '#a4a7ad', key = 'steel') => { const mk = () => { const c = document.createElement('canvas'); c.width = c.height = 512; return c; }, w = 512, h = 512;
  const CA = mk(), CR = mk(), CB = mk(), a = CA.getContext('2d'), q = CR.getContext('2d'), b = CB.getContext('2d'), r = rnd(seed);
  a.fillStyle = base; a.fillRect(0, 0, w, h); if (!paint(a, w, h, key, base, key === 'steel' ? 0.8 : 0.6, key === 'steel' ? 0.16 : 0.2)) paint(a, w, h, 'steel', base, 0.8, 0.16); a.globalAlpha = key === 'steel' ? 0.42 : 0.72; a.fillStyle = base; a.fillRect(0, 0, w, h); a.globalAlpha = 1;
  q.fillStyle = '#525252'; q.fillRect(0, 0, w, h); b.fillStyle = '#808080'; b.fillRect(0, 0, w, h);
  const blob = (g, x, y, rad, col, al) => { for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { if (x + ox + rad < 0 || x + ox - rad > w || y + oy + rad < 0 || y + oy - rad > h) continue; const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad); gr.addColorStop(0, `rgba(${col},${al})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2); } };
  for (let i = 0; i < 40; i++) blob(b, r() * w, r() * h, 26 + r() * 80, r() < 0.5 ? '255,255,255' : '0,0,0', 0.3 + r() * 0.35);            // marteladas
  for (let i = 0; i < 24; i++) { const x = r() * w, y = r() * h, rad = 45 + r() * 130, dk = r() < 0.5; blob(a, x, y, rad, dk ? (key === 'steel' ? '22,24,30' : '120,80,30') : '255,255,255', dk ? (key === 'steel' ? 0.3 + r() * 0.3 : 0.12 + r() * 0.12) : 0.22 + r() * 0.25); blob(q, x, y, rad, dk ? '170,170,170' : '38,38,38', 0.45 + r() * 0.4); }
  for (let i = 0; i < 300; i++) { const y = r() * h, x = r() * w, l = 40 + r() * 200; q.strokeStyle = `rgba(${r() < 0.5 ? '20,20,20' : '150,150,150'},${0.1 + r() * 0.14})`; q.lineWidth = 0.6 + r() * 1.4; q.beginPath(); q.moveTo(x, y); q.lineTo(x + l, y + (r() - 0.5) * 10); q.stroke(); }   // escovado
  for (let i = 0; i < 46; i++) { const x = r() * w, y = r() * h, an = r() * 6.28, l = i < 4 ? 50 + r() * 70 : 6 + r() * 24, x1 = x + Math.cos(an) * l, y1 = y + Math.sin(an) * l, lw = 0.6 + r() * 0.8, br = r() < 0.7;
    for (const [g, col] of [[a, br ? `rgba(255,255,255,${0.18 + r() * 0.3})` : `rgba(30,32,40,${0.25 + r() * 0.3})`], [q, 'rgba(8,8,8,0.6)'], [b, 'rgba(0,0,0,0.55)']]) { g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x1, y1); g.stroke(); } }
  for (let i = 0; i < dots; i++) { const x = r() * w, y = r() * h, rad = 0.6 + r() * 1.6, dot = (g, col, k = 1) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, rad * k, 0, 7); g.fill(); };
    if (r() < 0.55) { dot(a, `rgba(255,255,255,${0.4 + r() * 0.5})`); dot(q, 'rgba(6,6,6,0.9)', 1.3); } else { dot(a, `rgba(34,36,42,${0.3 + r() * 0.4})`); dot(q, 'rgba(200,200,200,0.8)', 1.6); dot(b, 'rgba(0,0,0,0.7)', 1.8); } }
  const T = (c, srgb) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  return { map: T(CA, true), roughMap: T(CR), bumpTex: T(CB) }; };
const S1 = steelSet(5), S2 = steelSet(11), S3 = steelSet(17, 120); for (const [S, rx] of [[S1, 3], [S2, 2], [S3, 2]]) for (const k in S) S[k].repeat.set(rx, 1);
const S0 = { map: null, roughMap: null, bumpTex: null }, ST1 = S1.map, ST2 = S2.map, ST3 = S3.map;
function foot(ph, s) { if (ph < 0.58) { const u = ph / 0.58; return { z: lerp(s * 0.52, -s * 0.48, u), y: 0, a: u < 0.14 ? lerp(-0.32, 0, u / 0.14) : u > 0.72 ? lerp(0, 0.5, (u - 0.72) / 0.28) : 0 }; }
  const u = (ph - 0.58) / 0.42, e = ss(u); return { z: lerp(-s * 0.48, s * 0.52, e), y: Math.sin(Math.PI * Math.pow(u, 0.8)) * 0.1 + 0.03 * (1 - u) * (1 - u), a: lerp(0.5, -0.32, Math.pow(u, 0.7)) + Math.sin(Math.PI * u) * 0.3 }; }
function ik(h, f, l1, l2, out) { let dz = f.z - h.z, dy = f.y - h.y, d = Math.hypot(dz, dy); const m = l1 + l2 - 0.003; if (d > m) { dz *= m / d; dy *= m / d; d = m; }
  const a = Math.atan2(dy, dz), b = Math.acos(cl((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), ka = a + b;
  out.k.set(h.x, h.y + Math.sin(ka) * l1, h.z + Math.cos(ka) * l1); out.f.set(h.x, h.y + dy, h.z + dz); }

