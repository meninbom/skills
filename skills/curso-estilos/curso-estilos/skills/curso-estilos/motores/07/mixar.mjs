// Mix simples com ffmpeg: voz na frente, trilha N dB abaixo com duck, e mede o resultado.
// uso: node mixar.mjs mix_conf.json        (caminhos do JSON são relativos à pasta dele; ver exemplo_rio_voador/mix_conf.json)
// Campos: video, voz, voz_inicio_s, trilha{arquivo, inicio_no_arquivo_s, entra_t, entra_rampa_s, sai_t, sai_rampa_s, abaixo_voz_db, duck_db},
//         master_lufs, teto_dbtp, saida. Não toca nada: só grava o arquivo e imprime os números.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const conf = process.argv[2]; if (!conf) { console.log('uso: node mixar.mjs mix_conf.json'); process.exit(1); }
const c = JSON.parse(fs.readFileSync(conf, 'utf8')), base = path.dirname(path.resolve(conf)), R = p => path.resolve(base, p);
const ff = (args, cap) => { const r = spawnSync('ffmpeg', ['-hide_banner', '-nostdin', ...args], { encoding: 'utf8' }); if (r.error) { console.error('Não achei o ffmpeg no PATH.'); process.exit(1); } return cap ? r.stderr : r; };
const lufs = (arq) => { const m = ff(['-i', arq, '-map', '0:a:0', '-af', 'ebur128=peak=true', '-f', 'null', '-'], true); const i = [...m.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].pop(), p = [...m.matchAll(/Peak:\s+(-?[\d.]+) dBFS/g)].pop(); return { lufs: i ? +i[1] : null, pico: p ? +p[1] : null }; };

const voz = R(c.voz), tr = c.trilha, alvo = c.master_lufs ?? -14, teto = c.teto_dbtp ?? -1.5, dur = c.duracao_s;
const saida = R(c.saida || 'final.mp4'), nv = lufs(voz);
const ent = ['-i', R(c.video), '-i', voz]; let fc = `[1:a]adelay=${Math.round((c.voz_inicio_s || 0) * 1000)}:all=1,aresample=48000,asplit=2[v][vk]`;
if (tr) {
  const nt = lufs(R(tr.arquivo)), ganho = (nv.lufs - (tr.abaixo_voz_db ?? 11)) - nt.lufs;       // trilha N dB abaixo da voz (integrado)
  const et = tr.entra_t || 0, st = tr.sai_t ?? dur, sr = tr.sai_rampa_s ?? 1;
  ent.push('-ss', String(tr.inicio_no_arquivo_s || 0), '-i', R(tr.arquivo));
  fc += `;[2:a]aresample=48000,volume=${ganho.toFixed(2)}dB,afade=t=in:d=${tr.entra_rampa_s ?? .4},afade=t=out:st=${Math.max(0, st - et - sr)}:d=${sr},atrim=0:${st - et},adelay=${Math.round(et * 1000)}:all=1[t0]`
      + `;[t0][vk]sidechaincompress=threshold=0.03:ratio=${(1 + (tr.duck_db ?? 4) / 2).toFixed(1)}:attack=40:release=450[t]`
      + `;[v][t]amix=inputs=2:normalize=0:duration=longest[m]`;
} else fc += `;[vk]anullsink;[v]anull[m]`;
fc += `;[m]loudnorm=I=${alvo}:TP=${teto}:LRA=11,aresample=48000[a]`;
const r = ff(['-y', '-v', 'error', ...ent, '-filter_complex', fc, '-map', '0:v:0', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', ...(dur ? ['-t', String(dur)] : []), '-movflags', '+faststart', saida]);
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
const nf = lufs(saida);
console.log(`voz ${nv.lufs} LUFS · final ${nf.lufs} LUFS (alvo ${alvo}) · pico ${nf.pico} dBFS (teto ${teto}) → ${path.relative(process.cwd(), saida)}`);
console.log('Confira de ouvido no celular: número certo não garante que a trilha não briga com a voz.');
