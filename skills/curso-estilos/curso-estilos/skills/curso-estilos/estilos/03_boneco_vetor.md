# 03 · Boneco 2D vetor articulado

> Vitrine: episódio 7 da nossa série, em vetor (2 min 42 s) · Custo: R$ 0 sem voz; com voz, ~1.100 caracteres de narração e falas na ElevenLabs (33 falas, 4 vozes) · Ferramentas: Canvas 2D (JavaScript puro), Node + puppeteer-core com o Chrome do sistema, FFmpeg; Python só para as ferramentas de conferência; ElevenLabs só para voz

## O que é
História contada com bonecos de recorte vetorial: membros em cápsula, rosto desenhado com peças trocáveis, fio de luz no lado da luz e trama de tecido na roupa, sem contorno preto. O cenário é feito de chapas em camadas com paralaxe e desfoque; a câmera só translada e dá zoom. Estilo inspirado em contas de história com boneco vetorial em 2D, medido quadro a quadro. Funciona porque troca detalhe por pose, corte e HUD: a vida vem de pose segurada, expressão, câmera viva e legenda de 2–3 palavras, e isso dá liberdade para ação rápida.

## Exemplo e arquivos
- Prévia do catálogo: `catalogo/previas/03.mp4` (capa em `catalogo/previas/03.jpg`)
- O episódio inteiro em código (45 planos, 162 s): `motores/03/episodio.html` e os atos `motores/03/ato1.js` … `motores/03/ato4.js`
- **Ponto de partida para peça curta**: `motores/03/kit_template/` (cena de 7 s com cenário e cores trocáveis, 3 temas prontos e enquadramento por parâmetro; guia em `motores/03/kit_template/LEIA-ME.md`)
- Histórico do motor (o que mudou nas articulações, na física e no rosto): `motores/03/MUDANCAS_v3.md`; resultado da trava: `motores/03/TRAVA.md`
- Laboratórios para estudar um assunto por vez: `motores/03/lab_anda.html` (a corrida), `motores/03/gerador.html` (personagem por ficha), `motores/03/lab_profundo.html` (corrida com profundidade), `motores/03/lab_ataque.html` (um golpe)
- Como rodar: `motores/03/DEMO.md`; origem e licença: `motores/03/FONTES.md`

## Ferramentas e instalação
- **Canvas 2D**: nenhuma biblioteca JavaScript. Módulos ES abertos por uma página HTML. Grátis.
- **Node 18+** e `npm install` dentro da cópia de `motores/03/` (instala só o `puppeteer-core`, que usa o Chrome já instalado). Chrome fora do lugar padrão: variável `CHROME_PATH`. **FFmpeg** no PATH. Grátis.
- **Python 3.10+** (opcional, para trava e pranchas): `pip install -r requirements.txt`. O Playwright abre o Chrome do sistema (`motores/03/_chrome.py`); não precisa baixar navegador.
- **Fonte**: Roboto Condensed em `motores/03/fontes/rc_latin.woff2` (OFL).
- **ElevenLabs** (PAGO, opcional): `motores/03/gerar_vozes.py` usa a API com a sua chave na variável `ELEVENLABS_API_KEY`. Sem `--confirmo-custo` ele só mostra a conta de caracteres e para.

## Motor (dentro do plugin)
Em `motores/03/` (~600 KB, o episódio inteiro em código e o kit de partida):
- `motores/03/boneco.js`: o rig 2D. Esqueleto (`esq`), mistura de poses (`mix`), formas com fio de luz e trama, rosto, pano × chão (`noChao`), piscar, boca pela fala, e `checaJuntas()` (a trava).
- `motores/03/elenco.js`: personagens escritos à mão (Iara, General) no padrão do boneco.
- `motores/03/gerador.js`: gerador de personagem por ficha (`gerar(ficha)`, `sorteia(semente)`): corpo, cabeça sempre coberta, roupa, capa, extra, 6 paletas fechadas.
- `motores/03/fisica.js`: `salta`, `pousa`, `equilibrio`, `mola`, `anda` (com `ritmo`, `exagero`, `quique`, `segue`, `agil`). `motores/03/fisica_v5.js` é a corrida que vale.
- `motores/03/motor.js`: cena em camadas com paralaxe e desfoque, câmera, acabamento (vinheta, grão), tremida, legenda, pílula de HUD, cubinhos, anel de som, faíscas.
- `motores/03/comum.js` (poses e HUD compartilhados), `motores/03/ato1.js` … `motores/03/ato4.js` (45 planos), `motores/03/episodio.js` (junta os atos e calcula o tempo de cada plano pela voz medida em `motores/03/vozes.json`; o arquivo vem vazio e, enquanto estiver vazio, vale a estimativa de palavras por segundo).
- `motores/03/kit_template/`: o kit de partida. `cenario.js` (temas: cores e desenho das camadas), `cena.js` (personagem e linha do tempo), `palco.js` (ordem das camadas, câmera, enquadramento, legenda), `kit.html` (a página do render) e `LEIA-ME.md`.
- Laboratórios: `motores/03/lab_anda.html`, `motores/03/lab_fisica.html`, `motores/03/lab_ataque.html`, `motores/03/lab_luta.html`, `motores/03/lab_profundo.html`, `motores/03/lab_ritmo.html`, `motores/03/gerador.html`, `motores/03/ficha.html`.
- Render: `motores/03/render.mjs` (folha ou vídeo), `motores/03/render_par.mjs` (divide em N processos e junta).
- Conferência (Python): `motores/03/trava.py` (reprova articulação errada), `motores/03/folha_poses.py` (ladrilhos grandes por plano), `motores/03/foto_gerador.py` (prancha do gerador).
- Voz: `motores/03/linha.json` (as 33 falas com quem fala), `motores/03/vozes_config.exemplo.json`, `motores/03/gerar_vozes.py`, `motores/03/medir_vozes.py`.

## Camadas do cenário (e onde ficam as cores)
O quadro é montado de trás para a frente, sempre nesta ordem. Cada camada tem uma **paralaxe** (`p`: 0 = parada no fundo, 1 = anda junto com o boneco, mais que 1 = passa na frente dele) e um **desfoque** (longe e muito perto ficam borrados; a ação fica nítida).

| Ordem | Camada | O que é | No episódio (`motores/03/motor.js`) | No kit (`motores/03/kit_template/cenario.js`) |
|---|---|---|---|---|
| 1 | céu | o fundo de tudo, um degradê | `CEU`, p 0,06 | `ceu` (num interior, é a parede) |
| 2 | fundo | o que está longe | `LONGE`, p 0,2, bem borrado; depois os raios de luar | `fundo` |
| 3 | meio | entre o longe e a ação | `MEIO`, p 0,42, e `PERTO`, p 0,72, com névoa entre eles | `meio` |
| 4 | chão | onde o boneco pisa | `CHAO`, p 1 | `chao` |
| 5 | ação | bonecos e objetos | a função de desenho do plano | o boneco da `cena.js` |
| 6 | frente | o que passa na frente da câmera | partículas no ar e `FRENTE`, p 1,6, bem borrada | `frente` (some no close) |
| 7 | acabamento | por cima de tudo | brilho, vinheta e grão; depois legenda e HUD | `vinheta`; depois a legenda |

- **No episódio de exemplo** o cenário (o bosque azul de noite) e as cores dele estão escritos dentro do `motores/03/motor.js`, no bloco "bosque noturno". Serve para estudar; para outro tema, não reescreva o motor: parta do kit.
- **No kit** o cenário e as cores ficam fora do motor, em `motores/03/kit_template/cenario.js`. Cada tema traz `ceu`, as 4 camadas (`fundo`, `meio`, `chao`, `frente`), o bloco `cores` (as cores do cenário), o bloco `boneco` (a paleta do personagem), `amb` (o clima de cor em cima do boneco) e `luz` (o fio de luz na borda).
- **Trocar de tema**: mude uma linha no `cenario.js`, `export const TEMA = 'dia';` para `'interior'` ou `'chuva'`. Vêm 3 temas prontos (dia claro na rua, sala quente e cidade à noite na chuva, com luz que brilha nas janelas e nos postes). O `LEIA-ME.md` do kit traz a tabela dos campos de pose do boneco e a câmera apontada para um ponto (`palco.cameraEm`). Para um tema seu, copie um deles e dê outro nome.
- **Trocar o enquadramento**: no `motores/03/kit_template/cena.js`, `PLANO` aceita `'aberto'`, `'medio'` (padrão) ou `'close'`. A tabela `PLANOS` do `palco.js` diz quanto da altura do quadro o boneco ocupa em cada um (aberto 36%, médio 56%, close só o rosto e os ombros). Se o personagem sair pequeno, é aqui que se resolve, e não aumentando o boneco.
- **Tamanho do quadro**: `--vw` e `--vh` no render do kit (padrão 1080×1920; funciona em horizontal, o cenário se repete para os lados sem esticar).

## Passo a passo (ponta a ponta)
1. **Rodar o demo.** Copie `motores/03/` para a pasta do seu projeto e, dentro dela:
   ```
   npm install
   npm run demo
   ```
   Sai `saida/demo.mp4` (3 s do episódio, 540×960, 30 qps, mudo).
   **Peça curta, de outro tema?** Não comece pelo episódio: comece pelo kit. `npm run kit` renderiza `saida/kit.mp4` (7 s, mudo); depois troque o tema e as cores em `kit_template/cenario.js` e a linha do tempo em `kit_template/cena.js`. Para testar sem editar: `node render.mjs --pagina kit_template/kit.html --video saida/kit.mp4 --tema interior --vw 540 --vh 960`.
2. **Texto fechado antes de tudo.** Roteiro em narração corrida. Depois, prancha numerada dos quadros-chave no nível final, e só então animação.
3. **Personagem**: escreva uma ficha no `motores/03/gerador.js` (ou sorteie) e tire a prancha de vistas e expressões:
   ```
   python foto_gerador.py --out _poses/gerador_folha.jpg --seed 3
   ```
   Cabeça sempre coberta (capuz, gorro, touca).
4. **Poses e planos**: cada plano é um objeto com `id`, falas e uma função de desenho que recebe `t` e `u` (0..1 do plano). Poses nomeadas ficam no `motores/03/comum.js`. Abra cada cena com plano aberto; close só como resposta.
5. **Trava das articulações** (sai com código 1 se reprovar):
   ```
   python trava.py --qps 12
   ```
6. **Conferir pose em tamanho grande**, plano por plano:
   ```
   python folha_poses.py --out _poses/agora.jpg A1-02:0.5 A2-05:0.2,0.8
   ```
7. **Render em paralelo** (o filme inteiro a 60 qps):
   ```
   node render_par.mjs --pagina episodio.html --saida saida/filme.mp4 --n 6 --qps 60
   ```
   Para um trecho: `node render.mjs --pagina episodio.html --video saida/prova.mp4 --ini 0 --fim 11.6 --qps 60`.
8. **Voz** (PAGO, opcional). Copie `vozes_config.exemplo.json` para "vozes_config.json", ponha os `voice_id` da sua conta e confira a conta antes de gastar:
   ```
   python gerar_vozes.py --falas linha.json
   python gerar_vozes.py --falas linha.json --confirmo-custo
   python medir_vozes.py
   ```
   O `medir_vozes.py` grava "vozes.json" e o episódio se retemporiza sozinho. Uma fala por arquivo, −16 LUFS, sem sussurro, velocidade no máximo 1,1.
9. **Som**: o motor é mudo. Monte no seu editor ou com FFmpeg: ambiente, trilha e efeitos da sua biblioteca (ou de um pack CC0), cada efeito alinhado pelo ATAQUE (o começo do som) no quadro do evento, voz na frente.
10. **Celular e formato**:
   ```
   ffmpeg -i saida/filme.mp4 -c:v libx264 -profile:v main -level 3.1 -pix_fmt yuv420p -vf scale=720:-2 -crf 24 -c:a aac -b:a 128k -ar 48000 -ac 2 -movflags +faststart saida/filme_celular.mp4
   ```
11. **Checagem objetiva** em todo render (flash, texto pequeno, quadro parado).

## Pegadinhas medidas
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- **É recorte 2D, não 3D.** Três rodadas em three.js foram perdidas por um diagnóstico errado da referência. Antes de dizer "é 3D", meça se a silhueta gira contínua ou troca de vista em 1 quadro.
- **Receita do look**: fio de luz de 3–4 px no lado da luz; hachura a 45° com período de 6,5 px presa na tela e só na roupa; rosto é o ponto mais claro e saturado do quadro.
- **Legenda**: 2–3 palavras, 1 em amarelo (#f1b534), entra de 0,90 a 1,00 de escala em ~5,5 quadros, sai seca, ~3,35 palavras/s.
- **Duração do plano** = 0,37 s + 0,256 s × palavras; 1 oração = 1 plano; mediana 1,53 s. Câmera: todo plano empurra 3–9% e freia (`escala = 1 + A·(1−(1−u)^p)`, A mediano 6,7%).
- **Tremida não é aleatória**: senoide amortecida, x a 14,8 Hz e y a 11,3 Hz, envelope (1−t/T)²; leve 6 px/12 quadros, média 15/16, forte 27/24.
- **Dobra padrão**: de perfil o joelho dobra para a frente e o cotovelo para trás. Antes da trava havia ~100 problemas; depois, 0 em 1.926 quadros.
- **Cotovelo-guia**: escorço sim (braço até 55%, antebraço até 35%), esticar nunca.
- **Andar e correr lisos a 60 qps.** "De 2 em 2" (12 poses/s) fica travado neste estilo; meio-termo e misto também. Liso vence.
- **Tirar "snap" não é amaciar tudo**: easing simétrico em tudo deixa o movimento cremoso, derretido. O contraste vem de ir rápido e segurar. Meça a 2ª diferença de cada junta a 60 qps antes de mexer.
- **A corrida que vale é a v5** (`motores/03/fisica_v5.js`, `anda(u, R, {ritmo: 1, exagero: 1, vz})`), não as tentativas posteriores.
- **Desfoque de primeiro plano**: `ctx.filter` borra pouco; reduzir a 1/54 e ampliar em 2 passos dá o borrão de lente.
- Checagem automática já reprovou este estilo por 5 flashes/s no impact frame e por letra de HUD menor que 52 px.

## Custo e tempo
- R$ 0 sem voz. Com voz: as 33 falas somam ~1.100 caracteres (na ElevenLabs, 1 caractere ≈ 1 crédito; testar 2 vozes para um personagem dobra a parte dele). Ponha um teto com `--teto`.
- Render: ~4 min para 162 s a 60 qps com 8 processos; só CPU e Canvas, não precisa de placa de vídeo.
- Produção: o episódio inteiro (45 planos) saiu em ~1 dia; as 4 versões seguintes foram de articulação, física e rosto.

## O que funcionou e o que não funcionou
- Funcionou: largar o 3D e assumir o recorte 2D. É o estilo que dá mais liberdade para luta e ação rápida.
- Funcionou: a trava automática das articulações. Foi o que tirou joelho para trás e braço esticado de uma vez.
- Corrida, em ordem: a 3ª versão quicava demais; a 4ª melhorou mas tinha "snap" (quina de velocidade); a 6ª amaciou tudo e ficou cremosa; a 5ª é o ponto certo.
- Funcionou: palco em profundidade (o boneco correndo para dentro do cenário), desde que com a corrida certa.
- Não funcionou: animar "de 2 em 2", cabelo em código (cabeça sempre coberta), começar pela técnica em vez da linguagem de forma do personagem.
- Nossa nota: o episódio completo neste estilo ainda não foi publicado nem ouvido com voz; trate como motor sólido com uma peça-piloto.

## Roteiro de aula
- **Objetivo**: o aluno sai sabendo gerar um boneco de recorte por ficha, posar com IK sem quebrar articulação e montar um plano com camadas, câmera e legenda.
- **Demonstração (~30 min)**: (1) quadro de uma referência em tamanho cheio: o que denuncia recorte 2D, 4 min; (2) `motores/03/gerador.html` com 3 sementes e uma ficha escrita à mão, 5 min; (3) uma pose errada e a trava acusando, depois corrigida, 6 min; (4) `motores/03/lab_anda.html` variando `ritmo`, `exagero` e `quique`, 6 min; (5) um plano no `motores/03/motor.js`: camadas, empurrão de câmera, legenda de 3 palavras, 6 min; (6) render de 5 s e checagem, 3 min.
- **Exercício**: partindo do `motores/03/kit_template/`, criar um personagem por ficha e animar 6 s (anda → para → olha → fala uma frase de 5 palavras) em 2 planos. Deu certo se: `motores/03/trava.py` passa, pé plantado não escorrega, legenda com 2–3 palavras por vez, checagem sem texto pequeno.
- **Pré-requisitos**: nenhum. É base para o estilo luta (luta 2D) e para o 62 (poderes e juice).

## Limites conhecidos
- Sem voz e sem som no pacote: a peça de vitrine nunca foi ouvida com narração; a receita de voz está escrita, e o `motores/03/gerar_vozes.py` não foi exercitado contra a API neste pacote (é pago). Confira a primeira fala antes de gerar todas.
- O script de som do episódio original não vem: dependia de trilha e efeitos sem licença de redistribuição. O passo 9 descreve o método, não entrega um arquivo.
- O gerador de personagem é v0.
- Não há documento único do motor: a documentação está nos comentários do topo de cada arquivo e no `motores/03/MUDANCAS_v3.md`.
- As tags e a velocidade de fala do `vozes_config.exemplo.json` são ponto de partida; cada voz pede ajuste de ouvido.
