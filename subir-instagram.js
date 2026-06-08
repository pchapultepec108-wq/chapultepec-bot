import puppeteer from 'puppeteer-core'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const POSTS_DIR = join(__dir, 'posts-instagram')

const POSTS = [
  { file: 'post1-penthouse-hero.jpg',    caption: 'Imagina despertar aquí cada mañana. ☀️\n\n85 m² de rooftop privado con jacuzzi, asador y vista panorámica de Cuernavaca.\nNo es un resort. Es tu casa.\n\n🏠 Penthouse exclusivo — última unidad disponible\n💰 $4,500,000 MXN · Entrega inmediata\n📍 A 50m del Parque Chapultepec, Cuernavaca\n\n📱 777 175 84 12\n\n#PenthouseCuernavaca #LujoCuernavaca #ParqueChapultepec #BienesRaicesCuernavaca #RooftopPrivado #Penthouse #Cuernavaca' },
  { file: 'post3-depto-hero.jpg',         caption: 'Tu rooftop privado en Cuernavaca. 🌿\n\n30 m² de deck de madera solo para ti.\n\n🏠 Departamento 4° piso · 112 m²\n💰 $2,800,000 MXN\n✅ 2 recámaras · alberca · elevador · entrega inmediata\n\n📱 777 175 84 12\n#RooftopPrivado #DepartamentoCuernavaca #ParqueChapultepec #VidaEnCuernavaca' },
  { file: 'post4-alberca.jpg',             caption: 'Cuernavaca tiene 330 días de sol al año ☀️\n\nY tú podrías pasarlos en la alberca climatizada de Parque Chapultepec.\n\n🌟 Penthouse · $4,500,000 MXN\n🏠 Departamento · $2,800,000 MXN\n\n📱 777 175 84 12\n#AlbercaCuernavaca #VidaLujosa #Cuernavaca2025 #ResidencialExclusivo' },
  { file: 'post6-bano-lujo.jpg',           caption: 'Esto no es el lobby de un hotel 5 estrellas. 🪞\n\nEs el baño de tu suite.\n\nTravertino · Herrería negra · Ducha italiana · Luz natural.\n\nPenthouse · 3 suites · $4,500,000 MXN\n📱 777 175 84 12\n\n#AcabadosDeLujo #Penthouse #Cuernavaca #DiseñoDeInteriores' },
]

async function main() {
  console.log('\n📱 Conectando a Chrome...')
  
  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
    defaultViewport: null
  })

  console.log('✅ Chrome conectado\n')

  for (let i = 0; i < POSTS.length; i++) {
    const post = POSTS[i]
    const imgPath = join(POSTS_DIR, post.file)
    console.log(`📸 Publicando ${i+1}/${POSTS.length}: ${post.file}`)

    const page = await browser.newPage()
    
    try {
      await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 30000 })
      await new Promise(r => setTimeout(r, 3000))

      const url = page.url()
      if (url.includes('accounts/login')) {
        console.log('  ⚠️  No logueado en Instagram — abre instagram.com e inicia sesión')
        await page.close()
        break
      }

      // Buscar botón crear (+)
      const createBtn = await page.waitForSelector('[aria-label="Nueva publicación"], [aria-label="New post"], svg[aria-label*="ueva"]', { timeout: 10000 }).catch(() => null)
      if (!createBtn) {
        // Intentar click en el ícono de + directo
        await page.evaluate(() => {
          const svgs = document.querySelectorAll('svg')
          for (const svg of svgs) {
            if (svg.ariaLabel?.includes('Nueva') || svg.ariaLabel?.includes('New')) {
              svg.parentElement.click()
              return
            }
          }
        })
      } else {
        await createBtn.click()
      }
      
      await new Promise(r => setTimeout(r, 2000))

      // Input de archivo
      await page.evaluate(() => {
        const input = document.createElement('input')
        input.type = 'file'
        input.id = '__ig_upload'
        input.accept = 'image/*'
        input.style.position = 'fixed'
        input.style.top = '0'
        input.style.left = '0'
        input.style.opacity = '0'
        document.body.appendChild(input)
      })
      
      const fileInput = await page.$('input[type="file"]')
      if (fileInput) {
        await fileInput.uploadFile(imgPath)
        console.log('  📁 Archivo cargado')
      }

      await new Promise(r => setTimeout(r, 3000))

      // Navegar por los pasos
      for (let step = 0; step < 3; step++) {
        const btns = await page.$$('button')
        for (const btn of btns) {
          const txt = await page.evaluate(el => el.textContent?.trim(), btn)
          if (['Siguiente', 'Next', 'Compartir', 'Share'].includes(txt)) {
            await btn.click()
            console.log(`  → ${txt}`)
            await new Promise(r => setTimeout(r, 2000))
            break
          }
        }
      }

      // Caption
      const textarea = await page.$('textarea[aria-label], div[contenteditable="true"][role="textbox"]')
      if (textarea) {
        await textarea.click()
        await textarea.type(post.caption, { delay: 5 })
        console.log('  ✍️  Caption escrito')
      }

      await new Promise(r => setTimeout(r, 1000))

      // Share final
      const shareBtns = await page.$$('button')
      for (const btn of shareBtns) {
        const txt = await page.evaluate(el => el.textContent?.trim(), btn)
        if (txt === 'Compartir' || txt === 'Share') {
          await btn.click()
          console.log(`  ✅ Publicado`)
          break
        }
      }

      await new Promise(r => setTimeout(r, 5000))

    } catch(e) {
      console.error(`  ❌ Error: ${e.message}`)
    }

    await page.close()
    await new Promise(r => setTimeout(r, 3000))
  }

  console.log('\n🎉 Proceso completado')
  await browser.disconnect()
}

main().catch(console.error)
