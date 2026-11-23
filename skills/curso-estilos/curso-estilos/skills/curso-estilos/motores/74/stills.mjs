// node stills.mjs board            -> saida/board/S1..S10.png (quadro-chave de cada plano)
// node stills.mjs board S3 S8      -> só esses planos
// node stills.mjs frames 100 300   -> saida/frames/fNNNN.png (quadros avulsos do filme)
// node stills.mjs cast             -> saida/cast.png (ficha do personagem)
import fs from 'node:fs';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { opcoesNavegador } from './chrome.mjs';

const [mode, ...rest] = process.argv.slice(2);
const nav = opcoesNavegador();
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
const scale = 0.5;
fs.mkdirSync(path.resolve('saida'), { recursive: true });
if (mode === 'board') {
  const out = path.resolve('saida', 'board');
  fs.mkdirSync(out, { recursive: true });
  const composition = await selectComposition({ serveUrl, id: 'InsoneBoard', ...nav });
  const ids = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'];
  for (let i = 0; i < ids.length; i++) {
    if (rest.length && !rest.includes(ids[i])) continue;
    await renderStill({ serveUrl, composition, ...nav, frame: i, output: path.join(out, `${ids[i]}.png`), overwrite: true, scale });
    process.stdout.write(ids[i] + ' ');
  }
} else if (mode === 'cast') {
  const composition = await selectComposition({ serveUrl, id: 'VCast', ...nav });
  await renderStill({ serveUrl, composition, ...nav, frame: 0, output: path.resolve('saida', 'cast.png'), overwrite: true, scale });
} else {
  const out = path.resolve('saida', 'frames');
  fs.mkdirSync(out, { recursive: true });
  const composition = await selectComposition({ serveUrl, id: 'Insone', ...nav });
  for (const fr of rest.map(Number)) {
    await renderStill({ serveUrl, composition, ...nav, frame: fr, output: path.join(out, `f${String(fr).padStart(4, '0')}.png`), overwrite: true, scale });
    process.stdout.write(fr + ' ');
  }
}
console.log('done');
