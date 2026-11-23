// prints numerados: 1 quadro por plano (ou os tempos pedidos) -> ep_bau/_prints/NN_tempo.png (ampliado 3x)
// node ep_bau/prints.mjs            (um por plano)
// node ep_bau/prints.mjs 12.4 13.1  (tempos em segundos)
import { fileURLToPath } from "node:url";
const { quadro, resetar, PLANOS, DUR } = await import("./ep.mjs");
const { salvarNativo } = await import("../motor/core.mjs");
const PASTA = fileURLToPath(new URL("_prints/", import.meta.url));
const arg = process.argv.slice(2).map(Number);
const ts = arg.length ? arg : PLANOS.map(([a, b]) => Math.min(b - 0.1, a + (Math.min(b, DUR) - a) * 0.75));
for (const [i, tt] of ts.entries()) { resetar(); salvarNativo(`${PASTA}${String(i + 1).padStart(2, "0")}_${tt.toFixed(2)}.png`, quadro(tt), 3); }
console.log(ts.map((x) => x.toFixed(2)).join(" "));
