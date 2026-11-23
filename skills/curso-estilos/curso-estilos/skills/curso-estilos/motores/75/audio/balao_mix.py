# Som do curta "Os primeiros passageiros" com as bibliotecas do motor de origem (dsp / instruments / sfx_gen, ao lado):
# minueto curto (pluck tipo cravo + pad + fife) por seções da história, efeitos sintetizados por evento, voz só com ganho.
# uso: python audio/balao_mix.py  -> audio/mix.wav Música abaixada (-3 dB) enquanto a voz fala (words.json). Master em -14 LUFS, teto -1 dBTP.
import os, sys, json
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from dsp import SR, ns, tt, rng, dbg, lp, hp, bp, pan, st, place, fades, integrated, true_peak, read_wav, write_wav, colored, smooth_noise, make_ir, convolve_st
import instruments as I
import sfx_gen as G

ROOT = os.path.dirname(HERE)
DUR = 27.5
N = ns(DUR)
words = json.load(open(os.path.join(HERE, "voice", "words.json"), encoding="utf-8"))

# ---------------- voice
# sem voice.wav (o pacote do curso não traz a voz de teste) a faixa sai só com música e efeitos, já abaixados onde a fala entraria
VOZ = os.path.join(HERE, "voice", "voice.wav")
v = np.zeros(N)
if os.path.exists(VOZ):
    x, sr = read_wav(VOZ); assert sr == SR, "a voz precisa estar em 48 kHz (o extras/voz_prep.py já grava assim)"
    vv = x.mean(0) if x.ndim > 1 else x; v[:min(N, len(vv))] = vv[:N]
else:
    print("sem audio/voice/voice.wav: saindo só música + efeitos")
V = st(v)

# ---------------- music: D major minuet, 3/4 at 120 bpm (bar = 1.5 s)
BEAT = 0.5
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
M = np.zeros((2, N)); r = rng(7)
CH = {"D": [50, 57, 62, 66], "A": [45, 52, 57, 61], "G": [43, 50, 55, 59], "Bm": [47, 54, 59, 62], "E": [52, 59, 64, 68]}
prog = ["D", "A", "Bm", "G", "D", "A", "D", "D"]
mel = [74, 76, 78, 76, 74, 73, 71, 73, 74, 69, 71, 73, 74, 76, 78, 81, 79, 78, 76, 74, 73, 74, 69, 74]
def bar_chord(t0, c, vel, pad_v=0.0):
    root, *up = CH[c]
    place(M, pan(I.pluck(hz(root), vel, r, 1.1), -0.3), t0)
    for k in (1, 2):
        place(M, pan(sum(I.pluck(hz(n), vel * 0.55, r, 0.6) for n in up), 0.25), t0 + k * BEAT)
    if pad_v: place(M, I.pad([hz(n) for n in up], 1.5, pad_v, r, att=0.3, rel=0.5), t0)
sections = [(0.0, 4.9, 0.55, 0.12, "fife"), (4.9, 11.4, 0.5, 0.0, "pluck"), (11.4, 15.8, 0.45, 0.18, "tense"),
            (15.8, 18.7, 0.7, 0.25, "fife"), (18.7, 22.2, 0.35, 0.1, "soft"), (22.2, 27.5, 0.45, 0.0, "pizz")]
for a, b, vel, padv, kind in sections:
    t = a; i = int(a / 1.5)
    while t < b - 0.05:
        c = prog[i % len(prog)] if kind != "tense" else ["Bm", "E", "Bm", "A"][i % 4]
        bar_chord(t, c, vel, padv)
        if kind in ("fife", "pluck", "pizz", "soft"):
            for k in range(3):
                n = mel[(i * 3 + k) % len(mel)] + (12 if kind == "fife" else 0) - (12 if kind == "soft" else 0)
                tn = t + k * BEAT
                if tn >= b: break
                if kind == "fife": place(M, pan(I.fife(hz(n), BEAT * 0.9, 0.5, r), 0.1), tn)
                else: place(M, pan(I.pluck(hz(n), vel * (0.8 if kind != "pizz" else 0.6), r, 0.7, bright=0.7), 0.15), tn)
        t += 1.5; i += 1
# fire build: timpani roll + snare roll into the lift-off
for tt_, vv_ in I.snare_roll(13.4, 15.85, 0.15, 0.8, r): place(M, I.snare(vv_ * 0.6, r), tt_)
for k, tk in enumerate(np.arange(11.4, 15.8, 0.25)): place(M, I.timpani(hz(38), 0.25 + 0.04 * k, r, 1.0), tk, 0.6)
place(M, I.cymbal(0.7, r, 2.4), 15.86); place(M, I.brass(hz(62), 1.2, 0.7, r, "horn"), 15.86); place(M, I.brass(hz(66), 1.2, 0.6, r, "horn"), 15.86)
# stinger on "pisou": low pizz drop + glock
place(M, I.pluck(hz(38), 0.9, r, 1.0), 26.16); place(M, I.glock(hz(86), 0.5, r), 26.5)
ir = make_ir(1.1, 3, hf=0.6)
M = 0.8 * M + 0.25 * convolve_st(M, ir)[:, :N]

# ---------------- sfx
S = np.zeros((2, N)); r = rng(11)
def crackle(dur, r):
    n = ns(dur); y = 0.25 * lp(colored(n, r, 1.0), 300) * (0.7 + 0.3 * smooth_noise(n, r, 3))
    tm = 0.0
    while tm < dur - 0.05:
        L = ns(0.02); k = ns(tm); c = bp(r.standard_normal(L), 1500, 7000) * np.exp(-np.arange(L) / SR / 0.003)
        y[k:k + L] += c * r.uniform(0.3, 1.0); tm += r.exponential(0.07)
    return y
place(S, G.breeze(4.9, r, 0.6, bright=700), 0.0)                    # wind at 40 m
place(S, G.flag_flutter(4.9, r) * 0.4, 0.0)
place(S, G.whoosh(0.9, r, peak=0.45), 4.45)                          # into the flash
mur = np.zeros((2, ns(6.5)))
for k in range(10): place(mur, pan(G.babble(6.5, r, r.uniform(100, 220), r.uniform(0.95, 1.15)), r.uniform(-0.8, 0.8)), 0.0, 0.25)
place(S, mur, 4.9); place(S, G.bird_chirps(6.5, r, 0.6), 4.9, 0.6)
place(S, G.whoosh(0.5, r, peak=0.15, f_lo=500, f_hi=2600), 10.25, 0.5)   # tilt up "lá em cima"
place(S, crackle(4.6, r), 11.4)                                      # fire
place(S, G.whoosh(1.7, r, peak=1.2, f_lo=120, f_hi=700, width=1.0, tail=0.4), 14.1)  # hot air fills the cloth
place(S, G.creak(1.4, r, 90, 140) * 0.5, 15.9)                       # ropes take the weight
for k in range(14): place(S, pan(G.hurrah(r, r.uniform(110, 230), r.uniform(0.95, 1.15)), r.uniform(-0.9, 0.9)), 16.0 + r.uniform(0, 1.2), 0.35)
env = np.clip(np.linspace(0, 3, ns(2.8)), 0, 1) * np.clip(np.linspace(3, 0, ns(2.8)), 0, 1)
place(S, G.applause(2.8, r, 30, env), 16.0, 0.5)
place(S, G.bird_chirps(8.8, r, 0.8, "blackbird"), 18.7, 0.7); place(S, G.breeze(8.8, r, 0.35), 18.7)
place(S, G.push_thump(r) * 1.4, 20.42); place(S, G.rattle(0.4, r, 40, np.exp(-np.linspace(0, 4, ns(0.4)))) * 0.5, 20.45)
place(S, I.glock(hz(91), 0.5, r), 21.38); place(S, I.glock(hz(95), 0.4, r), 21.45)  # "Vivos" pop
for k in range(8): place(S, I.musicbox(hz([88, 91, 93, 96][k % 4]), 0.25, r, 0.6), 22.3 + k * 0.42)  # dizzy stars
place(S, G.whoosh(0.35, r, peak=0.25, f_lo=400, f_hi=1500), 25.85, 0.5)
place(S, G.push_thump(r) * 1.6, 26.16); place(S, G.hammer_hit(r, 0.35), 26.16)

# ---------------- mix: duck music under speech, levels relative to the voice
sp = []
for w in words:
    if sp and w["s"] - sp[-1][1] < 0.3: sp[-1][1] = max(sp[-1][1], w["e"])
    else: sp.append([w["s"], w["e"]])
duck = np.zeros(N)
for a, b in sp: duck[ns(max(0, a - 0.08)):ns(b + 0.12)] = 1
k = ns(0.1); duck = np.convolve(duck, np.ones(k) / k, "same")
TEM_VOZ = bool(np.abs(V).max() > 0)
vI = integrated(V) if TEM_VOZ else -16.0   # sem voz: nível que a fala teria, para a música e os efeitos ficarem no lugar
M = M * dbg(-3.0 * duck)[None, :]
M *= dbg((vI - 9.0) - integrated(M)); S *= dbg((vI - 11.0) - integrated(S))
y = V + M + S
g = dbg(-14.0 - (integrated(y) if TEM_VOZ else vI)); y *= g
pk = np.abs(y).max(); lim = dbg(-1.2)
if pk > lim:  # simple soft clip limiter
    y = np.tanh(y / lim) * lim
y = fades(y, 0.0, 0.05)
write_wav(os.path.join(HERE, "mix.wav"), y)
print(f"voz {integrated(V*g):.1f} LUFS |" if TEM_VOZ else "sem voz |", f" música {integrated(M*g):.1f} | sfx {integrated(S*g):.1f} | mix {integrated(y):.1f} LUFS, pico {20*np.log10(np.abs(y).max()):.1f} dBFS")
