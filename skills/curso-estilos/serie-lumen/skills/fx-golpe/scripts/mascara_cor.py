"""mascara_cor.py: máscara por cor (número de dano, legenda, texto do HUD) pro efeito passar ATRÁS do texto.

Gera um PNG por quadro do trecho (branco = fica NA FRENTE do efeito), no formato que o aplicar_fx.py lê em "matte".

uso:
    python mascara_cor.py VIDEO PASTA_SAIDA --ini 13.9 --fim 17.9 [--branco] [--cor 255,200,40 --tol 50]
                          [--faixa-y 1250 1920] [--engrossa 13]

- --branco: pega texto branco/neutro (claro e sem cor).
- --cor R,G,B (+ --tol): pega uma cor (ex.: o amarelo da legenda). Dá pra usar --branco e --cor juntos.
- --faixa-y A B: só procura entre as linhas A e B (px). Evita pegar céu, neve ou roupa clara.
- --engrossa N: engorda a máscara N px (cobre o contorno do texto).
Depois, no golpes.json:  "matte": {"dir": "PASTA_SAIDA", "ini": 13.9}   (o mesmo --ini daqui)
Não apaga nada: se a pasta já tiver PNG, para.
"""
import argparse, glob, json, os, subprocess, sys
import numpy as np, cv2


def main():
    for st in (sys.stdout, sys.stderr):   # acento certo no Git Bash
        try: st.reconfigure(encoding='utf-8')
        except Exception: pass
    ap = argparse.ArgumentParser()
    ap.add_argument('video'); ap.add_argument('saida')
    ap.add_argument('--ini', type=float, required=True); ap.add_argument('--fim', type=float, required=True)
    ap.add_argument('--branco', action='store_true')
    ap.add_argument('--cor'); ap.add_argument('--tol', type=float, default=50)
    ap.add_argument('--faixa-y', type=int, nargs=2)
    ap.add_argument('--engrossa', type=int, default=13)
    a = ap.parse_args()
    if not a.branco and not a.cor:
        raise SystemExit('diga o que vira máscara: --branco e/ou --cor R,G,B')
    if glob.glob(os.path.join(a.saida, '*.png')):
        raise SystemExit(f'{a.saida} já tem PNG. Use uma pasta nova.')
    os.makedirs(a.saida, exist_ok=True)
    j = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0',
                                            '-show_entries', 'stream=width,height', '-of', 'json', a.video]))
    W, H = j['streams'][0]['width'], j['streams'][0]['height']
    alvo = np.array([int(x) for x in a.cor.split(',')], np.int16) if a.cor else None
    k_dil = np.ones((max(1, a.engrossa), max(1, a.engrossa)), np.uint8)
    dec = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', str(a.ini), '-to', str(a.fim), '-i', a.video,
                            '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    n = 0
    while True:
        b = dec.stdout.read(W * H * 3)
        if len(b) < W * H * 3: break
        f = np.frombuffer(b, np.uint8).reshape(H, W, 3).astype(np.int16)
        m = np.zeros((H, W), bool)
        if a.branco:
            mx, mn = f.max(2), f.min(2); m |= (mn > 225) & (mx - mn < 25)
        if alvo is not None:
            m |= np.abs(f - alvo).max(2) < a.tol
        if a.faixa_y:
            fora = np.ones(H, bool); fora[a.faixa_y[0]:a.faixa_y[1]] = False; m[fora] = False
        m8 = cv2.dilate(m.astype(np.uint8) * 255, k_dil)
        m8 = cv2.GaussianBlur(m8, (0, 0), 1.5)
        cv2.imwrite(os.path.join(a.saida, f'm_{n:04d}.png'), m8); n += 1
    dec.wait()
    print(f'ok {n} máscaras em {a.saida}')
    print(f'golpes.json: "matte": {{"dir": "{a.saida.replace(os.sep, "/")}", "ini": {a.ini}}}')


if __name__ == '__main__':
    main()
