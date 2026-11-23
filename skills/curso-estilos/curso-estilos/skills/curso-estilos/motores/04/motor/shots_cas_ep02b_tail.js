
  // ================================================================ EP02B "A Voz" (if 2 won): back up the trail with someone behind; the door he closed is open; a 4th rule
  const T1 = V(87.4, 0, 38.7), A_1 = V(95.2, 0, 47.9), AT_DOOR = V(97.6, 0, 50.35), VUL = V(85.0, 0, 35.9);
  for (const p of [T1, A_1, AT_DOOR, VUL]) p.y = gh(p.x, p.z);
  const DOOR = V(97.5, 12.0, 51.95), INSIDE = V(97.5, 12.2, 53.5);
  const yawUp = yawTo(T1, A_1), yawDoor = yawTo(AT_DOOR, DOOR);
  const tW0 = 0.1, tW1 = B.chegada.start - 0.1;   // the walk back, from the trail to the porch steps
  const w4 = WD('quatro', 'D'), wNao = WD('nao', 'D'), wEssa = WD('essa', 'D');
  const RULES = [['1. NUNCA SAIA DA'], ['   TRILHA.'], ['2. SE OUVIR SEU NOME,'], ['   NÃO RESPONDA.'], ['3. NÃO PISE NO LAGO.'], ['4. SE A PORTA ESTIVER', '#a3160c'], ['   ABERTA, NÃO ENTRE.', '#a3160c']];
  const r4 = w4 ? w4.start : B.D.start + 0.3;
  const EVENTS = [];
  for (let tt = tW0 + 0.1; tt < tW1; tt += 0.4) EVENTS.push({ t: +tt.toFixed(3), tipo: 'passo' });
  EVENTS.push({ t: +B.V3.start.toFixed(3), tipo: 'chamado' }, { t: +(B.chegada.start + 0.2).toFixed(3), tipo: 'porta' }, { t: +r4.toFixed(3), tipo: 'regra4' },
              { t: +B.V4.start.toFixed(3), tipo: 'chamado_dentro' }, { t: +tFreeze.toFixed(3), tipo: 'congela' });
  window.EVENTS = EVENTS.sort((a, b) => a.t - b.t);
  HARDCUTS.push(B.V3.start, B.B.start, B.chegada.start, B.D.start, B.V4.start, B.E.start);

  function apply(tIn) {
    const frozen = tIn >= tFreeze;
    const t = frozen ? tFreeze - 0.001 : tIn;
    resetFrame(t, frozen);
    const talk = speaking(t) && !frozen;
    const mouthTalk = talk ? (Math.sin(t * 2 * Math.PI * 6.5) > -0.2 ? 1 : 0) : 0;
    const blink = BLINKS.some(b => t >= b && t < b + 0.12);
    const cold = t > B.E.start ? 1 : 0, breath = 0.03 * Math.sin(t * 1.7);
    let camP, camT, fov = 42, focus = 4, ap = 0.6; const later = []; let hideHis = false;
    let wide = 1, brow = 1, mouth = talk ? mouthTalk : 0, look = [0, 0];
    let gp, yaw, walking = false, ph = 0;
    if (t < tW1) { const u = clamp((t - tW0) / (tW1 - tW0)); gp = u < 0.78 ? lerpV(T1, A_1, ease(u / 0.78)) : lerpV(A_1, AT_DOOR, ease((u - 0.78) / 0.22)); yaw = lerp(yawUp, yawDoor, sstep(0.72, 0.86, u)); walking = t > tW0; ph = t * 2 * Math.PI * 1.35; }
    else { gp = AT_DOOR.clone(); yaw = lerp(yawDoor, yawDoor + Math.PI, ease(clamp((t - B.V4.end - 0.05) / 0.35))); } // he turns to us at the end of her line, inside the shot behind him
    guy.position.copy(gp); guy.rotation.set(0, yaw, 0);
    const pz = walkPose(ph, walking, 1.1 * sstep(tW0, tW0 + 0.3, t)); // the stride grows in, no pop on frame 4
    const fu = fwdOf(yawUp), su = sideOf(yawUp), fd = fwdOf(yawDoor), sd = sideOf(yawDoor);
    const doorOpen = t >= B.chegada.start; // it was open when he got there: we only see it on the cut to the porch

    if (t < B.V3.start) { // S1 "vocês mandaram eu seguir as regras": he walks up the trail toward us, the lake behind
      camP = gp.clone().add(fu.clone().multiplyScalar(2.6)).add(su.clone().multiplyScalar(0.5)).add(V(0, 1.6, 0)); camT = gp.clone().add(V(0, 1.05, 0));
      fov = 44; focus = camP.distanceTo(gp); ap = 0.5; titleCard(t, '02', 'A VOZ');
    } else if (t < B.B.start) { // S2 the voice behind him; far down the trail a dark figure stands on the white snow
      camP = gp.clone().add(fu.clone().multiplyScalar(3.2)).add(su.clone().multiplyScalar(-0.7)).add(V(0, 1.75, 0)); camT = lerpV(gp.clone().add(V(0, 1.0, 0)), VUL.clone().add(V(0, 1.0, 0)), 0.35);
      fov = 40; focus = camP.distanceTo(gp); ap = 0.35;
    } else if (t < B.chegada.start) { // S3 "não responde, não responde": his face, walking fast toward us
      [camP, camT] = faceCam(gp, yawUp, 2.1);
      fov = 42; focus = camP.distanceTo(camT); ap = 1.1; look = [Math.floor(t * 2) % 2 ? -1 : 1, 0]; mouth = talk ? mouthTalk : 0;
    } else if (t < B.D.start) { // S4 the porch: the door he closed is open, warm light spilling out
      const u = sine((t - B.chegada.start) / (B.D.start - B.chegada.start));
      camP = lerpV(V(99.9, 12.9, 47.9), V(99.6, 12.85, 48.3), u); camT = V(97.4, 12.2, 51.4); fov = 46; focus = camP.distanceTo(AT_DOOR); ap = 0.5;
    } else if (t < B.V4.start && wEssa && t >= wEssa.start - 0.05) { // S5b "essa não tava aqui": his face
      [camP, camT] = faceCam(AT_DOOR, yawDoor + Math.PI, 2.0); fov = 42; focus = camP.distanceTo(camT); ap = 1.2; guy.rotation.y = yawDoor + Math.PI; look = [Math.floor(t * 3) % 2 ? -1 : 1, 0];
    } else if (t < B.V4.start) { // S5 the note on the frame: a 4th line, the ink still wet
      const u = sine((t - B.D.start) / (B.V4.start - B.D.start));
      camP = lerpV(V(96.3, 12.5, 50.9), V(96.45, 12.48, 51.15), u); camT = V(96.55, 12.45, 51.98); fov = 40; focus = camP.distanceTo(camT); ap = 1.2; note.visible = false; // the card is the note: the plate itself, blurred right in front of the lens, flashed through the fade
      hideHis = true; const typed = clamp((t - r4 + 0.05) / 1.4), L4a = RULES[5][0], L4b = RULES[6][0], n4 = Math.round(typed * (L4a.length + L4b.length));
      const rows = RULES.slice(0, 5).concat([[L4a.slice(0, Math.min(n4, L4a.length)), RULES[5][1]], [L4b.slice(0, Math.max(0, n4 - L4a.length)), RULES[6][1]]]);
      const zc = 1 + 0.07 * sine((t - B.D.start) / 3.5);
      later.push(() => { oc.fillStyle = 'rgba(4,4,8,0.45)'; oc.fillRect(0, 0, OW, OH); oc.save(); oc.translate(OW / 2, 900); oc.scale(zc, zc); oc.rotate(0.012 * Math.sin(t * 0.9)); oc.translate(-OW / 2, -900);
        bilhete(rows, 7, sstep(B.D.start, B.D.start + 0.2, t), 470); oc.restore(); }); // the new rule is written as he reads it, the card drifts in
    } else if (t < B.E.start) { // S6 "entra, Caio, tá frio aí fora": from behind him, slowly toward the lit doorway
      const u = sine((t - B.V4.start) / (B.E.start - B.V4.start));
      camP = lerpV(AT_DOOR.clone().add(fd.clone().multiplyScalar(-2.7)).add(sd.clone().multiplyScalar(0.55)).add(V(0, 1.75, 0)), AT_DOOR.clone().add(fd.clone().multiplyScalar(-2.2)).add(sd.clone().multiplyScalar(0.5)).add(V(0, 1.7, 0)), u); camT = DOOR.clone();
      fov = 40; focus = camP.distanceTo(DOOR); ap = 0.6; note.visible = false; // its word sat cut on the frame edge behind him
    } else { // S7 "lá dentro tem lareira; aqui fora, quinze graus negativos": he turns to us, shivering
      const u = sine((t - B.E.start) / (tFreeze - B.E.start)), fo = fwdOf(yawDoor + Math.PI);
      [camP, camT] = faceCam(AT_DOOR, yawDoor + Math.PI, lerp(2.2, 1.85, u));
      fov = 42; focus = camP.distanceTo(camT); ap = 1.3; pz.chest = [0.12, 0, 0.03 * Math.sin(t * 38)]; pz.armL = [-0.4, 0, -0.35]; look = [Math.floor(t * 2.5) % 2 ? -1 : 1, 0];
    }
    // the figure on the trail while the voice calls; the open door, lit from inside
    if (t >= B.V3.start && t < B.chegada.start) { vulto.visible = true; vultoStand.visible = true; vultoKneel.visible = false; vulto.position.copy(VUL); vulto.rotation.y = yawTo(VUL, gp); }
    if (doorOpen) { doorGlow.visible = true; mDoor.uniforms.uGlow.value = 0.55 * (0.94 + 0.06 * Math.sin(t * 9) * Math.sin(t * 3.7)); note.position.set(96.55, 12.45, 51.985);
      U.uFire.value.set(97.5, 12.1, 51.2, 0.22 * (0.94 + 0.06 * Math.sin(t * 9))); }
    pz.chest = [pz.chest[0] + breath, pz.chest[1], pz.chest[2]];
    pose(pz); face.look.set(look[0], look[1]); face.set(wide, mouth, brow, blink ? 1 : 0);
    holdLantern(t);
    if (frozen) face.look.set(Math.floor((tIn - tFreeze) / 0.35) % 2 ? -1 : 1, 0);
    if (frozen) fov *= 1 - 0.035 * sine((tIn - tFreeze) / (DUR - tFreeze));
    setCamera(camP, camT, fov); guy.updateMatrixWorld(true);
    dof.m.uniforms.uFocus.value = focus; dof.m.uniforms.uAperture.value = ap;
    for (const f of later) f();
    if (frozen) {
      fin.m.uniforms.uSat.value = 0.75; fin.m.uniforms.uExp.value = 4.4;
      tiles([['1', 'ENTRO'], ['2', 'FICO AQUI FORA']], 1010, tIn);
      if (tIn >= B.G.start - 0.05) drawCaptions(tIn);
    } else drawCaptions(t, hideHis);
    if (CAPA) cover(...['02', ['A VOZ'], 'TINHA UMA REGRA NOVA.']);
    ovTex.needsUpdate = true;
  }
  return { apply, fxScene, duration: DUR, SH: [0, B.chegada.start, tFreeze] };
}
