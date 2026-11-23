// Gente: boneco 3D chapado, pose por parâmetros. Olha para +z; +x é a esquerda dele.
// Zé 2: reconstruído da arte conceito/ze_A.png (890 px de altura = 1,80 m): cabeça 31% da altura, pernas curtas (quadril a 0,60 m), tronco em barril de 0,55 m,
// boné de tela com emblema, nariz e orelhas grandes, jaqueta de camurça com gola de lã, jeans de barra virada, botina redonda. Mesma pose() do gente.js.
import { THREE, mat, between, box, foot, ik, cl, lerp, ss, plain, mkTex, paint, Y } from './kit3d.js';

const css = h => '#' + h.toString(16).padStart(6, '0');
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

export function criaGente(o = {}) {
  const K = { skin: 0xe2a688, cap: 0x6f8f58, jacket: 0xb87a44, jeans: 0x42628e, boot: 0x7a4428, wool: 0xf0e4c8, hair: 0x3a2a22, zumbi: false, ...o };
  // zumbi = arte conceito/zumbi_A.png: peão alto e magro, chapéu de palha, camisa xadrez de manga dobrada, macacão jeans, bota de borracha
  const Z = K.zumbi; if (Z) Object.assign(K, { skin: 0x93a47e, jacket: 0xb03a30, jeans: 0x4c6690, boot: 0x3c4232, hair: 0x2a2a22 }, o);
  const P = Z ? { hip: 0.92, th: 0.43, sh: 0.41, hipX: 0.085, ank: 0.11, lr: [0.066, 0.082, 0.064], tz: 0.78, shX: 0.2, shY: 0.4, ar: [0.05, 0.058, 0.04, 0.046, 0.052], hk: 2.2, hy: 0.72, hs: 1.42, bk: 1.25, al: [0.31, 0.33], ax: 0.03 }
    : { hip: 0.6, th: 0.27, sh: 0.26, hipX: 0.125, ank: 0.135, lr: [0.118, 0.132, 0.118], tz: 0.9, shX: 0.28, shY: 0.455, ar: [0.108, 0.118, 0.1, 0.108, 0.112], hk: 1.9, hy: 0.89, hs: 1.72, bk: 1.5, al: [0.27, 0.26], ax: 0.08 };
  const soft = (key, tint, a = 0.3, dk = 0, crop = 0.3) => mkTex(512, 512, (g, w, h) => { g.fillStyle = tint; g.fillRect(0, 0, w, h); g.globalAlpha = a; paint(g, w, h, key, null, 0, crop); g.globalAlpha = 1; if (dk) { g.fillStyle = `rgba(40,20,10,${dk})`; g.fillRect(0, 0, w, h); } });
  const T = { jacket: soft('leather', css(K.jacket), 0.5), jacketD: soft('leather', css(K.jacket), 0.5, 0.22), jeans: soft('navy', css(K.jeans), 0.4, 0, 0.1), jeansD: soft('navy', css(K.jeans), 0.4, 0.12, 0.1), jeansL: soft('navy', '#aab4c0', 0.25, 0, 0.1),
    boot: soft('leather', css(K.boot), 0.4), cap: soft('canvas', css(K.cap), 0.35, 0, 0.1), capD: soft('canvas', css(K.cap), 0.35, 0.25, 0.1), wool: soft('fur', css(K.wool), 0.28, 0, 0.1) };
  if (Z) { const xad = dk => { const t = mkTex(256, 256, (g, w, h) => { g.fillStyle = css(K.jacket); g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(20,12,12,0.55)'; for (let i = 0; i < 4; i++) { g.fillRect(i * 64, 0, 32, h); g.fillRect(0, i * 64, w, 32); } g.globalAlpha = 0.25; paint(g, w, h, 'canvas', null, 0, 0.1); g.globalAlpha = 1; g.fillStyle = 'rgba(60,40,20,0.3)'; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 6 + Math.random() * 18, 0, 7); g.fill(); } if (dk) { g.fillStyle = `rgba(0,0,0,${dk})`; g.fillRect(0, 0, w, h); } }); t.repeat.set(3, 2); return t; };
    T.jacket = xad(0); T.jacketD = xad(0.2); T.boot = soft('leather', css(K.boot), 0.2); T.jeans = soft('navy', css(K.jeans), 0.5, 0.1, 0.1); T.jeansD = soft('navy', css(K.jeans), 0.5, 0.22, 0.1);
    T.palha = mkTex(512, 512, (g, w, h) => { g.fillStyle = '#d6b46a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 64; i++) { g.strokeStyle = i % 2 ? 'rgba(120,84,30,0.5)' : 'rgba(255,236,170,0.4)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, i * 8); g.lineTo(w, i * 8 + 6); g.stroke(); g.beginPath(); g.moveTo(i * 8, 0); g.lineTo(i * 8 + 5, h); g.stroke(); } g.fillStyle = 'rgba(60,40,20,0.5)'; for (let i = 0; i < 20; i++) g.fillRect(Math.random() * w, Math.random() * h, 8 + Math.random() * 14, 5); }); T.palha.repeat.set(4, 2); }
  // rosto pintado: bochecha, sombra da aba, barba por fazer, rugas
  T.face = mkTex(512, 512, (g, w, h) => { g.fillStyle = css(K.skin); g.fillRect(0, 0, w, h); if (K.zumbi) { paint(g, w, h, 'zskin', css(K.skin), 0.6); g.fillStyle = 'rgba(147,164,126,0.45)'; g.fillRect(0, 0, w, h); } const fx = w * 0.25, fy = h * 0.5;
    if (Z) { for (const [sx, q] of [[-1, 46], [1, 34]]) { const gr = g.createRadialGradient(fx + sx * 34, fy - 8, 4, fx + sx * 34, fy - 8, q); gr.addColorStop(0, 'rgba(30,26,34,0.9)'); gr.addColorStop(1, 'rgba(30,26,34,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); } g.fillStyle = 'rgba(90,40,60,0.45)'; for (const [x, y, q] of [[fx - 50, fy + 60, 14], [fx + 40, fy - 60, 10], [fx + 60, fy + 30, 8]]) { g.beginPath(); g.arc(x, y, q, 0, 7); g.fill(); } return; }
    let gr = g.createLinearGradient(0, h * 0.26, 0, h * 0.46); gr.addColorStop(0, 'rgba(70,30,20,0.22)'); gr.addColorStop(1, 'rgba(70,30,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    gr = g.createLinearGradient(0, h * 0.58, 0, h * 0.72); gr.addColorStop(0, 'rgba(60,40,34,0)'); gr.addColorStop(1, 'rgba(60,40,34,0.22)'); g.fillStyle = gr; g.fillRect(0, 0, w * 0.5, h);
    const r = (() => { let s = 9; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })(); g.fillStyle = 'rgba(60,36,26,0.3)'; for (let i = 0; i < 0; i++) { const x = fx + (r() - 0.5) * 190, y = fy + 50 + r() * 100; g.fillRect(x, y, 2, 3); }
    for (const sx of [-1, 1]) { gr = g.createRadialGradient(fx + sx * 46, fy + 34, 0, fx + sx * 46, fy + 34, 30); gr.addColorStop(0, 'rgba(226,92,66,0.4)'); gr.addColorStop(1, 'rgba(212,96,66,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(110,52,36,0.5)'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.arc(fx + sx * 30, fy + 2, 16, 0.3, 1.9, sx < 0); g.stroke(); g.beginPath(); g.moveTo(fx + sx * 12, fy + 22); g.quadraticCurveTo(fx + sx * 24, fy + 40, fx + sx * 22, fy + 56); g.stroke(); } });
  T.face.wrapS = T.face.wrapT = THREE.ClampToEdgeWrapping;
  // emblema do boné: losango creme com folha
  T.patch = mkTex(192, 128, (g, w, h) => { g.fillStyle = '#eadcb8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b8a67c'; g.lineWidth = 6; g.setLineDash([10, 6]); g.strokeRect(9, 9, w - 18, h - 18); g.fillStyle = '#7d8a5c'; g.font = '700 70px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Zé', w / 2, h / 2 + 4); });
  // copa do boné: frente verde, laterais e trás em tela creme
  T.dome = mkTex(1024, 256, (g, w, h) => { g.fillStyle = '#d9c9a2'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(120,100,70,0.55)'; g.lineWidth = 2; for (let i = -h; i < w + h; i += 9) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i + h, 0); g.lineTo(i, h); g.stroke(); }
    g.fillStyle = css(K.cap); g.fillRect(w * 0.04, 0, w * 0.42, h); const r = (() => { let q = 3; return () => { q = (q * 16807) % 2147483647; return q / 2147483647; }; })(); g.fillStyle = 'rgba(40,58,30,0.25)'; for (let i = 0; i < 700; i++) g.fillRect(w * 0.04 + r() * w * 0.42, r() * h, 3, 3);
    g.strokeStyle = 'rgba(40,56,30,0.7)'; g.lineWidth = 4; for (const u of [0.04, 0.25, 0.46]) { g.beginPath(); g.moveTo(w * u, 0); g.lineTo(w * u, h); g.stroke(); } });
  const M = (t, extra) => mat(0xffffff, { map: t, grain: 0.18, rim: 0.4, ...extra });
  const skinM = (extra) => mat(K.skin, { keep: 0.5, grain: 0.05, shade: 0.82, rim: 0.55, ...extra });
  const root = new THREE.Group(), add = m => { root.add(m); return m; };
  const L = { th: P.th, sh: P.sh, hipX: P.hipX, ank: P.ank }, HIP = P.hip;
  const lat = (pts, m, seg = 40) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg), m);
  const C = (rt, rb, m, seg = 16) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, 1, seg, 1), m), B = (r, m) => new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), m);
  const E = (sx, sy, sz, m) => { const k = B(1, m); k.scale.set(sx, sy, sz); return k; };
  // botina com cano, biqueira, sola de borracha e cadarço
  const mkBoot = () => { const g = new THREE.Group(), shaft = new THREE.Group(), ft = new THREE.Group(); g.add(shaft, ft);
    const s = C(0.08, 0.072, M(T.boot, { spec: 0.3 })); s.scale.y = 0.17; s.position.y = 0.05; shaft.add(s); const cu = C(0.1, 0.098, M(T.jeansL)); cu.scale.y = 0.06; cu.position.y = 0.155; shaft.add(cu);
    const b = E(0.086, 0.07, 0.15, M(T.boot, { spec: 0.35 })); b.position.set(0, -0.016, 0.07); ft.add(b); const toe = E(0.084, 0.064, 0.09, M(T.boot, { spec: 0.45 })); toe.position.set(0, -0.016, 0.165); ft.add(toe);
    const sole = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.092, 0.04, 24), mat(0x2a1c14, { rim: 0 })); sole.scale.z = 1.95; sole.position.set(0, -0.074, 0.075); ft.add(sole); const heel = box(0.14, 0.03, 0.1, 0x120c0a); heel.position.set(0, -0.1, -0.04); ft.add(heel);
    for (let i = 0; i < 3; i++) { const lc = box(0.07, 0.008, 0.012, 0xd8c8a0, { rim: 0 }); lc.position.set(0, 0.035 - i * 0.012, 0.11 + i * 0.03); lc.rotation.x = -0.5; lc.visible = !Z; ft.add(lc); } g.scale.setScalar(P.bk); ft.scale.set(1.1, 1, 0.95); if (Z) { s.scale.y = 0.36; s.position.y = 0.13; s.scale.x = s.scale.z = 1.12; cu.visible = false; const rim = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.01, 6, 20), M(T.boot)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.31; shaft.add(rim); } return { g, shaft, ft }; };
  const legs = [1, -1].map(sx => ({ sx, thigh: add(C(P.lr[0], P.lr[1], M(sx > 0 ? T.jeansD : T.jeans))), shin: add(C(P.lr[0], P.lr[0], M(sx > 0 ? T.jeansD : T.jeans))), knee: add(B(P.lr[2], M(sx > 0 ? T.jeansD : T.jeans))), boot: mkBoot(), q: { k: V(), f: V() } }));
  legs.forEach(l => add(l.boot.g));
  const hipG = new THREE.Group(); add(hipG);
  const pelvis = Z ? E(0.155, 0.13, 0.115, M(T.jeans)) : E(0.26, 0.15, 0.215, M(T.jeans)); pelvis.position.y = -0.03; hipG.add(pelvis);
  const beltM = new THREE.Mesh(new THREE.CylinderGeometry(0.172, 0.174, 0.045, 28, 1), M(T.boot, { spec: 0.3 })); beltM.scale.set(1.4, 1, 0.98); beltM.position.y = 0.045; beltM.visible = !Z; hipG.add(beltM);
  const body = new THREE.Group(); add(body);
  // jaqueta: tronco, barra canelada, ombros, zíper, bolsos com aba, gola de lã
  const ZF = x => P.tz * Math.sqrt(Math.max(0.29 * 0.29 - x * x, 0.001)) + 0.004, snap = (x, y, z, r = 0.013, c = 0xb8b4aa) => { const b = B(r, mat(c, { rim: 0, metal: 0.8, rough: 0.35 })); b.scale.z = 0.5; b.position.set(x, y, z); body.add(b); };
  if (!Z) { const torso = lat([[0, -0.03], [0.262, -0.03], [0.276, 0.0], [0.276, 0.06], [0.266, 0.078], [0.286, 0.1], [0.296, 0.22], [0.29, 0.36], [0.266, 0.46], [0.21, 0.55], [0.11, 0.6], [0, 0.61]], M(T.jacket, { bump: 1.6 })); torso.scale.z = P.tz; body.add(torso);
    const plk = box(0.06, 0.5, 0.014, 0xffffff, { map: T.jacketD, rim: 0 }); plk.position.set(0, 0.29, ZF(0) - 0.002); body.add(plk);
    
    for (const y of [0.1, 0.21, 0.32]) snap(0.018, y, ZF(0) + 0.008);
    for (const sx of [1, -1]) { const x = sx * 0.14, z = ZF(x), ry = sx * 0.5; const pk = box(0.13, 0.11, 0.012, 0xffffff, { map: T.jacketD, rim: 0 }); pk.position.set(x, 0.345, z - 0.002); pk.rotation.y = ry; body.add(pk);
      const fl = box(0.14, 0.05, 0.02, 0xffffff, { map: T.jacket, rim: 0.3 }); fl.position.set(x, 0.405, z + 0.004); fl.rotation.y = ry; body.add(fl); snap(x + sx * 0.004, 0.395, z + 0.016);
      const hp = box(0.014, 0.13, 0.014, 0xffffff, { map: T.jacketD, rim: 0 }); hp.position.set(sx * 0.2, 0.17, ZF(sx * 0.2)); hp.rotation.set(0, sx * 0.75, sx * 0.5); body.add(hp); }
    const yoke = new THREE.Mesh(new THREE.TorusGeometry(0.262, 0.006, 6, 40), M(T.jacketD, { rim: 0 })); yoke.rotation.x = Math.PI / 2; yoke.scale.y = P.tz; yoke.position.y = 0.46; body.add(yoke);
    const tee = E(0.06, 0.06, 0.02, mat(0x8fa283, { rim: 0, grain: 0.2 })); tee.position.set(0, 0.52, 0.17); body.add(tee);
    // gola de lã: tufos pequenos em volta do pescoço e duas lapelas
    // gola de lã: anel grosso em volta do pescoço e duas lapelas inteiras (forma limpa, pelo na textura)
    const wm = M(T.wool, { grain: 0.5, rim: 0.3, bump: 4, rough: 1 }); T.wool.repeat.set(3, 1);
    const gola = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.058, 14, 40, Math.PI * 1.62), wm); gola.rotation.set(Math.PI / 2 + 0.12, 0, Math.PI / 2 + Math.PI * 0.19); gola.scale.set(1, 0.92, 0.75); gola.position.set(0, 0.575, -0.005); body.add(gola);
    for (const sx of [1, -1]) { const lp = E(0.075, 0.115, 0.026, wm); lp.position.set(sx * 0.125, 0.505, 0.2); lp.rotation.set(-0.35, sx * 0.55, sx * 0.85); body.add(lp); const tp = E(0.07, 0.05, 0.05, wm); tp.position.set(sx * 0.15, 0.565, 0.12); body.add(tp); }
    const neck = C(0.07, 0.078, skinM({ rim: 0 })); neck.scale.y = 0.1; neck.position.set(0, 0.63, 0.008); body.add(neck); }
  else { const torso = lat([[0, -0.04], [0.15, -0.04], [0.162, 0.04], [0.166, 0.2], [0.185, 0.36], [0.172, 0.44], [0.1, 0.5], [0, 0.52]], M(T.jacket)); torso.scale.z = P.tz; body.add(torso);
    const calca = lat([[0, -0.06], [0.158, -0.06], [0.17, 0.0], [0.172, 0.17], [0.166, 0.175]], M(T.jeans)); calca.scale.z = P.tz + 0.02; body.add(calca);
    const zf = 0.172 * (P.tz + 0.02), bib = box(0.2, 0.2, 0.02, 0xffffff, { map: T.jeans, rim: 0.3 }); bib.position.set(0, 0.26, zf - 0.004); bib.rotation.x = -0.05; body.add(bib);
    const bp = box(0.11, 0.08, 0.012, 0xffffff, { map: T.jeansD, rim: 0 }); bp.position.set(0, 0.27, zf + 0.008); body.add(bp);
    for (const sx of [1, -1]) { snap(sx * 0.08, 0.34, zf + 0.012, 0.014, 0xc8a050); const st = box(0.04, sx > 0 ? 0.2 : 0.12, 0.012, 0xffffff, { map: T.jeansD, rim: 0 }); st.position.set(sx * 0.105, sx > 0 ? 0.43 : 0.3, sx > 0 ? zf - 0.03 : zf + 0.01); st.rotation.set(sx > 0 ? -0.45 : 0.1, 0, sx > 0 ? -0.1 : 0.5); body.add(st);
      if (sx > 0) { const sb = box(0.04, 0.5, 0.012, 0xffffff, { map: T.jeansD, rim: 0 }); sb.position.set(0.09, 0.25, -zf + 0.01); sb.rotation.x = 0.08; body.add(sb); } }
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.085, 0.05, 20, 1, true), M(T.jacketD, { side: THREE.DoubleSide })); col.position.set(0, 0.5, 0.01); body.add(col);
    const neck = C(0.04, 0.046, skinM({ rim: 0 })); neck.scale.y = 0.2; neck.position.set(0, 0.56, 0.02); neck.rotation.x = 0.25; body.add(neck); }
  // cabeça
  const head = new THREE.Group(); head.position.set(0, P.hy, Z ? 0.06 : 0.02); head.scale.setScalar(P.hs); body.add(head);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.135, 32, 24), mat(0xffffff, { map: T.face, keep: 0.5, grain: 0.04, shade: 0.82 })); face.scale.set(Z ? 0.9 : 1.1, Z ? 1.14 : 1.03, Z ? 0.98 : 1.0); head.add(face);
  for (const sx of [1, -1]) { const ear = E(0.026, 0.046, 0.03, skinM({ rim: 0.3, shade: 0.75 })); ear.position.set(sx * 0.152, -0.03, -0.012); ear.rotation.y = sx * 0.5; head.add(ear); const ei = E(0.012, 0.026, 0.018, mat(0xd07a58, { rim: 0, shade: 1 })); ei.position.set(sx * 0.163, -0.03, -0.002); ei.rotation.y = sx * 0.5; head.add(ei); }
  // cabelo: laterais e nuca, só o que sobra debaixo do boné
  const hairM = mat(K.hair, { rim: 0.3, grain: 0.4 });
  const hairS = new THREE.Mesh(new THREE.SphereGeometry(0.1405, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), hairM); hairS.scale.set(1.105, 1.05, 1.0); hairS.rotation.x = -0.82; hairS.visible = !Z; head.add(hairS);
  // boné: copa, frente alta com emblema, aba curva, botão, costuras, fecho atrás
  const capG = new THREE.Group(); capG.position.set(0, 0.04, -0.004); capG.rotation.x = -0.1; capG.visible = !Z; head.add(capG);
  if (Z) { const hat = new THREE.Group(); hat.position.set(0, 0.085, -0.01); hat.rotation.set(-0.16, 0, 0.07); head.add(hat); const pm = M(T.palha, { bump: 3, grain: 0.3, side: THREE.DoubleSide });
    const bgz = new THREE.CylinderGeometry(0.31, 0.31, 0.008, 44, 6); { const A = bgz.attributes.position; for (let i = 0; i < A.count; i++) { const x = A.getX(i), z = A.getZ(i), rr = Math.hypot(x, z), an = Math.atan2(z, x); A.setY(i, A.getY(i) - rr * rr * 0.5 + Math.sin(an * 3 + 1) * 0.014 * rr / 0.31 + Math.sin(an * 7) * 0.006 * rr / 0.31); if (rr > 0.2 && an > 0.5 && an < 1.0) { A.setX(i, x * 0.72); A.setZ(i, z * 0.72); } } bgz.computeVertexNormals(); }
    hat.add(new THREE.Mesh(bgz, pm)); const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.14, 0.1, 28, 1), pm); cr.position.y = 0.05; hat.add(cr); const tp = new THREE.Mesh(new THREE.SphereGeometry(0.115, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2), pm); tp.scale.y = 0.4; tp.position.y = 0.1; hat.add(tp);
    const fx = new THREE.Mesh(new THREE.TorusGeometry(0.139, 0.012, 6, 28), mat(0x7a3a2a, { rim: 0 })); fx.rotation.x = Math.PI / 2; fx.position.y = 0.012; hat.add(fx); }
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.154, 40, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), M(T.dome, { grain: 0.2, bump: 1.5 })); dome.scale.set(1.06, 1.06, 1.1); capG.add(dome);
  const bandC = new THREE.Mesh(new THREE.CylinderGeometry(0.1505, 0.1505, 0.012, 32, 1, true), M(T.capD)); bandC.scale.z = 1.06; bandC.position.y = 0.004; capG.add(bandC);
  const brimG = new THREE.Group(); brimG.position.set(0, 0.02, 0.124); brimG.rotation.x = 0.06; capG.add(brimG);
  const bg = new THREE.CylinderGeometry(0.135, 0.135, 0.014, 28, 1, false, -Math.PI / 2, Math.PI); { const P = bg.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i); P.setY(i, P.getY(i) - x * x * 1.7); } bg.computeVertexNormals(); }
  const brim = new THREE.Mesh(bg, M(T.cap, { grain: 0.24, side: THREE.DoubleSide })); brim.scale.set(1.12, 1, 1.5); brimG.add(brim);
  const brimU = new THREE.Mesh(bg, M(T.capD, { side: THREE.DoubleSide, rim: 0 })); brimU.scale.set(1.11, 1, 1.49); brimU.position.y = -0.006; brimG.add(brimU);
  const btn = B(0.015, M(T.capD)); btn.position.y = 0.148; capG.add(btn);
  for (let i = 0; i < 3; i++) { const sm = new THREE.Mesh(new THREE.TorusGeometry(0.151, 0.0035, 4, 28, Math.PI), M(T.capD, { rim: 0 })); sm.scale.set(1, 0.96, 1.08); sm.visible = false; sm.rotation.y = i * Math.PI / 3; capG.add(sm); }
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(0.088, 0.058), mat(0xffffff, { map: T.patch, rim: 0, grain: 0.1 })); patch.position.set(0, 0.07, 0.157); patch.rotation.x = -0.36; capG.add(patch);
  const gap = E(0.05, 0.04, 0.012, mat(K.hair, { rim: 0 })); gap.position.set(0, 0.03, -0.153); capG.add(gap); const strap = box(0.11, 0.016, 0.012, 0x2a2018, { rim: 0 }); strap.position.set(0, 0.005, -0.158); capG.add(strap);
  // olhos com branco, íris, brilho, pálpebra e sobrancelha
  const eyes = [1, -1].map(sx => { const eg = new THREE.Group(); eg.position.set(sx * 0.046, -0.012 + (Z && sx < 0 ? 0.012 : 0), 0.119); eg.rotation.y = sx * 0.3; if (Z) eg.scale.setScalar(sx < 0 ? 1.5 : 0.95); head.add(eg);
    const wh = E(0.027, 0.029, 0.013, mat(K.zumbi ? (sx < 0 ? 0xe8ecc8 : 0x2a2c30) : 0xf5efe4, { rim: 0, shade: 0.9, keep: 0.6, grain: 0 })); eg.add(wh);
    const ir = E(0.0155, 0.017, 0.008, mat(K.zumbi ? 0xc8cc90 : 0x2e1c14, { rim: 0, shade: 1, keep: 0.5, grain: 0 })); ir.position.z = 0.0105; if (Z) ir.scale.multiplyScalar(sx < 0 ? 0.45 : 0.3); eg.add(ir);
    const pu = E(K.zumbi ? 0.003 : 0.007, K.zumbi ? 0.003 : 0.008, 0.005, mat(0x140e0a, { rim: 0, shade: 1 })); pu.position.z = 0.015; eg.add(pu);
    const hl = B(0.0046, mat(0xffffff, { rim: 0, shade: 1, keep: 1, grain: 0 })); hl.position.set(-0.004, 0.005, 0.019); eg.add(hl);
    const lid = new THREE.Group(); lid.add(E(0.031, 0.009, 0.017, skinM({ rim: 0, shade: 0.7 }))); lid.position.set(0, 0.027, 0.002); lid.visible = !Z; eg.add(lid); if (Z) hl.visible = false;
    const br = E(0.034, 0.0115, 0.012, mat(K.hair, { rim: 0, grain: 0.3 })); br.position.set(sx * 0.002, 0.05, 0.018); if (!Z) eg.add(br);
    return { eg, pu, ir, hl, lid, br, sx }; });
  const nose = E(0.036, 0.034, 0.036, mat(K.zumbi ? 0x74845f : 0xdc8c70, { keep: 0.5, grain: 0.04, rim: 0, shade: 0.78 })); nose.position.set(0, -0.05, 0.146); if (Z) nose.scale.set(0.018, 0.02, 0.016); head.add(nose);
  const mouth = new THREE.Group(); mouth.position.set(0, -0.1, 0.102); mouth.rotation.x = 0.25; head.add(mouth);
  const mLine = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.0048, 6, 14, 0.46), mat(0x4a221c, { rim: 0, shade: 1 })); mLine.rotation.z = -Math.PI / 2 - 0.23; mLine.position.set(0, 0.11, 0.012); mouth.add(mLine);
  const mLip = E(0.016, 0.005, 0.006, mat(0xc47a58, { rim: 0, shade: 1, keep: 0.5 })); mLip.position.set(0, -0.012, 0.014); mLip.scale.setScalar(0.0001); mouth.add(mLip);
  const mO = E(0.013, 0.016, 0.008, mat(0x3a1612, { rim: 0, shade: 1 })); mO.position.set(0, 0.002, 0.012); mouth.add(mO);
  if (Z) { mouth.position.set(0, -0.095, 0.1); mO.scale.set(0.034, 0.026, 0.012); const tm = mat(0xe4dcb0, { rim: 0, shade: 1, keep: 0.4 }); for (const [x, y, hh, rz] of [[-0.02, 0.018, 0.014, 0.1], [-0.006, 0.02, 0.016, -0.08], [0.01, 0.019, 0.012, 0.12], [0.022, 0.015, 0.01, -0.2], [-0.012, -0.018, 0.012, 0.1], [0.008, -0.019, 0.014, -0.1]]) { const tt = new THREE.Mesh(new THREE.BoxGeometry(0.011, hh, 0.008), tm); tt.position.set(x, y - Math.sign(y) * hh / 2, 0.02); tt.rotation.z = rz; mouth.add(tt); } }
  // braços: manga grossa, punho canelado, mão com polegar e dedos
  const arm = sx => { const m = sx > 0 ? T.jacketD : T.jacket, hand = new THREE.Group(); add(hand);
    hand.scale.setScalar(P.hk); if (Z) hand.scale.x *= 0.8; const palm = E(0.04, 0.05, 0.03, skinM()); hand.add(palm); const fing = E(0.036, 0.036, 0.026, skinM({ shade: 0.74 })); fing.position.y = 0.05; hand.add(fing); const th = E(0.014, 0.03, 0.016, skinM()); th.position.set(-sx * 0.04, 0.012, 0.012); th.rotation.z = -sx * 0.6; hand.add(th);
    for (let i = 0; i < 3; i++) { const ln = box(0.003, 0.04, 0.004, 0x9a5a3a, { rim: 0, shade: 1, keep: 0.5 }); ln.position.set((i - 1) * 0.018, 0.055, 0.025); hand.add(ln); }
    const cuff = add(C(P.ar[4], P.ar[4], M(T.jacketD))); cuff.visible = !Z;
    return { sx, up: add(C(P.ar[0], P.ar[1], M(m))), lo: add(C(P.ar[2], P.ar[3], Z ? skinM() : M(m))), el: add(B(P.ar[3] * (Z ? 1.25 : 1), M(m))), sh: add(B(P.ar[1] * 0.95, M(m))), cuff, hand, grip: add(new THREE.Object3D()) }; };
  const arms = { L: arm(1), R: arm(-1) };
  const hip = V(), a = V(), b = V(), c = V(), _d = V(), dir = V();
  // p: { t, walk, w, stride, hipY, hz, lean, twist, head:[pitch,yaw,roll], armL/armR:[ex,ey,ez,hx,hy,hz] (cotovelo e mão a partir do ombro), footL/footR:[y,z], blink, brow, look:[x,y], mouth }
  function pose(p = {}) {
    root.updateMatrixWorld(true);
    const t = p.t ?? 0, w = p.walk == null ? 0 : (p.w ?? 1), ph = p.walk ?? 0, tw = ph * 2 * Math.PI, bob = -Math.cos(tw * 2) * 0.016 * w, hipY = (p.hipY ?? (HIP + 0.02 * (1 - w))) + bob, hz = p.hz ?? 0, sw = Math.sin(tw + 0.5) * w, stride = (p.stride ?? 0.62) * 0.66;
    legs.forEach((l, i) => { const f = foot((ph + (i ? 0.5 : 0)) % 1, stride), ov = i ? p.footR : p.footL; f.z = lerp(i ? -0.05 : 0.05, f.z, w); f.y *= w; f.a *= w; if (ov) { f.y = ov[0]; f.z = ov[1]; f.a = ov[2] ?? 0; }
      const fx = l.sx * (L.hipX + 0.02 * (1 - w)); hip.set(l.sx * L.hipX, hipY, hz); a.set(fx, L.ank + f.y, f.z); ik(hip, a, L.th, L.sh, l.q); l.q.k.x = lerp(hip.x, fx, 0.5); l.q.f.x = fx;
      between(l.thigh, hip, l.q.k); between(l.shin, l.q.k, l.q.f); l.knee.position.copy(l.q.k);
      l.boot.g.position.copy(l.q.f); _d.subVectors(l.q.k, l.q.f).normalize(); l.boot.shaft.quaternion.setFromUnitVectors(Y, _d); l.boot.ft.rotation.x = f.a; });
    const tw2 = Math.sin(tw) * 0.08 * w + (p.twist ?? 0), lean = (p.lean ?? 0) + 0.07 * w;
    hipG.position.set(0, hipY, hz); hipG.rotation.set(lean * 0.4, tw2 * 0.3, 0);
    body.position.set(0, hipY, hz); body.rotation.set(lean, tw2, p.roll ?? 0); body.updateMatrixWorld(true);
    const hd = p.head ?? [0, 0, 0]; head.rotation.set(hd[0], hd[1] - tw2, hd[2] ?? 0);
    const bl = p.blink ?? ((t % 3.7) < 0.1 ? 1 : 0), brow = p.brow ?? 0, lk = p.look ?? [0, 0];
    eyes.forEach(e => { e.lid.scale.y = 1 + 2.4 * bl + 1.2 * (p.squint ?? 0); e.lid.position.y = 0.027 - 0.022 * bl - 0.008 * (p.squint ?? 0); e.br.rotation.z = -e.sx * (brow + 0.22); e.br.position.y = 0.05 + (p.browY ?? 0);
      for (const k of [e.pu, e.ir]) { k.position.x = lk[0] * 0.009; k.position.y = lk[1] * 0.007; } e.hl.position.x = lk[0] * 0.006 - 0.004; e.hl.position.y = lk[1] * 0.005 + 0.005; });
    mO.visible = Z || p.mouth === 'o'; mLine.visible = mLip.visible = !Z && p.mouth !== 'o'; mLine.rotation.z = (p.mouth === 'sorri' ? -Math.PI / 2 : Math.PI / 2) - 0.23; mLine.position.y = p.mouth === 'sorri' ? 0.11 : -0.11;
    for (const [k, A] of [['L', arms.L], ['R', arms.R]]) { const sx = A.sx, s0 = body.localToWorld(V(sx * P.shX, P.shY, 0)); root.worldToLocal(s0); const ov = k === 'L' ? p.armL : p.armR;
      if (ov) { b.set(s0.x + ov[0], s0.y + ov[1], s0.z + ov[2]); c.set(s0.x + ov[3], s0.y + ov[4], s0.z + ov[5]); }
      else { const a1 = (sx > 0 ? -1 : 1) * sw * 0.5 - 0.04, a2 = a1 + 0.3 + cl(a1) * 0.3; b.set(s0.x + sx * P.ax, s0.y - Math.cos(a1) * P.al[0], s0.z + Math.sin(a1) * P.al[0]); c.set(b.x + sx * P.ax * 0.5, b.y - Math.cos(a2) * P.al[1], b.z + Math.sin(a2) * P.al[1]); }
      between(A.up, b, s0); between(A.lo, c, b); A.el.position.copy(b); A.sh.position.copy(s0); dir.subVectors(c, b).normalize(); a.copy(c).addScaledVector(dir, -0.07); between(A.cuff, a, c);
      A.hand.position.copy(c).addScaledVector(dir, 0.045); A.hand.quaternion.setFromUnitVectors(Y, dir); A.grip.position.copy(c).addScaledVector(dir, 0.05); A.grip.quaternion.copy(A.hand.quaternion); }
  }
  root.traverse(m => { if (m.isMesh) m.castShadow = true; });
  pose({});
  return { root, pose, head, body, arms, eyes };
}
