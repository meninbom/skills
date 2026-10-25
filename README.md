# mwllo skills

Skills de design e entrega para o time mwllo.dev (Claude Code, Cursor, Codex, OpenCode, Windsurf).

Base: o que é útil em [elayadesign/ai-design-skills](https://github.com/elayadesign/ai-design-skills) (MIT) — intake, estrutura, anti-slop, build por seção, rigor de motion — **sem** o sistema visual da Elaya (Geist/Poppins, island nav, tagline word-reveal obrigatório).

Cada skill é uma pasta com `SKILL.md`. Instale só o que precisa.

## Skills

| Skill | Quando usar |
|---|---|
| `landing-page-design` | LP nova de cliente ou do estúdio: oferta, estrutura, copy, tokens do brand kit do projeto, QA antes de preview |
| `lp-motion-gsap` | Animações e interações de LP com GSAP + ScrollTrigger; respeita reduced-motion; consulta MCP GSAP antes de inventar |

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

Copie o `SKILL.md` para `AGENTS.md` do projeto (ou anexe no prompt do job).

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
