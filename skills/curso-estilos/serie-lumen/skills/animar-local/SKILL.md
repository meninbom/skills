---
name: animar-local
description: "Anima os quadros revisados da série no H3 (MiniMax) pelo ComfyUI do próprio PC, um plano por vez, e passa cada clipe pra 60 qps no RIFE. Use quando o aluno pedir \"anima os quadros\", \"roda o H3\", \"faz os clipes do ep\", \"refaz o clipe do P07\", ou pra conferir a instalação (\"o H3 tá pronto?\", modo --seco). Também explica as opções sem placa de vídeo (sites na nuvem, RunningHub). NÃO use pra gerar ou editar imagem (isso é no ChatGPT), pra julgar se o clipe derivou (isso é a revisor-quadros) nem pra montar o vídeo (isso é a ciclo-serie)."
---

Responda sempre em português do Brasil, em linguagem simples, como para quem está começando.

# animar-local

O H3 pega a placa (o quadro do storyboard) e devolve um clipe de 2 a 5 s com movimento, sem redesenhar o personagem.
Roda de graça na placa de vídeo do aluno. É lento: um plano por vez, com a GPU só pra ele.

Scripts em `${CLAUDE_SKILL_DIR}/scripts/`. Tudo que muda de PC pra PC vem do `kit.config.json` da série.

## O que precisa (medido na série LUMEN)
- **Placa NVIDIA com 12 GB.** O H3 usa ~11,5 GB de memória de vídeo.
- **~30 GB de RAM livre na hora.** Na prática, PC com 64 GB. Feche jogo, navegador pesado e render antes.
- **Disco:** ~42 GB só dos pesos do H3.
- **Tempo:** ~5,5–6 min por clipe de 2–4 s. 5 s ≈ 14 min. 10 s passa de 45 min. O tempo cresce mais rápido que a duração: prefira clipes curtos.

Sem essa placa? Veja "Sem placa de vídeo" no fim.

## Instalar (uma vez)
1. **ComfyUI portátil (Windows, NVIDIA).** Baixe na página de releases do GitHub do ComfyUI (`github.com/comfyanonymous/ComfyUI`, arquivo "portable" pra NVIDIA). Descompacte numa pasta de nome curto e sem espaço (ex.: `<sua pasta>/IA/ComfyUI`). Use a versão mais nova: os nós do H3 vêm no ComfyUI recente.
2. **Pesos do H3 (~42 GB).** Abra o ComfyUI uma vez (`run_nvidia_gpu.bat`), vá em **Templates** e procure o template oficial do **MiniMax H3 imagem para vídeo**. Ele mostra os modelos que faltam e baixa cada um na pasta certa. O nome exato do template e dos arquivos você confere na tela do ComfyUI. São 4 arquivos:
   - o modelo (vai em `models/diffusion_models`);
   - o codificador de texto (vai em `models/text_encoders`);
   - o VAE de vídeo e o VAE de áudio (vão em `models/vae`).
   Se o template trouxer uma LoRA "turbo" de 4 passos, tudo bem. O plugin não usa: roda o H3 completo, 20 passos, sem LoRA.
   Depois feche o ComfyUI. Daqui pra frente, quem liga e desliga é o `h3_um.sh`.
3. **RIFE (60 qps).** Baixe o `rife-ncnn-vulkan` no GitHub do autor (`github.com/nihui/rife-ncnn-vulkan`, licença MIT), na página de releases, o zip pra Windows. Descompacte. O modelo `rife-v4.6` vem dentro.
4. **Config.** No `kit.config.json` da série (a `/serie-lumen:serie-nova` pergunta):
   - `h3.comfyui_dir`: a pasta do ComfyUI portátil (a que tem `python_embeded` e `ComfyUI`);
   - `h3.comfyui_url`: `http://127.0.0.1:8188`;
   - `h3.pesos`: os 4 nomes de arquivo, iguais aos da pasta `models`. Se o template baixou com outro nome, troque aqui;
   - `rife.dir` e `rife.modelo` (`rife-v4.6`);
   - `gpu.trava` (padrão `{serie}/.gpu.lock`) e `gpu.antes_de_subir` (opcional, ver "A GPU").
5. **Confira sem gastar nada:**
   ```bash
   bash ${CLAUDE_SKILL_DIR}/scripts/h3_um.sh <ep>/h3 P01 --seco
   ```
   Ele diz o que falta (ComfyUI, pesos, RIFE, placa) e o que faria, sem subir nada e sem usar a GPU.

## Fluxo de um episódio
1. **Quadros revisados** em `<ep>/gpt/<PLANO>.png` (passaram na `/serie-lumen:revisor-quadros` e o aluno deu ok).
2. **Placas:**
   ```bash
   python ${CLAUDE_SKILL_DIR}/scripts/placa.py <ep>            # faz as que faltam
   python ${CLAUDE_SKILL_DIR}/scripts/placa.py <ep> P07         # refaz uma (a antiga vai pra _antigo/)
   ```
   Recorte central em 768x1344. Se ele avisar que cortou muito, confira se ninguém saiu do quadro.
3. **Prompts** em `<ep>/h3/clipes.json`:
   ```json
   {"P01": {"prompt": "...", "q": 73, "quem": "nico"},
    "P02": {"prompt": "...", "q": 49, "quem": "nico iara"}}
   ```
   - `q` = quadros a 24 qps: 49 ≈ 2 s, 73 ≈ 3 s, 97 ≈ 4 s, 124 ≈ 5 s.
   - `quem` = quem aparece NO QUADRO (não no episódio). É dele que sai a frase de "manter".
   - `seed` (opcional) = trava a semente. Sem ela, cada tentativa usa outra (1, 2, 3).
4. **Rodar o ep inteiro**, um por vez:
   ```bash
   bash ${CLAUDE_SKILL_DIR}/scripts/rodar_ep.sh <ep> --seco    # lista e confere
   bash ${CLAUDE_SKILL_DIR}/scripts/rodar_ep.sh <ep>           # roda (horas)
   ```
   Roda todo plano que tem placa e ainda não tem `clips60`. Pra parar no próximo plano: crie o arquivo `<ep>/h3/PARAR`.
   Um plano só: `bash ${CLAUDE_SKILL_DIR}/scripts/h3_um.sh <ep>/h3 P07`.
   Rode em segundo plano. Avise o aluno quando começar, e de novo se travar ou parar: são horas de GPU, e ele precisa saber se o PC está ocupado ou se o trabalho parou.
5. **Saídas:** `h3/clips/<PLANO>.mp4` (24 qps, com o som do H3) e `h3/clips60/<PLANO>.mp4` (60 qps, mudo, crf 14, yuv420p). A série usa a voz da ElevenLabs. O som do H3 fica de reserva.
6. **Deriva:** antes de aceitar o clipe, rode a folha de deriva da `/serie-lumen:revisor-quadros` (`deriva.py <ep>/h3 P01 ...`) e mande pro revisor.
7. **Clipe recusado:** mova `clips/<PLANO>.mp4` e `clips60/<PLANO>.mp4` pra `h3/_reprovados/` (não apague: um trecho limpo dele pode virar reserva). Simplifique o prompt e rode de novo. A semente muda sozinha.

## Regras de prompt (cada uma evita um clipe perdido)
Escreva em inglês. Monte assim: **estilo do lugar** + **manter (só quem está no quadro)** + "Only the characters already visible in the first frame appear; nobody new enters the shot." + **uma ação** + fecho ("No text, no subtitles, no new objects, no extra characters.").

- **Só quem está no quadro.** Use o campo `quem`. Uma frase genérica citando os três personagens fez o H3 inventar gente: uma moça de estúdio, um cavaleiro, a cabeça do herói virando o capacete do vilão.
- **Evite frase negativa citando o defeito.** A palavra puxa a coisa. "No glowing visor" acendeu o visor. Descreva o certo: "the helmet stays dark inside, as in the first frame".
- **Estilo do lugar, não um estilo fixo pra tudo.** A frase de estilo com "floresta" pôs floresta na janela de um quarto. Cada lugar tem a sua frase de estilo e o seu som ambiente.
- **Uma ação simples por clipe.** 2 a 4 s, um gesto. O H3 leva ao pé da letra palavra técnica (pôs um tripé no quadro) e faz objeto surgir na mão.
- **Sempre a frase de manter o desenho** (é ela que segura o personagem igual ao quadro): "Keep the exact art style, character design, faces, clothes, proportions, framing and colors of the first frame."
- **Clipe do tamanho da cena.** Com tempo sobrando, o H3 inventa falatório com a boca mexendo.

Exemplo (P01, quem = "boy"):
```
Vertical 9:16 soft stylized 3D clay animation, matte plasticine materials, a dark misty forest with cold light. Keep the exact art style, character design, faces, clothes, proportions, framing and colors of the first frame. The small boy keeps small solid black dot eyes. Only the characters already visible in the first frame appear; nobody new enters the shot. The small boy slowly lowers his bow and looks up, scared; leaves fall. Smooth natural character animation, subtle camera motion. No text, no subtitles, no new objects, no extra characters.
```

## Outro modelo de vídeo? Teste de deriva antes
Na série LUMEN, quatro modelos "mais rápidos" redesenharam os personagens no primeiro meio segundo: o traço da série virou cara de animação 3D genérica. O H3 segura o desenho.
Antes de usar qualquer outro modelo: um quadro difícil, a folha de deriva (entrada × 0,1 s × meio × fim) e o olho do aluno. Passou nos dois? Aí entra. Assim a deriva aparece num clipe de teste, e não no episódio inteiro.

## 3 tentativas, depois reserva
- Cada clipe gerado conta uma tentativa (`h3/tentativas/<PLANO>.txt`). Cada uma leva minutos de GPU: se três sementes falharam, mude o prompt ou use a reserva em vez de insistir.
- Na 4ª, o `h3_um.sh` recusa (só roda com `--forcar`) e o `rodar_ep.sh` pula.
- **Reserva:** a placa parada com aproximação lenta (o ciclo faz) ou um trecho limpo de uma das tentativas. Mostre as 3 ao aluno lado a lado e deixe ele escolher.

## A GPU
- **Quem sobe o ComfyUI desliga.** O `h3_um.sh` desliga logo depois do clipe, mesmo se der erro. Parado, o ComfyUI segura memória e trava o PC.
- **Um por vez.** A trava (`gpu.trava`) é uma pasta: quem cria primeiro usa a GPU. As outras esperam.
- **ComfyUI de outro no ar?** O script não usa e não derruba. Espera desligar.
- **`gpu.antes_de_subir`** (opcional): um comando que dá certo (exit 0) quando a GPU está livre. O script espera ele liberar antes de subir. Exemplo, pra não rodar com um jogo aberto: `! tasklist | grep -qi meujogo.exe`.
- Sobe com `--disable-pinned-memory` (menos RAM presa) e `PYTHONUTF8=1`.

## Sem placa de vídeo
Antes de qualquer coisa paga: a trava de gasto da série pede "permitir", e o Claude diz o custo e quanto sobra na conta. **Confira o preço do dia** no site: os números abaixo são de quando a série mediu.

- **Sites que rodam o H3 na nuvem.** Existem dois jeitos de cobrar:
  - **Plano "ilimitado":** não gasta crédito por vídeo, mas tem fila. Medido: de minutos a horas (até 7 h, pior à noite), uma tarefa por vez. Bom pra teste sem prazo.
  - **Por segundo de vídeo:** pronto em poucos minutos e aceita várias tarefas. Medido: ~100 créditos por segundo em 768P (5 s = 500 créditos).
  - **Sempre:** proporção **9:16** fixa (no "automático" o clipe pode sair deitado ou dar erro) e resolução **768P** (a mais alta custa mais e não melhora o Reel). Suba a placa e diga no pedido que ela é o primeiro quadro do vídeo.
- **RunningHub (o mesmo grafo, GPU alugada).** ~US$ 0,34 por clipe de 10 s (22,6 min na máquina Plus, medido em out/2026). Cobra a GPU por hora, da carteira.
- **Depois:** salve o clipe em `<ep>/h3/clips/<PLANO>.mp4` e rode o `h3_um.sh` do plano. Ele vê o clipe pronto e faz só o RIFE. O RIFE roda em placa de vídeo comum (Vulkan).

## Licença do H3
Conferida em nov/2026 no LICENSE e no Q&A da licença do Hugging Face da MiniMax (MiniMaxAI/MiniMax-H3). Leia o original antes de decidir. Detalhes em `LICENCAS.md` na raiz do plugin.
- **Uso comercial:** liberado até US$ 20 milhões por ano de receita. Acima disso, autorização escrita. (O H3-Image, de imagem, tem outra licença, com limite de US$ 1 milhão.)
- **Territórios:** EUA, União Europeia, Reino Unido e Coreia do Sul ficam fora da licença dos pesos.
- **O vídeo gerado:** a licença proíbe usar, distribuir ou **exibir** a saída fora do território dela, ou seja, justamente nesses quatro lugares. O Reel é visto no mundo todo. A licença não fala de rede social e não achamos caso de cobrança; o risco real é a MiniMax encerrar a licença. A decisão é do aluno.
- **Sem essa dúvida:** a API oficial da MiniMax (paga), que o Q&A diz valer no mundo todo.
- **O vídeo é do aluno** (a MiniMax não reivindica direito), e a responsabilidade também.
- **Marque como IA ao postar:** o anexo de uso aceitável pede, e o Instagram também.

## Problemas comuns
- **"o ComfyUI não subiu em 5 min":** leia `<ep>/h3/comfy_h3.log`. Falta de memória aparece lá.
- **"não enxerga o peso":** o nome em `h3.pesos` não bate com o arquivo em `models/`. Copie o nome exato.
- **Ficou travado esperando a trava:** veja quem está nela em `<trava>/quem.txt`. Se ninguém está rodando (PC reiniciou no meio), apague a pasta da trava.
- **Clipe sem som em `clips60`:** é assim mesmo. O som do H3 fica em `clips/`.
