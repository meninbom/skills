"""Pinta a malha do Hunyuan3D com as cores da arte de conceito (projeção das vistas da arte -> cor por vértice).
uso: python pinta.py --glb ze_s7_hi.glb --arte ../conceito/ze_A.png --out ze_pintado.glb [--debug pasta]
Sai um GLB com POSITION/NORMAL/COLOR_0, de pé no chão, 1.8 de altura, frente em +z.
"""
import argparse, json, struct, os, numpy as np
from PIL import Image, ImageFilter

ap = argparse.ArgumentParser()
ap.add_argument('--glb', required=True); ap.add_argument('--arte', required=True); ap.add_argument('--out', required=True)
ap.add_argument('--cortes', default='0,520,1030,1536'); ap.add_argument('--debug'); ap.add_argument('--alt', type=float, default=1.8)
ap.add_argument('--vistas', default='frente,tres4,costas')
ap.add_argument('--cru', action='store_true'); ap.add_argument('--ndv', type=float, default=0.38); ap.add_argument('--suave', type=int, default=14); ap.add_argument('--ganho', type=float, default=2.3); ap.add_argument('--forca', type=float, default=1.0)
a = ap.parse_args()


def le_glb(p):
    b = open(p, 'rb').read(); jl = struct.unpack_from('<I', b, 12)[0]; j = json.loads(b[20:20 + jl]); bn = b[20 + jl + 8:]
    def acc(i):
        ac = j['accessors'][i]; v = j['bufferViews'][ac['bufferView']]; dt = {5126: np.float32, 5125: np.uint32, 5123: np.uint16}[ac['componentType']]; n = {'SCALAR': 1, 'VEC3': 3}[ac['type']]
        off = v.get('byteOffset', 0) + ac.get('byteOffset', 0); return np.frombuffer(bn, dt, ac['count'] * n, off).reshape(-1, n) if n > 1 else np.frombuffer(bn, dt, ac['count'], off)
    pr = j['meshes'][0]['primitives'][0]; return acc(pr['attributes']['POSITION']).astype(np.float64), acc(pr['indices']).astype(np.int64).reshape(-1, 3)


V, F = le_glb(a.glb)
mn, mx = V.min(0), V.max(0); V = V - [(mn[0] + mx[0]) / 2, mn[1], (mn[2] + mx[2]) / 2]; V *= a.alt / (mx[1] - mn[1])
fn = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]]); N = np.zeros_like(V)
for k in range(3): np.add.at(N, F[:, k], fn)
N /= np.linalg.norm(N, axis=1, keepdims=True) + 1e-12
print('verts', len(V), 'faces', len(F))

# pontos extra (centros das faces) para o z-buffer ficar fechado
C = V[F].mean(1)


def proj(P, yaw):  # câmera ortográfica girando em torno de y; devolve x (direita), y (cima), profundidade (maior = mais perto)
    c, s = np.cos(yaw), np.sin(yaw); x = P[:, 0] * c - P[:, 2] * s; z = P[:, 0] * s + P[:, 2] * c; return x, P[:, 1], z


def silhueta(yaw, R=160):
    x, y, _ = proj(V, yaw); x0, x1 = x.min(), x.max(); w = x1 - x0; h = a.alt
    m = np.zeros((R, R), bool); sc = (R - 1) / max(w, h)
    m[np.clip(((h - y) * sc).astype(int), 0, R - 1), np.clip(((x - x0) * sc).astype(int), 0, R - 1)] = True
    return m, w / h


def mask_norm(al, R=160):  # máscara da arte na mesma normalização (bbox colada em cima/esquerda, escala pelo maior lado)
    ys, xs = np.where(al > 128); c = Image.fromarray((al[ys.min():ys.max() + 1, xs.min():xs.max() + 1] > 128).astype(np.uint8) * 255)
    sc = (R - 1) / max(c.size); c = c.resize((max(1, round(c.width * sc)), max(1, round(c.height * sc))), Image.BILINEAR)
    m = np.zeros((R, R), bool); m[:c.height, :c.width] = np.array(c) > 128; return m, (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)


from rembg import remove
arte = Image.open(a.arte).convert('RGB'); cx = [int(v) for v in a.cortes.split(',')]
nomes = a.vistas.split(','); chute = {'frente': (-0.9, 0.9), 'tres4': (-1.3, 1.3), 'costas': (np.pi - 1.0, np.pi + 1.0)}
acc_c = np.zeros((len(V), 3)); acc_w = np.zeros(len(V)); best_w = np.zeros(len(V)); vistas = []
for i, nome in enumerate(nomes):
    crop = arte.crop((cx[i], 0, cx[i + 1], arte.height)); rgba = remove(crop); al = np.array(rgba)[:, :, 3]
    am, bb = mask_norm(al)
    # 1) acha o giro pela silhueta
    lo, hi = chute[nome]; best = None
    for yaw in np.arange(lo, hi + 1e-6, np.radians(2.5)):
        sm, _ = silhueta(yaw)
        # fecha buracos da silhueta de pontos
        smi = np.array(Image.fromarray(sm.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))) > 128
        iou = (smi & am).sum() / ((smi | am).sum() + 1e-9)
        if best is None or iou > best[0]: best = (iou, yaw)
    iou, yaw = best; print(f'{nome}: giro {np.degrees(yaw):.1f} graus, IoU {iou:.3f}')
    # 2) projeta: bbox do modelo -> bbox da máscara da arte
    x, y, z = proj(V, yaw); bw, bh = bb[2] - bb[0], bb[3] - bb[1]
    u = bb[0] + (x - x.min()) / (x.max() - x.min()) * (bw - 1); v = bb[1] + (a.alt - y) / a.alt * (bh - 1)
    # 3) z-buffer com vértices + centros de face
    S = 2; W, H = crop.width * S, crop.height * S; zb = np.full((H, W), -1e9)
    xc, yc, zc = proj(C, yaw); uc = bb[0] + (xc - x.min()) / (x.max() - x.min()) * (bw - 1); vc = bb[1] + (a.alt - yc) / a.alt * (bh - 1)
    for uu, vv, zz in ((u, v, z), (uc, vc, zc)):
        iu = np.clip((uu * S).astype(int), 0, W - 1); iv = np.clip((vv * S).astype(int), 0, H - 1)
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1): np.maximum.at(zb, (np.clip(iv + dy, 0, H - 1), np.clip(iu + dx, 0, W - 1)), zz)
    iu = np.clip((u * S).astype(int), 0, W - 1); iv = np.clip((v * S).astype(int), 0, H - 1)
    vis = z >= zb[iv, iu] - 0.035
    c, s = np.cos(yaw), np.sin(yaw); ndv = N[:, 0] * s + N[:, 2] * c  # normal · direção da câmera
    # 4) amostra a cor (só dentro da máscara encolhida, para não puxar o fundo)
    er = np.array(Image.fromarray((al > 200).astype(np.uint8) * 255).filter(ImageFilter.MinFilter(13))) > 128
    px = np.array(crop).astype(np.float64); ui = np.clip(np.round(u).astype(int), 0, crop.width - 1); vi = np.clip(np.round(v).astype(int), 0, crop.height - 1)
    ok = vis & er[vi, ui] & (ndv > a.ndv)
    w = np.where(ok, np.clip(ndv, 0, 1) ** 3, 0) * (1.0 if nome != 'tres4' else 0.35)
    col = px[vi, ui]
    # a vista com mais peso manda (evita fantasma entre vistas que não batem)
    vistas.append((nome, yaw, col, w, ok))
    if a.debug:
        os.makedirs(a.debug, exist_ok=True); d = np.array(crop).copy(); d[vi[ok][::7], ui[ok][::7]] = [255, 0, 255]; Image.fromarray(d).save(f'{a.debug}/proj_{nome}.jpg')

E = np.concatenate([F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]]); E = np.concatenate([E, E[:, ::-1]])
import scipy.sparse as sp
A0 = sp.coo_matrix((np.ones(len(E)), (E[:, 0], E[:, 1])), shape=(len(V), len(V))).tocsr() + sp.eye(len(V)); A0 = sp.diags(1.0 / np.asarray(A0.sum(1)).ravel()) @ A0

# 4b) luz da arte: acha a direção da luz (no espaço da câmera) que melhor explica o claro-escuro da vista de frente,
#     com a sombra projetada calculada na própria malha (aba do boné na testa etc.), e divide essa luz para fora da cor
def luz_mundo(az, el, yaw):
    lc = np.array([np.sin(az) * np.cos(el), np.sin(el), np.cos(az) * np.cos(el)]); c, s_ = np.cos(yaw), np.sin(yaw)
    return lc[0] * np.array([c, 0, -s_]) + lc[1] * np.array([0, 1, 0]) + lc[2] * np.array([s_, 0, c])
def sombra(lw, R=760):
    e1 = np.cross([0, 1, 0], lw); e1 /= np.linalg.norm(e1); e2 = np.cross(lw, e1); zb = np.full((R, R), -1e9); sc = (R - 1) / 2.4
    def uvd(P): return np.clip(((P @ e1) + 1.2) * sc, 0, R - 1).astype(int), np.clip(((P @ e2) + 0.3) * sc, 0, R - 1).astype(int), P @ lw
    for P in (V, C):
        iu, iv, dd = uvd(P)
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1): np.maximum.at(zb, (np.clip(iv + dy, 0, R - 1), np.clip(iu + dx, 0, R - 1)), dd)
    iu, iv, dd = uvd(V); vis = (dd >= zb[iv, iu] - 0.03).astype(float)
    for it in range(10): vis = A0 @ vis
    return vis
def sombreado(az, el, amb, yaw, cache={}):
    k = (round(az, 3), round(el, 3), round(yaw, 3))
    if k not in cache: lw = luz_mundo(az, el, yaw); cache[k] = np.clip(N @ lw, 0, 1) * sombra(lw)
    return amb + (1 - amb) * cache[k]
luz = None
if not a.cru:
    nome, yaw, colf, wf, okf = vistas[0]; Lg = np.log(colf @ [0.3, 0.59, 0.11] + 4.0); ch = colf / (colf.sum(1, keepdims=True) + 12.0)
    eo = okf[E[:, 0]] & okf[E[:, 1]]; Ao = sp.coo_matrix((np.ones(eo.sum()), (E[eo, 0], E[eo, 1])), shape=(len(V), len(V))).tocsr() + sp.eye(len(V)); Ao = sp.diags(1.0 / np.asarray(Ao.sum(1)).ravel()) @ Ao
    def sm(x, n=25):
        for it in range(n): x = Ao @ x
        return x
    es = eo & (((ch[E[:, 0]] - ch[E[:, 1]]) ** 2).sum(1) < 0.02 ** 2); e0, e1_ = E[es, 0], E[es, 1]; sL = sm(Lg); dL = sL[e0] - sL[e1_]; base = (dL ** 2).mean(); best = (base, None)
    for az in np.radians([-60, -40, -20, 0, 20, 40, 60]):
        for el in np.radians([15, 35, 55, 75]):
            for amb in (0.3, 0.45, 0.6, 0.75):
                sS = sm(np.log(sombreado(az, el, amb, yaw))); cst = ((dL - (sS[e0] - sS[e1_])) ** 2).mean()
                if cst < best[0]: best = (cst, (az, el, amb))
    luz = best[1]; print('luz da arte:', None if luz is None else 'azimute %.0f, elevação %.0f, ambiente %.2f' % (np.degrees(luz[0]), np.degrees(luz[1]), luz[2]), '| custo %.5f -> %.5f' % (base, best[0]))
for nome, yaw, col, w, ok in vistas:
    if luz is not None:
        S_ = sombreado(luz[0], luz[1], luz[2], yaw); ref = luz[2] + (1 - luz[2]) * 0.8; col = np.clip(col * np.clip(ref / S_, 0.7, a.ganho)[:, None] ** a.forca, 0, 255)
    ganha = w > best_w * 1.0; acc_c[ganha] = col[ganha]; best_w = np.maximum(best_w, w); acc_w = np.maximum(acc_w, w)

# 5) preenche o que nenhuma vista viu, espalhando a cor pelos vizinhos da malha
tem = acc_w > 0; col = acc_c.copy(); print('pintados direto: %.1f%%' % (100 * tem.mean()))
# 5a) o que ninguém viu copia do lado espelhado (o boneco é quase simétrico)
from scipy.spatial import cKDTree
bom = acc_w > 0.08; tr = cKDTree(V[bom]); falta = np.where(acc_w < 0.02)[0]; d, ix = tr.query(V[falta] * [-1, 1, 1]); usa = d < 0.03
col[falta[usa]] = acc_c[bom][ix[usa]]; tem[falta[usa]] = True; acc_w[falta[usa]] = np.maximum(acc_w[falta[usa]], 0.05); print('espelhados: %.1f%%' % (100 * usa.sum() / len(V)))
for it in range(400):
    if tem.all(): break
    s = np.zeros_like(col); n = np.zeros(len(V)); src = tem[E[:, 1]]
    np.add.at(s, E[src, 0], col[E[src, 1]]); np.add.at(n, E[src, 0], 1)
    novo = (~tem) & (n > 0); col[novo] = s[novo] / n[novo, None]; tem = tem | novo
col[~tem] = [128, 128, 128]
# suaviza de leve só as emendas (onde o peso é baixo)
for it in range(a.suave):
    s = np.zeros_like(col); n = np.zeros(len(V)); np.add.at(s, E[:, 0], col[E[:, 1]]); np.add.at(n, E[:, 0], 1); m = s / np.maximum(n, 1)[:, None]
    k = np.clip(1 - acc_w * 3, 0, 1)[:, None]; col = col * (1 - k) + m * k

# 6) grava GLB
P = V.astype(np.float32); Nn = N.astype(np.float32); Cc = np.concatenate([np.clip(col, 0, 255), np.full((len(V), 1), 255)], 1).astype(np.uint8); I = F.astype(np.uint32).reshape(-1)
bufs = [P.tobytes(), Nn.tobytes(), Cc.tobytes(), I.tobytes()]; offs = np.cumsum([0] + [len(b) for b in bufs])
j = {'asset': {'version': '2.0'}, 'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0}],
     'meshes': [{'primitives': [{'attributes': {'POSITION': 0, 'NORMAL': 1, 'COLOR_0': 2}, 'indices': 3}]}],
     'buffers': [{'byteLength': int(offs[-1])}],
     'bufferViews': [{'buffer': 0, 'byteOffset': int(offs[k]), 'byteLength': len(bufs[k])} for k in range(4)],
     'accessors': [{'bufferView': 0, 'componentType': 5126, 'count': len(V), 'type': 'VEC3', 'min': P.min(0).tolist(), 'max': P.max(0).tolist()},
                   {'bufferView': 1, 'componentType': 5126, 'count': len(V), 'type': 'VEC3'},
                   {'bufferView': 2, 'componentType': 5121, 'normalized': True, 'count': len(V), 'type': 'VEC4'},
                   {'bufferView': 3, 'componentType': 5125, 'count': len(I), 'type': 'SCALAR'}]}
js = json.dumps(j).encode(); js += b' ' * ((4 - len(js) % 4) % 4); bn = b''.join(bufs); bn += b'\0' * ((4 - len(bn) % 4) % 4)
open(a.out, 'wb').write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(bn)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(bn), 0x004E4942) + bn)
print('ok', a.out, '%.1f MB' % (os.path.getsize(a.out) / 1e6))
