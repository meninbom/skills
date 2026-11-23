"""Etapa de montagem (17/10): encaixa os 15 clipes H3 tratados nas cenas, com o trecho e o ritmo escolhidos olhando
as folhas de cada clipe (h3/folhas + public/clips). Idempotente: reescreve so os campos abaixo em src/data/cenas.json.

fonte.de    = segundo do clipe no inicio da cena; fonte.ritmo = velocidade (clipe = de + (t - t0) * ritmo)
fonte.seq   = plano do heroi lido de public/seq/<id> (fundo jpg + heroi png com alfa, tools/heroi_seq.py)
fonte.rev   = le a sequencia de tras para frente (cena 31 = Z01a invertido, termina no quadro 0 = loop)
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(HERE, '..', 'src', 'data', 'cenas.json')
d = json.load(open(P, encoding='utf-8'))
C = {c['n']: c for c in d['cenas']}

TRECHOS = {
    # n: (clip, de, ritmo, seq, rev)   motivo
    1: ('Z01a', 0.0, 1.6, 'Z01a', False),     # olhos/cabeca saem da janela e chegam na lente no fim do 'numa'; comeca no quadro 0 (loop com a 31)
    2: ('Z02', 0.3, 1.0, None, False),        # a cabeca vira para a lente
    3: ('Z03', 0.0, 1.0, None, False),        # maos sobre a capa real (a capa ja veio na placa); termina antes do logo inventado (q36)
    5: ('Z04', 0.0, 1.0, None, False),        # pincelada viva enquanto ROBOTI se pinta
    7: ('Z05', 0.0, 1.0, None, False),        # estabilizado (0,3 px): o Patent fica pregado
    8: ('Z06', 0.0, 1.0, None, False),        # servo em close nos 1,2 s bons
    10: ('Z07a', 0.0, 1.0, None, False),      # campones puxando a carga atras da geada
    13: ('Z08', 1.0, 1.6, None, False),       # dedos fecham ate o punho em 'carne' e comecam a abrir
    14: ('Z09', 0.3, 1.0, None, False),       # marcha em passo, antes do 1o operario tampar a camera (2,2 s)
    15: ('Z01c', 2.13, 1.7, 'Z01c', False),   # olhar no alto (foto) e volta a lente em 'gente' (21,56)
    16: ('Z10', 0.0, 1.0, None, False),       # casal entra no teatro
    17: ('Z11s', 0.0, 0.92, None, False),     # neve fina em camera lenta (q0-14 do Z11 r2 interpolados: sem os flocos-icone)
    19: ('Z12', 0.0, 1.0, None, False),       # padeiro puxa a touca rindo (antes da nuvem de po virar fumaca)
    26: ('Z14', 0.0, 1.0, None, False),       # robo de lata anda ate a camera
    28: ('Z01b', 0.84, 1.4, 'Z01b', False),   # olhos descem da lente para as maos em 'robo' (38,38)
    31: ('Z01a', 2.365, 1.15, 'Z01a', True),  # invertido: a cabeca volta para a janela e o ultimo quadro = quadro 0 do Z01a
}
for n, (clip, de, ritmo, seq, rev) in TRECHOS.items():
    f = C[n]['fonte']
    f['clip'] = clip if not rev else 'Z01a_rev'
    f['de'] = de
    f['ritmo'] = ritmo
    if seq:
        f['seq'] = seq
    else:
        f.pop('seq', None)
    if rev:
        f['rev'] = True
    else:
        f.pop('rev', None)

# cena 3: a capa da placa ja e o scan real (o H3 so moveu ~14 px no 1o s): sem recomposicao por cima
C[3]['especial'] = [e for e in C[3].get('especial', []) if e != 'capa']
# cena 15: sombra da cabeca na foto pregada (luz da janela da esquerda)
C[15]['sombra_heroi'] = {'dx': 34, 'dy': 12, 'blur': 9, 'opacidade': 0.38}
# cena 17: fundo em camera lenta (Z11s)
C[17]['fonte']['still'] = 'Z11'
# cena 26: punch no peito/engrenagem do robo andando (medido no q27-34 do Z14: engrenagem em ~600, 975)
for k in C[26]['cam']:
    if k.get('z', 1) >= 1.5:
        k['x'], k['y'] = 600, 950

FEITO = {
    1: ['remapear', 'matte por quadro'], 15: ['foto pregada', 'olhar sobe'], 28: ['olhos descem'], 31: ['Z01a ao contrario'],
    3: ['capa nitida'], 7: ['conferir deriva'], 26: ['no punch do peito'],
}
for n, chaves in FEITO.items():
    C[n]['todo'] = [t for t in C[n].get('todo', []) if not any(t.startswith(k) for k in chaves)]
    if not C[n]['todo']:
        C[n].pop('todo')

json.dump(d, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('cenas.json: trechos de', len(TRECHOS), 'cenas atualizados')

# ---------------------------------------------------------------- legibilidade (conferida na previa v1, quadro a quadro)
def texto(n, ini):
    return next(x for x in C[n]['textos'] if x['txt'].startswith(ini))

# cena 4: credito saia de cima das maos desfocadas -> logo abaixo da foto (borda de baixo ~1352)
texto(4, 'escritor')['y'] = 1408
texto(4, 'foto dos')['y'] = 1456
# cena 6: a legenda da foto de 1927 caia no escuro das pernas do pintor em preto-la -> giz
texto(6, 'Karel e Josef')['cor'] = 'giz'
texto(6, 'Karel e Josef')['y'] = 1500
# cenas 11-12: a foto de Paris tem claro e escuro (o figurino preto cruza a linha do credito) -> credito em tiras de papel
# (o mesmo papel das tiras da cena 23); '0 parafusos' em preto-la sobre a parede clara
for ini, giro, y in (('Paris, 1924', -0.8, 1424), ('foto Henri', 0.6, 1494)):
    texto(11, ini)['cor'] = 'la'
    texto(11, ini)['etiqueta'] = giro
    texto(11, ini)['y'] = y
for ini in ('0', 'parafusos'):
    texto(12, ini)['cor'] = 'la'
# cenas 11-12: a camera em 3,7x passava 22 px da borda de baixo da foto (faixa escura) -> centro 1066
for n in (11, 12):
    for k in C[n]['cam']:
        if k.get('z', 1) >= 3.5:
            k['y'] = 1050
# cena 27: credito do Televox caia sobre as pernas desfocadas do robo e no alto cai na janela clara: o fundo desfocado
# escurece 28% (a foto e o papel continuam na luz) e o credito fica em giz logo abaixo da foto
C[27]['fonte']['luz'] = 0.72
texto(27, 'Televox')['y'] = 1376
texto(27, '7 anos')['y'] = 1426
texto(27, '1928')['cor'] = 'giz'     # no fundo escurecido o preto-la sumia sobre a cabeca desfocada do robo
for ini in ('Televox', '7 anos'):
    texto(27, ini)['cor'] = 'giz'
json.dump(d, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('legibilidade: cenas 4, 6, 11, 12, 27')

# cena 3: '1920' deitado na mesa pega as faixas de luz do proprio clipe (K2 do styleframe)
texto(3, '1920')['tinta'] = 0.17
# cena 12: '0 parafusos' sobre um cartao de papel (o parafuso cai no cartao, dentro do 0): legivel sobre o figurino preto
if 'cartao0' not in C[12]['especial']:
    C[12]['especial'] = ['cartao0'] + C[12]['especial']
json.dump(d, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('tipo tingido: cena 3 | cartao: cena 12')

# cena 25: o cartao do Jaquet-Droz entra POR CIMA do Turco (o Turco fica no fundo)
C[25]['herda_papeis_de'] = 24

# todos ja resolvidos na montagem (o que sobra e polimento opcional, listado em montagem_relatorio.json)
FEITO2 = {3: ["'1920'"], 5: ['ROBOTI'], 7: ['Patent inteiro'], 11: ['cartaz ROBOTS'], 12: ['parafuso real', "cor do '0"],
          20: ['em 28,70'], 23: ['tiras:'], 25: ['o cartao'], 30: ['Briullov (DETALHE']}
for n, chaves in FEITO2.items():
    C[n]['todo'] = [t for t in C[n].get('todo', []) if not any(t.startswith(k) for k in chaves)]
    if not C[n]['todo']:
        C[n].pop('todo')
json.dump(d, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('cena 25 herda o Turco; todos resolvidos limpos')
