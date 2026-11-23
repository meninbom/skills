// Pele "kurz": o mesmo episódio em vetor sem contorno (família Kurzgesagt).
// Roda depois que todas as cenas foram montadas. Não mexe em tempo nem em animação, só em traço, cor e brilho.
function aplicarKurz() {
  const K = /^#17112b$/i, LINHA = '#1b0f4a', FORMAS = ['path', 'rect', 'ellipse', 'circle', 'polygon', 'polyline', 'line'];
  document.getElementById('root').classList.add('kurz');
  document.querySelectorAll('#stage svg *').forEach(e => {
    const tag = e.tagName.toLowerCase(); if (!FORMAS.includes(tag) || e.closest('defs') || e.closest('mask') || e.closest('clipPath')) return;
    const flProprio = e.getAttribute('fill'), fl = flProprio ?? e.closest('[fill]')?.getAttribute('fill');
    const stProprio = e.getAttribute('stroke'), stHerdado = e.parentElement?.closest('[stroke]')?.getAttribute('stroke');
    const st = stProprio ?? (stHerdado && !K.test(stHerdado) ? stHerdado : null), sw = parseFloat(e.getAttribute('stroke-width') || '0');
    const herdaCor = !stProprio && stHerdado && !K.test(stHerdado);   // linha colorida pelo grupo (fedor, cabelo): não mexer
    if (fl && fl !== 'none') {                                   // forma cheia: perde o contorno
      if (!stProprio || K.test(stProprio)) e.setAttribute('stroke', 'none');
      if (flProprio && K.test(flProprio)) e.setAttribute('fill', LINHA);
    } else if (herdaCor) return;
    else if (!stProprio && sw >= 40) e.remove();                // miolo escuro que fazia o contorno dos braços
    else if (!stProprio || K.test(stProprio)) e.setAttribute('stroke', LINHA); // linha de verdade (boca, sobrancelha, armação, grade)
  });
  document.querySelectorAll('#stage svg g[fill="#17112b"]').forEach(g => g.setAttribute('fill', LINHA));
  // brilho de fundo: um círculo de luz atrás do personagem em cada mundo com câmera
  document.querySelectorAll('#stage > .mundo').forEach(m => { const c = m.querySelector(':scope > .cam'); if (!c) return;
    const d = document.createElement('div'); d.className = 'kz-luz'; c.appendChild(d); });
}
