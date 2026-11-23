"""fazer_ep_teste: cria um episódio de TESTE pra provar o ciclo, sem GPU e sem gasto nenhum.

uso: python fazer_ep_teste.py <pasta_da_serie> [--ep ep01] [--com-config]
Cria em <pasta_da_serie>/<ep>/:
  gpt/P01..P06.png          placas 1080x1920 feitas com PIL (cores + textura + o nome do plano)
  h3/clips60/P04.mp4        um "clipe" de 60 qps feito com ffmpeg a partir da placa (testa o caminho do clipe)
  voz/falas.tsv             6 linhas (narrador, uma fala, uma PAUSA)
  voz/pecas/*_-16.wav       "voz" sintética (tom com envelope, 48 kHz) + *.words.json coerentes (formato da ElevenLabs)
  voz/escolha.json          F1 usa a tomada B (o resto, A)
  voz/OK_GASTO_VOZ.txt       ok de TESTE (não vale pra voz de verdade)
  linha_estimada.json       planos com aviso, raiox, selo, soco, cartoes, loop e um sfx
  revisao/veredito.json     revisor aprovando tudo
E em <pasta_da_serie>/_teste_audio/: golpe, subida, troca e trilha sintéticos (pra testar SFX e trilha).
--com-config: grava um kit.config.json mínimo na pasta (só se não existir), com os SFX e a trilha de teste.
Depois:  python <skill>/scripts/linha_voz.py <ep>   e   python <skill>/scripts/ciclo.py --ep <ep> --nome teste --sem-h3 --sem-stt
"""
import sys as _sys_utf8
for _s in (_sys_utf8.stdout, _sys_utf8.stderr):   # acento certo no terminal do Windows, inclusive nas mensagens de erro
    try: _s.reconfigure(encoding='utf-8')
    except Exception: pass
import os, sys, json, math, wave, argparse, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(AQUI, '..', 'scripts'))
import kitcfg  # noqa: E402

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
SR = 48000
W, H = 1080, 1920

PLANOS = [
    ('P01', 'o lobo na beira do rio', ((18, 40, 70), (70, 120, 150), (230, 190, 120))),
    ('P02', 'o rastro na lama', ((40, 30, 20), (120, 90, 60), (220, 210, 170))),
    ('P03', 'o ouvido do lobo', ((10, 30, 40), (40, 110, 120), (200, 240, 230))),
    ('P04', 'a cabeça vira', ((50, 15, 20), (140, 60, 50), (250, 200, 150))),
    ('P05', 'os olhos no escuro', ((8, 10, 25), (40, 50, 110), (180, 200, 255))),
    ('P06', 'a escolha', ((30, 20, 40), (110, 70, 120), (250, 220, 170))),
]
FALAS = [
    ('N1', 'narrador', '0.45 0.25 1.0', 'O lobo parou na beira do rio e farejou o vento frio.', 210),
    ('N2', 'narrador', '0.45 0.25 1.0', 'Ninguém tinha visto aquele rastro antes desta noite.', 210),
    ('P1', 'PAUSA', '-', '0.8', 0),
    ('F1', 'personagem1', '0.5 0.3 1.0', 'Fica parado. Ele ouve tudo.', 300),
    ('N3', 'narrador', '0.45 0.25 1.0', 'E o lobo virou a cabeça devagar. Os olhos dele brilharam no escuro, bem na sua direção.', 210),
    ('N4', 'narrador', '0.45 0.25 1.0', 'Atira agora, ou fica parado e espera?', 210),
]
LINHA = {
    "fps": 30, "w": 1080, "h": 1920, "voz": "voz/voz.wav", "cauda": 2.0,
    "segmentos": [
        {"plano": "P01", "ancora": "O lobo parou", "selo": {"t0": 0.2, "t1": 2.4, "texto": "VOCÊS VOTARAM 1 · SEGUIR O RASTRO"}},
        {"plano": "P02", "ancora": "Ninguém tinha visto", "aviso": {"t": 0.3, "dur": 1.8, "texto": "◆ FARO AGUÇADO · ATIVO"},
         "sfx": [{"nome": "vento", "t": 0.0, "db": -16, "alinha": "ini", "corte": 2.5}]},
        {"plano": "P03", "ancora": "#P1", "raiox": {"t0": 0.15, "t1": "fim", "titulo": "RAIO-X",
                                                    "linhas": ["Lobo ouve até 10 km", "16× mais longe que você"], "cx": 540, "cy": 760}},
        {"plano": "P04", "ancora": "E o lobo virou", "soco": "cabeça", "fx": ["flash_entrada"]},
        {"plano": "P05", "ancora": "Os olhos dele", "fx": ["frio"]},
        {"plano": "P06", "ancora": "Atira agora",
         "cartoes": {"t": 1.0, "op1": ["1 · ATIRA", "e vira ALVO"], "op2": ["2 · FICA PARADO", "e o lobo some"], "chamada": "COMENTA 1 OU 2"},
         "loop": 0.5},
    ]}


def fonte(px):
    f = kitcfg.get('ferramentas.fonte')
    if f and os.path.isfile(f):
        return ImageFont.truetype(f, px)
    try:
        return ImageFont.load_default(size=px)
    except TypeError:
        return ImageFont.load_default()


def placa(nome, desc, cores, arq, seed):
    g = np.random.default_rng(seed)
    y = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
    c0, c1, c2 = (np.array(c, np.float32) for c in cores)
    fundo = np.where(y < 0.6, c0 + (c1 - c0) * (y / 0.6), c1 + (c2 - c1) * ((y - 0.6) / 0.4))
    a = np.repeat(fundo, W, axis=1)
    a += g.normal(0, 10, (H // 4, W // 4, 1)).repeat(4, 0).repeat(4, 1)          # textura grossa (dá o que medir no movimento)
    im = Image.fromarray(a.clip(0, 255).astype(np.uint8)); d = ImageDraw.Draw(im, 'RGBA')
    for _ in range(70):      # formas soltas: "cenário"
        x, yy, r = int(g.integers(0, W)), int(g.integers(0, H)), int(g.integers(20, 160))
        cor = tuple(int(v) for v in (c2 * g.uniform(0.4, 1.1)).clip(0, 255)) + (int(g.integers(40, 120)),)
        (d.ellipse if g.random() < 0.6 else d.rectangle)((x - r, yy - r, x + r, yy + r), fill=cor)
    for k in range(0, W + H, 90):    # listras diagonais
        d.line((k, 0, k - H, H), fill=(255, 255, 255, 22), width=14)
    d.rounded_rectangle((170, 760, 910, 1080), 40, fill=(0, 0, 0, 120))
    d.text((W / 2, 870), nome, font=fonte(150), fill=(255, 255, 255, 255), anchor='mm')
    d.text((W / 2, 1000), desc, font=fonte(48), fill=(240, 230, 210, 255), anchor='mm')
    im.save(arq)


def voz_sintetica(texto, f0, seed):
    """'voz' de teste: um tom com harmônicos e envelope por palavra (não é fala; serve pra medir tempo e volume)"""
    g = np.random.default_rng(seed); partes, words = [], []
    t = 0.12; partes.append(np.zeros(int(t * SR), np.float32))
    for w in texto.split():
        letras = sum(c.isalnum() for c in w); d = 0.09 + 0.055 * letras
        n = int(d * SR); tt = np.arange(n) / SR
        f = f0 * (1 + 0.04 * np.sin(2 * math.pi * 5 * tt) + g.uniform(-0.05, 0.05))
        fase = 2 * math.pi * np.cumsum(f) / SR
        x = sum((1.0 / h) * (2.4 if 500 < f0 * h < 3500 else 1.0) * np.sin(h * fase) for h in range(1, 18))   # energia na faixa do celular
        x = x + 0.08 * g.standard_normal(n)
        env = np.minimum(1, tt / 0.02) * np.minimum(1, (d - tt) / 0.04) * (0.8 + 0.2 * np.sin(math.pi * tt / d))
        partes.append((x * env * 0.12).astype(np.float32)); words.append(dict(w=w, start=round(t, 3), end=round(t + d, 3)))
        t += d
        pausa = 0.07 + (0.2 if w[-1] in ',.?!' else 0)
        partes.append(np.zeros(int(pausa * SR), np.float32)); t += pausa
    partes.append(np.zeros(int(0.3 * SR), np.float32))
    return np.concatenate(partes), words


def grava_wav(arq, x):
    x = np.clip(x, -1, 1)
    if x.ndim == 1: x = x[:, None]
    with wave.open(arq, 'wb') as f:
        f.setnchannels(x.shape[1]); f.setsampwidth(2); f.setframerate(SR)
        f.writeframes((x * 32767).astype('<i2').tobytes())


def sons_teste(pasta):
    os.makedirs(pasta, exist_ok=True); g = np.random.default_rng(3)
    t = np.arange(int(0.9 * SR)) / SR      # golpe: silêncio curto + baque grave com ruído
    golpe = np.concatenate([np.zeros(int(0.15 * SR)), (np.sin(2 * math.pi * 70 * t) * 0.9 + g.standard_normal(len(t)) * 0.3) * np.exp(-t * 7)])
    t = np.arange(int(1.6 * SR)) / SR      # subida: ruído que cresce e sobe de tom
    subida = g.standard_normal(len(t)) * (t / 1.6) ** 2 * 0.35 + np.sin(2 * math.pi * (200 + 500 * t) * t) * (t / 1.6) ** 2 * 0.25
    t = np.arange(int(0.6 * SR)) / SR      # troca: brilho curto
    troca = np.concatenate([np.zeros(int(0.05 * SR)), np.sin(2 * math.pi * 1200 * t) * np.exp(-t * 9) * 0.5])
    t = np.arange(int(24 * SR)) / SR       # trilha: acorde lento
    trilha = sum(np.sin(2 * math.pi * fr * t) * (0.5 + 0.5 * np.sin(2 * math.pi * 0.1 * t + k)) for k, fr in enumerate((110, 164.8, 220, 277.2))) * 0.12
    for nome, x in (('golpe', golpe), ('subida', subida), ('troca', troca), ('trilha', trilha)):
        grava_wav(os.path.join(pasta, f'{nome}.wav'), np.asarray(x, np.float32))


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('pasta'); ap.add_argument('--ep', default='ep01')
    ap.add_argument('--com-config', action='store_true'); a = ap.parse_args()
    SER = os.path.abspath(a.pasta); EP = os.path.join(SER, a.ep)
    if os.path.exists(os.path.join(EP, 'linha_estimada.json')):
        raise SystemExit(f'{EP} já tem um ep. Escolha outro --ep (nada é sobrescrito).')
    for p in ('gpt', 'h3/clips60', 'voz/pecas', 'revisao'):
        os.makedirs(os.path.join(EP, p), exist_ok=True)
    for k, (nome, desc, cores) in enumerate(PLANOS):
        placa(nome, desc, cores, os.path.join(EP, 'gpt', f'{nome}.png'), k + 1)
    ff = kitcfg.get('ferramentas.ffmpeg', 'ffmpeg')
    subprocess.run([ff, '-v', 'error', '-y', '-loop', '1', '-i', os.path.join(EP, 'gpt', 'P04.png'), '-t', '4', '-r', '60',
                    '-vf', "scale=900:1576,crop=768:1344:x='(in_w-out_w)/2+50*sin(t*1.6)':y='(in_h-out_h)/2-25*t'",
                    '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', os.path.join(EP, 'h3', 'clips60', 'P04.mp4')], check=True)
    with open(os.path.join(EP, 'voz', 'falas.tsv'), 'w', encoding='utf-8') as f:
        for fid, papel, par, txt, _ in FALAS: f.write(f'{fid}\t{papel}\t{par}\t{txt}\n')
    for k, (fid, papel, _, txt, f0) in enumerate(FALAS):
        if papel == 'PAUSA': continue
        for tom, df in (('A', 0), ('B', 18)) if fid == 'F1' else (('A', 0),):
            x, words = voz_sintetica(txt, f0 + df, 10 * k + len(tom))
            grava_wav(os.path.join(EP, 'voz', 'pecas', f'{fid}_{tom}_-16.wav'), x)
            json.dump(words, open(os.path.join(EP, 'voz', 'pecas', f'{fid}_{tom}.words.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    json.dump({fid: ('B' if fid == 'F1' else 'A') for fid, papel, *_ in FALAS if papel != 'PAUSA'},
              open(os.path.join(EP, 'voz', 'escolha.json'), 'w', encoding='utf-8'), indent=1)
    open(os.path.join(EP, 'voz', 'OK_GASTO_VOZ.txt'), 'w', encoding='utf-8').write('TESTE: voz sintética do exemplo, sem gasto. Não vale como ok de voz de verdade.\n')
    json.dump(LINHA, open(os.path.join(EP, 'linha_estimada.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    json.dump({"quadros": [{"n": k + 1, "nome": p[0], "arquivo": f'gpt/{p[0]}.png', "veredito": "APROVADO", "erros": [], "avisos": []}
                           for k, p in enumerate(PLANOS)]},
              open(os.path.join(EP, 'revisao', 'veredito.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    sons_teste(os.path.join(SER, '_teste_audio'))
    ta = os.path.join(SER, '_teste_audio').replace(os.sep, '/')
    cfg_serie = os.path.join(SER, 'kit.config.json')
    if os.path.exists(cfg_serie):
        # a série já tem config: grava um config de TESTE à parte (cópia + SFX e trilha de teste), sem mexer no do aluno
        c = json.load(open(cfg_serie, encoding='utf-8')); c.pop('_arquivo', None)
        c.setdefault('sfx', {})['mapa'] = {"golpe": f"{ta}/golpe.wav", "subida": f"{ta}/subida.wav", "troca": f"{ta}/troca.wav", "vento": ""}
        c['trilha'] = {"arquivo": f"{ta}/trilha.wav", "db": -20}
        c.setdefault('serie', {})['pasta'] = SER.replace(os.sep, '/')
        teste = os.path.join(SER, '_teste_audio', 'kit.config.teste.json').replace(os.sep, '/')
        json.dump(c, open(teste, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
        print('pra testar também SFX e trilha (sem mexer no seu kit.config.json), rode o ciclo com a variável:')
        print(f'  Git Bash:   export KIT_SERIE_CONFIG="{teste}"')
        print(f'  PowerShell: $env:KIT_SERIE_CONFIG="{teste}"')
    if a.com_config and not os.path.exists(cfg_serie):
        cfg = {"versao": 1, "serie": {"nome": "Teste do ciclo", "pasta": SER.replace('\\', '/')},
               "ferramentas": {"ffmpeg": "ffmpeg", "ffprobe": "ffprobe", "python": "python", "fonte": ""},
               "gpu": {"trava": "{serie}/.gpu.lock"},
               "sfx": {"mapa": {"golpe": "_teste_audio/golpe.wav", "subida": "_teste_audio/subida.wav", "troca": "_teste_audio/troca.wav", "vento": ""}},
               "trilha": {"arquivo": "_teste_audio/trilha.wav", "db": -20}, "checar_video": {"script": ""}}
        json.dump(cfg, open(os.path.join(SER, 'kit.config.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
        print('kit.config.json de teste gravado (ponha a fonte em ferramentas.fonte).')
    print('ep de teste pronto em', EP)
    sc = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'scripts').replace(os.sep, '/')
    print(f'próximo (rodando da pasta da série): python "{sc}/linha_voz.py" {a.ep}')
    print(f'             e depois:            python "{sc}/ciclo.py" --ep {a.ep} --nome teste --sem-h3 --sem-stt')


if __name__ == '__main__':
    main()
