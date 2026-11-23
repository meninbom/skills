// laboratório de caminhada/corrida: antes (v6, cremoso) × agora (v7, ágil) na esteira, depois corrida; ?folha = raio-X das posições-chave
import * as B from './boneco.js';
import { gerar, ROSA_FICHA } from './gerador.js';
import { anda, andaV1 } from './fisica.js';
const cv = document.getElementById('c'), g = cv.getContext('2d'), W = 1080, H = 1920, Q = new URLSearchParams(location.search), FOLHA = Q.has('folha');
B.setAmb([0.9, 0.93, 1.0], [0, 3, 8]); B.setLuz({ cor: '#a9d2f2', w: 2.6 });
const ROSA = gerar(ROSA_FICHA), R = ROSA.R, FIM = 16;
const PL = [{ id: 'compara', t0: 0, D: 5 }, { id: 'corre', t0: 5, D: 4 }, { id: 'anda', t0: 9, D: 3.5 }, { id: 'transicao', t0: 12.5, D: 3.5 }];
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
function frame(t) {
  B.RELOGIO.t = t; g.setTransform(1, 0, 0, 1, 0, 0);
  if (t < 5) {
    const tl = t, a = anda(tl, R, { ritmo: 1, exagero: 1, agil: 0 }), b = anda(tl, R, { ritmo: 1, exagero: 1 });   // segue 0 = v5 (corpo duro)
    pista(0, 960, 880, 1, a.x, 'ANTES', 'mole, cremoso'); pista(960, 1920, 1840, 1, b.x, 'AGORA', 'mais rápido e seco');
    const { x: _a, v: _va, fase: _fa, ...pa } = a, { x: _b, v: _vb, fase, ...pb } = b;
    B.boneco(g, ROSA, { ...pa, x: 560, y: 880, vista: 'l', dir: 1, s: 0.95, expr: 'firme' });
    poeira(tl, { ritmo: 1, exagero: 1 }, 560, 1840, 0.95, 1); B.boneco(g, ROSA, { ...pb, x: 560, y: 1840, vista: 'l', dir: 1, s: 0.95, expr: 'bravo' });
    g.fillStyle = 'rgba(169,210,242,0.25)'; g.fillRect(0, 958, W, 4);
  } else if (t < 9) {
    const u = t - 5, o = { ritmo: 1, exagero: 1 }, b = anda(u, R, o), { x, v, fase, ...pb } = b;
    pista(0, 1920, 1640, 1.45, x, 'CORRENDO', 'o corpo desliza, a perna trabalha');
    poeira(u, o, 520, 1640, 1.45, 1); B.boneco(g, ROSA, { ...pb, x: 520, y: 1640, vista: 'l', dir: 1, s: 1.45, expr: 'bravo' });
  } else if (t < 12.5) {
    const u = t - 9, o = { ritmo: 0, exagero: 1 }, b = anda(u, R, o), { x, v, fase, ...pb } = b;
    pista(0, 1920, 1640, 1.45, x, 'ANDANDO', 'balanço no braço, não no corpo');
    B.boneco(g, ROSA, { ...pb, x: 520, y: 1640, vista: 'l', dir: 1, s: 1.45, expr: 'neutro' });
  } else {                                                             // anda → corre: o ritmo sobe aos poucos (distância integrada)
    const u = t - 12.5, r0 = eIOs(B.cl((u - 0.6) / 1.4)); let dist = 0, fase = 0; const dt = 1 / 240;
    for (let s = 0; s < u; s += dt) { const r = eIOs(B.cl((s - 0.6) / 1.4)), T = anda(0, R, { ritmo: r, exagero: 1 }).T; fase += dt / T; dist += dt * anda(0, R, { ritmo: r, exagero: 1 }).v; }
    const T = anda(0, R, { ritmo: r0, exagero: 1 }).T, b = anda(fase * T, R, { ritmo: r0, exagero: 1 }), { x, v, fase: _f, ...pb } = b;
    pista(0, 1920, 1640, 1.45, dist, 'ANDA → CORRE', 'o ritmo sobe sem trocar de ciclo');
    B.boneco(g, ROSA, { ...pb, x: 520, y: 1640, vista: 'l', dir: 1, s: 1.45, expr: r0 > 0.5 ? 'bravo' : 'neutro' });
  }
}
function eIOs(k) { k = B.cl(k); return k * k * (3 - 2 * k); }
function folha() {                                                     // raio-X: 8 instantes do ciclo, andando e correndo, com o chão marcado
  cv.width = 2400; cv.height = 1500; g.fillStyle = '#12283a'; g.fillRect(0, 0, 2400, 1500); B.RELOGIO.t = 0.5;
  for (const [ri, rit, y, nome] of [[0, 0, 680, 'ANDANDO'], [1, 1, 1400, 'CORRENDO']]) {
    g.font = '700 54px RC'; g.fillStyle = '#a9d2f2'; g.fillText(nome + ' · 8 instantes de um ciclo (perna da frente = mais clara)', 50, y - 610);
    g.strokeStyle = 'rgba(169,210,242,0.4)'; g.lineWidth = 3; g.beginPath(); g.moveTo(30, y); g.lineTo(2370, y); g.stroke();
    const T = anda(0, R, { ritmo: rit, exagero: 1 }).T;
    for (let i = 0; i < 8; i++) { const b = anda(T * i / 8, R, { ritmo: rit, exagero: 1 }), { x, v, fase, ...pb } = b; B.boneco(g, ROSA, { ...pb, x: 170 + i * 295, y, vista: 'l', dir: 1, s: 0.88, expr: 'neutro' });
      g.font = '700 34px RC'; g.fillStyle = '#f2ead8'; g.textAlign = 'center'; g.fillText((i / 8).toFixed(3).replace(/0+$/, '').replace(/\.$/, ''), 170 + i * 295, y + 48); g.textAlign = 'left'; }
  }
}
await document.fonts.load('700 84px RC');
window.PLANOS = PL; window.END = FIM; console.log('FIM ' + FIM);
window.seek = async t => { if (FOLHA) folha(); else frame(t); }; await window.seek(0); window.READY = true;
