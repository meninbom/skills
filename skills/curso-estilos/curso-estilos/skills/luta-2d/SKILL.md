---
name: luta-2d
description: "Estilo #luta do curso, Luta 2D em código - luta de perfil entre dois bonecos 2D, coreografada por chaves: antecipação, golpe em 3 quadros, congelamento no acerto, tremida, poeira e impact frame. Use quando o aluno pedir \"estilo #luta\", \"luta 2D\", \"cena de luta\", \"briga de boneco\", \"luta em código\". NÃO use para pôr um efeito num vídeo pronto (isso é o #27) nem para o quadro de impacto sozinho numa cena 3D (isso é o #impact)."
---

Responda sempre em português do Brasil, em linguagem simples, como para quem está começando.

# #luta · Luta 2D em código

Luta de perfil entre dois bonecos 2D, coreografada por chaves: antecipação, golpe em 3 quadros, congelamento no acerto, tremida, poeira e impact frame.

Marca no catálogo: **v1 (receita completa)**. Custo: grátis.

Esta skill é a porta de entrada do estilo. A receita e o código ficam na skill mestre do plugin, e os caminhos abaixo partem da pasta deste arquivo (`${CLAUDE_SKILL_DIR}`):

- **Receita (leia inteira antes de produzir):** `../curso-estilos/estilos/luta_luta_2d.md`
- **Motor (código):** `../curso-estilos/motores/luta/`, com o demo em `DEMO.md`
- **Prévia de 15 s:** `../curso-estilos/catalogo/previas/luta.mp4`

## Fluxo

1. **Conferir o PC para este estilo.** Só lê, não instala nada:
   ```
   node "${CLAUDE_SKILL_DIR}/../curso-estilos/scripts/checar_pc.mjs"
   node "${CLAUDE_SKILL_DIR}/../curso-estilos/scripts/catalogo.mjs" --estilo luta
   ```
   O segundo comando diz se o estilo roda neste PC e o que falta.
2. **Instalar só o que falta**, um item por vez, dizendo o que é, o tamanho e de onde vem, e só com o ok do aluno.
3. **Demo de poucos segundos.** Copie `../curso-estilos/motores/luta/` para uma pasta nova do projeto do aluno (nunca edite dentro da pasta do plugin) e rode o comando do `DEMO.md`. Ele prova que o ambiente está de pé antes de trocar o conteúdo.
4. **Ler o ofício antes do roteiro:** `../curso-estilos/OFICIO.md` (roteiro, câmera, voz, som e entrega, com os números e o porquê de cada um). Leia de novo a seção 4 antes da mixagem.
5. **Pedir o tema do aluno** (assunto, personagem, tom, duração) e **propor 3 ideias bem diferentes** antes de escrever, cada uma em 2 linhas. Passe cada uma pelo teste do genérico: se dá para trocar o assunto e a animação continuar a mesma, a ideia é genérica. O estilo é recriado com o tema dele: a peça de exemplo ensina o ofício, não é para copiar.
6. **Roteiro em texto corrido, aprovado antes de produzir.** Cada fato com 2 fontes anotadas. Pedido ao espectador (seguir, comentar) só com motivo real dentro da história.
7. **Seguir o "Passo a passo" da receita**, na cópia.
8. **Aprovar por quadros antes do render completo:** mostre uma folha de 6 a 9 quadros numerados para o aluno aprovar ou apontar pelo número; depois renderize só o trecho mais difícil (uns 5 s); só então o vídeo inteiro. Corrigir um quadro custa segundos, e corrigir depois do render custa o render.
9. **Nunca grave por cima de uma versão.** Cada versão ganha nome novo (`v2`, `v3`) e a antiga vai para `_antigo/`.
10. **Nada pago sem custo e ok.** Voz ou qualquer serviço pago: diga o custo estimado antes e espere o sim. Sem resposta, entregue mudo.
11. **Conferir com a skill `checar-video`** e entregar o MP4 (1080×1920, `yuv420p`) e a versão leve de celular.

Não abra nem toque mídia com som no PC do aluno sem ele pedir. As regras gerais do curso estão na skill mestre `curso-estilos`.
