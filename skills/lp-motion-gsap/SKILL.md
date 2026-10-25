---
name: lp-motion-gsap
description: >-
  Motion e interação para landing pages mwllo com GSAP + ScrollTrigger:
  hero de impacto, pin/scrub, magnetic CTA, stagger editorial, reduced-motion.
  Use ao animar LP, hero, estoque horizontal, assinatura tipográfica ou
  microinterações — e sempre antes de inventar curva/timeline. Consulte o
  MCP GSAP conectado quando disponível.
---

# LP Motion (GSAP) — mwllo

Motion serve a história da página. Não é enfeite de portfolio Dribbble.

**Princípio:** uma ou duas “armas” fortes > dez fades fracos.

## Quando usar

- Hero cinematográfico / showroom
- Galeria ou estoque com pin + scrub horizontal (desktop)
- Seção assinatura / tipografia editorial
- Magnetic em CTA WhatsApp / primary
- Staggers de cards / prova

## Quando NÃO usar

- Toda seção com o mesmo fade-up blur (cara de vibecoding)
- Word-reveal obrigatório estilo skill viral (só se o brief pedir)
- Autoplay agressivo que atrasa o CTA
- Motion que compete com legibilidade do hero

## Stack

- GSAP + ScrollTrigger via CDN ou bundler do projeto
- Preferir props baratas: `transform`, `opacity`, `filter` com cuidado
- **Nunca** listener de scroll cru sem throttle — use ScrollTrigger / IntersectionObserver
- Antes de inventar API: consulte MCP GSAP (`gsap-core`, `gsap-scrolltrigger`, `gsap-timeline`, plugins conforme skill catalog)

## Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  /* estado final visível; sem pin longo; sem parallax */
}
```

Em JS: se `matchMedia('(prefers-reduced-motion: reduce)').matches`, pule timelines de entrada e mostre layout estático final. Pin/scrub vira scroll normal.

## Coreografias aprovadas (receitas, não dogma)

### 1. Hero impacto (Premium / showroom)

- Entrada 1.8–2.8s desktop (mais curta no mobile)
- Luz / reveal / leve depth (CSS 3D ou WebGL só se o brief pedir e o asset aguentar)
- Copy entra depois ou em paralelo controlado — CTA clicável cedo
- Foto: framing first; motion não pode “cortar” o produto

### 2. Pin + scrub (estoque / galeria)

- Desktop: pin da seção + scrub horizontal
- Mobile: stack vertical ou snap leve — não force pin horizontal em viewport estreita
- Progresso claro; sem prender o usuário sem saída

### 3. Magnetic CTA

- Só no primary (ex. WhatsApp)
- Raio curto; reset no mouseleave
- Desligar em touch / reduced-motion

### 4. Stagger editorial

- Cards / linhas com delay curto (30–80ms)
- Ease custom (`cubic-bezier` / GSAP ease), nunca default genérico em Premium
- Uma direção por seção (não misturar up/blur/skew em tudo)

## Performance

- Poucos ScrollTriggers; mate/kill no unmount se SPA
- Imagens: dimensões, lazy abaixo da dobra, hero priority
- Evite blur animado pesado em mobile
- 30fps real em Reel/demo de scroll se o entregável for vídeo

## QA motion (antes de mostrar)

- [ ] Reduced-motion testado
- [ ] Mobile sem jank óbvio
- [ ] CTA alcançável durante/after hero
- [ ] Não parece template Elaya/SaaS (island + word cascade) sem pedido
- [ ] GSAP: sem erro de console; ScrollTrigger.refresh após fonts/imagens se necessário
- [ ] Passou `qa-antes-de-preview-mwllo` quando for entrega mwllo

## Saída ao implementar

1. Liste as 1–3 motion “hero moves” escolhidas e por quê
2. Implemente
3. Nota de reduced-motion
4. Print ou preview URL (Workers) com noindex
