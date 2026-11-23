// palco.js — o palco do kit: monta o quadro em camadas, com câmera, enquadramento e legenda.
// Você quase nunca precisa mexer aqui. O que se troca fica em cenario.js (cores e desenho das camadas) e em cena.js (linha do tempo).
//
// ORDEM DE DESENHO de cada quadro (de trás para a frente):
//   1. céu      degradê que cobre o quadro inteiro (num interior, é a cor da parede)
//   2. fundo    o que está longe; quase não anda quando a câmera anda
//   3. meio     o que está entre o longe e a ação
//   4. chão     o piso onde o boneco pisa (anda junto com o boneco)
//   5. ação     o boneco e os objetos da cena
//   6. frente   o que passa na frente da câmera, desfocado (anda mais rápido que o boneco; no close ela some)
//   7. acabamento (sombra nas bordas), tempo (chuva ou neve, se o tema tiver) e, por último, a legenda
//
// MEDIDAS: o mundo é medido em "unidades do boneco" (um boneco jovem tem ~600 de altura). O chão é y = 0 e para cima é negativo.
// Cada camada tem `p` (paralaxe): 0 = parada no fundo, 1 = anda junto com o boneco, mais que 1 = na frente dele.
import * as B from '../boneco.js';
import * as M from '../motor.js';

// ENQUADRAMENTOS. altura = quanto da altura do quadro o boneco ocupa. chao = onde fica a linha do chão (0 = topo, 1 = base).
// No close o chão sai do quadro e quem manda é o rosto: `rosto` = onde fica o meio da cabeça.
export const PLANOS = {
  aberto: { altura: 0.36, chao: 0.70 },
  medio: { altura: 0.56, chao: 0.70 },
  close: { altura: 1.75, rosto: 0.40 },
};

// sorteio fixo: o mesmo número sempre dá o mesmo resultado (o render repete igual toda vez)
export const sorte = (i, k = 0) => { const s = Math.sin(i * 127.1 + k * 311.7 + 0.5) * 43758.5453; return s - Math.floor(s); };
// repete um desenho a cada `passo` unidades, só na parte que aparece. fn(x, i): x = posição, i = número da repetição
export function repete(v, passo, fn, folga = passo) { for (let i = Math.floor((v.x0 - folga) / passo); i <= Math.ceil((v.x1 + folga) / passo); i++) fn(i * passo, i); }
export const alturaDe = R => R.pe + R.coxa + R.canela + R.tronco + R.pesc + R.cabR * 1.9;       // do chão ao topo da cabeça
export const rostoDe = R => R.pe + R.coxa + R.canela + R.tronco + R.pesc + R.cabR * 0.86;       // do chão ao meio da cabeça
const lerp = B.lerp;

// cv = o <canvas>; tema = um tema do cenario.js; W, H = tamanho do quadro; R = medidas do boneco principal (ch.R)
export function criaPalco(cv, tema, W, H, R) {
  cv.width = W; cv.height = H;
  const g = M.inicia(cv), U = Math.min(W, H) / 1080;                        // U = escala do quadro (1 em 1080×1920 e em 1920×1080)
  const FOLGA = Math.ceil(40 * U), tmp = M.mk(W + FOLGA * 2, H + FOLGA * 2), tg = tmp.getContext('2d');   // tela auxiliar das camadas desfocadas
  B.setAmb(tema.amb.m, tema.amb.a); B.setLuz(tema.luz);
  // câmera de um enquadramento. o = { x: para onde a câmera olha, zoom: 1 = o do plano, 1.05 = 5% mais perto }
  const camera = (plano, o = {}) => {
    const p = PLANOS[plano] || PLANOS.medio, z = p.altura * H / alturaDe(R) * (o.zoom || 1);
    return { x: o.x || 0, z, gy: p.rosto != null ? p.rosto * H + rostoDe(R) * z : p.chao * H };
  };
  // câmera apontada para um ponto qualquer do mundo: serve para detalhe de objeto, close de boneco sentado ou deitado, plano de cenário.
  // (x, y) = o ponto (lembre: para cima é negativo) · zoom 1 = um boneco de pé ocupa a altura inteira do quadro; 1.5 = 50% mais perto
  // yTela = em que altura do quadro o ponto fica (0 = topo, 0.5 = meio, 1 = base)
  const cameraEm = (x, y, zoom = 1, yTela = 0.5) => { const z = H / alturaDe(R) * zoom; return { x, z, gy: yTela * H - y * z }; };
  const misturaCam = (a, b, k) => ({ x: lerp(a.x, b.x, k), z: a.z * Math.pow(b.z / a.z, k), gy: lerp(a.gy, b.gy, k) });
  const base = camera('medio');                                             // a paralaxe é medida a partir do plano médio

  function chapa(L, t, cam) {
    if (!L || !L.desenha) return;
    const p = L.p ?? 1, zp = base.z * (1 + (cam.z / base.z - 1) * p), gyp = base.gy + (cam.gy - base.gy) * p, bl = (L.desfoque || 0) * U, borra = bl > 0.3;
    const m = FOLGA / zp, v = { x0: cam.x * p - W / 2 / zp - m, x1: cam.x * p + W / 2 / zp + m, y0: -gyp / zp - m, y1: (H - gyp) / zp + m };   // parte do mundo que aparece
    const a = borra ? tg : g, d = borra ? FOLGA : 0;
    if (borra) { tg.setTransform(1, 0, 0, 1, 0, 0); tg.clearRect(0, 0, tmp.width, tmp.height); }
    a.save(); a.setTransform(zp, 0, 0, zp, W / 2 - cam.x * p * zp + d, gyp + d); L.desenha(a, v, t, tema.cores); a.restore();
    if (borra) { g.save(); g.filter = `blur(${bl.toFixed(1)}px)`; g.drawImage(tmp, -FOLGA, -FOLGA); g.restore(); }
  }

  // desenha um quadro inteiro. acao(g) desenha o boneco e os objetos, já no mundo (chão em y = 0)
  function quadro(t, cam, acao) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none'; g.globalCompositeOperation = 'source-over';
    const s = g.createLinearGradient(0, 0, 0, H); tema.ceu.forEach((c, i, a) => s.addColorStop(a.length > 1 ? i / (a.length - 1) : 0, c)); g.fillStyle = s; g.fillRect(0, 0, W, H);
    chapa(tema.fundo, t, cam); chapa(tema.meio, t, cam); chapa(tema.chao, t, cam);
    g.save(); g.setTransform(cam.z, 0, 0, cam.z, W / 2 - cam.x * cam.z, cam.gy); acao(g); g.restore();
    const perto = cam.z / base.z;                                             // no close a frente some aos poucos, para não tapar o rosto
    if (perto < 1.6) { g.globalAlpha = 1 - M.st(1.15, 1.6, perto); chapa(tema.frente, t, cam); g.globalAlpha = 1; }
    const vi = tema.vinheta; if (vi && vi.forca > 0) { const r = Math.hypot(W, H) / 2, q = g.createRadialGradient(W / 2, H * 0.46, r * 0.45, W / 2, H * 0.5, r * 1.05); q.addColorStop(0, `rgba(${vi.cor},0)`); q.addColorStop(1, `rgba(${vi.cor},${vi.forca})`); g.fillStyle = q; g.fillRect(0, 0, W, H); }
    const tp = tema.tempo; if (tp && tp.desenha && tp.forca !== 0) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); tp.desenha(g, { W, H, U }, t, tema.cores); g.restore(); }   // chuva, neve: por cima de tudo, em pixels da tela
  }

  // legenda do motor (motor.js), encolhida ou ampliada para caber no tamanho deste quadro
  const legendaY = (H > W ? 0.77 : 0.86) * H / U;                           // altura padrão da legenda (em medidas de 1080 de largura)
  const legenda = (t, lista) => M.legenda(t, lista, { escala: U, dx: W / 2 - 540 * U });
  return { g, W, H, U, camera, cameraEm, misturaCam, quadro, legenda, legendaY };
}

// transforma uma fala em telas de legenda. telas = ['OI! ESSE É', 'O MEU *KIT*'] (2–3 palavras cada; *assim* fica em amarelo).
// Cada tela fica no ar um tempo proporcional ao número de letras, como no episódio de exemplo.
export function falaEmTelas(t0, dur, telas, y, cor) {
  const n = telas.map(x => x.replace(/[*]/g, '').length + 2), tot = n.reduce((a, b) => a + b, 0); let a = t0;
  return telas.map((tx, j) => { const d = dur * n[j] / tot, c = [a, a + d - 2 / 60, tx, y, cor]; a += d; return c; });
}
