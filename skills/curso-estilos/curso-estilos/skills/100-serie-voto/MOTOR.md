# MOTOR: como fazer um episódio

O código fica em `../curso-estilos/motores/100/` (caminho a partir da pasta desta skill). **Copie a pasta inteira para o projeto do aluno, uma pasta por episódio, e trabalhe na cópia.** Nunca edite dentro do plugin: a pasta dele é trocada a cada atualização, e o trabalho se perderia.

Precisa de Node 22 ou mais novo, FFmpeg e Python com numpy (só para o som). O render usa `npx hyperframes@0.8.162`, que baixa sozinho na primeira vez. Antes de tudo, prove que o ambiente está de pé com o `DEMO.md` da pasta do motor.

## 0. Os arquivos

| Arquivo | O que é | Mexe a cada episódio? |
|---|---|---|
| `lines.js` | A narração, uma fala por linha, com a cena de cada uma | **sim** |
| `ep.js` | A linha do tempo: o que acontece em cada cena, preso às falas | **sim** |
| `mundo.js`, `quartoA.js` | Os cenários em camadas (quarto, parede do espelho, banheiro, corredor) | só para cenário novo |
| `regis.js` | O personagem, com variantes (`celular`, `jaqueta`, `expr`, `fedor`) | quando ele muda (o voto muda ele!) |
| `personagem.js` | A foto antiga e a mãe | raramente |
| `estilo.js` | Uma linha: `window.ESTILO = 'luz'` ou `'kurz'` | o `versao.sh` escreve |
| `pele_kurz.js` | A pele sem contorno | não |
| `index.html` | Página, CSS, placar, legenda | raramente |
| `gerar_cues.mjs` | Calcula o tempo de cada fala (estimado, ou medido na voz) | não |
| `cues.js` | Saída do anterior | gerado |
| `audio/` | `voz.mjs`, `gravar.mjs`, `mix.py`, `eventos.json`, `versao.sh`, `sfx/` e a voz de exemplo | `eventos.json` sim |

## 1. O roteiro vira `lines.js`

Uma entrada por fala:

```js
{ sc: 'banho', t: 'O xampu acabou em agosto.', h: 'agosto.', c: 'v' },
{ sc: 'placar', t: 'Parecido com a foto: 4%.', h: '4%.', c: 'v', f: 'Parecido com a foto: quatro por cento.' },
```

- `sc`: a cena. Falas seguidas com o mesmo `sc` ficam na mesma cena; a ordem em que os nomes aparecem é a ordem das cenas.
- `t`: o texto da legenda, com algarismo.
- `h` e `c`: a palavra colorida (tem que ser idêntica a uma palavra de `t`, com a pontuação) e a cor (`a` amarelo, `v` vermelho, `g` verde, `z` azul, `r` rosa).
- `f`: como a voz lê, só quando é diferente da legenda (número por extenso, aspas de fala).

Depois, `node gerar_cues.mjs` calcula tempos estimados, e já dá para renderizar mudo.

## 2. As cenas no `ep.js`

Tudo é preso ao tempo das falas, nunca a segundos fixos. *Por quê:* quando a voz entra, os tempos mudam, e tudo o que estava preso às falas se ajusta sozinho. Os atalhos:

- `T(i)`, `E(i)`, `D(i)`: início, fim e duração da fala `i`. `P(i, .5)`: o meio da fala `i`.
- `ini('cena')`, `fim('cena')`: quando a cena entra e sai.
- `vis('#W3', ['banho', 'dentes'])`: em quais cenas um mundo aparece.
- `camSet(id, t, {x, y, z, cy})` e `camTo(id, t, dur, {x, y, z, cy}, ease)`: a câmera olha para o ponto `(x, y)` do cenário com zoom `z`; `cy` é onde esse ponto cai na tela (o padrão é 960, o meio). Cada camada do mundo anda num passo diferente, e isso dá a sensação de profundidade.
- `pop(sel, t, rot)` e `some(sel, t)`: um elemento entra e sai.
- `expr('rgA', 'o', t)`: troca a boca do personagem (`tenso`, `o`, `neutro`, `triste`, `sorriso`).
- `chip(id, texto, x, y, classe)`: texto solto, como o da notificação do celular.

**Um mundo** é uma lista de camadas, cada uma com um fator de profundidade:

```js
mundo('W3', [[bn.c0, .85], [personagemEcoisas, 1], [bn.frente, 1], [bn.c3, 1.6]]);
```

Fundo `.85`, meio `1`, personagem `1` ou `1.1`, primeiro plano desfocado `1.6`.

**Regras que evitam defeitos que já apareceram:**

- Texto solto que precisa ficar legível durante um zoom vai na camada fixa `#OV`, não dentro do mundo. Dentro do mundo ele cresce junto com o zoom e estoura a tela.
- O mesmo mundo pode aparecer em cenas não seguidas (o quarto abre o episódio, volta no close do rosto e volta no mergulho embaixo da cama). Ao voltar, **reponha o estado** do personagem (`tl.set` na rotação da cabeça, na boca, no suor), senão ele reaparece do jeito que saiu.
- Para o quarto virar fundo do celular ou do placar: `tl.set('#W1', { filter: 'blur(16px) brightness(.5)' }, ini('chat'))`, e `filter: 'none'` ao voltar.
- Contador e texto digitado são feitos com elementos que acendem (`tl.set` de opacidade) ou com largura em `steps()`. Não use `onUpdate`: o render pula de quadro em quadro, e o que depende de `onUpdate` sai errado.
- Detalhe pequeno pode ser desenhado pequeno: desenho em vetor não perde nitidez no zoom. O prato embaixo da cama tem 88 px e aguenta zoom de 5 vezes.
- Na cena do zoom, tire da frente o que atrapalha (o personagem e a cadeira somem durante o mergulho embaixo da cama).
- A piscada dura 2 quadros; não deixe cair no meio de um zoom, porque parece defeito.
- Zoom nunca abaixo de 1: os fundos foram desenhados para ampliar, não para afastar.

## 3. Personagem e cenário novos

O `regis.js` é uma função que devolve o desenho: `regisV2({ u: 'a', celular: true, expr: 'o', jaqueta: false, fedor: true })`. O `u` é um sufixo único para cada cópia do personagem na tela.

O que faz o personagem não ser genérico (mantenha no seu):

- **defeitos desenhados um por um, cada um removível.** É o que o voto vai consertar: cabelo ralo, dente torto, barba falhada, espinha, mancha na camiseta, barriga de fora, meia com chinelo. A graça é a feiura específica; boneco fofo e genérico não dá o que consertar;
- **luz com direção:** recorte claro de um lado, sombra roxa do outro, brilho do celular no rosto;
- boca em grupos trocáveis, pálpebra que fecha, sobrancelha e óculos em grupos próprios para animar.

Cenário: traço grosso, cor chapada, **uma fonte de luz com cor** (monitor azul no quarto, abajur quente na parede do espelho, lâmpada no banheiro), chão com tábuas em perspectiva, tralha no chão até a borda de baixo e uma camada de silhuetas desfocadas na frente. A informação da história fica escrita em objetos do cenário: a folha "30 dias" com 30 quadradinhos para riscar um por episódio, o rótulo do detergente.

**Cenário ou personagem novo: faça uma cena de 5 a 8 s e mostre para aprovação antes de fazer o resto.** Refazer um episódio inteiro por causa do desenho custa caro.

## 4. Olhar antes de renderizar o filme

Quadro parado (leva segundos):

```
npx -y hyperframes@0.8.162 lint
npx -y hyperframes@0.8.162 snapshot --at 3.0,12.5,31.2
```

Sai uma folha em `.hyperframes/artifacts/snapshots/<id>/contact-sheet.jpg`. Para pegar um quadro perto do fim de cada fala, tire a lista de tempos do `cues.js`.

Movimento (depois do render): 5 quadros por segundo num trecho. Dois defeitos do episódio de exemplo (uma notificação cortada na borda e uma piscada no meio do zoom) só apareceram assim, não em quadro parado.

```
ffmpeg -ss 1.0 -t 2.4 -i renders/x.mp4 -vf "fps=5,scale=270:-1,tile=6x2" -frames:v 1 folha_mov.jpg
```

Filme inteiro, 1 quadro a cada 2 s, e contador de trechos parados:

```
ffmpeg -i renders/x.mp4 -vf "fps=1/2,scale=216:-1,tile=10x4" -frames:v 1 folha.jpg
ffmpeg -i renders/x.mp4 -vf "freezedetect=n=0.001:d=1.0" -an -f null - 2>&1 | grep -c freeze_start
```

## 5. Voz, som e render final

**A voz é a única parte paga.** Antes de gerar, diga ao aluno o custo e espere o ok.

- `node audio/voz.mjs prep` escreve `audio/falado.txt` e diz quantos caracteres são. O episódio de exemplo tem 1.168 caracteres por gravação.
- `node audio/gravar.mjs <nome> <id_da_voz>` usa a chave da variável de ambiente `ELEVENLABS_API_KEY` (a conta é do aluno), mostra o custo e só grava com `--confirmo-custo`. Uma gravação só, sem acelerar a voz. A chave nunca vai escrita em arquivo do projeto.
- Qualquer outra voz serve, inclusive a do próprio aluno gravada no celular, desde que no fim existam `audio/<nome>.mp3` e `audio/<nome>.words.json` (cada palavra com início e fim).
- **Confira o que a voz disse** antes de montar, transcrevendo com um modelo médio ou maior. O modelo pequeno errou três trechos que estavam certos.

**Efeitos:** `audio/eventos.json` lista cada som, o momento (expressão com `T`, `E`, `P`, `ini`, `fim`) e o volume em dB abaixo do pico da voz. Os 9 sons de `audio/sfx/` servem para qualquer episódio de quarto, banheiro e celular. Som novo gerado por serviço é pago: custo e ok antes.

**Tudo de uma vez** (tempos da voz → `cues.js` → render → mixagem → vídeo e versão de celular):

```
bash audio/versao.sh A luz
bash audio/versao.sh A kurz
```

Saem `renders/ep_<estilo>_voz<nome>.mp4` (1080×1920, yuv420p, −14 LUFS) e o `_celular.mp4` (720p). Confira as duas folhas de quadros e passe a skill `checar-video`.

## 6. O episódio seguinte da mesma série

1. Copie a pasta do episódio anterior.
2. Troque o `lines.js`. A primeira cena já é ação, e o resultado do voto de ontem entra como placa por cima dela (`FORMATO.md`, 2.2).
3. No `regis.js`, aplique o que o voto consertou (tirar a mancha, arrumar o cabelo). No cenário, o que mudou (quarto arrumado). No placar do `index.html`, os dias e o número novos. Na folha da parede, risque um quadradinho.
4. Reescreva as cenas do `ep.js` que mudaram. As cenas de celular, placar e voto se reaproveitam.
5. Mudo → folha de quadros → voz (com ok) → render → conferir.

## 7. Tempos medidos (episódio de exemplo)

- Render em 1080×1920, 30 quadros por segundo: 2 min 28 s para 99,8 s de vídeo. Em rascunho (`-q draft`): menos de 1 minuto.
- Voz: 1.168 caracteres por gravação. Efeitos: 9 sons.
- Episódio seguinte com o mesmo personagem e os mesmos cenários: só roteiro, cenas novas e voz.
