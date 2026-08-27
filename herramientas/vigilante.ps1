# ═══════════════════════════════════════════════════════════════════════
#  vigilante.ps1 — que el punto de acceso NUNCA se quede caído.
#
#  Windows apaga el hotspot por su cuenta: cuando nadie se conecta, cuando
#  la laptop se suspende, y cuando la red que comparte parpadea. Si eso pasa
#  en medio de la presentación, los ocho teléfonos se quedan sin red.
#
#  Este script lo revisa cada pocos segundos y lo vuelve a encender. Está
#  pensado para correr de fondo, sin ventana, durante toda la clase.
#
#  Uso:
#     powershell -ExecutionPolicy Bypass -File vigilante.ps1
#     powershell -ExecutionPolicy Bypass -File vigilante.ps1 -Cada 5 -Minutos 90
#     powershell -ExecutionPolicy Bypass -File vigilante.ps1 -UnaVez     (una pasada)
# ═══════════════════════════════════════════════════════════════════════
param(
  [int]$Cada = 8,        # cada cuántos segundos revisar
  [int]$Minutos = 0,     # cuánto tiempo vigilar (0 = para siempre)
  [switch]$UnaVez,       # revisar una sola vez y salir (para la tarea programada)
  [string]$Nombre = "IMPERIO",
  [string]$Clave = "12345678"
)

$ErrorActionPreference = "Stop"

function Get-Gestor {
  [Windows.Networking.Connectivity.NetworkInformation, Windows.Networking.Connectivity, ContentType = WindowsRuntime] | Out-Null
  [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager, Windows.Networking.NetworkOperators, ContentType = WindowsRuntime] | Out-Null
  $perfil = [Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile()
  if ($null -eq $perfil) {
    foreach ($p in [Windows.Networking.Connectivity.NetworkInformation]::GetConnectionProfiles()) {
      if ($null -ne $p -and $null -ne $p.NetworkAdapter) { $perfil = $p; break }
    }
  }
  if ($null -eq $perfil) { return $null }
  return [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager]::CreateFromConnectionProfile($perfil)
}

# El apagado por inactividad se desactiva en el registro, pero el ajuste NO
# vale hasta que se reinicia el servicio: por eso parecía no servir.
function Asegurar-Ajuste {
  $k = "HKLM:\System\CurrentControlSet\Services\icssvc\Settings"
  try {
    $v = (Get-ItemProperty -Path $k -Name PeerlessTimeoutEnabled -ErrorAction SilentlyContinue).PeerlessTimeoutEnabled
    if ($v -ne 0) {
      if (-not (Test-Path $k)) { New-Item -Path $k -Force | Out-Null }
      New-ItemProperty -Path $k -Name "PeerlessTimeoutEnabled" -Value 0 -PropertyType DWord -Force -ErrorAction Stop | Out-Null
      Restart-Service icssvc -Force -ErrorAction SilentlyContinue
      Write-Output "$(Get-Date -Format HH:mm:ss)  ajuste aplicado y servicio reiniciado"
    }
  } catch { }
}

function Revisar {
  $g = Get-Gestor
  if ($null -eq $g) { return $false }
  if ($g.TetheringOperationalState -eq "On") { return $true }

  # está caído: configurarlo y levantarlo
  try {
    $cfg = $g.GetCurrentAccessPointConfiguration()
    if ($cfg.Ssid -ne $Nombre -or $cfg.Passphrase -ne $Clave) {
      $cfg.Ssid = $Nombre; $cfg.Passphrase = $Clave
      $null = $g.ConfigureAccessPointAsync($cfg)
      Start-Sleep -Seconds 2
    }
  } catch { }
  $null = $g.StartTetheringAsync()
  $limite = (Get-Date).AddSeconds(20)
  while ($g.TetheringOperationalState -ne "On" -and (Get-Date) -lt $limite) { Start-Sleep -Milliseconds 400 }
  $ok = ($g.TetheringOperationalState -eq "On")
  Write-Output ("$(Get-Date -Format HH:mm:ss)  estaba caído -> " + $(if ($ok) { "encendido" } else { "NO se pudo" }))
  return $ok
}

Asegurar-Ajuste

if ($UnaVez) { $null = Revisar; exit 0 }

$fin = if ($Minutos -gt 0) { (Get-Date).AddMinutes($Minutos) } else { (Get-Date).AddYears(1) }
Write-Output "Vigilando el punto de acceso «$Nombre» cada $Cada s. Ctrl+C para parar."
while ((Get-Date) -lt $fin) {
  try { $null = Revisar } catch { }
  Start-Sleep -Seconds $Cada
}
