// modulos.mjs: um MP4 de 3 s (540×960, 30 qps, mudo) para cada módulo do kit de juice.
// uso: node modulos.mjs [hitstop,numeros,barra]      -> saida/modulos/<nome>.mp4     (sem argumento: os 11)
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const TODOS = ['hitstop', 'squash', 'numeros', 'barra', 'smear', 'velocidade', 'item', 'carta', 'particulas', 'raiox', 'hud'];
const quais = process.argv[2] ? process.argv[2].split(',') : TODOS;
for (const d of quais) {
  if (!TODOS.includes(d)) { console.error('módulo desconhecido:', d, '· existem:', TODOS.join(', ')); process.exit(2); }
  const r = spawnSync(process.execPath, [path.join(AQUI, 'render.mjs'), '--pagina', 'kit_juice/demo.html', '--query', `d=${d}&esc=0.5&ss=1`, '--fps', '30', '--saida', `saida/modulos/${d}.mp4`], { stdio: 'inherit', cwd: AQUI });
  if (r.status) process.exit(r.status);
}
