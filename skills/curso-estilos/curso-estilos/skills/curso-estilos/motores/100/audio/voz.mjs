// node voz.mjs prep          -> falado.txt (o que a voz lê: campo f da linha, ou t quando não há f)
// node voz.mjs tempos A      -> A.tempos.json ([[ini,fim],...] por linha, lido de A.words.json)
// A.words.json = lista de palavras com start/end em segundos (qualquer TTS ou transcritor que devolva tempos por palavra).
import fs from 'node:fs';
const LINES = new Function(fs.readFileSync(new URL('../lines.js', import.meta.url), 'utf8') + ';return LINES;')();
const fal = LINES.map(l => l.f || l.t);
const [cmd, nome] = process.argv.slice(2);
if (cmd === 'prep') {
  let out = ''; fal.forEach((t, i) => { out += t + (LINES[i + 1] && LINES[i + 1].sc !== LINES[i].sc ? '\n\n' : '\n'); });
  fs.writeFileSync(new URL('./falado.txt', import.meta.url), out.trim() + '\n');
  console.log('caracteres', out.trim().length, 'palavras', fal.join(' ').split(/\s+/).length);
} else if (cmd === 'tempos') {
  const w = JSON.parse(fs.readFileSync(new URL(`./${nome}.words.json`, import.meta.url), 'utf8'));
  let p = 0; const out = [];
  const total = fal.reduce((a, t) => a + t.split(/\s+/).length, 0);
  if (w.length !== total) { console.error(`ERRO: a voz tem ${w.length} palavras e o roteiro ${total}. Regrave ou acerte o campo f.`); process.exit(1); }
  fal.forEach(t => { const n = t.split(/\s+/).length; const a = w[p], b = w[p + n - 1]; out.push([+(a.start ?? a.s).toFixed(3), +(b.end ?? b.e).toFixed(3)]); p += n; });
  fs.writeFileSync(new URL(`./${nome}.tempos.json`, import.meta.url), JSON.stringify(out));
  console.log(nome, 'linhas', out.length, 'fim', out.at(-1)[1]);
} else console.log('uso: node voz.mjs prep | node voz.mjs tempos <nome>');
