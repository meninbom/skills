// Demo do estilo 04: (1) assa a luz do mundo voxel se ainda não existir (CPU, ~15–60 s, ~75 MB em motor/data),
// (2) junta cabeça + comum + planos do EP01 em shots_cas_ep01.js, (3) renderiza 3 s em ../saida/demo.mp4 (540x960, 15 qps, mudo).
//   node motor/demo.mjs [--so-assar] [--ini 1.5] [--seg 3] [--qps 15]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const M = path.dirname(fileURLToPath(import.meta.url));
const arg = (nome, padrao) => { const i = process.argv.indexOf('--' + nome); return i > 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : padrao; };
const roda = (args, env = {}) => { const r = spawnSync(process.execPath, args, { cwd: M, stdio: 'inherit', env: { ...process.env, ...env } }); if (r.status) process.exit(r.status || 1); };

if (!fs.existsSync(path.join(M, 'data', 'meta.json'))) {
  console.log('assando a luz do mundo (só na primeira vez)...');
  fs.mkdirSync(path.join(M, 'data'), { recursive: true });
  roda(['bake.mjs'], { DATA: 'data', ROCKET: '0' });
}
if (process.argv.includes('--so-assar')) process.exit(0);

const EP = arg('ep', 'ep01');
fs.writeFileSync(path.join(M, `shots_cas_${EP}.js`), ['shots_cas_head.js', 'shots_cas_common.js', `shots_cas_${EP}_tail.js`].map(f => fs.readFileSync(path.join(M, f), 'utf8')).join('\n'));
fs.mkdirSync(path.join(M, '..', 'saida'), { recursive: true });
roda(['render.mjs', 'video', arg('seg', '3'), arg('qps', '15')], { Q: `?shots=shots_cas_${EP}.js&ep=${EP}&norocket&data=data`, OUT: '../saida/demo.mp4', START: arg('ini', '1.5'), LARGURA: '540' });
console.log('ok saida/demo.mp4');
