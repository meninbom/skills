# ESTILO: regras medidas na referência (ofício Kurzgesagt)

Estudo de estilo: mede-se a referência e a nossa arte com os mesmos números, para saber onde a diferença está. Vale para estudo e para orientar o prompt de arte. Continua proibido copiar personagem, logo ou composição exata de terceiros em peça publicada.

As colunas H1, H2 e H3 são os três quadros-chave do filme "Rios voadores"; "Réplica" é um quadro de calibração feito só para estudo. Tudo nesta tabela foi desenhado em código (depois a arte passou a vir de modelo de imagem, ver a receita).

## O que foi medido (`utilitarios/medir.py`, quadros normalizados para ~0,92 Mpx)

| Métrica | ref ~94 s (laranja) | ref ~66 s (lab azul) | ref ~92 s | 1ª versão em código | **Réplica** | **H1** | **H2** | **H3** |
|---|---|---|---|---|---|---|---|---|
| Colorido (Hasler) | 172 | 160 | 158 | 69–88 | 165 | 86* | 159 | 163 |
| Saturação média | 0,77 | 0,79 | 0,83 | 0,43–0,69 | 0,77 | 0,73 | 0,76 | 0,76 |
| Pixels com S>0,6 | 79% | 78% | 85% | 49–77% | 81% | n/a | n/a | n/a |
| Desvio de luminância | 17 | 21 | 24 | 17–28 | 16 | 26 | 18 | 19 |
| Regiões chapadas por 100k px | 66 | 56 | 80 | 37–67 | 50 | 64 | 71 | 67 |
| Matiz da sombra × matiz do meio-tom | 257° × 18° | 245° × 216° | 283° × 25° | 105–202° (mesmo matiz) | 238° × 13° | 242° × 295° | 239° × 155° | 242° × 5° |

\* O mundo noturno da própria referência também mede baixo: abertura de ~2 s = 79; ~9 s = 71. Mundo de uma cor só, à noite, tem esse colorido por natureza.

## As regras que saem dos números
1. **A sombra muda de cor.** A sombra é sempre violeta/azul (238–283°), seja qual for a cor do objeto. Laranja, rosa e verde escurecem para o roxo. Esse era o maior erro da primeira versão em código, onde a sombra era só a mesma cor mais escura.
2. **Figura complementar ao fundo.** Num mundo laranja, os objetos são magenta, violeta e azul, e a folhagem é teal. Num mundo azul, os objetos são ciano, rosa e amarelo. Cada cena tem uma cor dominante, ocupando 40–50% dos pixels.
3. **Saturação alta, valor médio.** Saturação média ≥0,75, com ~80% dos pixels acima de 0,6. A luminância média fica em 50–62 com desvio de 17–24. Preto puro quase não existe: no mundo quente só 1% de escuros.
4. **Cada objeto tem 3 tons e nenhum contorno** (`K.solid`):
   - a base;
   - um crescente de sombra no lado oposto à luz (10–30 px em 720p, ou seja, 15–45 px em 1080×1920);
   - um filete de luz de 4–7 px no lado da luz;
   - uma sombra de contato elíptica no chão, na cor do chão escurecida para o vermelho/violeta.
5. **Caixas com 2 faces** (`K.box`): frente mais lateral escura, que cobre 22–60% da largura. É isso que dá volume sem perspectiva.
6. **Uma luz motivada por cena.** Janela, sol ou tubo brilhando, com feixe translúcido (screen, ~40%) e um halo de 150–600 px. O ponto mais claro do quadro fica colado no herói.
7. **Densidade:**
   - 56–80 regiões chapadas por 100k px, o que dá ~600–700 formas num quadro 720p;
   - em uma grade 3×4, nenhuma célula fica sem um objeto que conte algo: bilhete, cano, livro, lata, planta;
   - a parede vazia carrega textura de tijolo a 16% de contraste.
8. **Canos sanfonados e objetos "de laboratório"** são o vocabulário de ligação: levam o olho de um objeto ao outro.
9. **Hierarquia:** os personagens ficam no meio, na altura do olho, dentro do feixe de luz. O primeiro plano escuro (folhagem teal, ~10% do quadro) enquadra os cantos de baixo.

## Paleta v2 (por mundo)
- **Azul-noite (gancho):** `#070B4A` → `#141A86` → `#3A2AB4` → `#7A3BC8`, horizonte `#FF7A3A`; brilho ciano `#22D7DA` / `#BFF7F9`; acento `#FFD244`, `#ED4BA4`.
- **Azul-lab (explicação):** `#2A50F0` → `#1020B8`; ciano `#1FB8E8` / `#9CF4FF`; rosa `#ED4BA4`; verde-folha `#1DB86A` / `#B8F25A`; terra `#C8503E` / `#8A2E2E`.
- **Laranja (virada):** `#B8300E` → `#E8410C` → `#F2701A` → `#FFB04A`; chão `#F8C25E` / `#FBDA87`; prédios `#9B2BC8`, `#E43FC6`, `#3C79F0`; nuvem `#3A2A9E` com filete `#FF8A5A`.

## Oxi v2 (`K.oxi`)
- Sem brilho especular nem retícula. Corpo de 2 tons com filete, silhueta de feijão com uma crista de onda no alto.
- Os pés continuam sendo os 2 hidrogênios brancos chapados (104,5°).
- Olhos brancos com pupila pequena e 1 brilho. O "feliz" fecha os olhos em arco.
- Estados: líquido (ciano), vapor (branco-ciano, borda de nuvem, pés soltos), chuva (azul).

## Elenco de apoio (originais, geométricos)
Tucano, preguiça, sapinho de prancheta e bem-te-vi. São fauna brasileira, na linguagem de bicho geométrico da referência, mas sem copiar nenhum pássaro dela.

## O que ainda separa da referência (para chegar a 8+)
- **Personagens:** os da referência têm pose e gesto (segura papel, lê, aponta). Os nossos ainda ficam parados em pé. Falta acting.
- **Microdetalhe:** a referência tem ~20% mais formas pequenas (lombada de livro, bilhete com texto, respingo de tinta, rótulo). Na réplica deu 50 contra 66 regiões.
- **Formas mais desenhadas:**
  - as nuvens e as copas ainda são círculos e blobs de procedimento;
  - na referência, cada folha e cada nuvem tem um desenho próprio;
  - os prédios de grade de janela da H3 são o elemento mais "genérico".
- **Repetição:** a corrente de Oxis da H2 é proposital (coesão), mas fica perto de papel de parede. Variar pose e tamanho.

## Adendo: densidade e escala
- Densidade medida: H1 76, H2 135, H3 94 regiões por 100k. A referência vai de 56 a 80. **Teto: ~85.** Acima disso o quadro vira estampa e perde a hierarquia.
- Escala do personagem na referência: herói com 10–25% da área do quadro, 2–4 personagens por quadro. Nosso padrão daqui para frente: 1 herói grande e no máximo ~6 figurantes legíveis por quadro.
