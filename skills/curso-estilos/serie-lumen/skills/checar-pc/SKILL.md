---
name: checar-pc
description: "Confere se o computador tem tudo que a série LUMEN (plugin serie-lumen) precisa e instala as bibliotecas de Python que faltarem, só com o ok do aluno. Use quando o aluno acabou de instalar o plugin, disser \"confere meu PC para a série\", \"o que falta instalar?\", ou quando outra skill do plugin reclamar de programa ou biblioteca que falta. NÃO use para configurar a série (isso é a serie-nova) nem para instalar o ComfyUI ou os modelos de animação (isso é a animar-local)."
---

Responda sempre em português do Brasil, em linguagem simples, como para quem está começando.

# checar-pc

Antes de montar a série, vale saber se o computador dá conta. Esta skill olha tudo de uma vez e diz o que falta, em vez de o aluno descobrir no meio de um episódio.

`${CLAUDE_SKILL_DIR}` é a pasta desta skill. Se a variável não vier resolvida, ache a pasta procurando `checar-pc/scripts/checar_pc.py` dentro de `~/.claude/plugins`.

## Passo a passo
1. Confira, sem mudar nada:
   ```bash
   python "${CLAUDE_SKILL_DIR}/scripts/checar_pc.py"
   ```
2. Explique ao aluno, em frases simples, só o que está como FALTA:
   - **Programas** (Python 3.10+, ffmpeg, Node, Git Bash): o script mostra onde baixar. Quem instala é o aluno. Espere ele voltar e confira de novo.
   - **Bibliotecas de Python**: são grátis e somam algumas centenas de MB. Diga isso e peça o ok.
     Recomende um ambiente separado (venv) pra elas: as bibliotecas da série ficam isoladas e não brigam com versões que outros programas do PC usam. Pra criar e ativar, numa pasta fixa (não na pasta da série, pra não ir junto se ela for copiada):
     ```bash
     python -m venv "<sua pasta>/venv_serie"
     source "<sua pasta>/venv_serie/Scripts/activate"   # Git Bash no Windows; no PowerShell: & "<sua pasta>\venv_serie\Scripts\Activate.ps1"
     ```
     Com o venv ativo (ou sem ele, se o aluno preferir) e com o ok:
     ```bash
     python "${CLAUDE_SKILL_DIR}/scripts/checar_pc.py" --instalar
     ```
   - **checar-video**: vem no plugin curso-estilos. Se faltar, oriente o aluno a abrir uma conversa na pasta do curso e pedir "instala o curso".
3. A placa de vídeo é informação, não bloqueio. Com uma NVIDIA de 12 GB ou mais, a animação roda no próprio PC, de graça. Sem ela, a skill `animar-local` explica as opções na nuvem, que são pagas.
4. Tudo ok? O próximo passo é `/serie-lumen:serie-nova`.

## Por que cada peça
| Peça | Pra quê |
|---|---|
| Python 3.10+ | roda todos os scripts do plugin |
| ffmpeg e ffprobe | cortam, juntam e medem vídeo e som |
| Node | conversa com a ElevenLabs, que gera a voz |
| Git Bash | roda os scripts de animação e de voz (o bash do WSL não serve: ele não enxerga as pastas do Windows do mesmo jeito) |
| numpy, pillow | contas de imagem e som |
| opencv-python | efeito de golpe que acompanha a tremida da câmera, e a checagem |
| faster-whisper | ouve a voz gerada, pra escolher a melhor tomada e conferir a fala |
| rapidocr-onnxruntime | lê o texto na tela, pra achar legenda escondida pela interface do Instagram |
| checar-video (do curso-estilos) | a checagem final do vídeo |

## Cuidados
- Nunca instale programa sem o aluno pedir. As bibliotecas de Python só com o ok dele.
- Na primeira vez que a voz é conferida, o faster-whisper baixa um modelo de ~500 MB, de graça. Avise antes.
