/* ═══════════════════════════════════════════════════════════════════════
   servidor.js — la computadora como centro de la sala.

   Hace dos cosas a la vez, sin instalar NADA (Node puro, cero dependencias):
     1. sirve la carpeta del proyecto por HTTP, para que los teléfonos abran
        la página desde la laptop;
     2. reparte los mensajes del presentador a todos los teléfonos conectados
        (SSE), que es lo que hace que un toque en la compu mueva 30 pantallas.

   Por qué existe: en la red de la universidad no se puede levantar un túnel
   (el 7844 está bloqueado y argotunnel lo resetean), y los servicios públicos
   pueden estar filtrados. Si la compu y los teléfonos se ven en la misma red
   —o si la laptop levanta su propio hotspot— esto funciona SIN INTERNET.

   Uso:
       node servidor.js [puerto]
   Imprime las direcciones y un QR en la propia terminal.

   Si Windows pregunta por el firewall: hay que permitir "Redes privadas",
   o los teléfonos no van a poder entrar.
   ═══════════════════════════════════════════════════════════════════════ */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");
const QR = require(path.join(__dirname, "..", "assets", "qr.js"));

const RAIZ = path.resolve(__dirname, "..");
const PUERTO = parseInt(process.argv[2], 10) || 8123;

const TIPOS = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8", ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8", ".md": "text/plain; charset=utf-8"
};

// ── el nombre del WiFi ────────────────────────────────────────────────
// La pantalla del presentador lo muestra para que la gente sepa a qué red
// conectarse ANTES de escanear el QR: si el teléfono no está en la misma red,
// el QR abre una dirección que no existe para él.
let redes = [];          // el WiFi al que está conectada la compu
let hotspot = null;      // { encendido, ssid, clave } si la compu ES el punto de acceso

function leeRedes() {
  execFile("netsh", ["wlan", "show", "interfaces"], { windowsHide: true }, (err, salida) => {
    if (err || !salida) return;
    const out = [];
    salida.split(/\r?\n/).forEach((l) => {
      if (/^\s*BSSID/i.test(l)) return;
      const m = l.match(/^\s*SSID\s*:\s*(.+?)\s*$/i);
      if (m && m[1]) out.push(m[1]);
    });
    redes = Array.from(new Set(out));
  });
}

// El nombre del hotspot NO sale en netsh (el "hosted network" viejo está muerto):
// hay que preguntárselo a la misma API de Windows que usa Configuración.
const PS_HOTSPOT = [
  "[Windows.Networking.Connectivity.NetworkInformation,Windows.Networking.Connectivity,ContentType=WindowsRuntime]|Out-Null",
  "[Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager,Windows.Networking.NetworkOperators,ContentType=WindowsRuntime]|Out-Null",
  "$p=[Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile()",
  "if($null -eq $p){ foreach($q in [Windows.Networking.Connectivity.NetworkInformation]::GetConnectionProfiles()){ if($q.NetworkAdapter){ $p=$q; break } } }",
  "$g=[Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager]::CreateFromConnectionProfile($p)",
  "$c=$g.GetCurrentAccessPointConfiguration()",
  "Write-Output ($g.TetheringOperationalState.ToString()+'|'+$c.Ssid+'|'+$c.Passphrase)"
].join(";");

function leeHotspot() {
  execFile("powershell", ["-NoProfile", "-NonInteractive", "-Command", PS_HOTSPOT],
    { windowsHide: true, timeout: 6000 }, (err, salida) => {
      if (err || !salida) return;
      const t = String(salida).trim().split("|");
      if (t.length < 2) return;
      hotspot = { encendido: /^on$/i.test(t[0]), ssid: t[1], clave: t[2] || "" };
    });
}

leeRedes(); leeHotspot();
setInterval(leeHotspot, 20000);
setInterval(leeRedes, 15000);   // por si encienden el hotspot a medio camino

// ── la sala: quién está escuchando y qué se dijo ──────────────────────
const oyentes = new Map();     // tema -> Set(respuesta)
const historial = new Map();   // tema -> [envoltura]
let contador = 0;

function tema(url) {
  const t = new URL(url, "http://x").searchParams.get("t") || "sala";
  return t.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) || "sala";
}
function difunde(t, mensaje) {
  const sobre = { id: "m" + (++contador), time: Math.floor(Date.now() / 1000),
                  event: "message", topic: t, message: mensaje };
  const linea = "data: " + JSON.stringify(sobre) + "\n\n";
  const h = historial.get(t) || [];
  h.push(sobre);
  if (h.length > 120) h.shift();
  historial.set(t, h);
  const s = oyentes.get(t);
  if (s) for (const res of s) { try { res.write(linea); } catch (e) {} }
  return s ? s.size : 0;
}

function cabecerasCORS(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
}

const servidor = http.createServer((req, res) => {
  cabecerasCORS(res);
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  const ruta = decodeURIComponent(req.url.split("?")[0]);

  // ── el canal ──
  if (ruta === "/sala/ping") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({
      sala: true,
      puerto: (servidor.address() || {}).port || PUERTO,
      // las direcciones de esta compu en la red: la página del presentador las
      // usa para que el QR NUNCA diga 127.0.0.1 (un teléfono no puede entrar ahí)
      ips: direcciones().map((d) => d.ip),
      redes: redes,
      hotspot: hotspot,
      oyentes: [...oyentes.values()].reduce((a, s) => a + s.size, 0)
    }));
  }

  // Sondas que usan los teléfonos para saber si el wifi "tiene internet".
  // Si el teléfono llega hasta acá, se le contesta con un empujón a la página.
  // (No siempre se dispara: depende de a qué DNS pregunte el teléfono. El QR
  //  sigue siendo el camino seguro.)
  if (["/generate_204", "/gen_204", "/hotspot-detect.html", "/ncsi.txt",
       "/connecttest.txt", "/library/test/success.html"].indexOf(ruta) >= 0) {
    res.writeHead(302, { "Location": "/index.html", "Cache-Control": "no-store" });
    return res.end();
  }
  if (ruta === "/sala/sse") {
    const t = tema(req.url);
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive", "X-Accel-Buffering": "no"
    });
    res.write("data: " + JSON.stringify({ event: "open", topic: t }) + "\n\n");
    if (!oyentes.has(t)) oyentes.set(t, new Set());
    oyentes.get(t).add(res);
    const latido = setInterval(() => { try { res.write(": latido\n\n"); } catch (e) {} }, 20000);
    req.on("close", () => { clearInterval(latido); const s = oyentes.get(t); if (s) s.delete(res); });
    return;
  }
  if (ruta === "/sala/enviar" && req.method === "POST") {
    const t = tema(req.url);
    let cuerpo = "";
    req.on("data", (c) => { cuerpo += c; if (cuerpo.length > 8000) req.destroy(); });
    req.on("end", () => {
      const n = difunde(t, cuerpo);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, entregado: n }));
    });
    return;
  }
  if (ruta === "/sala/recientes") {
    const t = tema(req.url);
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end((historial.get(t) || []).map((s) => JSON.stringify(s)).join("\n"));
  }

  // ── archivos ──
  let rel = ruta === "/" ? "/presentador.html" : ruta;
  const destino = path.join(RAIZ, path.normalize(rel).replace(/^([\\/])+/, ""));
  if (!destino.startsWith(RAIZ)) { res.writeHead(403); return res.end("fuera de la carpeta"); }
  fs.readFile(destino, (err, datos) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
               return res.end("no existe: " + rel); }
    // no-store, no no-cache: con "no-cache" Chrome siguió sirviendo el .js
    // viejo después de editarlo, y se pierde media hora buscando un fantasma.
    res.writeHead(200, { "Content-Type": TIPOS[path.extname(destino).toLowerCase()] || "application/octet-stream",
                         "Cache-Control": "no-store, must-revalidate" });
    res.end(datos);
  });
});

// ── arranque: direcciones y QR en la terminal ─────────────────────────
function direcciones() {
  const out = [];
  const nets = os.networkInterfaces();
  for (const nombre of Object.keys(nets)) {
    for (const n of nets[nombre] || []) {
      if (n.family === "IPv4" && !n.internal) out.push({ nombre, ip: n.address });
    }
  }
  return out;
}
function qrTerminal(texto) {
  const m = QR.matriz(texto);
  const lineas = [];
  const blanco = "██", negro = "  ";     // invertido: el fondo claro es el "papel"
  const borde = 2;
  const fila = (f) => {
    let s = "";
    for (let i = 0; i < borde; i++) s += blanco;
    for (let x = 0; x < m.length; x++) s += (f[x] ? negro : blanco);
    for (let i = 0; i < borde; i++) s += blanco;
    return s;
  };
  const vacia = new Array(m.length).fill(0);
  for (let i = 0; i < borde; i++) lineas.push(fila(vacia));
  for (let y = 0; y < m.length; y++) lineas.push(fila(m[y]));
  for (let i = 0; i < borde; i++) lineas.push(fila(vacia));
  return lineas.join("\n");
}

function arranca(puerto) {
  // listen() deja su callback como oyente de "listening"; si el primer intento
  // falló, ese callback sigue ahí y al conectar el segundo puerto se imprime
  // DOS veces, con el puerto equivocado en una de ellas.
  servidor.removeAllListeners("listening");
  servidor.listen(puerto, "0.0.0.0", () => {
  const ips = direcciones();
  const principal = ips.length ? ips[0].ip : "127.0.0.1";
  const urlPresentador = "http://" + principal + ":" + puerto + "/presentador.html";
  console.log("\n  LA COMPUTADORA YA ES EL CENTRO DE LA SALA");
  console.log("  ─────────────────────────────────────────");
  console.log("  Presentador (esta compu):  http://localhost:" + puerto + "/presentador.html");
  ips.forEach((d) => console.log("  Teléfonos (" + d.nombre + "):".padEnd(28) +
                                 "http://" + d.ip + ":" + puerto + "/index.html"));
  console.log("\n  El QR de la página del presentador ya lleva la dirección correcta.");
  console.log("  Si Windows pregunta por el firewall: permitir REDES PRIVADAS.\n");
  try { console.log(qrTerminal(urlPresentador)); } catch (e) {}
  console.log("\n  (Ctrl+C para parar)\n");
  });
}

// Si el puerto está ocupado (XAMPP y GLPI viven en el 8080), se prueba el
// siguiente en vez de morir con un EADDRINUSE que nadie va a leer en clase.
let puertoActual = PUERTO, intentosRestantes = 12;
servidor.on("error", (e) => {
  if (e.code === "EADDRINUSE" && intentosRestantes > 0) {
    intentosRestantes--;
    puertoActual++;
    console.log("  (el " + (puertoActual - 1) + " está ocupado, probando el " + puertoActual + ")");
    setTimeout(() => arranca(puertoActual), 150);
  } else {
    console.log("  No se pudo abrir el servidor: " + e.message);
    process.exit(1);
  }
});
arranca(puertoActual);
