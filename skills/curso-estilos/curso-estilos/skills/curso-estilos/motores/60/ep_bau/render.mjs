// Quadros crus (CPU, 135x240) -> FFmpeg -> MP4 mudo, ampliado por um número inteiro com vizinho mais próximo.
// node ep_bau/render.mjs [--de 0] [--ate fim] [--escala 8] [--crf 16] [--saida saida/ep_bau_mudo.mp4]
//   escala 8 = 1080x1920 (final) · escala 4 = 540x960 (prévia). FFmpeg no PATH (ou variável de ambiente FFMPEG).
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve, isAbsolute } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));

export async function renderizar({ de = 0, ate = null, escala = 8, crf = 16, saida = "saida/ep_bau_mudo.mp4" } = {}) {
  const { quadro, resetar, DUR, FPS, W, H } = await import("./ep.mjs");
  const fim = Math.min(ate ?? DUR, DUR), N = Math.round((fim - de) * FPS);
  if (N <= 0) throw new Error(`nada para renderizar: de ${de} até ${fim}`);
  const arq = isAbsolute(saida) ? saida : resolve(RAIZ, saida);
  mkdirSync(dirname(arq), { recursive: true });
  const ff = spawn(process.env.FFMPEG || "ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-r", String(FPS), "-i", "-",
    "-vf", `scale=iw*${escala}:ih*${escala}:flags=neighbor,format=yuv420p`, "-an", "-c:v", "libx264", "-crf", String(crf), "-preset", "medium", "-tune", "animation", "-movflags", "+faststart", arq],
    { stdio: ["pipe", "inherit", "inherit"] });
  const acabou = new Promise((ok, erro) => { ff.on("error", () => erro(new Error("não achei o FFmpeg: instale e deixe no PATH, ou aponte a variável FFMPEG"))); ff.on("close", (c) => (c === 0 ? ok() : erro(new Error("FFmpeg saiu com código " + c)))); });
  ff.stdin.on("error", () => {});
  resetar();
  for (let f = 0; f < N; f++) {
    const t = quadro(de + f / FPS), b = Buffer.from(t.C.buffer.slice(0));
    if (!ff.stdin.write(b)) await new Promise((r) => ff.stdin.once("drain", r));
    if (f % 300 === 0) process.stderr.write(`quadro ${f}/${N}\n`);
  }
  ff.stdin.end(); await acabou;
  return { arquivo: arq, quadros: N, largura: W * escala, altura: H * escala, fps: FPS };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2), op = {};
  for (let i = 0; i < a.length; i += 2) { const k = a[i].replace(/^--/, ""); op[k] = k === "saida" ? a[i + 1] : Number(a[i + 1]); }
  const r = await renderizar(op);
  console.log(`${r.arquivo} · ${r.quadros} quadros · ${r.largura}x${r.altura} @ ${r.fps}`);
}
