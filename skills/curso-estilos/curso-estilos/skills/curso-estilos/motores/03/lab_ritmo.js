import * as B from './boneco.js';
import { gerar, ROSA_FICHA } from './gerador.js';
import { anda } from './fisica.js';
const cv = document.getElementById('c'), g = cv.getContext('2d'), W = 1080, H = 1920, Q = new URLSearchParams(location.search), FOLHA = Q.has('folha');
B.setAmb([0.9, 0.93, 1.0], [0, 3, 8]); B.setLuz({ cor: '#a9d2f2', w: 2.6 });
const ROSA = gerar(ROSA_FICHA), R = ROSA.R, FIM = 16;
const PL = [{ id: 'tres', t0: 0, D: 6 }, { id: 'meio', t0: 6, D: 3.5 }, { id: 'misto', t0: 9.5, D: 3.5 }, { id: 'anda3', t0: 13, D: 3 }];
function pista(y0, y1, chao, s, desl, rot, sub) {          // faixa com chão rolando (esteira) e rótulo
  g.save(); g.beginPath(); g.rect(0, y0, W, y1 - y0); g.clip();
  const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, '#1d3a52'); gr.addColorStop(1, '#10222f'); g.fillStyle = gr; g.fillRect(0, y0, W, y1 - y0);
  g.fillStyle = '#0d1d2b'; g.fillRect(0, chao, W, y1 - chao); g.strokeStyle = 'rgba(169,210,242,0.45)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, chao); g.lineTo(W, chao); g.stroke();
  const esp = 150 * s; for (let k = -2; k < W / esp + 2; k++) { const x = ((k * esp - desl * s) % (W + 4 * esp) + W + 4 * esp) % (W + 4 * esp) - 2 * esp, h = (14 + (k * 53 % 22 + 22) % 22) * s;
    g.strokeStyle = '#2c5060'; g.lineWidth = 4 * s; g.lineCap = 'round'; for (const a of [-0.5, 0, 0.45]) { g.beginPath(); g.moveTo(x, chao); g.lineTo(x + Math.sin(a) * h, chao - Math.cos(a) * h * 1.3); g.stroke(); } }
  g.restore(); g.font = '700 58px RC'; g.fillStyle = '#f2ead8'; g.fillText(rot, 70, y0 + 150); if (sub) { g.font = '700 44px RC'; g.fillStyle = '#a9d2f2'; g.fillText(sub, 70, y0 + 208); }
}
// poeira no contato do pé: nasce onde o pé cravou (parado no mundo), abre, sobe um pouco e some em ~0,45 s
function poeira(u, o, cx, chao, s, ritmo) {
  const b = anda(0, R, o), T = b.T, v = b.v, k = 0.14, rows = [];
  for (let n = Math.floor((u - 0.5) / T) - 1; n <= Math.floor(u / T); n++) for (const [off, sg] of [[0, -1], [0.5, 1]]) { const tc = (n + off) * T, age = u - tc; if (age < 0 || age > 0.45 || tc < 0) continue;
    const wx = v * tc + sg * (k * R.quadril / 2 + 8) + b.Ls / 2, x = cx + (wx - v * u) * s, a = 1 - age / 0.45;
    for (let i = 0; i < 5; i++) { const ang = Math.PI * (0.55 + i * 0.1), d = (18 + age * 160 * (0.6 + i * 0.12)) * s * (0.6 + 0.4 * ritmo), r = (16 + age * 110) * s * (0.5 + 0.12 * i);
      g.fillStyle = `rgba(200,222,240,${0.55 * a * a})`; g.beginPath(); g.ellipse(x + Math.cos(ang) * d - age * 40 * s, chao - 6 * s - Math.abs(Math.sin(ang)) * d * 0.35 - age * 30 * s, r, r * 0.7, 0, 0, B.TAU); g.fill(); } }
}
// ritmo do desenho: LISO (60) × MEIO-TERMO (20 poses/s, tudo junto) × MISTO (pernas e chão lisos, tronco/braços/cabeça/capa a 12 poses/s)
const passo = (t, n) => Math.floor(t * n + 1e-6) / n;
const SUP = ['lean', 'torce', 'mN', 'eN', 'mF', 'eF', 'cabT', 'bal', 'voo', 'vento', 'estica'];
function pose(t, o, modo) {                                          // devolve { x, P } (x do mundo pra rolar o chão)
  if (modo === 'meio') { const b = anda(passo(t, 20), R, o); return { x: b.x, b, rt: passo(t, 20) }; }
  const b = anda(t, R, o); if (modo !== 'misto') return { x: b.x, b, rt: t };
  const q = anda(passo(t, 12), R, o), d = [b.px - q.px, b.agacha - q.agacha], m = { ...b };   // mãos/cotovelos da pose segurada, presos no ombro liso
  for (const k of SUP) m[k] = q[k]; for (const k of ['mN', 'eN', 'mF', 'eF']) m[k] = [q[k][0] + d[0], q[k][1] + d[1]];
  return { x: b.x, b: m, rt: t };
}
function faixa(y0, y1, t, o, modo, rot, sub, s, expr, poe) {
  const chao = y1 - 70, cx = s < 1 ? 720 : 540, { x, b, rt } = pose(t, o, modo), { x: _x, v, fase, ...P } = b;
  pista(y0, y1, chao, s, x, rot, sub); if (poe) poeira(modo === 'meio' ? rt : t, o, cx, chao, s, o.ritmo);
  B.RELOGIO.t = rt; B.boneco(g, ROSA, { ...P, x: cx, y: chao, vista: 'l', dir: 1, s, expr });
}
function frame(t) {
  B.RELOGIO.t = t; g.setTransform(1, 0, 0, 1, 0, 0);
  const C = { ritmo: 1, exagero: 1 }, A = { ritmo: 0, exagero: 1 };
  if (t < 6 || t >= 13) {
    const o = t < 6 ? C : A, u = t < 6 ? t : t - 13, ex = t < 6 ? 'bravo' : 'neutro';
    faixa(0, 640, u, o, 'liso', 'LISO', '60 por segundo', 0.7, ex, t < 6); faixa(640, 1280, u, o, 'meio', 'MEIO-TERMO', '20 poses por segundo', 0.7, ex, t < 6);
    faixa(1280, 1920, u, o, 'misto', 'MISTO', 'perna lisa, corpo a 12 poses/s', 0.7, ex, t < 6);
    g.fillStyle = 'rgba(169,210,242,0.25)'; g.fillRect(0, 638, W, 4); g.fillRect(0, 1278, W, 4);
  } else if (t < 9.5) faixa(0, 1920, t - 6, C, 'meio', 'MEIO-TERMO', '20 poses por segundo', 1.45, 'bravo', true);
  else faixa(0, 1920, t - 9.5, C, 'misto', 'MISTO', 'perna lisa, corpo a 12 poses/s', 1.45, 'bravo', true);
}
await document.fonts.load('700 84px RC');
window.PLANOS = PL; window.END = FIM; console.log('FIM ' + FIM);
window.seek = async t => { frame(t); }; await window.seek(0); window.READY = true;
