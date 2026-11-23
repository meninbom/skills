// gerador.js — gerador de personagem v0: uma FICHA (corpo, cabeça, roupa, capa, extra, cores) vira um boneco pronto pro motor
// (mesmo esqueleto, trava, física, pano × chão, piscar e boca do boneco.js). Regra da casa: cabeça sempre coberta (capuz, gorro de aviador, touca).
import { TAU, lerp, cl, add, rot, lv, C, forma, cap, poli, elip, traco, perna, braco, rosto, noChao } from './boneco.js';

export const CORPOS = {
  crianca: { cabR: 76, pesc: 8, tronco: 146, ombro: 118, quadril: 66, braco: [84, 80], bw: [30, 27, 24], coxa: 98, canela: 92, pe: 26, peL: 34, lw: [44, 38, 32], maoS: 0.96 },
  jovem: { cabR: 68, pesc: 10, tronco: 164, ombro: 124, quadril: 74, braco: [98, 92], bw: [29, 26, 23], coxa: 128, canela: 120, pe: 28, peL: 37, lw: [43, 37, 31], maoS: 0.98 },
  adulto: { cabR: 60, pesc: 14, tronco: 184, ombro: 132, quadril: 84, braco: [112, 106], bw: [29, 26, 23], coxa: 164, canela: 156, pe: 30, peL: 40, lw: [42, 36, 30], maoS: 1.0 },
  forte: { cabR: 62, pesc: 16, tronco: 200, ombro: 172, quadril: 98, braco: [122, 116], bw: [40, 35, 30], coxa: 166, canela: 156, pe: 34, peL: 46, lw: [54, 45, 37], maoS: 1.16 },
};
const h2 = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
export const tom = (h, k) => '#' + h2(h).map(v => Math.round(cl(k > 0 ? v * (1 - k) : v + (255 - v) * -k, 0, 255)).toString(16).padStart(2, '0')).join('');

export function gerar(f) {
  const R = { ...CORPOS[f.corpo || 'jovem'], ...(f.R || {}) }, k = f.cores;
  const P = { pele: k.pele, pele2: tom(k.pele, 0.2), cabelo: k.cabelo || '#3a2418', roupa: k.roupa, roupa2: tom(k.roupa, 0.26), calca: k.calca, bota: k.bota, couro: k.couro || tom(k.bota, -0.15),
    capa: k.capa || k.roupa, chapeu: k.chapeu || k.roupa, extra: k.extra || k.couro || tom(k.bota, -0.15), acento: k.acento || '#e0b040', tinta: k.tinta || '#1c120c', metal: k.metal || '#c9a85a' };
  return { nome: f.nome, ficha: f, R, P, desenha(g, S, Q) { desenhaFicha(this, g, S, Q); } };
}

// pontos de um arco de elipse (a0 → a1), pra boné/touca cortados na testa
const arcoPts = (a0, a1, cx, cy, rx, ry, n = 22) => Array.from({ length: n + 1 }, (_, i) => { const a = lerp(a0, a1, i / n); return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });

function cabeca(g, ch, S, Q) {
  const f = ch.ficha, c = ch.P, R = S.R, vz = S.vz, costas = Q.vista === 'b', r = R.cabR, tipo = f.cabeca || 'capuz';
  const h = S.cab; g.save(); g.translate(h[0], h[1]); g.rotate(S.lean * 0.6 + (Q.cabT || 0));
  const olhosO = { expr: Q.expr, olha: Q.olha, tinta: C(c.tinta), sobr: C(c.cabelo), iris: f.olhos === 'iris' ? c.acento : null, olhoR: f.olhos === 'iris' ? 0.1 : undefined };
  if (tipo === 'capuz') {                                                // capuz fundo (mesma forma da Iara), rosto dentro da abertura
    const cx = costas ? 0 : -r * lerp(0.2, 0, vz), cor = c.chapeu;
    forma(g, gg => { gg.beginPath(); gg.moveTo(cx + r * 1.2, r * 0.5); gg.bezierCurveTo(cx + r * 1.38, -r * 0.6, cx + r * 0.8, -r * 1.42, cx - r * 0.1, -r * 1.4); gg.bezierCurveTo(cx - r * 0.9, -r * 1.4, cx - r * 1.5, -r * 0.9, cx - r * (costas || vz > 0.8 ? 1.38 : 1.86), -r * 0.2); gg.bezierCurveTo(cx - r * 1.3, r * 0.3, cx - r * 1.1, r * 0.9, cx - r * 0.7, r * 1.16); gg.lineTo(cx + r * 0.7, r * 1.16); gg.bezierCurveTo(cx + r * 1.0, r * 1.0, cx + r * 1.16, r * 0.8, cx + r * 1.2, r * 0.5); gg.closePath(); }, C(cor), { rw: 3 });
    if (!costas) {
      const fx = r * lerp(0.2, 0, vz), fc = [fx + r * lerp(0.08, 0, vz), r * 0.12];
      forma(g, elip([fx, r * 0.06], r * 0.98, r * 1.06), C(tom(cor, 0.62)), { rim: false, tex: 0 });
      forma(g, elip(fc, r * 0.82, r * 0.9), C(c.pele), { rw: 2 });
      g.save(); g.beginPath(); g.ellipse(fc[0], fc[1], r * 0.82, r * 0.9, 0, 0, TAU); g.clip(); g.fillStyle = 'rgba(8,12,16,0.4)'; g.beginPath(); g.ellipse(fx, -r * 0.82, r * 1.1, r * 0.56, 0, 0, TAU); g.fill(); g.restore();
      rosto(g, [fc[0], r * 0.16], r * 0.82, vz, olhosO);
    }
  } else {
    const av = tipo === 'aviador', cor = c.chapeu;
    if (!costas) {                                                       // rosto + orelha
      forma(g, elip([0, 0], r * 0.94, r), C(c.pele));
      if (!av) { if (vz < 0.8) forma(g, elip([-r * lerp(0.3, 0.9, vz), r * 0.12], r * 0.15, r * 0.2), C(c.pele2), { tex: 0, rw: 1.5 }); else for (const s of [-1, 1]) forma(g, elip([s * r * 0.92, r * 0.12], r * 0.13, r * 0.2), C(c.pele2), { tex: 0, rw: 1.5 }); }
      forma(g, elip([r * lerp(0.62, 0.42, vz), r * 0.3], r * 0.13, r * 0.08), C(tom(c.pele, -0.1)), { tex: 0, rim: false });          // bochecha
      if (vz > 0.8) forma(g, elip([-r * 0.42, r * 0.3], r * 0.13, r * 0.08), C(tom(c.pele, -0.1)), { tex: 0, rim: false });
      rosto(g, [0, 0], r, vz, olhosO);
    } else forma(g, elip([0, 0], r * 0.94, r), C(c.pele2));
    // boné/touca: arco de elipse cortado numa reta na testa (de perfil a reta desce até a nuca)
    const a0 = costas ? (av ? 0.75 : 0.55) : lerp(av ? -0.5 : -0.62, av ? -0.42 : -0.52, vz), a1 = costas ? -Math.PI - (av ? 0.75 : 0.55) : lerp(av ? -3.89 : -3.74, av ? -2.72 : -2.62, vz);
    const cx = -r * 0.06 * (1 - vz), cy = av ? -r * 0.05 : -r * 0.1, pts = arcoPts(a0, a1, cx, cy, r * 1.03, r * (av ? 1.04 : 1.12));
    if (!av) { const top = [cx, cy - r * 1.12]; forma(g, elip(add(top, [0, -r * 0.1]), r * 0.22, r * 0.2), C(c.acento)); }   // pompom
    forma(g, poli(pts), C(cor), { rw: 3 });
    if (!av) for (let i = 1; i < 6; i++) { const u = i / 6, a = pts[Math.round(u * (pts.length - 1))]; traco(g, [lv(a, [cx, cy - r * 1.1], 0.08), lv(a, [cx, cy - r * 1.1], 0.62)], C(tom(cor, 0.18)), 2.2); }
    const b0 = pts[0], b1 = pts[pts.length - 1];
    traco(g, [b0, b1], C(av ? tom(cor, 0.3) : tom(cor, -0.12)), r * (av ? 0.15 : 0.26));                                              // aba / dobra da touca
    if (av) {
      const orelha = s => { const p = s ? [s * r * 0.9, r * 0.24] : [-r * lerp(0.3, 0.9, vz), r * 0.22]; forma(g, gg => { gg.beginPath(); gg.roundRect(p[0] - r * 0.2, p[1] - r * 0.36, r * 0.4, r * 0.66, r * 0.18); }, C(cor), { rw: 2 }); traco(g, [[p[0], p[1] + r * 0.28], [p[0] + (s ? -s : 1) * r * 0.08, p[1] + r * 0.5]], C(tom(cor, 0.35)), 3); };
      if (costas || vz > 0.8) { orelha(-1); orelha(1); } else orelha(0);
      if (!costas) {                                                     // óculos de aviador em cima da aba
        const lentes = vz > 0.8 ? [[0.3, 1], [0.7, 1]] : [[lerp(0.06, 0.18, vz * 2), 1], [lerp(0.06, 0.44, vz * 2), lerp(0.5, 0.86, vz * 2)]];
        traco(g, [b0, b1], C('#3a2a1e'), r * 0.07);
        for (const [u, sc] of vz < 0.2 ? [lentes[0]] : lentes) { const p = add(lv(b0, b1, u), [0, -r * 0.13]), rx = r * 0.18 * sc * lerp(0.55, 1, Math.min(1, vz * 1.6)), ry = r * 0.17;
          forma(g, elip(p, rx + 4, ry + 4), C(c.metal), { tex: 0, rw: 1.6 }); forma(g, elip(p, rx, ry), C('#6fb6c8'), { tex: 0, rim: false });
          g.save(); g.globalAlpha = 0.85; g.fillStyle = '#e8fbff'; g.beginPath(); g.ellipse(p[0] - rx * 0.3, p[1] - ry * 0.35, rx * 0.28, ry * 0.2, -0.5, 0, TAU); g.fill(); g.restore(); }
      }
    }
  }
  g.restore();
}

function desenhaFicha(ch, g, S, Q) {
  const R = S.R, c = ch.P, f = ch.ficha, vz = S.vz, costas = Q.vista === 'b', bal = Q.bal || 0, voo = cl(Q.voo || 0, -0.35, 1), vento = Q.vento || 0;
  const tw = lerp(0.72, 1, vz) * R.ombro / 2 + 10, bw = tw + 6, T = -R.tronco, fx = lerp(tw * 0.78, 0, vz);
  const pernaO = () => ({ coxa: c.calca, bota: c.bota, botaH: f.botaH ?? 0.42, punho: c.couro, sola: tom(c.bota, 0.55) });
  const manga = f.manga ?? 1.72;
  const bracoO = n => ({ cima: c.roupa, baixo: c.pele, pele: f.luvas ? c.couro : c.pele, manga, mangaCor: c.roupa, aberta: Q['aberta' + n], maoAn: Q['maoAn' + n], curva: Q.curva,
    extra: (gg, e) => { const fim = lv(e.co, e.m, manga - 1); forma(gg, cap(lv(e.co, e.m, manga - 1.1), fim, R.bw[1] / 2 + 3.5), C(c.roupa2, e.dk), { tex: 0, rim: e.dk ? false : undefined }); } });
  const emTronco = (fn, giro = S.lean) => { g.save(); g.translate(S.pel[0], S.pel[1]); g.rotate(giro); fn(); g.restore(); };

  const capa = dk => { if (!f.capa) return; g.save(); g.translate(S.peito[0], S.peito[1]); g.rotate(S.lean * 0.7);
    const w = lerp(0.72, 1.08, vz) * R.ombro / 2 + 16, L = (f.capa === 'longa' ? R.tronco + R.coxa + R.canela * 0.55 : R.tronco + R.coxa * 0.3) * (1 - 0.4 * voo), d = costas ? 0 : -lerp(34, 0, vz), sw = bal * 34 - vento * L * 0.22;
    forma(g, noChao(gg => { gg.beginPath(); gg.moveTo(d - w * 0.7, -10); gg.lineTo(d + w * 0.7, -10); gg.quadraticCurveTo(d + w * 1.0, L * 0.35, d + w * 0.92 + sw, L); gg.lineTo(d + w * 0.36 + sw * 1.1, L - 16); gg.lineTo(d - w * 0.2 + sw * 1.2, L + 4); gg.lineTo(d - w * 0.96 + sw * 1.3, L - 10); gg.quadraticCurveTo(d - w * 1.06, L * 0.35, d - w * 0.7, -10); gg.closePath(); }), C(costas ? c.capa : tom(c.capa, 0.22), dk), { tex: 0.08 });
    if (costas) for (const u of [-0.45, 0.02, 0.44]) traco(g, [[d + w * u, 10], [d + w * u * 1.25 + sw * 0.9, L * 0.85]], C(tom(c.capa, 0.25)), 2.5);
    g.restore(); };
  const mochila = dk => { if (f.extra !== 'mochila') return; const mw = lerp(30, 56, vz), mh = R.tronco * 0.6; g.save(); const b = S.T([costas ? 0 : -lerp(tw + mw * 0.45, 0, vz), -R.tronco * 0.54]); g.translate(b[0], b[1]); g.rotate(S.lean);
    forma(g, gg => { gg.beginPath(); gg.roundRect(-mw, -mh / 2, mw * 2, mh, 16); }, C(c.extra, dk)); forma(g, gg => { gg.beginPath(); gg.roundRect(-mw * 0.8, mh * 0.06, mw * 1.6, mh * 0.36, 10); }, C(tom(c.extra, 0.16), dk), { rw: 1.6 });
    forma(g, gg => { gg.beginPath(); gg.moveTo(-mw, -mh / 2 + 16); gg.quadraticCurveTo(0, -mh / 2 - 10, mw, -mh / 2 + 16); gg.lineTo(mw, -mh * 0.12); gg.quadraticCurveTo(0, -mh * 0.02, -mw, -mh * 0.12); gg.closePath(); }, C(tom(c.extra, -0.08), dk), { rw: 1.6 });
    g.fillStyle = C(c.metal, dk); g.beginPath(); g.arc(0, -mh * 0.07, 5, 0, TAU); g.fill(); g.restore(); };

  // atrás de tudo
  if (!costas) { mochila(0.3); capa(0.3); }
  if (f.roupa === 'casaco') emTronco(() => { const comp = (R.coxa + R.canela * 0.35) * (1 - 0.45 * voo);       // cauda do casaco atrás das pernas
    forma(g, noChao(gg => { gg.beginPath(); gg.moveTo(-bw + 4, -20); gg.lineTo(bw - 4, -20); gg.lineTo(bw + 12 + bal * 30, comp); gg.lineTo(bw * 0.3 + bal * 34, comp - 14); gg.lineTo(-bw * 0.2 + bal * 38, comp + 4); gg.lineTo(-bw - 14 + bal * 44 - vento * 30, comp - 6); gg.closePath(); }), C(c.roupa2, costas ? 0 : 0.25)); }, S.lean * 0.5 + bal * 0.1);
  if (vz < 0.8) braco(g, S, 'F', bracoO('F'));
  perna(g, S, 'F', pernaO()); perna(g, S, 'N', pernaO());
  // tronco: jaqueta (curta), túnica (até a coxa) ou casaco (corpo + cauda)
  emTronco(() => {
    const barra = f.roupa === 'tunica' ? 46 : f.roupa === 'casaco' ? 40 : 16;
    forma(g, noChao(gg => { gg.beginPath(); gg.moveTo(-tw, T + 14); gg.quadraticCurveTo(-tw, T - 2, -tw + 18, T - 4); gg.lineTo(tw - 18, T - 4); gg.quadraticCurveTo(tw, T - 2, tw, T + 14); gg.lineTo(bw, barra - 8); gg.quadraticCurveTo(bw, barra, bw - 10, barra); gg.lineTo(-bw + 10, barra); gg.quadraticCurveTo(-bw, barra, -bw, barra - 8); gg.closePath(); }), C(c.roupa));
    g.save(); g.globalAlpha = 0.22; g.fillStyle = '#04080e'; g.beginPath(); g.moveTo(tw * 0.3, T); g.lineTo(tw, T + 14); g.lineTo(bw, barra); g.lineTo(bw * 0.45, barra); g.closePath(); g.fill(); g.restore();
    if (f.roupa === 'jaqueta') { traco(g, [[-bw + 6, barra - 6], [bw - 6, barra - 6]], C(c.roupa2), 12, { cap: 'butt' }); if (!costas) { traco(g, [[fx, T + 4], [fx, barra - 10]], C(tom(c.roupa, 0.4)), 3); forma(g, gg => { gg.beginPath(); gg.roundRect(fx - 4, T + 30, 8, 16, 3); }, C(c.metal), { tex: 0, rw: 1 }); } }
    else { forma(g, gg => { gg.beginPath(); gg.roundRect(-bw + 3, -12, bw * 2 - 6, 17, 6); }, C(c.couro)); if (!costas) forma(g, gg => { gg.beginPath(); gg.roundRect(lerp(8, -9, vz), -15, 18, 23, 4); }, C(c.metal), { tex: 0 }); traco(g, [[-bw + 8, barra - 9], [bw - 8, barra - 9]], C(c.roupa2), 2, { dash: [7, 6] }); }
    if (!costas && f.emblema) { const ex = lerp(tw * 0.3, -tw * 0.42, vz), ey = T + 50, sx = lerp(0.55, 1, vz);
      if (f.emblema === 'envelope') { forma(g, gg => { gg.beginPath(); gg.roundRect(ex - 15 * sx, ey - 10, 30 * sx, 21, 3); }, C(c.acento), { tex: 0, rw: 1.4 }); traco(g, [[ex - 14 * sx, ey - 8], [ex, ey + 2], [ex + 14 * sx, ey - 8]], C(tom(c.acento, 0.45)), 2); }
      else { g.fillStyle = C(c.acento); g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 6 : 14; g.lineTo(ex + Math.cos(a) * rr * sx, ey + Math.sin(a) * rr); } g.closePath(); g.fill(); } }
    if (f.extra === 'mochila' && !costas) for (const s of vz > 0.8 ? [-1, 1] : [1]) traco(g, [[s * tw * lerp(0.1, 0.5, vz) + lerp(-tw * 0.1, 0, vz), T - 2], [s * tw * lerp(0.22, 0.56, vz) + lerp(-tw * 0.18, 0, vz), T * 0.3]], C(tom(c.extra, 0.2)), 10, { cap: 'butt' });
    if (f.extra === 'bolsa') { const sa = costas ? [tw - 6, T + 4] : [-tw + 6, T + 4], sb = costas ? [-tw + 2, -18] : [tw - 2, -18]; traco(g, [sa, sb], C(tom(c.extra, 0.15)), 10, { cap: 'butt' });
      const bx = costas ? -lerp(0, tw * 0.75, vz) : lerp(0, tw * 0.75, vz), bwd = lerp(30, 48, vz); forma(g, gg => { gg.beginPath(); gg.roundRect(bx - bwd / 2, -26, bwd, 46, 8); }, C(c.extra)); forma(g, gg => { gg.beginPath(); gg.roundRect(bx - bwd / 2 - 1, -28, bwd + 2, 22, 7); }, C(tom(c.extra, -0.1)), { rw: 1.4 }); g.fillStyle = C(c.metal); g.beginPath(); g.arc(bx, -8, 4, 0, TAU); g.fill(); }
  });
  // gola / cachecol
  if (f.cachecol) { forma(g, elip(add(S.pesc, rot([lerp(6, 0, vz), 10], S.lean)), lerp(40, 52, vz), 22, S.lean), C(c.acento));
    if (!costas && vz < 0.8) { const vy = vento * 30 + bal * 16; forma(g, poli([add(S.pesc, [-30, 6]), add(S.pesc, [-62 - vento * 40, 40 - vy]), add(S.pesc, [-40 - vento * 34, 48 - vy * 0.7]), add(S.pesc, [-16, 22])]), C(c.acento, 0.2)); } }
  else forma(g, elip(add(S.pesc, rot([lerp(4, 0, vz), 8], S.lean)), lerp(30, 40, vz), 14, S.lean), C(c.roupa2));
  cabeca(g, ch, S, Q);
  if (costas) { mochila(0); capa(0); }
  if (vz < 0.8) braco(g, S, 'N', bracoO('N')); else { braco(g, S, 'F', bracoO('F')); braco(g, S, 'N', bracoO('N')); }
}

// sorteio: paletas fechadas (escolhidas à mão, nada de cor solta) + combinação de peças
const PALETAS = [
  { pele: '#c98a5e', roupa: '#c8772f', calca: '#3b3f4f', bota: '#5a3a24', capa: '#2f5d6b', chapeu: '#6b4630', extra: '#7a4a2a', acento: '#e8d8a8' },
  { pele: '#8a5532', roupa: '#3f6e8c', calca: '#4a3a2e', bota: '#2e2420', capa: '#9c3b30', chapeu: '#2c4a5e', extra: '#a0703e', acento: '#e0b040' },
  { pele: '#e3a06a', roupa: '#6e8a3c', calca: '#5a4636', bota: '#6a4428', capa: '#d8c8a0', chapeu: '#4a5a2a', extra: '#8a5a36', acento: '#d0503a' },
  { pele: '#b47548', roupa: '#8a3b4a', calca: '#2e3440', bota: '#3a2a22', capa: '#c9a24a', chapeu: '#5a2a34', extra: '#6a4a3a', acento: '#e8e0c8' },
  { pele: '#f0b98a', roupa: '#d9cfb8', calca: '#5c6a7a', bota: '#4a3a30', capa: '#3d5a40', chapeu: '#a65a3a', extra: '#7a5a40', acento: '#3f7fa8' },
  { pele: '#6e4228', roupa: '#d4a23a', calca: '#3a4a3e', bota: '#2a2018', capa: '#5a3a6a', chapeu: '#8a5a2e', extra: '#5a4a3a', acento: '#f0ead8' },
];
const NOMES = ['tito', 'luma', 'bento', 'kira', 'davi', 'nina', 'otto', 'ayla', 'caio', 'zeca', 'mel', 'ravi'];
const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
export function sorteia(seed) {
  const r = rng(seed * 9973 + 17), um = a => a[Math.floor(r() * a.length)], cabeca = um(['capuz', 'aviador', 'touca']);
  return { nome: um(NOMES) + '-' + seed, corpo: um(['crianca', 'jovem', 'jovem', 'adulto', 'forte']), cabeca, roupa: um(['jaqueta', 'tunica', 'casaco']), capa: um([null, null, 'curta', 'longa']),
    extra: um([null, 'mochila', 'bolsa']), cachecol: cabeca !== 'capuz' && r() < 0.5, emblema: um([null, 'estrela', 'envelope']), olhos: r() < 0.3 ? 'iris' : 'ponto', luvas: r() < 0.3, cores: { ...um(PALETAS) } };
}

// 1º personagem feito na mão com a ficha
export const ROSA_FICHA = { nome: 'rosa', corpo: 'jovem', cabeca: 'aviador', roupa: 'jaqueta', capa: 'curta', extra: 'bolsa', emblema: 'envelope', olhos: 'ponto',
  cores: { pele: '#c98a5e', cabelo: '#3a2418', roupa: '#c8772f', calca: '#3b3f4f', bota: '#5a3a24', couro: '#7a4a2a', capa: '#2f5d6b', chapeu: '#6b4630', extra: '#7a4a2a', acento: '#e8d8a8', metal: '#c9a85a' } };
