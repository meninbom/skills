"""Gera imagens com Z-Image Turbo via API do ComfyUI local (127.0.0.1:8188).
uso: python zimage.py --out pasta --w 1080 --h 1920 --seed 1 "prompt 1" "prompt 2" ...
     python zimage.py --out pasta --file prompts.txt   (um prompt por linha)
"""
import argparse, json, time, urllib.request, urllib.parse, os, random

API = 'http://127.0.0.1:8188'
UNET = 'z_image_turbo_int8_convrot.safetensors'
CLIP = 'qwen_3_4b_fp8_mixed.safetensors'


def graph(prompt, w, h, seed, steps):
    return {
        '28': {'class_type': 'UNETLoader', 'inputs': {'unet_name': UNET, 'weight_dtype': 'default'}},
        '30': {'class_type': 'CLIPLoader', 'inputs': {'clip_name': CLIP, 'type': 'lumina2', 'device': 'default'}},
        '29': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'ae.safetensors'}},
        '11': {'class_type': 'ModelSamplingAuraFlow', 'inputs': {'model': ['28', 0], 'shift': 3}},
        '27': {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['30', 0], 'text': prompt}},
        '33': {'class_type': 'ConditioningZeroOut', 'inputs': {'conditioning': ['27', 0]}},
        '13': {'class_type': 'EmptySD3LatentImage', 'inputs': {'width': w, 'height': h, 'batch_size': 1}},
        '3': {'class_type': 'KSampler', 'inputs': {'model': ['11', 0], 'positive': ['27', 0], 'negative': ['33', 0],
              'latent_image': ['13', 0], 'seed': seed, 'steps': steps, 'cfg': 1, 'sampler_name': 'res_multistep',
              'scheduler': 'simple', 'denoise': 1}},
        '8': {'class_type': 'VAEDecode', 'inputs': {'samples': ['3', 0], 'vae': ['29', 0]}},
        '9': {'class_type': 'SaveImage', 'inputs': {'images': ['8', 0], 'filename_prefix': 'zimage'}},
    }


def post(path, data):
    req = urllib.request.Request(API + path, data=json.dumps(data).encode(), headers={'Content-Type': 'application/json'})
    return json.load(urllib.request.urlopen(req))


def get(path):
    return json.load(urllib.request.urlopen(API + path))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('prompts', nargs='*')
    ap.add_argument('--file')
    ap.add_argument('--out', required=True)
    ap.add_argument('--w', type=int, default=1088)
    ap.add_argument('--h', type=int, default=1920)
    ap.add_argument('--seed', type=int, default=None)
    ap.add_argument('--steps', type=int, default=8)
    ap.add_argument('--names', help='nomes separados por vírgula, na ordem dos prompts')
    a = ap.parse_args()
    prompts = list(a.prompts)
    if a.file:
        prompts += [l.strip() for l in open(a.file, encoding='utf8') if l.strip()]
    names = a.names.split(',') if a.names else [f'{i + 1:02d}' for i in range(len(prompts))]
    os.makedirs(a.out, exist_ok=True)
    for name, p in zip(names, prompts):
        seed = a.seed if a.seed is not None else random.randint(1, 2**31)
        t = time.time()
        pid = post('/prompt', {'prompt': graph(p, a.w, a.h, seed, a.steps)})['prompt_id']
        while True:
            h = get(f'/history/{pid}')
            if pid in h and h[pid].get('status', {}).get('completed') is not None:
                break
            time.sleep(0.5)
        st = h[pid]['status']
        if st.get('status_str') != 'success':
            print(name, 'ERRO', json.dumps(st)[:600]); continue
        img = h[pid]['outputs']['9']['images'][0]
        q = urllib.parse.urlencode({'filename': img['filename'], 'subfolder': img['subfolder'], 'type': img['type']})
        dst = os.path.join(a.out, f'{name}.png')
        urllib.request.urlretrieve(f'{API}/view?{q}', dst)
        print(f'{name}: {time.time() - t:.1f}s seed={seed} -> {dst}', flush=True)


if __name__ == '__main__':
    main()
