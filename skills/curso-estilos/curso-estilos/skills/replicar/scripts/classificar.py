"""Replicar · compara uma análise com as assinaturas dos estilos conhecidos.

Uso: python classificar.py PASTA_DA_ANALISE [--json]
     python classificar.py --calibrar PASTA_PREVIAS ESTILOS.json [PASTA_ESTUDO]   (refaz assinaturas.json; só quem mantém o pacote)

A nota é um PRÉ-FILTRO por números (cor, traço, ritmo, movimento, texto). Quem decide é o olho:
compare folha.jpg com a prévia dos 3 primeiros e leia os "sinais" de cada um.
"""
import json
import os
import sys
from pathlib import Path

import numpy as np

sys.stdout.reconfigure(encoding="utf-8")
AQUI = Path(__file__).resolve().parent
ASSIN = AQUI.parent / "assinaturas.json"
DADOS = Path(os.environ.get("CURSO_ESTILOS_DADOS") or Path.home() / ".curso-estilos")
APREND = DADOS / "aprendidos" / "assinaturas.json"

# (nome, peso). Visual pesa mais que ritmo: ritmo muda com o tema, o traço não.
CAMPOS = [
    ("saturacao", 1.0), ("brilho", 0.7), ("contraste", 0.7), ("cores_90pct", 1.3), ("degrade_suave", 1.3),
    ("borda_densidade", 1.0), ("preto_frac", 0.8), ("contorno_escuro", 1.3),
    ("movimento", 0.7), ("parado_frac", 0.7), ("camera_desloc_px", 0.6), ("camera_movendo_frac", 0.8),
    ("cortes_por_min", 0.6), ("plano_medio_s", 0.4),
    ("texto_frac", 0.8), ("texto_chars_medio", 0.6), ("texto_base", 0.4), ("texto_topo", 0.4), ("vertical", 0.5),
]


def vetor(a):
    v, m, r, t = a["visual"], a.get("movimento", {}), a["ritmo"], a.get("texto", {})
    z = t.get("texto_zonas", {})
    d = {**{k: v.get(k) for k in ("saturacao", "brilho", "contraste", "cores_90pct", "degrade_suave", "borda_densidade", "preto_frac", "contorno_escuro")},
         **{k: m.get(k) for k in ("movimento", "parado_frac", "camera_desloc_px", "camera_movendo_frac")},
         "cortes_por_min": r["cortes_por_min"], "plano_medio_s": min(r["plano_medio_s"], 15),
         "texto_frac": t.get("texto_frac"), "texto_chars_medio": t.get("texto_chars_medio"),
         "texto_base": z.get("base"), "texto_topo": z.get("topo"),
         "vertical": 1.0 if a["meta"]["proporcao"] == "vertical" else 0.0}
    return {k: (None if x is None else float(x)) for k, x in d.items()}


def carregar():
    base = json.loads(ASSIN.read_text(encoding="utf-8"))
    refs = list(base["estilos"])
    if APREND.exists():
        for e in json.loads(APREND.read_text(encoding="utf-8")).get("estilos", []):
            if e.get("arquivo") and not Path(e["arquivo"]).is_absolute():   # guardado relativo à pasta de dados
                e = {**e, "arquivo": str(DADOS / e["arquivo"])}
            refs.append(e)
    return base, refs


def classificar(analise):
    base, refs = carregar()
    esc = base["escala"]
    x = vetor(analise)
    res = []
    for r in refs:
        s = w = 0.0
        longe = []
        for k, p in CAMPOS:
            a, b = x.get(k), r["vetor"].get(k)
            if a is None or b is None:
                continue
            dz = abs(a - b) / (esc[k] or 1.0)
            s += p * min(dz, 3.0)
            w += p
            if dz > 1.5:
                longe.append(k)
        res.append({"id": r["id"], "amostra": r.get("amostra", ""), "nome": r["nome"], "arquivo": r.get("arquivo"), "previa": r.get("previa"),
                    "tipo": r.get("tipo", "estilo"), "sinais": r.get("sinais", ""), "distancia": round(s / w, 3) if w else 9.0,
                    "diferencas": longe})
    res.sort(key=lambda z: z["distancia"])
    vistos, unico = set(), []
    for z in res:  # várias amostras por estilo: vale a mais próxima
        if z["id"] not in vistos:
            vistos.add(z["id"])
            unico.append(z)
    res = unico
    d1, d2 = res[0]["distancia"], res[1]["distancia"]
    lim = base.get("limites", {"alta": 0.45, "media": 0.75, "margem": 0.10})
    conf = "alta" if d1 <= lim["alta"] and d2 - d1 >= lim["margem"] else "média" if d1 <= lim["media"] else "baixa"
    for z in res:
        z["nota"] = round(max(0.0, 1 - z["distancia"] / (2 * lim["media"])) * 100)
    return {"confianca": conf, "candidatos": res[:5],
            "leitura": {"alta": "os números batem com um estilo conhecido; confirme no olho",
                        "média": "parecido com estilos conhecidos; decidir no olho entre os 3 primeiros",
                        "baixa": "nenhum estilo conhecido bate pelos números; se o olho também não achar, é estilo novo (aprender)"}[conf]}


VIDEO = {".mp4", ".mov", ".webm", ".mkv", ".m4v"}


def _amostras(pasta):
    """Vídeos de uma pasta de estudo + caminhos listados em refs.txt (um por linha; # é comentário)."""
    pasta = Path(pasta)
    if not pasta.is_dir():
        return []
    vs = [p for p in sorted(pasta.iterdir()) if p.suffix.lower() in VIDEO]
    lista = pasta / "refs.txt"
    if lista.exists():
        for l in lista.read_text(encoding="utf-8").splitlines():
            l = l.strip()
            if l and not l.startswith("#"):
                p = Path(l) if Path(l).is_absolute() else (pasta / l)
                if p.exists():
                    vs.append(p)
                else:
                    print("  não achei:", l)
    return vs


def calibrar(previas, estilos_json, estudo=None):
    """Assinaturas = prévia do catálogo + todos os vídeos de estudo/<id>/ (várias amostras por estilo)."""
    sys.path.insert(0, str(AQUI))
    from analisar import analisar
    cfg = json.loads(Path(estilos_json).read_text(encoding="utf-8"))
    sinais = json.loads((AQUI.parent / "sinais.json").read_text(encoding="utf-8"))
    out, tmp = [], DADOS / "_calibracao"
    for s in cfg["estilos"]:
        vids = []
        mp4 = Path(previas) / f"{s['previa']}.mp4"
        if not s.get("so_imagem") and mp4.exists():
            vids.append(mp4)
        if estudo:
            vids += _amostras(Path(estudo) / s["id"])
        for v in vids:
            chave = f"{s['id']}__{v.stem}_{v.stat().st_size}_v2"  # v2: detector de corte novo
            feito = tmp / chave / "analise.json"
            a = json.loads(feito.read_text(encoding="utf-8")) if feito.exists() else analisar(v, tmp / chave)[0]
            out.append({"id": s["id"], "nome": s["nome"], "arquivo": s["arquivo"], "previa": s["previa"], "amostra": v.stem,
                        "tipo": "ferramenta" if s["familia"] == 3 else "estilo", "sinais": sinais.get(s["id"], ""), "vetor": vetor(a)})
            print("ok", s["id"], v.name, flush=True)
    escala = {}
    for k, _ in CAMPOS:
        vals = np.array([e["vetor"][k] for e in out if e["vetor"].get(k) is not None])
        escala[k] = round(float(vals.std()) or 1.0, 5) if len(vals) else 1.0
    ASSIN.write_text(json.dumps({"feito_de": "prévias do catálogo + pasta de estudo", "limites": {"alta": 0.45, "media": 0.75, "margem": 0.10},
                                 "escala": escala, "estilos": out}, ensure_ascii=False, indent=1), encoding="utf-8")
    por = {}
    for e in out:
        por[e["id"]] = por.get(e["id"], 0) + 1
    print(f"{len(out)} amostras de {len(por)} estilos em {ASSIN}")
    print("amostras por estilo:", " ".join(f"{k}:{v}" for k, v in por.items()))


if __name__ == "__main__":
    if len(sys.argv) >= 4 and sys.argv[1] == "--calibrar":
        calibrar(sys.argv[2], sys.argv[3], sys.argv[4] if len(sys.argv) > 4 else None)
        sys.exit(0)
    pasta = Path(sys.argv[1])
    r = classificar(json.loads((pasta / "analise.json").read_text(encoding="utf-8")))
    (pasta / "classificacao.json").write_text(json.dumps(r, ensure_ascii=False, indent=2), encoding="utf-8")
    if "--json" in sys.argv:
        print(json.dumps(r, ensure_ascii=False, indent=2))
    else:
        print(f"Confiança pelos números: {r['confianca']} — {r['leitura']}\n")
        for i, c in enumerate(r["candidatos"], 1):
            print(f"{i}. [{c['id']}] {c['nome']} · nota {c['nota']} (distância {c['distancia']}" + (f", amostra {c['amostra']}" if c.get("amostra") else "") + ")" + (f" · difere em: {', '.join(c['diferencas'][:4])}" if c["diferencas"] else ""))
            if c["sinais"]:
                print(f"     sinais: {c['sinais']}")
