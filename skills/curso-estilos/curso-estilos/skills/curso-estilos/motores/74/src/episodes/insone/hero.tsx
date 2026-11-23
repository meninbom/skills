import React from 'react';
import { Pose, basePose, Expr } from '../../engine/rig';

// Our character for this episode: "o Vigia", drawn here from scratch (not the repo's round-head Pip).
// Long legs, a sage hoodie with the hood always UP (head covered: the face is an opening in the hood, no hair),
// thick sleeves with cuffs, charcoal trousers, brick-red trainers. Same Pose data as the engine (poseAt/faceAt work),
// but its own body, proportions and face. `tired` (0..1) grows the dark rings over the days; `age` (0..1) adds
// stubble and lines for the 2007 shot.

export const V = {
  hood: '#5E7F4E',
  hoodShade: '#47643C',
  hoodLining: '#2E3F28',
  rimEdge: '#7FA06A',
  pants: '#2C2B36',
  pantsShade: '#22212A',
  skin: '#EBC9A6',
  skinShade: '#D4AE8A',
  ink: '#1B1A24',
  line: '#121118',
  shoe: '#B9503B',
  sole: '#EDE6D8',
  string: '#EDE2C8',
};

const UPPER_ARM = 66;
const FORE_ARM = 60;
const THIGH = 86;
const SHIN = 82;
const SH = { x: 40, y: -122 };
const HIPX = 16;
export const VHEAD = { y: -192 };
export const V_LEG = THIGH + SHIN;

type P = { x: number; y: number };
const rad = (d: number) => (d * Math.PI) / 180;
const rot = (p: P, deg: number, c: P = { x: 0, y: 0 }): P => {
  const r = rad(deg);
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return { x: c.x + dx * Math.cos(r) - dy * Math.sin(r), y: c.y + dx * Math.sin(r) + dy * Math.cos(r) };
};
const spread = (yaw: number) => 1 - 0.8 * Math.min(1, Math.abs(yaw));

export const vJoints = (pose: Pose) => {
  const side = (s: 1 | -1, limb: { a: number; b: number }, root: P, l1: number, l2: number, isLeg: boolean) => {
    const dir = isLeg ? pose.facing : s;
    const d1 = { x: dir * Math.sin(rad(limb.a)), y: Math.cos(rad(limb.a)) };
    const mid = { x: root.x + d1.x * l1, y: root.y + d1.y * l1 };
    const a2 = limb.a + limb.b;
    const d2 = { x: dir * Math.sin(rad(a2)), y: Math.cos(rad(a2)) };
    return { root, mid, end: { x: mid.x + d2.x * l2, y: mid.y + d2.y * l2 } };
  };
  const sp = spread(pose.yaw);
  const tr = (o: { root: P; mid: P; end: P }) => ({ root: rot(o.root, pose.tilt), mid: rot(o.mid, pose.tilt), end: rot(o.end, pose.tilt) });
  return {
    armL: tr(side(-1, pose.armL, { x: -SH.x * sp + pose.yaw * 6, y: SH.y }, UPPER_ARM, FORE_ARM, false)),
    armR: tr(side(1, pose.armR, { x: SH.x * sp + pose.yaw * 6, y: SH.y }, UPPER_ARM, FORE_ARM, false)),
    legL: side(-1, pose.legL, { x: -HIPX * sp, y: 0 }, THIGH, SHIN, true),
    legR: side(1, pose.legR, { x: HIPX * sp, y: 0 }, THIGH, SHIN, true),
  };
};

/** Local point to world (for props in the hand). */
export const vWorld = (pose: Pose, p: P): P => {
  const s = rot(p, pose.spin, { x: 0, y: -90 });
  return { x: pose.x + s.x * pose.scale, y: pose.y + s.y * pose.scale };
};

const VFace: React.FC<{ expr: Expr; blink: number; look: number; yaw: number; tired: number; age: number; glow?: number }> = ({ expr, blink, look, yaw, tired, age, glow = 0 }) => {
  const ink = V.ink;
  const ay = Math.min(1, Math.abs(yaw));
  const ex = look * 6;
  const eyeY = VHEAD.y + 2;
  const far = yaw > 0 ? -1 : 1;
  const lid = expr === 'tired' ? 0.5 + 0.25 * tired : 0;
  const open = Math.max(0.06, 1 - Math.max(blink, lid));
  const eye = (cx: number) => {
    if (ay > 0.75 && Math.sign(cx) === far) return null;
    const big = expr === 'shock';
    const ring = tired > 0.05 ? (
      <path d={`M ${cx - 12} ${eyeY + 12} Q ${cx} ${eyeY + 20 + 5 * tired} ${cx + 12} ${eyeY + 12}`} stroke="#7A5A78" strokeWidth={3 + 3 * tired} fill="none" strokeLinecap="round" opacity={0.35 + 0.55 * tired} />
    ) : null;
    if (blink >= 0.95)
      return (
        <g>
          <path d={`M ${cx - 11} ${eyeY} Q ${cx} ${eyeY + 6} ${cx + 11} ${eyeY}`} stroke={ink} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          {ring}
        </g>
      );
    const rx = big ? 10 : 6.5;
    const ry = (big ? 12 : 9) * open;
    return (
      <g>
        {big ? <ellipse cx={cx} cy={eyeY} rx={14} ry={15} fill="#F6EFE3" /> : null}
        <ellipse cx={cx + ex} cy={eyeY + (lid ? 3 : 0)} rx={rx} ry={ry} fill={ink} />
        {open > 0.4 ? <circle cx={cx + ex + 2.5} cy={eyeY - 3} r={2.2} fill="#fff" opacity={0.9} /> : null}
        {glow > 0.01 ? <circle cx={cx + ex + 2.5} cy={eyeY - 3} r={3.2} fill="#CFE0FF" opacity={glow} /> : null}
        {lid ? <path d={`M ${cx - 12} ${eyeY - 2 + 4 * tired} Q ${cx} ${eyeY - 6 + 4 * tired} ${cx + 12} ${eyeY - 2 + 4 * tired}`} stroke={ink} strokeWidth={3.5} strokeLinecap="round" fill="none" /> : null}
        {ring}
      </g>
    );
  };
  const brows: Partial<Record<Expr, string>> = {
    worried: `M -28 ${eyeY - 16} L -10 ${eyeY - 23} M 10 ${eyeY - 23} L 28 ${eyeY - 16}`,
    shock: `M -28 ${eyeY - 25} Q -18 ${eyeY - 32} -8 ${eyeY - 25} M 8 ${eyeY - 25} Q 18 ${eyeY - 32} 28 ${eyeY - 25}`,
    tired: `M -28 ${eyeY - 14} Q -18 ${eyeY - 17} -8 ${eyeY - 15} M 8 ${eyeY - 15} Q 18 ${eyeY - 17} 28 ${eyeY - 14}`,
    neutral: `M -26 ${eyeY - 18} Q -18 ${eyeY - 21} -9 ${eyeY - 19} M 9 ${eyeY - 19} Q 18 ${eyeY - 21} 26 ${eyeY - 18}`,
    happy: `M -26 ${eyeY - 20} Q -18 ${eyeY - 24} -9 ${eyeY - 21} M 9 ${eyeY - 21} Q 18 ${eyeY - 24} 26 ${eyeY - 20}`,
  };
  const mY = VHEAD.y + 30;
  const mouth: Partial<Record<Expr, React.ReactNode>> = {
    neutral: <path d={`M -8 ${mY} Q 0 ${mY + 3} 8 ${mY}`} stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />,
    happy: <path d={`M -13 ${mY - 3} Q 0 ${mY + 13} 13 ${mY - 3} Z`} fill={ink} />,
    shock: <ellipse cx={0} cy={mY + 3} rx={7} ry={10} fill={ink} />,
    worried: <path d={`M -12 ${mY + 3} Q -6 ${mY - 3} 0 ${mY + 3} Q 6 ${mY + 9} 12 ${mY + 3}`} stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />,
    tired: <path d={`M -9 ${mY + 3} Q 0 ${mY + 1} 9 ${mY + 3}`} stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />,
    dizzy: <ellipse cx={0} cy={mY + 2} rx={5} ry={4} fill={ink} />,
  };
  return (
    <g transform={`translate(${yaw * 18} 0) scale(${1 - 0.3 * ay} 1)`}>
      {/* nose: a small hook toward the side he faces */}
      <path d={`M ${2 + yaw * 6} ${eyeY + 4} Q ${8 + yaw * 10} ${eyeY + 16} ${1 + yaw * 4} ${eyeY + 18}`} stroke={V.skinShade} strokeWidth={4} fill="none" strokeLinecap="round" />
      {eye(-16)}
      {eye(16)}
      {brows[expr] ? <path d={brows[expr]} stroke={ink} strokeWidth={4.5} fill="none" strokeLinecap="round" /> : null}
      {mouth[expr] ?? mouth.neutral}
      {age > 0.01 ? (
        <g opacity={age}>
          {Array.from({ length: 26 }).map((_, i) => {
            const a = (i / 26) * Math.PI;
            return <circle key={i} cx={Math.cos(a) * 30 * (0.6 + 0.4 * ((i * 7) % 3) / 2)} cy={mY + 4 + Math.sin(a) * 14} r={1.6} fill="#9A8C80" />;
          })}
          <path d={`M -30 ${eyeY + 4} L -36 ${eyeY + 8} M 30 ${eyeY + 4} L 36 ${eyeY + 8} M -12 ${eyeY - 30} L 12 ${eyeY - 30}`} stroke={V.skinShade} strokeWidth={2.5} strokeLinecap="round" />
        </g>
      ) : null}
    </g>
  );
};

export type VExtra = { tired?: number; age?: number; eyeGlow?: number; hoodColor?: string };

export const Vigia: React.FC<{ pose: Pose; rimId?: string; shadow?: number; x?: VExtra }> = ({ pose, rimId = 'rimR', shadow = 1, x = {} }) => {
  const j = vJoints(pose);
  const tired = x.tired ?? 0;
  const age = x.age ?? 0;
  const hood = x.hoodColor ?? V.hood;
  const ay = Math.min(1, Math.abs(pose.yaw));
  const leg = (o: { root: P; mid: P; end: P }) => {
    const d = `M ${o.root.x} ${o.root.y} L ${o.mid.x} ${o.mid.y} L ${o.end.x} ${o.end.y}`;
    return (
      <g>
        <path d={d} stroke={V.line} strokeWidth={36} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} stroke={V.pants} strokeWidth={29} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M ${o.mid.x} ${o.mid.y} L ${o.end.x} ${o.end.y}`} stroke={V.pantsShade} strokeWidth={10} fill="none" strokeLinecap="round" transform="translate(5 0)" />
      </g>
    );
  };
  const shoe = (o: { mid: P; end: P }) => (
    <g transform={`translate(${o.end.x} ${o.end.y + 6})`}>
      <path d={`M ${-18 + pose.facing * -4} 4 Q -20 -14 0 -16 Q ${pose.facing * 26} -14 ${pose.facing * 32} 2 Z`} fill={V.shoe} stroke={V.line} strokeWidth={4} strokeLinejoin="round" />
      <rect x={pose.facing > 0 ? -22 : -36} y={0} width={58} height={9} rx={4} fill={V.sole} stroke={V.line} strokeWidth={3} />
    </g>
  );
  const arm = (o: { root: P; mid: P; end: P }) => {
    const d = `M ${o.root.x} ${o.root.y} L ${o.mid.x} ${o.mid.y} L ${o.end.x} ${o.end.y}`;
    const ang = Math.atan2(o.end.y - o.mid.y, o.end.x - o.mid.x);
    const cx = o.end.x - Math.cos(ang) * 8;
    const cy = o.end.y - Math.sin(ang) * 8;
    return (
      <g>
        <path d={d} stroke={V.line} strokeWidth={33} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} stroke={hood} strokeWidth={26} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={cx} cy={cy} r={14} fill={V.hoodShade} stroke={V.line} strokeWidth={3.5} />
        <g transform={`translate(${o.end.x + Math.cos(ang) * 8} ${o.end.y + Math.sin(ang) * 8})`}>
          <ellipse rx={12} ry={13} fill={V.skin} stroke={V.line} strokeWidth={3.5} />
          <ellipse cx={Math.cos(ang + 1.4) * 9} cy={Math.sin(ang + 1.4) * 9} rx={5} ry={6} fill={V.skin} stroke={V.line} strokeWidth={3} />
        </g>
      </g>
    );
  };
  const kw = 1 - 0.32 * ay;
  const torso = (
    <g transform={`rotate(${pose.tilt}) translate(${pose.yaw * 6} 0) scale(${kw} 1)`}>
      {/* boxy hoodie: wide at the shoulders, a ribbed hem at the hips */}
      <path d="M -50 -126 Q 0 -138 50 -126 Q 58 -60 48 4 L -48 4 Q -58 -60 -50 -126 Z" fill={hood} stroke={V.line} strokeWidth={4} strokeLinejoin="round" />
      <path d="M 14 -132 Q 40 -130 50 -126 Q 58 -60 48 4 L 18 4 Q 28 -60 14 -132 Z" fill={V.hoodShade} opacity={0.7} />
      <rect x={-49} y={-8} width={98} height={16} rx={6} fill={V.hoodShade} stroke={V.line} strokeWidth={3.5} />
      {/* kangaroo pocket */}
      <path d="M -32 -10 L -26 -52 L 26 -52 L 32 -10" fill="none" stroke={V.line} strokeWidth={3.5} strokeLinejoin="round" opacity={0.75} />
    </g>
  );
  // hood up: drawn as a back shell (behind the face) and a front rim (around the face)
  const hx = -pose.yaw * 10;
  const head = (
    <g transform={`rotate(${pose.tilt}) rotate(${pose.headTilt} 0 ${VHEAD.y + 46})`}>
      {/* back of the hood: taller than wide, a soft peak leaning back */}
      <path
        transform={`translate(${hx} 0)`}
        d={`M -58 ${VHEAD.y + 52} Q -74 ${VHEAD.y - 10} -52 ${VHEAD.y - 58} Q ${-20 - pose.yaw * 20} ${VHEAD.y - 92} ${10 - pose.yaw * 30} ${VHEAD.y - 84} Q 66 ${VHEAD.y - 66} 66 ${VHEAD.y - 4} Q 66 ${VHEAD.y + 40} 50 ${VHEAD.y + 58} Z`}
        fill={hood}
        stroke={V.line}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path transform={`translate(${hx} 0)`} d={`M 20 ${VHEAD.y - 80} Q 66 ${VHEAD.y - 62} 66 ${VHEAD.y - 4} Q 66 ${VHEAD.y + 40} 50 ${VHEAD.y + 58} Q 54 ${VHEAD.y} 20 ${VHEAD.y - 80} Z`} fill={V.hoodShade} opacity={0.75} />
      {/* the opening: dark lining, then the face, then the rim of the hood over the forehead */}
      <g transform={`translate(${pose.yaw * 16} 0) scale(${1 - 0.25 * ay} 1)`}>
        <ellipse cx={0} cy={VHEAD.y + 6} rx={48} ry={56} fill={V.hoodLining} />
        <path d={`M -38 ${VHEAD.y - 8} Q -40 ${VHEAD.y + 52} 0 ${VHEAD.y + 54} Q 40 ${VHEAD.y + 52} 38 ${VHEAD.y - 8} Q 30 ${VHEAD.y - 34} 0 ${VHEAD.y - 36} Q -30 ${VHEAD.y - 34} -38 ${VHEAD.y - 8} Z`} fill={V.skin} />
        <path d={`M 14 ${VHEAD.y + 50} Q 38 ${VHEAD.y + 44} 38 ${VHEAD.y - 8} Q 34 ${VHEAD.y + 30} 14 ${VHEAD.y + 50} Z`} fill={V.skinShade} opacity={0.8} />
        <path d={`M -50 ${VHEAD.y + 30} Q -54 ${VHEAD.y - 36} 0 ${VHEAD.y - 44} Q 54 ${VHEAD.y - 36} 50 ${VHEAD.y + 30}`} fill="none" stroke={V.line} strokeWidth={17} strokeLinecap="round" />
        <path d={`M -50 ${VHEAD.y + 30} Q -54 ${VHEAD.y - 36} 0 ${VHEAD.y - 44} Q 54 ${VHEAD.y - 36} 50 ${VHEAD.y + 30}`} fill="none" stroke={V.rimEdge} strokeWidth={11} strokeLinecap="round" />
      </g>
      <VFace expr={pose.expr} blink={pose.blink} look={pose.look} yaw={pose.yaw} tired={tired} age={age} glow={x.eyeGlow} />
      {/* drawstrings swinging a beat behind */}
      {(() => {
        const sw = pose.sway * 0.7 - pose.tilt * 0.5;
        return (
          <g transform={`translate(${pose.yaw * 14} 0)`}>
            <path d={`M -14 ${VHEAD.y + 56} Q ${-15 + sw * 0.3} ${VHEAD.y + 74} ${-17 + sw} ${VHEAD.y + 96} M 14 ${VHEAD.y + 56} Q ${15 + sw * 0.3} ${VHEAD.y + 74} ${17 + sw} ${VHEAD.y + 96}`} stroke={V.string} strokeWidth={4} strokeLinecap="round" fill="none" />
            <rect x={-20 + sw} y={VHEAD.y + 94} width={6} height={10} rx={2} fill={V.string} />
            <rect x={14 + sw} y={VHEAD.y + 94} width={6} height={10} rx={2} fill={V.string} />
          </g>
        );
      })()}
    </g>
  );
  return (
    <g>
      {shadow > 0 ? <ellipse cx={pose.x} cy={pose.y + V_LEG * pose.scale + 12} rx={74 * pose.scale} ry={13 * pose.scale} fill="#000" opacity={0.3 * shadow} /> : null}
      <g transform={`translate(${pose.x} ${pose.y}) scale(${pose.scale}) rotate(${pose.spin} 0 -90)`} filter={rimId ? `url(#${rimId})` : undefined}>
        <g transform={`translate(0 ${V_LEG}) scale(${1 + 0.5 * pose.squash} ${1 - pose.squash}) translate(0 ${-V_LEG})`}>
          {pose.yaw < 0 ? <>{leg(j.legR)}{shoe(j.legR)}{leg(j.legL)}{shoe(j.legL)}</> : <>{leg(j.legL)}{shoe(j.legL)}{leg(j.legR)}{shoe(j.legR)}</>}
          {pose.yaw < 0 ? arm(j.armR) : arm(j.armL)}
          {torso}
          {head}
          {pose.yaw < 0 ? arm(j.armL) : arm(j.armR)}
        </g>
      </g>
    </g>
  );
};

export const vBase: Pose = { ...basePose, armL: { a: 12, b: -10 }, armR: { a: 12, b: -10 } };
