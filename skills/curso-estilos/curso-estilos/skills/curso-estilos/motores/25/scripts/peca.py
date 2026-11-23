"""Mapa -> cenario de manga: a peca "O Vao" (muda, 31 s, 1080x1920).

Um plano continuo que comeca no MAPA (vista de cima da avenida), desce ate a horda andando para o vao do museu,
vira PAGINA DE MANGA (o quadro de cima sangra, os outros entram um a um, todos se mexendo),
o painel do teto cresce ate virar tela cheia de novo e a camera sobe ate o mapa: o fim encaixa no comeco (loop).

Tudo e o motor (OSM + relevo -> traco e reticula em three.js), sem IA, sem texto.
Precisa de: pip install -r requirements.txt, npm install (na pasta do motor) e FFmpeg no PATH.

python scripts/peca.py prancha        -> quadros-chave baratos para conferir enquadramento (_camadas/prancha)
python scripts/peca.py render         -> renderiza as camadas (use DEMO_CPU=1 para render por software)
python scripts/peca.py montar         -> compoe a pagina e gera saida/peca_1080.mp4 e saida/peca_celular.mp4

Para outro lugar: troque CENA e EIXO, reescreva as chaves de camera (S1, S3, SB, SD) e tire "zumbi=1" do Q
(a horda e o museu de render/zumbi.js sao especificos desta cena).
"""
import sys, json, subprocess, pathlib
import numpy as np
from scipy.interpolate import CubicSpline, PchipInterpolator
from PIL import Image, ImageDraw

BASE = pathlib.Path(__file__).resolve().parent.parent
L = BASE / "_camadas"; L.mkdir(exist_ok=True)
W, H, FPS, DUR = 1080, 1920, 12, 31.0           # 12 desenhos/s (anime "em dois"), entregue a 24 fps
CENA = "paulista"                                # cena/<CENA>.json (gerada por scripts/baixar_dados.py)
EIXO = "Avenida%20Paulista"                      # nome da rua principal no OSM (com %20 no lugar de espaco)
Q = f"eixo={EIXO}&zumbi=1&skyk=0.55&skyy=0.62&az=250&el=14"
TOFF = 8.0                                       # a horda já está andando quando a peça começa


def spline(keys):
    """keys = [(t, pos3, look3, fov, shift)] -> função t -> dict"""
    ts = np.array([k[0] for k in keys])
    P = PchipInterpolator(ts, np.array([k[1] for k in keys], float))      # sem overshoot (não atravessa prédio)
    Lk = PchipInterpolator(ts, np.array([k[2] for k in keys], float))
    F = PchipInterpolator(ts, np.array([[k[3], k[4]] for k in keys], float))
    def f(t):
        t = min(max(t, ts[0]), ts[-1]); fv, sh = F(t)
        return {"f": "av", "pos": P(t).tolist(), "look": Lk(t).tolist(), "fov": float(fv), "shift": float(sh)}
    return f


TOPO = ((-70, 18, 430), (-66, 21, 0), 50, 0.0)
# S1: mapa -> desce -> voa pela avenida -> encosta no vão (continua dentro do painel A até 17,5 s)
S1 = spline([(0.0, *TOPO[:2], TOPO[2], 0.0),
             (3.2, (-175, 14, 230), (-50, 24, 0), 52, 0.0),
             (6.2, (-230, 22, 95), (-50, 24, 4), 56, 0.0),
             (9.0, (-150, 42, 44), (0, 10, 4), 58, -0.2),
             (17.5, (-105, 46, 24), (0, 8, 4), 56, -0.25)])
# S3: no teto do MASP olhando a horda (painel C) -> recua por cima dos sobreviventes -> sobe até o mapa (= quadro 0)
S3 = spline([(10.8, (-14, 14.5, 17.4), (2, 27, 0), 70, 0.0),
             (17.6, (-10, 15.5, 17.6), (6, 30, 0), 70, 0.0),
             (21.5, (-30, 48, 42), (0, 4, 10), 62, 0.0),
             (25.5, (-120, 30, 210), (-50, 22, 0), 54, 0.0),
             (31.0, *TOPO[:2], TOPO[2], 0.0)])
# B: escada vista de baixo, tilt subindo pela corda
SB = spline([(9.8, (-2, 33, 1.5), (6, 17, 5), 66, 0.0), (17.5, (1, 30, 1.4), (6, 17, 14), 70, 0.0)])
# D: faixa larga do outro lado da avenida: horda inteira, o vão e o teto contra o céu
SD = spline([(11.8, (-14, 100, 40), (-2, 0, 8), 28, 0.0), (18.5, (8, 100, 37), (2, 0, 8.5), 28, 0.0)])

# layout da página (polígonos). A sangra no topo e nas laterais; B/C com calha inclinada.
PA = [(0, 0), (1080, 0), (1080, 690), (0, 650)]
PB = [(36, 670), (528, 679), (500, 1372), (36, 1372)]
PC = [(552, 683), (1044, 692), (1044, 1372), (524, 1372)]
PD = [(36, 1394), (1044, 1394), (1044, 1700), (36, 1700)]
CAIXA_B = (36, 670, 528, 1372)                  # bbox de render de B e D
CAIXA_D = (36, 1394, 1044, 1700)

T_FECHA, T_B, T_C, T_D, T_ABRE, T_FIM = 9.0, 9.8, 10.8, 11.8, 17.0, 17.7


def frames(t0, t1):
    return [i for i in range(int(round(t0 * FPS)), int(round(t1 * FPS)) + 1)]


def fade(s):
    up = s["pos"][2]; s["fa"] = max(320.0, 1.5 * up); s["fb"] = max(620.0, 3.2 * up); return s


def specs(camada):
    out = specs0(camada)
    return [fade(s) for s in out]


def specs0(camada):
    out = []
    if camada == "s1":
        for i in frames(0, 17.5):
            t = i / FPS; s = S1(t); s.update(T=t + TOFF, zmin=22, limpa=30 if t > 7 else 0, ground=30, out=str(L / "s1" / f"{i:04d}.png")); out.append(s)
    elif camada == "s3":
        for i in frames(T_C, DUR):
            t = i / FPS; s = S3(t); s.update(T=t + TOFF, zmin=14, out=str(L / "s3" / f"{i:04d}.png")); out.append(s)
    elif camada == "b":
        for i in frames(T_B, T_ABRE + 0.8):
            t = i / FPS; s = SB(t); s.update(T=t + TOFF, zmin=11, limpa=14, out=str(L / "b" / f"{i:04d}.png")); out.append(s)
    elif camada == "d":
        for i in frames(T_D, T_ABRE + 0.8):
            t = i / FPS; s = SD(t); s.update(T=t + TOFF, zmin=30, limpa=30, out=str(L / "d" / f"{i:04d}.png")); out.append(s)
    return out


def roda(camada, sp, wh, extra="", ss=3):
    (L / camada).mkdir(exist_ok=True)
    f = L / f"{camada}_specs.json"; f.write_text(json.dumps(sp), encoding="utf8")
    w = int(wh.split("x")[0])
    q = f"{Q}&ss={ss}&out=1&lw={1.6:.3f}&cell={4.2:.3f}{extra}"
    subprocess.run(["node", str(BASE / "scripts" / "render.mjs"), "specs", str(f), wh, q, "--cena", CENA], check=True)


def prancha():
    pr = L / "prancha"; pr.mkdir(exist_ok=True)
    tt = {"s1": [0, 2, 4, 6, 8, 9.5, 14], "s3": [12, 17.7, 20, 23, 27, 31], "b": [10, 16], "d": [12, 17]}
    for cam, lst in tt.items():
        sp = [s for s in specs(cam) if any(abs(int(pathlib.Path(s["out"]).stem) / FPS - x) < 0.5 / FPS for x in lst)]
        for s in sp:
            s["out"] = str(pr / f"{cam}_{pathlib.Path(s['out']).stem}.png")
        wh = {"s1": "1080x1920", "s3": "1080x1920", "b": f"{CAIXA_B[2]-CAIXA_B[0]}x{CAIXA_B[3]-CAIXA_B[1]}", "d": f"{CAIXA_D[2]-CAIXA_D[0]}x{CAIXA_D[3]-CAIXA_D[1]}"}[cam]
        roda("prancha", sp, wh, ss=2)


def render():
    for cam in sys.argv[2:] or ["s1", "s3", "b", "d"]:
        wh = {"s1": "1080x1920", "s3": "1080x1920", "b": f"{CAIXA_B[2]-CAIXA_B[0]}x{CAIXA_B[3]-CAIXA_B[1]}", "d": f"{CAIXA_D[2]-CAIXA_D[0]}x{CAIXA_D[3]-CAIXA_D[1]}"}[cam]
        roda(cam, specs(cam), wh)


# ---------------- montagem ----------------
def ease(x):
    x = min(max(x, 0.0), 1.0); return 1 - (1 - x) ** 3


def lerp_poly(a, b, k):
    return [(pa[0] + (pb[0] - pa[0]) * k, pa[1] + (pb[1] - pa[1]) * k) for pa, pb in zip(a, b)]


def mascara(poly, ss=4):
    m = Image.new("L", (W * ss, H * ss), 0)
    ImageDraw.Draw(m).polygon([(x * ss, y * ss) for x, y in poly], fill=255)
    return np.asarray(m.resize((W, H), Image.BOX)).astype(np.float32) / 255


def borda(img, poly, larg=6):
    """contorno preto do painel desenhado em 4x e reduzido (sem serrilhado)"""
    ss = 4; m = Image.new("L", (W * ss, H * ss), 0); d = ImageDraw.Draw(m)
    pts = [(x * ss, y * ss) for x, y in poly]
    d.line(pts + [pts[0]], fill=255, width=larg * ss, joint="curve")
    a = np.asarray(m.resize((W, H), Image.BOX)).astype(np.float32) / 255
    return img * (1 - a)


def carrega(cam, i):
    f = L / cam / f"{i:04d}.png"
    return np.asarray(Image.open(f).convert("L")).astype(np.float32) / 255 if f.exists() else None


def colado(cam, i, caixa):
    a = carrega(cam, i); full = np.ones((H, W), np.float32)
    if a is not None:
        x0, y0, x1, y1 = caixa; full[y0:y1, x0:x1] = a[: y1 - y0, : x1 - x0]
    return full


def entra(poly, k):
    """painel entra como cortina: o polígono cresce a partir da borda de cima"""
    ys = [p[1] for p in poly]; y0 = min(ys); y1 = max(ys)
    yc = y0 + (y1 - y0) * ease(k)
    return [(x, min(y, yc)) for x, y in poly]


FULL = [(0, 0), (1080, 0), (1080, 1920), (0, 1920)]


def quadro(i):
    t = i / FPS
    if t < T_FECHA:
        return carrega("s1", i)
    if t >= T_FIM:
        return carrega("s3", i)
    pg = np.ones((H, W), np.float32)
    # A: a tela cheia do S1 fecha até o painel de cima (sangra)
    ka = ease((t - T_FECHA) / 0.6)
    pa = lerp_poly(FULL, PA, ka)
    pg = pg * (1 - mascara(pa)) + carrega("s1", min(i, int(17.5 * FPS))) * mascara(pa)
    if ka > 0.98:
        pg = borda(pg, PA)
    for cam, poly, t0, caixa in (("b", PB, T_B, CAIXA_B), ("d", PD, T_D, CAIXA_D)):
        if t >= t0:
            p = entra(poly, (t - t0) / 0.45); m = mascara(p)
            pg = pg * (1 - m) + colado(cam, i, caixa) * m; pg = borda(pg, p)
    if t >= T_C:
        k = ease((t - T_ABRE) / (T_FIM - T_ABRE)) if t >= T_ABRE else 0.0
        p = lerp_poly(entra(PC, (t - T_C) / 0.45), FULL, k); m = mascara(p)
        pg = pg * (1 - m) + carrega("s3", i) * m
        if k < 0.97:
            pg = borda(pg, p)
    return pg


def montar():
    out = BASE / "_q"; out.mkdir(exist_ok=True)
    n = int(DUR * FPS) + 1
    for i in range(n):
        q = quadro(i)
        Image.fromarray((np.clip(q, 0, 1) * 255).astype(np.uint8)).save(out / f"{i:04d}.png")
    (BASE / "saida").mkdir(exist_ok=True)
    nome = BASE / "saida" / "peca_1080.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", str(out / "%04d.png"),
                    "-vf", "fps=24,format=yuv420p", "-c:v", "libx264", "-crf", "20", "-preset", "slow",
                    "-pix_fmt", "yuv420p", "-color_range", "tv", "-movflags", "+faststart", "-an", str(nome)], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(nome), "-vf", "scale=720:1280:flags=area,format=yuv420p",
                    "-c:v", "libx264", "-crf", "24", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an",
                    str(BASE / "saida" / "peca_celular.mp4")], check=True)
    print("ok", nome)


if __name__ == "__main__":
    {"prancha": prancha, "render": render, "montar": montar}[sys.argv[1]]()
