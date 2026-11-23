# 35 · Herói 3D PBR a partir de arte de conceito: "A guarda do passo"

Notas da peça de exemplo do estilo. Para rodar, comece pelo `DEMO.md`.

## A peça
- **Heroína:** guardiã de estrada de serra. Elmo fechado com janela escura e furos de respiro, capuz e gola de lã ferrugem, gibão acolchoado azul-petróleo, ombreiras e braçadeiras de bronze, talabartes cruzados com argola e marreta de cabeça de aço. A cabeça fica coberta (cabelo em código é o ponto fraco; capuz ou capacete resolve).
- **Situação (30,5 s, mudo, vertical):** ela sobe a estrada da serra ao entardecer. Umas pedrinhas descem quicando entre as botas, e ela para e olha para cima. Um matacão vem rolando estrada abaixo. Ela firma os pés, ergue a marreta e parte a pedra ao meio. No golpe entra o impact frame de anime: silhueta chapada, pincelada na direção da força, respingo e uma cor só. As duas metades descem pelos lados dela e a poeira assenta. Ela apoia a marreta de cabeça para baixo (a pose do conceito) e segue subindo, passando entre as duas metades.
- **Sem texto na tela.** Abre e fecha no preto.

## Método
1. **Conceito no Z-Image Turbo** (ComfyUI, 1536×1024, 12 passos). Quatro turnarounds com os prompts de `conceito/prompts.txt`; a folha está em `conceito/folha_conceitos.jpg`. A escolhida foi a **A** (`conceito/escolhido.jpg`), a única com capuz por cima do elmo fechado e a paleta mais limpa.
2. **Texturas pintadas no Z-Image** (`tex_novo/`): granito, terra da estrada, acolchoado, lã, bronze e capim, todas pedidas como "macro de superfície, sem silhueta do objeto". Mais uma pintura da serra ao pôr do sol (`tex_novo/serra.jpg`), que vira o fundo num arco de cilindro. Uso de GPU: ~4 min no total. A pasta `tex/` tem texturas de reserva (aço, couro, madeira, pedra etc.) feitas do mesmo jeito.
3. **Medir a arte em pixels** (`recon/exemplo_grade_de_medicao.jpg`). 882 px = 1,80 m. Elmo de 0,50 × 0,38 m, gola de 0,54 m, ombreiras de 1,04 a 1,29 m, cinto a 0,86 m, barra do gibão a 0,39 m, braçadeiras a 0,81 m, faixa de bronze das botas entre 0,26 e 0,32 m, pés afastados 0,29 m. As medidas estão no topo de `_heroi_body.js`.
4. **Modelo three.js** (`heroi.js` = `_heroi_helpers.js` + `_heroi_body.js`):
   - **Geometria:** só superfícies paramétricas e de revolução (surf/tube/strip/lathe). O capuz é uma calota esférica sobre um eixo inclinado para trás, que deixa a boca aberta na frente. Saia em 4 abas que acompanham as coxas.
   - **Material:** MeshStandard PBR com céu PMREM. O aço e o bronze usam 3 mapas casados (cor, rugosidade, relevo) feitos por cima da pintura.
   - **Rig próprio:** IK de perna e IK 3D de braço com polo. Poses da marreta (descanso do conceito, ombro, guarda, erguida, golpe, acompanhamento) misturadas por peso.
5. **Estúdio de comparação:** `estudio.html` + `estudio.py` renderizam 3 vistas no enquadramento da folha. `medir.py` sobrepõe os contornos do conceito e do modelo e imprime a largura por faixa de altura. Foram 5 rodadas até a versão final (`recon/exemplo_conceito_x_modelo.jpg`).
6. **Filme:** `filme.html` + `filme.js` (montado de `_cena_a/_b/_imp/_d.js`). O tratamento de cinema já nasce na cena:
   - sol baixo lateral, névoa tingida e lente longa;
   - DOF em 3 camadas;
   - bloom, clarão e raios do sol, poeira no ar;
   - grade teal/laranja, vinheta e grão;
   - capim desfocado em primeiro plano.

   No golpe (`impactFrame2`, em `_cena_imp.js`), a máscara é renderizada de uma câmera alta, para a silhueta da pedra e a dela lerem juntas.

## Como rodar
- `npm install` e `npm run demo` (ver `DEMO.md`).
- `python estudio.py --out recon/X --q "yc=0.918&d=5.93&v=0.45,0.62,2.8"` gera `recon/X_full.jpg`: o conceito em cima e o modelo embaixo. Depois, `python medir.py recon/X_full.jpg recon/X_sil.jpg`.
- `node render.mjs --times 2,9,19.05 --out saida/folha.jpg` monta uma folha de quadros.
- `node render.mjs --video saida/filme_1080.mp4 --fps 30` renderiza o filme. Por software (`DEMO_CPU=1`) leva ~3,5 s por quadro, ~55 min no total.
- Mudou um arquivo com `_` na frente? `npm run juntar` refaz `heroi.js` e `filme.js`.

## Nossa nota
- **Modelo contra o conceito: ~55–60%.** Batem:
  - proporção geral e silhueta (contorno a menos de ~5% na maior parte das faixas);
  - lista de peças e onde cada uma fica;
  - paleta;
  - elmo com janela, fenda e furos;
  - capuz, gola, X do talabarte com argola, fivela quadrada;
  - ombreiras, braçadeiras e faixas das botas.

  O que fica abaixo:
  - **elmo:** é uma bola; na arte, a viseira avança em quilha até o queixo;
  - **acolchoado:** os gomos parecem azulejo, contra o feltro macio da arte;
  - **lã:** tricô marcado, contra o feltro liso;
  - **bronze:** no estúdio sai mais escuro e manchado (é o ambiente cinza refletido);
  - **mãos e botas:** mais "boneco de massinha" que as da arte;
  - **marreta:** na vista de descanso, a cabeça fica grande e encosta no pé.
- **Filme:** a história é curta e clara (um gesto só), o impact frame lê bem (pedra × pessoa vistas de cima) e não tem legenda.
- **Problemas conhecidos:**
  - pedras grandes nas encostas, vistas de baixo, às vezes parecem soltas no ar;
  - a textura de granito fica granulada demais quando a pedra chega perto da câmera;
  - o brilho alaranjado domina, e a sombra azul-petróleo aparece pouco;
  - a marreta erguida fica quase escondida atrás dela no plano 6 (a leitura vem da pedra crescendo);
  - as metades da pedra têm a face de corte lisa demais.

## Conferência do vídeo original
Passou na checagem automática com 0 falhas e 2 avisos esperados: "sem faixa de áudio" (a peça é muda) e "5 quadros vazios" (o fade do preto e o clarão do impact frame). 30,5 s, `yuv420p`.
