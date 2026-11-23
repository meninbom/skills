# Laco do H3 para o robot: h3.py -> h3/<id><TAG>_raw.mp4; upscale_clip.sh em 1120x1920 (7:12, nao achata) + corte do centro
# 1080x1920 -> h3/<id><TAG>.mp4 (o mesmo corte que o Remotion/tratar_clipes faz). Progresso em h3/progresso.txt.
# uso: python -u h3_loop.py JOBS.json [TAG]   (pula o que ja existe; um job pode trazer prompt_file/seed proprios)
import json, os, subprocess, sys, time, tempfile, shutil

OUT = 'h3'
PROG = OUT + '/progresso.txt'
os.makedirs(OUT, exist_ok=True)
jobs = json.load(open(sys.argv[1], encoding='utf8'))
tag = sys.argv[2] if len(sys.argv) > 2 else ''


def log(msg):
    line = time.strftime('%H:%M:%S ') + msg
    print(line, flush=True)
    with open(PROG, 'a', encoding='utf8') as f:
        f.write(line + '\n')


def upscale(raw, fin):
    td = tempfile.mkdtemp()
    try:
        up = td + '/up.mp4'
        r = subprocess.run(['bash', 'comfy/upscale_clip.sh', raw, up, '1120', '1920'], capture_output=True, text=True)
        if r.returncode != 0 or not os.path.exists(up):
            return 'upscale: ' + (r.stdout + r.stderr).strip()[-800:]
        r = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', up, '-vf', 'crop=1080:1920:20:0', '-c:v', 'libx264', '-preset', 'slow',
                            '-crf', '16', '-pix_fmt', 'yuv420p', '-c:a', 'copy', fin], capture_output=True, text=True)
        if r.returncode != 0 or not os.path.exists(fin):
            return 'corte: ' + (r.stdout + r.stderr).strip()[-800:]
        return None
    finally:
        shutil.rmtree(td, ignore_errors=True)


log(f'INICIO {len(jobs)} jobs tag="{tag}" ({sys.argv[1]})')
ok = 0
for i, j in enumerate(jobs, 1):
    jid = j['id']
    raw = f'{OUT}/{jid}{tag}_raw.mp4'
    fin = f'{OUT}/{jid}{tag}.mp4'
    try:
        if not os.path.exists(raw):
            log(f'[{i}/{len(jobs)}] {jid}{tag}: H3 seed={j.get("seed", 1)} prompt={os.path.basename(j["prompt_file"])}')
            t = time.time()
            r = subprocess.run(['python', 'comfy/h3.py', '--img', j['img'], '--prompt-file', j['prompt_file'], '--out', raw,
                                '--w', str(j.get('w', 448)), '--h', str(j.get('h', 768)), '--frames', str(j.get('frames', 124)),
                                '--seed', str(j.get('seed', 1))], capture_output=True, text=True)
            if r.returncode != 0 or not os.path.exists(raw):
                log(f'[{i}/{len(jobs)}] {jid}{tag}: ERRO H3 ' + (r.stdout + r.stderr).strip()[-800:].replace('\n', ' | '))
                continue
            log(f'[{i}/{len(jobs)}] {jid}{tag}: H3 ok {time.time() - t:.0f}s')
        if not os.path.exists(fin):
            t = time.time()
            err = upscale(raw, fin)
            if err:
                log(f'[{i}/{len(jobs)}] {jid}{tag}: ERRO {err}'.replace('\n', ' | '))
                continue
            log(f'[{i}/{len(jobs)}] {jid}{tag}: upscale ok {time.time() - t:.0f}s')
        ok += 1
        log(f'[{i}/{len(jobs)}] {jid}{tag}: PRONTO -> {fin}')
    except Exception as e:
        log(f'[{i}/{len(jobs)}] {jid}{tag}: EXCECAO {e!r}')
log(f'FIM {ok}/{len(jobs)} prontos')
