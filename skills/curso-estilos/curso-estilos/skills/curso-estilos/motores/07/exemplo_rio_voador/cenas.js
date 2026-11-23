// cenas.js: cenas reaproveitáveis do filme "Rios voadores", com os tempos por parâmetro.
// Exemplo de como escrever cena: placa + sprites + câmera. A arte original não vem no pacote (o motor desenha substitutos).
const RIB1 = [[.98, .0], [.72, .05], [.5, .1], [.6, .16], [.74, .22], [.5, .29], [.25, .35], [.06, .43], [-.06, .5]];
const RIB6 = [[.64, .23], [.5, .245], [.36, .26], [.22, .28], [.2, .36], [.27, .45], [.42, .52], [.58, .58]];
function surfers(t, ribbon, n, hf, speed, kinds) {
  for (let i = 0; i < n; i++) {
    const f = ((t * speed + i / n + rnd(i) * .05) % 1); const [u, v] = path(ribbon, f);
    wspr(kinds[i % kinds.length], u + wob(t, .7, .004, i * .3), v + wob(t, 1.1, .003, i), hf * (.8 + .4 * rnd(i + 9)), { rot: wob(t, .9, .12, i * .2), a: cl(f * 8) * cl((1 - f) * 8) });
  }
}
function brilhoFita(t, ribbon, z) { // pulso de brilho sobre a fita do céu (o brilho que deu vida ao céu)
  X.save(); X.globalCompositeOperation = 'screen'; X.globalAlpha = .22 + .12 * Math.sin(t * 3);
  X.strokeStyle = '#9CF4FF'; X.lineWidth = 120 * z; X.lineCap = 'round'; X.filter = 'blur(30px)'; X.beginPath();
  for (let f = 0; f <= 1; f += .02) { const [x, y] = P(...path(ribbon, f)); f ? X.lineTo(x, y) : X.moveTo(x, y); } X.stroke(); X.restore();
}
// rio do céu (I5): cam = {cx,cy,z}
function cenaRioCeu(t, cam, extra) { plate('rio', cam); brilhoFita(t, RIB1, CAM.z); surfers(t, RIB1, 10, .028, .07, ['fam_05', 'fam_06', 'pose_08', 'fam_04']); if (extra) extra(); }
// estômato (J6): tE = sai pelo buraquinho, tV = vira vapor
function cenaEstomato(t, tIn, tE, tV, oxiKind = 'oxi_06') {
  const z = kf(t, [[tIn, 2.0], [tIn + 1.1, 1.35, eo], [tV + 1.5, 1.22]]);
  plate('esto', { cx: .5, cy: .45 + wob(t, .1, .004), z });
  const [x, y] = P(.5, .42);
  if (t >= tE && t < tE + .7) { const s = seg(t, tE, tE + .7); spr('pose_04', x, y - 30 * eo(s), 420 * eo(s), { ay: .5, sy: lerp(1.5, 1.1, s) }); }
  else if (t >= tE + .7) {
    const m = seg(t, tV, tV + .4), up = eo(seg(t, tV + .3, tV + 1.2)) * 520, pp = 1 + .12 * (1 - spring(t - tE - .7)), puff = 1 + .25 * Math.sin(m * Math.PI);
    if (m < 1) spr(oxiKind, x, y - 60 - up, 430 * pp * puff, { ay: .5, a: 1 - m, sy: 1 + wob(t, .8, .02) });
    if (m > 0) spr('oxi_08', x, y - 60 - up, 450 * puff * (1 + .06 * wob(t, .7, 1)), { ay: .5, a: m });
    for (let i = 0; i < 6 && t > tV + .2; i++) { const f = seg(t, tV + .2 + i * .1, tV + 1.2 + i * .1); spr('fam_0' + (3 + i % 5), x + (rnd(i) - .5) * 600, y - 100 - f * 700, 150 * (.6 + rnd(i + 2) * .5), { ay: .5, a: Math.sin(f * Math.PI) * .9 }); }
  }
}
// dossel (J7): uma árvore → a floresta; tOut0..tOut1 = zoom-out contínuo
function cenaDossel(t, tIn, tOut0, tOut1) {
  const z = kf(t, [[tIn, 3.4], [tOut0, 3.15], [tOut1, 1.0, io]]);
  const cy = kf(t, [[tIn, .74], [tOut0, .74], [tOut1, .5, io]]);
  plate('dossel', { cx: kf(t, [[tIn, .52], [tOut0, .52], [tOut1, .5]]), cy, z });
  for (let i = 0; i < 34; i++) { const u = .06 + rnd(i) * .88, v = .32 + rnd(i + 11) * .62, f = ((t * .22 + rnd(i + 5)) % 1); wspr('fam_0' + (3 + i % 5), u, v - f * .08, .012 + .006 * rnd(i + 1), { ay: .5, a: Math.sin(f * Math.PI) }); }
}
// mapa (J8) com a fita voadora: tGrow0→tBump cresce até os Andes; tBump trombada (careta); tC0→tC1 dobra pro sul
function headF6(t, tG0, tB, tC0, tC1) { return t < tB ? .42 * io(seg(t, tG0, tB)) : .42 + .58 * io(seg(t, tC0, tC1)); }
function cenaMapa(t, tG0, tB, tC0, tC1, camKeys, oxi = true) {
  const hf = headF6(t, tG0, tB, tC0, tC1), [hu, hv] = path(RIB6, hf);
  const shake = t > tB - .05 && t < tB + .5 ? wob(t, 22, .004) * (1 - seg(t, tB - .05, tB + .5)) : 0;
  plate('mapa', { cx: kf(t, camKeys.cx) + shake, cy: kf(t, camKeys.cy), z: kf(t, camKeys.z) });
  const pts = []; for (let f = 0; f <= hf; f += .01) pts.push(P(...path(RIB6, f))); pts.push(P(hu, hv));
  [[70, 'rgba(160,240,255,.28)', 26], [36, 'rgba(200,250,255,.9)', 12], [12, 'rgba(255,255,255,.95)', 0]].forEach(([lw, col, bl]) => brilhoLinha(pts, lw * CAM.z * .7, col, bl));
  for (let i = 0; i < 14; i++) { const f = ((t * .25 + i / 14) % 1) * hf; const [x, y] = P(...path(RIB6, f)); X.fillStyle = 'rgba(255,255,255,.9)'; X.beginPath(); X.arc(x, y, 5 * CAM.z, 0, 7); X.fill(); }
  if (!oxi) return [hu, hv];
  const [x, y] = P(hu, hv);
  if (t > tG0 && t < tC1 + .3) {
    if (t > tB && t < tB + .8) { const s = seg(t, tB, tB + .8); spr(s < .55 ? 'ox5_04' : 'ox5_05', x - 10 + (s > .55 ? 40 * eo((s - .55) * 2) : 0), y + 20, 170 * CAM.z * .55, { sy: s < .55 ? .8 + .2 * spring(s) : 1, rot: s < .55 ? -.2 : wob(t, 3, .15) }); }
    else spr('pose_06', x + 20, y + 30, 200 * CAM.z * .55, { rot: wob(t, .8, .08), flip: t > tB + .8 ? 0 : 1 });
  }
  return [hu, hv];
}
// SP (I6): a gota cai do céu na caixa d'água; tF0 começa a cair, tL pousa
function cenaSPCaixa(t, tF0, tL, camEnd = 1.3) {
  const cy = kf(t, [[tF0 - .1, .2], [tL, .6, io], [tL + .3, .62], [tL + 5, .64]]);
  plate('sp', { cx: kf(t, [[tF0, .5], [tL, .48]]), cy, z: kf(t, [[tF0, 1.3], [tL, 1.3], [tL + 5, camEnd]]) });
  chuvaGotas(t, 22, [.05, .98], .02, [.2, .7], tF0);
  wspr('prop_04', .86, .8, .1, { rot: wob(t, .4, .03), flip: 1 });
  if (t < tL) { const f = seg(t, tF0, tL); wspr('oxi_09', .566, lerp(.2, .78, ei(f) * .5 + f * .5), .085, { ay: .5, sy: 1 + .3 * f, rot: wob(t, 1, .1) }); }
  else {
    const s = t - tL, wl = P(0, .787)[1]; X.save(); X.beginPath(); X.rect(0, 0, W, wl); X.clip();
    wspr(s < .8 ? 'pose_07' : 'oxi_04', .566, .805, .1 * (1 + .1 * (1 - spring(s, 2.4, 5))), { sy: s < .8 ? 1 - .25 * (1 - spring(s, 2.6, 4)) : 1 + wob(t, .6, .02) }); X.restore();
    for (let i = 0; i < 8 && s < 1.2; i++) { const g = seg(s, 0, 1.0); const [x, y] = P(.566 + Math.cos(i / 8 * 6.28) * .07 * eo(g), .79 - Math.sin(i / 8 * 3.14) * .05 * Math.sin(g * Math.PI)); X.fillStyle = `rgba(160,230,255,${1 - g})`; X.beginPath(); X.arc(x, y, 14 * CAM.z, 0, 7); X.fill(); }
  }
}
function chuvaGotas(t, n, region, hf, vr, t0) {
  for (let i = 0; i < n; i++) {
    const f = ((t - t0) * (.45 + rnd(i) * .3) + rnd(i + 2)) % 1, u = region[0] + rnd(i + 5) * (region[1] - region[0]);
    wspr('fam_' + ['08', '09', '10', '11'][i % 4], u, lerp(vr[0], vr[1], ei(f) * .4 + f * .6), hf * (.8 + .4 * rnd(i)), { ay: .5, rot: wob(t, 1.3, .2, i * .3), a: cl(f * 6) * cl((1 - f) * 10) });
  }
}
