# Fontes do estilo 74

Duas listas: de onde vem cada número que aparece na tela, e de onde vem cada arquivo de terceiros que acompanha o motor. Nada disso vai na tela do vídeo; fica só aqui.

## 1. Dados na tela ("E se você ficasse 11 dias sem dormir?")

Conferidos em 15/11/2026.

| Card | Dado | Fonte |
|---|---|---|
| S3 | 17–19 h acordado: em alguns testes, desempenho igual ou pior que com 0,05% de álcool no sangue | Williamson & Feyer, *Occupational and Environmental Medicine* 57(10):649–655, 2000 (PMC1739867) |
| S4 | Dia 4: primeiras alucinações; achava que era Paul Lowe, jogador dos San Diego Chargers | Relato do próprio Gardner (Esquire); IFLScience; Wikipedia "Randy Gardner (record holder)" |
| S5 | Dia 5: alucinou uma trilha de floresta no lugar do resto da casa | IFLScience (in-1963-randy-gardner-flipped-a-coin...) |
| S6 | Dia 11: subtraindo 7 a partir de 100, parou no 65 e disse que esqueceu o que estava fazendo | Lt. Cmdr. John J. Ross (relato), via Wikipedia |
| S7 | Randy Gardner, 17 anos, San Diego, dez/1963–jan/1964, 264,4 h (11 dias e 25 min) | Wikipedia; NPR (28/01/2024, 60 anos do recorde) |
| S8 | Depois, dormiu ~14 h 40–46 min ("quase 15 horas"); voltou ao normal em algumas noites | Wikipedia (14 h 46 min, marcado "citation needed"); outras fontes citam 14 h 40 min. Por isso "quase 15 horas". |
| S10 | Por volta de 2007 passou a ter insônia séria e atribui ao experimento | Wikipedia, citando entrevista de 2017 |

Ponto fraco: a duração do sono de recuperação não tem fonte primária aberta; "quase 15 horas" vale para os dois números citados.

## 2. Arquivos e código de terceiros

| O quê | Onde está | Origem | Licença |
|---|---|---|---|
| Motor de cena (perspectiva de 1 ponto, luz, rig, props, UI, sets) | `src/engine/` | repositório público `kelano86/what-if-animation` no GitHub | MIT, © 2026 FreshStack (texto em `LICENCA_MOTOR_MIT.txt`) |
| Scripts do fluxo narrado (voz, plano de cortes, som, checagens) | `extras/narrado/` | mesmo repositório, com a chave lida só do ambiente e a trava `--confirmo-custo` | MIT (idem) |
| Bricolage Grotesque 600/700/800 (títulos e cards) | `public/vendor/fontes/` | Google Fonts, arquivos do pacote `@fontsource/bricolage-grotesque` | SIL Open Font License 1.1 (`OFL_BricolageGrotesque.txt`) |
| Fragment Mono 400 (HUD e rótulos) | `public/vendor/fontes/` | Google Fonts, pacote `@fontsource/fragment-mono` | SIL OFL 1.1 (`OFL_FragmentMono.txt`) |
| Kalam 400/700 (letra de mão dos sets) | `public/vendor/fontes/` | Google Fonts, pacote `@fontsource/kalam` | SIL OFL 1.1 (`OFL_Kalam.txt`) |
| Remotion 4.0.530, React 19 | `node_modules/` depois do `npm install` (não vão no pacote) | npm | Remotion: licença própria, veja o aviso no `DEMO.md`. React: MIT |

Os arquivos das fontes são o recorte "latin" (cobre os acentos do português). Para outro alfabeto, troque os arquivos e ajuste `src/engine/fonts.ts`.

Feito para o curso (pode usar e modificar nos seus vídeos): o personagem, o quarto vertical, o HUD, os cards e os 10 planos em `src/episodes/insone/`.

Ficou de fora: a biblioteca de efeitos sonoros e música do repositório de origem (a licença de reuso comercial daquele áudio não está clara). O estilo é entregue mudo.
