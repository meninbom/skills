// laboratório de física: Nico e Iara pulando em loop, com fantasma dos quadros (?tira) — base pro gerador de personagem
import * as B from './boneco.js';
import { IARA } from './elenco.js';
import { salta } from './fisica.js';
const cv = document.getElementById('c'), g = cv.getContext('2d'), W = 1080, H = 1920, CHAO = 1500, CIC = 2.2, TIRA = /tira/.test(location.search);
B.setAmb([0.88, 0.92, 1.0], [0, 3, 8]); B.setLuz({ cor: '#a9d2f2', w: 2.6 });
function fundo() { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#16324a'); gr.addColorStop(1, '#0b1a28'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = '#0e2232'; g.fillRect(0, CHAO, W, H - CHAO); g.strokeStyle = 'rgba(169,210,242,0.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, CHAO); g.lineTo(W, CHAO); g.stroke();
  g.strokeStyle = 'rgba(169,210,242,0.08)'; g.lineWidth = 2; for (let y = CHAO - 100; y > 0; y -= 100) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } }
function pose(ch, x0, u, dir, extra = {}) { const s = salta(u, ch.R, { dx: 120 }), { fase, x, ...p } = s; return { x: x0 + (x || 0) * dir, y: CHAO, vista: 'q', dir, expr: fase === 'ar' ? 'firme' : (fase === 'pousa' && u < 1.2 ? 'bravo' : 'firme'), ...p, ...extra }; }
function frame(t) {
  fundo(); const u = t % CIC;
  if (TIRA) { const us = [0, 0.14, 0.22, 0.27, 0.31, 0.45, 0.62, 0.78, 0.9, 0.93, 0.97, 1.05, 1.2];
    us.forEach((v, i) => { g.save(); g.globalAlpha = i === us.length - 1 ? 1 : 0.85; B.boneco(g, B.NICO, { ...pose(B.NICO, 60 + i * 80, v, 1), s: 0.62, x: 60 + i * 80 }); g.restore(); });
    g.fillStyle = '#fff'; g.font = '700 40px RC'; g.fillText('NICO · salto: antecipa → impulso → ar → pouso', 40, 120); return; }
  const q = new URLSearchParams(location.search), quem = q.get('q'), sc = +(q.get('s') || 1);
  if (quem === 'iara') B.boneco(g, IARA, { ...pose(IARA, 420, u, 1), s: sc, x: 420 + (pose(IARA, 0, u, 1).x) * (sc - 1) });
  else if (quem === 'nico') B.boneco(g, B.NICO, { ...pose(B.NICO, 380, u, 1), s: sc, x: 380 + (pose(B.NICO, 0, u, 1).x) * (sc - 1) });
  else { B.boneco(g, B.NICO, { ...pose(B.NICO, 230, u, 1), s: 0.9 }); B.boneco(g, IARA, { ...pose(IARA, 850, u, -1, { bal: 0 }), s: 0.75 }); }
  g.fillStyle = '#fff'; g.font = '700 44px RC'; g.fillText('u = ' + u.toFixed(2) + ' s', 40, 120);
}
await document.fonts.load('700 84px RC');
window.END = CIC; window.seek = async t => frame(t); frame(0); window.READY = true;
