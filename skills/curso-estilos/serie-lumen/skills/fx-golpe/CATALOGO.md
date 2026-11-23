# Catálogo de efeitos Effekseer

343 efeitos renderizados, cada um sozinho no fundo preto, 1080×1920, 30 qps, centro do efeito = centro do quadro.
Licenças, autores e dúvidas: `LICENCAS.md`. Nada de crédito na tela é obrigatório.

## Como achar um efeito
- `catalogo.png`: mosaico dos nº **1–98** (os exemplos que vêm com o Effekseer). Mostra o quadro mais claro de cada efeito.
- `catalogo_extras.png`: mosaico dos nº **101–345** (packs extras do site oficial e do demo Godot 4).
- `catalogo.json` e `catalogo_extras.json`: número → nome da pasta, nº de quadros, duração e quadro de pico.
  - `"vazio": true` = o efeito saiu preto no render. Não use.
- Pasta de cada efeito: `quadros/<pack>__<nome>/fNNNN.jpg`. Os extras têm o prefixo `X_` (ex.: `X_tktk01__Blow1`).

Para usar um número, olhe o nome no `.json` e passe no `fx` (o pedaço final basta, se não for ambíguo).
Ex.: nº 96 → `02_Tktk03__ToonHit` → `"fx": "ToonHit"`.

## Na amostra (3 efeitos)
| Nº | Pasta | Duração | O que é |
|---|---|---|---|
| 96 | `02_Tktk03__ToonHit` | 2,0 s | hit em estilo toon. O da receita padrão (a que funcionou na série LUMEN) |
| 45 | `01_AndrewFM01__hit_eff` | 0,9 s | impacto curto e seco |
| 234 | `X_tktk01__Blow1` | 0,8 s | soco/impacto de anime |

Os outros 340 vêm no pacote completo (ver `BAIXAR_EFEITOS.md`).

## Faixas de número
| Nº | Pack | Autor | Licença |
|---|---|---|---|
| 1–33 | `00_Basic`, `00_MaterialBasic`, `00_Version16` | Effekseer | CC-0 |
| 34–48 | `01_AndrewFM01` | AndrewFM | CC-0 |
| 49–68 | `01_NextSoft01` | NextSoft | CC-0 |
| 69–91 | `01_Pierre01`, `01_Pierre02` | Pierre | CC-0 |
| 92–94 | `01_Suzuki01` | Suzuki | CC-0 |
| 95–97 | `02_Tktk03` (Light, ToonHit, ToonWater) | tktk | CC-0 |
| 98 | `03_Hanmado01` | hanmado | CC-0 |
| 101–115 | `X_Effekseer01` | Effekseer | CC-0 |
| 116–134 | `X_Godot4Demo` | Effekseer | MIT |
| 135–138 | `X_HATO01` | HATO | CC-0 |
| 139–231 | `X_MAGICALxSPIRAL` | BrokenDesk | CC-0 |
| 232–302 | `X_tktk01` | tktk | CC-0 |
| 303–345 | `X_tktk02` | tktk | CC-0 |

## Exemplo: o que serviu na série LUMEN (golpe, crítico, magia)
- **Impacto**: 96 ToonHit (o da receita padrão), 45 hit_eff, 34–37 actionLines (linhas de anime), 38 shockwave (anel), 98 hanmado.
- **Corte/espada**: 67–68 Sword1/2, 87–90 Sword_Ember/Lightning/Moonlight/Sacredlight, 94 sword.
- **Magia**: 51 MagicCold (gelo), 61 MagicThunder, 53/54 MagicFire, 63 MagicWater, 75 MissileBoost, 80 Benediction, 81 BloodLance.
- **Cura/buff**: 49/50 HealPotion, 55/56 MagicHeal, 64 PowerUp, 95 Light.
- **Fundo/atmosfera**: 11 bokeh, 16 partículas, 93 snowstorm, 70 Background.
- **Não servem** (didáticos de material/forma): 5–9, 17–24, 33.

### Extras
- **Melhores pra combate de anime**:
  - tktk01 (232–302): Blow (socos e impactos), Sword (cortes), Fire, Light.
  - tktk02 (303–345): Claw, Gun, Spear, Sword.
  - Godot4Demo ef_parts_hit01/02 (130–131).
- **Magia**: MAGICALxSPIRAL (139–231), com círculos mágicos, elementais, gelo e raio. Vários são pequenos: aumente o `escala`.

## Limites
- Efeito com mistura normal (fumaça escura, poeira: os `foot_smoke`) fica fraco.
  O fundo é preto e a composição é `screen`, então só vale para luz.
- Ficaram fora do pacote (não renderizaram): 8 do MAGICALxSPIRAL (Salamander 2/3/4/11, A_Salamander2, A_Undine2, Undine1, Gohlem11, Gohlem_Shield2) e os 12 GpuParticles do demo Godot 4.

## Aplicar
Ver `SKILL.md`. Resumo:
```bash
python ${CLAUDE_SKILL_DIR}/scripts/aplicar_fx.py IN.mp4 CENA.mp4 --linha golpes.json --corte INI FIM
```
Padrão do motor = a receita que funcionou na série LUMEN: `escala 0.75`, `forca 0.55`, `cor gelo`, `modo screen`.
- `cor`: `gelo`, `ouro`, `original` ou um par `"H,S"` (H = giro de matiz em graus; S = multiplica a saturação, ex. `"165,0.55"` é o gelo).
- `modo add`: estoura mais. Só em fundo escuro.
- `antes`: quantos quadros de preparação do efeito aparecem antes do estouro.
