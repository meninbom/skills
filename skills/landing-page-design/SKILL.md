---
name: landing-page-design
description: >-
  Sistema mwllo para landing page de conversão: intake, estrutura, copy,
  brand kit do projeto (estúdio ou cliente), anti-slop, build por seção e
  checklist de ship. Use ao criar, editar, revisar ou escrever copy de
  qualquer LP, marketing site ou seção de venda — mesmo sem a palavra
  "design". Consulte antes de escolher seções, headline, CTA, tipografia,
  espaçamento ou motion.
---

# Landing Page Design (mwllo)

Uma landing page não é homepage. Homepage serve vários intents. LP ganha um:

**uma oferta → um público → uma ação primária.**

Duas metades. **Parte A** decide o que a página diz e como se estrutura. **Parte B** aplica o brand kit **do projeto** (não um visual genérico de SaaS). Faça A antes de B.

## Escopo

- LPs de cliente (pacotes mwllo Premium / Standard / etc.)
- Site do estúdio mwllo.dev quando o pedido for página de conversão
- Seções de marketing, protótipos e reviews de conversão

Quando a regra desta skill conflitar com default de framework, esta skill vence. Quando o prompt explícito do Kauã (ou do brief travado) conflitar, o brief/Kauã vence.

**Companions**
- Motion: `lp-motion-gsap`
- Antes de mostrar preview: skill `qa-antes-de-preview-mwllo` (Grok Bot / time)
- Entrega: skill `entrega-de-site-verificada`

---

# PARTE A — Estratégia e estrutura

## A1. Intake

Pergunte só o que falta, em um lote.

**Propósito**
- Qual a ÚNICA ação primária? (WhatsApp, ligar, agendar, waitlist, comprar)
- Oferta exata: o que a pessoa leva?
- O que conta como conversão?

**Público e contexto**
- ICP
- Problema que está tentando resolver
- Top 3 objeções (por que não converte hoje)
- Fonte de tráfego: ads, busca, social, indicação
- O que o visitante já sabe ao chegar?

**Prova e assets**
- Logos, depoimentos, números, cases
- Fotos reais, fachada, estoque, demo
- Garantias, condições

**Constraints**
- Brand kit do projeto (cores, tipografia, tom) — se for cliente, **não** usar ink/mint do estúdio por padrão
- Direção: editorial, showroom, minimal, cinematográfico, etc. (do brief)
- Prioridade mobile?
- Contatos reais (nunca inventar telefone, WA, e-mail, endereço)

Se faltar dado, assuma em uma linha, declare a assunção e siga. Não trave o build.

## A2. Estrutura da página

**Above the fold (obrigatório)**
1. Headline: outcome + audiência
2. Subheadline: como / especificidade
3. CTA primário: verbo + o que ganha
4. Um sinal de prova (stat, depoimento curto, selo)
5. Visual de hero forte (foto real, produto, showroom — não stock genérico se o brief tem assets)

**Meio (o argumento)**
6. Problema → solução (uma seção)
7. Benefícios (3–5), orientados a outcome
8. Como funciona (3 passos) **ou** prova editorial (estoque, processo, bastidores)
9. Prova social / confiança

**Fundo (objeções)**
10. FAQ (6–12) quando o offer tem atrito
11. Reversão de risco se existir (garantia, visita sem compromisso)
12. CTA final idêntico ao do topo

Não obrigue “tagline reveal word-by-word” nem island nav. Seção de assinatura / momento tipográfico grande só se o brief Premium pedir impacto editorial.

## A3. Layout

Escolha um e diga o porquê.

| Tipo | Quando |
|---|---|
| **A. Hero clássico + seções** | Produto/serviço claro com um visual forte |
| **B. Long-form story** | Precisa educar / vencer ceticismo |
| **C. Conversão mínima** | Tráfego quente (e-mail, remarketing) ou waitlist |
| **D. Comparação / estoque** | Intenção de busca ou catálogo (ex.: multimarcas) |
| **E. Showroom cinematográfico** | Premium automotivo / retail com hero de impacto (Approach A) |

Consulte referências do stack mwllo (land-book, minimal.gallery, lapa.ninja, navbar.gallery, footer.design, 21st.dev, Refero, Cult UI) **depois** de travar tipo e offer — referência não substitui brief.

## A4. Conversão

- **Message match** com a fonte de tráfego.
- Um CTA primário. Sem CTAs competindo above the fold (secundário ok se for contato alternativo claro: “ligar” vs “WhatsApp”).
- Benefício antes de feature. Seja específico (números reais do brief; sem inventar métricas).
- Trate objeção como seção, não rodapé.

## A5. Copy

Fórmulas de headline (use com julgamento, não como template óbvio):
- "{Outcome} sem {dor}"
- "O {categoria} para {audiência}"
- "{Resultado} em {tempo}" quando o tempo for verdadeiro

CTA: verbo + o que leva. Evite “Saiba mais” / “Enviar”.

**Anti-slop (obrigatório)**
- Sem Lorem Ipsum
- Sem “João da Silva” / marcas fictícias tipo Acme / Nexus / SmartFlow
- Sem números redondos falsos (`99.9%`, `50%`) — use dados do brief ou omita
- Sem clichês de IA: Elevate, Seamless, Unleash, Next Gen, Game changer, Delve, Tapestry, “No mundo de…”
- Sentence case em headers (não Title Case Em Tudo), salvo marca registrada
- Voz ativa. Tom do brief (pt-BR direto; Premium pode ser editorial, nunca genérico de SaaS gringo)
- Contatos e NAP reais e consistentes (SEO local)

## A6. Ordem de build

1. Outline + hero copy (revisão humana se pedido)
2. Hero
3. Benefícios / argumento
4. Prova
5. FAQ / contato
6. CTA final
7. Motion (skill `lp-motion-gsap`)
8. QA preview

Nunca refazer a página inteira a cada iteração. Diff por seção.

## A7. SEO / AEO

- Preview / pitch / QA: `noindex, nofollow` (Workers preview).
- Página evergreen de cliente: title, meta, FAQ em prosa; schema FAQ se fizer sentido; NAP consistente.
- Não indexar campanhas só de ads.

## A8. Armadilhas

- CTA demais above the fold
- Value prop vaga (“otimize”, “eleve”, “transforme”)
- Feature list sem outcome
- Prova enterrada
- Mobile ilegível
- Visual Elaya-default (Geist + island pill + word-reveal) em cliente que não pediu isso
- Inventar telefone / WhatsApp / endereço

---

# PARTE B — Sistema visual (do projeto)

Todo valor visual resolve pelo **brand kit do projeto**, não por um kit fixo desta skill.

## B1. Qual brand kit?

| Projeto | Tokens |
|---|---|
| **mwllo.dev (estúdio)** | ink `#051a24`, branco `#ffffff`, mint `#dce8e4`. Tipografia Instrument Serif + Inter. Logo oficial do brand kit. Sem verde neon (`#18edac`, `#008258`, etc.). |
| **Cliente** | Cores, tipografia e tom do brief / brand kit do cliente. Ex.: UK Multimarcas = Syne + Manrope, ink + vermelho UK, Approach showroom — **não** mint do estúdio. |

Se o brief não trouxer tipografia, proponha **um** par (display + body) alinhado à direção e valide antes de espalhar. Não defaultar Geist/Poppins só porque “é o que a skill viral usa”.

## B2. Tipografia

- Escala consistente (modular). Evite tamanhos arbitrários soltos.
- No máximo um display + um body (mono só se o UI precisar).
- Sem itálico decorativo em UI densa, salvo marca.
- Evite orphan: `text-wrap: balance` em headings; `pretty` em body quando suportado.
- Inter / Roboto / Arial / Open Sans como body de marketing: só se o brand kit do cliente exigir.

## B3. Espaçamento e raio

- Escala de spacing limitada (ex.: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 80 / 96). Sem valores aleatórios entre steps.
- Radii do brand kit. Nested radius: `inner ≈ outer − gap` quando o gap for pequeno.
- Bordas: ou em volta toda, ou nenhuma — sem borda só em um lado de card (salvo divider editorial consciente).

## B4. Fundo e cor

- Gradientes de fundo: permitidos só se o brief / direção pedir (ex. Shader Gradient como *asset*, não como preguiça).
- Contraste WCAG em texto sobre foto: overlay, scrim ou tipografia que leia no mobile.
- Dark / light conforme brief — não forçar dark SaaS.

## B5. Hero

- Headline + sub com max-width legível (~40–45ch / ~680px quando fizer sentido).
- Quebras de linha no sentido da frase.
- Foto/produto sem crop que mate o sujeito (contain vs cover: escolha consciente; se o cliente reclamou de corte, priorize framing).
- Prova ou micro-confiança perto do CTA.

## B6. Ícones e UI chrome

- Um set só (Phosphor, Lucide, custom SVG do brand). Sem Material Icons genérico se o brief for Premium editorial.
- Nav e footer: consulte navbar.gallery / footer.design para *idéias*, depois faça do jeito do projeto. Island glass pill não é default mwllo.

## B7. Conteúdo realista

- Fotos: preferir assets do cliente / gerados sob brief. Stock só se curado e alinhado (e declarado).
- Depoimentos: reais ou omitidos — nunca inventar.
- Datas, preços, horários: do brief.

## B8. Estados

Todo interativo: hover, active, focus visível, loading (skeleton no formato real), empty, erro inline (sem `alert()`).
Sem `href="#"` morto. Item atual na nav indicado.

## B9. Ship

- Favicon, title, meta, OG
- Alt em imagens significativas
- HTML semântico (`header`, `main`, `nav`, `footer`, headings em ordem)
- Form: validação client-side mínima; destino real (Resend / WA / tel) conforme brief
- Cookie / privacidade só se o brief ou jurisdição pedir — no mwllo.dev, manter o notice aprovado; política no footer como link, não seção-ensaio
- 404 alinhado à marca quando houver multi-página
- `prefers-reduced-motion` respeitado (ver `lp-motion-gsap`)
- Preview: noindex até OK de publish / DNS

## B10. Princípios mwllo

- **experience-first:** a experiência da visita vem antes do componente da moda.
- **exhaust-the-design-space:** não entregar a primeira solução óbvia de chip CTA; explore 2–3 direções quando o brief for Premium / impacto.
- Impacto > “bonitinho SaaS”. Se o Kauã pediu surpresa, o hero precisa carregar peso (luz, escala, motion) — não só tipografia limpa.

---

# Formato de saída

Antes do código, nesta ordem:

1. **Outline** — seções
2. **Hero copy** — headline, sub, CTA, prova
3. **Benefícios** — 3–5
4. **Como funciona / argumento**
5. **FAQ** (se houver)
6. **SEO** — index ou noindex + title/meta se index
7. **Layout** — A–E e por quê
8. **Brand kit em uso** — estúdio ou cliente (tokens citados)

Depois: build por seção (A6) → motion → QA.

---

# Checklist rápido

**Estratégia**
- [ ] Uma oferta, um público, uma ação
- [ ] CTA primário claro; sem competição above the fold
- [ ] Específico (sem verbo vazio)
- [ ] Prova perto da claim
- [ ] Contatos reais

**Visual**
- [ ] Brand kit do projeto (não Elaya-default)
- [ ] Escala tipográfica e spacing consistentes
- [ ] Contraste ok no mobile
- [ ] Hero com framing consciente
- [ ] experience-first / não só o chip óbvio

**Ship**
- [ ] Sem Lorem / clichê IA / métrica inventada
- [ ] Estados + a11y básica
- [ ] Meta / favicon / alt
- [ ] noindex em preview
- [ ] Motion com reduced-motion
