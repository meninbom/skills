// Cachorro caramelo: quadrúpede de primitivas. Olha para +z, chão em y = 0.
import { THREE, mat, between, ball, box, ik, cl, lerp, ss, plain, mkTex, rnd, Y } from './kit3d.js';
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

export function criaCao() {
  const pelo = (base, claro, escuro, seed) => mkTex(512, 512, (g, w, h) => { const r = rnd(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { const x = r() * w, y = r() * h, q = 40 + r() * 90, gr = g.createRadialGradient(x, y, 0, x, y, q); gr.addColorStop(0, (r() < 0.5 ? claro : escuro).replace('A', (0.08 + r() * 0.1).toFixed(2))); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - q, y - q, q * 2, q * 2); }
    g.lineCap = 'round'; for (let i = 0; i < 11000; i++) { const x = r() * w, y = r() * h, a = Math.PI / 2 + (r() - 0.5) * 0.7, l = 4 + r() * 8; g.strokeStyle = (r() < 0.55 ? claro : escuro).replace('A', (0.1 + r() * 0.16).toFixed(2)); g.lineWidth = 1 + r() * 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } });
  const fur = pelo('#c78a45', 'rgba(255,224,160,A)', 'rgba(96,52,18,A)', 3), furD = pelo('#9a6228', 'rgba(240,196,130,A)', 'rgba(60,30,10,A)', 5), cream = pelo('#ecdcb8', 'rgba(255,252,236,A)', 'rgba(170,140,96,A)', 7);
  const F = (t, e) => mat(0xffffff, { map: t, grain: 0.04, rim: 0.25, ...e });
  const B = (m) => new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), m), C = (rt, rb, m) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, 1, 12, 1), m);
  const root = new THREE.Group(), add = m => { root.add(m); return m; };
  // corpo gira em torno do quadril traseiro (para sentar)
  const bodyG = new THREE.Group(); add(bodyG);
  const belly = B(F(fur)); belly.scale.set(0.135, 0.13, 0.26); belly.position.set(0, 0.02, 0.2); bodyG.add(belly);
  const chest = B(F(fur)); chest.scale.set(0.15, 0.165, 0.17); chest.position.set(0, 0.03, 0.38); bodyG.add(chest);
  const bib = B(F(cream, { rim: 0 })); bib.scale.set(0.1, 0.12, 0.08); bib.position.set(0, -0.01, 0.5); bodyG.add(bib);
  const rump = B(F(furD)); rump.scale.set(0.14, 0.14, 0.15); rump.position.set(0, 0.01, 0.02); bodyG.add(rump);
  const neck = C(0.085, 0.11, F(fur)); bodyG.add(neck);
  const headG = new THREE.Group(); bodyG.add(headG);
  const skull = B(F(fur)); skull.scale.set(0.112, 0.105, 0.115); headG.add(skull);
  const snout = B(F(cream)); snout.scale.set(0.062, 0.055, 0.1); snout.position.set(0, -0.03, 0.12); headG.add(snout);
  const jaw = new THREE.Group(); jaw.position.set(0, -0.055, 0.06); headG.add(jaw);
  const jawM = B(F(cream, { shade: 0.6 })); jawM.scale.set(0.05, 0.022, 0.085); jawM.position.set(0, -0.012, 0.06); jaw.add(jawM);
  const tongue = B(mat(0xd9606a, { rim: 0, grain: 0 })); tongue.scale.set(0.03, 0.008, 0.06); tongue.position.set(0, 0.004, 0.07); jaw.add(tongue);
  const nose = B(mat(0x1c1512, { rim: 0, spec: 0.6, grain: 0 })); nose.scale.set(0.028, 0.022, 0.022); nose.position.set(0, -0.012, 0.215); headG.add(nose);
  const blaze = B(F(cream, { rim: 0 })); blaze.scale.set(0.028, 0.05, 0.05); blaze.position.set(0, 0.045, 0.085); headG.add(blaze);
  const ears = [1, -1].map(sx => { const g = new THREE.Group(); g.position.set(sx * 0.082, 0.075, -0.02); headG.add(g); const e = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.13, 4), F(furD)); e.scale.z = 0.35; e.position.y = 0.05; g.add(e); return { g, sx }; });
  const eyes = [1, -1].map(sx => { const e = B(mat(0x1a1210, { rim: 0, shade: 1, grain: 0 })); e.scale.set(0.017, 0.019, 0.01); e.position.set(sx * 0.052, 0.022, 0.097); headG.add(e); const h = B(mat(0xffffff, { rim: 0, shade: 1, keep: 1, grain: 0 })); h.scale.setScalar(0.005); h.position.set(sx * 0.052 - 0.005, 0.03, 0.106); headG.add(h);
    const br = box(0.04, 0.01, 0.012, 0x7a4c22, { rim: 0 }); br.position.set(sx * 0.052, 0.05, 0.095); headG.add(br); return { e, h, br, sx }; });
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 8, 24), mat(0xc0392b, { rim: 0.3, grain: 0.15 })); bodyG.add(collar);
  const tag = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.006, 12), mat(0xe2b453, { rim: 0, metal: 0.8 })); tag.rotation.x = Math.PI / 2; collar.add(tag); tag.position.set(0, -0.11, 0.01);
  const tail = Array.from({ length: 5 }, (_, i) => add(C(0.03 - i * 0.004, 0.034 - i * 0.004, F(i > 2 ? cream : furD))));
  const legs = [[1, 1], [-1, 1], [1, 0], [-1, 0]].map(([sx, fr]) => ({ sx, fr, up: add(C(0.04, 0.055, F(sx > 0 ? furD : fur))), lo: add(C(0.03, 0.038, F(sx > 0 ? furD : fur))), kn: add(B(F(sx > 0 ? furD : fur))), paw: add(B(F(cream))), q: { k: V(), f: V() } }));
  const hip = V(), a = V(), p0 = V(), p1 = V(), LL = 0.2;
  // p: { modo: 'pe'|'senta'|'dorme'|'anda'|'late', t, fase, headYaw, headPitch, wag }
  function pose(p = {}) {
    root.updateMatrixWorld(true);
    const m = p.modo ?? 'pe', t = p.t ?? 0, ph = (p.fase ?? 0) * Math.PI * 2, breath = Math.sin(t * 2.2) * 0.012;
    let by = 0.4, pitch = 0, hp = p.headPitch ?? 0, hy = p.headYaw ?? 0, jw = 0, close = 0, earD = 0, hOff = V(0, 0.2, 0.52);
    if (m === 'dorme') { by = 0.135; hp = 0.5; hOff.set(0.05, -0.02, 0.62); close = 1; earD = 0.8; }
    if (m === 'senta') { by = 0.2; pitch = -0.62; hp += 0.5; }
    if (m === 'late') { const k = Math.max(0, Math.sin(t * 9)); jw = 0.75 * k; hp -= 0.25 + 0.12 * k; by += 0.012 * k; }
    if (m === 'anda') by += Math.sin(ph * 2) * 0.012;
    bodyG.position.set(0, by + breath * 0.3, -0.2); bodyG.rotation.set(pitch, 0, 0); belly.scale.y = 0.13 + breath;
    headG.position.copy(hOff); headG.rotation.set(hp - pitch * 0.85, hy, p.headRoll ?? 0);
    between(neck, V(0, 0.07, 0.42), V(hOff.x * 0.8, hOff.y - 0.03, hOff.z - 0.06)); collar.position.copy(neck.position); collar.quaternion.copy(neck.quaternion); collar.rotateX(Math.PI / 2); collar.scale.set(1, 1, 1);
    jaw.rotation.x = jw; tongue.visible = jw > 0.1 || !!p.lingua;
    ears.forEach(e => { e.g.rotation.set(-0.25 - earD * 0.5 + (p.alerta ? 0.3 : 0), 0, e.sx * (-0.35 - earD * 0.9 + (p.alerta ? 0.25 : 0))); });
    eyes.forEach(e => { e.e.scale.y = 0.019 * (1 - 0.88 * close); e.h.visible = close < 0.5; e.br.rotation.z = e.sx * (p.alerta ? -0.3 : 0.15); });
    bodyG.updateMatrixWorld(true);
    legs.forEach((l, i) => { const h = bodyG.localToWorld(V(l.sx * 0.085, -0.03, l.fr ? 0.4 : 0.0)); root.worldToLocal(h); hip.copy(h);
      let fz = h.z + (l.fr ? 0.01 : 0.02), fy = 0.03;
      if (m === 'dorme') { fz = l.fr ? h.z + 0.26 : h.z + 0.2; fy = 0.03; a.set(l.sx * (l.fr ? 0.1 : 0.17), fy, fz); }
      else if (m === 'senta' && !l.fr) { a.set(l.sx * 0.13, fy, h.z + 0.2); }
      else { if (m === 'anda') { const q = ph + ((l.fr ? 0 : 1) + (l.sx > 0 ? 0 : 1)) * Math.PI; fz += Math.sin(q) * (p.passo ?? 0.14); fy += Math.max(0, Math.cos(q)) * 0.07; } a.set(l.sx * 0.085, fy, fz); }
      const d = a.distanceTo(hip), mx = LL * 2 - 0.004; if (d > mx) a.lerpVectors(hip, a, mx / d);
      // joelho: dobra para trás nas da frente, para a frente nas de trás
      const dd = a.distanceTo(hip), mid = p0.lerpVectors(hip, a, 0.5), off = Math.sqrt(Math.max(0, LL * LL - dd * dd / 4)), bend = l.fr ? -1 : 1;
      l.q.k.set(mid.x, mid.y + (m === 'dorme' || (m === 'senta' && !l.fr) ? off * 0.8 : 0), mid.z + bend * off * (m === 'dorme' ? 0.3 : 1));
      between(l.up, l.q.k, hip); between(l.lo, a, l.q.k); l.kn.position.copy(l.q.k); l.kn.scale.setScalar(0.04); l.paw.position.copy(a); l.paw.scale.set(0.042, 0.03, 0.055); l.paw.position.z += 0.012; });
    // rabo
    const wag = (p.wag ?? 0) * Math.sin(t * 13) * 0.5; p0.copy(bodyG.localToWorld(V(0, 0.06, -0.1))); root.worldToLocal(p0);
    tail.forEach((s, i) => { const k = i + 1, up = m === 'dorme' ? -0.02 : 0.02 + 0.012 * k * (p.alerta ? 1.6 : 1); p1.set(p0.x + wag * 0.03 * k + (m === 'dorme' ? 0.05 : 0), p0.y + up, p0.z - (m === 'dorme' ? 0.03 : 0.055) + (m === 'dorme' ? 0.02 * k : 0)); between(s, p0, p1); p0.copy(p1); });
  }
  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  pose({});
  return { root, pose, headG };
}
