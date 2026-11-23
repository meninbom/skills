// Gera cues.js (início/fim de cada linha) e acerta o data-duration do index.html.
//   node gerar_cues.mjs                          -> sem voz: estima pelo número de palavras (~153 palavras/min)
//   node gerar_cues.mjs audio/A.tempos_lead.json -> com voz: usa os tempos medidos ([[ini,fim], ...], um por linha)
//   node gerar_cues.mjs --demo 8                 -> estimado, mas o vídeo para em 8 s (prova rápida)
import fs from 'node:fs';
const src = fs.readFileSync(new URL('./lines.js', import.meta.url), 'utf8');
const LINES = new Function(src + ';return LINES;')();
const args = process.argv.slice(2), iDemo = args.indexOf('--demo');
const demo = iDemo >= 0 ? Number(args[iDemo + 1]) : null;
const arq = args.find((a, i) => !a.startsWith('--') && !(iDemo >= 0 && i === iDemo + 1));
const medido = arq ? JSON.parse(fs.readFileSync(arq, 'utf8')) : null;
if (medido && medido.length !== LINES.length) { console.error(`ERRO: ${medido.length} tempos para ${LINES.length} linhas`); process.exit(1); }
const WPS = 2.55; let t = 0.25; const cues = [];
LINES.forEach((l, i) => {
  if (medido) { cues.push({ s: +medido[i][0].toFixed(3), e: +medido[i][1].toFixed(3) }); return; }
  const n = l.t.split(/\s+/).length, d = Math.max(0.75, n / WPS), troca = LINES[i + 1] && LINES[i + 1].sc !== l.sc;
  cues.push({ s: +t.toFixed(3), e: +(t + d).toFixed(3) }); t += d + (troca ? 0.42 : 0.26);
});
const cheio = Math.ceil((cues[cues.length - 1].e + 2.2) * 10) / 10;
fs.writeFileSync(new URL('./cues.js', import.meta.url), `const CUES=${JSON.stringify(cues)};\nconst DUR=${cheio};\n`);
const idx = new URL('./index.html', import.meta.url);
fs.writeFileSync(idx, fs.readFileSync(idx, 'utf8').replace(/data-duration="[\d.]+"/, `data-duration="${demo || cheio}"`));
console.log('linhas', cues.length, 'duracao', cheio, medido ? '(medido)' : '(estimado)', demo ? `| render para em ${demo} s` : '');
