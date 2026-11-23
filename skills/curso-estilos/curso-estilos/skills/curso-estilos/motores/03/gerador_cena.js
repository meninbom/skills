// vitrine do gerador: ROSA (ficha escrita à mão) girando, andando, pulando e falando. ?folha = prancha (vistas, expressões, salto, sorteados)
import * as B from './boneco.js';
import { gerar, sorteia, ROSA_FICHA } from './gerador.js';
import { salta, anda } from './fisica.js';
const cv = document.getElementById('c'), g = cv.getContext('2d'), Q = new URLSearchParams(location.search), FOLHA = Q.has('folha');
const eIO = k => { k = B.cl(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
B.setAmb([0.9, 0.93, 1.0], [0, 3, 8]); B.setLuz({ cor: '#a9d2f2', w: 2.6 });

const ROSA = gerar(ROSA_FICHA), seed = +(Q.get('seed') || 0), HEROI = seed ? gerar(sorteia(seed)) : ROSA;
const resp = t => Math.sin(t * 2.4);
const FRASE = 'Oi, eu sou a Rosa. Entrego qualquer coisa, em qualquer lugar.', F0 = 10.3, FD = 3.9;
const PL = [{ id: 'giro', t0: 0, D: 3.6 }, { id: 'anda', t0: 3.6, D: 3.8 }, { id: 'pula', t0: 7.4, D: 2.5 }, { id: 'fala', t0: 9.9, D: 5.1 }];
const FIM = 15;

// mundo: chão em y = 0; câmera { x, y, z } (centro da tela olha pra (x, y))
function fundo(cam) {
  const W = cv.width, H = cv.height, gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1d3a52'); gr.addColorStop(0.62, '#12283a'); gr.addColorStop(1, '#0a1622');
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const gy = H / 2 - cam.y * cam.z;                                        // linha do chão na tela
  g.fillStyle = 'rgba(160,200,235,0.05)'; for (let i = -2; i < 9; i++) { const x = ((i * 300 - cam.x * cam.z * 0.35) % 2700 + 2700) % 2700 - 300; g.beginPath(); g.ellipse(x, gy, 260, 120 + (i % 3) * 40, 0, Math.PI, B.TAU); g.fill(); }   // morros ao longe
  g.setTransform(cam.z, 0, 0, cam.z, W / 2 - cam.x * cam.z, H / 2 - cam.y * cam.z);
  g.fillStyle = '#0d1d2b'; g.fillRect(cam.x - 3000, 0, 6000, 3000);
  g.strokeStyle = 'rgba(169,210,242,0.45)'; g.lineWidth = 3 / cam.z; g.beginPath(); g.moveTo(cam.x - 3000, 0); g.lineTo(cam.x + 3000, 0); g.stroke();
  for (let k = Math.floor((cam.x - 900) / 170); k < (cam.x + 900) / 170; k++) { const x = k * 170 + ((k * 37) % 50), h = 14 + ((k * 53) % 22);       // tufos e pedras no chão (dão a velocidade)
    if (k % 3 === 0) { g.fillStyle = '#1a3243'; g.beginPath(); g.ellipse(x, 2, 26 + h * 0.6, 12, 0, Math.PI, B.TAU); g.fill(); }
    else { g.strokeStyle = '#2c5060'; g.lineWidth = 4; g.lineCap = 'round'; for (const a of [-0.5, 0, 0.45]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + Math.sin(a) * h, -Math.cos(a) * h * 1.3); g.stroke(); } } }
}
function rotulo(txt, y, tam = 46, cor = '#f2ead8', alfa = 1) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = alfa; g.font = `700 ${tam}px RC`; g.textAlign = 'center'; g.fillStyle = cor; g.fillText(txt, cv.width / 2, y); g.globalAlpha = 1; g.textAlign = 'left'; }

const parado = (t, o = {}) => ({ x: 0, y: 0, vista: 'q', dir: 1, expr: 'neutro', agacha: 6 + resp(t) * 1.5, lean: 0.02, bal: Math.sin(t * 1.3) * 0.08, ...o });
function cena(t) {
  const ch = HEROI, R = ch.R;
  B.RELOGIO.t = t; for (const k in B.FALA) delete B.FALA[k];
  let cam = { x: 0, y: -330, z: 1.55 }, P, titulo = 1 - B.cl((t - 3.3) / 0.5);
  if (t < 3.6) {                                                           // giro: vistas em dois (segura 0,6 s cada)
    const V = [['f', 1], ['q', 1], ['l', 1], ['b', 1], ['l', -1], ['q', -1]], [v, d] = V[Math.min(5, Math.floor(t / 0.6))];
    P = parado(t, { vista: v, dir: d });
  } else if (t < 7.4) {                                                    // anda de perfil, câmera acompanha
    const u = t - 3.6, w = anda(u, R, { T: 0.96 }), k = B.cl(u / 0.3), { x, v, ...p } = w;
    P = B.mix(parado(t, { vista: 'l' }), { ...p, vista: 'l', dir: 1, expr: 'neutro' }, eIO(k)); P.x = x; P.vista = 'l';
    cam.x = x + 60;
  } else if (t < 9.9) {                                                    // pula: sai da caminhada, antecipa, voa, pousa
    const u = t - 7.4, xa = anda(3.8, R, { T: 0.96 }).x, w0 = anda(3.8 + u, R, { T: 0.96 }), s = salta(u - 0.18, R, { dx: 230, H: (R.coxa + R.canela) * 0.95 });
    const { fase, x, ...p } = s, kk = eIO(B.cl(u / 0.18)), { x: xw, v, ...pw } = w0;
    P = u < 0.18 ? B.mix({ ...pw, vista: 'l' }, { ...p, vista: 'l' }, kk) : { ...p, vista: 'l', expr: fase === 'ar' ? 'firme' : fase === 'pousa' ? 'bravo' : 'neutro', vento: fase === 'ar' ? 0.6 : 0.2 };
    P.x = xa + (u < 0.18 ? (xw - xa) * (1 - kk) : (x || 0)); P.dir = 1; P.vista = 'l'; if (fase === 'pousa') P.agacha = Math.max(P.agacha || 0, 5);   // a mola do pouso passa do zero: sem isso a perna estica além do tamanho
    cam.x = B.lerp(xa + 60, xa + 140, eIO(u / 2.5));
  } else {                                                                 // fala: câmera chega perto, boca segue a frase, pisca
    const u = t - 9.9, xa = anda(3.8, R, { T: 0.96 }).x + 230, k = eIO(B.cl(u / 1.0)), giro = eIO(B.cl((u - 0.05) / 0.3));
    cam = { x: B.lerp(xa + 140, xa + 30, k), y: B.lerp(-330, -R.pe - R.coxa - R.canela - R.tronco * 0.8, k), z: B.lerp(1.55, 2.7, k) };
    const ex = t < 12.2 ? 'neutro' : t < 13.3 ? 'firme' : t < 14.25 ? 'neutro' : 'neutro';
    const om = -(R.pe + R.coxa + R.canela + R.tronco) + 8 + 6, Lb = R.braco[0] + R.braco[1], gesto = B.cl((t - 11.7) / 0.35) * (1 - B.cl((t - 13.6) / 0.4));
    P = parado(t, { x: xa, vista: giro < 0.5 ? 'l' : 'q', dir: 1, expr: ex, cabT: 0.04 * Math.sin(t * 1.7) - 0.05 * gesto,
      mN: [B.lerp(-6, 58, gesto), om + B.lerp(Lb * 0.92, Lb * 0.5, gesto)], eN: gesto > 0.02 ? [B.lerp(-30, -52, gesto), om + B.lerp(R.braco[0], R.braco[0] * 0.85, gesto)] : undefined, abertaN: gesto > 0.5, maoAnN: gesto > 0.5 ? -1.0 : undefined });
    B.FALA[ch.nome] = B.bocaDaFala(FRASE, F0, FD, t) || undefined; 
    if (t > F0 - 0.1 && t < F0 + FD + 0.5) { g.save(); fundo(cam); B.boneco(g, ch, P); g.restore();
      const vis = FRASE.slice(0, Math.ceil(FRASE.length * B.cl((t - F0) / FD))); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = 'rgba(6,12,20,0.72)'; g.beginPath(); g.roundRect(70, 300, 940, 150, 26); g.fill();
      g.font = '700 44px RC'; g.fillStyle = '#f2ead8'; const pal = vis.split(' '); let lin = '', y = 360; for (const w of pal) { if (g.measureText(lin + w).width > 860) { g.fillText(lin, 110, y); lin = ''; y += 58; } lin += w + ' '; } g.fillText(lin, 110, y); return; }
  }
  g.save(); fundo(cam); B.boneco(g, ch, P); g.restore();
  if (titulo > 0) { rotulo(ch.nome.toUpperCase(), 300, 84, '#f2ead8', titulo); const f = ch.ficha; rotulo([f.corpo, f.cabeca, f.roupa, f.capa ? 'capa ' + f.capa : null, f.extra].filter(Boolean).join(' · '), 370, 40, '#a9d2f2', titulo); }
}

// ---------- prancha: vistas, expressões, salto em fases e 5 sorteados
function folha() {
  cv.width = 2400; cv.height = 2600; const W = cv.width, ch = HEROI, R = ch.R;
  g.fillStyle = '#12283a'; g.fillRect(0, 0, W, cv.height); B.RELOGIO.t = 0.5;
  const tit = (s, y) => { g.setTransform(1, 0, 0, 1, 0, 0); g.font = '700 54px RC'; g.fillStyle = '#a9d2f2'; g.fillText(s, 60, y); };
  const chao = y => { g.setTransform(1, 0, 0, 1, 0, 0); g.strokeStyle = 'rgba(169,210,242,0.3)'; g.lineWidth = 3; g.beginPath(); g.moveTo(40, y); g.lineTo(W - 40, y); g.stroke(); };
  tit(ch.nome.toUpperCase() + ' · vistas', 90); chao(760);
  [['f', 1], ['q', 1], ['l', 1], ['b', 1]].forEach(([v, d], i) => { g.setTransform(1, 0, 0, 1, 0, 0); B.boneco(g, ch, parado(0, { x: 330 + i * 580, y: 760, vista: v, dir: d, s: 1.1 })); });
  tit('expressões (com piscar e boca de fala)', 860);
  const EX = [['neutro'], ['firme'], ['bravo'], ['susto'], ['triste'], ['dor'], ['neutro', 'fala a'], ['neutro', 'pisca']];
  EX.forEach(([e, extra], i) => { const cx = 170 + i * 295, cy = 1050; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.beginPath(); g.roundRect(cx - 135, 900, 270, 420, 20); g.fillStyle = '#183248'; g.fill(); g.clip();
    for (const k in B.FALA) delete B.FALA[k]; if (extra === 'fala a') B.FALA[ch.nome] = { k: 0.9, v: 'a' }; B.RELOGIO.t = extra === 'pisca' ? (() => { for (let t = 0; t < 10; t += 0.01) if (B.piscando(ch.nome, t)) return t; return 0; })() : 0.5;
    const s = 2.2, hy = -(R.pe + R.coxa + R.canela + R.tronco + R.pesc + R.cabR * 0.86); B.boneco(g, ch, parado(0, { x: cx - 10, y: cy + 40 - hy * s, vista: 'q', s, expr: e, sombra: false })); g.restore();
    g.setTransform(1, 0, 0, 1, 0, 0); g.font = '700 34px RC'; g.fillStyle = '#f2ead8'; g.textAlign = 'center'; g.fillText(extra || e, cx, 1365); g.textAlign = 'left'; });
  for (const k in B.FALA) delete B.FALA[k]; B.RELOGIO.t = 0.5;
  tit('salto: antecipa → impulso → ar → pouso', 1410); chao(1960);
  [0, 0.16, 0.24, 0.3, 0.45, 0.62, 0.8, 0.93, 0.97, 1.1].forEach((u, i) => { const { fase, x, ...p } = salta(u, R, { dx: 0 }); g.setTransform(1, 0, 0, 1, 0, 0); B.boneco(g, ch, { ...p, x: 150 + i * 232, y: 1960, vista: 'l', dir: 1, s: 0.72, expr: 'firme', vento: fase === 'ar' ? 0.6 : 0 }); });
  tit('sorteados pelo gerador (semente)', 2060); chao(2540);
  [3, 8, 12, 21, 34].forEach((sd, i) => { const c2 = gerar(sorteia(sd)); g.setTransform(1, 0, 0, 1, 0, 0); B.boneco(g, c2, parado(i, { x: 260 + i * 470, y: 2540, vista: 'q', s: 0.62 })); g.font = '700 32px RC'; g.fillStyle = '#f2ead8'; g.textAlign = 'center'; g.setTransform(1, 0, 0, 1, 0, 0); g.fillText(c2.nome, 260 + i * 470, 2585); g.textAlign = 'left'; });
}

await document.fonts.load('700 84px RC');
window.PLANOS = PL; window.END = FIM; console.log('FIM ' + FIM);
window.seek = async t => { if (FOLHA) folha(); else cena(t); };
await window.seek(0); window.READY = true;
