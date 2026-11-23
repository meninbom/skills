"""Voz do episódio pela API da ElevenLabs, com a SUA chave. ISTO GASTA CRÉDITO: 1 caractere = 1 crédito (modelos atuais).

Sem --confirmo-custo o script só conta os caracteres, mostra quanto vai gastar e para. Nada é gerado no demo.
A chave vem da variável de ambiente ELEVENLABS_API_KEY (nunca escreva a chave em arquivo do projeto).

uso:
  python gerar_voz.py --texto narracao.txt --voz <voice_id> --saida ../meu_ep/voz/narr                  (só conta)
  python gerar_voz.py --texto narracao.txt --voz <voice_id> --saida ../meu_ep/voz/narr --confirmo-custo --teto 3000
  python gerar_voz.py --tsv falas.tsv --saida ../meu_ep/voz/falas --confirmo-custo     (falas de personagem: id<TAB>voice_id<TAB>texto)
Grava <saida>.mp3, <saida>.wav (48 kHz mono, -16 LUFS) e <saida>.words.json ([{"w","start","end"}], o que o linha_voz.py lê).
Regras da série: sem sussurro (nem tag, nem reticências que puxem sussurro); velocidade no máximo 1,1; narração num take só.
"""
import os, sys, json, base64, argparse, subprocess, urllib.request, urllib.error

API = 'https://api.elevenlabs.io/v1/text-to-speech/{}/with-timestamps'


def tts(chave, voz, texto, modelo, estab, estilo, vel):
    corpo = json.dumps({'text': texto, 'model_id': modelo,
                        'voice_settings': {'stability': estab, 'similarity_boost': 0.75, 'style': estilo, 'speed': vel}}).encode('utf-8')
    req = urllib.request.Request(API.format(voz) + '?output_format=mp3_44100_128', data=corpo,
                                 headers={'xi-api-key': chave, 'Content-Type': 'application/json'})
    try:
        return json.load(urllib.request.urlopen(req, timeout=300))
    except urllib.error.HTTPError as e:
        raise SystemExit(f'ElevenLabs respondeu {e.code}: {e.read().decode("utf-8", "replace")[:300]}')


def palavras(al):
    """alinhamento por caractere -> lista de palavras com início e fim"""
    out, cur, t0, t1 = [], '', None, None
    for c, a, b in zip(al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']):
        if c.isspace():
            if cur: out.append({'w': cur, 'start': round(t0, 3), 'end': round(t1, 3)}); cur = ''
        else:
            if not cur: t0 = a
            cur += c; t1 = b
    if cur: out.append({'w': cur, 'start': round(t0, 3), 'end': round(t1, 3)})
    return out


def grava(r, base):
    os.makedirs(os.path.dirname(os.path.abspath(base)), exist_ok=True)
    open(base + '.mp3', 'wb').write(base64.b64decode(r['audio_base64']))
    json.dump(palavras(r.get('alignment') or r['normalized_alignment']), open(base + '.words.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', base + '.mp3', '-af', 'loudnorm=I=-16:TP=-2:LRA=11', '-ar', '48000', '-ac', '1', base + '.wav'], check=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--texto'); ap.add_argument('--tsv'); ap.add_argument('--voz'); ap.add_argument('--saida', required=True)
    ap.add_argument('--modelo', default=os.environ.get('ELEVEN_MODEL', 'eleven_multilingual_v2'))
    ap.add_argument('--estabilidade', type=float, default=0.3); ap.add_argument('--estilo', type=float, default=0.6)
    ap.add_argument('--velocidade', type=float, default=1.1); ap.add_argument('--teto', type=int, default=3000, help='máximo de caracteres desta rodada')
    ap.add_argument('--confirmo-custo', action='store_true')
    a = ap.parse_args()
    if a.velocidade > 1.1: raise SystemExit('velocidade acima de 1,1 deixa a voz corrida; o teto da série é 1,1')
    if a.tsv:
        itens = [l.rstrip('\n').split('\t') for l in open(a.tsv, encoding='utf-8') if l.strip() and not l.startswith('#')]
        itens = [(os.path.join(a.saida, i[0]), i[1], i[2]) for i in itens if len(i) >= 3]
    elif a.texto and a.voz:
        itens = [(a.saida, a.voz, open(a.texto, encoding='utf-8').read().strip())]
    else:
        raise SystemExit('passe --texto e --voz, ou --tsv')
    itens = [i for i in itens if not os.path.exists(i[0] + '.wav')]            # o que já existe não se paga de novo
    total = sum(len(t) for _, _, t in itens)
    print(f'{len(itens)} trecho(s) a gerar · {total} caracteres ≈ {total} créditos da SUA conta ElevenLabs (teto desta rodada: {a.teto})')
    if '[whisper' in ' '.join(t for _, _, t in itens).lower(): raise SystemExit('tem tag de sussurro no texto: tire (a série não usa sussurro)')
    if total > a.teto: raise SystemExit('PAREI: passa do teto. Aumente --teto de propósito se for isso mesmo.')
    if not itens: return
    if not a.confirmo_custo:
        print('Nada foi gerado. Para gastar, rode de novo com --confirmo-custo.'); return
    chave = os.environ.get('ELEVENLABS_API_KEY')
    if not chave: raise SystemExit('defina a variável de ambiente ELEVENLABS_API_KEY com a sua chave')
    for base, voz, texto in itens:
        grava(tts(chave, voz, texto, a.modelo, a.estabilidade, a.estilo, a.velocidade), base); print('ok', base + '.wav', len(texto), 'caracteres')


if __name__ == '__main__':
    main()
