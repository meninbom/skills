---
name: 34-floresta-lowpoly
description: "Estilo #34 do curso, Boneco 3D chapado em floresta low-poly - boneco 3D chapado em 2 tons correndo por uma floresta low-poly com luz de cinema: sol baixo, névoa, desfoque, bloom e grão. Use quando o aluno pedir \"estilo #34\", \"o 34\", \"floresta low-poly\", \"boneco 3D chapado\", \"cena 3D em código\", \"mata low-poly\", \"primeira cena 3D\". NÃO use para herói 3D realista a partir de arte de conceito (isso é o #35)."
---

Responda sempre em português do Brasil, em linguagem simples, como para quem está começando.

# #34 · Boneco 3D chapado em floresta low-poly

Boneco 3D chapado em 2 tons correndo por uma floresta low-poly com luz de cinema: sol baixo, névoa, desfoque, bloom e grão.

Marca no catálogo: **v1 (receita completa)**. Custo: grátis.

Esta skill é a porta de entrada do estilo. A receita e o código ficam na skill mestre do plugin, e os caminhos abaixo partem da pasta deste arquivo (`${CLAUDE_SKILL_DIR}`):

- **Receita (leia inteira antes de produzir):** `../curso-estilos/estilos/34_floresta_lowpoly.md`
- **Motor (código):** `../curso-estilos/motores/34/`, com o demo em `DEMO.md`
- **Prévia de 15 s:** `../curso-estilos/catalogo/previas/34_orig.mp4`


## Imagens geradas (`codex-image`)

Quando este estilo precisar de imagens geradas, use a skill `codex-image` (guia: `../curso-estilos/CODEX_IMAGE.md`). Comando:

```bash
python3 ~/.agents/skills/codex-image/scripts/codex_image.py "<brief in English>" -o assets/nome.png --aspect 1:1 --crop
```

Salve em `assets/` do projeto (ou no caminho que a receita pede) e continue o pipeline do estilo. Sem chave de API e sem API paga. Só se for fazer texturas novas; o motor já traz as de exemplo.

## Fluxo

1. **Conferir o PC para este estilo.** Só lê, não instala nada:
   ```
   node "${CLAUDE_SKILL_DIR}/../curso-estilos/scripts/checar_pc.mjs"
   node "${CLAUDE_SKILL_DIR}/../curso-estilos/scripts/catalogo.mjs" --estilo 34
   ```
   O segundo comando diz se o estilo roda neste PC e o que falta.
2. **Instalar só o que falta**, um item por vez, dizendo o que é, o tamanho e de onde vem, e só com o ok do aluno.
3. **Demo de poucos segundos.** Copie `../curso-estilos/motores/34/` para uma pasta nova do projeto do aluno (nunca edite dentro da pasta do plugin) e rode o comando do `DEMO.md`. Ele prova que o ambiente está de pé antes de trocar o conteúdo.
4. **Ler o ofício antes do roteiro:** `../curso-estilos/OFICIO.md` (roteiro, câmera, voz, som e entrega, com os números e o porquê de cada um). Leia de novo a seção 4 antes da mixagem.
5. **Pedir o tema do aluno** (assunto, personagem, tom, duração) e **propor 3 ideias bem diferentes** antes de escrever, cada uma em 2 linhas. Passe cada uma pelo teste do genérico: se dá para trocar o assunto e a animação continuar a mesma, a ideia é genérica. O estilo é recriado com o tema dele: a peça de exemplo ensina o ofício, não é para copiar.
6. **Roteiro em texto corrido, aprovado antes de produzir.** Cada fato com 2 fontes anotadas. Pedido ao espectador (seguir, comentar) só com motivo real dentro da história.
7. **Seguir o "Passo a passo" da receita**, na cópia.
8. **Aprovar por quadros antes do render completo:** mostre uma folha de 6 a 9 quadros numerados para o aluno aprovar ou apontar pelo número; depois renderize só o trecho mais difícil (uns 5 s); só então o vídeo inteiro. Corrigir um quadro custa segundos, e corrigir depois do render custa o render.
9. **Nunca grave por cima de uma versão.** Cada versão ganha nome novo (`v2`, `v3`) e a antiga vai para `_antigo/`.
10. **Nada pago sem custo e ok.** Voz ou qualquer serviço pago: diga o custo estimado antes e espere o sim. Sem resposta, entregue mudo.
11. **Conferir com a skill `checar-video`** e entregar o MP4 (1080×1920, `yuv420p`) e a versão leve de celular.

Não abra nem toque mídia com som no PC do aluno sem ele pedir. As regras gerais do curso estão na skill mestre `curso-estilos`.
