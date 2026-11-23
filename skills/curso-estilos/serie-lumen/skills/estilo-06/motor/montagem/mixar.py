"""Som de um episódio no estilo LUMEN. Os eventos saem dos próprios efeitos da linha do tempo:
ao_contrario -> rebobinar (glitch) · pula -> glitch mecânico · frio -> tudo congela (e a trilha MORRE aqui) ·
flash_entrada -> brilho da troca · monitor -> bip espaçando conforme o BPM · soco -> golpe alinhado pelo ATAQUE ·
raiox -> coração batendo no BPM · sonar -> gota/grave por anel · holo -> bip de holograma · cartoes/continua -> subida que termina ali.
Trilha só se a linha tiver 'trilha': entra no rebobinar e é cortada seca no congelamento.
Se existir a voz (linha['voz'], caminho relativo à pasta do episódio, já na linha do tempo do vídeo), ela vai na frente.

Os sons NÃO vêm no pacote (biblioteca de efeitos não se redistribui). Ponha os seus em <ep>/sons/ (ou aponte SFX_DIR)
com estes nomes, em .wav ou .mp3: rebobina, glitch, congela, troca, golpe, subida, bip, holo, vento, coracao, passaros,
zumbido, pum, gota, folha, trilha. Som que faltar é pulado com aviso. Servem a sua biblioteca ou um pack CC0.

uso: python mixar.py <ep>/linha.json <base_do_video> [--ep <pasta do episódio, se a linha estiver em outro lugar>]
       (lê <base>_mudo.mp4; grava <base>.mp4 e <base>_celular.mp4)
"""
import os, sys, json, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comum import ataque_audio  # noqa: E402
if len(sys.argv) < 3: raise SystemExit(__doc__)
EP = os.path.abspath(sys.argv[sys.argv.index('--ep') + 1]) if '--ep' in sys.argv else os.path.dirname(os.path.abspath(sys.argv[1]))
L = json.load(open(sys.argv[1], encoding='utf-8')); B = sys.argv[2]
S = L['segmentos']; TOT = L['total']
SONS = os.environ.get('SFX_DIR') or os.path.join(EP, 'sons')
NOMES = ('rebobina glitch congela troca golpe subida bip holo vento coracao passaros zumbido pum gota folha trilha').split()
SFX = {n: next((a for a in (os.path.join(SONS, n + e) for e in ('.wav', '.mp3', '.ogg', '.flac')) if os.path.exists(a)), None) for n in NOMES}
_falta = [n for n in NOMES if not SFX[n]]
if _falta: print('aviso: sem estes sons em', SONS, '->', ', '.join(_falta), '(eventos pulados)')
KOTO = SFX['trilha']
dur = lambda f: float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]))
ev = []
for s in S:
    fx = s.get('fx', []); t = s['t']
    if 'ao_contrario' in fx: ev.append(('rebobina', t, -6, 'ini', 1.2))
    if 'pula' in fx: ev.append(('glitch', t + 0.3, -15, 'ini', 2.0))
    if s.get('flash_entrada'): ev.append(('troca', t, -7, 'ataque', None))
    if 'soco' in s and not s.get('estalo'): ev.append(('golpe', t + s['soco'], -6, 'ataque', None))
    if s.get('estalo'): ev.append(('glitch', t + s.get('soco', 0), -9, 'ini', 0.35)); ev.append(('folha', t + s.get('soco', 0) - 0.15, -14, 'ini', 0.6))
    if 'raiox' in s:            # coração: um lub-dub por batida, espaçando
        r0, r1, hx, hy, b0, b1 = s['raiox']; tt = t + r0 + 0.2
        while tt < t + r1:
            u = min(1, max(0, (tt - t - r0) / max(0.1, r1 - r0))); bpm = b0 + (b1 - b0) * u
            ev.append(('coracao', tt, -4, 'batida', None)); tt += 60.0 / bpm
    for an in s.get('sonar', []):
        t0, cx, cy, vel, rmax, forca = an[:6]; tudo = len(an) > 6 and an[6]
        if tudo: ev.append(('pum', t + t0, -9, 'ataque', None)); ev.append(('gota', t + t0, -3, 'ataque', None))
        elif vel < 400: ev.append(('gota', t + t0, -16, 'ataque', None))
        else: ev.append(('pum', t + t0, -18, 'ataque', 1.2)); ev.append(('gota', t + t0, -14, 'ataque', None))
    if 'bicho' in s: ev.append(('holo', t + s['bicho'][0], -18, 'ini', 1.0))
    if 'passos' in s: ev.append(('folha', t, -15, 'ini', s['dur']))   # rato andando nas folhas; o corte (0,15 s) cai quando ele para
    if 'holo' in s: ev.append(('holo', t + s['holo'][0], -16, 'ini', 1.0))
    if 'monitor' in s:          # bip espaçando: intervalo = 60/bpm
        m0, m1, b0, b1 = s['monitor']; tt = t + m0
        while tt < t + m1 + 0.3:
            u = min(1, max(0, (tt - t - m0) / max(0.1, m1 - m0))); bpm = b0 + (b1 - b0) * u
            ev.append(('bip', tt, -14, 'ini', 0.35)); tt += 60.0 / bpm * 1.0
    if 'cartoes' in s: ev.append(('subida', t + s['cartoes'], -10, 'fim', None))
    if 'continua' in s: ev.append(('subida', t + s['continua'], -10, 'fim', None))
ins, fil, nomes = [], [], []; k = 0
# camas de fundo
i_reb = next((i for i, s in enumerate(S) if 'ao_contrario' in s.get('fx', [])), None)
i_frio = next((i for i, s in enumerate(S) if 'frio' in s.get('fx', [])), None)
t_reb = S[i_reb]['t'] if i_reb is not None else None; t_morre = S[i_frio]['t'] if i_frio is not None else None
if KOTO and L.get('trilha') and t_reb is not None and t_morre is not None:
    vol_z = f"volume='if(between(t,{t_reb:.2f},{t_morre + 1.2:.2f}),0,1)':eval=frame"
else:
    vol_z = 'volume=1'
if SFX['zumbido']:                                           # zumbido baixo (tensão), some quando a trilha entra
    ins += ['-stream_loop', '-1', '-i', SFX['zumbido']]
    fil.append(f'[{k}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{TOT},{vol_z},volume=-27dB[z]'); nomes.append('[z]'); k += 1
else:                                                        # sem nenhum som: uma cama de silêncio pra o mix não quebrar
    ins += ['-f', 'lavfi', '-t', f'{TOT}', '-i', 'anullsrc=r=48000:cl=stereo']
    fil.append(f'[{k}:a]anull[z]'); nomes.append('[z]'); k += 1
if KOTO and L.get('trilha') and t_reb is not None and t_morre is not None:
    dv = t_morre - t_reb
    for nome_c, arq, ss, g in [('pa', SFX['passaros'], 0, -20), ('ve', SFX['vento'], 0, -22), ('mu', KOTO, L.get('trilha_ini', 0), (-14 if L.get('voz') else -8))]:
        if not arq: continue
        ins += (['-ss', str(ss), '-i', arq] if arq == KOTO else ['-stream_loop', '-1', '-ss', str(ss), '-i', arq])
        # entra com o glitch do rebobinar e é CORTADO SECO (10 ms) no congelamento
        fil.append(f'[{k}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{dv:.3f},afade=t=in:d=0.25,afade=t=out:st={dv - 0.01:.3f}:d=0.01,volume={g}dB,adelay={int(t_reb*1000)}|{int(t_reb*1000)}[{nome_c}]')
        nomes.append(f'[{nome_c}]'); k += 1
for j, (nome, t, g, modo, corte) in enumerate(ev):
    f = SFX[nome]
    if not f: continue
    if modo == 'batida':
        ins += ['-ss', '0.62', '-t', '0.9', '-i', f]
        fil.append(f'[{k}:a]aresample=48000,aformat=channel_layouts=stereo,afade=t=out:st=0.7:d=0.2,volume={g}dB,adelay={int(t*1000)}|{int(t*1000)}[s{j}]')
        nomes.append(f'[s{j}]'); k += 1; continue
    off = t - ataque_audio(f) if modo == 'ataque' else (t - dur(f) if modo == 'fim' else t)
    cut = f',atrim=0:{corte},afade=t=out:st={max(0, corte - 0.15)}:d=0.15' if corte else ''
    if off >= 0:
        ins += ['-i', f]; fil.append(f'[{k}:a]aresample=48000,aformat=channel_layouts=stereo{cut},volume={g}dB,adelay={int(off*1000)}|{int(off*1000)}[s{j}]')
    else:
        ins += ['-ss', f'{-off:.3f}', '-i', f]; fil.append(f'[{k}:a]aresample=48000,aformat=channel_layouts=stereo{cut},volume={g}dB[s{j}]')
    nomes.append(f'[s{j}]'); k += 1
if L.get('voz') and os.path.exists(os.path.join(EP, L['voz'])):
    ins += ['-i', os.path.join(EP, L['voz'])]; fil.append(f'[{k}:a]aresample=48000,aformat=channel_layouts=stereo,volume=2dB[vz]'); k += 1; tem_voz = True
else:
    tem_voz = False
# (ciclo) ajustes por segmento: abafa_db = baixa trilha/SFX debaixo da voz naquele trecho; ganho_db = volume do trecho inteiro
def _expr(campo):
    e = '1'
    for s_ in S:
        if s_.get(campo): e = f"if(between(t,{s_['t']:.3f},{s_['t'] + s_['dur']:.3f}),{10 ** (s_[campo] / 20):.4f},{e})"
    return e
mix = ''.join(nomes) + f'amix=inputs={len(nomes)}:normalize=0,atrim=0:{TOT}'
if any(s_.get('abafa_db') for s_ in S): mix += f",volume='{_expr('abafa_db')}':eval=frame"
mix += '[fundo];'
mix += ('[fundo][vz]amix=inputs=2:normalize=0,' if tem_voz else '[fundo]anull,')
if any(s_.get('ganho_db') for s_ in S): mix += f"volume='{_expr('ganho_db')}':eval=frame,"
mix += ('highpass=f=70,equalizer=f=110:t=q:w=1:g=-5,equalizer=f=1000:t=q:w=1:g=5,equalizer=f=2600:t=q:w=1.2:g=7,acompressor=threshold=-24dB:ratio=4:attack=6:release=180:makeup=5,'
        'alimiter=limit=0.85,loudnorm=I=-14:TP=-2:LRA=9,alimiter=limit=0.84:level=false,aformat=sample_rates=48000:channel_layouts=stereo[a]')
n_in = ins.count('-i')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *ins, '-i', f'{B}_mudo.mp4', '-filter_complex', ';'.join(fil) + ';' + mix,
                '-map', f'{n_in}:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', f'{TOT}',
                '-movflags', '+faststart', f'{B}.mp4'], check=True)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{B}.mp4', '-vf', 'scale=720:1280', '-c:v', 'libx264', '-crf', '27', '-preset', 'slow',
                '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', f'{B}_celular.mp4'], check=True)
print('ok', B, 'com voz' if tem_voz else 'SEM VOZ (animatic)', len(ev), 'eventos')
