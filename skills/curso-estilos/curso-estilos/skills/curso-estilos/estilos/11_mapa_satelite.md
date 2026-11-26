# 11 · Mapa de satélite contado

> Vitrine: piloto "O Brasil mora na praia" (72 s) e prova muda do Chile (12 s) · Custo: só a voz (ElevenLabs, ~1.100 caracteres por tomada); mapa, ilustração e render R$ 0 · Ferramentas: skill `geo-tales` do pacote (three.js + camada 2D, Node + Chrome do sistema), IA de imagem local (Z-Image no ComfyUI) para as ilustrações, rembg, ElevenLabs, FFmpeg

## O que é
Vídeo de 60–80 s que responde um "por quê" de geografia em cima do mapa de satélite: a câmera voa sem parar, a região é pintada em cor viva com borda fina, entram rótulos limpos, pinos, réguas e 2–3 ilustrações pintadas. Estilo inspirado em canais de geografia contada em cima de mapa de satélite. Funciona porque a resposta se vê no mapa e ~70% do tempo é mapa em movimento.

**Este estilo já tem skill própria no pacote. Use a skill `geo-tales` e não reescreva o motor.** Este arquivo só diz quando usar, o que costuma dar errado e como ensinar.

## Exemplo e arquivos
- Prévia: `catalogo/previas/11.mp4` (capa: `catalogo/previas/11.jpg`).
- A skill irmã fica em `skills/geo-tales/` do pacote (a partir desta skill: `../geo-tales/`):
  - `SKILL.md` (ordem de produção e pontos de aprovação), `FORMATO.md` (roteiro, mapa, cor, texto, câmera), `MOTOR.md` (dados, cena, ilustração, voz, render)
  - `motor/` (o motor, com o demo de um comando: `motor/DEMO.md`)
  - `motor/demo/cena_demo.js` (a menor cena completa, 3 s) e `motor/exemplo/cena_brasil.js` (a cena inteira do piloto, para leitura)
  - `motor/exemplo/narracao.txt`, `prompts.txt`, `prepara.py`, `mix.py`, `FONTES.md` (o material do piloto)
  - `motor/exemplo/antes_depois.jpg` (o que mudou do rascunho para a versão refinada), `folha_recorte.jpg` (as 9 ilustrações), `v6_b.jpg` (ilustrações na cena)
  - Licenças do que vem no pacote: `motor/FONTES.md`

## Ferramentas e instalação
Tudo descrito no `MOTOR.md` da skill. Resumo:
- **Motor (grátis):** three.js (vendorizado) + camada 2D num HTML; render quadro a quadro pelo Chrome do sistema (puppeteer-core, sem baixar navegador) em CPU (SwiftShader). Não usa GPU. Precisa de Node 18+, Chrome/Edge e ffmpeg.
- **Mapa (grátis):** Blue Marble pelo GIBS WMS da NASA (sem chave, domínio público), Sentinel-2 cloudless de perto (CC BY 4.0, atribuição na descrição do post), Natural Earth e malhas do IBGE. O pacote traz um recorte pequeno; `node baixar_assets.mjs` busca a base cheia.
- **Ilustrações (grátis, opcional):** IA de imagem local (nos nossos testes, Z-Image no ComfyUI, ~12 s cada) + rembg para o recorte. Sem isso, o demo usa um cartão-placeholder.

**Neste setup:** gere as ilustrações com a skill `codex-image` (`../CODEX_IMAGE.md`): `python3 ~/.agents/skills/codex-image/scripts/codex_image.py "<brief>" -o assets/nome.png --aspect 1:1 --crop`. Salve em `assets/`, recorte (rembg, se quiser) e continue o pipeline. Sem elas, o demo segue com placeholder. Não é preciso subir o ComfyUI para essas aindas.
- **Voz (PAGA):** API ou site da ElevenLabs, com a sua chave. Voz do piloto: "Will - Dynamic Voiceover".

## Motor (na skill irmã)
Não há `motores/11/`: o motor mora em `../geo-tales/motor/` (index.html, render.mjs, legendas.py, voz.py, baixar_assets.mjs, vendor, dados do demo e a pasta exemplo). A base cheia do mapa (mundo em 8k, continente a 80 px por grau, Natural Earth) é pesada e não vem no pacote: o `baixar_assets.mjs` baixa das fontes oficiais.

## Passo a passo (ponta a ponta)
Comece pelo demo. Copie `../geo-tales/motor/` para a pasta do seu projeto e, dentro dela:
```
npm install
npm run demo        # saida/demo.mp4: 3 s, 540×960, mudo (~1 a 2 min em CPU; 14 s com `-- --gpu`, medido com RTX 4070 Ti 12 GB)
npm run quadros     # saida/quadros.jpg: 4 quadros parados em ~10 s
```
Depois siga a ordem da skill `geo-tales` (8 passos). O esqueleto:
1. Tema e fatos conferidos em fonte primária → `FONTES.md` do episódio.
2. Roteiro → aprovado antes de qualquer voz.
3. Dados do mapa (`baixar_assets.mjs` + `prepara.py` do episódio).
4. Ilustrações por IA de imagem → recorte → folha sobre fundo colorido, e olhar.
5. Cena muda com tempos estimados → **folha de quadros ao lado da referência** → aprovar a direção.
6. Voz: estimar o custo em caracteres; duas vozes para escolher de ouvido; uma tomada, sem acelerar.
7. Reancorar a cena na voz (tabela ANC), legendas pelos tempos reais, som.
8. Render, conferência com a skill `checar-video`, versão leve de celular para revisão.

Comandos (da pasta do episódio):
```
node render.mjs --cena cena_tema --times 4.4,19.6,27 --tw 540 --out prints/x.jpg   # quadro parado, ~10 s
node render.mjs --cena cena_tema --video saida/video.mp4                           # filme inteiro, CPU
node render.mjs --cena cena_tema --video saida/trecho.mp4 --de 24 --ate 31         # consertar só um trecho
python voz.py voz/narracao.txt voz/narr_A --voz ID_DA_VOZ --confirmo-custo         # PAGO; sem a flag só estima
python legendas.py voz/narr_A.words.json voz/caps.json "cento e onze=111"
```

## Pegadinhas medidas
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- **Render:** 12 s a 60 qps = 100 s de máquina; o filme de 72 s a 30 qps com desfoque = ~25 min; o demo de 3 s = ~1 min. Testar ideia sempre em quadro parado (10 s).
- **Polir movimento não resolve falta de refino.** Quatro versões do piloto saíram com cara de rascunho; o que destravou foi pôr quadro ao lado de quadro da referência e copiar o que faltava: texto limpo, cor viva com borda fina, ilustração pintada.
- **Cor escura:** `THREE.Color(hex)` sem conversão de saída escurece; o motor já converte.
- **Dados:** o servidor `eoimages` da NASA costuma não conectar; usar o GIBS WMS. No Windows o `curl` pode precisar de `--ssl-no-revoke`.
- **Emoji de bandeira** não renderiza no Chromium do Windows: usar SVG ou ilustração.
- **Z-Image:** sementes diferentes dão quase a mesma imagem (para variar, mudar o texto); sobra véu branco em vãos finos; personagem simples sai mais "vetor" que pintado.
- **Referência:** o TikTok trava sem login; estudar pelo YouTube do mesmo canal.
- **Celular:** 720p com crf 22 fica em ~27 MB para 72 s (cabe na maioria dos mensageiros).

## Custo e tempo
- **Pago:** só a voz, ~1 crédito por caractere. O piloto tem ~1.100 caracteres; com duas vozes para escolha, ~2.200 créditos. Estime antes de gerar (o `voz.py` mostra a conta e só gera com `--confirmo-custo`).
- **Grátis:** mapa, ilustrações em IA local, render, efeitos de um pack CC0 ou da sua biblioteca.
- **Tempo:** render ~25 min em CPU para 72 s, em segundo plano.
- **GPU:** só na geração das ilustrações. Uma tarefa de GPU por vez; quem sobe o ComfyUI desliga ao terminar. O render não usa GPU.

## O que funcionou e o que não funcionou
- **O formato fica de pé rápido.** A prova muda de 12 s (país pintado, voo, pinos, régua) já lê como o formato; o difícil é o refino.
- **A ilustração pintada é o que mais levanta o nível.** Ícone desenhado em código e emoji deixam a peça abaixo da referência, por mais que o movimento esteja bom.
- **Refino em quatro frentes ao mesmo tempo**: mapa e cores (cor viva, quase opaca, borda fina clara), texto (limpo, sem contorno grosso), desenhos (pintados) e câmera. Faltando uma, a peça parece rascunho.
- **Voz:** entre duas vozes geradas, ganhou a mais dinâmica (Will Dynamic). Narração em uma tomada, sem acelerar acima de 1,1× e sem sussurro; a cena se ajusta à voz, nunca o contrário.
- **Roteiro aprovado antes da voz**: voz é o único custo e refazê-la é o que mais atrasa.
- **Nenhum crédito na tela**: as atribuições (Sentinel-2 CC BY etc.) vão na descrição do post.
- **Nossa nota:** o piloto não está no nível das melhores referências do formato. Perde em roteiro (pouco gancho) e em câmera e ritmo; ganha em mapa, cor e ilustração depois do refino. A régua que usamos hoje é um reel de mapa com painel de dados, cartão de documento e etiqueta de preço, peças que este motor ainda não tem.

## Roteiro de aula
- **Objetivo:** o aluno sai sabendo produzir um vídeo de mapa com a skill: do "por quê" ao MP4, entendendo a cena como câmera + mundo(t) + tela(t).
- **Demonstração (~20 min):** (1) a prévia do piloto e um vídeo da referência lado a lado, 3 min; (2) rodar o demo e abrir `demo/cena_demo.js`, 4 min; (3) escrever 3 chaves de câmera e pintar outro país, tirando quadro parado a cada mudança, 6 min; (4) uma ilustração pintada: prompt, recorte, `T.img` no lugar do placeholder, 4 min; (5) a tabela ANC esticando a cena pela voz, 3 min.
- **Exercício:** 15 s mudos sobre a cidade ou o estado do aluno: câmera voa do país até a região, pinta a região, um rótulo e uma ilustração. Deu certo se: a câmera nunca para, o texto não tem contorno grosso, a tomada inclinada não mostra meio quadro de mar e a folha de 3 quadros ao lado da referência não envergonha.
- **Pré-requisitos:** aula de ComfyUI local (Z-Image), só para as ilustrações; aula de voz e orçamento.

## Limites conhecidos
- O demo cobre o motor (mapa, câmera, pintura, texto, pino, placeholder). A cena completa do piloto vem para leitura, mas não roda sem baixar a base cheia, gerar os dados, as 9 ilustrações e a voz.
- `baixar_assets.mjs` e `voz.py` foram escritos para o pacote e não foram executados no teste (um baixa ~16 MB da NASA, o outro é pago). O `prepara.py` do exemplo espera as malhas do IBGE já salvas em `dados/`.
- O roteiro do formato é a parte menos madura: a seção de roteiro da skill é um ponto de partida, não uma fórmula validada.
- Câmera e ritmo do piloto são fracos e não foram revistos.
- Faltam três peças que as melhores referências usam: painel de dados com barras, cartão de documento e etiqueta de preço.
- Trilha: o piloto saiu sem trilha. Efeitos sonoros e trilha não acompanham o pacote.
- Ilustrações dependem de IA de imagem (local com GPU, ou outro gerador); sem elas o vídeo fica com placeholder.
