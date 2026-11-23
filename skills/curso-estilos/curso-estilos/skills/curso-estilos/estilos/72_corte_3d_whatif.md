# 72 · Corte 3D "what if"

> Vitrine: "E se você cavasse até achar água no sertão?" (28 s, muda) · Custo: R$ 0 · Ferramentas: Blender (Cycles em CPU, por script Python), Poly Haven (CC0), Python/Pillow, FFmpeg

## O que é
Um terreno cortado como fatia de bolo: em cima a paisagem, embaixo a seção do chão. A obra acontece dentro do corte, por etapas, e cada etapa tem um rótulo curto (contador de profundidade + nome da camada). A câmera segue a escavação e termina num plano aberto que dá a escala inteira.
Funciona porque mostra o que ninguém vê (o que tem embaixo), com cara de maquete realista e uma pergunta "e se" que se responde sozinha na imagem. Estilo inspirado nos reels de corte de terreno "what if".

## Exemplo e arquivos
- Prévia do catálogo: `catalogo/previas/72_orig.mp4` (capa em `catalogo/previas/72_orig.jpg`).
- Motor completo da peça: `motores/72/` (a cena é `motores/72/run/cena.py`, a linha do tempo é `motores/72/run/tempos.json`).
- Demo de 3 s: `motores/72/DEMO.md`. Origem e licença dos assets: `motores/72/FONTES.md`.

A tabela de etapas da peça (o modelo para a sua):

| tempo | rótulo | o que muda no corte |
|---|---|---|
| 0,25–3 s | título (3 linhas) | caatinga ao fim da tarde, mandacarus, chão rachado |
| 3,2 s | 0→1 m · areia | aparece o sarilho e começa o buraco; o balde desce e sobe |
| 6,0 s | 1→6 m · barro | o poço desce no barro vermelho; o monte de terra cresce |
| 8,8 s | 6→12 m · rocha | chega na rocha; sai o sarilho, entra a perfuratriz |
| 11,6 s | 12→30 m · seco | furo estreito na rocha, lascas pulando no fundo |
| 14,4 s | 30→58 m · fenda | a broca chega numa fenda, que "molha" e brilha |
| 17,6 s | água | a haste sai e a água sobe no furo de 58 m até 21 m |
| 21,4–28 s | salobra | a câmera abre até o plano inteiro |

## Ferramentas e instalação
Tudo grátis.
- **Blender** instalado (blender.org), ou a variável `BLENDER_PATH` apontando para o executável (serve a versão portátil em zip, sem instalar). Testado no 5.2 LTS; em versões mais antigas a API de nós pode pedir ajuste. Roda sem interface: o `whatif.py` chama `blender -b --factory-startup -P run/cena.py -- <args>`.
- **Python 3.10+** com `pip install -r requirements.txt` (Pillow, para os rótulos) e **FFmpeg** no PATH.
- **Assets Poly Haven** (CC0, sem crédito obrigatório): um conjunto reduzido já vem em `motores/72/assets_demo/` (texturas 512–1024 px, HDRI 1024×512, 5 modelos pequenos). O conjunto completo em 2k (~160 MB, com pedras, arbusto grande e tronco) vem com `python run/baixar_ph.py`, pela API oficial; com a pasta `assets/` presente, a cena passa a usá-la.
- **Fonte** Nunito (SIL OFL) em `motores/72/fonte/`.
- Não precisa de GPU: o render é Cycles em CPU.

## Motor
Em `motores/72/` (~6,5 MB, quase tudo assets reduzidos):
- `motores/72/whatif.py`: os comandos (`demo`, `still`, `render`, `montar`). Acha o Blender, chama a cena, põe os rótulos e faz o encode. `motores/72/demo.py` é o atalho do demo.
- `motores/72/run/cena.py`: a cena inteira em código (terreno em corte, poço em meia-seção, 4 camadas de solo por profundidade, fendas, veios, água, mandacaru, sarilho, perfuratriz, montes que crescem, sol baixo, névoa por distância, câmera com mola). Modos `still`, `video` e `blend`. Lê a linha do tempo de `run/tempos.json`.
- `motores/72/run/tempos.json`: etapas (de quanto a quanto se cava e quando), entrada e saída de equipamentos, nível da água, chaves de câmera e rótulos. Trocar de tema começa aqui.
- `motores/72/run/legenda.py`: poeira 2D no ar + rótulos (título, contador, palavra).
- `motores/72/run/baixar_ph.py`: baixa o conjunto completo de assets da Poly Haven.
- `motores/72/assets_demo/`, `motores/72/fonte/`, `motores/72/licencas/`.

## Passo a passo (ponta a ponta)
Copie `motores/72/` para a pasta do seu projeto e trabalhe na cópia.

1. **Demo primeiro**:
   ```
   pip install -r requirements.txt
   python demo.py          # saida/demo.mp4, 3 s, 540x960, 12 qps, mudo
   ```
   Se o Blender não estiver no PATH: defina `BLENDER_PATH` com o caminho do executável.
2. **Pergunta e fato**: uma pergunta "e se" com resposta física que caiba num corte (poço, lago, fossa, túnel, raiz). Escreva a tabela de etapas: tempo, rótulo, o que muda no corte. Fatos com fonte anotada. Feche o roteiro antes de modelar.
3. **Referência primeiro**: escolha um vídeo do estilo, monte uma folha de quadros dele e deixe aberta ao lado antes de modelar.
4. **Assets completos** (opcional, ~160 MB em 2k):
   ```
   python run/baixar_ph.py
   ```
5. **Linha do tempo**: edite `run/tempos.json` (etapas, câmera, rótulos).
6. **Stills de teste** em 4–6 tempos, até o look fechar (a peça levou 5 rodadas):
   ```
   python whatif.py still 9.6            # saida/testes/t_09.60.png (540x960, 12 amostras)
   ```
7. **Render** (CPU, 540×960, 12 amostras adaptativas + OIDN; as variáveis `W`, `H` e `SPP` mudam o tamanho e a qualidade):
   ```
   python whatif.py render
   ```
8. **Montagem** (amplia para 1080×1920, grade de cor, rótulos, grão, MP4 yuv420p + celular + folha, em `saida/`):
   ```
   python whatif.py montar
   ```
9. **Com voz** (opcional): gere a voz primeiro, meça os tempos por palavra e escreva esses tempos no `run/tempos.json`; só então renderize. Cada objeto da cena é uma função do tempo, então prender um evento a uma palavra é trocar um número. Uma voz local gratuita (kokoro-onnx) + faster-whisper para os tempos resolve sem custo; voz paga usa a sua chave e é cobrada por caractere.
10. `/checar-video` no 1080 (se a fala for em inglês, passe `--lingua en`).

## Pegadinhas medidas
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- Tempo de render: 672 quadros em 1h02, ~5–8 s por quadro em CPU dividida com outros trabalhos (540×960, 12 amostras). No demo (4 amostras, assets reduzidos) cada quadro leva ~2–6 s.
- Render 540×960 ampliado com lanczos + unsharp: passa no plano aberto, fica macio no close. Com CPU livre, renderize em 720×1280 (`W=720 H=1280`).
- Duas passadas (ímpares, depois pares): em metade do tempo já existe o vídeo inteiro a 12 qps para conferir. O render pula PNG que já existe, então dá para parar e retomar.
- Duas máquinas (ou CPU + GPU) no mesmo diretório, uma de frente e outra de trás, pulando PNG pronto, dobram a vazão. Tem que ser o mesmo motor (Cycles) e o mesmo denoiser (OIDN) nos dois; misturar EEVEE dá salto de look.
- Projeção plana XZ na face do corte é bem mais barata em CPU que projeção BOX.
- O corte é reconstruído a cada quadro (geometria refeita pela profundidade daquele instante), não é animação por keyframe.
- Furo na rocha exagerado para 0,84 m, senão some no plano aberto. Cacimba de 1,5 m até a rocha.
- Luz: sol baixo lateral alinhado ao sol do HDRI (o código acha o ponto mais claro do HDRI) + névoa quente por distância. HDRI errado briga com o tema: o primeiro testado tinha morro verde no horizonte e foi trocado por céu limpo.
- Rótulos: Nunito Black branca com contorno escuro, sem cor de destaque. O contador sobe junto com a escavação (mesma curva).
- Câmera segue a obra com mola amortecida (1,1 s) e abre no fim para 95 m de distância.
- Monotonia é o risco número 1: 10 s só de parede de rocha cansam. Planeje um plano diferente no meio.
- `/checar-video` com fala em inglês e língua padrão dá 28% de acerto falso; com `--lingua en` dá 100%.
- Não remonte o MP4 com `-c:v copy` a partir de quadros soltos: o encode final tem que sair em yuv420p (o `whatif.py montar` já faz).

## Custo e tempo
- R$ 0: Blender, Poly Haven CC0, Nunito OFL. Nada de IA paga.
- Máquina: ~1 h de render em CPU para 28 s + 5 min de montagem. Uma peça com voz no mesmo motor levou ~2h15 do estudo ao final.
- O padrão é CPU. Quem tiver placa pode ligar a GPU no Cycles por conta própria; uma tarefa de GPU por vez.

## O que funcionou e o que não funcionou
- **Sem olhar a referência, sai tosco.** A primeira tentativa foi feita sem assistir ao vídeo que inspirou o estilo e ficou muito abaixo dele. Regra que ficou: testar ou replicar = comparar com a referência lado a lado, em até 3 rodadas, e a nota é contra a referência.
- **Luz de meio-dia deixa a cena crua.** O cenário já nasce com sol baixo lateral, névoa por distância e grade de cor; isso sozinho tirou a cara de maquete de arquitetura.
- **Blender por script serve para cenário e objeto, não para personagem.** Personagem montado por código no Blender ficou amador; aqui funciona porque não tem gente em cena.
- **Da referência vem o formato; a luz e a paleta são suas.** Tema, fato, cenário e objetos desta peça são originais.
- **Sempre em movimento**: a câmera com mola nunca para; nenhum destaque colorido em palavra.
- **Nossa nota: 7 de 10 contra a referência.** Mais forte: o plano aberto final (coluna de 58 m com o tripé minúsculo lá em cima dá escala de verdade), a luz de fim de tarde e o contador casado com a escavação. Mais fraco: de 11 a 21 s a tela é quase só parede de rocha; o mandacaru em código é estilizado; a água é uma faixa chapada, sem transparência; render 540 ampliado fica macio no close.

## Roteiro de aula
- **Objetivo**: o aluno sai sabendo montar um corte de terreno no Blender só por script, animá-lo por uma linha do tempo em JSON e fechar o vídeo com rótulos e encode.
- **Demonstração** (~35 min):
  1. A peça e a tabela de etapas: como uma pergunta vira estados do corte (5 min).
  2. `motores/72/run/tempos.json` aberto ao lado da peça; mudar uma etapa e tirar um still (8 min).
  3. Dentro do `motores/72/run/cena.py`: a face do corte, o material de 4 camadas, a função que refaz a geometria por quadro (10 min).
  4. Luz: mesmo still com sol alto e com sol baixo + névoa (4 min).
  5. `python whatif.py render` (duas passadas) e `python whatif.py montar`; mostrar a folha (5 min).
  6. A lição da referência: um lado a lado com o vídeo que inspirou (3 min).
- **Exercício**: trocar o tema para "e se você cavasse uma piscina no quintal?": 4 etapas, contador em metros, plano aberto final, 12–15 s. Deu certo se: o contador bate com a profundidade vista, nada fica parado no `/checar-video`, a luz não é de meio-dia e existe um lado a lado contra uma referência escolhida.
- **Pré-requisitos**: Blender instalado e noção de `bpy`. Aula 29 (checagem objetiva).

## Limites conhecidos
- `run/cena.py` é específico do poço (38 KB num arquivo só). Trocar de tema exige reescrever geometria e materiais, não só o JSON; não existe um "kit de corte" genérico.
- O demo usa o conjunto reduzido de assets: sem as pedras grandes, o arbusto maior e o tronco, e com texturas menores. O look da prévia do catálogo pede o conjunto completo (`run/baixar_ph.py`).
- Peça de vitrine muda: o motor não traz voz, trilha nem efeitos. O passo 9 descreve o método.
- Vegetação Poly Haven é sul-africana e o mandacaru é estilizado: não há asset de caatinga.
- Trecho 11–21 s monótono e água chapada: defeitos conhecidos da peça, sem correção feita.
- Só CPU: não há opção de GPU no script. Render completo leva ~1 h.
- Testado só no Blender 5.2 em Windows.
