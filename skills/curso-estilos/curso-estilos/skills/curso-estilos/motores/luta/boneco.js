// boneco.js — bonecos 2D articulados (recorte vetorial): membros em cápsula, luz de recorte por peça,
// trama de tecido, rosto desenhado. Origem do boneco = chão entre os pés; "frente" = +x (dir = -1 espelha).
export const TAU = Math.PI * 2;
export const lerp = (a, b, k) => a + (b - a) * k, cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
export const rot = (v, t) => [v[0] * Math.cos(t) - v[1] * Math.sin(t), v[0] * Math.sin(t) + v[1] * Math.cos(t)];
export const lv = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)], dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// ---------- cor: toda cor passa pelo ambiente da cena (noite azul, visão do General, clarão...)
let AMB = { m: [1, 1, 1], a: [0, 0, 0] }; const cache = new Map();
export function setAmb(m, a = [0, 0, 0]) { AMB = { m, a }; cache.clear(); }
const h2 = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
export function C(h, dk = 0) {
  const key = h + '|' + dk; let v = cache.get(key); if (v) return v;
  const c = h2(h), k = 1 - dk * 0.42, s = [0.9, 0.96, 1.12];           // sombra puxa pro azul
  v = 'rgb(' + c.map((x, i) => Math.round(cl((x * AMB.m[i] + AMB.a[i]) * (dk ? k * s[i] : 1), 0, 255))).join(',') + ')';
  cache.set(key, v); return v;
}
// ---------- luz de recorte e trama
export const LUZ = { x: -0.78, y: -0.62, cor: '#a9d2f2', w: 2.6 };
export function setLuz(o) { Object.assign(LUZ, o); }
let FL = 1, TRAMA = null;
function trama(g) {
  if (TRAMA) return TRAMA; const c = document.createElement('canvas'); c.width = c.height = 7; const x = c.getContext('2d');
  x.strokeStyle = 'rgba(0,0,0,0.9)'; x.lineWidth = 1; x.beginPath(); x.moveTo(0, 7); x.lineTo(7, 0); x.moveTo(-1, 1); x.lineTo(1, -1); x.moveTo(6, 8); x.lineTo(8, 6); x.stroke();
  x.strokeStyle = 'rgba(255,255,255,0.5)'; x.beginPath(); x.moveTo(0, 0); x.lineTo(7, 7); x.stroke();
  return TRAMA = g.createPattern(c, 'repeat');
}
// forma: preenche um caminho com cor + fio de luz no lado iluminado + trama
export function forma(g, path, cor, o = {}) {
  const rw = o.rw ?? LUZ.w, rim = o.rim === false ? null : (o.rim || LUZ.cor);
  g.save(); path(g);
  if (rim && rw > 0) { g.fillStyle = rim; g.fill(); g.clip(); g.translate(-LUZ.x * rw * FL, -LUZ.y * rw); path(g); }
  g.fillStyle = cor; g.fill();
  if (o.tex !== 0) { g.globalAlpha = o.tex ?? 0.07; g.fillStyle = trama(g); g.fill(); g.globalAlpha = 1; }
  g.restore();
  if (o.linha) { path(g); g.strokeStyle = o.linha; g.lineWidth = o.lw || 1.6; g.lineJoin = 'round'; g.stroke(); }
}
export const cap = (a, b, r1, r2 = r1) => (g, cont) => { const an = Math.atan2(b[1] - a[1], b[0] - a[0]); if (!cont) g.beginPath(); g.moveTo(a[0] + Math.cos(an + Math.PI / 2) * r1, a[1] + Math.sin(an + Math.PI / 2) * r1); g.arc(a[0], a[1], r1, an + Math.PI / 2, an - Math.PI / 2); g.arc(b[0], b[1], r2, an - Math.PI / 2, an + Math.PI / 2); g.closePath(); };
export const poli = (pts, fech = true) => g => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if (fech) g.closePath(); };
export const uni = (...ps) => g => { g.beginPath(); for (const p of ps) p(g, true); };
export const elip = (c, rx, ry, an = 0) => (g, cont) => { if (!cont) g.beginPath(); g.moveTo(c[0] + Math.cos(an) * rx, c[1] + Math.sin(an) * rx); g.ellipse(c[0], c[1], rx, ry, an, 0, TAU); };
export function traco(g, pts, cor, w, o = {}) { g.save(); g.strokeStyle = cor; g.lineWidth = w; g.lineCap = o.cap || 'round'; g.lineJoin = 'round'; if (o.dash) g.setLineDash(o.dash); g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); g.restore(); }
export function ik(s, h, l1, l2, sg) {
  const dx = h[0] - s[0], dy = h[1] - s[1], d0 = Math.hypot(dx, dy) || 1, d = cl(d0, Math.abs(l1 - l2) + 0.5, l1 + l2 - 0.5), a = Math.atan2(dy, dx), b = Math.acos(cl((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  return { j: [s[0] + Math.cos(a + sg * b) * l1, s[1] + Math.sin(a + sg * b) * l1], h: [s[0] + dx / d0 * d, s[1] + dy / d0 * d] };
}
const VZ = { l: 0, q: 0.5, f: 1, b: 1 };

// ---------- esqueleto: devolve todas as juntas em coordenadas locais
export function esq(R, P) {
  const vz = P.vz ?? VZ[P.vista || 'q'], k = lerp(0.14, 1, vz), lean = P.lean || 0;
  const pel = [P.px || 0, -(R.coxa + R.canela + R.pe) + (P.agacha || 0) - (P.ar || 0)];
  const T = v => add(pel, rot(v, lean));
  const peito = T([0, -R.tronco]), pesc = T([0, -R.tronco - R.pesc]), cab = add(pesc, rot([0, -R.cabR * 0.86], lean + (P.cabT || 0)));
  const S = { vz, k, lean, pel, peito, pesc, cab, T, R };
  for (const [n, sg] of [['N', -1], ['F', 1]]) {
    const om = T([sg * k * R.ombro / 2 + (P.torce || 0) * sg * 8, -R.tronco + 8]), qd = add(pel, [sg * k * R.quadril / 2, 0]);
    const mao = P['m' + n] || add(om, [sg * (vz > 0.8 ? 14 : 4), R.braco[0] + R.braco[1] - 6]);
    const pe = P['p' + n] || [sg * k * R.quadril / 2 + (vz < 0.8 ? sg * 10 : 0), 0];
    // dobra padrão (sinal do ik): de perfil, joelho pra frente (-1) e cotovelo pra trás (+1); de frente/costas, os dois pra fora (-sg)
    const fr = vz > 0.8, dJ = fr ? -sg : -1, dC = fr ? -sg : 1;
    // e* = cotovelo-guia: o ik escolhe o lado mais perto dele; o escorço que a guia pede vale (braço até 55%, antebraço até 35%), esticar nunca
    const eh = P['e' + n]; let l1 = eh ? R.braco[0] * cl(dist(om, eh) / R.braco[0], 0.55, 1) : R.braco[0], l2 = eh ? R.braco[1] * cl(dist(eh, mao) / R.braco[1], 0.35, 1) : R.braco[1];
    const falta = dist(om, mao) + 1 - l1 - l2; if (falta > 0) { const d2 = Math.min(falta, R.braco[1] - l2); l2 += d2; l1 = Math.min(R.braco[0], l1 + falta - d2); }   // o escorço nunca impede a mão de chegar
    const a1 = ik(om, mao, l1, l2, eh ? 1 : (P['cot' + n] ?? dC)), a2 = eh ? ik(om, mao, l1, l2, -1) : a1;
    const a = eh && dist(a2.j, eh) < dist(a1.j, eh) ? a2 : a1, ca = vz < 0.8 ? (P['calc' + n] || 0) : 0, flp = ca > 0 ? (R.peL || 40) : -(R.lw[2] / 2 + 4), vt = rot([-flp, -R.pe], ca), torn = ca ? add([pe[0] + flp, pe[1] - (P.ar || 0)], vt) : [pe[0], pe[1] - R.pe - (P.ar || 0)], l = ik(qd, torn, R.coxa, R.canela, P['joe' + n] ?? dJ);
    S['om' + n] = om; S['cot' + n] = a.j; S['m' + n] = a.h; S['qd' + n] = qd; S['joe' + n] = l.j; S['torn' + n] = l.h; const tp = sub(l.h, vt); S['calc' + n] = ca; S['ponta' + n] = tp; S['pe' + n] = ca ? [tp[0] - flp, tp[1]] : [l.h[0], l.h[1] + R.pe];   // calc > 0 = calcanhar erguido (pé gira na ponta); calc < 0 = ponta erguida (pé gira no calcanhar, contato de calcanhar)
    S['alvoM' + n] = mao; S['alvoT' + n] = torn; S['eFixo' + n] = !!P['e' + n];
  }
  return S;
}
// ---------- pano × chão: ponto de pano que passaria do chão deita nele e escorrega pra fora do corpo (dobra), em vez de atravessar
let CHAO = null;                                                         // { M, Mi, g0, px }: referencial do boneco sem giro, chão em y = g0
export function chaoCtx(g) {
  if (!CHAO) return g;
  const m = g.getTransform(), mi = m.inverse(), { M, Mi, g0, px } = CHAO, lim = g0 - 1.5;
  const f = (x, y) => { const l = Mi.transformPoint(m.transformPoint({ x, y })); if (l.y <= lim) return [x, y];
    const ov = l.y - lim, sx = Math.sign(l.x - px) || 1, r = mi.transformPoint(M.transformPoint({ x: l.x + sx * ov * 0.85, y: lim - Math.min(ov * 0.05, 4) })); return [r.x, r.y]; };
  return new Proxy(g, { get(t, k) {
    if (k === 'moveTo' || k === 'lineTo') return (x, y) => t[k](...f(x, y));
    if (k === 'quadraticCurveTo') return (a, b, x, y) => t.quadraticCurveTo(...f(a, b), ...f(x, y));
    if (k === 'bezierCurveTo') return (a, b, c, d, x, y) => t.bezierCurveTo(...f(a, b), ...f(c, d), ...f(x, y));
    const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; }, set(t, k, v) { t[k] = v; return true; } });
}
export const noChao = path => (g, cont) => path(chaoCtx(g), cont);

// ---------- trava das articulações: devolve a lista de problemas de um boneco já resolvido (coordenadas locais, frente = +x)
// ladoDe(s,h,j) = distância com sinal da junta j à reta s→h (positivo = lado horário na tela)
const ladoDe = (s, h, j) => { const dx = h[0] - s[0], dy = h[1] - s[1], d = Math.hypot(dx, dy) || 1; return (dx * (j[1] - s[1]) - dy * (j[0] - s[0])) / d; };
export function checaJuntas(R, P, S, tol = 3) {
  const out = [], fr = S.vz > 0.8, Lb = R.braco[0] + R.braco[1], Lp = R.coxa + R.canela, desv = v => rot(v, -S.lean);
  for (const n of ['N', 'F']) {
    const fora = n === 'N' ? 1 : -1;                                     // sinal de "pra fora" quando o membro desce (vista de frente)
    // perna: o joelho fica sempre do lado da frente da reta quadril–tornozelo
    const qd = S['qd' + n], jo = S['joe' + n], to = S['torn' + n], cj = ladoDe(qd, to, jo);
    if (!fr && cj > tol) out.push({ tipo: 'joelho pra trás', m: n, px: cj });
    if (fr && cj * fora < -tol) out.push({ tipo: 'joelho pra dentro', m: n, px: -cj * fora });
    const dp = dist(S['alvoT' + n], to); if (dp > 4) out.push({ tipo: dist(qd, S['alvoT' + n]) > Lp - 1 ? 'pé fora do alcance' : 'pé perto demais', m: n, px: dp });
    // braço: medido no referencial do tronco (desfaz o lean). De perfil, qualquer mão abaixo do ombro; em 3/4 o braço pode abrir pro lado, então só o braço solto
    const om = S['om' + n], co = S['cot' + n], m = S['m' + n], vm = desv(sub(m, om)), vc = desv(sub(co, om)), cc = ladoDe([0, 0], vm, vc), solto = vm[1] > 0.45 * Lb && vc[1] < vm[1];   // solto = mão bem abaixo do ombro e cotovelo acima dela (antebraço erguido não é braço solto)
    if (!fr && (S.vz < 0.3 ? vm[1] > 10 : solto) && cc < -tol) out.push({ tipo: solto ? 'cotovelo pra frente (braço solto)' : 'cotovelo pra frente', m: n, px: -cc });
    if (fr && solto && cc * fora < -tol) out.push({ tipo: 'cotovelo pra dentro', m: n, px: -cc * fora });
    const dm = dist(S['alvoM' + n], m); if (dm > 4) out.push({ tipo: dist(om, S['alvoM' + n]) > dist(om, co) + dist(co, m) - 1 ? 'mão fora do alcance' : 'mão perto demais', m: n, px: dm });
    const k1 = dist(om, co) / R.braco[0], k2 = dist(co, m) / R.braco[1]; if (k1 > 1.02 || k2 > 1.02 || k1 < 0.54 || k2 < 0.34) out.push({ tipo: 'braço com tamanho errado', m: n, px: Math.round((Math.max(k1, k2) - 1) * 100) });
  }
  return out;
}

// interpola duas poses (números e pares); o resto vem de `b` quando k >= 0.5
export function mix(a, b, k) {
  const o = {}; for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) { const x = a[key], y = b[key];
    if (typeof x === 'number' && typeof y === 'number') o[key] = lerp(x, y, k);
    else if (Array.isArray(x) && Array.isArray(y) && typeof x[0] === 'number') o[key] = x.map((v, i) => lerp(v, y[i], k));
    else o[key] = k < 0.5 ? (x ?? y) : (y ?? x); }
  return o;
}

// ---------- peças comuns
export function perna(g, S, n, o) {
  const R = S.R, dk = n === 'F' && S.vz < 0.8 ? (o.dk ?? 0.55) : 0, qd = S['qd' + n], jo = S['joe' + n], to = S['torn' + n], pe = S['pe' + n], w = R.lw;
  if (dk) o = { ...o, rim: false };
  forma(g, uni(cap(qd, jo, w[0] / 2, w[1] / 2), cap(jo, to, w[1] / 2, w[2] / 2)), C(o.coxa, dk), o);
  const bh = o.botaH ?? 0.5, top = lv(to, jo, bh), fl = S.vz > 0.8 ? 12 : (R.peL || 40), bw = w[2] / 2 + 2, ph = R.pe;
  const ca = S['calc' + n] || 0, tp = S['ponta' + n], roda = fn => { if (!ca) return fn(); g.save(); g.translate(tp[0], tp[1]); g.rotate(ca); g.translate(-tp[0], -tp[1]); fn(); g.restore(); };
  roda(() => forma(g, gg => { gg.beginPath(); gg.moveTo(pe[0] - bw - 2, pe[1]); gg.lineTo(pe[0] + fl, pe[1]); gg.quadraticCurveTo(pe[0] + fl + 13, pe[1] - ph * 0.45, pe[0] + fl - 6, pe[1] - ph * 0.7); gg.lineTo(pe[0] + bw * 0.8, pe[1] - ph - 6); gg.lineTo(pe[0] - bw - 2, pe[1] - ph - 6); gg.closePath(); }, C(o.bota, dk), o));
  forma(g, cap(top, to, bw + 1, bw), C(o.bota, dk), o);
  if (o.punho) traco(g, [lv(top, jo, 0.05), lv(top, to, 0.14)], C(o.punho, dk), (bw + 3.5) * 2, { cap: 'butt' });
  if (o.sola) roda(() => traco(g, [[pe[0] - bw - 2, pe[1] - 2], [pe[0] + fl + 4, pe[1] - 2]], C(o.sola, dk), 5, { cap: 'butt' }));
  o.extra?.(g, { qd, jo, to, pe, top, dk });
}
export function mao(g, p, an, o) {
  const s = o.s || 1, dk = o.dk || 0;
  g.save(); g.translate(p[0], p[1]); g.rotate(an);
  if (o.aberta) {
    forma(g, gg => { gg.beginPath(); gg.roundRect(-10 * s, -15 * s, 26 * s, 30 * s, 9 * s); }, C(o.cor, dk), o);
    for (let i = 0; i < 4; i++) { const y = (-12 + i * 8) * s, c = (o.curva ?? 0.2) * (1 + i * 0.12); forma(g, cap([14 * s, y], [14 * s + Math.cos(c) * 24 * s, y + Math.sin(c) * 24 * s - (i === 0 ? 0 : 0)], 4.2 * s, 3.4 * s), C(o.cor, dk), { ...o, tex: 0 }); }
    forma(g, cap([2 * s, -14 * s], [14 * s, -26 * s], 4.6 * s, 3.6 * s), C(o.cor, dk), { ...o, tex: 0 });
  } else {
    forma(g, gg => { gg.beginPath(); gg.roundRect(-13 * s, -15 * s, 31 * s, 30 * s, 10 * s); }, C(o.cor, dk), o);
    g.strokeStyle = C(o.dobra || '#3a2416', dk); g.globalAlpha = 0.5; g.lineWidth = 1.8 * s; g.lineCap = 'round';
    for (const y of [-7, 0, 7]) { g.beginPath(); g.moveTo(3 * s, y * s); g.lineTo(16 * s, y * s); g.stroke(); }
  }
  g.restore();
}
export function braco(g, S, n, o) {
  const R = S.R, dk = (o.dk ?? (n === 'F' && S.vz < 0.8 ? 0.55 : 0)), om = S['om' + n], co = S['cot' + n], m = S['m' + n], w = R.bw, an = Math.atan2(m[1] - co[1], m[0] - co[0]);
  if (dk) o = { ...o, rim: false };
  forma(g, uni(cap(om, co, w[0] / 2, w[1] / 2), cap(co, m, w[1] / 2, w[2] / 2)), C(o.baixo, dk), o);
  if (o.manga) { const fim = o.manga > 1 ? lv(co, m, o.manga - 1) : lv(om, co, o.manga); forma(g, o.manga > 1 ? uni(cap(om, co, w[0] / 2 + 2, w[1] / 2 + 2), cap(co, fim, w[1] / 2 + 2, w[1] / 2 + 2)) : cap(om, fim, w[0] / 2 + 2, w[0] / 2 + 3), C(o.mangaCor, dk), o); }
  if (o.bracal) forma(g, cap(lv(co, m, 0.34), lv(co, m, 0.84), w[1] / 2 + 2, w[2] / 2 + 2), C(o.bracal, dk), { ...o, rw: 1.6 });
  o.extra?.(g, { om, co, m, an, dk });
  if (o.mao !== false) mao(g, m, o.maoAn ?? an, { cor: o.pele, dk, s: R.maoS || 1, aberta: o.aberta, curva: o.curva, dobra: o.dobra });
}
export function sombraChao(g, w, a = 0.45) { g.save(); g.fillStyle = `rgba(2,6,14,${a})`; g.beginPath(); g.ellipse(0, 4, w, w * 0.14, 0, 0, TAU); g.fill(); g.restore(); }

// arco: punho na mão `p`, mirando no ângulo `an`; `puxa` (0..1) leva a corda até `maoCorda`
export function arco(g, p, an, o = {}) {
  const L = o.L || 150, pux = o.puxa || 0, dk = o.dk || 0, flex = 1 - pux * 0.16;
  g.save(); g.translate(p[0], p[1]); g.rotate(an);
  const tip1 = [-34 - pux * 26, -L * flex], tip2 = [-34 - pux * 26, L * flex];
  for (const [tp, sg] of [[tip1, -1], [tip2, 1]]) { g.beginPath(); g.moveTo(0, sg * 14); g.bezierCurveTo(26, sg * L * 0.36, -8, sg * L * 0.72, tp[0], tp[1]); g.strokeStyle = C(o.cor || '#7a4a26', dk); g.lineWidth = o.w || 9; g.lineCap = 'round'; g.stroke();
    g.strokeStyle = LUZ.cor; g.globalAlpha = 0.55; g.lineWidth = 1.6; g.beginPath(); g.moveTo(3, sg * 14); g.bezierCurveTo(29, sg * L * 0.36, -5, sg * L * 0.72, tp[0] + 3, tp[1]); g.stroke(); g.globalAlpha = 1;
    if (o.ouro) { g.strokeStyle = C(o.ouro, dk); g.lineWidth = 3; g.beginPath(); g.moveTo(tp[0], tp[1]); g.lineTo(tp[0] - 12, tp[1] + sg * 4); g.stroke(); } }
  forma(g, cap([0, -16], [0, 16], 7), C(o.punho || '#3a2416', dk), { tex: 0 });
  const mc = o.cordaEm ? rot(sub(o.cordaEm, p), -an) : [tip1[0], 0];
  g.strokeStyle = C(o.corda || '#e8e2cc', dk); g.lineWidth = 2; g.beginPath(); g.moveTo(tip1[0], tip1[1]); g.lineTo(mc[0], mc[1]); g.lineTo(tip2[0], tip2[1]); g.stroke();
  if (o.flecha) flecha(g, [mc[0], mc[1]], 0, { ...o.flecha, dk });
  g.restore();
}
export function flecha(g, p, an, o = {}) {
  const L = o.L || 190, dk = o.dk || 0; g.save(); g.translate(p[0], p[1]); g.rotate(an);
  if (o.brilho) { g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createLinearGradient(0, 0, L, 0); gr.addColorStop(0, 'rgba(160,220,255,0)'); gr.addColorStop(1, `rgba(190,235,255,${0.8 * o.brilho})`); g.strokeStyle = gr; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(L, 0); g.stroke(); g.restore(); }
  traco(g, [[0, 0], [L, 0]], C(o.haste || '#c9a878', dk), 4, { cap: 'butt' });
  forma(g, poli([[L - 4, -7], [L + 20, 0], [L - 4, 7]]), C(o.ponta || '#c8d2dc', dk), { tex: 0, rw: 1.5 });
  for (const s of [-1, 1]) forma(g, poli([[2, 0], [10, s * 9], [34, s * 9], [42, 0]]), C(o.pena || '#e9e4d2', dk), { tex: 0, rw: 1.2 });
  g.restore();
}

// ---------- vida no rosto: relógio da cena, quem está falando (boca) e piscar determinístico por personagem
export const RELOGIO = { t: null }, FALA = {};                           // FALA[nome] = { k: abertura 0..1, v: vogal 'a'|'e'|'i'|'o' }
let QUEM = null;
const hashNome = n => { let h = 7; for (const c of n || '') h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
export function piscando(nome, t) { if (t == null || !nome) return false; const h = hashNome(nome), per = 3.1 + (h % 9) * 0.22, x = (t + (h % 97) / 97 * per) % per; return x < 0.1 || (h % 3 === 0 && x > 0.22 && x < 0.31); }
// boca a partir do texto da fala: sílabas pelo número de vogais, fecha nas pausas, forma pela próxima vogal
export function bocaDaFala(txt, t0, d, t) {
  const u = (t - t0) / d; if (u < 0 || u >= 1) return null;
  const i = Math.floor(u * txt.length), sil = Math.max(1, (txt.match(/[aeiouáéíóúâêôãõ]/gi) || []).length), k = Math.pow(Math.abs(Math.sin(Math.PI * (t - t0) * sil / d)), 0.7), pausa = /[ ,.?!…]/.test(txt[i]) ? 0.2 : 1;
  let v = 'a'; for (let j = i; j < Math.min(txt.length, i + 4); j++) { const c = txt[j].toLowerCase(); if ('aáâã'.includes(c)) { v = 'a'; break; } if ('eéê'.includes(c)) { v = 'e'; break; } if ('ií'.includes(c)) { v = 'i'; break; } if ('oóôõuú'.includes(c)) { v = 'o'; break; } }
  return { k: k * pausa * Math.min(1, u * 12, (1 - u) * 12), v };
}

// ---------- rosto de pontinho (padrão da série): olhos de ponto, sobrancelha de traço, boca de linha
export function rosto(g, c, r, vz, o) {
  const ex = o.expr || 'neutro', lk = o.olha || [0, 0], xN = r * lerp(0.56, -0.3, vz) + lk[0], xF = r * lerp(0.98, 0.3, vz) + lk[0], ey = -r * 0.02 + lk[1], er = r * (o.olhoR || 0.085);
  const E = { neutro: [0, 0, 1], bravo: [0.34, 2, 0.95], firme: [0.2, 1, 1], susto: [-0.25, -7, 1.45], dor: [0.3, 3, 0.9], triste: [-0.3, -1, 1], medo: [-0.32, -5, 1.25] }[ex] || [0, 0, 1];
  const olhos = vz > 0.2 ? [[xN, 1], [xF, -1]] : [[xN + r * 0.06, 1]], fecha = ex !== 'dor' && ex !== 'susto' && piscando(QUEM, RELOGIO.t);
  for (const [x, sg] of olhos) {
    if (fecha) { g.save(); g.strokeStyle = o.tinta; g.lineWidth = r * 0.05; g.lineCap = 'round'; g.beginPath(); g.arc(c[0] + x, c[1] + ey - er * 1.1, er * 1.7, Math.PI * 0.22, Math.PI * 0.78); g.stroke(); g.restore(); }
    else if (o.iris) { g.fillStyle = '#f6f2e6'; g.beginPath(); g.ellipse(c[0] + x, c[1] + ey, er * 1.9, er * 1.5 * E[2], 0, 0, TAU); g.fill(); g.save(); g.shadowColor = o.iris; g.shadowBlur = 14; g.fillStyle = o.iris; g.beginPath(); g.arc(c[0] + x + lk[0] * 0.3, c[1] + ey, er * 1.15, 0, TAU); g.fill(); g.restore(); g.fillStyle = '#2a1608'; g.beginPath(); g.arc(c[0] + x + lk[0] * 0.3, c[1] + ey, er * 0.45, 0, TAU); g.fill(); }
    else if (ex === 'dor') traco(g, [[c[0] + x - sg * er * 1.6, c[1] + ey - er * 1.3], [c[0] + x + sg * er * 1.2, c[1] + ey], [c[0] + x - sg * er * 1.6, c[1] + ey + er * 1.3]], o.tinta, r * 0.05);
    else { g.fillStyle = o.tinta; g.beginPath(); g.ellipse(c[0] + x, c[1] + ey, er * E[2], er * 1.22 * E[2], 0, 0, TAU); g.fill(); if (E[2] > 1.2) { g.fillStyle = '#fff'; g.beginPath(); g.arc(c[0] + x + er * 0.4, c[1] + ey - er * 0.5, er * 0.36, 0, TAU); g.fill(); } }
    const by = ey - r * 0.2 + E[1], inc = E[0] * r * 0.18;                 // sobrancelha: ponta de dentro desce quando bravo
    const dentro = vz > 0.8 ? -sg : 1, a = [c[0] + x - dentro * r * 0.15, c[1] + by - inc], b = [c[0] + x + dentro * r * 0.15, c[1] + by + inc];
    traco(g, [a, b], o.sobr || o.tinta, r * 0.075);
  }
  const mx = c[0] + r * lerp(0.56, 0, vz) + lk[0] * 0.6, my = c[1] + r * 0.4 + lk[1] * 0.5, mw = r * 0.15;
  g.save(); g.strokeStyle = o.tinta; g.fillStyle = o.tinta; g.lineWidth = r * 0.055; g.lineCap = 'round'; g.beginPath();
  const fala = FALA[QUEM];
  if (fala && fala.k > 0.05) { const w = mw * { a: 0.85, e: 0.95, i: 1.05, o: 0.55 }[fala.v], h = mw * (0.22 + (fala.v === 'i' ? 0.45 : 1.0) * fala.k); g.ellipse(mx, my + 2, w, h, 0, 0, TAU); g.fill(); if (h > mw * 0.5) { g.fillStyle = '#8a3a30'; g.beginPath(); g.ellipse(mx, my + 2 + h * 0.45, w * 0.6, h * 0.35, 0, 0, TAU); g.fill(); } }
  else if (ex === 'susto' || ex === 'medo') { g.ellipse(mx, my + 2, mw * 0.55, mw * (ex === 'susto' ? 0.8 : 0.5), 0, 0, TAU); g.fill(); }
  else if (ex === 'grita') { g.ellipse(mx, my + 3, mw * 0.95, mw * 1.05, 0, 0, TAU); g.fill(); }
  else if (ex === 'bravo' || ex === 'dor' || ex === 'triste') { g.arc(mx, my + mw * 0.9, mw, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); }
  else if (ex === 'firme') { g.moveTo(mx - mw, my); g.lineTo(mx + mw, my); g.stroke(); }
  else { g.arc(mx, my - mw * 0.7, mw, Math.PI * 0.25, Math.PI * 0.75); g.stroke(); }
  g.restore();
}

// =====================================================================================
// NICO — menino arqueiro: túnica verde de capuz, cachecol amarelo, aljava, botas
export const NICO = {
  nome: 'nico',
  R: { cabR: 76, pesc: 8, tronco: 146, ombro: 118, quadril: 66, braco: [84, 80], bw: [30, 27, 24], coxa: 98, canela: 92, pe: 26, peL: 34, lw: [44, 38, 32], maoS: 0.96 },
  P: { pele: '#e3a06a', pele2: '#c9824d', cabelo: '#4a2f22', tunica: '#4d8a4a', tunica2: '#3b6f3c', cachecol: '#e0b040', calca: '#6b4a34', bota: '#7a4f30', couro: '#8a5a36', tinta: '#23160f', pena: '#e9e2cc' },
  desenha(g, S, P) {
    const R = S.R, c = this.P, vz = S.vz, costas = P.vista === 'b', k = S.k;
    const pernaO = n => ({ coxa: c.calca, bota: c.bota, botaH: 0.34, punho: c.couro, sola: '#3a2416' });
    const bracoO = n => ({ cima: c.pele, baixo: c.pele, pele: c.pele, manga: 0.5, mangaCor: c.tunica, bracal: n === 'N' || vz > 0.8 ? c.couro : null, aberta: P['aberta' + n], maoAn: P['maoAn' + n] });
    const aljava = () => { g.save(); const b = S.T([-(costas ? 0 : 1) * lerp(34, 10, vz) + (costas ? 26 : 0), -R.tronco * 0.55]); g.translate(b[0], b[1]); g.rotate(S.lean + (costas ? 0.32 : -0.34));
      for (let i = 0; i < 4; i++) { const x = -12 + i * 8; traco(g, [[x, -66], [x + (i - 1.5) * 3, -112 - (i % 2) * 8]], C('#c9a878', 0.3), 3); forma(g, poli([[x - 5 + (i - 1.5) * 3, -104 - (i % 2) * 8], [x + (i - 1.5) * 3, -128 - (i % 2) * 8], [x + 5 + (i - 1.5) * 3, -104 - (i % 2) * 8]]), C(c.pena, 0.15), { tex: 0, rw: 1.4 }); }
      forma(g, gg => { gg.beginPath(); gg.roundRect(-19, -72, 38, 128, 10); }, C(c.couro, costas ? 0 : 0.35)); traco(g, [[-19, -52], [19, -52]], C('#5a3a22', 0.3), 4, { cap: 'butt' }); g.restore(); };
    if (!costas) aljava();
    if (vz < 0.8) { braco(g, S, 'F', bracoO('F')); perna(g, S, 'F', pernaO()); }
    else { perna(g, S, 'F', pernaO()); perna(g, S, 'N', pernaO()); }
    // capuz caído nas costas
    if (!costas) forma(g, elip(S.T([-lerp(40, 0, vz), -R.tronco + 6]), lerp(40, 62, vz), 30, S.lean - 0.3 * (1 - vz)), C(c.tunica2, 0.25));
    // túnica
    const tw = lerp(0.72, 1, vz) * R.ombro / 2 + 10, bw = tw + 8, saia = 44;
    g.save(); g.translate(S.pel[0], S.pel[1]); g.rotate(S.lean);
    forma(g, noChao(gg => { gg.beginPath(); gg.moveTo(-tw, -R.tronco + 14); gg.quadraticCurveTo(-tw, -R.tronco - 2, -tw + 18, -R.tronco - 4); gg.lineTo(tw - 18, -R.tronco - 4); gg.quadraticCurveTo(tw, -R.tronco - 2, tw, -R.tronco + 14); gg.lineTo(bw, saia - 8); gg.quadraticCurveTo(bw, saia, bw - 10, saia); gg.lineTo(-bw + 10, saia); gg.quadraticCurveTo(-bw, saia, -bw, saia - 8); gg.closePath(); }), C(c.tunica));
    g.save(); g.globalAlpha = 0.22; g.fillStyle = '#04140c'; g.beginPath(); g.moveTo(tw * 0.3, -R.tronco); g.lineTo(tw, -R.tronco + 14); g.lineTo(bw, saia); g.lineTo(bw * 0.45, saia); g.closePath(); g.fill(); g.restore();
    traco(g, [[-bw + 8, saia - 9], [bw - 8, saia - 9]], C(c.tunica2), 2, { dash: [7, 6] }); traco(g, [[-tw * 0.5, -22], [-tw * 0.62, -64]], C(c.tunica2), 2); traco(g, [[tw * 0.1, 8], [tw * 0.16, 30]], C(c.tunica2), 2);
    forma(g, gg => { gg.beginPath(); gg.roundRect(-bw + 3, -12, bw * 2 - 6, 17, 6); }, C(c.couro)); forma(g, gg => { gg.beginPath(); gg.roundRect(lerp(8, -9, vz), -15, 18, 23, 4); }, C('#c8a04a'), { tex: 0 });
    if (!costas) traco(g, [[-tw + 6, -R.tronco + 4], [tw - 2, -18]], C(c.couro), 11, { cap: 'butt' }); else traco(g, [[tw - 6, -R.tronco + 4], [-tw + 2, -18]], C(c.couro), 11, { cap: 'butt' });
    g.restore();
    if (vz < 0.8) perna(g, S, 'N', pernaO());
    if (costas) aljava();
    // cachecol
    forma(g, elip(add(S.pesc, rot([lerp(6, 0, vz), 10], S.lean)), lerp(40, 52, vz), 22, S.lean), C(c.cachecol));
    if (!costas && vz < 0.8) forma(g, poli([add(S.pesc, [-34, 6]), add(S.pesc, [-64, 44 + (P.vento || 0) * 20]), add(S.pesc, [-40, 50 + (P.vento || 0) * 14]), add(S.pesc, [-18, 22])]), C(c.cachecol, 0.2));
    // cabeça
    const h = S.cab, r = R.cabR; g.save(); g.translate(h[0], h[1]); g.rotate(S.lean * 0.6 + (P.cabT || 0));
    if (!costas) { forma(g, elip([0, 0], r * 0.94, r), C(c.pele)); if (vz < 0.8) forma(g, elip([-r * lerp(0.3, 0.9, vz), r * 0.12], r * 0.15, r * 0.2), C(c.pele2), { tex: 0, rw: 1.5 }); else for (const s of [-1, 1]) forma(g, elip([s * r * 0.92, r * 0.12], r * 0.13, r * 0.2), C(c.pele2), { tex: 0, rw: 1.5 });
      rosto(g, [0, 0], r, vz, { expr: P.expr, olha: P.olha, tinta: C(c.tinta), sobr: C(c.cabelo) }); }
    else forma(g, elip([0, 0], r * 0.94, r), C(c.pele2));
    const hp = costas ? [[-1.02, 0.2], [-1.18, -0.2], [-0.98, -0.5], [-1.1, -0.86], [-0.6, -0.98], [-0.5, -1.3], [-0.1, -1.1], [0.2, -1.36], [0.5, -1.02], [0.9, -1.0], [0.96, -0.5], [1.2, -0.2], [1.0, 0.2], [1.08, 0.56], [0.6, 0.62], [0.3, 0.86], [0, 0.66], [-0.34, 0.88], [-0.62, 0.6], [-1.06, 0.56]]
      : vz > 0.8 ? [[-1.0, 0.1], [-1.16, -0.3], [-0.96, -0.56], [-1.04, -0.92], [-0.56, -1.0], [-0.42, -1.3], [-0.06, -1.1], [0.24, -1.38], [0.5, -1.04], [0.92, -1.0], [0.96, -0.56], [1.16, -0.3], [1.0, 0.1], [0.86, -0.34], [0.6, -0.56], [0.4, -0.3], [0.14, -0.6], [-0.12, -0.3], [-0.4, -0.6], [-0.62, -0.32], [-0.86, -0.4]]
      : [[0.94, -0.22], [1.0, -0.6], [0.72, -0.8], [0.92, -1.08], [0.38, -1.02], [0.34, -1.38], [-0.08, -1.1], [-0.52, -1.24], [-0.7, -0.88], [-1.14, -0.8], [-1.0, -0.34], [-1.24, 0.04], [-0.96, 0.2], [-1.04, 0.6], [-0.7, 0.5], [-0.42, 0.06], [-0.1, -0.2], [0.14, -0.52], [0.34, -0.24], [0.56, -0.56], [0.74, -0.26]];
    forma(g, poli(hp.map(p => [p[0] * r, p[1] * r])), C(c.cabelo), { rw: 3 });
    g.restore();
    if (vz < 0.8) braco(g, S, 'N', bracoO('N')); else { braco(g, S, 'F', bracoO('F')); braco(g, S, 'N', bracoO('N')); }
  },
};
export function boneco(g, ch, P) {
  const S = esq(ch.R, P), s = P.s || 1, dir = P.dir || 1;
  if (globalThis.TRAVA_LOG && P.alfa !== 0) for (const p of checaJuntas(ch.R, P, S)) globalThis.TRAVA_LOG.push({ q: ch.nome, vista: P.vista || 'q', ...p });
  g.save(); g.translate(P.x || 0, P.y || 0); if (P.sombra !== false) { g.save(); g.scale(s, s); sombraChao(g, ch.R.ombro * 0.75 * (1 - (P.ar || 0) / 400), 0.42 * (1 - (P.ar || 0) / 500)); g.restore(); }
  g.scale(dir * s, s); FL = dir; const ch0 = P.chao ?? (P.gira ? null : (P.y || 0)); if (ch0 != null) { const M = g.getTransform(); CHAO = { M, Mi: M.inverse(), g0: (ch0 - (P.y || 0)) / s, px: S.pel[0] }; }
  if (P.estica && P.estica !== 1) { const e = P.estica, ay = P.esticaY ?? 0; g.translate(0, ay); g.scale(1 / Math.sqrt(e), e); g.translate(0, -ay); }   // estica/achata com volume constante
  if (P.gira) { const cy = -(ch.R.pe + ch.R.coxa + ch.R.canela) + (P.agacha || 0); g.translate(0, cy); g.rotate(P.gira); g.translate(0, -cy); } if (P.alfa != null) g.globalAlpha *= P.alfa; P.atras?.(g, S); QUEM = P.quem ?? ch.nome; ch.desenha(g, S, P); QUEM = null; P.frente?.(g, S); FL = 1; CHAO = null; g.restore(); return S;
}
