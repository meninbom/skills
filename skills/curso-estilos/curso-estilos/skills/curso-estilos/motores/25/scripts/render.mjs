// Mapa -> manga: renderiza a cena (cena/<nome>.json) com render/manga.js no Chrome do sistema.
// Nada sai para a rede: os arquivos da pasta do motor sao servidos por interceptacao e o resto e abortado.
//
//   node scripts/render.mjs specs <specs.json> [LxA] [query] [--cena paulista]
//        specs.json = [{"out": "saida/q/0001.png", "f": "av", "pos": [..], "look": [..], "fov": 55, "T": 3.0, ...}, ...]
//        ("out" relativo e resolvido a partir da pasta do motor; PNG que ja existe e pulado)
//   node scripts/render.mjs fotos <cena> [LxA] [overview,alto,rua] [query]      -> saida/<cena>_<camera>.png
//   node scripts/render.mjs voo   <cena> [LxA] [segundos] [query] [--saida x.mp4] -> saida/<cena>_voo.mp4 (12 desenhos/s, 24 qps, mudo)
//
// query = parametros do motor, ex.: "eixo=Avenida%20Paulista&ss=3&az=250&el=14"
// DEMO_CPU=1 forca render por software. CHROME_PATH / FFMPEG_PATH trocam os programas.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { abrirNavegador, ffmpegBin } from '../lib/chrome.mjs';

const BASE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEM = 'http://manga.local/';
const TIPOS = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };

export async function abrirCena({ cena, largura, altura, query = '' }) {
  if (!fs.existsSync(path.join(BASE, 'cena', `${cena}.json`))) {
    throw new Error(`Nao existe cena/${cena}.json. Baixe o lugar com: python scripts/baixar_dados.py ${cena} <lat> <lon> [raio_m]`);
  }
  const nav = await abrirNavegador();
  const pg = await nav.newPage();
  await pg.setViewport({ width: largura, height: altura });
  pg.on('console', (m) => { if (['error', 'warn'].includes(m.type())) console.log('console:', m.type(), m.text().slice(0, 300)); });
  pg.on('pageerror', (e) => console.log('pageerror:', String(e)));
  await pg.setRequestInterception(true);
  pg.on('request', (req) => {
    const url = req.url();
    if (!url.startsWith(ORIGEM)) return req.abort();
    const rel = decodeURIComponent(url.slice(ORIGEM.length).split('?')[0]);
    if (rel === 'favicon.ico') return req.respond({ status: 204, body: '' });
    const arq = path.resolve(BASE, rel);
    if (!arq.startsWith(BASE + path.sep) || !fs.existsSync(arq)) return req.respond({ status: 404, body: '' });
    req.respond({ status: 200, contentType: TIPOS[path.extname(arq)] || 'application/octet-stream', body: fs.readFileSync(arq) });
  });
  const t0 = Date.now();
  await pg.goto(`${ORIGEM}render/index.html?cena=${encodeURIComponent(cena)}&w=${largura}&h=${altura}&${query}`);
  await pg.waitForFunction('window.MANGA_READY === true', { timeout: 600000 });
  console.log(`cena pronta em ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  const canvas = await pg.$('canvas');
  const foto = async (arquivo) => { fs.mkdirSync(path.dirname(arquivo), { recursive: true }); await canvas.screenshot({ path: arquivo }); };
  return { nav, pg, foto };
}

const LA = (s) => (s || '1080x1920').split('x').map(Number);

async function main() {
  const bruto = process.argv.slice(2);
  const opc = {}; const a = [];
  for (let i = 0; i < bruto.length; i++) {
    if (bruto[i] === '--cena' || bruto[i] === '--saida') { opc[bruto[i].slice(2)] = bruto[++i]; } else a.push(bruto[i]);
  }
  const cenaOpt = opc.cena || null;
  const modo = a[0];
  const t0 = Date.now();

  if (modo === 'specs') {
    const specs = JSON.parse(fs.readFileSync(a[1], 'utf8'));
    const [largura, altura] = LA(a[2]);
    const { nav, pg, foto } = await abrirCena({ cena: cenaOpt || 'paulista', largura, altura, query: a[3] || '' });
    for (let k = 0; k < specs.length; k++) {
      const { out, ...s } = specs[k];
      const arq = path.resolve(BASE, out);
      if (fs.existsSync(arq)) continue;
      await pg.evaluate((x) => { window.MANGA.free(x); }, s);
      await foto(arq);
      if (k % 10 === 0) console.log(`${k + 1}/${specs.length}  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
    await nav.close();
  } else if (modo === 'fotos') {
    const cena = a[1];
    const [largura, altura] = LA(a[2]);
    const { nav, pg, foto } = await abrirCena({ cena, largura, altura, query: a[4] || '' });
    for (const cam of (a[3] || 'overview,alto,rua').split(',')) {
      await pg.evaluate((c) => { window.MANGA.shot(c); }, cam);
      const arq = path.join(BASE, 'saida', `${cena}_${cam}.png`);
      await foto(arq);
      console.log('salvo', path.relative(BASE, arq));
    }
    await nav.close();
  } else if (modo === 'voo') {
    const cena = a[1];
    const [largura, altura] = LA(a[2]);
    const seg = parseFloat(a[3] || '7');
    const fps = 12;                                   // 12 desenhos/s (anime "em dois"), entregue a 24 qps
    const n = Math.round(seg * fps);
    const dir = path.join(BASE, 'saida', `_quadros_${cena}`);
    fs.rmSync(dir, { recursive: true, force: true });
    const { nav, pg, foto } = await abrirCena({ cena, largura, altura, query: a[4] || '' });
    for (let i = 0; i < n; i++) {
      await pg.evaluate((t) => { window.MANGA.shot('voo', t); }, i / (n - 1));
      await foto(path.join(dir, `f${String(i).padStart(4, '0')}.png`));
      if (i % 6 === 0) console.log(`quadro ${i + 1}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
    await nav.close();
    const mp4 = opc.saida ? path.resolve(BASE, opc.saida) : path.join(BASE, 'saida', `${cena}_voo.mp4`);
    const r = spawnSync(ffmpegBin(), ['-v', 'error', '-y', '-framerate', String(fps), '-i', path.join(dir, 'f%04d.png'),
      '-vf', 'fps=24,format=yuv420p', '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-pix_fmt', 'yuv420p',
      '-color_range', 'tv', '-an', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
    if (r.status !== 0) throw new Error('ffmpeg falhou (instale o FFmpeg e ponha no PATH, ou defina FFMPEG_PATH)');
    console.log('salvo', path.relative(BASE, mp4));
  } else {
    console.log('uso: node scripts/render.mjs specs|fotos|voo ...  (veja o cabecalho do arquivo)');
    process.exit(1);
  }
  console.log(`ok ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.message || e); process.exit(1); });
}
