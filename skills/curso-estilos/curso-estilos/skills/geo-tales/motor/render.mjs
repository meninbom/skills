// Render de index.html (window.seek(t)) pelo Chrome do sistema, quadro a quadro, direto para o ffmpeg.
// CPU por padrão (SwiftShader); --gpu usa a placa. DEMO_CPU=1 força CPU mesmo com --gpu.
// uso: node render.mjs --cena demo/cena_demo --video saida/x.mp4 [--fps 30] [--largura 540] [--de 2 --ate 5]
//      node render.mjs --cena demo/cena_demo --times 0.5,1,2 --out saida/folha.jpg [--tw 360] [--mb 30]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const a = { fps: 30, cena: 'demo/cena_demo', tw: 360, largura: 1080, de: 0, ate: 0, mb: -1, gpu: false };
for (let i = 2; i < process.argv.length; i++) {
  const k = process.argv[i].replace(/^--/, '');
  if (k === 'gpu') a.gpu = true; else a[k] = process.argv[++i];
}
for (const k of ['fps', 'tw', 'largura', 'de', 'ate', 'mb']) a[k] = Number(a[k]);
if (process.env.DEMO_CPU === '1') a.gpu = false;
if (!a.video && !(a.times && a.out)) { console.error('faltou --video ARQ.mp4  ou  --times T1,T2 --out FOLHA.jpg'); process.exit(1); }

function acharChrome() {
  const c = [process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium'];
  for (const p of c) if (p && fs.existsSync(p)) return p;
  console.error('Chrome não encontrado. Aponte a variável CHROME_PATH para o executável do Chrome, Edge ou Chromium.'); process.exit(1);
}

// servidor de arquivos só para esta pasta
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.ttf': 'font/ttf', '.bin': 'application/octet-stream', '.geojson': 'application/json' };
const srv = http.createServer((req, res) => {
  if (req.url === '/favicon.ico') { res.writeHead(204); return res.end(); }
  const f = path.normalize(path.join(ROOT, decodeURIComponent(req.url.split('?')[0])));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const porta = srv.address().port, t0 = Date.now(), seg = () => ((Date.now() - t0) / 1000).toFixed(0) + 's';

const b = await puppeteer.launch({ executablePath: acharChrome(), headless: true,
  args: [...(a.gpu ? ['--use-angle=d3d11', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']), '--hide-scrollbars', '--mute-audio'] });
let erro = 0;
try {
  const pg = await b.newPage(); await pg.setViewport({ width: 1080, height: 1920 });
  pg.on('pageerror', e => console.log('[ERRO]', e.message));
  pg.on('console', m => { if (['error', 'warn'].includes(m.type())) console.log('[page]', m.text()); });
  await pg.goto(`http://127.0.0.1:${porta}/index.html?cena=${encodeURIComponent(a.cena)}`);
  await pg.waitForFunction('window.READY === true', { timeout: 180000 });
  console.log('pronto em', seg());
  const mb = a.mb >= 0 ? a.mb : (a.video ? a.fps : 0);
  const grab = async t => Buffer.from((await pg.evaluate(async (t, mb) => { await window.seek(t, mb); return document.getElementById('c').toDataURL('image/jpeg', 0.95); }, t, mb)).split(',')[1], 'base64');
  const saida = a.video || a.out; fs.mkdirSync(path.dirname(path.resolve(saida)), { recursive: true });
  let ffArgs, tempos;
  if (a.times) {
    tempos = a.times.split(',').map(Number); const cols = Math.min(6, tempos.length), rows = Math.ceil(tempos.length / cols);
    ffArgs = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-i', '-', '-vf', `scale=${a.tw}:-2:flags=lanczos,tile=${cols}x${rows}`, '-frames:v', '1', '-q:v', '3', '-update', '1', saida];
  } else {
    const dur = await pg.evaluate('window.DUR'), i0 = Math.round(a.de * a.fps), n = Math.round((a.ate || dur) * a.fps);
    tempos = []; for (let i = i0; i < n; i++) tempos.push(i / a.fps);
    // sem áudio (-an): o som entra depois, na mix
    ffArgs = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(a.fps), '-i', '-', '-an', '-c:v', 'libx264', '-crf', a.largura < 1080 ? '20' : '14', '-preset', a.largura < 1080 ? 'medium' : 'slow',
      '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-vf', `scale=${a.largura}:-2:flags=lanczos:in_range=full:out_range=tv`, '-r', String(a.fps), saida];
  }
  const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
  ff.on('error', () => { console.error('ffmpeg não encontrado no PATH.'); process.exit(1); });
  const fim = new Promise(ok => ff.on('close', ok));
  for (let i = 0; i < tempos.length; i++) {
    if (!ff.stdin.write(await grab(tempos[i]))) await new Promise(ok => ff.stdin.once('drain', ok));
    if (i % 30 === 0) console.log('quadro', i, '/', tempos.length, seg());
  }
  ff.stdin.end(); erro = await fim;
  console.log(erro ? 'ffmpeg falhou' : 'ok', saida, seg());
} finally { await b.close(); srv.close(); }
process.exit(erro ? 1 : 0);
