#!/usr/bin/env node
// Confere o PC do aluno. Só lê; não instala nem altera nada.
// Grava ~/.curso-estilos/pc.json (ou a pasta em CURSO_ESTILOS_DADOS) e imprime um resumo.
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const WIN = process.platform === "win32", MAC = process.platform === "darwin";
const HOME = os.homedir();
export const DADOS = process.env.CURSO_ESTILOS_DADOS || path.join(HOME, ".curso-estilos");

function sh(cmd, args = []) {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 15000, windowsHide: true }).trim();
  } catch (e) {
    const out = `${e.stdout || ""}${e.stderr || ""}`.trim();
    return e.code === "ENOENT" || !out ? null : out; // alguns programas escrevem a versão no stderr
  }
}
const existe = (...ps) => ps.filter(Boolean).find((p) => { try { return fs.existsSync(p); } catch { return false; } }) || null;
function globDir(base, re, resto = "") {
  try {
    for (const d of fs.readdirSync(base)) {
      if (re.test(d)) { const p = path.join(base, d, resto); if (fs.existsSync(p)) return p; }
    }
  } catch {}
  return null;
}
const ver = (s, re = /(\d+\.\d+(\.\d+)?)/) => (s && re.exec(s) ? re.exec(s)[1] : null);

function gpu() {
  const nv = sh("nvidia-smi", ["--query-gpu=name,memory.total", "--format=csv,noheader,nounits"]);
  if (nv && /,\s*\d+/.test(nv)) {
    const [nome, mb] = nv.split("\n")[0].split(",").map((x) => x.trim());
    return { nome, vram_gb: Math.round((Number(mb) / 1024) * 10) / 10, nvidia: true };
  }
  if (WIN) {
    const n = sh("powershell", ["-NoProfile", "-Command", "(Get-CimInstance Win32_VideoController | Select-Object -First 1).Name"]);
    return { nome: n || "não identificada", vram_gb: 0, nvidia: false };
  }
  if (MAC) return { nome: os.cpus()[0]?.model || "Apple", vram_gb: 0, nvidia: false, apple: process.arch === "arm64" };
  return { nome: "não identificada", vram_gb: 0, nvidia: false };
}

function disco() {
  try { const s = fs.statfsSync(HOME); return Math.round((s.bavail * s.bsize) / 2 ** 30); } catch { return null; }
}

function programas() {
  const PF = process.env.ProgramFiles || "C:\\Program Files", PF86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  const LAD = process.env.LOCALAPPDATA || path.join(HOME, "AppData", "Local");
  const p = {};
  p.node = process.version.replace(/^v/, "");
  p.python = ver(sh("python", ["--version"])) || ver(sh("python3", ["--version"])) || (WIN ? ver(sh("py", ["--version"])) : null);
  p.ffmpeg = ver(sh("ffmpeg", ["-version"]), /version\s+(\S+)/);
  p.git = ver(sh("git", ["--version"]));
  p.chrome = existe(
    process.env.CHROME_PATH,
    path.join(PF, "Google/Chrome/Application/chrome.exe"), path.join(PF86, "Google/Chrome/Application/chrome.exe"),
    path.join(LAD, "Google/Chrome/Application/chrome.exe"), path.join(PF86, "Microsoft/Edge/Application/msedge.exe"),
    "/Applications/Google Chrome.app", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  ) || globDir(path.join(WIN ? LAD : path.join(HOME, MAC ? "Library/Caches" : ".cache"), "ms-playwright"), /^chromium/);
  p.blender = existe(process.env.BLENDER_PATH) || ver(sh("blender", ["--version"])) || globDir(path.join(PF, "Blender Foundation"), /^Blender/, "blender.exe") || existe("/Applications/Blender.app");
  p.comfyui = [process.env.COMFYUI_DIR, path.join((process.env.SystemDrive || "C:") + path.sep, "ComfyUI"),path.join(HOME, "ComfyUI"), path.join(HOME, "Documents", "ComfyUI")]
    .filter(Boolean).find((d) => existe(path.join(d, "main.py"), path.join(d, "ComfyUI", "main.py"), path.join(d, "ComfyUI_windows_portable", "ComfyUI", "main.py"))) || null;
  p.roblox = globDir(path.join(LAD, "Roblox", "Versions"), /^version-/, "RobloxStudioBeta.exe") || existe("/Applications/RobloxStudio.app");
  p.blockbench = existe(path.join(LAD, "Programs/Blockbench/Blockbench.exe"), path.join(LAD, "Programs/blockbench/Blockbench.exe"),
    path.join(PF, "Blockbench/Blockbench.exe"), "/Applications/Blockbench.app");
  return p;
}

export function checar() {
  const pc = {
    quando: new Date().toISOString(),
    sistema: `${os.type()} ${os.release()} (${process.arch})`,
    ram_gb: Math.round(os.totalmem() / 2 ** 30),
    nucleos: os.cpus().length,
    disco_livre_gb: disco(),
    gpu: gpu(),
    programas: programas(),
  };
  fs.mkdirSync(DADOS, { recursive: true });
  fs.writeFileSync(path.join(DADOS, "pc.json"), JSON.stringify(pc, null, 2));
  return pc;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const pc = checar();
  const g = pc.gpu;
  console.log(`Sistema: ${pc.sistema}`);
  console.log(`Memória: ${pc.ram_gb} GB · Núcleos: ${pc.nucleos} · Disco livre: ${pc.disco_livre_gb ?? "?"} GB`);
  console.log(`Placa de vídeo: ${g.nome}${g.vram_gb ? ` (${g.vram_gb} GB de VRAM)` : ""}`);
  console.log("Programas:");
  for (const [k, v] of Object.entries(pc.programas)) console.log(`  ${v ? "ok   " : "falta"} ${k}${v && v !== true ? `  ${v}` : ""}`);
  console.log(`\nGravado em ${path.join(DADOS, "pc.json")}`);
}
