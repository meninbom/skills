import React from 'react';
import { clamp, backOut, easeOut, kf, easeInOut } from '../../engine/anim';
import { FONT } from '../../engine/fonts';

// On-screen text for the vertical frame: the title, the global "hours awake" readout, and data cards.
// One look: dark translucent pill, cream text. No coloured word highlights (the studio rule); hierarchy is size/weight.

export const T = { pill: '#0B0816', text: '#F6EFE3', dim: '#B9B2C6', ring: '#FF8A3D' };

/** Title in the upper third: small line, then big line(s), popping in. */
export const VTitle: React.FC<{ t: number; small: string; big: string[]; y?: number; out?: number }> = ({ t, small, big, y = 330, out = 1e9 }) => {
  const pop = (d: number) => backOut(clamp((t - d) / 9));
  const o = 1 - clamp((t - out) / 8);
  if (t < 0 || o <= 0) return null;
  return (
    <g opacity={o}>
      <g transform={`translate(540 ${y}) scale(${pop(2)})`}>
        <text textAnchor="middle" fontFamily={FONT.title} fontWeight={600} fontSize={58} letterSpacing={3} fill={T.text} stroke="#120C1E" strokeWidth={9} paintOrder="stroke">
          {small}
        </text>
      </g>
      {big.map((line, i) => (
        <g key={i} transform={`translate(540 ${y + 118 + i * 116}) scale(${pop(6 + i * 3)})`}>
          <text textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={112} fill={T.text} stroke="#120C1E" strokeWidth={14} paintOrder="stroke" style={{ filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.55))' }}>
            {line}
          </text>
        </g>
      ))}
    </g>
  );
};

/** The readout that runs across shots on one global clock: hours awake and the day, with a ring for the 11 days. */
export const AwakeHud: React.FC<{ f: number; hours: number; o: number }> = ({ f, hours, o }) => {
  if (o <= 0.001) return null;
  const day = Math.min(11, Math.floor(hours / 24) + 1);
  const p = clamp(hours / 264.4);
  const r = 46;
  const hTxt = hours >= 264 ? '264,4' : String(Math.floor(hours)).padStart(3, '0');
  const blink = Math.floor(f / 15) % 2 ? 1 : 0.35;
  return (
    <g opacity={o} transform="translate(80 250)">
      <rect x={0} y={0} width={560} height={124} rx={62} fill={T.pill} opacity={0.62} />
      <circle cx={62} cy={62} r={r} fill="none" stroke={T.text} strokeWidth={4} opacity={0.35} />
      <circle cx={62} cy={62} r={r} fill="none" stroke={T.ring} strokeWidth={9} strokeDasharray={2 * Math.PI * r} strokeDashoffset={2 * Math.PI * r * (1 - p)} transform="rotate(-90 62 62)" strokeLinecap="round" />
      <circle cx={62} cy={62} r={8} fill="#FF4A4A" opacity={blink} />
      <text x={132} y={46} fontFamily={FONT.ui} fontSize={26} letterSpacing={5} fill={T.dim}>
        ACORDADO HÁ
      </text>
      <text x={130} y={102} fontFamily={FONT.ui} fontSize={54} fill={T.text}>
        {hTxt} h
      </text>
      <text x={530} y={102} textAnchor="end" fontFamily={FONT.ui} fontSize={40} fill={T.text} opacity={0.9}>
        DIA {day}
      </text>
    </g>
  );
};

/** A data card: a small label, then 1-3 lines in the display face, cream on a dark pill. Pops in from t=0, out at `out`. */
export const DataCard: React.FC<{ t: number; label?: string; lines: string[]; y?: number; size?: number; out?: number; w?: number }> = ({ t, label, lines, y = 1290, size = 60, out = 1e9, w = 920 }) => {
  if (t < 0) return null;
  const s = backOut(clamp(t / 8));
  const o = 1 - clamp((t - out) / 7);
  if (o <= 0) return null;
  const lh = size * 1.18;
  const h = (label ? 70 : 34) + lines.length * lh + 30;
  return (
    <g opacity={o} transform={`translate(540 ${y}) scale(${0.85 + 0.15 * s}) translate(-540 0)`}>
      <g opacity={clamp(t / 5)}>
        <rect x={540 - w / 2} y={0} width={w} height={h} rx={34} fill={T.pill} opacity={0.72} />
        <rect x={540 - w / 2} y={0} width={w} height={h} rx={34} fill="none" stroke={T.text} strokeWidth={2.5} opacity={0.3} />
        {label ? (
          <text x={540 - w / 2 + 44} y={56} fontFamily={FONT.ui} fontSize={30} letterSpacing={5} fill={T.dim}>
            {label}
          </text>
        ) : null}
        {lines.map((l, i) => {
          const lt = clamp((t - 4 - i * 4) / 8);
          return (
            <text key={i} x={540 - w / 2 + 44} y={(label ? 70 : 34) + (i + 0.8) * lh + (1 - easeOut(lt)) * 16} opacity={lt} fontFamily={FONT.title} fontWeight={700} fontSize={size} fill={T.text}>
              {l}
            </text>
          );
        })}
      </g>
    </g>
  );
};

export { kf, easeInOut };
