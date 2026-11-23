"""Montagem v3 do robot (17/10, depois de 2 criticos as cegas na v2). Reescreve src/data/cenas.json do zero.

O que muda (correcoes_v3.txt tem o porque de cada item):
  - 47 trocas de plano -> 23 planos; punch-in de vai-e-volta, corte de camera e grade 4x4 sairam; movimento = push lento continuo
  - credito em UMA linha, Fixture SemiBold 44, sempre preso ao objeto (impresso na margem da copia, ou na aresta de cima)
  - foto pregada sobre desfoque: so 2 vezes e sem corte (desfoque de foco DENTRO do plano: Josef no atelie, Televox no
    robo de lata). Karel cai NA MESA (mesma luz), TG pregada atras da cabeca, Klicperovo/Narodni/Jaquet-Droz em tela cheia,
    Patent/OSOBY/Briullov no mundo por homografia
  - texto essencial >= 44 px e na tela >= 1,2 s (tools/checar_v3.py confere)
  - defeitos: sobrancelha/pontinhos (tools/heroi_limpo.py), 'Oparafusos' -> 'ZERO parafusos' na parede + parafuso na mesa,
    LEDEN entra junto com 25., tiras da avalanche dentro do livro, sem 'Genserico'/'ROMA 455' no fecho, sem mosaico
uso: python tools/montagem_v3.py
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(HERE, '..', 'src', 'data', 'cenas.json')
W = json.load(open(os.path.join(HERE, '..', 'src', 'data', 'words.json'), encoding='utf-8'))


def fala(t0, t1):
    return ' '.join(w['w'] for w in W if t0 - 0.02 <= w['start'] < t1 - 0.02)


def T(t, txt, x, y, s, f='info', cor='la', **k):
    d = {'t': t, 'txt': txt, 'x': x, 'y': y, 's': s, 'f': f, 'cor': cor}
    d.update(k)
    return d


def CRED(t, txt, x, y, cor='la', **k):
    return T(t, txt, x, y, 44, 'info', cor, cred=True, **k)


def cam(*ks):
    out = []
    for k in ks:
        d = {'t': k[0], 'z': k[1]}
        if len(k) > 2: d['x'] = k[2]
        if len(k) > 3: d['y'] = k[3]
        out.append(d)
    return out


ROBO = dict(f='heroi', cor='giz', ancora='middle', track=-4, atras=True)

cenas = [
    # ---------------------------------------------------------------- ATO 1
    dict(n=1, t0=0.0, t1=1.90, motor='h3', fonte={'clip': 'Z01a', 'still': 'Z01a', 'de': 0.0, 'ritmo': 1.15, 'seq': 'Z01a'}, matte='Z01a',
         cam=cam((0.0, 1.0), (1.90, 1.035)),
         textos=[T(0.05, 'ROBÔ', 536, 652, 262, entra='escala', **ROBO)],
         nota='heroi sai da janela e chega na lente no fim do plano (1,9 s de respiro no gancho)'),
    dict(n=2, t0=1.90, t1=4.90, motor='h3', fonte={'clip': 'Z03', 'still': 'Z03', 'de': 0.0, 'ritmo': 1.0},
         capa_real={'por_quadro': 'public/capa_real (tools/capa_real.py)'},
         cam=cam((1.90, 1.0, 540, 960), (4.90, 1.05, 560, 980)),
         textos=[T(2.00, '1920', 538, 462, 236, 'heroi', 'la', ancora='middle', tinta=0.17, ate=3.34, esvai=0.1),
                 CRED(2.02, '1ª edição · Aventinum, Praga', 262, 540, ate=3.34, esvai=0.1),
                 T(3.36, 'KAREL', 540, 396, 120, 'heroi', 'la', ancora='middle', tinta=0.17),
                 T(3.36, 'ČAPEK', 540, 534, 130, 'heroi', 'la', ancora='middle', tinta=0.17)],
         papeis=[dict(t=3.30, doc='karel30', cx=690, cy=1080, w=500, rot=5.0, entra='cai', borda=16,
                      legenda='Karel Čapek · anos 1930', luz='z03')],
         nota='mesa do escritor sem corte: capa real (scan) por cima da capa redesenhada pelo H3; a foto do Karel CAI na mesa, na mesma luz'),
    dict(n=3, t0=4.90, t1=8.65, motor='h3', fonte={'clip': 'Z04', 'still': 'Z04', 'de': 0.0, 'ritmo': 1.0},
         especial=['laborir', 'roboti'], rack={'t': 7.15, 'dur': 0.4, 'blur': 11, 'luz': 0.86},
         cam=cam((4.90, 1.0), (7.15, 1.03), (8.65, 1.04)),
         textos=[T(5.05, 'LABOŘI', 236, 396, 110, 'heroi', 'la', entra='corte', ate=7.45, esvai=0.3),
                 T(5.47, '1ª ideia de Karel', 238, 458, 56, ate=7.45, esvai=0.3),
                 T(7.40, 'JOSEF', 540, 420, 150, 'heroi', 'la', ancora='middle')],
         papeis=[dict(t=7.30, doc='josef1937', cx=540, cy=1010, w=560, rot=2.5, entra='prega', borda=14, tachas=True,
                      legenda='Josef Čapek · 1937')],
         nota='atelie sem corte: ROBOTI pintado continua na tela durante o desfoque; a foto real do Josef e pregada na frente'),
    # ---------------------------------------------------------------- ATO 2
    dict(n=4, t0=8.65, t1=11.28, motor='h3', fonte={'clip': 'Z05', 'still': 'Z05', 'de': 0.0, 'ritmo': 1.0}, especial=['patent'],
         cam=cam((8.65, 1.0, 540, 960), (11.28, 1.10, 525, 920)),
         textos=[CRED(9.20, 'decreto da robota · Boêmia, 1738', 126, 392, 'giz')],
         nota='push continuo (sem o punch de vai-e-volta)'),
    dict(n=5, t0=11.28, t1=13.40, motor='h3', fonte={'clip': 'Z06', 'still': 'Z06', 'de': 0.0, 'ritmo': 1.0},
         cam=cam((11.28, 1.32, 560, 1150), (12.30, 1.32, 555, 1120), (13.30, 1.30, 540, 760), (13.40, 1.30, 540, 752)),
         nota='servos (8+9 juntos, como o tratamento previa): tilt sobe para o casarao no "senhor"'),
    dict(n=6, t0=13.40, t1=15.90, motor='h3', fonte={'clip': 'Z07a', 'still': 'Z07a', 'de': 0.0, 'ritmo': 1.0},
         cam=cam((13.40, 1.0), (15.90, 1.05)),
         textos=[T(13.70, 'RAB', 544, 600, 320, 'heroi', 'la', ancora='middle', track=-4, entra='limpa'),
                 T(13.95, 'rabŭ = escravo', 544, 690, 56, ancora='middle'),
                 T(14.40, 'RABOTA', 556, 1262, 100, 'heroi', 'la', ancora='middle', track=-2),
                 T(14.52, 'ROBOTA', 556, 1356, 86, 'heroi', 'la', ancora='middle', track=-2),
                 T(14.64, 'ROBOT', 556, 1440, 74, 'heroi', 'la', ancora='middle', track=-1)],
         nota='a cadeia termina em ROBOT enquanto a voz diz "os robos"'),
    dict(n=7, t0=15.90, t1=19.42, motor='h3', fonte={'clip': 'Z08', 'still': 'Z08', 'de': 0.0, 'ritmo': 0.92},
         especial=['parafuso'], parafuso={'t': 16.86, 'x': 840, 'y': 1290, 'w': 290},
         cam=cam((15.90, 1.0, 540, 960), (19.42, 1.06, 520, 1000)),
         textos=[T(16.86, 'ZERO', 72, 700, 140, 'heroi', 'giz', entra='corte'),
                 T(16.86, 'parafusos', 76, 786, 64, 'info', 'giz')],
         nota='braco de carne: o parafuso real cai na mesa ao lado da mao (sem tarja de papel); dedos fecham no "carne"'),
    dict(n=8, t0=19.42, t1=20.52, motor='h3', fonte={'clip': 'Z09', 'still': 'Z09', 'de': 0.3, 'ritmo': 1.0},
         cam=cam((19.42, 1.0), (20.52, 1.08)),
         nota='fila em serie com push 1,00-1,08 (sem o mosaico 4x4)'),
    dict(n=9, t0=20.52, t1=22.03, motor='h3', fonte={'clip': 'Z01c', 'still': 'Z01c', 'de': 2.13, 'ritmo': 1.7, 'seq': 'Z01c'}, matte='Z01c',
         sombra_heroi={'dx': 34, 'dy': 12, 'blur': 9, 'opacidade': 0.38},
         cam=cam((20.52, 1.0), (22.03, 1.03)),
         textos=[T(20.60, 'ache os robôs.', 126, 352, 68, 'info', 'giz'),
                 CRED(20.75, 'Nova York, 1922 · foto F. Bruguière', 126, 412, 'giz')],
         papeis=[dict(t=20.52, doc='tg1', cx=502, cy=676, w=737, rot=-0.7, entra='baixa', de='cima', borda=12, tachas=True, atras=True)]),
    # ---------------------------------------------------------------- ATO 3
    dict(n=10, t0=22.03, t1=22.84, motor='h3', fonte={'clip': 'Z10', 'still': 'Z10', 'de': 0.0, 'ritmo': 1.0},
         cam=cam((22.03, 1.0), (22.84, 1.04))),
    dict(n=11, t0=22.84, t1=24.96, motor='h3', fonte={'clip': 'Z11s', 'still': 'Z11', 'de': 0.0, 'ritmo': 0.92},
         cam=cam((22.84, 1.0), (24.96, 1.03)),
         textos=[T(22.90, '2.', 72, 580, 300, 'heroi', 'giz', entra='corte'),
                 T(23.50, 'LEDEN', 72, 790, 170, 'heroi', 'giz', entra='corte'),
                 T(23.76, '1921', 72, 1030, 210, 'heroi', 'giz', entra='corte')]),
    dict(n=12, t0=24.96, t1=26.45, motor='doc',
         fonte={'pano': {'doc': 'klicpera_hoje', 'escurece_topo': 760,
                         'chaves': [{'t': 24.96, 'x': -1080, 'y': 0, 'w': 2560}, {'t': 26.45, 'x': -760, 'y': 0, 'w': 2560}]}},
         cam=cam((24.96, 1.0), (26.45, 1.0)),
         textos=[T(25.10, 'HRADEC', 540, 400, 120, 'heroi', 'giz', ancora='middle'),
                 T(25.10, 'KRÁLOVÉ', 540, 548, 120, 'heroi', 'giz', ancora='middle'),
                 CRED(25.25, 'Klicperovo divadlo · foto atual', 540, 626, 'giz', ancora='middle')],
         nota='foto real em tela cheia, 1,0x do nativo, pan lento pela fachada (sem moldura, sem fundo desfocado)'),
    dict(n=13, t0=26.45, t1=27.70, motor='h3', fonte={'clip': 'Z12', 'still': 'Z12', 'de': 0.35, 'ritmo': 1.0},
         cam=cam((26.45, 1.70, 480, 1360), (27.70, 1.74, 480, 1360)),
         textos=[T(26.48, 'ochotníci = amadores', 72, 1430, 56, 'info', 'giz', tela=True, queima=0.6)],
         nota='enquadrado no padeiro puxando a touca: a nuvem de po do H3 (que parecia fumaca) fica fora do quadro'),
    dict(n=14, t0=27.70, t1=28.95, motor='doc',
         fonte={'pano': {'doc': 'narodni_zitek',
                         'chaves': [{'t': 27.70, 'x': -560, 'y': -20, 'w': 1836}, {'t': 28.95, 'x': -330, 'y': -40, 'w': 1872}]}},
         cam=cam((27.70, 1.0), (28.95, 1.0)),
         textos=[T(27.75, 'PRAGA', 540, 1450, 190, 'heroi', 'la', ancora='middle'),
                 CRED(27.72, 'Národní divadlo · desenho de J. Zítek', 72, 330, 'la')],
         nota='desenho real da fachada em tela cheia, pan pelo papel (critico 2), sem cair'),
    dict(n=15, t0=28.95, t1=29.72, motor='codigo', fonte={'still': 'Z13'},
         cam=cam((28.95, 1.0, 540, 960), (29.72, 1.05, 540, 900)),
         nota='teatro vazio com a lampada de servico (respiro antes da data)'),
    dict(n=16, t0=29.72, t1=30.93, motor='codigo', fonte={'still': 'Z07b'}, especial=['geada'],
         cam=cam((29.72, 1.0), (30.93, 1.04)),
         textos=[T(29.72, '25.', 540, 760, 300, 'heroi', 'la', ancora='middle', entra='corte'),
                 T(29.72, 'LEDEN', 540, 960, 170, 'heroi', 'la', ancora='middle', entra='corte'),
                 T(29.72, '+23 dias', 540, 1062, 64, 'info', 'la', ancora='middle')],
         nota='a data ja esta no vidro no 1o quadro (sem a oval vazia); LEDEN 1,2 s'),
    # ---------------------------------------------------------------- ATO 3b (palavras antigas)
    dict(n=17, t0=30.93, t1=32.76, motor='codigo', fonte={'clip': 'Z03', 'still': 'Z03', 'de': 3.30, 'ritmo': 1.0},
         capa_real={'por_quadro': 'public/capa_real (tools/capa_real.py)'}, especial=['avalanche'], avalanche={'t': 30.95, 'livro': 31.44},
         cam=cam((30.93, 1.0, 540, 1000), (32.76, 1.04, 540, 1000)),
         nota='as tiras caem DENTRO da pegada do livro na mesa; o livro cai por cima e nenhuma tira sobra'),
    dict(n=18, t0=32.76, t1=34.44, motor='doc',
         fonte={'pano': {'doc': 'jaquet1', 'chaves': [{'t': 32.76, 'x': -27, 'y': 652, 'w': 1134}, {'t': 34.44, 'x': -45, 'y': 626, 'w': 1170}]}},
         cam=cam((32.76, 1.0), (34.44, 1.0)),
         textos=[T(32.80, 'AUTÔMATO', 540, 396, 110, 'heroi', 'giz', ancora='middle'),
                 T(33.24, 'ANDROIDE', 540, 532, 110, 'heroi', 'giz', ancora='middle'),
                 CRED(33.00, 'o Escritor, Jaquet-Droz · séc. XVIII', 540, 600, 'giz', ancora='middle')],
         nota='24+25 juntos (como o tratamento previa): um so documento em tela cheia, sem moldura'),
    dict(n=19, t0=34.44, t1=37.55, motor='h3', fonte={'clip': 'Z14', 'still': 'Z14', 'de': 0.0, 'ritmo': 1.0},
         rack={'t': 36.30, 'dur': 0.35, 'blur': 12, 'luz': 0.72},
         cam=cam((34.44, 1.0, 540, 960), (36.30, 1.12, 570, 930), (37.55, 1.13, 570, 930)),
         textos=[T(36.33, '1928', 540, 600, 240, 'heroi', 'giz', ancora='middle', tela=True)],
         papeis=[dict(t=36.30, doc='televox1928', cx=540, cy=1010, w=661, rot=-1.5, entra='cai', borda=14, tela=True,
                      legenda='Televox, Westinghouse · 1928')],
         nota='robo de lata com push continuo (sem punch de vai-e-volta); a foto de 1928 entra no desfoque de foco, sem corte'),
    # ---------------------------------------------------------------- ATO 4
    dict(n=20, t0=37.55, t1=38.84, motor='h3', fonte={'clip': 'Z01b', 'still': 'Z01b', 'de': 0.84, 'ritmo': 1.4, 'seq': 'Z01b'}, matte='Z01b',
         cam=cam((37.55, 1.0), (38.84, 1.03)),
         textos=[T(37.60, 'ROBÔ', 536, 652, 262, entra='escala', **ROBO)]),
    dict(n=21, t0=38.84, t1=40.30, motor='codigo', fonte={'still': 'Z16'}, especial=['osoby'], livre=True,
         cam=cam((38.84, 1.0, 540, 960), (39.32, 2.3, 368, 1112), (40.30, 2.4, 363, 1115)),
         textos=[T(39.10, 'sluha = criado', 160, 1238, 80, 'info', 'la', tela=True),
                 CRED(39.10, 'elenco da 1ª edição, Praga, 1920', 162, 1306, 'la', tela=True)]),
    dict(n=22, t0=40.30, t1=43.00, motor='codigo', fonte={'still': 'Z17'}, especial=['briullov'],
         cam=cam((40.30, 1.0, 540, 960), (43.00, 1.3, 590, 1000)),
         textos=[CRED(40.45, 'Karl Briullov · pintura de 1836', 126, 474, 'la', tela=True, ate=42.6, esvai=0.3)],
         nota='sem "Genserico" e sem "ROMA 455": o fecho guarda o assunto; push continuo, sem o corte de camera'),
    dict(n=23, t0=43.00, t1=45.40, motor='h3', fonte={'clip': 'Z01a_rev', 'still': 'Z01a', 'de': 2.365, 'ritmo': 1.15, 'seq': 'Z01a', 'rev': True},
         matte='Z01a_rev', cam=cam((43.00, 1.02), (45.40, 1.0)),
         textos=[T(43.0, 'ROBÔ', 536, 652, 262, ate=44.6, esvai=0.25, **ROBO)],
         nota='o mesmo clipe ao contrario: o ultimo quadro e o quadro 0 do plano 1 (loop)'),
]
for c in cenas:
    c['fala'] = fala(c['t0'], c['t1'])
    c.setdefault('textos', [])

d = {'_leia': 'v3 (tools/montagem_v3.py): 23 planos. Tempos pela voz robot_tight (FIXA). Coordenadas no quadro 1080x1920; textos com y = '
              'LINHA DE BASE. cam: chaves {t, z, x, y}. rack = desfoque de foco dentro do plano. fonte.pano = documento real em tela cheia. '
              'Credito = 1 linha, 44 px (cred) ou impresso na margem da copia (legenda).',
     'flashes': [8.65, 22.03, 37.55], 'cenas': cenas}
json.dump(d, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', len(cenas), 'planos ->', P)
