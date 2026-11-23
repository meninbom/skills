# Regras da série (exemplo real: LUMEN)

Este é o arquivo de regras que a produção do LUMEN lê antes de começar um episódio. Vai no pacote como modelo: as regras de retenção, voz, som e tela servem para qualquer série deste formato; as de personagem e de mundo são do LUMEN, e você troca pelas suas.

Quem lê antes de começar:
- quem escreve o roteiro;
- quem divide os planos do `ciclo/`;
- quem monta.

Cada aprovação ou reprovação de quem dirige vira uma linha nova no **Registro** (fim do arquivo), no formato TENTATIVA → O QUE DEU → REGRA → ONDE ENTRA. O que já virou regra sobe pras seções.

Medição por programa: `ciclo/checar_planos.py`, por plano. "O modelo achou bom" não é checagem.

**Quem faz o quê:**
- **Sala de roteiro:** só TEXTO (roteiro, falas, escolha, livro-razão da série). Não gera imagem, clipe nem voz.
- **Produção:** uma conversa NOVA por episódio, aberta na pasta do projeto (ali vale a trava de gasto). Termina quando o episódio é entregue. Começa lendo este arquivo, o `ciclo/LEIA.md` e o `ciclo/revisor/REVISOR.md`.
- **Revisor:** quem gera não aprova. Todo quadro passa por um subagente de contexto zerado antes da aprovação humana (`ciclo/revisor/`).
- **Gasto:** `ciclo/trava_pago.py` (hook) faz VOCÊ clicar em permitir antes de qualquer ação em site que gasta crédito ou de API paga. Um gerador de imagem só por episódio.

---

## 1. Retenção (dados reais dos ep2–ep5; `ANALISE_retencao.md`)
1. **Tirar "Vocês votaram" da 1ª frase.** Abrir no momento mais tenso, com uma frase de perigo no 1º segundo. O voto vai num selo de texto ou numa frase de no máximo 2 s depois do gancho.
2. **O 1º quadro já é ação.** O 1º corte vem até ~1,5 s e o 1º impacto visual até 3 s.
3. **A escolha cabe em 1 frase de até 6 s, dita por cima da cena viva.** Nada de "Opção 1: … Opção 2: …" com as regras: as regras de cada opção vão na legenda ou no comentário fixado.
4. **Acabar no gancho, sem tela de menu.** Os cartões entram por cima do último plano, com o personagem ainda reagindo, nos últimos 2–3 s. O último quadro casa com o primeiro (loop).
5. **Fato real em até 8 s, em cima da cena da história.** Pode ser raio-X sobre o herói ou um bicho dentro do próprio cenário. Nunca 18 s de holograma separado.
6. **O que o público votou pra ver é mostrado, não resumido.** Depois de cada clímax, o próximo problema entra em até 3 s.
7. **Mirar 95–110 s por episódio** (ou 2 partes de ~1 min), com plano médio de 2–2,5 s. Episódio de ~3 min só se tiver luta e uma virada nova a cada 20–30 s. A fórmula do ep4, o mais visto:
   - fato útil;
   - problema da vida real;
   - dois personagens disputando o herói;
   - escolha com custo emocional.

## 2. Roteiro e escrita
- **Lore:** ler a bíblia e o livro-razão da série (votos, promessas, quem sabe o quê) antes de escrever. O voto do público mexe no presente, nunca na lore.
- **Narração corrida**, em parágrafos ligados, no jeito de quem conta a história em voz alta. Tabela de frases soltas sai travada.
- **Clichê:** sem profecia falada, sem "escolhido", sem tom de conto de fadas. Contar por UMA pessoa num momento concreto.
- **Premissa clara** nos primeiros 15 s; o mistério fica só sobre UMA coisa.
- **Saudação:** nunca abrir com "Fala, galera" ou parecido.
- **Fato:** conferir na fonte. O congelamento de medo baixa poucos batimentos: 84 → 81 → 79, nunca 90 → 58.
- **Fatos que não batem com a cena:** saem.
- **Aprovação:** o roteiro novo é aprovado antes de voz e render.
- **Fato técnico com número em todo episódio.** É a marca da série: congela a cena real e mostra a conta (olho dominante, 340 m/s, 343 × 55 m/s). Fato "fofo" sem conta não segura.
  - **Na tela ele é HOLOGRAMA**, saindo do próprio objeto da ação. Nunca um título escrito, nunca cartão grande. No máximo 1–2 etiquetas pequenas com o número.
- **Luta que o animador de IA dá conta:** uma ação clara por plano, plano aberto, o corpo mexendo, e o resultado visível no mesmo plano. Coreografia de trocas rápidas (pedra pra um lado, flecha do outro) sai ruim. O clímax mexe nos **corpos**, não nos números do HUD.
- **Menos texto na tela:** aviso escrito só pra skill/buff (◆ … · ATIVO) e pro número do fato. O resto se mostra com imagem ou som (uma mensagem recebida virou uma luz violeta). Sem contagem em painel, sem carimbo.
- **Palavras:**
  - cuidado com palavra que vira outra coisa na voz sintética ou soa mal em voz alta: trocar por uma descrição;
  - nome de técnica estrangeira não se traduz ao pé da letra: descrever o que acontece.
- **O poder do herói é dele, não de item.** Depende de quem usa.
- **O poder é especial e involuntário.** O herói não sabe como funciona e não consegue chamar quando quer. Nunca pôr "usar o poder de novo" como opção de escolha: vira ferramenta.
- **Valor dentro de objeto se mostra antes.** Dito de passagem, ninguém entende.
- **O narrador não conta o que a tela mostra.** Ele fica com o que a imagem não diz (o que o herói sente, a história entre os dois), com o fato **com contexto** e com a pergunta do fim.
  - Skill, buff e sistema aparecem como **aviso na tela**, sem explicação na voz.
  - Informação técnica entra pela boca de quem tem motivo pra saber, nunca como frase-dado solta. No desespero, a fala é emoção, e a luta mostra o resto.
- **Vilão:** descrever pelo que ele faz (a cabeça estala pra cada barulho), não com comparação técnica ("como se pulasse quadro").
- **Escolha:** nasce do que está na tela no fim; as duas opções custam algo da mesma pessoa. Todo custo de escolha passa pelo livro-razão (quem sabe o quê) antes de ir pra aprovação.
- **Callback:** se nem quem dirige pega a referência, o público também não. Dizer o essencial em 1 frase, ou mostrar.

## 3. Voz
- Sem sussurro, em nenhuma fala (nem tag de sussurro nem reticências que puxem sussurro).
- Acelerar no máximo **1,1×**. A narração fica num take só e o visual é que se ajusta à voz.
- **Voz é paga.** Só com o seu ok direto, sabendo o custo. No motor: `voz/gerar_voz.py` só gera com `--confirmo-custo`.
- Uma voz fixa por personagem, anotada aqui com o id. Voz de máquina (o vilão): a mesma voz com processamento mais grosso.
- **Pedido de fala nova:** confirmar QUEM fala antes de gerar. Personagem que ainda não falou na série não ganha voz por nota solta.
- **Pedido de tirar fala:** sai a voz, a cena fica.

## 4. Imagem e personagens
- **Estilo:** massinha da ficha oficial, com look 3D de cinema. Nada realista.
- **Personagem novo ou redesign:** num CHAT NOVO do gerador, editar a figura da ficha (imagem 1) com o design novo (imagem 2). Sempre anexar referência. Uma imagem por pedido.
- **Olho do elenco:** o branco aparece e só a íris brilha. Exceção, o herói (Nico): olho de BOLINHA PRETA, o da ficha, igual em todos os quadros.
- **Bicho ou objeto ilustrado:** é imagem gerada no estilo da série. O código só põe o efeito por cima (anel, escurecer, brilho). O holograma em traço fino ficou feio.
- **Vilão (General):** concha funda, anéis, sem olho; lembra coruja sem ser explícito; caça pelo som.
- **A cena bate com a história:** depois que o disfarce cai, o personagem aparece sem o disfarce. Quem mira olha o alvo, não a câmera.
- **Um gerador só por episódio:** misturar dois geradores na mesma prancha fez os personagens mudarem de cara.
- **Conferir em tamanho cheio, por outro:** a prancha em miniatura esconde braço faltando e perna flutuando. O revisor (`ciclo/revisor/REVISOR.md`) olha cada quadro inteiro e em duas metades ampliadas, do lado da ficha, com a lista fixa.

## 5. Animação (H3 local)
- **H3 completo:** 20 passos, sem LoRA, 768×1344, RIFE 60.
- **GPU:** uma tarefa por vez; quem sobe o ComfyUI desliga. Quem está usando o PC tem prioridade (`h3/pausa.py`).
- **Movimento:** sempre em movimento. Câmera sobre pintura parada é estática; nada parado mais de 1,5 s.
- **Modelo novo de vídeo:** só entra depois do teste de deriva (quadro de entrada ao lado dos quadros em 0,1 s, no meio e no fim).

## 6. Som
- **Voz na frente.** Música de −17 a −35 dB sob a voz. Música não liga nem desliga seco, a não ser de propósito (o "bosque ficou quieto"). O silêncio só funciona se antes tiver som.
- **Abertura:** o 1º segundo é som da cena. Música de abertura entra abafada ou não entra; nunca "fofa" sobre perigo.
- **SFX:**
  - alinhar pelo ataque, não pelo pico;
  - poucos, reais, amarrados a um evento na tela;
  - nada repetitivo o vídeo inteiro (bip em loop cansa);
  - o BUM não cai em cima de palavra.
- **Celular:** o som tem que tocar no celular.
  - Nunca empurrar agudo pra passar na régua.
  - Grave que some: criar harmônicos médios (saturação + corte do fundamental, centro ~1 kHz).
- **Medidas:** −14 ±1 LUFS, pico ≤ −1 dBTP, celular ≥ −20 LUFS.

## 7. Montagem e tela
- **Texto e cartões:** fora dos 15% de baixo (UI do Instagram) e da borda.
- **Tela de escolha:**
  - a metade de baixo escurece;
  - 2 botões grandes, com a consequência escrita (ATIRA e vira ALVO / FICA PARADO e a Iara é levada);
  - "COMENTA 1 OU 2".
- **Vídeo extra curto (micro):** é post separado, não entra no episódio.
- **Tela colada em perspectiva** em cima de imagem (celular, painel) fica falsa. Usar plano de cima, tela reta, ou não usar.

## 8. Capa, legenda e entrega
- **Capa:** quadro em tela cheia + **só "EP. X"** dourado (+ "PARTE N") + o nome da série, tudo dentro do recorte 3:4 (y 240–1680). Título do episódio na capa polui. Sem spoiler: a capa mostra só o começo.
- **Legenda:**
  - lembra o voto e põe os números das opções (1 · …  2 · …) + "Comenta 1 ou 2";
  - pode contar a ciência do episódio em parágrafos curtos antes das opções;
  - pista de lore simples (nada de acróstico; nada óbvio demais).
- **Entrega:** yuv420p, AAC 48 kHz; prévia `_celular` com menos de 30 MB; versão de postar em crf 18.
- **Antes de postar:** recontar o voto do episódio anterior e pôr o placar no selo.

---

## Registro (TENTATIVA → O QUE DEU → REGRA → ONDE ENTRA)
Exemplo de como a série registra o que aprendeu. As linhas abaixo são do LUMEN.

| Tentativa | O que deu | Regra | Onde entra |
|---|---|---|---|
| Capa com o título e a cena do clímax | Reprovada: spoiler | A capa mostra só o começo do episódio | §8 capa |
| Roteiro com profecia e "escolhido" | Reprovado: clichê, infantil | Contar por 1 pessoa concreta | §2 |
| Redesign realista de personagem | Reprovado: destoa do elenco | Editar a figura da ficha em chat novo | §4 |
| Celular colado em perspectiva na imagem | Reprovado: parece falso | Plano de cima, tela reta | §7 |
| Bip em loop no vídeo inteiro | Reprovado: desagradável | Poucos sons, amarrados a evento | §6 |
| Micro-vídeo dentro do episódio | Reprovado | Micro é post separado | §7 |
| Holograma de bicho em traço fino por código | Reprovado: feio | Bicho = imagem gerada + efeito em código | §4 |
| Bicho de massinha gerado no estilo | Aprovado | Idem | §4 |
| Título do episódio na capa | Reprovado | Capa só EP. X + PARTE N | §8 |
| Legenda com pista óbvia; depois com acróstico | Reprovadas as duas | Pista simples que manda o olhar pro vídeo | §8 |
| Personagem ainda disfarçado no final; herói olhando a câmera | Reprovado | A cena bate com a história; quem mira olha o alvo | §4 |
| Tela de escolha com botões pequenos | Reprovada: difícil de enxergar | Botões grandes com a consequência escrita | §7 |
| Voz descrevendo o vilão com termo técnico | Reprovada | Descrever pelo que ele faz | §2 |
| Som de floresta antes do "ficou quieto" | Aprovado | O silêncio só funciona se antes tiver som | §6 |
| Valor citado de passagem dentro de um objeto | Ninguém entendeu | Mostrar antes | §2 |
| Episódio sem o fato técnico | Reprovado: perdeu a marca | Fato com número em todo episódio | §2 |
| Nome de técnica traduzido ao pé da letra | Reprovado | Descrever, não traduzir | §2 |
| Narrador explicando o buff e o que a tela mostra | Reprovado: óbvio | O narrador não descreve a tela; buff vira aviso | §2 |
| Fato histórico num diagrama parado de 13 s no pico | Reprovado: chato | No pico, a ciência vai pra dentro da ação, em 1 frase | §2 |
| Dica técnica gritada no meio da luta | Reprovada: soa falsa | No desespero, a fala é emoção | §2 |
| Escolha "desconecta ou fica?" | Reprovada | A escolha nasce do que está na tela, com custo real | §2 |
| Opção "usa o poder de novo" | Reprovada | O poder é involuntário e raro | §2 |
| Custo de escolha que contradizia a lore | Erro da sala | Todo custo passa pelo livro-razão | §2 |
| Ciclo loop + grafo no ep6 parte 2 | Aprovado | Episódio novo roda pelo `ciclo/` | `ciclo/LEIA.md` |
| Agente gastando crédito pago com o caminho grátis disponível | Milhares de créditos perdidos | Trava em código (hook) antes de ação em site pago | `ciclo/trava_pago.py` |
| Storyboard "conferido" pelo próprio agente que gerou | Mais de 10 quadros errados em 41 | Revisor de contexto zerado, quadro em tamanho cheio | `ciclo/revisor/` |
| Dois geradores de imagem na mesma prancha | Personagens mudaram de cara | Um gerador só por episódio | §4 |
| Outros modelos de vídeo (rápidos ou novos) no mesmo quadro | Redesenharam os personagens no 1º meio segundo | Animação da série = H3; modelo novo passa no teste de deriva | §5 |
| Olho do herói mudando entre quadros | Reprovado | Olho da ficha, igual em todos os quadros | §4 |
| Episódio de luta com trocas rápidas e clímax em números de HUD | Reprovado inteiro (nota da produção: imagem forte, animação fraca) | 1 ação clara por plano, corpo mexendo, resultado no mesmo plano | §2 |
| Música "fofa" na abertura sobre cena de perigo | Reprovada | O 1º segundo é som da cena | §6 |
| Título do fato escrito grande na tela | Reprovado | O fato é holograma com 1–2 etiquetas pequenas | §2 |
| Muitas etiquetas, contagem em painel, mensagem escrita | Reprovado: poluído | Menos texto: só skill/buff e o número do fato | §2 / §7 |
| Pedido de "tirar a fala" entendido como tirar a cena | Erro | Sai a voz, a cena fica | §3 |
| Legenda longa contando a ciência do episódio | Aprovada | Legenda pode ter parágrafos curtos antes das opções | §8 |
