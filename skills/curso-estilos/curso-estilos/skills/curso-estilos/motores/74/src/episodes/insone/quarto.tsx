import React from 'react';
import { rnd, clamp, lerp } from '../../engine/anim';
import { makeRoom, Box, Pt } from '../../engine/room';
import { Glow, Cone, LightVeil, Dust } from '../../engine/light';
import { RoomShell, BackWindow, WallFrame, FloorShadow, FloorPlant } from '../../engine/furnish';
import { AlarmClock, WallCalendar, Mug, BookTower, PaperBall, LaptopBack } from '../../engine/props';
import { V_LEG } from './hero';

// Our set, designed for a vertical frame: a narrow, tall bedroom at night. The bed against the back wall on the
// left, a desk with a gooseneck lamp against the right wall (the main warm light), a tall window onto the moon and
// the city, a door ajar on the left with the hall light in the crack, a calendar whose crossed days are the episode's
// day counter, a cork board, mugs piling up as the days go. `forest` (0..1) turns the room into the day-5
// hallucination: trunks for walls, a pale path for the floor, moon shafts.

export const QUARTO = makeRoom({ x: 540, y: 880 }, { x0: 150, x1: 930, y0: 470, y1: 1250 }, 3.0);
const R = QUARTO;
const NIGHT = { wall: '#2F3550', side: '#272C45', floor: '#2B2330', ceiling: '#14172A', lines: '#1C1724' };
const BED = { u0: 0.02, u1: 0.5, top: 0.78, w1: 0.42 };
export const WIN = { x0: 610, x1: 880, y0: 560, y1: 930, moon: { x: 790, y: 640 } };
const DESK = { u0: 0.74, u1: 1, v0: 0.68, w0: 0.28, w1: 0.6 };

/** The bulb of the desk lamp, in world space. */
export const LAMPV: Pt = (() => {
  const p = R.P(0.86, DESK.v0, 0.36);
  return { x: p.x - 40, y: p.y - 150 };
})();
/** A standing character on the floor at (u, w): hip point and scale so they're `k` of the room's height. */
export const standV = (u: number, w: number, k = 0.6) => {
  const p = R.P(u, 1, w);
  const scale = (k * (R.back.y1 - R.back.y0) * R.s(w)) / 450;
  return { x: p.x, y: p.y - V_LEG * scale - 10 * scale, scale };
};
/** Sitting on the bed edge at u (hips on the mattress top, near the front edge). */
export const bedSitV = (u: number, w = 0.4) => {
  const p = R.P(u, BED.top, w);
  return { x: p.x, y: p.y - 8, scale: (0.6 * 780 * R.s(w)) / 450 };
};
/** Sitting at the desk on the stool (hips at seat height). */
export const deskSitV = () => {
  const p = R.P(0.66, 0.8, 0.46);
  return { x: p.x, y: p.y, scale: (0.6 * 780 * R.s(0.46)) / 450 };
};
export const deskTop = (u: number, w: number) => R.P(u, DESK.v0, w);
export const CLOCKV = (() => R.P(0.86, DESK.v0, 0.52))();

const Forest: React.FC<{ t: number; o: number }> = ({ t, o }) => {
  if (o <= 0.001) return null;
  const { P } = R;
  const trunks: React.ReactNode[] = [];
  // rows of trunks from the back to the front, both sides of the path
  const spots: [number, number, number][] = [];
  for (let i = 0; i < 26; i++) {
    const w = (i / 26) * 0.95;
    const left = i % 2 === 0;
    const u = left ? 0.05 + rnd(3, i) * 0.28 : 0.67 + rnd(4, i) * 0.3;
    spots.push([u, w, 0.6 + rnd(5, i) * 0.8]);
  }
  spots.sort((a, b) => a[1] - b[1]);
  spots.forEach(([u, w, k], i) => {
    const base = P(u, 1, w);
    const s = R.s(w);
    const wd = 26 * s * k;
    const sway = Math.sin(t / 40 + i) * 4 * s;
    trunks.push(
      <g key={i}>
        <ellipse cx={base.x} cy={base.y} rx={wd * 1.8} ry={wd * 0.35} fill="#000" opacity={0.35} />
        <path d={`M ${base.x - wd} ${base.y} Q ${base.x - wd * 0.7} ${base.y - 400 * s} ${base.x - wd * 0.6 + sway} -200 L ${base.x + wd * 0.6 + sway} -200 Q ${base.x + wd * 0.7} ${base.y - 400 * s} ${base.x + wd} ${base.y} Z`} fill={lerp(0, 1, w) > 0.5 ? '#141C22' : '#1E2A30'} />
        <path d={`M ${base.x + wd * 0.35} ${base.y} Q ${base.x + wd * 0.4} ${base.y - 400 * s} ${base.x + wd * 0.35 + sway} -200`} stroke="#9FC0FF" strokeWidth={4 * s} opacity={0.6} fill="none" />
        {[0, 1, 2].map((k2) => (
          <path key={k2} d={`M ${base.x + (k2 - 1) * wd * 1.5} ${base.y} q ${-10 * s} ${-30 * s} ${-26 * s} ${-36 * s} M ${base.x + (k2 - 1) * wd * 1.5} ${base.y} q ${12 * s} ${-28 * s} ${30 * s} ${-30 * s}`} stroke="#2E4A3A" strokeWidth={5 * s} fill="none" strokeLinecap="round" />
        ))}
      </g>,
    );
  });
  const pa = P(0.42, 1, 0);
  const pb = P(0.58, 1, 0);
  const pc = P(0.85, 1, 1);
  const pd = P(0.15, 1, 1);
  return (
    <g opacity={o}>
      <defs>
        <linearGradient id="fsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#060A18" />
          <stop offset="55%" stopColor="#12223A" />
          <stop offset="100%" stopColor="#1C2F3A" />
        </linearGradient>
        <linearGradient id="fshaft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CFE0FF" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#CFE0FF" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={-600} y={-600} width={2400} height={3200} fill="url(#fsky)" />
      <rect x={-600} y={R.vp.y + 300} width={2400} height={2400} fill="#151C1E" />
      <polygon points={`${pa.x},${pa.y} ${pb.x},${pb.y} ${pc.x},${pc.y} ${pd.x},${pd.y}`} fill="#8A8272" opacity={0.85} />
      <polygon points={`${pa.x},${pa.y} ${pb.x},${pb.y} ${pc.x},${pc.y} ${pd.x},${pd.y}`} fill="#CFE0FF" opacity={0.12} />
      <circle cx={R.vp.x} cy={R.vp.y - 60} r={260} fill="url(#kitMoonBloom)" opacity={0.6} />
      {trunks}
      {[[380, 0.9], [640, 0.7], [520, 1]].map(([x, k], i) => (
        <path key={i} d={`M ${x - 30} -200 L ${x + 30} -200 L ${x + 220 * k} 2000 L ${x - 120 * k} 2000 Z`} fill="url(#fshaft)" opacity={0.5 + 0.2 * Math.sin(t / 30 + i)} style={{ mixBlendMode: 'screen' }} />
      ))}
    </g>
  );
};

export type QuartoProps = {
  t: number;
  id?: string;
  veil?: number;
  clock?: string;
  lamp?: number; // desk lamp 0..1
  crossed?: number; // calendar days crossed
  mugs?: number; // mugs piled on the desk
  forest?: number;
  moon?: number;
  screen?: number; // laptop screen glow
};

export const Quarto: React.FC<QuartoProps> = ({ t, id = 'q', veil = 0.5, clock = '23:58', lamp = 1, crossed = 0, mugs = 1, forest = 0, moon = 1, screen = 1 }) => {
  const { P, Q } = R;
  const door = P(0, 0.62, 0.66);
  return (
    <g>
      <RoomShell r={R} id={id} wall={NIGHT.wall} side={NIGHT.side} floorC={NIGHT.floor} ceiling={NIGHT.ceiling} lines={NIGHT.lines} />
      {/* bare bulb on a cord, off */}
      {(() => {
        const c = P(0.5, 0, 0.5);
        return (
          <g>
            <path d={`M ${c.x} ${c.y - 200} L ${c.x + Math.sin(t / 50) * 4} ${c.y + 60}`} stroke="#0E0E18" strokeWidth={4} />
            <circle cx={c.x + Math.sin(t / 50) * 4} cy={c.y + 76} r={16} fill="#3A3A4A" />
          </g>
        );
      })()}
      {/* left wall: the door ajar, the hall light in the crack and on the floor */}
      <polygon points={Q([[0, 0.22, 0.5], [0, 0.22, 0.8], [0, 1, 0.8], [0, 1, 0.5]])} fill="#191B2B" />
      <polygon points={Q([[0, 0.25, 0.52], [0, 0.25, 0.56], [0, 1, 0.56], [0, 1, 0.52]])} fill="#FFC27A" opacity={0.85} />
      <polygon points={Q([[0, 0.25, 0.56], [0, 0.25, 0.78], [0, 1, 0.78], [0, 1, 0.56]])} fill="#3A3552" />
      <polygon points={Q([[0, 1, 0.52], [0.18, 1, 0.62], [0.24, 1, 0.7], [0, 1, 0.56]])} fill="#FFB46A" opacity={0.16} style={{ mixBlendMode: 'screen' }} />
      {/* cork board and posters over the bed */}
      <rect x={190} y={560} width={190} height={130} rx={6} fill="#8A6A48" stroke="#2A1E18" strokeWidth={6} />
      {Array.from({ length: 7 }).map((_, i) => (
        <g key={`ck${i}`} transform={`translate(${206 + rnd(8, i) * 140} ${574 + rnd(9, i) * 80}) rotate(${(rnd(10, i) - 0.5) * 18})`}>
          <rect width={38} height={30} fill={['#E9E2D2', '#C9D6E8', '#F2D9A0', '#E2B8B0'][i % 4]} />
          <circle cx={19} cy={4} r={3.5} fill="#C8553D" />
        </g>
      ))}
      <WallFrame x={410} y={570} w={120} h={160} art={1} />
      <WallCalendar x={260} y={730} w={110} crossed={crossed} />
      {/* the window: moon and city */}
      <BackWindow r={R} id={`${id}w`} t={t} x0={WIN.x0} x1={WIN.x1} y0={WIN.y0} y1={WIN.y1} sun={WIN.moon} cols={2} night />
      {/* bed */}
      <polygon points={Q([[BED.u0, 1, 0.02], [BED.u1 + 0.03, 1, 0.02], [BED.u1 + 0.03, 1, BED.w1 + 0.04], [BED.u0, 1, BED.w1 + 0.04]])} fill="#000" opacity={0.4} />
      <Box r={R} u={[BED.u0, BED.u1]} v={[0.56, 1]} w={[0, 0.03]} front="#3E3440" side="#2E2630" top="#4E4250" rim />
      <Box r={R} u={[BED.u0, BED.u1]} v={[0.86, 1]} w={[0.03, BED.w1]} front="#34292F" side="#281F24" top="#3E3038" />
      <Box r={R} u={[BED.u0 + 0.005, BED.u1 - 0.005]} v={[BED.top, 0.87]} w={[0.03, BED.w1 - 0.005]} front="#C9C2B4" side="#A9A296" top="#D8D2C4" />
      {[0.14, 0.36].map((u, i) => {
        const a = P(u - 0.1, BED.top, 0.05);
        const b = P(u + 0.1, BED.top, 0.05);
        return <path key={`pw${i}`} d={`M ${a.x} ${a.y} Q ${a.x - 8} ${a.y - 40} ${(a.x + b.x) / 2} ${a.y - 46} Q ${b.x + 8} ${b.y - 40} ${b.x} ${b.y} Z`} fill={i ? '#E1DACA' : '#D2CABA'} />;
      })}
      {/* a rumpled grey-blue blanket at the foot */}
      <polygon points={Q([[BED.u0, BED.top - 0.01, 0.22], [BED.u1 + 0.01, BED.top - 0.01, 0.2], [BED.u1 + 0.012, BED.top - 0.01, BED.w1 + 0.01], [BED.u0, BED.top - 0.01, BED.w1 + 0.01]])} fill="#46557E" />
      <polygon points={Q([[BED.u0, BED.top - 0.01, BED.w1 + 0.01], [BED.u1 + 0.012, BED.top - 0.01, BED.w1 + 0.01], [BED.u1 + 0.012, 0.95, BED.w1 + 0.01], [BED.u0, 0.95, BED.w1 + 0.01]])} fill="#38466C" />
      {/* nightstand between the bed and the desk, the alarm clock on it */}
      <FloorShadow r={R} u={[0.53, 0.66]} w={[0.01, 0.12]} />
      <Box r={R} u={[0.53, 0.66]} v={[0.8, 1]} w={[0.01, 0.12]} front="#4A3A36" top="#5E4A44" side="#3A2C29" rim />
      {(() => {
        const c = P(0.6, 0.8, 0.07);
        return <AlarmClock x={c.x} y={c.y} s={0.32 * R.s(0.07)} text={clock} />;
      })()}
      {/* the desk on the right wall, the stool, the gooseneck lamp, laptop, books, mugs */}
      <FloorShadow r={R} u={[DESK.u0, DESK.u1]} w={[DESK.w0, DESK.w1]} o={0.45} />
      <Box r={R} u={[DESK.u0, DESK.u1]} v={[DESK.v0, DESK.v0 + 0.04]} w={[DESK.w0, DESK.w1]} front="#6A4A3A" top="#7E5A46" side="#4E3628" rim />
      {[[DESK.u0 + 0.01, DESK.w1 - 0.02], [DESK.u0 + 0.01, DESK.w0 + 0.02]].map(([u, w], i) => (
        <Box key={`lg${i}`} r={R} u={[u, u + 0.02]} v={[DESK.v0 + 0.04, 1]} w={[w - 0.015, w]} front="#3E2A20" side="#2E2018" />
      ))}
      {(() => {
        const s = P(0.64, 0.84, 0.46);
        const k = R.s(0.46);
        return (
          <g>
            <ellipse cx={s.x} cy={P(0.64, 1, 0.46).y} rx={60 * k * 0.5} ry={10 * k * 0.5} fill="#000" opacity={0.4} />
            <path d={`M ${s.x - 22 * k} ${s.y} L ${s.x - 30 * k} ${P(0.64, 1, 0.46).y} M ${s.x + 22 * k} ${s.y} L ${s.x + 30 * k} ${P(0.64, 1, 0.46).y}`} stroke="#2A2026" strokeWidth={6 * k} />
            <ellipse cx={s.x} cy={s.y} rx={36 * k} ry={9 * k} fill="#5E4A44" />
          </g>
        );
      })()}
      {(() => {
        const a = deskTop(0.9, 0.44);
        return <LaptopBack x={a.x} y={a.y} w={150} glow={screen} tilt={0} />;
      })()}
      {(() => {
        const b = deskTop(0.93, 0.3);
        return <BookTower x={b.x} y={b.y} n={4} s={0.7} />;
      })()}
      {Array.from({ length: Math.max(0, Math.min(9, Math.floor(mugs))) }).map((_, i) => {
        const p = deskTop(0.78 + (i % 3) * 0.05, 0.5 + Math.floor(i / 3) * 0.04);
        return <Mug key={`mg${i}`} x={p.x} y={p.y - 20} rot={(rnd(11, i) - 0.5) * 10} steam={i === Math.floor(mugs) - 1 ? 1 : 0} f={t} />;
      })}
      {/* gooseneck lamp */}
      {(() => {
        const base = P(0.86, DESK.v0, 0.36);
        return (
          <g>
            <ellipse cx={base.x} cy={base.y - 4} rx={30} ry={8} fill="#1E1C24" />
            <path d={`M ${base.x} ${base.y - 6} Q ${base.x + 10} ${base.y - 120} ${LAMPV.x + 20} ${LAMPV.y - 20}`} stroke="#1E1C24" strokeWidth={7} fill="none" />
            <path d={`M ${LAMPV.x - 34} ${LAMPV.y - 30} L ${LAMPV.x + 30} ${LAMPV.y - 40} L ${LAMPV.x + 26} ${LAMPV.y + 4} L ${LAMPV.x - 30} ${LAMPV.y + 14} Z`} fill="#2B5450" />
            <ellipse cx={LAMPV.x - 2} cy={LAMPV.y + 9} rx={28} ry={8} fill={lamp > 0.2 ? '#FFF1CC' : '#4A4A4A'} transform={`rotate(-10 ${LAMPV.x} ${LAMPV.y})`} />
            <Cone d={`M ${LAMPV.x - 30} ${LAMPV.y + 12} L ${LAMPV.x + 26} ${LAMPV.y + 4} L ${LAMPV.x + 160} ${base.y + 30} L ${LAMPV.x - 220} ${base.y + 50} Z`} o={0.6 * lamp} />
          </g>
        );
      })()}
      {/* floor: rug, a pile of clothes, a backpack, trainers, paper balls, a plant */}
      <polygon points={Q([[0.22, 1, 0.5], [0.7, 1, 0.5], [0.7, 1, 0.86], [0.22, 1, 0.86]])} fill="#3E2E48" />
      <polygon points={Q([[0.25, 1, 0.53], [0.67, 1, 0.53], [0.67, 1, 0.83], [0.25, 1, 0.83]])} fill="none" stroke="#56426A" strokeWidth={5} />
      {(() => {
        const b = P(0.12, 1, 0.58);
        const s = R.s(0.58);
        return (
          <g>
            <ellipse cx={b.x} cy={b.y} rx={70 * s} ry={12 * s} fill="#000" opacity={0.35} />
            <path d={`M ${b.x - 66 * s} ${b.y} Q ${b.x - 50 * s} ${b.y - 46 * s} ${b.x - 6 * s} ${b.y - 40 * s} Q ${b.x + 40 * s} ${b.y - 60 * s} ${b.x + 64 * s} ${b.y} Z`} fill="#5A4A6A" />
            <path d={`M ${b.x - 30 * s} ${b.y - 20 * s} Q ${b.x} ${b.y - 44 * s} ${b.x + 40 * s} ${b.y - 18 * s}`} stroke="#433652" strokeWidth={5 * s} fill="none" />
            <path d={`M ${b.x - 10 * s} ${b.y - 4 * s} Q ${b.x + 30 * s} ${b.y - 24 * s} ${b.x + 50 * s} ${b.y - 2 * s} Z`} fill="#8A3A34" />
          </g>
        );
      })()}
      <FloorPlant r={R} u={0.95} w={0.12} size={0.9} />
      {[[0.4, 0.7], [0.55, 0.62], [0.32, 0.78]].map(([u, w], i) => {
        const p = P(u, 1, w);
        return <PaperBall key={`pb${i}`} x={p.x} y={p.y - 14 * R.s(w)} r={14 * R.s(w)} rot={i * 40} />;
      })}
      <Forest t={t} o={forest} />
      <LightVeil
        id={`${id}veil`}
        lights={[
          [LAMPV.x, LAMPV.y + 60, 460 * (0.2 + 0.8 * lamp)],
          [(WIN.x0 + WIN.x1) / 2, 760, 320 * moon],
          [door.x, door.y, 300],
          [P(0.85, 1, 0.5).x, P(0.85, 1, 0.5).y - 100, 360 * lamp],
        ]}
        o={veil}
      />
      <Glow x={LAMPV.x} y={LAMPV.y + 8} r={340} o={0.6 * lamp} />
      <Glow x={LAMPV.x} y={LAMPV.y + 10} r={120} o={0.55 * lamp} />
      <circle cx={WIN.moon.x} cy={WIN.moon.y} r={300} fill="url(#kitMoonBloom)" opacity={0.28 * moon} />
      <Glow x={door.x} y={door.y} r={180} o={0.3} />
      <Dust t={t} seed={13} x0={LAMPV.x - 260} y0={LAMPV.y} w={360} h={360} n={20} o={0.45 * lamp} />
      <Dust t={t} seed={17} x0={WIN.x0} y0={WIN.y1} w={WIN.x1 - WIN.x0} h={400} n={14} o={0.3 * moon} />
    </g>
  );
};

export { clamp };
