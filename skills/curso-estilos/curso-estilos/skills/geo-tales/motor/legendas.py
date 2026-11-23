"""Legendas a partir dos tempos reais da voz (ElevenLabs .words.json = [{w,start,end}]).
uso: python legendas.py voz/narr.words.json voz/caps.json ["cento e onze=111" "mil e cem=1.100" ...]
Grupos de até 3 palavras, quebra na pontuação; número por extenso (do TTS) volta a algarismo na tela."""
import sys, json, re
w = json.load(open(sys.argv[1], encoding='utf8')); NUM = [a.split('=') for a in sys.argv[3:]]
toks = [[x['w'], x['start'], x['end']] for x in w]; i = 0; out = []
while i < len(toks):
    for frase, num in NUM:
        p = frase.split(); n = len(p)
        if [re.sub(r'[.,?!:]$', '', t[0]).lower() for t in toks[i:i + n]] == [q.lower() for q in p]:
            pont = re.search(r'[.,?!:]$', toks[i + n - 1][0]); out.append([num + (pont.group(0) if pont else ''), toks[i][1], toks[i + n - 1][2]]); i += n; break
    else: out.append(toks[i]); i += 1
grupos = []; at = []
for t in out:
    at.append(t)
    if len(at) == 3 or re.search(r'[.,?!:]$', t[0]): grupos.append(at); at = []
if at: grupos.append(at)
caps = []
for k, g in enumerate(grupos):
    a = g[0][1]; fim = g[-1][2]; prox = grupos[k + 1][0][1] if k + 1 < len(grupos) else fim + .5
    s = ' '.join(x[0] for x in g); s = s if s.endswith('...') else re.sub(r'[.,:]$', '', s)
    caps.append([round(a, 2), round(prox if prox - fim < .6 else fim + .35, 2), s])
json.dump(caps, open(sys.argv[2], 'w', encoding='utf8'), ensure_ascii=False); print(len(caps), 'legendas')
