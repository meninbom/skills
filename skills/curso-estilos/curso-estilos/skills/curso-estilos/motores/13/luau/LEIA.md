# Módulos Luau do EP01 (onde cada um vai no Studio)

São os ModuleScripts do lugar do EP01 "Nessa cidade, cai um bicho do céu", extraídos como texto com `rbxl/extrair_luau.py`. O lugar (.rbxl) não vem no pacote: você monta a sua cidade e usa estes módulos como base.

Como instalar: no Explorer do Studio, em **ServerStorage**, crie um **ModuleScript** com o mesmo nome do arquivo (sem `.luau`) e cole o conteúdo. Pelo MCP, peça para a IA criar cada ModuleScript com `execute_luau` lendo o arquivo desta pasta. Chame sempre com `require(game.ServerStorage.Nome:Clone())`, porque o `require` guarda cache e não vê a sua última edição.

| Arquivo | Vai em | O que faz | Serve direto? |
|---|---|---|---|
| `Arredonda.luau` | ServerStorage.Arredonda | Troca Part quadrada por malha de cantos arredondados (EditableMesh). `trocar(part, raio, pastaLixo)`, `refazer(raiz)` | Sim, é genérico |
| `ArredondaCorpo.luau` | ServerStorage.ArredondaCorpo | O mesmo para o corpo do boneco R6 (cabeça, tronco, membros). `boneco(modelo, ...)`, `refazer(raiz)` | Sim, para R6 |
| `DiaLib.luau` | ServerStorage.DiaLib | Atalhos de construção: `P` (peça já arredondada), `texto` (SurfaceGui), `olhos` (imagem na face) | Sim. Espera a pasta `ServerStorage.LibDia._descartes.pecas_quadradas` (para onde vão as peças originais) |
| `DiaAnim.luau` | ServerStorage.DiaAnim | Animação por código, sem Animator: `setup(raizes)`, `step(t)`, `reset()`. Balanço de humano R6 e de bicho | Sim, com ajuste dos nomes |
| `DiaVFX4.luau` | ServerStorage.DiaVFX4 | Emissores do efeito em 4 camadas: `fogo(attachment, escala)`, `estouro(attachment, escala)` | Sim, depois de trocar os ids das texturas |
| `DiaGrav.luau` | ServerStorage.DiaGrav | A gravação plano a plano: tabela `PLANOS`, `prep(i)`, `run(i)`, câmera deitada (`ROLL` de 90°, `FOV` 36), câmera lenta (`SLOW` = 3), troca de luz e de céu | É o exemplo do EP01: os planos, nomes de personagem e posições são daquele lugar. Use como modelo e reescreva a tabela `PLANOS` |

## O que você precisa trocar
- **Ids de imagem:** todo `rbxassetid://0` é marcador. Gere as imagens (`vfx4/desenhar.py`, seus olhos e rostos), envie com `upload_image` e cole os ids.
- **Nomes do lugar que o `DiaGrav` espera:** `workspace.Personagens` (bonecos e bichos), `workspace.Cidade` (com peças chamadas `Vidro` e `Lampada` para as janelas acenderem), `ServerStorage.LuzDia` (um objeto cujos atributos `Lighting_...`, `Atmosphere_...`, `ColorCorrection_...`, `Bloom_...` guardam a luz de dia), e os objetos `Atmosphere`, `ColorCorrection` e `Bloom` dentro de `Lighting`.
- **Ao reabrir o lugar:** as malhas arredondadas não são salvas no arquivo. Rode
  ```
  require(game.ServerStorage.Arredonda:Clone()).refazer(workspace)
  require(game.ServerStorage.ArredondaCorpo:Clone()).refazer(workspace)
  ```

## Gravar um plano
```
local G = require(game.ServerStorage.DiaGrav:Clone())
G.prep(1)      -- monta luz, céu, poses e câmera do plano 1 (espere terminar)
-- dispare a captura da tela (gravacao/grava2.sh) e então:
G.run(1)       -- 0,6 s parado + movimento de câmera + 0,6 s parado, tudo 3x mais lento
```
