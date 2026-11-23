"""Blender headless: modelo gerado (GLB do Pixal3D) + juntas medidas -> malha com pele (GLB com JOINTS_0/WEIGHTS_0) para o gente4.js.
uso: blender -b -P rig_blender.py -- x_juntas.json [--metodo auto|proxy]
O esqueleto tem os 22 nomes do SMPL (Pelvis, Spine1-3, Neck, Head, L/R_Hip, Knee, Ankle, Foot, Collar, Shoulder, Elbow, Wrist): o movimento do HY-Motion e da 100STYLE entra sem mapa.
x_juntas.json: { arq, ry (graus, giro para ficar de frente), alt (altura final), juntas: { nome: [x, y, z] } } em eixos do three.js (y para cima, frente +z, +x = esquerda dele);
só o lado L e o centro: o lado R é espelhado. Grava <arq>_rig.glb e <arq>_rig.json (juntas dos dois lados + hierarquia).
"""
import bpy, sys, json, os, math
from mathutils import Vector, Matrix
a = sys.argv[sys.argv.index('--') + 1:]; cfg = json.load(open(a[0], encoding='utf-8')); metodo = a[a.index('--metodo') + 1] if '--metodo' in a else 'auto'
base = os.path.dirname(os.path.dirname(os.path.abspath(a[0]))); arq = os.path.join(base, cfg['arq'])
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=arq + '.glb')
ms = [o for o in bpy.data.objects if o.type == 'MESH']; bpy.ops.object.select_all(action='DESELECT')
for o in ms: o.select_set(True)
bpy.context.view_layer.objects.active = ms[0]
if len(ms) > 1: bpy.ops.object.join()
ob = bpy.context.view_layer.objects.active; ob.name = 'Corpo'
mw = ob.matrix_world.copy(); ob.parent = None; ob.matrix_world = mw; bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
me = ob.data; me.transform(Matrix.Rotation(math.radians(cfg['ry']), 4, 'Z'))  # giro em torno do eixo de cima (three Y = Blender Z)
xs = [v.co for v in me.vertices]; mn = Vector((min(v.x for v in xs), min(v.y for v in xs), min(v.z for v in xs))); mx = Vector((max(v.x for v in xs), max(v.y for v in xs), max(v.z for v in xs)))
s = cfg['alt'] / (mx.z - mn.z); me.transform(Matrix.Scale(s, 4) @ Matrix.Translation((-(mn.x + mx.x) / 2, -(mn.y + mx.y) / 2, -mn.z))); me.update()
for m in list(me.materials): pass
print('malha', len(me.vertices), 'vertices')
# juntas: three (x, y, z) -> Blender (x, -z, y)
J = {}
for n, p in cfg['juntas'].items():
    J[n] = p
    if n.startswith('L_'): J['R_' + n[2:]] = [-p[0], p[1], p[2]]
B = lambda p: Vector((p[0], -p[2], p[1]))
PAI = {'Pelvis': None, 'Spine1': 'Pelvis', 'Spine2': 'Spine1', 'Spine3': 'Spine2', 'Neck': 'Spine3', 'Head': 'Neck'}
FIM = {'Pelvis': 'Spine1', 'Spine1': 'Spine2', 'Spine2': 'Spine3', 'Spine3': 'Neck', 'Neck': 'Head', 'Head': 'Head_fim'}
for L in 'LR':
    PAI.update({f'{L}_Hip': 'Pelvis', f'{L}_Knee': f'{L}_Hip', f'{L}_Ankle': f'{L}_Knee', f'{L}_Foot': f'{L}_Ankle', f'{L}_Collar': 'Spine3', f'{L}_Shoulder': f'{L}_Collar', f'{L}_Elbow': f'{L}_Shoulder', f'{L}_Wrist': f'{L}_Elbow'})
    FIM.update({f'{L}_Hip': f'{L}_Knee', f'{L}_Knee': f'{L}_Ankle', f'{L}_Ankle': f'{L}_Foot', f'{L}_Foot': f'{L}_Foot_fim', f'{L}_Collar': f'{L}_Shoulder', f'{L}_Shoulder': f'{L}_Elbow', f'{L}_Elbow': f'{L}_Wrist', f'{L}_Wrist': f'{L}_Wrist_fim'})
ad = bpy.data.armatures.new('Esq'); ar = bpy.data.objects.new('Esq', ad); bpy.context.scene.collection.objects.link(ar); bpy.context.view_layer.objects.active = ar; bpy.ops.object.mode_set(mode='EDIT')
for n in PAI:
    b = ad.edit_bones.new(n); b.head = B(J[n]); b.tail = B(J[FIM[n]])
for n, p in PAI.items():
    if p: ad.edit_bones[n].parent = ad.edit_bones[p]
bpy.ops.object.mode_set(mode='OBJECT')
# pele: pesos automáticos do próprio Blender (calor). Em malha gerada por IA o calor pode falhar (malha aberta ou com ilhas soltas);
# aí cai no peso por envelope dos ossos. Se você tiver um binder por voxel melhor, troque este trecho.
esq = bpy.data.objects['Esq']; corpo = bpy.data.objects['Corpo']
bpy.ops.object.select_all(action='DESELECT'); corpo.select_set(True); esq.select_set(True); bpy.context.view_layer.objects.active = esq
rep = {'metodo': 'calor'}
try:
    if metodo == 'proxy': raise RuntimeError('pedido')
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    if not any(len(v.groups) for v in corpo.data.vertices): raise RuntimeError('sem pesos')
except Exception:
    bpy.ops.object.parent_set(type='ARMATURE_ENVELOPE'); rep = {'metodo': 'envelope'}
bpy.context.view_layer.objects.active = corpo; bpy.ops.object.vertex_group_limit_total(limit=4); bpy.ops.object.vertex_group_normalize_all(lock_active=False)
print('pele', json.dumps(rep))
me.materials.clear()
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=arq + '_rig.glb', export_format='GLB', export_skins=True, export_animations=False, export_materials='NONE', export_normals=True, export_texcoords=True, export_yup=True, export_apply=False, export_all_influences=False)
json.dump({'juntas': J, 'pai': PAI, 'fim': FIM, 'alt': cfg['alt'], 'pele': rep}, open(arq + '_rig.json', 'w')); print('ok', arq + '_rig.glb', os.path.getsize(arq + '_rig.glb') // 1000000, 'MB')
