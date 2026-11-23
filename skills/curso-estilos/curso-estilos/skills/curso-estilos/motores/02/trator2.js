// Trator do Zé, reconstruído da arte conceito/trator.png: capô arredondado com faixa creme, grade de ripas, motor exposto,
// rodas traseiras altas de garra em V com aro creme, para-lamas em arco, banco de couro em concha, escapamento enferrujado.
// Frente em +z. Mesmas medidas do trator antigo (eixo traseiro em z -0,85; volante em 0, 1,86, -0,38) para os planos continuarem valendo.
import { THREE, mat, plain, mkTex, paint } from './kit3d.js';

export function criaTrator() {
  const root = new THREE.Group();
  const put = (k, x = 0, y = 0, z = 0, r, to = root) => { k.position.set(x, y, z); if (r) k.rotation.set(r[0] || 0, r[1] || 0, r[2] || 0); k.castShadow = k.receiveShadow = true; to.add(k); return k; };
  const add = (geo, m, x, y, z, r, to) => put(new THREE.Mesh(geo, m), x, y, z, r, to);
  const BX = (x, y, z) => new THREE.BoxGeometry(x, y, z), CY = (r1, r2, h, s = 20) => new THREE.CylinderGeometry(r1, r2, h, s);
  const rnd = (() => { let s = 31; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  // pintura velha: cor chapada + aço por baixo, ferrugem em manchas e lascas claras
  const tinta = (base, rust = 1) => mkTex(512, 512, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); paint(g, w, h, 'steel', base, 0.95, 0.2); g.globalAlpha = 0.5; g.fillStyle = base; g.fillRect(0, 0, w, h); g.globalAlpha = 1;
    for (let i = 0; i < 34 * rust; i++) { const x = rnd() * w, y = rnd() * h, q = 4 + rnd() * rnd() * 30, gr = g.createRadialGradient(x, y, 0, x, y, q); gr.addColorStop(0, 'rgba(120,58,26,0.85)'); gr.addColorStop(0.6, 'rgba(120,58,26,0.35)'); gr.addColorStop(1, 'rgba(120,58,26,0)'); g.fillStyle = gr; g.fillRect(x - q, y - q, q * 2, q * 2); }
    g.strokeStyle = 'rgba(255,255,255,0.14)'; g.lineWidth = 1; for (let i = 0; i < 40; i++) { const x = rnd() * w, y = rnd() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 70, y + (rnd() - 0.5) * 24); g.stroke(); } });
  const G = mat(0xffffff, { map: tinta('#4a8c46'), rough: 0.4, bump: 0.5, rim: 0.6, spec: 0.5 }), GS = mat(0xffffff, { map: tinta('#4a8c46'), rough: 0.4, bump: 0.5, rim: 0.6, spec: 0.5, side: THREE.DoubleSide });
  const CR = mat(0xffffff, { map: tinta('#ecdca8', 0.5), rough: 0.5, bump: 0.4, rim: 0.4, spec: 0.3 }), IRON = mat(0x303236, { metal: 0.55, rough: 0.55, rim: 0.3 }), IRON2 = mat(0x1d1e21, { metal: 0.4, rough: 0.7, rim: 0.2 });
  const RUB = mat(0x1e1e20, { rough: 0.86, rim: 0.25, grain: 0.4 }), LEA = mat(0xffffff, { map: plain('leather', '#8a4a28', 0.5, 0.3), rough: 0.48, bump: 1.4, spec: 0.4, side: THREE.DoubleSide });
  const RUST = mat(0xffffff, { map: tinta('#7c4428', 2), rough: 0.85, bump: 1.2, rim: 0.3 }), CHR = mat(0xdadcde, { metal: 1, rough: 0.18, rim: 0.2 }), GOLD = mat(0xd8a848, { metal: 0.9, rough: 0.3, rim: 0 });
  const LAMP = mat(0xff7a1c, { keep: 0.8, rough: 0.3, rim: 0 }), GLASS = mat(0xfff0c8, { keep: 0.9, rough: 0.2, rim: 0 });

  // ---------- capô e frente (seção arredondada extrudada ao longo de z)
  const rr = (w, y0, y1, rt, rb) => { const s = new THREE.Shape(), x = w / 2; s.moveTo(-x + rb, y0); s.lineTo(x - rb, y0); s.quadraticCurveTo(x, y0, x, y0 + rb); s.lineTo(x, y1 - rt); s.quadraticCurveTo(x, y1, x - rt, y1); s.lineTo(-x + rt, y1); s.quadraticCurveTo(-x, y1, -x, y1 - rt); s.lineTo(-x, y0 + rb); s.quadraticCurveTo(-x, y0, -x + rb, y0); return s; };
  const ext = (shape, d, bev = 0.05) => { const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelSize: bev, bevelThickness: bev, bevelSegments: 5, curveSegments: 10 }); return g; };
  add(ext(rr(0.8, 1.36, 1.7, 0.2, 0.03), 1.86), G, 0, 0, -0.2);                 // capô / tanque
  add(ext(rr(0.8, 0.8, 1.7, 0.2, 0.08), 0.42, 0.06), G, 0, 0, 1.32);            // casca da frente
  for (const sx of [-1, 1]) { add(BX(0.02, 0.075, 2.0), CR, sx * 0.452, 1.34, 0.78); add(BX(0.022, 0.014, 2.02), CHR, sx * 0.453, 1.385, 0.78); }
  add(BX(0.84, 0.075, 0.02), CR, 0, 1.34, 1.862); add(BX(0.86, 0.014, 0.022), CHR, 0, 1.385, 1.864);
  // grade de ripas creme
  const gradeT = mkTex(256, 256, (g, w, h) => { g.fillStyle = '#17181a'; g.fillRect(0, 0, w, h); g.fillStyle = '#ecdca8'; for (let i = 0; i < 9; i++) g.fillRect(14, 14 + i * 26, w - 28, 15); g.fillRect(w / 2 - 6, 8, 12, h - 16); g.strokeStyle = '#ecdca8'; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16); });
  add(BX(0.56, 0.5, 0.03), mat(0xffffff, { map: gradeT, rough: 0.5, bump: 3, rim: 0.2 }), 0, 1.06, 1.862);
  for (const sx of [-1, 1]) { add(CY(0.062, 0.062, 0.05, 20), CHR, sx * 0.3, 1.5, 1.86, [Math.PI / 2]); add(new THREE.SphereGeometry(0.05, 16, 10), GLASS, sx * 0.3, 1.5, 1.875).scale.z = 0.5; }
  add(CY(0.035, 0.035, 0.03, 14), IRON, 0, 1.76, 1.45); add(CY(0.03, 0.03, 0.03, 14), IRON, 0, 1.76, 0.1);   // tampas do radiador e do tanque
  // ---------- chassi, motor exposto, câmbio
  for (const sx of [-1, 1]) add(BX(0.09, 0.14, 2.5), IRON2, sx * 0.25, 0.72, 0.55);
  add(BX(0.44, 0.44, 1.2), IRON, 0, 1.0, 0.72); add(BX(0.34, 0.14, 1.0), IRON2, 0, 1.28, 0.72);
  for (const sx of [-1, 1]) { add(BX(0.06, 0.2, 0.9), IRON2, sx * 0.24, 1.12, 0.72);
    for (let i = 0; i < 4; i++) { add(CY(0.035, 0.035, 0.1, 10), IRON, sx * 0.27, 1.2, 0.36 + i * 0.24, [0, 0, Math.PI / 2]); add(new THREE.SphereGeometry(0.016, 8, 6), GOLD, sx * 0.325, 1.2, 0.36 + i * 0.24); }
    add(CY(0.07, 0.07, 0.22, 16), CHR, sx * 0.3, 0.98, 0.5); add(CY(0.075, 0.075, 0.03, 16), IRON2, sx * 0.3, 1.1, 0.5);
    add(BX(0.12, 0.16, 0.2), IRON, sx * 0.29, 0.95, 0.86); add(CY(0.05, 0.05, 0.16, 12), IRON2, sx * 0.3, 0.86, 1.1, [Math.PI / 2]);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(sx * 0.3, 1.2, 0.36), new THREE.Vector3(sx * 0.36, 1.08, 0.5), new THREE.Vector3(sx * 0.34, 0.92, 0.7), new THREE.Vector3(sx * 0.29, 0.98, 0.86)]), 16, 0.012, 6), GOLD); put(tube);
    add(BX(0.02, 0.5, 0.08), IRON2, sx * 0.25, 0.48, 1.5); }
  add(CY(0.15, 0.15, 0.05, 20), IRON2, 0, 0.98, 1.36, [Math.PI / 2]); add(CY(0.07, 0.07, 0.07, 14), CHR, 0, 0.98, 1.37, [Math.PI / 2]);
  add(BX(0.5, 0.52, 1.25), IRON, 0, 0.88, -0.55); add(BX(0.36, 0.3, 0.4), IRON2, 0, 0.9, -1.28); add(CY(0.1, 0.1, 1.75, 14), IRON2, 0, 0.9, -0.85, [0, 0, Math.PI / 2]);
  add(CY(0.09, 0.09, 0.12, 14), IRON, 0, 0.9, -1.5, [Math.PI / 2]); add(BX(0.5, 0.05, 0.08), IRON2, 0, 0.62, -1.5);
  add(BX(1.3, 0.1, 0.12), IRON2, 0, 0.47, 1.5); add(BX(0.16, 0.3, 0.2), IRON, 0, 0.6, 1.5);
  for (const sx of [-1, 1]) { add(BX(0.36, 0.035, 0.62), IRON2, sx * 0.44, 1.0, -0.25); for (let i = 0; i < 5; i++) add(BX(0.34, 0.012, 0.03), IRON, sx * 0.44, 1.024, -0.5 + i * 0.125); }
  // ---------- rodas: pneu torneado, garras em V, aro creme abaulado
  const roda = (R, wd, n, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); root.add(g); const sx = Math.sign(x), h = wd / 2, ri = R * 0.56;
    const tg = new THREE.LatheGeometry([[ri, -h], [R * 0.86, -h], [R * 0.95, -h * 0.8], [R, -h * 0.45], [R, h * 0.45], [R * 0.95, h * 0.8], [R * 0.86, h], [ri, h], [ri, -h]].map(p => new THREE.Vector2(p[0], p[1])), 40); tg.rotateZ(Math.PI / 2); add(tg, RUB, 0, 0, 0, null, g);
    for (let k = 0; k < n * 2; k++) { const a = k / (n * 2) * Math.PI * 2, s = k % 2 ? 1 : -1, lug = add(BX(h * 1.1, R * 0.1, R * 0.07), RUB, s * h * 0.45, Math.sin(a) * R * 1.0, Math.cos(a) * R * 1.0, null, g); lug.rotation.set(-a, 0, 0); lug.rotateZ(s * 0.55); }
    const dg = new THREE.LatheGeometry([[0, 0.5], [0.16, 0.5], [0.2, 0.32], [0.72, 0.18], [0.9, 0.42], [1.0, 0.5], [1.03, 0.36]].map(p => new THREE.Vector2(p[0] * ri, h * (p[1] - 0.05))), 36); dg.rotateZ(-sx * Math.PI / 2);
    add(dg, mat(0xffffff, { map: tinta('#ecdca8', 0.6), rough: 0.5, bump: 0.4, rim: 0.4, spec: 0.3, side: THREE.DoubleSide }), 0, 0, 0, null, g); add(CY(ri * 1.0, ri * 1.0, wd * 0.16, 28), IRON2, 0, 0, 0, [0, 0, Math.PI / 2], g);
    add(CY(ri * 0.2, ri * 0.24, h * 0.5, 16), IRON, sx * h * 0.62, 0, 0, [0, 0, Math.PI / 2], g); for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; add(CY(ri * 0.045, ri * 0.045, 0.03, 8), IRON2, sx * h * 0.42, Math.sin(a) * ri * 0.36, Math.cos(a) * ri * 0.36, [0, 0, Math.PI / 2], g); } return g; };
  for (const sx of [-1, 1]) { roda(0.9, 0.5, 15, sx * 0.95, 0.9, -0.85); roda(0.45, 0.26, 11, sx * 0.64, 0.45, 1.5);
    // para-lama: arco por cima da roda + parede interna + lanterna
    const F0 = 0.8, FL = 1.95, FR = 1.03; const fg = new THREE.CylinderGeometry(FR, FR, 0.58, 30, 1, true, F0, FL); fg.rotateZ(Math.PI / 2); add(fg, GS, sx * 0.94, 0.9, -0.85);
    const wg = new THREE.RingGeometry(0.42, FR, 30, 1, Math.PI - F0 - FL, FL); wg.rotateY(Math.PI / 2); add(wg, GS, sx * 0.65, 0.9, -0.85);
    for (const ox of [0.65, 1.23]) { const eg2 = new THREE.CylinderGeometry(FR + 0.012, FR + 0.012, 0.035, 30, 1, true, F0, FL); eg2.rotateZ(Math.PI / 2); add(eg2, GS, sx * ox, 0.9, -0.85); }
    const a = 2.45; add(CY(0.06, 0.06, 0.04, 16), LAMP, sx * 0.98, 0.9 + Math.sin(a) * 1.05, -0.85 + Math.cos(a) * 1.05, [Math.PI / 2 - a + Math.PI / 2]);  }
  // ---------- painel, chave, volante
  add(ext(rr(0.74, 1.3, 1.66, 0.18, 0.03), 0.1, 0.03), G, 0, 0, -0.33);
  const pn = add(BX(0.5, 0.2, 0.02), IRON2, 0, 1.52, -0.37); for (const [x, r] of [[0.02, 0.06], [0.17, 0.042]]) { add(CY(r, r, 0.016, 20), mat(0xf2ead6, { rim: 0, rough: 0.4 }), x, 1.53, -0.384, [Math.PI / 2]); add(new THREE.TorusGeometry(r, 0.007, 6, 20), CHR, x, 1.53, -0.392); add(BX(0.005, r * 0.8, 0.004), mat(0xc0392b, { rim: 0 }), x + 0.01, 1.54, -0.396, [0, 0, 0.6]); }
  const chave = new THREE.Group(); chave.position.set(-0.19, 1.5, -0.39); chave.rotation.x = -Math.PI / 2; chave.scale.setScalar(1.15); root.add(chave);
  add(BX(0.03, 0.06, 0.012), GOLD, 0, 0.02, 0, null, chave); add(new THREE.TorusGeometry(0.03, 0.006, 6, 14), GOLD, 0, 0.075, 0, null, chave); add(BX(0.03, 0.05, 0.004), mat(0xc0392b, { rim: 0 }), 0.02, 0.12, 0, null, chave); add(CY(0.026, 0.026, 0.012, 14), CHR, -0.19, 1.5, -0.384, [Math.PI / 2]);
  const col = add(CY(0.022, 0.022, 0.62, 10), IRON2, 0, 1.63, -0.225); col.rotation.x = -0.6;
  const vol = new THREE.Group(); vol.position.set(0, 1.86, -0.38); vol.rotation.x = Math.PI / 2 - 0.6; root.add(vol);
  add(new THREE.TorusGeometry(0.24, 0.022, 10, 36), IRON2, 0, 0, 0, null, vol); for (let k = 0; k < 3; k++) add(BX(0.46, 0.024, 0.016), IRON2, 0, 0, 0.02, [0, 0, k * Math.PI / 3 + 0.52], vol); add(CY(0.045, 0.05, 0.05, 14), IRON, 0, 0, 0.02, [Math.PI / 2], vol);
  // ---------- banco de couro em concha
  const sb = add(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), LEA, 0, 1.42, -0.88); sb.scale.set(0.3, 0.1, 0.27);
  add(new THREE.SphereGeometry(1, 24, 12), LEA, 0, 1.4, -0.88).scale.set(0.28, 0.035, 0.25);
  const eg = new THREE.CylinderGeometry(0.3, 0.3, 0.32, 24, 1, true, Math.PI - 1.0, 2.0); const enc = add(eg, LEA, 0, 1.55, -0.86); enc.scale.z = 0.9; enc.rotation.x = -0.14;
  add(new THREE.TorusGeometry(0.3, 0.02, 8, 24, 2.0), LEA, 0, 1.71, -0.84, [Math.PI / 2 - 0.14, 0, Math.PI + 0.57]).scale.y = 0.9;
  add(BX(0.06, 0.34, 0.06), IRON2, 0, 1.2, -1.0, [0.35]); add(BX(0.3, 0.03, 0.3), IRON2, 0, 1.33, -0.9);
  // ---------- escapamento enferrujado e filtro de ar
  add(CY(0.03, 0.03, 0.5, 12), RUST, -0.26, 1.9, 0.86); add(CY(0.065, 0.065, 0.46, 16), RUST, -0.26, 2.2, 0.86); add(CY(0.03, 0.03, 0.26, 12), RUST, -0.26, 2.55, 0.86);
  { const t = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.03, 8, 12, Math.PI / 2), RUST); put(t, -0.26, 2.68, 0.8, [0, Math.PI / 2, 0]); }
  add(CY(0.04, 0.04, 0.6, 12), IRON2, 0.2, 2.0, 1.2); add(CY(0.055, 0.05, 0.2, 14), IRON2, 0.2, 2.2, 1.2); add(CY(0.07, 0.04, 0.05, 14), IRON2, 0.2, 2.33, 1.2);
  return { root, volante: vol, chave };
}
