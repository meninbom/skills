// BIBLIOTECA DE PODERES: anatomia comum (carga → disparo → viagem → impacto → resíduo), forma/cor/física por elemento.
// Cada poder: criar(scene, cfg) → { cor, atualizar(qf, ctx3) , desenhar(ctx2d, qf, ctx3) }.
// ctx3 = { B (beats), mao: V3, alvo: V3, heroi: V3, proj(v)->[x,y], t }. Tudo determinístico (hash), tudo função do quadro.
import * as THREE from 'three';
import { E, clamp, lerp, hash } from './tokens.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), ss = new THREE.Vector3(), vv = new THREE.Vector3(), ee = new THREE.Euler();
const ESCONDE = (im, i) => { m4.compose(vv.set(0, -9, 0), qq.identity(), ss.set(1e-4, 1e-4, 1e-4)); im.setMatrixAt(i, m4); };
function aditivo(cor, op = 1) { return new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }); }
// esfera "chama": núcleo claro, borda colorida, ruído animado (fresnel invertido)
function matChama(nucleo, borda) {
  return new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uA: { value: 1 }, uN: { value: new THREE.Color(nucleo) }, uB: { value: new THREE.Color(borda) } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP;
void main(){ vP = position; vec4 p = vec4(position, 1.0); vec3 n = normal;
#ifdef USE_INSTANCING
  p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
#endif
  vec4 mv = modelViewMatrix * p; vV = -mv.xyz; vN = normalMatrix * n; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uT, uA; uniform vec3 uN, uB; varying vec3 vN; varying vec3 vV; varying vec3 vP;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9,78.2,37.7)))*43758.5); }
      float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
        return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
      void main(){ float d = abs(dot(normalize(vN), normalize(vV))); float nz = n3(vP*6.0 + vec3(0.0, -uT*4.0, uT*1.3));
        float core = smoothstep(0.35, 1.0, d + nz*0.25); vec3 c = mix(uB, uN, core); float a = smoothstep(0.0, 0.5, d + nz*0.3 - 0.15) * uA;
        gl_FragColor = vec4(c * a * 1.4, a); }`,
  });
}

// ============================== FOGO ==============================
// carga: brasa cresce na mão | viagem 150→180: bola em arco com rastro | impacto: explosão (casca + línguas) | resíduo: fumaça, brasas, chão queimado
export function fogo(scene) {
  const bola = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), matChama('#fff3c0', '#ff5a10')); scene.add(bola);
  const halo = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), matChama('#ffb040', '#ff2a00')); scene.add(halo);
  const casca = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), matChama('#fff0b0', '#ff3a00')); scene.add(casca);
  const NR = 34, rastro = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), aditivo('#ff6a18', 0.28), NR); rastro.frustumCulled = false; scene.add(rastro);
  const NB = 140, brasas = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.012, 0), aditivo('#ffb050'), NB); brasas.frustumCulled = false; scene.add(brasas);
  const NF = 16, fumaca = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshLambertMaterial({ color: '#4a3a40', transparent: true, opacity: 0.55, depthWrite: false }), NF); fumaca.frustumCulled = false; scene.add(fumaca);
  const queimado = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({ color: '#1e120c', transparent: true, opacity: 0, depthWrite: false })); queimado.rotation.x = -Math.PI / 2; scene.add(queimado);
  const NL = 10, linguas = new THREE.InstancedMesh(new THREE.ConeGeometry(0.08, 0.6, 7, 1, true).translate(0, 0.3, 0), matChama('#ffe08a', '#ff4a00'), NL); linguas.frustumCulled = false; scene.add(linguas);
  const caminho = (u, c) => { const p = c.mao.clone().lerp(c.alvo, u); p.y += Math.sin(Math.PI * u) * 0.45; return p; };
  return {
    cor: { particula: '#ffb060', luzMao: '#ffa050', luzImp: '#ff8a30', anel: '#ffc070', numero: 'fogo', selo: ['QUEIMANDO', '#e2581e'], tinta: '#3a2418', dano: 98 },
    atualizar(qf, c) {
      const { B } = c; const t = qf / 60;
      for (const m of [bola.material, halo.material, casca.material, linguas.material]) m.uniforms.uT.value = t;
      // bola: cresce na mão durante a carga, voa em arco, some no impacto
      const carga = clamp((qf - B.carga0) / (B.solta - B.carga0)), voo = (qf - B.solta) / (B.impacto - B.solta);
      let p = null, r = 0;
      if (qf >= B.carga0 && qf < B.solta) { p = c.mao.clone().add(V3(0.06, 0.02, 0)); r = 0.03 + 0.09 * E.out3(carga) * (1 + 0.08 * Math.sin(t * 30)); }
      else if (voo >= 0 && voo < 1) { p = caminho(E.in2(voo), c); r = 0.13 + 0.03 * Math.sin(t * 40); }
      bola.visible = halo.visible = !!p; if (p) { bola.position.copy(p); bola.scale.setScalar(r); halo.position.copy(p); halo.scale.setScalar(r * 1.8); halo.material.uniforms.uA.value = 0.55; }
      // rastro: amostras do caminho no passado
      for (let i = 0; i < NR; i++) { const uu = (qf - i * 0.55 - B.solta) / (B.impacto - B.solta); if (uu < 0 || uu > 1 || qf - B.impacto > i * 0.55) { ESCONDE(rastro, i); continue; }
        const k = (1 - i / NR); m4.compose(caminho(E.in2(uu), c).add(V3(0, Math.sin(i + t * 9) * 0.01, 0)), qq.identity(), ss.setScalar(0.1 * k * k + 0.008)); rastro.setMatrixAt(i, m4); }
      rastro.instanceMatrix.needsUpdate = true;
      // explosão: casca 0→1,1 em 10 q; línguas sobem e afinam; brasas; fumaça sobe e cresce 80 q
      const ui = qf - B.impacto;
      casca.visible = ui >= 0 && ui < 22; if (casca.visible) { casca.position.copy(c.alvo).add(V3(0, 0.15, 0)); casca.scale.setScalar(0.15 + 0.85 * E.out3(ui / 10)); casca.material.uniforms.uA.value = 1 - E.in2(ui / 22); }
      for (let i = 0; i < NL; i++) { if (ui < 0 || ui > 34) { ESCONDE(linguas, i); continue; } const a = i / NL * 6.28 + hash(i) * 0.5, k = E.out3(ui / 8) * (1 - E.in2((ui - 10) / 24));
        ee.set(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5); qq.setFromEuler(ee); m4.compose(vv.copy(c.alvo).add(V3(Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12)), qq, ss.set(k * (1 + hash(i + 3)), k * (1.2 + hash(i + 4) * 1.3), k * (1 + hash(i + 3)))); linguas.setMatrixAt(i, m4); }
      linguas.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < NB; i++) { const nasce = i < 60 ? B.impacto : B.impacto + (i - 60) * 2.2, u = (qf - nasce) / 70; if (u < 0 || u > 1) { ESCONDE(brasas, i); continue; }
        const a = hash(i) * 6.28, sp = i < 60 ? 1.6 + 1.6 * hash(i + 1) : 0.25; const y = 0.2 + (i < 60 ? (2.2 * hash(i + 2) + 0.5) * u * 1.1 - 2.4 * u * u : u * 1.6);
        m4.compose(vv.copy(c.alvo).add(V3(Math.cos(a) * sp * u * 0.5 + Math.sin(u * 9 + i) * 0.04, Math.max(0.02, y), Math.sin(a) * sp * u * 0.5)), qq.identity(), ss.setScalar(1.5 * (1 - u))); brasas.setMatrixAt(i, m4); }
      brasas.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < NF; i++) { const u = (qf - B.impacto - 4 - i * 2) / 110; if (u < 0 || u > 1) { ESCONDE(fumaca, i); continue; }
        const a = hash(i + 9) * 6.28; m4.compose(vv.copy(c.alvo).add(V3(Math.cos(a) * 0.25 * E.out3(u * 2) + u * 0.2, 0.25 + u * 1.5 + hash(i) * 0.2, Math.sin(a) * 0.2)), qq.identity(), ss.setScalar((0.12 + 0.3 * E.out3(u)) * (0.7 + 0.6 * hash(i + 2)))); fumaca.setMatrixAt(i, m4); }
      fumaca.instanceMatrix.needsUpdate = true; fumaca.material.opacity = 0.5 * (1 - clamp((qf - B.impacto - 60) / 80));
      queimado.position.copy(c.alvo).setY(0.013); queimado.scale.setScalar(0.5 * E.out3((qf - B.impacto) / 10)); queimado.material.opacity = ui > 0 ? 0.55 : 0;
    },
    desenhar(ctx, qf, c) { // calor/brilho de tela
      const ui = qf - c.B.impacto; if (ui < 0 || ui > 60) return; const [x, y] = c.proj(c.alvo.clone().add(V3(0, 0.3, 0)));
      ctx.save(); ctx.globalCompositeOperation = 'screen'; const r = 450, g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,170,80,${0.35 * Math.exp(-ui / 15)})`); g.addColorStop(1, 'rgba(255,80,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
    },
  };
}

// ============================== RAIO ==============================
// carga: faíscas pulam em volta da mão erguida, céu escurece mais | impacto: relâmpago do céu (pisca 2 on / 1 off / 3 on), quadros brancos | resíduo: chão queimado, faíscas correndo
export function raio(scene) {
  const NF = 90, fa = new THREE.InstancedMesh(new THREE.BoxGeometry(0.008, 0.008, 0.06), aditivo('#fff6a0'), NF); fa.frustumCulled = false; scene.add(fa);
  const queimado = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({ color: '#141018', transparent: true, opacity: 0, depthWrite: false })); queimado.rotation.x = -Math.PI / 2; scene.add(queimado);
  // pontos do raio (mundo), gerados uma vez: do céu até o alvo, zigue-zague com galhos
  let pts = null, galhos = null;
  const gerar = (alvo) => { pts = []; const topo = alvo.clone().add(V3(-0.6, 7, -1.5)); const N = 16;
    for (let i = 0; i <= N; i++) { const u = i / N, p = topo.clone().lerp(alvo.clone().add(V3(0, 0.3, 0)), u); if (i > 0 && i < N) p.add(V3((hash(i) - 0.5) * 0.5 * (1 - u * 0.6), 0, (hash(i + 30) - 0.5) * 0.3)); pts.push(p); }
    galhos = [3, 6, 9, 12].map((k, j) => { const g = [pts[k].clone()]; for (let s = 1; s <= 4; s++) g.push(g[s - 1].clone().add(V3((hash(k * 7 + s) - 0.3) * 0.35 * (j % 2 ? 1 : -1), -0.35, (hash(k + s) - 0.5) * 0.2))); return g; }); };
  const aceso = (ui) => (ui >= 0 && ui < 2) || (ui >= 3 && ui < 6) || (ui >= 9 && ui < 11);
  return {
    cor: { particula: '#fff3a0', luzMao: '#fff2a0', luzImp: '#f4f0ff', anel: '#fff4b0', numero: 'crit', selo: ['ATORDOADA', '#c89a10'], tinta: '#2a2630', dano: 156, maoAcima: true, escurece: 0.8 },
    atualizar(qf, c) {
      if (!pts) gerar(c.alvo);
      const { B } = c, carga = clamp((qf - B.carga0) / (B.solta - B.carga0)), ui = qf - B.impacto;
      for (let i = 0; i < NF; i++) { // faíscas: em volta da mão na carga, em volta do alvo depois do impacto
        const em = i < 45 ? c.mao : c.alvo.clone().add(V3(0, 0.25, 0)); const ativo = i < 45 ? (qf > B.carga0 && qf < B.impacto) : (ui > 0 && ui < 150);
        const fase = Math.floor(qf / 3 + hash(i) * 7); if (!ativo || hash(fase + i * 13) > (i < 45 ? 0.35 + 0.5 * carga : 0.5 - ui / 400)) { ESCONDE(fa, i); continue; }
        const a = hash(fase * 3 + i) * 6.28, b = hash(fase * 5 + i) * 3.14, r = (i < 45 ? 0.08 : 0.3) + 0.1 * hash(fase + i);
        ee.set(hash(fase + 1) * 6, hash(fase + 2) * 6, 0); qq.setFromEuler(ee); m4.compose(vv.copy(em).add(V3(Math.cos(a) * Math.sin(b) * r, Math.cos(b) * r, Math.sin(a) * Math.sin(b) * r)), qq, ss.set(1, 1, 1 + 2 * hash(fase))); fa.setMatrixAt(i, m4); }
      fa.instanceMatrix.needsUpdate = true;
      queimado.position.copy(c.alvo).setY(0.013); queimado.scale.setScalar(0.45); queimado.material.opacity = ui > 0 ? 0.5 * (1 - clamp((ui - 200) / 80)) : 0;
    },
    flash(qf, c) { const ui = qf - c.B.impacto; return aceso(ui) ? 1 : 0; },
    desenhar(ctx, qf, c) {
      const ui = qf - c.B.impacto; if (!pts) return;
      // pré-avisos: 2 galhinhos piscando no céu antes de cair (172–179)
      const linha = (arr, w, cor, blur) => { ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = cor; ctx.lineWidth = w; ctx.shadowColor = '#cfe0ff'; ctx.shadowBlur = blur; ctx.beginPath(); arr.forEach((p, i) => { const [x, y] = c.proj(p); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.restore(); };
      if (ui >= -8 && ui < 0 && (Math.floor(ui) % 3 === 0)) linha(pts.slice(0, 5), 4, 'rgba(230,235,255,0.8)', 20);
      if (aceso(ui)) { // raio principal + galhos (núcleo branco, halo azulado)
        const tremido = pts.map((p, i) => p.clone().add(V3((hash(i + Math.floor(ui) * 31) - 0.5) * 0.06, 0, 0)));
        linha(tremido, 34, 'rgba(160,170,255,0.35)', 60); linha(tremido, 14, '#f4f6ff', 30); linha(tremido, 5, '#ffffff', 0);
        galhos.forEach((g) => { linha(g, 7, 'rgba(200,210,255,0.7)', 20); linha(g, 2.5, '#ffffff', 0); });
        ctx.save(); ctx.fillStyle = `rgba(235,240,255,${ui < 1 ? 0.35 : 0.06})`; ctx.fillRect(0, 0, 1080, 1920); ctx.restore();
      }
      if (ui > 0 && ui < 130) { // arcos elétricos pequenos no alvo (resíduo)
        for (let k = 0; k < 3; k++) { if (hash(Math.floor(qf / 4) + k * 11) < 0.45) continue; const base = c.alvo.clone().add(V3(0, 0.3, 0)), arr = [base];
          for (let s = 1; s < 5; s++) arr.push(arr[s - 1].clone().add(V3((hash(qf + s + k) - 0.5) * 0.18, (hash(qf * 2 + s + k) - 0.3) * 0.15, 0)));
          linha(arr, 3, `rgba(255,248,170,${1 - ui / 130})`, 12); }
      }
    },
  };
}

// ============================== CURA ==============================
// carga: motes verdes sobem do chão em volta da heroína | 150→180: espiral de luz sobe pelo corpo + coluna | impacto (180): clarão verde, número +N | resíduo: brilhos lentos
export function cura(scene) {
  const NP = 160, mo = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.014, 1), aditivo('#b8ffb0'), NP); mo.frustumCulled = false; scene.add(mo);
  const colMat = new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 }, uT: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float uA, uT; varying vec2 vU; void main(){ float a = (1.0 - vU.y) * (0.6 + 0.4*sin(vU.x*40.0 + uT*6.0 + vU.y*10.0)) * uA; gl_FragColor = vec4(vec3(0.55,1.0,0.6)*a, a); }` });
  const coluna = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 2.4, 40, 1, true).translate(0, 1.2, 0), colMat); scene.add(coluna);
  const anel = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.56, 64), aditivo('#9dff9a', 0)); anel.rotation.x = -Math.PI / 2; scene.add(anel);
  const anel2 = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.65, 64), aditivo('#e6ffb0', 0)); anel2.rotation.x = -Math.PI / 2; scene.add(anel2);
  return {
    cor: { particula: '#c8ffb8', luzMao: '#a8ffb0', luzImp: '#9dff9a', anel: '#c8ffb0', numero: 'cura', selo: ['CURADA', '#2e9e4a'], tinta: null, dano: 80, maoAcima: true, alvoEhHeroi: true, escurece: 0.5 },
    atualizar(qf, c) {
      const { B } = c, h = c.heroi; colMat.uniforms.uT.value = qf / 60;
      for (let i = 0; i < NP; i++) {
        const h1 = hash(i + 0.5), h2 = hash(i + 4.4), h3 = hash(i + 8.8); let p = null, k = 0;
        if (i < 70) { const nasce = B.carga0 + h1 * (B.solta - B.carga0), u = (qf - nasce) / 60; if (u >= 0 && u <= 1) { const a = h2 * 6.28 + u * 2; p = h.clone().add(V3(Math.cos(a) * (0.55 - 0.2 * u), u * 1.3, Math.sin(a) * (0.55 - 0.2 * u))); k = Math.sin(Math.PI * u) * 1.3; } }
        else if (i < 130) { const j = i - 70, u = (qf - B.solta - j * 0.5) / 40; if (u >= 0 && u <= 1) { const a = j * 0.6 + u * 9, r = 0.35 - 0.1 * u; p = h.clone().add(V3(Math.cos(a) * r, u * 1.5 + (j % 3) * 0.05, Math.sin(a) * r)); k = 1.6 * (1 - u * 0.4); } }
        else { const u = (qf - B.impacto - (i - 130) * 3) / 100; if (u >= 0 && u <= 1) { p = h.clone().add(V3((h1 - 0.5) * 1.2, 0.2 + u * 1.4 + h2 * 0.3, (h3 - 0.5) * 0.8)); k = Math.sin(Math.PI * u); } }
        if (p) { m4.compose(p, qq.identity(), ss.setScalar(k)); mo.setMatrixAt(i, m4); } else ESCONDE(mo, i);
      }
      mo.instanceMatrix.needsUpdate = true;
      const uc = (qf - B.solta) / 50; coluna.position.copy(h); colMat.uniforms.uA.value = uc < 0 ? 0 : uc < 0.3 ? E.out3(uc / 0.3) * 0.8 : 0.8 * (1 - E.in2((uc - 0.3) / 0.7)); coluna.scale.set(1, 0.3 + 0.7 * E.out3(clamp(uc / 0.4)), 1);
      const ua = (qf - B.carga0) / (B.solta - B.carga0); anel.position.copy(h).setY(0.02); anel.material.opacity = ua > 0 && qf < B.impacto + 30 ? 0.85 * Math.min(1, ua * 2) * (1 - clamp((qf - B.impacto) / 30)) : 0; anel.rotation.z = qf * 0.02; anel.scale.setScalar(1 + 0.05 * Math.sin(qf * 0.2));
      const ub = (qf - B.impacto) / 30; anel2.position.copy(h).setY(0.021); anel2.material.opacity = ub >= 0 && ub < 1 ? 1 - ub : 0; anel2.scale.setScalar(1 + 2.5 * E.out3(clamp(ub)));
    },
    desenhar(ctx, qf, c) { const ui = qf - c.B.impacto; if (ui < 0 || ui > 50) return; const [x, y] = c.proj(c.heroi.clone().add(V3(0, 0.7, 0)));
      ctx.save(); ctx.globalCompositeOperation = 'screen'; const r = 520, g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(170,255,170,${0.4 * Math.exp(-ui / 14)})`); g.addColorStop(1, 'rgba(60,200,80,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore(); },
  };
}
export const PODERES = { fogo, raio, cura };
