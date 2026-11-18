/**
 * CHAOS 混沌 — implementasi mandiri.
 * Atraktor Lorenz di canvas 2D, jejak partikel bertahan (fade alami).
 * Tidak ada kode/aset/teks dari be-of-dao; hanya mekanisme "attractor + particles".
 */

const canvas = document.getElementById('c') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!

const stat = document.getElementById('stat') as HTMLSpanElement
const sigmaEl = document.getElementById('sigma') as HTMLInputElement
const rhoEl = document.getElementById('rho') as HTMLInputElement
const betaEl = document.getElementById('beta') as HTMLInputElement
const countEl = document.getElementById('count') as HTMLInputElement
const resetBtn = document.getElementById('reset') as HTMLButtonElement

let W = 0, H = 0, DPR = 1

function resize() {
  DPR = Math.min(devicePixelRatio || 1, 2)
  W = innerWidth
  H = innerHeight
  canvas.width = Math.floor(W * DPR)
  canvas.height = Math.floor(H * DPR)
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
  // isi awal agar bukan hitam penuh
  ctx.fillStyle = '#0a0c0d'
  ctx.fillRect(0, 0, W, H)
}

/** partikel: posisi (x,y,z) pada ruang atraktor, diintegrasi RK4 */
type P = { x: number; y: number; z: number; hue: number }

let particles: P[] = []
let sigma = 10, rho = 28, beta = 2.667
let count = 700
let t = 0

function seed() {
  particles = []
  for (let i = 0; i < count; i++) {
    particles.push({
      x: (Math.random() - 0.5) * 8,
      y: (Math.random() - 0.5) * 8,
      z: Math.random() * 8 + 2,
      hue: 140 + Math.random() * 40,
    })
  }
}

function deriv(p: P, out: P) {
  out.x = sigma * (p.y - p.x)
  out.y = p.x * (rho - p.z) - p.y
  out.z = p.x * p.y - beta * p.z
}

const k1: P = { x: 0, y: 0, z: 0, hue: 0 }
const k2: P = { x: 0, y: 0, z: 0, hue: 0 }
const k3: P = { x: 0, y: 0, z: 0, hue: 0 }
const k4: P = { x: 0, y: 0, z: 0, hue: 0 }
const tmp: P = { x: 0, y: 0, z: 0, hue: 0 }

/** RK4 satu langkah */
function step(p: P, dt: number) {
  deriv(p, k1)
  tmp.x = p.x + k1.x * dt / 2; tmp.y = p.y + k1.y * dt / 2; tmp.z = p.z + k1.z * dt / 2
  deriv(tmp, k2)
  tmp.x = p.x + k2.x * dt / 2; tmp.y = p.y + k2.y * dt / 2; tmp.z = p.z + k2.z * dt / 2
  deriv(tmp, k3)
  tmp.x = p.x + k3.x * dt; tmp.y = p.y + k3.y * dt; tmp.z = p.z + k3.z * dt
  deriv(tmp, k4)
  p.x += dt / 6 * (k1.x + 2 * k2.x + 2 * k3.x + k4.x)
  p.y += dt / 6 * (k1.y + 2 * k2.y + 2 * k3.y + k4.y)
  p.z += dt / 6 * (k1.z + 2 * k2.z + 2 * k3.z + k4.z)
}

/** proyeksi sederhana: perspektif isometrik */
function project(p: P): { sx: number; sy: number; depth: number } {
  // skala dan rotasi isometrik lembut
  const s = Math.min(W, H) / 55
  const cx = W / 2, cy = H / 2
  const xr = p.x * Math.cos(0.35) - p.z * Math.sin(0.35)
  const zr = p.x * Math.sin(0.35) + p.z * Math.cos(0.35)
  return {
    sx: cx + xr * s,
    sy: cy + (p.y * 0.72 - zr * 0.28) * s,
    depth: zr,
  }
}

let last = performance.now()
let frameCounter = 0, fps = 0, lastFpsT = last

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

  // fade latar agar jejak memudar perlahan (bukan clear total)
  ctx.fillStyle = 'rgba(10, 12, 13, 0.055)'
  ctx.fillRect(0, 0, W, H)

  const h = 1 / 60
  t += h
  for (const p of particles) {
    step(p, h)
    const { sx, sy, depth } = project(p)
    if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) {
      // jaga partikel di area layar: pindah posisi bila keluar
      p.x *= 0.98; p.y *= 0.98
    }
    const light = 0.45 + Math.max(0, Math.min(1, (depth + 30) / 60)) * 0.45
    ctx.fillStyle = `hsla(${p.hue}, 62%, ${Math.round(light * 100)}%, 0.5)`
    ctx.fillRect(sx, sy, 1.6, 1.6)
  }

  // label statistik (ringan)
  stat.textContent = `fps ${fps.toFixed(0)} · partikel ${particles.length} · t ${t.toFixed(1)}`
  requestAnimationFrame(frame)
}

function syncLabels() {
  ;(document.getElementById('s-v') as HTMLSpanElement).textContent = sigma.toFixed(1)
  ;(document.getElementById('r-v') as HTMLSpanElement).textContent = rho.toFixed(1)
  ;(document.getElementById('b-v') as HTMLSpanElement).textContent = beta.toFixed(3)
  ;(document.getElementById('n-v') as HTMLSpanElement).textContent = String(count)
}

sigmaEl.oninput = () => { sigma = Number(sigmaEl.value); syncLabels() }
rhoEl.oninput = () => { rho = Number(rhoEl.value); syncLabels() }
betaEl.oninput = () => { beta = Number(betaEl.value); syncLabels() }
countEl.oninput = () => { count = Number(countEl.value); syncLabels(); seed() }
resetBtn.onclick = () => { seed(); ctx.fillStyle = '#0a0c0d'; ctx.fillRect(0, 0, W, H) }
addEventListener('resize', resize)

resize()
seed()
syncLabels()
requestAnimationFrame(frame)
