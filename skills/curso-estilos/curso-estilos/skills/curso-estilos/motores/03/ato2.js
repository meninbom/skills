// Ato 2 · Ele apaga
import { B, M, IARA, GENERAL, NICO, boneco, mix, lerp, cl, TAU, W, H, CH, st, eOut, eIn, eIO, eBack, rng, X, oN, oG, oI, NX, GX, IX, IAR, emp, resp,
  nicoMira, nicoPe, generalBase, generalSolto, iaraPresa, iaraPe, iaraMira, arcoDe, rastro, voo, leque, linhasVel, poeira, arvoreCena, barraVida, numeroGrande, fundoInsert, texto, selo } from './comum.js';
import { pousa } from './fisica.js';
const tela = (cam, p) => [(p[0] - cam.x) * cam.z + W / 2 + (cam.sx || 0), (p[1] - cam.y) * cam.z + H / 2 + (cam.sy || 0)];
// posições deste ato: o General avança sobre o Nico; depois a luta acontece à direita
const G2 = 430, N2 = 150, NQ = -420;                                    // General perto do Nico; Nico depois do tapa
const GL = 520, IL = 960;                                               // luta: General e Iara
const presaEm = (t, gx, o = {}) => iaraPresa(t, { x: gx + (IX - GX), ...o });
const somNoChao = (g, t, t0, p, r = 260) => M.anelSom(g, t, t0, p, { r, dur: 0.7, n: 3, w: 5, ach: 0.28 });
const nicoDeitado = (t, o = {}) => ({ x: NQ, y: CH + 178, chao: CH, vista: 'l', dir: 1, expr: 'dor', gira: 1.5, sombra: false, pN: [-20, 0], pF: [24, 0], lean: -0.1, pN: [-34, -12], pF: [-84, -94], mF: [10, oN - 130], mN: [-6, oN + 40], cabT: -0.5, ...o });
function pedra(g, p, r = 13) { g.save(); g.fillStyle = '#8fa6b8'; g.beginPath(); g.ellipse(p[0], p[1], r, r * 0.8, 0.4, 0, TAU); g.fill(); g.fillStyle = '#c9dbe8'; g.beginPath(); g.ellipse(p[0] - 3, p[1] - 3, r * 0.5, r * 0.3, 0.4, 0, TAU); g.fill(); g.restore(); }
const arcoPedra = (k, a, b, alt) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k) - alt * 4 * k * (1 - k)];
// visão do General: tudo vira azul-breu; só os anéis de som aparecem
const visao = (t, cam, desenha, o = {}) => { B.setAmb([0.1, 0.2, 0.42], [2, 8, 22]); B.setLuz({ cor: '#2f6aa0', w: 2 }); M.cena(t, cam, { foco: 0.6, frenteBlur: 14, tinta: 'rgba(1,5,18,0.8)' }, desenha); M.acabamento(t, { vinheta: 0.85, bloom: 0.35 }); B.setAmb([0.88, 0.92, 1.0], [0, 3, 8]); B.setLuz({ cor: '#a9d2f2', w: 2.6 });
  const g = X(); g.save(); g.strokeStyle = 'rgba(82,198,255,0.5)'; g.lineWidth = 4; g.strokeRect(40, 150, W - 80, H - 300); g.restore(); texto(g, 'VISÃO DO GENERAL', 70, 200, { tam: 44, cor: 'rgba(130,215,255,0.8)' }); };
function cervo(g, x, y, s, k) {                                           // k: 0 em pé, 1 abaixado
  g.save(); g.translate(x, y + 70 * k * s); g.scale(s, s); g.strokeStyle = '#e8f4f8'; g.lineWidth = 5; g.lineJoin = 'round'; g.lineCap = 'round'; g.shadowColor = '#9fdcf0'; g.shadowBlur = 14; g.fillStyle = 'rgba(180,225,240,0.12)';
  g.beginPath(); g.ellipse(0, -150 + 30 * k, 120, 52 - 8 * k, -0.06 - 0.12 * k, 0, TAU); g.fill(); g.stroke();
  for (const [lx, bx] of [[-84, -96], [-50, -40], [60, 72], [92, 110]]) { g.beginPath(); g.moveTo(lx, -116 + 30 * k); g.lineTo(lerp(lx, bx + (lx < 0 ? -26 : 30), k), -60 + 24 * k); g.lineTo(bx, 0 - 70 * k * 0 + 0); g.stroke(); }
  const nk = [118, -176 + 34 * k], hd = [196 + 14 * k, -262 + 96 * k]; g.beginPath(); g.moveTo(96, -186 + 30 * k); g.lineTo(hd[0] - 30, hd[1] + 14); g.lineTo(hd[0] - 6, hd[1] + 40); g.lineTo(nk[0] + 16, nk[1] + 44); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.ellipse(hd[0], hd[1], 44, 26, 0.3, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#e8f4f8'; g.beginPath(); g.arc(hd[0] + 8, hd[1] - 6, 5, 0, TAU); g.fill();
  for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(hd[0] - 20, hd[1] - 20); g.quadraticCurveTo(hd[0] - 50 + sg * 14, hd[1] - 80, hd[0] - 30 + sg * 24, hd[1] - 120); g.moveTo(hd[0] - 38 + sg * 10, hd[1] - 70); g.lineTo(hd[0] - 66 + sg * 16, hd[1] - 96); g.stroke(); }
  g.beginPath(); g.moveTo(-118, -160 + 30 * k); g.lineTo(-140, -176 + 30 * k); g.stroke(); g.restore();
}

export const ATO2 = [
  { id: 'A2-01', fala: { q: 'IARA', txt: 'Ele ouve igual bicho do mato. Mira embaixo!', telas: ['ELE OUVE IGUAL', '*BICHO DO MATO.*', 'MIRA *EMBAIXO!*'] }, pos: 0.25, fn(t, u, p) {
    const d = p.F[0].d, a = p.F[0].u0 + d * 0.3, b = p.F[0].u0 + d * 0.74;
    if (u < a || u > b) { const cam = { x: IX - 60, y: CH + oI - IAR - 30, z: 2.7 * emp(u < a ? u : u - b, 0.05) }; M.cena(t, cam, { foco: 1.5, frenteBlur: 20 }, g => { boneco(g, IARA, iaraPresa(t, { expr: 'grita', olha: [3, 2], cabT: -0.16 })); boneco(g, GENERAL, generalBase({ aneis: 0.14, t })); }); M.acabamento(t, { vinheta: 0.7 }); return; }
    const v = u - a, g = X(), tS = 0.28, kd = eOut((v - tS - 0.1) / 0.14, 2); fundoInsert(t);                 // lembrança de caçadora: o bicho abaixa no estalo
    g.save(); g.strokeStyle = '#e8f4f8'; g.lineWidth = 6; g.shadowColor = '#9fdcf0'; g.shadowBlur = 14; g.beginPath(); g.moveTo(120, 1010); g.quadraticCurveTo(210, 880, 120, 750); g.stroke(); g.lineWidth = 2.5; g.beginPath(); g.moveTo(120, 1010); g.lineTo(v < tS ? 80 : 120, 880); g.lineTo(120, 750); g.stroke(); g.restore();
    M.anelSom(g, t, t - v + tS, [130, 880], { r: 900, dur: 0.5, n: 3, w: 6 });
    cervo(g, 660, 1120, 1.15, kd);
    if (v >= tS) { const ka = (v - tS) / 0.42; if (ka < 1.4) { const x = lerp(140, 1200, ka); rastro(g, x, 880 - 30 * ka, 380, 0.8, -0.03, '241,181,52'); g.save(); g.translate(x, 880 - 30 * ka); B.setAmb([1, 1, 1]); B.flecha(g, [-196, 0], -0.03, { L: 196 }); B.setAmb([0.88, 0.92, 1.0], [0, 3, 8]); g.restore(); } }
    g.save(); g.setLineDash([12, 10]); g.strokeStyle = 'rgba(241,181,52,0.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(520, 860); g.lineTo(900, 860); g.stroke(); g.restore();
    if (kd > 0) { g.save(); g.globalAlpha = kd; g.strokeStyle = '#62ccff'; g.lineWidth = 5; g.beginPath(); g.moveTo(940, 870); g.lineTo(940, 940); g.lineTo(924, 918); g.moveTo(940, 940); g.lineTo(956, 918); g.stroke(); g.restore(); }
  } },
  { id: 'A2-02', dur: 6.3, fn(t, u) {                                      // três tiros baixos; ele não abaixa: some e aparece mais perto
    const T0 = t - u, per = 2.0, i = Math.min(2, Math.floor(u / per)), v = u - i * per, tR = 1.0, sol = v >= tR, pux = sol ? 0 : eIO(cl((v - 0.25) / 0.6)), vib = sol ? Math.sin((v - tR) * 95) * Math.exp(-(v - tR) * 13) * 8 : 0;
    const gxs = [GX, 660, 545, G2], nxs = [NX, 204, 176, N2], tS = tR + 0.1, pulo = v >= tS, some = v >= tS && v < tS + 2 / 60, gx = pulo ? gxs[i + 1] : gxs[i], nx = lerp(nxs[i], nxs[i + 1], eIO(cl(v / 0.3)));
    const tr = M.tremida(t, T0 + i * per + tS, 8, 0.15), cam = { x: lerp(560, 430, eIO(u / 6.3)), y: CH - 470, z: 1.08 + 0.1 * eIO(u / 6.3), sx: tr[0], sy: tr[1] };
    M.cena(t, cam, { foco: 0, frenteBlur: 12 }, g => {
      const P = nicoMira(pux, { x: nx, expr: i > 1 ? 'medo' : 'bravo', lean: -0.1, mF: [146, oN + 34], mN: sol ? [-10, oN - 6] : [lerp(104, 14, pux), oN + 6], eN: sol ? [-96, oN - 18] : [lerp(-10, -84, pux), oN - lerp(-40, 26, pux)], abertaN: sol, pN: [-46 - 20 * Math.sin(Math.min(1, v / 0.3) * Math.PI), 0] });
      P.frente = (gg, S) => arcoDe(gg, S, pux, { vib, an: 0.2, flecha: !sol }); boneco(g, NICO, P);
      if (sol) { voo(g, t, T0 + i * per + tR, 0.3, [nx + 250, CH + oN + 80], [nx + 250 + 900, CH + oN + 80 + 190], { len: 320 }); M.anelSom(g, t, T0 + i * per + tR, [nx + 118, CH + oN + 30], { r: 420, dur: 0.4 }); }
      if (pulo) { M.cubinhos(g, t, T0 + i * per + tS, [gxs[i], CH - 520], { n: 30, v: 200, s: 16, dur: 0.6, seed: 40 + i }); M.cubinhos(g, t, T0 + i * per + tS, [gxs[i], CH - 220], { n: 20, v: 160, s: 14, dur: 0.5, seed: 50 + i }); M.anelSom(g, t, T0 + i * per + tS + 0.03, [gx, CH - 500], { r: 240, dur: 0.3, n: 1, w: 4, cor: '#eaf6ff' }); }
      if (!some) { boneco(g, IARA, presaEm(t, gx, { expr: 'medo' })); boneco(g, GENERAL, generalBase({ x: gx, aneis: 0.14 + (sol ? 0.7 * Math.exp(-(v - tR) * 4) : 0), t })); }
    });
    M.acabamento(t, { flash: pulo ? 0.12 * Math.exp(-(v - tS) * 30) : 0 });
  } },
  { id: 'A2-03', fala: { q: 'NAR', txt: 'Só que aquilo não era bicho.', telas: ['SÓ QUE AQUILO', 'NÃO ERA *BICHO.*'] }, pos: 0.4, fn(t, u) {
    const cam = { x: 330 + 8 * u, y: CH - 600 - 14 * u, z: 1.55 * emp(u, 0.06) };
    M.cena(t, cam, { foco: 0.8, frenteBlur: 16 }, g => { boneco(g, NICO, nicoPe(t, { x: N2, expr: 'medo', lean: -0.14, olha: [5, -5], cabT: -0.2, mF: [84, oN + 60], pN: [-50, 0] })); boneco(g, IARA, presaEm(t, G2, { expr: 'medo' })); boneco(g, GENERAL, generalBase({ x: G2, aneis: 0.3 + 0.2 * Math.sin(t * 3), t, lean: -0.03 })); });
    M.acabamento(t, { vinheta: 0.74 });
  } },
  { id: 'A2-04', dur: 3.0, fn(t, u) {                                      // encosta numa árvore: ela vira cubinho de baixo pra cima
    const k = st(0.55, 2.5, u), toca = eOut((u - 0.2) / 0.3), cam = { x: 600, y: lerp(CH - 420, CH - 900, eIO(cl((u - 0.5) / 2.3))), z: 1.3 * emp(u, 0.03) }, ax = 690;
    M.cena(t, cam, { foco: 0.5, frenteBlur: 14 }, g => { arvoreCena(g, ax, k, t); boneco(g, GENERAL, generalSolto({ x: 520, dir: 1, mF: [lerp(84, 150, toca), oG + lerp(318, 150, toca)], eF: [lerp(62, 100, toca), oG + lerp(166, 190, toca)], abertaF: true, curvaF: 0.1, aneis: 0.2, t })); if (u > 0.5) M.anelSom(g, t, t - u + 0.5, [ax - 60, CH + oG + 150], { r: 120, dur: 0.4, n: 1, cor: '#52c6ff' }); });
    M.acabamento(t);
  } },
  { id: 'A2-05', dur: 4.8, fn(t, u) {                                      // o tapa
    const T0 = t - u, tS = 0.5, bate = u >= tS, arm = eOut((u - 0.1) / 0.2), gol = bate ? eOut((u - tS) / 0.05) : 0;
    if (u < 2.1) {
      const v = u - tS, voa = bate ? cl(v / 0.42) : 0, nx = lerp(N2, NQ, eOut(voa, 1.6)), ny = CH - 240 * Math.sin(Math.PI * voa), pouso = v >= 0.42;
      const tr1 = M.tremida(t, T0 + tS, 16, 0.22), tr2 = M.tremida(t, T0 + tS + 0.42, 11, 0.18), cam = { x: lerp(300, -110, eIO(cl(v / 0.5))), y: CH - 480, z: 1.08, sx: tr1[0] + tr2[0], sy: tr1[1] + tr2[1] };
      M.cena(t, cam, { foco: 0, frenteBlur: 12 }, g => {
        if (!bate) boneco(g, NICO, nicoPe(t, { x: N2, expr: 'medo', lean: -0.16, olha: [5, -4] }));
        else if (!pouso) { linhasVel(g, t, [nx + 200, ny - 200], { dir: 1, n: 10, w: 700, h: 420 }); boneco(g, NICO, nicoPe(t, { x: nx, y: ny, expr: 'dor', gira: -voa * TAU, sombra: false, mF: [70, oN - 60], mN: [-60, oN - 40], pN: [-60, -40], pF: [50, -20] })); }
        else { boneco(g, NICO, nicoDeitado(t)); poeira(g, t, T0 + tS + 0.42, [NQ, CH], { n: 8 }); }
        boneco(g, IARA, presaEm(t, G2, { expr: 'medo', bal: -1.2 * gol * Math.exp(-Math.max(0, v) * 3) }));
        const Pg = generalBase({ x: G2, dir: 1, mN: [lerp(-78, 60, arm) + lerp(0, -330, gol), oG + lerp(316, 20, arm) + lerp(0, 150, gol)], eN: [lerp(-92, -30, arm) + lerp(0, -140, gol), oG + lerp(166, 60, arm) + lerp(0, 70, gol)], abertaN: true, curvaN: 0.05, maoAnN: lerp(1.3, Math.PI, gol), lean: -0.06 * arm - 0.12 * gol, torce: -0.6 * gol, aneis: 0.3, t });
        boneco(g, GENERAL, Pg); leque(g, t, T0 + tS, [G2 - 80, CH + oG + 60], 330, -0.3, Math.PI * 0.86, { dur: 0.13 });
        if (bate) { M.faiscas(g, t, T0 + tS + 0.03, [N2 + 20, CH + oN - 20], { n: 16, v: 260, dur: 0.3 }); M.anelSom(g, t, T0 + tS + 0.02, [N2 + 20, CH + oN - 20], { r: 300, dur: 0.4, n: 2, w: 7, cor: '#eaf6ff' }); }
      });
      M.acabamento(t, { flash: bate ? 0.55 * Math.exp(-(u - tS) * 22) : 0 });
      if (u > tS + 0.2) barraVida(t, T0 + tS + 0.2, 100, 8, { tDano: 0.12 });
    } else if (u < 2.75) {                                                  // insert: o que acontece se zerar
      const g = X(), v = u - 2.1, k = eBack(v / 0.16); fundoInsert(t, { c1: '#3a0c14', c2: '#16040a' });
      g.save(); g.translate(W / 2, 800); g.scale(k, k); g.strokeStyle = '#ffd9db'; g.lineWidth = 8; g.shadowColor = '#ff5058'; g.shadowBlur = 22; g.beginPath(); g.roundRect(-250, -110, 500, 220, 110); g.stroke(); g.beginPath(); g.moveTo(-60, -110); g.lineTo(-60, 110); g.stroke(); g.beginPath(); g.arc(-150, 0, 44, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(-90, 46); g.quadraticCurveTo(40, 20, 200, 44); g.stroke(); g.restore();
      texto(g, 'EXPULSÃO SE ZERAR', W / 2, 1060, { tam: 72, al: 'center', cor: '#ffd9db', borda: '#16040a' }); barraVida(t, T0 + 0.7, 100, 8, { tDano: 0.12 });
    } else {                                                                // o arco caiu longe; ele se arrasta
      const v = u - 2.75, avan = eIO(v / 2.0), tre = Math.sin(t * 46) * 3 * (1 - avan * 0.5), cam = { x: NQ - 190 + 30 * avan, y: CH - 70, z: 2.2 * emp(v, 0.04) };
      M.cena(t, cam, { foco: 1.2, frenteBlur: 18 }, g => { g.save(); g.translate(NQ - 420, CH - 6); g.rotate(1.47); B.arco(g, [0, 0], 0, { L: 150, cor: '#8a5a30' }); g.restore();
        boneco(g, NICO, nicoDeitado(t, { x: NQ + 40 - 60 * avan, mF: [10 + tre, oN - 128 - 30 * avan], abertaF: true, maoAnF: -1.6, expr: 'dor' })); });
      M.acabamento(t, { vinheta: 0.72 }); barraVida(t, T0 + 0.7, 100, 8, { tDano: 0.12 });
    }
  } },
  { id: 'A2-06', fala: [{ q: 'NAR', txt: 'Mais um desses, e o Nico acordava na cápsula.', telas: ['MAIS UM *DESSES,*', 'E O NICO ACORDAVA', 'NA *CÁPSULA.*'] }, { q: 'NAR', txt: 'E ela ficava ali, sozinha.', telas: ['E ELA FICAVA ALI,', '*SOZINHA.*'], depois: 0.3 }], pos: 0.45, fn(t, u, p) {
    const T0 = t - u;
    if (u < p.F[1].u0 - 0.1) { const cam = { x: NQ - 40, y: CH - 120, z: 2.0 * emp(u, 0.05) }; M.cena(t, cam, { foco: 1.2, frenteBlur: 18 }, g => { g.save(); g.translate(NQ - 420, CH - 6); g.rotate(1.47); B.arco(g, [0, 0], 0, { L: 150, cor: '#8a5a30' }); g.restore(); boneco(g, NICO, nicoDeitado(t, { x: NQ - 20, mF: [10 + Math.sin(t * 46) * 2, oN - 156], abertaF: true, maoAnF: -1.6, cabT: -0.8, expr: 'medo' })); }); M.acabamento(t, { vinheta: 0.72 }); barraVida(t, T0 - 3, 100, 8, { tDano: 0.1 }); }
    else { const v = u - p.F[1].u0, cam = { x: G2 + 200, y: CH - 640, z: 0.92 - 0.04 * eIO(cl(v / 2.4)) }; M.cena(t, cam, { foco: 0, frenteBlur: 12 }, g => { boneco(g, IARA, presaEm(t, G2, { expr: 'triste', dir: -1 })); boneco(g, GENERAL, generalBase({ x: G2, aneis: 0.14, t })); }); M.acabamento(t, { vinheta: 0.82 }); }
  } },
  { id: 'A2-07', dur: 2.3, fn(t, u) {                                      // ela corta a gola e cai de pé, sem barulho
    const T0 = t - u, ix = G2 + (IX - GX);
    if (u < 0.8) { const corta = u >= 0.5, cam = { x: ix - 20, y: CH + oI - IAR - 30, z: 3.1 * emp(u, 0.04) }; M.cena(t, cam, { foco: 1.6, frenteBlur: 20 }, g => { const P = presaEm(t, G2, { expr: 'bravo', mN: [lerp(10, 26, eOut(u / 0.4)), oI - IAR - lerp(22, 40, eOut(u / 0.4))], maoAnN: -1.2 }); P.frente = (gg, S) => { gg.save(); gg.translate(S.mN[0], S.mN[1]); B.flecha(gg, [-150, 30], -0.35 + (corta ? 0.5 : 0), { L: 196 }); gg.restore(); }; boneco(g, IARA, P); boneco(g, GENERAL, generalBase({ x: G2, aneis: 0.14, t })); leque(g, t, T0 + 0.5, [ix + 10, CH + oI - IAR - 20], 90, -2.2, -0.6, { dur: 0.1 }); if (corta) M.faiscas(g, t, T0 + 0.5, [ix, CH + oI - IAR - 16], { n: 8, v: 110, dur: 0.2 }); }); M.acabamento(t, { flash: corta ? 0.2 * Math.exp(-(u - 0.5) * 30) : 0 }); }
    else if (u < 1.5) { const v = u - 0.8, cai = eIn(cl(v / 0.3), 2), amort = v > 0.3 ? Math.exp(-(v - 0.3) * 9) : 0, cam = { x: ix - 110, y: CH - 430, z: 1.25 }; M.cena(t, cam, { foco: 0, frenteBlur: 12 }, g => { const Pc = v < 0.3 ? { ar: IAR * (1 - cai), voo: 0.9 * cai, lean: 0.08, pN: [-40, -30 * (1 - cai)], pF: [44, -44 * (1 - cai)], calcN: 0.7 * (1 - cai), calcF: 0.8 * (1 - cai), estica: 1 + 0.06 * cai } : pousa(v - 0.3, IARA.R, { A: 92, lean0: 0.06, voo: 0.9 }); boneco(g, IARA, iaraPe(t, { x: ix, ...Pc, bal: -0.5 * (1 - cai), expr: 'bravo', sombra: cai > 0.5 })); /* cai com os pés apontando e o pano subindo; pousa com mola */ boneco(g, GENERAL, generalBase({ x: G2, mF: [lerp(IX - GX - 18, 84, eOut(v / 0.4)), lerp(oI - IAR, oG + 318, eOut(v / 0.4))], abertaF: true, aneis: 0.14, t })); }); M.acabamento(t); }
    else { const v = u - 1.5, cam = { x: ix + 30, y: CH - 60, z: 3.6 * emp(v, 0.05) }; M.cena(t, cam, { foco: 1.6, frenteBlur: 22 }, g => { boneco(g, IARA, iaraPe(t, { x: ix, agacha: 8, expr: 'bravo' })); }); M.acabamento(t, { vinheta: 0.7 }); texto(X(), 'SEM SOM', W / 2, 560, { tam: 60, al: 'center', cor: 'rgba(160,215,255,0.75)', borda: '#0b0f16' }); }
  } },
  { id: 'A2-08', fala: [{ q: 'NAR', txt: 'Fazia meses que ele treinava com ela.', telas: ['FAZIA *MESES*', 'QUE ELE TREINAVA', 'COM ELA.'] }, { q: 'NAR', txt: 'Nunca tinha visto ela lutar.', telas: ['NUNCA TINHA VISTO', 'ELA *LUTAR.*'], depois: 0.3 }], pos: 0.4, fn(t, u, p) {
    if (u < p.F[1].u0 - 0.1) { const cam = { x: NQ + 130, y: CH - 60, z: 3.0 * emp(u, 0.05) }; M.cena(t, cam, { foco: 1.5, frenteBlur: 20 }, g => boneco(g, NICO, nicoDeitado(t, { x: NQ - 20, cabT: -1.0, expr: 'susto', olha: [5, -3], mF: [10, oN - 150] }))); M.acabamento(t, { vinheta: 0.72 }); }
    else { const v = u - p.F[1].u0, pux = eIO(cl((v - 0.2) / 0.9)), cam = { x: IL - 30, y: CH - 430 - 30 * v, z: 1.5 * emp(v, 0.07) }; M.cena(t, cam, { foco: 0.9, frenteBlur: 16 }, g => { const P = iaraMira(pux, { x: IL, bal: -0.5 }); P.frente = (gg, S) => arcoDe(gg, S, pux, { cor: '#1c1a22', ouro: '#d8b04a', L: 170 }); boneco(g, IARA, P); }); M.acabamento(t); }
  } },
  // ---------- a luta (coreografia da série)
  { id: 'A2-09a', dur: 2.0, fn(t, u) {                                      // pedra pra esquerda
    const T0 = t - u, jog = eOut((u - 0.35) / 0.07), kp = (u - 0.4) / 0.75, alvo = [GL - 420, CH], cam = { x: 600 - 40 * eIO(u / 2), y: CH - 470, z: 1.02 * emp(u, 0.03) };
    M.cena(t, cam, { foco: 0, frenteBlur: 12 }, g => {
      boneco(g, GENERAL, generalSolto({ x: GL, aneis: 0.14, t }));
      boneco(g, IARA, iaraPe(t, { x: IL, mF: [lerp(-70, 150, jog), oI + lerp(-90, -30, jog)], cotF: -1, abertaF: jog > 0.5, lean: lerp(-0.12, 0.16, jog), expr: 'bravo' }));
      if (kp > 0 && kp < 1) pedra(g, arcoPedra(kp, [IL - 150, CH + oI - 30], alvo, 380)); if (kp >= 1) { pedra(g, alvo); somNoChao(g, t, T0 + 1.15, alvo, 320); }
    });
    M.acabamento(t);
  } },
  { id: 'A2-09b', dur: 1.5, fn(t, u) {                                      // na visão dele: um anel abre ali; ele vira
    const T0 = t - u, vira = u > 0.5, cam = { x: 380, y: CH - 480, z: 1.1 * emp(u, 0.04) };
    visao(t, cam, g => { boneco(g, GENERAL, generalSolto({ x: GL, dir: vira ? -1 : 1, aneis: 1, t })); boneco(g, IARA, iaraPe(t, { x: IL, alfa: 0.25 })); });
    const g = X(); for (let i = 0; i < 2; i++) M.anelSom(g, t, T0 + i * 0.5, tela(cam, [GL - 420, CH]), { r: 380, dur: 0.9, n: 3, w: 6, ach: 0.3 });
  } },
  { id: 'A2-09c', dur: 1.7, fn(t, u) {                                      // flecha pela direita; ele pega sem olhar
    const T0 = t - u, tC = 0.5, peg = u >= tC, k = peg ? eOut((u - tC) / 0.034) : 0, tr = M.tremida(t, T0 + tC, 12, 0.18), cam = { x: GL + 150, y: CH - 560, z: 1.5 * emp(u, 0.04), sx: tr[0], sy: tr[1] };
    const base = generalSolto({ x: GL, dir: -1 }), pega = generalSolto({ x: GL, dir: -1, mN: [-214, oG + 96], eN: [-120, oG + 150], torce: -0.5 }), P = mix(base, pega, k); P.abertaN = k < 0.5; P.maoAnN = lerp(1.3, Math.PI * 0.56, k); P.aneis = 0.2 + (peg ? 0.6 * Math.exp(-(u - tC) * 4) : 0); P.t = t;
    const S = B.esq(GENERAL.R, pega), ax = GL + 214 - 58, ay = CH + 4 + S.mN[1] + 2, diss = st(tC + 0.45, tC + 1.0, u);
    M.cena(t, cam, { foco: 0.8, frenteBlur: 16 }, g => {
      if (!peg) { const xa = lerp(ax + 1500, ax, u / tC); g.save(); g.translate(xa, ay); g.scale(-1, 1); rastro(g, 0, 0, 600, 0.9); B.flecha(g, [-196, 0], 0, { L: 196 }); g.restore(); }
      else if (diss < 1) { g.save(); g.translate(ax + 58, ay); g.scale(-1, 1); g.beginPath(); g.rect(58 - 236 * (1 - diss) - 4, -40, 236 * (1 - diss) + 30, 80); g.clip(); B.flecha(g, [58 - 196, 0], 0, { L: 196 }); g.restore(); }
      boneco(g, GENERAL, P);
      if (peg) { M.faiscas(g, t, T0 + tC, [ax + 40, ay], { n: 12, v: 160, dur: 0.28 }); for (let i = 0; i < 6; i++) M.cubinhos(g, t, T0 + tC + 0.45 + i * 0.08, [ax + 150 - i * 26, ay], { n: 7, v: 90, s: 11, dur: 0.55, seed: 70 + i, sobe: 80 }); }
    });
    M.acabamento(t, { flash: peg ? 0.2 * Math.exp(-(u - tC) * 30) : 0 });
  } },
  { id: 'A2-09d', dur: 1.3, fn(t, u) {                                      // pé no musgo: nenhuma folha seca
    const pas = eIO(cl(u / 0.9)), cam = { x: IL + 60 + 110 * pas, y: CH - 60, z: 3.3 };
    M.cena(t, cam, { foco: 1.6, frenteBlur: 22 }, g => { g.save(); g.fillStyle = 'rgba(52,120,96,0.55)'; g.beginPath(); g.ellipse(IL + 210, CH + 4, 120, 16, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(170,104,56,0.9)'; for (const dx of [40, 96, 330, 372]) { g.beginPath(); g.ellipse(IL + dx, CH + 2, 20, 8, dx, 0, TAU); g.fill(); } g.restore();
      boneco(g, IARA, iaraPe(t, { x: IL + 150 * pas, pF: [44 + 20 * Math.sin(pas * Math.PI), -46 * Math.sin(pas * Math.PI)], agacha: 26, lean: 0.14 })); });
    M.acabamento(t, { vinheta: 0.7 });
  } },
  { id: 'A2-09e', dur: 2.6, fn(t, u) {                                      // mais rápido: 2 pedras e 2 flechas ao mesmo tempo
    const T0 = t - u, tC = 1.25, peg = u >= tC, k = peg ? eOut((u - tC) / 0.034) : 0, tr = M.tremida(t, T0 + tC, 15, 0.2), cam = { x: GL + 60, y: CH - 520, z: 1.12 * emp(u, 0.04), sx: tr[0], sy: tr[1] };
    const base = generalSolto({ x: GL, dir: -1 }), pega = generalSolto({ x: GL, dir: -1, mN: [-224, oG + 60], eN: [-126, oG + 130], mF: [-170, oG + 210], eF: [-92, oG + 90], torce: -0.5 }), P = mix(base, pega, k); P.abertaN = P.abertaF = k < 0.5; P.maoAnN = P.maoAnF = lerp(1.3, Math.PI * 0.56, k); P.aneis = 0.25 + (peg ? 0.7 * Math.exp(-(u - tC) * 4) : 0); P.t = t;
    M.cena(t, cam, { foco: 0.3, frenteBlur: 14 }, g => {
      for (const [i, alvo, alt] of [[0, [GL - 380, CH], 420], [1, [GL - 620, CH], 520]]) { const kp = (u - 0.1 - i * 0.12) / 0.7; if (kp > 0 && kp < 1) pedra(g, arcoPedra(kp, [IL + 100, CH + oI - 40], alvo, alt)); else if (kp >= 1) { pedra(g, alvo); somNoChao(g, t, T0 + 0.8 + i * 0.12, alvo, 300); } }
      for (const [i, y] of [[0, CH + 4 + oG + 62], [1, CH + 4 + oG + 212]]) { const xa = GL + (i ? 170 : 224) - 58; if (!peg) { const x = lerp(xa + 1300, xa, cl((u - tC + 0.28) / 0.28)); if (u > tC - 0.28) { g.save(); g.translate(x, y); g.scale(-1, 1); rastro(g, 0, 0, 520, 0.9); B.flecha(g, [-196, 0], 0, { L: 196 }); g.restore(); } } else if (u < tC + 0.9) { g.save(); g.translate(xa + 58, y); g.scale(-1, 1); B.flecha(g, [58 - 196, 0], 0, { L: 196 }); g.restore(); M.faiscas(g, t, T0 + tC, [xa + 40, y], { n: 10, v: 150, dur: 0.26, seed: 5 + i }); } }
      boneco(g, GENERAL, P);
      boneco(g, IARA, iaraMira(u < tC - 0.3 ? 1 : 0, { x: IL + 150, lean: -0.08 }));
    });
    M.acabamento(t, { flash: peg ? 0.25 * Math.exp(-(u - tC) * 30) : 0 });
  } },
  { id: 'A2-09f', dur: 2.9, fn(t, u) {                                      // uma raspa a concha: o primeiro arranhão. Ele vira a cabeça, devagar
    const T0 = t - u, tA = 0.55, ris = u >= tA, vira = eIO(cl((u - 1.1) / 1.3)), tr = M.tremida(t, T0 + tA, 13, 0.2), cam = { x: GL + 10, y: CH + oG - 60, z: 3.1 * emp(u, 0.05), sx: tr[0], sy: tr[1] };
    M.cena(t, cam, { foco: 1.6, frenteBlur: 22 }, g => {
      boneco(g, GENERAL, generalSolto({ x: GL, dir: vira > 0.5 ? 1 : -1, vz: vira > 0.5 ? lerp(1, 0.5, (vira - 0.5) * 2) : lerp(0.5, 1, vira * 2), cabT: 0.04, aneis: ris ? 0.25 + 0.75 * vira : 0.2, t, eN: undefined, eF: undefined }));   // girando: o ik escolhe a dobra pela vista
      const c = [GL + 4, CH + 4 + oG - 128]; if (!ris) { const xa = lerp(c[0] + 1300, c[0] + 40, u / tA); g.save(); g.translate(xa, c[1] - 26); g.scale(-1, 1); rastro(g, 0, 0, 700, 0.95); B.flecha(g, [-196, 0], 0, { L: 196 }); g.restore(); }
      else { if (u < tA + 0.25) { const xa = c[0] + 40 - (u - tA) * 5200; g.save(); g.translate(xa, c[1] - 26 - (u - tA) * 700); g.scale(-1, 1); g.rotate(0.14); rastro(g, 0, 0, 700, 0.9); g.restore(); } M.faiscas(g, t, T0 + tA, [c[0] + 30, c[1] - 30], { n: 22, v: 260, dur: 0.4, an: Math.PI * 1.15, abre: 1.4, cor: '#fff3c8' });
        if (vira < 0.5) { g.save(); g.strokeStyle = '#dff4ff'; g.shadowColor = '#52c6ff'; g.shadowBlur = 10; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(c[0] + 34, c[1] - 34); g.lineTo(c[0] - 26, c[1] - 12); g.stroke(); g.restore(); } }
    });
    M.acabamento(t, { flash: ris ? 0.4 * Math.exp(-(u - tA) * 26) : 0, vinheta: 0.72 });
  } },
  { id: 'A2-09g', dur: 3.2, fn(t, u) {                                      // some, aparece ATRÁS dela; ela gira e atira à queima-roupa; ele pega entre dois dedos
    const T0 = t - u, tS = 0.5, tG = 1.05, tT = 1.5, gx = u < tS ? GL : IL + 290, some = u >= tS && u < tS + 2 / 60, gira = u >= tG, sol = u >= tT;
    if (u < 2.0) { const tr = M.tremida(t, T0 + tT, 12, 0.18), cam = { x: lerp(GL + 220, IL + 130, eIO(cl((u - 0.3) / 0.5))), y: CH - 500, z: 1.15 * emp(u, 0.03), sx: tr[0], sy: tr[1] };
      M.cena(t, cam, { foco: 0, frenteBlur: 12 }, g => {
        if (u >= tS) { M.cubinhos(g, t, T0 + tS, [GL, CH - 500], { n: 30, v: 200, s: 16, dur: 0.6, seed: 91 }); M.cubinhos(g, t, T0 + tS, [GL, CH - 200], { n: 20, v: 160, s: 14, dur: 0.5, seed: 92 }); }
        const pux = gira ? (sol ? 0 : eOut((u - tG) / 0.3)) : 0, P = gira ? iaraMira(pux, { x: IL + 150, dir: 1, expr: 'bravo', bal: 0.8 * Math.exp(-(u - tG) * 5) }) : iaraPe(t, { x: IL + 150, dir: -1, expr: u > tS ? 'susto' : 'bravo' });
        if (gira) P.frente = (gg, S) => arcoDe(gg, S, pux, { cor: '#1c1a22', ouro: '#d8b04a', L: 170, flecha: !sol }); if (u >= tG && u < tG + 0.1) linhasVel(g, t, [IL + 150, CH - 400], { n: 8, w: 300, h: 500 });
        if (!some) boneco(g, GENERAL, generalSolto({ x: gx, dir: u < tS ? -1 : -1, aneis: 0.3 + (sol ? 0.7 : 0), t, mN: sol ? [-150, oG + 40] : undefined, eN: sol ? [-110, oG + 130] : undefined, abertaN: true, curvaN: sol ? 0.9 : 0.3, maoAnN: sol ? Math.PI : 1.3 }));
        boneco(g, IARA, P);
        if (sol) { M.faiscas(g, t, T0 + tT, [gx - 150, CH + oG + 40], { n: 16, v: 200, dur: 0.3 }); M.anelSom(g, t, T0 + tT, [gx - 150, CH + oG + 40], { r: 200, dur: 0.4, n: 2 }); }
      });
      M.acabamento(t, { flash: sol ? 0.3 * Math.exp(-(u - tT) * 30) : (u >= tS ? 0.14 * Math.exp(-(u - tS) * 30) : 0) }); }
    else { const v = u - 2.0, g = X(), wob = Math.sin(v * 60) * Math.exp(-v * 6) * 0.03;                 // detalhe: a ponta parada entre dois dedos
      const cam = { x: IL + 230, y: CH + oG - 110, z: 3.4 * emp(v, 0.05) }; M.cena(t, cam, { foco: 2.2, frenteBlur: 24 }, gg => { boneco(gg, GENERAL, generalSolto({ x: IL + 290, dir: -1, aneis: 0.6 + 0.3 * Math.sin(t * 5), t, mN: [-78, oG + 326], mF: [84, oG + 326] })); });
      M.acabamento(t, { vinheta: 0.72 });
      g.save(); g.translate(520, 1010); g.rotate(wob); g.scale(3, 3); B.flecha(g, [-196, 0], 0, { L: 196 }); g.restore();
      const dedo = (pts, w) => { for (let i = 0; i < pts.length - 1; i++) B.forma(g, B.cap(pts[i], pts[i + 1], w[i], w[i + 1]), B.C(i % 2 ? '#474b55' : '#5d626e'), { tex: 0.04, rw: 4 }); for (let i = 1; i < pts.length - 1; i++) B.forma(g, B.elip(pts[i], w[i] + 6, w[i] + 6), B.C('#33363e'), { tex: 0.04, rw: 3 }); };
      B.forma(g, B.poli([[1080, 620], [900, 700], [860, 1010], [900, 1330], [1080, 1420]]), B.C('#33363e'), { tex: 0.04, rw: 4 });
      dedo([[930, 790], [760, 860], [640, 950], [596, 992]], [58, 50, 42, 30]); dedo([[930, 1240], [770, 1170], [650, 1076], [596, 1030]], [62, 54, 44, 32]);
      M.faiscas(g, t, T0 + 2.0, [590, 1010], { n: 12, v: 220, dur: 0.3 });
    }
  } },
  { id: 'A2-09h', dur: 1.6, semLegenda: true, fn(t, u) {                    // cortes de 6 quadros na visão dele, acelerando
    const T0 = t - u, cortes = [0, 0.2, 0.38, 0.54, 0.68, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5], i = cortes.findLastIndex(c => u >= c), R = rng(i * 13 + 7), cam = { x: IL + 60 + (R() - 0.5) * 300, y: CH - 500 + (R() - 0.5) * 160, z: 1.2 + R() * 0.9 };
    visao(t, cam, g => { boneco(g, IARA, iaraMira(R(), { x: IL + 150 + (R() - 0.5) * 300, dir: R() < 0.5 ? 1 : -1, alfa: 0.3 })); });
    const g = X(), p = [200 + R() * 680, 500 + R() * 800]; M.anelSom(g, t, T0 + cortes[i], p, { r: 300 + R() * 200, dur: 0.5, n: 3, w: 6, ach: 0.5 + R() * 0.5 }); M.anelSom(g, t, T0 + cortes[i] + 0.04, [W - p[0], p[1] + 200], { r: 200, dur: 0.4, n: 2, w: 4 });
  } },
  { id: 'A2-10', dur: 3.0, fn(t, u) {                                      // ele encosta no braço do arco dela: vira cubinho do pulso pra cima; levanta ela de novo
    const T0 = t - u, toca = eOut((u - 0.25) / 0.06), k = st(0.4, 1.7, u), ergue = eIO(cl((u - 1.8) / 0.8)), gx = IL + 290, ix = IL + 150, tr = M.tremida(t, T0 + 0.25, 10, 0.16), cam = { x: ix + 60, y: CH - 520 - 60 * ergue, z: 1.45 * emp(u, 0.04), sx: tr[0], sy: tr[1] };
    M.cena(t, cam, { foco: 0.6, frenteBlur: 16 }, g => {
      const P = iaraPe(t, { x: ix, dir: 1, expr: u < 0.3 ? 'bravo' : (u < 1.7 ? 'grita' : 'dor'), ar: IAR * ergue, mF: [150, oI + 20 - IAR * ergue], bal: 0.5 * ergue, pN: [-40, -30 * ergue], pF: [44, -12 * ergue], sombra: ergue < 0.3 });
      P.frente = (gg, S) => { if (k < 0.2) arcoDe(gg, S, 0, { cor: '#1c1a22', ouro: '#d8b04a', L: 170 }); };
      boneco(g, IARA, P);
      const S = B.esq(IARA.R, P), m = [ix + S.mF[0], CH + S.mF[1]], c = [ix + S.cotF[0], CH + S.cotF[1]], o = [ix + S.omF[0], CH + S.omF[1]], pt = k < 0.5 ? B.lv(m, c, k * 2) : B.lv(c, o, (k - 0.5) * 2);
      if (k > 0 && k < 1) { for (let i = 0; i < 4; i++) M.cubinhos(g, t, t - i * 0.05 - 0.01, pt, { n: 6, v: 70, s: 12, dur: 0.45, seed: 100 + i + Math.floor(t * 20), sobe: 50 }); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(82,198,255,0.85)'; for (let i = 0; i < 8; i++) { const R = rng(i + Math.floor(t * 30)); g.fillRect(Math.round((pt[0] - 26 + R() * 52) / 6) * 6, Math.round((pt[1] - 26 + R() * 52) / 6) * 6, 12, 12); } g.restore(); }
      boneco(g, GENERAL, generalSolto({ x: gx, dir: -1, aneis: 0.3, t, mN: [lerp(-78, -150, toca) + lerp(0, 20, ergue), oG + lerp(316, 150, toca) - 130 * ergue], eN: [lerp(-92, -110, toca), oG + lerp(166, 190, toca) - 40 * ergue], abertaN: ergue < 0.5, curvaN: 0.1 }));
    });
    M.acabamento(t, { flash: u >= 0.25 ? 0.18 * Math.exp(-(u - 0.25) * 30) : 0 });
  } },
  { id: 'A2-11', fala: { q: 'GEN', txt: 'Eliminação em dez. Nove.', telas: ['*ELIMINAÇÃO* EM DEZ.', '*NOVE.*'], pausa: 0.6 }, pos: 0.35, fn(t, u, p) {
    const T0 = t - u, gx = IL + 290, ix = IL + 150, d = p.F[0].d, t9 = p.F[0].u0 + d * 0.72, cam = { x: ix + 70, y: CH - 640, z: 1.5 * emp(u, 0.04) }, sil = [0, 1, 2, 3, 4, 5, 6].map(i => p.F[0].u0 + d * 0.52 * i / 7).concat([t9]);
    let an = 0.14; for (const s of sil) if (u >= s) an = Math.max(an, Math.exp(-(u - s) * 9));
    M.cena(t, cam, { foco: 0.6, frenteBlur: 16 }, g => { boneco(g, IARA, iaraPe(t, { x: ix, dir: 1, expr: 'dor', ar: IAR, bal: 0.4 + 0.3 * Math.sin(t * 1.8), pN: [-40, -30], pF: [44, -12], mF: [20, oI - IAR + 190], sombra: false })); boneco(g, GENERAL, generalSolto({ x: gx, dir: -1, aneis: an, t, mN: [-130, oG + 20], eN: [-110, oG + 150], abertaN: false })); for (const s of sil) M.anelSom(g, t, T0 + s, [gx - 14, CH + oG - 124], { r: 150, dur: 0.5, n: 1, w: 4, a: 0.5, ach: 1.15 }); });
    M.acabamento(t);
    numeroGrande(t, T0 + p.F[0].u0 + d * 0.3, T0 + t9, 10, { y: 470, rot: 'ELIMINAÇÃO EM' }); numeroGrande(t, T0 + t9, T0 + p.D, 9, { y: 470, rot: 'ELIMINAÇÃO EM' });
  } },
];
