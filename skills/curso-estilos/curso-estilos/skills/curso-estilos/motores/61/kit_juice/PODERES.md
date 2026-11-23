# Biblioteca de poderes (kit_juice/poderes.js + cenas/poder_kk.js)

**Para que serve:** um conjunto de poderes prontos para qualquer cena em código. Todo poder segue a mesma anatomia, medida quadro a quadro em vídeos de game feel (estilo inspirado em contas de game feel) e escrita em quadros a 60 qps:

| Fase | Quadros (padrão) | O que acontece |
|---|---|---|
| Carga | 60–150 | Cena escurece (o poder vira a fonte de luz). Partículas convergem. Luz na mão. Antecipação: puxa e estende. Tremor de esforço. Gorro voa para trás. |
| Disparo | 150 (anel 14 q) | Anel abre virado para a câmera. Flash de tela de 1 q. Tranco do corpo para trás. |
| Viagem | 150–180 | Gelo: onda de cristais no chão. Fogo: bola em arco com rastro. Raio: avisos piscando no céu. Cura: espiral subindo + coluna. |
| Impacto | 180 | Hit-stop de 6 q. Clarão branco de 5 q no alvo. Luz forte no ponto. Número de dano + selo de status. Tremida. |
| Resíduo | 180–300+ | Gelo: estilhaço + geada + neve. Fogo: fumaça + brasas + chão queimado. Raio: faíscas + arcos. Cura: brilhos lentos. |

## Como usar
- **Ver um poder:** a página `cenas/poder_kk.html` com `?p=gelo`, `fogo`, `raio` ou `cura`.
- **Render:** `node render.mjs --pagina cenas/poder_kk --q p=fogo --video saida/fogo.mp4`, ou `--cpu --quadros 1,2.5,3,4 --out saida/folha.jpg` para a folha de quadros.
- **Criar um poder novo:** em `poderes.js`, escrever `nome(scene)`, que devolve `{ cor, atualizar(qf, ctx3), desenhar(ctx2d, qf, ctx3), flash? }`.
  - `cor`: cores de partícula, luz da mão, luz do impacto e anel; tipo do número; selo; dano; e as opções `maoAcima`, `alvoEhHeroi` e `escurece`.
  - `ctx3 = { B, mao, alvo, heroi, proj }`.
- **Regras:**
  - Tudo é função do quadro, com `hash` em vez de `Math.random`.
  - VFX é 3D: InstancedMesh + material aditivo ou "chama".
  - Brilho de tela é 2D, por cima.
  - O bloom fica baixo, para a forma continuar legível.

## Lições (o que tirou a cara de amador)
1. **O poder ilumina a cena:** a luz geral cai na carga.
2. **Gelo:** núcleo azul profundo; só a faceta que pega luz e a borda acendem. Contorno escuro, para casar com o toon.
3. **Luz pontual não pode encostar no rosto:** estoura a pele. A da mão fica em ~0,5.
4. **Exposição:** cuidado com bloom + flash + luz somados (a primeira versão estourou tudo de branco).
5. **Material custom em InstancedMesh** precisa aplicar o `instanceMatrix` no vertex shader. Sem isso, todas as cópias param na origem.
