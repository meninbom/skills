"""Mix do piloto: voz na frente + poucos efeitos nos buracos da fala, alinhados pelo ATAQUE ou pelo pico. Sem trilha.
Os efeitos NÃO vêm no pacote: aponte a variável SFX_DIR (ou o 1º argumento) para a sua biblioteca, ou um pack CC0,
e troque os nomes de arquivo da lista SFX pelos seus (sopros de ar diferentes e dois pops bastam).
Antes: normalize a voz para -16 LUFS (ffmpeg loudnorm) e salve como narr_-16.wav ao lado deste arquivo.
uso: python mix.py [PASTA_DOS_EFEITOS]  ->  mix_v1.wav (48 kHz estéreo, -14 LUFS)"""
import subprocess, sys, os
import numpy as np, soundfile as sf
D = os.path.dirname(os.path.abspath(__file__))
P = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('SFX_DIR', os.path.join(D, 'sfx'))
VOZ = os.path.join(D, 'narr_-16.wav')
SR = 48000; DUR = 72.0
def le(f):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
# (arquivo dentro da pasta de efeitos, tempo-alvo na voz, 'pico' ou 'ataque', pico em dBFS)
SFX = [
    ('sopro_leve_1.wav', 11.30, 'pico', -20),     # câmera abre pra Tordesilhas
    ('sopro_escuro.wav', 23.45, 'pico', -19),     # mergulho na serra
    ('pop_bolha.wav', 32.05, 'ataque', -18),      # nasce a gota
    ('sopro_rapido.wav', 40.52, 'pico', -20),     # voo pro Nordeste
    ('sopro_leve_2.wav', 51.15, 'pico', -21),     # vai pra Minas
    ('pop_suave.wav', 57.90, 'ataque', -18),      # Brasília aparece
    ('sopro_onda.wav', 67.95, 'pico', -19),       # Grande SP decola
]
if not os.path.exists(VOZ): sys.exit('falta a voz: ' + VOZ)
faltam = [f for f, *_ in SFX if not os.path.exists(os.path.join(P, f))]
if faltam: sys.exit('efeitos não encontrados em ' + P + ': ' + ', '.join(faltam))
mix = np.zeros((int(DUR * SR), 2), np.float32)
voz = le(VOZ); mix[:len(voz)] += voz[:len(mix)]
vpk = 20 * np.log10(np.abs(voz).max())
for f, t, modo, db in SFX:
    a = le(os.path.join(P, f)); env = np.abs(a).max(1); pk = env.max(); ipk = int(env.argmax())
    iat = int(np.argmax(env > pk * 10 ** (-30 / 20)))   # 1ª amostra a -30 dB do pico = ataque real
    ref = ipk if modo == 'pico' else iat
    a *= 10 ** (db / 20) / pk; i0 = int(t * SR) - ref
    if i0 < 0: a = a[-i0:]; i0 = 0
    a = a[:len(mix) - i0]; mix[i0:i0 + len(a)] += a
    print(f"{f:24s} alvo {t:6.2f}s  começa {i0 / SR:6.2f}s  dura {len(a) / SR:.2f}s  pico {db} dBFS (voz {vpk:.1f})")
sf.write(os.path.join(D, 'mix_pre.wav'), mix, SR)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(D, 'mix_pre.wav'), '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:linear=true', '-ar', '48000', os.path.join(D, 'mix_v1.wav')], check=True)
print('ok mix_v1.wav')
