# tools/ · o que roda e o que é referência

**Roda no pacote, sem mídia externa**
- `placeholders.mjs`: gera as imagens do demo em `public/` (PNG puro em Node).
- `quadros.mjs`, `stills_v4.mjs`, `clip_v4.mjs`: quadros e trechos soltos pelo renderizador do Remotion (troque o id da composição para `Demo` enquanto não tiver a sua mídia).

**Referência do episódio Robot** (código real da produção; lê quadros, clipes, LUTs, voz e fontes que não vêm no pacote, e alguns importam módulos de preparo do episódio). Leia para copiar a técnica e adapte os caminhos do topo de cada arquivo ao seu projeto:
- `preparar.py`: voz a −16 LUFS, cópia de documentos e fontes para `public/`.
- `mk_h3_jobs.py`, `plates_h3.py`: lista de jobs do H3 com câmera travada e as placas 1120×1920.
- `tratar_clipes.py`: ampliação, LUT, corte 1080×1920 e reconformação dos clipes.
- `lut.py`, `luz_mesa.py`, `mattes.py`, `heroi_seq.py`, `heroi_limpo.py`, `capa_real.py`, `quads.py`: grade ponto a ponto como LUT 3D, mapa de luz da mesa, recorte do herói por quadro, homografia dos documentos.
- `montagem_v3.py`, `montagem_clipes.py`: geram o `src/data/cenas.json` a partir dos tempos por palavra.
- `checar.py`, `checar_v3.py`: conferem o roteiro de montagem (tamanho de texto, zona segura, buracos de ritmo) antes de renderizar.
- `mix.py`, `mix_v4.py` (+ `../mix_v4.json`): mix medida (voz −16 LUFS, trilha 12 dB abaixo, sidechain, master). A trilha é sua.
- `folha.py`: folha de contato dos quadros.
- `final_v4.sh`: render final com trava de render (um render pesado por vez) e versão de celular até 20 MB.

Dependências Python desses scripts: `pillow`, `numpy`, `opencv-python`, `rembg` (recorte), `librosa` (emenda de voz), mais o FFmpeg no PATH.
