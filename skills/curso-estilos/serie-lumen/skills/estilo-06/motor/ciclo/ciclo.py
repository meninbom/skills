"""Ciclo LOOP + GRAFO: quem dirige aprova só o TEXTO e o FINAL. No meio, o programa monta, checa por plano e refaz só o plano reprovado.

GRAFO (o que não depende de nada roda junto; a animação respeita "uma tarefa de GPU por vez"):
  imagens (revisadas) ──► h3:<plano> (GPU, 1 por vez) ──┐
  voz (PAGA: o ciclo nunca gera; só usa a que existe) ──┴─► seg:<i> (render por segmento, em paralelo) ─► concat ─► mix ─► checar por plano
LOOP: plano reprovado volta com registro (PLANO / VEREDITO / MOTIVO / PROVA / ESCOPO) e só ele é refeito.
  parado        -> vivo += 1      (aproximação lenta no segmento)        -> re-render só do segmento
  texto_zona_ui -> ui_dy -= 200   (sobe cartões/continua do segmento)    -> re-render só do segmento
  texto_borda   -> ui_dy -= 200
  fala (<95%)   -> abafa_db -= 6  (baixa trilha/SFX sob a voz no trecho) -> re-mix
  volume        -> ganho_db ±3                                           -> re-mix
  No máximo 3 tentativas por plano; depois disso o plano é marcado PROBLEMA NO PLANO/ROTEIRO e vai pra decisão humana, sem loop.

uso (a pasta do episódio segue o desenho do LEIA.md):
  python ciclo.py --ep <pasta do episódio> --nome final                       (roda em cima do que já existe)
  python ciclo.py --ep <pasta> --nome teste --injetar                         (TESTE: estraga 2 planos de propósito pra provar que acha e refaz só eles)
  python ciclo.py --ep <pasta> --nome animatic --sem-animacao --sem-revisao   (sem GPU: monta com os quadros parados)
Saída em <ep>/ciclo_<nome>/: linha_ciclo.json (com os ajustes), segs/, <nome>.mp4, DEVOLUCOES.md, estado.json.
Nada pago roda aqui; nada é apagado (versões velhas vão pra _antigo/).
"""
import os, sys, json, time, shutil, argparse, subprocess, threading
from concurrent.futures import ThreadPoolExecutor

AQUI = os.path.dirname(os.path.abspath(__file__)); MONTAGEM = os.path.join(os.path.dirname(AQUI), 'montagem')
MAX_TENT = 3


class Ciclo:
    def __init__(s, ep, linha, nome, trabalhos=3, exige_revisao=True, anima=True):
        s.EP = os.path.abspath(ep); s.trab = trabalhos; s.exige_revisao = exige_revisao; s.anima = anima
        s.linha_orig = os.path.join(s.EP, linha)
        if not os.path.exists(s.linha_orig): raise SystemExit(f'não achei {s.linha_orig} (rode o montagem/linha_voz.py, ou passe --linha)')
        s.SC = MONTAGEM; s.montar = os.path.join(MONTAGEM, 'montar.py'); s.mixar = os.path.join(MONTAGEM, 'mixar.py')
        s.D = os.path.join(s.EP, f'ciclo_{nome}'); os.makedirs(os.path.join(s.D, 'segs'), exist_ok=True)
        s.base = os.path.join(s.D, nome); s.linha = os.path.join(s.D, 'linha_ciclo.json')
        s.log_dev = os.path.join(s.D, 'DEVOLUCOES.md'); s.estado = {}; s.trava = threading.Lock()
        s.tent = {}            # tentativas por segmento
        s.problema = {}        # segmento -> motivo (3ª falha)

    # ---------- utilidades
    def marca(s, no, st, extra=''):
        with s.trava:
            s.estado[no] = dict(estado=st, extra=extra, hora=time.strftime('%H:%M:%S'))
            json.dump(s.estado, open(os.path.join(s.D, 'estado.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
        print(f'[{time.strftime("%H:%M:%S")}] {no}: {st} {extra}', flush=True)

    def L(s):   # cópia de trabalho do ciclo; antes de existir, a linha original do ep
        arq = s.linha if os.path.exists(s.linha) else s.linha_orig
        return json.load(open(arq, encoding='utf-8'))
    def salva(s, L): json.dump(L, open(s.linha, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)

    def roda(s, cmd, cwd=None):
        r = subprocess.run(cmd, cwd=cwd or s.SC, capture_output=True, text=True, encoding='utf-8', errors='replace')
        if r.returncode != 0: raise RuntimeError(f'{os.path.basename(cmd[1]) if len(cmd) > 1 else cmd[0]}: {r.stderr[-400:]}')
        return r.stdout

    # ---------- nós do grafo
    def no_imagens(s):
        L = s.L(); arqs = L.get('arquivos', {})
        falta = sorted({g['plano'] for g in L['segmentos'] if g['plano'] not in arqs and not os.path.exists(os.path.join(s.EP, 'quadros', f"{g['plano']}.png"))})
        if falta: s.marca('imagens', 'BLOQUEADO', f'faltam quadros (gerar à mão, com a ficha anexada, e passar pelo montagem/placa.py): {falta}'); return False
        if s.exige_revisao:      # quem gera não aprova. Revisor de contexto zerado (revisor/REVISOR.md) -> <ep>/revisao/veredito.json
            vd = os.path.join(s.EP, 'revisao', 'veredito.json')
            if not os.path.exists(vd):
                s.marca('imagens', 'BLOQUEADO', 'sem revisão dos quadros: rode o revisor (ciclo/revisor/REVISOR.md) com --saida <ep>/revisao'); return False
            Q = json.load(open(vd, encoding='utf-8'))['quadros']
            ok = {q.get('nome') for q in Q if q['veredito'] == 'APROVADO'} | {os.path.splitext(os.path.basename(q.get('arquivo', '')))[0] for q in Q if q['veredito'] == 'APROVADO'}
            planos = sorted({g['plano'] for g in L['segmentos']})
            sem = [p for p in planos if os.path.splitext(os.path.basename(arqs.get(p, p)))[0] not in ok]
            if sem: s.marca('imagens', 'BLOQUEADO', f'quadros sem APROVADO do revisor (refazer com o conserto do revisor e revisar de novo): {sem}'); return False
        s.marca('imagens', 'pronto'); return True

    def no_h3(s, plano):
        tem = lambda: any(os.path.exists(os.path.join(s.EP, 'h3', d, f'{plano}.mp4')) for d in ('clips60', 'clips'))
        if tem(): s.marca(f'h3:{plano}', 'pronto', '(já existia)'); return True
        if not s.anima: s.marca(f'h3:{plano}', 'pulado', '(--sem-animacao: quadro parado com empurrão de câmera)'); return True
        if not os.path.exists(os.path.join(s.EP, 'h3', 'placas', f'{plano}.png')): s.marca(f'h3:{plano}', 'BLOQUEADO', 'sem placa'); return False
        if not os.environ.get('COMFY_DIR'): s.marca(f'h3:{plano}', 'BLOQUEADO', 'defina COMFY_DIR (ver h3_um.sh) ou use --sem-animacao'); return False
        s.marca(f'h3:{plano}', 'esperando GPU')
        subprocess.run(['bash', os.path.join(AQUI, 'h3_um.sh'), os.path.join(s.EP, 'h3'), plano], check=False)   # pega/solta a trava lá dentro
        ok = tem()
        s.marca(f'h3:{plano}', 'pronto' if ok else 'FALHOU'); return ok

    def no_voz(s):
        vz = s.L().get('voz')
        if not vz: s.marca('voz', 'pronto', '(linha sem voz: animatic)'); return True
        if os.path.exists(os.path.join(s.EP, vz)): s.marca('voz', 'pronto', '(já existia)'); return True
        s.marca('voz', 'BLOQUEADO', f'falta {vz}. Voz é PAGA: o ciclo nunca gera. Rode voz/gerar_voz.py com --confirmo-custo e depois montagem/linha_voz.py'); return False

    def no_linha(s, injetar):
        if not os.path.exists(s.linha): shutil.copy(s.linha_orig, s.linha)
        if injetar: s.injeta()
        s.marca('linha', 'pronto', f'{len(s.L()["segmentos"])} segmentos'); return True

    def injeta(s):
        """TESTE: estraga 2 planos de propósito (congela um plano no meio; empurra os cartões do último pra faixa da UI)"""
        L = s.L(); S = L['segmentos']
        meio = len(S) // 2
        S[meio].setdefault('fx', []); S[meio]['fx'] = [x for x in S[meio]['fx'] if x != 'congela'] + ['congela']
        ult = next((i for i, g in enumerate(S) if 'cartoes' in g or 'continua' in g), len(S) - 1)
        S[ult]['ui_dy'] = 330
        L['_injetado'] = {'congela': meio, 'ui_dy+330': ult}; s.salva(L)
        s.marca('injecao', 'feita', f'seg {meio} ({S[meio]["plano"]}) congelado; seg {ult} ({S[ult]["plano"]}) com cartões 330 px pra baixo')

    def no_segs(s, lista):
        """render por segmento em paralelo (cada processo carrega só os clipes que usa)"""
        L = s.L()
        def um(i):
            arq = os.path.join(s.D, 'segs', f'seg_{i:03d}.mp4')
            if os.path.exists(arq):
                os.makedirs(os.path.join(s.D, 'segs', '_antigo'), exist_ok=True)
                shutil.move(arq, os.path.join(s.D, 'segs', '_antigo', f'seg_{i:03d}_{time.strftime("%H%M%S")}.mp4'))
            s.marca(f'seg:{i}', 'renderizando', L['segmentos'][i]['plano'])
            s.roda([sys.executable, s.montar, s.linha, s.base, '--ep', s.EP, '--segs', str(i), '--pasta', os.path.join(s.D, 'segs')])
            s.marca(f'seg:{i}', 'pronto', L['segmentos'][i]['plano'])
        with ThreadPoolExecutor(s.trab) as ex: list(ex.map(um, lista))

    def no_concat(s):
        n = len(s.L()['segmentos'])
        with open(os.path.join(s.D, 'segs', 'lista.txt'), 'w', encoding='utf-8') as f:
            for i in range(n): f.write(f"file 'seg_{i:03d}.mp4'\n")
        s.roda(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', 'lista.txt', '-c', 'copy', s.base + '_mudo.mp4'], cwd=os.path.join(s.D, 'segs'))
        s.marca('concat', 'pronto')

    def no_mix(s):
        s.roda([sys.executable, s.mixar, s.linha, s.base, '--ep', s.EP]); s.marca('mix', 'pronto')

    def no_checar(s, rodada):
        out = os.path.join(s.D, f'checagem_r{rodada}')
        s.roda([sys.executable, os.path.join(AQUI, 'checar_planos.py'), '--linha', s.linha, '--video', s.base + '.mp4', '--saida', out], cwd=AQUI)
        v = json.load(open(os.path.join(out, 'veredito.json'), encoding='utf-8'))
        rep = [p for p in v['planos'] if p['veredito'] == 'REPROVADO']
        s.marca(f'checar:r{rodada}', 'pronto', f'{len(rep)} plano(s) reprovado(s)'); return v, rep

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
                            f"  MOTIVO: {', '.join(tipos)}\n  PROVA: {p['motivos'][0]['prova']}\n  ESCOPO: parar; decisão humana (sem loop)\n")
                    continue
                acoes = []
                for t in tipos:
                    if t == 'parado': g['vivo'] = g.get('vivo', 0) + 1; acoes.append(f"vivo={g['vivo']}"); rerender.add(i)
                    elif t in ('texto_zona_ui', 'texto_borda'):
                        if 'ui_dy' in acoes_feitas(acoes): continue
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
        # fase 1: o que não depende de nada, junto (imagens, voz); depois H3 (1 por vez pela trava) e linha
        with ThreadPoolExecutor(4) as ex:
            f_img, f_voz = ex.submit(s.no_imagens), ex.submit(s.no_voz)
            ok_img, ok_voz = f_img.result(), f_voz.result()
        if not ok_voz: return s.fim('BLOQUEADO na voz (paga): gere a voz você mesmo, com --confirmo-custo')
        s.no_linha(injetar)
        planos = sorted({g['plano'] for g in s.L()['segmentos'] if g['plano'] not in s.L().get('arquivos', {})})
        if not ok_img: return s.fim('BLOQUEADO nas imagens')
        oks = [s.no_h3(p) for p in planos]            # serial de propósito: GPU 1 por vez
        if not all(oks): return s.fim('animação com falha ou bloqueada')
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
            if rerender: s.no_segs(rerender); s.no_concat()
            s.no_mix()
        return s.fim('PRONTO' if not s.problema else f'PRONTO COM PROBLEMA em {sorted(s.problema)}', time.time() - t0)

    def fim(s, msg, dt=None):
        s.marca('CICLO', msg, f'{dt / 60:.1f} min' if dt else '')
        return msg


def acoes_feitas(acoes): return ' '.join(acoes)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--ep', required=True, help='pasta do episódio'); ap.add_argument('--linha', default='linha_voz.json'); ap.add_argument('--nome', default='ciclo')
    ap.add_argument('--injetar', action='store_true'); ap.add_argument('--trabalhos', type=int, default=3)
    ap.add_argument('--sem-revisao', action='store_true', help='não exige o veredito do revisor de quadros (teste ou animatic)')
    ap.add_argument('--sem-animacao', action='store_true', help='não chama o H3: plano sem clipe usa o quadro parado')
    a = ap.parse_args()
    print(Ciclo(a.ep, a.linha, a.nome, a.trabalhos, exige_revisao=not a.sem_revisao, anima=not a.sem_animacao).rodar(a.injetar))
