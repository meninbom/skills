"""Gera as falas na ElevenLabs, uma fala por arquivo (voz/<id>.mp3 e voz/<id>.wav a -16 LUFS, mono 48 kHz).

ISTO GASTA CRÉDITOS DA SUA CONTA. Sem --confirmo-custo o script só mostra a conta de caracteres e para.
A chave vem da variável de ambiente ELEVENLABS_API_KEY (nunca escreva a chave em arquivo do projeto).

uso:
  python gerar_vozes.py --falas linha.json                      (lista {"falas": [{"id", "q", "txt"}, ...]})
  python gerar_vozes.py --falas falas.json --ep ep01            (formato {"ep01": [[id, quem, texto], ...]})
  python gerar_vozes.py --texto narracao.txt --id narr --quem NAR
  ... e, depois de conferir a conta:  acrescente  --confirmo-custo
  --palavras   grava também <id>.words.json ([{"w", "start", "end"}], tempos do áudio original) para legenda palavra a palavra
  --saida X    pasta de saída, relativa a este arquivo (padrão: voz)

As vozes ficam em vozes_config.json (copie de vozes_config.exemplo.json e troque os voice_id pelos da sua conta):
  {"modelo": "eleven_multilingual_v2", "vozes": {"NAR": {"voice_id": "...", "stability": 0.5, "style": 0.4, "speed": 1.0}}}
Regras que valem: uma fala por arquivo, velocidade no máximo 1,1, sem sussurro. Arquivo que já existe não é gerado de novo.
"""
import argparse, base64, json, os, subprocess, sys, time, urllib.request, urllib.error

AQUI = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser()
ap.add_argument('--falas'); ap.add_argument('--ep'); ap.add_argument('--texto'); ap.add_argument('--id', default='narr'); ap.add_argument('--quem', default='NAR')
ap.add_argument('--config', default='vozes_config.json'); ap.add_argument('--saida', default='voz'); ap.add_argument('--teto', type=int, default=0, help='máximo de caracteres nesta rodada (0 = sem teto)')
ap.add_argument('--palavras', action='store_true', help='grava também <id>.words.json com o tempo de cada palavra (legenda e retemporização)')
ap.add_argument('--confirmo-custo', action='store_true')
a = ap.parse_args()

if a.texto:
    falas = [(a.id, a.quem, ' '.join(open(a.texto, encoding='utf-8').read().split()))]
elif a.falas:
    d = json.load(open(a.falas, encoding='utf-8'))
    falas = [tuple(f) for f in d[a.ep]] if a.ep else [(f['id'], f['q'], f['txt']) for f in d['falas']]
else:
    ap.error('passe --falas ou --texto')

saida = os.path.join(AQUI, a.saida); os.makedirs(saida, exist_ok=True)
novas = [f for f in falas if not os.path.exists(os.path.join(saida, f[0] + '.mp3'))]
total = sum(len(t) for _, _, t in novas)
print(f'{len(falas)} falas; {len(novas)} ainda sem arquivo; {total} caracteres a gerar (na ElevenLabs, 1 caractere custa cerca de 1 crédito; confira no seu plano).')
for q in sorted({q for _, q, _ in novas}): print(f'  {q}: {sum(len(t) for _, qq, t in novas if qq == q)} caracteres')
if a.teto and total > a.teto: sys.exit(f'PAREI: {total} caracteres passa do teto de {a.teto}.')
if not novas: sys.exit(0)
if not a.confirmo_custo: sys.exit('Nada foi gerado. Para gerar de verdade (PAGO), rode de novo com --confirmo-custo.')
chave = os.environ.get('ELEVENLABS_API_KEY')
if not chave: sys.exit('PAREI: defina a variável de ambiente ELEVENLABS_API_KEY com a sua chave.')
cfg_arq = os.path.join(AQUI, a.config)
if not os.path.exists(cfg_arq): sys.exit(f'PAREI: falta {a.config} (copie vozes_config.exemplo.json e ponha os voice_id da sua conta).')
cfg = json.load(open(cfg_arq, encoding='utf-8'))

for fid, quem, txt in novas:
    v = cfg['vozes'].get(quem)
    if not v or 'COLOQUE' in v.get('voice_id', 'COLOQUE'): sys.exit(f'PAREI: sem voice_id para "{quem}" em {a.config}.')
    corpo = {'text': txt, 'model_id': cfg.get('modelo', 'eleven_multilingual_v2'),
             'voice_settings': {'stability': v.get('stability', 0.5), 'style': v.get('style', 0.4), 'speed': min(1.1, v.get('speed', 1.0))}}
    req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{v["voice_id"]}{"/with-timestamps" if a.palavras else ""}?output_format=mp3_44100_128',
                                 data=json.dumps(corpo).encode('utf-8'), headers={'xi-api-key': chave, 'Content-Type': 'application/json'})
    try:
        mp3 = urllib.request.urlopen(req, timeout=180).read()
    except urllib.error.HTTPError as e:
        sys.exit(f'PAREI em {fid}: HTTP {e.code} {e.read()[:300].decode("utf-8", "replace")}')
    base = os.path.join(saida, fid)
    if a.palavras:   # a resposta vem em JSON: áudio em base64 + tempo de cada caractere; junta os caracteres em palavras
        r = json.loads(mp3); mp3 = base64.b64decode(r['audio_base64']); al = r.get('alignment') or {}
        ch, t0, t1 = al.get('characters', []), al.get('character_start_times_seconds', []), al.get('character_end_times_seconds', [])
        pal, atual = [], None
        for c, x0, x1 in zip(ch, t0, t1):
            if c.isspace(): atual = None; continue
            if atual is None: atual = {'w': '', 'start': round(x0, 3), 'end': round(x1, 3)}; pal.append(atual)
            atual['w'] += c; atual['end'] = round(x1, 3)
        json.dump(pal, open(base + '.words.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    open(base + '.mp3', 'wb').write(mp3)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', base + '.mp3', '-af', v.get('filtro', '') + (',' if v.get('filtro') else '') + 'loudnorm=I=-16:TP=-2:LRA=11',
                    '-ar', '48000', '-ac', '1', base + '.wav'], check=True)
    open(os.path.join(saida, 'voz_gastos.md'), 'a', encoding='utf-8').write(f'| {time.strftime("%d/%m %H:%M")} | {fid} | {quem} | {len(txt)} |\n')
    print('ok', fid, len(txt)); time.sleep(1)
print('PRONTO.')
