// Render quadro a quadro de uma composição no contrato do HyperFrames (raiz com data-composition-id e
// data-duration, filhos class="clip" com data-start/data-duration, linha do tempo GSAP pausada em
// window.__timelines[id]). Sai MP4 mudo em yuv420p, sem precisar do HyperFrames.
// uso:
//   node render.mjs --pagina index.html --video saida/filme.mp4 [--fps 24] [--ini 0] [--fim 30] [--esc 1]
//   node render.mjs --pagina index.html --quadros 2,9,16.1 --out saida/folha.jpg [--esc 0.5]
// --esc 0.5 renderiza em 540×960 (o desenho é vetor: só muda a densidade de pixels).
// DEMO_CPU=1 (ou --cpu) força render por software. Chrome: variável CHROME_PATH ou os caminhos padrão.
// FFmpeg: variável FFMPEG_PATH ou o do PATH.
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const a = {};
for (let i = 2; i < process.argv.length; i++) {
  const k = process.argv[i]; if (!k.startsWith('--')) continue;
  const v = process.argv[i + 1]; if (v === undefined || v.startsWith('--')) a[k.slice(2)] = true; else { a[k.slice(2)] = v; i++; }
}
if (!a.pagina || (!a.video && !a.quadros)) { console.error('uso: node render.mjs --pagina index.html (--video saida/x.mp4 | --quadros 1,2,3 --out saida/folha.jpg)'); process.exit(1); }
const FPS = Number(a.fps || 24), ESC = Number(a.esc || 1), INI = Number(a.ini || 0);
const CPU = !!a.cpu || process.env.DEMO_CPU === '1';
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
const pagina = path.resolve(RAIZ, a.pagina);
if (!pagina.startsWith(RAIZ) || !fs.existsSync(pagina)) { console.error('página não encontrada dentro da pasta do motor: ' + a.pagina); process.exit(1); }

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

const gl = CPU ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [];
const t0 = Date.now();
const nav = await puppeteer.launch({ executablePath: acharChrome(), headless: true, args: [...gl, '--mute-audio', '--hide-scrollbars', '--allow-file-access-from-files'] });
let falhou = false;
try {
  const pg = await nav.newPage();
  pg.on('console', (m) => { if (m.type() === 'error') console.log('[pagina]', m.text()); });
  pg.on('pageerror', (e) => { console.log('[ERRO]', e.message); falhou = true; });
  await pg.setViewport({ width: 1080, height: 1920, deviceScaleFactor: ESC });
  await pg.goto(pathToFileURL(pagina).href);
  await pg.waitForFunction('window.__timelines && Object.keys(window.__timelines).length > 0', { timeout: 60000 });
  await pg.evaluate(() => document.fonts.ready.then(() => true));
  // O que o HyperFrames faria: tamanho do palco, relógio único e visibilidade dos clips.
  const info = await pg.evaluate(() => {
    const raiz = document.querySelector('[data-composition-id]');
    const W = Number(raiz.dataset.width), H = Number(raiz.dataset.height);
    for (const el of [document.documentElement, document.body]) { el.style.width = W + 'px'; el.style.height = H + 'px'; el.style.overflow = 'hidden'; }
    const tl = window.__timelines[raiz.dataset.compositionId];
    const clips = [...raiz.querySelectorAll('.clip')].map((el) => ({ el, ini: Number(el.dataset.start), fim: Number(el.dataset.start) + Number(el.dataset.duration) }));
    window.__seek = (t) => {
      for (const c of clips) c.el.style.visibility = t >= c.ini && t < c.fim ? 'visible' : 'hidden';
      tl.seek(t, false);
      return new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(() => ok(true))));
    };
    return { W, H, dur: Number(raiz.dataset.duration) };
  });
  if (info.W !== 1080 || info.H !== 1920) await pg.setViewport({ width: info.W, height: info.H, deviceScaleFactor: ESC });
  console.log(`carregou em ${((Date.now() - t0) / 1000).toFixed(1)} s (${CPU ? 'CPU' : 'placa de vídeo, se houver'})`);
  const pegar = async (t) => { await pg.evaluate((tt) => window.__seek(tt), t); return pg.screenshot({ type: 'png' }); };
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
    const cols = Math.min(6, ts.length), lin = Math.ceil(ts.length / cols);
    await rodar(['-f', 'image2pipe', '-c:v', 'png', '-i', '-', '-vf', `scale=${a.tw || 360}:-2:flags=lanczos,tile=${cols}x${lin}`, '-frames:v', '1', '-q:v', '3', out],
      async (escreve) => { for (const t of ts) await escreve(await pegar(t)); });
    console.log(`ok ${out} em ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  } else {
    const FIM = a.fim !== undefined ? Math.min(Number(a.fim), info.dur) : info.dur;
    const n = Math.round((FIM - INI) * FPS); const t1 = Date.now();
    fs.mkdirSync(path.dirname(path.resolve(a.video)), { recursive: true });
    // Quadros em PNG (faixa cheia) convertidos para yuv420p de faixa de TV; -an garante arquivo mudo.
    await rodar(['-f', 'image2pipe', '-c:v', 'png', '-framerate', String(FPS), '-i', '-', '-vf', 'scale=in_range=full:out_range=tv,format=yuv420p',
      '-an', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-color_range', 'tv', '-movflags', '+faststart', a.video],
      async (escreve) => {
        for (let i = 0; i < n; i++) {
          await escreve(await pegar(INI + (i + 0.5) / FPS));   // meio do quadro: nunca cai na fronteira de uma troca "em dois"
          if (i % 24 === 23) console.log(`  ${i + 1}/${n} quadros`);
        }
      });
    console.log(`ok ${a.video}: ${n} quadros, ${((Date.now() - t1) / 1000).toFixed(1)} s de render`);
  }
} catch (e) { console.error(e); falhou = true; } finally { await nav.close(); }
process.exit(falhou ? 1 : 0);
