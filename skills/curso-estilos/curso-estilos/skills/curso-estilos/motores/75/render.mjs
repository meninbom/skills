// node render.mjs demo            -> saida/demo.mp4   (3 s, 540x960, 30 qps, mudo, yuv420p)
// node render.mjs filme           -> saida/filme.mp4  (o curta inteiro, 1080x1920, mudo, yuv420p)
// node render.mjs filme --2k      -> saida/filme_2k.mp4 (1440x2560)
// Usa o Chrome do sistema (CHROME_PATH ou caminhos padrão). DEMO_CPU=1 renderiza sem placa de vídeo.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

let bundle, renderMedia, selectComposition;
try {
  ({ bundle } = await import('@remotion/bundler'));
  ({ renderMedia, selectComposition } = await import('@remotion/renderer'));
} catch {
  console.error('Faltam as dependências. Rode "npm install" nesta pasta (uma vez) e tente de novo.');
  process.exit(1);
}
const { opcoesNavegador } = await import('./chrome.mjs');

const modo = process.argv[2] || 'demo';
const demo = modo !== 'filme';
const doisK = process.argv.includes('--2k');
const nav = opcoesNavegador();
const t0 = Date.now();
fs.mkdirSync(path.resolve('saida'), { recursive: true });
console.log(`Chrome: ${nav.browserExecutable}${nav.chromiumOptions.gl ? ' · GL: ' + nav.chromiumOptions.gl : ''}`);

const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
const composition = await selectComposition({ serveUrl, id: 'BalaoShort', ...nav, timeoutInMilliseconds: 240000 });
const saida = path.resolve('saida', demo ? 'demo.mp4' : doisK ? 'filme_2k.mp4' : 'filme.mp4');
// Demo: 90 quadros a partir do 380 (plano 3: os irmãos acendem a palha e o balão começa a encher).
const A = Number(process.env.DEMO_INICIO || 380);
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
  // 4/3 escrito como divisão: "1.3333" dá altura quebrada (2559,936) e o Remotion recusa
  scale: demo ? 0.5 : doisK ? 4 / 3 : 1,
  frameRange: demo ? [A, A + 89] : null,
  // 4 abas no máximo e 4 min de tolerância por quadro: com mais abas, os quadros de transição
  // (dois canvases 3D ao mesmo tempo) estouram o tempo padrão de 30 s
  concurrency: Math.max(1, Math.min(4, os.cpus().length - 1)),
  timeoutInMilliseconds: 240000,
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
