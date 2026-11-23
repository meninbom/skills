// cena.js — A LINHA DO TEMPO do kit: uma cena curta de 7 s (entra andando, para, acena e fala uma frase).
// É o ponto de partida de uma peça curta: copie a pasta, troque o tema em cenario.js e reescreva os blocos daqui.
import * as B from '../boneco.js';
import { gerar } from '../gerador.js';
import { anda } from '../fisica_v5.js';
import { eIO, st } from '../motor.js';
import { TEMA, TEMAS } from './cenario.js';
import { criaPalco, falaEmTelas } from './palco.js';
const Q = new URLSearchParams(location.search);                             // o render manda ?vw=...&vh=...&tema=...&plano=...

// ---------------------------------------------------------------- 1. AJUSTES
const LARGURA = +Q.get('vw') || 1080, ALTURA = +Q.get('vh') || 1920;        // tamanho do quadro (1080×1920 = vertical; 1920×1080 = horizontal)
const PLANO = Q.get('plano') || 'medio';                                    // enquadramento: 'aberto', 'medio' ou 'close' (a tabela está em palco.js)
let nomeTema = Q.get('tema') || TEMA;                                       // o tema vem de cenario.js; --tema só serve para testar outro sem editar
if (!TEMAS[nomeTema]) { console.log(`AVISO: não existe o tema "${nomeTema}" em cenario.js (existem: ${Object.keys(TEMAS).join(', ')}). Usando "${TEMA}".`); nomeTema = TEMA; }
const tema = TEMAS[nomeTema];

// ---------------------------------------------------------------- 2. PERSONAGEM (as peças são do gerador.js; as cores vêm do tema)
const HEROI = gerar({ nome: 'duda', corpo: 'jovem', cabeca: 'touca', roupa: 'jaqueta', capa: null, extra: 'mochila', cachecol: true, olhos: 'ponto', cores: tema.boneco });
const R = HEROI.R, palco = criaPalco(document.getElementById('c'), tema, LARGURA, ALTURA, R);

// ---------------------------------------------------------------- 3. LINHA DO TEMPO (em segundos)
const T_ANDA = 2.6;                        // 0,0 → 2,6  entra andando da esquerda e chega no meio
const T_PARA = 3.0;                        // 2,6 → 3,0  freia e fica de pé
const T_ACENA = [3.0, 4.5];                // 3,0 → 4,5  a ação: vira para a câmera e acena
const FALA = { t0: 4.6, dur: 2.0, txt: 'Oi! Esse é o meu kit de partida.' };   // 4,6 → 6,6  a fala (a boca mexe pelo texto)
const FIM = 7.0;
// legenda da fala: telas de 2–3 palavras, 1 palavra em amarelo (*assim*). É a legenda do motor.
const LEGENDA = falaEmTelas(FALA.t0, FALA.dur, ['OI! ESSE É', 'O MEU *KIT*', 'DE PARTIDA'], palco.legendaY);

const PASSO = { ritmo: 0, exagero: 1 };                                     // ritmo 0 = andando, 1 = correndo
const X0 = -anda(T_ANDA, R, PASSO).x;                                       // começa longe o bastante para chegar em x = 0 no fim da caminhada
const respira = t => Math.sin(t * 2.4);
const dePe = (t, o = {}) => ({ x: 0, y: 0, vista: 'q', dir: 1, expr: 'neutro', agacha: 6 + respira(t) * 1.5, lean: 0.02, bal: Math.sin(t * 1.3) * 0.08, ...o });

// de pé e de perfil, com mãos, cotovelos e pés escritos: assim a mistura com o passo leva cada ponta até o lugar, sem pulo
const OMBRO = -(R.pe + R.coxa + R.canela + R.tronco) + 8 + 6, BRACO = R.braco[0] + R.braco[1];
const dePePerfil = t => dePe(t, { vista: 'l', pN: [-18, 0], pF: [22, 0], calcN: 0, calcF: 0, mN: [-8, OMBRO + BRACO * 0.93], eN: [-14, OMBRO + R.braco[0]], mF: [12, OMBRO + BRACO * 0.93], eF: [2, OMBRO + R.braco[0]] });

function quadro(t) {
  t = B.cl(t, 0, FIM - 1e-4); B.RELOGIO.t = t; for (const k in B.FALA) delete B.FALA[k];
  let P;
  if (t < T_ANDA) {                                                         // ANDA: o ciclo de passo vem da física; x é a distância andada
    const { x, v, fase, ...passo } = anda(t, R, PASSO);
    P = { ...passo, x: X0 + x, y: 0, vista: 'l', dir: 1, expr: 'neutro' };
  } else if (t < T_PARA) {                                                  // PARA: mistura o último passo com a pose de pé (ainda de perfil)
    const { x, v, fase, ...passo } = anda(T_ANDA, R, PASSO), k = eIO((t - T_ANDA) / (T_PARA - T_ANDA));
    P = B.mix({ ...passo, x: 0, y: 0, vista: 'l', dir: 1, expr: 'neutro' }, dePePerfil(t), k); P.vista = 'l';
  } else {                                                                  // ACENA e FALA: de 3/4 para a câmera (a vista troca num quadro só, como no estilo)
    const sobe = st(T_ACENA[0], T_ACENA[0] + 0.3, t) * (1 - st(T_ACENA[1] - 0.3, T_ACENA[1], t));       // 0 = braço solto, 1 = braço no alto
    P = dePe(t, { cabT: 0.03 * Math.sin(t * 1.7) - 0.05 * sobe });
    if (sobe > 0.02) Object.assign(P, {                                     // mF = onde a mão vai; eF = para onde o cotovelo aponta
      mF: [B.lerp(40, 104 + 24 * Math.sin((t - T_ACENA[0]) * 13), sobe), OMBRO + B.lerp(BRACO * 0.92, -BRACO * 0.5, sobe)],
      eF: [B.lerp(30, 96, sobe), OMBRO + B.lerp(R.braco[0], R.braco[0] * 0.25, sobe)], abertaF: sobe > 0.5 });
    const boca = B.bocaDaFala(FALA.txt, FALA.t0, FALA.dur, t); if (boca) B.FALA[HEROI.nome] = boca;
  }
  // CÂMERA: acompanha um pouco a chegada e empurra 5% durante a fala. Para cortar para o rosto na fala, troque a linha por:
  //   const cam = t < FALA.t0 ? palco.camera(PLANO, { x: -110 }) : palco.camera('close');
  const cam = palco.camera(PLANO, { x: B.lerp(-110, 0, eIO(t / T_PARA)), zoom: 1 + 0.05 * eIO((t - FALA.t0 + 0.4) / 2.2) });
  palco.quadro(t, cam, g => { B.boneco(g, HEROI, P); });
  palco.legenda(t, LEGENDA);
}

await document.fonts.load('700 84px RC');
window.PLANOS = [{ id: 'kit', t0: 0, D: FIM }];                             // a trava (trava.py) percorre esta lista
window.END = FIM; console.log(`FIM ${FIM} · tema ${nomeTema} · plano ${PLANO} · ${LARGURA}×${ALTURA}`);
window.seek = async t => quadro(t); quadro(0); window.READY = true;
