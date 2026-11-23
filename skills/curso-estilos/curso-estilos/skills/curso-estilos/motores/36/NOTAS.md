# 36 · Anime em SVG com gramática "em dois" — peça original "Fisgada"

## O que é
Curta mudo de 30 s (1080×1920, 24 qps), desenhado 100% em código (SVG gerado por JS + GSAP), renderizado no HyperFrames 0.9.55.

**História.** Amanhecer com névoa num lago. Uma pescadora de chapéu de palha está sentada no balde, na ponta do trapiche. Na névoa, quase invisível no plano 1, há uma canoa (o plantio). A vara dela enverga. Corta para um rapaz de capa de chuva ocre, cochilando na canoa: a vara dele também enverga. Os dois puxam (tela dividida na diagonal). No plano caro, ela dá o puxão da vida: impact frame, e da névoa sai voando... o rapaz, que cai na água ao lado do trapiche. **Virada:** eles passaram o tempo todo pescando um ao outro, com os anzóis enroscados. **Fecho:** no nó dos dois anzóis há um lambari de verdade. As duas mãos agarram o peixe ao mesmo tempo e puxam. Corta para preto.

Lista de clichês de roteiro: nenhum item marcado. Não tem lore, profecia nem vilão. O risco é pessoal e pequeno, tem humor e o valor vira (sozinhos e competindo → frente a frente, ainda competindo).

## Gramática de anime aplicada
- **Em dois:** os atores trocam de desenho a cada 2 quadros. As poses são poucas (3 a 4 por plano), cada uma com 3 variações de pano (fita do chapéu, cordões do capuz, barra da capa) e respiração, trocadas a cada 4 quadros. Assim nenhum hold fica congelado.
- **Em um:** câmera, névoa, reflexo do sol, ondulação, gotas, espirro, chapéu voando, voo dele e anéis.
- **Plano caro (13,5–20 s):**
  - 9 desenhos únicos dela: 2 de força, antecipação de 4 q, puxão de 2 q, smear de 2 q (crescente como forma + silhueta esticada), follow-through, queda, sentada e piscada;
  - mais 3 desenhos dele girando, 4 da coroa d'água e 3 do espirro.
- **Impact frame (2+4+3 q segurados):** silhueta dela, pincel seco na direção da força, a linha e um arco de golpe em 1 cor (persimmon #cf4527) e respingo de tinta. Primeiro desenho em silhueta clara sobre verde-água escuro, depois creme sobre tinta, depois a inversão em papel. Sem estrela pontuda e sem raios radiais.
- **Holds ≥ 12 q** com vida (pano e respiração). Hit-stop de 4 q depois do impacto.
- **Cortes:** todos por mergulho de cor (haze, ink, deep, accent no plano caro, sun na revelação, ink). Fade final de 8 q para ink.
- **Paleta fechada própria, "Névoa de cobre"** (11 hexes, nada da réplica Indigo moon): ink #0f1d1f, water #1d3a3d, deep #2b5552, fog #93ada3, haze #dcc6a2, sun #fff0d4, glow #eea562, accent #cf4527, straw #c8984f, ochre #d9a43a, skin #e6b08b.
- **Cinematográfico:** sol baixo lateral em contraluz, névoa tingida, juncos desfocados no primeiro plano, contraluz laranja nos personagens, grade teal/laranja, vinheta e grão (turbulência deslocada a cada 2 q).
- **Cabeça coberta:** ela usa chapéu de aba larga e lenço na nuca (quando o chapéu voa, o lenço continua cobrindo); ele usa capuz.

## Rodar e renderizar
```bash
npm install
npm run demo      # 3 s do plano caro, 540×960
npm run folha     # 12 quadros numa folha, para revisar
npm run filme     # os 30 s em 1080×1920, 24 qps
```
- Tudo fica em `index.html`: boneco paramétrico `actor()` com esqueleto `rig()` e IK, cenário, 7 planos e a linha do tempo.
- `render.mjs` faz o papel do HyperFrames: liga e desliga cada `class="clip"` pelo `data-start`/`data-duration` e posiciona a linha do tempo de `window.__timelines` quadro a quadro. A peça original foi renderizada no HyperFrames 0.9.55 (`npx hyperframes render --fps 24 --quality looks`, ~4 min); a composição continua compatível.
- `chuva_lamina/` é o motor de origem (réplica de estudo de 12 s), com a ficha em `SHEET.md`.

## Checagem (medidor automático de flashes, quadro parado e áudio)
- **v1:** a única falha foi "Flashes 4/s" no impact frame (claro → tinta → papel → cena). Para corrigir, o 1º desenho do impact passou a ser verde-água escuro em vez de quase branco.
- **Avisos que ficam, de propósito:**
  - quadro vazio/repetido nos picos dos mergulhos de cor (o mergulho cobre a tela por 1–2 q);
  - sem áudio (a peça é muda de propósito).

## Nota sincera contra a referência (filme Kokuyō, do repositório blixvip html-anime)
**~55–60%.**
- **Ganha da nossa réplica (Chuva e lâmina):** história com virada, 2 atores, luz e névoa melhores e um impact frame no estilo anime de verdade.
- **Perde para a ref:**
  - o desenho dos bonecos ainda é "boneco de palito engordado": membros em traço grosso, mãos redondas e rosto simples;
  - o voo dele em silhueta é pequeno e passa rápido no céu escuro;
  - a revelação (plano 6) é legível, mas o nó dos anzóis fica pequeno no quadro aberto e só se lê bem no close.

## O que falta para subir
1. Mãos com dedos e roupa com dobras em mais poses-chave (o primeiro ganho visível).
2. Um plano intermediário mostrando a linha dela esticando para a névoa antes do voo, para a virada ficar ainda mais clara.
3. Som (fora do escopo: peça muda).
