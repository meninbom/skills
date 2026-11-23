// Quadros parados pelo renderer, para aprovar antes de gastar o render do filme.
//   node stills.mjs prancha            -> saida/prancha_<quadro>.jpg, um quadro-chave por plano (escala 0,5)
//   node stills.mjs quadros 60,400,700 -> saida/q_<quadro>.jpg
//   node stills.mjs quadros 60 1       -> o mesmo em tamanho cheio (1080x1920)
// DEMO_CPU=1 renderiza sem placa de vídeo.
import fs from 'node:fs';
import path from 'node:path';

let bundle, renderStill, selectComposition;
try {
  ({ bundle } = await import('@remotion/bundler'));
  ({ renderStill, selectComposition } = await import('@remotion/renderer'));
} catch {
  console.error('Faltam as dependências. Rode "npm install" nesta pasta (uma vez) e tente de novo.');
  process.exit(1);
}
const { opcoesNavegador } = await import('./chrome.mjs');

const [modo = 'prancha', lista, escala = '0.5'] = process.argv.slice(2);
// quadro-chave de cada um dos 6 planos do curta de exemplo; troque quando escrever a sua história
const PRANCHA = [70, 250, 420, 520, 620, 760];
const quadros = modo === 'prancha' ? PRANCHA : String(lista || '').split(',').filter(Boolean).map(Number);
if (!quadros.length || quadros.some(Number.isNaN)) {
  console.error('Uso: node stills.mjs prancha | node stills.mjs quadros 60,400,700 [escala]');
  process.exit(1);
}
const nav = opcoesNavegador();
fs.mkdirSync(path.resolve('saida'), { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
const composition = await selectComposition({ serveUrl, id: 'BalaoShort', ...nav, timeoutInMilliseconds: 240000 });
for (const f of quadros) {
  const t0 = Date.now();
  const output = path.resolve('saida', `${modo === 'prancha' ? 'prancha' : 'q'}_${String(f).padStart(4, '0')}.jpg`);
  await renderStill({ composition, serveUrl, frame: f, output, imageFormat: 'jpeg', jpegQuality: 90, scale: Number(escala), ...nav, timeoutInMilliseconds: 240000 });
  console.log(`${path.relative(process.cwd(), output)} em ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
