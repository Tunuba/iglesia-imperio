/* ═══════════════════════════════════════════════════════════════════════
   qr.js — generador de códigos QR, escrito a mano y sin dependencias.
   Modo byte, corrección de errores M, versiones 1 a 10 (hasta 213 bytes).

   Existe porque el proyecto tiene que funcionar desde GitHub Pages, desde
   una IP de la red local o desde un hotspot, y en los tres casos la URL es
   distinta: un PNG fijo no sirve, y bajar una librería de un CDN tampoco
   (en la red de la U puede estar bloqueado).

   Uso:   QR.matriz("https://...")  ->  [[0,1,0...],[...]]  (1 = módulo negro)
          QR.svg("https://...", {escala, borde, claro, oscuro})  -> string SVG

   Verificado módulo a módulo contra la librería `qrcode` de Python
   (herramientas/comprobar-qr.js) para cadenas de las versiones 1 a 10.
   ═══════════════════════════════════════════════════════════════════════ */
(function (raiz) {
  "use strict";

  // ── Tablas del estándar (ISO/IEC 18004), sólo el nivel M ──────────────
  // version: [cw de corrección por bloque, bloques g1, datos g1, bloques g2, datos g2]
  var BLOQUES = {
    1: [10, 1, 16, 0, 0], 2: [16, 1, 28, 0, 0], 3: [26, 1, 44, 0, 0],
    4: [18, 2, 32, 0, 0], 5: [24, 2, 43, 0, 0], 6: [16, 4, 27, 0, 0],
    7: [18, 4, 31, 0, 0], 8: [22, 2, 38, 2, 39], 9: [22, 3, 36, 2, 37],
    10: [26, 4, 43, 1, 44]
  };
  // centros de los patrones de alineación
  var ALINEACION = {
    1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
    7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]
  };
  // bits sobrantes al final del flujo
  var RESTO = { 1: 0, 2: 7, 3: 7, 4: 7, 5: 7, 6: 7, 7: 0, 8: 0, 9: 0, 10: 0 };

  function datosCw(v) {
    var b = BLOQUES[v];
    return b[1] * b[2] + b[3] * b[4];
  }

  // ── Aritmética en GF(256) para Reed-Solomon ───────────────────────────
  var EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x; LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11D;
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();
  function mul(a, b) { return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]]; }

  function generador(grado) {
    var g = [1];
    for (var i = 0; i < grado; i++) {
      var n = new Array(g.length + 1).fill(0);
      for (var j = 0; j < g.length; j++) {
        n[j] ^= g[j];                       // el término en x (sube de grado)
        n[j + 1] ^= mul(g[j], EXP[i]);      // el término α^i
      }
      g = n;
    }
    return g;
  }

  function corregir(datos, ncw) {
    var g = generador(ncw), r = new Array(ncw).fill(0);
    for (var i = 0; i < datos.length; i++) {
      var f = datos[i] ^ r[0];
      r.shift(); r.push(0);
      if (f !== 0) for (var j = 0; j < ncw; j++) r[j] ^= mul(g[j + 1], f);
    }
    return r;
  }

  // ── Bits de formato y de versión ──────────────────────────────────────
  function bitsFormato(mascara) {          // nivel M = 0b00
    var d = (0 << 3) | mascara, v = d << 10;
    for (var i = 4; i >= 0; i--) if (v & (1 << (i + 10))) v ^= 0x537 << i;
    return ((d << 10) | v) ^ 0x5412;
  }
  function bitsVersion(version) {
    var v = version << 12;
    for (var i = 5; i >= 0; i--) if (v & (1 << (i + 12))) v ^= 0x1F25 << i;
    return (version << 12) | v;
  }

  // ── Construcción de la matriz ─────────────────────────────────────────
  function nueva(n) {
    var m = [], r = [];
    for (var i = 0; i < n; i++) {
      m.push(new Int8Array(n).fill(-1));   // -1 = todavía libre
      r.push(new Uint8Array(n));           // 1 = reservado (patrón)
    }
    return { m: m, r: r, n: n };
  }
  function poner(M, x, y, v) {
    if (x < 0 || y < 0 || x >= M.n || y >= M.n) return;
    M.m[y][x] = v; M.r[y][x] = 1;
  }
  function buscador(M, x, y) {
    for (var dy = -1; dy <= 7; dy++) for (var dx = -1; dx <= 7; dx++) {
      var px = x + dx, py = y + dy;
      if (px < 0 || py < 0 || px >= M.n || py >= M.n) continue;
      var dentro = (dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6);
      var negro = dentro && (dx === 0 || dx === 6 || dy === 0 || dy === 6 ||
        (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
      poner(M, px, py, negro ? 1 : 0);
    }
  }
  function alineacion(M, cx, cy) {
    for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) {
      var borde = Math.max(Math.abs(dx), Math.abs(dy));
      poner(M, cx + dx, cy + dy, (borde === 1) ? 0 : 1);
    }
  }

  function patrones(M, version) {
    var n = M.n;
    buscador(M, 0, 0); buscador(M, n - 7, 0); buscador(M, 0, n - 7);
    for (var i = 8; i < n - 8; i++) {       // temporizadores
      var v = (i % 2 === 0) ? 1 : 0;
      poner(M, i, 6, v); poner(M, 6, i, v);
    }
    var c = ALINEACION[version];
    for (var a = 0; a < c.length; a++) for (var b = 0; b < c.length; b++) {
      var cx = c[a], cy = c[b];
      if ((cx === 6 && cy === 6) || (cx === 6 && cy === n - 7) ||
          (cx === n - 7 && cy === 6)) continue;
      alineacion(M, cx, cy);
    }
    poner(M, 8, n - 8, 1);                  // módulo oscuro fijo
    for (var k = 0; k < 9; k++) {           // reserva del formato
      if (k !== 6) { poner(M, k, 8, 0); poner(M, 8, k, 0); }
    }
    for (var q = 0; q < 8; q++) {
      poner(M, n - 1 - q, 8, 0);
      if (q < 7) poner(M, 8, n - 1 - q, 0);
    }
    if (version >= 7) {                     // reserva de la versión
      for (var t = 0; t < 18; t++) {
        var f = Math.floor(t / 3), s = t % 3;
        poner(M, f, n - 11 + s, 0); poner(M, n - 11 + s, f, 0);
      }
    }
  }

  function escribeFormato(M, mascara) {
    var bits = bitsFormato(mascara), n = M.n;
    for (var i = 0; i < 15; i++) {
      var b = (bits >> i) & 1;
      if (i < 6) M.m[i][8] = b;
      else if (i < 8) M.m[i + 1][8] = b;
      else if (i === 8) M.m[8][7] = b;
      else M.m[8][14 - i] = b;
      if (i < 8) M.m[8][n - 1 - i] = b;
      else M.m[n - 15 + i][8] = b;
    }
    M.m[n - 8][8] = 1;
  }
  function escribeVersion(M, version) {
    if (version < 7) return;
    var bits = bitsVersion(version), n = M.n;
    for (var i = 0; i < 18; i++) {
      var b = (bits >> i) & 1, f = Math.floor(i / 3), s = i % 3;
      M.m[n - 11 + s][f] = b;
      M.m[f][n - 11 + s] = b;
    }
  }

  function mascaraFn(k) {
    return [
      function (x, y) { return (x + y) % 2 === 0; },
      function (x, y) { return y % 2 === 0; },
      function (x, y) { return x % 3 === 0; },
      function (x, y) { return (x + y) % 3 === 0; },
      function (x, y) { return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0; },
      function (x, y) { return ((x * y) % 2) + ((x * y) % 3) === 0; },
      function (x, y) { return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; },
      function (x, y) { return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; }
    ][k];
  }

  function penaliza(m, n) {
    var p = 0, i, j, run, ant;
    for (i = 0; i < n; i++) {                       // regla 1: rachas
      run = 1; ant = m[i][0];
      for (j = 1; j < n; j++) {
        if (m[i][j] === ant) run++;
        else { if (run >= 5) p += 3 + (run - 5); run = 1; ant = m[i][j]; }
      }
      if (run >= 5) p += 3 + (run - 5);
      run = 1; ant = m[0][i];
      for (j = 1; j < n; j++) {
        if (m[j][i] === ant) run++;
        else { if (run >= 5) p += 3 + (run - 5); run = 1; ant = m[j][i]; }
      }
      if (run >= 5) p += 3 + (run - 5);
    }
    for (i = 0; i < n - 1; i++) for (j = 0; j < n - 1; j++) {  // regla 2: bloques 2x2
      var v = m[i][j];
      if (v === m[i][j + 1] && v === m[i + 1][j] && v === m[i + 1][j + 1]) p += 3;
    }
    var pat1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], pat2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
    function coincide(get, pos, pat) {
      for (var k = 0; k < 11; k++) if (get(pos + k) !== pat[k]) return false;
      return true;
    }
    for (i = 0; i < n; i++) {                        // regla 3: patrón 1:1:3:1:1
      for (j = 0; j <= n - 11; j++) {
        var fila = (function (r) { return function (k) { return m[r][k]; }; })(i);
        var col = (function (c) { return function (k) { return m[k][c]; }; })(i);
        if (coincide(fila, j, pat1) || coincide(fila, j, pat2)) p += 40;
        if (coincide(col, j, pat1) || coincide(col, j, pat2)) p += 40;
      }
    }
    var oscuros = 0;                                 // regla 4: proporción
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) if (m[i][j]) oscuros++;
    var pct = (oscuros * 100) / (n * n);
    p += Math.floor(Math.abs(pct - 50) / 5) * 10;
    return p;
  }

  function aBytes(txt) {
    var s = unescape(encodeURIComponent(txt)), out = [];
    for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i) & 0xFF);
    return out;
  }

  function matriz(texto, mascaraFija) {
    var bytes = aBytes(texto), version = 0;
    for (var v = 1; v <= 10; v++) {
      var cab = 2 + (v >= 10 ? 1 : 0);              // modo+contador en bytes
      if (bytes.length + cab <= datosCw(v)) { version = v; break; }
    }
    if (!version) throw new Error("El texto no cabe en un QR versión 10 (" + bytes.length + " bytes)");

    // ── flujo de bits ──
    var bits = [];
    function mete(valor, largo) {
      for (var i = largo - 1; i >= 0; i--) bits.push((valor >> i) & 1);
    }
    mete(4, 4);                                      // modo byte
    mete(bytes.length, version >= 10 ? 16 : 8);
    for (var i = 0; i < bytes.length; i++) mete(bytes[i], 8);
    var total = datosCw(version) * 8;
    for (var t = 0; t < 4 && bits.length < total; t++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);
    var relleno = [0xEC, 0x11], k = 0;
    while (bits.length < total) { mete(relleno[k % 2], 8); k++; }

    var cw = [];
    for (var b = 0; b < bits.length; b += 8) {
      var byte = 0;
      for (var q = 0; q < 8; q++) byte = (byte << 1) | bits[b + q];
      cw.push(byte);
    }

    // ── bloques + corrección ──
    var B = BLOQUES[version], bloques = [], ecs = [], pos = 0;
    function agrega(cuantos, largo) {
      for (var i = 0; i < cuantos; i++) {
        var d = cw.slice(pos, pos + largo); pos += largo;
        bloques.push(d); ecs.push(corregir(d, B[0]));
      }
    }
    agrega(B[1], B[2]); agrega(B[3], B[4]);

    var flujo = [], maxD = Math.max(B[2], B[4] || 0);
    for (var c = 0; c < maxD; c++)
      for (var bl = 0; bl < bloques.length; bl++)
        if (c < bloques[bl].length) flujo.push(bloques[bl][c]);
    for (var e = 0; e < B[0]; e++)
      for (var bl2 = 0; bl2 < ecs.length; bl2++) flujo.push(ecs[bl2][e]);

    var flujoBits = [];
    for (var f = 0; f < flujo.length; f++)
      for (var g = 7; g >= 0; g--) flujoBits.push((flujo[f] >> g) & 1);
    for (var r = 0; r < RESTO[version]; r++) flujoBits.push(0);

    // ── colocación en zigzag ──
    var n = version * 4 + 17, M = nueva(n);
    patrones(M, version);
    var idx = 0, arriba = true;
    for (var col = n - 1; col > 0; col -= 2) {
      if (col === 6) col--;                          // la columna del temporizador se salta
      for (var paso = 0; paso < n; paso++) {
        var fila = arriba ? (n - 1 - paso) : paso;
        for (var dx = 0; dx < 2; dx++) {
          var x = col - dx;
          if (M.r[fila][x]) continue;
          M.m[fila][x] = idx < flujoBits.length ? flujoBits[idx] : 0;
          idx++;
        }
      }
      arriba = !arriba;
    }

    // ── máscara: se prueban las ocho y gana la de menos penalización ──
    var mejor = null, mejorP = Infinity, mejorK = 0;
    for (var mk = 0; mk < 8; mk++) {
      if (mascaraFija != null && mk !== mascaraFija) continue;
      var fn = mascaraFn(mk), copia = [];
      for (var y = 0; y < n; y++) {
        copia.push(new Int8Array(n));
        for (var x2 = 0; x2 < n; x2++)
          copia[y][x2] = M.r[y][x2] ? M.m[y][x2] : (M.m[y][x2] ^ (fn(x2, y) ? 1 : 0));
      }
      var tmp = { m: copia, r: M.r, n: n };
      escribeFormato(tmp, mk); escribeVersion(tmp, version);
      var p = penaliza(copia, n);
      if (p < mejorP) { mejorP = p; mejor = copia; mejorK = mk; }
    }
    var salida = [];
    for (var y2 = 0; y2 < n; y2++) salida.push(Array.from(mejor[y2], function (v) { return v ? 1 : 0; }));
    salida.version = version; salida.mascara = mejorK; salida.flujo = flujo;
    return salida;
  }

  function svg(texto, op) {
    op = op || {};
    var esc = op.escala || 8, borde = op.borde == null ? 4 : op.borde;
    var claro = op.claro || "#FFFFFF", oscuro = op.oscuro || "#000000";
    var m = matriz(texto), n = m.length, lado = (n + borde * 2) * esc, d = "";
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (m[y][x])
      d += "M" + ((x + borde) * esc) + " " + ((y + borde) * esc) + "h" + esc + "v" + esc + "h-" + esc + "z";
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + lado + '" height="' + lado +
      '" viewBox="0 0 ' + lado + ' ' + lado + '" shape-rendering="crispEdges">' +
      '<rect width="' + lado + '" height="' + lado + '" fill="' + claro + '"/>' +
      '<path d="' + d + '" fill="' + oscuro + '"/></svg>';
  }

  var API = { matriz: matriz, svg: svg };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else raiz.QR = API;
})(typeof self !== "undefined" ? self : this);
