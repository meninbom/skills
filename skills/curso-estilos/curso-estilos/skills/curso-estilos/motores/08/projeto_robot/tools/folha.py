"""Folha de contato: 1 quadro a cada 1/fps s (padrao 2 fps), em grade, com o tempo em cima de cada quadro.
uso: python tools/folha.py VIDEO SAIDA.jpg [--fps 2] [--larg 216] [--cols 13] [--de 0] [--ate 99]
"""
import argparse, subprocess, numpy as np, cv2


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('video'); ap.add_argument('saida')
    ap.add_argument('--fps', type=float, default=2.0); ap.add_argument('--larg', type=int, default=216)
    ap.add_argument('--cols', type=int, default=13); ap.add_argument('--de', type=float, default=0.0); ap.add_argument('--ate', type=float, default=1e9)
    a = ap.parse_args()
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', a.video],
                               capture_output=True, text=True).stdout.strip())
    w = a.larg; h = int(round(w * 16 / 9))
    ts = [i / a.fps for i in range(int(dur * a.fps) + 1) if a.de - 1e-6 <= i / a.fps <= min(a.ate, dur - 0.02)]
    tiles = []
    for t in ts:
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', a.video, '-frames:v', '1', '-vf', f'scale={w}:{h}',
                              '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True).stdout
        img = np.frombuffer(raw, np.uint8)[:w * h * 3].reshape(h, w, 3) if len(raw) >= w * h * 3 else np.zeros((h, w, 3), np.uint8)
        lab = np.full((22, w, 3), 18, np.uint8)
        cv2.putText(lab, f'{t:.1f}s', (4, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (235, 235, 235), 1, cv2.LINE_AA)
        tiles.append(np.vstack([lab, img]))
    while len(tiles) % a.cols:
        tiles.append(np.full_like(tiles[0], 18))
    rows = [np.hstack(tiles[i:i + a.cols]) for i in range(0, len(tiles), a.cols)]
    cv2.imwrite(a.saida, np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 88])
    print('ok', a.saida, len(ts), 'quadros')


if __name__ == '__main__':
    main()
