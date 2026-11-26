#!/usr/bin/env node
// Monta o catálogo local: lista no terminal + ~/.curso-estilos/catalogo.html com as prévias.
// Cada estilo é chamado pelo CÓDIGO dele (#03, #25, #luta, #impact), o mesmo do e-book e do Replicar. Não existe numeração 1, 2, 3.
// Uso: node catalogo.mjs [--abrir] [--json]
//      node catalogo.mjs --estilo 25      (aceita "#25", "25", "3" = "#03", "luta"; mostra a receita, o motor e a aula)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { checar, DADOS } from "./checar_pc.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CAT = path.join(AQUI, "..", "catalogo");
const cfg = JSON.parse(fs.readFileSync(path.join(CAT, "estilos.json"), "utf8"));
const pcArq = path.join(DADOS, "pc.json");
const pc = fs.existsSync(pcArq) ? JSON.parse(fs.readFileSync(pcArq, "utf8")) : checar();

function situacao(s) {
  const falta = s.precisa.filter((p) => !pc.programas[p]);
  if (s.vram_gb && (pc.gpu.vram_gb || 0) < s.vram_gb)
    return { tipo: "placa", texto: `precisa de placa forte (${s.vram_gb} GB de VRAM ou mais)`, falta };
  if (falta.length) {
    const min = falta.reduce((a, p) => a + (cfg.minutos_instalar[p] || 5), 0);
    return { tipo: "instalar", texto: `precisa instalar ${falta.map((p) => cfg.nomes[p] || p).join(", ")} (~${min} min)`, falta };
  }
  return { tipo: "roda", texto: "roda no seu PC", falta };
}
// os estilos #101 a #199: os 99 da biblioteca gratuita Lemo-Opuscar, que a skill 99-estilos ensina a usar.
// Entram no catálogo como estilos comuns, com a prévia do filme de teste que fizemos em cada um.
const DIR99 = path.join(AQUI, "..", "..", "99-estilos");
const arq99 = path.join(DIR99, "estilos99.json");
if (fs.existsSync(arq99)) {
  cfg.familias.push("Mais 99 estilos em código (biblioteca gratuita Lemo-Opuscar)");
  for (const e of JSON.parse(fs.readFileSync(arq99, "utf8")))
    cfg.estilos.push({ id: e.id, previa: e.previa, previaDir: path.join(DIR99, "previas"), arquivo: path.join(DIR99, "CATALOGO.md"),
      familia: cfg.familias.length - 1, nome: e.estilo, exemplo: `${e.titulo} · nossa nota: ${e.nota}`, custo: "Grátis",
      precisa: ["node", "python", "ffmpeg"], vram_gb: e.pede_placa ? 4 : 0, status: "extra", aula: "Bônus: 99 estilos", skill: "99-estilos",
      nota: e.melhor ? "Entre os 10 que mais renderam no nosso teste." : e.fraco ? "Saiu fraco no nosso teste: pede mais rodadas de correção." : "" });
}
// estilos aprendidos pelo Replicar (ficam fora da pasta do plugin)
const apArq = path.join(DADOS, "aprendidos", "assinaturas.json");
if (fs.existsSync(apArq)) {
  const ap = JSON.parse(fs.readFileSync(apArq, "utf8")).estilos || [];
  if (ap.length) cfg.familias.push("Aprendidos pelo Replicar");
  ap.forEach((e, i) => {
    const base = cfg.estilos.find((x) => x.id === e.base);
    cfg.estilos.push({ cod: `#${200 + i + 1}`, id: e.id, previaAbs: path.join(DADOS, "aprendidos", e.id), arquivo: path.isAbsolute(e.arquivo) ? e.arquivo : path.join(DADOS, e.arquivo),   // aprendidos ganham os códigos #201, #202... (os do curso vão até #199)
       familia: cfg.familias.length - 1,
      nome: e.nome, exemplo: e.sinais || "", custo: "Grátis", precisa: base ? base.precisa : ["node", "chrome", "ffmpeg"], vram_gb: base ? base.vram_gb : 0,
      status: "aprendido", aula: "—" });
  });
}
// cada estilo do curso tem uma skill própria (catalogo/skills.json: código -> nome da skill)
const skArq = path.join(CAT, "skills.json");
const SKILLS = fs.existsSync(skArq) ? JSON.parse(fs.readFileSync(skArq, "utf8")) : {};
const MOTOR = { "11": path.join(AQUI, "..", "..", "geo-tales", "motor") };   // o #11 usa o motor da skill geo-tales
const itens = cfg.estilos.map((s) => ({ ...s, cod: s.cod || `#${s.id}`, skill: s.status === "aprendido" ? null : s.skill || SKILLS[s.id] || null, sit: situacao(s) }));

// acha um estilo pelo que o aluno disse: "#25", "25", "3" (= #03), "luta", "#201" ou o apelido de um aprendido
function achar(q) {
  let k = String(q).trim().toLowerCase().replace(/^#/, "");
  if (/^\d$/.test(k)) k = "0" + k;
  return itens.find((s) => s.cod.slice(1).toLowerCase() === k) || itens.find((s) => String(s.id).toLowerCase() === k);
}
const iE = process.argv.indexOf("--estilo");
if (iE > -1) {
  const s = achar(process.argv[iE + 1] ?? "");
  if (!s) {
    console.error(`Não achei o estilo "${process.argv[iE + 1] ?? ""}". Códigos que existem: ${itens.map((x) => x.cod).join(" ")}`);
    process.exit(1);
  }
  const aprendido = s.status === "aprendido", extra = s.status === "extra";
  console.log(`${s.cod} · ${s.nome} [${s.status}]${s.destaque ? " · ★ estilo em destaque" : ""}`);
  console.log(`situação: ${s.sit.texto}`);
  if (s.skill) console.log(`skill:    ${s.skill}  (é a porta de entrada do estilo: use esta skill para produzir)`);
  if (extra) {
    console.log(`nome na biblioteca: ${s.nome}  (é este nome que vai no pedido para a biblioteca)`);
    console.log(`nosso filme de teste: ${s.exemplo}`);
    console.log(`catálogo: ${s.arquivo}`);
    console.log(`prévia:   ${path.join(s.previaDir, s.previa + ".mp4")}`);
    if (s.nota) console.log(`nota:     ${s.nota}`);
    process.exit(0);
  }
  console.log(`receita:  ${aprendido ? s.arquivo : path.join(AQUI, "..", "estilos", s.arquivo)}`);
  console.log(`motor:    ${aprendido ? path.join(DADOS, "aprendidos", s.id, "motor") : MOTOR[s.id] || path.join(AQUI, "..", "motores", s.id)}`);
  console.log(`aula:     ${s.aula}`);
  if (s.nota) console.log(`nota:     ${s.nota}`);
  process.exit(0);
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(itens.map(({ cod, id, nome, status, sit, arquivo, aula, skill }) => ({ codigo: cod, id, nome, skill, status, situacao: sit.texto, falta: sit.falta, arquivo, aula })), null, 2));
} else {
  cfg.familias.forEach((f, i) => {
    console.log(`\n${f}`);
    for (const s of itens.filter((x) => x.familia === i))
      console.log(`  ${s.cod.padEnd(7)} ${s.destaque ? "★ DESTAQUE · " : ""}${s.nome} [${s.status}]${s.skill ? ` (skill ${s.skill})` : ""} — ${s.sit.texto}${s.nota ? ` · ${s.nota}` : ""}`);
  });
  const c = (t) => itens.filter((x) => x.sit.tipo === t).length;
  console.log(`\n${c("roda")} rodam agora · ${c("instalar")} pedem instalação · ${c("placa")} pedem placa forte`);
  console.log(`Escolha pelo código, o mesmo do e-book (ex.: #25). Os códigos não são sequenciais. Do #101 ao #199 são os 99 estilos extras.`);
}

// ---------- página ----------
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// As prévias são COPIADAS para a pasta de dados (previas/) e a página aponta para elas por caminho relativo.
// Motivo: a pasta do plugin muda de lugar a cada atualização (e some na desinstalação); com caminho absoluto para
// dentro dela, a página ficava preta. Só recopia o que mudou (tamanho ou data diferentes).
const PREV = path.join(DADOS, "previas");
fs.mkdirSync(PREV, { recursive: true });
function sincronizar(origem) {
  const destino = path.join(PREV, path.basename(origem));
  const o = fs.statSync(origem), d = fs.existsSync(destino) ? fs.statSync(destino) : null;
  if (!d || d.size !== o.size || Math.abs(d.mtimeMs - o.mtimeMs) > 2000) {
    fs.copyFileSync(origem, destino);
    fs.utimesSync(destino, o.atime, o.mtime);
  }
}
// o MP4 tem faixa de áudio? (procura a marca "soun" que todo MP4 com som carrega; não precisa de ffprobe)
const temSom = (arq) => fs.readFileSync(arq).includes("soun");
const cartao = (s) => {
  // estilo do curso: prévia copiada para previas/. Estilo aprendido: a prévia já mora na pasta de dados.
  const dir = s.previaAbs || s.previaDir || path.join(CAT, "previas"), nome = s.previaAbs ? "previa" : s.previa;
  const rel = s.previaAbs ? `aprendidos/${encodeURIComponent(s.id)}/` : "previas/";
  const tem = (f) => fs.existsSync(path.join(dir, f));
  const jpg = `${nome}.jpg`, mp4 = `${nome}.mp4`;
  const video = !s.so_imagem && tem(mp4);
  if (!s.previaAbs) for (const f of [jpg, mp4]) if (tem(f)) sincronizar(path.join(dir, f));
  const som = video && temSom(path.join(dir, mp4));
  // o pôster vai EMBUTIDO na página (data:), para o cartão mostrar a imagem do estilo mesmo quando a página é aberta
  // num visualizador que não carrega arquivos vizinhos (o painel do app, por exemplo). O vídeo continua por caminho relativo.
  const capa = tem(jpg) ? `data:image/jpeg;base64,${fs.readFileSync(path.join(dir, jpg)).toString("base64")}` : "";
  // sem autoplay e sem "muted": o vídeo só toca (e só faz som) quando o aluno clica no play
  const midia = video
    ? `<video src="${rel}${mp4}"${capa ? ` poster="${capa}"` : ""} playsinline controls preload="metadata"></video>`
    : capa ? `<img src="${capa}" alt="">` : `<div class="vazio">sem prévia</div>`;
  const selo = video ? `<span class="som ${som ? "tem" : "nao"}">${som ? "🔊 com som" : "prévia sem som"}</span>` : "";
  return `<article class="card ${s.sit.tipo}">
  <div class="midia">${midia}<span class="num">${esc(s.cod)}</span>${selo}${s.destaque ? `<span class="dest">★ destaque</span>` : ""}</div>
  <div class="corpo">
    <h3>${esc(s.nome)}</h3><p class="ex">${esc(s.exemplo)}</p>
    <p class="sit">${esc(s.sit.texto)}</p>
    <p class="meta"><span class="tag ${esc(s.status)}">${esc(s.status)}</span><span>${esc(s.custo)}</span><span>aula ${esc(s.aula)}</span></p>
    ${s.nota ? `<p class="nota">${esc(s.nota)}</p>` : ""}
  </div></article>`;
};
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Catálogo de estilos</title><style>
:root{--bg:#f4f2ee;--fg:#191817;--mut:#6a6660;--card:#fff;--lin:#dedad2;--ok:#1d7a4f;--inst:#a05a00;--placa:#a3322b}
@media (prefers-color-scheme:dark){:root{--bg:#131312;--fg:#eeece7;--mut:#9c978e;--card:#1d1c1a;--lin:#33312d;--ok:#5fcf97;--inst:#f0b057;--placa:#f08a80}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,"Segoe UI",sans-serif}
main{max-width:1180px;margin:0 auto;padding:28px 16px 60px}h1{font-size:26px;margin:0 0 4px}h2{font-size:17px;margin:36px 0 12px}
.pc{color:var(--mut);margin:0}.aviso{margin:10px 0 0;padding:8px 12px;border:1px solid var(--inst);border-radius:10px;color:var(--fg);font-size:13.5px}.aviso code{word-break:break-all}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px}
.card{background:var(--card);border:1px solid var(--lin);border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
.midia{position:relative;aspect-ratio:9/16;background:#000}.midia video,.midia img{width:100%;height:100%;object-fit:cover;display:block}
.vazio{color:#888;display:grid;place-items:center;height:100%}
.dest{position:absolute;bottom:8px;left:8px;background:#f2b705;color:#1a1300;font-weight:700;font-size:12.5px;border-radius:8px;padding:2px 9px;pointer-events:none}
.som{position:absolute;top:8px;right:8px;background:rgba(0,0,0,.72);color:#fff;font-size:12px;border-radius:8px;padding:2px 8px;pointer-events:none}.som.nao{color:#c9c5bd}
.num{position:absolute;top:8px;left:8px;background:rgba(0,0,0,.72);color:#fff;font-weight:700;border-radius:8px;padding:2px 9px;font-variant-numeric:tabular-nums}
.corpo{padding:10px 12px 12px}h3{font-size:15px;margin:0}.ex,.nota{color:var(--mut);margin:2px 0 0;font-size:13px}
.sit{margin:8px 0 6px;font-weight:600;font-size:13.5px}.roda .sit{color:var(--ok)}.instalar .sit{color:var(--inst)}.placa .sit{color:var(--placa)}
.meta{display:flex;flex-wrap:wrap;gap:6px;margin:0;font-size:12px;color:var(--mut)}.meta span{border:1px solid var(--lin);border-radius:99px;padding:1px 8px}
.tag{color:var(--fg)!important;font-weight:600}
</style></head><body><main>
<h1>Catálogo de estilos</h1>
<p class="pc">Seu PC: ${esc(pc.gpu.nome)}${pc.gpu.vram_gb ? ` · ${pc.gpu.vram_gb} GB de VRAM` : ""} · ${pc.ram_gb} GB de memória · ${pc.disco_livre_gb ?? "?"} GB livres. Escolha pelo código (ex.: #25, o mesmo do e-book) e diga no Claude Code. Os vídeos só tocam quando você clica no play. Os que têm o selo "com som" tocam com som; os outros são mudos mesmo.</p>
<p class="aviso" id="aviso">Os vídeos não tocam aqui? Esta página precisa do navegador. Abra este arquivo no Chrome ou no Edge: <code>${esc(path.join(DADOS, "catalogo.html"))}</code></p>
<script>
// se pelo menos um vídeo carregar, a página está num navegador de verdade e o aviso some
(function () {
  var aviso = document.getElementById("aviso"), vs = document.querySelectorAll("video");
  function ok() { if (aviso) aviso.style.display = "none"; }
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("video").forEach(function (v) {
      if (v.readyState > 0) ok(); else v.addEventListener("loadedmetadata", ok, { once: true });
    });
  });
})();
</script>
${cfg.familias.map((f, i) => `<h2>${esc(f)}</h2><div class="grid">${itens.filter((x) => x.familia === i).map(cartao).join("\n")}</div>`).join("\n")}
</main></body></html>`;
fs.mkdirSync(DADOS, { recursive: true });
const saida = path.join(DADOS, "catalogo.html");
fs.writeFileSync(saida, html);
if (!process.argv.includes("--json")) console.log(`\nPágina com as prévias: ${saida}`);
if (process.argv.includes("--abrir")) {
  const [cmd, args] = process.platform === "win32" ? ["cmd", ["/c", "start", "", saida]] : process.platform === "darwin" ? ["open", [saida]] : ["xdg-open", [saida]];
  spawn(cmd, args, { detached: true, stdio: "ignore" }).unref();
}
