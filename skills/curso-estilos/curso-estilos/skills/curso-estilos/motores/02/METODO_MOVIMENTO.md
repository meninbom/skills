# Método: boneco gerado por IA + movimento real (three.js)

Escrito depois de três versões em que o boneco saiu duro, curvado ou com cara de bonecão. Vale para qualquer boneco humanoide novo.

## O que deixava duro (em ordem de peso)

1. **Movimento errado para o corpo.** Zé tem perna de 36 cm e cabeça enorme. Um andar humano neutro, escalado, some nele: o passo fica do tamanho da bota. Cura: escolher o ESTILO de captura que combina com o personagem (a 100STYLE tem 100: Heavyset, Rushed, Proud, Old, Zombie, Akimbo, OnPhone...) e ampliar o ângulo das juntas (`exag` 1,15 a 1,3).
2. **Rig pobre.** 18 ossos com tronco em 2 blocos, sem clavícula, pesos por faixa de altura. Tronco e ombro não mexiam. Cura: 22 juntas com os nomes do SMPL e pele calculada no Blender.
3. **Retarget só pela direção do osso.** Perdia a torção (antebraço, coxa, pé) e o pé não ficava preso no chão. Cura: rotação completa relativa ao neutro + IK de pé.
4. **Postura da fonte herdada.** O esqueleto de captura "parado" não tem rotação zero (100STYLE: pescoço e cabeça ~20° para a frente). Cura: sempre subtrair o neutro da MESMA fonte.
5. **Tempo errado.** Movimento esticado junto com a fala (câmera lenta) e clipe curto congelando no fim do plano. Cura: tocar em tempo real (`C.rt(a)`) e usar clipes mais longos que o plano.

## Passo a passo para um boneco novo

1. Arte de frente, corpo inteiro, braço solto do tronco. Gerar a malha com textura num modelo de imagem → 3D (nós usamos o Pixal3D no ComfyUI; qualquer gerador que entregue GLB com textura serve) e salvar em `malha/x_p3d.glb`.
2. Achar o giro que deixa de frente: `python malha/mede.py malha/x_p3d.glb <altura> auto`.
3. Escrever `malha/x_juntas.json`: `arq`, `ry`, `alt` e as juntas do centro e do lado esquerdo (Pelvis, Spine1-3, Neck, Head, Head_fim, L_Hip, L_Knee, L_Ankle, L_Foot, L_Foot_fim, L_Collar, L_Shoulder, L_Elbow, L_Wrist, L_Wrist_fim), em metros, y para cima, frente +z. A junta fica no PIVÔ, dentro do volume. Medir com `mede.py` (fatias por altura).
4. `blender -b -P malha/rig_blender.py -- malha/x_juntas.json` (25 s). Sai `x_p3d_rig.glb` (malha + pele) e `x_p3d_rig.json`. O peso por calor pode falhar em malha de IA; o script cai sozinho no peso por envelope.
5. No código: `gente4.js` → `prepara('x')`, `criaGente()`, `poseMov(M, t, { exag, local, head, dy })`.
6. Conferir no estúdio de frente e de lado: `estudio.html?pbr=1&o=ze&m=gente4&anda=mov&mov=mov2/arquivo.json&exag=1.25&vistas=0.5,1.57&d=5.5`.

## Fontes de movimento

- **100STYLE (captura real, 60 fps):** locomoção e jeitos de corpo. `python malha/pega_100s.py Estilo TIPO [segundos]` (a pasta do conjunto vem da variável `STYLE100_DIR`) (FW andar, FR correr, ID parado, BW/BR costas, SW/SR lado, TR1 transições). A gravação anda em círculos; o `--reto` endireita pelo rumo da bacia. Licença CC BY 4.0: crédito no FONTES.md e na legenda.
- **HY-Motion (texto → movimento, 30 fps, até 12 s):** ações específicas. gerar os `.npz` no HY-Motion (ComfyUI) com os prompts de `mov/jobs.json`, salvar em `mov/npz`, escolher em `malha/palitos.py`, converter com `malha/npz2mov.py`. Gerar 3 variações; o começo costuma ficar 1–2 s parado. Bom para corpo inteiro; em close esconde o rosto.
- Todo arquivo novo vai em `mov2/` com sufixo `_100s` ou `_hy`: o sufixo escolhe a referência neutra (`mov2/neutro_100s.json`, `mov2/neutro_hy.json`).

## Como o retarget funciona (gente4.js)

- Rotação da junta = rotação da fonte agora × inverso da rotação da fonte parada (neutro). O repouso do boneco já é "parado", então ele só recebe a diferença.
- Posições saem das medidas do boneco (a proporção dele não muda). A bacia sobe e desce o quanto a fonte subiu ou desceu em relação ao neutro, escalado pela perna.
- Pé: alvo = tornozelo da fonte em relação à bacia dela, escalado, mais a diferença de largura de quadril. IK de dois ossos com o joelho apontando para onde a fonte aponta. Perto do chão a sola fica plana. Se a perna não alcança, a bacia desce.
- `exag`: multiplica o ângulo de cada junta em relação ao neutro (cabeça e pescoço só 30% disso).

## Ainda falta

- Pose dirigida à mão (`pose()`) no gente4, para closes e para segurar objeto com a mão no lugar exato.
- Rosto: é textura, não pisca nem abre a boca.
- Emblema "Zé" do boné no gente4.
- Dedos: vêm fechados da arte.
- Bichos: quadrúpede precisa de esqueleto e fonte de movimento próprios.

## Atualização (Zé v3, depois de um boneco que desabava ao agachar)

- **A proporção do boneco tem que ser a da fonte de movimento.** Zé v2 (jaqueta inflada, quadril a 40% da altura) quebrava tudo que tem contato: agachar desabava, mão na cintura ficava no ar. Zé v3 (magro, quadril a 47%, camisa justa, braço bem afastado na arte) toca os mesmos arquivos sem desabar. Pedir na arte: "realistic adult human proportions eight heads tall, long legs, slim waist, fitted clothes, arms well away from the body". Roupa inflada e jaqueta = não.
- **Mão por contato (gente4, passo 4):** perto do corpo, a mão vai para onde a fonte encostou em relação a bacia/peito/cabeça/quadris, com IK de braço. Só nos arquivos `_hy` (ação); locomoção `_100s` segue a fonte (`M.mao`). Desliga com `semMao`.
- O `gerador_0_hy` começa de quatro no chão: cortar o primeiro 1,2 s.
- Conferir SEMPRE em quadro grande (`--tw 420`), não em folha miúda: a folha miúda escondeu o agachar quebrado do v2.
- **Prova de boneco se faz DENTRO do filme, não no estúdio cinza.** No estúdio ele anda no lugar (pé "escorrega" por construção) e a luz chapada deixa o modelo com cara de plástico. `index.html?pbr=1&z4=1&p=ze3` liga o gente4 no filme com os movimentos de `mov2/sel4.json`.
- **As corridas (FR) da 100STYLE são trotes de 1,4–1,7 m/s** (estúdio pequeno). Para fuga: estilo `Angry` ou `Roadrunner` tocado a 1,3×.
- **Pose "em dois" venceu:** no lado a lado contínuo × em dois, o em dois lê melhor. Com `z4` o boneco já toca a 12 poses/s (`em2` no `poseMov`; deslocamento no chão segue contínuo; câmera, luz, FX e HUD em um). `&liso=1` volta ao contínuo. Origem: o método de animar "em dois", como no anime.

## Timing de anime no boneco

Parâmetro do filme: `?anim=liso | em2 | gram` (com `z4` o padrão é `gram`).
- `em2`: pose a 12 desenhos/s; deslocamento no chão, câmera, luz e HUD contínuos.
- `gram` = em dois + gramática (`gramatica(M)` no gente4.js, tabela por clipe):
  - PAUSA: junta mais rápida abaixo de 0,12 m/s = assentou; segura a pose 6 a 12 desenhos.
  - ANTECIPAÇÃO: 2 desenhos (4 quadros) indo 10% e 22% para o lado contrário antes de sair de uma pausa, só se o que vem depois for grande.
  - ESTICADA: 1 desenho no pico (> 1,6 m/s) com o cotovelo puxado para a pose anterior e a mão 1,3×; só em clipe de ação, nunca na locomoção.
- Medido (`poses/s` e % em pausa por clipe): corrida, gerador, porteira e zumbi andando ficam em 12 poses/s e 0–3% de pausa, ou seja, `gram` ≈ `em2` nos planos rápidos. A diferença aparece nos clipes quase parados do HY-Motion (celular, parado, escreve, preocupa: 80–90% em pausa, 1–2 poses/s), que em `em2` tremem de leve a 12/s e em `gram` seguram.
- Achado: vários clipes de ação do HY-Motion quase não se mexem (celular: junta mais rápida a 0,13 m/s no pico). Parte do "duro" é isso; pedir ação mais larga no prompt.
- Planos que eram pose à mão e viraram movimento com `z4`: celular (clipe `celular`), banheira (`banheira` em vaivém), final na varanda (`parado` + giro de cabeça; o `susto` esconde o rosto).
