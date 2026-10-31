# scripts

Scripts que substituem trabalho manual repetido dos bots. Rodam na box (`python3`, Playwright e Chrome já instalados; `claude` e `codex` logados). Nenhum segredo fica no repo.

| script | o que faz | uso |
|---|---|---|
| `agent-run` | roda `claude -p` ou `codex exec` a partir de um brief e salva `prompt.md`, `output.json`, `log.txt` e `summary.md` numa pasta datada (padrão `/workspace/agent-runs/`) | `agent-run --brief brief.md --model opus --role "revisor final" --repo /workspace/mwllo-dev-v4` · codex: `--cli codex --model gpt-6.1-sol` · `--dry-run` só grava o comando |
| `qa-preview` | abre a URL em desktop (1440) e mobile (390), salva `desktop.png`, `mobile.png`, `console-errors.json` e `checklist.md` com a régua da skill qa-antes-de-preview-mwllo (itens automáticos + manuais) | `qa-preview https://preview.vercel.app [--out pasta]` |
| `gmail-triage` | classifica páginas JSON do `search_threads` do Gmail com as regras do `gmail_classify.py` (+ extras do `rules.json`). Gera `archive_ids.json`, `report.md`, `detail.json`. **Nunca arquiva**: o bot só arquiva depois do OK do Kauã | `gmail-triage --rules rules.json pag1.json pag2.json` |
| `arauto-render` | edição HTML → PDF A4 datado `<out-dir>/<prefixo>-AAAA-MM-DD.pdf` (data do nome do arquivo ou hoje) | `arauto-render /workspace/arauto/edicao-2026-10-30.html` → `/workspace/arauto/clarim-2026-10-30.pdf` |
| `healthcheck-slice` | fatia transcripts exportados (`.txt` com cabeçalho `===== role @ data =====` ou `.jsonl` `{role,text}`) por bot e janela de datas. Só formata, não analisa | `healthcheck-slice --from 2026-10-24 --to 2026-10-31 pasta/ arq.jsonl` |

`rules.json` do gmail-triage (tudo opcional):

```json
{"query": "category:promotions older_than:7d",
 "extra_skip_senders": ["meubanco.com"],
 "extra_skip_phrases": ["boleto"],
 "extra_archive_senders": ["newsletter.x.com"]}
```

Instalação na box: `export PATH="$PATH:/caminho/do/repo/scripts"`.
