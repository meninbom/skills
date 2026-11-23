// Narração em UMA tomada pela API da ElevenLabs (PAGO: gasta créditos da SUA conta). Não roda no demo.
// uso: node gerar_voz.mjs narracao.txt [saida_sem_extensao] --voz ID_DA_VOZ --confirmo-custo
// Lê a chave da variável de ambiente ELEVENLABS_API_KEY. Sem --confirmo-custo só mostra a contagem de caracteres e para.
// Opções por variável: ELEVEN_MODEL (padrão eleven_v4), ELEVEN_STABILITY (0.3), ELEVEN_STYLE (0.6).
// Sai: <saida>.mp3, <saida>.words.json (início e fim de cada palavra, para animar pela voz) e <saida>_-16.wav (−16 LUFS, 1,0×).
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const a = process.argv.slice(2); const val = k => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : undefined; };
const livres = a.filter((v, i) => !v.startsWith('--') && a[i - 1] !== '--voz');
const [arq, saida = 'narr'] = livres;
if (!arq) { console.log('uso: node gerar_voz.mjs narracao.txt [saida] --voz ID_DA_VOZ --confirmo-custo'); process.exit(1); }
const texto = fs.readFileSync(arq, 'utf8').trim();
console.log(`Texto: ${texto.length} caracteres (${texto.split(/\s+/).length} palavras). Custo aproximado: ${texto.length} créditos da sua conta ElevenLabs (confira o preço do modelo no seu plano).`);
if (!a.includes('--confirmo-custo')) { console.log('Nada foi gerado. Para gerar de verdade, repita o comando com --confirmo-custo.'); process.exit(0); }
const chave = process.env.ELEVENLABS_API_KEY, voz = val('voz') || process.env.ELEVEN_VOICE_ID;
if (!chave || !voz) { console.error('Falta ELEVENLABS_API_KEY (variável de ambiente) ou a voz (--voz ID ou ELEVEN_VOICE_ID).'); process.exit(1); }

const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voz}/with-timestamps`, {
  method: 'POST', headers: { 'xi-api-key': chave, 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: texto, model_id: process.env.ELEVEN_MODEL || 'eleven_v4',
    voice_settings: { stability: +(process.env.ELEVEN_STABILITY || 0.3), style: +(process.env.ELEVEN_STYLE || 0.6) } }),
});
if (!r.ok) { console.error('A API recusou:', r.status, (await r.text()).slice(0, 400)); process.exit(1); }
const j = await r.json();
fs.writeFileSync(saida + '.mp3', Buffer.from(j.audio_base64, 'base64'));
// junta os caracteres em palavras com tempo
const al = j.alignment || { characters: [], character_start_times_seconds: [], character_end_times_seconds: [] };
const palavras = []; let atual = null;
al.characters.forEach((ch, i) => {
  if (/\s/.test(ch)) { if (atual) palavras.push(atual); atual = null; return; }
  if (!atual) atual = { w: '', t0: al.character_start_times_seconds[i], t1: 0 };
  atual.w += ch; atual.t1 = al.character_end_times_seconds[i];
});
if (atual) palavras.push(atual);
fs.writeFileSync(saida + '.words.json', JSON.stringify(palavras, null, 1));
const ff = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', saida + '.mp3', '-af', 'loudnorm=I=-16:TP=-2:LRA=11', '-ar', '48000', '-ac', '1', saida + '_-16.wav'], { stdio: 'inherit' });
console.log(ff.status === 0 ? `PRONTO: ${saida}.mp3, ${saida}.words.json (${palavras.length} palavras), ${saida}_-16.wav` : 'Áudio gerado, mas o ffmpeg falhou na normalização.');
console.log('Ouça a tomada inteira antes de animar: o sistema de fala erra pronúncia sem avisar.');
