# Baixa o conjunto COMPLETO de assets CC0 da Poly Haven pela API oficial (polyhaven.com):
# texturas jpg, HDRI exr e modelos glTF. O demo nao precisa disso (usa assets_demo/, reduzido).
#   python run/baixar_ph.py [pasta=assets] [resolucao=2k]      (2k ~ 160 MB; 1k ~ 90 MB)
# Arquivo que ja existe e pulado. Com a pasta assets/ presente, o cena.py passa a usar ela.
import json, os, sys, urllib.request
UA = {"User-Agent": "asset-fetch/1.0"}
AQUI = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(AQUI, "..", "assets")
RES = sys.argv[2] if len(sys.argv) > 2 else "2k"
def get(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=180).read()
def save(u, p):
    if os.path.exists(p) and os.path.getsize(p) > 0: return
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "wb").write(get(u)); print("ok", p, flush=True)
TEX = ["mud_cracked_dry_03", "dry_ground_rocks", "red_laterite_soil_stones",
       "cliff_side", "rock_boulder_dry", "rock_face_03", "weathered_planks"]
for t in TEX:
    f = json.loads(get(f"https://api.polyhaven.com/files/{t}"))
    for k, lk in [("Diffuse", "diff"), ("Rough", "rough"), ("Displacement", "disp")]:
        if k in f and RES in f[k]:
            save(f[k][RES]["jpg"]["url"], f"{OUT}/tex/{t}/{t}_{lk}_{RES}.jpg")
for h in ["kloppenheim_06_puresky"]:
    f = json.loads(get(f"https://api.polyhaven.com/files/{h}"))
    save(f["hdri"][RES]["exr"]["url"], f"{OUT}/hdri/{h}_{RES}.exr")
MOD = ["dry_branches_medium_01", "searsia_burchellii", "wild_rooibos_bush", "namaqualand_boulder_02",
       "namaqualand_boulder_05", "wooden_bucket_01", "picke_dirty_01", "dead_tree_trunk", "rusted_spade_01"]
for m in MOD:
    f = json.loads(get(f"https://api.polyhaven.com/files/{m}"))
    g = f["gltf"]["1k"]["gltf"]
    save(g["url"], f"{OUT}/mod/{m}/{m}_1k.gltf")
    for rel, d in g.get("include", {}).items():
        save(d["url"], f"{OUT}/mod/{m}/{rel}")
print("FIM")
