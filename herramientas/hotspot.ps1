# ═══════════════════════════════════════════════════════════════════════
#  hotspot.ps1 — convierte ESTA computadora en el punto de acceso (WiFi)
#
#  Para qué: que los teléfonos se conecten a la laptop directamente, sin
#  router y SIN INTERNET. Una vez conectados, entran a la página por la IP
#  de la laptop y la sala funciona aunque la red de la U bloquee todo.
#
#  Uso:
#     powershell -ExecutionPolicy Bypass -File hotspot.ps1            (ver estado)
#     powershell -ExecutionPolicy Bypass -File hotspot.ps1 -Encender
#     powershell -ExecutionPolicy Bypass -File hotspot.ps1 -Apagar
#
#  OJO: Windows a veces se niega a compartir cuando no hay internet que
#  compartir. Si falla, la alternativa que SIEMPRE funciona es al revés:
#  que el hotspot lo ponga un teléfono (el tuyo) y que la laptop se conecte
#  a ese hotspot. No hace falta que tengas datos: basta con que la red
#  exista. Todo está explicado en LEEME.md.
# ═══════════════════════════════════════════════════════════════════════
param(
  [switch]$Encender,
  [switch]$Apagar,
  [string]$Nombre,          # cambia el SSID (ej: -Nombre "IMPERIO")
  [string]$Clave,           # cambia la clave (Windows EXIGE 8 caracteres o mas)
  [switch]$NoApagar         # que Windows NO lo apague solo cuando nadie se conecta
)

$ErrorActionPreference = "Stop"

# Windows apaga el punto de acceso solo a los pocos minutos si nadie se conecta,
# y entonces la pantalla del presentador vuelve a decir "conectate al wifi de tu
# casa". Este ajuste lo desactiva. Necesita permisos de administrador.
function Quitar-ApagadoAutomatico {
  $k = "HKLM:\System\CurrentControlSet\Services\icssvc\Settings"
  try {
    if (-not (Test-Path $k)) { New-Item -Path $k -Force | Out-Null }
    New-ItemProperty -Path $k -Name "PeerlessTimeoutEnabled" -Value 0 -PropertyType DWord -Force -ErrorAction Stop | Out-Null
    Write-Output "  Apagado automatico desactivado: ya no se cae solo."
  } catch {
    Write-Output "  (no se pudo desactivar el apagado automatico: hace falta administrador)"
  }
}

function Get-Gestor {
  # WinRT: el mismo motor que usa Configuración → Zona con cobertura inalámbrica
  [Windows.Networking.Connectivity.NetworkInformation, Windows.Networking.Connectivity, ContentType = WindowsRuntime] | Out-Null
  [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager, Windows.Networking.NetworkOperators, ContentType = WindowsRuntime] | Out-Null

  $perfil = [Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile()
  if ($null -eq $perfil) {
    # Sin internet no hay "perfil de internet": se busca cualquier adaptador vivo
    $perfiles = [Windows.Networking.Connectivity.NetworkInformation]::GetConnectionProfiles()
    foreach ($p in $perfiles) {
      if ($null -ne $p -and $null -ne $p.NetworkAdapter) { $perfil = $p; break }
    }
  }
  if ($null -eq $perfil) { throw "No hay ningún adaptador de red activo en esta computadora." }
  return [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager]::CreateFromConnectionProfile($perfil)
}

function Mostrar($g) {
  $cfg = $g.GetCurrentAccessPointConfiguration()
  Write-Output ""
  Write-Output "  ESTADO DEL PUNTO DE ACCESO"
  Write-Output "  ──────────────────────────"
  Write-Output ("  Encendido : " + $g.TetheringOperationalState)
  Write-Output ("  Red (SSID): " + $cfg.Ssid)
  Write-Output ("  Clave     : " + $cfg.Passphrase)
  Write-Output ("  Conectados: " + $g.ClientCount + " de " + $g.MaxClientCount)
  Write-Output ""
  if ($g.TetheringOperationalState -eq "On") {
    Write-Output "  Los teléfonos se conectan a esa red y después escanean el QR."
    Write-Output "  La IP de esta compu en el hotspot suele ser 192.168.137.1"
  }
}

try {
  $g = Get-Gestor
} catch {
  Write-Output ""
  Write-Output "  No se pudo hablar con el punto de acceso de Windows:"
  Write-Output ("  " + $_.Exception.Message)
  Write-Output ""
  Write-Output "  Plan B (el que nunca falla): poné el hotspot desde TU TELÉFONO"
  Write-Output "  y conectá la laptop a ese hotspot. No necesitás datos móviles:"
  Write-Output "  alcanza con que la red exista. Después corré arrancar.ps1 y"
  Write-Output "  el QR va a salir con la IP correcta."
  Write-Output ""
  Write-Output "  También podés abrirlo a mano:  start ms-settings:network-mobilehotspot"
  exit 1
}

# Windows NO permite un hotspot sin clave: el minimo son 8 caracteres. Lo mas
# cerca de "sin contrasena" es una clave facil y grande en pantalla.
if ($Nombre -or $Clave) {
  $cfg = $g.GetCurrentAccessPointConfiguration()
  if ($Nombre) { $cfg.Ssid = $Nombre }
  if ($Clave) {
    if ($Clave.Length -lt 8) { Write-Output "  La clave necesita 8 caracteres o mas."; exit 1 }
    $cfg.Passphrase = $Clave
  }
  Write-Output "  Cambiando la configuracion del punto de acceso..."
  $op = $g.ConfigureAccessPointAsync($cfg)
  $limite = (Get-Date).AddSeconds(15)
  while ((Get-Date) -lt $limite) {
    $ahora = $g.GetCurrentAccessPointConfiguration()
    if ((-not $Nombre -or $ahora.Ssid -eq $Nombre) -and (-not $Clave -or $ahora.Passphrase -eq $Clave)) { break }
    Start-Sleep -Milliseconds 500
  }
}

if ($NoApagar) { Quitar-ApagadoAutomatico }

if ($Encender) {
  Quitar-ApagadoAutomatico
  if ($g.TetheringOperationalState -eq "On") {
    Write-Output "  Ya estaba encendido."
  } else {
    Write-Output "  Encendiendo el punto de acceso…"
    $op = $g.StartTetheringAsync()
    $limite = (Get-Date).AddSeconds(25)
    while ($g.TetheringOperationalState -ne "On" -and (Get-Date) -lt $limite) { Start-Sleep -Milliseconds 500 }
    if ($g.TetheringOperationalState -ne "On") {
      Write-Output ""
      Write-Output "  Windows no lo encendió (suele pasar cuando no hay internet que compartir)."
      Write-Output "  Usá el hotspot del teléfono, que es el plan que no falla. Ver LEEME.md."
      exit 1
    }
  }
} elseif ($Apagar) {
  Write-Output "  Apagando el punto de acceso…"
  $op = $g.StopTetheringAsync()
  Start-Sleep -Seconds 3
}

Mostrar $g
