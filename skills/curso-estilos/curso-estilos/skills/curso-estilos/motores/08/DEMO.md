# Demo · 08 micro-doc com personagem fixo

- **Pré-requisitos:** Node 18+ e o Google Chrome (ou Edge/Chromium) instalado. Se o Chrome estiver fora do lugar padrão, defina `CHROME_PATH` com o caminho do executável. Não precisa de ComfyUI, GPU, Python nem FFmpeg (o Remotion traz o dele).
- **Comando** (dentro de uma cópia desta pasta):
  ```
  npm run demo
  ```
  Na primeira vez ele instala o Remotion em `projeto_robot/` (1–4 min, precisa de internet). Sem placa de vídeo, ou com ela ocupada: `DEMO_CPU=1 npm run demo` (no PowerShell: `$env:DEMO_CPU=1; npm run demo`).
- **O que sai:** `saida/demo.mp4`, 3 s, 540×960, 24 qps, mudo, yuv420p. Dois planos com os mesmos componentes do episódio real: o "personagem" com a palavra **atrás da cabeça** (recorte por matte), push de câmera, flash de virada, o "documento" que **cai na mesa** com sombra dura e legenda impressa, a data entrando, grão e vinheta.
- **Tempo esperado:** com placa de vídeo, 74 s, já contando o Remotion se preparando (medido com RTX 4070 Ti 12 GB); por software (`DEMO_CPU=1`), 2–4 min. Fora a instalação da primeira vez.
- **As imagens são placeholders** gerados por código (`projeto_robot/tools/placeholders.mjs` grava em `projeto_robot/public/`): uma silhueta, uma mesa, um papel. Para pôr as suas: salve seus quadros em `public/stills/`, seus documentos em `public/docs/` (e o tamanho nativo de cada um em `DOCS`, no `src/lib/comp.tsx`) e edite `src/data/demo.json` (mesmo formato do `src/data/cenas.json` do episódio).
- **Fontes:** a peça original usa a Fixture, que é comercial e não vem no pacote. O demo usa a fonte pesada do sistema. Para usar a sua, ponha os `.ttf` em `public/fonts/` e ajuste `FONTES` no `src/Robot.tsx`.
- **Licença do Remotion:** é grátis para pessoas e empresas pequenas; empresas maiores precisam de licença paga. Confira em remotion.dev/license antes de usar em trabalho comercial.
- As composições `Robot` e `Prev30` (o episódio de 45 s) estão no projeto como exemplo de roteiro de montagem, mas só renderizam com a mídia do episódio, que não vem no pacote.
