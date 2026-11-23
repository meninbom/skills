// Gente: boneco 3D chapado, pose por parâmetros. Olha para +z; +x é a esquerda dele.
// Zé: boné de aba curva com emblema, cabelo e barba por fazer, jaqueta de lona com gola de lã, jeans de barra virada, botina.
import { THREE, mat, between, box, foot, ik, cl, lerp, ss, plain, mkTex, paint, Y } from './kit3d.js';

const css = h => '#' + h.toString(16).padStart(6, '0');
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

export function criaGente(o = {}) {
  const K = { skin: 0xdf9d6e, cap: 0x4f6f3a, jacket: 0x7d4b2b, jeans: 0x3d5c88, boot: 0x4a3020, wool: 0xe6d9bd, hair: 0x2c2019, zumbi: false, ...o };
  const T = { jacket: plain('canvas', css(K.jacket), 0.6), jacketD: plain('canvas', css(K.jacket), 0.6, 0.05, 0.24), jeans: plain('navy', css(K.jeans), 0.68), jeansD: plain('navy', css(K.jeans), 0.68, 0.05, 0.24), jeansL: plain('navy', '#8fa6c4', 0.75),
    boot: plain('leather', css(K.boot), 0.5, 0.3), cap: plain('canvas', css(K.cap), 0.78), capD: plain('canvas', css(K.cap), 0.78, 0.05, 0.3), wool: plain('fur', css(K.wool), 0.8) };
  // rosto pintado: bochecha, sombra da aba, barba por fazer, rugas
  T.face = mkTex(512, 512, (g, w, h) => { g.fillStyle = css(K.skin); g.fillRect(0, 0, w, h); if (K.zumbi) paint(g, w, h, 'zskin', css(K.skin), 0.35); const fx = w * 0.25, fy = h * 0.5;
    let gr = g.createLinearGradient(0, h * 0.26, 0, h * 0.46); gr.addColorStop(0, 'rgba(70,30,20,0.5)'); gr.addColorStop(1, 'rgba(70,30,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    gr = g.createLinearGradient(0, h * 0.58, 0, h * 0.72); gr.addColorStop(0, 'rgba(60,40,34,0)'); gr.addColorStop(1, 'rgba(60,40,34,0.22)'); g.fillStyle = gr; g.fillRect(0, 0, w * 0.5, h);
    const r = (() => { let s = 9; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })(); g.fillStyle = 'rgba(40,26,20,0.5)'; for (let i = 0; i < 260; i++) { const x = fx + (r() - 0.5) * 190, y = fy + 50 + r() * 100; g.fillRect(x, y, 2, 3); }
    for (const sx of [-1, 1]) { gr = g.createRadialGradient(fx + sx * 46, fy + 34, 0, fx + sx * 46, fy + 34, 30); gr.addColorStop(0, 'rgba(212,96,66,0.26)'); gr.addColorStop(1, 'rgba(212,96,66,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(110,52,36,0.5)'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.arc(fx + sx * 30, fy + 2, 16, 0.3, 1.9, sx < 0); g.stroke(); g.beginPath(); g.moveTo(fx + sx * 12, fy + 22); g.quadraticCurveTo(fx + sx * 24, fy + 40, fx + sx * 22, fy + 56); g.stroke(); } });
  T.face.wrapS = T.face.wrapT = THREE.ClampToEdgeWrapping;
  // emblema do boné: losango creme com folha
  T.patch = mkTex(128, 128, (g, w, h) => { g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3a2a1c'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12); g.fillStyle = '#c8502c'; g.beginPath(); g.moveTo(w / 2, 22); g.quadraticCurveTo(w - 22, h / 2, w / 2, h - 22); g.quadraticCurveTo(22, h / 2, w / 2, 22); g.fill(); g.strokeStyle = '#e8dcc0'; g.lineWidth = 5; g.beginPath(); g.moveTo(w / 2, 30); g.lineTo(w / 2, h - 30); g.stroke(); });
  const M = (t, extra) => mat(0xffffff, { map: t, grain: 0.18, rim: 0.4, ...extra });
  const skinM = (extra) => mat(K.skin, { keep: 0.5, grain: 0.05, shade: 0.82, rim: 0.55, ...extra });
  const root = new THREE.Group(), add = m => { root.add(m); return m; };
  const L = { th: 0.39, sh: 0.39, hipX: 0.085, ank: 0.088 };
  const C = (rt, rb, m, seg = 16) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, 1, seg, 1), m), B = (r, m) => new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), m);
  const E = (sx, sy, sz, m) => { const k = B(1, m); k.scale.set(sx, sy, sz); return k; };
  // botina com cano, biqueira, sola de borracha e cadarço
  const mkBoot = () => { const g = new THREE.Group(), shaft = new THREE.Group(), ft = new THREE.Group(); g.add(shaft, ft);
    const s = C(0.08, 0.072, M(T.boot, { spec: 0.3 })); s.scale.y = 0.17; s.position.y = 0.05; shaft.add(s); const cu = C(0.086, 0.084, M(T.jeansL)); cu.scale.y = 0.06; cu.position.y = 0.155; shaft.add(cu);
    const b = E(0.086, 0.07, 0.15, M(T.boot, { spec: 0.35 })); b.position.set(0, -0.016, 0.07); ft.add(b); const toe = E(0.084, 0.064, 0.09, M(T.boot, { spec: 0.45 })); toe.position.set(0, -0.016, 0.165); ft.add(toe);
    const sole = box(0.175, 0.04, 0.35, 0x1c1410); sole.position.set(0, -0.074, 0.075); ft.add(sole); const heel = box(0.16, 0.03, 0.1, 0x120c0a); heel.position.set(0, -0.1, -0.04); ft.add(heel);
    for (let i = 0; i < 3; i++) { const lc = box(0.07, 0.008, 0.012, 0xd8c8a0, { rim: 0 }); lc.position.set(0, 0.035 - i * 0.012, 0.11 + i * 0.03); lc.rotation.x = -0.5; ft.add(lc); } return { g, shaft, ft }; };
  const legs = [1, -1].map(sx => ({ sx, thigh: add(C(0.072, 0.098, M(sx > 0 ? T.jeansD : T.jeans))), shin: add(C(0.062, 0.074, M(sx > 0 ? T.jeansD : T.jeans))), knee: add(B(0.074, M(sx > 0 ? T.jeansD : T.jeans))), boot: mkBoot(), q: { k: V(), f: V() } }));
  legs.forEach(l => add(l.boot.g));
  const hipG = new THREE.Group(); add(hipG);
  const pelvis = E(0.172, 0.12, 0.118, M(T.jeans)); pelvis.position.y = -0.03; hipG.add(pelvis);
  const beltM = new THREE.Mesh(new THREE.CylinderGeometry(0.172, 0.174, 0.045, 28, 1), M(T.boot, { spec: 0.3 })); beltM.scale.z = 0.7; beltM.position.y = 0.045; hipG.add(beltM);
  const body = new THREE.Group(); add(body);
  // jaqueta: tronco, barra canelada, ombros, zíper, bolsos com aba, gola de lã
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.176, 0.5, 32, 1), M(T.jacket)); torso.scale.z = 0.72; torso.position.y = 0.29; body.add(torso);
  const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.178, 0.184, 0.075, 32, 1), M(T.jacketD)); hem.scale.z = 0.74; hem.position.y = 0.045; body.add(hem);
  const sh = E(0.228, 0.085, 0.14, M(T.jacket)); sh.position.y = 0.52; body.add(sh);
  const zip = box(0.014, 0.46, 0.012, 0x1e1814, { rim: 0 }); zip.position.set(0, 0.28, 0.136); body.add(zip); const zp = box(0.022, 0.03, 0.016, 0xb8b0a0, { rim: 0, metal: 0.8 }); zp.position.set(0, 0.46, 0.14); body.add(zp);
  for (const sx of [1, -1]) { const pk = box(0.1, 0.09, 0.012, 0x6a3f24, { rim: 0 }); pk.position.set(sx * 0.1, 0.36, 0.118); pk.rotation.y = sx * 0.42; body.add(pk); const fl = box(0.108, 0.035, 0.016, 0x58341e, { rim: 0 }); fl.position.set(sx * 0.1, 0.41, 0.122); fl.rotation.y = sx * 0.42; body.add(fl);
    const bt = B(0.009, mat(0xc8b890, { rim: 0, metal: 0.6 })); bt.position.set(sx * 0.1, 0.4, 0.132); body.add(bt); const hp = box(0.09, 0.012, 0.012, 0x58341e, { rim: 0 }); hp.position.set(sx * 0.11, 0.17, 0.118); hp.rotation.set(0, sx * 0.4, sx * 0.25); body.add(hp); }
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.128, 0.07, 28, 1, true), M(T.wool, { grain: 0.4, rim: 0.3, side: THREE.DoubleSide })); collar.scale.z = 0.9; collar.position.set(0, 0.565, -0.004); collar.rotation.x = 0.1; body.add(collar);
  for (const sx of [1, -1]) { const lp = box(0.07, 0.085, 0.012, 0xffffff, { map: T.wool, rim: 0, grain: 0.4 }); lp.position.set(sx * 0.052, 0.51, 0.124); lp.rotation.set(-0.2, sx * 0.35, sx * 0.55); body.add(lp); }
  const neck = C(0.052, 0.058, skinM({ rim: 0 })); neck.scale.y = 0.11; neck.position.set(0, 0.63, 0.008); body.add(neck);
  // cabeça
  const head = new THREE.Group(); head.position.set(0, 0.825, 0.02); head.scale.setScalar(1.46); body.add(head);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.135, 32, 24), mat(0xffffff, { map: T.face, keep: 0.5, grain: 0.04, shade: 0.82 })); face.scale.set(1, 1.05, 0.98); head.add(face);
  for (const sx of [1, -1]) { const ear = E(0.016, 0.03, 0.024, skinM({ rim: 0, shade: 0.75 })); ear.position.set(sx * 0.134, -0.012, -0.004); head.add(ear); }
  // cabelo: laterais e nuca, só o que sobra debaixo do boné
  const hairM = mat(K.hair, { rim: 0.3, grain: 0.4 });
  const hairS = new THREE.Mesh(new THREE.SphereGeometry(0.1405, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), hairM); hairS.scale.set(1, 1.05, 0.99); hairS.rotation.x = -0.82; head.add(hairS);
  // boné: copa, frente alta com emblema, aba curva, botão, costuras, fecho atrás
  const capG = new THREE.Group(); capG.position.set(0, 0.04, -0.004); capG.rotation.x = -0.1; head.add(capG);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.15, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), M(T.cap, { grain: 0.24 })); dome.scale.set(1.0, 0.8, 1.06); capG.add(dome);
  const bandC = new THREE.Mesh(new THREE.CylinderGeometry(0.1505, 0.1505, 0.012, 32, 1, true), M(T.capD)); bandC.scale.z = 1.06; bandC.position.y = 0.004; capG.add(bandC);
  const brimG = new THREE.Group(); brimG.position.set(0, 0.004, 0.118); brimG.rotation.x = 0.16; capG.add(brimG);
  const bg = new THREE.CylinderGeometry(0.135, 0.135, 0.014, 28, 1, false, -Math.PI / 2, Math.PI); { const P = bg.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i); P.setY(i, P.getY(i) - x * x * 1.7); } bg.computeVertexNormals(); }
  const brim = new THREE.Mesh(bg, M(T.cap, { grain: 0.24, side: THREE.DoubleSide })); brim.scale.set(1.04, 1, 1.5); brimG.add(brim);
  const brimU = new THREE.Mesh(bg, M(T.capD, { side: THREE.DoubleSide, rim: 0 })); brimU.scale.set(1.03, 1, 1.49); brimU.position.y = -0.006; brimG.add(brimU);
  const btn = B(0.015, M(T.capD)); btn.position.y = 0.121; capG.add(btn);
  for (let i = 0; i < 3; i++) { const sm = new THREE.Mesh(new THREE.TorusGeometry(0.151, 0.0035, 4, 28, Math.PI), M(T.capD, { rim: 0 })); sm.scale.set(1, 0.8, 1.06); sm.rotation.y = i * Math.PI / 3; capG.add(sm); }
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.062), mat(0xffffff, { map: T.patch, rim: 0, grain: 0.1 })); patch.position.set(0, 0.052, 0.151); patch.rotation.x = -0.4; capG.add(patch);
  const gap = E(0.05, 0.04, 0.012, mat(K.hair, { rim: 0 })); gap.position.set(0, 0.03, -0.153); capG.add(gap); const strap = box(0.11, 0.016, 0.012, 0x2a2018, { rim: 0 }); strap.position.set(0, 0.005, -0.158); capG.add(strap);
  // olhos com branco, íris, brilho, pálpebra e sobrancelha
  const eyes = [1, -1].map(sx => { const eg = new THREE.Group(); eg.position.set(sx * 0.043, -0.016, 0.124); eg.rotation.y = sx * 0.3; head.add(eg);
    const wh = E(0.022, 0.024, 0.01, mat(K.zumbi ? 0xd8e0b0 : 0xf5efe4, { rim: 0, shade: 0.9, keep: 0.6, grain: 0 })); eg.add(wh);
    const ir = E(0.0125, 0.0145, 0.007, mat(K.zumbi ? 0x9aa86a : 0x5a3a22, { rim: 0, shade: 1, keep: 0.5, grain: 0 })); ir.position.z = 0.008; eg.add(ir);
    const pu = E(K.zumbi ? 0.003 : 0.007, K.zumbi ? 0.003 : 0.008, 0.005, mat(0x140e0a, { rim: 0, shade: 1 })); pu.position.z = 0.012; eg.add(pu);
    const hl = B(0.0034, mat(0xffffff, { rim: 0, shade: 1, keep: 1, grain: 0 })); hl.position.set(-0.004, 0.005, 0.014); eg.add(hl);
    const lid = box(0.05, 0.013, 0.018, 0x3a2a20, { rim: 0, shade: 1 }); lid.position.set(0, 0.022, 0.004); eg.add(lid);
    const br = E(0.03, 0.0085, 0.011, mat(K.hair, { rim: 0, grain: 0.3 })); br.position.set(sx * 0.002, 0.043, 0.017);
    return { eg, pu, ir, hl, lid, br, sx }; });
  const nose = E(0.026, 0.027, 0.027, mat(K.zumbi ? 0x74845f : 0xd9946a, { keep: 0.5, grain: 0.04, rim: 0, shade: 0.78 })); nose.position.set(0, -0.044, 0.137); head.add(nose);
  const mouth = new THREE.Group(); mouth.position.set(0, -0.092, 0.108); mouth.rotation.x = 0.25; head.add(mouth);
  const mLine = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.0042, 6, 14, 0.36), mat(0x4a221c, { rim: 0, shade: 1 })); mLine.rotation.z = -Math.PI / 2 - 0.18; mLine.position.set(0, 0.11, 0.012); mouth.add(mLine);
  const mLip = E(0.016, 0.005, 0.006, mat(0xc47a58, { rim: 0, shade: 1, keep: 0.5 })); mLip.position.set(0, -0.012, 0.014); mouth.add(mLip);
  const mO = E(0.013, 0.016, 0.008, mat(0x3a1612, { rim: 0, shade: 1 })); mO.position.set(0, 0.002, 0.012); mouth.add(mO);
  // braços: manga grossa, punho canelado, mão com polegar e dedos
  const arm = sx => { const m = sx > 0 ? T.jacketD : T.jacket, hand = new THREE.Group(); add(hand);
    const palm = E(0.04, 0.05, 0.03, skinM()); hand.add(palm); const fing = E(0.036, 0.036, 0.026, skinM({ shade: 0.74 })); fing.position.y = 0.05; hand.add(fing); const th = E(0.014, 0.03, 0.016, skinM()); th.position.set(-sx * 0.04, 0.012, 0.012); th.rotation.z = -sx * 0.6; hand.add(th);
    for (let i = 0; i < 3; i++) { const ln = box(0.003, 0.04, 0.004, 0x9a5a3a, { rim: 0, shade: 1, keep: 0.5 }); ln.position.set((i - 1) * 0.018, 0.055, 0.025); hand.add(ln); }
    return { sx, up: add(C(0.058, 0.07, M(m))), lo: add(C(0.05, 0.06, M(m))), el: add(B(0.06, M(m))), cuff: add(C(0.052, 0.052, M(T.jacketD))), hand, grip: add(new THREE.Object3D()) }; };
  const arms = { L: arm(1), R: arm(-1) };
  const hip = V(), a = V(), b = V(), c = V(), _d = V(), dir = V();
  // p: { t, walk, w, stride, hipY, hz, lean, twist, head:[pitch,yaw,roll], armL/armR:[ex,ey,ez,hx,hy,hz] (cotovelo e mão a partir do ombro), footL/footR:[y,z], blink, brow, look:[x,y], mouth }
  function pose(p = {}) {
    root.updateMatrixWorld(true);
    const t = p.t ?? 0, w = p.walk == null ? 0 : (p.w ?? 1), ph = p.walk ?? 0, tw = ph * 2 * Math.PI, bob = -Math.cos(tw * 2) * 0.022 * w, hipY = (p.hipY ?? (0.83 + 0.03 * (1 - w))) + bob, hz = p.hz ?? 0, sw = Math.sin(tw + 0.5) * w, stride = p.stride ?? 0.62;
    legs.forEach((l, i) => { const f = foot((ph + (i ? 0.5 : 0)) % 1, stride), ov = i ? p.footR : p.footL; f.z = lerp(i ? -0.05 : 0.05, f.z, w); f.y *= w; f.a *= w; if (ov) { f.y = ov[0]; f.z = ov[1]; f.a = ov[2] ?? 0; }
      const fx = l.sx * (L.hipX + 0.03 * (1 - w)); hip.set(l.sx * L.hipX, hipY, hz); a.set(fx, L.ank + f.y, f.z); ik(hip, a, L.th, L.sh, l.q); l.q.k.x = lerp(hip.x, fx, 0.5); l.q.f.x = fx;
      between(l.thigh, hip, l.q.k); between(l.shin, l.q.k, l.q.f); l.knee.position.copy(l.q.k);
      l.boot.g.position.copy(l.q.f); _d.subVectors(l.q.k, l.q.f).normalize(); l.boot.shaft.quaternion.setFromUnitVectors(Y, _d); l.boot.ft.rotation.x = f.a; });
    const tw2 = Math.sin(tw) * 0.08 * w + (p.twist ?? 0), lean = (p.lean ?? 0) + 0.07 * w;
    hipG.position.set(0, hipY, hz); hipG.rotation.set(lean * 0.4, tw2 * 0.3, 0);
    body.position.set(0, hipY, hz); body.rotation.set(lean, tw2, p.roll ?? 0); body.updateMatrixWorld(true);
    const hd = p.head ?? [0, 0, 0]; head.rotation.set(hd[0], hd[1] - tw2, hd[2] ?? 0);
    const bl = p.blink ?? ((t % 3.7) < 0.1 ? 1 : 0), brow = p.brow ?? 0, lk = p.look ?? [0, 0];
    eyes.forEach(e => { e.lid.scale.y = 1 + 2.6 * bl + 1.2 * (p.squint ?? 0); e.lid.position.y = 0.022 - 0.016 * bl - 0.006 * (p.squint ?? 0); e.br.rotation.z = e.sx * (brow - 0.12); e.br.position.y = 0.043 + (p.browY ?? 0);
      for (const k of [e.pu, e.ir]) { k.position.x = lk[0] * 0.006; k.position.y = lk[1] * 0.005; } e.hl.position.x = lk[0] * 0.006 - 0.004; e.hl.position.y = lk[1] * 0.005 + 0.005; });
    mO.visible = p.mouth === 'o'; mLine.visible = mLip.visible = p.mouth !== 'o'; mLine.rotation.z = (p.mouth === 'triste' ? Math.PI / 2 : -Math.PI / 2) - 0.18; mLine.position.y = p.mouth === 'triste' ? -0.11 : 0.11;
    for (const [k, A] of [['L', arms.L], ['R', arms.R]]) { const sx = A.sx, s0 = body.localToWorld(V(sx * 0.215, 0.48, 0)); root.worldToLocal(s0); const ov = k === 'L' ? p.armL : p.armR;
      if (ov) { b.set(s0.x + ov[0], s0.y + ov[1], s0.z + ov[2]); c.set(s0.x + ov[3], s0.y + ov[4], s0.z + ov[5]); }
      else { const a1 = (sx > 0 ? -1 : 1) * sw * 0.5 - 0.04, a2 = a1 + 0.3 + cl(a1) * 0.3; b.set(s0.x + sx * 0.035, s0.y - Math.cos(a1) * 0.26, s0.z + Math.sin(a1) * 0.26); c.set(b.x + sx * 0.005, b.y - Math.cos(a2) * 0.25, b.z + Math.sin(a2) * 0.25); }
      between(A.up, b, s0); between(A.lo, c, b); A.el.position.copy(b); dir.subVectors(c, b).normalize(); a.copy(c).addScaledVector(dir, -0.05); between(A.cuff, a, c);
      A.hand.position.copy(c).addScaledVector(dir, 0.012); A.hand.quaternion.setFromUnitVectors(Y, dir); A.grip.position.copy(c).addScaledVector(dir, 0.05); A.grip.quaternion.copy(A.hand.quaternion); }
  }
  root.traverse(m => { if (m.isMesh) m.castShadow = true; });
  pose({});
  return { root, pose, head, body, arms, eyes };
}
