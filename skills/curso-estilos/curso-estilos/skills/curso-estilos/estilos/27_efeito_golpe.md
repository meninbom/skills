# 27 · Efeito de golpe

> Vitrine: golpe do lobo e o ESTRONDO no episódio 5 da nossa série · Custo: grátis · Ferramentas: Effekseer (packs CC0), Python + OpenCV, FFmpeg; opcionais: SAM 2 (recorte por IA), Natron

## O que é
Um efeito de partículas pronto (hit, corte, explosão, magia) colado por cima de um vídeo que já existe, cravado no som do golpe. O espectador vê o impacto "estourar" no ponto certo, com cauda curta, sem cobrir o número de dano. Funciona porque o efeito é de artista (biblioteca Effekseer) e o timing é medido, não chutado.

## Exemplo e arquivos
- Prévia do catálogo: `catalogo/previas/27.mp4`
- Motor: `motores/27/aplicar_fx.py` (os campos de cada golpe estão documentados no topo do arquivo)
- Efeitos que vêm no pacote (5, já renderizados em quadros): `motores/27/quadros/` · autores e licença em `motores/27/FONTES.md`
- Exemplo de lista de golpes: `motores/27/golpes_exemplo.json`
- Como montar a biblioteca completa (300+ efeitos): `motores/27/montar_biblioteca/LEIA.md`

## Ferramentas e instalação
Tudo grátis.
- Python 3.9+ com `numpy` e `opencv-python` (`pip install -r requirements.txt`); FFmpeg no PATH.
- Os efeitos: cada um é uma pasta de quadros JPG no preto, 9:16, 30 qps, com o centro do efeito no centro do quadro. O pacote traz ToonHit, hit_eff, MagicCold, Sword1 e Blow1 em 540×960. Para vídeo final em 1080×1920, renderize os seus em 1080×1920 (ver `montar_biblioteca/LEIA.md`).
- Editor Effekseer 1.70 (só para montar a biblioteca completa; o demo não precisa).
- Opcional, recorte por IA para o efeito passar ATRÁS de um personagem: SAM 2 (github.com/facebookresearch/sam2). Um clique no objeto gera a máscara em todos os quadros; salve como PNGs e passe em `matte`. Usa GPU: uma tarefa de GPU por vez.
- Licença: só packs CC0 ou com licença comercial clara. Anote autor e pack num FONTES.md do projeto.

## Motor
`motores/27/`:
- `aplicar_fx.py`: um golpe pela linha de comando ou vários por JSON (`--linha`). Faz: estouro cravado no tempo (ou achado no som com `"t": "auto"`), carga (brilho crescendo antes), flash, cauda curta (`dur` + `fade`), rastreio da tremida (`seguir`), máscara (`matte`) e som do golpe alinhado pelo ataque (`sfx`).
- `demo.py`: gera um clipe-placeholder por código e aplica o ToonHit.
- `quadros/`, `FONTES.md`, `golpes_exemplo.json`, `requirements.txt`.
- `montar_biblioteca/`: `servidor.py` + `biblioteca.html` (renderizam qualquer `.efk` em quadros) e `folha.py` (catálogo numerado).

## Passo a passo (ponta a ponta)
1. Copie `motores/27/` para a pasta do seu projeto e rode o demo (`motores/27/DEMO.md`):
   ```bash
   pip install -r requirements.txt
   python demo.py
   ```
   Sai `saida/demo.mp4` (3 s, mudo) e `saida/placeholder.mp4` (o mesmo sem o efeito). Compare os dois.
2. No seu vídeo, ache o golpe: faça uma tira de 8 quadros por segundo do plano (`ffmpeg -i plano.mp4 -vf "fps=8,scale=180:-1,tile=16x1" tira.jpg`) e anote o quadro do impacto e o ponto (x, y). Se o vídeo tem som, deixe o motor achar o ATAQUE do som: `"t": "auto"` com uma janela de ~0,8 s.
3. Escolha o efeito. Na dúvida entre 2 ou 3, renderize os candidatos lado a lado e escolha vendo, não pelo nome.
4. Escreva um `golpes.json` (um objeto por golpe; modelo em `golpes_exemplo.json`) e rode só a cena:
   ```bash
   python aplicar_fx.py IN.mp4 CENA.mp4 --linha golpes.json --corte INI FIM
   ```
   Golpe único, direto na linha de comando:
   ```bash
   python aplicar_fx.py IN.mp4 OUT.mp4 --fx ToonHit --t auto --janela 54.6 55.2 --x 464 --y 1184 --seguir --dur 0.5 --carga 0.3
   ```
5. Confira a tira de 8 qps do resultado: estouro no ataque do som, cauda acabou antes do corte, nada cobrindo número ou legenda.
6. Só depois de aprovar a cena, rode o vídeo inteiro (sem `--corte`).
7. Entrega: MP4 `yuv420p`, e a checagem objetiva no final (`estilos/29_checagem_objetiva.md`).

## Pegadinhas medidas
- **Estouro DEPOIS do hit-stop.** Na versão que funcionou, o estouro caiu logo depois do congelamento de 8 quadros (~0,13 s a 60 qps), não no quadro do impacto. Com hit-stop: `t = impacto + hit-stop`.
- **Cauda curta.** Estouro de 0,22–0,4 s; `dur 0.3–0.5` + `fade 0.15–0.2`. Deixar o efeito tocar inteiro, solto do som, parece colado por cima.
- **Receita de partida:** `escala 0.75, forca 0.55, cor gelo, modo screen`. Cena clara pede força ~0,55; cena escura aguenta 0,8.
- **Cena que treme:** `seguir` liga o rastreio por fluxo óptico. Sem isso o efeito descola do objeto. O rastreio precisa de textura ao redor do ponto (cantos, detalhes); em fundo liso ele não tem onde agarrar e o efeito fica parado.
- **Som do golpe: alinhar pelo ATAQUE, não pelo pico.** Ataque = 1º ponto acima de ~30% do envelope, com ~30 ms de folga. Alinhado pelo pico, o som chega um pouco fora de ritmo.
- **"Cinematic hit" de trailer demora ~0,8 s para chegar no pico** e tem cauda de segundos: alinhado pelo início do arquivo, soa atrasado, exagerado e alto.
- **Volume:** impacto 8 dB abaixo da voz, swish e splash 12 dB abaixo. A 3 dB ficou alto; a 12 dB ficou tímido.
- **O BUM nunca cai em cima de palavra falada.** Vem depois da palavra.
- **`modo add`** estoura mais que `screen`: só em fundo escuro.
- **Natron** (compositor grátis) deu um resultado bem sutil num plano claro. Só vale para a luz do golpe pintando um ambiente escuro.
- Tempo: ~15 s por cena de 4 s em 1080×1920.

## Custo e tempo
Grátis. CPU. ~15 s por cena de 4 s. Só o recorte por IA (SAM 2) usa GPU. O som do golpe vem da sua biblioteca de efeitos ou de um pack CC0; nenhum som vai no pacote.

## O que funcionou e o que não funcionou
- Funcionou: efeito curto, dessaturado (`gelo`), em `screen`, com o estouro logo depois do hit-stop. O golpe parece parte da cena.
- Não funcionou: efeito tocando inteiro, sem ligação com o som. O olho percebe o atraso e a cauda cobrindo a ação seguinte.
- Funcionou: juice visual junto (flash de 1 quadro, número de dano, tremida). O efeito sozinho é metade do golpe.
- Não funcionou: som de trailer alinhado pelo início e alto demais. Medir o ataque e baixar 8 dB resolveu.
- Escolher o efeito vendo opções lado a lado é mais rápido que adivinhar pelo nome.
- Nossa nota: 8 de 10 no golpe do episódio 5 da nossa série. Perde quando a cena é clara (o efeito de luz some) e quando o efeito pede poeira ou fumaça escura.

## Roteiro de aula
- **Objetivo:** o aluno sai sabendo colar um efeito pronto num golpe, cravado no som, com cauda curta.
- **Demonstração (~12 min):**
  1. Antes × depois: `saida/placeholder.mp4` × `saida/demo.mp4` (1 min).
  2. Abrir `quadros/` e trocar o efeito do demo (`python demo.py Blow1`) (2 min).
  3. Tira de 8 qps: achar o impacto e o hit-stop (2 min).
  4. Escrever o golpes.json, rodar com `--corte`, ver o resultado (4 min).
  5. Errar de propósito: efeito inteiro (sem `dur`) e som pelo pico. Mostrar por que fica ruim (3 min).
- **Exercício:** pegar um plano de golpe de 4 s e aplicar um efeito. Deu certo se: o estouro cai no ataque do som (ou logo após o hit-stop), a cauda some antes do corte e o efeito não cobre número nem legenda.
- **Pré-requisitos:** `estilos/29_checagem_objetiva.md`. Ajuda ter visto `estilos/62_poderes_game_feel.md` (o juice em código, que é o outro caminho).

## Limites conhecidos
- O pacote traz 5 efeitos em 540×960. A biblioteca completa você monta (`montar_biblioteca/LEIA.md`); isso exige o editor Effekseer 1.70 e não é coberto pelo demo.
- Efeitos com mistura normal (fumaça escura, poeira) ficam fracos: os quadros são no preto e a composição é screen, então só luz aparece.
- O efeito é 2D colado na tela: não gira com a câmera nem recebe a luz da cena. Em plano com câmera orbitando, denuncia.
- Passar atrás de personagem depende de uma máscara por quadro (SAM 2 ou recorte manual), que não vem no pacote.
- `"t": "auto"` acha o maior salto de energia na janela. Se a janela pega dois golpes, ele escolhe o mais forte: aperte a janela.
