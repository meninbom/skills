// hero.js - TAKU (ours): 27-year-old office worker, 90s cel design. Rigid jointed rig of lathe/ellipsoid parts, painted
// face atlas on the head (expressions swap the map), spiky hair from tapered tubes. Posed every frame from st.plan.hero
// (direction/main): {on, pos:[x,y,z], ry, rx, rz, pose:{joint:[x,y,z]}, face, prop:{L,R}}; poses already on twos.
import * as THREE from 'three';
import { taperTube, mergeGeos } from './lib.js';

export const PAL = {
  skin: ['#f7d6bf', '#d99c8f'], hair: ['#2b2d48', '#16162a'], shirt: ['#f5f3ec', '#b8bcd8'], tie: ['#d23a3f', '#8e1f33'],
  pants: ['#34405e', '#1e2440'], shoe: ['#3a2a26', '#1c1414'], belt: ['#4a3426', '#241812'],
};
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// rounded limb hanging from the joint along -y: lathe of a capsule-like profile
function limbGeo(len, r0, r1, seg = 14) {
  const pts = [];
  const n = 10;
  for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / n) * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * r0 * 0.98 + 1e-4, -len + r1 * 0 + Math.sin(a) * 0)); }
  // simple: profile from bottom (y=-len) to top (y=0) with rounded ends
  pts.length = 0;
  const cap = 6;
  for (let i = 0; i <= cap; i++) { const a = -Math.PI / 2 + (i / cap) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.max(1e-4, Math.cos(a) * r1), -len + r1 + Math.sin(a) * r1)); }
  for (let i = 1; i < 6; i++) { const k = i / 6; const r = r1 + (r0 - r1) * k; pts.push(new THREE.Vector2(r * (1 + 0.06 * Math.sin(k * Math.PI)), -len + r1 + (len - r1 - r0) * k)); }
  for (let i = 0; i <= cap; i++) { const a = (i / cap) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.max(1e-4, Math.cos(a) * r0), -r0 + Math.sin(a) * r0)); }
  return new THREE.LatheGeometry(pts, seg);
}
function ell(rx, ry, rz, ws = 20, hs = 14) { const g = new THREE.SphereGeometry(1, ws, hs); g.scale(rx, ry, rz); return g; }

// ------------------------------------------------------------ face atlas (equirect on the head sphere: front = u 0.25)
const FW = 1024, FH = 512, CX = 256, EY = 266;
function drawFace(expr) {
  const c = document.createElement('canvas'); c.width = FW; c.height = FH;
  const g = c.getContext('2d');
  g.fillStyle = PAL.skin[0]; g.fillRect(0, 0, FW, FH);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const INK = '#24161a';
  const E = (expr in EXPR) ? EXPR[expr] : EXPR.normal;
  // blush (hatched)
  if (E.blush) {
    g.save(); g.strokeStyle = 'rgba(238,110,130,0.85)'; g.lineWidth = 3;
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { const x = CX + s * 72 + k * 7 - 10; g.beginPath(); g.moveTo(x, EY + 46); g.lineTo(x - 7, EY + 60); g.stroke(); }
    g.fillStyle = 'rgba(246,140,150,0.35)';
    for (const s of [-1, 1]) { g.beginPath(); g.ellipse(CX + s * 74, EY + 52, 22, 9, 0, 0, 7); g.fill(); }
    g.restore();
  }
  for (const s of [-1, 1]) eye(g, CX + s * 50, EY, s, E, INK);
  // brows
  g.strokeStyle = INK; g.lineWidth = 9;
  for (const s of [-1, 1]) {
    const bx = CX + s * 52, by = EY - 52 + (E.browY ?? 0), tilt = (E.brow ?? 0) * s;   // brow>0: angry (inner down)
    g.beginPath(); g.moveTo(bx - s * 30, by + tilt * -10 + 4); g.quadraticCurveTo(bx, by - 8 + (E.browArc ?? 0), bx + s * 30, by + tilt * 10 + 2); g.stroke();
  }
  // nose: small lit-side tick
  g.lineWidth = 4; g.strokeStyle = 'rgba(150,80,80,0.9)';
  g.beginPath(); g.moveTo(CX + 6, EY + 30); g.lineTo(CX + 2, EY + 46); g.lineTo(CX - 7, EY + 47); g.stroke();
  mouth(g, CX, EY + 84, E.mouth ?? 'flat', INK);
  if (E.gloom) {   // despair lines on the upper face
    g.strokeStyle = 'rgba(70,80,150,0.55)'; g.lineWidth = 3;
    for (let k = 0; k < 16; k++) { const x = CX - 90 + k * 12; g.beginPath(); g.moveTo(x, EY - 120); g.lineTo(x, EY - 40 - (k % 3) * 12); g.stroke(); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true;
  return t;
}
const EXPR = {
  normal: { lid: 0, iris: 1, mouth: 'smile0', brow: 0 },
  tired: { lid: 0.5, iris: 1, mouth: 'flat', brow: -0.3, bags: true, browY: 4 },
  shock: { lid: -0.15, iris: 0.22, mouth: 'shock', brow: -0.6, browY: -10, noHi: true, gloom: true },
  closed: { closed: 'down', mouth: 'flat', brow: 0 },
  happy: { closed: 'up', mouth: 'open', brow: -0.2, browY: -6, blush: true },
  blow: { closed: 'down', mouth: 'o', brow: -0.4, browY: -6, blush: true },
  panic: { lid: -0.15, iris: 0.3, mouth: 'wavy', brow: -0.9, browY: -12, noHi: true, sweat: true },
  wow: { lid: -0.1, iris: 1.12, mouth: 'open', brow: -0.5, browY: -10, star: true, blush: true },
  determined: { lid: 0.18, iris: 1, mouth: 'grin', brow: 0.8, browY: 4 },
  dazed: { lid: 0.35, iris: 0.9, mouth: 'flat', brow: -0.2 },
};
function eye(g, cx, cy, s, E, INK) {
  if (E.closed) {
    g.strokeStyle = INK; g.lineWidth = 8; g.beginPath();
    if (E.closed === 'up') { g.moveTo(cx - 26, cy + 8); g.quadraticCurveTo(cx, cy - 22, cx + 26, cy + 8); }
    else { g.moveTo(cx - 28, cy); g.quadraticCurveTo(cx, cy + 16, cx + 28, cy); g.moveTo(cx + s * 28, cy); g.lineTo(cx + s * 36, cy - 6); }
    g.stroke(); return;
  }
  const w = 30, h = 34, lidY = cy - h * 0.62 + E.lid * h * 0.9;
  g.save();
  // sclera clipped under the lid
  g.beginPath(); g.ellipse(cx, cy + 2, w, h, 0, 0, 7); g.clip();
  g.fillStyle = '#fbfaf6'; g.fillRect(cx - w, cy - h, w * 2, h * 2 + 4);
  // iris + pupil
  const ir = 17 * E.iris, iy = cy + 6;
  if (E.iris < 0.5) {
    g.fillStyle = INK; g.beginPath(); g.ellipse(cx, cy + 2, ir * 1.4 + 3, ir * 1.6 + 4, 0, 0, 7); g.fill();
  } else {
    const gr = g.createLinearGradient(0, iy - ir * 1.5, 0, iy + ir * 1.5);
    gr.addColorStop(0, '#2a1610'); gr.addColorStop(0.45, '#6b3f2a'); gr.addColorStop(1, '#b07a4a');
    g.fillStyle = gr; g.beginPath(); g.ellipse(cx + s * 1, iy, ir, ir * 1.42, 0, 0, 7); g.fill();
    g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#1a0e0c'; g.beginPath(); g.ellipse(cx + s * 1, iy + 2, ir * 0.48, ir * 0.72, 0, 0, 7); g.fill();
    if (!E.noHi) {
      g.fillStyle = '#ffffff';
      if (E.star) { star4(g, cx - 6, iy - 10, 11); star4(g, cx + 7, iy + 12, 6); }
      else { g.beginPath(); g.ellipse(cx - 6, iy - 11, 6.5, 8, -0.4, 0, 7); g.fill(); g.beginPath(); g.arc(cx + 7, iy + 13, 3.2, 0, 7); g.fill(); }
    }
  }
  // lid shadow band
  g.fillStyle = PAL.skin[0]; g.fillRect(cx - w - 2, cy - h - 4, w * 2 + 4, lidY - (cy - h - 4));
  g.restore();
  // upper lash line: thick, outer corner flick, slight angle
  g.strokeStyle = INK; g.lineWidth = 9; g.beginPath();
  g.moveTo(cx - s * 31, lidY + 8 + (E.brow > 0.5 ? -6 : 0)); g.quadraticCurveTo(cx, lidY - 6, cx + s * 33, lidY + 4 + (E.brow > 0.5 ? 6 : 0)); g.lineTo(cx + s * 40, lidY - 2);
  g.stroke();
  // lower lash: short
  g.lineWidth = 4; g.beginPath(); g.moveTo(cx + s * 10, cy + h + 2); g.quadraticCurveTo(cx + s * 22, cy + h - 2, cx + s * 28, cy + h - 12); g.stroke();
  if (E.bags) { g.strokeStyle = 'rgba(140,90,110,0.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 20, cy + h + 12); g.quadraticCurveTo(cx, cy + h + 18, cx + 22, cy + h + 10); g.stroke(); }
}
function star4(g, x, y, r) { g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill(); }
function mouth(g, x, y, m, INK) {
  g.strokeStyle = INK; g.lineWidth = 6; g.fillStyle = '#5a1e24';
  if (m === 'flat') { g.beginPath(); g.moveTo(x - 16, y + 2); g.quadraticCurveTo(x, y - 1, x + 14, y + 3); g.stroke(); }
  else if (m === 'smile0') { g.beginPath(); g.moveTo(x - 16, y); g.quadraticCurveTo(x, y + 8, x + 16, y - 1); g.stroke(); }
  else if (m === 'shock') {
    g.beginPath(); g.ellipse(x, y + 8, 17, 26, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#d9606a'; g.beginPath(); g.ellipse(x, y + 24, 10, 7, 0, 0, 7); g.fill();
  } else if (m === 'open') {
    g.beginPath(); g.moveTo(x - 30, y - 4); g.quadraticCurveTo(x, y + 4, x + 30, y - 4); g.quadraticCurveTo(x, y + 44, x - 30, y - 4); g.fill(); g.stroke();
    g.fillStyle = '#e07078'; g.beginPath(); g.ellipse(x, y + 22, 14, 7, 0, 0, 7); g.fill();
  } else if (m === 'o') { g.beginPath(); g.ellipse(x, y + 4, 9, 10, 0, 0, 7); g.fill(); g.stroke(); }
  else if (m === 'wavy') {
    g.beginPath(); g.moveTo(x - 34, y + 6);
    for (let k = 0; k <= 8; k++) g.lineTo(x - 34 + k * 8.5, y + 6 + (k % 2 ? -7 : 7));
    g.lineTo(x + 30, y + 30); g.quadraticCurveTo(x, y + 40, x - 34, y + 6); g.fill(); g.stroke();
  } else if (m === 'grin') {
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(x - 24, y - 2); g.lineTo(x + 24, y - 6); g.quadraticCurveTo(x + 4, y + 18, x - 24, y - 2); g.fill(); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.moveTo(x - 20, y + 2); g.lineTo(x + 20, y - 1); g.stroke();
  }
}

export function create(ctx) {
  const { A, scene } = ctx;
  const mat = (k, id, o = {}) => A.celMaterial({ base: PAL[k][0], shade: PAL[k][1], id, rimColor: '#fff2dc', highlight: o.hi ?? 0.25, hiSize: o.hiSize ?? 0.97, ...o });
  const M = {
    skin: mat('skin', 1, { hi: 0.0 }), hair: mat('hair', 3, { hi: 0.75, hiSize: 0.93, hiColor: '#8a90d0' }), shirt: mat('shirt', 4, { hi: 0.0 }),
    tie: mat('tie', 5, { hi: 0.3 }), pants: mat('pants', 6, { hi: 0.0 }), shoe: mat('shoe', 7, { hi: 0.6 }), belt: mat('belt', 9, { hi: 0.4 }),
  };
  const faces = {}; for (const k of Object.keys(EXPR)) faces[k] = drawFace(k);
  const headMat = A.celMaterial({ base: '#ffffff', shade: '#e2aeb0', id: 1, map: faces.normal, rimColor: '#fff2dc', highlight: 0, wobble: 0.6 });

  const root = new THREE.Group(); root.name = 'TAKU'; scene.add(root);
  const J = {};
  const joint = (name, parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); g.name = name; parent.add(g); J[name] = g; return g; };
  const add = (parent, geo, m, x = 0, y = 0, z = 0) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); parent.add(me); return me; };

  const body = joint('body', root, 0, 0, 0);
  const hips = joint('hips', body, 0, 0.95, 0);
  add(hips, ell(0.15, 0.115, 0.105), M.pants, 0, -0.02, 0);
  add(hips, new THREE.TorusGeometry(0.138, 0.016, 8, 28).rotateX(Math.PI / 2).scale(1, 1, 0.74), M.belt, 0, 0.055, 0);
  const spine = joint('spine', hips, 0, 0.06, 0);
  // torso: lathe, broader at the chest, flattened front-back
  const tp = [[0.001, 0], [0.135, 0.0], [0.14, 0.08], [0.152, 0.2], [0.168, 0.3], [0.165, 0.36], [0.135, 0.41], [0.07, 0.44], [0.001, 0.445]].map(([r, y]) => new THREE.Vector2(r, y));
  const torso = add(spine, new THREE.LatheGeometry(tp, 22).scale(1, 1, 0.66), M.shirt, 0, 0, 0);
  // collar wings + tie
  const col = new THREE.Shape(); col.moveTo(0, 0); col.lineTo(0.06, 0.015); col.lineTo(0.05, -0.06); col.lineTo(0, -0.02);
  for (const s of [-1, 1]) { const cg = new THREE.ExtrudeGeometry(col, { depth: 0.012, bevelEnabled: false }); const me = add(spine, cg, M.shirt, 0, 0.43, 0.075); me.scale.x = s; me.rotation.x = -0.35; }
  const tie = new THREE.Shape(); tie.moveTo(-0.018, 0); tie.lineTo(0.018, 0); tie.lineTo(0.034, -0.27); tie.lineTo(0, -0.31); tie.lineTo(-0.034, -0.27); tie.closePath();
  const tieMesh = add(spine, new THREE.ExtrudeGeometry(tie, { depth: 0.014, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 1 }), M.tie, 0, 0.405, 0.118);
  tieMesh.rotation.x = -0.12; J.tie = tieMesh;
  add(spine, ell(0.026, 0.022, 0.016), M.tie, 0, 0.41, 0.122);
  // neck + head
  const neck = joint('neck', spine, 0, 0.43, 0.0);
  add(neck, limbGeo(0.09, 0.046, 0.05).translate(0, 0.09, 0), M.skin, 0, 0, 0);
  const head = joint('head', neck, 0, 0.14, 0.012); head.scale.setScalar(1.16);
  const hg = new THREE.SphereGeometry(0.115, 48, 32);
  { // jaw: taper the lower half to a soft anime chin
    const p = hg.attributes.position, v = V3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); const y = v.y / 0.115;
      if (y < 0) { const k = Math.min(1, -y); const kk = k * k; v.x *= 1 - 0.38 * kk; v.y *= 1 + 0.22 * k; v.z = v.z * (1 - 0.15 * kk) + (v.z > 0 ? 0.018 * kk : 0); }
      p.setXYZ(i, v.x, v.y, v.z);
    }
    hg.computeVertexNormals(); hg.scale(0.93, 1.06, 0.98);
  }
  const headMesh = add(head, hg, headMat, 0, 0, 0);
  for (const s of [-1, 1]) { const e = add(head, ell(0.018, 0.03, 0.012), M.skin, s * 0.104, -0.008, -0.01); e.rotation.y = s * 0.4; }
  // hair: cap (front-lower pulled inside the skull) + tapered spikes
  {
    const cap = new THREE.SphereGeometry(0.126, 40, 28), p = cap.attributes.position, v = V3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); const d = v.clone().normalize();
      let hide = (d.z > 0.1 && d.y < 0.42) || (d.y < -0.15 && d.z > -0.55) || (Math.abs(d.x) > 0.7 && d.y < 0.05 && d.z > -0.4);
      if (hide) v.multiplyScalar(0.82);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    cap.computeVertexNormals();
    const parts = [{ geo: cap, matrix: new THREE.Matrix4().makeTranslation(0, 0.016, -0.01) }];
    const rng = ctx.rng(77);
    const spike = (from, dir, len, r0, bend) => {
      const pts = [from.clone(), from.clone().addScaledVector(dir, len * 0.45).add(bend.clone().multiplyScalar(len * 0.2)), from.clone().addScaledVector(dir, len).add(bend.clone().multiplyScalar(len * 0.55))];
      parts.push({ geo: taperTube(pts, r0, 0.0015, 7, 10, { pow: 0.8 }) });
    };
    // crown + back spikes: outward and down-back, the 90s silhouette
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + rng() * 0.2, el = 0.15 + rng() * 0.75;
      const d = V3(Math.sin(a) * Math.cos(el), Math.sin(el), Math.cos(a) * Math.cos(el));
      if (d.z > 0.35 && el < 0.7) continue;
      const from = d.clone().multiplyScalar(0.105).add(V3(0, 0.02, -0.01));
      const out = d.clone().add(V3(0, -0.35, -0.25)).normalize();
      spike(from, out, 0.09 + rng() * 0.07, 0.034 + rng() * 0.01, V3(0, -1, 0));
    }
    // top spikes up-back
    for (let i = 0; i < 6; i++) {
      const a = (i / 6 - 0.5) * 1.6; const from = V3(Math.sin(a) * 0.05, 0.11, -0.02 + Math.cos(a) * 0.02);
      spike(from, V3(Math.sin(a) * 0.6, 0.55, -0.6).normalize(), 0.1 + rng() * 0.04, 0.036, V3(0, -0.6, -0.4));
    }
    // bangs: fall forward-down over the forehead to brow level
    const bangs = [[-0.07, 0.62], [-0.035, 0.75], [0.0, 0.8], [0.035, 0.74], [0.068, 0.6], [-0.095, 0.4], [0.095, 0.42]];
    for (const [x, len] of bangs) {
      const from = V3(x * 0.9, 0.1, 0.06);
      spike(from, V3(x * 2.2, -0.2, 1).normalize(), 0.07 * len + 0.025, 0.03, V3(x * 3, -1.0, 0.2));
    }
    // sideburn locks over the ears
    for (const s of [-1, 1]) spike(V3(s * 0.1, 0.03, 0.02), V3(s * 0.25, -1, 0.15).normalize(), 0.09, 0.024, V3(0, -0.2, 0.2));
    add(head, mergeGeos(parts), M.hair, 0, 0, 0);
  }
  // arms
  for (const s of [1, -1]) {
    const k = s > 0 ? 'L' : 'R';
    const sh = joint('shoulder' + k, spine, s * 0.16, 0.385, -0.005);
    add(sh, ell(0.05, 0.05, 0.05), M.shirt, 0, -0.01, 0);
    add(sh, limbGeo(0.29, 0.047, 0.04), M.shirt);
    const el = joint('elbow' + k, sh, 0, -0.27, 0);
    add(el, limbGeo(0.25, 0.04, 0.035), M.shirt);
    add(el, new THREE.CylinderGeometry(0.038, 0.038, 0.03, 14), M.shirt, 0, -0.235, 0);
    const wr = joint('wrist' + k, el, 0, -0.25, 0);
    add(wr, ell(0.036, 0.055, 0.022), M.skin, 0, -0.045, 0.004);
    const th = add(wr, limbGeo(0.05, 0.014, 0.012), M.skin, -s * 0.026, -0.02, 0.016); th.rotation.z = s * 0.6; th.rotation.x = -0.4;
    add(wr, ell(0.035, 0.03, 0.022), M.skin, 0, -0.095, 0.006);   // curled fingers
    const grip = joint('grip' + k, wr, 0, -0.08, 0.03);
  }
  // legs
  for (const s of [1, -1]) {
    const k = s > 0 ? 'L' : 'R';
    const hp = joint('hip' + k, hips, s * 0.088, -0.03, 0);
    add(hp, limbGeo(0.45, 0.07, 0.054), M.pants);
    const kn = joint('knee' + k, hp, 0, -0.43, 0);
    add(kn, limbGeo(0.44, 0.055, 0.048), M.pants);
    const an = joint('ankle' + k, kn, 0, -0.43, 0);
    const shoe = add(an, ell(0.05, 0.04, 0.12), M.shoe, 0, -0.035, 0.045);
    add(an, new THREE.BoxGeometry(0.1, 0.014, 0.24).translate(0, 0, 0.045), M.shoe, 0, -0.07, 0);
  }
  // phone (held in the right hand)
  const phone = new THREE.Group(); phone.name = 'phone';
  add(phone, new THREE.BoxGeometry(0.072, 0.15, 0.009), A.celMaterial({ base: '#2a2a36', shade: '#14141c', id: 8, highlight: 0.8, hiSize: 0.9 }));
  add(phone, new THREE.PlaneGeometry(0.064, 0.138), A.fxMaterial({ color: '#a8dcff', intensity: 1.15, bloom: 0.6 }), 0, 0, 0.0052);
  J.gripR.add(phone); phone.position.set(0, -0.02, 0.0); phone.rotation.set(-1.2, 0, 0);

  const REST = {
    shoulderL: [0, 0, 0.1], shoulderR: [0, 0, -0.1], elbowL: [-0.15, 0, 0], elbowR: [-0.15, 0, 0],
  };
  function setPose(pose) {
    for (const k in J) if (J[k].isGroup && k !== 'body') J[k].rotation.set(0, 0, 0);
    for (const k in REST) J[k].rotation.set(...REST[k]);
    if (pose) for (const k in pose) if (J[k]) { const v = pose[k]; J[k].rotation.set(v[0] ?? 0, v[1] ?? 0, v[2] ?? 0); }
  }
  const api = {
    root, J, faces, phone,
    anchor(name) { const o = J[name] ?? J.head; o.updateWorldMatrix(true, false); return o.getWorldPosition(V3()); },
    apply(h) {
      root.visible = !!h?.on; if (!h?.on) return;
      root.position.set(...(h.pos ?? [0, 0, 0])); root.rotation.set(h.rx ?? 0, h.ry ?? 0, h.rz ?? 0, 'YXZ');
      J.body.position.set(...(h.bodyOff ?? [0, 0, 0]));
      setPose(h.pose);
      if (h.hipsY !== undefined) J.hips.position.y = h.hipsY;
      headMat.uniforms.uMap.value = faces[h.face] ?? faces.normal;
      phone.visible = h.prop?.R === 'phone';
      root.updateMatrixWorld(true);
    },
  };
  ctx.api.hero = api;
  return { update(st) { api.apply(st.plan?.hero); } };
}
