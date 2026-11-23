// gera ep_bau/som/deixas.json a partir dos MESMOS tempos do ep.mjs: a lista de efeitos sonoros, cada um com o instante,
// o trecho do arquivo e quantos dB abaixo da voz. Os áudios não vêm no motor: ponha os seus em ep_bau/som/sfx/<nome>.wav
// (sua biblioteca de efeitos, ou um pack CC0). Nomes esperados: veja SONS abaixo. Depois: node ep_bau/mixar.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { TEMPOS as t, DUR } from "./ep.mjs";
export const SONS = {
  rangido: "dobradiça de madeira rangendo (tampa do baú, portão)", pedra: "pedra batendo em pedra, impacto médio", bota: "couro caindo no chão",
  ouro: "revelação dourada curta (brilho)", tique: "tique-taque de relógio antigo", asas: "ave levantando voo", arrulho: "pombo ou rola arrulhando",
  vento: "rajada de vento curta", grilos: "grilos à noite (ambiente)",
};
const sfx = [];
const add = (tt, som, o = {}) => sfx.push({ t: Math.round(tt * 100) / 100, som, abaixo_voz_db: 12, ...o });
const AB = [t.abriu, t.pedra1 - 0.3, t.pedra2 - 0.3, t.ouro - 0.25];
AB.forEach((a) => add(a - 0.02, "rangido", { fatia: [0.08, 1.3], fade_out_s: 0.3, abaixo_voz_db: 15 }));
add(AB[0] + 1.2, "bota", { abaixo_voz_db: 11 });
add(AB[1] + 0.28, "pedra", { fatia: [0, 0.9], abaixo_voz_db: 11 }); add(AB[2] + 0.28, "pedra", { fatia: [0, 0.9], abaixo_voz_db: 11 });
add(AB[3] + 0.25, "ouro", { abaixo_voz_db: 10 });
// montagem: um corte a cada 0,42 s, relógio correndo por baixo
const M0 = t.parou - 0.15, M1 = t.se1 - 0.1;
add(M0, "tique", { fatia: [0.9, 0.9 + (M1 - M0)], abaixo_voz_db: 16, fade_out_s: 0.2 });
for (let n = 0; M0 + n * 0.42 < M1 - 0.1; n++) { const ouro = n === 9 || n === 23; add(M0 + n * 0.42 + 0.17, ouro ? "ouro" : "pedra", { ...(ouro ? {} : { fatia: [0, 0.5] }), abaixo_voz_db: ouro ? 12 : 16, fade_out_s: 0.1 }); }
// pombo chega e arrulha
add(t.cientista, "asas", { fatia: [0.5, 1.9], abaixo_voz_db: 14, fade_out_s: 0.3 });
add(t.skinner + 0.4, "arrulho", { fatia: [0, 1.7], abaixo_voz_db: 15, fade_out_s: 0.3 });
// cena C: bica e ganha; vai embora
[t.toda, t.bicava].forEach((b) => add(b, "tique", { fatia: [0.95, 1.2], abaixo_voz_db: 13 }));
add(t.embora - 0.15, "asas", { fatia: [0.5, 1.6], abaixo_voz_db: 14, fade_out_s: 0.3 });
// cena D: bica sem parar; depois o Bira, pedra atrás de pedra
for (let i = 0; t.se2 - 0.05 + i * 0.16 < t.naoParava - 0.05; i++) add(t.se2 + i * 0.16 + 0.03, "tique", { fatia: [0.95, 1.15], abaixo_voz_db: 15 });
for (let i = 0; t.naoParava + i * 0.3 < t.porque - 0.1; i++) add(t.naoParava + i * 0.3 + 0.12, "pedra", { fatia: [0, 0.5], abaixo_voz_db: 15, fade_out_s: 0.1 });
// intro: o vento abre o portão, que range e bate de volta
if (t.vento) { add(t.vento + 0.25, "vento", { abaixo_voz_db: 12 }); add(t.vento + 0.15, "rangido", { fatia: [0.08, 1.3], fade_out_s: 0.3, abaixo_voz_db: 14 }); }
// noite
add(t.porque - 0.05, "grilos", { fatia: [1, 1 + DUR - t.porque + 0.1], fade_out_s: 0.8, abaixo_voz_db: 10 });
sfx.sort((a, b) => a.t - b.t);
const conf = { duracao: DUR, trilha: { arquivo: "som/trilha.wav", abaixo_voz_db: 14 }, sons: SONS, sfx };
mkdirSync(new URL("som/", import.meta.url), { recursive: true });
writeFileSync(new URL("som/deixas.json", import.meta.url), JSON.stringify(conf, null, 1));
console.log(sfx.length, "efeitos em", DUR, "s -> ep_bau/som/deixas.json");
