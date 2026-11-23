// tempos provisórios das palavras (~2,9 palavras/s, pausa na pontuação) para animar antes de gravar a voz
// node ep_bau/provisorio.mjs   -> ep_bau/voz/provisorio.words.json  (lê voz/narracao_intro.txt + voz/narracao.txt)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const V = new URL("voz/", import.meta.url);
const le = (f) => (existsSync(new URL(f, V)) ? readFileSync(new URL(f, V), "utf8").trim() : "");
const txt = (le("narracao_intro.txt") + " " + le("narracao.txt")).trim().split(/\s+/);
let t = 0.3; const out = [];
for (const w of txt) {
  const d = 0.12 + 0.055 * w.replace(/[^\p{L}\p{N}]/gu, "").length;
  out.push({ w, start: Math.round(t * 100) / 100, end: Math.round((t + d) * 100) / 100 }); t += d + 0.06;
  if (/[.?!]$/.test(w)) t += 0.35; else if (/[,…]$/.test(w)) t += 0.25;
}
writeFileSync(new URL("provisorio.words.json", V), JSON.stringify(out, null, 0));
console.log(out.length, "palavras,", t.toFixed(1), "s");
