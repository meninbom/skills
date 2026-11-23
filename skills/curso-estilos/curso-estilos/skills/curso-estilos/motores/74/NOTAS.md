# 74 · Notas da peça: "E se você ficasse 11 dias sem dormir?"

## A peça
Vertical 1080×1920, 30 qps, 35,6 s (1.068 quadros), muda. Pergunta concreta, com uma pessoa real por trás. Um rapaz de capuz atravessa os 11 dias, e um relógio global "ACORDADO HÁ 000 h · DIA n" corre por cima de todos os cortes sem reiniciar. Os 10 planos:

1. **Aberto:** o quarto à noite (abajur, lua, porta com luz do corredor) e o título.
2. **Insert do despertador:** as horas correm e a luz do dia passa.
3. **Médio na mesa, 17 h:** a cabeça despenca num microssono e volta. Card: 0,05% de álcool no sangue.
4. **Dia 4, câmera baixa:** a sombra dele na parede vira um jogador de futebol americano, e ele faz a pose.
5. **Dia 5:** o quarto vira uma trilha de floresta com fachos de lua, e ele anda nela.
6. **Dia 11, insert de planta:** 100, 93, 86, 79, 72, 65, e o cursor fica piscando.
7. **Revelação, com a câmera abrindo:** "Isso aconteceu: Randy Gardner, 17 anos, San Diego, 1964, 264,4 horas acordado".
8. Ele tomba na cama, o abajur apaga e entra o card "dormiu quase 15 horas e parecia recuperado".
9. **Janela em time-lapse:** os anos correm de 1964 a 2007.
10. **Virada:** 2007, 3h12, ele mais velho (barba, rugas), sentado de olho aberto no escuro. "Começou a ter insônia séria, e culpa o experimento." / "Desta vez, sem querer."

O dado mais frágil é o sono de recuperação: as fontes dão 14 h 40 ou 14 h 46. Por isso o card diz "quase 15 horas" (detalhes no `FONTES.md`).

## O que foi feito para o curso e o que veio do motor aberto
- **Desenhado do zero** (`src/episodes/insone/`):
  - o personagem (`hero.tsx`): capuz sempre levantado, sem cabelo, proporção alongada, moletom sálvia com bolso canguru, calça grafite e tênis tijolo. Tem olheira que cresce com os dias (`tired`) e barba/rugas (`age`);
  - o quarto vertical (`quarto.tsx`) com a versão floresta;
  - o HUD, os cards e o título verticais (`ui.tsx`), mais os 10 planos e a montagem (`shots.tsx`, `index.tsx`).
- **Reaproveitado do motor kelano86/what-if-animation (MIT)**, em `src/engine/`:
  - perspectiva de 1 ponto (`makeRoom`, `Box`, `RoomShell`, `BackWindow`);
  - LightVeil, Glow, Cone e Dust;
  - `poseAt`/`Pose` do rig, com outro corpo por cima;
  - alguns props genéricos (caneca, despertador, calendário, laptop, bola de papel, vaso);
  - os filtros de rim light.
- **No pacote, mas não usados nesta peça:** o boneco de cabeça redonda do motor, os 7 sets em `src/engine/sets/` e o motor de episódio narrado (`src/engine/episode.tsx`). Servem de consulta e de ponto de partida.

## Como roda
```bash
npm install
npm run demo                          # saida/demo.mp4 (3 s, 540×960)
node stills.mjs board                 # saida/board/S1..S10.png (quadro-chave de cada plano)
node stills.mjs frames 100 300        # quadros avulsos
npm run filme                         # saida/filme.mp4 (35,6 s, 1080×1920)
```
- O render roda na CPU: o filme inteiro levou **19 min** (1.068 quadros, 8 abas em paralelo).
- Os cortes são escritos à mão em `index.tsx` (`SEGS`), porque a peça não tem voz para ancorar.

## Checagem técnica do filme
- **Movimento:** maior tempo parado 0,63 s; sem engasgo, sem flash e sem texto cortado.
- **Avisos de texto pequeno:** rótulos do HUD em mono, o relógio dentro do cenário e o rótulo dos cards ("17 HORAS ACORDADO", 30 px). São leitura de apoio; num próximo render, subir o rótulo para 36–40 px.
- **1 aviso de zona da interface do app:** o despertador "00:00" do cenário no plano 9.

## Nossa nota
- **Contra o exemplo do motor de origem: 7,5 de 10.**
  - A luz de fonte, o cenário cheio e o relógio global estão no mesmo nível ou acima.
  - O formato vertical e a história com virada real funcionam melhor que um episódio de "poder" sem pessoa.
  - O personagem é próprio e lê bem.
  - Perde em atuação: as poses são simples, e a queda na cama (plano 8) tem pernas duras.
- **Contra a referência de mercado (explicativo com personagem 3D chapado em cenário 3D): 6 de 10.**
  - Continua 2D em perspectiva falsa, sem câmera girando no mesmo mundo, e os cortes são mais lentos (~17/min contra 20–40).
  - O que entrou da referência: troca de tamanho de plano, insert de planta, HUD com relógio global, cards com o mundo atrás e luz com fonte.

## Problemas conhecidos
- No plano 8 o corpo deitado fica de perfil, com as pernas meio rígidas.
- O plano 2 (insert do relógio) ficou o mais chapado e acinzentado.
- A floresta do dia 5 lê, mas os troncos poderiam ter mais luz de recorte.
- O personagem quase não move as mãos fora dos gestos principais. O movimento vem do balanço, da respiração e da câmera.
- Mudo: ritmo de corte e som ainda não foram testados com narração.
