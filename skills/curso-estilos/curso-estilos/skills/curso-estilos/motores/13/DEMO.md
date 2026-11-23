# Demo do estilo 13 (beta)

Este estilo é gravado dentro do **Roblox Studio**, com a tela real. Isso não roda sozinho por um comando, então o demo cobre só a parte em código: a montagem e a edição.

- **Pré-requisitos:** Python 3.10+, FFmpeg 7 ou mais novo no PATH, `pip install -r requirements.txt`.
- **Comando:** `python demo.py`
- **O que sai:** `saida/demo.mp4`, 540×960, 30 qps, 3 s, mudo. Dois "brutos" desenhados por código (blocos no lugar da cena do Studio, deitados e em câmera lenta 3×) passam pelos scripts reais: `gravacao/montar.py` (acelera, gira, recorta 9:16, varre janela invasora) e `gravacao/editar.py` (legenda de 1 palavra, HUD, etiqueta, cartões de voto).
- **Tempo:** ~45 s num PC comum. Não usa GPU nem navegador (`DEMO_CPU=1` é aceito e não muda nada).

## Para fazer o vídeo de verdade (no Studio)
1. Instale o Roblox Studio e ligue o MCP (receita, seção "Ferramentas e instalação").
2. Monte a sua cidade por script e instale os módulos de `luau/` (veja `luau/LEIA.md`).
3. Grave cada plano com `gravacao/grava2.sh` (Windows; ajuste a região da tela com `GRAVA_X`, `GRAVA_Y`, `GRAVA_TAM`).
4. Copie `gravacao/planos_ep01.json` como `planos.json` e `gravacao/ep01.json` como `episodio.json`, troque pelos seus planos e frases, e rode `montar.py` e `editar.py` na pasta dos brutos.
5. Voz: `voz/gerar_voz.py` (pago, só com `--confirmo-custo` e a sua chave em `ELEVENLABS_API_KEY`). Sons: ponha os seus em `sons/` (ou aponte `SFX_DIR`).

Já tem um lugar seu com scripts dentro? `python rbxl/extrair_luau.py MeuLugar.rbxl pasta` tira o código como texto, sem abrir o Studio.
