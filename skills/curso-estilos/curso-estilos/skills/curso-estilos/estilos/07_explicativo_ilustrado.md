# 07 · Explicativo ilustrado ("Rios voadores")

> Vitrine: "O maior rio da Amazônia corre no céu", filme de 63 s, nota 8+ nos quadros · Custo: só a voz (~1.000 caracteres de narração por tomada); arte e render R$ 0 · Ferramentas: modelo de imagem com referência de estilo (Google Flow / Nano Banana), Real-ESRGAN, canvas HTML + Chrome (puppeteer-core), ElevenLabs, FFmpeg

## O que é
Explicativo de ciência no ofício do Kurzgesagt (estilo inspirado em): mundo ilustrado chapado e colorido, um mascote (Oxi, a molécula de água) que atravessa a explicação, câmera sempre com destino e transição por objeto. A arte nasce num modelo de imagem com quadros de referência de estilo; o código recorta os personagens em sprites e anima tudo em camadas, no tempo da voz. Funciona porque separa o que cada um faz bem: a IA desenha no nível de ilustrador, o código garante movimento determinístico e consistência.

## Exemplo e arquivos
- Prévia do estilo: `catalogo/previas/07.mp4` (e a capa `catalogo/previas/07.jpg`).
- Demo que roda sozinho: `motores/07/DEMO.md` (3 s, com arte-substituta desenhada por código).
- Material de ensino dentro do motor:
  - `motores/07/ESTILO.md`: a medição da referência (colorido, saturação, matiz da sombra) e as regras que saem dela.
  - `motores/07/exemplo_rio_voador/filme_A.html` + `cenas.js`: as cenas de um filme de 55 s escritas no motor (roda com substitutos no lugar da arte).
  - `motores/07/exemplo_rio_voador/TIMELINE.json`, `mix_conf.json`, `MIX.md`: eventos do filme e a receita do som.
  - `motores/07/TRILHA_PROMPTS.md`: prompts de trilha com o mapa do roteiro.

## Ferramentas e instalação
- **Node 18+, Google Chrome e FFmpeg** (render). `npm install` dentro da pasta do motor instala só o `puppeteer-core`, que usa o Chrome que você já tem (variável `CHROME_PATH` se ele estiver fora do lugar padrão).
- **Python 3 + `pip install -r requirements.txt`** (numpy e opencv): só para medir quadros e recortar folhas.
- **Modelo de imagem com referência de estilo:** a peça usou o Google Flow com o Nano Banana Pro. Na conta usada, imagem não descontou créditos e o modelo Pro tinha cota diária (~12 imagens), caindo depois para um modelo menor. Preço e cota mudam: confira no seu plano. Serve qualquer modelo que aceite imagens de referência.
- **Real-ESRGAN (grátis):** modelo animevideov3 para arte vetorial (borda limpa). Usa a placa de vídeo: uma tarefa de GPU por vez.
- **ElevenLabs (PAGO):** a API, com a sua chave na variável `ELEVENLABS_API_KEY`. O script `gerar_voz.mjs` só gera com `--confirmo-custo`.
- **Não é HyperFrames:** o filme roda num canvas próprio com `seek(t)`. Dá para portar, mas a receita medida é esta.

## Motor (dentro do plugin)
Em `motores/07/` (~115 KB, sem contar o `node_modules`):
- `motores/07/motor/motor.js`: a base. Canvas 1080×1920, função pura do tempo, expõe `window.seek(t)`, `READY` e `END`. Traz placa com câmera (`plate`), sprite (`spr`, `wspr`), curvas de animação (`kf`, `spring`, `back`), caminho suave (`path`), etiquetas (`sign`, `etiqueta`) e transições (`mix`, `whip`, `zoomThru`). Imagem que falta vira um substituto com o nome escrito.
- `motores/07/render.mjs`: abre a página no Chrome, chama `seek(t)` quadro a quadro e grava MP4 (`--video`), folha de quadros parados (`--folha --times`) ou um quadro (`--quadro --t`). Opção `--blend` para subquadros.
- `motores/07/demo.mjs` + `motores/07/demo/`: o filme-demo e a arte-substituta por código.
- `motores/07/exemplo_rio_voador/`: cenas reais de um filme (sem a arte) e a receita do som.
- `motores/07/utilitarios/recortar_folha.py`: folha no magenta → sprites com alpha + índice numerado. `recorte_chroma.py`: recorte de uma imagem só. `medir.py`: colorido, saturação, regiões e matiz da sombra de um quadro.
- `motores/07/gerar_voz.mjs`: voz em uma tomada com tempos por palavra (PAGO). `motores/07/mixar.mjs`: voz + trilha com duck e medição.

Não vem no pacote: as ilustrações do filme (placas, sprites, ampliações), a trilha e a voz. O demo e o exemplo rodam com substitutos; a arte você gera no passo 3.

## Passo a passo (ponta a ponta)
Copie `motores/07/` para a pasta do seu projeto e trabalhe dentro dela.

0. **Rode o demo** para ver o motor de pé:
   ```
   npm install
   npm run demo
   ```
   Sai `saida/demo.mp4` (3 s). Abra `demo/filme_demo.html` e leia as duas cenas: é o molde do seu filme.
1. **Tema e fatos** com fonte primária; roteiro de ~160 palavras e plano de cenas. **Portão 1: o roteiro é aprovado por quem encomendou (ou por você, lido em voz alta)** antes de voz e de render.
2. **Referência de estilo:** 4 quadros da referência (cenas de clima diferente). Medir com:
   ```
   python utilitarios/medir.py quadro.png
   ```
   Alvo medido: colorido ~160, saturação ~0,76, sombra puxando para o violeta (238–283°).
3. **Arte no modelo de imagem:** com os 4 quadros anexados como estilo, pedir primeiro a ficha do mascote; depois, com a ficha como trava, uma imagem por pedido: placas de cada cena SEM personagem, folhas de poses e de figurantes no fundo magenta chapado, props no magenta. Baixar na resolução cheia (na peça: 768×1376).
4. **Ampliar 3×** no Real-ESRGAN animevideov3 (2304×4128). Uma tarefa de GPU por vez.
5. **Recortar as folhas:**
   ```
   python utilitarios/recortar_folha.py folha.jpg arte/sprites pose
   ```
   Olhar o índice numerado (`pose_indice.jpg`) antes de usar.
6. **Quadros-chave + portão 2:** montar 3 quadros no nível final e comparar lado a lado com a referência. A estética é aprovada em quadros parados numerados, antes de animar.
7. **Voz (PAGA):** veja a contagem de caracteres (rodar sem `--confirmo-custo` só conta), decida, e então uma tomada, 1,0×, normalizada a −16 LUFS:
   ```
   node gerar_voz.mjs narracao.txt voz/narr --voz ID_DA_SUA_VOZ --confirmo-custo
   ```
8. **Animar pela voz:** cada cena é placa + sprites com câmera motivada e acting de recorte (antecipação, squash no pouso, estica na subida). Os tempos vêm das palavras da tomada (`voz/narr.words.json`). Testar em quadro parado:
   ```
   node render.mjs meu_filme/filme.html --folha saida/folha.jpg --times 4.5,14.5,25,42.8,52.3
   ```
9. **Render** (30 qps, 1080×1920, mudo):
   ```
   node render.mjs meu_filme/filme.html --video saida/filme_mudo.mp4 --fps 30
   ```
10. **Som:** escrever o `mix_conf.json` (voz na frente, trilha ~11 dB abaixo, drop no evento visual; modelo em `exemplo_rio_voador/`) e rodar:
    ```
    node mixar.mjs meu_filme/mix_conf.json
    ```
11. **Entrega:** MP4 1080 yuv420p + uma versão 720p para ver no celular, quadros numerados, e a skill `checar-video` do pacote com o roteiro.

## Pegadinhas medidas
- **Densidade (vale para todo explicativo):** cerca de 45 substantivos concretos por minuto, e cada um vira um objeto na tela no instante em que a palavra é dita; a tela sabe mais que a voz (nome, data, número); a família visual troca a cada 5 a 8 s; o primeiro evento visual entra até 0,4 s. O porquê de cada número está no `../OFICIO.md`.
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- **Código puro empacou em 7,5.** Três rodadas desenhando tudo em canvas: 6, depois 6,5–7, depois 7–7,5. Com modelo de imagem + referência de estilo: 8 / 8,5 / 8 nos três quadros-chave. Desenho no nível de ilustrador não sai de código em tempo razoável.
- **A primeira versão tinha metade do colorido da referência** (69–88 contra 158–172) e sombra no mesmo matiz do objeto.
- **Densidade demais mata o foco:** 135 regiões por 100k contra 56–80 da referência. A referência tem 2–4 personagens grandes (10–25% da área cada); nós tínhamos 20–30 com 1–4%.
- **Chroma verde não serve em mundo verde:** usar magenta. Chave: min(R,B) − G > 60, pena de 1,5 px, dilatar 9 px para juntar pés e gotas soltas.
- **O modelo de imagem devolve contorno fino e brilho** mesmo pedindo sem. Uma cena saiu com um BOI no lugar do mascote: conferir cada imagem.
- **Uma imagem por pedido.** Lote num prompt só baixa a qualidade e solta a estética.
- **Render:** capturar JPEG no lugar de PNG deixou ~4× mais rápido: 3 filmes de ~55 s em paralelo em ~5 min (com placa de vídeo). O filme de 63 s tem 1.890 quadros a 30 qps.
- **Trilha:** corte automático que pula compasso (semelhança 0,17) se ouve. Rodar a faixa direto e casar o drop com o evento (drop em 52,34 s = o mascote cai na caixa d'água).
- **Números do mix da peça:** master −13,3 LUFS, pico −1,6 dBTP, no celular −19,8, trilha 11 dB abaixo da voz (pior janela 7,2 dB), transcrição 100%.
- **Parado:** um dos filmes tinha 2,1 s sem movimento e foi refeito; nada parado acima de 1,5 s.
- **A página tem que morar dentro da pasta do motor:** o `render.mjs` serve essa pasta por um servidor local; arte fora dela não carrega.

## Custo e tempo
- **Pago:** só a voz, ~1.000 caracteres por tomada (≈ 1.000 créditos na ElevenLabs; refazer a tomada dobra). Ponha um teto antes de começar.
- **Grátis:** ampliação, recorte, render, mix. A arte depende do plano do seu modelo de imagem (na peça não descontou créditos).
- **Tempo:** animação ≈ 1 dia de código (estimativa); render ~5 min com placa de vídeo (por software é bem mais lento: o demo de 3 s leva ~25 s). O tempo de arte no modelo de imagem não foi medido.
- **GPU:** só no Real-ESRGAN. Não rode junto com outra tarefa pesada de GPU.

## O que funcionou e o que não funcionou
- **Funcionou:** a arte vinda do modelo de imagem com referência de estilo (o estômato, o céu brilhante, a careta da gota batendo nos Andes foram os quadros mais elogiados). O look ficou no nível.
- **Não funcionou, roteiro:** a primeira versão reaproveitava uma fórmula pronta e soou genérica; a segunda ficou com narração monótona. Roteiro novo se aprova antes de gastar voz e render, porque trocar depois refaz tudo.
- **Não funcionou, composição e sequência:** cenas bonitas que não se ligavam. Câmera contínua precisa conectar as cenas por um objeto ou movimento; sem isso vira troca de slide.
- **Não funcionou, trilha:** faixas escolhidas por descrição (e não de ouvido) foram reprovadas duas vezes. Trilha se escolhe ouvindo, sozinha, antes da mix.
- **Regras que ficaram:** o movimento segue a voz (nunca espremer a fala para caber na animação); em estudo de réplica vale usar glow, gradiente e o que a referência usar, menos cópia literal de personagem ou composição; nenhum crédito ou marca d'água na tela.
- **Nossa nota:** 8 a 8,5 nos quadros parados; o filme inteiro fica abaixo disso por roteiro e trilha. A versão 100% em código parou em 7,5.

## Roteiro de aula
- **Objetivo:** o aluno sai sabendo tirar ilustração consistente de um modelo de imagem usando quadros de estilo, transformar folhas em sprites e animar camadas em código no tempo da voz.
- **Demonstração (~30 min):** (1) código puro × modelo de imagem lado a lado e por que o código parou em 7,5, 4 min; (2) medir a referência (colorido, sombra violeta), 4 min; (3) no modelo de imagem: ficha do mascote, placa sem personagem e folha de poses no magenta, 8 min; (4) recorte e índice de sprites, 4 min; (5) uma cena no motor: placa, sprite, câmera, squash, e o quadro parado saindo em segundos, 7 min; (6) o drop da trilha casado com o evento, 3 min.
- **Exercício:** um explicativo de 15 s com 2 cenas ligadas por uma transição de objeto, mascote próprio. Deu certo se: o mascote é o mesmo nas duas cenas, nenhum sprite tem franja magenta, nada fica parado mais de 1,5 s e o movimento começa na palavra certa da voz.
- **Pré-requisitos:** aula do modelo de imagem (anexar referência, baixar em resolução cheia); aula de voz e orçamento; noção de canvas ou HyperFrames.

## Limites conhecidos
- O demo usa arte-substituta por código: prova o motor, não a estética. O nível 8+ depende da arte que você gerar.
- O roteiro da peça de vitrine nunca chegou a um resultado aprovado; a receita garante o visual, não a história.
- A trilha depende de escolha de ouvido; não há seleção automática que funcione.
- O motor não é HyperFrames e as cenas são escritas à mão por filme; o molde é o `demo/filme_demo.html`.
- A etapa de arte é manual no navegador do modelo de imagem (upload de referência e download em resolução cheia).
- Os personagens são recortes rígidos (sem rig de membros).
- `gerar_voz.mjs` e `mixar.mjs` são versões simples: o primeiro não foi testado com chamada paga nesta limpeza (o nome do modelo pode mudar: ajuste `ELEVEN_MODEL`); o segundo não faz automação por trecho nem transcrição.
