/* ═══════════════════════════════════════════════════════════════════════
   grabar-demo.js — el video de demostración, con voz y música.

   Abre el estudio (la pantalla proyectada + dos teléfonos de verdad, todo
   en una sola imagen), representa una clase entera, captura cuadros, y al
   final FFmpeg junta:

     · los cuadros            → la imagen
     · herramientas/narracion → la voz (edge-tts, es-GT-MartaNeural)
     · assets/musica/…mp3     → la música, bajita y por debajo de la voz

   Cada paso dura LO QUE DURA SU NARRACIÓN: primero se mide el mp3 y después
   se captura ese tiempo, así el letrero de abajo y lo que se ve en pantalla
   van siempre con lo que se está diciendo. Si falta la narración (no se
   corrió generar-voz.js), se graba igual con tiempos fijos y sin audio.

   Uso:  node herramientas/grabar-demo.js [url] [fps]
         node herramientas/grabar-demo.js http://127.0.0.1:8123 12

   Antes:  node herramientas/generar-voz.js
   Sale en:  demostracion.mp4  (en la carpeta del proyecto)
   ═══════════════════════════════════════════════════════════════════════ */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const RUTA_PUPPETEER = "C:/Users/memit/OneDrive - Universidad del Istmo/" +
  "LEDKID-MARKETING/video-story-aprende/node_modules/puppeteer-core";
const CHROMES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  process.env.LOCALAPPDATA + "/Google/Chrome/Application/chrome.exe"
];
const BASE = (process.argv[2] && process.argv[2].startsWith("http")) ? process.argv[2] : "http://127.0.0.1:8123";
const FPS = parseInt(process.argv[3], 10) || 12;
const RAIZ = path.resolve(__dirname, "..");
const CUADROS = path.join(process.env.TEMP || __dirname, "demo-imperio-cuadros");
const SALIDA = path.join(RAIZ, "demostracion.mp4");
const MUSICA = path.join(RAIZ, "assets", "musica", "coro-de-marmol.mp3");
const VOCES = path.join(__dirname, "narracion");
const PASOS = require("./narracion.js");
const TOTAL = PASOS.length;
// una sala propia: si no, el video cuenta los teléfonos que alguien tenga abiertos
const SALA = "estudio" + Math.floor(Math.random() * 9000 + 1000);

/* ── la voz: cuánto dura cada paso ─────────────────────────────────── */
function duracionMp3(f) {
  try {
    return parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries",
      "format=duration", "-of", "default=nw=1:nk=1", f]).toString().trim());
  } catch (e) { return 0; }
}
const voces = PASOS.map((_, i) => path.join(VOCES, "p" + (i + 1) + ".mp3"))
                   .filter(f => fs.existsSync(f));
const HAY_VOZ = voces.length === TOTAL;
const DURA = HAY_VOZ ? voces.map(duracionMp3) : PASOS.map(() => 6);
if (!HAY_VOZ) console.log("(sin narración: corré antes  node herramientas/generar-voz.js)");

/* ── la captura ────────────────────────────────────────────────────── */
let n = 0, pag = null;
const arranques = [];                 // segundo de video en que empieza cada paso
async function capturar(segundos) {
  const cuantos = Math.max(1, Math.round(segundos * FPS));
  for (let i = 0; i < cuantos; i++)
    await pag.screenshot({ path: path.join(CUADROS, "f" + String(n++).padStart(5, "0") + ".png") });
}
async function rellenar(i) {          // completar lo que le falte al paso
  const falta = (DURA[i] + 0.55) - (n / FPS - arranques[i]);
  if (falta > 0.05) await capturar(falta);
}
function marca(i) { arranques[i] = n / FPS; }
const espera = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const puppeteer = require(RUTA_PUPPETEER);
  const chrome = CHROMES.find(p => fs.existsSync(p));
  if (!chrome) { console.log("No encuentro chrome.exe"); process.exit(2); }

  fs.rmSync(CUADROS, { recursive: true, force: true });
  fs.mkdirSync(CUADROS, { recursive: true });

  const navegador = await puppeteer.launch({
    executablePath: chrome, headless: "new", protocolTimeout: 40000,
    args: ["--no-sandbox", "--force-device-scale-factor=1", "--hide-scrollbars",
           "--autoplay-policy=no-user-gesture-required"]
  });
  pag = await navegador.newPage();
  await pag.setViewport({ width: 1600, height: 900 });
  console.log("Abriendo el estudio (sala " + SALA + ")…");
  await pag.goto(BASE + "/herramientas/estudio.html?s=" + SALA, { waitUntil: "domcontentloaded" });
  await pag.waitForFunction("window.Estudio && Estudio.pc().document.getElementById('txtEstado')", { timeout: 25000 });
  await espera(4500);

  const E = (js) => pag.evaluate(js);
  const paso = async (i) => {
    const p = PASOS[i];
    await E(`Estudio.paso(${i + 1}, ${TOTAL}, ${JSON.stringify(p.titulo)}, ${JSON.stringify(p.sub)})`);
    marca(i);
    console.log("  " + (i + 1) + "/" + TOTAL + " · " + p.titulo + " · " + DURA[i].toFixed(1) + " s");
  };
  const tocaTel = (k, veces) => E(`(function(){
    const d=Estudio.tel(${k}).document, cv=d.getElementById("latido");
    for(let i=0;i<${veces};i++) cv.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true}));
  })()`);
  const irA = async (escena) => {
    await E(`Estudio.pc().__ir(${escena})`);
    await espera(900);
  };

  // ── 1 · la pantalla que se proyecta ──
  await paso(0);
  await E(`Estudio.destacar("cajaPC")`);
  await capturar(3);
  await E(`Estudio.destacar(null)`);
  await rellenar(0);

  // ── 2 · los dos códigos ──
  await paso(1);
  await E(`Estudio.destacar("cajaPC")`);
  await capturar(3);
  await E(`Estudio.destacar(null)`);
  await rellenar(1);

  // ── 3 · entran los teléfonos ──
  await paso(2);
  await E(`Estudio.destacar("cajaT1")`);
  await capturar(2.2);
  await E(`Estudio.nombres(); Estudio.destacar("cajaT2")`);
  await capturar(2.2);
  await E(`Estudio.nombres(); Estudio.destacar(null)`);
  await rellenar(2);

  // ── 4 · la compu manda ──
  await paso(3);
  for (let k = 0; k < 2; k++) {
    await E(`Estudio.pc().document.getElementById("bAdelante").click()`);
    await espera(1100);
    await capturar(1.6);
  }
  await rellenar(3);

  // ── 5 · el pecado: cada quien apaga el suyo ──
  await irA(2);
  await paso(4);
  await capturar(1.6);
  await tocaTel(1, 1);
  await capturar(2.2);
  await tocaTel(2, 1);
  await capturar(2.4);
  await rellenar(4);

  // ── 6 · la luz, entre todos ──
  await irA(3);
  await paso(5);
  await E(`Estudio.tel(1).__sostiene(true)`);
  await capturar(3.4);
  await E(`Estudio.tel(2).__sostiene(true)`);
  await capturar(3.4);
  await E(`Estudio.tel(1).__sostiene(false); Estudio.tel(2).__sostiene(false)`);
  await rellenar(5);

  // ── 7 · los siete gestos ──
  await irA(6);
  await paso(6);
  await capturar(1.2);
  for (let k = 0; k < 7; k++) {
    await tocaTel(1, 1);
    if (k < 5) await tocaTel(2, 1);
    await capturar(0.55);
  }
  await rellenar(6);

  // ── 8 · la votación ──
  await irA(8);
  await paso(7);
  await capturar(1.8);
  await E(`Estudio.tel(1).document.getElementById("bEmperador").click()`);
  await capturar(1.8);
  await E(`Estudio.tel(2).document.getElementById("bFe").click()`);
  await capturar(2.4);
  await rellenar(7);

  // ── 9 · el cierre: el corazón entero de oro ──
  await irA(12);
  await paso(8);
  await E(`Estudio.nombres()`);
  await capturar(2.2);
  await E(`Estudio.destacar("cajaT1")`);
  await capturar(2.4);
  await E(`Estudio.destacar("cajaT2")`);
  await capturar(2.4);
  await E(`Estudio.destacar(null)`);
  await rellenar(8);

  await navegador.close();
  const duracion = n / FPS;
  console.log("Cuadros: " + n + " · " + duracion.toFixed(1) + " s · armando el video…");

  /* ── el montaje ──────────────────────────────────────────────────── */
  const mudo = path.join(CUADROS, "_mudo.mp4");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS),
    "-i", path.join(CUADROS, "f%05d.png"),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-movflags", "+faststart", mudo]);

  if (!HAY_VOZ) {
    fs.copyFileSync(mudo, SALIDA);
    console.log("Listo (sin audio): " + SALIDA);
    return;
  }
  // cada narración entra en el segundo en que empieza su paso; la música va
  // por debajo, bajita, y se apaga sola al final
  const args = ["-y", "-loglevel", "error", "-i", mudo];
  voces.forEach(f => args.push("-i", f));
  args.push("-stream_loop", "-1", "-i", MUSICA);
  const filtros = [];
  voces.forEach((_, i) => {
    const ms = Math.round(arranques[i] * 1000);
    filtros.push("[" + (i + 1) + ":a]adelay=" + ms + "|" + ms + ",volume=1.6[v" + i + "]");
  });
  const iMus = voces.length + 1;
  filtros.push("[" + iMus + ":a]volume=0.16,atrim=0:" + duracion.toFixed(2) +
               ",afade=t=in:st=0:d=2,afade=t=out:st=" + Math.max(0, duracion - 3).toFixed(2) + ":d=3[mus]");
  filtros.push(voces.map((_, i) => "[v" + i + "]").join("") + "[mus]amix=inputs=" +
               (voces.length + 1) + ":normalize=0:duration=longest[mez]");
  args.push("-filter_complex", filtros.join(";"),
    "-map", "0:v", "-map", "[mez]", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
    "-shortest", "-movflags", "+faststart", SALIDA);
  execFileSync("ffmpeg", args);

  const mb = (fs.statSync(SALIDA).size / 1048576).toFixed(1);
  console.log("Listo: " + SALIDA + "  (" + mb + " MB, " + Math.round(duracion) + " s, con voz y música)");
})();
