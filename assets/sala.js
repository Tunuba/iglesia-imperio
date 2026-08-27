/* ═══════════════════════════════════════════════════════════════════════
   sala.js — el canal entre la computadora del presentador y los teléfonos.

   Cómo funciona, y por qué así:
   · Se escucha con EventSource (SSE) y se publica con un POST normal. Nada de
     WebSockets, nada de librerías, nada de cuentas ni claves.
   · Primero se intenta LA PROPIA COMPUTADORA (herramientas/servidor.js). Ese
     camino no toca internet: si los teléfonos ven la laptop —misma red o el
     hotspot de la laptop— la sala funciona aunque la red esté filtrada.
   · Si la página se abrió desde GitHub Pages, se cae a ntfy.sh (y de ahí a
     ntfy.envs.net), que son relés públicos por HTTPS con CORS abierto.
   · No se usó Cloudflare Tunnel ni ngrok a propósito: la red de la universidad
     bloquea el puerto 7844 y sabotea la conexión de argotunnel (medido), así
     que un túnel desde la laptop NO sube.
   · Si el canal no conecta, la página NO se rompe: cada teléfono sigue
     funcionando solo y el presentador canta los pasos en voz alta. La
     sincronía es un lujo, no un requisito.

   Uso:
     const sala = Sala.conectar({
       sala: "roma47",                       // el código del salón
       alRecibir: (msg) => {...},            // un objeto JSON por mensaje
       alEstado:  (estado, detalle) => {...} // "buscando" | "conectado" | "sin-red"
     });
     sala.enviar({t:"escena", n:3});
     sala.cerrar();
   ═══════════════════════════════════════════════════════════════════════ */
(function (raiz) {
  "use strict";

  // Los caminos, en orden de preferencia:
  //   1. LA PROPIA COMPUTADORA (herramientas/servidor.js). Es el mejor: no
  //      necesita internet, no depende de nadie y en la red de la U es lo único
  //      que seguro no está filtrado. Se detecta preguntando por /sala/ping.
  //   2. ntfy.sh y 3. ntfy.envs.net, dos relés públicos por HTTPS, por si la
  //      página se abre desde GitHub Pages y los teléfonos no ven la laptop.
  // Si ninguno responde, la página sigue funcionando sola.
  var SERVIDORES = ["https://ntfy.sh", "https://ntfy.envs.net"];
  var ESPERA_MS = 6000;          // cuánto se le da a un servidor antes de pasar al otro

  function rutasLocales(origen, tema) {
    return {
      nombre: "esta computadora",
      sse: origen + "/sala/sse?t=" + tema,
      publicar: origen + "/sala/enviar?t=" + tema,
      recientes: function () { return origen + "/sala/recientes?t=" + tema; }
    };
  }
  function rutasNtfy(base, tema) {
    return {
      nombre: base.replace(/^https?:\/\//, ""),
      sse: base + "/" + tema + "/sse",
      publicar: base + "/" + tema,
      recientes: function (min) { return base + "/" + tema + "/json?poll=1&since=" + (min || 45) + "m"; }
    };
  }

  function limpiaNombre(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 24) || "sala";
  }

  function conectar(op) {
    var tema = "iglesia-imperio-" + limpiaNombre(op.sala);
    var alRecibir = op.alRecibir || function () {};
    var alEstado = op.alEstado || function () {};
    var idx = 0, es = null, vivo = true, temporizador = null, ruta = null;
    var caminos = SERVIDORES.map(function (b) { return rutasNtfy(b, tema); });
    var yaVistos = Object.create(null);   // ids ya recibidos, para no repetir mensajes
    // Nada sale a la red hasta saber POR DÓNDE. Si no, el primer mensaje se
    // iría a internet aunque la computadora de al lado esté sirviendo la sala.
    var cola = [], pedirRecientes = null, abierto = false;

    function estado(e, d) { try { alEstado(e, d); } catch (x) {} }

    function entrega(datos) {
      var sobre;
      try { sobre = JSON.parse(datos); } catch (e) { return; }
      if (sobre.event === "open") { abre(); return; }
      if (sobre.event !== "message" || !sobre.message) return;
      if (yaVistos[sobre.id]) return;
      yaVistos[sobre.id] = 1;
      var msg;
      try { msg = JSON.parse(sobre.message); } catch (e) { return; }
      try { alRecibir(msg, sobre); } catch (e) {}
    }

    function intenta() {
      if (!vivo) return;
      if (idx >= caminos.length) { estado("sin-red"); return; }
      ruta = caminos[idx];
      estado("buscando", ruta.nombre);
      try { if (es) es.close(); } catch (e) {}
      es = new EventSource(ruta.sse);
      var conectado = false;
      clearTimeout(temporizador);
      temporizador = setTimeout(function () {
        if (!conectado && vivo) { idx++; intenta(); }   // este servidor no responde
      }, ESPERA_MS);
      es.onmessage = function (ev) {
        conectado = true; clearTimeout(temporizador);
        entrega(ev.data);
      };
      es.onopen = function () {
        conectado = true; clearTimeout(temporizador); abre();
      };
      es.onerror = function () {
        // EventSource reintenta solo; si nunca llegó a abrir, se prueba el otro
        if (!conectado && vivo) { clearTimeout(temporizador); idx++; setTimeout(intenta, 400); }
        else estado("buscando", ruta.nombre);
      };
    }

    function abre() {
      var primera = !abierto;
      abierto = true;
      estado("conectado", ruta.nombre);
      if (!primera) return;
      while (cola.length) enviarYa(cola.shift());
      if (pedirRecientes) { var f = pedirRecientes; pedirRecientes = null; f(); }
    }

    // Lo que ya se dijo antes de que este teléfono entrara (para los que llegan
    // tarde: se ponen al día con la última escena en lugar de quedarse en la 0).
    function recuperar(minutos, listo) {
      if (!abierto) {                       // todavía no se sabe por dónde: se espera
        pedirRecientes = function () { recuperar(minutos, listo); };
        setTimeout(function () {            // ...pero no para siempre
          if (pedirRecientes) { pedirRecientes = null; listo([]); }
        }, 9000);
        return;
      }
      var url = ruta.recientes(minutos || 45);
      fetch(url).then(function (r) { return r.text(); }).then(function (t) {
        var msgs = [];
        t.split("\n").forEach(function (linea) {
          if (!linea.trim()) return;
          try {
            var sobre = JSON.parse(linea);
            if (sobre.event === "message" && sobre.message) msgs.push(JSON.parse(sobre.message));
          } catch (e) {}
        });
        listo(msgs);
      }).catch(function () { listo([]); });
    }

    function enviar(obj) {
      if (!abierto) { cola.push(obj); if (cola.length > 20) cola.shift(); return; }
      return enviarYa(obj);
    }
    function enviarYa(obj) {
      var cuerpo = JSON.stringify(obj);
      var url = ruta.publicar;
      // text/plain evita el preflight CORS; ntfy toma el cuerpo tal cual
      return fetch(url, { method: "POST", body: cuerpo,
                          headers: { "Content-Type": "text/plain" } })
        .catch(function () { /* sin red: el mensaje se pierde y la app sigue */ });
    }

    function cerrar() {
      vivo = false; clearTimeout(temporizador);
      try { if (es) es.close(); } catch (e) {}
    }

    // ¿Está la página servida por la propia computadora? Si sí, ese camino va
    // primero: es el más rápido y el único que no depende de internet.
    function arranca() {
      var origen = (location.protocol === "http:" || location.protocol === "https:")
                   ? location.origin : null;
      if (!origen) { intenta(); return; }
      var listo = false;
      var corta = setTimeout(function () { if (!listo) { listo = true; intenta(); } }, 1800);
      fetch(origen + "/sala/ping", { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          if (listo) return;
          listo = true; clearTimeout(corta);
          if (j && j.sala) caminos.unshift(rutasLocales(origen, tema));
          intenta();
        })
        .catch(function () { if (!listo) { listo = true; clearTimeout(corta); intenta(); } });
    }
    arranca();
    return { enviar: enviar, cerrar: cerrar, recuperar: recuperar, tema: tema,
             servidor: function () { return ruta && ruta.nombre; } };
  }

  raiz.Sala = { conectar: conectar, SERVIDORES: SERVIDORES };
})(typeof self !== "undefined" ? self : this);
