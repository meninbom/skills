// Mix simples com FFmpeg: voz + efeitos de ep_bau/som/deixas.json (+ trilha, se existir) sobre o vídeo mudo.
// node ep_bau/mixar.mjs [--video saida/ep_bau_mudo.mp4] [--voz ep_bau/voz/narr_full_-16.wav]
//   -> saida/ep_bau.mp4 (1080x1920) e saida/ep_bau_celular.mp4 (720x1280, vizinho mais próximo)
// Cada efeito é posto N dB abaixo da voz comparando os PICOS dos arquivos (medida simples). Efeito que falta é pulado com aviso.
// É um ponto de partida: confira de ouvido, no celular, e ajuste os dB no gen_mix.mjs. Não faz "duck" da trilha.
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL("..", import.meta.url)), EP = fileURLToPath(new URL(".", import.meta.url));
const FF = process.env.FFMPEG || "ffmpeg";
const a = process.argv.slice(2), op = (n, p) => { const i = a.indexOf("--" + n); return i >= 0 ? a[i + 1] : p; };
const video = resolve(RAIZ, op("video", "saida/ep_bau_mudo.mp4"));
const voz = resolve(RAIZ, op("voz", existsSync(resolve(EP, "voz/narr_full_-16.wav")) ? "ep_bau/voz/narr_full_-16.wav" : "ep_bau/voz/narr_A_-16.wav"));
for (const f of [video, voz, resolve(EP, "som/deixas.json")]) if (!existsSync(f)) { console.error("falta " + f); process.exit(1); }
const conf = JSON.parse(readFileSync(resolve(EP, "som/deixas.json"), "utf8"));

const picos = new Map();
function pico(arq) { // pico em dBFS
  if (!picos.has(arq)) { const r = spawnSync(FF, ["-hide_banner", "-i", arq, "-af", "volumedetect", "-f", "null", "-"], { encoding: "utf8" }); const m = /max_volume: (-?[\d.]+) dB/.exec(r.stderr || ""); picos.set(arq, m ? +m[1] : 0); }
  return picos.get(arq);
}
const pv = pico(voz), ent = ["-i", video, "-i", voz], filtros = [], nomes = ["[1:a]"], faltam = new Set();
let n = 2;
const entra = (arq, { t = 0, fatia, fade_out_s, abaixo_voz_db }) => {
  const ganho = pv - abaixo_voz_db - pico(arq), ms = Math.max(0, Math.round(t * 1000));
  if (fatia) ent.push("-ss", String(fatia[0]), "-t", String(fatia[1] - fatia[0]));
  ent.push("-i", arq);
  const d = fatia ? fatia[1] - fatia[0] : null, fade = fade_out_s && d ? `,afade=t=out:st=${Math.max(0, d - fade_out_s).toFixed(3)}:d=${fade_out_s}` : "";
  filtros.push(`[${n}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${ganho.toFixed(1)}dB${fade},adelay=${ms}:all=1[s${n}]`); nomes.push(`[s${n}]`); n++;
};
for (const s of conf.sfx) { const arq = resolve(EP, "som/sfx", s.som + ".wav"); if (!existsSync(arq)) { faltam.add(s.som); continue; } entra(arq, s); }
const trilha = resolve(EP, conf.trilha.arquivo);
if (existsSync(trilha)) entra(trilha, { abaixo_voz_db: conf.trilha.abaixo_voz_db, fatia: [0, conf.duracao], fade_out_s: 0.6 });
if (faltam.size) console.log("sem arquivo em ep_bau/som/sfx (pulados):", [...faltam].map((s) => `${s}.wav (${conf.sons[s]})`).join("; "));
filtros.push(`${nomes.join("")}amix=inputs=${nomes.length}:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[mix]`);
const final = resolve(RAIZ, "saida/ep_bau.mp4"), cel = resolve(RAIZ, "saida/ep_bau_celular.mp4");
let r = spawnSync(FF, ["-v", "error", "-y", ...ent, "-filter_complex", filtros.join(";"), "-map", "0:v", "-map", "[mix]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", String(conf.duracao), "-movflags", "+faststart", final], { stdio: "inherit" });
if (r.status !== 0) process.exit(1);
r = spawnSync(FF, ["-v", "error", "-y", "-i", final, "-vf", "scale=720:1280:flags=neighbor", "-c:v", "libx264", "-crf", "20", "-preset", "slow", "-tune", "animation", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-movflags", "+faststart", cel], { stdio: "inherit" });
console.log(r.status === 0 ? `pronto: ${final} e ${cel} (${nomes.length - 1} sons além da voz)` : "falhou a versão de celular");
