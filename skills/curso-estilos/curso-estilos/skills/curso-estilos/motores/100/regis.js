// Régis v2: feio de propósito. Luz do monitor pela direita (recorte ciano), sombra roxa pela esquerda, celular iluminando de baixo.
const K = '#17112b', PELE = '#eeb08a', PELE_S = '#c9805f';
const TR = `stroke="${K}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"`;

function pelos(pts, cor = '#5a3a2c', w = 3.5) {
  return `<g fill="none" stroke="${cor}" stroke-width="${w}" stroke-linecap="round">` + pts.map(([x, y, a]) => `<path d="M${x} ${y} l${Math.cos(a) * 9} ${Math.sin(a) * 9}"/>`).join('') + '</g>';
}
function barba2() {
  let s = '';
  for (let r = 0; r < 6; r++) for (let i = 0; i < 13; i++) {
    const x = 200 + i * 16.5 + (r % 2) * 8, y = 300 + r * 13;
    if (Math.abs(x - 300) < 58 && y < 356) continue;           // boca
    if (Math.abs(x - 300) > 112 - r * 9) continue;              // contorno do queixo
    if ((i * 7 + r * 3) % 5 === 0) continue;                    // falhas
    s += `<circle cx="${x}" cy="${y}" r="${2.2 + ((i + r) % 3) * .5}"/>`;
  }
  return `<g fill="#6b4636" stroke="none">${s}</g>`;
}

function regisV2(o = {}) {
  const { u = '', celular = true, expr = 'tenso', jaqueta = false, fedor = true } = o;
  const op = n => (n === expr ? 1 : 0);
  const corpo = 'M150 430 C118 520 108 640 150 716 C200 768 400 768 450 716 C492 640 482 520 450 430 C420 384 180 384 150 430Z';
  const cabeca = 'M190 250 C184 150 230 108 300 108 C370 108 416 150 410 250 C422 334 380 384 300 384 C220 384 178 334 190 250Z';
  const camisa = 'M150 430 C126 500 118 580 132 636 Q300 700 468 636 C482 580 474 500 450 430 C420 384 180 384 150 430Z';
  return `<svg viewBox="0 0 600 900" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;display:block;width:100%">
<defs>
  <mask id="mSombraC${u}"><path d="${corpo}" fill="#fff"/><path d="${corpo}" fill="#000" transform="translate(34 -8)"/></mask>
  <mask id="mLuzC${u}"><path d="${corpo}" fill="#fff"/><path d="${corpo}" fill="#000" transform="translate(-16 4)"/></mask>
  <mask id="mSombraH${u}"><path d="${cabeca}" fill="#fff"/><path d="${cabeca}" fill="#000" transform="translate(30 -6)"/></mask>
  <mask id="mLuzH${u}"><path d="${cabeca}" fill="#fff"/><path d="${cabeca}" fill="#000" transform="translate(-14 4)"/></mask>
  <clipPath id="cCorpo${u}"><path d="${corpo}"/></clipPath><clipPath id="cCab${u}"><path d="${cabeca}"/></clipPath>
  <radialGradient id="gCel${u}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#bff3ff" stop-opacity=".6"/><stop offset=".45" stop-color="#5fd8ff" stop-opacity=".14"/><stop offset="1" stop-color="#5fd8ff" stop-opacity="0"/></radialGradient>
</defs>
<ellipse cx="300" cy="874" rx="200" ry="22" fill="#07041a" opacity=".55"/>
<!-- pernas, meia e chinelo -->
<g ${TR}>
  <rect x="212" y="730" width="66" height="96" rx="20" fill="${PELE}"/><rect x="322" y="730" width="66" height="96" rx="20" fill="${PELE}"/>
  <rect x="210" y="790" width="70" height="62" rx="14" fill="#f2efe4"/><rect x="320" y="790" width="70" height="62" rx="14" fill="#f2efe4"/>
  <path d="M212 808 H278 M322 808 H388" stroke="#e0483f" stroke-width="7"/><path d="M212 822 H278 M322 822 H388" stroke="#3f6de0" stroke-width="7"/>
  <path d="M190 870 Q190 842 236 842 H286 Q296 842 296 858 V870Z" fill="#1f2a5c"/><path d="M304 870 V858 Q304 842 314 842 H364 Q410 842 410 870Z" fill="#1f2a5c"/>
  <path d="M214 846 Q246 826 282 846" fill="none" stroke-width="16"/><path d="M214 846 Q246 826 282 846" fill="none" stroke="#3f6de0" stroke-width="8"/>
  <path d="M318 846 Q354 826 386 846" fill="none" stroke-width="16"/><path d="M318 846 Q354 826 386 846" fill="none" stroke="#3f6de0" stroke-width="8"/>
</g>
${pelos([[226, 748, 1.2], [246, 760, 1.6], [262, 746, 1.9], [236, 774, 1.4], [338, 750, 1.3], [356, 764, 1.7], [372, 748, 1.9], [348, 778, 1.5]])}
<g ${TR}><path d="M168 684 Q300 742 432 684 L424 786 Q366 806 314 790 L300 744 L286 790 Q234 806 176 786Z" fill="#5a3fa0"/><path d="M186 700 L190 786 M414 700 L410 786" stroke="#fff" stroke-width="6" opacity=".8"/></g>
<g class="r-resp">
  <!-- braço de trás -->
  <g ${TR}><path d="M152 452 Q92 560 118 664" fill="none" stroke-width="64"/><path d="M152 452 Q92 560 118 664" fill="none" stroke="${PELE}" stroke-width="50"/><circle cx="120" cy="676" r="28" fill="${PELE}"/></g>
  ${pelos([[98, 560, 2.6], [104, 590, 2.8], [100, 620, 2.5], [112, 640, 2.9]])}
  <!-- barriga e camiseta -->
  <path d="${corpo}" fill="${PELE}" ${TR}/>
  ${pelos([[270, 668, 1.2], [290, 680, 1.5], [312, 682, 1.7], [332, 670, 2.0], [300, 700, 1.6], [280, 716, 1.3], [322, 716, 1.9], [300, 730, 1.57], [250, 690, 1.0], [352, 692, 2.1]])}
  <path d="M290 698 q10 9 20 0" fill="none" ${TR} stroke-width="5"/>
  <path d="${camisa}" fill="#cdbf95" ${TR}/>
  <g clip-path="url(#cCorpo${u})">
    <ellipse cx="166" cy="470" rx="30" ry="48" fill="#c9b24a" opacity=".75"/><ellipse cx="436" cy="470" rx="30" ry="48" fill="#c9b24a" opacity=".75"/>
    <ellipse cx="238" cy="560" rx="26" ry="16" fill="#c9792c"/><ellipse cx="252" cy="588" rx="9" ry="12" fill="#c9792c"/><ellipse cx="352" cy="610" rx="16" ry="10" fill="#8a4a2a"/><circle cx="330" cy="520" r="7" fill="#b8402f"/>
    <g opacity=".55"><circle cx="300" cy="500" r="54" fill="none" stroke="#6a5fb5" stroke-width="9" stroke-dasharray="14 9"/><path d="M276 520 L300 470 L324 520 M286 504 H314" fill="none" stroke="#6a5fb5" stroke-width="9"/></g>
    <path d="M206 404 Q300 452 394 404" fill="none" ${TR}/>
    <path d="M178 560 q26 30 20 70 M420 566 q-22 26 -16 62 M250 640 q50 22 100 0" fill="none" stroke="#8f8362" stroke-width="5" stroke-linecap="round"/>
    <path d="${corpo}" fill="#3a1f8a" opacity=".42" mask="url(#mSombraC${u})" style="mix-blend-mode:multiply"/>
    <path d="${corpo}" fill="#5fe0ff" opacity=".8" mask="url(#mLuzC${u})" style="mix-blend-mode:screen"/>
  </g>
  ${celular ? `  <!-- braço da frente com o celular -->
  <g class="r-braco">
    <g ${TR}><path d="M452 452 Q528 540 474 616" fill="none" stroke-width="64"/><path d="M452 452 Q528 540 474 616" fill="none" stroke="${PELE}" stroke-width="50"/>
    <path d="M474 616 Q430 600 392 566" fill="none" stroke-width="58"/><path d="M474 616 Q430 600 392 566" fill="none" stroke="${PELE}" stroke-width="44"/></g>
    <path d="M500 520 Q512 548 500 580" fill="none" stroke="#5fe0ff" stroke-width="7" stroke-linecap="round" opacity=".85"/>
    ${pelos([[470, 560, .4], [482, 584, .2], [452, 596, .6], [430, 588, .8]])}
    <g transform="rotate(-12 372 520)" ${TR}><rect x="330" y="450" width="86" height="140" rx="14" fill="#1b1533"/><rect x="340" y="462" width="66" height="112" rx="6" fill="#d8f8ff" stroke="none"/><rect x="346" y="476" width="40" height="12" rx="6" fill="#ff7eb6" stroke="none"/><rect x="346" y="496" width="52" height="10" rx="5" fill="#9bb7c9" stroke="none"/><rect x="346" y="514" width="30" height="10" rx="5" fill="#9bb7c9" stroke="none"/></g>
    <g ${TR}><circle cx="396" cy="572" r="24" fill="${PELE}"/><path d="M380 556 q-16 -4 -22 6 M382 572 q-18 -2 -24 8" fill="none" stroke-width="5"/></g>
  </g>
  ${celular ? `<circle class="r-glow" cx="366" cy="486" r="150" opacity=".8" fill="url(#gCel${u})" style="mix-blend-mode:screen"/>` : ''}
` : `  <g ${TR}><path d="M448 452 Q508 560 482 664" fill="none" stroke-width="64"/><path d="M448 452 Q508 560 482 664" fill="none" stroke="${PELE}" stroke-width="50"/><circle cx="480" cy="676" r="28" fill="${PELE}"/></g>
  <path d="M506 540 Q516 590 502 640" fill="none" stroke="#5fe0ff" stroke-width="7" stroke-linecap="round" opacity=".85"/>
`}
  <g class="r-jaq" opacity="${jaqueta ? 1 : 0}" ${TR}>
    <path d="M152 452 Q92 560 118 650" fill="none" stroke-width="72"/><path d="M152 452 Q92 560 118 650" fill="none" stroke="#f08a24" stroke-width="58"/>
    <path d="M448 452 Q508 560 482 650" fill="none" stroke-width="72"/><path d="M448 452 Q508 560 482 650" fill="none" stroke="#f08a24" stroke-width="58"/>
    <path class="r-jl" d="M146 432 C122 500 116 590 130 640 Q170 662 236 668 L226 408 Q180 398 146 432Z" fill="#f08a24"/>
    <path class="r-jr" d="M454 432 C478 500 484 590 470 640 Q430 662 364 668 L374 408 Q420 398 454 432Z" fill="#f08a24"/>
    <path class="r-jl" d="M226 408 L196 470 L232 500Z" fill="#ffb054"/><path class="r-jr" d="M374 408 L404 470 L368 500Z" fill="#ffb054"/>
    <path class="r-jl" d="M228 520 V660" stroke-width="5" stroke-dasharray="6 14"/><circle class="r-jr" cx="372" cy="540" r="8" fill="#ffd23f"/><circle class="r-jr" cx="370" cy="600" r="8" fill="#ffd23f"/>
  </g>
  <!-- cabeça -->
  <g class="r-cab">
    <ellipse cx="300" cy="372" rx="98" ry="36" fill="${PELE}" ${TR}/>
    ${pelos([[262, 398, 1.4], [284, 404, 1.6], [318, 404, 1.5], [340, 398, 1.8]], '#6b4636', 3)}
    <g ${TR}><circle cx="184" cy="268" r="25" fill="${PELE}"/><circle cx="416" cy="268" r="25" fill="${PELE}"/><path d="M176 262 q8 8 2 18 M424 262 q-8 8 -2 18" fill="none" stroke-width="5"/></g>
    <path d="${cabeca}" fill="${PELE}" ${TR}/>
    <g clip-path="url(#cCab${u})">
      <ellipse cx="238" cy="318" rx="34" ry="22" fill="#e58f7a" opacity=".5"/><ellipse cx="362" cy="318" rx="34" ry="22" fill="#e58f7a" opacity=".5"/>
      ${barba2()}
      <path d="${cabeca}" fill="#3a1f8a" opacity=".4" mask="url(#mSombraH${u})" style="mix-blend-mode:multiply"/>
      <path d="${cabeca}" fill="#5fe0ff" opacity=".85" mask="url(#mLuzH${u})" style="mix-blend-mode:screen"/>
      <ellipse cx="300" cy="150" rx="60" ry="22" fill="#fff" opacity=".28"/>
    </g>
    <g stroke="#8a2a1f" stroke-width="2"><circle cx="222" cy="232" r="7" fill="#d9442f"/><circle cx="222" cy="232" r="2.5" fill="#fff4c8" stroke="none"/><circle cx="386" cy="306" r="8" fill="#d9442f"/><circle cx="386" cy="306" r="3" fill="#fff4c8" stroke="none"/><circle cx="340" cy="176" r="6" fill="#d9442f"/><circle cx="214" cy="322" r="6" fill="#d9442f"/><circle cx="268" cy="168" r="5" fill="#d9442f"/></g>
    <!-- cabelo ralo e oleoso -->
    <g ${TR}><path d="M186 256 C174 170 200 122 256 102 C236 150 230 190 226 216 L198 232Z" fill="#2a1d18"/><path d="M414 256 C426 170 400 122 344 102 C364 150 370 190 374 216 L402 232Z" fill="#2a1d18"/>
    <path d="M290 100 l-10 -40 l26 30 M316 102 l18 -34 l4 38" fill="#2a1d18"/></g>
    <g fill="none" stroke="#2a1d18" stroke-width="7" stroke-linecap="round"><path d="M238 116 Q300 86 366 120"/><path d="M232 134 Q300 104 372 138"/><path d="M230 154 Q296 128 362 156"/><path d="M246 104 Q300 78 352 104"/></g>
    <path d="M214 150 q10 -24 26 -34 M388 154 q-8 -22 -22 -32" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35"/>
    <path class="r-sobr" d="M206 210 Q254 192 300 204 Q346 192 394 210" fill="none" ${TR} stroke-width="14"/>
    <!-- óculos -->
    <g class="r-oculos">
      <rect x="206" y="222" width="84" height="62" rx="14" fill="#e4f6ff"/><rect x="310" y="222" width="84" height="62" rx="14" fill="#e4f6ff"/>
      <path d="M214 276 L248 228 H270 L236 276Z M318 276 L352 228 H374 L340 276Z" fill="#8fe6ff" opacity=".8"/>
      <g class="r-pup" fill="${K}"><circle cx="252" cy="256" r="8"/><circle cx="356" cy="256" r="8"/></g>
      <g fill="${PELE_S}"><rect class="r-palp" x="210" y="226" width="76" height="54" rx="10"/><rect class="r-palp" x="314" y="226" width="76" height="54" rx="10"/></g>
      <g ${TR} stroke-width="10" fill="none"><rect x="206" y="222" width="84" height="62" rx="14"/><rect x="310" y="222" width="84" height="62" rx="14"/><path d="M290 248 H310 M206 246 L186 240 M394 246 L414 240"/></g>
      <rect x="288" y="236" width="24" height="24" rx="3" fill="#f6f1e2" ${TR} stroke-width="5" transform="rotate(-9 300 248)"/>
    </g>
    <path d="M214 296 q30 12 66 0 M320 296 q34 12 66 0" fill="none" stroke="#9a5f86" stroke-width="5" stroke-linecap="round" opacity=".8"/>
    <path d="M288 266 Q270 304 290 316 Q304 324 318 314 Q334 300 312 266" fill="#e8977a" ${TR} stroke-width="6"/><circle cx="292" cy="310" r="3" fill="${K}"/><circle cx="310" cy="310" r="3" fill="${K}"/>
    <g class="r-m r-m-tenso" opacity="${op('tenso')}"><path d="M250 336 Q300 326 350 336 Q348 366 300 368 Q252 366 250 336Z" fill="#4a1a22" ${TR} stroke-width="6"/>
      <g fill="#efe3a0" ${TR} stroke-width="4"><rect x="264" y="333" width="20" height="16" rx="3" transform="rotate(-7 274 341)"/><rect x="288" y="332" width="22" height="20" rx="3"/><rect x="322" y="334" width="16" height="13" rx="3" transform="rotate(9 330 340)"/><rect x="276" y="352" width="18" height="12" rx="3" transform="rotate(5 285 358)"/><rect x="304" y="353" width="18" height="12" rx="3"/></g></g>
    <g class="r-m r-m-o" opacity="${op('o')}"><ellipse cx="300" cy="350" rx="24" ry="28" fill="#4a1a22" ${TR} stroke-width="6"/><g fill="#efe3a0" ${TR} stroke-width="4"><rect x="282" y="324" width="16" height="14" rx="3" transform="rotate(-8 290 331)"/><rect x="304" y="324" width="15" height="12" rx="3" transform="rotate(7 311 330)"/></g><ellipse cx="300" cy="368" rx="12" ry="7" fill="#d9617a"/></g>
    <g class="r-m r-m-neutro" opacity="${op('neutro')}"><path d="M262 346 Q300 354 338 346" fill="none" ${TR}/></g>
    <g class="r-m r-m-triste" opacity="${op('triste')}"><path d="M258 358 Q300 334 342 358" fill="none" ${TR}/><path d="M290 366 q10 6 20 0" fill="none" ${TR} stroke-width="5"/></g>
    <g class="r-m r-m-sorriso" opacity="${op('sorriso')}"><path d="M248 330 Q300 380 352 330 Z" fill="#4a1a22" ${TR} stroke-width="6"/><g fill="#efe3a0" ${TR} stroke-width="4"><rect x="266" y="334" width="20" height="16" rx="3" transform="rotate(-6 276 342)"/><rect x="290" y="336" width="22" height="20" rx="3"/><rect x="322" y="334" width="16" height="13" rx="3" transform="rotate(8 330 340)"/></g></g>
    <path class="r-suor" d="M408 176 q-16 26 0 36 q16 -10 0 -36Z" fill="#8fdcff" ${TR} stroke-width="5" opacity="0"/>
  </g>
</g>
${fedor ? `<g class="r-fedor" fill="none" stroke="#a6d64a" stroke-width="9" stroke-linecap="round" opacity=".8"><path d="M96 380 q-22 -28 0 -56 q22 -28 0 -56"/><path d="M520 350 q22 -28 0 -56 q-22 -28 0 -56"/><path d="M470 150 q18 -22 0 -44 q-18 -22 0 -44"/></g>` : ''}
</svg>`;
}
