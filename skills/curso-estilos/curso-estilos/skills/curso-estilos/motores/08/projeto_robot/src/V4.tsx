// v4 (21/10): pecas novas pedidas nas notas do diretor (v4_aprovacao/SPEC_robot.md).
// Tratamento dos planos H3 (item 2), parafuso na mesa vazia (4), folha de calendario (6/8), ROBOTS da capa que engole
// as palavras (9), camadas de photo parallax (14). Nada de squash/pulso/tremida/rebote (regra da casa, 21/10).
import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Cena, DOCS, FAMILIA, Fundo, docSrc} from './lib/comp';
import {H, LA, W, clamp, easeInOut, easeOut, lerp} from './lib/util';

export type V4Props = {fecho: 'a' | 'b' | 'c'; rab: 'b' | 'c'; elenco: 'b' | 'c'; amador: 'proni' | 'cz'};
export const V4_PADRAO: V4Props = {fecho: 'c', rab: 'b', elenco: 'b', amador: 'proni'};   // opcoes escolhidas na pagina de aprovacao

// cenas da v4: 'so' filtra pela prop, 'variantes' sobrescreve campos (prep/montar_v4.py)
type ComVariantes = Cena & {so?: Record<string, string[]>; variantes?: Record<string, Record<string, Partial<Cena>>>};
export const cenasV4 = (todas: Cena[], p: V4Props): Cena[] => {
  const pr = p as unknown as Record<string, string>;
  return (todas as ComVariantes[])
    .filter((c) => !c.so || Object.entries(c.so).every(([k, vs]) => vs.includes(pr[k])))
    .map((c) => {
      let out: Cena = c;
      for (const [k, porValor] of Object.entries(c.variantes || {})) {
        const v = porValor[pr[k]];
        if (v) out = {...out, ...v};
      }
      return out;
    });
};

export {Camadas, PLX} from './lib/camadas';

// ---------------------------------------------------------------- 2 · tratamento dos planos H3
// grao de pelicula visivel (alem do grao geral), halacao quente nos claros, desfoque leve, vinheta;
// geada (o mesmo cristal do RAB, prep/geada_v4.py) so nos exteriores de neve: vidro desfocado nas bordas, miolo nitido.
const GraoGrosso: React.FC<{forca?: number}> = ({forca = 0.62}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const k = (Math.floor((f * 24) / fps) * 7 + 3) % 12;
  return (
    <AbsoluteFill style={{mixBlendMode: 'overlay', opacity: forca, pointerEvents: 'none', overflow: 'hidden'}}>
      <Img src={staticFile(`grao/g${String(k).padStart(2, '0')}.png`)} style={{width: W * 1.6, height: H * 1.6, transform: 'translate(-10%, -12%)'}} />
    </AbsoluteFill>
  );
};
const VinhetaForte: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'multiply',
    background: 'radial-gradient(ellipse 78% 62% at 50% 48%, rgba(255,255,255,1) 42%, rgba(176,178,184,1) 100%)'}} />
);
export const PlanoTratado: React.FC<{c: Cena; t: number; camCss: string}> = ({c, t, camCss}) => {
  const g = (c as unknown as {trat?: {geada?: 'dia' | 'noite'}}).trat?.geada;
  const cam: React.CSSProperties = {transform: camCss, transformOrigin: '0 0'};
  const fundo = <Fundo f={c.fonte} t0={c.t0} t={t} />;
  const miolo = `url(${staticFile('v4/geada_miolo.png')})`;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#15171A'}}>
      {g && <AbsoluteFill style={{...cam, filter: 'blur(9px)'}}>{fundo}</AbsoluteFill>}
      <AbsoluteFill style={g ? {WebkitMaskImage: miolo, maskImage: miolo, WebkitMaskSize: '100% 100%', maskSize: '100% 100%'} : {}}>
        <AbsoluteFill style={{...cam, filter: 'blur(0.9px)'}}>{fundo}</AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill style={{...cam, mixBlendMode: 'screen', opacity: 0.28,
        filter: 'blur(16px) contrast(1.7) brightness(0.92) sepia(0.6) saturate(1.8) hue-rotate(-16deg)'}}>{fundo}</AbsoluteFill>
      {g && <Img src={staticFile(`v4/geada_${g}.png`)} style={{position: 'absolute', left: -18, top: -30, width: W + 36, height: H + 60}} />}
      <GraoGrosso />
      <VinhetaForte />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 4 · parafuso na mesa vazia
// mesma queda da v3 (0,16 s, gira de -70 a -8 graus), 2 quiques e rola ate parar. Sombra no tampo (luz da janela
// da esquerda) que so aparece quando ele chega perto da madeira. Impactos: t+0,16 / t+0,38 / t+0,50; rola ate t+1,10.
export const PARAFUSO_TEMPOS = {queda: 0.16, q1: 0.38, q2: 0.50, para: 1.10};
export const ParafusoV4: React.FC<{c: Cena; t: number}> = ({c, t}) => {
  const pf = c.parafuso;
  if (!pf || t < pf.t) return null;
  const [nw, nh] = DOCS.parafuso;
  const w = pf.w, h = (w * nh) / nw;
  const P = PARAFUSO_TEMPOS;
  const dt = t - pf.t;
  let alt = 0, rot = -8, x = pf.x, y = pf.y;
  if (dt < P.queda) {
    const u = dt / P.queda;
    alt = lerp(1500, 0, u * u); rot = lerp(-70, -8, u);
  } else if (dt < P.q1) {
    const u = (dt - P.queda) / (P.q1 - P.queda);
    alt = 70 * 4 * u * (1 - u); rot = -8 + 7 * Math.sin(u * Math.PI); x += 10 * u;
  } else if (dt < P.q2) {
    const u = (dt - P.q1) / (P.q2 - P.q1);
    alt = 20 * 4 * u * (1 - u); rot = -8 + 2.5 * Math.sin(u * Math.PI); x += 10 + 6 * u;
  } else {
    const u = clamp((dt - P.q2) / (P.para - P.q2));
    const e = 1 - (1 - u) * (1 - u);                   // desacelera ate parar (rolar), sem rebote
    x += 16 + 64 * e; y += 14 * e; rot = -8 + 20 * e;
  }
  const sombraOp = 0.5 * clamp(1 - alt / 260);
  return (
    <>
      <Img src={docSrc('parafuso')} style={{position: 'absolute', left: x - w / 2 + 10 + alt * 0.12, top: y - h / 2 + 12, width: w, height: h,
        transform: `rotate(${rot}deg)`, filter: `brightness(0) blur(${(2 + alt * 0.02).toFixed(2)}px)`, opacity: sombraOp}} />
      <Img src={docSrc('parafuso')} style={{position: 'absolute', left: x - w / 2, top: y - alt - h / 2, width: w, height: h,
        transform: `rotate(${rot}deg)`}} />
    </>
  );
};

// ---------------------------------------------------------------- 6 / 8 · folha de calendario de parede
// Papel neutro (scan real da biblioteca, prep/papel_calendario.py), tipografia de calendario: numero grande
// (Fixture Condensed Black) e 'de janeiro' / 'de 1921' em portugues. Entra como foco puxado (o mundo desfoca
// atras, a folha sai do desfoque) sem quique. Linhas sobem de tras de uma linha de corte, na palavra da voz.
const CAL = {x: 160, y: 300, w: 760, h: 960, faixa: 70};
type Cal = {t: number; dia: number; ate_dia?: number; vira?: [number, number]; linhas?: [number, number]; impresso?: boolean;
  nota?: {t: number; txt: string}};
const Linha: React.FC<{txt: string; y: number; s: number; t: number; t0?: number}> = ({txt, y, s, t, t0}) => {
  if (t0 !== undefined && t < t0) return null;
  const u = t0 === undefined ? 1 : easeOut((t - t0) / 0.28);
  const dy = (1 - u) * s * 0.95;
  return (
    <div style={{position: 'absolute', left: 0, top: y - s * 1.05, width: CAL.w, height: s * 1.3, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: dy, width: CAL.w, textAlign: 'center', fontFamily: FAMILIA.info, fontSize: s,
        lineHeight: `${s * 1.25}px`, color: LA, opacity: 0.93, whiteSpace: 'nowrap'}}>{txt}</div>
    </div>
  );
};
const Folha: React.FC<{dia: number; t: number; cal: Cal; ultima: boolean}> = ({dia, t, cal, ultima}) => {
  const lt = cal.impresso ? undefined : cal.linhas;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: CAL.w, height: CAL.h}}>
      <Img src={staticFile('v4/papel_cal.jpg')} style={{position: 'absolute', left: 0, top: 0, width: CAL.w, height: CAL.h}} />
      {/* furos da picotagem, logo abaixo da faixa do bloco */}
      {Array.from({length: 33}).map((_, i) => (
        <div key={i} style={{position: 'absolute', left: 14 + i * 22.5, top: CAL.faixa + 9, width: 7, height: 7, borderRadius: 4,
          background: 'rgba(20,22,25,0.5)'}} />
      ))}
      <svg width={CAL.w} height={CAL.h} style={{position: 'absolute', left: 0, top: 0}}>
        <text x={CAL.w / 2} y={590} textAnchor="middle" fontFamily={FAMILIA.cond} fontSize={520} fill={LA} opacity={0.94}>{dia}</text>
        <line x1={90} x2={CAL.w - 90} y1={836} y2={836} stroke={LA} strokeOpacity={0.45} strokeWidth={3} />
      </svg>
      <Linha txt="de janeiro" y={690} s={84} t={t} t0={lt ? lt[0] : undefined} />
      <Linha txt="de 1921" y={785} s={84} t={t} t0={lt ? lt[1] : undefined} />
      {ultima && cal.nota && <Linha txt={cal.nota.txt} y={905} s={54} t={t} t0={cal.nota.t} />}
    </div>
  );
};
export const Calendario: React.FC<{c: Cena; t: number}> = ({c, t}) => {
  const cal = (c as unknown as {calendario?: Cal}).calendario;
  if (!cal || t < cal.t) return null;
  const ue = easeOut((t - cal.t) / 0.35);
  const op = clamp((t - cal.t) / (2 / 24));
  const blur = lerp(9, 0, ue);
  const sc = lerp(1.035, 1, ue);
  // virar as folhas: dia continuo de 'dia' ate 'ate_dia'; a folha de cima gira pela borda de cima e some
  let n = cal.dia, frac = 0;
  if (cal.ate_dia && cal.vira) {
    const f = lerp(cal.dia, cal.ate_dia, easeInOut((t - cal.vira[0]) / (cal.vira[1] - cal.vira[0])));
    n = Math.min(cal.ate_dia, Math.floor(f + 1e-6));
    frac = f - n;
  }
  const ultima = !cal.ate_dia || n >= cal.ate_dia;
  return (
    <div style={{position: 'absolute', left: CAL.x, top: CAL.y, width: CAL.w, height: CAL.h, opacity: op,
      transform: `rotate(-1.2deg) scale(${sc})`, filter: `blur(${blur.toFixed(2)}px) drop-shadow(14px 18px 4px rgba(10,12,14,0.42))`}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: CAL.w, height: CAL.h, perspective: 1700, perspectiveOrigin: '50% 0%'}}>
        <Folha dia={frac > 0 ? n + 1 : n} t={t} cal={cal} ultima={frac > 0 ? n + 1 >= (cal.ate_dia || 0) : ultima} />
        {frac > 0 && (
          <div style={{position: 'absolute', left: 0, top: CAL.faixa, width: CAL.w, height: CAL.h - CAL.faixa, overflow: 'visible',
            transformOrigin: '50% 0%', transform: `rotateX(${(frac * 120).toFixed(1)}deg)`, backfaceVisibility: 'hidden'}}>
            <div style={{position: 'absolute', left: 0, top: -CAL.faixa, width: CAL.w, height: CAL.h, clipPath: `inset(${CAL.faixa}px 0 0 0)`}}>
              <Folha dia={n} t={t} cal={cal} ultima={false} />
            </div>
            <div style={{position: 'absolute', inset: 0, background: `rgba(10,12,14,${(0.45 * frac).toFixed(3)})`}} />
          </div>
        )}
      </div>
      {/* faixa do bloco (papelao), por cima das folhas */}
      <div style={{position: 'absolute', left: 0, top: 0, width: CAL.w, height: CAL.faixa, background: '#25272B',
        boxShadow: '0 4px 6px rgba(10,12,14,0.35)'}} />
    </div>
  );
};

// ---------------------------------------------------------------- 9 · ROBOTS (a letra da capa real) cresce e engole
export const Engole: React.FC<{c: Cena; t: number}> = ({c, t}) => {
  const e = (c as unknown as {engole?: {t: number; dur: number; cx: number; cy: number; w: number}}).engole;
  if (!e || t < e.t) return null;
  const u = easeInOut((t - e.t) / e.dur);
  const op = clamp((t - e.t) / 0.1);
  const w = lerp(e.w * 0.22, e.w, u), h = (w * 667) / 1084;
  return <Img src={staticFile('v4/robots_capa.png')} style={{position: 'absolute', left: e.cx - w / 2, top: e.cy - h / 2, width: w, height: h, opacity: op,
    filter: 'drop-shadow(0px 3px 8px rgba(10,12,14,0.5))'}} />;
};
