---
name: serie-nova
description: "Monta a pasta de uma série nova de Reels de história com escolha nos comentários (no jeito da série LUMEN) e cria cada episódio novo. Use quando o aluno disser \"/serie-lumen:serie-nova\", \"começar uma série\", \"montar a pasta da série\", \"novo episódio\", \"ep novo\", ou quando outra skill do plugin reclamar que falta o kit.config.json. Faz as perguntas de configuração (caminhos deste PC), grava o kit.config.json, liga a trava de gasto e confere o que falta. NÃO use pra escrever roteiro (isso é a sala-roteiro) nem pra gerar imagem, voz ou vídeo."
---

Responda sempre em português do Brasil, em linguagem simples, como para quem está começando.

# serie-nova

Monta a casa da série. Tudo que muda de PC pra PC fica num arquivo só, o `kit.config.json`, e as outras skills leem dele. Assim o aluno configura uma vez e não repete caminho em cada etapa.

## Série nova
1. **Pergunte, uma coisa por vez, em linguagem simples:**
   - Nome da série e onde criar a pasta (ex.: `<sua pasta>/series/minha_serie`). Evite pasta dentro do OneDrive: ele tenta subir cada quadro e cada vídeo pra nuvem e pode prender arquivo no meio do trabalho.
   - Tem placa de vídeo NVIDIA com 12 GB ou mais? Se sim: onde está o ComfyUI portátil (a pasta que tem `python_embeded` e `ComfyUI`) e o RIFE (`rife-ncnn-vulkan`). Se ainda não instalou, deixe em branco: a skill `animar-local` explica.
   - Vozes da ElevenLabs: o id da voz do narrador e de cada personagem (o id fica no site da ElevenLabs, em cada voz). Pode deixar pra depois.
   - SFX: onde ficam os arquivos de golpe, subida, vento… (bibliotecas grátis: SJC SFX Pack e Sound Effect Lab). Opcional.
   - Trilha: um arquivo de música que o aluno tem direito de usar. Opcional.
   - **Não peça a chave da ElevenLabs na conversa.** A chave gasta o crédito dele, e o que entra na conversa fica no histórico. Ela vai no arquivo `.env` da série, que o próprio aluno edita; assim a chave nunca passa pelo chat.
2. Grave as respostas num JSON no formato do `kit.config.json` (só os campos respondidos), por exemplo `respostas.json`:
   ```json
   {"h3": {"comfyui_dir": "<pasta do ComfyUI>"}, "rife": {"dir": "<pasta do RIFE>"},
    "voz": {"vozes": {"narrador": "ID", "mestra": "ID"}}, "sfx": {"mapa": {"golpe": "<sua pasta>/sfx/golpe.wav"}}}
   ```
3. Monte:
   ```bash
   python ${CLAUDE_SKILL_DIR}/scripts/montar_serie.py nova --pasta "<sua pasta>/series/minha_serie" --nome "Minha Série" --respostas respostas.json
   ```
   Cria `CLAUDE.md`, `REGRAS.md` (regras-semente vindas da série LUMEN + Registro vazio), `BIBLIA.md`, `LIVRO_RAZAO.md`, `ESCRITA.md`, `fichas/`, `exemplo_lumen/`, `ep01/`, `kit.config.json`, `.env.exemplo` e a trava de gasto (`.claude/settings.json` + `.claude/hooks/trava_pago.py`). Não sobrescreve nada que já exista.
4. Confira:
   ```bash
   python ${CLAUDE_SKILL_DIR}/scripts/montar_serie.py verificar --pasta "<sua pasta>/series/minha_serie"
   ```
   Mostre a tabela ao aluno e explique só o que está FALTA. "Não configurado" e "opcional" podem esperar.
5. Diga a ele: **daqui pra frente, abra o Claude Code DENTRO da pasta da série.** A trava de gasto mora no `.claude/settings.json` dessa pasta, então só vale lá.
6. Próximo passo: a `/serie-lumen:sala-roteiro` pra preencher a `BIBLIA.md` e escrever o ep01.

## Episódio novo
```bash
python ${CLAUDE_SKILL_DIR}/scripts/montar_serie.py ep --pasta "<serie>"            # o próximo número livre
python ${CLAUDE_SKILL_DIR}/scripts/montar_serie.py ep --pasta "<serie>" --ep ep07   # um específico
```
Cria a estrutura do ep (`ROTEIRO.md`, `LEIA.md`, `linha_estimada.json`, `voz/falas.tsv`, `h3/clipes.json` e as pastas). Cada episódio é produzido numa conversa NOVA, aberta na pasta da série: conversa longa perde regras nos resumos automáticos, e conversa curta lê tudo inteiro.

## A trava de gasto
- Antes de ação em site que gasta crédito (sites de vídeo na nuvem, RunningHub, ElevenLabs, fal…) ou de comando de voz/API paga, o Claude Code pede "permitir" ao aluno.
- No navegador, o 1º "permitir" libera aquele site por 1 h na conversa. Voz e API perguntam toda vez.
- Página "…-unlimited" (modo ilimitado, 0 crédito) não pergunta.
- Pra pôr outro site pago na lista: editar `PAGOS` em `.claude/hooks/trava_pago.py`.
- Por que existe: num chat longo, o Claude pode gastar crédito num site pago mesmo com um modo grátis à mão, e regra escrita se perde quando a conversa cresce. O hook roda fora do modelo e segura sempre; assim nada pago acontece sem o clique do aluno.

## Fichas dos personagens
- Ponha cada ficha em `fichas/` e descreva no `fichas/fichas.json` (pontos que têm que bater, o que nunca pode, escala). O `revisor-quadros` confere cada quadro contra isso.
- Exemplo pronto em `exemplo_lumen/fichas.json` (Nico, Iara e General, da série LUMEN).
- Como fazer a ficha no ChatGPT:
  - chat novo, pra conversa antiga não puxar o estilo de outras imagens;
  - 1 imagem por pedido, que sai mais fiel e deixa refazer só a que errou;
  - personagem novo ou redesign = editar a figura da ficha (imagem 1), em vez de descrever do zero, porque do zero o gerador inventa outro rosto e outro traço;
  - anexe sempre a referência, pra ele copiar em vez de adivinhar.
