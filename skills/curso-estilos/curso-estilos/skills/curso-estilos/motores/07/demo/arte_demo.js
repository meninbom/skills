// arte_demo.js: arte-SUBSTITUTA desenhada por código, só para o demo rodar sem nenhuma imagem.
// No seu filme isto some: as placas e os sprites vêm do modelo de imagem (ver ESTILO.md e a receita).
// Segue as regras medidas: sombra violeta, 3 tons por objeto, sem contorno, um ponto de luz.
function tela(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; }
function bola(g, x, y, r, base, sombra, luz) { // objeto de 3 tons: base, crescente de sombra, filete de luz
  g.fillStyle = sombra; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.fillStyle = base; g.beginPath(); g.arc(x - r * .12, y - r * .12, r * .9, 0, 7); g.fill();
  g.fillStyle = luz; g.beginPath(); g.ellipse(x - r * .45, y - r * .5, r * .28, r * .14, -.7, 0, 7); g.fill();
}
// placa 1: floresta ao entardecer (mundo laranja, folhagem teal, sombra violeta)
function placaFloresta() {
  return tela(768, 1376, (g, w, h) => {
    const ceu = g.createLinearGradient(0, 0, 0, h); ceu.addColorStop(0, '#B8300E'); ceu.addColorStop(.45, '#F2701A'); ceu.addColorStop(.75, '#FFB04A'); g.fillStyle = ceu; g.fillRect(0, 0, w, h);
    const sol = g.createRadialGradient(540, 420, 20, 540, 420, 420); sol.addColorStop(0, 'rgba(255,240,180,.95)'); sol.addColorStop(.2, 'rgba(255,210,110,.6)'); sol.addColorStop(1, 'rgba(255,180,80,0)'); g.fillStyle = sol; g.fillRect(0, 0, w, h);
    [['#9B2BC8', 760, 60], ['#7A3BC8', 860, 40], ['#3A2A9E', 960, 28]].forEach(([cor, y0, amp], k) => { // serras
      g.fillStyle = cor; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 16) g.lineTo(x, y0 + Math.sin(x * .011 + k * 2) * amp + Math.sin(x * .031 + k) * amp * .3); g.lineTo(w, h); g.fill();
    });
    for (let i = 0; i < 26; i++) { // copas
      const x = (i * 97 + 40) % w, y = 1010 + (i % 5) * 62 + (i * 37 % 40), r = 70 + (i * 53 % 50);
      g.fillStyle = '#4A1E7A'; g.fillRect(x - 8, y, 16, r * 1.6);
      bola(g, x, y, r, i % 3 ? '#1DB86A' : '#16A08A', '#27307E', '#B8F25A');
    }
    g.fillStyle = '#F8C25E'; g.beginPath(); g.ellipse(384, 1300, 300, 46, 0, 0, 7); g.fill(); // clareira onde o mascote pousa
    g.fillStyle = 'rgba(90,30,140,.35)'; g.beginPath(); g.ellipse(384, 1306, 120, 18, 0, 0, 7); g.fill();
  });
}
// placa 2: céu noturno com o "rio" de vapor (mundo azul, brilho ciano)
function placaCeu() {
  return tela(768, 1376, (g, w, h) => {
    const ceu = g.createLinearGradient(0, 0, 0, h); ceu.addColorStop(0, '#070B4A'); ceu.addColorStop(.5, '#141A86'); ceu.addColorStop(.85, '#3A2AB4'); ceu.addColorStop(1, '#FF7A3A'); g.fillStyle = ceu; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(191,247,249,${.3 + (i * 7 % 10) / 14})`; g.beginPath(); g.arc((i * 211) % w, (i * 373) % (h * .8), 1.5 + (i % 3), 0, 7); g.fill(); }
    for (let i = 0; i < 9; i++) { const x = (i * 173 + 60) % w, y = 180 + (i * 131) % 900, r = 60 + (i * 29) % 50; // nuvens
      g.fillStyle = '#3A2A9E'; [[0, 0, 1], [-.9, .25, .7], [.9, .3, .75], [0, .5, .9]].forEach(([dx, dy, s]) => { g.beginPath(); g.arc(x + dx * r, y + dy * r, r * s, 0, 7); g.fill(); });
      g.fillStyle = '#7A3BC8'; g.beginPath(); g.ellipse(x - r * .2, y - r * .5, r * .6, r * .16, -.2, 0, 7); g.fill(); }
    g.fillStyle = '#1020B8'; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 16) g.lineTo(x, 1230 + Math.sin(x * .013) * 46); g.lineTo(w, h); g.fill();
  });
}
// mascote-substituto: gota de 3 tons com dois pés brancos; estado = 'normal' | 'feliz' | 'vapor'
function gota(estado) {
  return tela(300, 360, (g) => {
    const vapor = estado === 'vapor', base = vapor ? '#BFF7F9' : '#22D7DA', sombra = vapor ? '#8FB6F2' : '#3A5BE0', luz = vapor ? '#FFFFFF' : '#BFF7F9';
    const corpo = (dx, dy, s) => { g.beginPath(); g.moveTo(150 + dx, 30 + dy); g.bezierCurveTo(150 + dx + 150 * s, 150 + dy, 150 + dx + 130 * s, 310 * s + dy + 20, 150 + dx, 310 * s + dy + 20); g.bezierCurveTo(150 + dx - 130 * s, 310 * s + dy + 20, 150 + dx - 150 * s, 150 + dy, 150 + dx, 30 + dy); g.fill(); };
    if (!vapor) { g.fillStyle = '#FFFFFF'; g.beginPath(); g.ellipse(105, 338, 34, 18, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(195, 338, 34, 18, 0, 0, 7); g.fill(); }
    g.fillStyle = sombra; corpo(0, 0, 1); g.fillStyle = base; corpo(-10, 6, .9);
    g.fillStyle = luz; g.beginPath(); g.ellipse(100, 170, 16, 46, .35, 0, 7); g.fill();
    if (estado === 'feliz') { g.strokeStyle = '#22126B'; g.lineWidth = 9; g.lineCap = 'round'; [118, 186].forEach(x => { g.beginPath(); g.arc(x, 222, 20, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }); g.beginPath(); g.arc(152, 250, 26, .15 * Math.PI, .85 * Math.PI); g.stroke(); }
    else { [118, 186].forEach(x => { g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(x, 215, 26, 0, 7); g.fill(); g.fillStyle = '#22126B'; g.beginPath(); g.arc(x + 6, 219, 11, 0, 7); g.fill(); g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(x + 2, 213, 4, 0, 7); g.fill(); }); }
  });
}
