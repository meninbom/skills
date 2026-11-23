// mostra todos os quadros de uma animação lado a lado, com uma linha no meio de cada quadro (para conferir o recorte)
// node sprites/tira.mjs kRun   -> sprites/_tira_kRun.png
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Tela, salvarNativo } from "../motor/core.mjs";
const AQUI = new URL(".", import.meta.url);
const k = process.argv[2] || "kIdle";
const idx = JSON.parse(readFileSync(new URL("assets/index.json", AQUI), "utf8"))[k];
if (!idx) throw new Error("animação desconhecida: " + k);
const fw = Math.max(...idx.map((q) => q[1])), fh = Math.max(...idx.map((q) => q[2]));
const t = new Tela(idx.length * (fw + 2), fh + 2); t.limpar(0xff406040);
idx.forEach(([fn, w, h], n) => {
  const b = readFileSync(new URL(fn, AQUI)); const C = new Uint32Array(b.buffer, b.byteOffset, w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = C[y * w + x]; if ((c >>> 24) > 127) t.C[(y + 1) * t.w + n * (fw + 2) + x + 1] = c; }
  for (let y = 0; y < fh + 2; y += 4) t.C[y * t.w + n * (fw + 2) + (fw >> 1)] = 0xff00ffff;
});
salvarNativo(fileURLToPath(new URL("_tira_" + k + ".png", AQUI)), t, 2);
console.log(k, idx.length, "quadros de", idx[0][1], "x", idx[0][2]);
