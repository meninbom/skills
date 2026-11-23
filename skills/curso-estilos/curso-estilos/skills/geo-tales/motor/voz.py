"""Narração pela API da ElevenLabs, com o tempo de cada palavra (para o legendas.py). PAGO: gasta créditos da SUA conta.
Não roda no demo. Só gera com --confirmo-custo; sem a flag, mostra a estimativa e sai.
Chave: variável de ambiente ELEVENLABS_API_KEY (nunca escreva a chave em arquivo do projeto).
uso: python voz.py voz/narracao.txt voz/narr_A --voz ID_DA_VOZ [--modelo eleven_multilingual_v2] [--estabilidade 0.35] [--estilo 0.7] --confirmo-custo
sai: voz/narr_A.mp3 e voz/narr_A.words.json = [{"w": palavra, "start": s, "end": s}, ...]"""
import argparse, base64, json, os, sys
ap = argparse.ArgumentParser()
ap.add_argument('texto'); ap.add_argument('saida'); ap.add_argument('--voz', required=True)
ap.add_argument('--modelo', default='eleven_multilingual_v2'); ap.add_argument('--estabilidade', type=float, default=0.35); ap.add_argument('--estilo', type=float, default=0.7)
ap.add_argument('--confirmo-custo', action='store_true')
a = ap.parse_args()
txt = open(a.texto, encoding='utf8').read().strip()
print(f'{len(txt)} caracteres = até ~{len(txt)} créditos (confira a tabela do seu plano: alguns modelos cobram menos por caractere).')
if not a.confirmo_custo: sys.exit('Nada foi gerado. Repita com --confirmo-custo para gastar os créditos.')
chave = os.environ.get('ELEVENLABS_API_KEY')
if not chave: sys.exit('Defina a variável de ambiente ELEVENLABS_API_KEY com a sua chave.')
import requests
r = requests.post(f'https://api.elevenlabs.io/v1/text-to-speech/{a.voz}/with-timestamps', headers={'xi-api-key': chave},
                  json={'text': txt, 'model_id': a.modelo, 'voice_settings': {'stability': a.estabilidade, 'similarity_boost': 0.75, 'style': a.estilo}}, timeout=600)
if r.status_code != 200: sys.exit(f'erro {r.status_code}: {r.text[:300]}')
j = r.json(); open(a.saida + '.mp3', 'wb').write(base64.b64decode(j['audio_base64']))
al = j['alignment']; pal = []; at = None
for c, i, f in zip(al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']):
    if c.isspace():
        if at: pal.append(at); at = None
    elif at: at['w'] += c; at['end'] = round(f, 3)
    else: at = {'w': c, 'start': round(i, 3), 'end': round(f, 3)}
if at: pal.append(at)
json.dump(pal, open(a.saida + '.words.json', 'w', encoding='utf8'), ensure_ascii=False)
print('ok', a.saida + '.mp3', len(pal), 'palavras')
