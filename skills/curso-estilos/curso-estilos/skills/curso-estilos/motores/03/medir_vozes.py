"""Mede a duração de cada fala gravada (voz/<id>.wav) e grava vozes.json; o episodio.js usa isso no lugar da estimativa.
uso: python medir_vozes.py        (grátis; só lê os arquivos)"""
import os, json, subprocess
EP = os.path.dirname(os.path.abspath(__file__)); V = os.path.join(EP, 'voz'); out = {}
for f in sorted(os.listdir(V)) if os.path.isdir(V) else []:
    if f.endswith('.wav'):
        out[f[:-4]] = {'dur': round(float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', os.path.join(V, f)])), 3)}
json.dump(out, open(os.path.join(EP, 'vozes.json'), 'w', encoding='utf-8'), indent=1); print(len(out), 'falas medidas')
