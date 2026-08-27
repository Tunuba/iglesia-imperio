# TRASPASO — estado al 2026-08-27, 12:40

**Se presenta HOY.** Esto es lo que hay, lo que falta y las trampas que ya se pagaron.

## Lo esencial en tres líneas

- **La presentación es la pantalla de la computadora** (`presentador.html`), a pantalla
  completa y sin párrafos. Lo pidió José David: *«todo lo visual es lo que se iba a
  presentar en la pc… y sin texto, va voz, sólo los visuales»*.
- **El teléfono acompaña** (`index.html`): su personaje, su corazón (late → se ennegrece
  → se vuelve oro). **No tiene forma de avanzar**: eso lo manda
  la computadora.
- **El teléfono casi no tiene letra, a propósito** (lo pidió José David: *«que no se vea
  sobrecargado de info, mejor casi nada de info»*). El nombre del curso se apaga después
  de la primera pantalla; el personaje se presenta en el momento *«este corazón es el
  tuyo»*, vuelve cuando toca elegir y se queda al final. En el resto queda el corazón
  solo, con brasas de fondo del color del momento.
- Arrancar todo: `powershell -ExecutionPolicy Bypass -File arrancar.ps1`

## Cómo se corre

| | |
|---|---|
| Proyectar | `http://localhost:8123/presentador.html` |
| Teléfonos | `http://192.168.137.1:8123` (la raíz, sin nada pegado) |
| WiFi | red **IMPERIO**, clave **12345678** (es la laptop) |
| Respaldo por internet | `https://tunuba.github.io/iglesia-imperio/` |

Teclas del presentador: `← →` escena · `1–9` saltar · `T` quitar **todo** el texto ·
`D` teléfono de demostración · `H` esconder la barra · `F` pantalla completa ·
`M` música · `G` guion · `Esc` cerrar.

**Tecla `D`:** abre un teléfono de verdad dentro de la pantalla grande (es la misma
página, en un iframe). Sirve para demostrar sin sacar el celular y para usar los
botones táctiles con el mouse: tocar el corazón, sostener la luz, votar. Entra a la
misma sala, así que suma a la luz y su voto cuenta.

**La última escena** vuelve a la pregunta del principio (*¿qué es el catolicismo?*) y en
cada teléfono queda el corazón entero de oro, con los siete gestos cayendo dentro.
El Credo se quitó entero — lo pidió José David: no tenía que ver con la exposición.
También se avanza haciendo **clic en la mitad derecha/izquierda** de la pantalla.

## Los trece momentos

1 ¿Qué significa salvarse? (Tierra 3D) · 2 Cae una semilla · 3 Uno se separa (el pecado) ·
4 Y entonces baja (**la luz es de toda la sala**) · 5 Problema · respuesta · meta ·
6 Un solo Dios en tres personas · 7 Siete gestos · 8 Amar a Dios y al prójimo ·
9 Elegí vos (votan) · 10 313 · 11 380 · 12 Escuelas, hospitales, catedrales ·
13 ¿Qué es el catolicismo? · el cierre, con el corazón entero de oro.

## Qué está probado (y con qué)

```powershell
node herramientas/comprobar-pantalla.js  http://127.0.0.1:8123 --fotos
node herramientas/prueba-integracion.js  http://127.0.0.1:8123
node herramientas/prueba-sala.js         http://127.0.0.1:8123 30
python herramientas/comprobar-qr.py && node herramientas/comprobar-qr.js
```

- **28 pantallas sin solapes ni desbordes** (13 escenas en dos tamaños de teléfono +
  el presentador en 1920×1080 y 1366×768). Mide también **dentro del lienzo**, con las
  cajas que declara cada escena.
- **11 de 11 pruebas de integración**: que entren, que SIGUIENTE los mueva a todos, que
  **los botones del teléfono aparezcan en su escena** (2 apagar, 3 sostener, 8 votar),
  que **tocando el corazón** se apague, que con media sala la luz **no** se abra, que con
  toda **sí**, que los votos lleguen, y que **la pantalla hable por la propia
  computadora** y no por un relé.
  Ojo al correrlas: si hay pestañas abiertas contra la misma sala, cuentan como teléfonos
  y la primera prueba falla diciendo «5 teléfonos» cuando entraron 4.
- **30 de 30 teléfonos, 20 ms**, sin tocar internet.
- El QR: idéntico a la librería de Python y **leído por un lector real** (zbar).

## El guion manda

Todo lo que se ve sale de **el guion** (está completo en `LEEME.md`): el corazón
que late, el que se oscurece, el signo de interrogación, los tres puntos en
triángulo, los siete símbolos (agua, fuego, manos, anillos, copa, aceite, cruz)
con la copa creciendo al centro, las dos siluetas con el corazón en medio y las
palabras *perdón · justicia · ayuda*, las coronas del **313** y el **380**, y
escuela–hospital–catedral. Si algo se cambia, se cambia **contra el guion**:
José David lo está memorizando.

## Lo que hace el teléfono con el dedo

- **El corazón sólo sale donde es de uno**: cuando te lo dan, cuando se apaga, cuando
  se carga, cuando elegís y al final lleno de oro. En los demás momentos hay un dibujo
  propio (`assets/motivos.js`): un corazón quieto invita a apretarlo y no pasa nada.
- **El corazón se toca.** En *«tocá para apagarlo»* se apaga tocando el corazón mismo
  (el botón de abajo sigue: es el que dice QUÉ hacer). En *«sostené»* se carga con el
  dedo sobre el corazón o sobre el botón, da igual. En cualquier otro momento, tocarlo
  suelta unas chispas: nunca se siente muerto.
- **Y hay más momentos que se tocan**: los tres puntos de la Trinidad (3 toques), los
  siete gestos (7), las tres palabras que salen del corazón (3) y las tres obras que se
  levantan (3). Cada toque viaja a la computadora.
- **La suma de la sala se ve en vivo en la pantalla grande**: *«10 de 14 gestos
  encendidos»*, *«1 de 2 ya lo apagaron»*, *«5 de 6 obras levantadas»*. Los siete
  símbolos del proyector se encienden con los de la sala, **no con un temporizador**, y
  el corazón grande se apaga al ritmo de los teléfonos. La computadora **siempre** puede
  seguir con SIGUIENTE sin esperar a nadie.
- En la fila de gente, **cada quien lleva su cuenta encima**; al sostener la luz
  parpadea, y al votar lleva el pebetero o la cruz.
- **El voto enciende o apaga la pantalla del teléfono**, como dice el guion.
- **Un anillo alrededor del corazón** muestra lo que llevás cargado, sin números.
- **Vibra**: corto al tocar, un golpe al apagarse, tres tiempos al votar y un patrón
  largo al cerrar, cuando el corazón queda entero de oro.
- **Brasas**: polvo que sube despacio, del color del cielo de cada momento; al tocar
  salen chispas desde el centro del corazón (ceniza al apagarlo, oro al purificarlo).
- **El cierre**: los siete gestos giran y caen dentro del corazón de oro.
- **Lo que quedó de esto**, en la escena «Escuelas, hospitales, catedrales» del
  proyector y pasando de a una en el teléfono: Bolonia 1088, San Carlos de Guatemala
  1676, los primeros hospitales (s. IV), las catedrales góticas (s. XII), la Capilla
  Sixtina 1512 y la música escrita (s. XI). Dibujadas en píxeles: mismo lenguaje que
  todo lo demás y sin pedirle permiso a nadie por una imagen.

## El video de demostración

```powershell
node herramientas/generar-voz.js                       # la narración (una vez)
node herramientas/grabar-demo.js http://127.0.0.1:8123 12
```

- **La voz** es la misma de la academia: `es-GT-MartaNeural`, acento guatemalteco,
  `rate +8%`, `pitch +3Hz`, con **edge-tts** en local y gratis. El texto de los nueve
  pasos vive en `herramientas/narracion.js`; los mp3 en `herramientas/narracion/`.
- **Cada paso dura lo que dura su narración**: primero se mide el mp3 y después se
  captura ese tiempo, así el letrero y lo que se ve van con lo que se está diciendo.
- **La música** es `assets/musica/coro-de-marmol.mp3`, al 16 % y por debajo de la voz,
  con entrada y salida suaves.
- **El letrero va abajo, centrado y grande** (antes era una cajita a la derecha que
  además tapaba el teléfono 2).
- El estudio graba **en su propia sala** (`?s=…`): si no, cuenta los teléfonos que
  alguien tenga abiertos y el video sale diciendo «3 teléfonos» con dos en pantalla.

## Lo que falta
4. Decidir qué hacer con el repo público `Tunuba/iglesia-imperio` (dejarlo, privado o
   borrarlo). Pages sólo funciona si es público.

## Las trampas que ya se pagaron (no volver a pisarlas)

- **El salón partido en dos, y las dos mitades en verde.** La pantalla se conectaba por
  `ntfy.sh` mientras los teléfonos (que entran por la propia compu) estaban en el hub
  local: dos salas distintas con el mismo nombre. En el teléfono **no aparecía ningún
  botón** — nunca le llegaba la escena — y tanto la pantalla («sala abierta») como el
  teléfono (su lucecita verde) decían que todo estaba bien. La causa era una **carrera**:
  `sala.js` le daba 1.8 s a `/sala/ping` para decidir el camino, y si el ping llegaba
  tarde (seis conexiones por origen: música, sprites, SSE) arrancaba por el relé y ahí se
  quedaba para siempre. Ahora **la compu que sirve la página va primero sin preguntar**,
  el ping sólo confirma (y si hay sala local, **no hay respaldo**: se reintenta la local),
  y el estado de la pantalla **dice por dónde habla**: `sala abierta · esta computadora`.
- **El historial podía hacer retroceder al teléfono.** `recuperar()` contesta por su
  cuenta y a veces llegaba *después* de una escena en vivo: el teléfono volvía a una
  escena vieja justo cuando la clase avanzaba, y se quedaba sin sus botones. Ya no se
  aplica el historial si alguna escena en vivo entró antes.
- **El arnés aprobaba tocando otra cosa.** Las pruebas movían la luz llamando
  `__sostiene()` y `__paso()` a mano: daban verde con los botones del teléfono **sin
  dibujarse**, que es justo lo que iba a tocar la clase. Ahora se miran los botones.
- **El teléfono de demostración (`D`) no cabía en la laptop.** 600 px de alto + barra +
  el control de abajo: la barra con la **✕** se dibujaba *arriba* del borde de la
  pantalla y no había forma de cerrarlo. Su alto ahora es `calc(100vh - 190px)`.
- **Traer una pestaña al frente en las pruebas rompe a las otras.** Se intentó
  `bringToFront()` para poder medir el ennegrecido: la pestaña medida quedó bien y las
  otras tres se congelaron (una se quedó en la escena 2 mientras la pantalla iba en la
  9) y cayeron tres pruebas que no tenían nada que ver. Lo que se mide del toque es su
  efecto **inmediato** (el rótulo cambia, el botón se retira), no la animación.
- **`rAF` congelado miente sobre el corazón.** Midiendo sin foco en la ventana, el
  corazón «no se ennegrecía» (`negrura` quedaba en 0) y parecía un bug: era el navegador
  frenando `requestAnimationFrame` a 1 cuadro por segundo. Con un clic real del mouse
  (ventana enfocada) llega a 1. Lo mismo vale para la luz.

- **`canal` y `Musica` usados antes de declararse** rompían la página entera al cargar
  y los botones no respondían. Cuidado con el orden de los `let/const`.
- **`setInterval` se estrangula** cuando la pantalla no está al frente: tres segundos
  sosteniendo cargaban 0.09 en vez de 1. Todo lo animado va por **tiempo real** (delta).
- **El atributo `width` de un `<canvas>`** vale como `width:300px` y le gana a
  `left/right` si el CSS no declara ancho: la franja de la gente medía 432 px en vez de
  1600 y los sprites salían cortados. Siempre `width:100%`.
- **`preload="auto"` en el mp3** bajaba 8 MB justo cuando entraban los teléfonos y se
  comía una de las **seis conexiones por origen** de Chrome: de cuatro teléfonos
  entraban tres. Va con `preload="none"`.
- **El código de sala lo manda el servidor.** Antes lo sorteaba cada navegador y
  quedaban en salas distintas sin que se notara (la pantalla decía NICEA91 y ellos
  entraban a NICEA25).
- **El dibujo nació vertical.** En proyector hay que encuadrarlo: área centrada, margen
  reservado arriba para el título y escala ×1.45. Si no, todo sale diminuto y pegado abajo.
- **Windows apaga el hotspot solo.** Se desactiva con `PeerlessTimeoutEnabled=0` **y
  reiniciando `icssvc`** (ese era el paso que faltaba). Encima hay dos vigilantes: el
  servidor cada 5 s y una tarea de Windows cada minuto.
- Al editar estos archivos con scripts, **verificar que el reemplazo se aplicó**: dos
  veces falló por un espacio y el fallo apareció mucho después.

## Los archivos

```
presentador.html   LA PRESENTACIÓN (pantalla completa, 13 momentos)
index.html         el teléfono (corazón, personaje, acción)
arrancar.ps1       un clic: hotspot + servidor + Chrome
assets/
  escenas.js       el dibujo de las 13 escenas, compartido por las dos pantallas
  sprites.js       personajes y corazón en base64 (los genera generar-assets.py)
  qr.js            generador de QR propio, verificado contra Python y con zbar
  sala.js          el canal computadora → teléfonos (hub local, luego ntfy)
  musica/coro-de-marmol.mp3
herramientas/
  servidor.js          servidor + canal + vigilante del hotspot (Node puro)
  vigilante.ps1        mantiene el punto de acceso encendido
  instalar-vigilante.ps1  lo deja como tarea de Windows (cada minuto)
  hotspot.ps1          enciende/apaga/renombra el punto de acceso
  comprobar-pantalla.js  verificador de solapes (28 pantallas)
  prueba-integracion.js  las 8 pruebas de la sala
  prueba-sala.js         reparto a N teléfonos
  grabar-demo.js + estudio.html   el video de demostración
  generar-assets.py      rehace los sprites desde CCPP
  comprobar-qr.py/.js    verifican el QR
```
