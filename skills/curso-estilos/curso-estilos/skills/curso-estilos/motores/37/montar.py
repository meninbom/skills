# montar.py: raw.mp4 + agenda de cartelas PNG -> <nome>_mudo.mp4 (1080, sem áudio, mestre), _1080.mp4 e _celular.mp4 (720x1280)
# uso: python montar.py ep01   (a agenda fica na tabela S abaixo: (png, entra_s, sai_s[, começo do fade de saída]))
# antes: node ep01/cards.mjs (gera ep01/cards/*.png) e o render do raw.mp4
import subprocess, sys, os
EP = sys.argv[1]; D = 38.0
S = {
 'ep01': ('01_patinete', [('c1_1', 11.75, 12.15), ('c1_2', 12.15, 12.55), ('c1_3', 12.55, 12.95), ('c1_4', 12.95, 13.45), ('c1_5', 13.45, 14.0), ('c1_6', 14.0, 15.35, 14.95),
          ('c2_1', 33.6, 34.3), ('c2_2', 34.3, 35.0), ('c2_3', 35.0, 38.1)]),
}
name, cards = S[EP]
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), EP))
ins = ['-i', 'raw.mp4']; fl = ''; prev = '[0:v]'
for k, c in enumerate(cards, 1):
    ins += ['-loop', '1', '-t', str(D), '-i', f'cards/{c[0]}.png']
    fade = f',fade=t=out:st={c[3]}:d={c[2] - c[3]}:alpha=1' if len(c) > 3 else ''
    fl += f'[{k}:v]format=rgba{fade}[c{k}];{prev}[c{k}]overlay=0:0:enable=\'between(t,{c[1]},{c[2]})\'[o{k}];'; prev = f'[o{k}]'
fl += f'{prev}format=yuv420p[v]'
mudo = f'{name}_mudo.mp4'
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *ins, '-filter_complex', fl, '-map', '[v]', '-t', str(D), '-r', '30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
                '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', mudo], check=True)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', mudo, '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', f'{name}_1080.mp4'], check=True)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', mudo, '-vf', 'scale=-2:1280:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', f'{name}_celular.mp4'], check=True)
print('ok', name)
