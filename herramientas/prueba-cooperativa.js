/* Prueba de la mecánica cooperativa: la luz de la sala es el PROMEDIO de los
   teléfonos conectados, así que si sólo carga la mitad, no se abre.

   Levanta N teléfonos falsos contra el servidor, hace que sólo algunos
   "sostengan el dedo", y escucha lo que la computadora reparte de vuelta.

   Uso:  node herramientas/prueba-cooperativa.js http://127.0.0.1:8123 sala4 4 2
         (servidor, código de sala, cuántos teléfonos, cuántos sostienen)
   La página del presentador tiene que estar abierta en esa misma sala y en
   la escena 4 (la de la luz), que es la única en la que reparte el dato.   */
"use strict";
const http=require("http"), https=require("https");
const NL=String.fromCharCode(10), SEP=NL+NL;
const BASE=process.argv[2]||"http://127.0.0.1:8123";
const SALA=process.argv[3]||"prueba";
const N=parseInt(process.argv[4],10)||4;
const SOSTIENEN=parseInt(process.argv[5],10)||2;
const TEMA="iglesia-imperio-"+SALA;
const local=!/ntfy/.test(BASE);
const urlSSE=local?`${BASE}/sala/sse?t=${TEMA}`:`${BASE}/${TEMA}/sse`;
const urlPub=local?`${BASE}/sala/enviar?t=${TEMA}`:`${BASE}/${TEMA}`;

function escucha(url,alMensaje){
  const mod=url.startsWith("https")?https:http;
  const req=mod.get(url,{headers:{Accept:"text/event-stream"}},(res)=>{
    let buf=""; res.setEncoding("utf8");
    res.on("data",(c)=>{ buf+=c; let i;
      while((i=buf.indexOf(SEP))>=0){ const b=buf.slice(0,i); buf=buf.slice(i+2);
        b.split(NL).forEach(l=>{ if(l.startsWith("data:")) alMensaje(l.slice(5).trim()); }); }});
  });
  req.on("error",()=>{});
  return {close:()=>req.destroy()};
}
const manda=(o)=>fetch(urlPub,{method:"POST",body:JSON.stringify(o),
  headers:{"Content-Type":"text/plain"}}).catch(()=>{});

let ultimaSalaLuz=null, avisos=0;
const oyente=escucha(urlSSE,(d)=>{
  let s; try{ s=JSON.parse(d); }catch(e){ return; }
  if(s.event!=="message") return;
  let m; try{ m=JSON.parse(s.message); }catch(e){ return; }
  if(m.t==="salaLuz"){ ultimaSalaLuz=m.p; avisos++; }
});

(async()=>{
  console.log(`Sala "${SALA}": ${N} teléfonos, ${SOSTIENEN} van a sostener el dedo.`);
  const ids=[];
  for(let i=0;i<N;i++){
    const id="falso"+i; ids.push(id);
    await manda({t:"hola",id:id,p:i%16,f:i%16});
    await new Promise(r=>setTimeout(r,90));
  }
  console.log("saludaron; esperando a que la compu los cuente…");
  await new Promise(r=>setTimeout(r,1800));

  for(let ronda=0;ronda<6;ronda++){
    for(let i=0;i<N;i++) await manda({t:"luz",id:ids[i],p:i<SOSTIENEN?1:0});
    await new Promise(r=>setTimeout(r,900));
  }
  const esperado=SOSTIENEN/N;
  console.log(`la compu repartió: ${ultimaSalaLuz}   (esperado ≈ ${esperado.toFixed(2)})`);
  console.log(`avisos recibidos: ${avisos}`);
  const ok = ultimaSalaLuz!==null && Math.abs(ultimaSalaLuz-esperado)<=0.13;
  console.log(ok ? "✓ la modulación cooperativa cuadra"
                 : "✗ no cuadra (¿está el presentador abierto y en la escena de la luz?)");
  oyente.close();
  process.exit(ok?0:1);
})();
