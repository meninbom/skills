# Folha lado a lado: linha de cima = vídeo de referência, linha de baixo = o seu (mesmos tempos).
# uso: python lado.py 0.5,2.5,6 REFERENCIA.mp4 SEU.mp4 folha.jpg [largura_do_quadro]
import sys, subprocess, io
from PIL import Image
ts=[float(x) for x in sys.argv[1].split(',')]; REF=sys.argv[2]; nossa=sys.argv[3]; out=sys.argv[4]; tw=int(sys.argv[5]) if len(sys.argv)>5 else 270
def fr(src,t):
    b=subprocess.run(['ffmpeg','-v','error','-ss',str(t),'-i',src,'-frames:v','1','-f','image2pipe','-c:v','png','-'],capture_output=True).stdout
    return Image.open(io.BytesIO(b)).convert('RGB').resize((tw,tw*16//9),Image.LANCZOS)
th=tw*16//9; sh=Image.new('RGB',(tw*len(ts),th*2),'black')
for i,t in enumerate(ts):
    sh.paste(fr(REF,t),(i*tw,0)); sh.paste(fr(nossa,t),(i*tw,th))
sh.save(out,quality=90); print('ok',out)
