# Kit dos 99 estilos: os nossos ajustes e o porquê de cada um

Fizemos 99 filmes com a biblioteca, um por estilo. Estes são os ajustes que fizeram diferença.

## 1. Vertical desde o pedido

A biblioteca faz 1920×1080 (deitado) por padrão. Para Reels, TikTok e Shorts o quadro é 1080×1920 (em pé).

**Peça o formato no primeiro pedido.** *Por quê:* o Claude compõe cada quadro para o tamanho que você pediu. Um filme deitado virado depois perde as laterais, e o elemento principal fica pequeno. A regra de composição do curso vale aqui: um elemento principal por tela, ocupando de 60 a 85% da largura.

## 2. Voz grátis em português

A biblioteca traz uma voz local, que roda no seu PC sem internet e sem custo. Em português do Brasil, as que usamos:

- `pm_alex`: masculina. Foi a voz dos nossos 99 filmes.
- `pf_dora`: feminina.

Peça "velocidade normal". *Por quê:* voz acelerada soa artificial; o teto que usamos é 10% mais rápido.

É uma voz honesta, mas se percebe que é sintética. Para um vídeo que você vai postar com capricho, as opções são gravar a sua voz (grátis) ou usar um serviço de voz com a sua conta (pago: peça ao Claude o custo antes).

## 3. Empurrão de câmera

Quase todos os nossos filmes reprovaram na primeira checagem pelo mesmo motivo: tela parada. Muitos estilos seguram um quadro bonito por 3 ou 4 segundos, e no celular isso é tempo demais.

O `empurrao_camera.py` resolve sem redesenhar nada: nos trechos parados, o quadro inteiro cresce devagar, de 1,00 a 1,06, alternando entre aproximar e afastar.

```
python empurrao_camera.py FILME/index.html PASTA_DA_CHECAGEM/qa.json     # usa os trechos que a checagem mediu
python empurrao_camera.py FILME/index.html --trechos "3.2-6.0,14.5-18.1" # trechos escritos à mão, em segundos
python empurrao_camera.py FILME/index.html --tirar                       # desfaz
```

Depois, renderize o filme de novo. O script guarda uma cópia do arquivo original ao lado.

**Melhor que consertar depois é pedir antes:** no pedido do filme, escreva "não deixe a tela parada por mais de 1,5 s".

## 4. Checagem

Use a skill `checar-video` do curso no arquivo final. Ela mede tela parada, texto cortado, volume e formato.

Um aviso é esperado nestes filmes: a comparação entre a fala e o roteiro acusa diferença quando o texto tem número por extenso ("vinte e três" contra "23"). Confira no olho antes de refazer a voz.

## 5. Versão de celular

```
ffmpeg -y -i final.mp4 -vf scale=720:1280 -c:v libx264 -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -ar 48000 -movflags +faststart final_celular.mp4
```

É a versão leve, para mandar por mensagem e ver no celular antes de postar. A que você posta é a de 1080×1920.

## 6. Dois renders por vez

Renderizar é desenhar o filme quadro a quadro, e usa o processador inteiro. Com três ou mais renders ao mesmo tempo, o PC trava e os renders param no meio. Para a biblioteca respeitar o limite sozinha, defina `RENDER_SLOTS=2` antes de começar.

## 7. Placa de vídeo

- Estilo em 2D: não precisa.
- Estilo em 3D: precisa, ou fica muito lento. Dois dos nossos 99 só saíram com placa.
- `LEMO_ANGLE=swiftshader` força o desenho pelo processador (lento, mas funciona em filme curto).
- Com placa, não defina nada: a biblioteca usa a placa sozinha. Se um render em 3D estiver lento num PC com placa, confira se `LEMO_ANGLE` não ficou como `swiftshader`.
