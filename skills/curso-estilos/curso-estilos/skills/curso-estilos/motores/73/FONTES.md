# Fontes e licenças dos arquivos deste motor

| Arquivo | Origem | Licença |
|---|---|---|
| `dados/ne_50m_land.geojson`, `dados/ne_110m_lakes.geojson`, `dados/ne_50m_populated_places_simple.geojson` | Natural Earth (naturalearthdata.com), via repositório `nvkelso/natural-earth-vector` | Domínio público |
| `dados/mundo_2k.jpg` | NASA Blue Marble Next Generation, topografia + batimetria (NASA Earth Observatory / Visible Earth), reduzido de 8192×4096 para 2048×1024 | Domínio público (imagem da NASA) |
| `fonts/Bricolage.ttf` | Bricolage Grotesque, Mathieu Triay | SIL Open Font License 1.1 (`licencas/BricolageGrotesque-OFL.txt`) |
| `fonts/JetBrainsMono-Bold.ttf` | JetBrains Mono, JetBrains | SIL Open Font License 1.1 (`licencas/JetBrainsMono-OFL.txt`) |
| `mapas.js`, `agua.js` | Gerados por `gen_mapas.py` a partir dos dados acima | Mesmas dos dados de origem |

Mudanças feitas nos dados para caber no pacote: coordenadas do Natural Earth arredondadas a 3 casas decimais; do arquivo de cidades ficaram só nome, longitude, latitude e população (`pop_max`).

Para baixar os originais completos: os GeoJSON estão na pasta `geojson/` do repositório `nvkelso/natural-earth-vector` no GitHub; o Blue Marble está em visibleearth.nasa.gov (procure "Blue Marble Next Generation topography bathymetry").

Natural Earth e NASA não exigem crédito, mas é boa prática citar na legenda do post: "Dados: Natural Earth · NASA Blue Marble".
