// Roda no "npm install" (postinstall): copia o GSAP instalado pelo npm para vendor/.
// O GSAP não vem no pacote do curso: ele tem licença própria (gsap.com/standard-license) e é baixado do npm.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const origem = path.join(raiz, "node_modules", "gsap", "dist", "gsap.min.js");
if (!fs.existsSync(origem)) {
  console.error("GSAP não encontrado. Rode: npm install");
  process.exit(1);
}
fs.mkdirSync(path.join(raiz, "vendor"), { recursive: true });
fs.copyFileSync(origem, path.join(raiz, "vendor", "gsap.min.js"));
console.log("GSAP copiado para vendor/.");
