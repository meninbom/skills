// Demo: renderiza demo/filme_demo.html (arte-substituta desenhada por código) em saida/demo.mp4.
// 3 s, 540x960, 30 qps, mudo. Uso: npm install && npm run demo   (DEMO_CPU=1 para render por software)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from './render.mjs';
const aqui = path.dirname(fileURLToPath(import.meta.url)); const t0 = Date.now();
await render({ pagina: path.join(aqui, 'demo', 'filme_demo.html'), video: path.join(aqui, 'saida', 'demo.mp4'), fps: 30, largura: 540 });
console.log(`demo pronto em ${((Date.now() - t0) / 1000).toFixed(1)} s: saida/demo.mp4`);
