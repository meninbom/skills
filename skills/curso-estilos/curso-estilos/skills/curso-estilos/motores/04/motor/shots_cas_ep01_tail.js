
  // ================================================================ EP01 "As Regras": arrival, the note on the door, the midnight round, the light on the lake
  const A_0 = V(91.4, 0, 43.6), A_1 = V(95.2, 0, 47.9);                  // up the path to the porch
  const NOTE = V(97.5, 12.45, 51.98), AT_DOOR = V(96.95, 0, 51.05);       // the note on the door, where he stands to read it
  const T0 = V(92.4, 0, 44.7), T1 = V(87.4, 0, 38.7);                     // the midnight round: down the trail toward the lake
  const LAMP2 = V(81.2, 0, 46.2), VUL = V(81.65, 0, 46.6);                // her lantern on the ice, the figure kneeling by it
  for (const p of [A_0, A_1, AT_DOOR, T0, T1, LAMP2, VUL]) p.y = gh(p.x, p.z);
  const yawA = yawTo(A_0, A_1), yawT = yawTo(T0, T1), yawLake = yawTo(T1, LAMP2);
  const tWalkA1 = B.B.start - 0.15, tWalkT0 = B.D.end + 0.1, tWalkT1 = B.V1.start + 0.05;
  const wNunca = WD('nunca', 'C'), wSe = WD('se', 'C'), wPise = WD('pise', 'C'), wFor = WD('for', 'F');
  const RULES = [['1. NUNCA SAIA DA'], ['   TRILHA.'], ['2. SE OUVIR SEU NOME,'], ['   NÃO RESPONDA.'], ['3. NÃO PISE NO LAGO.']];
  const ruleT = [wNunca, wNunca, wSe, wSe, wPise].map((w, i) => (w ? w.start : B.C.start + 1.2 * i) + (i % 2 ? 0.25 : 0));
  const EVENTS = [];
  for (let tt = 0.2; tt < tWalkA1; tt += 0.42) EVENTS.push({ t: +tt.toFixed(3), tipo: 'passo' });
  for (let tt = tWalkT0 + 0.1; tt < tWalkT1; tt += 0.42) EVENTS.push({ t: +tt.toFixed(3), tipo: 'passo' });
  EVENTS.push({ t: +B.V1.start.toFixed(3), tipo: 'chamado' }, { t: +B.V2.start.toFixed(3), tipo: 'luz' }, { t: +tFreeze.toFixed(3), tipo: 'congela' });
  window.EVENTS = EVENTS.sort((a, b) => a.t - b.t);
  HARDCUTS.push(B.B.start, B.C.start, B.D.start, B.D.end + 0.001, B.E.start, B.V2.start, B.F.start);

  function apply(tIn) {
    const frozen = tIn >= tFreeze;
    const t = frozen ? tFreeze - 0.001 : tIn;
    resetFrame(t, frozen);
    const talk = speaking(t) && !frozen;
    const mouthTalk = talk ? (Math.sin(t * 2 * Math.PI * 6.5) > -0.2 ? 1 : 0) : 0;
    const blink = BLINKS.some(b => t >= b && t < b + 0.12);
    const breath = 0.03 * Math.sin(t * 1.7);
    let camP, camT, fov = 42, focus = 4, ap = 0.6; const later = []; let hideHis = false;
    let pz, wide = 0, brow = 0, mouth = talk ? mouthTalk : 0, look = [0, 0];
    // where he is and which way he faces
    let gp, yaw, walking = false, ph = 0;
    if (t < B.B.start) { const u = clamp(t / tWalkA1); gp = lerpV(A_0, A_1, u); yaw = yawA; walking = t < tWalkA1; ph = t * 2 * Math.PI * 1.25; }
    else if (t < B.D.end) { gp = AT_DOOR.clone(); yaw = t < B.D.start ? yawTo(AT_DOOR, NOTE) : Math.PI; }
    else { const u = clamp((t - tWalkT0) / (tWalkT1 - tWalkT0)); gp = lerpV(T0, T1, ease(u)); walking = t > tWalkT0 && t < tWalkT1 + 0.2; ph = (t - tWalkT0) * 2 * Math.PI * 1.25;
      yaw = t < B.V2.start ? yawT : lerp(yawT, yawLake, ease(clamp((t - B.V2.start) / 0.7))); }
    guy.position.copy(gp); guy.rotation.set(0, yaw, 0);
    pz = walkPose(ph, walking, t > B.D.end ? sstep(tWalkT0, tWalkT0 + 0.25, t) * (1 - sstep(tWalkT1 - 0.3, tWalkT1 + 0.2, t)) : 1);

    if (t < B.B.start) { // S1 the hook: the lit cabin in the snow, him small on the path with the lantern
      const u = sine(t / B.B.start);
      camP = lerpV(V(84.3, 17.0, 33.0), V(84.9, 16.6, 34.0), u); camT = lerpV(V(95.0, 12.4, 49.0), V(95.4, 12.3, 49.4), u);
      fov = 38; focus = camP.distanceTo(gp); ap = 0.35; titleCard(t, '01', 'AS REGRAS');
    } else if (t < B.C.start) { // S2 the porch: a note nailed to the door
      const u = sine((t - B.B.start) / (B.C.start - B.B.start));
      camP = lerpV(V(99.7, 12.75, 48.4), V(99.4, 12.7, 48.8), u); camT = V(97.3, 12.25, 51.5); fov = 44;
      focus = camP.distanceTo(NOTE); pz.head = [-0.18, 0.08, 0]; look = [0, 1];
    } else if (t < B.D.start) { // S3 the note, read out: the rules appear one by one, no caption (the card is the text)
      const u = sine((t - B.C.start) / (B.D.start - B.C.start));
      camP = lerpV(V(98.0, 12.5, 50.6), V(97.8, 12.48, 51.0), u); camT = NOTE.clone(); fov = 40; focus = camP.distanceTo(NOTE); ap = 1.2;
      hideHis = true; const shown = ruleT.reduce((s, tr) => s + sstep(tr - 0.05, tr + 0.15, t), 0);
      later.push(() => { oc.fillStyle = 'rgba(4,4,8,0.45)'; oc.fillRect(0, 0, OW, OH); bilhete(RULES, shown, sstep(B.C.start, B.C.start + 0.2, t), 560); });
    } else if (t < B.D.end + 0.001) { // S4 he turns to us: "quinze mil pra não fazer nada"
      const u = sine((t - B.D.start) / (B.D.end - B.D.start));
      [camP, camT] = faceCam(AT_DOOR, Math.PI, lerp(2.3, 2.0, u)); fov = 40;
      focus = camP.distanceTo(camT); mouth = talk ? mouthTalk : -1; note.visible = false; // its 'REGRAS' sat cut on the frame edge behind him pz.head = [0.02, -0.12 * sine((t - B.D.start) / 0.8), 0.05];
    } else if (t < B.E.start) { // S5 midnight: the round down the trail; he stops at his name
      const fw = fwdOf(yawT), sd = sideOf(yawT);
      camP = gp.clone().add(fw.clone().multiplyScalar(-3.0)).add(sd.clone().multiplyScalar(0.35)).add(V(0, 1.9, 0)); camT = gp.clone().add(fw.clone().multiplyScalar(3)).add(V(0, 0.9, 0));
      fov = 46; focus = camP.distanceTo(gp); ap = 0.5;
      if (t >= B.V1.start) { pz.head = mixA([0, 0, 0], [-0.05, 0.75, 0], sstep(B.V1.start, B.V1.start + 0.35, t)); wide = 1; brow = 1; }
      if (t < B.V1.start) later.push(() => { const a = sstep(tWalkT0, tWalkT0 + 0.2, t) * (1 - sstep(B.V1.start - 0.2, B.V1.start, t)); if (a <= 0) return;
        const s = 7, txt = 'MEIA-NOITE', w = textWidth(txt, s); oc.globalAlpha = a; oc.fillStyle = 'rgba(8,8,14,0.55)'; oc.fillRect(Math.round((OW - w) / 2) - 30, 290, w + 60, 7 * s + 40);
        drawText(oc, txt, Math.round((OW - w) / 2), 310, s, '#cfe4ff'); oc.globalAlpha = 1; });
    } else if (t < B.V2.start) { // S5b "ninguém aqui sabe o meu nome": his face, the lantern under it
      const fw = fwdOf(yawT), sd = sideOf(yawT), u = sine((t - B.E.start) / (B.V2.start - B.E.start));
      [camP, camT] = faceCam(T1, yawT, lerp(2.2, 1.95, u));
      fov = 42; focus = camP.distanceTo(camT); ap = 1.0; wide = 1; brow = 1; look = [Math.floor(t * 2.5) % 2 ? -1 : 1, 0];
      pz.head = keyed([[0, [-0.05, 0.75, 0]], [B.E.start, [-0.02, 0.15, 0]]], t, 0.3);
    } else if (t < B.F.start) { // S6 over his shoulder: a small light in the middle of the ice, and someone kneeling by it
      const fl = fwdOf(yawLake), sl = sideOf(yawLake), u = sine((t - B.V2.start) / (B.F.start - B.V2.start));
      camP = T1.clone().add(fl.clone().multiplyScalar(-0.9)).add(sl.clone().multiplyScalar(0.5)).add(V(0, 2.5, 0)); camT = LAMP2.clone().add(V(0, 0.45, 0));
      fov = lerp(36, 30, u); focus = camP.distanceTo(LAMP2); ap = 0.9; wide = 1; brow = 1;
      fin.m.uniforms.uExp.value = 3.7; later.push(() => halo(LAMP2.clone().add(V(0, 0.15, 0)), 120, 1)); // night: the lake is not the brightest shot; her lantern reads as a light
    } else { // S7 his face, deciding: "se eu ficar na trilha, ela congela; se eu for… quebro duas regras"
      const fl = fwdOf(yawLake), sl = sideOf(yawLake), u = sine((t - B.F.start) / (tFreeze - B.F.start));
      [camP, camT] = faceCam(T1, yawLake, lerp(2.2, 1.85, u));
      fov = 42; focus = camP.distanceTo(camT); ap = 1.3; wide = 1; brow = 1;
      pz.head = keyed([[0, [0.05, 0, 0]], [wFor ? wFor.start - 0.1 : 1e9, [0.05, 0.5, 0]], [wFor ? wFor.end + 0.6 : 1e9, [0.05, 0, 0]]], t, 0.25);
      look = wFor && t > wFor.start - 0.1 && t < wFor.end + 0.6 ? [-1, 0] : [0, 0];
    }
    // her lantern and the figure: on the ice from the moment the light is seen
    if (t >= B.V2.start - 0.01) { lantern2.visible = true; lantern2.position.copy(LAMP2).add(V(0, 0.14, 0)); vulto.visible = true; vultoKneel.visible = true; vultoStand.visible = false;
      vulto.position.copy(VUL); vulto.rotation.y = yawTo(VUL, T1);
      U.uFire.value.set(LAMP2.x, LAMP2.y + 0.35, LAMP2.z, 0.09 * (0.92 + 0.08 * Math.sin(t * 23) * Math.sin(t * 7.1))); }
    pz.chest = [pz.chest[0] + breath, pz.chest[1], pz.chest[2]];
    pose(pz); face.look.set(look[0], look[1]); face.set(wide, mouth, brow, blink ? 1 : 0);
    holdLantern(t);
    if (frozen) face.look.set(Math.floor((tIn - tFreeze) / 0.35) % 2 ? -1 : 1, 0); // at the vote his eyes keep darting between the two options
    if (frozen) fov *= 1 - 0.035 * sine((tIn - tFreeze) / (DUR - tFreeze)); // the frozen frame breathes in
    setCamera(camP, camT, fov); guy.updateMatrixWorld(true);
    dof.m.uniforms.uFocus.value = focus; dof.m.uniforms.uAperture.value = ap;
    for (const f of later) f();
    if (frozen) {
      fin.m.uniforms.uSat.value = 0.75; fin.m.uniforms.uExp.value = 4.4;
      tiles([['1', 'VOU ATÉ O LAGO'], ['2', 'SIGO AS REGRAS']], 1010, tIn);
      if (tIn >= B.G.start - 0.05) drawCaptions(tIn);
    } else drawCaptions(t, hideHis);
    if (CAPA) cover(...['01', ['AS', 'REGRAS'], '15 MIL REAIS. 3 REGRAS.']);
    ovTex.needsUpdate = true;
  }
  return { apply, fxScene, duration: DUR, SH: [0, B.C.start, B.V2.start, tFreeze] };
}
