#!/usr/bin/env python
"""checar.py: checagens objetivas de um vídeo, de graça e sem LLM.

Separa as checagens repetitivas (código) do trabalho criativo: roda em todo
render, devolve passou/falhou e uma folha só com os quadros suspeitos, que é o
que o agente (ou você) olha. Nada aqui julga gosto ou ideia.

Uso:
  python checar.py video.mp4 [--config qa.json] [--roteiro roteiro.txt]
                   [--out pasta] [--fps-amostra 2] [--sem-ocr] [--sem-stt] [--lingua pt]

Precisa de FFmpeg/ffprobe no PATH e de: pip install -r requirements.txt
(o OCR e o STT só são importados quando usados: com --sem-ocr --sem-stt bastam numpy e opencv-python).

Saída em <out> (padrão: <video>_qa/):
  QA.md         tabela passou/aviso/falhou + o que olhar
  qa.json       tudo medido
  suspeitos.png folha com os quadros marcados (tempo + motivo)
"""
import argparse, json, math, os, re, subprocess, sys, difflib
from pathlib import Path

import numpy as np
import cv2

# ---------------------------------------------------------------- padrões
PADRAO = {
    "max_parado_s": 1.5,          # nada vivo por mais que isso = falha
    "parado_limiar": 2.0,         # um bloco 16x16 (quadro com 270 de largura) mudando mais que isso (0-255) = algo vivo
    "ignorar_faixas": [[0.0, 0.08]],  # faixas verticais (fração da altura) fora do teste de movimento e de texto: HUD/topo coberto pela UI
    "texto_min_px": 52,           # tamanho mínimo de fonte (px) num quadro de 1080 de largura
    "zona_ui_baixo": 0.15,        # % de baixo coberta pela UI do Instagram (9:16)
    "borda_px": 12,               # texto encostando a menos disso da borda = cortado
    "flashes_max_por_s": 3,
    "lufs_alvo": -14.0, "lufs_tol": 1.0,
    "true_peak_max": -1.0,
    "celular_min_lufs": -20.0,
    "silencio_max_s": 0.6,        # silêncio no meio maior que isso = aviso (silêncio de propósito existe)
    "sample_rate": 48000,
    "paleta": None,               # ex.: ["#FFFFFF", "#121211", "#ED3821"]
    "acento": None,               # ex.: "#ED3821"
    "acento_area_max": 0.08,      # vale para a MEDIANA da peça; quadro-herói acima disso é só informação
    "fora_paleta_max": 0.03,      # % de pixels fora da paleta (e das misturas entre ela)
    "paleta_tol": 28,             # distância RGB tolerada
    "tem_fotos": False,           # true = pula a checagem de paleta
    "heroi_min_largura": 0.40,    # mediana da largura do maior objeto (fração da largura do quadro); nos nossos vídeos fica em 60–85%
    "acento_area_min": 0.01,      # acento quase sumindo na mediana = herói pequeno ou cor sem papel
    "stt_min_similaridade": 0.90,
}

def sh(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", **kw)

def hex2rgb(h):
    h = h.lstrip("#"); return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)], np.float32)

# ---------------------------------------------------------------- vídeo
def sondar(video):
    r = sh(["ffprobe", "-v", "error", "-show_entries",
            "stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels,pix_fmt:format=duration",
            "-of", "json", video])
    d = json.loads(r.stdout)
    v = next((s for s in d["streams"] if s["codec_type"] == "video"), {})
    a = next((s for s in d["streams"] if s["codec_type"] == "audio"), None)
    num, den = (v.get("r_frame_rate", "0/1").split("/") + ["1"])[:2]
    return {"w": v.get("width"), "h": v.get("height"), "fps": round(float(num) / float(den or 1), 3),
            "dur": float(d["format"]["duration"]), "vcodec": v.get("codec_name"), "pix_fmt": v.get("pix_fmt"),
            "audio": None if not a else {"codec": a.get("codec_name"), "sr": int(a.get("sample_rate", 0)),
                                         "ch": a.get("channels")}}

def ler_quadros(video, w, h, fps=None):
    """Lê quadros via ffmpeg (rgb24). fps=None = todos."""
    vf = (f"fps={fps}:round=up," if fps else "") + f"scale={w}:{h}:flags=area"  # round=up: o quadro k é o de k/fps (o padrão pegava até meio intervalo depois)
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", video, "-vf", vf, "-f", "rawvideo",
                          "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    n = w * h * 3
    while True:
        b = p.stdout.read(n)
        if len(b) < n: break
        yield np.frombuffer(b, np.uint8).reshape(h, w, 3)
    p.wait()

def checar_movimento(video, info, cfg):
    """Parado, quadro repetido (engasgo), quadro vazio e flashes, em todos os quadros (reduzidos)."""
    W = 270; H = int(round(W * info["h"] / info["w"] / 2) * 2)
    fps = info["fps"] or 30
    diffs, lumas, vazios = [], [], []
    prev = None
    mask = np.ones(H, bool)
    for a0, a1 in cfg.get("ignorar_faixas") or []: mask[int(a0 * H):int(a1 * H)] = False
    B = 16; Hb = (H // B) * B; Wb = (W // B) * B
    for i, f in enumerate(ler_quadros(video, W, H)):
        g = cv2.cvtColor(f, cv2.COLOR_RGB2GRAY).astype(np.float32)
        lumas.append(g.mean())
        if g.std() < 1.5: vazios.append(i)
        if prev is not None:
            d = np.abs(g - prev); d[~mask] = 0
            blocos = d[:Hb, :Wb].reshape(Hb // B, B, Wb // B, B).mean(axis=(1, 3))
            diffs.append(float(blocos.max()))
        prev = g
    diffs = np.array(diffs); lumas = np.array(lumas)
    parado = diffs < cfg["parado_limiar"]
    # trechos parados
    trechos, ini = [], None
    for i, p in enumerate(parado):
        if p and ini is None: ini = i
        if (not p or i == len(parado) - 1) and ini is not None:
            fim = i if not p else i + 1
            trechos.append((ini / fps, fim / fps)); ini = None
    longos = [(a, b) for a, b in trechos if b - a > cfg["max_parado_s"]]
    maior = max([b - a for a, b in trechos], default=0.0)
    # engasgo: 1 quadro idêntico no meio de movimento
    # engasgo de verdade: movimento contínuo (2 quadros antes e 2 depois mexendo) com 1 quadro repetido no meio.
    # Typewriter/troca discreta (mexe, para, mexe, para) não conta.
    engasgos = [i / fps for i in range(2, len(diffs) - 2)
                if diffs[i] < 0.05 and min(diffs[i - 2], diffs[i - 1], diffs[i + 1], diffs[i + 2]) > 8.0]
    # flashes: salto de luminância > 25% num quadro
    saltos = np.where(np.abs(np.diff(lumas)) > 0.25 * 255)[0]
    pior_flash = 0
    for t in saltos:
        janela = ((saltos >= t) & (saltos < t + fps)).sum()
        pior_flash = max(pior_flash, int(janela))
    return {"maior_parado_s": round(maior, 2), "trechos_parados_longos": [[round(a, 2), round(b, 2)] for a, b in longos],
            "engasgos_s": [round(t, 2) for t in engasgos][:30], "quadros_vazios_s": [round(i / fps, 2) for i in vazios][:30],
            "flashes_por_s_max": pior_flash}

# ---------------------------------------------------------------- quadros amostrados
_ocr = None
def ocr(img):
    global _ocr
    if _ocr is None:
        from rapidocr_onnxruntime import RapidOCR
        _ocr = RapidOCR()
    r, _ = _ocr(img)
    return r or []

def dist_segmentos(px, cores):
    """Menor distância de cada pixel a qualquer cor da paleta OU mistura entre duas delas (antialias)."""
    best = np.full(px.shape[0], 1e9, np.float32)
    for i, a in enumerate(cores):
        best = np.minimum(best, np.linalg.norm(px - a, axis=1))
        for b in cores[i + 1:]:
            ab = b - a; t = np.clip(((px - a) @ ab) / max(float(ab @ ab), 1e-6), 0, 1)
            best = np.minimum(best, np.linalg.norm(px - (a + t[:, None] * ab), axis=1))
    return best

def checar_quadros(video, info, cfg, fps_amostra, usar_ocr):
    W = 1080; H = int(round(W * info["h"] / info["w"] / 2) * 2)
    esc = W / info["w"]  # tudo medido em "px de um quadro com 1080 de largura"
    pal = [hex2rgb(c) for c in cfg["paleta"]] if cfg.get("paleta") else None
    acento = hex2rgb(cfg["acento"]) if cfg.get("acento") else None
    min_box = cfg["texto_min_px"] * 0.70  # altura de caixa de OCR ~ 0,7 × tamanho da fonte (maiúsculas)
    textos_peq, cortados, na_ui, hifen, fora, acentos, herois = [], [], [], [], [], [], []
    cheios = 0
    minis = {}  # miniatura do MESMO quadro que o OCR leu, com a caixa do texto (a folha de suspeitos usa esta)
    for k, f in enumerate(ler_quadros(video, W, H, fps_amostra)):
        t = round(k / fps_amostra, 2)
        # herói: maior objeto que não é fundo (fundo = mediana da borda do quadro)
        sm = cv2.resize(f, (270, int(270 * H / W)), interpolation=cv2.INTER_AREA)
        borda = np.concatenate([sm[0], sm[-1], sm[:, 0], sm[:, -1]]).astype(np.float32)
        fundo = np.median(borda, axis=0)
        obj = (np.linalg.norm(sm.astype(np.float32) - fundo, axis=2) > 40).astype(np.uint8)
        for a0, a1 in cfg.get("ignorar_faixas") or []: obj[int(a0 * obj.shape[0]):int(a1 * obj.shape[0])] = 0
        obj = cv2.morphologyEx(obj, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
        n, lab, st, _ = cv2.connectedComponentsWithStats(obj, 8)
        # só objetos "cheios" (área/caixa ≥ 0,35): linhas, réguas e molduras não contam como herói
        cand = [j for j in range(1, n) if st[j, cv2.CC_STAT_AREA] >= 30 and
                st[j, cv2.CC_STAT_AREA] / max(1, st[j, cv2.CC_STAT_WIDTH] * st[j, cv2.CC_STAT_HEIGHT]) >= 0.35]
        if cand:
            i = max(cand, key=lambda j: st[j, cv2.CC_STAT_AREA])
            larg = st[i, cv2.CC_STAT_WIDTH] / 270
            # mancha que vai de um lado ao outro do quadro não é personagem medido: é cenário cheio (o fundo não é liso)
            # ou um close que estoura o quadro. Aí a medida não vale e o quadro não entra na conta.
            if larg >= 0.95:
                cheios += 1
            else:
                herois.append({"t": t, "largura": round(larg, 3)})
        if pal is not None and not cfg["tem_fotos"]:
            small = cv2.resize(f, (270, int(270 * H / W)), interpolation=cv2.INTER_AREA).reshape(-1, 3).astype(np.float32)
            d = dist_segmentos(small, pal)
            fr = float((d > cfg["paleta_tol"]).mean())
            if fr > cfg["fora_paleta_max"]: fora.append({"t": t, "fora": round(fr, 3)})
            if acento is not None:
                acentos.append({"t": t, "area": round(float((np.linalg.norm(small - acento, axis=1) < cfg["paleta_tol"]).mean()), 4)})
        if not usar_ocr: continue
        for box, txt, conf in ocr(f):
            txt = txt.replace("�", "·")
            if conf < 0.6 or len(txt.strip()) < 2: continue
            xs = [p[0] for p in box]; ys = [p[1] for p in box]
            bh = (max(ys) - min(ys)); x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
            cy = (y0 + y1) / 2 / H
            if any(a0 <= cy < a1 for a0, a1 in (cfg.get("ignorar_faixas") or [])): continue
            item = {"t": t, "texto": txt, "altura_px": round(bh, 1), "fonte_px_est": round(bh / 0.70), "caixa": [round(x0), round(y0), round(x1), round(y1)]}
            if bh < min_box: textos_peq.append(item)
            if x0 < cfg["borda_px"] or x1 > W - cfg["borda_px"] or y0 < cfg["borda_px"] or y1 > H - cfg["borda_px"]:
                cortados.append(item)
            if H / W > 1.5 and y1 > H * (1 - cfg["zona_ui_baixo"]): na_ui.append(item)
            if re.search(r"[A-Za-zÀ-ú]-$", txt.strip()): hifen.append(item)
            if any(item is l[-1] for l in (textos_peq, cortados, na_ui, hifen) if l) and len(minis) < 200:
                chave = (t, txt)
                m = cv2.cvtColor(cv2.resize(f, (270, int(round(270 * H / W))), interpolation=cv2.INTER_AREA), cv2.COLOR_RGB2BGR)
                e = 270 / W
                cv2.rectangle(m, (int(x0 * e) - 2, int(y0 * e) - 2), (int(x1 * e) + 2, int(y1 * e) + 2), (80, 120, 255), 2)
                minis[chave] = m
    def unicos(lst):
        vis, out = set(), []
        for it in lst:
            k = re.sub(r"\d", "#", it["texto"].strip().lower())
            if k not in vis: vis.add(k); out.append(it)
        return out
    textos_peq, cortados, na_ui, hifen = unicos(textos_peq), unicos(cortados), unicos(na_ui), unicos(hifen)
    return {"_minis": minis, "texto_pequeno": textos_peq, "texto_na_borda": cortados, "texto_na_zona_ui": na_ui,
            "palavra_quebrada": hifen, "fora_da_paleta": fora,
            "acento_area_max": max([a["area"] for a in acentos], default=None),
            "acento_area_mediana": float(np.median([a["area"] for a in acentos])) if acentos else None,
            "acento_acima_do_max": [a for a in acentos if a["area"] > cfg["acento_area_max"]],
            "heroi_largura_mediana": float(np.median([h["largura"] for h in herois])) if herois else None,
            "heroi_pequeno": [h for h in herois if h["largura"] < cfg["heroi_min_largura"]],
            "heroi_quadros_medidos": len(herois), "heroi_quadros_cenario_cheio": cheios}

# ---------------------------------------------------------------- áudio
def ebur(video, af=""):
    filt = (af + "," if af else "") + "ebur128=peak=true"
    r = sh(["ffmpeg", "-hide_banner", "-nostats", "-i", video, "-map", "0:a:0", "-af", filt, "-f", "null", "-"])
    txt = r.stderr
    I = re.findall(r"^\s+I:\s+(-?[\d.]+) LUFS", txt, re.M)
    P = re.findall(r"^\s+Peak:\s+(-?[\d.inf]+) dBFS", txt, re.M)
    return (float(I[-1]) if I else None), (float(P[-1]) if P and P[-1] not in ("-inf",) else None)

def checar_audio(video, info, cfg):
    if not info["audio"]: return {"tem_audio": False}
    I, tp = ebur(video)
    Ic, _ = ebur(video, "pan=mono|c0=.5*c0+.5*c1,highpass=f=300,lowpass=f=8000")
    r = sh(["ffmpeg", "-hide_banner", "-nostats", "-i", video, "-map", "0:a:0", "-af",
            f"silencedetect=noise=-50dB:d={cfg['silencio_max_s']}", "-f", "null", "-"])
    ini = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", r.stderr)]
    fim = [float(x) for x in re.findall(r"silence_end: (-?[\d.]+)", r.stderr)]
    sil = [[round(a, 2), round(b, 2)] for a, b in zip(ini, fim) if a > 0.3 and b < info["dur"] - 0.3]
    return {"tem_audio": True, "lufs": I, "true_peak": tp, "celular_lufs": Ic, "silencios_no_meio": sil}

_U = "zero um dois três quatro cinco seis sete oito nove dez onze doze treze quatorze quinze dezesseis dezessete dezoito dezenove".split()
_D = "_ _ vinte trinta quarenta cinquenta sessenta setenta oitenta noventa".split()
_C = "_ cento duzentos trezentos quatrocentos quinhentos seiscentos setecentos oitocentos novecentos".split()
def extenso(n):
    if n < 20: return _U[n]
    if n < 100: return _D[n // 10] + ("" if n % 10 == 0 else " e " + _U[n % 10])
    if n == 100: return "cem"
    if n < 1000: return _C[n // 100] + ("" if n % 100 == 0 else " e " + extenso(n % 100))
    return str(n)
def normaliza_fala(s):
    s = s.lower().replace("catorze", "quatorze")
    s = re.sub(r"\d+", lambda m: extenso(int(m.group())) if len(m.group()) <= 3 else m.group(), s)
    return re.sub(r"[^a-zà-ú]", "", s)

def checar_fala(video, roteiro_txt, lingua="pt"):
    from faster_whisper import WhisperModel
    a = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                                     capture_output=True).stdout, np.float32)
    m = WhisperModel("small", device="cpu", compute_type="int8")
    segs, _ = m.transcribe(a, language=lingua)
    texto = " ".join(s.text.strip() for s in segs)
    out = {"transcricao": texto}
    if roteiro_txt:
        sim = difflib.SequenceMatcher(None, normaliza_fala(roteiro_txt), normaliza_fala(texto), autojunk=False).ratio()
        out["similaridade_roteiro"] = round(sim, 3)
    return out

# ---------------------------------------------------------------- folha de suspeitos
def folha(video, info, marcas, destino, minis=None):
    marcas = sorted(marcas, key=lambda m: m[0])[:24]
    if not marcas: return None
    tw = 270; th = int(round(tw * info["h"] / info["w"]))
    tiles = []
    for t, motivo, *resto in marcas:
        pronto = (minis or {}).get((t, resto[0])) if resto else None
        if pronto is not None:  # marca de texto: o quadro exato em que o OCR leu, com a caixa desenhada
            img = cv2.resize(pronto, (tw, th))
            faixa = np.full((54, tw, 3), 18, np.uint8)
            cv2.putText(faixa, f"{t:.2f}s", (6, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)
            cv2.putText(faixa, motivo[:34], (6, 44), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (80, 120, 255), 1, cv2.LINE_AA)
            tiles.append(np.vstack([img, faixa])); continue
        r = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{max(t, 0):.3f}", "-i", video, "-frames:v", "1",
                            "-vf", f"scale={tw}:{th}", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], capture_output=True)
        if len(r.stdout) < tw * th * 3: continue
        img = np.frombuffer(r.stdout, np.uint8).reshape(th, tw, 3).copy()
        faixa = np.full((54, tw, 3), 18, np.uint8)
        cv2.putText(faixa, f"{t:.2f}s", (6, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)
        cv2.putText(faixa, motivo[:34], (6, 44), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (80, 120, 255), 1, cv2.LINE_AA)
        tiles.append(np.vstack([img, faixa]))
    if not tiles: return None
    cols = 6; rows = math.ceil(len(tiles) / cols)
    blank = np.full_like(tiles[0], 255)
    tiles += [blank] * (rows * cols - len(tiles))
    grade = np.vstack([np.hstack(tiles[r * cols:(r + 1) * cols]) for r in range(rows)])
    cv2.imwrite(str(destino), grade)
    return str(destino)

# ---------------------------------------------------------------- relatório
def main():
    for st in (sys.stdout, sys.stderr):
        try: st.reconfigure(encoding="utf-8")
        except Exception: pass
    ap = argparse.ArgumentParser()
    ap.add_argument("video"); ap.add_argument("--config"); ap.add_argument("--roteiro")
    ap.add_argument("--out"); ap.add_argument("--fps-amostra", type=float, default=2.0)
    ap.add_argument("--sem-ocr", action="store_true"); ap.add_argument("--sem-stt", action="store_true")
    ap.add_argument("--mudo", action="store_true")  # entrega muda de propósito: sem faixa de áudio não é aviso
    ap.add_argument("--lingua", default="pt")  # língua da locução para o STT (pt, en, ...)
    a = ap.parse_args()
    cfg = dict(PADRAO)
    if a.config: cfg.update(json.load(open(a.config, encoding="utf-8")))
    video = a.video
    if not os.path.exists(video): sys.exit(f"vídeo não encontrado: {video}")
    out = Path(a.out or (Path(video).with_suffix("").as_posix() + "_qa")); out.mkdir(parents=True, exist_ok=True)
    roteiro = None
    if a.roteiro:
        raw = Path(a.roteiro).read_bytes()
        for enc in ("utf-8-sig", "cp1252", "latin-1"):
            try: roteiro = raw.decode(enc); break
            except UnicodeDecodeError: pass

    info = sondar(video)
    print(f"[1/5] {info['w']}x{info['h']} {info['fps']} fps {info['dur']:.2f}s", file=sys.stderr)
    mov = checar_movimento(video, info, cfg); print("[2/5] movimento ok", file=sys.stderr)
    qd = checar_quadros(video, info, cfg, a.fps_amostra, not a.sem_ocr); print("[3/5] quadros ok", file=sys.stderr)
    minis = qd.pop("_minis", {})
    au = checar_audio(video, info, cfg); print("[4/5] áudio ok" if info["audio"] else "[4/5] áudio: o arquivo não tem faixa de áudio (nada a medir)", file=sys.stderr)
    fala = None if (a.sem_stt or not info["audio"]) else checar_fala(video, roteiro, a.lingua)
    print("[5/5] fala ok" if fala is not None else "[5/5] fala: não conferida (" + ("--sem-stt" if info["audio"] else "sem áudio") + ")", file=sys.stderr)

    linhas, marcas = [], []
    def L(nome, estado, valor, alvo): linhas.append((nome, estado, valor, alvo))

    # especificação
    vert = info["h"] > info["w"]
    L("Formato", "ok" if (info["w"], info["h"]) in [(1080, 1920), (1920, 1080), (1080, 1350), (1080, 1080)] else "aviso",
      f"{info['w']}x{info['h']} · {info['fps']} fps · {info['dur']:.2f} s", "1080x1920 (Reel) / 1920x1080")
    pf = info.get("pix_fmt")
    L("Formato de pixel", "ok" if pf == "yuv420p" else ("falhou" if pf == "yuvj420p" else "aviso"), f"{pf}",
      "yuv420p (yuvj420p não abre em alguns celulares)")
    if info["audio"]:
        L("Áudio do arquivo", "ok" if info["audio"]["codec"] == "aac" and info["audio"]["sr"] == cfg["sample_rate"] else "falhou",
          f"{info['audio']['codec']} {info['audio']['sr']} Hz", "AAC 48 kHz (96 kHz deixa o app mudo)")
    else:
        L("Áudio do arquivo", "ok" if a.mudo else "aviso", "sem faixa de áudio" + (" (entrega muda)" if a.mudo else ""), "—")
    # movimento
    L("Maior tempo parado", "ok" if mov["maior_parado_s"] <= cfg["max_parado_s"] else "falhou",
      f"{mov['maior_parado_s']} s", f"≤ {cfg['max_parado_s']} s")
    for a_, b_ in mov["trechos_parados_longos"]: marcas.append((a_ + (b_ - a_) / 2, f"parado {a_}-{b_}s"))
    L("Engasgo (quadro repetido)", "ok" if not mov["engasgos_s"] else "aviso", f"{len(mov['engasgos_s'])}", "0")
    for t in mov["engasgos_s"][:6]: marcas.append((t, "quadro repetido"))
    L("Quadro vazio", "ok" if not mov["quadros_vazios_s"] else "aviso", f"{len(mov['quadros_vazios_s'])}", "0 (exceto fim de propósito)")
    for t in mov["quadros_vazios_s"][:3]: marcas.append((t, "quadro vazio"))
    L("Flashes", "ok" if mov["flashes_por_s_max"] <= cfg["flashes_max_por_s"] else "falhou",
      f"{mov['flashes_por_s_max']}/s", f"≤ {cfg['flashes_max_por_s']}/s")
    # texto
    if not a.sem_ocr:
        L("Texto pequeno", "ok" if not qd["texto_pequeno"] else "aviso", f"{len(qd['texto_pequeno'])}",
          f"fonte ≥ {cfg['texto_min_px']} px (HUD decorativo pode ficar)")
        for it in qd["texto_pequeno"][:6]: marcas.append((it["t"], f"pequeno: {it['texto'][:18]}", it["texto"]))
        L("Texto na borda/cortado", "ok" if not qd["texto_na_borda"] else "falhou", f"{len(qd['texto_na_borda'])}", "0")
        for it in qd["texto_na_borda"][:6]: marcas.append((it["t"], f"borda: {it['texto'][:18]}", it["texto"]))
        if vert:
            L("Texto na zona da UI (15% de baixo)", "ok" if not qd["texto_na_zona_ui"] else "aviso",
              f"{len(qd['texto_na_zona_ui'])}", "0 (legenda/CTA fica acima)")
            for it in qd["texto_na_zona_ui"][:4]: marcas.append((it["t"], f"zona UI: {it['texto'][:16]}", it["texto"]))
        L("Palavra quebrada (hífen)", "ok" if not qd["palavra_quebrada"] else "falhou", f"{len(qd['palavra_quebrada'])}", "0")
        for it in qd["palavra_quebrada"][:4]: marcas.append((it["t"], f"quebrada: {it['texto'][:16]}", it["texto"]))
    # herói
    med, che = qd.get("heroi_quadros_medidos", 0), qd.get("heroi_quadros_cenario_cheio", 0)
    if che and che >= med:
        # cenário cheio na maior parte do vídeo: não existe fundo liso para separar o personagem
        L("Tamanho do herói (mediana da largura)", "aviso", f"não medido: cenário cheio em {che} de {che + med} quadros",
          "confira no olho se o personagem ocupa 60–85% da largura")
    elif qd.get("heroi_largura_mediana") is not None:
        hm = qd["heroi_largura_mediana"]
        L("Tamanho do herói (mediana da largura)", "ok" if hm >= cfg["heroi_min_largura"] else "aviso",
          f"{hm*100:.0f}% da largura", f"≥ {int(cfg['heroi_min_largura']*100)}% (referência: 60–85%)")
        if hm < cfg["heroi_min_largura"]:
            for it in qd["heroi_pequeno"][:4]: marcas.append((it["t"], f"herói {it['largura']*100:.0f}% da largura"))
    # paleta
    if cfg.get("paleta") and not cfg["tem_fotos"]:
        L("Fora da paleta", "ok" if not qd["fora_da_paleta"] else "aviso", f"{len(qd['fora_da_paleta'])} quadros",
          f"≤ {int(cfg['fora_paleta_max']*100)}% dos pixels")
        for it in qd["fora_da_paleta"][:6]: marcas.append((it["t"], f"fora da paleta {it['fora']*100:.0f}%"))
        if cfg.get("acento"):
            med = qd["acento_area_mediana"] or 0
            L("Área do acento (máx · mediana)", "ok" if cfg["acento_area_min"] <= med <= cfg["acento_area_max"] else "aviso",
              f"{(qd['acento_area_max'] or 0)*100:.1f}% · {(qd['acento_area_mediana'] or 0)*100:.1f}%",
              f"{int(cfg['acento_area_min']*100)}–{int(cfg['acento_area_max']*100)}% na mediana (alvo 2–6%)")
            if (qd["acento_area_mediana"] or 0) > cfg["acento_area_max"]:
                for it in qd["acento_acima_do_max"][:4]: marcas.append((it["t"], f"acento {it['area']*100:.0f}%"))
    # áudio
    if au.get("tem_audio"):
        ok_l = au["lufs"] is not None and abs(au["lufs"] - cfg["lufs_alvo"]) <= cfg["lufs_tol"]
        L("Volume (LUFS integrado)", "ok" if ok_l else "falhou", f"{au['lufs']}", f"{cfg['lufs_alvo']} ± {cfg['lufs_tol']}")
        L("Pico real", "ok" if au["true_peak"] is not None and au["true_peak"] <= cfg["true_peak_max"] else "falhou",
          f"{au['true_peak']} dBTP", f"≤ {cfg['true_peak_max']}")
        L("Celular (300 Hz–8 kHz)", "ok" if au["celular_lufs"] is not None and au["celular_lufs"] >= cfg["celular_min_lufs"] else "falhou",
          f"{au['celular_lufs']} LUFS", f"≥ {cfg['celular_min_lufs']}")
        L("Silêncio no meio", "ok" if not au["silencios_no_meio"] else "aviso",
          ", ".join(f"{a_}-{b_}s" for a_, b_ in au["silencios_no_meio"][:4]) or "0", f"> {cfg['silencio_max_s']} s só de propósito")
    if fala:
        if "similaridade_roteiro" in fala:
            L("Fala × roteiro (STT do áudio final)", "ok" if fala["similaridade_roteiro"] >= cfg["stt_min_similaridade"] else "falhou",
              f"{fala['similaridade_roteiro']*100:.0f}%", f"≥ {int(cfg['stt_min_similaridade']*100)}% (música alta come palavra)")
        else:
            L("Fala (STT do áudio final)", "aviso", "sem roteiro para comparar", "passe --roteiro")

    sheet = folha(video, info, marcas, out / "suspeitos.png", minis)
    falhas = sum(1 for l in linhas if l[1] == "falhou"); avisos = sum(1 for l in linhas if l[1] == "aviso")
    icone = {"ok": "✅", "aviso": "⚠️", "falhou": "❌"}
    md = [f"# QA: {Path(video).name}", "",
          f"**{'PASSOU' if not falhas else 'FALHOU'}**: {falhas} falha(s), {avisos} aviso(s). "
          "Checagem objetiva por código; não julga ideia, gosto nem som. Isso é com você.", "",
          "| Checagem | Estado | Medido | Alvo |", "|---|---|---|---|"]
    md += [f"| {n} | {icone[e]} {e} | {v} | {alvo} |" for n, e, v, alvo in linhas]
    if sheet: md += ["", f"Quadros suspeitos: `{Path(sheet).name}` ({len(marcas)} marcas, até 24 na folha). **Olhe só estes.**"]
    if fala: md += ["", "## Transcrição do áudio final", "", f"> {fala['transcricao']}"]
    (out / "QA.md").write_text("\n".join(md), encoding="utf-8")
    json.dump({"info": info, "config": cfg, "movimento": mov, "quadros": qd, "audio": au, "fala": fala,
               "falhas": falhas, "avisos": avisos}, open(out / "qa.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("\n".join(md))
    print(f"\n→ {out}", file=sys.stderr)
    sys.exit(1 if falhas else 0)

if __name__ == "__main__":
    main()
