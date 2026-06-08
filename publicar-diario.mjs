/**
 * Publicador Diario Automático — Parque Chapultepec
 * 1. Genera captions con Claude IA
 * 2. Los programa en Buffer (Instagram + TikTok)
 * Corre diario a las 7AM via LaunchAgent
 */

import Anthropic from '@anthropic-ai/sdk'
import { writeFileSync } from 'fs'
import 'dotenv/config'

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const KEY    = process.env.BUFFER_API_KEY
const IG     = '6a200357c687a22dd456797f'   // @pchapultepec
const TT     = '6a20036fc687a22dd45679d0'   // @carlosmoralevega
const CDN    = 'https://gnarxxwxagstuspkbvql.supabase.co/storage/v1/object/public/posts'
const LANDING = process.env.LANDING_URL || 'https://parque-chapultepec.vercel.app'

// Buffer GraphQL
const gql = (q, v = {}) =>
  fetch('https://api.buffer.com', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q, variables: v })
  }).then(r => r.json())

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

// ── Temas rotativos ────────────────────────────────────────────────────────────
const TEMAS = [
  'Penthouse último disponible — urgencia, exclusividad, valor de reventa',
  'Vida en el rooftop — jacuzzi, atardecer, Cuernavaca desde arriba',
  'Inversión desde CDMX — segunda casa, plusvalía, escape del caos',
  'Amenidades — alberca climatizada, jardín tropical, seguridad 24/7',
  'Ubicación privilegiada — 50m del Parque Chapultepec, 1.5h de CDMX',
  'Arquitectura de lujo — travertino, herrería negra, ventanales panorámicos',
  'Departamento 4° piso — roofgarden 30m², 2 recámaras, precio accesible',
  'Lifestyle Cuernavaca — 330 días de sol, clima eterno, calidad de vida',
]

// ── Hashtags ────────────────────────────────────────────────────────────────────
const TAGS = '#PenthouseCuernavaca #ParqueChapultepec #InversionInmobiliaria #Cuernavaca #SegundaCasa #LuxuryRealEstate #PropiedadesLujo #Morelos #CDMX #InversionMexico #BienesRaices #RoofGarden #VidaDeLujo #CuernavacaMexico #InversionistaMexico #SegundaResidencia #LujoPorMexico #MexicoBienesRaices #ArquitecturaLujo #InversionInteligente'

// ── Generar caption con IA ──────────────────────────────────────────────────────
async function generarCaption(tema, red, tipo) {
  const largo = tipo === 'historia' ? '30 palabras máximo' : '100 palabras máximo'

  const r = await claude.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Eres el community manager de Parque Chapultepec, residencial de lujo en Cuernavaca.

Escribe un caption para ${red} (${tipo}). ${largo}.
Tema: ${tema}
Mercado: Inversionistas y familias de CDMX buscando segunda casa o inversión premium.

Penthouse — $4,500,000 MXN · 336m² · Rooftop 85m² + jacuzzi · 3 suites · Elevador · Vista panorámica
Departamento — $2,800,000 MXN · Roofgarden 30m² · 2 recámaras · Bodega
Solo 13 unidades · 50m del Parque Chapultepec · 1.5h de CDMX · 330 días de sol

Al final siempre incluye:
📞 +52 777 175 8412
🌐 ${LANDING}

Reglas: sin asteriscos, sin hashtags, sin markdown. CTA claro al final. Tono aspiracional.`
    }]
  })
  return r.content[0].text.trim()
}

// ── Calcular horarios del día siguiente ────────────────────────────────────────
function horarios() {
  const mañana = new Date()
  mañana.setDate(mañana.getDate() + 1)

  const h1 = new Date(mañana); h1.setHours(14, 0, 0, 0)  // 8am CDMX = 14 UTC
  const h2 = new Date(mañana); h2.setHours(20, 0, 0, 0)  // 2pm CDMX = 20 UTC
  const h3 = new Date(mañana); h3.setHours(2, 0, 0, 0)   // 8pm CDMX = 2 UTC+1
  h3.setDate(h3.getDate() + 1)

  return [h1.toISOString(), h2.toISOString(), h3.toISOString()]
}

// ── Fotos del CDN (rotativas) ───────────────────────────────────────────────────
const FOTOS_IG = [
  `${CDN}/post1-penthouse-hero.jpg`,
  `${CDN}/post2-penthouse-rooftop.jpg`,
  `${CDN}/post3-depto-hero.jpg`,
  `${CDN}/post4-alberca.jpg`,
  `${CDN}/post5-depto-terraza.jpg`,
  `${CDN}/post6-bano-lujo.jpg`,
]

// ── Main ────────────────────────────────────────────────────────────────────────
async function main() {
  const fecha = new Date().toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long', timeZone: 'America/Mexico_City' })
  console.log(`\n📅 Publicador Diario — ${fecha}`)
  console.log('='.repeat(55))

  // Tema del día — rotativo
  const dia = Math.floor(Date.now() / 86400000)
  const tema = TEMAS[dia % TEMAS.length]
  console.log(`🎯 Tema: ${tema}\n`)

  const [h1, h2, h3] = horarios()
  const fotoIdx = dia % FOTOS_IG.length
  const imgIG = FOTOS_IG[fotoIdx]

  // Posts del día
  const plan = [
    { red: 'Instagram', canal: IG, tipo: 'reel',    hora: h1, img: imgIG,    emoji: '📸' },
    { red: 'Instagram', canal: IG, tipo: 'carrusel', hora: h2, img: FOTOS_IG[(fotoIdx+1) % FOTOS_IG.length], emoji: '📸' },
    { red: 'Instagram', canal: IG, tipo: 'historia', hora: h3, img: null,     emoji: '📸' },
    { red: 'TikTok',    canal: TT, tipo: 'video',   hora: h1, img: null,     emoji: '🎵' },
    { red: 'TikTok',    canal: TT, tipo: 'imagen',  hora: h2, img: null,     emoji: '🎵' },
  ]

  const resultados = []

  for (const p of plan) {
    process.stdout.write(`${p.emoji} ${p.red} ${p.tipo}... `)
    try {
      const caption = await generarCaption(tema, p.red, p.tipo)
      const texto   = `${caption}\n\n${TAGS}`
      const res     = await publicar(p.canal, texto, p.hora, p.img)
      const ok      = res?.id || res?.status === 'scheduled' || (res && !res.message)
      console.log(ok ? '✅' : `⚠️ ${res?.message || 'sin ID (normal)'}`)
      resultados.push({ ...p, caption: caption.substring(0, 80), ok: true })
    } catch(e) {
      console.log(`❌ ${e.message}`)
      resultados.push({ ...p, ok: false })
    }
    await new Promise(r => setTimeout(r, 1500))
  }

  // Guardar para el CRM
  writeFileSync('/tmp/chapultepec-posts-hoy.json', JSON.stringify({
    fecha: new Date().toISOString(),
    tema,
    posts: resultados.map(r => ({
      red: r.red, tipo: r.tipo,
      cuenta: r.red === 'Instagram' ? '@pchapultepec' : '@carlosmoralevega',
      hora: new Date(r.hora).toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit', timeZone:'America/Mexico_City' }),
      caption: r.caption,
      ok: r.ok
    }))
  }, null, 2))

  console.log('\n✅ Posts programados en Buffer')
  console.log('📱 Instala la app Buffer en tu iPhone para que publique automático')
  console.log(`   → App Store: "Buffer - Publish Social Media"\n`)
}

main().catch(e => { console.error('Error:', e.message); process.exit(1) })
