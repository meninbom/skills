import * as B0 from './boneco.js';
import * as E from './elenco.js';
const B = { ...B0, ...E };
const cv = document.getElementById('c'), g = cv.getContext('2d');
const q = new URLSearchParams(location.search), quem = q.get('q') || 'nico';
function frame(t) {
  const gr = g.createLinearGradient(0, 0, 0, 1920); gr.addColorStop(0, '#0e1a2e'); gr.addColorStop(0.55, '#2a4a6a'); gr.addColorStop(1, '#0c1826'); g.fillStyle = gr; g.fillRect(0, 0, 1080, 1920);
  B.setAmb([0.84, 0.88, 1.0], [0, 4, 12]);
  const ch = B[quem.toUpperCase()], s = +(q.get('s') || 0.62);
  const row = (y, list) => list.forEach((P, i) => B.boneco(g, ch, { x: 140 + i * 265, y, s, ...P }));
  if (q.get('um')) { const h = ch.R.tronco + ch.R.coxa + ch.R.canela, z = +(q.get('z') || 1.5); B.boneco(g, ch, { x: 290, y: 900, s: z, vista: 'q', expr: 'bravo' }); B.boneco(g, ch, { x: 800, y: 900, s: z, vista: 'f', expr: 'neutro' }); B.boneco(g, ch, { x: 290, y: 1800, s: z, vista: 'l', expr: 'firme', lean: 0.1, agacha: 20, pN: [-60, 0], pF: [70, 0] }); B.boneco(g, ch, { x: 800, y: 1800, s: z, vista: 'b' }); return; }
  row(520, [{ vista: 'l' }, { vista: 'q' }, { vista: 'f' }, { vista: 'b' }]);
  row(1050, [{ vista: 'q', expr: 'bravo' }, { vista: 'q', expr: 'susto', dir: -1 }, { vista: 'l', expr: 'firme', lean: 0.12, agacha: 26, pN: [-70, 0], pF: [70, 0] }, { vista: 'f', expr: 'medo' }]);
  const h = ch.R.tronco + ch.R.coxa + ch.R.canela;
  row(1600, [{ vista: 'q', expr: 'firme', mF: [150, -h * 0.72], mN: [-20, -h * 0.74], cotN: 1, lean: -0.04, pN: [-50, 0], pF: [50, 0] }, { vista: 'l', expr: 'dor', lean: -0.5, agacha: 60, pN: [-20, 0], pF: [80, 0], mN: [-90, -80], mF: [60, -60] }, { vista: 'q', expr: 'grita', lean: 0.3, agacha: 20, pN: [-90, 0], pF: [60, 0], mN: [120, -h * 0.62], mF: [130, -h * 0.5] }, { vista: 'l', expr: 'neutro', dir: -1 }]);
}
window.END = 1; window.seek = async t => frame(t); frame(0); window.READY = true;
