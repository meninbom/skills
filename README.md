# mwllo skills

Skills de design e entrega para o time mwllo.dev (Claude Code, Cursor, Codex, OpenCode, Windsurf).

Base: o que é útil em [elayadesign/ai-design-skills](https://github.com/elayadesign/ai-design-skills) (MIT) — intake, estrutura, anti-slop, build por seção, rigor de motion — **sem** o sistema visual da Elaya (Geist/Poppins, island nav, tagline word-reveal obrigatório).

Cada skill é uma pasta com `SKILL.md`. Instale só o que precisa.

## Skills

| Skill | Quando usar |
|---|---|
| `landing-page-design` | LP nova de cliente ou do estúdio: oferta, estrutura, copy, tokens do brand kit do projeto, QA antes de preview |
| `lp-motion-gsap` | Animações e interações de LP com GSAP + ScrollTrigger; respeita reduced-motion; consulta MCP GSAP antes de inventar |
| [`econodescomplicada-videos`](skills/econodescomplicada-videos/) | Pipeline portátil de vídeos de Economia com Moedinha: roteiro de 5 cenas, briefing, narração, render, QA e arquivamento. Caminhos, motor, sprites e ferramentas são configuráveis e verificados por [preflight multiplataforma](skills/econodescomplicada-videos/README.md); os assets externos continuam necessários. |
| [`codex-image`](skills/codex-image/) | Geração e edição de imagens com briefing adaptativo (perguntas só quando necessárias), presets `hero/mascot/social/reel`, brand kits locais, enquadramento com recorte ou preservação, validação real de PNG/alpha e consulta de cotas mais segura. [Guia e exemplos](skills/codex-image/README.md). |
| [`curso-estilos`](skills/curso-estilos/) | Pacote completo do curso de estilos de vídeo: receitas, motores, prévias, checagem e o módulo `serie-lumen`. A pasta espelha o ZIP (leia `LEIA-ME.md`). Não entra na licença MIT da raiz; veja `skills/curso-estilos/AVISO.md`. |

## Brand rules (resumo)

- **Site mwllo.dev (estúdio):** ink `#051a24`, branco `#ffffff`, mint `#dce8e4`. Tipografia Instrument Serif + Inter. Sem verde neon.
- **LP de cliente (Premium etc.):** brand kit do brief do cliente manda — tipografia, cor, tom. Não forçar paleta do estúdio no site do cliente.
- Referências de layout salvas: land-book, minimal.gallery, lapa.ninja, navbar.gallery, footer.design, 21st.dev, Refero Styles, Cult UI, Shader Gradient, Coolors, Realtime Colors, Google Fonts, FontPair.
- Princípios: exhaust-the-design-space e experience-first — não entregar o primeiro chip CTA óbvio.
- Hosting novo: Cloudflare Workers + Static Assets; preview Workers antes de domínio custom (só com OK do Kauã).
- Build: Codex ou OpenCode — não hand-build de site.

## Install

Troque `<skill-name>` pelo nome da pasta.

### Claude Code / OpenCode style

```bash
mkdir -p .claude/skills
git clone https://github.com/meninbom/skills.git /tmp/mwllo-skills
cp -r /tmp/mwllo-skills/skills/<skill-name> .claude/skills/
```

### Cursor

```bash
mkdir -p .cursor/rules
curl -o .cursor/rules/<skill-name>.md \
  https://raw.githubusercontent.com/meninbom/skills/main/skills/<skill-name>/SKILL.md
```

### Codex

Instale a **pasta inteira** da skill (não apenas o `SKILL.md`), para manter scripts e exemplos disponíveis:

```bash
mkdir -p .agents/skills
git clone https://github.com/meninbom/skills.git /tmp/mwllo-skills
cp -r /tmp/mwllo-skills/skills/<skill-name> .agents/skills/
```

A `codex-image` requer o Codex CLI autenticado com ChatGPT (`codex login`) e o recurso `image_generation` habilitado. O Pillow agora é obrigatório para validação (`pip install pillow`); há testes offline na pasta `skills/codex-image/tests/`. Consulte o [guia da codex-image](skills/codex-image/README.md).


### Econo Descomplicada (macOS / Linux / Windows)

Instale a pasta completa da skill, copie `skills/econodescomplicada-videos/config.example.json` para `config.local.json` na pasta da skill, informe caminhos **reais** do motor/sprites/template e execute `python3 scripts/preflight.py --config config.local.json --stage plan`. Para renderização, rode novamente com `--stage render`. A skill não inclui o motor externo nem os arquivos dos episódios; veja o [guia de migração](skills/econodescomplicada-videos/README.md).

## Teste com Codex (próximo passo)

Exemplo de prompt para um job de teste:

```text
Leia skills/landing-page-design/SKILL.md e skills/lp-motion-gsap/SKILL.md deste repo.
Construa uma LP Premium de teste (nicho X) seguindo a skill.
Stack: HTML/CSS/JS estático + GSAP CDN. Sem framework.
Não use o visual da Elaya. Use o brand kit do brief anexado.
Entregue outline → hero → seções; depois motion. Respeite prefers-reduced-motion.
```

## License

MIT. Créditos: estrutura e anti-slop adaptados de elayadesign/ai-design-skills (MIT).
