# curso-estilos

Plugin do Claude Code com os 28 estilos de vídeo do curso e a checagem do vídeo: uma skill, uma receita, um motor (código) e uma aula para cada.

## Instalar

O caminho é o app **Claude** no computador, aba **Code**: abra uma conversa escolhendo a pasta do curso (a que tem o `LEIA-ME.md`) e escreva **instala o curso**. O Claude faz a instalação e pede a sua permissão em cada passo. Depois abra uma conversa nova e peça **quais estilos tem?** O passo a passo completo está no `LEIA-ME.md` da pasta do curso.

O mesmo pacote traz um segundo plugin, opcional: `serie-lumen`, o módulo especial de série de história com escolha nos comentários (inclui o estilo 06, a série em massinha). Para instalar, peça na pasta do curso: **instala também o módulo da série**.

## Como as skills estão organizadas

- `curso-estilos`: a skill mestre. Confere o PC e mostra o catálogo com as prévias.
- **Uma skill por estilo**, com o código do e-book no nome: `01-toon-pov`, `03-boneco-vetor`, `25-mapa-manga`, `60-pixel-indie`, `luta-2d`, `impact-frame`, `100-serie-voto`... São 28. Digite `/` e o código para achar, ou peça pelo nome ("quero um vídeo de boneco 2D").
- `replicar`: você manda um vídeo de referência, ele descobre qual estilo é e passa para a skill daquele estilo.
- `checar-video`: a checagem técnica do vídeo pronto (é o `#29` do e-book).
- `geo-tales`: o motor de mapa usado pelo `#11`.

## O que acontece no primeiro uso

1. O plugin confere o seu PC (placa de vídeo, memória, disco, programas instalados). Não instala nada.
2. Abre o catálogo com a prévia de 15 s de cada estilo e diz, para cada um: roda no seu PC, precisa instalar algo ou precisa de placa forte.
3. Você escolhe pelo código do estilo, o mesmo do e-book (por exemplo `#25`). Só então ele pede seu ok para instalar o que faltar para aquele estilo.

## O que vem e o que não vem

- Vem: receitas, código dos motores, prévias, checagem técnica de vídeo (`checar-video`) e o motor de mapa (`geo-tales`).
- Não vem: programas externos (Node, FFmpeg, Python, Blender, ComfyUI, modelos de IA, Roblox Studio, Blockbench) e arte de terceiros (sprites, modelos 3D, texturas). Cada receita diz de onde baixar e qual a licença.
- Pago, sempre opcional e sempre com aviso de custo antes: narração (ElevenLabs). Todo estilo fecha mudo sem gastar nada.

## Licenças de terceiros que você precisa conhecer

- **Remotion** (estilos `#74`, `#75` e `#08`): grátis para pessoa e para empresa de até 3 pessoas; acima disso exige licença paga.
- **Sprites do estilo `#60`**: a licença do artista proíbe redistribuir; baixe direto da página dele ou use os seus.
- **OpenStreetMap** (estilo `#25`): crédito "© OpenStreetMap contributors" na legenda do vídeo.

## Marcas no catálogo

- **v1**: receita completa, roda sem placa de vídeo forte.
- **beta**: funciona, mas tem trecho manual ou o resultado ainda fica abaixo da referência; a receita diz onde.
- **avançado**: precisa de placa de vídeo com 12 GB ou mais e de ComfyUI.
