# Montar a biblioteca completa de efeitos

O pacote traz só 5 efeitos já renderizados em `../quadros/`. Para ter os outros (os packs oficiais somam mais de 300), você renderiza os que quiser uma vez e eles viram pastas de quadros que o `aplicar_fx.py` lê.

## O que baixar (tudo grátis)
1. **Editor Effekseer 1.70** (github.com/effekseer/Effekseer/releases). Vem com a pasta `Sample/` (98 efeitos CC0). O motor web só lê `.efk` exportado pelo 1.70; o 1.80 exporta um formato mais novo.
2. **Packs extras CC0**: effekseer.github.io/en/contribute.html (tktk01 e tktk02 são os melhores para golpe e corte; MAGICALxSPIRAL para magia). Confira a licença de cada pack na página: alguns antigos não são CC0.
3. **Motor web**: `effekseer.min.js` + `effekseer.wasm` (github.com/effekseer/EffekseerForWebGL/releases) e `three.min.js` r149 (pacote npm `three@0.149.0`, arquivo `build/three.min.js`). Ponha os três nesta pasta.

## Passos
1. Exportar cada efeito para `.efk`, ao lado do projeto (as texturas são relativas):
   `Effekseer.exe -cui -in X.efkefc -e X.efk` (aceita também `.efkproj`).
2. Copiar a pasta do pack (com os `.efk` e as texturas) para dentro desta pasta, por exemplo `packs/tktk01/`.
3. `python servidor.py 4870` e abrir `http://127.0.0.1:4870/biblioteca.html` no Chrome.
4. No console da página (F12):
   `renderLista([["tktk01__Blow2", "packs/tktk01/Blow2.efk", 22]])`
   - O 1º campo vira o nome da pasta em `../quadros/`. Use `pack__Efeito` (o `aplicar_fx.py` acha pelo pedaço depois do `__`).
   - O 3º é a distância da câmera: 22 serve para a maioria; packs com efeitos grandes pedem 40 ou 80. Se o efeito sair cortado, aumente.
   - Sai 1080×1920, 30 qps, no preto, centro do efeito no centro do quadro.
5. `python folha.py` monta o catálogo numerado (`catalogo.png`, `catalogo.mp4`, `catalogo.json`) na pasta do motor. Escolher efeito pelo NÚMERO da folha é muito mais rápido que pelo nome.

## Pegadinhas
- Efeito que não carrega em 15 s dá `ERRO timeout` e a lista segue. Alguns efeitos com modelo 3D pesado não carregam no motor web.
- Efeitos de partícula de GPU (recurso do 1.80) não exportam no 1.70.
- Efeito com mistura normal (fumaça escura, poeira) fica fraco: o fundo é preto e a composição é screen, então só luz aparece. Para poeira de verdade seria preciso renderizar com fundo transparente.
- Anote autor e licença de cada pack num FONTES.md seu. O CC0 não obriga crédito, mas você precisa saber de onde veio.
- Esta parte (montar a biblioteca) não é coberta pelo demo: depende do editor Effekseer, que só tem versão para Windows e Mac.
