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

> Windows apaga el punto de acceso solo a los pocos minutos si nadie se conecta.
> El script desactiva ese apagado automático (necesita permisos de
> administrador; si no los tiene, avisa y sigue igual).

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

## 3. Qué ve el que escanea · las trece escenas

Ustedes hablan encima; el teléfono acompaña. **Nunca hay dos cosas en pantalla a
la vez**: cada escena vive sola, y eso está verificado midiendo (ver §6).

**Apertura**
1. **¿Qué significa salvarse?** — la Tierra girando en 3D, hecha de puntos.
2. **Cae una semilla** — Dios crea por amor; a cada quien le toca uno de 16
   personajes del siglo I y un corazón que late.
3. **Uno se separa** — tocan el punto que se aleja: se apaga y su corazón se
   ennegrece. *Pecado es dañar la relación con Dios.*
4. **Y entonces baja** — sostienen el dedo para cargar la luz. **La barra es de
   toda la sala**: si sólo carga la mitad, no se abre. Ese gesto es el bautismo.
5. **Problema, respuesta, meta** — el pecado, Jesús, la salvación.

**Los tres elementos**
6. **Lo que creen** — la Trinidad, y la Iglesia que pasa la fe.
7. **Cómo lo celebran** — los siete sacramentos, con la Eucaristía al centro.
8. **Cómo se comportan** — amar a Dios y al prójimo: perdón, justicia, ayuda.

**La historia**
9. **El águila** — votan: ofrecer incienso o mantener la fe. El conteo sale en
   vivo en la pantalla del presentador.
10. **313** — Edicto de Milán, y Nicea en 325.
11. **380** — Edicto de Tesalónica: religión oficial.

**Cierre**
12. **Hoy** — escuelas, hospitales, catedrales, y el salto a América.
13. **Tu pedazo del Credo** — cuando el presentador lo lee, ese teléfono se pone
    dorado y vibra. *Ninguno lo tiene entero; entre todos, sí.*

Abajo hay **+ LA INVESTIGACIÓN**: el texto completo, la línea de tiempo y las
referencias en APA. Es para leer después, no en clase.

### Cómo está hecho el dibujo

Dos capas que nunca se pisan, separadas por una línea de horizonte: **arriba 3D**
—puntos en el espacio proyectados a mano sobre un canvas 2D, sin WebGL ni
librerías, el mismo espíritu del vuelo de MAURYA— y **abajo el pixel art** de
CCPP. Como cada punto 3D se pinta como un cuadrito, las dos técnicas hablan el
mismo idioma.

### La música

La pantalla del presentador puede tocar música con la tecla **M**. Está
sintetizada en el momento con WebAudio: no hay archivos, no hay descargas y no
hay voces grabadas. Suena **sólo en la computadora** (veinte teléfonos
desincronizados serían ruido) y **arranca apagada**, porque la tarea pide evitar
sonidos: encenderla es decisión de ustedes. Cada momento tiene su acorde: menor
y grave en el pecado, mayor y amplio cuando baja la luz.

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
