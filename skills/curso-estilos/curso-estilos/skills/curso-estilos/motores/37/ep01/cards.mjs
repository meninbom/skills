// cards.mjs: light-novel title cards as transparent 1080x1920 PNGs, one per reveal step -> cards/c1_N.png, c2_N.png
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { abrirChrome } from '../chrome.mjs';
const root = path.dirname(fileURLToPath(import.meta.url));
fs.mkdirSync(path.join(root, 'cards'), { recursive: true });

const css = `
html,body{margin:0;width:1080px;height:1920px;background:transparent;overflow:hidden}
.w{position:absolute;left:0;right:0;font-family:"Yu Gothic","YuGothic","Meiryo",sans-serif;font-weight:700;color:#1e1a2c;text-align:center;letter-spacing:-0.02em}
.l{display:block;line-height:1.02;opacity:0}
.on{opacity:1}
.s{font-size:58px;font-weight:700;letter-spacing:0.02em}
.m{font-size:104px}
.b{font-size:150px;letter-spacing:-0.035em}
.stroke{-webkit-text-stroke:0;text-shadow:
  0 0 0 #fff, 5px 0 0 #fff, -5px 0 0 #fff, 0 5px 0 #fff, 0 -5px 0 #fff, 4px 4px 0 #fff, -4px 4px 0 #fff, 4px -4px 0 #fff, -4px -4px 0 #fff,
  9px 0 0 #fff, -9px 0 0 #fff, 0 9px 0 #fff, 0 -9px 0 #fff, 7px 7px 0 #fff, -7px 7px 0 #fff, 7px -7px 0 #fff, -7px -7px 0 #fff, 0 14px 0 rgba(30,26,44,0.25)}
.rule{display:block;margin:26px auto;width:520px;height:6px;background:#1e1a2c;opacity:0}
.jp{position:absolute;right:34px;top:300px;writing-mode:vertical-rl;font-family:"Yu Gothic","Meiryo",sans-serif;font-weight:700;font-size:40px;color:#1e1a2c;letter-spacing:0.12em;opacity:0}
.jp2{position:absolute;left:70px;top:420px;writing-mode:vertical-rl;font-family:"Yu Gothic","Meiryo",sans-serif;font-weight:400;font-size:30px;color:#1e1a2c;letter-spacing:0.2em;opacity:0}
`;
// card 1 (rebirth, on white): 6 steps
const c1 = (n) => `<style>${css}</style>
<div class="jp" style="opacity:${n >= 6 ? 0.85 : 0}">電動キックボードに轢かれたら電動キックボードに転生した件</div>
<div class="jp2" style="opacity:${n >= 6 ? 0.6 : 0}">第一巻</div>
<div class="w" style="top:470px">
 <span class="l b ${n >= 1 ? 'on' : ''}">FUI</span>
 <span class="l m ${n >= 1 ? 'on' : ''}">ATROPELADO</span>
 <span class="l s ${n >= 2 ? 'on' : ''}" style="margin:16px 0 10px">POR UM</span>
 <span class="l b ${n >= 2 ? 'on' : ''}" style="font-size:138px">PATINETE</span>
 <span class="l m ${n >= 3 ? 'on' : ''}">ELÉTRICO</span>
 <span class="rule" style="opacity:${n >= 4 ? 1 : 0}"></span>
 <span class="l s ${n >= 4 ? 'on' : ''}" style="margin-bottom:10px">E RENASCI COMO</span>
 <span class="l m ${n >= 5 ? 'on' : ''}" style="font-size:80px">O</span>
 <span class="l b ${n >= 5 ? 'on' : ''}" style="font-size:158px">PATINETE</span>
</div>`;
// card 2 (finale, over the picture: white outline): 3 steps
const c2 = (n) => `<style>${css}</style>
<div class="w stroke" style="top:230px">
 <span class="l s ${n >= 1 ? 'on' : ''}" style="font-size:64px;margin-bottom:22px">CAPÍTULO 2</span>
 <span class="l m ${n >= 2 ? 'on' : ''}" style="font-size:92px">NÃO EXISTE</span>
 <span class="l b ${n >= 2 ? 'on' : ''}" style="font-size:160px">TOMADA</span>
 <span class="l m ${n >= 3 ? 'on' : ''}" style="font-size:84px;margin-top:6px">EM OUTRO MUNDO</span>
</div>`;
const JOBS = [];
for (let n = 1; n <= 6; n++) JOBS.push([`c1_${n}`, c1(n)]);
for (let n = 1; n <= 3; n++) JOBS.push([`c2_${n}`, c2(n)]);

const browser = await abrirChrome({ webgl: false });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920 });
for (const [name, html] of JOBS) {
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(root, 'cards', `${name}.png`), omitBackground: true });
}
await browser.close();
console.log('cards ok');
