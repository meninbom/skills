// lab_profundo.js (15/11) — corrida com profundidade, receita medida em contas de referência: boneco 2D (chapa sempre virada pra câmera)
// dentro de um palco em perspectiva (câmera pinhole olhando reto, só translada e empurra). Chão contínuo, chapas em pé em várias
// distâncias, névoa por distância, sombras longas de fim de tarde, 1º plano preto borrado, poça de luz atrás do boneco.
// Os pés da Rosa são projetados no chão do mundo: pé plantado fica parado no mundo mesmo correndo pra dentro da cena.
// Planos: A = travelling lateral (perfil) · B = diagonal vindo pra câmera (3/4 frente) · C = indo embora pro sol (3/4 costas)
import * as B from './boneco.js';
import { gerar, ROSA_FICHA } from './gerador.js';
import { anda } from './fisica_v5.js';   // corrida da v5 (a que vale: lisa a 60 qps, sem quique exagerado)
const cv = document.getElementById('c'), g = cv.getContext('2d'), W = 1080, H = 1920, Q = new URLSearchParams(location.search);
const ROSA = gerar(ROSA_FICHA), R = ROSA.R, F = 1500, cl = B.cl, lerp = B.lerp, TAU = Math.PI * 2;
const sm = k => { k = cl(k); return k * k * (3 - 2 * k); }, eOut = (k, p = 2.4) => 1 - Math.pow(1 - cl(k), p);
const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const SOL = [-0.25, 0.97], SOMB = [0.25, -0.97];                         // direção do sol (no chão) e das sombras
// ---------- cor e névoa
const h2 = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }, CC = new Map();
const NEV = h2('#efcf9e');
function cor(h, d, a = 1, ext = 1) {                                       // cor base → misturada com a névoa conforme a distância d
  const k = Math.round(cl((1 - Math.exp(-d / 6500)) * ext, 0, 0.94) * 50) / 50, key = h + k + a; let v = CC.get(key); if (v) return v;
  const c = h2(h).map((x, i) => Math.round(lerp(x, NEV[i], k))); v = `rgba(${c[0]},${c[1]},${c[2]},${a})`; CC.set(key, v); return v;
}
// ---------- palco: tudo gerado de uma semente; corredores dos três trajetos ficam livres
const CAM = { A: { cx: 0, cy: 330, yh: 900 }, B: { cx: 6000, cy: 380, yh: 820 }, C: { cx: 12000, cy: 300, yh: 930 } };
const v0 = anda(0, R, { ritmo: 1, exagero: 1 }).v, DUR = 3.1;
const TRAJ = { A: { p0: [0, 1500], d: [1, 0] }, B: { p0: [6000 - 900, 3550], d: null }, C: { p0: [12000 + 150, 900], d: SOL } };
{ const dz = 900 - 3550, dx = Math.sqrt(Math.max(0, (v0 * DUR) ** 2 - dz * dz)), n = Math.hypot(dx, dz); TRAJ.B.d = [dx / n, dz / n]; }
const corpo = (T, u) => [T.p0[0] + T.d[0] * v0 * u, T.p0[1] + T.d[1] * v0 * u];
const segD = (p, a, b) => { const ab = [b[0] - a[0], b[1] - a[1]], t = cl(((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / (ab[0] ** 2 + ab[1] ** 2)); return Math.hypot(p[0] - a[0] - ab[0] * t, p[1] - a[1] - ab[1] * t); };
const livre = (X, Z, m) => Object.values(TRAJ).every(T => segD([X, Z], T.p0, [T.p0[0] + T.d[0] * v0 * (DUR + 0.6), T.p0[1] + T.d[1] * v0 * (DUR + 0.6)]) > m);
const CAMX = { A: u => TRAJ.A.p0[0] + v0 * u + 250, B: u => 6000 + 150 * sm(u / DUR), C: u => 12000 - 170 * sm(u / DUR) };
const tapa = (X, Z) => Object.entries(TRAJ).some(([k, T]) => { for (let u = 0; u <= DUR + 0.3; u += 0.15) { const p = corpo(T, u), cx = CAMX[k](u); if (Z < 650 || Z > p[1]) continue;
  const lx = cx + (p[0] - cx) * Z / p[1]; if (Math.abs(X - lx) < 300 * Z / p[1] + 120) return true; } return false; });   // fica entre a câmera e a Rosa
const OBJ = [], CHAOS = [], MOTES = [];
{ const r = rng(47);
  const folhas = (n, rc, cima) => Array.from({ length: n }, () => { const a = cima ? -Math.PI / 2 + (r() - 0.5) * 2.6 : r() * TAU, rr = rc * Math.sqrt(r()) * 0.62; return { x: Math.cos(a) * rr, y: Math.sin(a) * rr * 0.8, an: a + (r() - 0.5) * 0.9, L: rc * (0.42 + r() * 0.4), w: 0.2 + r() * 0.12, t: r() }; });
  for (let i = 0; i < 2600; i++) { const X = -3500 + r() * 19000, Z = 1700 + Math.pow(r(), 0.7) * 15000; if (!livre(X, Z, 420)) continue;
    if (OBJ.filter(o => o.tipo === 'arv').length > 320) break; const h = 1700 + r() * 2000, rc = h * (0.24 + r() * 0.1);
    OBJ.push({ tipo: 'arv', X, Z, h, w: 55 + r() * 75, cv: (r() - 0.5) * 0.12, rc, F: folhas(Z > 7000 ? 12 : 26, rc, false), F2: folhas(Z > 7000 ? 6 : 12, rc * 0.7, false), cor: ['#3f5a2c', '#4c6630', '#36502a'][i % 3] }); }
  for (let i = 0; i < 900; i++) { const X = -3500 + r() * 19000, Z = 700 + Math.pow(r(), 1.3) * 9000; if (!livre(X, Z, 260) || tapa(X, Z)) continue; const s = 90 + r() * 260;
    OBJ.push(r() < 0.22 ? { tipo: 'pedra', X, Z, s: s * 0.7, k: r(), cor: ['#7a6c58', '#6a604f'][i % 2] } : { tipo: 'moita', X, Z, s, F: folhas(14, s, true), cor: ['#4f6b34', '#5d7534', '#44602e'][i % 3] }); }
  for (let i = 0; i < 9000; i++) { const X = -3500 + r() * 19000, Z = 420 + Math.pow(r(), 1.6) * 5200; if (!livre(X, Z, 70)) continue; OBJ.push({ tipo: 'tufo', X, Z, s: 26 + r() * 46, k: r(), fl: r() < 0.08 }); }
  for (let i = 0; i < 1100; i++) { const X = -3500 + r() * 19000, Z = 300 + Math.pow(r(), 1.2) * 13000; CHAOS.push({ X, Z, r: 140 + r() * 900, c: ['#5f6a33', '#6f6c37', '#4a5529', '#8a7b42', '#a08c4c'][Math.floor(r() * 5)], a: 0.35 + r() * 0.45 }); }
  for (let i = 0; i < 420; i++) MOTES.push({ X: -1500 + r() * 15500, Z: 500 + r() * 4500, Y: 60 + r() * 900, f: r() * TAU, r: 2 + r() * 3.5 });
}
// 1º plano preto (fica entre a câmera e o trajeto): moita grande e capim de borda
const FRENTE = { A: [{ tipo: 'troncoF', X: 0, Z: 400, s: 210, seed: 3 }, ...Array.from({ length: 30 }, (_, i) => ({ tipo: 'capimF', X: -800 + i * 160, Z: 380, s: 150 + (i * 37 % 60), seed: i }))],
  B: [{ tipo: 'galhoF', X: 6000 - 640, Z: 520, s: 520, seed: 5 }], C: [{ tipo: 'moitaF', X: 12000 + 520, Z: 430, s: 420, seed: 8 }, { tipo: 'capimF', X: 12000 - 380, Z: 360, s: 190, seed: 2 }, { tipo: 'capimF', X: 12000 - 250, Z: 360, s: 160, seed: 4 }] };
{ const xa = TRAJ.A.p0[0] + v0 * 1.75 + 250 - (v0 * 1.75 + 250) * 0 + 0; FRENTE.A[0].X = xa; }       // a moita cruza o quadro (e tapa a Rosa) por volta de 1,75 s

// ---------- Rosa: corrida da anda() com os pés no mundo
const OPA = { ritmo: 1, exagero: 1 };
const PL = [{ id: 'A_lado', t0: 0, D: DUR, cam: 'A', vista: 'l', dir: 1 }, { id: 'B_vem', t0: DUR, D: DUR, cam: 'B', vista: 'q', dir: 1 }, { id: 'C_vai', t0: 2 * DUR, D: DUR + 0.5, cam: 'C', vista: 'b', vz: 0.62, dir: -1 }];
const FIM = PL[2].t0 + PL[2].D;
function proj(c, X, Y, Z) { const d = Math.max(30, Z - 0), s = F / d; return [W / 2 + (X - c.cx) * s, c.yh + (c.cy - Y) * s, s, d]; }
function rosaPose(pl, c, u) {
  const T = TRAJ[pl.cam], a = anda(u, R, { ...OPA, vz: pl.vz ?? { l: 0, q: 0.5, b: 1 }[pl.vista] }), b = corpo(T, u), [sx, sy, s] = proj(c, b[0], 0, b[1]), nrm = [-T.d[1], T.d[0]], P = {};
  for (const k in a) if (!['x', 'v', 'fase', 'Ls', 'T', 'duty'].includes(k)) P[k] = a[k];
  let desce = 0;
  for (const [n, sg] of [['N', -1], ['F', 1]]) { const p = a['p' + n], lat = pl.vista === 'l' ? 0 : sg * R.quadril * 0.18, X = b[0] + T.d[0] * p[0] + nrm[0] * lat, Z = b[1] + T.d[1] * p[0] + nrm[1] * lat;
    const [fx, fy, fs] = proj(c, X, 0, Z), lx = (fx - sx) / s * pl.dir, ly = (fy - sy) / s; P['p' + n] = [lx, ly + p[1] * fs / s]; desce = Math.max(desce, ly * (p[1] > -2 ? 1.15 : 0.8), Math.abs(lx - p[0]) * 0.35); }
  P.agacha = (P.agacha || 0) + desce;
  for (const k of ['mN', 'eN', 'mF', 'eF']) if (P[k]) P[k] = [P[k][0], P[k][1] + desce];   // mãos descem junto com o quadril
  return { P, sx, sy, s, b };
}
const CONTATOS = {};                                                       // onde cada pé cravou (poeira nasce parada no mundo)
for (const pl of PL) { const T = TRAJ[pl.cam], L = []; let ant = {}; for (let u = 0; u < pl.D; u += 1 / 240) { const a = anda(u, R, OPA), b = corpo(T, u);
  for (const n of ['N', 'F']) { const no = a['p' + n][1] > -1.5; if (no && ant[n] === false) L.push({ u, X: b[0] + T.d[0] * a['p' + n][0], Z: b[1] + T.d[1] * a['p' + n][0] }); ant[n] = no; } } CONTATOS[pl.id] = L; }

// ---------- desenho de peças (coordenadas da chapa: origem no chão, unidade = mundo)
let ZM = 1; const OX = W / 2, OY = H * 0.5;
const poe = (x, y, s, gg = g) => gg.setTransform(ZM * s, 0, 0, ZM * s, ZM * x + OX * (1 - ZM), ZM * y + OY * (1 - ZM));
function folha(gg, x, y, L, w, an) { const c = Math.cos(an), s = Math.sin(an), tx = x + c * L, ty = y + s * L, mx = x + c * L * 0.45, my = y + s * L * 0.45, px = -s * L * w, py = c * L * w;
  gg.moveTo(x, y); gg.quadraticCurveTo(mx + px, my + py, tx, ty); gg.quadraticCurveTo(mx - px, my - py, x, y); }
function copa(gg, o, cx, cy, d, esc) {
  gg.fillStyle = cor(esc ? '#2a3a20' : '#2f4424', d); gg.beginPath(); for (const f of o.F) folha(gg, cx + f.x, cy + f.y, f.L, f.w, f.an); gg.fill();
  gg.fillStyle = cor(o.cor, d); gg.beginPath(); for (const f of o.F2) folha(gg, cx + f.x - o.rc * 0.12, cy + f.y - o.rc * 0.1, f.L, f.w, f.an); gg.fill();
  gg.fillStyle = cor('#c9b14e', d, 0.9); gg.beginPath(); for (const f of o.F2) if (f.t < 0.35) folha(gg, cx + f.x - o.rc * 0.3, cy + f.y - o.rc * 0.2, f.L * 0.7, f.w * 0.8, f.an); gg.fill();
}
function peca(o, c, t) {
  const [sx, sy, s, d] = proj(c, o.X, 0, o.Z); if (d < 60) return;
  const larg = (o.tipo === 'arv' ? o.rc * 1.3 : o.tipo === 'tufo' ? 60 : (o.s || 300)) * s; if (sx + larg < -40 || sx - larg > W + 40 || sy - (o.h || 600) * s > H + 50 || sy < c.yh - 5 && o.tipo !== 'arv') return;
  poe(sx, sy, s);
  if (o.tipo === 'arv') {
    const hw = o.w / 2, top = -o.h * 0.78; g.fillStyle = cor('#3b2f24', d); g.beginPath(); g.moveTo(-hw, 0); g.quadraticCurveTo(-hw * 0.7 + o.cv * o.h, top * 0.5, -hw * 0.45 + o.cv * o.h * 1.4, top);
    g.lineTo(hw * 0.45 + o.cv * o.h * 1.4, top); g.quadraticCurveTo(hw * 0.75 + o.cv * o.h, top * 0.5, hw, 0); g.closePath(); g.fill();
    g.fillStyle = cor('#d9a35e', d, 0.55); g.beginPath(); g.moveTo(-hw, 0); g.quadraticCurveTo(-hw * 0.7 + o.cv * o.h, top * 0.5, -hw * 0.45 + o.cv * o.h * 1.4, top); g.lineTo(-hw * 0.2 + o.cv * o.h * 1.4, top); g.quadraticCurveTo(-hw * 0.4 + o.cv * o.h, top * 0.5, -hw * 0.6, 0); g.closePath(); g.fill();
    g.fillStyle = cor('#2a2219', d); g.beginPath(); g.ellipse(0, 0, hw * 1.5, hw * 0.3, 0, 0, TAU); g.fill();
    copa(g, o, o.cv * o.h * 1.4, -o.h + o.rc * 0.3, d);
  } else if (o.tipo === 'moita') {
    g.fillStyle = cor('#2b3d20', d); g.beginPath(); for (const f of o.F) folha(g, f.x * 0.5, 0, f.L, f.w, f.an); g.fill();
    g.fillStyle = cor(o.cor, d); g.beginPath(); for (const f of o.F) if (f.t > 0.4) folha(g, f.x * 0.5 - o.s * 0.08, -4, f.L * 0.85, f.w, f.an - 0.1); g.fill();
    g.fillStyle = cor('#cdb54f', d, 0.85); g.beginPath(); for (const f of o.F) if (f.t > 0.8) folha(g, f.x * 0.5 - o.s * 0.16, -6, f.L * 0.6, f.w * 0.8, f.an - 0.15); g.fill();
  } else if (o.tipo === 'pedra') {
    const w = o.s, h = o.s * (0.45 + o.k * 0.3); g.fillStyle = cor('#4a4136', d); g.beginPath(); g.moveTo(-w * 0.6, 0); g.quadraticCurveTo(-w * 0.62, -h, -w * 0.05, -h * 1.02); g.quadraticCurveTo(w * 0.55, -h * 0.95, w * 0.6, 0); g.closePath(); g.fill();
    g.fillStyle = cor(o.cor, d); g.beginPath(); g.moveTo(-w * 0.56, -h * 0.1); g.quadraticCurveTo(-w * 0.58, -h * 0.96, -w * 0.05, -h * 0.98); g.quadraticCurveTo(w * 0.2, -h * 0.9, w * 0.05, -h * 0.4); g.quadraticCurveTo(-w * 0.2, -h * 0.2, -w * 0.56, -h * 0.1); g.fill();
    g.fillStyle = cor('#e9c78c', d, 0.7); g.beginPath(); g.moveTo(-w * 0.5, -h * 0.5); g.quadraticCurveTo(-w * 0.45, -h * 0.95, -w * 0.05, -h * 0.98); g.quadraticCurveTo(-w * 0.35, -h * 0.8, -w * 0.5, -h * 0.5); g.fill();
  } else if (o.tipo === 'tufo') {
    const sw = Math.sin(t * 2.1 + o.X * 0.01) * 0.08; g.strokeStyle = cor(o.k > 0.5 ? '#5f6d32' : '#7a7a3a', d); g.lineWidth = 5.5; g.lineCap = 'round'; g.beginPath();
    for (const a of [-0.55, -0.2, 0.12, 0.45]) { g.moveTo(a * 14, 0); g.quadraticCurveTo(a * 20, -o.s * 0.6, Math.sin(a + sw) * o.s * 0.75, -Math.cos(a) * o.s); } g.stroke();
    g.strokeStyle = cor('#d8bd5c', d, 0.8); g.lineWidth = 3.5; g.beginPath(); g.moveTo(-8, -2); g.quadraticCurveTo(-14, -o.s * 0.6, Math.sin(-0.55 + sw) * o.s * 0.75, -Math.cos(-0.55) * o.s); g.stroke();
    if (o.fl) { g.fillStyle = cor('#f0e2b8', d); g.beginPath(); g.arc(Math.sin(0.12 + sw) * o.s * 0.75, -o.s * 0.98, 7, 0, TAU); g.fill(); }
  }
}
function sombras(c) {                                                        // sombras longas no chão (de árvore, pedra e moita) vindo na direção da câmera
  g.fillStyle = 'rgba(38,40,18,0.30)'; g.beginPath();
  for (const o of OBJ) { if (o.tipo === 'tufo') continue; const L = o.tipo === 'arv' ? o.h * 1.5 : (o.s || 200) * 1.4, w = o.tipo === 'arv' ? o.w * 0.55 : (o.s || 200) * 0.35, ex = o.X + SOMB[0] * L, ez = o.Z + SOMB[1] * L;
    if (Math.max(o.Z, ez) < 120 || o.Z > 9000) continue; const zs = [[o.X - w, o.Z], [o.X + w, o.Z], [ex + w * (o.tipo === 'arv' ? 0.6 : 0.3), Math.max(120, ez)], [ex - w * (o.tipo === 'arv' ? 0.6 : 0.3), Math.max(120, ez)]].map(([X, Z]) => proj(c, X, 0, Z));
    if (zs.every(p => p[0] < -50) || zs.every(p => p[0] > W + 50)) continue; g.moveTo(zs[0][0], zs[0][1]); for (const p of zs.slice(1)) g.lineTo(p[0], p[1]); g.closePath();
    if (o.tipo === 'arv' && ez > 150) { const [cx, cy, s, dd] = proj(c, ex, 0, ez), rx = o.rc * 0.9 * s, ry = rx * c.cy / dd; g.moveTo(cx + rx, cy); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); } }
  g.fill();
}
function ceu(c, t) {
  g.setTransform(1, 0, 0, 1, 0, 0); const gr = g.createLinearGradient(0, 0, 0, c.yh + 40); gr.addColorStop(0, '#6f8ea6'); gr.addColorStop(0.45, '#c9b79a'); gr.addColorStop(0.85, '#f6d29a'); gr.addColorStop(1, '#fde3b2'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  poe(0, 0, 1); const sx = W / 2 + F * SOL[0] / SOL[1], sy = c.yh - 150, sg = g.createRadialGradient(sx, sy, 0, sx, sy, 900); sg.addColorStop(0, 'rgba(255,246,214,1)'); sg.addColorStop(0.08, 'rgba(255,232,170,0.95)'); sg.addColorStop(0.3, 'rgba(255,205,130,0.35)'); sg.addColorStop(1, 'rgba(255,200,120,0)');
  g.fillStyle = sg; g.fillRect(-300, -300, W + 600, H + 600);
  for (const [Z, A, col, fr] of [[60000, 2600, '#c8a886', 0.00011], [32000, 1500, '#a99373', 0.00023], [18000, 900, '#8d8466', 0.0004]]) {      // serras ao longe
    g.fillStyle = cor(col, 0, 1); g.beginPath(); const x0 = c.cx - (W / 2 + 200) * Z / F, x1 = c.cx + (W / 2 + 200) * Z / F; let first = true;
    for (let X = x0; X <= x1; X += (x1 - x0) / 90) { const Y = A * (0.5 + 0.3 * Math.sin(X * fr) + 0.2 * Math.sin(X * fr * 2.7 + 1.3)), [px, py] = proj(c, X, Y, Z); first ? g.moveTo(px, py) : g.lineTo(px, py); first = false; }
    const [, gy] = proj(c, 0, 0, Z); g.lineTo(W + 300, gy + 4); g.lineTo(-300, gy + 4); g.closePath(); g.fill(); }
}
function chao(c) {
  poe(0, 0, 1); const gr = g.createLinearGradient(0, c.yh, 0, H + 200), st = [0, 0.004, 0.012, 0.03, 0.07, 0.15, 0.3, 0.6, 1];
  for (const k of st) { const y = c.yh + k * (H + 200 - c.yh), d = c.cy * F / Math.max(1, y - c.yh); gr.addColorStop(k, cor(k < 0.05 ? '#8c8448' : '#4d5a2b', d, 1, 1.15)); }
  g.fillStyle = gr; g.fillRect(-300, c.yh, W + 600, H - c.yh + 400);
  for (const p of CHAOS) { const [sx, sy, s, d] = proj(c, p.X, 0, p.Z), rx = p.r * s, ry = p.r * c.cy * F / (d * d); if (sx + rx < -50 || sx - rx > W + 50 || sy - ry > H + 50) continue;
    g.fillStyle = cor(p.c, d, p.a, 1.1); g.beginPath(); g.ellipse(sx, sy, rx, ry, 0, 0, TAU); g.fill(); }
}
// 1º plano preto e borrado (camada à parte)
const FG = document.createElement('canvas'); FG.width = W; FG.height = H; const fg = FG.getContext('2d'), FS = document.createElement('canvas'); FS.width = W / 54; FS.height = H / 54; const fs = FS.getContext('2d'), FM = document.createElement('canvas'); FM.width = W / 9; FM.height = H / 9; const fm = FM.getContext('2d');
function frente(c, nome, t) {
  fg.setTransform(1, 0, 0, 1, 0, 0); fg.clearRect(0, 0, W, H); let algum = false;
  for (const o of FRENTE[nome]) { const [sx, sy, s] = proj(c, o.X, 0, o.Z); if (sx < -o.s * s * 1.2 || sx > W + o.s * s * 1.2) continue; algum = true; poe(sx, sy, s, fg); const r = rng(o.seed * 99 + 1);
    fg.fillStyle = '#130f0b'; fg.beginPath();
    if (o.tipo === 'moitaF') for (let i = 0; i < 22; i++) folha(fg, (r() - 0.5) * o.s * 0.5, 30, o.s * (0.55 + r() * 0.5), 0.2, -Math.PI / 2 + (r() - 0.5) * 2.4);
    else if (o.tipo === 'capimF') for (let i = 0; i < 6; i++) folha(fg, (r() - 0.5) * 40, 40, o.s * (0.6 + r() * 0.6), 0.09, -Math.PI / 2 + (r() - 0.5) * 0.9 + Math.sin(t * 2 + o.seed) * 0.04);
    else if (o.tipo === 'troncoF') { fg.moveTo(-o.s * 0.22, 60); fg.quadraticCurveTo(-o.s * 0.3, -o.s * 4, -o.s * 0.12, -o.s * 9); fg.lineTo(o.s * 0.14, -o.s * 9); fg.quadraticCurveTo(o.s * 0.05, -o.s * 4, o.s * 0.24, 60); fg.closePath();
      for (let i = 0; i < 9; i++) folha(fg, (r() - 0.5) * o.s * 0.3, -o.s * (1.2 + r() * 2.5), o.s * (0.5 + r() * 0.5), 0.22, r() < 0.5 ? -0.5 - r() * 0.6 : Math.PI + 0.5 + r() * 0.6); }
    else { const bx = -o.s * 0.2, by = -o.s * 3.4; fg.moveTo(-o.s * 1.5, by - 40); fg.quadraticCurveTo(bx, by - 120, o.s * 0.9, by + 60); fg.lineTo(o.s * 0.86, by + 90); fg.quadraticCurveTo(bx, by - 60, -o.s * 1.5, by + 20); fg.closePath();
      for (let i = 0; i < 16; i++) { const k = r(), x = lerp(-o.s * 1.4, o.s * 0.7, k), y = by - 70 + k * 120; folha(fg, x, y, o.s * (0.35 + r() * 0.35), 0.24, Math.PI * (0.25 + r() * 0.5) + Math.sin(t * 1.3 + i) * 0.03); } }
    fg.fill(); }
  if (!algum) return; fs.clearRect(0, 0, FS.width, FS.height); fs.imageSmoothingQuality = 'high'; fs.drawImage(FG, 0, 0, FS.width, FS.height);   // desfoque barato e certo: reduz 1/12 e amplia
  g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; fm.clearRect(0, 0, FM.width, FM.height); fm.imageSmoothingQuality = 'high'; fm.drawImage(FS, 0, 0, FM.width, FM.height); g.drawImage(FM, 0, 0, W, H);
}
function poeira(pl, c, u) {
  for (const k of CONTATOS[pl.id]) { const age = u - k.u; if (age < 0 || age > 0.6) continue; const [sx, sy, s, d] = proj(c, k.X, 0, k.Z), a = 1 - age / 0.6; poe(sx, sy, s);
    for (let i = 0; i < 6; i++) { const an = Math.PI * (0.5 + i * 0.09), rr = 18 + age * 150 * (0.6 + i * 0.12), r = 14 + age * 95 * (0.5 + 0.14 * i);
      g.fillStyle = cor('#f1cf95', d, 0.5 * a * a); g.beginPath(); g.ellipse(Math.cos(an) * rr * pl.dir - age * 40 * pl.dir, -6 - Math.abs(Math.sin(an)) * rr * 0.35 - age * 40, r, r * 0.7, 0, 0, TAU); g.fill(); } }
}
function sombraRosa(c, b, u) {                                               // sombra longa da Rosa no chão
  const L = 520 + 25 * Math.sin(u * 12), w = 70, pts = [[b[0] - w, b[1]], [b[0] + w, b[1]], [b[0] + SOMB[0] * L + w * 0.5, b[1] + SOMB[1] * L], [b[0] + SOMB[0] * L - w * 0.5, b[1] + SOMB[1] * L]].map(([X, Z]) => proj(c, X, 0, Math.max(150, Z)));
  poe(0, 0, 1); g.fillStyle = 'rgba(38,36,16,0.34)'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.closePath(); g.fill();
}
function luzAtras(sx, sy, s) {                                               // poça de luz quente atrás do boneco
  poe(0, 0, 1); const cy = sy - 330 * s, r = 760 * s, gr = g.createRadialGradient(sx, cy, 0, sx, cy, r); gr.addColorStop(0, 'rgba(255,226,160,0.42)'); gr.addColorStop(0.5, 'rgba(255,210,140,0.16)'); gr.addColorStop(1, 'rgba(255,200,130,0)');
  g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.fillRect(sx - r, cy - r, r * 2, r * 2); g.globalCompositeOperation = 'source-over';
}
function poeiraAr(c, t) {                                                    // pólen no sol
  g.globalCompositeOperation = 'lighter';
  for (const m of MOTES) { const [sx, sy, s, d] = proj(c, m.X + Math.sin(t * 0.7 + m.f) * 40, m.Y + Math.sin(t * 0.9 + m.f * 2) * 25, m.Z); if (sx < -20 || sx > W + 20 || sy < 0 || sy > H) continue;
    poe(sx, sy, 1); g.fillStyle = `rgba(255,224,160,${(0.35 * (0.5 + 0.5 * Math.sin(t * 3 + m.f))).toFixed(3)})`; g.beginPath(); g.arc(0, 0, m.r * Math.min(2.2, s), 0, TAU); g.fill(); }
  g.globalCompositeOperation = 'source-over';
}
// ---------- pós: raios, brilho, vinheta, grão
const BL = document.createElement('canvas'); BL.width = W / 4; BL.height = H / 4; const bl = BL.getContext('2d');
const GR = document.createElement('canvas'); GR.width = GR.height = 256; { const x = GR.getContext('2d'), id = x.createImageData(256, 256), r = rng(9); for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (r() - 0.5) * 120; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } x.putImageData(id, 0, 0); }
function raios(c, q) {
  g.setTransform(1, 0, 0, 1, 0, 0); const sx = OX + ZM * (W / 2 + F * SOL[0] / SOL[1] - OX), sy = OY + ZM * (c.yh - 150 - OY);
  g.globalCompositeOperation = 'screen'; for (let i = 0; i < 7; i++) { const a = 0.35 + i * 0.13 + Math.sin(q * 0.01 + i) * 0.01, w = 0.035 + (i % 3) * 0.02, L = 2600;
    const gr = g.createLinearGradient(sx, sy, sx + Math.cos(a) * L, sy + Math.sin(a) * L); gr.addColorStop(0, 'rgba(255,225,160,0.16)'); gr.addColorStop(1, 'rgba(255,225,160,0)'); g.fillStyle = gr;
    g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a - w) * L, sy + Math.sin(a - w) * L); g.lineTo(sx + Math.cos(a + w) * L, sy + Math.sin(a + w) * L); g.closePath(); g.fill(); }
  g.globalCompositeOperation = 'source-over';
}
function pos(c, q) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'screen';
  bl.filter = 'brightness(0.75) contrast(2.4) blur(7px)'; bl.clearRect(0, 0, BL.width, BL.height); bl.drawImage(cv, 0, 0, BL.width, BL.height); bl.filter = 'none';
  g.globalAlpha = 0.32; g.drawImage(BL, 0, 0, W, H); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  const vg = g.createRadialGradient(W / 2, H * 0.5, H * 0.28, W / 2, H * 0.5, H * 0.72); vg.addColorStop(0, 'rgba(20,12,6,0)'); vg.addColorStop(1, 'rgba(20,12,6,0.62)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.09; const ox = (q * 97) % 256, oy = (q * 61) % 256; for (let y = -oy; y < H; y += 256) for (let x = -ox; x < W; x += 256) g.drawImage(GR, x, y); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}

// ---------- quadro
B.setAmb([1.04, 0.95, 0.84], [10, 4, 0]); B.setLuz({ cor: '#ffd68f', w: 3.2 });
function frame(t) {
  B.RELOGIO.t = t; const pl = PL.find(p => t < p.t0 + p.D) || PL[2], u = Math.min(t - pl.t0, pl.D), k = u / pl.D, base = CAM[pl.cam], q = Math.round(t * 60);
  const T = TRAJ[pl.cam], b = corpo(T, u), c = { ...base };
  if (pl.cam === 'A') { c.cx = b[0] + 250 + Math.sin(u * 1.7) * 6; ZM = 1 + 0.05 * eOut(k); }
  else if (pl.cam === 'B') { c.cx = base.cx + 150 * sm(k); ZM = 1 + 0.06 * eOut(k); }
  else { c.cx = base.cx - 170 * sm(k); ZM = 1 + 0.08 * eOut(k); }
  c.cy = base.cy + Math.sin(u * 10.5) * 2;                                   // câmera na mão, bem leve
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
  ceu(c, t); chao(c); sombras(c);
  const ur = u, rp = rosaPose(pl, c, ur), lista = OBJ.filter(o => o.Z > 40).map(o => ({ o, Z: o.Z }));
  lista.push({ rosa: true, Z: rp.b[1] }); lista.sort((a, b) => b.Z - a.Z);
  let foi = false;
  for (const it of lista) { if (it.rosa) { foi = true; sombraRosa(c, rp.b, ur); luzAtras(rp.sx, rp.sy, rp.s); poeira(pl, c, ur);
      poe(0, 0, 1); B.boneco(g, ROSA, { ...rp.P, x: rp.sx, y: rp.sy, s: rp.s, dir: pl.dir, vista: pl.vista, vz: pl.vz, expr: pl.cam === 'C' ? 'firme' : 'bravo', sombra: true }); continue; }
    peca(it.o, c, t); }
  poeiraAr(c, t); raios(c, q); frente(c, pl.cam, t); pos(c, q);
}
await document.fonts.load('700 84px RC').catch(() => {});
window.PLANOS = PL.map(({ id, t0, D }) => ({ id, t0, D })); window.END = FIM; console.log('FIM ' + FIM.toFixed(2));
window.seek = async t => frame(t); await window.seek(0); window.READY = true;
