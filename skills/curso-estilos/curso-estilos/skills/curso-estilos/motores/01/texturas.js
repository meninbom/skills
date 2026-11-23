// Texturas pintadas em canvas (código puro): areia com seixos contornados, grama com riscos, tábua "tijolada",
// telha em escama, tijolo, fachada com janela acesa/apagada, concreto em placas. Tudo com traço escuro (#3a2416).
import * as THREE from 'three';
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const INK = '#3a2416';
function mk(n, fn, seed = 1) {
  const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'); const R = rng(seed);
  fn(g, n, R);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16; t.colorSpace = THREE.NoColorSpace;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; return t;
}
// desenha com wrap (tile sem emenda)
function wrapDraw(n, x, y, r, fn) { for (const dx of [-n, 0, n]) for (const dy of [-n, 0, n]) if (x + dx > -r && x + dx < n + r && y + dy > -r && y + dy < n + r) fn(x + dx, y + dy); }
function blotches(g, n, R, cols, k, rmin, rmax, a) {
  for (let i = 0; i < k; i++) { const x = R() * n, y = R() * n, r = rmin + R() * (rmax - rmin), col = cols[i % cols.length];
    wrapDraw(n, x, y, r, (X, Y) => { const gr = g.createRadialGradient(X, Y, 0, X, Y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = a; g.fillStyle = gr; g.fillRect(X - r, Y - r, 2 * r, 2 * r); g.globalAlpha = 1; }); }
}
export function texAreia() {
  return mk(1024, (g, n, R) => {
    g.fillStyle = '#d99b5c'; g.fillRect(0, 0, n, n);
    blotches(g, n, R, ['#c4834a', '#e7b073', '#bd7d47'], 40, 60, 200, 0.45);
    // pontinhos
    for (let i = 0; i < 900; i++) { g.fillStyle = R() < 0.5 ? 'rgba(90,55,30,0.35)' : 'rgba(255,230,190,0.35)'; g.beginPath(); g.arc(R() * n, R() * n, 1 + R() * 1.6, 0, 7); g.fill(); }
    // seixos contornados (ovais), alguns cheios
    for (let i = 0; i < 70; i++) { const x = R() * n, y = R() * n, rx = 7 + R() * 13, ry = rx * (0.6 + R() * 0.35), rot = R() * 3, cheio = R() < 0.22;
      wrapDraw(n, x, y, rx + 4, (X, Y) => { g.beginPath(); g.ellipse(X, Y, rx, ry, rot, 0, 7);
        g.fillStyle = cheio ? '#8f7458' : '#e2ad72'; g.fill(); g.lineWidth = 2.6; g.strokeStyle = INK; g.stroke(); }); }
  }, 11);
}
export function texGrama() {
  return mk(1024, (g, n, R) => {
    g.fillStyle = '#6b8a35'; g.fillRect(0, 0, n, n);
    blotches(g, n, R, ['#5a7a2b', '#7d9b40', '#566f28'], 50, 60, 220, 0.5);
    g.lineCap = 'round';
    for (let i = 0; i < 700; i++) { const x = R() * n, y = R() * n, l = 6 + R() * 10, a = -1.2 + R() * 0.5;
      g.strokeStyle = R() < 0.7 ? 'rgba(52,72,22,0.75)' : 'rgba(150,175,80,0.6)'; g.lineWidth = 1.8;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  }, 12);
}
// tábua: listras de grão + juntas desencontradas (aquele "tijolinho" da madeira da torre)
export function texMadeira() {
  return mk(512, (g, n, R) => {
    g.fillStyle = '#93582c'; g.fillRect(0, 0, n, n);
    for (let i = 0; i < 40; i++) { g.fillStyle = R() < 0.5 ? 'rgba(120,70,35,0.5)' : 'rgba(175,110,60,0.35)'; g.fillRect(R() * n, 0, 2 + R() * 6, n); }
    const rows = 8, h = n / rows; g.strokeStyle = 'rgba(58,32,16,0.9)'; g.lineWidth = 2.2;
    for (let r = 0; r <= rows; r++) { g.beginPath(); g.moveTo(0, r * h); g.lineTo(n, r * h); g.stroke(); }
    for (let r = 0; r < rows; r++) { const off = (r % 2) * n / 4; for (let k = 0; k < 2; k++) { const x = off + k * n / 2; g.beginPath(); g.moveTo(x, r * h); g.lineTo(x, r * h + h); g.stroke(); } }
  }, 13);
}
export function texTelha() {
  return mk(512, (g, n, R) => {
    g.fillStyle = '#3a4f9e'; g.fillRect(0, 0, n, n);
    const w = n / 10, h = n / 14; g.strokeStyle = 'rgba(20,24,60,0.85)'; g.lineWidth = 2;
    for (let r = 0; r < 15; r++) for (let k = -1; k < 11; k++) { const x = k * w + (r % 2) * w / 2, y = r * h;
      g.fillStyle = R() < 0.5 ? '#3b51a3' : '#33478f'; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + h * 0.6); g.quadraticCurveTo(x + w / 2, y + h * 1.25, x + w, y + h * 0.6); g.lineTo(x + w, y); g.fill(); g.stroke(); }
  }, 14);
}
export function texTelhaCasa() {
  return mk(512, (g, n, R) => {
    g.fillStyle = '#a8483a'; g.fillRect(0, 0, n, n);
    const h = n / 12; g.strokeStyle = 'rgba(70,20,15,0.8)'; g.lineWidth = 2;
    for (let r = 0; r <= 12; r++) { g.beginPath(); g.moveTo(0, r * h); g.lineTo(n, r * h); g.stroke(); }
    for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(200,100,80,0.25)'; g.fillRect(R() * n, R() * n, 30, h); }
  }, 15);
}
export function texTijolo() {
  return mk(512, (g, n, R) => {
    g.fillStyle = '#6b2c22'; g.fillRect(0, 0, n, n);
    const rows = 8, cols = 4, h = n / rows, w = n / cols;
    for (let r = 0; r < rows; r++) for (let k = -1; k < cols + 1; k++) { const x = k * w + (r % 2) * w / 2;
      const v = R(); g.fillStyle = v < 0.33 ? '#b24f3b' : v < 0.66 ? '#a44634' : '#bb5a43'; g.fillRect(x + 3, r * h + 3, w - 6, h - 6); }
  }, 16);
}
// fachada: 1 módulo de 3 m × 3 m com 1 janela (acesa ou não)
export function texFachada(cor, acesa, seed) {
  return mk(512, (g, n, R) => {
    g.fillStyle = cor; g.fillRect(0, 0, n, n);
    blotches(g, n, R, ['rgba(0,0,0,0.25)', 'rgba(255,255,255,0.2)'], 10, 60, 160, 0.4);
    const ww = n * 0.38, wh = n * 0.42, x = (n - ww) / 2, y = n * 0.26;
    g.fillStyle = '#e9dccb'; g.fillRect(x - 10, y - 10, ww + 20, wh + 22);
    if (acesa) { const gr = g.createLinearGradient(0, y, 0, y + wh); gr.addColorStop(0, '#ffd27a'); gr.addColorStop(1, '#f0a050'); g.fillStyle = gr; }
    else { const gr = g.createLinearGradient(0, y, 0, y + wh); gr.addColorStop(0, '#5b6a9a'); gr.addColorStop(1, '#2f3760'); g.fillStyle = gr; }
    g.fillRect(x, y, ww, wh);
    g.strokeStyle = INK; g.lineWidth = 4; g.strokeRect(x - 10, y - 10, ww + 20, wh + 22); g.strokeRect(x, y, ww, wh);
    g.lineWidth = 3; g.beginPath(); g.moveTo(x + ww / 2, y); g.lineTo(x + ww / 2, y + wh); g.moveTo(x, y + wh * 0.45); g.lineTo(x + ww, y + wh * 0.45); g.stroke();
    // faixa de piso
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, n - 14, n, 14); g.strokeStyle = 'rgba(58,36,22,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, n - 14); g.lineTo(n, n - 14); g.stroke();
  }, seed);
}
export function texConcreto() {
  return mk(512, (g, n, R) => {
    g.fillStyle = '#b8b0a6'; g.fillRect(0, 0, n, n);
    blotches(g, n, R, ['#a39b92', '#c9c2b8', '#9c8f8c'], 18, 40, 140, 0.5);
    g.strokeStyle = 'rgba(70,60,55,0.75)'; g.lineWidth = 2.4; g.strokeRect(1, 1, n - 2, n - 2);
    for (let i = 0; i < 4; i++) { g.strokeStyle = 'rgba(70,60,55,0.35)'; g.lineWidth = 1.4; g.beginPath(); let x = R() * n, y = R() * n; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (R() - 0.5) * 60; y += (R() - 0.5) * 60; g.lineTo(x, y); } g.stroke(); }
  }, 17);
}
export function texPlano(cor) { return mk(16, (g, n) => { g.fillStyle = cor; g.fillRect(0, 0, n, n); }, 1); }
// cartaz de desaparecido (aparece no poste da torre)
export function texCartaz() {
  const c = document.createElement('canvas'); c.width = 300; c.height = 420; const g = c.getContext('2d');
  g.fillStyle = '#f3efe6'; g.fillRect(0, 0, 300, 420);
  g.fillStyle = '#d0262c'; g.fillRect(10, 10, 280, 54); g.fillStyle = '#fff'; g.font = '800 38px Rubik'; g.textAlign = 'center'; g.fillText('DESAPARECIDO', 150, 52);
  g.fillStyle = '#d8d2c6'; g.fillRect(70, 80, 160, 150); g.strokeStyle = '#222'; g.lineWidth = 3; g.strokeRect(70, 80, 160, 150);
  g.fillStyle = '#2a2a2a'; g.beginPath(); g.arc(150, 135, 30, 0, 7); g.fill(); g.beginPath(); g.arc(124, 112, 12, 0, 7); g.arc(176, 112, 12, 0, 7); g.fill();
  g.beginPath(); g.moveTo(102, 230); g.quadraticCurveTo(105, 170, 150, 168); g.quadraticCurveTo(195, 170, 198, 230); g.fill();
  g.fillStyle = '#222'; g.font = '800 30px Rubik'; g.fillText('TEO, 8 ANOS', 150, 272);
  g.font = '600 15px Arial'; g.fillText('Visto pela última vez em um parquinho', 150, 300); g.fillText('do bairro, de camisa azul.', 150, 320);
  g.font = '800 20px Rubik'; g.fillText('QUALQUER INFORMAÇÃO:', 150, 356); g.fillText('(00) 3333-0000', 150, 384);
  g.strokeStyle = '#3a2416'; g.lineWidth = 6; g.strokeRect(3, 3, 294, 414);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; return t;
}
export function texPlaca(txt) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 160; const g = c.getContext('2d');
  g.fillStyle = '#e8c23a'; g.fillRect(0, 0, 512, 160); g.strokeStyle = '#3a2416'; g.lineWidth = 10; g.strokeRect(5, 5, 502, 150);
  g.fillStyle = '#2a1a10'; g.font = '800 62px Rubik'; g.textAlign = 'center'; g.fillText(txt, 256, 102);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; return t;
}

// ---------- elevador / corredor ----------
export function texInox() { return mk(512, (g, n, R) => {
  g.fillStyle = '#a9adb3'; g.fillRect(0, 0, n, n);
  for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(${R() < 0.5 ? '255,255,255' : '60,60,70'},${0.05 + R() * 0.08})`; g.lineWidth = 1 + R() * 2; const x = R() * n; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (R() - 0.5) * 6, n); g.stroke(); }
  g.strokeStyle = INK; g.lineWidth = 4; g.strokeRect(2, 2, n - 4, n - 4);
  g.fillStyle = 'rgba(58,36,22,0.6)'; for (const [x, y] of [[18, 18], [n - 18, 18], [18, n - 18], [n - 18, n - 18]]) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
}, 3); }
export function texPiso() { return mk(512, (g, n) => {
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#2d2a2e' : '#bdb49c'; g.fillRect(i * 128, j * 128, 128, 128); }
  g.strokeStyle = INK; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, n); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(n, i * 128); g.stroke(); }
}, 4); }
export function texCarpete() { return mk(512, (g, n, R) => {
  g.fillStyle = '#6b2a24'; g.fillRect(0, 0, n, n);
  g.strokeStyle = '#c99a3a'; g.lineWidth = 6;
  for (let y = 0; y < n; y += 128) for (let x = 0; x < n; x += 128) { g.beginPath(); g.moveTo(x + 64, y + 14); g.lineTo(x + 114, y + 64); g.lineTo(x + 64, y + 114); g.lineTo(x + 14, y + 64); g.closePath(); g.stroke();
    g.fillStyle = '#4a1a17'; g.beginPath(); g.arc(x + 64, y + 64, 14, 0, 7); g.fill(); }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${R() * 0.12})`; g.fillRect(R() * n, R() * n, 3, 3); }
}, 5); }
export function texPapelParede() { return mk(512, (g, n, R) => {
  g.fillStyle = '#9fae78'; g.fillRect(0, 0, n, n);
  for (let x = 0; x < n; x += 64) { g.fillStyle = 'rgba(70,85,40,0.35)'; g.fillRect(x, 0, 22, n); }
  g.strokeStyle = 'rgba(60,70,30,0.6)'; g.lineWidth = 3;
  for (let y = 32; y < n; y += 96) for (let x = 43; x < n; x += 64) { g.beginPath(); g.ellipse(x, y + (x / 64 % 2) * 48, 7, 13, 0, 0, 7); g.stroke(); }
  for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(80,70,30,${R() * 0.12})`; g.beginPath(); g.ellipse(R() * n, R() * n, 20 + R() * 50, 30 + R() * 80, 0, 0, 7); g.fill(); }
}, 6); }
export function texPorta(num) { const c = document.createElement('canvas'); c.width = 256; c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#7a4a2a'; g.fillRect(0, 0, 256, 512);
  g.strokeStyle = INK; g.lineWidth = 6; g.strokeRect(3, 3, 250, 506); g.strokeRect(36, 50, 184, 170); g.strokeRect(36, 270, 184, 200);
  g.fillStyle = 'rgba(255,220,160,0.12)'; g.fillRect(40, 54, 176, 162);
  g.fillStyle = '#d7b44a'; g.beginPath(); g.roundRect(78, 12, 100, 34, 6); g.fill(); g.stroke();
  g.fillStyle = '#2a1a10'; g.font = '800 26px Rubik'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(num, 128, 30);
  g.fillStyle = '#d7b44a'; g.beginPath(); g.arc(214, 270, 12, 0, 7); g.fill(); g.lineWidth = 4; g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; return t; }
