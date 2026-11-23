#!/bin/bash
# Narração do ep01 "patinete" (Ryo em 1ª pessoa). Uma fala por arquivo, um take cada. ISTO GASTA CRÉDITOS DA SUA CONTA ELEVENLABS.
#
# Uso:  ELEVENLABS_API_KEY=... bash gerar_vozes.sh --confirmo-custo [id ...]
#       (sem id = todas as falas do falas.tsv; pula a que já tem voz/<id>_-16.wav)
#       sem --confirmo-custo o script só mostra quantos caracteres seriam enviados e para.
#
# Variáveis opcionais:
#   ELEVEN_VOICE_ID   id da voz (padrão: a voz usada na peça, "jovem casual"; troque pela sua)
#   ELEVEN_MODEL      padrão eleven_v4, o da peça (entende as tags [deadpan], [bored]... do falas.tsv); se a API recusar o
#                     modelo, use o expressivo atual da sua conta, ex. ELEVEN_MODEL=eleven_v3
# Ajustes da peça: estabilidade 0,3 / estilo 0,6, velocidade 1,0x (a voz nunca acelera; o plano é que estica).
# Cada fala sai normalizada a -16 LUFS (loudnorm), mono, 48 kHz.
# Precisa de: bash, curl, python e ffmpeg no PATH.
cd "$(dirname "$0")" || exit 1
VID="${ELEVEN_VOICE_ID:-7lu3ze7orhWaNeSPowWx}"; MODEL="${ELEVEN_MODEL:-eleven_v4}"
OK=0; IDS=""
for a in "$@"; do if [ "$a" = "--confirmo-custo" ]; then OK=1; else IDS="$IDS $a"; fi; done
mkdir -p voz falas
python -X utf8 -c "
for l in open('falas.tsv',encoding='utf8'):
    if l.startswith('#') or not l.strip(): continue
    i,a,j,t=l.rstrip('\n').split('\t'); open(f'falas/{i}.txt','w',encoding='utf8').write(t.strip())
" || { echo "PAREI no falas.tsv"; exit 1; }
[ -n "$IDS" ] || IDS=$(ls falas/*.txt | sed 's|falas/||;s|\.txt||' | sort)
TOT=0; FALTAM=""
for id in $IDS; do
  [ -f "voz/${id}_-16.wav" ] && continue
  n=$(python -X utf8 -c "import sys;print(len(open(sys.argv[1],encoding='utf8').read()))" "falas/$id.txt")
  TOT=$((TOT+n)); FALTAM="$FALTAM $id"
done
echo "falas a gerar:${FALTAM:- nenhuma} | caracteres a enviar: $TOT (na ElevenLabs, 1 caractere = ~1 crédito; confira o preço do seu plano)"
[ -z "$FALTAM" ] && exit 0
if [ "$OK" != 1 ]; then echo "Nada foi enviado. Para gerar de verdade, rode de novo com --confirmo-custo."; exit 0; fi
[ -n "$ELEVENLABS_API_KEY" ] || { echo "Falta a variável de ambiente ELEVENLABS_API_KEY (a chave da SUA conta)."; exit 1; }
for id in $FALTAM; do
  python -X utf8 -c "
import json,sys
t=open(sys.argv[1],encoding='utf8').read()
json.dump({'text':t,'model_id':sys.argv[2],'voice_settings':{'stability':0.3,'style':0.6,'speed':1.0}},open(sys.argv[3],'w',encoding='utf8'),ensure_ascii=False)
" "falas/$id.txt" "$MODEL" "voz/$id.json"
  code=$(curl -sS -o "voz/$id.mp3" -w "%{http_code}" -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VID?output_format=mp3_44100_128" \
    -H "xi-api-key: $ELEVENLABS_API_KEY" -H "Content-Type: application/json" --data-binary "@voz/$id.json")
  rm -f "voz/$id.json"
  if [ "$code" != 200 ]; then echo "PAREI em $id (HTTP $code):"; head -c 400 "voz/$id.mp3"; echo; rm -f "voz/$id.mp3"; exit 1; fi
  ffmpeg -v error -y -i "voz/$id.mp3" -af loudnorm=I=-16:TP=-2:LRA=11 -ar 48000 -ac 1 "voz/${id}_-16.wav" || { echo "PAREI no loudnorm de $id"; exit 1; }
  echo "$id ok"
  sleep 2
done
echo "PRONTO. caracteres enviados nesta rodada: $TOT"
