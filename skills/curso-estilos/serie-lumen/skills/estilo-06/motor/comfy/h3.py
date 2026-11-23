"""MiniMax H3 imagem->vídeo (com áudio) pela API de um ComfyUI local que já está no ar. Não roda no demo (precisa de GPU e dos pesos).
Padrão: LoRA turbo de 4 passos; a série usa o modelo completo: --steps 20 --lora "".
uso: python h3.py --img cena.png --prompt-file p.txt --out saida.mp4 [--w 768 --h 1344 --frames 73 --seed 1 --steps 20 --lora ""]
Variáveis de ambiente: COMFY_INPUT = pasta input do seu ComfyUI (obrigatória com --img); COMFY_API = endereço (padrão http://127.0.0.1:8188).
Os nomes dos arquivos de peso abaixo são os da nossa instalação: troque pelos que estão na sua pasta models/.
"""
import argparse, json, time, urllib.request, urllib.parse, urllib.error, os, shutil

API = os.environ.get('COMFY_API', 'http://127.0.0.1:8188')
INPUT_DIR = os.environ.get('COMFY_INPUT', '')


def graph(img, prompt, w, h, frames, seed, steps, lora):
    g = {
        '6': {'class_type': 'UNETLoader', 'inputs': {'unet_name': 'minimax_h3_fl2va_pruned_int8_convrot.safetensors', 'weight_dtype': 'default'}},
        '13': {'class_type': 'CLIPLoader', 'inputs': {'clip_name': 'qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors', 'type': 'minimax', 'device': 'default'}},
        '11': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'minimax_h3_video_vae_int8_convrot.safetensors'}},
        '24': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'minimax_h3_audio_vae_fp32.safetensors'}},
        '30': {'class_type': 'LoadImage', 'inputs': {'image': img}},
        '31': {'class_type': 'ImageScale', 'inputs': {'image': ['30', 0], 'upscale_method': 'lanczos', 'width': w, 'height': h, 'crop': 'center'}},
        '104': {'class_type': 'MiniMaxH3ImageToVideo', 'inputs': {'clip': ['13', 0], 'vae': ['11', 0], 'prompt': prompt,
                'width': w, 'height': h, 'length': frames, 'first_frame': ['31', 0]}},
        '15': {'class_type': 'RandomNoise', 'inputs': {'noise_seed': seed}},
        '17': {'class_type': 'KSamplerSelect', 'inputs': {'sampler_name': 'res_multistep'}},
        '16': {'class_type': 'BasicGuider', 'inputs': {'model': ['M', 0], 'conditioning': ['104', 0]}},
        '9': {'class_type': 'BasicScheduler', 'inputs': {'model': ['M', 0], 'scheduler': 'simple', 'steps': steps, 'denoise': 1.0}},
        '14': {'class_type': 'SamplerCustomAdvanced', 'inputs': {'noise': ['15', 0], 'guider': ['16', 0], 'sampler': ['17', 0],
               'sigmas': ['9', 0], 'latent_image': ['104', 1]}},
        '10': {'class_type': 'VAEDecode', 'inputs': {'samples': ['14', 0], 'vae': ['11', 0]}},
        '23': {'class_type': 'VAEDecodeAudio', 'inputs': {'samples': ['14', 0], 'vae': ['24', 0]}},
        '91': {'class_type': 'CreateVideo', 'inputs': {'images': ['10', 0], 'audio': ['23', 0], 'fps': 24}},
        '92': {'class_type': 'SaveVideo', 'inputs': {'video': ['91', 0], 'filename_prefix': 'h3/cena', 'format': 'auto', 'codec': 'auto'}},
    }
    if img is None:
        for k in ('30', '31'):
            g.pop(k)
        g['104']['inputs'].pop('first_frame')
    if lora:
        g['121'] = {'class_type': 'LoraLoaderModelOnly', 'inputs': {'model': ['6', 0], 'lora_name': lora, 'strength_model': 1.0}}
        m = '121'
    else:
        m = '6'
    for k in ('16', '9'):
        g[k]['inputs']['model'] = [m, 0]
    return g


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--img')
    ap.add_argument('--prompt-file', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--w', type=int, default=448)
    ap.add_argument('--h', type=int, default=768)
    ap.add_argument('--frames', type=int, default=124)
    ap.add_argument('--seed', type=int, default=1)
    ap.add_argument('--steps', type=int, default=4)
    ap.add_argument('--lora', default='minimax_h3_fl2v_turbo_4step_v1.0_768p_comfyui_bf16.safetensors')
    a = ap.parse_args()
    name = None
    if a.img:
        if not os.path.isdir(INPUT_DIR): raise SystemExit('defina COMFY_INPUT com a pasta input do seu ComfyUI')
        name = 'h3_' + os.path.basename(a.img)
        shutil.copy(a.img, os.path.join(INPUT_DIR, name))
    prompt = open(a.prompt_file, encoding='utf8').read().strip()
    t = time.time()
    req = urllib.request.Request(API + '/prompt', data=json.dumps({'prompt': graph(name, prompt, a.w, a.h, a.frames, a.seed, a.steps, a.lora or None)}).encode(),
                                 headers={'Content-Type': 'application/json'})
    try:
        pid = json.load(urllib.request.urlopen(req))['prompt_id']
    except urllib.error.HTTPError as e:
        raise SystemExit(e.read().decode()[:2500])
    while True:
        h = json.load(urllib.request.urlopen(f'{API}/history/{pid}'))
        if pid in h and h[pid].get('status', {}).get('completed') is not None:
            break
        time.sleep(2)
    st = h[pid]['status']
    if st.get('status_str') != 'success':
        raise SystemExit('ERRO ' + json.dumps(st)[:3000])
    out = h[pid]['outputs']['92']
    f = (out.get('images') or out.get('videos') or out.get('animated') or [None])[0]
    q = urllib.parse.urlencode({'filename': f['filename'], 'subfolder': f['subfolder'], 'type': f['type']})
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    urllib.request.urlretrieve(f'{API}/view?{q}', a.out)
    print(f'{time.time() - t:.0f}s -> {a.out}')


if __name__ == '__main__':
    main()
