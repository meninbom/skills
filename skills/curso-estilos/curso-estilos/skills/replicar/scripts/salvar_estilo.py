"""Replicar · registra um estilo aprendido (só depois de o aluno aprovar a réplica).

Uso: python salvar_estilo.py PASTA_DA_ANALISE --slug nome_curto --nome "Nome do estilo" --ficha FICHA.md
       [--motor PASTA_DO_MOTOR] [--base ID_DO_ESTILO_MAIS_PROXIMO] [--sinais "o que se vê"] [--previa REPLICA.mp4]
       [--ignorar "pasta_ou_padrao,outro"] [--so "pasta,arquivo"] [--trecho PASTA_DO_LADO_A_LADO]

--trecho: quando a réplica é só um trecho da referência (um plano de um vídeo com vários), passe a pasta
"<replica>_lado" que o lado_a_lado.py criou. A assinatura do estilo passa a ser a do trecho, não a do vídeo inteiro.
--so: copia do motor apenas os itens listados (ex.: --so "replica,lib,render.mjs,package.json"). Sem ele vai a pasta
toda, menos o que está em --ignorar.

Do motor vai só o código: ficam de fora node_modules, saídas de render (saida/, quadros/, frames/, out/, tmp/),
vídeo e áudio. Exemplos e templates do motor de partida que a réplica não usa: passe em --ignorar.

Grava em ~/.curso-estilos/aprendidos/<slug>/ (ficha.md, analise.json, folha.jpg, motor/, previa.mp4 muda)
e acrescenta a assinatura em ~/.curso-estilos/aprendidos/assinaturas.json. O catálogo e o classificador
passam a enxergar o estilo. Não escreve nada dentro da pasta do plugin.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(Path(__file__).resolve().parent))
from classificar import vetor  # noqa: E402

DADOS = Path(os.environ.get("CURSO_ESTILOS_DADOS") or Path.home() / ".curso-estilos")
ap = argparse.ArgumentParser()
ap.add_argument("pasta")
ap.add_argument("--slug", required=True)
ap.add_argument("--nome", required=True)
ap.add_argument("--ficha", required=True)
ap.add_argument("--motor")
ap.add_argument("--base", default="")
ap.add_argument("--sinais", default="")
ap.add_argument("--previa")
ap.add_argument("--ignorar", default="", help="nomes ou padrões extras a deixar de fora do motor, separados por vírgula")
ap.add_argument("--so", default="", help="copia do motor só estes itens (pastas ou arquivos da raiz), separados por vírgula")
ap.add_argument("--trecho", help="pasta <replica>_lado do lado_a_lado.py: assina o estilo pelo trecho replicado")
a = ap.parse_args()

pasta = Path(a.pasta)
analise = json.loads((pasta / "analise.json").read_text(encoding="utf-8"))
assina = analise
if a.trecho:
    arq_t = Path(a.trecho) / "_ref" / "analise.json"
    if not arq_t.exists():
        raise SystemExit(f"Não achei {arq_t}. Passe em --trecho a pasta que o lado_a_lado.py criou (termina em _lado).")
    assina = json.loads(arq_t.read_text(encoding="utf-8"))
    if "texto" not in assina and "texto" in analise:   # o trecho é medido sem ler texto: aproveita o do vídeo inteiro
        assina["texto"] = analise["texto"]
dest = DADOS / "aprendidos" / a.slug
if dest.exists():  # nunca apagar: a versão anterior vai para _antigo
    ant = DADOS / "aprendidos" / "_antigo"
    ant.mkdir(parents=True, exist_ok=True)
    n = 1
    while (ant / f"{a.slug}_{n}").exists():
        n += 1
    shutil.move(str(dest), str(ant / f"{a.slug}_{n}"))
dest.mkdir(parents=True)
shutil.copy(a.ficha, dest / "ficha.md")
shutil.copy(pasta / "analise.json", dest / "analise.json")
if a.trecho:
    (dest / "analise_trecho.json").write_text(json.dumps(assina, ensure_ascii=False, indent=2), encoding="utf-8")
if (pasta / "folha.jpg").exists():
    shutil.copy(pasta / "folha.jpg", dest / "folha.jpg")
if a.motor:
    fora = ["node_modules", ".env*", "__pycache__", ".cache", "saida", "saidas", "quadros", "frames", "_quadros", "out", "tmp", "renders",
            "*_replicar", "*_mi" + "mic", "*_lado",   # o segundo é o nome antigo da pasta de análise (versões até a 0.3.2)
             "*_qa", "*.mp4", "*.mov", "*.webm", "*.wav", "*.mp3", "*.m4a", "*.log", "DEMO_RESULTADO.json"]
    fora += [p.strip() for p in a.ignorar.split(",") if p.strip()]
    so = [p.strip().strip("/").strip(chr(92)) for p in a.so.split(",") if p.strip()]
    if so:
        faltam = [n for n in so if not (Path(a.motor) / n).exists()]
        if faltam:
            raise SystemExit("--so: não existe na pasta do motor: " + ", ".join(faltam))
        (dest / "motor").mkdir()
        for n in so:
            o = Path(a.motor) / n
            if o.is_dir():
                shutil.copytree(o, dest / "motor" / n, ignore=shutil.ignore_patterns(*fora))
            else:
                (dest / "motor" / n).parent.mkdir(parents=True, exist_ok=True)
                shutil.copy(o, dest / "motor" / n)
    else:
        shutil.copytree(a.motor, dest / "motor", ignore=shutil.ignore_patterns(*fora))
        guias = sorted(p.name for p in (dest / "motor").iterdir() if p.is_file() and p.suffix.lower() == ".md")
        if guias:
            print("  Foram junto guias do motor de partida (" + ", ".join(guias) + "). Se não são da réplica, rode de novo com --so "
                  "listando só o que a réplica usa.")
    itens = sorted(((sum(f.stat().st_size for f in p.rglob("*") if f.is_file()) if p.is_dir() else p.stat().st_size), p.name)
                   for p in (dest / "motor").iterdir())[::-1]
    total = sum(t for t, _ in itens)
    print(f"Motor copiado: {total / 1e6:.1f} MB")
    if total > 2e6:
        print("  Maiores itens (se algum não é da réplica, rode de novo com --ignorar \"nome\"):")
        for t, n in itens[:6]:
            print(f"    {t / 1e6:.1f} MB  {n}")
if a.previa:
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", a.previa, "-t", "15", "-an", "-vf", "scale=480:-2",
                    "-c:v", "libx264", "-crf", "26", "-pix_fmt", "yuv420p", str(dest / "previa.mp4")])
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-ss", "2", "-i", a.previa, "-frames:v", "1", "-vf", "scale=480:-2", str(dest / "previa.jpg")])

reg = DADOS / "aprendidos" / "assinaturas.json"
j = json.loads(reg.read_text(encoding="utf-8")) if reg.exists() else {"estilos": []}
j["estilos"] = [e for e in j["estilos"] if e["id"] != a.slug]
j["estilos"].append({"id": a.slug, "nome": a.nome, "arquivo": f"aprendidos/{a.slug}/ficha.md", "tipo": "aprendido",   # relativo à pasta de dados: mover a pasta não quebra
                     "base": a.base, "sinais": a.sinais, "vetor": vetor(assina), "assinatura_de": "trecho" if a.trecho else "video inteiro"})
reg.write_text(json.dumps(j, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"Estilo '{a.nome}' salvo em {dest}\n{len(j['estilos'])} estilo(s) aprendido(s) no catálogo.")
