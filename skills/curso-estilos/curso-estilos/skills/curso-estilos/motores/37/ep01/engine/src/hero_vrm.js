// hero_vrm.js - TAKU as a ready-made rigged VRM (VRoid "HairSample_Male", CC0, see FONTES.md), drawn with the
// same anime cel materials as the procedural hero (2 tones + highlight band + rim, ink from the post pass).
// Same contract as hero.js: posed every frame from st.plan.hero = {on, pos, ry, rx, rz, pose:{joint:[x,y,z]}, face,
// prop:{R}}; the procedural joint eulers are retargeted onto the VRM normalized humanoid bones.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import { CHAR } from './shots.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const Q = () => new THREE.Quaternion();
const E2Q = (e) => new THREE.Quaternion().setFromEuler(new THREE.Euler(e[0] ?? 0, e[1] ?? 0, e[2] ?? 0));
// modelo padrão: ../modelo/HairSample_Male.vrm (CC0). Para usar o seu: ponha o .vrm em modelo/ e abra com &vrm=../modelo/seu.vrm
const URL_VRM = new URLSearchParams(location.search).get('vrm') || '../modelo/HairSample_Male.vrm';

// procedural rig: joint -> parent (only rotations matter for the retarget)
const PARENT = { hips: 'body', spine: 'hips', neck: 'spine', head: 'neck',
  shoulderL: 'spine', elbowL: 'shoulderL', wristL: 'elbowL', shoulderR: 'spine', elbowR: 'shoulderR', wristR: 'elbowR',
  hipL: 'hips', kneeL: 'hipL', ankleL: 'kneeL', hipR: 'hips', kneeR: 'hipR', ankleR: 'kneeR' };
const ORDER = ['hips', 'spine', 'neck', 'head', 'shoulderL', 'elbowL', 'wristL', 'shoulderR', 'elbowR', 'wristR', 'hipL', 'kneeL', 'ankleL', 'hipR', 'kneeR', 'ankleR'];
// procedural "L" sits at +x facing +z = the character's left
const BONE = { hips: 'hips', spine: 'spine', neck: 'neck', head: 'head',
  shoulderL: 'leftUpperArm', elbowL: 'leftLowerArm', wristL: 'leftHand', shoulderR: 'rightUpperArm', elbowR: 'rightLowerArm', wristR: 'rightHand',
  hipL: 'leftUpperLeg', kneeL: 'leftLowerLeg', ankleL: 'leftFoot', hipR: 'rightUpperLeg', kneeR: 'rightLowerLeg', ankleR: 'rightFoot' };
const REST = { shoulderL: [0, 0, 0.1], shoulderR: [0, 0, -0.1], elbowL: [-0.15, 0, 0], elbowR: [-0.15, 0, 0] };
// C: VRM0 model space faces -z; the film's characters face +z
const C = new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), Math.PI), Ci = C.clone().invert();
// D: maps the VRM rest direction of the bone (root space) onto the procedural rest direction (-y). Arms: T-pose -> hanging
const D = {}; for (const j of ORDER) D[j] = Q();
for (const j of ['shoulderL', 'elbowL', 'wristL']) D[j] = new THREE.Quaternion().setFromAxisAngle(V3(0, 0, 1), -Math.PI / 2);
for (const j of ['shoulderR', 'elbowR', 'wristR']) D[j] = new THREE.Quaternion().setFromAxisAngle(V3(0, 0, 1), Math.PI / 2);

// expressions: VRM blendshapes + texture swaps (shrunk pupil, no highlight) for the anime faces
const EXPR = {
  normal: {}, tired: { blink: 0.42, sad: 0.35 }, closed: { blink: 1 }, dazed: { blink: 0.28, sad: 0.2 },
  shock: { Surprised: 1, oh: 0.75, pupil: 0.32, noHi: true, gloom: true }, happy: { happy: 1, aa: 0.4 }, blow: { blink: 0.85, ou: 1, happy: 0.0 },
  panic: { Surprised: 0.9, ee: 0.6, pupil: 0.4, noHi: true }, wow: { Surprised: 0.55, aa: 0.7, sparkle: true },
  determined: { angry: 0.8, ou: 0.35 },
};

function canvasOf(img) { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); return c; }
function texOf(c, like) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.flipY = like?.flipY ?? false; t.anisotropy = 8; t.wrapS = like?.wrapS ?? THREE.RepeatWrapping; t.wrapT = like?.wrapT ?? THREE.RepeatWrapping; t.needsUpdate = true; return t; }
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
// recolour by luminance onto a 2-colour ramp (keeps the painted folds, changes the hue)
function ramp(img, dark, light, gain = 1, levels = 0) {
  const c = canvasOf(img), g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height), p = d.data;
  const a = hex(dark), b = hex(light);
  for (let i = 0; i < p.length; i += 4) {
    let L = Math.min(1, ((0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2]) / 255) * gain);
    if (levels > 1) L = Math.min(1, Math.round(L * (levels - 1) + 0.15) / (levels - 1));
    for (let k = 0; k < 3; k++) p[i + k] = a[k] + (b[k] - a[k]) * L;
  }
  g.putImageData(d, 0, 0); return c;
}
// iris: brown recolour; variant with the iris shrunk to a dot around each eye's centre (shock)
function irisVariants(img) {
  const base = ramp(img, CHAR.iris[0], CHAR.iris[1], 1.6);
  // keep the white surround white (the iris map is opaque white outside the iris)
  const g0 = base.getContext('2d'), d0 = g0.getImageData(0, 0, base.width, base.height), src = canvasOf(img).getContext('2d').getImageData(0, 0, img.width, img.height).data;
  const W = base.width, H = base.height; const box = [[1e9, 1e9, -1, -1], [1e9, 1e9, -1, -1]];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, L = (src[i] + src[i + 1] + src[i + 2]) / 765;
    if (L > 0.92) { d0.data[i] = src[i]; d0.data[i + 1] = src[i + 1]; d0.data[i + 2] = src[i + 2]; }
    else if (src[i + 3] > 128) { const b = box[x < W / 2 ? 0 : 1]; b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y); }
  }
  g0.putImageData(d0, 0, 0);
  const shrink = (k) => {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, W, H);
    for (const b of box) {
      if (b[2] < 0) continue; const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2 + (b[3] - b[1]) * 0.04, rw = (b[2] - b[0]) / 2, rh = (b[3] - b[1]) / 2;
      g.fillStyle = '#1e1214'; g.beginPath(); g.ellipse(cx, cy, rw * k, rh * k * 0.95, 0, 0, 7); g.fill();
    }
    return c;
  };
  return { base, shrink };
}

// face skin texture: VRoid paints soft gradients (the "game" look); snap every near-skin pixel to one flat tone,
// keep the drawn marks (mouth line, blush, nostril) that differ strongly from it
function flatSkin(img) {
  const c = canvasOf(img), g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height), p = d.data;
  const sk = hex(CHAR.skin);
  for (let i = 0; i < p.length; i += 4) {
    const dr = p[i] - sk[0], dg = p[i + 1] - sk[1], db = p[i + 2] - sk[2], dist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (dist < 70) { p[i] = sk[0]; p[i + 1] = sk[1]; p[i + 2] = sk[2]; }
  }
  g.putImageData(d, 0, 0); return c;
}

export async function create(ctx) {
  const { A, scene } = ctx;
  const loader = new GLTFLoader(); loader.register((p) => new VRMLoaderPlugin(p));
  const gltf = await loader.loadAsync(URL_VRM);
  const vrm = gltf.userData.vrm;
  const root = new THREE.Group(); root.name = 'TAKU'; scene.add(root);
  const wrap = new THREE.Group(); wrap.quaternion.copy(C); root.add(wrap); wrap.add(vrm.scene);
  const SCALE = +(ctx.q.get('vscale') ?? 1.02); wrap.scale.setScalar(SCALE);

  // ---------------- materials: MToon -> anime cel (texture as the base colour, shade = a cooler multiplier)
  const recol = new Map();
  const kind = (n) => /Outline/.test(n) ? 'outline' : /Hair/.test(n) ? 'hair' : /Tops/.test(n) ? 'tops' : /Bottoms/.test(n) ? 'bottoms' : /Shoes/.test(n) ? 'shoes'
    : /EyeIris/.test(n) ? 'iris' : /EyeHighlight/.test(n) ? 'hilite' : /EyeWhite/.test(n) ? 'white' : /EyeExtra/.test(n) ? 'extra'
      : /Eyelash|Eyeline|Brow/.test(n) ? 'line' : /FaceMouth/.test(n) ? 'mouth' : 'skin';
  const SET = {
    skin: { id: 1, shade: '#e0bbc0', hi: 0 }, mouth: { id: 1, flat: true }, white: { id: 1, flat: true }, iris: { id: 1, flat: true, cut: 0.5 },
    hilite: { id: 1, flat: true, cut: 0.5, po: true }, line: { id: 1, flat: true, cut: 0.5, po: true }, extra: { hide: true },
    hair: { id: 3, shade: CHAR.hairShade, hi: 0.6, hiSize: 0.93, hiColor: CHAR.hairHi, cut: 0.5, side: THREE.DoubleSide },
    tops: { id: 4, shade: CHAR.topsShade, hi: 0, cut: 0.5, side: THREE.DoubleSide }, bottoms: { id: 6, shade: CHAR.bottomsShade, hi: 0, cut: 0.5 },
    shoes: { id: 7, shade: '#8a7f8f', hi: 0.6, cut: 0.5 }, outline: { hide: true },
  };
  let irisMat = null, irisTex = null, hiMeshes = [], faceMat = null, faceTex = null;
  const made = new Map();
  vrm.scene.traverse((o) => {
    if (!o.isMesh) return;
    o.frustumCulled = false;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const out = mats.map((m) => {
      const k = kind(m.name); const s = SET[k];
      if (s.hide) { if (k === 'outline') { const inv = new THREE.MeshBasicMaterial(); inv.visible = false; return inv; } o.visible = false; return m; }
      if (made.has(m.name)) return made.get(m.name);
      let map = m.map ?? null;
      if (map && k === 'bottoms') map = texOf(ramp(map.image, CHAR.bottoms[0], CHAR.bottoms[1], 2.2, 3), map);
      if (map && k === 'hair') map = texOf(ramp(map.image, CHAR.hair[0], CHAR.hair[1], 2.4, 3), map);
      if (map && k === 'tops') map = texOf(ramp(map.image, CHAR.tops[0], CHAR.tops[1], 1.25, 3), map);
      if (map && /Face_00_SKIN/.test(m.name)) map = texOf(flatSkin(map.image), map);
      if (map && k === 'iris') { irisTex = irisVariants(map.image); const b = texOf(irisTex.base, map); irisTex.T = { base: b, shrink: {} }; irisTex.like = map; map = b; }
      const tint = m.color ? '#' + m.color.getHexString(THREE.SRGBColorSpace) : '#ffffff';
      const faceFlat = /Face_00_SKIN/.test(m.name);
      const cm = A.celMaterial({ base: tint, shade: s.shade ?? tint, id: s.id, map, flat: !!s.flat || faceFlat, highlight: s.hi ?? 0, hiSize: s.hiSize ?? 0.97,
        hiColor: s.hiColor, rimColor: '#fff2dc', alphaCut: s.cut ?? 0, side: s.side ?? THREE.FrontSide, polygonOffset: !!s.po, wobble: 0.7 });
      if (k === 'iris') irisMat = cm;
      if (/Face_00_SKIN/.test(m.name) && map) {   // shock variant: drawn gloom lines over the upper face
        const c = canvasOf(map.image), g = c.getContext('2d'), W = c.width, Hh = c.height;
        g.strokeStyle = 'rgba(70,80,150,0.6)'; g.lineCap = 'round'; g.lineWidth = W * 0.006;
        for (let i = 0; i < 17; i++) { const x = W * (0.3 + i * 0.025); g.beginPath(); g.moveTo(x, Hh * 0.16); g.lineTo(x, Hh * (0.36 + (i % 3) * 0.035)); g.stroke(); }
        faceMat = cm; faceTex = { base: map, gloom: texOf(c, map) };
      }
      made.set(m.name, cm); return cm;
    });
    o.material = Array.isArray(o.material) ? out : out[0];
    if (mats.some((m) => kind(m.name) === 'hilite')) hiMeshes.push(o);
  });

  // ---------------- tie (Taku's red tie over the white top), on the upper chest
  const H = vrm.humanoid;
  const nb = (n) => H.getNormalizedBoneNode(n), rb = (n) => H.getRawBoneNode(n);
  const tieShape = new THREE.Shape(); tieShape.moveTo(-0.017, 0); tieShape.lineTo(0.017, 0); tieShape.lineTo(0.032, -0.25); tieShape.lineTo(0, -0.29); tieShape.lineTo(-0.032, -0.25); tieShape.closePath();
  const tieMat = A.celMaterial({ base: CHAR.tie?.[0] ?? '#d23a3f', shade: CHAR.tie?.[1] ?? '#8e1f33', id: 5, highlight: 0.3, rimColor: '#fff2dc' });
  const tie = new THREE.Mesh(new THREE.ExtrudeGeometry(tieShape, { depth: 0.012, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 1 }), tieMat);
  const knot = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10).scale(0.024, 0.02, 0.014), tieMat);
  const tieG = new THREE.Group(); tieG.add(tie, knot); tie.position.set(0, -0.012, 0);
  const TIE = (ctx.q.get('tie') ?? '0,0.075,0.098,-0.18').split(',').map(Number);   // [x, y, z(front), tilt] in root axes, from upperChest
  const ucRaw = rb('upperChest') ?? rb('chest');
  ucRaw.add(tieG); tieG.position.set(-TIE[0], TIE[1], -TIE[2]); tieG.quaternion.copy(Ci).multiply(new THREE.Quaternion().setFromAxisAngle(V3(1, 0, 0), TIE[3]));
  tieG.visible = !!CHAR.tie && ctx.q.get('notie') !== '1';

  // ---------------- anchors used by cameras / props (oriented like the procedural joints)
  const J = {};
  const headRaw = rb('head');
  J.head = new THREE.Group(); headRaw.add(J.head); J.head.position.set(0, 0.085, 0); J.head.quaternion.copy(Ci); J.head.scale.set(0.66, 1.0, 0.78);   // procedural mouth offset (0,-.075,.12) -> VRM mouth
  const handR = rb('rightHand'), handL = rb('leftHand');
  J.gripR = new THREE.Group(); handR.add(J.gripR); J.gripR.quaternion.copy(Ci).multiply(D.wristR.clone().invert()); J.gripR.position.copy(V3(0, -0.075, 0.03).applyQuaternion(J.gripR.quaternion));
  J.gripL = new THREE.Group(); handL.add(J.gripL); J.gripL.quaternion.copy(Ci).multiply(D.wristL.clone().invert()); J.gripL.position.copy(V3(0, -0.075, 0.03).applyQuaternion(J.gripL.quaternion));
  J.body = wrap;

  // phone in the right hand (same as the procedural hero)
  const phone = new THREE.Group(); phone.name = 'phone';
  phone.add(new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.15, 0.009), A.celMaterial({ base: '#2a2a36', shade: '#14141c', id: 8, highlight: 0.8, hiSize: 0.9 })));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.064, 0.138), A.fxMaterial({ color: '#a8dcff', intensity: 1.15, bloom: 0.6 })); scr.position.z = 0.0052; phone.add(scr);
  J.gripR.add(phone); phone.position.set(0, 0.0, 0.0); phone.rotation.set(-1.2, 0, 0);

  const hipsRest = nb('hips').position.clone();
  const FING = ['Thumb', 'Index', 'Middle', 'Ring', 'Little'], SEG = ['Proximal', 'Intermediate', 'Distal'];
  function fingers(side, curl, thumb) {
    const s = side === 'left' ? 1 : -1;
    for (const f of FING) for (let i = 0; i < 3; i++) {
      const n = nb(side + f + SEG[i]); if (!n) continue;
      if (f === 'Thumb') n.quaternion.setFromEuler(new THREE.Euler(0, s * thumb * 0.3 * (i === 0 ? 1 : 0), s * thumb * (i === 0 ? 0.35 : 0.7)));
      else n.quaternion.setFromAxisAngle(V3(0, 0, 1), s * curl * (i === 0 ? 0.9 : 1.0) * (1 + 0.06 * FING.indexOf(f)));
    }
  }
  const exprNames = vrm.expressionManager ? vrm.expressionManager.expressions.map((e) => e.expressionName) : [];
  console.log('[hero_vrm] mats', [...made.keys()].join(','));console.log('[hero_vrm] expressions', exprNames.join(','));
  let lastFace = null;
  function setFace(face) {
    const em = vrm.expressionManager; if (!em) return;
    const E = EXPR[face] ?? EXPR.normal;
    for (const n of exprNames) em.setValue(n, 0);
    for (const [k, v] of Object.entries(E)) if (typeof v === 'number' && exprNames.includes(k)) em.setValue(k, v);
    em.update();
    if (face !== lastFace && irisMat && irisTex) {
      let t = irisTex.T.base;
      if (E.pupil) { t = irisTex.T.shrink[E.pupil] ??= texOf(irisTex.shrink(E.pupil), irisTex.like); }
      irisMat.uniforms.uMap.value = t;
      lastFace = face;
    }
    for (const m of hiMeshes) m.visible = !E.noHi;
    if (faceMat) faceMat.uniforms.uMap.value = E.gloom ? faceTex.gloom : faceTex.base;
  }

  const qs = {}, ms = {};
  const api = {
    root, J, phone, vrm,
    anchor(name) { const o = J[name] ?? J.head; o.updateWorldMatrix(true, false); return o.getWorldPosition(V3()); },
    apply(h) {
      h = h ? { ...h } : h;
      root.visible = !!h?.on; if (!h?.on) return;
      root.position.set(...(h.pos ?? [0, 0, 0])); root.rotation.set(h.rx ?? 0, h.ry ?? 0, h.rz ?? 0, 'YXZ');
      wrap.position.set(...(h.bodyOff ?? [0, 0, 0]));
      const pose = { ...(h.pose ?? {}) };
      // neck stretch fix: the VRoid neck skin tears past ~0.3 rad of pitch; cap neck/head pitch, push the rest into the spine
      { const nk = [...(pose.neck ?? [0, 0, 0])], hd = [...(pose.head ?? [0, 0, 0])], sp = [...(pose.spine ?? [0, 0, 0])];
        const tot = nk[0] + hd[0], lo = -0.42, hi = 0.5;
        const cap = Math.min(hi, Math.max(lo, tot)), extra = tot - cap;
        nk[0] = cap * 0.35; hd[0] = cap * 0.65; sp[0] += extra * 0.55;
        nk[1] = (nk[1] ?? 0); hd[1] = Math.max(-0.6, Math.min(0.6, hd[1] ?? 0));
        pose.neck = nk; pose.head = hd; pose.spine = sp; }
      // stiff legs fix: soft knees + ankle compensation + a little contrapposto unless the shot asks for straight legs
      if (h.idle !== false && !h.rx) {
        const add = (j, v) => { const e = [...(pose[j] ?? REST[j] ?? [0, 0, 0])]; for (let i = 0; i < 3; i++) e[i] += v[i] ?? 0; pose[j] = e; };
        const kb = h.knees ?? 0.16;
        add('hipL', [-kb * 0.5, 0, 0]); add('hipR', [-kb * 0.5 - 0.05, 0, 0]); add('kneeL', [kb, 0, 0]); add('kneeR', [kb + 0.1, 0, 0]);
        add('ankleL', [-kb * 0.5, 0, 0]); add('ankleR', [-kb * 0.5 - 0.05, 0, 0]);
        h = { ...h, hipsY: (h.hipsY ?? 0.95) - 0.012 - kb * 0.03 };
      }
      qs.body = Q();
      for (const j of ORDER) { const e = pose[j] ?? REST[j] ?? [0, 0, 0]; qs[j] = qs[PARENT[j]].clone().multiply(E2Q(e)); }
      // model-space rotation of each mapped bone, then local = parent^-1 * own
      for (const j of ORDER) ms[j] = Ci.clone().multiply(qs[j]).multiply(D[j]).multiply(C);
      for (const j of ORDER) {
        const p = PARENT[j]; const par = p === 'body' ? Q() : ms[p];
        nb(BONE[j]).quaternion.copy(par.clone().invert().multiply(ms[j]));
      }
      for (const n of ['chest', 'upperChest', 'leftShoulder', 'rightShoulder', 'leftToes', 'rightToes']) nb(n)?.quaternion.identity();
      nb('hips').position.copy(hipsRest).add(V3(0, ((h.hipsY ?? 0.95) - 0.95) * (hipsRest.y / 0.95), 0));
      const grip = h.prop?.R === 'phone' ? 0.95 : 0.55;
      fingers('right', h.gripR ?? grip, 0.5); fingers('left', h.gripL ?? 0.5, 0.4);
      H.update();
      setFace(h.face);
      phone.visible = h.prop?.R === 'phone';
      root.updateMatrixWorld(true);
    },
  };
  ctx.api.hero = api;
  return { update(st) {
    api.apply(st.plan?.hero);
    // sweat drops: glue them to the temple of this (bigger) head instead of the procedural head's world position
    const sp = st.plan?.fx?.sprites; if (!sp || !root.visible) return;
    const hc = api.anchor('head');
    { const cp = st.cam?.pos; const cam = cp ? new THREE.Vector3(cp.x, cp.y, cp.z) : hc.clone().add(V3(0, 0, 2));
      const fwd = cam.clone().sub(hc).normalize(), right = V3(0, 1, 0).cross(fwd).normalize(), up = fwd.clone().cross(right).normalize();
      const dist = Math.max(0.2, cam.distanceTo(hc) - 0.2), vh = Math.tan(((st.cam?.fov ?? 40) * Math.PI / 180) / 2) * dist, vw = vh * 9 / 16;
      for (const s of sp) if (s.rel) {   // rel = [side(-1..1), up, slide]; offsets clamped to the visible frame (close-ups are tight)
        const ox = s.rel[0] * Math.min(0.15, vw * 0.62), oy = Math.min(0.11, vh * 0.36) * (1.0 + s.rel[1]) - (s.rel[2] ?? 0) * Math.min(0.08, vh * 0.25);
        const w = hc.clone().add(right.clone().multiplyScalar(ox)).add(up.clone().multiplyScalar(oy)).add(fwd.clone().multiplyScalar(0.2));
        s.p = [w.x, w.y, w.z]; s.s = Math.min(s.s ?? 0.08, vh * 0.32); s._vrm = true; } }
    for (const s of sp) if (s.k === 'sweat' && !s._vrm && Math.hypot(s.p[0] - hc.x, s.p[1] - hc.y, s.p[2] - hc.z) < 0.7) {
      const side = s.p[0] >= hc.x ? 1 : -1, slide = s.p[1] - 1.75;
      const w = J.head.localToWorld(V3(side * 0.13, 0.07 + slide, 0.15));
      s.p = [w.x, w.y, w.z]; s.s = Math.max(s.s, 0.075); s._vrm = true;
    }
  } };
}
