# FONTES e licenças do motor 37 (anime 3D com boneco VRM)

Créditos ficam só aqui; nada vai na tela.

## Personagem 3D: `modelo/HairSample_Male.vrm`
- **HairSample_Male**, modelo de amostra oficial do VRoid Studio. Autor: VRoid Project / pixiv.
- Licença **CC0**, gravada no próprio arquivo (metadado VRM: `licenseName: CC0`, `commercialUssageName: Allow`,
  `allowedUserName: Everyone`; a URL de licença do VRoid Hub dentro do arquivo traz `redistribution=allow`,
  `modification=allow`, `credit=unnecessary`). Página oficial da VRoid que lista os modelos de amostra CC0
  (HairSample_Male, HairSample_Female, AvatarSample_1–4 β):
  https://vroid.pixiv.help/hc/en-us/articles/4402614652569-Do-VRoid-Studio-s-sample-models-come-with-conditions-of-use
- **A cópia deste pacote foi reduzida** (de 18,9 MB para ~6,4 MB): texturas de corpo e calça em 512 px, moletom em 1024 px,
  mapas que o cel do motor não usa (normal, matcap, especular, outline) em 64 px, miniatura em 256 px. Malha, ossos e
  expressões são os originais. Para render final em close, baixe o arquivo original na página acima e troque.
- Modificações feitas em tempo de execução pelo motor (`ep01/engine/src/hero_vrm.js`): materiais MToon trocados pelo cel;
  rosto chapado; cabelo, moletom e calça posterizados em 3 níveis e recoloridos; malhas de outline desligadas; pescoço
  com pitch limitado; joelhos com folga; textura de "choque" por código.
- **Seu próprio boneco:** qualquer `.vrm` (VRM 0.x do VRoid Studio) em `modelo/`, aberto com `Q="&vrm=../modelo/seu.vrm"`.
  Confira a licença do SEU arquivo antes de publicar (o metadado fica dentro do .vrm).

## Objetos, sets e efeitos
Todos feitos para o curso, em código: patinete com display de LCD (`scooter.js`), FX desenhados (`fxd.js`), Rei Slime, rua e campo.

## Bibliotecas (em `vendor/`, todas MIT)
- three.js r160 (`three.module.min.js`, `three-addons/loaders/GLTFLoader.js`, `three-addons/utils/BufferGeometryUtils.js`): `vendor/LICENSE-three.txt`.
- @pixiv/three-vrm 2.1.3 (`three-vrm.module.min.js`), pixiv Inc.: `vendor/LICENSE-three-vrm.txt`.
- Motor anime (`ep01/engine/src/anime/post.js`, `vale_lib.js`, `heights_lib.js`): cadeia de pós do RYUMON, MIT: `ep01/engine/LICENSE`.
- puppeteer-core (Apache-2.0): vem do `npm install`; usa o Chrome que já está no computador.

## Som
Não incluído. A peça original usou trilhas e efeitos de bibliotecas licenciadas que não podem ser redistribuídas.
Use a sua biblioteca de efeitos ou um pack CC0; os tempos e níveis estão em `ep01/MIX.md` e `ep01/TIMELINE.json`.
A narração (opcional) é gerada com a SUA conta da ElevenLabs por `ep01/gerar_vozes.sh`.
