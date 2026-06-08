// Captura el access token de Buffer automáticamente
import { createServer } from 'http'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

// Buffer OAuth - Client ID público para apps de tipo "personal"
// El usuario hace login en Buffer y el token se guarda solo
const PORT = 10001

let tokenCapturado = null

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)

  if (url.pathname === '/callback') {
    const code = url.searchParams.get('code')
    const token = url.searchParams.get('access_token')

    if (token || code) {
      tokenCapturado = token || code
      // Guardar en .env
      const env = readFileSync(join(__dir, '.env'), 'utf8')
      const nuevoEnv = env.includes('BUFFER_TOKEN')
        ? env.replace(/BUFFER_TOKEN=.*/, `BUFFER_TOKEN=${tokenCapturado}`)
        : env + `\nBUFFER_TOKEN=${tokenCapturado}`
      writeFileSync(join(__dir, '.env'), nuevoEnv)

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(`<html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#f0fdf4">
        <h2 style="color:#166534">✅ Token capturado exitosamente</h2>
        <p>Puedes cerrar esta ventana. Los posts se programarán automáticamente.</p>
      </body></html>`)
      console.log('\n✅ Token de Buffer capturado:', tokenCapturado.substring(0,20) + '...')
      setTimeout(() => { server.close(); process.exit(0) }, 2000)
    } else {
      res.writeHead(400); res.end('Sin token')
    }
  } else {
    // Página de instrucciones
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(`<html><head><meta charset="utf-8"></head><body style="font-family:sans-serif;max-width:600px;margin:60px auto;padding:20px">
      <h2>🏠 Parque Chapultepec — Conectar Buffer</h2>
      <p>Para obtener tu token de Buffer:</p>
      <ol style="line-height:2">
        <li>Abre <a href="https://buffer.com/developers/apps" target="_blank">buffer.com/developers/apps</a></li>
        <li>Click en <strong>"Create an App"</strong></li>
        <li>Nombre: <code>chapultepec</code></li>
        <li>Callback URL: <code>http://localhost:${PORT}/callback</code></li>
        <li>Click <strong>Save</strong></li>
        <li>Copia el <strong>Access Token</strong> que aparece</li>
        <li>Pégalo en la URL: <a href="http://localhost:${PORT}/callback?access_token=PEGA_AQUI">http://localhost:${PORT}/callback?access_token=TU_TOKEN</a></li>
      </ol>
      <p style="color:#666;font-size:13px">El token se guardará automáticamente y se programarán todos los posts.</p>
    </body></html>`)
  }
})

server.listen(PORT, () => {
  console.log(`\n🔗 Abre en Chrome: http://localhost:${PORT}`)
  console.log('   Sigue las instrucciones para conectar Buffer\n')
})
