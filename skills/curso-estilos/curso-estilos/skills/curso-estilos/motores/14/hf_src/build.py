# Monta hf/index.html: injeta as grades dos adesivos de pixel (img/px/icones.json) no src.html.
#   python hf_src/build.py
import json, pathlib
AQUI = pathlib.Path(__file__).resolve().parent
RAIZ = AQUI.parent
s = (AQUI / "src.html").read_text(encoding="utf-8")
ic = json.loads((RAIZ / "img" / "px" / "icones.json").read_text(encoding="utf-8"))
(RAIZ / "hf" / "index.html").write_text(s.replace("/*ICONES*/null", json.dumps(ic)), encoding="utf-8")
print("ok hf/index.html")
