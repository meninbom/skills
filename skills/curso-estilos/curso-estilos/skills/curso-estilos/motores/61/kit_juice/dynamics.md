# dynamics.md: regras de movimento e juice do kit

Toda animação nova é escrita **primeiro como beats em quadros (60 qps)**, depois vira código. Todo valor é função de `t` (render determinístico).

## Regras
1. **Antecipação:** antes de toda ação, 8–18 q no sentido contrário (recuo, agachar, puxar a arma). Ação sem antecipação não existe.
2. **Arcos:** membros, armas, itens e números andam em arco com gravidade. Caminho reto só em projétil rápido (≤ 6 q).
3. **Golpe rápido, reação lenta:** whip de 2–4 q com **smear** (rastro de malha com a cauda em alpha 0). A reação (tremida, mola, partícula, número) dura 15–40 q.
4. **Contato = hit-stop:** congelar 3–6 q no quadro do impacto (crítico: 8 q). O mundo para, o clarão fica.
5. **Clarão de impacto:** o alvo fica branco puro por 3–5 q e volta em 2 q. **A forma tem que continuar legível** (bloom baixo no clarão).
6. **Squash & stretch:** volume constante (sx·sy·sz ≈ 1). Esticar no movimento, achatar no contato, voltar com mola.
7. **Overlap / follow-through:** rabo, cabelo, capa e pompom chegam 3–8 q depois do corpo e passam do ponto.
8. **Recompensa em camadas:** luz (0 q) → anel (2–6 q) → partículas (4–20 q) → número/HUD (6–30 q). Nunca tudo no mesmo quadro.
9. **Número de dano:** pop 0→1,25→1 em 6 q, sobe ~50 px em 40 q e some com fade nos últimos 15 q. Tamanho ∝ dano; cor = tipo; crítico ≥ 2× maior e tremendo.
10. **Barra que mente:** o preenchimento cai no quadro do contato e um pedaço branco segura 30 q e escoa em 18 q. O número conta junto.
11. **Câmera:** sempre com destino. Ela segue com atraso (lag de 6–10 q) e treme só no impacto (trauma que decai em ~15 q).
12. **Raio-X:** congela a cena REAL (não corta para outra), escurece/tinge de ciano, coloca o selo ● REPLAY e desenha por cima, no próprio objeto.

## EVITAR → FAZER
| Evitar | Fazer |
|---|---|
| caminho reto | arco com gravidade |
| cauda/rabo adiantado | cauda seguindo o caminho, atrasada |
| tween linear | keys com easing (`E.out3`, `E.outBack`, `E.mola`) |
| fade no impacto | quadros de impacto (branco cheio + hit-stop) |
| bloom estourando a forma | clarão com contorno legível |
| tudo no mesmo quadro | camadas escalonadas (regra 8) |
| Math.random | `hash(n)` determinístico |
| SFX sintetizado | só SFX reais (biblioteca), entrando no tempo forte |

## Revisão (antes de mostrar)
- **1 still por beat**, conferido contra as regras acima (`node render.mjs --pagina cenas/SUA_CENA --quadros t1,t2,... --out saida/folha.jpg`).
- **Conferir em todos os quadros** (vale escrever um probe na sua cena): hit-stop com a duração certa, clarão ≤ 6 q, número dentro da área segura, nada fora do quadro, câmera nunca parada mais de 30 q.
