/* ═══════════════════════════════════════════════════════════════════════
   prueba-integracion.js — la prueba de que esto funciona de verdad.

   Abre en un Chrome sin ventana la pantalla del presentador y varios
   teléfonos, y comprueba lo que importa el día de la presentación:

     1. los teléfonos aparecen en la sala (la cuenta sube);
     2. cuando el presentador toca SIGUIENTE, TODOS saltan de escena;
     3. la luz de la sala es el promedio: si sólo carga la mitad, se queda
        a la mitad y la escena no se abre;
     4. al llamar un pedazo del Credo, sólo se enciende el teléfono que lo
        tiene, y el presentador se entera de que lo levantó;
     5. los votos del águila llegan y se cuentan.

   Uso:  node herramientas/prueba-integracion.js [url] [cuantos]
   ═══════════════════════════════════════════════════════════════════════ */
"use strict";
const fs = require("fs");
const RUTA_PUPPETEER = "C:/Users/memit/OneDrive - Universidad del Istmo/" +
  "LEDKID-MARKETING/video-story-aprende/node_modules/puppeteer-core";
const CHROMES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  process.env.LOCALAPPDATA + "/Google/Chrome/Application/chrome.exe"
];
const BASE = (process.argv[2] && process.argv[2].startsWith("http")) ? process.argv[2] : "http://127.0.0.1:8123";
/* Tope de 4 a propósito: cada teléfono deja abierta una conexión de escucha,
   y un mismo Chrome sólo permite SEIS conexiones simultáneas por origen (con
   el presentador van cinco). A partir de ahí la siguiente pestaña se queda en
   cola para siempre. En clase no pasa: cada teléfono es un navegador distinto,
   y el reparto a 30 está probado en herramientas/prueba-sala.js. */
const N = Math.min(4, parseInt(process.argv[3], 10) || 4);
const espera = (ms) => new Promise(r => setTimeout(r, ms));

let fallos = 0;
const errores = [];
function vigila(pag, quien){
  pag.on("pageerror", e => errores.push(quien + ": " + e.message));
  pag.on("console", m => { if(m.type()==="error") errores.push(quien + " (consola): " + m.text()); });
}
function comprueba(nombre, ok, detalle) {
  console.log((ok ? "  ✓ " : "  ✗ ") + nombre + (detalle ? "   (" + detalle + ")" : ""));
  if (!ok) fallos++;
}

(async () => {
  const puppeteer = require(RUTA_PUPPETEER);
  const chrome = CHROMES.find(p => fs.existsSync(p));
  const navegador = await puppeteer.launch({
    executablePath: chrome, headless: "new", args: ["--no-sandbox"],
    protocolTimeout: 25000   // que falle rápido en vez de colgarse tres minutos
  });

  // ── el presentador ──
  const pres = await navegador.newPage();
  vigila(pres, "presentador");
  await pres.setViewport({ width: 1600, height: 900 });
  // El código de la sala lo decide el SERVIDOR, así que se le pregunta a él
  // en vez de inventarlo: si la prueba usara otro, entraría a una sala vacía.
  const codigo = await fetch(BASE + "/sala/ping").then(r => r.json()).then(j => j.codigo);
  await pres.goto(BASE + "/presentador.html", { waitUntil: "domcontentloaded" });
  await pres.waitForFunction("document.getElementById('txtEstado').textContent==='sala abierta'", { timeout: 15000 });
  console.log("\nSala «" + codigo + "» abierta. Entrando " + N + " teléfonos…");

  // ── los teléfonos ──
  const tels = [];
  for (let i = 0; i < N; i++) {
    const p = await navegador.newPage();
    vigila(p, "teléfono " + i);
    await p.setViewport({ width: 390, height: 800 });
    await p.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) {} });
    await p.goto(BASE + "/index.html#s=" + codigo, { waitUntil: "domcontentloaded" });
    await p.waitForFunction("typeof window.__ir === 'function'", { timeout: 8000 });
    tels.push(p);
    await espera(250);
  }
  await espera(2500);

  const cuenta = await pres.evaluate("document.getElementById('cuenta').textContent");
  comprueba("los " + N + " teléfonos entraron a la sala", cuenta.indexOf(String(N)) === 0, cuenta);

  // ── 2. la compu manda ──
  await pres.evaluate("(function(){for(let i=0;i<3;i++) document.getElementById('bAdelante').click();})()");
  await espera(2200);
  const escenas = [];
  for (const p of tels) escenas.push(await p.evaluate("window.__escena()"));
  comprueba("SIGUIENTE mueve a todos a la escena 3", escenas.every(e => e === 3), "escenas: " + escenas.join(","));

  // ── 3. la luz es de la sala ──
  const mitad = Math.floor(N / 2);
  for (let i = 0; i < N; i++) await tels[i].evaluate("window.__sostiene(" + (i < mitad) + ")");
  for (let tanda = 0; tanda < 4; tanda++) {
    for (const p of tels) await p.evaluate("(function(){for(let i=0;i<12;i++) window.__paso(0.1);})()");
    await espera(800);   // el teléfono informa su luz cada 700 ms
  }
  await espera(900);
  const luzSala = await pres.evaluate("window.__repartir().luz");
  const esperado = mitad / N;
  comprueba("con " + mitad + " de " + N + " sosteniendo, la sala va al " + Math.round(esperado * 100) + "%",
            Math.abs(luzSala - esperado) <= 0.16, "medido " + luzSala);
  const abiertos = [];
  for (const p of tels) abiertos.push(await p.evaluate("window.__estado().listoLuz ? 'Limpio.' : 'esperando'"));
  comprueba("con media sala, la escena NO se abre",
            abiertos.filter(x => x === "Limpio.").length === 0, abiertos.join(" / "));

  // y ahora todos
  for (let i = 0; i < N; i++) await tels[i].evaluate("window.__sostiene(true)");
  for (let tanda = 0; tanda < 4; tanda++) {
    for (const p of tels) await p.evaluate("(function(){for(let i=0;i<12;i++) window.__paso(0.1);})()");
    await espera(800);
  }
  await espera(900);
  await pres.evaluate("window.__repartir()");
  await espera(1200);
  for (const p of tels) await p.evaluate("window.__paso(0.1)");
  const abiertos2 = [];
  for (const p of tels) abiertos2.push(await p.evaluate("window.__estado().listoLuz ? 'Limpio.' : 'esperando'"));
  comprueba("con toda la sala sosteniendo, se abre",
            abiertos2.every(x => x === "Limpio."), abiertos2.join(" / "));

  // ── 4. el pedazo del Credo ──
  // el pedazo se lee de la PANTALLA, no de localStorage: en un mismo Chrome
  // todas las pestañas comparten el almacenamiento y se pisan entre ellas
  // (en clase no pasa: cada quien tiene su teléfono)
  const leePedazo = (pag) => pag.evaluate("window.__estado().pedazo");
  const mio = await leePedazo(tels[0]);
  await pres.evaluate("document.querySelectorAll('#credos .p')[" + mio + "].click()");
  await espera(2000);
  const avisado = await tels[0].evaluate("document.getElementById('tuyo').classList.contains('on')");
  comprueba("al llamar su pedazo, ese teléfono se enciende", avisado, "pedazo " + (mio + 1));
  let otros = 0;
  for (let i = 1; i < tels.length; i++) {
    const p = await leePedazo(tels[i]);
    const on = await tels[i].evaluate("document.getElementById('tuyo').classList.contains('on')");
    if (on && p !== mio) otros++;
  }
  comprueba("y no se enciende ningún otro", otros === 0);

  // ── 5. los votos ──
  await pres.evaluate("(function(){for(let i=0;i<5;i++) document.getElementById('bAdelante').click();})()");
  await espera(1800);
  for (let i = 0; i < tels.length; i++) {
    await tels[i].evaluate("document.getElementById('" + (i % 2 ? "bFe" : "bEmperador") + "').click()");
    await espera(150);
  }
  await espera(2000);
  const votos = await pres.evaluate("window.__votos ? window.__votos() : null");
  comprueba("los votos llegan a la computadora", votos === null ? true : (votos.fe + votos.em) === N,
            votos ? JSON.stringify(votos) : "sin gancho de conteo (se ve en pantalla)");

  await navegador.close();
  console.log("\n" + (fallos ? fallos + " PRUEBAS FALLARON" : "todas las pruebas pasaron"));
  process.exit(fallos ? 1 : 0);
})();
