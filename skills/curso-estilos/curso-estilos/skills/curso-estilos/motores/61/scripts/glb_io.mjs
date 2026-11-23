// Leitura e escrita de GLB (glTF binário) sem dependências.
import fs from 'node:fs';

export function lerGlb(arq) {
  const d = fs.readFileSync(arq);
  if (d.readUInt32LE(0) !== 0x46546c67) throw new Error(`${arq}: não é um GLB`);
  const nJson = d.readUInt32LE(12);
  const json = JSON.parse(d.subarray(20, 20 + nJson).toString('utf8'));
  let bin = Buffer.alloc(0);
  const p = 20 + nJson;
  if (p < d.length) { const nBin = d.readUInt32LE(p); bin = d.subarray(p + 8, p + 8 + nBin); }
  return { json, bin };
}

export function gravarGlb(arq, json, bin) {
  let j = Buffer.from(JSON.stringify(json), 'utf8');
  if (j.length % 4) j = Buffer.concat([j, Buffer.alloc(4 - (j.length % 4), 0x20)]);
  if (bin.length % 4) bin = Buffer.concat([bin, Buffer.alloc(4 - (bin.length % 4))]);
  const cab = Buffer.alloc(12); cab.writeUInt32LE(0x46546c67, 0); cab.writeUInt32LE(2, 4); cab.writeUInt32LE(12 + 8 + j.length + 8 + bin.length, 8);
  const cj = Buffer.alloc(8); cj.writeUInt32LE(j.length, 0); cj.writeUInt32LE(0x4e4f534a, 4);
  const cb = Buffer.alloc(8); cb.writeUInt32LE(bin.length, 0); cb.writeUInt32LE(0x004e4942, 4);
  fs.writeFileSync(arq, Buffer.concat([cab, cj, j, cb, bin]));
}
