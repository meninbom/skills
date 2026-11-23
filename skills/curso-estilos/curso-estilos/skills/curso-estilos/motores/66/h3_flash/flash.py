"""HyperFlow H3 Flash (GGUF Q4_K_M) via API do ComfyUI local. Grafo = example_workflows/api oficial do
Video-Rebirth/ComfyUI-HyperFlow-Flash, trocando só: VAE de vídeo (a variante int8_convrot), resolução,
seed e passos. Mede tempo total e pico de VRAM (nvidia-smi a cada 0,5 s).
uso: python flash.py --prompt-file p.txt --out saida.mp4 [--img still.png] [--w 768 --h 1344 --frames 124 --seed 1 --steps 6]
"""
import argparse, json, os, shutil, subprocess, threading, time, urllib.parse, urllib.request

API = os.environ.get('COMFY_API', 'http://127.0.0.1:8188')
# pasta input/ do SEU ComfyUI: defina a variável de ambiente COMFY_INPUT (ex.: <pasta do ComfyUI>/ComfyUI/input)
INPUT_DIR = os.environ.get('COMFY_INPUT', '')
GGUF = 'minimax_h3_fl2va_hyperflow_flash_14b-Q4_K_M.gguf'


def graph(img, prompt, w, h, frames, seed, steps, gguf):
    g = {
        '1': {'class_type': 'HyperFlowGGUFLoader', 'inputs': {'unet_name': gguf}},
        '2': {'class_type': 'CLIPLoader', 'inputs': {'clip_name': 'qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors', 'type': 'minimax', 'device': 'default'}},
        '3': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'minimax_h3_video_vae_int8_convrot.safetensors'}},
        '4': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'minimax_h3_audio_vae_fp32.safetensors'}},
        '5': {'class_type': 'MiniMaxH3ImageToVideo', 'inputs': {'clip': ['2', 0], 'vae': ['3', 0], 'prompt': prompt,
              'width': w, 'height': h, 'length': frames}},
        '6': {'class_type': 'HyperFlowSigmas', 'inputs': {'model': ['1', 0], 'steps': steps}},
        '7': {'class_type': 'KSamplerSelect', 'inputs': {'sampler_name': 'euler'}},
        '8': {'class_type': 'RandomNoise', 'inputs': {'noise_seed': seed}},
        '9': {'class_type': 'BasicGuider', 'inputs': {'model': ['1', 0], 'conditioning': ['5', 0]}},
        '10': {'class_type': 'SamplerCustomAdvanced', 'inputs': {'noise': ['8', 0], 'guider': ['9', 0], 'sampler': ['7', 0],
               'sigmas': ['6', 0], 'latent_image': ['5', 1]}},
        '11': {'class_type': 'VAEDecode', 'inputs': {'samples': ['10', 0], 'vae': ['3', 0]}},
        '12': {'class_type': 'VAEDecodeAudio', 'inputs': {'samples': ['10', 0], 'vae': ['4', 0]}},
        '13': {'class_type': 'CreateVideo', 'inputs': {'images': ['11', 0], 'audio': ['12', 0], 'fps': 24}},
        '14': {'class_type': 'SaveVideo', 'inputs': {'video': ['13', 0], 'filename_prefix': 'hyperflow/flash', 'format': 'mp4', 'codec': 'auto'}},
    }
    if img:
        g['20'] = {'class_type': 'LoadImage', 'inputs': {'image': img}}
        g['21'] = {'class_type': 'ImageScale', 'inputs': {'image': ['20', 0], 'upscale_method': 'lanczos', 'width': w, 'height': h, 'crop': 'center'}}
        g['5']['inputs']['first_frame'] = ['21', 0]
    return g


class VramPeak(threading.Thread):
    def __init__(self):
        super().__init__(daemon=True)
        self.peak = 0
        self.stop = False

    def run(self):
        while not self.stop:
            try:
                v = int(subprocess.check_output(['nvidia-smi', '--query-gpu=memory.used', '--format=csv,noheader,nounits'], text=True).split()[0])
                self.peak = max(self.peak, v)
            except Exception:
                pass
            time.sleep(0.5)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--img')
    ap.add_argument('--prompt-file', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--w', type=int, default=768)
    ap.add_argument('--h', type=int, default=1344)
    ap.add_argument('--frames', type=int, default=124)
    ap.add_argument('--seed', type=int, default=1)
    ap.add_argument('--steps', type=int, default=6)
    ap.add_argument('--gguf', default=GGUF)
    a = ap.parse_args()
    name = None
    if a.img:
        if not os.path.isdir(INPUT_DIR): raise SystemExit('defina COMFY_INPUT com a pasta input/ do seu ComfyUI')
        name = 'flash_' + os.path.basename(a.img)
        shutil.copy(a.img, os.path.join(INPUT_DIR, name))
    prompt = open(a.prompt_file, encoding='utf8').read().strip()
    mon = VramPeak(); mon.start()
    t = time.time()
    body = json.dumps({'prompt': graph(name, prompt, a.w, a.h, a.frames, a.seed, a.steps, a.gguf)}).encode()
    req = urllib.request.Request(API + '/prompt', data=body, headers={'Content-Type': 'application/json'})
    try:
        pid = json.load(urllib.request.urlopen(req))['prompt_id']
    except urllib.error.HTTPError as e:
        raise SystemExit(e.read().decode()[:2500])
    while True:
        h = json.load(urllib.request.urlopen(f'{API}/history/{pid}'))
        if pid in h and h[pid].get('status', {}).get('completed') is not None:
            break
        time.sleep(2)
    mon.stop = True
    st = h[pid]['status']
    if st.get('status_str') != 'success':
        raise SystemExit('ERRO ' + json.dumps(st)[:3000])
    out = h[pid]['outputs']['14']
    f = (out.get('images') or out.get('videos') or out.get('animated') or [None])[0]
    q = urllib.parse.urlencode({'filename': f['filename'], 'subfolder': f['subfolder'], 'type': f['type']})
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    urllib.request.urlretrieve(f'{API}/view?{q}', a.out)
    print(f'{time.time() - t:.0f}s  pico VRAM {mon.peak} MiB  steps={a.steps} {a.w}x{a.h}x{a.frames} -> {a.out}', flush=True)


if __name__ == '__main__':
    main()
