"""Depois da etapa de GPU: clipe cru do H3 -> clipe pronto para o Remotion.

Para cada job de robot/h3_jobs.json cujo robot/h3_out/<id>.mp4 exista:
 1. upscale Real-ESRGAN para 1120x1920 (mantem 7:12; o padrao 1080x1920 do script achataria 3,6%)
 2. LUT do plano (grade2 dos styleframes, tools/lut.py) + corte do centro 1080x1920 -> public/clips/<Zxx>.mp4 (24 fps, sem audio)
 3. audio do H3 (ambiente diegetico) -> public/audio/amb_<Zxx>.wav (48 kHz, mono), para o tools/mix.py
 4. Z01a tambem sai invertido (public/clips/Z01a_rev.mp4): cena 31, os olhos fecham e o ultimo quadro = quadro 0 (loop)
 5. --ecc: deriva da camera 'travada' (Z03, Z04, Z05: homografia fixa) entre o 1o e o ultimo quadro, em px do quadro final
Depois atualiza src/data/disponiveis.json (preparar.inventario).

uso: python tratar_clipes.py [ids...] [--ecc]
"""
import sys, os, json, subprocess, tempfile, numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.abspath(os.path.join(HERE, '..'))
ROBOT = os.path.abspath(os.path.join(PROJ, '..'))
PUB = os.path.join(PROJ, 'public')
UPSCALE = 'comfy/upscale_clip.sh'
TRAVADOS = {'Z03', 'Z04', 'Z05'}


def run(cmd):
    subprocess.run(cmd, check=True)


def ecc_drift(path):
    cap = cv2.VideoCapture(path)
    frames = []
    ok, f = cap.read()
    while ok:
        frames.append(cv2.cvtColor(cv2.resize(f, (270, 480)), cv2.COLOR_BGR2GRAY).astype(np.float32) / 255)
        ok, f = cap.read()
    a, b = frames[0], frames[-1]
    warp = np.eye(2, 3, dtype=np.float32)
    try:
        _, warp = cv2.findTransformECC(a, b, warp, cv2.MOTION_TRANSLATION, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6))
    except cv2.error:
        return None
    return float(np.hypot(warp[0, 2], warp[1, 2]) * 4)      # em px de 1080


def tratar(job, ecc=False):
    key = job['id'].replace('robot_', '')
    raw = job['saida']
    if not os.path.exists(raw):
        print('sem clipe ainda:', raw); return
    os.makedirs(os.path.join(PUB, 'clips'), exist_ok=True); os.makedirs(os.path.join(PUB, 'audio'), exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        up = os.path.join(td, 'up.mp4')
        run(['bash', UPSCALE, raw, up, '1120', '1920'])
        lut = os.path.join(PROJ, 'luts', f'{key}.cube').replace('\\', '/').replace(':', '\\:')
        vf = f"lut3d=file='{lut}':interp=tetrahedral,crop=1080:1920:20:0,fps=24"
        dst = os.path.join(PUB, 'clips', f'{key}.mp4')
        run(['ffmpeg', '-v', 'error', '-y', '-i', up, '-vf', vf, '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', dst])
        if key == 'Z01a':
            run(['ffmpeg', '-v', 'error', '-y', '-i', dst, '-vf', 'reverse', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14',
                 '-pix_fmt', 'yuv420p', os.path.join(PUB, 'clips', 'Z01a_rev.mp4')])
    r = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-vn', '-ac', '1', '-ar', '48000', os.path.join(PUB, 'audio', f'amb_{key}.wav')])
    msg = f'ok {key}' + ('' if r.returncode == 0 else ' (sem audio)')
    if ecc and key in TRAVADOS:
        d = ecc_drift(dst)
        msg += f' | deriva ECC {d:.1f} px' if d is not None else ' | ECC nao convergiu'
        if d is not None and d > 2.0:
            msg += ' -> homografia fixa NAO serve: plano B = still com push (ou rastrear por quadro)'
    print(msg, flush=True)


if __name__ == '__main__':
    jobs = json.load(open(os.path.join(ROBOT, 'h3_jobs.json'), encoding='utf-8'))
    ids = [a for a in sys.argv[1:] if not a.startswith('--')]
    for j in jobs:
        if not ids or j['id'].replace('robot_', '') in ids or j['id'] in ids:
            tratar(j, ecc='--ecc' in sys.argv)
    sys.path.insert(0, HERE)
    from preparar import inventario
    inventario()
