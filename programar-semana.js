// Programa 5 posts/día durante 7 días en Buffer
// 3 Instagram (@pchapultepec) + 2 TikTok (@carlosmoralevega)
import 'dotenv/config'

const KEY   = process.env.BUFFER_API_KEY
const IG    = '6a200357c687a22dd456797f'
const TT    = '6a20036fc687a22dd45679d0'
const CDN   = 'https://gnarxxwxagstuspkbvql.supabase.co/storage/v1/object/public/posts'

const gql = (q, v = {}) =>
  fetch('https://api.buffer.com', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q, variables: v })
  }).then(r => r.json())

// Crear post en Buffer (con o sin imagen)
async function publicar(channelId, text, dueAt, imageUrl = null) {
  const input = { channelId, text, dueAt }
  if (imageUrl) input.assets = [{ image: imageUrl }]
  const res = await gql(`
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        ... on Post { id status dueAt }
        ... on CoreAPIMutationError { message type }
      }
    }`, { input })
  return res?.data?.createPost
}

// ── CONTENIDO 7 DÍAS ──────────────────────────────────────────────────────────
// Cada día: 3 posts IG + 2 posts TT = 5 total
// Horarios CDMX: IG→9am(14:00UTC), IG→3pm(20:00UTC), IG→8pm(01:00UTC+1)
//                TT→12pm(17:00UTC), TT→6pm(23:00UTC)

const DIAS = [
  {
    dia: 0,
    ig: [
      {
        img: `${CDN}/post1-penthouse-hero.jpg`,
        txt: `Imagina despertar aquí cada mañana. ☀️

85 m² de rooftop privado con jacuzzi, asador y vista panorámica de Cuernavaca.
No es un resort. Es tu casa.

🌟 Penthouse exclusivo — última unidad
💰 $4,500,000 MXN · Entrega inmediata
📍 50m del Parque Chapultepec

📱 777 175 84 12

#PenthouseCuernavaca #LujoCuernavaca #ParqueChapultepec #BienesRaices #Rooftop #Jacuzzi #Cuernavaca`
      },
      {
        img: `${CDN}/post3-depto-hero.jpg`,
        txt: `Tu propio rooftop en Cuernavaca. 🌿

Deck de madera privado, solo tuyo.
Sin vecinos. Sin compartir. Sin límites.

🏠 Departamento 4° piso · 112 m²
💰 $2,800,000 MXN
✅ 2 recámaras · alberca · elevador · entrega inmediata

📱 777 175 84 12

#DepartamentoCuernavaca #RooftopPrivado #VidaEnCuernavaca #BienesRaicesMexico`
      },
      {
        img: `${CDN}/post4-alberca.jpg`,
        txt: `330 días de sol al año. ☀️

Tú decides si los pasas en una oficina o en la alberca climatizada de tu residencial.

Parque Chapultepec · Cuernavaca · 1.5h de CDMX

🌟 Penthouse $4.5M  🏠 Depto $2.8M
📱 777 175 84 12

#Cuernavaca #CiudadEternaPrimavera #AlbercaPrivada #BienesRaicesMexico #InversionInmobiliaria`
      }
    ],
    tt: [
      {
        txt: `¿Cuánto cuesta vivir así en Cuernavaca? 👀

Rooftop con jacuzzi privado. Vista panorámica. Solo 13 unidades.
La última disponible: Penthouse 336m² · $4,500,000 MXN

📍 50m del Parque Chapultepec
📱 WA: 777 175 84 12

#Penthouse #Cuernavaca #BienesRaices #LujoCuernavaca #Rooftop`
      },
      {
        txt: `Nadie te habla de Cuernavaca. Nosotros sí. 🌳

✅ 330 días de sol al año
✅ 1.5 hrs de CDMX
✅ Propiedades de lujo aún accesibles

2 unidades. Entrega inmediata.
📱 777 175 84 12

#Cuernavaca #CiudadEternaPrimavera #BienesRaicesMexico #InversionInmobiliaria`
      }
    ]
  },
  {
    dia: 1,
    ig: [
      {
        img: `${CDN}/post2-penthouse-rooftop.jpg`,
        txt: `Solo queda 1. 🌟

336 m² · Rooftop 85 m² con jacuzzi y asador · Elevador directo al departamento.
Esto no se vuelve a ver en Cuernavaca.

💰 $4,500,000 MXN · Entrega inmediata
📱 777 175 84 12

#ÚltimaUnidad #InversionInmobiliaria #Cuernavaca #Penthouse #BienesRaices #LujoMexicano`
      },
      {
        img: `${CDN}/post5-depto-terraza.jpg`,
        txt: `Esto es lo que ves desde tu rooftop. 🪵

30 m² de deck de madera solo tuyo.
Tu café de las mañanas con la ciudad a tus pies.

🏠 Departamento 4° piso · Parque Chapultepec
💰 $2,800,000 MXN
📱 777 175 84 12

#MiRooftop #Cuernavaca #VidaDeLujo #DepartamentoNuevo #BienesRaicesCuernavaca`
      },
      {
        img: `${CDN}/post6-bano-lujo.jpg`,
        txt: `Esto no es un hotel 5 estrellas. 🪞

Es el baño de tu suite.
Travertino · Herrería negra · Ducha italiana.

Penthouse · 3 suites · $4,500,000 MXN · Cuernavaca
📱 777 175 84 12

#AcabadosDeLujo #InterioresLujo #Penthouse #Cuernavaca #DiseñoDeInteriores`
      }
    ],
    tt: [
      {
        txt: `Esta es la cocina del departamento en Cuernavaca 🍳

Cocina integral · Área de lavado independiente · 112 m²
Desde $2,800,000 MXN · Entrega inmediata

📱 WA: 777 175 84 12

#CocinaDeEnsueño #Cuernavaca #DepartamentoNuevo #BienesRaices`
      },
      {
        txt: `Tu rooftop privado en Cuernavaca por $2.8M 🌿

Departamento 4° piso · 112 m² · Deck de madera propio
Alberca climatizada · Elevador · Entrega inmediata

📱 WA: 777 175 84 12

#DepartamentoCuernavaca #Rooftop #VidaEnCuernavaca #BienesRaicesMexico`
      }
    ]
  },
  {
    dia: 2,
    ig: [
      {
        img: `${CDN}/post4-alberca.jpg`,
        txt: `La alberca que cambia tu rutina de mañana. 🏊

Climatizada. Rodeada de palmeras y jardín tropical.
A 50 metros del Parque Chapultepec.

🌟 Penthouse $4.5M  🏠 Depto $2.8M
Entrega inmediata · Cuernavaca, Morelos

📱 777 175 84 12

#AlbercaCuernavaca #VidaLujosa #ResidencialExclusivo #BienesRaicesMexico`
      },
      {
        img: `${CDN}/post1-penthouse-hero.jpg`,
        txt: `El Penthouse que todos quieren y solo uno puede tener. 🌟

Última unidad disponible.
336 m² · Jacuzzi · Asador · Elevador privado · Vista panorámica.

📍 Cuernavaca · A 1.5h de CDMX
💰 $4,500,000 MXN
📱 777 175 84 12

#PenthouseExclusivo #LujoCuernavaca #BienesRaicesMexico #InversionInmobiliaria`
      },
      {
        img: `${CDN}/post3-depto-hero.jpg`,
        txt: `Inversión inteligente en la ciudad de la eterna primavera. 🌺

$2,800,000 MXN · 112 m² · Rooftop privado 30 m²
2 recámaras · 2 baños · Cocina integral · Elevador

Parque Chapultepec, Cuernavaca
📱 777 175 84 12

#InversionInmobiliaria #CuernavacaLujo #DepartamentoNuevo #PatrimonioFamiliar`
      }
    ],
    tt: [
      {
        txt: `¿Por qué elegir Cuernavaca sobre CDMX? 🤔

✅ 30% más barato por m²
✅ 0 tráfico
✅ 330 días de sol
✅ 1.5h de la capital

Parque Chapultepec · 2 unidades · Entrega inmediata
📱 777 175 84 12

#CuernavacaVsCDMX #BienesRaicesMexico #InversionInteligente`
      },
      {
        txt: `POV: tu balcón privado en Cuernavaca 🌿

30m² de deck de madera · solo para ti
Departamento 4° piso · $2,800,000 MXN

¿Cuándo agendamos tu visita?
📱 777 175 84 12

#RooftopPrivado #Cuernavaca #DepartamentoLujo`
      }
    ]
  },
  {
    dia: 3,
    ig: [
      {
        img: `${CDN}/post2-penthouse-rooftop.jpg`,
        txt: `Vista desde el rooftop del Penthouse. 🌅

85 m² privados. Jacuzzi. Asador BBQ. Pérgola.
Solo tuyo, cada día.

Parque Chapultepec · Cuernavaca · Última unidad
💰 $4,500,000 MXN
📱 777 175 84 12

#VistaCuernavaca #RooftopJacuzzi #PenthouseExclusivo #BienesRaices`
      },
      {
        img: `${CDN}/post5-depto-terraza.jpg`,
        txt: `Tu espacio favorito aún no lo conoces. 🪵

Deck de madera privado · 30 m²
Para el yoga de las mañanas, las cenas al atardecer, o simplemente respirar.

🏠 Departamento · Parque Chapultepec · Cuernavaca
💰 $2,800,000 MXN · Entrega inmediata
📱 777 175 84 12

#EspacioPropio #DepartamentoCuernavaca #VidaEnCuernavaca`
      },
      {
        img: `${CDN}/post6-bano-lujo.jpg`,
        txt: `Detalles que marcan la diferencia. ✨

Travertino importado · Herrería forjada · Ducha italiana de piso a techo.
Cada material elegido para durar décadas.

Penthouse · 3 suites de lujo · Cuernavaca
📱 777 175 84 12

#AcabadosDeLujo #DiseñoDeInteriores #CasaDeLujo #BienesRaicesMexico`
      }
    ],
    tt: [
      {
        txt: `Si tienes $2.8M MXN, ¿qué compras en Cuernavaca? 🏠

➡️ 112 m² + rooftop privado 30 m²
➡️ 2 recámaras + 2 baños
➡️ Alberca climatizada
➡️ Elevador + cajón + bodega

Parque Chapultepec · Entrega inmediata
📱 777 175 84 12

#InversionMexico #DepartamentoNuevo #Cuernavaca`
      },
      {
        txt: `Esto cuesta $4.5M en Cuernavaca 👀

336 m² · 3 suites · Rooftop 85 m² con jacuzzi
Elevador privado al departamento · Acabados de lujo

Solo 1 disponible. No hay más.
📱 777 175 84 12

#Penthouse #LujoCuernavaca #ÚltimaUnidad`
      }
    ]
  },
  {
    dia: 4,
    ig: [
      {
        img: `${CDN}/post1-penthouse-hero.jpg`,
        txt: `Algunas personas compran un depto. Otras compran una experiencia. 🌟

Penthouse Parque Chapultepec:
→ Jacuzzi privado con vista a la ciudad
→ Asador en el rooftop
→ Elevador exclusivo
→ Acabados europeos

💰 $4,500,000 MXN · Cuernavaca
📱 777 175 84 12

#ExperienciaLujo #PenthouseCuernavaca #BienesRaicesMexico`
      },
      {
        img: `${CDN}/post4-alberca.jpg`,
        txt: `Enero · Febrero · Marzo · … · Diciembre ☀️

En Cuernavaca, la alberca no tiene temporada.
330 días de sol al año. Todo el año.

Parque Chapultepec · 2 unidades disponibles
🌟 Penthouse $4.5M  🏠 Depto $2.8M
📱 777 175 84 12

#CiudadEternaPrimavera #AlbercaTodoElAño #CuernavacaLujo`
      },
      {
        img: `${CDN}/post3-depto-hero.jpg`,
        txt: `2 recámaras · 2 baños · 112 m² · Rooftop propio 🏠

Todo lo que necesitas.
Nada que te sobre.

Departamento 4° piso · Parque Chapultepec · Cuernavaca
💰 $2,800,000 MXN · Entrega inmediata
📱 777 175 84 12

#DepartamentoIdeal #CuernavacaInmuebles #BienesRaicesMX`
      }
    ],
    tt: [
      {
        txt: `Lo que incluye el Penthouse por $4.5M 🌟

✅ 336 m² totales
✅ 3 suites con baño
✅ Rooftop 85m² · jacuzzi · asador
✅ Elevador directo
✅ Acabados de lujo
✅ Cajones + bodega

Parque Chapultepec · Cuernavaca
📱 777 175 84 12`
      },
      {
        txt: `Lo que incluye el Depto por $2.8M 🏠

✅ 112 m² totales
✅ 2 recámaras · 2 baños
✅ Rooftop privado 30m²
✅ Cocina integral
✅ Alberca + elevador
✅ Cajón + bodega

Parque Chapultepec · Cuernavaca
📱 777 175 84 12`
      }
    ]
  },
  {
    dia: 5,
    ig: [
      {
        img: `${CDN}/post2-penthouse-rooftop.jpg`,
        txt: `Pregunta: ¿Dónde quieres vivir en 2 años? 📍

Si la respuesta es "en un lugar tranquilo, con espacio, cerca de la naturaleza y a 1.5h de CDMX"...

Parque Chapultepec, Cuernavaca.
Última unidad Penthouse disponible.

📱 777 175 84 12 · parquechapultepecmorelos.com

#PlanesTuFuturo #Cuernavaca #BienesRaicesMexico #InversionFamiliar`
      },
      {
        img: `${CDN}/post5-depto-terraza.jpg`,
        txt: `¿Qué harías con 30 m² solo para ti? 🌿

Algunos: yoga al amanecer
Otros: home office al aire libre
Otros más: cenas con vista a la ciudad

Tu rooftop privado · Departamento 4° piso · Cuernavaca
💰 $2,800,000 MXN
📱 777 175 84 12

#RooftopIdeas #DepartamentoCuernavaca #EspacioPropio`
      },
      {
        img: `${CDN}/post1-penthouse-hero.jpg`,
        txt: `El tiempo corre. Solo queda 1. ⏳

Penthouse Parque Chapultepec:
✦ 336 m² · ✦ Rooftop jacuzzi · ✦ Elevador privado
✦ 3 suites · ✦ Acabados de lujo · ✦ Entrega inmediata

$4,500,000 MXN · Cuernavaca, Morelos
📱 777 175 84 12

#Urgente #ÚltimaUnidad #PenthouseExclusivo #Cuernavaca`
      }
    ],
    tt: [
      {
        txt: `¿Sabes qué pasa cuando solo queda 1 Penthouse? 🌟

Que el próximo que llame se lo lleva.

336m² · Jacuzzi · Asador · Elevador privado
$4,500,000 MXN · Entrega inmediata · Cuernavaca

📱 777 175 84 12

#ÚltimaUnidad #NoEsperes #Penthouse`
      },
      {
        txt: `El departamento más bonito de Cuernavaca 🏠

(Según todos los que lo han visto)

112m² + rooftop privado 30m²
$2,800,000 MXN · Parque Chapultepec

¿Cuándo lo ves tú?
📱 777 175 84 12`
      }
    ]
  },
  {
    dia: 6,
    ig: [
      {
        img: `${CDN}/post6-bano-lujo.jpg`,
        txt: `Los detalles que elevan un departamento a obra de arte. 🪞

Travertino blanco · Herrería forjada negra
Ducha italiana de piso a techo · Accesorios satinados.

Penthouse Parque Chapultepec · Cuernavaca
$4,500,000 MXN · Entrega inmediata
📱 777 175 84 12

#DiseñoDeInteriores #LujoMexicano #BañoDeLujo #CasaDeLujo`
      },
      {
        img: `${CDN}/post4-alberca.jpg`,
        txt: `Vivir en Cuernavaca no es escapar de la ciudad. 🌺

Es elegir una vida mejor.

Jardín tropical · Alberca climatizada · Seguridad 24h
A 50m del Parque Chapultepec · A 1.5h de CDMX

🌟 Penthouse $4.5M  🏠 Depto $2.8M
📱 777 175 84 12

#ElegirCuernavaca #CalidadDeVida #CiudadEternaPrimavera`
      },
      {
        img: `${CDN}/post2-penthouse-rooftop.jpg`,
        txt: `Última semana para tomar la mejor decisión del año. 📅

Penthouse Parque Chapultepec · Cuernavaca
→ 336 m² · Rooftop 85 m² · Jacuzzi + asador
→ Elevador privado · 3 suites · Acabados de lujo

💰 $4,500,000 MXN · Entrega inmediata
📱 777 175 84 12 · Agendamos tu visita hoy

#TomeLaDecisión #BienesRaicesMexico #PenthouseCuernavaca`
      }
    ],
    tt: [
      {
        txt: `7 razones para vivir en Parque Chapultepec 🏡

1. 330 días de sol
2. 50m del parque más bonito de Cuernavaca
3. Rooftop privado
4. Alberca climatizada
5. Seguridad 24h
6. 1.5h de CDMX
7. Entrega inmediata

📱 777 175 84 12`
      },
      {
        txt: `Cuernavaca 2026 🌳

Ya no es secreto. Ya no es "la alternativa".
Es la decisión inteligente.

Parque Chapultepec · 2 unidades · Entrega inmediata
🌟 $4.5M Penthouse · 🏠 $2.8M Depto

📱 777 175 84 12

#Cuernavaca2026 #InversionInteligente #BienesRaices`
      }
    ]
  }
]

// Horarios UTC para 9am, 3pm, 8pm CDMX (UTC-5)
// 9am CDMX  = 14:00 UTC
// 12pm CDMX = 17:00 UTC
// 3pm CDMX  = 20:00 UTC
// 6pm CDMX  = 23:00 UTC
// 8pm CDMX  = 01:00 UTC (día+1)

async function main() {
  console.log('\n🚀 Programando 7 días de contenido en Buffer...')
  console.log('   📸 Instagram: @pchapultepec')
  console.log('   🎵 TikTok: @carlosmoralevega\n')

  const hoy = new Date()
  // Empezar mañana para no pisar posts de hoy
  const inicio = new Date(hoy)
  inicio.setDate(inicio.getDate() + 1)
  inicio.setHours(0, 0, 0, 0)

  let ok = 0, err = 0

  for (const { dia, ig, tt } of DIAS) {
    const base = new Date(inicio)
    base.setDate(base.getDate() + dia)

    console.log(`\n📅 Día ${dia + 1} — ${base.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}`)

    // IG Post 1 — 9am CDMX (14:00 UTC)
    const ig1 = new Date(base); ig1.setUTCHours(14, 0, 0, 0)
    // IG Post 2 — 3pm CDMX (20:00 UTC)
    const ig2 = new Date(base); ig2.setUTCHours(20, 0, 0, 0)
    // IG Post 3 — 8pm CDMX (01:00 UTC día+1)
    const ig3 = new Date(base); ig3.setUTCHours(25, 0, 0, 0)
    // TT Post 1 — 12pm CDMX (17:00 UTC)
    const tt1 = new Date(base); tt1.setUTCHours(17, 0, 0, 0)
    // TT Post 2 — 6pm CDMX (23:00 UTC)
    const tt2 = new Date(base); tt2.setUTCHours(23, 0, 0, 0)

    const agenda = [
      { canal: IG, red: '📸 IG', hora: ig1, data: ig[0] },
      { canal: TT, red: '🎵 TT', hora: tt1, data: tt[0] },
      { canal: IG, red: '📸 IG', hora: ig2, data: ig[1] },
      { canal: TT, red: '🎵 TT', hora: tt2, data: tt[1] },
      { canal: IG, red: '📸 IG', hora: ig3, data: ig[2] },
    ]

    for (const { canal, red, hora, data } of agenda) {
      const horaStr = hora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' })
      process.stdout.write(`   ${red} ${horaStr} — "${data.txt.split('\n')[0].substring(0, 45)}…" `)
      try {
        const r = await publicar(canal, data.txt, hora.toISOString(), data.img || null)
        if (r?.id) {
          console.log(`✅`)
          ok++
        } else {
          console.log(`⚠️  ${r?.message || 'Sin ID'}`)
          err++
        }
      } catch (e) {
        console.log(`❌ ${e.message}`)
        err++
      }
      // Pausa para no saturar la API
      await new Promise(r => setTimeout(r, 400))
    }
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`✅ Programados: ${ok}   ❌ Errores: ${err}`)
  console.log(`Total esperado: 35 posts (5/día × 7 días)`)
  console.log(`\nVe a https://publish.buffer.com para verificar\n`)
}

main().catch(console.error)
