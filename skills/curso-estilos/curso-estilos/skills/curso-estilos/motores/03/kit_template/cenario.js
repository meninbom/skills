// cenario.js — O CENÁRIO E AS CORES. É o arquivo que você troca para a peça virar outra.
//
// Para trocar de tema, mude só a linha abaixo:
export const TEMA = 'dia';            // 'dia' (rua clara, de dia), 'interior' (sala quente) ou 'chuva' (cidade à noite, na chuva). Ou o nome do tema que você criar

// Cada tema tem:
//   ceu      cores do degradê do fundo, de cima para baixo (num interior, é a parede)
//   amb      clima de cor em cima do boneco: m multiplica (vermelho, verde, azul) e a soma. [1, 1, 1] e [0, 0, 0] = cor pura
//   luz      o fio de luz na borda do boneco (cor e espessura)
//   vinheta  sombra nas bordas do quadro (cor em "r,g,b" e força de 0 a 1; 0 desliga)
//   boneco   a paleta do personagem (pele, roupa, calça, bota, chapéu...)
//   cores    as cores que as camadas usam. Trocar uma cor aqui troca no cenário inteiro
//   fundo, meio, chao, frente   as 4 camadas, desenhadas nessa ordem (o boneco entra entre o chão e a frente)
//   tempo    (opcional) o que cai por cima do quadro inteiro: chuva, neve, poeira. Só o tema 'chuva' usa. Veja o fim dele
//
// Cada camada tem:
//   p         paralaxe. 0 = parada lá no fundo · 1 = anda junto com o boneco · mais que 1 = passa na frente dele
//   desfoque  borrão da camada (0 = nítida). Longe e muito perto ficam borrados; a ação fica nítida
//   desenha(g, v, t, c)   o desenho. g = o Canvas 2D, já na posição certa · v = a parte do mundo que aparece
//                         (x0, x1, y0 = topo, y1 = base) · t = tempo em segundos · c = as `cores` do tema
//
// Medidas: o chão é y = 0 e para cima é NEGATIVO. Um boneco jovem tem ~600 de altura; use isso de régua.
// LUZ QUE BRILHA (janela, poste, farol): desenhe a mancha de luz com g.globalCompositeOperation = 'lighter' entre g.save() e g.restore().
// As cores se somam e o claro "estoura", como luz de verdade. O poste do tema 'chuva' e o abajur do 'interior' são o exemplo.
// Para o cenário não acabar quando o quadro é mais largo, use repete(v, passo, ...) em vez de posições soltas.
import { repete, sorte } from './palco.js';
const TAU = Math.PI * 2;
const bola = (g, x, y, rx, ry = rx) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };

export const TEMAS = {

  // ============================================================ TEMA 1: dia claro, lado de fora
  dia: {
    ceu: ['#4fa8e6', '#9ad4f2', '#e3f4ee'],
    amb: { m: [1, 1, 1], a: [0, 0, 0] },
    luz: { cor: '#fff6d0', w: 2.6 },
    vinheta: { cor: '20,60,90', forca: 0.22 },
    boneco: { pele: '#c98a5e', roupa: '#d9532c', calca: '#34405a', bota: '#5a3a24', chapeu: '#f2c230', extra: '#7a4a2a', acento: '#fdf3d0', capa: '#2f5d6b' },
    cores: { sol: '#fff2b0', nuvem: '#ffffff', morro1: '#a9d9b4', morro2: '#8ccb98', copa1: '#4fa25c', copa2: '#3d8a4e', tronco: '#80583a',
      grama1: '#7cc45e', grama2: '#4f9c46', caminho1: '#ecd9a4', caminho2: '#d8bd80', tufo: '#3f8a3c', flor: '#ffffff', frente: '#2c6b34' },
    fundo: { p: 0.12, desfoque: 2, desenha(g, v, t, c) {
      const sx = 190, sy = -520, r = g.createRadialGradient(sx, sy, 0, sx, sy, 300); r.addColorStop(0, 'rgba(255,246,200,0.9)'); r.addColorStop(1, 'rgba(255,246,200,0)');
      g.fillStyle = r; bola(g, sx, sy, 300); g.fillStyle = c.sol; bola(g, sx, sy, 62);                                   // sol
      g.fillStyle = c.nuvem; g.globalAlpha = 0.9;
      repete(v, 460, (x, i) => { const cx = x + sorte(i) * 200 + t * 5, cy = -360 - sorte(i, 1) * 250, s = 0.7 + sorte(i, 2) * 0.6;       // nuvens (andam devagar)
        bola(g, cx, cy, 90 * s, 30 * s); bola(g, cx - 50 * s, cy + 6 * s, 54 * s, 24 * s); bola(g, cx + 44 * s, cy - 16 * s, 58 * s, 34 * s); });
      g.globalAlpha = 1; g.fillStyle = c.morro1; repete(v, 420, (x, i) => bola(g, x + sorte(i, 3) * 120, 30, 360, 190 + sorte(i, 4) * 110));   // morros de trás
      g.fillStyle = c.morro2; repete(v, 300, (x, i) => bola(g, x + 150 + sorte(i, 5) * 90, 40, 250, 110 + sorte(i, 6) * 60));              // morros da frente
      g.fillRect(v.x0, 0, v.x1 - v.x0, v.y1);
    } },
    meio: { p: 0.45, desfoque: 1, desenha(g, v, t, c) {
      g.fillStyle = c.grama2; g.fillRect(v.x0, -18, v.x1 - v.x0, v.y1 + 18);
      repete(v, 340, (x, i) => { const tx = x + sorte(i) * 150, h = 250 + sorte(i, 1) * 140, r = 100 + sorte(i, 2) * 40;                  // árvores
        g.fillStyle = c.tronco; g.fillRect(tx - 15, -h, 30, h); g.fillStyle = c.copa2; bola(g, tx - r * 0.45, -h - r * 0.2, r * 0.8); bola(g, tx + r * 0.5, -h - r * 0.1, r * 0.75);
        g.fillStyle = c.copa1; bola(g, tx, -h - r * 0.7, r); });
      g.fillStyle = c.copa2; repete(v, 210, (x, i) => bola(g, x + sorte(i, 7) * 140, -14, 80 + sorte(i, 8) * 50, 46 + sorte(i, 9) * 22));   // arbustos
    } },
    chao: { p: 1, desfoque: 0, desenha(g, v, t, c) {
      const s = g.createLinearGradient(0, -30, 0, 420); s.addColorStop(0, c.grama1); s.addColorStop(1, c.grama2);
      g.fillStyle = s; g.fillRect(v.x0, -30, v.x1 - v.x0, v.y1 + 30);
      const k = g.createLinearGradient(0, -8, 0, 96); k.addColorStop(0, c.caminho1); k.addColorStop(1, c.caminho2); g.fillStyle = k; g.fillRect(v.x0, -8, v.x1 - v.x0, 104);   // caminho de terra
      g.fillStyle = 'rgba(120,90,50,0.35)'; repete(v, 130, (x, i) => bola(g, x + sorte(i) * 100, 10 + sorte(i, 1) * 74, 9 + sorte(i, 2) * 8, 4));   // pedrinhas
      g.strokeStyle = c.tufo; g.lineWidth = 4; g.lineCap = 'round';
      repete(v, 64, (x, i) => { const bx = x + sorte(i, 3) * 50, by = sorte(i, 4) < 0.5 ? -22 - sorte(i, 5) * 6 : 110 + sorte(i, 5) * 170, h = 14 + sorte(i, 6) * 16;   // tufos de grama
        for (const a of [-0.5, 0, 0.45]) { g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + Math.sin(a) * h, by - Math.cos(a) * h * 1.3); g.stroke(); }
        if (sorte(i, 7) < 0.25) { g.fillStyle = c.flor; bola(g, bx + 14, by - 8, 6); } });
    } },
    frente: { p: 1.6, desfoque: 7, desenha(g, v, t, c) {
      g.strokeStyle = c.frente; g.lineCap = 'round';                                                                  // capim alto, nascendo da base do quadro
      repete(v, 46, (x, i) => { const bx = x + sorte(i) * 40, h = 60 + sorte(i, 1) * 120, le = (sorte(i, 2) - 0.5) * 80 + Math.sin(t * 1.4 + i) * 8;
        g.lineWidth = 9 + sorte(i, 3) * 9; g.beginPath(); g.moveTo(bx, v.y1 + 10); g.quadraticCurveTo(bx + le * 0.2, v.y1 - h * 0.6, bx + le, v.y1 - h); g.stroke(); });
    } },
  },

  // ============================================================ TEMA 2: sala quente, lado de dentro
  interior: {
    ceu: ['#f2c58c', '#e6a968', '#cf8a4c'],                               // aqui o "céu" é a parede
    amb: { m: [1.0, 0.95, 0.86], a: [8, 3, 0] },
    luz: { cor: '#ffd9a0', w: 2.6 },
    vinheta: { cor: '60,20,5', forca: 0.42 },
    boneco: { pele: '#e3a06a', roupa: '#2f8a94', calca: '#2e3440', bota: '#3a2a22', chapeu: '#1d5660', extra: '#6a4a3a', acento: '#f1b534', capa: '#e8e0c8' },
    cores: { listra: 'rgba(255,255,255,0.07)', rodape: '#7a4526', moldura: '#6e3d1f', vidro1: '#fff1c2', vidro2: '#ffc46e', quadro: '#8e4a2c', tela: '#f4dcae', pintura: '#cf6a3a',
      estante: '#6b3a1e', estante2: '#4e2913', livros: ['#b5443a', '#2f7f8a', '#e0b040', '#5a6a3a', '#d98a4a', '#3d4a6a'], sofa: '#a8452f', sofa2: '#8a3524',
      abajur: '#ffe9b0', haste: '#4a2a16', piso1: '#a56a3c', piso2: '#7a4826', tabua: 'rgba(60,28,10,0.35)', tapete: '#3f7f86', tapete2: '#e9d9b0', frente: '#2a1408' },
    fundo: { p: 0.9, desfoque: 1.2, desenha(g, v, t, c) {
      g.fillStyle = c.listra; repete(v, 150, x => g.fillRect(x, v.y0, 60, -v.y0));                                     // listras do papel de parede
      repete(v, 1500, x => {                                                                                            // janela com luz de fim de tarde (repete de longe em longe)
        const jx = x - 360, jy = -690, jw = 260, jh = 340, s = g.createLinearGradient(0, jy, 0, jy + jh); s.addColorStop(0, c.vidro1); s.addColorStop(1, c.vidro2);
        g.fillStyle = c.moldura; g.fillRect(jx - 16, jy - 16, jw + 32, jh + 32); g.fillStyle = s; g.fillRect(jx, jy, jw, jh);
        g.fillStyle = c.moldura; g.fillRect(jx + jw / 2 - 6, jy, 12, jh); g.fillRect(jx, jy + jh / 2 - 6, jw, 12); g.fillRect(jx - 30, jy + jh + 16, jw + 60, 16);
        g.fillStyle = c.quadro; g.fillRect(x + 150, -640, 150, 190); g.fillStyle = c.tela; g.fillRect(x + 164, -626, 122, 162);          // quadro na parede
        g.fillStyle = c.pintura; bola(g, x + 225, -560, 30); g.fillRect(x + 164, -500, 122, 36); });
      g.fillStyle = c.rodape; g.fillRect(v.x0, -40, v.x1 - v.x0, 40);                                                 // rodapé
    } },
    meio: { p: 0.96, desfoque: 0.5, desenha(g, v, t, c) {
      repete(v, 1500, x => {
        const ex = x + 250, ew = 250, eh = 470; g.fillStyle = c.estante; g.fillRect(ex, -eh, ew, eh);                                    // estante de livros
        for (let n = 0; n < 4; n++) { const py = -eh + 16 + n * 114; g.fillStyle = c.estante2; g.fillRect(ex + 14, py, ew - 28, 98);
          let lx = ex + 20; for (let j = 0; lx < ex + ew - 40; j++) { const lw = 14 + sorte(n * 20 + j) * 16, lh = 60 + sorte(n * 20 + j, 1) * 34; g.fillStyle = c.livros[Math.floor(sorte(n * 20 + j, 2) * c.livros.length)]; g.fillRect(lx, py + 98 - lh, lw, lh); lx += lw + 2; } }
        const sfx = x - 470; g.fillStyle = c.sofa2; g.beginPath(); g.roundRect(sfx, -250, 430, 250, 40); g.fill();                    // sofá
        g.fillStyle = c.sofa; g.beginPath(); g.roundRect(sfx - 26, -150, 482, 130, 34); g.fill(); g.fillStyle = c.haste; g.fillRect(sfx + 10, -20, 20, 20); g.fillRect(sfx + 400, -20, 20, 20);
        const ax = x - 560; g.fillStyle = c.haste; g.fillRect(ax - 5, -430, 10, 430); bola(g, ax, -4, 46, 10);                         // abajur de pé
        const r = g.createRadialGradient(ax, -450, 0, ax, -450, 330); r.addColorStop(0, 'rgba(255,225,150,0.5)'); r.addColorStop(1, 'rgba(255,225,150,0)');
        g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = r; bola(g, ax, -450, 330); g.restore();
        g.fillStyle = c.abajur; g.beginPath(); g.moveTo(ax - 46, -520); g.lineTo(ax + 46, -520); g.lineTo(ax + 78, -410); g.lineTo(ax - 78, -410); g.closePath(); g.fill(); });
    } },
    chao: { p: 1, desfoque: 0, desenha(g, v, t, c) {
      const s = g.createLinearGradient(0, 0, 0, 420); s.addColorStop(0, c.piso1); s.addColorStop(1, c.piso2); g.fillStyle = s; g.fillRect(v.x0, -4, v.x1 - v.x0, v.y1 + 4);
      g.fillStyle = c.tabua; let y = 22, n = 0; while (y < v.y1) { g.fillRect(v.x0, y, v.x1 - v.x0, 3 + n);                             // tábuas (mais largas perto da câmera)
        const y2 = y + 38 + n * 22; repete(v, 420, (x, i) => g.fillRect(x + sorte(i, n) * 300, y, 3, y2 - y)); y = y2; n++; }
      g.fillStyle = c.tapete2; bola(g, 0, 66, 400, 62); g.fillStyle = c.tapete; bola(g, 0, 66, 372, 52);                               // tapete embaixo do boneco
    } },
    frente: { p: 1.5, desfoque: 8, desenha(g, v, t, c) {
      g.fillStyle = c.frente; g.strokeStyle = c.frente; g.lineCap = 'round';                                          // planta de canto, nascendo da base do quadro
      repete(v, 900, x => { const bx = x - 330; for (let j = 0; j < 7; j++) { const a = -1.9 + j * 0.42 + Math.sin(t * 0.9 + j) * 0.02, l = 150 + sorte(j) * 90, ex = bx + Math.cos(a) * l, ey = v.y1 + 20 + Math.sin(a) * l;
        g.lineWidth = 8; g.beginPath(); g.moveTo(bx, v.y1 + 20); g.lineTo(ex, ey); g.stroke(); g.save(); g.translate(ex, ey); g.rotate(a); bola(g, 0, 0, 62, 22); g.restore(); } });
    } },
  },

  // ============================================================ TEMA 3: cidade à noite, na chuva
  chuva: {
    ceu: ['#121a2c', '#22304a', '#3a4862'],
    amb: { m: [0.86, 0.9, 1.0], a: [0, 2, 8] },
    luz: { cor: '#ffdca0', w: 2.8 },
    vinheta: { cor: '4,7,18', forca: 0.5 },
    boneco: { pele: '#d39a6c', roupa: '#f2c230', calca: '#2b3550', bota: '#3a2a22', chapeu: '#f2c230', extra: '#d9532c', acento: '#fdf3d0', capa: '#f2c230' },
    cores: { predio1: '#1a2440', predio2: '#243150', predio3: '#2f3d5e', janela: '#ffd27a', janela2: '#8fc4e0', vitrine1: '#ffe2a0', vitrine2: '#f3a850', toldo1: '#c8483a', toldo2: '#e8dcc0',
      calcada: '#48536c', meiofio: '#6a7690', asfalto1: '#2a3348', asfalto2: '#131826', faixa: '#c9c6b0', poste: '#0c111e', poca: 'rgba(150,190,230,0.22)', frente: '#080c18', risco: '#cde4ff' },
    fundo: { p: 0.14, desfoque: 3, desenha(g, v, t, c) {
      repete(v, 230, (x, i) => { const w = 170 + sorte(i) * 70, h = 520 + sorte(i, 1) * 520, bx = x + sorte(i, 2) * 40;                    // prédios de longe, com janelas acesas
        g.fillStyle = sorte(i, 3) < 0.5 ? c.predio1 : c.predio2; g.fillRect(bx, -h, w, h + 60);
        for (let a = 0; a < 5; a++) for (let b = 0; b < Math.floor(h / 70) - 1; b++) { const s = sorte(i * 31 + a, b); if (s < 0.38) { g.fillStyle = s < 0.3 ? c.janela : c.janela2; g.globalAlpha = 0.75; g.fillRect(bx + 16 + a * (w - 32) / 5, -h + 30 + b * 70, (w - 32) / 5 - 10, 34); g.globalAlpha = 1; } } });
      g.fillStyle = c.predio1; g.fillRect(v.x0, 0, v.x1 - v.x0, v.y1);
    } },
    meio: { p: 0.5, desfoque: 1.2, desenha(g, v, t, c) {
      repete(v, 560, (x, i) => { const w = 500, h = 560 + sorte(i, 4) * 220, bx = x;                                                         // lojas da rua: vitrine quente e toldo
        g.fillStyle = c.predio3; g.fillRect(bx, -h, w, h + 40);
        const s = g.createLinearGradient(0, -250, 0, -40); s.addColorStop(0, c.vitrine1); s.addColorStop(1, c.vitrine2); g.fillStyle = s; g.fillRect(bx + 50, -250, w - 100, 210);
        g.fillStyle = c.predio1; g.fillRect(bx + w / 2 - 8, -250, 16, 210);
        for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? c.toldo2 : c.toldo1; g.beginPath(); g.moveTo(bx + 30 + k * (w - 60) / 8, -300); g.lineTo(bx + 30 + (k + 1) * (w - 60) / 8, -300); g.lineTo(bx + 14 + (k + 1) * (w - 28) / 8, -244); g.lineTo(bx + 14 + k * (w - 28) / 8, -244); g.closePath(); g.fill(); }
        for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) { g.fillStyle = sorte(i * 7 + a, b + 9) < 0.55 ? c.janela : c.predio1; g.fillRect(bx + 60 + a * 140, -h + 50 + b * 120, 90, 80); } });
      repete(v, 840, (x, i) => { const px = x + 420;                                                                                         // poste com halo
        g.fillStyle = c.poste; g.fillRect(px - 7, -640, 14, 680); g.fillRect(px - 7, -640, 90, 12);
        const r = g.createRadialGradient(px + 84, -618, 0, px + 84, -618, 300); r.addColorStop(0, 'rgba(255,220,150,0.75)'); r.addColorStop(0.25, 'rgba(255,210,130,0.28)'); r.addColorStop(1, 'rgba(255,210,130,0)');
        g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = r; bola(g, px + 84, -618, 300); g.restore(); g.fillStyle = '#fff3cf'; bola(g, px + 84, -622, 20, 12); });
    } },
    chao: { p: 1, desfoque: 0, desenha(g, v, t, c) {
      g.fillStyle = c.calcada; g.fillRect(v.x0, -46, v.x1 - v.x0, 40); g.fillStyle = c.meiofio; g.fillRect(v.x0, -10, v.x1 - v.x0, 12);
      const s = g.createLinearGradient(0, 0, 0, 520); s.addColorStop(0, c.asfalto1); s.addColorStop(1, c.asfalto2); g.fillStyle = s; g.fillRect(v.x0, 0, v.x1 - v.x0, v.y1);
      repete(v, 420, (x, i) => { const rx = x + 180, r = g.createLinearGradient(0, 0, 0, 380); r.addColorStop(0, 'rgba(255,205,120,0.34)'); r.addColorStop(1, 'rgba(255,205,120,0)');   // reflexo das luzes no asfalto molhado
        g.fillStyle = r; g.fillRect(rx + sorte(i) * 60, 4, 70 + sorte(i, 1) * 60, 380); });
      g.fillStyle = c.poca; repete(v, 300, (x, i) => bola(g, x + sorte(i, 2) * 200, 60 + sorte(i, 3) * 260, 90 + sorte(i, 4) * 70, 14 + sorte(i, 5) * 10));   // poças
      g.fillStyle = c.faixa; g.globalAlpha = 0.5; repete(v, 360, x => g.fillRect(x, 230, 180, 12)); g.globalAlpha = 1;                    // faixa tracejada
      g.strokeStyle = 'rgba(200,225,255,0.5)'; g.lineWidth = 2.5;                                                                          // pingos batendo no chão
      repete(v, 90, (x, i) => { const k = (t * (1.6 + sorte(i, 6)) + sorte(i, 7)) % 1, px = x + sorte(i, 8) * 80, py = 20 + sorte(i, 9) * 330; g.globalAlpha = 0.7 * (1 - k); g.beginPath(); g.ellipse(px, py, 6 + k * 26, (6 + k * 26) * 0.3, 0, 0, TAU); g.stroke(); }); g.globalAlpha = 1;
    } },
    frente: { p: 1.6, desfoque: 7, desenha(g, v, t, c) {
      g.fillStyle = c.frente; repete(v, 760, x => { g.fillRect(x + 364, v.y1 - 250, 32, 270); bola(g, x + 380, v.y1 - 250, 26); });                 // pilaretes da calçada de cá, fora de foco
    } },
      // a chuva: por cima de tudo, em pixels da tela. `forca` = quantidade de riscos (0 desliga, 1 = chuva forte)
    tempo: { forca: 1, desenha(g, q, t, c) {
      const { W, H, U } = q; g.lineCap = 'round'; g.strokeStyle = c.risco;
      for (let i = 0; i < 150 * this.forca; i++) { const longe = i % 3, vel = (1500 + sorte(i, 1) * 900) * (longe ? 1 : 1.5) * U, L = (46 + sorte(i, 2) * 60) * (longe ? 1 : 1.9) * U;      // 1 em cada 3 riscos passa perto da câmera: maior e mais rápido
        const y = ((sorte(i, 3) * (H + 400) + t * vel) % (H + 400)) - 200, x = ((sorte(i) * (W + 500) - y * 0.22 - t * 240 * U) % (W + 500) + W + 500) % (W + 500) - 100;
        g.globalAlpha = longe ? 0.2 + sorte(i, 4) * 0.2 : 0.5; g.lineWidth = (longe ? 2.2 : 4) * U; g.beginPath(); g.moveTo(x, y); g.lineTo(x - L * 0.22, y + L); g.stroke(); }
      g.globalAlpha = 1;
    } },
  },
};
