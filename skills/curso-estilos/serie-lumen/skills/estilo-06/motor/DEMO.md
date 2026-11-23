# Demo do motor 06 (isekai em massinha com escolha)

**Pré-requisitos:** Python 3.10+, FFmpeg no PATH e `pip install -r requirements.txt` (para o demo bastam `numpy` e `Pillow`).

**Comando:** `python demo.py`

**O que sai:** `saida/demo.mp4`, 540×960, 30 qps, 3 s, mudo, yuv420p. São 3 planos com os efeitos em código da série: selo do voto, monitor de batimentos, flash de troca, soco de zoom, glitch, grão e os dois botões da escolha com "COMENTA 1 OU 2".

**Tempo esperado:** ~1 min (só CPU; `DEMO_CPU=1` não muda nada, este demo nunca usa GPU).

**O que o demo NÃO faz:** gerar imagem ou animar com IA. Os 3 quadros são bonecos de massinha desenhados por código, só para a montagem ter o que mostrar. Para ver com a sua arte, troque `saida/_demo_ep/quadros/P1.png`, `P2.png` e `P3.png` por imagens 9:16 suas e rode `python demo.py --manter`. O caminho completo (quadros no gerador de imagem, animação no H3 pelo ComfyUI, voz, mix e ciclo) está na receita `receita.md`, uma pasta acima desta.
