# Demo · Câmera contínua num mundo só

Pré-requisitos: Node 18+, Google Chrome (ou Edge/Chromium) instalado e FFmpeg no PATH. Não precisa de GPU nem de Python.

```
npm install
npm run demo
```

Sai `saida/demo.mp4`: 3 s do template (a viagem até "Tóquio, 1999" e a descida até a folha de figurinhas), 540×960, 30 qps, mudo, yuv420p.
Tempo esperado: 10 s com placa de vídeo (medido com RTX 4070 Ti 12 GB); cerca de 1 minuto por software (medido: 49 s com `DEMO_CPU=1`).

Variáveis opcionais: `CHROME_PATH` (outro navegador), `FFMPEG_PATH`, `DEMO_CPU=1` (força render por software).

Depois do demo: `npm run template` (os 12 s do template em 1080×1920) e `npm run exemplo` (o exemplo completo de 56 s, mudo).
Horizontal (16:9): `node render.mjs kit_template --vw 1920 --vh 1080 --saida saida/horizontal.mp4` (junte `--largura 960` para um teste rápido em 960×540). O quadro vertical do roteiro aparece inteiro e centrado, sem esticar nem cortar, e sobra página dos lados. Para desenhar direto em horizontal, troque `BASE` para `{w:1920,h:1080}` no bloco PALCO do `index.html` e refaça as posições do roteiro e da lista `K`.
Para o seu vídeo: edite `kit_template/index.html` (bloco "ROTEIRO NA PÁGINA" e lista `K`), ponha as suas imagens em `kit_template/img/` e siga `PROMPT_CLAUDE_CODE.md`.
Áudio não vem no pacote: `som/mix.py` mixa a SUA voz, trilha e efeitos (veja `som/arquivos.exemplo.json`).

## Página em branco (para um estilo seu)

O `kit_template` é um roteiro pronto, em pé. Para começar do zero, em pé ou deitado, use o `kit_branco`: uma página mínima, toda comentada, com 3 formas e um texto que se movem por 4 s.

Teste antes de mexer:

```
npm run branco            (em pé, 1080×1920, sai saida/branco.mp4)
npm run branco:deitado    (deitado, 1920×1080, sai saida/branco_deitado.mp4)
```

Tempo medido por software (`DEMO_CPU=1`): cerca de 5 s cada.

Para a sua peça:

1. Copie a pasta `kit_branco` inteira, aqui mesmo dentro do motor, com outro nome. Exemplo: `minha_peca`.
2. Abra `minha_peca/index.html` e troque o que está marcado com `TROQUE`: fonte, cores, elementos, duração, lugar de cada coisa e a animação.
3. Renderize:

```
node render.mjs minha_peca --saida saida/minha_peca.mp4                          (em pé)
node render.mjs minha_peca --vw 1920 --vh 1080 --saida saida/minha_peca.mp4      (deitado)
```

Junte `--largura 540` (em pé) ou `--largura 960` (deitado) para um teste rápido em tamanho menor.

No vídeo deitado o quadro inteiro é seu: a página não fica em pé no meio com sobra dos lados.
A pasta nova não precisa de `npm install` de novo: o render copia o GSAP para ela sozinho e avisa em uma linha.
Se o render parar dizendo que a página pediu um arquivo que não existe, confira o caminho desse arquivo dentro do `index.html`.
