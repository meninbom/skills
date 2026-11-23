// O Caseiro (jogo): servidor local. Procura o arquivo na pasta do jogo e, se não achar, no motor da série
// (scene, mundo, dados assados, three) e nas vozes/sons da série. Nada é copiado: o jogo usa o mesmo mundo.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const serie = path.join(here, '..');   // a pasta do estilo: motor/ (mundo, dados assados, three) e voz/ (as falas)
const roots = [here, path.join(serie, 'motor'), serie];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.css': 'text/css' };
const PORT = +(process.env.PORT || 4810);
http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  for (const r of roots) {
    const f = path.resolve(r, rel);
    if (!f.startsWith(path.resolve(r))) continue;
    if (fs.existsSync(f) && fs.statSync(f).isFile()) {
      res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      return fs.createReadStream(f).pipe(res);
    }
  }
  res.writeHead(404); res.end();
}).listen(PORT, () => console.log(`O Caseiro: http://localhost:${PORT}`));
