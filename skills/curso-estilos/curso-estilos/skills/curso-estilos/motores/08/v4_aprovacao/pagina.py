"""Página de aprovação por prints (atual | corrigido | opção) de um vídeo da série v2 → v4.

uso: python pagina.py <video> [titulo]
lê   _v4/<video>/itens.json + stills/ + clips/
grava _v4/<video>/pagina/index.html (+ cópia das imagens e clipes em pagina/stills e pagina/clips)
Depois publicar com o Artifact tool: file_path = pagina/index.html, files = {"stills/x.jpg": ..., "clips/y.mp4": ...}
(lista impressa em pagina/files.json).

Formato do item: {"n", "tempo", "nota", "titulo", "o_que_muda", "imgs": {"a": [...], "b": [...], "c": [...]},
                  "clip": "clips/x.mp4" | null, "clips": {"b": "...", "c": "..."} (opcional), "rotulos": {"b": "...", "c": "..."} (opcional)}
"""
import html, json, pathlib, shutil, sys

V4 = pathlib.Path(__file__).resolve().parent.parent
video = sys.argv[1]
titulo = sys.argv[2] if len(sys.argv) > 2 else video.capitalize()
base = V4 / video
itens = json.loads((base / 'itens.json').read_text(encoding='utf-8'))
out = base / 'pagina'
(out / 'stills').mkdir(parents=True, exist_ok=True)
(out / 'clips').mkdir(parents=True, exist_ok=True)
files = {}


def usa(rel):
    """copia stills/x ou clips/x para pagina/ e devolve o caminho publicado"""
    rel = rel.replace('\\', '/')
    if '/' not in rel:
        rel = 'stills/' + rel
    src = base / rel
    if not src.exists():
        print('FALTA', src)
        return None
    dst = out / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)
    files[rel] = str(dst.relative_to(V4.parent.parent.parent)).replace('\\', '/')
    return rel


ROT = {'a': 'a · como está', 'b': 'b · corrigido', 'c': 'c · outra opção', 'd': 'd · outra opção'}


def coluna(letra, imgs, clip, rot):
    if not imgs and not clip:
        return ''
    partes = []
    for i in imgs:
        r = usa(i)
        if r:
            partes.append(f'<img src="{r}" alt="{html.escape(rot)}" loading="lazy">')
    if clip:
        r = usa(clip)
        if r:
            partes.append(f'<video src="{r}" controls playsinline preload="metadata"></video>')
    return (f'<figure class="col" data-letra="{letra}"><figcaption>{html.escape(rot)}</figcaption>'
            f'<div class="quadros q{max(1, len(imgs))}">{"".join(partes)}</div></figure>')


blocos = []
for it in itens:
    n = it['n']
    imgs = it.get('imgs') or {}
    clips = it.get('clips') or {}
    rots = {**ROT, **(it.get('rotulos') or {})}
    letras = [l for l in 'abcd' if imgs.get(l) or clips.get(l)]
    if it.get('clip') and 'b' not in clips:
        clips['b'] = it['clip']
        if 'b' not in letras:
            letras.append('b')
    cols = ''.join(coluna(l, imgs.get(l, []), clips.get(l), rots[l]) for l in letras)
    opcoes = ''.join(f'<button type="button" class="op" data-n="{n}" data-v="{l}" aria-pressed="false">{l}</button>' for l in (letras or ['ok']))
    blocos.append(f'''<section class="item" id="i{n}">
  <header class="cab"><span class="num">{n}</span><span class="tempo">{html.escape(str(it.get("tempo", "")))}</span>
    <h2>{html.escape(it.get("titulo", ""))}</h2></header>
  {f'<blockquote>“{html.escape(it["nota"])}”</blockquote>' if it.get('nota') else ''}
  <p class="muda">{html.escape(it.get("o_que_muda", ""))}</p>
  {f'<div class="cols">{cols}</div>' if cols else ''}
  <div class="escolha" role="group" aria-label="Escolha do item {n}">{opcoes}</div>
  <label class="nota-lbl" for="c{n}">Comentário do item {n}</label>
  <textarea class="nota" id="c{n}" data-n="{n}" rows="2" placeholder="Escreva aqui o que mudar neste item (opcional)"></textarea>
</section>''')

pagina = f'''<title>{html.escape(titulo)} · aprovação v4</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Geist:wght@400;500;600&family=Geist+Mono:wght@500&display=swap">
<style>
/* mesa de luz: cada item é uma tira com a nota do diretor em cima e os quadros lado a lado (a = como está, b/c = novos) */
:root {{
  --bg: #efeee9; --fg: #161614; --mut: #6b6961; --linha: #d9d7cf; --card: #fbfbf8; --ac: #e2551b; --ac-fg: #fff;
  --display: "Bricolage Grotesque", "Arial Black", system-ui, sans-serif;
  --body: "Geist", system-ui, -apple-system, "Segoe UI", sans-serif;
  --mono: "Geist Mono", ui-monospace, Consolas, monospace;
}}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{ --bg: #121210; --fg: #f0eee8; --mut: #9a978e; --linha: #2b2a26; --card: #1b1a17; --ac: #f26a2e; --ac-fg: #111; color-scheme: dark; }} }}
:root[data-theme="dark"] {{ --bg: #121210; --fg: #f0eee8; --mut: #9a978e; --linha: #2b2a26; --card: #1b1a17; --ac: #f26a2e; --ac-fg: #111; color-scheme: dark; }}
* {{ box-sizing: border-box; }}
body {{ background: var(--bg); color: var(--fg); font-family: var(--body); font-size: 15px; line-height: 1.5; }}
.wrap {{ max-width: 1400px; margin: 0 auto; padding-block: 0 120px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }}
.topo {{ padding-block: 28px 8px; display: grid; gap: 6px; }}
.topo h1 {{ font-family: var(--display); font-size: clamp(30px, 6vw, 52px); line-height: 1; margin: 0; text-wrap: balance; }}
.topo p {{ margin: 0; color: var(--mut); max-width: 70ch; }}
.item {{ border-top: 1px solid var(--linha); padding-block: 26px; display: grid; gap: 10px; }}
.cab {{ display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }}
.num {{ font-family: var(--display); font-size: 34px; line-height: 1; color: var(--ac); min-width: 1.4em; }}
.tempo {{ font-family: var(--mono); font-size: 13px; color: var(--mut); letter-spacing: .04em; }}
.cab h2 {{ margin: 0; font-size: 20px; font-weight: 600; text-wrap: balance; flex: 1 1 260px; min-width: 0; }}
blockquote {{ margin: 0; padding-left: 12px; border-left: 3px solid var(--linha); color: var(--mut); font-style: italic; max-width: 75ch; }}
.muda {{ margin: 0; max-width: 75ch; }}
.cols {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }}
.col {{ margin: 0; background: var(--card); border: 1px solid var(--linha); border-radius: 10px; padding: 10px; display: grid; gap: 8px; align-content: start; min-width: 0; }}
.col figcaption {{ font-family: var(--mono); font-size: 12px; letter-spacing: .05em; text-transform: uppercase; color: var(--mut); }}
.col[data-letra="b"] figcaption, .col[data-letra="c"] figcaption, .col[data-letra="d"] figcaption {{ color: var(--ac); }}
.quadros {{ display: grid; gap: 6px; }}
.quadros.q2 {{ grid-template-columns: 1fr 1fr; }}
.quadros.q3 {{ grid-template-columns: 1fr 1fr 1fr; }}
.quadros img, .quadros video {{ width: 100%; max-width: 100%; border-radius: 6px; display: block; background: #000; }}
.quadros video {{ grid-column: 1 / -1; }}
.escolha {{ display: flex; gap: 8px; flex-wrap: wrap; }}
.op {{ font: 600 16px var(--body); min-width: 48px; padding: 8px 14px; border-radius: 999px; border: 1px solid var(--linha); background: var(--card); color: var(--fg); cursor: pointer; }}
.op[aria-pressed="true"] {{ background: var(--ac); color: var(--ac-fg); border-color: var(--ac); }}
.op:focus-visible, .copiar:focus-visible {{ outline: 2px solid var(--ac); outline-offset: 2px; }}
.barra {{ position: fixed; left: 0; right: 0; bottom: 0; background: var(--card); border-top: 1px solid var(--linha);
  padding-block: 10px calc(10px + env(safe-area-inset-bottom, 0px)); padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }}
.barra .in {{ max-width: 1400px; margin: 0 auto; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }}
.resposta {{ font-family: var(--mono); font-size: 14px; flex: 1 1 240px; min-width: 0; overflow-wrap: anywhere; user-select: all; }}
.copiar {{ font: 600 15px var(--body); padding: 10px 18px; border-radius: 8px; border: 0; background: var(--fg); color: var(--bg); cursor: pointer; }}
.nota-lbl {{ font-family: var(--mono); font-size: 12px; letter-spacing: .05em; text-transform: uppercase; color: var(--mut); }}
.nota {{ width: 100%; max-width: 75ch; font: 15px/1.45 var(--body); color: var(--fg); background: var(--card); border: 1px solid var(--linha); border-radius: 8px; padding: 10px 12px; resize: vertical; min-height: 48px; }}
.nota:focus-visible {{ outline: 2px solid var(--ac); outline-offset: 1px; }}
.geral {{ display: grid; gap: 6px; padding-block: 8px 18px; }}
.geral .nota {{ min-height: 72px; }}
.status {{ font-size: 13px; color: var(--mut); flex: 0 1 auto; }}
@media (prefers-reduced-motion: no-preference) {{ .op {{ transition: background .15s, color .15s; }} }}
</style>
<div class="wrap">
  <div class="topo">
    <h1>{html.escape(titulo)}</h1>
    <p>Cada número é uma nota sua. <b>a</b> = deixa como está; <b>b</b>, <b>c</b> = as colunas novas. Toque na letra e, se quiser, escreva no campo embaixo de cada item. Tudo fica salvo aqui na página e o Claude lê direto, sem precisar copiar. Só renderizo depois da sua resposta.</p>
  </div>
  <div class="geral"><label class="nota-lbl" for="c0">Comentário geral do vídeo</label>
    <textarea class="nota" id="c0" data-n="0" rows="3" placeholder="Algo que vale para o vídeo inteiro (opcional)"></textarea></div>
  {''.join(blocos)}
</div>
<div class="barra"><div class="in"><span class="resposta" id="resp">nenhuma escolha ainda</span><span class="status" id="status" role="status">conectando…</span><button type="button" class="copiar" id="copiar">Copiar resposta</button></div></div>
<script>
const CHAVE = 'aprov_{video}_v4';
// estado: n -> {{escolha, comentario}}; n = 0 é o comentário geral
let est = {{}};
try {{ est = JSON.parse(localStorage.getItem(CHAVE) || '{{}}') || {{}}; }} catch (e) {{ est = {{}}; }}
if (Object.values(est).some(v => typeof v === 'string')) {{ const v = {{}}; for (const k in est) v[k] = {{escolha: est[k], comentario: ''}}; est = v; }}
const resp = document.getElementById('resp'), status = document.getElementById('status');
let db = null;
const fila = {{}};
const timers = {{}};
function guardaLocal() {{ try {{ localStorage.setItem(CHAVE, JSON.stringify(est)); }} catch (e) {{}} }}
function texto() {{
  const ks = Object.keys(est).map(Number).filter(k => est[k] && (est[k].escolha || (est[k].comentario || '').trim())).sort((a, b) => a - b);
  if (!ks.length) return 'nenhuma escolha ainda';
  return ks.map(k => {{ const e = est[k], c = (e.comentario || '').trim();
    return (k === 0 ? 'geral' : k + ' - ' + (e.escolha || '?')) + (c ? ' (' + c + ')' : ''); }}).join(', ');
}}
function pinta() {{
  document.querySelectorAll('.op').forEach(b => b.setAttribute('aria-pressed', (est[b.dataset.n] || {{}}).escolha === b.dataset.v ? 'true' : 'false'));
  document.querySelectorAll('.nota').forEach(t => {{ if (document.activeElement !== t) t.value = (est[t.dataset.n] || {{}}).comentario || ''; }});
  resp.textContent = texto();
}}
function salva(n) {{
  guardaLocal();
  if (!db) return;
  const e = est[n] || {{}};
  const corpo = {{n: Number(n), escolha: e.escolha || '', comentario: e.comentario || '', em: new Date().toISOString()}};
  status.textContent = 'salvando…';
  fila[n] = (fila[n] || Promise.resolve()).then(() => db.doc('respostas/i' + n).set(corpo))
    .then(() => {{ status.textContent = 'salvo · o Claude já consegue ler'; }})
    .catch(() => {{ status.textContent = 'não salvou aqui: copie a resposta e mande no chat'; }});
}}
document.querySelectorAll('.op').forEach(b => b.addEventListener('click', () => {{
  const n = b.dataset.n; const e = est[n] || (est[n] = {{escolha: '', comentario: ''}});
  e.escolha = e.escolha === b.dataset.v ? '' : b.dataset.v;
  pinta(); salva(n);
}}));
document.querySelectorAll('.nota').forEach(t => t.addEventListener('input', () => {{
  const n = t.dataset.n; const e = est[n] || (est[n] = {{escolha: '', comentario: ''}});
  e.comentario = t.value; resp.textContent = texto(); guardaLocal();
  clearTimeout(timers[n]); timers[n] = setTimeout(() => {{ timers[n] = null; salva(n); }}, 900);
}}));
document.querySelectorAll('.nota').forEach(t => t.addEventListener('blur', () => {{ const n = t.dataset.n; if (timers[n]) {{ clearTimeout(timers[n]); timers[n] = null; salva(n); }} }}));
document.getElementById('copiar').addEventListener('click', () => {{
  const t = '{html.escape(titulo)}: ' + texto();
  const sel = () => {{ const r = document.createRange(); r.selectNodeContents(resp); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }};
  const ok = () => {{ document.getElementById('copiar').textContent = 'Copiado'; setTimeout(() => document.getElementById('copiar').textContent = 'Copiar resposta', 1500); }};
  try {{ navigator.clipboard.writeText(t).then(ok, sel); }} catch (e) {{ sel(); }}
}});
pinta();
(async () => {{
  try {{ db = window.claude && window.claude.use ? await window.claude.use('db') : null; }} catch (e) {{ db = null; }}
  if (!db) {{ status.textContent = 'salvo só neste aparelho: copie a resposta e mande no chat'; return; }}
  status.textContent = 'conectado';
  db.collection('respostas').onSnapshot(snap => {{
    snap.docs.forEach(d => {{ const x = d.data() || {{}}; const n = String(x.n ?? d.id.slice(1));
      est[n] = {{escolha: x.escolha || '', comentario: x.comentario || ''}}; }});
    guardaLocal(); pinta();
  }}, () => {{ status.textContent = 'sem conexão: copie a resposta e mande no chat'; }});
}})();
</script>
'''
(out / 'index.html').write_text(pagina, encoding='utf-8')
(out / 'files.json').write_text(json.dumps(files, ensure_ascii=False, indent=1), encoding='utf-8')
print(len(itens), 'itens;', len(files), 'arquivos ->', out / 'index.html')
