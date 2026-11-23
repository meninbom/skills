// DEMO de 3 s: os MESMOS componentes do episodio (Plano, camera, texto atras do heroi, papel que cai, grao, vinheta, flash)
// rodando sobre imagens-placeholder geradas por codigo (tools/placeholders.mjs). Sem audio, sem fonte comercial, sem midia de terceiros.
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import roteiro from './data/demo.json';
import {Cena, ClipeSeq, Flash, Grao, Vinheta} from './lib/comp';
import {Plano} from './Robot';
import {H, W} from './lib/util';

export const DEMO_DUR = 3.0;
export const DEMO_FPS = 24;
const CENAS = roteiro.cenas as unknown as Cena[];

export const Demo: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#15171A', width: W, height: H}}>
      {CENAS.map((c) => (
        <ClipeSeq key={c.n} c={c}>
          <Plano c={c} />
        </ClipeSeq>
      ))}
      <Vinheta />
      <Grao forca={0.5} />
      <Flash t={f / fps} tempos={roteiro.flashes} />
    </AbsoluteFill>
  );
};
