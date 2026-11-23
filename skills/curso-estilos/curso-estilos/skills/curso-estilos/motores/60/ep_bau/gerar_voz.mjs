// Narração pela API da ElevenLabs, com o tempo de cada palavra. PAGO: gasta créditos da SUA conta.
//   node ep_bau/gerar_voz.mjs corpo                    -> só mostra quantos caracteres vai gastar (não chama a API)
//   node ep_bau/gerar_voz.mjs corpo --confirmo-custo   -> voz/narr_A.mp3, voz/narr_A_-16.wav, voz/narr_A.display.words.json
//   node ep_bau/gerar_voz.mjs intro --confirmo-custo   -> voz/narr_I.* (depois: python ep_bau/junta_voz.py)
// Variáveis de ambiente: ELEVENLABS_API_KEY (obrigatória) e ELEVENLABS_VOICE_ID (a voz escolhida na sua conta).
// Opcionais: --modelo eleven_v3  --velocidade 1.1 (teto: acima disso a fala soa acelerada)  --estabilidade 0.3  --estilo 0.6
// Este script não foi executado no pacote do curso (é pago): confira o nome do modelo e os limites na documentação da ElevenLabs.
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const V = new URL("voz/", import.meta.url);
const a = process.argv.slice(2), parte = a[0];
const op = (nome, padrao) => { const i = a.indexOf("--" + nome); return i >= 0 ? a[i + 1] : padrao; };
const PARTES = { corpo: ["narracao.txt", "A"], intro: ["narracao_intro.txt", "I"] };
if (!PARTES[parte]) { console.log("uso: node ep_bau/gerar_voz.mjs <corpo|intro> [--confirmo-custo]"); process.exit(1); }
const [arq, tk] = PARTES[parte];
const texto = readFileSync(new URL(arq, V), "utf8").trim();
console.log(`${arq}: ${texto.length} caracteres (o gasto em créditos depende do modelo e do seu plano; em geral, perto de 1 crédito por caractere)`);
if (!a.includes("--confirmo-custo")) { console.log("nada foi gerado. Para gastar os créditos, repita com --confirmo-custo"); process.exit(0); }
const chave = process.env.ELEVENLABS_API_KEY, voz = process.env.ELEVENLABS_VOICE_ID;
if (!chave || !voz) { console.error("defina ELEVENLABS_API_KEY e ELEVENLABS_VOICE_ID no seu ambiente"); process.exit(1); }

const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voz}/with-timestamps?output_format=mp3_44100_128`, {
  method: "POST", headers: { "xi-api-key": chave, "content-type": "application/json" },
  body: JSON.stringify({ text: texto, model_id: op("modelo", "eleven_v3"), voice_settings: { stability: +op("estabilidade", 0.3), similarity_boost: 0.75, style: +op("estilo", 0.6), speed: Math.min(1.1, +op("velocidade", 1.1)) } }),
});
if (!r.ok) { console.error("a API recusou:", r.status, (await r.text()).slice(0, 400)); process.exit(1); }
const j = await r.json();
const base = fileURLToPath(new URL("narr_" + tk, V));
writeFileSync(base + ".mp3", Buffer.from(j.audio_base64, "base64"));
// letras com tempo -> palavras com tempo
const al = j.alignment, pal = []; let cur = null;
al.characters.forEach((ch, i) => {
  if (/\s/.test(ch)) { if (cur) pal.push(cur); cur = null; return; }
  if (!cur) cur = { w: "", start: al.character_start_times_seconds[i], end: 0 };
  cur.w += ch; cur.end = al.character_end_times_seconds[i];
});
if (cur) pal.push(cur);
writeFileSync(base + ".display.words.json", JSON.stringify(pal.map((p) => ({ w: p.w, start: Math.round(p.start * 1000) / 1000, end: Math.round(p.end * 1000) / 1000 })), null, 0));
// volume padrão da voz: -16 LUFS, mono, 48 kHz
const ff = spawnSync(process.env.FFMPEG || "ffmpeg", ["-v", "error", "-y", "-i", base + ".mp3", "-af", "loudnorm=I=-16:TP=-2:LRA=11", "-ar", "48000", "-ac", "1", base + "_-16.wav"], { stdio: "inherit" });
console.log(ff.status === 0 ? `pronto: voz/narr_${tk}.mp3, voz/narr_${tk}_-16.wav, ${pal.length} palavras com tempo` : "a voz saiu, mas o FFmpeg falhou ao normalizar");
