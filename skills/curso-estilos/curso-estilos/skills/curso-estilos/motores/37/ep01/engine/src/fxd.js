// fxd.js - drawn FX (ours), animated on threes by direction (st.plan.fx):
//   sprites: [{k: 'note'|'note2'|'star'|'spark'|'heart'|'sweat'|'vein'|'swirl', p:[x,y,z], s}]  upright painted cards, no ink
//   shadows: [{p:[x,y,z], r, a}]   multiply-blended ground shadow with a wobbly hard edge (the growing piano shadow)
//   puffs:   [{p:[x,y,z], r}]      cartoon dust balls (cel + ink)
//   rings:   [{p:[x,y,z], r, w}]   flat shockwave rings
//   chips:   [{p:[x,y,z], r:[x,y,z], k:0|1}] flying piano keys (white / black)
import * as THREE from 'three';

const KINDS = ['note', 'note2', 'star', 'spark', 'heart', 'sweat', 'vein', 'swirl'];
function atlas() {
  const C = 128, N = KINDS.length;
  const c = document.createElement('canvas'); c.width = C * N; c.height = C;
  const g = c.getContext('2d'); g.lineJoin = 'round'; g.lineCap = 'round';
  const INK = '#22161c';
  const cell = (i, fn) => { g.save(); g.translate(i * C, 0); fn(); g.restore(); };
  const note = (two) => {
    g.fillStyle = '#fff4d8'; g.strokeStyle = INK; g.lineWidth = 7;
    const heads = two ? [[38, 96], [92, 84]] : [[50, 96]];
    g.beginPath();
    if (two) { g.moveTo(52, 94); g.lineTo(52, 22); g.lineTo(106, 10); g.lineTo(106, 82); g.moveTo(52, 22); g.lineTo(106, 10); g.lineTo(106, 30); g.lineTo(52, 42); }
    else { g.moveTo(64, 94); g.lineTo(64, 14); g.quadraticCurveTo(70, 40, 100, 50); g.quadraticCurveTo(90, 40, 64, 34); }
    g.stroke();
    for (const [x, y] of heads) { g.beginPath(); g.ellipse(x, y, 18, 13, -0.45, 0, 7); g.fill(); g.stroke(); }
    g.lineWidth = 9; g.strokeStyle = '#fff4d8'; g.beginPath(); if (!two) { g.moveTo(64, 80); g.lineTo(64, 20); } g.stroke();
    g.strokeStyle = INK; g.lineWidth = 3.5; g.beginPath(); if (!two) { g.moveTo(58, 80); g.lineTo(58, 22); g.moveTo(70, 80); g.lineTo(70, 22); } g.stroke();
  };
  cell(0, () => note(false));
  cell(1, () => note(true));
  cell(2, () => {   // star
    g.fillStyle = '#ffe14a'; g.strokeStyle = INK; g.lineWidth = 6; g.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 22 : 54; g.lineTo(64 + Math.cos(a) * r, 66 + Math.sin(a) * r); }
    g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fffbe0'; g.beginPath(); g.arc(54, 56, 8, 0, 7); g.fill();
  });
  cell(3, () => {   // 4-point sparkle
    g.fillStyle = '#fffbe8'; g.strokeStyle = '#f0b040'; g.lineWidth = 4; g.beginPath();
    g.moveTo(64, 6); g.quadraticCurveTo(68, 60, 122, 64); g.quadraticCurveTo(68, 68, 64, 122); g.quadraticCurveTo(60, 68, 6, 64); g.quadraticCurveTo(60, 60, 64, 6);
    g.fill(); g.stroke();
  });
  cell(4, () => {   // heart
    g.fillStyle = '#ff7c9c'; g.strokeStyle = INK; g.lineWidth = 6; g.beginPath();
    g.moveTo(64, 110); g.bezierCurveTo(10, 70, 14, 20, 46, 22); g.bezierCurveTo(58, 22, 64, 34, 64, 42); g.bezierCurveTo(64, 34, 70, 22, 82, 22); g.bezierCurveTo(114, 20, 118, 70, 64, 110);
    g.fill(); g.stroke(); g.fillStyle = '#ffe0ea'; g.beginPath(); g.ellipse(42, 44, 9, 6, -0.6, 0, 7); g.fill();
  });
  cell(5, () => {   // sweat drop
    g.fillStyle = '#bfe6ff'; g.strokeStyle = '#2a4a8a'; g.lineWidth = 5; g.beginPath();
    g.moveTo(64, 10); g.quadraticCurveTo(100, 70, 92, 92); g.arc(64, 90, 28, 0.1, Math.PI - 0.1); g.quadraticCurveTo(28, 70, 64, 10); g.fill(); g.stroke();
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(54, 86, 7, 12, 0.3, 0, 7); g.fill();
  });
  cell(6, () => {   // anger vein
    g.strokeStyle = '#e0303a'; g.lineWidth = 13;
    for (const [a, b] of [[[20, 50], [50, 50]], [[50, 20], [50, 50]], [[78, 50], [108, 50]], [[78, 20], [78, 50]], [[20, 78], [50, 78]], [[50, 78], [50, 108]], [[78, 78], [108, 78]], [[78, 78], [78, 108]]]) { g.beginPath(); g.moveTo(...a); g.quadraticCurveTo((a[0] + b[0]) / 2 + 6, (a[1] + b[1]) / 2 - 6, ...b); g.stroke(); }
  });
  cell(7, () => {   // dizzy swirl
    g.strokeStyle = INK; g.lineWidth = 7; g.beginPath();
    for (let k = 0; k < 60; k++) { const a = k * 0.32, r = 4 + k * 0.85; g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); }
    g.stroke();
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t;
}

export function create(ctx) {
  const { A, scene } = ctx;
  const G = new THREE.Group(); G.name = 'FXD'; scene.add(G);
  // sprites: upright billboards (engine card vertex shader), atlas cell from instanceColor.r
  const spriteMat = A.animeShader({ uMap: { value: atlas() }, uN: { value: KINDS.length }, uSway: { value: 0 } }, /* glsl */ `
${A.GLSL.NOISE}
${A.GLSL.GLOBAL_PARS}
uniform sampler2D uMap; uniform float uN;
void main(){
  vec2 uv = vec2((vColor.r * uN + vUv.x) / uN, vUv.y);
  vec4 t = texture(uMap, uv);
  if(t.a < 0.5) discard;
  writeOut(t.rgb, 0.12, vec3(0.0, 0.0, 1.0), vDepth, 92.0);
}`, { side: THREE.DoubleSide, defines: { ANIME_CARD: '' } });
  const NS = 260;
  const sprites = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), spriteMat, NS); sprites.frustumCulled = false; G.add(sprites);
  sprites.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NS * 3), 3);
  // multiply shadow
  const shadowMat = A.animeShader({ uTint: { value: new THREE.Color('#6a5ea0') } }, /* glsl */ `
${A.GLSL.NOISE}
${A.GLSL.GLOBAL_PARS}
uniform vec3 uTint;
void main(){
  vec2 q = vUv * 2.0 - 1.0; float d = length(q) + (vnoise(q * 7.0 + vColor.g * 13.0) - 0.5) * 0.06;
  if(d > 1.0) discard;
  float a = vColor.r;
  oColor = vec4(mix(vec3(1.0), uTint, a), 1.0); oData = vec4(1.0);
}`, { side: THREE.DoubleSide });
  shadowMat.transparent = true; shadowMat.depthWrite = false; shadowMat.blending = THREE.CustomBlending;
  shadowMat.blendEquation = THREE.AddEquation; shadowMat.blendSrc = THREE.ZeroFactor; shadowMat.blendDst = THREE.SrcColorFactor;
  shadowMat.polygonOffset = true; shadowMat.polygonOffsetFactor = -4; shadowMat.polygonOffsetUnits = -4;
  const NSH = 4;
  const shadows = new THREE.InstancedMesh(new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), shadowMat, NSH); shadows.frustumCulled = false; shadows.renderOrder = 5; G.add(shadows);
  shadows.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NSH * 3), 3);
  // dust puffs (cel white, inked)
  const NP = 60;
  const puffs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 3), A.celMaterial({ base: '#fbf6ee', shade: '#b8b4d4', id: 2, highlight: 0, wobble: 2 }), NP); puffs.frustumCulled = false; G.add(puffs);
  // rings
  const NR = 6;
  const ringMat = A.fxMaterial({ color: '#ffffff', intensity: 1.2, bloom: 0.5, id: 93 });
  const rings = []; for (let i = 0; i < NR; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64).rotateX(-Math.PI / 2), ringMat); G.add(m); rings.push(m); }
  // piano key chips
  const NC = 40;
  const chipW = new THREE.InstancedMesh(new THREE.BoxGeometry(0.026, 0.024, 0.15), A.celMaterial({ base: '#fbf8ef', shade: '#bdbad4', id: 33 }), NC);
  const chipB = new THREE.InstancedMesh(new THREE.BoxGeometry(0.016, 0.024, 0.1), A.celMaterial({ base: '#24222c', shade: '#101018', id: 34 }), NC);
  chipW.frustumCulled = chipB.frustumCulled = false; G.add(chipW, chipB);

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3(), c = new THREE.Color();
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  return {
    update(st) {
      const F = st.plan?.fx ?? {};
      const S = F.sprites ?? [];
      for (let i = 0; i < NS; i++) {
        const it = S[i];
        if (!it) { sprites.setMatrixAt(i, ZERO); continue; }
        sprites.setMatrixAt(i, m4.compose(p3.set(...it.p), q.identity(), s3.set(it.s * (it.flip ? -1 : 1), it.s, 1)));
        sprites.setColorAt(i, c.setRGB(Math.max(0, KINDS.indexOf(it.k)) / KINDS.length, 0, 0));   // atlas cell as a 0..1 fraction (the shader adds vUv.x / uN); the raw index sampled past the atlas edge, so only notes ever showed
      }
      sprites.count = NS; sprites.instanceMatrix.needsUpdate = true; sprites.instanceColor.needsUpdate = true;
      const SH = F.shadows ?? [];
      for (let i = 0; i < NSH; i++) {
        const it = SH[i]; if (!it) { shadows.setMatrixAt(i, ZERO); continue; }
        shadows.setMatrixAt(i, m4.compose(p3.set(...it.p), q.identity(), s3.set(it.r * (it.sx ?? 1), 1, it.r * (it.sz ?? 1))));
        shadows.setColorAt(i, c.setRGB(it.a ?? 0.8, i * 0.37, 0));
      }
      shadows.instanceMatrix.needsUpdate = true; shadows.instanceColor.needsUpdate = true;
      const P = F.puffs ?? [];
      for (let i = 0; i < NP; i++) { const it = P[i]; puffs.setMatrixAt(i, it ? m4.compose(p3.set(...it.p), q.identity(), s3.setScalar(it.r)) : ZERO); }
      puffs.instanceMatrix.needsUpdate = true;
      const R = F.rings ?? [];
      rings.forEach((m, i) => { const it = R[i]; m.visible = !!it; if (it) { m.position.set(...it.p); m.scale.set(it.r, 1, it.r); } });
      const CH = F.chips ?? [];
      let nw = 0, nb = 0;
      for (const it of CH) {
        m4.compose(p3.set(...it.p), q.setFromEuler(e.set(...it.r)), s3.setScalar(it.s ?? 1));
        if (it.k) { if (nb < NC) chipB.setMatrixAt(nb++, m4); } else if (nw < NC) chipW.setMatrixAt(nw++, m4);
      }
      for (let i = nw; i < NC; i++) chipW.setMatrixAt(i, ZERO);
      for (let i = nb; i < NC; i++) chipB.setMatrixAt(i, ZERO);
      chipW.instanceMatrix.needsUpdate = chipB.instanceMatrix.needsUpdate = true;
    },
  };
}
