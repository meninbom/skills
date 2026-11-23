"""Prepara o public/ do Remotion (robot). Idempotente; pode rodar de novo a qualquer momento.

- fontes Fixture (locais) -> public/fonts
- documentos reais -> public/docs (so curva leve: grade(white 244, black 18, sat 1, sem split); nunca acima do nativo)
- stills das cenas em codigo (Z07b, Z13, Z16, Z17) -> public/stills/<id>.jpg com a grade2 do plano (LUT)
- grao: 12 quadros de ruido fino (blur 0,7) -> public/grao (Remotion: overlay, renovado a cada quadro de 24 fps)
- voz FIXA voz/robot_tight.mp3 normalizada a -16 LUFS (loudnorm 2 passadas) -> public/audio/voz_-16lufs.wav (48 kHz)
- palavras -> src/data/words.json
- inventario do que existe (clipes, mattes, voz) -> src/data/disponiveis.json

uso: python preparar.py [--sem-voz]
"""
import sys, os, json, shutil, subprocess, re, numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.abspath(os.path.join(HERE, '..'))
ROBOT = os.path.abspath(os.path.join(PROJ, '..'))
PUB = os.path.join(PROJ, 'public')
sys.path.insert(0, os.path.join(ROBOT, '_build')); sys.path.insert(0, HERE)
from lib import load, save, grade, W, H  # noqa: E402
from lut import apply_grade  # noqa: E402

FD = os.environ.get('FONTES_DIR', 'fontes') + '/'
RAW = 'img/raw/'
IMG = 'img/'
Z = os.path.join(ROBOT, 'zimg') + '/'
VOZ = 'voz/robot_tight.mp3'
WORDS = 'voz/robot_tight.words.json'

DOCS = ['karel30', 'bratri1927', 'josef1937', 'patent1738', 'berry_mars', 'paris1', 'vesalius', 'tg1', 'klicpera_hoje',
        'narodni_zitek', 'turco', 'jaquet1', 'televox1928', 'cz1920_8', 'briullov']
# stills das cenas sem H3 (escolhidos na revisao da fila jobs6; Z07b = 2o desenho de geada, ja existente)
STILLS_CODIGO = {'Z07b': 'Z07_1702', 'Z13': 'Z13v2_2322', 'Z16': 'Z16_2601', 'Z17': 'Z17v3_2732'}


def fontes():
    d = os.path.join(PUB, 'fonts'); os.makedirs(d, exist_ok=True)
    for f in ('Fixture-ExpandedBlack.ttf', 'Fixture-SemiBold.ttf', 'Fixture-CondensedBlack.ttf'):
        shutil.copy2(FD + f, os.path.join(d, f))


def docs():
    d = os.path.join(PUB, 'docs'); os.makedirs(d, exist_ok=True)
    for n in DOCS:
        src = RAW + n + ('.png' if os.path.exists(RAW + n + '.png') and not os.path.exists(RAW + n + '.jpg') else '.jpg')
        a = load(src)
        g = grade(a, white=244, black=18, sat=1.0, split=0.0, mid=0.0)
        save(g, os.path.join(d, n + '.jpg'), q=94)
    # capa K2: scan da 1a edicao sem a faixa da lombada (148 px), grade do frames3.k2
    cov = load(RAW + 'cz1920_2.jpg')[:, 148:]
    save(grade(cov, white=236, black=16, sat=0.95, split=0.0, mid=0.0), os.path.join(d, 'capa_k2.jpg'), q=94)
    # Briullov: a tela do Z17 e quase quadrada -> DETALHE central quadrado, sem esticar (credito: '(detalhe)')
    bri = load(RAW + 'briullov.jpg')[:, 328:328 + 1903]
    save(grade(bri, white=244, black=18, sat=1.0, split=0.0, mid=0.0), os.path.join(d, 'briullov_detalhe.jpg'), q=94)
    shutil.copy2(IMG + 'parafuso.png', os.path.join(d, 'parafuso.png'))       # RGBA, CC BY 3.0 Dmitry Makeev
    shutil.copy2(RAW + 'assin_karel.png', os.path.join(d, 'assin_karel.png'))


def stills_codigo():
    d = os.path.join(PUB, 'stills'); os.makedirs(d, exist_ok=True)
    for k, name in STILLS_CODIGO.items():
        p = Z + name + '.png'
        if not os.path.exists(p):
            print('falta still', k, p); continue
        a = load(p)
        x0 = (a.shape[1] - W) // 2
        save(apply_grade(a[:, x0:x0 + W], key=k), os.path.join(d, k + '.jpg'), q=93)


def grao():
    d = os.path.join(PUB, 'grao'); os.makedirs(d, exist_ok=True)
    for k in range(12):
        n = np.random.default_rng(1000 + k).standard_normal((H, W)).astype(np.float32)
        n = cv2.GaussianBlur(n, (0, 0), 0.7); n /= n.std() + 1e-6
        g = np.clip(128 + n * 9.0, 0, 255).astype(np.uint8)       # overlay x opacidade 0,55 ~ 1,8% de luminancia (lib.grain)
        cv2.imwrite(os.path.join(d, f'g{k:02d}.png'), g)


def voz():
    d = os.path.join(PUB, 'audio'); os.makedirs(d, exist_ok=True)
    out = os.path.join(d, 'voz_-16lufs.wav')
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', VOZ, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True)
    m = json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', r.stderr).group(0))
    af = (f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', VOZ, '-af', af, '-ar', '48000', '-ac', '1', out], check=True)
    r2 = subprocess.run(['ffmpeg', '-hide_banner', '-i', out, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True)
    i = re.findall(r'I:\s+(-?[\d.]+) LUFS', r2.stderr)
    print('voz:', m['input_i'], 'LUFS ->', i[-1] if i else '?', 'LUFS', out)


def palavras():
    shutil.copy2(WORDS, os.path.join(PROJ, 'src', 'data', 'words.json'))


def inventario():
    clips = sorted(f[:-4] for f in os.listdir(os.path.join(PUB, 'clips')) if f.endswith('.mp4')) if os.path.isdir(os.path.join(PUB, 'clips')) else []
    md = os.path.join(PUB, 'mattes')
    mattes = sorted(x for x in os.listdir(md) if os.path.isdir(os.path.join(md, x))) if os.path.isdir(md) else []
    voz_ok = os.path.exists(os.path.join(PUB, 'audio', 'voz_-16lufs.wav'))
    # sequencias do heroi (tools/heroi_seq.py): so conta quando o fundo E o recorte de todos os quadros existem
    sd = os.path.join(PUB, 'seq')
    seqs = {}
    if os.path.isdir(sd):
        for x in sorted(os.listdir(sd)):
            fs = os.listdir(os.path.join(sd, x))
            nj = sum(f.endswith('.jpg') for f in fs); npng = sum(f.startswith('f') and f.endswith('.png') for f in fs)
            if nj and nj == npng:
                seqs[x] = nj
    json.dump(dict(clips=clips, mattes=mattes, seqs=seqs, voz=voz_ok), open(os.path.join(PROJ, 'src', 'data', 'disponiveis.json'), 'w'), indent=1)
    print('disponiveis:', len(clips), 'clipes,', len(mattes), 'mattes,', len(seqs), 'sequencias, voz', voz_ok)


if __name__ == '__main__':
    os.makedirs(os.path.join(PROJ, 'src', 'data'), exist_ok=True)
    fontes(); docs(); stills_codigo(); grao(); palavras()
    if '--sem-voz' not in sys.argv:
        voz()
    inventario()
