// Bloco 4 (36,0–48,6 s): galinhas, vacas, cavalo, o caramelo latindo, "quase impossível", porteira e cadeado.
import { criaGalinha, criaVaca, criaCavalo, criaPassaro } from './bichos.js';
export function bloco4(C) {
  const { THREE, W, H, farm, add, BX, M, L, T, ze, cao, dawn, fill, TINT, U, tagBox, bigText, pop, proj, RED, YEL, lerp, cl, ss, back, V3, rng, SHOTS, CAPS, HIDE, FENCE } = C;
  const D0 = 36.0, D1 = 37.6, D2 = 38.9, D3 = 40.0, D4 = 42.9, D5 = 45.9, D6 = 47.3, D7 = 48.6;
  CAPS.push([36.0, 36.9, 'E O ZÉ NÃO É O ÚNICO'], [36.9, 37.6, 'QUE MORA ALI'], [37.6, 38.9, 'DOZE VACAS'], [38.9, 40.0, 'UM CAVALO'], [40.0, 41.2, 'E UM CARAMELO QUE LATE'], [41.2, 42.9, 'PRA *ABSOLUTAMENTE TUDO*'],
    [42.9, 44.0, 'OU SEJA: MANTER O SÍTIO'], [44.0, 44.9, 'EM _SILÊNCIO_ VAI SER...'], [45.9, 47.3, 'ENTÃO ELE TRANCA'], [47.3, 48.6, 'A PORTEIRA']);
  const R = rng(211), dk = L(null, 0x26282c), gold = L(null, 0xd8a84a);
  // ---------- bichos no sítio
  const zoo = new THREE.Group(); farm.add(zoo); HIDE.push(() => { zoo.visible = false; });
  const GAL = Array.from({ length: 11 }, (_, i) => { const g = criaGalinha({ cor: [0xf2ead8, 0xb8703a, 0xe8d8b8, 0x8a4a2a][i % 4], seed: 3 + i }); g.root.position.set(9.4 + (i % 4) * 0.75 + R() * 0.4, 0, -1.2 + Math.floor(i / 4) * 0.85 + R() * 0.4); g.root.rotation.y = R() * 6.28; if (i === 1) { g.root.position.set(10.0, 0, 0.6); g.root.rotation.y = 0.6; g.root.scale.setScalar(1.25); } zoo.add(g.root); return g; });
  // poleiro e cocho atrás das galinhas
  { const o = { to: zoo }; add(BX(2.2, 1.3, 1.2), M.plank, 12.6, 0.95, 0.9, { ...o, ry: -0.5 }); add(BX(2.5, 0.1, 1.5), M.roof, 12.6, 1.68, 0.9, { ...o, ry: -0.5, rx: 0.12 }); for (const [x, z] of [[11.9, 0.2], [13.3, 1.6], [12.0, 1.5], [13.2, 0.3]]) add(BX(0.1, 0.5, 0.1), M.woodD, x, 0.25, z, o); add(BX(0.5, 0.6, 0.06), L(null, 0x0c0a08), 12.25, 0.75, 0.38, { ...o, ry: -0.5, cast: false }); add(BX(1.2, 0.14, 0.3), M.wood, 9.6, 0.1, 1.4, { ...o, ry: 0.3 }); }
  const VAC = Array.from({ length: 6 }, (_, i) => { const v = criaVaca({ seed: 11 + i * 3, cor: i % 3 === 2 ? '#7a4a2a' : '#2a2420' }); v.root.position.set(-15 + (i % 3) * 3.4 + R() * 1.2, 0, 10.5 + Math.floor(i / 3) * 4 + R() * 1.5); v.root.rotation.y = 0.4 + R() * 1.6; zoo.add(v.root); return v; });
  const cavalo = criaCavalo(); cavalo.root.position.set(22.6, 0, 1.5); cavalo.root.rotation.y = 0.75; zoo.add(cavalo.root);
  const piu = criaPassaro(); zoo.add(piu.root);
  // ---------- porteira com dobradiça, travessa em X, corrente e cadeado
  const gate = new THREE.Group(); gate.position.set(-1.6, 0, FENCE.z1); farm.add(gate); const lock = new THREE.Group();
  { const o = { to: gate }; for (const y of [0.3, 0.72, 1.14]) add(BX(4.0, 0.1, 0.07), M.wood, 2.0, y, 0, o); for (const x of [0.06, 2.0, 3.94]) add(BX(0.11, 1.05, 0.09), M.woodD, x, 0.72, 0, o); const d = add(BX(2.25, 0.09, 0.06), M.woodD, 1.02, 0.72, 0.02, o); d.rotation.z = 0.42; const d2 = add(BX(2.25, 0.09, 0.06), M.woodD, 2.98, 0.72, 0.02, o); d2.rotation.z = -0.42;
    for (const y of [0.35, 1.05]) add(BX(0.2, 0.06, 0.04), dk, 0.02, y, 0.05, o);
    for (const x of [-1.6, 2.4]) { add(BX(0.24, 1.7, 0.24), M.woodD, x, 0.85, FENCE.z1, { to: farm }); add(BX(0.3, 0.08, 0.3), M.wood, x, 1.72, FENCE.z1, { to: farm }); }
    // corrente (elos alternados) e cadeado no mourão da direita
    lock.position.set(2.3, 0.95, FENCE.z1); farm.add(lock); const ch = C.mat(0x6a7078, { metal: 0.7, spec: 0.5, grain: 0.2, rim: 0.3 }); for (let i = 0; i < 15; i++) { const s = i / 14, m = add(new THREE.TorusGeometry(0.03, 0.009, 6, 14), ch, -0.26 + 0.52 * s, 0.1 - 0.2 * Math.sin(Math.PI * s), -0.15, { to: lock }); m.scale.x = 1.35; m.rotation.set(i % 2 ? Math.PI / 2 : 0, 0, -Math.cos(Math.PI * s) * 0.55); }
    const pad = new THREE.Group(); pad.position.set(0, -0.2, -0.15); pad.rotation.y = Math.PI; lock.add(pad); add(BX(0.13, 0.11, 0.05), C.mat(0xd8a84a, { metal: 0.7, spec: 0.6, grain: 0.12 }), 0, 0, 0, { to: pad }); pad.scale.setScalar(1.25); const shk = add(new THREE.TorusGeometry(0.04, 0.012, 6, 14, Math.PI), ch, 0, 0.06, 0, { to: pad }); add(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 8), dk, 0, -0.01, 0.027, { to: pad, rx: Math.PI / 2 }); C.pad = pad; C.shk = shk; }

  const cards = (c, t, list) => { let y = 250; for (const [t0, n, lb] of list) { const k = pop(t, t0); if (k <= 0) continue; c.save(); c.translate(70 + 190 * (k - 1), y); c.globalAlpha = cl(k); c.fillStyle = 'rgba(18,14,10,0.92)'; c.strokeStyle = '#d8a84a'; c.lineWidth = 4; c.beginPath(); c.roundRect(0, 0, 400, 104, 12); c.fill(); c.stroke();
      c.fillStyle = '#f2ead6'; c.font = '700 78px RC'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(n, 24, 56); const wn = c.measureText(n).width; c.fillStyle = '#d8a84a'; c.font = '700 36px RC'; c.fillText(lb, 44 + wn, 60); c.restore(); y += 120; } };
  const anim = t => { GAL.forEach((g, i) => g.pose({ t, fase: i * 1.7, vel: 4 + (i % 3) })); VAC.forEach((v, i) => v.pose({ t, fase: i * 2.1, pasta: i % 4 === 3 ? 0 : 1 })); cavalo.pose({ t }); };
  const LIST = [[D0 + 0.35, '30', 'GALINHAS'], [D1 + 0.3, '12', 'VACAS'], [D2 + 0.3, '1', 'CAVALO']];
  const SPOT = [[10.6, 0.4, 0, 'GALINHAS'], [-11.5, 0.8, 12.5, 'VACAS'], [22.6, 1.2, 1.5, 'CAVALO'], [2.4, 0.4, 7.2, 'CARAMELO']];

  SHOTS.push(
    { a: D0, b: D1, sunXY: [160, 760], rays: [120, 700, 0.08], fog: [16, 120], vig: 0.6, base: 0.5, topo: 0.4, run(t) { const u = (t - D0) / (D1 - D0); farm.visible = zoo.visible = true; dawn(); TINT.set(1, 0.96, 0.9); anim(t);
        return { cam: [[11.5 - 0.2 * u, 0.62, 3.0 - 0.25 * u], [10.1, 0.36, 0.2]], foco: [0.5, 6], bl: [3.5, 0], hud(c) { cards(c, t, LIST); } }; } },
    { a: D1, b: D2, sunXY: [900, 700], rays: [1000, 620, 0.06], capim: 0.3, fog: [24, 150], run(t) { const u = (t - D1) / (D2 - D1); farm.visible = zoo.visible = true; dawn(); TINT.set(1, 0.96, 0.9); anim(t);
        return { cam: [[-6.5 + 0.5 * u, 1.25, 20.5 - 0.6 * u], [-12.5, 1.0, 12.5]], foco: [4.5, 60], bl: [2, 5], hud(c) { cards(c, t, LIST); } }; } },
    { a: D2, b: D3, sunXY: [540, 800], rays: [540, 800, 0.1], capim: 0.25, fog: [20, 140], vig: 0.6, run(t) { const u = (t - D2) / (D3 - D2); farm.visible = zoo.visible = true; dawn(); TINT.set(0.2, 0.16, 0.17); U.rimCol.value.set(0xffb060); anim(t);
        return { cam: [[30.6 - 0.5 * u, 0.75, -2.0 + 0.2 * u], [22.6, 1.75, 1.5]], foco: [5, 40], bl: [2.5, 6], hud(c) { cards(c, t, LIST); } }; } },
    // o caramelo latindo para um passarinho no mourão
    { a: D3, b: D4, sunXY: [-150, 700], rays: [-100, 640, 0.07], capim: 0.25, fog: [18, 130], run(t) { const u = (t - D3) / (D4 - D3); farm.visible = zoo.visible = true; dawn(); TINT.set(1, 0.96, 0.9); anim(t); const px = FENCE.x0 + 6, pz = FENCE.z1 - 12;
        piu.root.position.set(FENCE.x0, 0, pz); piu.root.scale.setScalar(2.1); piu.root.rotation.y = Math.PI / 2 + 0.3; piu.pose({ t, y: 1.26, pulo: 0.03 }); cao.root.visible = true; cao.root.position.set(FENCE.x0 + 1.5, 0, pz + 0.25); cao.root.rotation.y = -Math.PI / 2 - 0.15; cao.pose({ modo: 'late', t, alerta: true, wag: 1, headPitch: -0.35 });
        ze.root.visible = true; ze.root.position.set(FENCE.x0 + 4.2, 0, pz - 0.6); ze.root.rotation.y = -Math.PI / 2 + 0.5; C.toca(ze, 'cintura', 0.3 + C.rt(D3)) || ze.pose({ t, head: [0.12, -0.3, 0], look: [0.3, -0.6], brow: -0.15, armL: [0.14, -0.14, 0.06, 0.2, -0.3, 0.14], armR: [-0.14, -0.14, 0.06, -0.2, -0.3, 0.14], mouth: 'triste' });
        return { cam: [[FENCE.x0 + 1.9 + 0.2 * u, 1.0, pz + 3.9 - 0.3 * u], [FENCE.x0 + 0.85, 0.95, pz]], foco: [2.2, 30], bl: [2.5, 5],
          hud(c) { const [x, y] = proj(FENCE.x0 + 2.0, 1.25, pz + 0.3); for (let i = 0; i < 3; i++) { const q = ((t * 9 / 6.283 + i * 0.33) % 1), k = back(Math.min(1, q * 3)) * (1 - Math.max(0, q - 0.7) / 0.3); if (q > 0.98) continue; c.save(); c.translate(x + 130 + i * 70, y - 150 - i * 90); c.rotate(-0.15 + i * 0.12); bigText(c, 'AU!', 0, 0, Math.max(0, k), 110 - i * 14, YEL); c.restore(); } } }; } },
    // vista de cima: cada bicho solta barulho; veredito
    { a: D4, b: D5, rays: [-100, 500, 0.05], fog: [60, 300], vig: 0.6, base: 0.35, topo: 0.3, lift: true, run(t) { const u = (t - D4) / (D5 - D4); farm.visible = zoo.visible = true; dawn(); anim(t); const ver = t > D4 + 2.0;
        return { cam: [[2, 84 + 6 * u, 9.4], [2, 0, 6.4]], foco: [30, 200], bl: [0, 0], capY: ver ? 2 : 0.645,
          hud(c) { SPOT.forEach(([x, y, z, lb], i) => { const k = pop(t, D4 + 0.15 + i * 0.22); if (k <= 0) return; const [sx, sy] = proj(x, y, z); for (let j = 0; j < 3; j++) { const q = ((t * 0.9 + j / 3 + i * 0.2) % 1); c.strokeStyle = `rgba(242,194,60,${0.75 * (1 - q)})`; c.lineWidth = 5; c.beginPath(); c.arc(sx, sy, 20 + q * 170, 0, 7); c.stroke(); } c.fillStyle = YEL; c.beginPath(); c.arc(sx, sy, 13 * k, 0, 7); c.fill(); tagBox(c, lb, Math.min(W - 170, Math.max(170, sx)), sy + 56, k, { bg: 'rgba(18,14,10,0.9)', fg: '#f2d79a', size: 34, stroke: '#d8a84a', pad: 30 }); });
            if (ver) { const k = pop(t, D4 + 2.0, 0.35); c.fillStyle = `rgba(6,4,2,${0.55 * cl(k)})`; c.fillRect(0, 0, W, H); tagBox(c, 'MANTER O SILÊNCIO?', W / 2, 760, k, { bg: 'rgba(18,14,10,0.92)', fg: '#f2d79a', size: 52, stroke: '#d8a84a' }); bigText(c, 'QUASE', W / 2, 930, pop(t, D4 + 2.25), 190, RED); bigText(c, 'IMPOSSÍVEL', W / 2, 1110, pop(t, D4 + 2.4), 170, RED); } } }; } },
    // Zé fecha a porteira
    { a: D5, b: D6, sky: ['#27344f', '#b8604a', '#f0a45c'], sunXY: [-200, 820], rays: [-150, 760, 0.07], capim: 0.25, fog: [22, 200], run(t) { const u = (t - D5) / (D6 - D5); farm.visible = true; dawn(); TINT.set(1, 0.96, 0.9); C.townTick?.(t); const k = ss(u * 1.25); gate.rotation.y = lerp(1.15, 0, k); C.pad.visible = false; lock.visible = false;
        const a = gate.rotation.y, sa = Math.sin(a), ca = Math.cos(a), dist = (1.15 - a) * 3.2; ze.root.visible = true; ze.root.position.set(-1.6 + ca * 3.2 - sa * 0.52, 0, FENCE.z1 - sa * 3.2 - ca * 0.52); ze.root.rotation.y = a;
        C.toca(ze, 'porteira', 0.3 + C.rt(D5)) || ze.pose({ t, walk: (dist / 1.0) % 1, w: Math.min(1, (1 - k) * 4), stride: 0.5, lean: 0.16, head: [0.08, 0, 0], armL: [0.07, -0.16, 0.2, 0.09, -0.15, 0.47], armR: [-0.07, -0.16, 0.2, -0.09, -0.15, 0.47], brow: 0.2 });
        const zx = ze.root.position.x, zz = ze.root.position.z; return C.Z3 ? { cam: [[zx + 4.6 - 0.4 * u, 1.45, zz - 5.2 + 0.4 * u], [zx - 0.9, 1.0, zz + 0.3]], foco: [2.6, 300], bl: [0.6, 5] } : { cam: [[6.4 - 0.5 * u, 1.45, FENCE.z1 - 6.6 + 0.5 * u], [-0.1, 1.0, FENCE.z1 - 1.0 + 0.9 * u]], foco: [2.6, 300], bl: [0.6, 5] }; } },
    // close: corrente no mourão e o cadeado fechando
    { a: D6, b: D7, sky: ['#27344f', '#b8604a', '#f0a45c'], sunXY: [-200, 820], rays: [-150, 760, 0.06], fog: [16, 160], run(t) { const u = (t - D6) / (D7 - D6); farm.visible = true; dawn(); TINT.set(1, 0.96, 0.9); gate.rotation.y = 0; lock.visible = true; C.pad.visible = true; const click = t > D6 + 0.75 ? 1 : 0, e = cl((t - D6 - 0.75) / 0.08); C.shk.position.y = lerp(0.085, 0.06, e); C.pad.rotation.z = (1 - e) * 0.35 + Math.exp(-(t - D6 - 0.75) * 9) * Math.sin((t - D6 - 0.75) * 40) * 0.25 * click;
        ze.root.visible = true; ze.root.position.set(C.Z3 ? 1.5 : 1.75, 0, FENCE.z1 - (C.Z3 ? 0.55 : 0.75)); ze.root.rotation.y = C.Z3 ? 1.0 : 0.55; C.toca(ze, 'cadeado', 0.6 + C.rt(D6)) || ze.pose({ t, lean: 0.2, head: [0.4, 0, 0], armR: [-0.1, -0.24, 0.16, 0.0, lerp(-0.5, -0.56, e), 0.4], armL: [0.14, -0.22, 0.14, 0.2, -0.4, 0.34] });
        fill.position.set(3.2, 1.6, FENCE.z1 - 1.4); fill.color.set(0xffb070); fill.intensity = 4;
        return { cam: [[2.9 - 0.08 * u, 1.05, FENCE.z1 - 1.5 + 0.06 * u], [2.3, 0.84, FENCE.z1 - 0.1]], foco: [0.5, 4], bl: [5, 0], hud(c) { tagBox(c, 'TRANCADO', W / 2, 420, pop(t, D6 + 0.8), { bg: 'rgba(18,14,10,0.92)', fg: '#f2d79a', size: 52, stroke: '#d8a84a' }); } }; } },
  );
  C.gate = gate; C.lock = lock; C.zoo = zoo; C.anim = anim; C.SPOT = SPOT; C.END = D7;
}
