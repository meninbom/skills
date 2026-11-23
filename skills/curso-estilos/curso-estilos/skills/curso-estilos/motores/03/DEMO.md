# Demo do estilo 03 · boneco 2D vetor articulado

Pré-requisitos: Node 18 ou mais novo, FFmpeg no PATH e o Google Chrome instalado (se estiver fora do lugar padrão, aponte a variável `CHROME_PATH` para o executável).

```
npm install
npm run demo
```

Sai `saida/demo.mp4`: 3 s do episódio (18,5 s a 21,5 s: o General, a arqueira e o HUD de erro), 540×960, 30 qps, mudo, yuv420p.

Tempo medido sem placa de vídeo (`DEMO_CPU=1`, render por software): de 1 min 25 s a 2 min 10 s para os 90 quadros (cerca de 1 a 1,5 s por quadro; o trecho tem 3 bonecos, névoa e desfoque em 1080×1920). Com a máquina ocupada com outros renders já passou de 3 min. Com placa de vídeo é mais rápido; esse tempo não foi medido de novo nesta versão. É Canvas 2D, não precisa de placa de vídeo; `DEMO_CPU=1` força o render por software (no PowerShell: `$env:DEMO_CPU=1; npm run demo`).

Peça curta de outro tema: `npm run kit` renderiza o kit de partida (`kit_template/`, cena de 7 s com cenário e cores trocáveis) em `saida/kit.mp4`, 1080×1920, 30 qps, mudo, yuv420p. Medido com `DEMO_CPU=1`: cerca de 1 min 30 s em 1080×1920 e cerca de 30 s em 540×960 ou 960×540 (`node render.mjs --pagina kit_template/kit.html --video saida/kit.mp4 --vw 540 --vh 960`). O que trocar e onde: `kit_template/LEIA-ME.md`.

Depois do demo: `npm run folha` (6 quadros do episódio), `npm run filme` (os 162 s a 60 qps em 6 processos) e os laboratórios, trocando a página: `node render.mjs --pagina lab_anda.html --video saida/anda.mp4`.

Ferramentas em Python (opcionais): `pip install -r requirements.txt` e depois `python trava.py --qps 12`, `python folha_poses.py ...`, `python foto_gerador.py ...`. Elas também usam o Chrome do sistema.
