# OFÍCIO: o que vale para qualquer estilo

Leia antes de escrever o roteiro e de novo antes da mixagem. As receitas dizem como cada estilo é feito; aqui está o que faz um vídeo curto funcionar em qualquer um deles. Os números foram medidos nos nossos vídeos e em vídeos de referência, e cada um vem com o motivo, para você saber quando pode sair dele.

## 1. Roteiro

**Antes de escrever, proponha 3 ideias bem diferentes** (outro ângulo, outro personagem, outro fim), e não três versões da mesma. *Por quê:* a primeira ideia costuma ser a mais óbvia, e o aluno só consegue escolher se tiver com o que comparar.

**Teste do genérico:** se dá para trocar o assunto e a animação continuar a mesma, a ideia é genérica. Ideia boa tem uma imagem que só serve para aquele assunto.

**Densidade, o que mais pesa:**

- **Cerca de 45 substantivos concretos por minuto, e cada um vira um objeto na tela no instante em que a palavra é dita.** *Por quê:* "economia" não se desenha; "boleto", "catraca" e "marmita" sim. Palavra abstrata deixa a tela sem ter o que mostrar, e tela sem novidade é onde o espectador sai.
- **A tela sabe mais que a voz.** A voz diz "um médico descobriu"; a tela mostra o nome, o ano e a página do documento. *Por quê:* quem só ouve entende, e quem olha ganha um extra. Texto na tela que repete a fala não acrescenta nada.
- **A voz generaliza e a tela enumera.** A voz diz "tudo ficou mais caro"; a tela despeja dez preços.
- **Troca de família visual a cada 5 a 8 s** (desenho, documento, mapa, tela de celular). *Por quê:* o mesmo tipo de imagem por 15 s parece um slide comprido, mesmo com movimento.
- **O primeiro evento visual acontece até 0,4 s.** Nos vídeos que seguram, algo novo entra a cada 0,3 s em média; nos que não seguram, a cada 1,3 s.
- **Narração corrida, com frases emendadas.** Frases de uma ou duas palavras, na voz gerada, viram pausas, e pausa demais derruba o ritmo.

**Fato:** cada dado com duas fontes, anotadas num arquivo de fontes do projeto. Nome próprio, data e número aparecem na tela. Dado frágil vira texto prudente ("quase 15 horas").

**Final:** sem moral e sem frase de efeito. O melhor fecho abre uma pergunta nova. **Pedido ao espectador (seguir, comentar) só com motivo real** dentro da história: "comenta 1 ou 2, o mais votado vira o episódio de amanhã" tem motivo; "segue pra mais" não tem.

## 2. Câmera, movimento e composição

- **Entrada com `expo.out`** (chega rápido e assenta devagar), de 0,27 a 0,4 s. *Por quê:* o olho percebe a chegada e tem tempo de ler.
- **Saída com curva "in" e 40 a 50% mais curta que a entrada.** *Por quê:* o que sai não precisa ser lido; saída lenta atrasa o que vem depois.
- **Nada em movimento linear**, a não ser giro contínuo e barra de progresso. Movimento linear parece de máquina.
- **No máximo 2 curvas por vídeo**: uma de entrada e uma de mover. *Por quê:* cada curva é um "jeito de se mexer"; com várias, o vídeo perde a identidade.
- **Efeito de mola (passar do ponto e voltar) no máximo uma vez, em objeto, nunca em texto de leitura.**
- **Um herói por tela, ocupando de 60 a 85% da largura.** *Por quê:* no celular, o que é pequeno não existe. Vários elementos médios disputam o olho e nenhum ganha.
- **Tudo se constrói; nada só aparece.** E nada fica parado por mais de 1,5 s.
- **Corte seco por padrão.** Fusão e escurecimento ficam para mudança de lugar ou de tempo. No feed, fusão em todo corte lê como vídeo lento.
- **Fundo chapado liso vira slide.** Dê ao fundo profundidade, luz ou textura. **Nota de produção nunca vai dentro do quadro** (nome de arquivo, "versão 2", crédito de ferramenta), e nada de rótulo "imagem gerada" por cima da arte.

## 3. Voz

- **A voz vem antes da animação final**, porque é o tempo dela que manda nos cortes.
- **Escreva os números por extenso** no texto que vai para a voz ("quatro por cento"). A legenda pode mostrar "4%".
- **A pausa vai escrita no texto** (reticências, parágrafo em branco), e não cortada depois na edição. *Por quê:* a pausa falada tem respiração; a cortada soa como emenda.
- **Normalize cada gravação em −16 LUFS antes da mixagem.** *Por quê:* os serviços de voz entregam cada geração num volume diferente (já medimos −20,8 e −26,2 com o mesmo ajuste). Sem normalizar, toda a conta da trilha sai errada.
- Uma gravação inteira, sem acelerar mais que 10%. Voz acelerada soa artificial.
- Voz paga só com o custo dito antes e o ok do aluno.

## 4. Som e mixagem

Meça a voz e a trilha separadas, já com o ganho final. "Abaixo da voz" quer dizer a diferença de volume médio entre as duas.

| O quê | Quanto | Por quê |
|---|---|---|
| Trilha em vídeo narrado comum | 8 a 12 dB abaixo da voz | acima disso a fala cansa; abaixo, a trilha some |
| Trilha em explicativo ou documentário curto | 17 a 35 dB abaixo, ou sem música | a informação é densa, e a música disputa a atenção |
| Trilha densa (batida forte, grave cheio) | cerca de 15 dB abaixo, abaixando sozinha quando a voz fala, e com corte entre 1 e 4 kHz | é nessa faixa que mora a clareza da fala; trilha densa ocupa o mesmo lugar |
| Efeito sonoro | 10 dB ou mais abaixo da voz; impacto forte, 8 dB | efeito mais alto que a fala vira susto |
| Volume final | −14 LUFS, pico real até −1 dBTP | é o padrão das plataformas; acima disso elas abaixam o seu vídeo |

- **Alinhe o efeito pelo ponto certo.** Som de passagem (vento, espada, luz) se alinha pelo **ataque**, o começo do som, uns 30 ms antes do movimento. Som de impacto se alinha pelo **pico**: muitos sons de impacto levam até 0,8 s para chegar ao pico, e alinhar o começo do arquivo faz o baque chegar atrasado.
- **Só som real do assunto** (porta, chuva, celular), de preferência no silêncio entre duas falas. Bipe de interface cansa.
- **Som de subida só antes de um impacto.** Silêncio de propósito vale mais que som em tudo.
- **Teste no alto-falante do celular.** Grave abaixo de 300 Hz não existe ali: se o vídeo depende dele, o espectador não ouve.

## 5. Aprovar antes de gastar render

1. **Roteiro aprovado** antes de qualquer voz ou render.
2. **Folha de 6 a 9 quadros numerados**, um por cena, para o aluno aprovar ou apontar pelo número ("troca o 4"). *Por quê:* corrigir um quadro custa segundos; corrigir depois do render custa o render inteiro.
3. **O trecho mais difícil primeiro**, uns 5 s. Se ele não funciona, o resto não salva.
4. **Só então o vídeo inteiro.**

**Nunca grave por cima de uma versão.** Cada versão ganha um nome novo (`v2`, `v3`), e a antiga vai para uma pasta `_antigo`. *Por quê:* é comum a versão 2 ser melhor que a 3, e só dá para voltar se ela ainda existir.

## 6. Entrega

- MP4 em 1080×1920, H.264, **`yuv420p`** (o formato de cor que todo celular abre), áudio AAC em 48 kHz, com `+faststart`.
- Uma versão leve de celular (720p) para mandar e conferir.
- Confira com a skill `checar-video` e veja o vídeo no celular, com som e sem som, antes de postar.
