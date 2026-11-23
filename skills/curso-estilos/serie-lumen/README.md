# serie-lumen

Plugin do Claude Code pra fazer uma **série de história em vídeo vertical, com escolha nos comentários**: cada episódio tem uns 2 minutos e termina numa pergunta "1 ou 2", e o voto do público decide o próximo. O fluxo é o da série LUMEN, que aparece como exemplo em cada passo.

## Instalar
No app Claude, aba **Code**, abra uma conversa na pasta do curso e peça: **instala também o módulo da série**. O Claude instala e pede a sua permissão a cada passo. Depois abra uma conversa nova e peça **"confere meu PC para a série"** (ou `/serie-lumen:checar-pc`).

A checagem final do vídeo usa a skill `checar-video`, que vem no plugin `curso-estilos`. Se ainda não tiver, peça na pasta do curso: **instala o curso**.

## O caminho de um episódio
Cada etapa tem uma skill. Você não precisa decorar os nomes: diga o que quer fazer, dentro da pasta da série, e o Claude usa a skill certa.

| Etapa | Skill | O que faz |
|---|---|---|
| 0 | `checar-pc` | confere o computador e instala as bibliotecas que faltam, com o seu ok |
| 1 | `serie-nova` | monta a pasta da série, grava os caminhos do seu PC e liga a trava de gasto |
| 2 | `sala-roteiro` | o mundo, o episódio e a escolha, só em texto, antes de qualquer imagem |
| 3 | `revisor-quadros` | um revisor que não participou da criação confere os quadros contra as fichas |
| 4 | `animar-local` | anima cada quadro no seu PC, um por vez, e passa pra 60 quadros por segundo |
| 5 | `voz-serie` | mostra o custo da voz antes, gera só com o seu ok e escolhe a melhor tomada |
| 6 | `ciclo-serie` | monta o episódio no tempo da voz e refaz só o plano que falhar na checagem |
| 7 | `fx-golpe` | efeito de golpe que estoura junto com o som, e a régua de tempo de um golpe |
| 8 | `checar-video` (curso-estilos) | a checagem técnica final, antes de postar |

## Por que tem uma trava de gasto
Duas etapas podem custar dinheiro: a voz e, se você não tiver placa de vídeo, a animação na nuvem. Num chat comprido é fácil gastar sem perceber. Por isso a `serie-nova` liga uma trava na pasta da série: antes de qualquer ação paga, o Claude para e pede a sua permissão. Ela só funciona com o Claude aberto **dentro da pasta da série**.

## O que precisa
- Windows com Python 3.10+, ffmpeg, Node e Git (a `checar-pc` confere).
- Claude Code, ChatGPT Plus (fichas e storyboard) e ElevenLabs (narração; o plano Starter já permite uso comercial).
- Pra animar no seu PC, de graça: placa NVIDIA de 12 GB e 64 GB de memória. Sem placa, a `animar-local` mostra as opções na nuvem, que são pagas.

## O que vem e o que não vem
- **Vem:** as skills, o código, os modelos de texto da série (regras, bíblia, livro-razão, roteiro), as fichas de exemplo do LUMEN (Nico, Iara e General, só como exemplo de ficha) e 3 efeitos de golpe de amostra.
- **Download à parte:** o pacote completo de efeitos de golpe (~1,4 GB). A skill `fx-golpe` explica.
- **Não vem:** programas e modelos de terceiros (ComfyUI, o modelo de animação, RIFE) e bibliotecas de som. Cada skill diz de onde baixar e qual a licença. Leia `LICENCAS.md`, principalmente a parte da licença do modelo de animação, antes de postar.
