import React from 'react';
import { Composition } from 'remotion';
import './engine/fonts';
import { Insone, InsoneBoard, TOTAL, BOARD_N } from './episodes/insone';
import { VCast } from './episodes/insone/cast';

// Estilo 74: "E se você ficasse 11 dias sem dormir?" Vertical 1080x1920, 30 fps, mudo.
export const Root: React.FC = () => (
  <>
    <Composition id="Insone" component={Insone} durationInFrames={TOTAL} width={1080} height={1920} fps={30} />
    <Composition id="InsoneBoard" component={InsoneBoard} durationInFrames={BOARD_N} width={1080} height={1920} fps={30} />
    <Composition id="VCast" component={VCast} durationInFrames={1} width={1080} height={1920} fps={30} />
  </>
);
