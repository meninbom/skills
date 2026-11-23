// Sprites-placeholder feitos por código: mesmos nomes, mesmos tamanhos de quadro e mesma contagem de quadros
// que o sprites/prep.py gera a partir dos packs reais. Servem para o demo e para animar antes de baixar os packs.
// node sprites/placeholder.mjs   -> sprites/assets/*.rgba + sprites/assets/index.json
import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { hex } from "../motor/core.mjs";

const AQUI = new URL(".", import.meta.url);
const CONT = hex("#1a0e13");
class Q {
  constructor(w, h) { this.w = w; this.h = h; this.C = new Uint32Array(w * h); }
  px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.C[y * this.w + x] = c; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c); }
  // contorno de 1 px em volta de tudo que foi pintado, como nos sprites de artista
  contorno(c = CONT) {
    const o = this.C.slice(), g = (x, y) => x >= 0 && y >= 0 && x < this.w && y < this.h && o[y * this.w + x];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (!g(x, y) && (g(x - 1, y) || g(x + 1, y) || g(x, y - 1) || g(x, y + 1))) this.C[y * this.w + x] = c;
    return this;
  }
}
const L = {};

// ---------- cavaleiro (quadro 120x80, pé perto da base) ----------
const A = { claro: hex("#c7c7b0"), meio: hex("#868273"), esc: hex("#3a3836"), couro: hex("#9f803f"), couroE: hex("#69552a"), pluma: hex("#c0392b"), lam: hex("#e8e8f0") };
function cavaleiro({ sobe = 0, agacha = 0, pernaA = 0, pernaB = 0, inclina = 0, espada = 0 } = {}) {
  const q = new Q(120, 80), base = 77, cx = 56 + inclina;
  const perna = 9 - agacha, tronco = 13 - (agacha >> 1), topoPerna = base - perna, topoTronco = topoPerna - tronco + sobe;
  q.rect(52 + pernaA, topoPerna, 4, perna, A.esc); q.rect(52 + pernaA, base - 1, 5, 2, A.couroE);          // perna de trás
  q.rect(58 + pernaB, topoPerna, 4, perna, A.meio); q.rect(58 + pernaB, base - 1, 5, 2, A.couro);           // perna da frente
  q.rect(cx - 5, topoTronco, 12, tronco + 1, A.meio); q.rect(cx - 5, topoTronco, 4, tronco + 1, A.claro);   // tronco (luz à esquerda)
  q.rect(cx - 5, topoTronco + tronco - 2, 12, 2, A.couro);                                                 // cinto
  q.rect(cx - 4, topoTronco - 9, 10, 9, A.meio); q.rect(cx - 4, topoTronco - 9, 3, 9, A.claro);             // elmo
  q.rect(cx + 1, topoTronco - 5, 5, 2, A.esc);                                                             // viseira
  q.rect(cx - 2, topoTronco - 12, 3, 3, A.pluma); q.rect(cx - 5, topoTronco - 11, 3, 2, A.pluma);           // pluma
  // braço + espada: 0 = na cintura, apontando para baixo; 1..3 = do alto até a frente
  const ox = cx + 7, oy = topoTronco + 3;
  q.rect(ox, oy, 3, 6, A.claro);
  if (espada === 0) { q.rect(ox + 1, oy + 6, 2, Math.max(3, 11 - agacha), A.lam); q.rect(ox - 1, oy + 6, 6, 1, A.couro); }
  else { const a = [0, -1.1, -0.4, 0.3][espada]; for (let i = 0; i < 14; i++) q.rect(ox + 2 + Math.cos(a) * i, oy + 2 + Math.sin(a) * i, 2, 2, A.lam); q.rect(ox + 1, oy + 1, 3, 3, A.couro); }
  return q.contorno();
}
const S = (i, n, amp) => Math.round(Math.sin((i / n) * Math.PI * 2) * amp);
const seq = (n, fn) => Array.from({ length: n }, (_, i) => cavaleiro(fn(i)));
L.kIdle = seq(10, (i) => ({ sobe: i >= 3 && i <= 6 ? 1 : 0 }));
L.kRun = seq(10, (i) => ({ pernaA: S(i, 10, 4), pernaB: -S(i, 10, 4), inclina: 2, sobe: Math.abs(S(i, 10, 1)) }));
L.kCrouch = seq(3, (i) => ({ agacha: [2, 5, 5][i] }));
L.kDash = seq(2, () => ({ inclina: 4, pernaA: -4, pernaB: 4 }));
L.kAtk = seq(4, (i) => ({ espada: [1, 2, 3, 3][i], inclina: i > 0 ? 2 : 0 }));
L.kAtk2 = seq(6, (i) => ({ espada: [1, 1, 2, 3, 3, 2][i], inclina: 2 }));
L.kCombo = seq(10, (i) => ({ espada: [1, 2, 3, 3, 1, 2, 3, 3, 2, 1][i], inclina: 2 }));
L.kHit = seq(1, () => ({ inclina: -3, sobe: 1 }));
L.kRoll = seq(12, (i) => ({ agacha: 5, inclina: S(i, 12, 3) }));
L.kJump = seq(3, () => ({ pernaA: -2, pernaB: 2, sobe: -1 }));
L.kFall = seq(3, () => ({ pernaA: 2, pernaB: -2, sobe: 1 }));
L.kTurn = seq(3, (i) => ({ inclina: [-2, 0, 2][i] }));
L.kDeath = seq(10, (i) => ({ agacha: Math.min(6, i), inclina: -Math.min(5, i) }));

// ---------- cenário (camadas de 512x320; o motor encosta a linha 320 logo abaixo do chão) ----------
{
  const q = new Q(512, 320), faixas = ["#3f7fd0", "#5a98dc", "#7db4e6", "#a5d0ee", "#cfe8f4"].map(hex); // céu em faixas duras, sem degradê
  for (let y = 0; y < 320; y++) {
    const k = Math.max(0, Math.min(4, Math.floor((y - 90) / 42))), borda = k < 4 && (y - 90) % 42 > 38;
    for (let x = 0; x < 512; x++) q.C[y * 512 + x] = faixas[borda && (x + y) % 2 ? k + 1 : k];
  }
  L.kCeu = [q];
}
{
  const q = new Q(512, 320), br = hex("#f4f8ff"), so = hex("#c4dcf0");
  for (const [x, y, w] of [[20, 128, 46], [150, 150, 34], [250, 120, 58], [370, 160, 40], [450, 135, 38]]) { q.rect(x, y + 5, w, 5, so); q.rect(x + 2, y + 3, w - 4, 5, br); q.rect(x + 8, y, w - 22, 4, br); q.rect(x + w - 16, y + 1, 9, 3, br); }
  L.kNuvem = [q];
}
function serra(cor, corTopo, base, amp, passo, degrau) {
  const q = new Q(512, 320);
  for (let x = 0; x < 512; x++) {
    const u = x % passo, tri = Math.abs(u - passo / 2) / (passo / 2);
    const topo = base - Math.round(((1 - tri) * amp) / degrau) * degrau + (Math.floor(x / passo) % 2) * 6;
    for (let y = topo; y < 320; y++) q.C[y * 512 + x] = y - topo < 3 ? corTopo : cor;
  }
  return q;
}
L.kMont = [serra(hex("#7f9fcc"), hex("#a9c2e2"), 262, 46, 128, 3)];
L.kMorro = [serra(hex("#4c9a62"), hex("#7cc47a"), 284, 20, 64, 2)];
{
  const q = new Q(16, 96), g1 = hex("#7cc47a"), g2 = hex("#4c9a62"), t1 = hex("#9d7053"), t2 = hex("#6a4955"); // grama na linha 4, terra abaixo
  for (const x of [1, 6, 7, 12]) { q.px(x, 3, g1); if (x % 2) q.px(x, 2, g1); }
  q.rect(0, 4, 16, 2, g1); q.rect(0, 6, 16, 3, g2); q.rect(0, 9, 16, 87, t1);
  for (const x of [2, 3, 9, 13]) q.px(x, 9, g2);
  for (let y = 12; y < 96; y += 5) for (const x of [(y * 3) % 16, (y * 7 + 5) % 16]) q.rect(x, y, 2, 1, t2);
  L.kChao = [q];
}
{
  const q = new Q(61, 15), m = hex("#9f803f"), e = hex("#69552a");
  q.rect(1, 4, 59, 2, m); q.rect(1, 9, 59, 2, e);
  for (let x = 3; x < 58; x += 13) { q.rect(x, 1, 4, 13, m); q.rect(x + 3, 1, 1, 13, e); }
  L.kCerca = [q.contorno()];
}
{
  const q = new Q(41, 12), g1 = hex("#7cc47a"), g2 = hex("#3d7f52");
  for (const [x, y, w] of [[1, 6, 12], [8, 2, 14], [20, 4, 12], [29, 7, 11]]) { q.rect(x, y, w, 11 - y, g2); q.rect(x + 1, y, w - 3, 2, g1); }
  L.kMoita = [q.contorno()];
}
function arvore(v) {
  const q = new Q(57, 77), tr = hex("#69552a"), trC = hex("#9f803f"), g1 = hex("#7cc47a"), g2 = hex("#4c9a62"), g3 = hex("#3d7f52");
  q.rect(25, 44, 7, 32, tr); q.rect(25, 44, 2, 32, trC);
  for (const [x, y, w, h] of v ? [[8, 22, 40, 26], [14, 8, 30, 18], [22, 1, 14, 9]] : [[4, 26, 48, 22], [10, 12, 36, 18], [18, 2, 20, 12]]) { q.rect(x, y, w, h, g2); q.rect(x + 1, y + 1, w >> 1, 3, g1); q.rect(x + (w >> 1), y + h - 4, (w >> 1) - 1, 3, g3); }
  return q.contorno();
}
L.kArvore = [arvore(0), arvore(1)];

// ---------- baú (quadro 64x32, base perto de y = 31) ----------
const B = { m: hex("#9f803f"), e: hex("#69552a"), f: hex("#868273"), o: hex("#f2c443"), oC: hex("#fff6c8"), oE: hex("#c8781e"), dentro: hex("#3a2418") };
function bau(abre, ouro = 0, pisca = 0) { // abre 0..1: a tampa levanta; ouro 0..1: o monte de ouro sobe
  const q = new Q(64, 32), x = 21, w = 22, yb = 30, hc = 9, boca = yb - hc;
  q.rect(x, boca, w, hc + 1, B.m); q.rect(x, boca + 4, w, 2, B.e); q.rect(x + 2, boca, 2, hc + 1, B.f); q.rect(x + w - 4, boca, 2, hc + 1, B.f); // corpo com ferragens
  if (abre <= 0) {
    q.rect(x, boca - 6, w, 6, B.m); q.rect(x + 1, boca - 7, w - 2, 1, B.m); q.rect(x, boca - 2, w, 1, B.e);
    q.rect(x + 2, boca - 6, 2, 6, B.f); q.rect(x + w - 4, boca - 6, 2, 6, B.f); q.rect(x + w / 2 - 1, boca - 2, 3, 4, B.o); // fecho
  } else {
    const sobe = Math.round(abre * 9), alt = Math.max(2, Math.round(6 - abre * 3)), yt = boca - 2 - sobe - alt;
    q.rect(x + 1, boca - 2 - sobe, w - 2, sobe + 2, B.dentro);                                   // forro da tampa aberta
    if (ouro > 0) { const n = Math.round(ouro * 5); q.rect(x + 2, boca - 1 - n, w - 4, n + 1, B.o); q.rect(x + 4, boca - 1 - n, w - 10, 1, B.oC); q.rect(x + 3, boca - 1, w - 6, 1, B.oE); if (pisca) { q.px(x + 5 + ((pisca * 3) % 11), boca - 2 - n, B.oC); q.px(x + 16 - (pisca % 5), boca - n, B.oC); } }
    q.rect(x, yt, w, alt, B.e); q.rect(x, yt, w, 1, B.m); q.rect(x + 2, yt, 2, alt, B.f); q.rect(x + w - 4, yt, 2, alt, B.f);
  }
  return q.contorno();
}
L.bau = [bau(0)];
L.bauAbre = Array.from({ length: 9 }, (_, i) => bau(Math.min(1, (i + 1) / 6)));
L.bauAberto = [bau(1)];
L.bauOuro = Array.from({ length: 16 }, (_, i) => bau(Math.min(1, (i + 1) / 6), Math.max(0, Math.min(1, (i - 3) / 5)), i > 7 ? i : 0));
L.brilho = Array.from({ length: 12 }, (_, i) => {
  const q = new Q(24, 24), r = Math.round(Math.sin(((i + 0.5) / 12) * Math.PI) * 8);
  for (let k = 1; k <= r; k++) { const c = k > r * 0.6 ? B.o : B.oC; q.px(12 + k, 12, c); q.px(12 - k, 12, c); q.px(12, 12 + k, c); q.px(12, 12 - k, c); }
  q.px(12, 12, hex("#ffffff")); return q;
});

// ---------- grava ----------
mkdirSync(new URL("assets/", AQUI), { recursive: true });
for (const f of readdirSync(new URL("assets/", AQUI))) if (f.endsWith(".rgba")) unlinkSync(new URL("assets/" + f, AQUI));
const idx = {};
for (const [k, qs] of Object.entries(L)) idx[k] = qs.map((q, i) => { const fn = `assets/${k}_${i}.rgba`; writeFileSync(new URL(fn, AQUI), Buffer.from(q.C.buffer)); return [fn, q.w, q.h]; });
writeFileSync(new URL("assets/index.json", AQUI), JSON.stringify(idx));
writeFileSync(new URL("assets/ORIGEM.txt", AQUI), "placeholder\n");
console.log("placeholders:", Object.entries(idx).map(([k, v]) => `${k} ${v.length}x(${v[0][1]}x${v[0][2]})`).join(", "));
