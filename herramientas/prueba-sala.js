/* Prueba de reparto: ¿aguanta la computadora mandarle a muchos teléfonos?
   Levanta N oyentes contra el servidor (como si fueran N celulares), manda
   mensajes desde "el presentador" y mide cuántos llegan y en cuánto tiempo.

   Uso:  node herramientas/prueba-sala.js [url] [cuantos]
         node herramientas/prueba-sala.js http://127.0.0.1:8095 30          */
"use strict";
const BASE = process.argv[2] || "http://127.0.0.1:8095";
const N = parseInt(process.argv[3], 10) || 30;
const TEMA = "iglesia-imperio-prueba" + (Date.now() % 1000);
const local = !/ntfy/.test(BASE);
const urlSSE = local ? `${BASE}/sala/sse?t=${TEMA}` : `${BASE}/${TEMA}/sse`;
const urlPub = local ? `${BASE}/sala/enviar?t=${TEMA}` : `${BASE}/${TEMA}`;

// Node no trae EventSource global en todas las versiones: lector SSE mínimo.
const http = require("http"), https = require("https");
const NL = String.fromCharCode(10), SEP = NL + NL;
function escucha(url, alMensaje, alAbrir) {
  const mod = url.startsWith("https") ? https : http;
  const req = mod.get(url, { headers: { Accept: "text/event-stream" } }, (res) => {
    alAbrir();
    let buf = "";
    res.setEncoding("utf8");
    res.on("data", (c) => {
      buf += c;
      let i;
      while ((i = buf.indexOf(SEP)) >= 0) {
        const bloque = buf.slice(0, i); buf = buf.slice(i + 2);
        bloque.split(NL).forEach((l) => {
          if (l.startsWith("data:")) alMensaje(l.slice(5).trim());
        });
      }
    });
  });
  req.on("error", () => {});
  return { close: () => req.destroy() };
}

const recibidos = [];      // {telefono, n, ms}
const abiertos = new Set();
let mandadoEn = 0;

function telefono(i) {
  return escucha(urlSSE, (datos) => {
    let sobre; try { sobre = JSON.parse(datos); } catch (e) { return; }
    if (sobre.event === "open") { abiertos.add(i); return; }
    if (sobre.event !== "message") return;
    let m; try { m = JSON.parse(sobre.message); } catch (e) { return; }
    if (m.t === "escena") recibidos.push({ telefono: i, n: m.n, ms: Date.now() - mandadoEn });
  }, () => abiertos.add(i));
}

(async () => {
  console.log(`Abriendo ${N} "teléfonos" contra ${BASE} …`);
  const conexiones = [];
  for (let i = 0; i < N; i++) { conexiones.push(telefono(i)); await new Promise(r => setTimeout(r, 25)); }
  await new Promise(r => setTimeout(r, 2500));
  console.log(`Conectados: ${abiertos.size}/${N}`);

  for (const escena of [3, 5, 7]) {
    recibidos.length = 0;
    mandadoEn = Date.now();
    await fetch(urlPub, { method: "POST", body: JSON.stringify({ t: "escena", n: escena }),
                          headers: { "Content-Type": "text/plain" } });
    await new Promise(r => setTimeout(r, local ? 900 : 2500));
    const ms = recibidos.map(r => r.ms);
    const ok = recibidos.filter(r => r.n === escena).length;
    console.log(`  escena ${escena} → llegó a ${ok}/${N}` +
      (ms.length ? `  ·  ${Math.min(...ms)}–${Math.max(...ms)} ms (promedio ${Math.round(ms.reduce((a, b) => a + b, 0) / ms.length)} ms)` : ""));
  }
  conexiones.forEach(c => c.close());
  console.log("Listo.");
  process.exit(0);
})();
