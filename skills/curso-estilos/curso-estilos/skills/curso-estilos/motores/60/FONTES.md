# FONTES · motor 60 (pixel de jogo indie)

Nada disto aparece na tela. Créditos e licenças ficam aqui.

## O que vem dentro do motor

### pixelfx (MIT) · `vendor/pixelfx/`
- Origem: https://github.com/patch-gg/pixelfx (v0.3.1). Só a pasta `src/core` foi copiada, sem alterações. Licença e avisos: `vendor/pixelfx/LICENSE` e `vendor/pixelfx/NOTICE.md`.
- Partes que eles adaptaram, também MIT: Sprite Fusion pixel art VFX (Hugo Duprez) e Hollow Crown (rehan-remade).
- A fonte "Patch Pixel" da galeria deles NÃO é MIT e não foi copiada. Os efeitos prontos (`src/fx`) também não: os deste motor são próprios (`fx/`).

### Pixelify Sans (SIL Open Font License 1.1) · `motor/fonte_titulo.json`
- Fonte de Stefie Justprince, do Google Fonts. O arquivo é a fonte rasterizada em 13 px (tamanho em que o traço tem 1 px), um mapa de pontos por letra.

### Feito para o curso
- Motor (`motor/`), fonte bitmap com acentos (`motor/fonte.mjs`), efeitos (`fx/`), episódio (`ep_bau/`), objetos em 1 px (bota, pedra, pepita, pombo, portão), sprites-placeholder (`sprites/placeholder.mjs`) e os tempos de palavra de exemplo (`ep_bau/voz/exemplo.words.json`).

## O que NÃO vem e você baixa (grátis, itch.io)

Os três packs abaixo permitem uso comercial sem crédito, mas **não permitem redistribuir os arquivos**. Por isso o motor traz só o conversor (`sprites/prep.py`).
- **Fantasy Knight - Free Pixelart Animated Character** (aamatniekss): o cavaleiro.
- **Free Pixelart Platformer Tileset** (aamatniekss): céu, montanhas, chão, árvores, cerca, moita.
- **Free Treasure Chest** (Otsoga): o baú, o baú de ouro e a cintilada.

A licença pode mudar: leia o texto que acompanha cada download e anote aqui a data em que baixou.

## Notas de licença de outros packs que testamos
- LuizMelo (Huntress, Medieval Warrior, Hero Knight etc.): CC0. Bom ponto de partida para o exercício da aula.
- Legacy Fantasy: High Forest (Anokolisa): uso comercial livre, crédito opcional, não revender.
- Pixel Art Skeletons (MonoPixelArt): uso comercial, mas não pode modificar.
- KBPixelArt: uso comercial, sem redistribuição; proíbe uso em datasets de IA e "geração automatizada de conteúdo" (render determinístico em código é outra coisa, mas a ressalva fica).
- Alguns packs pedem crédito obrigatório na legenda do post. Sempre conferir.

## Áudio
Voz, trilha e efeitos sonoros não vêm no motor. Use a sua voz ou a API da ElevenLabs com a sua chave, e a sua biblioteca de efeitos ou um pack CC0.
