// impactFrame2: impact frame no estilo de ANIME, como módulo.
//
// De onde veio: do golpe final de um curta 3D nosso ("Slime Slayer"). A lógica dos desenhos é a mesma do original;
// aqui ela só ganhou parâmetros (cena, câmera, renderer, canvases, tamanho e cor) para plugar em qualquer motor.
// Uma variante com semente por golpe e grão pré-feito está em motores/62/arena/arena.js (função impactFrame).
//
// O QUE FAZ
//   k = número do quadro a 60 qps desde o impacto (0..11). São 4 desenhos SEGURADOS, 12 q = 0,20 s no total:
//     k 0-1   (2 q, 33 ms)  clarão: fundo branco, silhuetas em cinza claro #d9d4cc
//     k 2-5   (4 q, 67 ms)  desenho 1: fundo preto #07070a, silhuetas brancas com sombra deslocada 46 px contra a força,
//                           16 pinceladas secas na direção do golpe (alpha 0,16), arco de corte na cor de destaque
//                           (raio 470, largura 150), respingo: 70 gotas brancas (alcance 900 px) + 14 na cor de destaque (700 px)
//     k 6-9   (4 q, 67 ms)  desenho 2: invertido. Papel claro #f3ece0, halo radial da cor de destaque (raio 900), 12 pinceladas
//                           pretas, silhuetas pretas ampliadas 1,03x e deslocadas 18 px a favor da força, arco preto (raio 560)
//                           + filete branco (raio 500), 110 gotas pretas para a frente (1100 px) + 26 para trás (420 px)
//     k 10-11 (2 q, 33 ms)  volta para a cena: zoom 1,08 -> 1,05, contraste 1,35 / saturação 1,3 / brilho 1,1,
//                           separação de cor (cópias a +-22 px na direção do golpe, screen, alpha 0,28)
//   Grão de papel em overlay (alpha 0,22) só nos desenhos 1 e 2.
//   Todas as medidas em px são de um quadro de 1080×1920; o módulo escala sozinho para o tamanho do seu canvas.
//   Depois dos 12 q vem o resto do HIT-STOP: no original o mundo fica congelado 0,36 s ao todo (TI..TI+0,36), ou seja,
//   0,20 s de impact frame + 0,16 s de cena parada; a tremida entra em TI+0,2 com 0,3*exp(-3,2*t).
//   Renderizando a 30 qps cada desenho de 4 q vira 2 quadros ("em dois") e o clarão vira 1.
//
// COMO PLUGAR (motor three.js + canvas 2D por cima, tudo função pura de t). Exemplo completo: cena.js desta pasta.
//   import { criarImpactFrame } from './impactFrame2.js';
//   const IF = criarImpactFrame({ THREE, scene, cam, renderer, gl, out, cor: '#ffd04a' });
//     renderer: WebGLRenderer desenhando no canvas `gl` (alpha: true, preserveDrawingBuffer: true)
//     out:      canvas 2D de saída, onde o quadro já composto da cena foi desenhado
//   No draw(t), DEPOIS de compor a cena em `out` e ANTES do HUD:
//     if (imp != null) {
//       IF.mascara([heroi, alvo]);                              // só quem participa do golpe (filhos diretos da scene), em branco
//       const [ix, iy] = IF.prj(...pontoDoImpacto);             // ponto do impacto na tela
//       const [jx, jy] = IF.prj(...pontoAdiante);               // 2º ponto ~2 m adiante = direção da força
//       const dl = Math.hypot(jx - ix, jy - iy) || 1;
//       IF.desenhar(imp, ix, iy, (jx - ix) / dl, (jy - iy) / dl);
//       return;                                                 // nada de HUD nem legenda por cima do desenho
//     }
//   `imp` e o hit-stop saem do tempo:
//     const hs  = t >= TI && t < TI + 0.36;                     // hit-stop: 0,36 s
//     const tt  = t < TI ? t : hs ? TI : t - 0.36;              // tempo "de mundo": congela no impacto e depois segue atrasado
//     const imp = hs && t - TI < 0.2 ? Math.min(11, Math.floor((t - TI) * 60 + 0.001)) : null;   // k = 0..11 nos primeiros 0,2 s
//     tremida   = t >= TI + 0.2 ? 0.3 * Math.exp(-(t - TI - 0.2) * 3.2) : 0;                     // só depois dos desenhos
//     alvo achatado (squash 0,74) enquanto dura o hit-stop
//   UMA cor de destaque por golpe (ex.: raio #ffd84a, gelo #5fd6ff).
//   EVITE estrela pontuda e cunhas radiais: lê como explosão de história em quadrinho, toda aguda.
//   Checagem de flash (skill checar-video) reprova mais de 3 flashes/s. Claro -> preto -> papel -> cena conta 4 trocas:
//   se reprovar, escureça o 1º desenho (opção `claro`).

// gerador determinístico (nada de Math.random; cada desenho sai igual em todo render)
export function rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// "#rrggbb" -> "r,g,b"
const rgb = (h) => { const n = parseInt(h.replace('#', ''), 16); return `${n >> 16 & 255},${n >> 8 & 255},${n & 255}`; };

export function criarImpactFrame({ THREE, scene, cam, renderer, gl, out, cor = '#ffd04a', claro = '#fff', semente = 0 }) {
  const PW = out.width, PH = out.height;            // tamanho real do canvas de saída
  const W = 1080, S = PW / W, H = PH / S;           // espaço de desenho: 1080 de largura (as medidas do cabeçalho valem aqui)
  const novo = () => { const c = document.createElement('canvas'); c.width = PW; c.height = PH; return c; };
  const GRAB = novo(), MASK = novo(), TMP = novo();
  const WHITE = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
  const _t = new THREE.Vector3();
  // mundo -> pixel (no espaço de 1080 de largura)
  const prj = (x, y, z) => { _t.set(x, y, z).project(cam); return [(_t.x * 0.5 + 0.5) * W, (-_t.y * 0.5 + 0.5) * H, _t.z]; };
  // grão de papel, criado uma vez
  let GRAIN = null;
  function grao(c) { if (!GRAIN) { const p = document.createElement('canvas'); p.width = p.height = 256; const q = p.getContext('2d'), im = q.createImageData(256, 256), r = rng(99); for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (r() - 0.5) * 120; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } q.putImageData(im, 0, 0); GRAIN = c.createPattern(p, 'repeat'); } return GRAIN; }

  // máscara: a cena renderizada com material branco único, só com os objetos de `manter` (filhos diretos da scene)
  function mascara(manter) {
    const vis = scene.children.map((o) => o.visible); scene.children.forEach((o) => { if (!o.isLight) o.visible = manter.includes(o) && o.visible; });
    const fundo = scene.background, env = scene.environment, nev = scene.fog; scene.background = null; scene.fog = null;
    const ca = renderer.getClearAlpha(); renderer.setClearAlpha(0);
    scene.overrideMaterial = WHITE; renderer.clear(); renderer.render(scene, cam); scene.overrideMaterial = null;
    scene.background = fundo; scene.environment = env; scene.fog = nev; renderer.setClearAlpha(ca); scene.children.forEach((o, i) => { o.visible = vis[i]; });
    const m = MASK.getContext('2d'); m.globalCompositeOperation = 'copy'; m.filter = `blur(${1.5 * S}px)`; m.drawImage(gl, 0, 0, PW, PH); m.filter = 'none'; m.globalCompositeOperation = 'source-over';
  }
  // silhueta pintada de uma cor, com deslocamento e escala (medidas no espaço de 1080)
  function tinta(col, dx = 0, dy = 0, sc = 1, px = W / 2, py = H / 2) { const q = TMP.getContext('2d'); q.globalCompositeOperation = 'copy'; q.setTransform(sc, 0, 0, sc, (px - px * sc + dx) * S, (py - py * sc + dy) * S); q.drawImage(MASK, 0, 0); q.setTransform(1, 0, 0, 1, 0, 0); q.globalCompositeOperation = 'source-in'; q.fillStyle = col; q.fillRect(0, 0, PW, PH); q.globalCompositeOperation = 'source-over'; return TMP; }
  // pincelada seca: várias cerdas paralelas, afiladas nas pontas, com falhas
  function pincel(c, x0, y0, x1, y1, wd, seed, col) { const r = rng(seed), dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, n = Math.max(5, wd / 5 | 0); c.fillStyle = col;
    for (let i = 0; i < n; i++) { const o = (i / (n - 1) - 0.5) * wd * (0.8 + r() * 0.3), a = r() * 0.16, b = 1 - r() * 0.22, w = (wd / n) * (0.7 + r() * 1.3) * (1 - Math.abs(i / (n - 1) - 0.5) * 0.8);
      const ax = x0 + dx * a + nx * o, ay = y0 + dy * a + ny * o, bx = x0 + dx * b + nx * o, by = y0 + dy * b + ny * o, mx = (ax + bx) / 2 + nx * (r() - 0.5) * 6, my = (ay + by) / 2 + ny * (r() - 0.5) * 6;
      c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(mx + nx * w, my + ny * w, bx, by); c.quadraticCurveTo(mx - nx * w, my - ny * w, ax, ay); c.fill(); } }
  // arco de corte: pincelada grossa em curva
  function arco(c, cx, cy, R, a0, a1, wd, seed, col) { const r = rng(seed), n = 9; c.strokeStyle = col; c.lineCap = 'round';
    for (let i = 0; i < n; i++) { const k = i / (n - 1) - 0.5, rr = R + k * wd, s0 = a0 + r() * 0.25, s1 = a1 - r() * 0.3; c.lineWidth = (wd / n) * (1.2 + r() * 1.4) * (1 - Math.abs(k) * 1.1); c.beginPath(); c.arc(cx, cy, rr, s0, s1); c.stroke(); } }
  // respingo: gotas num leque na direção da força, poucas grandes e muitas pequenas
  function respingo(c, x, y, ux, uy, n, seed, col, reach = 900) { const r = rng(seed); c.fillStyle = col;
    for (let i = 0; i < n; i++) { const d = Math.pow(r(), 1.6) * reach + 60, sp = (r() - 0.5) * 1.5, ca = Math.cos(sp), sa = Math.sin(sp), vx = ux * ca - uy * sa, vy = ux * sa + uy * ca, sz = Math.max(3, Math.pow(r(), 3.2) * 60 * (1 - d / (reach * 1.4)));
      c.save(); c.translate(x + vx * d, y + vy * d); c.rotate(Math.atan2(vy, vx)); c.beginPath(); c.ellipse(0, 0, sz * (1 + r() * 1.6), sz * 0.6, 0, 0, 7); c.fill(); c.restore(); } }

  // k = 0..11 (quadro a 60 qps desde o impacto); (x, y) = ponto do impacto e (ux, uy) = direção da força, no espaço de 1080
  function desenhar(k, x, y, ux, uy) {
    const c = out.getContext('2d'), sd = semente;
    const g = GRAB.getContext('2d'); g.filter = 'none'; g.globalCompositeOperation = 'copy'; g.drawImage(out, 0, 0); g.globalCompositeOperation = 'source-over';
    const step = k < 2 ? 0 : k < 6 ? 1 : k < 10 ? 2 : 3, px = -uy, py = ux, ACC = cor, A = rgb(cor);
    const img = (cv, dx = 0, dy = 0) => c.drawImage(cv, dx, dy, W, H);
    c.save(); c.setTransform(S, 0, 0, S, 0, 0); c.filter = 'none'; c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    if (step === 0) { // clarão: claro quase puro, só as silhuetas em cinza claro
      c.fillStyle = claro; c.fillRect(0, 0, W, H); img(tinta('#d9d4cc')); }
    else if (step === 1) { // desenho 1: preto, silhuetas brancas com sombra deslocada, corte na cor de destaque
      c.fillStyle = '#07070a'; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 16; i++) { const o = (i - 7.5) * 120 + Math.sin(i * 7.7) * 40, l = 500 + (i * 131 % 900); pincel(c, x + px * o - ux * 300, y + py * o - uy * 300, x + px * o + ux * l, y + py * o + uy * l, 16 + (i * 37 % 34), sd + 40 + i, 'rgba(255,255,255,0.16)'); }
      c.globalAlpha = 0.35; img(tinta('#fff', -ux * 46, -uy * 46)); c.globalAlpha = 1; img(tinta('#fff'));
      arco(c, x - ux * 120, y - uy * 120, 470, Math.atan2(uy, ux) - 1.25, Math.atan2(uy, ux) + 1.25, 150, sd + 5, ACC);
      respingo(c, x, y, ux, uy, 70, sd + 11, '#fff', 900); respingo(c, x, y, ux, uy, 14, sd + 13, ACC, 700); }
    else if (step === 2) { // desenho 2: invertido, papel claro, silhuetas pretas, tinta espirrando, mesma cor de destaque
      c.fillStyle = '#f3ece0'; c.fillRect(0, 0, W, H);
      const gr = c.createRadialGradient(x, y, 0, x, y, 900); gr.addColorStop(0, `rgba(${A},0.95)`); gr.addColorStop(0.45, `rgba(${A},0.25)`); gr.addColorStop(1, `rgba(${A},0)`); c.fillStyle = gr; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 12; i++) { const o = (i - 5.5) * 150 + Math.sin(i * 5.3) * 50, l = 700 + (i * 173 % 800); pincel(c, x + px * o + ux * 80, y + py * o + uy * 80, x + px * o + ux * l, y + py * o + uy * l, 22 + (i * 29 % 40), sd + 70 + i, 'rgba(12,10,12,0.9)'); }
      img(tinta('#0b0a0d', ux * 18, uy * 18, 1.03, x, y));
      arco(c, x - ux * 60, y - uy * 60, 560, Math.atan2(uy, ux) - 1.1, Math.atan2(uy, ux) + 1.1, 110, sd + 6, '#0b0a0d'); arco(c, x - ux * 60, y - uy * 60, 500, Math.atan2(uy, ux) - 0.9, Math.atan2(uy, ux) + 0.9, 46, sd + 7, '#fff');
      respingo(c, x, y, ux, uy, 110, sd + 21, '#0b0a0d', 1100); respingo(c, x, y, -ux, -uy, 26, sd + 23, '#0b0a0d', 420); }
    else { // volta para a cena: zoom leve e separação de cor
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H); const z = 1.08 - 0.03 * (k - 10); c.translate(x, y); c.scale(z, z); c.translate(-x, -y);
      c.filter = 'contrast(1.35) saturate(1.3) brightness(1.1)'; c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 1; img(GRAB); c.filter = 'none'; c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 0.28; c.globalCompositeOperation = 'screen'; img(GRAB, ux * 22, uy * 22); img(GRAB, -ux * 22, -uy * 22); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      img(tinta('rgba(255,255,255,0.25)')); }
    c.restore();
    // grão de papel por cima dos desenhos
    if (step === 1 || step === 2) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.22; c.fillStyle = grao(c) || '#888'; c.fillRect(0, 0, PW, PH); c.restore(); }
    return step;
  }
  return { mascara, desenhar, prj, W, H };
}
