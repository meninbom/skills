---
name: replicar
description: "Replicar - replicador de estilo de vídeo. Use quando o aluno mandar um vídeo (arquivo ou link) e pedir \"replica esse vídeo\", \"replicar\", \"faz igual esse vídeo\", \"recria esse estilo\", \"replica esse estilo\", \"que estilo é esse?\", \"quero um vídeo nesse formato\". Analisa a referência de graça e sem tocar som (cortes, quadros, paleta, câmera, texto, voz, BPM), identifica qual dos estilos do curso ela é e recria com o tema do aluno; se não for nenhum, aprende o estilo novo com uma réplica de 5–8 s comparada lado a lado (máx. 3 rodadas) e salva a ficha no catálogo. NÃO use para copiar o conteúdo de um vídeo (personagem, marca, fala), nem para conferir um vídeo pronto (isso é checar-video)."
---

Responda sempre em português do Brasil, em linguagem simples, como para quem está começando.

# replicar

Scripts em `${CLAUDE_SKILL_DIR}/scripts/`. Receitas dos estilos conhecidos: skill irmã `curso-estilos` (`../curso-estilos/estilos/` e `../curso-estilos/motores/`). Estilos aprendidos ficam em `~/.curso-estilos/aprendidos/`; para guardar em outro lugar (outro disco, pasta de teste), defina a variável de ambiente `CURSO_ESTILOS_DADOS` com a pasta. Vale para o Replicar e para o catálogo.

## Regras (vêm do que deu errado e certo nos nossos testes)

1. **Replicar o ofício, não o conteúdo.** Da referência vêm formato, ritmo, enquadramento, gramática de câmera, onde fica o texto. Personagem, marca, logotipo, fala, música e história NÃO vêm: são do aluno. Se o aluno pedir cópia literal de obra alheia, recuse essa parte e ofereça o estilo com tema próprio.
2. **Ler antes de olhar.** Se a referência veio de um post, repositório ou thread, leia o que o autor escreveu (ferramenta, código, processo) antes de analisar. Muitas vezes ele conta como fez.
3. **Analisar a referência inteira uma vez.** Rode a análise completa uma vez e trabalhe sobre `analise.json` e as folhas. Não fique reabrindo o vídeo a cada dúvida.
4. **Checar a voz no stem.** Antes de mexer em efeito, legenda ou ritmo: há voz? Em que língua e a quantas palavras por minuto? Isso sai de `--voz` (separa a voz e transcreve o stem, não a mix).
5. **Nunca tocar áudio.** Tudo é medido em silêncio; lado a lado é sempre mudo.
6. **Provar pequeno antes de escalar.** Réplica de 5–8 s do trecho mais característico; só depois a peça do aluno.
7. **No máximo 3 rodadas de réplica.** Se na 3ª ainda não chegou, pare, diga a nota sincera e o que falta, e pergunte se segue assim ou muda de caminho.
8. **Comparar sempre contra a referência**, lado a lado, nunca de memória.
9. **Nada pago sem custo + ok; nada instalado sem ok.** Voz paga é opcional; o padrão é entregar mudo.
10. **Conferir antes de entregar** com `checar-video`.
11. **Ao replicar, os vetos de gosto do aluno ficam suspensos** (brilho, degradê, estilo alheio valem se a referência usa); a cópia literal continua proibida.

## Antes do primeiro uso · Dependências

Os scripts precisam de Python 3.10+, `ffmpeg`/`ffprobe` no PATH e das bibliotecas de `${CLAUDE_SKILL_DIR}/requirements.txt`. Confira o que falta (`python -c "import cv2, numpy, PIL"`), diga ao aluno o que vai instalar e o tamanho aproximado, e instale só com o ok:

```
pip install -r "${CLAUDE_SKILL_DIR}/requirements.txt"
```

- Recomendado: instalar num ambiente virtual do Python, para não misturar com as bibliotecas do sistema. Na pasta do projeto do aluno: `python -m venv .venv`, ativar (`.venv\Scripts\activate` no Windows; `source .venv/bin/activate` no Mac/Linux) e só então o `pip install`. Depois, ativar o mesmo ambiente antes de rodar os scripts.
- Obrigatórias: `numpy`, `opencv-python`, `pillow` (dezenas de MB).
- Opcionais, uma a uma e só se o aluno quiser a medida: `librosa` (BPM), `rapidocr-onnxruntime` (texto na tela), `soundfile` + `demucs` + `faster-whisper` (voz; o `demucs` baixa o PyTorch, ~2 GB). Sem elas a análise roda e marca o que não mediu.

## Passo 1 · Receber

Peça o arquivo (ou baixe o link que o aluno passar, com ok). Pergunte o que ele quer levar dali: "o estilo todo", "só o ritmo", "só o visual". Copie o vídeo para a pasta de trabalho do aluno; não altere o original.

## Passo 2 · Analisar (grátis, local, mudo)

```
python "${CLAUDE_SKILL_DIR}/scripts/analisar.py" REF.mp4
```

Esse é o comando de sempre: leva cerca de 1 minuto para 2 minutos de vídeo. Se a referência tem fala e a fala importa para a peça, rode depois, com o ok do aluno, a medida de voz (demora e pede dois programas a mais):

```
python "${CLAUDE_SKILL_DIR}/scripts/analisar.py" REF.mp4 --voz
```

- Gera `REF_replicar/analise.json`, `folha.jpg` (24 quadros numerados com o tempo) e `cortes.jpg` (1º quadro de cada plano).
- Mede: duração, proporção, qps; cortes por minuto e duração dos planos; paleta, saturação, chapado × degradê, contorno escuro; energia de movimento, tempo parado, câmera andando; texto na tela (quanto e onde); BPM, silêncio; com `--voz`, se há fala, idioma e palavras por minuto.
- `--voz` roda na CPU e demora (de 1 a 6 min para 30 s, conforme o PC) e baixa um modelo de cerca de 2 GB na primeira vez. Sem `demucs` ou `faster-whisper`, avise o que não foi medido e ofereça instalar (com ok). Sem `--voz`, diga na ficha que voz, idioma e palavras por minuto não foram medidos.
- Leia `folha.jpg` e `cortes.jpg` com seus olhos. Os números não substituem isso. Pixel art, em especial, não é medido: decida olhando.
- Cortes: o detector junta a medida de cena do ffmpeg com um detector de salto (pega corte seco entre planos da mesma paleta). Fusão e transição longa podem escapar, e um flash forte pode contar como corte: confira em `cortes.jpg`.

## Passo 3 · Classificar

```
python "${CLAUDE_SKILL_DIR}/scripts/classificar.py" REF_replicar
```

Devolve os 5 estilos mais próximos com nota e uma confiança pelos números (alta / média / baixa). **Os números são pré-filtro**: servem para escolher quais prévias abrir, não para decidir. Estilos de técnica bem diferente podem empatar na nota, e uma referência de um tipo que o curso não tem (motion gráfico de produto, por exemplo) pode não trazer nenhum candidato parecido. A decisão é sua, no olho:

1. Abra a prévia dos 3 primeiros (`../curso-estilos/catalogo/previas/<previa>.jpg`) e compare com `folha.jpg`.
2. Leia os "sinais" de cada candidato: a referência tem aquilo?
3. Diga ao aluno o resultado com a confiança sincera: "é o estilo N (confiança alta)", "fica entre N e M", ou "não é nenhum dos que conheço".

Um estilo "bate" quando a técnica é a mesma (como a imagem é feita e como se move), mesmo com tema, cor e personagem diferentes. Se só o tema parece, não bate.

## Passo 4A · Bateu com um estilo conhecido

1. **Passe para a skill do estilo.** Cada estilo do curso tem a sua, com o código no nome; o mapa código → skill está em `../curso-estilos/catalogo/skills.json` (ou rode `node ../curso-estilos/scripts/catalogo.mjs --estilo <id>` e leia a linha `skill:`). Diga ao aluno qual estilo é, pelo código e pelo nome (por exemplo "é o `#60`, Pixel de jogo indie"), e siga a skill dele. Estilo aprendido não tem skill: leia a `ficha.md` dele.
2. O fluxo é o da skill do estilo (o mesmo da skill mestre `curso-estilos`): instalar só o que falta com ok → tema do aluno → roteiro aprovado → motor copiado para a pasta dele → produzir.
3. Use as medidas da referência como alvo do que é ritmo e formato (cortes/min, duração dos planos, palavras/min, zona do texto). Paleta e luz: as do aluno, a menos que ele peça as da referência.
4. Confira com `lado_a_lado.py` e `checar-video` (ver "Checagem" abaixo). Entregue mudo, mais a versão de celular.
   - **Janela do lado a lado numa peça com cortes:** escolha `--ini` logo depois de um corte da referência (veja `cortes_s` no `analise.json`) e `--dur` de 5 a 8 s. O script percebe que a sua peça tem cortes, mostra o ritmo do vídeo inteiro dos dois lados (é esse o número que vale para cortes por minuto) e usa a janela só para comparar a imagem.
   - **Versão de celular** (muda, leve, abre em qualquer aparelho):
     ```
     ffmpeg -i PECA.mp4 -an -c:v libx264 -profile:v main -level 3.1 -pix_fmt yuv420p -vf scale=720:-2 -crf 24 -movflags +faststart PECA_celular.mp4
     ```
     Para vídeo horizontal troque `scale=720:-2` por `scale=-2:720`. Se a peça já tiver som, troque `-an` por `-c:a aac -b:a 128k -ar 48000 -ac 2`.
5. **Formato:** a peça do aluno sai em 9:16 (1080×1920), mesmo que a referência seja horizontal, a menos que ele peça outro.

## Passo 4B · Não bateu: aprender o estilo

1. **Ficha.** Copie `${CLAUDE_SKILL_DIR}/FICHA_MOLDE.md` para a pasta de trabalho e preencha a partir do `analise.json` e das folhas: medidas, gramática, o que não levar.
2. **Motor de partida.** Escolha o estilo conhecido mais próximo na técnica (o 1º candidato costuma servir; 2D vetor → 03, 3D em código → 34 ou 01, motion gráfico → 14, mapa de satélite → 11, mapa desenhado → 25, pixel → 60). Copie `../curso-estilos/motores/<id>/` para a pasta do aluno (o 11 é a skill irmã: `../geo-tales/motor/`). Para peça curta, comece pelo kit de partida do motor quando houver, não pelo episódio de exemplo: `motores/03/kit_template/` (boneco com 3 temas prontos; o `LEIA-ME.md` de lá traz os campos de pose e a câmera) e, no 14, `motores/14/kit_branco/` (página em branco, vertical ou horizontal) ou `motores/14/kit_template/` (roteiro vertical de exemplo). No 14, pasta nova de composição recebe o GSAP sozinha na hora do render, desde que o `npm install` já tenha rodado na pasta do motor. Sem motor próximo: comece do zero no navegador (HTML/canvas ou three.js → quadros → FFmpeg).
3. **Trecho.** Escolha os 5–8 s mais característicos da referência (olhe `cortes.jpg`) e diga ao aluno qual é.
4. **Réplica, rodada 1.** Faça esse trecho com conteúdo neutro (formas e personagem genéricos, sem a marca da referência). **A réplica segue o formato da referência** (horizontal se ela for horizontal). Aceitam outro tamanho de quadro: os motores 03, 14, 71 e impact (`--vw`/`--vh`) e o 25 (tamanho como argumento); os outros só renderizam em 9:16, e o `DEMO.md` de cada um diz qual é o caso. Referência horizontal com motor só 9:16: troque de motor de partida ou avise o aluno que a comparação será de formato diferente; só a peça final do aluno volta para 9:16.
5. **Lado a lado.**
   ```
   python "${CLAUDE_SKILL_DIR}/scripts/lado_a_lado.py" REF.mp4 replica_v1.mp4 --ini <segundo> --dur 8
   ```
   **A janela (`--ini`, `--dur`) tem de caber dentro de um plano da referência** quando a réplica é um plano só: olhe `cortes_s` no `analise.json` (ou `cortes.jpg`) e comece ~0,3 s depois de um corte, terminando antes do próximo. Se a janela atravessar um corte, o script avisa, e a medida de movimento da referência sai inflada. Réplica com cortes: use os mesmos instantes de corte da referência. Em quadro quase preto o script marca saturação e degradê como pouco confiáveis: aí compare a cor no olho.
   Olhe `lado_a_lado.jpg`, leia as maiores diferenças medidas, mostre ao aluno o `lado_a_lado.mp4` (mudo) com a sua nota sincera de 0 a 10 e a lista do que ainda difere.
6. **Rodadas 2 e 3**: só o que difere, **um grupo por rodada** (câmera e tempo · cor e luz · texto e formas), medindo de novo. Dentro do grupo pode mexer em mais de uma coisa; não misture grupos, para saber o que causou a mudança. Defeito que a checagem acusa e a referência não tem (quadro vazio, por exemplo) entra em qualquer rodada, sem contar como grupo. Anote cada rodada na tabela da ficha. Regra 7 vale.
7. **Aprovada pelo aluno** → salvar:
   ```
   python "${CLAUDE_SKILL_DIR}/scripts/salvar_estilo.py" REF_replicar --slug <nome_curto> --nome "<Nome>" --ficha FICHA.md --motor <pasta_do_motor> --base <id> --sinais "<o que se vê em 1 linha>" --previa replica_final.mp4
   ```
   Do motor vai só o código (renders, quadros, vídeo e `node_modules` ficam de fora). Exemplo ou template do motor de partida que a réplica não usa: `--ignorar "pasta1,pasta2"`. Mais limpo ainda: `--so "replica,lib,render.mjs,package.json"` leva só o que você listar (os guias do motor de partida não vão). O script mostra o tamanho e os maiores itens; se passar de uns 2 MB, veja o que sobrou.
   **Réplica de um trecho** (um plano de uma referência com vários): acrescente `--trecho replica_final_lado` (a pasta que o `lado_a_lado.py` criou). A assinatura do estilo passa a ser a do trecho replicado, e não a do vídeo inteiro, que pode ter planos bem diferentes.
   O estilo passa a aparecer no catálogo (os aprendidos ganham os códigos `#201`, `#202`...) e no classificador. Não aprovada: não salve; guarde a ficha na pasta do aluno com a nota e o motivo.
8. Só então produzir a peça do aluno nesse estilo (passo 4A, usando a ficha nova).

## Replicar o som da referência

Só quando o som faz parte do estilo (um efeito marcante, uma batida que manda nos cortes) e o aluno pedir. Tudo aqui é medido em arquivo, sem tocar nada.

1. **Separe as camadas** da referência com o `demucs` (voz, bateria, baixo, resto). É o mesmo programa da medida de voz; se não estiver instalado, ofereça instalar, com ok.
2. **Faça o espectrograma lado a lado**, da referência e da sua versão, no mesmo trecho:
   ```
   ffmpeg -i REF.mp4 -lavfi "showspectrumpic=s=1200x400:legend=0" ref_espectro.png
   ffmpeg -i REPLICA.mp4 -lavfi "showspectrumpic=s=1200x400:legend=0" replica_espectro.png
   ```
   Olhe as duas imagens: onde está a energia (grave, médio, agudo), onde há silêncio, onde entra cada evento.
3. **Meça o evento que importa**: em que instante começa, quanto dura, quanto tempo leva para chegar ao pico, em que faixa de frequência está e quantos dB fica abaixo da voz.
4. **Refaça e meça de novo** até os números baterem (instante com erro de até 1 quadro, volume com erro de até 2 dB). No máximo 3 rodadas, como na imagem.
5. Os níveis de trilha e de efeito e o alinhamento pelo ataque ou pelo pico estão no `../curso-estilos/OFICIO.md`, seção 4.

Não copie a música nem a voz da referência: são de quem fez. O que se replica é o desenho do som (onde entra, quanto dura, em que volume).

## Checagem (`checar-video`) numa réplica

- Entrega muda: rode com `--mudo`, e "sem faixa de áudio" deixa de ser aviso.
- A checagem foi calibrada para o nosso gosto. Quando ela reprovar algo, veja primeiro se **a referência faz a mesma coisa de propósito**: rode a checagem no trecho da referência com `--fps-amostra 4` **e** olhe os quadros dela (`cortes.jpg`, `lado_a_lado.jpg`). A checagem olha poucos quadros por segundo e pode não pegar na referência um texto que entra e sai rápido; se você vê no quadro, vale como "a referência faz". Casos comuns: texto que entra e sai pela borda ("texto cortado"), título enorme que sangra, e "herói pequeno" em motion gráfico, que não tem herói.
  - A referência também faz: não "conserte" (regra 11). Anote na ficha em "de propósito no estilo" e diga ao aluno: "a checagem acusa X; a referência também; mantive".
  - A referência não faz: é defeito da réplica; corrija.
- Formato de pixel, quadro vazio, tempo parado e palavra quebrada com hífen valem sempre.

## Limites honestos

- As assinaturas vêm de uma prévia de 15 s por estilo (alguns têm 2 ou 3 amostras). Os números erram quando o tema muda muito a imagem (noite × dia, interior × exterior); por isso a decisão é visual.
- Não mede: qualidade do desenho, atuação, humor, se a ideia se entende, qualidade do som.
- Vídeo com gente filmada (talking head, vlog) não é nenhum dos estilos do curso; o Replicar pode aprender a edição por cima (cortes, legenda, gráficos), não a pessoa.
- Estilos que dependem de IA de vídeo local pedem placa forte (ver `checar_pc.mjs` da skill `curso-estilos`).
