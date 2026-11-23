// DEMO (3 s, mudo): a câmera voa até o Brasil, o país é pintado por varredura, entra a faixa do litoral,
// um rótulo, um número, um pino e UMA ilustração-placeholder desenhada por código.
// Troque o placeholder pela sua ilustração pintada: const IL = await img('dados/ilus/sua.png') e T.img(IL, ...).
export async function CENA({ T, W, H, Pais, tela, seg, lerp, clamp, mapaBase, jget }) {
  const x = T.x;
  // base: Blue Marble (NASA, domínio público). O recorte de perto fica por cima do mundo.
  await mapaBase('dados/mundo_2k.jpg', -180, 180, 90, -90, 0);
  await mapaBase('dados/am_sul.jpg', -90, -28, 16, -60, .002);
  const [fBr, fFaixa] = await Promise.all([jget('dados/gen/brasil.json'), jget('dados/gen/faixa.json')]);
  const brasil = new Pais(fBr, { cor: '#3db51f', alfa: .93, ordem: 4 });
  const faixa = new Pais(fFaixa, { cor: '#ff6f14', alfa: .95, ordem: 5, minPts: 4 });

  // câmera: nunca para. 'mv' = voo com in-out forte; 'lin' = deriva de repouso.
  const camera = [
    { t: 0.0, lon: -62, lat: -8, span: 118 },
    { t: 1.25, lon: -52.5, lat: -15, span: 82, e: 'mv' },
    { t: 3.0, lon: -51.8, lat: -16, span: 76, tilt: 10, az: -4, e: 'lin' },
  ];

  // ilustração-placeholder: um cartão tracejado feito em canvas (entra na cena como qualquer PNG)
  const ph = document.createElement('canvas'); ph.width = 420; ph.height = 420;
  { const g = ph.getContext('2d'); g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.roundRect(14, 14, 392, 392, 46); g.fill();
    g.setLineDash([26, 16]); g.lineWidth = 10; g.strokeStyle = '#0d3a66'; g.stroke(); g.setLineDash([]);
    g.fillStyle = '#f2b01a'; g.beginPath(); g.arc(300, 128, 44, 0, 7); g.fill();                         // sol
    g.fillStyle = '#1f8fe6'; g.beginPath(); g.moveTo(40, 330); g.lineTo(170, 170); g.lineTo(250, 270); g.lineTo(300, 220); g.lineTo(380, 330); g.closePath(); g.fill();  // morros
    g.fillStyle = '#0d3a66'; g.font = '700 40px MontS'; g.textAlign = 'center'; g.fillText('SUA ILUSTRAÇÃO', 210, 380, 340); }

  const E = (t, t0, d = .4) => { const u = seg(t, t0, t0 + d, 'expo'); return { esc: lerp(1.18, 1, u), alfa: clamp((t - t0) / .1), dy: 24 * (1 - u) }; };
  const borda = (p, cor, alfa, corte) => { if (alfa <= .01) return; x.save(); x.beginPath(); x.rect(0, 0, W, tela(-50, corte)[1]); x.clip();
    for (const r of p.aneis.slice(0, 5)) T.traco(r.map(q => tela(q[0], q[1])), 1, { cor, larg: 3.5, alfa }); x.restore(); };

  const corteBr = t => lerp(6, -35, seg(t, .55, 1.35, 's'));
  function mundo(t) {
    brasil.set({ corte: corteBr(t), fio: 1 - seg(t, 1.3, 1.5), visivel: t > .54 });
    faixa.set({ alfa: .95 * seg(t, 1.7, 2.05, 'out'), visivel: t > 1.7 });
  }

  function tela2d(t) {
    if (t > .55) borda(brasil, '#d6ffbf', .9, corteBr(t));
    { const p = tela(-54, -10); if (t > 1.2) T.texto('BRASIL', p[0], p[1], { tam: 84, esp: 8, ...E(t, 1.2) }); }
    { const p = tela(-38.5, 5); if (t > 1.95) { T.texto('54,8%', p[0], p[1], { tam: 104, cor: '#ffe14a', ...E(t, 1.95) }); T.texto('a até 150 km do mar', p[0], p[1] + 84, { tam: 40, ...E(t, 2.1) }); } }
    T.pino(tela(-47.9, -15.8), 'Brasília', seg(t, 1.5, 1.9, 'lin'), [0, -52]);
    { const p = tela(-66, -39), u = seg(t, 2.15, 2.51, 'back'); T.img(ph, [p[0], p[1] + Math.sin(t * 3) * 5], 250, { esc: u, rot: Math.sin(t * 2.2) * .05 }); }
    const L = [[0.1, 1.2, 'Olha o Brasil'], [1.2, 1.95, 'no mapa'], [1.95, 3, 'mora na praia']];
    for (const [i, f, s] of L) if (t >= i && t < f) T.legenda(s, clamp((t - i) / .08));
  }
  return { dur: 3, camera, mundo, tela: tela2d };
}
