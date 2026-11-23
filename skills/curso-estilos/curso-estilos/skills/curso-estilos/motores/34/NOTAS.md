# 34: "Antes da chuva" (peça original do estilo "boneco 3D chapado em floresta low-poly")

## O que é
São 31 s, mudos, em 8 planos e 1080×1920 a 30 qps. A Ivi é uma mensageira de capa de chuva mostarda, capuz, cachecol verde-petróleo, bolsa a tiracolo e galocha. Do alto de uma mata de outono ela vê a chuva subindo o vale. Então se vira e corre com a lanterna acesa pela trilha, atravessa a ponte de tábuas sobre o riacho e chega à cabana de toras. No alpendre, pendura a lanterna no gancho no instante em que o temporal chega. Depois se vira para olhar a chuva e enxuga a testa, com a lanterna ainda balançando acima dela.

Planos (s): 1 de costas no alto do vale (0–4,2) · 2 rosto, ela vira e dispara (4,2–8) · 3 lateral contra o sol com troncos passando (8–11,3) · 4 de dentro do riacho, ela cruza a ponte (11,3–14,8) · 5 por cima do ombro com a cabana acesa à frente, primeiros pingos (14,8–17,6) · 6 alpendre: degrau, fôlego, pendura a lanterna (17,6–22,3) · 7 close, ela se vira para a chuva (22,3–26) · 8 aberto na chuva, câmera indo à luz (26–31).

## O que o motor faz
- Troncos torneados (lathe) com casca pintada (`tex/bark.jpg`), sol baixo lateral com sombra 4096 e névoa. A luz começa dourada e vai fechando com a tempestade, até a lanterna virar a luz principal.
- Três passes de profundidade com desfoque por camada; a força do desfoque sai da distância entre a câmera e ela.
- Bloom, vinheta e retícula do motor. Adicionei grade petróleo/âmbar e grão.
- O boneco (`mensageira3d.js`) usa o mesmo shader de 2 tons com fio de luz. Acrescentei a trama de tecido (urdidura × trama) presa no objeto, brilho de capa encerada e a poça de luz da lanterna calculada no shader. A aba da capa voa para trás na corrida, o cachecol é uma corrente de 4 elos e a lanterna faz pêndulo, primeiro na mão e depois no gancho.
- Cenário novo: terreno facetado (flat shading) com vale, leito do riacho e clareira, além de árvores de outono com copa em cartões de folha instanciados. Tem também capim seco, folhiço, samambaias secas, pedras, ponte em arco, cabana de toras com alpendre, janelas acesas e chaminé com fumaça. Completam o cenário as cortinas de chuva no vale, o céu de tempestade em shader, a chuva instanciada, as folhas caindo e as gotas na lente.

## Como roda
- `npm install` e `npm run demo` (ver `DEMO.md`).
- `node render.mjs --tempos 1,6,13 --saida saida/folha.jpg --lt 360` gera uma folha de quadros.
- `node render.mjs --video saida/filme.mp4 --qps 30` gera o vídeo.
- `vendor/` tem o three.js.

## Nota sincera
Contra o melhor estudo feito neste motor (um plano único de corrida), na mesma escala de luz e acabamento: **7/10**.
- **Melhor que o estudo:** tem história com começo, meio e fim, 8 planos de câmera com destino e o tempo virando ao longo da peça. A chuva e a lanterna dão um arco de luz.
- **Pior:** a Ivi ainda é "boneco de formas": cabeça-bola, braços cilíndricos e capa de tubo. De costas, o capuz vira uma bola lisa. Nos planos 6–8 a cabana escura fica chapada atrás dela, sem tanta profundidade quanto a mata. Também falta o recorte de copa escura com folhas penduradas que o estudo tinha.
- **O que falta:** um boneco com mais desenho (rosto um pouco maior e menos de bebê, mão, bico de capuz). Também falta reação ao clima, como respingo no chão e a capa molhada escurecendo. No plano 8 a casa precisa de luz de recorte, e uma passada de "nível de detalhe" na cabana ajudaria (calha pingando, poça refletindo a lanterna).
