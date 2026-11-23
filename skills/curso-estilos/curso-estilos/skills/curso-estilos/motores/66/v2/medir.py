"""Movimento médio de um clipe: diferença média entre quadros consecutivos (0-255) em 270x480.
uso: python medir.py clipes/A1.mp4 ...   (descartar < 2,0)"""
import sys, subprocess, numpy as np
for p in sys.argv[1:]:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-vf', 'scale=270:480', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True).stdout
    f = np.frombuffer(raw, np.uint8).reshape(-1, 480, 270).astype(np.float32)
    d = np.abs(np.diff(f, axis=0)).mean((1, 2))
    print(f'{p}: {len(f)} quadros, movimento {d.mean():.2f} (1ª metade {d[:len(d)//2].mean():.2f}, 2ª {d[len(d)//2:].mean():.2f})')
