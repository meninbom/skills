import React from 'react';
import {Composition} from 'remotion';
import {Robot} from './Robot';
import {DUR, DUR_C} from './lib/util';
import {V4_PADRAO} from './V4';
import {Demo, DEMO_DUR, DEMO_FPS} from './Demo';

// v4: inputProps {fecho: 'a'|'b'|'c', rab: 'b'|'c', elenco: 'b'|'c', amador: 'proni'|'cz'} escolhem as opcoes da pagina de aprovacao.
// Robot = 24 fps, a cadencia do H3 e do tratamento (final). Prev30 = previa a 30 fps (render com --scale 0.5).
export const RemotionRoot: React.FC = () => (
  <>
    {/* Demo = 3 s com imagens-placeholder geradas por codigo (npm run demo). Robot/Prev30 = o episodio real: precisam da SUA pasta public. */}
    <Composition id="Demo" component={Demo} width={1080} height={1920} fps={DEMO_FPS} durationInFrames={Math.round(DEMO_DUR * DEMO_FPS)} />
    <Composition id="Robot" component={Robot} width={1080} height={1920} fps={24} durationInFrames={Math.round(DUR * 24)} defaultProps={V4_PADRAO}
      calculateMetadata={({props}) => ({durationInFrames: Math.round((props.fecho === 'c' ? DUR_C : DUR) * 24)})} />
    <Composition id="Prev30" component={Robot} width={1080} height={1920} fps={30} durationInFrames={Math.round(DUR * 30)} defaultProps={V4_PADRAO}
      calculateMetadata={({props}) => ({durationInFrames: Math.round((props.fecho === 'c' ? DUR_C : DUR) * 30)})} />
  </>
);
