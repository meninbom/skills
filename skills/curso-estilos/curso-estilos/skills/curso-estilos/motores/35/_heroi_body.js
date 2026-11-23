
// ================= a guardiã do passo — reconstrução da arte conceito/escolhido.jpg (Z-Image, folha A)
// Medidas tiradas em pixels na vista de frente: 882 px do topo do capuz à sola = 1,80 m (1 px = 2,04 mm).
//   elmo 247 px de altura (0,50 m) × 185 px de largura (0,38 m), centro a 1,535 m · gola de lã 0,54 m de largura, 1,17–1,31 m
//   ombreiras de 1,04 a 1,29 m, 0,24 m de largura, centro a ±0,30 m · cinto a 0,86 m · barra do gibão a 0,39 m, 0,60 m de largura
//   braçadeiras 0,20 m de altura a 0,81 m · mãos a 0,63 m · faixa de bronze das botas 0,26–0,32 m · pés afastados 0,29 m
//   marreta: cabo ~0,62 m, cabeça de aço em barril 0,30 × 0,19 m
const B = { teal: 0x34585a, tealD: 0x284446, rust: 0xb85a30, rustD: 0x8a3e1e, bronze: 0xc89a52, bronzeD: 0x7a5a26, steel: 0xffffff, steelP: 0x9aa0a8, steelD: 0x5a6068, leather: 0x6a3e28, leatherD: 0x3a2418, wood: 0x6a3e2c, dark: 0x0e0d10, skin: 0xf0a07a };
// bronze batido (mesmos 3 mapas casados do aço, com a pintura do bronze por baixo)
const BZ1 = steelSet(23, 120, '#d2aa5c', 'gold'), BZ2 = steelSet(29, 90, '#c49c52', 'gold'); for (const S of [BZ1, BZ2]) for (const k in S) S[k].repeat.set(2, 1);
const BZ = o => ({ metal: 1, ...BZ1, rough: 0.3, ...o });
// acolchoado: a pintura do Z-Image (gomos quadrados) vira cor e relevo
const quiltSet = (c0, c1, seed, rep = 1) => { const A = document.createElement('canvas'); A.width = A.height = 512; const a = A.getContext('2d'), w = 512, h = 512;
  const gr = a.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, c0); gr.addColorStop(1, c1); a.fillStyle = gr; a.fillRect(0, 0, w, h); if (paint(a, w, h, 'quilt', c0, 0.7, 0.02) || paint(a, w, h, 'navy', c0, 0.75, 0.04)) { a.globalAlpha = 0.3; a.fillStyle = gr; a.fillRect(0, 0, w, h); a.globalAlpha = 1; }
  wear(a, w, h, seed, 0); const t = new THREE.CanvasTexture(A); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep * 1.2); return { map: t, bump: 2.6 }; };
const QT = quiltSet('#3c6464', '#30585a', 41, 0.9), QTC = quiltSet('#3c6464', '#30585a', 49, 3.6), QTD = quiltSet('#335a5a', '#2a4c4c', 43, 0.8), QTL = quiltSet('#34585a', '#2c4a4c', 47, 0.8);
const woolTex = (c0, c1, seed) => mkTex(512, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(0, 0, w, h); if (paint(g, w, h, 'wool', c0, 0.3, 0.04) || paint(g, w, h, 'crimson', c0, 0.9, 0.04)) { g.globalAlpha = 0.72; g.fillStyle = gr; g.fillRect(0, 0, w, h); g.globalAlpha = 1; } wear(g, w, h, seed, 30); });
const WOOL = woolTex('#c4643a', '#ac5230', 61), WOOLD = woolTex('#a44e2a', '#8a3e20', 67);
const WL = o => ({ map: WOOL, bump: 0.7, rim: 1.2, ...o });
const leatherT = mkTex(256, 256, (g, w, h) => { g.fillStyle = '#6a3e28'; g.fillRect(0, 0, w, h); paint(g, w, h, 'leather', '#6a3e28', 0.5, 0.3); wear(g, w, h, 53, 60); });
const LT = o => ({ map: leatherT, spec: 0.35, ...o });
const woodT = mkTex(256, 512, (g, w, h) => { g.fillStyle = '#6a3e2c'; g.fillRect(0, 0, w, h); paint(g, w, h, 'wood', '#6a3e2c', 0.5, 0.1, true); });
const ST = o => ({ metal: 1, ...S1, ...o }), SK = o => ({ keep: 0.3, spec: 0.3, rim: 0.5, ...o });

function makeBoot() { const g = new THREE.Group(), ft = new THREE.Group(); g.add(ft); const o = LT({ spec: 0.45 });
  const heel = ball(1, 0xffffff, o); heel.scale.set(0.1, 0.105, 0.115); heel.position.set(0, -0.01, -0.005); ft.add(heel);
  const mid = ball(1, 0xffffff, o); mid.scale.set(0.104, 0.095, 0.17); mid.position.set(0, -0.022, 0.09); ft.add(mid);
  const toe = ball(1, 0xffffff, o); toe.scale.set(0.11, 0.095, 0.115); toe.position.set(0, -0.026, 0.2); ft.add(toe);
  const sole = mesh(new THREE.CylinderGeometry(1, 1, 0.03, 28), B.leatherD); sole.scale.set(0.11, 1, 0.21); sole.position.set(0, -0.085, 0.09); ft.add(sole);
  const shaft = lathe([[0.1, -0.06], [0.098, 0.05], [0.1, 0.16]], 0xffffff, LT({ side: THREE.DoubleSide }), 26); g.add(shaft);
  // tira com fivela de argola no tornozelo
  const st = mesh(new THREE.TorusGeometry(0.104, 0.013, 8, 24), B.leatherD, LT()); st.rotation.x = Math.PI / 2 + 0.12; st.position.y = -0.01; g.add(st);
  const ring = mesh(new THREE.TorusGeometry(0.02, 0.006, 8, 16), B.bronze, BZ()); ring.position.set(0.098, -0.012, 0.03); ring.rotation.y = Math.PI / 2; g.add(ring);
  // faixa grossa de bronze no alto do cano (0,26–0,32 m), com rebites
  const band = lathe([[0.108, 0.155], [0.118, 0.165], [0.118, 0.205], [0.108, 0.215]], B.bronze, BZ({ side: THREE.DoubleSide }), 30); g.add(band);
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, rv = ball(0.008, B.bronzeD, BZ()); rv.position.set(Math.sin(a) * 0.12, 0.185, Math.cos(a) * 0.12); g.add(rv); }
  return { g, ft }; }
// mão fechada (pele, grande como na arte): +y = antebraço→mão, o cabo atravessa em x
function fist(sx) { const g = new THREE.Group(), o = SK();
  const palm = ball(1, B.skin, o); palm.scale.set(0.06, 0.064, 0.066); g.add(palm);
  for (let i = 0; i < 4; i++) { const f = ball(1, B.skin, o); f.scale.set(0.028, 0.026, 0.034); f.position.set((i - 1.5) * 0.029, 0.046 - Math.abs(i - 1.5) * 0.004, 0.04); g.add(f); }
  const th = ball(1, B.skin, o); th.scale.set(0.024, 0.04, 0.024); th.position.set(-sx * 0.058, 0.025, 0.028); g.add(th);
  g.scale.setScalar(1.25); return g; }

const HIP = 0.46;
// gibão: perfil (raio, y) a partir do quadril; cinto em 0,40 (0,86 m), topo dos ombros em 0,83
const PROF = [[0.22, 0.32], [0.245, 0.38], [0.25, 0.44], [0.262, 0.52], [0.27, 0.6], [0.264, 0.68], [0.24, 0.74], [0.19, 0.79], [0.11, 0.82], [0.0, 0.83]], CZ = 0.82, CZ0 = 0.012;
const profR = y => { for (let i = 1; i < PROF.length; i++) if (y <= PROF[i][1]) { const a = PROF[i - 1], b = PROF[i]; return lerp(a[0], b[0], cl((y - a[1]) / (b[1] - a[1]))); } return 0; };
const onT = (a, y, out, p) => { const r = profR(y) + out; return p.set(Math.sin(a) * r, y, CZ0 + Math.cos(a) * r * CZ); };
// ik de 2 ossos em 3D com vetor de polo
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3();
function ik3(S, T, l1, l2, pole, E) { _v1.subVectors(T, S); let d = _v1.length(); const m = l1 + l2 - 0.002; if (d > m) { _v1.multiplyScalar(m / d); T.copy(S).add(_v1); d = m; } _v1.normalize();
  const ca = cl((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), sa = Math.sqrt(1 - ca * ca); _v2.copy(pole).addScaledVector(_v1, -pole.dot(_v1)).normalize(); E.copy(S).addScaledVector(_v1, l1 * ca).addScaledVector(_v2, l1 * sa); }

export function criaHeroi(opt = {}) {
  const root = new THREE.Group(), add = m => { root.add(m); return m; };
  const L = { th: 0.2, sh: 0.2, hipX: 0.145, ank: 0.09, up: 0.235, fo: 0.215 };
  // ---------- pernas: calça azul-petróleo, bota de couro com faixa de bronze
  const legs = [1, -1].map(sx => ({ sx, thigh: add(cyl(0.11, 0.115, 0xffffff, { ...QTL })), shin: add(cyl(0.085, 0.098, 0xffffff, { ...QTL })), knee: add(ball(1, 0xffffff, { ...QTL })), boot: makeBoot(), q: { k: new THREE.Vector3(), f: new THREE.Vector3() }, ang: 0 }));
  legs.forEach(l => { add(l.boot.g); l.knee.scale.set(0.1, 0.1, 0.1); });
  const hipG = new THREE.Group(); add(hipG); const pelvis = ball(1, 0xffffff, { ...QTL }); pelvis.scale.set(0.25, 0.15, 0.18); hipG.add(pelvis);
  // ---------- tronco: gibão acolchoado
  const body = new THREE.Group(); add(body);
  const coat = lathe(PROF, 0xffffff, { ...QTC, rim: 0.9 }, 48); coat.scale.z = CZ; coat.position.z = CZ0; body.add(coat);
  const shl = ball(1, 0xffffff, { ...QTD }); shl.scale.set(0.33, 0.1, 0.16); shl.position.set(0, 0.77, -0.005); body.add(shl);
  // cinto + fivela quadrada de bronze com 4 rebites
  const belt = lathe([[0.25, 0.37], [0.262, 0.38], [0.262, 0.425], [0.25, 0.435]], 0xffffff, LT(), 40); belt.scale.z = CZ + 0.01; belt.position.z = CZ0; body.add(belt);
  { const z0 = CZ0 + 0.262 * (CZ + 0.01); const s = new THREE.Shape(); s.moveTo(-0.07, -0.045); s.lineTo(0.07, -0.045); s.lineTo(0.07, 0.045); s.lineTo(-0.07, 0.045); s.closePath(); const hl = new THREE.Path(); hl.moveTo(-0.045, -0.024); hl.lineTo(0.045, -0.024); hl.lineTo(0.045, 0.024); hl.lineTo(-0.045, 0.024); hl.closePath(); s.holes.push(hl);
    const bk = mesh(new THREE.ExtrudeGeometry(s, { depth: 0.014, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2 }), B.bronze, BZ()); bk.position.set(0, 0.402, z0 - 0.002); body.add(bk);
    const tg = box(0.09, 0.048, 0.01, 0xffffff, LT()); tg.position.set(0, 0.402, z0 + 0.004); body.add(tg);
    for (const [x, y] of [[-0.057, 0.034], [0.057, 0.034], [-0.057, -0.034], [0.057, -0.034]]) { const rv = ball(0.007, B.bronzeD, BZ()); rv.position.set(x, 0.402 + y, z0 + 0.02); body.add(rv); }
    for (const sx of [1, -1]) for (let i = 1; i < 5; i++) { const a = sx * (0.42 + i * 0.22), h = ball(0.006, B.bronzeD, BZ()); onT(a, 0.402, 0.006, h.position); h.position.x *= 1.0; body.add(h); } }
  // talabartes cruzados no peito com argola quadrada no meio
  for (const sx of [1, -1]) body.add(tube((u, p) => { const a = sx * lerp(-0.95, 0.95, u), y = lerp(0.8, 0.42, u); onT(a, y, 0.012, p); }, 24, 0.02, 0xffffff, LT()));
  { const rg = new THREE.Group(); onT(0, 0.615, 0.03, rg.position); rg.rotation.z = Math.PI / 4; const s = new THREE.Shape(); s.moveTo(-0.035, -0.035); s.lineTo(0.035, -0.035); s.lineTo(0.035, 0.035); s.lineTo(-0.035, 0.035); s.closePath(); const hl = new THREE.Path(); hl.moveTo(-0.024, -0.024); hl.lineTo(0.024, -0.024); hl.lineTo(0.024, 0.024); hl.lineTo(-0.024, 0.024); hl.closePath(); s.holes.push(hl);
    rg.add(mesh(new THREE.ExtrudeGeometry(s, { depth: 0.008, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 1 }), B.bronze, BZ())); body.add(rg);
    const stud = ball(0.016, B.bronze, BZ()); onT(0, 0.74, 0.004, stud.position); stud.scale.z = 0.6; body.add(stud); }
  // saia do gibão até 0,39 m (abre 0,60 m na barra), em 4 abas que acompanham as coxas
  const flaps = [[0.03, 1.55], [1.59, 3.11], [-1.55, -0.03], [-3.11, -1.59]].map(([a0, a1], i) => { const g = new THREE.Group(); g.position.set(0, 0.385, 0); body.add(g);
    const fn = strip(0, CZ0, 0.252, 0.212, 0.2, a0, a1, 0.0, -0.46); g.add(surf(fn, 18, 8, 0xffffff, { ...QT })); g.add(tube((u, p) => fn(u, 1, p), 18, 0.01, 0xffffff, { ...QTD })); const m = (a0 + a1) / 2; return { g, leg: m > 0 ? 0 : 1, back: Math.abs(m) > 1.57 }; });
  // ombreiras de bronze nos dois ombros: casca lisa, aro, rebites na borda de baixo
  for (const sx of [1, -1]) { const g = new THREE.Group(); g.position.set(sx * 0.27, 0.69, 0.0); g.scale.x = sx; g.rotation.z = -sx * 0.72; body.add(g);
    const RX = 0.135, RY = 0.13, RZ = 0.16, TM = 1.5, sh = (th, ph, p) => { const q = Math.pow(Math.sin(th), 0.85); p.set(q * Math.cos(ph) * RX, Math.cos(th) * RY, q * Math.sin(ph) * RZ); };
    g.add(surf((u, v, p) => sh(v * TM, u * Math.PI * 2, p), 48, 16, B.bronze, BZ()));
    g.add(tube((u, p) => sh(TM, u * Math.PI * 2, p), 48, 0.014, B.bronze, BZ({ ...BZ2 }), true));
    for (let i = 0; i < 7; i++) { const rv = ball(0.0095, B.bronzeD, BZ()); sh(TM * 0.86, -0.3 + i * 0.52, rv.position); g.add(rv); } }
  // ---------- cabeça: elmo fechado (viseira com janela escura, fenda de baixo, furos de respiro), capuz e gola de lã ferrugem
  const head = new THREE.Group(); head.position.set(0, 1.06, 0.04); body.add(head); const HG = new THREE.Group(); head.add(HG);
  const HX = 0.2, HZ = 0.21, HYT = 0.255, HYB = -0.235;
  const hr = t => t >= 0 ? Math.sqrt(Math.max(0, 1 - Math.pow(t, 2.2))) : Math.pow(Math.max(0, 1 - Math.pow(-t, 2.6)), 0.5) * (1 - 0.14 * t * t);
  const helmP = Array.from({ length: 25 }, (_, i) => { const t = -1 + i / 24 * 2; return [Math.max(0.0005, hr(t) * HX), t >= 0 ? t * HYT : -t * HYB]; });
  const helm = lathe(helmP, 0xe8ecf0, ST({ ...S2, rough: 0.42 }), 56); helm.scale.z = HZ / HX; HG.add(helm);
  const onH = (a, y, out, p) => { const t = cl(y >= 0 ? y / HYT : y / -HYB * -1 * -1 * -1, -1, 1), tt = y >= 0 ? y / HYT : -(y / HYB), r = hr(cl(tt, -1, 1)); return p.set(Math.sin(a) * (r * HX + out), y, Math.cos(a) * (r * HZ + out)); };
  // janela dos olhos: retângulo arredondado escuro (+0,022 a −0,049 m, 0,27 m de largura)
  HG.add(surf((u, v, p) => { const a = lerp(-0.8, 0.8, u), y = lerp(0.022, -0.049, v), e = Math.min(1, Math.min(u, 1 - u) * 8) * Math.min(1, Math.min(v, 1 - v) * 6); onH(a, y, 0.0015 - 0.012 * e, p); }, 30, 6, B.dark, { rim: 0, rough: 1, bump: 0 }));
  HG.add(tube((u, p) => { const k = u * 4, s = Math.floor(k) % 4, f = k - Math.floor(k), pts = [[-0.8, 0.026], [0.8, 0.026], [0.8, -0.053], [-0.8, -0.053]], A0 = pts[s], A1 = pts[(s + 1) % 4]; onH(lerp(A0[0], A1[0], f), lerp(A0[1], A1[1], f), 0.004, p); }, 48, 0.006, B.steelP, ST({ ...S3 }), true));
  HG.add(surf((u, v, p) => onH(lerp(-0.62, 0.62, u), lerp(-0.062, -0.071, v), -0.004, p), 24, 2, B.dark, { rim: 0, rough: 1, bump: 0 }));
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6 - r; i++) { const a = (i - (5 - r) / 2) * 0.17, rv = ball(0.0085, B.dark, { rim: 0, bump: 0 }); onH(a, -0.115 - r * 0.038, -0.001, rv.position); rv.scale.set(1, 1, 0.5); rv.lookAt(0, rv.position.y, 0); if (Math.abs(a) > 0.08) HG.add(rv); }
  // nervura central da viseira (do alto ao queixo), faixa da testa com rebites e botões nas têmporas
  HG.add(tube((u, p) => onH(0, lerp(0.25, -0.225, u), 0.006, p), 24, 0.013, B.steelP, ST({ ...S3 })));
  { const band = (u, v, p) => onH(lerp(-1.9, 1.9, u), lerp(0.058, 0.032, v), 0.004, p); HG.add(surf(band, 40, 2, B.steel, ST({ ...S3 }))); HG.add(tube((u, p) => band(u, 0, p), 40, 0.005, B.steelP, ST(S0))); HG.add(tube((u, p) => band(u, 1, p), 40, 0.005, B.steelP, ST(S0)));
    for (let i = -6; i <= 6; i++) { if (!i) continue; const rv = ball(0.0075, B.steelP, ST(S0)); band(0.5 + i * 0.075, 0.5, rv.position); rv.position.multiplyScalar(1.01); HG.add(rv); } }
  for (const sx of [1, -1]) { const ear = mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.03, 24), B.steel, ST({ ...S3 })); ear.rotation.z = Math.PI / 2; ear.position.set(sx * (HX + 0.012), 0.04, -0.005); HG.add(ear); const eb = ball(0.016, B.steelP, ST(S0)); eb.position.set(sx * (HX + 0.03), 0.04, -0.005); HG.add(eb); }
  // capuz: casca por cima e atrás do elmo, boca aberta na frente (|a| < 1,25) com borda grossa; desce atrás até as costas
  const hn = new THREE.Vector3(0, 0.42, -1).normalize(), he1 = new THREE.Vector3(1, 0, 0), he2 = new THREE.Vector3().crossVectors(hn, he1), hd_ = new THREE.Vector3(), HA = 1.86;
  const hoodF = (u, v, p, o = 0.02) => { const ph = v * HA, ps = u * Math.PI * 2; hd_.copy(hn).multiplyScalar(Math.cos(ph)).addScaledVector(he1, Math.cos(ps) * Math.sin(ph)).addScaledVector(he2, Math.sin(ps) * Math.sin(ph));
    const oo = o + 0.012 * Math.sin(Math.PI * v) + 0.006 * Math.sin(ps * 7 + v * 5) * v, yy = hd_.y > 0 ? hd_.y * (HYT + oo) : hd_.y * (-HYB + oo) - 0.05 * Math.max(0, -hd_.z) * v * v;
    p.set(hd_.x * (HX + oo) * (1 + 0.12 * v * v), yy, hd_.z * (HZ + oo) - 0.01 * v); };
  const hood = surf(hoodF, 56, 16, 0xffffff, WL()); head.add(hood);
  head.add(tube((u, p) => hoodF(u, 1, p, 0.02), 56, 0.022, 0xffffff, WL({ map: WOOLD }), true));
  // gola: rolo grosso de lã em volta do pescoço (0,54 m de largura), dobras em U na frente
  const cowl = surf((u, v, p) => { const a = u * Math.PI * 2, c = (1 + Math.cos(a)) / 2, th = v * Math.PI * 2, R = lerp(0.18, 0.2, c) + 0.012 * Math.sin(a * 7), rt = lerp(0.075, 0.095, c) * (1 + 0.08 * Math.sin(a * 5 + 1));
    p.set(Math.sin(a) * (R + Math.cos(th) * rt), 0.84 - 0.07 * c * c + Math.sin(th) * rt * 0.85, -0.005 + Math.cos(a) * (R * 0.92 + Math.cos(th) * rt)); }, 64, 14, 0xffffff, WL());
  body.add(cowl);
  const cowl2 = surf((u, v, p) => { const a = u * Math.PI * 2, c = (1 + Math.cos(a)) / 2, s = v; p.set(Math.sin(a) * lerp(0.2, 0.27, s) * (1 + 0.02 * Math.sin(a * 9)), 0.82 - 0.06 * c - 0.09 * s - 0.05 * Math.pow(c, 3) * s, -0.005 + Math.cos(a) * lerp(0.19, 0.25, s)); }, 64, 4, 0xffffff, WL({ map: WOOLD }));
  body.add(cowl2);
  const cP = cowl2.geometry.attributes.position, cB = cP.array.slice(), cV = cowl2.geometry.attributes.uv.array;
  // ---------- braços: manga acolchoada, braçadeira grande de bronze, mão
  const mkVamb = () => { const g = new THREE.Group(); g.add(lathe([[0.096, -0.1], [0.09, -0.07], [0.092, 0.05], [0.104, 0.1]], B.bronze, BZ({ ...BZ2, side: THREE.DoubleSide }), 28));
    for (const [y, r] of [[-0.1, 0.098], [0.1, 0.106]]) { const b = mesh(new THREE.TorusGeometry(r, 0.012, 8, 26), B.bronze, BZ()); b.rotation.x = Math.PI / 2; b.position.y = y; g.add(b); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, rv = ball(0.008, B.bronzeD, BZ()); rv.position.set(Math.sin(a) * 0.1, 0.075, Math.cos(a) * 0.1); g.add(rv); rv.clone(); const r2 = rv.clone(); r2.position.y = -0.075; r2.position.multiplyScalar(1); g.add(r2); } return g; };
  const arm = sx => ({ sx, up: add(cyl(0.085, 0.095, 0xffffff, { ...QTD })), el: add(ball(1, 0xffffff, { ...QTD })), fore: add(cyl(0.07, 0.08, 0xffffff, { ...QTD })), lo: add(mkVamb()), hand: add(fist(sx)) });
  const armL = arm(1), armR = arm(-1); [armL, armR].forEach(a => a.el.scale.set(0.088, 0.085, 0.088));
  // ---------- marreta: cabo de madeira, cabeça de aço em barril com aros nas faces
  const ham = new THREE.Group(); add(ham); const HL = 0.66;
  { const sh = mesh(new THREE.CylinderGeometry(0.02, 0.024, HL, 14), 0xffffff, { map: woodT, spec: 0.3 }); sh.position.y = HL / 2; ham.add(sh);
    const pom = ball(0.026, 0xffffff, { map: woodT }); pom.position.y = 0.0; ham.add(pom);
    const hd = new THREE.Group(); hd.position.y = HL; hd.scale.setScalar(1.06); ham.add(hd);
    { const bar = lathe([[0.0, -0.15], [0.088, -0.15], [0.095, -0.13], [0.09, -0.06], [0.082, 0], [0.09, 0.06], [0.095, 0.13], [0.088, 0.15], [0.0, 0.15]], B.steel, ST({ ...S2 }), 32); bar.rotation.x = Math.PI / 2; hd.add(bar); }
    for (const z of [-0.128, 0.128]) { const r = mesh(new THREE.TorusGeometry(0.096, 0.012, 8, 28), B.steelP, ST({ ...S3 })); r.position.z = z; hd.add(r); }
    const col = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 18), B.steelP, ST({ ...S3 })); col.position.y = -0.0; hd.add(col);
    const lng = mesh(new THREE.CylinderGeometry(0.034, 0.03, 0.08, 14), B.steelD, ST(S0)); lng.position.y = -0.11; hd.add(lng); }
  const hamHead = new THREE.Object3D(); hamHead.position.set(0, HL, 0.18); ham.add(hamHead);
  // poses da marreta (espaço do root; ela olha para +z, +x = esquerda dela): mão de baixo G, direção do cabo D, distância da mão de cima U
  const POSE = { rest: { G: [-0.36, 0.71, 0.12], D: [-0.12, -1, 0.1], U: 0 }, carry: { G: [-0.22, 0.98, 0.32], D: [-0.08, 0.6, -0.8], U: 0.3 }, ready: { G: [-0.16, 0.84, 0.3], D: [0.72, -0.3, 0.42], U: 0.26 },
    wind: { G: [-0.06, 1.46, 0.14], D: [-0.05, 0.55, -0.84], U: 0.06 }, strike: { G: [0, 1.06, 0.42], D: [0, 0.2, 0.98], U: 0.2 }, follow: { G: [0, 0.78, 0.46], D: [0, -0.55, 0.84], U: 0.2 } };
  const G = new THREE.Vector3(), Dv = new THREE.Vector3(), tmp = new THREE.Vector3(), S = new THREE.Vector3(), E = new THREE.Vector3(), Tg = new THREE.Vector3(), pole = new THREE.Vector3(), dir = new THREE.Vector3();
  const setArm = (A, Sh, T, pl) => { tmp.subVectors(Sh, T).normalize(); T.addScaledVector(tmp, 0.07); ik3(Sh, T, L.up, L.fo, pl, E); between(A.up, Sh, E); between(A.fore, E, T); place(A.lo, T, E); A.lo.translateY(0.02); A.el.position.copy(E);
    dir.subVectors(T, E).normalize(); A.hand.position.copy(T).addScaledVector(dir, 0.05); A.hand.quaternion.setFromUnitVectors(Y, dir); };
  const v = (x, y, z) => new THREE.Vector3(x, y, z), hip = v(0, 0, 0), a = v(0, 0, 0);
  function update(t, P = {}) {
    const ph = P.ph || 0, w = P.w || 0, carry = P.carry ?? 0, ready = P.ready || 0, wind = P.wind || 0, strike = P.strike || 0, follow = P.follow || 0, look = P.look || 0, brace = P.brace || 0;
    const rest = Math.max(0, 1 - carry - ready - wind - strike - follow);
    root.updateMatrixWorld(true);
    const tw = ph * 2 * Math.PI, bob = -Math.cos(tw * 2) * 0.014 * w, hipY = HIP + bob - 0.012 * w - 0.05 * brace - 0.04 * strike - 0.08 * follow + 0.02 * wind, sw = Math.sin(tw + 0.5) * w;
    const bx = 0.1 * w - 0.14 * wind + 0.3 * strike + 0.4 * follow + 0.04 * ready, hz = 0.05 * strike + 0.08 * follow - 0.03 * wind;
    legs.forEach((l, i) => { const f = foot((ph + (i ? 0.5 : 0)) % 1, 0.3); f.z = lerp(i ? -0.02 : 0.02, f.z, w) + (i ? -0.16 : 0.2) * brace; f.y *= w; f.a *= w;
      const fx = l.sx * (L.hipX + 0.03 * (1 - w) + 0.07 * brace); hip.set(l.sx * L.hipX, hipY, hz); a.set(fx, L.ank + f.y, f.z); ik(hip, a, L.th, L.sh, l.q); l.q.k.x = lerp(hip.x, fx, 0.5); l.q.f.x = fx;
      between(l.thigh, hip, l.q.k); between(l.shin, l.q.k, l.q.f); l.knee.position.copy(l.q.k);
      l.boot.g.position.copy(l.q.f); l.boot.g.rotation.y = l.sx * 0.15 * (1 - w); l.boot.ft.rotation.x = f.a; l.ang = Math.atan2(l.q.k.z - hz, hipY - l.q.k.y); });
    hipG.position.set(0, hipY, hz);
    body.position.set(0, hipY, hz); body.rotation.set(bx, Math.sin(tw) * 0.06 * w + 0.2 * wind - 0.08 * strike, 0); body.updateMatrixWorld(true);
    flaps.forEach(f => { const ang = legs[f.leg].ang - bx; f.g.rotation.x = f.back ? Math.min(0.45, Math.max(0, -ang) * 0.5) + 0.04 * w : -Math.min(0.5, Math.max(0, ang) * 0.6); });
    head.rotation.set(-0.5 * look - bx * 0.5 + 0.1 * strike, -Math.sin(tw) * 0.03 * w, 0);
    // aba da gola: balança com o passo e com o golpe
    for (let i = 0; i < cP.count; i++) { const x = cB[i * 3], y = cB[i * 3 + 1], z = cB[i * 3 + 2], k = 1 - cV[i * 2 + 1], fl = Math.sin(t * 4.5 - k * 3 + x * 8) * 0.006 + Math.sin(tw * 2 - k * 3) * 0.008 * w;
      cP.setXYZ(i, x, y + k * 0.02 * wind, z + fl * k - k * (0.03 * w + 0.05 * strike) * (z < 0 ? 1 : 0.3)); }
    cP.needsUpdate = true; cowl2.geometry.computeVertexNormals();
    // marreta: mistura das poses
    G.set(0, 0, 0); Dv.set(0, 0, 0); let U = 0; for (const [k, wgt] of [['rest', rest], ['carry', carry], ['ready', ready], ['wind', wind], ['strike', strike], ['follow', follow]]) { if (!wgt) continue; U += POSE[k].U * wgt; G.x += POSE[k].G[0] * wgt; G.y += POSE[k].G[1] * wgt; G.z += POSE[k].G[2] * wgt; Dv.x += POSE[k].D[0] * wgt; Dv.y += POSE[k].D[1] * wgt; Dv.z += POSE[k].D[2] * wgt; }
    G.y += hipY - HIP; G.z += hz; Dv.normalize(); const bOff = rest > 0.5 ? 0.04 : 0.08; G.addScaledVector(Dv, -bOff);
    ham.position.copy(G); ham.quaternion.setFromUnitVectors(Y, Dv); ham.rotateY(Math.PI / 2 * (1 - rest));
    // braço direito (-x): mão de baixo; braço esquerdo: mão de cima (solto na pose do conceito e com a marreta no ombro)
    body.localToWorld(S.set(-0.27, 0.71, 0)); root.worldToLocal(S); Tg.copy(G).addScaledVector(Dv, bOff); pole.set(-1, -0.7, -0.6 + 0.6 * rest); setArm(armR, S, Tg, pole);
    body.localToWorld(S.set(0.27, 0.71, 0)); root.worldToLocal(S); Tg.copy(G).addScaledVector(Dv, bOff + U); const free = Math.min(1, carry + rest);
    tmp.set(S.x + 0.07, S.y - 0.4, S.z + 0.05 + sw * 0.12); Tg.lerp(tmp, free); pole.set(1, -0.6, -0.8 + 0.6 * rest); setArm(armL, S, Tg, pole);
  }
  root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  root.userData.hammerHead = hamHead; root.userData.head = head;
  update(0, {});
  return { root, update };
}
