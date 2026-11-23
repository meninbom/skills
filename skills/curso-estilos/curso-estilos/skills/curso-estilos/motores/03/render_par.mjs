// Render em paralelo: divide o filme em N trechos (limites em quadro inteiro), roda N render.mjs e junta sem recomprimir.
//   node render_par.mjs --saida saida/filme.mp4 [--pagina episodio.html] [--n 6] [--qps 60] [--ini 0] [--fim X]
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const arg = (nome, padrao) => { const i = process.argv.indexOf('--' + nome); return i > 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : padrao; };
const PAGINA = arg('pagina', 'episodio.html'), SAIDA = arg('saida', 'saida/filme.mp4'), N = +arg('n', 6), QPS = +arg('qps', 60), INI = +arg('ini', 0);
let fim = arg('fim');
const R = path.join(RAIZ, 'render.mjs');
if (fim === undefined) {   // a página imprime "FIM <segundos>" no console
  const o = spawnSync(process.execPath, [R, '--pagina', PAGINA, '--tempos', '0', '--lt', '90', '--saida', path.join(RAIZ, 'saida', '_fim.jpg')], { cwd: RAIZ, encoding: 'utf8' });
  const m = /FIM ([0-9.]+)/.exec(o.stdout || '');
  if (!m) { console.error('Não achei a duração (a página não imprimiu "FIM"). Passe --fim.'); process.exit(1); }
  fim = m[1];
}
const f0 = Math.round(INI * QPS), f1 = Math.round(+fim * QPS), cortes = Array.from({ length: N + 1 }, (_, k) => f0 + Math.round((f1 - f0) * k / N));
fs.mkdirSync(path.join(RAIZ, 'saida'), { recursive: true });
const partes = cortes.slice(0, -1).map((_, k) => path.join(RAIZ, 'saida', `_parte${k}.mp4`));
const roda = k => new Promise((ok, erro) => {
  const p = spawn(process.execPath, [R, '--pagina', PAGINA, '--video', partes[k], '--qps', String(QPS), '--ini', String(cortes[k] / QPS), '--fim', String(cortes[k + 1] / QPS)], { cwd: RAIZ, stdio: ['ignore', 'ignore', 'inherit'] });
  p.on('close', c => (c ? erro(new Error('parte ' + k + ' falhou')) : ok()));
});
await Promise.all(partes.map((_, k) => roda(k)));
const lista = path.join(RAIZ, 'saida', '_partes.txt');
fs.writeFileSync(lista, partes.map(x => `file '${path.basename(x)}'\n`).join(''));
const j = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lista, '-c', 'copy', '-movflags', '+faststart', path.resolve(RAIZ, SAIDA)], { stdio: 'inherit' });
for (const x of [...partes, lista]) fs.rmSync(x, { force: true });
if (j.status) process.exit(1);
console.log('ok', SAIDA, 'quadros', f1 - f0);
