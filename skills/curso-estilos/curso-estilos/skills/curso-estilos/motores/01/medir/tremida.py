# Tira de euler_ref.npy só a tremida de mão (alta frequência) e grava ../tremida_ref.json, que o camera.js lê.
# uso: python tremida.py   (depois de rastrear_cam.py e euler.py)
import json, numpy as np
from scipy.ndimage import gaussian_filter1d
e = np.load("euler_ref.npy"); ins = np.array([x["inl"] for x in json.load(open("cam_ref.json"))])
d = np.diff(e, axis=0, prepend=e[:1])
ruim = (ins < 30) | (np.abs(d).max(1) > 4)   # perdeu rastreio ou virada rápida
ruim = np.convolve(ruim.astype(float), np.ones(9), "same") > 0
d[ruim] = 0
# reconstrói só a parte "mão": integra as diferenças válidas e tira a baixa frequência
s = np.cumsum(d, 0); hp = s - gaussian_filter1d(s, 9, axis=0)   # sigma 0,3 s
hp = np.clip(hp, -3, 3)
print("desvio (yaw,pitch,roll) graus:", hp.std(0).round(2), "max", np.abs(hp).max(0).round(2), "quadros ruins", ruim.sum())
json.dump({"fps": 30, "yaw": hp[:, 0].round(3).tolist(), "pitch": hp[:, 1].round(3).tolist(), "roll": hp[:, 2].round(3).tolist()}, open("../tremida_ref.json", "w"))
