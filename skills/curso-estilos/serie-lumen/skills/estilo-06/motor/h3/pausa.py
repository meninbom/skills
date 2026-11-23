"""Pausa da fila de animação: quem está usando o PC vem primeiro.
Sai 1 (pausado) se algum programa da lista estiver aberto (um jogo, um editor pesado); sai 0 (livre) caso contrário.
A lista vem da variável de ambiente PAUSA_PROCESSOS, separada por vírgula (ex.: PAUSA_PROCESSOS="meujogo.exe,resolve.exe").
Sem a variável, nunca pausa. Windows usa tasklist; Mac/Linux usam ps."""
import os, subprocess, sys
LISTA = [x.strip().lower() for x in os.environ.get('PAUSA_PROCESSOS', '').split(',') if x.strip()]
if LISTA:
    cmd = ['tasklist'] if os.name == 'nt' else ['ps', '-A', '-o', 'comm=']
    t = subprocess.run(cmd, capture_output=True, text=True, errors='ignore').stdout.lower()
    if any(j in t for j in LISTA):
        print('pausa: programa da lista aberto'); sys.exit(1)
print('livre'); sys.exit(0)
