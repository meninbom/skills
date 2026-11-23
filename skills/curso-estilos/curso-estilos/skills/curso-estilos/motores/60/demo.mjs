// Demo: 3,6 s do "Só mais um baú" (o baú de ouro abrindo), mudo, 540x960, com sprites-placeholder feitos por código.
// npm run demo   (ou: node demo.mjs)   -> saida/demo.mp4
// Tudo roda na CPU (não usa navegador nem placa de vídeo), então DEMO_CPU=1 não muda nada: já é o modo padrão.
import { existsSync } from "node:fs";

const t0 = Date.now();
if (!existsSync(new URL("sprites/assets/index.json", import.meta.url))) {
  console.log("sem sprites em sprites/assets: gerando os placeholders (para usar os packs reais, veja o DEMO.md)");
  await import("./sprites/placeholder.mjs");
}
process.env.PALAVRAS ||= "voz/exemplo.words.json"; // tempos de palavra que vêm no motor (sem voz, sem custo)
const { TEMPOS } = await import("./ep_bau/ep.mjs");
const { renderizar } = await import("./ep_bau/render.mjs");
const de = Math.round((TEMPOS.ouro - 1.7) * 30) / 30;
const r = await renderizar({ de, ate: de + 3.6, escala: 4, crf: 18, saida: "saida/demo.mp4" });
console.log(`pronto: ${r.arquivo} · ${r.quadros} quadros · ${r.largura}x${r.altura} @ ${r.fps} qps · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
