// Camera continua: renderiza uma composicao HTML + GSAP (timeline pausada em window.__timelines) para MP4 mudo,
// quadro a quadro, no Chrome do sistema. E o mesmo contrato do HyperFrames, entao a mesma pasta tambem
// renderiza com `npx hyperframes render` se voce preferir.
//
//   node render.mjs <pasta> [--de 0] [--dur tudo] [--fps 30] [--largura 1080] [--saida saida/video_mudo.mp4]
//   node render.mjs <pasta> --vw 1920 --vh 1080          -> outro tamanho de quadro (padrao 1080x1920). A pagina recebe
//                                                           ?w=1920&h=1080 e encaixa o conteudo sem esticar nem cortar.
//                                                           --largura continua valendo como largura final (padrao = --vw).
//   node render.mjs <pasta> --quadros 1.0,4.3,9.0        -> PNGs soltos em saida/quadros/ (para conferir composicao)
//
// <pasta> = onde esta o index.html (kit_template, kit_branco, hf ou uma pasta sua). DEMO_CPU=1 forca render por software.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { abrirNavegador, abrirEncoder } from './lib/chrome.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const pasta = path.resolve(args[0] && !args[0].startsWith('--') ? args[0] : path.join(AQUI, 'kit_template'));
const op = (nome, padrao) => { const i = args.indexOf('--' + nome); return i >= 0 ? args[i + 1] : padrao; };
const html = path.join(pasta, 'index.html');
if (!fs.existsSync(html)) { console.error(`Nao achei ${html}`); process.exit(1); }

// GSAP: a pagina carrega vendor/gsap.min.js. Pasta nova (copiada ou criada depois do npm install) ainda nao tem esse arquivo:
// aqui ele e copiado do node_modules. Sem isso a pagina abriria sem GSAP e o render ficaria esperando ate estourar o tempo.
if (/vendor\/gsap\.min\.js/.test(fs.readFileSync(html, 'utf8')) && !fs.existsSync(path.join(pasta, 'vendor', 'gsap.min.js'))) {
  const origem = path.join(AQUI, 'node_modules', 'gsap', 'dist', 'gsap.min.js');
  if (!fs.existsSync(origem)) {
    console.error(`Falta o GSAP (a biblioteca de animacao). Abra o terminal na pasta do motor (${AQUI}), rode "npm install" e tente de novo.`);
    process.exit(1);
  }
  fs.mkdirSync(path.join(pasta, 'vendor'), { recursive: true });
  fs.copyFileSync(origem, path.join(pasta, 'vendor', 'gsap.min.js'));
  console.log(`GSAP copiado para ${path.join(path.basename(pasta), 'vendor', 'gsap.min.js')} (a pasta ainda nao tinha).`);
}

const VW = parseInt(op('vw', '1080'), 10), VH = parseInt(op('vh', '1920'), 10);
const padrao = VW === 1080 && VH === 1920;
const largura = parseInt(op('largura', String(VW)), 10);
const nav = await abrirNavegador();
const pg = await nav.newPage();
await pg.setViewport({ width: VW, height: VH, deviceScaleFactor: largura / VW });
const erros = [];
pg.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
pg.on('pageerror', (e) => erros.push(String(e)));
const faltando = [];   // arquivos que a pagina pediu e nao existem (caminho errado, nome trocado, pasta que nao veio junto)
const anotarFalta = (u) => { if (!u.startsWith('data:')) faltando.push(decodeURIComponent(u.split('?')[0]).replace(/^file:\/\/\/?/, '')); };
pg.on('requestfailed', (r) => anotarFalta(r.url()));
pg.on('response', (r) => { if (r.status() >= 400) anotarFalta(r.url()); });
await pg.goto(pathToFileURL(html).href + (padrao ? '' : `?w=${VW}&h=${VH}`), { waitUntil: 'load' });
const temTimeline = 'Boolean(window.__timelines && Object.keys(window.__timelines).length > 0)';
const parar = async (linhas) => { console.error(linhas.join('\n')); await nav.close(); process.exit(1); };
const listaFalta = () => faltando.slice(0, 8).map((f) => '  - ' + f);
const listaErros = () => (erros.length ? ['Erros que a pagina mostrou:', ...erros.slice(0, 5).map((e) => '  - ' + e)] : []);
// A pagina ja carregou. Se a animacao nao apareceu e ha arquivo faltando, para agora em vez de esperar 60 s.
if (!(await pg.evaluate(temTimeline)) && faltando.length) {
  await parar(['A pagina nao montou a animacao e pediu arquivo que nao existe:', ...listaFalta(),
    'Confira o caminho de cada um dentro do index.html (ele vale a partir da pasta da composicao).', ...listaErros()]);
}
try {
  await pg.waitForFunction(temTimeline, { timeout: 60000 });
} catch {
  await parar(['Esperei 60 s e a pagina nao entregou a animacao.',
    'O index.html precisa terminar com: window.__timelines["main"] = tl;  (tl = a timeline do GSAP, pausada).',
    'Veja o kit_branco/index.html como modelo.', ...listaErros()]);
}
const info = await pg.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
  const raiz = document.querySelector('[data-composition-id]');
  const id = raiz ? raiz.dataset.compositionId : Object.keys(window.__timelines)[0];
  window.__tl = window.__timelines[id];
  window.__ir = (t) => { window.__tl.pause(); window.__tl.seek(t, false); };
  return { dur: raiz && raiz.dataset.duration ? parseFloat(raiz.dataset.duration) : window.__tl.duration(), palco: window.__palco || null };
});
if (erros.length) console.log('ERROS DA PAGINA', erros.slice(0, 5));
if (faltando.length) console.log(['AVISO: a pagina pediu arquivo que nao existe (o render segue sem ele):', ...listaFalta()].join('\n'));
if (!padrao && !(info.palco && info.palco.w === VW && info.palco.h === VH)) {
  console.error(`Esta pagina nao le o tamanho do quadro (?w=&h=), entao so renderiza em 1080x1920. Copie o bloco PALCO do kit_branco/index.html.`);
  await nav.close(); process.exit(1);
}
const clip = { x: 0, y: 0, width: VW, height: VH };

if (op('quadros', null)) {
  const dir = path.join(AQUI, 'saida', 'quadros');
  fs.mkdirSync(dir, { recursive: true });
  for (const s of op('quadros').split(',')) {
    const t = parseFloat(s);
    await pg.evaluate((x) => window.__ir(x), t);
    await pg.screenshot({ path: path.join(dir, `q_${t.toFixed(2).padStart(6, '0')}.png`), clip });
    console.log('quadro', t);
  }
} else {
  const fps = parseFloat(op('fps', '30'));
  const de = parseFloat(op('de', '0'));
  const dur = Math.min(parseFloat(op('dur', String(info.dur))), info.dur - de);
  const saida = path.resolve(op('saida', path.join(AQUI, 'saida', 'video_mudo.mp4')));
  const altura = Math.round(largura * VH / VW / 2) * 2;
  const n = Math.round(dur * fps);
  const enc = abrirEncoder({ saida, fps, largura, altura });
  const t0 = Date.now();
  for (let f = 0; f < n; f++) {
    await pg.evaluate((x) => window.__ir(x), de + f / fps);
    await enc.quadro(await pg.screenshot({ type: 'jpeg', quality: 95, clip, optimizeForSpeed: true }));
    if (f % 15 === 0) console.log(`quadro ${f}/${n}  ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  await enc.fechar();
  console.log(`pronto: ${saida}  (${((Date.now() - t0) / 1000).toFixed(1)} s de render)`);
}
await nav.close();
