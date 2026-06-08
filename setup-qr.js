// Muestra el QR en el navegador para vincular WhatsApp
import pkg from '@whiskeysockets/baileys'
const makeWASocket = pkg.default?.makeWASocket || pkg.makeWASocket
const { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = pkg
import QRCode from 'qrcode'
import { createServer } from 'http'
import pino from 'pino'

const logger = pino({ level: 'silent' })
let qrHtml = '<h2 style="font-family:sans-serif;color:#888">Generando QR...</h2>'
let conectado = false

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(`<!DOCTYPE html><html><head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="3">
    <style>body{font-family:sans-serif;text-align:center;padding:40px;background:#f5f5f5}
    h1{color:#1B4332}img{max-width:300px;border:2px solid #1B4332;border-radius:8px;padding:16px;background:white}
    .ok{color:#2D6A4F;font-size:1.4em;font-weight:bold}</style>
  </head><body>
    <h1>🏠 Parque Chapultepec — Bot Ana</h1>
    ${conectado
      ? '<p class="ok">✅ WhatsApp conectado. Puedes cerrar esta ventana.</p>'
      : `<p>Escanea con WhatsApp del número <strong>777 175 8412</strong></p>
         <p style="color:#888;font-size:0.85em">Ajustes → Dispositivos vinculados → Vincular dispositivo</p>
         ${qrHtml}
         <p style="color:#aaa;font-size:0.8em">Se actualiza automáticamente cada 3 segundos</p>`
    }
  </body></html>`)
})

server.listen(3001, () => {
  console.log('\n🔗 Abre en el navegador: http://localhost:3001')
  console.log('   Escanea el QR con WhatsApp del número 777 175 8412\n')
})

async function iniciar() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_session')
  const { version } = await fetchLatestBaileysVersion()
  const sock = makeWASocket({ version, logger, auth: state, browser: ['Chapultepec', 'Chrome', '120'] })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async ({ connection, qr }) => {
    if (qr) {
      qrHtml = `<img src="${await QRCode.toDataURL(qr)}" alt="QR WhatsApp">`
      console.log('QR actualizado — visita http://localhost:3001')
    }
    if (connection === 'open') {
      conectado = true
      console.log('\n✅ WhatsApp vinculado exitosamente!')
      console.log('   Cerrando servidor QR en 5 segundos...\n')
      setTimeout(() => { server.close(); process.exit(0) }, 5000)
    }
    if (connection === 'close') {
      const loggedOut = DisconnectReason.loggedOut
      if (lastDisconnect?.error?.output?.statusCode === loggedOut) {
        console.log('Sesión cerrada. Vuelve a correr este script.')
        process.exit(1)
      }
    }
  })
}

iniciar().catch(console.error)
