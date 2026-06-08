// bot.js — Parque Chapultepec WhatsApp Bot
// Usa whatsapp-web.js (Chrome real) — más estable que Baileys

import pkg from 'whatsapp-web.js'
const { Client, LocalAuth, MessageMedia } = pkg
import qrcode from 'qrcode-terminal'
import QRCode from 'qrcode'
import { createServer } from 'http'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

const __dir  = dirname(fileURLToPath(import.meta.url))
const FOTOS  = join(__dir, 'fotos')
const sb     = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// ── Textos exactos del PDF ────────────────────────────────────────────────────

const MSG_GENERAL = `Hola, gracias por tu interés en *Parque Chapultepec* 🌳

Es un residencial exclusivo de solo 13 unidades, a 50 m del Parque Chapultepec, Cuernavaca. Tenemos dos opciones disponibles:

*PENTHOUSE* — $4,500,000
3 recámaras · 3.5 baños · 234 m² con roof garden · jacuzzi privado · elevador directo · 2 estacionamientos.

*DEPARTAMENTO (4° piso)* — $2,800,000
2 recámaras · 2 baños · 112 m² con roof garden · estacionamiento + bodega.

Ambas con acabados de lujo y entrega inmediata. Con gusto te comparto fotos y agendamos una visita.

¿Cuál te interesa conocer?`

const MSG_CTA = `📍 *Agenda tu visita hoy mismo*

WhatsApp: 777 175 84 12
Instagram: @pchapultepec
Ubicación: Cuernavaca, Morelos

_Solo 13 unidades · Disponibilidad muy limitada_`

// ── Secuencias de fotos ───────────────────────────────────────────────────────

const SECUENCIAS = {
  ambas: [
    { tipo: 'texto', txt: MSG_GENERAL },
    { tipo: 'foto',  archivo: 'ph-hero.jpg',       caption: 'Penthouse Exclusivo · Última oportunidad · $4,500,000' },
    { tipo: 'foto',  archivo: 'render-rooftop.jpg', caption: 'Roofgarden con jacuzzi · 85 m²' },
    { tipo: 'foto',  archivo: 'render-master.jpg',  caption: 'Recámara principal' },
    { tipo: 'foto',  archivo: 'render-bano-1.jpg',  caption: 'Baño de lujo' },
    { tipo: 'foto',  archivo: 'depto-hero.jpg',     caption: 'Departamento 4° piso · Disponible · $2,800,000' },
    { tipo: 'foto',  archivo: 'depto-terraza.jpg',  caption: 'Terraza · Acceso a interior' },
    { tipo: 'foto',  archivo: 'depto-cocina.jpg',   caption: 'Cocina' },
    { tipo: 'foto',  archivo: 'depto-alberca.jpg',  caption: 'Alberca común' },
    { tipo: 'foto',  archivo: 'depto-fachada.jpg',  caption: 'Fachada · Entorno' },
    { tipo: 'foto',  archivo: 'depto-lavado.jpg',   caption: 'Área de lavado' },
    { tipo: 'texto', txt: MSG_CTA },
  ],
  ph: [
    { tipo: 'texto', txt: `*Penthouse Exclusivo — Última unidad* 🌟\n\n• 336.83 m² construcción\n• Roofgarden 85 m² + jacuzzi + asador + pérgola\n• 3 suites con baño completo · 3.5 baños\n• Elevador directo · 2 cajones techados\n💰 *$4,500,000 MXN*` },
    { tipo: 'foto',  archivo: 'ph-hero.jpg',          caption: 'Penthouse · $4,500,000 · Última unidad' },
    { tipo: 'foto',  archivo: 'ph-ficha.jpg',          caption: 'Especificaciones completas' },
    { tipo: 'foto',  archivo: 'render-rooftop.jpg',    caption: 'Roofgarden con jacuzzi · 85.74 m²' },
    { tipo: 'foto',  archivo: 'render-master.jpg',     caption: 'Recámara principal' },
    { tipo: 'foto',  archivo: 'render-bano-1.jpg',     caption: 'Baño de lujo' },
    { tipo: 'texto', txt: MSG_CTA },
  ],
  depto: [
    { tipo: 'texto', txt: `*Departamento 4° piso — Disponible* 🏠\n\n• 112 m² · Rooftop privado 30 m²\n• 2 recámaras · 2 baños completos\n• Cocina integral · Área de lavado\n• Elevador · 1 cajón + bodega\n💰 *$2,800,000 MXN*` },
    { tipo: 'foto',  archivo: 'depto-hero.jpg',     caption: 'Departamento 4° piso · $2,800,000' },
    { tipo: 'foto',  archivo: 'depto-terraza.jpg',  caption: 'Terraza · Acceso a interior' },
    { tipo: 'foto',  archivo: 'depto-cocina.jpg',   caption: 'Cocina' },
    { tipo: 'foto',  archivo: 'depto-alberca.jpg',  caption: 'Alberca común' },
    { tipo: 'foto',  archivo: 'depto-fachada.jpg',  caption: 'Fachada · Entorno' },
    { tipo: 'foto',  archivo: 'depto-lavado.jpg',   caption: 'Área de lavado' },
    { tipo: 'texto', txt: MSG_CTA },
  ]
}

// ── Reglas de respuesta ───────────────────────────────────────────────────────

const REGLAS = [
  { p: ['precio','costo','cuanto','vale','cuánto','cuesta'],
    r: 'Tenemos dos opciones:\n\n🏠 *Departamento* · $2,800,000 MXN · 112 m² + rooftop 30 m²\n🌟 *Penthouse* · $4,500,000 MXN · 336 m² + rooftop 85 m² con jacuzzi\n\n¿Cuál te interesa más?' },
  { p: ['penthouse','ph ','suite','4.5','ultima unidad','última unidad'],
    r: 'El Penthouse es nuestra joya exclusiva — última unidad 🌟\n\n• 336.83 m² · Rooftop 85 m² con jacuzzi + asador\n• 3 suites · Elevador directo · $4,500,000 MXN\n\n¿Quieres que te mande las fotos?' },
  { p: ['departamento','depa','2.8','4to piso','4° piso'],
    r: 'El departamento es perfecto para vivir o invertir 🏠\n\n• 112 m² · Rooftop 30 m² con deck\n• 2 recámaras · Elevador · $2,800,000 MXN\n\n¿Te mando las fotos?' },
  { p: ['rooftop','jacuzzi','terraza','asador'],
    r: 'Ambas unidades tienen rooftop privado exclusivo 🌿\n\nDepartamento: 30 m² con deck de madera\nPenthouse: 85 m² con jacuzzi, asador y pérgola\n\n¿Cuál te interesa conocer?' },
  { p: ['alberca','piscina','amenidades'],
    r: 'Amenidades del residencial:\n\n🏊 Alberca climatizada · jardín tropical\n🔒 Caseta de seguridad + cámaras 24/7\n🛗 Elevador\n📍 A 50m del Parque Chapultepec\n\n¿Te agendo una visita?' },
  { p: ['donde','ubicacion','ubicación','cuernavaca'],
    r: 'Estamos en Cuernavaca, Morelos 📍\n\nA 50 metros del Parque Chapultepec — zona más cotizada de la ciudad.\n\nparquechapultepecmorelos.com' },
  { p: ['visita','cita','agendar','conocer','cuando','cuándo'],
    r: 'Con gusto te agendo tu visita 📅\n\nAtendemos cualquier día de la semana.\n\n¿Qué día te viene mejor?' },
  { p: ['infonavit','credito','crédito','hipoteca','financiamiento'],
    r: 'Trabajamos con diferentes esquemas de pago 🏦\n\n¿Te agendo una llamada con el asesor para darte todos los detalles?' },
  { p: ['inversion','inversión','renta','plusvalía'],
    r: 'Cuernavaca tiene una de las plusvalías más altas del país 📈\n\nIdeal para vivir o rentar. ¿Te gustaría conocer los números?' },
  { p: ['gracias','ok','okey','perfecto','excelente'],
    r: 'Con gusto 😊 Cualquier duda, aquí estamos.\n\nInstagram: @pchapultepec · parquechapultepecmorelos.com' },
  { p: ['hola','buenas','buenos','hi','hey','buen día','saludos'],
    r: MSG_GENERAL },
]

function respuestaReglas(texto) {
  const t = texto.toLowerCase()
  for (const { p, r } of REGLAS) {
    if (p.some(k => t.includes(k))) return r
  }
  return MSG_GENERAL
}

function tipoDeFoto(texto) {
  const t = texto.toLowerCase()
  if (/penthouse|ph\b|4\.5/.test(t)) return 'ph'
  if (/depto|departamento|2\.8/.test(t)) return 'depto'
  return 'ambas'
}

// ── Supabase ──────────────────────────────────────────────────────────────────

async function upsertLead(tel, extras = {}) {
  const { data } = await sb.from('leads')
    .upsert({ telefono: tel, ...extras }, { onConflict: 'telefono' })
    .select('id').single()
  return data?.id
}

async function logMsg(leadId, tipo, contenido) {
  await sb.from('interacciones').insert({ lead_id: leadId, tipo, contenido }).catch(() => {})
}

// ── Cliente WhatsApp ──────────────────────────────────────────────────────────

const procesados = new Set()

// Servidor QR en browser
let qrHtml = '<p style="font:16px sans-serif">Generando QR...</p>'
let conectado = false
const server = createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' })
  res.end(`<!DOCTYPE html><html><head><meta charset=utf-8><meta http-equiv=refresh content=4>
  <style>body{font-family:sans-serif;text-align:center;padding:40px;background:#f5f5f0}
  h1{color:#1B4332}img{max-width:280px;border:3px solid #1B4332;padding:12px;background:#fff;border-radius:8px}
  .ok{color:#2D6A4F;font-size:1.3em;font-weight:700}</style></head>
  <body><h1>🏠 Bot Ana — Parque Chapultepec</h1>
  ${conectado
    ? '<p class=ok>✅ WhatsApp conectado exitosamente.</p>'
    : `<p>Escanea con WhatsApp del número <b>777 175 8412</b></p>
       <p style="color:#888;font-size:.85em">Ajustes → Dispositivos vinculados → Vincular dispositivo</p>
       ${qrHtml}<p style="color:#bbb;font-size:.8em">Se actualiza cada 4 segundos</p>`
  }</body></html>`)
}).listen(3001)

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './wa-session' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']
  }
})

client.on('qr', async (qr) => {
  qrHtml = `<img src="${await QRCode.toDataURL(qr)}" alt="QR">`
  qrcode.generate(qr, { small: true })
  console.log('\n👆 Abre http://localhost:3001 para escanear el QR\n')
})

client.on('ready', () => {
  conectado = true
  setTimeout(() => server.close(), 8000)
  console.log('\n✅ Bot Ana ACTIVO — Parque Chapultepec')
  console.log('   Interceptando mensajes y llamadas...\n')
})

client.on('disconnected', (reason) => {
  console.log('Desconectado:', reason)
  process.exit(1)
})

// ── Mensajes entrantes ────────────────────────────────────────────────────────

client.on('message', async (msg) => {
  if (msg.fromMe || msg.isGroupMsg) return
  if (procesados.has(msg.id.id)) return
  procesados.add(msg.id.id)
  if (procesados.size > 500) procesados.delete(procesados.values().next().value)

  const telefono = msg.from.replace('@c.us', '')
  const texto    = msg.body?.trim()
  if (!texto) return

  console.log(`💬 [${telefono}]: ${texto.substring(0, 60)}`)

  const leadId = await upsertLead(telefono, { canal_origen: 'WhatsApp', estado: 'Nuevo' })
  await sb.from('leads').update({ estado: 'En Conversación' }).eq('id', leadId).eq('estado', 'Nuevo')
  await logMsg(leadId, 'Mensaje Entrante', texto)

  const pideFotos = /foto|imagen|manda|muestra|ver|quiero ver/i.test(texto)

  if (pideFotos) {
    const tipo = tipoDeFoto(texto)
    const pasos = SECUENCIAS[tipo]
    for (const paso of pasos) {
      if (paso.tipo === 'texto') {
        await msg.reply(paso.txt)
      } else {
        const ruta = join(FOTOS, paso.archivo)
        if (!existsSync(ruta)) continue
        const media = MessageMedia.fromFilePath(ruta)
        await client.sendMessage(msg.from, media, { caption: paso.caption })
      }
      await new Promise(r => setTimeout(r, 700))
    }
    await logMsg(leadId, 'Mensaje Saliente Bot', `[FOTOS ${tipo}]`)
    console.log(`📸 Secuencia ${tipo} → ${telefono}`)
    return
  }

  const respuesta = respuestaReglas(texto)
  await msg.reply(respuesta)
  await logMsg(leadId, 'Mensaje Saliente Bot', respuesta)
  console.log(`🤖 → ${respuesta.substring(0, 60)}`)
})

// ── Iniciar ───────────────────────────────────────────────────────────────────

process.on('unhandledRejection', err => console.error('Error:', err?.message))
process.on('uncaughtException',  err => console.error('Excepción:', err?.message))

console.log('\n🏠 Parque Chapultepec Bot iniciando (Chrome)...')
console.log('   Abre http://localhost:3001 en el navegador\n')
client.initialize()
