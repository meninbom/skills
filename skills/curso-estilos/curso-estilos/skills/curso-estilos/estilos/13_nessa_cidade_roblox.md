# 13 · "Nessa cidade…" no Roblox

> Vitrine: "Nessa cidade, cai um bicho do céu" EP01 (92 s) · Custo: só a voz (~1.130 caracteres de narração por tomada na ElevenLabs); cena, bichos, céu, efeitos e gravação R$ 0 · Ferramentas: Roblox Studio + MCP oficial, um gerador de imagem (céu), Python/Pillow, ElevenLabs, FFmpeg · **Status: beta** (a gravação depende do Studio aberto; o demo cobre só montagem e edição)

## O que é
Historinha de 75–105 s narrada por uma criança em 1ª pessoa, toda encenada dentro do Roblox Studio. Estilo inspirado na fórmula "In this town…" das contas de história em Roblox: regra da cidade → como funciona → vizinhos com nome → "comigo foi diferente" → pistas → virada e frase-eco, aqui terminando em voto "1 ou 2". A cena é construída e animada por script via MCP, gravada da tela plano a plano e montada sobre a voz com legenda de uma palavra e HUD de jogo. Funciona porque o público reconhece o Roblox de verdade: a imitação em three.js, mesmo depois de sete versões, não parecia Roblox.

## Exemplo e arquivos
- Prévia do estilo: `catalogo/previas/13.mp4` (capa em `catalogo/previas/13.jpg`).
- Roteiro do exemplo: `motores/13/ROTEIRO_EP01.md`; texto da narração em `motores/13/voz/narracao.txt`.
- Estudo da fórmula: `motores/13/ESTILO_in_this_town.md`.
- Código da cena (Luau): `motores/13/luau/` com `LEIA.md` dizendo onde cada módulo vai no Studio.
- Exemplo de configuração de edição (os 20 planos do EP01): `motores/13/gravacao/ep01.json` e `motores/13/gravacao/planos_ep01.json`; tempos das palavras da voz do exemplo em `motores/13/voz/exemplo_ep01.words.json`.
- O lugar (.rbxl), as texturas e os áudios do episódio não vêm no pacote: você monta a sua cidade.

## Ferramentas e instalação
- **Roblox Studio (grátis).** Subir imagem para o Roblox também é grátis.
- **MCP oficial do Studio (grátis):** no Studio, Assistant → ⋯ → Manage MCP Servers → Enable Studio as MCP server. No Claude Code, registre o servidor (escopo user) apontando para o `mcp.bat` que o Studio instala em `%LOCALAPPDATA%\Roblox`. **Pegadinha:** no Git Bash o `/c` do comando vira `C:/` e o servidor dá timeout; rode o `claude mcp add` com `MSYS_NO_PATHCONV=1`.
- **Ferramentas do MCP usadas:** execute_luau, upload_image, screen_capture, generate_mesh (IA do Studio, grátis, 1–2 min por bicho), wait_job_finished, save_place.
- **Gerador de imagem (só para o céu pintado):** qualquer um que faça 1024×1024. Nós usamos Z-Image no ComfyUI local (grátis, pede GPU).

**Neste setup:** gere as cinco faces do céu com a skill `codex-image` (`../CODEX_IMAGE.md`), `--aspect 1:1`, sem ComfyUI: `python3 ~/.agents/skills/codex-image/scripts/codex_image.py "<brief>" -o assets/ceu/Ft.png --aspect 1:1 --crop`. Salve em `assets/ceu/`, copie para `ceu/dia/` com os nomes da receita (`Ft.png`, `Rt.png`, `Bk.png`, `Lf.png`, `Up.png`) e rode `gerar_ceu.py`. Depois continue no Studio.
- **Python 3.10+** com `pip install -r requirements.txt` (Pillow, numpy, zstandard) e **FFmpeg 7+** com gdigrab (gravação da tela, Windows).
- **ElevenLabs (PAGO):** a API da ElevenLabs com a sua chave, na variável de ambiente `ELEVENLABS_API_KEY`.

## Motor (dentro do plugin)
Em `motores/13/` (~140 KB):
- `demo.py` + `DEMO.md`: mini-demo da montagem e edição, sem o Studio.
- `luau/`: os 6 módulos do EP01 (`Arredonda`, `ArredondaCorpo`, `DiaLib`, `DiaAnim`, `DiaVFX4`, `DiaGrav`) + `LEIA.md`.
- `rbxl/extrair_luau.py`: tira o código dos scripts de um .rbxl como texto, sem abrir o Studio.
- `gravacao/grava2.sh`: grava o viewport com a câmera deitada (1336×752, Studio maximizado) em segundo plano. A região da tela vem de `GRAVA_X`, `GRAVA_Y`, `GRAVA_TAM`.
- `gravacao/montar.py`: bruto em câmera lenta 3× → planos em tempo real a 30 qps, girados e recortados para 9:16; varredura de janela invasora.
- `gravacao/editar.py`: planos nos tempos da voz, legenda ASS de 1 palavra, HUD de jogo, etiquetas, cartões de voto e mix. Tudo configurado por um `episodio.json`.
- `voz/gerar_voz.py`: narração com tempo por palavra (PAGO; só roda com `--confirmo-custo`).
- `ceu/gerar_ceu.py`: prompts do céu e a costura das 4 laterais + topo para as emendas sumirem.
- `vfx4/desenhar.py`: efeitos desenhados como pinceladas em 4 camadas (glow, rim, meio, miolo).
- `tex/montar_moldes.py`: converte um atlas de roupa nos moldes clássicos 585×559 de camisa e calça.
- `restaurar_studio.ps1`: restaura a janela do Studio se ela estiver minimizada.

## Passo a passo (ponta a ponta)
Copie `motores/13/` para a pasta do seu projeto e rode os comandos de dentro da cópia.

0. **Demo (sem o Studio):**
   ```
   pip install -r requirements.txt
   python demo.py
   ```
   Sai `saida/demo.mp4` (540×960, 3 s, mudo) em ~45 s: prova que montagem e edição funcionam no seu PC.
1. **Roteiro** nas 6 partes, 1ª pessoa de criança, ~3,3 palavras por segundo, com voto no fim. **Portão 1: aprove o roteiro antes de gastar com voz.**
2. **Cena no Studio via MCP** (execute_luau): cidade em pastas no workspace, personagens R6, luz. Instale os módulos de `luau/` (veja `luau/LEIA.md`); as peças são arredondadas pelo `Arredonda`. Texturas próprias sobem por upload_image, que só aceita URL http: sirva a pasta com um servidor local (`python -m http.server`).
3. **Bichos e criaturas:** generate_mesh + wait_job_finished; achate o modelo (a MeshPart direto no Model).
4. **Céu:**
   ```
   python ceu/gerar_ceu.py dia --prompts
   ```
   Gere as 5 imagens no seu gerador (uma tarefa de GPU por vez), salve em `ceu/dia/` como `Ft.png`, `Rt.png`, `Bk.png`, `Lf.png`, `Up.png` e rode `python ceu/gerar_ceu.py dia`. Suba os `sky_*.png` e ligue no objeto Sky.
5. **Efeitos:**
   ```
   python vfx4/desenhar.py
   ```
   Suba os PNGs, cole os ids em `DiaVFX4` e ligue nos emissores (`fogo`, `estouro`).
6. **Portão 2: prints numerados** (screen_capture, um por vez) ao lado da referência. Aprove o visual antes de gravar.
7. **Voz (PAGA):** ponha o texto em `voz/narracao.txt` e os ids das vozes em `voz/gerar_voz.py`.
   ```
   python voz/gerar_voz.py A
   python voz/gerar_voz.py A --confirmo-custo
   ```
   O primeiro comando só mostra o custo em caracteres. Gere uma tomada por voz e escolha de ouvido.
8. **Gravar plano a plano.** Deixe a tela livre (nenhuma janela por cima) e não rode mais nada pesado na GPU. Para o plano i: `prep(i)` no `DiaGrav`, dispare a gravação, depois `run(i)`:
   ```
   cd gravacao
   bash grava2.sh 01_aereo 20
   ```
   Os segundos = (duração do plano + 1,2) × 3 + folga.
9. **Montar e editar** (na pasta dos brutos, com o seu `planos.json` e `episodio.json` feitos a partir dos modelos):
   ```
   python montar.py deitados
   python montar.py varre
   python editar.py episodio.json --voz ../voz/narr_A
   ```
   Sons: ponha os seus em `gravacao/sons/` com os nomes do `episodio.json` (sua biblioteca de efeitos, ou um pack CC0). O que faltar é pulado com aviso.
10. **Entrega:** 1080×1920 yuv420p, AAC 48 kHz, −14 LUFS, mais uma cópia 720p para ver no celular. Passe a skill `checar-video` com o roteiro.

Ao reabrir o lugar, rode no Studio (as malhas arredondadas não são salvas no arquivo):
```
require(game.ServerStorage.Arredonda:Clone()).refazer(workspace)
require(game.ServerStorage.ArredondaCorpo:Clone()).refazer(workspace)
```

## Pegadinhas medidas
- **Fundo e tela limpa:** fundo chapado liso vira slide (dê profundidade, luz ou textura); nota de produção nunca vai dentro do quadro (nome de arquivo, versão, crédito de ferramenta); nada de rótulo "imagem gerada" por cima da arte.
- **O "tosco" do Roblox se resolve com camada de efeito, não com mais peças.** Cena que parece genérica não melhora com mais casas e mais objetos. Melhora com três ou quatro camadas por cima: partícula (`ParticleEmitter`), feixe (`Beam`), névoa (`Atmosphere`) e brilho (`Bloom`, `PointLight`). Exemplo: a janela da casa "proibida" ganha um `PointLight` laranja, um `ParticleEmitter` de poeira subindo devagar (`Rate` 6, `Lifetime` 3 a 5, `Speed` 0,5, transparência de 0,6 a 1) e um `Beam` fraco saindo pela fresta. As mesmas peças passam a ter clima.
- **A virada precisa de plantio.** Antes de "comigo foi diferente", mostre pelo menos duas pistas que o espectador pode rever (um vizinho que não cumprimenta, um objeto fora do lugar). Virada sem pista plantada é só surpresa.
- **Serrilhado:** o viewport de 810×784 recortado em 441×784 e esticado 2,5× serrilha. Solução: câmera deitada (ROLL 90°, FOV 36), Studio maximizado, gravar 1336×752 e girar; recorte 728×1294 → 1080×1920 quase sem ampliar. Fixe a qualidade em Level21 por script (a automática cai quando a janela perde o foco).
- **Câmera lenta:** gravar a cena 3× mais lenta rende ~22 quadros novos por segundo; o `montar.py` devolve o tempo real.
- **Janela por cima estraga o plano:** um aplicativo de mensagens aberto sujou os planos 1, 10 e 15. Varra cada plano (`montar.py varre`) e regrave.
- **Studio caiu** (Device removed 0x887a0006) quando outro programa pesado usou a GPU durante a gravação. Uma tarefa de GPU por vez.
- **MCP:** ler Lighting.Technology aborta o script; screen_capture uma por vez (em paralelo dá timeout e pode voltar outra câmera); require guarda cache (use Clone); save_place só funciona depois de você salvar 1× pelo menu.
- **Construção:** WedgePart tem o lado alto no +Z; cilindro tem o eixo no X; TextScaled para em 100 px (baixe o PixelsPerStud para 22–25); texto atrás de vidro some.
- **Partículas com câmera deitada:** saem deitadas; Rotation −90 ±15. ZOffset acima de 1,5 joga a partícula para trás da câmera. Contorno branco piscando = hover do Studio; desligue.
- **VFX em 4 camadas:** asse rim + meio + miolo numa imagem só (emissores separados não alinham partícula a partícula); o glow vai num emissor aditivo.
- **Arredondar:** ~1.130 peças em ~18 s.
- **Região da tela:** os números 664,208 e 1336×752 do `grava2.sh` são de um monitor 2560×1080. Meça a sua.
- **FFmpeg:** o `editar.py` usa `-/filter_complex` (FFmpeg 7+). A fonte padrão da legenda é a Arial Rounded MT Bold (Windows); troque em `"fonte"` no `episodio.json` se não tiver.
- **QA do exemplo:** −14,1 LUFS, fala 98%, parado máximo 0,2 s. Falso positivo de "texto na borda": o número da camiseta e a placa da máquina.

## Custo e tempo
- **Pago:** só a voz. O texto do exemplo tem ~1.130 caracteres por tomada (75–90 s de fala); testar duas vozes dá ~2.300 caracteres. Veja o custo antes de gerar (`gerar_voz.py` sem `--confirmo-custo`).
- **Grátis:** Studio, MCP, generate_mesh, upload de imagem, gerador de imagem local, gravação.
- **Tempo:** 20 planos gravados um a um; cada bicho 1–2 min; arredondar 18 s. O EP01 levou dois dias.
- **GPU:** o Studio usa a GPU durante a gravação. Uma tarefa de GPU por vez: feche o gerador de imagem antes de gravar.

## O que funcionou e o que não funcionou
- **Imitar o Roblox em three.js não funcionou:** sete versões e ainda não parecia Roblox. Gravar no Studio de verdade resolve na primeira.
- **Zoom no mesmo plano não é corte:** punch-in de 1,22× a cada 1,6 s virou "um monte de zoom" sem sentido. Ritmo é ângulo novo de verdade, e os bonecos precisam se mexer.
- **Bichos montados com caixas ficaram toscos** (a águia saiu com os dois olhos do mesmo lado). Os bichos gerados pelo generate_mesh do Studio resolveram.
- **O "genérico" do Roblox se resolve com camada de efeito, não com mais peças:** o método de VFX em 4 camadas (estilo inspirado em contas de efeitos visuais para Roblox) foi o que mais mudou a cara da cena.
- **Roteiro com regra de jogo rende mais:** a primeira versão era só "bonitinha"; melhorou quando o mundo ganhou uma regra clara e um HUD de jogo.
- **Roupas desenhadas por código ficaram fracas.** Use referência de personagem ou roupas prontas do catálogo.
- **Regras que valem sempre:** roteiro aprovado antes da voz; aprovação visual por prints numerados antes de gravar; narração sem sussurro; efeitos sonoros pelo menos 10 dB abaixo da voz; entrega em yuv420p (outro formato de pixel pode não abrir no celular).
- **Nossa nota:** o EP01 saiu "bom para um MVP, ainda meio genérico" no visual. O final e a voz não passaram por uma segunda rodada de revisão.

## Roteiro de aula
- **Objetivo:** o aluno sai sabendo escrever na fórmula de 6 partes, montar e animar uma cena no Studio por script com o MCP, gravar sem serrilhado e editar sobre a voz.
- **Demonstração (~35 min):** (1) a fórmula no roteiro do EP01, parte por parte, 5 min; (2) ligar o MCP e criar uma casa e um boneco por script, 7 min; (3) gerar um bicho com a IA do Studio, 4 min; (4) VFX ligado × desligado na mesma cena, 4 min; (5) câmera deitada: gravar um plano e girar, comparando com o recorte antigo, 8 min; (6) editar: legenda de 1 palavra, HUD e cartões, 7 min (o `demo.py` mostra essa parte sem o Studio).
- **Exercício:** uma cena de 10 s com 2 planos de ângulos diferentes, 1 personagem que se mexe e 1 efeito. Deu certo se: não há serrilhado visível em 1080×1920, nenhum corte é zoom no mesmo plano, nenhuma janela invadiu a gravação e a primeira frase é uma regra da cidade.
- **Pré-requisitos:** aula de voz e orçamento; noção de Luau ajuda mas não é obrigatória (o script é escrito pela IA).

## Limites conhecidos
- **Beta:** não existe render fora da tela. A gravação é captura da janela real do Studio, plano a plano, no Windows, e precisa da tela livre.
- O demo prova só a montagem e a edição, com cena de blocos desenhada por código. Nada do Studio é testado por ele.
- O lugar (.rbxl) do EP01 não vem no pacote. Os módulos Luau vêm como texto, mas o `DiaGrav` é o do episódio (planos, nomes e posições daquela cidade) e os ids de imagem são marcadores: você reescreve a tabela de planos e sobe as suas texturas.
- `voz/gerar_voz.py` foi escrito para a API pública da ElevenLabs e não foi rodado com gasto real neste pacote; confira o resultado na primeira tomada.
- O mix só foi provado com a nossa biblioteca de sons; com os seus arquivos, confira os volumes de ouvido e no celular.
- Só existe um episódio feito com esta receita: ainda falta um segundo para provar que ela repete.
