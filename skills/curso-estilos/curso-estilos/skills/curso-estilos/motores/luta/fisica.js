// fisica.js — peso no corpo, sem simular nada: curvas de tempo medidas de animação 2D (antecipação, impulso, voo, pouso)
// devolvem pedaços de pose (agacha, lean, px, ar, estica, calc*, p*, m*, voo) pra somar na pose do personagem.
// Regras que valem pra qualquer boneco do motor:
//  1. agachar = quadril desce E vai pra trás, tronco inclina pra frente (o centro de massa fica em cima dos pés)
//  2. antes de subir, desce (antecipação ~1/4 do salto); o impulso sai da ponta do pé (calcanhar sobe)
//  3. no ar: estica na subida, encolhe as pernas no alto, abre os braços pra equilibrar
//  4. no pouso: achata 2–3 quadros, o joelho absorve num pico rápido e volta com mola (passa um pouco e assenta)
//  5. o pano atrasa: subindo, fica pra baixo; caindo, o ar levanta; no pouso continua descendo e quica
import { lerp, cl, add, sub, rot, dist } from './boneco.js';
const eIO = k => { k = cl(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }, eIn = (k, p = 2) => Math.pow(cl(k), p), eOut = (k, p = 2) => 1 - Math.pow(1 - cl(k), p);

// mola amortecida: resposta ao degrau 0 → 1 (passa um pouco e assenta). f em Hz, z = amortecimento
export const mola = (u, f = 2.2, z = 0.45) => u <= 0 ? 0 : 1 - Math.exp(-z * 2 * Math.PI * f * u) * (Math.cos(2 * Math.PI * f * Math.sqrt(1 - z * z) * u) + z / Math.sqrt(1 - z * z) * Math.sin(2 * Math.PI * f * Math.sqrt(1 - z * z) * u));

// equilíbrio do agachamento: dado o quanto desce, quanto o quadril recua e o tronco inclina
export const equilibrio = (agacha, R) => { const k = cl(agacha / (0.55 * (R.coxa + R.canela))); return { px: -k * R.quadril * 0.42, lean: k * 0.42 }; };

// braços: alvos de mão (locais) a partir do ombro atual; dir: 'tras' | 'cima' | 'frente' | 'abre' | 'solto'
function maos(R, ombY, modo, k = 1) {
  const L = R.braco[0] + R.braco[1], A = {
    solto: [[-0.02, 0.92], [0.12, 0.9]], tras: [[-0.62, 0.66], [-0.48, 0.72]], cima: [[0.6, -0.72], [0.74, -0.6]],
    abre: [[-0.55, -0.12], [0.66, -0.2]], frente: [[0.5, 0.62], [0.72, 0.5]] }[modo];
  return { mN: [A[0][0] * L * k, ombY + A[0][1] * L * k], mF: [A[1][0] * L * k, ombY + A[1][1] * L * k] };
}
const mixM = (a, b, k) => ({ mN: [lerp(a.mN[0], b.mN[0], k), lerp(a.mN[1], b.mN[1], k)], mF: [lerp(a.mF[0], b.mF[0], k), lerp(a.mF[1], b.mF[1], k)] });
const ombro = (R, agacha, ar) => -(R.pe + R.coxa + R.canela + R.tronco) + 8 + agacha - ar;

// pouso: u = tempo desde o contato (s). o.A = quanto o joelho absorve (px), o.voo = o quanto o pano vinha levantado
export function pousa(u, R, o = {}) {
  const A = o.A ?? (R.coxa + R.canela) * 0.3, comp = u < 0.07 ? eOut(u / 0.07) : 1 - mola(u - 0.07, o.f ?? 1.6, 0.55), ag = Math.max(-4, A * comp);
  const eq = equilibrio(ag, R), sq = Math.exp(-Math.max(0, u) / 0.045);
  const m = mixM(maos(R, ombro(R, ag, 0), 'abre'), maos(R, ombro(R, ag, 0), o.maos || 'frente'), eOut(u / 0.12));
  return { agacha: ag, px: eq.px, lean: (o.lean0 || 0) + eq.lean, estica: 1 - 0.14 * sq, esticaY: 0, calcN: 0, calcF: 0, voo: (o.voo ?? 0.8) * Math.cos(u * 17) * Math.exp(-u / 0.16), ...(o.semMaos ? {} : m) };
}

// salto completo. u = tempo desde o começo (s). o: { H altura, T tempo no ar, dx distância, A agachada, tA antecipação }
// devolve a pose do instante + fase ('antecipa' | 'impulso' | 'ar' | 'pousa')
export function salta(u, R, o = {}) {
  const per = R.coxa + R.canela, A = o.A ?? per * 0.36, tA = o.tA ?? 0.22, tI = o.tI ?? 0.09, T = o.T ?? 0.62, H = o.H ?? per * 0.9, dx = o.dx ?? 0, lean0 = o.lean0 || 0;
  if (u < tA) {                                                          // antecipação: desce, braços vão pra trás
    const k = eIO(u / tA), ag = A * k, eq = equilibrio(ag, R);
    return { fase: 'antecipa', agacha: ag, px: eq.px, lean: lean0 + eq.lean, estica: 1 - 0.05 * k, esticaY: 0, ...mixM(maos(R, ombro(R, ag, 0), 'solto'), maos(R, ombro(R, ag, 0), 'tras'), k), x: 0, voo: 0.15 * k };
  }
  if (u < tA + tI) {                                                     // impulso: estica tudo, sai da ponta do pé, braços varrem pra cima
    const k = (u - tA) / tI, ag = A * (1 - eIn(k, 1.6)), eq = equilibrio(ag, R), ar = per * 0.08 * eIn(k, 3);
    return { fase: 'impulso', agacha: ag, ar, px: eq.px, lean: lean0 + eq.lean * (1 - k) - 0.06 * k, estica: 1 + 0.13 * eIn(k), esticaY: 0, calcN: 1.0 * eOut(k), calcF: 0.9 * eOut(k), ...mixM(maos(R, ombro(R, ag, ar), 'tras'), maos(R, ombro(R, ag, ar), 'cima'), eOut(k)), x: 0, voo: -0.35 * k };
  }
  const w = (u - tA - tI) / T;
  if (w < 1) {                                                           // no ar: parábola; estica subindo, encolhe no alto, abre os braços
    const ar0 = per * 0.08, ar = ar0 * (1 - w) + 4 * H * w * (1 - w), enc = Math.sin(Math.PI * cl(w * 1.15)) * 0.42 * per, vy = 1 - 2 * w;
    const pN = [-R.quadril * 0.3 - 0.12 * enc, -enc * (w < 0.85 ? 1 : (1 - w) / 0.15)], pF = [R.quadril * 0.4 + 0.18 * enc, -enc * 0.75 * (w < 0.85 ? 1 : (1 - w) / 0.15)];
    return { fase: 'ar', ar: Math.max(0, ar), lean: lean0 + 0.08 * Math.sin(Math.PI * w), estica: 1 + 0.1 * cl(vy) * (w < 0.5 ? 1 : 0) + 0.06 * cl(-vy - 0.6) / 0.4, esticaY: -(R.pe + per) * 0.5,
      calcN: lerp(1.0, 0.25, cl(w * 3)), calcF: lerp(0.9, 0.2, cl(w * 3)), pN, pF, ...mixM(maos(R, ombro(R, 0, ar), 'cima'), maos(R, ombro(R, 0, ar), 'abre'), eOut(w * 2.2)), x: dx * w, voo: cl(-vy * 0.9, -0.35, 0.9) };
  }
  return { fase: 'pousa', ...pousa(u - tA - tI - T, R, { A: o.Apouso ?? per * 0.32, lean0, voo: 0.9 }), x: dx };
}

// caminhada de perfil. u = tempo (s). o: { T período de 2 passos, passo comprimento, ergue altura do pé no balanço, lean0, vz }
// pé de apoio fica parado no mundo (desliza pra trás no referencial do boneco na mesma velocidade que o corpo anda);
// o calcanhar sai do chão no fim do apoio; o quadril desce no contato dos dois pés e sobe no meio do passo; braço oposto à perna
export function andaV1(u, R, o = {}) {   // v1 (15/11 manhã), guardada pra comparação
  const per = R.coxa + R.canela, T = o.T ?? 1.0, Ls = o.passo ?? per * 0.46, lift = o.ergue ?? per * 0.12, duty = 0.6, v = Ls / (duty * T), vz = o.vz ?? 0;
  const p = ((u / T) % 1 + 1) % 1, ag = per * (0.05 + 0.035 * (0.5 + 0.5 * Math.cos(4 * Math.PI * p))), lean = (o.lean0 ?? 0.05) + 0.015 * Math.cos(4 * Math.PI * p);
  const k = lerp(0.14, 1, vz), L = R.braco[0] + R.braco[1], pel = [0, -(per + R.pe) + ag], amp = o.bracos ?? 0.42;
  const pe = (ph, sg) => { ph = ((ph % 1) + 1) % 1; const bx = sg * (k * R.quadril / 2 + 10);
    if (ph < duty) { const s = ph / duty; return { p: [bx + Ls / 2 - Ls * s, 0], c: s > 0.72 ? 0.55 * (s - 0.72) / 0.28 : 0 }; }
    const s = (ph - duty) / (1 - duty); return { p: [bx - Ls / 2 + Ls * eIO(s), -lift * Math.sin(Math.PI * s)], c: 0.55 * (1 - eOut(s * 2.2)) }; };
  const mao = (sg, a) => { const om = add(pel, rot([sg * k * R.ombro / 2, -R.tronco + 8], lean)), d = L * (0.93 - 0.09 * Math.max(0, a / amp)); return add(om, [d * Math.sin(a), d * Math.cos(a)]); };
  const N = pe(p, -1), F = pe(p + 0.5, 1), aN = -amp * Math.cos(2 * Math.PI * p);
  return { agacha: ag, lean, pN: N.p, pF: F.p, calcN: N.c, calcF: F.c, mN: mao(-1, aN), mF: mao(1, -aN), x: v * u, v, bal: 0.22 * Math.sin(4 * Math.PI * p), voo: -0.1, vento: 0.5 };
}

// ---------- andar/correr v2 (método das 4 posições: contato, baixa, passagem, alta) — o = { ritmo: 0 anda .. 1 corre, exagero 0..1, quique 0..1, T, passo, vz, braco }
// pé de apoio: crava de CALCANHAR com a ponta erguida, assenta, rola e sai pela PONTA; o pé de balanço sai apontando pra baixo,
// sobe logo depois de passar (na corrida o calcanhar chuta pra trás) e chega esticado, ponta pra cima, pronto pro próximo contato.
// quadril: andando, mais baixo logo depois do contato (absorve) e mais alto na passagem; correndo, baixo no meio do apoio e alto no voo.
// tronco inclina mais correndo, ombro torce contra o quadril, braço oposto à perna com atraso (o braço "arrasta" atrás da perna).
const onda = (q, pico) => 0.5 + 0.5 * Math.cos(2 * Math.PI * (q - pico));
function tornoz(R, p, c) { const off = c > 0 ? R.peL : -(R.lw[2] / 2 + 4); return c ? add([p[0] + off, p[1]], rot([-off, -R.pe], c)) : [p[0], p[1] - R.pe]; }
// v5 (15/11, "snap"): toda curva do pé é C1 (sem quina de velocidade). saída da ponta com a velocidade do apoio (Hermite),
// subida em sin² (começa e termina devagar), calcanhar em smoothstep, alcance com limite macio (tanh) e o quadril
// travado pelo alcance passa por dilata+borra no tempo (nunca fica abaixo do necessário, mas sem degrau).
const sm = k => { k = cl(k); return k * k * (3 - 2 * k); }, sin2 = k => { const s = Math.sin(Math.PI * cl(k)); return s * s; };
const herm = (s, x0, x1, m0, m1) => { const s3 = s * s * s, s4 = s3 * s, s5 = s4 * s; return (1 - 10 * s3 + 15 * s4 - 6 * s5) * x0 + (s - 6 * s3 + 8 * s4 - 3 * s5) * m0 + (10 * s3 - 15 * s4 + 6 * s5) * x1 + (-4 * s3 + 7 * s4 - 3 * s5) * m1; };   // quíntica: aceleração zero nas pontas
function andaPar(R, o) {
  const e = cl(o.exagero ?? 0), c = cl(o.ritmo ?? 0), per = R.coxa + R.canela, vz = o.vz ?? 0, k = lerp(0.14, 1, vz);
  // agil (v7, 'cremoso/derretido'): cadência mais rápida, perna que vai rápido e espera, braço que bate e segura. 0 = v6
  const A7 = cl(o.agil ?? 1), T = o.T ?? lerp(1.0, 0.62, c) * (1 - 0.16 * A7), duty = lerp(0.6, 0.36, c), Ls = o.passo ?? per * lerp(0.48, 0.62, c) * (1 + e * lerp(0.05, 0.18, c));
  // quique = quanto o corpo sobe e desce (0..1, separado do exagero; 1 = v3 'bouncy' reprovado 15/11). padrão 0,3
  return { e, c, per, k, T, duty, A7, Ls, v: Ls / (duty * T), Q: cl(o.quique ?? 0.3), G: o.segue ?? 1, lim: per - 1.5, limA: per * 0.975 - 1.5 };   // limA: apoio nunca estica 100% (joelho macio)
}
function andaPes(u, R, P) {
  const { e, c, per, k, T, duty, Ls, Q, G, limA, A7 } = P, p = ((u / T) % 1 + 1) % 1, q = (p * 2) % 1;
  // segue (v6, 'o corpo não acompanha'): o quadril freia no contato e é empurrado na saída (px), sem mexer o pé plantado
  const px = -G * per * lerp(0.016, 0.032, c) * (1 + 0.5 * e) * Math.sin(2 * Math.PI * q);
  let ag = lerp(per * (0.012 + 0.042 * (1 + 0.9 * e) * Q * onda(q, 0.1)), per * (0.035 + Q * (0.13 * (1 + 0.5 * e) * onda(q, 0.18) - 0.09 * (1 + 1.1 * e) * onda(q, 0.68))), c);   // agacha > 0 = mais baixo
  const ch = lerp(-0.32, -0.08, c) * (1 + 0.4 * e), cmax = lerp(0.6, 0.85, c) * (1 + 0.3 * e), a0 = lerp(0.6, 0.45, c) * duty, pk = duty + 0.12 * (1 - duty), md = duty + 0.5 * (1 - duty);
  const calc = ph => ph < 0.2 * duty ? ch * (1 - sm(ph / (0.2 * duty))) : ph < a0 ? 0 : ph < pk ? cmax * sm((ph - a0) / (pk - a0))   // crava de calcanhar → chapa → rola → ponta
    : ph < md ? lerp(cmax, 0.15, sm((ph - pk) / (md - pk))) : lerp(0.15, ch, sm((ph - md) / (1 - md)));
  const pe = (ph, sg) => { ph = ((ph % 1) + 1) % 1; const bx = sg * (k * R.quadril / 2 + 8), cc = calc(ph);
    if (ph < duty) return { p: [bx + Ls / 2 - Ls * (ph / duty), 0], c: cc, apoio: true };
    const s = (ph - duty) / (1 - duty), m0 = -Ls * (1 - duty) / duty;                     // sai com a velocidade do apoio (pé parado no mundo)
    const aw = A7 * lerp(0.45, 0.55, c), sw = s + aw * s * (1 - s);                        // ágil: a perna dispara e chega cedo, depois espera o contato
    const x = herm(sw, bx - Ls / 2, bx + Ls / 2, m0 / (1 + aw), lerp(1, 0.5, c) * m0 / (1 - aw)) - per * 0.22 * c * (1 + 0.8 * e) * sin2(s / 0.6);   // corre: chuta pra trás antes de vir
    const y = -per * lerp(0.13, 0.42, c) * (1 + 0.25 * e) * sin2(1 - Math.pow(1 - s, lerp(1.5, 1.8, c))) * (1 - 0.2 * s) - per * 0.2 * e * c * sin2((s - 0.3) / 0.6);   // joelho alto vindo pra frente
    return { p: [x, Math.min(0, y)], c: cc, apoio: false, s }; };   // (x já tem o bx: antes somava 2× e o pé pulava 13 px na saída)
  const N = pe(p, -1), F = pe(p + 0.5, 1);
  for (const [f, sg] of [[N, -1], [F, 1]]) if (f.apoio) { const t = tornoz(R, f.p, f.c), h = [px + sg * k * R.quadril / 2, -(per + R.pe)], dx = t[0] - h[0]; ag = Math.max(ag, (t[1] - h[1]) - Math.sqrt(Math.max(0, limA * limA - dx * dx))); }
  return { p, q, ag, N, F, px };
}
export function anda(u, R, o = {}) {
  const P = andaPar(R, o), { e, c, per, k, T, duty, Ls, v, Q, lim } = P, L1 = R.braco[0], L2 = R.braco[1];
  // quadril: o mínimo exigido pelo alcance é dilatado (máx. na janela) e borrado (cos²) → contínuo e nunca abaixo do exigido
  const h = T / 120, W = Math.round(lerp(10, 5, P.A7)), raw = []; for (let j = -2 * W; j <= 2 * W; j++) raw.push(andaPes(u + j * h, R, P).ag);
  let sw = 0, sa = 0; for (let i = -W; i <= W; i++) { let mx = -1e9; for (let j = i - W; j <= i + W; j++) mx = Math.max(mx, raw[j + 2 * W]); const w = Math.cos(Math.PI * i / (2 * W + 2)) ** 2; sw += w; sa += w * mx; }
  const S = andaPes(u, R, P), { p, q, N, F, px } = S, ag = sa / sw, G = P.G;
  const lean = (o.lean0 ?? lerp(0.05, 0.2, c) + e * lerp(0.03, 0.2, c)) + lerp(0.012, 0.035, c) * (1 + e) * onda(q, 0.12) + G * lerp(0.03, 0.06, c) * (1 + 0.5 * e) * Math.cos(2 * Math.PI * (q - 0.14)), torce = lerp(0.5, 1.2, c) * (1 + 0.5 * e) * Math.cos(2 * Math.PI * p);
  // pé no ar: puxado pra dentro com limite macio (perna quase reta encosta devagar, sem estalo de joelho)
  const ds = lim - per * 0.08;
  for (const [f, sg] of [[N, -1], [F, 1]]) if (!f.apoio) { const t = tornoz(R, f.p, f.c), hp = [px + sg * k * R.quadril / 2, -(per + R.pe) + ag], d = dist(t, hp);
    if (d > ds) { const w = sm(f.s / 0.15) * sm((1 - f.s) / 0.15), nd = d + w * (ds + (lim - ds) * Math.tanh((d - ds) / (lim - ds)) - d), nt = add(hp, [(t[0] - hp[0]) * nd / d, (t[1] - hp[1]) * nd / d]); f.p = add(f.p, sub(nt, t)); f.p[1] = Math.min(0, f.p[1]); } }
  // braços: ângulo do braço (frente > 0) e dobra do cotovelo (antebraço vai pra frente)
  const pel = [px, -(per + R.pe) + ag], A = o.braco ?? lerp(0.38, 0.8, c) * (1 + lerp(0.5, 0.12, c) * e) * (1 - 0.1 * P.A7);   // ágil segura mais na ponta: amplitude um pouco menor pra mão não parar na cara
  const brac = (sg, a) => { const om = add(pel, rot([sg * k * R.ombro / 2 + torce * sg * 8, -R.tronco + 8], lean)), th = a + lean * 0.4, b = lerp(0.22, 1.55, c) + lerp(0.4, 0.35 - 0.2 * e, c) * sm(0.5 + 0.5 * a / A);   // mão da frente para no queixo, não na cara
    const ec = add(om, [L1 * Math.sin(th), L1 * Math.cos(th)]), m = add(ec, [L2 * Math.sin(th + b), L2 * Math.cos(th + b)]); return { m, e: ec }; };
  const kb = 0.01 + 2.4 * P.A7, aN = -A * Math.tanh(kb * Math.cos(2 * Math.PI * (p - lerp(0.06, 0.03, c)))) / Math.tanh(kb), bN = brac(-1, aN), bF = brac(1, -aN);
  return { agacha: ag, px, lean, torce, pN: N.p, pF: F.p, calcN: N.c, calcF: F.c, mN: bN.m, eN: bN.e, mF: bF.m, eF: bF.e, cabT: (1 - G) * -lerp(0.01, 0.04, c) * (1 + e) * Q * onda(q, 0.2) + G * lerp(0.05, 0.09, c) * (1 + 0.5 * e) * Math.cos(2 * Math.PI * (q - 0.26)) + 0.06 * e * c,   // cabeça balança depois do tronco (atraso) estica: 1 + e * Q * lerp(0.025 * (onda(q, 0.5) - onda(q, 0.1)), 0.07 * onda(q, 0.86) - 0.08 * onda(q, 0.2), c), esticaY: 0,
    x: v * u, v, bal: lerp(0.2, 0.35, c) * (1 + 0.6 * e) * Math.sin(4 * Math.PI * p), voo: lerp(-0.08, -0.22, c) * (1 + 0.5 * e), vento: lerp(0.45, 1.0, c) * (1 + 0.6 * e), fase: p, Ls, T, duty };
}
