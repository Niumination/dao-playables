/**
 * CHAOS 混沌 — implementasi mandiri.
 * Synth yang dimainkan atraktor: gerak memodulasi nada/filter/gain.
 * Bentuk atraktor bisa diganti (Lorenz, Rössler, Halvorsen, Aizawa, Thomas).
 * Tidak ada kode/aset/teks dari be-of-dao.
 */
const canvas = document.getElementById('c') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const stat = document.getElementById('stat') as HTMLSpanElement
const shapeEl = document.getElementById('shape') as HTMLSelectElement
const sliceEl = document.getElementById('slice') as HTMLInputElement
const starsEl = document.getElementById('stars') as HTMLInputElement
const axesEl = document.getElementById('axes') as HTMLInputElement
const expoEl = document.getElementById('expo') as HTMLInputElement
const ribbonEl = document.getElementById('ribbon') as HTMLInputElement
const audioBtn = document.getElementById('audio') as HTMLButtonElement
const keysEl = document.getElementById('keys') as HTMLDivElement

let W = 0, H = 0, DPR = 1
let shape = 'Lorenz', slice = 0.5, stars = 0, axes = true, expo = 1, ribbon = 0.6

type P = { x: number; y: number; z: number }
let p: P = { x: 0.1, y: 0, z: 20 }
const trail: P[] = []
let TRAIL = 900

const SHAPES: Record<string, { p: P; f: (q: P, o: P) => void; scale: number }> = {
  Lorenz: { p: { x: 0.1, y: 0, z: 20 }, scale: 1, f: (q, o) => { o.x = 10 * (q.y - q.x); o.y = q.x * (28 - q.z) - q.y; o.z = q.x * q.y - 2.667 * q.z } },
  Rössler: { p: { x: 1, y: 1, z: 0 }, scale: 0.06, f: (q, o) => { o.x = -q.y - q.z; o.y = q.x + 0.2 * q.y; o.z = 0.2 + q.z * (q.x - 5.7) } },
  Halvorsen: { p: { x: -5, y: -5, z: -5 }, scale: 0.05, f: (q, o) => { o.x = -1.4 * q.x - 4 * q.y - 4 * q.z - q.x * q.x; o.y = -1.4 * q.y - 4 * q.z - 4 * q.x - q.y * q.y; o.z = -1.4 * q.z - 4 * q.x - 4 * q.y - q.z * q.z } },
  Aizawa: { p: { x: 0.1, y: 0, z: 0 }, scale: 0.2, f: (q, o) => { o.x = (q.z - 0.7) * q.x - 3.5 * q.y; o.y = 3.5 * q.x + (q.z - 0.7) * q.y; o.z = 0.6 + 0.95 * q.z - q.z * q.z * q.z / 3 - (q.x * q.x + q.y * q.y) * (1 + 0.2 * q.z) + 0.1 * q.z * q.x * q.x * q.x } },
  Thomas: { p: { x: 1, y: 1, z: 1 }, scale: 0.09, f: (q, o) => { o.x = Math.sin(q.y) - 0.2 * q.x; o.y = Math.sin(q.z) - 0.2 * q.y; o.z = Math.sin(q.x) - 0.2 * q.z } },
}

function resize() {
  DPR = Math.min(devicePixelRatio || 1, 2)
  W = innerWidth; H = innerHeight
  canvas.width = Math.floor(W * DPR); canvas.height = Math.floor(H * DPR)
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
  ctx.fillStyle = '#0a0c0d'; ctx.fillRect(0, 0, W, H)
}

const k1: P = { x: 0, y: 0, z: 0 }, k2: P = { x: 0, y: 0, z: 0 }, k3: P = { x: 0, y: 0, z: 0 }, k4: P = { x: 0, y: 0, z: 0 }, tmp: P = { x: 0, y: 0, z: 0 }
function step(dt: number) {
  const sh = SHAPES[shape]
  sh.f(p, k1)
  tmp.x = p.x + k1.x * dt / 2; tmp.y = p.y + k1.y * dt / 2; tmp.z = p.z + k1.z * dt / 2; sh.f(tmp, k2)
  tmp.x = p.x + k2.x * dt / 2; tmp.y = p.y + k2.y * dt / 2; tmp.z = p.z + k2.z * dt / 2; sh.f(tmp, k3)
  tmp.x = p.x + k3.x * dt; tmp.y = p.y + k3.y * dt; tmp.z = p.z + k3.z * dt; sh.f(tmp, k4)
  p.x += dt / 6 * (k1.x + 2 * k2.x + 2 * k3.x + k4.x)
  p.y += dt / 6 * (k1.y + 2 * k2.y + 2 * k3.y + k4.y)
  p.z += dt / 6 * (k1.z + 2 * k2.z + 2 * k3.z + k4.z)
  trail.push({ x: p.x, y: p.y, z: p.z })
  if (trail.length > TRAIL) trail.shift()
}

// --- audio ---
let ac: AudioContext | null = null
let osc: OscillatorNode | null = null, osc2: OscillatorNode | null = null
let filt: BiquadFilterNode | null = null, g1: GainNode | null = null, g2: GainNode | null = null, master: GainNode | null = null
const NOTE = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24, 27, 29, 31, 34, 36]
let base = 55

function audioOn() {
  if (!ac) {
    ac = new AudioContext()
    master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination)
    filt = ac.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 900; filt.Q.value = 6
    g1 = ac.createGain(); g1.gain.value = 0.5
    g2 = ac.createGain(); g2.gain.value = 0.35
    osc = ac.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 110
    osc2 = ac.createOscillator(); osc2.type = 'triangle'; osc2.frequency.value = 165
    osc.connect(g1); osc2.connect(g2); g1.connect(filt); g2.connect(filt); filt.connect(master)
    osc.start(); osc2.start()
  }
  ac.resume()
  master!.gain.cancelScheduledValues(ac.currentTime)
  master!.gain.linearRampToValueAtTime(0.22, ac.currentTime + 0.4)
  audioBtn.textContent = '◉ audio ON'
}
function audioOff() {
  if (!ac) return
  master!.gain.cancelScheduledValues(ac.currentTime)
  master!.gain.linearRampToValueAtTime(0, ac.currentTime + 0.3)
  audioBtn.textContent = '○ audio OFF'
}
function noteFromZ(): number {
  const n = Math.abs(p.z)
  const idx = Math.max(0, Math.min(NOTE.length - 1, Math.round(n / (n + 20) * NOTE.length)))
  return base * Math.pow(2, NOTE[idx] / 12)
}

function frame(_now: number) {
  const dt = 1 / 60
  step(dt)
  if (ac && osc && filt && g1 && g2 && osc2) {
    const f = noteFromZ()
    osc.frequency.setTargetAtTime(f, ac.currentTime, 0.01)
    osc2.frequency.setTargetAtTime(f * 1.5, ac.currentTime, 0.01)
    filt.frequency.setTargetAtTime(200 + Math.abs(p.y) * 90 * expo, ac.currentTime, 0.02)
    const vel = Math.max(0, Math.min(1, (p.x + 20) / 40))
    g1.gain.setTargetAtTime(0.2 + vel * 0.5, ac.currentTime, 0.03)
    g2.gain.setTargetAtTime(0.1 + vel * 0.3, ac.currentTime, 0.03)
  }
  ctx.fillStyle = 'rgba(10,12,13,0.06)'; ctx.fillRect(0, 0, W, H)
  // bintang latar
  if (stars > 0) {
    ctx.fillStyle = 'rgba(200,210,220,0.5)'
    for (let i = 0; i < stars; i++) {
      const sx = (Math.sin(i * 12.9898) * 43758.5453 % 1) * W
      const sy = (Math.sin(i * 78.233) * 12345.678 % 1) * H
      ctx.fillRect(Math.abs(sx), Math.abs(sy), 1, 1)
    }
  }
  const sh = SHAPES[shape]
  const s = Math.min(W, H) / 60 * sh.scale * 6
  const cx = W / 2, cy = H / 2
  // sumbu
  if (axes) {
    ctx.strokeStyle = 'rgba(127,185,143,0.2)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke()
  }
  for (let i = 0; i < trail.length; i++) {
    const q = trail[i]
    const sx = cx + q.x * s, sy = cy + q.y * s * 0.7 - q.z * s * 0.25
    if (sx < 0 || sx > W || sy < 0 || sy > H) continue
    const a = Math.pow(i / trail.length, 1 + ribbon) * 0.8
    ctx.fillStyle = `rgba(127,185,143,${a.toFixed(3)})`
    const r = 1 + ribbon * 1.5
    ctx.fillRect(sx, sy, r, r)
  }
  ctx.fillStyle = '#f0c46a'
  ctx.fillRect(cx + p.x * s - 2, cy + p.y * s * 0.7 - p.z * s * 0.25 - 2, 4, 4)
  stat.textContent = `${shape} · x ${p.x.toFixed(1)} y ${p.y.toFixed(1)} z ${p.z.toFixed(1)} · nada ${noteFromZ().toFixed(1)} Hz`
  requestAnimationFrame(frame)
}

const KEYMAP: Record<string, number> = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15 }
function renderKeys() {
  keysEl.innerHTML = ''
  for (const [k, i] of Object.entries(KEYMAP)) {
    const b = document.createElement('button')
    b.className = 'key'
    b.textContent = k
    b.onclick = () => { base = 55 * Math.pow(2, i / 12); flash(b) }
    keysEl.appendChild(b)
  }
}
function flash(b: HTMLElement) { b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 120) }

shapeEl.onchange = () => { shape = shapeEl.value; p = { ...SHAPES[shape].p }; trail.length = 0; TRAIL = Math.round(900 * (0.4 + slice)) }
sliceEl.oninput = () => { slice = Number(sliceEl.value); TRAIL = Math.round(900 * (0.4 + slice)); ;(document.getElementById('sl-v') as HTMLSpanElement).textContent = slice.toFixed(2) }
starsEl.oninput = () => { stars = Number(starsEl.value); ;(document.getElementById('st-v') as HTMLSpanElement).textContent = String(stars) }
axesEl.onchange = () => { axes = axesEl.checked }
expoEl.oninput = () => { expo = Number(expoEl.value); ;(document.getElementById('ex-v') as HTMLSpanElement).textContent = expo.toFixed(2) }
ribbonEl.oninput = () => { ribbon = Number(ribbonEl.value); ;(document.getElementById('rb-v') as HTMLSpanElement).textContent = ribbon.toFixed(2) }
audioBtn.onclick = () => { if (!ac) audioOn(); else if (master && master.gain.value > 0.02) audioOff(); else audioOn() }
addEventListener('resize', resize)
resize(); renderKeys()
requestAnimationFrame(frame)
