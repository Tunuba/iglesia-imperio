# El Imperio y la Iglesia — presentación interactiva

**Claves del Pensamiento 1 · Universidad del Istmo · zona del segundo parcial.**
Tema: *el cristianismo católico en el Imperio romano*, en formato **For Dummies**:
5 minutos, sin leer diapositivas, sin video y sin sonido.

La idea en una línea: **la computadora manda y los teléfonos del salón obedecen.**
Cada quien escanea un QR, recibe un personaje distinto del siglo I y un pedazo del
Credo, y va viviendo la historia mientras ustedes la cuentan en voz alta.

---

## 1. Arrancar (lo único que hay que saber)

```powershell
powershell -ExecutionPolicy Bypass -File arrancar.ps1
```

Eso hace cuatro cosas: **enciende el punto de acceso de esta computadora**
(red **IMPERIO**, clave **12345678**), levanta el servidor sin ventana, abre
Chrome en la pantalla del presentador y escribe la dirección de los teléfonos.
Proyectás esa pantalla y listo: **los QR ya traen todo**.

**Esta computadora ES la red.** Los teléfonos no se conectan al WiFi del salón
ni al de tu casa: se conectan a la laptop, y ahí ella es la `192.168.137.1`.
Sin router y sin internet. Si preferís usar una red que ya existe, corré
`arrancar.ps1 -SinHotspot`.

### Por qué se apagaba el punto de acceso (y qué se hizo)

No es un capricho: Windows lo tumba por diseño en cuatro casos.

1. **Nadie conectado.** A los pocos minutos sin clientes lo apaga. Se desactiva
   con `PeerlessTimeoutEnabled=0` en el registro — **pero el ajuste no vale
   hasta reiniciar el servicio `icssvc`**, que es justo por lo que parecía no
   servir. `hotspot.ps1 -Encender` ya hace las dos cosas.
2. **La laptop se suspende o se cierra la tapa.** Se cae con todo.
3. **Cambia la red que comparte.** El punto de acceso de Windows es un adaptador
   *virtual* montado sobre el WiFi real: si el WiFi de casa parpadea o se
   reconecta, el virtual se cae con él.
4. **Ahorro de energía del adaptador.** (En esta laptop no aplica: el adaptador
   reporta `Unsupported`.)

Contra todo eso hay **dos redes de seguridad**, y las dos están probadas:

1. **Mientras corre la presentación**, el servidor lo vigila cada 5 segundos
   (`arrancar.ps1` lo lanza con `--hotspot`). La comprobación es barata: mira si
   esta computadora tiene la IP `192.168.137.x`, sin lanzar procesos.
2. **Siempre, aunque esté todo cerrado**, una tarea de Windows lo revisa cada
   minuto. Se instala una sola vez:

```powershell
powershell -ExecutionPolicy Bypass -File herramientas\instalar-vigilante.ps1
# para quitarla:  ... instalar-vigilante.ps1 -Quitar
```

*Probado de verdad:* con el servidor apagado se apagó el hotspot a mano a las
06:04:34 y la tarea lo tenía encendido de nuevo a las 06:05:01 — 27 segundos,
sola. Con el servidor corriendo, menos de diez.

**¿Y los teléfonos que ya estaban conectados?** No tienen que hacer nada: la red
vuelve con el mismo nombre y la misma clave, así que el teléfono se reconecta
solo porque ya la conoce. Y la página se pone al día sola: cuando el canal
vuelve, cada teléfono se vuelve a presentar y la computadora le contesta con la
escena en la que va.

Si en ese hueco alguien mira la pantalla, el presentador muestra un aviso en
rojo en vez de dejar creer que todo está bien.

**Lo único que no se puede arreglar desde acá** es que la laptop se duerma:
tenela enchufada y sin suspensión durante la presentación.

Para parar todo: `powershell -ExecutionPolicy Bypass -File arrancar.ps1 -Parar`

### La pantalla del presentador (`presentador.html`)

| Tecla / botón | Qué hace |
|---|---|
| `→` o **SIGUIENTE** | mueve **todos** los teléfonos a la escena siguiente |
| `←` | los devuelve una escena |
| `1` … `8` | salta directo a esa escena |
| los números del Credo | pone ese pedazo en grande y **hace vibrar el teléfono que lo tiene** |
| `G` | abre el guion minuto a minuto |
| **Sala nueva** | cambia el código (y saca a los que estaban) |

Arriba a la derecha se ve el estado del canal y **cuántos teléfonos hay conectados**.
En el centro, la sala se va llenando con el personaje de cada uno: eso es la prueba
en vivo de que están todos adentro. No pases de escena hasta ver subir la cuenta.

---

## 2. Cómo se conectan los teléfonos (tres caminos, en orden)

La página elige sola, sin que nadie configure nada. Los tres están medidos:

| Camino | Necesita internet | Cuántos | Retraso medido |
|---|---|---|---|
| **1. Esta computadora** (`arrancar.ps1`) | **No** | todos los que quepan en el WiFi | **20 ms** |
| **2. Hotspot de la laptop** (`herramientas/hotspot.ps1 -Encender`) — red **IMPERIO**, clave **12345678** | **No** | **máximo 8** (límite de Windows) | 20 ms |
| **3. Internet** (GitHub Pages + relé público) | Sí, en cada teléfono | sin límite | ~90 ms |

*(Medido con `node herramientas/prueba-sala.js`: 30 de 30 teléfonos recibieron cada
mensaje por el camino 1, y 12 de 12 por el camino 3.)*

### Los dos códigos de la pantalla

Cuando esta computadora es el punto de acceso, la pantalla muestra **dos QR en orden**:

1. **Conectate al WiFi** — es un código de red (formato `WIFI:T:WPA;S:…;P:…;;`, el que
   entienden las cámaras de Android y iPhone). Al escanearlo el teléfono **se une a la
   red sin que nadie escriba la clave**.
2. **Abrí la página** — la dirección de la computadora en esa red.

**¿Un solo QR que haga las dos cosas?** No existe: ningún estándar mete una red WiFi y
una dirección web en el mismo código. Por eso van dos, uno al lado del otro.
Lo más cerca sería el aviso de «iniciar sesión en la red» que sale a veces al conectarse;
el servidor ya responde a esas sondas (`/generate_204`, `/hotspot-detect.html`), pero
depende de a qué DNS pregunte el teléfono y **no se puede prometer**.

**¿Y sin contraseña?** Windows **no permite** un hotspot abierto: exige clave de 8
caracteres o más. Por eso está puesta la más simple posible y, sobre todo, por eso está
el QR de la red: nadie la escribe. Para cambiarla:

```powershell
powershell -ExecutionPolicy Bypass -File herramientas\hotspot.ps1 -Nombre "IMPERIO" -Clave "12345678" -Encender
powershell -ExecutionPolicy Bypass -File herramientas\hotspot.ps1 -Apagar
```

**Lo importante:** el teléfono y la computadora tienen que verse. Eso pasa si:

- están en el **mismo WiFi** (el de tu casa sirve **aunque no haya internet**: lo que
  importa es que la red exista); o
- la laptop pone el hotspot (**hasta 8 teléfonos**, es un tope de Windows, no del código); o
- **un teléfono pone el hotspot** y la laptop se conecta a él. Este es el plan que
  nunca falla y no necesita datos móviles: alcanza con que la red exista. Suele
  aguantar 10 aparatos.

> En la red de la universidad puede pasar que el WiFi **aísle** a los aparatos entre
> sí (por seguridad). Si al probar en el salón el teléfono no abre la página, ese es
> el motivo: pasá al hotspot. Y si nada de eso funciona, queda el camino 3, que va
> por internet y no depende de la red del salón.

**Probalo hoy en tu casa (2 minutos):** corré `arrancar.ps1`, conectá el teléfono
al mismo WiFi y escaneá el QR. El firewall de Windows ya tiene permitido este
`node.exe`, así que no debería pedirte nada.

### Si el canal se cae

No pasa nada. Cada teléfono **sigue funcionando solo**: tiene sus propios botones y
avanza cuando la persona toca. Vos cantás los pasos («todos avancen»). La sincronía
es un lujo, nunca un requisito.

---

## 3. Quién muestra qué

**La presentación es la pantalla de la computadora.** Ahí van los trece momentos, a
pantalla completa, con el visual grande y **sin párrafos**: el texto son ustedes
hablando. Con `T` se quitan hasta los títulos y queda sólo la imagen; con `H` se
esconde la barra de control; con `F`, pantalla completa.

**El teléfono acompaña.** Cada quien tiene tres cosas suyas y nada más:

- su **personaje** (uno de 16 del siglo I, con su ciudad y su año),
- su **corazón**, que late, se ennegrece con el pecado y se vuelve oro con la luz,
- su **pedazo del Credo**, que se enciende y vibra cuando el presentador lo lee.

Y toca cuando toca: apagar el punto, sostener la luz, votar. Nada de párrafos a
propósito — si hubiera texto, la clase leería el teléfono en vez de mirar y escuchar.

### Los trece momentos

**Apertura.** 1 · ¿Qué significa salvarse? (la Tierra girando) · 2 · Cae una semilla ·
3 · Uno se separa (el pecado) · 4 · Y entonces baja (**la luz es de toda la sala**) ·
5 · Problema, respuesta, meta.

**Los tres elementos.** 6 · Lo que creen (la Trinidad) · 7 · Cómo lo celebran (los siete
sacramentos) · 8 · Cómo se comportan (perdón, justicia, ayuda).

**La historia.** 9 · El águila (votan, y el conteo sale en la pantalla grande) ·
10 · 313, Edicto de Milán · 11 · 380, Edicto de Tesalónica.

**Cierre.** 12 · Hoy (escuelas, hospitales, catedrales, y el salto a América) ·
13 · El Credo, repartido.

### Cómo está hecho el dibujo

Dos capas que nunca se pisan, separadas por una línea de horizonte: **arriba 3D**
—puntos en el espacio proyectados a mano sobre un canvas 2D, sin WebGL ni
librerías, el mismo espíritu del vuelo de MAURYA— y **abajo el pixel art** de
CCPP. Como cada punto 3D se pinta como un cuadrito, las dos técnicas hablan el
mismo idioma.

### La música

Suena **«Coro de Mármol»** (`assets/musica/coro-de-marmol.mp3`, 5:55, justo el
largo de la presentación). Empieza sola en el primer **SIGUIENTE** —que es el
primer gesto del presentador, el único momento en que el navegador deja empezar
a sonar algo— y se corta con la tecla **M**. Entra con un desvanecido de un
segundo, no de golpe.

Suena **sólo en esta computadora**: los teléfonos van mudos a propósito, porque
veinte altavoces desfasados no son música, son ruido.

Si el archivo no está, cae solo a un pad sintetizado con WebAudio, con un acorde
por momento (menor y grave en el pecado, mayor y amplio cuando baja la luz), para
que la presentación nunca se quede sin fondo.

> Ojo con la regla de la tarea: pide evitar sonidos propios. Esto es música de
> fondo, no voces grabadas, pero si la catedrática lo prefiere sin nada, se
> apaga con una tecla.

⚠ El archivo se carga **al darle play, no antes**. Precargarlo bajaba ocho megas
justo cuando los teléfonos estaban entrando y se comía una de las seis
conexiones del navegador: de cuatro teléfonos entraban tres y SIGUIENTE no movía
a nadie. Lo cazó `prueba-integracion.js`.

## 5. Los archivos

```
index.html          la página del teléfono (las 8 escenas)
presentador.html    la pantalla que se proyecta: QR, la sala y los controles
arrancar.ps1        un clic: servidor + Chrome + direcciones
assets/
  sprites.js        los personajes y el corazón, en base64 (los genera el script)
  qr.js             generador de QR propio, sin librerías
  sala.js           el canal computadora → teléfonos
herramientas/
  servidor.js       el servidor de la sala (Node puro, sin dependencias)
  hotspot.ps1       enciende/apaga el punto de acceso de Windows
  generar-assets.py rehace assets/sprites.js desde los sprites de CCPP
  prueba-sala.js    prueba de reparto (N teléfonos simulados)
  comprobar-qr.py   verifica el generador de QR contra Python + un lector real
  comprobar-qr.js   compara módulo a módulo
```

### De dónde salen los dibujos

Los 16 personajes **no son imágenes bajadas de internet**: salen de los sprites de
**CCPP** (`TEOLOGIA 2\CCPP\DISEÑOS\PERSONAJES`, 18×25 px) repintados al siglo I por
`herramientas/generar-assets.py`, con el mismo método del generador original: se
trabaja por filas (pelo 0–7, cara 8–14, ropa 15–21, calzado 22–24), se pinta camisa
y pantalón con **una sola** paleta para que la camisa corta se vuelva túnica larga,
y la cabeza se **borra y se vuelve a dibujar** con un mapa canónico (pelo, velo,
capucha, casco). Tres cosas que costaron encontrarlas, todas visibles a ojo:
reutilizar la silueta del peinado original dejaba píxeles sueltos sobre la cara;
borrarla del todo dejaba **huecos a los lados** y la cabeza parecía flotar (ahora
esa silueta se repinta, y se rellena por tramos para que los mechones sueltos no
se vean como rayas); y el penacho del casco tocaba la fila 0, así que salía
cortado por el borde de arriba.
El corazón que late son los 30 cuadros de `DISEÑOS\CORAZON`, teñidos en vivo por
luminancia (rosa → negro → oro).

Para rehacerlos: `python herramientas/generar-assets.py`

### Si tocás algún `assets/*.js`

Subile el número a `?v=` en los `<script src=...>` de las dos páginas. Sin eso, un
teléfono que ya abrió la página se queda con el archivo viejo (pasó durante el
desarrollo y cuesta media hora de fantasmas).

---

## 6. Qué está comprobado, y con qué

Nada de esto es "se ve bien": son mediciones, y se pueden repetir.

```powershell
node herramientas/comprobar-pantalla.js  http://127.0.0.1:8123 --fotos
node herramientas/prueba-integracion.js  http://127.0.0.1:8123
node herramientas/prueba-sala.js         http://127.0.0.1:8123 30
python herramientas/comprobar-qr.py && node herramientas/comprobar-qr.js
python herramientas/comprobar-qr.py --decodificar
```

- **Que nada se solape** — `comprobar-pantalla.js` abre las dos páginas en un
  Chrome sin ventana y mide, escena por escena, **todos** los elementos: si dos
  se cruzan o alguno se sale, lo dice. Y mide también **dentro del lienzo**,
  porque cada escena declara la caja de lo que dibuja. Resultado actual:
  **28 pantallas limpias** (13 escenas × 390×800 y 360×640, más el presentador
  en 1920×1080 y 1366×768). Esto encontró que el personaje se salía del lienzo
  por la derecha, que a ojo parecía correcto.
- **Que la sala funcione** — `prueba-integracion.js` levanta el presentador y
  cuatro teléfonos de verdad y comprueba las **ocho** cosas que importan: que
  entren, que SIGUIENTE los mueva a todos, que con media sala la luz **no** se
  abra, que con toda la sala **sí**, que el pedazo del Credo encienda **sólo**
  al teléfono que lo tiene, y que los votos lleguen. Las ocho pasan.
- **Reparto a muchos** — 30 de 30 teléfonos, 20 ms, sin tocar internet.
- **El QR** — idéntico a la librería de Python y leído por un lector real (zbar).
- **Sin internet** — servida desde la laptop, la página no hace **ni un** pedido
  a internet (medido con el inspector de red).

Tres cosas que encontraron las pruebas y que a ojo no se veían:

1. `canal` y `Musica` se usaban antes de declararse: eso **rompía la página
   entera** al cargar (los botones no respondían).
2. La carga de la luz iba con `setInterval`, y el navegador lo estrangula cuando
   la pantalla no está al frente: tres segundos sosteniendo cargaban 0.09 en vez
   de 1. Ahora va por tiempo real.
3. Un mismo Chrome sólo admite **seis conexiones por origen**: con seis pestañas
   abiertas, la séptima se queda en cola para siempre. En clase no pasa (cada
   teléfono es un navegador distinto), pero por eso la prueba usa cuatro.

## 7. Fuentes

- Rodrigo Ricardo (2025). *Catolicismo Romano | Historia, creencias y símbolos*. Estudyando.
- Holyart. *La historia de los dogmas de la Iglesia católica*.
- Juan Pablo II (9 de marzo de 1988). *Audiencia general*. vatican.va
- Vatican News (2025). *El Credo de Nicea, documento de identidad del cristiano*.
- Edictos de Milán (313) y de Tesalónica (380); concilios de Nicea (325),
  Constantinopla I (381), Éfeso (431) y Calcedonia (451).

El texto del Credo que se reparte es el **niceno-constantinopolitano** en su versión
litúrgica en español, partido en 16 pedazos.
