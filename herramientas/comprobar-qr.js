// Comprueba assets/qr.js de dos formas:
//  1) módulo a módulo contra las matrices de la librería `qrcode` de Python,
//     con la máscara forzada (la elección automática de máscara puede diferir
//     entre implementaciones sin que ninguna esté mal: las ocho son válidas).
//  2) escribe las matrices a qr-generado.json para que comprobar-qr.py las
//     DECODIFIQUE de verdad con pyzbar y confirme que se leen.
// Uso:  python comprobar-qr.py && node comprobar-qr.js && python comprobar-qr.py --decodificar
const fs = require("fs");
const QR = require("../assets/qr.js");
const esperado = require("./qr-esperado.json");
let fallos = 0;
const generado = [];
for (const caso of esperado) {
  const etiqueta = JSON.stringify(caso.texto.slice(0, 30)) + (caso.texto.length > 30 ? "…" : "");
  const auto = QR.matriz(caso.texto);
  generado.push({ texto: caso.texto, m: auto.map(f => f.slice()) });
  if (auto.length !== caso.m.length) {
    console.log("✗ tamaño", etiqueta, auto.length, "vs", caso.m.length); fallos++; continue;
  }
  const mia = QR.matriz(caso.texto, caso.mascara);
  let dif = 0;
  for (let y = 0; y < mia.length; y++)
    for (let x = 0; x < mia.length; x++)
      if (mia[y][x] !== caso.m[y][x]) dif++;
  if (dif) { console.log("✗", etiqueta, "v" + mia.version, "→", dif, "módulos distintos"); fallos++; }
  else console.log("✓", etiqueta, "v" + auto.version, auto.length + "×" + auto.length,
                   "(máscara elegida:", auto.mascara + ", referencia:", caso.mascara + ")");
}
fs.writeFileSync("qr-generado.json", JSON.stringify(generado));
console.log(fallos ? fallos + " FALLOS" : "Idénticos a la referencia de Python.");
process.exit(fallos ? 1 : 0);
