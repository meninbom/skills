# Régua de game feel do golpe (medida na série LUMEN)

Os números de um golpe que "pesa": tempo, tamanho e som. Vêm dos episódios da série LUMEN, medidos no vídeo e ajustados no olho, episódio a episódio. O texto é original do plugin.

**Quer mais efeitos?** O site **game-feel-prompts.pages.dev** (Game Feel Prompts) tem centenas de efeitos com tempo e número: crítico, congelamento, dash, subida de nível… Os prompts curtos do site são grátis pra usar nos seus próprios projetos. Abra lá; eles não vêm no plugin.

**Como ler a coluna "Estado":**
- **Funciona:** foi usado num episódio publicado e segurou. Pode copiar.
- **Ponto de partida:** número medido ou recomendado, ainda sem episódio publicado que prove. Use, ajuste no olho e mostre a quem aprova o vídeo antes de fechar.
- **Evite:** já foi testado e deu errado. O motivo está na própria linha, junto do que fazer no lugar.

Quadros a 30 qps: 1 quadro = 33 ms.

## 1. O tempo do golpe
| O quê | Número | Estado |
|---|---|---|
| Congelamento (hit-stop) depois do impacto | ~0,13 s (4 quadros a 30 qps; 8 a 60) | Funciona |
| Congelamento debaixo do flash | num teste, 2 dos 3 quadros parados ficaram sob o clarão e sobrou 1 visível: o congelamento sumiu | Evite → hit-stop DEPOIS do flash |
| Estouro do efeito de partícula | logo depois do congelamento, não no quadro do impacto | Funciona |
| Efeito inteiro | só quando o plano é longo e o efeito é o assunto | Funciona |
| Cauda curta (golpe que não é o assunto do plano) | `dur` 0,3–0,5 s + `fade` 0,15–0,2 s | Ponto de partida |
| Carga antes do impacto (golpe anunciado: flecha de luz, magia) | 0,3–0,5 s de brilho crescendo no ponto | Ponto de partida |
| Flash do impacto | 2 quadros; força 0,3–0,5 (0,55 no `soco` de um episódio no ar) | Ponto de partida |
| Flashes por segundo | no máximo 3 por segundo: clarão rápido demais incomoda e pode fazer mal a quem tem fotossensibilidade (a `/curso-estilos:checar-video` acusa) | Evite passar disso |
| Efeito inteiro, fora do som | o tempo e a animação do efeito brigam com o golpe e a aplicação parece solta | Evite → estouro no som e cauda curta |
| Antes do impact frame | 8 quadros (0,27 s) de tela preta leram como falha de vídeo | Evite → no máximo 2 quadros escuros, com o personagem visível |
| Depois do impact frame | 18 quadros (0,6 s) de foto parada e muda: o ritmo morre | Evite → 4 quadros de hit-stop e solta o movimento |
| Nada parado na tela | no máximo 1,5 s | Ponto de partida |

## 2. A câmera no golpe
| O quê | Número | Estado |
|---|---|---|
| Zoom-soco no impacto | 1,07, voltando rápido (decai em ~0,1 s) | Ponto de partida (num episódio de impacto fraco, não bastou) |
| Zoom-soco mais forte, centrado no ponto de contato | 1,15–1,20 | Ponto de partida |
| Tremida no golpe forte | 12 px por 0,4 s, junto com o som de contato | Ponto de partida |
| Tremida no golpe médio (faísca, flecha pega) | 6–8 px por 0,25 s | Ponto de partida |
| Personagem que apanha, no quadro | ~35% da altura (com 26%, o golpe sumiu) | Ponto de partida |
| Efeito que segue a tremida | `seguir: true` no fx-golpe; sem isso o efeito "descola" do objeto | Funciona |

## 3. O impact frame de anime
São 4 desenhos segurados, nesta ordem (~0,4 s no total):

| Passo | Quadros | O que tem |
|---|---|---|
| Clarão | 2 | quase branco, silhuetas em cinza claro |
| Desenho 1 | 4 | fundo preto; silhuetas brancas + uma cópia a 35% deslocada 46 px contra a força; 16 pinceladas secas de **16–50 px** na direção do golpe; arco de corte de **150 px** de largura na cor de destaque; respingo de 70 gotas de até 60 px |
| Desenho 2 | 4 | invertido: papel claro, silhuetas pretas; 12 pinceladas de **22–60 px**; arco preto de 110 px + fio branco de 46 px; brilho radial da cor de destaque (raio 900 px); respingo pros dois lados |
| Volta | 2–3 | a cena com zoom 1,08 caindo e cor separada; depois, hit-stop |

| O quê | Número | Estado |
|---|---|---|
| A receita acima | 2 valores + 1 cor de destaque, marcas grossas na direção da força | Funciona (no lugar da estrela pontuda, abaixo) |
| Estrela pontuda com raios em volta | lê como explosão de história em quadrinho, toda aguda, e não como golpe de anime | Evite → a receita acima |
| Traço fino | pincelada de 1–8 px e anel de 2–8 px (1/5 a 1/10 da receita): a 1080 px, um traço de 4 px some no celular | Evite → as larguras da receita |
| Cor de destaque | ≥ 8% da tela no desenho 2 (com 0,5% da tela, ela fica invisível) | Ponto de partida |
| Desenho 2 sem vinheta | < 10% de meio-tom nesse quadro (com vinheta e grão por cima, chegou a 36,5% e deixou de ser 2 valores) | Ponto de partida |

## 4. O som do golpe
| O quê | Número | Estado |
|---|---|---|
| Alinhamento | pelo **ataque** (1º ponto acima de 30% do envelope, ~30 ms de folga antes), não pelo pico: pelo pico, o golpe soa um pouco fora de ritmo | Funciona |
| Volume | golpe ~8 dB abaixo da voz; swish e splash ~12 dB abaixo | Funciona |
| Cauda | ~1,0 s com fade | Funciona |
| "Cinematic hit" inteiro | o pico chega ~0,8 s depois do começo e a cauda dura segundos: o golpe soa atrasado e pesado demais | Evite → corte a cauda e alinhe pelo ataque |
| Golpe seco demais, 12 dB abaixo da voz | fica sem impacto | Evite → ~8 dB abaixo da voz |
| O BUM | depois da palavra falada, não em cima dela (em cima, ele cobre a fala) | Funciona |
| Pico do golpe | em < 0,1 s e cai rápido. Num teste, o grave chegou 0,5 s atrasado e ficou 1,5 s num platô, e o impacto ficou fraco | Evite o grave atrasado |
| Celular | perda ≤ 6 dB no filtro de celular; grave puro some → saturar e cortar o fundamental (harmônicos perto de 1 kHz) | Ponto de partida |
| Silêncio antes do golpe ("vácuo") | ~0,25–0,5 s. Silêncio absoluto longo (1,76 s num teste) leu como defeito | Ponto de partida (o longo: evite) |
| Contato + estrondo | contato seco no quadro do impact frame (metal + corpo + cacos); o estrondo grande pode vir depois, como "o ar chegando" | Ponto de partida |
| Estrondo | cai ~20 dB em ~0,5 s; a música entra ~0,35 s depois dele, pra não esconder a queda | Ponto de partida |
| Todo som com um quadro que mostra | SFX sem evento na tela soa fora de ritmo | Funciona |
| Compressor na mix inteira | num teste, compressor 4:1 + limitador na mix inteira deixaram todo golpe no nível da fala (faixa de loudness de 3,8 LU) | Evite → golpe fora do compressor (o `mixar.py` do plugin já separa) |

## 5. Ordem pra montar um golpe
1. Ache o quadro do contato e o ataque do som (o fx-golpe acha sozinho com `t: auto` se o mix já tem o golpe; senão, use `t` do plano + `soco` do `linha_ciclo.json`).
2. Flash de 2 quadros → impact frame (se o golpe é o clímax) → hit-stop de ~0,13 s.
3. Zoom-soco e tremida começam no fim do hit-stop.
4. Estouro do efeito de partícula logo depois do hit-stop, cauda curta.
5. Som de contato no quadro do impacto, pelo ataque, fora do compressor.
6. Mostre só a cena (`--corte`) a quem aprova o vídeo, com 2 ou 3 opções lado a lado quando o som estiver em dúvida. Assim a escolha sai em segundos, sem renderizar o ep inteiro.
