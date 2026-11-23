// Demo do estilo 08: 3 s, 540x960, mudo, yuv420p -> saida/demo.mp4
// uso: npm run demo        (DEMO_CPU=1 renderiza por software; CHROME_PATH aponta para o seu Chrome)
import {execSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PROJ = path.join(AQUI, 'projeto_robot');
const SAIDA = path.join(AQUI, 'saida', 'demo.mp4');

const acharChrome = () => {
  const e = process.env, c = [e.CHROME_PATH];
  if (process.platform === 'win32') {
    for (const b of [e['PROGRAMFILES'], e['PROGRAMFILES(X86)'], e.LOCALAPPDATA]) {
      if (!b) continue;
      c.push(path.join(b, 'Google/Chrome/Application/chrome.exe'), path.join(b, 'Microsoft/Edge/Application/msedge.exe'));
    }
  } else if (process.platform === 'darwin') {
    c.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge');
  } else {
    c.push('/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium');
  }
  return c.find((p) => p && fs.existsSync(p));
};

const chrome = acharChrome();
if (!chrome) {
  console.error('Nao achei o Chrome. Instale o Google Chrome ou defina CHROME_PATH com o caminho do executavel.');
  process.exit(1);
}
if (!fs.existsSync(path.join(PROJ, 'node_modules', 'remotion'))) {
  console.log('instalando as dependencias em projeto_robot/ (so na 1a vez)...');
  execSync('npm install --no-audit --no-fund', {cwd: PROJ, stdio: 'inherit'});
}
const {gerar} = await import(pathToFileURL(path.join(PROJ, 'tools', 'placeholders.mjs')).href);
console.log('placeholders em', gerar());

fs.mkdirSync(path.dirname(SAIDA), {recursive: true});
const cpu = !!process.env.DEMO_CPU;
const q = (s) => (process.platform === 'win32' ? `"${s}"` : s);
const args = ['remotion', 'render', 'src/index.ts', 'Demo', q(SAIDA), '--scale=0.5', '--muted', '--codec=h264', '--pixel-format=yuv420p',
  '--crf=23', '--image-format=png',   // png: com quadros jpeg o Remotion grava yuvj420p (faixa cheia), que alguns celulares nao abrem
  `--browser-executable=${q(chrome)}`, '--chrome-mode=chrome-for-testing', `--gl=${cpu ? 'swangle' : 'angle'}`,
  `--concurrency=${cpu ? 2 : 4}`];
const t0 = Date.now();
const r = process.platform === 'win32'
  ? spawnSync(['npx', ...args].join(' '), {cwd: PROJ, stdio: 'inherit', shell: true})
  : spawnSync('npx', args, {cwd: PROJ, stdio: 'inherit'});
if (r.status !== 0) process.exit(r.status || 1);
console.log(`ok: ${SAIDA} (${((Date.now() - t0) / 1000).toFixed(0)} s de render${cpu ? ', por software' : ''})`);
