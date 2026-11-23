"""Monta os planos (planos_up/) nos tempos da voz, com legenda de 1 palavra (ASS), HUD de jogo, etiquetas, cartões de voto e mix.

Rode na pasta onde está planos_up/:
  python editar.py episodio.json --voz ../voz/narr_A            usa narr_A.words.json + narr_A_-16.wav
  python editar.py episodio.json --voz ../voz/narr_A --mudo     só imagem (prévia sem áudio)
Opções: --tam 1080x1920 (padrão) · --saida final/video.mp4 · --qps 30
O episodio.json (modelo: ep01.json) diz em que frase cada plano entra. Sons: pasta da variável SFX_DIR (padrão ./sons);
arquivo que faltar é pulado com aviso. Regras do mix: voz na frente, trilha 12 dB abaixo com ducking, efeitos medidos
pelo pico momentâneo, tudo normalizado em -14 LUFS.
"""
import argparse, json, os, re, subprocess, unicodedata

ap = argparse.ArgumentParser()
ap.add_argument("episodio"); ap.add_argument("--voz", required=True); ap.add_argument("--mudo", action="store_true")
ap.add_argument("--tam", default="1080x1920"); ap.add_argument("--saida"); ap.add_argument("--qps", type=int, default=30)
A = ap.parse_args()
E = json.load(open(A.episodio, encoding="utf8"))
W = json.load(open(A.voz + ".words.json", encoding="utf8"))
OFF = E.get("atraso_voz", 0.3); FONTE = E.get("fonte", "Arial Rounded MT Bold")
ROT = E["planos"]; NOMES = [p for p, _, _ in ROT]
norm = lambda s: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode())


def acha(frase, depois=0.0):
    ks = [norm(k) for k in frase.split()]
    for i in range(len(W) - len(ks) + 1):
        if W[i]["start"] + OFF >= depois - 0.01 and all(norm(W[i + j]["w"]) == ks[j] for j in range(len(ks))):
            return W[i]["start"] + OFF
    raise SystemExit("não achei na voz: " + frase)


T = []; t = 0.0
for k, (p, fr, ini) in enumerate(ROT):
    t = 0.0 if k == 0 else acha(fr, t); T.append(t)
DUR = W[-1]["end"] + OFF + E.get("cauda", 1.8)


def tempo(x):
    if x == "fim": return DUR
    if isinstance(x, (int, float)): return float(x)
    if "frase" in x: return acha(x["frase"], T[NOMES.index(x["depois_do_plano"])] if "depois_do_plano" in x else 0.0) + x.get("mais", 0)
    return T[NOMES.index(x["plano"])] + x.get("mais", 0)


def fim_do_plano(nome):
    k = NOMES.index(nome); return T[k + 1] if k + 1 < len(T) else DUR


def dur_clip(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"planos_up/{p}.mp4"], capture_output=True, text=True).stdout)


# ---------- vídeo ----------
inputs, filt, labels = [], [], []
for k, (p, fr, ini) in enumerate(ROT):
    a = T[k]; b = T[k + 1] if k + 1 < len(T) else DUR; d = b - a
    L = dur_clip(p); disp = L - ini; lento = d / disp if disp < d else 1.0
    inputs += ["-ss", f"{ini:.3f}", "-i", f"planos_up/{p}.mp4"]
    filt.append(f"[{k}:v]setpts=(PTS-STARTPTS)*{lento:.4f},fps={A.qps},scale=1080:1920,trim=duration={d:.4f},setpts=PTS-STARTPTS,setsar=1[v{k}]"); labels.append(f"[v{k}]")
    if lento > 1.0: print(f"  {p}: clipe curto, desacelerado {lento:.2f}x")


# ---------- legendas + HUD (ASS) ----------
def ts(x):
    h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60
    return f"{h}:{m:02d}:{s:05.2f}"


VOTO = E.get("voto"); TCOM = acha(VOTO["frase"], T[-1]) if VOTO else DUR + 1
ass = ["[Script Info]", "ScriptType: v4.00+", "PlayResX: 1080", "PlayResY: 1920", "WrapStyle: 2", "",
       "[V4+ Styles]",
       "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
       f"Style: Palavra,{FONTE},104,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,8,3,2,40,40,600,1",
       f"Style: HUD,{FONTE},58,&H00FFFFFF,&H00FFFFFF,&H00202020,&HB4201810,0,0,0,0,100,100,1,0,3,14,0,7,60,60,230,1",
       f"Style: Etiqueta,{FONTE},58,&H00202020,&H00FFFFFF,&H00FFFFFF,&H00FFFFFF,0,0,0,0,100,100,1,0,3,18,0,8,60,60,420,1",
       f"Style: Voto1,{FONTE},84,&H00FFFFFF,&H00FFFFFF,&H0038B04A,&H0038B04A,0,0,0,0,100,100,1,0,3,26,0,5,60,60,0,1",
       f"Style: Voto2,{FONTE},84,&H00FFFFFF,&H00FFFFFF,&H00D07A2E,&H00D07A2E,0,0,0,0,100,100,1,0,3,26,0,5,60,60,0,1",
       "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
POP = "{\\fscx70\\fscy70\\t(0,110,\\fscx100\\fscy100)}"
for i, w in enumerate(W):
    a = w["start"] + OFF; b = (W[i + 1]["start"] + OFF) if i + 1 < len(W) else w["end"] + OFF + 0.5
    b = min(b, w["end"] + OFF + 0.35)
    if a >= TCOM - 0.01: break  # no final entram os cartões de voto
    txt = w["w"].strip(",.:;…!?").upper()
    ass.append(f"Dialogue: 2,{ts(a)},{ts(b)},Palavra,,0,0,0,,{{\\fscx78\\fscy78\\t(0,90,\\fscx100\\fscy100)}}{txt}")
for h in E.get("hud", []):
    fx = "{\\c&H3A3AFF&\\fscx80\\fscy80\\t(0,120,\\fscx100\\fscy100)}" if h.get("alerta") else ""
    ass.append(f"Dialogue: 1,{ts(tempo(h['de']))},{ts(tempo(h['ate']))},HUD,,0,0,{h.get('margem_v', 0)},,{fx}{h['txt']}")
for e in E.get("etiquetas", []):
    ass.append(f"Dialogue: 1,{ts(tempo({'plano': e['plano']}) + 0.5)},{ts(fim_do_plano(e['plano']) - 0.1)},Etiqueta,,0,0,0,,{POP}{e['txt']}")
if VOTO:
    for j, op in enumerate(VOTO["opcoes"][:2]):
        ass.append(f"Dialogue: 3,{ts(TCOM + 0.15 * j)},{ts(DUR)},Voto{j + 1},,0,0,0,,{{\\pos(540,{1240 + 200 * j})\\fscx60\\fscy60\\t(0,120,\\fscx100\\fscy100)}}{op}")
open("_leg.ass", "w", encoding="utf8").write("\n".join(ass) + "\n")

n = len(ROT); TW, TH = A.tam.split("x")
filt.append("".join(labels) + f"concat=n={n}:v=1:a=0,subtitles=_leg.ass,scale={TW}:{TH}:flags=lanczos,format=yuv420p[v]")

# ---------- som ----------
ain, af = [], []
if not A.mudo:
    SD = os.environ.get("SFX_DIR", "sons"); S = E.get("som", {})

    def mmax(f):  # pico de loudness momentâneo (LUFS)
        o = subprocess.run(["ffmpeg", "-hide_banner", "-i", f, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
        ms = [float(x) for x in re.findall(r"M:\s*(-?[\d.]+)", o) if float(x) > -69]
        return max(ms) if ms else -30.0

    def add(f):
        ain.extend(["-i", f]); return n + len(ain) // 2 - 1

    def existe(arq):
        f = os.path.join(SD, arq)
        if os.path.exists(f): return f
        print("  som ausente, pulei:", f); return None

    ms = int(OFF * 1000); al = []
    iv = add(A.voz + "_-16.wav")
    af.append(f"[{iv}:a]adelay={ms}|{ms},apad=whole_dur={DUR:.2f},aformat=channel_layouts=stereo[voz]")
    for k, x in enumerate(S.get("ambiente", [])):
        f = existe(x["arquivo"])
        if not f: continue
        a, b = tempo(x["de"]), tempo(x["ate"]); g = x.get("alvo_db", -38) - mmax(f) + 4; i = add(f)
        af.append(f"[{i}:a]aloop=loop=-1:size=2e7,atrim=0:{b - a:.2f},asetpts=PTS-STARTPTS,volume={g:.1f}dB,afade=t=in:d=0.5,afade=t=out:st={max(0, b - a - 0.6):.2f}:d=0.6,aformat=channel_layouts=stereo,adelay={int(a * 1000)}|{int(a * 1000)}[amb{k}]"); al.append(f"[amb{k}]")
    for k, x in enumerate(S.get("sfx", [])):
        f = existe(x["arquivo"])
        if not f: continue
        t0 = tempo(x["em"]); dmax = (tempo(x["ate"]) - t0) if "ate" in x else x.get("dur", 1.0); fo = x.get("fade", 0.1)
        g = -25.0 - mmax(f) + x.get("extra_db", 0); i = add(f)   # efeito ~10 dB abaixo da voz
        lp = "aloop=loop=-1:size=2e6," if x.get("loop") else ""
        af.append(f"[{i}:a]{lp}atrim=0:{dmax:.2f},asetpts=PTS-STARTPTS,volume={g:.1f}dB,afade=t=out:st={max(0, dmax - fo):.2f}:d={fo},aformat=channel_layouts=stereo,adelay={int(t0 * 1000)}|{int(t0 * 1000)}[e{k}]"); al.append(f"[e{k}]")
    tr = []
    for k, x in enumerate(S.get("trilha", [])):
        f = existe(x["arquivo"])
        if not f: continue
        a, b = tempo(x["de"]), tempo(x["ate"]); g = (-16 - 12) - (mmax(f) - 4); i = add(f)   # trilha 12 dB abaixo da voz
        af.append(f"[{i}:a]aloop=loop=-1:size=2e7,atrim=0:{b - a:.2f},asetpts=PTS-STARTPTS,volume={g:.1f}dB,highpass=f=40,afade=t=in:d=0.6,afade=t=out:st={max(0, b - a - 1.2):.2f}:d=1.2,aformat=channel_layouts=stereo,adelay={int(a * 1000)}|{int(a * 1000)}[tr{k}]"); tr.append(f"[tr{k}]")
    if tr:
        af.append("".join(tr) + (f"amix=inputs={len(tr)}:normalize=0[trraw]" if len(tr) > 1 else "anull[trraw]"))
        af.append("[voz]asplit=2[vozm][vozsc]")
        af.append("[trraw][vozsc]sidechaincompress=threshold=0.03:ratio=5:attack=20:release=350[tr]")
        al = ["[vozm]", "[tr]"] + al
    else:
        al = ["[voz]"] + al
    af.append("".join(al) + f"amix=inputs={len(al)}:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]")

fs = "_filtro.txt"; open(fs, "w", encoding="utf8").write(";\n".join(filt + af))
out = A.saida or f"final/{E.get('titulo', 'video')}.mp4"
os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
som = ["-an"] if A.mudo else ["-map", "[a]", "-c:a", "aac", "-b:a", "192k"]
r = subprocess.run(["ffmpeg", "-v", "error", *inputs, *ain, "-/filter_complex", fs, "-map", "[v]", *som,
                    "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
                    "-t", f"{DUR:.3f}", "-movflags", "+faststart", "-y", out], capture_output=True, text=True)
if r.returncode: print(r.stderr[-3000:]); raise SystemExit("falhou")
print("ok", out, f"{DUR:.1f}s", [round(x, 2) for x in T])
