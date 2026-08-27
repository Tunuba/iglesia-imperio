# -*- coding: utf-8 -*-
"""Genera las matrices QR de referencia con la libreria `qrcode` de Python
para que comprobar-qr.js contraste contra ellas las de assets/qr.js."""
import json, sys
sys.stdout.reconfigure(encoding="utf-8")
import qrcode
from qrcode.constants import ERROR_CORRECT_M
from qrcode.util import QRData, MODE_8BIT_BYTE

PRUEBAS = [
    "HOLA",
    "https://tunuba.github.io/iglesia-imperio/",
    "https://tunuba.github.io/iglesia-imperio/#s=ROMA47",
    "http://192.168.1.104:8099/index.html#s=NICEA25",
    "A" * 100,
    "Creo en un solo Dios, Padre todopoderoso, Creador del cielo y de la tierra, de todo lo visible",
    "x" * 180,
]
def referencias():
  out = []
  for s in PRUEBAS:
    q = qrcode.QRCode(version=None, error_correction=ERROR_CORRECT_M, box_size=1, border=0)
    q.add_data(QRData(s.encode("utf-8"), mode=MODE_8BIT_BYTE))  # modo byte forzado
    q.make(fit=True)
    matriz = [[1 if v else 0 for v in fila] for fila in q.get_matrix()]
    mascara = None                      # qrcode no la expone: se deduce
    for k in range(8):
      p2 = qrcode.QRCode(error_correction=ERROR_CORRECT_M, box_size=1, border=0, mask_pattern=k)
      p2.add_data(QRData(s.encode("utf-8"), mode=MODE_8BIT_BYTE))
      p2.make(fit=True)
      if [[1 if v else 0 for v in f] for f in p2.get_matrix()] == matriz:
        mascara = k
        break
    out.append({"texto": s, "version": q.version, "mascara": mascara,
                "m": [[1 if v else 0 for v in fila] for fila in q.get_matrix()]})
  json.dump(out, open("qr-esperado.json", "w"), ensure_ascii=False)
  print("referencias:", len(out))


def decodificar():
  """La prueba de verdad: se pintan las matrices que generó qr.js y se leen
  con un lector real (pyzbar/zbar). Si esto pasa, un teléfono también lo lee."""
  from PIL import Image
  from pyzbar.pyzbar import decode
  casos = json.load(open("qr-generado.json", encoding="utf-8"))
  malos = 0
  for c in casos:
    m = c["m"]; n = len(m); z = 6; b = 4
    im = Image.new("L", ((n + b * 2) * z, (n + b * 2) * z), 255)
    px = im.load()
    for y in range(n):
      for x in range(n):
        if m[y][x]:
          for dy in range(z):
            for dx in range(z):
              px[(x + b) * z + dx, (y + b) * z + dy] = 0
    leido = decode(im)
    ok = leido and leido[0].data.decode("utf-8") == c["texto"]
    print(("✓ leído   " if ok else "✗ NO SE LEE"), repr(c["texto"][:30]))
    if not ok:
      malos += 1
  print("lector real:", "todos legibles" if not malos else "%d ilegibles" % malos)
  return malos


if "--decodificar" in sys.argv:
  sys.exit(1 if decodificar() else 0)
referencias()
