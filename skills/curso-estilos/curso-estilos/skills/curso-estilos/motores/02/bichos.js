// Bichos do sítio: galinha, vaca, cavalo e passarinho. Todos olham para +z, chão em y = 0.
import { THREE, mat, between, cl, lerp, mkTex, rnd, Y } from './kit3d.js';
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const B = m => new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), m), Cy = (rt, rb, m, s = 10) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, 1, s, 1), m);
const E = (g, m, sx, sy, sz, x, y, z) => { const k = B(m); k.scale.set(sx, sy, sz); k.position.set(x, y, z); g.add(k); return k; };
const fios = (base, claro, escuro, seed, n = 7000, manchas = null) => mkTex(512, 512, (g, w, h) => { const r = rnd(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
  if (manchas) { g.fillStyle = manchas; for (let i = 0; i < 9; i++) { g.beginPath(); const x = r() * w, y = r() * h; for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283, q = 50 + r() * 70; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q * 0.8); } g.fill(); } }
  g.lineCap = 'round'; for (let i = 0; i < n; i++) { const x = r() * w, y = r() * h, a = Math.PI / 2 + (r() - 0.5) * 0.7, l = 4 + r() * 8; g.strokeStyle = (r() < 0.55 ? claro : escuro).replace('A', (0.08 + r() * 0.14).toFixed(2)); g.lineWidth = 1 + r() * 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } });
const F = (t, e) => mat(0xffffff, { map: t, grain: 0.04, rim: 0.3, ...e }), P = (hex, e) => mat(hex, { grain: 0.06, rim: 0.3, ...e });
const sombra = r => { r.traverse(o => { if (o.isMesh) o.castShadow = true; }); return r; };

export function criaGalinha(o = {}) {
  const cor = o.cor ?? 0xf2ead8, tx = fios('#' + cor.toString(16).padStart(6, '0'), 'rgba(255,255,255,A)', 'rgba(90,60,30,A)', o.seed ?? 3, 5000), root = new THREE.Group(), body = new THREE.Group(); root.add(body); body.position.y = 0.26;
  E(body, F(tx), 0.13, 0.125, 0.17, 0, 0, 0); E(body, F(tx), 0.1, 0.1, 0.1, 0, 0.03, 0.1); for (const sx of [-1, 1]) E(body, F(tx, { shade: 0.6 }), 0.03, 0.085, 0.12, sx * 0.12, 0.01, -0.01);
  for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.2, 5), F(tx, { shade: 0.62 })); f.scale.z = 0.4; f.position.set((i - 2) * 0.03, 0.12, -0.17); f.rotation.set(-0.9 + Math.abs(i - 2) * 0.1, 0, (i - 2) * -0.25); body.add(f); }
  const neck = new THREE.Group(); neck.position.set(0, 0.06, 0.14); body.add(neck); const nk = Cy(0.045, 0.065, F(tx)); nk.scale.y = 0.16; nk.position.y = 0.07; neck.add(nk);
  const head = new THREE.Group(); head.position.y = 0.17; neck.add(head); E(head, F(tx), 0.055, 0.055, 0.06, 0, 0, 0);
  for (let i = 0; i < 3; i++) E(head, P(0xd8362a), 0.018, 0.026 - i * 0.003, 0.02, 0, 0.06, 0.02 - i * 0.03); E(head, P(0xd8362a), 0.014, 0.028, 0.014, 0, -0.055, 0.04);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 6), P(0xe8a83a)); beak.rotation.x = Math.PI / 2; beak.position.set(0, -0.008, 0.075); head.add(beak); for (const sx of [-1, 1]) E(head, P(0x140e0a, { rim: 0, shade: 1 }), 0.009, 0.01, 0.006, sx * 0.045, 0.012, 0.03);
  for (const sx of [-1, 1]) { const l = Cy(0.008, 0.008, P(0xe8a83a)); l.scale.y = 0.16; l.position.set(sx * 0.05, 0.08, 0); root.add(l); const f = B(P(0xe8a83a)); f.scale.set(0.03, 0.008, 0.04); f.position.set(sx * 0.05, 0.008, 0.015); root.add(f); }
  function pose(p = {}) { const t = p.t ?? 0, k = Math.max(0, Math.sin(t * (p.vel ?? 5) + (p.fase ?? 0))); neck.rotation.x = k * k * 1.5; head.rotation.x = k * 0.3; body.rotation.x = k * 0.25; body.position.y = 0.26 + Math.abs(Math.sin(t * 9 + (p.fase ?? 0))) * 0.004; }
  pose({}); return { root: sombra(root), pose };
}

function quad(o) { // corpo em barril + 4 pernas retas + pescoço/cabeça + rabo
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); body.position.y = o.h; const m = o.m, md = o.md ?? o.m;
  { const al = o.alto ?? 1.04; E(body, m, o.w, o.w * al, o.len * 0.52, 0, 0, 0); E(body, m, o.w * 1.02, o.w * al * 1.06, o.w * 1.25, 0, 0.02, o.len * 0.27); E(body, md, o.w * 1.04, o.w * al * 1.04, o.w * 1.3, 0, 0.015, -o.len * 0.27); }
  const legs = [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, f]) => { const g = new THREE.Group(); g.position.set(sx * o.w * 0.62, o.h - o.w * 0.3, f * o.len * 0.33); root.add(g); const L = o.h - o.w * 0.3;
    const up = Cy(o.leg * 1.2, o.leg * 1.9, sx > 0 ? md : m); up.scale.y = L * 0.52; up.position.y = -L * 0.26; g.add(up); { const th = B(sx > 0 ? md : m); th.scale.set(o.leg * 1.9, L * 0.17, o.leg * 2.4); th.position.set(0, -L * 0.04, f < 0 ? -o.leg : o.leg * 0.4); g.add(th); const kn = B(o.sock ?? (sx > 0 ? md : m)); kn.scale.setScalar(o.leg * 1.3); kn.position.y = -L * 0.52; g.add(kn); } const lo = Cy(o.leg * 0.85, o.leg * 1.2, o.sock ?? (sx > 0 ? md : m)); lo.scale.y = L * 0.46; lo.position.y = -L * 0.74; g.add(lo);
    const hf = Cy(o.leg * 1.15, o.leg * 1.35, o.hoof); hf.scale.y = o.leg * 1.4; hf.position.y = -L + o.leg * 0.7; g.add(hf); return g; });
  const neck = new THREE.Group(); neck.position.set(0, o.w * 0.35, o.len * 0.44); body.add(neck); const nk = Cy(o.nr * 0.8, o.nr * 1.25, m); nk.scale.y = o.nl; nk.position.y = o.nl / 2; neck.add(nk);
  const head = new THREE.Group(); head.position.y = o.nl; neck.add(head);
  const tail = new THREE.Group(); tail.position.set(0, o.w * 0.45, -o.len * 0.5); body.add(tail);
  return { root, body, legs, neck, head, tail };
}

export function criaVaca(o = {}) {
  const tx = fios('#f2ede2', 'rgba(255,255,255,A)', 'rgba(120,100,80,A)', o.seed ?? 11, 5000, o.cor ?? '#2a2420'), m = F(tx), pink = P(0xe6a8a0), dark = P(0x2a2420);
  const q = quad({ h: 1.0, w: 0.36, len: 1.5, leg: 0.05, nr: 0.17, nl: 0.42, m, hoof: dark });
  E(q.head, m, 0.15, 0.16, 0.2, 0, 0.02, 0.06); E(q.head, pink, 0.11, 0.09, 0.1, 0, -0.04, 0.24); for (const sx of [-1, 1]) { E(q.head, P(0x140e0a, { rim: 0, shade: 1 }), 0.02, 0.024, 0.012, sx * 0.12, 0.06, 0.13); E(q.head, dark, 0.012, 0.018, 0.008, sx * 0.045, -0.03, 0.335);
    const ear = E(q.head, m, 0.08, 0.035, 0.045, sx * 0.2, 0.09, -0.02); ear.rotation.z = sx * -0.3; const hr = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.14, 8), P(0xe8dcc0)); hr.position.set(sx * 0.1, 0.2, -0.02); hr.rotation.z = sx * -0.5; q.head.add(hr); }
  E(q.body, pink, 0.13, 0.11, 0.16, 0, -0.36, -0.36); const tl = Cy(0.018, 0.026, m); tl.scale.y = 0.75; tl.position.y = -0.37; q.tail.add(tl); E(q.tail, dark, 0.045, 0.09, 0.045, 0, -0.78, 0);
  function pose(p = {}) { const t = p.t ?? 0, f = p.fase ?? 0, g = p.pasta ?? 1; q.neck.rotation.x = lerp(0.9, 2.2, g) + Math.sin(t * 1.1 + f) * 0.05; q.head.rotation.x = lerp(-0.2, -0.75, g) + Math.sin(t * 6 + f) * 0.05 * g; q.tail.rotation.set(0.12, 0, Math.sin(t * 2.4 + f) * 0.5); q.body.position.y = 1.0 + Math.sin(t * 1.5 + f) * 0.004; }
  pose({}); return { root: sombra(q.root), pose };
}

export function criaCavalo(o = {}) {
  const tx = fios('#8a4f2a', 'rgba(220,160,100,A)', 'rgba(50,24,10,A)', 21), txd = fios('#3a2218', 'rgba(140,100,70,A)', 'rgba(10,6,4,A)', 23), m = F(tx), dark = F(txd), blk = P(0x1a1210);
  const q = quad({ h: 1.42, w: 0.34, len: 1.75, leg: 0.062, nr: 0.2, nl: 0.82, m, sock: dark, hoof: blk, alto: 1.02 }); E(q.neck, m, 0.24, 0.26, 0.3, 0, 0.04, -0.06); E(q.body, m, 0.3, 0.36, 0.3, 0, 0.06, 0.7); E(q.body, m, 0.33, 0.37, 0.34, 0, 0.05, -0.62);
  E(q.head, m, 0.11, 0.12, 0.16, 0, 0.03, 0.04); E(q.head, m, 0.085, 0.09, 0.2, 0, -0.05, 0.24); E(q.head, dark, 0.075, 0.07, 0.07, 0, -0.08, 0.41); E(q.head, P(0xf2ead8), 0.03, 0.02, 0.14, 0, 0.065, 0.2);
  for (const sx of [-1, 1]) { E(q.head, P(0x140e0a, { rim: 0, shade: 1 }), 0.018, 0.022, 0.012, sx * 0.095, 0.06, 0.1); const ear = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.11, 6), m); ear.position.set(sx * 0.06, 0.17, -0.02); ear.rotation.z = sx * -0.2; q.head.add(ear); q['ear' + sx] = ear; E(q.head, blk, 0.012, 0.016, 0.008, sx * 0.035, -0.08, 0.475); }
  for (let i = 0; i < 9; i++) { const k = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), dark); k.scale.set(0.03, 0.09, 0.07); k.position.set(0.02 * Math.sin(i), 0.1 + i * 0.085, -0.17 + 0.006 * i); k.rotation.set(-0.5, 0, 0.25 * Math.sin(i * 2)); q.neck.add(k); } const fl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.1), dark); fl.position.set(0, 0.12, 0.1); fl.rotation.x = 0.9; q.head.add(fl);
  const hairs = Array.from({ length: 5 }, (_, i) => { const s = Cy(0.05 - i * 0.007, 0.055 - i * 0.007, dark, 8); q.root.add(s); return s; });
  const p0 = V(), p1 = V();
  function pose(p = {}) { const t = p.t ?? 0; q.neck.rotation.x = 0.62 + Math.sin(t * 1.3) * 0.05; q.head.rotation.x = 0.75 + Math.sin(t * 1.3 + 1) * 0.06; q.head.rotation.y = Math.sin(t * 0.8) * 0.2; q['ear1'].rotation.x = Math.max(0, Math.sin(t * 5)) * -0.4; q.root.updateMatrixWorld(true);
    p0.copy(q.tail.localToWorld(V(0, 0, 0))); q.root.worldToLocal(p0); const sw = Math.sin(t * 2.6) * 0.1; hairs.forEach((s, i) => { p1.set(p0.x + sw * (i + 1) * 0.35, p0.y - 0.17, p0.z - 0.05 + i * 0.012); between(s, p1, p0); p0.copy(p1); }); }
  pose({}); return { root: sombra(q.root), pose };
}

export function criaPassaro() {
  const root = new THREE.Group(), m = P(0x3a6ea8), cr = P(0xf2e6c8); E(root, m, 0.05, 0.05, 0.07, 0, 0.06, 0); E(root, cr, 0.04, 0.04, 0.05, 0, 0.05, 0.03); const head = new THREE.Group(); head.position.set(0, 0.11, 0.045); root.add(head); E(head, m, 0.036, 0.036, 0.038, 0, 0, 0);
  const bk = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.04, 5), P(0xe8a83a)); bk.rotation.x = Math.PI / 2; bk.position.z = 0.05; head.add(bk); for (const sx of [-1, 1]) E(head, P(0x0a0806, { rim: 0, shade: 1 }), 0.006, 0.007, 0.004, sx * 0.028, 0.008, 0.022);
  const tl = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.1), m); tl.position.set(0, 0.07, -0.1); tl.rotation.x = -0.4; root.add(tl);
  function pose(p = {}) { const t = p.t ?? 0; head.rotation.y = Math.sin(Math.floor(t * 3) * 2.1) * 0.9; head.rotation.x = Math.sin(Math.floor(t * 3 + 0.5) * 1.3) * 0.2; root.position.y = (p.y ?? 0) + Math.max(0, Math.sin(t * 6)) * (p.pulo ?? 0); tl.rotation.x = -0.4 + Math.sin(t * 12) * 0.1; }
  pose({}); return { root: sombra(root), pose };
}
