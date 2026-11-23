// POV: o elevador passou do último andar e parou no 13. Cabine de inox, painel com display em canvas,
// corredor que não acaba (segmentos de 3 m com luz própria), silhueta no fundo e mão cinza na porta.
import * as THREE from 'three';
import * as TX from './texturas.js';
import { maoMesh } from './maos3.js';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ss = k => { k = Math.min(1, Math.max(0, k)); return k * k * (3 - 2 * k); };
const APAGA = [[9.8, 9.95], [10.3, 10.42]]; // lâmpada em cima dele falha 2 vezes (≤ 3 piscadas/s)
export const SEG = 3, NSEG = 22, Z0 = -0.8;
export function andar(t) { return t < 1.2 ? 8 : t < 1.8 ? 9 : t < 2.4 ? 10 : t < 3.0 ? 11 : t < 3.75 ? 12 : 13; }
export function abertura(t) { return ss((t - 4.9) / 1.4) * (1 - 0.74 * ss((t - 12.0) / 1.45)); }

export function montar(scene, K) {
  const { toon, marcaId } = K;
  const T = { inox: TX.texInox(), piso: TX.texPiso(), carp: TX.texCarpete(), pp: TX.texPapelParede(), mad: TX.texMadeira() };
  const add = (geo, mat, x, y, z, grp = scene) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); grp.add(m); return m; };
  const cab = new THREE.Group(); scene.add(cab);
  // ---- cabine ----
  const inox = toon(T.inox, 1 / 0.55, 0xf4ead8), inoxEsc = toon(T.inox, 1 / 0.55, 0x9a9aa6);
  add(new THREE.BoxGeometry(1.7, 0.04, 1.6), toon(T.piso, 1 / 0.5, 0xffffff), 0, -0.02, 0, cab);
  add(new THREE.BoxGeometry(0.05, 2.45, 1.6), inox, -0.82, 1.2, 0, cab); add(new THREE.BoxGeometry(0.05, 2.45, 1.6), inox, 0.82, 1.2, 0, cab);
  add(new THREE.BoxGeometry(1.7, 2.45, 0.05), inox, 0, 1.2, 0.78, cab);
  add(new THREE.BoxGeometry(1.7, 0.05, 1.6), toon(null, 1, 0x56565e), 0, 2.42, 0, cab);
  const luzTeto = add(new THREE.BoxGeometry(0.9, 0.02, 0.7), toon(null, 1, 0xfff1c8, { emis: 1 }), 0, 2.39, 0.05, cab);
  // frente: batentes + travessa com display
  add(new THREE.BoxGeometry(0.32, 2.45, 0.06), inoxEsc, -0.66, 1.2, -0.78, cab); add(new THREE.BoxGeometry(0.32, 2.45, 0.06), inoxEsc, 0.66, 1.2, -0.78, cab);
  add(new THREE.BoxGeometry(1.7, 0.36, 0.06), inoxEsc, 0, 2.27, -0.78, cab);
  // corrimão
  const corr = toon(null, 1, 0xd8d8de);
  for (const [a, b] of [[V(-0.76, 0.95, 0.7), V(0.76, 0.95, 0.7)], [V(-0.76, 0.95, -0.6), V(-0.76, 0.95, 0.7)], [V(0.76, 0.95, -0.15), V(0.76, 0.95, 0.7)]]) {
    const d = b.clone().sub(a); const m = add(new THREE.CylinderGeometry(0.022, 0.022, d.length(), 12), corr, 0, 0, 0, cab); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); }
  // ---- displays (travessa + painel) em canvas ----
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 512; const g = cv.getContext('2d');
  const tp = new THREE.CanvasTexture(cv); tp.colorSpace = THREE.NoColorSpace; tp.anisotropy = 16;
  const painel = add(new THREE.PlaneGeometry(0.26, 0.52), toon(tp, 1, 0xffffff, { mode: 1, emis: 0.55 }), 0.792, 1.22, -0.36, cab); painel.rotation.y = -Math.PI / 2;
  const cvd = document.createElement('canvas'); cvd.width = 256; cvd.height = 96; const gd = cvd.getContext('2d');
  const td = new THREE.CanvasTexture(cvd); td.colorSpace = THREE.NoColorSpace;
  const disp = add(new THREE.PlaneGeometry(0.34, 0.13), toon(td, 1, 0xffffff, { mode: 1, emis: 1 }), 0, 2.27, -0.748, cab);
  const BOT = ['T', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const posBot = k => { const col = k === 0 ? 0.5 : (k - 1) % 2, lin = k === 0 ? 0 : 1 + Math.floor((k - 1) / 2); return { u: 78 + col * 100, v: 470 - lin * 52 }; };
  // botão k em coordenadas de mundo (painel em x=0.792, olhando -x; u→ -z… v→ y)
  const botMundo = k => { const { u, v } = posBot(k); return V(0.79, 1.22 + (256 - v) / 512 * 0.52, -0.36 + (u - 128) / 256 * 0.26 * -1 * -1); };
  function desenha(f, aceso) {
    g.fillStyle = '#8d9098'; g.fillRect(0, 0, 256, 512); g.strokeStyle = '#3a2416'; g.lineWidth = 6; g.strokeRect(3, 3, 250, 506);
    g.fillStyle = '#120606'; g.fillRect(40, 22, 176, 70); g.lineWidth = 4; g.strokeRect(40, 22, 176, 70);
    g.fillStyle = f === 13 ? '#ff3a2a' : '#ff6a3a'; g.font = '800 54px Rubik'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText((f === 13 ? '13' : String(f)) + ' ▲', 128, 59);
    for (let k = 0; k < BOT.length; k++) { const { u, v } = posBot(k); const on = aceso.includes(BOT[k]);
      g.fillStyle = on ? '#ffd76a' : '#d9dbe0'; g.beginPath(); g.arc(u, v, 21, 0, 7); g.fill(); g.lineWidth = 4; g.strokeStyle = '#3a2416'; g.stroke();
      g.fillStyle = '#2a1a10'; g.font = '800 20px Rubik'; g.fillText(BOT[k], u, v + 1); }
    tp.needsUpdate = true;
    gd.fillStyle = '#120606'; gd.fillRect(0, 0, 256, 96); gd.fillStyle = f === 13 ? '#ff3a2a' : '#ff7a40'; gd.font = '800 70px Rubik'; gd.textAlign = 'center'; gd.textBaseline = 'middle';
    gd.fillText(String(f), 128, 52); gd.strokeStyle = '#3a2416'; gd.lineWidth = 8; gd.strokeRect(0, 0, 256, 96); td.needsUpdate = true;
  }
  // ---- portas da cabine ----
  const portaM = toon(T.inox, 1 / 0.4, 0xc6c8cf);
  const pE = add(new THREE.BoxGeometry(0.5, 2.1, 0.03), portaM, -0.25, 1.05, -0.74, cab), pD = add(new THREE.BoxGeometry(0.5, 2.1, 0.03), portaM, 0.25, 1.05, -0.74, cab);
  // ---- corredor (segmentos com luz própria) ----
  const segs = [];
  for (let i = 0; i < NSEG; i++) { const zc = Z0 - SEG * (i + 0.5), grp = new THREE.Group(); scene.add(grp);
    const mats = { car: toon(T.carp, 1 / 1.4, 0xffffff), pp: toon(T.pp, 1 / 1.6, 0xffffff), teto: toon(null, 1, 0xd9d2b4, { emis: 0.45 }), roda: toon(T.mad, 1 / 0.8, 0x8a5a36) };
    add(new THREE.BoxGeometry(2.4, 0.04, SEG), mats.car, 0, -0.02, zc, grp);
    add(new THREE.BoxGeometry(0.05, 2.7, SEG), mats.pp, -1.12, 1.33, zc, grp); add(new THREE.BoxGeometry(0.05, 2.7, SEG), mats.pp, 1.12, 1.33, zc, grp);
    add(new THREE.BoxGeometry(2.4, 0.05, SEG), mats.teto, 0, 2.66, zc, grp);
    add(new THREE.BoxGeometry(0.06, 0.14, SEG), mats.roda, -1.08, 0.07, zc, grp); add(new THREE.BoxGeometry(0.06, 0.14, SEG), mats.roda, 1.08, 0.07, zc, grp);
    const lamp = add(new THREE.CylinderGeometry(0.16, 0.2, 0.08, 20), toon(null, 1, 0xfff0b0, { emis: 1 }), 0, 2.6, zc, grp);
    const lado = i % 2 ? 1 : -1, num = '13' + String(i + 1).padStart(2, '0');
    const porta = add(new THREE.PlaneGeometry(0.95, 2.05), toon(TX.texPorta(i === 5 ? '1313' : num), 1, 0xffffff, { mode: 1 }), lado * 1.09, 1.03, zc + 0.3, grp); porta.rotation.y = -lado * Math.PI / 2;
    const bat = toon(null, 1, 0x5a3a22); add(new THREE.BoxGeometry(0.06, 2.15, 0.08), bat, lado * 1.085, 1.07, zc + 0.3 + 0.51, grp); add(new THREE.BoxGeometry(0.06, 2.15, 0.08), bat, lado * 1.085, 1.07, zc + 0.3 - 0.51, grp); add(new THREE.BoxGeometry(0.06, 0.08, 1.1), bat, lado * 1.085, 2.12, zc + 0.3, grp);
    marcaId(grp); segs.push({ zc, mats, lamp, base: { car: mats.car.uniforms.uCol.value.clone(), pp: mats.pp.uniforms.uCol.value.clone(), teto: mats.teto.uniforms.uCol.value.clone(), roda: mats.roda.uniforms.uCol.value.clone() } });
  }
  // fundo do corredor: parede escura (o corredor "some" na névoa)
  add(new THREE.BoxGeometry(2.4, 2.7, 0.1), toon(null, 1, 0x101010), 0, 1.33, Z0 - SEG * NSEG, scene);
  // ---- a silhueta ----
  const fig = new THREE.Group(); scene.add(fig); const preto = toon(null, 1, 0x26232e);
  const corpo = add(new THREE.CapsuleGeometry(0.2, 1.55, 6, 16), preto, 0, 1.15, 0, fig); corpo.scale.set(1, 1, 0.7);
  add(new THREE.SphereGeometry(0.19, 20, 14), preto, 0, 2.18, 0, fig);
  for (const s of [-1, 1]) { add(new THREE.SphereGeometry(0.055, 12, 8), toon(null, 1, 0xfffbe8, { emis: 1 }), s * 0.075, 2.21, 0.15, fig);
    const br = add(new THREE.CapsuleGeometry(0.06, 1.15, 4, 10), preto, s * 0.26, 1.25, 0, fig); br.rotation.z = s * 0.06; }
  fig.position.set(0.15, 0, -10.9);
  // ---- mão do POV (aponta) ----
  const pele = toon(null, 1, 0xf0b78e, { emis: 0.15 }), manga = toon(null, 1, 0x2d3f6a);
  const mao = new THREE.Group(); scene.add(mao); const mm = maoMesh('aponta', 1, pele); mao.add(mm);
  const braco = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1, 18), manga); scene.add(braco);
  const punho = new THREE.Mesh(new THREE.CylinderGeometry(0.067, 0.067, 0.06, 18), toon(null, 1, 0x223154)); scene.add(punho);
  // ---- mão cinza na porta ----
  const cinza = toon(null, 1, 0x8d8a9c);
  const garra = new THREE.Group(); scene.add(garra); garra.add(maoMesh('agarra', -1, cinza));
  const antebr = add(new THREE.CylinderGeometry(0.035, 0.045, 0.6, 12), cinza, 0, 0, 0, garra); antebr.rotation.x = Math.PI / 2; antebr.position.z = 0.3;
  marcaId(cab); marcaId(fig); marcaId(mao); marcaId(braco); marcaId(punho); marcaId(garra);
  let ult = '';
  const SC = 1.3, PONTA = 0.168 * SC;
  return { segs, fig, update(t, rig, U) {
    // painel
    const f = andar(t), ac = []; if (t > 0.85 && t < 3.75) ac.push('12'); if (t > 11.7) ac.push('T');
    const key = f + ac.join(); if (key !== ult) { desenha(f, ac); ult = key; }
    // portas
    const ab = abertura(t); pE.position.x = -0.25 - ab * 0.5; pD.position.x = 0.25 + ab * 0.5;
    // luzes do corredor: longe→perto
    for (let i = 0; i < NSEG; i++) { const S = segs[i];
      let off = i >= 4 ? 9.0 + (NSEG - 1 - i) * 0.04 : i === 3 ? 10.75 : 11.15 + (2 - i) * 0.45;
      let k = t < off ? 1 : 0.06;
      if (i === 3 && t > 9.55 && t < 10.75) k = APAGA.some(([a0, a1]) => t > a0 && t < a1) ? 0.15 : 1; // pisca em cima dele
      if (t >= 13.2) k = 0.06;
      for (const n of ['car', 'pp', 'teto', 'roda']) S.mats[n].uniforms.uCol.value.copy(S.base[n]).multiplyScalar(k);
      S.lamp.material.uniforms.uEmis.value = k > 0.5 ? 1 : 0; S.lamp.material.uniforms.uCol.value.setScalar(k > 0.5 ? 1 : 0.15); }
    // a silhueta: aparece quando o fundo apaga, depois chega na porta
    fig.visible = t > 9.0 && t < 14.3; { const k = ss((t - 11.2) / 1.9); fig.position.z = -10.9 + k * 9.25; fig.position.x = 0.15 - 0.15 * k; }
    // mão do POV: aperta 12 (0,35–1,5) e soca o T (11,5–13)
    const a1 = ss((t - 0.3) / 0.35) * (1 - ss((t - 1.35) / 0.35)), a2 = ss((t - 11.45) / 0.25) * (1 - ss((t - 12.95) / 0.3)), k = Math.max(a1, a2);
    const vis = k > 0.01; mao.visible = braco.visible = punho.visible = vis;
    if (vis) { const alvo = botMundo(t < 6 ? 12 : 0);
      const soco = t < 6 ? ss((t - 0.75) / 0.1) * (1 - ss((t - 0.95) / 0.12)) : Math.max(0, Math.sin((t - 11.6) * Math.PI * 4.2)) ;
      const fz = V(1, 0.05, -0.35).normalize(); const tip = alvo.clone().addScaledVector(fz, -0.06 + 0.055 * soco);
      const longe = V(0.12, -0.28, -0.25).applyMatrix4(rig.matrixWorld);
      const pulso = tip.clone().addScaledVector(fz, -PONTA); pulso.lerp(longe, 1 - k);
      const zA = fz.clone().negate(), yA = V(0, 1, 0).addScaledVector(zA, -zA.y).normalize(), xA = new THREE.Vector3().crossVectors(yA, zA);
      mao.position.copy(pulso); mao.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xA, yA, zA)); mao.scale.setScalar(SC);
      const ombro = V(0.32, -0.55, 0.15).applyMatrix4(rig.matrixWorld); const d = pulso.clone().sub(ombro);
      braco.scale.set(1, d.length(), 1); braco.position.copy(ombro).addScaledVector(d, 0.5); braco.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().normalize());
      punho.position.copy(pulso).addScaledVector(d.clone().normalize(), -0.02); punho.quaternion.copy(braco.quaternion); }
    // mão cinza entra pela fresta e segura a porta esquerda
    const kg = ss((t - 13.15) / 0.18); garra.visible = kg > 0.01;
    if (garra.visible) { const borda = -0.25 - ab * 0.5 + 0.25;
      garra.position.set(borda - 0.05, 1.45, -0.86 + 0.16 * kg);
      const fz = V(0.2, -0.1, 1).normalize(), yA = V(-1, 0, 0), zA = fz.clone().negate(); yA.addScaledVector(zA, -yA.dot(zA)).normalize(); const xA = new THREE.Vector3().crossVectors(yA, zA);
      garra.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xA, yA, zA)); garra.scale.setScalar(1.7); }
    // luz pontual: poça em cima da silhueta enquanto pisca; depois a cabine pisca também
    const pis = t > 9.55 && t < 10.75 && !APAGA.some(([a0, a1]) => t > a0 && t < a1);
    U.uLuzP.value.set(0, 2.3, segs[3].zc); U.uLuzI.value = pis ? 3 : 0;
    luzTeto.material.uniforms.uCol.value.setScalar(t > 13.2 ? 0.25 : 1);
  } };
}
