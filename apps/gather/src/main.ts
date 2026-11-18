/**
 * GATHER 聚 — implementasi mandiri.
 * Sekumpulan partikel mengumpul ke inti (gravitasi + pengereman), canvas 2D.
 * Tidak ada kode/aset/teks dari be-of-dao.
 */

const canvas = document.getElementById('c') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!

const stat = document.getElementById('stat') as HTMLSpanElement
const gravEl = document.getElementById('grav') as HTMLInputElement
const dampEl = document.getElementById('damp') as HTMLInputElement
const countEl = document.getElementById('count') as HTMLInputElement
const radEl = document.getElementById('rad') as HTMLInputElement
const resetBtn = document.getElementById('reset') as HTMLButtonElement

let W = 0, H = 0, DPR = 1
let grav = 220, damp = 0.92, count = 900, radius = 90

type P = { x: number; y: number; vx: number; vy: number; hue: number }

let particles: P[] = []

function resize() {
  DPR = Math.min(devicePixelRatio || 1, 2)
  W = innerWidth
  H = innerHeight
  canvas.width = Math.floor(W * DPR)
  canvas.height = Math.floor(H * DPR)
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
  ctx.fillStyle = '#0b0a0c'
  ctx.fillRect(0, 0, W, H)
}

function seed() {
  particles = []
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2
    const r = Math.random() * Math.min(W, H) * 0.45 + 40
    particles.push({
      x: W / 2 + Math.cos(a) * r,
      y: H / 2 + Math.sin(a) * r,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      hue: 20 + Math.random() * 30,
    })
  }
}

let frameCounter = 0, fps = 0, lastFpsT = performance.now(), last = lastFpsT

function frame(now: number) {
  const elapsed = (now - last) / 1000
  void elapsed
  last = now
  frameCounter++
  if (now - lastFpsT > 500) {
    fps = frameCounter * 1000 / (now - lastFpsT)
    frameCounter = 0
    lastFpsT = now
  }

  // fade lembut agar jejak memudar
  ctx.fillStyle = 'rgba(11, 10, 12, 0.06)'
  ctx.fillRect(0, 0, W, H)

  const cx = W / 2, cy = H / 2
  for (const p of particles) {
    const dx = cx - p.x, dy = cy - p.y
    const d2 = dx * dx + dy * dy + 900
    const d = Math.sqrt(d2)
    const f = grav / d2
    p.vx = (p.vx + dx / d * f) * damp
    p.vy = (p.vy + dy / d * f) * damp
    p.x += p.vx
    p.y += p.vy

    // partikel di luar layar: kembalikan ke tepi
    if (p.x < -40 || p.x > W + 40 || p.y < -40 || p.y > H + 40) {
      p.x = cx + (Math.random() - 0.5) * W * 0.8
      p.y = cy + (Math.random() - 0.5) * H * 0.8
      p.vx = 0; p.vy = 0
    }

    const speed = Math.min(1, (Math.abs(p.vx) + Math.abs(p.vy)) / 6)
    ctx.fillStyle = `hsla(${p.hue}, 55%, ${Math.round(45 + speed * 30)}%, 0.45)`
    ctx.fillRect(p.x, p.y, 2, 2)
  }

  // inti: cincin lembut
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
  g.addColorStop(0, 'rgba(201,154,122,0.22)')
  g.addColorStop(1, 'rgba(201,154,122,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()

  stat.textContent = `fps ${fps.toFixed(0)} · partikel ${particles.length} · jari-jari inti ${radius}`
  requestAnimationFrame(frame)
}

function syncLabels() {
  ;(document.getElementById('g-v') as HTMLSpanElement).textContent = String(grav)
  ;(document.getElementById('d-v') as HTMLSpanElement).textContent = damp.toFixed(3)
  ;(document.getElementById('n-v') as HTMLSpanElement).textContent = String(count)
  ;(document.getElementById('r-v') as HTMLSpanElement).textContent = String(radius)
}

gravEl.oninput = () => { grav = Number(gravEl.value); syncLabels() }
dampEl.oninput = () => { damp = Number(dampEl.value); syncLabels() }
countEl.oninput = () => { count = Number(countEl.value); syncLabels(); seed() }
radEl.oninput = () => { radius = Number(radEl.value); syncLabels() }
resetBtn.onclick = () => { seed(); ctx.fillStyle = '#0b0a0c'; ctx.fillRect(0, 0, W, H) }
addEventListener('resize', resize)

resize()
seed()
syncLabels()
requestAnimationFrame(frame)
