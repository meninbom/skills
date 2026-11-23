// Render determinístico: abre a página no Chrome do sistema, chama window.seek(t) quadro a quadro e manda os quadros para o FFmpeg.
//   node render.mjs --demo                                   -> saida/demo.mp4 (3 s do golpe, 540x960, 12 qps, mudo)
//   node render.mjs --times 2,9,19.05 --out saida/folha.jpg  -> folha de quadros lado a lado  [--tw 360]
//   node render.mjs --video saida/filme.mp4 --fps 30         -> filme inteiro em 1080x1920    [--ini 0 --fim 30.5 --largura 1080]
//   node render.mjs --page estudio.html --shot x.jpg --t 0 --q "yc=0.918&d=5.93"   -> um quadro cru da página (usado pelo estudio.py)
//   node render.mjs --dbg 2,19.05                            -> imprime window.dbg(t) (câmera e posição do herói)
// Variáveis de ambiente: CHROME_PATH (caminho do Chrome/Edge/Chromium), FFMPEG_PATH (padrão: "ffmpeg" do PATH),
//   DEMO_CPU=1 (renderiza por software, SwiftShader; lento mas roda em qualquer PC), PORTA (padrão: uma porta livre).
import http from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const AQUI = dirname(fileURLToPath(import.meta.url));
const arg = (nome, padrao) => { const i = process.argv.indexOf('--' + nome); return i < 0 ? padrao : (process.argv[i + 1] ?? true); };
const tem = nome => process.argv.includes('--' + nome);
const CPU = process.env.DEMO_CPU === '1';
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';

function acharChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const e = process.env;
  const lista = process.platform === 'win32' ? [
    [e.PROGRAMFILES, 'Google/Chrome/Application/chrome.exe'], [e['PROGRAMFILES(X86)'], 'Google/Chrome/Application/chrome.exe'], [e.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'],
    [e['PROGRAMFILES(X86)'], 'Microsoft/Edge/Application/msedge.exe'], [e.PROGRAMFILES, 'Microsoft/Edge/Application/msedge.exe'],
  ].filter(([b]) => b).map(([b, r]) => join(b, r)) : process.platform === 'darwin' ? [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ] : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium', '/usr/bin/microsoft-edge'];
  const achado = lista.find(p => existsSync(p));
  if (!achado) { console.error('Não achei o Chrome. Instale o Google Chrome ou aponte a variável CHROME_PATH para o executável.'); process.exit(1); }
  return achado;
}

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2' };
function servidor() {
  const srv = http.createServer((req, res) => {
    if (req.url === '/favicon.ico') { res.writeHead(204); res.end(); return; }
    const rel = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^[\\/]+/, ''), arq = resolve(AQUI, rel);
    if (!(arq + sep).startsWith(AQUI + sep) || !existsSync(arq) || !statSync(arq).isFile()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TIPOS[extname(arq).toLowerCase()] || 'application/octet-stream' }); createReadStream(arq).pipe(res);
  });
  return new Promise(ok => srv.listen(+(process.env.PORTA || 0) || 0, '127.0.0.1', () => ok(srv)));
}
function ffmpeg(args) {
  const p = spawn(FFMPEG, ['-y', '-loglevel', 'error', ...args], { stdio: ['pipe', 'inherit', 'inherit'] });
  p.on('error', () => { console.error('Não achei o FFmpeg. Instale e ponha no PATH, ou aponte FFMPEG_PATH.'); process.exit(1); });
  return { escreve: buf => new Promise(ok => p.stdin.write(buf) ? ok() : p.stdin.once('drain', ok)), fim: () => new Promise(ok => { p.on('close', ok); p.stdin.end(); }) };
}
const saidaEm = caminho => { const s = resolve(process.cwd(), caminho); mkdirSync(dirname(s), { recursive: true }); return s; };

const t0 = Date.now(), demo = tem('demo');
const pagina = arg('page', 'filme.html'), q = arg('q', '');
const srv = await servidor(), porta = srv.address().port;
const nav = await puppeteer.launch({ executablePath: acharChrome(), headless: true, protocolTimeout: 0,
  args: [...(CPU ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader']), '--hide-scrollbars', '--mute-audio'] });
let codigo = 0;
try {
  const pg = await nav.newPage(); await pg.setViewport({ width: 1080, height: 1920 });
  pg.on('console', m => console.log('[página]', m.text())); pg.on('pageerror', e => console.log('[ERRO]', e.message));
  await pg.goto(`http://127.0.0.1:${porta}/${pagina}${q ? '?' + q : ''}`); await pg.waitForFunction('window.READY === true', { timeout: 300000 });
  const quadro = async (t, qual = 0.93) => Buffer.from((await pg.evaluate(async (t, qual) => { await window.seek(t); return document.getElementById('c').toDataURL('image/jpeg', qual); }, t, qual)).split(',')[1], 'base64');

  if (tem('dbg')) {
    for (const t of String(arg('dbg')).split(',').map(Number)) console.log(t, JSON.stringify(await pg.evaluate(t => window.dbg(t), t)));
  } else if (tem('shot')) {
    const s = saidaEm(arg('shot')), f = ffmpeg(['-f', 'image2pipe', '-c:v', 'mjpeg', '-i', '-', '-frames:v', '1', '-q:v', '2', s]);
    await f.escreve(await quadro(+arg('t', 0), 0.95)); await f.fim(); console.log('ok', s);
  } else if (tem('times')) {
    const ts = String(arg('times')).split(',').map(Number), tw = +arg('tw', 360), s = saidaEm(arg('out', 'saida/folha.jpg'));
    const f = ffmpeg(['-f', 'image2pipe', '-c:v', 'mjpeg', '-i', '-', '-vf', `scale=${tw}:-2,tile=${ts.length}x1`, '-frames:v', '1', '-q:v', '3', s]);
    for (const t of ts) await f.escreve(await quadro(t));
    await f.fim(); console.log('ok', s);
  } else {
    // demo: 3 s em volta do golpe (o impact frame cai em 19,05 s), metade da resolução e 12 qps para ser rápido até na CPU
    const fps = +arg('fps', demo ? 12 : 30), ini = +arg('ini', demo ? 17.6 : 0), fim = +arg('fim', demo ? 20.6 : await pg.evaluate('window.END'));
    const larg = +arg('largura', demo ? 540 : 1080), s = saidaEm(demo ? 'saida/demo.mp4' : arg('video', 'saida/filme.mp4')), n = Math.round((fim - ini) * fps);
    const f = ffmpeg(['-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-', '-an', '-vf', `scale=${larg}:-2:flags=lanczos`,
      '-c:v', 'libx264', '-crf', demo ? '20' : '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-movflags', '+faststart', s]);
    for (let i = 0; i < n; i++) { await f.escreve(await quadro(ini + i / fps)); if (i % 10 === 0) console.log('quadro', i, '/', n); }
    await f.fim(); console.log('ok', s, `(${n} quadros, ${((Date.now() - t0) / 1000).toFixed(0)} s${CPU ? ', CPU' : ''})`);
  }
} catch (e) { console.error('[falhou]', e.message); codigo = 1; }
await nav.close(); srv.close(); process.exit(codigo);
