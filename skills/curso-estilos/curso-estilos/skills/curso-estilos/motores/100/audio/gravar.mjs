// PAGO. Grava a narração de falado.txt na ElevenLabs com a SUA chave (variável ELEVENLABS_API_KEY).
//   node audio/gravar.mjs <nome> <id_da_voz>                    -> só mostra quantos caracteres vai gastar e para
//   node audio/gravar.mjs <nome> <id_da_voz> --confirmo-custo   -> grava <nome>.mp3 e <nome>.words.json nesta pasta
//   node audio/gravar.mjs <nome> --de-alinhamento arquivo.json  -> não gasta: refaz <nome>.words.json de um alinhamento já salvo
// Opções: --modelo eleven_v4 (padrão; se a sua conta não tiver, use eleven_multilingual_v2) --estabilidade 0.4 --estilo 0.55
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const aqui = new URL('./', import.meta.url);
const args = process.argv.slice(2), op = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const [nome, voz] = args;
if (!nome) { console.log('uso: node audio/gravar.mjs <nome> <id_da_voz> [--confirmo-custo]'); process.exit(1); }

// alinhamento por caractere -> palavras com início e fim
function palavras(al) {
  const ch = al.characters, ini = al.character_start_times_seconds, fim = al.character_end_times_seconds, out = [];
  let w = '', s = 0, e = 0;
  for (let i = 0; i < ch.length; i++) {
    if (/\s/.test(ch[i])) { if (w) out.push({ w, start: +s.toFixed(3), end: +e.toFixed(3) }); w = ''; continue; }
    if (!w) s = ini[i]; w += ch[i]; e = fim[i];
  }
  if (w) out.push({ w, start: +s.toFixed(3), end: +e.toFixed(3) });
  return out;
}
const salva = al => { const p = palavras(al); fs.writeFileSync(new URL(`${nome}.words.json`, aqui), JSON.stringify(p, null, 1)); console.log(nome, 'palavras', p.length, 'fim', p.at(-1).end); };

if (args.includes('--de-alinhamento')) { salva(JSON.parse(fs.readFileSync(op('de-alinhamento'), 'utf8'))); process.exit(0); }

execFileSync('node', [new URL('voz.mjs', aqui).pathname.replace(/^\/([A-Za-z]:)/, '$1'), 'prep'], { stdio: 'inherit' });
const texto = fs.readFileSync(new URL('falado.txt', aqui), 'utf8').trim();
console.log(`Vai gastar cerca de ${texto.length} caracteres da sua cota da ElevenLabs por gravação.`);
if (!args.includes('--confirmo-custo')) { console.log('Nada foi gravado. Para gravar, repita o comando com --confirmo-custo.'); process.exit(0); }
const chave = process.env.ELEVENLABS_API_KEY;
if (!chave || !voz) { console.error('PARADO: defina ELEVENLABS_API_KEY e passe o id da voz.'); process.exit(1); }
const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voz}/with-timestamps?output_format=mp3_44100_128`, {
  method: 'POST', headers: { 'xi-api-key': chave, 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: texto, model_id: op('modelo', 'eleven_v4'),
    voice_settings: { stability: Number(op('estabilidade', 0.4)), similarity_boost: 0.8, style: Number(op('estilo', 0.55)), use_speaker_boost: true } }) });
if (!r.ok) { console.error('ERRO da ElevenLabs:', r.status, (await r.text()).slice(0, 300)); process.exit(1); }
const j = await r.json();
fs.writeFileSync(new URL(`${nome}.mp3`, aqui), Buffer.from(j.audio_base64, 'base64'));
fs.writeFileSync(new URL(`${nome}.alignment.json`, aqui), JSON.stringify(j.alignment));
salva(j.alignment);
