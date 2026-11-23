// render.mjs: Chrome headless dirigindo o filme (window.FILM) quadro a quadro, com o ffmpeg codificando.
//   node render.mjs still 1.5,3,12 prefixo   -> qa/prefixo_<t>.png
//   node render.mjs video                    -> OUT (padrão raw.mp4), mudo, yuv420p
// Variáveis de ambiente:
//   S=2            escala interna do render (2 = final, 1 = prévia, 0.5 = rascunho)
//   Q="&bg=1"      parâmetros extras da página (ex.: "&test=1&cam=..", "&vrm=../modelo/meu.vrm")
//   T0 / T1        trecho em segundos (padrão: o filme todo)
//   OUT=raw.mp4    arquivo de saída (relativo a esta pasta)
//   WARP=narrado/warp.json   relógio da voz -> relógio do filme (versão narrada)
//   SAIDA=540x960  redimensiona a saída (padrão 1080x1920)   |   PASSO=2 renderiza 1 a cada 2 quadros (15 qps)
//   DEMO_CPU=1     render por software (sem placa de vídeo)  |   CHROME_PATH=...  executável do Chrome
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { abrirChrome } from '../chrome.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)); const root = path.resolve(here, '..');   // root = pasta do motor
const MODE = process.argv[2] || 'video';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.vrm': 'application/octet-stream' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(req.headers['x-probe'] ? 204 : 404); return res.end(); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : buf);
  });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const browser = await abrirChrome({ protocolTimeout: 3600000 });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920 });
page.on('pageerror', e => console.error('PAGEERR', e.message));
page.on('console', m => { const s = m.text(); if (!/warning X4008|Program Info Log|GPU stall|GL Driver Message/.test(s)) console.log('[page]', s.slice(0, 600)); });
await page.goto(`http://127.0.0.1:${port}/${path.basename(here)}/index.html?headless=1&s=${process.env.S || 2}${process.env.Q || ''}`);
await page.waitForFunction('window.FILM && window.FILM.ready === true', { timeout: 1800000 });
console.log('erros na carga:', JSON.stringify(await page.evaluate('FILM.errors')));
const png = () => page.evaluate(() => document.getElementById('film').toDataURL('image/png').split(',')[1]);

if (MODE === 'still') {
  const ts = String(process.argv[3]).split(',').map(Number), pre = process.argv[4] || 'chk';
  fs.mkdirSync(path.join(here, 'qa'), { recursive: true });
  for (const t of ts) {
    const ms = await page.evaluate(`FILM.renderFrame(${Math.round(t * 30)})`);
    fs.writeFileSync(path.join(here, 'qa', `${pre}_${t}.png`), Buffer.from(await png(), 'base64'));
    console.log(`still ${t} ${ms.toFixed(0)}ms`);
  }
} else {
  const FPS = 30, PASSO = Math.max(1, Math.round(+(process.env.PASSO || 1))), OUT = path.resolve(here, process.env.OUT || 'raw.mp4');
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const DUR = await page.evaluate('FILM.DURATION');
  const T0 = +(process.env.T0 || 0), T1 = +(process.env.T1 || DUR);
  const vf = process.env.SAIDA ? ['-vf', `scale=${process.env.SAIDA.replace('x', ':')}:flags=lanczos`] : [];
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '1080x1920', '-r', String(FPS / PASSO), '-i', '-', ...vf,
    '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
  // WARP: quadro de saída f -> tempo do filme pelas âncoras [novo_s, filme_s] (a voz manda no relógio).
  // "suaviza_s" no JSON = média móvel do mapa nessa janela: a velocidade muda em rampa, não em degrau, em cada âncora.
  const WARP = process.env.WARP ? JSON.parse(fs.readFileSync(path.join(here, process.env.WARP), 'utf8')) : null;
  const warpL = (T) => { const a = WARP.ancoras_novo_fonte; for (let i = 1; i < a.length; i++) if (T <= a[i][0]) return a[i - 1][1] + (T - a[i - 1][0]) * (a[i][1] - a[i - 1][1]) / (a[i][0] - a[i - 1][0]); return a[a.length - 1][1]; };
  const SW = WARP?.suaviza_s || 0, warp = (T) => { if (!SW) return warpL(T); let s = 0; for (let k = 0; k <= 16; k++) s += warpL(T + SW * (k / 16 - 0.5)); return s / 17; };
  const F0 = Math.round(T0 * FPS), F1 = WARP && !process.env.T1 ? Math.round(WARP.duracao * FPS) : Math.round(T1 * FPS), t0 = Date.now();
  let n = 0;
  for (let f = F0; f < F1; f += PASSO, n++) {
    await page.evaluate(`FILM.renderFrame(${WARP ? Math.min(warp(f / FPS) * FPS, FPS * DUR - 1) : f})`);
    const buf = Buffer.from(await page.evaluate('FILM.grab()'), 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (n % 15 === 0) console.log(`quadro ${f}/${F1} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log(`pronto: ${n} quadros em ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${OUT} | erros ${JSON.stringify(await page.evaluate('FILM.errors'))}`);
}
await browser.close(); server.close();
