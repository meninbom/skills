"""Narração na ElevenLabs (PAGO: gasta créditos da SUA conta). Não roda no demo.

Uso:
  python gerar_voz.py A                      só mostra quantos caracteres vai gastar e para
  python gerar_voz.py A --confirmo-custo     gera narr_A.mp3 + narr_A.words.json + narr_A_-16.wav
Lê o texto de narracao.txt (nesta pasta) e a chave da variável de ambiente ELEVENLABS_API_KEY.
1 caractere = ~1 crédito nos modelos comuns (confira o seu plano). O texto do EP01 tem ~1.170 caracteres por tomada.
Gere UMA tomada por voz e escolha de ouvido antes de editar. Nunca coloque a chave dentro de arquivo do projeto.
"""
import base64, json, os, subprocess, sys, urllib.request

R = os.path.dirname(os.path.abspath(__file__)); os.chdir(R)
# Troque pelos ids das vozes que você escolher na biblioteca da ElevenLabs (voz de criança/adolescente, pt-BR).
VOZES = {
    "A": ("COLE_AQUI_O_VOICE_ID_A", "eleven_multilingual_v2"),
    "B": ("COLE_AQUI_O_VOICE_ID_B", "eleven_multilingual_v2"),
}
AJUSTE = {"stability": 0.4, "style": 0.45, "speed": 1.0}   # velocidade: no máximo 1,1 (acima disso soa acelerada)

args = [a for a in sys.argv[1:] if not a.startswith("--")]
tk = args[0] if args else "A"
if tk not in VOZES: raise SystemExit(f"voz '{tk}' não está em VOZES")
vid, modelo = VOZES[tk]
texto = open("narracao.txt", encoding="utf8").read().strip()
print(f"voz {tk} ({modelo}): {len(texto)} caracteres = ~{len(texto)} créditos")
if "--confirmo-custo" not in sys.argv:
    raise SystemExit("Nada foi gerado. Para gastar os créditos, rode de novo com --confirmo-custo")
chave = os.environ.get("ELEVENLABS_API_KEY")
if not chave: raise SystemExit("defina a variável de ambiente ELEVENLABS_API_KEY com a sua chave")
if vid.startswith("COLE_AQUI"): raise SystemExit("edite VOZES neste arquivo com o voice_id da sua voz")
if os.path.exists(f"narr_{tk}.mp3"): raise SystemExit(f"narr_{tk}.mp3 já existe (apague para gerar de novo)")

req = urllib.request.Request(
    f"https://api.elevenlabs.io/v1/text-to-speech/{vid}/with-timestamps?output_format=mp3_44100_128",
    data=json.dumps({"text": texto, "model_id": modelo, "voice_settings": AJUSTE}).encode("utf8"),
    headers={"xi-api-key": chave, "Content-Type": "application/json"})
j = json.load(urllib.request.urlopen(req, timeout=300))
open(f"narr_{tk}.mp3", "wb").write(base64.b64decode(j["audio_base64"]))

# alinhamento por caractere -> palavras com início e fim (é o que o editar.py usa para cortar e legendar)
al = j["alignment"]; W = []; atual = ""; ini = fim = 0.0
for c, a, b in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
    if c.isspace():
        if atual: W.append({"w": atual, "start": round(ini, 3), "end": round(fim, 3)}); atual = ""
    else:
        if not atual: ini = a
        atual += c; fim = b
if atual: W.append({"w": atual, "start": round(ini, 3), "end": round(fim, 3)})
json.dump(W, open(f"narr_{tk}.words.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)

subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"narr_{tk}.mp3", "-af", "loudnorm=I=-16:TP=-2:LRA=11", "-ar", "48000", "-ac", "1", f"narr_{tk}_-16.wav"], check=True)
print(f"pronto: narr_{tk}.mp3, narr_{tk}.words.json ({len(W)} palavras), narr_{tk}_-16.wav")
