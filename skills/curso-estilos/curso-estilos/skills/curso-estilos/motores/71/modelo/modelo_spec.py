# Gera o JS que monta a mensageira no Blockbench (risky_eval). Frente = +z (south).
import json
T = json.load(open('tiles.json')); B64 = open('tex_b64.txt').read()
bones = [  # nome, pai, pivô, rotação
 ['raiz', None, [0,0,0], [0,0,0]], ['quadril','raiz',[0,12,0],[0,0,0]], ['cabeca','quadril',[0,24,0],[0,0,0]],
 ['oculos','cabeca',[0,30,-1],[0,0,0]], ['cachecol_1','quadril',[-2,23,2.4],[0,0,0]], ['cachecol_2','cachecol_1',[-2,17.5,2.55],[0,0,0]],
 ['braco_e','quadril',[6,22.5,0],[0,0,0]], ['braco_d','quadril',[-6,22.5,0],[0,0,0]], ['mochila','quadril',[0,18,-2],[0,0,0]],
 ['pacote','mochila',[0,13,-4],[0,0,0]], ['asa_e1','mochila',[3.5,22,-4],[0,0,-90]], ['asa_e2','asa_e1',[13.5,23.2,-4],[0,0,180]],
 ['asa_d1','mochila',[-3.5,22,-4],[0,0,90]], ['asa_d2','asa_d1',[-13.5,23.2,-4],[0,0,-180]],
 ['perna_e','raiz',[2,12,0],[0,0,0]], ['perna_d','raiz',[-2,12,0],[0,0,0]]]
W = dict(u='wing_top', d='wing_bot', o='wood')
cubes = [  # osso, nome, de, até, faces {s,n,e,w,u,d,o=resto}
 ['quadril','tronco',[-4,12,-2],[4,24,2],dict(s='torso_front',n='torso_back',e='torso_side',w='torso_side',u='arm_top',d='pants')],
 ['quadril','cachecol',[-4.3,22.6,-2.4],[4.3,24.4,2.4],dict(o='scarf')],
 ['cachecol_1','cachecol_ponta1',[-3,17.5,2.2],[-1,23,2.9],dict(o='scarf_tail')],
 ['cachecol_2','cachecol_ponta2',[-3,13.5,2.25],[-1,17.5,2.85],dict(o='scarf_tail')],
 ['cabeca','cabeca_cubo',[-4,24,-4],[4,32,4],dict(s='head_front',o='skin')],
 ['cabeca','franja',[-3.8,30.6,4],[3.8,31.4,4.35],dict(o='hair')],
 ['cabeca','capuz_topo',[-4.7,32,-4.7],[4.7,33,4.5],dict(o='hood')],
 ['cabeca','capuz_tras',[-4.7,24.3,-4.7],[4.7,32,-4],dict(o='hood')],
 ['cabeca','capuz_e',[4,24.3,-4.7],[4.7,32,4.5],dict(o='hood')],
 ['cabeca','capuz_d',[-4.7,24.3,-4.7],[-4,32,4.5],dict(o='hood')],
 ['cabeca','capuz_ponta',[-1.2,32.4,-6],[1.2,33.4,-4.2],dict(o='hood_sh')],
 ['oculos','lente_e',[0.5,31.4,4.35],[3.4,33,5],dict(s='lens',o='brass')],
 ['oculos','lente_d',[-3.4,31.4,4.35],[-0.5,33,5],dict(s='lens',o='brass')],
 ['oculos','ponte',[-0.5,31.9,4.4],[0.5,32.4,4.8],dict(o='brass')],
 ['oculos','tira_e',[4.7,31.9,-4],[4.95,32.5,4.4],dict(o='wood')],
 ['oculos','tira_d',[-4.95,31.9,-4],[-4.7,32.5,4.4],dict(o='wood')],
 ['braco_e','braco_e_cubo',[4,12,-2],[8,24,2],dict(o='arm',u='arm_top',d='glove')],
 ['braco_d','braco_d_cubo',[-8,12,-2],[-4,24,2],dict(o='arm',u='arm_top',d='glove')],
 ['mochila','mochila_cubo',[-3.5,13,-6],[3.5,23,-2],dict(n='pack_back',e='pack_side',w='pack_side',o='pack')],
 ['mochila','mochila_aba',[-3.6,20,-6.3],[3.6,23.3,-2.2],dict(o='flap')],
 ['pacote','pacote_cubo',[-2.5,10.4,-5.5],[2.5,12.9,-2.5],dict(o='parcel')],
 ['asa_e1','asa_e1_placa',[3.5,22,-6.5],[13.5,22.8,-1.5],W], ['asa_e2','asa_e2_placa',[13.5,22.8,-6.5],[23.5,23.6,-1.5],W],
 ['asa_d1','asa_d1_placa',[-13.5,22,-6.5],[-3.5,22.8,-1.5],W], ['asa_d2','asa_d2_placa',[-23.5,22.8,-6.5],[-13.5,23.6,-1.5],W],
 ['perna_e','perna_e_cubo',[0,0,-2],[4,12,2],dict(s='leg_front',o='leg_side',u='pants',d='sole')],
 ['perna_d','perna_d_cubo',[-4,0,-2],[0,12,2],dict(s='leg_front',o='leg_side',u='pants',d='sole')]]
FN = dict(s='south', n='north', e='east', w='west', u='up', d='down')
cj = []
for b, n, f, t, fc in cubes:
    faces = {FN[k]: T[fc.get(k, fc.get('o'))] for k in FN}
    cj.append([b, n, f, t, faces])
js = f"""(()=>{{
const tex=new Texture({{name:'mensageira_tex'}}).fromDataURL('data:image/png;base64,{B64}');tex.add(false);
tex.uv_width=128;tex.uv_height=128;
const BONES={json.dumps(bones)};const CUBES={json.dumps(cj)};
Undo.initEdit({{outliner:true,elements:[],textures:[tex]}});
const G={{}};
for(const [n,p,o,r] of BONES){{const g=new Group({{name:n,origin:o,rotation:r}}).init();if(p)g.addTo(G[p]);G[n]=g;}}
const els=[];
for(const [b,n,f,t,fc] of CUBES){{const faces={{}};for(const k in fc)faces[k]={{uv:fc[k],texture:tex.uuid}};
 const c=new Cube({{name:n,from:f,to:t,origin:G[b].origin.slice(),faces}}).init();c.addTo(G[b]);els.push(c);}}
Undo.finishEdit('mensageira',{{outliner:true,elements:els,textures:[tex]}});
Canvas.updateAll();return {{groups:Object.keys(G).length,cubes:els.length,tex:tex.width+'x'+tex.height}};}})()"""
open('build_model.js','w').write(js); print(len(js))
