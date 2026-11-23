"""Gera os dados do piloto 'O Brasil mora na praia' em dados/gen/.
uso: python prepara.py [vetor] [sat]"""
import json, os, sys, io, math, subprocess
import numpy as np
from PIL import Image, ImageFilter
from shapely.geometry import shape, mapping, box, LineString, Polygon, MultiPolygon
from shapely.ops import unary_union, transform
ROOT = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(ROOT, 'dados'); G = os.path.join(D, 'gen'); os.makedirs(G, exist_ok=True)
Image.MAX_IMAGE_PIXELS = None
quais = sys.argv[1:] or ['vetor', 'sat']

def salva(nome, geom, tol=0.0):
    if tol: geom = geom.simplify(tol)
    json.dump({'type': 'Feature', 'properties': {'ADMIN': nome}, 'geometry': mapping(geom)}, open(os.path.join(G, nome + '.json'), 'w'))
    print(nome, geom.geom_type, round(geom.area, 2))

if 'vetor' in quais:
    ne = json.load(open(os.path.join(D, 'ne_50m_countries.geojson'), encoding='utf8'))
    P = {f['properties']['ADMIN']: shape(f['geometry']).buffer(0) for f in ne['features']}
    br = P['Brazil']
    viz = unary_union([P[n] for n in ['Uruguay', 'Argentina', 'Paraguay', 'Bolivia', 'Peru', 'Colombia', 'Venezuela', 'Guyana', 'Suriname', 'France']])
    costa = br.boundary.difference(viz.buffer(0.25))
    # buffer de 150 km numa projeção local (x = lon·cos(lat))
    ida = lambda x, y, z=None: (np.asarray(x) * np.cos(np.radians(y)), y)
    volta = lambda x, y, z=None: (np.asarray(x) / np.cos(np.radians(y)), y)
    faixa = transform(volta, transform(ida, costa).buffer(150 / 111.2)).intersection(br).buffer(0)
    faixa = MultiPolygon([p for p in (faixa.geoms if faixa.geom_type == 'MultiPolygon' else [faixa]) if p.area > 0.05])
    salva('faixa', faixa, 0.02)
    salva('interior', br.difference(faixa.buffer(0.01)), 0.03)
    salva('brasil', br)
    asul = unary_union([shape(f['geometry']).buffer(0) for f in ne['features'] if f['properties']['CONTINENT'] == 'South America']).intersection(box(-82, -56, -34, 13))
    X = -48.7
    salva('torde_pt', asul.intersection(box(X, -60, -30, 15)), 0.03)
    salva('torde_es', asul.intersection(box(-95, -60, X, 15)), 0.03)
    for cod, nome in [('norte', 'norte'), ('mg', 'minas'), ('rmsp', 'grandesp'), ('ne', 'nordeste')]:
        g = json.load(open(os.path.join(D, f'ibge_{cod}.json'), encoding='utf8'))
        salva(nome, unary_union([shape(f['geometry']).buffer(0) for f in g['features']]))
    # Tietê: trecho alto à mão (nascente → Barra Bonita) + Natural Earth daí até a foz
    rios = json.load(open(os.path.join(D, 'ne_rivers.geojson'), encoding='utf8'))
    pts = []
    for f in rios['features']:
        if 'Tiet' in str(f['properties'].get('name')):
            for ln in f['geometry']['coordinates']: pts += [tuple(p[:2]) for p in ln]
    pts = sorted(set(pts), key=lambda p: -p[0])
    print('tiete NE lon', pts[0], pts[-1], len(pts))
    alto = [(-45.74, -23.57), (-45.85, -23.53), (-46.05, -23.50), (-46.30, -23.50), (-46.62, -23.52), (-46.87, -23.47), (-47.01, -23.39), (-47.30, -23.28), (-47.72, -23.10), (-48.00, -22.85), (-48.30, -22.65)]
    linha = alto + [p for p in pts if p[0] < alto[-1][0] - 0.05]
    json.dump(linha, open(os.path.join(G, 'tiete.json'), 'w')); print('tiete', len(linha), linha[-1])

def baixa(url, destino):
    if not os.path.exists(destino) or os.path.getsize(destino) < 2000:
        subprocess.run(['curl', '-sSL', '--ssl-no-revoke', '--retry', '3', '-o', destino, url], check=True)
    return destino

def dem(lon0, lon1, lat0, lat1, z, w, h):  # lat0 = norte; devolve metros (h, w)
    n = 2 ** z
    tx = lambda lon: (lon + 180) / 360 * n
    ty = lambda lat: (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    x0, x1, y0, y1 = int(tx(lon0)), int(tx(lon1)), int(ty(lat0)), int(ty(lat1))
    mos = np.zeros(((y1 - y0 + 1) * 256, (x1 - x0 + 1) * 256), np.float32)
    os.makedirs(os.path.join(D, 'dem'), exist_ok=True)
    for X in range(x0, x1 + 1):
        for Y in range(y0, y1 + 1):
            f = baixa(f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{X}/{Y}.png', os.path.join(D, 'dem', f'{z}_{X}_{Y}.png'))
            a = np.asarray(Image.open(f).convert('RGB'), np.float32)
            mos[(Y - y0) * 256:(Y - y0 + 1) * 256, (X - x0) * 256:(X - x0 + 1) * 256] = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
    lons = np.linspace(lon0, lon1, w); lats = np.linspace(lat0, lat1, h)
    px = np.clip(((lons + 180) / 360 * n - x0) * 256, 0, mos.shape[1] - 1.001)
    py = np.clip(((1 - np.arcsinh(np.tan(np.radians(lats))) / math.pi) / 2 * n - y0) * 256, 0, mos.shape[0] - 1.001)
    xi, yi = px.astype(int), py.astype(int); fx, fy = (px - xi)[None, :], (py - yi)[:, None]
    a = mos[np.ix_(yi, xi)]; b = mos[np.ix_(yi, xi + 1)]; c = mos[np.ix_(yi + 1, xi)]; d = mos[np.ix_(yi + 1, xi + 1)]
    return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy

def patch(nome, lon0, lon1, lat0, lat1, ppd, z, grade=384, sombra=1.0):
    w, h = int((lon1 - lon0) * ppd), int((lat0 - lat1) * ppd)
    partes = []; nx = math.ceil(w / 2048); os.makedirs(os.path.join(D, 'sat'), exist_ok=True)
    for i in range(nx):
        a, b = lon0 + (lon1 - lon0) * i / nx, lon0 + (lon1 - lon0) * (i + 1) / nx; wi = w // nx
        f = baixa(f'https://tiles.maps.eox.at/wms?service=WMS&request=GetMap&version=1.1.1&layers=s2cloudless&styles=&srs=EPSG:4326&bbox={a},{lat1},{b},{lat0}&width={wi}&height={h}&format=image/jpeg', os.path.join(D, 'sat', f'{nome}_{i}.jpg'))
        partes.append(Image.open(f).convert('RGB'))
    im = Image.new('RGB', (sum(p.width for p in partes), h)); x = 0
    for p in partes: im.paste(p, (x, 0)); x += p.width
    w = im.width
    e = dem(lon0, lon1, lat0, lat1, z, w, h)
    c = np.asarray(im, np.float32) / 255
    # terra: clareia e satura
    t = np.power(c, 0.74) * 1.18; l = (t * [.3, .59, .11]).sum(-1, keepdims=True); t = l + (t - l) * 1.25
    # iguala a cor da terra ao Blue Marble já graduado (mesma conta do shader), para o recorte não virar um retângulo
    ref = Image.open(os.path.join(D, 'am_sul.jpg')).crop((int((lon0 + 90) * 80), int((16 - lat0) * 80), int((lon1 + 90) * 80), int((16 - lat1) * 80)))
    rc = np.asarray(ref.convert('RGB'), np.float32) / 255; roc = (rc[..., 2] - np.maximum(rc[..., 0], rc[..., 1])) > 0.06
    rt = np.power(rc, 0.72) * 1.22; rl = (rt * [.3, .59, .11]).sum(-1, keepdims=True); rt = rl + (rt - rl) * 1.22
    terra = e > 1
    if terra.sum() > 100 and (~roc).sum() > 100:
        mr, sr = rt[~roc].mean(0), rt[~roc].std(0); mp, sp_ = t[terra].mean(0), t[terra].std(0)
        t = (t - mp) * (0.45 + 0.55 * sr / sp_) + mr
    # relevo: sol baixo de noroeste
    mlat = math.radians((lat0 + lat1) / 2); dx = 111200 * math.cos(mlat) / ppd; dy = 111200 / ppd
    gy, gx = np.gradient(e); gx /= dx; gy /= -dy
    ex = 6.0 * sombra; nrm = np.sqrt((gx * ex) ** 2 + (gy * ex) ** 2 + 1)
    az, alt = math.radians(315), math.radians(38)
    sx, sy, sz = math.sin(az) * math.cos(alt), math.cos(az) * math.cos(alt), math.sin(alt)
    hs = (-gx * ex * sx - gy * ex * sy + sz) / nrm
    t = t * np.clip(0.55 + 0.75 * hs / sz * 0.62, 0.35, 1.5)[..., None]
    # mar: turquesa por profundidade (igual à grade do Blue Marble no shader)
    mar = Image.fromarray(((e <= 0.5) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)); mar = np.asarray(mar, np.float32)[..., None] / 255
    prof = np.clip(-e / 2500, 0, 1)[..., None]
    o = np.array([0.27, 0.60, 0.66]) * (1 - prof) ** 2 + np.array([0.085, 0.265, 0.365]) * (1 - (1 - prof) ** 2)
    r = t * (1 - mar) + o * mar
    Image.fromarray((np.clip(r, 0, 1) * 255).astype(np.uint8)).save(os.path.join(G, nome + '.jpg'), quality=92)
    eg = dem(lon0, lon1, lat0, lat1, z, grade, grade); np.maximum(eg, 0).astype('<f4').tofile(os.path.join(G, nome + '_alt.bin'))
    print(nome, im.size, 'alt max', int(e.max()))

if 'sat' in quais:
    patch('sp', -48.0, -45.0, -22.0, -25.0, 1200, 10)
    patch('tiete', -52.0, -45.4, -20.0, -24.4, 500, 8)
    patch('bsb', -50.6, -45.2, -11.0, -19.6, 400, 8)
