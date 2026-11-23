"""Brutos gravados em câmera lenta (grava2.sh) -> planos em tempo real, em pé, 1080x1920.

Rode na pasta onde estão os bruto_*.mp4 e o planos.json:
  python montar.py deitados [planos.json]   bruto_NOME.mp4 -> planos_up/NOME.mp4 (acelera, gira, recorta 9:16)
  python montar.py varre                    procura janela invasora / quadro preto / quadro branco em planos_up/
  python montar.py amplia                   opcional, só para gravação pequena; pede a variável REALESRGAN_PATH
O planos.json diz a duração de cada plano (modelo: planos_ep01.json).
"""
import glob, json, os, shutil, subprocess, sys
from PIL import Image


def sh(c): subprocess.run(c, check=True)


def conf(arq="planos.json"):
    c = json.load(open(arq, encoding="utf8"))
    return c.get("slow", 3), c.get("recorte", "728:1294:12:42"), c["planos"]


def deitados(arq="planos.json"):
    slow, recorte, dur = conf(arq)
    os.makedirs("planos_up", exist_ok=True)
    for f in sorted(glob.glob("bruto_*.mp4")):
        n = f[6:-4]; out = f"planos_up/{n}.mp4"
        if n not in dur: print("sem duração no planos.json, pulei:", n); continue
        if os.path.exists(out) and os.path.getmtime(out) > os.path.getmtime(f): continue
        # cada plano: 0,6 s parado + movimento + 0,6 s parado (tempo real); ~0,3 s de atraso do início da captura
        sh(["ffmpeg", "-v", "error", "-i", f, "-vf", f"setpts=PTS/{slow},fps=30,transpose=2,crop={recorte},scale=1080:1920:flags=lanczos",
            "-ss", "0.3", "-t", f"{dur[n] + 1.2:.2f}", "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", "-an", "-y", out])
        print("plano", n, flush=True)


def varre(pasta="planos_up"):
    """Janela por cima do Studio aparece como bloco cinza-escuro, branco ou preto. Lista os segundos suspeitos de cada plano."""
    ruins = {}
    for f in sorted(glob.glob(pasta + "/*.mp4")):
        n = os.path.basename(f)[:-4]; tmp = "tmp_scan"; shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
        sh(["ffmpeg", "-v", "error", "-i", f, "-vf", "fps=6,scale=90:160", tmp + "/%04d.png"])
        bad = []
        for i, p in enumerate(sorted(glob.glob(tmp + "/*.png"))):
            px = list(Image.open(p).convert("RGB").getdata()); tot = len(px)
            cinza = sum(1 for r, g, b in px if 15 <= r <= 60 and abs(r - g) < 4 and abs(g - b) < 4)
            branco = sum(1 for r, g, b in px if r > 250 and g > 250 and b > 250)
            preto = sum(1 for r, g, b in px if r < 6 and g < 6 and b < 6)
            if cinza / tot > 0.25 or branco / tot > 0.25 or preto / tot > 0.5: bad.append(round(i / 6, 2))
        shutil.rmtree(tmp)
        if bad: ruins[n] = bad
    print("JANELA/QUADRO SUSPEITO:", json.dumps(ruins) if ruins else "nenhum", flush=True)
    return ruins


def amplia():
    """Só se você gravou pequeno. Usa a GPU: uma tarefa de GPU por vez (feche o que mais estiver usando)."""
    esr = os.environ.get("REALESRGAN_PATH")
    if not esr or not os.path.exists(esr): raise SystemExit("defina REALESRGAN_PATH com o caminho do realesrgan-ncnn-vulkan")
    os.makedirs("planos_4x", exist_ok=True)
    for f in sorted(glob.glob("planos_up/*.mp4")):
        n = os.path.basename(f)[:-4]; out = f"planos_4x/{n}.mp4"
        tmp = "tmp_fr"; shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp + "/in"); os.makedirs(tmp + "/out")
        sh(["ffmpeg", "-v", "error", "-i", f, "-vf", "scale=540:960", "-q:v", "2", tmp + "/in/%05d.png"])
        sh([esr, "-i", tmp + "/in", "-o", tmp + "/out", "-n", "realesr-general-x4v3", "-s", "4", "-f", "png"])
        sh(["ffmpeg", "-v", "error", "-framerate", "30", "-i", tmp + "/out/%05d.png", "-vf", "scale=1080:1920:flags=lanczos", "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", "-y", out])
        shutil.rmtree(tmp); print("ampliado", n, flush=True)


if __name__ == "__main__":
    etapa = sys.argv[1] if len(sys.argv) > 1 else ""
    if etapa == "deitados": deitados(*sys.argv[2:3])
    elif etapa == "varre": varre(*sys.argv[2:3])
    elif etapa == "amplia": amplia()
    else: print(__doc__)
