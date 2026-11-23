# Pasta do curso de estilos de vídeo

Responda sempre em português do Brasil, em linguagem simples, como para quem está começando.

Esta pasta é o pacote do curso. Ela tem o plugin do Claude Code `curso-estilos` (os estilos de vídeo). O módulo `serie-lumen` não está neste repositório.

## Quando o aluno pedir para instalar ("instala o curso", "instala o plugin", "como eu instalo isso?")

O aluno quase sempre usa o app Claude no computador (aba **Code**). Faça a instalação por ele, explicando cada passo em uma frase simples.

1. **Ache o programa do Claude Code**, nesta ordem:
   - o comando `claude` no PATH (`claude --version`);
   - no Windows, o que vem dentro do app: `%APPDATA%\Claude\claude-code\<versão>\<pasta>\claude.exe`. Use a versão mais nova;
   - no Mac, o que vem dentro do app: `~/Library/Application Support/Claude/claude-code/<versão>/<pasta>/claude`. Use a versão mais nova.
2. **Registre esta pasta** como catálogo de plugins, usando o caminho absoluto dela:
   `<claude> plugin marketplace add "<caminho absoluto desta pasta>"`
3. **Instale o plugin:**
   `<claude> plugin install curso-estilos@doti-cursos`
4. **Peça para o aluno abrir uma conversa nova** (botão de nova sessão no app). O plugin só aparece em conversas abertas depois da instalação. Na conversa nova, ele pode pedir "quais estilos tem?".

Antes de rodar cada comando, diga ao aluno o que ele faz. Se a pasta estiver num lugar temporário (Downloads, área de trabalho cheia, pasta do ZIP ainda não extraída), sugira mover para um lugar fixo antes de instalar. Se a pasta mudar de lugar depois, o Claude perde o caminho e é preciso instalar de novo.

## Atualizar

Quando sair uma versão nova, o aluno extrai o ZIP novo por cima desta mesma pasta e pede "atualiza o plugin do curso". Rode `<claude> plugin marketplace update doti-cursos` e `<claude> plugin update curso-estilos@doti-cursos`. Depois peça uma conversa nova.
