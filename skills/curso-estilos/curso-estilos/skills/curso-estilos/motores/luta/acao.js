// acao.js — sequência de ação de perfil : corre → freia derrapando → pula pra trás → carrega → golpe poderoso → segura → volta.
// Tudo em coordenadas do boneco (frente = +x, chão y = 0) + X = posição do corpo no mundo. A corrida é a anda() v7 (aprovada, lisa a 60 qps).
// Regras de tempo (game feel): antecipa devagar, golpe em 3 quadros, congela 0,12 s no acerto (hit-stop), recuo com mola, cauda curta.
import { lerp, cl, add, sub, rot, dist } from './boneco.js';
import { anda, mola } from './fisica.js';

export const sm5 = k => { k = cl(k); return k * k * k * (k * (6 * k - 15) + 10); }, eOut = (k, p = 2) => 1 - Math.pow(1 - cl(k), p), eIn = (k, p = 2) => Math.pow(cl(k), p);
const EAS = { io: sm5, out: k => eOut(k, 2), out3: k => eOut(k, 3.2), in: k => eIn(k, 2), lin: k => cl(k), sm: k => { k = cl(k); return k * k * (3 - 2 * k); } };
const lv = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const mixV = (a, b, k) => typeof a === 'number' ? lerp(a, b, k) : lv(a, b, k);
// trilha de chaves [[t, valor, easing do trecho que começa nela], ...]; segura antes da 1ª e depois da última
function tr(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) { const [t0, v0, e] = keys[i], [t1, v1] = keys[i + 1]; if (t < t1) return mixV(v0, v1, EAS[e || 'io']((t - t0) / (t1 - t0))); }
  return keys[keys.length - 1][1];
}
// mola simulada (passa um pouco e assenta) seguindo um alvo; integra do zero, com cache pra render sequencial
function seguidor(alvo, f, z, x0) {
  let tc = -1, x = 0, v = 0; const dt = 1 / 480, w = 2 * Math.PI * f;
  return t => { if (t < tc || tc < 0) { tc = 0; x = x0 ?? alvo(0); v = 0; }
    while (tc + dt <= t) { const a = w * w * (alvo(tc) - x) - 2 * z * w * v; v += a * dt; x += v * dt; tc += dt; } return x; };
}

export function tempos(R) {
  const o = { ritmo: 1, exagero: 1 }, b = anda(0, R, o), T = b.T, v = b.v, tB = 2.5 * T;     // freia no contato do pé de trás (F) que vem à frente
  const tS = tB + 0.5, tA0 = tS + 0.02, tI0 = tA0 + 0.1, Ta = 0.05, Tf = 0.36, tI1 = tI0 + Ta, tL = tI1 + Tf, tC0 = tL + 0.14, tW = tC0 + 0.74, tSt = tW + 0.09, tHit = tSt + 0.05, tRc = tHit + 0.12, tUp = tHit + 0.95, tFim = tUp + 0.62;
  const XB = v * tB, XS = XB + v * 0.5 / 2, D = 280, vb = D / (Ta / 2 + Tf), XL = XS - D, XC = XL - 40, XH = XC + 60, XR = XH - 30;
  return { o, T, v, tB, tS, tA0, tI0, Ta, Tf, tI1, tL, tC0, tW, tSt, tHit, tRc, tUp, tFim, XB, XS, D, vb, XL, XC, XH, XR };
}
export function corpoX(t, Z) {
  const { v, tB, tS, tI0, Ta, Tf, tI1, tL, tSt, tHit, tRc, XB, XS, D, vb, XL, XC, XH } = Z;
  if (t < tB) return v * t;
  if (t < tS) { const u = t - tB; return XB + v * (u - u * u / (2 * 0.5)); }
  if (t < tI0) return XS;
  if (t < tI1) { const u = t - tI0; return XS - vb * u * u / (2 * Ta); }
  if (t < tL) return XS - vb * (Ta / 2 + (t - tI1));
  if (t < tSt) return XL - 40 * eOut((t - tL) / 0.22, 2);                                  // desliza pra trás depois do pouso
  if (t < tHit) return XC + 60 * EAS.out3((t - tSt) / (tHit - tSt));                         // estocada
  if (t < tRc) return XH;                                                                    // hit-stop
  return XH - 30 * eOut((t - tRc) / 0.38, 2);                                                // recuo do disparo (os dois pés deslizam)
}

// ombro, alcance e cotovelo natural (lado certo, sem escorço)
export const ombro = (R, P, sg) => add([P.px || 0, -(R.coxa + R.canela + R.pe) + (P.agacha || 0) - (P.ar || 0)], rot([sg * 0.14 * R.ombro / 2 + (P.torce || 0) * sg * 8, -R.tronco + 8], P.lean || 0));
export function cotovelo(R, rel) { const L1 = R.braco[0], L2 = R.braco[1], d = Math.max(1, Math.hypot(rel[0], rel[1])), a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a)), u = [rel[0] / d, rel[1] / d];
  return [u[0] * a - u[1] * h, u[1] * a + u[0] * h]; }   // normal (-uy, ux): lado "horário" = cotovelo pra trás/baixo, o que a trava pede
export const limRel = (R, rel) => { const L = R.braco[0] + R.braco[1] - 3, d = Math.hypot(rel[0], rel[1]); return d > L ? [rel[0] * L / d, rel[1] * L / d] : rel; };
export function tornoz(R, p, c) { const off = c > 0 ? R.peL : -(R.lw[2] / 2 + 4); return c ? add([p[0] + off, p[1]], rot([-off, -R.pe], c)) : [p[0], p[1] - R.pe]; }
// pé que ficaria fora do alcance vem pra perto do quadril (sai do chão), nunca abaixo do chão
export function alcance(R, P) {
  const lim = (R.coxa + R.canela) * 0.975 - 1.5;
  for (const [n, sg] of [['N', -1], ['F', 1]]) { const p = P['p' + n], c = P['calc' + n] || 0, h = [(P.px || 0) + sg * 0.14 * R.quadril / 2, -(R.coxa + R.canela + R.pe) + (P.agacha || 0)];
    for (let it = 0; it < 3; it++) { const t = tornoz(R, p, c), d = dist(t, h); if (d <= lim) break; const k = (d - lim) / d; p[0] -= (t[0] - h[0]) * k; p[1] = Math.min(0, p[1] - (t[1] - h[1]) * k); } }
  return P;
}
export const maos = (R, P, rN, rF) => { rN = limRel(R, rN); rF = limRel(R, rF); const oN = ombro(R, P, -1), oF = ombro(R, P, 1);
  return { mN: add(oN, rN), eN: add(oN, cotovelo(R, rN)), mF: add(oF, rF), eF: add(oF, cotovelo(R, rF)) }; };

// poses-chave (valores do corpo; mãos relativas ao ombro)
const K = {
  S: { agacha: 100, px: -38, lean: -0.28, torce: 0.3, cabT: 0.1, pF: [165, 0], calcF: -0.45, pN: [-30, 0], calcN: 0.6, rN: [120, 80], rF: [155, 8] },               // derrapando: pé da frente cravado de calcanhar, tronco pra trás, braços jogados
  A: { agacha: 104, px: 0, lean: 0.04, torce: 0, cabT: 0, pF: [165, 0], calcF: -0.1, pN: [-30, 0], calcN: 0.5, rN: [80, 125], rF: [105, 115] },                     // antecipa o pulo: afunda em cima do pé da frente
  C: { agacha: 66, px: -8, lean: 0.1, torce: -0.6, cabT: -0.04, pF: [110, 0], calcF: 0, pN: [-110, 0], calcN: 0.25, rN: [-55, 100], rF: [130, 10] },             // base larga carregando: punho recolhido atrás, palma da frente mirando
  W: { agacha: 80, px: -14, lean: -0.02, torce: -0.95, cabT: -0.02, rN: [-80, 86], rF: [140, -6] },                                                                 // arma: puxa mais, afunda, torce o ombro pra trás
  H: { agacha: 100, px: 35, lean: 0.45, torce: 0.9, cabT: -0.12, pF: [100, 0], calcF: 0, pN: [-180, 0], calcN: 0.5, rN: [182, 12], rF: [-50, 100] },               // acerto: estocada, braço esticado, o outro puxa pro quadril
  Rc: { agacha: 92, px: 28, lean: 0.36, torce: 0.75, cabT: -0.06, rN: [176, 24], rF: [-46, 104] },                                                                // segura depois do recuo
  U: { agacha: 32, px: 35, lean: 0.05, torce: 0, cabT: 0, pF: [100, 0], calcF: 0, pN: [-20, 0], calcN: 0, rN: [6, 176], rF: [14, 174] },                         // de pé, guarda solta
};
const CAMPOS = ['agacha', 'px', 'lean', 'torce', 'cabT', 'pF', 'calcF', 'pN', 'calcN', 'rN', 'rF'];
const mixK = (a, b, k) => { const o = {}; for (const c of CAMPOS) if (a[c] != null) o[c] = b[c] != null ? mixV(a[c], b[c], k) : a[c]; return o; };

export function criaAcao(R) {
  const Z = tempos(R), per = R.coxa + R.canela, rB = anda(Z.tB, R, Z.o), relRun = (P, sg) => sub(P[sg < 0 ? 'mN' : 'mF'], ombro(R, P, sg));
  const KB = { agacha: rB.agacha, px: rB.px, lean: rB.lean, torce: rB.torce, cabT: rB.cabT, pF: rB.pF, calcF: rB.calcF, pN: rB.pN, calcN: rB.calcN, rN: relRun(rB, -1), rF: relRun(rB, 1) };
  // impulso do pulo: pés presos no mundo enquanto o corpo começa a ir pra trás; o que não alcança sai do chão
  const impulso = t => { const k = cl((t - Z.tI0) / Z.Ta), dX = Z.XS - corpoX(t, Z), P = { agacha: lerp(K.A.agacha, 14, eIn(k, 1.6)), ar: 14 * eIn(k, 3), px: lerp(K.A.px, -10, k), lean: lerp(K.A.lean, -0.06, k), torce: 0, cabT: lerp(0, -0.05, k),
    pF: [K.A.pF[0] + dX, 0], calcF: lerp(-0.1, 0.2, eOut(k)), pN: [K.A.pN[0] + dX, 0], calcN: lerp(0.5, 0.9, eOut(k)), rN: lv(K.A.rN, [-110, 92], eOut(k)), rF: lv(K.A.rF, [-92, 108], eOut(k)) }; return alcance(R, P); };
  const P1 = impulso(Z.tI1);
  const ar = { agacha: [[0, P1.agacha, 'io'], [0.5, 22, 'in'], [1, 44]], lean: [[0, P1.lean, 'io'], [0.5, 0.12, 'io'], [1, 0.1]], torce: [[0, 0, 'io'], [1, -0.35]], cabT: [[0, -0.05, 'io'], [1, -0.04]],
    pF: [[0, P1.pF, 'out'], [0.45, [80, -62], 'io'], [0.86, [112, -5], 'out'], [1, [110, 0]]], pN: [[0, P1.pN, 'out'], [0.45, [-70, -78], 'io'], [0.86, [-108, -5], 'out'], [1, [-110, 0]]],
    calcF: [[0, P1.calcF, 'io'], [0.7, 0.1, 'io'], [1, 0]], calcN: [[0, P1.calcN, 'io'], [0.7, 0.35, 'io'], [1, 0.25]], rN: [[0, P1.rN, 'out'], [0.55, [70, 70], 'io'], [1, [-30, 108]]], rF: [[0, P1.rF, 'out'], [0.55, [120, 40], 'io'], [1, [128, 16]]] };
  // capa: alvo por fase + mola (passa e assenta) = o pano chega atrasado e chicoteia
  const ventoAlvo = t => t < Z.tB ? anda(t, R, Z.o).vento : t < Z.tS + 0.05 ? -1.0 : t < Z.tI0 ? -0.2 : t < Z.tL ? -1.4 : t < Z.tSt ? 0.15 : t < Z.tUp ? 1.0 : 0.35;
  const vooAlvo = t => t < Z.tB ? anda(t, R, Z.o).voo : t < Z.tS ? 0.35 : t < Z.tI1 ? 0 : t < (Z.tI1 + Z.tL) / 2 ? -0.3 : t < Z.tL ? 0.8 : t < Z.tC0 ? 0.1 : t < Z.tSt ? 0.25 : t < Z.tHit + 0.3 ? -0.25 : 0;
  const vento = seguidor(ventoAlvo, 2.6, 0.32), voo = seguidor(vooAlvo, 3.2, 0.3);

  function pose(t) {
    let P, fase, carga = 0;
    if (t < Z.tB) { const a = anda(t, R, Z.o); P = { agacha: a.agacha, px: a.px, lean: a.lean, torce: a.torce, cabT: a.cabT, pF: a.pF, calcF: a.calcF, pN: a.pN, calcN: a.calcN, mN: a.mN, eN: a.eN, mF: a.mF, eF: a.eF, bal: a.bal }; fase = 'corre'; }
    else {
      let k;
      if (t < Z.tA0) { const u = t - Z.tB, w = EAS.out(u / 0.13); k = mixK(KB, K.S, w); k.pN = [lerp(KB.pN[0], K.S.pN[0], EAS.io(u / 0.13)), lerp(KB.pN[1], 0, EAS.out(u / 0.11))];   // pé de trás desce rápido e acompanha
        k.cabT = lerp(KB.cabT, 0.02, w) + 0.16 * Math.sin(2 * Math.PI * 2.2 * u) * Math.exp(-u * 4.5);   // a cabeça vai pra frente na freada e volta
        k.agacha = lerp(KB.agacha, K.S.agacha, EAS.out(u / 0.1)) + 6 * Math.sin(Math.PI * cl(u / 0.4)) * (1 - cl(u / 0.4)); fase = 'freia';
        if (u < 0.1) { const a = anda(t, R, Z.o), wr = 1 - sm5(u / 0.1); for (const c of ['agacha', 'px', 'lean', 'torce']) k[c] = lerp(k[c], a[c], wr); k.pF = lv(k.pF, a.pF, wr); k.pN = lv(k.pN, a.pN, wr); } }   // a corrida continua viva no 1º décimo
      else if (t < Z.tI0) { k = mixK(K.S, K.A, EAS.io((t - Z.tA0) / (Z.tI0 - Z.tA0))); fase = 'antecipa'; }
      else if (t < Z.tI1) { k = impulso(t); fase = 'impulso'; }
      else if (t < Z.tL) { const w = (t - Z.tI1) / Z.Tf; k = {}; for (const c in ar) k[c] = tr(ar[c], w); k.ar = 14 * (1 - w) + 4 * 95 * w * (1 - w); fase = 'ar'; }
      else if (t < Z.tW) { const u = t - Z.tL, w = EAS.out(u / 0.14); k = mixK({ ...tr2(ar, 1), pF: [110, 0], pN: [-110, 0] }, K.C, w);
        k.agacha = (u < 0.07 ? lerp(44, 88, eOut(u / 0.07)) : 66 + 22 * (1 - mola(u - 0.07, 1.8, 0.5))) + 9 * EAS.sm((t - Z.tC0) / (Z.tW - Z.tC0));   // pouso absorve e afunda carregando
        carga = EAS.sm((t - Z.tL - 0.05) / (Z.tW - Z.tL - 0.05)); const tm = carga * carga; k.px += 1.6 * tm * Math.sin(t * 2 * Math.PI * 23); k.rN = add(k.rN, [1.5 * tm * Math.sin(t * 151), 1.5 * tm * Math.cos(t * 137)]); fase = u < 0.14 ? 'pousa' : 'carrega'; }
      else if (t < Z.tSt) { k = mixK({ ...K.C, agacha: K.C.agacha + 9 }, { ...K.C, ...K.W }, EAS.io((t - Z.tW) / (Z.tSt - Z.tW))); carga = 1; fase = 'arma'; }
      else if (t < Z.tHit) { const w = EAS.out3((t - Z.tSt) / (Z.tHit - Z.tSt)), dX = corpoX(t, Z) - Z.XC; k = mixK({ ...K.C, ...K.W }, K.H, w); k.pN = [K.C.pN[0] - dX * (K.C.pN[0] - K.H.pN[0]) / 60, 0]; k.pF = [K.C.pF[0] + 50 * w - dX, -22 * Math.sin(Math.PI * w)]; carga = 1; fase = 'golpe'; }
      else if (t < Z.tRc) { k = { ...K.H }; fase = 'acerto'; }
      else if (t < Z.tUp) { k = mixK(K.H, { ...K.H, ...K.Rc }, EAS.out((t - Z.tRc) / 0.4)); fase = 'segura'; }
      else { const w = (t - Z.tUp) / (Z.tFim - Z.tUp), ws = cl((w - 0.12) / 0.6); k = mixK({ ...K.H, ...K.Rc }, K.U, EAS.io(w)); k.pN = [lerp(K.H.pN[0], K.U.pN[0], EAS.io(ws)), -30 * Math.sin(Math.PI * ws)]; k.calcN = lerp(0.5, 0, EAS.io(ws));   // passo de volta com o pé de trás
        k.agacha += 2.5 * Math.sin((t - Z.tFim) * 2 * Math.PI * 0.9) * EAS.sm(w); fase = 'volta'; }
      P = { ...k, ...maos(R, k, k.rN, k.rF) }; delete P.rN; delete P.rF; alcance(R, P);
      P.bal = 0.3 * Math.sin((t - Z.tB) * 11) * Math.exp(-(t - Z.tB) * 2.2) + (t > Z.tHit ? 0.25 * Math.sin((t - Z.tHit) * 13) * Math.exp(-(t - Z.tHit) * 3) : 0);
      P.estica = t >= Z.tL && t < Z.tL + 0.3 ? 1 - 0.12 * Math.exp(-(t - Z.tL) / 0.045) : t >= Z.tI0 && t < Z.tL ? 1 + 0.06 * Math.sin(Math.PI * cl((t - Z.tI0) / (Z.tL - Z.tI0) * 2)) : 1;
      P.esticaY = 0;
      P.abertaF = fase === 'carrega' || fase === 'pousa' || fase === 'arma' || fase === 'ar';
    }
    const ex = { corre: 'bravo', freia: 'firme', antecipa: 'firme', impulso: 'firme', ar: 'firme', pousa: 'bravo', carrega: 'bravo', arma: 'bravo', golpe: 'grita', acerto: 'grita', segura: 'bravo', volta: 'firme' }[fase];
    return { P: { ...P, vento: vento(t), voo: voo(t), expr: ex }, X: corpoX(t, Z), fase, carga };
  }
  return { Z, pose };
}
function tr2(ar, w) { const k = {}; for (const c in ar) k[c] = tr(ar[c], w); return k; }
