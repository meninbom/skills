# Adesivo de pixel 12x12 (uma cor por ícone + borda branca recortada) a partir de uma grade em texto.
#
#   pip install numpy pillow scipy
#   python adesivo_pixel.py ../template/icones.json saida_pasta/        -> gera um PNG por ícone do JSON
#
# Para criar um ícone novo, adicione no icones.json uma grade de 12 linhas x 12 caracteres
# ('#' = pixel aceso, '.' = vazio) e a cor dele em "_cor" (só os tokens: #FF4FA3, #3157FF, #9ADB2A, #1B1631).
# No template (index.html) a mesma grade vira SVG direto; este script serve para quem monta no CapCut/AE.
import json, os, sys
import numpy as np
from adesivo_foto import borda_branca

CEL = 40  # px por pixel (ícone de 480 px + borda)

if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    d = json.load(open(src, encoding='utf-8'))
    for nome, linhas in d.items():
        if nome.startswith('_'):
            continue
        g = np.array([[c == '#' for c in l] for l in linhas])
        assert g.shape == (12, 12), nome
        m = np.kron(g, np.ones((CEL, CEL), bool))
        cor = d['_cor'][nome].lstrip('#')
        rgb = np.zeros(m.shape + (3,), np.uint8); rgb[m] = [int(cor[i:i + 2], 16) for i in (0, 2, 4)]
        borda_branca(rgb, m, borda=22).save(os.path.join(out, nome + '.png'))
        print('ok', nome)
