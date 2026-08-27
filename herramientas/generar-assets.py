# -*- coding: utf-8 -*-
r"""
Genera los assets de la pagina interactiva a partir de los sprites de CCPP.

Entrada  (en esta misma carpeta, copiados de TEOLOGIA 2\CCPP\DISENOS):
  PERSONAJES-ORIGEN/HOMBREn|MUJERn/FRAME1..8.png   18x25, pixel art
  CORAZON-ORIGEN/FRAME1..30.png                    32x32, corazon latiendo

Salida:
  ../assets/personas.png    hoja 16 personas x 2 frames (idle + paso)
  ../assets/corazon.png     hoja de 30 frames del latido
  ../assets/sprites.js      las dos hojas en base64 + el catalogo de personas

Metodo (el mismo de generador_hombres.py): se trabaja por FILAS.
En un sprite de 18x25 las capas caen siempre en las mismas filas:
    0-7   pelo        8-14  cara/piel      15-18 camisa
    19-21 pantalon    22-24 zapatos
Para volverlos del siglo I se pinta camisa+pantalon con UNA sola paleta
(eso convierte la camisa corta en tunica larga), los zapatos en sandalia,
y se dibujan encima los accesorios pixel a pixel (laurel, velo, cresta...).

Uso:  python generar-assets.py
"""
import os, sys, json, base64

sys.stdout.reconfigure(encoding="utf-8")
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
ORIG = os.path.join(AQUI, "PERSONAJES-ORIGEN")
CORA = os.path.join(AQUI, "CORAZON-ORIGEN")
SALIDA = os.path.abspath(os.path.join(AQUI, "..", "assets"))
os.makedirs(SALIDA, exist_ok=True)

W, H = 18, 25
FILAS_CAMISA = range(15, 19)
FILAS_PANTALON = range(19, 22)
FILAS_ZAPATO = range(22, 25)

# La piel del generador original (no se toca nunca)
PIEL = {
    (0xFE, 0xD9, 0x98), (0xF5, 0xB9, 0x71), (0xD4, 0x94, 0x50),
    (0xFF, 0xDC, 0x9A), (0xFE, 0xD8, 0x9B),
}
SANDALIA = [(0x4A, 0x2F, 0x18), (0x6B, 0x45, 0x22), (0x8C, 0x5C, 0x2E)]


def luminancia(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def es_piel(c):
    return c[:3] in PIEL


def repintar(px, filas, paleta):
    """Cambia la ropa de esas filas por 'paleta' (sombra, base, luz),
    respetando que pixel era sombra y cual era luz en el original."""
    vals = []
    for y in filas:
        for x in range(W):
            c = px[x, y]
            if c[3] == 0 or es_piel(c):
                continue
            vals.append(luminancia(c))
    if not vals:
        return
    lo, hi = min(vals), max(vals)
    span = max(hi - lo, 1e-6)
    for y in filas:
        for x in range(W):
            c = px[x, y]
            if c[3] == 0 or es_piel(c):
                continue
            t = (luminancia(c) - lo) / span
            idx = 0 if t < 0.34 else (1 if t < 0.72 else 2)
            r, g, b = paleta[idx]
            px[x, y] = (r, g, b, 255)


# ── Cabezas canónicas ─────────────────────────────────────────────────────
# Igual que el HAIR_MAP del generador original: la cabeza NO se hereda del
# sprite (cada peinado tenía moños, mechones y adornos que al repintarlos
# dejaban píxeles sueltos y bordes grumosos). Se borra y se vuelve a dibujar
# con uno de estos mapas. Cada tramo es (fila, x_inicial, x_final, tono)
# con tono 0=sombra 1=base 2=luz.
CABEZAS = {
    "pelo": [
        (0, 6, 11, 1), (1, 4, 13, 2), (2, 3, 14, 2), (3, 3, 14, 1),
        (4, 2, 15, 1), (5, 2, 15, 1), (6, 2, 15, 0), (7, 2, 15, 0),
    ],
    "pelo_largo": [
        (0, 6, 11, 1), (1, 4, 13, 2), (2, 3, 14, 2), (3, 3, 14, 1),
        (4, 2, 15, 1), (5, 2, 15, 1), (6, 2, 15, 0), (7, 2, 15, 0),
        (8, 2, 3, 0), (8, 14, 15, 0), (9, 2, 2, 0), (9, 15, 15, 0),
        (10, 2, 2, 0), (10, 15, 15, 0), (11, 2, 2, 0), (11, 15, 15, 0),
        (12, 3, 3, 0), (12, 14, 14, 0),
    ],
    "velo": [
        (0, 5, 12, 1), (1, 3, 14, 2), (2, 2, 15, 2), (3, 2, 15, 1),
        (4, 2, 15, 1), (5, 1, 16, 1), (6, 1, 16, 0), (7, 1, 16, 0),
        (8, 1, 3, 0), (8, 14, 16, 0), (9, 1, 2, 0), (9, 15, 16, 0),
        (10, 1, 2, 0), (10, 15, 16, 0), (11, 2, 2, 0), (11, 15, 15, 0),
        (12, 2, 3, 0), (12, 14, 15, 0),
    ],
    "capucha": [
        (0, 7, 10, 0), (1, 5, 12, 1), (2, 3, 14, 1), (3, 2, 15, 1),
        (4, 2, 15, 2), (5, 2, 15, 0), (6, 1, 16, 0), (7, 1, 16, 0),
        (8, 1, 3, 0), (8, 14, 16, 0), (9, 1, 2, 0), (9, 15, 16, 0),
        (10, 2, 2, 0), (10, 15, 15, 0),
    ],
    "casco": [
        (3, 3, 14, 2), (4, 2, 15, 1), (5, 2, 15, 1),
        (6, 2, 15, 0), (7, 1, 16, 0),
        (8, 1, 2, 1), (8, 15, 16, 1), (9, 1, 2, 0), (9, 15, 16, 0),
        (10, 2, 2, 0), (10, 15, 15, 0),
    ],
}
PENACHO = [(1, 8, 9), (2, 8, 9)]   # cresta corta: si llega a la fila 0 se ve cortada

TONOS = {
    "negro":   [(0x14, 0x10, 0x14), (0x24, 0x1E, 0x24), (0x3A, 0x32, 0x38)],
    "castano": [(0x2E, 0x1C, 0x10), (0x4E, 0x30, 0x1A), (0x74, 0x4A, 0x28)],
    "oscuro":  [(0x1C, 0x14, 0x10), (0x36, 0x26, 0x1A), (0x52, 0x3C, 0x26)],
    "canoso":  [(0x50, 0x4E, 0x4C), (0x86, 0x84, 0x80), (0xC0, 0xBE, 0xB6)],
    "rubio":   [(0x6E, 0x52, 0x1E), (0xA8, 0x84, 0x36), (0xD8, 0xB8, 0x60)],
    "rojizo":  [(0x54, 0x22, 0x10), (0x86, 0x3C, 0x18), (0xB4, 0x5E, 0x28)],
    "metal":   [(0x5A, 0x60, 0x6C), (0x8E, 0x96, 0xA4), (0xC4, 0xCA, 0xD6)],
    # telas (para velos y capuchas)
    "lino":    [(0x8E, 0x86, 0x74), (0xC6, 0xBE, 0xA8), (0xEE, 0xE8, 0xD6)],
    "vino":    [(0x4A, 0x14, 0x30), (0x7A, 0x22, 0x50), (0xA8, 0x3A, 0x74)],
    "luto":    [(0x18, 0x18, 0x20), (0x2A, 0x2A, 0x36), (0x42, 0x42, 0x52)],
    "tierra":  [(0x3A, 0x2A, 0x18), (0x5E, 0x46, 0x28), (0x8A, 0x6A, 0x40)],
    "lila":    [(0x6E, 0x5E, 0x8A), (0x94, 0x84, 0xB4), (0xC0, 0xB4, 0xDC)],
}


def colores_pelo(px):
    """Los tonos del peinado original: los de las filas 0-7 (ahí solo hay pelo)."""
    out = set()
    for y in range(0, 8):
        for x in range(W):
            c = px[x, y]
            if c[3] != 0 and not es_piel(c):
                out.add(c[:3])
    return out


def limpiar_cabeza(px):
    """Devuelve los píxeles que enmarcaban la cara (patillas, mechones sobre los
    hombros) para que la cabeza nueva los repinte. Si sólo se borran, la cabeza
    queda flotando y el personaje se ve mordido a los lados."""
    """Deja SOLO la cara: borra peinado, mechones largos, moños, lazos y
    cualquier adorno del sprite original. Sin esto quedan píxeles sueltos a la
    altura de los ojos (el pelo largo azul de MUJER5, los lazos de MUJER6) y el
    contorno del velo sale grumoso, porque cada peinado tiene una silueta
    distinta. Los ojos se reconocen por ser oscuros y estar en el centro."""
    for y in range(0, 8):                       # arriba de la cara: todo fuera
        for x in range(W):
            if px[x, y][3] != 0 and not es_piel(px[x, y]):
                px[x, y] = (0, 0, 0, 0)
    # Los ojos: una columna es ojo si tiene oscuro en las filas 10 y 11 y piel
    # justo arriba (fila 8) y abajo (fila 13). Un mechón que cruza la cara sigue
    # de largo, así que falla esa prueba; el ojo no.
    # lo que rodea la cara y NO es piel ni ojo: es pelo, y hay que reponerlo
    marco = []
    ojos = []
    for x in range(4, 14):
        if (not es_piel(px[x, 10]) and px[x, 10][3] != 0
                and not es_piel(px[x, 11]) and px[x, 11][3] != 0
                and es_piel(px[x, 8]) and es_piel(px[x, 13])):
            for y in range(9, 13):
                if px[x, y][3] != 0 and not es_piel(px[x, y]):
                    ojos.append((x, y, px[x, y]))
    for y in range(8, 15):                      # la cara: piel y nada más
        for x in range(W):
            if px[x, y][3] != 0 and not es_piel(px[x, y]):
                # a los lados es la silueta de la cabeza (se repone);
                # en el medio es un mechón cruzándole la cara (se va)
                if x < 4 or x > 13:
                    marco.append((x, y))
                px[x, y] = (0, 0, 0, 0)
    for (x, y, c) in ojos:                      # y se devuelven los ojos
        px[x, y] = c
    for y in range(15, H):                      # el cuerpo: fuera lo que sobresale
        for x in range(W):
            c = px[x, y]
            if c[3] != 0 and not es_piel(c) and (x < 3 or x > 15):
                px[x, y] = (0, 0, 0, 0)
    return marco


def dibujar_cabeza(px, forma, tono, marco=()):
    pal = TONOS[tono]
    # La silueta original, repintada. Se rellena por tramos (del píxel más
    # lejano hasta la cara) porque algunos peinados son mechones sueltos con
    # huecos: pintados uno a uno se ven como rayas flotando junto a la cara.
    porFila = {}
    for (x, y) in marco:
        porFila.setdefault(y, []).append(x)
    for y, xs in porFila.items():
        izq = [x for x in xs if x < 4]
        der = [x for x in xs if x > 13]
        for lado in (izq, der):
            if not lado:
                continue
            for x in range(min(lado), max(lado) + 1):
                if px[x, y][3] != 0 and es_piel(px[x, y]):
                    continue
                px[x, y] = (pal[0][0], pal[0][1], pal[0][2], 255)
    for (y, x0, x1, t) in CABEZAS[forma]:
        for x in range(x0, x1 + 1):
            if 0 <= x < W and 0 <= y < H:
                r, g, b = pal[t]
                px[x, y] = (r, g, b, 255)
    if forma == "casco":
        rojo, rojo2 = (0xC0, 0x2A, 0x1E), (0xF0, 0x50, 0x3A)
        for (y, x0, x1) in PENACHO:
            for x in range(x0, x1 + 1):
                px[x, y] = (rojo2 + (255,)) if x == x1 else (rojo + (255,))


def pintar(px, puntos, color):
    for (x, y) in puntos:
        if 0 <= x < W and 0 <= y < H:
            px[x, y] = (color[0], color[1], color[2], 255)


def silueta(px, filas):
    """Pixeles opacos de esas filas (el contorno del pelo/cabeza)."""
    out = []
    for y in filas:
        for x in range(W):
            if px[x, y][3] != 0:
                out.append((x, y))
    return out


PELOS = {
    "negro":  [(0x14, 0x10, 0x14), (0x24, 0x1E, 0x24), (0x3A, 0x32, 0x38)],
    "castano":[(0x2E, 0x1C, 0x10), (0x4E, 0x30, 0x1A), (0x74, 0x4A, 0x28)],
    "oscuro": [(0x1C, 0x14, 0x10), (0x36, 0x26, 0x1A), (0x52, 0x3C, 0x26)],
    "canoso": [(0x50, 0x4E, 0x4C), (0x86, 0x84, 0x80), (0xC0, 0xBE, 0xB6)],
    "rubio":  [(0x6E, 0x52, 0x1E), (0xA8, 0x84, 0x36), (0xD8, 0xB8, 0x60)],
    "rojizo": [(0x54, 0x22, 0x10), (0x86, 0x3C, 0x18), (0xB4, 0x5E, 0x28)],
}


# ── Accesorios del cuerpo ────────────────────────────────────────────────
def acc_palio(px):  # banda blanca del obispo sobre los hombros
    blanco, cruz = (0xF2, 0xF0, 0xE6), (0x8C, 0x18, 0x18)
    pintar(px, [(5, 15), (6, 15), (11, 15), (12, 15),
                (6, 16), (11, 16), (7, 17), (10, 17)], blanco)
    pintar(px, [(8, 16), (9, 16)], cruz)


def acc_capucha(px, color):
    pintar(px, [(x, 3) for x in range(3, 15)], color)
    pintar(px, [(x, 4) for x in range(2, 16)], color)
    pintar(px, [(2, 5), (15, 5), (2, 6), (15, 6)], color)


def acc_faja(px, color):
    pintar(px, [(x, 18) for x in range(4, 14)], color)


def acc_cadena(px):  # esclavo: collar de hierro
    hierro = (0x6E, 0x74, 0x80)
    pintar(px, [(6, 14), (7, 14), (8, 14), (9, 14), (10, 14), (11, 14)], hierro)


def acc_franja_senatorial(px):
    """La banda purpura vertical de la toga (latus clavus)."""
    pur = (0x6B, 0x1F, 0x5C)
    pintar(px, [(8, y) for y in range(15, 22)], pur)


# ── Catalogo de personas ──────────────────────────────────────────────────
# base: carpeta de PERSONAJES-ORIGEN;  tunica: (sombra, base, luz)
PERSONAS = [
    dict(id="pescador", cabeza="pelo", tono="castano", base="HOMBRE1", nombre="Pescador de Galilea",
         lugar="Cafarnaum, Judea", ano="año 33",
         tunica=[(0x6B, 0x5A, 0x3C), (0x9C, 0x87, 0x5A), (0xC8, 0xB2, 0x7E)],
         acc=["faja:8C4A20"]),
    dict(id="tejedora", cabeza="velo", tono="vino", base="MUJER1", nombre="Tejedora de púrpura",
         lugar="Tiatira, Asia Menor", ano="año 50",
         tunica=[(0x4A, 0x18, 0x46), (0x76, 0x2A, 0x6E), (0xA6, 0x4C, 0x9C)],
         acc=[]),
    dict(id="legionario", cabeza="casco", tono="metal", base="HOMBRE4", nombre="Legionario de Roma",
         lugar="Legión X, frontera del Rin", ano="año 64",
         tunica=[(0x6E, 0x14, 0x10), (0xA8, 0x24, 0x1C), (0xD6, 0x3A, 0x2C)],
         acc=[]),
    dict(id="esclava", cabeza="pelo_largo", tono="castano", base="MUJER5", nombre="Esclava de una casa rica",
         lugar="Roma, barrio del Aventino", ano="año 64",
         tunica=[(0x4A, 0x46, 0x40), (0x6E, 0x69, 0x60), (0x94, 0x8E, 0x84)],
         acc=["cadena"]),
    dict(id="mercader", cabeza="pelo", tono="negro", base="HOMBRE5", nombre="Mercader de tejidos",
         lugar="Éfeso, Asia Menor", ano="año 90",
         tunica=[(0x14, 0x38, 0x60), (0x22, 0x5A, 0x92), (0x3E, 0x84, 0xC4)],
         acc=["faja:D8A82E"]),
    dict(id="matrona", cabeza="velo", tono="lino", base="MUJER2", nombre="Matrona romana",
         lugar="Roma, colina del Celio", ano="año 107",
         tunica=[(0x8E, 0x86, 0x74), (0xC6, 0xBE, 0xA8), (0xEE, 0xE8, 0xD6)],
         acc=[]),
    dict(id="escriba", cabeza="capucha", tono="tierra", base="HOMBRE3", nombre="Escriba de Jerusalén",
         lugar="Jerusalén, Judea", ano="año 33",
         tunica=[(0x3A, 0x2A, 0x18), (0x5E, 0x46, 0x28), (0x8A, 0x6A, 0x40)],
         acc=[]),
    dict(id="alfarero", cabeza="pelo", tono="oscuro", base="HOMBRE7", nombre="Alfarero de Cartago",
         lugar="Cartago, África proconsular", ano="año 203",
         tunica=[(0x6B, 0x3A, 0x1C), (0x9E, 0x59, 0x2C), (0xC8, 0x7C, 0x44)],
         acc=[]),
    dict(id="obispo", cabeza="pelo", tono="canoso", base="HOMBRE2", nombre="Obispo de Antioquía",
         lugar="Antioquía de Siria", ano="año 107",
         tunica=[(0x8A, 0x86, 0x7C), (0xC2, 0xBE, 0xB2), (0xEE, 0xEC, 0xE2)],
         acc=["palio"]),
    dict(id="viuda", cabeza="velo", tono="luto", base="MUJER3", nombre="Viuda de Tesalónica",
         lugar="Tesalónica, Macedonia", ano="año 250",
         tunica=[(0x24, 0x22, 0x2E), (0x42, 0x3E, 0x50), (0x64, 0x5E, 0x74)],
         acc=[]),
    dict(id="funcionario", cabeza="pelo", tono="castano", base="HOMBRE6", nombre="Funcionario del censo",
         lugar="Nicomedia, Bitinia", ano="año 303",
         tunica=[(0x8E, 0x88, 0x78), (0xC8, 0xC2, 0xB0), (0xF0, 0xEC, 0xDE)],
         acc=["franja"]),
    dict(id="nina", cabeza="pelo_largo", tono="rojizo", base="MUJER7", nombre="Niña de Lugdunum",
         lugar="Lyon, Galia", ano="año 177",
         tunica=[(0x2E, 0x5E, 0x44), (0x46, 0x8C, 0x66), (0x6C, 0xB8, 0x90)],
         acc=[]),
    dict(id="centurion", cabeza="casco", tono="metal", base="HOMBRE9", nombre="Centurión converso",
         lugar="Cesarea Marítima", ano="año 40",
         tunica=[(0x5E, 0x2A, 0x12), (0x92, 0x46, 0x20), (0xC0, 0x68, 0x34)],
         acc=["faja:E0C24A"]),
    dict(id="panadera", cabeza="pelo_largo", tono="rubio", base="MUJER4", nombre="Panadera del foro",
         lugar="Ostia, puerto de Roma", ano="año 150",
         tunica=[(0x7A, 0x5A, 0x22), (0xB0, 0x88, 0x36), (0xDC, 0xB2, 0x58)],
         acc=[]),
    dict(id="medico", cabeza="pelo", tono="negro", base="HOMBRE10", nombre="Médico griego",
         lugar="Corinto, Acaya", ano="año 96",
         tunica=[(0x1C, 0x4A, 0x4E), (0x2C, 0x74, 0x7A), (0x46, 0xA2, 0xA8)],
         acc=["faja:E8E0C8"]),
    dict(id="catecumena", cabeza="velo", tono="lila", base="MUJER6", nombre="Catecúmena de Alejandría",
         lugar="Alejandría, Egipto", ano="año 313",
         tunica=[(0x6E, 0x5E, 0x8A), (0x94, 0x84, 0xB4), (0xC0, 0xB4, 0xDC)],
         acc=[]),
]


def hex2rgb(s):
    return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16))


def construir_persona(p, frame):
    ruta = os.path.join(ORIG, p["base"], "FRAME%d.png" % frame)
    if not os.path.exists(ruta):
        ruta = os.path.join(ORIG, p["base"], "FRAME1.png")
    im = Image.open(ruta).convert("RGBA")
    if im.size != (W, H):
        im = im.crop((0, 0, W, H))
    px = im.load()
    repintar(px, FILAS_CAMISA, p["tunica"])
    repintar(px, FILAS_PANTALON, p["tunica"])   # camisa + pantalon = tunica larga
    repintar(px, FILAS_ZAPATO, SANDALIA)
    marco = limpiar_cabeza(px)
    dibujar_cabeza(px, p["cabeza"], p["tono"], marco)
    quitar_sueltos(px)
    for a in p["acc"]:
        if a == "palio":
            acc_palio(px)
        elif a == "cadena":
            acc_cadena(px)
        elif a == "franja":
            acc_franja_senatorial(px)
        elif a.startswith("faja:"):
            acc_faja(px, hex2rgb(a[5:]))
    return im


def quitar_sueltos(px):
    """Borra píxeles huérfanos del cuerpo: restos de adornos del sprite original
    (hojas, lazos) que quedan como motitas de otro color sobre la túnica."""
    fuera = []
    for y in range(12, H):
        for x in range(W):
            c = px[x, y]
            if c[3] == 0 or es_piel(c):
                continue
            vecinos = 0
            for (dx, dy) in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H and px[nx, ny][3] != 0:
                    vecinos += 1
            if vecinos <= 1:
                fuera.append((x, y))
    for (x, y) in fuera:
        px[x, y] = (0, 0, 0, 0)


def hoja_personas():
    n = len(PERSONAS)
    hoja = Image.new("RGBA", (W * 2, H * n), (0, 0, 0, 0))
    for i, p in enumerate(PERSONAS):
        hoja.paste(construir_persona(p, 1), (0, i * H))
        hoja.paste(construir_persona(p, 3), (W, i * H))   # frame de paso
    ruta = os.path.join(SALIDA, "personas.png")
    hoja.save(ruta)
    return ruta, (W, H, n)


def hoja_corazon():
    fs = [os.path.join(CORA, "FRAME%d.png" % i) for i in range(1, 31)]
    fs = [f for f in fs if os.path.exists(f)]
    w, h = Image.open(fs[0]).size
    hoja = Image.new("RGBA", (w, h * len(fs)), (0, 0, 0, 0))
    for i, f in enumerate(fs):
        hoja.paste(Image.open(f).convert("RGBA"), (0, i * h))
    ruta = os.path.join(SALIDA, "corazon.png")
    hoja.save(ruta)
    return ruta, (w, h, len(fs))


def b64(ruta):
    with open(ruta, "rb") as fh:
        return "data:image/png;base64," + base64.b64encode(fh.read()).decode("ascii")


def main():
    rp, (pw, ph, pn) = hoja_personas()
    rc, (cw, ch, cn) = hoja_corazon()
    catalogo = [dict(id=p["id"], nombre=p["nombre"], lugar=p["lugar"], ano=p["ano"])
                for p in PERSONAS]
    js = (
        "// GENERADO POR herramientas/generar-assets.py — NO EDITAR A MANO.\n"
        "// Sprites reciclados de CCPP (TEOLOGIA 2) y repintados al siglo I.\n"
        "window.SPRITES = {\n"
        '  personas: { w:%d, h:%d, n:%d, frames:2, src:"%s" },\n'
        '  corazon:  { w:%d, h:%d, n:%d, src:"%s" },\n'
        "  catalogo: %s\n"
        "};\n" % (pw, ph, pn, b64(rp), cw, ch, cn, b64(rc),
                  json.dumps(catalogo, ensure_ascii=False, indent=2))
    )
    destino = os.path.join(SALIDA, "sprites.js")
    with open(destino, "w", encoding="utf-8") as fh:
        fh.write(js)
    print("personas.png  %dx%d  (%d personas x 2 frames)" % (pw, ph * pn, pn))
    print("corazon.png   %dx%d  (%d frames)" % (cw, ch * cn, cn))
    print("sprites.js    %.1f KB" % (os.path.getsize(destino) / 1024.0))


if __name__ == "__main__":
    main()
