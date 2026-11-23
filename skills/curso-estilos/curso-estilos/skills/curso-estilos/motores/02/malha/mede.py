"""Mede uma malha GLB em fatias (para achar as juntas do rig). uso: python mede.py x.glb altura [giro_graus|auto]"""
import json,struct,sys,numpy as np
from scipy.spatial import cKDTree
b=open(sys.argv[1],'rb').read(); jl=struct.unpack_from('<I',b,12)[0]; j=json.loads(b[20:20+jl]); bn=b[20+jl+8:]
ac=j['accessors'][j['meshes'][0]['primitives'][0]['attributes']['POSITION']]; bv=j['bufferViews'][ac['bufferView']]
V=np.frombuffer(bn,np.float32,ac['count']*3,bv.get('byteOffset',0)).reshape(-1,3).astype(float); H=float(sys.argv[2]); g=sys.argv[3] if len(sys.argv)>3 else '0'
def rot(P,d): a=np.radians(d); c,s=np.cos(a),np.sin(a); return np.stack([P[:,0]*c+P[:,2]*s,P[:,1],-P[:,0]*s+P[:,2]*c],1)
if g=='auto':
    P=V[np.random.default_rng(0).choice(len(V),15000,replace=False)]; best=[]
    for d in np.arange(-45,45.1,1.5):
        Q=rot(P,d); Q[:,0]-=np.median(Q[:,0]); best.append((cKDTree(Q).query(Q*[-1,1,1])[0].mean(),d))
    g=sorted(best)[0][1]; print('giro',g)
V=rot(V,float(g)); mn,mx=V.min(0),V.max(0); V=(V-[(mn[0]+mx[0])/2,mn[1],(mn[2]+mx[2])/2])*H/(mx[1]-mn[1])
for y in np.arange(0.04,H,H/36):
    s=V[np.abs(V[:,1]-y)<H*0.006]; xs=np.sort(s[:,0]); gaps=np.where(np.diff(xs)>H*0.011)[0]; segs=[]; st=0
    for k in list(gaps)+[len(xs)-1]:
        seg=s[(s[:,0]>=xs[st])&(s[:,0]<=xs[k])]; segs.append('x[%.2f %.2f] z[%.2f %.2f]'%(xs[st],xs[k],seg[:,2].min(),seg[:,2].max())); st=k+1
    print('y=%.2f'%y,' | '.join(segs))
