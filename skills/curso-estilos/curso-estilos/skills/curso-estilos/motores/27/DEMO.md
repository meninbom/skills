# Demo · 27 Efeito de golpe

**Precisa de:** Python 3.9+ e FFmpeg no PATH. Só CPU.

```
pip install -r requirements.txt
python demo.py
```

**O que sai:** `saida/demo.mp4` (540×960, 30 qps, 3 s, mudo): dois blocos feitos por código, um golpeia o outro, a cena congela 8 quadros e o ToonHit estoura logo depois do congelamento. `saida/placeholder.mp4` é o mesmo clipe sem o efeito, para comparar.

**Tempo:** ~5 s.

**Trocar o efeito:** `python demo.py Blow1` (ou `hit_eff`, `MagicCold`, `Sword1`: as pastas de `quadros/`).

**No seu vídeo:** `python aplicar_fx.py SEU.mp4 SAIDA.mp4 --linha golpes_exemplo.json` (ajuste `t`, `x`, `y`). Se o vídeo tem som, use `"t": "auto"` + `"janela": [a, b]` e o motor acha o ataque do golpe sozinho. Som de golpe não vem no pacote: aponte `"sfx"` para um .wav da sua biblioteca ou de um pack CC0.
