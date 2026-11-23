# plano.py (ep01 narrado): a voz manda. Define o warp (tempo novo -> tempo do filme original) esticando planos onde a fala
# não cabe, posiciona as 13 falas (1 take cada, 1,0x) e confere as regras (silêncio no impacto, rugido e apagão).
# Saídas: warp.json (âncoras [novo, fonte]), falas_pos.json. Uso: python plano.py
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
# (início, fim) do trecho no filme original, fator de esticada
SEG = [(0.0, 7.0, 1.0), (7.0, 8.2, 1.5), (8.2, 14.0, 1.0), (14.0, 15.4, 1.43), (15.4, 18.0, 1.0), (18.0, 21.0, 1.4),
       (21.0, 24.5, 1.23), (24.5, 25.6, 2.05), (25.6, 27.3, 1.0), (27.3, 29.4, 1.5), (29.4, 30.3, 1.0), (30.3, 31.4, 2.0),
       (31.4, 32.1, 1.0), (32.1, 33.0, 3.0), (33.0, 36.5, 1.0), (36.5, 38.0, 1.4)]
anc = [[0.0, 0.0]]
for a, b, k in SEG:
    anc.append([round(anc[-1][0] + (b - a) * k, 4), b])
def W(t):  # fonte -> novo
    for (n0, s0), (n1, s1) in zip(anc, anc[1:]):
        if t <= s1 + 1e-9: return n0 + (t - s0) * (n1 - n0) / (s1 - s0)
    return anc[-1][0] + t - anc[-1][1]
# fala: (id, evento-fonte depois do qual entra, atraso s, início da fala no arquivo, duração da fala)  [medido em voz/*_-16.wav]
FALAS = [("n01", 0.0, 0.15, .12, 3.45), ("n02", None, 0, .07, 2.69), ("n03", 7.0, -0.05, .11, 1.57), ("n04", 8.2, 0.55, .02, 2.58),
         ("n05", 14.0, 0.35, .07, 2.35), ("n06", 16.4, 0.15, .07, 3.39), ("n07", None, 0, .03, 3.24), ("n08", 21.0, 0.6, .10, 2.60),
         ("n09", 24.5, 0.15, .09, 1.91), ("n10", 27.3, 0.15, .12, 2.62), ("n11", 30.3, 0.1, .05, 1.82), ("n12", 32.1, 0.3, .09, 2.66),
         ("n13", 35.9, 0.2, .04, 1.58)]
GAP = 0.25
pos, fim = [], -1
for i, ev, d, s0, L in FALAS:
    ini = max(W(ev) + d if ev is not None else 0, fim + GAP)   # início da FALA (não do arquivo)
    pos.append({"id": i, "arquivo_em": round(ini - s0, 3), "fala": [round(ini, 3), round(ini + L, 3)]}); fim = ini + L
SIL = {"impacto": 8.2, "rugido": 29.4, "apagao": 31.4, "card2": 33.6, "bip": 25.6}
print("duração nova", round(W(38.0), 2))
for p in pos: print(p["id"], p["fala"])
for k, t in SIL.items():
    T = W(t); viz = [p["id"] for p in pos if p["fala"][0] - 0.2 < T < p["fala"][1] + 0.25]
    print(f"{k:8s} {t:5.2f} -> {T:6.2f}", "OK" if not viz else f"CHOCA com {viz}")
# o rugido dura ~0,9 s até a fuga: nenhuma fala em [rugido, rugido+0,8]
R = W(29.4); print("fala no rugido:", [p["id"] for p in pos if p["fala"][0] < R + 0.8 and p["fala"][1] > R - 0.2])
print("card1 ate", round(W(15.4), 2), " n05:", pos[4]["fala"], " wake", round(W(16.4), 2))
json.dump({"ancoras_novo_fonte": anc, "duracao": round(W(38.0), 3)}, open(os.path.join(HERE, "warp.json"), "w"), indent=1)
json.dump(pos, open(os.path.join(HERE, "falas_pos.json"), "w"), indent=1)
