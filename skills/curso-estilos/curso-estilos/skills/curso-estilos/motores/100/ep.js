// EP01 v2 — mesmo roteiro e tempos (CUES), visual da prova aprovada. 4 mundos em camadas + celular + 2 telas gráficas.
window.__montarEp = () => {
const tl = gsap.timeline({ paused: true });
const stage = document.getElementById('stage');
const T = i => CUES[i].s, E = i => CUES[i].e, D = i => CUES[i].e - CUES[i].s, P = (i, f) => T(i) + D(i) * f;
const first = {}; LINES.forEach((l, i) => { if (first[l.sc] === undefined) first[l.sc] = i; });
const ordem = Object.keys(first);
const ini = sc => sc === ordem[0] ? 0 : T(first[sc]) - 0.12;
const fim = sc => { const k = ordem.indexOf(sc); return k === ordem.length - 1 ? DUR : ini(ordem[k + 1]); };

/* ---------- infraestrutura: mundos, câmera com paralaxe, visibilidade ---------- */
function mundo(id, camadas) { // camadas: [[html, k], ...]
  const w = document.createElement('div'); w.className = 'mundo'; w.id = id;
  camadas.forEach(([h, k]) => { const c = document.createElement('div'); c.className = 'cam'; c.dataset.k = k; c.innerHTML = h; w.appendChild(c); });
  stage.appendChild(w); return w;
}
const tf = (p, k) => { const s = 1 + ((p.z || 1) - 1) * k; return { scale: s, x: 540 - p.x * s, y: (p.cy || 960) - p.y * s, transformOrigin: '0 0' }; };
const cams = id => gsap.utils.toArray(`#${id} > .cam`);
const camSet = (id, t, p) => cams(id).forEach(c => tl.set(c, tf(p, +c.dataset.k), t));
const camTo = (id, t, dur, p, ease = 'sine.inOut') => cams(id).forEach(c => tl.to(c, { ...tf(p, +c.dataset.k), duration: dur, ease }, t));
const P0 = { x: 540, y: 960, z: 1 };
function vis(sel, cenas) { // junta intervalos colados
  const iv = cenas.map(c => [ini(c), fim(c)]).sort((a, b) => a[0] - b[0]); const out = [];
  iv.forEach(v => { const u = out[out.length - 1]; if (u && Math.abs(u[1] - v[0]) < .001) u[1] = v[1]; else out.push([...v]); });
  out.forEach(([a, b]) => { tl.set(sel, { opacity: 1 }, a); if (b < DUR) tl.set(sel, { opacity: 0 }, b); });
}
const pop = (sel, t, rot = 0, dur = .36) => tl.fromTo(sel, { scale: .2, opacity: 0, rotation: rot - 10 }, { scale: 1, opacity: 1, rotation: rot, duration: dur, ease: 'back.out(2.2)' }, t);
const some = (sel, t) => tl.to(sel, { opacity: 0, scale: .6, duration: .16, ease: 'power2.in' }, t);
const expr = (id, nome, t) => { tl.set(`#${id} .r-m`, { opacity: 0 }, t); tl.set(`#${id} .r-m-${nome}`, { opacity: 1 }, t + .001); };
const chip = (id, txt, x, y, cls = '') => `<div class="chip ${cls}" id="${id}" style="left:${x}px;top:${y}px">${txt}</div>`;
const mosca = (id, x, y) => `<div class="mosca" id="${id}" style="left:${x}px;top:${y}px"></div>`;
const KK = 'stroke="#17112b" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"';

/* =================== MUNDO 1: QUARTO A =================== */
const qa = quartoA();
mundo('W1', [[qa.c0, .85], [qa.c1, 1],
  [`<div class="abs" id="rgA" style="left:170px;top:600px;width:740px">${regisV2({ u: 'a' })}</div>${mosca('m1', 300, 760)}${mosca('m2', 760, 700)}${mosca('m3', 420, 1210)}
    <div class="chip" id="notif" style="left:500px;top:640px;font-weight:700;font-size:34px"><i>M</i><div><small>Marina · agora</small>comprei a passagem</div></div>
    `, 1.1], [qa.c3, 1.6]]);
document.getElementById('listras').innerHTML = listras();
document.getElementById('tabuas').innerHTML = tabuas();
{ let s = ''; for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) s += `<rect x="${128 + c * 33}" y="${496 + r * 31}" width="23" height="23" rx="3"/>`; document.getElementById('caixas').innerHTML = s; }
vis('#W1', ['hook', 'chat', 'leu', 'placar', 'quarto', 'audio', 'digita', 'voto']);
// desfoca o quarto quando ele vira fundo do celular e das telas gráficas
['chat', 'placar', 'audio', 'digita', 'voto'].forEach(c => { tl.set('#W1', { filter: 'blur(16px) brightness(.5)' }, ini(c)); });
['leu', 'quarto'].forEach(c => tl.set('#W1', { filter: 'none' }, ini(c)));

// 1. GANCHO (tempos presos na voz: h0 = começo da abertura, hN = notificação, hS = susto, hJ = olha a janela)
const h0 = Math.max(.7, T(1) - .12), hd = Math.min(1.9, Math.max(1.0, (ini('chat') - h0) * .42)), hN = Math.max(h0 + hd * .8, P(1, .42)), hS = hN + .4, hJ = Math.min(ini('chat') - .7, hS + 1.1);
camSet('W1', 0, { x: 220, y: 520, z: 2.7, cy: 820 });
camTo('W1', 0, h0, { x: 220, y: 520, z: 2.55, cy: 820 }, 'none');
camTo('W1', h0, hd, P0, 'expo.inOut');
camTo('W1', h0 + hd, ini('chat') - h0 - hd, { x: 540, y: 940, z: 1.07 }, 'sine.out');
tl.to('#circ', { strokeDashoffset: 0, duration: .45, ease: 'power2.inOut' }, .2);
tl.fromTo('#cora', { scale: 0, svgOrigin: '300 410' }, { scale: 1, duration: .3, ease: 'back.out(3)' }, .6);
tl.fromTo('#p-dias', { opacity: 0, y: -40 }, { opacity: 1, y: 0, duration: .35, ease: 'back.out(2)' }, .3);
tl.fromTo('#aviao', { x: 400, y: 600, rotation: -14, svgOrigin: '0 0' }, { x: 780, y: 470, rotation: -14, duration: ini('chat') - h0 - .4, ease: 'none' }, h0 + .4);
tl.to('#pisca', { opacity: 0, duration: .01, repeat: 16, repeatDelay: .28, yoyo: true }, h0 + .4);
tl.to('#tela', { opacity: .82, duration: .09, repeat: Math.ceil(DUR / .9), repeatDelay: .81, yoyo: true }, .4);
tl.to('#fan', { rotation: 360 * 60, svgOrigin: '870 1140', duration: DUR, ease: 'none' }, 0);
tl.fromTo('#rgA .r-pup', { x: -4, y: 12 }, { x: 4, y: 12, duration: .5, yoyo: true, repeat: Math.max(1, Math.round(hN / .5) - 1), ease: 'sine.inOut' }, 0);
tl.fromTo('#notif', { opacity: 0, scale: .2, y: 120, x: -140, rotation: -10 }, { opacity: 1, scale: 1, y: 0, x: 0, rotation: 3, duration: .45, ease: 'back.out(2)' }, hN);
tl.to('#notif', { y: -14, duration: .9, yoyo: true, repeat: 3, ease: 'sine.inOut' }, hN + .45);
expr('rgA', 'o', hS);
tl.to('#rgA .r-sobr', { y: -14, duration: .16, ease: 'back.out(3)' }, hS);
tl.fromTo('#rgA .r-oculos', { rotation: 0, svgOrigin: '300 250' }, { rotation: 7, y: 8, duration: .25, ease: 'back.out(3)' }, hS + .05);
tl.fromTo('#rgA .r-suor', { opacity: 0, y: 0 }, { opacity: 1, y: 44, duration: .9, ease: 'power1.in' }, hS + .25);
tl.to('#rgA .r-pup', { x: -14, y: -10, duration: .25, ease: 'power2.out', overwrite: true }, hJ);
tl.to('#rgA .r-cab', { rotation: -7, svgOrigin: '300 384', duration: .4, ease: 'power2.out' }, hJ);
tl.set('#notif', { opacity: 0 }, ini('chat'));
window.__HK = { hN, hS };

// 3. LEU (close no rosto, iluminado pelo celular)
{ const a = ini('leu'), b = fim('leu');
  tl.set('#rgA .r-cab', { rotation: 0 }, a); tl.set('#rgA .r-oculos', { rotation: 0, y: 0 }, a); tl.set('#rgA .r-suor', { opacity: 0, y: 0 }, a);
  camSet('W1', a, { x: 548, y: 930, z: 2.2, cy: 800 }); camTo('W1', a, b - a, { x: 548, y: 930, z: 2.55, cy: 800 }, 'sine.out');
  expr('rgA', 'tenso', a);
  tl.fromTo('#rgA .r-pup', { x: -15, y: 10 }, { x: 15, y: 10, duration: D(8), ease: 'none', immediateRender: false }, T(8));
  tl.fromTo('#rgA .r-pup', { x: -15, y: 10 }, { x: 15, y: 10, duration: D(9), ease: 'none', immediateRender: false }, T(9));
  expr('rgA', 'o', P(9, .5)); tl.fromTo('#rgA .r-suor', { opacity: 0, y: 0 }, { opacity: 1, y: 40, duration: .6, immediateRender: false }, P(9, .5));
}
// 6. QUARTO (aberto → embaixo da cama → cadeira)
{ const a = ini('quarto'), b = fim('quarto');
  expr('rgA', 'triste', a); tl.set('#rgA .r-suor', { opacity: 0 }, a); tl.set('#rgA .r-pup', { x: 0, y: 6 }, a);
  camSet('W1', a, { x: 540, y: 980, z: 1.14 }); camTo('W1', a, T(15) - a, { x: 500, y: 1000, z: 1.0 }, 'sine.out');
  camTo('W1', P(15, .12), .75, { x: 262, y: 1184, z: 5.4, cy: 900 }, 'power3.inOut');
  tl.to('#rgA, #qa-cadeira', { opacity: 0, duration: .25 }, P(15, .12) + .2); tl.to('#rgA, #qa-cadeira', { opacity: 1, duration: .2 }, T(16) - .05);
  ['#qa-c1', '#qa-c2', '#qa-band', '#qa-lesma'].forEach((s, k) => tl.fromTo(s, { scale: 0, transformOrigin: '50% 100%' }, { scale: 1, duration: .35, ease: 'back.out(3)' }, P(15, .45 + k * .11)));
  tl.fromTo('#qa-lesma', { x: 0 }, { x: 10, duration: E(15) - P(15, .8), ease: 'none', immediateRender: false }, P(15, .8));
  camTo('W1', T(16) - .12, .7, { x: 130, y: 1290, z: 3.1, cy: 880 }, 'power3.inOut');
  tl.to('#qa-risco', { strokeDashoffset: 0, duration: .25, ease: 'power2.out' }, P(16, .5));
  tl.fromTo('#qa-gr', { scale: 0, svgOrigin: '135 1322' }, { scale: 1, duration: .35, ease: 'back.out(2.6)' }, P(17, .25));
  tl.fromTo('#qa-cadeira', { rotation: 0, svgOrigin: '130 1570' }, { rotation: 2, duration: .1, yoyo: true, repeat: 5, ease: 'sine.inOut' }, P(17, .25));
  camTo('W1', P(17, .3), b - P(17, .3), { x: 130, y: 1280, z: 3.3, cy: 880 }, 'sine.out');
  // de volta a fundo desfocado, câmera aberta
  camSet('W1', b, { x: 540, y: 960, z: 1.12 });
}
[['chat', 1.12, 1.2], ['placar', 1.1, 1.18], ['audio', 1.14, 1.22], ['digita', 1.1, 1.18], ['voto', 1.1, 1.2]].forEach(([c, z0, z1]) => { camSet('W1', ini(c), { x: 540, y: 960, z: z0 }); camTo('W1', ini(c), fim(c) - ini(c), { x: 540, y: 960, z: z1 }, 'none'); });

/* =================== CELULAR (conversa, foto, áudio, digitação) =================== */
let rolo = ''; for (let i = 0; i < 46; i++) rolo += `<div class="bub mini ${i % 3 ? '' : 'eu'}" style="width:${200 + (i * 67) % 300}px"></div>`;
let ondas = ''; for (let i = 0; i < 26; i++) ondas += `<i style="display:block;width:9px;height:${16 + ((i * 37) % 50)}px;background:#7a5cff;border-radius:5px"></i>`;
const U = document.createElement('div'); U.className = 'mundo'; U.id = 'U1';
U.innerHTML = `<div class="abs" id="fone-w" style="inset:0"><div id="fone">
  <div class="ph-top"><div class="ph-av">M</div><div><b>Marina</b><small>online · Lisboa</small></div></div>
  <div class="scr" id="sA"><div class="msgs"><div id="sa-rolo" style="display:flex;flex-direction:column;gap:20px">${rolo}</div></div>
    <div class="msgs" id="sa-fim" style="opacity:0;background:#fbf6ec"><div class="bub" style="align-self:center;font-size:30px;padding:8px 24px;opacity:1;background:#e9e2d2">ontem</div><div class="bub" id="sa-b1">comprei a passagem</div><div class="bub" id="sa-b2">chego dia 30</div></div>
    <div class="ph-in" style="opacity:.5">Mensagem</div></div>
  <div class="scr" id="sFoto" style="background:#120d26"><div style="width:100%;height:760px;overflow:hidden">${regis2019()}</div>
    <div style="position:absolute;left:0;right:0;top:760px;bottom:0;display:grid;place-items:center;font-weight:800;font-size:44px;color:#fff">foto do perfil</div>
    <svg viewBox="0 0 808 1038" style="position:absolute;left:0;top:0;width:808px;height:1038px">
      <g id="f-seta"><path d="M690 520 Q600 590 470 566 M512 536 L468 566 L506 600" fill="none" stroke="#fff" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/><path d="M690 520 Q600 590 470 566 M512 536 L468 566 L506 600" fill="none" stroke="#ff3f8f" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="640" y="486" text-anchor="middle" font-family="Bricolage" font-weight="800" font-size="56" fill="#ff3f8f" stroke="#fff" stroke-width="12" paint-order="stroke" transform="rotate(-6 640 486)">pescoço</text></g></svg></div>
  <div class="scr" id="sB"><div class="msgs"><div class="bub" id="au-b1" style="width:640px;max-width:none;display:flex;align-items:center;gap:18px;position:relative;overflow:hidden">
      <div id="au-prog" style="position:absolute;left:0;top:0;bottom:0;width:100%;background:#ffd23f;opacity:.45"></div>
      <svg viewBox="0 0 50 50" style="width:60px;flex:none;position:relative"><path d="M10 6 L44 25 L10 44Z" fill="#17112b"/></svg>
      <div style="display:flex;align-items:center;gap:5px;position:relative">${ondas}</div><span style="position:relative;font-size:36px">1:12</span></div>
      <div id="au-cont" style="opacity:0;font-weight:700;font-size:34px;color:#b9b2e6;padding-left:14px;display:flex;gap:10px">ouvido <span style="position:relative;display:inline-block;width:26px;height:40px">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<b id="au-n${n}" style="position:absolute;left:0;top:0;opacity:0;color:#ffd23f">${n}</b>`).join('')}</span> vezes</div>
      <div class="bub" id="au-b2">você ainda tem aquela jaqueta da foto?</div></div><div class="ph-in">Mensagem</div></div>
  <div class="scr" id="sC" style="background:#fbf6ec"><div class="msgs"><div class="bub" style="opacity:1">você ainda tem aquela jaqueta da foto?</div><div class="bub eu" id="dg-env">tô igualzinho</div></div>
    <div class="ph-in"><span id="dg-a" style="display:inline-block;overflow:hidden;white-space:nowrap;width:0">tenho sim</span><span id="dg-b" style="display:inline-block;overflow:hidden;white-space:nowrap;width:0">tô igualzinho</span><i class="cursor" id="dg-cur"></i></div></div>
  </div>
  <svg viewBox="0 0 1080 1920" style="position:absolute;inset:0;width:100%;height:100%"><g ${KK} transform="translate(0 -130)"><path d="M1010 2060 V1420 Q1000 1330 930 1330 Q890 1340 900 1420 L930 1560 L820 1920Z" fill="#eeb08a"/><path d="M935 1370 q30 10 36 50" fill="none" stroke-width="5"/></g></svg></div>
  ${chip('u-mes', '4 meses de conversa', 400, 450, 'a')}${chip('u-vid', 'chamadas de vídeo: 0', 330, 1060, 'v')}${chip('u-kk', 'kkkk', 700, 900, '')}${chip('u-ap', 'apagou', 640, 1040, 'v')}${chip('u-ver', 'verdade: 4%', 560, 330, 'v')}`;
stage.appendChild(U);
vis('#U1', ['chat', 'audio', 'digita']);
const sobe = c => { tl.fromTo('#fone-w', { y: 1300, rotation: 8 }, { y: 0, rotation: 0, duration: .5, ease: 'back.out(1.3)', immediateRender: false }, ini(c)); tl.fromTo('#fone-w', { scale: 1 }, { scale: 1.035, duration: fim(c) - ini(c) - .5, ease: 'none', immediateRender: false }, ini(c) + .5); };
// 2. CONVERSA + FOTO
sobe('chat'); tl.set('#sA', { opacity: 1 }, ini('chat')); tl.set('#sA', { opacity: 0 }, fim('chat'));
tl.fromTo('#sa-rolo', { y: 2600 }, { y: 0, duration: E(3) - T(2), ease: 'power2.out' }, T(2));
pop('#u-mes', P(2, .5), -4); pop('#u-vid', P(3, .35), 3);
some('#u-mes', T(4) - .05); some('#u-vid', T(4) - .05);
tl.set('#sFoto', { opacity: 1 }, T(4) - .02); tl.fromTo('#sFoto', { scale: .3, transformOrigin: '8% -8%' }, { scale: 1, duration: .4, ease: 'power3.out' }, T(4) - .02);
tl.fromTo('#f-seta', { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: .3, ease: 'back.out(2)' }, P(6, .5));
tl.to('#sFoto', { y: 1200, duration: .3, ease: 'power2.in' }, T(7) - .12); tl.set('#sFoto', { opacity: 0 }, T(7) + .2);
tl.set('#sa-fim', { opacity: 1 }, T(7) - .12);
pop('#sa-b1', P(7, .42)); pop('#sa-b2', P(7, .8));
// 10. ÁUDIO
sobe('audio'); tl.set('#sB', { opacity: 1 }, ini('audio')); tl.set('#sB', { opacity: 0 }, fim('audio'));
tl.set('#fone .ph-top', { backgroundColor: '#2c2452', color: '#fff' }, ini('audio')); tl.set('#fone .ph-top', { backgroundColor: '#fff', color: '#17112b' }, fim('audio'));
pop('#au-b1', P(28, .62));
tl.fromTo('#au-prog', { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: (T(31) - T(29)) / 5, ease: 'none', repeat: 4 }, T(29));
tl.set('#au-cont', { opacity: 1 }, T(30));
[1, 2, 3, 4, 5, 6, 7, 8, 9].forEach((n, k) => { const a = T(30) + D(30) * .8 * k / 9; tl.set('#au-n' + n, { opacity: 1 }, a); if (n < 9) tl.set('#au-n' + n, { opacity: 0 }, T(30) + D(30) * .8 * (k + 1) / 9); });
tl.fromTo('#au-cont', { scale: 1 }, { scale: 1.25, transformOrigin: '0% 50%', duration: .15, yoyo: true, repeat: 1 }, P(30, .8));
pop('#u-kk', P(31, .5), -8); some('#u-kk', fim('audio') - .05);
pop('#au-b2', T(32) + .05);
// 12. DIGITA
sobe('digita'); tl.set('#sC', { opacity: 1 }, ini('digita')); tl.set('#sC', { opacity: 0 }, fim('digita'));
const largura = id => { const e = document.getElementById(id), s = document.getElementById('sC'); s.style.opacity = 1; e.style.width = 'auto'; const w = e.getBoundingClientRect().width; e.style.width = '0'; s.style.opacity = ''; return w; };
const wa = largura('dg-a'), wb = largura('dg-b');
tl.fromTo('#dg-a', { width: 0 }, { width: wa, duration: D(35) * .55, ease: 'steps(9)' }, P(35, .42));
tl.to('#dg-a', { width: 0, duration: D(36) * .6, ease: 'steps(9)' }, T(36)); pop('#u-ap', P(36, .3), -5); some('#u-ap', T(37));
tl.fromTo('#dg-b', { width: 0 }, { width: wb, duration: D(37) * .6, ease: 'steps(13)' }, P(37, .35));
tl.set('#dg-b', { width: 0 }, T(38)); pop('#dg-env', T(38), 0, .3); pop('#u-ver', E(38) + .1, -5, .4); tl.set('#u-ver', { opacity: 0 }, fim('digita'));
tl.to('#dg-cur', { opacity: 0, duration: .01, repeat: Math.ceil((fim('digita') - ini('digita')) / .5), repeatDelay: .5, yoyo: true }, ini('digita'));

/* =================== MUNDO 2: QUARTO B (espelho / jaqueta) =================== */
const qb = quartoB();
mundo('W2', [[qb.c0, .85], [qb.c1, 1],
  [`<div class="abs" id="rgB" style="left:40px;top:620px;width:640px">${regisV2({ u: 'b', celular: false, expr: 'neutro' })}</div>${mosca('m4', 200, 760)}
   <div class="abs" id="botao" style="left:640px;top:1220px;width:44px;height:44px;border-radius:50%;background:#ffd23f;border:7px solid #17112b;opacity:0"></div>
   ${chip('es-marco', 'aqui desde março', 560, 520, 'v')}${chip('jq-plim', 'plim', 880, 800, 'a')}`, 1.1], [qb.c3, 1.6]]);
vis('#W2', ['espelho', 'jaqueta']);
{ const a = ini('espelho'), b = fim('espelho');
  camSet('W2', a, { x: 480, y: 960, z: 1.0 }); camTo('W2', a, T(11) - a, { x: 520, y: 960, z: 1.06 }, 'sine.out'); camTo('W2', T(11), b - T(11), { x: 540, y: 930, z: 1.2, cy: 900 }, 'sine.inOut');
  tl.fromTo('#rgB', { x: -720 }, { x: 0, duration: D(10), ease: 'power2.out' }, T(10));
  tl.to('#rgB', { y: -22, duration: D(10) / 6, yoyo: true, repeat: 5, ease: 'sine.inOut' }, T(10));
  pop('#es-marco', P(11, .7), -5);
  tl.to('#pilha', { y: 1500, rotation: 14, transformOrigin: '70% 60%', duration: .45, ease: 'power2.in' }, E(11) - .15);
  some('#es-marco', E(11) - .15); expr('rgB', 'o', E(11) + .1);
  tl.set('#pilha', { opacity: 0 }, b);
}
{ const a = ini('jaqueta'), b = fim('jaqueta');
  tl.set('#rgB', { x: 250, y: 0 }, a); tl.set('#rgB .r-jaq', { opacity: 1 }, a); tl.set('#reflexo', { opacity: 0 }, a); expr('rgB', 'sorriso', a);
  camSet('W2', a, { x: 610, y: 940, z: 1.2 }); camTo('W2', a, b - a, { x: 610, y: 1000, z: 1.45, cy: 900 }, 'sine.out');
  expr('rgB', 'tenso', T(34));
  tl.fromTo('#rgB .r-jl', { x: 0 }, { x: 30, duration: .16, yoyo: true, repeat: 5, ease: 'power2.inOut' }, T(34));
  tl.fromTo('#rgB .r-jr', { x: 0 }, { x: -30, duration: .16, yoyo: true, repeat: 5, ease: 'power2.inOut' }, T(34));
  tl.fromTo('#rgB .r-suor', { opacity: 0, y: 0 }, { opacity: 1, y: 34, duration: .5 }, T(34));
  tl.set('#botao', { opacity: 1 }, P(34, .8));
  tl.fromTo('#botao', { x: 0, rotation: 0 }, { x: 360, rotation: 540, duration: .5, ease: 'none' }, P(34, .8));
  tl.fromTo('#botao', { y: 0 }, { y: -560, duration: .5, ease: 'power2.out' }, P(34, .8));
  pop('#jq-plim', P(34, .8) + .3, 8, .25);
}

/* =================== TELA: PLACAR =================== */
const G1 = document.createElement('div'); G1.className = 'mundo'; G1.id = 'G1';
G1.innerHTML = `<div class="carta" id="pl-foto" style="left:60px;top:420px;width:450px;height:590px">${regis2019()}<div class="leg">2019</div></div>
  <div class="carta" id="pl-hoje" style="left:570px;top:420px;width:450px;height:590px;background:linear-gradient(#4a2f9e,#231848)"><div class="abs" style="left:-85px;top:-10px;width:620px">${regisV2({ u: 'p', celular: false, expr: 'triste', fedor: false })}</div><div class="leg">HOJE</div></div>
  <div class="abs" id="pl-vs" style="left:475px;top:630px;width:130px;height:130px;border-radius:50%;background:#ffd23f;border:8px solid #17112b;display:grid;place-items:center;font-weight:800;font-size:54px;color:#17112b;opacity:0">VS</div>
  <div class="abs" id="pl-bar" style="left:90px;top:1080px;width:900px;height:86px;border-radius:43px;border:8px solid #fff;background:#141026;overflow:hidden;opacity:0"><div id="pl-fill" style="width:100%;height:100%;background:#ff5a8a"></div></div>
  <div class="abs" id="pl-an1" style="left:190px;top:568px;width:190px;height:86px;border:10px solid #8cf06a;border-radius:40px;opacity:0"></div>
  <div class="abs" id="pl-an2" style="left:692px;top:632px;width:220px;height:92px;border:10px solid #8cf06a;border-radius:44px;opacity:0"></div>
  ${chip('pl-4', '4%', 440, 1040, 'v')}${chip('pl-oc', 'os óculos = os 4%', 240, 290, 'g')}`;
stage.appendChild(G1); vis('#G1', ['placar']);
document.getElementById('pl-4').style.fontSize = '84px'; document.getElementById('pl-oc').style.fontSize = '52px';
pop('#pl-foto', ini('placar') + .05, -5); pop('#pl-hoje', ini('placar') + .18, 4); pop('#pl-vs', ini('placar') + .34);
pop('#pl-bar', P(12, .2));
tl.fromTo('#pl-fill', { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: .04, duration: .7, ease: 'power2.out' }, P(12, .5));
pop('#pl-4', P(12, .62), -5, .45);
tl.fromTo('#p-foto', { opacity: 0, y: -40 }, { opacity: 1, y: 0, duration: .35, ease: 'back.out(2)' }, P(12, .55));
tl.fromTo('#p-fill', { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: .06, duration: .7, ease: 'power2.out' }, P(12, .55));
pop('#pl-an1', P(13, .55)); pop('#pl-an2', P(13, .62)); pop('#pl-oc', P(13, .6), -3);
tl.to('#pl-an1,#pl-an2', { scale: 1.12, duration: .22, yoyo: true, repeat: 3, ease: 'sine.inOut' }, P(13, .8));

/* =================== MUNDO 3: BANHEIRO (banho / dentes) =================== */
const bn = banheiro();
mundo('W3', [[bn.c0, .85],
  [`<div class="abs" id="rgC" style="left:560px;top:700px;width:560px">${regisV2({ u: 'c', celular: false, expr: 'neutro', fedor: false })}</div>
    <div class="abs esp" id="esp1" style="left:760px;top:770px;width:90px;height:90px"></div><div class="abs esp" id="esp2" style="left:820px;top:730px;width:120px;height:120px"></div><div class="abs esp" id="esp3" style="left:900px;top:780px;width:84px;height:84px"></div><div class="abs esp" id="esp4" style="left:720px;top:840px;width:60px;height:60px"></div>`, 1],
  [bn.frente, 1], [bn.c3, 1.6]]);
document.querySelectorAll('.esp').forEach(e => { e.style.cssText += ';border-radius:50%;background:#fff;border:6px solid #17112b;opacity:0'; });
vis('#W3', ['banho', 'dentes']);
{ const a = ini('banho'), b = fim('banho');
  camSet('W3', a, { x: 540, y: 960, z: 1.1 }); camTo('W3', a, T(19) - a, { x: 560, y: 940, z: 1.0 }, 'sine.out');
  camTo('W3', T(19) - .1, .6, { x: 668, y: 680, z: 3.0, cy: 880 }, 'power3.inOut');
  tl.fromTo('#xampu', { rotation: 0, svgOrigin: '659 760' }, { rotation: -12, duration: .3, ease: 'back.out(3)' }, P(19, .5));
  camTo('W3', T(20) - .1, .6, { x: 760, y: 900, z: 1.55, cy: 900 }, 'power3.inOut');
  expr('rgC', 'sorriso', T(20));
  ['#esp1', '#esp2', '#esp3', '#esp4'].forEach((s, k) => pop(s, P(20, .4 + k * .15), 0, .3));
  tl.to('.esp', { y: -8, duration: .5, yoyo: true, repeat: 5, ease: 'sine.inOut' }, P(20, .9));
  camTo('W3', T(21) - .1, .55, { x: 760, y: 690, z: 4.6, cy: 880 }, 'power3.inOut');
  tl.fromTo('#deterg', { rotation: 0, svgOrigin: '760 760' }, { rotation: 4, duration: .12, yoyo: true, repeat: 3 }, P(21, .5));
  tl.to('#gotas', { opacity: .2, duration: .12, yoyo: true, repeat: Math.ceil((b - a) / .12) }, a);
}
{ const a = ini('dentes'), b = fim('dentes');
  tl.set('.esp', { opacity: 0 }, a); expr('rgC', 'neutro', a);
  camSet('W3', a, { x: 300, y: 860, z: 2.1, cy: 900 }); camTo('W3', a, T(23) - a, { x: 330, y: 820, z: 2.6, cy: 900 }, 'sine.out');
  camTo('W3', T(23), .6, { x: 340, y: 740, z: 5.6, cy: 860 }, 'power3.inOut');
  document.querySelectorAll('#escova .cerda').forEach(c => { const i = +c.dataset.i;
    tl.fromTo(c, { rotation: (i - 4) * 4, svgOrigin: `${323 + i * 4} 732` }, { rotation: (i - 4) * 24, duration: .6, ease: 'elastic.out(1,.45)' }, P(23, .5));
    if (c.getAttribute('stroke') === '#fff') tl.to(c, { stroke: '#7be35a', duration: .3 }, P(23, .62)); });
}

/* =================== MUNDO 4: CORREDOR (mãe) =================== */
const co = corredor();
mundo('W4', [[co.c0, .85], [co.gas, 1],
  [`<div class="abs" id="mae1" style="left:40px;top:770px;width:470px">${mae()}</div>
    <div class="abs" id="pregador" style="left:268px;top:1002px;width:40px;height:62px;opacity:0"><svg viewBox="0 0 54 84" style="width:100%"><g ${KK} stroke-width="6"><rect x="6" y="6" width="18" height="72" rx="6" fill="#ffd23f"/><rect x="30" y="6" width="18" height="72" rx="6" fill="#ffd23f"/><rect x="4" y="30" width="46" height="12" fill="#d9d9e6"/></g></svg></div>
    ${chip('t1', 'toc', 580, 330, '')}${chip('t2', 'toc', 720, 290, '')}${chip('t3', 'toc', 860, 340, '')}
    <div class="balao" id="mae-bal" style="left:60px;top:330px;width:640px">Régis, tem um cheiro no corredor.</div>${chip('mae-ele', 'é ele', 680, 1000, 'v')}`, 1.1], [co.c3, 1.6]]);
document.getElementById('mae-ele').style.fontSize = '64px';
vis('#W4', ['mae']);
{ const a = ini('mae'), b = fim('mae');
  camSet('W4', a, { x: 540, y: 960, z: 1.08 }); camTo('W4', a, T(26) - a, { x: 560, y: 960, z: 1.0 }, 'sine.out');
  tl.to('#mae1 .m-braco', { rotation: -16, svgOrigin: '300 320', duration: .11, yoyo: true, repeat: 5, ease: 'power1.inOut' }, P(24, .35));
  pop('#t1', P(24, .35), -6, .2); pop('#t2', P(24, .35) + .22, 5, .2); pop('#t3', P(24, .35) + .44, -3, .2);
  ['#t1', '#t2', '#t3'].forEach(s => some(s, T(25) - .08));
  pop('#mae-bal', T(25), -2);
  camTo('W4', T(26) - .1, .5, { x: 700, y: 1000, z: 1.4, cy: 900 }, 'power3.inOut');
  pop('#mae-ele', T(26) + .1, -6, .4);
  tl.to('#W4 .gas', { scale: 1.25, svgOrigin: '700 1500', duration: .3, yoyo: true, repeat: 1 }, T(26));
  camTo('W4', T(27) - .1, .5, { x: 380, y: 1000, z: 1.7, cy: 900 }, 'power3.inOut');
  tl.set('#mae-ele', { opacity: 0 }, T(27)); pop('#pregador', P(27, .4));
}

/* =================== TELA: VOTO =================== */
const G2 = document.createElement('div'); G2.className = 'mundo'; G2.id = 'G2';
G2.innerHTML = `<div class="abs" id="vt-esq" style="left:0;top:0;width:540px;height:1920px;background:linear-gradient(#ff9a2f,#c95a12);border-right:8px solid #17112b">
    <svg viewBox="0 0 540 500" style="position:absolute;left:0;top:400px;width:540px"><g ${KK}><rect x="80" y="250" width="380" height="84" rx="20" fill="#efe8da"/><path d="M82 262 q80 -54 180 -14 q94 32 196 -22 l2 96 l-378 0Z" fill="#a83e58"/><rect x="92" y="196" width="118" height="64" rx="26" fill="#e6dba2"/><rect x="84" y="334" width="26" height="64" fill="#4a3220"/><rect x="430" y="334" width="26" height="64" fill="#4a3220"/></g></svg></div>
  <div class="abs" id="vt-dir" style="left:540px;top:0;width:540px;height:1920px;background:linear-gradient(#2fc7b5,#147a78);border-left:8px solid #17112b">
    <svg viewBox="0 0 540 500" style="position:absolute;left:0;top:400px;width:540px"><g ${KK}><path d="M150 410 V150 Q150 86 224 86 H300" fill="none" stroke-width="30"/><path d="M150 410 V150 Q150 86 224 86 H300" fill="none" stroke="#d9d9e6" stroke-width="14"/><path d="M286 64 h100 l44 74 h-188Z" fill="#d9d9e6"/><path d="M280 180 l-16 60 M336 190 l0 70 M392 180 l16 60 M308 284 l-8 50 M364 284 l8 50" stroke="#dff6ff" stroke-width="12"/></g></svg></div>
  <div class="abs" id="rgG" style="left:270px;top:900px;width:540px">${regisV2({ u: 'g', celular: false, expr: 'tenso' })}</div>
  <div class="carta" id="vt-pol" style="left:700px;top:330px;width:300px;height:400px">${regis2019()}<div class="leg" style="height:66px;font-size:36px">2019</div></div>
  <div class="abs" id="vt-ou" style="left:470px;top:620px;width:140px;height:140px;border-radius:50%;background:#fff;border:8px solid #17112b;display:grid;place-items:center;font-weight:800;font-size:58px;color:#17112b;opacity:0">OU</div>
  ${chip('vt-q', 'QUARTO', 80, 880, '')}${chip('vt-b', 'BANHO', 690, 880, '')}${chip('vt-vc', 'agora é com vocês', 130, 330, 'a')}${chip('vt-com', 'comenta uma palavra', 120, 290, 'esc')}${chip('vt-d2', 'a mais votada vira o dia 2', 190, 1500, 'g')}`;
stage.appendChild(G2); vis('#G2', ['voto']); tl.set('#rgA', { opacity: 0 }, ini('voto'));
['vt-q', 'vt-b', 'vt-vc', 'vt-com'].forEach(i => { document.getElementById(i).style.fontSize = '64px'; });
pop('#vt-vc', P(39, .3), -3, .45); pop('#vt-pol', P(40, .6), 6);
some('#vt-vc', T(41) - .05); some('#vt-pol', T(41) - .05);
tl.fromTo('#vt-esq', { x: -560 }, { x: 0, duration: .4, ease: 'power3.out' }, T(41));
tl.fromTo('#vt-dir', { x: 560 }, { x: 0, duration: .4, ease: 'power3.out' }, T(41));
tl.fromTo('#rgG', { y: 0 }, { y: -30, duration: .2, yoyo: true, repeat: 1, ease: 'power2.out' }, T(41));
pop('#vt-q', P(41, .55), -4, .45); pop('#vt-ou', P(41, .68)); pop('#vt-b', P(41, .8), 4, .45);
pop('#vt-com', T(42) + .05, -2, .45); pop('#vt-d2', P(43, .4), 2, .45);
tl.fromTo('#rgG .r-pup', { x: -12 }, { x: 12, duration: .6, yoyo: true, repeat: 12, ease: 'sine.inOut' }, T(41) + .5);
tl.to('#vt-q', { scale: 1.12, duration: .4, yoyo: true, repeat: 9, ease: 'sine.inOut' }, E(43));
tl.to('#vt-b', { scale: 1.12, duration: .4, yoyo: true, repeat: 9, ease: 'sine.inOut' }, E(43) + .4);

/* =================== camada fixa de chips =================== */
{ const o = document.createElement('div'); o.className = 'mundo'; o.id = 'OV'; o.style.opacity = 1; o.style.overflow = 'visible';
  o.innerHTML = chip('leu1', '✓✓ lido', 600, 330, '') + chip('leu2', '✓✓ lido 2x', 560, 330, 'v') + chip('bn-ago', 'acabou em agosto', 120, 320, 'v') + chip('dt-uso', 'em uso desde 2021', 330, 320, 'v') + chip('jq-tam', 'tamanho M · de 2019', 110, 330, '') + chip('u-ano', '2019', 640, 1010, 'v');
  stage.appendChild(o); document.getElementById('u-ano').style.fontSize = '72px'; }
pop('#leu1', P(8, .65), 4); tl.set('#leu1', { opacity: 0 }, P(9, .5)); pop('#leu2', P(9, .5), -3); tl.set('#leu2', { opacity: 0 }, fim('leu'));
pop('#bn-ago', P(19, .6), -4); some('#bn-ago', T(20) - .1);
pop('#dt-uso', P(22, .6), -3); some('#dt-uso', T(23));
pop('#jq-tam', P(33, .5), -4); tl.set('#jq-tam', { opacity: 0 }, fim('jaqueta'));
pop('#u-ano', P(5, .55), -8, .4); some('#u-ano', T(7) - .12);

/* =================== vida =================== */
gsap.utils.toArray('.r-resp').forEach(e => tl.fromTo(e, { scaleY: 1, scaleX: 1, transformOrigin: '50% 100%' }, { scaleY: 1.022, scaleX: .99, duration: 1.1, yoyo: true, repeat: Math.ceil(DUR / 1.1), ease: 'sine.inOut' }, 0));
gsap.utils.toArray('.r-palp').forEach(e => { gsap.set(e, { scaleY: 0, transformOrigin: '50% 0%' }); for (let t = 3.1; t < DUR; t += 3.7) { tl.to(e, { scaleY: 1, duration: .07, ease: 'none' }, t); tl.to(e, { scaleY: 0, duration: .09, ease: 'none' }, t + .08); } });
gsap.utils.toArray('.r-fedor path, .gas path').forEach((e, k) => tl.fromTo(e, { y: 12, opacity: .3 }, { y: -24, opacity: 1, duration: .95 + (k % 5) * .14, yoyo: true, repeat: Math.ceil(DUR / .95), ease: 'sine.inOut' }, 0));
gsap.utils.toArray('.mosca').forEach((e, k) => { tl.fromTo(e, { x: -46 }, { x: 54, duration: .73 + k * .11, yoyo: true, repeat: Math.ceil(DUR / .73), ease: 'sine.inOut' }, 0); tl.fromTo(e, { y: 30 }, { y: -38, duration: .49 + k * .07, yoyo: true, repeat: Math.ceil(DUR / .49), ease: 'sine.inOut' }, 0); });
{ let s = ''; for (let i = 0; i < 26; i++) { const d = 4 + (i % 4) * 3; s += `<div class="po" style="left:${(i * 173 + 40) % 1080}px;top:${(i * 311 + 200) % 1700}px;width:${d}px;height:${d}px;opacity:${.1 + (i % 5) * .06}"></div>`; }
  document.getElementById('poeira').innerHTML = s;
  gsap.utils.toArray('.po').forEach((e, k) => tl.fromTo(e, { y: 60, x: 0 }, { y: -500 - (k % 4) * 200, x: 120 - (k % 3) * 120, duration: DUR, ease: 'none' }, 0)); }

/* =================== legenda =================== */
const caps = document.getElementById('caps'); let nc = 0;
LINES.forEach((l, i) => {
  const ws = l.t.split(/\s+/), chunks = []; let cur = [];
  ws.forEach(w => { const len = cur.join(' ').length + w.length + 1; if (cur.length && (cur.length >= 3 || len > 15)) { chunks.push(cur); cur = []; } cur.push(w); });
  if (cur.length) chunks.push(cur);
  const peso = chunks.map(c => c.join(' ').length + 2), tot = peso.reduce((a, b) => a + b, 0); let t = T(i);
  chunks.forEach((c, k) => {
    const d = D(i) * peso[k] / tot, e = document.createElement('div'); e.className = 'cap'; e.id = 'cap' + (nc++);
    e.innerHTML = c.map(w => w === l.h ? `<span class="${l.c}">${w}</span>` : w).join(' '); caps.appendChild(e);
    tl.set(e, { opacity: 1 }, t); tl.fromTo(e, { scale: .8 }, { scale: 1, duration: .13, ease: 'back.out(3)' }, t);
    tl.set(e, { opacity: 0 }, k === chunks.length - 1 ? E(i) + .12 : t + d); t += d;
  });
});
if (window.ESTILO === 'kurz') aplicarKurz();
return tl;
};
