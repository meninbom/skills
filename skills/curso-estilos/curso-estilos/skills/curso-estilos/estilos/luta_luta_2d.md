# luta · Luta 2D em código

> Vitrine: "Duelo na neve" (Rosa × Otto, 27,4 s, muda) · Custo: R$ 0 · Ferramentas: Canvas 2D, Node + puppeteer-core com o Chrome do sistema, FFmpeg (mesmo motor do estilo 03)

## O que é
Uma luta de perfil entre dois bonecos de recorte, coreografada por chaves: antecipação lenta, golpe em 3 quadros, congelamento no acerto, tremida, poeira, impact frame de anime nos golpes fortes e o oponente voando e arrastando no chão. São 13 acertos em 27 s, de 7 tipos diferentes. Funciona porque o peso não vem de simulação, vem de tempo: carregar devagar, soltar rápido, segurar a pose.

## Exemplo e arquivos
- Prévia do catálogo: `catalogo/previas/luta.mp4` (capa em `catalogo/previas/luta.jpg`)
- A luta inteira em código (27,4 s, 60 qps): `motores/luta/lab_luta.html` + `motores/luta/lab_luta.js`
- Passo anterior (um golpe só, com replay em câmera lenta): `motores/luta/lab_ataque.html`
- Resultado da trava da luta: `motores/luta/TRAVA_luta.md`
- Como rodar: `motores/luta/DEMO.md`; origem e licença: `motores/luta/FONTES.md`

## Ferramentas e instalação
Tudo grátis, igual ao estilo 03: Node 18+ com `npm install` (só o `puppeteer-core`, que usa o Chrome já instalado; `CHROME_PATH` se estiver fora do lugar padrão) e FFmpeg no PATH. Nenhuma biblioteca JavaScript. Fonte Roboto Condensed em `motores/luta/fontes/rc_latin.woff2` (OFL). Python só para a trava: `pip install -r requirements.txt`. Som é a única parte que pede material externo (a sua biblioteca de efeitos ou um pack CC0) e não vem no pacote.

## Motor (dentro do plugin)
Em `motores/luta/` (~250 KB, roda sozinho, sem depender da pasta do estilo 03):
- `motores/luta/luta.js`: motor de chaves. `lutador(ficha, dir, X0, pose0)` devolve um objeto com `.k(tempo, x, pose, opções)` e `.run(t0, t1, corrida)`. Pés no MUNDO: `plant: 'N' | 'F' | 'NF'` prende o pé (não escorrega), `slide: true` escorrega sem dar passo, e o pé que muda de lugar faz o arco do passo sozinho. `estado()` e `poseDe()` resolvem a pose num instante; `relogio()` converte tempo do vídeo em tempo da ação, descontando os congelamentos.
- `motores/luta/lab_luta.js` + `motores/luta/lab_luta.html`: a luta inteira. Coreografia em 10 trechos comentados, tabela de tipos de acerto, câmera, poeira, rastro (smear), faíscas do acerto, disparo do golpe final, impact frame, cenário. `?folha` gera o raio-X dos acertos.
- `motores/luta/acao.js`: sequência de um golpe (corre → freia derrapando → pula para trás → carrega → golpe) e os utilitários de braço (`ombro`, `cotovelo`, `limRel`, `alcance`). `motores/luta/lab_ataque.js` + `motores/luta/lab_ataque.html`: o laboratório desse golpe.
- `motores/luta/boneco.js`, `motores/luta/fisica.js`, `motores/luta/gerador.js`: as mesmas peças do estilo 03 (rig, corrida, gerador de personagem).
- `motores/luta/render.mjs` (folha ou vídeo), `motores/luta/trava.py` + `motores/luta/_chrome.py`, `motores/luta/folha_poses.py`, `motores/luta/package.json`.

## Passo a passo (ponta a ponta)
1. **Rodar o demo.** Copie `motores/luta/` para a pasta do seu projeto e, dentro dela:
   ```
   npm install
   npm run demo
   ```
   Sai `saida/demo.mp4` (3 s com um acerto forte, 540×960, 30 qps, mudo).
2. **Escrever a luta em batidas**, não em quadros: quem ataca, tipo do golpe, quem leva, onde cai. A luta do motor tem 10: troca inicial, bloqueios, chute forte, queda, sequência de 3 leves, tranco de ombro (ela voa e cai em três apoios), golpe carregado final, ele voa girando e arrasta.
3. **Dois personagens pelo gerador**: `gerar(ROSA_FICHA)` e um oponente de silhueta oposta (Otto: corpo forte, capuz, outra paleta). Contraste de tamanho lê melhor que contraste de cor.
4. **Poses nomeadas** no topo do `motores/luta/lab_luta.js` (guarda, soco, bloqueio, voo, deitado). Mãos relativas ao ombro; o cotovelo é calculado.
5. **Coreografia por chaves**, um lutador por vez, com `plant` em todo pé que deve ficar parado.
6. **Lista de acertos**: `[tempo, quem bate, com o quê, tipo, cor]`. O tipo puxa congelamento, tremida e impact frame da tabela.
7. **Folha e raio-X**:
   ```
   npm run raiox
   npm run folha
   ```
   (por baixo: `node render.mjs --pagina "lab_luta.html?folha" --tempos 0 --saida saida/raiox.jpg --lt 1080` e `node render.mjs --pagina lab_luta.html --tempos 3.4,7.4,9,15.8,19.3,20.1 --saida saida/folha.jpg --lt 360`).
8. **Trava a 30 quadros/s** (a luta do motor passou em 821 quadros amostrados):
   ```
   python trava.py --page lab_luta.html --qps 30 --out TRAVA_luta.md
   ```
9. **Render** (1.643 quadros) e versão de celular:
   ```
   node render.mjs --pagina lab_luta.html --video saida/filme.mp4 --qps 60
   ffmpeg -i saida/filme.mp4 -c:v libx264 -profile:v main -level 3.1 -pix_fmt yuv420p -vf scale=720:-2 -crf 24 -movflags +faststart saida/filme_celular.mp4
   ```
10. **Checagem objetiva**, olhando o item de flashes (limite 3/s).
11. **Som, se houver**: pico do efeito no quadro do acerto (meça o pico dentro do arquivo), impacto ~8 dB abaixo da voz, rastro e respingo ~12 dB abaixo, cauda de no máximo 1,0 s. Para efeito de partícula pronto por cima do vídeo, veja o estilo 27.

## Pegadinhas medidas
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- **Tabela de acertos** (congelamento em s; tremida em px e duração em s; impact frame em quadros):
  - leve 0,06 · 7 px/0,14 · bloqueio 0,06 · 9/0,16 · médio 0,09 · 12/0,20 · bloqueio forte 0,10 · 15/0,24 · chão 0,10 · 20/0,32
  - forte 0,22 · 24/0,34 · impact frame de 10 quadros · mega 0,40 · 36/0,50 · impact frame de 13 quadros
- **Hit-stop é congelamento global do tempo da ação**; efeitos e impact frame continuam no tempo do vídeo. Por isso há dois relógios.
- **Golpe sai em 3 quadros**; a antecipação é que dura. A carga do golpe final caiu para 0,3 s: carga longa demais esfria a luta.
- **Impact frame fraco na 1ª tentativa.** O que resolveu: máscara real da silhueta (canvas + `source-in`), câmera fechando no acerto (zoom 1,6×; 1,75× no mega), 2 valores + 1 cor, pincel seco na direção da força e respingo, segurado 10–13 quadros. Estrela pontuda com raios lê como quadrinho, não como anime: não use.
- **Poeira**: varredura da ação a 60 qps; pé no chão que escorrega solta poeira e pouso solta um tufo. Acerto forte, mega e chão soltam 10–18 partículas em leque.
- **Rajada**: o golpe final empurra capim e poeira com decaimento `exp(−u·2,4)` no tempo e `exp(−dist/500)` no espaço; o disparo alcança 2.200 px em 0,7 s.
- **Oponente voando**: gira o corpo inteiro (`gira`), bate no chão (acerto tipo chão), arrasta com `slide` e só então para. Tentar levantar a cabeça e cair de novo vende o nocaute.
- **Câmera**: depois de cada golpe forte, empurrão de 6% (10% no mega) que decai em ~0,1 s.
- **Pé sem `plant` escorrega** e denuncia na hora; é o erro mais comum.
- Números de referência de game feel, para comparar: hit-stop 0,12 s; tremida 10 px por 0,25 s; impact frame de crítico = 0,1 s de silhueta branca no preto → inverte → volta. As contas de referência deste traço não usam hit-stop nem número de dano: é escolha de estilo.

## Custo e tempo
- R$ 0. Sem voz, sem som, sem IA.
- Render: 1.643 quadros de Canvas 2D em um processo, na casa de poucos minutos; não precisa de placa de vídeo.
- Produção: a luta saiu em uma tarde em cima do motor do estilo 03 já pronto.

## O que funcionou e o que não funcionou
- Funcionou: golpe mais forte com carga mais curta, e a luta com ~30 s. Luta longa com carga lenta perde o espectador.
- Funcionou: impact frame de anime (silhueta chapada, pincel, respingo, 1 cor) segurado por 10–13 quadros. A primeira versão, curta e sem máscara de silhueta, passava despercebida.
- Funcionou em outra peça nossa: flash + número "CRÍTICO" + tremida no golpe.
- Não funcionou: efeito sonoro cinematográfico de golpe exagerado, atrasado e alto demais. Som de golpe é curto, cravado no quadro do acerto e abaixo da voz.
- Não funcionou: estrela pontuda com raios no impact frame.
- Nossa nota: a luta "ficou interessante" como laboratório de coreografia; não é peça pronta para postar (sem som, sem história, uma versão só).

## Roteiro de aula
- **Objetivo**: o aluno sai sabendo coreografar uma troca de golpes por chaves com pé plantado e dar peso com hit-stop, tremida, poeira e impact frame, usando números e não "sensação".
- **Demonstração (~30 min)**: (1) a luta inteira e depois o mesmo golpe sem nenhum efeito, 4 min; (2) ligar um efeito por vez no golpe forte: congelamento, tremida, poeira, empurrão de câmera, impact frame, 10 min; (3) a tabela de tipos e por que leve ≠ mega, 4 min; (4) escrever 3 chaves com `plant` e ver o pé escorregar quando tira, 6 min; (5) o voo e a queda do oponente, 4 min; (6) trava e render, 2 min.
- **Exercício**: luta de 8 s com 3 acertos (leve, médio, forte) e o oponente caindo no último. Deu certo se: `motores/luta/trava.py` passa a 30 quadros/s, nenhum pé plantado escorrega, o golpe forte tem impact frame de ~10 quadros e a checagem não acusa flashes acima de 3/s.
- **Pré-requisitos**: estilo 03 (boneco vetor). Complementa o 27 (efeito de golpe) e o 62 (poderes e juice).

## Limites conhecidos
- **Muda**: sem efeitos sonoros; a regra de som acima vem de outra peça nossa, não desta.
- Só uma versão da luta; não é peça finalizada para postar.
- O cenário do código é um campo frio azulado; não há neve caindo nem pegada na neve. Se a sua vitrine promete "na neve", falta esse passe.
- Sem história nem legenda: é um laboratório de coreografia, não um episódio.
- A documentação da luta está nos comentários do `motores/luta/lab_luta.js`; não há um guia separado.
