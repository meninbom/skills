# Baixar o pacote completo de efeitos

O plugin traz só 3 efeitos de amostra (`amostra/quadros/`). Os 343 do catálogo vêm num zip à parte (~1,4 GB).

## 1. Baixar
- O link do zip está na página da aula do fx-golpe, no curso.
- Junto do zip vem a lista (`..._lista.txt`): os efeitos, o número no catálogo e o SHA-256 do zip.

## 2. Conferir (opcional)
No Git Bash:
```bash
sha256sum efeitos_fx_golpe.zip
```
O resultado tem que ser igual à linha `sha256` da lista. Se não for, baixe de novo.

## 3. Descompactar
Escolha uma pasta fixa, fora da pasta da série (o pacote é grande e serve pra todas as séries).
Ex.: `<sua pasta>/efeitos_fx`. Descompacte lá. Fica assim:
```
<sua pasta>/efeitos_fx/
  quadros/
    02_Tktk03__ToonHit/f0000.jpg …
    X_tktk01__Blow1/f0000.jpg …
    …
  licencas/
  LEIA.txt
```

## 4. Apontar no `kit.config.json`
No `kit.config.json` da sua série, preencha `fx.quadros` com a pasta **`quadros`**:
```json
"fx": {"quadros": "<sua pasta>/efeitos_fx/quadros"}
```
- Use barra normal (`/`), mesmo no Windows.
- Enquanto `fx.quadros` estiver vazio, o motor usa a amostra (3 efeitos).
- Se o caminho estiver errado, o motor para e diz o que falta.

## 5. Testar
```bash
python ${CLAUDE_SKILL_DIR}/scripts/aplicar_fx.py IN.mp4 TESTE.mp4 --fx X_tktk01__Blow3 --t 1.0 --corte 0 2
```
O nº 242 (`X_tktk01__Blow3`) não está na amostra. Se funcionar, o pacote está ligado.
