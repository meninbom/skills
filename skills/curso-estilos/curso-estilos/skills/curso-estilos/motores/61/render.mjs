// Render quadro a quadro de uma página que expõe window.READY, window.DUR e window.seek(t). Sai MP4 mudo em yuv420p.
// uso:
//   node render.mjs --pagina cenas/masmorra_kk --video saida/cena.mp4 [--fps 60] [--ini 0] [--fim 12.5] [--ss 2] [--esc 1]
//   node render.mjs --pagina cenas/masmorra_kk --quadros 0.5,2,4 --out saida/folha.jpg [--esc 0.5 --ss 1]
//   node render.mjs --pagina cenas/poder_kk --q "p=fogo" --video saida/fogo.mp4
// --cpu (ou a variável DEMO_CPU=1) renderiza por software (SwiftShader): mais lento, não usa a placa de vídeo.
// Chrome: variável CHROME_PATH ou os caminhos padrão. FFmpeg: variável FFMPEG_PATH ou o do PATH.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const a = {};
for (let i = 2; i < process.argv.length; i++) {
  const k = process.argv[i]; if (!k.startsWith('--')) continue;
  const v = process.argv[i + 1]; if (v === undefined || v.startsWith('--')) a[k.slice(2)] = true; else { a[k.slice(2)] = v; i++; }
}
if (!a.pagina || (!a.video && !a.quadros)) { console.error('uso: node render.mjs --pagina cenas/masmorra_kk (--video saida/x.mp4 | --quadros 1,2,3 --out saida/folha.jpg)'); process.exit(1); }
const FPS = Number(a.fps || 60), SS = Number(a.ss || 2), ESC = Number(a.esc || 1), INI = Number(a.ini || 0);
const CPU = !!a.cpu || process.env.DEMO_CPU === '1';
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';

function acharChrome() {
  const c = [process.env.CHROME_PATH];
  if (process.platform === 'win32') {
    for (const b of [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA]) {
      if (b) c.push(path.join(b, 'Google/Chrome/Application/chrome.exe'), path.join(b, 'Microsoft/Edge/Application/msedge.exe'));
    }
  } else if (process.platform === 'darwin') {
    c.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge');
  } else c.push('/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium');
  const achou = c.find((p) => p && fs.existsSync(p));
  if (!achou) { console.error('Chrome não encontrado. Instale o Google Chrome ou aponte a variável CHROME_PATH para o executável.'); process.exit(1); }
  return achou;
}
if (spawnSync(FFMPEG, ['-version']).error) { console.error('FFmpeg não encontrado. Instale e deixe no PATH, ou aponte a variável FFMPEG_PATH.'); process.exit(1); }

// servidor estático só da pasta do motor
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.gltf': 'model/gltf+json', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const srv = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  const arq = path.normalize(path.join(RAIZ, rel));
  if (!arq.startsWith(RAIZ) || !fs.existsSync(arq) || !fs.statSync(arq).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(arq).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(arq).pipe(res);
});
await new Promise((ok) => srv.listen(Number(a.port || 0), '127.0.0.1', ok));
const porta = srv.address().port;

const gl = CPU ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  : ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', ...(process.platform === 'win32' ? ['--use-angle=d3d11'] : [])];
const t0 = Date.now();
const nav = await puppeteer.launch({ executablePath: acharChrome(), headless: true, args: [...gl, '--mute-audio', '--hide-scrollbars'] });
let falhou = false;
try {
  const pg = await nav.newPage();
  await pg.setViewport({ width: Math.round(1080 * ESC), height: Math.round(1920 * ESC) });
  pg.on('console', (m) => { if (m.type() === 'error') console.log('[pagina]', m.text()); });
  pg.on('pageerror', (e) => { console.log('[ERRO]', e.message); });
  await pg.goto(`http://127.0.0.1:${porta}/${a.pagina}.html?ss=${SS}&esc=${ESC}${a.q ? '&' + a.q : ''}`);
  await pg.waitForFunction('window.READY === true', { timeout: 600000 });
  console.log(`carregou em ${((Date.now() - t0) / 1000).toFixed(1)} s (${CPU ? 'CPU' : 'GPU'})`);
  const pegar = async (t) => {
    const d = await pg.evaluate(async (tt) => { await window.seek(tt); return document.getElementById('c').toDataURL('image/jpeg', 0.95); }, t);
    return Buffer.from(d.split(',')[1], 'base64');
  };
  // abre o ffmpeg lendo JPEG pelo stdin; "quadros" recebe a função que escreve um quadro
  const rodar = (args, quadros) => new Promise((ok, erro) => {
    const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', ...args], { stdio: ['pipe', 'inherit', 'inherit'] });
    ff.on('error', erro); ff.on('close', (c) => (c === 0 ? ok() : erro(new Error('ffmpeg saiu com codigo ' + c))));
    ff.stdin.on('error', () => {});
    const escreve = (b) => new Promise((r) => (ff.stdin.write(b) ? r() : ff.stdin.once('drain', r)));
    quadros(escreve).then(() => ff.stdin.end(), (e) => { ff.stdin.end(); erro(e); });
  });
  if (a.quadros) {
    const ts = a.quadros.split(',').map(Number); const out = a.out || 'saida/folha.jpg';
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    const cols = Math.min(8, ts.length), lin = Math.ceil(ts.length / cols);
    await rodar(['-f', 'image2pipe', '-c:v', 'mjpeg', '-i', '-', '-vf', `scale=${a.tw || 360}:-2:flags=lanczos,tile=${cols}x${lin}`, '-frames:v', '1', '-q:v', '3', out],
      async (escreve) => { for (const t of ts) await escreve(await pegar(t)); });
    console.log(`ok ${out} em ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  } else {
    const dur = await pg.evaluate('window.DUR'); const FIM = a.fim !== undefined ? Math.min(Number(a.fim), dur) : dur;
    const n = Math.round((FIM - INI) * FPS); const t1 = Date.now();
    fs.mkdirSync(path.dirname(path.resolve(a.video)), { recursive: true });
    // O JPEG chega em faixa cheia (yuvj420p). O filtro converte para faixa de TV; sem ele o arquivo não abre em alguns celulares.
    await rodar(['-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-', '-vf', 'scale=in_range=full:out_range=tv,format=yuv420p',
      '-c:v', 'libx264', '-crf', String(a.crf || 16), '-preset', 'slow', '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-movflags', '+faststart', '-r', String(FPS), '-an', a.video],
    async (escreve) => {
      for (let i = 0; i < n; i++) {
        await escreve(await pegar(INI + i / FPS));
        if (i % 30 === 0) console.log(`quadro ${i}/${n}  ${((Date.now() - t1) / 1000).toFixed(1)} s`);
      }
    });
    const dt = (Date.now() - t1) / 1000;
    console.log(`ok ${a.video}: ${n} quadros em ${dt.toFixed(1)} s (${(dt / (n / FPS)).toFixed(1)} s por segundo de video)`);
  }
} catch (e) { falhou = true; console.error('[ERRO]', e.message); } finally { await nav.close(); srv.close(); }
process.exit(falhou ? 1 : 0);
