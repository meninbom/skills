// v4 item 14: camadas de photo parallax (sem dependencia de comp.tsx, para nao criar ciclo de import)
import React from 'react';
import {Img, staticFile} from 'remotion';
import {clamp} from './util';

// ---------------------------------------------------------------- 14 · photo parallax sutil
// 2 camadas (fundo preenchido + sujeito recortado com borda de foto impressa, prep/parallax_v4.py).
// Deslocamento relativo <= 2% da largura no plano inteiro; o sujeito anda 3 quadros depois do fundo.
export const PLX = new Set(['josef1937', 'jaquet1', 'televox1928', 'briullov_detalhe']);
export const Camadas: React.FC<{doc: string; w: number; h: number; t: number; t0: number; t1: number}> = ({doc, w, h, t, t0, t1}) => {
  const T = Math.max(0.6, t1 - t0);
  const ub = clamp((t - t0) / T);
  const uf = clamp((t - t0 - 3 / 24) / T);
  const sb = 1 + 0.010 * ub;
  const sf = 1 + 0.026 * uf;
  const dx = -0.005 * w * uf;
  const st: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: w, height: h};
  return (
    <div style={{...st, overflow: 'hidden'}}>
      <Img src={staticFile(`v4/plx/${doc}_fundo.jpg`)} style={{...st, transform: `scale(${sb})`, transformOrigin: '50% 50%'}} />
      <Img src={staticFile(`v4/plx/${doc}_suj.png`)} style={{...st, transform: `translateX(${dx}px) scale(${sf})`, transformOrigin: '50% 62%'}} />
    </div>
  );
};

