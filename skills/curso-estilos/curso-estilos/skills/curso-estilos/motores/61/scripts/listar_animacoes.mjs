// Lista os clipes de animação de um GLB, com a duração de cada um.
// uso: node scripts/listar_animacoes.mjs personagem/kaykit/Mage.glb
import { lerGlb } from './glb_io.mjs';

const arq = process.argv[2];
if (!arq) { console.error('uso: node scripts/listar_animacoes.mjs <arquivo.glb>'); process.exit(1); }
const { json } = lerGlb(arq);
const anims = json.animations || [];
for (const a of anims) {
  let dur = 0;
  for (const s of a.samplers) dur = Math.max(dur, json.accessors[s.input].max?.[0] ?? 0);
  console.log(`${a.name.padEnd(34)} ${dur.toFixed(2)} s`);
}
console.log(`${anims.length} clipes`);
