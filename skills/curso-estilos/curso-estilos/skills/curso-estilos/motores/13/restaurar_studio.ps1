# Restaura a janela do Roblox Studio se ela estiver minimizada (rode antes de cada gravacao). Uso: powershell -File restaurar_studio.ps1
Add-Type @"
using System; using System.Runtime.InteropServices;
public class W2 { [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h,int c); [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h); }
"@
Get-Process RobloxStudioBeta -ErrorAction SilentlyContinue | ? { $_.MainWindowHandle -ne 0 } | % { if ([W2]::IsIconic($_.MainWindowHandle)) { [W2]::ShowWindow($_.MainWindowHandle,9) | Out-Null; "restaurado" } else { "ja aberto" } }
