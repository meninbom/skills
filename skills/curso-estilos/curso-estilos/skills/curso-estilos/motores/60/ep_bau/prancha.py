# junta os prints de ep_bau/_prints numa folha só: python ep_bau/prancha.py [colunas] [saida.jpg]
import sys
from pathlib import Path
from PIL import Image

AQUI = Path(__file__).resolve().parent
fs = sorted((AQUI / "_prints").glob("*.png")); ims = [Image.open(f) for f in fs]
if not ims: sys.exit("sem prints: rode antes  node ep_bau/prints.mjs")
w, h = ims[0].size; cols = int(sys.argv[1]) if len(sys.argv) > 1 else 6; rows = (len(ims) + cols - 1) // cols
S = Image.new("RGB", (cols * w, rows * h))
for i, im in enumerate(ims): S.paste(im, ((i % cols) * w, (i // cols) * h))
saida = Path(sys.argv[2]) if len(sys.argv) > 2 else AQUI / "_prancha.jpg"
S.save(saida, quality=85); print(saida, len(ims), "prints")
