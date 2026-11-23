
  // ================================================================ O Caseiro: shared episode machinery (timeline, captions, vote cards, walking)
  const EP = new URLSearchParams(location.search).get('ep') || 'ep01';
  const TL = await (await fetch(`timeline_cas_${EP}.json`)).json();
  const B = Object.fromEntries(TL.blocos.map(b => [b.id, b]));
  const DUR = TL.duracao;
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  const WD = (txt, bloco, n = 0) => TL.palavras.filter(w => (!bloco || w.bloco === bloco) && norm(w.w) === norm(txt))[n];
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const lerp = (a, b, u) => a + (b - a) * u;
  const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const sine = x => 0.5 - 0.5 * Math.cos(Math.PI * clamp(x));
  const expoOut = x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x));
  const lerpV = (a, b, u) => a.clone().lerp(b, u);
  const mixA = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
  const keyed = (keys, t, d = 0.2) => { let h = keys[0][1]; for (let k = 1; k < keys.length; k++) h = mixA(h, keys[k][1], sstep(keys[k][0], keys[k][0] + d, t)); return h; };
  const shake = (t, t0, a) => { const d = t - t0; if (d < 0 || d > 0.25) return V(0, 0, 0); const k = a * (1 - d / 0.25); return V(k * Math.sin(d * 97), k * Math.cos(d * 83), 0); };
  const yawTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
  const fwdOf = yaw => V(Math.sin(yaw), 0, Math.cos(yaw)), sideOf = yaw => V(Math.cos(yaw), 0, -Math.sin(yaw));
  const tFreeze = B.congela.start;
  // medium close on his face: head, chest and the lantern (the 1.1–1.3 m close cut his face)
  const faceCam = (pos, yaw, d, side = 0.12) => { const f = fwdOf(yaw), s = sideOf(yaw); return [pos.clone().add(f.clone().multiplyScalar(d)).add(s.clone().multiplyScalar(side)).add(V(0, 1.42, 0)), pos.clone().add(V(0, 1.18, 0))]; };

  // his words in karaoke (groups of up to ~21 characters, no group shorter than 0.55 s); the other voices in cold blue
  const HIS = TL.palavras;
  const groups = []; {
    const phrases = []; let ph = [];
    HIS.forEach((w, i) => { ph.push(i); const nx = HIS[i + 1];
      if (/[.?!,…]$/.test(w.w) || !nx || nx.start - w.end > 0.35 || nx.bloco !== w.bloco) { phrases.push(ph); ph = []; } });
    const clen = (p, i, j) => { let c = -1; for (let k = i; k < j; k++) c += HIS[p[k]].w.length + 1; return c; };
    for (const p of phrases) {
      const n = p.length, best = new Array(n + 1).fill(Infinity), from = new Array(n + 1).fill(0); best[0] = 0;
      for (let j = 1; j <= n; j++) for (let i = Math.max(0, j - 4); i < j; i++) {
        const Lc = clen(p, i, j); if (Lc > 21 && j - i > 1) continue;
        const c = 10 + Math.max(0, Lc - 13) * 3 + (j - i === 1 ? 40 : 0) + (HIS[p[j - 1]].end - HIS[p[i]].start < 0.55 ? 45 : 0);
        if (best[i] + c < best[j]) { best[j] = best[i] + c; from[j] = i; }
      }
      const cuts = []; for (let j = n; j > 0; j = from[j]) cuts.unshift([from[j], j]);
      for (const [i, j] of cuts) groups.push(p.slice(i, j));
    }
  }
  const clean = s => s.replace(/\.\.\./g, '…').replace('…', '...').toUpperCase();
  const OTHERS = []; // each other line split in groups of <= 18 characters, spread over its duration
  for (const o of TL.outros || []) {
    const ws = o.texto.split(/\s+/), gs = []; let cur = [];
    for (const w of ws) { if (cur.length && (cur.join(' ') + ' ' + w).length > 18) { gs.push(cur); cur = []; } cur.push(w); }
    if (cur.length) gs.push(cur);
    const tot = gs.reduce((s, g) => s + g.join(' ').length, 0); let a = o.start;
    gs.forEach(g => { const d = (o.end - o.start) * g.join(' ').length / tot; OTHERS.push({ a, b: a + d, w: g.map(clean), quem: o.quem }); a += d; });
  }
  const HARDCUTS = []; // each tail lists its hard cuts: a line that ended before the last cut does not cross it
  function drawCaptions(t, hideHis = false) {
    for (const c of OTHERS) if (t >= c.a && t < c.b + 0.25) { caption(c.w, -1, 1500, null, true);
      if (c.quem === 'dono') { const s = 6, w = textWidth('RÁDIO', s); oc.fillStyle = 'rgba(12,10,26,0.7)'; oc.fillRect(Math.round((OW - w) / 2) - 18, 1400, w + 36, 7 * s + 24); drawText(oc, 'RÁDIO', Math.round((OW - w) / 2), 1412, s, '#b9f0a6'); }
      return; }
    if (hideHis) return;
    let gi = -1; for (let i = 0; i < groups.length; i++) if (t >= HIS[groups[i][0]].start - 0.04) gi = i;
    if (gi < 0) return;
    const g = groups[gi], last = HIS[g[g.length - 1]];
    const nextStart = gi + 1 < groups.length ? HIS[groups[gi + 1][0]].start - 0.04 : 1e9;
    if (t > Math.min(nextStart, last.end + 0.6)) return;
    const lastCut = HARDCUTS.reduce((m, c) => (c <= t && c > m ? c : m), -1); if (last.end < lastCut) return;
    const said = g.map(j => t >= HIS[j].start - 0.03);
    let act = -1; g.forEach((j, k) => { if (t >= HIS[j].start - 0.03 && t <= HIS[j].end + 0.05) act = k; });
    caption(g.map(j => clean(HIS[j].w)), act, 1500, said);
  }
  const speaking = t => HIS.some(w => t >= w.start - 0.02 && t <= w.end + 0.02);
  const othersTalking = (t, quem) => (TL.outros || []).some(o => (!quem || o.quem === quem) && t >= o.start && t <= o.end);

  // the vote: two stacked cards in the options' colours (1 red, 2 amber), each landing in 4 frames
  const OPT_COL = ['#ff6b5b', '#ffc65a'];
  function tiles(rows, y, tIn) {
    const s = 9, wide = rows.reduce((m, [n, w]) => Math.max(m, textWidth(n + '  ' + w, s)), 0), bw = wide + 96, bh = 7 * s + 58, x0 = Math.round((OW - bw) / 2);
    rows.forEach(([n, w], i) => { const k = sstep(tFreeze + 0.09 * i, tFreeze + 0.09 * i + 0.13, tIn); if (k <= 0) return;
      const sc = 0.88 + 0.12 * k, yy = y + i * (bh + 16);
      oc.save(); oc.globalAlpha = k; oc.translate(x0 + bw / 2, yy + bh / 2); oc.scale(sc, sc); oc.translate(-bw / 2, -bh / 2);
      oc.fillStyle = 'rgba(12,10,26,0.86)'; oc.fillRect(0, 0, bw, bh);
      oc.fillStyle = OPT_COL[i]; oc.fillRect(0, 0, bw, 6); oc.fillRect(0, bh - 6, bw, 6); oc.fillRect(0, 0, 6, bh); oc.fillRect(bw - 6, 0, 6, bh);
      drawText(oc, n, 42, 29, s, OPT_COL[i]); drawText(oc, w, 42 + textWidth(n + '  ', s), 29, s, '#fff1d8'); oc.restore(); });
  }
  // the episode title for the first 2 s (series name + episode), small, top
  function titleCard(t, ep, name) {
    const a = sstep(0.1, 0.35, t) * (1 - sstep(2.1, 2.5, t)); if (a <= 0) return;
    oc.globalAlpha = a; const s1 = 6, s2 = 10, l1 = 'O CASEIRO - EP. ' + ep, w1 = textWidth(l1, s1), w2 = textWidth(name, s2);
    oc.fillStyle = 'rgba(8,8,14,0.55)'; oc.fillRect(Math.round((OW - Math.max(w1, w2)) / 2) - 36, 236, Math.max(w1, w2) + 72, 7 * s1 + 7 * s2 + 70);
    drawText(oc, l1, Math.round((OW - w1) / 2), 256, s1, '#ffb36b'); drawText(oc, name, Math.round((OW - w2) / 2), 256 + 7 * s1 + 22, s2, '#fff1d8'); oc.globalAlpha = 1;
  }
  // walking: legs and arms from the stride phase; lantern hand (right) swings less
  const walkPose = (ph, walking, k = 1) => { const sw = walking ? Math.sin(ph) * k : 0;
    return { hipY: 0.82, chest: [0.06, 0, 0], head: [0, 0, 0], armL: [0.45 * sw, 0, -0.1], armR: [-0.35 - 0.2 * sw, 0, 0.15],
      thighL: [0.5 * sw, 0, -0.1], thighR: [-0.5 * sw, 0, 0.1], shinL: [walking ? Math.max(0, -sw) * 0.6 : 0, 0, 0], shinR: [walking ? Math.max(0, sw) * 0.6 : 0, 0, 0] }; };
  const BLINKS = [1.2, 4.6, 9.8, 13.3, 17.9, 21.0, 24.4, 28.2];
  // his lantern: in the right hand, warm key light on his face and the snow
  function holdLantern(t) {
    J.armR.updateWorldMatrix(true, true); const hand = V(0, -0.66, 0).applyMatrix4(J.armR.matrixWorld);
    lantern.visible = true; lantern.position.copy(hand).add(V(0, -0.2, 0)); lantern.rotation.set(0, 0, 0.12 * Math.sin(t * 2.3));
    U.uPortal.value = 0.085; U.uPortalC.value.copy(lantern.position).add(V(0, 0.12, 0)); U.uPortalCol.value.set(1.9, 1.0, 0.38);
  }
  // a soft warm halo around a lantern seen from far (the lantern model alone did not read as 'a light' on the ice)
  function halo(p, r, a) { const [x, y] = toPx(p); if (x < -r || x > OW + r || y < -r || y > OH + r) return; const g = oc.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,200,120,${0.55 * a})`); g.addColorStop(0.35, `rgba(255,150,70,${0.22 * a})`); g.addColorStop(1, 'rgba(255,120,40,0)'); oc.fillStyle = g; oc.fillRect(x - r, y - r, 2 * r, 2 * r); }

  // cover mode (?capa=1): the frame without captions/cards, with the series name, the episode and a 2-3 word title, inside the 4:5 grid crop
  const CAPA = new URLSearchParams(location.search).get('capa');
  function outlined(txt, x, y, s, col) { for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) drawText(oc, txt, x + dx * Math.ceil(s / 2), y + dy * Math.ceil(s / 2), s, '#0b0a10', { shadow: null }); drawText(oc, txt, x, y, s, col, { shadow: null }); }
  function cover(ep, title, hook) {
    oc.clearRect(0, 0, OW, OH);
    const g = oc.createLinearGradient(0, 300, 0, 1000); g.addColorStop(0, 'rgba(6,6,12,0.65)'); g.addColorStop(1, 'rgba(6,6,12,0)'); oc.fillStyle = g; oc.fillRect(0, 300, OW, 700);
    const c = (txt, s, y, col) => outlined(txt, Math.round((OW - textWidth(txt, s)) / 2), y, s, col);
    c('O CASEIRO', 8, 360, '#ffb36b'); c('EP. ' + ep, 11, 440, '#fff1d8');
    title.forEach((ln, i) => c(ln, 19, 560 + i * 165, '#fff1d8'));
    c(hook, 8, 1480, '#ffc65a');
  }
  function resetFrame(t, frozen) {
    if (frozen) U.uTime.value = t;
    U.uFlash.value = 0; U.uSnowPile.value = 0; U.uBurn.value = 0; U.uFire.value.w = 0; U.uCloud.value = 0; U.uTrail.value = 0; U.uSnowK.value = 0.55;
    U.uAurK.value = 0.6; U.uStarK.value = 1; U.uPortal.value = 0; U.uLampRate.value = 2.6; U.uCrack.value.set(0, 0, 0, 0);
    fin.m.uniforms.uExp.value = 4.9; fin.m.uniforms.uFade.value = 1; fin.m.uniforms.uWhite.value = 0; fin.m.uniforms.uSat.value = 1.05; // a little darker and less saturated than the earlier, brighter cut: adult night
    oc.clearRect(0, 0, OW, OH);
    if (fox) fox.visible = false;
    device.visible = cable.visible = sign.visible = false; sweat.visible = false; guy.visible = true; note.visible = true;
    vulto.visible = false; lantern2.visible = false; doorGlow.visible = false;
  }
