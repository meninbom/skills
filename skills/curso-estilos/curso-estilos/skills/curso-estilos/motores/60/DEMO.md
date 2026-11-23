# Demo · 60 Pixel de jogo indie

- **Precisa de:** Node 18 ou mais novo e FFmpeg no PATH. Não usa navegador, placa de vídeo nem `npm install` (não há dependências).
- **Comando** (dentro de uma cópia desta pasta): `npm run demo` (ou `node demo.mjs`).
- **Sai:** `saida/demo.mp4`, 3,6 s, 540×960, 30 qps, mudo, yuv420p: o trecho do baú de ouro, com HUD e legenda.
- **Tempo esperado:** uns 5 a 15 s, só CPU. `DEMO_CPU=1` é aceito e não muda nada (o motor já é só CPU).
- **Os bonecos são placeholders.** Os sprites de artista não vêm aqui porque a licença deles proíbe redistribuir. O demo gera, por código, bonecos de retângulo com os mesmos nomes, tamanhos e número de quadros (`sprites/placeholder.mjs`).
- **Para usar os sprites reais** (grátis): baixe do itch.io os packs "Fantasy Knight - Free Pixelart Animated Character" e "Free Pixelart Platformer Tileset" (autor aamatniekss) e "Free Treasure Chest" (autor Otsoga), descompacte os três em `sprites/packs/`, instale o Pillow (`pip install -r requirements.txt`) e rode `python sprites/prep.py`. Ele grava `sprites/assets/*.rgba` + `sprites/assets/index.json` por cima dos placeholders. Leia a licença de cada pack antes de publicar.
- **Episódio inteiro (43 s, mudo, 1080×1920):** `npm run render`. Voz e som: veja a receita (`estilos/60_pixel_indie.md`).
