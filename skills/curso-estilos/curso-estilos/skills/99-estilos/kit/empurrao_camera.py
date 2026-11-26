"""Empurrão de câmera nos trechos parados de um filme feito em código (página com um <canvas> e window.render(t)).

Uso:
    python empurrao_camera.py FILME/index.html QA/qa.json
    python empurrao_camera.py FILME/index.html --trechos "3.2-6.0,14.5-18.1"
    python empurrao_camera.py FILME/index.html --tirar

Por quê: em vídeo curto, tela parada por mais de 1,5 s é onde o espectador sai. Muitos estilos seguram um quadro bonito
por 3 ou 4 segundos. Este script não mexe no desenho: ele faz o quadro inteiro crescer devagar (de 1,00 a 1,06) nos
trechos parados, alternando entre aproximar e afastar, com entrada e saída suaves. É o mesmo efeito de um operador
empurrando a câmera.

De onde vêm os trechos: do `qa.json` que a skill `checar-video` grava (campo movimento.trechos_parados_longos), ou
escritos à mão em --trechos, em segundos.

O script grava uma cópia do arquivo original ao lado (index.html.antes_do_empurrao) na primeira vez e pode ser
rodado de novo: ele troca o trecho que pôs, não empilha. Depois de rodar, renderize o filme outra vez.

Limite conhecido: a página precisa ter o <canvas> no HTML e a função window.render. Se o canvas é criado depois, por
um módulo, o script avisa e não mexe: nesse caso peça ao Claude para aplicar o mesmo empurrão dentro do código do filme.
"""
import json
import re
import shutil
import sys
from pathlib import Path

MARCA = re.compile(r"<script>/\* EMPURRAO-DE-CAMERA.*?</script>\n", re.S)


def trechos_do_qa(arq):
    j = json.loads(Path(arq).read_text(encoding="utf-8"))
    return [[float(a), float(b)] for a, b in (j.get("movimento") or {}).get("trechos_parados_longos") or []]


def main():
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help"):
        print(__doc__)
        return 0
    pagina = Path(args[0])
    if not pagina.exists():
        sys.exit(f"Não achei {pagina}")
    s = pagina.read_text(encoding="utf-8")
    limpo = MARCA.sub("", s)
    if "--tirar" in args:
        pagina.write_text(limpo, encoding="utf-8")
        print("Empurrão retirado." if limpo != s else "Não havia empurrão nesta página.")
        return 0
    if "--trechos" in args:
        bruto = args[args.index("--trechos") + 1]
        trechos = [[float(x) for x in par.split("-")] for par in bruto.split(",") if par.strip()]
    elif len(args) > 1:
        trechos = trechos_do_qa(args[1])
    else:
        sys.exit("Faltou o qa.json da checagem ou --trechos \"inicio-fim,...\" (em segundos).")
    trechos = [t for t in trechos if len(t) == 2 and t[1] > t[0]]
    if not trechos:
        print("Nenhum trecho parado para tratar. Nada mudou.")
        return 0
    if "<canvas" not in limpo:
        sys.exit("Esta página não tem <canvas> no HTML (ele deve ser criado por um módulo). Não mexi em nada: "
                 "peça ao Claude para aplicar o empurrão dentro do código do filme.")
    if "</body>" not in limpo:
        sys.exit("Não achei </body> na página. Não mexi em nada.")
    copia = pagina.with_name(pagina.name + ".antes_do_empurrao")
    if not copia.exists():
        shutil.copy(pagina, copia)
    bloco = f"""<script>/* EMPURRAO-DE-CAMERA: os trechos parados ganham um zoom lento (1,00 a 1,06), alternando aproximar e afastar */
(function () {{
  const TRECHOS = {json.dumps(trechos)};
  const cv = document.querySelector('canvas');
  if (!cv) return;
  cv.style.transformOrigin = '50% 45%';
  const escala = (t) => {{
    let s = 1;
    TRECHOS.forEach(([a, b], k) => {{
      const u = Math.min(1, Math.max(0, (t - a + 0.25) / (b - a + 0.5)));
      const e = u * u * (3 - 2 * u);            // entra e sai suave
      s += (k % 2 ? -1 : 1) * 0.06 * e;
    }});
    return s;
  }};
  const ligar = () => {{
    if (!window.render || window.render.__empurrao) return setTimeout(ligar, 20);
    const original = window.render;
    const novo = (t) => {{ const r = original(t); cv.style.transform = 'scale(' + escala(t).toFixed(5) + ')'; return r; }};
    novo.__empurrao = 1;
    window.render = novo;
  }};
  ligar();
}})();</script>
"""
    pagina.write_text(limpo.replace("</body>", bloco + "</body>"), encoding="utf-8")
    print(f"Empurrão posto em {len(trechos)} trecho(s): " + ", ".join(f"{a:.1f}-{b:.1f} s" for a, b in trechos))
    print("Agora renderize o filme de novo e passe a checagem outra vez.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
