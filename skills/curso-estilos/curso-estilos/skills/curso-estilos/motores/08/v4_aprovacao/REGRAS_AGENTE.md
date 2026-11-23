# Rodada de notas: regras para o agente que implementa um vídeo

> Material de ensino: é o texto real que foi entregue aos agentes na rodada v3 → v4 da série. Adapte os caminhos ao seu projeto.

Contexto: o diretor assistiu os 7 vídeos da série v2 e gravou notas com o segundo do vídeo
(`notas_audio/TRANSCRICAO.md`). Cada vídeo tem um `SPEC.md` em `_v4/<video>/` com os itens numerados
(nota dele → o que muda). Você implementa SÓ o que o SPEC pede, deixando o resto idêntico.

## Antes de mexer
- Copie `projeto/src` para `projeto/_bak_v3_src` (ou o nome que o SPEC disser) se ainda não existir. Nunca apague nada.
- Leia o código das cenas envolvidas antes de editar. Os tempos vêm das palavras da voz (`T.ts`, `K.*`, `Q()` da grade).
- Não troque a voz, a música nem o mix, a não ser que o SPEC peça.
- NADA pago: sem ElevenLabs, sem API de imagem. Z-Image/ComfyUI local só se o SPEC pedir.
- Não renderize o vídeo final (isso só depois da aprovação do diretor). Só stills e, se o SPEC pedir, clipes curtos de prévia.

## Regras de ofício (da casa, valem para tudo)
- Mostrar só o que a voz explica, na ordem da fala. Nada de data/etimologia/palavra antiga que a voz não diz.
- Não misturar século com ano no mesmo quadro. Séculos em algarismo arábico ("século 16"), não romano: o diretor leu "XIV" como "X e V".
- Datas por extenso para quem assiste sem som ("2 de janeiro de 1921"), nunca "2.1.1921" ou "a 11 de 1921".
- O motion direciona o olhar: UMA coisa nova por vez; nada de 3 blocos de texto entrando juntos.
- Contraste: texto sempre legível (preto sobre faixa clara ou branco sobre escuro, nunca cinza claro sobre céu claro);
  texto nunca atrás de personagem. Corpo mínimo ~52 px em 1080 de largura (crédito de documento pode ser menor).
- Entradas: de trás de algo (da página, da carta) > bounce vindo de fora da tela. Traço que se desenha e preenche = "cringe".
- Câmera nunca parada, mas todo movimento tem destino (leva o olho aonde a próxima coisa vai acontecer).
- Sem destaque colorido de palavra (pílula, cor). Exceção aberta por ele: marca-texto amarelado em documento P&B.
- Sem tag "imagem gerada" na tela. Crédito só em documento/foto real, 1 linha discreta.
- Zona segura do Reels: texto essencial entre y 288 e 1248 (x 72–900 quando há UI lateral).

## Aprendido na 1ª página (Orange, resposta do diretor 21/10) — vale acima do SPEC
- Século: SEMPRE "séc." + algarismo arábico ("séc. 14", "séc. 16"). Nunca romano, nunca "século" por extenso.
- MUDANÇA MÍNIMA: onde a nota cita um detalhe, mexa só nele. Ex.: "fruta · séc. XIV" → bastava "fruta"; eu redesenhei o
  cartão inteiro e ele preferiu o original ("o card A é mais bonito, era só ter tirado o XIV"). Não tire o que ninguém pediu
  (ele perguntou por que o hex sumiu).
- "Informação jogada" = o dado não está LIGADO à fala. Antes de tirar, tente ligar: entrar na palavra certa e uma glosa curta
  que diga o que é. Ele voltou o tâmil e o Bonavia que eu tinha tirado. Tirar só quando a nota dele disser que não precisa.
  Se o SPEC manda tirar algo e você vê um jeito de ligar à fala, faça a versão ligada como opção c.
- Nada de efeito a mais (squash, pulso, tremida, rebote): "baita exemplo de OVER".
- Ação só depois que a entrada anterior ASSENTOU: "o N tá pulando enquanto as palavras estão surgindo".
- SFX: ele gostou, mas quer ~6 dB mais baixo que o que eu pus (−20 dB abaixo da voz no curto prazo, não −14).

## ComfyUI (Stable Audio 3 / Z-Image locais, grátis)
Uma tarefa de GPU por vez. Antes de subir, confira `curl -s http://127.0.0.1:8188/system_stats`. Se já estiver no ar,
use. Se não estiver, suba (no Windows: PYTHONUTF8=1 e PYTHONIOENCODING=utf-8, em background). Quem sobe, desliga no fim.
Um pedido por vez, sem lotes enormes.

## Stills para a página de aprovação
- Bundle: `npx remotion bundle src/index.ts --out-dir build` (dentro de `projeto/`). Depois stills com o script de
  conferência do projeto (ex.: `node chk.mjs <pasta> 0.5 12.3s 14s`) ou `npx remotion still build <Comp> --frame N --scale 0.5`.
- ATUAL: extraia do vídeo atual em `assistir/` com ffmpeg no MESMO instante
  (`ffmpeg -ss T -i video -frames:v 1 -vf scale=540:-1`).
- CORRIGIDO: still do projeto editado no instante equivalente (se o tempo mudou, o instante em que a mesma coisa acontece).
- Salve em `_v4/<video>/stills/` como `NN_a.jpg` (atual), `NN_b.jpg` (corrigido), `NN_c.jpg` (opção extra, se houver),
  540 px de largura. Se um item precisa de 2 momentos, use `NN_a1.jpg`, `NN_a2.jpg`, `NN_b1.jpg`, `NN_b2.jpg`.
- Escreva `_v4/<video>/itens.json`: lista de
  `{"n": 1, "tempo": "0:01", "nota": "<frase curta do diretor, literal>", "titulo": "...", "o_que_muda": "...",
    "imgs": {"a": ["01_a.jpg"], "b": ["01_b.jpg"], "c": []}, "clip": null}`
  `clip` = caminho de um mp4 curto (≤ 6 s, 540 px, com som) quando o item for de som/movimento.
- Confira cada still você mesmo (abra a imagem) antes de devolver: texto cortado, sobreposição, contraste.

## Ao terminar
Devolva: lista dos itens (n, o que mudou, arquivos tocados), o que NÃO conseguiu fazer e por quê, e qualquer dúvida
que precise do diretor. Não invente resultado: se algo não ficou bom, diga.
