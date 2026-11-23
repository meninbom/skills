# REGRAS de {{NOME}}
Quem lê antes de começar:
- a sala de roteiro;
- quem divide os planos;
- quem monta.

Neste arquivo, "você" é o criador da série: quem aprova o trabalho. Cada ok ou recusa sua vira uma linha nova no **Registro** (fim do arquivo), no formato ACEITO/REPROVADO → REGRA DERIVADA → ONDE ENTRA. O que já virou regra sobe pras seções. Assim o seu gosto fica escrito, e a próxima conversa não repete um erro que você já apontou.

As regras-semente abaixo vieram da série LUMEN (6 episódios no ar, até 16 mil pessoas por ep). Troque, apague ou acrescente o que quiser: a série é sua. Entre parênteses vai o porquê de cada uma.

---

## 1. Retenção
1. **Abra no momento mais tenso, não com "Vocês votaram".** Uma frase de perigo no 1º segundo. O voto vai num selo de texto ou numa frase de no máximo 2 s depois do gancho. (Na série LUMEN, episódios que abriam com o voto perdiam 25–32% do público nos 8 primeiros segundos. Quem chega pelo feed não votou e ainda não tem motivo pra ficar.)
2. **O 1º quadro já é ação.** O 1º corte vem até ~1,5 s e o 1º impacto visual até 3 s. (No feed, a decisão de ficar ou passar acontece nos primeiros segundos.)
3. **A escolha cabe em 1 frase de até 6 s, dita por cima da cena viva.** Evite "Opção 1: … Opção 2: …": a cena para e o vídeo vira menu. Com a cena andando, o público escolhe no calor da emoção.
4. **Acabe no gancho, sem tela de menu.** Os cartões entram por cima do último plano, com o personagem ainda reagindo. O último quadro casa com o primeiro (loop). (Tela parada no fim é porta de saída; o loop faz o vídeo recomeçar sem emenda.)
5. **Fato real em até 8 s, em cima da cena da história.** Evite uma aula separada: quando a história para, o público sai.
6. **O que o público votou pra ver é mostrado, não resumido.** Depois de cada clímax, o próximo problema entra em até 3 s. (Resumir dá a sensação de que o voto não valeu; o problema novo segura quem acabou de ter a resposta.)
7. **Mire em 95–110 s por episódio**, com plano médio de 2–2,5 s. (Cabe uma cena inteira sem cansar, e a troca de plano mantém o olho ocupado.)

## 2. Roteiro e escrita
- **Lore:** leia a `BIBLIA.md` (lore que não muda) e o `LIVRO_RAZAO.md` antes de escrever. O voto mexe no presente, não na lore. (Assim o segredo grande da série fica de pé, seja qual for o voto.)
- **Narração corrida**, em parágrafos ligados, do jeito que você conta. Tabela de frases soltas soa travada na voz, porque cada frase recomeça do zero.
- **Fuja do clichê:** sem profecia falada, sem "escolhido", sem tom de conto de fadas. Conte por UMA pessoa num momento concreto. (Clichê soa infantil e afasta o público adulto; uma pessoa num momento concreto dá o que sentir.)
- **Premissa clara** nos primeiros 15 s; mistério sobre UMA coisa só. (Quem nunca viu a série precisa entender onde está. Com mistério demais, ele não entende nada e sai.)
- **Fato com número em todo episódio,** conferido na fonte, dentro da ação (o RAIO-X congela a cena e mostra a conta). (Fato curioso sem conta parece solto da história. Com o número na tela, ele vira parte da cena.)
- **O narrador não conta o que a tela mostra.** Ele fica com o que a imagem não diz. Skill e buff aparecem como aviso na tela, sem explicação na voz. (Narrar o que já se vê soa óbvio e gasta segundos preciosos.)
- **No desespero, a fala é emoção.** Dica técnica na boca do personagem no meio da luta soa falsa: ninguém explica tática com medo, e é a emoção que faz o público torcer.
- **A escolha nasce do que está na tela no fim,** e as duas opções custam algo da mesma pessoa. Todo custo de escolha passa pelo "quem sabe o quê" do `LIVRO_RAZAO.md` antes de chegar a você. (Escolha que surge do nada parece aleatória; e "fulano descobre" não é custo se fulano já sabia.)
- **Aprovação:** roteiro novo passa por você antes de voz e render. (Mudar o texto depois da voz paga obriga a pagar a voz de novo.)

## 3. Voz
- Sem sussurro, em nenhuma fala. (Na voz gerada, o sussurro soa artificial e quebra a narração. A tensão vem da pausa e do texto.)
- Acelere no máximo **1,1×**: acima disso, o ouvido percebe a voz comprimida na hora. A narração fica num take só, e o visual é que se ajusta à voz.
- **Voz é paga.** Só gere com o seu ok direto na conversa (`voz/OK_GASTO_VOZ.txt` com a sua frase). Assim nenhuma conversa gasta crédito de voz sem você saber quanto.
- Vozes da série: (preencher: papel → voz).

## 4. Imagem e personagens
- **Estilo:** (preencher: o look da série, com a ficha oficial).
- **Personagem novo ou redesign:** num CHAT NOVO do ChatGPT, edite a figura da ficha (imagem 1). Anexe sempre a referência. Uma imagem por pedido. (Descrever do zero faz o gerador inventar outro traço, e o personagem destoa do resto da série.)
- **Um gerador só por episódio.** Cada gerador desenha do seu jeito: misturar faz o personagem mudar de cara entre um plano e outro.
- **Conferir em tamanho cheio, por outro:** o revisor olha cada quadro inteiro e em duas metades, do lado da ficha. (Braço faltando e pé flutuando somem na miniatura, e quem gerou tende a ver o que quis fazer.)
- **Plano aberto primeiro** pra mostrar onde cada um está; close só como resposta. (Tudo de perto tira a perspectiva, e o público perde a noção de onde cada um está.)

## 5. Animação
- **H3:** 20 passos, 768×1344, RIFE pra 60 qps (quadros por segundo). Um por vez, porque dois trabalhos disputam a placa de vídeo; quem liga o ComfyUI desliga no fim, pra não deixar a placa ocupada.
- **Prompt:** só quem está no quadro, e só o estado certo. Evite frase negativa citando o defeito: o modelo tende a desenhar justamente o que leu.
- **3 tentativas por plano;** depois, reserva (placa parada ou trecho limpo). Assim um plano teimoso não segura o episódio inteiro.
- **Modelo novo** só depois do teste de deriva E do seu olho. (Muitos modelos de vídeo redesenham o personagem com cara de estúdio de animação já no primeiro segundo.)
- **Sempre em movimento:** nada parado mais de 1,5 s. (Quadro parado parece amador e dá motivo pra rolar o feed.)

## 6. Som
- **Voz na frente.** Música de −17 a −35 dB sob a voz. (Em vídeo narrado, a fala é o produto: se ela não se entende, nada mais funciona.)
- **SFX:** alinhe pelo ataque (o começo do som), não pelo pico, porque o ouvido sente o ataque como o "momento" do som. Poucos, reais, amarrados a um evento na tela; nada repetitivo o vídeo inteiro; o BUM não cai em cima de palavra, pra não cobrir a fala.
- **Celular:** o som tem que tocar no celular, que é onde o público assiste, e o grave some no alto-falante pequeno. Não empurre agudo só pra passar na régua: o número melhora e o som fica estridente.
- **Medidas:** −14 ±1 LUFS, pico ≤ −1 dBTP, celular ≥ −20 LUFS. (LUFS é o volume médio que o ouvido percebe; nessa faixa o vídeo toca no mesmo volume dos outros do feed.)

## 7. Montagem e tela
- **Texto e cartões:** fora dos 15% de baixo (onde fica a interface do Instagram) e da borda, pra nada ficar escondido atrás de botão ou legenda.
- **Tela de escolha:** a metade de baixo escurece; 2 botões grandes com a consequência escrita; "COMENTA 1 OU 2". (No celular, botão pequeno por cima da cena fica difícil de enxergar; o escuro dá contraste.)
- **Aviso na tela** tem que parecer impresso, não sobreposto. Assim ele faz parte do mundo, em vez de parecer adesivo colado por cima.

## 8. Capa, legenda e entrega
- **Capa:** quadro em tela cheia + só "EP. X". Sem título e sem spoiler. (A imagem já vende o episódio; o título disputa espaço com ela, e o spoiler entrega o que o público viria ver.)
- **Legenda:** lembra o voto, põe os números das opções e "Comenta 1 ou 2", pra quem chega no meio da série entender o jogo.
- **Entrega:** yuv420p, AAC 48 kHz; versão `_celular` pra prévia; HD pra postar. (yuv420p é o formato de cor que todo celular abre; o yuvj420p, que alguns programas geram sozinhos, não abre em muitos players de celular.)
- **Antes de postar:** reconte o voto do ep anterior, pra o resultado anunciado bater com os comentários.

---

## Registro de vereditos (ACEITO/REPROVADO → REGRA DERIVADA → ONDE ENTRA)
Anote aqui cada decisão sua sobre o trabalho, com a regra que ela gera e a seção onde a regra entra. As duas linhas abaixo mostram o formato; apague quando tiver as suas.
| Data | Veredito | Regra derivada | Onde entra |
|---|---|---|---|
| (exemplo) | REPROVADO: a escolha "Desconecta, ou fica?" não tinha ligação com o que estava na tela | A escolha nasce do que está na tela, e as duas opções custam algo da mesma pessoa | §2 |
| (exemplo) | REPROVADO: um chat longo gastou crédito num site pago, com o modo grátis à mão | Trava de gasto em código (hook), não regra escrita | `.claude/settings.json` |
