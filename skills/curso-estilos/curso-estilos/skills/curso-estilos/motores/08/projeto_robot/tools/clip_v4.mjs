// v4: clipes curtos da pagina de aprovacao (540 px, 24 fps). NAO e o render final: so trechos de <= 6 s.
// uso: node tools/clip_v4.mjs jobs.json
//   jobs = [{"out": ".../x.mp4", "trechos": [{"t0": 15.5, "t1": 19.5, "props": {}}], "audio": "som/mix_v4_b.wav" | null}]
//   varios trechos sao emendados (ex.: fim do filme + inicio, para ver o loop); o audio segue os mesmos trechos.
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const proj = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'robot_v4_clip_'));
const serveUrl = await bundle({entryPoint: path.join(proj, 'src/index.ts'), publicDir: path.join(proj, 'public'), enableCaching: false});
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], {stdio: 'inherit'});
for (const [j, job] of jobs.entries()) {
  const partes = [];
  for (const [k, tr] of job.trechos.entries()) {
    const props = tr.props || {};
    const comp = await selectComposition({serveUrl, id: 'Robot', inputProps: props, chromiumOptions: {gl: 'angle'}});
    const f0 = Math.round(tr.t0 * comp.fps), f1 = Math.min(comp.durationInFrames - 1, Math.round(tr.t1 * comp.fps) - 1);
    const mudo = path.join(tmp, `p${j}_${k}.mp4`);
    await renderMedia({serveUrl, composition: comp, codec: 'h264', outputLocation: mudo, inputProps: props, frameRange: [f0, f1],
      scale: 0.5, muted: true, crf: 20, concurrency: 4, chromiumOptions: {gl: 'angle'}, overwrite: true});
    let parte = mudo;
    if (job.audio) {
      parte = path.join(tmp, `a${j}_${k}.mp4`);
      ff(['-i', mudo, '-ss', String(f0 / comp.fps), '-t', String((f1 - f0 + 1) / comp.fps), '-i', job.audio,
        '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-shortest', parte]);
    }
    partes.push(parte);
  }
  fs.mkdirSync(path.dirname(job.out), {recursive: true});
  if (partes.length === 1) {
    fs.copyFileSync(partes[0], job.out);
  } else {
    const lista = path.join(tmp, `l${j}.txt`);
    fs.writeFileSync(lista, partes.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n'));
    ff(['-f', 'concat', '-safe', '0', '-i', lista, '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p',
      ...(job.audio ? ['-c:a', 'aac', '-b:a', '160k'] : []), '-movflags', '+faststart', job.out]);
  }
  console.log('ok', path.basename(job.out));
}
