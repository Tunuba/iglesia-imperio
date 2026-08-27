# ═══════════════════════════════════════════════════════════════════════
#  instalar-vigilante.ps1 — deja el punto de acceso encendido PARA SIEMPRE.
#
#  Registra una tarea de Windows que revisa el hotspot cada minuto, aunque
#  no esté abierta la presentación, aunque se cierre todo y aunque se
#  reinicie la computadora. Es la red de seguridad de más abajo: el servidor
#  ya lo vigila cada 8 segundos mientras corre, esto cubre el resto del día.
#
#  Uso:
#     powershell -ExecutionPolicy Bypass -File instalar-vigilante.ps1
#     powershell -ExecutionPolicy Bypass -File instalar-vigilante.ps1 -Quitar
#
#  No abre ninguna ventana. Para ver si está puesta:
#     Get-ScheduledTask -TaskName "IMPERIO-hotspot"
# ═══════════════════════════════════════════════════════════════════════
param([switch]$Quitar)

$ErrorActionPreference = "Stop"
$NOMBRE = "IMPERIO-hotspot"
$Aqui = Split-Path -Parent $MyInvocation.MyCommand.Path
$Vigilante = Join-Path $Aqui "vigilante.ps1"

if ($Quitar) {
  try {
    Unregister-ScheduledTask -TaskName $NOMBRE -Confirm:$false -ErrorAction Stop
    Write-Output "  Tarea «$NOMBRE» quitada."
  } catch { Write-Output "  No estaba puesta." }
  exit 0
}

if (-not (Test-Path $Vigilante)) { Write-Output "  Falta vigilante.ps1"; exit 1 }

$accion = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument ('-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + $Vigilante + '" -UnaVez')

# al iniciar sesión y, además, cada minuto sin parar
$t1 = New-ScheduledTaskTrigger -AtLogOn
$t2 = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) `
        -RepetitionInterval (New-TimeSpan -Minutes 1) -RepetitionDuration (New-TimeSpan -Days 3650)   # 'para siempre': MaxValue lo rechaza

$ajustes = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 3)

try {
  Register-ScheduledTask -TaskName $NOMBRE -Action $accion -Trigger @($t1, $t2) `
    -Settings $ajustes -Description "Mantiene encendido el punto de acceso IMPERIO" -Force -ErrorAction Stop | Out-Null
} catch {
  Write-Output "  No se pudo registrar la tarea: $($_.Exception.Message)"
  Write-Output "  (proba abriendo PowerShell como administrador)"
  exit 1
}

# no se anuncia el exito sin comprobarlo: antes decia "listo" aunque fallara
$puesta = Get-ScheduledTask -TaskName $NOMBRE -ErrorAction SilentlyContinue
if ($puesta) {
  Write-Output "  Listo: la tarea $NOMBRE revisa el punto de acceso cada minuto."
  Write-Output "  Estado: $($puesta.State)"
  Write-Output "  Para quitarla:  powershell -ExecutionPolicy Bypass -File instalar-vigilante.ps1 -Quitar"
} else {
  Write-Output "  La tarea NO quedo registrada."
  exit 1
}
