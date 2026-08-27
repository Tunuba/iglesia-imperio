/* ═══════════════════════════════════════════════════════════════════════
   escenas.js — el dibujo de las trece escenas, compartido.

   Lo usan LAS DOS pantallas: la de la computadora, que es la presentación de
   verdad y va a pantalla completa, y la del teléfono, que muestra lo mismo en
   chiquito junto al corazón de cada quien. Está acá y no duplicado en cada
   página para que nunca se vean distintas.

   Dos capas que nunca se pisan, separadas por una línea de horizonte: arriba
   3D de puntos proyectados a mano sobre un canvas 2D (sin WebGL ni librerías,
   el mismo espíritu del vuelo de MAURYA), abajo el pixel art de CCPP. Como
   cada punto 3D se pinta como un cuadrito, las dos técnicas combinan.

   Uso:
     Escenas.cargar(()=>{ ... });                 // espera a los sprites
     const est = Escenas.nuevoEstado(personaIdx); // persona, voto y animaciones
     Escenas.dibujar("tierra", ctx, W, H, t, est);
     Escenas.cajas();                             // para el verificador
   ═══════════════════════════════════════════════════════════════════════ */
(function(raiz){
"use strict";
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const lerp=(a,b,t)=>a+(b-a)*t;
const easeOut=(t)=>1-Math.pow(1-t,3);
const reduce=matchMedia("(prefers-reduced-motion:reduce)").matches;
let EST={ persona:0, voto:null, anim:{} };
const $=(sel)=>document.querySelector(sel);
function fuente(px,peso){ return (peso||"600")+" "+Math.round(px)+"px "+getComputedStyle(document.body).fontFamily; }

/* ── sprites (los personajes y el corazón de CCPP) ──────────────── */
const SP=window.SPRITES;
const imgPersonas=new Image(), imgCorazon=new Image();
let cargadas=0, alistos=[];
function alCargar(fn){
  if(cargadas>=2){ fn(); return; }
  alistos.push(fn);
  if(alistos.length>1) return;
  const t=()=>{ if(++cargadas>=2) alistos.forEach(f=>f()); };
  imgPersonas.onload=t; imgCorazon.onload=t;
  imgPersonas.src=SP.personas.src; imgCorazon.src=SP.corazon.src;
}

const PAL={
  vivo:[[0x7A,0x0C,0x2E],[0xC8,0x18,0x50],[0xF0,0x3C,0x84],[0xFF,0x8C,0xC0]],
  negro:[[0x09,0x09,0x0D],[0x16,0x16,0x1C],[0x26,0x24,0x2C],[0x38,0x35,0x3F]],
  oro:[[0x7A,0x54,0x10],[0xD8,0xA8,0x2A],[0xF2,0xD2,0x6A],[0xFF,0xF4,0xC8]]
};
const cacheCor={};
function corazon(i,tono){
  const k=i+"|"+tono; if(cacheCor[k]) return cacheCor[k];
  const w=SP.corazon.w,h=SP.corazon.h;
  const c=document.createElement("canvas"); c.width=w;c.height=h;
  const x=c.getContext("2d",{willReadFrequently:true});
  x.drawImage(imgCorazon,0,i*h,w,h,0,0,w,h);
  if(tono!=="vivo"){
    const d=x.getImageData(0,0,w,h),p=d.data,pal=PAL[tono];
    for(let j=0;j<p.length;j+=4){
      if(p[j+3]===0) continue;
      const l=(0.299*p[j]+0.587*p[j+1]+0.114*p[j+2])/255;
      const t=pal[l<0.28?0:(l<0.5?1:(l<0.75?2:3))];
      p[j]=t[0];p[j+1]=t[1];p[j+2]=t[2];
    }
    x.putImageData(d,0,0);
  }
  cacheCor[k]=c; return c;
}
function corazonMezcla(i,a,b,t){
  const w=SP.corazon.w,h=SP.corazon.h;
  const c=document.createElement("canvas"); c.width=w;c.height=h;
  const x=c.getContext("2d");
  x.drawImage(corazon(i,a),0,0);
  x.globalAlpha=clamp(t,0,1); x.drawImage(corazon(i,b),0,0);
  return c;
}
function persona(ctx,idx,frame,x,y,esc){
  const w=SP.personas.w,h=SP.personas.h;
  ctx.drawImage(imgPersonas, frame*w, idx*h, w, h, Math.round(x), Math.round(y), w*esc, h*esc);
}

/* ═══ MOTOR 3D MÍNIMO ══════════════════════════════════════════════
   Un punto es {x,y,z} en un cubo centrado en el origen. Se gira en Y
   (y algo en X), se proyecta con perspectiva y se pinta como cuadrito.
   Se ordena por profundidad para que lo de adelante tape lo de atrás. */
const CAM={ dist:3.2, lente:1.15 };
function esferaFib(n,r){          // puntos repartidos parejo sobre una esfera
  const pts=[], phi=Math.PI*(3-Math.sqrt(5));
  for(let i=0;i<n;i++){
    const y=1-(i/(n-1))*2, rad=Math.sqrt(Math.max(0,1-y*y)), th=phi*i;
    pts.push({x:Math.cos(th)*rad*r, y:y*r, z:Math.sin(th)*rad*r, i:i});
  }
  return pts;
}
function proyecta(p,giroY,giroX,W,H,zoom){
  const cy=Math.cos(giroY), sy=Math.sin(giroY);
  let x=p.x*cy - p.z*sy, z=p.x*sy + p.z*cy, y=p.y;
  const cx2=Math.cos(giroX), sx2=Math.sin(giroX);
  const y2=y*cx2 - z*sx2, z2=y*sx2 + z*cx2;
  const zc=z2+CAM.dist;
  if(zc<=0.05) return null;
  const f=CAM.lente/zc;
  const esc=Math.min(W,H)*zoom;
  return { sx:W/2+x*f*esc, sy:H/2-y2*f*esc, f:f, z:zc };
}
function pintaNube(ctx,pts,giroY,giroX,W,H,zoom,color,tam){
  const listos=[];
  for(const p of pts){
    const q=proyecta(p,giroY,giroX,W,H,zoom);
    if(q) listos.push({q:q,p:p});
  }
  listos.sort((a,b)=>b.q.z-a.q.z);          // lo lejano primero
  for(const it of listos){
    const {q,p}=it;
    const prof=clamp((CAM.dist+1.2-q.z)/2.2,0,1);   // 1 = cerca
    const s=Math.max(1,Math.round(tam*q.f*(0.55+0.75*prof)));
    ctx.globalAlpha=0.16+0.84*prof*(p.a==null?1:p.a);
    ctx.fillStyle=(typeof color==="function")?color(p,prof):color;
    ctx.fillRect(Math.round(q.sx-s/2),Math.round(q.sy-s/2),s,s);
  }
  ctx.globalAlpha=1;
  return listos;
}

/* ── cielo ──────────────────────────────────────────────────────── */
const CIELOS={
  vacio:"radial-gradient(ellipse 120% 85% at 50% 46%, #0D1226 0%, #05060B 62%)",
  calido:"radial-gradient(ellipse 120% 85% at 50% 10%, #1D2440 0%, #05060B 60%)",
  oscuro:"radial-gradient(ellipse 120% 90% at 50% 44%, #150F1C 0%, #020204 70%)",
  luz:"radial-gradient(ellipse 110% 78% at 50% 0%, #6B5A22 0%, #17140E 50%, #05060B 100%)",
  sangre:"radial-gradient(ellipse 120% 90% at 50% 18%, #2A1418 0%, #05060B 62%)",
  oro:"radial-gradient(ellipse 120% 82% at 50% 6%, #4A3A12 0%, #14110C 54%, #05060B 100%)",
  templo:"radial-gradient(ellipse 120% 82% at 50% 18%, #18203A 0%, #05060B 62%)"
};
function cielo(k){ const e=$("#cielo"); if(e) e.style.background=CIELOS[k]||CIELOS.vacio; }
function destello(ms){
  if(reduce) return;
  const d=$("#destello"); if(!d) return;
  d.style.transition="none"; d.style.opacity=".9";
  requestAnimationFrame(()=>{ d.style.transition="opacity "+ms+"ms ease-out"; d.style.opacity="0"; });
}

/* ── el lienzo de la escena visible ─────────────────────────────── */
function medir(cv){
  CAJAS.length=0;
  const r=cv.getBoundingClientRect();
  const dpr=Math.min(window.devicePixelRatio||1,2.5);
  const w=Math.max(1,Math.round(r.width*dpr)), h=Math.max(1,Math.round(r.height*dpr));
  if(cv.width!==w||cv.height!==h){ cv.width=w; cv.height=h; }
  const ctx=cv.getContext("2d");
  ctx.imageSmoothingEnabled=false;
  ctx.clearRect(0,0,w,h);
  return {ctx,W:w,H:h,u:Math.max(1,Math.round(h/56))};
}
function fuente(px,peso){ return (peso||"600")+" "+Math.round(px)+"px "+getComputedStyle(document.body).fontFamily; }

/* ── mundos 3D que se arman una sola vez ────────────────────────── */
const MUNDO={};
function mundo(){
  if(MUNDO.tierra) return MUNDO;
  MUNDO.tierra=esferaFib(300,1);
  MUNDO.tierra.forEach((p,i)=>{ p.ciudad=(i%9===0); });
  MUNDO.almas=esferaFib(120,1.02);
  MUNDO.almas.forEach((p,i)=>{ p.nace=(i%3)/3; p.a=1; });
  MUNDO.polvo=[];
  for(let i=0;i<90;i++) MUNDO.polvo.push({
    x:(Math.random()*2-1)*2.4, y:(Math.random()*2-1)*1.6, z:(Math.random()*2-1)*2.4, a:Math.random()*0.6+0.2});
  return MUNDO;
}

// (el estado vive fuera; ver EST)
const ANIM_INICIAL={ pecado:0, luz:0, luzSala:0, sacra:0, oro313:0, oro380:0, semilla:0, votoHecho:false };
/* El canal de la sala se declara ACÁ ARRIBA a propósito: la carga de la luz
   lo consulta en su primer paso, y si se declara más abajo con let, ese
   primer paso revienta con "Cannot access 'canal' before initialization" y
   se cae el resto del script. */
let canal=null;
let huboCaida=false;
let ultimaSalaLuz=0;      // cuándo informó la computadora por última vez

/* ── Cajas: cada cosa que se dibuja encima (figura, corazón, barra) anota
      dónde quedó. Así el mismo verificador que revisa el HTML puede revisar
      el interior del lienzo: que nada se salga y que nada pise a nada.
      Ver herramientas/pruebas/comprobar-pantalla.js ── */
let CAJAS=[];
const DESPLAZ={x:0,y:0,k:1};   // el encuadre, para que las cajas se reporten en pantalla
function caja(id,x,y,w,h){
  const k=DESPLAZ.k;
  CAJAS.push({id:id,x:x*k+DESPLAZ.x,y:y*k+DESPLAZ.y,w:w*k,h:h*k});
  return CAJAS[CAJAS.length-1];
}
window.__cajas=()=>CAJAS.slice();
window.__anim=()=>anim;   // para poder probar estados intermedios

/* Coloca un personaje sobre la línea de horizonte sin salirse jamás:
   cx es el centro deseado (0 a 1) y alto la fracción de la franja de suelo. */
function figura(ctx,W,H,u,hy,idx,frame,cx,alto){
  const franja=H-hy;
  const esc=Math.max(2, Math.round(franja*(alto||0.72)/SP.personas.h));
  const pw=SP.personas.w*esc, ph=SP.personas.h*esc;
  const x=clamp(W*cx-pw/2, u, W-pw-u);
  const y=hy-ph+Math.round(u*0.4);
  persona(ctx,idx,frame,x,y,esc);
  caja("figura",x,y,pw,ph);
  return {x:x,y:y,w:pw,h:ph,esc:esc};
}
/* Y un corazón, con las mismas garantías. */
function corazonEn(ctx,W,H,u,hy,img,cx,alto){
  const franja=H-hy;
  const lado=Math.max(8, Math.round(franja*(alto||0.55)));
  const x=clamp(W*cx-lado/2, u, W-lado-u);
  const y=hy-lado+Math.round(u*0.4);
  ctx.drawImage(img,x,y,lado,lado);
  caja("corazon",x,y,lado,lado);
  return {x:x,y:y,w:lado,h:lado};
}

/* ═══ LOS DIBUJOS ══════════════════════════════════════════════════ */
const DIBUJOS={

  /* ── Las cuatro primeras escenas van en DOS CAPAS, y esa es toda la
        gracia: arriba el 3D de puntos, abajo el pixel art de CCPP, con
        una línea de horizonte entre medio. Cada capa se recorta contra
        su mitad, así que jamás se pisan aunque cambie el tamaño. ── */

  /* 0 · la Tierra girando, y vos mirándola desde abajo */
  tierra(g,t){
    const {ctx,W,H,u}=g, M=mundo(), hy=H*0.82;
    ctx.save(); ctx.beginPath(); ctx.rect(0,0,W,hy); ctx.clip();
    pintaNube(ctx,M.polvo,t*0.05,0.1,W,hy,0.40,"#3E5B8C",u*0.9);
    ctx.globalAlpha=.07; ctx.fillStyle="#6FA8FF";
    ctx.beginPath(); ctx.arc(W/2,hy*0.50,Math.min(W,hy)*0.34,0,7); ctx.fill(); ctx.globalAlpha=1;
    pintaNube(ctx,M.tierra,t*0.22,-0.28,W,hy*1.04,0.34,
      (p,prof)=> p.ciudad ? (prof>0.55?"#F5DE93":"#8A7A3A") : (prof>0.5?"#4E7FC4":"#25406E"), u*1.25);
    ctx.restore();
    suelo(ctx,W,H,u,hy);
    // la figura da escala al planeta, pero en la pantalla grande estorba: ahí
    // abajo están los códigos para entrar y la gente conectada de verdad
    if(!EST.sinFigurantes) figura(ctx,W,H,u,hy,EST.persona,0,0.80,0.72);
  },

  /* 1 · la semilla cae, y de ahí crece gente */
  semilla(g,t){
    const {ctx,W,H,u}=g, M=mundo(), hy=H*0.86, p=EST.anim.semilla;
    ctx.save(); ctx.beginPath(); ctx.rect(0,0,W,hy); ctx.clip();

    // la figura de luz: un resplandor de verdad, no un disco gris
    const ly=hy*0.14, r=Math.min(W,hy)*0.30;
    const gl=ctx.createRadialGradient(W/2,ly,0,W/2,ly,r);
    gl.addColorStop(0,"rgba(255,246,226,.95)");
    gl.addColorStop(.18,"rgba(255,240,190,.45)");
    gl.addColorStop(1,"rgba(255,236,170,0)");
    ctx.fillStyle=gl; ctx.fillRect(0,0,W,hy);   // toda la zona: el borde del
    // rectángulo se notaba como una caja gris alrededor del resplandor
    if(!reduce){                                  // rayos que respiran
      ctx.globalAlpha=.30;
      for(let i=0;i<10;i++){
        const a=i*(Math.PI*2/10)+t*0.15, largo=r*(0.55+0.22*Math.sin(t*2+i));
        ctx.fillStyle="#FFF4C8";
        ctx.fillRect(W/2+Math.cos(a)*largo, ly+Math.sin(a)*largo*0.7, u, u);
      }
      ctx.globalAlpha=1;
    }

    // el planeta abajo, recibiendo
    ctx.save(); ctx.translate(0,hy*0.40);
    pintaNube(ctx,M.tierra,t*0.20,-0.30,W,hy,0.24,
      (q,prof)=> q.ciudad ? (prof>0.55?"#F5DE93":"#8A7A3A") : (prof>0.5?"#3E6BAF":"#1F3560"), u*1.1);
    if(p>0){                                      // las almas que brotan
      pintaNube(ctx,M.almas.filter(a=>a.nace<p),t*0.20,-0.30,W,hy,0.24*(1+0.12*p),
        (q,prof)=> prof>0.5?"#FFF4C8":"#7A6A3A", u*1.0);
    }
    ctx.restore();

    // la semilla, cayendo de la luz al planeta
    if(p<1){
      const caida=(t*0.75)%1, cy=ly+u*4+caida*(hy*0.42);
      for(let k=0;k<5;k++){                      // estela corta detrás
        ctx.globalAlpha=0.30*(1-k/5);
        ctx.fillStyle="#F5DE93";
        ctx.fillRect(W/2-u*0.5, cy-k*u*1.6, u, u*1.2);
      }
      ctx.globalAlpha=1; ctx.fillStyle="#FFF6E2";
      ctx.fillRect(W/2-u*0.8, cy, u*1.6, u*1.6);
    }
    ctx.restore();

    suelo(ctx,W,H,u,hy);
    figura(ctx,W,H,u,hy,EST.persona,(Math.sin(t*3)>0)?0:1,0.26,0.86);
    corazonEn(ctx,W,H,u,hy,corazon(Math.floor((t*12)%SP.corazon.n),"vivo"),0.74,0.80);
  },

  /* 2 · uno se separa del grupo y se apaga */
  pecado(g,t){
    const {ctx,W,H,u}=g, M=mundo(), hy=H*0.86, p=EST.anim.pecado;
    ctx.save(); ctx.beginPath(); ctx.rect(0,0,W,hy); ctx.clip();
    ctx.save(); ctx.translate(0,hy*0.16);
    pintaNube(ctx,M.tierra,t*0.16,-0.30,W,hy,0.24,
      (q,prof)=> prof>0.5?"#25406E":"#16294A", u*1.05);
    pintaNube(ctx,M.almas.filter(a=>a.i%2===0),t*0.16,-0.30,W,hy,0.26,
      (q,prof)=> prof>0.5?"#F0D67A":"#7A6A3A", u*1.0);
    ctx.restore();

    // EL que se va: sale del grupo, deja estela y se apaga. Tiene que verse
    // grande y solo, porque es el punto entero de la escena.
    const q=proyecta({x:0.85,y:0.40,z:0.35}, t*0.16, -0.30, W, hy, 0.26);
    if(q){
      const ox=q.sx, oy=q.sy+hy*0.16;
      const sx=ox+p*W*0.30, sy=oy+p*hy*0.30;
      const s=Math.max(3,Math.round(u*2.4));
      if(p>0.02 && !reduce){                       // la estela del que se aleja
        for(let k=1;k<=6;k++){
          const f=p*(k/7);
          ctx.globalAlpha=0.16*(1-k/7);
          ctx.fillStyle="#F0D67A";
          ctx.fillRect(ox+f*W*0.30-s/2, oy+f*hy*0.30-s/2, s, s);
        }
      }
      ctx.globalAlpha=1;
      if(p<0.65){                                  // todavía brilla
        const rr=s*2.6;
        const gg=ctx.createRadialGradient(sx,sy,0,sx,sy,rr);
        gg.addColorStop(0,"rgba(255,244,200,"+(0.55*(0.65-p))+")");
        gg.addColorStop(1,"rgba(255,244,200,0)");
        ctx.fillStyle=gg; ctx.fillRect(sx-rr,sy-rr,rr*2,rr*2);
      }
      ctx.fillStyle = p>0.55 ? "#2E2A34" : "#FFF4C8";
      ctx.fillRect(Math.round(sx-s/2),Math.round(sy-s/2),s,s);
    }
    ctx.restore();

    suelo(ctx,W,H,u,hy);
    figura(ctx,W,H,u,hy,EST.persona,0,0.26,0.86);
    corazonEn(ctx,W,H,u,hy,
      corazonMezcla(Math.floor((t*(12-6*p))%SP.corazon.n),"vivo","negro",easeOut(p)),0.74,0.84);
  },

  /* 3 · baja la luz, y se carga entre todos.
        Acá NO va la figura a propósito: el protagonista es el corazón, y
        meter un personaje al lado sólo robaba espacio y dejaba un hueco. */
  luz(g,t){
    const {ctx,W,H,u}=g, p=EST.anim.luz, sala=EST.anim.luzSala;
    const bh=Math.max(u*3,14), by=H-bh;        // la barra manda: es su franja
    const alto=by-u;                            // lo que le queda al dibujo
    ctx.save(); ctx.beginPath(); ctx.rect(0,0,W,alto); ctx.clip();
    if(p>0.02){
      const grad=ctx.createLinearGradient(0,0,0,alto);
      grad.addColorStop(0,"rgba(255,244,200,"+(0.55*p)+")");
      grad.addColorStop(1,"rgba(255,244,200,0)");
      ctx.fillStyle=grad;
      const a=u*4+u*13*p;
      ctx.beginPath(); ctx.moveTo(W/2-a,0); ctx.lineTo(W/2+a,0);
      ctx.lineTo(W/2+u*17,alto); ctx.lineTo(W/2-u*17,alto); ctx.closePath(); ctx.fill();
    }
    if(!reduce && p>0.05){
      for(let i=0;i<8;i++){
        const y=((t*130+i*53)%alto);
        ctx.globalAlpha=0.6*p; ctx.fillStyle="#9FD8EC";
        ctx.fillRect(Math.round(W/2+Math.sin(i*2.1)*u*9), y|0, u, u*2);
      }
      ctx.globalAlpha=1;
    }
    const lado=Math.round(Math.min(alto*0.82, W*0.62));
    const cx=Math.round(W/2-lado/2), cy=Math.round(alto*0.50-lado/2);
    const img=corazonMezcla(Math.floor((t*(10+8*p))%SP.corazon.n),"negro","oro",easeOut(p));
    // un resplandor detrás SIEMPRE: si no, el corazón negro sobre fondo
    // oscuro no se distingue y la escena parece vacía
    const gh=ctx.createRadialGradient(W/2,cy+lado/2,lado*0.12,W/2,cy+lado/2,lado*0.85);
    gh.addColorStop(0,"rgba(255,244,200,"+(0.10+0.22*p)+")");
    gh.addColorStop(1,"rgba(255,244,200,0)");
    ctx.fillStyle=gh; ctx.fillRect(cx-lado*0.5,cy-lado*0.4,lado*2,lado*1.9);
    if(p>0.45&&!reduce){
      ctx.save(); ctx.globalAlpha=(p-0.45)*1.1; ctx.filter="blur(8px)";
      ctx.drawImage(img,cx,cy,lado,lado); ctx.restore(); ctx.filter="none";
    }
    ctx.drawImage(img,cx,cy,lado,lado);
    caja("corazon",cx,cy,lado,lado);
    ctx.restore();
  },

  /* 4 · problema / respuesta / meta */
  tres(g,t){
    const {ctx,W,H,u}=g;
    const filas=[["EL PROBLEMA","el pecado","#C0261E"],
                 ["LA RESPUESTA","Jesús","#F0D67A"],
                 ["LA META","la salvación","#7FD8A0"]];
    const alto=H/3;
    filas.forEach((f,i)=>{
      const y=alto*i+alto/2, on=((t*0.9)%3.6)>=i;
      ctx.globalAlpha=on?1:0.22;
      ctx.fillStyle=f[2]; ctx.fillRect(0,y-u*1.8,u*1.4,u*3.6);
      ctx.textAlign="left";
      ctx.fillStyle="#8A8674"; ctx.font=fuente(u*1.9,"700");
      ctx.fillText(f[0],u*3,y-u*0.8);
      ctx.fillStyle=f[2]; ctx.font=fuente(u*3.8,"600");
      ctx.fillText(f[1],u*3,y+u*2.6);
      ctx.globalAlpha=1;
    });
  },

  /* 5 · la Trinidad */
  trinidad(g,t){
    const {ctx,W,H,u}=g, cx=W/2, cy=H*0.38, r=Math.min(W,H)*0.24;
    const pts=[[cx,cy-r],[cx-r*0.87,cy+r*0.5],[cx+r*0.87,cy+r*0.5]];
    const nom=["PADRE","HIJO","ESPÍRITU"];
    ctx.strokeStyle="rgba(232,196,74,.45)"; ctx.lineWidth=Math.max(1,u*0.6);
    ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
    ctx.lineTo(pts[1][0],pts[1][1]); ctx.lineTo(pts[2][0],pts[2][1]);
    ctx.closePath(); ctx.stroke();
    const pulso=0.5+0.5*Math.sin(t*2.2);
    pts.forEach((p,i)=>{
      ctx.globalAlpha=0.16+0.14*pulso; ctx.fillStyle="#F0D67A";
      ctx.beginPath(); ctx.arc(p[0],p[1],u*5,0,7); ctx.fill();
      ctx.globalAlpha=1; ctx.fillStyle="#FFF4C8";
      ctx.fillRect(p[0]-u*1.3,p[1]-u*1.3,u*2.6,u*2.6);
      ctx.fillStyle="#C8C4B6"; ctx.font=fuente(u*1.8,"700"); ctx.textAlign="center";
      ctx.fillText(nom[i],p[0],p[1]+(i===0?-u*3.2:u*5));
    });
    ctx.globalAlpha=0.55+0.3*pulso; ctx.fillStyle="#F0D67A";
    ctx.fillRect(cx-u*0.6,cy-u*0.6,u*1.2,u*1.2); ctx.globalAlpha=1;
    const by=H-u*2;
    ctx.fillStyle="#2A3044"; ctx.fillRect(cx-u*5,by-u*6,u*10,u*6);
    ctx.beginPath(); ctx.moveTo(cx-u*6.5,by-u*6); ctx.lineTo(cx,by-u*10.5);
    ctx.lineTo(cx+u*6.5,by-u*6); ctx.closePath(); ctx.fill();
    ctx.fillStyle="#E8C44A"; ctx.fillRect(cx-u*0.5,by-u*13.5,u,u*3.2);
    ctx.fillRect(cx-u*1.6,by-u*12.4,u*3.2,u);
  },

  /* 6 · los siete sacramentos */
  sacramentos(g,t){
    const {ctx,W,H,u}=g, cx=W/2, cy=H*0.48, r=Math.min(W,H)*0.34;
    const nombres=["BAUTISMO","CONFIRM.","EUCARISTÍA","CONFESIÓN","UNCIÓN","ORDEN","MATRIMONIO"];
    for(let i=0;i<7;i++){
      const a=-Math.PI/2+i*(Math.PI*2/7);
      const x=cx+Math.cos(a)*r, y=cy+Math.sin(a)*r*0.84;
      const on=i<EST.anim.sacra;
      ctx.globalAlpha=on?1:0.25;
      ctx.fillStyle=on?"#F0D67A":"#3A4260";
      simbolo(ctx,i,x,y,u*1.5);
      if(on){ ctx.globalAlpha=0.55; ctx.fillStyle="#8A8674";
        ctx.font=fuente(u*1.5,"700"); ctx.textAlign="center";
        ctx.fillText(nombres[i],x,y+u*4.4); }
      ctx.globalAlpha=1;
    }
    const gr=1+(EST.anim.sacra>=3?0.35:0)+0.05*Math.sin(t*3);
    ctx.fillStyle=EST.anim.sacra>=3?"#F5DE93":"#4A5268";
    copa(ctx,cx,cy,u*2.4*gr);
  },

  /* 7 · dos personas y el corazón entre ellas */
  moral(g,t){
    const {ctx,W,H,u}=g, base=H-u*3;
    const esc=Math.max(2, Math.min(Math.round(H/52), Math.floor(W*0.22/SP.personas.w)));
    const pw=SP.personas.w*esc, ph=SP.personas.h*esc;
    const x1=Math.round(W*0.16-pw/2), x2=Math.round(W*0.84-pw/2);
    persona(ctx,EST.persona,0,x1,base-ph,esc);
    persona(ctx,(EST.persona+7)%SP.catalogo.length,0,x2,base-ph,esc);
    caja("izquierda",x1,base-ph,pw,ph); caja("derecha",x2,base-ph,pw,ph);

    // el corazón, grande y al centro: es lo que pasa entre los dos
    const lado=Math.round(Math.min(H*0.34, W*0.30));
    const cx=Math.round(W/2-lado/2), cy=Math.round(base-ph*0.55-lado/2);
    const halo=ctx.createRadialGradient(cx+lado/2,cy+lado/2,lado*0.15,cx+lado/2,cy+lado/2,lado*0.8);
    halo.addColorStop(0,"rgba(240,214,122,"+(0.16+0.08*Math.sin(t*2.4))+")");
    halo.addColorStop(1,"rgba(240,214,122,0)");
    ctx.fillStyle=halo; ctx.fillRect(cx-lado*0.4,cy-lado*0.4,lado*1.8,lado*1.8);
    ctx.drawImage(corazon(Math.floor((t*11)%SP.corazon.n),"oro"),cx,cy,lado,lado);
    caja("corazon",cx,cy,lado,lado);

    // UNA palabra a la vez: las tres juntas se amontonaban y no se leía ninguna
    const palabras=["PERDÓN","JUSTICIA","AYUDA"];
    const cual=Math.floor(t/1.8)%3, f=(t/1.8)%1;
    ctx.globalAlpha=Math.min(1,Math.sin(f*Math.PI)*1.6);
    ctx.fillStyle="#F5DE93"; ctx.font=fuente(u*3.4,"700"); ctx.textAlign="center";
    ctx.fillText(palabras[cual], W/2, cy-u*2);
    ctx.globalAlpha=1;
  },

  /* 8 · el estandarte del imperio: el águila sobre el asta */
  aguila(g,t){
    const {ctx,W,H,u}=g;
    // las figuras primero, para saber cuánto sitio queda arriba
    // En la pantalla grande no se dibujan figurantes: ahí abajo va la gente
    // de verdad, la que está conectada. En el teléfono sí, para que no quede
    // el estandarte solo en el aire.
    const cuantos=EST.sinFigurantes?0:5, hueco=W/Math.max(1,cuantos);
    const escA=Math.max(2, Math.min(Math.round(H/58), Math.floor(hueco*0.62/SP.personas.w)));
    const pwA=SP.personas.w*escA, phA=SP.personas.h*escA;
    const base=H-u;
    for(let i=0;i<cuantos;i++){
      const x=Math.round(hueco*(i+0.5)-pwA/2);
      ctx.globalAlpha=(EST.voto&&i===2)?1:0.55;
      persona(ctx,(EST.persona+i*3)%SP.catalogo.length,0, x, base-phA, escA);
      ctx.globalAlpha=1;
      caja("gente"+i, x, base-phA, pwA, phA);
    }

    const cx=W/2, suelo=base-phA-u*1.5;
    const alto=Math.max(u*10, suelo-u*2);
    const oro=EST.anim.votoHecho?"#8E7A2E":"#E8C44A", oro2=EST.anim.votoHecho?"#6E5E22":"#F5DE93";
    // el asta
    ctx.fillStyle="#6B4A22"; ctx.fillRect(cx-u*0.6, suelo-alto*0.62, u*1.2, alto*0.62);
    // la placa SPQR
    ctx.fillStyle="#8E2A2A"; ctx.fillRect(cx-u*4, suelo-alto*0.46, u*8, u*3.4);
    ctx.fillStyle=oro2; ctx.font=fuente(u*2.1,"700"); ctx.textAlign="center";
    ctx.fillText("S·P·Q·R", cx, suelo-alto*0.46+u*2.5);
    // el águila: cuerpo, alas en escalones hacia arriba, cabeza y pico
    const ay=suelo-alto*0.62;
    ctx.fillStyle=oro;
    ctx.fillRect(cx-u*1.2, ay-u*4, u*2.4, u*4.2);                    // cuerpo
    for(let k=0;k<4;k++){                                            // alas
      const dx=u*(1.2+k*1.6), dy=ay-u*(3.4+k*1.5), alt=u*(3.2-k*0.4);
      ctx.fillRect(cx-dx-u*1.6, dy, u*1.6, alt);
      ctx.fillRect(cx+dx,       dy, u*1.6, alt);
    }
    ctx.fillStyle=oro2;
    ctx.fillRect(cx-u*1, ay-u*6.4, u*2, u*2.4);                      // cabeza
    ctx.fillRect(cx+u*0.8, ay-u*5.8, u*1.4, u*0.9);                  // pico
    ctx.fillStyle="#3A2A10";
    ctx.fillRect(cx+u*0.1, ay-u*5.9, u*0.6, u*0.6);                  // ojo
    // la corona de laurel bajo el águila
    ctx.strokeStyle=EST.anim.votoHecho?"#4E4420":"#3E8E4A";
    ctx.lineWidth=Math.max(1,u*0.6);
    ctx.beginPath(); ctx.arc(cx, ay+u*0.4, u*3.2, 0.15*Math.PI, 0.85*Math.PI); ctx.stroke();
    caja("estandarte", cx-u*8, ay-u*7, u*16, alto*0.7);
  },

  a313(g,t){ mapa(g,t,EST.anim.oro313,"313"); },
  a380(g,t){ mapa(g,t,EST.anim.oro380,"380"); },

  /* 11 · hoy */
  hoy(g,t){
    const {ctx,W,H,u}=g, base=H-u*4;
    ctx.fillStyle="#101625"; ctx.fillRect(0,base,W,H-base);
    ["escuela","hospital","catedral"].forEach((c,i)=>{
      const x=W*(0.2+i*0.3), on=((t*0.8)%3.6)>=i;
      ctx.globalAlpha=on?1:0.35; edificio(ctx,c,x,base,u);
      ctx.globalAlpha=on?0.7:0.25; ctx.fillStyle="#8A8674";
      ctx.font=fuente(u*1.7,"700"); ctx.textAlign="center";
      ctx.fillText(c.toUpperCase(),x,base+u*2.8); ctx.globalAlpha=1;
    });
    const y=H*0.18;
    ctx.strokeStyle="rgba(240,214,122,.7)"; ctx.lineWidth=Math.max(1,u*0.6);
    ctx.setLineDash([u*1.5,u*1.5]); ctx.lineDashOffset=-t*u*6;
    ctx.beginPath(); ctx.moveTo(W*0.84,y);
    ctx.quadraticCurveTo(W*0.5,y-u*5,W*0.13,y+u*3); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle="#F0D67A"; ctx.fillRect(W*0.84-u,y-u,u*2,u*2);
    ctx.globalAlpha=0.5+0.5*Math.sin(t*3);
    ctx.fillRect(W*0.13-u,y+u*2,u*2.4,u*2.4); ctx.globalAlpha=1;
  },

  /* 12 · el cierre: todo se junta en un punto */
  cierre(g,t){
    const {ctx,W,H,u}=g, cx=W/2, cy=H*0.5;
    const junta=clamp((t%10)/7,0,1);
    const r=Math.min(W,H)*0.34*(1-easeOut(junta)*0.85);
    for(let i=0;i<7;i++){
      const a=-Math.PI/2+i*(Math.PI*2/7);
      ctx.globalAlpha=0.3+0.7*(1-junta); ctx.fillStyle="#F0D67A";
      simbolo(ctx,i,cx+Math.cos(a)*r,cy+Math.sin(a)*r*0.9,u*1.2*(1-junta*0.5));
    }
    ctx.globalAlpha=1;
    const cw=Math.min(SP.corazon.w*Math.max(3,Math.round(H/42)),W*0.34);
    const img=corazon(Math.floor((t*11)%SP.corazon.n),"oro");
    if(!reduce){ ctx.save(); ctx.globalAlpha=0.4+0.3*Math.sin(t*2)+junta*0.25;
      ctx.filter="blur(8px)"; ctx.drawImage(img,cx-cw/2,cy-cw/2,cw,cw);
      ctx.restore(); ctx.filter="none"; }
    ctx.drawImage(img,cx-cw/2,cy-cw/2,cw,cw);
  }
};

/* piezas del dibujo */
function suelo(ctx,W,H,u,hy){
  // el piso de piedra donde se para el pixel art; marca la frontera entre
  // la capa 3D (arriba) y la capa 2D (abajo)
  ctx.fillStyle="#0A0D16"; ctx.fillRect(0,hy,W,H-hy);
  ctx.fillStyle="#1A2032"; ctx.fillRect(0,hy,W,Math.max(1,u*0.6));
  ctx.fillStyle="#141A29";
  for(let x=(-u*2);x<W;x+=u*7) ctx.fillRect(x,hy+u,u*5,Math.max(1,u*0.8));
}
function simbolo(ctx,i,x,y,s){
  x=Math.round(x); y=Math.round(y);
  switch(i){
    case 0: ctx.fillRect(x-s,y-s*0.3,s*2,s*0.8); ctx.fillRect(x-s*0.4,y-s*1.2,s*0.8,s*0.9); break;
    case 1: ctx.fillRect(x-s*0.3,y-s,s*0.6,s*2); ctx.fillRect(x-s*0.9,y,s*1.8,s*0.6); break;
    case 2: copa(ctx,x,y,s); break;
    case 3: ctx.fillRect(x-s,y-s*0.25,s*2,s*0.5); ctx.fillRect(x-s*0.25,y-s,s*0.5,s*2); break;
    case 4: ctx.fillRect(x-s*0.7,y-s*0.7,s*1.4,s*1.4); break;
    case 5: ctx.fillRect(x-s*0.25,y-s,s*0.5,s*2); ctx.fillRect(x-s,y-s*0.3,s*2,s*0.5); break;
    default: ctx.fillRect(x-s,y-s*0.4,s*0.8,s*0.8); ctx.fillRect(x+s*0.2,y-s*0.4,s*0.8,s*0.8);
  }
}
function copa(ctx,x,y,s){
  x=Math.round(x); y=Math.round(y);
  ctx.fillRect(x-s,y-s,s*2,s*0.5);
  ctx.fillRect(x-s*0.75,y-s*0.5,s*1.5,s*0.9);
  ctx.fillRect(x-s*0.2,y+s*0.4,s*0.4,s*0.7);
  ctx.fillRect(x-s*0.8,y+s*1.1,s*1.6,s*0.4);
}
function edificio(ctx,tipo,x,base,u){
  x=Math.round(x);
  if(tipo==="escuela"){
    ctx.fillStyle="#2A3044"; ctx.fillRect(x-u*4,base-u*8,u*8,u*8);
    ctx.fillStyle="#F0D67A"; for(let i=0;i<3;i++) ctx.fillRect(x-u*3+i*u*2.5,base-u*6,u*1.5,u*1.5);
    ctx.fillStyle="#3A4260"; ctx.fillRect(x-u*5,base-u*9.5,u*10,u*1.5);
  }else if(tipo==="hospital"){
    ctx.fillStyle="#2A3044"; ctx.fillRect(x-u*4,base-u*10,u*8,u*10);
    ctx.fillStyle="#E8E8E8"; ctx.fillRect(x-u*0.7,base-u*8,u*1.4,u*4);
    ctx.fillRect(x-u*2,base-u*6.7,u*4,u*1.4);
  }else{
    ctx.fillStyle="#2A3044"; ctx.fillRect(x-u*4,base-u*9,u*8,u*9);
    ctx.beginPath(); ctx.moveTo(x-u*5,base-u*9); ctx.lineTo(x,base-u*13);
    ctx.lineTo(x+u*5,base-u*9); ctx.closePath(); ctx.fill();
    ctx.fillStyle="#E8C44A"; ctx.fillRect(x-u*0.4,base-u*16,u*0.8,u*3);
    ctx.fillRect(x-u*1.3,base-u*15,u*2.6,u*0.8);
    ctx.fillStyle="#F0D67A"; ctx.globalAlpha=.55;
    ctx.fillRect(x-u*1.2,base-u*7,u*2.4,u*3.4); ctx.globalAlpha=1;
  }
}
function mapa(g,t,oro,anio){
  const {ctx,W,H,u}=g;
  ctx.fillStyle="#080D1A"; ctx.fillRect(0,0,W,H);
  ctx.fillStyle="#19212F";
  ctx.fillRect(0,0,W,H*0.24); ctx.fillRect(0,H*0.74,W,H*0.26);
  ctx.fillRect(W*0.02,H*0.20,W*0.30,H*0.16); ctx.fillRect(W*0.62,H*0.17,W*0.24,H*0.20);
  const pts=[[0.14,0.44],[0.28,0.36],[0.42,0.48],[0.55,0.38],[0.68,0.52],
             [0.80,0.34],[0.35,0.63],[0.62,0.66],[0.88,0.56],[0.20,0.66]];
  pts.forEach((p,i)=>{
    const on=(i/pts.length)<oro, pulso=on&&!reduce?(0.7+0.3*Math.sin(t*3+i)):1;
    ctx.globalAlpha=on?pulso:0.4;
    ctx.fillStyle=on?"#F0D67A":"#3A4260";
    const s=on?u*1.7:u;
    ctx.fillRect(p[0]*W-s/2,p[1]*H-s/2,s,s);
    if(on){ ctx.globalAlpha=pulso*0.20; ctx.fillRect(p[0]*W-s*1.6,p[1]*H-s*1.6,s*3.2,s*3.2); }
  });
  ctx.globalAlpha=0.12; ctx.fillStyle="#F0D67A";
  ctx.font=fuente(H*0.55,"700"); ctx.textAlign="center";
  ctx.fillText(anio,W/2,H*0.76); ctx.globalAlpha=1;
}

/* ── la puerta de salida ────────────────────────────────────────── */
const ORDEN=["tierra","semilla","pecado","luz","tres","trinidad","sacramentos",
             "moral","aguila","a313","a380","hoy","cierre"];
raiz.Escenas={
  ORDEN: ORDEN,
  cargar: alCargar,
  listo: ()=>cargadas>=2,
  nuevoEstado(persona){
    return { persona:persona|0, voto:null,
             anim:{ pecado:0, luz:0, luzSala:0, sacra:0, oro313:0, oro380:0,
                    semilla:0, votoHecho:false } };
  },
  /* Dibuja una escena. El lienzo ya tiene que venir del tamaño correcto. */
  dibujar(nombre, ctx, W, H, t, estado, opciones){
    if(cargadas<2) return;
    EST = estado || EST;
    CAJAS.length=0;
    ctx.imageSmoothingEnabled=false;
    ctx.clearRect(0,0,W,H);
    const fn = DIBUJOS[nombre];
    if(!fn) return;
    const op = opciones || {};
    const arriba = Math.round(H * (op.margenArriba || 0));   // sitio para el título
    const abajo  = Math.round(H * (op.margenAbajo || 0));    // sitio para la barra
    const alto   = Math.max(40, H - arriba - abajo);
    // el ancho se limita para que en pantalla ancha no quede todo diminuto y
    // a los lados; el cielo del fondo rellena lo que sobra
    const ancho  = Math.min(W, Math.round(alto * (op.proporcion || 1.45)));
    const dx = Math.round((W - ancho) / 2);
    // La escala agranda el dibujo entero: en un proyector, el mismo diseño
    // pensado para un teléfono se ve diminuto y con la pantalla medio vacía.
    const k = op.escala || 1;
    const anchoV = ancho / k, altoV = alto / k;
    const u = Math.max(1, Math.round(altoV/56));
    ctx.save();
    ctx.translate(dx, arriba);
    ctx.scale(k, k);
    DESPLAZ.x = dx; DESPLAZ.y = arriba; DESPLAZ.k = k;
    try{ fn({ctx:ctx, W:anchoV, H:altoV, u:u}, t); }catch(e){}
    ctx.restore();
    DESPLAZ.x = 0; DESPLAZ.y = 0; DESPLAZ.k = 1;
  },
  cajas: ()=>CAJAS.slice(),
  sprites: ()=>SP,
  persona: (ctx,idx,frame,x,y,esc)=>persona(ctx,idx,frame,x,y,esc),
  corazon: (i,tono)=>corazon(i,tono),
  corazonMezcla: (i,a,b,t)=>corazonMezcla(i,a,b,t),
  CIELOS: CIELOS,
  cielo: cielo,
  destello: destello
};
})(window);
