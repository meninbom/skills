// Deixa num GLB só os clipes de animação que a cena usa e regrava o binário sem os dados que sobraram.
// Um personagem do KayKit vem com 76 clipes (3,6 MB); com 15 clipes fica perto de 1 MB e carrega mais rápido.
// uso: node scripts/aparar_glb.mjs entrada.glb saida.glb Idle,Cheer,Hit_A
import { lerGlb, gravarGlb } from './glb_io.mjs';

const [ent, sai, lista] = process.argv.slice(2);
if (!ent || !sai || !lista) { console.error('uso: node scripts/aparar_glb.mjs <entrada.glb> <saida.glb> <Clipe1,Clipe2,...>'); process.exit(1); }
const manter = new Set(lista.split(','));
const { json, bin } = lerGlb(ent);
const antes = (json.animations || []).length;
json.animations = (json.animations || []).filter((a) => manter.has(a.name));
const faltou = [...manter].filter((n) => !json.animations.some((a) => a.name === n));
if (!json.animations.length) delete json.animations;

// accessors ainda em uso
const usados = new Set();
for (const m of json.meshes || []) for (const p of m.primitives) {
  for (const i of Object.values(p.attributes)) usados.add(i);
  if (p.indices !== undefined) usados.add(p.indices);
  for (const t of p.targets || []) for (const i of Object.values(t)) usados.add(i);
}
for (const s of json.skins || []) if (s.inverseBindMatrices !== undefined) usados.add(s.inverseBindMatrices);
for (const a of json.animations || []) for (const s of a.samplers) { usados.add(s.input); usados.add(s.output); }
if ((json.accessors || []).some((a) => a.sparse)) throw new Error('accessor esparso: este script não trata');

const ordem = [...usados].sort((a, b) => a - b);
const mapaAcc = new Map(ordem.map((v, i) => [v, i]));
const acc = ordem.map((i) => json.accessors[i]);
for (const m of json.meshes || []) for (const p of m.primitives) {
  for (const k of Object.keys(p.attributes)) p.attributes[k] = mapaAcc.get(p.attributes[k]);
  if (p.indices !== undefined) p.indices = mapaAcc.get(p.indices);
  for (const t of p.targets || []) for (const k of Object.keys(t)) t[k] = mapaAcc.get(t[k]);
}
for (const s of json.skins || []) if (s.inverseBindMatrices !== undefined) s.inverseBindMatrices = mapaAcc.get(s.inverseBindMatrices);
for (const a of json.animations || []) for (const s of a.samplers) { s.input = mapaAcc.get(s.input); s.output = mapaAcc.get(s.output); }

// bufferViews ainda em uso (accessors + imagens embutidas)
const bvUsados = new Set();
for (const a of acc) if (a.bufferView !== undefined) bvUsados.add(a.bufferView);
for (const im of json.images || []) if (im.bufferView !== undefined) bvUsados.add(im.bufferView);
const ordemBv = [...bvUsados].sort((a, b) => a - b);
const mapaBv = new Map(ordemBv.map((v, i) => [v, i]));
const pedacos = []; let pos = 0;
const bvs = ordemBv.map((i) => {
  const v = { ...json.bufferViews[i] };
  if ((v.buffer || 0) !== 0) throw new Error('GLB com mais de um buffer: este script não trata');
  const dado = bin.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength);
  const sobra = (4 - (pos % 4)) % 4; if (sobra) { pedacos.push(Buffer.alloc(sobra)); pos += sobra; }
  v.byteOffset = pos; pedacos.push(dado); pos += dado.length; return v;
});
for (const a of acc) if (a.bufferView !== undefined) a.bufferView = mapaBv.get(a.bufferView);
for (const im of json.images || []) if (im.bufferView !== undefined) im.bufferView = mapaBv.get(im.bufferView);
json.accessors = acc; json.bufferViews = bvs;
const novo = Buffer.concat(pedacos);
json.buffers = [{ byteLength: novo.length + ((4 - (novo.length % 4)) % 4) }];
gravarGlb(sai, json, novo);
console.log(`${sai}: ${antes} → ${(json.animations || []).length} clipes, ${(bin.length / 1e6).toFixed(2)} → ${(novo.length / 1e6).toFixed(2)} MB de binário`);
if (faltou.length) console.log('  não existem neste arquivo:', faltou.join(', '));
