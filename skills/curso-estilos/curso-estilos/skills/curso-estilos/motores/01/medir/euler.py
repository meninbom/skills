# Converte cam_ref.json (do rastrear_cam.py) em yaw/pitch/roll por quadro (euler_ref.npy) e imprime uma amostra.
# uso: python euler.py   (pip install scipy numpy)
import json, numpy as np
from scipy.spatial.transform import Rotation as Rot
d = json.load(open("cam_ref.json"))
Rs = np.array([x["R"] for x in d]); ins = np.array([x["inl"] for x in d])
e = Rot.from_matrix(Rs).as_euler("YXZ", degrees=True)
e[:, 0] = np.degrees(np.unwrap(np.radians(e[:, 0])))
np.save("euler_ref.npy", e)
for t in np.arange(0, len(e) / 30, 1.0):
    i = min(len(e)-1, int(t*30)); print(f"{t:5.2f} yaw {e[i,0]:8.1f} pitch {e[i,1]:6.1f} roll {e[i,2]:6.1f} inl {ins[i]}")
print("quadros sem rastreio:", (ins[1:]==0).sum())
