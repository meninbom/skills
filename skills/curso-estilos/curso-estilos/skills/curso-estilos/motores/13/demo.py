"""Mini-demo da parte em código do estilo 13 (montagem + edição), SEM o Roblox Studio.

Desenha por código dois "brutos" de mentira (blocos no lugar da cena do Studio), já deitados e em câmera lenta 3x
como sairiam do grava2.sh, e passa pelos scripts reais: gravacao/montar.py (acelera, gira, recorta 9:16) e
gravacao/editar.py (planos nos tempos da "voz", legenda de 1 palavra, HUD, etiqueta e cartões de voto).
Saída: saida/demo.mp4 (540x960, 30 qps, ~3 s, mudo). Uso: python demo.py
(DEMO_CPU=1 é aceito e não muda nada: aqui não há navegador nem GPU, só Pillow + FFmpeg.)
"""
import json, os, shutil, subprocess, sys, time
from PIL import Image, ImageDraw

R = os.path.dirname(os.path.abspath(__file__))
T = os.path.join(R, "saida", "trabalho")
t0 = time.time()
shutil.rmtree(T, ignore_errors=True); os.makedirs(T)
W, H = 752, 1336           # cena em pé; o bruto é essa cena deitada (1336x752)
SLOW, QPS = 3, 30
DUR = {"01_praca": 0.9, "02_cai": 0.9}


def cena(plano, t):
    """t = tempo real em s (0..~2,1). Placeholder: troque pela gravação do seu lugar no Studio."""
    noite = plano == "02_cai"
    im = Image.new("RGB", (W, H), (38, 34, 78) if noite else (120, 190, 250)); d = ImageDraw.Draw(im)
    for i in range(12):  # degradê do céu
        y = i * 60; k = i / 11
        cor = (38 + int(60 * k), 34 + int(30 * k), 78 + int(40 * k)) if noite else (120 + int(90 * k), 190 + int(40 * k), 250)
        d.rectangle([0, y, W, y + 60], fill=cor)
    for cx, cy, s in ((140, 210, 1.0), (520, 330, 1.3)):  # nuvens andando
        x = (cx + t * 40 * s) % (W + 200) - 100
        d.rounded_rectangle([x - 90 * s, cy - 30 * s, x + 90 * s, cy + 30 * s], 30, fill=(250, 250, 255) if not noite else (90, 80, 130))
    d.rectangle([0, 980, W, H], fill=(96, 176, 86) if not noite else (44, 84, 70))       # grama
    d.rectangle([0, 1090, W, 1170], fill=(150, 150, 160) if not noite else (70, 70, 96))  # rua
    zoom = 1 + 0.06 * min(1, t / 2)   # empurrão leve de câmera
    for x, larg, alt, cor in ((60, 210, 300, (236, 120, 96)), (300, 180, 240, (250, 206, 110)), (510, 200, 340, (120, 170, 236))):
        x = int((x - W / 2) * zoom + W / 2); a = int(alt * zoom); l = int(larg * zoom)
        d.rounded_rectangle([x, 980 - a, x + l, 980], 18, fill=cor)
        d.polygon([(x - 14, 980 - a), (x + l + 14, 980 - a), (x + l // 2, 980 - a - 90)], fill=(120, 60, 50))
        d.rounded_rectangle([x + l // 2 - 30, 980 - a + 50, x + l // 2 + 30, 980 - a + 120], 8, fill=(255, 190, 90) if noite else (180, 226, 255))
    # boneco de blocos balançando
    bx = 376 + int(10 * (1 if int(t * 4) % 2 else -1)); by = 1010
    d.rounded_rectangle([bx - 46, by - 100, bx + 46, by + 20], 12, fill=(70, 120, 220))      # tronco
    d.rounded_rectangle([bx - 46, by + 20, bx - 4, by + 120], 10, fill=(50, 60, 90)); d.rounded_rectangle([bx + 4, by + 20, bx + 46, by + 120], 10, fill=(50, 60, 90))
    d.rounded_rectangle([bx - 40, by - 186, bx + 40, by - 106], 20, fill=(255, 214, 170))    # cabeça
    d.ellipse([bx - 22, by - 160, bx - 10, by - 142], fill=(30, 30, 40)); d.ellipse([bx + 10, by - 160, bx + 22, by - 142], fill=(30, 30, 40))
    if plano == "02_cai":  # o "bicho" caindo do céu
        y = min(900, int(-80 + (t * t) * 520))
        d.rounded_rectangle([560, y - 60, 680, y + 40], 22, fill=(250, 250, 250)); d.rounded_rectangle([650, y - 96, 716, y - 36], 16, fill=(250, 250, 250))
        d.ellipse([694, y - 78, 704, y - 68], fill=(20, 20, 20))
        if y >= 900:
            for k in range(8): d.line([(620, 930), (620 + 150 * (k - 3.5) / 3.5, 860 - 30 * (k % 2))], fill=(255, 230, 120), width=10)
    return im.rotate(-90, expand=True)   # deitada, como a câmera com ROLL de 90 graus


for nome, dur in DUR.items():
    seg = (dur + 1.2) * SLOW + 0.3 + 0.2
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{H}x{W}", "-r", str(QPS), "-i", "-",
                          "-c:v", "libx264", "-crf", "16", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-y", os.path.join(T, f"bruto_{nome}.mp4")], stdin=subprocess.PIPE)
    for i in range(0, int(seg * QPS), SLOW):       # 1 quadro novo a cada 3: é o que a câmera lenta rende
        b = cena(nome, max(0, i / QPS - 0.3) / SLOW).tobytes()
        for _ in range(SLOW): p.stdin.write(b)
    p.stdin.close(); p.wait()
    print("bruto", nome, flush=True)

json.dump({"slow": SLOW, "recorte": "728:1294:12:42", "planos": DUR}, open(os.path.join(T, "planos.json"), "w"))
palavras = [("Nessa", 0.0, 0.3), ("cidade,", 0.35, 0.8), ("cai", 0.95, 1.15), ("um", 1.2, 1.3), ("bicho", 1.35, 1.75), ("Comenta", 1.95, 2.4)]
json.dump([{"w": w, "start": a, "end": b} for w, a, b in palavras], open(os.path.join(T, "narr_demo.words.json"), "w"))
json.dump({"titulo": "demo", "atraso_voz": 0.3, "cauda": 0.3,
           "planos": [["01_praca", "Nessa cidade", 0], ["02_cai", "cai um bicho", 0.3]],
           "hud": [{"txt": "IDADE  10", "de": 0.1, "ate": "fim", "margem_v": 230},
                   {"txt": "BICHO:  ???", "de": 0.1, "ate": {"plano": "02_cai", "mais": 0.6}, "margem_v": 320},
                   {"txt": "BICHO:  VACA", "de": {"plano": "02_cai", "mais": 0.6}, "ate": "fim", "margem_v": 320, "alerta": True}],
           "etiquetas": [{"plano": "01_praca", "txt": "1 PUXADA POR PESSOA"}],
           "voto": {"frase": "Comenta", "opcoes": ["1  ·  SUBIR", "2  ·  ESCONDER"]}},
          open(os.path.join(T, "episodio.json"), "w", encoding="utf8"), ensure_ascii=False)

py = sys.executable
subprocess.run([py, os.path.join(R, "gravacao", "montar.py"), "deitados"], cwd=T, check=True)
subprocess.run([py, os.path.join(R, "gravacao", "montar.py"), "varre"], cwd=T, check=True)
subprocess.run([py, os.path.join(R, "gravacao", "editar.py"), "episodio.json", "--voz", "narr_demo", "--mudo", "--tam", "540x960",
                "--saida", os.path.join("..", "demo.mp4")], cwd=T, check=True)
print(f"pronto: saida/demo.mp4 em {time.time() - t0:.1f} s")
