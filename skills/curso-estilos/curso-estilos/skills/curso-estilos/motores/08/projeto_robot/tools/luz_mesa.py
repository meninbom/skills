"""v3: mapa de luz da mesa do Z03 (faixas de sol da janela) para multiplicar a foto do Karel que CAI NA MESA.

A foto mora na mesma luz: onde a mesa esta na sombra da caixilharia, a foto escurece igual.
Quadro de referencia: Z03 em 3,2 s (maos quase fora). Capa, maquina de escrever e maos sao mascaradas e preenchidas
pela propria mesa (inpaint Telea), para a capa escura nao 'imprimir' na foto.
Saida: public/luz/z03.png (cinza, 1080x1920; 1,0 = faixa de sol, ~0,65 = sombra).

uso: python tools/luz_mesa.py
"""
import os, subprocess, numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.abspath(os.path.join(HERE, '..', 'public'))


def main():
    src = os.path.join(PUB, 'clips', 'Z03.mp4')
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', '3.2', '-i', src, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'],
                         capture_output=True, check=True).stdout
    img = np.frombuffer(raw, np.uint8).reshape(1920, 1080, 3)
    L = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    m = np.zeros((1920, 1080), np.uint8)
    # capa (quads.capa: x 258, y 566, w 560, rot -1,2; altura pelo aspecto do scan 2031x3290)
    w, h = 560, 560 * 3290 / 2031
    box = cv2.boxPoints(((258 + w / 2, 566 + h / 2), (w, h), -1.2)).astype(np.int32)
    cv2.fillPoly(m, [box], 255)
    cv2.fillPoly(m, [box + np.array([34, 30], np.int32)], 255)   # sombra dura da capa (direita/baixo)
    m[:260, 230:820] = 255           # maquina de escrever
    m[1560:, :] = 255                # maos / borda de baixo
    m[:, :92] = 255; m[:, 985:] = 255   # fora da tabua (chao escuro) nao entra no preenchimento
    m = cv2.dilate(m, np.ones((31, 31), np.uint8))
    # preenchimento por convolucao normalizada em varias escalas: so a propria mesa (tabua clara) alimenta o buraco
    val = ((m == 0) & (L > 60)).astype(np.float32)
    Li = np.full_like(L, float(np.median(L[val > 0])))
    for sg in (150, 70, 30, 12):           # do grosso para o fino: o fino sobrescreve onde tem mesa por perto
        num = cv2.GaussianBlur(L * val, (0, 0), sg); den = cv2.GaussianBlur(val, (0, 0), sg)
        Li = np.where(den > 0.08, num / np.maximum(den, 1e-4), Li)
    Li = np.where(val > 0, L, Li)
    Li = cv2.GaussianBlur(Li, (0, 0), 7)
    mesa = (m == 0) & (L > 60)
    ref = np.percentile(Li[mesa], 96)
    mapa = np.clip(Li / ref, 0.62, 1.0)
    os.makedirs(os.path.join(PUB, 'luz'), exist_ok=True)
    out = (mapa * 255).round().astype(np.uint8)
    cv2.imwrite(os.path.join(PUB, 'luz', 'z03.png'), cv2.cvtColor(out, cv2.COLOR_GRAY2BGR))
    print('ok public/luz/z03.png  ref', round(float(ref), 1), 'min', round(float(mapa.min()), 2))


if __name__ == '__main__':
    main()
