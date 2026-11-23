// Quadros soltos para conferir layout sem renderizar o filme: 1 bundle, varios stills (meia resolucao).
// uso: node tools/quadros.mjs 6.6 17.6 26.6   -> out/q_<t>.jpg
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const proj = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ts = process.argv.slice(2).map(Number);
const serveUrl = await bundle({entryPoint: path.join(proj, 'src/index.ts'), publicDir: path.join(proj, 'public'),
  enableCaching: false});
const comp = await selectComposition({serveUrl, id: 'Robot', chromiumOptions: {gl: 'angle'}});
for (const t of ts) {
  const frame = Math.round(t * comp.fps);
  const output = path.join(proj, 'out', `q_${t.toFixed(2)}.jpg`);
  await renderStill({serveUrl, composition: comp, frame, output, imageFormat: 'jpeg', jpegQuality: 90, scale: 0.5,
    chromiumOptions: {gl: 'angle'}, overwrite: true});
  console.log('ok', output);
}
