# Demo do estilo 66 · ilustração com HUD de RPG

**Pré-requisitos:** Python 3.10+, FFmpeg no PATH. Sem GPU, sem IA, sem internet.

```
pip install -r requirements.txt
python demo.py
```

**O que sai:** `saida/demo.mp4`, 3 s, 540×960, 24 qps, mudo, yuv420p. São 3 planos de 1 s em corte seco (fachada, placa de perto, beco)
com as 4 peças da HUD (`hud.py`): status + relógio, cartão no slot fixo, círculo de alvo com rótulo de ameaça, legenda de 1–2
palavras, e o par de botões do voto. A câmera faz push-in em código em todos os planos.

**Tempo esperado:** 20–60 s em CPU (`DEMO_CPU=1` é aceito; o demo já é só CPU).

**As imagens são placeholders desenhados por código.** Para ver a HUD sobre as suas ilustrações, crie `demo_quadros/1.png`,
`2.png` e `3.png` (9:16, qualquer tamanho) nesta pasta e rode de novo. A geração e a animação por IA (ilustração no Flow,
clipe no ComfyUI) não rodam no demo: estão documentadas na receita e nos scripts `h3_flash/` e `v2/fila_flash.sh`.

**Depois do demo:** `python v2/montar_v2.py --quadros` tira um quadro por plano do episódio de exemplo (sem clipes, o fundo sai
preto e a HUD aparece inteira em `v2/final/_quadros/`).
