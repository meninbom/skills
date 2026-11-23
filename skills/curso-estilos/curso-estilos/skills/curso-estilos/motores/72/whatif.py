"""Corte 3D "e se": comandos do motor (Blender em segundo plano + Pillow + FFmpeg).

  python whatif.py demo                      -> saida/demo.mp4 (3 s, 540x960, 12 qps, mudo)
  python whatif.py still 9.6 [saida.png]     -> um quadro no tempo 9,6 s (teste de look)
  python whatif.py render                    -> todos os quadros em frames/ (impares, depois pares; pula o que ja existe)
  python whatif.py montar                    -> saida/final_1080.mp4 + saida/final_celular.mp4 + saida/folha.jpg

Variaveis: BLENDER_PATH (caminho do executavel do Blender, se nao estiver no PATH), FFMPEG_PATH,
W / H / SPP (largura, altura e amostras do render; padrao 540 x 960 e 12), THREADS (limite de nucleos).
O render e sempre Cycles em CPU.
"""
import glob, json, os, shutil, subprocess, sys, time

AQUI = os.path.dirname(os.path.abspath(__file__))
RUN = os.path.join(AQUI, "run")
SAIDA = os.path.join(AQUI, "saida")
FPS = 24
FF = os.environ.get("FFMPEG_PATH") or "ffmpeg"


def achar_blender():
    env = os.environ.get("BLENDER_PATH")
    if env:
        if os.path.isfile(env):
            return env
        sys.exit(f"BLENDER_PATH aponta para um arquivo que nao existe: {env}")
    no_path = shutil.which("blender")
    if no_path:
        return no_path
    c = []
    if sys.platform == "win32":
        for base in (os.environ.get("PROGRAMFILES"), os.environ.get("PROGRAMFILES(X86)")):
            if base:
                c += sorted(glob.glob(os.path.join(base, "Blender Foundation", "Blender*", "blender.exe")), reverse=True)
    elif sys.platform == "darwin":
        c += ["/Applications/Blender.app/Contents/MacOS/Blender"]
    else:
        c += ["/usr/bin/blender", "/usr/local/bin/blender", "/snap/bin/blender"]
    for p in c:
        if os.path.isfile(p):
            return p
    sys.exit("Nao achei o Blender. Instale (blender.org, gratis) ou defina BLENDER_PATH com o caminho do executavel.")


def blender(*args):
    """roda o cena.py no Blender sem interface e mostra so as linhas de progresso"""
    cmd = [achar_blender(), "-b", "--factory-startup", "-P", os.path.join(RUN, "cena.py"), "--", *map(str, args)]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="ignore")
    erro = False
    for ln in p.stdout:
        if ln.startswith("@@") or "Error" in ln or "Traceback" in ln or erro:
            erro = erro or "Traceback" in ln
            print(ln.rstrip(), flush=True)
    if p.wait() != 0:
        sys.exit("O Blender saiu com erro.")


def ffmpeg(*args):
    try:
        subprocess.run([FF, "-v", "error", "-y", *map(str, args)], check=True)
    except FileNotFoundError:
        sys.exit("Nao achei o FFmpeg. Instale e ponha no PATH, ou defina FFMPEG_PATH.")


def legenda(src, dst, force=False):
    subprocess.run([sys.executable, os.path.join(RUN, "legenda.py"), src, dst] + (["--force"] if force else []), check=True)


def tamanho():
    return int(os.environ.get("W", 540)), int(os.environ.get("H", 960)), int(os.environ.get("SPP", 12))


def demo():
    """3 s do trecho em que o poco desce no barro (6,0 a 9,0 s), a 12 quadros por segundo, com poucas amostras."""
    t0 = time.time()
    w, h = 540, 960
    spp = int(os.environ.get("DEMO_SPP", 4))
    fr = os.path.join(SAIDA, "demo_frames"); leg = os.path.join(SAIDA, "demo_leg"); seq = os.path.join(SAIDA, "demo_seq")
    for d in (leg, seq):
        shutil.rmtree(d, ignore_errors=True)
    os.makedirs(seq, exist_ok=True)
    f0 = int(6.0 * FPS) + 1
    blender("video", fr, w, h, spp, f0, f0 + 3 * FPS - 2, 2)          # 36 quadros (passo 2 = 12 qps)
    tr = time.time() - t0
    legenda(fr, leg, force=True)
    for i, f in enumerate(sorted(os.listdir(leg))):
        shutil.copy2(os.path.join(leg, f), os.path.join(seq, f"q_{i:04d}.png"))
    out = os.path.join(SAIDA, "demo.mp4")
    ffmpeg("-framerate", 12, "-i", os.path.join(seq, "q_%04d.png"), "-vf", "format=yuv420p", "-c:v", "libx264", "-crf", 20,
           "-preset", "slow", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", out)
    print(f"pronto: {out}  (render {tr:.0f} s, total {time.time() - t0:.0f} s)")


def still():
    t = float(sys.argv[2]) if len(sys.argv) > 2 else 9.6
    out = os.path.abspath(sys.argv[3]) if len(sys.argv) > 3 else os.path.join(SAIDA, "testes", f"t_{t:05.2f}.png")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    w, h, spp = tamanho()
    blender("still", t, out, w, h, spp)


def render():
    """duas passadas: impares primeiro (o video inteiro a 12 qps para conferir cedo), depois pares"""
    w, h, spp = tamanho()
    n = int(json.load(open(os.path.join(RUN, "tempos.json"), encoding="utf8"))["dur"] * FPS)
    fr = os.path.join(AQUI, "frames")
    t0 = time.time()
    blender("video", fr, w, h, spp, 1, n, 2)
    blender("video", fr, w, h, spp, 2, n, 2)
    print(f"render pronto em {time.time() - t0:.0f} s: {fr}")


def montar():
    """amplia para 1080x1920 + grade de cor (sombra fria, luz quente, vinheta) -> rotulos -> grao + encode"""
    fr = os.path.join(AQUI, "frames"); up = os.path.join(AQUI, "frames_up"); leg = os.path.join(AQUI, "frames_leg")
    os.makedirs(up, exist_ok=True); os.makedirs(SAIDA, exist_ok=True)
    ffmpeg("-start_number", 1, "-framerate", FPS, "-i", os.path.join(fr, "f_%05d.png"),
           "-vf", "scale=1080:1920:flags=lanczos,unsharp=5:5:0.45,colorbalance=rs=-0.03:bs=0.035:rh=0.04:gh=0.01:bh=-0.03,"
                  "eq=contrast=1.04:saturation=1.06,vignette=PI/5.5",
           "-start_number", 1, os.path.join(up, "f_%05d.png"))
    legenda(up, leg, force="--force" in sys.argv)
    final = os.path.join(SAIDA, "final_1080.mp4"); cel = os.path.join(SAIDA, "final_celular.mp4")
    ffmpeg("-start_number", 1, "-framerate", FPS, "-i", os.path.join(leg, "f_%05d.png"), "-vf", "noise=alls=4:allf=t",
           "-c:v", "libx264", "-crf", 21, "-maxrate", "24M", "-bufsize", "48M", "-preset", "slow", "-pix_fmt", "yuv420p",
           "-profile:v", "high", "-an", "-movflags", "+faststart", final)
    ffmpeg("-i", final, "-vf", "scale=720:1280:flags=lanczos", "-c:v", "libx264", "-crf", 21, "-preset", "slow",
           "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", cel)
    ffmpeg("-i", final, "-vf", "fps=1/3,scale=360:640,tile=9x1", "-frames:v", 1, os.path.join(SAIDA, "folha.jpg"))
    print("pronto:", final, cel)


if __name__ == "__main__":
    modos = {"demo": demo, "still": still, "render": render, "montar": montar}
    if len(sys.argv) < 2 or sys.argv[1] not in modos:
        sys.exit(__doc__)
    modos[sys.argv[1]]()
