// elenco.js — Iara (Ranger) e General no mesmo padrão do boneco.js
import { TAU, lerp, cl, add, rot, lv, C, forma, cap, poli, elip, traco, perna, braco, rosto, noChao, chaoCtx } from './boneco.js';

// IARA — casaco verde comprido de capuz, olhos âmbar, trança branca, ombreiras de folha de cobre
export const IARA = {
  nome: 'iara',
  R: { cabR: 60, pesc: 14, tronco: 184, ombro: 132, quadril: 84, braco: [112, 106], bw: [29, 26, 23], coxa: 164, canela: 156, pe: 30, peL: 40, lw: [42, 36, 30], maoS: 1.0 },
  P: { pele: '#a8693f', pele2: '#8a5230', casaco: '#2f6240', casaco2: '#234a31', dentro: '#12241a', cobre: '#c0723c', cobre2: '#8f4f28', ouro: '#d8b04a', couro: '#6a4428', calca: '#4a3526', bota: '#5a3a24', tranca: '#ece8dc', tinta: '#1c120c', iris: '#ffb22e', pena: '#e9e2cc' },
  desenha(g, S, P) {
    const R = S.R, c = this.P, vz = S.vz, costas = P.vista === 'b', bal = P.bal || 0;      // bal: balanço da saia e da trança
    const pernaO = () => ({ coxa: c.calca, bota: c.bota, botaH: 0.62, punho: c.couro, sola: '#2a1a10' });
    const bracoO = n => ({ cima: c.casaco, baixo: c.casaco, pele: c.pele, bracal: c.couro, aberta: P['aberta' + n], maoAn: P['maoAn' + n], curva: P.curva,
      extra: (gg, e) => { if (!e.dk) traco(gg, [lv(e.co, e.m, 0.42), lv(e.co, e.m, 0.76)], C(c.ouro), 3); } });
    const aljava = () => { g.save(); const b = S.T([-(costas ? 0 : 1) * lerp(40, 14, vz) + (costas ? 30 : 0), -R.tronco * 0.6]); g.translate(b[0], b[1]); g.rotate(S.lean + (costas ? 0.3 : -0.3));
      for (let i = 0; i < 5; i++) { const x = -14 + i * 7; traco(g, [[x, -80], [x + (i - 2) * 3, -128 - (i % 2) * 9]], C('#c9a878', 0.3), 3); forma(g, poli([[x - 5 + (i - 2) * 3, -120 - (i % 2) * 9], [x + (i - 2) * 3, -146 - (i % 2) * 9], [x + 5 + (i - 2) * 3, -120 - (i % 2) * 9]]), C(c.pena, 0.15), { tex: 0, rw: 1.4 }); }
      forma(g, gg => { gg.beginPath(); gg.roundRect(-20, -86, 40, 150, 10); }, C(c.couro, costas ? 0 : 0.3)); traco(g, [[-20, -64], [20, -64]], C(c.ouro, 0.2), 4, { cap: 'butt' }); g.restore(); };
    if (!costas) aljava();
    // cauda do casaco (atrás das pernas)
    const tw = lerp(0.74, 1, vz) * R.ombro / 2 + 8, bw = tw + 12, comp = (R.coxa + R.canela * 0.42) * (1 - 0.45 * cl(P.voo || 0, -0.35, 1));   // voo > 0: o ar levanta o pano (caindo); < 0: pano atrasado esticando (subindo). Passou do chão? o noChao deita
    g.save(); g.translate(S.pel[0], S.pel[1]); g.rotate(S.lean * 0.5 + bal * 0.1);
    forma(g, noChao(gg => { gg.beginPath(); gg.moveTo(-bw + 4, -20); gg.lineTo(bw - 4, -20); gg.lineTo(bw + 14 + bal * 30, comp); gg.lineTo(bw * 0.3 + bal * 34, comp - 16); gg.lineTo(-bw * 0.2 + bal * 38, comp + 4); gg.lineTo(-bw - 16 + bal * 44, comp - 6); gg.closePath(); }), C(c.casaco2, costas ? 0 : 0.25));
    g.restore();
    if (vz < 0.8) { braco(g, S, 'F', bracoO('F')); perna(g, S, 'F', pernaO()); perna(g, S, 'N', pernaO()); }
    else { perna(g, S, 'F', pernaO()); perna(g, S, 'N', pernaO()); }
    // tronco do casaco
    g.save(); g.translate(S.pel[0], S.pel[1]); g.rotate(S.lean);
    forma(g, noChao(gg => { gg.beginPath(); gg.moveTo(-tw, -R.tronco + 16); gg.quadraticCurveTo(-tw, -R.tronco - 2, -tw + 18, -R.tronco - 4); gg.lineTo(tw - 18, -R.tronco - 4); gg.quadraticCurveTo(tw, -R.tronco - 2, tw, -R.tronco + 16); gg.lineTo(bw - 6, 40); gg.lineTo(bw * 0.36, 56); gg.lineTo(lerp(8, 0, vz), 30); gg.lineTo(-bw * 0.4, 58); gg.lineTo(-bw + 6, 40); gg.closePath(); }), C(c.casaco));
    g.save(); g.globalAlpha = 0.24; g.fillStyle = '#020c06'; { const gc = chaoCtx(g); gc.beginPath(); gc.moveTo(tw * 0.34, -R.tronco); gc.lineTo(tw, -R.tronco + 16); gc.lineTo(bw - 6, 40); gc.lineTo(bw * 0.36, 56); gc.closePath(); } g.fill(); g.restore();
    if (!costas) { const fx = lerp(18, 0, vz); for (let i = 0; i < 4; i++) { const y = -R.tronco + 44 + i * 30; traco(g, [[fx - 16, y], [fx + 16, y]], C(c.couro), 6); for (const sx of [-16, 16]) { g.fillStyle = C(c.ouro); g.beginPath(); g.arc(fx + sx, y, 4.2, 0, TAU); g.fill(); } }
      traco(g, [[fx, -R.tronco + 30], [fx, 26]], C(c.casaco2), 2); }
    forma(g, gg => { gg.beginPath(); gg.roundRect(-bw + 8, -16, bw * 2 - 16, 18, 6); }, C(c.couro)); forma(g, gg => { gg.beginPath(); gg.roundRect(lerp(10, -10, vz), -20, 20, 26, 4); }, C(c.ouro), { tex: 0 });
    g.restore();
    if (costas) aljava();
    // ombreiras de folha
    const folhas = (om, sg, dk) => { const leaf = (p, an, L, W, cor) => forma(g, gg => { gg.save(); gg.translate(p[0], p[1]); gg.rotate(an); gg.beginPath(); gg.moveTo(0, -L * 0.3); gg.quadraticCurveTo(W, 0, 0, L); gg.quadraticCurveTo(-W, 0, 0, -L * 0.3); gg.restore(); }, C(cor, dk), { tex: 0, rw: 1.4, rim: dk ? false : undefined });
      for (let r = 2; r >= 0; r--) for (let i = 0; i < 3 + r; i++) { const u = (i / (2 + r) - 0.5), p = add(om, [u * (30 + r * 14) - sg * 2, -12 + r * 13 - Math.abs(u) * 8]); leaf(p, u * 0.9 + S.lean, 24 + r * 3, 11, (r + i) % 2 ? c.cobre : c.cobre2); } };
    if (vz < 0.8) folhas(S.omF, 1, 0.5);
    // capuz + rosto
    const h = S.cab, r = R.cabR; g.save(); g.translate(h[0], h[1]); g.rotate(S.lean * 0.6 + (P.cabT || 0));
    const cx = costas ? 0 : -r * lerp(0.2, 0, vz);
    forma(g, gg => { gg.beginPath(); gg.moveTo(cx + r * 1.2, r * 0.5); gg.bezierCurveTo(cx + r * 1.38, -r * 0.6, cx + r * 0.8, -r * 1.42, cx - r * 0.1, -r * 1.4); gg.bezierCurveTo(cx - r * 0.9, -r * 1.4, cx - r * 1.5, -r * 0.9, cx - r * (costas || vz > 0.8 ? 1.38 : 1.86), -r * 0.2); gg.bezierCurveTo(cx - r * 1.3, r * 0.3, cx - r * 1.1, r * 0.9, cx - r * 0.7, r * 1.16); gg.lineTo(cx + r * 0.7, r * 1.16); gg.bezierCurveTo(cx + r * 1.0, r * 1.0, cx + r * 1.16, r * 0.8, cx + r * 1.2, r * 0.5); gg.closePath(); }, C(c.casaco), { rw: 3 });
    if (!costas) {
      const fx = r * lerp(0.2, 0, vz); forma(g, elip([fx, r * 0.06], r * 0.98, r * 1.06), C(c.dentro), { rim: false, tex: 0 });
      forma(g, elip([fx + r * lerp(0.08, 0, vz), r * 0.12], r * 0.82, r * 0.9), C(c.pele), { rw: 2 });
      g.save(); g.beginPath(); g.ellipse(fx + r * lerp(0.08, 0, vz), r * 0.12, r * 0.82, r * 0.9, 0, 0, TAU); g.clip(); g.fillStyle = 'rgba(8,16,10,0.42)'; g.beginPath(); g.ellipse(fx, -r * 0.82, r * 1.1, r * 0.56, 0, 0, TAU); g.fill(); g.restore();
      rosto(g, [fx + r * lerp(0.08, 0, vz), r * 0.16], r * 0.82, vz, { expr: P.expr, olha: P.olha, tinta: C(c.tinta), iris: P.irisOff ? null : c.iris, olhoR: 0.1 });
    }
    g.restore();
    if (!costas) { // trança
      const b0 = add(h, rot([r * lerp(-0.28, 0.62, vz), r * 1.2], S.lean * 0.6)); for (let i = 0; i < 6; i++) { const p = add(b0, [Math.sin(i * 0.5 + bal * 2) * 4 + bal * i * 7 + i * lerp(3, 0, vz), i * 21]); forma(g, elip(p, 11 - i * 0.6, 13, i % 2 ? 0.5 : -0.5), C(c.tranca), { tex: 0, rw: 1.5 }); }
      forma(g, elip(add(b0, [bal * 42 + 6 * lerp(3, 0, vz), 6 * 21 - 4]), 6, 5), C(c.couro), { tex: 0, rw: 1 }); }
    folhas(S.omN, -1, 0); if (vz > 0.8) folhas(S.omF, 1, 0);
    if (vz < 0.8) braco(g, S, 'N', bracoO('N')); else { braco(g, S, 'F', bracoO('F')); braco(g, S, 'N', bracoO('N')); }
  },
};

// GENERAL — armadura cinza-escura angulosa, capuz-elmo, cara de concha com anéis (sem olho), capa rasgada
export const GENERAL = {
  nome: 'general',
  R: { cabR: 62, pesc: 18, tronco: 250, ombro: 204, quadril: 104, braco: [168, 160], bw: [42, 36, 30], coxa: 236, canela: 228, pe: 40, peL: 56, lw: [58, 46, 38], maoS: 1.3 },
  P: { aco: '#474b55', aco2: '#33363e', aco3: '#5d626e', breu: '#101216', capa: '#3a3d45', capa2: '#2a2c33', anel: '#52c6ff' },
  concha(g, c, r, vz, aneis = 0, t = 0) {                                  // a cara: concha funda com anéis concêntricos
    const cx = c[0] + r * lerp(0.22, 0, vz), sx = lerp(0.62, 1, vz);
    forma(g, elip([cx, c[1] + r * 0.08], r * 0.86 * sx, r * 1.0), C(this.P.breu), { rim: false, tex: 0 });
    for (let i = 0; i < 5; i++) { const k = i / 5, rr = r * (0.82 - k * 0.74), on = cl(aneis * 6 - (4 - i)), puls = 0.75 + 0.25 * Math.sin(t * 9 - i * 0.9);
      g.save(); g.beginPath(); g.ellipse(cx + r * 0.05 * k * (1 - vz), c[1] + r * (0.08 + k * 0.05), rr * sx, rr * 1.12, 0, 0, TAU);
      g.strokeStyle = C('#2a2e37'); g.lineWidth = 2.4; g.stroke();
      if (on > 0) { g.globalCompositeOperation = 'lighter'; g.shadowColor = this.P.anel; g.shadowBlur = 16; g.strokeStyle = this.P.anel; g.globalAlpha = on * puls; g.lineWidth = 3; g.stroke(); }
      g.restore(); }
  },
  desenha(g, S, P) {
    const R = S.R, c = this.P, vz = S.vz, costas = P.vista === 'b', bal = P.bal || 0;
    const pernaO = () => ({ coxa: c.aco2, bota: c.aco, botaH: 0.56, sola: '#0c0d10', tex: 0.04,
      extra: (gg, e) => { forma(gg, poli([add(e.jo, [-20, -26]), add(e.jo, [22, -22]), add(e.jo, [16, 26]), add(e.jo, [-14, 22])]), C(c.aco3, e.dk), { tex: 0.04, rim: e.dk ? false : undefined }); } });
    const bracoO = n => ({ cima: c.aco2, baixo: c.aco2, pele: c.aco, bracal: c.aco, aberta: P['aberta' + n] ?? true, maoAn: P['maoAn' + n], curva: P['curva' + n] ?? 0.25, tex: 0.04, dobra: '#0c0d10' });
    // capa rasgada
    const capa = dk => { g.save(); g.translate(S.peito[0], S.peito[1]); g.rotate(S.lean * 0.7); const w = lerp(0.8, 1.15, vz) * R.ombro / 2 + 26, L = (R.tronco + R.coxa * 0.55) * (1 - 0.35 * cl(P.voo || 0, -0.35, 1)), d = costas ? 0 : -lerp(50, 0, vz);
      forma(g, noChao(gg => { gg.beginPath(); gg.moveTo(d - w * 0.72, -16); gg.lineTo(d + w * 0.72, -16); gg.quadraticCurveTo(d + w * 1.05, L * 0.3, d + w * 0.86 + bal * 26, L * 0.78); const n = 9; for (let i = 0; i <= n; i++) { const u = i / n, x = d + w * 0.86 - (w * 1.9) * u + bal * (30 + u * 30), y = L * (0.84 + 0.2 * Math.sin(u * 3.1)) + (i % 2 ? -30 : 8) + Math.sin(i * 2.3) * 14; gg.lineTo(x, y); } gg.quadraticCurveTo(d - w * 1.12 + bal * 20, L * 0.3, d - w * 0.72, -16); gg.closePath(); }), C(costas ? c.capa : c.capa2, dk), { tex: 0.1 });
      if (costas) for (const u of [-0.4, 0.05, 0.42]) traco(g, [[d + w * u, 6], [d + w * u * 1.3 + bal * 30, L * 0.8]], C(c.capa2), 2.5);
      g.restore(); };
    capa(costas ? 0 : 0.3);
    if (vz < 0.8) { braco(g, S, 'F', bracoO('F')); perna(g, S, 'F', pernaO()); perna(g, S, 'N', pernaO()); } else { perna(g, S, 'F', pernaO()); perna(g, S, 'N', pernaO()); }
    if (costas) { capa(0); }
    else {
      g.save(); g.translate(S.pel[0], S.pel[1]); g.rotate(S.lean); const tw = lerp(0.7, 1, vz) * R.ombro / 2, T = -R.tronco, o4 = { tex: 0.04 };
      forma(g, poli([[-tw * 0.7, 10], [tw * 0.7, 10], [tw * 0.6, T * 0.36], [-tw * 0.6, T * 0.36]]), C(c.aco2), o4); for (const y of [T * 0.26, T * 0.16]) traco(g, [[-tw * 0.6, y], [tw * 0.6, y]], C('#1c1e24'), 2.5);                         // cintura
      forma(g, noChao(poli([[-tw * 0.8, -4], [-tw * 0.5, 44], [0, 70], [tw * 0.5, 44], [tw * 0.8, -4], [tw * 0.6, -26], [-tw * 0.6, -26]])), C(c.aco), o4);                              // saiote em V
      forma(g, poli([[-tw, T + 4], [-tw * 0.3, T - 8], [tw * 0.3, T - 8], [tw, T + 4], [tw * 0.78, T * 0.52], [lerp(14, 0, vz), T * 0.3], [-tw * 0.78, T * 0.52]]), C(c.aco), o4);   // peitoral
      traco(g, [[lerp(14, 0, vz), T + 2], [lerp(14, 0, vz), T * 0.3]], C(c.aco2), 3); traco(g, [[-tw * 0.7, T * 0.7], [lerp(14, 0, vz), T * 0.56], [tw * 0.7, T * 0.7]], C(c.aco2), 2.5);
      g.save(); g.globalAlpha = 0.3; g.fillStyle = '#000'; g.beginPath(); g.moveTo(tw * 0.3, T - 8); g.lineTo(tw, T + 4); g.lineTo(tw * 0.78, T * 0.52); g.lineTo(lerp(14, 0, vz) + tw * 0.2, T * 0.3); g.closePath(); g.fill(); g.restore();
      g.restore();
      // manto sobre os ombros
      g.save(); g.translate(S.peito[0], S.peito[1]); g.rotate(S.lean * 0.9); const mw = lerp(0.82, 1.1, vz) * R.ombro / 2 + 22;
      forma(g, gg => { gg.beginPath(); gg.moveTo(-mw, 26); gg.quadraticCurveTo(-mw * 0.6, -34, 0, -30); gg.quadraticCurveTo(mw * 0.6, -34, mw, 26); gg.lineTo(mw * 0.66, 60); gg.lineTo(mw * 0.3, 40); gg.lineTo(0, 74); gg.lineTo(-mw * 0.34, 44); gg.lineTo(-mw * 0.7, 66); gg.closePath(); }, C(c.capa), { tex: 0.1 });
      g.restore();
    }
    // ombreiras
    const omb = (om, sg, dk) => forma(g, poli([add(om, [-34, -8]), add(om, [0, -34]), add(om, [36, -6]), add(om, [26, 34]), add(om, [-24, 32])]), C(c.aco3, dk), { tex: 0.04, rim: dk ? false : undefined });
    if (vz < 0.8 && !costas) omb(S.omF, 1, 0.5);
    // elmo-capuz + concha
    const h = S.cab, r = R.cabR; g.save(); g.translate(h[0], h[1]); g.rotate(S.lean * 0.5 + (P.cabT || 0)); const hx = costas ? 0 : -r * lerp(0.16, 0, vz);
    forma(g, poli([[hx - r * 1.16, r * 1.08], [hx - r * 1.34, -r * 0.2], [hx - r * 0.8, -r * 1.36], [hx + r * 0.1, -r * 1.86], [hx + r * 0.96, -r * 1.2], [hx + r * 1.22, -r * 0.1], [hx + r * 1.0, r * 1.12], [hx + r * 0.2, r * 1.46], [hx - r * 0.5, r * 1.36]]), C(c.aco), { tex: 0.04, rw: 3 });
    traco(g, [[hx + r * 0.1, -r * 1.86], [hx + r * 0.06, -r * 1.0]], C(c.aco2), 3);
    if (!costas) this.concha(g, [0, 0], r, vz, P.aneis || 0, P.t || 0);
    g.restore();
    if (!costas) omb(S.omN, -1, 0); if (vz > 0.8 && !costas) omb(S.omF, 1, 0);
    if (vz < 0.8) braco(g, S, 'N', bracoO('N')); else { braco(g, S, 'F', bracoO('F')); braco(g, S, 'N', bracoO('N')); }
  },
};
