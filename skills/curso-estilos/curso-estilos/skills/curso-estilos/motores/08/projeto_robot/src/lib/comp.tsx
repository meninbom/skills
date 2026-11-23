// Pecas basicas da montagem: fonte (clipe H3 ou still), camera, texto no mundo, papel com sombra dura, grao, vinheta.
import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import disp from '../data/disponiveis.json';
import {Camadas, PLX} from './camadas';
import {Chave, GIZ, H, LA, W, chave, clamp, easeInOut, easeOut, hash, lerp, mola, punch} from './util';

// pano (v3): documento real em TELA CHEIA, sem moldura, desenhado com largura w (nunca acima do nativo) e canto (x, y),
// interpolado entre chaves; o resto do quadro fica preto-la (o proprio fundo escuro da foto se funde nele)
export type Pano = {doc: string; chaves: {t: number; x: number; y: number; w: number}[]; escurece_topo?: number; plx?: boolean};
export type Fonte = {clip?: string; still?: string; doc?: string; de?: number; ritmo?: number; blur?: number; foco?: [number, number]; seq?: string; rev?: boolean; luz?: number; pano?: Pano
  freio?: {t: number; ate: number};  // v4: a partir de t o clipe desacelera ate parar no tempo de clipe 'ate' (sem o trecho que derrete no H3)
};
export type Txt = {
  t: number; ate?: number; txt: string; x: number; y: number; s: number; f: 'heroi' | 'info' | 'cond'; cor: 'giz' | 'la';
  ancora?: 'start' | 'middle'; atras?: boolean; tela?: boolean; track?: number; entra?: 'corte' | 'escala' | 'limpa' | 'sobe';
  etiqueta?: number; // credito impresso numa tira de papel (o mesmo papel das tiras da cena 23), girada 'etiqueta' graus
  tinta?: number;   // tipo pintado NO plano: e o proprio fundo escurecido por este fator, recortado pela letra (pega a luz do clipe)
  esvai?: number;   // v3: some em 'esvai' s antes do 'ate' (opacidade), em vez de sumir seco
  cred?: boolean;   // v3: credito (1 linha, Fixture SemiBold 44, entra em 3 quadros)
  queima?: number;  // v3: 'queima' de laboratorio atras do texto claro (elipse escura e macia, sem borda, sem tarja)
  sobe?: {t: number; dur: number; dy: number};  // v4: depois de assentar, o texto anda dy (abre lugar para o proximo)
  de_baixo?: number;  // v4: entra 'sobe' = sobe de tras de algo (de y + de_baixo ate y)
  engole?: number;    // v4: a partir deste t, encolhe para o centro e some (engolido pela palavra que cresce)
};
export type Papel = {
  t: number; ate?: number; doc: string; cx: number; cy: number; w: number; rot?: number;
  entra: 'cai' | 'desliza' | 'prega' | 'baixa'; de?: 'baixo' | 'cima' | 'esq' | 'dir'; sai?: 'cima' | 'baixo';
  borda?: number; tachas?: boolean; atras?: boolean;
  legenda?: string;  // v3: credito IMPRESSO na margem de baixo da copia (1 linha, 44 px, preto-la)
  luz?: string;      // v3: mapa de luz do plano (public/luz/<id>.png) multiplicado na copia: ela mora na mesma luz da mesa
  tela?: boolean;    // v3: fora da camera (cartao do desfoque de foco)
  sombra?: number;   // v3: forca da sombra dura (1 = padrao)
  plx?: boolean;     // v4: photo parallax sutil (2 camadas) dentro da copia
};
// v3: desfoque de foco DENTRO do plano (sem corte): o mundo desfoca e escurece, o papel entra nitido na frente
export type Rack = {t: number; dur: number; blur: number; luz?: number};
export type Cena = {
  n: number; t0: number; t1: number; fala: string; motor: string; fonte: Fonte; matte?: string; livre?: boolean;
  cam: Chave[]; punch?: [number, number][]; textos?: Txt[]; papeis?: Papel[]; especial?: string[]; marcas?: number[];
  herda_papeis_de?: number; todo?: string[]; sombra_heroi?: {dx: number; dy: number; blur: number; opacidade: number};
  rack?: Rack; parafuso?: {t: number; x: number; y: number; w: number; sai?: number}; capa_real?: {ate_y?: number; luz?: string};
  avalanche?: {t: number; livro: number};
  trat?: {geada?: 'dia' | 'noite'}; plx?: boolean; roboti?: {t0: number; t1: number; t2: number};
  foco?: {t: number; dur: number; blur: number; cx: number; cy: number; rx: number; ry: number}; marca?: {t: number; dur: number};
};

// As fontes da peca original (Fixture) sao comerciais e NAO vem no pacote: ponha as suas em public/fonts (ver Robot.tsx > FONTES).
// Sem elas, cai na pilha do sistema (e o que o demo usa).
export const FAMILIA = {heroi: "FixtureExpandedBlack, 'Arial Black', Impact, 'Helvetica Neue', sans-serif", info: "FixtureSemiBold, 'Segoe UI Semibold', 'Helvetica Neue', Arial, sans-serif",
  cond: "FixtureCondensedBlack, Impact, 'Arial Narrow', sans-serif"};
// arquivo com extensao explicita passa direto (o demo usa .png); sem extensao vale a convencao da serie
export const comExt = (nome: string, ext: string) => (/\.[a-z0-9]{3,4}$/i.test(nome) ? nome : `${nome}.${ext}`);
export const semExt = (nome: string) => nome.replace(/\.[a-z0-9]{3,4}$/i, '');
export const temClipe = (id?: string) => !!id && (disp.clips as string[]).includes(id);
export const temMatte = (id?: string) => !!id && (disp.mattes as string[]).includes(id);
const SEQS = ((disp as unknown as {seqs?: Record<string, number>}).seqs || {}) as Record<string, number>;
export const temSeq = (id?: string) => !!id && !!SEQS[id];
// quadro da sequencia do heroi no tempo t (clipe = de + (t - t0) * ritmo, a 24 fps; rev = de tras para frente)
export const quadroSeq = (f: Fonte, t0: number, t: number) => {
  const n = SEQS[f.seq as string] || 1;
  let c = (f.de || 0) + (t - t0) * (f.ritmo || 1);
  if (f.freio && t > f.freio.t) {
    // desacelera na mesma velocidade de entrada ate parar em 'ate' (ease-out cubico: inclinacao inicial = ritmo)
    const cf = (f.de || 0) + (f.freio.t - t0) * (f.ritmo || 1);
    const dur = Math.max(0.05, (3 * (f.freio.ate - cf)) / (f.ritmo || 1));
    c = cf + (f.freio.ate - cf) * easeOut((t - f.freio.t) / dur);
  }
  let i = Math.round(c * 24);
  i = Math.min(n - 1, Math.max(0, i));
  return f.rev ? n - 1 - i : i;
};
const seqSrc = (id: string, i: number, frente: boolean) => staticFile(`seq/${id}/${frente ? 'f' : ''}${String(i).padStart(4, '0')}.${frente ? 'png' : 'jpg'}`);

// tamanhos nativos dos documentos (nunca passar de 1,0x do nativo)
export const DOCS: Record<string, [number, number]> = {
  karel30: [1867, 2378], bratri1927: [804, 1077], josef1937: [694, 1024], patent1738: [2248, 3543], berry_mars: [1684, 2400],
  paris1: [3840, 2743], vesalius: [1036, 1785], tg1: [921, 586], klicpera_hoje: [2560, 1920], narodni_zitek: [1872, 1986],
  turco: [600, 513], jaquet1: [1200, 1654], televox1928: [661, 615], cz1920_8: [2097, 3281], cz1920_2: [2031, 3290],
  briullov: [2560, 1903], briullov_detalhe: [1903, 1903], parafuso: [2472, 638], assin_karel: [375, 209],
  teatro_amador: [2400, 1946], teatro_amador_cz: [3030, 1880],
  'demo_doc.png': [400, 500],   // placeholder do demo (tools/placeholders.mjs)
};
export const docSrc = (d: string) => staticFile(`docs/${comExt(d, d === 'parafuso' || d === 'assin_karel' ? 'png' : 'jpg')}`);

// ---------------------------------------------------------------- camera
// z = zoom; (x, y) = ponto do mundo (px do quadro) no centro da tela. Fora de 'livre', a camera nunca mostra borda.
export const camTransform = (c: Cena, t: number) => {
  let z = chave(c.cam, t, 'z', 1);
  let x = chave(c.cam, t, 'x', W / 2);
  let y = chave(c.cam, t, 'y', H / 2);
  for (const [tp, amt] of c.punch || []) z *= punch(t, tp, amt);
  if (!c.livre) {
    z = Math.max(1, z);
    x = clamp(x, W / (2 * z), W - W / (2 * z));
    y = clamp(y, H / (2 * z), H - H / (2 * z));
  }
  return {z, x, y, css: `translate(${W / 2}px, ${H / 2}px) scale(${z}) translate(${-x}px, ${-y}px)`};
};

// ---------------------------------------------------------------- fonte de imagem
// OffthreadVideo SEMPRE dentro da Sequence da cena, que tem +3 quadros de folga (senao: quadro preto no corte).
export const Fundo: React.FC<{f: Fonte; t0: number; t: number; mask?: string}> = ({f, t0, t, mask}) => {
  const {fps} = useVideoConfig();
  let blur = f.blur || 0;
  if (f.foco && t >= f.foco[0]) blur = lerp(blur, 0, easeOut((t - f.foco[0]) / Math.max(0.01, f.foco[1] - f.foco[0])));
  const st: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: W, height: H, objectFit: 'cover',
    filter: [blur > 0.2 ? `blur(${blur}px)` : '', f.luz ? `brightness(${f.luz})` : ''].join(' ').trim() || undefined,
    transform: blur > 0.2 ? 'scale(1.04)' : undefined,
    WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: '100% 100%', maskSize: '100% 100%'};
  if (f.pano) return <PanoDoc p={f.pano} t={t} />;
  if (f.doc) return <Img src={docSrc(f.doc)} style={st} />;
  if (temSeq(f.seq)) return <Img src={seqSrc(f.seq as string, quadroSeq(f, t0, t), false)} style={st} />;
  if (temClipe(f.clip)) {
    return <OffthreadVideo muted src={staticFile(`clips/${f.clip}.mp4`)} startFrom={Math.round((f.de || 0) * fps)}
      playbackRate={f.ritmo || 1} style={st} />;
  }
  return <Img src={staticFile(`stills/${comExt(f.still as string, 'jpg')}`)} style={st} />;
};

const PanoDoc: React.FC<{p: Pano; t: number}> = ({p, t}) => {
  const [nw, nh] = DOCS[p.doc];
  const k = p.chaves;
  let i = 0;
  while (i < k.length - 1 && t >= k[i + 1].t) i++;
  const a = k[i], b = k[Math.min(i + 1, k.length - 1)];
  const u = b === a ? 0 : easeInOut((t - a.t) / Math.max(1e-6, b.t - a.t));
  const w = Math.min(nw * 1.03, lerp(a.w, b.w, u)), x = lerp(a.x, b.x, u), y = lerp(a.y, b.y, u);
  const hh = (w * nh) / nw;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, background: LA, overflow: 'hidden'}}>
      {p.plx && PLX.has(p.doc) ? (
        <div style={{position: 'absolute', left: x, top: y, width: w, height: hh}}>
          <Camadas doc={p.doc} w={w} h={hh} t={t} t0={k[0].t} t1={k[k.length - 1].t} />
        </div>
      ) : <Img src={docSrc(p.doc)} style={{position: 'absolute', left: x, top: y, width: w, height: hh}} />}
      {p.escurece_topo ? <div style={{position: 'absolute', left: 0, top: 0, width: W, height: p.escurece_topo,
        background: 'linear-gradient(180deg, rgba(10,12,14,0.62) 0%, rgba(10,12,14,0) 100%)'}} /> : null}
    </div>
  );
};

// heroi recortado do MESMO quadro do fundo (png com alfa): o que estiver entre o fundo e ele fica ATRAS da cabeca.
// sombra = o mesmo recorte escurecido, desfocado e deslocado para a direita (janela da esquerda), so dentro de 'area'.
export const HeroiFrente: React.FC<{f: Fonte; t0: number; t: number; sombra?: Cena['sombra_heroi']; area?: string}> = ({f, t0, t, sombra, area}) => {
  if (!temSeq(f.seq)) return null;
  const src = seqSrc(f.seq as string, quadroSeq(f, t0, t), true);
  const st: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: W, height: H};
  if (sombra) {
    return (
      <div style={{position: 'absolute', inset: 0, clipPath: area, opacity: sombra.opacidade}}>
        <Img src={src} style={{...st, transform: `translate(${sombra.dx}px, ${sombra.dy}px)`, filter: `brightness(0) blur(${sombra.blur}px)`}} />
      </div>
    );
  }
  return <Img src={src} style={st} />;
};

// ---------------------------------------------------------------- texto (SVG: y = linha de base, como os styleframes)
export const Texto: React.FC<{tx: Txt; t: number}> = ({tx, t}) => {
  if (t < tx.t || (tx.ate !== undefined && t >= tx.ate)) return null;
  const u = (t - tx.t) / (2 / 24);                     // entrada em 2 quadros, sem blur longo
  let sc = 1, clip: string | undefined;
  let op = 1;
  if (tx.cred) op = easeOut((t - tx.t) / (3 / 24));    // credito: entra em 3 quadros, discreto
  if (tx.esvai && tx.ate !== undefined) op *= clamp((tx.ate - t) / tx.esvai);
  if (tx.entra === 'escala') sc = lerp(1.04, 1, easeOut(u));
  if (tx.entra === 'limpa') clip = `inset(0 0 ${Math.round(100 * (1 - easeOut((t - tx.t) / 0.25)))}% 0)`;   // mao limpando o vidro, de cima p/ baixo
  let dy = 0;
  if (tx.entra === 'sobe') dy += (tx.de_baixo || 80) * (1 - easeOut((t - tx.t) / 0.32));
  if (tx.sobe && t >= tx.sobe.t) dy += tx.sobe.dy * easeInOut((t - tx.sobe.t) / tx.sobe.dur);
  let eng = 1;
  if (tx.engole !== undefined && t >= tx.engole) { const ue = easeInOut((t - tx.engole) / 0.34); eng = lerp(1, 0.45, ue); op *= 1 - ue; }
  if (tx.etiqueta !== undefined) {
    // tira de papel com sombra dura para a direita (luz da janela da esquerda): legivel sobre qualquer fundo
    const pad = Math.round(tx.s * 0.28);
    return (
      <div style={{position: 'absolute', left: tx.x - pad, top: tx.y - tx.s * 0.92 - pad * 0.6, padding: `${pad * 0.6}px ${pad}px`,
        background: '#ECEDEA', boxShadow: '10px 12px 2px rgba(10,12,14,0.38)', whiteSpace: 'nowrap',
        transformOrigin: 'left center', transform: `rotate(${tx.etiqueta}deg) scale(${sc})`,
        fontFamily: FAMILIA[tx.f], fontSize: tx.s, lineHeight: 1.1, color: LA, letterSpacing: tx.track || 0, opacity: op}}>{tx.txt}</div>
    );
  }
  const queima = tx.queima ? (() => {
    const wq = tx.txt.length * tx.s * 0.62 + tx.s * 2.4, hq = tx.s * 3.2;
    const cxq = tx.ancora === 'middle' ? tx.x : tx.x + wq / 2 - tx.s * 1.2, cyq = tx.y - tx.s * 0.35;
    return <div style={{position: 'absolute', left: cxq - wq / 2, top: cyq - hq / 2, width: wq, height: hq, opacity: op,
      background: `radial-gradient(ellipse 50% 50% at 50% 50%, rgba(10,12,14,${tx.queima}) 0%, rgba(10,12,14,${(tx.queima as number) * 0.55}) 45%, rgba(10,12,14,0) 100%)`}} />;
  })() : null;
  return (
    <>
    {queima}
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', clipPath: clip, opacity: op,
      transform: dy || eng !== 1 ? `translateY(${dy.toFixed(2)}px) scale(${eng.toFixed(4)})` : undefined, transformOrigin: '540px 470px',
      // v3: texto claro ganha sombra SUAVE (critico 1: branco com sombra suave), nunca glow
      filter: tx.cor === 'giz' ? 'drop-shadow(0px 2px 5px rgba(10,12,14,0.55)) drop-shadow(0px 0px 14px rgba(10,12,14,0.28))' : undefined}}>
      <text x={tx.x} y={tx.y} fontFamily={FAMILIA[tx.f]} fontSize={tx.s} fill={tx.cor === 'giz' ? GIZ : LA}
        letterSpacing={tx.track || 0} textAnchor={tx.ancora === 'middle' ? 'middle' : 'start'}
        style={{transformOrigin: `${tx.x}px ${tx.y}px`, transform: `scale(${sc})`}}>{tx.txt}</text>
    </svg>
    </>
  );
};

// tipo tingido: o mesmo quadro do fundo, recortado pela forma da letra e escurecido -> as faixas de luz do clipe passam pela letra
export const TextoTinta: React.FC<{tx: Txt; f: Fonte; t0: number; t: number; id: string}> = ({tx, f, t0, t, id}) => {
  if (t < tx.t || (tx.ate !== undefined && t >= tx.ate)) return null;
  const op = tx.esvai && tx.ate !== undefined ? clamp((tx.ate - t) / tx.esvai) : 1;
  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <clipPath id={id}>
            <text x={tx.x} y={tx.y} fontFamily={FAMILIA[tx.f]} fontSize={tx.s} letterSpacing={tx.track || 0}
              textAnchor={tx.ancora === 'middle' ? 'middle' : 'start'}>{tx.txt}</text>
          </clipPath>
        </defs>
      </svg>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, clipPath: `url(#${id})`, filter: `brightness(${tx.tinta}) saturate(0.6)`, opacity: op}}>
        <Fundo f={f} t0={t0} t={t} />
      </div>
    </>
  );
};

// ---------------------------------------------------------------- papel (foto/documento como objeto, luz da janela da esquerda)
export const PapelV: React.FC<{p: Papel; t: number; seed?: number; fim?: number}> = ({p, t, seed = 1, fim}) => {
  if (t < p.t || (p.ate !== undefined && t >= p.ate + 0.35)) return null;
  const [nw, nh] = DOCS[p.doc];
  const bw = p.borda ?? 14;
  const w = p.w + 2 * bw, h = (p.w * nh) / nw + 2 * bw;
  const dt = t - p.t;
  const m = mola(dt, 20, 0.5);                       // pouso com micro-quique (~0,25 s)
  let dx = 0, dy = 0, rot = p.rot || 0, sc = 1, sh = 1;
  if (p.entra === 'cai') { sc = lerp(1.18, 1, m); rot += lerp(-6, 0, m); sh = lerp(2.2, 1, m); }
  if (p.entra === 'desliza') {
    const d = p.de || 'baixo';
    const k = 1 - easeOut(dt / 0.3);
    dx = d === 'esq' ? -1300 * k : d === 'dir' ? 1300 * k : 0;
    dy = d === 'baixo' ? 1600 * k : d === 'cima' ? -1600 * k : 0;
  }
  if (p.entra === 'baixa') { dy = -1500 * (1 - easeOut(dt / 0.2)); rot += lerp(3, 0, m); }
  if (p.entra === 'prega') { sc = lerp(1.06, 1, m); rot += lerp(-3, 0, m); sh = lerp(1.8, 1, m); }
  if (p.ate !== undefined && t >= p.ate) dy -= 2200 * easeOut((t - p.ate) / 0.3);
  const ks = p.sombra ?? 1;
  const shadow = `drop-shadow(${16 * sh * ks}px ${18 * sh * ks}px ${3 * sh}px rgba(10,12,14,${0.45 * Math.min(1, ks + 0.2)}))`;
  const mg = p.legenda ? 74 : 0;                       // margem de baixo da copia, onde o credito vem impresso
  const hh = h + mg;
  const left = p.cx - w / 2 + dx, top = p.cy - h / 2 + dy;
  return (
    <div style={{position: 'absolute', left, top, width: w, height: hh,
      transform: `rotate(${rot}deg) scale(${sc})`, filter: shadow}}>
      <div style={{position: 'absolute', inset: 0, background: '#E6E8E6'}} />
      {p.plx && PLX.has(p.doc) ? (
        <div style={{position: 'absolute', left: bw, top: bw, width: w - 2 * bw, height: h - 2 * bw}}>
          <Camadas doc={p.doc} w={w - 2 * bw} h={h - 2 * bw} t={t} t0={p.t} t1={fim ?? p.t + 1.4} />
        </div>
      ) : <Img src={docSrc(p.doc)} style={{position: 'absolute', left: bw, top: bw, width: w - 2 * bw, height: h - 2 * bw}} />}
      {p.legenda && (
        <div style={{position: 'absolute', left: bw, top: h - 4, width: w - 2 * bw, height: mg, display: 'flex', alignItems: 'center',
          fontFamily: FAMILIA.info, fontSize: 44, color: LA, whiteSpace: 'nowrap', letterSpacing: 0}}>{p.legenda}</div>
      )}
      {/* o papel mora na mesma luz: gradiente da janela da esquerda multiplicado */}
      <div style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply',
        background: 'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(214,218,224,1) 100%)'}} />
      {p.tachas && [[22, 20], [w - 22, 16]].map(([x, y], i) => (
        <div key={i} style={{position: 'absolute', left: x - 11, top: y - 11 + hash(seed + i) * 2, width: 22, height: 22, borderRadius: 11,
          background: 'radial-gradient(circle at 35% 35%, #6b6f75, #2a2c30 70%)', boxShadow: '5px 6px 2px rgba(0,0,0,0.35)'}} />
      ))}
      {/* v3: a copia mora na luz do plano: mapa de luz no lugar do mundo (desfaz a rotacao/escala da copia) */}
      {p.luz && (
        <div style={{position: 'absolute', left: 0, top: 0, width: w, height: hh, mixBlendMode: 'multiply', overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 0, top: 0, width: w, height: hh, transformOrigin: `${w / 2}px ${hh / 2}px`,
            transform: `scale(${1 / sc}) rotate(${-rot}deg)`}}>
            <Img src={staticFile(`luz/${p.luz}.png`)} style={{position: 'absolute', left: -left, top: -top, width: W, height: H}} />
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------- grao e vinheta (por cima de tudo, como o finish2)
export const Grao: React.FC<{forca?: number}> = ({forca = 0.5}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const k = Math.floor((f * 24) / fps) % 12;           // grao renovado a cada quadro de 24 fps
  return (
    <AbsoluteFill style={{mixBlendMode: 'overlay', opacity: forca, pointerEvents: 'none'}}>
      <Img src={staticFile(`grao/g${String(k).padStart(2, '0')}.png`)} style={{width: W, height: H}} />
    </AbsoluteFill>
  );
};
export const Vinheta: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'multiply',
    background: 'radial-gradient(ellipse 75% 65% at 50% 50%, rgba(255,255,255,1) 55%, rgba(222,224,226,1) 100%)'}} />
);

// flash de fim de rolo: 1 quadro, so nas 3 viradas de ato
export const Flash: React.FC<{t: number; tempos: number[]}> = ({t, tempos}) => {
  const {fps} = useVideoConfig();
  const on = tempos.some((x) => t >= x && t < x + 1 / fps + 1e-4);
  return on ? <AbsoluteFill style={{background: '#F3EDE2', opacity: 0.86}} /> : null;
};

export const ClipeSeq: React.FC<{c: Cena; children: React.ReactNode}> = ({c, children}) => {
  const {fps} = useVideoConfig();
  return (
    <Sequence from={Math.round(c.t0 * fps)} durationInFrames={Math.max(1, Math.round((c.t1 - c.t0) * fps) + 3)} layout="none">
      {children}
    </Sequence>
  );
};
