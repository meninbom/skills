"""Baixa OSM (Overpass) + relevo (Terrain Tiles / terrarium, AWS Open Data) de um ponto
e monta a cena em metros locais para o render.

Uso: python scripts/baixar_dados.py <nome> <lat> <lon> [raio_m=450]
Saida: cena/<nome>.json   Cache: cache/<nome>/ (1 consulta Overpass por lugar; seja gentil com o servidor publico)
Dados: (c) OpenStreetMap contributors (ODbL). Relevo: Terrain Tiles (AWS Open Data).
"""
import io, json, math, sys, time, pathlib, random, urllib.request, urllib.parse
import numpy as np
from PIL import Image
from shapely.geometry import Polygon, Point

UA = "manga-mapa/0.1 (estudo de render procedural)"  # sem e-mail, de proposito
OVERPASS = "https://overpass-api.de/api/interpreter"
TERRARIUM = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
BASE = pathlib.Path(__file__).resolve().parent.parent


def get(url, data=None):
    req = urllib.request.Request(url, data=data, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read()


def overpass(bbox, cache):
    f = cache / "osm.json"
    if f.exists():
        return json.loads(f.read_text(encoding="utf8"))
    s, w, n, e = bbox
    b = f"{s},{w},{n},{e}"
    q = f"""[out:json][timeout:90];
(
  way["building"]({b}); relation["building"]({b}); way["building:part"]({b});
  way["highway"]({b}); node["natural"="tree"]({b});
  way["leisure"~"^(park|garden|pitch|playground)$"]({b});
  way["landuse"~"^(grass|forest|meadow|village_green|recreation_ground)$"]({b});
  way["natural"~"^(wood|water|scrub|grassland)$"]({b}); way["waterway"]({b});
  way["railway"]({b}); way["area:highway"]({b});
  relation["leisure"~"^(park|garden)$"]({b}); relation["landuse"~"^(grass|forest)$"]({b});
  relation["natural"~"^(wood|water|scrub)$"]({b});
);
out geom;"""
    raw = get(OVERPASS, urllib.parse.urlencode({"data": q}).encode())
    f.write_bytes(raw)
    (cache / "osm_rel.json").write_text('{"elements": []}', encoding="utf8")
    return json.loads(raw)


def overpass_rel(bbox, cache):
    """So relacoes de area (parques como o Trianon vem como multipolygon). Cache proprio."""
    f = cache / "osm_rel.json"
    if f.exists():
        return json.loads(f.read_text(encoding="utf8"))
    s, w, n, e = bbox
    b = f"{s},{w},{n},{e}"
    q = f"""[out:json][timeout:60];
(relation["leisure"~"^(park|garden)$"]({b}); relation["landuse"~"^(grass|forest)$"]({b});
 relation["natural"~"^(wood|water|scrub)$"]({b}););
out geom;"""
    raw = get(OVERPASS, urllib.parse.urlencode({"data": q}).encode())
    f.write_bytes(raw)
    return json.loads(raw)


def join_rings(members):
    """Junta os ways 'outer' de um multipolygon em aneis fechados."""
    segs = [[(g["lat"], g["lon"]) for g in m["geometry"] if g] for m in members
            if m.get("type") == "way" and m.get("role") in ("outer", "") and m.get("geometry")]
    rings = []
    while segs:
        cur = segs.pop(0)
        changed = True
        while cur[0] != cur[-1] and changed:
            changed = False
            for i, sg in enumerate(segs):
                if sg[0] == cur[-1]: cur += sg[1:]
                elif sg[-1] == cur[-1]: cur += sg[::-1][1:]
                elif sg[-1] == cur[0]: cur = sg[:-1] + cur
                elif sg[0] == cur[0]: cur = sg[::-1][:-1] + cur
                else: continue
                segs.pop(i); changed = True; break
        if len(cur) >= 4:
            rings.append(cur)
    return rings


def tile_xy(lat, lon, z):
    n = 2 ** z
    x = (lon + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y


def dem(bbox, cache, z=15):
    """Mosaico terrarium: altura = R*256 + G + B/256 - 32768."""
    s, w, n, e = bbox
    x0, y0 = tile_xy(n, w, z); x1, y1 = tile_xy(s, e, z)
    tiles = {}
    for tx in range(int(x0), int(x1) + 1):
        for ty in range(int(y0), int(y1) + 1):
            f = cache / f"dem_{z}_{tx}_{ty}.png"
            if not f.exists():
                f.write_bytes(get(TERRARIUM.format(z=z, x=tx, y=ty))); time.sleep(0.2)
            a = np.asarray(Image.open(f).convert("RGB")).astype(np.float64)
            tiles[(tx, ty)] = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
    def sample(lat, lon):
        fx, fy = tile_xy(lat, lon, z)
        px, py = (fx % 1) * 256, (fy % 1) * 256
        t = tiles[(int(fx), int(fy))]
        i0, j0 = min(int(px), 254), min(int(py), 254)
        u, v = px - i0, py - j0
        return (t[j0, i0] * (1 - u) * (1 - v) + t[j0, i0 + 1] * u * (1 - v)
                + t[j0 + 1, i0] * (1 - u) * v + t[j0 + 1, i0 + 1] * u * v)
    return sample


def num(v):
    try:
        return float(str(v).replace(",", ".").split()[0].rstrip("m"))
    except Exception:
        return None


ROAD_W = {"motorway": 14, "trunk": 13, "primary": 12, "secondary": 10, "tertiary": 8,
          "unclassified": 6, "residential": 6.5, "living_street": 5, "service": 4,
          "motorway_link": 7, "trunk_link": 7, "primary_link": 7, "secondary_link": 6,
          "tertiary_link": 6, "pedestrian": 6, "footway": 2.2, "path": 1.8, "cycleway": 2.2,
          "steps": 2.5, "track": 3}
CAR = {"motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential",
       "living_street", "service", "motorway_link", "trunk_link", "primary_link",
       "secondary_link", "tertiary_link"}


def main():
    nome, lat0, lon0 = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
    R = float(sys.argv[4]) if len(sys.argv) > 4 else 450
    cache = BASE / "cache" / nome; cache.mkdir(parents=True, exist_ok=True)
    dlat = R / 110540; dlon = R / (111320 * math.cos(math.radians(lat0)))
    bbox = (lat0 - dlat, lon0 - dlon, lat0 + dlat, lon0 + dlon)
    osm = overpass(bbox, cache)
    if True:   # caches antigos nao tinham as relacoes de area; os novos gravam osm_rel.json vazio
        try:
            osm["elements"] += overpass_rel(bbox, cache)["elements"]
        except Exception as ex:
            print("aviso: relacoes de area nao baixadas:", ex)
    elev = dem(bbox, cache)
    kx = 111320 * math.cos(math.radians(lat0)); kz = 110540
    P = lambda la, lo: ((lo - lon0) * kx, -(la - lat0) * kz)   # x leste, z sul (three: y pra cima)
    rnd = random.Random(7)

    # ---- relevo em grade de 4 m
    step = 4.0; N = int(2 * R / step) + 1
    hs = np.zeros((N, N))
    for j in range(N):
        for i in range(N):
            x, z = -R + i * step, -R + j * step
            hs[j, i] = elev(lat0 - z / kz, lon0 + x / kx)
    h0 = float(hs[N // 2, N // 2])
    hs -= h0
    def H(x, z):
        fi = np.clip((x + R) / step, 0, N - 1.001); fj = np.clip((z + R) / step, 0, N - 1.001)
        i, j = int(fi), int(fj); u, v = fi - i, fj - j
        return float(hs[j, i] * (1 - u) * (1 - v) + hs[j, i + 1] * u * (1 - v)
                     + hs[j + 1, i] * (1 - u) * v + hs[j + 1, i + 1] * u * v)

    els = osm["elements"]
    def ring(geom):
        return [P(g["lat"], g["lon"]) for g in geom if g]

    # ---- predios (partes tem prioridade sobre o contorno do predio)
    parts, blds = [], []
    for el in els:
        t = el.get("tags", {})
        if el["type"] == "way" and "building:part" in t and "geometry" in el:
            parts.append((el, ring(el["geometry"])))
        elif "building" in t:
            if el["type"] == "way" and "geometry" in el:
                blds.append((el, ring(el["geometry"])))
            elif el["type"] == "relation":
                for rg in join_rings(el.get("members", [])):
                    blds.append((el, [P(la, lo) for la, lo in rg]))
    part_polys = [Polygon(r).buffer(0) for _, r in parts if len(r) >= 4]
    buildings = []
    def add(el, r, is_part):
        if len(r) < 4:
            return
        poly = Polygon(r).buffer(0)
        if poly.is_empty or poly.area < 6:
            return
        if poly.geom_type != "Polygon":
            poly = max(poly.geoms, key=lambda g: g.area)
        dentro = [pp for pp in part_polys if pp.representative_point().within(poly)]
        if not is_part and dentro and sum(pp.area for pp in dentro) > 0.35 * poly.area:
            return  # o predio foi modelado em partes (se as partes cobrem pouco, ex.: pilares do MASP, mantém o volume)
        t = el.get("tags", {})
        if t.get("building") in ("roof", "carport") or t.get("building:part") == "roof":
            return
        lv = num(t.get("building:levels")); h = num(t.get("height"))
        mh = num(t.get("min_height")) or ((num(t.get("building:min_level")) or 0) * 3.2)
        guessed = False
        if h is None and lv is not None:
            h = lv * 3.2 + 1.0
        if h is None and mh > 0:          # volume suspenso (ex.: MASP): min_height sem height
            h = mh + 9.6
        if h is None:
            guessed = True
            a = poly.area
            h = (rnd.choice([4, 6.5, 7]) if a < 150 else rnd.choice([7, 10, 13, 16])
                 if a < 600 else rnd.choice([16, 26, 38, 52, 70]))
        ext = list(poly.exterior.coords)[:-1]
        if Polygon(ext).exterior.is_ccw:
            ext = ext[::-1]
        base = min(H(x, z) for x, z in ext)
        rr = random.Random(el["id"])
        style = 0 if h < 8 else (2 if (h > 45 and rr.random() < 0.45) else 1)
        buildings.append({"id": el["id"], "pts": [[round(x, 2), round(z, 2)] for x, z in ext],
                          "base": round(base - 0.6, 2), "h": round(h, 1), "minh": round(mh, 1),
                          "alb": round(rr.choice([0.95, 0.92, 0.88, 0.82, 0.72, 0.55, 0.35]), 2),
                          "style": style, "guess": guessed, "cor": t.get("building:colour", ""), "nome": t.get("name", "")})
    for el, r in parts:
        add(el, r, True)
    for el, r in blds:
        add(el, r, False)

    # ---- ruas
    roads, crossings = [], []
    for el in els:
        t = el.get("tags", {})
        if el["type"] != "way" or "highway" not in t or "geometry" not in el:
            continue
        k = t["highway"]
        if k not in ROAD_W or t.get("area") == "yes" or t.get("tunnel") in ("yes", "building_passage"):
            continue
        w = ROAD_W[k]
        lanes = num(t.get("lanes"))
        if lanes and k in CAR:
            w = max(w * 0.6, lanes * 3.1 + 1)
        if t.get("oneway") == "yes" and not lanes and k in CAR:
            w *= 0.7
        pts = [P(g["lat"], g["lon"]) for g in el["geometry"]]
        lay = num(t.get("layer")) or 0
        bridge = t.get("bridge") == "yes"
        roads.append({"pts": [[round(x, 2), round(z, 2), round(H(x, z) + (6 * lay if bridge else 0), 2)]
                              for x, z in pts],
                      "w": round(w, 1), "car": k in CAR, "kind": k, "name": t.get("name", ""),
                      "lanes": lanes or 0, "bridge": bridge, "oneway": t.get("oneway")})
        if t.get("footway") == "crossing" or t.get("crossing") == "zebra":
            crossings.append(roads[-1]["pts"])

    # ---- verde, agua, arvores
    areas, trees = [], []
    for el in els:
        t = el.get("tags", {})
        if el["type"] == "node" and t.get("natural") == "tree":
            x, z = P(el["lat"], el["lon"])
            trees.append([round(x, 2), round(z, 2), round(H(x, z), 2), rnd.random()])
        elif el["type"] in ("way", "relation") and (
                t.get("leisure") or t.get("landuse") or t.get("natural") in ("wood", "water", "scrub", "grassland")):
            rs = [ring(el["geometry"])] if el["type"] == "way" and "geometry" in el else                  [[P(la, lo) for la, lo in rg] for rg in join_rings(el.get("members", []))]
            for r in rs:
              if len(r) < 4:
                  continue
              kind = "water" if t.get("natural") == "water" else (
                  "wood" if t.get("natural") == "wood" or t.get("landuse") == "forest" else "grass")
              areas.append({"kind": kind, "pts": [[round(x, 2), round(z, 2)] for x, z in r]})
              poly = Polygon(r).buffer(0)
              if kind != "water" and poly.area > 200:
                  dens = 1 / 90 if kind == "wood" else (1 / 120 if t.get("leisure") == "park" else 1 / 400)
                  n = int(poly.area * dens)
                  minx, minz, maxx, maxz = poly.bounds
                  tries = 0
                  while n > 0 and tries < n * 30:
                      tries += 1
                      x, z = rnd.uniform(minx, maxx), rnd.uniform(minz, maxz)
                      if poly.contains(Point(x, z)) and abs(x) < R and abs(z) < R:
                          trees.append([round(x, 2), round(z, 2), round(H(x, z), 2), rnd.random()]); n -= 1

    # ---- mobiliario chutado (como a ferramenta original faz): arvores de calcada, carros, postes
    from shapely.strtree import STRtree
    bpolys = [Polygon(b["pts"]) for b in buildings]
    tree_idx = STRtree(bpolys)
    def livre(x, z):
        pt = Point(x, z)
        return abs(x) < R and abs(z) < R and not any(bpolys[i].contains(pt) for i in tree_idx.query(pt))
    cars, poles = [], []
    for r in roads:
        if not r["car"] or r["w"] < 6 or r["bridge"]:
            continue
        pts = r["pts"]; w = r["w"]; lanes = int(r["lanes"]) or (2 if w >= 6 else 1)
        lw = w / lanes; acc = rnd.uniform(0, 10); nxt_car = [rnd.uniform(5, 30) for _ in range(lanes)]
        dist = 0.0
        for (x1, z1, y1), (x2, z2, y2) in zip(pts, pts[1:]):
            L = math.hypot(x2 - x1, z2 - z1)
            if L < 0.5:
                continue
            dx, dz = (x2 - x1) / L, (z2 - z1) / L; nx, nz = -dz, dx
            s0 = 0.0
            while s0 < L:
                stp = min(L - s0, 1.0); s0 += stp; dist += stp
                x, z = x1 + dx * s0, z1 + dz * s0
                acc += stp
                if acc >= 11 and w >= 7:              # arvores dos dois lados
                    acc = rnd.uniform(-2, 1)
                    for sg in (-1, 1):
                        tx, tz = x + nx * sg * (w / 2 + 2.2), z + nz * sg * (w / 2 + 2.2)
                        if livre(tx, tz) and rnd.random() < 0.85:
                            trees.append([round(tx, 2), round(tz, 2), round(H(tx, tz), 2), rnd.random()])
                if int(dist) % 34 == 0 and stp == 1.0 and w >= 7:   # postes
                    tx, tz = x + nx * (w / 2 + 0.7), z + nz * (w / 2 + 0.7)
                    if livre(tx, tz):
                        poles.append([round(tx, 2), round(tz, 2), round(H(tx, tz), 2), round(math.atan2(nx, nz), 3)])
                for k in range(lanes):                 # carros por faixa
                    if dist >= nxt_car[k]:
                        nxt_car[k] = dist + rnd.uniform(14, 55)
                        off = -w / 2 + (k + 0.5) * lw
                        cx, cz = x + nx * off, z + nz * off
                        back = (k < lanes / 2) and r.get("oneway") is None and lanes >= 2
                        if abs(cx) < R and abs(cz) < R:
                            ang = math.atan2(dx, dz) + (math.pi if back else 0)
                            cars.append([round(cx, 2), round(cz, 2), round(H(cx, cz), 2), round(ang, 3), rnd.random()])
    cena = {"nome": nome, "lat": lat0, "lon": lon0, "R": R, "h0": round(h0, 1),
            "terrain": {"step": step, "n": N, "h": [round(float(v), 2) for v in hs.ravel()]},
            "buildings": buildings, "roads": roads, "areas": areas, "trees": trees,
            "crossings": crossings, "cars": cars, "poles": poles,
            "credito": "(c) OpenStreetMap contributors | Relevo: Terrain Tiles (AWS Open Data)"}
    out = BASE / "cena"; out.mkdir(exist_ok=True)
    (out / f"{nome}.json").write_text(json.dumps(cena, separators=(",", ":")), encoding="utf8")
    g = sum(b["guess"] for b in buildings)
    print(f"{nome}: {len(buildings)} predios ({g} altura chutada), {len(roads)} ruas, "
          f"{len(trees)} arvores, {len(cars)} carros, {len(poles)} postes, {len(areas)} areas, relevo {hs.min():.1f}..{hs.max():.1f} m (h0 {h0:.0f} m)")


if __name__ == "__main__":
    main()
