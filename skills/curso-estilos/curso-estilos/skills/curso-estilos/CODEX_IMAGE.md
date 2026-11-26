# Imagens geradas: skill `codex-image`

Neste computador, quando um estilo do curso precisar de **imagens geradas** (personagem, placa, textura, céu, conceito, styleframe), use a skill **`codex-image`**. Ela gera pelo `image_gen` embutido do Codex CLI, com o login do ChatGPT — **sem chave de API e sem API paga**.

Não use ComfyUI, Z-Image, Google Flow, Nano Banana nem outro serviço pago só para tirar essas aindas. A animação em vídeo (H3 / ComfyUI) é outra etapa, opcional, e continua documentada na receita quando existir.

Guia da skill: `~/.agents/skills/codex-image/SKILL.md`. Script: `~/.agents/skills/codex-image/scripts/codex_image.py`.

## Como chamar

1. Escreva o brief **em inglês**, com números (assunto, estilo, composição, paleta, o que não pode aparecer). Texto dentro da imagem, se houver, vai entre aspas e curto.
2. Rode **você mesmo** no terminal (não delegue a um subagente). Uma imagem leva uns 20–40 s.
3. Salve **dentro do projeto** (`assets/` ou o caminho que a receita do estilo pede). Depois continue o pipeline do estilo (recorte, motor, render).
4. Olhe o arquivo, julgue e, se precisar, itere no máximo 2–3 vezes com `--ref` na imagem anterior.

```bash
python3 ~/.agents/skills/codex-image/scripts/codex_image.py "<brief>" -o assets/nome.png --aspect 9:16 --crop
python3 ~/.agents/skills/codex-image/scripts/codex_image.py --prompt-file brief.txt -o assets/nome.png --aspect 4:5 --ref ref1.png
```

`--aspect` aceita `1:1`, retrato `2:3 3:4 4:5 9:16`, paisagem `3:2 4:3 5:4 16:9`. `--crop` recorta no centro para o ratio exato. `--transparent` pede fundo transparente (confira o canal alfa). O script não sobrescreve: na segunda vez vira `nome-v2.png`, salvo com `--force`.

Antes de um lote maior que ~6 imagens, rode `python3 ~/.agents/skills/codex-image/scripts/codex_image.py --quota` e avise o aluno o que resta. A geração **consome a cota do Codex** (janela de 5 h e semanal). Se sair `LIMIT_REACHED`, pare e avise; não tente de novo.

## Por estilo

| Código | O que gerar | `--aspect` típico | Para onde salvar, depois seguir a receita |
|---|---|---|---|
| `#116` `comic-history` | Personagens e quadros da história em quadrinhos que a biblioteca pedir | `2:3` ou `9:16` | `assets/` do filme, e passe os arquivos no pedido à biblioteca |
| `#147` `manga-panels` | Personagens e painéis de mangá | `2:3` ou `9:16` | `assets/` do filme, e passe os arquivos no pedido à biblioteca |
| `#188` `text-flash-cuts` | Imagens de apoio dos cortes de texto (quando a biblioteca pedir gerador) | `9:16` | `assets/` do filme, e passe os arquivos no pedido à biblioteca |
| `#07` | Ficha do mascote; depois, **uma imagem por pedido**, com `--ref` nos quadros de estilo: placas sem personagem, folhas de poses/figurantes no magenta, props | `9:16` (placas); `1:1` ou `4:5` (folhas) | `assets/` e, em seguida, o recorte em `arte/` como a receita manda |
| `#08` | Styleframes do personagem (ainda, 9:16). A animação em vídeo (H3) continua opcional e à parte, com ComfyUI, se o aluno quiser | `9:16` | `assets/` (ou a pasta de stills da cópia do motor) |
| `#11` | Ilustrações que entram no mapa (depois pode rodar o rembg). Sem elas, o demo usa placeholder | `1:1` ou `9:16` | `assets/` da cópia do motor |
| `#14` | Fotos/adesivos do percurso (ou use foto de banco com licença comercial) | conforme a cena; retrato `4:5` ou `9:16` | `assets/` da cópia do motor |
| `#35` | Conceito em turnaround (3 vistas numa folha) e texturas quadradas do herói | `3:2` (folha 1536×1024); `1:1` (texturas) | `assets/`, depois copie para `conceito/` e a pasta de texturas da receita |
| `#66` | Ilustrações paradas do episódio. A animação (H3 Flash) continua opcional e à parte, com ComfyUI | `9:16` | `assets/` da cópia do motor |
| `#02` | Texturas do cenário. Image→3D e texto→movimento no ComfyUI **não** entram nesta skill | `1:1` | `assets/` da cópia do motor |
| `#13` | Só o céu pintado (cinco faces do cubemap) | `1:1` | `assets/ceu/`, depois copie para `ceu/dia/` com os nomes da receita (`Ft.png`, `Rt.png`, …) e rode `gerar_ceu.py` |
| `#34` | Só se for fazer texturas novas (o motor já traz as de exemplo) | `1:1` | `assets/`, depois `tex/` da cópia do motor |

Nos estilos `#116`, `#147` e `#188`, **não copie** os textos de estilo da biblioteca Lemo-Opuscar (são CC BY-NC 4.0). Escreva o brief com as palavras do aluno e o que a skill `99-estilos` já descreve (nome do estilo, formato vertical, o assunto).
