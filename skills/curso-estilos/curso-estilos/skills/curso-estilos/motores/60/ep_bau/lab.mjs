// laboratório de efeito: renderiza -> olha a tira -> corrige (3 rodadas costumam bastar)
// node ep_bau/lab.mjs <nome> [n]  -> ep_bau/_lab/<nome>.png : n quadros do trecho, recortados e lado a lado, ampliados 3x
import { fileURLToPath } from "node:url";
import { quadro, resetar, TEMPOS as t } from "./ep.mjs";
import { Tela, salvarNativo } from "../motor/core.mjs";
const CH = 196; // linha do chão
// nome: [início, fim, [x, y, largura, altura] do recorte no quadro 135x240]
const P = {
  bota:   [t.abriu - 0.1, t.abriu + 1.6, [20, CH - 70, 95, 80]],
  ouro:   [t.ouro - 0.3, t.ouro + 1.4, [20, CH - 70, 95, 80]],
  pombo:  [t.cientista, t.skinner + 0.6, [30, CH - 100, 105, 110]],
  bicada: [t.se2, t.se2 + 1.2, [30, CH - 40, 80, 50]],
  botoes: [t.abre - 0.1, t.comenta + 1.2, [0, 90, 135, 60]],
};
const [nome, nArg] = process.argv.slice(2); const n = +nArg || 10;
if (!P[nome]) { console.log("trechos:", Object.keys(P).join(", ")); process.exit(1); }
const [a, b, [x, y, w, h]] = P[nome];
const cols = Math.min(n, Math.max(1, Math.floor(540 / w))), rows = Math.ceil(n / cols);
const out = new Tela((w + 2) * cols, (h + 2) * rows); out.limpar(0xff000000);
for (let i = 0; i < n; i++) {
  const tt = a + ((b - a) * i) / (n - 1); resetar(); const q = quadro(tt);
  const ox = (i % cols) * (w + 2), oy = Math.floor(i / cols) * (h + 2);
  for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) out.C[(oy + j) * out.w + ox + k] = q.C[(y + j) * q.w + x + k];
}
salvarNativo(fileURLToPath(new URL(`_lab/${nome}.png`, import.meta.url)), out, 3);
console.log(nome, a.toFixed(2), b.toFixed(2));
