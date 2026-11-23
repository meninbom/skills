// KIT DE JUICE: módulos reaproveitáveis (three.js r160 + canvas 2D). Todo efeito é função pura do tempo.
// 2D = desenha num ctx em px de 1080x1920. 3D = cria objetos e tem atualizar(t).
import * as THREE from 'three';
import { COR, E, q, clamp, lerp, hash } from './tokens.js';

// ============ 1. HIT-STOP + CLARÃO ============
// golpes: [{t, stop (quadros), crit}]. Devolve o tempo "de mundo" (congela durante o stop) e o clarão 0..1.
export function hitStop(t, golpes) {
  let tw = t;
  for (const g of golpes) { const s = q(g.stop ?? 5); if (t > g.t) tw -= Math.min(t - g.t, s); }
  return tw;
}
export function clarao(t, tGolpe, cheio = 4, volta = 2) {
  const u = (t - tGolpe) * 60; if (u < 0) return 0;
  if (u < cheio) return 1; return 1 - clamp((u - cheio) / volta);
}
// aplica clarão a um material (MeshToon/Standard): guarda a cor original em userData
export function pintarClarao(mat, k, cor = '#ffffff') {
  if (!mat.userData.cor0) { mat.userData.cor0 = mat.color.clone(); mat.userData.em0 = mat.emissive ? mat.emissive.clone() : null; }
  mat.color.copy(mat.userData.cor0).lerp(new THREE.Color(cor), k);
  if (mat.emissive) mat.emissive.copy(mat.userData.em0).lerp(new THREE.Color(cor), k * 0.35);
}

// ============ 2. SQUASH & STRETCH (volume constante) ============
// u = segundos desde o contato; forca 0..1. Devolve escalas {x, y, z}.
export function squash(u, forca = 1, f = 4, z = 0.3) {
  if (u < 0) return { x: 1, y: 1, z: 1 };
  const s = -0.32 * forca * Math.exp(-z * 2 * Math.PI * f * u) * Math.cos(2 * Math.PI * f * Math.sqrt(1 - z * z) * u);
  const y = 1 + s, xz = 1 / Math.sqrt(Math.max(0.2, y));
  return { x: xz, y, z: xz };
}
// estica na direção do movimento (velocidade normalizada 0..1)
export function stretch(v) { const y = 1 + 0.35 * clamp(v); return { x: 1 / Math.sqrt(y), y, z: 1 / Math.sqrt(y) }; }

// ============ 3. NÚMERO DE DANO ============
// n = {t0, valor, tipo: 'dano'|'fogo'|'gelo'|'cura'|'crit', lado: -1|0|1}; (ax, ay) = âncora na tela
export function numeroDano(ctx, t, n, ax, ay, k = 1, F = 'Titan, sans-serif') {
  const u = t - n.t0; if (u < 0 || u > q(70)) return;
  const crit = n.tipo === 'crit';
  const size = (crit ? 150 : n.tipo === 'cura' ? 80 : 46 + Math.min(n.valor, 60) * 1.6) * k;
  const cor = COR[n.tipo === 'dano' ? 'dano' : n.tipo] || COR.dano;
  const pop = u < q(6) ? E.outBack(u / q(6), 2.4) * 1.0 : 1 + 0.25 * Math.exp(-(u - q(6)) * 14);
  const sc = u < q(6) ? Math.max(0.05, pop) : pop;
  const v = clamp(u / q(55)), lado = n.lado || 0;
  let x = ax + lado * 140 * k * E.out3(v), y = ay - 60 * k * E.out3(v) + (lado ? 60 * k * v * v - 50 * k * Math.sin(Math.PI * v * 0.8) : 0);
  if (crit) { x += E.tremor(u, 18, 4) * 10 * k; y += E.tremor(u + 0.03, 15, 4) * 8 * k; }
  const al = 1 - clamp((u - q(52)) / q(18));
  ctx.save(); ctx.globalAlpha = al; ctx.translate(x, y); ctx.scale(sc, sc); if (crit) ctx.rotate(-0.08 + 0.05 * E.tremor(u, 6, 3));
  ctx.font = `${Math.round(size)}px ${F}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const txt = (n.tipo === 'cura' ? '+' : '') + n.valor + (crit ? '!' : '');
  ctx.lineWidth = size * 0.17; ctx.strokeStyle = COR.tinta; ctx.strokeText(txt, 0, 0);
  if (crit) { const g = ctx.createLinearGradient(0, -size / 2, 0, size / 2); g.addColorStop(0, '#fff6c0'); g.addColorStop(0.5, COR.crit); g.addColorStop(1, '#ff8a1f'); ctx.fillStyle = g; }
  else ctx.fillStyle = cor;
  ctx.fillText(txt, 0, 0);
  if (crit && u < q(30)) { // palavra CRÍTICO! em cima
    ctx.font = `${Math.round(size * 0.32)}px ${F}`; ctx.lineWidth = size * 0.06; ctx.strokeText('CRÍTICO!', 0, -size * 0.68); ctx.fillStyle = '#fff'; ctx.fillText('CRÍTICO!', 0, -size * 0.68);
  }
  ctx.restore();
}

// ============ 4. BARRA DE VIDA QUE MENTE ============
// golpes: [{t, de, para}] em ordem. Devolve {fill, pedaco:{de,ate}, mostrado}.
export function vidaEm(t, v0, golpes, espera = q(30), escoa = q(18)) {
  let fill = v0, pedaco = null, mostrado = v0;
  for (const g of golpes) {
    if (t < g.t) break;
    const u = t - g.t; fill = g.para;
    const k = E.out3((u - espera) / escoa); const topo = lerp(g.de, g.para, k);
    pedaco = k < 1 ? { de: g.para, ate: topo } : null;
    mostrado = Math.round(lerp(g.de, g.para, E.out3(u / q(24))));
  }
  return { fill, pedaco, mostrado };
}
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(r, h / 2)); }
export function barraVida(ctx, x, y, w, h, st, max = 100, nome = null, F = 'Titan, sans-serif') {
  const p = st.fill / max, cor = p > 0.6 ? COR.vidaOk : p > 0.3 ? COR.vidaMeio : COR.vida;
  ctx.save();
  if (nome) { ctx.font = `${Math.round(h * 0.75)}px ${F}`; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 6; ctx.strokeStyle = COR.tinta; ctx.strokeText(nome, x, y - 6); ctx.fillStyle = '#fff'; ctx.fillText(nome, x, y - 6); }
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; rr(ctx, x, y + 5, w, h, h * 0.35); ctx.fill();
  ctx.fillStyle = '#fff'; rr(ctx, x, y, w, h, h * 0.35); ctx.fill();
  const b = h * 0.13, ix = x + b, iy = y + b, iw = w - 2 * b, ih = h - 2 * b;
  rr(ctx, ix, iy, iw, ih, ih * 0.3); ctx.save(); ctx.clip();
  ctx.fillStyle = COR.trilho; ctx.fillRect(ix, iy, iw, ih);
  if (st.pedaco) { ctx.fillStyle = COR.pedaco; ctx.fillRect(ix + iw * st.pedaco.de / max, iy, iw * (st.pedaco.ate - st.pedaco.de) / max, ih); }
  ctx.fillStyle = cor[0]; ctx.fillRect(ix, iy, iw * p, ih);
  ctx.fillStyle = cor[1]; ctx.fillRect(ix, iy + ih * 0.12, iw * p, ih * 0.22);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(ix, iy + ih * 0.78, iw * p, ih * 0.22);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; for (let i = 1; i < 10; i++) ctx.fillRect(ix + iw * i / 10 - 1.5, iy, 3, ih);
  ctx.restore();
  ctx.font = `${Math.round(h * 0.62)}px ${F}`; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.lineWidth = 5; ctx.strokeStyle = COR.tinta;
  ctx.strokeText(`${st.mostrado} / ${max}`, x + w, y + h + 6); ctx.fillStyle = '#fff'; ctx.fillText(`${st.mostrado} / ${max}`, x + w, y + h + 6);
  ctx.restore();
}

// ============ 5. SMEAR / RASTRO DE GOLPE (3D) ============
// Faixa de malha entre a "base" e a "ponta" da arma ao longo das últimas N amostras; cauda com alpha 0.
export function criarSmear(cor = '#ffffff', N = 14) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 2 * 3), al = new Float32Array(N * 2), idx = [];
  for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('alfa', new THREE.BufferAttribute(al, 1)); geo.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uCor: { value: new THREE.Color(cor) }, uOp: { value: 1 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float alfa; varying float vA; void main(){ vA = alfa; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uCor; uniform float uOp; varying float vA; void main(){ gl_FragColor = vec4(uCor*1.3, vA*vA*vA*0.85*uOp); }`,
  });
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.userData.N = N;
  // amostrar(fn, t, janela): fn(tt) -> {base: V3, ponta: V3}; desenha o caminho de [t-janela, t]
  m.userData.amostrar = (fn, t, janela = q(6), op = 1) => {
    for (let i = 0; i < N; i++) {
      const s = i / (N - 1), tt = t - janela * (1 - s), p = fn(tt);
      pos.set([p.base.x, p.base.y, p.base.z], i * 6); pos.set([p.ponta.x, p.ponta.y, p.ponta.z], i * 6 + 3);
      al[i * 2] = s * 0.25; al[i * 2 + 1] = s; // cauda transparente, ponta forte
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.alfa.needsUpdate = true; mat.uniforms.uOp.value = op; m.visible = op > 0.001;
  };
  return m;
}

// ============ 6. LINHAS DE VELOCIDADE + CÂMERA ATRASADA ============
export function linhasVelocidade(ctx, t, forca, cx = 540, cy = 900, n = 46, cor = 'rgba(255,255,255,0.85)') {
  if (forca <= 0.01) return;
  ctx.save(); ctx.strokeStyle = cor; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = hash(i) * Math.PI * 2, fase = (t * (2.2 + hash(i + 9) * 2) + hash(i + 3)) % 1;
    const r0 = lerp(560, 1150, fase), len = (120 + 260 * hash(i + 5)) * forca;
    ctx.globalAlpha = forca * (1 - fase) * 0.9; ctx.lineWidth = 3 + 7 * hash(i + 7);
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 1.4); ctx.lineTo(cx + Math.cos(a) * (r0 + len), cy + Math.sin(a) * (r0 + len) * 1.4); ctx.stroke();
  }
  ctx.restore();
}
// câmera que segue com atraso: média ponderada das posições passadas do alvo (determinística)
export function alvoAtrasado(fn, t, atraso = q(8), amostras = 8) {
  const acc = new THREE.Vector3(); let w = 0;
  for (let i = 0; i < amostras; i++) { const s = i / (amostras - 1), pe = Math.exp(-3 * s); acc.add(fn(t - atraso * 2 * s).multiplyScalar(pe)); w += pe; }
  return acc.divideScalar(w);
}
// tremida por "trauma": soma de impulsos que decaem
export function trauma(t, golpes) {
  let a = 0; for (const g of golpes) { const u = t - g.t; if (u >= 0 && u < 0.5) a += (g.forca ?? 1) * Math.exp(-u * 9); }
  a = Math.min(1, a) ** 2;
  return { x: a * (hash(Math.floor(t * 60)) - 0.5) * 0.24, y: a * (hash(Math.floor(t * 60) + 50) - 0.5) * 0.24, rot: a * (hash(Math.floor(t * 60) + 99) - 0.5) * 0.05 };
}

// ============ 7. ITEM VOANDO PARA O CONTADOR ============
// it = {t0, de:[x,y], para:[x,y], dur, i}; devolve posição/escala ou null; contador pula quando chega.
export function itemVoa(t, it) {
  const u = (t - it.t0) / (it.dur ?? q(40)); if (u < 0 || u > 1) return null;
  const k = E.io3(u), [x0, y0] = it.de, [x1, y1] = it.para;
  const cx = (x0 + x1) / 2 + (hash(it.i ?? 0) - 0.5) * 260, cy = Math.min(y0, y1) - 280 - 120 * hash((it.i ?? 0) + 3); // controle da curva: arco
  const x = (1 - k) ** 2 * x0 + 2 * (1 - k) * k * cx + k * k * x1, y = (1 - k) ** 2 * y0 + 2 * (1 - k) * k * cy + k * k * y1;
  return { x, y, s: u < 0.15 ? E.outBack(u / 0.15) : lerp(1, 0.55, E.in2((u - 0.15) / 0.85)), rot: u * 6 };
}
export function pulo(t, chegadas) { // escala do contador
  let s = 1; for (const c of chegadas) { const u = t - c; if (u >= 0 && u < 0.4) s += 0.35 * Math.exp(-u * 10) * Math.cos(u * 40); } return s;
}
export function desenharMoeda(ctx, x, y, r, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.15, Math.abs(Math.cos(rot))), 1);
  ctx.fillStyle = '#b8761c'; ctx.beginPath(); ctx.arc(0, 3, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COR.ouro; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff2a8'; ctx.lineWidth = r * 0.14; ctx.beginPath(); ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = r * 0.16; ctx.strokeStyle = COR.tinta; ctx.beginPath(); ctx.arc(0, 1, r, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
export function estrela(ctx, x, y, r, rot = 0, cor = '#fff6b0') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); }
  ctx.closePath(); ctx.fillStyle = cor; ctx.shadowColor = cor; ctx.shadowBlur = r * 0.8; ctx.fill(); ctx.restore();
}

// ============ 8. REVELAÇÃO ESTILO CARTA (2D, com perspectiva falsa) ============
// beats: sobe+treme 0–30 q, vira devagar 30–66 q (borda brilha), BOOM 66 q (clarão + raios), brilho varre 70–110 q.
export function revelaCarta(ctx, t, t0, cx, cy, w, h, desenharFrente, desenharVerso, F = 'Titan, sans-serif') {
  const u = (t - t0) * 60; if (u < 0) return;
  const sobe = E.out3(u / 30), tre = u < 30 ? Math.sin(u * 2.4) * 6 * (u / 30) : 0;
  const vira = E.io3((u - 30) / 36), ang = vira * Math.PI;
  ctx.save(); ctx.translate(cx + tre, cy - 80 * sobe);
  // raios atrás depois do BOOM
  if (u > 66) { const k = E.out3((u - 66) / 20); ctx.save(); ctx.rotate(u * 0.004); for (let i = 0; i < 14; i++) { ctx.rotate(Math.PI / 7); ctx.fillStyle = `rgba(255,220,120,${0.22 * k})`; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-60, -900 * k); ctx.lineTo(60, -900 * k); ctx.closePath(); ctx.fill(); } ctx.restore(); }
  const sx = Math.cos(ang); ctx.scale(Math.max(0.02, Math.abs(sx)) * (1 + 0.08 * Math.exp(-Math.max(0, u - 66) * 0.12) * (u > 66 ? 1 : 0)), 1);
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 26); ctx.save(); ctx.clip();
  if (sx > 0) desenharVerso(ctx, w, h); else desenharFrente(ctx, w, h);
  // brilho de arco-íris varrendo
  if (u > 70 && u < 110) { const p = (u - 70) / 40; const g = ctx.createLinearGradient(-w + 2 * w * p - w / 2, -h / 2, -w + 2 * w * p + w / 2, h / 2); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.45, 'rgba(255,180,255,0.0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.6)'); g.addColorStop(0.55, 'rgba(160,255,255,0.0)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h); }
  ctx.restore();
  // borda brilhando durante a virada
  const brilho = clamp((u - 30) / 36) * (u < 70 ? 1 : Math.exp(-(u - 70) * 0.08));
  ctx.lineWidth = 10; ctx.strokeStyle = `rgba(255,214,107,${0.4 + 0.6 * brilho})`; ctx.shadowColor = '#ffd66b'; ctx.shadowBlur = 40 * brilho; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 26); ctx.stroke();
  ctx.restore();
  // BOOM: clarão branco 4 q
  const fl = u >= 66 ? clarao(u / 60, 66 / 60, 4, 8) : 0; if (fl > 0) { ctx.save(); ctx.globalAlpha = fl * 0.45; ctx.fillStyle = '#fffbe8'; ctx.fillRect(0, 0, 1080, 1920); ctx.restore(); }
}

// ============ 9. PARTÍCULAS (gelo, fogo, estrela) ============
// rajada: {t0, x, y, tipo, n, forca}. Desenho 2D (tela) com física determinística.
export function particulas(ctx, t, r, F = 'Titan, sans-serif') {
  const u = t - r.t0; if (u < 0) return;
  const n = r.n ?? 18;
  for (let i = 0; i < n; i++) {
    const h1 = hash(r.t0 * 7 + i), h2 = hash(r.t0 * 3 + i * 1.7), h3 = hash(i * 5.3 + r.t0);
    if (r.tipo === 'fogo') {
      const vida = 0.6 + 0.6 * h3, v = u / vida; if (v > 1) continue;
      const x = r.x + (h1 - 0.5) * 140 + Math.sin(u * 6 + i) * 25 * v, y = r.y - (260 + 300 * h2) * u - 40 * h1;
      const s = (26 + 30 * h2) * (1 - v) * (r.forca ?? 1);
      const g = ctx.createRadialGradient(x, y, 0, x, y, s); g.addColorStop(0, `rgba(255,250,200,${1 - v})`); g.addColorStop(0.4, `rgba(255,150,40,${0.9 * (1 - v)})`); g.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
    } else if (r.tipo === 'gelo') {
      const vida = 0.7 + 0.4 * h3, v = u / vida; if (v > 1) continue;
      const a = h1 * Math.PI * 2, sp = (420 + 600 * h2) * (r.forca ?? 1);
      const x = r.x + Math.cos(a) * sp * u, y = r.y + Math.sin(a) * sp * u * 0.8 + 900 * u * u;
      const s = (10 + 22 * h3) * (1 - v * 0.6);
      ctx.save(); ctx.translate(x, y); ctx.rotate(a + u * 8 * (h2 - 0.5)); ctx.globalAlpha = 1 - v;
      ctx.fillStyle = '#e6fbff'; ctx.strokeStyle = '#5fc8ef'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, -s * 1.6); ctx.lineTo(s * 0.55, 0); ctx.lineTo(0, s * 1.2); ctx.lineTo(-s * 0.5, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    } else { // estrela: sobe em leque, flutua, estoura como bolha
      const a = -Math.PI / 2 + (h1 - 0.5) * 2.2, sp = (700 + 500 * h2) * (r.forca ?? 1);
      const tv = q(10), tf = q(26), tp = q(8);
      let x, y, s, rot = (h3 - 0.5) * u * 4;
      const k = E.out3(Math.min(u, tv) / tv);
      x = r.x + Math.cos(a) * sp * 0.33 * k; y = r.y + Math.sin(a) * sp * 0.33 * k + (u > tv ? -20 * (u - tv) : 0);
      s = (22 + 20 * h3) * E.outBack(clamp(u / q(6)));
      const up = u - tv - tf - 6 * h3 / 60;
      if (up > 0) { const pv = up / tp; if (pv > 1) continue; // estouro: anel + some
        ctx.save(); ctx.globalAlpha = 1 - pv; ctx.strokeStyle = '#fff6b0'; ctx.lineWidth = 4 * (1 - pv); ctx.beginPath(); ctx.arc(x, y, s * (0.6 + 1.2 * pv), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); continue; }
      estrela(ctx, x, y, s, rot);
    }
  }
}

// ============ 10. RAIO-X / REPLAY ============
// Congela a cena real (o chamador desenha o quadro congelado) e por cima: tinta ciano, scanlines, selo ● REPLAY, anotações.
export function raioX(ctx, t, t0, anot = [], F = 'Titan, sans-serif') {
  const u = t - t0; if (u < 0) return;
  const k = E.out3(u / q(10));
  ctx.save();
  ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(80,170,200,${0.55 * k})`; ctx.fillRect(0, 0, 1080, 1920);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgba(0,20,40,${0.25 * k})`; for (let y = 0; y < 1920; y += 8) ctx.fillRect(0, y, 1080, 3);
  // selo
  const pisca = Math.floor(u * 2) % 2 === 0;
  ctx.font = `46px ${F}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.roundRect(60, 120, 300, 80, 16); ctx.fill();
  ctx.fillStyle = pisca ? COR.replay : 'rgba(255,59,74,0.35)'; ctx.beginPath(); ctx.arc(104, 160, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillText('REPLAY', 134, 162);
  // anotações: {tipo:'circulo'|'seta'|'medida'|'texto', ...} cada uma com t (atraso) e desenho progressivo
  for (const a of anot) {
    const p = E.out3((u - (a.t ?? 0)) / q(14)); if (p <= 0) continue;
    ctx.strokeStyle = a.cor || COR.raioX; ctx.fillStyle = a.cor || COR.raioX; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.shadowColor = a.cor || COR.raioX; ctx.shadowBlur = 14;
    if (a.tipo === 'circulo') { ctx.beginPath(); ctx.ellipse(a.x, a.y, a.r, a.r * (a.achata ?? 1), 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p); ctx.stroke(); }
    if (a.tipo === 'seta' || a.tipo === 'medida') {
      const x = lerp(a.x0, a.x1, p), y = lerp(a.y0, a.y1, p);
      ctx.beginPath(); ctx.moveTo(a.x0, a.y0); ctx.lineTo(x, y); ctx.stroke();
      if (p > 0.95) { const ang = Math.atan2(a.y1 - a.y0, a.x1 - a.x0); for (const s of a.tipo === 'medida' ? [0, 1] : [1]) { const px = s ? a.x1 : a.x0, py = s ? a.y1 : a.y0, aa = s ? ang : ang + Math.PI; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - Math.cos(aa - 0.5) * 30, py - Math.sin(aa - 0.5) * 30); ctx.moveTo(px, py); ctx.lineTo(px - Math.cos(aa + 0.5) * 30, py - Math.sin(aa + 0.5) * 30); ctx.stroke(); } }
    }
    if (a.txt && p > 0.6) { ctx.shadowBlur = 0; ctx.font = `${a.tam ?? 44}px ${F}`; ctx.textAlign = 'center'; ctx.lineWidth = 8; ctx.strokeStyle = COR.tinta; ctx.globalAlpha = (p - 0.6) / 0.4; ctx.strokeText(a.txt, a.tx, a.ty); ctx.fillStyle = a.corTxt || '#fff'; ctx.fillText(a.txt, a.tx, a.ty); ctx.globalAlpha = 1; }
  }
  ctx.restore();
}

// ============ 11. HUD DE RPG: LEVEL UP, LOOT, ESCOLHA 1/2 ============
export function levelUp(ctx, t, t0, nivel, F = 'Titan, sans-serif') {
  const u = t - t0; if (u < 0 || u > 2.4) return;
  const ent = E.outBack(u / q(14), 2.2), sai = 1 - E.in3((u - 2.0) / 0.4);
  ctx.save(); ctx.translate(540, 560); ctx.globalAlpha = sai;
  // raios
  ctx.save(); ctx.rotate(u * 0.6); for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.fillStyle = 'rgba(255,214,107,0.18)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-40, -520 * E.out3(u / q(20))); ctx.lineTo(40, -520 * E.out3(u / q(20))); ctx.fill(); } ctx.restore();
  ctx.scale(ent, ent);
  ctx.font = `128px ${F}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = 22; ctx.strokeStyle = COR.tinta; ctx.strokeText('LEVEL UP!', 0, 0);
  const g = ctx.createLinearGradient(0, -60, 0, 60); g.addColorStop(0, '#fff6c0'); g.addColorStop(0.55, COR.ouro); g.addColorStop(1, '#ff9a2a'); ctx.fillStyle = g; ctx.fillText('LEVEL UP!', 0, 0);
  ctx.font = `60px ${F}`; ctx.lineWidth = 12; const sub = `NÍVEL ${nivel - 1} → ${nivel}`;
  ctx.strokeText(sub, 0, 110); ctx.fillStyle = '#fff'; ctx.fillText(sub, 0, 110);
  ctx.restore();
  // brilhinhos subindo
  for (let i = 0; i < 16; i++) { const v = ((u * 0.9 + hash(i)) % 1); estrela(ctx, 140 + 800 * hash(i + 4), 900 - 600 * v, 10 + 10 * hash(i + 2), u * 3, `rgba(255,240,170,${(1 - v) * sai})`); }
}
export function lootToast(ctx, t, t0, txt, icone = 'moeda', y = 1400, F = 'Titan, sans-serif') {
  const u = t - t0; if (u < 0 || u > 2.2) return;
  const ent = E.out3(u / q(12)), sai = E.in3((u - 1.8) / 0.4);
  const x = 540 + (1 - ent) * 700 - sai * 700;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = COR.hudFundo; ctx.strokeStyle = COR.hudBorda; ctx.lineWidth = 5; ctx.beginPath(); ctx.roundRect(-330, -60, 660, 120, 24); ctx.fill(); ctx.stroke();
  if (icone === 'moeda') desenharMoeda(ctx, -250, 0, 38, u * 5); else estrela(ctx, -250, 0, 40, u);
  ctx.font = `52px ${F}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(txt, -190, 4);
  ctx.restore();
}
// escolha 1/2 (pede comentário): opções aparecem em sequência; a "pulsação" convida a comentar
export function escolha(ctx, t, t0, pergunta, a, b, F = 'Titan, sans-serif') {
  const u = t - t0; if (u < 0) return;
  ctx.save(); ctx.fillStyle = `rgba(6,8,20,${0.55 * E.out3(u / q(12))})`; ctx.fillRect(0, 0, 1080, 1920);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const kp = E.outBack(u / q(14)); ctx.save(); ctx.translate(540, 660); ctx.scale(kp, kp);
  ctx.font = `66px ${F}`; ctx.lineWidth = 14; ctx.strokeStyle = COR.tinta; ctx.strokeText(pergunta, 0, 0); ctx.fillStyle = '#fff'; ctx.fillText(pergunta, 0, 0); ctx.restore();
  [[a, 1, q(10), '#3fa9ff'], [b, 2, q(18), '#ff5a6e']].forEach(([txt, n, atraso, cor], i) => {
    const v = E.outBack((u - atraso) / q(14)); if (v <= 0) return;
    const y = 880 + i * 250, pul = 1 + 0.03 * Math.sin((u - atraso) * 6 + i * 1.5);
    ctx.save(); ctx.translate(540, y); ctx.scale(v * pul, v * pul);
    ctx.fillStyle = COR.hudFundo; ctx.strokeStyle = cor; ctx.lineWidth = 7; ctx.beginPath(); ctx.roundRect(-430, -95, 860, 190, 30); ctx.fill(); ctx.stroke();
    ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(-340, 0, 58, 0, Math.PI * 2); ctx.fill();
    ctx.font = `76px ${F}`; ctx.fillStyle = '#fff'; ctx.fillText(String(n), -340, 4);
    ctx.font = `52px ${F}`; ctx.textAlign = 'left'; ctx.fillText(txt, -255, 4); ctx.restore();
  });
  const c = E.out3((u - q(34)) / q(12)); if (c > 0) { ctx.globalAlpha = c; ctx.font = `46px ${F}`; ctx.fillStyle = COR.ouroClaro; ctx.fillText('COMENTA 1 OU 2!', 540, 1440); }
  ctx.restore();
}
