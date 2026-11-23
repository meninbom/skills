"""TRAVA DE GASTO (hook do Claude Code). Vale nas conversas abertas na pasta do projeto que tem o hook em .claude/settings.json
(modelo em settings_hook_exemplo.json).

Por quê: regra escrita ("pergunte antes de gastar") não segura uma conversa de 2.000 mensagens: uma sessão longa nossa gastou
milhares de créditos num site de geração com opção grátis na mão. O hook segura, porque roda fora da cabeça do modelo.

O que faz:
  pre  (PreToolUse): antes de AÇÃO no navegador (clique, digitação, JS, upload, formulário) numa aba de site que gasta crédito,
       ou de comando de terminal que chama API paga, devolve permissionDecision=ask -> VOCÊ tem que clicar em permitir.
       No navegador, depois do 1º "permitir", o mesmo site fica liberado por 1 h naquela conversa (senão seria um clique por quadro).
       No terminal (voz, API), pergunta TODA vez.
  post (PostToolUse): guarda a URL de cada aba (pelo que as ferramentas do navegador devolvem) e registra a liberação.
Ler, tirar print e navegar NÃO pergunta (não gasta). Falhou o script -> a ferramenta segue (não trava o trabalho à toa).
Lista de sites em PAGOS: edite para os serviços que VOCÊ usa. Site em que você só usa o que a assinatura já cobre pode ficar de fora.
"""
import sys, json, re, os, time

EST = os.environ.get('TRAVA_ESTADO') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '.trava_pago_estado.json')
PAGOS = ['higgsfield.ai', 'runninghub.ai', 'runninghub.cn', 'elevenlabs.io', 'fal.ai', 'fal.run', 'replicate.com',
         'klingai.com', 'hailuoai.video', 'hailuoai.com', 'minimax.io', 'krea.ai', 'runwayml.com', 'pika.art', 'leonardo.ai', 'midjourney.com',
         'openart.ai', 'tensor.art', 'freepik.com', 'suno.com', 'udio.com', 'vidu.com', 'pixverse.ai', 'seaart.ai', 'piapi.ai']
BASH_PAGO = re.compile(r'(gerar_vozes?|\bvoice\.py\b|--confirmo-custo|api\.elevenlabs\.io/v1/(text-to-speech|sound-generation|music|text-to-dialogue|speech-to-text)'
                       r'|runninghub\.(ai|cn)|fal\.run|api\.replicate\.com|higgsfield\.ai|minimax\.io|minimaxi\.com)', re.I)
LEITURA = re.compile(r'^\s*(grep|rg|cat|ls|head|tail|find|wc|less|echo|type|sed\s+-n|git\s+(log|diff|status|show)|Get-Content|Select-String)\b', re.I)
NAV = re.compile(r'^mcp__(claude-in-chrome|Claude_Browser|remote-devices__Claude_Browser)__(.+)$')
ACAO_COMPUTER = {'left_click', 'right_click', 'double_click', 'triple_click', 'type', 'key', 'left_click_drag'}
ACAO_TOOLS = {'javascript_tool', 'form_input', 'file_upload', 'upload_image'}
JANELA = 3600
GRATIS = [x.strip().lower() for x in os.environ.get('TRAVA_GRATIS', '').split(',') if x.strip()]   # pedaços de URL sem custo, ex.: "unlimited"


def carrega():
    try: return json.load(open(EST, encoding='utf-8'))
    except Exception: return {'abas': {}, 'liberado': {}}


def salva(e):
    try:
        tmp = EST + '.tmp'; json.dump(e, open(tmp, 'w', encoding='utf-8')); os.replace(tmp, EST)
    except Exception: pass


def dominio_pago(txt):
    t = (txt or '').lower()
    return next((d for d in PAGOS if d in t), None)


def acoes(nome, inp):
    """lista de (ferramenta, input) que agem na página; browser_batch abre em itens."""
    if nome == 'browser_batch':
        out = []
        for it in inp.get('actions', []) or []:
            out += acoes(str(it.get('name', '')).split('__')[-1], it.get('input', {}) or {})
        return out
    if nome in ACAO_TOOLS: return [(nome, inp)]
    if nome == 'computer' and inp.get('action') in ACAO_COMPUTER: return [(nome, inp)]
    return []


def site_da_acao(prefixo, nome, inp, est):
    d = dominio_pago(json.dumps(inp, ensure_ascii=False))          # JS/URL que cita o site pago
    if d: return d
    tab = inp.get('tabId', inp.get('tab_id'))
    chave = f'{prefixo}:{tab}' if tab is not None else f'{prefixo}:_ativa'
    url = est['abas'].get(chave)
    if url is None: url = est['abas'].get(f'{prefixo}:_ativa', '')   # aba que a trava ainda não viu = vale a da frente
    if any(x in url.lower() for x in GRATIS): return None      # páginas que você declarou sem custo (env TRAVA_GRATIS)
    return dominio_pago(url)


def pre(h):
    nome = h.get('tool_name', ''); inp = h.get('tool_input', {}) or {}; ses = h.get('session_id', '?')
    if nome in ('Bash', 'PowerShell'):
        cmd = str(inp.get('command', ''))
        for parte in re.split(r'&&|\|\||;|\||\n', cmd):              # cada comando da linha; grep/cat que só CITAM a palavra passam
            m2 = BASH_PAGO.search(parte)
            if m2 and not LEITURA.search(parte):
                return ask(f'TRAVA DE GASTO: esse comando chama geração PAGA ({m2.group(0)}). '
                           'Só permita se o chat já te disse quanto custa e quanto crédito você tem, e você deu o ok.')
        return None
    m = NAV.match(nome)
    if not m: return None
    prefixo, curto = m.group(1), m.group(2)
    est = carrega(); agora = time.time()
    for n2, i2 in acoes(curto, inp):
        d = site_da_acao(prefixo, n2, i2, est)
        if d and agora - est['liberado'].get(f'{ses}|{d}', 0) > JANELA:
            return ask(f'TRAVA DE GASTO: ação no {d}, que pode gastar crédito. Permita só se o chat já te disse o custo e quanto crédito você tem, '
                       'ou se o modo ilimitado/grátis está ligado. Permitir libera o site por 1 h nesta conversa.')
    return None


def post(h):
    nome = h.get('tool_name', ''); inp = h.get('tool_input', {}) or {}; ses = h.get('session_id', '?')
    m = NAV.match(nome)
    if not m: return
    prefixo, curto = m.group(1), m.group(2)
    est = carrega(); mudou = False
    # 1º a liberação, com as abas de ANTES da ação (um clique num site grátis que leva a aba para um site pago não pode liberar o pago)
    for n2, i2 in acoes(curto, inp):                                 # rodou = você permitiu (ou já estava liberado)
        d = site_da_acao(prefixo, n2, i2, est)
        if d and time.time() - est['liberado'].get(f'{ses}|{d}', 0) > JANELA:
            est['liberado'][f'{ses}|{d}'] = time.time(); mudou = True
    txt = texto(h.get('tool_response'))
    # toda resposta das ferramentas do navegador traz "Tab Context: ... tabId N: "título" ("url")"; o tabs_context traz também JSON
    for mm in re.finditer(r'tabId\s+([\w-]+):\s*".*?"\s*\("([^"]*)"\)', txt):
        est['abas'][f'{prefixo}:{mm.group(1)}'] = mm.group(2); mudou = True
    for mm in re.finditer(r'"tabId"\s*:\s*"?([\w-]+)"?[^{}]*?"url"\s*:\s*"([^"]*)"', txt):
        est['abas'][f'{prefixo}:{mm.group(1)}'] = mm.group(2); mudou = True
    # o navegador do app devolve só o "origin" (sem caminho): grava se a aba não tem URL desse site (não apaga a URL completa já guardada)
    for mm in re.finditer(r'"tabId"\s*:\s*"?([\w-]+)"?[^{}]*?"origin"\s*:\s*"([^"]*)"', txt):
        k = f'{prefixo}:{mm.group(1)}'
        if not est['abas'].get(k, '').startswith(mm.group(2)):
            est['abas'][k] = mm.group(2); mudou = True
    ex = re.search(r'Executed on tabId:\s*([\w-]+)', txt)
    if curto in ('navigate', 'preview_start') and inp.get('url'):
        tab = inp.get('tabId') or (ex.group(1) if ex else None)
        if tab is not None: est['abas'][f'{prefixo}:{tab}'] = inp['url']
        est['abas'][f'{prefixo}:_ativa'] = inp['url']; mudou = True
    elif ex and f'{prefixo}:{ex.group(1)}' in est['abas']:
        est['abas'][f'{prefixo}:_ativa'] = est['abas'][f'{prefixo}:{ex.group(1)}']; mudou = True
    if mudou: salva(est)


def texto(resp):
    if isinstance(resp, str): return resp
    if isinstance(resp, list): return '\n'.join(texto(x) for x in resp)
    if isinstance(resp, dict):
        if isinstance(resp.get('text'), str): return resp['text']
        if 'content' in resp: return texto(resp['content'])
    return json.dumps(resp, ensure_ascii=False)


def ask(motivo):
    return {'hookSpecificOutput': {'hookEventName': 'PreToolUse', 'permissionDecision': 'ask', 'permissionDecisionReason': motivo}}


if __name__ == '__main__':
    try:
        h = json.loads(sys.stdin.buffer.read().decode('utf-8', 'replace') or '{}')
        if sys.argv[1:2] == ['pre']:
            r = pre(h)
            if r: sys.stdout.write(json.dumps(r))   # ensure_ascii: acento vira ç, sem depender do código de página do Windows
        else:
            post(h)
    except Exception:
        pass
    sys.exit(0)
