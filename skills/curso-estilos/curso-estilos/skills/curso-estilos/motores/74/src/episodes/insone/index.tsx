import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { clamp } from '../../engine/anim';
import { KitDefs } from '../../engine/kit';
import { SetDefs } from '../../engine/light';
import { S1, S1Title, S2, S3, S4, S5, S6, S7, S8, S9, S10, hoursAt } from './shots';
import { AwakeHud } from './ui';

// The vertical episode: a hand-written edit (mute piece, no voice to anchor cuts), each segment showing one shot on its
// own clock. The "hours awake" readout is a layer on the GLOBAL clock (the engine's LookDef idea), so it never restarts
// at a cut. Grade per shot, then vignette and grain on twos.

type Seg = { id: string; a: number; b: number; key: number; grade?: string };
export const SEGS: Seg[] = [
  { id: 'S1', a: 0, b: 96, key: 70 },
  { id: 'S2', a: 96, b: 156, key: 30 },
  { id: 'S3', a: 156, b: 264, key: 60 },
  { id: 'S4', a: 264, b: 354, key: 70 },
  { id: 'S5', a: 354, b: 492, key: 90, grade: 'saturate(0.9) hue-rotate(-6deg)' },
  { id: 'S6', a: 492, b: 618, key: 110 },
  { id: 'S7', a: 618, b: 738, key: 90, grade: 'saturate(0.55) brightness(0.95)' },
  { id: 'S8', a: 738, b: 840, key: 80 },
  { id: 'S9', a: 840, b: 918, key: 40 },
  { id: 'S10', a: 918, b: 1068, key: 120, grade: 'saturate(0.8)' },
];
export const TOTAL = SEGS[SEGS.length - 1].b;
export const BOARD_N = SEGS.length;

const SHOTS: Record<string, React.FC<{ t: number; f: number }>> = { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10 };

const Grade: React.FC<{ f: number }> = ({ f }) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
    <defs>
      <radialGradient id="vVig" cx="50%" cy="50%" r="72%">
        <stop offset="55%" stopColor="#000" stopOpacity={0} />
        <stop offset="100%" stopColor="#000" stopOpacity={0.5} />
      </radialGradient>
      <filter id="vGrain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={Math.floor(f / 2) % 97} />
        <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.07 0" />
      </filter>
    </defs>
    <rect width="1080" height="1920" fill="url(#vVig)" />
    <rect width="1080" height="1920" filter="url(#vGrain)" />
  </svg>
);

const Frame: React.FC<{ f: number; seg: Seg; t: number; hud: boolean }> = ({ f, seg, t, hud }) => {
  const Shot = SHOTS[seg.id];
  const hudO = hud ? clamp((f - 60) / 10) * (1 - clamp((f - 726) / 12)) : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: '#0B0A14' }}>
      <AbsoluteFill style={{ filter: seg.grade }}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          <KitDefs />
          <SetDefs />
          <Shot t={t} f={f} />
        </svg>
      </AbsoluteFill>
      <Grade f={f} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
        {seg.id === 'S1' ? <S1Title t={t} /> : null}
        <AwakeHud f={f} hours={hoursAt(f)} o={hudO} />
      </svg>
    </AbsoluteFill>
  );
};

export const Insone: React.FC = () => {
  const f = useCurrentFrame();
  const seg = SEGS.find((s) => f >= s.a && f < s.b) ?? SEGS[SEGS.length - 1];
  return <Frame f={f} seg={seg} t={f - seg.a} hud />;
};

export const InsoneBoard: React.FC = () => {
  const i = useCurrentFrame();
  const seg = SEGS[Math.min(i, SEGS.length - 1)];
  return <Frame f={seg.a + seg.key} seg={seg} t={seg.key} hud />;
};
