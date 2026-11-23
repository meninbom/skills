// "Só mais um baú": série pixel, 135x240 nativo (x8 = 1080x1920). Pixel único: nada é ampliado.
// Arte: cavaleiro + campo (packs do aamatniekss) e baú (pack do Otsoga), convertidos por ../sprites/prep.py.
// Sem os packs, ../sprites/placeholder.mjs gera bonecos de retângulo com os mesmos nomes e tamanhos.
// Bota, pedra, pepita e pombo são desenhados em 1 px aqui. Efeitos próprios em ../fx. HUD de inventário e relógio.
import { readFileSync, existsSync } from "node:fs";
import { Tela, hex, hash, usarPixelfx } from "../motor/core.mjs";
import { mistura, textoBorda } from "../motor/util.mjs";

export const W = 135, H = 240, FPS = 30;
const AQUI = new URL(".", import.meta.url);
const SPR = {};
function carrega(base) {
  const idx = JSON.parse(readFileSync(new URL("assets/index.json", base), "utf8"));
  for (const [k, lst] of Object.entries(idx)) SPR[k] = lst.map(([fn, w, h]) => { const b = readFileSync(new URL(fn, base)); const C = new Uint32Array(b.buffer, b.byteOffset, w * h); let x0 = w, y0 = h, x1 = -1, y1 = -1; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if ((C[y * w + x] >>> 24) > 127) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return { w, h, C, bb: [x0, y0, x1, y1] }; });
}
if (!existsSync(new URL("../sprites/assets/index.json", AQUI))) throw new Error("faltam os sprites: rode `node sprites/placeholder.mjs` (bonecos de teste) ou `python sprites/prep.py` (packs reais)");
carrega(new URL("../sprites/", AQUI));
const FT = JSON.parse(readFileSync(new URL("../motor/fonte_titulo.json", AQUI), "utf8"));
function tit(tl, str, x, y, cor, cont = hex("#1c1424")) {
  const pts = []; let cx = 0;
  for (const ch of str) { const g = FT[ch] || FT["?"]; g.rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === "#") pts.push([cx + i, j]); }); cx += g.adv; }
  if (x === -999) return cx;
  const oy = y - 5, ox = x - 2;
  for (const [i, j] of pts) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) tl.px(ox + i + dx, oy + j + dy, cont);
  for (const [i, j] of pts) tl.px(ox + i, oy + j, cor);
  return cx;
}
function titC(tl, s, y, cor, cont, cx = 67) { const w = tit(tl, s, -999); tit(tl, s, Math.round(cx - w / 2), y, cor, cont); }

// ---------- efeitos ----------
const PFX = await usarPixelfx();
const FXM = {};
for (const id of ["golpe", "poeira", "brilho", "levelup"]) FXM[id] = await import("../fx/" + id + ".js");
const RAMPA = (await import("../fx/base.mjs")).R;
let ativos = new Map();
export function resetar() { ativos = new Map(); }
function fx(t, chave, id, inicio, tt, opts) {
  if (tt < inicio) return;
  let e = ativos.get(chave);
  if (!e || e.t > tt - inicio + 1e-6) { e = { fx: PFX.createFx(FXM[id], { seed: 7, ...opts }), t: 0 }; ativos.set(chave, e); }
  while (e.t < tt - inicio - 1e-9) { const d = Math.min(1 / 60, tt - inicio - e.t); e.fx.update(d); e.t += d; }
  if (e.t > FXM[id].meta.duration + 0.05) return;
  const f = PFX.createFrame(t.w, t.h, 0, 0); e.fx.draw(f, "back"); e.fx.draw(f, "front"); t.compor(f, 0.3);
}

// ---------- palavras da voz ----------
// ordem: a sua voz (intro + corpo), só o corpo, os tempos provisórios, e por fim o exemplo que vem no motor
// (tempos medidos na narração da peça de referência; serve para renderizar sem gastar com voz).
// A variável de ambiente PALAVRAS força um arquivo (caminho relativo a esta pasta).
const ARQ = process.env.PALAVRAS || ["voz/narr_full.display.words.json", "voz/narr_A.display.words.json", "voz/provisorio.words.json", "voz/exemplo.words.json"].find((a) => existsSync(new URL(a, AQUI)));
const PAL = JSON.parse(readFileSync(new URL(ARQ, AQUI), "utf8"));
export const ARQ_PALAVRAS = ARQ;
export const COM_INTRO = PAL.some((p) => p.w.toLowerCase().startsWith("vento"));
export const PROVISORIO = ARQ.includes("provisorio");
const FR = []; { let f = []; for (const p of PAL) { f.push(p); if (/[.?!:…]$/.test(p.w)) { FR.push(f); f = []; } } if (f.length) FR.push(f); }
const limpa = (w) => w.toLowerCase().replace(/[^a-zà-ú0-9]/g, "");
function T(palavra, depois = 0) { const p = PAL.find((w) => w.start >= depois - 0.01 && limpa(w.w) === palavra); if (!p) throw new Error("palavra? " + palavra + " @" + depois); return p.start; }
function frase(t) { let fr = null; for (const f of FR) if (t >= f[0].start - 0.05) fr = f; if (!fr || t > fr.at(-1).end + 0.5) return null; return fr.filter((p) => t >= p.start - 0.03).map((p) => p.w).join(" "); }
function quebra(t, s, maxW) { const L = [[]]; let w = 0; for (const p of s.split(" ")) { const pw = t.larguraTexto(p); if (w && w + 4 + pw > maxW) { L.push([]); w = 0; } L.at(-1).push(p); w += (w ? 4 : 0) + pw; } return L.map((l) => l.join(" ")); }
export const DUR = Math.round((PAL.at(-1).end + 2.2) * 10) / 10;

// ---------- utilitários ----------
const seg = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const eo = (p) => 1 - (1 - p) ** 3, eio = (p) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
const anim = (arr, t, fps = 10, loop = true) => { const i = Math.floor(t * fps); return arr[loop ? ((i % arr.length) + arr.length) % arr.length : Math.max(0, Math.min(arr.length - 1, i))]; };
function blit(t, s, x, y, { flip = false, silhueta = 0, tinta = 0, k = 0 } = {}) {
  x = Math.round(x); y = Math.round(y);
  for (let j = 0; j < s.h; j++) { const yy = y + j; if (yy < 0 || yy >= t.h) continue;
    for (let i = 0; i < s.w; i++) { const xx = x + i; if (xx < 0 || xx >= t.w) continue;
      const c = s.C[j * s.w + (flip ? s.w - 1 - i : i)]; if ((c >>> 24) < 128) continue;
      t.C[yy * t.w + xx] = silhueta ? silhueta : k ? mistura(c | 0xff000000, tinta, k) : (c | 0xff000000) >>> 0; } }
}
function pe(t, s, cx, peY, op = {}) { const [x0, , x1, y1] = s.bb; const mx = op.flip ? s.w - 1 - (x0 + x1) / 2 : (x0 + x1) / 2; blit(t, s, cx - mx, peY - (y1 + 1), op); }
function faixa(t, s, offX, y) { const o = ((Math.round(offX) % s.w) + s.w) % s.w; for (let x = -o; x < t.w; x += s.w) blit(t, s, x, y); }
function escurecer(t, cor, k) { if (k <= 0) return; for (let i = 0; i < t.C.length; i++) t.C[i] = mistura(t.C[i], cor, k); }
function tremer(t, dx) { if (!dx) return; const c = t.C.slice(); for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) t.C[y * t.w + x] = c[y * t.w + Math.min(t.w - 1, Math.max(0, x - dx))]; }

const U = { tinta: hex("#1c1424"), papel: hex("#f4ead8"), ouro: hex("#ffd84a"), ouroE: hex("#a8641a"), verm: hex("#ff3a4a"), cinza: hex("#9a96a8"), branco: hex("#ffffff"), azul: hex("#6ab0ff") };
function painel(t, x, y, w, h, { k = 0.82, borda = U.papel } = {}) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const xx = x + i, yy = y + j; if (xx < 0 || yy < 0 || xx >= t.w || yy >= t.h) continue; t.C[yy * t.w + xx] = mistura(t.C[yy * t.w + xx], U.tinta, k); }
  t.hline(x + 1, x + w - 2, y, borda); t.hline(x + 1, x + w - 2, y + h - 1, borda); t.vline(x, y + 1, y + h - 2, borda); t.vline(x + w - 1, y + 1, y + h - 2, borda);
}

// ---------- objetos em 1 px (contorno #1a0e13, como os sprites) ----------
const CONT = hex("#1a0e13");
const ITENS = {
  bota: { rows: ["..aa..", "..ba..", "..ba..", "..baa.", ".bbbaa", "bccbba", "aaaaaa"], pal: { a: hex("#3a2418"), b: hex("#69552a"), c: hex("#9f803f") } },
  pedra: { rows: ["..lmm..", ".llmmm.", "lmmmmdd", "mmmmddd", ".ddddd."], pal: { l: hex("#c7c7b0"), m: hex("#868273"), d: hex("#3a3836") } },
  ouro: { rows: [".YY.", "YyyG", "yyGG", ".GG."], pal: { Y: hex("#fff6c8"), y: hex("#f2c443"), G: hex("#c8781e") } },
};
const tamItem = (n) => [ITENS[n].rows[0].length, ITENS[n].rows.length];
function item(t, n, cx, peY) { const [w, h] = tamItem(n); t.sprite(ITENS[n].rows, ITENS[n].pal, Math.round(cx - w / 2), Math.round(peY - h), { contorno: CONT }); }
const PB = { L: hex("#c4c4d0"), M: hex("#8a8a9e"), D: hex("#55556a"), N: hex("#5a9a7a"), R: hex("#9a5a8a"), b: hex("#e8d0a0"), e: hex("#ff8a2a"), f: hex("#d06060") };
const POMBO = {
  em_pe: ["...........MMM..", "..........MMeMM.", "..........MMMMbb", "..........NRNM..", ".........NRNRN..", "..LLLLLLLLNRN...", ".DLLLLLLLLLLN...", "DDMMLLLLLLLLL...", "DDDMMMMLLLLLL...", ".DDDDMMMMLLL....", "....DDDDDDD.....", "......f..f......", ".....ff.ff......"],
  bica: ["................", "................", "................", "................", "................", "..LLLLLLLLN.....", ".DLLLLLLLLNRN...", "DDMMLLLLLLLNRNM.", "DDDMMMMLLLLLMMeM", ".DDDDMMMMLLLMMMM", "....DDDDDDD...bb", "......f..f......", ".....ff.ff......"],
  voa1: ["...DD...........", "...DMM..........", "....MLL....MMM..", ".....LLL..MMeMM.", "......LLL.MMMMbb", "..LLLLLLLNRNM...", ".DLLLLLLLLRN....", "DDMMLLLLLLLL....", "DDDMMMMLLLLL....", ".DDDDMMMMLL.....", "....DDDDDD......", "................", "................"],
  voa2: ["................", "................", "...........MMM..", "..........MMeMM.", "..........MMMMbb", "..LLLLLLLNRNM...", ".DLLLLLLLLRN....", "DDMMLLLLLLLL....", "DDDMMLLLLLLL....", ".DDDLLLLMLL.....", "....LLLLDD......", "....MLLD........", ".....DD........."],
};
function pombo(t, pose, cx, peY, flip = false) { const r = POMBO[pose]; t.sprite(r, PB, Math.round(cx - 8), Math.round(peY - r.length), { contorno: CONT, flip }); }

// ---------- mundo ----------
const CHAO = 196;
// h: 0 = dia, 0.5 = pôr do sol, 1 = noite
function campo(t, cam, tt, h = 0) {
  const oy = CHAO + 22 - 320;
  faixa(t, SPR.kCeu[0], cam * 0.05 + 100, oy); faixa(t, SPR.kNuvem[0], cam * 0.12 + tt * 2 + 40, oy);
  faixa(t, SPR.kMont[0], cam * 0.25 + 60, oy); faixa(t, SPR.kMorro[0], cam * 0.45 + 20, oy + 6);
  const arv = (s, x, par) => { const xx = (((x - cam * par) % 300) + 300) % 300 - 80; blit(t, s, xx, CHAO + 2 - s.h); };
  arv(SPR.kArvore[1], 62, 0.8); arv(SPR.kArvore[0], 176, 0.8); arv(SPR.kArvore[1], 250, 0.8);
  const cer = (x) => { const xx = (((x - cam * 0.95) % 260) + 260) % 260 - 70; blit(t, SPR.kCerca[0], xx, CHAO + 1 - SPR.kCerca[0].h); }; cer(120); cer(181);
  const mo = (x) => { const xx = (((x - cam * 0.95) % 220) + 220) % 220 - 50; blit(t, SPR.kMoita[0], xx, CHAO + 1 - SPR.kMoita[0].h); }; mo(8); mo(150);
  faixa(t, SPR.kChao[0], cam, CHAO - 4);
  if (h > 0) { escurecer(t, hex("#ff7a3a"), 0.22 * Math.min(1, h * 2) * (h > 0.5 ? 2 - h * 2 : 1)); escurecer(t, hex("#141028"), Math.max(0, h - 0.4) * 1.05); }
}
function frente(t, cam, h = 0) { const m = (x) => { const xx = (((x - cam * 1.6) % 200) + 200) % 200 - 50; blit(t, SPR.kMoita[0], xx, H - 14, { tinta: hex("#1c1424"), k: 0.5 + h * 0.3 }); }; m(80); m(90); }
const cav = (t, fr, cx, op = {}) => pe(t, fr, cx, CHAO, op);
// baú: fechado / abrindo (comum ou ouro) / aberto
function bau(t, x, tt, t0, ouro = false) {
  if (tt < t0) return pe(t, SPR.bau[0], x, CHAO + 1);
  const q = tt - t0; const arr = ouro ? SPR.bauOuro : SPR.bauAbre;
  pe(t, anim(arr, q, ouro ? 16 : 14, false), x, CHAO + 1);
}
// item que sai do baú: sobe, fica um instante, e voa pro HUD (ou, se for bota, é jogado pra trás)
const HUDP = [10, 63], HUDO = [10, 75];
function saiItem(t, tt, t0, n, x) {
  const q = tt - t0; if (q < 0) return;
  const sobe = eo(seg(q, 0, 0.22)), y0 = CHAO - 10;
  if (n === "bota") {
    if (q < 0.75) { item(t, n, x, y0 - sobe * 20 + Math.round(Math.sin(q * 9) * (q > 0.25 ? 1 : 0))); return; }
    const p = seg(q, 0.75, 1.25); if (p >= 1) return; item(t, n, x - p * 60, y0 - 20 - Math.sin(p * Math.PI) * 18 + p * 30); return;
  }
  if (q < 0.6) { item(t, n, x, y0 - sobe * 20); return; }
  const p = eio(seg(q, 0.6, 0.95)); if (p >= 1) return; const [hx, hy] = n === "ouro" ? HUDO : HUDP;
  item(t, n, x + (hx + 6 - x) * p, y0 - 20 + (hy + 6 - (y0 - 20)) * p - Math.sin(p * Math.PI) * 14);
}
// HUD: inventário (pedra/ouro) + relógio
function hud(t, tt, pedras, ouros, hora = null) {
  painel(t, 4, 58, 40, 27, { k: 0.75 });
  item(t, "pedra", 13, 70); textoBorda(t, "x" + pedras, 21, 63, U.papel, U.tinta);
  item(t, "ouro", 13, 82); textoBorda(t, "x" + ouros, 21, 75, ouros ? U.ouro : U.papel, U.tinta);
  if (hora !== null) { const hh = Math.floor(hora) % 24, mm = Math.floor((hora % 1) * 60); const s = String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0"); painel(t, 93, 58, 38, 15, { k: 0.75 }); textoBorda(t, s, 98, 62, hh < 6 || hh >= 22 ? U.verm : U.papel, U.tinta); }
}
function legenda(tl, tt) { const f = frase(tt); if (!f) return; quebra(tl, f, 116).forEach((l, i) => textoBorda(tl, l, (W - tl.larguraTexto(l)) >> 1, 30 + i * 11, U.papel, U.tinta)); }

// ---------- tempos (das palavras) ----------
const t = {};
if (COM_INTRO) { t.esse = T("esse"); t.guarda = T("guarda"); t.doze = T("doze"); t.duas = T("duas"); t.vento = T("vento"); }
t.achou = T("achou"); t.abriu = T("abriu", t.achou); t.bota = T("bota"); t.outro1 = T("outro"); t.pedra1 = T("pedra"); t.outro2 = T("outro", t.pedra1 + 0.1);
t.pedra2 = T("pedra", t.outro2); t.outro3 = T("outro", t.pedra2 + 0.1); t.ouro = T("ouro"); t.parou = T("parou");
t.cientista = T("um", t.parou); t.skinner = T("skinner"); t.pombo = T("pombo"); t.se1 = T("se", t.pombo); t.toda = T("toda"); t.bicava = T("bicava"); t.comia = T("comia"); t.embora = T("embora");
t.se2 = T("se", t.embora); t.vez = T("vez", t.se2); t.naoParava = T("não", t.se2); t.bicar = T("bicar");
t.porque = T("porque"); t.bom = T("bom"); t.tres = T("três"); t.tem = T("tem", t.tres); t.quarenta = T("quarenta"); t.mais = T("mais", t.quarenta); t.abre = T("abre"); t.vende = T("vende"); t.comenta = T("comenta");
export const TEMPOS = t;

// ---------- cena 0 (pré-lore): quem é o Bira ----------
// o portão norte: dois mourões e uma folha de tábuas com dobradiça no mourão esquerdo. abre = 0..1
const MAD = { c: hex("#9f803f"), m: hex("#69552a"), e: hex("#3a2418"), p: hex("#868273"), pc: hex("#c7c7b0"), pe: hex("#3a3836") };
function portao(tl, x0, abre) {
  const topo = CHAO - 34, L = 32;
  const mourao = (x) => { for (let y = topo - 4; y < CHAO; y++) for (let i = 0; i < 5; i++) tl.px(x + i, y, i === 0 || i === 4 ? CONT : i === 1 ? MAD.pc : y % 7 === 0 ? MAD.pe : MAD.p); tl.hline(x - 1, x + 5, topo - 5, CONT); tl.hline(x, x + 4, topo - 4, MAD.pc); };
  // a folha gira na dobradiça: largura aparente = L*cos(a); a borda livre sobe 1 px quando abre (perspectiva)
  const a = abre * 1.25, w = Math.max(2, Math.round(L * Math.cos(a))), xa = x0 + 5;
  for (let i = 0; i < w; i++) {
    const u = i / w, xx = xa + i, sobe = Math.round(u * abre * 3), y0 = topo + 3 - sobe, y1 = CHAO - 2 + sobe;
    const tabua = Math.floor(u * 6), borda = Math.floor(((i + 1) / w) * 6) !== tabua || i === w - 1;
    for (let y = y0; y <= y1; y++) {
      const trave = Math.abs(y - (y0 + 4)) <= 1 || Math.abs(y - (y1 - 4)) <= 1, diag = Math.abs((y - y0) - Math.round((1 - u) * (y1 - y0))) <= 1 && y > y0 + 5 && y < y1 - 5;
      tl.px(xx, y, y === y0 || y === y1 || borda ? CONT : trave ? MAD.c : diag ? MAD.e : (tabua % 2 ? MAD.m : mistura(MAD.m, MAD.c, 0.35)));
    }
  }
  mourao(x0); mourao(x0 + L + 5);
}
function cena0(tl, tt) {
  campo(tl, 150, tt, 0);
  // o vento abre o portão um pouco e ele bate de volta, balançando
  const qv = t.vento ? tt - (t.vento + 0.15) : -1;
  const abre = qv < 0 ? 0 : qv < 0.3 ? eo(qv / 0.3) * 0.95 : Math.max(0, 0.95 * Math.cos((qv - 0.3) * 6) * Math.exp(-(qv - 0.3) * 3));
  portao(tl, 80, abre);
  cav(tl, anim(SPR.kIdle, tt), 44);
  // plaquinha de nome em cima da cabeça, como NPC de jogo
  if (tt >= t.esse) { const p = eo(seg(tt, t.esse, t.esse + 0.25)); const w = tl.larguraTexto("BIRA") + 8, y = CHAO - 52 - Math.round((1 - p) * 4); painel(tl, 44 - (w >> 1), y, w, 13, { k: 0.8 }); textoBorda(tl, "BIRA", 44 - (w >> 1) + 4, y + 3, U.papel, U.tinta); }
  if (tt < t.guarda - 0.05) return frente(tl, 150);
  frente(tl, 150);
  const p = eo(seg(tt, t.guarda - 0.05, t.guarda + 0.25)), y0 = 66 + Math.round((1 - p) * 8);
  painel(tl, 8, y0, 119, 72, { k: 0.88 });
  const linha = (k, v, y, cor = U.papel) => { textoBorda(tl, k, 14, y0 + y, U.cinza, U.tinta); textoBorda(tl, v, 14 + tl.larguraTexto(k) + 5, y0 + y, cor, U.tinta); };
  linha("CLASSE", "GUARDA", 6); textoBorda(tl, "LV 1", 104, y0 + 6, U.ouro, U.tinta);
  linha("POSTO", "PORTÃO NORTE", 18);
  if (tt >= t.doze) linha("SERVIÇO", "12 ANOS", 32);
  if (tt >= t.duas) { const q = eo(seg(tt, t.duas, t.duas + 0.2)); linha("PORTÃO ABRIU", "2x", 46, q < 1 && Math.floor(tt * 20) % 2 ? U.branco : U.ouro); }
  if (tt >= t.vento) { textoBorda(tl, "(1 FOI O VENTO)", 14, y0 + 58, U.cinza, U.tinta); }
  // a rajada: riscos de vento de 1 px cruzando a tela
  const q = tt - t.vento; if (q >= 0 && q < 0.9) for (let i = 0; i < 7; i++) { const x = Math.round(-30 + (q - i * 0.06) * 260), y = 160 + i * 5 + Math.round(Math.sin(q * 12 + i) * 1.5), L = 16 + (i % 3) * 6; for (let k = 0; k < L; k++) tl.px(x - k, y, k < 3 ? U.branco : mistura(U.branco, tl.C[Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x - k))], 0.5)); }
}
// ---------- cena A: os quatro primeiros baús, câmera acompanhando ----------
// baú k no mundo em x = 100 + 70k; o Bira para 30 px antes
const AB = [t.abriu, t.pedra1 - 0.3, t.pedra2 - 0.3, t.ouro - 0.25];
const RES = ["bota", "pedra", "pedra", "ouro"];
const BX = (k) => 100 + 70 * k;
const SAI = (k) => AB[k] + (k === 0 ? 1.2 : 0.5);
function biraX(tt) {
  // chega em cada baú 0.35 s antes de abrir; sai 0.5 s depois
  if (tt < AB[0] - 0.35) return 30 + (BX(0) - 30 - 30) * eio(seg(tt, t.achou - 0.6, AB[0] - 0.35));
  for (let k = 0; k < 3; k++) { const s0 = SAI(k), s1 = AB[k + 1] - 0.35; if (tt < s1) return BX(k) - 30 + (BX(k + 1) - BX(k)) * eio(seg(tt, s0, s1)); }
  return BX(3) - 30;
}
function correndo(tt) { if (tt < AB[0] - 0.35) return tt > t.achou - 0.6; for (let k = 0; k < 3; k++) if (tt > SAI(k) && tt < AB[k + 1] - 0.35) return true; return false; }
function cenaA(tl, tt) {
  const bx = biraX(tt), cam = bx - 45, h = 0.15 * seg(tt, AB[3], t.parou);
  campo(tl, cam, tt, h);
  for (let k = 0; k < 4; k++) bau(tl, BX(k) - cam, tt, AB[k], RES[k] === "ouro");
  let fr = correndo(tt) ? anim(SPR.kRun, tt, 12) : anim(SPR.kIdle, tt);
  for (let k = 0; k < 4; k++) { const q = tt - AB[k]; if (q > -0.3 && q < 0.45) fr = SPR.kCrouch[q < -0.15 ? 0 : q < 0.3 ? 1 : 0]; }
  cav(tl, fr, bx - cam);
  for (let k = 0; k < 4; k++) saiItem(tl, tt, AB[k] + 0.2, RES[k], BX(k) - cam);
  if (tt >= AB[3]) { fx(tl, "ouroA", "brilho", AB[3] + 0.25, tt, { x: BX(3) - cam, y: CHAO - 22, n: 5, raio: 12, braco: 3 }); fx(tl, "ouroB", "brilho", AB[3] + 0.9, tt, { x: BX(3) - cam, y: CHAO - 16, n: 3, raio: 9, braco: 2, seed: 4 }); }
  if (tt >= AB[3]) fx(tl, "ouroLv", "levelup", AB[3] + 0.18, tt, { x: BX(3) - cam, y: CHAO });
  frente(tl, cam);
  { const q = tt - (AB[3] + 0.18); if (q >= 0 && q < 0.15) tremer(tl, Math.floor(q * 30) % 2 ? -1 : 1); }
  const pedras = (tt >= AB[1] + 1.15 ? 1 : 0) + (tt >= AB[2] + 1.15 ? 1 : 0), ouros = tt >= AB[3] + 1.15 ? 1 : 0;
  if (tt >= AB[1]) hud(tl, tt, pedras, ouros);
}
// ---------- cena B: montagem, um corte por baú, a tarde vira noite ----------
const M0 = () => t.parou - 0.15, M1 = () => t.se1 - 0.1;
function montagem(tt) { const d = 0.42, n = Math.floor((tt - M0()) / d), q = tt - M0() - n * d; return { n, q, d }; }
const sorte = (n) => (n === 9 || n === 23 ? "ouro" : "pedra");
function contagem(tt) { // pedras e ouros acumulados até tt
  let p = 2, o = 1; if (tt < M0()) return [p, o];
  const { n, q } = montagem(tt); for (let i = 0; i < n; i++) sorte(i) === "ouro" ? o++ : p++;
  if (q > 0.36) sorte(n) === "ouro" ? o++ : p++;
  return [p, o];
}
function cenaB(tl, tt) {
  const { n, q } = montagem(tt), pos = n * 37, h = Math.min(0.95, 0.15 + n * 0.035);
  campo(tl, pos, tt, h);
  bau(tl, 84, tt, tt - q + 0.04, sorte(n) === "ouro");
  cav(tl, SPR.kCrouch[q < 0.12 ? 0 : 1], 56);
  const r = sorte(n); if (q > 0.12) { const yy = CHAO - 10 - eo(seg(q, 0.12, 0.3)) * 16; item(tl, r, 84, yy); }
  if (r === "ouro") fx(tl, "ouroM" + n, "brilho", tt - q + 0.15, tt, { x: 84, y: CHAO - 22, n: 4, raio: 10, braco: 3 });
  // o pombo chega no "Skinner" e pousa na tampa
  if (tt >= t.cientista) { const p = seg(tt, t.cientista, t.skinner + 0.2); const px = 84 + (1 - eo(p)) * 70, py = CHAO - 16 - (1 - eo(p)) * 70; pombo(tl, p < 1 ? (Math.floor(tt * 12) % 2 ? "voa1" : "voa2") : "em_pe", px, py, true); }
  frente(tl, pos, h);
  const [p, o] = contagem(tt); hud(tl, tt, p, o, 14 + (tt - M0()) * 1.9);
}
// ---------- cena C: o pombo que ganha sempre (dia calmo) ----------
// moeda que pula do baú pro chão na frente do pombo
const PX = 58, MX = 67;
function moedaPula(tl, q, bx) { if (q < 0) return false; const u = eo(seg(q, 0, 0.32)); if (u >= 1) return true; item(tl, "ouro", bx - 4 + (MX - (bx - 4)) * u, CHAO - 13 + 13 * u - Math.sin(u * Math.PI) * 12); return false; }
function montinho(tl, n) { for (let k = 0; k < n; k++) item(tl, "ouro", MX + (k % 3) * 4 - 4, CHAO - Math.floor(k / 3) * 3); }
function cenaC(tl, tt) {
  campo(tl, 400, tt, 0);
  const bx = 80; pe(tl, SPR.bau[0], bx, CHAO + 1);
  const bicadas = [t.toda, t.bicava], sai = t.embora - 0.15;
  let pose = "em_pe", px = PX, py = CHAO, n = 0;
  for (const b of bicadas) { const q = tt - b; if (q >= 0 && q < 0.18) pose = "bica"; if (moedaPula(tl, q - 0.08, bx)) n += 2; }
  if (tt >= t.comia) n = Math.max(0, n - Math.floor((tt - t.comia) / 0.3));
  montinho(tl, n);
  if (tt >= t.comia && tt < sai) pose = Math.floor(tt * 6) % 2 ? "bica" : "em_pe";
  if (tt >= sai) { const p = seg(tt, sai, sai + 0.9); pose = Math.floor(tt * 14) % 2 ? "voa1" : "voa2"; px = PX - p * 80; py = CHAO - eo(p) * 100; }
  pombo(tl, pose, px, py);
  frente(tl, 400);
  painel(tl, 31, 96, 73, 15, { k: 0.75, borda: U.ouro }); textoBorda(tl, "SEMPRE GANHA", 37, 100, U.ouro, U.tinta);
}
// ---------- cena D: o pombo que ganha às vezes; depois o Bira, igual ----------
const SORTE_D = (i) => i === 5 || i === 12;
function cenaD(tl, tt) {
  const bira = tt >= t.naoParava;
  campo(tl, bira ? 520 : 400, tt, bira ? 0.95 : 0);
  if (!bira) {
    const bx = 80; pe(tl, SPR.bau[0], bx, CHAO + 1);
    const i = Math.floor((tt - t.se2) / 0.16), q = (tt - t.se2) % 0.16;
    let n = 0; for (const k of [5, 12]) if (moedaPula(tl, tt - (t.se2 + k * 0.16 + 0.05), bx)) n++;
    montinho(tl, n);
    pombo(tl, q < 0.07 ? "bica" : "em_pe", PX, CHAO);
    if (!SORTE_D(i) && i % 2 === 0) fx(tl, "pp" + i, "golpe", t.se2 + i * 0.16, tt, { x: 66, y: CHAO - 4, forca: 0, palette: RAMPA.fraco, chao: 4 });
    frente(tl, 400);
    painel(tl, 20, 96, 95, 15, { k: 0.75, borda: U.cinza }); textoBorda(tl, "DE VEZ EM QUANDO", 26, 100, U.papel, U.tinta);
    return;
  }
  // o Bira, de noite, no mesmo ritmo do pombo
  const i = Math.floor((tt - t.naoParava) / 0.3), q = (tt - t.naoParava) % 0.3;
  bau(tl, 84, tt, tt - q + 0.03); cav(tl, SPR.kCrouch[q < 0.1 ? 0 : 1], 56);
  if (q > 0.1) item(tl, "pedra", 84, CHAO - 10 - eo(seg(q, 0.1, 0.25)) * 14);
  pombo(tl, Math.floor(tt * 6.6) % 2 ? "bica" : "em_pe", 22, CHAO);
  frente(tl, 520, 0.95);
  const [p, o] = contagem(M1()); hud(tl, tt, p + i + (q > 0.25 ? 1 : 0), o, 1 + (tt - t.naoParava) * 0.6);
}
// ---------- cena E: o próximo pode ser o bom ----------
function cenaE(tl, tt) {
  campo(tl, 560, tt, 1);
  pe(tl, SPR.bau[0], 84, CHAO + 1);
  cav(tl, anim(SPR.kIdle, tt), 44);
  // só o baú fica aceso: escurece tudo fora de um círculo nele
  const r = 26 + Math.sin(tt * 3) * 1.5; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = x - 84, dy = y - (CHAO - 10), d = Math.sqrt(dx * dx + dy * dy); if (d > r) tl.C[y * W + x] = mistura(tl.C[y * W + x], U.tinta, Math.min(0.85, (d - r) / 18)); }
  fx(tl, "glint", "brilho", t.bom - 0.1, tt, { x: 92, y: CHAO - 22, n: 2, raio: 6, braco: 3, seed: 9 });
  const [p, o] = contagem(M1()); hud(tl, tt, 46, o, 2.9);
}
// ---------- cena F: três da manhã, 47 pedras, e a escolha ----------
function pilha(tl, n, x0) { // pilha de pedras ao lado dele
  // monte: fileiras que estreitam pra cima, cada pedra com um desvio sorteado
  const LARG = [12, 10, 9, 7, 5, 3, 1]; let i = 0;
  for (let fila = 0; i < n && fila < LARG.length; fila++) { const nf = LARG[fila]; for (let k = 0; k < nf && i < n; k++, i++) item(tl, "pedra", x0 + (12 - nf) * 2.5 + k * 5 + Math.round((hash(i * 7 + 1) - 0.5) * 3), CHAO - fila * 4 + Math.round(hash(i * 13 + 5) * 2)); }
}
function cenaF(tl, tt) {
  campo(tl, 600, tt, 1);
  [[8, 1], [126, 1]].forEach(([x]) => pe(tl, SPR.bauAberto[0], x, CHAO + 1));
  pilha(tl, Math.round(47 * eo(seg(tt, t.tem - 0.2, t.quarenta + 0.6))), 4);
  cav(tl, anim(SPR.kIdle, tt), 64);
  pe(tl, SPR.bau[0], 106, CHAO + 1);
  if (Math.floor(tt * 1.5) % 3 === 0) fx(tl, "gF" + Math.floor(tt * 1.5), "brilho", Math.floor(tt * 1.5) / 1.5, tt, { x: 112, y: CHAO - 22, n: 1, raio: 0, braco: 2, seed: 3 });
  frente(tl, 600, 1);
  const [, o] = contagem(M1()); hud(tl, tt, tt >= t.quarenta ? 47 : 46, o, 3);
  const bot = (n, txt, y, t0, cor) => { if (tt < t0) return; const p = eo(seg(tt, t0, t0 + 0.25)); const x = 10; y += Math.round((1 - p) * 6); painel(tl, x, y, 115, 22, { borda: cor, k: 0.9 }); tl.rect(x + 4, y + 4, 14, 14, cor); tit(tl, n, x + 8, y + 6, U.tinta, cor); textoBorda(tl, txt, x + 24, y + 8, U.papel, U.tinta); };
  bot("1", "ABRE MAIS UM", 96, t.abre, U.ouro); bot("2", "VENDE E DORME", 124, t.vende, U.azul);
  // cursor de menu de jogo pulando entre as duas opções (o espectador escolhe)
  if (tt >= t.comenta) { const k = Math.floor((tt - t.comenta) / 0.55) % 2, y = (k ? 124 : 96) + 6, dx = Math.floor(tt * 4) % 2; tl.sprite(["Y..", "YY.", "YYY", "YY.", "Y.."], { Y: k ? U.azul : U.ouro }, 3 + dx, y + 2, { contorno: CONT }); }
}

// ---------- montagem ----------
const PLANOS = [
  ...(COM_INTRO ? [[0, t.achou - 0.7, cena0]] : []), [COM_INTRO ? t.achou - 0.7 : 0, M0(), cenaA], [M0(), M1(), cenaB], [M1(), t.se2 - 0.05, cenaC], [t.se2 - 0.05, t.porque - 0.05, cenaD],
  [t.porque - 0.05, t.tres - 0.1, cenaE], [t.tres - 0.1, 999, cenaF],
];
export { PLANOS };
export function quadro(tt) {
  const tl = new Tela(W, H);
  const pl = PLANOS.find(([a, b]) => tt >= a && tt < b) || PLANOS.at(-1);
  pl[2](tl, tt);
  if (tt - pl[0] < 1 / FPS && pl[0] > 0) escurecer(tl, U.tinta, 0.5);
  legenda(tl, tt);
  if (tt < 0.25) escurecer(tl, U.tinta, 1 - tt / 0.25);
  return tl;
}
