# Demo do estilo 100 · série com voto nos comentários

Pré-requisitos: Node 22 ou mais novo e FFmpeg no PATH. Trabalhe numa CÓPIA desta pasta.

```
node gerar_cues.mjs --demo 8 && npx -y hyperframes@0.8.162 render -q draft -o renders/demo.mp4
```

Sai `renders/demo.mp4`: 8 s mudos, 1080×1920, 30 qps, yuv420p. A folha "30 dias" na parede, a câmera abrindo para o quarto e a notificação chegando.

Tempo esperado: a primeira vez baixa o HyperFrames e o navegador dele (alguns minutos); depois, menos de 1 minuto. Não precisa de placa de vídeo.

O outro estilo: troque o conteúdo de `estilo.js` para `window.ESTILO = 'kurz';` e rode de novo.

O episódio de exemplo inteiro, com a voz e os efeitos que já vêm na pasta (não gasta nada; precisa de Python com numpy e de bash):

```
bash audio/versao.sh A luz
bash audio/versao.sh A kurz
```

Saem `renders/ep_luz_vozA.mp4`, `renders/ep_kurz_vozA.mp4` e as versões `_celular` (72,7 s).

Para voltar ao episódio inteiro sem voz: `node gerar_cues.mjs`.
