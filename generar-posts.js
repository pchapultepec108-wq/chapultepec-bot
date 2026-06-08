// Genera imágenes de posts de Instagram con texto y branding
// Requiere: npm install canvas

import { createCanvas, loadImage, registerFont } from 'canvas'
import { writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const FOTOS = join(__dir, 'fotos')
const OUT   = join(__dir, 'posts-instagram')

// Posts a generar: [archivo_base, texto_superior, texto_precio, hashtag_color]
const POSTS = [
  {
    id: 'post1-penthouse-hero',
    foto: 'ph-hero.jpg',
    tag: 'ÚLTIMA UNIDAD',
    titulo: 'Penthouse Exclusivo',
    sub: 'Rooftop 85m² · Jacuzzi · Vista panorámica',
    precio: '$4,500,000 MXN',
    cta: '777 175 84 12',
    tagColor: '#C9A84C',
  },
  {
    id: 'post2-penthouse-rooftop',
    foto: 'render-rooftop.jpg',
    tag: 'PARQUE CHAPULTEPEC',
    titulo: 'Tu rooftop privado',
    sub: 'Jacuzzi · Asador · Pérgola · Vista 360°',
    precio: 'Penthouse · $4,500,000',
    cta: '@pchapultepec',
    tagColor: '#C9A84C',
  },
  {
    id: 'post3-depto-hero',
    foto: 'depto-hero.jpg',
    tag: 'DISPONIBLE',
    titulo: 'Departamento 4° piso',
    sub: '112 m² · Rooftop 30m² · Deck de madera',
    precio: '$2,800,000 MXN',
    cta: '777 175 84 12',
    tagColor: '#2D6A4F',
  },
  {
    id: 'post4-alberca',
    foto: 'depto-alberca.jpg',
    tag: 'AMENIDADES',
    titulo: 'Alberca climatizada',
    sub: 'Jardín tropical · Cuernavaca 365 días',
    precio: 'Desde $2,800,000',
    cta: '@pchapultepec',
    tagColor: '#2D6A4F',
  },
  {
    id: 'post5-depto-terraza',
    foto: 'depto-terraza.jpg',
    tag: 'ROOFTOP PRIVADO',
    titulo: 'Solo tuyo',
    sub: 'Deck de madera · Sin compartir · 30 m²',
    precio: 'Departamento · $2,800,000',
    cta: '777 175 84 12',
    tagColor: '#2D6A4F',
  },
  {
    id: 'post6-bano-lujo',
    foto: 'render-bano-1.jpg',
    tag: 'ACABADOS PREMIUM',
    titulo: 'Baño de lujo',
    sub: 'Travertino · Herrería negra · Suite completa',
    precio: 'Penthouse · $4,500,000',
    cta: '@pchapultepec',
    tagColor: '#C9A84C',
  },
]

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = ''
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line, x, y)
      line = words[n] + ' '
      y += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, y)
  return y
}

async function generarPost(post) {
  const SIZE = 1080
  const canvas = createCanvas(SIZE, SIZE)
  const ctx = canvas.getContext('2d')

  // Cargar foto de fondo
  const rutaFoto = join(FOTOS, post.foto)
  if (!existsSync(rutaFoto)) { console.log(`⚠️  No encontrada: ${post.foto}`); return }

  const img = await loadImage(rutaFoto)

  // Escalar y centrar imagen
  const escala = Math.max(SIZE / img.width, SIZE / img.height)
  const w = img.width * escala
  const h = img.height * escala
  const x = (SIZE - w) / 2
  const y = (SIZE - h) / 2
  ctx.drawImage(img, x, y, w, h)

  // Overlay degradado inferior
  const gradBottom = ctx.createLinearGradient(0, SIZE * 0.35, 0, SIZE)
  gradBottom.addColorStop(0, 'rgba(0,0,0,0)')
  gradBottom.addColorStop(0.5, 'rgba(0,0,0,0.6)')
  gradBottom.addColorStop(1, 'rgba(0,0,0,0.92)')
  ctx.fillStyle = gradBottom
  ctx.fillRect(0, 0, SIZE, SIZE)

  // Overlay superior sutil
  const gradTop = ctx.createLinearGradient(0, 0, 0, 180)
  gradTop.addColorStop(0, 'rgba(0,0,0,0.5)')
  gradTop.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gradTop
  ctx.fillRect(0, 0, SIZE, 180)

  const PAD = 56

  // TAG superior izquierdo
  ctx.fillStyle = post.tagColor
  const tagW = ctx.measureText(post.tag).width + 24
  ctx.font = 'bold 22px sans-serif'
  const tagActualW = ctx.measureText(post.tag).width + 24
  ctx.fillRect(PAD, PAD, tagActualW, 36)
  ctx.fillStyle = '#000'
  ctx.font = 'bold 13px sans-serif'
  ctx.fillText(post.tag, PAD + 12, PAD + 24)

  // Logo / marca superior derecho
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = 'bold 18px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('PARQUE CHAPULTEPEC', SIZE - PAD, PAD + 26)
  ctx.font = '13px sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.fillText('Cuernavaca · @pchapultepec', SIZE - PAD, PAD + 46)
  ctx.textAlign = 'left'

  // Línea dorada decorativa
  ctx.strokeStyle = post.tagColor
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(PAD, SIZE - 260)
  ctx.lineTo(PAD + 60, SIZE - 260)
  ctx.stroke()

  // Título principal
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold 68px sans-serif`
  ctx.fillText(post.titulo, PAD, SIZE - 210)

  // Subtítulo
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.font = '28px sans-serif'
  ctx.fillText(post.sub, PAD, SIZE - 158)

  // Precio
  ctx.fillStyle = post.tagColor
  ctx.font = `bold 38px sans-serif`
  ctx.fillText(post.precio, PAD, SIZE - 100)

  // CTA
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '24px sans-serif'
  ctx.fillText(post.cta, PAD, SIZE - 56)

  // Guardar
  const buffer = canvas.toBuffer('image/jpeg', { quality: 0.95 })
  const salida = join(OUT, `${post.id}.jpg`)
  writeFileSync(salida, buffer)
  console.log(`✅ ${post.id}.jpg`)
}

async function main() {
  console.log('\n🎨 Generando posts de Instagram...\n')
  for (const post of POSTS) {
    await generarPost(post)
  }
  console.log(`\n✅ ${POSTS.length} posts guardados en ~/chapultepec-bot/posts-instagram/`)
  console.log('📂 Abre la carpeta para ver y subir a Instagram\n')
}

main().catch(console.error)
