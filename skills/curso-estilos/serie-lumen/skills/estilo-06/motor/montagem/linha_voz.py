"""Linha do tempo REAL a partir da voz: o visual segue a voz, nunca o contrário.

Entrada (na pasta do episódio):
  linha_estimada.json   a linha escrita antes da voz (ver LINHA.md), com estes campos a mais:
     "voz_narr": "voz/narr.wav", "voz_palavras": "voz/narr.words.json"   (o que o voz/gerar_voz.py grava; são os padrões)
     "quebras": [ {"id": "I1", "depois_de": "sem olhar pra ele", "fala": "voz/falas/I1.wav", "texto": "o que a fala diz"},
                  {"id": "PUM", "depois_de": "escorregando do ombro", "pausa": 1.5} ]      (opcional: fala de personagem ou silêncio no meio da narração)
     "cauda": 2.4        segundos de imagem depois da última palavra
     "dur_clipe": {"S01": 3.0, ...}   (opcional) duração de cada clipe animado, pra calcular a velocidade do plano
  em cada segmento: "ancora": "frase da narração em que o plano começa"   (o 1º segmento começa em 0)
                    ou "ancora": "@I1" (0,1 s antes da quebra I1) / "@I1+0.62" (62% da fala)
                    "ancoras": {"cartoes": "Atira", "soco": "virou a cabeça"}  (campo do efeito = tempo da frase dentro do plano)
Saída: voz/voz.wav (narração + falas + pausas, já no tempo do vídeo) e linha_voz.json (t e dur de cada segmento, 'palavras' com
o tempo de cada palavra no vídeo final, que é o que a checagem de fala por plano usa).

uso: python linha_voz.py <pasta do episódio>   ->   montar.py <ep>/linha_voz.json <base>   +   mixar.py (mesmos argumentos)
"""
import os, sys, json, re, subprocess
import numpy as np

if len(sys.argv) < 2: raise SystemExit(__doc__)
EP = os.path.abspath(sys.argv[1]); SR = 48000; PRE, POS = 0.22, 0.28
E = json.load(open(os.path.join(EP, 'linha_estimada.json'), encoding='utf-8'))


def le_wav(f):
    return np.frombuffer(subprocess.check_output(['ffmpeg', '-v', 'error', '-i', f, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-']), np.float32).copy()


def norm(w): return re.sub(r'[^a-zà-ú0-9]', '', w.lower())


W = json.load(open(os.path.join(EP, E.get('voz_palavras', 'voz/narr.words.json')), encoding='utf8'))
W = [w for w in W if norm(w['w'])]
narr = le_wav(os.path.join(EP, E.get('voz_narr', 'voz/narr.wav')))


def acha(seq, ini=0):
    alvo = [norm(x) for x in seq.split() if norm(x)]
    for i in range(ini, len(W) - len(alvo) + 1):
        if [norm(W[i + j]['w']) for j in range(len(alvo))] == alvo: return i
    raise SystemExit(f'não achei na narração: "{seq}" (a âncora tem que ser um trecho exato do texto falado)')


# 1) costura: narração cortada nos pontos de quebra, com a fala (ou a pausa) encaixada e um respiro antes e depois
pecas, mapa, T, pos, ini_fala, ult = [], [], 0.0, 0.0, {}, 0
for q in E.get('quebras', []):
    i = acha(q['depois_de'], ult) + len([x for x in q['depois_de'].split() if norm(x)]) - 1; ult = i + 1
    c = min(W[i]['end'] + 0.12, (W[i]['end'] + W[i + 1]['start']) / 2) if i + 1 < len(W) else W[i]['end'] + 0.12
    pecas.append(narr[int(pos * SR):int(c * SR)]); mapa.append((pos, c, T)); T += c - pos; pos = c
    pecas.append(np.zeros(int(PRE * SR), np.float32)); T += PRE
    f = np.zeros(int(float(q['pausa']) * SR), np.float32) if 'pausa' in q else le_wav(os.path.join(EP, q['fala']))
    ini_fala[q['id']] = (T, len(f) / SR); pecas.append(f); T += len(f) / SR
    pecas.append(np.zeros(int(POS * SR), np.float32)); T += POS
pecas.append(narr[int(pos * SR):]); mapa.append((pos, len(narr) / SR, T)); T += len(narr) / SR - pos
os.makedirs(os.path.join(EP, 'voz'), exist_ok=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', os.path.join(EP, 'voz', 'voz.wav')],
               input=np.concatenate(pecas).tobytes(), check=True)


def tv(i, campo='start'):
    """tempo da palavra i no vídeo final (depois da costura)"""
    t = W[i][campo]
    for a, b, t0 in mapa:
        if a - 0.01 <= t <= b + 0.01: return t0 + (t - a)
    raise SystemExit('palavra fora do mapa')


def A(s):
    if s.startswith('@'):
        m = re.match(r'@([^+]+)(?:\+([\d.]+))?$', s)
        if not m or m.group(1) not in ini_fala: raise SystemExit(f'âncora {s}: não existe quebra com esse id')
        t0, d = ini_fala[m.group(1)]
        return t0 - 0.1 if not m.group(2) else t0 + d * float(m.group(2))
    return tv(acha(s))


# 2) cada segmento ancorado numa palavra
fim = T + float(E.get('cauda', 2.0)); S0 = E['segmentos']
anc = [0.0 if (i == 0 and 'ancora' not in s) else A(s['ancora']) if 'ancora' in s else None for i, s in enumerate(S0)]
if None in anc: raise SystemExit(f'segmento {anc.index(None)} sem "ancora"')
if any(b <= a for a, b in zip(anc, anc[1:])): raise SystemExit(f'âncoras fora de ordem: {[round(x, 2) for x in anc]}')
segs = []
for i, s in enumerate(S0):
    s = dict(s); s['t'] = round(anc[i], 3); s['dur'] = round((anc[i + 1] if i + 1 < len(anc) else fim) - anc[i], 3)
    for campo, frase in s.get('ancoras', {}).items(): s[campo] = round(A(frase) - s['t'], 3)
    if 'raiox' in s: s['raiox'][1] = round(s['dur'], 3)
    if 'bicho' in s: s['bicho'] = [0.2, round(s['dur'] - 0.2, 3)]
    dc = E.get('dur_clipe', {}).get(s['plano'])
    if dc and not any(x in s.get('fx', []) for x in ('congela', 'ao_contrario')):      # o clipe estica pra caber na fala, até 4x mais lento
        s['vel'] = round(min(1.0, max(0.25, (dc - s.get('ini', 0) - 0.05) / max(0.1, s['dur']))), 3)
    segs.append(s)

# 3) tempo de cada palavra no vídeo final: narração pelo alinhamento; falas espalhadas por igual na duração da fala
palavras = [[round(tv(i), 3), w['w']] for i, w in enumerate(W)]
for q in E.get('quebras', []):
    txt = re.sub(r'\[[^\]]*\]', '', q.get('texto', '')).split()
    if txt:
        t0, d = ini_fala[q['id']]; palavras += [[round(t0 + d * (j + 0.5) / len(txt), 3), x] for j, x in enumerate(txt)]
palavras.sort()
E.update(fonte='voz real', total=round(fim, 3), segmentos=segs, voz='voz/voz.wav', palavras=palavras)
json.dump(E, open(os.path.join(EP, 'linha_voz.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print('voz', round(T, 2), 's; vídeo', round(fim, 2), 's;', len(segs), 'segmentos ->', os.path.join(EP, 'linha_voz.json'))
