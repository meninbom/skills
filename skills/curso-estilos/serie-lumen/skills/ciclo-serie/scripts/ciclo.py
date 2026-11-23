"""ciclo: LAÇO + GRAFO de um episódio. O aluno aprova só o TEXTO e o FINAL; no meio, o programa monta,
checa cada plano e refaz só o plano que falhou.

GRAFO (o que não depende de nada roda junto; o H3 respeita a trava da GPU, um por vez):
  imagens (+ revisão) ──► h3:<plano> (GPU, 1 por vez) ──┐
  voz (já gerada e com ok) ──► linha ───────────────────┴─► seg:<i> (paralelo) ─► concat ─► mix ─► checar por plano
LAÇO: plano que falhou volta com registro (PLANO / VEREDITO / MOTIVO / PROVA / ESCOPO) e só ele é refeito.
  parado        -> vivo += 1      (aproximação lenta)            -> refaz só o segmento
  texto_zona_ui -> ui_dy -= 200   (sobe cartões e painel)        -> refaz só o segmento
  texto_borda   -> ui_dy -= 200
  fala (<95%)   -> abafa_db -= 6  (baixa trilha/SFX sob a voz)   -> refaz o mix
  volume        -> ganho_db ±3                                   -> refaz o mix
  No máximo 3 tentativas por plano; na 4ª falha o plano vira PROBLEMA NO PLANO/ROTEIRO (vai pro aluno), sem laço.

uso:
  python ciclo.py --ep ep01 --nome final                       roda em cima do que existe no ep
  python ciclo.py --ep ep01 --nome teste --injetar             TESTE: estraga 2 planos de propósito e prova que acha e refaz só eles
  flags: --sem-h3 (plano sem clipe vai de placa com empurrão) · --sem-stt · --sem-revisao · --trabalhos 3
Saída em <serie>/ciclo/<ep>_<nome>/: linha_ciclo.json (com os ajustes), segs/, <nome>.mp4 + _celular, DEVOLUCOES.md,
estado.json, checagem_rN/veredito.json. Nada pago roda aqui; nada é apagado (o velho vai pra _antigo/).
"""
import sys as _sys_utf8
for _s in (_sys_utf8.stdout, _sys_utf8.stderr):   # acento certo no terminal do Windows, inclusive nas mensagens de erro
    try: _s.reconfigure(encoding='utf-8')
    except Exception: pass
import os, sys, json, glob, time, shutil, argparse, subprocess, threading
from concurrent.futures import ThreadPoolExecutor

AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, AQUI)
import kitcfg  # noqa: E402

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
MAX_TENT = 3
SOBREPOE = ('cartoes', 'selo', 'aviso', 'raiox')


def acha_bash():
    p = kitcfg.get('ferramentas.bash')
    if p: return p
    if os.name == 'nt':        # o bash do System32 é o do WSL; o H3 precisa do Git Bash
        for c in (r'C:\Program Files\Git\bin\bash.exe', r'C:\Program Files (x86)\Git\bin\bash.exe'):
            if os.path.isfile(c): return c
    w = shutil.which('bash')
    return w or 'bash'


def script_do_ep(sc, padrao, nome):
    achados = sorted(glob.glob(os.path.join(sc, padrao))) if os.path.isdir(sc) else []
    return achados[0] if achados else os.path.join(AQUI, nome)


class Ciclo:
    def __init__(s, ep, nome, trabalhos=3, exige_revisao=True, sem_h3=False, sem_stt=False):
        s.SERIE = kitcfg.pasta_serie(); s.ep = ep; s.EP = os.path.join(s.SERIE, ep)
        if not os.path.isdir(s.EP): raise SystemExit(f'ciclo: não achei o ep {s.EP}')
        s.trab = trabalhos; s.exige_revisao = exige_revisao; s.sem_h3 = sem_h3; s.sem_stt = sem_stt
        s.GPU_LOCK = kitcfg.get('gpu.trava') or os.path.join(s.SERIE, '.gpu.lock')
        sc = os.path.join(s.EP, 'scripts')
        s.montar = script_do_ep(sc, 'montar*.py', 'montar.py'); s.mixar = script_do_ep(sc, 'mixar*.py', 'mixar.py')
        s.linha_voz = script_do_ep(sc, 'linha_voz*.py', 'linha_voz.py')
        s.D = os.path.join(s.SERIE, 'ciclo', f'{ep}_{nome}'); os.makedirs(os.path.join(s.D, 'segs'), exist_ok=True)
        s.base = os.path.join(s.D, nome); s.linha = os.path.join(s.D, 'linha_ciclo.json')
        s.log_dev = os.path.join(s.D, 'DEVOLUCOES.md'); s.estado = {}; s.trava = threading.Lock()
        s.tent = {}; s.problema = {}
        s.env = dict(os.environ, PYTHONIOENCODING='utf-8', PYTHONUTF8='1')
        s.env.setdefault('KIT_SERIE_CONFIG', kitcfg.carrega()['_arquivo'])

    # ---------- utilidades
    def marca(s, no, st, extra=''):
        with s.trava:
            s.estado[no] = dict(estado=st, extra=extra, hora=time.strftime('%H:%M:%S'))
            json.dump(s.estado, open(os.path.join(s.D, 'estado.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
        print(f'[{time.strftime("%H:%M:%S")}] {no}: {st} {extra}', flush=True)

    def L(s):   # cópia de trabalho do ciclo; antes dela existir, a linha do ep
        arq = s.linha if os.path.exists(s.linha) else os.path.join(s.EP, 'linha_voz.json')
        return json.load(open(arq, encoding='utf-8'))

    def salva(s, L): json.dump(L, open(s.linha, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)

    def roda(s, cmd, cwd=None):
        r = subprocess.run(cmd, cwd=cwd or s.D, capture_output=True, text=True, encoding='utf-8', errors='replace', env=s.env)
        if r.returncode != 0:
            quem = os.path.basename(cmd[1]) if len(cmd) > 1 else cmd[0]
            raise RuntimeError(f'{quem} falhou:\n{(r.stderr or r.stdout)[-800:]}')
        return r.stdout

    def tem_clipe(s, plano, arqs):
        if plano in arqs: return True
        return os.path.exists(os.path.join(s.EP, 'h3', 'clips60', f'{plano}.mp4'))

    # ---------- nós do grafo
    def no_imagens(s):
        # lê a cópia do ciclo ou a estimada (a linha_voz.json pode estar sendo escrita agora pelo nó da voz)
        cands = [s.linha, os.path.join(s.EP, 'linha_estimada.json'), os.path.join(s.EP, 'linha_voz.json')]
        pl = next((c for c in cands if os.path.exists(c)), None)
        if not pl: s.marca('imagens', 'BLOQUEADO', 'falta linha_estimada.json (os planos com "ancora")'); return False
        L = json.load(open(pl, encoding='utf-8'))
        arqs = L.get('arquivos', {}); planos = sorted({g['plano'] for g in L['segmentos']})
        falta = [p for p in planos if p not in arqs and not os.path.exists(os.path.join(s.EP, 'gpt', f'{p}.png'))
                 and not s.tem_clipe(p, arqs)]
        if falta: s.marca('imagens', 'BLOQUEADO', f'faltam os quadros gpt/<PLANO>.png: {falta}'); return False
        if s.exige_revisao:      # quem gera não aprova: revisor-quadros grava <ep>/revisao/veredito.json
            vd = os.path.join(s.EP, 'revisao', 'veredito.json')
            if not os.path.exists(vd):
                s.marca('imagens', 'BLOQUEADO', f'sem revisão dos quadros: rode a skill revisor-quadros com saída em {s.EP}/revisao'); return False
            Q = json.load(open(vd, encoding='utf-8')).get('quadros', [])
            ok = {q.get('nome') for q in Q if q.get('veredito') == 'APROVADO'} | \
                 {os.path.splitext(os.path.basename(q.get('arquivo', '')))[0] for q in Q if q.get('veredito') == 'APROVADO'}
            sem = [p for p in planos if os.path.splitext(os.path.basename(arqs.get(p, p)))[0] not in ok and p not in ok]
            if sem: s.marca('imagens', 'BLOQUEADO', f'quadros sem APROVADO do revisor (refazer com o conserto e revisar de novo): {sem}'); return False
        s.marca('imagens', 'pronto'); return True

    def no_h3(s, plano):
        if os.path.exists(os.path.join(s.EP, 'h3', 'clips60', f'{plano}.mp4')): s.marca(f'h3:{plano}', 'pronto', '(já existia)'); return True
        if s.sem_h3: s.marca(f'h3:{plano}', 'pulado', '(--sem-h3: vai de placa com empurrão)'); return True
        sh = os.path.abspath(os.path.join(AQUI, '..', '..', 'animar-local', 'scripts', 'h3_um.sh'))
        if not os.path.isfile(sh):
            s.marca(f'h3:{plano}', 'BLOQUEADO', 'não achei a skill animar-local (../../animar-local/scripts/h3_um.sh). Instale ou rode com --sem-h3'); return False
        if not os.path.exists(os.path.join(s.EP, 'h3', 'placas', f'{plano}.png')): s.marca(f'h3:{plano}', 'BLOQUEADO', 'sem h3/placas/<PLANO>.png'); return False
        s.marca(f'h3:{plano}', 'esperando GPU')
        barra = lambda p: p.replace('\\', '/')
        subprocess.run([acha_bash(), barra(sh), barra(os.path.join(s.EP, 'h3')), plano, barra(s.GPU_LOCK)], check=False, env=s.env)   # pega/solta a trava lá dentro
        ok = os.path.exists(os.path.join(s.EP, 'h3', 'clips60', f'{plano}.mp4'))
        s.marca(f'h3:{plano}', 'pronto' if ok else 'FALHOU'); return ok

    def no_voz(s):
        """a voz é PAGA e não roda aqui. Aqui só se confere que ela existe (e monta o voz.wav dos pedaços, que é grátis)."""
        VZ = os.path.join(s.EP, 'voz')
        if not os.path.exists(os.path.join(VZ, 'OK_GASTO_VOZ.txt')):
            s.marca('voz', 'BLOQUEADO', 'sem voz/OK_GASTO_VOZ.txt (o ok do aluno na voz). A voz é paga: gere e aprove com a skill voz-serie'); return False
        if os.path.exists(os.path.join(VZ, 'voz.wav')): s.marca('voz', 'pronto', '(já existia)'); return True
        if not glob.glob(os.path.join(VZ, 'pecas', '*_-16.wav')):
            s.marca('voz', 'BLOQUEADO', 'sem os pedaços em voz/pecas/. Gere com a skill voz-serie (este ciclo nunca gasta sozinho)'); return False
        try:
            s.roda([sys.executable, s.linha_voz, s.EP], cwd=s.EP)
        except RuntimeError as e:
            s.marca('voz', 'BLOQUEADO', str(e).splitlines()[-1]); return False
        s.marca('voz', 'pronto', '(voz.wav montado dos pedaços)'); return True

    def no_linha(s, injetar):
        orig = os.path.join(s.EP, 'linha_voz.json')
        if not os.path.exists(orig) or 'palavras' not in json.load(open(orig, encoding='utf-8')):
            s.roda([sys.executable, s.linha_voz, s.EP], cwd=s.EP)
        if not os.path.exists(s.linha):
            L = json.load(open(orig, encoding='utf-8')); L['ep'] = s.EP; s.salva(L)
        if injetar and '_injetado' not in s.L(): s.injeta()
        s.marca('linha', 'pronto', f'{len(s.L()["segmentos"])} segmentos'); return True

    def injeta(s):
        """TESTE: estraga 2 planos de propósito (congela um plano do meio; empurra os cartões pra faixa da UI)"""
        L = s.L(); S = L['segmentos']
        ult = next((i for i, g in enumerate(S) if 'cartoes' in g), len(S) - 1)
        calmos = [i for i, g in enumerate(S) if 0 < i != ult and not any(k in g for k in ('raiox', 'soco', 'aviso', 'cartoes'))
                  and 'glitch' not in g.get('fx', []) and float(g['dur']) >= 2.0]
        if not calmos: calmos = [i for i in range(1, len(S)) if i != ult] or [0]
        meio = min(calmos, key=lambda i: abs(i - len(S) / 2))
        S[meio]['fx'] = [x for x in S[meio].get('fx', []) if x != 'congela'] + ['congela']
        S[ult]['ui_dy'] = 330
        L['_injetado'] = {'congela': meio, 'ui_dy+330': ult}; s.salva(L)
        s.marca('injecao', 'feita', f'seg {meio} ({S[meio]["plano"]}) congelado; seg {ult} ({S[ult]["plano"]}) com cartões 330 px pra baixo')

    def no_segs(s, lista):
        """render por segmento em paralelo (cada processo lê só o clipe que usa)"""
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
        mudo = s.base + '_mudo.mp4'
        if os.path.exists(mudo): s.guarda(mudo)
        s.roda([kitcfg.get('ferramentas.ffmpeg', 'ffmpeg'), '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', 'lista.txt', '-c', 'copy', mudo],
               cwd=os.path.join(s.D, 'segs'))
        s.marca('concat', 'pronto')

    def guarda(s, arq):
        """versão velha vai pra _antigo/ (nada é apagado)"""
        d = os.path.join(s.D, '_antigo'); os.makedirs(d, exist_ok=True)
        b, e = os.path.splitext(os.path.basename(arq))
        shutil.move(arq, os.path.join(d, f'{b}_{time.strftime("%H%M%S")}{e}'))

    def no_mix(s):
        for x in (s.base + '.mp4', s.base + '_celular.mp4'):
            if os.path.exists(x): s.guarda(x)
        out = s.roda([sys.executable, s.mixar, s.linha, s.base]).strip().splitlines()
        s.marca('mix', 'pronto', out[-1] if out else '')

    def no_checar(s, rodada):
        out = os.path.join(s.D, f'checagem_r{rodada}')
        cmd = [sys.executable, os.path.join(AQUI, 'checar_planos.py'), '--linha', s.linha, '--video', s.base + '.mp4', '--saida', out]
        if s.sem_stt: cmd.append('--sem-stt')
        s.roda(cmd)
        v = json.load(open(os.path.join(out, 'veredito.json'), encoding='utf-8'))
        rep = [p for p in v['planos'] if p['veredito'] == 'REPROVADO']
        s.marca(f'checar:r{rodada}', 'pronto', f'{len(rep)} plano(s) reprovado(s)' + (': ' + ', '.join(f"#{p['i']} {p['plano']}" for p in rep) if rep else ''))
        return v, rep

    # ---------- devolução (só o plano que falhou)
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
                            f"  MOTIVO: {', '.join(tipos)}\n  PROVA: {p['motivos'][0]['prova']}\n  ESCOPO: parar; vai pro aluno decidir (sem laço)\n")
                    continue
                acoes, subiu = [], False
                for t in tipos:
                    if t == 'parado':
                        g['vivo'] = g.get('vivo', 0) + 1; acoes.append(f"vivo={g['vivo']}"); rerender.add(i)
                    elif t in ('texto_zona_ui', 'texto_borda') and not subiu:
                        g['ui_dy'] = g.get('ui_dy', 0) - 200; acoes.append(f"ui_dy={g['ui_dy']}"); rerender.add(i); subiu = True
                    elif t == 'fala':
                        g['abafa_db'] = g.get('abafa_db', 0) - 6; acoes.append(f"abafa_db={g['abafa_db']}"); remix = True
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
        if injetar and os.path.exists(s.linha) and '_injetado' not in s.L():
            print('aviso: este --nome já tem linha_ciclo.json sem injeção; a injeção entra agora.', flush=True)
        with ThreadPoolExecutor(2) as ex:      # fase 1: o que não depende de nada, junto
            f_img, f_voz = ex.submit(s.no_imagens), ex.submit(s.no_voz)
            ok_img, ok_voz = f_img.result(), f_voz.result()
        if not ok_voz: return s.fim('BLOQUEADO na voz')
        s.no_linha(injetar)
        if not ok_img: return s.fim('BLOQUEADO nas imagens')
        L = s.L(); arqs = L.get('arquivos', {})
        planos = sorted({g['plano'] for g in L['segmentos'] if g['plano'] not in arqs})
        oks = [s.no_h3(p) for p in planos]            # serial de propósito: GPU 1 por vez
        if not all(oks): return s.fim('BLOQUEADO no H3')
        n = len(L['segmentos'])
        faltam = [i for i in range(n) if not os.path.exists(os.path.join(s.D, 'segs', f'seg_{i:03d}.mp4'))]
        if faltam: s.no_segs(faltam)
        s.no_concat(); s.no_mix()
        for rodada in range(1, MAX_TENT + 2):
            v, rep = s.no_checar(rodada)
            rep = [p for p in rep if p['i'] not in s.problema]
            if not rep: break
            rerender, mexeu = s.devolve(rodada, rep)
            rep = [p for p in rep if p['i'] not in s.problema]
            if not rep or not mexeu: break
            if rerender: s.no_segs(rerender); s.no_concat()
            s.no_mix()
        msg = 'PRONTO' if not s.problema else f'PRONTO COM PROBLEMA nos segmentos {sorted(s.problema)} (ver DEVOLUCOES.md)'
        return s.fim(msg, time.time() - t0)

    def fim(s, msg, dt=None):
        s.marca('CICLO', msg, f'{dt / 60:.1f} min' if dt else '')
        if msg.startswith('PRONTO'): print('vídeo:', s.base + '.mp4', '| celular:', s.base + '_celular.mp4', flush=True)
        return msg


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description='ciclo: monta, checa por plano e refaz só o plano que falhou')
    ap.add_argument('--ep', required=True); ap.add_argument('--nome', default='ciclo')
    ap.add_argument('--injetar', action='store_true', help='TESTE: estraga 2 planos de propósito')
    ap.add_argument('--trabalhos', type=int, default=3)
    ap.add_argument('--sem-h3', action='store_true', help='não chama o H3; plano sem clipe vai de placa com empurrão')
    ap.add_argument('--sem-stt', action='store_true', help='pula a checagem de fala (STT)')
    ap.add_argument('--sem-revisao', action='store_true', help='não exige o veredito do revisor-quadros')
    a = ap.parse_args()
    c = Ciclo(a.ep, a.nome, a.trabalhos, exige_revisao=not a.sem_revisao, sem_h3=a.sem_h3, sem_stt=a.sem_stt)
    try:
        r = c.rodar(a.injetar)
    except RuntimeError as e:
        c.marca('CICLO', 'FALHOU', str(e)[-600:]); sys.exit(1)
    print(r)
    sys.exit(0 if r.startswith('PRONTO') else 2)
