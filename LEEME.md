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

Eso hace tres cosas: levanta el servidor en esta computadora (sin ventana), abre
Chrome en la pantalla del presentador y escribe la dirección para los teléfonos.
Proyectás esa pantalla y listo: **el QR ya trae la dirección correcta**.

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

## 3. Qué ve el que escanea (2 minutos de juego)

Ocho pantallas cortas. Ustedes hablan encima; el teléfono solo acompaña.

1. **Portada** — «tres siglos en dos minutos».
2. **Tu personaje** — le toca uno de 16: pescador de Galilea, esclava de una casa
   rica, legionario, viuda de Tesalónica, catecúmena de Alejandría… con su ciudad y su año.
3. **El camino** — la noticia viaja por las carreteras romanas, ciudad por ciudad,
   hasta Roma. Dato: *katholikós* = universal (Ignacio de Antioquía, año 107).
4. **La prueba** — «ofrecé un grano de incienso al emperador o negate».
   Los que ceden son los *lapsi*; los que no, mártires. **Acá el corazón se ennegrece.**
5. **Baja la luz** — mantienen el dedo en la pantalla y el corazón negro se vuelve
   oro: es el **bautismo**, y con él la **Trinidad**.
6. **313 · 325 · 380** — Milán, Nicea, Tesalónica. El mapa se enciende de oro.
7. **Tu pedazo del Credo** — a cada uno le tocó una de las 16 frases. *«Cuando
   escuches la tuya, levantá el teléfono.»*
8. **Modo sala** — queda latiendo en oro con datos de hoy. Puede quedarse ahí todo
   el rato que ustedes sigan hablando.

Abajo del todo hay **+ VER TODO**: el resumen completo, la línea de tiempo, las
fuentes y las tres confusiones típicas. Eso es para leer después, no en clase.

---

## 4. El guion de 5 minutos

Está también dentro de la pantalla del presentador (tecla `G`), para no tener papeles.

**Minuto 1 — qué es esto y por qué me importa.** Escenas 1–3.
«Todos ustedes acaban de recibir un personaje: gente común del Imperio.» Año 33,
matan a un maestro en una provincia chica y sus seguidores dicen que resucitó. La
noticia viaja por las carreteras que Roma construyó para sus ejércitos: un solo
territorio, un idioma comercial, caminos seguros. Nunca una idea había corrido tanto.

**Minutos 2 a 4 — los hitos.** Escenas 4–6.
- *La prueba*: que elijan en el teléfono. Preguntá en voz alta quién se negó.
  Tertuliano: «la sangre de los mártires es semilla de cristianos».
- *Baja la luz*: que sostengan el dedo. El corazón se limpia: eso es el bautismo,
  la puerta de entrada, y ahí explicás la Trinidad.
- *Las tres fechas*: **313** Edicto de Milán (Constantino y Licinio) — deja de ser
  delito. **325** Nicea — unos 300 obispos meten la fe en una sola frase. **380**
  Edicto de Tesalónica (Teodosio) — religión oficial.
  Remarcá: **313 permite, 380 impone. No es lo mismo.**

**Minuto 5 — cómo cambió el mundo.** Escenas 7–8.
Abrís los pedazos del Credo y los vas leyendo en orden: cada quien levanta el
teléfono cuando escucha el suyo. *«Ninguno lo tiene entero. Entre todos, sí.»*
Cierre: el Credo de la misa es esa frase, el Papa es el obispo de Roma, el
calendario cuenta desde Jesús, y hoy son unos 1,400 millones.

### Por qué nos tocaron esos tres elementos

- **Dogmas** = *qué creo* → el Credo (y por eso el Credo es el centro del juego).
- **Ritos** = *qué hago* → el bautismo (y por eso se “hace” con el dedo).
- **Ética** = *cómo vivo* → la dignidad de toda persona, incluido el esclavo.

### Tres cosas que conviene no confundir (si alguien pregunta)

1. **21 son los concilios, no los dogmas.** Los dogmas están resumidos en el Credo.
2. El Credo que se reza hoy es de **dos** concilios: Nicea (325) y Constantinopla (381).
3. El «y del Hijo» (*Filioque*) es un **añadido latino posterior**; pesa en el cisma
   con los ortodoxos.

Reglas del trabajo que se están respetando: sin video, sin sonidos ni voces
grabadas, con imágenes y animación, y sin leer la pantalla — la pantalla no tiene
párrafos para leer, tiene cosas que pasan.

---

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
capucha, casco). Ese último paso es el que importa: reutilizar la silueta del
peinado original dejaba píxeles sueltos a la altura de los ojos y bordes grumosos.
El corazón que late son los 30 cuadros de `DISEÑOS\CORAZON`, teñidos en vivo por
luminancia (rosa → negro → oro).

Para rehacerlos: `python herramientas/generar-assets.py`

### Si tocás algún `assets/*.js`

Subile el número a `?v=` en los `<script src=...>` de las dos páginas. Sin eso, un
teléfono que ya abrió la página se queda con el archivo viejo (pasó durante el
desarrollo y cuesta media hora de fantasmas).

---

## 6. Qué está comprobado, y con qué

- **Reparto a muchos teléfonos**: `node herramientas/prueba-sala.js http://IP:PUERTO 30`
  → *30 de 30, entre 20 y 92 ms*. Por internet, 12 de 12 entre 84 y 325 ms.
- **Sin internet**: con la página servida desde la laptop, el teléfono **no hace ni
  un solo pedido a internet** (medido con el inspector de red: todo va a la IP de
  la computadora).
- **El QR**: `python herramientas/comprobar-qr.py && node herramientas/comprobar-qr.js`
  compara módulo a módulo contra la librería `qrcode` de Python (7 casos, versiones
  1 a 9), y `python herramientas/comprobar-qr.py --decodificar` los **lee con un
  lector real** (zbar). Los 7 se leen.
- **El hotspot de Windows**: responde y reporta su SSID y clave, con un tope de
  **8 aparatos**.

---

## 7. Fuentes

- Rodrigo Ricardo (2025). *Catolicismo Romano | Historia, creencias y símbolos*. Estudyando.
- Holyart. *La historia de los dogmas de la Iglesia católica*.
- Juan Pablo II (9 de marzo de 1988). *Audiencia general*. vatican.va
- Vatican News (2025). *El Credo de Nicea, documento de identidad del cristiano*.
- Edictos de Milán (313) y de Tesalónica (380); concilios de Nicea (325),
  Constantinopla I (381), Éfeso (431) y Calcedonia (451).

El texto del Credo que se reparte es el **niceno-constantinopolitano** en su versión
litúrgica en español, partido en 16 pedazos.
