// Publica todos los posts en Instagram y TikTok via Buffer API GraphQL
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const KEY   = 'D8n8VswNRv-GDyIAhm09Z8Sd3mYIy8AkPY6OakHOd4z'
const IG_ID = '6a200357c687a22dd456797f'   // @pchapultepec
const TT_ID = '6a20036fc687a22dd45679d0'   // @parquechapultepec

const gql = (query, variables = {}) =>
  fetch('https://api.buffer.com', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  }).then(r => r.json())

// Convertir imagen a base64 para upload
const toBase64 = path => {
  const buf = readFileSync(path)
  return buf.toString('base64')
}

// Posts de Instagram con imágenes
const IG_POSTS = [
  {
    imagen: 'post1-penthouse-hero.jpg',
    caption: `Imagina despertar aquí cada mañana. ☀️

85 m² de rooftop privado con jacuzzi, asador y vista panorámica de Cuernavaca.
No es un resort. Es tu casa.

🏠 Penthouse exclusivo — última unidad disponible
💰 $4,500,000 MXN · Entrega inmediata
📍 A 50m del Parque Chapultepec, Cuernavaca

¿Te interesa conocerlo? Escríbenos al WA 👇
📱 777 175 84 12

#PenthouseCuernavaca #LujoCuernavaca #ParqueChapultepec #BienesRaicesCuernavaca #RooftopPrivado #Penthouse #Cuernavaca #InversionInmobiliaria #CasaDeLujo #MexicoLuxury`,
    dueHours: 2
  },
  {
    imagen: 'post3-depto-hero.jpg',
    caption: `Tu rooftop privado en Cuernavaca. 🌿

30 m² de deck de madera solo para ti — el lugar perfecto para el café de las mañanas o las cenas al aire libre.

🏠 Departamento 4° piso · 112 m²
💰 $2,800,000 MXN
✅ 2 recámaras · alberca · elevador · entrega inmediata

¿Lo quieres ver en persona? 📱 777 175 84 12

#RooftopPrivado #DepartamentoCuernavaca #ParqueChapultepec #VidaEnCuernavaca #BienesRaices #Cuernavaca2025 #InversionMexico`,
    dueHours: 26
  },
  {
    imagen: 'post4-alberca.jpg',
    caption: `Cuernavaca tiene 330 días de sol al año ☀️

Y tú podrías pasarlos así — en la alberca climatizada de Parque Chapultepec, rodeada de palmeras y jardín tropical.

Esto no es vacaciones. Es donde vas a vivir.

🌟 Penthouse · $4,500,000 MXN
🏠 Departamento · $2,800,000 MXN

📱 777 175 84 12
#AlbercaCuernavaca #VidaLujosa #Cuernavaca2025 #ResidencialExclusivo #CiudadEternaPrimavera #BienesRaicesMexico`,
    dueHours: 50
  },
  {
    imagen: 'post5-depto-terraza.jpg',
    caption: `Rooftop privado. Solo tuyo. 🪵

30 m² de deck de madera donde nadie más entra.
112 m² totales · Cocina integral · Elevador · 1 cajón + bodega.

Departamento 4° piso · $2,800,000 MXN · Entrega inmediata

¿Quieres verlo? 📱 777 175 84 12

#RooftopPrivado #DepartamentoCuernavaca #CocinaIntegral #ElevadorPropio #Cuernavaca #BienesRaices`,
    dueHours: 74
  },
  {
    imagen: 'post6-bano-lujo.jpg',
    caption: `Esto no es el lobby de un hotel 5 estrellas. 🪞

Es el baño de tu suite en Parque Chapultepec.

Travertino, herrería negra, ducha italiana y luz natural.
Los acabados que merecías.

Penthouse · 3 suites · $4,500,000 MXN
📱 777 175 84 12 para visita privada

#AcabadosDeLujo #Penthouse #Cuernavaca #DiseñoDeInteriores #BañoDeLujo #ArquitecturaMexico #LujoCuernavaca`,
    dueHours: 98
  },
  {
    imagen: 'post2-penthouse-rooftop.jpg',
    caption: `Solo queda 1. 🌟

En un residencial de 13 unidades exclusivas a 50m del Parque Chapultepec — el Penthouse sigue disponible.

336 m² · 3 suites · Rooftop 85 m² con jacuzzi · Elevador directo · 2 cajones techados.

La pregunta no es si puedes permitírtelo.
La pregunta es: ¿cuánto tiempo más va a seguir disponible?

📱 777 175 84 12
#ÚltimaUnidad #InversionInmobiliaria #Cuernavaca #Penthouse #BienesRaices #RooftopJacuzzi #PropiedadExclusiva`,
    dueHours: 122
  }
]

async function uploadMedia(imageBase64, channelId) {
  // Buffer GraphQL mutation para subir media
  const mutation = `
    mutation CreateMediaUploadRequest($input: CreateMediaUploadRequestInput!) {
      createMediaUploadRequest(input: $input) {
        uploadUrl
        id
        type
      }
    }
  `
  const result = await gql(mutation, {
    input: { channelId, mediaType: 'IMAGE' }
  })
  return result?.data?.createMediaUploadRequest
}

async function createPost(channelId, text, dueAt, imageB64) {
  // Intentar crear post con imagen via fileUpload
  const mutation = `
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        ... on Post {
          id
          status
          dueAt
          content {
            text
          }
        }
        ... on CoreAPIMutationError {
          message
          type
        }
      }
    }
  `
  const input = {
    channelId,
    content: { text },
    dueAt
  }

  const result = await gql(mutation, { input })
  return result
}

async function main() {
  console.log('\n🚀 Publicando en Buffer...\n')
  console.log('📱 Instagram: @pchapultepec')
  console.log('🎵 TikTok: @carlosmoralevega\n')

  const now = Date.now()
  let igOk = 0

  for (let i = 0; i < IG_POSTS.length; i++) {
    const post = IG_POSTS[i]
    const imgPath = join(__dir, 'posts-instagram', post.imagen)

    if (!existsSync(imgPath)) {
      console.log(`⚠️  No encontrada: ${post.imagen}`)
      continue
    }

    const dueAt = new Date(now + post.dueHours * 3600 * 1000).toISOString()
    console.log(`\n📸 Post ${i+1}/6: ${post.imagen}`)
    console.log(`   Programado: ${dueAt.replace('T', ' ').substring(0,16)} UTC`)

    const result = await createPost(IG_ID, post.caption, dueAt)

    if (result?.data?.createPost?.id) {
      console.log(`   ✅ Publicado — ID: ${result.data.createPost.id}`)
      igOk++
    } else if (result?.data?.createPost?.message) {
      console.log(`   ⚠️  ${result.data.createPost.message}`)
      // Intentar sin fecha (ahora)
      const result2 = await createPost(IG_ID, post.caption, new Date(now + (i+1)*3600000).toISOString())
      if (result2?.data?.createPost?.id) {
        console.log(`   ✅ Reintento OK — ID: ${result2.data.createPost.id}`)
        igOk++
      }
    } else {
      console.log(`   ❌ Error:`, JSON.stringify(result?.errors || result?.data))
    }

    await new Promise(r => setTimeout(r, 1000))
  }

  // TikTok - videos
  console.log('\n\n🎵 TikTok posts (texto + link a video)...\n')
  const TT_POSTS = [
    { text: '¿Cuánto cuesta vivir así en Cuernavaca? 👀\n\nRooftop con jacuzzi privado. Vista panorámica.\nSolo 13 unidades. Solo queda 1 Penthouse.\n\n💰 $4,500,000 MXN · Entrega inmediata\n📍 50m del Parque Chapultepec\n📱 WA: 777 175 84 12\n\n#Penthouse #Cuernavaca #BienesRaices #LujoCuernavaca #PenthouseMexico #InversionInmobiliaria #Rooftop #Jacuzzi', dueHours: 4 },
    { text: 'Tu rooftop privado en Cuernavaca por $2.8M 🌿\n\nDepartamento 4° piso · 112 m² · Deck de madera propio.\nAlberca climatizada · Elevador · Entrega inmediata.\n\n¿Lo quieres ver? WA: 777 175 84 12\n\n#DepartamentoCuernavaca #Rooftop #VidaEnCuernavaca #BienesRaicesMexico #CasaDeSueños', dueHours: 52 },
    { text: 'Nadie te habla de Cuernavaca. Nosotros sí. 🌳\n\n✅ 330 días de sol al año\n✅ 1.5 hrs de CDMX\n✅ Sin tráfico de CDMX\n✅ Propiedades de lujo aún accesibles\n\nParque Chapultepec Residencial.\n2 propiedades. Entrega inmediata.\n\n📱 777 175 84 12\n\n#Cuernavaca #CiudadEternaPrimavera #BienesRaicesMexico #InversionInmobiliaria', dueHours: 100 },
  ]

  let ttOk = 0
  for (let i = 0; i < TT_POSTS.length; i++) {
    const post = TT_POSTS[i]
    const dueAt = new Date(now + post.dueHours * 3600 * 1000).toISOString()
    console.log(`📱 TikTok ${i+1}/3: programado ${dueAt.substring(0,16)}`)

    const result = await createPost(TT_ID, post.text, dueAt)
    if (result?.data?.createPost?.id) {
      console.log(`   ✅ OK — ID: ${result.data.createPost.id}`)
      ttOk++
    } else {
      console.log(`   ⚠️`, JSON.stringify(result?.data?.createPost || result?.errors))
    }
    await new Promise(r => setTimeout(r, 500))
  }

  console.log(`\n✅ Instagram: ${igOk}/6 posts programados`)
  console.log(`✅ TikTok: ${ttOk}/3 posts programados`)
  console.log('\nVe a https://publish.buffer.com/schedule para ver el calendario\n')
}

main().catch(console.error)
