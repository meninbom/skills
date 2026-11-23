// Globo explicativo: render do globo.html pelo Chrome do sistema.
//   node render.mjs stills 1,5.3,12        -> stills/s_01.00.jpg ...
//   node render.mjs video [saida.mp4] [--de 0] [--dur 34] [--fps 30] [--largura 1080]
// Sem trilha de audio; saida em yuv420p (faixa de TV), que abre em qualquer celular.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { abrirNavegador, abrirEncoder } from './lib/chrome.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const modo = args[0] || 'video';
const op = (nome, padrao) => { const i = args.indexOf('--' + nome); return i > 0 ? args[i + 1] : padrao; };

if (!fs.existsSync(path.join(AQUI, 'mapas.js'))) {
  console.error('Falta o mapas.js. Gere com: python gen_mapas.py');
  process.exit(1);
}
const nav = await abrirNavegador();
const pg = await nav.newPage();
await pg.setViewport({ width: 1080, height: 1920 });
const erros = [];
pg.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
pg.on('pageerror', (e) => erros.push(String(e)));
await pg.goto(pathToFileURL(path.join(AQUI, 'globo.html')).href);
await pg.waitForFunction('window.READY !== undefined', { timeout: 180000 });
await pg.evaluate('window.READY');
if (erros.length) console.log('ERROS DA PAGINA', erros.slice(0, 5));
const FIM = await pg.evaluate('window.END');
const b64 = (d) => Buffer.from(d.split(',')[1], 'base64');

if (modo === 'stills') {
  const dir = path.join(AQUI, 'stills');
  fs.mkdirSync(dir, { recursive: true });
  for (const s of (args[1] || '1').split(',')) {
    const t = parseFloat(s);
    fs.writeFileSync(path.join(dir, `s_${t.toFixed(2).padStart(5, '0')}.jpg`), b64(await pg.evaluate(`window.still(${t})`)));
    console.log('still', t);
  }
} else {
  const saida = path.resolve(args[1] && !args[1].startsWith('--') ? args[1] : path.join(AQUI, 'saida', 'video_mudo.mp4'));
  const fps = parseFloat(op('fps', '30'));
  const de = parseFloat(op('de', '0'));
  const dur = Math.min(parseFloat(op('dur', String(FIM))), FIM - de);
  const largura = parseInt(op('largura', '1080'), 10);
  const altura = Math.round(largura * 1920 / 1080 / 2) * 2;
  const n = Math.round(dur * fps);
  const enc = abrirEncoder({ saida, fps, largura, altura });
  const t0 = Date.now();
  for (let f = 0; f < n; f++) {
    await enc.quadro(b64(await pg.evaluate(`window.renderFrame(${de + (f + 0.5) / fps})`)));
    if (f % 15 === 0) console.log(`quadro ${f}/${n}  ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  await enc.fechar();
  console.log(`pronto: ${saida}  (${((Date.now() - t0) / 1000).toFixed(1)} s de render)`);
}
await nav.close();
