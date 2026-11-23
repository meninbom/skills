// Abre o Chrome que ja esta instalado no computador (nao baixa navegador).
// CHROME_PATH=/caminho/do/chrome aponta para outro; DEMO_CPU=1 forca render por software (SwiftShader).
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

export function acharChrome() {
  const env = process.env.CHROME_PATH;
  if (env) {
    if (fs.existsSync(env)) return env;
    throw new Error(`CHROME_PATH aponta para um arquivo que nao existe: ${env}`);
  }
  const c = [];
  if (process.platform === 'win32') {
    for (const base of [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA]) {
      if (!base) continue;
      c.push(path.join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'));
      c.push(path.join(base, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
      c.push(path.join(base, 'Chromium', 'Application', 'chrome.exe'));
    }
  } else if (process.platform === 'darwin') {
    c.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge');
  } else {
    c.push('/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium',
      '/usr/bin/chromium-browser', '/snap/bin/chromium', '/usr/bin/microsoft-edge');
  }
  const achado = c.find((p) => fs.existsSync(p));
  if (!achado) throw new Error('Nao achei Chrome, Chromium nem Edge. Instale o Chrome ou defina CHROME_PATH.');
  return achado;
}

export async function abrirNavegador(extra = []) {
  const args = ['--allow-file-access-from-files', '--ignore-gpu-blocklist', '--hide-scrollbars',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', ...extra];
  if (process.env.DEMO_CPU === '1') args.push('--use-angle=swiftshader', '--enable-unsafe-swiftshader');
  return puppeteer.launch({ executablePath: acharChrome(), headless: true, args, protocolTimeout: 900000 });
}

export function ffmpegBin() { return process.env.FFMPEG_PATH || 'ffmpeg'; }

// Abre um ffmpeg que recebe quadros (JPEG ou PNG) pelo stdin e grava MP4 mudo em yuv420p.
import { spawn } from 'node:child_process';
export function abrirEncoder({ saida, fps, largura, altura, codecEntrada = 'mjpeg', crf = 18 }) {
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  const ff = spawn(ffmpegBin(), ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', codecEntrada, '-i', '-',
    '-vf', `scale=${largura}:${altura}:flags=lanczos:in_range=full:out_range=tv,format=yuv420p`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-an',
    '-movflags', '+faststart', saida], { stdio: ['pipe', 'inherit', 'inherit'] });
  const fim = new Promise((ok, erro) => {
    ff.on('close', (c) => (c === 0 ? ok() : erro(new Error('ffmpeg saiu com codigo ' + c))));
    ff.on('error', (e) => erro(new Error('Nao consegui rodar o ffmpeg (instale e ponha no PATH, ou defina FFMPEG_PATH): ' + e.message)));
  });
  return {
    async quadro(buf) { if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r)); },
    async fechar() { ff.stdin.end(); await fim; },
  };
}
