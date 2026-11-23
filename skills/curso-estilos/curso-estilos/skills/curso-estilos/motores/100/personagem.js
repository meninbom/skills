// Personagens da série "30 dias pra ficar igual à foto". SVG puro, traço grosso, cor chapada.
const INK = '#1c1530', SKIN = '#f0b48c', SKIN2 = '#d99673', LARANJA = '#f08a24';

function barba() {
  let s = '';
  for (let r = 0; r < 4; r++) for (let i = 0; i < 10; i++) {
    const x = 104 + i * 21 + (r % 2) * 10, y = 222 + r * 13;
    if (Math.abs(x - 200) < 34 && r < 2) continue;
    if (Math.abs(x - 200) > 100 - r * 12) continue;
    s += `<circle cx="${x}" cy="${y}" r="2.6"/>`;
  }
  return `<g fill="#7a5544" stroke="none">${s}</g>`;
}

function bocas(expr, y = 238) {
  const m = (n, d) => `<g class="r-m r-m-${n}" opacity="${n === expr ? 1 : 0}">${d}</g>`;
  return m('neutro', `<path d="M172 ${y} Q200 ${y + 8} 228 ${y}" fill="none"/>`)
    + m('o', `<ellipse cx="200" cy="${y + 2}" rx="15" ry="20" fill="#5a1f2a"/>`)
    + m('triste', `<path d="M170 ${y + 8} Q200 ${y - 10} 230 ${y + 8}" fill="none"/>`)
    + m('torto', `<path d="M168 ${y + 2} q10 -9 20 0 t20 0 t20 0" fill="none"/>`)
    + m('sorriso', `<path d="M164 ${y - 8} Q200 ${y + 30} 236 ${y - 8} Z" fill="#f3e9b0"/>`);
}

// Régis hoje. opções: expr, jaqueta, fedor, vb (viewBox pra recortar busto)
function regis(o = {}) {
  const { expr = 'neutro', jaqueta = false, fedor = true, vb = '-40 -70 480 720', camisa = '#93a888' } = o;
  const braco = jaqueta ? LARANJA : SKIN;
  return `<svg class="regis" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;display:block;width:100%">
<g stroke="${INK}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round">
${fedor ? `<g class="r-fedor" fill="none" stroke="#a6d64a" stroke-width="10">
<path d="M14 250 q-24 -30 0 -60 q24 -30 0 -60"/><path d="M388 240 q24 -30 0 -60 q-24 -30 0 -60"/><path d="M356 96 q20 -24 0 -48 q-20 -24 0 -48"/></g>` : ''}
<ellipse cx="200" cy="634" rx="160" ry="15" fill="#000" opacity=".22" stroke="none"/>
<rect x="116" y="486" width="76" height="126" rx="22" fill="#5d6180"/>
<rect x="208" y="486" width="76" height="126" rx="22" fill="#5d6180"/>
<ellipse cx="144" cy="616" rx="54" ry="20" fill="#efe8da"/>
<ellipse cx="256" cy="616" rx="54" ry="20" fill="#efe8da"/>
<g class="r-resp">
  <path d="M76 326 Q22 410 58 486" fill="none" stroke-width="66"/>
  <path d="M76 326 Q22 410 58 486" fill="none" stroke="${braco}" stroke-width="50"/>
  <path d="M324 326 Q378 410 342 486" fill="none" stroke-width="66"/>
  <path d="M324 326 Q378 410 342 486" fill="none" stroke="${braco}" stroke-width="50"/>
  <circle cx="58" cy="494" r="27" fill="${SKIN}"/><circle cx="342" cy="494" r="27" fill="${SKIN}"/>
  <ellipse cx="200" cy="470" rx="132" ry="62" fill="${SKIN}"/>
  <path d="M192 498 q8 8 16 0" fill="none" stroke-width="6"/>
  <path d="M68 330 Q58 250 200 250 Q342 250 332 330 Q356 440 320 476 Q200 508 80 476 Q44 440 68 330Z" fill="${camisa}"/>
  <path d="M160 254 Q200 288 240 254" fill="none" stroke-width="7"/>
  <g stroke="none"><ellipse cx="146" cy="392" rx="24" ry="15" fill="#c98b3c"/><ellipse cx="252" cy="430" rx="17" ry="11" fill="#7d5b3c"/><ellipse cx="226" cy="340" rx="12" ry="9" fill="#c98b3c"/><circle cx="170" cy="446" r="7" fill="#b5483a"/></g>
  ${jaqueta ? `<path class="r-jl" d="M64 330 Q56 258 150 250 L156 474 Q104 484 78 472 Q42 432 64 330Z" fill="${LARANJA}"/>
  <path class="r-jr" d="M336 330 Q344 258 250 250 L244 474 Q296 484 322 472 Q358 432 336 330Z" fill="${LARANJA}"/>
  <path class="r-jl" d="M150 250 L126 300 L152 330" fill="#ffb054"/><path class="r-jr" d="M250 250 L274 300 L248 330" fill="#ffb054"/>` : ''}
  <g class="r-cab">
    <ellipse cx="200" cy="264" rx="98" ry="40" fill="${SKIN}"/>
    <circle cx="82" cy="172" r="26" fill="${SKIN}"/><circle cx="318" cy="172" r="26" fill="${SKIN}"/>
    <rect x="85" y="58" width="230" height="218" rx="104" fill="${SKIN}"/>
    ${barba()}
    <g stroke="none" fill="#d4533f"><circle cx="118" cy="214" r="7"/><circle cx="286" cy="226" r="6"/><circle cx="262" cy="104" r="6"/><circle cx="136" cy="118" r="5"/></g>
    <path d="M80 152 Q66 36 200 26 Q334 36 320 152 Q300 108 272 122 Q250 88 222 118 Q192 86 164 120 Q128 98 80 152Z" fill="#3a2a22"/>
    <path d="M128 48 l-20 -32 l38 18 M244 34 l22 -36 l12 40 M196 28 l-4 -30 l22 26" fill="#3a2a22"/>
    <path d="M120 78 q30 -22 60 -18 M228 62 q30 2 50 26" fill="none" stroke="#fff" stroke-width="5" opacity=".28"/>
    <path class="r-sobr" d="M112 130 L184 122 M216 122 L288 130" fill="none" stroke-width="10"/>
    <rect x="108" y="142" width="82" height="66" rx="20" fill="#eef8ff"/><rect x="210" y="142" width="82" height="66" rx="20" fill="#eef8ff"/>
    <g class="r-pup" stroke="none" fill="${INK}"><circle cx="149" cy="176" r="10"/><circle cx="251" cy="176" r="10"/></g>
    <g stroke="none" fill="${SKIN2}"><rect class="r-palp" x="112" y="146" width="74" height="58" rx="16"/><rect class="r-palp" x="214" y="146" width="74" height="58" rx="16"/></g>
    <rect x="108" y="142" width="82" height="66" rx="20" fill="none"/><rect x="210" y="142" width="82" height="66" rx="20" fill="none"/>
    <path d="M190 170 L210 170 M108 166 L88 160 M292 166 L312 160" fill="none"/>
    <rect x="188" y="158" width="24" height="22" rx="3" fill="#fff" stroke-width="5" transform="rotate(-8 200 169)"/>
    <path d="M198 206 q10 14 -6 18" fill="none" stroke-width="6"/>
    ${bocas(expr)}
    <path class="r-suor" d="M330 110 q-14 22 0 30 q14 -8 0 -30Z" fill="#7fd0ff" opacity="0"/>
  </g>
</g></g></svg>`;
}

// Régis na foto de 2019 (busto): pescoço, cabelo arrumado, jaqueta laranja.
function regis2019() {
  return `<svg viewBox="0 0 400 440" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%">
<rect width="400" height="440" fill="#ffd9a0"/><circle cx="310" cy="90" r="120" fill="#ffc46b"/>
<g stroke="${INK}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round">
<path d="M34 444 Q44 318 150 300 L250 300 Q356 318 366 444Z" fill="${LARANJA}"/>
<path d="M150 300 L200 372 L250 300" fill="#fff"/>
<path d="M150 300 L128 352 L176 344 M250 300 L272 352 L224 344" fill="#ffb054"/>
<rect x="170" y="236" width="60" height="84" rx="14" fill="${SKIN}"/>
<circle cx="110" cy="166" r="22" fill="${SKIN}"/><circle cx="290" cy="166" r="22" fill="${SKIN}"/>
<rect x="112" y="62" width="176" height="200" rx="84" fill="${SKIN}"/>
<path d="M108 158 Q98 50 200 44 Q304 50 292 158 Q282 108 222 100 Q150 96 108 158Z" fill="#3a2a22"/>
<path d="M134 128 L186 124 M214 124 L266 128" fill="none" stroke-width="9"/>
<rect x="124" y="140" width="68" height="56" rx="18" fill="#eef8ff"/><rect x="208" y="140" width="68" height="56" rx="18" fill="#eef8ff"/>
<circle cx="158" cy="168" r="9" fill="${INK}" stroke="none"/><circle cx="242" cy="168" r="9" fill="${INK}" stroke="none"/>
<path d="M192 164 L208 164" fill="none"/>
<path d="M198 194 q8 12 -5 16" fill="none" stroke-width="6"/>
<path d="M168 218 Q200 250 232 218 Z" fill="#fff"/>
</g></svg>`;
}

// Mãe: coque grisalho, blusa rosa, mão batendo na porta.
function mae() {
  return `<svg viewBox="-20 -40 440 700" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;display:block;width:100%">
<g stroke="${INK}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round">
<ellipse cx="200" cy="634" rx="140" ry="14" fill="#000" opacity=".22" stroke="none"/>
<rect x="150" y="520" width="44" height="96" rx="16" fill="${SKIN}"/><rect x="206" y="520" width="44" height="96" rx="16" fill="${SKIN}"/>
<ellipse cx="166" cy="620" rx="40" ry="16" fill="#c2456b"/><ellipse cx="236" cy="620" rx="40" ry="16" fill="#c2456b"/>
<path d="M96 330 Q90 262 200 258 Q310 262 304 330 L326 548 Q200 574 74 548Z" fill="#ef6f9a"/>
<path d="M132 330 L268 330 L282 552 Q200 566 118 552Z" fill="#fff6e6"/>
<path d="M100 320 Q60 400 96 470" fill="none" stroke-width="56"/><path d="M100 320 Q60 400 96 470" fill="none" stroke="#ef6f9a" stroke-width="40"/>
<circle cx="98" cy="478" r="22" fill="${SKIN}"/>
<g class="m-braco"><path d="M300 320 Q370 300 372 232" fill="none" stroke-width="56"/><path d="M300 320 Q370 300 372 232" fill="none" stroke="#ef6f9a" stroke-width="40"/>
<circle cx="372" cy="222" r="24" fill="${SKIN}"/></g>
<g class="r-cab">
<circle cx="200" cy="30" r="46" fill="#b9b4c6"/>
<circle cx="112" cy="170" r="20" fill="${SKIN}"/><circle cx="288" cy="170" r="20" fill="${SKIN}"/>
<rect x="110" y="62" width="180" height="200" rx="86" fill="${SKIN}"/>
<path d="M106 150 Q100 54 200 50 Q300 54 294 150 Q250 96 200 100 Q150 96 106 150Z" fill="#b9b4c6"/>
<path d="M132 138 L182 146 M218 146 L268 138" fill="none" stroke-width="9"/>
<circle cx="158" cy="172" r="26" fill="#eef8ff"/><circle cx="242" cy="172" r="26" fill="#eef8ff"/>
<g class="r-pup" stroke="none" fill="${INK}"><circle cx="162" cy="174" r="9"/><circle cx="246" cy="174" r="9"/></g>
<path d="M184 172 L216 172" fill="none"/>
<path d="M196 200 q10 12 -4 18" fill="none" stroke-width="6"/>
<path d="M176 234 Q200 224 224 234" fill="none"/>
<g stroke="none" fill="#f08aa8" opacity=".7"><circle cx="130" cy="214" r="13"/><circle cx="270" cy="214" r="13"/></g>
</g></g></svg>`;
}
