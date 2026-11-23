// chrome.mjs: abre o Chrome (ou Edge/Chromium) que já existe no computador, com puppeteer-core. Não baixa navegador.
//   CHROME_PATH=/caminho/do/chrome   força um executável
//   DEMO_CPU=1                       renderiza por software (SwiftShader): lento, mas roda sem placa de vídeo
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

export function chromePath() {
  const env = process.env, c = [env.CHROME_PATH];
  if (process.platform === 'win32') {
    for (const b of [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA]) {
      if (!b) continue;
      c.push(path.join(b, 'Google/Chrome/Application/chrome.exe'), path.join(b, 'Microsoft/Edge/Application/msedge.exe'), path.join(b, 'Chromium/Application/chrome.exe'));
    }
  } else if (process.platform === 'darwin') {
    c.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Chromium.app/Contents/MacOS/Chromium');
  } else {
    c.push('/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium', '/usr/bin/microsoft-edge');
  }
  const p = c.find((x) => x && fs.existsSync(x));
  if (!p) throw new Error('Chrome não encontrado. Instale o Google Chrome ou aponte a variável CHROME_PATH para o executável.');
  return p;
}

export const CPU = process.env.DEMO_CPU === '1';

// webgl: false = só para tirar print de HTML (cartelas), sem flags de placa de vídeo
export async function abrirChrome({ protocolTimeout = 3600000, webgl = true } = {}) {
  const gpu = [...(process.platform === 'win32' ? ['--use-angle=d3d11'] : []), '--enable-gpu', '--ignore-gpu-blocklist'];
  const cpu = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
  return puppeteer.launch({ executablePath: chromePath(), headless: true, protocolTimeout, args: !webgl ? [] : CPU ? cpu : gpu });
}
