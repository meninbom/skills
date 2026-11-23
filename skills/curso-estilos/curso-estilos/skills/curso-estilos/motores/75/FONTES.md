# Fontes do estilo 75

Duas listas: de onde vêm os fatos do curta de exemplo, e de onde vem cada arquivo de terceiros que acompanha o motor. Nada disso vai na tela do vídeo; fica só aqui.

## 1. Fatos do curta "Os primeiros passageiros"

| Fala | Dado | Fonte |
|---|---|---|
| "uma ovelha, um pato e um galo" | Passageiros do balão de ar quente dos irmãos Montgolfier em 19/09/1783 | Wikipedia, "Montgolfier brothers" e "Montauciel" (o nome da ovelha) |
| "É 1783, em Versalhes, e o rei quer saber..." | Demonstração em Versalhes diante de Luís XVI; os bichos serviam para testar se seres vivos aguentavam a altitude | idem |
| "acendem palha embaixo do pano" | O ar quente vinha de um fogo de palha e lã | idem |
| "Oito minutos depois, pousam num bosque. Vivos." | Voo de cerca de 8 minutos e uns 3 km, pouso no bosque de Vaucresson | idem |
| "O único ferido foi o galo. Pelo visto, a ovelha pisou nele." | O galo teve a asa machucada; testemunhas atribuíram à ovelha | idem |

Ponto fraco: a história do galo vem de relatos de época repetidos em fontes secundárias. Por isso a fala diz "pelo visto".

## 2. Arquivos e código de terceiros

| O quê | Onde está | Origem | Licença |
|---|---|---|---|
| Motor de mundo e de personagem (mundo 3D, tinta nas bordas, desfoque de lente, grade de cor, luz, cartões, câmera) | `src/videos/balao/` (`world.ts`, `build.ts`, `paint.ts`, `ink.ts`, `lensblur.ts`, `grade.ts`, `lights.ts`, `shade.ts`, `cardshade.ts`, `toon.ts`, `cast.ts`, `Bridge.tsx`) | repositório público `mromidev/claude-animated-shorts` no GitHub | MIT, © 2026 Mr omi (texto em `LICENCA_MOTOR_MIT.txt`) |
| Bibliotecas de som sintetizado | `audio/dsp.py`, `audio/instruments.py`, `audio/sfx_gen.py` | mesmo repositório | MIT (idem) |
| Checagem quadro a quadro | `extras/short_qa.py` | mesmo repositório | MIT (idem) |
| 26 modelos 3D (árvores, arbustos, flores, barracas, lampião, carroça, moinho) e a textura `colormap.png` | `public/bridge/kenney/` | Kenney, kits "Nature Kit" e "Fantasy Town Kit" (kenney.nl) | Creative Commons Zero, CC0 (`licencas/`) |
| Remotion 4.0.532, three.js 0.178, React 19, React Three Fiber, postprocessing | `node_modules/` depois do `npm install` (não vão no pacote) | npm | Remotion: licença própria, veja o aviso no `DEMO.md`. Os outros: MIT |

Feito para o curso (pode usar e modificar nos seus vídeos): o roteiro e a linha do tempo do curta (`story.ts`), o balão, o fogo e a fumaça (`balloon.ts`), os três bichos, o rei e os irmãos (desenhos em `toon.ts` e a função `stage()` de `cast.ts`), a trilha (`audio/balao_mix.py`) e os scripts de render.

## 3. O que ficou de fora, e por quê

- **Os quadros e as folhas de referência do repositório de origem.** Lá eles estão marcados como material só para estudo de estilo, sem licença de redistribuição. Não vêm no pacote, nem como prévia. Se você clonar o repositório para estudar, não reposte esses quadros.
- **O curta de exemplo do repositório de origem** (o da ponte): o código dele é MIT, mas ele não traz a voz. Este pacote leva só o curta do balão.
- **A voz de teste.** A linha do tempo foi cronometrada com uma voz de leitura de tela do sistema, que serve para marcar tempo e não para postar. Vêm só o texto (`audio/voice/texto.txt`) e o tempo de cada palavra (`audio/voice/words.json`).
