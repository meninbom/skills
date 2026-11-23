# Licenças dos efeitos

Os efeitos são do Effekseer (ferramenta livre de partículas) e de quem contribuiu com packs pra ela.
Aqui vão só os quadros já renderizados (JPG no fundo preto). Nenhum arquivo do editor vai junto.
Os textos de licença estão em `licencas/`.

## CC-0 (domínio público, uso comercial livre)
| Pack | Nº no catálogo | Autor | Arquivo em `licencas/` |
|---|---|---|---|
| Exemplos que vêm com o Effekseer (`00_*`, `01_*`, `02_Tktk03`, `03_Hanmado01`) | 1–98 | Effekseer, AndrewFM, NextSoft, Pierre, Suzuki, tktk, hanmado | `samples_effekseer_CC0_readme.txt` |
| `Effekseer01` | 101–115 | Effekseer | `Effekseer01_CC0_fonte.txt` |
| `HATO01` | 135–138 | HATO | `HATO01_CC0_fonte.txt` |
| `MAGICALxSPIRAL` | 139–231 | BrokenDesk | `MAGICALxSPIRAL_CC0_fonte.txt` |
| `tktk01` | 232–302 | tktk | `tktk01_CC0_fonte.txt` |
| `tktk02` | 303–345 | tktk | `tktk02_CC0_fonte.txt` |

- Fonte dos packs extras: https://effekseer.github.io/en/contribute.html
- Os zips do site não trazem arquivo de licença. Os `*_CC0_fonte.txt` guardam a fonte e o texto da página oficial.
- O texto oficial **pede** crédito ("Effekseer + autor") em algum lugar da obra, mas não obriga.
  Se quiser creditar, ponha na legenda do post ou na descrição, não na tela.

## MIT
| Pack | Nº no catálogo | Autor | Arquivo |
|---|---|---|---|
| Demo do EffekseerForGodot4 (`X_Godot4Demo`) | 116–134 | Effekseer | `licencas/Godot4Demo_MIT.txt` |

- Fonte: https://github.com/effekseer/EffekseerForGodot4 (pasta `Demo/effects/`).
- A MIT pede que o aviso de copyright e a licença acompanhem cópias do material.
  Por isso o `Godot4Demo_MIT.txt` vai junto no plugin e no pacote completo. No vídeo final, nada de crédito obrigatório na tela.
- Os modelos 3D da demo (`shared/models/`, CC-BY) **não** foram usados.

## Dúvida registrada: o ToonHit
Existem **dois** ToonHit no catálogo:
- **nº 96 `02_Tktk03__ToonHit`**: veio da pasta de exemplos do Effekseer, cujo readme diz que todos os efeitos são CC-0. É o da amostra e o que o motor escolhe quando você pede `"fx": "ToonHit"`.
- **nº 117 `X_Godot4Demo__ToonHit`**: um efeito de mesmo nome e mesma duração (59 quadros), vindo do repositório da demo Godot 4, que é MIT. Parece o mesmo efeito redistribuído, mas os arquivos de origem não foram comparados.

Por isso o nome ToonHit aparece ora como "licença MIT", ora como CC-0.
Não foi conferido se o autor (tktk) publicou o ToonHit também em outro lugar com outra licença.
**Leitura mais provável:** o nº 96 é CC-0 (vem da pasta de exemplos). Se quiser ficar 100% seguro, trate o ToonHit como MIT: guarde o `Godot4Demo_MIT.txt` junto do projeto. Isso não muda nada no vídeo.

## O que ficou de fora (e por quê)
- Packs com licença antiga ou ambígua (ProjectDanmakuGirls, NitoriBox, TouhouStrategy) e o "Effekseer Animation Pack - RPG Maker MZ" ("CC0-A", fora do padrão).
- Packs pagos da Booth e da itch.io.
- Os sons. Nenhum SFX vai no plugin (ver o `SKILL.md`, seção Som).
