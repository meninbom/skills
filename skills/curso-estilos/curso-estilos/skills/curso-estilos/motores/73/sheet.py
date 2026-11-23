import sys, pathlib
from PIL import Image, ImageDraw
HERE=pathlib.Path(__file__).resolve().parent
files=sys.argv[2:]; out=sys.argv[1]
w,h=360,640; cols=min(6,len(files)); rows=(len(files)+cols-1)//cols
S=Image.new('RGB',(cols*w+(cols-1)*6,rows*(h+24)),(30,30,30))
for i,f in enumerate(files):
    im=Image.open(f).convert('RGB').resize((w,h),Image.LANCZOS)
    x=(i%cols)*(w+6); y=(i//cols)*(h+24); S.paste(im,(x,y+24)); ImageDraw.Draw(S).text((x+4,y+4),pathlib.Path(f).stem,fill='white')
S.save(out,quality=90); print(out,S.size)
