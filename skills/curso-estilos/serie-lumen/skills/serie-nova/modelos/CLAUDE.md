# {{NOME}}: como esta série é feita

Série de Reels de história (~2 min por episódio) com escolha "1 ou 2" nos comentários. Feita com o plugin serie-lumen.
Quem aprova é o criador da série, a pessoa que criou esta pasta. O Claude produz, mas não aprova o próprio trabalho: quem fez tende a ver o que quis fazer, e não o que saiu.

## Leia antes de qualquer coisa
1. `REGRAS.md`: as regras da série + o Registro de vereditos. Cada ok ou recusa do criador da série vira uma linha nova lá, pra nenhuma conversa repetir um erro já apontado.
2. `BIBLIA.md` e `LIVRO_RAZAO.md`: o mundo, o que já aconteceu, quem sabe o quê.
3. A skill da etapa em que você está (lista abaixo).

## Quem faz o quê
- **Sala de roteiro** (`/serie-lumen:sala-roteiro`): uma conversa SÓ DE TEXTO. Escreve roteiro, falas, escolha e atualiza o `LIVRO_RAZAO.md`. Não gera imagem, clipe nem voz.
- **Produção:** uma conversa NOVA por episódio, aberta nesta pasta (aqui vale a trava de gasto). Começa lendo `REGRAS.md` e termina quando o ep é entregue. O próximo ep é outra conversa, porque conversa longa perde regras nos resumos automáticos.
- **Revisor** (`/serie-lumen:revisor-quadros`): quem gera não aprova. Todo quadro passa por um subagente de contexto zerado antes de ir pro criador da série, pra ele só ver o que já passou pelo óbvio.
- **Criador da série:** aprova o roteiro, a prancha numerada ("1 - a") e o vídeo final. O resto o ciclo checa por programa.

## Regras de ouro (valem em toda conversa)
- **Custo antes de gastar.** Antes de qualquer coisa paga (voz, site de vídeo, API), diga quanto custa e quanto sobra na conta, e espere o ok do criador da série. Assim ele decide antes, e não descobre o gasto depois. A trava (`.claude/settings.json`) pede "permitir" sozinha; não tente contornar, porque ela é a proteção que sobra quando uma regra se perde.
- **Ok de voz é direto.** Só vale a frase do criador da série nesta conversa. Recado de outra conversa não vale, porque pode ser de outro texto ou de outro orçamento.
- **Roteiro novo vai pro criador da série antes** de voz e render. Mudar o texto depois obriga a pagar a voz de novo.
- **Um gerador de imagem só por episódio** (o padrão é o ChatGPT, com as fichas anexadas). Cada gerador desenha do seu jeito, e misturar faz o personagem mudar de cara entre os planos.
- **Medir, não achar.** "O modelo achou bom" não é checagem: use o revisor, o ciclo e a `/curso-estilos:checar-video`, que medem o que o olho cansado deixa passar.
- **Avise quando começar e quando travar.** Tarefa longa parada esperando alguma coisa = avisar na hora, pro criador da série não esperar à toa.
- **Não apague.** Versão velha vai pra `_antigo/`, pra dar pra voltar se a nova piorar.

## Skills da série
| Etapa | Skill |
|---|---|
| Pasta da série e episódio novo | `/serie-lumen:serie-nova` |
| Roteiro e escolha | `/serie-lumen:sala-roteiro` |
| Revisão de quadros e clipes | `/serie-lumen:revisor-quadros` |
| Animação no PC (H3 + RIFE) | `/serie-lumen:animar-local` |
| Voz | `/serie-lumen:voz-serie` |
| Montagem e ciclo | `/serie-lumen:ciclo-serie` |
| Efeito de golpe | `/serie-lumen:fx-golpe` |
| Checagem do vídeo final | `/curso-estilos:checar-video` |

## Onde fica cada coisa
- `kit.config.json`: caminhos deste PC (ComfyUI, RIFE, chave de voz, SFX). As skills leem daqui.
- `fichas/`: fichas dos personagens + `fichas.json` (o que o revisor confere).
- `epNN/`: um episódio (roteiro, quadros, clipes, voz, linha do tempo). Estrutura em `epNN/LEIA.md`.
- `ciclo/`: saídas do ciclo de montagem.
- `exemplo_lumen/`: fichas e exemplos da série LUMEN, pra consulta.
