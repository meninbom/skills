"""linha_voz: monta a locução do ep e acha o tempo REAL de cada plano. Grátis (não chama nenhuma API).

uso: python linha_voz.py <ep> [--respiro 0.25] [--cauda 1.6] [--sem-corte]
     <ep> = a pasta do ep, ou o nome dele dentro da pasta da série (ex.: ep01).

Lê (dentro do ep):
  voz/falas.tsv                 ordem da locução: id<TAB>papel<TAB>parametros<TAB>texto (papel PAUSA = silêncio de N s)
  voz/escolha.json              {id: "A"} qual tomada usar (padrão "A")
  voz/pecas/<id>_<T>_-16.wav    o áudio de cada pedaço
  voz/pecas/<id>_<T>.words.json [{"w", "start", "end"}, ...] (formato da ElevenLabs)
  linha_estimada.json           os planos, cada um com "ancora" (as 1ªs palavras ditas quando ele entra)
Grava:
  voz/voz.wav                   a locução inteira, com respiro entre os pedaços
  linha_voz.json                a linha do tempo real: t, dur, vel por plano + total + palavras

Âncora:
  - texto: as palavras, na ordem, sem ligar pra pontuação e acento ("o lobo parou");
  - "#ID": o começo do pedaço ID do falas.tsv (serve pra PAUSA: "#P1");
  - "desloca": -0.1 no plano adianta o corte (em segundos).
Tempos dentro do plano (soco, cartoes.t, aviso.t, selo.t0, raiox.t0, sfx[].t) podem ser número (s) ou texto:
texto = a palavra onde aquilo acontece. raiox.t1 / selo.t1 = "fim" vai até o fim do plano.
"""
import sys as _sys_utf8
for _s in (_sys_utf8.stdout, _sys_utf8.stderr):   # acento certo no terminal do Windows, inclusive nas mensagens de erro
    try: _s.reconfigure(encoding='utf-8')
    except Exception: pass
import os, sys, json, re, argparse, subprocess, unicodedata
import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, AQUI)
import kitcfg  # noqa: E402

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
FF = kitcfg.get('ferramentas.ffmpeg', 'ffmpeg'); FP = kitcfg.get('ferramentas.ffprobe', 'ffprobe')
SR = 48000


def para(msg):
    raise SystemExit('linha_voz: ' + msg)


def norm(w):
    w = unicodedata.normalize('NFD', str(w).lower())
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in w if unicodedata.category(c) != 'Mn'))


def le_wav(f):
    return np.frombuffer(subprocess.check_output([FF, '-v', 'error', '-i', f, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-']),
                         np.float32).copy()


def dur_arquivo(f):
    r = subprocess.run([FP, '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except ValueError:
        return None


def le_palavras(f):
    d = json.load(open(f, encoding='utf-8'))
    if isinstance(d, dict):
        d = d.get('words') or d.get('palavras') or []
    out = []
    for x in d:
        w = x.get('w', x.get('word', x.get('text', '')))
        if str(w).strip():
            out.append(dict(w=str(w), start=float(x['start']), end=float(x['end'])))
    return out


def pasta_ep(arg):
    if os.path.isdir(arg):
        return os.path.abspath(arg)
    p = os.path.join(kitcfg.pasta_serie(), arg)
    if os.path.isdir(p):
        return p
    para(f'não achei o ep "{arg}" (nem como pasta, nem dentro da série).')


def le_falas(arq):
    if not os.path.exists(arq):
        para(f'falta {arq}. A skill voz-serie grava esse arquivo.')
    out = []
    for n, lin in enumerate(open(arq, encoding='utf-8'), 1):
        lin = lin.rstrip('\r\n')
        if not lin.strip() or lin.lstrip().startswith('#'):
            continue
        c = lin.split('\t')
        if len(c) < 4:
            para(f'{arq} linha {n}: precisa de 4 colunas separadas por TAB (id, papel, parametros, texto).')
        out.append((c[0].strip(), c[1].strip(), c[2].strip(), c[3].strip()))
    if not out:
        para(f'{arq} está vazio.')
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('ep'); ap.add_argument('--respiro', type=float, default=0.25)
    ap.add_argument('--cauda', type=float, default=None, help='segundos depois da última palavra (padrão: "cauda" da linha, ou 1,6)')
    ap.add_argument('--sem-corte', action='store_true', help='não apara o silêncio do começo/fim de cada pedaço')
    a = ap.parse_args()
    EP = pasta_ep(a.ep); VZ = os.path.join(EP, 'voz')
    falas = le_falas(os.path.join(VZ, 'falas.tsv'))
    pe = os.path.join(VZ, 'escolha.json')
    esc = json.load(open(pe, encoding='utf-8')) if os.path.exists(pe) else {}

    # 1) a locução: pedaço por pedaço, na ordem do falas.tsv
    pedacos, PAL, ini_id, faltam = [], [], {}, []
    T, antes_audio = 0.0, False
    fade = int(0.008 * SR)
    for fid, papel, _par, txt in falas:
        if papel.upper() == 'PAUSA':
            try:
                d = float(txt.replace(',', '.'))
            except ValueError:
                para(f'PAUSA {fid}: o texto tem que ser os segundos (ex.: 1.5), veio "{txt}".')
            ini_id[fid] = (T, d); pedacos.append(np.zeros(int(d * SR), np.float32)); T += d; antes_audio = False
            continue
        tom = str(esc.get(fid, 'A'))
        wav = os.path.join(VZ, 'pecas', f'{fid}_{tom}_-16.wav'); wj = os.path.join(VZ, 'pecas', f'{fid}_{tom}.words.json')
        if not os.path.exists(wav) or not os.path.exists(wj):
            faltam.append(os.path.basename(wav) if not os.path.exists(wav) else os.path.basename(wj)); continue
        x = le_wav(wav); Wd = le_palavras(wj)
        if Wd and not a.sem_corte:
            c0 = max(0.0, Wd[0]['start'] - 0.06); c1 = min(len(x) / SR, Wd[-1]['end'] + 0.22)
        else:
            c0, c1 = 0.0, len(x) / SR
        tr = x[int(c0 * SR):int(c1 * SR)].copy()
        if len(tr) > 2 * fade:      # 8 ms de rampa nas pontas: corte sem estalo
            r = np.linspace(0, 1, fade, dtype=np.float32); tr[:fade] *= r; tr[-fade:] *= r[::-1]
        if antes_audio:
            pedacos.append(np.zeros(int(a.respiro * SR), np.float32)); T += a.respiro
        ini_id[fid] = (T, len(tr) / SR)
        for w in Wd:
            PAL.append(dict(w=w['w'], t=T + w['start'] - c0, n=norm(w['w']), id=fid))
        pedacos.append(tr); T += len(tr) / SR; antes_audio = True
    if faltam:
        para('faltam pedaços da voz em voz/pecas/: ' + ', '.join(faltam) +
             '. Gere com a skill voz-serie (é paga: só com o ok do aluno) ou confira o voz/escolha.json.')
    os.makedirs(VZ, exist_ok=True)
    subprocess.run([FF, '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'pcm_s16le',
                    os.path.join(VZ, 'voz.wav')], input=np.concatenate(pedacos).tobytes(), check=True)
    PALn = [p for p in PAL if p['n']]

    def acha(texto, ini=0):
        """índice da 1ª palavra da sequência `texto` em PALn, a partir de ini"""
        alvo = [norm(x) for x in str(texto).split() if norm(x)]
        if not alvo:
            return None
        for i in range(ini, len(PALn) - len(alvo) + 1):
            if all(PALn[i + j]['n'] == alvo[j] for j in range(len(alvo))):
                return i
        return None

    def tempo_ancora(anc, ini, quem):
        anc = str(anc).strip()
        if anc.startswith('#'):
            k = anc[1:]
            if k not in ini_id:
                para(f'{quem}: âncora "{anc}" aponta pra um id que não está no falas.tsv.')
            t0 = ini_id[k][0]
            prox = next((i for i, p in enumerate(PALn) if p['t'] >= t0 - 0.01), len(PALn))
            return t0, prox
        i = acha(anc, ini)
        if i is None:
            j = acha(anc, 0)
            if j is not None:
                para(f'{quem}: a âncora "{anc}" existe, mas vem ANTES do plano anterior. Os planos têm que seguir a ordem da voz.')
            perto = ' '.join(p['w'] for p in PALn[ini:ini + 25])
            para(f'{quem}: não achei a âncora "{anc}" na voz. Ela tem que ser igual às palavras ditas (sem ligar pra pontuação).\n'
                 f'  A voz, a partir do plano anterior: "{perto} ..."')
        return PALn[i]['t'], i

    # 2) os planos
    pl = os.path.join(EP, 'linha_estimada.json')
    if not os.path.exists(pl):
        para(f'falta {pl} (os planos com "ancora").')
    E = json.load(open(pl, encoding='utf-8')); S = [dict(s) for s in E.get('segmentos', [])]
    if not S:
        para('linha_estimada.json sem "segmentos".')
    ts, ult, idx = [], 0, []
    for i, s in enumerate(S):
        quem = f'plano #{i} ({s.get("plano", "?")})'
        anc = s.get('ancora')
        if i == 0 and not anc:
            t, k = 0.0, 0
        elif not anc:
            para(f'{quem} sem "ancora". Escreva as 1ªs palavras ditas quando ele entra.')
        else:
            t, k = tempo_ancora(anc, ult, quem); ult = k + 1
        t += float(s.get('desloca', 0) or 0)
        if i == 0:
            if t > 0.6:
                print(f'aviso: a âncora do 1º plano cai em {t:.2f} s; o vídeo começa no 0 mesmo assim.')
            t = 0.0
        ts.append(max(0.0, t)); idx.append(k)
    for i in range(1, len(ts)):
        if ts[i] <= ts[i - 1] + 0.3:
            para(f'plano #{i} ({S[i]["plano"]}) começa {ts[i] - ts[i - 1]:.2f} s depois do anterior: âncora repetida ou fora de ordem.')
    cauda = a.cauda if a.cauda is not None else float(E.get('cauda', 1.6))
    total = round(T + cauda, 3)
    arqs = E.get('arquivos', {})
    for i, s in enumerate(S):
        s['t'] = round(ts[i], 3)
        s['dur'] = round((ts[i + 1] if i + 1 < len(ts) else total) - ts[i], 3)
        quem = f'plano #{i} ({s.get("plano", "?")})'

        def resolve(v, campo):
            if isinstance(v, str) and v != 'fim':
                tt, _ = tempo_ancora(v, idx[i], f'{quem} {campo}')
                return round(max(0.0, tt - s['t']), 3)
            return v
        if 'soco' in s:
            s['soco'] = resolve(s['soco'], 'soco')
        for campo, sub in (('cartoes', 't'), ('aviso', 't'), ('selo', 't0'), ('raiox', 't0')):
            if isinstance(s.get(campo), dict) and sub in s[campo]:
                s[campo][sub] = resolve(s[campo][sub], f'{campo}.{sub}')
        for e in s.get('sfx', []):
            if 't' in e:
                e['t'] = resolve(e['t'], 'sfx')
        for campo in ('raiox', 'selo'):
            if isinstance(s.get(campo), dict):
                t1 = s[campo].get('t1', 'fim')
                if t1 == 'fim' or float(t1) > s['dur']:
                    s[campo]['t1'] = round(s['dur'] - 0.05, 3)
        # velocidade do clipe: cabe inteiro no plano (nunca acelera; no mínimo 0,25x)
        fx = s.get('fx', [])
        clip = os.path.join(EP, arqs[s['plano']]) if s['plano'] in arqs else os.path.join(EP, 'h3', 'clips60', f'{s["plano"]}.mp4')
        if os.path.exists(clip) and 'congela' not in fx:
            d = dur_arquivo(clip)
            if d:
                resto = d - float(s.get('ini', 0)) - 0.05
                s['vel'] = round(min(1.0, max(0.25, resto / max(0.1, s['dur']))), 3)
        else:
            s['vel'] = float(s.get('vel', 1.0))
    E.update(fonte='voz real', total=total, segmentos=S, voz='voz/voz.wav',
             palavras=[[round(p['t'], 3), p['w']] for p in PAL])
    E.pop('ep', None)
    json.dump(E, open(os.path.join(EP, 'linha_voz.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    print(f'voz {T:.2f} s · vídeo {total:.2f} s · {len(S)} planos · {len(PAL)} palavras')
    for i, s in enumerate(S):
        nota = '  (longo: risco de parado)' if s['dur'] > 5 else ('  (curto)' if s['dur'] < 0.8 else '')
        print(f'  #{i:<2} {s["plano"]:<8} t={s["t"]:6.2f}  dur={s["dur"]:5.2f}  vel={s.get("vel", 1.0):.2f}{nota}')
    print('ok', os.path.join(EP, 'linha_voz.json'))


if __name__ == '__main__':
    main()
