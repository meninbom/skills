// ROBOT · CARNE E NEVE (serie_v2, familia lindo). Montagem em Remotion a partir de src/data/cenas.json.
// Camadas por plano: fundo (clipe H3 ou still) > tipo/papel ATRAS do heroi > heroi recortado (matte) > papeis > tipo no mundo
// > especiais; por cima de tudo: vinheta, grao vivo e o flash de fim de rolo (3 viradas de ato).
import React, {useEffect, useMemo, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import roteiro from './data/cenas.json';
import disp from './data/disponiveis.json';
import {Cena, ClipeSeq, semExt, DOCS, Flash, Fundo, Grao, HeroiFrente, PapelV, Texto, TextoTinta, Txt, Vinheta, camTransform, temClipe, temMatte, temSeq} from './lib/comp';
import {CapaReal, Especial, Geada} from './Especiais';
import {Calendario, Engole, ParafusoV4, PlanoTratado, V4Props, V4_PADRAO, cenasV4} from './V4';
import {H, W, easeInOut, lerp} from './lib/util';

const TODAS = roteiro.cenas as unknown as Cena[];
const POR_N: Record<number, Cena> = Object.fromEntries(TODAS.map((c) => [c.n, c]));

// fontes locais, carregadas antes do 1o quadro. A Fixture e comercial e nao vem no pacote:
// ponha os seus .ttf em public/fonts com estes nomes (ou troque os nomes aqui). Se faltar, o render segue com a fonte do sistema.
const FONTES: [string, string][] = [
  ['FixtureExpandedBlack', 'fonts/Fixture-ExpandedBlack.ttf'],
  ['FixtureSemiBold', 'fonts/Fixture-SemiBold.ttf'],
  ['FixtureCondensedBlack', 'fonts/Fixture-CondensedBlack.ttf'],
];
const useFontes = () => {
  const [h] = useState(() => delayRender('fontes Fixture'));
  useEffect(() => {
    Promise.all(FONTES.map(([fam, p]) => new FontFace(fam, `url(${staticFile(p)})`).load().then((f) => (document.fonts as unknown as {add: (x: FontFace) => void}).add(f))))
      .then(() => continueRender(h))
      .catch((e) => { console.error(e); continueRender(h); });
  }, [h]);
};

// matte do heroi: por quadro do clipe (public/mattes/<id>/NNNN.png, tools/mattes.py) ou o do still (placa) enquanto nao houver clipe
const mascaraHeroi = (c: Cena, frameDoClipe: number) => {
  if (!c.matte) return undefined;
  if (temClipe(c.fonte.clip) && temMatte(c.matte)) return `url(${staticFile(`mattes/${c.matte}/${String(frameDoClipe).padStart(4, '0')}.png`)})`;
  return `url(${staticFile(`stills/${semExt(c.fonte.still as string)}_matte.png`)})`;
};

export const Plano: React.FC<{c: Cena}> = ({c}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = c.t0 + f / fps;
  const cam = camTransform(c, t);
  if (c.trat) return <PlanoTratado c={c} t={t} camCss={cam.css} />;   // v4 item 2
  const papeis = [...(c.herda_papeis_de ? POR_N[c.herda_papeis_de].papeis || [] : []), ...(c.papeis || [])];
  // v3: desfoque de foco dentro do plano. O que entrou ANTES do rack e mundo (desfoca junto); o que entra depois e a frente nitida.
  const rk = c.rack;
  const ur = rk ? easeInOut((t - rk.t) / rk.dur) : 0;
  const bRack = rk ? rk.blur * ur : 0;
  const luzRack = rk ? lerp(1, rk.luz ?? 1, ur) : 1;
  const noMundo = (x: {t: number}) => !rk || x.t < rk.t;
  const txs = (c.textos || []) as Txt[];
  const atrasT = txs.filter((x) => x.atras && !x.tela);
  const atrasP = papeis.filter((p) => p.atras);
  const mundoT = txs.filter((x) => !x.atras && !x.tela && noMundo(x));
  const frenteT = txs.filter((x) => !x.atras && !x.tela && !noMundo(x));
  const frenteP = papeis.filter((p) => !p.atras && !p.tela);
  const telaP = papeis.filter((p) => !p.atras && p.tela);
  const telaT = txs.filter((x) => x.tela);
  const esp = c.especial || [];
  const matteFrame = Math.round(((c.fonte.de || 0) + (t - c.t0) * (c.fonte.ritmo || 1)) * 24);
  const usaSeq = temSeq(c.fonte.seq);
  const m = usaSeq ? undefined : mascaraHeroi(c, matteFrame);
  const temAtras = atrasT.length > 0 || atrasP.length > 0;
  const pPregado = atrasP.find((p) => t >= p.t + 0.25);
  let areaSombra: string | undefined;
  if (pPregado) {
    const [nw, nh] = DOCS[pPregado.doc];
    const bw = pPregado.borda ?? 14;
    const x0 = pPregado.cx - pPregado.w / 2 - bw, x1 = pPregado.cx + pPregado.w / 2 + bw;
    const hh = (pPregado.w * nh) / nw / 2 + bw;
    areaSombra = `inset(${pPregado.cy - hh}px ${1080 - x1}px ${1920 - (pPregado.cy + hh)}px ${x0}px)`;
  }
  const textoMundo = (x: Txt, i: number, k: string) => (x.tinta
    ? <TextoTinta key={`${k}${i}`} tx={x} f={c.fonte} t0={c.t0} t={t} id={`tinta${c.n}_${k}${i}`} />
    : <Texto key={`${k}${i}`} tx={x} t={t} />);
  const mundo = (
    <>
      {esp.includes('geada') ? (
        <>
          <Fundo f={{...c.fonte, blur: 22}} t0={c.t0} t={t} />
          <Geada c={c} t={t} />
        </>
      ) : (
        <Fundo f={c.fonte} t0={c.t0} t={t} />
      )}
      {c.capa_real && <CapaReal c={c} t={t} />}
      {atrasP.map((p, i) => <PapelV key={`ap${i}`} p={p} t={t} seed={c.n * 10 + i} fim={c.t1} />)}
      {atrasT.map((x, i) => <Texto key={`at${i}`} tx={x} t={t} />)}
      {m && temAtras && <Fundo f={c.fonte} t0={c.t0} t={t} mask={m} />}
      {usaSeq && temAtras && c.sombra_heroi && areaSombra && <HeroiFrente f={c.fonte} t0={c.t0} t={t} sombra={c.sombra_heroi} area={areaSombra} />}
      {usaSeq && temAtras && <HeroiFrente f={c.fonte} t0={c.t0} t={t} />}
      {esp.filter((e) => e !== 'parafuso' && e !== 'avalanche' && e !== 'engole').map((e) => <Especial key={e} nome={e} c={c} t={t} />)}
      {mundoT.map((x, i) => textoMundo(x, i, 'mt'))}
    </>
  );
  const fo = c.foco;
  const uFoco = fo ? easeInOut((t - fo.t) / fo.dur) : 0;
  const camada = (
      <AbsoluteFill style={{transform: cam.css, transformOrigin: '0 0'}}>
        {bRack > 0.05 || luzRack < 0.999 ? (
          <AbsoluteFill style={{filter: `blur(${bRack.toFixed(2)}px) brightness(${luzRack.toFixed(3)})`,
            transform: `scale(${1 + bRack * 0.004})`, transformOrigin: '50% 50%'}}>{mundo}</AbsoluteFill>
        ) : mundo}
        {esp.includes('parafuso') && (c.parafuso as {v4?: boolean} | undefined)?.v4 ? <ParafusoV4 c={c} t={t} />
          : esp.includes('parafuso') && <Especial nome="parafuso" c={c} t={t} />}
        {esp.includes('avalanche') && <Especial nome="avalanche" c={c} t={t} />}
        {frenteP.map((p, i) => <PapelV key={`fp${i}`} p={p} t={t} seed={c.n * 10 + i + 5} fim={c.t1} />)}
        {frenteT.map((x, i) => textoMundo(x, i, 'ft'))}
      </AbsoluteFill>
  );
  const focoMask = fo ? `radial-gradient(ellipse ${fo.rx}px ${fo.ry}px at ${fo.cx}px ${fo.cy}px, black 55%, transparent 100%)` : '';
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#15171A'}}>
      {fo && uFoco > 0.01 ? (
        <>
          <AbsoluteFill style={{filter: `blur(${(fo.blur * uFoco).toFixed(2)}px)`}}>{camada}</AbsoluteFill>
          <AbsoluteFill style={{WebkitMaskImage: focoMask, maskImage: focoMask}}>{camada}</AbsoluteFill>
        </>
      ) : camada}
      {telaP.map((p, i) => <PapelV key={`tp${i}`} p={p} t={t} seed={c.n * 10 + i + 7} fim={c.t1} />)}
      {telaT.map((x, i) => <Texto key={`tt${i}`} tx={x} t={t} />)}
      <Calendario c={c} t={t} />
      {esp.includes('engole') && <Engole c={c} t={t} />}
    </AbsoluteFill>
  );
};

export const Robot: React.FC<Partial<V4Props>> = (props) => {
  useFontes();
  const pr: V4Props = {...V4_PADRAO, ...props};
  const CENAS = useMemo(() => cenasV4(TODAS, pr), [pr.fecho, pr.rab, pr.elenco, pr.amador]);
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  return (
    <AbsoluteFill style={{background: '#15171A', width: W, height: H}}>
      {CENAS.map((c) => (
        <ClipeSeq key={c.n} c={c}>
          <Plano c={c} />
        </ClipeSeq>
      ))}
      <Vinheta />
      <Grao forca={0.55} />
      <Flash t={t} tempos={roteiro.flashes} />
      {/* voz FIXA normalizada a -16 LUFS (tools/preparar.py); a mix final (trilha + sidechain + master -14) e no tools/mix.py */}
      {disp.voz && <Audio src={staticFile(pr.fecho === 'c' ? 'audio/voz_v4_-16lufs.wav' : 'audio/voz_-16lufs.wav')} />}
    </AbsoluteFill>
  );
};
