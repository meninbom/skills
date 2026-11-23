// Bloco 2 (10,0–24,6 s): corrida até o trator, cidade com fumaça, mão na chave, radar, banheira, água guardada.
import { criaTrator } from './trator2.js';
export function bloco2(C) {
  const { THREE, W, H, scene, farm, KX, add, BX, prism, M, L, T, ze, cao, setSun, dawn, sun, hemi, fill, TINT, U, tagBox, bigText, pop, RED, YEL, lerp, cl, ss, back, V3, rng, mkTex, paint, SHOTS, CAPS, HIDE, barn } = C;
  const B0 = 10.0, B1 = 12.6, B2 = 15.0, B3 = 16.8, B4 = 18.9, B5 = 22.8, B6 = 24.6;
  SHOTS[SHOTS.length - 1].b = B0; CAPS[CAPS.length - 1][1] = B0;
  CAPS.push([10.0, 11.3, 'MAS SÓ SE NÃO COMETER'], [11.3, 12.6, 'UM ERRO *BEM IDIOTA*'], [12.6, 13.9, 'O PRIMEIRO INSTINTO DO ZÉ'], [13.9, 15.0, 'É IR ATÉ A CIDADE'], [15.0, 16.0, 'VER O QUE TÁ ACONTECENDO'], [16.0, 16.8, '*NÃO VAI.*'],
    [16.8, 17.9, 'É EXATAMENTE PRA LÁ'], [17.9, 18.9, 'QUE *TODO MUNDO* TÁ INDO'], [18.9, 20.0, 'EM VEZ DISSO, O ZÉ TEM'], [20.0, 21.2, 'UNS _30 MINUTOS_'], [21.2, 22.8, 'ANTES DA ENERGIA FALHAR'], [22.8, 24.6, 'PRIMEIRO: _ÁGUA_']);
  const R = rng(91), dk = L(null, 0x26282c), gold = L(null, 0xd8a84a), warm = new THREE.MeshBasicMaterial({ color: 0xffc66e, fog: false });

  // ---------- celeiro no nível da casa: base de pedra, tábua vertical, telhado de quatro águas, portas com X, cúpula, silo
  barn.clear();
  { const o = { to: barn }, trim = M.white;
    add(BX(7.9, 0.45, 10.4), M.brick, 0, 0.22, 0, o); add(BX(7.5, 4.4, 10), M.redbarn, 0, 2.6, 0, o);
    // telhado gambrel: duas águas íngremes embaixo, duas suaves em cima
    for (const sx of [-1, 1]) { const a = add(BX(2.6, 0.14, 10.9), M.roof, sx * 3.05, 5.75, 0, o); a.rotation.z = -sx * 1.05; const b = add(BX(2.7, 0.14, 10.9), M.roof, sx * 1.22, 7.25, 0, o); b.rotation.z = -sx * 0.42;
      for (const z of [-5.48, 5.48]) { const f1 = add(BX(2.6, 0.2, 0.07), trim, sx * 3.05, 5.68, z, o); f1.rotation.z = -sx * 1.05; const f2 = add(BX(2.7, 0.2, 0.07), trim, sx * 1.22, 7.18, z, o); f2.rotation.z = -sx * 0.42; } }
    { const s = new THREE.Shape(); s.moveTo(-3.75, 0); s.lineTo(3.75, 0); s.lineTo(2.45, 2.25); s.lineTo(0, 3.05); s.lineTo(-2.45, 2.25); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: 10, bevelEnabled: false }); g.translate(0, 0, -5); add(g, M.redbarn, 0, 4.8, 0, o); }
    add(BX(0.3, 0.14, 11), dk, 0, 7.86, 0, o);
    for (const [x, z] of [[-3.75, -5], [3.75, -5], [-3.75, 5], [3.75, 5]]) add(BX(0.2, 4.4, 0.2), trim, x, 2.6, z, o); add(BX(7.6, 0.2, 0.12), trim, 0, 4.8, 5.03, o);
    const dt = mkTex(512, 512, (g, w, h) => { g.fillStyle = '#8f3024'; g.fillRect(0, 0, w, h); paint(g, w, h, 'redbarn', '#8f3024', 0.5, 0.04); g.strokeStyle = '#efe9da'; g.lineWidth = 26; g.strokeRect(13, 13, w - 26, h - 26); g.beginPath(); g.moveTo(13, 13); g.lineTo(w - 13, h - 13); g.moveTo(w - 13, 13); g.lineTo(13, h - 13); g.stroke(); }), dm = L(dt);
    add(BX(2.5, 3.5, 0.1), dm, -1.3, 2.2, 5.06, o); const d2 = add(BX(2.5, 3.5, 0.1), dm, 1.3, 2.2, 5.06, o); C.barnDoor = d2;
    add(BX(5.6, 0.16, 0.16), dk, 0, 4.05, 5.12, o); add(BX(1.5, 1.5, 0.1), dm, 0, 6.0, 5.06, o); add(BX(1.8, 0.14, 0.2), trim, 0, 6.85, 5.08, o);
    add(BX(5.0, 3.5, 0.06), new THREE.MeshBasicMaterial({ color: 0x0a0806 }), 0, 2.2, 4.98, { ...o, cast: false });
    add(BX(0.2, 0.3, 0.2), dk, 0, 4.35, 5.25, o); add(BX(0.13, 0.18, 0.13), warm, 0, 4.3, 5.27, { ...o, cast: false });
    add(BX(1.1, 0.9, 1.1), M.redbarn, 0, 8.3, 0, o); const cu = add(new THREE.ConeGeometry(1.0, 0.8, 4), M.roof, 0, 9.15, 0, o); cu.rotation.y = Math.PI / 4; add(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6), dk, 0, 9.9, 0, o); add(BX(0.6, 0.04, 0.04), dk, 0, 10.2, 0, o);
    for (const z of [-2.5, 0, 2.5]) for (const sx of [-1, 1]) { add(BX(0.08, 1.0, 0.9), trim, sx * 3.78, 3.0, z, o); add(BX(0.1, 0.85, 0.75), L(null, 0x1c2630), sx * 3.79, 3.0, z, { ...o, cast: false }); }
    // silo
    add(new THREE.CylinderGeometry(1.5, 1.5, 7.5, 24), M.steel, -5.6, 3.75, -2.5, o); const dome = add(new THREE.SphereGeometry(1.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.roof, -5.6, 7.5, -2.5, o); for (let i = 1; i < 5; i++) add(new THREE.TorusGeometry(1.52, 0.03, 6, 28), dk, -5.6, i * 1.5, -2.5, { ...o, rx: Math.PI / 2 });
    // fardos de feno e carrinho de mão
    const hay = L(T('dirt', '#c8a048', 0.7, 1, 1)); for (const [x, y, z] of [[4.6, 0.4, 3.6], [5.5, 0.4, 3.4], [5.0, 1.15, 3.5]]) add(BX(0.85, 0.75, 1.3), hay, x, y, z, o); }

  // ---------- trator
  const trator = new THREE.Group(); farm.add(trator); trator.position.set(8.2, 0, 2.2); trator.rotation.y = 2.5;
  { const T2 = criaTrator(); trator.add(T2.root); C.volante = T2.volante; C.chave = T2.chave; }

  // ---------- cidade ao longe com fumaça
  const town = new THREE.Group(); town.position.set(6, 0, 165); farm.add(town); const SM = [];
  { const bm = new THREE.MeshLambertMaterial({ color: 0x2c3444 }), wm = new THREE.MeshBasicMaterial({ color: 0xffb060, fog: true }); const o = { to: town, cast: false, recv: false };
    for (let i = 0; i < 34; i++) { const w = 4 + R() * 6, h = 5 + R() * R() * 22, x = -60 + i * 3.6 + R() * 2, z = R() * 14; add(BX(w, h, 5), bm, x, h / 2, z, o); if (R() < 0.6) for (let k = 0; k < 3; k++) add(BX(0.5, 0.7, 0.1), wm, x + (R() - 0.5) * w * 0.7, 1.5 + R() * (h - 2.5), z - 2.6, o); }
    add(new THREE.ConeGeometry(1.6, 9, 4), bm, -14, 22, 3, o); add(BX(3, 18, 3), bm, -14, 9, 3, o); add(new THREE.CylinderGeometry(3, 3, 3.5, 12), bm, 26, 17, 5, o); add(BX(0.5, 16, 0.5), bm, 24, 8, 5, o); add(BX(0.5, 16, 0.5), bm, 28, 8, 5, o);
    for (const [x, n] of [[-30, 16], [4, 20], [34, 14]]) for (let i = 0; i < n; i++) { const m = add(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color: 0x14100e, transparent: true, opacity: 0.8, depthWrite: false, fog: false }), x, 10, 4, o); SM.push({ m, x, i, n }); }
    for (const x of [-30, 4, 34]) { const gl = add(new THREE.SphereGeometry(5, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff6a20, transparent: true, opacity: 0.55, depthWrite: false, fog: false }), x, 7, 2, o); } }
  const townTick = t => { for (const s of SM) { const k = ((t * 0.07 + s.i / s.n) % 1); s.m.position.set(s.x + k * k * 26 + Math.sin(k * 7 + s.i) * 1.5, 9 + k * 46, 4); s.m.scale.setScalar(2.2 + k * 9); s.m.material.opacity = 0.85 * (1 - k * 0.75); } };

  // ---------- banheiro (palco à parte)
  const BXo = KX + 60, bath = new THREE.Group(); bath.position.set(BXo, 0, 0); scene.add(bath); HIDE.push(() => { bath.visible = false; });
  const tile = (a, b, n) => { const t = mkTex(512, 512, (g, w, h) => { g.fillStyle = a; g.fillRect(0, 0, w, h); const q = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? a : b; g.fillRect(i * q + 3, j * q + 3, q - 6, q - 6); const gr = g.createLinearGradient(i * q, j * q, i * q + q, j * q + q); gr.addColorStop(0, 'rgba(255,255,255,0.14)'); gr.addColorStop(1, 'rgba(0,0,0,0.12)'); g.fillStyle = gr; g.fillRect(i * q + 3, j * q + 3, q - 6, q - 6); } }); return t; };
  const wallT = tile('#3f6f72', '#4a7c7e', 6), floorT = tile('#c8bfa8', '#5a4a3c', 4); wallT.repeat.set(2.5, 1.2); floorT.repeat.set(3, 3);
  const water = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.02, 0.72), new THREE.MeshLambertMaterial({ color: 0x4f9fd0, emissive: 0x143a5a, transparent: true, opacity: 0.86 })), stream = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 1, 8), new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.8 }));
  const JUGS = [], enamel = L(null, 0xf2efe6), chrome = L(null, 0xb8c0c8);
  { const o = { to: bath }; add(BX(8, 0.2, 8), L(floorT), 0, -0.1, 0, o); add(BX(8, 4, 0.2), L(wallT), 0, 2, -2.2, { ...o, cast: false }); add(BX(0.2, 4, 8), L(wallT), -2.9, 2, 0, { ...o, cast: false }); add(BX(8, 1.2, 0.06), L(null, 0xe6dcc2), 0, 0.6, -2.08, o); add(BX(8, 0.07, 0.1), M.woodD, 0, 1.22, -2.06, o);
    add(BX(1.3, 1.1, 0.06), new THREE.MeshBasicMaterial({ color: 0xffe2a8, fog: false }), -0.6, 2.5, -2.07, { ...o, cast: false }); add(BX(1.5, 0.1, 0.14), M.white, -0.6, 3.1, -2.04, o); add(BX(1.5, 0.1, 0.18), M.white, -0.6, 1.9, -2.03, o); add(BX(0.08, 1.2, 0.12), M.white, -0.6, 2.5, -2.04, o); for (const x of [-1.3, 0.1]) add(BX(0.09, 1.3, 0.12), M.white, x, 2.5, -2.04, o);
    // banheira de pés, torneira, água e jato
    { const pts = [[0.02, 0], [0.3, 0.01], [0.41, 0.09], [0.46, 0.3], [0.5, 0.56], [0.54, 0.62], [0.56, 0.6]].map(([x, y]) => new THREE.Vector2(x, y)); const tub = add(new THREE.LatheGeometry(pts, 36), new THREE.MeshLambertMaterial({ color: 0xf2efe6, side: THREE.DoubleSide }), 0, 0.26, -1.3, o); tub.scale.set(2.05, 1, 0.92); const rim = add(new THREE.TorusGeometry(0.55, 0.035, 8, 40), enamel, 0, 0.87, -1.3, { ...o, rx: Math.PI / 2 }); rim.scale.set(2.05, 0.92, 1); } for (const [x, z] of [[-0.62, -1.56], [0.62, -1.56], [-0.62, -1.04], [0.62, -1.04]]) { add(new THREE.SphereGeometry(0.075, 10, 8), gold, x, 0.08, z, o); add(new THREE.CylinderGeometry(0.035, 0.05, 0.2, 8), gold, x, 0.2, z, o); }
    water.geometry = new THREE.CylinderGeometry(0.47, 0.47, 0.02, 36); water.scale.set(2.05, 1, 0.92); water.position.set(0, 0.4, -1.3); bath.add(water);
    add(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), chrome, 0.75, 1.15, -1.72, o); add(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8), chrome, 0.75, 1.38, -1.58, { ...o, rx: Math.PI / 2 }); for (const sx of [-1, 1]) add(new THREE.SphereGeometry(0.05, 8, 6), chrome, 0.75 + sx * 0.13, 1.2, -1.72, o); stream.position.set(0.75, 0.9, -1.44); bath.add(stream);
    // pia, espelho, toalha, tapete
    add(BX(0.8, 0.14, 0.5), enamel, 1.9, 0.95, -1.85, o); add(new THREE.CylinderGeometry(0.07, 0.09, 0.9, 10), enamel, 1.9, 0.45, -1.85, o); add(BX(0.7, 0.9, 0.05), L(null, 0x9fb8c0), 1.9, 2.0, -2.07, { ...o, cast: false }); add(BX(0.8, 1.0, 0.04), M.woodD, 1.9, 2.0, -2.09, o);
    add(BX(0.06, 0.9, 0.5), L(T('crimson', '#b0483a', 0.5, 1, 1)), -2.76, 1.5, -0.6, o); add(BX(1.3, 0.03, 0.8), L(T('crimson', '#8a4a3a', 0.5, 1, 1)), 0.1, 0.02, -0.2, o);
    // galões azuis de 20 L, baldes e garrafas (plano da água guardada)
    const blue = new THREE.MeshLambertMaterial({ color: 0x3a8fd0, emissive: 0x0c2a44, transparent: true, opacity: 0.92 }), cap = L(null, 0x1f4f8a), bk = L(null, 0x8a9098);
    for (let i = 0; i < 8; i++) { const g = new THREE.Group(); g.position.set(-1.9 + (i % 4) * 0.52 + (i > 3 ? 0.26 : 0), 0, 0.7 + (i > 3 ? 0.5 : 0)); bath.add(g); add(new THREE.CylinderGeometry(0.2, 0.2, 0.42, 16), blue, 0, 0.21, 0, { to: g }); add(new THREE.SphereGeometry(0.2, 16, 8, 0, 6.283, 0, 1.57), blue, 0, 0.42, 0, { to: g }); add(new THREE.CylinderGeometry(0.06, 0.07, 0.12, 10), cap, 0, 0.63, 0, { to: g }); for (const y of [0.14, 0.28]) add(new THREE.TorusGeometry(0.203, 0.012, 6, 18), cap, 0, y, 0, { to: g, rx: Math.PI / 2 }); JUGS.push(g); }
    for (let i = 0; i < 3; i++) { const g = new THREE.Group(); g.position.set(0.9 + i * 0.5, 0, 0.9); bath.add(g); add(new THREE.CylinderGeometry(0.2, 0.15, 0.32, 14, 1, true), bk, 0, 0.16, 0, { to: g }); add(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 14), blue, 0, 0.26, 0, { to: g }); add(new THREE.TorusGeometry(0.2, 0.01, 5, 14, Math.PI), dk, 0, 0.32, 0, { to: g }); JUGS.push(g); } }

  const hud = (c, t, f) => f(c, t);
  const timerChip = (c, t0, t) => { const left = Math.max(0, 1800 - 9 - (t - t0) * 52), mm = String(Math.floor(left / 60)).padStart(2, '0'), s2 = String(Math.floor(left % 60)).padStart(2, '0'); c.save(); c.translate(70, 250); c.fillStyle = 'rgba(18,14,10,0.9)'; c.strokeStyle = '#d8a84a'; c.lineWidth = 4; c.beginPath(); c.roundRect(0, 0, 300, 96, 12); c.fill(); c.stroke();
    c.strokeStyle = '#f2d79a'; c.lineWidth = 5; c.beginPath(); c.arc(52, 50, 24, 0, 7); c.stroke(); c.beginPath(); c.moveTo(52, 50); c.lineTo(52, 32); c.moveTo(52, 50); c.lineTo(52 + 14 * Math.cos(t * 6), 50 + 14 * Math.sin(t * 6)); c.stroke(); c.fillStyle = '#f2d79a'; c.font = '700 60px RC'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(`${mm}:${s2}`, 96, 52); c.restore(); };
  const interior = (x) => { setSun(x, 1, 0, -3.2, 3.6, -7, 9, 40); sun.color.set(0xffb070); sun.intensity = 6; hemi.color.set(0x6a86b8); hemi.groundColor.set(0x2a1c12); hemi.intensity = 0.7; fill.position.set(x + 1.6, 2.2, 2.4); fill.intensity = 3; scene.fog.color.set(0x2a2018); TINT.set(0.9, 0.8, 0.72); };

  SHOTS.push(
    // corrida lateral até o trator, cão na frente
    { a: B0, b: B1, sunXY: [80, 760], rays: [80, 760, 0.07], capim: 0.75, fog: [26, 150], run(t) { const u = (t - B0) / (B1 - B0); farm.visible = true; dawn(); TINT.set(1, 0.96, 0.9); const d = [0.78, -0.63], n = [0.63, 0.78], s = 0.2 + u * 5.6; let px = 1.8 + d[0] * s, pz = 7.2 + d[1] * s; const ph = (s / 2.1) % 1, sw = Math.sin(ph * 6.283);
        ze.root.visible = true; ze.root.position.set(px, 0, pz); ze.root.rotation.y = Math.atan2(d[0], d[1]); if (C.MV.corre) { ze.root.position.set(1.8 + d[0] * 0.2, 0, 7.2 + d[1] * 0.2); C.toca(ze, 'corre', (0.3 + C.rt(B0)) * (C.Z4 ? 1.3 : 1), { local: false, exag: C.Z4 ? 1.1 : undefined }); const zl = ze.bones[0].position.z; px = ze.root.position.x + d[0] * zl; pz = ze.root.position.z + d[1] * zl; } else ze.pose({ t, walk: ph, w: 1, stride: 1.05, hipY: 0.8, lean: 0.26, head: [-0.12, 0, 0], brow: 0.3, armL: [0.05, -0.2, 0.1 - sw * 0.14, 0.03, -0.14, 0.3 - sw * 0.2], armR: [-0.05, -0.2, 0.1 + sw * 0.14, -0.03, -0.14, 0.3 + sw * 0.2] });
        cao.root.visible = true; cao.root.position.set(px + d[0] * 1.5 + n[0] * 0.5, 0, pz + d[1] * 1.5 + n[1] * 0.5); cao.root.rotation.y = ze.root.rotation.y; cao.pose({ modo: 'anda', t, fase: (s / 0.7) % 1, passo: 0.2, alerta: true, lingua: true, wag: 0.6 });
        const av = C.Z4 ? 0.35 : 0.9; return { cam: [[px + n[0] * 6.2 + d[0] * av, 1.15, pz + n[1] * 6.2 + d[1] * av], [px + d[0] * av, 1.05, pz + d[1] * av]], foco: [4.6, 60], bl: [2, 5] }; } },
    // a cidade ao longe, fumaça preta subindo
    { a: B1, b: B2, sky: ['#27344f', '#b8604a', '#f0a45c'], sunXY: [-200, 900], capim: 0.9, fog: [40, 330], vig: 0.8, run(t) { const u = (t - B1) / (B2 - B1); farm.visible = true; dawn(); townTick(t); scene.fog.color.set(0xc87a50);
        return { cam: [[2.2 - 0.3 * u, 2.3, 33 + 4 * u], [5, 12, 165]], foco: [8, 400], bl: [0, 4] }; } },
    // mão na chave do trator: o quase erro
    { a: B2, b: B3, sunXY: [760, 640], rays: [760, 640, 0.08], fog: [20, 120], vig: 0.6, base: 0.5, topo: 0.4, run(t) { const u = (t - B2) / (B3 - B2); farm.visible = true; dawn(); TINT.set(1, 0.95, 0.88); const g = ss((t - B2) / 0.6), stop = ss((t - B2 - 1.0) / 0.3);
        ze.root.visible = true; trator.updateMatrixWorld(true); const seat = trator.localToWorld(V3(0, 0.82, -0.86)); ze.root.position.copy(seat); ze.root.rotation.y = trator.rotation.y;
        C.toca(ze, 'trator', 0.5 + C.rt(B2), { dy: 0.2 }) || ze.pose({ t, hipY: 0.565, footL: [0.12, 0.34], footR: [0.12, 0.34], lean: 0.24, head: [0.3 - 0.34 * stop, -0.55 * stop, 0], brow: -0.25 * stop, browY: 0.004 * stop, look: [lerp(0.4, -0.5, stop), lerp(-0.7, 0.2, stop)], armL: [0.08, -0.16, 0.16, -0.02, -0.12, 0.38], armR: [-0.08, -0.22, 0.22, lerp(-0.02, -0.03, g), lerp(-0.24, -0.16, g), lerp(0.3, 0.5, g)], mouth: stop > 0.5 ? 'o' : '' });
        const k = trator.localToWorld(V3(-4.3, 2.0, 3.5)), tg = trator.localToWorld(V3(0.05, 1.72, 0.2)); const fl = trator.localToWorld(V3(-0.9, 2.2, 0.6)); fill.position.copy(fl); fill.intensity = 2.5; U.rimCol.value.set(0xffc070);
        return { cam: [[lerp(k.x, tg.x, 0.1 * u), k.y, lerp(k.z, tg.z, 0.1 * u)], [tg.x, tg.y, tg.z]], foco: [3.4, 9], bl: [3, 5] }; } },
    // radar: todo mundo converge para a cidade
    { a: B3, b: B4, run(t) { return { flat(c) { const u = (t - B3) / (B4 - B3); c.fillStyle = '#0c1014'; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(216,168,74,0.12)'; c.lineWidth = 2; for (let i = 0; i < 20; i++) { c.beginPath(); c.moveTo(i * 60, 0); c.lineTo(i * 60, H); c.stroke(); } for (let i = 0; i < 34; i++) { c.beginPath(); c.moveTo(0, i * 60); c.lineTo(W, i * 60); c.stroke(); }
          const cx = W / 2 + 40, cy = 760; for (let k = 1; k < 5; k++) { c.strokeStyle = `rgba(216,168,74,${0.22 - k * 0.03})`; c.beginPath(); c.arc(cx, cy, k * 190, 0, 7); c.stroke(); }
          const r = rng(5); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + 0.3, len = 1200; c.strokeStyle = 'rgba(226,54,43,0.35)'; c.lineWidth = 10; c.beginPath(); c.moveTo(cx + Math.cos(a) * 130, cy + Math.sin(a) * 130); c.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len); c.stroke();
            for (let j = 0; j < 9; j++) { const k = ((j / 9 + t * 0.22 + r()) % 1), d = len - k * (len - 130); c.fillStyle = `rgba(255,${90 + 60 * k | 0},70,${0.4 + 0.6 * k})`; c.beginPath(); c.arc(cx + Math.cos(a) * d + Math.sin(a) * (r() - 0.5) * 30, cy + Math.sin(a) * d, 7 + 5 * k, 0, 7); c.fill(); } }
          const gl = c.createRadialGradient(cx, cy, 0, cx, cy, 240); gl.addColorStop(0, 'rgba(226,54,43,0.75)'); gl.addColorStop(1, 'rgba(226,54,43,0)'); c.fillStyle = gl; c.fillRect(cx - 240, cy - 240, 480, 480); for (let i = 0; i < 90; i++) { const a = r() * 6.283, d = Math.sqrt(r()) * 120; c.fillStyle = r() < 0.5 ? '#ff6a50' : '#ffd0c0'; c.beginPath(); c.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 2 + r() * 3, 0, 7); c.fill(); }
          tagBox(c, 'CIDADE', cx, cy - 190, pop(t, B3 + 0.15), { size: 50 });
          const fx = 250, fy = 1420, p = 0.5 + 0.5 * Math.sin(t * 6); c.strokeStyle = `rgba(110,220,120,${0.7 - 0.5 * p})`; c.lineWidth = 6; c.beginPath(); c.arc(fx, fy, 26 + 40 * p, 0, 7); c.stroke(); c.fillStyle = '#6edc78'; c.beginPath(); c.arc(fx, fy, 18, 0, 7); c.fill(); tagBox(c, 'SÍTIO DO ZÉ', fx + 30, fy + 96, pop(t, B3 + 0.5), { bg: 'rgba(18,14,10,0.9)', fg: '#9ff0a6', size: 40, stroke: '#6edc78' });
          const v = c.createRadialGradient(W / 2, H / 2, 400, W / 2, H / 2, 1200); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.75)'); c.fillStyle = v; c.fillRect(0, 0, W, H); }, capY: 0.56 }; } },
    // enchendo a banheira, cronômetro descendo
    { a: B4, b: B5, sky: ['#ffe2a8', '#ffe2a8', '#ffe2a8'], vig: 0.8, rays: [280, 560, 0.075], base: 0.75, topo: 0.6, run(t) { const u = (t - B4) / (B5 - B4); bath.visible = true; interior(BXo); water.position.y = 0.4 + 0.4 * u; stream.visible = true; stream.scale.y = Math.max(0.05, 1.3 - (0.4 + 0.4 * u)); stream.position.y = (1.3 + water.position.y) / 2 - 0.0; JUGS.forEach(j => j.visible = false);
        ze.root.visible = true; ze.root.position.set(BXo + 0.15, 0, -0.52); ze.root.rotation.y = Math.PI - 0.15; (C.Z4 && C.toca(ze, 'banheira', C.G3.vaivem(C.MV.banheira, C.rt(B4), 1.2, 4.8))) || ze.pose({ t, hipY: 0.74, footL: [0, 0.12], footR: [0, -0.16], lean: 0.5, head: [0.12, -0.75 + 0.1 * Math.sin(t * 1.3), 0], look: [-0.5, -0.5], armL: [0.06, -0.24, 0.2, 0.05, -0.36, 0.44], armR: [-0.06, -0.24, 0.2, -0.05, -0.36, 0.44], brow: 0.15 });
        return { cam: [[BXo + 3.1 - 0.25 * u, 1.3, 0.25 - 0.1 * u], [BXo + 0.25, 0.98, -1.0]], foco: [1.9, 4.2], bl: [3, 6], hud(c) { timerChip(c, B4, t); } }; } },
    // água guardada: galões enfileirados e o contador subindo
    { a: B5, b: B6, sky: ['#ffe2a8', '#ffe2a8', '#ffe2a8'], vig: 0.8, rays: [200, 520, 0.06], base: 0.7, topo: 0.6, run(t) { const u = (t - B5) / (B6 - B5); bath.visible = true; interior(BXo); water.position.y = 0.8; stream.visible = false; JUGS.forEach((j, i) => { j.visible = t > B5 + i * 0.1; j.scale.setScalar(back((t - B5 - i * 0.1) / 0.25)); });
        const lit = Math.round(lerp(110, 280, ss(u * 1.25)));
        return { cam: [[BXo + 0.4 + 0.5 * u, 1.05, 3.5 - 0.2 * u], [BXo - 0.3, 0.4, 0.6]], foco: [1.4, 5], bl: [3, 5],
          hud(c) { const k = pop(t, B5 + 0.1); if (k <= 0) return; c.save(); c.translate(W / 2, 430); c.scale(k, k); c.fillStyle = 'rgba(18,14,10,0.92)'; c.strokeStyle = '#d8a84a'; c.lineWidth = 5; c.beginPath(); c.roundRect(-330, -120, 660, 240, 16); c.fill(); c.stroke(); c.fillStyle = '#d8a84a'; c.font = '700 40px RC'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ÁGUA GUARDADA', 40, -66);
            c.fillStyle = '#5fb4e8'; c.beginPath(); c.moveTo(-230, -40); c.bezierCurveTo(-170, 30, -180, 84, -230, 84); c.bezierCurveTo(-280, 84, -290, 30, -230, -40); c.fill(); c.fillStyle = '#f2ead6'; c.font = '700 130px RC'; c.textAlign = 'right'; c.fillText(String(lit), 130, 30); c.fillStyle = '#5fb4e8'; c.font = '700 70px RC'; c.textAlign = 'left'; c.fillText('L', 150, 44); c.restore(); } }; } },
  );
  C.trator = trator; C.town = town; C.townTick = townTick; C.END = B6;
}
