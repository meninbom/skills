// Junta as partes: heroi.js = _heroi_helpers + _heroi_body · filme.js = _cena_a + _cena_b + _cena_imp + _cena_d.
// Edite só os arquivos com "_" na frente e rode: npm run juntar
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const AQUI = dirname(fileURLToPath(import.meta.url));
const junta = (saida, partes) => { writeFileSync(join(AQUI, saida), partes.map(p => readFileSync(join(AQUI, p), 'utf8')).join('')); console.log('ok', saida); };
junta('heroi.js', ['_heroi_helpers.js', '_heroi_body.js']);
junta('filme.js', ['_cena_a.js', '_cena_b.js', '_cena_imp.js', '_cena_d.js']);
