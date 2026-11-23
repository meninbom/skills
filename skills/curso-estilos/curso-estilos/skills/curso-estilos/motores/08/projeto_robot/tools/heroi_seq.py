"""Heroi por quadro para o tipo/foto ATRAS da cabeca (cenas 1, 15, 28, 31) sem descompasso de cor.

Em vez de OffthreadVideo + mask-image (a mascara CSS nao entra no delayRender e a cor do decoder do Remotion pode
diferir da do ffmpeg), o plano do heroi vira SEQUENCIA: public/seq/<id>/NNNN.jpg (fundo) e public/seq/<id>/fNNNN.png
(mesmo pixel decodificado + alfa do heroi). Os dois saem do MESMO quadro decodificado: o recorte nunca deixa contorno.
Matte: rembg isnet-general-use (modelo local em ~/.rembg/models, sem download), entrada 540x960, suavizado no tempo.
Z01a_rev nao precisa de pasta: o Robot.tsx le Z01a de tras para frente.

uso: python heroi_seq.py [Z01a Z01b Z01c]
"""
import os, sys, subprocess, tempfile, numpy as np, cv2

os.environ.setdefault('U2NET_HOME', os.path.expanduser('~/.rembg/models/isnet-general-use'))
os.environ.setdefault('MODEL_CHECKSUM_DISABLED', '1')
HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.abspath(os.path.join(HERE, '..', 'public'))


def run(key, sess):
    from rembg import remove
    from PIL import Image
    src = os.path.join(PUB, 'clips', f'{key}.mp4')
    d = os.path.join(PUB, 'seq', key)
    os.makedirs(d, exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-q:v', '2', '-start_number', '0', os.path.join(d, '%04d.jpg')], check=True)
    n = len([f for f in os.listdir(d) if f.endswith('.jpg')])
    prev = None
    for i in range(n):
        bgr = cv2.imread(os.path.join(d, f'{i:04d}.jpg'))
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        small = Image.fromarray(cv2.resize(rgb, (540, 960), interpolation=cv2.INTER_AREA))
        m = np.asarray(remove(small, session=sess, only_mask=True)).astype(np.float32) / 255
        m = cv2.resize(m, (1080, 1920), interpolation=cv2.INTER_CUBIC)
        m = np.clip((m - 0.08) / 0.84, 0, 1)                       # borda firme (sem halo da parede)
        if prev is not None:
            m = 0.65 * m + 0.35 * prev                             # sem tremor de borda entre quadros
        prev = m
        a = cv2.GaussianBlur(m, (0, 0), 1.2)
        a8 = (np.clip(a, 0, 1) * 255).astype(np.uint8)
        rgba = np.dstack([bgr, a8])
        rgba[a8 == 0, :3] = 0
        cv2.imwrite(os.path.join(d, f'f{i:04d}.png'), rgba, [cv2.IMWRITE_PNG_COMPRESSION, 6])
    print('ok', key, n, 'quadros', flush=True)


if __name__ == '__main__':
    from rembg import new_session
    sess = new_session('isnet-general-use')
    for k in (sys.argv[1:] or ['Z01a', 'Z01b', 'Z01c']):
        run(k, sess)
    sys.path.insert(0, HERE)
