// laboratório de LUTA (15/11): Rosa × Otto (gerado no gerador, corpo forte), ~28 s. ?folha = raio-X dos acertos
import * as B from './boneco.js';
import { gerar, ROSA_FICHA } from './gerador.js';
import { lutador, estado, poseDe, relogio } from './luta.js';
const cv = document.getElementById('c'), g = cv.getContext('2d'), W = 1080, H = 1920, Q = new URLSearchParams(location.search), FOLHA = Q.has('folha'), TAU = B.TAU, cl = B.cl, lerp = B.lerp;
const AMB = () => { B.setAmb([0.9, 0.93, 1.0], [0, 3, 8]); B.setLuz({ cor: '#a9d2f2', w: 2.6 }); }; AMB();
const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const eOut = (k, p = 2) => 1 - Math.pow(1 - cl(k), p), sm = k => { k = cl(k); return k * k * (3 - 2 * k); };
const CIANO = [127, 212, 255], BRANCO = [234, 248, 255], OURO = [255, 196, 74];

const ROSA = gerar(ROSA_FICHA);
const OTTO = gerar({ nome: 'otto', corpo: 'forte', cabeca: 'capuz', roupa: 'casaco', capa: null, extra: null, emblema: null, olhos: 'ponto', luvas: true,
  cores: { pele: '#b47548', roupa: '#8a3b4a', calca: '#2e3440', bota: '#3a2a22', capa: '#c9a24a', chapeu: '#5a2a34', extra: '#6a4a3a', acento: '#e8e0c8' } });   // paleta fechada nº 4 do gerador

// ---------- poses da Rosa (mãos relativas ao ombro; N = braço/perna de perto, F = de longe; frente = +x)
const GR = { agacha: 44, px: 0, lean: 0.12, torce: -0.2, cabT: -0.03, nl: -75, fl: 72, calcN: 0.3, calcF: 0, rN: [52, 62], rF: [92, 26], expr: 'firme', resp: 3 };
const ANT = { ...GR, agacha: 72, lean: 0.27, cabT: -0.06, rN: [40, 85], rF: [72, 55], resp: 0 };
const DUCK = { agacha: 125, px: -10, lean: 0.42, torce: -0.2, cabT: 0.25, nl: -95, fl: 95, calcN: 0.5, calcF: 0, rN: [40, 45], rF: [62, 30], resp: 0 };
const PUNCH = { agacha: 75, px: 25, lean: 0.34, torce: 0.9, cabT: -0.05, nl: -130, fl: 100, calcN: 0.55, calcF: 0, rN: [184, 4], rF: [-40, 96], expr: 'grita', resp: 0 };
const JAB = { ...GR, lean: 0.22, torce: -0.4, rF: [172, -64], rN: [48, 58], fl: 95, expr: 'grita', resp: 0 };
const BLOCK = { ...GR, agacha: 52, lean: 0.04, cabT: 0.14, rN: [72, -28], rF: [88, -46], resp: 0 };
const TO = { agacha: 22, ar: 14, px: 0, lean: -0.04, torce: 0, cabT: -0.04, calcN: 0.9, calcF: 0.6, rN: [-80, 95], rF: [-60, 100], nl: -40, fl: 70, resp: 0 };
const AIRB = { agacha: 30, ar: 90, px: 0, lean: 0.1, torce: 0, cabT: -0.04, nl: -70, yN: -60, fl: 70, yF: -50, calcN: 0.3, calcF: 0.1, rN: [60, 40], rF: [95, 10], resp: 0 };
const LANDB = { agacha: 92, px: 0, lean: 0.16, torce: -0.2, cabT: 0, nl: -95, fl: 95, calcN: 0.3, calcF: 0, rN: [45, 60], rF: [85, 30], resp: 0 };
const AIR1 = { agacha: 30, ar: 110, px: 0, lean: -0.15, torce: 0, cabT: -0.05, nl: -60, yN: -70, fl: 80, yF: -60, calcN: 0.3, calcF: 0.2, rN: [70, -40], rF: [-60, 80], expr: 'grita', resp: 0 };
const KICK = { agacha: 26, ar: 130, px: 0, lean: -0.45, torce: 0, cabT: -0.1, nl: -55, yN: -95, fl: 205, yF: -215, calcN: 0.3, calcF: -0.3, rN: [60, -60], rF: [-95, 60], expr: 'grita', resp: 0 };
const BOUNCE = { ...KICK, agacha: 30, ar: 150, lean: -0.2, nl: -40, yN: -80, fl: 110, yF: -60, calcF: 0, rN: [80, -20], rF: [-60, 60], expr: 'firme' };
const FALL = { ...AIRB, agacha: 40, ar: 40, lean: 0.08, nl: -85, yN: -10, fl: 92, yF: -5, rN: [70, 40], rF: [100, 10] };
const LOW = { agacha: 110, px: 0, lean: 0.26, torce: -0.4, cabT: 0.05, nl: -95, fl: 90, calcN: 0.5, calcF: 0, rN: [30, 110], rF: [80, 30], resp: 0 };
const UPPER = { agacha: 15, ar: 30, px: 10, lean: -0.05, torce: 0.7, cabT: -0.12, nl: -80, fl: 80, calcN: 0.9, calcF: 0.6, rN: [125, -150], rF: [60, 60], expr: 'grita', resp: 0 };
const FLY1 = { agacha: 30, px: 0, lean: 0, torce: 0, baixa: -150, gira: -0.9, nl: -30, fl: 60, yF: -20, calcN: 0.2, calcF: 0.2, rN: [-120, -40], rF: [-60, -120], expr: 'dor', cabT: 0.3, resp: 0 };
const FLY2 = { ...FLY1, baixa: -110, gira: -0.45, nl: -70, yN: -40, fl: 80, yF: -30, rN: [-60, 40], rF: [-20, -40] };
const LAND3 = { agacha: 165, px: 0, lean: 0.78, torce: 0, cabT: -0.3, nl: -150, fl: 95, calcN: 1.0, calcF: 0, rF: [95, 185], rN: [-70, 110], expr: 'bravo', resp: 0 };
const WIDE = { agacha: 70, px: -8, lean: 0.1, torce: -0.6, cabT: -0.04, nl: -110, fl: 110, calcN: 0.25, calcF: 0, rN: [-55, 100], rF: [130, 10], abF: true, expr: 'bravo', resp: 0 };
const WIND = { ...WIDE, agacha: 88, px: -16, lean: -0.04, torce: -1.0, rN: [-85, 82], rF: [140, -6], abF: true, cg: 1, trem: 2.5 };
const STRIKE = { agacha: 105, px: 38, lean: 0.5, torce: 1.0, cabT: -0.14, nl: -185, fl: 100, calcN: 0.55, calcF: 0, rN: [184, 8], rF: [-52, 100], expr: 'grita', resp: 0 };
const U = { agacha: 30, px: 30, lean: 0.05, torce: 0, cabT: 0, nl: -20, fl: 100, calcN: 0, calcF: 0, rN: [6, 176], rF: [14, 174], expr: 'firme', resp: 3 };
// ---------- poses do Otto (braço 238, perna 322)
const GO = { agacha: 52, px: 0, lean: 0.14, torce: -0.2, cabT: -0.06, nl: -100, fl: 98, calcN: 0.3, calcF: 0, rN: [66, 82], rF: [118, 36], expr: 'bravo', resp: 4 };
const ANTO = { ...GO, agacha: 85, lean: 0.28, resp: 0 };
const WINDO = { ...GO, agacha: 62, lean: -0.05, torce: -0.9, rN: [-105, 55], rF: [95, 45], expr: 'grita', resp: 0 };
const SWMID = { ...WINDO, lean: 0.15, torce: 0.1, rN: [60, -150] };
const SWEND = { ...WINDO, agacha: 66, lean: 0.4, torce: 0.9, rN: [228, 8], nl: -120, fl: 110 };
const OVER = { ...SWEND, lean: 0.46, cabT: 0.1, rN: [200, 75], expr: 'susto' };
const HURT = { agacha: 82, px: 0, lean: 0.6, torce: 0.3, cabT: 0.38, nl: -100, fl: 90, calcN: 0.3, calcF: 0, rN: [40, 150], rF: [80, 130], expr: 'dor', resp: 0 };
const JW = { ...GO, agacha: 58, rF: [70, 55], resp: 0 };
const JABO = { ...GO, lean: 0.3, torce: 0.4, rF: [234, 0], fl: 125, expr: 'grita', resp: 0 };
const HW = { ...GO, agacha: 72, lean: -0.12, torce: -1.0, rN: [-118, 48], rF: [100, 30], expr: 'grita', resp: 0 };
const HEAVY = { agacha: 76, px: 20, lean: 0.42, torce: 0.95, cabT: -0.05, nl: -150, fl: 120, calcN: 0.5, calcF: 0, rN: [234, 0], rF: [-45, 125], expr: 'grita', resp: 0 };
const BLOCKO = { ...GO, agacha: 70, lean: 0.2, cabT: 0.15, rN: [110, 10], rF: [125, -20], resp: 0 };
const JUMPUP = { agacha: 30, ar: 40, px: 0, lean: -0.2, torce: 0, cabT: -0.15, rN: [40, -232], rF: [30, -232], expr: 'grita', calcN: 0.8, calcF: 0.6, nl: -90, fl: 60, yN: -20, yF: -10, resp: 0 };
const TOPO = { ...JUMPUP, ar: 75, yN: -40, yF: -30, lean: -0.25 };
const SMASH = { agacha: 172, px: 0, lean: 0.92, torce: 0.3, cabT: 0.15, rN: [200, 190], rF: [188, 200], nl: -125, fl: 120, calcN: 0.5, calcF: 0, expr: 'grita', resp: 0 };
const RISE1 = { ...GO, agacha: 90, lean: 0.36, cabT: 0, rN: [70, 90], rF: [105, 60], resp: 0 };
const HS1 = { ...RISE1, cabT: -0.35, lean: 0.18, expr: 'dor' }, HS2 = { ...RISE1, cabT: 0.25, lean: 0.28, expr: 'dor' };
const LIFT = { agacha: 20, ar: 45, px: 0, lean: -0.45, torce: 0, cabT: -0.55, rN: [-60, 90], rF: [-30, 120], nl: -60, yN: -30, fl: 60, yF: -20, calcN: 0.4, calcF: 0.3, expr: 'dor', resp: 0 };
const STAG = { agacha: 60, px: 0, lean: -0.25, torce: 0, cabT: -0.3, nl: -115, fl: 60, calcN: 0.3, calcF: 0, rN: [-20, 140], rF: [40, 130], expr: 'dor', resp: 0 };
const KNEEL = { agacha: 168, px: 0, lean: 0.3, torce: 0, cabT: 0.35, nl: -165, fl: 110, calcN: 1.2, calcF: 0, rF: [80, 170], rN: [30, 200], expr: 'dor', resp: 8 };
const ROAR = { agacha: 60, px: 0, lean: -0.25, torce: 0, cabT: -0.32, rN: [-50, 110], rF: [-25, 120], expr: 'grita', nl: -100, fl: 100, calcN: 0.3, calcF: 0, trem: 2.5, resp: 0 };
const TACKLE = { agacha: 72, px: 0, lean: 0.55, torce: 1.0, cabT: 0.15, rN: [60, 100], rF: [30, 90], nl: -150, fl: 80, calcN: 0.6, calcF: 0, expr: 'grita', resp: 0 };
const FLYO = (gira, baixa) => ({ agacha: 40, px: 0, lean: 0, torce: 0, gira, baixa, rN: [-100, -60], rF: [-80, -150], nl: -40, yN: -30, fl: 60, yF: -60, calcN: 0.2, calcF: 0.2, expr: 'dor', cabT: 0.3, resp: 0 });
const DEIT = { agacha: 10, px: 0, lean: 0, torce: 0, gira: -2.5 * Math.PI, baixa: 356 - 10 - 100, nl: -12, fl: 14, calcN: 0, calcF: 0, rN: [-90, -170], rF: [40, 120], expr: 'dor', cabT: -0.12, resp: 0 };

// ---------- coreografia (tempo de AÇÃO, s)
const CORRE = { ritmo: 1, exagero: 1 }, R = lutador(ROSA, 1, -460, GR), O = lutador(OTTO, -1, 460, GO);
// 1. encaram (0–2,6)
R.k(1.5, -460, { ...GR, agacha: 50, lean: 0.16 }, { plant: 'NF' }).k(2.55, -460, ANT, { plant: 'NF' });
O.k(0.9, 460, { ...GO, torce: 0.35, cabT: 0.1 }, { plant: 'NF' }).k(1.5, 460, { ...GO, torce: -0.3, cabT: -0.1 }, { plant: 'NF' }).k(2.1, 460, GO, { plant: 'NF' }).k(2.55, 460, ANTO, { plant: 'NF' });
// 2. avançam; ele solta um gancho, ela abaixa e acerta a barriga (2,6–4,3)
R.run(2.62, 2.87, CORRE).k(3.0, -240, DUCK, { ease: 'out', slide: true }).k(3.25, -235, DUCK, { plant: 'NF' }).k(3.36, -230, { ...DUCK, rN: [30, 70], torce: -0.5 }, { plant: 'NF', ease: 'out3' })
  .k(3.42, -205, PUNCH, { plant: 'N' }).k(3.62, -210, { ...PUNCH, rN: [170, 50], expr: 'firme' }, { plant: 'NF' }).k(3.95, -230, GR);
O.run(2.62, 2.84, { ritmo: 0.85, exagero: 0.6 }).k(2.98, 230, WINDO, { ease: 'in' }).k(3.2, 215, SWMID, { ease: 'lin' }).k(3.28, 200, SWEND, { ease: 'out' }).k(3.42, 190, OVER, { plant: 'N' })
  .k(3.7, 265, HURT, { slide: true, ease: 'out' }).k(4.05, 265, { ...HURT, agacha: 72, lean: 0.5, cabT: 0.25 }, { plant: 'NF' }).k(4.35, 265, { ...GO, cabT: -0.12 });
// 3. ele devolve: jab, jab, direto pesado; ela defende e escorrega (4,3–6,4)
R.k(4.62, -230, BLOCK, { plant: 'NF' }).k(4.7, -230, BLOCK, { plant: 'NF' }).k(4.85, -250, { ...BLOCK, lean: -0.05, cabT: 0.2 }, { slide: true, ease: 'out' })
  .k(5.08, -250, BLOCK, { plant: 'NF' }).k(5.16, -250, BLOCK, { plant: 'NF' }).k(5.3, -280, { ...BLOCK, lean: -0.05, cabT: 0.2 }, { slide: true, ease: 'out' })
  .k(5.5, -280, { ...BLOCK, agacha: 62 }, { plant: 'NF' }).k(5.74, -280, { ...BLOCK, agacha: 62 }, { plant: 'NF' }).k(6.1, -430, { ...BLOCK, agacha: 72, lean: -0.14, cabT: 0.12, expr: 'dor' }, { slide: true, ease: 'out' })
  .k(6.4, -430, { ...GR, expr: 'bravo' }, { plant: 'NF' });
O.k(4.62, 250, JW).k(4.7, 215, JABO, { ease: 'out3', plant: 'N' }).k(4.88, 215, GO, { plant: 'F' }).k(5.08, 210, JW).k(5.16, 180, JABO, { ease: 'out3', plant: 'N' }).k(5.34, 180, GO, { plant: 'F' })
  .k(5.5, 180, HW, { plant: 'NF' }).k(5.74, 150, HEAVY, { ease: 'out3', plant: 'N' }).k(5.95, 150, HEAVY, { plant: 'NF' }).k(6.3, 180, GO).k(6.6, 220, GO).k(6.9, 260, GO);
// 4. ela corre e voa de chute; ele segura com os braços e é empurrado (6,4–8,6)
R.k(6.75, -430, ANT, { plant: 'NF' }).run(6.82, 7.1, CORRE).k(7.16, -125, TO, { ease: 'out' }).k(7.28, -140, AIR1).k(7.38, -130, KICK, { ease: 'out3' })
  .k(7.56, -170, BOUNCE, { ease: 'out' }).k(7.84, -200, FALL, { ease: 'in' }).k(7.92, -210, LANDB, { ease: 'out' }).k(8.1, -235, { ...LANDB, agacha: 70 }, { slide: true }).k(8.6, -235, GR);
O.k(7.2, 260, BLOCKO, { plant: 'NF' }).k(7.38, 260, BLOCKO, { plant: 'NF' }).k(7.8, 520, { ...BLOCKO, lean: 0.02, cabT: 0.2 }, { slide: true, ease: 'out' })
  .k(8.2, 520, { ...GO, rF: [120, 70] }, { plant: 'NF' }).k(8.6, 520, GO, { plant: 'NF' });
// 5. os dois socam juntos: punho contra punho (8,6–10,4)
R.k(8.75, -235, ANT, { plant: 'NF' }).run(8.82, 8.94, CORRE).k(9.0, -95, { ...PUNCH, rN: [178, -40] }, { ease: 'out3', plant: 'N' })
  .k(9.45, -300, { ...PUNCH, lean: -0.1, agacha: 80, rN: [140, 60], expr: 'dor' }, { slide: true, ease: 'out' }).k(9.9, -300, GR, { plant: 'NF' });
O.k(8.8, 520, HW, { plant: 'NF' }).k(9.0, 560, { ...HEAVY, rN: [226, 64] }, { ease: 'out3', plant: 'N' }).k(9.45, 640, { ...HEAVY, lean: -0.1, agacha: 70, rN: [180, 60], expr: 'dor' }, { slide: true, ease: 'out' })
  .k(9.9, 640, GO, { plant: 'NF' }).k(10.5, 640, ANTO, { plant: 'NF' });
// 6. ele corre e esmaga o chão com as duas mãos; ela pula pra trás (10,4–11,6)
const vO = O.v({ ritmo: 0.8, exagero: 0.5 }), XS = 290, tRun = (640 - XS) / vO;
O.run(10.58, 10.58 + tRun, { ritmo: 0.8, exagero: 0.5 }); const Xr = O.Xfim();
O.k(11.0, Xr - 20, JUMPUP, { ease: 'out' }).k(11.14, Xr - 35, TOPO).k(11.27, Xr - 50, SMASH, { ease: 'in3' }).k(11.75, Xr - 50, { ...SMASH, agacha: 135 }, { plant: 'NF' }).k(11.9, Xr - 50, RISE1, { plant: 'NF' });
R.k(10.4, -300, GR, { plant: 'NF' }).k(10.57, -180, GR).k(10.75, -60, GR).k(10.9, -60, { ...ANT, agacha: 70 }, { plant: 'NF' }).k(10.98, -70, { ...TO, lean: 0.04, expr: 'susto' }, { plant: 'NF', ease: 'out' })
  .k(11.18, -250, AIRB).k(11.33, -310, LANDB, { ease: 'in' }).k(11.47, -335, { ...LANDB, agacha: 80 }, { slide: true, ease: 'out' });
// 7. ela entra com jab, direto e gancho de baixo pra cima; ele cai de joelho (11,6–14,2)
const XO7 = Xr - 50;
R.k(11.6, -335, ANT, { plant: 'NF' }).run(11.65, 11.9, CORRE).k(11.97, -70, JAB, { ease: 'out3', plant: 'N' }).k(12.07, -70, { ...GR, resp: 0 }, { plant: 'NF' })
  .k(12.17, -55, { ...PUNCH, agacha: 55, nl: -110, fl: 90, rN: [168, -70] }, { ease: 'out3', plant: 'N' }).k(12.3, -20, LOW).k(12.45, 40, UPPER, { ease: 'out3', plant: 'N' })
  .k(12.7, 40, { ...GR, rN: [50, -110], agacha: 40 }, { plant: 'NF' }).k(13.05, -100, GR).k(13.4, -100, GR, { plant: 'NF' });
O.k(11.97, XO7, RISE1, { plant: 'NF' }).k(12.05, XO7 + 20, HS1, { slide: true, ease: 'out' }).k(12.17, XO7 + 20, HS1, { plant: 'NF' }).k(12.27, XO7 + 60, HS2, { slide: true, ease: 'out' }).k(12.45, XO7 + 60, HS2, { plant: 'NF' })
  .k(12.62, XO7 + 100, LIFT, { ease: 'out' }).k(12.95, XO7 + 200, STAG, { ease: 'in' }).k(13.35, XO7 + 280, KNEEL, { ease: 'out' });
// 8. ele levanta urrando e dá um tranco de ombro; ela voa e cai em três apoios (14,2–18,3)
const XK = XO7 + 280, XT = 260, vO1 = O.v(CORRE), tT = (XK - 30 - (XT + 30)) / vO1;
O.k(14.2, XK, KNEEL, { plant: 'NF' }).k(14.7, XK, ROAR).k(15.25, XK, { ...ROAR, trem: 3 }, { plant: 'NF' }).k(15.38, XK - 30, ANTO).run(15.84 - 0.06 - tT, 15.78, CORRE)
  .k(15.84, XT, TACKLE, { ease: 'out' }).k(16.1, 40, { ...TACKLE, lean: 0.3 }, { slide: true, ease: 'out' }).k(16.5, 40, GO, { plant: 'NF' });
R.k(14.7, -100, { ...GR, expr: 'susto' }, { plant: 'NF' }).k(15.0, -40, { ...BLOCK, expr: 'firme', agacha: 55 }).k(15.84, -40, { ...BLOCK, agacha: 60 }, { plant: 'NF' })
  .k(16.0, -270, FLY1, { ease: 'out' }).k(16.25, -470, FLY2, { ease: 'lin' }).k(16.42, -550, LAND3, { ease: 'in' }).k(16.85, -680, LAND3, { slide: true, ease: 'out' })
  .k(17.6, -680, { ...LAND3, cabT: -0.35 }, { plant: 'NF' }).k(18.3, -680, { ...GR, expr: 'bravo' });
// 9. ele vem andando e solta o direto; ela pula pra trás, carrega rápido e solta o golpe (18,3–20,1)
const vW = O.v({ ritmo: 0, exagero: 0.3 }), XW = -330, tW = (40 - XW) / vW;
O.run(16.7, 16.7 + tW, { ritmo: 0, exagero: 0.3 }).k(17.0 + tW, XW, GO).k(18.3, XW, HW, { plant: 'NF' }).k(18.53, XW - 30, HEAVY, { ease: 'out3', plant: 'N' })
  .k(18.68, XW - 60, { ...HEAVY, lean: 0.6, expr: 'susto' }).k(18.95, XW - 70, { ...ROAR, trem: 1.5 });
const XR9 = -955, XH = XR9 + 60, XOH = XH + 450;                                                       // onde o soco dela encontra o peito dele
O.run(19.02, 19.02 + (XW - 70 - (XOH + 30)) / vO1, CORRE).k(19.28, XOH, { ...TACKLE, lean: 0.22, torce: 0.4, rN: [150, 40], rF: [-40, 110], expr: 'grita' }, { ease: 'out' });
R.k(18.35, -680, ANT, { plant: 'NF' }).k(18.43, -690, { ...TO, lean: 0.04, expr: 'firme' }, { plant: 'NF', ease: 'out' }).k(18.6, -840, AIRB).k(18.75, -930, WIDE, { ease: 'in' })
  .k(18.85, XR9, { ...WIDE, cg: 0.15 }, { slide: true, ease: 'out' }).k(19.15, XR9, { ...WIDE, cg: 1, trem: 2, agacha: 78 }, { plant: 'NF', ease: 'in' }).k(19.23, XR9, WIND, { plant: 'NF' })
  .k(19.28, XH, STRIKE, { ease: 'out3', plant: 'N' });
// 10. ele voa girando, bate no chão e arrasta; tenta levantar a cabeça e cai (20,1–26,5)
O.k(19.5, XOH + 140, FLYO(-2.2, -260), { ease: 'out' }).k(19.8, XOH + 260, FLYO(-4.6, -220), { ease: 'lin' }).k(20.1, XOH + 330, DEIT, { ease: 'in' })
  .k(20.6, XOH + 420, DEIT, { slide: true, ease: 'out' }).k(22.0, XOH + 420, DEIT, { plant: 'NF' }).k(22.5, XOH + 420, { ...DEIT, cabT: -0.45, rN: [60, -150], trem: 1.5 }, { plant: 'NF' })
  .k(23.0, XOH + 420, { ...DEIT, cabT: -0.45, rN: [80, -140], trem: 2 }, { plant: 'NF' }).k(23.25, XOH + 420, DEIT, { plant: 'NF', ease: 'in' }).k(26.5, XOH + 420, DEIT, { plant: 'NF' });
R.k(19.66, XH - 30, { ...STRIKE, lean: 0.4, rN: [178, 20] }, { slide: true, ease: 'out' }).k(20.6, XH - 30, { ...STRIKE, lean: 0.38, rN: [176, 24], expr: 'bravo' }, { plant: 'NF' })
  .k(21.3, XH - 30, U, { plant: 'F' }).k(22.2, XH - 30, { ...U, rN: [40, 150] }, { plant: 'NF' }).k(22.6, XH - 30, U, { plant: 'NF' }).k(26.5, XH - 30, U, { plant: 'NF' });
const FIM_A = 25.6;

// ---------- acertos: tipo → congelamento (s), tremida, impact frame
const TIPO = { leve: { d: 0.06, sh: [7, 0.14] }, bloq: { d: 0.06, sh: [9, 0.16] }, medio: { d: 0.09, sh: [12, 0.2] }, bloqforte: { d: 0.1, sh: [15, 0.24] }, chao: { d: 0.1, sh: [20, 0.32] },
  forte: { d: 0.22, sh: [24, 0.34], imp: 10 }, mega: { d: 0.4, sh: [36, 0.5], imp: 13 } };
const HITS = [[3.42, R, 'mN', 'medio', CIANO], [4.7, O, 'mF', 'bloq', OURO], [5.16, O, 'mF', 'bloq', OURO], [5.74, O, 'mN', 'bloqforte', OURO], [7.38, R, 'pF', 'forte', CIANO],
  [9.0, R, 'mN', 'forte', BRANCO], [11.27, O, 'mN', 'chao', OURO], [11.97, R, 'mF', 'leve', CIANO], [12.17, R, 'mN', 'leve', CIANO], [12.45, R, 'mN', 'medio', CIANO],
  [15.84, O, 'ombro', 'forte', OURO], [19.28, R, 'mN', 'mega', CIANO], [20.1, O, 'corpo', 'chao', BRANCO]].map(([a, L, onde, tipo, cor]) => {
  const s = estado(L, a), P = poseDe(L, s, a), S = B.esq(L.R, P), loc = onde === 'mN' ? S.mN : onde === 'mF' ? S.mF : onde === 'pF' ? S.pontaF : onde === 'ombro' ? S.omN : [0, 0];
  const p = onde === 'corpo' ? [s.X, -20] : [s.X + L.dir * loc[0], loc[1] + (s.c.baixa || 0)]; if (tipo === 'chao') p[1] = 0; return { a, L, tipo, cor, p, ux: L.dir, ...TIPO[tipo] }; });
const congela = HITS.map(h => ({ a: h.a, d: h.d, h })), REL = relogio(congela), FIM = +(REL.real(FIM_A)).toFixed(3);
HITS.forEach(h => { h.r = REL.real(h.a); });                                                       // começo do congelamento no tempo do vídeo
const FS = [[R, ROSA], [O, OTTO]];

// ---------- molas da capa/casaco (seguem a velocidade do corpo) e da câmera, no tempo de ação
function mola(alvo, f, z) { let tc = -1, x = 0, v = 0; const dt = 1 / 240, w = 2 * Math.PI * f;
  return t => { if (t < tc || tc < 0) { tc = 0; x = alvo(0); v = 0; } while (tc + dt <= t) { const a = w * w * (alvo(tc) - x) - 2 * z * w * v; v += a * dt; x += v * dt; tc += dt; } return x; }; }
const altura = s => (s.c.ar || 0) - Math.min(0, s.c.baixa || 0);
const PANO = FS.map(([L]) => { const vel = t => (estado(L, t + 1 / 120).X - estado(L, t - 1 / 120).X) * 60 * L.dir, vh = t => (altura(estado(L, t + 1 / 120)) - altura(estado(L, t - 1 / 120))) * 60;
  return { vento: mola(t => 0.35 + cl(vel(t) / 520, -1.6, 1.9), 2.4, 0.35), voo: mola(t => cl(-vh(t) / 450, -0.35, 0.9), 3, 0.32), bal: mola(t => cl(-(vel(t + 0.02) - vel(t - 0.02)) / 25 / 400, -0.5, 0.5), 2.2, 0.3) }; });
const camAlvo = a => { const xr = estado(R, a).X, xo = estado(O, a).X, gap = Math.abs(xo - xr); const f = sm((a - 22.3) / 2.2), cx = (xr + xo) / 2 + f * 110, z = cl(1150 / (gap + 620), 0.6, 1.15) * (1 + 0.04 * f); return { cx, z }; };
const camX = mola(a => camAlvo(a).cx, 1.7, 0.9), camZ = mola(a => camAlvo(a).z, 1.1, 1);
const tremida = (r, r0, amp, dur) => { const u = r - r0; if (u < 0 || u > dur) return [0, 0]; const R2 = rng(Math.round(u * 60) * 7919 + Math.round(r0 * 1000) * 31 + 5), an = R2() * TAU, k = 1 - u / dur; return [Math.cos(an) * amp * k, Math.sin(an) * amp * k]; };
const CHAO_Y = 1330;
function camera(a, r) { let z = camZ(a), sx = 0, sy = 0; for (const h of HITS) { const t = tremida(r, h.r, h.sh[0], h.sh[1] + h.d); sx += t[0]; sy += t[1]; if (h.imp) { const u = r - h.r - h.d; if (u > 0) z *= 1 + (h.tipo === 'mega' ? 0.1 : 0.06) * Math.exp(-u / 0.1); } } return { x: camX(a), z, sx, sy }; }
const tela = (c, p) => [(p[0] - c.x) * c.z + W / 2 + c.sx, CHAO_Y + p[1] * c.z + c.sy];

// ---------- poeira e marcas: varredura da ação a 60 qps (pé no chão que escorrega solta poeira; pouso solta um tufo)
const POE = [], MARCA = []; const puf = (a, x, o = {}) => POE.push({ a, x, y: o.y ?? -6, vx: o.vx ?? 0, vy: o.vy ?? -30, r: o.r ?? 16, vida: o.vida ?? 0.5, al: o.al ?? 0.45 });
{ for (const [L] of FS) { let ant = null; for (let i = 0; i <= FIM_A * 60; i++) { const a = i / 60, s = estado(L, a), h = altura(s), deit = (s.c.baixa || 0) > 150;
    const pes = deit ? [['X', s.X]] : [['N', s.wN], ['F', s.wF]];
    if (ant) { for (const [n, w] of pes) { const y = n === 'X' ? 0 : s.c['y' + n] - h, w0 = ant.w[n]; if (w0 == null) continue; const dx0 = w - w0; if (Math.abs(dx0) > 40) continue; const dx = cl(dx0, -12, 12);
        if (y > -3 && Math.abs(dx) > 2.6 && Math.abs(s.c.gira || 0) < 0.05 || deit && Math.abs(dx) > 2) { if (i % 2 === 0) puf(a, w, { vx: dx * 22, vy: -40 - Math.abs(dx) * 3, r: 13 + Math.abs(dx) * 0.8 + (deit ? 14 : 0), vida: 0.6, al: Math.min(0.55, 0.2 + Math.abs(dx) * 0.03) });
          if (Math.abs(dx) > 4) MARCA.push({ a, x0: w0, x1: w }); } }
      if (ant.h > 6 && h < 1 && !deit) for (const [n, w] of pes) for (let k = 0; k < 5; k++) puf(a, w + (k - 2) * 12, { vx: (k - 2) * 70, vy: -50 - k * 10, r: 14 + k * 3, vida: 0.55, al: 0.5 }); }
    ant = { h, w: Object.fromEntries(pes) }; } }
  for (const h of HITS) if (h.tipo === 'chao' || h.tipo === 'mega' || h.tipo === 'forte') { const x = h.tipo === 'chao' ? h.p[0] : estado(h.L === R ? O : R, h.a).X; for (let k = 0; k < (h.tipo === 'chao' ? 18 : 10); k++) puf(h.a, x + (k - 9) * 18, { vx: (k - 9) * 45, vy: -90 - (k % 4) * 40, r: 24 + (k % 5) * 6, vida: 0.9, al: 0.55 }); } }

// ---------- cenário
function fundo(c) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0f2236'); gr.addColorStop(0.55, '#1f4360'); gr.addColorStop(0.72, '#2d5a78'); gr.addColorStop(1, '#0a1824'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const lx = W * 0.72 - c.x * 0.05, lu = g.createRadialGradient(lx, CHAO_Y - 560, 20, lx, CHAO_Y - 560, 760); lu.addColorStop(0, 'rgba(190,225,250,0.3)'); lu.addColorStop(1, 'rgba(190,225,250,0)'); g.fillStyle = lu; g.fillRect(0, 0, W, H);
  for (const [par, cor, alt, sd] of [[0.15, '#1b3b55', 260, 3], [0.35, '#14304a', 170, 7]]) { g.fillStyle = cor; g.beginPath(); g.moveTo(-10, H); const off = c.x * par * c.z;
    for (let x = -400; x < W + 400; x += 40) { const wx = x + off, h = alt * (0.55 + 0.25 * Math.sin(wx / 230 + sd) + 0.2 * Math.sin(wx / 97 + sd * 2)); g.lineTo(x, CHAO_Y - 30 - h + c.sy * 0.3); } g.lineTo(W + 400, H); g.closePath(); g.fill(); }
  const nev = g.createLinearGradient(0, CHAO_Y - 260, 0, CHAO_Y + 20); nev.addColorStop(0, 'rgba(150,195,225,0)'); nev.addColorStop(1, 'rgba(150,195,225,0.22)'); g.fillStyle = nev; g.fillRect(0, CHAO_Y - 260, W, 280);
  const y0 = CHAO_Y + c.sy; g.fillStyle = '#0c1c2a'; g.fillRect(0, y0, W, H - y0); g.strokeStyle = 'rgba(169,210,242,0.45)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, y0); g.lineTo(W, y0); g.stroke();
}
function grama(a, c) { const R2 = rng(77); g.strokeStyle = '#2c5060'; g.lineCap = 'round';
  for (let wx = -1800; wx < 1800; wx += 130) { const j = R2(), x = wx + j * 60, p = tela(c, [x, 0]); if (p[0] < -60 || p[0] > W + 60) continue; const h = (16 + j * 16) * c.z; let b = 0;
    for (const hh of HITS) if (hh.tipo === 'mega' || hh.tipo === 'forte' || hh.tipo === 'chao') { const u = a - hh.a; if (u > 0 && u < 2) b += hh.ux * 0.9 * Math.exp(-u * 2.4) * Math.exp(-Math.abs(x - hh.p[0]) / 500) * (hh.tipo === 'mega' && x > hh.p[0] ? 1.6 : 1); }
    g.lineWidth = 4 * c.z; for (const an of [-0.5, 0, 0.45]) { const aa = an + cl(b, -1.2, 1.2); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + Math.sin(aa) * h, p[1] - Math.cos(aa) * h * 1.3); g.stroke(); } } }
function marcas(a, c) { g.strokeStyle = 'rgba(3,9,16,0.45)'; g.lineCap = 'round'; for (const m of MARCA) { if (m.a > a || a - m.a > 4) continue; const al = 0.45 * (1 - cl((a - m.a - 2.5) / 1.5)); g.strokeStyle = `rgba(3,9,16,${al})`; g.lineWidth = 6 * c.z; const p0 = tela(c, [m.x0, 0]), p1 = tela(c, [m.x1, 0]); g.beginPath(); g.moveTo(p0[0], p0[1] + 3); g.lineTo(p1[0], p1[1] + 3); g.stroke(); } }
function rachas(a, c) { for (const h of HITS) { if (h.tipo !== 'chao' || a < h.a) continue; const u = a - h.a, al = 1 - cl((u - 3) / 1.5); if (al <= 0) continue; const R2 = rng(Math.round(h.a * 100)), k = eOut(u / 0.12, 2);
  g.strokeStyle = `rgba(2,6,12,${0.85 * al})`; g.lineCap = 'round'; g.lineJoin = 'round';
  for (let i = 0; i < 7; i++) { const s = i % 2 ? 1 : -1, L = (90 + R2() * 220) * k; let x = h.p[0], y = 2; const pts = [tela(c, [x, y])]; for (let j = 0; j < 5; j++) { x += s * L / 5; y += 4 + R2() * 10; pts.push(tela(c, [x, Math.min(y, 60)])); } g.lineWidth = (6 - i * 0.5) * c.z; g.beginPath(); pts.forEach((p, j) => j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); }
  const ch = 1 - cl(u / 1.2); if (ch > 0) { g.fillStyle = `rgba(150,180,200,${ch})`; for (let i = 0; i < 26; i++) { const an = -Math.PI * (0.15 + R2() * 0.7), v = 300 + R2() * 700, x = h.p[0] + Math.cos(an) * v * u, y = Math.sin(an) * v * u + 1600 * u * u; if (y > 0) continue; const p = tela(c, [x, y]), q = (6 + R2() * 12) * c.z; g.fillRect(Math.round(p[0] / 4) * 4, Math.round(p[1] / 4) * 4, q, q); } } } }
function poeira(a, c) { for (const p of POE) { const u = a - p.a; if (u < 0 || u > p.vida) continue; const k = u / p.vida, x = p.x + p.vx * p.vida * eOut(k, 2) * 0.6, y = p.y + p.vy * p.vida * eOut(k, 1.6) * 0.6, s = tela(c, [x, y]), r = p.r * (1 + 2.2 * eOut(k)) * c.z;
  g.fillStyle = `rgba(196,220,238,${p.al * (1 - k) * (1 - k)})`; g.beginPath(); g.ellipse(s[0], s[1], r, r * 0.72, 0, 0, TAU); g.fill(); } }
function sombra(c, s, L) { const h = altura(s), deit = (s.c.baixa || 0) > 150, p = tela(c, [s.X + (s.c.px || 0) * L.dir, 0]), w = L.R.ombro * 0.75 * c.z * (deit ? 2.4 : 1) * (1 - Math.min(0.6, h / 500)); g.fillStyle = `rgba(2,6,14,${0.42 * (1 - Math.min(0.7, h / 400))})`; g.beginPath(); g.ellipse(p[0] + (deit ? -L.dir * 0 : 0), p[1] + 4, w, w * 0.14, 0, 0, TAU); g.fill(); }
// desenha um lutador; devolve o esqueleto e a pose
function lutadorDraw(a, c, L, ch, i, ctx = g) {
  const s = estado(L, a), P = poseDe(L, s, a), p = tela(c, [s.X, 0]), y = p[1] + (s.c.baixa || 0) * c.z, pn = PANO[i];
  const Q = { ...P, x: p[0], y, vista: 'l', dir: L.dir, s: c.z, sombra: false, vento: pn.vento(a), voo: pn.voo(a), bal: pn.bal(a), ...(P.gira ? {} : { chao: p[1] }) };
  const S = B.boneco(ctx, ch, Q);
  return { s, P, S, x: p[0], y };
}
// energia no punho da Rosa (carga)
function carga(a, k, m, c, pe) {
  if (k <= 0.01) return; g.save(); g.globalCompositeOperation = 'lighter';
  const gl = g.createRadialGradient(pe[0], pe[1], 0, pe[0], pe[1], 420 * c.z); gl.addColorStop(0, `rgba(${CIANO},${0.25 * k})`); gl.addColorStop(1, `rgba(${CIANO},0)`); g.fillStyle = gl; g.beginPath(); g.ellipse(pe[0], pe[1], 420 * c.z, 70 * c.z, 0, 0, TAU); g.fill();
  const R2 = rng(19); g.lineCap = 'round'; for (let i = 0; i < 26; i++) { const an = R2() * TAU, sp = 2.4 + R2() * 1.6, f = ((a * sp + R2()) % 1), r = (60 + 280 * (1 - f)) * c.z, l = (20 + 50 * (1 - f)) * c.z, al = Math.sin(Math.PI * f) * k;
    g.strokeStyle = `rgba(${i % 4 ? CIANO : BRANCO},${al})`; g.lineWidth = (2 + 3 * f) * c.z; g.beginPath(); g.moveTo(m[0] + Math.cos(an) * r, m[1] + Math.sin(an) * r); g.lineTo(m[0] + Math.cos(an) * (r + l), m[1] + Math.sin(an) * (r + l)); g.stroke(); }
  const fl = 1 + 0.1 * Math.sin(a * 61) + 0.06 * Math.sin(a * 37), rr = (26 + 52 * k) * c.z * fl, nu = g.createRadialGradient(m[0], m[1], 0, m[0], m[1], rr * 2.2);
  nu.addColorStop(0, `rgba(${BRANCO},${0.95 * k})`); nu.addColorStop(0.3, `rgba(${CIANO},${0.6 * k})`); nu.addColorStop(1, `rgba(${CIANO},0)`); g.fillStyle = nu; g.beginPath(); g.arc(m[0], m[1], rr * 2.2, 0, TAU); g.fill();
  g.fillStyle = `rgba(${BRANCO},${k})`; g.beginPath(); g.arc(m[0], m[1], rr * 0.45, 0, TAU); g.fill();
  for (let i = 0; i < 3; i++) { const a0 = a * (9 + i * 2.3) * (i % 2 ? -1 : 1) + i * 2.1; g.strokeStyle = `rgba(${BRANCO},${0.75 * k})`; g.lineWidth = (4 - i) * c.z; g.beginPath(); g.ellipse(m[0], m[1], rr * (1.05 + i * 0.28), rr * (0.55 + i * 0.12), a0, 0, Math.PI * 0.9); g.stroke(); }
  g.restore();
}
// rastro do golpe: mão do lutador andando rápido no mundo
function smear(a, c, L) { for (const n of ['N', 'F']) { const pts = []; let vmax = 0, q0 = null; for (let j = 3; j >= 0; j--) { const t = a - j * 0.006, s = estado(L, t), P = poseDe(L, s, t), m = P['m' + n], w = [s.X + L.dir * m[0], m[1] + (s.c.baixa || 0)]; if (q0) vmax = Math.max(vmax, Math.hypot(w[0] - q0[0], w[1] - q0[1]) / 0.006); q0 = w; pts.push(tela(c, w)); }
  if (vmax < 2200) continue; const k = cl((vmax - 2200) / 2000); g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const [w, al] of [[40, 0.14], [20, 0.32], [7, 0.6]]) { g.strokeStyle = `rgba(${BRANCO},${al * k})`; g.lineWidth = w * c.z; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); } g.restore(); } }
// faíscas + clarão + anel no ponto do acerto (tempo do vídeo)
function acertoFx(r, c) { for (const h of HITS) { const u = r - h.r; if (u < 0 || u > 0.7) continue; const p = tela(c, h.p), forte = h.tipo === 'forte' || h.tipo === 'mega', n = { leve: 10, bloq: 12, medio: 18, bloqforte: 22, chao: 20, forte: 30, mega: 44 }[h.tipo], R2 = rng(Math.round(h.a * 1000));
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  const dur = forte ? 0.55 : 0.32, k = u / dur; if (k < 1) for (let i = 0; i < n; i++) { const an = (h.ux > 0 ? 0 : Math.PI) + (R2() - 0.5) * (h.tipo === 'chao' ? 3 : 2.2) - (h.tipo === 'chao' ? Math.PI / 2 * h.ux * 0 + Math.PI / 2 : 0) * 0, v = (forte ? 700 : 420) * (0.4 + R2() * 0.8) * c.z, l = (18 + R2() * 40) * c.z, d0 = v * eOut(k, 2) * 0.6;
      const x = p[0] + Math.cos(an) * d0, y = p[1] + Math.sin(an) * d0 * (h.tipo === 'chao' ? -Math.abs(1) : 1); g.globalAlpha = 1 - k; g.strokeStyle = i % 3 ? `rgb(${BRANCO})` : `rgb(${h.cor})`; g.lineWidth = (4 * (1 - k) + 1) * c.z; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(an) * l * (1 - k), y + Math.sin(an) * l * (1 - k)); g.stroke(); }
  g.globalAlpha = 1; if (u < 0.05) { g.fillStyle = `rgba(${BRANCO},0.95)`; g.beginPath(); g.arc(p[0], p[1], (forte ? 90 : 46) * c.z, 0, TAU); g.fill(); }
  const ra = u / (forte ? 0.5 : 0.3); if (ra < 1) { g.strokeStyle = `rgba(${h.cor},${0.8 * (1 - ra)})`; g.lineWidth = (forte ? 10 : 5) * c.z * (1 - ra) + 1; const rr = (30 + (forte ? 420 : 160) * eOut(ra, 2)) * c.z; g.beginPath(); g.ellipse(p[0], p[1], rr * 0.42, rr, 0, 0, TAU); g.stroke(); }
  g.restore(); } }
// disparo do golpe final: corpo do raio, frente em crescente, anéis (motivo da série)
const MEGA = HITS.find(h => h.tipo === 'mega');
function disparo(r, c) { const u = r - MEGA.r - MEGA.d * 0.55; if (u < 0 || u > 1.2) return; const o = MEGA.p, alc = 2200 * eOut(u / 0.7, 2.4), fx = o[0] + alc, corpoA = 1 - sm((u - 0.25) / 0.45), fr = 1 - sm((u - 0.4) / 0.35);
  g.save(); g.globalCompositeOperation = 'lighter';
  if (corpoA > 0) { const p0 = tela(c, o), p1 = tela(c, [fx, o[1]]), hw = x => (22 + 0.24 * (x - o[0])) * c.z * (0.6 + 0.4 * corpoA), gr = g.createLinearGradient(p0[0], 0, p1[0], 0);
    gr.addColorStop(0, `rgba(${CIANO},${0.15 * corpoA})`); gr.addColorStop(0.75, `rgba(${CIANO},${0.55 * corpoA})`); gr.addColorStop(1, `rgba(${BRANCO},${0.9 * corpoA})`); g.fillStyle = gr;
    g.beginPath(); g.moveTo(p0[0], p0[1] - hw(o[0])); g.lineTo(p1[0], p1[1] - hw(fx)); g.lineTo(p1[0], p1[1] + hw(fx)); g.lineTo(p0[0], p0[1] + hw(o[0])); g.closePath(); g.fill();
    g.strokeStyle = `rgba(${BRANCO},${corpoA})`; g.lineWidth = 12 * c.z * corpoA + 1; g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke(); }
  for (let e = 0; e < 0.36; e += 0.03) { const v = u - e; if (v < 0 || v > 0.55) continue; const xe = o[0] + 2200 * eOut(e / 0.7, 2.4), rr = (34 + 320 * eOut(v / 0.55, 2)) * c.z, s = tela(c, [xe, o[1]]); g.strokeStyle = `rgba(${CIANO},${0.75 * (1 - v / 0.55)})`; g.lineWidth = 6 * c.z * (1 - v / 0.55) + 1; g.beginPath(); g.ellipse(s[0], s[1], rr * 0.36, rr, 0, 0, TAU); g.stroke(); }
  if (fr > 0) { const s = tela(c, [fx, o[1]]), ry = (110 + 0.18 * alc) * c.z; for (const [w, al, cor] of [[40, 0.35, CIANO], [16, 0.95, BRANCO]]) { g.strokeStyle = `rgba(${cor},${al * fr})`; g.lineWidth = w * c.z; g.beginPath(); g.ellipse(s[0] - 30 * c.z, s[1], 70 * c.z, ry, 0, -Math.PI * 0.42, Math.PI * 0.42); g.stroke(); } }
  g.restore(); }

// ---------- impact frame (receita aprovada no Adonis, impactFrame2): desenhos segurados, 2 valores + 1 cor, pincel seco na direção da força, respingo de tinta
function brush(c, x0, y0, x1, y1, wd, seed, col) { const r = rng(seed), dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, n = Math.max(5, wd / 5 | 0); c.fillStyle = col;
  for (let i = 0; i < n; i++) { const o = (i / (n - 1) - 0.5) * wd * (0.8 + r() * 0.3), a = r() * 0.16, b = 1 - r() * 0.22, w = (wd / n) * (0.7 + r() * 1.3) * (1 - Math.abs(i / (n - 1) - 0.5) * 0.8);
    const ax = x0 + dx * a + nx * o, ay = y0 + dy * a + ny * o, bx = x0 + dx * b + nx * o, by = y0 + dy * b + ny * o, mx = (ax + bx) / 2 + nx * (r() - 0.5) * 6, my = (ay + by) / 2 + ny * (r() - 0.5) * 6;
    c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(mx + nx * w, my + ny * w, bx, by); c.quadraticCurveTo(mx - nx * w, my - ny * w, ax, ay); c.fill(); } }
function arcBrush(c, cx, cy, Rr, a0, a1, wd, seed, col) { const r = rng(seed), n = 9; c.strokeStyle = col; c.lineCap = 'round';
  for (let i = 0; i < n; i++) { const k = i / (n - 1) - 0.5, rr = Rr + k * wd, s0 = a0 + r() * 0.25, s1 = a1 - r() * 0.3; c.lineWidth = (wd / n) * (1.2 + r() * 1.4) * (1 - Math.abs(k) * 1.1); c.beginPath(); c.arc(cx, cy, rr, s0, s1); c.stroke(); } }
function splat(c, x, y, ux, uy, n, seed, col, reach = 900) { const r = rng(seed); c.fillStyle = col;
  for (let i = 0; i < n; i++) { const d = Math.pow(r(), 1.6) * reach + 60, sp = (r() - 0.5) * 1.5, ca = Math.cos(sp), sa = Math.sin(sp), vx = ux * ca - uy * sa, vy = ux * sa + uy * ca, sz = Math.max(3, Math.pow(r(), 3.2) * 60 * (1 - d / (reach * 1.4)));
    c.save(); c.translate(x + vx * d, y + vy * d); c.rotate(Math.atan2(vy, vx)); c.beginPath(); c.ellipse(0, 0, sz * (1 + r() * 1.6), sz * 0.6, 0, 0, 7); c.fill(); c.restore(); } }
const GRAO = (() => { const cc = document.createElement('canvas'); cc.width = cc.height = 256; const q = cc.getContext('2d'), R2 = rng(3), im = q.createImageData(256, 256); for (let i = 0; i < im.data.length; i += 4) { const v = 90 + R2() * 90; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } q.putImageData(im, 0, 0); return g.createPattern(cc, 'repeat'); })();
const GRAB = document.createElement('canvas'); GRAB.width = W; GRAB.height = H;
const hex = c => `rgb(${c})`;
const SIL = document.createElement('canvas'); SIL.width = W; SIL.height = H;
function silhuetas(a, c, col, dx = 0, dy = 0, sc = 1, px = W / 2, py = H / 2) { const q = SIL.getContext('2d'); q.setTransform(1, 0, 0, 1, 0, 0); q.globalCompositeOperation = 'source-over'; q.globalAlpha = 1; q.clearRect(0, 0, W, H);
  q.translate(px + dx, py + dy); q.scale(sc, sc); q.translate(-px, -py); FS.forEach(([L, ch], i) => lutadorDraw(a, c, L, ch, i, q)); q.setTransform(1, 0, 0, 1, 0, 0); q.globalCompositeOperation = 'source-in'; q.fillStyle = `rgb(${col})`; q.fillRect(0, 0, W, H); q.globalCompositeOperation = 'source-over';
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(SIL, 0, 0); g.restore(); }
function impacto(a, r, c0, h, k) {                                                                    // k = quadro dentro do impact frame; câmera fecha no acerto
  const zc = c0.z * (h.tipo === 'mega' ? 1.75 : 1.6), c = { x: h.p[0] + h.ux * 60, z: zc, sx: 0, sy: H * 0.46 - (CHAO_Y + h.p[1] * zc) };
  const N = h.imp, p = tela(c, h.p); let x = p[0], y = p[1]; const ux = h.ux, uy = h.tipo === 'mega' ? -0.08 : 0, px = -uy, py = ux, AC = `rgb(${h.cor})`, AC0 = h.cor;
  const st = N === 13 ? (k < 2 ? 0 : k < 6 ? 1 : k < 10 ? 2 : 3) : (k < 2 ? 0 : k < 5 ? 1 : k < 8 ? 2 : 3);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
  if (st === 0) { g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); silhuetas(a, c, [217, 212, 204]); }
  else if (st === 1) { g.fillStyle = '#07070a'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 16; i++) { const o = (i - 7.5) * 120 + Math.sin(i * 7.7) * 40, l = 500 + (i * 131 % 900); brush(g, x + px * o - ux * 300, y + py * o - uy * 300, x + px * o + ux * l, y + py * o + uy * l, 16 + (i * 37 % 34), 40 + i, 'rgba(255,255,255,0.2)'); }
    g.globalAlpha = 0.35; silhuetas(a, c, [255, 255, 255], -ux * 46, -uy * 46); g.globalAlpha = 1; silhuetas(a, c, [255, 255, 255]);
    arcBrush(g, x - ux * 120, y - uy * 120, 470, Math.atan2(uy, ux) - 1.25, Math.atan2(uy, ux) + 1.25, 150, 5, AC);
    splat(g, x, y, ux, uy, 70, 11, '#fff', 900); splat(g, x, y, ux, uy, 14, 13, AC, 700); }
  else if (st === 2) { g.fillStyle = '#f3ece0'; g.fillRect(0, 0, W, H);
    const gr = g.createRadialGradient(x, y, 0, x, y, 900); gr.addColorStop(0, `rgba(${AC0},0.95)`); gr.addColorStop(0.45, `rgba(${AC0},0.25)`); gr.addColorStop(1, `rgba(${AC0},0)`); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 12; i++) { const o = (i - 5.5) * 150 + Math.sin(i * 5.3) * 50, l = 700 + (i * 173 % 800); brush(g, x + px * o + ux * 80, y + py * o + uy * 80, x + px * o + ux * l, y + py * o + uy * l, 22 + (i * 29 % 40), 70 + i, 'rgba(12,10,12,0.9)'); }
    silhuetas(a, c, [11, 10, 13], ux * 18, uy * 18, 1.03, x, y);
    arcBrush(g, x - ux * 60, y - uy * 60, 560, Math.atan2(uy, ux) - 1.1, Math.atan2(uy, ux) + 1.1, 110, 6, '#0b0a0d'); arcBrush(g, x - ux * 60, y - uy * 60, 500, Math.atan2(uy, ux) - 0.9, Math.atan2(uy, ux) + 0.9, 46, 7, '#fff');
    splat(g, x, y, ux, uy, 110, 21, '#0b0a0d', 1100); splat(g, x, y, -ux, -uy, 26, 23, '#0b0a0d', 420); }
  else { cena(a, r, c0, true); const pp = tela(c0, h.p); x = pp[0]; y = pp[1]; const q = GRAB.getContext('2d'); q.globalCompositeOperation = 'copy'; q.drawImage(cv, 0, 0); q.globalCompositeOperation = 'source-over';
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H); const z = 1.08 - 0.03 * (k - (N === 13 ? 10 : 8)); g.translate(x, y); g.scale(z, z); g.translate(-x, -y);
    g.filter = 'contrast(1.35) saturate(1.3) brightness(1.1)'; g.drawImage(GRAB, 0, 0); g.filter = 'none';
    g.globalAlpha = 0.28; g.globalCompositeOperation = 'screen'; g.drawImage(GRAB, ux * 22, uy * 22); g.drawImage(GRAB, -ux * 22, -uy * 22); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  g.restore();
  if (st === 1 || st === 2) { g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.22; g.fillStyle = GRAO; g.fillRect(0, 0, W, H); g.restore(); }
}
function vinheta() { const v = g.createRadialGradient(W / 2, H * 0.55, H * 0.25, W / 2, H * 0.55, H * 0.75); v.addColorStop(0, 'rgba(2,6,12,0)'); v.addColorStop(1, 'rgba(2,6,12,0.55)'); g.fillStyle = v; g.fillRect(0, 0, W, H); }

function cena(a, r, c, semImp) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
  fundo(c); marcas(a, c); rachas(a, c); grama(a, c);
  for (const [L] of FS) sombra(c, estado(L, a), L);
  const d = FS.map(([L, ch], i) => i === 0 ? null : lutadorDraw(a, c, L, ch, i)); const dr = lutadorDraw(a, c, R, ROSA, 0);
  const k = dr.s.c.cg; if (k > 0.01) carga(a, k, [dr.x + dr.S.mN[0] * c.z, dr.y + dr.S.mN[1] * c.z], c, [dr.x, tela(c, [0, 0])[1]]);
  smear(a, c, R); smear(a, c, O); acertoFx(r, c); disparo(r, c); poeira(a, c); vinheta();
  for (const h of HITS) { const u = r - h.r - h.d; if (h.imp && u > 0 && u < 0.12) { g.fillStyle = `rgba(234,248,255,${(h.tipo === 'mega' ? 0.3 : 0.18) * (1 - u / 0.12)})`; g.fillRect(0, 0, W, H); } }
}
function frame(r) {
  const T = REL.acao(r), a = T.a; B.RELOGIO.t = a; const c = camera(a, r);
  if (T.f && T.f.h.imp) { const k = Math.floor(T.u * 60 + 1e-6); if (k < T.f.h.imp) { impacto(a, r, c, T.f.h, k); return; } }
  cena(a, r, c);
}
function folha() {                                                                                     // raio-X: 10 instantes-chave, câmera fixa
  cv.width = 2600; cv.height = 1700; const ts = [3.2, 3.42, 4.7, 5.74, 7.38, 9.0, 11.27, 12.45, 15.84, 16.42, 19.2, 19.28];
  ts.forEach((a, i) => { const row = Math.floor(i / 4), col = i % 4; g.save(); g.beginPath(); g.rect(col * 650, row * 566, 650, 566); g.clip(); g.translate(col * 650, row * 566);
    const xr = estado(R, a).X, xo = estado(O, a).X, c = { x: (xr + xo) / 2, z: 0.48, sx: 0, sy: 0 }; g.fillStyle = '#12283a'; g.fillRect(0, 0, 650, 566);
    const tl = p => [(p[0] - c.x) * c.z + 325, 500 + p[1] * c.z]; g.strokeStyle = 'rgba(169,210,242,0.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 500); g.lineTo(650, 500); g.stroke();
    FS.forEach(([L, ch], j) => { const s = estado(L, a), P = poseDe(L, s, a), p = tl([s.X, 0]); B.boneco(g, ch, { ...P, x: p[0], y: p[1] + (s.c.baixa || 0) * c.z, vista: 'l', dir: L.dir, s: c.z, sombra: false }); });
    for (const h of HITS) if (Math.abs(h.a - a) < 0.01) { const p = tl(h.p); g.strokeStyle = '#ff5a60'; g.lineWidth = 3; g.beginPath(); g.arc(p[0], p[1], 14, 0, TAU); g.stroke(); }
    g.font = '700 30px RC'; g.fillStyle = '#f2ead8'; g.fillText(`${i + 1} · ${a.toFixed(2)} s`, 16, 40); g.restore(); });
}
await document.fonts.load('700 84px RC');
window.PLANOS = [{ id: 'luta', t0: 0, D: FIM }]; window.END = FIM; console.log('FIM ' + FIM);
window.seek = async t => { if (FOLHA) folha(); else frame(t); }; await window.seek(0); window.READY = true;
