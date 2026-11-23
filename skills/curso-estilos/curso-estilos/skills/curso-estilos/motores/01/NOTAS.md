# POV: o elevador parou no 13 (EP 1), peça original de 15 s, 100% código, muda

Feita para testar se o motor, que nasceu num estudo de um reel de terror em POV num parquinho, serve para uma história nova.

**O que veio do estudo (o ofício):**
- motor: cubemap, olho de peixe e contorno em pixels de saída;
- toon de 2 tons, legenda e título em Rubik com pílula "EPISÓDIO";
- mãos SDF (poses novas "aponta" e "agarra");
- tremida de mão medida da ref;
- desfoque de movimento nos viradões (`render.mjs`).

**O que é novo:**
- cabine de inox, com display e painel em canvas que mudam com o tempo;
- corredor em segmentos com luz própria, que apagam de longe para perto;
- silhueta com olhos acesos, e uma mão cinza na porta;
- texturas: carpete, papel de parede, porta numerada, piso xadrez;
- névoa escura configurável (uFog/uFogC);
- luz de teto em vez de sol.

**Roteiro:**
- **0–3,6 s:** aperta o 12 e o display sobe: 9, 10, 11, 12… 13 (ding).
- **4–9 s:** "Meu prédio só tem 12 andares." / a porta abre: "Esse andar não existe." / "E todas as portas são 13..."
- **9–11 s:** o fundo do corredor apaga; uma lâmpada falha em cima de uma silhueta: "Tem alguém ali."
- **11–13 s:** viradão para o painel, soca o T: "Fecha! Fecha! Fecha!". As luzes vão apagando até a porta.
- **13,2 s:** a porta está fechando e uma mão cinza segura; os olhos aparecem pela fresta.
- **14,25 s:** corte para o preto. Cartela: "Você abre a porta ou aperta o T? Comenta."

**checar-video:**
- piscadas eram 6/s; agora são quedas de luz espaçadas, ≤ 3/s;
- sobrou só a plaquinha "1301" do cenário encostando na borda;
- yuv420p.

**Arquivos:**
- código: `cena.js`, `elevador.js`, `camera.js`, `texturas.js`.
