/* ═══════════════════════════════════════════════════════════════════════
   comprobar-pantalla.js — el verificador de la presentación.

   Abre las dos páginas en un Chrome sin ventana y, escena por escena:

     1. mide TODOS los elementos de la pantalla y avisa si dos se solapan
        o si alguno se sale del teléfono;
     2. mide lo que se dibuja DENTRO del lienzo (la figura, el corazón, la
        barra) usando las cajas que cada escena declara, y avisa igual;
     3. guarda una captura de cada escena en herramientas/pruebas/capturas.

   Nació porque a ojo no se ve: el personaje se salía del lienzo por la
   derecha y parecía correcto en la captura.

   Uso:  node herramientas/comprobar-pantalla.js [url] [--fotos]
         node herramientas/comprobar-pantalla.js http://127.0.0.1:8081
   ═══════════════════════════════════════════════════════════════════════ */
"use strict";
const fs = require("fs");
const path = require("path");

const RUTA_PUPPETEER = "C:/Users/memit/OneDrive - Universidad del Istmo/" +
  "LEDKID-MARKETING/video-story-aprende/node_modules/puppeteer-core";
const CHROMES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  process.env.LOCALAPPDATA + "/Google/Chrome/Application/chrome.exe"
];

const BASE = (process.argv[2] && process.argv[2].startsWith("http")) ? process.argv[2] : "http://127.0.0.1:8081";
const FOTOS = process.argv.includes("--fotos");
const SALIDA = path.join(__dirname, "pruebas", "capturas");
const TAMANOS = [
  { nombre: "telefono-390x800", w: 390, h: 800 },
  { nombre: "telefono-360x640", w: 360, h: 640 }   // el caso apretado
];

/* Lo que corre DENTRO de la página: mide solapes y desbordes. */
function medidor() {
  window.__medir = function () {
    const vp = { w: innerWidth, h: innerHeight };
    // el teléfono ya no tiene "escenas": es una sola pantalla que cambia
    const sec = document.querySelector("main") || document;
    const nodos = Array.prototype.slice.call(document.querySelectorAll(
      "header .marca, header .pasos, footer > *, main > *"));
    const items = nodos.map(function (n) {
      return { n: n, r: n.getBoundingClientRect(),
               id: (n.id || String(n.className).split(" ")[0] || n.tagName) };
    }).filter(function (o) { return o.r.width > 0 && o.r.height > 0; });

    const solapes = [], fuera = [];
    for (let i = 0; i < items.length; i++) {
      const A = items[i];
      if (A.r.bottom > vp.h + 1 || A.r.right > vp.w + 1 || A.r.top < -1 || A.r.left < -1)
        fuera.push(A.id + " [" + Math.round(A.r.left) + "," + Math.round(A.r.top) +
                   " → " + Math.round(A.r.right) + "," + Math.round(A.r.bottom) + "]");
      for (let j = i + 1; j < items.length; j++) {
        const B = items[j];
        if (A.n.contains(B.n) || B.n.contains(A.n)) continue;
        const ov = Math.max(0, Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left))
                 * Math.max(0, Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top));
        if (ov > 1) solapes.push(A.id + " × " + B.id + " = " + Math.round(ov) + "px²");
      }
    }

    // y ahora lo de adentro del lienzo
    const dibujo = [];
    const cv = document.getElementById("latido");
    if (cv && window.__cajas) {
      const cajas = window.__cajas();
      for (let i = 0; i < cajas.length; i++) {
        const b = cajas[i];
        if (b.x < -1 || b.y < -1 || b.x + b.w > cv.width + 1 || b.y + b.h > cv.height + 1)
          dibujo.push(b.id + " se sale del lienzo");
        for (let j = i + 1; j < cajas.length; j++) {
          const c = cajas[j];
          const ov = Math.max(0, Math.min(b.x + b.w, c.x + c.w) - Math.max(b.x, c.x))
                   * Math.max(0, Math.min(b.y + b.h, c.y + c.h) - Math.max(b.y, c.y));
          if (ov > 4) dibujo.push(b.id + " pisa a " + c.id + " (" + Math.round(ov) + "px²)");
        }
      }
    }
    return { solapes: solapes, fuera: fuera, dibujo: dibujo };
  };
}

(async () => {
  let puppeteer;
  try { puppeteer = require(RUTA_PUPPETEER); }
  catch (e) { console.log("No encuentro puppeteer-core en:\n  " + RUTA_PUPPETEER); process.exit(2); }
  const chrome = CHROMES.find(function (p) { return fs.existsSync(p); });
  if (!chrome) { console.log("No encuentro chrome.exe"); process.exit(2); }
  if (FOTOS) fs.mkdirSync(SALIDA, { recursive: true });

  const navegador = await puppeteer.launch({
    executablePath: chrome, headless: "new",
    args: ["--no-sandbox", "--disable-lcd-text", "--force-device-scale-factor=2"]
  });

  let fallos = 0, revisadas = 0;
  for (const t of TAMANOS) {
    const pag = await navegador.newPage();
    await pag.setViewport({ width: t.w, height: t.h, deviceScaleFactor: 2 });
    await pag.evaluateOnNewDocument(medidor);
    await pag.goto(BASE + "/index.html", { waitUntil: "domcontentloaded" });
    await pag.waitForFunction("typeof window.__ir === 'function'", { timeout: 8000 });
    const cuantas = 13;
    console.log("\n── " + t.nombre + " · " + cuantas + " escenas ──");
    for (let e = 0; e < cuantas; e++) {
      await pag.evaluate("window.__ir(" + e + ")");
      await new Promise(r => setTimeout(r, 320));
      const r = await pag.evaluate("window.__medir()");
      revisadas++;
      const problemas = r.solapes.concat(r.fuera.map(x => "fuera: " + x))
                                .concat(r.dibujo.map(x => "dibujo: " + x));
      if (problemas.length) {
        fallos++;
        console.log("  ✗ escena " + e + ":");
        problemas.slice(0, 4).forEach(p => console.log("      " + p));
      } else {
        console.log("  ✓ escena " + e);
      }
      if (FOTOS) await pag.screenshot({ path: path.join(SALIDA, t.nombre + "-e" + e + ".png") });
    }
    await pag.close();
  }

  // la pantalla del presentador, en dos resoluciones de proyector
  for (const t of [{ nombre: "proyector-1920x1080", w: 1920, h: 1080 },
                   { nombre: "proyector-1366x768", w: 1366, h: 768 }]) {
    const pag = await navegador.newPage();
    await pag.setViewport({ width: t.w, height: t.h, deviceScaleFactor: 1 });
    await pag.goto(BASE + "/presentador.html", { waitUntil: "domcontentloaded" });
    await new Promise(r => setTimeout(r, 2500));
    const r = await pag.evaluate(`(function(){
      const items=[...document.querySelectorAll('.tarjeta > *, .unQR > *, header .estado, footer .fila > *')]
        .map(x=>({n:x, r:x.getBoundingClientRect(), id:x.id||String(x.className).split(' ')[0]||x.tagName}))
        .filter(o=>o.r.width>0&&o.r.height>0);
      const sol=[], fuera=[];
      for(let i=0;i<items.length;i++){
        const A=items[i];
        if(A.r.bottom>innerHeight+1||A.r.right>innerWidth+1) fuera.push(A.id);
        for(let j=i+1;j<items.length;j++){
          const B=items[j];
          if(A.n.contains(B.n)||B.n.contains(A.n)) continue;
          const ov=Math.max(0,Math.min(A.r.right,B.r.right)-Math.max(A.r.left,B.r.left))
                 * Math.max(0,Math.min(A.r.bottom,B.r.bottom)-Math.max(A.r.top,B.r.top));
          if(ov>2) sol.push(A.id+' × '+B.id+' = '+Math.round(ov));
        }
      }
      return {solapes:sol, fuera:fuera};
    })()`);
    revisadas++;
    console.log("\n── " + t.nombre + " ──");
    if (r.solapes.length || r.fuera.length) {
      fallos++;
      r.solapes.slice(0, 5).forEach(p => console.log("  ✗ " + p));
      r.fuera.slice(0, 5).forEach(p => console.log("  ✗ fuera de pantalla: " + p));
    } else console.log("  ✓ sin solapes ni desbordes");
    if (FOTOS) await pag.screenshot({ path: path.join(SALIDA, t.nombre + ".png") });
    await pag.close();
  }

  await navegador.close();
  console.log("\n" + revisadas + " pantallas revisadas · " +
              (fallos ? fallos + " CON PROBLEMAS" : "todas limpias"));
  process.exit(fallos ? 1 : 0);
})();
