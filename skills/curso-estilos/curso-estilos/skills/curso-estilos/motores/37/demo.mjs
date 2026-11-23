// demo.mjs: UM comando -> saida/demo.mp4 (3 s, 540x960, 15 qps, mudo, yuv420p). Uso: npm run demo
// Trecho padrão: o plano da rua (o boneco VRM em cel andando). Troque com DEMO_T0 / DEMO_T1 (segundos do filme).
// DEMO_CPU=1 renderiza por software (sem placa de vídeo; leva alguns minutos).
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const env = { ...process.env, S: process.env.S || '0.5', T0: process.env.DEMO_T0 || '0.6', T1: process.env.DEMO_T1 || '3.6', PASSO: process.env.PASSO || '2',
  SAIDA: '540x960', OUT: '../saida/demo.mp4' };
const t0 = Date.now();
const r = spawnSync(process.execPath, [path.join(here, 'ep01', 'render.mjs'), 'video'], { stdio: 'inherit', env });
if (r.status !== 0) { console.error('demo falhou'); process.exit(r.status || 1); }
console.log(`demo ok: saida/demo.mp4 em ${((Date.now() - t0) / 1000).toFixed(0)} s`);
