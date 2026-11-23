// v4: stills da pagina de aprovacao sem renderizar o filme. 1 bundle, varios quadros, meia resolucao (540 px).
// uso: node tools/stills_v4.mjs jobs.json        jobs = [{"t": 7.0, "out": "out/01_b.jpg", "props": {"fecho": "b"}}, ...]
//      node tools/stills_v4.mjs --t 7.0 17.0      (rapido: out/v4/q_<t>.jpg com as props padrao)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const proj = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let jobs;
if (process.argv[2] === '--t') {
  fs.mkdirSync(path.join(proj, 'out', 'v4'), {recursive: true});
  jobs = process.argv.slice(3).map((t) => ({t: Number(t), out: path.join(proj, 'out', 'v4', `q_${Number(t).toFixed(2)}.jpg`), props: {}}));
} else {
  jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
}
const serveUrl = await bundle({entryPoint: path.join(proj, 'src/index.ts'), publicDir: path.join(proj, 'public'), enableCaching: false});
const comps = {};
for (const j of jobs) {
  const key = JSON.stringify(j.props || {});
  if (!comps[key]) comps[key] = await selectComposition({serveUrl, id: 'Robot', inputProps: j.props || {}, chromiumOptions: {gl: 'angle'}});
  const comp = comps[key];
  const frame = Math.min(comp.durationInFrames - 1, Math.round(j.t * comp.fps));
  fs.mkdirSync(path.dirname(j.out), {recursive: true});
  await renderStill({serveUrl, composition: comp, frame, output: j.out, imageFormat: 'jpeg', jpegQuality: 90, scale: 0.5,
    inputProps: j.props || {}, chromiumOptions: {gl: 'angle'}, overwrite: true});
  console.log('ok', j.t, path.basename(j.out), key);
}
