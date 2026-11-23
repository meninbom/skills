"""mixar: o som do ep e a entrega. Voz na frente; trilha opcional por baixo; SFX amarrados a eventos da tela.

uso: python mixar.py <linha.json> <saida_base>
Lê <saida_base>_mudo.mp4 (do montar.py) e a voz da linha ("voz", relativa à pasta do ep).
Grava <saida_base>.mp4 (HD, pra postar) e <saida_base>_celular.mp4 (720x1280, prévia). yuv420p, AAC 48 kHz, -14 LUFS, pico <= -1 dBTP.

Do kit.config.json:
  trilha.arquivo / trilha.db   música opcional (padrão -18 dB); abaixa sozinha quando a voz fala
  sfx.mapa.<nome>              o arquivo de cada SFX (golpe, subida, troca, ...)
SFX por segmento: lista "sfx": [{"nome": "golpe", "t": 1.2, "db": -6, "alinha": "ataque"|"ini"|"fim", "corte": 0.8}]
  + implícitos: soco -> golpe (pelo ataque) · cartoes -> subida (termina quando os cartões entram) · flash_entrada -> troca.
  Arquivo que falta = pula com aviso (o vídeo sai só com a voz).
  Alinhado pelo ATAQUE (não pelo pico). golpe e troca: cauda cortada em 1,0 s depois do ataque, com fade.
Ajustes do ciclo por segmento: abafa_db (baixa trilha+SFX naquele trecho) e ganho_db (volume do trecho todo).

Master (medido num episódio de teste: compressor 4:1 + EQ + loudnorm de 1 passada na mix inteira deixou o LRA em 3,8 LU,
achatou todo golpe no nível da fala e tirou o grave do estrondo):
  - 3 barramentos: voz | trilha (só ela abaixa sob a voz) | SFX (soma direta, sem compressor e sem EQ);
  - nada de reforço de agudo nem corte de grave no master;
  - nível = ganho FIXO calculado (mede o LUFS integrado numa 1ª passada e aplica o que falta pra -14)
    + alimiter só como teto de pico. O print final mostra LUFS, pico e LRA.
"""
import sys as _sys_utf8
for _s in (_sys_utf8.stdout, _sys_utf8.stderr):   # acento certo no terminal do Windows, inclusive nas mensagens de erro
    try: _s.reconfigure(encoding='utf-8')
    except Exception: pass
import os, sys, json, re, subprocess
import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, AQUI)
import kitcfg  # noqa: E402

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
FF = kitcfg.get('ferramentas.ffmpeg', 'ffmpeg'); FP = kitcfg.get('ferramentas.ffprobe', 'ffprobe')
ALVO_LUFS, ALVO_TP = -14.0, -1.5          # teto do limitador = ALVO_TP - 0,5 (folga pro AAC)
CORTE_PADRAO = {'golpe': 1.0, 'troca': 1.0}   # cauda curta depois do ataque (s); "corte" no sfx da linha manda mais

if len(sys.argv) < 3:
    raise SystemExit(__doc__)
LINHA_ARQ = os.path.abspath(sys.argv[1]); B = sys.argv[2]
L = json.load(open(LINHA_ARQ, encoding='utf-8'))
EP = L['ep'] if L.get('ep') and os.path.isdir(L['ep']) else os.path.dirname(LINHA_ARQ)
S = L['segmentos']; TOT = float(L['total'])
try:
    SERIE = kitcfg.pasta_serie() if kitcfg.acha() else os.path.dirname(EP)
except SystemExit:
    SERIE = os.path.dirname(EP)


def aviso(msg): print('aviso:', msg, flush=True)


def caminho(p, base):
    return p if os.path.isabs(p) else os.path.join(base, p)


def dur(f):
    return float(subprocess.check_output([FP, '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).strip())


def ataque_audio(arq, a=None, b=None, sr=8000):
    """1º ponto acima de 30% do envelope (com 30 ms de folga antes); a/b = janela em segundos."""
    cmd = [FF, '-v', 'error']
    if a is not None: cmd += ['-ss', str(a), '-to', str(b)]
    cmd += ['-i', arq, '-ac', '1', '-ar', str(sr), '-f', 's16le', '-']
    x = np.abs(np.frombuffer(subprocess.check_output(cmd), np.int16).astype(np.float32))
    w = sr // 200; env = np.array([x[i:i + w].max() for i in range(0, len(x) - w, w)])
    if not len(env) or env.max() == 0: return a or 0.0
    # na janela, o golpe é o maior SALTO de energia (não a voz que já vinha alta)
    sm = np.convolve(env, np.ones(3) / 3, 'same'); salto = sm[4:] - sm[:-4]
    if a is not None:
        k = int(np.argmax(salto)); base = sm[max(0, k - 4)]; alvo = base + 0.3 * (sm[k:k + 40].max() - base)
        i = k + int(np.argmax(sm[k:k + 40] >= alvo))
    else:
        i = int(np.argmax(env >= 0.3 * env.max()))
    return (a or 0.0) + max(0, i * w / sr - 0.03)


_sfx, _faltou = {}, set()
def arq_sfx(nome):
    if nome in _sfx: return _sfx[nome]
    p = kitcfg.get(f'sfx.mapa.{nome}')
    if not p:
        if nome not in _faltou: aviso(f'sem arquivo pro SFX "{nome}" (sfx.mapa.{nome} no kit.config.json): pulado.'); _faltou.add(nome)
        _sfx[nome] = None; return None
    p = caminho(p, SERIE)
    if not os.path.exists(p):
        if nome not in _faltou: aviso(f'SFX "{nome}" aponta pra "{p}", que não existe: pulado.'); _faltou.add(nome)
        p = None
    _sfx[nome] = p; return p


def t_cartoes(s):
    c = s['cartoes']; return float(c.get('t', 0)) if isinstance(c, dict) else float(c)


# ---------- eventos de som (nome, tempo no vídeo, dB, alinhamento, corte)
EV = []
for s in S:
    t = float(s['t']); fx = s.get('fx', []); expl = s.get('sfx', [])
    for e in expl:
        EV.append((e['nome'], t + float(e.get('t', 0)), float(e.get('db', -8)), e.get('alinha', 'ataque'), e.get('corte')))

    def ja_tem(nome, tt):
        return any(e['nome'] == nome and abs(t + float(e.get('t', 0)) - tt) < 0.15 for e in expl)
    if 'soco' in s and not ja_tem('golpe', t + float(s['soco'])): EV.append(('golpe', t + float(s['soco']), -6, 'ataque', None))
    if 'cartoes' in s and not ja_tem('subida', t + t_cartoes(s)): EV.append(('subida', t + t_cartoes(s), -10, 'fim', None))
    if ('flash_entrada' in fx or s.get('flash_entrada')) and not ja_tem('troca', t): EV.append(('troca', t, -7, 'ataque', None))
PAL = L.get('palavras', [])
for nome, te, *_ in EV:      # o BUM não cai em cima de palavra
    if nome == 'golpe':
        em_cima = [w for tw, w in PAL if te - 0.05 <= tw <= te + 0.2]
        if em_cima: aviso(f'golpe em {te:.2f} s cai em cima da palavra "{em_cima[0]}" (melhor depois da palavra).')


# ---------- barramentos: voz | trilha (abaixa sob a voz) | SFX (sem compressor) -> master = ganho fixo + teto de pico
ins, fil, k = [], [], 0
trilha = kitcfg.get('trilha.arquivo')
if trilha:
    trilha = caminho(trilha, SERIE)
    if not os.path.exists(trilha): aviso(f'trilha "{trilha}" não existe: sem trilha.'); trilha = None
if trilha:
    db = float(kitcfg.get('trilha.db', -18))
    ins += ['-stream_loop', '-1', '-i', trilha]
    fil.append(f'[{k}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{TOT:.3f},asetpts=PTS-STARTPTS,'
               f'afade=t=in:d=0.6,afade=t=out:st={max(0.0, TOT - 1.5):.3f}:d=1.5,volume={db}dB[mu]'); k += 1
sfx, n_sfx = [], 0
for j, (nome, t, g, modo, corte) in enumerate(EV):
    f = arq_sfx(nome)
    if not f or t >= TOT: continue
    at = ataque_audio(f) if modo == 'ataque' else 0.0
    off = t - at if modo == 'ataque' else (t - dur(f) if modo == 'fim' else t)
    corte = corte if corte is not None else CORTE_PADRAO.get(nome)
    pula = max(0.0, -off)                                    # começo do arquivo que fica de fora (som que começaria antes do 0)
    fim_rel = (at + float(corte) - pula) if corte else None  # o corte conta a partir do ATAQUE
    if fim_rel is not None and fim_rel <= 0.05: continue
    cut = f',atrim=0:{fim_rel:.3f},afade=t=out:st={max(0.0, fim_rel - 0.35):.3f}:d=0.35' if fim_rel else ''
    ms = int(max(0.0, off) * 1000)
    ins += (['-ss', f'{pula:.3f}'] if pula else []) + ['-i', f]
    fil.append(f'[{k}:a]aresample=48000,aformat=channel_layouts=stereo{cut},volume={g}dB,adelay={ms}|{ms}[s{j}]')
    sfx.append(f'[s{j}]'); k += 1; n_sfx += 1
voz = caminho(L['voz'], EP) if L.get('voz') else None
if voz and not os.path.exists(voz): aviso(f'voz "{voz}" não existe: vídeo sem voz (animatic).'); voz = None
if voz:
    ins += ['-i', voz]
    fil.append(f'[{k}:a]aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur={TOT:.3f},atrim=0:{TOT:.3f}[vz0]'); k += 1


def expr(campo):
    e = '1'
    for s_ in S:
        if s_.get(campo):
            e = f"if(between(t,{float(s_['t']):.3f},{float(s_['t']) + float(s_['dur']):.3f}),{10 ** (float(s_[campo]) / 20):.4f},{e})"
    return e


ABAFA = f",volume='{expr('abafa_db')}':eval=frame" if any(s_.get('abafa_db') for s_ in S) else ''
barras = []
if voz and trilha:      # só a trilha abaixa quando a voz fala (sidechain); SFX não
    fil.append('[vz0]asplit=2[vz][vzk]')
    fil.append(f'[mu][vzk]sidechaincompress=threshold=0.02:ratio=6:attack=15:release=400{ABAFA}[mub]'); barras += ['[vz]', '[mub]']
elif voz:
    barras.append('[vz0]')
elif trilha:
    fil.append(f'[mu]anull{ABAFA}[mub]'); barras.append('[mub]')
if sfx:                 # barramento de SFX: soma direta, sem compressor, sem EQ (o golpe fica acima da cena)
    m = (''.join(sfx) + f'amix=inputs={len(sfx)}:normalize=0') if len(sfx) > 1 else (sfx[0] + 'anull')
    fil.append(m + f',apad=whole_dur={TOT:.3f},atrim=0:{TOT:.3f}{ABAFA}[sfxb]'); barras.append('[sfxb]')
if not barras:
    ins += ['-f', 'lavfi', '-t', f'{TOT:.3f}', '-i', 'anullsrc=r=48000:cl=stereo']; barras.append(f'[{k}:a]'); k += 1
MIX = (''.join(barras) + f'amix=inputs={len(barras)}:normalize=0' if len(barras) > 1 else barras[0] + 'anull') + f',atrim=0:{TOT:.3f}'
if any(s_.get('ganho_db') for s_ in S): MIX += f",volume='{expr('ganho_db')}':eval=frame"
n_in = ins.count('-i')
MUDO = f'{B}_mudo.mp4'
if not os.path.exists(MUDO): raise SystemExit(f'mixar: falta {MUDO} (rode o montar.py antes).')


def roda(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode != 0: raise SystemExit(f'mixar: ffmpeg falhou:\n{r.stderr[-1500:]}')
    return r.stderr


def le_ebur(t):
    I = re.findall(r'^\s+I:\s+(-?[\d.]+) LUFS', t, re.M); LRA = re.findall(r'^\s+LRA:\s+(-?[\d.]+) LU', t, re.M)
    P = re.findall(r'^\s+Peak:\s+(-?[\d.]+|-inf) dBFS', t, re.M)
    f = lambda v: float(v[-1]) if v and v[-1] != '-inf' else None
    return f(I), f(LRA), f(P)


def mede(arq):
    return le_ebur(roda([FF, '-hide_banner', '-nostats', '-i', arq, '-map', '0:a:0', '-af', 'ebur128=peak=true', '-f', 'null', '-']))


# passo 1: mede o LUFS integrado da mix crua
I0, _, _ = le_ebur(roda([FF, '-hide_banner', '-nostats', *ins, '-filter_complex', ';'.join(fil + [MIX + ',ebur128=peak=true[a]']),
                         '-map', '[a]', '-t', f'{TOT:.3f}', '-f', 'null', '-']))
if I0 is None: raise SystemExit('mixar: não consegui medir o volume da mix (está muda?).')
# passo 2: ganho fixo que leva a -14 + limitador só como teto de pico; confere e corrige até 3 vezes
ganho, teto = ALVO_LUFS - I0, ALVO_TP - 0.5
for tentativa in range(3):
    graf = ';'.join(fil + [MIX + f',volume={ganho:.2f}dB,alimiter=limit={10 ** (teto / 20):.4f}:attack=1:release=60:level=false,'
                                 'aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[a]'])
    roda([FF, '-y', '-hide_banner', '-nostats', *ins, '-i', MUDO, '-filter_complex', graf, '-map', f'{n_in}:v', '-map', '[a]',
          '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', f'{TOT:.3f}', '-movflags', '+faststart', f'{B}.mp4'])
    I, LRA, TP = mede(f'{B}.mp4')
    ok_I = I is not None and abs(I - ALVO_LUFS) <= 0.5; ok_TP = TP is None or TP <= -1.0
    if ok_I and ok_TP: break
    if not ok_I: ganho += ALVO_LUFS - I
    if not ok_TP: teto -= 0.5
roda([FF, '-y', '-hide_banner', '-nostats', '-i', f'{B}.mp4', '-vf', 'scale=720:1280:flags=lanczos', '-c:v', 'libx264', '-crf', '26',
      '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', f'{B}_celular.mp4'])
print(f'ok {B}.mp4 · {"com voz" if voz else "SEM VOZ"} · trilha {"sim" if trilha else "não"} · {n_sfx}/{len(EV)} SFX · '
      f'{I} LUFS · pico {TP} dBTP · LRA {LRA} LU · ganho {ganho:+.1f} dB')
if TP is not None and TP > -1.0: aviso(f'pico {TP} dBTP acima de -1.')
if I is not None and abs(I - ALVO_LUFS) > 1.0: aviso(f'{I} LUFS fora de -14 ±1 (muito pico de SFX segurando o ganho?).')
