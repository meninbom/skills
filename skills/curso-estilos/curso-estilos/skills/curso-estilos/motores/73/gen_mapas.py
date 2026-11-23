# Globo explicativo: mapas da Terra (equirretangular 4096x2048) para "E se a Terra parasse de girar?"
# albedo.png RGBA: biomas chapados (paleta NOSSA); alpha = terra
# aux.png    RGB : R = nuvens, G = cidades (populacao real), B = mascara de terra
# geo.png    RGB : R = d0 codificado ((d0+7)/14), d0 = profundidade do mar (km, +) ou -altitude da terra (km)
#                  G = 0, B = 0
# Fontes: Natural Earth (dominio publico) + NASA Blue Marble topo-bathy (dominio publico, cor do mar ~ batimetria)
import json, math, random, base64, pathlib
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops
from scipy import ndimage

HERE = pathlib.Path(__file__).resolve().parent
D = HERE / "dados"
M = HERE / "mapas"   # PNGs intermediarios (o globo le so o mapas.js)
M.mkdir(exist_ok=True)
W, H = 4096, 2048
SS = 2

def P(lon, lat, s=SS):
    return ((lon + 180) / 360 * W * s, (90 - lat) / 180 * H * s)
def poly(draw, pts, fill, s=SS):
    draw.polygon([P(lo, la, s) for lo, la in pts], fill=fill)
def rings(geom):
    if geom["type"] == "Polygon":
        yield geom["coordinates"]
    else:
        for p in geom["coordinates"]:
            yield p

# ---------- terra (Natural Earth 50m) ----------
land = Image.new("L", (W * SS, H * SS), 0)
dl = ImageDraw.Draw(land)
for f in json.load(open(D / "ne_50m_land.geojson", encoding="utf-8"))["features"]:
    for rg in rings(f["geometry"]):
        dl.polygon([P(lo, la) for lo, la in rg[0]], fill=255)
        for hole in rg[1:]:
            dl.polygon([P(lo, la) for lo, la in hole], fill=0)
for f in json.load(open(D / "ne_110m_lakes.geojson", encoding="utf-8"))["features"]:
    for rg in rings(f["geometry"]):
        dl.polygon([P(lo, la) for lo, la in rg[0]], fill=0)

# ---------- biomas: paleta nossa ----------
C = dict(ice="#eef3f6", tundra="#b3c79a", tundra2="#93b183", boreal="#2f7a58", green="#4e9a5a",
         light="#86b864", sahel="#d4be74", desert="#e9a657", rain="#2b7550")
bio = Image.new("RGB", (W * SS, H * SS), C["green"])
db = ImageDraw.Draw(bio)
def band(la0, la1, col):
    db.rectangle([0, P(0, la1)[1], W * SS, P(0, la0)[1]], fill=col)
band(23, 35, C["light"]); band(50, 60, C["boreal"]); band(60, 66, C["tundra2"]); band(66, 90, C["tundra"])
band(-35, -23, C["light"]); band(-90, -50, C["tundra2"])
R = {
 "light": [[(-17,8),(-17,12.5),(40,14),(42,8),(45,4),(40,-5),(40,-17),(33,-26),(24,-28),(12,-16),(13,-6),(30,-6),(30,5),(10,6),(-5,6)],
  [(-60,-10),(-38,-5),(-40,-20),(-55,-24),(-62,-16)], [(70,8),(80,8),(88,24),(72,24)],
  [(-106,50),(-95,50),(-95,30),(-100,26),(-106,33)], [(25,46),(50,48),(50,54),(30,52)], [(-64,-28),(-56,-30),(-58,-38),(-66,-38)]],
 "sahel": [[(-17,12.5),(-17,16.5),(-5,16),(5,15.5),(15,15),(24,15.5),(33,16),(38,18),(40,14),(36,11),(28,10),(15,11),(5,12),(-5,12)],
  [(113,-20),(123,-15),(133,-13),(142,-17),(147,-25),(146,-32),(136,-35),(124,-33),(115,-33),(113,-25)],
  [(45,52),(80,54),(120,50),(122,40),(100,35),(70,34),(48,38)], [(10,-13),(30,-15),(33,-25),(28,-33),(17,-34),(11,-20)],
  [(-112,48),(-102,48),(-100,32),(-106,28),(-114,38)], [(40,4),(44,10),(51,12),(49,6),(42,0)], [(-72,-40),(-64,-38),(-66,-50),(-70,-52)], [(36,30),(40,36),(48,36),(46,30)]],
 "desert": [[(-17,16.5),(-17,24),(-13,28),(-9,30),(-2,31),(8,31),(11,30.5),(20,30),(25,30.5),(33,30),(35,28),(38,22),(38,18),(33,16),(24,15.5),(15,15),(5,15.5),(-5,16)],
  [(34,30),(39,32),(47,30),(50,26),(56,24),(58,21),(52,16),(44,13),(42,16),(38,22)], [(48,32),(56,35),(62,34),(66,30),(70,28),(72,25),(66,25),(57,26),(51,28)],
  [(52,45),(60,46),(70,44),(80,42),(90,44),(100,44),(112,45),(115,42),(105,38),(95,37),(85,36),(76,37),(66,38),(56,38)], [(69,24),(73,29),(76,27),(72,23)],
  [(12,-17),(16,-18),(22,-20),(26,-23),(24,-28),(19,-31),(16,-29),(14,-23)],
  [(115,-21),(122,-19),(130,-17),(137,-19),(141,-22),(144,-27),(141,-31),(134,-32),(126,-31),(117,-28)],
  [(-118,35),(-112,37),(-106,35),(-104,30),(-108,26),(-112,28),(-115,31)], [(-71,-17),(-69,-17),(-69,-28),(-71,-28)]],
 "rain": [[(8,4),(16,4),(28,4),(30,0),(29,-5),(20,-6),(12,-4),(9,0)], [(-12,8),(-5,6.5),(8,5.5),(8,4),(-8,4.5)],
  [(-78,2),(-70,5),(-60,5),(-50,2),(-48,-3),(-55,-8),(-65,-12),(-75,-10)], [(95,20),(108,22),(110,10),(120,5),(152,-2),(152,-10),(130,-8),(105,-8),(95,5)],
  [(-92,18),(-83,15),(-77,8),(-80,8),(-86,11),(-92,15)], [(47,-12),(50,-15),(49,-20),(47,-18)]],
}
for k in ["light", "sahel", "desert", "rain"]:
    for pts in R[k]:
        poly(db, pts, C[k])
GREEN = [(-73,78),(-60,82.5),(-30,84),(-12,81),(-18,74),(-22,70),(-40,64),(-44,59.5),(-50,62),(-54,67),(-58,75)]
poly(db, GREEN, C["ice"])
band(-90, -62, C["ice"])
alb = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
alb.paste(bio, (0, 0), land)
alb = alb.resize((W, H), Image.LANCZOS)
alb.save(M / "albedo.png")

# ---------- nuvens (capsulas) ----------
cl = Image.new("L", (W * SS, H * SS), 0)
dc = ImageDraw.Draw(cl)
rc = random.Random(29)
n = 0
while n < 60:
    lat = rc.uniform(-56, 64)
    if rc.random() < .35 and abs(lat) > 40: continue
    lon = rc.uniform(-180, 180)
    xs = 1 / max(.45, math.cos(math.radians(lat)))
    h = rc.uniform(26, 40) * SS; w = rc.uniform(2.2, 4.6) * h
    x, y = P(lon, lat)
    dc.rounded_rectangle([x - w / 2 * xs, y - h / 2, x + w / 2 * xs, y + h / 2], radius=h / 2, fill=255)
    nb = rc.choice([0, 1, 1, 2])
    for i in range(nb):
        u = (i + .5) / nb - .5; r = h * rc.uniform(.55, .85); cx, cy = x + u * w * .6 * xs, y - h * .2
        dc.ellipse([cx - r * xs, cy - r, cx + r * xs, cy + r], fill=255)
    dc.rectangle([x - w / 2 * xs - 4, y + h / 2, x + w / 2 * xs + 4, y + h], fill=0)
    n += 1
cl = cl.resize((W, H), Image.LANCZOS)

# ---------- cidades ----------
ct = Image.new("L", (W, H), 0)
dct = ImageDraw.Draw(ct)
rp = random.Random(3)
for f in json.load(open(D / "ne_50m_populated_places_simple.geojson", encoding="utf-8"))["features"]:
    p = f["properties"]; lon, lat = p["longitude"], p["latitude"]
    pop = max(p["pop_max"], 5e4)
    if pop < 3e5 and rp.random() < .7: continue
    r = 3.0 + 1.5 * math.log10(pop / 5e4)
    x, y = P(lon, lat, 1); k = 1 / max(.35, math.cos(math.radians(lat)))
    dct.ellipse([x - r * k, y - r, x + r * k, y + r], fill=255)
glow = ct.filter(ImageFilter.GaussianBlur(8))
ct = ImageChops.add(ct, glow.point(lambda v: min(255, v * 1.3)))
lm = land.resize((W, H), Image.LANCZOS)
Image.merge("RGB", (cl, ct, lm)).save(M / "aux.png")

# ---------- d0: profundidade (mar) / altitude (terra), km ----------
GW, GH = 2048, 1024
landm = np.asarray(land.resize((GW, GH), Image.BILINEAR)) > 127
bm = np.asarray(Image.open(D / "mundo_2k.jpg").convert("RGB").resize((GW, GH), Image.BILINEAR)).astype(np.float32)
Bc = ndimage.median_filter(bm[..., 2], 5)
# calibracao por pontos conhecidos (azul do Blue Marble topo-bathy x profundidade de cartas):
# Mar do Norte/Mar de Java ~0,05 km (B~128) | Golfo do Mexico ~3,2 (61) | Atlantico central ~4,2 (48) | Pacifico Sul ~5,5 (32)
depth = np.interp(Bc, [20, 32, 48, 61, 80, 110, 130, 256], [6.0, 5.5, 4.2, 3.2, 2.0, .4, .05, .05])
lat = 90 - (np.arange(GH) + .5) / GH * 180
LAT = np.repeat(lat[:, None], GW, 1)
lon = -180 + (np.arange(GW) + .5) / GW * 360
LON = np.repeat(lon[None, :], GH, 0)
# gelo marinho do Artico aparece branco: Oceano Artico ~1-4 km, uso 2,5
depth = np.where((LAT > 66) & (bm[..., 0] > 150), 2.5, depth)
# altitude da terra: base que sobe para o interior + planaltos reais (medias aproximadas)
din = ndimage.distance_transform_edt(landm) * (40000 / GW)  # km aprox no equador
elev = .15 + .55 * np.clip(din / 600, 0, 1)
E = Image.new("F", (GW, GH), 0.0); de = ImageDraw.Draw(E)
def pe(pts, v):
    de.polygon([((lo + 180) / 360 * GW, (90 - la) / 180 * GH) for lo, la in pts], fill=float(v))
pe([(78,35),(80,30),(86,28),(92,27.5),(97,28),(102,30),(103,34),(98,37),(90,38),(80,37)], 4.5)   # Tibete ~4,5 km
pe([(-80,-2),(-76,-14),(-70,-18),(-68,-24),(-70,-34),(-72,-40),(-70,-40),(-66,-24),(-66,-18),(-72,-12),(-77,-2)], 3.5)  # Andes
pe([(-115,48),(-105,48),(-104,35),(-108,32),(-114,36)], 2.0)  # Rochosas / Colorado
pe([(36,14),(40,14),(42,8),(39,5),(35,7)], 2.2)   # Etiopia
pe([(6,44),(16,47.5),(15,46),(7,45.5)], 2.0)      # Alpes
pe([(44,38),(60,36),(62,30),(52,28),(46,32)], 1.2) # Ira
pe([(78,30),(85,28),(80,34)], 5.0)
pe([(-30,-20),(-30,-20),(-30,-20)], 0)
EA = np.asarray(E)
elev = np.maximum(elev, EA)
gr = np.asarray(Image.new("L", (GW, GH)).copy())
G = Image.new("L", (GW, GH), 0); pg = ImageDraw.Draw(G)
pg.polygon([((lo + 180) / 360 * GW, (90 - la) / 180 * GH) for lo, la in GREEN], fill=255)
elev = np.where(np.asarray(G) > 0, 2.1, elev)           # gelo da Groenlandia ~2,1 km
elev = np.where(LAT < -62, 2.3, elev)                    # Antartida ~2,3 km
d0 = np.where(landm, -elev, depth)
d0 = ndimage.gaussian_filter(d0, 1.2)

# conservacao do volume de agua: novo nivel = esfera; h = quanto a superficie atual fica ACIMA dela
A = np.cos(np.radians(LAT))
s2 = np.sin(np.radians(LAT)) ** 2
H_FULL = 21.385 * (1 / 3 - s2)  # km: (raio equatorial 6378,137 - polar 6356,752)
V0 = (np.maximum(d0, 0) * A).sum()
cs = []
for k in np.linspace(0, 1, 11):
    lo_, hi_ = -10, 10
    for _ in range(50):
        c = (lo_ + hi_) / 2
        V = (np.maximum(d0 - k * H_FULL + c, 0) * A).sum()
        if V > V0: hi_ = c
        else: lo_ = c
    cs.append(round(c, 3))
# estatisticas do estado final (para o NOTAS)
k = 1; c = cs[-1]
wet0 = (d0 > 0); wet1 = (d0 - H_FULL + c) > 0
def frac(m): return float((m * A).sum() / A.sum())
print("c(k)", cs)
print("agua hoje %.3f | agua parada %.3f" % (frac(wet0), frac(wet1)))
eq = np.abs(LAT) < 30
print("faixa |lat|<30: agua hoje %.3f, depois %.3f" % (float((wet0 * A)[eq].sum() / A[eq].sum()), float((wet1 * A)[eq].sum() / A[eq].sum())))
for nm, (lo1, lo2, la1, la2) in {"Europa": (-10, 30, 42, 60), "Canada": (-120, -70, 50, 65), "Brasil": (-60, -40, -20, 0), "Sibéria": (70, 140, 55, 70)}.items():
    m = landm & (LON > lo1) & (LON < lo2) & (LAT > la1) & (LAT < la2)
    print(nm, "terra submersa %.2f" % float(wet1[m].mean()))
# profundidade max nova nos polos
print("prof media nova |lat|>70: %.1f km" % float(((d0 - H_FULL + c) * wet1)[np.abs(LAT) > 70].mean()))
enc = np.clip((d0 + 7) / 14, 0, 1)
geo = (np.dstack([enc, np.zeros_like(enc), np.zeros_like(enc)]) * 255).astype(np.uint8)
Image.fromarray(geo).save(M / "geo.png")
(HERE / "agua.js").write_text("window.AGUA_C=" + json.dumps(cs) + ";\n")

def b64(p):
    return "data:image/png;base64," + base64.b64encode(p.read_bytes()).decode()
(HERE / "mapas.js").write_text(f'window.MAPA_ALB="{b64(M / "albedo.png")}";\nwindow.MAPA_AUX="{b64(M / "aux.png")}";\nwindow.MAPA_GEO="{b64(M / "geo.png")}";\n')
print("ok", (HERE / "mapas.js").stat().st_size // 1024, "KB")
