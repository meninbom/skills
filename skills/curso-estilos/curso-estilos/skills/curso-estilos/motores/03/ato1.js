// Ato 1 · Não acerta
import { B, M, IARA, GENERAL, NICO, boneco, mix, lerp, cl, TAU, W, H, CH, st, eOut, eIO, eBack, rng, X, oN, oG, oI, NX, GX, IX, IAR, emp, resp,
  nicoMira, nicoPe, generalBase, iaraPresa, arcoDe, rastro, voo, buff, janelaErro, selo, texto } from './comum.js';
const tela = (cam, p) => [(p[0] - cam.x) * cam.z + W / 2 + (cam.sx || 0), (p[1] - cam.y) * cam.z + H / 2 + (cam.sy || 0)];
const silabas = (F, n1, n2) => { const a = F.u0, d = F.d, o = []; for (let i = 0; i < n1; i++) o.push(a + d * 0.42 * i / n1); for (let i = 0; i < n2; i++) o.push(a + d * 0.5 + d * 0.5 * i / n2); return o; };
const aneis = (u, sil, base = 0.12) => { let v = base; for (const s of sil) if (u >= s) v = Math.max(v, Math.exp(-(u - s) * 9)); return v; };

// a 3ª flecha (usada no plano e, congelada, no RAIO-X)
function cenaTerceira(t, u, cam, congela) {
  const tR = 0.5, sol = u >= tR, pux = sol ? 0 : eIO(cl(u / 0.4)), vib = sol ? Math.sin((u - tR) * 95) * Math.exp(-(u - tR) * 13) * 8 : 0;
  const ouve = sol ? eOut((u - tR - 0.05) / 0.05) : 0, sai = sol ? eOut((u - tR - 0.07) / 0.1, 2) : 0, dx = 96 * sai;                       // ele reage no estalo e já saiu quando a flecha chega
  M.cena(t, cam, { foco: 0, frenteBlur: 12, tinta: congela ? 'rgba(4,14,30,0.42)' : null }, g => {
    const P = nicoMira(pux, { expr: sol ? 'bravo' : 'firme', mN: sol ? [-12, oN - 16] : [lerp(110, 16, pux), oN - 10], abertaN: sol }); if (sol) P.eN = [-98, oN - 24]; P.frente = (gg, S) => arcoDe(gg, S, pux, { vib, flecha: !sol }); boneco(g, NICO, P);
    if (sol) { voo(g, t, t - (u - tR), 0.36, [NX + 250, CH + oN - 4], [GX + 420, CH + oG - 150], { len: 300 }); if (!congela) M.anelSom(g, t, t - (u - tR), [NX + 118, CH + oN - 4], { r: 760, dur: 0.3, n: 2, w: 6 }); }
    boneco(g, IARA, iaraPresa(t, { x: IX + dx, bal: -0.9 * sai * (1 - st(0.2, 0.7, u - tR)) }));
    boneco(g, GENERAL, generalBase({ x: GX + dx, lean: 0.1 * sai, cabT: 0.2 * ouve * (1 - st(0.3, 0.8, u - tR)), aneis: 0.12 + 0.85 * ouve * Math.exp(-(u - tR) * 2), t, bal: -0.6 * sai }));
    if (sol && !congela && u - tR < 0.3) { g.save(); g.globalAlpha = 0.35 * (1 - (u - tR) / 0.3); boneco(g, GENERAL, generalBase({ x: GX, aneis: 0, t, sombra: false })); g.restore(); }
  });
}

export const ATO1 = [
  { id: 'A1-01', dur: 1.5, fn(t, u) {                                      // close: a corda estala
    const tR = 0.62, sol = u >= tR, pux = sol ? 0 : lerp(0.94, 1, st(0, tR, u)), vib = sol ? Math.sin((u - tR) * 95) * Math.exp(-(u - tR) * 13) * 8 : 0, k = sol ? eOut((u - tR) / 0.06) : 0;
    const tr = M.tremida(t, t - u + tR, 6, 0.15), cam = { x: NX + 96 + 8 * u, y: CH - 386, z: 2.5 * emp(u, 0.04) + (sol ? 0.05 * Math.exp(-(u - tR) * 10) : 0), sx: tr[0], sy: tr[1] };
    M.cena(t, cam, { foco: 1.3, frenteBlur: 18 }, g => {
      const P = nicoMira(pux, { expr: sol ? 'bravo' : 'firme', mN: sol ? [lerp(16, -12, k), oN - 10 - 8 * k] : [16 - (pux - 0.94) * 80, oN - 10], eN: [-86 - 14 * k, oN - 16 - 10 * k], abertaN: sol, olha: [3, 0], vento: sol ? Math.exp(-(u - tR) * 6) : 0 });
      P.frente = (gg, S) => arcoDe(gg, S, pux, { vib, flecha: !sol }); boneco(g, NICO, P);
      if (sol) { rastro(g, NX + 260 + (u - tR) * 5200, CH + oN - 4, 520, 0.9 * (1 - st(0.02, 0.16, u - tR))); M.anelSom(g, t, t - u + tR, [NX + 118, CH + oN - 4], { r: 420, dur: 0.5, n: 3, w: 6 }); }
    });
    M.acabamento(t, { flash: sol ? 0.14 * Math.exp(-(u - tR) * 26) : 0 });
    M.pilula(t, t - u + 0.12, t - u + 1.46, W / 2, 250, [['VOCÊS VOTARAM', '#fff'], ['1 · ATIRA', '#f4b92e']], { tam: 54, borda: 'rgba(244,185,46,0.7)' });
  } },
  { id: 'A1-02', dur: 1.5, fn(t, u) {                                      // a mão fecha na flecha, sem olhar
    const tC = 0.26, peg = u >= tC, k = peg ? eOut((u - tC) / 0.034) : 0, T0 = t - u;
    const tr = M.tremida(t, T0 + tC, 15, 0.2), cam = { x: GX - 150, y: CH - 520 + 6 * u, z: 2.2 * emp(u, 0.03) + (peg ? 0.06 * Math.exp(-(u - tC) * 9) : 0), sx: tr[0], sy: tr[1] };
    const base = generalBase(), pega = generalBase({ mN: [-214, oG + 96], eN: [-120, oG + 150], torce: -0.5 });
    const P = mix(base, pega, k); P.aneis = 0.1 + (peg ? 0.5 * Math.exp(-(u - tC) * 5) : 0); P.t = t; P.abertaN = k < 0.5; P.maoAnN = lerp(1.3, Math.PI * 0.56, k);
    const S = B.esq(GENERAL.R, pega), ax = GX + S.mN[0] + 58, ay = CH + 4 + S.mN[1] + 2, diss = st(tC + 0.5, tC + 1.1, u), wob = peg ? Math.sin((u - tC) * 70) * Math.exp(-(u - tC) * 8) * 0.06 : 0;
    M.cena(t, cam, { foco: 1.1, frenteBlur: 16 }, g => {
      boneco(g, IARA, iaraPresa(t));
      if (!peg) { const xa = lerp(ax - 1700, ax, u / tC); rastro(g, xa, ay, 700, 0.9); B.flecha(g, [xa - 196, ay], 0, { L: 196 }); }
      else if (diss < 1) { g.save(); g.translate(ax - 58, ay); g.rotate(wob); g.beginPath(); g.rect(58 - (196 + 40) * (1 - diss) - 4, -40, (196 + 40) * (1 - diss) + 30, 80); g.clip(); B.flecha(g, [58 - 196, 0], 0, { L: 196 }); g.restore(); }
      boneco(g, GENERAL, P);
      if (peg && diss > 0) for (let i = 0; i < 7; i++) M.cubinhos(g, t, T0 + tC + 0.5 + i * 0.085, [ax - 150 + i * 26, ay], { n: 8, v: 90, s: 11, dur: 0.6, seed: 20 + i, sobe: 80 });
      if (peg) { M.faiscas(g, t, T0 + tC, [ax - 40, ay], { n: 14, v: 170, cor: '#cfeaff', dur: 0.3 }); M.anelSom(g, t, T0 + tC, [ax - 40, ay], { r: 190, dur: 0.45, n: 2, w: 5 }); }
    });
    M.acabamento(t, { flash: peg ? 0.26 * Math.exp(-(u - tC) * 30) : 0 });
  } },
  { id: 'A1-03', fala: { q: 'NAR', txt: 'Ele nem virou a cabeça.', telas: ['ELE NEM VIROU', 'A *CABEÇA.*'], y: 'topo' }, pos: 0.35, fn(t, u) {
    const cam = { x: GX + 44 + 8 * u, y: CH + oG - 36, z: 3.3 * emp(u, 0.05) };
    M.cena(t, cam, { foco: 1.6, frenteBlur: 20 }, g => { boneco(g, IARA, iaraPresa(t)); boneco(g, GENERAL, generalBase({ aneis: 0.14 + 0.05 * Math.sin(t * 2.4), t })); });
    M.acabamento(t, { vinheta: 0.72 });
  } },
  { id: 'A1-04', dur: 2.0, fn(t, u) {                                      // aberto: a 2ª passa raspando
    const tR = 0.6, T0 = t - u, sol = u >= tR, pux = sol ? 0 : eIO(cl(u / 0.46)), vib = sol ? Math.sin((u - tR) * 95) * Math.exp(-(u - tR) * 13) * 8 : 0, tA = (GX - 90 - NX - 150) / 3400;
    const des = sol ? eOut((u - tR - tA + 0.05) / 0.035) * (1 - eIO((u - tR - tA - 0.12) / 0.42)) : 0, tr = M.tremida(t, T0 + tR + tA, 9, 0.15), cam = { x: 584 + 10 * u, y: CH - 500, z: 1.1 * emp(u, 0.03), sx: tr[0], sy: tr[1] };
    M.cena(t, cam, { foco: 0, frenteBlur: 12 }, g => {
      const P = nicoMira(pux, { expr: sol ? 'bravo' : 'firme', mN: sol ? [lerp(16, -12, eOut((u - tR) / 0.06)), oN - 16] : [lerp(110, 16, pux), oN - 10], abertaN: sol }); if (sol) P.eN = [-98, oN - 24]; P.frente = (gg, S) => arcoDe(gg, S, pux, { vib, flecha: !sol }); boneco(g, NICO, P);
      if (sol) { voo(g, t, T0 + tR, 1700 / 3400, [NX + 250, CH + oN - 4], [NX + 250 + 1700, CH + oN - 4 - 1700 * 0.39]); M.anelSom(g, t, T0 + tR, [NX + 118, CH + oN - 4], { r: 300, dur: 0.5 }); }
      boneco(g, IARA, iaraPresa(t)); boneco(g, GENERAL, generalBase({ lean: 0.11 * des, cabT: 0.16 * des, aneis: 0.12 + 0.6 * des, t }));
      if (sol) M.faiscas(g, t, T0 + tR + tA, [GX - 30, CH + oG - 140], { n: 7, v: 120, dur: 0.22, an: -0.4, abre: 1.6 });
    });
    M.acabamento(t);
  } },
  { id: 'A1-05', fala: { q: 'GEN', txt: 'Anomalia detectada. Iniciando processo de eliminação.', telas: ['*ANOMALIA* DETECTADA.', 'INICIANDO PROCESSO', 'DE *ELIMINAÇÃO.*'], pausa: 0.35 }, pos: 0.3, fn(t, u, p) {
    const sil = silabas(p.F[0], 9, 14), an = aneis(u, sil), cam = { x: GX + 86 - 10 * u, y: CH + oG + 150 + 4 * u, z: 1.62 * emp(u, 0.04) }, gl = u > sil[6] + 0.02 && u < sil[6] + 0.06;
    M.cena(t, cam, { foco: 0.9, frenteBlur: 16 }, g => {
      boneco(g, IARA, iaraPresa(t)); boneco(g, GENERAL, generalBase({ aneis: an, t }));
      for (const s of sil) M.anelSom(g, t, t - u + s, [GX + 14, CH + oG - 124], { r: 150, dur: 0.5, n: 1, w: 4, a: 0.5, ach: 1.15 });
      if (gl) { g.save(); g.translate(IX - 10, CH + oI - IAR - 250); g.fillStyle = 'rgba(40,6,10,0.92)'; g.fillRect(-170, -34, 340, 68); g.strokeStyle = '#ff4a52'; g.lineWidth = 3; g.strokeRect(-170, -34, 340, 68); texto(g, 'ANOMALIA: IARA', 0, 3, { tam: 44, al: 'center', cor: '#ff5a60' }); g.fillStyle = 'rgba(120,230,255,0.5)'; g.fillRect(-170, -8, 340, 5); g.restore(); }
    });
    M.acabamento(t);
  } },
  { id: 'A1-06', fala: { q: 'NICO', txt: 'Não! Minha mestra, não!', telas: ['*NÃO!*', 'MINHA *MESTRA,* NÃO!'] }, pos: 0.25, fn(t, u) {
    const soco = 0.06 * eOut(u / 0.07), cam = { x: NX + 60 + 14 * u, y: CH + oN - 96, z: 2.5 * (1 + soco) * emp(u, 0.02) }, av = eOut(u / 0.12);
    M.cena(t, cam, { foco: 1.4, frenteBlur: 18 }, g => { const P = nicoPe(t, { expr: 'grita', lean: 0.05 + 0.13 * av, px: 20 * av, mN: [lerp(-30, 150, av), oN + lerp(150, -26, av)], abertaN: true, maoAnN: -0.2, mF: [96, oN + 96], pF: [70, 0], olha: [4, -1] }); P.atras = (gg, S) => arcoDe(gg, S, 0, { an: 0.5 }); boneco(g, NICO, P); });
    M.acabamento(t);
  } },
  { id: 'A1-07', fala: { q: 'IARA', txt: 'Foge, Nico. Ele é forte demais. Por favor.', telas: ['*FOGE,* NICO.', 'ELE É *FORTE* DEMAIS.', 'POR *FAVOR.*'] }, pos: 0.3, fn(t, u, p) {
    const cam = { x: IX - 60 + 6 * u, y: CH + oI - IAR - 30, z: 2.7 * emp(u, 0.05) }, fim = u > p.F[0].d * 0.72;
    M.cena(t, cam, { foco: 1.5, frenteBlur: 20 }, g => { boneco(g, IARA, iaraPresa(t, { expr: fim ? 'triste' : 'medo', olha: [3, 1], cabT: -0.14 })); boneco(g, GENERAL, generalBase({ aneis: 0.14, t })); });
    M.acabamento(t, { vinheta: 0.7 });
  } },
  { id: 'A1-08', dur: 2.6, fn(t, u) {                                      // aviso de buff; o Nico puxa e mira
    const pux = eIO(cl((u - 0.5) / 0.9)), cam = { x: NX + 150, y: CH + oN + 10, z: 1.75 * emp(u, 0.05) }, T0 = t - u;
    M.cena(t, cam, { foco: 1.0, frenteBlur: 16 }, g => { const P = nicoMira(pux, { expr: 'firme' }); P.frente = (gg, S) => arcoDe(gg, S, pux, {}); boneco(g, NICO, P);
      if (u > 0.3) { const S = B.esq(NICO.R, P), c = [NX + S.cab[0] + 44, CH + S.cab[1] - 2], kk = eOut((u - 0.3) / 0.2); g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = '#7fd4ff'; g.shadowColor = '#7fd4ff'; g.shadowBlur = 16; g.lineWidth = 3; g.globalAlpha = 0.9 * kk; g.beginPath(); g.arc(c[0], c[1], lerp(60, 15, kk), 0, TAU); g.stroke(); g.restore(); } });
    M.acabamento(t);
    buff(t, T0 + 0.25, T0 + 2.6, 'OLHO DO FALCÃO', 'ATIVO', { y: 330 });
  } },
  { id: 'A1-09', dur: 3.0, fn(t, u) {                                      // PONTO FRACO: NÃO ENCONTRADO x3
    const cam = { x: GX + 70, y: CH - 500, z: 1.42 * emp(u, 0.03) }, T0 = t - u, alvos = [[GX + 14, CH + oG - 122], [GX + 10, CH + oG + 120], [GX - 30, CH - 250]], te = [0.25, 1.05, 1.85];
    M.cena(t, cam, { foco: 0.6, frenteBlur: 14, tinta: 'rgba(6,20,40,0.25)' }, g => { boneco(g, IARA, iaraPresa(t)); boneco(g, GENERAL, generalBase({ aneis: 0.14, t })); });
    M.acabamento(t);
    const g = X(); for (let i = 0; i < 3; i++) { const uu = u - te[i]; if (uu < 0 || uu > 0.8) continue; const p = tela(cam, alvos[i]), r = lerp(310, 120, eOut(uu / 0.18)), falha = uu > 0.42; g.save(); g.strokeStyle = falha ? '#ff5a60' : '#eaf6ff'; g.lineWidth = 3; g.globalAlpha = falha ? 0.9 * (Math.floor(uu * 30) % 2 ? 1 : 0.4) : 1; g.beginPath(); g.arc(p[0], p[1], r, 0, TAU); g.stroke(); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; g.beginPath(); g.moveTo(p[0] + Math.cos(a) * (r - 22), p[1] + Math.sin(a) * (r - 22)); g.lineTo(p[0] + Math.cos(a) * (r + 22), p[1] + Math.sin(a) * (r + 22)); g.stroke(); } g.restore(); }
    for (let i = 0; i < 3; i++) janelaErro(t, T0 + te[i] + 0.42, W / 2 + (i - 1) * 46, 430 + i * 170, 'PONTO FRACO: NÃO ENCONTRADO', { seed: i * 7, w: 900 });
    buff(t, T0, T0 + 3.0, 'OLHO DO FALCÃO', u > te[2] + 0.5 ? 'FALHOU' : 'ATIVO', { y: 250, cor: u > te[2] + 0.5 ? '#ff5a60' : '#7fd4ff' });
  } },
  { id: 'A1-10', fala: { q: 'NICO', txt: 'Como assim? Ele não tem ponto fraco?', telas: ['COMO *ASSIM?*', 'ELE NÃO TEM', 'PONTO *FRACO?*'] }, pos: 0.25, fn(t, u) {
    const cam = { x: NX + 70 - 8 * u, y: CH + oN - 86, z: 2.6 * emp(u, 0.04) }, k = eOut(u / 0.3);
    M.cena(t, cam, { foco: 1.4, frenteBlur: 18 }, g => { const P = nicoPe(t, { expr: u < 0.9 ? 'susto' : 'medo', lean: -0.04 * k, mF: [110, oN + lerp(10, 70, k)], mN: [-24, oN + 140], olha: [4, 0] }); P.atras = (gg, S) => arcoDe(gg, S, 0, { an: 0.35 }); boneco(g, NICO, P); });
    M.acabamento(t);
    for (let i = 0; i < 2; i++) { const g = X(); g.save(); g.globalAlpha = 0.28; janelaErro(t, t - u - 1 + i * 0.01, i ? 822 : 258, i ? 520 : 300, 'NÃO ENCONTRADO', { seed: 30 + i, w: 440 }); g.restore(); }
  } },
  { id: 'A1-11', dur: 1.5, fn(t, u) { const tr = M.tremida(t, t - u + 0.5, 5, 0.12); cenaTerceira(t, u, { x: 620 + 8 * u, y: CH - 500, z: 1.0 * emp(u, 0.03), sx: tr[0], sy: tr[1] }, false); M.acabamento(t); } },
  { id: 'A1-12', fala: [{ q: 'NAR', txt: 'Ele não desviava da flecha. Desviava do barulho.', telas: ['ELE NÃO DESVIAVA', 'DA *FLECHA.*', 'DESVIAVA DO *BARULHO.*'], at: 0.35 }, { q: 'NAR', txt: 'O estalo da corda chega seis vezes antes dela.', telas: ['O *ESTALO* DA CORDA', 'CHEGA *SEIS VEZES*', 'ANTES DELA.'], depois: 0.3 }], pos: 0.5, fn(t, u, p) {
    const T0 = t - u, cam = { x: 632, y: CH - 500, z: 1.03 + 0.012 * u }; cenaTerceira(t, 0.5 + 0.2, cam, true); M.acabamento(t, { flash: 0.5 * Math.exp(-u * 16) });   // congela o quadro real, flecha no ar
    const g = X(), a = tela(cam, [NX + 150, CH + oN - 4]), b = tela(cam, [GX + 20, CH + oG - 124]), y1 = a[1] - 500, y2 = a[1] - 330, k1 = eOut((u - 0.3) / 0.25), k2 = eOut((u - 0.7) / 0.25);
    const linha = (y, k, cor, rot, val, per, ph) => { if (k <= 0) return; g.save(); g.globalAlpha = k; g.strokeStyle = cor; g.lineWidth = 4; g.setLineDash([14, 10]); g.beginPath(); g.moveTo(a[0], y); g.lineTo(lerp(a[0], b[0], k), y); g.stroke(); g.setLineDash([]); for (const x of [a[0], b[0]]) { g.beginPath(); g.moveTo(x, y - 18); g.lineTo(x, y + 18); g.stroke(); }
      const kk = ((u + ph) % per) / per, dur = per === 1.4 ? 0.12 : 0.72, x = lerp(a[0], b[0], cl(kk / dur)); if (kk < dur + 0.1) { g.fillStyle = cor; g.shadowColor = cor; g.shadowBlur = 18; g.beginPath(); g.arc(x, y, 13, 0, TAU); g.fill(); } g.shadowBlur = 0;
      texto(g, rot, a[0], y - 52, { tam: 52, cor, borda: '#0b0f16' }); texto(g, val, b[0] + 26, y + 2, { tam: 60, cor: '#fff', borda: '#0b0f16' }); g.restore(); };
    linha(y1, k1, '#62ccff', 'SOM · 343 m/s', '0,06 s', 1.4, 0); linha(y2, k2, '#f1b534', 'FLECHA · ~55 m/s', '0,36 s', 1.4, 0);
    const k3 = eBack((u - p.F[1].u0 - 0.4) / 0.18); if (k3 > 0) { g.save(); g.translate(W / 2, 1180); g.scale(k3, k3); g.fillStyle = 'rgba(10,18,34,0.92)'; g.beginPath(); g.roundRect(-330, -58, 660, 116, 18); g.fill(); g.strokeStyle = '#62ccff'; g.lineWidth = 3; g.stroke(); texto(g, '0,3 s', -290, 4, { tam: 76, cor: '#62ccff' }); texto(g, 'PRA DESVIAR', 300, 6, { tam: 54, al: 'right' }); g.restore(); }
    selo(t, T0 + 0.1, T0 + p.D, 'RAIO-X', { y: 250 });
  } },
];
