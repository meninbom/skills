# Fontes dos arquivos de terceiros

Tudo aqui pode ser redistribuído e usado em projeto comercial.

| O quê | Onde está | Origem | Licença |
|---|---|---|---|
| Maga (`Mage.glb`) | `personagem/kaykit/` | KayKit Adventurers Character Pack 1.0, de Kay Lousberg · github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0 · kaylousberg.itch.io/kaykit-adventurers | CC0 1.0 |
| 4 esqueletos + 4 armas + textura | `personagem/kaykit/skel/` | KayKit Skeletons Character Pack 1.0 · github.com/KayKit-Game-Assets/KayKit-Character-Pack-Skeletons-1.0 · kaylousberg.itch.io/kaykit-skeletons | CC0 1.0 |
| 19 peças de masmorra | `personagem/kaykit/dungeon/` | KayKit Dungeon Remastered 1.0 · github.com/KayKit-Game-Assets/KayKit-Dungeon-Remastered-1.0 · kaylousberg.itch.io/kaykit-dungeon-remastered | CC0 1.0 |
| 6 rochas + 3 árvores + textura | `personagem/kaykit/forest/` | KayKit Forest Nature Pack 1.0 (versão grátis) · kaylousberg.itch.io/kaykit-forest | CC0 1.0 |
| three.js r160 + addons | `vendor/` | github.com/mrdoob/three.js (tag r160) | MIT |
| Titan One (`TitanOne.woff2`) | `fontes/` | Rodrigo Fuenzalida, via Google Fonts · fonts.google.com/specimen/Titan+One | SIL Open Font License 1.1 (texto em openfontlicense.org) |

O arquivo de licença original de cada pacote KayKit está na pasta dele (`LICENSE.txt`). Crédito ao Kay Lousberg não é obrigatório, mas é de bom tom.

## O que foi alterado

- **Personagens aparados.** Cada GLB do KayKit vem com 76 a 95 clipes de animação (3,6 a 4,9 MB). Aqui a maga ficou com 18 clipes e cada esqueleto com 13 (~1 MB cada), que é o que as cenas usam e mais alguns para o exercício. A malha, o esqueleto e a textura não mudaram. O corte foi feito com `scripts/aparar_glb.mjs`.
  - Maga: Idle, Walking_A, Running_A, Walking_Backwards, Spellcast_Raise, Spellcasting, Spellcast_Shoot, Spellcast_Long, Cheer, Block, Blocking, Hit_A, Hit_B, Death_A, Jump_Full_Short, Lie_Idle, Lie_StandUp, Interact.
  - Esqueletos: Skeletons_Inactive_Floor_Pose, Skeletons_Awaken_Floor, Skeletons_Awaken_Floor_Long, Idle, Idle_Combat, Walking_D_Skeletons, Death_C_Skeletons, Spellcast_Summon, Spellcast_Shoot, Hit_A, Hit_B, 1H_Melee_Attack_Chop, Taunt.
- **Só as peças usadas.** Dos pacotes de masmorra e floresta vieram só os arquivos que as cenas carregam.

Para ter os 76 clipes, os outros 4 aventureiros (Knight, Barbarian, Rogue, Rogue_Hooded) e as centenas de peças de cenário, baixe os pacotes completos nos endereços acima e copie os GLB para `personagem/kaykit/` (mesmos nomes de arquivo).

## O que não está incluído

- **three-vrm** (para boneco `.vrm` na página `cenas/poder_kk`): opcional; baixe `three-vrm.module.js` do projeto pixiv/three-vrm (MIT) para `vendor/jsm/`. Bonecos VRM de terceiros têm licença própria: confira antes de usar.
- **Voz, música e efeitos sonoros:** as cenas são mudas. O som é seu.
