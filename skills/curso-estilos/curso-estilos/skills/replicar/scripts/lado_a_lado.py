"""Replicar · referência × réplica, lado a lado, MUDO.

Uso: python lado_a_lado.py REF.mp4 REPLICA.mp4 [--ini 0] [--dur 8] [--out PASTA]

Gera: lado_a_lado.mp4 (ref à esquerda, réplica à direita, sem áudio; se as duas forem horizontais,
                       ref em cima e réplica embaixo). Cada vídeo mantém a própria proporção.
      lado_a_lado.jpg (8 pares de quadros no mesmo instante)
      diferencas.json (os mesmos números da análise, um ao lado do outro)
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(Path(__file__).resolve().parent))
from analisar import _dim, analisar, cortes, ffprobe, fonte, ler_quadros  # noqa: E402
from classificar import vetor  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("ref")
ap.add_argument("replica")
ap.add_argument("--ini", type=float, default=0.0, help="segundo da REF onde começa o trecho replicado")
ap.add_argument("--dur", type=float, default=8.0)
ap.add_argument("--out")
a = ap.parse_args()
out = Path(a.out) if a.out else Path(a.replica).with_name(Path(a.replica).stem + "_lado")
out.mkdir(parents=True, exist_ok=True)

# a janela não deve atravessar um corte da referência: a medida de movimento sai inflada
dur_ref = ffprobe(a.ref)["duracao_s"]
ts_ref, ritmo_ref = cortes(a.ref, dur_ref)
ts_rep, ritmo_rep = cortes(a.replica, ffprobe(a.replica)["duracao_s"])
dentro = [t for t in ts_ref if a.ini + 0.2 < t < a.ini + a.dur - 0.2]
if ts_rep:
    # a réplica tem cortes (é uma peça com vários planos): o ritmo se compara com a referência INTEIRA, não com a janela
    print(f"Ritmo (vídeo inteiro): referência {ritmo_ref['cortes_por_min']} cortes/min, plano médio {ritmo_ref['plano_medio_s']} s · "
          f"réplica {ritmo_rep['cortes_por_min']} cortes/min, plano médio {ritmo_rep['plano_medio_s']} s")
    print("A janela abaixo serve para comparar a imagem (cor, texto, enquadramento). Ignore 'cortes_por_min' e 'plano_medio_s' dela.")
elif dentro:
    print("AVISO: a janela pega corte(s) da referência em " + ", ".join(f"{t:.1f} s" for t in dentro) +
          ". A réplica é um plano só: escolha --ini/--dur dentro de um plano (veja cortes.jpg).")

(wa, ha), (wb, hb) = _dim(a.ref), _dim(a.replica)
if wa > ha and wb > hb:  # duas horizontais: empilha; senão lado a lado. Nunca estica.
    f = (f"[0:v]trim=start={a.ini}:duration={a.dur},setpts=PTS-STARTPTS,fps=30,scale=960:-2,setsar=1[a];"
         f"[1:v]trim=duration={a.dur},setpts=PTS-STARTPTS,fps=30,scale=960:-2,setsar=1[b];[a][b]vstack=inputs=2[v]")
else:
    H = 960
    f = (f"[0:v]trim=start={a.ini}:duration={a.dur},setpts=PTS-STARTPTS,fps=30,scale=-2:{H},setsar=1[a];"
         f"[1:v]trim=duration={a.dur},setpts=PTS-STARTPTS,fps=30,scale=-2:{H},setsar=1[b];[a][b]hstack=inputs=2[v]")
r = subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", a.ref, "-i", a.replica, "-filter_complex", f,
                    "-map", "[v]", "-an", "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", str(out / "lado_a_lado.mp4")],
                   capture_output=True, text=True)
if r.returncode:
    print("ffmpeg falhou:", r.stderr[-400:])

ts = [a.dur * (i + 0.5) / 8 for i in range(8)]
# miniatura grande o bastante para ler linha fina e texto: horizontal 480 px (4 por linha), vertical 270 px (8 por linha)
LQ, COLS = (480, 4) if (wa > ha and wb > hb) else (270, 8)
qa = ler_quadros(a.ref, [a.ini + t for t in ts], largura=LQ)
qb = ler_quadros(a.replica, ts, largura=LQ)
if qa and qb:
    # cada bloco com a altura do próprio vídeo (vertical × horizontal não estica)
    hs = [int(q[0][1].shape[0] * LQ / q[0][1].shape[1]) for q in (qa, qb)]
    nl = -(-8 // COLS)                                   # linhas por bloco
    ys = [0, hs[0] * nl + 6]
    im = Image.new("RGB", (COLS * LQ, hs[0] * nl + hs[1] * nl + 6), (16, 16, 16))
    d = ImageDraw.Draw(im)
    fo = fonte(15)
    for bloco, qs in enumerate((qa, qb)):
        for i, (t, fr) in enumerate(qs[:8]):
            x, y = (i % COLS) * LQ, ys[bloco] + (i // COLS) * hs[bloco]
            im.paste(Image.fromarray(cv2.cvtColor(cv2.resize(fr, (LQ, hs[bloco])), cv2.COLOR_BGR2RGB)), (x, y))
            seg = f"{t:.1f} s"
            lt = d.textlength(seg, font=fo)
            d.rectangle([x + LQ - lt - 8, y, x + LQ, y + 20], fill=(0, 0, 0))
            d.text((x + LQ - lt - 4, y + 1), seg, fill=(200, 200, 200), font=fo)
    for y, rot in zip(ys, ("REFERÊNCIA", "RÉPLICA")):
        d.rectangle([0, y, d.textlength(rot, font=fo) + 8, y + 20], fill=(0, 0, 0))
        d.text((4, y + 1), rot, fill=(255, 255, 255), font=fo)
    im.save(out / "lado_a_lado.jpg", quality=88)

# mede só o trecho replicado da referência (mudo), não o vídeo inteiro
trecho = out / "_ref_trecho.mp4"
subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-ss", str(a.ini), "-i", a.ref, "-t", str(a.dur), "-an",
                "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", str(trecho)])
ra, _ = analisar(trecho, out / "_ref", sem_ocr=True)
rb, _ = analisar(a.replica, out / "_replica", sem_ocr=True)
va, vb = vetor(ra), vetor(rb)
dif = {k: {"ref": va[k], "replica": vb[k]} for k in va if va[k] is not None and vb[k] is not None}
(out / "diferencas.json").write_text(json.dumps(dif, ensure_ascii=False, indent=2), encoding="utf-8")
print("Maiores diferenças (réplica ÷ ref):")
ordem = sorted(dif, key=lambda k: -abs(np.log((abs(dif[k]["replica"]) + 1e-3) / (abs(dif[k]["ref"]) + 1e-3))))
# quadro quase preto: saturação e degradê medem ruído, não a imagem. Não guie a réplica por eles.
escuro = min(va.get("brilho") or 1, vb.get("brilho") or 1) < 0.08
FRACAS = ("saturacao", "degrade_suave", "cores_90pct")
for k in ordem[:8]:
    print(f"  {k}: ref {dif[k]['ref']:.3f} · réplica {dif[k]['replica']:.3f}" + ("  (pouco confiável: quadro quase preto)" if escuro and k in FRACAS else ""))
if escuro:
    print("Quadro quase preto: saturação, degradê e número de cores não servem de guia aqui. Compare a cor no olho, pelo lado_a_lado.jpg.")
print(f"\nPasta: {out}\nOlhe lado_a_lado.jpg; mostre ao aluno o lado_a_lado.mp4 (mudo).")
