// Cenários do EP01 no visual aprovado na prova: traço grosso, luz com direção, profundidade em camadas.
const SK = 'stroke="#17112b" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"';
const V = h => `<svg viewBox="0 0 1080 1920">${h}</svg>`;
const listras = () => { let s = ''; for (let x = -880; x < 2000; x += 46) s += `<path d="M${x} -900 V1180"/>`; return s; };
const tabuas = () => { let s = ''; for (let i = -14; i <= 14; i++) s += `<path d="M${540 + i * 78} 1188 L${540 + i * 250} 2880"/>`; return s; };
const trouxa = (x, y, w, c, i = 0) => `<path d="M${x} ${y} q${w * .3} -${50 + (i % 3) * 14} ${w * .72} -14 q${w * .3} 18 ${w * .22} 60 q-${w * .5} 34 -${w * .92} 8 q-${w * .12} -26 -${w * .02} -54Z" fill="${c}" ${SK}/><path d="M${x + w * .16} ${y + 2} q${w * .2} -20 ${w * .42} -6" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35"/>`;
const CORES = ['#ff7eb6', '#55c8ff', '#ffd23f', '#7be35a', '#ff8a1f', '#b79bff', '#e0564f', '#efe8da', '#19b5a5', '#ffd23f', '#55c8ff', '#ff7eb6'];

/* ---------- QUARTO A: acréscimos (prato embaixo da cama, cadeira-guarda-roupa) ---------- */
function quartoA() {
  let monte = ''; for (let i = 0; i < 6; i++) monte += trouxa(20 + (i * 31) % 40, 1360 - i * 44, 210 - i * 8, CORES[i + 2], i);
  const extra = `
  <g id="qa-eco"><ellipse cx="262" cy="1196" rx="44" ry="9" fill="#efe8da" stroke="#17112b" stroke-width="3"/><path d="M226 1194 q10 -14 24 -8 q10 -12 24 -4 q14 -8 22 10 q-36 10 -70 2Z" fill="#6fcf52" stroke="#17112b" stroke-width="3"/>
    <g id="qa-c1"><rect x="244" y="1174" width="5" height="14" fill="#fff6e6" stroke="#17112b" stroke-width="2"/><path d="M236 1176 q10 -16 21 0Z" fill="#ff4d4d" stroke="#17112b" stroke-width="2.5"/><circle cx="244" cy="1171" r="1.6" fill="#fff" stroke="none"/><circle cx="250" cy="1173" r="1.2" fill="#fff" stroke="none"/></g>
    <g id="qa-c2"><rect x="268" y="1178" width="4" height="10" fill="#fff6e6" stroke="#17112b" stroke-width="2"/><path d="M262 1180 q8 -12 16 0Z" fill="#ffd23f" stroke="#17112b" stroke-width="2.5"/></g>
    <g id="qa-band"><path d="M288 1190 V1166" stroke-width="2.5"/><path d="M288 1166 l12 4 l-12 5Z" fill="#55c8ff" stroke-width="2"/></g>
    <g id="qa-lesma" stroke-width="2.5"><circle cx="230" cy="1186" r="5" fill="#c98b4f"/><path d="M234 1189 q6 -2 8 3 M239 1187 l3 -5 M241 1189 l5 -3" fill="none" stroke-width="2"/></g></g>
  <g id="qa-cadeira"><rect x="34" y="1390" width="22" height="180" fill="#8a5a3c"/><rect x="204" y="1390" width="22" height="180" fill="#8a5a3c"/><rect x="24" y="1372" width="212" height="30" rx="6" fill="#a8703f"/><rect x="34" y="1150" width="20" height="230" fill="#8a5a3c"/><rect x="206" y="1150" width="20" height="230" fill="#8a5a3c"/>${monte}
    <g transform="rotate(-5 130 1268)"><rect x="70" y="1244" width="124" height="46" fill="#f6efd8" stroke-width="4"/><text x="132" y="1276" text-anchor="middle" font-family="Bricolage" font-weight="800" font-size="24" fill="#17112b" stroke="none">cadeira</text><path id="qa-risco" d="M76 1268 L190 1262" stroke="#ff3f8f" stroke-width="6" stroke-dasharray="120" stroke-dashoffset="120"/></g>
    <g id="qa-gr" transform="rotate(4 134 1322)"><rect x="52" y="1300" width="166" height="46" fill="#ffd23f" stroke-width="4"/><text x="135" y="1332" text-anchor="middle" font-family="Bricolage" font-weight="800" font-size="24" fill="#17112b" stroke="none">guarda-roupa</text></g></g>`;
  return { c0: QA.c0, c1: QA.c1.replace(/<\/g><\/svg>\s*$/, extra + '</g></svg>'), c3: QA.c3 };
}

/* ---------- QUARTO B: parede do espelho e do guarda-roupa ---------- */
function quartoB() {
  let pilha = ''; for (let i = 0; i < 12; i++) pilha += trouxa(570 + (i * 47) % 70, 1230 - i * 70, 300 - (i % 4) * 16, CORES[i], i);
  const c0 = V(`<defs><radialGradient id="gAbj" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".6"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>
    <linearGradient id="gEsp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cfefff"/><stop offset="1" stop-color="#6fa8dc"/></linearGradient></defs>
  <rect x="-900" y="-900" width="2900" height="2090" fill="url(#gPar)"/><g opacity=".07" stroke="#fff" stroke-width="3">${listras()}</g>
  <rect x="-900" y="252" width="2900" height="10" fill="#ff7fc6"/><rect x="-900" y="262" width="2900" height="430" fill="url(#gLed)"/>
  <circle cx="540" cy="470" r="560" fill="url(#gAbj)"/>
  <g ${SK}><path d="M500 300 V360" /><path d="M450 360 H550 L580 440 H420Z" fill="#ffd9a0"/>
    <rect x="930" y="350" width="150" height="210" fill="#1f1650"/><circle cx="1005" cy="440" r="44" fill="#39d98a"/><path d="M985 440 l14 16 l28 -34" fill="none" stroke="#17112b"/>
    <!-- guarda-roupa -->
    <rect x="86" y="398" width="150" height="76" fill="#c98b4f"/><text x="161" y="446" text-anchor="middle" font-family="Bricolage" font-weight="800" font-size="24" fill="#17112b" stroke="none">2019</text><rect x="250" y="420" width="170" height="54" fill="#d99a5a"/>
    <rect x="56" y="470" width="430" height="730" rx="10" fill="#5a3d28"/><rect x="440" y="486" width="34" height="700" fill="#150d2a"/>
    <rect x="72" y="488" width="186" height="696" fill="#6b4a2d"/><path d="M266 488 L438 506 L438 1166 L266 1184Z" fill="#7a5636"/><circle cx="240" cy="840" r="10" fill="#ffd23f"/><circle cx="286" cy="840" r="10" fill="#ffd23f"/>
    <path d="M72 660 H258 M72 1010 H258" stroke-width="5" opacity=".5"/>
    <path d="M440 900 q40 60 20 150 q-10 70 30 140 l-56 0Z" fill="#ff7eb6"/><path d="M440 700 q30 20 26 80" fill="none" stroke="#55c8ff" stroke-width="18"/>
    <path d="M120 540 l10 12 l-12 6Z" fill="#ff3f8f" stroke-width="4"/>
    <!-- espelho -->
    <rect x="590" y="420" width="320" height="812" rx="42" fill="#d9a441"/><rect x="618" y="448" width="264" height="756" rx="24" fill="url(#gEsp)"/>
    <path d="M610 1232 l-20 40 M890 1232 l20 40" />
  </g>
  <rect x="-900" y="1180" width="2900" height="1700" fill="url(#gChao)"/><rect x="-900" y="1166" width="2900" height="22" fill="#170f38"/>
  <g stroke="#170f38" stroke-width="5" opacity=".8">${tabuas()}</g>
  <ellipse cx="700" cy="1540" rx="460" ry="140" fill="#3a2a78" stroke="#17112b" stroke-width="8"/>
  <ellipse cx="300" cy="1400" rx="460" ry="220" fill="#ffcf7a" opacity=".1"/>`);
  const c1 = `<div style="position:absolute;left:618px;top:448px;width:264px;height:756px;overflow:hidden;border-radius:24px"><div id="reflexo" style="position:absolute;left:-28px;top:230px;width:320px;transform:scaleX(-1);opacity:.9">${regisV2({ u: 'r', celular: false, expr: 'triste', fedor: false })}</div>
    <svg viewBox="0 0 264 756" style="position:absolute;inset:0;width:100%;height:100%"><rect width="264" height="756" fill="#7fb8e6" opacity=".22"/><path d="M20 130 L130 20 M30 230 L220 40" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity=".55"/></svg></div>
  <svg viewBox="0 0 1080 1920" id="pilha">${pilha}<path d="M640 560 q40 -30 80 0" fill="none" stroke="#17112b" stroke-width="5"/></svg>
  ${V(`<g ${SK}><path d="M920 1190 H1100 L1080 1360 H940Z" fill="#c98b4f"/><path d="M930 1230 H1090 M934 1280 H1086 M980 1190 L990 1360 M1040 1190 L1036 1360" stroke-width="4" opacity=".6"/>${trouxa(900, 1180, 200, '#b79bff', 1)}${trouxa(940, 1130, 150, '#ffd23f', 2)}
    ${trouxa(330, 1420, 170, '#55c8ff', 0)}<path d="M150 1560 q40 -30 90 0 q16 20 -10 30 q-60 8 -84 -6Z" fill="#f2efe4"/><path d="M168 1558 v28 M186 1552 v36" fill="none" stroke="#e0483f" stroke-width="5"/>
    <path d="M820 1640 l60 -80 l60 80 M880 1560 v-30" fill="none"/></g>`)}`;
  const c3 = `<svg viewBox="0 0 1080 1920" style="filter:blur(6px)"><path d="M-220 1920 V1500 q120 -80 240 -20 q90 60 110 190 q10 130 0 250Z" fill="#0b0720"/><path d="M-40 1490 q100 -30 170 30 q60 60 70 140" fill="none" stroke="#ffb86b" stroke-width="12" opacity=".5" stroke-linecap="round"/><path d="M1300 1920 V1600 q-90 -50 -190 20 q-50 60 -50 300Z" fill="#0b0720"/></svg>`;
  return { c0, c1, c3 };
}

/* ---------- BANHEIRO ---------- */
function banheiro() {
  let az = ''; for (let x = -840; x <= 1960; x += 120) az += `<path d="M${x} -900 V1300"/>`; for (let y = -60; y <= 1300; y += 120) az += `<path d="M-900 ${y} H2000"/>`;
  let piso = ''; for (let i = -12; i <= 12; i++) piso += `<path d="M${540 + i * 110} 1300 L${540 + i * 300} 2880"/>`; for (let k = 0; k < 6; k++) piso += `<path d="M-900 ${1380 + k * k * 22 + k * 60} H2000"/>`;
  let cerdas = ''; for (let i = 0; i < 9; i++) cerdas += `<path class="cerda" data-i="${i}" d="M${323 + i * 4} 732 V696" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>`;
  let cerdasK = ''; for (let i = 0; i < 9; i++) cerdasK += `<path class="cerda" data-i="${i}" d="M${323 + i * 4} 732 V696" stroke="#17112b" stroke-width="6.5" stroke-linecap="round"/>`;
  const c0 = V(`<defs><linearGradient id="gBan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#78c7b4"/><stop offset="1" stop-color="#2f7a78"/></linearGradient>
    <radialGradient id="gLamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6c8" stop-opacity=".75"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient></defs>
  <rect x="-900" y="-900" width="2900" height="2200" fill="url(#gBan)"/><g stroke="#256862" stroke-width="5" opacity=".55">${az}</g>
  <circle cx="460" cy="300" r="760" fill="url(#gLamp)"/>
  <g fill="#1f5a3c" opacity=".55"><circle cx="30" cy="330" r="60"/><circle cx="90" cy="300" r="34"/><circle cx="1040" cy="1240" r="70"/><circle cx="980" cy="1270" r="36"/><circle cx="560" cy="1270" r="30"/><circle cx="20" cy="1250" r="50"/></g>
  <g ${SK}>
    <!-- armário com espelho e pia -->
    <rect x="80" y="400" width="350" height="340" rx="14" fill="#e9f1f0"/><rect x="104" y="424" width="302" height="292" rx="6" fill="#bfe9ff"/><path d="M130 690 L250 440 M170 700 L330 450" stroke="#fff" stroke-width="10" opacity=".6"/>
    <g fill="#fff" stroke="none"><circle cx="330" cy="620" r="7"/><circle cx="352" cy="650" r="5"/><circle cx="300" cy="664" r="4"/><circle cx="366" cy="600" r="4"/></g>
    <path d="M360 440 l-30 50 l24 20 l-20 44" fill="none" stroke-width="4"/>
    <rect x="212" y="1000" width="90" height="330" fill="#dfe9e8"/><path d="M50 930 H450 Q450 1010 380 1012 H120 Q50 1010 50 930Z" fill="#f4f8f7"/><path d="M60 944 H440" stroke="#bfd3d0" stroke-width="6"/>
    <path d="M236 930 V880 Q236 850 266 850 H286" fill="none" stroke-width="20"/><path d="M236 930 V880 Q236 850 266 850 H286" fill="none" stroke="#d9d9e6" stroke-width="10"/>
    <!-- copo e escova -->
    <path d="M306 846 H372 L364 930 H314Z" fill="#ff7eb6"/><path d="M312 870 H366" stroke="#fff" stroke-width="5" opacity=".6"/>
    <g id="escova">${cerdasK}${cerdas}<rect x="318" y="730" width="42" height="18" rx="7" fill="#19b5a5" stroke-width="5"/><rect x="332" y="746" width="14" height="110" rx="5" fill="#19b5a5" stroke-width="5"/></g>
    <path d="M110 912 q40 -26 100 -8 l6 22 q-60 -12 -104 8Z" fill="#fff" stroke-width="5"/><path d="M110 912 q-20 -6 -22 -22 q14 -8 26 4" fill="#55c8ff" stroke-width="5"/><rect x="204" y="902" width="14" height="22" fill="#e0483f" stroke-width="4"/>
    <ellipse cx="410" cy="922" rx="30" ry="12" fill="#f6e7a8" stroke-width="5"/><path d="M396 918 q8 -10 16 0 M410 924 q10 -6 14 4" fill="none" stroke-width="2.5"/>
    <!-- toalha dura -->
    <circle cx="500" cy="770" r="12" fill="#d9d9e6"/><path d="M468 780 H536 L544 1120 L460 1130Z" fill="#b98a5c"/><path d="M480 860 q20 30 0 70 M520 940 q-16 40 4 90" fill="none" stroke="#7a5a3c" stroke-width="6"/>
    <!-- prateleira do box -->
    <rect x="590" y="760" width="250" height="22" rx="6" fill="#d9d9e6"/><path d="M610 782 l-10 30 M820 782 l10 30" />
    <g id="xampu" ><rect x="622" y="610" width="74" height="150" rx="18" fill="#fff" fill-opacity=".5"/><rect x="644" y="580" width="30" height="32" rx="6" fill="#7a5cff"/><rect x="628" y="742" width="62" height="12" rx="6" fill="#b79bff" stroke="none"/><rect x="634" y="652" width="50" height="56" rx="6" fill="#7a5cff" stroke-width="4"/>
      <path d="M696 620 L760 560 M700 660 L770 590 M724 596 q10 20 28 22" fill="none" stroke="#fff" stroke-width="2.5" opacity=".8"/></g>
    <g id="deterg"><rect x="748" y="576" width="24" height="30" rx="5" fill="#ff4d4d" stroke-width="5"/><path d="M736 606 H784 Q800 616 800 646 V748 Q800 760 788 760 H732 Q720 760 720 748 V646 Q720 616 736 606Z" fill="#e8f25a" fill-opacity=".95" stroke-width="6"/><rect x="728" y="660" width="64" height="70" rx="6" fill="#fff" stroke-width="4"/>
      <text x="760" y="680" text-anchor="middle" font-family="Bricolage" font-weight="800" font-size="8.4" fill="#17112b" stroke="none">DETERGENTE</text><circle cx="760" cy="700" r="12" fill="#8a5a3c" stroke-width="3"/><circle cx="760" cy="700" r="7" fill="#fff6e6" stroke="none"/><text x="760" y="726" text-anchor="middle" font-family="Bricolage" font-weight="800" font-size="12" fill="#e0483f" stroke="none">COCO</text></g>
    <!-- chuveiro e cortina -->
    <path d="M1080 340 H930 Q880 340 880 390" fill="none" stroke-width="22"/><path d="M1080 340 H930 Q880 340 880 390" fill="none" stroke="#d9d9e6" stroke-width="10"/><path d="M836 390 H924 L946 440 H814Z" fill="#d9d9e6"/>
    <g id="gotas" stroke="#bfe9ff" stroke-width="7" opacity=".9"><path d="M836 470 l-8 50 M870 474 v56 M906 470 l8 50 M850 560 l-6 44 M892 560 l6 44"/></g>
    <path d="M540 312 H1100" stroke-width="12"/>
  </g>
  <rect x="-900" y="1300" width="2900" height="1700" fill="#1f3f47"/><rect x="-900" y="1288" width="2900" height="20" fill="#143038"/><g stroke="#143038" stroke-width="5" opacity=".8">${piso}</g>
  <ellipse cx="300" cy="1500" rx="330" ry="110" fill="#ff7eb6" stroke="#17112b" stroke-width="8"/><ellipse cx="300" cy="1500" rx="250" ry="76" fill="none" stroke="#fff" stroke-width="8" stroke-dasharray="20 18" opacity=".6"/>`);
  const frente = V(`<g ${SK}><rect x="470" y="1200" width="700" height="420" rx="26" fill="#eef4f3"/><path d="M470 1232 H1170" stroke="#fff" stroke-width="14"/><path d="M540 1300 q10 60 0 110 M700 1280 q-8 50 6 90 M930 1290 q10 70 -4 120" fill="none" stroke="#9fb9b6" stroke-width="6"/>
    <path d="M940 318 Q980 520 950 760 Q930 980 970 1240 L1100 1240 L1100 318Z" fill="#dbe8b4"/><path d="M990 330 q30 220 0 460 q-20 200 20 440" fill="none" stroke="#9fb07a" stroke-width="6"/>
    <g fill="#5a8a3c" stroke="none" opacity=".7"><circle cx="1000" cy="1100" r="20"/><circle cx="1040" cy="1150" r="14"/><circle cx="980" cy="1180" r="10"/><circle cx="1050" cy="900" r="12"/></g>
    <g fill="#d9d9e6" stroke-width="5"><circle cx="950" cy="318" r="12"/><circle cx="1010" cy="318" r="12"/><circle cx="1066" cy="318" r="12"/></g></g>`);
  const c3 = `<svg viewBox="0 0 1080 1920" style="filter:blur(6px)"><path d="M-240 1920 V300 H-60 q40 500 20 1000 q-10 300 30 620Z" fill="#0c1f24"/><path d="M-40 400 q40 500 20 900" fill="none" stroke="#fff6c8" stroke-width="10" opacity=".4"/></svg>`;
  return { c0, frente, c3 };
}

/* ---------- CORREDOR ---------- */
function corredor() {
  const c0 = V(`<defs><linearGradient id="gCor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4d9a8"/><stop offset="1" stop-color="#c99a64"/></linearGradient>
    <linearGradient id="gPorta" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#17112b" stop-opacity=".0"/><stop offset="1" stop-color="#17112b" stop-opacity=".35"/></linearGradient></defs>
  <rect x="-900" y="-900" width="2900" height="2420" fill="url(#gCor)"/><circle cx="330" cy="260" r="700" fill="url(#gLamp)"/>
  <rect x="-900" y="1120" width="2900" height="400" fill="#a87647"/><g stroke="#8a5d36" stroke-width="6">${(() => { let s = ''; for (let x = -860; x < 2000; x += 150) s += `<path d="M${x} 1120 V1500"/>`; return s; })()}</g><rect x="-900" y="1104" width="2900" height="24" fill="#8a5d36"/>
  <g ${SK}>
    <rect x="70" y="420" width="190" height="230" fill="#fff6e6"/><rect x="90" y="440" width="150" height="150" fill="#9fd8ff"/><circle cx="140" cy="520" r="30" fill="#ef6f9a"/><circle cx="196" cy="540" r="20" fill="#eeb08a"/><text x="165" y="632" text-anchor="middle" font-family="Bricolage" font-weight="700" font-size="22" fill="#17112b" stroke="none">2009</text>
    <rect x="300" y="470" width="130" height="150" fill="#fff6e6"/><path d="M320 590 l30 -60 l26 34 l20 -24 l14 50Z" fill="#7be35a" stroke-width="5"/>
    <path d="M330 -40 V150" /><path d="M260 150 H400 L440 250 H220Z" fill="#fff6c8"/>
    <!-- porta -->
    <rect x="536" y="392" width="460" height="1120" rx="10" fill="#5a3a22"/><rect x="556" y="412" width="420" height="1100" rx="8" fill="#8a5a3c"/>
    <rect x="596" y="470" width="340" height="420" rx="10" fill="#9c6a48"/><rect x="596" y="950" width="340" height="490" rx="10" fill="#9c6a48"/><circle cx="600" cy="930" r="24" fill="#ffd23f"/>
    <rect x="556" y="412" width="420" height="1100" fill="url(#gPorta)" stroke="none"/>
    <g transform="rotate(-5 766 650)"><rect x="636" y="560" width="260" height="176" fill="#fff"/><rect x="740" y="546" width="52" height="26" fill="#ffd23f" stroke="none" opacity=".9"/><text x="766" y="634" text-anchor="middle" font-family="Bricolage" font-weight="800" font-size="46" fill="#17112b" stroke="none">RÉGIS</text><text x="766" y="692" text-anchor="middle" font-family="Bricolage" font-weight="800" font-size="34" fill="#ff3f8f" stroke="none">NÃO ENTRE</text></g>
    <path d="M700 1040 q20 -20 40 0 q20 20 40 0" fill="none" stroke="#ffd23f" stroke-width="6" opacity=".6"/>
  </g>
  <rect x="-900" y="1500" width="2900" height="1500" fill="#7a5230"/><rect x="-900" y="1486" width="2900" height="22" fill="#5a3a22"/>
  <g stroke="#5a3a22" stroke-width="5" opacity=".7">${tabuas().replace(/1188/g, '1500')}</g>
  <path d="M560 1508 H980 L1100 1920 H480Z" fill="#8fcf3c" opacity=".16"/>
  <ellipse cx="330" cy="1650" rx="420" ry="130" fill="#fff6c8" opacity=".14"/>`);
  const gas = V(`<g class="gas" fill="none" stroke="#8fcf3c" stroke-width="18" stroke-linecap="round"><path d="M590 1506 q-50 -50 -10 -110 q40 -50 -10 -110"/><path d="M730 1506 q40 -60 0 -120 q-40 -50 10 -120"/><path d="M900 1506 q50 -40 20 -100 q-30 -50 20 -110"/><path d="M520 1512 q-70 -20 -90 -90"/><path d="M820 1508 q30 -30 10 -70"/></g>
    <g ${SK}><rect x="60" y="1420" width="230" height="90" rx="10" fill="#6b4a2d"/><path d="M90 1420 q10 -30 50 -26 q30 6 30 26Z" fill="#e0483f"/><path d="M190 1420 q10 -26 46 -22 q26 6 26 22Z" fill="#3f6de0"/></g>`);
  const c3 = `<svg viewBox="0 0 1080 1920" style="filter:blur(6px)"><path d="M1320 1920 V200 H1130 q-40 600 -10 1100 q10 300 -30 620Z" fill="#2a180c"/><path d="M-200 1920 V1700 q160 -60 300 20 q60 80 40 200Z" fill="#2a180c"/></svg>`;
  return { c0, gas, c3 };
}
