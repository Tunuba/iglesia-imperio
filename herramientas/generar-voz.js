/* ═══════════════════════════════════════════════════════════════════
   generar-voz.js — la narración del video, en local y gratis.

   Usa edge-tts con la MISMA voz de la academia: es-GT-MartaNeural,
   acento guatemalteco, un pelín más rápida y más aguda que el default
   (rate +8%, pitch +3Hz), que es lo que la hace sonar despierta en vez
   de plana.

     node herramientas/generar-voz.js

   Deja herramientas/narracion/p1.mp3 … p9.mp3 y un narracion.json con
   la duración de cada uno, que es lo que usa el grabador para darle a
   cada paso el tiempo que la voz necesita.
   ═══════════════════════════════════════════════════════════════════ */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const PASOS = require("./narracion.js");
const SALIDA = path.join(__dirname, "narracion");
const VOZ = "es-GT-MartaNeural", RATE = "+8%", PITCH = "+3Hz";

// El .exe de edge-tts está junto al Python del usuario, no en el PATH de
// todas las consolas. Se prueban los sitios donde vive.
const CANDIDATOS = [
  "edge-tts",
  path.join(process.env.LOCALAPPDATA || "", "Programs/Python/Python313/Scripts/edge-tts.exe"),
  path.join(process.env.LOCALAPPDATA || "", "Programs/Python/Python312/Scripts/edge-tts.exe"),
  path.join(process.env.APPDATA || "", "Python/Python313/Scripts/edge-tts.exe")
];
function edgeTTS(args) {
  let ultimo = null;
  for (const exe of CANDIDATOS) {
    try { return execFileSync(exe, args, { stdio: ["ignore", "pipe", "pipe"] }); }
    catch (e) { ultimo = e; }
  }
  throw ultimo;
}
function duracion(mp3) {
  const s = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
    "-of", "default=nw=1:nk=1", mp3]).toString().trim();
  return Math.round(parseFloat(s) * 1000) / 1000;
}

fs.mkdirSync(SALIDA, { recursive: true });
const meta = [];
PASOS.forEach((p, i) => {
  const destino = path.join(SALIDA, "p" + (i + 1) + ".mp3");
  edgeTTS(["--voice", VOZ, "--rate=" + RATE, "--pitch=" + PITCH,
           "--text", p.voz, "--write-media", destino]);
  const d = duracion(destino);
  meta.push({ paso: i + 1, mp3: path.basename(destino), segundos: d, voz: p.voz });
  console.log("  " + (i + 1) + " · " + d.toFixed(1) + " s · " + p.titulo);
});
fs.writeFileSync(path.join(SALIDA, "narracion.json"), JSON.stringify(meta, null, 2), "utf8");
const total = meta.reduce((a, m) => a + m.segundos, 0);
console.log("\nListo: " + meta.length + " pistas, " + total.toFixed(1) + " s de voz en total.");
