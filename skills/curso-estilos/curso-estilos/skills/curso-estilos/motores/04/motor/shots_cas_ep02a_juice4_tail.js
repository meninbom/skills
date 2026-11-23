
  // ================================================================ EP02A "O Lago" (if 1 won): off the trail, onto the ice, only her lantern; the radio calls his name
  const T1 = V(87.4, 0, 38.7), ICE0 = V(84.3, 0, 42.8), LAMP2 = V(81.2, 0, 46.2), PORCH = V(95.5, 16.5, 49.5), CAB = V(97.5, 12.6, 51.0);
  for (const p of [T1, ICE0, LAMP2]) p.y = gh(p.x, p.z);
  const yawIce = yawTo(T1, ICE0), yawLamp = yawTo(ICE0, LAMP2);
  const STAND = LAMP2.clone().add(ICE0.clone().sub(LAMP2).setY(0).normalize().multiplyScalar(0.75)); STAND.y = LAMP2.y;
  const yawCab = yawTo(STAND, CAB);
  const tCrack = B.A.end + 0.2, tIce0 = B.B.start + 0.2, tIce1 = B.C.start + 1.6, tRacha = B.D.end + 0.2, tOut = tRacha + 0.35;
  const wRadio = WD('radio', 'F');
  const tGive = [tRacha + 2.25, tRacha + 2.6]; // the two loud creaks of the 'rangido' (15,45 / 15,80 s)
  const crackC = t => t < tRacha ? [ICE0, 1.1 * expoOut((t - tCrack) / 0.35) * (t >= tCrack ? 1 : 0)] : [STAND, 2.3 * expoOut((t - tRacha) / 0.45) + tGive.reduce((r, g) => r + 0.55 * expoOut((t - g) / 0.2) * (t >= g ? 1 : 0), 0)];
  // JUICE (Missao 8, 24/10): only the ice crack (tRacha), the one 'big' impact of the piece. Pure functions of t, no random.
  // hit-stop: the IMAGE holds 3 frames on the first frame that shows the crack, then catches up over the next 3 frames (r3: JSYNC 6/30, DECAY 8/s -> rest 0,20 s after the 1st crack frame, 0,23 s after tRacha)
  // (the audio is the mix and never stops); from J0 + 6/30 on every frame is the original frame again.
  const FPS = 30, J0 = (Math.floor(tRacha * FPS + 1e-6) + 1) / FPS, JHOLD = 2 / FPS, JSYNC = 6 / FPS;
  const remap = t => t < J0 ? t : t < J0 + JHOLD ? J0 : t < J0 + JSYNC ? J0 + (t - J0 - JHOLD) * JSYNC / (JSYNC - JHOLD) : t;
  // juice4 (r4): trauma ONLY on the crack (0.8 when the image moves again); the two creaks keep the original linear shake() as in shots_cas_ep02a_tail.js, linear decay, shake = trauma^2, camera only
  const HITS = [{ t: J0 + 3 / FPS - 1e-4, a: 0.8 }], DECAY = 8, MXP = 12, MYP = 8, MRD = 0.6 * Math.PI / 180;
  const trauma = t => { let tr = 0, last = 0; for (const h of HITS) { if (h.t > t) break; tr = Math.min(1, Math.max(0, tr - DECAY * (h.t - last)) + h.a); last = h.t; } return Math.max(0, tr - DECAY * (t - last)); };
  // flash ON THE CRACK only (its emissive, via uCrack.w with the radius kept): 2 frames, strong then half
  const JFLASH = t => t >= J0 && t < J0 + 1 / FPS ? 9 : t >= J0 + 1 / FPS && t < J0 + 2 / FPS ? 4 : 1;
  window.JUICE = { tRacha, J0, HITS: HITS.map(h => h.t) };
  const EVENTS = [];
  for (let tt = 0.15; tt < B.A.end; tt += 0.5) EVENTS.push({ t: +tt.toFixed(3), tipo: 'passo_neve' });
  for (let tt = tIce0 + 0.1; tt < tIce1; tt += 0.48) EVENTS.push({ t: +tt.toFixed(3), tipo: 'passo_gelo' });
  EVENTS.push({ t: +tCrack.toFixed(3), tipo: 'estalo' }, { t: +(B.R.start - 0.15).toFixed(3), tipo: 'radio' }, { t: +B.R.end.toFixed(3), tipo: 'radio_fim' },
              { t: +tRacha.toFixed(3), tipo: 'racha' }, { t: +tOut.toFixed(3), tipo: 'apaga' }, { t: +tFreeze.toFixed(3), tipo: 'congela' });
  window.EVENTS = EVENTS.sort((a, b) => a.t - b.t);
  HARDCUTS.push(B.A.end, B.C.start, B.R.start, B.D.start, B.D.end + 0.001, B.F.start);

  function apply(tReal) {
    const tIn = remap(tReal);
    if (tIn !== tReal) { U.uTime.value = tIn; U.uWinFlick.value = 1.0 + 0.06 * Math.sin(tIn * 2.1) + 0.04 * Math.sin(tIn * 5.3 + 1.0) + 0.025 * Math.sin(tIn * 11.7 + 2.0);
      U.uLantFlick.value = 1.0 + 0.05 * Math.sin(tIn * 3.7 + 0.5) + 0.04 * Math.sin(tIn * 9.1) + 0.03 * Math.sin(tIn * 17.3 + 1.3); }
    const frozen = tIn >= tFreeze;
    const t = frozen ? tFreeze - 0.001 : tIn;
    resetFrame(t, frozen);
    const talk = speaking(t) && !frozen;
    const mouthTalk = talk ? (Math.sin(t * 2 * Math.PI * 6.5) > -0.2 ? 1 : 0) : 0;
    const blink = BLINKS.some(b => t >= b && t < b + 0.12);
    const breath = 0.03 * Math.sin(t * 1.7) + 0.03 * sstep(B.E.start, B.E.start + 0.4, t) * Math.sin(t * 4.2);
    let camP, camT, fov = 42, focus = 4, ap = 0.6; const later = [];
    let wide = 1, brow = 1, mouth = talk ? mouthTalk : 0, look = [0, 0];
    let gp, yaw, walking = false, ph = 0, k = 1;
    if (t < B.A.end) { gp = lerpV(T1, ICE0, ease(clamp(t / B.A.end))); yaw = yawIce; walking = true; ph = t * 2 * Math.PI * 1.0; k = 1.3; } // deep snow: slower, higher steps
    else if (t < tIce0) { gp = ICE0.clone(); yaw = yawIce; }
    else if (t < tIce1 + 0.25) { gp = lerpV(ICE0, STAND, ease(clamp((t - tIce0) / (tIce1 - tIce0)))); yaw = lerp(yawIce, yawLamp, sstep(tIce0 - 0.1, tIce0 + 0.3, t)); walking = true; ph = (t - tIce0) * 2 * Math.PI * 1.1; k = sstep(tIce0, tIce0 + 0.25, t) * (1 - sstep(tIce1 - 0.25, tIce1 + 0.2, t)); }
    else { gp = STAND.clone(); yaw = lerp(yawLamp, yawCab, ease(clamp((t - B.R.end + 0.45) / 0.6))); }
    guy.position.copy(gp); guy.rotation.set(0, yaw, 0);
    const pz = walkPose(ph, walking, k);
    const fl = fwdOf(yawLamp), sl = sideOf(yawLamp), fc = fwdOf(yawCab), sc = sideOf(yawCab);
    const [cc, cr] = crackC(t); if (t >= tCrack) { const W = JFLASH(tReal); if (W === 1) U.uCrack.value.set(cc.x, cc.z, cr, 1.0); else U.uCrack.value.set(cc.x, cc.z, cr / W, W); }

    if (t < B.A.end) { // S1 "vocês mandaram eu ir até o lago": off the trail, knee-deep in the snow
      const f = fwdOf(yawIce), s = sideOf(yawIce);
      camP = gp.clone().add(f.clone().multiplyScalar(2.7)).add(s.clone().multiplyScalar(0.8)).add(V(0, 2.45, 0)); camT = gp.clone().add(V(0, 0.75, 0));
      fov = 44; focus = camP.distanceTo(gp); ap = 0.6; titleCard(t, '02', 'O LAGO');
    } else if (t < B.C.start) { // S2 the first step on the ice, from above: the crack runs from his boot; the camera kicks and comes back
      const f = fwdOf(yawIce), u = sine((t - B.A.end) / (B.C.start - B.A.end));
      const fp = lerpV(ICE0, gp, sstep(tIce0, tIce0 + 0.6, t)); // after the first step the camera goes with him
      camP = fp.clone().add(f.clone().multiplyScalar(1.8)).add(V(0.15, lerp(3.3, 3.1, u), 0)).add(shake(t, tCrack, 0.07)); camT = fp.clone().add(f.clone().multiplyScalar(0.3));
      fov = 56; focus = camP.distanceTo(ICE0.clone().add(V(0, 0.8, 0))); ap = 0.4; look = [0, -1]; pz.head = [0.4, 0, 0];
    } else if (t < B.R.start) { // S3 "não tem ninguém aqui, só a lanterna dela": low on the ice behind the lantern, he arrives
      const u = sine((t - B.C.start) / (B.R.start - B.C.start));
      camP = LAMP2.clone().add(fl.clone().multiplyScalar(2.3)).add(sl.clone().multiplyScalar(-0.45)).add(V(0, 0.8, 0)); camT = lerpV(LAMP2.clone().add(V(0, 0.3, 0)), gp.clone().add(V(0, 1.0, 0)), 0.5 + 0.2 * u);
      fov = 44; focus = camP.distanceTo(gp); ap = 0.8; look = [0, -1]; pz.head = [lerp(0.1, 0.35, sstep(tIce1 - 0.2, tIce1 + 0.2, t)), 0, 0];
    } else if (t < B.D.start) { // S4 the radio: "Caio. Sai do gelo. Agora." — seen from the cabin porch, he is small out on the ice
      const u = sine((t - B.R.start) / (B.D.start - B.R.start));
      camP = PORCH.clone(); camT = STAND.clone().add(V(0, 0.9, 0)); fov = lerp(26, 20, u); focus = camP.distanceTo(STAND); ap = 0.3;
    } else if (t < B.D.end + 0.001) { // S5 "ele sabe que eu tô aqui?": his face, turned to the cabin
      [camP, camT] = faceCam(STAND, yawCab, 2.0);
      fov = 42; focus = camP.distanceTo(camT); ap = 1.2; look = [Math.floor(t * 3) % 2 ? -1 : 1, 0];
    } else if (t < B.F.start) { // S6 the ice gives: the crack runs round both lanterns and hers goes out
      const u = sine((t - B.D.end) / (B.F.start - B.D.end));
      const sink = tGive.reduce((d, g) => d + 0.09 * sstep(g, g + 0.15, t), 0);
      camP = STAND.clone().add(fc.clone().multiplyScalar(2.4)).add(sc.clone().multiplyScalar(0.4)).add(V(0, lerp(2.5, 2.3, u) - sink, 0)).add(shake(t, tGive[0], 0.04)).add(shake(t, tGive[1], 0.04)); camT = STAND.clone().add(V(0, 0.3, 0)); // juice4: crack shake -> trauma below; creak shakes = original
      fov = 50; focus = camP.distanceTo(STAND); ap = 0.6; look = [0, -1]; pz.head = [0.3, 0, 0];
      pz.armL = [0, 0, -0.75]; pz.armR = [-0.35, 0, 0.55]; pz.hipY = 0.76; pz.thighL = [-0.25, 0, -0.1]; pz.shinL = [0.35, 0, 0];
    } else { // S7 "o rádio me chamou pelo nome. Regra dois: não responde.": close, panting; a glance down at the radio
      const u = sine((t - B.F.start) / (tFreeze - B.F.start));
      [camP, camT] = faceCam(STAND, yawCab, lerp(2.2, 1.85, u));
      fov = 42; focus = camP.distanceTo(camT); ap = 1.3;
      const down = wRadio && t > wRadio.start - 0.1 && t < wRadio.end + 0.7; look = down ? [0, -1] : [0, 0]; pz.head = keyed([[0, [0.05, 0, 0]], [wRadio ? wRadio.start - 0.1 : 1e9, [0.35, 0, 0]], [wRadio ? wRadio.end + 0.7 : 1e9, [0.05, 0, 0]]], t, 0.2);
    }
    // her lantern on the ice: lit until the crack, then it goes out
    lantern2.visible = true; lantern2.position.copy(LAMP2).add(V(0, 0.14, 0)); const lit = 1 - sstep(tOut - 0.05, tOut + 0.15, t);
    lantern2.userData.glass.uniforms.uGlow.value = 1.4 * lit; if (lit > 0.01) later.push(() => halo(LAMP2.clone().add(V(0, 0.15, 0)), t >= B.R.start && t < B.D.start ? 60 : 150, lit)); if (lit > 0.01) U.uFire.value.set(LAMP2.x, LAMP2.y + 0.35, LAMP2.z, 0.09 * lit * (0.92 + 0.08 * Math.sin(t * 23) * Math.sin(t * 7.1)));
    // the radio LED while the owner talks
    mRadLed.uniforms.uGlow.value = othersTalking(t, 'dono') ? 0.6 + 0.6 * Math.abs(Math.sin(t * 19)) : 0.05;
    pz.chest = [pz.chest[0] + breath, pz.chest[1], pz.chest[2]];
    pose(pz); face.look.set(look[0], look[1]); face.set(wide, mouth, brow, blink ? 1 : 0);
    holdLantern(t);
    if (frozen) face.look.set(Math.floor((tIn - tFreeze) / 0.35) % 2 ? -1 : 1, 0);
    if (frozen) fov *= 1 - 0.035 * sine((tIn - tFreeze) / (DUR - tFreeze));
    setCamera(camP, camT, fov);
    if (t >= B.D.end + 0.001 && t < B.F.start) { const s = trauma(tReal) ** 2; if (s > 0) { const k = (tReal - J0) * FPS - 3, fpx = 960 / Math.tan(fov * Math.PI / 360);
      camera.rotateY(Math.atan(MXP * s * (0.6 * Math.sin(k * 1.7 + 1.2) + 0.4 * Math.sin(k * 3.1 + 1.4)) / fpx)); camera.rotateX(Math.atan(MYP * s * Math.sin(k * 2.3 + 2) / fpx)); camera.rotateZ(MRD * s * Math.sin(k * 1.1 + 0.6));
      camera.updateMatrixWorld(true); } }
    guy.updateMatrixWorld(true);
    dof.m.uniforms.uFocus.value = focus; dof.m.uniforms.uAperture.value = ap;
    for (const f of later) f();
    if (frozen) {
      fin.m.uniforms.uSat.value = 0.75; fin.m.uniforms.uExp.value = 4.4;
      tiles([['1', 'RESPONDO'], ['2', 'CORRO CALADO']], 1010, tIn);
      if (tIn >= B.G.start - 0.05) drawCaptions(tIn);
    } else drawCaptions(tReal); // captions follow the voice (real time), never the held image
    if (CAPA) cover(...['02', ['O LAGO'], 'REGRA TRÊS JÁ ERA.']);
    ovTex.needsUpdate = true;
  }
  return { apply, fxScene, duration: DUR, SH: [0, tCrack, tRacha, tFreeze] };
}
