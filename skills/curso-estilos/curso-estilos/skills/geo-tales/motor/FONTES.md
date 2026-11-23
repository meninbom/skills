# Fontes e licenças do que vem nesta pasta

| Arquivo | Origem | Licença |
|---|---|---|
| `dados/mundo_2k.jpg`, `dados/am_sul.jpg` | Blue Marble (relevo sombreado + batimetria), NASA, pelo serviço GIBS (WMS público). Reduzidos para o demo (mundo 2048×1024; América do Sul a 26 px por grau). | Domínio público (NASA). Crédito de cortesia na descrição do post: "NASA Blue Marble / GIBS". |
| `dados/gen/brasil.json`, `dados/gen/faixa.json` | Contorno do Brasil e faixa de 150 km da costa, derivados do Natural Earth 1:50m pelo `exemplo/prepara.py` | Domínio público (Natural Earth). |
| `vendor/three.module.js` | three.js | MIT. |
| `vendor/Montserrat-SemiBold.ttf`, `vendor/Montserrat-ExtraBold.ttf` | Montserrat (The Montserrat Project Authors) | SIL Open Font License 1.1. |
| `exemplo/folha_recorte.jpg`, `exemplo/v6_b.jpg`, `exemplo/antes_depois.jpg` | Quadros e ilustrações do nosso piloto (ilustrações geradas no Z-Image) | Material de estudo do curso. |

O que NÃO vem no pacote e você busca na fonte (`node baixar_assets.mjs` cuida dos dois primeiros):
- **Blue Marble em resolução cheia** (mundo 8k, continente a 80 px por grau): NASA GIBS, domínio público.
- **Natural Earth** (países 1:50m, rios 1:10m): domínio público.
- **Sentinel-2 cloudless** (recortes de perto, baixados pelo `prepara.py`): EOX IT Services GmbH, **CC BY 4.0**. Atribuição obrigatória na descrição do post: "Sentinel-2 cloudless – https://s2maps.eu by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016)".
- **Relevo (terrarium tiles)**: Mapzen / AWS Open Data. Atribuição na descrição: "Elevation: Mapzen, AWS Terrain Tiles".
- **Malhas do Brasil** (regiões, estados, regiões metropolitanas): IBGE, API de malhas v3. Uso livre com citação da fonte.
- **Ilustrações pintadas, voz, efeitos sonoros e trilha**: são seus. O demo usa um cartão-placeholder desenhado por código.

Nenhum crédito vai na tela do vídeo; as atribuições vão na descrição do post e no `FONTES.md` do seu episódio.
