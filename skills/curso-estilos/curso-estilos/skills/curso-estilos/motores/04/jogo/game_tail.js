  // ================================================================ O CASEIRO: A PRIMEIRA NOITE (jogo)
  // The same world, character and props as the series. Here the "shots" module is the game: input, the night's script,
  // the camera, the HUD and the sound. Every voice line is a file already recorded for EP01/EP02A/EP02B.
  const WM = await import('./world.mjs');
  const { CABIN, GROUND, POND } = WM;
  const HH = (x, z) => W.H[Math.floor(x) + NX * Math.floor(z)];
  const P3 = (x, z) => { const p = V(x, 0, z); p.y = gh(x, z); return p; };
  const AT_DOOR = P3(96.95, 51.05), LAMP2 = P3(81.2, 46.2), VUL = P3(81.65, 46.6), RONDA = P3(87.4, 38.7);
  const PATH = WM.curves().path;
  const START0 = (() => { let b = PATH[0], bd = 1e9; for (const [x, z] of PATH) { const d = Math.abs(z - 33.5); if (d < bd) { bd = d; b = [x, z]; } } return P3(b[0], b[1]); })();
  const TREES = W.trees.filter(t => t.x > 55 && t.x < 120 && t.z > 18 && t.z < 70);
  const onPond = (x, z) => HH(x, z) < GROUND && Math.hypot((x - POND.x) / 1.25, z - POND.z) < POND.r + 0.6;
  const onPorch = (x, z) => x > 93 && x < 101.5 && z > 47.5 && z < 52.2;
  const onTrail = (x, z) => WM.distPath(x, z) < 2.2 || (x > 93 && x < 101.5 && z > 47.5 && z < 52.2);
  // the ground under him, read from the voxels (the series' gh() is the terrain only: no bridge, no porch deck)
  const top = (x, z, yFrom) => { const xi = Math.floor(x), zi = Math.floor(z); for (let y = Math.floor(yFrom); y >= 0; y--) if (W.get(xi, y, zi)) return y + 1; return GROUND; };
  const START = START0.clone(); START.y = top(START.x, START.z, GROUND + 3);
  const solid = (x, y, z) => !!W.get(Math.floor(x), Math.floor(y), Math.floor(z));
  function walkable(x, z, y) { // a step of at most one block, and room for his body (trunks, walls and rails block)
    if (x < 64 || x > 112 || z < 22 || z > 63) return false;
    const f = top(x, z, y + 1.2); if (f - y > 1.15) return false;
    return !solid(x, f + 0.5, z) && !solid(x, f + 1.5, z);
  }
  // barefoot prints from the door down to the ice (they appear if he opens the door at midnight, and stay all night)
  const prints = new THREE.Group(); scene.add(prints); prints.visible = false;
  function buildPrints() { const mP = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.03, 0.04, 0.07) }), g = new THREE.BoxGeometry(0.16, 0.02, 0.26);
    const a = V(96.4, 0, 50.4), b = V(LAMP2.x + 1.4, 0, LAMP2.z - 0.3), n = Math.floor(a.distanceTo(b) / 0.5), yaw = yawTo(a, b), sd = V(-Math.cos(yaw), 0, Math.sin(yaw));
    for (let i = 0; i < n; i++) { const q = lerpV(a, b, i / n).add(sd.clone().multiplyScalar(i % 2 ? 0.13 : -0.13)); q.y = top(q.x, q.z, GROUND + 4) + 0.012;
      const m = new THREE.Mesh(g, mP); m.position.copy(q); m.rotation.y = yaw; m.frustumCulled = false; prints.add(m); } }
  // the camera never sits inside snow, a bank or a wall: march from what it looks at towards it and stop before the first block
  function clearCam(tt, tp) { const d = tp.clone().sub(tt), L = d.length(); d.divideScalar(L);
    for (let k = 0.5; k <= L; k += 0.1) { const q = tt.clone().addScaledVector(d, k); if (solid(q.x, q.y, q.z) || solid(q.x, q.y - 0.3, q.z)) return tt.clone().addScaledVector(d, Math.max(0.7, k - 0.35)); }
    return tp; }
  const rightOf = yaw => V(-Math.cos(yaw), 0, Math.sin(yaw));

  // ------------------------------------------------------------ sound (Web Audio): levels measured by prep_audio.py
  const GAINS = await (await fetch('audio/gains.json')).json();
  let AC = null, master = null, bedBus = null; const BUF = {};
  async function loadBuf(url) { if (BUF[url]) return BUF[url]; const ab = await (await fetch(url)).arrayBuffer(); return (BUF[url] = await AC.decodeAudioData(ab)); }
  function audioInit() {
    if (AC) return; AC = new (window.AudioContext || window.webkitAudioContext)();
    const lim = AC.createDynamicsCompressor(); lim.threshold.value = -8; lim.knee.value = 4; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.15;
    master = AC.createGain(); master.gain.value = P.has('mute') ? 0 : 0.9; // ?mute: tests never play through the speakers master.connect(lim); lim.connect(AC.destination);
    bedBus = AC.createGain(); bedBus.connect(master); // ambience + theme: ducked under every voice line
    for (const u of Object.keys(GAINS)) loadBuf(u).catch(() => {});
  }
  function fxChain(kind) { // 'eco' = the voice in the dark; 'radio' = the owner on the belt radio; 'dentro' = from inside the cabin
    const inp = AC.createGain(), out = AC.createGain(); out.connect(master);
    if (kind === 'eco') { const d = AC.createDelay(1); d.delayTime.value = 0.27; const fb = AC.createGain(); fb.gain.value = 0.38; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
      const wet = AC.createGain(); wet.gain.value = 0.45; inp.connect(out); inp.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(wet); wet.connect(out); }
    else if (kind === 'radio') { const hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 420; const bp = AC.createBiquadFilter(); bp.type = 'peaking'; bp.frequency.value = 1900; bp.gain.value = 6;
      const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3400; inp.connect(hp); hp.connect(bp); bp.connect(lp); lp.connect(out); out.gain.value = 1.15; }
    else if (kind === 'dentro') { const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; const d = AC.createDelay(1); d.delayTime.value = 0.06; const wet = AC.createGain(); wet.gain.value = 0.3;
      inp.connect(lp); lp.connect(out); lp.connect(d); d.connect(wet); wet.connect(out); }
    else inp.connect(out);
    return inp;
  }
  async function play(url, { gain = 1, kind = null, loop = false, rate = 1, bed = false } = {}) {
    if (!AC) return null; const b = await loadBuf(url); const s = AC.createBufferSource(); s.buffer = b; s.loop = loop; s.playbackRate.value = rate;
    const g = AC.createGain(); g.gain.value = (GAINS[url] || 1) * gain; s.connect(g); g.connect(kind ? fxChain(kind) : bed ? bedBus : master); s.start();
    return { src: s, g, dur: b.duration / rate };
  }
  // real foley only (Sonniss GDC, cut by prep_foley.py); a family = several takes of the same thing, never the same take twice in a row
  const FAM = { passo_neve: [1, 2, 3, 4, 5, 7, 8], passo_gelo: [1, 2, 3], passo_madeira: [1, 2], rangido: [1, 2] }; const lastTake = {};
  function sfx(name, gain = 1, rate = 1) {
    if (FAM[name]) { const opts = FAM[name].filter(k => k !== lastTake[name]); const k = opts[Math.floor(Math.random() * opts.length)]; lastTake[name] = k; name = `${name}_${k}`; }
    return play(name.includes('/') ? name : `audio/foley/${name}.mp3`, { gain, rate });
  }
  let fire = null; // the woodstove behind the open door: louder as he gets close
  let music = null;
  async function musicIn() { if (music) return; music = await play('som/tema_caseiro.mp3', { loop: true, bed: true }); }
  function musicOut(sec = 2.5) { if (!music) return; const g = music.g.gain; g.setValueAtTime(g.value, AC.currentTime); g.linearRampToValueAtTime(0, AC.currentTime + sec); const m = music; music = null; setTimeout(() => m.src.stop(), sec * 1000 + 100); }

  // ------------------------------------------------------------ voice lines: one file per line, captions from the words.json timing
  const WHO = { c: 'caio', a: 'caio', b: 'caio', v: 'ela', r: 'dono' };
  const LINES = {};
  async function lineData(id) {
    if (LINES[id]) return LINES[id];
    const ep = id[0] === 'a' || id === 'r01' ? 'ep02a' : id[0] === 'b' || id === 'v03' || id === 'v04' ? 'ep02b' : 'ep01';
    const ws = (await (await fetch(`voz/${ep}/${id}.words.json`)).json()).filter(w => !/^\[/.test(w.w) && !/\]$/.test(w.w));
    const groups = []; let cur = [];
    for (const w of ws) { const len = cur.reduce((s, x) => s + x.w.length + 1, 0) + w.w.length; if (cur.length && (len > 21 || w.start - cur[cur.length - 1].end > 0.45)) { groups.push(cur); cur = []; } cur.push(w); if (/[.?!]$/.test(w.w)) { groups.push(cur); cur = []; } }
    if (cur.length) groups.push(cur);
    return (LINES[id] = { url: `voz/${ep}/${id}.mp3`, groups, who: WHO[id[0]] });
  }
  let talking = null; // { id, who, t0, groups, end }
  async function say(id, kind) {
    const L = await lineData(id); const k = kind || (L.who === 'ela' ? 'eco' : L.who === 'dono' ? 'radio' : null);
    const h = await play(L.url, { kind: k }); if (!h) return;
    talking = { id, who: L.who, t0: AC.currentTime, groups: L.groups, end: AC.currentTime + h.dur };
    await new Promise(r => h.src.onended = r); if (talking && talking.id === id) talking = null;
  }
  const lineT = () => (talking && AC ? AC.currentTime - talking.t0 : -1);

  // ------------------------------------------------------------ input: arrows/WASD, 1/2 for choices, Enter/Space to start; touch = drag anywhere, tap a card
  const keys = new Set(); let joy = null, tapQ = null;
  addEventListener('keydown', e => { keys.add(e.key.toLowerCase()); if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) e.preventDefault();
    if (e.key === '1' || e.key === '2') tapQ = { choice: +e.key }; if (e.key === 'Enter' || e.key === ' ') tapQ = { start: true }; });
  addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  const cv = () => document.querySelector('canvas');
  const toOv = e => { const r = cv().getBoundingClientRect(); return [(e.clientX - r.left) / r.width * OW, (e.clientY - r.top) / r.height * OH]; };
  addEventListener('pointerdown', e => { const [x, y] = toOv(e); tapQ = { x, y, start: true }; joy = { x0: e.clientX, y0: e.clientY, x: 0, y: 0, id: e.pointerId }; });
  addEventListener('pointermove', e => { if (!joy || e.pointerId !== joy.id) return; const dx = e.clientX - joy.x0, dy = e.clientY - joy.y0, m = Math.hypot(dx, dy), R = 70;
    joy.x = m > 8 ? dx / Math.max(R, m) : 0; joy.y = m > 8 ? dy / Math.max(R, m) : 0; });
  addEventListener('pointerup', e => { if (joy && e.pointerId === joy.id) joy = null; });
  addEventListener('pointercancel', () => joy = null);
  function stick() {
    let x = (keys.has('arrowright') || keys.has('d') ? 1 : 0) - (keys.has('arrowleft') || keys.has('a') ? 1 : 0);
    let y = (keys.has('arrowdown') || keys.has('s') ? 1 : 0) - (keys.has('arrowup') || keys.has('w') ? 1 : 0);
    if (joy && (joy.x || joy.y)) { x = joy.x; y = joy.y; }
    const m = Math.hypot(x, y); return m > 1 ? [x / m, y / m] : [x, y];
  }

  // ------------------------------------------------------------ game state
  const S = window.GAME = {};
  window.DBG = () => ({ ac: AC && AC.state, talking: talking && talking.id, waiters: waiters.length });
  function reset() {
    Object.assign(S, { phase: 'titulo', control: false, pos: START.clone(), yaw: yawTo(START, AT_DOOR), speed: 0, ph: 0, cam: 'follow', camYaw: yawTo(START, AT_DOOR),
      rules: [false, false, false], known: false, obj: null, objTxt: '', cards: null, ending: null, fade: 0, card: null, trauma: 0, hs: 0, wt: 0, squash: -1, flash: 0,
      lamp: false, lampLit: 0, lampOut: 0, radio: false, picked: 0, cardRects: null, fadeFn: null, ruleT: 0, ruleI: -1, vulto: null, door: false, crack: null, note: null, look: null, scare: 0, faceT: 0, runFast: false, chase: false, abriu: false, olhou: false, dim: false, prints: false, thought: null });
    if (fire) { fire.src.stop(); fire = null; }
    camP.copy(S.pos).add(V(0, 2.4, -4)); camT.copy(S.pos);
  }
  const camP = V(0, 0, 0), camT = V(0, 0, 0); let camCut = true;
  const waiters = [];
  const until = fn => new Promise(r => waiters.push({ fn, r }));
  const wait = s => { const t = S.wt + s; return until(() => S.wt >= t); };
  const choose = (a, b) => { S.cards = [a, b]; S.cardT = S.wt; tapQ = null; return until(() => S.picked).then(() => { const p = S.picked; S.picked = 0; S.cards = null; return p; }); };
  function impact(trauma, { stop = 0, squash = false, flash = 0 } = {}) { S.trauma = Math.min(1, S.trauma + trauma); S.hs = Math.max(S.hs, stop); if (squash) S.squash = 0; if (flash) S.flash = flash; }
  const goal = (p, txt) => { S.obj = p; S.objTxt = txt; };
  const fadeTo = (v, s = 0.6) => { const a = S.fade, t0 = S.wt; S.fadeFn = () => lerp(a, v, clamp((S.wt - t0) / s)); return wait(s); };
  const think = (txt, dur = 2.6) => { S.thought = { txt, t0: S.wt, dur }; return wait(dur); }; // what he sees or hears, written (no new voice lines)
  async function fireOn() { if (!fire) fire = await play('audio/foley/lareira.mp3', { loop: true, gain: 0 }); }
  function breakRule(i) { if (!S.known || S.rules[i]) return; S.rules[i] = true; S.ruleT = S.wt; S.ruleI = i; }

  // ------------------------------------------------------------ the night (one async script; the player walks between the beats)
  let ambOn = false;
  async function night() {
    S.phase = 'jogo'; S.control = true; if (!ambOn) { ambOn = true; play('audio/foley/amb_noite.mp3', { loop: true, bed: true }); play('audio/foley/amb_vento.mp3', { loop: true, bed: true }); }
    goal(AT_DOOR, 'SUBA ATÉ A CABANA'); S.fade = 1; fadeTo(0, 1.2);
    say('c01');
    await until(() => S.pos.distanceTo(AT_DOOR) < 9); await until(() => !talking); say('c02');
    await until(() => S.pos.distanceTo(AT_DOOR) < 1.4); await until(() => !talking);
    // the note on the door
    S.control = false; S.obj = null; S.cam = 'nota'; camCut = true; S.yaw = Math.PI; await wait(0.5);
    S.note = { rows: [['1. NUNCA SAIA DA'], ['   TRILHA.'], ['2. SE OUVIR SEU NOME,'], ['   NÃO RESPONDA.'], ['3. NÃO PISE NO LAGO.']], t0: S.wt, by: 'c03' };
    await say('c03'); S.known = true; await wait(0.4); S.note = null;
    S.cam = 'rosto'; camCut = true; await say('c04'); await wait(0.5);
    // midnight
    await fadeTo(1, 0.8); S.card = { txt: 'MEIA-NOITE', t0: S.wt }; S.pos.copy(AT_DOOR).add(V(-0.6, 0, -1.2)); S.yaw = S.camYaw = yawTo(AT_DOOR, RONDA); S.cam = 'follow'; camCut = true;
    await wait(1.6); S.card = null; fadeTo(0, 0.8); await wait(0.9);
    // N1: someone knocks on the door, from INSIDE the empty cabin
    sfx('batida'); await wait(0.4); S.cam = 'porta'; camCut = true;
    await think('TRÊS BATIDAS. DE DENTRO DA CABANA VAZIA.', 2.4); sfx('batida', 0.8);
    const n1 = await choose('ABRO A PORTA', 'VOU FAZER A RONDA');
    if (n1 === 1) {
      S.abriu = true; sfx('porta_abre'); S.door = true; fireOn(); await wait(0.8);
      await think('NINGUÉM. SÓ A LAREIRA ACESA.', 2.2);
      S.prints = true; S.cam = 'pegadas'; camCut = true;
      await think('PEGADAS DESCALÇAS. SAEM DA PORTA... E DESCEM ATÉ O LAGO.', 3.2);
      sfx('porta_abre', 0.7, 1.15); S.door = false; S.cam = 'follow'; camCut = true;
    } else { S.cam = 'follow'; camCut = true; await think('AS BATIDAS PARAM.', 1.8); }
    S.control = true; goal(RONDA, 'FAÇA A RONDA PELA TRILHA');
    await until(() => S.pos.distanceTo(RONDA) < 3.2 || S.pos.distanceTo(AT_DOOR) > 16); // the lake shot is framed from here (EP01)
    // "Caio..." (a voice, not a physical hit: hit-stop and shake, no squash)
    S.control = false; S.scare = S.wt; musicIn(); impact(0.55, { stop: 3 / 30 }); S.look = 'tras';
    await say('v01'); S.cam = 'rosto'; camCut = true; await say('c05'); await wait(0.3);
    S.lamp = true; S.lampLit = 1; S.vulto = 'ajoelhado'; S.cam = 'lago'; camCut = true; S.look = null; await wait(0.6);
    await say('v02'); S.cam = 'rosto'; camCut = true; await say('c06'); await wait(0.2);
    const c1 = await choose('VOU ATÉ O LAGO', 'SIGO AS REGRAS');
    S.cam = 'follow'; camCut = true;
    if (c1 === 1) await rotaLago(); else await rotaRegras();
  }
  async function rotaLago() {
    S.control = true; S.yaw = S.camYaw = yawTo(S.pos, LAMP2); say('a01'); goal(LAMP2, 'VÁ ATÉ A LUZ NO GELO');
    await until(() => onPond(S.pos.x, S.pos.z));
    impact(0.8, { stop: 3 / 30, squash: true, flash: 0.3 }); sfx('estalo'); S.crack = { x: S.pos.x, z: S.pos.z, t0: S.wt, r: 1.6 }; // the ice gives under his foot
    await until(() => !talking); say('a02');
    await until(() => S.pos.distanceTo(LAMP2) < 1.9); await until(() => !talking);
    S.control = false; S.obj = null; S.vulto = null; S.yaw = yawTo(S.pos, LAMP2); S.cam = 'rosto'; camCut = true;
    await say('a03'); await wait(0.3);
    sfx('radio_clique'); sfx('radio_chiado', 0.8); await wait(0.3); S.radio = true; await say('r01'); S.radio = false; sfx('radio_clique', 0.8); await wait(0.2);
    await say('a04'); await wait(0.2);
    impact(0.8, { stop: 3 / 30, squash: true, flash: 0.25 }); sfx('estalo_grande'); S.crack = { x: LAMP2.x, z: LAMP2.z, t0: S.wt, r: 3.6 };
    await wait(0.35); S.lampOut = S.wt; // her lantern just goes out: no sound, the silence is the scare
    await say('a05'); await say('a06'); await wait(0.2);
    const c2 = await choose('RESPONDO O RÁDIO', 'CORRO PRA MARGEM CALADO');
    if (c2 === 1) { breakRule(1); sfx('radio_clique'); sfx('radio_chiado'); await think('VOCÊ APERTA O BOTÃO E RESPONDE.', 2.0); sfx('radio_clique', 0.8); await wait(0.6); return fim('A1'); }
    S.cam = 'follow'; camCut = true; S.control = true; S.runFast = true; S.chase = true; goal(null, 'CORRA PRA MARGEM. CALADO.');
    let next = S.wt + 1.1;
    await until(() => { if (S.wt > next) { next = S.wt + 1.0 + Math.random() * 0.4; sfx('rangido', 1, 0.9 + Math.random() * 0.2); impact(0.25); S.crack = { x: S.pos.x, z: S.pos.z, t0: S.wt - 0.3, r: 2.4 }; }
      return !onPond(S.pos.x, S.pos.z) && Math.hypot(S.pos.x - LAMP2.x, S.pos.z - LAMP2.z) > 4; });
    S.chase = false; S.control = false; S.obj = null; await wait(0.5);
    S.cam = 'rosto'; camCut = true; S.radio = true; sfx('radio_chiado'); await wait(0.4);
    await think('NA MARGEM. O RÁDIO NO CINTO COMEÇA A CHIAR SOZINHO.', 2.6); sfx('radio_chiado', 0.9);
    const n3 = await choose('DESLIGO O RÁDIO', 'DEIXO LIGADO');
    if (n3 === 1) { sfx('radio_clique'); S.radio = false; await wait(0.6); S.cam = 'lago'; camCut = true; await wait(0.8);
      S.lampOut = 0; S.vulto = 'em_pe'; await think('NO MEIO DO GELO, A LANTERNA DELA ACENDE DE NOVO.', 2.8); return fim('A3'); }
    sfx('radio_chiado'); await wait(1.2); return fim('A2');
  }
  async function rotaRegras() {
    S.control = true; S.yaw = S.camYaw = yawTo(S.pos, AT_DOOR); say('b01'); goal(AT_DOOR, 'VOLTE PELA TRILHA ATÉ A CABANA');
    await until(() => S.pos.distanceTo(AT_DOOR) < 13.5); S.vulto = 'seguindo'; const v3 = say('v03');
    await Promise.race([v3, until(() => S.pos.distanceTo(AT_DOOR) < 8.5)]); S.control = false; await v3; // halfway up the trail, never at the door
    // N2: the voice is right behind him
    S.control = false; S.cam = 'rosto'; camCut = true; await think('OS PASSOS ATRÁS DE VOCÊ PARARAM JUNTO COM OS SEUS.', 2.4);
    const n2 = await choose('OLHO PRA TRÁS', 'SIGO SEM OLHAR');
    if (n2 === 1) { S.olhou = true; const back = S.yaw; S.yaw += Math.PI; S.vulto = 'perto'; S.cam = 'tras'; camCut = true; impact(0.5, { stop: 3 / 30 }); await wait(1.4);
      S.vulto = null; S.dim = true; S.yaw = back; S.cam = 'follow'; camCut = true; await think('NINGUÉM. MAS A SUA LANTERNA ENFRAQUECEU.', 2.4); }
    else { S.cam = 'follow'; camCut = true; say('b02'); }
    S.control = true;
    await until(() => S.pos.distanceTo(AT_DOOR) < 7 && !talking); S.vulto = null; S.door = true; fireOn();
    await until(() => S.pos.distanceTo(AT_DOOR) < 1.6); await until(() => !talking);
    S.control = false; S.obj = null; S.yaw = Math.PI; S.cam = 'porta'; camCut = true;
    await say('b03'); await wait(0.2);
    S.cam = 'nota'; camCut = true;
    S.note = { rows: [['1. NUNCA SAIA DA'], ['   TRILHA.'], ['2. SE OUVIR SEU NOME,'], ['   NÃO RESPONDA.'], ['3. NÃO PISE NO LAGO.'], ['4. SE A PORTA ESTIVER', '#a3160c'], ['   ABERTA, NÃO ENTRE.', '#a3160c']], t0: S.wt, typed4: true };
    await say('b04'); await wait(0.4); S.note = null;
    S.cam = 'porta'; camCut = true; await say('v04', 'dentro'); await wait(0.2);
    S.cam = 'rosto'; camCut = true; await say('b05'); await wait(0.2);
    const c2 = await choose('ENTRO NA CABANA', 'PASSO A NOITE AQUI FORA');
    if (c2 === 1) { sfx('porta_abre'); await fadeTo(1, 1.2); return fim(S.olhou ? 'B3' : 'B1'); }
    await fadeTo(1, 1.6); return fim(S.olhou ? 'B4' : 'B2');
  }
  const FINS = {
    A1: ['O OUTRO CASEIRO', 'VOCÊ RESPONDEU. O RÁDIO FICA MUDO. DEPOIS, BEM BAIXO, A VOZ DO PATRÃO - O ÚLTIMO CASEIRO TAMBÉM RESPONDEU A VOZ.'],
    A3: ['A LUZ VOLTOU', 'VOCÊ DESLIGOU O RÁDIO. NO MEIO DO LAGO, A LANTERNA DELA ACENDEU DE NOVO. E AGORA TEM ALGUÉM DE PÉ DO LADO DELA.'],
    A2: ['DUAS VOZES', 'VOCÊ CHEGOU NA MARGEM SEM DIZER NADA. O RÁDIO CHIA... E AGORA É A VOZ DELA QUE SAI DELE.'],
    B1: ['DUAS CANECAS', 'LAREIRA ACESA E DUAS CANECAS QUENTES. NO ESPELHO, ESCRITO POR DENTRO - VOCÊ DUROU MAIS QUE O OUTRO.'],
    B3: ['A PORTA FECHOU', 'COM A LANTERNA FRACA, VOCÊ ENTROU. A LAREIRA APAGOU SOZINHA. NO ESCURO, ALGUÉM TRANCOU A PORTA POR FORA.'],
    B4: ['TRÊS DA MANHÃ', 'SUA LANTERNA APAGOU ÀS TRÊS DA MANHÃ. QUANDO O DIA NASCEU, TINHA PEGADAS NA NEVE... TODAS PARANDO NA SUA FRENTE.'],
    B2: ['O PRIMEIRO VIVO', 'AMANHECE. PEGADAS FIZERAM UM CÍRCULO PERFEITO EM VOLTA DA VARANDA. O PATRÃO CHEGA - VOCÊ É O PRIMEIRO QUE EU ENCONTRO VIVO.'],
  };
  async function fim(id) {
    S.control = false; S.cards = null; musicOut(3); if (S.fade < 1) await fadeTo(1, 1.0);
    S.ending = { id, t0: S.wt, n: Object.keys(FINS).sort().indexOf(id) + 1 }; S.phase = 'fim';
    try { const s = JSON.parse(localStorage.getItem('caseiro_finais') || '[]'); if (!s.includes(id)) s.push(id); localStorage.setItem('caseiro_finais', JSON.stringify(s)); } catch (e) {}
  }
  const seen = () => { try { return JSON.parse(localStorage.getItem('caseiro_finais') || '[]'); } catch (e) { return []; } };

  // ------------------------------------------------------------ per frame
  let lastT = null; reset(); buildPrints();
  function sim(dt) {
    // walking
    let [sx, sy] = S.control ? stick() : [0, 0];
    const fwd = fwdOf(S.camYaw), rgt = rightOf(S.camYaw);
    let dir = fwd.clone().multiplyScalar(-sy).add(rgt.clone().multiplyScalar(sx));
    if (S.autoGo && S.control) { const d = S.autoGo.clone().sub(S.pos); d.y = 0; dir = d.length() > 0.4 ? d.normalize() : V(0, 0, 0); sy = -1; } // test pilot (window.GAME.autoGo)
    const m = Math.min(1, dir.length());
    const vmax = S.runFast ? 3.6 : 2.5; S.speed = lerp(S.speed, m * vmax, 1 - Math.exp(-dt * 10));
    if (m > 0.05) { const ty = Math.atan2(dir.x, dir.z); let d = ty - S.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); S.yaw += d * (1 - Math.exp(-dt * 12)); }
    if (S.speed > 0.05) {
      const step = fwdOf(S.yaw).multiplyScalar(S.speed * dt), nx = S.pos.x + step.x, nz = S.pos.z + step.z;
      const y = S.pos.y; if (walkable(nx, nz, y)) { S.pos.x = nx; S.pos.z = nz; } else if (walkable(nx, S.pos.z, y)) S.pos.x = nx; else if (walkable(S.pos.x, nz, y)) S.pos.z = nz;
      const ph0 = S.ph; S.ph += dt * 2 * Math.PI * 1.25 * (S.speed / 2.2);
      if (Math.floor(S.ph / Math.PI) !== Math.floor(ph0 / Math.PI)) sfx(onPond(S.pos.x, S.pos.z) ? 'passo_gelo' : onPorch(S.pos.x, S.pos.z) ? 'passo_madeira' : 'passo_neve', 1, 0.94 + Math.random() * 0.12);
      // the camera swings behind him only while he walks forward-ish (never fights the stick)
      if (sy < 0.2) { let d = S.yaw - S.camYaw; d = Math.atan2(Math.sin(d), Math.cos(d)); S.camYaw += d * (1 - Math.exp(-dt * 1.6)) * Math.min(1, S.speed / 2); }
    }
    S.pos.y = lerp(S.pos.y, top(S.pos.x, S.pos.z, S.pos.y + 1.2), 1 - Math.exp(-dt * 14));
    // the rules, checked by where he actually is
    if (S.known && S.phase === 'jogo') { if (!onTrail(S.pos.x, S.pos.z)) breakRule(0); if (onPond(S.pos.x, S.pos.z)) breakRule(2); }
  }

  function apply(tReal) {
    const dtR = lastT === null ? 0 : Math.min(0.05, Math.max(0, tReal - lastT)); lastT = tReal;
    // input taps
    if (tapQ) { const q = tapQ; tapQ = null;
      if (S.phase === 'titulo' && q.start) { audioInit(); night(); }
      else if (S.phase === 'fim' && S.wt - S.ending.t0 > 1.2 && q.start) { waiters.length = 0; reset(); audioInit(); night(); }
      else if (S.cards && S.wt - S.cardT > 0.4) { if (q.choice) S.picked = q.choice; else if (q.y && S.cardRects) S.cardRects.forEach((r, i) => { if (q.x > r[0] && q.x < r[0] + r[2] && q.y > r[1] && q.y < r[1] + r[3]) S.picked = i + 1; }); } }
    // hit-stop: the world and he hold; the sound and the shake keep real time
    const stopped = S.hs > 0; if (stopped) S.hs -= dtR;
    const dt = stopped ? 0 : dtR; S.wt += dt;
    if (S.phase === 'jogo' && !stopped) sim(dt);
    for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].fn()) { const w = waiters.splice(i, 1)[0]; w.r(); }
    if (S.fadeFn) S.fade = S.fadeFn();
    S.trauma = Math.max(0, S.trauma - 1.6 * dtR);
    U.uTime.value = S.wt + 20;

    resetFrame(S.wt + 20, false);
    const t = S.wt + 20, gp = S.pos;
    guy.position.copy(gp); guy.rotation.set(0, S.yaw, 0);
    const walking = S.speed > 0.15;
    const pz = walkPose(S.ph, walking, Math.min(1, S.speed / 2.2));
    const L = talking && talking.who === 'caio';
    let mouth = L && lineT() > 0 ? (Math.sin(t * 2 * Math.PI * 6.5) > -0.2 ? 1 : 0) : 0, wide = S.scare ? 1 : 0, brow = S.scare ? 1 : 0, look = [0, 0];
    if (S.look === 'tras') pz.head = mixA([0, 0, 0], [-0.05, 0.75, 0], sstep(S.scare, S.scare + 0.35, S.wt));
    if (S.cards) look = [Math.floor((S.wt - S.cardT) / 0.35) % 2 ? -1 : 1, 0];
    // squash only on a physical impact (the ice giving way), back to rest with a little overshoot
    guy.scale.setScalar(0.88);
    if (S.squash >= 0) { S.squash += dt; const k = clamp(S.squash / 0.2), c = 1.70158, a = 1 - (1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2); guy.scale.set(0.88 * (1 + 0.1 * a), 0.88 * (1 - 0.12 * a), 0.88 * (1 + 0.1 * a)); if (k >= 1) S.squash = -1; }
    pz.chest = [pz.chest[0] + 0.03 * Math.sin(t * 1.7), pz.chest[1], pz.chest[2]];
    pose(pz); face.look.set(look[0], look[1]); face.set(wide, mouth, brow, (t % 4.1) < 0.12 ? 1 : 0);
    holdLantern(t);
    lantern.children[2].material.uniforms.uGlow.value = S.dim ? 0.45 : 1.4; if (S.dim) U.uPortal.value = 0.03; // after he looked back, his lantern is weak
    prints.visible = S.prints;

    // her lantern on the ice, the figure, the open door, the cracks
    if (S.lamp) { lantern2.visible = true; lantern2.position.copy(LAMP2).add(V(0, 0.14, 0));
      const lit = S.lampOut ? 1 - sstep(S.lampOut, S.lampOut + 0.25, S.wt) : 1; lantern2.userData.glass.uniforms.uGlow.value = 1.4 * lit;
      if (lit > 0.01) U.uFire.value.set(LAMP2.x, LAMP2.y + 0.35, LAMP2.z, 0.09 * lit * (0.92 + 0.08 * Math.sin(t * 23) * Math.sin(t * 7.1))); S.lampLit = lit; }
    if (S.vulto === 'ajoelhado') { vulto.visible = true; vultoKneel.visible = true; vultoStand.visible = false; vulto.position.copy(VUL); vulto.rotation.y = yawTo(VUL, gp); }
    if (S.vulto === 'seguindo') { // among the trees beside him, seen only when his lantern swings that way
      const side = rightOf(S.yaw).multiplyScalar(-6.5), p = gp.clone().add(side).add(fwdOf(S.yaw).multiplyScalar(-1)); p.y = gh(p.x, p.z);
      if (Math.sin(t * 2.3) > 0.35) { vulto.visible = true; vultoStand.visible = true; vultoKneel.visible = false; vulto.position.copy(p); vulto.rotation.y = yawTo(p, gp); } }
    if (S.vulto === 'perto' || S.vulto === 'em_pe') { const p = S.vulto === 'perto' ? gp.clone().add(fwdOf(S.yaw).multiplyScalar(3.0)) : LAMP2.clone().add(LAMP2.clone().sub(gp).setY(0).normalize().multiplyScalar(1.1)); // standing just past her lantern p.y = top(p.x, p.z, p.y + 3);
      vulto.visible = true; vultoStand.visible = true; vultoKneel.visible = false; vulto.position.copy(p); vulto.rotation.y = yawTo(p, gp); }
    if (S.door) { doorGlow.visible = true; mDoor.uniforms.uGlow.value = 0.55 * (0.94 + 0.06 * Math.sin(t * 9) * Math.sin(t * 3.7)); note.position.set(96.55, 12.45, 51.985); }
    else note.position.set(97.5, 12.45, 51.985);
    if (S.crack) U.uCrack.value.set(S.crack.x, S.crack.z, S.crack.r * expoOut((S.wt - S.crack.t0) / 0.35), 1.0);
    mRadLed.uniforms.uGlow.value = S.radio ? 0.6 + 0.6 * Math.abs(Math.sin(t * 19)) : 0.05;

    // camera
    let tp, tt, fov = 50, focus, ap = 0.5;
    if (S.phase === 'titulo') { const u = 0.5 - 0.5 * Math.cos(t * 0.08); tp = lerpV(V(84.3, 17.0, 33.0), V(84.9, 16.6, 34.0), u); tt = V(95.2, 12.4, 49.2); fov = 38; ap = 0.35; }
    else if (S.cam === 'nota') { tp = V(99.7, 12.75, 48.4); tt = V(97.3, 12.25, 51.5); fov = 44; ap = 1.2; }
    else if (S.cam === 'porta') { tp = V(99.4, 12.75, 48.6); tt = V(97.3, 12.15, 51.6); fov = 44; }
    else if (S.cam === 'rosto') { [tp, tt] = faceCam(gp, S.yaw, lerp(2.75, 2.45, sine((S.wt - (S.faceT || 0)) / 4))); tt.y -= 0.12; fov = S.cards ? 42 * (1 - 0.035 * sine((S.wt - S.cardT) / 3)) : 42; ap = 1.0; }
    else if (S.cam === 'pegadas') { tp = V(99.8, 17.2, 47.2); tt = V(90.2, 10.6, 46.6); fov = 48; ap = 0.3; }
    else if (S.cam === 'tras') { const f = fwdOf(S.yaw), sd = sideOf(S.yaw); tp = gp.clone().add(f.clone().multiplyScalar(-1.6)).add(sd.clone().multiplyScalar(0.45)).add(V(0, 1.75, 0)); tt = gp.clone().add(f.clone().multiplyScalar(3.0)).add(V(0, 1.15, 0)); fov = 42; ap = 0.8; } // over his shoulder: the figure right there
    else if (S.cam === 'lago') { const yl = yawTo(gp, LAMP2), fl = fwdOf(yl), sl = sideOf(yl); tp = gp.clone().add(fl.clone().multiplyScalar(-0.9)).add(sl.clone().multiplyScalar(0.5)).add(V(0, 2.5, 0)); tt = LAMP2.clone().add(V(0, 0.45, 0)); fov = 33; ap = 0.9; fin.m.uniforms.uExp.value = 3.7; }
    else { const f = fwdOf(S.camYaw); tp = gp.clone().add(f.clone().multiplyScalar(-4.3)).add(V(0, 2.5, 0)); tt = gp.clone().add(f.clone().multiplyScalar(2.6)).add(V(0, 0.9, 0)); }
    if (['follow', 'rosto', 'tras'].includes(S.cam) && S.phase !== 'titulo') tp = clearCam(tt, tp);
    if (camCut) { camP.copy(tp); camT.copy(tt); camCut = false; S.faceT = S.wt; }
    else { const k = 1 - Math.exp(-dtR * (S.cam === 'follow' ? 7 : 3)); camP.lerp(tp, k); camT.lerp(tt, k); }
    focus = camP.distanceTo(S.cam === 'lago' ? LAMP2 : S.cam === 'tras' ? vulto.position : S.cam === 'pegadas' ? V(92, 10.8, 48) : gp);
    // sound: ambience and theme sit under every voice line; the woodstove grows as he nears the open door
    if (AC) { bedBus.gain.setTargetAtTime(talking ? 0.5 : 1, AC.currentTime, 0.15);
      if (fire) fire.g.gain.setTargetAtTime(S.door ? GAINS['audio/foley/lareira.mp3'] * clamp(1.15 - gp.distanceTo(AT_DOOR) / 9) : 0, AC.currentTime, 0.3); }
    setCamera(camP, camT, fov);
    // trauma shake: trauma^2, smooth sines, the camera only (game-feel)
    const sh = S.trauma * S.trauma; if (sh > 0.001) { const k = tReal * 30, r = V(1, 0, 0).applyQuaternion(camera.quaternion), up = V(0, 1, 0).applyQuaternion(camera.quaternion);
      camera.position.addScaledVector(r, 0.14 * sh * Math.sin(k * 1.7)).addScaledVector(up, 0.09 * sh * Math.sin(k * 2.3 + 1)); camera.rotateZ(0.04 * sh * Math.sin(k * 1.1 + 2)); camera.updateMatrixWorld(true); }
    guy.updateMatrixWorld(true);
    dof.m.uniforms.uFocus.value = focus; dof.m.uniforms.uAperture.value = ap;
    if (S.flash > 0) { fin.m.uniforms.uWhite.value = S.flash; if (!stopped) S.flash = 0; }
    if (S.cards) { fin.m.uniforms.uSat.value = 0.75; fin.m.uniforms.uExp.value = 4.4; }
    if (S.lamp && S.lampLit > 0.01 && S.cam !== 'rosto') halo(LAMP2.clone().add(V(0, 0.15, 0)), S.cam === 'lago' ? 120 : 70, S.lampLit);

    hud();
    ovTex.needsUpdate = true;
  }

  // ------------------------------------------------------------ HUD (pixel font, same look as the series)
  function wrap(txt, s, maxW) { const out = []; let cur = ''; for (const w of txt.split(' ')) { const n = cur ? cur + ' ' + w : w; if (textWidth(n, s) > maxW && cur) { out.push(cur); cur = w; } else cur = n; } if (cur) out.push(cur); return out; }
  const center = (txt, s, y, col) => drawText(oc, txt, Math.round((OW - textWidth(txt, s)) / 2), y, s, col);
  // the rules appear on the note as he reads each one (the words' own timing in c03)
  function ruleShown() { if (!talking || talking.id !== 'c03') return S.known ? 5 : 0; const lt = lineT(), ws = talking.groups.flat(), at = k => (ws.find(w => norm(w.w) === k) || { start: 99 }).start;
    const r = [at('nunca'), at('se'), at('pise')]; return [0, 0, 1, 1, 2].reduce((n, ri, i) => n + clamp((lt - r[ri] + 0.05 + (i % 2) * -0.25) / 0.2), 0); }
  function hud() {
    const t = S.wt;
    if (S.phase === 'titulo') {
      oc.fillStyle = 'rgba(6,6,12,0.55)'; oc.fillRect(0, 300, OW, 560);
      center('O CASEIRO', 8, 380, '#ffb36b'); center('A PRIMEIRA', 15, 480, '#fff1d8'); center('NOITE', 15, 600, '#fff1d8');
      center('15 MIL REAIS. 3 REGRAS. 1 NOITE.', 5, 760, '#ffc65a');
      if (Math.sin(performance.now() / 300) > -0.3) center('TOQUE OU APERTE ENTER', 6, 1500, '#fff1d8');
      center('ANDAR - SETAS OU ARRASTAR O DEDO', 4, 1620, '#9fb3d9'); center('ESCOLHER - 1 OU 2, OU TOQUE NO CARTÃO', 4, 1670, '#9fb3d9');
      const f = seen(); if (f.length) center('FINAIS ENCONTRADOS ' + f.length + ' DE ' + Object.keys(FINS).length, 5, 1780, '#ffb36b');
      return;
    }
    if (S.phase === 'fim') {
      oc.fillStyle = '#07070c'; oc.fillRect(0, 0, OW, OH);
      const e = S.ending, [ttl, body] = FINS[e.id], a = sstep(e.t0 + 0.2, e.t0 + 0.8, t); oc.globalAlpha = a;
      center('FINAL ' + e.n + ' DE ' + Object.keys(FINS).length, 6, 420, '#ffb36b');
      wrap(ttl, 12, 960).forEach((l, i) => center(l, 12, 520 + i * 120, '#fff1d8'));
      wrap(body, 6, 900).forEach((l, i) => center(l, 6, 820 + i * 74, '#d8e2f4'));
      const nq = S.rules.filter(Boolean).length; center('REGRAS QUEBRADAS ' + nq + ' DE 3', 6, 1330, nq ? '#ff6b5b' : '#b9f0a6');
      const f = seen(); center('FINAIS ENCONTRADOS ' + f.length + ' DE ' + Object.keys(FINS).length, 5, 1430, '#ffb36b');
      if (t - e.t0 > 1.2 && Math.sin(performance.now() / 300) > -0.3) center('TOQUE OU ENTER PARA JOGAR DE NOVO', 6, 1600, '#fff1d8');
      oc.globalAlpha = 1; return;
    }
    // the rules, top left, once he has read them; a broken one turns red and gets struck through
    if (S.known && !S.note && (S.control || S.wt - S.ruleT < 1.5)) {
      const s = 4, x0 = 60, y0 = 120; oc.fillStyle = 'rgba(8,8,14,0.5)'; oc.fillRect(x0 - 20, y0 - 20, 470, 4 * 7 * s + 3 * 26 + 50);
      drawText(oc, 'REGRAS', x0, y0, s, '#ffb36b');
      ['NÃO SAIA DA TRILHA', 'NÃO RESPONDA', 'NÃO PISE NO LAGO'].forEach((r, i) => { const y = y0 + (i + 1) * (7 * s + 22), br = S.rules[i];
        const pulse = br && S.ruleI === i && t - S.ruleT < 1.2 ? (Math.sin((t - S.ruleT) * 20) > 0 ? 1 : 0.4) : 1;
        oc.globalAlpha = pulse; drawText(oc, (i + 1) + '. ' + r, x0, y, s, br ? '#ff6b5b' : '#fff1d8'); if (br) { oc.fillStyle = '#ff6b5b'; oc.fillRect(x0 - 6, y + 12, textWidth((i + 1) + '. ' + r, s) + 12, 5); } oc.globalAlpha = 1; });
    }
    // where to go: a small marker over the goal (or an arrow at the edge) + one short line
    if (S.control && S.objTxt) {
      if (S.obj) { const v = S.obj.clone().add(V(0, 1.6, 0)).project(camera); let x = (v.x * 0.5 + 0.5) * OW, y = (-v.y * 0.5 + 0.5) * OH; const behind = v.z > 1;
        if (behind) { x = OW - x; y = OH - 200; } const on = !behind && x > 40 && x < OW - 40 && y > 260 && y < OH - 300;
        x = clamp(x, 60, OW - 60); y = clamp(y, 300, OH - 320); const b = 0.5 + 0.5 * Math.sin(t * 4);
        oc.fillStyle = `rgba(255,198,90,${0.55 + 0.45 * b})`; oc.save(); oc.translate(x, y); oc.rotate(Math.PI / 4); const r = on ? 14 : 20; oc.fillRect(-r, -r, 2 * r, 2 * r); oc.restore(); }
      const s = 5, w = textWidth(S.objTxt, s); oc.fillStyle = 'rgba(8,8,14,0.55)'; oc.fillRect(Math.round((OW - w) / 2) - 24, 1700, w + 48, 7 * s + 30); center(S.objTxt, s, 1715, S.chase ? '#ff6b5b' : '#ffc65a');
    }
    // the note, read on screen (the 4th rule is typed while he reads it)
    if (S.note) { oc.fillStyle = 'rgba(4,4,8,0.45)'; oc.fillRect(0, 0, OW, OH);
      const n = S.note, u = t - n.t0; let rows = n.rows, shown = n.typed4 ? 5 : ruleShown();
      if (n.typed4) { const k = clamp((u - 0.4) / 1.6), a = rows[5][0], b = rows[6][0], m = Math.round(k * (a.length + b.length)); rows = rows.slice(0, 5).concat([[a.slice(0, Math.min(m, a.length)), rows[5][1]], [b.slice(0, Math.max(0, m - a.length)), rows[6][1]]]); shown = 7; }
      bilhete(rows, shown, sstep(n.t0, n.t0 + 0.2, t), 480); }
    // captions: his words karaoke (warm), the other voices cold blue; the radio gets its tag
    if (talking && lineT() >= 0 && !S.note) { const lt = lineT(); let gi = -1; talking.groups.forEach((g, i) => { if (lt >= g[0].start - 0.05) gi = i; });
      if (gi >= 0) { const g = talking.groups[gi]; if (lt <= g[g.length - 1].end + 0.6) { const cold = talking.who !== 'caio';
        let act = -1; g.forEach((w, k) => { if (lt >= w.start - 0.03 && lt <= w.end + 0.05) act = k; });
        caption(g.map(w => clean(w.w)), cold ? -1 : act, S.cards ? 760 : 1500, cold ? null : g.map(w => lt >= w.start - 0.03), cold);
        if (talking.who === 'dono') { const s = 6, w = textWidth('RÁDIO', s), y = S.cards ? 660 : 1400; oc.fillStyle = 'rgba(12,10,26,0.7)'; oc.fillRect(Math.round((OW - w) / 2) - 18, y, w + 36, 7 * s + 24); drawText(oc, 'RÁDIO', Math.round((OW - w) / 2), y + 12, s, '#b9f0a6'); } } } }
    // the choice: two cards (1 red, 2 amber), tap or press 1/2
    if (S.cards) { const rows = S.cards.map((c, i) => [String(i + 1), c]), wd = k => rows.reduce((m, [n, w]) => Math.max(m, textWidth(n + '  ' + w, k)), 0), s = [9, 8, 7, 6].find(k => wd(k) + 96 <= OW - 60) || 6, wide = wd(s), bw = Math.min(OW - 40, wide + 96), bh = 7 * s + 58, x0 = Math.round((OW - bw) / 2);
      S.cardRects = [];
      rows.forEach(([n, w], i) => { const k = sstep(S.cardT + 0.09 * i, S.cardT + 0.09 * i + 0.13, t); const yy = 1010 + i * (bh + 16); S.cardRects.push([x0, yy, bw, bh]); if (k <= 0) return;
        const sc = 0.88 + 0.12 * k; oc.save(); oc.globalAlpha = k; oc.translate(x0 + bw / 2, yy + bh / 2); oc.scale(sc, sc); oc.translate(-bw / 2, -bh / 2);
        oc.fillStyle = 'rgba(12,10,26,0.86)'; oc.fillRect(0, 0, bw, bh); oc.fillStyle = OPT_COL[i]; oc.fillRect(0, 0, bw, 6); oc.fillRect(0, bh - 6, bw, 6); oc.fillRect(0, 0, 6, bh); oc.fillRect(bw - 6, 0, 6, bh);
        drawText(oc, n, 42, 29, s, OPT_COL[i]); drawText(oc, w, 42 + textWidth(n + '  ', s), 29, s, '#fff1d8'); oc.restore(); });
      if (t - S.cardT > 1.5) center('O QUE O CAIO FAZ?', 6, 1290, '#fff1d8'); }
    // what he sees or hears, written in his warm colour (the events without a recorded line)
    if (S.thought && t - S.thought.t0 < S.thought.dur + 0.3 && !S.note) { const th = S.thought, a = sstep(th.t0, th.t0 + 0.25, t) * (1 - sstep(th.t0 + th.dur, th.t0 + th.dur + 0.3, t)), s = 6, ls = wrap(th.txt, s, 880), y0 = S.cards ? 700 : 1440;
      oc.globalAlpha = a; oc.fillStyle = 'rgba(12,10,26,0.62)'; oc.fillRect(70, y0 - 30, OW - 140, ls.length * (7 * s + 22) + 40);
      ls.forEach((l, i) => center(l, s, y0 + i * (7 * s + 22), '#ffe2c0')); oc.globalAlpha = 1; }
    // MEIA-NOITE card and the fade
    if (S.fade > 0) { oc.fillStyle = `rgba(4,4,8,${S.fade})`; oc.fillRect(0, 0, OW, OH); }
    if (S.card) { const s = 9; oc.globalAlpha = sstep(S.card.t0, S.card.t0 + 0.3, t); center(S.card.txt, s, 900, '#cfe4ff'); oc.globalAlpha = 1; }
  }

  return { apply, fxScene, duration: 1e9, SH: [] };
}
