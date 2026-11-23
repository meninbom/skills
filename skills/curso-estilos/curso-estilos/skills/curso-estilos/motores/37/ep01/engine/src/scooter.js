// scooter.js - the rental electric scooter (ours) that runs Ryo over and that he is reborn as.
// st.plan.scooter = {on, pos:[x,y,z], ry (heading, forward = local +z), roll (lean / lying on its side), pitch,
//   droop (0..1 stem folds forward, tired), spin (wheel angle rad), face: 'off'|'idle'|'closed'|'open'|'wow'|'happy'|'worry'|
//   'sweat'|'scared'|'dead', pct (battery %, null = hide), blinkRed (bool), light (headlight 0..1), scale}
// The face lives on the stem display, facing the rider (local -z), drawn on a canvas per state (cached).
import * as THREE from 'three';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const INK = '#05080c';

function drawFace(face, pct, red) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d');
  g.lineCap = 'round'; g.lineJoin = 'round';
  if (face === 'dead') { g.fillStyle = '#10141c'; g.fillRect(0, 0, 512, 512); g.fillStyle = 'rgba(120,140,170,0.25)'; g.beginPath(); g.moveTo(60, 40); g.lineTo(200, 40); g.lineTo(90, 470); g.lineTo(40, 470); g.fill(); return c; }
  g.fillStyle = '#c8f6ff'; g.fillRect(0, 0, 512, 512);
  const gr = g.createRadialGradient(256, 230, 40, 256, 256, 360); gr.addColorStop(0, 'rgba(255,255,255,0.7)'); gr.addColorStop(1, 'rgba(120,210,235,0.5)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  // scanlines (LCD)
  g.fillStyle = 'rgba(40,120,150,0.08)'; for (let y = 0; y < 512; y += 8) g.fillRect(0, y, 512, 3);
  const E = [[166, 200], [346, 200]];
  g.strokeStyle = INK; g.fillStyle = INK; g.lineWidth = 26;
  const dot = (x, y, r) => { g.beginPath(); g.ellipse(x, y, r * 0.8, r, 0, 0, 7); g.fill(); };
  if (face === 'closed') for (const [x, y] of E) { g.beginPath(); g.moveTo(x - 50, y + 10); g.quadraticCurveTo(x, y + 40, x + 50, y + 10); g.stroke(); }
  else if (face === 'open' || face === 'idle') for (const [x, y] of E) { dot(x, y, 52); g.fillStyle = '#ffffff'; dot(x - 14, y - 18, 14); g.fillStyle = INK; }
  else if (face === 'wow') for (const [x, y] of E) {
    dot(x, y, 66); g.fillStyle = '#ffffff';
    g.beginPath(); for (let k = 0; k < 8; k++) { const a = -Math.PI / 2 + k * Math.PI / 4, r = k % 2 ? 9 : 30; g.lineTo(x - 10 + Math.cos(a) * r, y - 12 + Math.sin(a) * r); } g.fill();
    dot(x + 22, y + 26, 9); g.fillStyle = INK;
  }
  else if (face === 'happy') for (const [x, y] of E) { g.beginPath(); g.moveTo(x - 55, y + 25); g.quadraticCurveTo(x, y - 50, x + 55, y + 25); g.stroke(); }
  else if (face === 'worry' || face === 'sweat') for (const [x, y] of E) {
    dot(x, y + 6, 40); g.fillStyle = '#ffffff'; dot(x - 10, y - 8, 10); g.fillStyle = INK;
    const s = x < 256 ? 1 : -1; g.lineWidth = 18; g.beginPath(); g.moveTo(x - 50 * s, y - 52); g.lineTo(x + 40 * s, y - 80); g.stroke(); g.lineWidth = 26;
  }
  else if (face === 'scared') for (const [x, y] of E) { g.lineWidth = 14; g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x, y, 58, 66, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = INK; dot(x, y + 4, 12); g.lineWidth = 26; }
  // mouth
  g.lineWidth = 18;
  if (face === 'happy' || face === 'wow') { g.fillStyle = '#ff7c9c'; g.beginPath(); g.moveTo(206, 300); g.quadraticCurveTo(256, 310, 306, 300); g.quadraticCurveTo(300, 360, 256, 362); g.quadraticCurveTo(212, 360, 206, 300); g.fill(); g.stroke(); }
  else if (face === 'scared') { g.beginPath(); g.moveTo(190, 320); for (let k = 0; k <= 8; k++) g.lineTo(190 + k * 16.5, 320 + (k % 2 ? -14 : 14)); g.stroke(); }
  else if (face === 'worry' || face === 'sweat') { g.beginPath(); g.moveTo(216, 330); g.quadraticCurveTo(256, 300, 296, 330); g.stroke(); }
  else if (face === 'open') { g.beginPath(); g.ellipse(256, 318, 18, 14, 0, 0, 7); g.stroke(); }
  // sweat drop drawn on the screen
  if (face === 'sweat' || face === 'scared') { g.fillStyle = '#7fd0ff'; g.strokeStyle = INK; g.lineWidth = 9; g.beginPath(); g.moveTo(430, 90); g.quadraticCurveTo(468, 160, 456, 182); g.arc(430, 178, 28, 0.1, Math.PI - 0.1); g.quadraticCurveTo(392, 160, 430, 90); g.fill(); g.stroke(); }
  // battery
  if (pct !== null && pct !== undefined) {
    const x0 = 60, y0 = 384, w = 200, h = 96; const col = red ? '#ff2d3c' : pct > 30 ? '#22b86a' : pct > 10 ? '#f0a020' : '#ff2d3c';
    g.lineWidth = 12; g.strokeStyle = INK; g.strokeRect(x0, y0, w, h); g.fillStyle = INK; g.fillRect(x0 + w + 4, y0 + 28, 14, 40);
    g.fillStyle = col; g.fillRect(x0 + 10, y0 + 10, Math.max(4, (w - 20) * pct / 100), h - 20);
    g.fillStyle = INK; g.font = 'bold 104px "Arial Black", Arial, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText(`${Math.round(pct)}%`, x0 + w + 26, y0 + h / 2 + 4);
  }
  return c;
}

export function create(ctx) {
  const { A, scene } = ctx;
  const root = new THREE.Group(); root.name = 'SCOOTER'; scene.add(root);
  const body = new THREE.Group(); root.add(body);
  const green = A.celMaterial({ base: '#3fd494', shade: '#1d8670', id: 70, highlight: 0.7, hiSize: 0.9, rimColor: '#e8fff4' });
  const black = A.celMaterial({ base: '#2c2c38', shade: '#14141c', id: 71, highlight: 0.5, hiSize: 0.92 });
  const grey = A.celMaterial({ base: '#c8ccd8', shade: '#7c7c98', id: 72, highlight: 0.8 });
  const tyre = A.celMaterial({ base: '#24242c', shade: '#0e0e14', id: 73, highlight: 0.2 });
  // deck (wheelbase 0.95 m), forward = +z
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.07, 0.86), green); deck.position.set(0, 0.16, -0.02); body.add(deck);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.012, 0.7), black); grip.position.set(0, 0.2, -0.04); body.add(grip);
  const rearG = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.24).translate(0, 0, -0.06), green); rearG.position.set(0, 0.27, -0.46); rearG.rotation.x = 0.35; body.add(rearG);
  const wheelGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.06, 20).rotateZ(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.07, 6).rotateZ(Math.PI / 2);
  const wheels = [];
  for (const z of [0.47, -0.47]) {
    const w = new THREE.Group(); w.position.set(0, 0.11, z); body.add(w);
    w.add(new THREE.Mesh(wheelGeo, tyre)); const hub = new THREE.Mesh(hubGeo, grey); w.add(hub);
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.02, 0.15), grey); w.add(spoke); wheels.push(w);
  }
  // stem pivot at the front of the deck (folds forward when tired)
  const stemP = new THREE.Group(); stemP.position.set(0, 0.2, 0.4); body.add(stemP);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.95, 12).translate(0, 0.475, 0), green); stem.rotation.x = 0.1; stemP.add(stem);
  const fork = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.05), black); fork.position.set(0, -0.04, 0.06); stemP.add(fork);
  const top = new THREE.Group(); top.position.set(0, 0.94, 0.095); top.rotation.x = 0.1; stemP.add(top);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.56, 10).rotateZ(Math.PI / 2), black); top.add(bar);
  for (const s of [-1, 1]) { const gp = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.12, 10).rotateZ(Math.PI / 2), black); gp.position.x = s * 0.25; top.add(gp); }
  // display head: rounded box, screen on the rider side (-z), headlight on the front (+z)
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.17, 0.07), green); head.position.set(0, 0.06, 0); top.add(head);
  const screenMat = A.celMaterial({ base: '#ffffff', shade: '#ffffff', id: 74, flat: true, map: null, emissive: '#ffffff', emissiveAmt: 0.25 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.145), screenMat); screen.position.set(0, 0.06, -0.0365); screen.rotation.y = Math.PI; top.add(screen);
  const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), A.fxMaterial({ color: '#fff6d0', intensity: 1.6, bloom: 1.2 })); lamp.position.set(0, 0.0, 0.0365); top.add(lamp);
  const kick = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.18), black); kick.position.set(-0.1, 0.1, -0.05); kick.rotation.set(0.6, 0, 0.3); body.add(kick);
  const cache = new Map();
  const tex = (face, pct, red) => {
    const k = `${face}|${pct == null ? '-' : Math.round(pct)}|${red ? 1 : 0}`;
    if (!cache.has(k)) { const t = new THREE.CanvasTexture(drawFace(face, pct, red)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; cache.set(k, t); }
    return cache.get(k);
  };
  const api = { root, normal: () => { screen.updateWorldMatrix(true, false); return new THREE.Vector3(0, 0, 1).transformDirection(screen.matrixWorld); }, anchor: (n) => { (n === 'screen' ? screen : body).updateWorldMatrix(true, false); return (n === 'screen' ? screen : body).getWorldPosition(V3()); } };
  ctx.api.scooter = api;
  return {
    update(st) {
      const s = st.plan?.scooter; root.visible = !!s?.on; if (!s?.on) return;
      root.position.set(...(s.pos ?? [0, 0, 0])); root.rotation.set(s.pitch ?? 0, s.ry ?? 0, s.roll ?? 0, 'YXZ');
      root.scale.setScalar(s.scale ?? 1);
      for (const w of wheels) w.rotation.x = s.spin ?? 0;
      stemP.rotation.x = 0.55 * (s.droop ?? 0);
      top.rotation.x = 0.1 + 0.35 * (s.droop ?? 0);
      const t = tex(s.face ?? 'idle', s.pct ?? null, !!s.blinkRed);
      screenMat.uniforms.uMap.value = t; screenMat.uniforms.uUseMap.value = 1;
      screenMat.uniforms.uEmisAmt.value = 0;
      lamp.visible = (s.light ?? 1) > 0.5;
      root.updateMatrixWorld(true);
    },
  };
}
