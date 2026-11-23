"""Prepara a revisão de quadros (ver ../REVISOR.md): entrada.json + metades em tamanho cheio, pro revisor olhar sem miniatura.

uso: python preparar.py --lista ESCOLHIDOS.txt --pasta <pasta dos quadros> --saida <dir> [--desc descricoes.json] [--fichas a.png,b.png]
  --lista : linhas 'nº<TAB>nome' (nome sem extensão; acha .png/.jpg/.jpeg na --pasta)
  --desc  : {"nº": {"descricao": "...", "quem": "nico iara"}}  (nº como texto)
  --fichas: força a lista de fichas. Sem isso, lê <serie>/fichas/fichas.json (pasta da série pelo kit.config.json).
"""
import sys as _sys_utf8
for _s in (_sys_utf8.stdout, _sys_utf8.stderr):   # acento certo no terminal do Windows, inclusive nas mensagens de erro
    try: _s.reconfigure(encoding='utf-8')
    except Exception: pass
import os, sys, json, argparse
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kitcfg  # noqa: E402

EXTS = ('.png', '.jpg', '.jpeg', '.webp', '')


def fichas_da_serie():
    """lê <serie>/fichas/fichas.json -> (lista de arquivos, texto por personagem)"""
    cfg = kitcfg.carrega(obrigatorio=False)
    if not cfg:
        return [], {}
    serie = kitcfg.pasta_serie(cfg)
    fj = os.path.join(serie, 'fichas', 'fichas.json')
    if not os.path.isfile(fj):
        return [], {}
    F = json.load(open(fj, encoding='utf-8'))
    arqs, txt = [], {}
    POR_NOME.clear(); LUGARES.clear()
    for nome, f in F.items():
        if nome == '_lugares':
            for lugar, l in (f or {}).items():
                if l.get('arquivo'):
                    arqs.append(abs_serie(serie, l['arquivo'])); LUGARES.append(arqs[-1])
                txt[f'lugar: {lugar}'] = {k: v for k, v in l.items() if k != 'arquivo'}
            continue
        if f.get('arquivo'):
            arqs.append(abs_serie(serie, f['arquivo'])); POR_NOME[nome.lower()] = arqs[-1]
        txt[nome] = {k: v for k, v in f.items() if k != 'arquivo'}
    falta = [a for a in arqs if not os.path.isfile(a)]
    if falta:
        print('AVISO: ficha listada no fichas.json não existe:', falta)
    return [a for a in arqs if os.path.isfile(a)], txt


POR_NOME, LUGARES = {}, []   # nome do personagem (minúsculo) -> ficha; fichas de lugar


def fichas_do_quadro(quem):
    """só as fichas de quem está no quadro ("nico iara", "Nico, IARA"...) + as de lugar. Vazio = o revisor usa todas."""
    nomes = [x for x in quem.replace(',', ' ').lower().split() if x]
    sel = [POR_NOME[x] for x in nomes if x in POR_NOME and os.path.isfile(POR_NOME[x])]
    desconhecidos = [x for x in nomes if x not in POR_NOME]
    return (sel + [l for l in LUGARES if os.path.isfile(l)]) if sel else [], desconhecidos


def abs_serie(serie, p):
    p = p.replace('\\', '/')
    return (p if os.path.isabs(p) else os.path.join(serie, p)).replace('\\', '/')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--lista', required=True); ap.add_argument('--pasta', required=True); ap.add_argument('--saida', required=True)
    ap.add_argument('--desc'); ap.add_argument('--fichas')
    a = ap.parse_args()
    os.makedirs(os.path.join(a.saida, 'zoom'), exist_ok=True)
    desc = json.load(open(a.desc, encoding='utf-8')) if a.desc else {}
    quadros, falta = [], []
    for ln in open(a.lista, encoding='utf-8').read().splitlines():
        if not ln.strip() or ln.startswith('#'):
            continue
        partes = ln.split('\t') if '\t' in ln else ln.split(None, 1)
        n, nome = int(partes[0]), partes[1].strip()
        arq = next((os.path.join(a.pasta, nome + e) for e in EXTS if os.path.isfile(os.path.join(a.pasta, nome + e))), None)
        if not arq:
            falta.append((n, nome)); continue
        im = Image.open(arq).convert('RGB'); w, h = im.size
        s = 1600 / h if h < 1600 else 1.0                      # amplia quadro pequeno pra o detalhe aparecer
        if s != 1.0:
            im = im.resize((round(w * s), round(h * s)), Image.LANCZOS); w, h = im.size
        z = {}
        for parte, caixa in (('cima', (0, 0, w, h * 55 // 100)), ('baixo', (0, h * 45 // 100, w, h))):
            p = os.path.join(a.saida, 'zoom', f'{n:02d}_{parte}.png'); im.crop(caixa).save(p)
            z[parte] = os.path.abspath(p).replace('\\', '/')
        d = desc.get(str(n), {})
        quadros.append(dict(n=n, nome=nome, arquivo=os.path.abspath(arq).replace('\\', '/'), zoom_cima=z['cima'], zoom_baixo=z['baixo'],
                            descricao=d.get('descricao', '(sem descrição: revisar anatomia, ficha, chão, escala e objetos)'),
                            quem=d.get('quem', '')))
    if a.fichas:
        fichas, fichas_txt = [os.path.abspath(x).replace('\\', '/') for x in a.fichas.split(',')], {}
    else:
        fichas, fichas_txt = fichas_da_serie()
    if not fichas:
        print('AVISO: nenhuma ficha. O revisor vai olhar só anatomia, chão, objetos e plano. '
              'Ponha as fichas em <serie>/fichas/ + fichas.json, ou use --fichas.')
    for q in quadros:                      # cada quadro leva só as fichas de quem está nele (o campo "quem" da descrição)
        q['fichas_quadro'], desc_ = fichas_do_quadro(q['quem']) if not a.fichas else ([], [])
        if desc_:
            print(f"AVISO: quadro {q['n']}: \"{' '.join(desc_)}\" do campo quem não tem ficha no fichas.json (nomes: {', '.join(sorted(POR_NOME)) or 'nenhum'})")
    json.dump(dict(fichas=fichas, fichas_texto=fichas_txt, quadros=quadros),
              open(os.path.join(a.saida, 'entrada.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    for n, nome in falta:
        print('FALTA', n, nome)
    print(len(quadros), 'quadros ->', os.path.join(a.saida, 'entrada.json'))


if __name__ == '__main__':
    main()
