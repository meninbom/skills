
import json, re, sys

SKIP_SENDER_SUBSTR = [
    'visorfinance', '99pay', '99app.com', 'mkt-cc-mail.99app', 'c6bank', 'c6.com',
    'esfera.com', 'btgpactual', 'portoseguro', 'unimed', 'santander', 'empregare',
    'perplexity', 'nubank', 'picpay', 'serasa',
    'inter.co', 'bancointer', 'itau', 'bradesco', 'pagbank', 'mercadopago',
    'binance', 'mercuriuscrypto', 'nomad', 'avenue', 'warren', 'genial',
    'modalmais', 'orama', 'btg', 'sicoob', 'xpi.com', 'xpinc', 'valemobi',
    'trademap', 'bity.com', 'ripio.com', 'melver.com', 'academiarafaeltoro',
    'clear.com.br', 'rico.com.vc', 'toroinvestimentos', 'nuinvest', 'modal.com',
    'banco.bradesco', 'bb.com.br', 'caixa.gov', 'safra', 'original.com',
    'neon.com', 'willbank', 'digio', 'midway', 'carrefoursolucoes',
    'porto.bank', 'bv.com.br', 'banrisul', 'sicredi', 'agibank',
    'credicard', 'hipercard', 'elo.com', 'americanas.cartao',
    'openfinance', 'open-finance',
]

SKIP_PHRASE = [
    r'informe\s*de\s*rendimento',
    r'c[oó]digo\s*de\s*seguran',
    r'cadastro\s*(foi\s*)?aprovado',
    r'new\s*sign[- ]?in',
    r'novo\s*acesso',
    r'alerta\s*de\s*seguran',
    r'security\s*alert',
    r'verification\s*code',
    r'c[oó]digo\s*de\s*verifica',
    r'termos\s*(de\s*servi[cç]o|e\s*pol)',
    r'terms\s*of\s*service',
    r'pol[ií]tica\s*de\s*privacidade',
    r'privacy\s*policy',
    r'atualizando\s*nossos\s*termos',
    r'updating\s*our\s*terms',
    r'\bcurr[ií]culo\b',
    r'\bentrevista',
    r'\best[aá]gio\b',
    r'\binternship\b',
    r'\bemprego\b',
    r'\bcarreira\b',
    r'\bvagas?\b',
    r'\btrainee\b',
    r'processo\s*seletivo',
    r'\bcandidatura\b',
    r'google-gemini-noreply',
]

def classify_thread(t):
    msg = t['messages'][0]
    sender = msg.get('sender') or ''
    subject = msg.get('subject') or ''
    snippet = msg.get('snippet') or ''
    sl = sender.lower()
    text = f"{sl} {subject} {snippet}".lower()
    info = {'id': t['id'], 'sender': sender, 'subject': subject, 'snippet': snippet[:150]}

    for s in SKIP_SENDER_SUBSTR:
        if s in sl:
            info['reason'] = f'skip_sender:{s}'
            return 'skip', info
    if 'google-gemini' in sl or ('gemini' in sl and re.search(r'emprego|carreira|curr[ií]culo|job', text)):
        info['reason'] = 'gemini job'
        return 'skip', info
    PROMO_SENDERS = ('dio.me','stz.com','cinemark','ifood','visa.com','coursera','replit',
        'netflix','grancursos','burgerking','livrarias','aliexpress','netshoes','canva.com',
        'clickup','monday.com','lovable','superbet','mercado.livre','mercadolivre','ea.com',
        'activision','2k.com','dropbox','opus.pro','todoist','globoplay','bandplay')
    for pat in SKIP_PHRASE:
        if re.search(pat, text, re.I):
            # allow known promo brands unless subject itself looks job/security/terms
            if any(p in sl for p in PROMO_SENDERS) and pat in (
                r'\bcarreira\b', r'\bemprego\b', r'\bvagas?\b'
            ) and not re.search(r'(curr[ií]culo|entrevista|est[aá]gio|internship|processo seletivo|candidatura)', subject, re.I):
                continue
            info['reason'] = f'skip_phrase:{pat}'
            return 'skip', info
    if 'canva.com' in sl and re.search(r'carreira|career|emprego|job|curr[ií]culo', text, re.I):
        info['reason'] = 'canva job/career'
        return 'skip', info
    if re.search(r'@(gmail|hotmail|outlook|yahoo|uol|terra)\.', sl) and not re.search(r'no[-_]?reply|nao[-_]?respon|noreply', sl):
        info['reason'] = 'personal-looking sender'
        return 'skip', info
    return 'archive', info

def classify_file(path, out_path=None):
    d = json.load(open(path))
    threads = d.get('threads') or []
    archive, skip = [], []
    for t in threads:
        kind, info = classify_thread(t)
        (archive if kind=='archive' else skip).append(info)
    out = {'archive_ids':[a['id'] for a in archive], 'archive':archive, 'skip':skip,
           'nextPageToken': d.get('nextPageToken'), 'count': len(threads)}
    if out_path:
        json.dump(out, open(out_path,'w'), ensure_ascii=False, indent=2)
    return out

if __name__ == '__main__':
    path = sys.argv[1]
    out = sys.argv[2] if len(sys.argv)>2 else path.replace('.txt','_class.json')
    r = classify_file(path, out)
    print(f"count={r['count']} archive={len(r['archive_ids'])} skip={len(r['skip'])} next={r['nextPageToken']}")
    for a in r['archive']:
        print(f"A\t{a['id']}\t{a['sender'][:40]}\t{a['subject'][:70]}")
    for s in r['skip']:
        print(f"S\t{s['id']}\t{s['sender'][:40]}\t{s['subject'][:55]}\t{s['reason']}")
