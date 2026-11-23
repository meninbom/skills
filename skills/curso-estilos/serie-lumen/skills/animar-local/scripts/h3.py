"""H3 (MiniMax) imagem -> vídeo pelo ComfyUI do seu PC. Grafo completo: 20 passos, sem LoRA, 768x1344, 24 qps.

A placa sobe pela API do ComfyUI (POST /upload/image). Nada de caminho fixo: pesos, URL e tamanho vêm do kit.config.json
(campos h3.*). Este script NÃO sobe nem desliga o ComfyUI. Quem faz isso é o h3_um.sh (quem sobe desliga).

uso:
  python h3.py --img placas/P01.png --prompt-file prompts/P01.txt --out clips/P01.mp4 [--frames 97] [--seed 1]
  python h3.py ... --seco          monta e grava o grafo (clips/P01.grafo.json) e confere config e pesos.
                                   Não toca no servidor, não usa a GPU.
Quadros a 24 qps: 49 ≈ 2 s, 73 ≈ 3 s, 97 ≈ 4 s, 124 ≈ 5 s. Clipe longo custa caro: 5 s ≈ 14 min, 10 s passa de 45 min.
"""
import argparse, json, os, sys, time, uuid
import urllib.request, urllib.parse, urllib.error

for _s in (sys.stdout, sys.stderr):   # acento certo no Git Bash (sem isso o Windows usa cp1252 no pipe)
    try:
        _s.reconfigure(encoding='utf-8')
    except Exception:
        pass
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import kitcfg  # noqa: E402

# chave em h3.pesos -> pastas do ComfyUI onde o arquivo costuma ficar
PASTAS = {'unet': ('diffusion_models', 'unet'), 'clip': ('text_encoders', 'clip'), 'vae_video': ('vae',), 'vae_audio': ('vae',)}
SAIDA = '92'


def grafo(img, prompt, pesos, w, h, frames, seed, passos, fps, prefixo):
    """o mesmo grafo do LUMEN (H3 completo, sem LoRA). img = nome da imagem já no input do ComfyUI."""
    return {
        '6': {'class_type': 'UNETLoader', 'inputs': {'unet_name': pesos['unet'], 'weight_dtype': 'default'}},
        '13': {'class_type': 'CLIPLoader', 'inputs': {'clip_name': pesos['clip'], 'type': 'minimax', 'device': 'default'}},
        '11': {'class_type': 'VAELoader', 'inputs': {'vae_name': pesos['vae_video']}},
        '24': {'class_type': 'VAELoader', 'inputs': {'vae_name': pesos['vae_audio']}},
        '30': {'class_type': 'LoadImage', 'inputs': {'image': img}},
        '31': {'class_type': 'ImageScale', 'inputs': {'image': ['30', 0], 'upscale_method': 'lanczos', 'width': w, 'height': h, 'crop': 'center'}},
        '104': {'class_type': 'MiniMaxH3ImageToVideo', 'inputs': {'clip': ['13', 0], 'vae': ['11', 0], 'prompt': prompt,
                'width': w, 'height': h, 'length': frames, 'first_frame': ['31', 0]}},
        '15': {'class_type': 'RandomNoise', 'inputs': {'noise_seed': seed}},
        '17': {'class_type': 'KSamplerSelect', 'inputs': {'sampler_name': 'res_multistep'}},
        '16': {'class_type': 'BasicGuider', 'inputs': {'model': ['6', 0], 'conditioning': ['104', 0]}},
        '9': {'class_type': 'BasicScheduler', 'inputs': {'model': ['6', 0], 'scheduler': 'simple', 'steps': passos, 'denoise': 1.0}},
        '14': {'class_type': 'SamplerCustomAdvanced', 'inputs': {'noise': ['15', 0], 'guider': ['16', 0], 'sampler': ['17', 0],
               'sigmas': ['9', 0], 'latent_image': ['104', 1]}},
        '10': {'class_type': 'VAEDecode', 'inputs': {'samples': ['14', 0], 'vae': ['11', 0]}},
        '23': {'class_type': 'VAEDecodeAudio', 'inputs': {'samples': ['14', 0], 'vae': ['24', 0]}},
        '91': {'class_type': 'CreateVideo', 'inputs': {'images': ['10', 0], 'audio': ['23', 0], 'fps': fps}},
        SAIDA: {'class_type': 'SaveVideo', 'inputs': {'video': ['91', 0], 'filename_prefix': prefixo, 'format': 'auto', 'codec': 'auto'}},
    }


def acha_peso(comfy_dir, chave, nome):
    """procura o arquivo do peso nas pastas de modelo do ComfyUI (portátil: <dir>/ComfyUI/models; outro: <dir>/models)"""
    for base in (os.path.join(comfy_dir, 'ComfyUI', 'models'), os.path.join(comfy_dir, 'models')):
        for sub in PASTAS[chave]:
            raiz = os.path.join(base, sub)
            if not os.path.isdir(raiz):
                continue
            for d, _, arqs in os.walk(raiz):
                if nome in arqs:
                    return os.path.join(d, nome)
    return None


def conferir(cfg, a):
    """confere config, placa, prompt e pesos sem tocar no servidor. Devolve a lista do que falta."""
    falta = []
    ok = lambda m: print(f'[ok]    {m}')
    def ruim(m):
        falta.append(m); print(f'[FALTA] {m}')
    ok(f'config: {cfg["_arquivo"]}')
    pesos = kitcfg.get('h3.pesos', {}, cfg) or {}
    for k in PASTAS:
        if not pesos.get(k):
            ruim(f'h3.pesos.{k} vazio no kit.config.json (nome do arquivo do peso, como aparece no ComfyUI)')
    comfy = kitcfg.get('h3.comfyui_dir', None, cfg)
    if not comfy:
        ruim('h3.comfyui_dir vazio: ponha a pasta do ComfyUI portátil no kit.config.json')
    elif not os.path.isdir(comfy):
        ruim(f'h3.comfyui_dir "{comfy}" não existe. Instale o ComfyUI portátil (ver SKILL.md) e corrija o caminho.')
    else:
        ok(f'ComfyUI: {comfy}')
        for k in PASTAS:
            if pesos.get(k):
                p = acha_peso(comfy, k, pesos[k])
                if p:
                    ok(f'peso {k}: {p}')
                else:
                    ruim(f'peso {k} "{pesos[k]}" não está em {"/".join(PASTAS[k])} dentro de models/. '
                         'Baixe pelo template do H3 no ComfyUI (ver SKILL.md). Se usa extra_model_paths.yaml, confira lá.')
    if a.img and not os.path.isfile(a.img):
        ruim(f'placa não existe: {a.img} (rode o placa.py)')
    elif a.img:
        ok(f'placa: {a.img}')
    if not os.path.isfile(a.prompt_file):
        ruim(f'prompt não existe: {a.prompt_file}')
    elif not open(a.prompt_file, encoding='utf-8').read().strip():
        ruim(f'prompt vazio: {a.prompt_file}')
    else:
        ok(f'prompt: {a.prompt_file}')
    return falta


def http_json(url, dados=None, cab=None, timeout=30):
    req = urllib.request.Request(url, data=dados, headers=cab or {})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def sobe_imagem(api, caminho, nome):
    """POST /upload/image (multipart). Devolve o nome que o LoadImage usa."""
    lim = '----kitserie' + uuid.uuid4().hex
    with open(caminho, 'rb') as f:
        dados = f.read()
    corpo = b''.join([
        f'--{lim}\r\nContent-Disposition: form-data; name="image"; filename="{nome}"\r\nContent-Type: image/png\r\n\r\n'.encode('utf-8'),
        dados, b'\r\n',
        f'--{lim}\r\nContent-Disposition: form-data; name="type"\r\n\r\ninput\r\n'.encode('utf-8'),
        f'--{lim}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n'.encode('utf-8'),
        f'--{lim}--\r\n'.encode('utf-8'),
    ])
    j = http_json(api + '/upload/image', corpo, {'Content-Type': f'multipart/form-data; boundary={lim}'}, timeout=120)
    return (j['subfolder'] + '/' if j.get('subfolder') else '') + j['name']


def confere_no_servidor(api, pesos):
    """pergunta ao ComfyUI quais arquivos ele enxerga (GET /models/<pasta>). Se a rota não existir, segue."""
    for k, pastas in PASTAS.items():
        vistos, respondeu = set(), False
        for sub in pastas:
            try:
                vistos |= set(http_json(f'{api}/models/{sub}', timeout=10)); respondeu = True
            except Exception:
                pass
        if respondeu and pesos[k] not in vistos and not any(v.endswith('/' + pesos[k]) or v.endswith('\\' + pesos[k]) for v in vistos):
            raise SystemExit(f'PAREI: o ComfyUI não enxerga o peso {k} "{pesos[k]}" (pastas {", ".join(pastas)}). '
                             'Confira o nome em h3.pesos e onde o arquivo está.')


def main():
    ap = argparse.ArgumentParser(description='H3 imagem -> vídeo pelo ComfyUI (grafo completo, sem LoRA).')
    ap.add_argument('--img', required=True, help='placa 768x1344 (sai do placa.py)')
    ap.add_argument('--prompt-file', required=True)
    ap.add_argument('--out', required=True, help='clips/<PLANO>.mp4')
    ap.add_argument('--frames', type=int, default=97, help='quadros a 24 qps (97 ≈ 4 s)')
    ap.add_argument('--seed', type=int, default=1)
    ap.add_argument('--w', type=int); ap.add_argument('--h', type=int)
    ap.add_argument('--max-min', type=float, default=120, help='desiste depois de N minutos (padrão 120)')
    ap.add_argument('--seco', action='store_true', help='só monta o grafo e confere; não toca no servidor')
    a = ap.parse_args()

    cfg = kitcfg.carrega()
    w = a.w or int(kitcfg.get('h3.largura', 768, cfg)); h = a.h or int(kitcfg.get('h3.altura', 1344, cfg))
    passos = int(kitcfg.get('h3.passos', 20, cfg)); fps = int(kitcfg.get('h3.fps', 24, cfg))
    api = str(kitcfg.get('h3.comfyui_url', 'http://127.0.0.1:8188', cfg)).rstrip('/')
    pesos = kitcfg.get('h3.pesos', {}, cfg) or {}
    plano = os.path.splitext(os.path.basename(a.out))[0]
    nome_img = f'kit_h3_{plano}.png'

    if a.seco:
        print(f'== h3.py --seco: {plano} ({w}x{h}, {a.frames} quadros, {passos} passos, {fps} qps, seed {a.seed}) ==')
        falta = conferir(cfg, a)
        prompt = open(a.prompt_file, encoding='utf-8').read().strip() if os.path.isfile(a.prompt_file) else ''
        pp = {k: pesos.get(k) or f'<FALTA h3.pesos.{k}>' for k in PASTAS}
        g = grafo(nome_img, prompt, pp, w, h, a.frames, a.seed, passos, fps, f'kit_h3/{plano}')
        arq = os.path.splitext(a.out)[0] + '.grafo.json'
        os.makedirs(os.path.dirname(os.path.abspath(arq)), exist_ok=True)
        with open(arq, 'w', encoding='utf-8') as f:
            json.dump({'prompt': g}, f, ensure_ascii=False, indent=1)
        print(f'[ok]    grafo gravado: {arq} ({len(g)} nós). Servidor: {api} (não contatado).')
        if falta:
            print(f'Faltou {len(falta)} coisa(s). Arrume e rode de novo.')
            sys.exit(1)
        print('Tudo certo pra rodar (pelo h3_um.sh, que sobe e desliga o ComfyUI).')
        return

    for k in PASTAS:
        if not pesos.get(k):
            raise SystemExit(f'PAREI: h3.pesos.{k} vazio no {cfg["_arquivo"]}.')
    if not os.path.isfile(a.img):
        raise SystemExit(f'PAREI: placa não existe: {a.img}')
    prompt = open(a.prompt_file, encoding='utf-8').read().strip()
    if not prompt:
        raise SystemExit(f'PAREI: prompt vazio: {a.prompt_file}')
    try:
        http_json(api + '/system_stats', timeout=5)
    except Exception:
        raise SystemExit(f'PAREI: o ComfyUI não está no ar em {api}. Use o h3_um.sh (ele sobe, gera e desliga).')
    confere_no_servidor(api, pesos)

    t0 = time.time()
    img = sobe_imagem(api, a.img, nome_img)
    g = grafo(img, prompt, pesos, w, h, a.frames, a.seed, passos, fps, f'kit_h3/{plano}')
    try:
        pid = http_json(api + '/prompt', json.dumps({'prompt': g}).encode('utf-8'), {'Content-Type': 'application/json'})['prompt_id']
    except urllib.error.HTTPError as e:
        raise SystemExit('PAREI: o ComfyUI recusou o grafo:\n' + e.read().decode('utf-8', 'replace')[:2500])
    print(f'{plano}: enviado ({a.frames} quadros, seed {a.seed}). Esperando...', flush=True)
    erros, ultimo = 0, 0
    while True:
        try:
            hist = http_json(f'{api}/history/{pid}', timeout=30); erros = 0
        except Exception:
            erros += 1
            if erros >= 10:
                raise SystemExit('PAREI: o ComfyUI parou de responder (caiu?). Veja o comfy_h3.log.')
            time.sleep(5); continue
        if pid in hist and hist[pid].get('status', {}).get('completed') is not None:
            break
        dt = time.time() - t0
        if dt > a.max_min * 60:
            raise SystemExit(f'PAREI: passou de {a.max_min:.0f} min. Clipe longo demais? Tente menos quadros.')
        if dt - ultimo >= 60:
            ultimo = dt; print(f'  ... {dt / 60:.0f} min', flush=True)
        time.sleep(3)
    st = hist[pid]['status']
    if st.get('status_str') != 'success':
        raise SystemExit('PAREI: o H3 deu erro: ' + json.dumps(st, ensure_ascii=False)[:3000])
    out = hist[pid]['outputs'][SAIDA]
    f = (out.get('images') or out.get('videos') or out.get('animated') or [None])[0]
    if not f:
        raise SystemExit('PAREI: o ComfyUI terminou sem devolver o vídeo: ' + json.dumps(out)[:800])
    q = urllib.parse.urlencode({'filename': f['filename'], 'subfolder': f.get('subfolder', ''), 'type': f.get('type', 'output')})
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    urllib.request.urlretrieve(f'{api}/view?{q}', a.out)
    print(f'{time.time() - t0:.0f}s -> {a.out}')


if __name__ == '__main__':
    main()
