# Rios voadores: como o som foi montado (filme de 63 s)

Serve de modelo para o seu `mix_conf.json`. Os números são os medidos na peça nossa.

- **Voz:** uma tomada só, 61,6 s, 1,0× (sem acelerar), normalizada a −16 LUFS. O visual foi retemporizado pela voz, sem apertar a fala.
- **Trilha:** uma faixa licenciada de biblioteca (não vem no pacote: use a sua).
  - Roda direto, sem emenda. O corte automático testado pulava do compasso 4 para o 44 com semelhança de 0,17, ou seja, um salto que se ouve.
  - Entra em 0,4 s. O drop da faixa (51,94 s no arquivo) cai em **52,34 s, no instante em que o mascote cai na caixa d'água**. Sai com rampa de 1,1 s depois da última palavra.
  - Nível: 11 dB abaixo da voz, com duck de 4 dB. Na peça houve ainda automação manual: −3 dB no trecho do mapa (42,5–47,5 s) e −6 dB depois do drop (52,3–61,2 s). Pior janela de 3 s com voz: 7,2 dB abaixo.
- **SFX:** nenhum. Os eventos fortes (trombada nos Andes em 42,8 s; pouso na caixa em 52,35 s) caem no meio da fala; na dúvida, menos. Cabe 1 splash real em 53,0–53,16 s.
- **Números finais:** master −13,3 LUFS · pico −1,6 dBTP · no alto-falante de celular −19,8 LUFS (queda de 6,5 dB) · transcrição do mix contra o roteiro: 100%.

O `mixar.mjs` do motor faz a parte básica (nível relativo, duck, rampas, loudness). A automação por trecho e o casamento do drop com o evento você ajusta em `inicio_no_arquivo_s` e `entra_t`, ou num editor de áudio.
