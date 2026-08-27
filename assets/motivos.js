/* ═══════════════════════════════════════════════════════════════════
   motivos.js — lo que se dibuja y se toca en el teléfono, momento a
   momento. SALE DEL GUION, no de la imaginación:

     «tres puntos de luz conectados en triángulo, laten juntos»
     «siete símbolos: agua, fuego, manos, anillos, copa, aceite, cruz»
     «la copa crece al centro»
     «dos siluetas frente a frente, con un corazón de luz entre ellas»
     «del corazón salen palabras: perdón, justicia, ayuda»
     «aparece una corona y el número 313 · … y el 380»
     «íconos rápidos: una escuela, un hospital, una catedral»

   El corazón de verdad (el que late, se apaga y se vuelve oro) vive en
   index.html; acá está todo lo demás. Cada motivo recibe cuánto lleva
   hecho ESTE teléfono (toques) para que el dibujo sea el marcador: no
   hace falta un número en pantalla.

   Motivos.pinta(ctx, clave, lado, t, extra)
     extra = { persona, otra, toques, meta, num }

   Todo sobre una cuadrícula de 32×32, los mismos píxeles gordos del
   corazón, para que a cualquier tamaño se vea igual de pixelado.
   ═══════════════════════════════════════════════════════════════════ */
(function (raiz) {
"use strict";

const REJILLA = 32;
const ORO = "#E8C44A", ORO2 = "#F5DE93", CLARO = "#FFF6E2";
const APAGADO = "#4A5268", PIEDRA = "#2A3145", SANGRE = "#C0261E";
const AGUA = "#5FB8D8", FUEGO = "#E8763A";

function px(g, x, y, an, al, color, alfa) {
  const u = g.u, c = g.ctx;
  c.globalAlpha = (alfa === undefined ? 1 : Math.max(0, Math.min(1, alfa)));
  c.fillStyle = color;
  c.fillRect(Math.round(x * u), Math.round(y * u),
             Math.max(1, Math.round(an * u)), Math.max(1, Math.round(al * u)));
  c.globalAlpha = 1;
}
function brillo(g, cx, cy, r, rgb, fuerza) {
  const u = g.u, c = g.ctx;
  const gr = c.createRadialGradient(cx * u, cy * u, 0, cx * u, cy * u, Math.max(1, r * u));
  gr.addColorStop(0, "rgba(" + rgb + "," + Math.max(0, fuerza).toFixed(3) + ")");
  gr.addColorStop(1, "rgba(" + rgb + ",0)");
  c.fillStyle = gr; c.fillRect(0, 0, g.lado, g.lado);
}
const pulso = (t, v, d) => 0.5 + 0.5 * Math.sin(t * v + (d || 0));
function rombo(g, cx, cy, r, color, alfa) {
  for (let dy = -r; dy <= r; dy++) {
    const an = (r - Math.abs(dy)) * 2 + 1;
    px(g, cx - (an - 1) / 2, cy + dy, an, 1, color, alfa);
  }
}
/* cifras de 3×5 píxeles: sólo las que hacen falta (313 y 380) */
const CIFRAS = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "8": ["111", "101", "111", "101", "111"]
};
function numero(g, txt, x, y, esc, color, alfa) {
  let cx = x;
  for (const car of String(txt)) {
    const f = CIFRAS[car]; if (!f) { cx += 4 * esc; continue; }
    for (let fy = 0; fy < 5; fy++)
      for (let fx = 0; fx < 3; fx++)
        if (f[fy][fx] === "1") px(g, cx + fx * esc, y + fy * esc, esc, esc, color, alfa);
    cx += (3 + 1) * esc;
  }
}
function anchoNumero(txt, esc) { return String(txt).length * 4 * esc - esc; }

/* la personita: si hay sprites es SU personaje */
function gentecita(g, idx, cx, pies, mirandoIzq) {
  const listo = raiz.Escenas && raiz.Escenas.listo && raiz.Escenas.listo();
  if (listo && typeof idx === "number") {
    const SP = raiz.Escenas.sprites();
    const e = Math.max(1, Math.round(g.u * 0.30));
    const an = SP.personas.w * e, al = SP.personas.h * e;
    const c = g.ctx;
    c.save();
    if (mirandoIzq) {
      c.translate(Math.round(cx * g.u + an / 2), 0);
      c.scale(-1, 1);
      raiz.Escenas.persona(c, idx, 0, 0, Math.round(pies * g.u - al), e);
    } else {
      raiz.Escenas.persona(c, idx, 0, Math.round(cx * g.u - an / 2), Math.round(pies * g.u - al), e);
    }
    c.restore();
    return;
  }
  px(g, cx - 1, pies - 5, 2, 2, "#59617A", .9);
  px(g, cx - 2, pies - 3, 4, 3, "#59617A", .9);
}

/* ── MIRAR ─────────────────────────────────────────────────────────
   Los momentos en que el teléfono no hace nada: la pantalla grande
   allá arriba, flechas que suben, y vos abajo. */
function mirar(g, t, e) {
  brillo(g, 16, 7, 15, "200,220,255", 0.14 + 0.06 * pulso(t, 2));
  px(g, 7, 3, 18, 1, "#5A6B96", .9);
  px(g, 7, 3, 1, 9, "#5A6B96", .9);
  px(g, 24, 3, 1, 9, "#5A6B96", .9);
  px(g, 7, 11, 18, 1, "#5A6B96", .9);
  for (let i = 0; i < 9; i++)
    px(g, 9 + (i * 5) % 14, 5 + (i * 3) % 5, 1, 1, CLARO, 0.15 + 0.5 * pulso(t, 3, i));
  px(g, 13, 6, 6, 3, ORO, 0.10 + 0.16 * pulso(t, 1.6));
  const sube = (t * 0.9) % 1;
  for (let k = 0; k < 3; k++) {
    const p = (sube + k / 3) % 1, y = 24 - p * 8;
    const a = Math.max(0, Math.sin(p * Math.PI)) * 0.85;
    px(g, 15, y, 2, 1, ORO2, a);
    px(g, 14, y + 1, 1, 1, ORO2, a); px(g, 17, y + 1, 1, 1, ORO2, a);
    px(g, 13, y + 2, 1, 1, ORO2, a * .6); px(g, 18, y + 2, 1, 1, ORO2, a * .6);
  }
  gentecita(g, e.persona, 16, 31);
}

/* ── TRINIDAD ──────────────────────────────────────────────────────
   «Tres puntos de luz conectados en triángulo, laten juntos.» Se
   encienden tocando; con los tres, sale la iglesia pequeña. */
function trinidad(g, t, e) {
  const V = [[16, 6], [8, 19], [24, 19]];
  const n = e.toques | 0, todo = n >= 3;
  brillo(g, 16, 14, 13, "232,196,74", (todo ? 0.16 : 0.06) + 0.08 * pulso(t, 1.4));
  for (let i = 0; i < 3; i++) {
    const a = V[i], b = V[(i + 1) % 3];
    const viva = n > i && n > ((i + 1) % 3);
    for (let k = 0; k <= 10; k += 2) {
      const x = a[0] + (b[0] - a[0]) * k / 10, y = a[1] + (b[1] - a[1]) * k / 10;
      px(g, x, y, 1, 1, ORO, viva ? 0.35 + 0.35 * pulso(t, 3, -k * .4) : 0.10);
    }
  }
  V.forEach((v, i) => {
    const on = i < n;
    const f = on ? (0.6 + 0.4 * pulso(t, 2.2, i * 2.09)) : (0.22 + 0.30 * pulso(t, 3.4, i));
    rombo(g, v[0], v[1], on ? 3 : 2, on ? ORO2 : APAGADO, f);
    if (on) rombo(g, v[0], v[1], 1, CLARO, f);
  });
  if (todo) iglesita(g, 16, 29, 0.5 + 0.5 * pulso(t, 1.8));
  else px(g, 16, 27, 1, 1, CLARO, 0.10 + 0.20 * pulso(t, 3));
}
function iglesita(g, cx, pies, f) {
  px(g, cx - 4, pies - 5, 8, 5, PIEDRA, 1);
  px(g, cx - 5, pies - 6, 10, 1, "#3B4763", 1);
  px(g, cx - 1, pies - 3, 2, 3, ORO2, 0.5 + 0.5 * f);   // la puerta encendida
  px(g, cx, pies - 9, 1, 3, "#3B4763", 1);
  px(g, cx, pies - 11, 1, 2, ORO, f);
  px(g, cx - 1, pies - 10, 3, 1, ORO, f);
}

/* ── SIETE ─────────────────────────────────────────────────────────
   «Siete símbolos: agua, fuego, manos, anillos, copa, aceite, cruz.»
   Se encienden de a uno tocando, y al final «la copa crece al
   centro». Cada teléfono enciende los suyos y la computadora suma
   los de toda la sala. */
/* El orden es el de la pantalla grande: bautismo, confirmación, eucaristía,
   confesión, unción, orden, matrimonio. Los dos lados dibujan lo mismo. */
const SIMBOLOS = ["agua", "fuego", "copa", "cruz", "aceite", "manos", "anillos"];
const NOMBRES7 = ["BAUTISMO", "CONFIRMACIÓN", "EUCARISTÍA", "CONFESIÓN",
                  "UNCIÓN", "ORDEN", "MATRIMONIO"];
/* Cada gesto en su cuadrito de 5×5. En arco quedaban pegados y las manos y
   los anillos se leían como una sola mancha; en círculo (que además es lo que
   pide el guion para el cierre) cada uno tiene su aire. El color los separa
   cuando la forma no alcanza: el agua azul, el fuego naranja, el aceite oliva. */
const DIBUJO = {
  agua:    ["..1..", ".111.", "11111", "11111", ".111."],
  fuego:   ["..1..", ".1.1.", ".111.", "11111", ".111."],
  manos:   ["1.1.1", "1.1.1", "11111", ".111.", "..1.."],
  anillos: [".....", ".1.1.", "1.1.1", ".1.1.", "....."],
  copa:    ["11111", "11111", ".111.", "..1..", ".111."],
  aceite:  [".1...", ".1...", "111..", "11111", ".111."],
  cruz:    ["..1..", "..1..", "11111", "..1..", "..1.."]
};
/* cada gesto con su color: el agua azul, el fuego naranja, la confesión
   violeta (el morado penitencial), la unción aceituna, el matrimonio rosado.
   Siete manchas doradas iguales no se distinguen de lejos. */
const TONO = { agua: AGUA, fuego: FUEGO, copa: ORO2, cruz: "#9A7FD8",
               aceite: "#9AA05A", manos: "#F0D67A", anillos: "#E0A0B8" };

function siete(g, t, e) {
  const n = e.toques | 0, todo = n >= 7;
  brillo(g, 16, 16, 15, "232,196,74", (todo ? 0.17 : 0.05) + 0.05 * pulso(t, todo ? 5 : 1.5));
  // «la copa crece al centro» cuando ya están los siete
  if (todo) copa(g, 16, 16, 1.6, 0.8 + 0.2 * pulso(t, 4));
  for (let i = 0; i < 7; i++) {
    const ang = -Math.PI / 2 + (i / 7) * Math.PI * 2;
    const cx = 16 + Math.cos(ang) * 10.5, cy = 16 + Math.sin(ang) * 10.5;
    if (todo && SIMBOLOS[i] === "copa") continue;      // esa ya está en el centro
    simbolo(g, SIMBOLOS[i], cx, cy, i < n, t, i);
  }
  if (!todo) {                                        // el próximo, latiendo
    const ang = -Math.PI / 2 + (n / 7) * Math.PI * 2;
    const cx = 16 + Math.cos(ang) * 10.5, cy = 16 + Math.sin(ang) * 10.5;
    aro(g, cx, cy, 3.5, CLARO, 0.10 + 0.26 * pulso(t, 4));
  }
}
function simbolo(g, cual, cx, cy, on, t, i) {
  const F = DIBUJO[cual]; if (!F) return;
  const color = on ? (TONO[cual] || ORO2) : APAGADO;
  const a = on ? (0.80 + 0.20 * pulso(t, 3.5, i || 0)) : 0.28;
  for (let y = 0; y < 5; y++)
    for (let x = 0; x < 5; x++)
      if (F[y][x] === "1") px(g, cx - 2.5 + x, cy - 2.5 + y, 1, 1, color, a);
  // el corazón de cada uno, más claro, para que no sea una mancha plana
  if (on) {
    if (cual === "fuego") px(g, cx, cy + 0.5, 1, 1, CLARO, a);
    if (cual === "copa")  px(g, cx - 1.5, cy - 1.5, 3, 1, SANGRE, a);
    if (cual === "agua")  px(g, cx - 0.5, cy - 0.5, 1, 1, CLARO, a * .8);
  }
}
function aro(g, cx, cy, r, color, a) {
  px(g, cx - r, cy - r, r * 2, 1, color, a);
  px(g, cx - r, cy + r, r * 2, 1, color, a);
  px(g, cx - r, cy - r, 1, r * 2, color, a);
  px(g, cx + r, cy - r, 1, r * 2, color, a);
}
/* la copa grande del centro: el guion la hace crecer al final */
function copa(g, cx, cy, esc, a) {
  const F = ["11111", "11111", ".111.", "..1..", ".111."];
  for (let y = 0; y < 5; y++)
    for (let x = 0; x < 5; x++)
      if (F[y][x] === "1")
        px(g, cx - 2.5 * esc + x * esc, cy - 2.5 * esc + y * esc, esc, esc,
           y === 1 ? SANGRE : ORO2, a);
  px(g, cx - 2.5 * esc, cy - 2.5 * esc, 5 * esc, esc, CLARO, a * .55);
}

/* ── DOS ───────────────────────────────────────────────────────────
   «Dos siluetas frente a frente, con un corazón de luz entre ellas.
    Del corazón salen palabras: perdón, justicia, ayuda.» Cada toque
   saca una palabra. */
const PALABRAS = ["PERDÓN", "JUSTICIA", "AYUDA"];
function dos(g, t, e) {
  const n = e.toques | 0;
  brillo(g, 16, 15, 12, "255,246,226", 0.05 + 0.05 * n + 0.05 * pulso(t, 1.6));
  gentecita(g, e.persona, 7, 27);
  gentecita(g, e.otra, 25, 27, true);
  // el corazón de luz en medio
  const lat = 0.75 + 0.25 * pulso(t, 2.6);
  corazoncito(g, 16, 15, 1 + (n >= 3 ? 0.35 : 0), ORO2, lat);
  if (n < 3) {                                  // el próximo, invitando
    const r = 4 + pulso(t, 3) * 1.2;
    aro(g, 16, 15, r, CLARO, 0.10 + 0.16 * pulso(t, 3));
  }
  // las palabras salen del corazón: se dibujan como trazos, no como letra
  const g_ctx = g.ctx;
  g_ctx.save();
  g_ctx.font = Math.round(g.u * 2.1) + "px 'Cascadia Mono', Consolas, monospace";
  g_ctx.textAlign = "center";
  for (let i = 0; i < Math.min(3, n); i++) {
    const y = (7 - i * 2.6) * g.u;
    g_ctx.fillStyle = CLARO;
    g_ctx.globalAlpha = 0.55 + 0.35 * pulso(t, 2.2, i * 1.7);
    g_ctx.fillText(PALABRAS[i], 16 * g.u, y + g.u * 2);
  }
  g_ctx.globalAlpha = 1;
  g_ctx.restore();
}
function corazoncito(g, cx, cy, esc, color, a) {
  const F = ["0110110", "1111111", "1111111", "0111110", "0011100", "0001000"];
  for (let y = 0; y < F.length; y++)
    for (let x = 0; x < 7; x++)
      if (F[y][x] === "1") px(g, cx - 3.5 * esc + x * esc, cy - 3 * esc + y * esc, esc, esc, color, a);
}

/* ── CORONA ────────────────────────────────────────────────────────
   «Aparece una corona y el número 313 … y el 380.» El teléfono se
   enciende con toda la sala a la vez: no hay nada que tocar, es el
   momento en que la historia cambia. */
function corona(g, t, e) {
  const num = e.num || "313";
  const entrada = Math.min(1, (e.edad || 1) / 0.8);
  brillo(g, 16, 12, 16, "232,196,74", 0.12 + 0.14 * pulso(t, 1.3) * entrada);
  // rayos
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2 + t * 0.25;
    const x = 16 + Math.cos(ang) * 13, y = 12 + Math.sin(ang) * 13;
    px(g, x, y, 1, 1, ORO, (0.12 + 0.24 * pulso(t, 2, i)) * entrada);
  }
  // la corona
  const c = ORO2, a = 0.85 * entrada;
  px(g, 9, 12, 14, 3, c, a);
  px(g, 9, 7, 1, 5, c, a); px(g, 22, 7, 1, 5, c, a);
  px(g, 15, 6, 2, 6, c, a);
  px(g, 12, 9, 1, 3, c, a); px(g, 19, 9, 1, 3, c, a);
  px(g, 9, 6, 1, 1, CLARO, a); px(g, 22, 6, 1, 1, CLARO, a);
  px(g, 15, 5, 2, 1, CLARO, a);
  for (let i = 0; i < 5; i++) px(g, 10 + i * 3, 13, 1, 1, SANGRE, a);  // las piedras
  // el número, grande
  const esc = 2;
  numero(g, num, 16 - anchoNumero(num, esc) / 2, 20, esc, CLARO, (0.7 + 0.3 * pulso(t, 2)) * entrada);
}

/* ── CIUDAD ────────────────────────────────────────────────────────
   «Íconos rápidos: una escuela, un hospital, una catedral.» Cada
   toque levanta uno. */
function ciudad(g, t, e) {
  const n = e.toques | 0, suelo = 26;
  brillo(g, 16, 19, 15, "255,246,226", 0.04 + 0.03 * n + 0.03 * pulso(t, 1.2));
  edificio(g, 3, suelo, 7, 9, n > 0, "escuela", t);
  edificio(g, 12, suelo, 8, 12, n > 1, "hospital", t);
  edificio(g, 22, suelo, 7, 15, n > 2, "catedral", t);
  px(g, 1, suelo + 1, 30, 1, "#4A5268", .85);
  if (n >= 3) {
    // levantadas las tres, la calle se llena: gente yendo y viniendo entre
    // la escuela, el hospital y la catedral. (Antes había una fila de puntos
    // amarillos cruzando la pantalla que no quería decir nada.)
    for (let i = 0; i < 5; i++) {
      const v = 0.16 + (i % 3) * 0.05;
      const x = 2 + ((t * v * 30 + i * 6.3) % 28);
      const paso = Math.sin(t * 6 + i) > 0 ? 0 : 1;
      px(g, x, suelo - 1 - paso, 1, 1, "#C9BE9A", .8);
      px(g, x, suelo, 1, 1, "#8A8674", .8);
    }
  } else {
    // el hueco donde toca poner la siguiente, latiendo
    const sig = n === 0 ? 6 : (n === 1 ? 16 : 25);
    px(g, sig - 3, suelo + 3, 7, 1, CLARO, 0.10 + 0.28 * pulso(t, 3.4));
  }
}
function edificio(g, x, suelo, an, alto, listo, tipo, t) {
  if (!listo) {                                  // la silueta de lo que falta
    px(g, x, suelo - 2, an, 2, PIEDRA, 0.35);
    return;
  }
  const y0 = suelo - alto + 1;
  px(g, x, y0, an, alto, "#232B3E", 1);
  px(g, x, y0, an, 1, "#3B4763", 1);
  for (let fy = y0 + 2; fy < suelo - 1; fy += 3)
    for (let fx = x + 1; fx < x + an - 1; fx += 2)
      px(g, fx, fy, 1, 1, ORO2, 0.20 + 0.55 * pulso(t, 2.4, fx * 3 + fy));
  if (tipo === "escuela") {
    px(g, x - 1, y0 - 1, an + 2, 1, "#3B4763", 1);
    px(g, x + 1, y0 - 2, an - 2, 1, "#3B4763", 1);
  } else if (tipo === "hospital") {
    px(g, x + 3, y0 - 3, 2, 3, CLARO, .9);
    px(g, x + 2, y0 - 2, 4, 1, CLARO, .9);
  } else {
    px(g, x + 3, y0 - 4, 1, 4, "#3B4763", 1);
    px(g, x + 3, y0 - 6, 1, 2, ORO, .95);
    px(g, x + 2, y0 - 5, 3, 1, ORO, .95);
  }
}

/* ── el signo de interrogación del guion ───────────────────────────
   «En los celulares aparece un signo de interrogación.» Se dibuja
   ENCIMA del corazón mientras nadie sostiene la luz, y se desvanece
   en cuanto empieza a cargar. */
function pregunta(ctx, lado, t, alfa) {
  const g = { ctx: ctx, lado: lado, u: lado / REJILLA };
  const F = ["01110", "10001", "00001", "00110", "00100", "00000", "00100"];
  const a = alfa * (0.55 + 0.45 * pulso(t, 2.2));
  for (let y = 0; y < F.length; y++)
    for (let x = 0; x < 5; x++)
      if (F[y][x] === "1") px(g, 13.5 + x, 4 + y, 1, 1, CLARO, a);
}

/* ── EL VOTO, en píxeles ───────────────────────────────────────────
   «Adorar al emperador» es el pebetero: el humo sube y te dejan vivir.
   «Mantener mi fe» es la cruz con la palma del mártir. Cada quien ve
   en su pantalla lo que eligió, y en la pantalla grande se ve encima
   de su personaje. */
function incienso(g, t, e) {
  const cx = 16, base = 24;
  brillo(g, cx, 16, 13, "95,184,216", 0.06 + 0.05 * pulso(t, 1.4));
  // el humo, subiendo y torciéndose
  for (let i = 0; i < 14; i++) {
    const q = ((t * 0.5 + i / 14) % 1);
    const y = base - 4 - q * 15;
    const x = cx + Math.sin(q * 6 + i) * (1 + q * 3);
    px(g, x, y, 1, 1, "#C8D6E8", (1 - q) * 0.5);
  }
  // las brasas
  px(g, cx - 3, base - 4, 6, 1, "#E8763A", 0.5 + 0.4 * pulso(t, 6));
  // el pebetero
  px(g, cx - 4, base - 3, 8, 3, "#9A8B62", 1);
  px(g, cx - 3, base, 6, 1, "#7A6C4A", 1);
  px(g, cx - 1, base + 1, 2, 2, "#7A6C4A", 1);
  px(g, cx - 4, base + 3, 8, 1, "#9A8B62", 1);
  px(g, cx - 4, base - 3, 8, 1, "#C9BE9A", .9);
}
function fe(g, t, e) {
  const cx = 16, cy = 15;
  brillo(g, cx, cy, 13, "192,38,30", 0.07 + 0.06 * pulso(t, 1.2));
  // la cruz
  px(g, cx - 1, cy - 8, 2, 18, ORO2, .95);
  px(g, cx - 6, cy - 3, 13, 2, ORO2, .95);
  px(g, cx - 1, cy - 8, 2, 1, CLARO, .9);
  // la palma del mártir
  for (let i = 0; i < 7; i++) {
    const y = cy + 8 - i, an = Math.max(1, 4 - Math.floor(i / 2));
    px(g, cx + 3, y, 1, 1, "#3E8E4A", .85);
    px(g, cx + 4, y - 1, an, 1, "#3E8E4A", .55 + 0.25 * pulso(t, 2, i));
  }
  // los rayos, latiendo
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2 + t * 0.3;
    px(g, cx + Math.cos(ang) * 12, cy + Math.sin(ang) * 12, 1, 1, ORO, 0.12 + 0.22 * pulso(t, 2.5, i));
  }
}

/* el mismo dibujo, chiquito, para la fila de gente de la pantalla grande */
function icono(ctx, cual, x, y, lado, t) {
  const g = { ctx: ctx, lado: lado, u: lado / REJILLA };
  ctx.save(); ctx.translate(x, y); ctx.imageSmoothingEnabled = false;
  if (cual === "fe") {
    px(g, 15, 6, 2, 20, ORO2, .95);
    px(g, 10, 11, 12, 2, ORO2, .95);
  } else {
    px(g, 12, 18, 8, 5, "#C9BE9A", .95);
    px(g, 13, 15, 6, 2, "#E8763A", 0.6 + 0.4 * pulso(t || 0, 6));
    for (let i = 0; i < 4; i++) {
      const q = (((t || 0) * 0.6 + i / 4) % 1);
      px(g, 16 + Math.sin(q * 6) * 2, 14 - q * 9, 1, 1, "#C8D6E8", (1 - q) * 0.6);
    }
  }
  ctx.restore();
}

/* ── EL CIERRE ─────────────────────────────────────────────────────
   «Todos los íconos aparecen en círculo y se funden en un solo punto
   de luz.» Los siete gestos giran alrededor del corazón de oro y caen
   dentro; al tocar el centro, se apagan. Cuando ya entraron todos,
   vuelven a salir: la historia se sigue contando.
   Se dibuja ENCIMA del corazón, así que va aparte. */
function absorbe(ctx, lado, t) {
  const g = { ctx: ctx, lado: lado, u: lado / REJILLA };
  ctx.imageSmoothingEnabled = false;
  const VUELTA = 9;                       // segundos de todo el ciclo
  for (let i = 0; i < 7; i++) {
    const q = ((t / VUELTA) + i / 7) % 1;   // 0 = afuera, 1 = adentro
    if (q > 0.92) continue;                 // ya se fundió: no se ve
    const caida = Math.pow(q, 1.7);
    const r = 13.5 * (1 - caida);
    const ang = (i / 7) * Math.PI * 2 + t * 0.45 + caida * 1.6;
    const cx = 16 + Math.cos(ang) * r, cy = 16 + Math.sin(ang) * r * 0.92;
    const a = q < 0.75 ? 1 : (0.92 - q) / 0.17;
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    simbolo(g, SIMBOLOS[i], cx, cy, true, t, i);
    ctx.globalAlpha = 1;
    if (q > 0.6) px(g, cx, cy, 1, 1, CLARO, (q - 0.6) * 2.2);   // la chispa al entrar
  }
}

const MOTIVOS = { mirar, trinidad, siete, dos, corona, ciudad, incienso, fe };

function pinta(ctx, clave, lado, t, extra) {
  const f = MOTIVOS[clave];
  if (!f) return false;
  const g = { ctx: ctx, lado: lado, u: lado / REJILLA };
  ctx.imageSmoothingEnabled = false;
  f(g, t, extra || {});
  return true;
}

/* los mismos siete, para que los dibuje también la pantalla grande */
function simbolo7(ctx, i, x, y, lado, t, encendido) {
  const g = { ctx: ctx, lado: lado, u: lado / 5 };   // el dibujo es de 5×5
  ctx.save(); ctx.translate(x - lado / 2, y - lado / 2);
  ctx.imageSmoothingEnabled = false;
  simbolo(g, SIMBOLOS[i], 2.5, 2.5, !!encendido, t || 0, i);
  ctx.restore();
}
raiz.Motivos = { pinta: pinta, pregunta: pregunta, icono: icono, absorbe: absorbe,
                 simbolo7: simbolo7, SIMBOLOS: SIMBOLOS, NOMBRES7: NOMBRES7,
                 claves: Object.keys(MOTIVOS) };
})(window);
