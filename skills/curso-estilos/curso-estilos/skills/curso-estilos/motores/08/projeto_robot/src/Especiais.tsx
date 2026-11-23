// Efeitos proprios de cena (tipo no mundo por homografia, avalanche, grade de 12, parafuso, geada...).
// Esqueleto: cada um ja anima no tempo certo; os 'todo' do cenas.json dizem o que falta de acabamento.
import React from 'react';
import {Img, staticFile} from 'remotion';
import quads from './data/quads.json';
import {Cena, DOCS, FAMILIA, Fundo, docSrc, temClipe, temMatte} from './lib/comp';
import {H, LA, Pt, W, clamp, easeInOut, easeOut, hash, lerp, mola, quadMatrix} from './lib/util';
import {Camadas, PLX} from './lib/camadas';

// v3: a capa REAL (scan da 1a edicao) por cima da capa que o H3 redesenhou ('ROSSIIM'S' e um logo inventado).
// Pre-composta por quadro em tools/capa_real.py (alinhada a capa do H3 por ORB+ECC, mesma luz da mesa, dedos do H3 por cima):
// public/capa_real/NNNN.png, no mesmo quadro do clipe que esta no fundo.
export const CapaReal: React.FC<{c: Cena; t: number}> = ({c, t}) => {
  const i = Math.min(123, Math.max(0, Math.round(((c.fonte.de || 0) + (t - c.t0) * (c.fonte.ritmo || 1)) * 24)));
  return <Img src={staticFile(`capa_real/${String(i).padStart(4, '0')}.png`)} style={{position: 'absolute', left: 0, top: 0, width: W, height: H}} />;
};

const Homog: React.FC<{w: number; h: number; q: Pt[]; children: React.ReactNode; style?: React.CSSProperties}> = ({w, h, q, children, style}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, transformOrigin: '0 0', transform: quadMatrix(w, h, q), ...style}}>
    {children}
  </div>
);
const luzJanela = (a = 1, b = 0.84): React.CSSProperties => ({position: 'absolute', inset: 0, mixBlendMode: 'multiply',
  background: `linear-gradient(90deg, rgba(255,255,255,${a}) 0%, rgba(${Math.round(255 * b)},${Math.round(255 * b)},${Math.round(255 * b + 6)},1) 100%)`});

// K2: capa nitida por cima do clipe (so quando houver clipe E matte das maos; a placa do still ja traz a capa)
const Capa: React.FC<{c: Cena}> = ({c}) => {
  if (!temClipe(c.fonte.clip) || !temMatte('Z03_maos')) return null;
  const q = quads.capa;
  const [nw, nh] = DOCS.cz1920_2;
  return (
    <div style={{position: 'absolute', left: q.x, top: q.y, width: q.w, height: (q.w * nh) / nw, transform: `rotate(${q.rot}deg)`}}>
      <Img src={staticFile('docs/capa_k2.jpg')} style={{width: '100%', height: '100%'}} />
    </div>
  );
};

// K3: LABORI riscado (traco de carvao da esquerda p/ direita em 0,15 s a partir de 5,47)
const Risco: React.FC<{t: number; op?: number}> = ({t, op = 1}) => {
  if (t < 5.47 || op <= 0) return null;
  const u = easeOut((t - 5.47) / 0.15);
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: op}}>
      <line x1={222} y1={356} x2={lerp(222, 770, u)} y2={lerp(356, 348, u)} stroke={LA} strokeWidth={13} strokeLinecap="round" opacity={0.92} />
    </svg>
  );
};

// K3: ROBOTI se pinta na tela nua (ROBOT 5,74-6,20; o I ate 70% da altura em 6,29, sob o pincel).
// v3 (critico 1): nao e mais fonte digital chapada: borda seca deslocada pela trama, falhas do pincel ao longo do traco
// (ruido esticado na direcao da escrita) e o I mais brilhante (molhado). Continua na tela durante o desfoque (cena 3).
const Roboti: React.FC<{t: number; k?: {t0: number; t1: number; t2: number}}> = ({t, k = {t0: 5.74, t1: 6.2, t2: 6.29}}) => {
  if (t < k.t0) return null;
  const r = quads.roboti;
  const capH = r.size * 0.72;
  const u1 = easeInOut((t - k.t0) / (k.t1 - k.t0));
  const u2 = clamp((t - k.t1) / (k.t2 - k.t1));
  const wR = r.largura_ate_T, wI = r.largura - r.largura_ate_T;
  const [bx, by] = r.base_esq;
  return (
    <Homog w={r.plano[0]} h={r.plano[1]} q={r.quad as Pt[]}>
      <svg width={r.plano[0]} height={r.plano[1]} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <clipPath id="robotiWrite">
            <rect x={-20} y={-capH - 30} width={(wR + 20) * u1} height={capH + 60} />
            <rect x={wR - 6} y={-capH - 30} width={wI + 30} height={(capH * 0.72 + 30) * u2} />
          </clipPath>
          <linearGradient id="robotiLuz" gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={r.plano[0]} y2={0}>
            <stop offset="0" stopColor="#2a2d31" />
            <stop offset="1" stopColor={LA} />
          </linearGradient>
          <filter id="tintaSeca" x="-5%" y="-40%" width="110%" height="180%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={2} seed={7} result="n1" />
            <feDisplacementMap in="SourceGraphic" in2="n1" scale={10} xChannelSelector="R" yChannelSelector="G" result="borda" />
            <feTurbulence type="fractalNoise" baseFrequency="0.004 0.075" numOctaves={3} seed={3} result="fio" />
            <feColorMatrix in="fio" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -0.08" result="fioA" />
            <feComposite in="borda" in2="fioA" operator="in" result="tinta" />
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={11} result="trama" />
            <feColorMatrix in="trama" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 -0.6 0 1.35" result="tramaA" />
            <feComposite in="tinta" in2="tramaA" operator="in" />
          </filter>
        </defs>
        <g transform={`translate(${bx} ${by}) rotate(${r.angulo})`} clipPath="url(#robotiWrite)">
          <g filter="url(#tintaSeca)">
            <text x={3} y={1.5} fontFamily={FAMILIA.cond} fontSize={r.size} fill="rgba(0,0,0,0.26)">ROBOTI</text>
            <text x={0} y={0} fontFamily={FAMILIA.cond} fontSize={r.size} fill="url(#robotiLuz)">ROBOTI</text>
          </g>
        </g>
      </svg>
    </Homog>
  );
};

// K4: Robott-Patent inteiro na homografia do papel gerado
const Patent: React.FC = () => {
  const q = quads.patent;
  return (
    <Homog w={q.size[0]} h={q.size[1]} q={q.quad as Pt[]}>
      <Img src={docSrc('patent1738')} style={{width: '100%', height: '100%'}} />
      <div style={luzJanela(1, 0.9)} />
    </Homog>
  );
};

// K8: pagina OSOBY na folha em branco das maos
const Osoby: React.FC<{c?: Cena; t?: number}> = ({c, t = 0}) => {
  const q = quads.osoby;
  const mk = c?.marca;
  const um = mk && t >= mk.t ? easeOut((t - mk.t) / mk.dur) : 0;
  return (
    <Homog w={q.size[0]} h={q.size[1]} q={q.quad as Pt[]}>
      <Img src={docSrc('cz1920_8')} style={{width: '100%', height: '100%'}} />
      {um > 0 && <div style={{position: 'absolute', left: 205, top: 2562, width: 865 * um, height: 104, borderRadius: 8,
        background: 'rgba(238,212,86,0.62)', mixBlendMode: 'multiply'}} />}
      <div style={luzJanela(1, 0.78)} />
    </Homog>
  );
};

// K-30: Briullov na tela nua do Z17 (quad preenchido em quads.json depois da escolha do still)
const Briullov: React.FC<{c?: Cena; t?: number}> = ({c, t = 0}) => {
  const q = quads.briullov as unknown as {size: number[]; quad: Pt[] | null};
  if (!q.quad) return null;
  return (
    <Homog w={q.size[0]} h={q.size[1]} q={q.quad}>
      {c?.plx && PLX.has('briullov_detalhe') ? <Camadas doc="briullov_detalhe" w={q.size[0]} h={q.size[1]} t={t} t0={c.t0} t1={c.t1} />
        : <Img src={docSrc('briullov_detalhe')} style={{width: '100%', height: '100%'}} />}
      <div style={luzJanela(1, 0.85)} />
    </Homog>
  );
};

// v3: tiras com os termos antigos chovem DENTRO da pegada do livro; o livro (a mesma capa real, na mesma posicao da capa
// da mesa) cai por cima e engole todas. Depois do pouso nenhuma tira existe: nada sobra para fora da borda (criticos 1 e 2).
const TERMOS = ['automaton', 'Automat', 'automate', 'automa', 'autómata', 'android', 'Androide', 'androïde'];
const Avalanche: React.FC<{c: Cena; t: number}> = ({c, t}) => {
  const av = c.avalanche || {t: 30.95, livro: 31.44};
  const q = (quads as unknown as {capa_h3: {cx: number; cy: number; w: number; rot: number}}).capa_h3;
  const [cw, ch] = DOCS.cz1920_2;
  const bw = q.w, bh = (bw * ch) / cw;
  const cx = q.cx, cy = q.cy;
  const qy = cy - bh / 2;
  const mL = mola(t - av.livro, 26, 0.75);
  const pousou = t >= av.livro && mL > 0.93;
  const tremor = t >= av.livro + 0.1 && t < av.livro + 0.1 + 3 / 24 ? (hash(Math.floor(t * 24)) - 0.5) * 10 : 0;
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translate(${tremor}px, ${tremor * 0.4}px)`}}>
      {!pousou && TERMOS.map((w, i) => {
        const t0 = av.t + i * 0.045;
        if (t < t0) return null;
        const m = mola(t - t0, 18, 0.62);
        const s = 52 + Math.round(hash(i + 1) * 18);
        const x = cx - 10 + (hash(i + 3) - 0.5) * 60;
        const y = lerp(-240, qy + 150 + (i / (TERMOS.length - 1)) * (bh - 300) + (hash(i + 11) - 0.5) * 50, m);
        const rot = lerp(hash(i + 7) * 60 - 30, hash(i + 5) * 14 - 7, m);
        const wTira = Math.min(bw - 60, s * (w.length * 0.62) + 70);
        return (
          <div key={w} style={{position: 'absolute', left: x - wTira / 2, top: y - s * 0.8, width: wTira, height: s * 1.6, background: '#ECEDEA',
            transform: `rotate(${rot}deg)`, boxShadow: '10px 12px 3px rgba(10,12,14,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{fontFamily: FAMILIA.info, fontSize: s, color: LA, whiteSpace: 'nowrap'}}>{w}</span>
          </div>
        );
      })}
      {t >= av.livro && (() => {
        const sombra = pousou ? lerp(1, 0, easeOut((t - av.livro - 0.15) / 0.35)) : 1;
        return (
          <div style={{position: 'absolute', left: cx - bw / 2, top: cy - bh / 2, width: bw, height: bh,
            transform: `scale(${lerp(1.32, 1, mL)}) rotate(${lerp(-6, q.rot, mL)}deg)`,
            boxShadow: `${22 * sombra}px ${26 * sombra}px 4px rgba(10,12,14,${0.45 * sombra})`}}>
            <Img src={docSrc('capa_k2')} style={{width: '100%', height: '100%'}} />
            <div style={luzJanela(1, 0.93)} />
          </div>
        );
      })()}
    </div>
  );
};

// v3: o parafuso real cai na mesa de madeira do braco de carne (critico 1: gesto de materia, sem tarja de papel),
// quica 2x e para deitado AO LADO do texto (critico 2), com sombra dura para a direita.
const Parafuso: React.FC<{c: Cena; t: number}> = ({c, t}) => {
  const pf = c.parafuso;
  if (!pf || t < pf.t) return null;
  const [nw, nh] = DOCS.parafuso;
  const w = pf.w, h = (w * nh) / nw;
  const dt = t - pf.t;
  const queda = 0.16;
  let y = lerp(pf.y - 1500, pf.y, clamp(dt / queda) ** 2);
  let rot = lerp(-70, -8, clamp(dt / queda));
  if (dt > queda) {
    const k = dt - queda;
    y = pf.y - Math.abs(Math.sin(k * 15)) * 70 * Math.exp(-k * 7);
    rot = -8 + Math.sin(k * 15) * 9 * Math.exp(-k * 6);
  }
  const x = pf.x + (dt > queda ? 30 * (1 - Math.exp(-(dt - queda) * 4)) : 0);
  return (
    <Img src={docSrc('parafuso')} style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h,
      transform: `rotate(${rot}deg)`, filter: 'drop-shadow(9px 11px 2px rgba(10,12,14,0.5))'}} />
  );
};

// cena 4: assinatura real escrita da esquerda p/ direita em 0,5 s (mascara de traco = todo)
const Assinatura: React.FC<{t: number}> = ({t}) => {
  if (t < 4.24) return null;
  const u = easeInOut((t - 4.24) / 0.5);
  return (
    <Img src={docSrc('assin_karel')} style={{position: 'absolute', left: 560, top: 1160, width: 290, mixBlendMode: 'multiply',
      clipPath: `inset(0 ${Math.round((1 - u) * 100)}% 0 0)`}} />
  );
};

// cena 22: geada cresce das bordas para o centro (por baixo, o vidro limpo = o mesmo still desfocado)
const Geada: React.FC<{c: Cena; t: number}> = ({c, t}) => {
  const u = easeOut((t - c.t0) / (c.t1 - c.t0));
  const r = lerp(70, 34, u);
  const mask = `radial-gradient(ellipse 60% 50% at 50% 48%, transparent ${r}%, black ${r + 18}%)`;
  return <Fundo f={{...c.fonte}} t0={c.t0} t={t} mask={mask} />;
};

export const Especial: React.FC<{nome: string; c: Cena; t: number}> = ({nome, c, t}) => {
  switch (nome) {
    case 'capa': return <Capa c={c} />;
    case 'laborir': return <Risco t={t} op={c.rack ? clamp((c.rack.t + 0.3 - t) / 0.3) : 1} />;   // some com o LABORI no desfoque
    case 'roboti': return <Roboti t={t} k={c.roboti} />;
    case 'patent': return <Patent />;
    case 'osoby': return <Osoby c={c} t={t} />;
    case 'briullov': return <Briullov c={c} t={t} />;
    case 'avalanche': return <Avalanche c={c} t={t} />;
    case 'parafuso': return <Parafuso c={c} t={t} />;
    case 'assinatura': return <Assinatura t={t} />;
    default: return null;   // geada e capa_real sao montadas pelo Plano
  }
};
export {Geada};
