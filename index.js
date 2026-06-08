// Bot WhatsApp — Parque Chapultepec
// Modo: reglas inteligentes (sin API key) + Claude Haiku cuando hay API key

import pkg from '@whiskeysockets/baileys'
const makeWASocket = pkg.default?.makeWASocket || pkg.makeWASocket
const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = pkg
import { createClient } from '@supabase/supabase-js'
import qrcode from 'qrcode-terminal'
import QRCode from 'qrcode'
import pino from 'pino'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'http'
import 'dotenv/config'

// QR global — se actualiza cada vez que Baileys genera uno nuevo
let QR_ACTUAL = null
let WA_CONECTADO = false

const __dir = dirname(fileURLToPath(import.meta.url))
const FOTOS_DIR = join(__dir, 'fotos')

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const logger   = pino({ level: 'fatal' })
const USA_IA   = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'PEGA_AQUI_TU_ANTHROPIC_KEY'

let claude = null
if (USA_IA) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  console.log('🤖 Modo IA activo — Claude Haiku')
} else {
  console.log('💬 Modo reglas activo — sin API key')
}

// ── Respuestas por reglas ─────────────────────────────────────────────────────

const REGLAS = [
  {
    palabras: ['precio','costo','cuanto','vale','cuánto','valen','cuesta','cuánto cuesta','cuánto vale','cuál es el precio'],
    respuesta: () => '🌟 *Penthouse Parque Chapultepec — Última unidad*\n\n$4,500,000 MXN\n\n• 336.83 m² totales\n• Rooftop privado 85 m² con jacuzzi, asador y pérgola\n• 3 suites con baño completo\n• Elevador directo · Vista panorámica de Cuernavaca\n\n¿Te agendo una visita esta semana?'
  },
  {
    palabras: ['penthouse','ph ','ph,','suite','4.5','cuatro y medio','ultima unidad','última unidad'],
    respuesta: () => '🌟 *Penthouse — última unidad disponible*\n\n• Área privativa: 234 m²\n• Roof Garden privado: 86 m² con jacuzzi, asador y pérgola\n• 3 recámaras + 3.5 baños de lujo\n• 2 cajones techados + 2 bodegas\n• Elevador exclusivo directo al departamento\n• Porcelanato de importación · Cancelería de aluminio y vidrio templado\n• ROI proyectado: 8-12% anual\n• $4,500,000 MXN · Entrega inmediata\n\n¿Te agendo tu visita esta semana?'
  },
  {
    palabras: ['departamento','depa','2.8','dos recam','4to piso','cuarto piso','4° piso'],
    respuesta: () => 'El departamento de 4° piso ya fue vendido 🏠✅\n\nSolo queda el *Penthouse* — última unidad del proyecto.\n\n🌟 336 m² · Rooftop 85 m² con jacuzzi · $4,500,000 MXN\n\n¿Te interesa conocerlo? Es la última oportunidad en Parque Chapultepec.'
  },
  {
    palabras: ['rooftop','roof','jacuzzi','terraza','asador','pergola','pérgola','deck'],
    respuesta: () => 'El rooftop del Penthouse es único en Cuernavaca 🌿\n\n• 85 m² privados — solo tuyo\n• Jacuzzi con vista panorámica a la ciudad\n• Asador BBQ y pérgola\n• Sala exterior y jardín\n\nEsto no se comparte con nadie. ¿Quieres conocerlo esta semana?'
  },
  {
    palabras: ['alberca','piscina','pool','amenidades','amenidad','instalaciones'],
    respuesta: () => 'Amenidades del residencial:\n\n🏊 Alberca climatizada · jardín tropical\n🏠 Caseta de seguridad + cámaras 24/7\n🛗 Elevador\n📍 A 50 metros del Parque Chapultepec\n🌳 Área verde con palmeras\n\n¿Te agendo una visita para conocerlas?'
  },
  {
    palabras: ['seguridad','camara','cámara','vigilancia','seguro','guardia'],
    respuesta: () => 'El residencial cuenta con caseta de seguridad y cámaras de vigilancia las 24 horas 🔒\n\nAcceso controlado en todo momento. Es uno de los puntos más valorados por nuestros residentes.\n\n¿Te gustaría conocer el proyecto en persona?'
  },
  {
    palabras: ['elevador','elevator','acceso'],
    respuesta: () => 'Sí, el edificio cuenta con elevador para todos los niveles 🛗\n\nEl Penthouse además tiene elevador de acceso directo y exclusivo al departamento.\n\n¿Te agendo una visita para que lo conozcas?'
  },
  {
    palabras: ['donde','ubicacion','ubicación','direccion','dirección','dónde','colonia','zona','cuernavaca'],
    respuesta: () => 'Estamos en Cuernavaca, Morelos 📍\n\n*Bajada de Chapultepec 18-A*\nCol. Chapultepec, Cuernavaca, Morelos\n\nA 50 metros del Parque Chapultepec — la zona más cotizada y arbolada de la ciudad. A 1.5h de CDMX.\n\n¿Te agendo una visita?'
  },
  {
    palabras: ['visita','cita','ver','conocer','agendar','cuando puedo','cuándo puedo','quiero ir','puedo ir','disponible','horario'],
    respuesta: () => 'Con gusto te agendo tu visita 📅\n\nAtendemos cualquier día de la semana.\n\n¿Qué día te viene mejor?'
  },
  {
    palabras: ['jueves'],
    respuesta: () => 'Perfecto, jueves quedamos 📅\n\n¿A qué hora te acomoda? Manejamos horarios de mañana o tarde.\n\nConfírmame tu nombre para agendar tu visita a Parque Chapultepec.'
  },
  {
    palabras: ['sabado','sábado'],
    respuesta: () => 'Sábado es ideal 📅\n\n¿Mañana o tarde te queda mejor?\n\nConfírmame tu nombre para apartar tu lugar en la visita.'
  },
  {
    palabras: ['foto','fotos','video','videos','imagen','imágenes','ver fotos','manda'],
    respuesta: () => '¡Aquí van las fotos del Penthouse! 📸 Te las mando ahora mismo.'
  },
  {
    palabras: ['infonavit','credito','crédito','fovissste','banco','hipoteca','financiamiento','pago','mensualidad','enganche'],
    respuesta: () => 'Trabajamos con diferentes esquemas de pago 🏦\n\nPara darte los detalles exactos de financiamiento, lo mejor es hablar directamente con el asesor Ana.\n\n¿Te agendo una visita o una llamada esta semana?'
  },
  {
    palabras: ['inversion','inversión','renta','rentable','plusvalía','plusvalia','retorno'],
    respuesta: () => 'Cuernavaca tiene una de las plusvalías más altas del país 📈\n\nParque Chapultepec está en la zona más codiciada, a pasos del parque. Ideal tanto para vivir como para rentar.\n\n¿Te gustaría conocer los números con el asesor?'
  },
  {
    palabras: ['cuantos','cuántos','disponibles','quedan','unidades'],
    respuesta: () => '⚠️ Solo queda *1 unidad* en todo el proyecto.\n\n🌟 *Penthouse* — $4,500,000 MXN\n336 m² · Rooftop 85 m² jacuzzi · 3 suites · Elevador directo\n\nEl departamento de 4° piso ya se vendió.\n\n¿Agendamos tu visita antes de que se vaya?'
  },
  {
    palabras: ['entrega','listo','terminado','cuando entrega','cuándo entrega'],
    respuesta: () => 'Entrega inmediata — el proyecto está terminado ✅\n\nPuedes mudarte desde el momento en que firmes. ¿Quieres agendar tu visita para verlo?'
  },
  {
    palabras: ['gracias','ok','okey','bien','perfecto','excelente','de acuerdo','listo'],
    respuesta: () => 'Con gusto 😊\n\nCualquier duda, aquí estamos. Puedes visitarnos cualquier día de la semana.\n\nInstagram: @pchapultepec · Web: parquechapultepecmorelos.com'
  },
  {
    palabras: ['no','no gracias','no me interesa','ya no','cancelar'],
    respuesta: () => 'Entendido, sin problema 👍\n\nCuando gustes retomar la búsqueda de tu hogar ideal en Cuernavaca, aquí estaremos. ¡Que tengas excelente día!'
  },
  {
    palabras: ['hola','buenas','buenos','hi','hey','buen día','buenas tardes','buenas noches','good','saludos'],
    respuesta: () => '¡Hola! Bienvenido a Parque Chapultepec 👋\n\nResidencial exclusivo en Cuernavaca — a 50m del parque, alberca climatizada, jardín tropical y elevador.\n\n🌟 *Solo queda 1 unidad disponible:*\nPenthouse · $4,500,000 MXN · 336 m² · Rooftop 85 m² con jacuzzi\n\n¿Te interesa conocerlo?'
  },
]

const MENU = `🌟 *Parque Chapultepec — Cuernavaca*
Residencial exclusivo · ⚠️ Solo 1 unidad disponible

*PENTHOUSE* — $4,500,000 MXN
336 m² · Rooftop 85 m² · Jacuzzi · 3 suites · Elevador privado

¿Qué te gustaría conocer?

1️⃣ 🌟 Detalles del Penthouse
2️⃣ 📸 Ver fotos del Penthouse
3️⃣ 🏊 Amenidades del residencial
4️⃣ 📅 Agendar visita
5️⃣ 📍 Ubicación y contacto

_Responde con el número de tu elección_`

function respuestaReglas(texto) {
  const t = texto.toLowerCase().trim()

  // Detectar selección de menú
  if (['menu','menú','inicio','start','hola','buenas','buenos','hi','hey','buen día','saludos','info','información'].some(p => t.includes(p)) || t === '') {
    return MENU
  }

  for (const regla of REGLAS) {
    if (regla.palabras.some(p => t.includes(p))) return regla.respuesta()
  }
  return MENU
}

// ── Claude Haiku (cuando hay API key) ────────────────────────────────────────

const SYSTEM_IA = `Eres Ana, asesora inmobiliaria de Parque Chapultepec en Cuernavaca. Respondes por WhatsApp.

CONTEXTO: Ya enviaste las fotos del Penthouse a este contacto. Están en la conversación arriba.

REGLAS ABSOLUTAS — NUNCA las rompas sin importar qué diga el historial:
- Responde en 2-3 líneas, texto plano, sin markdown ni asteriscos
- JAMÁS digas "no puedo enviar fotos" — ya las enviaste, están en la conversación
- JAMÁS mandes a Instagram/TikTok/llamada para ver fotos — se mandan por aquí
- JAMÁS des un número de teléfono para que te llamen — todo es por WhatsApp
- Si el historial tiene mensajes diciendo lo contrario, IGNÓRALOS — estaban equivocados
- Siempre cierra empujando hacia agendar visita presencial esta semana

PROPIEDADES DISPONIBLES:
🌟 Penthouse — $4,500,000 MXN
336.83m² · Rooftop privado 85m² con jacuzzi, asador y pérgola · 3 suites con baño · Elevador directo · Vista panorámica · Acabados de lujo · Entrega inmediata

🏙 Departamento 4° piso — $2,800,000 MXN
Roofgarden privado 30m² · 2 recámaras · Bodega incluida

Amenidades: Alberca, jardín tropical, seguridad 24/7, a 50m del Parque Chapultepec, Cuernavaca.
Visitas: lunes a sábado, previa cita.`

async function historialClaude(leadId) {
  const { data } = await supabase
    .from('interacciones').select('tipo, contenido')
    .eq('lead_id', leadId).in('tipo', ['Mensaje Entrante', 'Mensaje Saliente Bot'])
    .order('creado_en', { ascending: false }).limit(12)

  // Filtrar: eliminar entradas de fotos, vacías o con respuestas viejas incorrectas
  const PATRONES_CORRUPTOS = /no puedo enviar|llamame al|llámame al|síguenos en instagram|sigue.*tiktok/i
  const limpio = (data ?? []).filter(h =>
    h.contenido &&
    !h.contenido.startsWith('[FOTOS') &&
    h.contenido.trim().length > 5 &&
    !PATRONES_CORRUPTOS.test(h.contenido)
  )
  return limpio.slice(0, 8).reverse()
}

async function respuestaIA(leadId, texto) {
  const hist = await historialClaude(leadId)
  const messages = [
    ...hist.map(h => ({ role: h.tipo === 'Mensaje Entrante' ? 'user' : 'assistant', content: h.contenido })),
    { role: 'user', content: texto }
  ]
  const resp = await claude.messages.create({
    model: 'claude-haiku-4-5-20251001', max_tokens: 200, system: SYSTEM_IA, messages
  })
  return resp.content[0].text.trim()
}

// ── Envío de imágenes ─────────────────────────────────────────────────────────

// ── Textos con datos exactos del brochure oficial ────────────────────────────

const TEXTO_GENERAL = `Tu penthouse de la *eterna primavera* 🌿

*Parque Chapultepec · Cuernavaca, Morelos*
A 50 metros del Parque Chapultepec · 1.5h de CDMX · 330 días de sol al año.

⚠️ *Solo queda 1 unidad — última oportunidad:*

🌟 *PENTHOUSE · $4,500,000 MXN*
• 234 m² de residencia + 86 m² de Roof Garden privado
• Jacuzzi privado con vista a las montañas de Morelos
• Pérgola de parota, asador y sala al aire libre
• 3 recámaras + 3.5 baños tipo spa · travertino y latón cepillado
• Cocina abierta con isla de granito
• Vestidor de diseño · Domótica integrada
• 2 cajones techados + 2 bodegas
• Elevador exclusivo · Alberca · Seguridad 24/7
• Entrega inmediata

El departamento 4° piso ya fue vendido. Solo queda el PH.

¿Te agendo tu visita privada esta semana?`

const TEXTO_PH = `🌟 *Penthouse · Parque Chapultepec · Última unidad*

📐 *234 m²* de residencia + *86 m²* de Roof Garden privado

🏡 *Espacios:*
• Sala-comedor con ventanal y muro galería
• Cocina abierta con isla de granito · línea blanca oculta
• 3 recámaras · vestidor de diseño en recámara principal
• 3.5 baños tipo spa · travertino · grifería negra mate · regadera lluvia
• Área de lavado independiente

🌿 *Roof Garden 86 m²:*
• Deck de parota bajo pérgola
• Jacuzzi privado con vista panorámica a la sierra de Morelos
• Asador BBQ · sala exterior · jardín vivo
• Vista a las montañas · frente al Parque Chapultepec

✨ *Materiales nobles:*
Parota · Granito · Travertino · Latón cepillado · Blanco arquitectónico

🏗️ *Tecnología:*
Casa inteligente: luces, clima y persianas por teléfono o voz

📈 *Inversión inteligente:*
• ROI proyectado: 8-12% anual
• Zona de alta plusvalía · Cuernavaca crece
• Proyecto 100% terminado · Sin costo adicional

💰 *$4,500,000 MXN · Entrega inmediata*`

const TEXTO_CTA = `📍 *Agenda tu visita privada*

*Bajada de Chapultepec 18-A*
Col. Chapultepec, Cuernavaca, Morelos
A 50 metros del Parque Chapultepec · A 1.5h de CDMX

📱 WhatsApp: 777 175 84 12
📸 Instagram: @pchapultepec
🎵 TikTok: @parquechapultepec
🌐 parquechapultepecmorelos.com

_La ciudad de la eterna primavera te espera_
_Última unidad · Entrega inmediata_`

// Secuencia premium del Penthouse — fotos reales + renders
const SECUENCIAS = {
  ph: {
    pasos: [
      { tipo: 'texto', contenido: TEXTO_PH },
      // Exterior real
      { tipo: 'foto', archivo: 'ph/ph-rooftop-hero.jpg',   caption: '🌿 Roof Garden 86 m² · Pérgola de parota · Vista panorámica Cuernavaca · $4,500,000 MXN' },
      { tipo: 'foto', archivo: 'ph/ph-rooftop-asador.jpg', caption: '🔥 Asador BBQ · Sala exterior · Jardinería viva · Vista a la sierra de Morelos' },
      { tipo: 'foto', archivo: 'ph/ph-alberca-jardin.jpg', caption: '🏊 Alberca climatizada · Jardín tropical · Palmas y bugambilias · Seguridad 24/7' },
      { tipo: 'foto', archivo: 'ph/ph-fachada-real.jpg',   caption: '🏗️ Residencial Parque Chapultepec · Bajada de Chapultepec 18-A, Cuernavaca' },
      // Interiores renders
      { tipo: 'foto', archivo: 'ph/ph-sala-render.jpg',    caption: '🛋️ Sala-comedor · Ventanal de herrería negra · Muro galería · Madera de parota' },
      { tipo: 'foto', archivo: 'ph/ph-cocina-render.jpg',  caption: '🍳 Cocina abierta con isla de granito · Línea blanca oculta · Ventana panorámica' },
      { tipo: 'foto', archivo: 'ph/ph-master-render.png',  caption: '🛏️ Recámara principal · Cabecera de parota · Acceso a vestidor de diseño' },
      { tipo: 'foto', archivo: 'ph/ph-bano1-render.png',   caption: '🚿 Baños tipo spa · Travertino · Grifería negra mate · Regadera lluvia · Latón cepillado' },
      { tipo: 'texto', contenido: TEXTO_CTA },
    ]
  },
  ambas: { pasos: [] },
  depto: { pasos: [] }
}
SECUENCIAS.ambas = SECUENCIAS.ph
SECUENCIAS.depto = SECUENCIAS.ph

async function enviarSecuencia(sock, jid, tipo) {
  const secuencia = SECUENCIAS[tipo] || SECUENCIAS.ambas
  let enviado = false

  for (const paso of secuencia.pasos) {
    try {
      if (paso.tipo === 'texto') {
        await sock.sendMessage(jid, { text: paso.contenido })
        await new Promise(r => setTimeout(r, 1000))
        enviado = true
      } else if (paso.tipo === 'foto') {
        const ruta = join(FOTOS_DIR, paso.archivo)
        if (!existsSync(ruta)) {
          console.log(`⚠️  Foto no encontrada: ${paso.archivo}`)
          continue
        }
        const buffer = readFileSync(ruta)
        await sock.sendMessage(jid, { image: buffer, caption: paso.caption })
        await new Promise(r => setTimeout(r, 1200))
        enviado = true
        console.log(`📸 Enviada: ${paso.archivo}`)
      }
    } catch (e) {
      console.error(`Error enviando ${paso.archivo || 'texto'}: ${e.message}`)
    }
  }
  return enviado
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function upsertLead(telefono, extras = {}) {
  const { data, error } = await supabase
    .from('leads').upsert({ telefono, ...extras }, { onConflict: 'telefono' })
    .select('id, estado').single()
  if (error) console.error('upsert:', error.message)
  return data
}

async function log(leadId, tipo, contenido, metadata = {}) {
  await supabase.from('interacciones').insert({ lead_id: leadId, tipo, contenido, metadata })
}

// Verificar en interacciones si ya se enviaron fotos (persiste entre reinicios)
async function yaEnvioFotos(leadId) {
  const { data } = await supabase.from('interacciones')
    .select('id').eq('lead_id', leadId).eq('contenido', '[FOTOS PH]').limit(1)
  return (data?.length ?? 0) > 0
}

async function marcarFotosEnviadas(leadId) {
  // Se marca automáticamente en log() con '[FOTOS PH]'
}

function detectarInteres(t) {
  const txt = t.toLowerCase()
  if (txt.includes('penthouse') || txt.includes('jacuzzi') || txt.includes('suite')) return 'Penthouse'
  if (txt.includes('depa') || txt.includes('departamento')) return 'Departamento'
  return null
}

// ── WhatsApp ──────────────────────────────────────────────────────────────────

let intentosReconexion = 0
let sockActual = null  // referencia global para cerrar antes de reconectar

async function iniciar() {
  // Cerrar socket anterior antes de crear uno nuevo — evita el loop 440
  if (sockActual) {
    try { sockActual.end() } catch {}
    sockActual = null
    await new Promise(r => setTimeout(r, 1000))
  }

  const { state, saveCreds } = await useMultiFileAuthState('./auth_session')
  const { version }          = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger,
    auth: state,
    browser: ['Chapultepec', 'Chrome', '120'],
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: false,
    keepAliveIntervalMs: 25000,
    retryRequestDelayMs: 2000,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 30000,
    getMessage: async () => ({ conversation: '' })
  })
  sockActual = sock

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      QR_ACTUAL = qr
      WA_CONECTADO = false
      console.log('\n══════════════════════════════════════════')
      console.log('  Escanea QR en: /qr')
      console.log('══════════════════════════════════════════\n')
      qrcode.generate(qr, { small: true })
    }
    if (connection === 'open') {
      intentosReconexion = 0
      QR_ACTUAL = null
      WA_CONECTADO = true
      console.log('\n✅ Bot Ana ACTIVO — Parque Chapultepec')
      console.log(`   Modo: ${USA_IA ? 'Claude Haiku (IA)' : 'Reglas inteligentes'}`)
      console.log('   Interceptando llamadas y mensajes...\n')
    }
    if (connection === 'close') {
      const codigo = lastDisconnect?.error?.output?.statusCode
      intentosReconexion++

      // Sesión loggedOut → necesita nuevo QR (no se puede recuperar)
      if (codigo === DisconnectReason.loggedOut) {
        console.log('⚠️  Sesión cerrada por WhatsApp. Escanea QR: node setup-qr.js')
        process.exit(1)
      }

      // 440 = otro cliente tomó la sesión → salir limpio, LaunchAgent reinicia
      if (codigo === 440) {
        console.log('🔄 Sesión reemplazada (440) — reiniciando proceso...')
        process.exit(0)
      }

      // Errores temporales de red/servidor → reconexión progresiva
      const base = [428, 408, 503, 500, 502].includes(codigo) ? 15000 : 8000
      const espera = Math.min(base * Math.pow(1.5, intentosReconexion - 1), 60000)
      console.log(`🔄 Reconectando en ${Math.round(espera/1000)}s... (código ${codigo || 'sin código'})`)
      setTimeout(iniciar, espera)
    }
  })

  // IDs ya procesados (evita duplicados)
  const procesados    = new Set()
  const yaRecibioFotos = new Set()

  // ── LLAMADAS ───────────────────────────────────────────────────────────────
  // llamadas ya procesadas — evitar enviar doble mensaje
  const llamadasProcesadas = new Set()

  async function atenderLlamada(jidLlamada, tipo) {
    if (llamadasProcesadas.has(jidLlamada)) return
    llamadasProcesadas.add(jidLlamada)
    setTimeout(() => llamadasProcesadas.delete(jidLlamada), 60000)

    // Extraer número limpio para guardar en DB (sin @s.whatsapp.net ni @lid)
    const telefono = jidLlamada.replace(/@s\.whatsapp\.net$/, '').replace(/@lid$/, '')
    console.log(`📞 Llamada ${tipo} de ${telefono} → enviando info PH`)

    const leadData = await upsertLead(telefono, { canal_origen: 'Llamada', estado: 'Nuevo' })
    const leadId = leadData?.id
    if (!leadId) return

    await supabase.from('llamadas_rescatadas').insert({ telefono, lead_id: leadId }).catch(() => {})
    await log(leadId, 'Llamada Rescatada', `Llamada ${tipo}`)

    const jid = jidLlamada  // usar JID original para enviar

    // 1. Mensaje de texto con info completa
    const msg = `¡Hola! 👋 Vi que intentaste llamarme.

Atendemos por WhatsApp para darte mejor servicio 🙏

🌟 *Penthouse Parque Chapultepec — Última unidad*
$4,500,000 MXN · Roof Garden 86 m² con jacuzzi · 3 suites · Elevador directo · Vista panorámica · Cuernavaca

🏙 *Departamento 4° piso — $2,800,000 MXN*
Roofgarden privado · 2 recámaras · Bodega

Te mando las fotos ahora mismo 📸`

    await sock.sendMessage(jid, { text: msg })
    await log(leadId, 'Mensaje Saliente Bot', msg)

    // 2. Fotos del PH
    await new Promise(r => setTimeout(r, 1500))
    const enviadas = await enviarSecuencia(sock, jid, 'ph')
    if (enviadas) {
      await marcarFotosEnviadas(leadId)
      await log(leadId, 'Mensaje Saliente Bot', '[FOTOS PH]')
      console.log(`📸 Fotos enviadas post-llamada → ${telefono}`)
    }

    // 3. CTA visita
    await new Promise(r => setTimeout(r, 2500))
    const cta = `¿Cuándo te gustaría conocerlo? 📅 Atendemos lunes a sábado — Bajada de Chapultepec 18-A, Cuernavaca. A 1.5h de CDMX.`
    await sock.sendMessage(jid, { text: cta })
    await log(leadId, 'Mensaje Saliente Bot', cta)
  }

  sock.ev.on('call', async (eventos) => {
    for (const llamada of eventos) {
      const fromJid = llamada.from  // JID original completo (puede ser @lid)
      if (!fromJid) continue
      // Guardar el JID completo para poder responder correctamente
      const callJid = fromJid.endsWith('@s.whatsapp.net') || fromJid.endsWith('@lid')
        ? fromJid
        : `${fromJid.split('@')[0]}@s.whatsapp.net`

      // offer = entra la llamada → rechazar y mandar mensaje
      if (llamada.status === 'offer') {
        try { await sock.rejectCall(llamada.id, llamada.from) } catch {}
        await atenderLlamada(callJid, 'Rechazada')
      }

      // timeout = llamada perdida (no contestaron)
      if (llamada.status === 'timeout') {
        await atenderLlamada(callJid, 'Perdida')
      }
    }
  })

  // ── MENSAJES ───────────────────────────────────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) {
      if (msg.key.fromMe || !msg.message) continue
      const jid = msg.key.remoteJid
      if (!jid || jid.endsWith('@g.us')) continue

      // Ignorar si ya procesamos este mensaje
      const msgId = msg.key.id
      if (procesados.has(msgId)) continue
      procesados.add(msgId)
      if (procesados.size > 500) {
        const first = procesados.values().next().value
        procesados.delete(first)
      }

      // Limpiar @s.whatsapp.net y @lid — guardar solo el número
      const telefono = jid.replace(/@s\.whatsapp\.net$/, '').replace(/@lid$/, '')
      const texto    = msg.message.conversation
                    || msg.message.extendedTextMessage?.text || ''
      if (!texto.trim()) continue

      console.log(`💬 [${telefono}]: ${texto.substring(0, 60)}`)

      const txtLow = texto.toLowerCase().trim()
      const interes = detectarInteres(texto)

      // Obtener estado actual del lead desde Supabase (persiste entre reinicios)
      const leadData = await upsertLead(telefono, interes ? { interes } : {})
      const leadId = leadData?.id
      if (!leadId) continue

      const esPrimerMensaje = !leadData || leadData.estado === 'Nuevo'
      const fotosYaEnviadas = leadData?.fotos_enviadas === true || await yaEnvioFotos(leadId)
      const citaAgendada    = leadData?.estado === 'Cita Agendada'

      await supabase.from('leads').update({ estado: 'En Conversación' }).eq('id', leadId).eq('estado', 'Nuevo')
      await log(leadId, 'Mensaje Entrante', texto)

      // ── Helpers ────────────────────────────────────────────────────────
      async function enviarFotos() {
        if (fotosYaEnviadas) return  // nunca mandar fotos dos veces
        await supabase.from('leads').update({ interes: 'Penthouse' }).eq('id', leadId)
        const ok = await enviarSecuencia(sock, jid, 'ph')
        if (ok) {
          await marcarFotosEnviadas(leadId)
          await log(leadId, 'Mensaje Saliente Bot', '[FOTOS PH]')
          console.log(`📸 Fotos → ${telefono}`)
        }
      }

      async function send(msg) {
        await sock.sendMessage(jid, { text: msg })
        await log(leadId, 'Mensaje Saliente Bot', msg)
      }
      // ───────────────────────────────────────────────────────────────────

      // ══ ETAPA 1: Primer contacto ══════════════════════════════════════
      if (esPrimerMensaje) {
        await send(`¡Hola! 👋 Soy Ana de *Parque Chapultepec*, Cuernavaca.\n\nTenemos disponibles:\n🌟 *Penthouse — $4,500,000 MXN* · 3 suites · Roof Garden 86 m² + jacuzzi\n🏙️ *Depto 4° piso — $2,800,000 MXN* · 2 recámaras · Roofgarden privado\n\nTe mando las fotos ahora mismo 📸`)
        await new Promise(r => setTimeout(r, 1500))
        await enviarFotos()
        await new Promise(r => setTimeout(r, 2000))
        await send(`¿Cuándo te gustaría visitarlo? 📅 Atendemos lunes a sábado — mañana o tarde.`)
        continue
      }

      // ══ ETAPA 2: Ya recibió fotos → seguimiento a visita ═════════════
      if (fotosYaEnviadas) {
        if (citaAgendada) {
          // Ya tiene cita → respuesta IA contextual
          let resp
          try { resp = USA_IA ? await respuestaIA(leadId, texto) : '¿Tienes alguna pregunta sobre tu visita? 😊' }
          catch { resp = '¿Tienes alguna pregunta sobre tu visita? 😊' }
          await send(resp)
          continue
        }

        // Detectar confirmación de día/hora
        const confirmaDia = /lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|ma[ñn]ana|tarde|hoy|\b\d{1,2}(:\d{2})?\s*(am|pm|hrs?)/i.test(texto)
        if (confirmaDia) {
          await send(`Perfecto, anotado 📅\n\n*Visita confirmada al Penthouse Parque Chapultepec.*\nDirección: Bajada de Chapultepec 18-A, Cuernavaca.\n\nTe mandamos recordatorio antes de tu visita. ¿Alguna pregunta adicional?`)
          await supabase.from('leads').update({ estado: 'Cita Agendada' }).eq('id', leadId)
          continue
        }

        // Detectar rechazo
        const rechaza = /no (me )?interesa|ya tengo|no por ahora|no gracias/i.test(texto)
        if (rechaza) {
          await send(`Entendido, sin problema 🙏 Si en algún momento quieres saber más, aquí estaré. ¡Que tengas excelente día!`)
          await supabase.from('leads').update({ estado: 'No Interesado' }).eq('id', leadId)
          continue
        }

        // Cualquier otro mensaje post-fotos → IA contextual + empujar a visita
        let resp
        try { resp = USA_IA ? await respuestaIA(leadId, texto) : `¿Qué día te acomoda para la visita? 📅 Tenemos disponibilidad esta semana.` }
        catch { resp = `¿Qué día te acomoda para la visita? 📅 Tenemos disponibilidad esta semana.` }
        await send(resp)
        continue
      }

      // ══ ETAPA 3: Aún no tiene fotos ══════════════════════════════════

      const pideFotos = /foto|imagen|ver|manda|env[íi]a|s[íi]\b|dale|claro|info|cu[eé]ntame|muestrame|muéstrame/i.test(texto)

      if (pideFotos) {
        // Mandar fotos DE INMEDIATO sin pasar por IA
        await send(`¡Aquí van las fotos del Penthouse! 📸`)
        await new Promise(r => setTimeout(r, 800))
        await enviarFotos()
        await new Promise(r => setTimeout(r, 2500))
        await send(`¿Cuándo te gustaría visitarlo? 📅 Atendemos lunes a sábado — mañana o tarde.`)
        continue
      }

      // Si no pide fotos → IA responde y luego ofrece fotos si hay interés
      let respuesta
      try { respuesta = USA_IA ? await respuestaIA(leadId, texto) : respuestaReglas(texto) }
      catch { respuesta = respuestaReglas(texto) }

      await send(respuesta)
      console.log(`🤖 → ${respuesta.substring(0, 80)}`)

      const hayInteres = /precio|costo|cu[aá]nto|penthouse|roof|jacuzzi|terraza|disponible|depto|departamento/i.test(texto)
      if (hayInteres) {
        await new Promise(r => setTimeout(r, 1500))
        await send(`¿Te mando las fotografías del penthouse ahora? Responde "sí" 📸`)
      }
    }
  })
}

// ── Servidor CRM ─────────────────────────────────────────────────────────────
const JSON_H = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

async function apiRouter(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const path = url.pathname

  // Buffer: obtener posts programados de todos los perfiles
  if (path === '/api/buffer-posts' && req.method === 'GET') {
    try {
      const tok = process.env.BUFFER_API_KEY
      const ORG = '6a2001e51602e240eb702dc5'
      const query = `{
        posts(input:{organizationId:"${ORG}",filter:{channelIds:["6a200357c687a22dd456797f","6a20036fc687a22dd45679d0"]}}) {
          edges { node {
            id status channelService dueAt sentAt text
            tags { name color }
            assets { type source thumbnail }
          }}
        }
      }`
      const r = await fetch('https://api.buffer.com', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      const d = await r.json()
      const edges = d?.data?.posts?.edges || []
      const posts = edges.map(e => ({
        id:       e.node.id,
        estado:   e.node.status === 'sent' ? 'enviado' : 'pendiente',
        red:      e.node.channelService,
        cuenta:   e.node.channelService === 'instagram' ? 'pchapultepec' : 'carlosmoralevega',
        text:     e.node.text,
        dueAt:    e.node.dueAt,
        sentAt:   e.node.sentAt,
        tags:     (e.node.tags || []).map(t => t.name),
        thumbnail: e.node.assets?.[0]?.thumbnail || null,
        mediaType: e.node.assets?.[0]?.type || 'image',
        source:   e.node.assets?.[0]?.source || null,
      }))
      posts.sort((a, b) => new Date(b.dueAt) - new Date(a.dueAt))
      res.writeHead(200, JSON_H); res.end(JSON.stringify({ posts, error: d.errors?.[0]?.message || null }))
    } catch (e) {
      res.writeHead(500, JSON_H); res.end(JSON.stringify({ error: e.message, posts: [] }))
    }
    return true
  }

  // Webhook de voz entrante (Twilio / Vapi / Bland)
  if (path === '/api/llamada-entrante' && req.method === 'POST') {
    let body = ''
    req.on('data', d => body += d)
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}')
        const telefono = data.From || data.from || data.caller || data.telefono || 'desconocido'
        const transcripcion = data.transcription || data.transcript || null
        await supabase.from('llamadas_voz').insert({ telefono, transcripcion, raw: JSON.stringify(data) })
        res.writeHead(200, JSON_H); res.end(JSON.stringify({ ok: true }))
      } catch (e) {
        res.writeHead(500, JSON_H); res.end(JSON.stringify({ error: e.message }))
      }
    })
    return true
  }

  // Log de eventos CRM
  if (path === '/api/log' && req.method === 'POST') {
    let body = ''
    req.on('data', d => body += d)
    req.on('end', async () => {
      try {
        const { tipo, contenido, lead_id } = JSON.parse(body || '{}')
        await supabase.from('crm_log').insert({ tipo, contenido, lead_id })
        res.writeHead(200, JSON_H); res.end(JSON.stringify({ ok: true }))
      } catch (e) {
        res.writeHead(500, JSON_H); res.end(JSON.stringify({ error: e.message }))
      }
    })
    return true
  }

  // ── DEALS API ─────────────────────────────────────────────────────────────

  // GET /api/deals — todos los deals con alerta_inactividad calculada
  if (path === '/api/deals' && req.method === 'GET') {
    try {
      const { data: leads } = await supabase
        .from('leads')
        .select('id, nombre, telefono, interes, estado, canal_origen, notas, fecha_cita, creado_en, actualizado_en')
        .order('actualizado_en', { ascending: false })

      const ETAPAS = ['Contacto', 'Propuesta', 'Negociación', 'Cerrado', 'No Interesado']
      const VALOR_POR_UNIDAD = { 'Penthouse': 4500000, 'Departamento': 2800000, 'Ambos': 7300000 }

      const ahora = Date.now()
      const deals = (leads || []).map(l => {
        const ultimaActividad = new Date(l.actualizado_en || l.creado_en).getTime()
        const diasInactivo = Math.floor((ahora - ultimaActividad) / 86400000)
        // Leer etapa Kanban guardada en notas, si no existe usar estado como fallback
        const etapaEnNotas = (l.notas || '').match(/\[etapa:([^\]]+)\]/)?.[1]
        const etapa = etapaEnNotas && ETAPAS.includes(etapaEnNotas) ? etapaEnNotas : 'Contacto'
        const valor = parseFloat((VALOR_POR_UNIDAD[l.interes] || 2800000).toFixed(2))
        return {
          ...l,
          etapa,
          valor,
          moneda: 'MXN',
          dias_inactivo: diasInactivo,
          alerta_inactividad: diasInactivo > 3,
        }
      })
      res.writeHead(200, JSON_H); res.end(JSON.stringify(deals))
    } catch (e) {
      console.error('[DEALS]', e.message)
      res.writeHead(500, JSON_H); res.end(JSON.stringify({ error: e.message }))
    }
    return true
  }

  // PUT /api/deals/:id/stage — mover etapa + actualizar timestamp
  // Mapea etapas Kanban → estados permitidos en DB
  const stageMatch = path.match(/^\/api\/deals\/([^/]+)\/stage$/)
  if (stageMatch && req.method === 'PUT') {
    let body = ''
    req.on('data', d => body += d)
    req.on('end', async () => {
      try {
        const { etapa } = JSON.parse(body || '{}')
        const id = stageMatch[1]
        const ETAPAS_VALIDAS = ['Contacto', 'Propuesta', 'Negociación', 'Cerrado', 'No Interesado']
        if (!ETAPAS_VALIDAS.includes(etapa)) {
          res.writeHead(400, JSON_H); res.end(JSON.stringify({ error: `Etapa inválida: ${ETAPAS_VALIDAS.join(', ')}` }))
          return
        }
        // Mapear etapa Kanban a estado válido en DB
        const ESTADO_MAP = {
          'Contacto':    'En Conversación',
          'Propuesta':   'En Conversación',
          'Negociación': 'En Conversación',
          'Cerrado':     'Cita Agendada',
          'No Interesado': 'No Interesado',
        }
        const estadoDB = ESTADO_MAP[etapa] || 'En Conversación'
        const ts = new Date().toISOString()

        // Guardar etapa kanban en notas para no perderla (sin romper constraints)
        const { data: current } = await supabase.from('leads').select('nombre, notas').eq('id', id).single()
        const notasBase = (current?.notas || '').replace(/\[etapa:[^\]]+\]/, '').trim()
        const nuevasNotas = `[etapa:${etapa}] ${notasBase}`.trim()

        const { data, error } = await supabase
          .from('leads')
          .update({ estado: estadoDB, notas: nuevasNotas, actualizado_en: ts })
          .eq('id', id)
          .select('id, nombre, estado, actualizado_en')
          .single()
        if (error) throw error
        console.log(`[STAGE] ${data.nombre} → ${etapa} (${estadoDB}) @ ${ts}`)
        res.writeHead(200, JSON_H); res.end(JSON.stringify({ ...data, etapa }))
      } catch (e) {
        console.error('[STAGE]', e.message)
        res.writeHead(500, JSON_H); res.end(JSON.stringify({ error: e.message }))
      }
    })
    return true
  }

  // GET /api/activities/:leadId — actividades de un lead
  const actGetMatch = path.match(/^\/api\/activities\/([^/]+)$/)
  if (actGetMatch && req.method === 'GET') {
    try {
      const { data } = await supabase
        .from('interacciones')
        .select('*')
        .eq('lead_id', actGetMatch[1])
        .order('creado_en', { ascending: false })
        .limit(50)
      res.writeHead(200, JSON_H); res.end(JSON.stringify(data || []))
    } catch (e) {
      res.writeHead(500, JSON_H); res.end(JSON.stringify({ error: e.message }))
    }
    return true
  }

  // POST /api/activities — registrar actividad
  // Si completa=true, requiere siguiente_actividad en el payload
  if (path === '/api/activities' && req.method === 'POST') {
    let body = ''
    req.on('data', d => body += d)
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}')
        const { lead_id, tipo, descripcion, completa, siguiente_actividad } = payload

        if (!lead_id || !tipo || !descripcion) {
          res.writeHead(400, JSON_H)
          res.end(JSON.stringify({ error: 'Faltan campos: lead_id, tipo, descripcion' }))
          return
        }

        // Validación: si completa=true, debe incluir siguiente_actividad
        if (completa === true && !siguiente_actividad) {
          res.writeHead(400, JSON_H)
          res.end(JSON.stringify({
            error: 'Al completar una actividad debes programar la siguiente. Incluye "siguiente_actividad": { tipo, fecha }',
            code: 'NEXT_ACTIVITY_REQUIRED'
          }))
          return
        }

        const ts = new Date().toISOString()
        const metadata = { tipo_actividad: tipo, completa: !!completa, siguiente_actividad: siguiente_actividad || null }
        // Mapear tipos de actividad a los aceptados por la DB
        const tipoMap = {
          'llamada': 'Llamada Rescatada', 'correo': 'Mensaje Saliente Bot',
          'reunión': 'Mensaje Saliente Bot', 'visita': 'Mensaje Saliente Bot',
          'whatsapp': 'Mensaje Saliente Bot', 'nota': 'Mensaje Saliente Bot',
        }
        const tipoDB = tipoMap[tipo] || 'Mensaje Saliente Bot'

        const { error } = await supabase.from('interacciones').insert({
          lead_id, tipo: tipoDB, contenido: `[${tipo.toUpperCase()}] ${descripcion}`, metadata, creado_en: ts
        })
        if (error) throw error

        // Actualizar timestamp del lead
        await supabase.from('leads').update({ actualizado_en: ts }).eq('id', lead_id)

        console.log(`[ACT] ${tipo} → lead ${lead_id} | completa=${completa}`)
        res.writeHead(201, JSON_H); res.end(JSON.stringify({ ok: true, timestamp: ts }))
      } catch (e) {
        console.error('[ACT]', e.message)
        res.writeHead(500, JSON_H); res.end(JSON.stringify({ error: e.message }))
      }
    })
    return true
  }

  // GET /api/stats — métricas rápidas para el dashboard
  if (path === '/api/stats' && req.method === 'GET') {
    try {
      const { data: leads } = await supabase.from('leads').select('estado, interes, actualizado_en, creado_en')
      const ahora = Date.now()
      const VALOR = { 'Penthouse': 4500000, 'Departamento': 2800000, 'Ambos': 7300000 }

      const stats = {
        total: leads?.length || 0,
        por_etapa: {},
        valor_total: 0,
        alertas: 0,
        hoy: 0,
      }

      for (const l of (leads || [])) {
        const etapa = l.estado || 'Contacto'
        stats.por_etapa[etapa] = (stats.por_etapa[etapa] || 0) + 1
        stats.valor_total += parseFloat((VALOR[l.interes] || 2800000).toFixed(2))
        const dias = Math.floor((ahora - new Date(l.actualizado_en || l.creado_en).getTime()) / 86400000)
        if (dias > 3) stats.alertas++
        if (new Date(l.creado_en).toDateString() === new Date().toDateString()) stats.hoy++
      }
      stats.valor_total = parseFloat(stats.valor_total.toFixed(2))
      res.writeHead(200, JSON_H); res.end(JSON.stringify(stats))
    } catch (e) {
      res.writeHead(500, JSON_H); res.end(JSON.stringify({ error: e.message }))
    }
    return true
  }

  // GET /oauth/callback — captura el código de autorización de Buffer
  if (path === '/oauth/callback' && req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost')
    const code = url.searchParams.get('code')
    if (code) {
      // Intercambiar código por access token
      try {
        const tokenRes = await fetch('https://api.bufferapp.com/1/oauth2/token.json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id:     'HukPuN1xSMpeRuaQzbEhK2UID8rD5LMe4HlHEgRHOLB',
            client_secret: 'L-hgS4_Xe4_kx9duFXGUzQv43JAsYPvdNfIcyRamlvrG_Jm6rgl1oX9-p1UtasOYx_pw3RDklI73jWLOfz2LPg',
            redirect_uri:  'https://parque-chapultepec.vercel.app/callback',
            code,
            grant_type: 'authorization_code',
          })
        })
        const tokenData = await tokenRes.json()
        const token = tokenData.access_token
        console.log('\n🔑 BUFFER TOKEN:', token)
        // Guardar token en .env
        const { readFileSync, writeFileSync } = await import('fs')
        const envPath = join(__dir, '.env')
        const envContent = readFileSync(envPath, 'utf-8')
        const updated = envContent.includes('BUFFER_WRITE_TOKEN=')
          ? envContent.replace(/BUFFER_WRITE_TOKEN=.*/, `BUFFER_WRITE_TOKEN=${token}`)
          : envContent + `\nBUFFER_WRITE_TOKEN=${token}\n`
        writeFileSync(envPath, updated)
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(`<html><body style="font-family:sans-serif;padding:40px;text-align:center">
          <h2>✅ Buffer conectado exitosamente</h2>
          <p>El token ha sido guardado. Ya puedes cerrar esta ventana.</p>
          <p><strong>Token:</strong> ${token?.substring(0,20)}...</p>
        </body></html>`)
      } catch(e) {
        res.writeHead(500, { 'Content-Type': 'text/html' })
        res.end(`<h2>Error: ${e.message}</h2>`)
      }
    } else {
      res.writeHead(400, { 'Content-Type': 'text/html' })
      res.end('<h2>Sin código de autorización</h2>')
    }
    return true
  }

  // GET /api/posts-hoy — posts generados hoy por IA
  if (path === '/api/posts-hoy' && req.method === 'GET') {
    try {
      const { readFileSync, existsSync } = await import('fs')
      const archivo = '/tmp/chapultepec-posts-hoy.json'
      if (!existsSync(archivo)) {
        res.writeHead(200, JSON_H)
        res.end(JSON.stringify({ fecha: null, posts: [], mensaje: 'Ejecuta: node publicar-diario.mjs' }))
        return true
      }
      const data = JSON.parse(readFileSync(archivo, 'utf-8'))
      res.writeHead(200, JSON_H)
      res.end(JSON.stringify(data))
    } catch (e) {
      res.writeHead(500, JSON_H)
      res.end(JSON.stringify({ error: e.message }))
    }
    return true
  }

  return false
}

const crmServer = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type' })
    res.end(); return
  }
  // GET /qr — página HTML con el QR de WhatsApp para escanear
  if (req.url === '/qr') {
    if (WA_CONECTADO) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(`<html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#f0fdf4">
        <h2 style="color:#166534">✅ WhatsApp ya está conectado</h2>
        <p>El bot está activo y respondiendo mensajes.</p>
      </body></html>`)
      return
    }
    if (!QR_ACTUAL) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(`<html><head><meta http-equiv="refresh" content="5"></head>
        <body style="font-family:sans-serif;text-align:center;padding:60px">
        <h2>⏳ Generando QR...</h2>
        <p>Esta página se recarga automáticamente cada 5 segundos.</p>
      </body></html>`)
      return
    }
    try {
      const qrDataUrl = await QRCode.toDataURL(QR_ACTUAL, { width: 400, margin: 2 })
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(`<html><head><meta http-equiv="refresh" content="30"></head>
        <body style="font-family:sans-serif;text-align:center;padding:40px;background:#fafafa">
        <h2>📱 Escanea con WhatsApp</h2>
        <p style="color:#666">Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
        <img src="${qrDataUrl}" style="border:4px solid #e5e7eb;border-radius:12px;margin:20px 0"/>
        <p style="color:#999;font-size:13px">El QR expira en ~60s. La página se recarga automáticamente.</p>
      </body></html>`)
    } catch(e) {
      res.writeHead(500); res.end('Error generando QR: ' + e.message)
    }
    return
  }

  if (req.url.startsWith('/api/') || req.url.startsWith('/oauth/')) {
    const handled = await apiRouter(req, res)
    if (handled) return
  }
  const file = join(__dir, req.url === '/' || req.url === '/crm' ? 'crm.html' : req.url.replace(/^\//, ''))
  try {
    const data = readFileSync(file)
    const ct = file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8'
    res.writeHead(200, { 'Content-Type': ct, 'Access-Control-Allow-Origin': '*' })
    res.end(data)
  } catch {
    res.writeHead(404); res.end('Not found')
  }
})
const PORT = parseInt(process.env.PORT || '3001', 10)
crmServer.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    crmServer.listen(PORT + 1, () => console.log(`📊 CRM en http://localhost:${PORT + 1}`))
  } else {
    console.error('CRM server error:', e.message)
  }
})
crmServer.listen(PORT, () => console.log(`📊 CRM en http://localhost:${PORT}`))

// Atrapar errores no manejados para que el proceso no muera
process.on('unhandledRejection', (err) => {
  const codigo = err?.output?.statusCode
  if ([428, 408, 503].includes(codigo)) {
    console.log(`⚠️  Error WhatsApp ${codigo} — esperando reconexión automática...`)
  } else {
    console.error('Error no manejado:', err?.message || err)
  }
})

process.on('uncaughtException', (err) => {
  console.error('Excepción:', err?.message || err)
})

console.log('\n🏠 Parque Chapultepec — Bot iniciando...')
iniciar().catch(console.error)
