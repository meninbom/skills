# Demo · Corte 3D "what if"

Pré-requisitos: Blender instalado (blender.org, grátis; testado no 5.2), Python 3.10+ com Pillow e FFmpeg no PATH. Não precisa de GPU nem de internet: o demo usa os assets reduzidos de `assets_demo/`.

```
pip install -r requirements.txt
python demo.py
```

Se o Blender não estiver no PATH nem na pasta padrão de instalação, aponte o executável antes:
`set BLENDER_PATH=C:\caminho\blender.exe` (Windows) ou `export BLENDER_PATH=/caminho/blender` (Mac/Linux).

Sai `saida/demo.mp4`: 3 s do poço descendo no barro (contador de 1 a 6 m), 540×960, 12 qps, mudo, yuv420p.
Tempo esperado: 2 a 4 minutos em CPU (medido: 137 s de render para 36 quadros com 4 amostras; `DEMO_SPP=8` melhora a imagem e dobra o tempo).

Depois do demo: `python whatif.py still 9.6` (um quadro de teste), `python whatif.py render` e `python whatif.py montar` (a peça de 28 s; ~1 h de CPU).
Para o look completo da prévia (pedras, arbusto grande, texturas 2k): `python run/baixar_ph.py` baixa ~160 MB da Poly Haven para `assets/`.
