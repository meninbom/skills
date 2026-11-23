// ================= impact frame no estilo de anime: silhueta chapada em 2 valores, pincelada na direção do golpe,
// respingo de tinta e UMA cor de destaque; cada desenho fica 4 quadros (como animação "em dois"). Nada de estrela pontuda.
const MASK = document.createElement('canvas'); MASK.width = W; MASK.height = H; const TMP = document.createElement('canvas'); TMP.width = W; TMP.height = H;
const WHITE = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
function maskRender(keep) { const vis = scene.children.map(o => o.visible); scene.children.forEach(o => { if (!o.isLight) o.visible = keep.includes(o) && o.visible; });
  const env = scene.environment; scene.overrideMaterial = WHITE; R3.clear(); R3.render(scene, cam); scene.overrideMaterial = null; scene.environment = env; scene.children.forEach((o, i) => o.visible = vis[i]);
  const m = MASK.getContext('2d'); m.globalCompositeOperation = 'copy'; m.filter = 'blur(1.5px)'; m.drawImage(gl, 0, 0); m.filter = 'none'; m.globalCompositeOperation = 'source-over'; }
function tinted(col, dx = 0, dy = 0, sc = 1, px = W / 2, py = H / 2) { const q = TMP.getContext('2d'); q.globalCompositeOperation = 'copy'; q.setTransform(sc, 0, 0, sc, px - px * sc + dx, py - py * sc + dy); q.drawImage(MASK, 0, 0); q.setTransform(1, 0, 0, 1, 0, 0); q.globalCompositeOperation = 'source-in'; q.fillStyle = col; q.fillRect(0, 0, W, H); q.globalCompositeOperation = 'source-over'; return TMP; }
// pincelada seca: várias cerdas paralelas, afiladas nas pontas, com falhas
function brush(c, x0, y0, x1, y1, wd, seed, col) { const r = rng(seed), dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, n = Math.max(5, wd / 5 | 0); c.fillStyle = col;
  for (let i = 0; i < n; i++) { const o = (i / (n - 1) - 0.5) * wd * (0.8 + r() * 0.3), a = r() * 0.16, b = 1 - r() * 0.22, w = (wd / n) * (0.7 + r() * 1.3) * (1 - Math.abs(i / (n - 1) - 0.5) * 0.8);
    const ax = x0 + dx * a + nx * o, ay = y0 + dy * a + ny * o, bx = x0 + dx * b + nx * o, by = y0 + dy * b + ny * o, mx = (ax + bx) / 2 + nx * (r() - 0.5) * 6, my = (ay + by) / 2 + ny * (r() - 0.5) * 6;
    c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(mx + nx * w, my + ny * w, bx, by); c.quadraticCurveTo(mx - nx * w, my - ny * w, ax, ay); c.fill(); } }
// arco de corte: pincelada grossa em curva
function arcBrush(c, cx, cy, R, a0, a1, wd, seed, col) { const r = rng(seed), n = 9; c.strokeStyle = col; c.lineCap = 'round';
  for (let i = 0; i < n; i++) { const k = i / (n - 1) - 0.5, rr = R + k * wd, s0 = a0 + r() * 0.25, s1 = a1 - r() * 0.3; c.lineWidth = (wd / n) * (1.2 + r() * 1.4) * (1 - Math.abs(k) * 1.1); c.beginPath(); c.arc(cx, cy, rr, s0, s1); c.stroke(); } }
// respingo: gotas num leque na direção da força, poucas grandes e muitas pequenas
function splat(c, x, y, ux, uy, n, seed, col, reach = 900) { const r = rng(seed); c.fillStyle = col;
  for (let i = 0; i < n; i++) { const d = Math.pow(r(), 1.6) * reach + 60, sp = (r() - 0.5) * 1.5, ca = Math.cos(sp), sa = Math.sin(sp), vx = ux * ca - uy * sa, vy = ux * sa + uy * ca, sz = Math.max(3, Math.pow(r(), 3.2) * 60 * (1 - d / (reach * 1.4)));
    c.save(); c.translate(x + vx * d, y + vy * d); c.rotate(Math.atan2(vy, vx)); c.beginPath(); c.ellipse(0, 0, sz * (1 + r() * 1.6), sz * 0.6, 0, 0, 7); c.fill(); c.restore(); } }
function impactFrame2(c, k, x, y, ux, uy) {
  const g = GRAB.getContext('2d'); g.filter = 'none'; g.globalCompositeOperation = 'copy'; g.drawImage(out, 0, 0); g.globalCompositeOperation = 'source-over';
  const step = k < 2 ? 0 : k < 6 ? 1 : k < 10 ? 2 : 3, px = -uy, py = ux, GOLD = '#ffd04a';
  c.save(); c.filter = 'none'; c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  if (step === 0) { // clarão: branco quase puro, só as silhuetas em cinza claro
    c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.drawImage(tinted('#d9d4cc'), 0, 0); }
  else if (step === 1) { // desenho 1: preto, silhuetas brancas com sombra deslocada, corte dourado
    c.fillStyle = '#07070a'; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 16; i++) { const o = (i - 7.5) * 120 + Math.sin(i * 7.7) * 40, l = 500 + (i * 131 % 900); brush(c, x + px * o - ux * 300, y + py * o - uy * 300, x + px * o + ux * l, y + py * o + uy * l, 16 + (i * 37 % 34), 40 + i, 'rgba(255,255,255,0.16)'); }
    c.globalAlpha = 0.35; c.drawImage(tinted('#fff', -ux * 46, -uy * 46), 0, 0); c.globalAlpha = 1; c.drawImage(tinted('#fff'), 0, 0);
    arcBrush(c, x - ux * 120, y - uy * 120, 470, Math.atan2(uy, ux) - 1.25, Math.atan2(uy, ux) + 1.25, 150, 5, GOLD);
    splat(c, x, y, ux, uy, 70, 11, '#fff', 900); splat(c, x, y, ux, uy, 14, 13, GOLD, 700); }
  else if (step === 2) { // desenho 2: invertido, papel claro, silhuetas pretas, tinta espirrando, mesma cor de destaque
    c.fillStyle = '#f3ece0'; c.fillRect(0, 0, W, H);
    const gr = c.createRadialGradient(x, y, 0, x, y, 900); gr.addColorStop(0, 'rgba(255,208,74,0.95)'); gr.addColorStop(0.45, 'rgba(255,208,74,0.25)'); gr.addColorStop(1, 'rgba(255,208,74,0)'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 12; i++) { const o = (i - 5.5) * 150 + Math.sin(i * 5.3) * 50, l = 700 + (i * 173 % 800); brush(c, x + px * o + ux * 80, y + py * o + uy * 80, x + px * o + ux * l, y + py * o + uy * l, 22 + (i * 29 % 40), 70 + i, 'rgba(12,10,12,0.9)'); }
    c.drawImage(tinted('#0b0a0d', ux * 18, uy * 18, 1.03, x, y), 0, 0);
    arcBrush(c, x - ux * 60, y - uy * 60, 560, Math.atan2(uy, ux) - 1.1, Math.atan2(uy, ux) + 1.1, 110, 6, '#0b0a0d'); arcBrush(c, x - ux * 60, y - uy * 60, 500, Math.atan2(uy, ux) - 0.9, Math.atan2(uy, ux) + 0.9, 46, 7, '#fff');
    splat(c, x, y, ux, uy, 110, 21, '#0b0a0d', 1100); splat(c, x, y, -ux, -uy, 26, 23, '#0b0a0d', 420); }
  else { // volta para a cena: zoom leve e separação de cor
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H); const z = 1.08 - 0.03 * (k - 10); c.translate(x, y); c.scale(z, z); c.translate(-x, -y);
    c.filter = 'contrast(1.35) saturate(1.3) brightness(1.1)'; c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 1; c.drawImage(GRAB, 0, 0); c.filter = 'none'; c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 0.28; c.globalCompositeOperation = 'screen'; c.drawImage(GRAB, ux * 22, uy * 22); c.drawImage(GRAB, -ux * 22, -uy * 22); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    c.drawImage(tinted('rgba(255,255,255,0.25)'), 0, 0); }
  c.restore();
  // grão de papel por cima dos desenhos
  if (step === 1 || step === 2) { c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.22; c.fillStyle = GRAIN || '#888'; c.fillRect(0, 0, W, H); c.restore(); }
}
