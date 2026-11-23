# BÍBLIA ep01: "Fui atropelado por um patinete elétrico e renasci como o patinete"

9:16 1080x1920, 30 fps, 38 s, sem voz. Motor anime three.js (pós do RYUMON, MIT; ver `engine/LICENSE`).
Personagem: VRoid HairSample_Male (CC0) recolorido e re-vestido como RYO. Créditos só no `../FONTES.md`.

## A piada
Abertura de isekai ao pé da letra: o cara morre atropelado e renasce **como o objeto que o matou**. No outro mundo, o
patinete acorda feliz, sai voando pelo campo... e a bateria acaba bem na frente do Rei Slime. Final: "não existe tomada
em outro mundo". Lê sem narração: a cara do patinete é o display do guidão (olhos de LCD + bateria em %).

## Regras de arte
- Cel 2 tons + 1 brilho + rim; personagem em twos, FX em threes, câmera em ones. Impact = 3 quadros invertidos + 3 brancos.
- Rosto do VRoid chapado (sem o degradê da textura VRoid), cabelo e roupa posterizados em 3 níveis, sem as malhas de outline do VRoid (a tinta é do pós).
- Pescoço: pitch de pescoço+cabeça limitado (−0,42..0,5 rad), o resto vai pra coluna. Joelho sempre um pouco dobrado (0,16 rad) + contrapposto.
- Gota de suor presa à cabeça e puxada 20 cm para a lente (nunca atrás do cabelo).
- PROIBIDO: sangue, crédito na tela, palavra colorida, marca real no patinete.

## Paleta
| item | luz | sombra |
|---|---|---|
| Ryo cabelo castanho | #8a5232 | #2a160e, brilho #d8a070 |
| moletom mostarda | #f6c84e | #a8701e |
| calça cargo oliva | #5f6e44 | #1e2418 |
| íris verde | #3f9a6a | #10201a |
| pele | #fbe3d2 | #e0bbc0 |
| patinete | #3fd494 | #1d8670; deck/guidão #2c2c38 |
| display (LCD) | #c8f6ff, tinta #14202a | bateria ok #22b86a, baixa #f0a020, crítica #ff2d3c |
| rua / campo / branco | presets do motor (céu #4f86dc→#e6f0ff; campo #86c85a; renascimento #fff8ec) |

## Planos (s)
| id | t0–t1 | set | o que acontece |
|---|---|---|---|
| s01 rua | 0.0–3.0 | RUA | geral baixa: Ryo anda olhando o celular |
| s02 tédio | 3.0–5.0 | RUA | close, cara de cansado iluminada pelo celular, pisca (4.2) |
| s03 patinete | 5.0–6.8 | RUA | rasante na calçada atrás dos pés dele: patinete sem ninguém vem a 40 km/h na direção dele, speed lines |
| s04 olhar | 6.8–8.2 | RUA | close: ele levanta o olho (7.0), pupila encolhe, gota, pose "eek" |
| s05 impacto | 8.2–8.4 | RUA | 3 quadros invertidos + 3 brancos |
| s06 atropelado | 8.4–11.4 | RUA | de cima: Ryo de cara no chão, pernas tremendo, estrelas; patinete deitado, roda girando, display assustado; fade branco |
| s07 cartela | 11.4–15.4 | BRANCO | "FUI ATROPELADO POR UM PATINETE ELÉTRICO E RENASCI COMO O PATINETE" |
| s08 acorda | 15.4–18.0 | CAMPO | close no display deitado na grama: olhos fechados → abre (16.4), pisca (17.2) |
| s09 mundo | 18.0–21.0 | CAMPO | levanta sozinho com pulinho, olhos de brilho; grua revela castelo, ilhas, 2 luas |
| s10 corrida | 21.0–24.5 | CAMPO | dá voltas feliz (^ ^), poeirinha, flores abrindo em anel, notas |
| s11 bateria | 24.5–27.0 | CAMPO | close no display: 94% → 5% piscando vermelho; cara preocupada, suor; guidão murcha |
| s12 tremor | 27.0–29.0 | CAMPO | chão treme, Rei Slime sobe atrás da colina; patinete vira, cara de pavor, 3% |
| s13 rei | 29.0–30.3 | CAMPO | slime ruge (29.4), speed lines, impact |
| s14 fuga | 30.3–31.8 | CAMPO | close: roda gira, anda 30 cm, 1% → 0%, tela apaga (31.4) |
| s15 morto | 31.8–33.0 | CAMPO | tomba de lado (32.1), poeirinha |
| s16 capítulo 2 | 33.0–38.0 | CAMPO | slime menor chega, cutuca o patinete, confuso, gota; grua sobe; cartela "CAPÍTULO 2 / NÃO EXISTE TOMADA EM OUTRO MUNDO" |

## CUES
look 7.0, hit 8.2, white 11.4, wake 16.4, rise 18.4, zoom 21.0, low 25.6, slimeup 27.3, roar 29.4, dead 31.4, flop 32.1, card2 33.6
