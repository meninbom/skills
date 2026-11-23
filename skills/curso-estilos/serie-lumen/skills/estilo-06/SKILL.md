---
name: estilo-06
description: "Receita completa e motor do estilo 06, a série isekai em massinha com escolha nos comentários (o estilo da série LUMEN) - quadros no gerador de imagem, animação local, voz, montagem em código, capa e ciclo de checagem. Use quando o aluno pedir \"estilo 06\", \"série em massinha\", \"isekai de massinha\", \"quero ver a receita do LUMEN\", ou quiser rodar o demo do motor da série."
---

Responda sempre em português do Brasil, em linguagem simples, como para quem está começando.

# estilo-06 · Série isekai em massinha com escolha

Esta skill guarda a receita de ponta a ponta do estilo e o motor original dele. As outras skills deste plugin (`serie-nova`, `sala-roteiro`, `revisor-quadros`, `animar-local`, `voz-serie`, `ciclo-serie`, `fx-golpe`) são o caminho guiado, etapa por etapa; aqui fica a visão inteira, com as pegadinhas medidas, o custo e o roteiro de aula.

Tudo fica na pasta deste arquivo (`${CLAUDE_SKILL_DIR}`):

- `receita.md`: leia inteira antes de produzir. Os caminhos dela partem desta pasta.
- `motor/`: o código (montagem, mix, voz, capa, animação local, ciclo) e os textos da série. Trabalhe sempre numa CÓPIA, na pasta do projeto do aluno.
- `motor/DEMO.md`: o demo de um comando (`python demo.py`, só CPU, ~1 min, não gasta nada).
- `previa/06.mp4` e `previa/06.jpg`: a prévia do estilo (muda).

## Como usar

1. Rode o demo para provar que o ambiente está de pé: copie `motor/` para a pasta do projeto, `pip install -r requirements.txt` (com o ok do aluno) e `python demo.py`.
2. Para uma série nova, siga o caminho guiado do plugin, começando por `checar-pc` e `serie-nova`. Use a `receita.md` como referência do porquê de cada etapa.
3. O estilo é **avançado**: animar no PC pede placa de vídeo de 12 GB ou mais e o ComfyUI. Diga isso ao aluno antes de começar.

## Regras

- Nada pago sem mostrar o custo e esperar o ok do aluno. A voz é a única parte paga da receita.
- Nunca apague arquivo do aluno: versão velha vai para `_antigo/`.
- Não abra nem toque mídia com som.
- A checagem final usa a skill `checar-video`, que vem no plugin `curso-estilos` do mesmo pacote.
