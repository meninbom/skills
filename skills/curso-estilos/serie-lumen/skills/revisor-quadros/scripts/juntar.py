"""Junta os parte_*.json da revisão em veredito.json + REVISAO.md.
uso: python juntar.py <pasta da revisão>"""
import sys as _sys_utf8
for _s in (_sys_utf8.stdout, _sys_utf8.stderr):   # acento certo no terminal do Windows, inclusive nas mensagens de erro
    try: _s.reconfigure(encoding='utf-8')
    except Exception: pass
import os, sys, json, glob

if len(sys.argv) < 2:
    raise SystemExit('uso: python juntar.py <pasta da revisão>')
d = sys.argv[1]
todos = {}
for p in sorted(glob.glob(os.path.join(d, 'parte_*.json'))):
    for q in json.load(open(p, encoding='utf-8')):
        todos[int(q['n'])] = q
ent = json.load(open(os.path.join(d, 'entrada.json'), encoding='utf-8'))
for q in ent['quadros']:                                # o veredito leva o nome do quadro (o ciclo casa pelo nome)
    if q['n'] in todos:
        todos[q['n']].setdefault('nome', q['nome']); todos[q['n']].setdefault('arquivo', q['arquivo'])
falta = [q['n'] for q in ent['quadros'] if q['n'] not in todos]
lista = [todos[k] for k in sorted(todos)]
json.dump(dict(quadros=lista, sem_revisao=falta), open(os.path.join(d, 'veredito.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
rep = [q for q in lista if q['veredito'] == 'REPROVADO']
L = [f'# Revisão: {len(lista) - len(rep)} aprovados, {len(rep)} reprovados' + (f', {len(falta)} sem revisão: {falta}' if falta else ''), '']
for q in rep:
    L.append(f"## {q['n']} ({os.path.basename(q.get('arquivo', ''))}): REPROVADO")
    for e in q.get('erros', []):
        L.append(f"- item {e.get('item')}: {e.get('o_que')} ({e.get('onde', '')})")
    if q.get('conserto'):
        L.append(f"- conserto: {q['conserto']}")
    L.append('')
open(os.path.join(d, 'REVISAO.md'), 'w', encoding='utf-8').write('\n'.join(L))
print(L[0]); print('reprovados:', [q['n'] for q in rep])
