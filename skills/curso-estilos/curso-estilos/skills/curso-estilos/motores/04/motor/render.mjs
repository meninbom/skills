// node render.mjs still <t1,t2,...> [prefixo]   -> <prefixo>_<t>.png (varios quadros numa sessao so do navegador)
// node render.mjs video [segundos] [fps]          -> out.mp4 (PNG por pipe direto no ffmpeg, crf 20)
// env: SCENE (html), Q (query string, ex. "?nocap=1"), OUT (arquivo de video), START (segundo inicial, padrao 0),
//      LARGURA (reduz o video para essa largura, ex. 540), CHROME_PATH, ANGLE (d3d11 | metal | gl | vulkan),
//      DEMO_CPU=1 (render por software, sem placa de video: bem mais lento, mesmo resultado)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const MODE = process.argv[2] || 'video';
const root = path.dirname(fileURLToPath(import.meta.url)); // funciona com espaco/acento no caminho
const SCENE = process.env.SCENE || 'scene.html';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.bin': 'application/octet-stream', '.json': 'application/json' };
// import map nao funciona em file:// -> servidor http local na pasta do motor
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  // /node_modules/ (three) fica na pasta de cima, onde esta o package.json
  const file = rel.startsWith('/node_modules/') && !fs.existsSync(path.join(root, rel)) ? path.join(root, '..', rel) : path.join(root, rel);
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }); res.end(buf);
  });
}).listen(0);
const port = server.address().port;

// Com placa de video o ANGLE e obrigatorio: sem ele o Chrome headless cai no SwiftShader (CPU) e fica 50-100x mais lento.
function achaChrome() {
  const e = process.env, c = [e.CHROME_PATH,
    ...[e.PROGRAMFILES, e['PROGRAMFILES(X86)'], e.LOCALAPPDATA].filter(Boolean).flatMap(b => [path.join(b, 'Google/Chrome/Application/chrome.exe'), path.join(b, 'Microsoft/Edge/Application/msedge.exe')]),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium'];
  const ok = c.find(p => p && fs.existsSync(p));
  if (!ok) { console.error('Nao achei o Chrome. Instale o Google Chrome ou aponte a variavel CHROME_PATH para o executavel.'); process.exit(1); }
  return ok;
}
const CPU = process.env.DEMO_CPU === '1';
const DEF_ANGLE = { win32: 'd3d11', darwin: 'metal', linux: 'gl' };
const browser = await puppeteer.launch({
  executablePath: achaChrome(),
  headless: true, protocolTimeout: 0,
  args: CPU ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio']
    : [`--use-angle=${process.env.ANGLE || DEF_ANGLE[process.platform] || 'gl'}`, '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader=false', '--mute-audio'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920 });
page.on('pageerror', async e => { console.error('page error:', e.message); await browser.close(); process.exit(1); });
page.on('console', m => { const t = m.text(); if (!t.includes('X3595') && !t.includes('404')) console.log('[page]', t.slice(0, 3000)); });
const tl = Date.now();
await page.goto(`http://localhost:${port}/${SCENE}${process.env.Q || ''}`);
await page.waitForFunction('window.ready === true', { timeout: CPU ? 900000 : 180000 });
console.log(`scene built in ${((Date.now() - tl) / 1000).toFixed(1)}s`);
const grab = t => page.evaluate(t => window.grabFrame(t), t);

if (MODE === 'still') {
  const ts = (process.argv[3] || '0').split(',').map(Number), pre = process.argv[4] || 'still';
  for (const t of ts) {
    const t0 = Date.now();
    fs.writeFileSync(path.join(root, `${pre}_${t}.png`), Buffer.from(await grab(t), 'base64'));
    console.log(`still ${t}: ${((Date.now() - t0) / 1000).toFixed(2)}s`);
  }
} else {
  const SECONDS = Number(process.argv[3] || 10), FPS = Number(process.argv[4] || 30), START = Number(process.env.START || 0);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    ...(process.env.LARGURA ? ['-vf', `scale=${process.env.LARGURA}:-2:flags=lanczos`] : []),
    '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', path.join(root, process.env.OUT || 'out.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  const N = Math.round(SECONDS * FPS), F0 = Math.round(START * FPS);
  for (let i = 0; i < N; i++) {
    // cada quadro e funcao pura do tempo: t = numero do quadro / fps (nunca relogio de parede)
    const buf = Buffer.from(await grab((F0 + i) / FPS), 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 10 === 0) console.log(`frame ${i}/${N} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log(`${N} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s = ${((Date.now() - t0) / 1000 / N).toFixed(2)} s/frame`);
}
await browser.close(); server.close();
