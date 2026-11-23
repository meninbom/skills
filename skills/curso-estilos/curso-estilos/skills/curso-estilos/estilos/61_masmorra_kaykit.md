# 61 · Masmorra 3D com personagens prontos (KayKit CC0)

> Vitrine: "Prova de combate" (maga × 3 esqueletos na masmorra, 12,5 s, muda) · Custo: grátis · Ferramentas: KayKit (GLB CC0), three.js r160 (GLTFLoader, bloom), kit de juice, Node + puppeteer-core (Chrome do sistema), FFmpeg

## O que é
Cena de RPG em 3D onde TUDO que é modelo vem de artista: personagens, esqueletos e peças de masmorra do KayKit (CC0, 76 animações por personagem). O código faz o resto: luz, VFX que sai do osso da mão, hit-stop, número de dano, câmera e HUD com a escolha no final. Funciona porque resolve o problema que o código não resolve bem (personagem bonito e bem animado) e deixa para o código o que ele faz melhor (juice, câmera e ritmo quadro a quadro).

## Exemplo e arquivos
- Prévia do catálogo: `catalogo/previas/61.mp4` (capa em `catalogo/previas/61.jpg`).
- A cena da vitrine: `motores/61/cenas/masmorra_kk.js` + `motores/61/cenas/masmorra_kk.html` (12,5 s; beats em quadros no objeto `B`).
- O menor exemplo (1 personagem + 1 poder): `motores/61/cenas/poder_kk.js`.
- Episódio narrado no mesmo motor ("Só tem gelo", 55 s de imagem): `motores/61/cenas/ep01_kk.js`.
- Kit de juice: `motores/61/kit_juice/juice.js`, regras em `motores/61/kit_juice/dynamics.md`, poderes em `motores/61/kit_juice/PODERES.md`.
- Modelos: `motores/61/personagem/kaykit/` (maga, pastas `skel`, `dungeon` e `forest`); origem e licença de cada coisa em `motores/61/FONTES.md`.
- Demo de um comando: `motores/61/DEMO.md`.

## Ferramentas e instalação
Tudo grátis.
- **KayKit (Kay Lousberg, CC0):** o motor já traz o mínimo (maga, 4 esqueletos, armas, 19 peças de masmorra, rochas e árvores). Os pacotes completos (Adventurers, Skeletons, Dungeon Remastered, Forest) estão no GitHub `KayKit-Game-Assets` e em kaylousberg.itch.io; os endereços estão em `motores/61/FONTES.md`. Existem pacotes pagos do mesmo autor: a receita não precisa deles.
- **three.js r160** vendorizado em `motores/61/vendor/three.module.js`, com os addons usados (GLTFLoader, EffectComposer, UnrealBloomPass) em `motores/61/vendor/jsm/`. Entra por import map no HTML; nada de CDN.
- **Fonte do HUD:** `motores/61/fontes/TitanOne.woff2` (OFL).
- **Node 18+** e `npm install` dentro da pasta do motor (instala só o `puppeteer-core`, que usa o Chrome que você já tem; variável `CHROME_PATH` se ele estiver fora do lugar padrão).
- **FFmpeg** no PATH (ou variável `FFMPEG_PATH`).
- **Placa de vídeo:** opcional. Sem ela, `--cpu` (ou `DEMO_CPU=1`) renderiza por software. Com ela, uma tarefa de GPU por vez: não renderize com jogo ou outra geração rodando.

## Motor
Em `motores/61/` (8,4 MB, dos quais 6,7 MB são modelos e 1,5 MB é o three.js):
- `motores/61/cenas/masmorra_kk.js`: a cena da vitrine. Carga dos GLB com cache, `montar()` (personagem + acessórios), `animar(P, SEQ, qf)` determinístico, sala fechada montada com peças do Dungeon, VFX de gelo, HUD e `window.seek(t)`.
- `motores/61/cenas/poder_kk.js`: 1 personagem + 1 poder (`--q "c=Mage&p=gelo"`; poderes: gelo, fogo, raio, cura).
- `motores/61/cenas/ep01_kk.js`: episódio narrado (tempos em `R{}` em segundos reais; `HOLD` = raio-X que congela a cena).
- `motores/61/cenas/toon/toon.js` (contorno e uniforms `U`) e `motores/61/cenas/toon/esqueleto.js` (pose por IK usada no exemplo de poder).
- `motores/61/kit_juice/juice.js` (11 módulos: hit-stop + clarão, squash, número de dano, barra que mente, smear, linhas de velocidade, câmera com trauma...), `motores/61/kit_juice/tokens.js` (cores, easing `E`, `hash`), `motores/61/kit_juice/poderes.js` (fogo, raio, cura), `motores/61/kit_juice/demo.js` (uma demo de 3 s por módulo: `--pagina kit_juice/demo --q d=hitstop`).
- `motores/61/render.mjs`: servidor local + Chrome + FFmpeg. Opções: `--pagina`, `--video`, `--quadros` + `--out` (folha), `--fps`, `--ini`, `--fim`, `--ss` (superamostragem), `--esc` (escala), `--q` (parâmetros da página), `--cpu`. Já sai em yuv420p de faixa de TV e sem áudio.
- `motores/61/scripts/listar_animacoes.mjs` (clipes de um GLB com a duração) e `motores/61/scripts/aparar_glb.mjs` (deixa só os clipes que você usa).
- `motores/61/package.json` (`npm run demo`, `folha`, `final`, `animacoes`), `motores/61/DEMO.md`, `motores/61/FONTES.md`.

## Passo a passo (ponta a ponta)
Copie `motores/61/` para a pasta do seu projeto e trabalhe dentro da cópia.

1. **Rodar o demo** para ver que a máquina está pronta (3 s, 540×960):
   ```bash
   npm install
   npm run demo
   ```
   Sem placa de vídeo livre: `DEMO_CPU=1 npm run demo`. Sai `saida/demo.mp4`.
2. **Situação de 10–15 s em beats de quadro (60 qps)**, no formato de `kit_juice/dynamics.md`: antecipação, golpe rápido, hit-stop, recompensa em camadas, escolha 1/2 no fim.
3. **Escolher o elenco no KayKit.** O que não veio no motor você baixa do pacote oficial e copia para `personagem/kaykit/`. Liste os clipes do personagem (Idle, Spellcast_Raise, Spellcast_Shoot, Cheer, Hit_A, Blocking...):
   ```bash
   node scripts/listar_animacoes.mjs personagem/kaykit/Mage.glb
   ```
4. **Escala única:** medir a altura nativa do herói e aplicar a mesma escala em tudo (`S = 1.15 / hNat`; herói nativo = 3 unidades, ladrilho = 4).
5. **Montar a sala fechada nos 4 lados** com peças do Dungeon (chão, paredes, pilares, tochas, estandartes). Copie `cenas/masmorra_kk.js` e `cenas/masmorra_kk.html` com outro nome e edite.
6. **Sequência de animação por personagem** como lista `[quadro, clipe]` (ex.: `SEQ_H`), tocada pela função `animar`: zera os pesos de todas as actions, define `time` e `weight` da atual (e da anterior no crossfade de ~10 q) e chama `mixer.update(0)`.
7. **VFX no osso da mão** (`handslot.r`) + luz do poder + juice do kit (hit-stop, clarão, número, tremida).
8. **Câmera** com destino, fov 46 e afastada; fecha para 34 só no clímax.
9. **Folha de quadros** para revisar antes do render longo (na CPU dá para rodar com a placa ocupada):
   ```bash
   node render.mjs --pagina cenas/masmorra_kk --cpu --esc 0.5 --ss 1 --quadros 0.5,2,4,6,8,10,12 --out saida/folha.jpg
   ```
10. **Render final** (1080×1920, 60 qps, superamostragem 2×):
    ```bash
    node render.mjs --pagina cenas/masmorra_kk --video saida/masmorra_1080.mp4 --fps 60 --ss 2
    ```
11. **Versão de celular** (o `render.mjs` já entrega yuv420p; aqui é só reduzir):
    ```bash
    ffmpeg -y -i saida/masmorra_1080.mp4 -vf "scale=720:1280:flags=lanczos" -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p -movflags +faststart -an saida/masmorra_celular.mp4
    ```
12. **Conferir** com a skill `checar-video` (vem no pacote), preset genérico, sem transcrição (a peça é muda).
13. **Para virar episódio narrado:** seguir `cenas/ep01_kk.js` (tempos `R{}` amarrados à voz). Grave ou gere a narração primeiro, em um take, e retemporize a imagem por ela; voz gerada é a única parte paga (ver Custo).

## Pegadinhas medidas
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- **yuvj420p:** o navegador entrega JPEG, que é faixa cheia. Se você só mandar `-pix_fmt yuv420p`, o MP4 pode sair como yuvj420p e não abrir em alguns celulares. O `render.mjs` já aplica `scale=in_range=full:out_range=tv,format=yuv420p`; se montar o seu pipeline, faça o mesmo e nunca use `-c:v copy` para "consertar".
- **Nome de osso:** o GLTFLoader tira o ponto: `handslot.r` chega como `handslotr`. Procurar pelo nome sem ponto.
- **Sala aberta:** quando a câmera vira, aparece vazio preto. Fechar os 4 lados.
- **Luz de mão/impacto:** decay 2 e intensidade ≤ 5, senão estoura no bloom.
- **Câmera perto demais** foi o defeito da primeira versão; a segunda usa fov 46 e planos mais longe.
- **Animação determinística:** nunca deixar o mixer andar com delta de relógio; sempre `time` explícito + `mixer.update(0)`. Clipes de uma vez só (Spellcast_Raise, Cheer, Hit, Death) não entram em loop.
- **Peso dos GLB:** um personagem do KayKit tem 3,6 a 4,9 MB, e mais da metade é animação que a cena não usa. Aparado para 13–18 clipes fica perto de 1 MB (`scripts/aparar_glb.mjs`). Se a cena pedir um clipe que foi cortado, o erro é `Cannot read properties of undefined` no `ACT[nome]`.
- **Tempo de render com placa de vídeo, ss=2, 60 qps:** ~3,2 s por segundo de vídeo (12,5 s ≈ 40 s). Episódio de 55 s: 2,8 s/s.
- **Tempo de render na CPU (SwiftShader), 540×960, 30 qps, ss=1:** ~13 s por segundo de vídeo (o demo de 3 s leva ~45 s com a carga).
- **Tempo de produção:** poder novo com o kit pronto ~6–7 min; a masmorra saiu numa noite (teste → v2).
- **Revisão a 8 qps** do episódio pegou: abertura parada, tiro sem alvo em quadro, clarão branco estourando, 8 s de gelo parado, final estático.

## Custo e tempo
- Grátis (modelos CC0, three MIT). Sem geração de IA.
- Placa de vídeo por menos de 1 min na cena de 12 s; prévia e folha rodam em CPU.
- Episódio narrado: a narração do exemplo de 55 s tem ~600 caracteres. Gerando na ElevenLabs (site ou API, com a sua chave), conte ~1.300 caracteres/créditos para tirar 2 takes e escolher. Gravar a própria voz é grátis.

## O que funcionou e o que não funcionou
- **Personagem de artista, não inventado em código.** Antes do KayKit foram testados três estilos de boneco feitos direto em código (chibi, low-poly, cel anos 90), um boneco 3D copiado de ficha e uma marionete 2D: todos ficaram estranhos ou abaixo do nível de uma série ilustrada. O salto veio de assumir "tudo KayKit" e gastar o código só em luz, VFX, câmera e HUD.
- **Câmera afastada.** A v1 agradou em personagem e movimento de câmera, mas estava perto demais; fov 46 e planos mais longe resolveram na v2.
- **O poder é a fonte de luz.** Golpe com bom impacto e luz geral chapada dá "impacto bom, imagem feia". O que subiu o nível: a luz geral cai na carga, o poder ilumina a cena e o VFX é 3D de verdade.
- **Impact frame de anime, não de quadrinho.** Estrela pontuda com raios fica aguda e infantil; silhueta chapada, pincel, respingo e uma cor funcionam.
- **Formato que rende:** historinha isekai/RPG com escolha 1/2 no fim para os comentários, não "dica de game dev".
- **No episódio narrado:** sem sussurro na narração, magia que começa fraca e cresce, câmera aberta, música e voz épicas. A primeira versão narrada foi criticada justamente em voz e lógica da história.
- **Nossa nota:** a cena de 12,5 s foi aprovada como "bem legal" na v2; como peça ela é curta e muda, vale como prova de técnica mais do que como episódio.

## Roteiro de aula
- **Objetivo:** o aluno sai sabendo montar uma cena de combate 3D só com assets CC0, tocar animações de GLB de forma determinística e pôr VFX e juice por código.
- **Demonstração (~25 min):**
  1. Rodar o demo; onde baixar e o que vem no pack: 5 personagens, 76 animações, peças de masmorra (3 min).
  2. Carregar 1 personagem, listar os clipes e tocar 3 com `animar` (5 min).
  3. Escala única e a sala fechada (4 min).
  4. Achar o osso da mão e prender um VFX (4 min).
  5. Um golpe com as regras do `motores/61/kit_juice/dynamics.md`: antecipação, hit-stop, clarão, número (6 min).
  6. Folha na CPU, render final, por que o arquivo precisa ser yuv420p de faixa de TV (3 min).
- **Exercício:** cena de 6 s: 1 herói do KayKit lança 1 poder em 1 esqueleto dentro de uma sala fechada. Deu certo se rodar 2 vezes e os quadros forem idênticos (determinístico), se a luz não estourar e se o ffprobe do arquivo final der yuv420p.
- **Pré-requisitos:** básico de three.js (estilo 34) e a aula de juice/poderes (estilo 62).

## Limites conhecidos
- O motor traz só a maga e os esqueletos, com 13–18 clipes cada. Outros heróis (Knight, Barbarian, Rogue) e os 76 clipes completos o aluno baixa dos pacotes oficiais (endereços em `motores/61/FONTES.md`).
- O nome "Prova de combate" é da vitrine; os arquivos chamam `masmorra_kk`.
- A peça é muda e curta (12,5 s). O episódio narrado (`cenas/ep01_kk.js`) vem só com a imagem: voz, música, efeitos sonoros e a mixagem não estão no motor.
- Boneco `.vrm` na página de poder é opcional e pede a biblioteca three-vrm, que não está incluída.
- As páginas são fixas em 1080×1920 (vertical); outra proporção pede mexer em `W`, `H` e no HUD.
- O demo foi testado em Windows com Chrome, na CPU. Em Mac e Linux o `render.mjs` procura o Chrome nos caminhos padrão, mas não foi testado lá.
- Sem QA automático guardado da peça da vitrine; a conferência é a folha de quadros + `checar-video`.
