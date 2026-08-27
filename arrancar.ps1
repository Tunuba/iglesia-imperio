# ═══════════════════════════════════════════════════════════════════════
#  arrancar.ps1 — un solo clic para la presentación
#
#  1. levanta el servidor de la sala en esta computadora (sin ventana),
#  2. abre Chrome en la página del presentador,
#  3. imprime la dirección que van a usar los teléfonos.
#
#  Uso:   powershell -ExecutionPolicy Bypass -File arrancar.ps1
#         powershell -ExecutionPolicy Bypass -File arrancar.ps1 -Puerto 8080
#         powershell -ExecutionPolicy Bypass -File arrancar.ps1 -Parar
# ═══════════════════════════════════════════════════════════════════════
param(
  [int]$Puerto = 8080,
  [switch]$Parar
)

$ErrorActionPreference = "Stop"
$Aqui = Split-Path -Parent $MyInvocation.MyCommand.Path
$Servidor = Join-Path $Aqui "herramientas\servidor.js"
$Bandera = Join-Path $env:TEMP "iglesia-imperio-servidor.pid"

function Parar-Servidor {
  if (Test-Path $Bandera) {
    $pidGuardado = Get-Content $Bandera -ErrorAction SilentlyContinue
    if ($pidGuardado) {
      try { Stop-Process -Id ([int]$pidGuardado) -Force -ErrorAction Stop; Write-Output "  Servidor detenido." }
      catch { Write-Output "  (el servidor ya no estaba corriendo)" }
    }
    Remove-Item $Bandera -ErrorAction SilentlyContinue
  } else {
    Write-Output "  No hay servidor anotado. Si quedó uno suelto: Get-Process node | Stop-Process"
  }
}

if ($Parar) { Parar-Servidor; exit 0 }

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Output "  Falta Node.js. Bajalo de nodejs.org (o usá la version publicada en internet)."
  exit 1
}

# ESTA COMPUTADORA ES LA RED. Se enciende su punto de acceso para que los
# telefonos se conecten a ella y no a un router: asi la sala funciona sin
# internet y sin depender del wifi del salon. Con -SinHotspot no se toca.
if (-not $SinHotspot) {
  $hs = Join-Path $Aqui "herramientas\hotspot.ps1"
  if (Test-Path $hs) {
    try { & $hs -Nombre "IMPERIO" -Clave "12345678" -Encender | Out-Null }
    catch { Write-Output "  (no se pudo encender el punto de acceso; se sigue igual)" }
  }
}

Parar-Servidor | Out-Null

# Sin ventana: el servidor corre de fondo y no molesta durante la presentacion
# La ruta lleva espacios ("OneDrive - Universidad del Istmo"): sin comillas,
# node recibe la ruta partida en pedazos y el servidor no arranca nunca.
$proceso = Start-Process -FilePath "node" -ArgumentList (@("`"$Servidor`"", "$Puerto") + $(if ($SinHotspot) { @() } else { @("--hotspot") })) `
                         -WorkingDirectory $Aqui -WindowStyle Hidden -PassThru
Set-Content -Path $Bandera -Value $proceso.Id -Encoding ascii
Start-Sleep -Seconds 2

# El servidor se corre de puerto si el que pedimos esta ocupado (el 8080 es de
# XAMPP/GLPI en esta maquina). Se le pregunta cual agarro, en vez de suponerlo.
$puertoReal = $null
foreach ($p in $Puerto..($Puerto + 12)) {
  try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:$p/sala/ping" -TimeoutSec 2 -UseBasicParsing
    if ($r.Content -like "*`"sala`":true*") { $puertoReal = $p; break }
  } catch { }
}
if ($puertoReal) { $Puerto = $puertoReal }
else { Write-Output "  (no respondio el servidor; revisa que Node este instalado)" }

# Direcciones reales de esta computadora (las que sirven para un telefono)
$ips = @()
foreach ($a in (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue)) {
  if ($a.IPAddress -ne "127.0.0.1" -and $a.InterfaceAlias -notlike "*Loopback*") { $ips += $a.IPAddress }
}
$preferida = $ips | Where-Object { $_ -like "192.168.*" } | Select-Object -First 1
if (-not $preferida) { $preferida = $ips | Select-Object -First 1 }
if (-not $preferida) { $preferida = "127.0.0.1" }

$urlPresentador = "http://$preferida`:$Puerto/presentador.html"

Write-Output ""
Write-Output "  LA SALA ESTA ABIERTA"
Write-Output "  --------------------"
Write-Output "  Proyecta esto      : $urlPresentador"
Write-Output "  Los telefonos van a: http://$preferida`:$Puerto/index.html"
Write-Output ""
if (-not $SinHotspot) {
  Write-Output "  ESTA COMPUTADORA ES LA RED: que se conecten al wifi IMPERIO (clave 12345678)."
  Write-Output "  En esa red, esta compu es la 192.168.137.1"
  Write-Output ""
}
Write-Output "  El QR de la pantalla ya lleva esa direccion; nadie tiene que escribirla."
Write-Output "  Si Windows pregunta por el firewall: permitir REDES PRIVADAS."
Write-Output "  Para parar todo:  powershell -ExecutionPolicy Bypass -File arrancar.ps1 -Parar"
Write-Output ""

# Chrome con la pagina del presentador (si no esta, abre el navegador por defecto)
$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($chrome) { Start-Process $chrome -ArgumentList $urlPresentador }
else { Start-Process $urlPresentador }
