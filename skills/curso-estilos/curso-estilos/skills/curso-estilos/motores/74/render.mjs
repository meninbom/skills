// node render.mjs demo    -> saida/demo.mp4   (3 s, 540x960, 30 qps, mudo, yuv420p)
// node render.mjs filme   -> saida/filme.mp4  (o filme inteiro, 1080x1920, mudo, yuv420p)
// Usa o Chrome do sistema (CHROME_PATH ou caminhos padrão). DEMO_CPU=1 renderiza sem placa de vídeo.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { opcoesNavegador } from './chrome.mjs';

const modo = process.argv[2] || 'demo';
const demo = modo !== 'filme';
const nav = opcoesNavegador();
const t0 = Date.now();
fs.mkdirSync(path.resolve('saida'), { recursive: true });
console.log(`Chrome: ${nav.browserExecutable}${nav.chromiumOptions.gl ? ' · GL: ' + nav.chromiumOptions.gl : ''}`);

const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
const composition = await selectComposition({ serveUrl, id: 'Insone', ...nav });
const saida = path.resolve('saida', demo ? 'demo.mp4' : 'filme.mp4');
// Demo: 90 quadros a partir do 168 (plano 3: o microssono na mesa, com o card e o relógio do HUD correndo).
const A = Number(process.env.DEMO_INICIO || 168);
let ultimo = -1;
await renderMedia({
  serveUrl,
  composition,
  ...nav,
  codec: 'h264',
  imageFormat: 'png', // com JPEG o H.264 sai em yuvj420p (faixa cheia), que alguns celulares e apps recusam
  pixelFormat: 'yuv420p',
  muted: true,
  enforceAudioTrack: false,
  crf: demo ? 20 : 16,
  scale: demo ? 0.5 : 1,
  frameRange: demo ? [A, A + 89] : null,
  concurrency: demo ? Math.max(1, Math.min(4, os.cpus().length - 1)) : null,
  outputLocation: saida,
  overwrite: true,
  onProgress: ({ renderedFrames }) => {
    const d = Math.floor(renderedFrames / 30);
    if (d !== ultimo) {
      ultimo = d;
      process.stdout.write(`${renderedFrames} `);
    }
  },
});
console.log(`\nok: ${path.relative(process.cwd(), saida)} em ${((Date.now() - t0) / 1000).toFixed(0)} s`);
