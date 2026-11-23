// props.js - objects (ours): grand piano (black street piano + white/gold sky piano), rope + strands, twig -> flute,
// boulder -> drum. Driven by st.plan.props = {piano:{on,pos,rot,lid,legs,scale}, piano2:{...}, rope:{on, snapped:[0..3], top,
// bottom}, twig:{on, mode:'twig'|'flute', pos?, attach:'mouth'|'handR'|'ground'}, drum:{on, mode:'stone'|'drum', pos, squash}}
import * as THREE from 'three';
import { taperTube, mergeGeos, rockGeo2, canvasTex, mulb } from './lib.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

function pianoGroup(A, pal) {
  const g = new THREE.Group();
  const body = A.celMaterial({ base: pal.body[0], shade: pal.body[1], id: pal.id, highlight: pal.hi, hiSize: 0.9, hiColor: pal.hiColor, rimColor: pal.rim, rimWidth: 0.3, wobble: 0.5 });
  const trim = A.celMaterial({ base: pal.trim[0], shade: pal.trim[1], id: pal.id + 1, highlight: 0.8, hiSize: 0.88, rimColor: '#fff4d0' });
  const inside = A.celMaterial({ base: pal.inside[0], shade: pal.inside[1], id: pal.id + 2, highlight: 0.2 });
  // case outline (top view), keyboard side at z=0, tail toward -z
  const s = new THREE.Shape();
  s.moveTo(-0.75, 0); s.lineTo(0.75, 0); s.lineTo(0.75, -0.5);
  s.bezierCurveTo(0.75, -0.95, 0.25, -1.0, 0.18, -1.45);
  s.bezierCurveTo(0.12, -1.85, -0.2, -2.0, -0.45, -1.98);
  s.lineTo(-0.75, -1.9); s.closePath();
  const caseGeo = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2, curveSegments: 24 });
  caseGeo.rotateX(Math.PI / 2);   // shape y -> -z... after rotation: shape (x, y) -> (x, 0, y)?; extrude depth along -y
  // shape y was negative toward the tail: after rotateX(+90) shape y maps to z => tail at z -1.98, depth goes down (-y)
  const cs = new THREE.Mesh(caseGeo, body); cs.position.y = 0.95; g.add(cs);
  // soundboard (inside, gold/wood) seen when the lid is open
  const sb = new THREE.Mesh(new THREE.ShapeGeometry(s, 24).rotateX(Math.PI / 2), inside); sb.position.y = 0.9; sb.scale.set(0.94, 1, 0.95); sb.position.z = -0.03; g.add(sb);
  // strings (thin gold lines)
  const strs = [];
  for (let i = 0; i < 22; i++) { const x = -0.68 + i * 0.06, len = 1.8 - Math.max(0, x + 0.2) * 0.9; strs.push({ geo: new THREE.BoxGeometry(0.006, 0.004, len).translate(x, 0.905, -0.15 - len / 2) }); }
  g.add(new THREE.Mesh(mergeGeos(strs), trim));
  // lid, hinged on the bass side (x = -0.75)
  const lidPivot = new THREE.Group(); lidPivot.position.set(-0.75, 0.97, 0); g.add(lidPivot);
  const lidGeo = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false, curveSegments: 24 }); lidGeo.rotateX(Math.PI / 2); lidGeo.translate(0.75, 0.03, 0);
  const lid = new THREE.Mesh(lidGeo, body); lidPivot.add(lid);
  const prop = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.75, 6), trim); prop.position.set(0.45, 1.3, -0.9); prop.rotation.z = 0.55; g.add(prop);
  // keyboard
  const kb = new THREE.Group(); kb.position.set(0, 0.74, 0.0); g.add(kb);
  kb.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.3).translate(0, -0.03, 0.12), body));   // key bed
  const keyTex = canvasTex(512, 32, (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.fillStyle = '#5a5470'; for (let i = 0; i <= 52; i++) x.fillRect(Math.round(i * w / 52), 0, 2, h); }, { clamp: true });
  const white = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.03, 0.15), A.celMaterial({ base: '#fbf8ef', shade: '#bdbad4', id: pal.id + 3, map: keyTex, highlight: 0.1 }));
  { const uv = white.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i)); }
  white.position.set(0, 0.035, 0.2); kb.add(white);
  const bk = []; const pat = [1, 1, 0, 1, 1, 1, 0];
  for (let i = 0; i < 51; i++) if (pat[i % 7]) bk.push({ geo: new THREE.BoxGeometry(0.014, 0.022, 0.09).translate(-0.68 + (i + 1) * 1.36 / 52, 0.06, 0.165) });
  kb.add(new THREE.Mesh(mergeGeos(bk), A.celMaterial({ base: '#24222c', shade: '#101018', id: pal.id + 4, highlight: 0.6 })));
  for (const sx of [-1, 1]) { const ch = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.32), body); ch.position.set(sx * 0.715, 0.03, 0.13); kb.add(ch); }
  const fall = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.08, 0.04), body); fall.position.set(0, 0.1, 0.09); kb.add(fall);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.02), body); stand.position.set(0, 0.32, -0.05); stand.rotation.x = -0.25; kb.add(stand);
  // legs (3) + lyre
  const legs = new THREE.Group(); g.add(legs);
  const legGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.62, 10).translate(0, -0.31, 0);
  const legPos = [[-0.62, 0.62, 0.1], [0.62, 0.62, 0.1], [-0.4, 0.62, -1.7]];
  const legM = legPos.map(([x, y, z]) => { const p = new THREE.Group(); p.position.set(x, y, z); const m = new THREE.Mesh(legGeo, body); p.add(m); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 10).translate(0, -0.62, 0), trim); p.add(c); legs.add(p); return p; });
  const lyre = new THREE.Group(); lyre.position.set(0, 0.62, -0.05); legs.add(lyre);
  lyre.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.04).translate(0, -0.25, 0), body));
  for (const px of [-0.06, 0, 0.06]) lyre.add(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.015, 0.1).translate(px, -0.52, 0.06), trim));
  g.userData = { lidPivot, legs, legM, lyre, kb, prop };
  return g;
}

export function create(ctx) {
  const { A, scene } = ctx;
  const root = new THREE.Group(); root.name = 'PROPS'; scene.add(root);
  const piano = pianoGroup(A, { id: 30, body: ['#2a2838', '#100e18'], trim: ['#e8c070', '#9a6a3a'], inside: ['#d8a868', '#9a6a4a'], hi: 0.95, hiColor: '#c8d0ff', rim: '#a8b4ff' });
  const piano2 = pianoGroup(A, { id: 40, body: ['#f8f2e6', '#c4bcd8'], trim: ['#f0c050', '#b07a30'], inside: ['#f0d8a0', '#c09870'], hi: 0.7, hiColor: '#ffffff', rim: '#fff0c0' });
  root.add(piano, piano2);
  // gold filigree band on the sky piano
  { const band = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.01, 4, 8), A.fxMaterial({ color: '#ffd870' })); band.visible = false; piano2.add(band); }

  // rope: 3 strands twisted, each split at the break height yb into a top part and a bottom part
  const ropeM = A.celMaterial({ base: '#d8b884', shade: '#8a6a4a', id: 50, highlight: 0.15 });
  const rope = new THREE.Group(); root.add(rope);
  const strandTop = [], strandBot = [];
  function strandGeo(i, y0, y1, x, z) {
    const pts = []; const n = 24;
    for (let k = 0; k <= n; k++) { const y = y0 + (y1 - y0) * k / n, a = i * 2.094 + y * 9; pts.push(V3(x + Math.cos(a) * 0.016, y, z + Math.sin(a) * 0.016)); }
    return taperTube(pts, 0.014, 0.014, 6, n * 2);
  }
  const RB = 15.0;   // break height
  for (let i = 0; i < 3; i++) {
    const top = new THREE.Mesh(strandGeo(i, RB + 0.02, 16.62, -4.6, 0), ropeM); rope.add(top); strandTop.push(top);
    // frayed tuft at the top piece's lower end (shown once snapped)
    const fr = []; for (let k = 0; k < 5; k++) { const a = k * 1.3 + i; fr.push({ geo: taperTube([V3(0, 0, 0), V3(Math.cos(a) * 0.02, -0.03, Math.sin(a) * 0.02), V3(Math.cos(a) * 0.05, -0.05 - k * 0.006, Math.sin(a) * 0.05)], 0.006, 0.001, 4, 4) }); }
    const tuft = new THREE.Mesh(mergeGeos(fr), ropeM); tuft.position.set(-4.6, RB + 0.02, 0); tuft.visible = false; rope.add(tuft); top.userData.tuft = tuft;
  }
  // bottom: rope from the break down to the hook + straps, moves with the piano (built in piano-local space)
  const hang = new THREE.Group(); piano.add(hang);
  const hangParts = [];
  for (let i = 0; i < 3; i++) hangParts.push({ geo: strandGeo(i, 1.55, 1.55 + (RB - 13.0), 0, -0.85) });
  const hook = V3(0, 1.55, -0.85);
  for (const c of [[-0.72, 0.93, 0.02], [0.72, 0.93, 0.02], [-0.7, 0.93, -1.8], [0.2, 0.93, -1.45]]) hangParts.push({ geo: taperTube([hook, V3(...c)], 0.012, 0.012, 5, 4) });
  hang.add(new THREE.Mesh(mergeGeos(hangParts), ropeM));
  hang.add(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 6, 12), A.celMaterial({ base: '#8a8aa0', shade: '#4a4a60', id: 51 })).translateY(1.55).translateZ(-0.85));

  // twig / flute
  const twig = new THREE.Group(); root.add(twig);
  const bark = A.celMaterial({ base: '#8a5e42', shade: '#4e3434', id: 52, highlight: 0.1 });
  const twigMesh = new THREE.Group(); twig.add(twigMesh);
  twigMesh.add(new THREE.Mesh(taperTube([V3(0, 0, 0), V3(0.01, -0.16, 0.01), V3(-0.01, -0.32, 0), V3(0.012, -0.46, 0.01)], 0.014, 0.008, 6, 12), bark));
  twigMesh.add(new THREE.Mesh(taperTube([V3(0.0, -0.3, 0), V3(0.05, -0.36, 0.01), V3(0.09, -0.38, 0.0)], 0.006, 0.002, 5, 6), bark));
  const leafM = A.celMaterial({ base: '#7cc35a', shade: '#3e7a52', id: 53, highlight: 0.3 });
  for (const [y, a] of [[-0.12, 0.8], [-0.4, -0.7]]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6).scale(1.6, 0.25, 0.8), leafM); l.position.set(0.03 * Math.sign(a), y, 0); l.rotation.z = a; twigMesh.add(l); }
  const fluteMesh = new THREE.Group(); twig.add(fluteMesh);
  const wood = A.celMaterial({ base: '#c8884a', shade: '#7a4a3a', id: 54, highlight: 0.7, hiSize: 0.92, rimColor: '#fff0c0' });
  fluteMesh.add(new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.022, 0.46, 14).translate(0, -0.23, 0), wood));
  const gold = A.celMaterial({ base: '#ffd060', shade: '#b07a2a', id: 55, highlight: 0.9, hiSize: 0.9, emissive: '#ffcf60', emissiveAmt: 0.1 });
  for (const y of [-0.02, -0.2, -0.44]) fluteMesh.add(new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.02, 14).translate(0, y, 0), gold));
  const holeM = A.celMaterial({ base: '#2a1a16', id: 56, flat: true });
  for (let i = 0; i < 6; i++) { const h = new THREE.Mesh(new THREE.CircleGeometry(0.006, 10), holeM); h.position.set(0, -0.12 - i * 0.045, 0.0205 + i * 0.0002); fluteMesh.add(h); }
  fluteMesh.add(new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.005).translate(0, -0.035, 0.019), holeM));

  // boulder / drum
  const drum = new THREE.Group(); root.add(drum);
  const rng = mulb(808);
  const stoneM = A.celMaterial({ base: '#a8a4b4', shade: '#6a6488', id: 57, highlight: 0.15, wobble: 1.5, rimColor: '#ffeed0' });
  const stone = new THREE.Mesh(rockGeo2(rng, { rough: 0.25, flat: 0.5 }), stoneM); stone.scale.set(0.5, 0.42, 0.45); stone.position.y = 0.2; drum.add(stone);
  const drumG = new THREE.Group(); drum.add(drumG);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 28), A.celMaterial({ base: '#f2e2c0', shade: '#bca890', id: 58, highlight: 0.3 })); head.position.y = 0.6; drumG.add(head);
  const ropeTex = canvasTex(512, 64, (x, w, h) => { x.fillStyle = '#a8a4b4'; x.fillRect(0, 0, w, h); x.strokeStyle = '#d8b884'; x.lineWidth = 7; x.beginPath(); for (let i = 0; i <= 16; i++) { x.lineTo(i * w / 16, i % 2 ? h - 6 : 6); } x.stroke(); x.strokeStyle = '#3a2a2a'; x.lineWidth = 2; x.stroke(); });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.36, 0.24, 28, 1, true), A.celMaterial({ base: '#ffffff', shade: '#a8a0c0', id: 57, map: ropeTex, highlight: 0.1 })); shell.position.y = 0.47; drumG.add(shell);
  const vine = new THREE.Mesh(new THREE.TorusGeometry(0.405, 0.018, 6, 32).rotateX(Math.PI / 2), A.celMaterial({ base: '#5aa04a', shade: '#2e6040', id: 59 })); vine.position.y = 0.6; drumG.add(vine);

  const api = { piano, piano2, rope, twig, drum };
  ctx.api.props = api;
  const setPiano = (p, s) => {
    p.visible = !!s?.on; if (!s?.on) return;
    p.position.set(...s.pos); p.rotation.set(...(s.rot ?? [0, 0, 0]), 'YXZ'); p.scale.setScalar(s.scale ?? 1);
    const U = p.userData; U.lidPivot.rotation.z = (s.lid ?? 0); U.prop.visible = (s.lid ?? 0) > 0.35;
    const sp = s.legs ?? 0;   // 0 standing, 1 splayed flat (crushed)
    U.legM.forEach((l, i) => { l.rotation.set(sp * (i === 2 ? -1.4 : 1.2), 0, sp * (i === 0 ? 1.3 : i === 1 ? -1.3 : 0.2)); });
    U.lyre.rotation.x = sp * 1.5;
    if (s.squash !== undefined) p.scale.set(s.scale ?? 1, (s.scale ?? 1) * s.squash, s.scale ?? 1);
  };
  return {
    update(st) {
      const P = st.plan?.props ?? {};
      setPiano(piano, P.piano); setPiano(piano2, P.piano2);
      hang.visible = !!P.piano?.hang;
      const R = P.rope;
      rope.visible = !!R?.on;
      if (R?.on) strandTop.forEach((s, i) => { const sn = (R.snapped ?? 0) > i; s.userData.tuft.visible = sn; s.scale.y = 1; });
      // twig / flute
      const T = P.twig; twig.visible = !!T?.on;
      if (T?.on) {
        twigMesh.visible = T.mode !== 'flute'; fluteMesh.visible = T.mode === 'flute';
        const hero = ctx.api.hero;
        if (T.attach === 'mouth' && hero) {
          const hd = hero.J.head; hd.updateWorldMatrix(true, false);
          twig.position.copy(hd.localToWorld(V3(0, -0.075, 0.12)));
          const q = hd.getWorldQuaternion(new THREE.Quaternion());
          if (hero.J.gripL && hero.J.gripR) {   // VRM hero: flute from the mouth through the two hands
            const gl = hero.J.gripL.getWorldPosition(V3()), gr = hero.J.gripR.getWorldPosition(V3()), mid = gl.add(gr).multiplyScalar(0.5);
            const y = twig.position.clone().sub(mid).normalize(), fwd = V3(0, 0, 1).applyQuaternion(q);
            const z = fwd.sub(y.clone().multiplyScalar(fwd.dot(y))).normalize(), x = V3().crossVectors(y, z);
            twig.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
          } else twig.quaternion.copy(q).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.75 + (T.tilt ?? 0), 0, 0)));
          twig.scale.setScalar(1);
        } else if (T.attach === 'handR' && hero) {
          const gr = hero.J.gripR; gr.updateWorldMatrix(true, false);
          twig.position.copy(gr.localToWorld(V3(0, 0.12, 0)));
          twig.quaternion.copy(gr.getWorldQuaternion(new THREE.Quaternion())).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...(T.rot ?? [0.2, 0, 0]))));
        } else { twig.position.set(...T.pos); twig.rotation.set(...(T.rot ?? [0, 0, 1.5])); }
      }
      const D = P.drum; drum.visible = !!D?.on;
      if (D?.on) {
        drum.position.set(...D.pos); drum.rotation.y = D.ry ?? 0;
        drumG.visible = D.mode === 'drum'; stone.scale.set(0.5, 0.42, 0.45);
        drum.scale.set(1, D.squash ?? 1, 1);
      }
    },
  };
}
