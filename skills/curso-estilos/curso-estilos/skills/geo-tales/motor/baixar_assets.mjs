// Baixa a base do mapa em resolução cheia, das fontes oficiais, para dados/.
// O demo NÃO precisa disto (já vem um recorte pequeno). Rode quando for fazer um episódio de verdade.
// uso: node baixar_assets.mjs            (mundo 8k + América do Sul + Natural Earth, ~16 MB)
//      node baixar_assets.mjs recorte nome lon0 lon1 latNorte latSul [pxPorGrau=80]   (outro continente)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const D = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dados'); fs.mkdirSync(D, { recursive: true });
// Blue Marble (relevo sombreado + batimetria): NASA GIBS, WMS público, sem chave. Domínio público.
const gibs = (lon0, lon1, latN, latS, w, h) => 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1'
  + `&LAYERS=BlueMarble_ShadedRelief_Bathymetry&STYLES=&FORMAT=image/jpeg&SRS=EPSG:4326&BBOX=${lon0},${latS},${lon1},${latN}&WIDTH=${w}&HEIGHT=${h}`;
// Natural Earth (domínio público), repositório oficial
const NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/';
async function baixa(url, nome, minimo = 2000) {
  const f = path.join(D, nome);
  if (fs.existsSync(f) && fs.statSync(f).size > minimo && !process.argv.includes('--de-novo')) { console.log('já existe', nome); return; }
  const r = await fetch(url); if (!r.ok) throw new Error(`${nome}: HTTP ${r.status}`);
  const b = Buffer.from(await r.arrayBuffer()); if (b.length < minimo) throw new Error(`${nome}: resposta pequena demais (${b.length} bytes)`);
  fs.writeFileSync(f, b); console.log('ok', nome, (b.length / 1e6).toFixed(1) + ' MB');
}
const a = process.argv.slice(2).filter(v => !v.startsWith('--'));
if (a[0] === 'recorte') {
  const nome = a[1], [lon0, lon1, latN, latS] = a.slice(2, 6).map(Number), ppd = Number(a[6] || 80);
  await baixa(gibs(lon0, lon1, latN, latS, Math.round((lon1 - lon0) * ppd), Math.round((latN - latS) * ppd)), nome + '.jpg', 20000);
} else {
  await baixa(gibs(-180, 180, 90, -90, 8192, 4096), 'mundo_8k.jpg', 400000);          // o demo usa mundo_2k.jpg; a cena de exemplo usa este
  await baixa(gibs(-90, -28, 16, -60, 4960, 6080), 'am_sul_80.jpg', 400000);          // 80 px por grau; renomeie para am_sul.jpg para usar com exemplo/prepara.py
  await baixa(NE + 'ne_50m_admin_0_countries.geojson', 'ne_50m_countries.geojson', 100000);
  await baixa(NE + 'ne_10m_rivers_lake_centerlines.geojson', 'ne_rivers.geojson', 100000);
}
