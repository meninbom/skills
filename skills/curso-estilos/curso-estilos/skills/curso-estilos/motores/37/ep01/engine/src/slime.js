// slime.js - the SLIME KING (ours): giant mint jelly mound, gold crown, painted face decal (moods), jiggle on twos.
// st.plan.slime = {on, pos:[x,y,z], ry, R (radius m), sq (squash, 1 = rest), lean:[x,z], face, jig (0..1), poke (0..1)}
import * as THREE from 'three';
import { mergeGeos } from './lib.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
function faceTex(kind) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d'); g.lineCap = 'round'; g.lineJoin = 'round';
  const INK = '#163038';
  const eyes = (fn) => { for (const s of [-1, 1]) fn(512 + s * 170, 230, s); };
  if (kind === 'angry' || kind === 'roar') {
    eyes((x, y, s) => {
      g.fillStyle = '#ffffff'; g.strokeStyle = INK; g.lineWidth = 14;
      g.beginPath(); g.moveTo(x - 80, y - 20 - s * 0); g.lineTo(x + 80, y - 20); g.quadraticCurveTo(x + 70, y + 70, x, y + 72); g.quadraticCurveTo(x - 70, y + 70, x - 80, y - 20); g.closePath();
      g.save(); g.clip(); g.fill(); g.fillStyle = INK; g.beginPath(); g.arc(x - s * 18, y + 30, 26, 0, 7); g.fill(); g.restore(); g.stroke();
      // brows: hard angled, inner end low
      g.lineWidth = 30; g.beginPath(); g.moveTo(x - s * 110, y - 90); g.lineTo(x + s * 40, y - 30); g.stroke();
    });
    g.fillStyle = '#7a2238'; g.strokeStyle = INK; g.lineWidth = 14;
    if (kind === 'roar') { g.beginPath(); g.moveTo(352, 360); g.lineTo(672, 360); g.quadraticCurveTo(650, 500, 512, 505); g.quadraticCurveTo(374, 500, 352, 360); g.fill(); g.stroke();
      g.fillStyle = '#ffffff'; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(372 + k * 50, 362); g.lineTo(397 + k * 50, 362); g.lineTo(384 + k * 50, 400); g.fill(); }
      g.fillStyle = '#e8607a'; g.beginPath(); g.ellipse(512, 470, 70, 24, 0, 0, 7); g.fill(); }
    else { g.beginPath(); g.moveTo(400, 390); for (let k = 0; k <= 8; k++) g.lineTo(400 + k * 28, 390 + (k % 2 ? -16 : 16)); g.stroke(); }
  } else if (kind === 'happy') {
    g.fillStyle = 'rgba(255,140,170,0.75)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(512 + s * 250, 330, 80, 34, 0, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(230,90,120,0.9)'; g.lineWidth = 6; for (const s of [-1, 1]) for (let k = 0; k < 5; k++) { const x = 512 + s * 250 - 40 + k * 20; g.beginPath(); g.moveTo(x + 8, 306); g.lineTo(x - 8, 352); g.stroke(); }
    g.strokeStyle = INK; g.lineWidth = 22; eyes((x, y) => { g.beginPath(); g.moveTo(x - 70, y + 30); g.quadraticCurveTo(x, y - 60, x + 70, y + 30); g.stroke(); });
    g.fillStyle = '#7a2238'; g.lineWidth = 14; g.beginPath(); g.moveTo(420, 360); g.quadraticCurveTo(512, 380, 604, 360); g.quadraticCurveTo(600, 470, 512, 470); g.quadraticCurveTo(424, 470, 420, 360); g.fill(); g.stroke();
    g.fillStyle = '#e8607a'; g.beginPath(); g.ellipse(512, 445, 44, 18, 0, 0, 7); g.fill();
  } else {   // 'confused' / 'calm': dot eyes, small mouth
    eyes((x, y) => { g.fillStyle = INK; g.beginPath(); g.ellipse(x, y + 10, 26, 40, 0, 0, 7); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x - 8, y - 6, 9, 0, 7); g.fill(); });
    g.strokeStyle = INK; g.lineWidth = 14; g.beginPath(); g.moveTo(470, 400); g.quadraticCurveTo(512, kind === 'calm' ? 425 : 385, 554, 400); g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t;
}

export function create(ctx) {
  const { A, scene } = ctx;
  const root = new THREE.Group(); root.name = 'SLIME'; scene.add(root);
  const body = new THREE.Group(); root.add(body);
  // mound: sphere, flattened bottom, slight drip bulge at the base
  const base = new THREE.SphereGeometry(1, 64, 40);
  const shape = (v) => { if (v.y < -0.3) v.y = -0.3 + (v.y + 0.3) * 0.08; const w = 1 + 0.22 * Math.max(0, 1 - Math.abs(v.y + 0.3) * 1.4) * (v.y < 0.2 ? 1 : 0.4); v.x *= w; v.z *= w; v.y *= 0.92; return v; };
  { const p = base.attributes.position, v = V3(); for (let i = 0; i < p.count; i++) { shape(v.fromBufferAttribute(p, i)); p.setXYZ(i, v.x, v.y, v.z); } base.computeVertexNormals(); }
  const jelly = A.celMaterial({ base: '#7fe3c9', shade: '#3a9fb4', id: 20, highlight: 0.95, hiSize: 0.93, hiColor: '#ffffff', rimColor: '#e6fff6', rimWidth: 0.3, wobble: 0.4, darkRim: 0.5 });
  const geo = base.clone(); const mesh = new THREE.Mesh(geo, jelly); body.add(mesh);
  // inner bubbles (lighter dots seen through the jelly)
  const bub = A.celMaterial({ base: '#c8fff0', shade: '#8adcd0', id: 21, flat: true });
  for (const [x, y, z, r] of [[0.5, 0.1, 0.72, 0.06], [-0.6, 0.25, 0.68, 0.04], [0.3, 0.55, 0.62, 0.035], [-0.35, -0.1, 0.86, 0.05]]) { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), bub); b.position.set(x, y, z); body.add(b); }
  // face decal: front window of a slightly larger sphere, painted, alpha-cut, no ink (drawn lines)
  const faces = { angry: faceTex('angry'), roar: faceTex('roar'), happy: faceTex('happy'), confused: faceTex('confused'), calm: faceTex('calm') };
  const faceMat = A.animeShader({ uMap: { value: faces.angry } }, /* glsl */ `
${A.GLSL.NOISE}
${A.GLSL.GLOBAL_PARS}
uniform sampler2D uMap;
void main(){ vec4 t = texture(uMap, vUv); if(t.a < 0.5) discard; writeOut(t.rgb, 0.0, normalize(vNV), vDepth, 22.0); }`, { side: THREE.FrontSide });
  // three's phi: x = -cos(phi) sin(theta); front (+z) is phi = pi/2... use rotation instead: window centred on +z
  const fgeo = new THREE.SphereGeometry(1.006, 48, 28, Math.PI / 2 - 0.85, 1.7, 0.62, 0.95);
  { // phiStart window around phi = pi/2 maps to +z? x=-cos(pi/2)=0, z=sin(pi/2)=1 yes; flip u so the face is not mirrored
    const uv = fgeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i));
    const p = fgeo.attributes.position, v = V3(); for (let i = 0; i < p.count; i++) { shape(v.fromBufferAttribute(p, i)); p.setXYZ(i, v.x, v.y, v.z); } fgeo.computeVertexNormals();
  }
  const face = new THREE.Mesh(fgeo, faceMat); body.add(face);
  // crown
  const goldM = A.celMaterial({ base: '#ffcf4a', shade: '#b9792a', id: 24, highlight: 0.9, hiSize: 0.9, rimColor: '#fff6c8' });
  const gemM = A.celMaterial({ base: '#ff4a6a', shade: '#a01a4a', id: 25, highlight: 0.9, emissive: '#ff4a6a', emissiveAmt: 0.15 });
  const crown = new THREE.Group(); crown.position.set(0.08, 0.86, 0.05); crown.rotation.z = -0.18; body.add(crown);
  crown.add(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.08, 24, 1, true), goldM));
  const spikes = []; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; spikes.push({ geo: new THREE.ConeGeometry(0.04, 0.12, 6).translate(Math.cos(a) * 0.17, 0.09, Math.sin(a) * 0.17) }); }
  crown.add(new THREE.Mesh(mergeGeos(spikes), goldM));
  for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + 0.6; const gm = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), gemM); gm.position.set(Math.cos(a) * 0.185, 0, Math.sin(a) * 0.185); crown.add(gm); }
  // poking pseudopod
  const poke = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14).scale(1, 1, 1.8), jelly); body.add(poke);

  const bp = base.attributes.position, gp = geo.attributes.position, v = V3();
  const fb = fgeo.attributes.position.clone(), fp = fgeo.attributes.position;
  function jiggle(t, amt) {
    for (let i = 0; i < bp.count; i++) {
      v.fromBufferAttribute(bp, i);
      const w = 1 + amt * (0.035 * Math.sin(t * 9 + v.y * 5 + v.x * 3) + 0.025 * Math.sin(t * 13 - v.z * 4));
      gp.setXYZ(i, v.x * w, v.y * (1 + (w - 1) * 0.5), v.z * w);
    }
    gp.needsUpdate = true; geo.computeVertexNormals();
    for (let i = 0; i < fb.count; i++) {
      v.fromBufferAttribute(fb, i);
      const w = 1 + amt * (0.035 * Math.sin(t * 9 + v.y * 5 + v.x * 3) + 0.025 * Math.sin(t * 13 - v.z * 4));
      fp.setXYZ(i, v.x * w, v.y * (1 + (w - 1) * 0.5), v.z * w);
    }
    fp.needsUpdate = true;
  }
  let lastJ = -1;
  ctx.api.slime = { root, body, crown };
  return {
    update(st) {
      const S = st.plan?.slime; root.visible = !!S?.on; if (!S?.on) return;
      root.position.set(...S.pos); root.rotation.y = S.ry ?? 0;
      const R = S.R ?? 8.5, sq = S.sq ?? 1;
      body.scale.set(R / Math.sqrt(sq), R * sq, R / Math.sqrt(sq));
      body.position.y = R * sq * 0.3;
      body.rotation.set(S.lean?.[0] ?? 0, 0, S.lean?.[1] ?? 0);
      const tj = Math.floor(st.t * 12) / 12, key = tj * 10 + (S.jig ?? 0.3);
      if (key !== lastJ) { jiggle(tj, S.jig ?? 0.3); lastJ = key; }
      faceMat.uniforms.uMap.value = faces[S.face] ?? faces.angry;
      const pk = S.poke ?? 0; poke.visible = pk > 0.01; poke.position.set(0.25, -0.1, 0.75 + pk * 0.5); poke.scale.setScalar(0.35 + pk * 0.3);
    },
  };
}
