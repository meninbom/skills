# Converte os PNG dos packs em RGBA cru (assets/*.rgba + assets/index.json) para o motor em Node.
# Os packs NÃO vêm no motor (a licença deles proíbe redistribuir os arquivos). Baixe do itch.io e descompacte
# os três dentro de sprites/packs/ (qualquer nome de subpasta serve; o script procura pelos arquivos):
#   1. "Fantasy Knight - Free Pixelart Animated Character" (aamatniekss)  -> .../Colour1/Outline/120x80_PNGSheets/_Idle.png ...
#   2. "Free Pixelart Platformer Tileset" (aamatniekss)                   -> .../Background/CloudsBack.png, .../Foreground/Tileset.png ...
#   3. "Free Treasure Chest" (Otsoga)                                     -> .../Chest/Chest.png, .../Chest/Open/NoDust/OpenChest1.png ...
# Uso (na pasta do motor):  python sprites/prep.py        (outra pasta de packs: variável de ambiente PACKS)
import glob, json, os, re, sys
from pathlib import Path
from PIL import Image

AQUI = Path(__file__).resolve().parent
PACKS = Path(os.environ.get("PACKS", AQUI / "packs"))
SAIDA = AQUI / "assets"


def acha(padrao, prefere=()):
    c = sorted(glob.glob(str(PACKS / "**" / padrao), recursive=True))
    if not c:
        sys.exit(f"não achei {padrao} dentro de {PACKS}. Veja o cabeçalho deste arquivo.")
    for p in prefere:
        bons = [x for x in c if p in x.replace("\\", "/")]
        if bons:
            c = bons
    return Path(c[0])


op = lambda p: Image.open(p).convert("RGBA")
def grade(img, fw, fh): return [img.crop((i * fw, 0, i * fw + fw, fh)) for i in range(img.width // fw)]
def recorte(img, box):
    c = img.crop(box); b = c.getbbox(); return c.crop(b) if b else c
def nums(pasta, pat):
    return sorted(glob.glob(str(pasta / pat)), key=lambda f: int(re.findall(r"(\d+)\.png$", f)[0]))


L = {}
# 1. cavaleiro: folhas com quadros de 120x80
K = acha("120x80_PNGSheets/_Idle.png", prefere=("Colour1", "Outline")).parent
for nome, arq in [("kIdle", "_Idle"), ("kRun", "_Run"), ("kCrouch", "_CrouchFull"), ("kDash", "_Dash"), ("kAtk", "_AttackNoMovement"),
                  ("kAtk2", "_Attack2NoMovement"), ("kCombo", "_AttackComboNoMovement"), ("kHit", "_Hit"), ("kRoll", "_Roll"),
                  ("kJump", "_Jump"), ("kFall", "_Fall"), ("kTurn", "_TurnAround"), ("kDeath", "_DeathNoMovement")]:
    L[nome] = grade(op(K / (arq + ".png")), 120, 80)
# 2. cenário: 4 camadas de fundo + peças recortadas do tileset
T = acha("Foreground/Tileset.png").parent.parent
for nome, arq in [("kCeu", "CloudsBack"), ("kNuvem", "CloudsFront"), ("kMont", "BGBack"), ("kMorro", "BGFront")]:
    L[nome] = [op(T / "Background" / (arq + ".png"))]
ts = op(T / "Foreground" / "Tileset.png")
col = Image.new("RGBA", (16, 96), (0, 0, 0, 0))            # coluna de grama + terra, repetida na horizontal
col.alpha_composite(ts.crop((16, 0, 32, 16)), (0, 6))
for y in range(22, 96, 16): col.alpha_composite(ts.crop((16, 16, 32, 32)), (0, y))
col.alpha_composite(ts.crop((112, 28, 128, 44)), (0, 0))
L["kChao"] = [col]
L["kCerca"] = [recorte(ts, (96, 48, 160, 64))]
L["kMoita"] = [recorte(ts, (80, 80, 128, 96))]
tr = op(T / "Foreground" / "Trees.png")
L["kArvore"] = [recorte(tr, (0, 0, 128, 128)), recorte(tr, (128, 0, 256, 128))]
# 3. baú
C = acha("Chest/Open/NoDust/OpenChest1.png").parent.parent.parent
L["bau"] = [op(C / "Chest.png")]
L["bauAbre"] = [op(f) for f in nums(C / "Open" / "NoDust", "OpenChest*.png")]
L["bauAberto"] = [op(C / "ChestOpen.png")]
L["bauOuro"] = [op(f) for f in nums(C / "Open" / "Gold", "Open(GoldLoot)*.png")]
L["brilho"] = [op(f) for f in nums(C / "ItemSparkle", "ItemSparkle*.png")]

SAIDA.mkdir(exist_ok=True)
for velho in SAIDA.glob("*.rgba"): velho.unlink()
idx = {}
for k, ims in L.items():
    idx[k] = []
    for i, im in enumerate(ims):
        fn = f"assets/{k}_{i}.rgba"; (AQUI / fn).write_bytes(im.tobytes()); idx[k].append([fn, im.width, im.height])
json.dump(idx, open(SAIDA / "index.json", "w"), indent=0)
(SAIDA / "ORIGEM.txt").write_text("packs\n")
for k, v in idx.items(): print(k, len(v), v[0][1:])
