"""Céu pintado (estilo fundo de anime) para o skybox do Roblox: costura 5 imagens 1024x1024 para as emendas sumirem.

1) python gerar_ceu.py dia --prompts        mostra os prompts (tipos: dia, tempestade)
2) Gere as imagens 1024x1024 no gerador que você tiver (Z-Image no ComfyUI local, por exemplo; uma tarefa de GPU por vez)
   e salve em ceu/<tipo>/ como Ft.png, Rt.png, Bk.png, Lf.png (as 4 laterais, mesmo prompt, sementes diferentes) e Up.png (o topo).
3) python gerar_ceu.py dia                  grava sky_Ft/Rt/Bk/Lf/Up/Dn.png prontos para upload_image e para o objeto Sky
"""
import os, sys
from PIL import Image, ImageFilter
import numpy as np

R = os.path.dirname(os.path.abspath(__file__)); os.chdir(R)
args = [a for a in sys.argv[1:] if not a.startswith("--")]
TIPO = args[0] if args else "dia"
PROMPT = {
 "dia": ("anime background art painting of a bright summer sky, enormous fluffy white cumulus clouds towering, vivid cerulean blue gradient, "
         "soft golden sunlight glowing through cloud edges, small birds far away, pale haze near the bottom edge, no ground, no buildings, no text, "
         "lush hand-painted brush strokes, cinematic, very detailed"),
 "tempestade": ("anime background art painting of an ominous sky, swirling dark purple and crimson storm clouds, glowing orange fire light breaking through, "
         "embers floating, dramatic god rays, pale haze near the bottom edge, no ground, no buildings, no text, lush hand-painted brush strokes, cinematic, very detailed"),
}[TIPO]
CIMA = {
 "dia": "anime background painting looking straight up into a clear bright blue sky with a few soft wispy white clouds, smooth, no text",
 "tempestade": "anime background painting looking straight up into a dark purple and crimson storm sky, swirling clouds, faint orange glow, no text",
}[TIPO]
lados = ["Ft", "Rt", "Bk", "Lf"]
if "--prompts" in sys.argv:
    print("LATERAIS (Ft, Rt, Bk, Lf; 1024x1024; sementes diferentes):\n" + PROMPT + "\n\nTOPO (Up; 1024x1024):\n" + CIMA); sys.exit()
OUT = TIPO
falta = [n for n in lados + ["Up"] if not os.path.exists(f"{OUT}/{n}.png")]
if falta: raise SystemExit(f"faltam em ceu/{OUT}/: " + ", ".join(f + ".png" for f in falta) + "  (rode com --prompts para ver os prompts)")

# costura: as bordas laterais de todas as faces viram o mesmo perfil vertical P(y); o topo vira a cor média do Up
A = {n: np.asarray(Image.open(f"{OUT}/{n}.png").convert("RGB").resize((1024, 1024)), dtype=np.float32) for n in lados + ["Up"]}
H = W = 1024; faixa = int(W * 0.16)
P = np.mean([np.concatenate([A[n][:, :faixa], A[n][:, -faixa:]], axis=1).mean(axis=1) for n in lados], axis=0)  # (H,3)
P = np.asarray(Image.fromarray(np.clip(P[:, None, :].repeat(8, 1), 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(20)), dtype=np.float32)[:, 0, :]
topo = A["Up"].mean(axis=(0, 1))
x = np.arange(W) / (W - 1)
def s(t): t = np.clip(t, 0, 1); return t * t * (3 - 2 * t)
wl = 1 - s(x / 0.16); wr = s((x - 0.84) / 0.16); wx = np.maximum(wl, wr)[None, :, None]
y = np.arange(H) / (H - 1); wt = (1 - s(y / 0.14))[:, None, None]
for n in lados:
    img = A[n] * (1 - wx) + P[:, None, :] * wx
    img = img * (1 - wt) + topo[None, None, :] * wt
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(f"{OUT}/sky_{n}.png")
# Up: as bordas viram a cor do topo das laterais; Dn: cor do pé das laterais
up = A["Up"]; d = np.minimum.outer(np.minimum(y, 1 - y), np.minimum(x, 1 - x))[:, :, None]
wu = 1 - s(d / 0.18)
up = up * (1 - wu) + topo[None, None, :] * wu
Image.fromarray(np.clip(up, 0, 255).astype(np.uint8)).save(f"{OUT}/sky_Up.png")
Image.new("RGB", (512, 512), tuple(int(v) for v in P[-1])).save(f"{OUT}/sky_Dn.png")
print("ok", OUT)
