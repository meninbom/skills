"""Confere se o computador tem o que o plugin serie-lumen precisa, e instala as bibliotecas de Python que faltarem (só com --instalar).

uso:
  python checar_pc.py              # só confere (não muda nada)
  python checar_pc.py --instalar   # instala as bibliotecas de Python que faltam (rode só depois do ok do aluno)

Não instala programa nenhum além das bibliotecas de Python: diz o que falta e onde baixar.
"""
import os, sys, shutil, subprocess, importlib.util, argparse, glob

for _s in (sys.stdout, sys.stderr):
    try: _s.reconfigure(encoding='utf-8')
    except Exception: pass

AQUI = os.path.dirname(os.path.abspath(__file__))
REQ = os.path.join(os.path.dirname(AQUI), 'requirements.txt')
MODULOS = [('numpy', 'numpy', 'contas de imagem e som'), ('PIL', 'pillow', 'imagens'), ('cv2', 'opencv-python', 'efeito de golpe e checagem'),
           ('faster_whisper', 'faster-whisper', 'ouvir a voz (escolher tomadas, conferir a fala)'),
           ('rapidocr_onnxruntime', 'rapidocr-onnxruntime', 'ler texto na tela (checagem)')]


def roda(cmd, t=30):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=t)
        out = (r.stdout or r.stderr).strip().splitlines()
        return out[0] if out else 'ok'
    except Exception:
        return None


def git_bash():
    """o bash do Git for Windows (o do WSL, em System32, não enxerga as pastas do Windows do mesmo jeito)"""
    if os.name != 'nt':
        return shutil.which('bash')
    cands = [os.path.join(b, 'Git', 'bin', 'bash.exe') for b in (os.environ.get('ProgramFiles', 'C:/Program Files'),
             os.environ.get('ProgramFiles(x86)', ''), os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Programs')) if b]
    w = shutil.which('bash')
    if w and 'system32' not in w.lower() and 'windowsapps' not in w.lower():
        cands.append(w)
    return next((c for c in cands if os.path.isfile(c)), None)


def placa():
    """nome e memória da placa NVIDIA (nvidia-smi), ou None"""
    r = roda(['nvidia-smi', '--query-gpu=name,memory.total', '--format=csv,noheader,nounits'])
    if not r or ',' not in r: return None
    nome, mem = r.split(',', 1)
    try: return nome.strip(), int(mem.strip()) / 1024
    except ValueError: return nome.strip(), None


def checar_video():
    base = os.environ.get('CLAUDE_CONFIG_DIR') or os.path.join(os.path.expanduser('~'), '.claude')   # config isolada do Claude Code
    raiz = os.path.join(base, 'plugins')
    achou = glob.glob(os.path.join(raiz, '**', 'checar-video', 'scripts', 'checar.py'), recursive=True) if os.path.isdir(raiz) else []
    achou += [p for p in [os.path.join(base, 'skills', 'checar-video', 'scripts', 'checar.py')] if os.path.isfile(p)]
    return achou[0] if achou else None


def conferir():
    falta, avisos = [], []
    v = sys.version_info
    print('== O que o plugin precisa ==')
    print(f'{"Python":<22}', f'ok ({v.major}.{v.minor})' if v >= (3, 10) else 'VELHO: instale o 3.10 ou mais novo (python.org)')
    if v < (3, 10): falta.append('Python 3.10+')
    for nome, cmd, dica in (('ffmpeg', ['ffmpeg', '-version'], 'baixe em gyan.dev/ffmpeg/builds (release full) e ponha a pasta bin no PATH'),
                            ('ffprobe', ['ffprobe', '-version'], 'vem junto com o ffmpeg'),
                            ('Node', ['node', '--version'], 'baixe em nodejs.org (versão LTS); a voz usa')):
        r = roda(cmd)
        print(f'{nome:<22}', 'ok' if r else f'FALTA: {dica}')
        if not r: falta.append(nome)
    gb = git_bash()
    print(f'{"Git Bash":<22}', 'ok' if gb else 'FALTA: instale o Git for Windows (git-scm.com). O bash do WSL não serve.')
    if not gb: falta.append('Git Bash')
    print('\n== Bibliotecas de Python ==')
    faltam_pip = []
    for mod, pip, pra in MODULOS:
        tem = importlib.util.find_spec(mod) is not None
        print(f'{pip:<22}', 'ok' if tem else f'FALTA ({pra})')
        if not tem: faltam_pip.append(pip)
    print('\n== Outras peças ==')
    cv = checar_video()
    print(f'{"checar-video":<22}', 'ok' if cv else 'FALTA: vem no plugin curso-estilos (/plugin install curso-estilos@doti-cursos)')
    if not cv: falta.append('checar-video (plugin curso-estilos)')
    g = placa()
    if g and g[1] is not None:
        boa = g[1] >= 11.5
        print(f'{"placa de vídeo":<22}', f'{g[0]}, {g[1]:.0f} GB' + ('' if boa else ' (a animação no PC pede 12 GB; use a nuvem, ver a skill animar-local)'))
        if not boa: avisos.append('placa com menos de 12 GB')
    else:
        print(f'{"placa de vídeo":<22}', 'não achei placa NVIDIA. A animação no PC pede uma de 12 GB; sem ela, veja "Sem placa de vídeo" na skill animar-local.')
        avisos.append('sem placa NVIDIA')
    return falta, faltam_pip, avisos


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--instalar', action='store_true'); a = ap.parse_args()
    falta, faltam_pip, avisos = conferir()
    if faltam_pip and a.instalar:
        print('\n== Instalando as bibliotecas que faltam ==')
        r = subprocess.run([sys.executable, '-m', 'pip', 'install', *faltam_pip])
        if r.returncode != 0:
            print('A instalação deu erro. Copie a mensagem acima e mostre ao Claude.'); sys.exit(1)
        falta2, faltam_pip, _ = conferir()
    print()
    if faltam_pip and not a.instalar:
        print('Faltam bibliotecas de Python: ' + ', '.join(faltam_pip) + '. Elas são grátis e somam algumas centenas de MB.')
        print('Com o ok do aluno, rode de novo com --instalar.')
    if falta:
        print('Falta instalar (programas): ' + ', '.join(falta) + '.')
    if not falta and not faltam_pip:
        print('Tudo pronto. Próximo passo: /serie-lumen:serie-nova' + (f' (atenção: {", ".join(avisos)})' if avisos else ''))
    sys.exit(1 if falta or faltam_pip else 0)
