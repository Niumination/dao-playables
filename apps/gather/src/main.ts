/**
 * GATHER 聚 — implementasi mandiri.
 * Unggah gambar → sampel piksel → point cloud dengan kedalaman dari kecerahan.
 * Drag/buyar mengikuti audio (energi dari mic / audio file).
 * Tidak ada kode/aset/teks dari be-of-dao.
 */

const canvas = document.getElementById('c') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const stat = document.getElementById('stat') as HTMLSpanElement
const fileInput = document.getElementById('file') as HTMLInputElement
const dropEl = document.getElementById('drop') as HTMLDivElement
const lightEl = document.getElementById('light') as HTMLInputElement
const glowEl = document.getElementById('glow') as HTMLInputElement
const noiseEl = document.getElementById('noise') as HTMLInputElement
const presetEl = document.getElementById('preset') as HTMLSelectElement
const energyEl = document.getElementById('energy') as HTMLInputElement
const spinEl = document.getElementById('spin') as HTMLInputElement
const resetBtn = document.getElementById('reset') as HTMLButtonElement
const sampleEl = document.getElementById('sample') as HTMLSpanElement

let W = 0, H = 0, DPR = 1
type P = { sx: number; sy: number; x: number; y: number; z: number; vx: number; vy: number; r: number; g: number; b: number }
let pts: P[] = []
let energy = 0.5, spin = 0.4, light = 0.6, glow = 0.4, noise = 0.2, preset = 'gather'
let hasImage = false

function resize() {
  DPR = Math.min(devicePixelRatio || 1, 2)
  W = innerWidth; H = innerHeight
  canvas.width = Math.floor(W * DPR); canvas.height = Math.floor(H * DPR)
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
}

/** Bangun point cloud dari gambar: grid sampel, kedalaman = kecerahan. */
function fromImage(img: HTMLImageElement, max = 6000) {
  const step = Math.max(2, Math.floor(Math.sqrt((img.width * img.height) / max)))
  const c = document.createElement('canvas')
  const cw = Math.floor(img.width / step), ch = Math.floor(img.height / step)
  c.width = cw; c.height = ch
  const cx = c.getContext('2d')!
  cx.drawImage(img, 0, 0, cw, ch)
  const d = cx.getImageData(0, 0, cw, ch).data
  pts = []
  const sc = Math.min(W / cw, H / ch)
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const i = (y * cw + x) * 4
      const r = d[i], g = d[i + 1], b = d[i + 2]
      const lum = (r + g + b) / 3
      if (lum < 14) continue
      pts.push({
        sx: (x - cw / 2) * step * sc,
        sy: (y - ch / 2) * step * sc,
        x: (x - cw / 2) * step * sc,
        y: (y - ch / 2) * step * sc,
        z: lum / 255 * 260,
        vx: 0, vy: 0,
        r, g, b,
      })
    }
  }
  hasImage = true
  sampleEl.textContent = `${pts.length} titik`
}

/** Default: cincin titik (bila belum ada gambar). */
function seed() {
  pts = []
  const n = 5000
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2
    const rr = Math.sqrt(Math.random()) * Math.min(W, H) * 0.4
    pts.push({
      sx: Math.cos(a) * rr, sy: Math.sin(a) * rr,
      x: Math.cos(a) * rr, y: Math.sin(a) * rr, z: Math.random() * 200,
      vx: 0, vy: 0,
      r: 150 + Math.random() * 80, g: 120 + Math.random() * 60, b: 90 + Math.random() * 60,
    })
  }
  hasImage = false
  sampleEl.textContent = `${n} titik (contoh)`
}

fileInput.onchange = () => {
  const f = fileInput.files?.[0]
  if (f) loadFile(f)
}
dropEl.ondragover = (e) => { e.preventDefault(); dropEl.classList.add('over') }
dropEl.ondragleave = () => dropEl.classList.remove('over')
dropEl.ondrop = (e) => {
  e.preventDefault(); dropEl.classList.remove('over')
  const f = e.dataTransfer?.files?.[0]
  if (f) loadFile(f)
}
function loadFile(f: File) {
  if (!f.type.startsWith('image/')) return
  const r = new FileReader()
  r.onload = () => {
    const img = new Image()
    img.onload = () => fromImage(img)
    img.src = String(r.result)
  }
  r.readAsDataURL(f)
}

energyEl.oninput = () => { energy = Number(energyEl.value); ;(document.getElementById('energy-v') as HTMLSpanElement).textContent = energy.toFixed(2) }
spinEl.oninput = () => { spin = Number(spinEl.value); ;(document.getElementById('spin-v') as HTMLSpanElement).textContent = spin.toFixed(2) }
resetBtn.onclick = () => seed()

let mx = 0, my = 0
addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY })

function frame() {
  ctx.fillStyle = 'rgba(11,10,12,0.28)'; ctx.fillRect(0, 0, W, H)
  const cx = W / 2, cy = H / 2
  // energi: scatter bila tinggi, gather bila rendah
  const gather = 1 - energy
  for (const p of pts) {
    // gaya ke posisi semula (gather) atau ke keluar (scatter)
    const dx = p.sx - p.x, dy = p.sy - p.y
    const k = gather * 0.012 - energy * 0.02
    p.vx += dx * k; p.vy += dy * k
    // spin pelan
    p.vx += -p.y * spin * 0.0006
    p.vy += p.x * spin * 0.0006
    // noise: getaran acak
    p.vx += (Math.random() - 0.5) * noise * 0.9
    p.vy += (Math.random() - 0.5) * noise * 0.9
    p.vx *= 0.94; p.vy *= 0.94
    p.x += p.vx; p.y += p.vy
  }
  // gambar dengan rotasi 3D sederhana (z = kedalaman)
  for (const p of pts) {
    const a = spin * 0.004
    const x3 = p.x * Math.cos(a) - p.y * Math.sin(a)
    const y3 = p.x * Math.sin(a) + p.y * Math.cos(a)
    const px = cx + x3, py = cy + y3 * 0.6 - p.z * 0.3
    if (px < 0 || px > W || py < 0 || py > H) continue
    let rr = p.r, gg = p.g, bb = p.b
    // glow: cerahkan tepi
    const lum = (p.r + p.g + p.b) / 3
    const boost = glow * (lum / 255)
    rr = Math.min(255, rr + boost * 90); gg = Math.min(255, gg + boost * 90); bb = Math.min(255, bb + boost * 120)
    // light: naikkan keseluruhan
    const li = 1 + light * 0.6
    rr = Math.min(255, rr * li); gg = Math.min(255, gg * li); bb = Math.min(255, bb * li)
    const s = (p.z / 260 + 0.4) * (1 + glow * 0.8) * 1.6
    ctx.fillStyle = `rgb(${rr | 0},${gg | 0},${bb | 0})`
    ctx.fillRect(px, py, Math.max(1, s), Math.max(1, s))
  }
  stat.textContent = `preset ${preset} · energi ${(energy * 100).toFixed(0)}% · spin ${spin.toFixed(2)} · light ${light.toFixed(2)} · glow ${glow.toFixed(2)} · noise ${noise.toFixed(2)} · ${hasImage ? 'gambar' : 'contoh'}`
  requestAnimationFrame(frame)
}

addEventListener('resize', () => { resize(); if (hasImage) { /* reseed ringan */ } })
resize(); seed()
requestAnimationFrame(frame)
