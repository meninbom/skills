// Render determinístico: abre a página no Chrome do sistema, chama window.seek(t) quadro a quadro e grava o canvas.
// uso:
//   node render.mjs pagina.html --video saida.mp4 [--fps 30] [--dur 3] [--largura 540] [--blend 2]
//   node render.mjs pagina.html --folha folha.jpg --times 0.5,1.2,2.4      (quadros parados lado a lado, na ordem dos tempos)
//   node render.mjs pagina.html --quadro q.jpg --t 1.5                     (um quadro)
// A página tem que estar dentro desta pasta (ela é servida por um servidor local) e expor READY, END e seek(t).
// Chrome: variável CHROME_PATH ou os caminhos padrão. DEMO_CPU=1 renderiza por software (sem placa de vídeo).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };

export function acharChrome() {
  const c = [process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium'];
  const achou = c.find(p => p && fs.existsSync(p));
  if (!achou) throw new Error('Não achei o Chrome. Instale o Chrome ou aponte a variável CHROME_PATH para o executável.');
  return achou;
}

function servir() {
  return new Promise(ok => {
    const srv = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]); if (rel === '/favicon.ico') { res.writeHead(204); res.end(); return; } const arq = path.join(RAIZ, rel);
      if (!arq.startsWith(RAIZ) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(arq).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(arq).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => ok(srv));
  });
}

function ffmpeg(args) {
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: ['pipe', 'inherit', 'inherit'] });
  ff.on('error', () => { console.error('Não achei o ffmpeg. Instale e deixe no PATH.'); process.exit(1); });
  const fim = new Promise((ok, erro) => ff.on('close', c => c === 0 ? ok() : erro(new Error('ffmpeg saiu com código ' + c))));
  const escreve = buf => new Promise(ok => ff.stdin.write(buf) ? ok() : ff.stdin.once('drain', ok));
  return { escreve, fecha: () => { ff.stdin.end(); return fim; } };
}

export async function render(o) {
  const rel = path.relative(RAIZ, path.resolve(o.pagina)).split(path.sep).join('/');
  if (rel.startsWith('..')) throw new Error('A página precisa estar dentro da pasta do motor: ' + RAIZ);
  const srv = await servir(); const porta = srv.address().port;
  const args = ['--hide-scrollbars', '--force-device-scale-factor=1', '--force-color-profile=srgb'];
  if (process.env.DEMO_CPU === '1') args.push('--use-angle=swiftshader', '--enable-unsafe-swiftshader');
  const nav = await puppeteer.launch({ executablePath: acharChrome(), headless: true, args });
  try {
    const pg = await nav.newPage(); await pg.setViewport({ width: 1080, height: 1920 });
    pg.on('console', m => console.log('[página]', m.text())); pg.on('pageerror', e => console.log('[erro na página]', e.message));
    await pg.goto(`http://127.0.0.1:${porta}/${rel}`); await pg.waitForFunction('window.READY === true', { timeout: 60000 });
    const quadro = async t => Buffer.from((await pg.evaluate(t => { window.seek(t); return document.getElementById('c').toDataURL('image/jpeg', 0.93); }, t)).split(',')[1], 'base64');
    for (const s of [o.video, o.folha, o.quadro]) if (s) fs.mkdirSync(path.dirname(path.resolve(s)), { recursive: true });
    if (o.quadro) { fs.writeFileSync(o.quadro, await quadro(o.t || 0)); console.log('ok', o.quadro); }
    else if (o.folha) {
      const ts = o.times; const col = Math.min(6, ts.length), lin = Math.ceil(ts.length / col);
      const ff = ffmpeg(['-f', 'image2pipe', '-c:v', 'mjpeg', '-i', '-', '-vf', `scale=270:480,tile=${col}x${lin}`, '-frames:v', '1', '-q:v', '3', o.folha]);
      for (const t of ts) await ff.escreve(await quadro(t));
      await ff.fecha(); console.log('ok', o.folha, '(' + ts.length + ' quadros, na ordem dos tempos)');
    } else {
      const fps = o.fps || 30, sub = o.blend || 1, taxa = fps * sub, dur = o.dur || await pg.evaluate('window.END'), n = Math.round(dur * fps);
      const larg = o.largura || 1080, alt = Math.round(larg * 1920 / 1080 / 2) * 2;
      const vf = [...(sub > 1 ? [`tmix=frames=${sub}`, `select=not(mod(n\\,${sub}))`] : []), `scale=${larg}:${alt}:flags=lanczos:in_range=pc:out_range=tv`, 'format=yuv420p'];
      const ff = ffmpeg(['-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(taxa), '-i', '-', '-vf', vf.join(','),
        '-r', String(fps), '-an', '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-movflags', '+faststart', o.video]);
      for (let i = 0; i < n * sub; i++) { await ff.escreve(await quadro(i / taxa)); if (i % 30 === 0) console.log('quadro', i, '/', n * sub); }
      await ff.fecha(); console.log('ok', o.video, `(${dur} s, ${fps} qps, ${larg}x${alt}, mudo)`);
    }
  } finally { await nav.close(); srv.close(); }
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2); const val = k => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : undefined; };
  if (!a[0] || a[0].startsWith('--')) { console.log('uso: node render.mjs pagina.html --video saida.mp4 [--fps 30] [--dur s] [--largura 540] [--blend 2] | --folha f.jpg --times 1,2,3 | --quadro q.jpg --t 1.5'); process.exit(1); }
  render({ pagina: a[0], video: val('video'), folha: val('folha'), quadro: val('quadro'), t: +(val('t') || 0), times: (val('times') || '0').split(',').map(Number),
    fps: +(val('fps') || 30), dur: val('dur') ? +val('dur') : 0, largura: +(val('largura') || 1080), blend: +(val('blend') || 1) }).catch(e => { console.error(e.message); process.exit(1); });
}
