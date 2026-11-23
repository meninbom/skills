// Roda no "npm install" (postinstall): copia o GSAP instalado pelo npm para a pasta vendor/ de cada composição.
// Composição = toda pasta direta do motor que tem um index.html (kit_template, kit_branco, hf e as que você criar).
// O GSAP não vem no pacote do curso: ele tem licença própria (gsap.com/standard-license) e é baixado do npm.
// Criou uma pasta nova depois do npm install? Não precisa rodar de novo: o render.mjs copia o GSAP sozinho.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const origem = path.join(raiz, "node_modules", "gsap", "dist", "gsap.min.js");
if (!fs.existsSync(origem)) {
  console.error("GSAP não encontrado. Rode: npm install");
  process.exit(1);
}
const fora = new Set(["node_modules", "saida", "lib"]);
const pastas = new Set(["hf_src"]); // esta guarda o fonte do exemplo (src.html) e também usa o GSAP
for (const item of fs.readdirSync(raiz, { withFileTypes: true })) {
  if (!item.isDirectory() || fora.has(item.name) || item.name.startsWith(".")) continue;
  if (fs.existsSync(path.join(raiz, item.name, "index.html"))) pastas.add(item.name);
}
const feitas = [];
for (const pasta of pastas) {
  if (!fs.existsSync(path.join(raiz, pasta))) continue;
  const destino = path.join(raiz, pasta, "vendor");
  fs.mkdirSync(destino, { recursive: true });
  fs.copyFileSync(origem, path.join(destino, "gsap.min.js"));
  feitas.push(pasta);
}
console.log("GSAP copiado para vendor/ de: " + feitas.sort().join(", "));
