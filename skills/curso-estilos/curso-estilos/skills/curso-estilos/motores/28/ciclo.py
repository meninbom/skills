"""Ciclo de conferência: monta por segmento, mede cada plano e refaz SÓ o plano reprovado.
Você aprova o TEXTO e o FINAL. No meio, o programa monta, checa por plano e devolve só o que falhou, com a prova escrita.

GRAFO (o que não depende de nada roda junto; o que usa GPU, uma tarefa por vez):
  pré-requisitos (imagens, voz: arquivos que têm de existir) ─► seg:<i> (render por segmento, em paralelo) ─► concat ─► mix ─► checar por plano
LAÇO: plano reprovado volta com registro (PLANO / VEREDITO / MOTIVO / PROVA / ESCOPO) e só ele é refeito.
  parado        -> vivo += 1      (aproximação lenta no segmento)        -> re-render só do segmento
  texto_zona_ui -> ui_dy -= 200   (sobe cartões/legenda do segmento)     -> re-render só do segmento
  texto_borda   -> ui_dy -= 200
  fala (<95%)   -> abafa_db -= 6  (baixa trilha/SFX sob a voz no trecho) -> re-mix
  volume        -> ganho_db ±3                                           -> re-mix
  No máximo 3 tentativas por plano; na falha seguinte o plano é marcado PROBLEMA NO PLANO/ROTEIRO e o ciclo para de insistir nele.

CONTRATO do projeto (uma pasta):
  linha.json   {"segmentos": [{"plano": "P1", "t": 0.0, "dur": 1.2, ...}], "palavras": [[t, "palavra"], ...] (opcional),
                "precisa": ["voz/voz.wav", ...] (opcional: arquivos que têm de existir antes de montar),
                "checagem": {"max_parado": 1.5, "janela_parado": 1.0, "limiar_parado": 1.0, "limiar_fala": 0.95} (opcional)}
  montar.py    aceita: LINHA BASE --segs i,j --pasta DIR   e grava DIR/seg_000.mp4 ... só dos segmentos pedidos,
               lendo de cada segmento os ajustes do laço: vivo (int) e ui_dy (px).
  mixar.py     (opcional) aceita: LINHA BASE   lê BASE_mudo.mp4, grava BASE.mp4 e respeita abafa_db e ganho_db por segmento.
               Sem mixar.py o vídeo final é o mudo.

uso:
  python ciclo.py --projeto exemplo --nome teste            (roda o ciclo)
  python ciclo.py --projeto exemplo --nome teste --injetar  (TESTE: estraga um plano de propósito para provar que acha e refaz só ele)
Saída em <projeto>/_ciclo_<nome>/ (ou --saida): linha_ciclo.json (com os ajustes), segs/, <nome>.mp4, DEVOLUCOES.md, estado.json, checagem_rN/.
Nada pago roda aqui dentro; nada é apagado (segmento refeito vai para segs/_antigo/).
"""
import os, sys, json, time, shutil, argparse, subprocess, threading
from concurrent.futures import ThreadPoolExecutor

AQUI = os.path.dirname(os.path.abspath(__file__))
MAX_TENT = 3


class Ciclo:
    def __init__(s, projeto, nome, trabalhos=3, exige_revisao=False, saida=None):
        s.P = os.path.abspath(projeto); s.trab = trabalhos; s.exige_revisao = exige_revisao
        s.montar = os.path.join(s.P, 'montar.py'); s.mixar = os.path.join(s.P, 'mixar.py')
        if not os.path.exists(s.montar): raise SystemExit(f'falta {s.montar} (ver o contrato no topo do ciclo.py)')
        s.D = os.path.abspath(saida) if saida else os.path.join(s.P, f'_ciclo_{nome}'); os.makedirs(os.path.join(s.D, 'segs'), exist_ok=True)
        s.base = os.path.join(s.D, nome); s.linha = os.path.join(s.D, 'linha_ciclo.json')
        s.log_dev = os.path.join(s.D, 'DEVOLUCOES.md'); s.estado = {}; s.trava = threading.Lock()
        s.tent = {}            # tentativas por segmento
        s.problema = {}        # segmento -> motivo (passou do máximo)
        s.refeitos = []        # (rodada, [segmentos]) para o resumo

    # ---------- utilidades
    def marca(s, no, st, extra=''):
        with s.trava:
            s.estado[no] = dict(estado=st, extra=extra, hora=time.strftime('%H:%M:%S'))
            json.dump(s.estado, open(os.path.join(s.D, 'estado.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
        print(f'[{time.strftime("%H:%M:%S")}] {no}: {st} {extra}', flush=True)

    def L(s):   # cópia de trabalho do ciclo; antes de existir, a linha original do projeto
        arq = s.linha if os.path.exists(s.linha) else os.path.join(s.P, 'linha.json')
        return json.load(open(arq, encoding='utf-8'))
    def salva(s, L): json.dump(L, open(s.linha, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)

    def roda(s, cmd, cwd=None):
        r = subprocess.run(cmd, cwd=cwd or s.P, capture_output=True, text=True, encoding='utf-8', errors='replace')
        if r.returncode != 0: raise RuntimeError(f'{os.path.basename(cmd[1]) if len(cmd) > 1 else cmd[0]}: {r.stderr[-600:]}')
        return r.stdout

    # ---------- nós do grafo
    def no_pre(s):
        """Pré-requisitos: o que vem de fora do ciclo (imagens geradas, voz, clipes de GPU). O ciclo NÃO gera nada pago: só confere que existe."""
        L = s.L(); falta = [p for p in L.get('precisa', []) if not os.path.exists(os.path.join(s.P, p))]
        if falta: s.marca('pre', 'BLOQUEADO', f'faltam: {falta} (gere fora do ciclo; o que é pago, só com o custo confirmado por você)'); return False
        if s.exige_revisao:      # quem gera não aprova: revisor de contexto zerado (revisor/REVISOR.md) -> <projeto>/revisao/veredito.json
            vd = os.path.join(s.P, 'revisao', 'veredito.json')
            if not os.path.exists(vd):
                s.marca('pre', 'BLOQUEADO', 'sem revisão dos quadros: rode o revisor (revisor/REVISOR.md) com --saida <projeto>/revisao'); return False
            Q = json.load(open(vd, encoding='utf-8'))['quadros']
            ok = {q.get('nome') for q in Q if q['veredito'] == 'APROVADO'}
            sem = sorted({g['plano'] for g in L['segmentos']} - ok)
            if sem: s.marca('pre', 'BLOQUEADO', f'quadros sem APROVADO do revisor (refazer com o conserto e revisar de novo): {sem}'); return False
        s.marca('pre', 'pronto'); return True

    def no_linha(s, injetar):
        if not os.path.exists(s.linha): shutil.copy(os.path.join(s.P, 'linha.json'), s.linha)
        if injetar: s.injeta()
        s.marca('linha', 'pronto', f'{len(s.L()["segmentos"])} segmentos'); return True

    def injeta(s):
        """TESTE: estraga planos de propósito (congela o do meio; se algum tem cartão/legenda nossa, empurra para a faixa da UI)"""
        L = s.L(); S = L['segmentos']
        if L.get('_injetado'): return
        meio = len(S) // 2
        S[meio]['fx'] = [x for x in S[meio].get('fx', []) if x != 'congela'] + ['congela']
        inj = {'congela': meio}; txt = f'seg {meio} ({S[meio]["plano"]}) congelado'
        ult = next((i for i, g in enumerate(S) if 'cartoes' in g or 'continua' in g), None)
        if ult is not None:
            S[ult]['ui_dy'] = 330; inj['ui_dy+330'] = ult; txt += f'; seg {ult} ({S[ult]["plano"]}) com cartões 330 px para baixo'
        L['_injetado'] = inj; s.salva(L); s.marca('injecao', 'feita', txt)

    def no_segs(s, lista):
        """render por segmento em paralelo (cada processo carrega só o que usa)"""
        L = s.L()
        def um(i):
            arq = os.path.join(s.D, 'segs', f'seg_{i:03d}.mp4')
            if os.path.exists(arq):
                os.makedirs(os.path.join(s.D, 'segs', '_antigo'), exist_ok=True)
                shutil.move(arq, os.path.join(s.D, 'segs', '_antigo', f'seg_{i:03d}_{time.strftime("%H%M%S")}.mp4'))
            s.marca(f'seg:{i}', 'renderizando', L['segmentos'][i]['plano'])
            s.roda([sys.executable, s.montar, s.linha, s.base, '--segs', str(i), '--pasta', os.path.join(s.D, 'segs')])
            s.marca(f'seg:{i}', 'pronto', L['segmentos'][i]['plano'])
        with ThreadPoolExecutor(s.trab) as ex: list(ex.map(um, lista))

    def no_concat(s):
        n = len(s.L()['segmentos'])
        with open(os.path.join(s.D, 'segs', 'lista.txt'), 'w', encoding='utf-8') as f:
            for i in range(n): f.write(f"file 'seg_{i:03d}.mp4'\n")
        s.roda(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', 'lista.txt', '-c', 'copy', s.base + '_mudo.mp4'], cwd=os.path.join(s.D, 'segs'))
        s.marca('concat', 'pronto')

    def no_mix(s):
        if os.path.exists(s.mixar): s.roda([sys.executable, s.mixar, s.linha, s.base]); s.marca('mix', 'pronto')
        else: shutil.copy(s.base + '_mudo.mp4', s.base + '.mp4'); s.marca('mix', 'pronto', '(sem mixar.py: o final é o mudo)')

    def no_checar(s, rodada):
        out = os.path.join(s.D, f'checagem_r{rodada}'); C = s.L().get('checagem', {})
        cmd = [sys.executable, os.path.join(AQUI, 'checar_planos.py'), '--linha', s.linha, '--video', s.base + '.mp4', '--saida', out]
        for k, flag in (('max_parado', '--max-parado'), ('janela_parado', '--janela-parado'), ('limiar_parado', '--limiar-parado'), ('limiar_fala', '--limiar-fala')):
            if k in C: cmd += [flag, str(C[k])]
        s.roda(cmd, cwd=AQUI)
        v = json.load(open(os.path.join(out, 'veredito.json'), encoding='utf-8'))
        rep = [p for p in v['planos'] if p['veredito'] == 'REPROVADO']
        s.marca(f'checar:r{rodada}', 'pronto', f'{len(rep)} plano(s) reprovado(s)' + (': ' + ', '.join(f"#{p['i']} {p['plano']}" for p in rep) if rep else '')); return v, rep

    # ---------- devolução (só o plano reprovado)
    def devolve(s, rodada, rep):
        L = s.L(); S = L['segmentos']; rerender, remix = set(), False
        with open(s.log_dev, 'a', encoding='utf-8') as f:
            f.write(f'\n## Rodada {rodada} · {time.strftime("%H:%M")}\n')
            for p in rep:
                i = p['i']; g = S[i]; s.tent[i] = s.tent.get(i, 0) + 1
                tipos = sorted({m['tipo'] for m in p['motivos']})
                if s.tent[i] > MAX_TENT:
                    s.problema[i] = tipos
                    f.write(f"- PLANO: #{i} {p['plano']} ({p['t']}–{p['t'] + p['dur']:.2f} s)\n  VEREDITO: PROBLEMA NO PLANO/ROTEIRO ({MAX_TENT} tentativas)\n"
                            f"  MOTIVO: {', '.join(tipos)}\n  PROVA: {p['motivos'][0]['prova']}\n  ESCOPO: parar; o defeito é do plano ou do roteiro, não do ajuste (sem loop)\n")
                    continue
                acoes = []
                for t in tipos:
                    if t == 'parado': g['vivo'] = g.get('vivo', 0) + 1; acoes.append(f"vivo={g['vivo']}"); rerender.add(i)
                    elif t in ('texto_zona_ui', 'texto_borda'):
                        if any(x.startswith('ui_dy') for x in acoes): continue
                        g['ui_dy'] = g.get('ui_dy', 0) - 200; acoes.append(f"ui_dy={g['ui_dy']}"); rerender.add(i)
                    elif t == 'fala': g['abafa_db'] = g.get('abafa_db', 0) - 6; acoes.append(f"abafa_db={g['abafa_db']}"); remix = True
                    elif t == 'volume':
                        m = next(x for x in p['motivos'] if x['tipo'] == 'volume'); passo = 3 if m['medida'] < m['limite'][0] else -3
                        g['ganho_db'] = g.get('ganho_db', 0) + passo; acoes.append(f"ganho_db={g['ganho_db']}"); remix = True
                f.write(f"- PLANO: #{i} {p['plano']} ({p['t']}–{p['t'] + p['dur']:.2f} s) · tentativa {s.tent[i]}/{MAX_TENT}\n  VEREDITO: REPROVADO\n")
                for t in tipos:      # 1 bloco por motivo: a 1ª prova + quantas iguais
                    ms = [m for m in p['motivos'] if m['tipo'] == t]; m = ms[0]
                    f.write(f"  MOTIVO: {t}" + (f" (medida {m.get('medida')}, limite {m.get('limite')})" if 'medida' in m else '') + "\n"
                            f"  PROVA: {m['prova']}" + (f" (+{len(ms) - 1} iguais)" if len(ms) > 1 else '') +
                            (f" · faltaram: {m['faltaram']}" if m.get('faltaram') else '') + "\n")
                f.write(f"  ESCOPO: mexer só neste plano (segmento {i}) → {', '.join(acoes) or 'nada automático'}\n")
        s.salva(L)
        return sorted(rerender), remix or bool(rerender)

    # ---------- execução
    def rodar(s, injetar=False):
        t0 = time.time()
        if not s.no_pre(): return s.fim('BLOQUEADO nos pré-requisitos')
        s.no_linha(injetar)
        n = len(s.L()['segmentos'])
        faltam = [i for i in range(n) if not os.path.exists(os.path.join(s.D, 'segs', f'seg_{i:03d}.mp4'))]
        s.no_segs(faltam); s.no_concat(); s.no_mix()
        for rodada in range(1, MAX_TENT + 2):
            v, rep = s.no_checar(rodada)
            rep = [p for p in rep if p['i'] not in s.problema]
            if not rep: break
            rerender, mexeu = s.devolve(rodada, rep)
            rep = [p for p in rep if p['i'] not in s.problema]
            if not rep or not mexeu: break
            if rerender: s.refeitos.append((rodada, rerender)); s.no_segs(rerender); s.no_concat()
            s.no_mix()
        return s.fim('PRONTO' if not s.problema else f'PRONTO COM PROBLEMA em {sorted(s.problema)}', time.time() - t0)

    def fim(s, msg, dt=None):
        s.marca('CICLO', msg, (f'{dt:.0f} s' if dt < 90 else f'{dt / 60:.1f} min') if dt else '')
        return msg


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--projeto', default=os.path.join(AQUI, 'exemplo')); ap.add_argument('--nome', default='ciclo'); ap.add_argument('--saida')
    ap.add_argument('--injetar', action='store_true'); ap.add_argument('--trabalhos', type=int, default=3)
    ap.add_argument('--exige-revisao', action='store_true', help='bloqueia se <projeto>/revisao/veredito.json não tiver APROVADO para cada plano')
    a = ap.parse_args()
    print(Ciclo(a.projeto, a.nome, a.trabalhos, exige_revisao=a.exige_revisao, saida=a.saida).rodar(a.injetar))
