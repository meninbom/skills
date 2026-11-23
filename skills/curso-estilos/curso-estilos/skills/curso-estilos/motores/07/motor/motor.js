// motor.js: base dos filmes. Canvas 1080x1920, função pura do tempo (window.seek).
// Cada filme chama iniciar(placas, sprites), define window.END (duração em s) e a função window.render(t).
//   placas  = { chave: 'caminho/da/placa.png' }   fundo de cada cena, SEM personagem
//   sprites = { chave: 'caminho/do/sprite.png' }  recortes com alpha (saída de utilitarios/recortar_folha.py)
// No lugar do caminho pode vir um <canvas> já desenhado (é o que o demo faz).
// Imagem que não carrega vira um substituto com o nome escrito: o filme roda mesmo sem a arte.
const W = 1080, H = 1920;
const cv = document.getElementById('c'), X0 = cv.getContext('2d'); let X = X0;
const IM = {};
const OFF = [0, 1].map(() => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; });
function substituto(k, placa) {
  const c = document.createElement('canvas'), g = c.getContext('2d'); let h = 0; for (const ch of k) h = (h * 31 + ch.charCodeAt(0)) % 360;
  if (placa) { c.width = 768; c.height = 1376; const gr = g.createLinearGradient(0, 0, 0, 1376); gr.addColorStop(0, `hsl(${h},70%,45%)`); gr.addColorStop(1, `hsl(${(h + 60) % 360},70%,22%)`); g.fillStyle = gr; g.fillRect(0, 0, 768, 1376);
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2; for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(0, i * 172); g.lineTo(768, i * 172); g.stroke(); g.beginPath(); g.moveTo(i * 96, 0); g.lineTo(i * 96, 1376); g.stroke(); }
    g.fillStyle = '#fff'; g.font = '700 54px sans-serif'; g.textAlign = 'center'; g.fillText('placa: ' + k, 384, 688);
  } else { c.width = 300; c.height = 360; g.fillStyle = `hsl(${h},80%,62%)`; g.beginPath(); g.ellipse(150, 190, 130, 160, 0, 0, 7); g.fill();
    g.fillStyle = '#22126B'; g.font = '700 40px sans-serif'; g.textAlign = 'center'; g.fillText(k, 150, 205); }
  return c;
}
function load(k, src, placa) {
  if (src instanceof HTMLCanvasElement) { IM[k] = src; return Promise.resolve(); }
  return new Promise(r => { const i = new Image(); i.onload = () => { IM[k] = i; r(); }; i.onerror = () => { console.log('sem arte: ' + src + ' (usando substituto)'); IM[k] = substituto(k, placa); r(); }; i.src = src; });
}
function iniciar(placas, sprites = {}) {
  Promise.all([...Object.entries(placas).map(([k, v]) => load(k, v, true)), ...Object.entries(sprites).map(([k, v]) => load(k, v, false))]).then(() => { window.READY = true; });
}
// ---------- utilidades ----------
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => cl((t - a) / (b - a));
const io = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eo = t => 1 - Math.pow(1 - t, 3), ei = t => t * t * t;
const back = (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
const spring = (t, f = 3.2, d = 5) => t <= 0 ? 0 : 1 - Math.exp(-d * t) * Math.cos(f * 2 * Math.PI * t);
const wob = (t, fr, a, ph = 0) => Math.sin((t * fr + ph) * 2 * Math.PI) * a;
function kf(t, ks) {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) { const e = ks[i][2] || io; return lerp(ks[i - 1][1], ks[i][1], e(seg(t, ks[i - 1][0], ks[i][0]))); }
  return ks[ks.length - 1][1];
}
function rnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function path(pts, f) {
  f = cl(f) * (pts.length - 1); const i = Math.min(Math.floor(f), pts.length - 2), t = f - i;
  const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
  const c = k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t * t * t);
  return [c(0), c(1)];
}
// ---------- câmera e placa ----------
let CAM = { cx: .5, cy: .5, z: 1, pw: 2304, ph: 4128 };
const sc = () => Math.max(W / CAM.pw, H / CAM.ph) * CAM.z;
const P = (u, v) => [W / 2 + (u - CAM.cx) * CAM.pw * sc(), H / 2 + (v - CAM.cy) * CAM.ph * sc()];
function plate(k, c) {
  const im = IM[k]; const pw = im.width, ph = im.height;
  const s = Math.max(W / pw, H / ph) * c.z, hw = W / 2 / (pw * s), hh = H / 2 / (ph * s);
  CAM = { cx: cl(c.cx, hw, 1 - hw), cy: cl(c.cy, hh, 1 - hh), z: c.z, pw, ph };
  X.drawImage(im, W / 2 - CAM.cx * pw * s, H / 2 - CAM.cy * ph * s, pw * s, ph * s);
}
function spr(k, x, y, h, o = {}) {
  const im = IM[k]; if (!im || h <= 1) return; const w = h * im.width / im.height;
  const sy = o.sy || 1, sx = o.sx || (o.sy ? 1 / Math.sqrt(sy) : 1), ay = o.ay ?? 1;
  X.save(); X.globalAlpha = o.a ?? 1; X.translate(x, y); X.rotate(o.rot || 0); X.scale((o.flip ? -1 : 1) * sx, sy);
  if (o.glow) { X.shadowColor = o.glow; X.shadowBlur = h * .25; }
  X.drawImage(im, -w / 2, -h * ay, w, h); X.restore();
}
function wspr(k, u, v, hf, o = {}) { const [x, y] = P(u, v); spr(k, x, y, hf * CAM.ph * sc(), o); }
function rr(x, y, w, h, r) { X.beginPath(); X.moveTo(x + r, y); X.arcTo(x + w, y, x + w, y + h, r); X.arcTo(x + w, y + h, x, y + h, r); X.arcTo(x, y + h, x, y, r); X.arcTo(x, y, x + w, y, r); X.closePath(); }
function sign(x, y, sz, big, small, o = {}) {
  const a = o.a ?? 1; if (a <= 0 || sz <= 2) return;
  X.save(); X.globalAlpha = a; X.translate(x, y); X.rotate(o.rot || 0); X.scale(sz / 100, sz / 100);
  X.font = '900 64px "Segoe UI Black","Arial Black",sans-serif'; const w1 = X.measureText(big).width;
  X.font = '700 30px "Segoe UI",sans-serif'; const w2 = small ? X.measureText(small).width : 0; const bw = Math.max(w1, w2) + 64, bh = small ? 138 : 100;
  X.fillStyle = 'rgba(60,20,120,.35)'; rr(-bw / 2 + 8, -bh + 10, bw, bh, 26); X.fill();
  X.fillStyle = o.bg || '#FFD244'; rr(-bw / 2, -bh, bw, bh, 26); X.fill();
  X.fillStyle = 'rgba(255,255,255,.55)'; rr(-bw / 2 + 12, -bh + 8, bw - 24, 6, 3); X.fill();
  X.fillStyle = o.ink || '#22126B'; X.textAlign = 'center';
  X.font = '900 64px "Segoe UI Black","Arial Black",sans-serif'; X.fillText(big, 0, -bh + 74);
  if (small) { X.font = '700 30px "Segoe UI",sans-serif'; X.fillText(small, 0, -bh + 114); }
  X.restore();
}
const pop = (t, t0, d = .45) => t < t0 ? 0 : back(cl((t - t0) / d), 2.2);
// placa de passo/etiqueta presa na tela
function etiqueta(t, t0, t1, x, y, sz, big, small, o = {}) { const p = pop(t, t0) * (1 - seg(t, t1 - .25, t1)); if (p > 0) sign(x, y, sz * p, big, small, o); }
function off(i, fn) { const keep = X; X = OFF[i].getContext('2d'); X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1; X.filter = 'none'; X.fillStyle = '#0B0F4A'; X.fillRect(0, 0, W, H); fn(); X = keep; return OFF[i]; }
function mix(t, a, b, fa, fb, e = eo) { X.drawImage(off(0, fa), 0, 0); X.save(); X.globalAlpha = e(seg(t, a, b)); X.drawImage(off(1, fb), 0, 0); X.restore(); }
function whip(t, a, b, drawA, drawB, dir = 1, vert = 0) {
  const s = seg(t, a, b), D = (vert ? H : W) * dir, A = off(0, drawA), B = off(1, drawB);
  for (let k = 0; k < 6; k++) {
    const ek = io(cl(s + (k - 3) * .035)); X.save(); X.globalAlpha = k === 0 ? 1 : .3;
    const dx = vert ? 0 : -D * ek, dy = vert ? -D * ek : 0;
    X.drawImage(A, dx, dy); X.drawImage(B, dx + (vert ? 0 : D), dy + (vert ? D : 0)); X.restore();
  }
}
// zoom-através: a cena A cresce até o ponto (x,y) e a B nasce de dentro dele
function zoomThru(t, a, b, fa, fb, x = 540, y = 960) {
  const s = seg(t, a, b);
  if (s < .5) { const z = 1 + 3 * ei(s * 2); X.save(); X.translate(x, y); X.scale(z, z); X.translate(-x, -y); X.drawImage(off(0, fa), 0, 0); X.restore(); X.save(); X.globalAlpha = ei(s * 2) * .9; X.fillStyle = '#E6FFF9'; X.fillRect(0, 0, W, H); X.restore(); }
  else { const z = 1.6 - .6 * eo((s - .5) * 2); X.save(); X.translate(540, 960); X.scale(z, z); X.translate(-540, -960); X.drawImage(off(1, fb), 0, 0); X.restore(); X.save(); X.globalAlpha = (1 - eo((s - .5) * 2)) * .9; X.fillStyle = '#E6FFF9'; X.fillRect(0, 0, W, H); X.restore(); }
}
// chuva em código (riscos) e gotas-Oxi
function chuvaRiscos(t, n, alpha = .5, ang = .18) {
  X.save(); X.strokeStyle = `rgba(200,235,255,${alpha})`; X.lineWidth = 3; X.lineCap = 'round';
  for (let i = 0; i < n; i++) { const sp = 1400 + rnd(i) * 900, x0 = rnd(i + 3) * (W + 400) - 200, y = ((t * sp + rnd(i + 7) * 2400) % 2400) - 240; const x = x0 + y * ang; X.beginPath(); X.moveTo(x, y); X.lineTo(x - 22 * ang * 3, y - 70); X.stroke(); }
  X.restore();
}
function brilhoLinha(pts, w, col, blur, prog = 1) { // linha brilhante por pontos de tela
  if (pts.length < 2) return; const n = Math.max(2, Math.floor(pts.length * prog));
  X.save(); X.strokeStyle = col; X.lineWidth = w; X.lineCap = X.lineJoin = 'round'; if (blur) X.filter = `blur(${blur}px)`;
  X.beginPath(); for (let i = 0; i < n; i++) i ? X.lineTo(...pts[i]) : X.moveTo(...pts[i]); X.stroke(); X.restore();
}
function vinheta() { const g = X.createRadialGradient(540, 960, 600, 540, 960, 1250); g.addColorStop(0, 'rgba(20,10,60,0)'); g.addColorStop(1, 'rgba(20,10,60,.28)'); X.fillStyle = g; X.fillRect(0, 0, W, H); }
function base() { X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1; X.filter = 'none'; X.fillStyle = '#0B0F4A'; X.fillRect(0, 0, W, H); }
window.seek = t => { X = X0; base(); window.render(t); vinheta(); };
