# {{EP}}: o que vai em cada pasta

Ordem do trabalho (cada passo tem a sua skill):
1. `ROTEIRO.md` — escrito na `/serie-lumen:sala-roteiro`, com o seu ok.
2. `gpt/<PLANO>.png` — um quadro por plano, feito no ChatGPT com as fichas anexadas (um gerador só no ep inteiro, pro personagem não mudar de cara).
3. `revisao/` — `/serie-lumen:revisor-quadros` (preparar → revisores → juntar). Sai `revisao/veredito.json`.
4. Prancha numerada pra você ("1 - a"). Só segue o que você escolheu.
5. `h3/placas/` → `h3/clips/` → `h3/clips60/` — `/serie-lumen:animar-local` (prompt de cada plano em `h3/clipes.json`). Depois, `/serie-lumen:revisor-quadros` com a folha de deriva.
6. `voz/` — `/serie-lumen:voz-serie`: `falas.tsv` → orçar → seu ok (`OK_GASTO_VOZ.txt`) → gerar → escolher tomadas.
7. `linha_estimada.json` → `linha_voz.json` → vídeo — `/serie-lumen:ciclo-serie`.
8. Efeito de golpe onde precisar — `/serie-lumen:fx-golpe`.
9. `/curso-estilos:checar-video` no final, entrega e post.

```
{{EP}}/
  ROTEIRO.md
  linha_estimada.json      planos com "ancora" (ver o formato na skill ciclo-serie)
  gpt/                     quadros do storyboard (nome do arquivo = nome do plano)
  revisao/                 entrada.json, zoom/, parte_*.json, veredito.json, REVISAO.md
  h3/clipes.json           {"P01": {"prompt": "...", "q": 97, "quem": "nico"}}
  h3/placas/ h3/clips/ h3/clips60/ h3/deriva/
  voz/falas.tsv            a locução na ordem (id, papel, parâmetros, texto)
  voz/pecas/               os áudios gerados (cada tomada)
  voz/escolha.json         a tomada escolhida de cada fala
  voz/OK_GASTO_VOZ.txt      a sua frase de ok (sem isso, nada pago roda)
  scripts/                 (opcional) montar.py/mixar.py próprios deste ep
```
