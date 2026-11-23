"""Replicar · análise local, grátis e MUDA de um vídeo de referência.

Uso: python analisar.py VIDEO.mp4 [--out PASTA] [--voz] [--sem-ocr] [--quadros 24]

Gera em PASTA (padrão: VIDEO_replicar/):
  analise.json  tudo que foi medido
  folha.jpg     quadros-amostra numerados com o tempo (é o que o Claude olha)
  cortes.jpg    1º quadro de cada plano (até 40)

Nunca toca o áudio: só mede. --voz separa a voz (demucs, CPU) e transcreve (faster-whisper).
Precisa: ffmpeg/ffprobe no PATH, numpy, opencv-python, pillow. Opcionais: librosa (BPM),
rapidocr_onnxruntime (texto na tela), demucs + faster-whisper (voz).
"""
import argparse
import json
import math
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding="utf-8")


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", **kw)


def ffprobe(v):
    r = run(["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(v)])
    j = json.loads(r.stdout or "{}")
    vs = next((s for s in j.get("streams", []) if s.get("codec_type") == "video"), {})
    au = next((s for s in j.get("streams", []) if s.get("codec_type") == "audio"), None)
    num, den = (vs.get("avg_frame_rate") or "0/1").split("/")
    fps = float(num) / float(den) if float(den) else 0.0
    w, h = int(vs.get("width", 0)), int(vs.get("height", 0))
    return {
        "duracao_s": round(float(j.get("format", {}).get("duration", 0) or 0), 2),
        "fps": round(fps, 3), "largura": w, "altura": h,
        "proporcao": "vertical" if h > w * 1.1 else "horizontal" if w > h * 1.1 else "quadrado",
        "pix_fmt": vs.get("pix_fmt"), "codec": vs.get("codec_name"),
        "tem_audio": au is not None, "audio_hz": int(au["sample_rate"]) if au and au.get("sample_rate") else None,
    }


def fonte(tam=13):
    """Fonte com acento (Ê, É, Ç). Sem nenhuma no sistema, cai na fonte embutida do Pillow."""
    for nome in ("arial.ttf", "segoeui.ttf", "DejaVuSans.ttf", "/System/Library/Fonts/Helvetica.ttc",
                 "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"):
        try:
            return ImageFont.truetype(nome, tam)
        except OSError:
            pass
    try:
        return ImageFont.load_default(tam)
    except TypeError:
        return ImageFont.load_default()


def _cortes_por_salto(v, fps=15, larg=64):
    """Corte seco que a medida de cena do ffmpeg perde (plano novo com a mesma paleta):
    um quadro que muda muito mais que os vizinhos."""
    fr = [f.astype(np.float32) for f in pipe(v, f"fps={fps}", larg, cor=False)]
    d = np.array([np.abs(fr[i] - fr[i - 1]).mean() for i in range(1, len(fr))])
    ts = []
    for i in range(len(d)):
        viz = np.concatenate([d[max(0, i - 4):i], d[i + 1:i + 5]])
        if len(viz) and d[i] > 18 and d[i] > 5 * max(float(np.median(viz)), 0.5):
            ts.append((i + 1) / fps)
    return ts


def cortes(v, dur, limiar=0.32):
    r = run(["ffmpeg", "-hide_banner", "-i", str(v), "-an", "-vf", f"scale=320:-2,select='gt(scene,{limiar})',showinfo", "-f", "null", "-"])
    ts = [float(m) for m in re.findall(r"pts_time:([0-9.]+)", r.stderr)]
    ts = sorted(ts + _cortes_por_salto(v))
    ts = [t for t in ts if 0.15 < t < dur - 0.1]
    junto = []
    for t in ts:  # os dois métodos marcam o mesmo corte com poucos quadros de diferença
        if not junto or t - junto[-1] > 0.3:
            junto.append(round(t, 3))
    ts = junto
    planos = np.diff([0.0] + ts + [dur]) if dur else np.array([])
    return ts, {
        "n_cortes": len(ts),
        "cortes_por_min": round(len(ts) / dur * 60, 1) if dur else 0,
        "plano_medio_s": round(float(planos.mean()), 2) if len(planos) else dur,
        "plano_mais_longo_s": round(float(planos.max()), 2) if len(planos) else dur,
        "plano_mais_curto_s": round(float(planos.min()), 2) if len(planos) else dur,
    }


def _dim(v):
    r = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:stream_side_data=rotation", "-of", "json", str(v)])
    st = json.loads(r.stdout)["streams"][0]
    w, h = int(st["width"]), int(st["height"])
    rot = abs(int(float((st.get("side_data_list") or [{}])[0].get("rotation", 0) or 0)))
    return (h, w) if rot in (90, 270) else (w, h)


def pipe(v, vf, larg, cor=True):
    """Decodifica o vídeo UMA vez pelo ffmpeg e devolve os quadros reduzidos (rápido mesmo em 1080p/4K)."""
    w, h = _dim(v)
    H = max(2, int(round(h * larg / w / 2)) * 2)
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(v), "-an", "-vf", f"{vf},scale={larg}:{H}",
           "-pix_fmt", "bgr24" if cor else "gray", "-f", "rawvideo", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    n = larg * H * (3 if cor else 1)
    while True:
        buf = p.stdout.read(n)
        if len(buf) < n:
            break
        yield np.frombuffer(buf, np.uint8).reshape((H, larg, 3) if cor else (H, larg)).copy()
    p.stdout.close()
    p.wait()


def ler_quadros(v, tempos, largura=270):
    """Quadros em instantes soltos (busca rápida do ffmpeg, um processo por quadro)."""
    w, h = _dim(v)
    H = max(2, int(round(h * largura / w / 2)) * 2)
    out = []
    for t in tempos:
        r = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", f"{max(0, t):.3f}", "-i", str(v), "-an", "-frames:v", "1",
                            "-vf", f"scale={largura}:{H}", "-pix_fmt", "bgr24", "-f", "rawvideo", "-"], capture_output=True)
        if len(r.stdout) == largura * H * 3:
            out.append((t, np.frombuffer(r.stdout, np.uint8).reshape(H, largura, 3).copy()))
    return out


def amostra(v, dur, n, largura=270):
    """n quadros igualmente espaçados, numa passada só."""
    qs = list(pipe(v, f"fps={n}/{dur:.3f}", largura))[:n]
    return [(dur * (i + 0.5) / n, f) for i, f in enumerate(qs)]


def folha(quadros, arq, colunas=6, larg=240):
    if not quadros:
        return
    h = int(quadros[0][1].shape[0] * larg / quadros[0][1].shape[1])
    linhas = math.ceil(len(quadros) / colunas)
    im = Image.new("RGB", (colunas * larg, linhas * h), (16, 16, 16))
    d = ImageDraw.Draw(im)
    fo = fonte(12)
    for i, (t, f) in enumerate(quadros):
        x, y = (i % colunas) * larg, (i // colunas) * h
        im.paste(Image.fromarray(cv2.cvtColor(cv2.resize(f, (larg, h)), cv2.COLOR_BGR2RGB)), (x, y))
        d.rectangle([x, y, x + 74, y + 16], fill=(0, 0, 0))
        d.text((x + 3, y + 1), f"{i + 1} · {t:.1f}s", fill=(255, 255, 255), font=fo)
    im.save(arq, quality=88)


def visual(quadros):
    """Cor, chapado × pintado, contorno. Quadros em BGR, ~270 px de largura."""
    sat, bri, con, ncor, borda, preto, cont, grad = [], [], [], [], [], [], [], []
    pool = []
    for _, f in quadros:
        hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
        g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
        sat.append(hsv[..., 1].mean() / 255)
        bri.append(g.mean() / 255)
        con.append(g.std() / 255)
        q = (f // 32).reshape(-1, 3)  # 8 níveis por canal
        _, cnt = np.unique(q[:, 0] * 64 + q[:, 1] * 8 + q[:, 2], return_counts=True)
        cnt = np.sort(cnt)[::-1] / cnt.sum()
        ncor.append(int(np.searchsorted(np.cumsum(cnt), 0.9) + 1))  # cores que cobrem 90% do quadro
        e = cv2.Canny(g, 80, 160) > 0
        borda.append(e.mean())
        preto.append((g < 28).mean())
        viz = cv2.erode(g, np.ones((3, 3), np.uint8))
        cont.append(float((viz[e] < 50).mean()) if e.any() else 0.0)  # borda com traço escuro = contorno
        # degradê suave: fração de pixels com gradiente pequeno e não nulo (pintura/3D com luz) × zero (chapado)
        gx = np.abs(cv2.Sobel(g, cv2.CV_32F, 1, 0)) + np.abs(cv2.Sobel(g, cv2.CV_32F, 0, 1))
        grad.append(float(((gx > 1) & (gx < 24)).mean()))
        pool.append(cv2.resize(f, (48, 86)).reshape(-1, 3))
    pool = np.float32(np.vstack(pool))
    k = 6
    _, lab, cen = cv2.kmeans(pool, k, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0), 3, cv2.KMEANS_PP_CENTERS)
    fr = np.bincount(lab.ravel(), minlength=k) / len(lab)
    paleta = [{"hex": "#%02x%02x%02x" % (int(c[2]), int(c[1]), int(c[0])), "fracao": round(float(fr[i]), 3)} for i, c in enumerate(cen)]
    paleta.sort(key=lambda x: -x["fracao"])
    m = lambda a: round(float(np.mean(a)), 4)
    return {
        "saturacao": m(sat), "brilho": m(bri), "contraste": m(con),
        "cores_90pct": m(ncor), "degrade_suave": m(grad),
        "borda_densidade": m(borda), "preto_frac": m(preto), "contorno_escuro": m(cont),
        "variacao_brilho_entre_quadros": round(float(np.std(bri)), 4),
        "paleta": paleta,
    }


def movimento(v, dur, fps_amostra=8, larg=96):
    """Energia de movimento, tempo parado e deslocamento global (câmera) por correlação de fase."""
    ant, dif, desl, zoom = None, [], [], []
    hann = None
    for g8 in pipe(v, f"fps={fps_amostra}", larg, cor=False):
        g = g8.astype(np.float32)
        if ant is not None:
            d = float(np.abs(g - ant).mean())
            dif.append(d)
            if d < 40:  # ignora corte seco
                if hann is None:
                    hann = cv2.createHanningWindow((g.shape[1], g.shape[0]), cv2.CV_32F)
                (dx, dy), resp = cv2.phaseCorrelate(ant, g, hann)
                desl.append(math.hypot(dx, dy) if resp > 0.08 else 0.0)
                c = slice(g.shape[0] // 3, 2 * g.shape[0] // 3), slice(g.shape[1] // 3, 2 * g.shape[1] // 3)
                dc, da = np.abs(g[c] - ant[c]).mean(), np.abs(g - ant).mean()
                zoom.append(dc / (da + 1e-6))
        ant = g
    if not dif:
        return {}
    dif = np.array(dif)
    return {
        "movimento": round(float(dif.mean()), 3),
        "parado_frac": round(float((dif < 0.35).mean()), 3),
        "camera_desloc_px": round(float(np.mean(desl)) if desl else 0.0, 3),  # em 96 px de largura, por 1/8 s
        "camera_movendo_frac": round(float(np.mean(np.array(desl) > 0.4)) if desl else 0.0, 3),
        "centro_vs_quadro": round(float(np.mean(zoom)) if zoom else 1.0, 3),
    }


def texto(quadros_full):
    try:
        from rapidocr_onnxruntime import RapidOCR
    except Exception:
        return {"ocr": "indisponível (pip install rapidocr_onnxruntime)"}
    ocr = RapidOCR()
    com, chars, zonas, alt, exemplos = 0, [], {"topo": 0, "meio": 0, "base": 0}, [], []
    for _, f in quadros_full:
        res, _ = ocr(f)
        if not res:
            chars.append(0)
            continue
        H = f.shape[0]
        com += 1
        chars.append(sum(len(r[1]) for r in res))
        for box, txt, conf in res:
            ys = [p[1] for p in box]
            cy, hh = sum(ys) / 4 / H, (max(ys) - min(ys)) / H
            zonas["topo" if cy < 0.3 else "base" if cy > 0.7 else "meio"] += 1
            alt.append(hh)
            if len(exemplos) < 12 and len(txt.strip()) > 1:
                exemplos.append(txt.strip()[:40])
    n = max(1, len(quadros_full))
    tot = max(1, sum(zonas.values()))
    return {
        "texto_frac": round(com / n, 3), "texto_chars_medio": round(float(np.mean(chars)), 1),
        "texto_altura_media": round(float(np.mean(alt)), 4) if alt else 0.0,
        "texto_zonas": {k: round(v / tot, 2) for k, v in zonas.items()}, "texto_exemplos": exemplos,
    }


def audio(v, tmp, com_voz):
    wav = Path(tmp) / "a.wav"
    run(["ffmpeg", "-y", "-hide_banner", "-i", str(v), "-vn", "-ac", "1", "-ar", "22050", str(wav)])
    if not wav.exists() or wav.stat().st_size < 2000:
        return {"tem_audio": False}
    import soundfile as sf
    y, sr = sf.read(str(wav), dtype="float32")
    if len(y) < sr // 2:
        return {"tem_audio": False}
    rms = np.sqrt(np.convolve(y ** 2, np.ones(sr // 20) / (sr // 20), "same") + 1e-12)
    db = 20 * np.log10(rms + 1e-9)
    out = {
        "tem_audio": True,
        "volume_medio_db": round(float(20 * np.log10(np.sqrt((y ** 2).mean()) + 1e-9)), 1),
        "silencio_frac": round(float((db < -45).mean()), 3),
        "dinamica_db": round(float(np.percentile(db, 95) - np.percentile(db, 10)), 1),
    }
    try:
        import librosa
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        on = librosa.onset.onset_strength(y=y, sr=sr)
        out["bpm"] = round(float(np.atleast_1d(tempo)[0]), 1)
        out["ataques_por_s"] = round(float(len(librosa.onset.onset_detect(onset_envelope=on, sr=sr)) / (len(y) / sr)), 2)
        out["brilho_espectral_hz"] = round(float(librosa.feature.spectral_centroid(y=y, sr=sr).mean()), 0)
    except Exception as e:
        out["bpm"] = None
        out["bpm_erro"] = type(e).__name__
    if com_voz:
        try:
            out["voz"] = voz(v, tmp, len(y) / sr)
        except Exception as e:  # a análise não pode morrer por causa da voz
            out["voz"] = {"erro": f"{type(e).__name__}: {str(e)[:160]}"}
    return out


def voz(v, tmp, dur):
    """Regra da casa: checar a voz na referência = separar o stem de voz e transcrever o stem."""
    alvo = Path(tmp) / "a44.wav"
    run(["ffmpeg", "-y", "-hide_banner", "-i", str(v), "-vn", "-ac", "2", "-ar", "44100", str(alvo)])
    stem, sep = alvo, "sem demucs (transcrição da mix inteira)"
    r = run([sys.executable, "-m", "demucs", "--two-stems", "vocals", "-d", "cpu", "-o", str(Path(tmp) / "dm"), str(alvo)])
    achou = list((Path(tmp) / "dm").rglob("vocals.wav"))
    if achou:
        stem, sep = achou[0], "demucs (stem vocals)"
    try:
        from faster_whisper import WhisperModel
    except Exception:
        return {"separacao": sep, "stt": "indisponível (pip install faster-whisper)"}
    model = WhisperModel("small", device="cpu", compute_type="int8")
    # carrega o áudio por conta própria (16 kHz mono): não depende da versão do PyAV instalada
    w16 = Path(tmp) / "stem16.wav"
    run(["ffmpeg", "-y", "-hide_banner", "-i", str(stem), "-ac", "1", "-ar", "16000", str(w16)])
    import soundfile as sf
    onda, _ = sf.read(str(w16), dtype="float32")
    segs, info = model.transcribe(onda, vad_filter=True, word_timestamps=True)
    palavras, falado, trechos = 0, 0.0, []
    for s in segs:
        palavras += len(s.words or s.text.split())
        falado += s.end - s.start
        if len(trechos) < 6:
            trechos.append(s.text.strip()[:90])
    return {
        "separacao": sep, "tem_voz": palavras >= 4, "idioma": info.language, "palavras": palavras,
        "fala_frac": round(falado / dur, 2) if dur else 0,
        "palavras_por_min": round(palavras / dur * 60) if dur else 0,
        "palavras_por_min_falando": round(palavras / falado * 60) if falado > 1 else 0,
        "inicio_do_texto": trechos,  # só para identificar o formato; não é para copiar
    }


def analisar(video, out=None, com_voz=False, sem_ocr=False, n_quadros=24):
    video = Path(video)
    out = Path(out) if out else video.with_name(video.stem + "_replicar")
    out.mkdir(parents=True, exist_ok=True)
    meta = ffprobe(video)
    dur = meta["duracao_s"]
    if not dur or not meta["largura"]:
        raise SystemExit("Não consegui ler o vídeo (ffprobe).")
    ts, ritmo = cortes(video, dur)
    qs = amostra(video, dur, n_quadros, 270)
    folha(qs, out / "folha.jpg")
    folha(ler_quadros(video, [0.0] + [t + 0.05 for t in ts][:39], largura=270), out / "cortes.jpg", colunas=8, larg=180)
    res = {"arquivo": video.name, "meta": meta, "ritmo": ritmo, "cortes_s": [round(t, 2) for t in ts],
           "visual": visual(qs), "movimento": movimento(video, dur)}
    if not sem_ocr:
        res["texto"] = texto(amostra(video, dur, 10, 540))
    with tempfile.TemporaryDirectory() as tmp:
        res["audio"] = audio(video, tmp, com_voz) if meta["tem_audio"] else {"tem_audio": False}
    (out / "analise.json").write_text(json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8")
    return res, out


def resumo(r):
    m, t, v, mv, a = r["meta"], r["ritmo"], r["visual"], r["movimento"], r["audio"]
    L = [f"{r['arquivo']}: {m['duracao_s']} s · {m['largura']}×{m['altura']} ({m['proporcao']}) · {m['fps']} qps",
         f"Ritmo: {t['n_cortes']} cortes ({t['cortes_por_min']}/min) · plano médio {t['plano_medio_s']} s · mais longo {t['plano_mais_longo_s']} s",
         f"Imagem: saturação {v['saturacao']:.2f} · brilho {v['brilho']:.2f} · cores p/ 90% {v['cores_90pct']:.0f} · contorno escuro {v['contorno_escuro']:.2f}",
         "Paleta: " + " ".join(f"{p['hex']} {p['fracao']:.0%}" for p in v["paleta"]),
         f"Movimento: {mv.get('movimento')} · parado {mv.get('parado_frac', 0):.0%} · câmera movendo {mv.get('camera_movendo_frac', 0):.0%}"]
    x = r.get("texto", {})
    if "texto_frac" in x:
        L.append(f"Texto na tela: em {x['texto_frac']:.0%} dos quadros · {x['texto_chars_medio']} letras · zonas {x['texto_zonas']}")
    if a.get("tem_audio"):
        L.append(f"Som: BPM {a.get('bpm')} · silêncio {a['silencio_frac']:.0%} · ataques/s {a.get('ataques_por_s')}")
        z = a.get("voz")
        if z and "erro" in z:
            L.append(f"Voz: NÃO MEDIDA ({z['erro']})")
        elif z and "stt" in z:
            L.append(f"Voz: NÃO MEDIDA ({z['stt']})")
        elif z and "tem_voz" in z:
            L.append(f"Voz ({z['separacao']}): {'sim' if z['tem_voz'] else 'não'} · {z.get('idioma')} · {z.get('palavras_por_min_falando')} palavras/min falando · fala em {z.get('fala_frac', 0):.0%} do tempo")
    else:
        L.append("Som: sem áudio")
    return "\n".join(L)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--out")
    ap.add_argument("--voz", action="store_true", help="separa a voz (demucs, CPU) e transcreve (faster-whisper)")
    ap.add_argument("--sem-ocr", action="store_true")
    ap.add_argument("--quadros", type=int, default=24)
    a = ap.parse_args()
    r, out = analisar(a.video, a.out, a.voz, a.sem_ocr, a.quadros)
    print(resumo(r))
    print(f"\nPasta: {out}\nOlhe folha.jpg e cortes.jpg antes de classificar.")
