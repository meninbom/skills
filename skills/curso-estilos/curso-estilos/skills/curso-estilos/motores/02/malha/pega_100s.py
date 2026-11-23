r"""Tira um trecho de um estilo da 100STYLE e converte para mov2/<estilo>_<tipo>_100s.json.
uso: python pega_100s.py Estilo TIPO [segundos=8] [deslocamento_s=10]   TIPO: FW andar, FR correr, ID parado, BW/BR de costas, SW/SR de lado, TR1 transições
A pasta do conjunto 100STYLE (baixe em https://www.ianxmason.com/100style/, CC BY 4.0) vem da variável de ambiente STYLE100_DIR.
Lista dos estilos: Dataset_List.csv dentro dela."""
import sys, csv, subprocess, os
R = os.environ.get('STYLE100_DIR') or sys.exit('Defina STYLE100_DIR com a pasta do 100STYLE (a que tem Frame_Cuts.csv).'); est, tipo = sys.argv[1], sys.argv[2]; seg = float(sys.argv[3]) if len(sys.argv) > 3 else 8; desl = float(sys.argv[4]) if len(sys.argv) > 4 else 10
row = next(r for r in csv.DictReader(open(os.path.join(R, 'Frame_Cuts.csv'))) if r['STYLE_NAME'] == est); a, b = int(row[tipo + '_START']), int(row[tipo + '_STOP'])
ini = min(a + int(desl * 60), max(a, b - int(seg * 60))); fim = min(b, ini + int(seg * 60)); aqui = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(os.path.dirname(aqui), 'mov2', f'{est.lower()}_{tipo.lower()}_100s.json')
print(subprocess.run([sys.executable, os.path.join(aqui, 'bvh2mov.py'), os.path.join(R, est, f'{est}_{tipo}.bvh'), out, str(ini), str(fim), '--reto'], capture_output=True, text=True).stdout.strip())
