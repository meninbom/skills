"""Página da entrega da manhã: os 7 v4 ao lado dos v3, com as decisões de cada um e um campo de comentário (db).

uso: python entrega.py      (lê _v4/entrega/videos.json; gera prévias leves e _v4/entrega/index.html + files.json)
videos.json: [{"slug","titulo","v3": caminho mp4, "v4": caminho mp4, "resumo": "...", "decisoes": [{"item","escolha","porque","alt"}],
               "checar": "...", "critico": "..."}]
"""
import html, json, pathlib, subprocess

V4 = pathlib.Path(__file__).resolve().parent.parent
OUT = V4 / 'entrega'
(OUT / 'v').mkdir(parents=True, exist_ok=True)
vids = json.loads((OUT / 'videos.json').read_text(encoding='utf-8'))
files = {}


def previa(src, nome):
    """540 px, ~6 MB: cabe no limite de 15 MB por arquivo do artifact"""
    dst = OUT / 'v' / nome
    if not dst.exists() or dst.stat().st_mtime < pathlib.Path(src).stat().st_mtime:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', 'scale=540:-2', '-c:v', 'libx264', '-preset', 'slow', '-crf', '26',
                        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', str(dst)], check=True)
    files['v/' + nome] = str(dst).replace('\\', '/')
    return 'v/' + nome


blocos = []
for v in vids:
    s = v['slug']
    p3 = previa(v['v3'], f'{s}_v3.mp4') if v.get('v3') else None
    p4 = previa(v['v4'], f'{s}_v4.mp4') if v.get('v4') else None
    linhas = ''.join(
        f'<tr><td>{html.escape(d.get("item", ""))}</td><td><b>{html.escape(d.get("escolha", ""))}</b></td>'
        f'<td>{html.escape(d.get("porque", ""))}</td><td>{html.escape(d.get("alt", ""))}</td></tr>' for d in v.get('decisoes', []))
    vid4 = f'<video src="{p4}" controls playsinline preload="metadata"></video>' if p4 else '<p class="falta">v4 ainda não renderizado</p>'
    vid3 = f'<video src="{p3}" controls playsinline preload="metadata"></video>' if p3 else ''
    blocos.append(f'''<section class="vid" id="{s}">
  <header><h2>{html.escape(v["titulo"])}</h2><p class="resumo">{html.escape(v.get("resumo", ""))}</p></header>
  <div class="par">
    <figure><figcaption>v3 · antes</figcaption>{vid3}</figure>
    <figure class="novo"><figcaption>v4 · agora</figcaption>{vid4}</figure>
  </div>
  <details open><summary>Decisões ({len(v.get("decisoes", []))})</summary>
    <div class="tabela"><table><thead><tr><th>item</th><th>ficou</th><th>por quê</th><th>alternativa</th></tr></thead><tbody>{linhas}</tbody></table></div>
  </details>
  <p class="meta">{html.escape(v.get("checar", ""))}</p>
  <p class="meta">{html.escape(v.get("critico", ""))}</p>
  <label class="lbl" for="c_{s}">O que trocar no {html.escape(v["titulo"])}</label>
  <textarea class="nota" id="c_{s}" data-s="{s}" rows="3" placeholder="Ex.: item 5 → c; música → d; tirar o carimbo…"></textarea>
</section>''')

nav = ''.join(f'<a href="#{v["slug"]}">{html.escape(v["titulo"])}</a>' for v in vids)
pagina = f'''<title>Série v4 · entrega</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Geist:wght@400;500;600&family=Geist+Mono:wght@500&display=swap">
<style>
/* sala de projeção: cada vídeo numa faixa, v3 e v4 lado a lado, decisões embaixo */
:root {{ --bg: #efeee9; --fg: #161614; --mut: #6b6961; --linha: #d9d7cf; --card: #fbfbf8; --ac: #e2551b;
  --display: "Bricolage Grotesque", "Arial Black", system-ui, sans-serif; --body: "Geist", system-ui, -apple-system, "Segoe UI", sans-serif; --mono: "Geist Mono", ui-monospace, Consolas, monospace; }}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{ --bg: #121210; --fg: #f0eee8; --mut: #9a978e; --linha: #2b2a26; --card: #1b1a17; --ac: #f26a2e; color-scheme: dark; }} }}
:root[data-theme="dark"] {{ --bg: #121210; --fg: #f0eee8; --mut: #9a978e; --linha: #2b2a26; --card: #1b1a17; --ac: #f26a2e; color-scheme: dark; }}
* {{ box-sizing: border-box; }}
body {{ background: var(--bg); color: var(--fg); font: 15px/1.5 var(--body); }}
.wrap {{ max-width: 1200px; margin: 0 auto; padding-block: 0 80px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }}
.topo {{ padding-block: 28px 10px; display: grid; gap: 8px; }}
h1 {{ font-family: var(--display); font-size: clamp(32px, 6vw, 56px); line-height: 1; margin: 0; }}
.topo p {{ margin: 0; color: var(--mut); max-width: 75ch; }}
nav {{ display: flex; gap: 8px; flex-wrap: wrap; position: sticky; top: env(safe-area-inset-top, 0px); background: var(--bg); padding-block: 10px; z-index: 2; border-bottom: 1px solid var(--linha); }}
nav a {{ color: var(--fg); text-decoration: none; border: 1px solid var(--linha); border-radius: 999px; padding: 4px 12px; font-weight: 600; }}
nav a:focus-visible, .nota:focus-visible {{ outline: 2px solid var(--ac); outline-offset: 2px; }}
.vid {{ border-top: 1px solid var(--linha); padding-block: 28px; display: grid; gap: 12px; }}
.vid h2 {{ font-family: var(--display); font-size: 34px; margin: 0; }}
.resumo {{ margin: 4px 0 0; max-width: 80ch; }}
.par {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; max-width: 760px; }}
figure {{ margin: 0; display: grid; gap: 6px; min-width: 0; }}
figcaption {{ font-family: var(--mono); font-size: 12px; letter-spacing: .05em; text-transform: uppercase; color: var(--mut); }}
.novo figcaption {{ color: var(--ac); }}
video {{ width: 100%; max-width: 100%; border-radius: 8px; background: #000; display: block; }}
.falta {{ color: var(--mut); font-style: italic; }}
details summary {{ cursor: pointer; font-weight: 600; }}
.tabela {{ overflow-x: auto; }}
table {{ border-collapse: collapse; width: 100%; min-width: 620px; font-size: 14px; }}
th, td {{ text-align: left; vertical-align: top; padding: 6px 8px; border-bottom: 1px solid var(--linha); }}
th {{ font-family: var(--mono); font-size: 11px; letter-spacing: .05em; text-transform: uppercase; color: var(--mut); }}
.meta {{ margin: 0; color: var(--mut); font-size: 13px; max-width: 90ch; }}
.lbl {{ font-family: var(--mono); font-size: 12px; letter-spacing: .05em; text-transform: uppercase; color: var(--mut); }}
.nota {{ width: 100%; max-width: 80ch; font: 15px/1.45 var(--body); color: var(--fg); background: var(--card); border: 1px solid var(--linha); border-radius: 8px; padding: 10px 12px; resize: vertical; }}
.status {{ position: fixed; right: max(12px, env(safe-area-inset-right, 0px)); bottom: calc(12px + env(safe-area-inset-bottom, 0px)); background: var(--card); border: 1px solid var(--linha); border-radius: 8px; padding: 6px 10px; font-size: 13px; color: var(--mut); }}
</style>
<div class="wrap">
  <div class="topo"><h1>Série v4</h1>
    <p>Os 7 vídeos refeitos, cada um com a versão anterior ao lado. Embaixo de cada um, as decisões que tomei sozinho à noite (com a alternativa) e um campo para você escrever o que trocar. O que você escrever fica salvo aqui e eu leio direto.</p></div>
  <nav aria-label="Vídeos">{nav}</nav>
  {''.join(blocos)}
</div>
<span class="status" id="status" role="status">conectando…</span>
<script>
const st = document.getElementById('status'); let db = null; const fila = {{}}; const tm = {{}};
const CH = 'serie_v4_entrega';
let loc = {{}}; try {{ loc = JSON.parse(localStorage.getItem(CH) || '{{}}') || {{}}; }} catch (e) {{ loc = {{}}; }}
document.querySelectorAll('.nota').forEach(t => {{ t.value = loc[t.dataset.s] || ''; }});
function salva(s, txt) {{
  try {{ loc[s] = txt; localStorage.setItem(CH, JSON.stringify(loc)); }} catch (e) {{}}
  if (!db) return;
  st.textContent = 'salvando…';
  fila[s] = (fila[s] || Promise.resolve()).then(() => db.doc('pedidos/' + s).set({{video: s, texto: txt, em: new Date().toISOString()}}))
    .then(() => {{ st.textContent = 'salvo'; }}).catch(() => {{ st.textContent = 'não salvou: mande no chat'; }});
}}
document.querySelectorAll('.nota').forEach(t => {{
  t.addEventListener('input', () => {{ clearTimeout(tm[t.dataset.s]); tm[t.dataset.s] = setTimeout(() => {{ tm[t.dataset.s] = null; salva(t.dataset.s, t.value); }}, 900); }});
  t.addEventListener('blur', () => {{ if (tm[t.dataset.s]) {{ clearTimeout(tm[t.dataset.s]); tm[t.dataset.s] = null; salva(t.dataset.s, t.value); }} }});
}});
(async () => {{
  try {{ db = window.claude && window.claude.use ? await window.claude.use('db') : null; }} catch (e) {{ db = null; }}
  if (!db) {{ st.textContent = 'salvo só neste aparelho'; return; }}
  st.textContent = 'conectado';
  db.collection('pedidos').onSnapshot(snap => {{ snap.docs.forEach(d => {{ const x = d.data() || {{}}; const t = document.getElementById('c_' + (x.video || d.id));
    if (t && document.activeElement !== t) t.value = x.texto || ''; }}); }}, () => {{ st.textContent = 'sem conexão'; }});
}})();
</script>
'''
(OUT / 'index.html').write_text(pagina, encoding='utf-8')
(OUT / 'files.json').write_text(json.dumps([{'path': k} for k in files], ensure_ascii=False), encoding='utf-8')
tot = sum(pathlib.Path(p).stat().st_size for p in files.values())
print(len(vids), 'vídeos;', len(files), 'arquivos;', round(tot / 1e6, 1), 'MB')
