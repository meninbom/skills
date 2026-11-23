
// ================= quadro
const lay = [0, 1, 2].map(() => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; });
const BLOOM = document.createElement('canvas'); BLOOM.width = W / 4; BLOOM.height = H / 4; let GRAIN = null; const GR = document.createElement('canvas'); GR.width = W; GR.height = H;
const _t = new THREE.Vector3(), _h = new THREE.Vector3(), prj = (x, y, z) => { _t.set(x, y, z).project(cam); return [(_t.x * 0.5 + 0.5) * W, (-_t.y * 0.5 + 0.5) * H, _t.z]; };
function puff(i, x, y, z, s, a) { const d = DUST[i]; if (!d) return; d.position.set(x, y, z); d.scale.set(s, s, 1); d.material.opacity = a; d.material.rotation = i * 1.7; }
function stage(t, K) {
  const tt = K.tt, Wk = K.Wk, P = poseAt(tt);
  // heroína
  const look = ss((tt - 11.0) / 0.9) * (1 - ss((tt - 14.6) / 1.2) * 0.75) * (1 - ss((tt - 18.2) / 0.4));
  hero.root.position.set(0, yRoad(Wk.z), Wk.z); hero.root.rotation.y = Math.PI;
  hero.update(tt, { ph: Wk.ph, w: Wk.w, look, ...P, brace: ss((tt - 16.9) / 1.2) * (1 - ss((tt - 22) / 1.5)) });
  hero.root.updateMatrixWorld(true);
  // matacão
  const tau = tt - TI;
  BH.forEach((h, k) => { const sg = k ? -1 : 1; h.visible = tt > BT0;
    if (tau < 0) { const b = boulderAt(tt); h.position.set(b.x, b.y, b.z); h.rotation.set(b.rot, 0, 0); }
    else { const e = 1 - Math.exp(-tau * 0.9), z = ZH + 4.8 * e, x = sg * (0.06 + 1.25 * (1 - Math.exp(-tau * 4)) + 0.3 * e), fall = Math.min(1.25, tau * 2.4), bo = Math.abs(Math.sin(tau * 5.5)) * 0.5 * Math.exp(-tau * 1.6);
      h.position.set(x, hgt(x, z) + BR * lerp(0.92, 0.7, fall / 1.25) + bo, z); h.rotation.set(ZH / BR + 60 / BR + 4.8 * e / BR * 0.7, 0, -sg * fall); } });
  // estilhaços
  hero.root.userData.hammerHead.getWorldPosition(_h);
  CHIPS.forEach((c, i) => { c.m.visible = tau > 0 && tau < 6; if (!c.m.visible) return; const T = Math.min(tau, 1.6), x = _h.x + c.vx * T * 0.9, z = _h.z - 0.2 + c.vz * T * 0.9; let y = _h.y + c.vy * T - 4.9 * T * T; const g = hgt(x, z) + c.s * 0.4; if (y < g) y = g;
    c.m.position.set(x, y, z); c.m.rotation.set(c.rx * T, c.ry * T, 0); });
  // pedrinhas que avisam
  PEB.forEach(p => { const u = tt - p.t0; p.m.visible = u > 0 && u < 3; if (!p.m.visible) return; const z = Wk.z - 5 + p.v * u, x = p.x + 0.15 * Math.sin(u * 3 + p.x * 9); p.m.position.set(x, hgt(x, z) + p.s * 0.6 + Math.abs(Math.sin(u * 7 + p.x * 5)) * 0.12 * Math.exp(-u * 0.6), z); p.m.rotation.set(u * 14, 0, u * 3); });
  // poeira
  let di = 0;
  for (let i = 0; i < 70; i++) { const ts = BT0 + i * 0.095; if (ts > TI) break; const age = tt - ts; if (age < 0 || age > 2.6) { di++; continue; } const b = boulderAt(ts), k = age / 2.6;
    puff(di++, b.x + Math.sin(i * 7.1) * 0.8 * k, hgt(b.x, b.z) + 0.3 + age * 0.45, b.z - 0.5, 0.9 + age * 1.6, 0.42 * Math.sin(Math.PI * Math.pow(k, 0.5)) * (tau > 0.4 ? Math.exp(-(tau - 0.4)) : 1)); }
  for (let i = 0; i < 60; i++) { const r = rng(400 + i), a = r() * 6.283, up = r(), sp = 2 + r() * 6, ag = tau; if (ag < 0 || ag > 7.5) { di++; continue; } const dr = (1 - Math.exp(-ag * 1.4)) * sp;
    const x = _h.x + Math.cos(a) * dr * 1.1, z = ZH + Math.sin(a) * dr * 0.8 + ag * 0.8 * (r() + 0.3), y = hgt(x, z) + 0.2 + up * 1.6 * (1 - Math.exp(-ag * 2)) + ag * 0.18;
    puff(di++, x, y, z, 0.8 + dr * 0.4 + ag * 0.35, 0.2 * Math.min(1, ag * 8) * Math.pow(1 - ag / 7.5, 1.5)); }
  for (let i = 0; i < 12; i++) { const r = rng(900 + i), ag = tt - 9.15 - i * 0.12; if (ag < 0 || ag > 2.2) { di++; continue; } const x = (r() - 0.5) * 1.4, z = Wk.z - 2.5 + ag * 2.4; puff(di++, x, hgt(x, z) + 0.05 + ag * 0.06, z, 0.12 + ag * 0.25, 0.3 * (1 - ag / 2.2)); }
  for (; di < DUST.length; di++) DUST[di].material.opacity = 0;
}
function draw(t) {
  const K = shotAt(t);
  stage(t, K);
  cam.fov = K.fov; cam.position.set(...K.cam[0]); cam.lookAt(_t.set(...K.cam[1])); if (K.shake) { cam.translateX(Math.sin(t * 83) * K.shake); cam.translateY(Math.sin(t * 97 + 1) * K.shake); } cam.updateMatrixWorld(true);
  // sol acompanha a ação (sombra nítida perto da câmera)
  const cx = cam.position.x * 0.5, cz = (cam.position.z + K.cam[1][2]) * 0.5; sun.target.position.set(cx, yRoad(cz), cz); sun.position.set(cx + SUN.x * 0.6, yRoad(cz) + SUN.y * 0.6, cz + SUN.z * 0.6);
  sun.shadow.camera.updateProjectionMatrix();
  RIM.dir.value.copy(sun.position).sub(sun.target.position).normalize().transformDirection(cam.matrixWorldInverse); RIM.col.value.set(0xff9a50).multiplyScalar(0.75); metalEnv(0.6, 0.6);
  cam.updateProjectionMatrix(); const d = K.d, mid = K.mid || [Math.max(0.1, d * 0.6), d * 1.7 + 1.5], cuts = [[mid[1] - 0.3, 600, K.dof[0]], [mid[0], mid[1], 0], [0.1, mid[0] + 0.15, K.dof[1]]];
  if (!K.dof[0]) { cuts[1][1] = 600; cuts.shift(); }
  lay.forEach(l => l.getContext('2d').clearRect(0, 0, W, H));
  cuts.forEach(([n, f], i) => { cam.near = n; cam.far = f; cam.updateProjectionMatrix(); R3.clear(); R3.render(scene, cam); lay[i].getContext('2d').drawImage(gl, 0, 0); });
  X.filter = 'none'; X.globalCompositeOperation = 'source-over'; X.globalAlpha = 1; X.fillStyle = '#000'; X.fillRect(0, 0, W, H);
  cuts.forEach(([, , b], i) => { X.filter = b ? `blur(${b}px)` : 'none'; X.drawImage(lay[i], 0, 0); }); X.filter = 'none';
  { const bc = BLOOM.getContext('2d'); bc.globalCompositeOperation = 'copy'; bc.drawImage(out, 0, 0, W / 4, H / 4); X.save(); X.globalCompositeOperation = 'screen';
    X.globalAlpha = 0.36; X.filter = 'brightness(0.72) contrast(2.4) blur(10px)'; X.drawImage(BLOOM, 0, 0, W, H);
    X.globalAlpha = 0.28; X.filter = 'brightness(0.72) contrast(2.4) blur(34px)'; X.drawImage(BLOOM, 0, 0, W, H); X.restore(); X.filter = 'none'; }
  cam.near = 0.1; cam.far = 600; cam.updateProjectionMatrix();
  if (t >= TI && t < TI + 0.2) { cam.fov = 30; cam.position.set(-2.2, 6.6, ZSTOP + 4.2); cam.lookAt(0, 0.9, ZSTOP - 1.5); cam.updateMatrixWorld(true); cam.updateProjectionMatrix(); maskRender([hero.root, BH[0], BH[1]]); hero.root.userData.hammerHead.getWorldPosition(_h); const [ix, iy] = prj(_h.x, _h.y, _h.z), [jx, jy] = prj(_h.x, _h.y - 0.4, _h.z - 1), dl = Math.hypot(jx - ix, jy - iy) || 1;
    impactFrame2(X, Math.min(11, Math.floor((t - TI) * 60 + 0.001)), ix, iy, (jx - ix) / dl, (jy - iy) / dl); return; }
  // sol na tela: clarão + raios + poeira no ar
  { const sp = _t.copy(sun.position).sub(sun.target.position).normalize().multiplyScalar(300).add(cam.position); const [sx, sy, sz] = prj(sp.x, sp.y, sp.z); const on = sz < 1 && sx > -300 && sx < W + 300, x = on ? sx : (sx < W / 2 ? -260 : W + 260), y = on ? Math.min(sy, H * 0.55) : H * 0.32;
    X.globalCompositeOperation = 'lighter'; let g = X.createRadialGradient(x, y, 0, x, y, 1500); g.addColorStop(0, `rgba(255,150,70,${on ? 0.5 : 0.36})`); g.addColorStop(0.35, 'rgba(255,120,60,0.13)'); g.addColorStop(1, 'rgba(0,0,0,0)'); X.fillStyle = g; X.fillRect(0, 0, W, H);
    X.save(); X.filter = 'blur(22px)'; const r = rng(K.seed * 7); for (let i = 0; i < 9; i++) { const a = Math.atan2(H * 0.6 - y, W / 2 - x) + (r() - 0.5) * 1.3, w = 0.02 + r() * 0.05; X.fillStyle = `rgba(255,160,90,${0.04 + r() * 0.06})`; X.beginPath(); X.moveTo(x, y); X.lineTo(x + Math.cos(a - w) * 2600, y + Math.sin(a - w) * 2600); X.lineTo(x + Math.cos(a + w) * 2600, y + Math.sin(a + w) * 2600); X.fill(); } X.restore();
    const r2 = rng(3 + K.seed); for (let i = 0; i < 80; i++) { const px = (r2() * W + t * (8 + r2() * 20)) % W, py = H * (0.12 + r2() * 0.75) + Math.sin(t * 0.7 + i) * 12; X.fillStyle = `rgba(255,190,130,${0.08 + r2() * 0.3})`; X.beginPath(); X.arc(px, py, 1 + r2() * 2.4, 0, 7); X.fill(); }
    X.globalCompositeOperation = 'source-over'; }
  // grade: sombra azul-petróleo, luz laranja, contraste
  { const gc = GR.getContext('2d'); gc.globalCompositeOperation = 'copy'; gc.filter = 'contrast(1.14) saturate(0.95) brightness(1.12)'; gc.drawImage(out, 0, 0); gc.filter = 'none'; X.drawImage(GR, 0, 0);
    X.globalCompositeOperation = 'soft-light'; let g = X.createLinearGradient(W, 0, 0, H); g.addColorStop(0, 'rgba(255,150,70,0.5)'); g.addColorStop(1, 'rgba(20,70,90,0.5)'); X.fillStyle = g; X.fillRect(0, 0, W, H);
    X.globalCompositeOperation = 'multiply'; X.fillStyle = 'rgba(250,236,236,1)'; X.fillRect(0, 0, W, H); X.globalCompositeOperation = 'source-over'; }
  let g = X.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(6,8,14,0.5)'); g.addColorStop(0.15, 'rgba(6,8,14,0)'); g.addColorStop(0.82, 'rgba(6,8,10,0)'); g.addColorStop(1, 'rgba(6,8,10,0.6)'); X.fillStyle = g; X.fillRect(0, 0, W, H);
  // capim desfocado em primeiro plano, embaixo
  X.save(); X.filter = 'blur(9px)'; { const r = rng(21 + K.seed); for (let i = 0; i < 22; i++) { const x = r() * W, hh = 90 + r() * 240, lean = (r() - 0.5) * 140 + Math.sin(t * 1.3 + i) * 10; X.fillStyle = 'rgba(30,22,16,0.9)'; X.beginPath(); X.moveTo(x - 14, H + 10); X.quadraticCurveTo(x + lean * 0.4, H - hh * 0.6, x + lean, H - hh); X.quadraticCurveTo(x + lean * 0.5 + 12, H - hh * 0.5, x + 16, H + 10); X.fill(); } } X.restore();
  g = X.createRadialGradient(W / 2, H * 0.5, 440, W / 2, H * 0.5, 1200); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.45)'); X.fillStyle = g; X.fillRect(0, 0, W, H);
  if (!GRAIN) { const p = document.createElement('canvas'); p.width = p.height = 256; const q = p.getContext('2d'), im = q.createImageData(256, 256), r = rng(99); for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (r() - 0.5) * 120; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } q.putImageData(im, 0, 0); GRAIN = X.createPattern(p, 'repeat'); }
  X.save(); X.translate((t * 997) % 256, (t * 613) % 256); X.globalCompositeOperation = 'overlay'; X.globalAlpha = 0.12; X.fillStyle = GRAIN; X.fillRect(-256, -256, W + 512, H + 512); X.restore();
  // abre e fecha no preto
  const fade = Math.max(1 - ss(t / 0.6), ss((t - (window.END - 0.7)) / 0.7)); if (fade > 0) { X.fillStyle = `rgba(0,0,0,${fade})`; X.fillRect(0, 0, W, H); }
}
window.seek = async t => draw(t); window.dbg = t => { const K = shotAt(t); draw(t); return { cam: K.cam, hero: hero.root.position.toArray(), camp: cam.position.toArray(), hid: hero.root.visible, ZSTOP }; };
draw(0); draw(0); window.READY = true;
