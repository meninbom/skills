// Piloto "O Brasil mora na praia" (ROTEIRO_piloto_v1.md). Mudo: os tempos em S são estimativa e serão reancorados na voz.
export async function CENA({ THREE, T, W, H, Pais, quatArco, tela, seg, ease, lerp, clamp, sstep, rnd, mapaBase, recorte, jget, img, cam }) {
  const IL = Object.fromEntries(await Promise.all(['nau', 'siri', 'cana', 'gota_a', 'gota_b', 'frade', 'ouro', 'congresso', 'engenho'].map(async k => [k, await img(`dados/ilus/${k}.png`)])));
  const S = { faixa: 0, torde: 11, serra: 22.5, tiete: 29.5, acucar: 40, ouro: 50, bsb: 55.5, norte: 62.5, sp: 66.6, volta: 73.2, fim: 74.2 };
  const W0 = 66.6, K = 9.4 / 7.6, antigo = t => t < W0 ? t : W0 + (t - W0) * K;
  await mapaBase('dados/mundo_8k.jpg', -180, 180, 90, -90, 0);
  await mapaBase('dados/am_sul.jpg', -90, -28, 16, -60, .002);
  const rTiete = await recorte('tiete', -52.0, -45.4, -20.0, -24.4, { z: .004, ordem: 1 });
  const rSp = await recorte('sp', -48.0, -45.0, -22.0, -25.0, { z: .008, ordem: 2 });
  const rBsb = await recorte('bsb', -50.6, -45.2, -11.0, -19.6, { z: .004, ordem: 1 });
  const g = n => jget(`dados/gen/${n}.json`);
  const [fFaixa, fInt, fBr, fPt, fEs, fMg, fNo, fSp, tiete] = await Promise.all(['faixa', 'interior', 'brasil', 'torde_pt', 'torde_es', 'minas', 'norte', 'grandesp'].map(g).concat(jget('dados/gen/tiete.json')));
  const interior = new Pais(fInt, { cor: '#04101c', alfa: .56, sombra: 0, ordem: 4 });
  const faixa = new Pais(fFaixa, { cor: '#ff6f14', alfa: .95, ordem: 5, minPts: 4 });
  const brasil = new Pais(fBr, { alfa: 0, sombra: 0 });
  const es = new Pais(fEs, { cor: '#f08c12', alfa: .93, ordem: 4 });
  const pt = new Pais(fPt, { cor: '#3db51f', alfa: .95, ordem: 5 });
  const minas = new Pais(fMg, { cor: '#f2b01a', alfa: .93, minPts: 4 });
  const norte = new Pais(fNo, { cor: '#3db51f', alfa: .9, minPts: 4, ordem: 4 });
  const gsp = new Pais(fSp, { cor: '#e3262d', alfa: .95, minPts: 4, ordem: 7 });
  const SP0 = [-46.6, -23.6], ALVO = [-62, -5];
  const qSp = quatArco([SP0[0], SP0[1] - .4], [SP0[0], SP0[1] + .4], [ALVO[0], ALVO[1] - .4], [ALVO[0], ALVO[1] + .4]), qId = new THREE.Quaternion(), q = new THREE.Quaternion();

  const camera = [
    { t: 0, lon: -54.4, lat: -14, span: 80 },
    { t: 10.6, lon: -53.8, lat: -14.4, span: 72, e: 's' },
    { t: 12.4, lon: -57, lat: -20, span: 92 },
    { t: 17, lon: -56, lat: -20, span: 80, e: 's' },
    { t: 22.3, lon: -50, lat: -19, span: 62, e: 's' },
    { t: 24.8, lon: -46.50, lat: -23.42, span: 1.3, tilt: 56, az: 30 },
    { t: 29.4, lon: -46.54, lat: -23.40, span: 1.15, tilt: 54, az: 18, e: 's' },
    { t: 31.3, lon: -45.76, lat: -23.64, span: .62, tilt: 40, az: 0 },
    { t: 34.3, lon: -45.77, lat: -23.63, span: .56, tilt: 36, az: 0, e: 's' },
    { t: 36.8, lon: -47.5, lat: -23.0, span: 6.5, tilt: 8, e: 'io' },
    { t: 38.6, lon: -48.65, lat: -22.2, span: 12.8, e: 's' },
    { t: 39.9, lon: -48.7, lat: -22.2, span: 12.2, e: 's' },
    { t: 41.7, lon: -37.6, lat: -9.6, span: 15.5, arco: .35 },
    { t: 49.7, lon: -37.2, lat: -10.3, span: 13.2, e: 's' },
    { t: 51.5, lon: -45.2, lat: -19.2, span: 25 },
    { t: 55.3, lon: -45.0, lat: -19.2, span: 22.5, e: 's' },
    { t: 57.5, lon: -46.4, lat: -19.3, span: 19.5, e: 's' },
    { t: 58.7, lon: -47.9, lat: -15.95, span: 5.4, tilt: 26, az: -8 },
    { t: 62.4, lon: -47.9, lat: -15.85, span: 4.2, tilt: 22, az: 12, e: 's' },
    { t: 64.2, lon: -56.5, lat: -7.5, span: 47 },
    { t: 66.6, lon: -56.5, lat: -8, span: 44.5, e: 's' },
    { t: 67.9, lon: -46.6, lat: -23.62, span: 3.1 },
    { t: 69.2, lon: -46.6, lat: -23.6, span: 2.8, e: 's' },
    { t: 71.3, lon: -59.5, lat: -5.5, span: 31, arco: .25 },
    { t: 73.2, lon: -59.2, lat: -5.8, span: 29, e: 's' },
    { t: 75.6, lon: -54.4, lat: -14, span: 80 },
    { t: 76, lon: -54.4, lat: -14, span: 80, e: 'lin' },
  ];
  for (const k of camera) if (k.t > W0) k.t = W0 + (k.t - W0) / K;
  // âncoras na voz B: [tempo da voz, tempo da cena muda v2]. A voz manda; a cena estica ou encolhe entre as âncoras.
  const ANC = [[0, .3], [3.84, 3.2], [6.64, 6.3], [8.96, 8.3], [11.4, 11.3], [13.04, 12.8], [14.08, 13.3], [16.3, 15.4], [19.0, 17.6], [23.4, 22.3], [26.0, 24.9], [27.04, 25.5], [28.16, 26.2],
    [30.4, 29.4], [32.24, 31.0], [33.28, 31.7], [36.2, 33.7], [36.8, 34.5], [39.0, 37.9], [40.4, 39.7], [41.0, 40.2], [42.3, 41.6], [44.3, 44.6], [47.6, 46.0], [51.3, 50.2], [51.7, 50.8], [54.1, 55.6],
    [54.32, 56.0], [55.9, 56.3], [57.1, 57.5], [57.9, 58.7], [61.1, 62.6], [63.1, 64.2], [64.5, 65.6], [65.6, 66.6], [66.8, 67.5], [67.9, 68.78], [69.4, 70.4], [70.3, 71.9], [72.0, 74.2]];
  const pw = (t, a, b) => { if (t <= ANC[0][a]) return ANC[0][b] + (t - ANC[0][a]); for (let i = 1; i < ANC.length; i++) if (t <= ANC[i][a]) { const u = (t - ANC[i - 1][a]) / (ANC[i][a] - ANC[i - 1][a]); return ANC[i - 1][b] + u * (ANC[i][b] - ANC[i - 1][b]); } return ANC[ANC.length - 1][b]; };
  const cenaDe = t => pw(t, 0, 1);
  // câmera: nos repousos a deriva é contínua (linear, sem parar em cada chave); nos voos, in-out forte
  camera.forEach((k, i) => { if (!i) return; const a = camera[i - 1]; if (k.e === 's' && Math.abs(Math.log(k.span / a.span)) < .2) k.e = 'lin'; else if (!k.e) k.e = 'mv'; });
  // entrada padrão de texto: chega maior e de baixo, freia (expo.out), sem passar do ponto; sai encolhendo um pouco
  const E = (t, t0, f = 1, d = .4) => { const u = seg(t, t0, t0 + d, 'expo'); return { esc: lerp(1.18, 1, u) * lerp(.93, 1, f), alfa: clamp((t - t0) / .1) * f * f, dy: 24 * (1 - u) }; };
  const AD = .12; // a informação entra um pouco antes da palavra
  for (const k of camera) k.t = pw(k.t, 1, 0);
  const caps = await jget('voz/caps_B.json');

  const alt = (lon, lat) => rSp.exag > 0 ? rSp.altura(lon, lat) : 0;
  const N = [-45.74, -23.57], MAR = [-45.74, -23.775];
  const engenhos = [[-35.3, -6.2], [-35.0, -7.3], [-35.1, -8.2], [-35.5, -9.1], [-36.1, -9.9], [-37.1, -11.0], [-38.4, -12.7], [-38.9, -13.5], [-39.0, -14.7]];
  const costaNE = [[-35.25, -5.6], [-34.85, -7.2], [-34.95, -8.6], [-35.7, -9.7], [-36.6, -10.6], [-37.4, -11.6], [-38.3, -12.9], [-38.95, -13.9], [-39.0, -15.2]];
  const naCosta = k => { const f = clamp(k) * (costaNE.length - 1), i = Math.min(costaNE.length - 2, Math.floor(f)), u = f - i; return [lerp(costaNE[i][0], costaNE[i + 1][0], u), lerp(costaNE[i][1], costaNE[i + 1][1], u)]; };
  const portos = [[-43.2, -22.9], [-38.5, -13.0], [-46.3, -23.9], [-40.3, -20.3], [-44.7, -23.2]];

  function mundo(t) {
    t = antigo(cenaDe(t));
    const sp = cam.span;
    rSp.alfa = 1 - sstep(7, 12, sp); rTiete.alfa = 1 - sstep(10, 16, sp); rBsb.alfa = 1 - sstep(7, 11, sp);
    rSp.exag = 13 * seg(t, 22.9, 24.8) - 7 * seg(t, 29.4, 31.3) - 6 * seg(t, 34.6, 37.2);
    rBsb.exag = 10 * seg(t, 57.5, 58.7) * (1 - seg(t, 62.4, 63.6));
    const some1 = 1 - seg(t, 10.7, 11.5), volta = seg(t, 74.4, 75.6);
    faixa.set({ corte: lerp(6, -34.5, seg(t, .5, 2.5, 's')), fio: Math.sin(Math.PI * seg(t, .5, 2.5, 'lin')), alfa: .9 * some1, visivel: t < 11.6 });
    interior.set({ alfa: .56 * seg(t, 8.3, 9.2) * some1, visivel: t > 8.3 && t < 11.6 });
    const someT = 1 - seg(t, 22.3, 23.2);
    es.set({ corte: lerp(13, -57, seg(t, 15.4, 16.7, 's')), fio: Math.sin(Math.PI * seg(t, 15.4, 16.7, 'lin')), alfa: .93 * someT, visivel: t > 15.4 && t < 23.2 });
    pt.set({ corte: lerp(6, -35, seg(t, 17.6, 18.7, 's')), fio: Math.sin(Math.PI * seg(t, 17.6, 18.7, 'lin')), alfa: .95 * someT, visivel: t > 17.6 && t < 23.2 });
    minas.set({ corte: lerp(-14, -23.2, seg(t, 50.8, 51.8, 's')), fio: Math.sin(Math.PI * seg(t, 50.8, 51.8, 'lin')), alfa: .93 * (1 - seg(t, 55.0, 55.7)), visivel: t > 50.8 && t < 55.7 });
    const someN = 1 - seg(t, 73.6, 74.6);
    norte.set({ corte: lerp(5.5, -14, seg(t, 64.3, 65.5, 's')), fio: Math.sin(Math.PI * seg(t, 64.3, 65.5, 'lin')), alfa: .9 * someN, visivel: t > 64.3 && t < 74.6 });
    const voo = seg(t, 69.3, 71.3); q.slerpQuaternions(qId, qSp, voo); gsp.aplica(q);
    gsp.set({ alfa: .95 * seg(t, 67.3, 67.7) * someN, altura: Math.sin(Math.PI * voo) * .4, visivel: t > 67.3 && t < 74.6, esc: sp / 40 });
  }

  const cont = (t, a, b, v) => Math.round(lerp(0, v, seg(t, a, b, 'out')));
  function tela2d(tReal) {
    const x = T.x, t = antigo(cenaDe(Math.min(tReal + AD, 71.99))), tm = antigo(cenaDe(tReal));
    const borda = (p, cor, alfa, corte = null, aneis = p.aneis) => { if (alfa <= .01) return; x.save(); if (corte != null) { x.beginPath(); x.rect(0, 0, W, tela(-50, corte)[1]); x.clip(); }
      for (const r of aneis.slice(0, 5)) T.traco(r.map(q => tela(q[0], q[1])), 1, { cor, larg: 3.5, alfa }); x.restore(); };
    { const sT = 1 - seg(tm, 22.3, 23.2);
      if (tm > 15.4 && tm < 23.2) borda(es, '#ffe2a6', .9 * sT, lerp(13, -57, seg(tm, 15.4, 16.7, 's')));
      if (tm > 17.6 && tm < 23.2) borda(pt, '#d6ffbf', .9 * sT, lerp(6, -35, seg(tm, 17.6, 18.7, 's')));
      if (tm > 50.8 && tm < 55.7) borda(minas, '#fff1bf', .9 * (1 - seg(tm, 55.0, 55.7)), lerp(-14, -23.2, seg(tm, 50.8, 51.8, 's')));
      const sN = 1 - seg(tm, 73.6, 74.6);
      if (tm > 64.3 && tm < 74.6) borda(norte, '#d6ffbf', .9 * sN, lerp(5.5, -14, seg(tm, 64.3, 65.5, 's')));
      if (tm > 67.3 && tm < 74.6) borda(gsp, '#ffc2bc', .9 * seg(tm, 67.3, 67.7) * sN, null, gsp.aneis.slice(0, 2).map(r => r.map(q => gsp.ponto(q[0], q[1])))); }
    // ---- 1. a faixa ----
    if (t < 11.6 || t > 74.2) { const a = t < 11.6 ? .85 * (1 - seg(t, 10.7, 11.5)) : .85 * seg(t, 74.4, 75.6); brasil.aneis.slice(0, 1).forEach(r => T.geo(r, 1, { cor: '#fff', larg: 3.5, alfa: a })); }
    if (t < 11.6) {
      const f = 1 - seg(t, 10.6, 11.2);
      const e = seg(t, 3.2, 3.6, 'back') * f;
      T.texto(cont(t, 3.2, 5.4, 111) + ' milhões', W / 2, H * .185, { tam: 124, cor: '#ffe14a', ...E(t, 3.2, f), contorno: 14 });
      T.texto('54,8% dos brasileiros', W / 2, H * .245, { tam: 52, ...E(t, 5.3, f), contorno: 9 });
      // régua de 150 km a partir da costa da Bahia
      const a = tela(-48.6, -27.2), b = tela(-50.1, -27.2), u = seg(t, 6.3, 7.0) * f;
      if (u > 0) { T.traco([[a[0] + 70, a[1] + 62], [a[0] + 6, a[1] + 8]], seg(t, 6.3, 6.6), { cor: '#fff', larg: 4, alfa: f }); T.traco([a, b], u, { cor: '#fff', larg: 9, borda: 5 });
        T.texto('150 km', a[0] + 82, a[1] + 84, { tam: 56, alinh: 'left', ...E(t, 6.5, f), contorno: 10 }); }
    }
    // ---- 2. Tordesilhas ----
    if (t > 12.4 && t < 23.2) {
      const f = 1 - seg(t, 22.3, 23.1), X = -48.7, pts = []; for (let la = 12; la >= -58; la -= 2) pts.push([X, la]);
      T.geo(pts, seg(t, 12.6, 13.7, 'io'), { cor: '#fff', larg: 8, borda: 6, alfa: f });
      const p = tela(X, 12); T.texto('1494', p[0], Math.max(H * .16, p[1] - 78), { tam: 112, cor: '#ffe14a', ...E(t, 13.3, f), contorno: 14 });
      const pe = tela(-61.5, -13), pp = tela(-41.6, -11.5);
      T.texto('ESPANHA', Math.max(pe[0], 250), pe[1], { esp: 5, tam: lerp(58, 74, seg(t, 17, 22.3, 's')), ...E(t, 16.3, f), contorno: 10 });
      T.texto('PORTUGAL', pp[0], pp[1], { esp: 5, tam: lerp(38, 50, seg(t, 17, 22.3, 's')), ...E(t, 18.5, f), contorno: 9 });
    }
    // ---- 3a. Serra do Mar ----
    if (t > 24.4 && t < 30) {
      const f = 1 - seg(t, 29.3, 29.8);
      T.pino(tela(-46.33, -23.965, alt(-46.33, -23.965)), 'praia', seg(t, 24.9, 25.3, 'lin') * f, [0, 56], { tam: 46 });
      const c = [-46.47, -23.865], base = tela(c[0], c[1], 0), topo = tela(c[0], c[1], alt(c[0], c[1]) + .012);
      T.traco([base, topo], seg(t, 26.2, 26.9) * f, { cor: '#ffe14a', larg: 9, borda: 5 });
      T.texto('1.000 m', topo[0] - 24, (base[1] + topo[1]) / 2, { tam: 54, cor: '#ffe14a', alinh: 'right', ...E(t, 26.6, f), contorno: 10 });
      const s = tela(-46.50, -23.80, alt(-46.50, -23.80)); T.texto('Serra do Mar', clamp(s[0], 280, W - 280), s[1] - 150, { tam: 70, ...E(t, 25.5, f), contorno: 12 });
    }
    // ---- 3b. Tietê ----
    if (t > 30.6 && t < 40.6) {
      const f = 1 - seg(t, 39.9, 40.5), u = seg(t, 34.5, 38.9, 'io');
      const n = tela(N[0], N[1], alt(...N)), m = tela(MAR[0], MAR[1], 0);
      const fd = (1 - seg(t, 34.2, 34.8)) * f;
      T.traco([n, m], seg(t, 31.7, 32.5) * 1, { cor: '#fff', larg: 6, traco: [16, 14], alfa: fd });
      T.texto('22 km', (n[0] + m[0]) / 2 + 26, (n[1] + m[1]) / 2, { tam: 58, alinh: 'left', ...E(t, 32.2, fd), contorno: 10 });
      T.texto('praia', m[0] + 26, m[1] + 6, { tam: 46, alinh: 'left', ...E(t, 32.4, fd), contorno: 8 });
      const ponta = T.geo(tiete, u, { cor: '#49bdff', larg: lerp(11, 7, u), borda: 5, alfa: f }, alt) || n;
      // a gota: nasce, olha o mar, vira e vai embora na ponta do rio
      const nasc = seg(t, 30.9, 31.3, 'back'), vira = seg(t, 33.7, 34.1), tam = lerp(150, 84, seg(t, 34.5, 37));
      const olhar = [lerp(0, -.9, vira) + (t < 33.7 ? .25 * Math.sin(t * 3) : 0), lerp(seg(t, 31.9, 32.3) * 1, -.4, vira)];
      const pisca = (t % 2.3) < .12 ? 1 : 0, pulo = Math.abs(Math.sin(t * 9)) * 10 * (u > 0 && u < 1 ? 1 : 0);
      { const gp = [ponta[0], ponta[1] - tam * .9 - pulo - Math.sin(t * 2.4) * 4], gr = -.12 * vira * (u < 1 ? 1 : 0) + Math.sin(t * 1.7) * .03; T.img(IL.gota_a, gp, tam * 1.85, { esc: nasc * f, alfa: 1 - vira, rot: gr }); T.img(IL.gota_b, gp, tam * 1.85, { esc: nasc * f * lerp(.9, 1, vira), alfa: vira, rot: gr }); }
      T.texto('Tietê', n[0] - 170, n[1] - 190, { tam: 60, cor: '#9be0ff', ...E(t, 31.2, fd), contorno: 10 });
      const mid = tela(-49.2, -21.75), mid2 = tela(-48.2, -22.35);
      T.texto('1.100 km', mid[0] + 30, mid[1] + 86, { tam: 70, cor: '#ffe14a', rot: Math.atan2(mid2[1] - mid[1], mid2[0] - mid[0]), ...E(t, 37.9, f), contorno: 12 });
      T.pino(tela(-51.59, -20.62), 'rio Paraná', seg(t, 39.1, 39.5, 'lin') * f, [18, 54, 'left'], { tam: 44, cor: '#1f8fe6' });
    }
    // ---- 4. açúcar e caranguejos ----
    if (t > 41 && t < 50.4) {
      const f = 1 - seg(t, 49.6, 50.3);
      engenhos.forEach((p, i) => { const t0 = 41.6 + i * .13 + rnd(i + 4) * .09; const en = i % 3 === 1, q = tela(p[0] - .3, p[1]); T.img(en ? IL.engenho : IL.cana, [q[0], q[1] + 40], en ? 108 : 124, { esc: seg(t, t0, t0 + .36, 'back') * f, rot: en ? 0 : Math.sin(t * 1.6 + i * 1.3) * .04, base: true }); });
      [[-34.9, -8.1, 0], [-38.5, -13.0, .7], [-35.2, -5.9, 1.5], [-37.0, -11.0, 2.3]].forEach(([lo, la, d], i) => {
        const u = clamp((t - 43 - d) / 6); if (u <= 0) return; const p = tela(lo + .5 + u * 6.5, la + u * (1 + i * .5));
        T.img(IL.nau, [p[0], p[1] + Math.sin(t * 3 + i) * 5], 140, { esc: seg(t, 43 + d, 43.36 + d, 'back') * f, rot: Math.sin(t * 2.2 + i) * .06 }); });
      { const k = seg(t, 45.0, 45.45, 'expo'); T.img(IL.frade, [W * .27 - 70 * (1 - k), H * .37], 340, { esc: lerp(.9, 1, k) * lerp(.94, 1, f), alfa: clamp((t - 45.0) / .12) * f }); }
      T.texto('1627', W / 2, H * .19, { tam: 112, cor: '#ffe14a', ...E(t, 44.6, f), contorno: 14 });
      for (let i = 0; i < 5; i++) { const e = seg(t, 46 + i * .15, 46.35 + i * .15, 'back') * f; if (e <= 0) continue;
        const kk = tt => (i + .5) / 5 + .085 * Math.sin((tt - 46) * 1.9 + i * 2.1), p = tela(...naCosta(kk(t)));
        for (let j = 1; j <= 6; j++) { const q = tela(...naCosta(kk(t - j * .16))), a = (1 - j / 7) * .85 * e; x.save(); x.globalAlpha = a; x.strokeStyle = '#fff'; x.lineWidth = 4; x.lineCap = 'round'; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 4;
          for (const d of [-9, 0, 9]) { x.beginPath(); x.moveTo(q[0] - 14, q[1] + d + 4); x.lineTo(q[0] + 10, q[1] + d - 4); x.stroke(); } x.restore(); }
        T.img(IL.siri, [p[0] + 30, p[1] - Math.abs(Math.sin(t * 11 + i)) * 9], 150, { esc: e, rot: Math.sin(t * 11 + i) * .08, espelha: Math.cos((t - 46) * 1.9 + i * 2.1) < 0 }); }
    }
    // ---- 5a. ouro ----
    if (t > 50.8 && t < 55.7) {
      const fo = 1 - seg(t, 55.0, 55.6);
      const c = tela(-44.6, -18.3); T.img(IL.ouro, [c[0], c[1] - 140], 170, { esc: seg(t, 51.6, 51.96, 'back') * fo });
      T.texto('OURO', c[0], c[1], { esp: 5, tam: 96, cor: '#fff3b0', ...E(t, 51.5, fo), contorno: 14 });
      T.texto('século 18', c[0], c[1] + 84, { tam: 46, ...E(t, 51.9, fo), contorno: 8 });
      for (let i = 0; i < 46; i++) { const o = portos[i % portos.length], t0 = 51.7 + rnd(i) * 2.6, u = seg(t, t0, t0 + 1.5, 'io'); if (u <= 0) continue;
        const d = [-43.6 + (rnd(i + 50) - .5) * 3.2, -19.9 + (rnd(i + 90) - .5) * 3.4], p = tela(lerp(o[0], d[0], u) + (rnd(i + 7) - .5) * .6 * (1 - u), lerp(o[1], d[1], u));
        T.ponto(p, 10, '#fff', clamp(u * 6) * fo); }
    }
    // ---- 5b. Brasília ----
    if (t > 55.7 && t < 63.8) {
      const f = 1 - seg(t, 62.6, 63.4), fr = 1 - seg(t, 57.7, 58.3), RIO = [-43.2, -22.9], B = [-47.88, -15.79];
      T.texto('1960', W / 2, H * .19, { tam: 112, cor: '#ffe14a', ...E(t, 56.0, f), contorno: 14 });
      // do Rio (a capital) até o meio do nada
      const ur = seg(t, 56.3, 57.5, 'io'), pr = tela(...RIO);
      T.pino(pr, 'Rio, a capital', seg(t, 55.8, 56.2, 'lin') * fr, [-26, -44, 'right'], { tam: 46 });
      const ponta = T.geo([RIO, B], ur, { cor: '#fff', larg: 8, traco: [20, 16], alfa: fr });
      if (ponta && ur > .12) T.texto(Math.round(930 * ur / 10) * 10 + ' km', ponta[0] - 34, ponta[1] - 10, { tam: 64, cor: '#ffe14a', alinh: 'right', alfa: fr, contorno: 11 });
      const p = tela(B[0], B[1], rBsb.altura(...B)), e = seg(t, 58.7, 59.2, 'back') * f, on = seg(t, 58.7, 59.5);
      if (on > 0 && on < 1) { x.save(); x.globalAlpha = (1 - on) * .9; x.strokeStyle = '#fff'; x.lineWidth = 10 * (1 - on) + 2; x.beginPath(); x.ellipse(p[0], p[1], 360 * on, 250 * on, 0, 0, 7); x.stroke(); x.restore(); }
      for (let i = 0; i < 30; i++) { const t0 = 59.2 + rnd(i + 3) * 2.4, u = seg(t, t0, t0 + 1.3, 'io'); if (u <= 0 || f <= 0) continue; const a = rnd(i + 20) * 6.28, r = 2.6 * (1 - u) + .16 * rnd(i);
        T.ponto(tela(B[0] + Math.cos(a) * r, B[1] + Math.sin(a) * r * .9, 0), 12, '#fff', clamp(u * 6) * f); }
      T.img(IL.congresso, [p[0], p[1] + 56], 380, { esc: e, base: true });
      T.texto('Brasília', p[0], p[1] + 124, { tam: 78, ...E(t, 59.0, f), contorno: 12 });
    }
    // ---- 6. Norte × Grande SP ----
    if (t > 64.6 && t < 74.6) {
      const f = 1 - seg(t, 73.6, 74.4), c = tela(-60.5, -1.5), perto = seg(t, 66.6, 67.4) * (1 - seg(t, 69.0, 69.45));
      const fn = f * (1 - seg(t, 66.6, 67.4) * (1 - seg(t, 70.7, 71.2)));
      T.texto('NORTE', c[0], c[1], { esp: 5, tam: 92, ...E(t, 65.2, fn), contorno: 14 });
      T.texto(t < 67 ? '45% do Brasil' : '17,3 milhões', c[0], c[1] + 88, { tam: 54, cor: '#ffe14a', ...E(t, 65.6, fn), contorno: 10 });
      const g1 = tela(SP0[0], SP0[1] + .62);
      T.texto('Grande São Paulo', g1[0], g1[1] - 70, { tam: 62, ...E(t, 67.7, perto), contorno: 10 });
      T.texto('20,7 milhões', g1[0], g1[1], { tam: 70, cor: '#ffe14a', ...E(t, 67.85, perto), contorno: 12 });
      const d = tela(...gsp.ponto(SP0[0], SP0[1])), e2 = seg(t, 71.3, 71.6, 'expo') * f;
      if (e2 > 0) { T.traco([[d[0] + 26, d[1] + 22], [d[0] + 110, d[1] + 96]], 1, { cor: '#fff', larg: 5, alfa: e2 });
        T.texto('Grande SP', d[0] + 120, d[1] + 124, { tam: 50, alinh: 'left', ...E(t, 71.3, f), contorno: 9 }); T.texto('20,7 milhões', d[0] + 120, d[1] + 184, { tam: 54, cor: '#ffe14a', alinh: 'left', ...E(t, 71.42, f), contorno: 10 }); }
    }
    for (const [a, b, s] of caps) if (tReal >= a && tReal < b) T.legenda(s, clamp((tReal - a) / .2));
  }
  return { dur: 72, camera, mundo, tela: tela2d };
}
