---
name: 99-estilos
description: "Estilos #101 a #199 do curso: mais 99 estilos de filme feito 100% em código, a partir da biblioteca gratuita Lemo-Opuscar, com o nosso jeito de usar: instalação, conferência do PC, catálogo com a nossa nota e prévia de cada um, saída vertical 9:16, voz grátis em português, empurrão de câmera e checagem. Use quando o aluno pedir um estilo com código de 101 a 199 (\"faz o estilo 196 sobre X\", \"estilo #183\"), ou disser \"99 estilos\", \"os estilos extras\", \"quero um filme em aquarela\", \"estilo watercolor\", \"vitral\", \"instala os 99 estilos\", \"quais são os estilos extras\". NÃO use para os estilos de #01 a #100, #luta e #impact: esses têm a skill deles."
---

Responda sempre em português do Brasil, em linguagem simples, como para quem está começando.

# Estilos #101 a #199 (biblioteca Lemo-Opuscar)

O Lemo-Opuscar é uma biblioteca gratuita, feita por terceiros, com 99 estilos de filme: aquarela, vitral, quadro-negro, satélite, mangá, osciloscópio e por aí vai. Você escolhe um, traz a sua história, e o Claude escreve o filme inteiro em código, sem geração de vídeo por IA. Nós fizemos um filme original em cada um dos 99 para saber como cada estilo se sai, e esta skill é o que aprendemos: como instalar, quais renderam mais e o que ajustar para o vídeo sair pronto para o celular.

**No curso eles são estilos como os outros, com os códigos `#101` a `#199`.** O código é 100 mais a posição do estilo na biblioteca: o 96º estilo dela (aquarela) é o `#196`. Eles aparecem no catálogo do curso, com a prévia do nosso filme de teste, e o aluno pede do mesmo jeito que pede qualquer estilo: "faz o estilo 196 sobre…".

Tudo fica na pasta deste arquivo (`${CLAUDE_SKILL_DIR}`):

- `CATALOGO.md`: os 99 estilos com o código (`#101` a `#199`), o nome na biblioteca, o título do nosso filme de teste e a nossa nota.
- `previas/`: 6 segundos mudos do nosso filme em cada estilo (`previas/196.mp4`). Para ver como cada estilo fica, a biblioteca tem uma galeria oficial com um filme de exemplo de cada um: `lemomo-ai.github.io/lemo-opuscar`.
- `kit/empurrao_camera.py`: tira a "tela parada" de um filme pronto.
- `kit/LEIA.md`: o passo a passo dos nossos ajustes (vertical, voz, câmera, versão de celular).

## O que é de quem (leia uma vez)

- **A biblioteca não vem neste pacote.** Ela é baixada do endereço oficial, de graça: `github.com/lemomo-ai/lemo-opuscar`.
- **O código dela é livre (licença MIT)** e os filmes que você faz com ela são seus.
- **Os textos que descrevem cada estilo são de uso não comercial** (licença CC BY-NC 4.0). Por isso eles não estão aqui dentro, e você não deve copiar, revender nem redistribuir esses textos. Usar a biblioteca para fazer os seus vídeos é outra coisa, e é permitido.
- **Três estilos desenham os personagens com um gerador de imagem** (`#116` `comic-history`, `#147` `manga-panels`, `#188` `text-flash-cuts`). Neste setup, use a skill `codex-image` (veja a seção "Imagens com codex-image" abaixo). Não é preciso ter ComfyUI nem API paga.
- Esta skill é a nossa camada por cima: o catálogo com notas, os ajustes e o kit.

## 1. Conferir o PC

A biblioteca pede **Node 20 ou mais novo, FFmpeg 7 ou mais novo e Python 3.11 ou mais novo**. Confira:

```
node --version
ffmpeg -version
python --version
node "${CLAUDE_SKILL_DIR}/../curso-estilos/scripts/checar_pc.mjs"
```

O último comando é a conferência do curso: ele diz se o PC tem placa de vídeo. **Sem placa de vídeo, a maior parte dos estilos funciona** (os desenhados em 2D). Os estilos em 3D ficam lentos ou param no meio: veja "Sem placa de vídeo" mais abaixo e o aviso no `CATALOGO.md`.

Instale só o que faltar, um item por vez, dizendo o que é e o tamanho, e só com o ok do aluno.

## 2. Instalar a biblioteca (uma vez)

Diga ao aluno o que vai acontecer: os comandos abaixo baixam a biblioteca do site oficial dela. Na primeira vez que fizer um filme, ela baixa os guias e as ferramentas para a pasta `lemo-opuscar` dentro da pasta de usuário. Espere o ok.

O caminho mais simples é instalar a biblioteca como plugin do Claude Code. Use o mesmo programa `claude` que instalou o curso (se o comando `claude` não existir no terminal, é o que vem dentro do app):

```
claude plugin marketplace add lemomo-ai/lemo-opuscar
claude plugin install lemo-opuscar@lemolab
```

Depois, **peça ao aluno para abrir uma conversa nova**: o plugin só aparece em conversas abertas depois da instalação.

Para a voz grátis em português, instale também o pacote de voz da biblioteca (cerca de 350 MB do modelo de voz, com ok). Quem instala é a própria biblioteca, quando você pede narração; se ela perguntar, diga que quer a voz local.

## 3. Como o aluno pede

O aluno diz o estilo, pelo código ou pelo nome, e o assunto:

> faz o estilo 196 sobre a feira de domingo da minha cidade

Para achar o estilo pelo código:

```
node "${CLAUDE_SKILL_DIR}/../curso-estilos/scripts/catalogo.mjs" --estilo 196
```

Ele devolve o nome do estilo na biblioteca (`watercolor`), o título e a nota do nosso filme e o caminho da prévia.

Antes de passar o pedido para a biblioteca, faça três coisas:

1. **Ache o estilo** (comando acima ou `CATALOGO.md`) e diga ao aluno o nome dele e a nossa nota. No pedido para a biblioteca vai o **nome** (`watercolor`), nunca o código do curso: a biblioteca não conhece os nossos códigos. Se a nota for 5,5 ou menos, ou se o estilo pede placa de vídeo e o PC não tem, avise e sugira um parecido que rendeu mais.
2. **Feche o roteiro com o aluno**: proponha 3 ideias diferentes, escreva o texto e espere o ok. Os números e o porquê estão no `../curso-estilos/OFICIO.md`.
3. **Monte o pedido com os nossos ajustes** (o porquê de cada um está no `kit/LEIA.md`):

> Faça um filme no estilo **watercolor** sobre [assunto]. Formato **vertical, 1080×1920, 30 quadros por segundo**. Narração em **português do Brasil**, com a voz local `pm_alex` em velocidade normal, lendo este texto: [texto aprovado]. Componha cada quadro para a tela em pé, com um elemento principal grande, e não deixe a tela parada por mais de 1,5 s.

Então use a skill da biblioteca (`lemo-opuscar`) com esse pedido. Um filme leva de 30 a 60 minutos de trabalho do Claude.

## 4. Os nossos ajustes, em ordem

1. **Vertical.** A biblioteca sai em 16:9 por padrão. Peça 1080×1920 desde o começo, porque cada quadro precisa ser composto para a tela em pé; virar depois corta o desenho.
2. **Voz grátis.** A voz local `pm_alex` (masculina) em português; `pf_dora` quando o texto pedir voz feminina. Sem acelerar. Se o aluno preferir, ele grava a própria voz, ou usa um serviço pago com a conta dele, sempre com o custo dito antes e o ok.
3. **Um quadro de cada cena antes do filme inteiro.** Peça os quadros parados e mostre ao aluno numa folha numerada. Só depois renderize tudo.
4. **Empurrão de câmera.** Quase todos os nossos 99 filmes reprovaram na primeira checagem por "tela parada". Rode a checagem, e depois:
   ```
   python "${CLAUDE_SKILL_DIR}/kit/empurrao_camera.py" FILME/index.html PASTA_DA_CHECAGEM/qa.json
   ```
   e renderize de novo. Melhor ainda é pedir movimento já no pedido (item 3 da seção anterior).
5. **Checagem.** Passe a skill `checar-video` no arquivo final. Um aviso é esperado: a comparação "fala × roteiro" acusa diferença quando o texto tem número escrito por extenso. Confira no olho antes de refazer a voz.
6. **Versão de celular**, para mandar e conferir:
   ```
   ffmpeg -y -i final.mp4 -vf scale=720:1280 -c:v libx264 -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -ar 48000 -movflags +faststart final_celular.mp4
   ```

## Sem placa de vídeo

- **Estilos em 2D:** rodam normalmente.
- **Estilos em 3D ou com terreno real:** sem placa, o desenho é feito pelo processador e cada quadro demora; no nosso teste dois estilos pararam no primeiro quadro, três vezes seguidas. Para forçar o desenho pelo processador, defina `LEMO_ANGLE=swiftshader` antes de renderizar. Se o filme tem mais de alguns segundos, prefira outro estilo.
- **Com placa de vídeo:** não precisa definir nada, a biblioteca usa a placa sozinha. Só confira que a variável `LEMO_ANGLE` não ficou definida como `swiftshader` de um teste anterior. Com placa, os dois estilos pesados saíram em cerca de 20 segundos cada.

## Pegadinhas medidas

- **No máximo 2 renders ao mesmo tempo.** Com mais que isso o PC trava e os renders estouram o tempo. A biblioteca tem uma trava para isso: defina `RENDER_SLOTS=2`.
- **Tela parada** é o defeito mais comum. Peça movimento no pedido e use o empurrão de câmera.
- **A voz local lê melhor frases inteiras.** Frase de uma ou duas palavras vira pausa.
- **A nota do catálogo é do nosso teste**, com roteiro e prazo curtos. Estilo com nota baixa costuma pedir mais rodadas de correção, não é estilo ruim.
- **O empurrão de câmera não funciona** quando o filme cria o `canvas` por um módulo, em vez de ele estar no HTML. O script avisa e não mexe; peça o movimento dentro do código do filme.
- **Não copie os textos de estilo** da biblioteca para outro lugar, nem para o seu projeto de curso ou produto: eles são de uso não comercial.



## Imagens com `codex-image` (`#116`, `#147`, `#188`)

Quando a biblioteca pedir imagens geradas para um desses três estilos, **use a skill `codex-image`**, não outro gerador e não uma API paga.

1. Leia o guia `../curso-estilos/CODEX_IMAGE.md` e o `SKILL.md` em `~/.agents/skills/codex-image/`.
2. Escreva o brief em inglês e gere **uma imagem por vez**:

```bash
python3 ~/.agents/skills/codex-image/scripts/codex_image.py "<brief>" -o assets/nome.png --aspect 9:16 --crop
```

Para `#116` e `#147`, `--aspect 2:3` também serve (painel/personagem). Use `--ref` quando precisar manter o mesmo personagem.
3. Salve em `assets/` da pasta do filme, **passe esses arquivos no pedido à biblioteca** e continue o pipeline da skill (vertical, voz, câmera, checagem).
4. A geração consome a cota do Codex. Antes de um lote, rode o script com `--quota` e avise o aluno. Se a cota acabar, pare.

Não copie os textos de estilo da biblioteca (CC BY-NC 4.0) para o brief: use o assunto do aluno e o nome do estilo.

## Regras de sempre

- Nada instalado sem ok. Nada pago sem dizer o custo antes e esperar o sim.
- Não abra nem toque mídia com som no PC do aluno sem ele pedir.
- Nunca grave por cima de uma versão: `v2`, `v3`, e a antiga vai para `_antigo/`.
- Entrega em MP4 1080×1920, `yuv420p`, mais a versão de celular.
