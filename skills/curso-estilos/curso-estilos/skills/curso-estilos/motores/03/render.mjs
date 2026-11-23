// Render determinístico de uma página que expõe window.READY, window.seek(t) e window.END.
// Usa o Chrome já instalado no sistema (puppeteer-core) e o FFmpeg do PATH. Nada é baixado.
//
//   node render.mjs --video saida/filme.mp4 [--pagina index.html] [--ini 0] [--fim 3] [--qps 30] [--largura 1080]
//   node render.mjs --tempos 1,6,13 --saida saida/folha.jpg [--lt 360]      (folha de quadros lado a lado)
//   node render.mjs --pagina kit_template/kit.html --video saida/kit.mp4 [--vw 1080 --vh 1920] [--tema dia] [--plano medio]
//
// --vw e --vh são o tamanho da janela do navegador. Quando você passa --vw, --vh, --tema ou --plano, eles também vão para a página
// no endereço (?vw=...&vh=...&tema=...&plano=...); a página do kit_template usa isso para o tamanho do quadro, o cenário e o enquadramento.
// As outras páginas têm o quadro fixo em 1080×1920 e ignoram esses valores.
//
// Variáveis de ambiente:
//   CHROME_PATH  caminho do Chrome/Chromium/Edge, se não estiver num lugar padrão
//   DEMO_CPU=1   renderiza por software (SwiftShader), sem placa de vídeo. Mais lento, mesmo resultado.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const arg = (nome, padrao) => { const i = process.argv.indexOf('--' + nome); return i > 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : padrao; };
const PAGINA = arg('pagina', 'index.html'), VIDEO = arg('video'), TEMPOS = arg('tempos'), SAIDA = arg('saida', 'saida/folha.jpg');
const QPS = +arg('qps', 30), INI = +arg('ini', 0), FIM = arg('fim'), LARGURA = +arg('largura', 0), LT = +arg('lt', 360);
const CANVAS = arg('canvas', '#c'), VW = +arg('vw', 1080), VH = +arg('vh', 1920), CRF = arg('crf', '18'), ESPERA = +arg('espera', 300) * 1000;
const dado = nome => process.argv.includes('--' + nome);
const CONSULTA = ['vw', 'vh', 'tema', 'plano'].filter(dado).map(n => n + '=' + encodeURIComponent(arg(n))).join('&');
if (!VIDEO && !TEMPOS) { console.error('uso: node render.mjs --video saida/filme.mp4 | --tempos 1,2,3 --saida saida/folha.jpg'); process.exit(1); }

function achaChrome() {
  const e = process.env, c = [e.CHROME_PATH,
    e.PROGRAMFILES && path.join(e.PROGRAMFILES, 'Google/Chrome/Application/chrome.exe'),
    e['PROGRAMFILES(X86)'] && path.join(e['PROGRAMFILES(X86)'], 'Google/Chrome/Application/chrome.exe'),
    e.LOCALAPPDATA && path.join(e.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
    e['PROGRAMFILES(X86)'] && path.join(e['PROGRAMFILES(X86)'], 'Microsoft/Edge/Application/msedge.exe'),
    e.PROGRAMFILES && path.join(e.PROGRAMFILES, 'Microsoft/Edge/Application/msedge.exe'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium'];
  const ok = c.find(p => p && fs.existsSync(p));
  if (!ok) { console.error('Não achei o Chrome. Instale o Google Chrome ou aponte a variável CHROME_PATH para o executável.'); process.exit(1); }
  return ok;
}

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.wasm': 'application/wasm', '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8' };
const servidor = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html', arq = path.resolve(RAIZ, rel);
  if (!arq.startsWith(RAIZ) || !fs.existsSync(arq) || !fs.statSync(arq).isFile()) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arq).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(arq).pipe(res);
});
await new Promise(r => servidor.listen(0, '127.0.0.1', r));
const porta = servidor.address().port;

const CPU = process.env.DEMO_CPU === '1';
const nav = await puppeteer.launch({ executablePath: achaChrome(), headless: true, protocolTimeout: 0,
  args: ['--no-first-run', '--hide-scrollbars', '--mute-audio', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    ...(CPU ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--enable-gpu-rasterization'])] });
let codigo = 0;
try {
  const pg = await nav.newPage();
  await pg.setViewport({ width: VW, height: VH });
  pg.on('console', m => console.log('[pagina]', m.text()));
  pg.on('pageerror', e => console.log('[ERRO]', e.message));
  pg.on('response', r => { if (r.status() >= 400) console.log(`[${r.status()}]`, 'a página pediu um arquivo que não existe:', r.url().replace(`http://127.0.0.1:${porta}/`, '')); });
  await pg.goto(`http://127.0.0.1:${porta}/${PAGINA}` + (CONSULTA ? (PAGINA.includes('?') ? '&' : '?') + CONSULTA : ''));
  await pg.waitForFunction('window.READY === true', { timeout: ESPERA, polling: 200 });
  // Se a página expõe window.velAng(t) (graus/s da câmera), os viradões acima de 90°/s ganham desfoque de movimento:
  // média de 6 a 28 subquadros dentro de meio intervalo de quadro (obturador de 180°).
  const quadro = async (t, borrao = false) => {
    const d = await pg.evaluate(async (t, sel, dt, borrao) => {
      const c = document.querySelector(sel), v = borrao && window.velAng ? window.velAng(t) : 0;
      if (v < 90) { await window.seek(t); return c.toDataURL('image/jpeg', 0.93); }
      const k = Math.floor(Math.min(28, Math.max(6, v / 12))), a = document.createElement('canvas'); a.width = c.width; a.height = c.height;
      const g = a.getContext('2d');
      for (let j = 0; j < k; j++) { await window.seek(t - dt * (j / (k - 1) - 0.5)); g.globalAlpha = 1 / (j + 1); g.drawImage(c, 0, 0); }
      return a.toDataURL('image/jpeg', 0.93);
    }, t, CANVAS, 0.5 / QPS, borrao);
    return Buffer.from(d.split(',')[1], 'base64');
  };
  const ffmpeg = args => {
    const f = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: ['pipe', 'inherit', 'inherit'] });
    f.on('error', () => { console.error('Não achei o FFmpeg no PATH.'); process.exit(1); });
    return f;
  };
  const escreve = (f, buf) => new Promise(r => (f.stdin.write(buf) ? r() : f.stdin.once('drain', r)));
  const fecha = f => new Promise(r => { f.on('close', r); f.stdin.end(); });
  const t0 = Date.now();
  if (TEMPOS) {
    const ts = TEMPOS.split(',').map(Number);
    fs.mkdirSync(path.dirname(path.resolve(SAIDA)), { recursive: true });
    const f = ffmpeg(['-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', '1', '-i', '-', '-vf', `scale=${LT}:-2,tile=${ts.length}x1`, '-frames:v', '1', '-update', '1', '-q:v', '3', SAIDA]);
    for (const t of ts) await escreve(f, await quadro(t));
    await fecha(f); console.log('ok', SAIDA);
  } else {
    const fim = FIM !== undefined ? +FIM : await pg.evaluate('window.END'), n = Math.max(1, Math.round((fim - INI) * QPS));
    fs.mkdirSync(path.dirname(path.resolve(VIDEO)), { recursive: true });
    const f = ffmpeg(['-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(QPS), '-i', '-', ...(LARGURA ? ['-vf', `scale=${LARGURA}:-2:flags=lanczos`] : []),
      '-an', '-c:v', 'libx264', '-crf', CRF, '-preset', 'medium', '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-movflags', '+faststart', VIDEO]);
    for (let i = 0; i < n; i++) {
      await escreve(f, await quadro(INI + i / QPS, true));
      if (i % 15 === 0) console.log(`quadro ${i}/${n} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    }
    await fecha(f); console.log('ok', VIDEO, `${n} quadros em ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
} catch (e) { console.error('[falhou]', e.message); codigo = 1; }
await nav.close(); servidor.close(); process.exit(codigo);
