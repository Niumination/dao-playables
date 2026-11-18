/**
 * CHAOS 混沌 — implementasi mandiri.
 * Synth yang dimainkan atraktor: gerak Lorenz menggerakkan nada & filter.
 * Tidak ada kode/aset/teks dari be-of-dao.
 */

const canvas = document.getElementById('c') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const stat = document.getElementById('stat') as HTMLSpanElement
const keysEl = document.getElementById('keys') as HTMLDivElement
const sigmaEl = document.getElementById('sigma') as HTMLInputElement
const rhoEl = document.getElementById('rho') as HTMLInputElement
const betaEl = document.getElementById('beta') as HTMLInputElement
const gateEl = document.getElementById('gate') as HTMLInputElement
const audioBtn = document.getElementById('audio') as HTMLButtonElement

let W = 0, H = 0, DPR = 1
let sigma = 10, rho = 28, beta = 2.667, gate = 0.06

type P = { x: number; y: number; z: number }
let p: P = { x: 0.1, y: 0, z: 20 }
const trail: P[] = []
const TRAIL = 900

function resize() {
  DPR = Math.min(devicePixelRatio || 1, 2)
  W = innerWidth; H = innerHeight
  canvas.width = Math.floor(W * DPR); canvas.height = Math.floor(H * DPR)
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
  ctx.fillStyle = '#0a0c0d'; ctx.fillRect(0, 0, W, H)
}

function deriv(q: P, o: P) {
  o.x = sigma * (q.y - q.x)
  o.y = q.x * (rho - q.z) - q.y
  o.z = q.x * q.y - beta * q.z
}
const k1: P = { x: 0, y: 0, z: 0 }, k2: P = { x: 0, y: 0, z: 0 }, k3: P = { x: 0, y: 0, z: 0 }, k4: P = { x: 0, y: 0, z: 0 }, tmp: P = { x: 0, y: 0, z: 0 }
function step(dt: number) {
  deriv(p, k1)
  tmp.x = p.x + k1.x * dt / 2; tmp.y = p.y + k1.y * dt / 2; tmp.z = p.z + k1.z * dt / 2; deriv(tmp, k2)
  tmp.x = p.x + k2.x * dt / 2; tmp.y = p.y + k2.y * dt / 2; tmp.z = p.z + k2.z * dt / 2; deriv(tmp, k3)
  tmp.x = p.x + k3.x * dt; tmp.y = p.y + k3.y * dt; tmp.z = p.z + k3.z * dt; deriv(tmp, k4)
  p.x += dt / 6 * (k1.x + 2 * k2.x + 2 * k3.x + k4.x)
  p.y += dt / 6 * (k1.y + 2 * k2.y + 2 * k3.y + k4.y)
  p.z += dt / 6 * (k1.z + 2 * k2.z + 2 * k3.z + k4.z)
  trail.push({ x: p.x, y: p.y, z: p.z })
  if (trail.length > TRAIL) trail.shift()
}

// --- audio: osc + lowpass, pitch/gain dari atraktor ---
let ac: AudioContext | null = null
let osc: OscillatorNode | null = null
let osc2: OscillatorNode | null = null
let filt: BiquadFilterNode | null = null
let g1: GainNode | null = null
let g2: GainNode | null = null
let master: GainNode | null = null
const NOTE = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24, 27, 29, 31, 34, 36]
let base = 55

function audioOn() {
  if (!ac) {
    ac = new AudioContext()
    master = ac.createGain(); master.gain.value = 0.0; master.connect(ac.destination)
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
  master!.gain.linearRampToValueAtTime(0.0, ac.currentTime + 0.3)
  audioBtn.textContent = '○ audio OFF'
}

function noteFromZ(): number {
  // z (0..50) → indeks nada
  const idx = Math.max(0, Math.min(NOTE.length - 1, Math.round(p.z / 50 * NOTE.length)))
  return base * Math.pow(2, NOTE[idx] / 12)
}

function frame(_now: number) {
  const dt = 1 / 60
  step(dt)
  // nada: x→pitch, y→filter, z→nada index
  if (ac && osc && filt && g1 && g2 && osc2) {
    const f = noteFromZ()
    osc.frequency.setTargetAtTime(f, ac.currentTime, 0.01)
    osc2.frequency.setTargetAtTime(f * 1.5, ac.currentTime, 0.01)
    filt.frequency.setTargetAtTime(200 + Math.abs(p.y) * 90, ac.currentTime, 0.02)
    const vel = Math.max(0, Math.min(1, (p.x + 20) / 40))
    g1.gain.setTargetAtTime(0.2 + vel * 0.5, ac.currentTime, 0.03)
    g2.gain.setTargetAtTime(0.1 + vel * 0.3, ac.currentTime, 0.03)
  }
  // gambar
  ctx.fillStyle = 'rgba(10,12,13,0.06)'; ctx.fillRect(0, 0, W, H)
  const s = Math.min(W, H) / 60
  const cx = W / 2, cy = H / 2
  for (let i = 0; i < trail.length; i++) {
    const q = trail[i]
    const sx = cx + q.x * s, sy = cy + q.y * s * 0.7 - q.z * s * 0.25
    if (sx < 0 || sx > W || sy < 0 || sy > H) continue
    const a = i / trail.length
    ctx.fillStyle = `rgba(127,185,143,${(a * 0.7).toFixed(3)})`
    ctx.fillRect(sx, sy, 1.6, 1.6)
  }
  // penanda posisi kini
  ctx.fillStyle = '#f0c46a'
  ctx.fillRect(cx + p.x * s - 2, cy + p.y * s * 0.7 - p.z * s * 0.25 - 2, 4, 4)
  stat.textContent = `x ${p.x.toFixed(1)} y ${p.y.toFixed(1)} z ${p.z.toFixed(1)} · nada ${noteFromZ().toFixed(1)} Hz`
  requestAnimationFrame(frame)
}

// keyboard: tekan tombol nada → set base pitch (alih-alih mouse)
const KEYMAP: Record<string, number> = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15 }
function renderKeys() {
  keysEl.innerHTML = ''
  for (const [k, i] of Object.entries(KEYMAP)) {
    const b = document.createElement('button')
    b.textContent = k
    b.className = 'key'
    b.onclick = () => { base = 55 * Math.pow(2, i / 12); flash(b) }
    keysEl.appendChild(b)
  }
}
function flash(b: HTMLElement) { b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 120) }

sigmaEl.oninput = () => { sigma = Number(sigmaEl.value); sync() }
rhoEl.oninput = () => { rho = Number(rhoEl.value); sync() }
betaEl.oninput = () => { beta = Number(betaEl.value); sync() }
gateEl.oninput = () => { gate = Number(gateEl.value); sync() }
audioBtn.onclick = () => { if (!ac) audioOn(); else if (master && master.gain.value > 0.02) audioOff(); else audioOn() }
function sync() {
  ;(document.getElementById('s-v') as HTMLSpanElement).textContent = sigma.toFixed(1)
  ;(document.getElementById('r-v') as HTMLSpanElement).textContent = rho.toFixed(1)
  ;(document.getElementById('b-v') as HTMLSpanElement).textContent = beta.toFixed(3)
  ;(document.getElementById('g-v') as HTMLSpanElement).textContent = gate.toFixed(2)
}
addEventListener('resize', resize)
resize(); renderKeys(); sync()
requestAnimationFrame(frame)
