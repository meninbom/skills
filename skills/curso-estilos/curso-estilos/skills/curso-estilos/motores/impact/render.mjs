// render.mjs: renderiza uma página determinística (window.seek(t), window.READY, window.DUR, canvas#c) em MP4 mudo.
// Usa o Chrome do sistema via puppeteer-core (não baixa navegador) e o FFmpeg do PATH.
//
//   node render.mjs --pagina poder/poder.html --query "p=gelo&esc=0.5&ss=1" --ini 1.8 --fim 4.8 --saida saida/demo.mp4
//   node render.mjs --pagina arena/arena.html --probe                       (imprime o que a página mede: golpes, hit-stop, câmera parada)
//   node render.mjs --pagina arena/arena.html --folha 1,2,3 --saida folha.jpg   (folha de quadros nos tempos pedidos)
//
// Opções: --fps 30 · --w/--h (janela; o tamanho do vídeo é o do canvas da página) · --crf 18
//         --vw/--vh (tamanho do quadro, ex.: --vw 960 --vh 540 para 16:9; sem eles vale o esc da página, em 9:16)
// Ambiente: CHROME_PATH (caminho do Chrome/Chromium/Edge) · DEMO_CPU=1 (render por software, SwiftShader: lento, mas igual em qualquer PC)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : (process.argv[i + 1] ?? true); };
const tem = (n) => process.argv.includes('--' + n);

function acharChrome() {
  const env = process.env.CHROME_PATH; if (env && fs.existsSync(env)) return env;
  const pf = [process.env['PROGRAMFILES'], process.env['PROGRAMFILES(X86)'], process.env['LOCALAPPDATA']].filter(Boolean);
  const cands = [
    ...pf.flatMap((p) => [path.join(p, 'Google/Chrome/Application/chrome.exe'), path.join(p, 'Chromium/Application/chrome.exe'), path.join(p, 'Microsoft/Edge/Application/msedge.exe')]),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium', '/usr/bin/microsoft-edge',
  ];
  const a = cands.find((c) => fs.existsSync(c));
  if (!a) { console.error('Não achei o Chrome. Instale o Chrome ou defina CHROME_PATH com o caminho do executável.'); process.exit(2); }
  return a;
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.wasm': 'application/wasm' };
function servidor() {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]); const arq = path.join(RAIZ, rel);
      if (!arq.startsWith(RAIZ) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(arq).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(arq).pipe(res);
    });
    s.listen(0, '127.0.0.1', () => ok(s));
  });
}

const pagina = arg('pagina'); if (!pagina) { console.error('uso: node render.mjs --pagina PASTA/pagina.html [--query "a=1&b=2"] [--ini 0] [--fim S] [--fps 30] --saida saida/video.mp4 | --probe | --folha t1,t2'); process.exit(2); }
const fps = Number(arg('fps', 30)), VW = Number(arg('vw', 0)), VH = Number(arg('vh', 0)), W = Number(arg('w', VW || 540)), H = Number(arg('h', VH || 960));
const query = [arg('query'), VW ? `w=${VW}` : '', VH ? `h=${VH}` : ''].filter(Boolean).join('&');   // a página lê w e h e monta o canvas nesse tamanho
const cpu = process.env.DEMO_CPU === '1';
const srv = await servidor(); const porta = srv.address().port;
const nav = await puppeteer.launch({ executablePath: acharChrome(), headless: true,
  args: [...(cpu ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--ignore-gpu-blocklist']), '--hide-scrollbars', '--mute-audio', '--autoplay-policy=no-user-gesture-required'] });
let cod = 0;
try {
  const pg = await nav.newPage(); await pg.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  pg.on('pageerror', (e) => console.error('[ERRO na página]', e.message));
  pg.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) console.error('[página]', m.text()); });
  pg.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) console.error(`[${r.status()}] não achei ${r.url().replace(/^http:\/\/[^/]+\//, '')}`); });
  const t0 = Date.now();
  await pg.goto(`http://127.0.0.1:${porta}/${pagina}${query ? '?' + query : ''}`);
  await pg.waitForFunction('window.READY === true', { timeout: Number(process.env.RENDER_ESPERA_S || 180) * 1000 });
  console.log(`carregou em ${((Date.now() - t0) / 1000).toFixed(1)} s (${cpu ? 'CPU/SwiftShader' : 'GPU se houver'})`);
  const grab = (t) => pg.evaluate(async (t) => { await window.seek(t); return document.getElementById('c').toDataURL('image/jpeg', 0.93); }, t).then((d) => Buffer.from(d.split(',')[1], 'base64'));
  const ffmpeg = (args) => { const p = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] }); p.on('error', () => { console.error('FFmpeg não encontrado no PATH.'); process.exit(2); }); return p; };
  const fecha = (p) => new Promise((ok) => { p.on('close', ok); p.stdin.end(); });
  const escreve = (p, b) => new Promise((ok) => { if (p.stdin.write(b)) ok(); else p.stdin.once('drain', ok); });
  if (tem('probe')) {
    console.log(JSON.stringify(await pg.evaluate('window.probe ? window.probe() : {erro: "a página não tem window.probe()"}'), null, 1));
  } else if (arg('folha')) {
    const ts = String(arg('folha')).split(',').map(Number); const saida = path.resolve(arg('saida', 'folha.jpg')); fs.mkdirSync(path.dirname(saida), { recursive: true });
    const cols = Math.min(8, ts.length), lin = Math.ceil(ts.length / cols);
    const ff = ffmpeg(['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-i', '-', '-vf', `scale=360:-1,tile=${cols}x${lin}`, '-frames:v', '1', '-q:v', '3', saida]);
    for (const t of ts) await escreve(ff, await grab(t));
    await fecha(ff); console.log('ok', path.relative(RAIZ, saida));
  } else {
    const ini = Number(arg('ini', 0)); const fim = arg('fim') !== undefined ? Number(arg('fim')) : await pg.evaluate('window.DUR');
    const saida = path.resolve(arg('saida', 'saida/video.mp4')); fs.mkdirSync(path.dirname(saida), { recursive: true });
    const n = Math.round((fim - ini) * fps); const t1 = Date.now();
    const ff = ffmpeg(['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-', '-an',
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2:in_range=full:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-crf', String(arg('crf', 18)), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', String(fps), saida]);
    for (let i = 0; i < n; i++) {
      await escreve(ff, await grab(ini + i / fps));
      if (i % 30 === 0) console.log(`quadro ${i}/${n} · ${((Date.now() - t1) / 1000).toFixed(1)} s`);
    }
    await fecha(ff); console.log(`ok ${path.relative(RAIZ, saida)} · ${n} quadros em ${((Date.now() - t1) / 1000).toFixed(1)} s`);
  }
} catch (e) { console.error('[FALHA]', e.message); cod = 1; }
await nav.close(); srv.close(); process.exit(cod);
