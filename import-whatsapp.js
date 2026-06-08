// import-whatsapp.js
// Lee todos los .txt exportados de WhatsApp y los sube al CRM en Supabase
//
// USO:
//   1. Pon tus archivos .txt exportados en ./chats/
//   2. npm install @supabase/supabase-js dotenv
//   3. Crea .env con SUPABASE_URL y SUPABASE_KEY (service_role)
//   4. node import-whatsapp.js

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

const __dir = dirname(fileURLToPath(import.meta.url))
const CARPETA_CHATS = join(__dir, 'chats')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

// ── Parser de formato WhatsApp iOS ─────────────────────────────────────────
// Formato: [DD/MM/YY, HH:MM:SS] Nombre: texto
// o:       [DD/MM/YY HH:MM:SS] Nombre: texto  (variación Android)
const REGEX_MENSAJE = /^\[?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})[,\s]+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[ap]\.?m\.?)?)\]?\s[-–]\s(.+?):\s(.+)/i

function parsearChat(contenido, nombreArchivo) {
  const lineas = contenido.split('\n')
  const mensajes = []
  let contacto = null
  let buffer = null

  for (const linea of lineas) {
    const match = linea.match(REGEX_MENSAJE)
    if (match) {
      if (buffer) mensajes.push(buffer)

      const [, fecha, hora, remitente, texto] = match

      // Inferir quién es el prospecto (no es "yo" ni el número del negocio)
      if (!contacto && !esPropietario(remitente)) {
        contacto = remitente.trim()
      }

      buffer = {
        fecha: parsearFecha(fecha, hora),
        remitente: remitente.trim(),
        texto: texto.trim(),
        esMio: esPropietario(remitente)
      }
    } else if (buffer && linea.trim()) {
      // Continuación de mensaje multilínea
      buffer.texto += '\n' + linea.trim()
    }
  }
  if (buffer) mensajes.push(buffer)

  return { contacto, mensajes, nombreArchivo }
}

// Detecta si el mensaje es tuyo (ajusta con tu nombre o número)
function esPropietario(remitente) {
  const propios = ['yo', 'carlos', 'parque chapultepec', '7771758412', '777 175 8412']
  return propios.some(p => remitente.toLowerCase().includes(p))
}

function parsearFecha(fecha, hora) {
  try {
    const partes = fecha.split(/[\/\-]/)
    const [d, m, a] = partes.length === 3 ? partes : [partes[1], partes[0], partes[2]]
    const anio = a.length === 2 ? '20' + a : a
    return new Date(`${anio}-${m.padStart(2,'0')}-${d.padStart(2,'0')}T${hora.replace(/[ap]\.?m\.?/i,'').trim()}`)
  } catch {
    return new Date()
  }
}

// Detectar interés en Penthouse o Departamento
function detectarInteres(mensajes) {
  const texto = mensajes.map(m => m.texto).join(' ').toLowerCase()
  if (texto.includes('penthouse') || texto.includes('suite') || texto.includes('rooftop') && texto.includes('jacuzzi')) return 'Penthouse'
  if (texto.includes('depa') || texto.includes('departamento') || texto.includes('4to') || texto.includes('cuarto piso')) return 'Departamento'
  return 'Sin definir'
}

// ── Importar un chat a Supabase ─────────────────────────────────────────────
async function importarChat({ contacto, mensajes, nombreArchivo }) {
  if (!contacto || mensajes.length === 0) {
    console.log(`  ⚠️  ${nombreArchivo}: sin mensajes parseables, saltando`)
    return
  }

  const interes = detectarInteres(mensajes)
  const tieneCita = mensajes.some(m =>
    /cita|visita|sábado|jueves|agendar|reservar/i.test(m.texto)
  )

  // Usar el nombre del archivo como teléfono si no hay número real
  const telefonoRaw = nombreArchivo.replace(/[^0-9]/g, '')
  const telefono = telefonoRaw.length >= 7
    ? telefonoRaw
    : `WA-${contacto.replace(/\s+/g,'').substring(0,15)}`

  console.log(`  → ${contacto} | ${interes} | ${mensajes.length} mensajes`)

  // Upsert del lead
  const { data: lead, error } = await supabase
    .from('leads')
    .upsert({
      nombre:       contacto,
      telefono:     telefono,
      interes:      interes,
      estado:       tieneCita ? 'Cita Agendada' : 'En Conversación',
      canal_origen: 'WhatsApp',
      notas:        `Importado de export WhatsApp · ${mensajes.length} mensajes`
    }, { onConflict: 'telefono' })
    .select('id')
    .single()

  if (error) {
    console.log(`  ❌ Error upsert: ${error.message}`)
    return
  }

  // Insertar interacciones (en lotes de 50)
  const interacciones = mensajes.map(m => ({
    lead_id:   lead.id,
    tipo:      m.esMio ? 'Mensaje Saliente Bot' : 'Mensaje Entrante',
    contenido: m.texto.substring(0, 2000),
    metadata: {
      remitente:  m.remitente,
      fecha_orig: m.fecha?.toISOString() ?? null,
      fuente:     'whatsapp_export'
    }
  }))

  // Lotes de 50 para no saturar
  for (let i = 0; i < interacciones.length; i += 50) {
    const lote = interacciones.slice(i, i + 50)
    const { error: errInt } = await supabase.from('interacciones').insert(lote)
    if (errInt) console.log(`  ⚠️  Lote ${i}-${i+50}: ${errInt.message}`)
  }

  console.log(`  ✅ ${contacto} → ${interacciones.length} interacciones guardadas`)
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  let archivos
  try {
    archivos = readdirSync(CARPETA_CHATS).filter(f => f.endsWith('.txt'))
  } catch {
    console.error('❌ Carpeta ./chats/ no encontrada. Crea la carpeta y pon los .txt ahí.')
    process.exit(1)
  }

  if (archivos.length === 0) {
    console.log('⚠️  Sin archivos .txt en ./chats/ — exporta los chats de WhatsApp primero.')
    process.exit(0)
  }

  console.log(`\n🏠 Chapultepec CRM — Importando ${archivos.length} chats de WhatsApp\n`)

  let ok = 0, fail = 0
  for (const archivo of archivos) {
    console.log(`📄 ${archivo}`)
    try {
      const contenido = readFileSync(join(CARPETA_CHATS, archivo), 'utf8')
      const chat = parsearChat(contenido, archivo)
      await importarChat(chat)
      ok++
    } catch (e) {
      console.log(`  ❌ Error: ${e.message}`)
      fail++
    }
    console.log('')
  }

  console.log(`\n✅ Importación completa: ${ok} chats subidos, ${fail} con error`)
  console.log('👉 Abre el CRM en el navegador para ver los leads\n')
}

main()
