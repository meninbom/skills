// motor.js — cena 2D em camadas com paralaxe e desfoque, câmera, acabamento, legenda e HUD.
// Tudo é função de t (render determinístico por seek).
import { TAU, lerp, cl, C, setAmb } from './boneco.js';
export const W = 1080, H = 1920, CH = 1300;                          // CH = linha do chão no plano da ação
export const st = (a, b, v) => { const k = cl((v - a) / (b - a)); return k * k * (3 - 2 * k); };
export const eOut = (k, p = 3) => 1 - Math.pow(1 - cl(k), p), eIn = (k, p = 3) => Math.pow(cl(k), p), eIO = k => { k = cl(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
export const eBack = (k, c = 1.8) => { k = cl(k); return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
export const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
export const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const OX = 1000, OY = 700, LW = W + OX * 2, LH = H + OY * 2;
const layer = fn => { const a = mk(LW, LH), g = a.getContext('2d'); g.translate(OX, OY); fn(g); return a; };
// as chapas do bosque só são pintadas na 1ª vez que cena() precisa delas: quem importa o motor só pela legenda,
// pelas curvas ou pelos efeitos (como o kit_template, que traz o cenário de fora) não paga por elas.
const tarde = fn => { let c = null; return () => c || (c = layer(fn)); };

// ---------- bosque noturno (azul, névoa, troncos retorcidos)
function galho(g, x, y, an, len, w, d, R, cor) {
  const n = 5; let px = x, py = y, a = an; g.strokeStyle = cor; g.lineCap = 'round';
  for (let i = 0; i < n; i++) { const nx = px + Math.cos(a) * len / n, ny = py + Math.sin(a) * len / n; g.lineWidth = Math.max(1.5, w * (1 - i / n * 0.6)); g.beginPath(); g.moveTo(px, py); g.lineTo(nx, ny); g.stroke(); px = nx; py = ny; a += (R() - 0.5) * 0.7 - 0.06;
    if (d > 0 && i > 0 && R() < 0.55) galho(g, px, py, a + (R() < 0.5 ? -1 : 1) * (0.5 + R() * 0.6), len * (0.45 + R() * 0.25), w * 0.55, d - 1, R, cor); }
}
function tronco(g, x, yb, w, h, cor, cor2, R, o = {}) {
  const lean = (R() - 0.5) * 0.12 * h, wt = w * (0.62 + R() * 0.16), sw = (R() - 0.5) * w * 0.8;
  g.fillStyle = cor; g.beginPath(); g.moveTo(x - w * 0.5, yb); g.bezierCurveTo(x - w * 0.5 + sw, yb - h * 0.4, x + lean - wt * 0.5 - sw, yb - h * 0.7, x + lean - wt * 0.5, yb - h);
  g.lineTo(x + lean + wt * 0.5, yb - h); g.bezierCurveTo(x + lean + wt * 0.5 - sw, yb - h * 0.7, x + w * 0.5 + sw, yb - h * 0.4, x + w * 0.5, yb); g.closePath(); g.fill();
  if (o.raiz) { for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x + s * w * 0.3, yb - w * 0.9); g.quadraticCurveTo(x + s * w * 0.7, yb - w * 0.1, x + s * w * (1.3 + R() * 0.8), yb + 6); g.lineTo(x + s * w * 0.2, yb + 6); g.closePath(); g.fill(); } }
  if (o.casca) { g.save(); g.strokeStyle = cor2; g.lineCap = 'round'; for (let i = 0; i < o.casca; i++) { const u = (i + 0.5) / o.casca - 0.5, y0 = yb - R() * h * 0.5, l = h * (0.12 + R() * 0.3); g.globalAlpha = 0.35 + R() * 0.4; g.lineWidth = 1.5 + R() * 2.5; g.beginPath(); g.moveTo(x + u * w * 0.86 + sw * 0.3, y0); g.lineTo(x + u * wt * 0.9 + lean * (l / h) + sw * 0.2, y0 - l); g.stroke(); }
    for (let i = 0; i < 3; i++) { g.globalAlpha = 0.5; g.fillStyle = cor2; g.beginPath(); g.ellipse(x + (R() - 0.5) * w * 0.5, yb - h * (0.2 + R() * 0.6), w * 0.07, w * 0.13, 0, 0, TAU); g.fill(); } g.restore(); }
  if (o.galhos) for (let i = 0; i < o.galhos; i++) { const s = R() < 0.5 ? -1 : 1, yy = yb - h * (0.5 + R() * 0.45); galho(g, x + lean * 0.8 + s * wt * 0.3, yy, -Math.PI / 2 + s * (0.5 + R() * 0.7), h * (0.2 + R() * 0.25), w * 0.26, 2, R, cor); }
}
const CEU = tarde(g => {
  const s = g.createLinearGradient(0, -OY, 0, H + OY); s.addColorStop(0, '#050a14'); s.addColorStop(0.3, '#0c1a2c'); s.addColorStop(0.5, '#1d3d58'); s.addColorStop(0.66, '#2a5672'); s.addColorStop(0.8, '#15293c'); s.addColorStop(1, '#070d16');
  g.fillStyle = s; g.fillRect(-OX, -OY, LW, LH);
  const m = g.createRadialGradient(W * 0.6, 760, 0, W * 0.6, 760, 900); m.addColorStop(0, 'rgba(150,205,235,0.55)'); m.addColorStop(0.4, 'rgba(90,150,190,0.25)'); m.addColorStop(1, 'rgba(60,110,150,0)'); g.fillStyle = m; g.fillRect(-OX, -OY, LW, LH);
});
const faixa = (g, y, c1, c2) => { const s = g.createLinearGradient(0, y, 0, y + 900); s.addColorStop(0, c1); s.addColorStop(1, c2); g.fillStyle = s; g.fillRect(-OX, y, LW, LH); };
const LONGE = tarde(g => { const R = rng(11); faixa(g, CH - 150, '#2c5b78', '#16334a'); for (let i = 0; i < 46; i++) { const x = -OX + R() * LW, w = 26 + R() * 44; tronco(g, x, CH - 120 + R() * 40, w, 1300 + R() * 600, R() < 0.5 ? '#2f5874' : '#3a6885', '#22455e', R, { galhos: 2 }); }
  const f = g.createLinearGradient(0, CH - 560, 0, CH - 140); f.addColorStop(0, 'rgba(44,91,120,0)'); f.addColorStop(1, 'rgba(44,91,120,1)'); g.fillStyle = f; g.fillRect(-OX, CH - 560, LW, 430); });
const MEIO = tarde(g => { const R = rng(23); faixa(g, CH - 96, '#1a3d58', '#0c1f30'); for (let i = 0; i < 22; i++) { const x = -OX + (i + R() * 0.8) * LW / 22, w = 60 + R() * 70; tronco(g, x, CH - 70 + R() * 40, w, 1500 + R() * 600, R() < 0.5 ? '#173650' : '#1c4060', '#0e2438', R, { galhos: 3, casca: 5, raiz: 1 }); }
  const f = g.createLinearGradient(0, CH - 380, 0, CH - 90); f.addColorStop(0, 'rgba(26,61,88,0)'); f.addColorStop(1, 'rgba(26,61,88,0.85)'); g.fillStyle = f; g.fillRect(-OX, CH - 380, LW, 300); });
const PERTO = tarde(g => { const R = rng(37); faixa(g, CH - 60, '#10293c', '#081520'); for (const x of [-760, -330, 40, 520, 1010, 1420, 1860]) { const w = 120 + R() * 70; tronco(g, x + (R() - 0.5) * 80, CH - 26 + R() * 16, w, 1900 + R() * 400, '#0d2234', '#1d3f5a', R, { galhos: 3, casca: 9, raiz: 1 }); } });
const CHAO = tarde(g => {
  const R = rng(5), s = g.createLinearGradient(0, CH - 150, 0, H + 300); s.addColorStop(0, '#234a60'); s.addColorStop(0.12, '#15303f'); s.addColorStop(0.45, '#0c1d2a'); s.addColorStop(1, '#050b12');
  g.fillStyle = s; g.beginPath(); g.moveTo(-OX, CH - 120); for (let x = -OX; x <= W + OX; x += 60) g.lineTo(x, CH - 124 + Math.sin(x * 0.004) * 12 + Math.sin(x * 0.013) * 5); g.lineTo(W + OX, H + OY); g.lineTo(-OX, H + OY); g.fill();
  g.save(); g.filter = 'blur(14px)'; for (let i = 0; i < 40; i++) { const k = R(), y = CH - 90 + k * 700; g.fillStyle = i % 3 ? `rgba(40,96,84,${0.25 + R() * 0.2})` : `rgba(4,10,18,0.4)`; g.beginPath(); g.ellipse(-OX + R() * LW, y, 120 + R() * 260 * (0.5 + k), 14 + R() * 30 * (0.5 + k), 0, 0, TAU); g.fill(); } g.restore();
  g.lineCap = 'round'; for (let i = 0; i < 1500; i++) { const k = Math.pow(R(), 0.8), y = CH - 96 + k * 800, sc = 0.4 + k * 1.5, x = -OX + R() * LW; g.strokeStyle = R() < 0.5 ? `rgba(70,140,130,${0.2 + R() * 0.25})` : `rgba(6,16,26,${0.3 + R() * 0.3})`; g.lineWidth = (1 + R() * 1.4) * sc; const l = (8 + R() * 16) * sc, le = (R() - 0.5) * 14 * sc; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + le * 0.3, y - l * 0.6, x + le, y - l); g.stroke(); }
  for (let i = 0; i < 260; i++) { const k = Math.pow(R(), 0.8), y = CH - 80 + k * 780, sc = 0.5 + k * 1.3; g.fillStyle = ['rgba(150,96,52,0.55)', 'rgba(110,70,40,0.5)', 'rgba(70,110,96,0.5)'][i % 3]; g.beginPath(); g.ellipse(-OX + R() * LW, y, 9 * sc, 4 * sc, R() * 3, 0, TAU); g.fill(); }
});
const FRENTE = tarde(g => { const R = rng(51); g.fillStyle = '#03070d';
  for (let i = 0; i < 26; i++) { const x = -OX + R() * LW, y = -OY + R() * 420; g.save(); g.translate(x, y); g.rotate(R() * 3); g.beginPath(); g.ellipse(0, 0, 60 + R() * 80, 16 + R() * 22, 0, 0, TAU); g.fill(); g.restore(); }
  for (let i = 0; i < 150; i++) { const x = -OX + R() * LW, y = H + 80 + R() * 200, hh = 200 + R() * 380, le = (R() - 0.5) * 180; g.strokeStyle = '#040a12'; g.lineCap = 'round'; g.lineWidth = 8 + R() * 14; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + le * 0.2, y - hh * 0.6, x + le, y - hh); g.stroke(); } });
// sprites macios para névoa e partículas
const FOG = (() => { const c = mk(512, 256), g = c.getContext('2d'), r = g.createRadialGradient(256, 128, 0, 256, 128, 256); r.addColorStop(0, 'rgba(170,215,240,0.5)'); r.addColorStop(0.5, 'rgba(150,200,230,0.2)'); r.addColorStop(1, 'rgba(150,200,230,0)'); g.scale(1, 0.5); g.fillStyle = r; g.fillRect(0, 0, 512, 512); return c; })();
const PONTOS = (() => { const c = mk(8, 8), g = c.getContext('2d'); g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(0, 0, 1.6, 1.6); g.fillRect(4, 4, 1.6, 1.6); return c; })();

// ---------- composição
let X = null, A = null, AX = null, B = null, BX = null;
export function inicia(cv) { X = cv.getContext('2d'); A = mk(W, H); AX = A.getContext('2d'); B = mk(W, H); BX = B.getContext('2d'); return X; }
export const ctx = () => X;
const PT = rng(77), MOTES = Array.from({ length: 70 }, () => ({ x: PT() * 2600 - 760, y: PT() * 1500 + 100, r: 1.2 + PT() * 2.6, p: 0.5 + PT() * 1.1, f: PT() * 6, v: 6 + PT() * 16 }));
const NEV = Array.from({ length: 16 }, (_, i) => ({ x: PT() * 3200 - 1000, y: CH - 260 + PT() * 330, s: 1.6 + PT() * 2.6, v: 8 + PT() * 16, a: 0.25 + PT() * 0.4, p: i % 2 ? 0.6 : 1.0 }));
// cam = {x, y, z, rot?, sx?, sy?} ; o = { foco: blur extra do fundo, frenteBlur, tinta, semFrente, visao (0..1 visão do General) }
export function cena(t, cam, o, desenha) {
  const fundo = o.foco ?? 0, tr = (p, g = X) => { const z = 1 + (cam.z - 1) * p, cx = W / 2 + (cam.x - W / 2) * p, cy = H / 2 + (cam.y - H / 2) * p; g.translate(W / 2 + (cam.sx || 0) * p, H / 2 + (cam.sy || 0) * p); if (cam.rot) g.rotate(cam.rot); g.scale(z, z); g.translate(-cx, -cy); };
  const put = (img, p, bl) => { X.save(); if (bl > 0.3) X.filter = `blur(${bl.toFixed(1)}px)`; tr(p); X.drawImage(img, -OX, -OY); X.restore(); };
  X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1; X.filter = 'none'; X.globalCompositeOperation = 'source-over';
  put(CEU(), 0.06, 0); put(LONGE(), 0.2, 5 + fundo * 5);
  // raios de luar
  X.save(); X.globalCompositeOperation = 'screen'; X.filter = 'blur(22px)'; tr(0.3); for (const [x, w, a] of [[120, 150, 0.1], [520, 90, 0.07], [880, 220, 0.11], [1400, 120, 0.07], [-300, 180, 0.08]]) { X.fillStyle = `rgba(150,205,240,${a * (0.8 + 0.2 * Math.sin(t * 0.5 + x))})`; X.beginPath(); X.moveTo(x + 500, -500); X.lineTo(x + 500 + w, -500); X.lineTo(x + w * 1.6 - 420, CH + 200); X.lineTo(x - 420, CH + 200); X.fill(); } X.restore();
  put(MEIO(), 0.42, 2.5 + fundo * 4);
  const nev = (pp, k) => { X.save(); X.globalCompositeOperation = 'screen'; tr(pp); for (const n of NEV) { if (n.p !== pp) continue; const x = ((n.x + t * n.v + 1000) % 3400) - 1000; X.globalAlpha = n.a * k; X.drawImage(FOG, x - 256 * n.s, n.y - 128 * n.s, 512 * n.s, 256 * n.s); } X.restore(); };
  nev(0.6, 1);
  put(PERTO(), 0.72, 1 + fundo * 2.5); put(CHAO(), 1, fundo * 1.2);
  nev(1.0, 0.75);
  if (o.tinta) { X.fillStyle = o.tinta; X.fillRect(0, 0, W, H); }
  X.save(); tr(1); desenha(X); X.restore();
  // partículas no ar
  X.save(); X.globalCompositeOperation = 'lighter'; for (const m of MOTES) { X.save(); tr(m.p); const x = m.x + Math.sin(t * 0.3 + m.f) * 30 + t * m.v * 0.4, y = m.y + Math.cos(t * 0.25 + m.f * 2) * 24 - t * m.v * 0.2; X.globalAlpha = 0.25 + 0.25 * Math.sin(t * 1.3 + m.f); X.fillStyle = '#bfe6ff'; X.beginPath(); X.arc(((x + 760) % 2600) - 760, ((y - 100 + 3000) % 1500) + 100, m.r * (m.p > 1.1 ? 2.4 : 1), 0, TAU); X.fill(); X.restore(); } X.restore();
  if (!o.semFrente) put(FRENTE(), 1.6, o.frenteBlur ?? 12);
}
export function acabamento(t, o = {}) {
  AX.clearRect(0, 0, W, H); AX.filter = 'blur(20px)'; AX.drawImage(X.canvas, 0, 0); AX.filter = 'none';
  X.save(); X.globalCompositeOperation = 'screen'; X.globalAlpha = o.bloom ?? 0.22; X.drawImage(A, 0, 0); X.restore();
  const v = X.createRadialGradient(W / 2, H * 0.46, H * 0.24, W / 2, H * 0.5, H * 0.72); v.addColorStop(0, 'rgba(2,6,12,0)'); v.addColorStop(1, `rgba(2,6,12,${o.vinheta ?? 0.62})`); X.fillStyle = v; X.fillRect(0, 0, W, H);
  X.save(); X.globalAlpha = 0.035; X.fillStyle = X.createPattern(PONTOS, 'repeat'); X.fillRect(0, 0, W, H); X.restore();
  if (o.flash) { X.fillStyle = `rgba(225,242,255,${o.flash})`; X.fillRect(0, 0, W, H); }
}
// tremida de impacto (medida na ref): deslocamento com direção nova a cada quadro, sem zoom nem giro,
// salto entre quadros de 16–33 px no pico, 8–14 quadros de duração, caindo até zero.
export function tremida(t, t0, amp = 13, dur = 0.2) { const u = t - t0; if (u < 0 || u > dur) return [0, 0]; const f = Math.round(u * 60), R = rng(f * 7919 + Math.round(t0 * 1000) * 31 + 5), a = R() * TAU, k = 1 - u / dur; return [Math.cos(a) * amp * k, Math.sin(a) * amp * k]; }

// ---------- legenda (receita medida na ref): 1 linha, 2–3 palavras, maiúscula ~59 px, 1 palavra em amarelo,
// entra com pop 0,973 → 1 em 4 quadros já opaca, sai seca. lista = [t0, t1, texto, y, corDestaque]
// o (opcional) = { escala, dx, dy }: desenha a mesma legenda num quadro de outro tamanho (o padrão é o quadro de 1080×1920).
export function legenda(t, lista, o = {}) {
  const c = lista.find(c => t >= c[0] && t < c[1]); if (!c) return; const [t0, , txt, y0, cd] = c, y = y0 ?? 1420, ws = txt.split(' ');
  const E = o.escala ?? 1;
  X.save(); X.setTransform(E, 0, 0, E, o.dx || 0, o.dy || 0); X.filter = 'none'; X.globalAlpha = 1; X.globalCompositeOperation = 'source-over'; X.font = '700 84px RC'; X.textBaseline = 'middle'; X.textAlign = 'left'; X.lineJoin = 'round';
  const sp = 22, wd = ws.map(w => X.measureText(w.replace(/[*]/g, '')).width), tot = wd.reduce((a, b) => a + b, 0) + sp * (ws.length - 1); let x = W / 2 - tot / 2;
  const k = 0.973 + 0.027 * eOut((t - t0) / (4 / 60), 2); X.translate(W / 2, y); X.scale(k, k); X.translate(-W / 2, -y);
  ws.forEach((w, i) => { const dest = w.includes('*'), tx = w.replace(/[*]/g, ''); X.shadowColor = 'rgba(0,0,0,0.7)'; X.shadowBlur = 17 * E; X.shadowOffsetY = 3 * E; X.strokeStyle = '#0c1016'; X.lineWidth = 10; X.strokeText(tx, x, y); X.shadowColor = 'transparent'; X.fillStyle = dest ? (cd || '#f1b534') : '#fcfcfb'; X.fillText(tx, x, y); x += wd[i] + sp; });
  X.restore();
}
// pílula de HUD
export function pilula(t, t0, t1, cx, y, partes, o = {}) {
  if (t < t0 || t > t1) return; const k = eBack((t - t0) / 0.2), ko = 1 - st(t1 - 0.12, t1, t); X.save(); X.font = `700 ${o.tam || 52}px RC`; X.textBaseline = 'middle';
  const wd = partes.map(p => X.measureText(p[0]).width), tot = wd.reduce((a, b) => a + b, 0) + 14 * (partes.length - 1), w = tot + 60, h = (o.tam || 52) * 1.8;
  X.globalAlpha = ko; X.translate(cx, y); X.scale(k, k); X.shadowColor = 'rgba(0,10,24,0.6)'; X.shadowBlur = 20; X.shadowOffsetY = 6; X.beginPath(); X.roundRect(-w / 2, -h / 2, w, h, h / 2); X.fillStyle = o.fundo || 'rgba(14,24,42,0.92)'; X.fill(); X.shadowColor = 'transparent'; X.strokeStyle = o.borda || 'rgba(160,210,255,0.6)'; X.lineWidth = 3; X.stroke();
  let x = -tot / 2; partes.forEach((p, i) => { X.fillStyle = p[1]; X.textAlign = 'left'; X.fillText(p[0], x, 3); x += wd[i] + 14; }); X.restore();
}
// cubinhos: pedaços de dado se soltando de um ponto (o "apagar" do General)
export function cubinhos(g, t, t0, p, o = {}) {
  const u = t - t0; if (u < 0 || u > (o.dur || 1.2)) return; const R = rng(o.seed || 9), n = o.n || 26, dur = o.dur || 1.2;
  g.save(); for (let i = 0; i < n; i++) { const a = R() * TAU, v = 60 + R() * (o.v || 260), d = R() * 0.25, uu = u - d, s = 5 + R() * (o.s || 13); if (uu < 0) continue; const k = uu / (dur - d), x = p[0] + Math.cos(a) * v * eOut(k, 2) * (o.sx ?? 1), y = p[1] + Math.sin(a) * v * eOut(k, 2) - (o.sobe ?? 60) * k;
    g.globalAlpha = (1 - k) * 0.95; g.fillStyle = i % 3 ? (o.cor || '#52c6ff') : (o.cor2 || '#dff4ff'); const q = Math.round(s * (1 - k * 0.5)); g.fillRect(Math.round(x / 4) * 4, Math.round(y / 4) * 4, q, q); } g.restore();
}
// anel de som (o motivo da série): gota na água
export function anelSom(g, t, t0, p, o = {}) { const u = t - t0, dur = o.dur || 0.7; if (u < 0 || u > dur) return; const k = u / dur; g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < (o.n || 3); i++) { const kk = k - i * 0.14; if (kk <= 0) continue; g.globalAlpha = (1 - kk) * (o.a || 0.8); g.strokeStyle = o.cor || '#7fd4ff'; g.lineWidth = (o.w || 5) * (1 - kk * 0.6); g.beginPath(); g.ellipse(p[0], p[1], (o.r || 220) * eOut(kk, 2), (o.r || 220) * eOut(kk, 2) * (o.ach ?? 1), 0, 0, TAU); g.stroke(); } g.restore(); }
export function faiscas(g, t, t0, p, o = {}) { const u = t - t0, dur = o.dur || 0.35; if (u < 0 || u > dur) return; const R = rng(o.seed || 3), k = u / dur; g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; for (let i = 0; i < (o.n || 14); i++) { const a = (o.an ?? 0) + (R() - 0.5) * (o.abre ?? TAU), v = (o.v || 240) * (0.4 + R() * 0.8), l = 16 + R() * 30, d0 = v * eOut(k, 2), x = p[0] + Math.cos(a) * d0, y = p[1] + Math.sin(a) * d0; g.globalAlpha = 1 - k; g.strokeStyle = o.cor || '#eaf6ff'; g.lineWidth = 3 * (1 - k) + 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l * (1 - k), y + Math.sin(a) * l * (1 - k)); g.stroke(); } g.restore(); }
export { setAmb, C, lerp, cl, TAU };
