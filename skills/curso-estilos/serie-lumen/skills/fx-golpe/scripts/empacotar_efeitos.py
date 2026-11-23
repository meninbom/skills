"""empacotar_efeitos.py: gera o zip do pacote de efeitos (pra subir no Drive) + a lista do que foi.

uso:
    python empacotar_efeitos.py PASTA_QUADROS SAIDA.zip [--licencas PASTA] [--catalogo PASTA]
    ex.: python empacotar_efeitos.py <sua pasta>/efeitos/quadros <sua pasta>/drive/efeitos_fx_golpe.zip

- PASTA_QUADROS: a pasta com uma subpasta por efeito (<pack>__<nome>/fNNNN.jpg).
- SAIDA.zip: o zip. Dentro dele, tudo fica em "quadros/" (é essa pasta que o aluno aponta em "fx.quadros").
- --licencas: pasta com os arquivos de licença; vão pra "licencas/" dentro do zip (padrão: ../licencas da skill).
- --catalogo: pasta com catalogo*.json pra pôr o número de cada efeito na lista (padrão: a pasta da skill).
Grava também SAIDA_lista.txt e SAIDA_lista.json: efeito, nº no catálogo, quadros, tamanho e o SHA-256 do zip.
JPG já é comprimido: o zip só guarda (sem comprimir de novo), o que deixa rápido.
Não apaga nada. Se o zip já existir, para (use outro nome).
"""
import argparse, glob, hashlib, json, os, sys, zipfile

AQUI = os.path.dirname(os.path.abspath(__file__)); SKILL = os.path.dirname(AQUI)


def numeros(pasta_cat):
    n = {}
    for f in sorted(glob.glob(os.path.join(pasta_cat, 'catalogo*.json'))):
        with open(f, encoding='utf-8') as fh:
            for x in json.load(fh):
                n[x['nome']] = x['n']
    return n


def sha256(arq):
    h = hashlib.sha256()
    with open(arq, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def main():
    for st in (sys.stdout, sys.stderr):
        try: st.reconfigure(encoding='utf-8')
        except Exception: pass
    ap = argparse.ArgumentParser()
    ap.add_argument('quadros'); ap.add_argument('saida')
    ap.add_argument('--licencas', default=os.path.join(SKILL, 'licencas'))
    ap.add_argument('--catalogo', default=SKILL)
    a = ap.parse_args()
    if not os.path.isdir(a.quadros):
        raise SystemExit(f'pasta não existe: {a.quadros}')
    if os.path.exists(a.saida):
        raise SystemExit(f'{a.saida} já existe. Escolha outro nome (este script não apaga nada).')
    efs = sorted(d for d in os.listdir(a.quadros) if glob.glob(os.path.join(a.quadros, d, 'f*.jpg')))
    if not efs:
        raise SystemExit(f'nenhum efeito (subpasta com f*.jpg) em {a.quadros}')
    num = numeros(a.catalogo)
    lista, total = [], 0
    os.makedirs(os.path.dirname(os.path.abspath(a.saida)), exist_ok=True)
    with zipfile.ZipFile(a.saida, 'w', zipfile.ZIP_STORED, allowZip64=True) as z:
        for i, e in enumerate(efs, 1):
            fs = sorted(glob.glob(os.path.join(a.quadros, e, 'f*.jpg')))
            tam = sum(os.path.getsize(f) for f in fs); total += tam
            for f in fs:
                z.write(f, f'quadros/{e}/{os.path.basename(f)}')
            lista.append({'n': num.get(e), 'nome': e, 'quadros': len(fs), 'seg': round(len(fs) / 30, 2), 'bytes': tam})
            if i % 25 == 0 or i == len(efs):
                print(f'  {i}/{len(efs)} efeitos, {total / 1e6:.1f} MB')
        lic = sorted(glob.glob(os.path.join(a.licencas, '*'))) if os.path.isdir(a.licencas) else []
        for f in lic:
            z.write(f, f'licencas/{os.path.basename(f)}')
        z.writestr('LEIA.txt', 'Pacote de efeitos do fx-golpe (Effekseer, renderizados 1080x1920, 30 qps, fundo preto).\n'
                   'Descompacte e ponha o caminho da pasta "quadros" em "fx.quadros" no kit.config.json da sua série.\n'
                   'Licenças: pasta "licencas" (CC-0 e MIT).\n')
    base = os.path.splitext(a.saida)[0]
    info = {'zip': os.path.basename(a.saida), 'efeitos': len(lista), 'bytes_quadros': total,
            'bytes_zip': os.path.getsize(a.saida), 'sha256': sha256(a.saida),
            'licencas': [os.path.basename(f) for f in lic], 'lista': lista}
    with open(base + '_lista.json', 'w', encoding='utf-8') as f:
        json.dump(info, f, ensure_ascii=False, indent=1)
    with open(base + '_lista.txt', 'w', encoding='utf-8') as f:
        f.write(f"{info['zip']}  {len(lista)} efeitos  {info['bytes_zip'] / 1e6:.1f} MB\nsha256 {info['sha256']}\n\n")
        f.write('nº\tefeito\tquadros\tseg\tMB\n')
        for x in sorted(lista, key=lambda x: (x['n'] is None, x['n'] or 0, x['nome'])):
            f.write(f"{x['n'] if x['n'] is not None else '-'}\t{x['nome']}\t{x['quadros']}\t{x['seg']}\t{x['bytes'] / 1e6:.2f}\n")
    print(f"ok {a.saida}: {len(lista)} efeitos, {info['bytes_zip'] / 1e6:.1f} MB, sha256 {info['sha256'][:16]}…")
    print(f'lista: {base}_lista.txt / .json')


if __name__ == '__main__':
    main()
