# montar_narrado.py (ep01 narrado): depois do raw_narrado.mp4 (render com WARP=narrado/warp.json)
#  1) narrado/voz_narrado.wav: as 13 falas (voz/<id>_-16.wav, 1 take cada, 1,0x) coladas no relógio novo (falas_pos.json)
#  2) narrado/roteiro_narrado.txt (texto corrido, para conferir a fala com um transcritor)
#  3) narrado/TIMELINE_narrado.json: os eventos de som do TIMELINE.json passados pelo warp (onde vão trilha e efeitos)
#  4) 01_patinete_narrado_mudo.mp4: raw_narrado + cartelas (a agenda do ../montar.py passada pelo warp)
#  5) 01_patinete_narrado_voz.mp4: o mudo + a voz (ponto de partida para a mixagem com trilha e efeitos no seu editor)
# Uso: python narrado/montar_narrado.py [--sem-video]      Precisa só de python e ffmpeg no PATH.
import os, sys, json, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); EP = os.path.dirname(HERE)
WJ = json.load(open(os.path.join(HERE, "warp.json"))); A = WJ["ancoras_novo_fonte"]; D = WJ["duracao"]
def W(t):
    for (n0, s0), (n1, s1) in zip(A, A[1:]):
        if t <= s1 + 1e-9: return round(n0 + (t - s0) * (n1 - n0) / (s1 - s0), 3)
    return round(A[-1][0] + t - A[-1][1], 3)
pos = json.load(open(os.path.join(HERE, "falas_pos.json")))
run = lambda a: subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *a], check=True)
os.chdir(EP)
# 1) voz: cada fala atrasada até a sua posição e somada (sem normalizar de novo: cada arquivo já está em -16 LUFS)
ins, fl = [], ''
for k, p in enumerate(pos):
    ins += ['-i', f"voz/{p['id']}_-16.wav"]
    fl += f"[{k}:a]adelay={int(round(max(0, p['arquivo_em']) * 1000))}:all=1[a{k}];"
fl += ''.join(f'[a{k}]' for k in range(len(pos))) + f'amix=inputs={len(pos)}:normalize=0:duration=longest,apad=whole_dur={D}[a]'
run([*ins, '-filter_complex', fl, '-map', '[a]', '-t', str(D), '-ar', '48000', '-ac', '2', 'narrado/voz_narrado.wav'])
# 2) roteiro
txt = {}
for l in open("falas.tsv", encoding="utf8"):
    if l.startswith("#") or not l.strip(): continue
    i, a, j, t = l.rstrip("\n").split("\t"); txt[i] = " ".join(w for w in t.split() if not w.startswith("["))
open(os.path.join(HERE, "roteiro_narrado.txt"), "w", encoding="utf8").write(" ".join(txt[p["id"]] for p in pos))
# 3) TIMELINE no relógio novo
tl = json.load(open("TIMELINE.json", encoding="utf8")); tl.update({"peca": "01_patinete_narrado", "duracao_s": D, "voz": "narrado/voz_narrado.wav"})
for e in tl["eventos"]: e["t"] = W(e["t"])
for m in tl["momentos"]: m["t"], m["t1"] = W(m["t"]), W(m["t1"])
tl["falas"] = pos
json.dump(tl, open(os.path.join(HERE, "TIMELINE_narrado.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
print("voz/roteiro/timeline ok, duração", D)
if "--sem-video" in sys.argv: sys.exit()
# 4) cartelas (agenda do ../montar.py ep01, passada pelo warp)
CARDS = [('c1_1', 11.75, 12.15), ('c1_2', 12.15, 12.55), ('c1_3', 12.55, 12.95), ('c1_4', 12.95, 13.45), ('c1_5', 13.45, 14.0), ('c1_6', 14.0, 15.35, 14.95),
         ('c2_1', 33.6, 34.3), ('c2_2', 34.3, 35.0), ('c2_3', 35.0, 38.1)]
ins = ['-i', 'raw_narrado.mp4']; fl = ''; prev = '[0:v]'
for k, c in enumerate(CARDS, 1):
    a, b = W(c[1]), (W(c[2]) if c[2] <= 38 else D + 0.1)
    ins += ['-loop', '1', '-t', str(D), '-i', f'cards/{c[0]}.png']
    fade = f',fade=t=out:st={W(c[3])}:d={round(b - W(c[3]), 3)}:alpha=1' if len(c) > 3 else ''
    fl += f'[{k}:v]format=rgba{fade}[c{k}];{prev}[c{k}]overlay=0:0:enable=\'between(t,{a},{b})\'[o{k}];'; prev = f'[o{k}]'
fl += f'{prev}format=yuv420p[v]'
run([*ins, '-filter_complex', fl, '-map', '[v]', '-t', str(D), '-r', '30', '-c:v', 'libx264', '-preset', 'slow',
     '-crf', '18', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', '01_patinete_narrado_mudo.mp4'])
print("mudo ok")
# 5) mudo + voz
run(['-i', '01_patinete_narrado_mudo.mp4', '-i', 'narrado/voz_narrado.wav', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
     '-t', str(D), '-movflags', '+faststart', '01_patinete_narrado_voz.mp4'])
print("voz ok -> 01_patinete_narrado_voz.mp4")
