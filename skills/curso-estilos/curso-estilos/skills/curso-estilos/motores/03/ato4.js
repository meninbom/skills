// Ato 4 · Quem paga
import { B, M, IARA, GENERAL, NICO, boneco, lerp, cl, TAU, W, H, CH, st, eOut, eIn, eIO, eBack, rng, X, oN, oG, oI, NX, GX, IX, IAR, emp,
  nicoMira, nicoPe, iaraPe, iaraSentada, arcoDe, texto } from './comum.js';
const NOITE = () => { B.setAmb([0.88, 0.92, 1.0], [0, 3, 8]); B.setLuz({ cor: '#a9d2f2', w: 2.6 }); };
const iaraCaida = (t, o = {}) => iaraSentada(t, { x: IX - 50, ...o });
function luzMao(g, t, c, k, r = 110) { g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(c[0], c[1], 0, c[0], c[1], r); gr.addColorStop(0, `rgba(190,235,255,${0.6 * k})`); gr.addColorStop(1, 'rgba(120,200,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(c[0], c[1], r, 0, TAU); g.fill(); g.restore(); }
function monitor(t, bpm, alarme) {                                          // tela reta, sem perspectiva (regra da série)
  const g = X(), cor = alarme ? '#ff5a60' : '#7fe0a0'; g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none'; g.globalAlpha = 1; g.fillStyle = '#05080c'; g.fillRect(0, 0, W, H);
  g.fillStyle = alarme ? `rgba(120,10,20,${0.25 + 0.2 * Math.sin(t * 14)})` : 'rgba(10,30,24,0.4)'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#0a1016'; g.beginPath(); g.roundRect(70, 430, 940, 900, 30); g.fill(); g.strokeStyle = 'rgba(160,190,210,0.35)'; g.lineWidth = 4; g.stroke();
  texto(g, 'SINAIS VITAIS', 120, 510, { tam: 54, cor: '#9fb3c5' }); texto(g, 'LINK NEURAL · SESSÃO 11:07', 120, 572, { tam: 30, cor: '#5f7385' });
  g.save(); g.beginPath(); g.rect(110, 640, 860, 330); g.clip(); g.strokeStyle = 'rgba(160,190,210,0.12)'; g.lineWidth = 2; for (let x = 110; x < 980; x += 54) { g.beginPath(); g.moveTo(x, 640); g.lineTo(x, 970); g.stroke(); } for (let y = 640; y < 980; y += 54) { g.beginPath(); g.moveTo(110, y); g.lineTo(970, y); g.stroke(); }
  g.strokeStyle = cor; g.shadowColor = cor; g.shadowBlur = 14; g.lineWidth = 5; g.lineJoin = 'round'; g.beginPath(); const per = 60 / bpm * 300; for (let x = 0; x <= 860; x += 3) { const ph = ((x + t * 300) % per) / per, y = ph < 0.08 ? -30 * Math.sin(ph / 0.08 * Math.PI) : ph < 0.14 ? 150 * Math.sin((ph - 0.08) / 0.06 * Math.PI) * (ph < 0.11 ? -1 : 0.4) : ph < 0.3 ? -22 * Math.sin((ph - 0.14) / 0.16 * Math.PI) : 0; x ? g.lineTo(110 + x, 810 + y) : g.moveTo(110 + x, 810 + y); } g.stroke(); g.restore();
  g.shadowColor = cor; g.shadowBlur = 26; texto(g, String(Math.round(bpm)), 560, 1150, { tam: 290, al: 'right', cor }); g.shadowBlur = 0; texto(g, 'BPM', 600, 1200, { tam: 80, cor: 'rgba(255,255,255,0.7)' }); if (alarme) { texto(g, '▲', 600, 1090, { tam: 90, cor }); if (Math.floor(t * 5) % 2) texto(g, '⚠ ALERTA', 940, 510, { tam: 50, al: 'right', cor }); }
}
function capsula(t, k) {                                                    // a tampa, de cima e reta
  const g = X(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none'; g.globalAlpha = 1; const gr = g.createRadialGradient(W / 2, 900, 100, W / 2, 900, 1300); gr.addColorStop(0, '#1b2028'); gr.addColorStop(1, '#07090c'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const al = 0.5 + 0.5 * Math.sin(t * 12); g.save(); g.translate(W / 2 - 60, 900);
  g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.roundRect(-290, -560, 620, 1180, 200); g.fill();
  const cg = g.createLinearGradient(-300, 0, 300, 0); cg.addColorStop(0, '#d9dee4'); cg.addColorStop(0.5, '#f4f6f8'); cg.addColorStop(1, '#aab2bc'); g.fillStyle = cg; g.beginPath(); g.roundRect(-300, -580, 600, 1160, 200); g.fill(); g.strokeStyle = '#7b8590'; g.lineWidth = 6; g.stroke();
  g.fillStyle = '#0c1016'; g.beginPath(); g.roundRect(-210, -480, 420, 520, 150); g.fill(); g.strokeStyle = `rgba(255,74,82,${0.5 + 0.5 * al})`; g.lineWidth = 8; g.stroke();
  g.save(); g.beginPath(); g.roundRect(-210, -480, 420, 520, 150); g.clip(); B.setAmb([0.7, 0.72, 0.8], [30 * al, 0, 4]); g.scale(1.5, 1.5); boneco(g, NICO, { x: 0, y: 292, vista: 'f', expr: 'dor', sombra: false }); NOITE(); g.fillStyle = `rgba(255,60,70,${0.16 * al})`; g.fillRect(-400, -900, 800, 1400); g.restore();
  g.fillStyle = '#12161c'; g.beginPath(); g.roundRect(-230, 110, 460, 250, 20); g.fill(); g.strokeStyle = '#ff4a52'; g.lineWidth = 4; g.globalAlpha = 0.6 + 0.4 * al; g.stroke(); g.globalAlpha = 1;
  texto(g, '⚠ SINAIS VITAIS', 0, 164, { tam: 44, al: 'center', cor: '#ff5a60' }); texto(g, 'INSTÁVEIS', 0, 218, { tam: 44, al: 'center', cor: '#ff5a60' }); texto(g, 'RECOMENDADO', 0, 280, { tam: 34, al: 'center', cor: '#e8edf2' }); texto(g, 'DESCONECTAR', 0, 322, { tam: 34, al: 'center', cor: '#e8edf2' });
  texto(g, 'LINK NEURAL', 0, 470, { tam: 40, al: 'center', cor: '#7b8590' }); g.restore();
  // mesinha com o celular acendendo
  const cel = st(0.35, 0.5, k); g.save(); g.translate(905, 1150); g.fillStyle = '#3a2c22'; g.beginPath(); g.roundRect(-130, -220, 260, 440, 18); g.fill(); g.rotate(0.12); g.fillStyle = '#0b0d10'; g.beginPath(); g.roundRect(-70, -130, 140, 260, 20); g.fill();
  if (cel > 0) { g.fillStyle = `rgba(230,240,250,${0.9 * cel})`; g.beginPath(); g.roundRect(-60, -120, 120, 240, 14); g.fill(); g.shadowColor = '#dfeeff'; g.shadowBlur = 50 * cel; g.fillRect(-10, -10, 20, 20); g.shadowBlur = 0; texto(g, 'Seu Ademir', 0, -60, { tam: 21, al: 'center', cor: '#1a2430' }); texto(g, 'chamando…', 0, -30, { tam: 17, al: 'center', cor: '#5a6a7a' }); g.fillStyle = '#3fc46a'; g.beginPath(); g.arc(-26, 70, 16, 0, TAU); g.fill(); g.fillStyle = '#e0484e'; g.beginPath(); g.arc(26, 70, 16, 0, TAU); g.fill(); } g.restore();
  M.acabamento(t, { vinheta: 0.6, bloom: 0.18 });
}
function escolha(t, t0) {
  const g = X(), u = t - t0; if (u < 0) return; const k = eOut(u / 0.3); g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  const gr = g.createLinearGradient(0, 760, 0, H); gr.addColorStop(0, 'rgba(2,6,12,0)'); gr.addColorStop(0.3, `rgba(2,6,12,${0.86 * k})`); gr.addColorStop(1, `rgba(2,6,12,${0.94 * k})`); g.fillStyle = gr; g.fillRect(0, 760, W, H - 760);
  const bot = (i, y, tit, sub, cor) => { const kk = eBack((u - 0.15 - i * 0.14) / 0.22, 1.4); if (kk <= 0) return; const ativo = Math.floor((u - 0.6) / 1.0) % 2 === i && u > 0.6; g.save(); g.translate(W / 2, y); g.scale(kk, kk); g.shadowColor = ativo ? cor : 'rgba(0,0,0,0.6)'; g.shadowBlur = ativo ? 34 : 18; g.fillStyle = 'rgba(12,20,34,0.95)'; g.beginPath(); g.roundRect(-440, -100, 880, 200, 28); g.fill(); g.shadowBlur = 0; g.strokeStyle = cor; g.lineWidth = ativo ? 7 : 4; g.globalAlpha = ativo ? 1 : 0.75; g.stroke(); g.globalAlpha = 1;
    g.fillStyle = cor; g.beginPath(); g.arc(-350, 0, 58, 0, TAU); g.fill(); texto(g, String(i + 1), -350, 6, { tam: 84, al: 'center', cor: '#0b1220' }); texto(g, tit, -262, -28, { tam: 74, cor: '#fff' }); texto(g, sub, -260, 44, { tam: 40, cor: 'rgba(225,235,245,0.85)' }); g.restore(); };
  bot(0, 1010, 'DESCONECTA', 'e a Iara fica sozinha', '#62ccff'); bot(1, 1250, 'FICA', 'e o coração dispara', '#ff5a60');
  const k3 = eOut((u - 0.6) / 0.25); if (k3 > 0) { g.globalAlpha = k3; texto(g, 'COMENTA', W / 2 - 130, 1470, { tam: 70, al: 'center', cor: '#fff', borda: '#0b0f16' }); texto(g, '1 OU 2', W / 2 + 170, 1470, { tam: 70, al: 'center', cor: '#f1b534', borda: '#0b0f16' }); }
  g.restore();
}

export const ATO4 = [
  { id: 'A4-01', fala: { q: 'IARA', txt: 'De novo não.', telas: ['DE NOVO *NÃO.*'], at: 0.7 }, pos: 0.6, fn(t, u, p) {
    const g = X(), fl = u > p.F[0].u0 + p.F[0].d + 0.1 && u < p.F[0].u0 + p.F[0].d + 0.1 + 3 / 60;
    if (fl) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#e9eef2'; g.fillRect(0, 0, W, H); const gr = g.createRadialGradient(W / 2, 400, 0, W / 2, 400, 900); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#b9c6d2'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.save(); g.translate(W / 2, 1500); g.scale(1.6, 1.6); B.setAmb([0, 0, 0], [20, 26, 36]); B.setLuz({ w: 0 }); boneco(g, NICO, { x: 0, y: 0, vista: 'b', sombra: false, mF: [70, oN - 190] }); NOITE(); g.restore(); return; }   // o menino de costas do ep6
    const cam = { x: IX - 20, y: CH - 250, z: 2.5 * emp(u, 0.05) }; M.cena(t, cam, { foco: 1.5, frenteBlur: 20 }, gg => { boneco(gg, IARA, iaraCaida(t, { olha: [-5, 2], cabT: 0.1 })); luzMao(gg, t, [IX - 420, CH - 330], 0.7, 260); });
    M.acabamento(t, { vinheta: 0.72 });
  } },
  { id: 'A4-02', fala: [{ q: 'NAR', txt: 'E o Nico sentiu o peito.', telas: ['E O NICO SENTIU', 'O *PEITO.*'] }, { q: 'NAR', txt: 'Não o do jogo. O de verdade.', telas: ['NÃO O DO JOGO.', 'O DE *VERDADE.*'], depois: 0.3 }], pos: 0.5, fn(t, u, p) {
    if (u < p.F[1].u0 - 0.08) { const k = eOut((u - 0.3) / 0.12), cam = { x: NX + 50, y: CH + oN + 10, z: 2.4 * emp(u, 0.05) }, tr = M.tremida(t, t - u + 0.3, 8, 0.15); cam.sx = tr[0]; cam.sy = tr[1];
      M.cena(t, cam, { foco: 1.4, frenteBlur: 18 }, g => { const P = nicoPe(t, { expr: k > 0.5 ? 'dor' : 'susto', lean: 0.12 * k, agacha: 16 * k, mN: [lerp(-30, 26, k), oN + lerp(150, 54, k)], mF: [90, oN + 80] }); P.atras = (gg, S) => arcoDe(gg, S, 0, { an: 0.7 }); boneco(g, NICO, P); }); M.acabamento(t); }
    else { const v = u - p.F[1].u0, D = p.D - p.F[1].u0, bpm = v < 0.5 ? 84 : lerp(84, 172, eIO(cl((v - 0.5) / (D * 0.6)))); monitor(t, bpm, bpm > 130); M.acabamento(t, { vinheta: 0.5, bloom: 0.2 }); }
  } },
  { id: 'A4-03', fala: [{ q: 'NAR', txt: 'O poder não era da flecha. Era dele.', telas: ['O PODER NÃO ERA', 'DA *FLECHA.*', 'ERA *DELE.*'] }, { q: 'NAR', txt: 'E quem pagava era o corpo deitado na cápsula.', telas: ['E QUEM *PAGAVA*', 'ERA O CORPO', 'DEITADO NA *CÁPSULA.*'], depois: 0.3 }], pos: 0.5, fn(t, u, p) { capsula(t, u / p.D); } },
  { id: 'A4-04', dur: 4.2, fn(t, u) {                                      // o braço dela sumindo; os cubinhos dele se juntando
    const T0 = t - u, k = eIO(cl(u / 4.2)), R = rng(23), c = [GX - 10, CH - 20], cam = { x: 760 - 30 * k, y: CH - 260, z: 1.5 * emp(u, 0.04) };
    M.cena(t, cam, { foco: 0.6, frenteBlur: 16 }, g => { boneco(g, IARA, iaraCaida(t, { expr: 'dor' })); const pt = [IX + 70, CH - 250 + 40 * Math.sin(t * 2)]; for (let i = 0; i < 4; i++) M.cubinhos(g, t, t - i * 0.06 - 0.01, pt, { n: 6, v: 70, s: 12, dur: 0.5, seed: 400 + i + Math.floor(t * 20), sobe: 50 });
      g.save(); for (let i = 0; i < 90; i++) { const a = R() * TAU, d0 = 160 + R() * 420, d = lerp(d0, R() * 60, k * (0.6 + R() * 0.4)), s = 8 + R() * 14, passo = Math.floor(t * 8 + i) % 2 * 4; g.globalAlpha = 0.85; g.fillStyle = i % 3 ? '#474b55' : (i % 3 === 1 ? '#52c6ff' : '#5d626e'); g.fillRect(Math.round((c[0] + Math.cos(a) * d) / 4) * 4 + passo, Math.round((c[1] + Math.sin(a) * d * 0.16 - (1 - d / 600) * 90 * k * R()) / 4) * 4, s, s); } g.restore(); M.anelSom(g, t, T0 + 2.6, c, { r: 240, dur: 0.8, n: 2, w: 4, ach: 0.25, cor: '#52c6ff' }); });
    M.acabamento(t, { vinheta: 0.7 });
  } },
  { id: 'A4-05', fala: { q: 'NAR', txt: 'Desconecta, ou fica?', telas: ['*DESCONECTA,*', 'OU *FICA?*'], at: 0.4, y: 620 }, dur: 5.0, fn(t, u) {
    const T0 = t - u, al = 0.5 + 0.5 * Math.sin(t * 12), cam = { x: NX + 96, y: CH - 386 + 60 * st(1.6, 2.2, u), z: 2.5 * emp(u, 0.04) };               // mesmo quadro do 1º plano (loop)
    M.cena(t, cam, { foco: 1.3, frenteBlur: 18, tinta: `rgba(120,10,20,${0.12 * al})` }, g => { const P = nicoMira(0.97, { expr: 'medo', olha: [3, 0] }); P.frente = (gg, S) => arcoDe(gg, S, 0.97, { brilho: 0.6 }); B.setLuz({ cor: '#ff6a70', w: 3.2 }); boneco(g, NICO, P); NOITE(); luzMao(g, t, [NX + 330, CH + oN - 4], 0.8, 200); luzMao(g, t, [NX + 30, CH + oN - 10], 0.5, 150); });
    M.acabamento(t, { vinheta: 0.66 }); escolha(t, T0 + 1.9);
  } },
];
