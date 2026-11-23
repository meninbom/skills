import React from 'react';
import { clamp, lerp, kf, easeInOut, easeOut, easeIn, rnd } from '../../engine/anim';
import { Pose, poseAt } from '../../engine/rig';
import { Foreground, Moon } from '../../engine/kit';
import { Glow } from '../../engine/light';
import { Mug } from '../../engine/props';
import { FONT } from '../../engine/fonts';
import { Vigia, vBase, vJoints, vWorld, V_LEG, VExtra } from './hero';
import { Quarto, QUARTO, standV, bedSitV, deskSitV, WIN, LAMPV } from './quarto';
import { VTitle, DataCard } from './ui';

// The ten shots. Each is a pure function of its own clock t (frames, 30 fps). Camera: camV centres a world point at
// zoom s in the 1080x1920 frame; every shot's camera moves toward a destination (a face, a clock, a wide).

export const camV = (cx: number, cy: number, s: number) => `translate(540 960) scale(${s}) translate(${-cx} ${-cy})`;
const P = (o: Partial<Pose>): Pose => ({ ...vBase, ...o });
type SP = { t: number };

/** Hours awake on the global clock, keyed on global frames. */
export const HOURS: [number, number][] = [
  [0, 0], [96, 0], [150, 17], [264, 19.5], [290, 76], [350, 90], [380, 100], [492, 112], [520, 230], [600, 264.4], [1200, 264.4],
];
export const hoursAt = (f: number) => kf(f, HOURS, (x) => x);
const clockText = (h: number) => {
  const m = Math.floor((23 * 60 + 58 + h * 60) % (24 * 60));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

const handR = (pose: Pose) => vWorld(pose, rotL(vJoints(pose).armR.end, 0));
const rotL = (p: { x: number; y: number }, _d: number) => p;

/** A small phone in the hand, screen toward him, its cool light on the hood. */
const HandPhone: React.FC<{ x: number; y: number; s: number; rot?: number; on?: number }> = ({ x, y, s, rot = -10, on = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <circle r={70} fill="url(#g3cool)" opacity={0.6 * on} style={{ mixBlendMode: 'screen' }} />
    <rect x={-14} y={-26} width={28} height={50} rx={6} fill="#16151C" stroke="#3A3846" strokeWidth={2} />
    <rect x={-11} y={-22} width={22} height={42} rx={4} fill="#5A7AB8" opacity={on} />
  </g>
);

// ---------- S1: wide, the night it starts. Title. ----------
export const S1: React.FC<SP> = ({ t }) => {
  const k = easeInOut(clamp(t / 96));
  const b = bedSitV(0.4, 0.4);
  const swing = Math.sin(t / 5) * 16;
  const pose = poseAt(t, [
    { f: 0, p: P({ ...b, facing: 1, yaw: 0.45, tilt: 6, headTilt: 10, expr: 'neutral', look: 0.3, legL: { a: 76, b: -80 }, legR: { a: 70, b: -74 }, armR: { a: 28, b: 118 }, armL: { a: 20, b: 60 } }) },
    { f: 44, p: { headTilt: 12, tilt: 8 } },
    { f: 60, p: { headTilt: -4, tilt: 2, look: 0.8, expr: 'happy', armR: { a: 22, b: 70 } } },
    { f: 96, p: { headTilt: -2, look: 0.9 } },
  ]);
  pose.legR = { a: pose.legR.a + swing * 0.4, b: pose.legR.b + swing };
  const h = handR(pose);
  return (
    <g transform={camV(lerp(540, 470, k), lerp(1010, 1080, k), lerp(1.0, 1.32, k))}>
      <Quarto t={t} id="q1" clock={clockText(0) === '23:58' && t > 70 ? '23:59' : '23:58'} mugs={1} crossed={0} />
      <Vigia pose={pose} rimId="rimR" />
      <HandPhone x={h.x} y={h.y - 10} s={pose.scale} />
      <Foreground blur={10}>
        <path d="M -200 1800 Q 200 1700 520 1780 L 520 2400 L -200 2400 Z" fill="#0A0810" opacity={0.9} />
      </Foreground>
    </g>
  );
};
export const S1Title: React.FC<SP> = ({ t }) => <VTitle t={t - 4} small="E SE VOCÊ FICASSE" big={['11 DIAS', 'SEM DORMIR?']} y={300} out={60} />;

// ---------- S2: macro insert, the clock racing through the first 17 hours ----------
export const S2: React.FC<SP & { f: number }> = ({ t, f }) => {
  const H = hoursAt(f);
  const day = clamp(Math.sin(((H - 6) / 24) * Math.PI * 2) * 1.4);
  const c = QUARTO.P(0.6, 0.8, 0.07);
  const k = t / 60;
  return (
    <g>
      <g transform={camV(c.x + lerp(-40, 20, k), c.y - 50, lerp(4.6, 5.2, k))}>
        <Quarto t={t * 6} id="q2" clock={clockText(H)} mugs={2} lamp={1 - 0.6 * day} />
        <rect x={-500} y={-500} width={3000} height={3000} fill="#FFD7A0" opacity={0.1 * day} style={{ mixBlendMode: 'screen' }} />
      </g>
    </g>
  );
};

// ---------- S3: medium at the desk, 17 h: the head drops (a microsleep) and snaps back ----------
export const S3: React.FC<SP> = ({ t }) => {
  const d = deskSitV();
  const pose = poseAt(t, [
    { f: 0, p: P({ ...d, facing: 1, yaw: 0.75, tilt: 12, headTilt: 6, expr: 'tired', legL: { a: 82, b: -86 }, legR: { a: 76, b: -80 }, armR: { a: 50, b: 50 }, armL: { a: -30, b: -50 }, sway: 0 }) },
    { f: 34, p: { headTilt: 14, tilt: 15 } },
    { f: 50, p: { headTilt: 34, tilt: 20, blink: 1 }, ease: easeIn },
    { f: 56, p: { headTilt: -8, tilt: 4, blink: 0, expr: 'shock', sway: 18, armR: { a: 60, b: 30 } }, ease: easeOut },
    { f: 76, p: { headTilt: 2, tilt: 8, expr: 'tired', sway: 0 } },
    { f: 108, p: { headTilt: 8, tilt: 11 } },
  ]);
  const k = easeInOut(clamp(t / 108));
  const head = vWorld(pose, { x: 0, y: -170 });
  const shake = t >= 56 && t < 62 ? Math.sin(t * 3) * 8 : 0;
  return (
    <g>
      <g transform={camV(head.x - 20 + shake, head.y + 170, lerp(1.55, 1.75, k))}>
        <Quarto t={t} id="q3" mugs={3} crossed={0} clock="16:58" />
        <Vigia pose={pose} rimId="rimR" x={{ tired: 0.4 }} />
        <Foreground blur={16}>
          <g transform={`translate(${head.x - 300} ${head.y + 420}) scale(2.4)`}>
            <Mug x={0} y={0} rot={-6} steam={0} f={t} />
          </g>
        </Foreground>
      </g>
      <DataCard t={t - 12} label="17 HORAS ACORDADO" lines={['o desempenho já é igual', 'ao de quem tem 0,05%', 'de álcool no sangue']} y={1240} size={58} />
    </g>
  );
};

// ---------- S4: day 4, low angle: his lamp shadow on the wall turns into a football player ----------
const Player: React.FC = () => (
  // a flat silhouette: helmet with face mask, shoulder pads, arm cocked with a ball
  <g>
    <circle cx={0} cy={-300} r={70} />
    <path d="M 40 -300 L 96 -296 M 40 -276 L 92 -270 M 60 -320 L 60 -250" stroke="#000" strokeWidth={10} />
    <path d="M -150 -210 Q -110 -250 0 -240 Q 110 -250 150 -210 L 120 -150 L 80 -150 L 70 0 L -70 0 L -80 -150 L -120 -150 Z" />
    <path d="M 120 -190 L 190 -300 L 220 -380" stroke="#000" strokeWidth={46} strokeLinecap="round" fill="none" />
    <ellipse cx={232} cy={-410} rx={44} ry={26} transform="rotate(-40 232 -410)" />
    <path d="M -120 -180 L -170 -60" stroke="#000" strokeWidth={46} strokeLinecap="round" />
    <path d="M -50 0 L -80 240 M 50 0 L 90 240" stroke="#000" strokeWidth={56} strokeLinecap="round" />
  </g>
);
export const S4: React.FC<SP> = ({ t }) => {
  const st = standV(0.5, 0.6);
  const pose = poseAt(t, [
    { f: 0, p: P({ ...st, facing: -1, yaw: -0.35, tilt: -2, expr: 'tired', armR: { a: 14, b: -6 }, armL: { a: 14, b: -6 }, legL: { a: 4, b: 0 }, legR: { a: -4, b: 0 } }) },
    { f: 22, p: { tilt: 0, expr: 'tired' } },
    { f: 34, p: { expr: 'happy', tilt: -6, armR: { a: 140, b: 30 }, armL: { a: 40, b: -20 }, squash: 0.05, legL: { a: 18, b: 0 }, legR: { a: -14, b: 0 }, headTilt: -8 }, ease: easeOut },
    { f: 60, p: { armR: { a: 150, b: 40 }, tilt: -9, squash: 0 } },
    { f: 90, p: { armR: { a: 146, b: 34 }, tilt: -7 } },
  ]);
  const m = easeInOut(clamp((t - 20) / 22));
  const k = easeInOut(clamp(t / 90));
  const sh = { x: 330, y: 1060 };
  return (
    <g>
      <g transform={camV(lerp(520, 470, k), lerp(1030, 990, k), lerp(1.35, 1.5, k))}>
        <Quarto t={t} id="q4" mugs={6} crossed={3} clock="21:40" />
        {/* the lamp's pool on the back wall, then his shadow in it: his outline first, then the player grows out of it */}
        <ellipse cx={sh.x + 20} cy={sh.y - 200} rx={300} ry={330} fill="url(#g3warm)" opacity={0.55} style={{ mixBlendMode: 'screen' }} />
        <g transform={`translate(${sh.x} ${sh.y}) scale(${lerp(0.8, 1.15, m)})`} opacity={0.85} fill="#0C0812" filter="url(#blur3)">
          <g opacity={1 - m}>
            <ellipse cx={0} cy={-300} rx={56} ry={70} />
            <path d="M -60 -230 L 60 -230 L 50 0 L -50 0 Z" />
            <path d="M -30 0 L -34 240 M 30 0 L 34 240" stroke="#000" strokeWidth={40} />
          </g>
          <g opacity={m}>
            <Player />
          </g>
        </g>
        <Vigia pose={pose} rimId="rimL" x={{ tired: 0.6 }} />
      </g>
      <DataCard t={t - 30} label="DIA 4" lines={['jurava ser um jogador', 'famoso de futebol', 'americano']} y={1270} />
    </g>
  );
};

// ---------- S5: day 5, the room becomes a forest path; he walks into it ----------
const walkV = (x: number, phase: number, floorY: number, scale: number, extra: Partial<Pose> = {}): Pose => {
  const s = Math.sin(phase);
  return {
    ...vBase,
    x,
    y: floorY - V_LEG * scale - Math.abs(Math.cos(phase)) * 6 * scale,
    scale,
    facing: 1,
    yaw: 0.85,
    tilt: 4,
    headTilt: 2 * Math.sin(phase * 2),
    sway: 10 * Math.sin(phase + 0.8),
    legL: { a: 24 * s, b: -Math.max(0, 36 * Math.sin(phase + 1.2)) },
    legR: { a: -24 * s, b: -Math.max(0, 36 * Math.sin(phase + 1.2 + Math.PI)) },
    armL: { a: 18 * s, b: 14 + 10 * Math.abs(s) },
    armR: { a: -18 * s, b: 14 + 10 * Math.abs(s) },
    ...extra,
  };
};
export const S5: React.FC<SP> = ({ t }) => {
  const fo = easeInOut(clamp((t - 6) / 34));
  const k = easeInOut(clamp(t / 138));
  const st = standV(0.3, 0.7);
  const x = lerp(st.x - 40, st.x + 260, t / 138);
  const floorY = st.y + V_LEG * st.scale + 10 * st.scale;
  const lookUp = Math.sin(t / 22) * 0.5;
  const pose = walkV(x, t * 0.22, floorY, st.scale, { expr: t > 30 ? 'shock' : 'tired', look: lookUp, headTilt: -6 + 4 * Math.sin(t / 18) });
  return (
    <g>
      <g transform={camV(lerp(540, x, k), lerp(1000, 1080, k), lerp(1.0, 1.18, k))}>
        <Quarto t={t} id="q5" mugs={8} crossed={4} forest={fo} lamp={1 - 0.7 * fo} veil={0.5 - 0.3 * fo} />
        <Vigia pose={pose} rimId="rimBlue" x={{ tired: 0.75 }} />
        <Foreground blur={16}>
          <g opacity={fo}>
            <path d={`M 860 2400 Q 900 1500 940 600 L 1120 600 Q 1100 1500 1180 2400 Z`} fill="#06080C" />
            <path d="M -40 2400 L -40 1900 Q 120 1820 260 1950 L 300 2400 Z" fill="#0A1210" />
          </g>
        </Foreground>
      </g>
      <DataCard t={t - 40} label="DIA 5" lines={['via uma trilha de', 'floresta no lugar', 'da própria casa']} y={1290} />
    </g>
  );
};

// ---------- S6: day 11, the subtraction test: 100 minus 7, again and again, until it stops ----------
export const S6: React.FC<SP> = ({ t }) => {
  const rows = [100, 93, 86, 79, 72, 65];
  const step = 13;
  const shown = Math.min(rows.length, Math.floor((t - 8) / step) + 1);
  const last = Math.max(0, shown - 1);
  const camY = kf(t, [[0, 520], [8 + step * 5, 520 + 5 * 120], [126, 520 + 5 * 120 + 40]]);
  const fade = clamp((t - 96) / 24);
  const cursor = Math.floor(t / 8) % 2 === 0;
  return (
    <g>
      <defs>
        <pattern id="s6grid" width={40} height={40} patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1C2C44" strokeWidth={1.5} />
        </pattern>
        <pattern id="s6grid5" width={200} height={200} patternUnits="userSpaceOnUse">
          <path d="M 200 0 L 0 0 0 200" fill="none" stroke="#1C2C44" strokeWidth={3} />
        </pattern>
        <radialGradient id="s6glow">
          <stop offset="0%" stopColor="#2A4466" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#2A4466" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-100} y={-100} width={1300} height={2200} fill="#101A2A" />
      <circle cx={540} cy={900} r={900} fill="url(#s6glow)" />
      <g transform={`translate(0 ${-camY * 0.35})`}>
        <rect x={-100} y={-200} width={1300} height={3000} fill="url(#s6grid)" />
        <rect x={-100} y={-200} width={1300} height={3000} fill="url(#s6grid5)" />
      </g>
      <g transform={`translate(0 120) translate(330 1000) scale(${lerp(0.96, 1.06, easeInOut(clamp(t / 126)))}) translate(-330 -1000)`}>
        <text x={540} y={470} textAnchor="middle" fontFamily={FONT.ui} fontSize={44} letterSpacing={6} fill="#7E8DA6">
          TESTE: 100, MENOS 7...
        </text>
        {rows.slice(0, shown).map((v, i) => {
          const lt = clamp((t - 8 - i * step) / 6);
          const y = 560 + i * 90;
          const o = i === last ? 1 : 0.55 + 0.45 * (1 - (last - i) / 6);
          return (
            <g key={i} opacity={lt * o * (1 - fade * (i === last ? 0 : 0.7))} transform={`translate(0 ${(1 - easeOut(lt)) * 20})`}>
              <text x={420} y={y} textAnchor="end" fontFamily={FONT.ui} fontSize={92} fill="#F6EFE3">
                {v}
              </text>
              {i < rows.length - 1 || t < 8 + step * 6 ? null : null}
              {i > 0 ? (
                <text x={470} y={y} fontFamily={FONT.ui} fontSize={48} fill="#7E8DA6">
                  −7
                </text>
              ) : null}
            </g>
          );
        })}
        {shown === rows.length ? (
          <g>
            <text x={420} y={560 + rows.length * 90} textAnchor="end" fontFamily={FONT.ui} fontSize={92} fill="#F6EFE3" opacity={0.9}>
              {cursor ? '_' : ' '}
            </text>
            <text x={470} y={560 + rows.length * 90} fontFamily={FONT.ui} fontSize={48} fill="#7E8DA6" opacity={1 - fade}>
              −7
            </text>
          </g>
        ) : null}
        {/* a hand-drawn line under the last number, drawing on: the place he stopped */}
        {shown === rows.length ? (
          <path d={`M 230 ${560 + 5 * 90 + 24} Q 330 ${560 + 5 * 90 + 34} 440 ${560 + 5 * 90 + 22}`} stroke="#F6EFE3" strokeWidth={6} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - easeOut(clamp((t - 8 - step * 5 - 6) / 10))} />
        ) : null}
      </g>
      <DataCard t={t - 74} label="DIA 11" lines={['parou no 65. tinha', 'esquecido o que', 'estava fazendo']} y={1340} />
    </g>
  );
};

// ---------- S7: the reveal over the room: it happened, 264.4 hours ----------
export const S7: React.FC<SP> = ({ t }) => {
  const b = bedSitV(0.42, 0.4);
  const sway = Math.sin(t / 14) * 5;
  const pose = poseAt(t, [
    { f: 0, p: P({ ...b, facing: 1, yaw: 0.15, tilt: 6, headTilt: 12, expr: 'tired', legL: { a: 76, b: -80 }, legR: { a: 72, b: -76 }, armR: { a: 18, b: 40 }, armL: { a: 18, b: 40 } }) },
    { f: 120, p: { headTilt: 16, tilt: 8 } },
  ]);
  pose.tilt += sway;
  pose.headTilt += sway * 0.8;
  const k = easeInOut(clamp(t / 120));
  return (
    <g>
      <g transform={camV(lerp(470, 540, k), lerp(1040, 1000, k), lerp(1.7, 1.08, k))}>
        <Quarto t={t} id="q7" mugs={9} crossed={11} clock="06:25" lamp={0.85} />
        <Vigia pose={pose} rimId="rimR" x={{ tired: 1 }} />
      </g>
      <DataCard t={t - 8} label="ISSO ACONTECEU" lines={['Randy Gardner, 17 anos,', 'San Diego, 1964:', '264,4 horas acordado']} y={1240} size={58} />
    </g>
  );
};

// ---------- S8: he tips back onto the bed, the lamp clicks off ----------
// lying on the mattress: body along the bed, knees at the front edge, shins hanging down
const lyingPose = (sc: number) => {
  const edge = QUARTO.P(0.5, 0.78, 0.4);
  const px = edge.x - 176 * sc; // pivot (chest) so the knees reach the edge
  const top = edge.y;
  return { x: px, y: top - 34 * sc + 90 * sc };
};
export const S8: React.FC<SP> = ({ t }) => {
  const b = bedSitV(0.42, 0.4);
  const ly = lyingPose(b.scale);
  const pose = poseAt(t, [
    { f: 0, p: P({ ...b, facing: 1, yaw: 0.15, tilt: 8, headTilt: 14, expr: 'tired', legL: { a: 76, b: -80 }, legR: { a: 72, b: -76 }, armR: { a: 18, b: 40 }, armL: { a: 18, b: 40 } }) },
    { f: 12, p: { tilt: 10, headTilt: 18, blink: 1 } },
    { f: 30, p: { x: ly.x, y: ly.y, spin: -90, tilt: 0, headTilt: 0, yaw: 0, legL: { a: 4, b: -84 }, legR: { a: -2, b: -80 }, armR: { a: 8, b: 10 }, armL: { a: -6, b: 12 }, blink: 1 }, ease: easeIn },
    { f: 35, p: { y: ly.y - 6, squash: 0.05 }, ease: easeOut },
    { f: 42, p: { y: ly.y, squash: 0 } },
  ]);
  const lamp = t < 50 ? 1 : t < 52 ? 0.4 : 0;
  const k = easeInOut(clamp(t / 102));
  const breathe = t > 50 ? Math.sin(t / 12) * 2 : 0;
  pose.y += breathe;
  return (
    <g>
      <g transform={camV(lerp(440, 360, k), lerp(1040, 1130, k), lerp(1.45, 1.75, k))}>
        <Quarto t={t} id="q8" mugs={9} crossed={11} clock="06:27" lamp={lamp} veil={lamp > 0.5 ? 0.5 : 0.62} />
        <Vigia pose={pose} rimId={lamp > 0.5 ? 'rimR' : 'rimBlue'} x={{ tired: 1 }} shadow={0} />
      </g>
      <DataCard t={t - 54} label="DEPOIS" lines={['dormiu quase 15 horas', 'e parecia recuperado']} y={1270} />
    </g>
  );
};

// ---------- S9: the window, time running: 1964 to 2007 ----------
export const S9: React.FC<SP> = ({ t }) => {
  const k = easeInOut(clamp(t / 78));
  const yr = Math.round(lerp(1964, 2007, easeInOut(clamp((t - 6) / 60))));
  const cyc = 0.5 + 0.5 * Math.sin(t * 0.55);
  const cx = (WIN.x0 + WIN.x1) / 2;
  const cy = (WIN.y0 + WIN.y1) / 2;
  const arc = (t * 0.55) / (Math.PI * 2) + 0.25;
  const ph = arc - Math.floor(arc);
  const mx = lerp(WIN.x0 - 30, WIN.x1 + 30, ph);
  const my = WIN.y0 + 70 + Math.pow((ph - 0.5) * 2, 2) * 180;
  const W = WIN.x1 - WIN.x0;
  const H = WIN.y1 - WIN.y0;
  return (
    <g>
      <g transform={camV(cx, cy + 60, lerp(2.3, 2.7, k))}>
        <Quarto t={t * 8} id="q9" mugs={0} crossed={0} lamp={0.35} clock="00:00" />
        <defs>
          <clipPath id="s9clip">
            <rect x={WIN.x0} y={WIN.y0} width={W} height={H} />
          </clipPath>
          <linearGradient id="s9day" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5E8ED0" />
            <stop offset="100%" stopColor="#F2B57A" />
          </linearGradient>
        </defs>
        <g clipPath="url(#s9clip)">
          <rect x={WIN.x0} y={WIN.y0} width={W} height={H} fill="#0C1430" />
          <rect x={WIN.x0} y={WIN.y0} width={W} height={H} fill="url(#s9day)" opacity={cyc} />
          {cyc > 0.5 ? <circle cx={mx} cy={my} r={24} fill="#FFF1C8" /> : <Moon x={mx} y={my} r={18} bloom={0.4} />}
          {/* the far city grows taller over the decades */}
          {Array.from({ length: 9 }).map((_, i) => {
            const hgt = (40 + rnd(21, i) * 90) * (0.6 + 0.6 * clamp((yr - 1964) / 43) * rnd(22, i));
            return <rect key={i} x={WIN.x0 + i * (W / 9)} y={WIN.y1 - hgt} width={W / 9 + 1} height={hgt} fill={cyc > 0.5 ? '#4A4660' : '#141634'} />;
          })}
        </g>
        <rect x={WIN.x0 - 12} y={WIN.y0 + H * 0.32} width={W + 24} height={7} fill="#1E1824" />
        <rect x={WIN.x0 + W / 2 - 5} y={WIN.y0} width={10} height={H} fill="#1E1824" />
        <rect x={-500} y={-500} width={3000} height={3000} fill="#FFD7A0" opacity={0.1 * cyc} style={{ mixBlendMode: 'screen' }} />
      </g>
      <g transform="translate(540 1330)">
        <rect x={-300} y={-120} width={600} height={190} rx={40} fill="#0B0816" opacity={0.7} />
        <text x={0} y={34} textAnchor="middle" fontFamily={FONT.ui} fontSize={128} fill="#F6EFE3">
          {yr}
        </text>
      </g>
    </g>
  );
};

// ---------- S10: 2007, 3 a.m., older, sitting up in bed, eyes open in the dark ----------
export const S10: React.FC<SP> = ({ t }) => {
  const b = bedSitV(0.22, 0.16);
  const pose = P({
    ...b, y: b.y + 10, facing: 1, yaw: 0.2, tilt: -4, headTilt: kf(t, [[0, -2], [80, 2], [150, -3]]), expr: 'neutral',
    look: kf(t, [[0, 0.5], [36, 0.5], [50, -0.5], [90, -0.5], [104, 0.2], [150, 0.2]]),
    legL: { a: 86, b: -4 }, legR: { a: 84, b: -2 }, armR: { a: 8, b: 26 }, armL: { a: 8, b: 26 },
  });
  pose.blink = t >= 64 && t < 68 ? 1 : 0;
  pose.y += Math.sin(t / 16) * 2;
  const head = vWorld(pose, { x: 0, y: -192 });
  const k = easeInOut(clamp(t / 150));
  const clock = t < 104 ? '03:12' : '03:13';
  const c = QUARTO.P(0.6, 0.8, 0.07);
  const { P: QP } = QUARTO;
  const d1 = QP(0.02, 0.76, 0.2);
  const d2 = QP(0.5, 0.76, 0.2);
  const d3 = QP(0.5, 0.95, 0.45);
  const d4 = QP(0.02, 0.95, 0.45);
  return (
    <g>
      <g transform={camV(lerp(head.x + 80, head.x + 30, k), lerp(head.y + 120, head.y + 60, k), lerp(2.0, 2.8, k))}>
        <Quarto t={t} id="q10" mugs={0} crossed={0} clock={clock} lamp={0} veil={0.62} />
        <Vigia pose={pose} rimId="rimBlue" x={{ tired: 0.7, age: 1, eyeGlow: 0.6 }} shadow={0} />
        {/* the blanket over his legs, up to the waist */}
        <path d={`M ${d1.x} ${d1.y + 20} Q ${(d1.x + d2.x) / 2} ${d1.y - 30} ${d2.x} ${d2.y + 10} L ${d3.x} ${d3.y} L ${d4.x} ${d4.y} Z`} fill="#3E4C78" />
        <path d={`M ${d1.x} ${d1.y + 20} Q ${(d1.x + d2.x) / 2} ${d1.y - 30} ${d2.x} ${d2.y + 10}`} stroke="#A9C6FF" strokeWidth={3} fill="none" opacity={0.5} />
        <Glow x={c.x} y={c.y - 20} r={160} kind="red" o={0.35} />
      </g>
      <DataCard t={t - 14} label="2007" lines={['começou a ter insônia', 'séria, e culpa o', 'experimento']} y={1250} out={84} />
      <DataCard t={t - 92} lines={['Desta vez,', 'sem querer.']} y={1260} size={96} w={700} />
    </g>
  );
};

export { rnd };
