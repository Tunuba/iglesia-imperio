/* ═══════════════════════════════════════════════════════════════════════
   grabar-demo.js — el video para aprender a usar esto.

   Abre el estudio (la pantalla proyectada + dos teléfonos de verdad, todo en
   una sola imagen), representa una clase entera y va capturando cuadros;
   después FFmpeg los junta en un .mp4.

   Sin voces y sin música, a propósito: son rótulos en pantalla, así se puede
   ver en silencio y se entiende igual.

   Uso:  node herramientas/grabar-demo.js [url] [fps]
         node herramientas/grabar-demo.js http://127.0.0.1:8123 12

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
const TOTAL_PASOS = 9;

let n = 0, pag = null;
async function capturar(segundos) {
  const cuantos = Math.max(1, Math.round(segundos * FPS));
  for (let i = 0; i < cuantos; i++) {
    await pag.screenshot({ path: path.join(CUADROS, "f" + String(n++).padStart(5, "0") + ".png") });
  }
}
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
  console.log("Abriendo el estudio…");
  await pag.goto(BASE + "/herramientas/estudio.html", { waitUntil: "domcontentloaded" });
  await pag.waitForFunction("window.Estudio && Estudio.pc().document.getElementById('txtEstado')", { timeout: 20000 });
  await espera(4000);

  const E = (js) => pag.evaluate(js);

  // ── 1 · la pantalla que se proyecta ──
  await E(`Estudio.paso(1, ${TOTAL_PASOS}, "La presentación es la computadora", "Los trece momentos van acá, a pantalla completa. Los teléfonos acompañan.")`);
  await E(`Estudio.destacar("cajaPC")`);
  await E(`Estudio.nota("<b>Un solo comando:</b><br>arrancar.ps1<br><br>Enciende la red de la laptop, levanta el servidor y abre esta pantalla.<br><br>Con <b>H</b> se esconde la barra de abajo y queda sólo el visual.")`);
  await capturar(5);

  // ── 2 · los dos códigos ──
  await E(`Estudio.paso(2, ${TOTAL_PASOS}, "Dos códigos, en orden", "El primero mete el teléfono a la red de la laptop. El segundo abre la página.")`);
  await E(`Estudio.nota("No hace falta internet.<br>La computadora <b>es</b> la red: los teléfonos se conectan a ella.")`);
  await capturar(5);

  // ── 3 · entran los teléfonos ──
  await E(`Estudio.paso(3, ${TOTAL_PASOS}, "Escanean y entran", "En el teléfono: su personaje, su corazón y su pedazo del Credo. Nada más.")`);
  await E(`Estudio.nota(null); Estudio.destacar("cajaT1")`);
  await E(`Estudio.tel(1).location.href = "${BASE}/index.html?yo=1"`);
  await espera(2600);
  await E(`Estudio.nombres()`);
  await capturar(2.5);
  await E(`Estudio.destacar("cajaT2")`);
  await E(`Estudio.tel(2).location.href = "${BASE}/index.html?yo=2"`);
  await espera(2600);
  await E(`Estudio.nombres()`);
  await capturar(2.5);
  await E(`Estudio.destacar("cajaPC")`);
  await E(`Estudio.nota("En la pantalla grande aparecen ellos mismos: así se ve quién entró, sin preguntar.")`);
  await capturar(4);

  // ── 4 · la compu manda ──
  await E(`Estudio.paso(4, ${TOTAL_PASOS}, "La computadora manda", "Un toque en SIGUIENTE mueve la presentación y los teléfonos a la vez.")`);
  await E(`Estudio.nota(null); Estudio.destacar(null)`);
  for (let k = 0; k < 3; k++) {
    await E(`Estudio.pc().document.getElementById("bAdelante").click()`);
    await espera(1400);
    await capturar(2);
  }

  // ── 5 · la luz cooperativa: sólo uno sostiene ──
  await E(`Estudio.paso(5, ${TOTAL_PASOS}, "La luz se carga entre todos", "Si sólo la sostiene uno, la barra se queda a la mitad y no se abre.")`);
  await E(`Estudio.destacar("cajaT1")`);
  await E(`Estudio.tel(1).__sostiene(true)`);
  await capturar(6);
  await E(`Estudio.nota("La barra es el <b>promedio</b> de la sala.<br>Con la mitad sosteniendo se queda en 50 % y no se abre.")`);
  await capturar(4);

  // ── 6 · ahora los dos ──
  await E(`Estudio.paso(6, ${TOTAL_PASOS}, "Ahora sí, entre todos", "Cuando la sala colabora, la luz se completa y el corazón se limpia.")`);
  await E(`Estudio.nota(null); Estudio.destacar(null)`);
  await E(`Estudio.tel(2).__sostiene(true)`);
  await capturar(8);

  // ── 7 · la votación ──
  await E(`Estudio.pc().document.querySelectorAll("#bAdelante").forEach(b=>b.click())`);
  await espera(600);
  await E(`(function(){var p=Estudio.pc();for(var i=0;i<4;i++) p.document.getElementById("bAdelante").click();})()`);
  await espera(2200);
  await E(`Estudio.paso(7, ${TOTAL_PASOS}, "Cada quien elige", "Ofrecer incienso al emperador, o mantener la fe. El conteo sale en vivo.")`);
  await E(`Estudio.tel(1).document.getElementById("bEmperador").click()`);
  await espera(1200);
  await E(`Estudio.tel(2).document.getElementById("bFe").click()`);
  await espera(1800);
  await capturar(6);

  // ── 8 · el pedazo del Credo ──
  await E(`(function(){var p=Estudio.pc();for(var i=0;i<4;i++) p.document.getElementById("bAdelante").click();})()`);
  await espera(2000);
  await E(`Estudio.paso(8, ${TOTAL_PASOS}, "Cada quien tiene un pedazo", "El presentador lo lee en grande y ese teléfono se pone dorado y vibra.")`);
  await E(`Estudio.nombres()`);
  const pedazo = await pag.evaluate(`(function(){
    var t = Estudio.tel(1).document.getElementById("pedN").textContent;
    return parseInt(t.replace(/[^0-9]+/, ""), 10) - 1;
  })()`);
  await E(`Estudio.pc().document.querySelectorAll("#credos .p")[${pedazo}].click()`);
  await espera(1800);
  await E(`Estudio.destacar("cajaT1")`);
  await capturar(6);
  await E(`Estudio.pc().document.getElementById("credo").classList.remove("on")`);

  // ── 9 · lo que no se ve pero importa ──
  await E(`Estudio.paso(9, ${TOTAL_PASOS}, "Y si algo se cae, se levanta solo", "El punto de acceso se revisa cada 5 segundos, y una tarea de Windows cada minuto.")`);
  await E(`Estudio.destacar(null)`);
  await E(`Estudio.nota("Si el wifi de la laptop se apaga, vuelve solo.<br>Los teléfonos se reconectan sin tocar nada, y la página se pone al día con la escena en la que va la clase.")`);
  await capturar(7);

  await navegador.close();
  console.log("Cuadros: " + n + " · armando el video…");

  execFileSync("ffmpeg", ["-y", "-framerate", String(FPS),
    "-i", path.join(CUADROS, "f%05d.png"),
    "-vf", "format=yuv420p", "-c:v", "libx264", "-crf", "20", "-preset", "medium",
    "-movflags", "+faststart", SALIDA], { stdio: "inherit" });

  const mb = (fs.statSync(SALIDA).size / 1048576).toFixed(1);
  console.log("\nListo: " + SALIDA + "  (" + mb + " MB, " + (n / FPS).toFixed(0) + " s)");
  fs.rmSync(CUADROS, { recursive: true, force: true });
})();
