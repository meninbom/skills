"""Prepara a revisão de quadros (ver REVISOR.md): entrada.json + metades em tamanho cheio pra o revisor olhar sem miniatura.
uso: python preparar.py --lista ESCOLHIDOS.txt --pasta <pasta dos quadros> --desc descricoes.json --saida <dir> --fichas ficha_heroi.jpg,ficha_vilao.jpg,cenario.jpg
  --lista: linhas 'nº<TAB>nome' (nome sem extensão; acha .png/.jpg na --pasta)
  --desc: {"nº": {"descricao": "...", "quem": "nico iara gen"}}  (nº como texto)
"""
import os, json, argparse
from PIL import Image



def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--lista'); ap.add_argument('--pasta'); ap.add_argument('--desc'); ap.add_argument('--saida'); ap.add_argument('--fichas')
    a = ap.parse_args()
    os.makedirs(os.path.join(a.saida, 'zoom'), exist_ok=True)
    desc = json.load(open(a.desc, encoding='utf-8')) if a.desc else {}
    quadros = []
    for ln in open(a.lista, encoding='utf-8').read().splitlines():
        if not ln.strip(): continue
        n, nome = ln.split('\t')[:2]; n = int(n)
        arq = next((os.path.join(a.pasta, nome + e) for e in ('.png', '.jpg', '.jpeg', '') if os.path.exists(os.path.join(a.pasta, nome + e))), None)
        if not arq: print('FALTA', n, nome); continue
        im = Image.open(arq).convert('RGB'); w, h = im.size; s = 1600 / h if h < 1600 else 1.0
        if s != 1.0: im = im.resize((round(w * s), round(h * s)), Image.LANCZOS); w, h = im.size
        z = {}
        for parte, caixa in (('cima', (0, 0, w, h * 55 // 100)), ('baixo', (0, h * 45 // 100, w, h))):
            p = os.path.join(a.saida, 'zoom', f'{n:02d}_{parte}.png'); im.crop(caixa).save(p); z[parte] = os.path.abspath(p).replace('\\', '/')
        d = desc.get(str(n), {})
        quadros.append(dict(n=n, nome=nome, arquivo=os.path.abspath(arq).replace('\\', '/'), zoom_cima=z['cima'], zoom_baixo=z['baixo'],
                            descricao=d.get('descricao', '(sem descrição: revisar anatomia, ficha, chão, escala e objetos)'), quem=d.get('quem', '')))
    if not a.fichas: raise SystemExit('passe --fichas com as fichas dos personagens e do cenário (o revisor compara cada quadro com elas)')
    fichas = [os.path.abspath(f).replace('\\', '/') for f in a.fichas.split(',')]
    json.dump(dict(fichas=fichas, quadros=quadros), open(os.path.join(a.saida, 'entrada.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    print(len(quadros), 'quadros ->', os.path.join(a.saida, 'entrada.json'))


if __name__ == '__main__':
    main()
