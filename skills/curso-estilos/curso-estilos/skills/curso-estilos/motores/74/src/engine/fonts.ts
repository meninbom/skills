import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';
import { STUDIO } from '../studio.config';

// Three faces: a heavy display face for the title card, a mono for on-screen readouts (timers, labels, chips),
// and a handwriting face for chalk and notes. All three are OFL fonts shipped in public/vendor/fontes/ (see FONTES.md),
// so the render never touches the network. A local title face from studio.config.ts also loads from public/.

const F = (file: string) => staticFile('vendor/fontes/' + file);
for (const w of ['600', '700', '800']) loadFont({ family: 'Bricolage Grotesque', url: F(`bricolage-grotesque-latin-${w}-normal.woff2`), weight: w });
loadFont({ family: 'Fragment Mono', url: F('fragment-mono-latin-400-normal.woff2'), weight: '400' });
for (const w of ['400', '700']) loadFont({ family: 'Kalam', url: F(`kalam-latin-${w}-normal.woff2`), weight: w });
if (STUDIO.titleFont) loadFont({ family: STUDIO.titleFont.family, url: staticFile(STUDIO.titleFont.file), weight: STUDIO.titleFont.weight });

export const FONT = {
  title: STUDIO.titleFont ? STUDIO.titleFont.family : 'Bricolage Grotesque',
  ui: 'Fragment Mono',
  hand: 'Kalam',
};
