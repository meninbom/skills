// luta.js — coreografia de luta de perfil (15/11): motor de chaves com pés no MUNDO (pé plantado não escorrega; pé que muda de lugar faz arco de passo),
// mãos relativas ao ombro (cotovelo natural), trechos de corrida com a anda() v7, giro do corpo inteiro (voar, cair deitado) e hit-stop global.
// Tempo da AÇÃO (a) ≠ tempo do vídeo (r): cada acerto congela a ação por alguns quadros (os efeitos e o impact frame correm no tempo do vídeo).
import { lerp, cl, add, sub, rot, dist } from './boneco.js';
import { anda } from './fisica.js';
import { sm5, ombro, cotovelo, limRel, alcance } from './acao.js';

const eOut = (k, p = 2) => 1 - Math.pow(1 - cl(k), p), eIn = (k, p = 2) => Math.pow(cl(k), p), sm = k => { k = cl(k); return k * k * (3 - 2 * k); };
export const EAS = { io: sm5, sm, out: k => eOut(k, 2), out3: k => eOut(k, 3.2), in: k => eIn(k, 2), in3: k => eIn(k, 3), lin: k => cl(k) };
const NUM = ['agacha', 'px', 'lean', 'torce', 'cabT', 'ar', 'gira', 'baixa', 'calcN', 'calcF', 'yN', 'yF', 'resp', 'trem', 'cg'], VEC = ['rN', 'rF'];
const lv = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

// ---------- lutador: lista de chaves {t, X, c (canais), wN, wF (pés no mundo), ease, slide} e trechos de corrida
export function lutador(ch, dir, X0, pose0) {
  const R = ch.R, L = { ch, R, dir, ent: [] };
  const cheio = (base, p) => { const c = { ...base }; for (const k in p) c[k] = Array.isArray(p[k]) ? [...p[k]] : p[k]; return c; };
  const ult = () => L.ent[L.ent.length - 1];
  const fim = e => e.tipo === 'k' ? e : e.fim;                                                    // estado no fim de uma entrada
  // k(t, X, pose, op): op.plant = 'N' | 'F' | 'NF' mantém o pé onde estava no mundo; op.ease; op.slide = pés acompanham sem passo
  L.k = (t, X, p, op = {}) => {
    const prev = L.ent.length ? fim(ult()) : null, c = cheio(prev ? prev.c : { agacha: 0, px: 0, lean: 0, torce: 0, cabT: 0, ar: 0, gira: 0, baixa: 0, calcN: 0, calcF: 0, yN: 0, yF: 0, resp: 0, trem: 0, cg: 0, rN: [0, 170], rF: [0, 170], nl: -40, fl: 40, expr: 'neutro' }, p);
    for (const z of ['ar', 'gira', 'baixa', 'yN', 'yF', 'trem', 'cg']) if (p[z] == null && !(op.keep || '').includes(z)) c[z] = 0;   // canais passageiros zeram se a chave não diz
    if (p.abN == null) c.abN = false; if (p.abF == null) c.abF = false;
    const wN = op.plant?.includes('N') && prev ? prev.wN : X + dir * (p.nl ?? c.nl), wF = op.plant?.includes('F') && prev ? prev.wF : X + dir * (p.fl ?? c.fl);
    L.ent.push({ tipo: 'k', t, X, c, wN, wF, ease: op.ease || 'io', slide: !!op.slide, lift: op.lift }); return L;
  };
  // corrida/caminhada procedural (anda v7) de t0 a t1, a partir do X da última chave
  L.run = (t0, t1, o) => { const X0 = fim(ult()).X, b = anda(0, R, o), v = b.v, e = { tipo: 'run', t0, t1, o, X0, v, de: fim(ult()) };
    e.fim = { tipo: 'k', t: t1, ...estadoRun(L, e, t1), ease: 'io' }; L.ent.push(e); return L; };
  L.Xfim = () => fim(ult()).X;
  L.v = o => anda(0, R, o).v;
  pose0 && L.k(0, X0, pose0);
  return L;
}
function estadoRun(L, e, t) {                                                                        // anda() → canais + pés no mundo
  const u = t - e.t0, a = anda(u, L.R, e.o), X = e.X0 + L.dir * e.v * u, P = { agacha: a.agacha, px: a.px, lean: a.lean, torce: a.torce, cabT: a.cabT, ar: 0 };
  const c = { ...e.de.c, ...P, gira: 0, baixa: 0, calcN: a.calcN, calcF: a.calcF, yN: a.pN[1], yF: a.pF[1], rN: sub(a.mN, ombro(L.R, P, -1)), rF: sub(a.mF, ombro(L.R, P, 1)), nl: a.pN[0], fl: a.pF[0], resp: 0, trem: 0 };
  return { X, c, wN: X + L.dir * a.pN[0], wF: X + L.dir * a.pF[0], run: a };
}
// estado (canais) no tempo de ação a
export function estado(L, a) {
  const E = L.ent; let i = E.length - 1; while (i > 0 && (E[i].tipo === 'k' ? E[i].t : E[i].t0) > a) i--;
  const e = E[i];
  if (e.tipo === 'run') { if (a <= e.t1) { const s = estadoRun(L, e, a), w = sm((a - e.t0) / 0.1); if (w >= 1) return s; const A = e.de; return mixE(A, s, w, false); } return seg(e.fim, E[i + 1], a); }
  return seg(e, E[i + 1], a);
}
function seg(A, B, a) {
  if (!B) return A; const t1 = B.tipo === 'k' ? B.t : B.t0; if (a >= t1) return B.tipo === 'k' ? B : B.de;
  const B2 = B.tipo === 'k' ? B : B.de; if (B.tipo === 'run') return A;          // antes de uma corrida: segura a última chave
  const k = EAS[A.ease]((a - A.t) / (t1 - A.t)), m = mixE(A, B2, k, !B2.slide), kl = cl((a - A.t) / (t1 - A.t));
  if (!B2.slide) for (const n of ['N', 'F']) { const d = B2['w' + n] - A['w' + n]; if (Math.abs(d) > 6 && A.c['y' + n] === 0 && B2.c['y' + n] === 0 && Math.abs(B2.c.ar) < 1 && Math.abs(A.c.ar) < 1) m.c['y' + n] -= (B2.lift ?? Math.min(48, Math.abs(d) * 0.32)) * Math.sin(Math.PI * kl); }
  return m;
}
function mixE(A, B, k, _) {
  const c = {}; for (const z of NUM) c[z] = lerp(A.c[z] ?? 0, B.c[z] ?? 0, k); for (const z of VEC) c[z] = lv(A.c[z], B.c[z], k);
  c.expr = k < 0.5 ? A.c.expr : B.c.expr; c.abN = k < 0.5 ? A.c.abN : B.c.abN; c.abF = k < 0.5 ? A.c.abF : B.c.abF;
  return { X: lerp(A.X, B.X, k), wN: lerp(A.wN, B.wN, k), wF: lerp(A.wF, B.wF, k), c };
}
// pose pro boneco.js (coordenadas locais) a partir do estado
export function poseDe(L, s, a) {
  const c = s.c, R = L.R, d = L.dir, P = { agacha: c.agacha + c.resp * Math.sin(2 * Math.PI * 1.15 * a + d), px: c.px + c.trem * Math.sin(a * 2 * Math.PI * 23), lean: c.lean, torce: c.torce, cabT: c.cabT, ar: c.ar,
    pN: [(s.wN - s.X) * d, c.yN], pF: [(s.wF - s.X) * d, c.yF], calcN: c.calcN, calcF: c.calcF, expr: c.expr, abertaN: c.abN, abertaF: c.abF };
  let rN = c.rN, rF = c.rF; if (c.trem) { rN = add(rN, [c.trem * Math.sin(a * 151), c.trem * Math.cos(a * 137)]); rF = add(rF, [c.trem * Math.cos(a * 149), c.trem * Math.sin(a * 131)]); }
  rN = limRel(R, rN); rF = limRel(R, rF); const oN = ombro(R, P, -1), oF = ombro(R, P, 1);
  P.mN = add(oN, rN); P.eN = add(oN, cotovelo(R, rN)); P.mF = add(oF, rF); P.eF = add(oF, cotovelo(R, rF));
  alcance(R, P); if (c.gira) P.gira = c.gira;
  return P;
}

// ---------- tempo: hit-stops (congelamentos) inseridos no tempo de ação
export function relogio(congela) {                                                                    // congela = [{a, d}] ordenado
  return { real: a => a + congela.filter(f => f.a < a).reduce((s, f) => s + f.d, 0),
    acao: r => { let off = 0; for (const f of congela) { if (r < f.a + off) return { a: r - off, f: null }; if (r < f.a + off + f.d) return { a: f.a, f, u: r - f.a - off }; off += f.d; } return { a: r - off, f: null }; } };
}
