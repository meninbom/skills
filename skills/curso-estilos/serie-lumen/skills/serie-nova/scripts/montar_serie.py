"""Monta a pasta de uma série nova (plugin serie-lumen), cria episódios e confere o que falta.

uso:
  python montar_serie.py nova    --pasta <sua pasta>/series/minha --nome "Minha Série" [--respostas respostas.json]
  python montar_serie.py ep      --pasta <sua pasta>/series/minha [--ep ep02]        (sem --ep: o próximo número livre)
  python montar_serie.py verificar --pasta <sua pasta>/series/minha

nova:
  - copia os modelos (CLAUDE.md, REGRAS.md, BIBLIA.md, LIVRO_RAZAO.md, ESCRITA.md) trocando {{NOME}};
  - cria fichas/ (com fichas.json vazio), exemplo_lumen/, ciclo/, ep01/;
  - grava kit.config.json (das respostas; campo sem resposta fica vazio) e .env.exemplo;
  - liga a trava de gasto: .claude/hooks/trava_pago.py + .claude/settings.json.
  Nunca sobrescreve: arquivo que já existe é mantido (e o settings.json antigo vai pra .claude/_antigo/ antes de juntar os hooks).
verificar: confere o config, as ferramentas e as bibliotecas e diz o que falta, sem gastar nada nem usar GPU.
"""
import os, sys, json, shutil, argparse, subprocess, time, importlib.util

for _s in (sys.stdout, sys.stderr):          # acento certo no terminal do Windows
    try: _s.reconfigure(encoding='utf-8')
    except Exception: pass

AQUI = os.path.dirname(os.path.abspath(__file__)); SKILL = os.path.dirname(AQUI)
MOD = os.path.join(SKILL, 'modelos'); EXEMPLO = os.path.join(SKILL, 'exemplo_lumen')

CONFIG_BASE = {
    "versao": 1,
    "serie": {"nome": "", "pasta": ""},
    "ferramentas": {"ffmpeg": "ffmpeg", "ffprobe": "ffprobe", "python": "python", "node": "node", "bash": "", "fonte": ""},
    "h3": {"comfyui_dir": "", "comfyui_url": "http://127.0.0.1:8188", "largura": 768, "altura": 1344, "passos": 20, "fps": 24,
           "pesos": {"unet": "minimax_h3_fl2va_pruned_int8_convrot.safetensors",
                     "clip": "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
                     "vae_video": "minimax_h3_video_vae_int8_convrot.safetensors",
                     "vae_audio": "minimax_h3_audio_vae_fp32.safetensors"}},
    "rife": {"dir": "", "modelo": "rife-v4.6"},
    "gpu": {"trava": "{serie}/.gpu.lock", "antes_de_subir": ""},
    "voz": {"env": "{serie}/.env", "chave": "ELEVENLABS_API_KEY", "modelo": "eleven_v4", "teto_por_ep": 2500,
            "vozes": {"narrador": ""}},
    "sfx": {"mapa": {"golpe": "", "subida": "", "vento": "", "bip": "", "troca": ""}},
    "trilha": {"arquivo": "", "db": -18},
    "fx": {"quadros": ""},
    "checar_video": {"script": ""}
}
FONTES_WIN = ['C:/Windows/Fonts/segoeuib.ttf', 'C:/Windows/Fonts/arialbd.ttf']


SUBSTITUI = {'vozes', 'mapa'}   # listas do aluno (papéis, sons): a resposta substitui o exemplo, não mistura


def junta(base, extra):
    """mistura dicts (extra vence), sem perder chaves da base; em voz.vozes e sfx.mapa a resposta substitui inteira"""
    out = json.loads(json.dumps(base))
    for k, v in (extra or {}).items():
        if k in SUBSTITUI and isinstance(v, dict):
            out[k] = v
        else:
            out[k] = junta(out[k], v) if isinstance(v, dict) and isinstance(out.get(k), dict) else v
    return out


def copia_modelo(src, dst, nome, ep=None, rel=None):
    if os.path.exists(dst):
        print('  mantido (já existia):', rel or dst); return False
    txt = open(src, encoding='utf-8').read().replace('{{NOME}}', nome)
    if ep: txt = txt.replace('{{EP}}', ep)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, 'w', encoding='utf-8').write(txt); print('  criado:', rel or dst); return True


def liga_trava(pasta):
    """copia o hook pra <serie>/.claude/hooks e junta os hooks no .claude/settings.json (caminho absoluto, como o Claude Code espera)"""
    cl = os.path.join(pasta, '.claude'); hk = os.path.join(cl, 'hooks'); os.makedirs(hk, exist_ok=True)
    alvo = os.path.join(hk, 'trava_pago.py')
    if not os.path.exists(alvo): shutil.copy(os.path.join(AQUI, 'trava_pago.py'), alvo)
    py = 'python'
    cmd_arq = alvo.replace('\\', '/')
    pre = {"matcher": "Bash|PowerShell|mcp__claude-in-chrome__.*|mcp__Claude_Browser__.*|mcp__remote-devices__Claude_Browser__.*",
           "hooks": [{"type": "command", "command": py, "args": [cmd_arq, "pre"], "timeout": 10}]}
    post = {"matcher": "mcp__claude-in-chrome__.*|mcp__Claude_Browser__.*|mcp__remote-devices__Claude_Browser__.*",
            "hooks": [{"type": "command", "command": py, "args": [cmd_arq, "post"], "timeout": 10}]}
    st = os.path.join(cl, 'settings.json'); S = {}
    if os.path.exists(st):
        S = json.load(open(st, encoding='utf-8'))
        if 'trava_pago.py' in json.dumps(S):
            print('  trava já ligada em .claude/settings.json'); return
        os.makedirs(os.path.join(cl, '_antigo'), exist_ok=True)
        shutil.copy(st, os.path.join(cl, '_antigo', f'settings_{time.strftime("%Y%m%d_%H%M%S")}.json'))
    H = S.setdefault('hooks', {})
    H.setdefault('PreToolUse', []).append(pre); H.setdefault('PostToolUse', []).append(post)
    json.dump(S, open(st, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    print('  trava de gasto ligada: .claude/settings.json + .claude/hooks/trava_pago.py')


def proximo_ep(pasta):
    n = 1
    while os.path.exists(os.path.join(pasta, f'ep{n:02d}')): n += 1
    return f'ep{n:02d}'


def cria_ep(pasta, nome, ep):
    E = os.path.join(pasta, ep); print(f'episódio {ep}:')
    for d in ('gpt', 'revisao', 'h3/placas', 'h3/clips', 'h3/clips60', 'h3/deriva', 'voz/pecas', 'scripts'):
        os.makedirs(os.path.join(E, d), exist_ok=True)
    for arq, dst in (('ROTEIRO.md', 'ROTEIRO.md'), ('LEIA.md', 'LEIA.md'), ('linha_estimada.json', 'linha_estimada.json'), ('falas.tsv', 'voz/falas.tsv')):
        copia_modelo(os.path.join(MOD, 'ep', arq), os.path.join(E, dst), nome, ep, f'{ep}/{dst}')
    cj = os.path.join(E, 'h3', 'clipes.json')
    if not os.path.exists(cj):
        json.dump({"P01": {"prompt": "(só quem está no quadro + a ação simples + câmera)", "q": 97, "quem": ""}},
                  open(cj, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    return E


def nova(a):
    pasta = os.path.abspath(a.pasta); os.makedirs(pasta, exist_ok=True)
    nome = a.nome or os.path.basename(pasta)
    print(f'série "{nome}" em {pasta}')
    for f in ('CLAUDE.md', 'REGRAS.md', 'BIBLIA.md', 'LIVRO_RAZAO.md', 'ESCRITA.md'):
        copia_modelo(os.path.join(MOD, f), os.path.join(pasta, f), nome, rel=f)
    os.makedirs(os.path.join(pasta, 'fichas'), exist_ok=True); os.makedirs(os.path.join(pasta, 'ciclo'), exist_ok=True)
    fj = os.path.join(pasta, 'fichas', 'fichas.json')
    if not os.path.exists(fj): json.dump({}, open(fj, 'w', encoding='utf-8'))
    ex = os.path.join(pasta, 'exemplo_lumen')
    if not os.path.exists(ex): shutil.copytree(EXEMPLO, ex); print('  criado: exemplo_lumen/ (fichas Nico, Iara, General)')
    # config
    cfgp = os.path.join(pasta, 'kit.config.json')
    if os.path.exists(cfgp):
        print('  mantido (já existia): kit.config.json')
    else:
        resp = json.load(open(a.respostas, encoding='utf-8')) if a.respostas else {}
        C = junta(CONFIG_BASE, resp)
        C['serie']['nome'] = nome; C['serie']['pasta'] = pasta.replace('\\', '/')
        if not C['ferramentas'].get('fonte'):
            C['ferramentas']['fonte'] = next((f for f in FONTES_WIN if os.path.exists(f)), '')
        json.dump(C, open(cfgp, 'w', encoding='utf-8'), indent=1, ensure_ascii=False); print('  criado: kit.config.json')
    envx = os.path.join(pasta, '.env.exemplo')
    if not os.path.exists(envx):
        open(envx, 'w', encoding='utf-8').write('# Copie este arquivo pra ".env" (na mesma pasta) e cole a sua chave depois do =.\n'
                                                '# Nunca cole a chave na conversa com o Claude.\nELEVENLABS_API_KEY=\n')
    gi = os.path.join(pasta, '.gitignore')
    if not os.path.exists(gi): open(gi, 'w', encoding='utf-8').write('.env\n.gpu.lock/\n.claude/hooks/.trava_pago_estado.json\n')
    liga_trava(pasta)
    cria_ep(pasta, nome, 'ep01')
    me = os.path.join(AQUI, 'montar_serie.py').replace(os.sep, '/')
    print(f'\npronto. Agora rode: python "{me}" verificar --pasta "{pasta.replace(os.sep, "/")}"')


def ep(a):
    pasta = os.path.abspath(a.pasta); cfg = json.load(open(os.path.join(pasta, 'kit.config.json'), encoding='utf-8'))
    e = a.ep or proximo_ep(pasta)
    if os.path.exists(os.path.join(pasta, e)) and a.ep:
        print(f'{e} já existe: só completo o que faltar.')
    cria_ep(pasta, cfg['serie']['nome'], e)


# ---------- verificar
def tem_cmd(c):
    try:
        subprocess.run([c, '-version'] if 'ff' in os.path.basename(c) else [c, '--version'], capture_output=True, timeout=20); return True
    except Exception:
        return False


def acha_git_bash(cfg_bash=None):
    """o bash do Git for Windows (não o do WSL, que não enxerga C:/ do mesmo jeito)"""
    cands = [cfg_bash] if cfg_bash else []
    if os.name == 'nt':
        for base in (os.environ.get('ProgramFiles', 'C:/Program Files'), os.environ.get('ProgramFiles(x86)', ''),
                     os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Programs')):
            if base: cands.append(os.path.join(base, 'Git', 'bin', 'bash.exe'))
        w = shutil.which('bash')
        if w and 'system32' not in w.lower() and 'windowsapps' not in w.lower(): cands.append(w)
    else:
        cands.append(shutil.which('bash'))
    return next((c for c in cands if c and os.path.isfile(c)), None)


def verificar(a):
    pasta = os.path.abspath(a.pasta); cfgp = os.path.join(pasta, 'kit.config.json')
    if not os.path.exists(cfgp): raise SystemExit('Sem kit.config.json nessa pasta. Rode "nova" primeiro.')
    C = json.load(open(cfgp, encoding='utf-8')); X = lambda v: v.replace('{serie}', pasta) if isinstance(v, str) else v
    linhas = []
    def ok(etapa, item, estado, dica=''): linhas.append((etapa, item, estado, dica))
    F = C.get('ferramentas', {})
    for k in ('ffmpeg', 'ffprobe', 'python', 'node'):
        ok('base', k, 'ok' if tem_cmd(F.get(k) or k) else 'FALTA', f'instale e ponha no PATH (ou o caminho em ferramentas.{k})')
    ok('base', 'Git Bash', 'ok' if acha_git_bash(F.get('bash')) else 'FALTA',
       'instale o Git for Windows (git-scm.com): animar-local e voz-serie rodam scripts .sh nele (ou o caminho em ferramentas.bash)')
    ok('base', 'fonte', 'ok' if F.get('fonte') and os.path.exists(F['fonte']) else 'aviso', 'ferramentas.fonte = um .ttf em negrito (sem isso, fonte padrão)')
    for mod, etapa in (('numpy', 'base'), ('PIL', 'base'), ('cv2', 'fx-golpe/checar'), ('faster_whisper', 'voz/ciclo/checar'),
                       ('rapidocr_onnxruntime', 'checar')):
        ok(etapa, f'python: {mod}', 'ok' if importlib.util.find_spec(mod) else 'FALTA', 'peça ao Claude: /serie-lumen:checar-pc (ele instala com o seu ok)')
    comfy = X(C.get('h3', {}).get('comfyui_dir', ''))
    if not comfy:
        ok('animar-local', 'ComfyUI', 'não configurado', 'h3.comfyui_dir (pasta com python_embeded/ e ComfyUI/). Sem placa: veja a skill animar-local, "Sem placa de vídeo"')
    else:
        ok('animar-local', 'ComfyUI', 'ok' if os.path.exists(os.path.join(comfy, 'ComfyUI', 'main.py')) else 'FALTA', f'não achei ComfyUI/main.py em {comfy}')
        mods = os.path.join(comfy, 'ComfyUI', 'models')
        for k, arq in C.get('h3', {}).get('pesos', {}).items():
            achou = any(os.path.exists(os.path.join(mods, sub, arq)) for sub in ('diffusion_models', 'unet', 'text_encoders', 'clip', 'vae', 'checkpoints'))
            ok('animar-local', f'peso {k}', 'ok' if achou else 'FALTA', f'{arq} (baixe pelo template do H3 no ComfyUI)')
    rife = X(C.get('rife', {}).get('dir', ''))
    ok('animar-local', 'RIFE', ('ok' if os.path.exists(os.path.join(rife, 'rife-ncnn-vulkan.exe')) or os.path.exists(os.path.join(rife, 'rife-ncnn-vulkan')) else 'FALTA') if rife else 'não configurado',
       'rife.dir = pasta do rife-ncnn-vulkan (GitHub do nihui, MIT)')
    V = C.get('voz', {}); envp = X(V.get('env', ''))
    tem_chave = False
    if envp and os.path.exists(envp):
        for ln in open(envp, encoding='utf-8'):
            if ln.split('=', 1)[0].strip() == V.get('chave', 'ELEVENLABS_API_KEY') and ln.split('=', 1)[1].strip():
                tem_chave = True
    ok('voz-serie', 'chave da ElevenLabs', 'ok' if tem_chave else 'FALTA', f'copie .env.exemplo pra .env e cole a chave lá (nunca na conversa)')
    vz = {k: v for k, v in V.get('vozes', {}).items()}
    ok('voz-serie', 'vozes', 'ok' if vz and all(vz.values()) else 'FALTA', 'voz.vozes = {papel: id da voz} (o id vem do site da ElevenLabs)')
    for k, arq in C.get('sfx', {}).get('mapa', {}).items():
        ok('ciclo-serie', f'sfx {k}', 'ok' if arq and os.path.exists(X(arq)) else 'opcional', 'sfx.mapa = arquivos das bibliotecas livres (SJC, Sound Effect Lab)')
    fxq = X(C.get('fx', {}).get('quadros', ''))
    ok('fx-golpe', 'pacote de efeitos', 'ok' if fxq and os.path.isdir(fxq) else 'amostra', 'fx.quadros = pasta do pacote completo (BAIXAR_EFEITOS.md); sem isso, só os 3 de amostra')
    sys.path.insert(0, AQUI); import kitcfg
    cv = kitcfg.acha_checar_video(C)
    ok('checagem', 'checar-video', 'ok' if cv else 'FALTA', 'vem no plugin curso-estilos: /plugin install curso-estilos@doti-cursos')
    st = os.path.join(pasta, '.claude', 'settings.json')
    ok('trava', 'trava de gasto', 'ok' if os.path.exists(st) and 'trava_pago.py' in open(st, encoding='utf-8').read() else 'FALTA', 'rode "nova" de novo nesta pasta')
    w = [max(len(str(l[i])) for l in linhas) for i in range(3)]
    print(f"{'etapa':<{w[0]}}  {'item':<{w[1]}}  {'estado':<{w[2]}}  o que fazer")
    for e, i, s, d in linhas:
        print(f'{e:<{w[0]}}  {i:<{w[1]}}  {s:<{w[2]}}  {"" if s == "ok" else d}')
    falta = [l for l in linhas if l[2] == 'FALTA']
    print(f'\n{len(falta)} item(ns) faltando.' if falta else '\ntudo pronto.')


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); sp = ap.add_subparsers(dest='cmd', required=True)
    p = sp.add_parser('nova'); p.add_argument('--pasta', required=True); p.add_argument('--nome'); p.add_argument('--respostas')
    p = sp.add_parser('ep'); p.add_argument('--pasta', required=True); p.add_argument('--ep')
    p = sp.add_parser('verificar'); p.add_argument('--pasta', required=True)
    a = ap.parse_args()
    {'nova': nova, 'ep': ep, 'verificar': verificar}[a.cmd](a)
