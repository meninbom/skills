// Episódio 7 — prova de abertura (A1-01 a A1-05) no estilo vetor 2D em camadas.
import * as B from './boneco.js';
import { IARA, GENERAL } from './elenco.js';
import * as M from './motor.js';
const { NICO, boneco, mix, lerp, cl, TAU, C } = B, { W, H, CH, st, eOut, eIO, eBack } = M;
const cv = document.getElementById('c'), X = M.inicia(cv);
const ombro = ch => -(ch.R.pe + ch.R.coxa + ch.R.canela + ch.R.tronco) + 8;
const NX = 230, GX = 770, IX = 962, IAR = 96;                          // posições no mundo; IAR = quanto a Iara está erguida

// ---------- poses
const oN = ombro(NICO), oG = ombro(GENERAL), oI = ombro(IARA);
const nicoMira = (pux, o = {}) => ({ x: NX, y: CH, vista: 'l', dir: 1, expr: 'firme', lean: -0.05, pN: [-46, 0], pF: [52, 0], mF: [150, oN - 2], mN: [lerp(110, 16, pux), oN - 10], eN: [lerp(-10, -86, pux), oN - lerp(-40, 16, pux)], cotF: 1, cabT: 0.04, ...o });
const generalBase = (o = {}) => ({ x: GX, y: CH + 4, vista: 'q', dir: 1, pN: [-36, 0], pF: [44, 0], mF: [IX - GX - 18, oI - IAR - (CH + 4 - CH) + 4], cotF: 1, abertaF: false, curvaN: 0.3, ...o });
const iaraPresa = (t, o = {}) => { const b = Math.sin(t * 1.7) * 0.5 + Math.sin(t * 2.9) * 0.2; return { x: IX, y: CH, vista: 'q', dir: -1, ar: IAR, expr: 'bravo', lean: 0.05 + b * 0.03, bal: b * 0.5, pN: [-22 + b * 14, -34], pF: [26 + b * 18, -14], mN: [10, oI - IAR - 22], mF: [34, oI - IAR - 16], cotN: 1, cotF: 1, cabT: -0.08, sombra: false, ...o }; };

function arcoNico(g, S, pux, vib = 0, flechaOn = true) {
  B.arco(g, S.mF, vib * 0.02, { L: 150, puxa: pux, cordaEm: pux > 0.02 ? [S.mN[0] + 10, S.mN[1]] : null, cor: '#8a5a30', flecha: flechaOn && pux > 0.02 ? { L: 196 } : null });
}
function rastroFlecha(g, x, y, len, a = 0.8) { g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createLinearGradient(x - len, y, x, y); gr.addColorStop(0, 'rgba(190,230,255,0)'); gr.addColorStop(1, `rgba(215,240,255,${a})`); g.strokeStyle = gr; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - len, y); g.lineTo(x, y); g.stroke(); g.lineWidth = 2; g.strokeStyle = `rgba(255,255,255,${a})`; g.beginPath(); g.moveTo(x - len * 0.5, y); g.lineTo(x, y); g.stroke(); g.restore(); }

// ---------- planos
const CAPS = [
  [3.08, 3.95, 'ELE NEM VIROU', 520], [3.95, 4.95, 'A *CABEÇA.*', 520],
  [7.35, 8.95, '*ANOMALIA* DETECTADA.', 1400], [9.25, 10.3, 'INICIANDO PROCESSO', 1400], [10.3, 11.55, 'DE *ELIMINAÇÃO.*', 1400],
];
const SIL = [7.4, 7.56, 7.72, 7.88, 8.02, 8.22, 8.4, 8.56, 8.72, 9.3, 9.44, 9.58, 9.72, 9.86, 10.02, 10.18, 10.34, 10.48, 10.62, 10.76, 10.9, 11.04, 11.2];   // sílabas da fala do General
const aneisFala = t => { let v = 0.12 + 0.05 * Math.sin(t * 2); for (const s of SIL) if (t >= s) v = Math.max(v, Math.exp(-(t - s) * 9)); return v; };

const PLANOS = [
  { t0: 0, t1: 1.5, fn(t, u) {                                           // A1-01 close: a corda estala
    const tR = 0.62, sol = u >= tR, pux = sol ? 0 : lerp(0.94, 1, st(0, tR, u)), vib = sol ? Math.sin((u - tR) * 95) * Math.exp(-(u - tR) * 13) * 8 : 0, k = sol ? eOut((u - tR) / 0.06) : 0;
    const tr = M.tremida(t, tR, 6, 0.15), cam = { x: NX + 96 + 10 * st(0, 1.5, u), y: CH - 386, z: 2.5 + 0.1 * st(0, 1.5, u) + (sol ? 0.05 * Math.exp(-(u - tR) * 10) : 0), sx: tr[0], sy: tr[1] };
    M.cena(t, cam, { foco: 1.3, frenteBlur: 18 }, g => {
      const P = nicoMira(pux, { expr: sol ? 'bravo' : 'firme', mN: sol ? [lerp(16, -12, k), oN - 10 - 8 * k] : [16 - (pux - 0.94) * 80, oN - 10], eN: [-86 - 14 * k, oN - 16 - 10 * k], abertaN: sol, olha: [3, 0], vento: sol ? Math.exp(-(u - tR) * 6) : 0 });
      P.frente = (gg, S) => arcoNico(gg, S, pux, vib, !sol);
      boneco(g, NICO, P);
      if (sol) { const xa = NX + 260 + (u - tR) * 5200; rastroFlecha(g, xa, CH + oN - 4, 520, 0.9 * (1 - st(0.02, 0.16, u - tR))); M.anelSom(g, t, tR, [NX + 118, CH + oN - 4], { r: 420, dur: 0.5, n: 3, w: 6 }); }
    });
    M.acabamento(t, { flash: sol ? 0.14 * Math.exp(-(u - tR) * 26) : 0 });
    M.pilula(t, 0.12, 1.46, W / 2, 250, [['VOCÊS VOTARAM', '#fff'], ['1 · ATIRA', '#f4b92e']], { tam: 44, borda: 'rgba(244,185,46,0.7)' });
  } },
  { t0: 1.5, t1: 3.0, fn(t, u) {                                         // A1-02 a mão fecha na flecha, sem olhar
    const tC = 0.26, peg = u >= tC, k = peg ? eOut((u - tC) / 0.034) : 0;                                  // o braço vai do repouso à pegada em 2 quadros
    const tr = M.tremida(t, 1.5 + tC, 15, 0.2), cam = { x: GX - 150, y: CH - 520 + 6 * u, z: 2.2 + 0.07 * u + (peg ? 0.06 * Math.exp(-(u - tC) * 9) : 0), sx: tr[0], sy: tr[1] };
    const base = generalBase({ mN: [-78, oG + 316], eN: [-92, oG + 166], torce: 0 }), pega = generalBase({ mN: [-214, oG + 96], eN: [-120, oG + 150], torce: -0.5 });
    const P = mix(base, pega, k); P.aneis = 0.1 + (peg ? 0.5 * Math.exp(-(u - tC) * 5) : 0); P.t = t; P.abertaN = k < 0.5; P.curvaN = 0.3; P.maoAnN = lerp(1.3, Math.PI * 0.56, k);
    const S = B.esq(GENERAL.R, pega), ax = GX + S.mN[0] + 58, ay = CH + 4 + S.mN[1] + 2;                      // a ponta passa 58 px do punho
    const diss = st(tC + 0.5, tC + 1.1, u), wob = peg ? Math.sin((u - tC) * 70) * Math.exp(-(u - tC) * 8) * 0.06 : 0;
    M.cena(t, cam, { foco: 1.1, frenteBlur: 16 }, g => {
      boneco(g, IARA, iaraPresa(t));
      if (!peg) { const xa = lerp(ax - 1700, ax, u / tC); rastroFlecha(g, xa, ay, 700, 0.9); B.flecha(g, [xa - 196, ay], 0, { L: 196 }); }
      else if (diss < 1) { g.save(); g.translate(ax - 58, ay); g.rotate(wob); g.beginPath(); g.rect(58 - (196 + 40) * (1 - diss) - 4, -40, (196 + 40) * (1 - diss) + 30, 80); g.clip(); B.flecha(g, [58 - 196, 0], 0, { L: 196 }); g.restore(); }
      boneco(g, GENERAL, P);
      if (peg && diss > 0) for (let i = 0; i < 7; i++) M.cubinhos(g, t, 1.5 + tC + 0.5 + i * 0.085, [ax - 150 + i * 26, ay], { n: 8, v: 90, s: 11, dur: 0.6, seed: 20 + i, sobe: 80 });
      if (peg) { M.faiscas(g, t, 1.5 + tC, [ax - 40, ay], { n: 14, v: 170, cor: '#cfeaff', dur: 0.3 }); M.anelSom(g, t, 1.5 + tC, [ax - 40, ay], { r: 190, dur: 0.45, n: 2, w: 5 }); }
    });
    M.acabamento(t, { flash: peg ? 0.26 * Math.exp(-(u - tC) * 30) : 0 });
  } },
  { t0: 3.0, t1: 5.0, fn(t, u) {                                         // A1-03 a concha, imóvel
    const cam = { x: GX + 44 + 8 * u, y: CH + oG - 36, z: 3.3 + 0.22 * eIO(u / 2) };
    M.cena(t, cam, { foco: 1.6, frenteBlur: 20 }, g => { boneco(g, IARA, iaraPresa(t)); boneco(g, GENERAL, generalBase({ aneis: 0.14 + 0.05 * Math.sin(t * 2.4), t })); });
    M.acabamento(t, { vinheta: 0.72 });
  } },
  { t0: 5.0, t1: 7.2, fn(t, u) {                                         // A1-04 aberto: a 2ª passa raspando
    const tR = 0.7, sol = u >= tR, pux = sol ? 0 : eIO(cl(u / 0.52)), vib = sol ? Math.sin((u - tR) * 95) * Math.exp(-(u - tR) * 13) * 8 : 0, tA = (GX - 90 - NX - 150) / 3400;   // tempo da flecha até a cabeça
    const des = sol ? eOut((u - tR - tA + 0.05) / 0.035) * (1 - eIO((u - tR - tA - 0.12) / 0.42)) : 0, tr = M.tremida(t, 5 + tR + tA, 9, 0.15);
    const cam = { x: 584 + 10 * u, y: CH - 500, z: 1.1 + 0.03 * u, sx: tr[0], sy: tr[1] };
    M.cena(t, cam, { foco: 0, frenteBlur: 12 }, g => {
      const P = nicoMira(pux, { expr: sol ? 'bravo' : 'firme', mN: sol ? [lerp(16, -12, eOut((u - tR) / 0.06)), oN - 16] : [lerp(110, 16, pux), oN - 10], abertaN: sol }); if (sol) P.eN = [-98, oN - 24]; P.frente = (gg, S) => arcoNico(gg, S, pux, vib, !sol); boneco(g, NICO, P);
      if (sol) { const xa = NX + 250 + (u - tR) * 3400, ya = CH + oN - 4 - (u - tR) * 3400 * 0.39; if (xa < 1900) { g.save(); g.translate(xa, ya); g.rotate(-0.372); rastroFlecha(g, 0, 0, 420, 0.8); B.flecha(g, [-196, 0], 0, { L: 196 }); g.restore(); } M.anelSom(g, t, 5 + tR, [NX + 118, CH + oN - 4], { r: 300, dur: 0.5 }); }
      boneco(g, IARA, iaraPresa(t));
      boneco(g, GENERAL, generalBase({ lean: 0.11 * des, cabT: 0.16 * des, aneis: 0.12 + 0.6 * des, t }));
      if (sol) M.faiscas(g, t, 5 + tR + tA, [GX - 30, CH + oG - 140], { n: 7, v: 120, dur: 0.22, an: -0.4, abre: 1.6 });
    });
    M.acabamento(t);
  } },
  { t0: 7.2, t1: 11.6, fn(t, u) {                                        // A1-05 "Anomalia detectada"
    const cam = { x: GX + 86 - 10 * u, y: CH + oG + 150 + 4 * u, z: 1.62 + 0.05 * u }, an = aneisFala(t), gl = t > 8.46 && t < 8.5 ? 1 : 0;
    M.cena(t, cam, { foco: 0.9, frenteBlur: 16 }, g => {
      boneco(g, IARA, iaraPresa(t, { expr: 'bravo' }));
      boneco(g, GENERAL, generalBase({ aneis: an, t }));
      for (const s of SIL) M.anelSom(g, t, s, [GX + 14, CH + oG - 124], { r: 150, dur: 0.5, n: 1, w: 4, a: 0.5, ach: 1.15 });
      if (gl) { g.save(); g.translate(IX - 10, CH + oI - IAR - 250); g.fillStyle = 'rgba(40,6,10,0.92)'; g.fillRect(-170, -34, 340, 68); g.strokeStyle = '#ff4a52'; g.lineWidth = 3; g.strokeRect(-170, -34, 340, 68); g.font = '700 40px RC'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ff5a60'; g.fillText('ANOMALIA: IARA', 0, 3); g.fillStyle = 'rgba(120,230,255,0.5)'; g.fillRect(-170, -8, 340, 5); g.restore(); }
    });
    M.acabamento(t);
  } },
];
const END = 11.6;
function frame(t) { t = cl(t, 0, END - 1e-4); B.setAmb([0.88, 0.92, 1.0], [0, 3, 8]); const p = PLANOS.find(p => t >= p.t0 && t < p.t1); p.fn(t, t - p.t0); M.legenda(t, CAPS); }
await document.fonts.load('700 84px RC');
window.END = END; window.seek = async t => frame(t); frame(0); window.READY = true;
