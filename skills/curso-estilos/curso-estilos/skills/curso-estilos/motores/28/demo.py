"""Demo do ciclo: fila de 3 planos falsos (feitos por código); 1 é congelado de propósito, a conferência reprova SÓ ele,
ele volta para a fila com vivo=1, é refeito sozinho e a rodada seguinte dá 0 reprovados.
uso: python demo.py      -> saida/demo.mp4 (540×960, 30 qps, 3,6 s, mudo) + saida/ciclo/DEVOLUCOES.md, estado.json, checagem_r1, checagem_r2
Só CPU. Precisa de numpy e FFmpeg no PATH.
"""
import os, sys, shutil, json
AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, AQUI)
from ciclo import Ciclo

SAIDA = os.path.join(AQUI, 'saida'); D = os.path.join(SAIDA, 'ciclo')
if os.path.isdir(D): shutil.rmtree(D)          # cada demo começa do zero (só a pasta do próprio demo)
c = Ciclo(os.path.join(AQUI, 'exemplo'), 'demo', trabalhos=3, saida=D)
msg = c.rodar(injetar=True)
shutil.copy(os.path.join(D, 'demo.mp4'), os.path.join(SAIDA, 'demo.mp4'))
print('\n' + open(os.path.join(D, 'DEVOLUCOES.md'), encoding='utf-8').read())
r1 = json.load(open(os.path.join(D, 'checagem_r1', 'veredito.json'), encoding='utf-8'))
rep1 = [p['i'] for p in r1['planos'] if p['veredito'] == 'REPROVADO']
print(f'resultado: {msg} · reprovados na rodada 1: {rep1} · segmentos refeitos: {c.refeitos} · tentativas: {c.tent}')
print('vídeo:', os.path.relpath(os.path.join(SAIDA, 'demo.mp4'), AQUI))
ok = msg == 'PRONTO' and rep1 == [1] and c.refeitos == [(1, [1])]
sys.exit(0 if ok else 1)
