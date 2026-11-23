# Extras: o fluxo narrado (voz primeiro, cortes na palavra)

Estes scripts vêm do repositório aberto `kelano86/what-if-animation` (MIT) e **não fazem parte do demo**. A peça do estilo 74 é muda e tem os cortes escritos à mão. Eles ficam aqui para quem quiser narrar: a voz vem primeiro e os cortes passam a cair na palavra.

**Atenção:** eles trabalham com o formato de episódio daquele repositório (`src/episodes/<slug>/episode.json` com `script`, `shots`, `edit`, `sound`, e a composição montada por `src/engine/episode.tsx`). O episódio `insone` deste motor não tem esse arquivo. Para usar, crie um episódio novo nesse formato (o repositório de origem traz exemplos e a documentação dos campos).

Rode sempre de dentro da pasta do motor (a que tem `package.json`):

| Script | O que faz | Gasta? |
|---|---|---|
| `voz_kokoro.py <slug>` | Voz local (kokoro-onnx) + tempo de cada palavra (faster-whisper). Grava o mesmo cache que o `voice.py` usa. | Não |
| `voice.py <slug> --confirmo-custo` | Voz na ElevenLabs com tempo por caractere; depois aperta as pausas. Se o cache já existe (texto e voz iguais), não chama a API. | **Sim** |
| `plan.py <slug>` | Resolve os cortes na palavra (2 quadros antes), grava `timeline.json` e imprime o ritmo (cortes/min, plano parado demais). | Não |
| `stills_episodio.mjs <slug>` + `board.py <slug>` | Prancha: um quadro por plano numa folha. | Não |
| `sfx.py <slug> --dry` | Lista os efeitos que faltam na sua biblioteca. | Não |
| `sfx.py <slug> --confirmo-custo` | Gera os efeitos que faltam na ElevenLabs e monta a faixa. | **Sim** |
| `mixcheck.py <slug>` | Lista os momentos em que efeito ou música chegam a 3 dB da voz enquanto ela fala. | Não |
| `motiongrid.py <slug>` | Folha de quadros por plano, para ler movimento. | Não |
| `master.py <slug>` | Render + normalização para -14 LUFS. | Não |

## Regras dos scripts pagos
- A chave é **sua**, lida só da variável de ambiente `ELEVENLABS_API_KEY`. Nenhum arquivo `.env` é procurado. Nunca escreva a chave dentro de um arquivo do projeto.
- Sem `--confirmo-custo` o script para antes de qualquer chamada e avisa.
- Estimativa para você se planejar (confira a tabela atual da ElevenLabs, ela muda): a narração de um episódio de 20 s tem ~300 caracteres; um de 35 s, ~550. O custo em créditos depende do modelo de voz. Cada efeito sonoro gerado custa créditos por segundo de áudio, e ambiência longa é o que mais pesa: gere curto e reaproveite. Todo áudio fica em cache por nome + texto + duração, então o mesmo clipe nunca é pago duas vezes.
- O plano grátis da ElevenLabs costuma ser de uso não comercial e pedir crédito; leia os termos da sua conta antes de postar.

## Dependências (só destes extras)
`pip install numpy pillow soundfile kokoro-onnx faster-whisper` e FFmpeg no PATH. O `master.py` chama o `npx remotion render` do próprio Remotion, que pode baixar um navegador próprio (~110 MB) na primeira vez; para evitar, renderize com `npm run filme` e rode `master.py <slug> --skip-render`.
