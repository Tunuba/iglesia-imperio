/* ═══════════════════════════════════════════════════════════════════
   narracion.js — lo que dice la voz en el video, paso por paso.

   La voz es la misma de la academia: es-GT-MartaNeural (acento
   guatemalteco), rate +8%, pitch +3Hz. Se genera en local con edge-tts,
   sin cuenta ni servicio de pago:

     node herramientas/generar-voz.js

   Deja un mp3 por paso en herramientas/narracion/. El grabador lee esos
   mp3, mide cuánto dura cada uno y le da a cada paso el tiempo que la
   voz necesita, para que el letrero de abajo y lo que se ve en pantalla
   vayan siempre junto con lo que se está diciendo.
   ═══════════════════════════════════════════════════════════════════ */
"use strict";

module.exports = [
  { titulo: "La presentación es la computadora",
    sub: "Los trece momentos van acá, a pantalla completa.",
    voz: "Esta es la presentación: la pantalla de la computadora. Los trece momentos " +
         "van acá, a pantalla completa, y los teléfonos sólo acompañan." },

  { titulo: "Dos códigos, en orden",
    sub: "El primero mete el teléfono a la red. El segundo abre la página.",
    voz: "Se reparten dos códigos, en orden. El primero mete el teléfono a la red de " +
         "la laptop; el segundo abre la página. No hace falta internet: la computadora " +
         "es la red." },

  { titulo: "Escanean y entran",
    sub: "Su personaje, su corazón y su pedazo del Credo.",
    voz: "Cada quien escanea y entra. En su teléfono aparece su personaje del siglo uno, " +
         "su corazón, y su pedazo del Credo. En la pantalla grande aparecen ellos mismos." },

  { titulo: "La computadora manda",
    sub: "Un toque en SIGUIENTE mueve la presentación y los teléfonos a la vez.",
    voz: "La computadora manda. Un toque en siguiente mueve la presentación y todos los " +
         "teléfonos a la vez. Desde el teléfono nadie puede adelantarse." },

  { titulo: "Cada quien apaga el suyo",
    sub: "La pantalla grande se apaga al ritmo de la sala, no con un reloj.",
    voz: "Cada quien apaga su propio corazón con el dedo. La pantalla grande no se apaga " +
         "sola: se va apagando al ritmo de la sala, y muestra cuántos van." },

  { titulo: "La luz se carga entre todos",
    sub: "Si sólo la sostiene uno, la barra se queda a la mitad.",
    voz: "La luz se carga entre todos. Si sólo la sostiene uno, la barra se queda a la " +
         "mitad; cuando la sala entera colabora, el corazón se limpia." },

  { titulo: "Los siete gestos",
    sub: "Lo que enciende cada teléfono se suma en la pantalla grande.",
    voz: "Los siete gestos se encienden tocando. Lo que enciende cada teléfono se suma en " +
         "la pantalla: los símbolos se van prendiendo con la sala, no con un temporizador." },

  { titulo: "Cada quien elige",
    sub: "Ofrecer incienso al emperador, o mantener la fe.",
    voz: "Después cada quien elige: ofrecer incienso al emperador, o mantener la fe. Cada " +
         "uno lleva encima lo que eligió, y el conteo sale en vivo." },

  { titulo: "¿Qué es el catolicismo?",
    sub: "Termina con el corazón entero de oro, en la mano de cada quien.",
    voz: "Y el cierre vuelve a la pregunta del principio. En cada teléfono queda el corazón " +
         "entero de oro, con los siete gestos cayendo dentro: lo que empezó apagado, termina " +
         "limpio y en la mano de cada uno." }
];
