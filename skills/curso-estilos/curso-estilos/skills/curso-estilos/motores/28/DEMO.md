# Demo · 28 Ciclo de conferência

**Precisa de:** Python 3.9+ e FFmpeg no PATH. Só CPU. Nada de GPU, voz ou serviço externo.

```
pip install -r requirements.txt
python demo.py
```

**O que acontece:** uma fila de 3 planos falsos (desenhados por código). O plano do meio é congelado de propósito. A conferência mede os 3, reprova só o #1 (parado), ele volta para a fila com `vivo=1`, é refeito sozinho, e a 2ª rodada dá 0 reprovados.

**O que sai:**
- `saida/demo.mp4` (540×960, 30 qps, 3,6 s, mudo): os 3 planos já consertados.
- `saida/ciclo/DEVOLUCOES.md`: o registro PLANO / VEREDITO / MOTIVO / PROVA / ESCOPO.
- `saida/ciclo/estado.json`, `checagem_r1/` e `checagem_r2/` (o veredito de cada rodada), `segs/_antigo/` (o segmento congelado, guardado).

**Tempo:** 20–60 s. O demo sai com código 0 só se o laço fez exatamente isso (reprovou o #1 e refez só ele).

**No seu projeto:** veja `LEIA.md` (o contrato da montagem e do mix).
