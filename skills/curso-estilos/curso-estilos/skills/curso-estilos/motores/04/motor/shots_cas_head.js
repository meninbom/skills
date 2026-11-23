// O Caseiro (série voxel própria): shared head for every episode; the tail module places the shots by the voice timeline. Render with ?norocket&data=data.
// Every frame is a pure function of t. Character, device, cable, sign and letters are original voxel designs.
import * as THREE from 'three';
import { buildWorld, NX, M, mulberry32, SPOT, POND, ROCKET, ICECAM } from './world.mjs';
import { drawText, textWidth, G, ACC, MARK } from './pixelfont.js';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const V = (x, y, z) => new THREE.Vector3(x, y, z);

export async function makeShots(ctx) {
  const { scene, camera, U, L, COMMON, SHADOW_GLSL, OW, OH, fin, dof, atm, K, P } = ctx;
  const W = buildWorld();
  const gh = (x, z) => W.H[Math.floor(x) + NX * Math.floor(z)] + 1; // walkable surface height
  const fxScene = new THREE.Scene();
  const rnd = mulberry32(2110);

  // ------------------------------------------------------------ shared prop lighting (same as the story engine)
  const LIT = /* glsl */`
vec3 propLight(vec3 p, vec3 n){
  float sh = moonShadow(p, n, ign(gl_FragCoord.xy) * 6.28, 0.022);
  vec3 lit = (SKY_HOR * 0.9 + SKY_ZEN * 2.) * (0.55 + 0.45 * n.y) * 1.2;
  lit += MOON_COL * max(0., dot(n, MOON_DIR)) * sh * 1.25;
  lit += beamAt(p + n * 0.01, n, true) + postLight(p + n * 0.03, n, true);
  vec3 lp = LANT_P - p; float ld = length(lp); lit += LANT_C * uLantFlick * max(0., dot(n, lp / ld)) / (ld * ld + 0.15);
  if(uPortal > 0.){ vec3 pl = uPortalC - p; float pd = dot(pl, pl); lit += uPortalCol * uPortal * (max(0., dot(n, pl * inversesqrt(pd))) * 0.85 + 0.15) * 2.6 / (pd + 1.5); }
  if(uFire.w > 0.){ vec3 fl = uFire.xyz - p; float fd = dot(fl, fl); lit += vec3(2.4, 1.25, 0.55) * uFire.w * (max(0., dot(n, fl * inversesqrt(fd))) * 0.8 + 0.2) * 7. / (fd + 2.); }
  return lit;
}`;
  const VERT = `varying vec3 vL; varying vec3 vLN; varying vec3 vN; varying vec3 vW;
      void main(){ vL = position; vLN = normal; vec4 lp = vec4(position, 1.); vec3 ln = normal;
        #ifdef USE_INSTANCING
        lp = instanceMatrix * lp; ln = mat3(instanceMatrix) * ln;
        #endif
        vN = normalize(mat3(modelMatrix) * ln); vec4 w = modelMatrix * lp; vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
  const FACE_UV = /* glsl */`
  vec3 a = abs(vLN);
  vec2 uv = a.x > .5 ? vL.zy : (a.y > .5 ? vL.xz : vL.xy);
  if(vLN.x < -.5 || vLN.z < -.5) uv.x = -uv.x;
  vec2 fu = clamp(uv + 0.5, 0., 0.999); vec2 tx = floor(fu * 16.);
  bool top = vLN.y > .5, bottom = vLN.y < -.5, front = vLN.z > .5, back = vLN.z < -.5, side = a.x > .5;
  float fs = dot(vLN, vec3(1., 2., 3.));
  float e = min(min(fu.x, 1. - fu.x), min(fu.y, 1. - fu.y));
  float bevel = 1. + 0.14 * (1. - smoothstep(0., 0.05, e));`;

  // ------------------------------------------------------------ prop blocks (device, buttons, sign, letters, cable)
  const blockMat = (mat, seed = 0) => new THREE.ShaderMaterial({
    uniforms: { ...U, uMat: { value: mat }, uSeed: { value: seed }, uGlow: { value: 0 } },
    vertexShader: VERT,
    fragmentShader: /* glsl */`
${COMMON}
${SHADOW_GLSL}
${LIT}
uniform int uMat; uniform float uSeed, uGlow;
varying vec3 vL; varying vec3 vLN; varying vec3 vN; varying vec3 vW;
void main(){
  ${FACE_UV}
  float n1 = h13(vec3(tx, uSeed * 7.1 + fs)), n2 = h13(vec3(floor(tx / 4.), uSeed + fs + 5.));
  vec3 alb = vec3(0.3); vec3 emis = vec3(0);
  if(uMat == 10){ // device shell: dark olive steel, hazard band low on the front, screws in the corners
    alb = vec3(0.05, 0.056, 0.042) * (0.75 + 0.45 * n2) * (0.9 + 0.2 * n1);
    if(front && tx.y >= 1. && tx.y <= 4.) alb = mod(tx.x + tx.y, 6.) < 3. ? vec3(0.62, 0.42, 0.02) : vec3(0.02);
    if((front || side) && (tx.x == 1. || tx.x == 14.) && (tx.y == 14. || tx.y == 6.)) alb = vec3(0.18, 0.18, 0.17);
  } else if(uMat == 11){ // big red STOP button
    alb = vec3(0.45, 0.025, 0.02) * (0.85 + 0.25 * n1); emis = vec3(1.4, 0.07, 0.035) * uGlow * (top ? 1. : 0.5);
  } else if(uMat == 12){ // amber LAUNCH button
    alb = vec3(0.50, 0.30, 0.02) * (0.85 + 0.25 * n1); emis = vec3(1.25, 0.62, 0.06) * uGlow * (top ? 1. : 0.5);
  } else if(uMat == 13){ // painted letter blocks (chipped red paint over wood)
    alb = vec3(0.50, 0.045, 0.035) * (0.85 + 0.25 * n1); if(n1 > 0.9) alb = vec3(0.30, 0.19, 0.10);
  } else if(uMat == 14){ // rubber cable
    alb = vec3(0.018, 0.018, 0.02) * (0.8 + 0.4 * n1);
  } else if(uMat == 4){ // planks (sign board)
    float row = floor(tx.y / 4.); alb = vec3(0.40, 0.26, 0.14) * (0.8 + 0.3 * h13(vec3(row, uSeed, fs))) * (0.9 + 0.15 * n1);
    if(mod(tx.y, 4.) < 0.5) alb *= 0.5;
    if(top) alb = vec3(0.80, 0.84, 0.90) * (0.93 + 0.08 * n1); // snow on the top edge
  } else if(uMat == 2){ // log post
    alb = vec3(0.20, 0.13, 0.07) * (0.6 + 0.7 * h13(vec3(tx.x, floor(tx.y / 6.), uSeed + fs)));
    if(top) alb = vec3(0.80, 0.84, 0.90);
  } else if(uMat == 15){ // red LED
    alb = vec3(0.1, 0.01, 0.01); emis = vec3(1.6, 0.12, 0.06) * uGlow;
  } else if(uMat == 17){ // purple blocks (#5B2EEA), lit from inside a little so they read at night
    alb = vec3(0.16, 0.035, 0.62) * (0.82 + 0.25 * n1); emis = vec3(0.16, 0.035, 0.62) * uGlow * (0.8 + 0.3 * n2);
    if(top) alb = mix(alb, vec3(0.80, 0.84, 0.90), 0.7); // a dusting of snow on top
  } else if(uMat == 18){ // the figure in the dark: near-black cloth, only the moon rim reads
    alb = vec3(0.006, 0.006, 0.008) * (0.8 + 0.4 * n1);
  } else if(uMat == 16){ // sweat drop
    alb = vec3(0.45, 0.62, 0.80); emis = vec3(0.02, 0.03, 0.045) * (1. - smoothstep(0.2, 0.5, length(fu - vec2(0.35, 0.7))));
  }
  vec3 col = alb * propLight(vW, normalize(vN)) * bevel + emis;
  gl_FragColor = vec4(col, 1.);
}` });
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const box = (mat, w, h, d, x, y, z, parent) => { const b = new THREE.Mesh(boxGeo, mat); b.scale.set(w, h, d); b.position.set(x, y, z); b.frustumCulled = false; parent.add(b); return b; };

  // ------------------------------------------------------------ the character: original voxel guy in a purple hoodie
  const charMat = (part, seed) => new THREE.ShaderMaterial({
    uniforms: { ...U, uPart: { value: part }, uSeed: { value: seed }, uLook: { value: new THREE.Vector2(0, 0) }, uWide: { value: 0 }, uMouth: { value: 0 }, uBrow: { value: 0 }, uBlink: { value: 0 } },
    vertexShader: VERT,
    fragmentShader: /* glsl */`
${COMMON}
${SHADOW_GLSL}
${LIT}
uniform int uPart; uniform float uSeed, uWide, uMouth, uBrow, uBlink; uniform vec2 uLook;
varying vec3 vL; varying vec3 vLN; varying vec3 vN; varying vec3 vW;
void main(){
  ${FACE_UV}
  float n1 = h13(vec3(tx, uSeed * 7.1 + fs));
  vec3 SKIN = vec3(0.30, 0.185, 0.125), HAIR = vec3(0.024, 0.018, 0.015), HOOD = vec3(0.30, 0.075, 0.016), DEN = vec3(0.05, 0.07, 0.13), SHOE = vec3(0.028, 0.028, 0.032);
  vec3 alb = SKIN;
  if(uPart == 0){ // head: front face drawn texel by texel
    if(top || back) alb = HAIR * (0.75 + 0.5 * n1);
    else if(bottom) alb = SKIN * 0.7;
    else if(side){ alb = tx.y >= 11. ? HAIR * (0.75 + 0.5 * n1) : SKIN * (0.95 + 0.08 * n1); if(tx.y >= 6. && tx.y <= 8. && tx.x >= 6. && tx.x <= 8.) alb = SKIN * 0.8; if(tx.y >= 7. && tx.x <= 3.) alb = HAIR * 0.9; }
    else {
      alb = SKIN * (0.96 + 0.07 * n1);
      if(tx.y >= 13.) alb = HAIR * (0.75 + 0.5 * n1);
      if(tx.y == 12. && (tx.x < 6. || tx.x > 12.)) alb = HAIR;
      bool browL = tx.x >= 2. && tx.x <= 5., browR = tx.x >= 10. && tx.x <= 13.;
      float inner = (tx.x == 5. || tx.x == 10.) ? 1. : 0.;
      if((browL || browR) && tx.y == 10. + inner * step(0.5, uBrow)) alb = HAIR;
      float eh = uWide > 0.5 ? 3. : 2.;
      bool eyeL = tx.x >= 3. && tx.x <= 5., eyeR = tx.x >= 10. && tx.x <= 12.;
      if((eyeL || eyeR) && uBlink > 0.5){ if(tx.y == 6.) alb = HAIR * 1.4; }
      else if((eyeL || eyeR) && tx.y >= 6. && tx.y < 6. + eh){
        alb = vec3(0.80, 0.79, 0.76);
        float cx = (eyeL ? 4. : 11.) + uLook.x, cy = 6. + uLook.y + (eh > 2. ? 0.5 : 0.);
        if(tx.x == cx && abs(tx.y - cy) < 1.) alb = vec3(0.018, 0.012, 0.01);
      }
      if(tx.y == 4. && (tx.x == 7. || tx.x == 8.)) alb = SKIN * 0.72;
      if(tx.x >= 6. && tx.x <= 9.){
        if(uMouth > -0.5 && uMouth < 0.5 && tx.y == 2.) alb = vec3(0.12, 0.04, 0.035);
        if(uMouth < -0.5 && ((tx.y == 2. && tx.x > 6. && tx.x < 9.) || (tx.y == 3. && (tx.x == 6. || tx.x == 9.)))) alb = vec3(0.12, 0.04, 0.035);
        if(uMouth > 0.5 && (tx.y == 1. || tx.y == 2.)) alb = (tx.y == 1. && tx.x > 6. && tx.x < 9.) ? vec3(0.30, 0.07, 0.06) : vec3(0.07, 0.02, 0.02);
      }
      if(tx.y <= 3. && n1 > 0.74) alb *= 0.84; // stubble
    }
  } else if(uPart == 1){ // torso: hoodie with kangaroo pocket and drawstrings
    alb = HOOD * (0.88 + 0.2 * n1);
    if(front){
      if(tx.y >= 2. && tx.y <= 7. && tx.x >= 3. && tx.x <= 12.){ alb *= 0.86; if(tx.y == 7. || tx.x == 3. || tx.x == 12.) alb *= 0.7; }
      if((tx.x == 6. || tx.x == 9.) && tx.y >= 9.) alb = vec3(0.72, 0.70, 0.66);
      if(tx.y >= 14.) alb = HOOD * 0.62;
    }
    if(back && tx.y >= 9. && tx.x >= 3. && tx.x <= 12.) alb *= 0.8;
    if(tx.y <= 1.) alb = HOOD * 0.72;
  } else if(uPart == 2){ // arm: sleeve, cuff, hand
    alb = HOOD * (0.88 + 0.2 * n1);
    if(tx.y == 4.) alb = HOOD * 0.65;
    if(tx.y <= 3. || bottom) alb = SKIN * (0.95 + 0.08 * n1);
  } else if(uPart == 3){ // thigh: jeans
    alb = DEN * (0.85 + 0.3 * n1); if(side && tx.x == 8.) alb *= 0.7;
  } else { // shin + shoe
    alb = DEN * (0.85 + 0.3 * n1);
    if(tx.y <= 4. || bottom) alb = SHOE * (0.8 + 0.4 * n1);
    if(tx.y == 0. && !bottom) alb = vec3(0.55, 0.54, 0.52);
    if(top) alb = DEN;
  }
  vec3 col = alb * propLight(vW, normalize(vN)) * bevel;
  gl_FragColor = vec4(col, 1.);
}` });
  const guy = new THREE.Group(); guy.name = 'guy'; scene.add(guy);
  const mHead = charMat(0, 1), mTorso = charMat(1, 2), mArm = charMat(2, 3), mThigh = charMat(3, 4), mShin = charMat(4, 5);
  const J = {}; // joints
  const joint = (name, parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); J[name] = g; return g; };
  const hips = joint('hips', guy, 0, 0.82, 0);
  box(mTorso, 0.56, 0.68, 0.32, 0, 0.34, 0, joint('chest', hips, 0, 0, 0));
  const neck = joint('neck', J.chest, 0, 0.68, 0); box(mHead, 0.52, 0.52, 0.52, 0, 0.26, 0, neck); J.head = neck;
  for (const [s, k] of [[-1, 'L'], [1, 'R']]) {
    const sh = joint('arm' + k, J.chest, s * 0.40, 0.62, 0); box(mArm, 0.24, 0.70, 0.26, 0, -0.33, 0, sh);
    const hp = joint('thigh' + k, hips, s * 0.14, 0, 0); box(mThigh, 0.26, 0.42, 0.28, 0, -0.21, 0, hp);
    const kn = joint('shin' + k, hp, 0, -0.42, 0); box(mShin, 0.26, 0.40, 0.28, 0, -0.20, 0.0, kn);
  }
  const sweat = box(blockMat(16, 9), 0.07, 0.10, 0.05, 0.31, 0.40, 0.18, neck);
  guy.scale.setScalar(0.88); guy.traverse(o => o.frustumCulled = false);
  const face = { look: mHead.uniforms.uLook.value, set(w, m, b, bl = 0) { mHead.uniforms.uWide.value = w; mHead.uniforms.uMouth.value = m; mHead.uniforms.uBrow.value = b; mHead.uniforms.uBlink.value = bl; } };
  function pose(p) { // p: rotations in radians; missing = 0
    for (const n of ['chest', 'head', 'armL', 'armR', 'thighL', 'thighR', 'shinL', 'shinR']) { const r = p[n] || [0, 0, 0]; J[n].rotation.set(r[0], r[1], r[2]); }
    J.hips.position.y = p.hipY ?? 0.82;
  }

  // ------------------------------------------------------------ the 'bomb': hazard box, countdown display, two buttons
  const device = new THREE.Group(); scene.add(device);
  const mDev = blockMat(10, 31), mStop = blockMat(11, 32), mLaunch = blockMat(12, 33), mLed = blockMat(15, 34);
  box(mDev, 0.86, 0.40, 0.60, 0, 0.20, 0, device);
  box(mDev, 0.40, 0.15, 0.16, 0, 0.475, -0.16, device);
  const bStop = box(mStop, 0.19, 0.07, 0.19, -0.22, 0.435, 0.12, device);
  const bLaunch = box(mLaunch, 0.19, 0.07, 0.19, 0.22, 0.435, 0.12, device);
  box(mDev, 0.25, 0.04, 0.25, -0.22, 0.41, 0.12, device); box(mDev, 0.25, 0.04, 0.25, 0.22, 0.41, 0.12, device);
  const led = box(mLed, 0.035, 0.035, 0.035, 0.36, 0.43, -0.2, device);
  device.traverse(o => o.frustumCulled = false);
  // textured plates: labels under each button + the countdown display (pixel font, lit like the world + a little glow)
  const plateMat = (canvas, glowCol, lit = 1) => {
    const tex = new THREE.CanvasTexture(canvas); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.NoColorSpace;
    return new THREE.ShaderMaterial({ uniforms: { ...U, tMap: { value: tex }, uGlowCol: { value: new THREE.Vector3(...glowCol) }, uLit: { value: lit } }, transparent: false,
      vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `${COMMON}\n${SHADOW_GLSL}\n${LIT}\nuniform sampler2D tMap; uniform vec3 uGlowCol; uniform float uLit; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main(){ vec4 c = texture2D(tMap, vUv); vec3 a = pow(c.rgb, vec3(2.2)); gl_FragColor = vec4(a * propLight(vW, normalize(vN)) * uLit + a * uGlowCol, 1.); }` });
  };
  const textCanvas = (str, w, h, fg, bg, px = 1) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    x.fillStyle = bg; x.fillRect(0, 0, w, h); drawText(x, str, Math.round((w - textWidth(str, px)) / 2), Math.round((h - 7 * px) / 2), px, fg, { shadow: null }); return c; };
  const plate = (mat, w, h, x, y, z, rx, parent) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.x = rx; m.frustumCulled = false; parent.add(m); return m; };
  const LBL = {};
  for (const [k, x] of [['STOP', -0.22], ['LAUNCH', 0.22], ['RESUME', -0.22], ['EXIT', 0.22]])
    LBL[k] = plate(plateMat(textCanvas(k, 40, 11, '#f2ece0', '#1a1c18'), [0.03, 0.03, 0.028]), 0.36, 0.10, x, 0.30, 0.301 + (k === 'RESUME' || k === 'EXIT' ? 0.001 : 0), 0, device);
  const dispCanvas = document.createElement('canvas'); dispCanvas.width = 35; dispCanvas.height = 11;
  const dispMat = plateMat(dispCanvas, [0.9, 0.05, 0.03], 0.15);
  plate(dispMat, 0.38, 0.12, 0, 0.475, -0.079, 0, device);
  const drawDisplay = s => { const x = dispCanvas.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#050303'; x.fillRect(0, 0, 33, 11); drawText(x, s, 2, 2, 1, '#ff3b22', { shadow: null }); dispMat.uniforms.tMap.value.needsUpdate = true; };

  // ------------------------------------------------------------ cable from the box across the snow to the pad
  const cable = new THREE.Group(); scene.add(cable);
  { const mC = blockMat(14, 41);
    const pts = [[SPOT.x + 0.5, SPOT.z - 0.4], [SPOT.x + 1.6, SPOT.z + 1.8], [SPOT.x + 2.4, SPOT.z + 4.2], [77.6, 60.4], [79.0, 62.4], [80.3, 63.6]];
    const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => V(x, 0, z)));
    const N = 120; let prev = null;
    for (let i = 0; i <= N; i++) { const p = curve.getPoint(i / N); p.y = gh(p.x, p.z) + 0.04 + 0.02 * Math.sin(i * 1.3);
      if (prev) { const s = new THREE.Mesh(boxGeo, mC); s.scale.set(0.07, 0.07, prev.distanceTo(p) + 0.02); s.position.copy(prev).lerp(p, 0.5); s.lookAt(p); s.frustumCulled = false; cable.add(s); }
      prev = p; } }

  // ------------------------------------------------------------ voxel text from the pixel font (accents included)
  function blockText(lines, cell, mat, depth = 0.9) {
    const pts = [];
    lines.forEach((ln, row) => { const chars = [...ln]; const wpx = chars.length * 6 - 1; let cx = -wpx / 2; const y0 = (lines.length - 1 - row) * 11;
      for (const ch of chars) { let base = ch, mark = null; if (ACC[ch]) [base, mark] = ACC[ch]; const g = G[base] || G['?'];
        g.forEach((r, j) => { for (let i = 0; i < 5; i++) if (r[i] === '#') pts.push([cx + i, y0 + 6 - j]); });
        if (mark === 'ced') MARK.ced.forEach((r, k) => { for (let i = 0; i < 5; i++) if (r[i] === '#') pts.push([cx + i, y0 - 1 - k]); });
        else if (mark) MARK[mark].forEach((r, k) => { for (let i = 0; i < 5; i++) if (r[i] === '#') pts.push([cx + i, y0 + 8 - k]); });
        cx += 6; } });
    const inst = new THREE.InstancedMesh(boxGeo, mat, pts.length); const m4 = new THREE.Matrix4();
    pts.forEach(([x, y], n) => { m4.compose(V((x + 0.5) * cell, (y + 0.5) * cell, 0), new THREE.Quaternion(), V(cell * 0.97, cell * 0.97, cell * depth)); inst.setMatrixAt(n, m4); });
    inst.frustumCulled = false; return inst;
  }
  // ------------------------------------------------------------ THIN ICE sign with the words in voxel blocks
  const sign = new THREE.Group(); scene.add(sign);
  { const mP = blockMat(4, 51), mPost = blockMat(2, 52), mL = blockMat(13, 53);
    box(mPost, 0.14, 1.7, 0.14, -0.7, 0.85, -0.06, sign); box(mPost, 0.14, 1.7, 0.14, 0.7, 0.85, -0.06, sign);
    box(mP, 1.75, 0.42, 0.08, 0, 1.55, 0, sign); box(mP, 1.75, 0.42, 0.08, 0, 1.11, 0, sign);
    const words = ['THIN', 'ICE'], cell = 0.058;
    const inst = new THREE.InstancedMesh(boxGeo, mL, 400); let n = 0; const m4 = new THREE.Matrix4();
    words.forEach((wd, row) => { const wpx = [...wd].length * 6 - 1; let cx = -wpx * cell / 2;
      for (const ch of wd) { G[ch].forEach((r, j) => { for (let i = 0; i < 5; i++) if (r[i] === '#') { m4.compose(V(cx + (i + 0.5) * cell, (row === 0 ? 1.55 : 1.11) + (3 - j) * cell, 0.07), new THREE.Quaternion(), V(cell * 0.96, cell * 0.96, 0.06)); inst.setMatrixAt(n++, m4); } }); cx += 6 * cell; } });
    inst.count = n; inst.frustumCulled = false; sign.add(inst);
    sign.traverse(o => o.frustumCulled = false); }

  // ------------------------------------------------------------ hand lantern (warm key light on the ice)
  const lantern = new THREE.Group(); scene.add(lantern);
  { const mDk = blockMat(14, 61), mGl = blockMat(12, 62); mGl.uniforms.uGlow.value = 1.4;
    box(mDk, 0.2, 0.04, 0.2, 0, 0.16, 0, lantern); box(mDk, 0.2, 0.04, 0.2, 0, -0.1, 0, lantern); box(mGl, 0.14, 0.22, 0.14, 0, 0.03, 0, lantern);
    box(mDk, 0.03, 0.12, 0.03, 0, 0.24, 0, lantern); lantern.traverse(o => o.frustumCulled = false); }

  // ------------------------------------------------------------ overlay: pixel captions + the 1/2 game badges
  const ov = document.createElement('canvas'); ov.width = OW; ov.height = OH;
  const oc = ov.getContext('2d'); oc.imageSmoothingEnabled = false;
  const ovTex = new THREE.CanvasTexture(ov); ovTex.minFilter = THREE.LinearFilter; ovTex.magFilter = THREE.LinearFilter; ovTex.generateMipmaps = false;
  fin.m.uniforms.tOv.value = ovTex;
  function caption(words, active, y = 1430, said = null, cold = false) { // one group of words, the spoken one in warm gold (same style as the approved story)
    const w8 = words.reduce((s, w) => s + textWidth(w, 8), 0) + 40 * (words.length - 1), px = w8 > 860 ? 7 : 8, sp = 5 * px; const total = words.reduce((s, w) => s + textWidth(w, px), 0) + sp * (words.length - 1);
    let x = Math.round((OW - total) / 2);
    oc.fillStyle = 'rgba(12,10,26,0.55)'; oc.fillRect(x - 34, y - 30, total + 68, 7 * px + 60);
    words.forEach((w, i) => { oc.globalAlpha = said && !said[i] ? 0.42 : 1; drawText(oc, w, x, y, px, cold ? '#bfe8ff' : (i === active ? '#ffc65a' : '#fff1d8')); oc.globalAlpha = 1; x += textWidth(w, px) + sp; });
  }
  const toPx = p => { const v = p.clone().project(camera); return [(v.x * 0.5 + 0.5) * OW, (-v.y * 0.5 + 0.5) * OH]; };

  // ------------------------------------------------------------ O Caseiro props
  // her lantern, left lit on the ice
  const lantern2 = new THREE.Group(); scene.add(lantern2);
  { const mDk = blockMat(14, 63), mGl2 = blockMat(12, 64); mGl2.uniforms.uGlow.value = 1.4; lantern2.userData.glass = mGl2;
    box(mDk, 0.2, 0.04, 0.2, 0, 0.16, 0, lantern2); box(mDk, 0.2, 0.04, 0.2, 0, -0.1, 0, lantern2); box(mGl2, 0.14, 0.22, 0.14, 0, 0.03, 0, lantern2);
    box(mDk, 0.03, 0.12, 0.03, 0, 0.24, 0, lantern2); lantern2.traverse(o => o.frustumCulled = false); lantern2.visible = false; }
  // the figure in the dark: a still silhouette, standing or kneeling (no face, only the shape)
  const mVul = blockMat(18, 71);
  const vulto = new THREE.Group(); scene.add(vulto);
  const vultoStand = new THREE.Group(), vultoKneel = new THREE.Group(); vulto.add(vultoStand, vultoKneel);
  box(mVul, 0.50, 0.66, 0.30, 0, 1.12, 0, vultoStand); box(mVul, 0.44, 0.46, 0.44, 0, 1.70, 0, vultoStand);
  box(mVul, 0.20, 0.68, 0.24, -0.36, 1.10, 0, vultoStand); box(mVul, 0.20, 0.68, 0.24, 0.36, 1.10, 0, vultoStand);
  box(mVul, 0.22, 0.80, 0.26, -0.13, 0.40, 0, vultoStand); box(mVul, 0.22, 0.80, 0.26, 0.13, 0.40, 0, vultoStand);
  box(mVul, 0.50, 0.62, 0.30, 0, 0.86, 0.06, vultoKneel); box(mVul, 0.44, 0.46, 0.44, 0, 1.40, 0.10, vultoKneel); // kneeling, bent over the ice
  box(mVul, 0.20, 0.62, 0.24, -0.36, 0.80, 0.14, vultoKneel); box(mVul, 0.20, 0.62, 0.24, 0.36, 0.80, 0.14, vultoKneel);
  box(mVul, 0.50, 0.26, 0.60, 0, 0.20, -0.12, vultoKneel);
  vulto.traverse(o => o.frustumCulled = false); vulto.visible = false;
  // the note nailed to the door (paper, facing the path) and the warm light of the door left open
  const noteCv = textCanvas('REGRAS', 30, 22, '#3a2a1c', '#d9cdb2');
  const note = plate(plateMat(noteCv, [0.05, 0.045, 0.035]), 0.34, 0.25, 97.5, 12.45, 51.985, 0, scene); note.rotation.y = Math.PI;
  const mDoor = blockMat(12, 72); mDoor.uniforms.uGlow.value = 0;
  const doorGlow = box(mDoor, 0.92, 1.92, 0.02, 97.5, 12.0, 51.975, scene); doorGlow.visible = false;
  // the radio on his belt: dark box, short antenna, a LED that blinks while it talks
  const mRadLed = blockMat(15, 73);
  box(blockMat(14, 74), 0.10, 0.16, 0.06, 0.27, -0.02, 0.06, J.hips); box(blockMat(14, 75), 0.015, 0.12, 0.015, 0.30, 0.12, 0.06, J.hips);
  box(mRadLed, 0.025, 0.025, 0.025, 0.25, 0.04, 0.095, J.hips);
  // the note, close up, drawn on screen: paper card, the rules appear one by one (lines: [text, ink])
  function bilhete(lines, shown, a = 1, y0 = 520) {
    const s = 7, lh = 7 * s + 26, w = 21 * 6 * s + 110, h = lines.length * lh + 180, x0 = Math.round((OW - w) / 2);
    oc.save(); oc.globalAlpha = a; oc.translate(OW / 2, y0 + h / 2); oc.rotate(-0.025); oc.translate(-OW / 2, -(y0 + h / 2));
    oc.fillStyle = 'rgba(0,0,0,0.45)'; oc.fillRect(x0 + 14, y0 + 18, w, h);
    oc.fillStyle = '#ddd1b6'; oc.fillRect(x0, y0, w, h);
    oc.fillStyle = '#c9bb9b'; for (let k = 0; k < 7; k++) oc.fillRect(x0, y0 + 60 + k * lh, w, 3);
    oc.fillStyle = '#6a5a44'; oc.fillRect(x0 + w / 2 - 8, y0 + 14, 16, 16); // the nail
    drawText(oc, 'REGRAS', Math.round(OW / 2 - textWidth('REGRAS', 7) / 2), y0 + 36, 7, '#5a4632', { shadow: null }); // the same word as the note on the door
    lines.forEach(([txt, ink], i) => { const k = clamp(shown - i); if (k <= 0) return; oc.globalAlpha = a * k;
      drawText(oc, txt, x0 + 55, y0 + 105 + i * lh, s, ink || '#2b1f15', { shadow: null }); });
    oc.restore();
  }

  function badge(n, p, dy = -150) { // a small numbered tile floating above an option, linked by a short stem
    const [x, y] = toPx(p); const s = 9, w = textWidth(String(n), s) + 44, h = 7 * s + 40;
    oc.fillStyle = 'rgba(12,10,26,0.72)'; oc.fillRect(Math.round(x - w / 2), Math.round(y + dy - h / 2), w, h);
    oc.fillStyle = '#fff1d8'; oc.fillRect(Math.round(x - 2), Math.round(y + dy + h / 2), 4, Math.round(-dy - h / 2 - 22));
    drawText(oc, String(n), Math.round(x - textWidth(String(n), s) / 2), Math.round(y + dy - 7 * s / 2), s, '#fff1d8');
  }

  const setCamera = (p, tg, fov) => { camera.fov = fov; camera.position.copy(p); camera.lookAt(tg); camera.updateMatrixWorld(true); camera.updateProjectionMatrix(); };
  const fox = scene.getObjectByName('fox');
  const DY = gh(SPOT.x, SPOT.z); // ground at the device spot