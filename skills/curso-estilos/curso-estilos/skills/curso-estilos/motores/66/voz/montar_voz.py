"""Trilha de voz do EP01 "O Apagão": UM take do narrador (2ª pessoa) cortado por frase + o porteiro abafado pelo vidro.
uso (de dentro desta pasta): python montar_voz.py [narr_a] [gancho_b]  ->  dialogo.wav (48 kHz mono, voz -16 LUFS) + timeline.json (blocos = planos, palavras no tempo do vídeo)
Cortes pelo alinhamento por palavra (words.json), no meio do silêncio entre a última palavra de um bloco e a primeira do próximo.
Entradas que VOCÊ gera (não vêm no pacote; a voz é paga e fica por sua conta): narr_a.mp3 e gancho_b.mp3 (o texto está em
narrador.txt e gancho.txt), porteiro_a.mp3 ("PUSH! PUSH!") e, para cada take, <take>.words.json = lista de
{"w": palavra, "start": s, "end": s}. O words.json sai do alinhamento da API da ElevenLabs (with-timestamps) ou de um
Whisper com tempo por palavra. O timeline.json que já está na pasta é o do episódio de exemplo.
"""
import json, subprocess, sys, re
import numpy as np

SR, SPEED = 48000, 1.08            # take inteiro a 1,08x (teto 1,1x)
TAKE = sys.argv[1] if len(sys.argv) > 1 else 'narr_a'
# v5: o P1 (gancho) vem de um take próprio que já apresenta o cachorro ("E pra ajudar... apareceu um cachorro querendo te pegar")
GANCHO = sys.argv[2] if len(sys.argv) > 2 else 'gancho_b'

def load(path, filters=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', path] + (['-af', filters] if filters else []) + ['-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32).copy()

def lufs(x):
    p = subprocess.run(['ffmpeg', '-hide_banner', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', 'ebur128', '-f', 'null', '-'],
                       input=x.astype(np.float32).tobytes(), capture_output=True)
    return float([l for l in p.stderr.decode().splitlines() if l.strip().startswith('I:')][-1].split()[1])

def gain_to(x, target): return x * (10 ** ((target - lufs(x)) / 20))

def fade(x, ms=12):
    n = int(SR * ms / 1000); x = x.copy()
    if len(x) > 2 * n: x[:n] *= np.linspace(0, 1, n); x[-n:] *= np.linspace(1, 0, n)
    return x

# blocos = planos; cada um começa na 1ª ocorrência da palavra depois do bloco anterior
INICIO = [('P1', 'Faltam'), ('P2', 'Hoje'), ('P3', 'Ninguém'), ('P4', 'Aí'), ('P5', 'Você'), ('P6', 'A'), ('P7', 'Você'),
          ('P8', 'Falta'), ('P9', 'Push'), ('P10', 'O'), ('P11', 'Ele'), ('P12', 'Sem'), ('P13', 'O'), ('P14', 'Seta')]
norm = lambda w: re.sub(r'[^\wÀ-ú]', '', w)
words = [w for w in json.load(open(f'{TAKE}.words.json', encoding='utf-8')) if not w['w'].startswith('[')]
idx = []
for _, chave in INICIO:
    alvo, n = (chave.split('#') + ['1'])[:2]; n = int(n); c = 0
    for i, w in enumerate(words):
        if norm(w['w']) == alvo and (not idx or i > idx[-1]):
            c += 1
            if c == n: idx.append(i); break
    else:
        raise SystemExit(f'não achei {chave}')
cortes = [0.0]
for i in idx[1:]:
    cortes.append((words[i - 1]['end'] + words[i]['start']) / 2)
# o "S" do "Sem" começa ~0,1 s antes do que o alinhamento diz: o corte no meio do silêncio deixava o S no fim do P11
# (o STT ouvia "Tem maçaneta"). Corte antes do S, medido pela energia de 3,5-9 kHz no take (35,65 s).
AJUSTE = {'P12': -0.13}
for k, (rot, _) in enumerate(INICIO):
    if k and rot in AJUSTE: cortes[k] += AJUSTE[rot]
take = gain_to(load(f'{TAKE}.mp3', f'atempo={SPEED}'), -16.0)
fim_take = words[-1]['end'] + 0.25
cortes.append(fim_take)
POR_FX = 'highpass=f=260,lowpass=f=2400,aecho=0.8:0.5:40|75:0.25|0.12'     # porteiro gritando atrás do vidro
porteiro = gain_to(load('porteiro_a.mp3', POR_FX), -18.5)
P1_LUFS = lufs(take[int(cortes[0] / SPEED * SR):int(cortes[1] / SPEED * SR)])

# (rótulo, item, folga antes); item = índice do bloco, 'POR' ou ('sil', s)
PLAN = [(0, 0), (1, 0.15), (2, 0), (3, 0), (4, 0), (5, 0), (6, 0), (7, 0.1), (8, 0.15), (9, 0), ('POR', 0.05), (10, 0.1),
        (('sil', 0.75), 0), (11, 0), (12, 0), (('sil', 0.3), 0), (13, 0), (('sil', 0.8), 0)]
out, t, tl = [], 0.0, {'speed': SPEED, 'take': TAKE, 'blocos': [], 'palavras': []}
for item, gap in PLAN:
    if gap: out.append(np.zeros(int(gap * SR), np.float32)); t += gap
    if isinstance(item, tuple):
        x = np.zeros(int(item[1] * SR), np.float32); rot = 'sil'
    elif item == 'POR':
        x = porteiro; rot = 'POR'
    elif item == 0 and GANCHO:
        rot = 'P1'
        gw = [w for w in json.load(open(f'{GANCHO}.words.json', encoding='utf-8')) if not w['w'].startswith('[')]
        g = load(f'{GANCHO}.mp3', f'atempo={SPEED}')
        nz = np.where(np.abs(g) > 0.01)[0]; g = g[:min(len(g), nz[-1] + int(0.18 * SR))]
        x = fade(g * (10 ** ((P1_LUFS - lufs(g)) / 20)))          # mesmo volume do P1 do take antigo
        for w in gw:
            tl['palavras'].append({'w': w['w'], 'start': round(t + w['start'] / SPEED, 3), 'end': round(t + w['end'] / SPEED, 3), 'bloco': rot})
    else:
        a, b = cortes[item], cortes[item + 1]; rot = INICIO[item][0]
        x = fade(take[int(a / SPEED * SR):int(b / SPEED * SR)])
        for w in words:
            if a <= w['start'] < b:
                tl['palavras'].append({'w': w['w'], 'start': round(t + (w['start'] - a) / SPEED, 3), 'end': round(t + (w['end'] - a) / SPEED, 3), 'bloco': rot})
    tl['blocos'].append({'rotulo': rot, 'start': round(t, 3), 'end': round(t + len(x) / SR, 3)})
    out.append(x); t += len(x) / SR
audio = np.concatenate(out)
tl['duracao'] = round(len(audio) / SR, 3)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'pcm_s16le', 'dialogo.wav'],
               input=audio.astype(np.float32).tobytes(), check=True)
json.dump(tl, open('timeline.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', tl['duracao'], 's')
for b in tl['blocos']:
    print(f"{b['rotulo']:>4} {b['start']:6.2f}-{b['end']:6.2f} ({b['end'] - b['start']:.2f})")
