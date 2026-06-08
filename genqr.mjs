import pkg from '@whiskeysockets/baileys'
import qrcode from 'qrcode'
import { createServer } from 'http'
import { readFileSync, existsSync } from 'fs'
import 'dotenv/config'

const makeWASocket = pkg.default?.makeWASocket || pkg.makeWASocket
const { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = pkg

const server = createServer((req, res) => {
  if (existsSync('/tmp/qr.png')) {
    res.writeHead(200, {'Content-Type':'image/png'})
    res.end(readFileSync('/tmp/qr.png'))
  } else {
    res.writeHead(200,{'Content-Type':'text/html'})
    res.end('<meta http-equiv="refresh" content="2"><h2 style="font:bold 24px sans-serif;padding:40px">Generando QR... espera</h2>')
  }
})
server.listen(9999, () => console.log('📱 Abre http://localhost:9999 para ver el QR'))

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_session')
  const { version } = await fetchLatestBaileysVersion()
  const sock = makeWASocket({ version, auth: state, printQRInTerminal: false, browser: ['Chapultepec','Chrome','120'] })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async ({ connection, qr, lastDisconnect }) => {
    if (qr) {
      await qrcode.toFile('/tmp/qr.png', qr, { width: 500, margin: 2 })
      console.log('✅ QR listo — abre http://localhost:9999')
    }
    if (connection === 'open') {
      console.log('✅ CONECTADO — guardando sesión...')
      // Esperar 3s para que saveCreds termine
      await new Promise(r => setTimeout(r, 3000))
      console.log('✅ SESIÓN GUARDADA — arranca el bot con: bash arrancar.sh')
      server.close()
      process.exit(0)
    }
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      if (code === DisconnectReason.loggedOut) { console.log('Sesión cerrada'); process.exit(1) }
      setTimeout(start, 3000)
    }
  })
}
start()
