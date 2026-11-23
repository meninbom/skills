// voz-serie: CLI da ElevenLabs com trava de gasto por episódio.
//
//   node eleven.mjs orcar --tsv <ep>/voz/falas.tsv [--tomadas 2]   GRÁTIS. Conta caracteres; não usa rede nem chave.
//   node eleven.mjs balance                                         grátis (usa a chave): quanto sobra na conta
//   node eleven.mjs voices [--search pt]                            grátis (usa a chave): as vozes da sua conta
//   node eleven.mjs tts --ep <ep> --papel narrador --text-file t.txt --out <ep>/voz/pecas/N1_A
//                       [--stability 0.45 --style 0.25 --speed 1.0 --label x]
//        PAGO. Grava N1_A.mp3 + N1_A.words.json ([{w,start,end}], em segundos).
//   node eleven.mjs stt --ep <ep> --file a.mp3 --out a.json         PAGO (opcional; o escolher_tomadas.py usa STT local grátis)
//
// Antes de qualquer chamada paga:
//   - exige <ep>/voz/OK_GASTO_VOZ.txt não vazio (a frase de ok do aluno, dita NESTA conversa);
//   - soma o gasto do ep (<ep>/voz/gastos.csv) + o pedido e para se passar de voz.teto_por_ep;
//   - recusa tag de sussurro e velocidade acima de 1.1;
//   - sem chave: para antes de qualquer acesso à rede.
// A chave é a variável voz.chave lida do arquivo voz.env do kit.config.json. Nunca de outro lugar.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const API = 'https://api.elevenlabs.io';
const SUSSURRO = /[\[(]\s*(whisper|sussurr)/i;
const VEL_MAX = 1.1, VEL_MIN = 0.7;

function para(msg, cod = 1) { console.error('PAREI: ' + msg); process.exit(cod); }

// ---------- kit.config.json (mesma ordem da kitcfg.py) ----------
function acha() {
  const env = process.env.KIT_SERIE_CONFIG;
  if (env) {
    if (!fs.existsSync(env) || !fs.statSync(env).isFile()) para(`KIT_SERIE_CONFIG aponta pra "${env}", que não existe.`);
    return path.resolve(env);
  }
  let d = process.cwd();
  for (;;) {
    const p = path.join(d, 'kit.config.json');
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
    const pai = path.dirname(d);
    if (pai === d) break;
    d = pai;
  }
  const p = path.join(os.homedir(), '.kit_serie', 'config.json');
  return fs.existsSync(p) ? p : null;
}
let _cfg = null;
function cfg() {
  if (_cfg) return _cfg;
  const p = acha();
  if (!p) para('Não achei o kit.config.json. Rode a /serie-lumen:serie-nova primeiro, ou abra o Claude dentro da pasta da série.');
  _cfg = JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));
  _cfg._arquivo = p;
  return _cfg;
}
function expande(v) {
  if (typeof v === 'string') {
    if (v.includes('{serie}')) {
      const c = cfg();
      v = v.split('{serie}').join(c.serie?.pasta || path.dirname(c._arquivo));
    }
    return v.startsWith('~') ? path.join(os.homedir(), v.slice(1)) : v;
  }
  if (Array.isArray(v)) return v.map(expande);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, expande(x)]));
  return v;
}
function get(chave, padrao) {
  let c = cfg();
  for (const k of chave.split('.')) {
    if (!c || typeof c !== 'object' || !(k in c) || c[k] === null || c[k] === '') return padrao;
    c = c[k];
  }
  return expande(c);
}
function exige(chave, dica = '') {
  const v = get(chave, undefined);
  if (v === undefined) para(`Falta "${chave}" no ${cfg()._arquivo}. ${dica}`.trim());
  return v;
}

// ---------- argumentos ----------
const [cmd, ...rest] = process.argv.slice(2);
const opt = {};
for (let i = 0; i < rest.length; i++) if (rest[i].startsWith('--')) opt[rest[i].slice(2)] = rest[i + 1]?.startsWith('--') || rest[i + 1] === undefined ? true : rest[++i];

// ---------- falas.tsv ----------
const semTags = s => s.replace(/\[[^\]]*\]\s*/g, '').trim();
const conta = s => [...semTags(s)].length;
const ehNarrador = papel => /^narrad/i.test(papel);
function lerFalas(arq) {
  if (!fs.existsSync(arq)) para(`não achei ${arq}`);
  const out = [], avisos = [];
  fs.readFileSync(arq, 'utf8').replace(/^﻿/, '').split(/\r?\n/).forEach((ln, i) => {
    if (!ln.trim() || ln.trimStart().startsWith('#')) return;
    const p = ln.split('\t');
    if (p.length < 4) { avisos.push(`linha ${i + 1}: precisa de 4 colunas separadas por TAB (id, papel, parametros, texto)`); return; }
    const [id, papel, par] = p.map(x => x.trim());
    const texto = p.slice(3).join('\t').trim();
    if (papel.toUpperCase() === 'PAUSA') { out.push({ id, pausa: true }); return; }
    const n = (par || '').split(/\s+/).map(Number);
    out.push({ id, papel, texto, est: n[0], sty: n[1], vel: Number.isFinite(n[2]) ? n[2] : 1.0 });
  });
  return { falas: out, avisos };
}

// ---------- gasto do ep ----------
const ledger = ep => path.join(ep, 'voz', 'gastos.csv');
function gastoEp(ep) {
  const f = ledger(ep);
  if (!fs.existsSync(f)) return 0;
  return fs.readFileSync(f, 'utf8').split(/\r?\n/).slice(1).filter(Boolean)
    .reduce((s, l) => s + (Number(l.split(',').at(-1)) || 0), 0);
}
function registra(ep, arquivo, papel, caracteres, creditos) {
  const f = ledger(ep);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  if (!fs.existsSync(f)) fs.writeFileSync(f, 'quando,comando,arquivo,papel,caracteres,creditos\n');
  const limpo = s => String(s ?? '').replace(/[,\r\n"]/g, ' ');
  fs.appendFileSync(f, `${new Date().toISOString()},${cmd},${limpo(arquivo)},${limpo(papel)},${caracteres},${creditos}\n`);
}
function teto() {
  const t = Number(exige('voz.teto_por_ep', 'Ponha o máximo de créditos por episódio (ex.: 2500).'));
  if (!Number.isFinite(t) || t <= 0) para('voz.teto_por_ep precisa ser um número maior que zero.');
  return t;
}

// ---------- portões antes de gastar ----------
function exigeOk(ep) {
  const f = path.join(ep, 'voz', 'OK_GASTO_VOZ.txt');
  if (!fs.existsSync(f) || !fs.readFileSync(f, 'utf8').trim())
    para(`sem ok do aluno: falta ${f} (ou está vazio). Mostre o orçamento (orcar), espere o ok DIRETO do aluno nesta conversa e grave a frase dele nesse arquivo.`);
  if (/^\s*TESTE/i.test(fs.readFileSync(f, 'utf8')))
    para(`o ${f} é um ok de TESTE (o ep de exemplo do plugin). Ok de teste não vale pra voz paga.`);
}
function cabeNoTeto(ep, pedido) {
  const t = teto(), g = gastoEp(ep);
  if (g + pedido > t) para(`teto do ep: já gastou ${g} + este pedido ${pedido} = ${g + pedido} > ${t} (voz.teto_por_ep). Só o aluno sobe o teto, no kit.config.json.`);
  return { teto: t, gasto: g };
}
function chave() {
  const arq = exige('voz.env', 'Aponte pro arquivo .env da série (ex.: "{serie}/.env").');
  const nome = exige('voz.chave', 'Nome da variável da chave (ex.: ELEVENLABS_API_KEY).');
  if (!fs.existsSync(arq)) para(`não achei o arquivo da chave: ${arq} (voz.env). Crie com uma linha: ${nome}=sua_chave`);
  const linhas = fs.readFileSync(arq, 'utf8').replace(/^﻿/, '').split(/\r?\n/);
  const l = linhas.find(x => x.trim().startsWith(nome + '=') || x.trim().startsWith(nome + ' ='));
  const v = l ? l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '') : '';
  if (!v) para(`a chave ${nome} está vazia ou não existe em ${arq}. Ponha a linha ${nome}=sua_chave (a chave fica só nesse arquivo).`);
  return v;
}

// ---------- rede ----------
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function api(KEY, p, init = {}) {
  for (let t = 0; ; t++) {
    const res = await fetch(API + p, { ...init, headers: { 'xi-api-key': KEY, ...(init.headers || {}) } });
    if (res.ok) return res;
    if ((res.status === 429 || res.status >= 500) && t < 5) { await sleep(1500 * 2 ** t); continue; }
    throw new Error(`${p} -> ${res.status} ${(await res.text()).slice(0, 400)}`);
  }
}
function palavras(al) {   // caracteres com tempo -> palavras {w,start,end}; o que está entre [colchetes] (tags) fica de fora
  const words = []; let cur = null, tag = false;
  al.characters.forEach((ch, i) => {
    if (ch === '[') tag = true;
    if (tag || /\s/.test(ch)) { if (cur) { words.push(cur); cur = null; } if (ch === ']') tag = false; return; }
    if (!cur) cur = { w: '', start: al.character_start_times_seconds[i] };
    cur.w += ch; cur.end = al.character_end_times_seconds[i];
  });
  if (cur) words.push(cur);
  return words;
}

// ---------- comandos ----------
const cmds = {
  async orcar() {
    if (!opt.tsv || opt.tsv === true) para('uso: node eleven.mjs orcar --tsv <ep>/voz/falas.tsv [--tomadas 2]', 2);
    const tom = Number(opt.tomadas ?? 2);
    if (!Number.isInteger(tom) || tom < 1 || tom > 4) para('--tomadas vai de 1 a 4', 2);
    const tsv = path.resolve(opt.tsv);
    const ep = opt.ep && opt.ep !== true ? path.resolve(opt.ep)
      : (path.basename(path.dirname(tsv)) === 'voz' ? path.dirname(path.dirname(tsv)) : null);
    const { falas, avisos } = lerFalas(tsv);
    const vozes = (acha() ? get('voz.vozes', {}) : {}) || {};
    const LET = 'ABCD';
    let total = 0, falta = 0, pausas = 0;
    console.log(`falas: ${tsv}`);
    console.log(`tomadas: narrador 1, personagens ${tom}. As [tags] e as PAUSAs ficam fora da conta.`);
    console.log('id\tpapel\ttomadas\tcaracteres\tsubtotal');
    for (const f of falas) {
      if (f.pausa) { pausas++; continue; }
      const n = conta(f.texto), k = ehNarrador(f.papel) ? 1 : tom;
      total += n * k;
      if (ep) for (const tk of LET.slice(0, k)) if (!fs.existsSync(path.join(ep, 'voz', 'pecas', `${f.id}_${tk}_-16.wav`))) falta += n;
      console.log(`${f.id}\t${f.papel}\t${k}\t${n}\t${n * k}`);
      if (SUSSURRO.test(f.texto)) avisos.push(`${f.id}: tag de sussurro. Sussurro nunca: o gerar_vozes recusa.`);
      else if (/\.\.\.|…/.test(f.texto)) avisos.push(`${f.id}: reticências podem puxar sussurro. Prefira ponto final ou uma PAUSA.`);
      if (f.vel > VEL_MAX) avisos.push(`${f.id}: velocidade ${f.vel} passa de ${VEL_MAX}. O gerar_vozes recusa: encurte o texto.`);
      if (f.vel < VEL_MIN) avisos.push(`${f.id}: velocidade ${f.vel} abaixo de ${VEL_MIN} (a ElevenLabs não aceita).`);
      if (!vozes[f.papel]) avisos.push(`${f.id}: o papel "${f.papel}" não tem voz em voz.vozes.`);
      if (/\d/.test(f.texto)) avisos.push(`${f.id}: número em algarismo. Escreva por extenso (a voz erra número).`);
    }
    if (!ep) falta = total;
    const t = acha() ? Number(get('voz.teto_por_ep', 0)) || 0 : 0;
    const g = ep ? gastoEp(ep) : 0;
    console.log(`PAUSAs: ${pausas} (não gastam)`);
    console.log(`total do ep: ${total} caracteres -> ~${total} créditos (~1 crédito por caractere, medido no LUMEN com eleven_v4)`);
    console.log(`falta gerar: ~${falta} créditos (o que já tem _-16.wav é pulado)`);
    console.log(`já gasto neste ep (gastos.csv): ${g} · teto do ep (voz.teto_por_ep): ${t || 'NÃO DEFINIDO'}` +
      (t ? ` · sobra depois: ${t - g - falta}` : ''));
    if (avisos.length) { console.log('avisos:'); for (const a of avisos) console.log('  - ' + a); }
    const cabe = t > 0 && g + falta <= t;
    console.log(JSON.stringify({ creditos_estimados: total, falta_gerar: falta, ja_gasto: g, teto: t || null, cabe, avisos: avisos.length }));
  },

  async balance() {
    const KEY = chave();
    const j = await (await api(KEY, '/v1/user/subscription')).json();
    console.log(JSON.stringify({ plano: j.tier, usado: j.character_count, limite: j.character_limit, sobra: j.character_limit - j.character_count,
      renova: j.next_character_count_reset_unix ? new Date(j.next_character_count_reset_unix * 1000).toISOString().slice(0, 10) : null }));
  },

  async voices() {
    const KEY = chave();
    const j = await (await api(KEY, '/v1/voices')).json();
    const q = (opt.search && opt.search !== true ? opt.search : '').toLowerCase();
    for (const v of j.voices) {
      const l = `${v.voice_id}  ${v.name}  [${v.category}]  ${JSON.stringify(v.labels || {})}`;
      if (!q || l.toLowerCase().includes(q)) console.log(l);
    }
  },

  async tts() {
    for (const k of ['ep', 'text-file', 'out']) if (!opt[k] || opt[k] === true) para(`tts precisa de --${k}`, 2);
    const ep = path.resolve(opt.ep);
    const texto = fs.readFileSync(opt['text-file'], 'utf8').replace(/^﻿/, '').trim();
    if (!texto) para(`texto vazio: ${opt['text-file']}`);
    // 1) regras da voz (grátis)
    if (SUSSURRO.test(texto)) para('tag de sussurro no texto. Sussurro nunca: use pausa ou texto pra dar tensão.');
    const vel = opt.speed !== undefined ? Number(opt.speed) : 1.0;
    if (!(vel <= VEL_MAX)) para(`velocidade ${opt.speed} passa de ${VEL_MAX}. Máximo 1,1×: encurte o texto em vez de acelerar.`);
    if (vel < VEL_MIN) para(`velocidade ${vel} abaixo de ${VEL_MIN}.`);
    let voz = opt.voice && opt.voice !== true ? opt.voice : null;
    const papel = opt.papel && opt.papel !== true ? opt.papel : '';
    if (!voz) {
      if (!papel) para('tts precisa de --papel (chave de voz.vozes) ou --voice ID', 2);
      voz = get(`voz.vozes.${papel}`, null);
      if (!voz) para(`o papel "${papel}" não tem voz em voz.vozes do ${cfg()._arquivo}.`);
    }
    // 2) ok do aluno e teto (grátis)
    exigeOk(ep);
    const n = conta(texto);
    const { teto: t, gasto: g } = cabeNoTeto(ep, n);
    // 3) chave (antes de qualquer rede)
    const KEY = chave();
    // 4) a chamada paga
    const res = await api(KEY, `/v1/text-to-speech/${voz}/with-timestamps?output_format=mp3_44100_128`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: texto, model_id: get('voz.modelo', 'eleven_v4'),
        voice_settings: { stability: Number(opt.stability ?? 0.45), similarity_boost: 0.8, style: Number(opt.style ?? 0.25),
          use_speaker_boost: true, speed: vel } }),
    });
    const custo = Number(res.headers.get('character-cost') || res.headers.get('x-character-count')) || n;
    const j = await res.json();
    fs.mkdirSync(path.dirname(path.resolve(opt.out)), { recursive: true });
    fs.writeFileSync(`${opt.out}.mp3`, Buffer.from(j.audio_base64, 'base64'));
    const w = palavras(j.alignment);
    fs.writeFileSync(`${opt.out}.words.json`, JSON.stringify(w, null, 1));
    registra(ep, path.basename(opt.out), papel || voz, n, custo);
    console.log(JSON.stringify({ ok: true, arquivo: `${opt.out}.mp3`, palavras: w.length, segundos: w.at(-1)?.end, caracteres: n,
      creditos: custo, gasto_ep: g + custo, teto: t }));
  },

  async stt() {
    for (const k of ['ep', 'file', 'out']) if (!opt[k] || opt[k] === true) para(`stt precisa de --${k}`, 2);
    const ep = path.resolve(opt.ep);
    if (!fs.existsSync(opt.file)) para(`não achei ${opt.file}`);
    exigeOk(ep);
    cabeNoTeto(ep, 0);
    const KEY = chave();
    const fd = new FormData();
    fd.append('model_id', 'scribe_v1');
    fd.append('file', new Blob([fs.readFileSync(opt.file)]), path.basename(opt.file));
    const j = await (await api(KEY, '/v1/speech-to-text', { method: 'POST', body: fd })).json();
    fs.writeFileSync(opt.out, JSON.stringify(j, null, 1));
    registra(ep, path.basename(opt.file), 'stt', 0, 0);
    console.log(JSON.stringify({ ok: true, arquivo: opt.out, idioma: j.language_code, caracteres: j.text?.length }));
  },
};

if (!cmds[cmd]) { console.error('comandos: ' + Object.keys(cmds).join(', ')); process.exitCode = 2; }
else cmds[cmd]().catch(e => { console.error('PAREI: ' + e.message); process.exitCode = 1; });
