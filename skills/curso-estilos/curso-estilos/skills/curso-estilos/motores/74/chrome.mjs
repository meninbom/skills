// Acha o Chrome (ou Edge/Chromium) já instalado no sistema, para o Remotion não baixar navegador.
// Ordem: variável CHROME_PATH, depois os caminhos padrão de Windows, macOS e Linux.
import fs from 'node:fs';
import path from 'node:path';

export function acharChrome() {
  const env = process.env.CHROME_PATH;
  if (env) {
    if (fs.existsSync(env)) return env;
    throw new Error(`CHROME_PATH aponta para um arquivo que não existe: ${env}`);
  }
  const c = [];
  if (process.platform === 'win32') {
    const bases = [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter(Boolean);
    for (const b of bases) c.push(path.join(b, 'Google', 'Chrome', 'Application', 'chrome.exe'));
    for (const b of bases) c.push(path.join(b, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
    for (const b of bases) c.push(path.join(b, 'Chromium', 'Application', 'chrome.exe'));
  } else if (process.platform === 'darwin') {
    c.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    );
  } else {
    c.push('/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium', '/usr/bin/microsoft-edge');
  }
  const achado = c.find((p) => fs.existsSync(p));
  if (!achado) throw new Error('Não achei o Chrome. Instale o Google Chrome ou defina CHROME_PATH com o caminho do executável.');
  return achado;
}

// Opções comuns de render: Chrome do sistema e, com DEMO_CPU=1, GL por software (sem placa de vídeo).
// DEMO_GL troca o backend (swiftshader, swangle, angle...) se o padrão não abrir na sua máquina.
export function opcoesNavegador() {
  const cpu = process.env.DEMO_CPU === '1';
  const gl = process.env.DEMO_GL || (cpu ? 'swiftshader' : null);
  return {
    browserExecutable: acharChrome(),
    chromeMode: 'chrome-for-testing',
    chromiumOptions: gl ? { gl } : {},
  };
}
