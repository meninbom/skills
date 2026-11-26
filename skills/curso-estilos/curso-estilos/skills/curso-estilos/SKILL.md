---
name: curso-estilos
description: "Catálogo e receitas dos 28 estilos de vídeo vertical do curso, mais a checagem do vídeo (histórias 100% em código, IA + código, motion, ferramentas). Use quando o aluno pedir \"abre o catálogo\", \"quais estilos tem\", \"quero fazer um vídeo no estilo #25\" (ou pelo nome), \"meu PC roda isso?\", ou citar um estilo do curso (toon POV, DIA 1, boneco vetor, luta 2D, voxel, série com voto nos comentários, floresta low-poly, herói PBR, anime SVG, VRM, pixel, masmorra, what-if, cartoon 2D em mundo 3D, explicativo ilustrado, micro-doc, mapa de satélite, Roblox, HUD de RPG, câmera contínua, mapa mangá, corte 3D, globo, impact frame, poderes, Blockbench). Confere o PC, mostra o catálogo com prévias e encaminha para a skill do estilo escolhido (cada estilo tem a sua, com o código no nome, por exemplo `03-boneco-vetor`)."
---

Responda sempre em português do Brasil, em linguagem simples, como para quem está começando.

# curso-estilos

Esta é a skill mestre: **catálogo e checagem do PC**. Cada um dos 28 estilos tem a própria skill no mesmo plugin, com o código no nome (`03-boneco-vetor`, `25-mapa-manga`, `luta-2d`, `impact-frame`...). Depois que o aluno escolhe, quem conduz a produção é a skill do estilo. O mapa código → skill está em `catalogo/skills.json`, e o catálogo mostra o nome da skill ao lado de cada estilo.

Tudo fica na pasta deste arquivo (`${CLAUDE_SKILL_DIR}`): `estilos/` (29 receitas: os 28 estilos e a checagem), `OFICIO.md` (o que vale para qualquer estilo: roteiro, câmera, voz, som e entrega), `motores/<id>/` (código), `catalogo/` (lista + prévias de 15 s), `scripts/`. Se a variável acima não vier resolvida, ache a pasta procurando `scripts/checar_pc.mjs` dentro da pasta de plugins do Claude Code: `$CLAUDE_CONFIG_DIR/plugins` quando a variável de ambiente `CLAUDE_CONFIG_DIR` estiver definida; senão, `~/.claude/plugins`.

## Regras que não mudam

1. **Nunca instalar nada sem ok.** Diga o que é, o tamanho aproximado e de onde vem; espere o sim.
2. **Nada pago sem custo + ok.** Narração (ElevenLabs) ou qualquer API paga: diga o custo estimado antes e espere o sim. Sem resposta, entregue mudo.
3. **Recriar o estilo, não copiar a peça.** O tema, o personagem e a história são do aluno. As peças de exemplo servem para ensinar o ofício.
4. **Não tocar áudio no PC do aluno** sem ele pedir. Na página do catálogo nenhum vídeo toca sozinho: o aluno clica no play. As prévias com o selo "com som" tocam com som; as outras são mudas.
5. **Placa de vídeo: um trabalho por vez.** Antes de usar a GPU, confira se ela está livre.
6. **Não editar dentro da pasta do plugin.** Copie `motores/<id>/` para uma pasta nova do projeto do aluno e trabalhe lá.
7. **Conferir antes de entregar** com a skill `checar-video` (vem no pacote): MP4 1080×1920, `yuv420p`, mais uma versão leve para celular.

## 1º uso (e sempre que o aluno pedir "confere meu PC")

```
node "${CLAUDE_SKILL_DIR}/scripts/checar_pc.mjs"
```

Só lê: sistema, memória, disco livre, placa de vídeo e quais programas já existem. Grava `~/.curso-estilos/pc.json`. (Outra pasta de dados: variável de ambiente `CURSO_ESTILOS_DADOS`.) Não tem Node? Confira à mão (`ffmpeg -version`, `python --version`, `nvidia-smi`) e ofereça instalar o Node, com ok.

## Catálogo

```
node "${CLAUDE_SKILL_DIR}/scripts/catalogo.mjs" --abrir
```

**Use sempre o `--abrir`.** Ele abre a página das prévias no navegador padrão do computador (Chrome, Edge, Safari), que é onde os vídeos tocam. Não mande o aluno clicar no link do arquivo dentro do app, nem abra a página no painel de visualização do app: ali as prévias não carregam. Diga ao aluno: "A página abre no seu navegador. Se ela abrir dentro do app, os vídeos não tocam: abra o arquivo `catalogo.html` no Chrome ou no Edge." O caminho completo do arquivo sai na última linha do comando.

Imprime a lista com a situação de cada estilo neste PC e grava `~/.curso-estilos/catalogo.html` com as prévias (copiadas para `~/.curso-estilos/previas/`, para a página continuar funcionando depois de uma atualização do plugin). Nada toca sozinho: o aluno clica no play. Mostre a lista no chat e pergunte qual o aluno quer.

**Cada estilo é chamado pelo código dele**, que é o mesmo do e-book e do Replicar: `#03`, `#25`, `#61`, `#luta`, `#impact`, `#100`. Os códigos não são sequenciais (não existe "estilo 1, 2, 3...") e é assim mesmo. Os estilos aprendidos pelo Replicar ganham `#201`, `#202`... Quando o aluno disser um número, é o código: "o 25" é o `#25` (Mapa que vira mangá), nunca "o 25º da lista". Na dúvida, confirme pelo nome. Para abrir um estilo pelo código:

```
node "${CLAUDE_SKILL_DIR}/scripts/catalogo.mjs" --estilo 25
```

Aceita `#25`, `25`, `3` (= `#03`), `luta`. Devolve o nome, a situação no PC, o caminho da receita, o do motor e a aula.

Situações: **roda no seu PC** · **precisa instalar X (~N min)** · **precisa de placa forte**. Marcas: **v1** (completa) · **beta** (trecho manual ou resultado abaixo da referência) · **avançado** (GPU ≥ 12 GB + ComfyUI). Diga a marca ao aluno antes de começar um beta.

## Estilo em destaque: `#100`, série diária com voto nos comentários

Ao mostrar o catálogo, apresente o `#100` primeiro e diga que é o estilo em destaque: é o formato que mais engaja hoje (o público comenta uma palavra e o voto vira o episódio do dia seguinte), e a skill dele, `100-serie-voto`, traz o guia de roteiro tirado do estudo de mais de 100 vídeos do formato. O catálogo já lista ele no topo, com a marca "★ DESTAQUE". Se o aluno não souber por onde começar, sugira este.

## Fluxo depois que o aluno escolhe

**Passe para a skill do estilo** (o `--estilo` acima mostra o nome dela na linha `skill:`). Ela traz o mesmo fluxo abaixo já com os caminhos daquele estilo. Se por algum motivo a skill do estilo não estiver disponível, siga o fluxo aqui mesmo:

1. Ler a receita inteira: `estilos/<arquivo>` (o `--estilo` acima dá o caminho; é o campo `arquivo` em `catalogo/estilos.json`).
2. **Instalar só o que falta** para esse estilo, um item por vez, com ok. Depois rodar `checar_pc.mjs` de novo.
3. **Ler o `OFICIO.md`** (nesta pasta) antes do roteiro: roteiro, câmera, voz, som e entrega, com os números e o porquê de cada um. Ler de novo a seção 4 antes da mixagem.
4. **Perguntar o tema do aluno** (assunto, personagem, tom, duração; padrão 20–30 s) e **propor 3 ideias bem diferentes**, cada uma em 2 linhas, antes de escrever. Aplicar o teste do genérico: se dá para trocar o assunto e a animação continuar a mesma, a ideia é genérica.
5. **Roteiro em texto corrido, aprovado antes de produzir.** Cada fato com 2 fontes anotadas. Pedido ao espectador só com motivo real dentro da história.
6. Copiar `motores/<id>/` para a pasta do aluno, rodar o demo (`DEMO.md`) e seguir o "Passo a passo" da receita, trocando o conteúdo pelo tema dele.
7. **Aprovar por quadros antes do render completo:** uma folha de 6 a 9 quadros numerados para o aluno aprovar; depois só o trecho mais difícil (uns 5 s); só então o vídeo inteiro.
8. **Nunca gravar por cima de uma versão:** cada versão ganha nome novo (`v2`, `v3`) e a antiga vai para `_antigo/`.
9. Voz: opcional. Custo + ok antes; sem ok, fica mudo.
10. Conferir (`checar-video`), entregar o MP4 e a versão de celular.
11. Apontar a aula: campo `aula` do estilo em `catalogo/estilos.json`.

## Como ler as receitas

- Cada receita tem: o que é, exemplo, ferramentas, motor, passo a passo, pegadinhas medidas, custo e tempo, o que funcionou e o que não funcionou, roteiro de aula e limites conhecidos.
- `motores/<id>/` está neste pacote. Cada motor tem um `DEMO.md` com UM comando que renderiza poucos segundos mudos: rode o demo primeiro, na cópia que você fez na pasta do aluno, para provar que o ambiente está de pé antes de trocar o conteúdo.
- Arte de terceiros que não pode ser redistribuída (sprites, bonecos, música) não vem: o demo usa substituto e o `DEMO.md` diz onde o aluno coloca a dele. Assets livres vêm com `FONTES.md` (origem e licença) ou com um script que baixa da fonte oficial.
- Scripts de voz ou de qualquer serviço pago só rodam com a chave do aluno e depois da regra 2.
- Estilo marcado **beta** no catálogo: leia "Limites conhecidos" e diga ao aluno o que é manual antes de começar.

## Os 99 estilos extras

Além dos 28 estilos do curso, o catálogo lista mais 99: os estilos `#101` a `#199`. Eles vêm de uma biblioteca gratuita de terceiros e são conduzidos pela skill `99-estilos`, que traz as nossas notas, a prévia de cada um e os nossos ajustes (vertical, voz grátis, câmera). O aluno pede do mesmo jeito que os outros: "faz o estilo 196 sobre…", ou pelo nome ("aquarela", "vitral"). Não têm receita nem motor na pasta `estilos/`: o `--estilo 196` mostra o que existe e aponta a skill.

## Estilo #06 (série em massinha)

O `#06` não está neste catálogo: ele fica no plugin `serie-lumen`, do mesmo pacote (skill `estilo-06`). Se o aluno pedir série em massinha, isekai de massinha ou série com escolha em vários episódios, diga isso e, se o plugin não estiver instalado, oriente o aluno a abrir uma conversa na pasta do curso e pedir "instala também o módulo da série".

## Avisos de licença (dizer ao aluno quando o estilo usar)

- Remotion (`#74` What-if em desenho 2D, `#75` Cartoon 2D em mundo 3D, `#08` Micro-doc com personagem fixo): grátis até empresa de 3 pessoas.
- Sprites do `#60` (Pixel de jogo indie): não vêm no pacote; baixar da página do artista ou usar os do aluno.
- OpenStreetMap (`#25` Mapa que vira mangá): crédito na legenda do vídeo.
- Assets CC0 (KayKit, Poly Haven, Effekseer): livres, mas baixados pelo aluno.

## Estilos que apontam para outra skill

- `#29` (Checagem objetiva do vídeo) → skill `checar-video` (no pacote). É o único item do catálogo sem skill com o código no nome.
- `#11` (Mapa de satélite contado) → a skill `11-mapa-satelite` é a entrada e o motor fica na skill `geo-tales` (no pacote).
- `#27` (Efeito de golpe) → vem com um conjunto pequeno de efeitos; a receita explica como montar a biblioteca completa.
