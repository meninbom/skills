# Fontes e licenças dos arquivos deste motor

| Arquivo | Origem | Licença |
|---|---|---|
| `cena/paulista.json` (prédios, ruas, áreas verdes, árvores) | OpenStreetMap, baixado pela Overpass API num raio de 450 m em torno de -23.5614, -46.6560 e convertido para metros locais por `scripts/baixar_dados.py` | © OpenStreetMap contributors, Open Database License (ODbL) 1.0: openstreetmap.org/copyright |
| `cena/paulista.json` (campo `terrain`, relevo) | Terrain Tiles (formato terrarium), Mapzen / AWS Open Data: registry.opendata.aws/terrain-tiles | Dados abertos; o mosaico reúne fontes como SRTM (NASA/USGS, domínio público). Lista de atribuições: github.com/tilezen/joerd/blob/master/docs/attribution.md |
| `vendor/three.module.js`, `vendor/three.core.js` | three.js (threejs.org) | MIT, © three.js authors |
| `render/`, `scripts/` | Escritos para o curso | Uso livre pelos alunos |

## O que isso exige de você
- **Toda peça publicada com este motor leva o crédito** "© OpenStreetMap contributors · relevo: Terrain Tiles (AWS Open Data)". Pode ir na legenda do post em vez de na tela.
- O `cena/paulista.json` é um banco de dados derivado do OSM: se você redistribuir esse arquivo (ou outro gerado pelo `baixar_dados.py`), ele continua sob ODbL e precisa do mesmo crédito. As imagens e vídeos renderizados são "obra produzida": só o crédito é exigido.
- A Overpass API é um serviço público gratuito: uma consulta por lugar (o script guarda em `cache/`), sem laço de requisições.

## Sobre a técnica
A ideia de transformar um lugar real em cenário de mangá no navegador vem da ferramenta Location Scout. O código dela é fechado ("All rights reserved"); este motor foi escrito do zero, só com a técnica descrita em `COMO_FUNCIONA.md`.
