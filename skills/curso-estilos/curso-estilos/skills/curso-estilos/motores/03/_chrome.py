"""Abre o Chrome que já está instalado no sistema (o Playwright não precisa baixar navegador).
CHROME_PATH aponta o executável se ele estiver fora do lugar padrão; DEMO_CPU=1 renderiza por software."""
import os


def acha_chrome():
    e = os.environ
    cands = [e.get('CHROME_PATH')]
    for base in (e.get('PROGRAMFILES'), e.get('PROGRAMFILES(X86)'), e.get('LOCALAPPDATA')):
        if base:
            cands += [os.path.join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'), os.path.join(base, 'Microsoft', 'Edge', 'Application', 'msedge.exe')]
    cands += ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
              '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium']
    for c in cands:
        if c and os.path.exists(c):
            return c
    raise SystemExit('Não achei o Chrome. Instale o Google Chrome ou aponte a variável CHROME_PATH para o executável.')


def abre(p):
    cpu = os.environ.get('DEMO_CPU') == '1'
    args = ['--mute-audio', '--ignore-gpu-blocklist'] + (['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] if cpu else ['--enable-gpu-rasterization'])
    return p.chromium.launch(executable_path=acha_chrome(), args=args)
