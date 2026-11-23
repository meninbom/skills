# Codex Image Skill

Cópia integrada à coleção de skills do mwllo.dev. O [repositório original](https://github.com/meninbom/codex-image-skill) permanece independente.

**PT-BR**: Esta skill de agente gera e edita imagens com a ferramenta de imagem embutida do **Codex CLI**. Ela usa o seu login do ChatGPT, então não precisa de chave de API nem de API paga. O agente escreve o briefing, roda um comando, olha a imagem e itera. O consumo sai dos limites de uso do Codex no seu plano.

**EN**: An agent skill that generates and edits images with the **Codex CLI**'s built-in image tool. It runs on your ChatGPT login, so it needs no API key and no paid API. The agent writes the brief, runs one command, looks at the image and iterates. Usage comes out of your plan's Codex limits.

```bash
python3 skills/codex-image/scripts/codex_image.py "flat vector golden coin mascot, big eyes, lavender #EDE7FF background, no text" \
  -o assets/moedinha.png --aspect 9:16 --crop
python3 skills/codex-image/scripts/codex_image.py "Edit image 1. Change only: add a small green banknote in the hand" \
  --ref assets/moedinha.png -o assets/moedinha-nota.png --aspect 9:16 --crop
python3 skills/codex-image/scripts/codex_image.py --quota
```

## Requisitos / Requirements

- `codex` CLI logged in with ChatGPT (`codex login`) and the `image_generation` feature enabled.
- Python 3.8+. Pillow is optional, for `--crop` and the `SIZE` line.

## Layout

```text
skills/codex-image/
  SKILL.md                 instruções para o agente
  README.md                este guia
  LICENSE                  licença original
  scripts/codex_image.py   Codex CLI → image_gen → PNG
  examples/                amostras WebP e seus briefings
```

Execute os comandos acima a partir da raiz do repositório `skills`, ou adapte o caminho do script ao local da instalação.

## Exemplos / Examples

| Brief | Result |
|---|---|
| [`examples/moedinha.txt`](examples/moedinha.txt), `--aspect 9:16 --crop` | ![Moedinha](examples/moedinha-9x16.webp) |
| [`examples/hero-mwllo.txt`](examples/hero-mwllo.txt), `--aspect 16:9 --crop` (3rd iteration) | ![Hero](examples/hero-mwllo-16x9.webp) |
| Same hero with the H1 and CTA set in HTML (1440×900) | ![Mock](examples/hero-mwllo-mock.webp) |

## Créditos / Credits

The workflow is inspired by [gustavo-henriq/nano-banana-pro-skill](https://github.com/gustavo-henriq/nano-banana-pro-skill) by **gustavo-henriq**: the agent as art director, briefs with numbers, looking before you ship, and quota alerts at 50/25/10/5 %. No code or text was copied. That repository is now "All Rights Reserved" (since 2026-11-16), so this one is an independent implementation built on a different backend.

## License

MIT, see [LICENSE](LICENSE).
