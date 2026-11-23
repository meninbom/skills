"""Extrai o código dos scripts (Script, LocalScript, ModuleScript) de um lugar .rbxl binário, sem abrir o Roblox Studio.

Uso: python extrair_luau.py MeuLugar.rbxl pasta_saida
Grava um .luau por script (nome = caminho no Explorer com pontos) e um indice.json.
Serve para versionar e revisar o código que a IA escreveu dentro do lugar. Precisa do pacote zstandard
(lugares novos comprimem os blocos em zstd; os antigos, em LZ4, lidos aqui sem dependência).
"""
import struct, sys, json
from pathlib import Path

def lz4(src, n):
    out = bytearray(); i = 0
    while i < len(src):
        t = src[i]; i += 1
        l = t >> 4
        if l == 15:
            while True:
                b = src[i]; i += 1; l += b
                if b != 255: break
        out += src[i:i+l]; i += l
        if i >= len(src): break
        off = src[i] | (src[i+1] << 8); i += 2
        m = t & 15
        if m == 15:
            while True:
                b = src[i]; i += 1; m += b
                if b != 255: break
        m += 4
        p = len(out) - off
        for k in range(m): out.append(out[p+k])
    assert len(out) == n, (len(out), n)
    return bytes(out)

def zstd(b, n):
    try:
        from compression import zstd as z
        return z.decompress(b)
    except ImportError:
        import zstandard
        return zstandard.ZstdDecompressor().decompress(b, max_output_size=n)

class R:
    def __init__(s, b): s.b = b; s.i = 0
    def u8(s): v = s.b[s.i]; s.i += 1; return v
    def u32(s): v = struct.unpack_from('<I', s.b, s.i)[0]; s.i += 4; return v
    def st(s): n = s.u32(); v = s.b[s.i:s.i+n]; s.i += n; return v
    def ints(s, n):
        raw = s.b[s.i:s.i+4*n]; s.i += 4*n; out = []
        for k in range(n):
            v = (raw[k] << 24) | (raw[n+k] << 16) | (raw[2*n+k] << 8) | raw[3*n+k]
            out.append((v >> 1) ^ -(v & 1))
        return out
    def refs(s, n):
        d = s.ints(n); a = 0; out = []
        for x in d: a += x; out.append(a)
        return out

data = Path(sys.argv[1]).read_bytes()
assert data[:8] == b'<roblox!'
i = 32
classes = {}; inst = {}; parent = {}
while i < len(data):
    name = data[i:i+4]; cl, ul = struct.unpack_from('<II', data, i+4); i += 16
    if cl == 0: body = data[i:i+ul]; i += ul
    else:
        c = data[i:i+cl]; i += cl
        body = zstd(c, ul) if c[:4] == b'\x28\xb5\x2f\xfd' else lz4(c, ul)
    r = R(body)
    if name == b'INST':
        cid = r.u32(); cn = r.st().decode(); fmt = r.u8(); n = r.u32(); ids = r.refs(n)
        classes[cid] = (cn, ids)
        for x in ids: inst[x] = {'class': cn}
    elif name == b'PROP':
        cid = r.u32(); pn = r.st().decode(); t = r.u8(); cn, ids = classes[cid]
        if t == 1 and pn in ('Name', 'Source'):
            for x in ids: inst[x][pn] = r.st()
    elif name == b'PRNT':
        r.u8(); n = r.u32(); ch = r.refs(n); pa = r.refs(n)
        for a, b in zip(ch, pa): parent[a] = b
    elif name == b'END\x00': break

def caminho(x):
    p = []
    while x in inst:
        p.append(inst[x].get('Name', b'?').decode('utf8', 'replace')); x = parent.get(x, -1)
    return '/'.join(reversed(p))

out = Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True); idx = []
for x, d in inst.items():
    if d['class'] in ('Script', 'LocalScript', 'ModuleScript'):
        src = d.get('Source', b'')
        c = caminho(x)
        print(d['class'], c, len(src))
        if src:
            f = c.replace('/', '.') + '.luau'
            (out / f).write_bytes(src); idx.append({'arquivo': f, 'classe': d['class'], 'caminho': c, 'bytes': len(src)})
(out / 'indice.json').write_text(json.dumps(idx, ensure_ascii=False, indent=1), encoding='utf8')
