"""kitcfg: acha e lê o kit.config.json da série (kit da trilha LUMEN).

Ordem de busca:
  1. variável KIT_SERIE_CONFIG (caminho do arquivo);
  2. kit.config.json na pasta atual ou em alguma pasta acima;
  3. ~/.kit_serie/config.json.
Faltou o arquivo ou um campo: para com uma mensagem que diz o que preencher. Nunca chuta caminho.

uso nos scripts:
    import kitcfg
    cfg = kitcfg.carrega()                       # dict inteiro
    ff = kitcfg.get('ferramentas.ffmpeg', 'ffmpeg')
    comfy = kitcfg.exige('h3.comfyui_dir')       # para se faltar
    serie = kitcfg.pasta_serie()
Cada skill leva a sua cópia deste arquivo em scripts/ (as skills são autocontidas).
"""
import os, json

NOME = 'kit.config.json'
_cache = {}


class FaltaConfig(SystemExit):
    pass


def acha(inicio=None):
    env = os.environ.get('KIT_SERIE_CONFIG')
    if env:
        if not os.path.isfile(env):
            raise FaltaConfig(f'KIT_SERIE_CONFIG aponta pra "{env}", que não existe.')
        return os.path.abspath(env)
    d = os.path.abspath(inicio or os.getcwd())
    while True:
        p = os.path.join(d, NOME)
        if os.path.isfile(p):
            return p
        pai = os.path.dirname(d)
        if pai == d:
            break
        d = pai
    p = os.path.join(os.path.expanduser('~'), '.kit_serie', 'config.json')
    return p if os.path.isfile(p) else None


def carrega(inicio=None, obrigatorio=True):
    p = acha(inicio)
    if not p:
        if obrigatorio:
            raise FaltaConfig('Não achei o kit.config.json. Rode a /serie-lumen:serie-nova primeiro (ela pergunta e grava), '
                              'ou abra o Claude dentro da pasta da série.')
        return {}
    if p not in _cache:
        with open(p, encoding='utf-8') as f:
            c = json.load(f)
        c['_arquivo'] = p
        _cache[p] = c
    return _cache[p]


def get(chave, padrao=None, cfg=None):
    c = cfg if cfg is not None else carrega(obrigatorio=False)
    for k in chave.split('.'):
        if not isinstance(c, dict) or k not in c or c[k] in (None, ''):
            return padrao
        c = c[k]
    return expande(c)


def exige(chave, dica='', cfg=None):
    v = get(chave, None, cfg)
    if v is None:
        arq = (cfg or carrega(obrigatorio=False)).get('_arquivo', NOME)
        raise FaltaConfig(f'Falta "{chave}" no {arq}. {dica}'.strip())
    return v


def pasta_serie(cfg=None):
    c = cfg if cfg is not None else carrega()
    p = get('serie.pasta', None, c)
    return os.path.abspath(p) if p else os.path.dirname(c['_arquivo'])


def acha_checar_video(cfg=None):
    """o checar.py da skill checar-video, que vem no plugin curso-estilos. Ordem:
    1) checar_video.script do config; 2) skill irmã nesta mesma pasta de skills; 3) qualquer plugin instalado em
    ~/.claude/plugins (o curso-estilos); 4) ~/.claude/skills/checar-video. Devolve o caminho ou None."""
    import glob
    p = get('checar_video.script', None, cfg)
    if p and os.path.isfile(p):
        return os.path.abspath(p)
    aqui = os.path.dirname(os.path.abspath(__file__))                      # <skill>/scripts
    cands = [os.path.join(aqui, '..', '..', 'checar-video', 'scripts', 'checar.py')]
    base = os.environ.get('CLAUDE_CONFIG_DIR') or os.path.join(os.path.expanduser('~'), '.claude')   # config isolada do Claude Code
    raiz = os.path.join(base, 'plugins')
    if os.path.isdir(raiz):
        cands += sorted(glob.glob(os.path.join(raiz, '**', 'curso-estilos', '**', 'checar-video', 'scripts', 'checar.py'), recursive=True), reverse=True)
        cands += sorted(glob.glob(os.path.join(raiz, '**', 'checar-video', 'scripts', 'checar.py'), recursive=True), reverse=True)
    cands.append(os.path.join(base, 'skills', 'checar-video', 'scripts', 'checar.py'))
    return next((os.path.abspath(c) for c in cands if os.path.isfile(c)), None)


def expande(v):
    """troca {serie} pela pasta da série e ~ pela pasta do usuário, em texto, lista ou dict"""
    if isinstance(v, str):
        if '{serie}' in v:
            c = carrega(obrigatorio=False)
            base = c.get('serie', {}).get('pasta') or (os.path.dirname(c['_arquivo']) if c.get('_arquivo') else '')
            v = v.replace('{serie}', base)
        return os.path.expanduser(v) if v.startswith('~') else v
    if isinstance(v, list):
        return [expande(x) for x in v]
    if isinstance(v, dict):
        return {k: expande(x) for k, x in v.items()}
    return v


if __name__ == '__main__':
    p = acha()
    print(p or '(sem kit.config.json)')
    if p:
        print(json.dumps(carrega(), indent=1, ensure_ascii=False))
