"""Blender headless: FBX de movimento (esqueleto SMPL-H, ex. HY-Motion) -> JSON por quadro para o gente3.js.
uso: blender -b -P fbx2mov.py -- entrada.fbx saida.json
Grava, em eixos do three.js (y para cima, frente +z), a posição da cabeça de cada osso e a rotação em mundo relativa ao repouso.
"""
import bpy, sys, json
from mathutils import Matrix
src, dst = sys.argv[sys.argv.index('--') + 1:][:2]
bpy.ops.wm.read_factory_settings(use_empty=True)
try: bpy.ops.wm.fbx_import(filepath=src)
except Exception as e:
    print('fbx_import falhou, tentando import_scene.fbx:', e); bpy.ops.import_scene.fbx(filepath=src)
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE'); sc = bpy.context.scene
act = arm.animation_data.action if arm.animation_data else None
f0, f1 = (int(act.frame_range[0]), int(act.frame_range[1])) if act else (sc.frame_start, sc.frame_end)
nomes = [b.name for b in arm.pose.bones]; print('ossos', len(nomes), nomes); print('quadros', f0, f1, 'fps', sc.render.fps, 'escala', tuple(arm.scale))
C = lambda v: [round(v.x, 5), round(v.z, 5), round(-v.y, 5)]          # Blender (z cima) -> three (y cima)
Q = lambda q: [round(q.x, 5), round(q.z, 5), round(-q.y, 5), round(q.w, 5)]
W = arm.matrix_world
rest = {b.name: (W @ b.bone.matrix_local) for b in arm.pose.bones}
out = {'fps': sc.render.fps, 'ossos': nomes, 'pai': [b.parent.name if b.parent else None for b in arm.pose.bones],
       'repouso': {n: C(m.to_translation()) for n, m in rest.items()}, 'repousoPonta': {b.name: C(W @ b.bone.tail_local) for b in arm.pose.bones}, 'quadros': []}
for f in range(f0, f1 + 1):
    sc.frame_set(f); dg = bpy.context.evaluated_depsgraph_get(); ae = arm.evaluated_get(dg); q = {}
    for b in ae.pose.bones:
        m = ae.matrix_world @ b.matrix; d = (m.to_3x3() @ rest[b.name].to_3x3().inverted()).to_quaternion()
        q[b.name] = C(m.to_translation()) + Q(d)
    out['quadros'].append(q)
json.dump(out, open(dst, 'w')); print('ok', dst, len(out['quadros']), 'quadros')
