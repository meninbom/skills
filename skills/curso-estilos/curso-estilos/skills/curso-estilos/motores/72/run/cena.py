# Corte 3D "e se": "E se voce cavasse ate achar agua no sertao?" -- terreno em corte (bolo) que muda por etapa.
# A cena inteira e montada em codigo; a linha do tempo vem de tempos.json.
# uso: blender -b --factory-startup -P run/cena.py -- MODO ARGS
#   still  <t> <saida.png> <largura> <altura> <amostras>
#   video  <dir_frames> <largura> <altura> <amostras> [f_ini f_fim passo]
#   blend  <saida.blend> [t]
# Cycles em CPU (roda em qualquer maquina). Assets: usa ../assets (conjunto completo 2k, baixado por
# baixar_ph.py) se existir; senao ../assets_demo (conjunto reduzido que vem no pacote). ASSETS_DIR troca a pasta.
import bpy, bmesh, sys, os, math, json, random
import numpy as np
from mathutils import Vector, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
AS = os.environ.get("ASSETS_DIR") or os.path.join(ROOT, "assets")
if not os.path.isdir(os.path.join(AS, "tex")):
    AS = os.path.join(ROOT, "assets_demo")
print("@@assets", AS, flush=True)
import glob as _glob
def _acha(padrao):
    """primeiro arquivo que casa (qualquer resolucao: _2k, _1k, _demo); devolve o padrao se nao houver"""
    r = sorted(_glob.glob(padrao))
    return r[-1] if r else padrao
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["still", "3"]
MODO = argv[0]
FPS = 24
TL = json.load(open(os.path.join(HERE, "tempos.json")))
DUR = TL["dur"]

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.fps = FPS
random.seed(72)

# ---------------------------------------------------------------- utilidades
def smooth(a, b, t):
    if t <= a: return 0.0
    if t >= b: return 1.0
    x = (t - a) / (b - a)
    return x * x * (3 - 2 * x)

def ease_io(a, b, t):  # quintic in-out
    if t <= a: return 0.0
    if t >= b: return 1.0
    x = (t - a) / (b - a)
    return x * x * x * (x * (x * 6 - 15) + 10)

def ease_back(a, b, t):
    if t <= a: return 0.0
    if t >= b: return 1.0
    x = (t - a) / (b - a) - 1; c = 1.7
    return 1 + (c + 1) * x ** 3 + c * x ** 2

def lerp(a, b, k): return a + (b - a) * k

def mesh_obj(name, verts, faces, mat=None):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
    me.update()
    ob = bpy.data.objects.new(name, me)
    sc.collection.objects.link(ob)
    if mat: me.materials.append(mat)
    return ob

def set_mesh(ob, verts, faces):
    me = ob.data
    me.clear_geometry()
    me.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
    me.update()

def box(name, c, s, mat, bevel=0.0):
    hx, hy, hz = s[0] / 2, s[1] / 2, s[2] / 2
    V = [(c[0] + sx * hx, c[1] + sy * hy, c[2] + sz * hz) for sx in (-1, 1) for sy in (-1, 1) for sz in (-1, 1)]
    F = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    ob = mesh_obj(name, V, F, mat)
    if bevel:
        m = ob.modifiers.new("bv", "BEVEL"); m.width = bevel; m.segments = 2
    return ob

def cyl_between(name, a, b, r, mat, seg=12):
    a = Vector(a); b = Vector(b); d = b - a
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=1.0)
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob)
    ob.location = (a + b) / 2
    ob.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    ob.scale = (1, 1, d.length)
    me.materials.append(mat); me.shade_smooth()
    return ob

# ---------------------------------------------------------------- materiais
def img(path, non_color=False):
    im = bpy.data.images.load(path, check_existing=True)
    if non_color: im.colorspace_settings.name = "Non-Color"
    return im

def tex_paths(name):
    d = os.path.join(AS, "tex", name)
    g = lambda k: _acha(os.path.join(d, f"{name}_{k}_*.jpg"))
    return g("diff"), g("rough"), g("disp")

def new_mat(name):
    m = bpy.data.materials.new(name)
    nt = m.node_tree
    p = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    return m, nt, p

def texset(N, L, vec, name, scale, hue=0.5, sat=1.0, val=1.0, flat=False):
    diff, rough, disp = tex_paths(name)
    mp = N.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (1 / scale,) * 3
    L.new(vec, mp.inputs["Vector"])
    def it(p, nc):
        n = N.new("ShaderNodeTexImage"); n.image = img(p, nc)
        if not flat: n.projection = "BOX"; n.projection_blend = 0.3
        L.new(mp.outputs["Vector"], n.inputs["Vector"]); return n
    c = it(diff, False).outputs["Color"]
    hs = N.new("ShaderNodeHueSaturation")
    hs.inputs["Hue"].default_value = hue; hs.inputs["Saturation"].default_value = sat; hs.inputs["Value"].default_value = val
    L.new(c, hs.inputs["Color"])
    r = it(rough, True).outputs["Color"] if os.path.exists(rough) else None
    h = it(disp, True).outputs["Color"] if os.path.exists(disp) else None
    return hs.outputs["Color"], r, h

def mixc(N, L, fac, a, b):
    m = N.new("ShaderNodeMix"); m.data_type = "RGBA"; m.blend_type = "MIX"
    L.new(fac, m.inputs["Factor"]); L.new(a, m.inputs[6]); L.new(b, m.inputs[7])
    return m.outputs[2]

def mixf(N, L, fac, a, b):
    m = N.new("ShaderNodeMix"); m.data_type = "FLOAT"
    L.new(fac, m.inputs["Factor"])
    for i, s in ((2, a), (3, b)):
        if isinstance(s, float): m.inputs[i].default_value = s
        else: L.new(s, m.inputs[i])
    return m.outputs[0]

def pbr(name, tex, scale=1.0, hue=0.5, sat=1.0, val=1.0, bump=0.4):
    m, nt, p = new_mat(name); N = nt.nodes; L = nt.links
    tc = N.new("ShaderNodeTexCoord")
    c, r, h = texset(N, L, tc.outputs["Object"], tex, scale, hue, sat, val)
    L.new(c, p.inputs["Base Color"])
    if r: L.new(r, p.inputs["Roughness"])
    if h and bump:
        b = N.new("ShaderNodeBump"); b.inputs["Strength"].default_value = bump; b.inputs["Distance"].default_value = 0.04 * scale
        L.new(h, b.inputs["Height"]); L.new(b.outputs["Normal"], p.inputs["Normal"])
    return m

def flat(name, rgb, rough=0.6, metal=0.0):
    m, nt, p = new_mat(name)
    p.inputs["Base Color"].default_value = (*rgb, 1)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    return m

# terra em camadas pela profundidade (coordenada de objeto = mundo; tudo na origem)
CAMADAS = [  # (textura, escala m, hue, sat, val, topo da camada abaixo)
    ("dry_ground_rocks", 2.2, 0.5, 1.05, 0.95),
    ("red_laterite_soil_stones", 2.6, 0.5, 1.0, 1.3),
    ("cliff_side", 3.4, 0.5, 0.85, 0.95),
    ("rock_boulder_dry", 4.0, 0.5, 0.55, 0.62),
]
ROCHA2 = ("rock_face_03", 5.5, 0.5, 0.45, 0.75)
LIMITES = [-1.6, -8.6, -12.0]

def terra_mat():
    m, nt, p = new_mat("M_terra"); N = nt.nodes; L = nt.links
    tc = N.new("ShaderNodeTexCoord"); vec = tc.outputs["Object"]
    sep = N.new("ShaderNodeSeparateXYZ"); L.new(vec, sep.inputs["Vector"])
    cxz = N.new("ShaderNodeCombineXYZ")   # projecao plana XZ (a face do corte); bem mais barata que BOX
    L.new(sep.outputs["X"], cxz.inputs["X"]); L.new(sep.outputs["Z"], cxz.inputs["Y"]); L.new(sep.outputs["Y"], cxz.inputs["Z"])
    vxz = cxz.outputs["Vector"]
    nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 0.35; nz.inputs["Detail"].default_value = 6
    L.new(vec, nz.inputs["Vector"])
    ma = N.new("ShaderNodeMath"); ma.operation = "MULTIPLY_ADD"
    L.new(nz.outputs["Fac"], ma.inputs[0]); ma.inputs[1].default_value = 0.9; ma.inputs[2].default_value = -0.45
    zz = N.new("ShaderNodeMath"); zz.operation = "ADD"
    L.new(sep.outputs["Z"], zz.inputs[0]); L.new(ma.outputs[0], zz.inputs[1])
    sets = [texset(N, L, vxz, *c, flat=True) for c in CAMADAS]
    r2 = texset(N, L, vxz, *ROCHA2, flat=True)
    nr = N.new("ShaderNodeTexNoise"); nr.inputs["Scale"].default_value = 0.12; nr.inputs["Detail"].default_value = 3
    L.new(vec, nr.inputs["Vector"])
    mrr = N.new("ShaderNodeMapRange"); mrr.interpolation_type = "SMOOTHSTEP"; L.new(nr.outputs["Fac"], mrr.inputs["Value"])
    mrr.inputs["From Min"].default_value = 0.4; mrr.inputs["From Max"].default_value = 0.6
    fr_ = mrr.outputs["Result"]; a_ = sets[-1]
    col = mixc(N, L, fr_, a_[0], r2[0]); rou = mixf(N, L, fr_, a_[1], r2[1]); hei = mixf(N, L, fr_, a_[2], r2[2])
    for i in range(len(LIMITES) - 1, -1, -1):
        mr = N.new("ShaderNodeMapRange"); mr.interpolation_type = "SMOOTHSTEP"
        L.new(zz.outputs[0], mr.inputs["Value"])
        mr.inputs["From Min"].default_value = LIMITES[i] - 0.25; mr.inputs["From Max"].default_value = LIMITES[i] + 0.25
        f = mr.outputs["Result"]
        c, r, h = sets[i]
        col = mixc(N, L, f, col, c)
        rou = mixf(N, L, f, rou, r)
        hei = mixf(N, L, f, hei, h)
    # foliacao do gnaisse: faixas onduladas de tom so na rocha (da leitura de descida e quebra a repeticao)
    wv = N.new("ShaderNodeTexWave"); wv.wave_type = "BANDS"; wv.bands_direction = "Z"
    wv.inputs["Scale"].default_value = 0.035; wv.inputs["Distortion"].default_value = 3.5
    wv.inputs["Detail"].default_value = 3; wv.inputs["Detail Scale"].default_value = 0.6
    L.new(vec, wv.inputs["Vector"])
    cr = N.new("ShaderNodeValToRGB"); L.new(wv.outputs["Fac"], cr.inputs["Fac"])
    els = cr.color_ramp.elements
    els[0].position = 0.0; els[0].color = (0.74, 0.77, 0.82, 1)
    els[1].position = 0.5; els[1].color = (1.0, 1.0, 1.0, 1)
    e3 = els.new(0.78); e3.color = (1.22, 1.05, 0.95, 1)
    e4 = els.new(0.92); e4.color = (0.68, 0.68, 0.72, 1)
    mrz = N.new("ShaderNodeMapRange"); mrz.interpolation_type = "SMOOTHSTEP"; L.new(zz.outputs[0], mrz.inputs["Value"])
    mrz.inputs["From Min"].default_value = -13.0; mrz.inputs["From Max"].default_value = -11.5
    mrz.inputs["To Min"].default_value = 1.0; mrz.inputs["To Max"].default_value = 0.0
    fol = N.new("ShaderNodeMix"); fol.data_type = "RGBA"; fol.blend_type = "MULTIPLY"
    L.new(mrz.outputs["Result"], fol.inputs["Factor"]); L.new(col, fol.inputs[6]); L.new(cr.outputs["Color"], fol.inputs[7])
    col = fol.outputs[2]
    # variacao grande (quebra a repeticao no plano aberto)
    nb = N.new("ShaderNodeTexNoise"); nb.inputs["Scale"].default_value = 0.05; L.new(vec, nb.inputs["Vector"])
    mr2 = N.new("ShaderNodeMapRange"); L.new(nb.outputs["Fac"], mr2.inputs["Value"])
    mr2.inputs["From Min"].default_value = 0.3; mr2.inputs["From Max"].default_value = 0.7
    mr2.inputs["To Min"].default_value = 0.78; mr2.inputs["To Max"].default_value = 1.12
    mul = N.new("ShaderNodeMix"); mul.data_type = "RGBA"; mul.blend_type = "MULTIPLY"; mul.inputs["Factor"].default_value = 1.0
    L.new(col, mul.inputs[6]); L.new(mr2.outputs["Result"], mul.inputs[7])
    L.new(mul.outputs[2], p.inputs["Base Color"])
    L.new(rou, p.inputs["Roughness"])
    b = N.new("ShaderNodeBump"); b.inputs["Strength"].default_value = 0.7; b.inputs["Distance"].default_value = 0.12
    L.new(hei, b.inputs["Height"]); L.new(b.outputs["Normal"], p.inputs["Normal"])
    return m

def haze(m, color=(0.85, 0.52, 0.36), d0=50.0, d1=420.0, k=0.5):
    """nevoa tingida pela distancia da camera (mistura com emissao)"""
    nt = m.node_tree; N = nt.nodes; L = nt.links
    out = next(n for n in N if n.type == "OUTPUT_MATERIAL")
    src = out.inputs["Surface"].links[0].from_socket
    cd = N.new("ShaderNodeCameraData")
    mr = N.new("ShaderNodeMapRange"); L.new(cd.outputs["View Distance"], mr.inputs["Value"])
    mr.inputs["From Min"].default_value = d0; mr.inputs["From Max"].default_value = d1
    mr.inputs["To Max"].default_value = k
    em = N.new("ShaderNodeEmission"); em.inputs["Color"].default_value = (*color, 1); em.inputs["Strength"].default_value = 0.9
    ms = N.new("ShaderNodeMixShader")
    L.new(mr.outputs["Result"], ms.inputs[0]); L.new(src, ms.inputs[1]); L.new(em.outputs[0], ms.inputs[2])
    L.new(ms.outputs[0], out.inputs["Surface"])

def chao_mat():
    m, nt, p = new_mat("M_chao"); N = nt.nodes; L = nt.links
    tc = N.new("ShaderNodeTexCoord"); vec = tc.outputs["Object"]
    a = texset(N, L, vec, "mud_cracked_dry_03", 2.4, 0.49, 1.5, 0.42)
    b = texset(N, L, vec, "dry_ground_rocks", 2.2, 0.5, 1.15, 0.62)
    nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 0.18; nz.inputs["Detail"].default_value = 4
    L.new(vec, nz.inputs["Vector"])
    mr = N.new("ShaderNodeMapRange"); mr.interpolation_type = "SMOOTHSTEP"; L.new(nz.outputs["Fac"], mr.inputs["Value"])
    mr.inputs["From Min"].default_value = 0.42; mr.inputs["From Max"].default_value = 0.58
    f = mr.outputs["Result"]
    L.new(mixc(N, L, f, a[0], b[0]), p.inputs["Base Color"])
    L.new(mixf(N, L, f, a[1], b[1]), p.inputs["Roughness"])
    bb = N.new("ShaderNodeBump"); bb.inputs["Strength"].default_value = 0.6; bb.inputs["Distance"].default_value = 0.08
    L.new(mixf(N, L, f, a[2], b[2]), bb.inputs["Height"]); L.new(bb.outputs["Normal"], p.inputs["Normal"])
    haze(m)
    return m

M_terra = terra_mat()
M_chao = chao_mat()
M_madeira = pbr("M_madeira", "weathered_planks", 0.8, bump=0.3)
M_corda = flat("M_corda", (0.42, 0.33, 0.22), 0.9)
M_aco = flat("M_aco", (0.32, 0.33, 0.34), 0.35, 0.9)
M_amarelo = flat("M_amarelo", (0.55, 0.36, 0.06), 0.45)
M_lasca = pbr("M_lasca", "rock_boulder_dry", 0.6, 0.5, 0.5, 0.62, bump=0.5)
M_monte = pbr("M_monte", "red_laterite_soil_stones", 1.2, bump=0.8)

def cacto_mat():
    m, nt, p = new_mat("M_mandacaru"); N = nt.nodes; L = nt.links
    tc = N.new("ShaderNodeTexCoord")
    nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 6; nz.inputs["Detail"].default_value = 5
    L.new(tc.outputs["Object"], nz.inputs["Vector"])
    cr = N.new("ShaderNodeValToRGB"); L.new(nz.outputs["Fac"], cr.inputs["Fac"])
    cr.color_ramp.elements[0].color = (0.035, 0.05, 0.04, 1); cr.color_ramp.elements[1].color = (0.085, 0.11, 0.085, 1)
    L.new(cr.outputs["Color"], p.inputs["Base Color"]); p.inputs["Roughness"].default_value = 0.55
    b = N.new("ShaderNodeBump"); b.inputs["Strength"].default_value = 0.25; L.new(nz.outputs["Fac"], b.inputs["Height"])
    L.new(b.outputs["Normal"], p.inputs["Normal"])
    return m
M_cacto = cacto_mat(); haze(M_cacto)

def fenda_mat():
    m, nt, p = new_mat("M_fenda"); N = nt.nodes; L = nt.links
    tc = N.new("ShaderNodeTexCoord"); sep = N.new("ShaderNodeSeparateXYZ"); L.new(tc.outputs["Object"], sep.inputs["Vector"])
    ab = N.new("ShaderNodeMath"); ab.operation = "ABSOLUTE"; L.new(sep.outputs["X"], ab.inputs[0])
    fr = N.new("ShaderNodeValue"); fr.name = "frente"; fr.outputs[0].default_value = 99.0
    sub = N.new("ShaderNodeMath"); sub.operation = "SUBTRACT"; L.new(ab.outputs[0], sub.inputs[0]); L.new(fr.outputs[0], sub.inputs[1])
    mr = N.new("ShaderNodeMapRange"); mr.interpolation_type = "SMOOTHSTEP"; L.new(sub.outputs[0], mr.inputs["Value"])
    mr.inputs["From Min"].default_value = -0.4; mr.inputs["From Max"].default_value = 0.0
    mr.inputs["To Min"].default_value = 1.0; mr.inputs["To Max"].default_value = 0.0   # 1 = molhado (|x| > frente)
    seco = N.new("ShaderNodeBsdfPrincipled"); seco.inputs["Base Color"].default_value = (0.025, 0.022, 0.02, 1); seco.inputs["Roughness"].default_value = 0.95
    mol = N.new("ShaderNodeBsdfPrincipled"); mol.inputs["Base Color"].default_value = (0.02, 0.05, 0.06, 1)
    mol.inputs["Roughness"].default_value = 0.08
    mol.inputs["Emission Color"].default_value = (0.35, 0.75, 0.85, 1); mol.inputs["Emission Strength"].default_value = 0.9
    ms = N.new("ShaderNodeMixShader"); L.new(mr.outputs["Result"], ms.inputs[0]); L.new(seco.outputs[0], ms.inputs[1]); L.new(mol.outputs[0], ms.inputs[2])
    out = next(n for n in N if n.type == "OUTPUT_MATERIAL"); L.new(ms.outputs[0], out.inputs["Surface"])
    nt.nodes.remove(p)
    return m, fr
M_fenda, FENDA_FRENTE = fenda_mat()

def agua_mat():
    m, nt, p = new_mat("M_agua"); N = nt.nodes; L = nt.links
    p.inputs["Base Color"].default_value = (0.05, 0.24, 0.27, 1); p.inputs["Roughness"].default_value = 0.06
    p.inputs["Emission Color"].default_value = (0.08, 0.32, 0.36, 1); p.inputs["Emission Strength"].default_value = 0.2
    tr = N.new("ShaderNodeBsdfTransparent"); tr.inputs["Color"].default_value = (0.55, 0.85, 0.9, 1)
    ms = N.new("ShaderNodeMixShader"); ms.inputs[0].default_value = 0.42
    L.new(p.outputs[0], ms.inputs[1]); L.new(tr.outputs[0], ms.inputs[2])
    out = next(n for n in N if n.type == "OUTPUT_MATERIAL"); L.new(ms.outputs[0], out.inputs["Surface"])
    return m
M_agua = agua_mat()

# ---------------------------------------------------------------- geometria do corte
R1 = 0.75      # poco cavado a mao (cacimba) ate a rocha
R2 = 0.42      # furo de perfuratriz na rocha (exagerado p/ ler no plano aberto)
Z_ROCHA = -12.0
FX = 70.0      # meia largura do corte
FZ = -110.0    # fundo do corte

def face_geo(D):
    V = []; F = []
    def quad(x0, x1, z0, z1):
        i = len(V)
        V.extend([(x0, 0, z0), (x1, 0, z0), (x1, 0, z1), (x0, 0, z1)])
        F.append((i, i + 1, i + 2, i + 3))
    if D < 0.02:
        quad(-FX, FX, FZ, 0); return V, F
    quad(-FX, -R1, FZ, 0); quad(R1, FX, FZ, 0)
    if D <= -Z_ROCHA:
        quad(-R1, R1, FZ, -D)
    else:
        quad(-R1, -R2, FZ, Z_ROCHA); quad(R2, R1, FZ, Z_ROCHA); quad(-R2, R2, FZ, -D)
    return V, F

def poco_geo(D):
    V = []; F = []; S = 28
    def meio_cil(r, z0, z1):
        i0 = len(V)
        for z in (z0, z1):
            for j in range(S + 1):
                th = math.pi * j / S
                V.append((r * math.cos(th), r * math.sin(th), z))
        for j in range(S):
            a = i0 + j; b = i0 + j + 1; c = i0 + S + 1 + j + 1; d = i0 + S + 1 + j
            F.append((a, b, c, d))
    def meio_anel(r0, r1, z):
        i0 = len(V)
        for r in (r0, r1):
            for j in range(S + 1):
                th = math.pi * j / S
                V.append((r * math.cos(th), r * math.sin(th), z))
        for j in range(S):
            F.append((i0 + j, i0 + j + 1, i0 + S + 1 + j + 1, i0 + S + 1 + j))
    def meio_disco(r, z):
        i0 = len(V); V.append((0, 0, z))
        for j in range(S + 1):
            th = math.pi * j / S; V.append((r * math.cos(th), r * math.sin(th), z))
        for j in range(S):
            F.append((i0, i0 + 1 + j, i0 + 2 + j))
    if D < 0.02: return V, F
    d1 = min(D, -Z_ROCHA)
    meio_cil(R1, -d1, 0)
    if D <= -Z_ROCHA:
        meio_disco(R1, -D)
    else:
        meio_anel(R2, R1, Z_ROCHA)
        meio_cil(R2, -D, Z_ROCHA)
        meio_disco(R2, -D)
    return V, F

face = mesh_obj("Face", *face_geo(0), M_terra)
poco = mesh_obj("Poco", *poco_geo(0), M_terra)

# chao de cima (meio anel polar, com o buraco do poco)
def chao_geo():
    rs = [R1, 0.95, 1.2, 1.6, 2.2, 3.0, 4.2, 6, 9, 13, 19, 28, 42, 64, 100, 160, 260, 420]
    S = 64; V = []; F = []
    for r in rs:
        for j in range(S + 1):
            th = math.pi * j / S
            V.append((r * math.cos(th), r * math.sin(th), 0.0))
    for i in range(len(rs) - 1):
        for j in range(S):
            a = i * (S + 1) + j
            F.append((a, a + 1, a + S + 2, a + S + 1))
    return V, F
chao = mesh_obj("Chao", *chao_geo(), M_chao)
tampa = mesh_obj("Tampa", *[[(0, 0, 0)] + [(R1 * math.cos(math.pi * j / 28), R1 * math.sin(math.pi * j / 28), 0) for j in range(29)],
                            [(0, j + 1, j + 2) for j in range(28)]], M_chao)

# fendas na rocha (faixas escuras na face, um pouco a frente)
Z_FENDA = -57.3
def fenda(z0, x0, x1, seed, w0=0.05, w1=0.13):
    rnd = random.Random(seed)
    xs = np.arange(x0, x1, 0.3 if abs(x1 - x0) < 30 else 0.45)
    V = []; F = []; z = z0
    for i, x in enumerate(xs):
        z += rnd.uniform(-0.09, 0.09); z = max(min(z, z0 + 0.5), z0 - 0.5)
        w = rnd.uniform(w0, w1)
        V.extend([(x, -0.006, z - w / 2), (x, -0.006, z + w / 2)])
        if i: F.append((2 * i - 2, 2 * i, 2 * i + 1, 2 * i - 1))
    return mesh_obj(f"Fenda_{seed}", V, F, M_fenda)
fendas = [fenda(Z_FENDA, -FX, -R2 + 0.01, 1), fenda(Z_FENDA + 0.15, R2 - 0.01, FX, 2),
          fenda(Z_FENDA + 1.1, -14, -2.0, 3, 0.02, 0.06), fenda(Z_FENDA - 0.9, 3.0, 22, 4, 0.02, 0.06),
          fenda(-33.5, -9, -3, 5, 0.015, 0.045), fenda(-41.0, 2.5, 11, 6, 0.015, 0.045)]

M_veio = flat("M_veio", (0.62, 0.58, 0.52), 0.5)
def veio(z0, x0, x1, inc, seed, w=0.06):
    rnd = random.Random(seed); V = []; F = []
    xs = np.arange(x0, x1, 0.4)
    for i, x in enumerate(xs):
        z = z0 + inc * (x - x0) + rnd.uniform(-0.05, 0.05); ww = w * rnd.uniform(0.5, 1.3)
        V.extend([(x, -0.004, z - ww / 2), (x, -0.004, z + ww / 2)])
        if i: F.append((2 * i - 2, 2 * i, 2 * i + 1, 2 * i - 1))
    return mesh_obj(f"Veio_{seed}", V, F, M_veio)
for i, (z0, x0, x1, inc) in enumerate([(-16, -20, -1.0, -0.25), (-22, 1.5, 25, 0.18), (-31, -30, -1.2, 0.12),
                                       (-44, 2.0, 30, -0.3), (-49, -25, -3, 0.35), (-66, -30, 30, 0.05), (-19, -6, -1.0, 0.9)]):
    veio(z0, x0, x1, inc, 20 + i, 0.05 + 0.03 * (i % 3))

# agua (frente + tampa no nivel)
agua = mesh_obj("Agua", [(0, 0, 0)] * 3, [(0, 1, 2)], M_agua)
def agua_geo(z0, wl):
    S = 20; r = R2 - 0.01
    V = [(-r, -0.003, z0), (r, -0.003, z0), (r, -0.003, wl), (-r, -0.003, wl)]
    F = [(0, 1, 2, 3)]
    i0 = len(V); V.append((0, 0, wl))
    for j in range(S + 1):
        th = math.pi * j / S; V.append((r * math.cos(th), r * math.sin(th), wl))
    for j in range(S): F.append((i0, i0 + 1 + j, i0 + 2 + j))
    return V, F

# ---------------------------------------------------------------- mandacaru (codigo)
def coluna(name, base, h, r, ribs=8):
    bm = bmesh.new(); rings = []; nz = max(2, int(h / 0.2)); M = ribs * 6
    tops = 5
    for i in range(nz + tops + 1):
        if i <= nz: z = h * i / nz; rr = r * (1.0 - 0.06 * (i / nz))
        else:
            a = (i - nz) / tops * (math.pi / 2) * 0.96
            z = h + r * 0.85 * math.sin(a); rr = r * 0.94 * math.cos(a)
        ring = []
        for j in range(M):
            th = 2 * math.pi * j / M
            rib = 0.80 + 0.20 * abs(math.cos(th * ribs / 2)) ** 0.6
            ring.append(bm.verts.new((rr * rib * math.cos(th), rr * rib * math.sin(th), z)))
        rings.append(ring)
    for a, b in zip(rings[:-1], rings[1:]):
        for j in range(M):
            bm.faces.new((a[j], a[(j + 1) % M], b[(j + 1) % M], b[j]))
    c = bm.verts.new((0, 0, h + r * 0.86))
    top = rings[-1]
    for j in range(M): bm.faces.new((top[j], top[(j + 1) % M], c))
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.shade_smooth()
    ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob); me.materials.append(M_cacto)
    ob.location = base
    return ob

def mandacaru(pos, s=1.0, seed=0):
    rnd = random.Random(seed)
    x, y = pos
    H = rnd.uniform(3.2, 4.2) * s
    coluna("mc_tronco", (x, y, 0), 0.9 * s, 0.2 * s)
    coluna("mc_tronco2", (x, y, 0.8 * s), H - 0.8 * s, 0.15 * s)
    n = 5 + seed % 3
    for k in range(n):
        ang = 2 * math.pi * k / n + rnd.uniform(-0.3, 0.3)
        h0 = rnd.uniform(0.7, 1.6) * s
        L = rnd.uniform(0.22, 0.38) * s; r = rnd.uniform(0.10, 0.13) * s
        ox = x + L * math.cos(ang); oy = y + L * math.sin(ang)
        br = coluna("mc_braco", (x, y, h0), L, r * 0.92)
        br.rotation_euler = (0, math.pi / 2, ang)
        coluna("mc_ramo", (ox, oy, h0 - 0.06 * s), rnd.uniform(0.45, 0.85) * (H - h0), r)

mandacaru((-2.5, 3.2), 1.0, 1)
mandacaru((3.4, 7.5), 1.25, 2)
mandacaru((-6.5, 12.0), 1.1, 5)
mandacaru((-16.0, 28.0), 1.4, 3)
mandacaru((22.0, 45.0), 1.6, 4)
# horizonte: mandacarus e pedras espalhados + serras baixas ao longe (somem na nevoa)
_r = random.Random(11)
for i in range(22):
    ang = _r.uniform(0.15, math.pi - 0.15); rr = _r.uniform(30, 220)
    mandacaru((rr * math.cos(ang), rr * math.sin(ang)), _r.uniform(1.0, 1.8), i)
for i, (x, y, sx, sz) in enumerate([(-260, 380, 140, 28), (60, 420, 180, 40), (300, 360, 120, 22), (-90, 300, 70, 14)]):
    me = bpy.data.meshes.new("serra"); bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=16, radius=1.0); bm.to_mesh(me); bm.free(); me.shade_smooth()
    o = bpy.data.objects.new("serra", me); sc.collection.objects.link(o); me.materials.append(M_chao)
    o.location = (x, y, -sz * 0.35); o.scale = (sx, sx * 0.4, sz)

# ---------------------------------------------------------------- modelos poly haven
def gltf(name, loc, rotz=0.0, s=1.0):
    p = _acha(os.path.join(AS, "mod", name, f"{name}_*.gltf"))
    before = set(bpy.data.objects)
    if os.path.exists(p):
        bpy.ops.import_scene.gltf(filepath=p)
    else:   # modelo que nao veio no conjunto reduzido: a cena segue sem ele
        print("@@sem_modelo", name, flush=True)
    new = [o for o in bpy.data.objects if o not in before]
    root = bpy.data.objects.new(name + "_root", None); sc.collection.objects.link(root)
    for o in new:
        if o.parent is None: o.parent = root
    root.location = loc; root.rotation_euler = (0, 0, rotz); root.scale = (s, s, s)
    return root, new

gltf("namaqualand_boulder_02", (-7.5, 7.5, -0.2), 0.4, 1.3)
gltf("namaqualand_boulder_05", (9.5, 6.0, -0.15), 2.1, 1.0)
gltf("namaqualand_boulder_02", (-30, 60, -0.3), 1.2, 3.0)
gltf("searsia_burchellii", (2.3, 4.2, 0), 0.5, 0.7)
gltf("namaqualand_boulder_05", (-3.6, 6.0, -0.1), 0.7, 0.8)
gltf("wild_rooibos_bush", (1.2, 8.5, 0), 2.0, 0.9)
gltf("searsia_burchellii", (-11.0, 14.0, 0), 2.0, 1.1)
gltf("wild_rooibos_bush", (-2.6, 5.5, 0), 0.0, 0.8)
gltf("wild_rooibos_bush", (12.0, 18.0, 0), 1.0, 1.0)
gltf("dry_branches_medium_01", (1.8, 3.6, 0), 0.8, 1.0)
gltf("dead_tree_trunk", (-6.0, 2.6, 0), 1.9, 0.9)
pic_r, _ = gltf("picke_dirty_01", (-1.7, 1.3, 0.05), 0.5, 1.0)
pic_r.rotation_euler = (math.radians(80), 0, 0.5)
pa_r, _ = gltf("rusted_spade_01", (1.6, 2.6, 0.02), 1.0, 1.0)
pa_r.rotation_euler = (math.radians(-75), 0, 2.2)
balde_r, _ = gltf("wooden_bucket_01", (0, 0.3, 0.5), 0.0, 0.85)

# ---------------------------------------------------------------- sarilho (cavacao a mao)
sar = []
for sx in (-1, 1):
    sar.append(box("sar_poste", (sx * 1.15, 0.45, 0.72), (0.14, 0.14, 1.44), M_madeira, 0.01))
eixo = cyl_between("sar_eixo", (-1.3, 0.45, 1.3), (1.3, 0.45, 1.3), 0.085, M_madeira)
sar.append(eixo)
sar.append(box("sar_manivela", (1.36, 0.45, 1.15), (0.05, 0.06, 0.34), M_madeira))
sar.append(cyl_between("sar_cabo", (1.36, 0.45, 1.0), (1.55, 0.45, 1.0), 0.03, M_madeira))
sar_root = bpy.data.objects.new("sar_root", None); sc.collection.objects.link(sar_root)
for o in sar: o.parent = sar_root
corda = cyl_between("corda", (0, 0.45, 1.3), (0, 0.45, 0.5), 0.016, M_corda, 8)

# ---------------------------------------------------------------- perfuratriz (rocha)
APEX = Vector((0, 0.2, 7.2))
rig = []
for p in [(-2.6, 0.35, 0), (2.6, 0.35, 0), (0, 3.6, 0)]:
    rig.append(cyl_between("rig_perna", p, APEX, 0.07, M_amarelo))
rig.append(cyl_between("rig_polia", APEX + Vector((-0.25, 0, 0)), APEX + Vector((0.25, 0, 0)), 0.32, M_aco, 20))
rig.append(box("rig_motor", (3.3, 2.6, 0.38), (1.1, 0.8, 0.76), M_amarelo, 0.03))
rig.append(box("rig_motor2", (3.3, 2.6, 0.85), (0.6, 0.5, 0.2), M_aco, 0.02))
rig_root = bpy.data.objects.new("rig_root", None); sc.collection.objects.link(rig_root)
for o in rig: o.parent = rig_root
haste = cyl_between("haste", (0, 0.2, 7.0), (0, 0.2, 0.0), 0.07, M_aco, 12)
broca = cyl_between("broca", (0, 0.2, 0.0), (0, 0.2, -0.45), 0.24, M_aco, 16)
lascas = []
rnd = random.Random(9)
for i in range(26):
    me = bpy.data.meshes.new("lasca"); bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=rnd.uniform(0.03, 0.07)); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new("lasca", me); sc.collection.objects.link(o); me.materials.append(M_lasca)
    o["ph"] = rnd.uniform(0, 6.28); o["vx"] = rnd.uniform(-1, 1); o["vy"] = rnd.uniform(0.05, 0.3); o["sp"] = rnd.uniform(1.5, 3.0)
    lascas.append(o)

# ---------------------------------------------------------------- montes de terra (crescem com a escavacao)
def monte(name, loc, mat, seed):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=40, v_segments=20, radius=1.0)
    rnd = random.Random(seed)
    for v in bm.verts:
        if v.co.z < 0: v.co.z = 0
        else: v.co.z *= 0.42
        n = 1 + 0.10 * math.sin(v.co.x * 7 + seed) * math.cos(v.co.y * 6) + rnd.uniform(-0.03, 0.03)
        v.co.x *= n; v.co.y *= n
    bm.to_mesh(me); bm.free(); me.shade_smooth()
    o = bpy.data.objects.new(name, me); sc.collection.objects.link(o); me.materials.append(mat)
    o.location = loc
    return o
monte1 = monte("Monte_terra", (2.7, 1.9, -0.02), M_monte, 1)
monte2 = monte("Monte_lasca", (-3.4, 2.6, -0.02), M_lasca, 2)

# ---------------------------------------------------------------- luz e mundo
w = bpy.data.worlds.new("W"); sc.world = w
wn = w.node_tree; WN = wn.nodes; WL = wn.links
bg = next(n for n in WN if n.type == "BACKGROUND")
env = WN.new("ShaderNodeTexEnvironment")
env.image = bpy.data.images.load(_acha(os.path.join(AS, "hdri", "kloppenheim_06_puresky_*")))
# acha o sol no HDRI e alinha com a lampada
_buf = np.empty(env.image.size[0] * env.image.size[1] * 4, dtype=np.float32); env.image.pixels.foreach_get(_buf)
px = _buf.reshape(env.image.size[1], env.image.size[0], 4)
lum = px[..., :3].sum(-1); iy, ix = np.unravel_index(np.argmax(lum), lum.shape)
H_, W_ = lum.shape
u = (ix + 0.5) / W_; v = (iy + 0.5) / H_
phi_img = (u - 0.5) * 2 * math.pi
elev_img = (v - 0.5) * math.pi
SOL_DIR = Vector((0.95, -0.34, 0.0)).normalized()        # sol vem da frente-direita (lado da camera)
el = max(math.radians(9), min(math.radians(16), elev_img))
SOL_DIR = Vector((SOL_DIR.x * math.cos(el), SOL_DIR.y * math.cos(el), math.sin(el)))
phi_want = math.atan2(SOL_DIR.y, -SOL_DIR.x)
alpha = phi_want - phi_img
print("@@hdri sol u,v", u, v, "elev", math.degrees(elev_img), "rot", math.degrees(alpha))
tcw = WN.new("ShaderNodeTexCoord"); mpw = WN.new("ShaderNodeMapping"); mpw.inputs["Rotation"].default_value = (0, 0, alpha)
WL.new(tcw.outputs["Generated"], mpw.inputs["Vector"]); WL.new(mpw.outputs["Vector"], env.inputs["Vector"])
WL.new(env.outputs["Color"], bg.inputs["Color"]); bg.inputs["Strength"].default_value = 0.55

sun_d = bpy.data.lights.new("Sol", "SUN"); sun_d.energy = 4.2; sun_d.angle = math.radians(1.5)
sun_d.color = (1.0, 0.70, 0.46)
sun = bpy.data.objects.new("Sol", sun_d); sc.collection.objects.link(sun)
sun.rotation_euler = (-SOL_DIR).to_track_quat("-Z", "Y").to_euler()

# ---------------------------------------------------------------- linha do tempo
E = TL["etapas"]
def D_at(t):
    D = 0.0
    for e in E:
        if "cava" in e:
            a, b = e["cava"]; d0, d1 = e["de"], e["ate"]
            if t >= a: D = lerp(d0, d1, ease_io(a, b, t))
    return D

def cavando(t):
    for e in E:
        if "cava" in e:
            a, b = e["cava"]
            if a <= t <= b: return e
    return None

W_ = TL["agua"]
def nivel(t):
    return lerp(W_["de"], W_["ate"], ease_io(W_["t"][0], W_["t"][1], t))

# ---------------------------------------------------------------- camera
cam_d = bpy.data.cameras.new("Cam"); cam = bpy.data.objects.new("Cam", cam_d); sc.collection.objects.link(cam)
sc.camera = cam
cam_d.sensor_fit = "VERTICAL"; cam_d.sensor_height = 36.0
cam_d.clip_start = 0.1; cam_d.clip_end = 1500
cam_d.dof.use_dof = True; cam_d.dof.aperture_fstop = 5.6

def look(pos, tgt, lens):
    cam.location = pos
    cam.rotation_euler = (Vector(tgt) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()
    cam_d.lens = lens
    cam_d.dof.focus_distance = (Vector(tgt) - Vector(pos)).length

C = TL["camera"]
def foco_cru(t):
    if t < W_["t"][0] - 0.2:
        return min(C["foco_topo"], -D_at(t) + C["acima_fundo"])
    return min(C["foco_topo"], nivel(t) + 0.4)
def dist_cru(t):
    ks = C["dist"]  # [[t, d], ...]
    for (t0, d0), (t1, d1) in zip(ks[:-1], ks[1:]):
        if t0 <= t <= t1: return lerp(d0, d1, smooth(t0, t1, t))
    return ks[-1][1] if t > ks[-1][0] else ks[0][1]

# segue com atraso (mola criticamente amortecida), precomputada
DT = 1.0 / 240
NS = int((DUR + 1) / DT) + 2
FOC = np.zeros(NS); DIS = np.zeros(NS)
f, fv = foco_cru(0), 0.0; d, dv = dist_cru(0), 0.0
wf = 2 * math.pi / C["mola_s"]
for i in range(NS):
    t = i * DT
    tf = foco_cru(t); td = dist_cru(t)
    fa = wf * wf * (tf - f) - 2 * wf * fv; fv += fa * DT; f += fv * DT
    da = wf * wf * (td - d) - 2 * wf * dv; dv += da * DT; d += dv * DT
    FOC[i] = f; DIS[i] = d

def cam_at(t):
    i = min(NS - 1, int(t / DT))
    f = FOC[i]; d = DIS[i]
    x = C["x0"] + C["vx"] * t
    pos_c = Vector((x, -d, f + C["alt"] * (d / 10.0)))
    tgt_c = Vector((x * 0.25, 0.4, f - 0.25))
    a, b = C["abre"]
    k = ease_io(a, b, t)
    if k > 0:
        te = t - a
        Wd = C["larga_dist"] + C["larga_v"] * te
        fz = C["larga_foco"]
        dl = math.exp(lerp(math.log(d), math.log(Wd), k))
        fz_k = lerp(f, fz, smooth(a, b - 0.6, t))
        xw = lerp(x, C["larga_x"] - 0.5 * te, k)
        pos_c = Vector((xw, -dl, fz_k + C["alt"] * (dl / 10.0) * lerp(1, 0.35, k)))
        tgt_c = Vector((xw * 0.25, 0.4, fz_k - 0.25))
    look(pos_c, tgt_c, C["lente"])

# ---------------------------------------------------------------- aplicar estado
_cache = {"D": None, "wl": None}
def aplicar(t):
    D = D_at(t)
    Dk = round(D, 3)
    if Dk != _cache["D"]:
        set_mesh(face, *face_geo(D)); set_mesh(poco, *poco_geo(D)); _cache["D"] = Dk
    tampa.hide_render = D >= 0.02
    # sarilho: entra no 1o golpe, sai quando chega a perfuratriz
    s_in = ease_back(TL["sarilho"][0], TL["sarilho"][0] + 0.5, t)
    s_out = 1 - smooth(TL["sarilho"][1], TL["sarilho"][1] + 0.45, t)
    ks = s_in * s_out
    sar_root.scale = (max(ks, 0.001),) * 3
    for o in sar: o.hide_render = ks < 0.01
    # balde sobe e desce enquanto cava (fase a mao)
    e = cavando(t)
    if e and e["ate"] <= -Z_ROCHA:
        a, b = e["cava"]; per = 1.1
        ph = ((t - a) / per) % 1.0
        tri = 1 - abs(2 * ph - 1)
        zb = lerp(0.55, -D + 0.08, tri)
    else:
        zb = 0.55
    balde_r.location = (0, 0.45, zb - 0.0)
    for o in balde_r.children_recursive: o.hide_render = ks < 0.01
    corda.hide_render = ks < 0.01
    corda.location = (0, 0.45, (1.3 + zb + 0.3) / 2); corda.scale = (1, 1, max(0.01, 1.3 - (zb + 0.3)))
    # perfuratriz
    kr = ease_back(TL["rig"][0], TL["rig"][0] + 0.7, t)
    rig_root.scale = (max(kr, 0.001),) * 3; rig_root.location = (0, 0, 0)
    for o in rig: o.hide_render = kr < 0.01
    # haste ate o fundo enquanto fura; sai antes da agua
    sube = smooth(TL["haste_sai"][0], TL["haste_sai"][1], t)
    zbit = lerp(-D + 0.45, 9.0, sube)
    vis_h = kr > 0.98 and t >= TL["rig"][0] + 0.7 and zbit < 7.0
    top = 7.0
    haste.hide_render = not vis_h; broca.hide_render = not vis_h
    if vis_h:
        haste.location = (0, 0.2, (top + zbit) / 2); haste.scale = (1, 1, max(0.01, top - zbit))
        rot = t * 9.0
        haste.rotation_euler = (0, 0, rot)
        broca.location = (0, 0.2, zbit - 0.22); broca.scale = (1, 1, 0.45); broca.rotation_euler = (0, 0, rot)
    # lascas pulando no fundo enquanto fura
    fur = e is not None and e["ate"] > -Z_ROCHA
    for o in lascas:
        o.hide_render = not fur
        if fur:
            ph = (t * o["sp"] + o["ph"]) % 1.0
            o.location = (o["vx"] * R2 * 0.8 * ph, o["vy"], -D + 0.05 + 0.9 * ph * (1 - ph) * 2.2)
    # montes
    k1 = min(D, -Z_ROCHA) / -Z_ROCHA
    s1 = 1.9 * math.sqrt(k1) + 0.001
    monte1.scale = (s1, s1 * 0.85, s1); monte1.hide_render = k1 < 0.01
    k2 = max(0.0, D + Z_ROCHA) / (58 + Z_ROCHA)
    s2 = 1.6 * math.sqrt(k2) + 0.001
    monte2.scale = (s2, s2 * 0.8, s2 * 0.8); monte2.hide_render = k2 < 0.01
    # fenda molhando: a frente vem de fora para o poco
    a, b = TL["fenda"]
    FENDA_FRENTE.outputs[0].default_value = lerp(16.0, R2 - 0.05, ease_io(a, b, t)) if t >= a else 99.0
    # agua
    if t >= W_["t"][0]:
        wl = nivel(t) + 0.02 * math.sin(t * 3)
        if _cache["wl"] != round(wl, 3):
            set_mesh(agua, *agua_geo(-D, wl)); _cache["wl"] = round(wl, 3)
        agua.hide_render = False
    else:
        agua.hide_render = True
    cam_at(t)

# ---------------------------------------------------------------- render
def setup_render(wd, ht, spp):
    r = sc.render
    r.resolution_x = wd; r.resolution_y = ht; r.resolution_percentage = 100
    r.image_settings.file_format = "PNG"; r.image_settings.color_mode = "RGB"
    vs = sc.view_settings
    vs.view_transform = "AgX"
    try: vs.look = "AgX - Medium High Contrast"
    except TypeError: pass
    vs.exposure = float(os.environ.get("EXPO", "0.25"))
    r.engine = "CYCLES"
    cy = sc.cycles
    cy.device = "CPU"
    cy.samples = spp; cy.use_adaptive_sampling = True; cy.adaptive_threshold = 0.04
    cy.use_denoising = True
    try: cy.denoiser = "OPENIMAGEDENOISE"
    except TypeError: pass
    cy.max_bounces = 5; cy.diffuse_bounces = 2; cy.glossy_bounces = 1; cy.transmission_bounces = 3
    cy.transparent_max_bounces = 10; cy.caustics_reflective = False; cy.caustics_refractive = False
    cy.sample_clamp_indirect = 5
    r.use_persistent_data = True
    th = int(os.environ.get("THREADS", "0"))
    if th:
        r.threads_mode = "FIXED"; r.threads = th

if MODO == "still":
    t = float(argv[1]); out = argv[2]
    wd, ht, spp = int(argv[3]), int(argv[4]), int(argv[5])
    setup_render(wd, ht, spp)
    aplicar(t)
    sc.render.filepath = out
    bpy.ops.render.render(write_still=True)
    print("@@ok", out)
elif MODO == "video":
    d = argv[1]; wd, ht, spp = int(argv[2]), int(argv[3]), int(argv[4])
    f0 = int(argv[5]) if len(argv) > 5 else 1
    f1 = int(argv[6]) if len(argv) > 6 else int(DUR * FPS)
    step = int(argv[7]) if len(argv) > 7 else 1
    os.makedirs(d, exist_ok=True)
    setup_render(wd, ht, spp)
    import time
    for fr in range(f0, f1 + 1, step):
        p = os.path.join(d, f"f_{fr:05d}.png")
        if os.path.exists(p): continue
        t0 = time.time()
        aplicar((fr - 1) / FPS)
        sc.render.filepath = p
        bpy.ops.render.render(write_still=True)
        print(f"@@frame {fr} {time.time() - t0:.1f}s", flush=True)
elif MODO == "blend":
    aplicar(float(argv[2]) if len(argv) > 2 else 10)
    bpy.ops.wm.save_as_mainfile(filepath=argv[1])
