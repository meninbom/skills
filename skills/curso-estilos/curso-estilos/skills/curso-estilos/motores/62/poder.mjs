// poder.mjs: renderiza um poder isolado inteiro (8,7 s, 540×960).  uso: node poder.mjs [gelo|fogo|raio|cura]   -> saida/poder_<nome>.mp4
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const p = process.argv[2] || 'gelo';
if (!['gelo', 'fogo', 'raio', 'cura'].includes(p)) { console.error('poderes: gelo, fogo, raio, cura'); process.exit(2); }
const r = spawnSync(process.execPath, [path.join(AQUI, 'render.mjs'), '--pagina', 'poder/poder.html', '--query', `p=${p}&esc=0.5&ss=1`, '--fps', '30', '--saida', `saida/poder_${p}.mp4`], { stdio: 'inherit', cwd: AQUI });
process.exit(r.status ?? 1);
