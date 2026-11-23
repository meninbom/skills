import React from 'react';
import { AbsoluteFill } from 'remotion';
import { KitDefs } from '../../engine/kit';
import { SetDefs } from '../../engine/light';
import { Vigia, vBase } from './hero';

export const VCast: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#3A3550' }}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <KitDefs />
      <SetDefs />
      <Vigia pose={{ ...vBase, x: 270, y: 700, scale: 1.4, expr: 'neutral' }} />
      <Vigia pose={{ ...vBase, x: 800, y: 700, scale: 1.4, yaw: 0.7, expr: 'tired', armR: { a: 60, b: 70 } }} x={{ tired: 1 }} />
      <Vigia pose={{ ...vBase, x: 270, y: 1500, scale: 1.4, yaw: -1, facing: -1, expr: 'shock', legL: { a: 25, b: -30 }, legR: { a: -20, b: 0 } }} />
      <Vigia pose={{ ...vBase, x: 800, y: 1500, scale: 1.4, expr: 'worried' }} x={{ tired: 0.8, age: 1 }} />
    </svg>
  </AbsoluteFill>
);
