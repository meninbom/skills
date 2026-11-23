// Episódio 7 — montagem: junta os atos, calcula os tempos pela voz e desenha a legenda.
import { B, M, cl } from './comum.js';
import { ATO1 } from './ato1.js';
const mods = await Promise.all(['./ato2.js', './ato3.js', './ato4.js'].map(f => import(f).catch(e => { console.log('sem ' + f + ': ' + e.message); return {}; })));
const PL = [...ATO1, ...(mods[0].ATO2 || []), ...(mods[1].ATO3 || []), ...(mods[2].ATO4 || [])];
const VOZ = await fetch('vozes.json').then(r => r.ok ? r.json() : {}).catch(() => ({}));       // id -> { dur } (medido da voz real)
const TAXA = { NAR: 3.2, NICO: 3.1, IARA: 3.1, GEN: 2.1 }, COR = { GEN: '#62ccff' };
const durFala = f => VOZ[f.id]?.dur ?? (f.txt.split(/\s+/).length / TAXA[f.q] + 0.15 + (f.pausa || 0));
const CAPS = []; let T = 0;
for (const p of PL) {
  const fs = p.fala ? (Array.isArray(p.fala) ? p.fala : [p.fala]) : []; let fim = 0, at = 0.08; p.F = [];
  fs.forEach((f, i) => { f.id = f.id || p.id + (fs.length > 1 ? '_' + (i + 1) : ''); at = f.at ?? at; const d = durFala(f); p.F.push({ t0: T + at, u0: at, d, q: f.q });
    const chars = f.telas.map(x => x.replace(/[*]/g, '').length + 2), tot = chars.reduce((a, b) => a + b, 0); let a = T + at;
    f.telas.forEach((tx, j) => { const dd = d * chars[j] / tot; CAPS.push([a, a + dd - 2 / 60, tx, f.y === 'topo' ? 320 : (f.y ?? 1420), COR[f.q]]); a += dd; });
    fim = Math.max(fim, at + d); at = at + d + (f.depois ?? 0.18); });
  p.D = Math.max(p.dur || 0, fim + (p.pos ?? 0.22)); p.t0 = T; T += p.D;
}
const END = T;
console.log('PLANOS ' + PL.map(p => `${p.id}@${p.t0.toFixed(2)}(${p.D.toFixed(2)})`).join(' ') + ' FIM ' + END.toFixed(2));
const cv = document.getElementById('c'); M.inicia(cv);
const FALAM = PL.flatMap(p => (p.fala ? (Array.isArray(p.fala) ? p.fala : [p.fala]) : []).map((f, i) => ({ q: f.q, txt: f.txt, t0: p.F[i].t0, d: p.F[i].d }))).filter(f => f.q === 'NICO' || f.q === 'IARA');
function frame(t) { t = cl(t, 0, END - 1e-4); B.RELOGIO.t = t; for (const k in B.FALA) delete B.FALA[k]; for (const f of FALAM) { const b = B.bocaDaFala(f.txt, f.t0, f.d, t); if (b) B.FALA[f.q.toLowerCase()] = b; } B.setAmb([0.88, 0.92, 1.0], [0, 3, 8]); B.setLuz({ cor: '#a9d2f2', w: 2.6 }); const p = PL.findLast(p => t >= p.t0); p.fn(t, t - p.t0, p); if (!p.semLegenda) M.legenda(t, CAPS); }
await document.fonts.load('700 84px RC');
window.END = END; window.PLANOS = PL.map(p => ({ id: p.id, t0: p.t0, D: p.D })); window.FALAS = PL.flatMap(p => (p.fala ? (Array.isArray(p.fala) ? p.fala : [p.fala]) : []).map((f, i) => ({ id: f.id, q: f.q, txt: f.txt, t0: p.F[i].t0, d: p.F[i].d })));
window.seek = async t => frame(t); frame(0); window.READY = true;
