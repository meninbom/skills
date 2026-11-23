# Textura da mensageira planadora (original). 2 texels por px do modelo, atlas 128x128.
from PIL import Image, ImageDraw
import json, base64
S = 2
C = dict(skin=(201,142,102), skin_sh=(176,118,84), eye=(28,24,30), eye_hi=(240,236,226), brow=(66,42,30), cheek=(214,128,104),
  hood=(38,98,112), hood_sh=(27,74,86), jacket=(47,120,134), jacket_sh=(33,92,104), zip=(214,200,170),
  pants=(58,52,48), pants_sh=(44,40,37), boot=(96,60,36), boot_sh=(70,44,27), lace=(222,206,170), sole=(40,34,30),
  glove=(110,72,44), pack=(122,115,72), pack_sh=(96,90,55), strap=(84,58,38), buckle=(199,154,74),
  canvas=(232,218,188), canvas_sh=(206,190,158), stripe=(196,84,48), wood=(138,90,52), scarf=(236,226,204), scarf_sh=(212,198,172),
  hair=(52,34,26), lens=(24,52,62), lens_hi=(150,210,214), brass=(199,154,74), kraft=(176,132,86), twine=(232,214,170))
tiles = {}
W = 128; im = Image.new('RGB', (W, W), (255, 0, 255)); d = ImageDraw.Draw(im)
cur = [0, 0, 0]  # x, y, alturaLinha
def tile(name, w, h):
    w2, h2 = int(w * S), int(h * S)
    if cur[0] + w2 > W: cur[0] = 0; cur[1] += cur[2]; cur[2] = 0
    x, y = cur[0], cur[1]; cur[0] += w2; cur[2] = max(cur[2], h2)
    tiles[name] = [x, y, x + w2, y + h2]; return x, y
def R(x, y, x0, y0, x1, y1, c): d.rectangle([x + x0, y + y0, x + x1 - 1, y + y1 - 1], fill=C[c])
def flat(name, c, w=4, h=4):
    x, y = tile(name, w, h); R(x, y, 0, 0, int(w*S), int(h*S), c)
# rosto 8x8 -> 16x16 texels
x, y = tile('head_front', 8, 8); R(x,y,0,0,16,16,'skin'); R(x,y,0,0,16,2,'skin_sh')
R(x,y,3,7,5,10,'eye'); R(x,y,11,7,13,10,'eye'); R(x,y,4,7,5,8,'eye_hi'); R(x,y,12,7,13,8,'eye_hi')
R(x,y,2,5,6,6,'brow'); R(x,y,10,5,14,6,'brow'); R(x,y,1,11,4,12,'cheek'); R(x,y,12,11,15,12,'cheek'); R(x,y,7,12,9,13,'skin_sh')
x, y = tile('torso_front', 8, 12); R(x,y,0,0,16,24,'jacket'); R(x,y,7,2,9,20,'zip'); R(x,y,2,0,4,24,'strap'); R(x,y,12,0,14,24,'strap')
R(x,y,2,9,4,11,'buckle'); R(x,y,12,9,14,11,'buckle'); R(x,y,0,20,16,22,'strap'); R(x,y,7,20,9,22,'buckle'); R(x,y,0,22,16,24,'jacket_sh'); R(x,y,5,0,11,2,'jacket_sh')
x, y = tile('torso_back', 8, 12); R(x,y,0,0,16,24,'jacket'); R(x,y,0,20,16,22,'strap'); R(x,y,0,22,16,24,'jacket_sh')
x, y = tile('torso_side', 4, 12); R(x,y,0,0,8,24,'jacket'); R(x,y,0,20,8,22,'strap'); R(x,y,0,22,8,24,'jacket_sh'); R(x,y,0,0,2,24,'jacket_sh')
x, y = tile('arm', 4, 12); R(x,y,0,0,8,24,'jacket'); R(x,y,0,17,8,18,'jacket_sh'); R(x,y,0,18,8,24,'glove'); R(x,y,0,0,8,2,'jacket_sh')
flat('arm_top', 'jacket'); flat('glove', 'glove')
x, y = tile('leg_front', 4, 12); R(x,y,0,0,8,24,'pants'); R(x,y,0,8,8,9,'pants_sh'); R(x,y,0,16,8,24,'boot'); R(x,y,2,17,6,18,'lace'); R(x,y,2,19,6,20,'lace'); R(x,y,0,22,8,24,'sole')
x, y = tile('leg_side', 4, 12); R(x,y,0,0,8,24,'pants'); R(x,y,0,16,8,24,'boot'); R(x,y,0,16,8,17,'boot_sh'); R(x,y,0,22,8,24,'sole')
flat('pants', 'pants'); flat('sole', 'sole')
x, y = tile('pack_back', 7, 10); R(x,y,0,0,14,20,'pack'); R(x,y,1,1,13,2,'pack_sh'); R(x,y,1,18,13,19,'pack_sh'); R(x,y,3,4,5,16,'strap'); R(x,y,9,4,11,16,'strap'); R(x,y,3,12,5,14,'buckle'); R(x,y,9,12,11,14,'buckle')
x, y = tile('pack_side', 4, 10); R(x,y,0,0,8,20,'pack'); R(x,y,0,0,8,1,'pack_sh'); R(x,y,2,6,6,14,'pack_sh')
flat('pack', 'pack'); flat('flap', 'pack_sh')
x, y = tile('wing_top', 10, 5); R(x,y,0,0,20,10,'canvas'); R(x,y,0,3,20,5,'stripe'); R(x,y,0,0,20,1,'wood'); R(x,y,0,9,20,10,'wood'); R(x,y,19,0,20,10,'wood')
for i in range(1, 20, 3): R(x,y,i,6,i+1,7,'canvas_sh')
x, y = tile('wing_bot', 10, 5); R(x,y,0,0,20,10,'canvas_sh'); R(x,y,0,3,20,5,'stripe'); R(x,y,4,0,5,10,'wood'); R(x,y,13,0,14,10,'wood')
flat('wood', 'wood')
x, y = tile('scarf', 4, 4); R(x,y,0,0,8,8,'scarf'); R(x,y,0,6,8,8,'scarf_sh')
x, y = tile('scarf_tail', 2, 6); R(x,y,0,0,4,12,'scarf'); R(x,y,0,4,4,5,'stripe'); R(x,y,0,10,4,12,'scarf_sh')
flat('hood', 'hood'); flat('hood_sh', 'hood_sh'); flat('hair', 'hair'); flat('brass', 'brass')
x, y = tile('lens', 3, 2); R(x,y,0,0,6,4,'lens'); R(x,y,1,0,3,1,'lens_hi')
x, y = tile('parcel', 5, 5); R(x,y,0,0,10,10,'kraft'); R(x,y,4,0,6,10,'twine'); R(x,y,0,4,10,6,'twine')
flat('skin', 'skin')
im.save('mensageira_tex.png')
q = im.quantize(colors=64, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE); q.save('mensageira_tex_p.png', optimize=True)
json.dump(tiles, open('tiles.json', 'w'))
b = base64.b64encode(open('mensageira_tex_p.png', 'rb').read()).decode(); open('tex_b64.txt', 'w').write(b)
print(len(b), cur)
