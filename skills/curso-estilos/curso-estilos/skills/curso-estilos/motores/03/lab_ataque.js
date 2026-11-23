// laboratório de ação: corre → freia derrapando → pula pra trás → carrega → golpe poderoso na pedra. Depois, 2 replays em câmera lenta.
// ?folha = raio-X das 12 posições-chave
import * as B from './boneco.js';
import { gerar, ROSA_FICHA } from './gerador.js';
import { anda } from './fisica.js';
import { criaAcao, corpoX } from './acao.js';
const cv = document.getElementById('c'), g = cv.getContext('2d'), W = 1080, H = 1920, Q = new URLSearchParams(location.search), FOLHA = Q.has('folha'), TAU = B.TAU, cl = B.cl, lerp = B.lerp;
const AMB = () => { B.setAmb([0.9, 0.93, 1.0], [0, 3, 8]); B.setLuz({ cor: '#a9d2f2', w: 2.6 }); }; AMB();
const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const eOut = (k, p = 2) => 1 - Math.pow(1 - cl(k), p), sm = k => { k = cl(k); return k * k * (3 - 2 * k); };
const ROSA = gerar(ROSA_FICHA), R = ROSA.R, A = criaAcao(R), Z = A.Z;
const ENERGIA = [127, 212, 255], BRANCO = [234, 248, 255], ESCURO = [11, 28, 58];

// ---------- linha do tempo do vídeo: ação inteira em velocidade normal + 2 replays lentos
const SEG = [{ id: 'normal', a0: 0, a1: Z.tFim + 0.45, vel: 1, rot: 'VELOCIDADE NORMAL' },
  { id: 'lenta_freada', a0: Z.tB - 0.2, a1: Z.tC0 + 0.1, vel: 0.4, rot: 'CÂMERA LENTA', sub: 'freada e pulo pra trás' },
  { id: 'lenta_golpe', a0: Z.tW - 0.22, a1: Z.tHit + 0.8, vel: 0.3, rot: 'CÂMERA LENTA', sub: 'o golpe' }];
let o0 = 0; for (const s of SEG) { s.t0 = o0; s.D = (s.a1 - s.a0) / s.vel; o0 += s.D; }
const FIM = +o0.toFixed(3), PL = SEG.map(s => ({ id: s.id, t0: s.t0, D: s.D }));

// ---------- o alvo e o disparo
const ph = A.pose(Z.tHit), PUNHO = [Z.XH + ph.P.mN[0], ph.P.mN[1]];                         // onde o punho para no acerto (mundo)
const PEDRA = { x: Z.XH + 600, pts: [[-125, 0], [-118, -140], [-132, -232], [-96, -330], [-40, -396], [30, -382], [86, -312], [122, -200], [112, -90], [130, 0]] };
const tDisp = Z.tRc, alc = u => 1700 * eOut(u / 0.62, 2.4);                                   // frente do disparo: sai no fim do hit-stop
let tQuebra = tDisp; for (let u = 0; u < 1; u += 1 / 600) if (PUNHO[0] + alc(u) >= PEDRA.x - 120) { tQuebra = tDisp + u; break; }
// pedaços da pedra: grade torta 3×4 recortada pelo contorno; cada um com velocidade, giro e quique no chão
const PED = (() => { const Rr = rng(41), xs = [-150, -50 + Rr() * 20, 30 + Rr() * 20, 150], ys = [8, -96 - Rr() * 20, -200 - Rr() * 20, -300 - Rr() * 15, -420], cel = [];
  const jx = (i, j) => xs[i] + (i > 0 && i < 3 ? (Rr() - 0.5) * 30 : 0), J = []; for (let j = 0; j < 5; j++) { J.push([]); for (let i = 0; i < 4; i++) J[j].push([jx(i, j), ys[j] + (j > 0 && j < 4 ? (Rr() - 0.5) * 34 : 0)]); }
  for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) { const p = [J[j][i], J[j][i + 1], J[j + 1][i + 1], J[j + 1][i]], c = [(p[0][0] + p[1][0] + p[2][0] + p[3][0]) / 4, (p[0][1] + p[1][1] + p[2][1] + p[3][1]) / 4], alt = -c[1] / 400;
    cel.push({ p, c, v: [j === 0 ? 60 + Rr() * 120 : 520 + Rr() * 620 + alt * 420, j === 0 ? -60 - Rr() * 80 : -260 - Rr() * 520 * (0.4 + alt)], w: (Rr() - 0.5) * (j === 0 ? 2 : 11), r: 34 + Rr() * 18 }); }
  return cel; })();
function pedaco(c, u) {                                                                       // posição/ângulo do pedaço u s depois da quebra (simulado, determinístico)
  let x = c.c[0], y = c.c[1], vx = c.v[0], vy = c.v[1], a = 0, w = c.w, bat = 0; const dt = 1 / 240;
  for (let s = 0; s < u; s += dt) { if (bat < 3) { vy += 2600 * dt; x += vx * dt; y += vy * dt; a += w * dt; if (y > -c.r * 0.6) { y = -c.r * 0.6; vy *= -0.28; vx *= 0.55; w *= 0.5; bat++; if (Math.abs(vy) < 60) bat = 3; } } }
  return { x, y, a };
}
// ---------- poeira: eventos pré-calculados (nasce onde o pé está no mundo)
const POE = []; const puf = (t0, x, o = {}) => POE.push({ t0, x, y: o.y ?? -6, vx: o.vx ?? 0, vy: o.vy ?? -30, r: o.r ?? 16, vida: o.vida ?? 0.5, a: o.a ?? 0.5 });
const peW = (t, n) => { const p = A.pose(t); return p.X + p.P['p' + n][0]; };
{ const b = anda(0, R, Z.o), T = b.T;
  for (let n = 0; n <= Math.ceil(Z.tB / T); n++) for (const [off, sg] of [[0, -1], [0.5, 1]]) { const tc = (n + off) * T; if (tc > Z.tB - 0.01 || tc < 0.05) continue; const x = b.v * tc + sg * (0.14 * R.quadril / 2 + 8) + b.Ls / 2;
    for (let i = 0; i < 4; i++) puf(tc, x + (i - 1.5) * 10, { vx: -40 - i * 25, vy: -40 - i * 12, r: 12 + i * 3, vida: 0.42 }); }
  for (let t = Z.tB; t < Z.tS; t += 1 / 40) { const vel = b.v * (1 - (t - Z.tB) / 0.5); for (const n of ['F', 'N']) puf(t, peW(t, n) + (n === 'F' ? 12 : 0), { vx: vel * 0.45, vy: -50 - vel * 0.05, r: 15 + vel * 0.012, vida: 0.62, a: 0.32 + 0.3 * vel / b.v }); }
  for (let i = 0; i < 6; i++) puf(Z.tI0 + 0.04, peW(Z.tI0, 'F') + 10, { vx: 120 + i * 40, vy: -60 - i * 15, r: 14 + i * 2, vida: 0.5, a: 0.45 });
  for (const n of ['F', 'N']) for (let i = 0; i < 6; i++) puf(Z.tL, peW(Z.tL, n), { vx: (i - 2.5) * 70 - 80, vy: -40 - (i % 3) * 25, r: 16 + i * 2, vida: 0.55, a: 0.5 });
  for (let t = Z.tL; t < Z.tL + 0.22; t += 1 / 40) for (const n of ['F', 'N']) puf(t, peW(t, n), { vx: -110, vy: -40, r: 13, vida: 0.5, a: 0.3 });
  for (let i = 0; i < 14; i++) { const n = i % 2 ? 'F' : 'N', s = i < 7 ? -1 : 1; puf(Z.tHit, peW(Z.tHit, n), { vx: s * (160 + (i % 7) * 70), vy: -50 - (i % 4) * 30, r: 18 + (i % 5) * 4, vida: 0.7, a: 0.55 }); }
  for (let t = Z.tRc; t < Z.tRc + 0.38; t += 1 / 40) for (const n of ['F', 'N']) puf(t, peW(t, n), { vx: -90, vy: -35, r: 14, vida: 0.5, a: 0.32 * (1 - (t - Z.tRc) / 0.38) + 0.1 });
  for (let i = 0; i < 18; i++) puf(tQuebra + i * 0.006, PEDRA.x - 120 + i * 16, { vx: 80 + i * 30, vy: -80 - (i % 5) * 50, r: 26 + (i % 6) * 6, vida: 1.0, a: 0.55 });
  puf(Z.tUp + 0.72 * (Z.tFim - Z.tUp), peW(Z.tFim, 'N'), { vx: 60, vy: -30, r: 12, vida: 0.4, a: 0.3 }); }
const MARCA = [[Z.tB, Z.tS, 'F'], [Z.tB + 0.06, Z.tS, 'N'], [Z.tL, Z.tL + 0.22, 'F'], [Z.tL, Z.tL + 0.22, 'N'], [Z.tRc, Z.tRc + 0.38, 'F'], [Z.tRc, Z.tRc + 0.38, 'N']].map(([a, b, n]) => ({ a, b, n, x0: peW(a, n), x1: peW(b, n) }));

// ---------- câmera: segue com mola, enquadra Rosa + pedra na carga, soco de zoom e tremida no acerto
const camAlvo = t => t < Z.tS ? corpoX(t, Z) + 120 : t < Z.tL ? Z.XS - 80 : (Z.XC + PEDRA.x) / 2 + 10;
const camX = (() => { let tc = -1, x = 0, v = 0; const dt = 1 / 480, w = 2 * Math.PI * 1.25, zz = 0.85;
  return t => { if (t < tc || tc < 0) { tc = 0; x = camAlvo(0); v = A.Z.v; } while (tc + dt <= t) { const a = w * w * (camAlvo(tc) - x) - 2 * zz * w * v; v += a * dt; x += v * dt; tc += dt; } return x; }; })();
const zoomK = [[0, 1.12], [Z.tB, 1.12], [Z.tL, 1.1], [Z.tC0, 1.08], [Z.tW, 1.14], [Z.tHit, 1.16], [Z.tHit + 0.6, 1.1], [Z.tFim, 1.08]];
const zoom = t => { let z = zoomK[zoomK.length - 1][1]; for (let i = 0; i < zoomK.length - 1; i++) if (t < zoomK[i + 1][0]) { const k = sm((t - zoomK[i][0]) / (zoomK[i + 1][0] - zoomK[i][0])); z = lerp(zoomK[i][1], zoomK[i + 1][1], k); break; } return z * (t > Z.tHit ? 1 + 0.06 * Math.exp(-(t - Z.tHit) / 0.07) : 1); };
const tremida = (t, t0, amp, dur) => { const u = t - t0; if (u < 0 || u > dur) return [0, 0]; const R2 = rng(Math.round(u * 60) * 7919 + Math.round(t0 * 1000) * 31 + 5), a = R2() * TAU, k = 1 - u / dur; return [Math.cos(a) * amp * k, Math.sin(a) * amp * k]; };
const CHAO_Y = 1330;
function camera(t) { const z = zoom(t), s = [[Z.tL, 5, 0.12], [Z.tHit, 20, 0.3], [tQuebra, 13, 0.32]].map(([t0, a, d]) => tremida(t, t0, a, d)).reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);
  return { x: camX(t), z, sx: s[0], sy: s[1] }; }
const tela = (c, p) => [(p[0] - c.x) * c.z + W / 2 + c.sx, CHAO_Y + p[1] * c.z + c.sy];

// ---------- cenário
function fundo(t, c) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0f2236'); gr.addColorStop(0.55, '#1f4360'); gr.addColorStop(0.72, '#2d5a78'); gr.addColorStop(1, '#0a1824'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const lu = g.createRadialGradient(W * 0.78, CHAO_Y - 520, 20, W * 0.78, CHAO_Y - 520, 760); lu.addColorStop(0, 'rgba(190,225,250,0.32)'); lu.addColorStop(1, 'rgba(190,225,250,0)'); g.fillStyle = lu; g.fillRect(0, 0, W, H);   // lua baixa atrás da pedra
  for (const [par, cor, alt, sd] of [[0.18, '#1b3b55', 260, 3], [0.38, '#14304a', 170, 7]]) { const R2 = rng(sd); g.fillStyle = cor; g.beginPath(); g.moveTo(0, H); const x0 = -((c.x * par) % 400) - 400;
    for (let x = x0, i = 0; x < W + 400; x += 200, i++) { const h = alt * (0.6 + 0.4 * Math.sin(i * 1.7 + sd) * Math.sin(i * 0.63 + Math.floor((c.x * par) / 400) * 0 + sd)); g.lineTo(x, CHAO_Y - 30 - Math.abs(h) + c.sy * 0.3); } g.lineTo(W + 400, H); g.closePath(); g.fill(); R2(); }
  const nev = g.createLinearGradient(0, CHAO_Y - 260, 0, CHAO_Y + 20); nev.addColorStop(0, 'rgba(150,195,225,0)'); nev.addColorStop(1, 'rgba(150,195,225,0.22)'); g.fillStyle = nev; g.fillRect(0, CHAO_Y - 260, W, 280);   // névoa baixa
  const y0 = CHAO_Y + c.sy; g.fillStyle = '#0c1c2a'; g.fillRect(0, y0, W, H - y0); g.strokeStyle = 'rgba(169,210,242,0.45)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, y0); g.lineTo(W, y0); g.stroke();
}
function marcas(t, c) { for (const m of MARCA) { if (t < m.a) continue; const k = cl((t - m.a) / (m.b - m.a)), x1 = lerp(m.x0, m.x1, k), a = 0.5 * (1 - cl((t - m.b - 1.5) / 1.5)); if (a <= 0) continue; const p0 = tela(c, [m.x0, 0]), p1 = tela(c, [x1, 0]); g.strokeStyle = `rgba(3,9,16,${a})`; g.lineWidth = 6 * c.z; g.lineCap = 'round'; g.beginPath(); g.moveTo(p0[0], p0[1] + 2); g.lineTo(p1[0], p1[1] + 2); g.stroke(); } }
function grama(t, c) {                                                                        // tufos no mundo; o disparo deita os que ficam no caminho
  const R2 = rng(77); g.strokeStyle = '#2c5060'; g.lineCap = 'round';
  for (let wx = -600; wx < PEDRA.x + 1400; wx += 120 + 0) { const j = R2(), x = wx + j * 60, p = tela(c, [x, 0]); if (p[0] < -60 || p[0] > W + 60) continue; const h = (16 + j * 16) * c.z;
    let b = 0; const fr = PUNHO[0] + alc(t - tDisp); if (t > tDisp && x > PUNHO[0] && x < fr + 40) { const tp = tDisp + (x - PUNHO[0]) / 1700; b = 1.1 * Math.exp(-Math.max(0, t - tp) * 2.6); }
    if (t > Z.tC0 && t < Z.tSt && Math.abs(x - corpoX(t, Z)) < 320) b += 0.25 * sm((t - Z.tC0) / 0.5) * Math.sin(t * 19 + x);
    g.lineWidth = 4 * c.z; for (const a of [-0.5, 0, 0.45]) { const aa = a + b; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + Math.sin(aa) * h, p[1] - Math.cos(aa) * h * 1.3); g.stroke(); } }
}
function poeira(t, c) { for (const p of POE) { const u = t - p.t0; if (u < 0 || u > p.vida) continue; const k = u / p.vida, x = p.x + p.vx * p.vida * eOut(k, 2) * 0.6, y = p.y + p.vy * p.vida * eOut(k, 1.6) * 0.6, s = tela(c, [x, y]), r = p.r * (1 + 2.2 * eOut(k)) * c.z;
  g.fillStyle = `rgba(196,220,238,${p.a * (1 - k) * (1 - k)})`; g.beginPath(); g.ellipse(s[0], s[1], r, r * 0.72, 0, 0, TAU); g.fill(); } }
// pedra (inteira até o disparo chegar; depois, pedaços)
function pedraPath(gg) { gg.beginPath(); PEDRA.pts.forEach((p, i) => i ? gg.lineTo(p[0], p[1]) : gg.moveTo(p[0], p[1])); gg.closePath(); }
function pedraPinta(gg, flat) { if (flat) { gg.fill(); return; } const gr = gg.createLinearGradient(-130, -400, 130, 0); gr.addColorStop(0, '#5a7890'); gr.addColorStop(0.45, '#33506a'); gr.addColorStop(1, '#1c3046'); gg.fillStyle = gr; gg.fill(); }
function pedra(t, c, flat) {
  const base = tela(c, [PEDRA.x, 0]);
  if (t < tQuebra) { g.save(); g.translate(base[0], base[1]); g.scale(c.z, c.z); if (flat) g.fillStyle = flat; pedraPath(g); pedraPinta(g, flat);
    if (!flat) { g.save(); pedraPath(g); g.clip(); g.strokeStyle = 'rgba(169,210,242,0.55)'; g.lineWidth = 7; g.beginPath(); g.moveTo(-118, -140); g.lineTo(-132, -232); g.lineTo(-96, -330); g.lineTo(-40, -396); g.stroke();
      g.strokeStyle = 'rgba(8,18,30,0.6)'; g.lineWidth = 4; for (const l of [[[-60, -300], [-20, -240], [-35, -170]], [[40, -330], [60, -260]], [[-90, -90], [-50, -60], [0, -70]]]) { g.beginPath(); l.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); }
      const br = cl((t - (tQuebra - 0.09)) / 0.09); if (br > 0) { g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(${BRANCO},${br})`; g.lineWidth = 5; for (const l of [[[-130, -210], [-60, -200], [-10, -260], [60, -250]], [[-125, -120], [-40, -130], [30, -90], [110, -110]], [[-60, -200], [-50, -330]]]) { g.beginPath(); l.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); } }
      g.restore(); g.strokeStyle = 'rgba(4,10,18,0.8)'; g.lineWidth = 3; pedraPath(g); g.stroke(); }
    g.restore(); return; }
  const u = t - tQuebra;
  for (const pc of PED) { const q = pedaco(pc, u), s = tela(c, [PEDRA.x + q.x, q.y]); g.save(); g.translate(s[0], s[1]); g.scale(c.z, c.z); g.rotate(q.a); g.translate(-pc.c[0], -pc.c[1]);
    g.beginPath(); pc.p.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip(); if (flat) g.fillStyle = flat; pedraPath(g); pedraPinta(g, flat);
    if (!flat) { g.strokeStyle = 'rgba(4,10,18,0.7)'; g.lineWidth = 3.5; g.beginPath(); pc.p.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.stroke(); g.lineWidth = 3; pedraPath(g); g.stroke(); }
    g.restore(); }
  if (u < 1.4 && !flat) { const R2 = rng(5); for (let i = 0; i < 46; i++) { const a = -Math.PI * (0.05 + R2() * 0.55), v = 300 + R2() * 900, d = R2() * 0.05, uu = u - d; if (uu < 0) continue; const x = PEDRA.x - 90 + Math.cos(a) * v * uu + 300 * uu, y = -200 + (R2() - 0.5) * 300 + Math.sin(a) * v * uu + 1300 * uu * uu; if (y > 0) continue;
    const s = tela(c, [x, y]), q = (5 + R2() * 12) * c.z; g.fillStyle = i % 3 ? '#4f6c84' : '#a9c6dc'; g.globalAlpha = 1 - cl(uu / 1.3); g.fillRect(Math.round(s[0] / 4) * 4, Math.round(s[1] / 4) * 4, q, q); } g.globalAlpha = 1; }
}
// ---------- energia: carga no punho recolhido (partículas sugadas, núcleo, arcos girando, brilho no chão)
function carga(t, k, m, c, pe) {
  if (k <= 0) return; g.save(); g.globalCompositeOperation = 'lighter';
  const gl = g.createRadialGradient(pe[0], pe[1], 0, pe[0], pe[1], 420 * c.z); gl.addColorStop(0, `rgba(${ENERGIA},${0.22 * k})`); gl.addColorStop(1, `rgba(${ENERGIA},0)`); g.fillStyle = gl; g.beginPath(); g.ellipse(pe[0], pe[1], 420 * c.z, 70 * c.z, 0, 0, TAU); g.fill();
  const R2 = rng(19), n = 22; g.lineCap = 'round';
  for (let i = 0; i < n; i++) { const a = R2() * TAU, sp = 1.4 + R2() * 1.2, f = ((t * sp + R2()) % 1), r = (60 + 250 * (1 - f)) * c.z * (0.7 + 0.3 * k), l = (18 + 40 * (1 - f)) * c.z, al = Math.sin(Math.PI * f) * k * 0.9;
    g.strokeStyle = `rgba(${i % 4 ? ENERGIA : BRANCO},${al})`; g.lineWidth = (2 + 3 * f) * c.z; g.beginPath(); g.moveTo(m[0] + Math.cos(a) * r, m[1] + Math.sin(a) * r); g.lineTo(m[0] + Math.cos(a) * (r + l), m[1] + Math.sin(a) * (r + l)); g.stroke(); }
  const fl = 1 + 0.08 * Math.sin(t * 61) + 0.05 * Math.sin(t * 37), rr = (24 + 46 * k) * c.z * fl, nu = g.createRadialGradient(m[0], m[1], 0, m[0], m[1], rr * 2.2);
  nu.addColorStop(0, `rgba(${BRANCO},${0.95 * k})`); nu.addColorStop(0.3, `rgba(${ENERGIA},${0.6 * k})`); nu.addColorStop(1, `rgba(${ENERGIA},0)`); g.fillStyle = nu; g.beginPath(); g.arc(m[0], m[1], rr * 2.2, 0, TAU); g.fill();
  g.fillStyle = `rgba(${BRANCO},${k})`; g.beginPath(); g.arc(m[0], m[1], rr * 0.45, 0, TAU); g.fill();
  for (let i = 0; i < 3; i++) { const a0 = t * (7 + i * 2.3) * (i % 2 ? -1 : 1) + i * 2.1; g.strokeStyle = `rgba(${BRANCO},${0.75 * k})`; g.lineWidth = (4 - i) * c.z; g.beginPath(); g.ellipse(m[0], m[1], rr * (1.05 + i * 0.28), rr * (0.55 + i * 0.12), a0, 0, Math.PI * 0.9); g.stroke(); }
  g.restore();
}
// rastro do soco (smear de 3 quadros): faixa clara entre as posições recentes do punho
function smear(t, c, X0) { if (t < Z.tSt - 0.01 || t > Z.tHit + 0.05) return; const pts = []; for (let s = Math.max(Z.tSt, Math.min(t, Z.tHit) - 0.03); s <= Math.min(t, Z.tHit); s += 1 / 480) { const p = A.pose(s); pts.push(tela(c, [p.X + p.P.mN[0], p.P.mN[1]])); } if (pts.length < 2) return;
  const fade = 1 - cl((t - Z.tHit) / 0.05); g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const [w, a] of [[34, 0.14], [16, 0.32], [6, 0.6]]) { g.strokeStyle = `rgba(${BRANCO},${a * fade})`; g.lineWidth = w * c.z; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); } g.restore(); }
// disparo: corpo do raio + frente em crescente + anéis (o motivo da série) + riscos de velocidade
function disparo(t, c) {
  const u = t - tDisp; if (u < 0 || u > 1.1) return; const fx = PUNHO[0] + alc(u), o = PUNHO, corpoA = 1 - sm((u - 0.22) / 0.4), fr = 1 - sm((u - 0.35) / 0.3);
  g.save(); g.globalCompositeOperation = 'lighter';
  if (corpoA > 0) { const p0 = tela(c, o), p1 = tela(c, [fx, o[1]]), hw = x => (16 + 0.2 * (x - o[0])) * c.z * (0.6 + 0.4 * corpoA);
    const gr = g.createLinearGradient(p0[0], 0, p1[0], 0); gr.addColorStop(0, `rgba(${ENERGIA},${0.1 * corpoA})`); gr.addColorStop(0.75, `rgba(${ENERGIA},${0.5 * corpoA})`); gr.addColorStop(1, `rgba(${BRANCO},${0.85 * corpoA})`);
    g.fillStyle = gr; g.beginPath(); g.moveTo(p0[0], p0[1] - hw(o[0])); g.lineTo(p1[0], p1[1] - hw(fx)); g.lineTo(p1[0], p1[1] + hw(fx)); g.lineTo(p0[0], p0[1] + hw(o[0])); g.closePath(); g.fill();
    g.strokeStyle = `rgba(${BRANCO},${corpoA})`; g.lineWidth = 9 * c.z * corpoA + 1; g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke();
    const R2 = rng(13); g.lineWidth = 3 * c.z; for (let i = 0; i < 16; i++) { const yy = (R2() - 0.5) * 2, ph = (u * 3.5 + R2()) % 1, x = lerp(o[0], fx, ph), l = 90 + R2() * 120, a = corpoA * Math.sin(Math.PI * ph); const s = tela(c, [x, o[1] + yy * (16 + 0.2 * (x - o[0]))]); g.strokeStyle = `rgba(${BRANCO},${0.6 * a})`; g.beginPath(); g.moveTo(s[0], s[1]); g.lineTo(s[0] - l * c.z, s[1]); g.stroke(); } }
  for (let e = 0; e < 0.3; e += 0.035) { const v = u - e; if (v < 0 || v > 0.5) continue; const xe = PUNHO[0] + alc(e), r = (30 + 280 * eOut(v / 0.5, 2)) * c.z, s = tela(c, [xe, o[1]]); g.strokeStyle = `rgba(${ENERGIA},${0.7 * (1 - v / 0.5)})`; g.lineWidth = 5 * c.z * (1 - v / 0.5) + 1; g.beginPath(); g.ellipse(s[0], s[1], r * 0.36, r, 0, 0, TAU); g.stroke(); }
  if (fr > 0) { const s = tela(c, [fx, o[1]]), ry = (90 + 0.16 * (fx - o[0])) * c.z; for (const [w, a, cor] of [[34, 0.35, ENERGIA], [14, 0.95, BRANCO]]) { g.strokeStyle = `rgba(${cor},${a * fr})`; g.lineWidth = w * c.z; g.beginPath(); g.ellipse(s[0] - 30 * c.z, s[1], 60 * c.z, ry, 0, -Math.PI * 0.42, Math.PI * 0.42); g.stroke(); } }
  { const v = u, r = (20 + 520 * eOut(v / 0.45, 2)) * c.z, s = tela(c, o); if (v < 0.45) { g.strokeStyle = `rgba(${BRANCO},${0.9 * (1 - v / 0.45)})`; g.lineWidth = 10 * c.z * (1 - v / 0.45) + 1; g.beginPath(); g.ellipse(s[0], s[1], r * 0.5, r, 0, 0, TAU); g.stroke(); } }   // anel no punho
  { const v = t - Z.tHit, pe = tela(c, [Z.XH - 30, 0]); if (v > 0 && v < 0.5) { const r = (40 + 520 * eOut(v / 0.5, 2)) * c.z; g.strokeStyle = `rgba(${BRANCO},${0.7 * (1 - v / 0.5)})`; g.lineWidth = 6 * c.z; g.beginPath(); g.ellipse(pe[0], pe[1], r, r * 0.1, 0, 0, TAU); g.stroke(); } }   // anel no chão
  g.restore();
}
// impact frame (receita aprovada: silhueta chapada, 1 cor, pincelada e respingo; sem estrela de quadrinho)
function impacto(t, c, f, P, X) {
  const inv = f >= 2, bg = inv ? ESCURO : BRANCO, fg = inv ? BRANCO : ESCURO, R2 = rng(inv ? 5 : 9), m = tela(c, PUNHO);
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgb(${bg})`; g.fillRect(0, 0, W, H);
  g.fillStyle = `rgba(${fg},0.16)`; for (let i = 0; i < 10; i++) { g.save(); g.translate(m[0], m[1]); g.rotate((R2() - 0.5) * 0.9); g.fillRect(-200 - R2() * 300, -10 - R2() * 34, 1500 + R2() * 500, 18 + R2() * 66); g.restore(); }   // pinceladas na direção do golpe
  pedra(t, c, `rgb(${fg})`);
  const s = tela(c, [X, 0]); B.setAmb([0, 0, 0], fg); B.setLuz({ w: 0 }); B.boneco(g, ROSA, { ...P, x: s[0], y: s[1], vista: 'l', dir: 1, s: c.z, sombra: false }); AMB();
  g.fillStyle = `rgb(${fg})`; g.beginPath(); g.ellipse(m[0] + 20, m[1], 70, 34, 0, 0, TAU); g.fill();
  for (let i = 0; i < 52; i++) { const a = (R2() - 0.5) * 1.6, dd = 60 + R2() * 640, q = 8 + R2() * 30; g.fillRect(Math.round((m[0] + Math.cos(a) * dd) / 8) * 8, Math.round((m[1] + Math.sin(a) * dd * 0.6) / 8) * 8, q, q); }   // respingo
}
function vinheta() { const v = g.createRadialGradient(W / 2, H * 0.55, H * 0.25, W / 2, H * 0.55, H * 0.75); v.addColorStop(0, 'rgba(2,6,12,0)'); v.addColorStop(1, 'rgba(2,6,12,0.55)'); g.fillStyle = v; g.fillRect(0, 0, W, H); }

function cena(t) {                                                                            // t = tempo da AÇÃO
  const c = camera(t), { P, X, carga: k } = A.pose(t), f = Math.floor((t - Z.tHit) * 60 + 1e-6);
  if (f >= 0 && f < 4) { impacto(t, c, f, P, X); return; }
  fundo(t, c); marcas(t, c); grama(t, c);
  const s = tela(c, [X, 0]);
  pedra(t, c);
  const S = B.boneco(g, ROSA, { ...P, x: s[0], y: s[1], vista: 'l', dir: 1, s: c.z });
  const m = [s[0] + S.mN[0] * c.z, s[1] + S.mN[1] * c.z], kk = t < Z.tSt ? k : k * (1 - cl((t - Z.tSt) / 0.03));
  carga(t, kk, m, c, s); smear(t, c, X);
  disparo(t, c); poeira(t, c);
  vinheta();
  if (f >= 4 && f < 9) { g.fillStyle = `rgba(234,248,255,${0.14 * (1 - (f - 4) / 5)})`; g.fillRect(0, 0, W, H); }
  const fq = (tQuebra - t); if (fq < 0 && fq > -0.07) { g.fillStyle = `rgba(234,248,255,${0.1 * (1 + fq / 0.07)})`; g.fillRect(0, 0, W, H); }
}
function frame(o) {
  B.RELOGIO.t = o; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; const sg = SEG.find(s => o < s.t0 + s.D) || SEG[SEG.length - 1], a = sg.a0 + (o - sg.t0) * sg.vel; B.RELOGIO.t = a;
  cena(a); g.setTransform(1, 0, 0, 1, 0, 0);
  g.font = '700 50px RC'; g.fillStyle = 'rgba(242,234,216,0.92)'; g.fillText(sg.rot, 70, 150); if (sg.sub) { g.font = '700 40px RC'; g.fillStyle = 'rgba(169,210,242,0.9)'; g.fillText(sg.sub, 70, 204); }
}
function folha() {                                                                            // raio-X: 12 posições-chave, chão marcado
  cv.width = 2600; cv.height = 1700; g.fillStyle = '#12283a'; g.fillRect(0, 0, 2600, 1700); B.RELOGIO.t = 0.5;
  const ks = [['corre', Z.tB - 0.12], ['freia', Z.tB + 0.06], ['derrapa', Z.tB + 0.3], ['antecipa', Z.tI0 - 0.005], ['impulso', Z.tI1 - 0.004], ['no ar', Z.tI1 + 0.16],
    ['pouso', Z.tL + 0.05], ['carrega', Z.tC0 + 0.45], ['arma', Z.tSt - 0.004], ['acerto', Z.tHit + 0.02], ['segura', Z.tUp - 0.1], ['volta', Z.tFim]];
  ks.forEach(([nome, t], i) => { const row = Math.floor(i / 6), col = i % 6, x = 230 + col * 420, y = 760 + row * 820, { P } = A.pose(t);
    g.strokeStyle = 'rgba(169,210,242,0.4)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 200, y); g.lineTo(x + 200, y); g.stroke();
    B.boneco(g, ROSA, { ...P, x, y, vista: 'l', dir: 1, s: 0.66 }); g.font = '700 40px RC'; g.fillStyle = '#f2ead8'; g.textAlign = 'center'; g.fillText(`${i + 1} · ${nome}`, x, y + 60); g.textAlign = 'left'; });
}
await document.fonts.load('700 84px RC');
window.PLANOS = PL; window.END = FIM; console.log('FIM ' + FIM);
window.seek = async t => { if (FOLHA) folha(); else frame(t); }; await window.seek(0); window.READY = true;
