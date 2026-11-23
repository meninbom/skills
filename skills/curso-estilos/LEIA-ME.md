# Curso de estilos — instalação

Você precisa do app **Claude** no computador, com a aba **Code**. O resto, o próprio Claude confere e te pergunta antes de instalar.

## Instalar (primeira vez)

1. **Extraia o ZIP** numa pasta que você não vai apagar nem mover, por exemplo `Documentos\Cursos\curso-estilos`. Dentro dela aparecem este arquivo, o `CLAUDE.md` e a pasta `curso-estilos`.
2. **Abra o app Claude**, vá na aba **Code** e comece uma conversa nova escolhendo **esta pasta** como a pasta do projeto.
3. Escreva: **instala o curso**. O Claude encontra o que precisa, te explica cada passo e pede a sua permissão antes de rodar cada comando. É só aprovar.
4. Quando ele terminar, **abra uma conversa nova** (de qualquer pasta). O plugin só aparece nas conversas abertas depois da instalação.
5. Na conversa nova, peça: **quais estilos tem?** Cada estilo tem um código, o mesmo do e-book (por exemplo `#25`): é por ele que você escolhe. Cada estilo também é uma skill com o código no nome: digitando `/25` você acha a do `#25`. Para replicar um vídeo de referência: **replica esse vídeo** e passe o arquivo.

O `curso-estilos` é o curso: catálogo com 28 estilos, Replicar e checagem do vídeo. O módulo `serie-lumen` não está neste repositório.

## Atualizar quando sair um ZIP novo

1. Extraia o ZIP novo **por cima da mesma pasta** (substituindo os arquivos).
2. Abra uma conversa na pasta do curso e peça: **atualiza o plugin do curso**.
3. Abra uma conversa nova.

Os estilos que você aprendeu com o Replicar e a checagem do seu PC ficam em `~/.curso-estilos` (a pasta `.curso-estilos` dentro da sua pasta de usuário) e não são apagados na atualização. Para guardar em outro lugar, defina a variável de ambiente `CURSO_ESTILOS_DADOS` com a pasta que você quer, antes de abrir o Claude Code.
