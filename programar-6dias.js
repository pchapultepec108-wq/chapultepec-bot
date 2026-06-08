// 6 días de posts diarios — PH Parque Chapultepec
// 3 Instagram + 2 TikTok = 5 posts/día × 6 días = 30 posts
import 'dotenv/config'

const KEY = process.env.BUFFER_API_KEY
const IG  = '6a200357c687a22dd456797f'   // @pchapultepec
const TT  = '6a20036fc687a22dd45679d0'   // @carlosmoralevega
const CDN = 'https://gnarxxwxagstuspkbvql.supabase.co/storage/v1/object/public/posts'

// Hashtags extendidos — por segmento
const H_INV = '#InversionInmobiliaria #InversionistasMexico #ROIInmobiliario #BienesRaicesInversion #PortafolioInmobiliario #InversionesMexico #InversionCDMX #PlusvaliaMexico'
const H_LUX = '#PropiedadDeLujo #LuxuryRealEstate #LuxuryLiving #CasaDeLujo #PenthouseMexico #PropiedadesDePrestigio #MexicoLuxury #LuxuryHomes #InmueblesDePrestigio'
const H_PH  = '#Penthouse #PenthouseLife #PenthouseMexicano #PenthouseCuernavaca #PHLife #PenthouseView #RoofGarden #RooftopLife #RooftopVibes #Rooftop'
const H_CVA = '#Cuernavaca #CuernavacaMorelos #CiudadEternaPrimavera #BienesRaicesCuernavaca #ViveCuernavaca #CuernavacaRealEstate #ParqueChapultepec #Morelos'
const H_FAM = '#SegundaCasa #CasaFamiliar #CasaDeDescanso #FinDeSemanaPerfecto #HogarDeSuenos #PropiedadFamiliar #VidaEnCuernavaca #CasasEnVenta'
const H_CDM = '#CDMX #DF #CiudadDeMexico #1punto5HorasDeCDMX #CapitalMexicana #VivirMejor #FueraDelRuido'
const H_GEN = '#BienesRaices #BienesRaicesMexico #Inmobiliaria #PropiedadesExclusivas #InmueblesDeLujo #VendemosCasas #MexicoRealEstate'
const H_VID = '#Arquitectura #DisenoDeInteriores #CasasDeDiseno #HomeDesign #InteriorDesign #ArquitecturaMexicana #DomóticaHogar'

const DIAS = [
  // DÍA 1 — Rooftop Hero
  { ig: [
    { txt: `Tu rooftop privado sobre Cuernavaca. 🌿

Pérgola de parota, asador BBQ, sala al aire libre y la sierra de Morelos frente a ti.

Este es el roof garden de tu penthouse — 86 m² donde nadie más entra.

🌟 PH Parque Chapultepec · Última unidad
💰 $4,500,000 MXN · Entrega inmediata
📍 Bajada de Chapultepec 18-A, Cuernavaca

📱 WA: 777 175 84 12

${H_PH}
${H_CVA}
${H_LUX}`, img: 'ph-rooftop-hero.jpg' },

    { txt: `Cuernavaca tiene 330 días de sol al año. ☀️

Y tú podrías pasar cada uno de ellos con esta vista — la sierra de Morelos, el verde del parque y el silencio de la ciudad de la eterna primavera.

A 1.5h de CDMX. Sin el tráfico. Sin el ruido. Con todo el lujo.

🌟 Penthouse · 234 m² + 86 m² Roof Garden
💰 $4,500,000 MXN
📱 777 175 84 12

${H_FAM}
${H_CDM}
${H_CVA}
${H_GEN}`, img: 'ph-rooftop-hero.jpg' },

    { txt: `Desayunar aquí es la nueva normalidad. 🍳

Cocina abierta con isla de granito, integrada al comedor y a los jardines.
Parota, granito y latón cepillado — materiales que se sienten, no se olvidan.

🌟 PH Parque Chapultepec · Cuernavaca
💰 $4,500,000 MXN · Entrega inmediata
📱 777 175 84 12

${H_LUX}
${H_VID}
${H_CVA}`, img: 'ph-cocina-render.jpg' }
  ], tt: [
    { txt: `Esto es lo que ves desde tu rooftop en Cuernavaca 🏔️

86 m² privados · Pérgola parota · Asador · Vista a las montañas
A 1.5h de CDMX · $4.5M MXN · Entrega inmediata
Solo 1 disponible.

📱 777 175 84 12

${H_PH} ${H_CVA} #Cuernavaca`, vid: 'video1-penthouse.mp4' },
    { txt: `¿Cuánto cuesta vivir así en Cuernavaca? 👀

Penthouse · 234m² + 86m² rooftop con jacuzzi
3 recámaras · 3.5 baños · Casa inteligente · Parota + Travertino
$4,500,000 MXN · Entrega inmediata

📱 WA: 777 175 84 12

${H_INV} ${H_PH} ${H_CVA}`, vid: 'video2-departamento.mp4' }
  ]},

  // DÍA 2 — Inversión / CDMX
  { ig: [
    { txt: `La inversión que no pierdes de vista. 📈

PH Parque Chapultepec, Cuernavaca:
✅ ROI proyectado: 8-12% anual
✅ Zona de máxima plusvalía
✅ Alta demanda de renta vacacional
✅ Entrega inmediata — sin esperar

1 unidad. La última.

💰 $4,500,000 MXN
📱 777 175 84 12

${H_INV}
${H_LUX}
${H_CVA}
${H_GEN}`, img: 'ph-rooftop-asador.jpg' },

    { txt: `Si vives en CDMX, este es el plan que te faltaba. 🌆➡️🌿

1.5 horas y cambias el tráfico por esto:
Roof garden privado · Alberca · Jardín tropical · Sierra de Morelos

Tu segunda casa — o tu inversión más inteligente.

🌟 Penthouse Parque Chapultepec · Cuernavaca
$4,500,000 MXN · 234m² + 86m²
📱 777 175 84 12

${H_CDM}
${H_FAM}
${H_CVA}
${H_INV}`, img: 'ph-rooftop-asador.jpg' },

    { txt: `Travertino. Parota. Granito. Latón. 🪵

Cuando los materiales son nobles, el lujo se siente sin que nadie te lo explique.

Baños tipo spa · Grifería negra mate · Regadera lluvia
Parota en cocina, vestidor y roof garden
Granito en isla de cocina · Latón cepillado en grifería y herrajes

🌟 PH Parque Chapultepec · $4.5M · Cuernavaca
📱 777 175 84 12

${H_VID}
${H_LUX}
${H_PH}`, img: 'ph-bano1-render.png' }
  ], tt: [
    { txt: `Inversionistas: ¿ya calculaste el ROI de este penthouse? 💰

8-12% anual proyectado · Alta demanda de renta vacacional · Cuernavaca crece
$4.5M MXN · 234m² + 86m² · Entrega inmediata

Un activo premium en la ciudad de la eterna primavera.
📱 777 175 84 12

${H_INV} ${H_CVA}`, vid: 'video5-lifestyle.mp4' },
    { txt: `De CDMX a Cuernavaca en 1.5 horas 🚗

Y llegas a tu rooftop privado con vista a las montañas.
Penthouse Parque Chapultepec · $4.5M MXN
Solo queda 1. Entrega inmediata.

📱 WA: 777 175 84 12

${H_CDM} ${H_FAM} ${H_CVA}`, vid: 'video2-departamento.mp4' }
  ]},

  // DÍA 3 — Alberca / Amenidades
  { ig: [
    { txt: `La alberca que no cierra en temporada. 🏊

En Cuernavaca hay 330 días de sol. Aquí en Parque Chapultepec, la alberca está siempre lista — climatizada, rodeada de palmeras y bugambilias.

Este es el jardín que buscabas para tu familia.

🌟 PH Parque Chapultepec · Única unidad
💰 $4,500,000 MXN · Entrega inmediata
📍 A 50m del Parque Chapultepec, Cuernavaca
📱 777 175 84 12

${H_FAM}
${H_CVA}
${H_GEN}
${H_LUX}`, img: 'ph-alberca-jardin.jpg' },

    { txt: `Esto no es el hotel. Es tu casa. 🌺

Jardín tropical · Palmas reales · Bugambilias en flor
Alberca climatizada · Seguridad 24/7 · Elevador
A 50 metros del Parque Chapultepec

Una dirección que habla por ti.

🌟 Penthouse · $4,500,000 MXN · Cuernavaca
📱 777 175 84 12

${H_LUX}
${H_CVA}
${H_FAM}
${H_GEN}`, img: 'ph-alberca-jardin.jpg' },

    { txt: `3 recámaras. 3.5 baños. 234 m². Y aún más. 🛏️

La recámara principal conecta con vestidor de diseño, baño spa de travertino y acceso directo al roof garden.

Espacio para familia, huéspedes y home office.
Todo bajo el mismo techo — el tuyo.

🌟 PH Parque Chapultepec · Cuernavaca
💰 $4,500,000 MXN
📱 777 175 84 12

${H_FAM}
${H_LUX}
${H_PH}
${H_VID}`, img: 'ph-master-render.png' }
  ], tt: [
    { txt: `Casa familiar en Cuernavaca con alberca propia 🌿

Palmas, bugambilias, jardín tropical y una alberca que no cierra.
Penthouse Parque Chapultepec · $4.5M MXN
A 1.5h de CDMX · Entrega inmediata

📱 777 175 84 12

${H_FAM} ${H_CVA} #CasaFamiliar`, vid: 'video5-lifestyle.mp4' },
    { txt: `POV: llegas a tu penthouse en Cuernavaca 🌙

Jardín tropical · Alberca · Roof garden con pérgola
234m² + 86m² · 3 recámaras · Casa inteligente
$4.5M MXN · Solo 1 disponible

📱 WA: 777 175 84 12

${H_PH} ${H_CVA} ${H_FAM}`, vid: 'video1-penthouse.mp4' }
  ]},

  // DÍA 4 — Casa inteligente / tecnología
  { ig: [
    { txt: `Arquitectura blanca. Herrería negra. Verde del parque. 🌿

Residencial Parque Chapultepec — donde el diseño contemporáneo se encuentra con la naturaleza de Cuernavaca.

Fachada con balcones y jardines en grava · Acceso controlado · Elevador · Seguridad 24/7

🌟 Penthouse · $4,500,000 MXN · Entrega inmediata
📍 Bajada de Chapultepec 18-A, Col. Chapultepec
📱 777 175 84 12

${H_VID}
${H_LUX}
${H_CVA}
${H_GEN}`, img: 'ph-fachada-real.jpg' },

    { txt: `Tu casa te escucha. 🏠💡

Domótica integrada: luces, clima y persianas controlados desde tu teléfono o por voz.
Tecnología que desaparece — solo sientes el resultado.

Penthouse Parque Chapultepec · Cuernavaca
Casa inteligente · Materiales nobles · 234m² + 86m² Rooftop
$4,500,000 MXN · Entrega inmediata

📱 777 175 84 12

${H_VID}
${H_LUX}
${H_INV}
${H_PH}`, img: 'ph-materiales.jpg' },

    { txt: `Parota. Granito. Travertino. Latón. 🪵✨

Cuatro materiales. Una paleta. El penthouse más cálido de Cuernavaca.

Madera de parota en cocina, vestidor y roof garden.
Granito en isla y cubiertas.
Travertino en muros de baño.
Latón cepillado en grifería y herrajes.

🌟 PH Parque Chapultepec · $4.5M MXN
📱 777 175 84 12

${H_VID}
${H_LUX}
${H_PH}
${H_CVA}`, img: 'ph-materiales.jpg' }
  ], tt: [
    { txt: `Casa inteligente en Cuernavaca 🏠📱

Luces, clima y persianas con tu voz o teléfono.
Penthouse Parque Chapultepec · Parota + Travertino + Latón
$4.5M MXN · 234m² + 86m² · Entrega inmediata

📱 777 175 84 12

${H_VID} ${H_PH} ${H_CVA}`, vid: 'video3-cocina.mp4' },
    { txt: `¿Cuánto vale la tranquilidad? 🌿

Seguridad 24/7, jardín tropical, alberca, elevador y roof garden con vista a las montañas.
Todo en el penthouse más exclusivo de Cuernavaca.

$4.5M MXN · Solo 1 disponible
📱 777 175 84 12

${H_FAM} ${H_LUX} ${H_CVA}`, vid: 'video5-lifestyle.mp4' }
  ]},

  // DÍA 5 — Urgencia / última unidad
  { ig: [
    { txt: `Solo queda 1. ⚠️

En todo el proyecto Parque Chapultepec — 13 unidades exclusivas — queda el penthouse.

El departamento ya se vendió.
El PH es el último.

Quien llegue primero, se lleva la mejor unidad del proyecto.

🌟 234m² + 86m² Roof Garden · $4,500,000 MXN
3 recámaras · Jacuzzi · Vista Cuernavaca · Entrega inmediata
📱 777 175 84 12

${H_PH}
${H_INV}
${H_LUX}
${H_CVA}
${H_GEN}`, img: 'ph-rooftop-hero.jpg' },

    { txt: `El roof garden que todos querían ver en persona. 🌅

Pérgola de parota · Asador BBQ · Sala exterior · Jardín vivo
Vista directa a la sierra de Morelos
86 m² que son solo tuyos.

Cuando dicen "última unidad" — esto es lo que queda.

🌟 PH Parque Chapultepec · Cuernavaca
💰 $4,500,000 MXN · Entrega inmediata
📱 777 175 84 12

${H_PH}
${H_CVA}
${H_LUX}
${H_INV}`, img: 'ph-rooftop-asador.jpg' },

    { txt: `Sala. Comedor. Cocina. Todo abierto. Todo conectado. 🪴

Ventanal de herrería negra que abre al jardín interior.
Comedor de parota bajo iluminación indirecta.
Cocina con isla de granito que une lo social y lo culinario.

No es un concepto. Ya está terminado.

🌟 PH Parque Chapultepec · Cuernavaca
💰 $4,500,000 MXN
📱 777 175 84 12

${H_VID}
${H_LUX}
${H_PH}
${H_FAM}`, img: 'ph-sala-render.jpg' }
  ], tt: [
    { txt: `Ya solo queda 1 en Parque Chapultepec ⚠️

El departamento se vendió. El penthouse es la última unidad.
234m² + 86m² rooftop · $4.5M · Entrega inmediata
Cuernavaca, a 1.5h de CDMX.

¿Lo ves esta semana?
📱 777 175 84 12

${H_PH} ${H_INV} ${H_CVA}`, vid: 'video1-penthouse.mp4' },
    { txt: `La sala que cambia tu forma de vivir 🛋️

Ventanal de herrería negra · Muro galería · Parota
Penthouse Parque Chapultepec · Cuernavaca
$4.5M MXN · Solo 1 · Entrega inmediata

📱 WA: 777 175 84 12

${H_VID} ${H_LUX} ${H_FAM}`, vid: 'video3-cocina.mp4' }
  ]},

  // DÍA 6 — Cierre / visita privada
  { ig: [
    { txt: `La eterna primavera tiene una dirección. 📍

*Bajada de Chapultepec 18-A, Col. Chapultepec*
Cuernavaca, Morelos — a 50 metros del Parque Chapultepec.

El penthouse más exclusivo de Cuernavaca.
La última unidad disponible.
La oportunidad que no se repite.

🌟 234m² + 86m² · $4,500,000 MXN · Entrega inmediata
Agenda tu visita privada esta semana.

📱 777 175 84 12

${H_CVA}
${H_LUX}
${H_PH}
${H_GEN}
${H_INV}`, img: 'ph-jardin-fachada.jpg' },

    { txt: `Baños tipo spa. En Cuernavaca. En tu casa. 🚿

Travertino cálido de piso a techo.
Grifería negra mate y regadera tipo lluvia.
Latón en el espejo y los herrajes.
Parota en el mueble bajo lavabo.

Cada detalle pensado para que cada mañana se sienta como hotel cinco estrellas.

🌟 PH Parque Chapultepec · $4,500,000 MXN
📱 777 175 84 12

${H_VID}
${H_LUX}
${H_PH}
${H_CVA}`, img: 'ph-bano2-render.jpg' },

    { txt: `¿Cuándo fue la última vez que te tomaste algo así en serio? 🌿

Penthouse Parque Chapultepec:
✦ 234 m² de residencia premium
✦ 86 m² de roof garden con pérgola, asador y jacuzzi
✦ Vista a las montañas de Morelos
✦ A 50m del Parque Chapultepec · A 1.5h de CDMX
✦ Casa inteligente · Materiales nobles
✦ 3 rec + 3.5 baños + vestidor · 2 cajones + 2 bodegas

Solo queda 1. Entrega inmediata.
💰 $4,500,000 MXN

📱 Agenda tu visita: 777 175 84 12

${H_PH}
${H_INV}
${H_LUX}
${H_CVA}
${H_CDM}
${H_GEN}
${H_FAM}`, img: 'ph-rooftop-hero.jpg' }
  ], tt: [
    { txt: `7 razones para vivir en Parque Chapultepec 🌟

1. 330 días de sol
2. 50m del parque más bonito de Cuernavaca
3. Rooftop 86m² · pérgola · jacuzzi · asador
4. Alberca climatizada + jardín tropical
5. Casa inteligente · parota + travertino
6. 1.5h de CDMX sin tráfico
7. Entrega inmediata · Solo 1 disponible

📱 777 175 84 12

${H_PH} ${H_CVA} ${H_FAM}`, vid: 'video5-lifestyle.mp4' },
    { txt: `Agenda tu visita privada esta semana 📅

Bajada de Chapultepec 18-A, Cuernavaca
Penthouse · 234m² + 86m² rooftop
$4.5M MXN · Entrega inmediata

La eterna primavera te espera.
📱 WA: 777 175 84 12

${H_PH} ${H_CVA} ${H_INV} ${H_LUX}`, vid: 'video1-penthouse.mp4' }
  ]}
]

const gql = (q, v={}) => fetch('https://api.buffer.com', {
  method: 'POST',
  headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: q, variables: v })
}).then(r=>r.json())

async function post(channelId, text, dueAt, imgUrl, vidUrl) {
  const input = { channelId, text, dueAt, schedulingType:'automatic', mode:'customScheduled' }
  if (imgUrl) { input.assets=[{ image:{ url: imgUrl }}]; input.metadata={ instagram:{ type:'post', shouldShareToFeed:true }} }
  if (vidUrl) { input.assets=[{ video:{ url: vidUrl }}] }
  const d = await gql(`mutation CreatePost($input:CreatePostInput!){
    createPost(input:$input){
      ... on PostActionSuccess{post{id status dueAt}}
      ... on InvalidInputError{message}
      ... on LimitReachedError{message}
      ... on UnexpectedError{message}
    }}`, { input })
  return d?.data?.createPost
}

// Inicio mañana
const base = new Date()
base.setDate(base.getDate()+1)
base.setHours(0,0,0,0)

let ok=0, err=0, rateLimited=false

console.log('\n🚀 Programando 6 días — PH Parque Chapultepec')
console.log('   📸 Instagram @pchapultepec  🎵 TikTok @carlosmoralevega\n')

for (let dia=0; dia<6; dia++) {
  if (rateLimited) { console.log(`⚠️  Rate limit — quedan ${6-dia} días sin programar`); break }
  const d = new Date(base); d.setDate(d.getDate()+dia)
  const fechaStr = d.toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'})
  console.log(`\n📅 Día ${dia+1} — ${fechaStr}`)

  // IG: 9am, 3pm, 8pm CDMX = 14h, 20h, 01h UTC
  // TT: 12pm, 6pm CDMX = 17h, 23h UTC
  const t = (h) => { const dt=new Date(d); dt.setUTCHours(h,0,0,0); return dt.toISOString() }
  const agenda = [
    { fn: ()=>post(IG, DIAS[dia].ig[0].txt, t(14), `${CDN}/${DIAS[dia].ig[0].img}`, null), red:'📸 IG', hora:'09:00' },
    { fn: ()=>post(TT, DIAS[dia].tt[0].txt, t(17), null, `${CDN}/${DIAS[dia].tt[0].vid}`), red:'🎵 TT', hora:'12:00' },
    { fn: ()=>post(IG, DIAS[dia].ig[1].txt, t(20), `${CDN}/${DIAS[dia].ig[1].img}`, null), red:'📸 IG', hora:'15:00' },
    { fn: ()=>post(TT, DIAS[dia].tt[1].txt, t(23), null, `${CDN}/${DIAS[dia].tt[1].vid}`), red:'🎵 TT', hora:'18:00' },
    { fn: ()=>post(IG, DIAS[dia].ig[2].txt, t(25), `${CDN}/${DIAS[dia].ig[2].img}`, null), red:'📸 IG', hora:'20:00' },
  ]

  for (const { fn, red, hora } of agenda) {
    const r = await fn().catch(e => ({ error: e.message }))
    if (r?.post?.id) { console.log(`   ${red} ${hora} ✅ ID:${r.post.id.slice(-6)}`); ok++ }
    else if (r?.message?.includes('limit') || r?.message?.includes('Limit')) {
      console.log(`   ${red} ${hora} ⚠️  RATE LIMIT — Buffer plan gratuito (10 posts máx en cola)`); rateLimited=true; break
    }
    else { console.log(`   ${red} ${hora} ⚠️  ${r?.message||r?.error||'error'}`); err++ }
    await new Promise(r=>setTimeout(r,500))
  }
  if (rateLimited) break
}

console.log(`\n${'─'.repeat(55)}`)
console.log(`✅ Programados: ${ok}   ⚠️  Errores: ${err}`)
if (rateLimited) {
  console.log(`\n📋 CONTENIDO GUARDADO — Los posts están listos en este script.`)
  console.log(`   Ejecuta de nuevo cuando haya espacio en la cola de Buffer.`)
  console.log(`   O actualiza a Buffer Essentials (~$6/mes) para programar todos.`)
}
console.log(`\n🔗 Verifica: https://publish.buffer.com\n`)
