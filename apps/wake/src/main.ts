/**
 * WAKE 森 — implementasi mandiri.
 * Hutan point cloud; sentuh benda (pohon/batu/cahaya) → bunyi + sequencer 8 langkah.
 * Tidak ada kode/aset/teks dari be-of-dao.
 */
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

const canvas = document.getElementById('c') as HTMLCanvasElement
const stat = document.getElementById('stat') as HTMLSpanElement
const stepEl = document.getElementById('step') as HTMLDivElement
const bpmEl = document.getElementById('bpm') as HTMLInputElement
const regenBtn = document.getElementById('regen') as HTMLButtonElement

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.setClearColor(0x060807, 1)

const scene = new THREE.Scene()
scene.fog = new THREE.FogExp2(0x060807, 0.045)
const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 200)

scene.add(new THREE.AmbientLight(0x2e3a34, 1.5))
const moon = new THREE.DirectionalLight(0x9fd8ff, 0.9)
moon.position.set(20, 30, 10)
scene.add(moon)

// --- sequencer 8 langkah ---
const NSTEP = 8
let bpm = 92
let step = 0
const steps: boolean[] = new Array(NSTEP).fill(false)
steps[0] = true
let ac: AudioContext | null = null
let master: GainNode | null = null
let tickTimer: number | null = null

function ensureAudio() {
  if (!ac) {
    ac = new AudioContext()
    master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination)
  }
  ac.resume()
}
function blip(freq: number, dur = 0.18, type: OscillatorType = 'sine', gain = 0.35) {
  if (!ac || !master) return
  const o = ac.createOscillator(), g = ac.createGain()
  o.type = type; o.frequency.value = freq
  g.gain.setValueAtTime(gain, ac.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur)
  o.connect(g); g.connect(master); o.start(); o.stop(ac.currentTime + dur + 0.02)
}
const STEP_FREQ = [110, 0, 164.8, 0, 220, 0, 146.8, 0]
function tick() {
  if (steps[step] && STEP_FREQ[step]) blip(STEP_FREQ[step], 0.2, 'triangle', 0.3)
  step = (step + 1) % NSTEP
  renderSteps()
}
function renderSteps() {
  stepEl.innerHTML = ''
  for (let i = 0; i < NSTEP; i++) {
    const b = document.createElement('button')
    b.className = 'step' + (steps[i] ? ' on' : '') + (i === step ? ' cur' : '')
    b.textContent = String(i + 1)
    b.onclick = () => { ensureAudio(); steps[i] = !steps[i]; renderSteps(); blip(200 + i * 40, 0.1, 'sine', 0.2) }
    stepEl.appendChild(b)
  }
}
function startStop() {
  void 0
  ;(window as unknown as { startStop: () => void }).startStop = startStop
  ;(document.getElementById('play') as HTMLButtonElement).onclick = startStop
  ensureAudio()
  if (tickTimer !== null) { clearInterval(tickTimer); tickTimer = null; return }
  tickTimer = window.setInterval(tick, 60000 / bpm / 2)
  blip(440, 0.1, 'square', 0.2)
}
bpmEl.oninput = () => {
  bpm = Number(bpmEl.value)
  ;(document.getElementById('bpm-v') as HTMLSpanElement).textContent = String(bpm)
  if (tickTimer !== null) { clearInterval(tickTimer); tickTimer = window.setInterval(tick, 60000 / bpm / 2) }
}

// --- hutan point cloud ---
const world = new THREE.Group()
scene.add(world)
let trees: THREE.Points[] = []
let lights: THREE.PointLight[] = []
let rocks: THREE.Points[] = []
const treeColors = [0x7fc9a8, 0x9fd8b8, 0x6fb898, 0xb8e0c8]

function rand(a: number, b: number) { return a + Math.random() * (b - a) }

function makeTree(x: number, z: number): THREE.Points {
  const n = 900
  const pos = new Float32Array(n * 3)
  const col = new Float32Array(n * 3)
  const c = new THREE.Color(treeColors[Math.floor(Math.random() * treeColors.length)])
  for (let i = 0; i < n; i++) {
    // batang
    if (i < n * 0.25) {
      const h = rand(0, 7)
      pos[i * 3] = x + rand(-0.15, 0.15)
      pos[i * 3 + 1] = h
      pos[i * 3 + 2] = z + rand(-0.15, 0.15)
      col[i * 3] = 0.25; col[i * 3 + 1] = 0.18; col[i * 3 + 2] = 0.12
    } else {
      // kanopi
      const a = Math.random() * Math.PI * 2
      const r = Math.pow(Math.random(), 0.5) * rand(1.5, 2.8)
      pos[i * 3] = x + Math.cos(a) * r
      pos[i * 3 + 1] = rand(6, 9)
      pos[i * 3 + 2] = z + Math.sin(a) * r
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  const m = new THREE.PointsMaterial({ size: 0.09, vertexColors: true, sizeAttenuation: true, transparent: true, opacity: 0.9 })
  const p = new THREE.Points(g, m)
  world.add(p)
  return p
}

function makeRock(x: number, z: number): THREE.Points {
  const n = 260
  const pos = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2
    const r = Math.pow(Math.random(), 0.4) * rand(0.6, 1.6)
    pos[i * 3] = x + Math.cos(a) * r
    pos[i * 3 + 1] = Math.abs(Math.sin(a)) * rand(0.1, 0.5)
    pos[i * 3 + 2] = z + Math.sin(a) * r
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const m = new THREE.PointsMaterial({ size: 0.12, color: 0x8a8f8c, sizeAttenuation: true })
  const p = new THREE.Points(g, m)
  world.add(p)
  return p
}

function regen() {
  for (const t of trees) { world.remove(t); t.geometry.dispose(); (t.material as THREE.Material).dispose() }
  for (const r of rocks) { world.remove(r); r.geometry.dispose(); (r.material as THREE.Material).dispose() }
  for (const l of lights) world.remove(l)
  trees = []; rocks = []; lights = []
  const R = 34, N = 96
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2
    const r = Math.pow(Math.random(), 0.6) * R
    trees.push(makeTree(Math.cos(a) * r, Math.sin(a) * r))
  }
  for (let i = 0; i < 22; i++) {
    const a = Math.random() * Math.PI * 2
    const r = Math.pow(Math.random(), 0.6) * R
    rocks.push(makeRock(Math.cos(a) * r, Math.sin(a) * r))
  }
  // lampu jalan: 8 titik → satu nada per langkah
  for (let i = 0; i < NSTEP; i++) {
    const a = i / NSTEP * Math.PI * 2
    const l = new THREE.PointLight(0xffd9a0, 1.2, 12)
    l.position.set(Math.cos(a) * 8, 2.2, Math.sin(a) * 8)
    world.add(l)
    lights.push(l)
  }
  stat.textContent = `${trees.length} pohon · ${rocks.length} batu · sequencer ${NSTEP} langkah`
}
regenBtn.onclick = regen
regen()

// --- kamera jalan ---
let yaw = 0, pitch = 0
let px = 0, pz = 18, py = 2.2
const keysDown = new Set<string>()
addEventListener('keydown', (e) => keysDown.add(e.key.toLowerCase()))
addEventListener('keyup', (e) => keysDown.delete(e.key.toLowerCase()))
addEventListener('pointermove', (e) => {
  if (e.buttons & 1) { yaw -= e.movementX * 0.003; pitch = Math.max(-1.2, Math.min(1.2, pitch - e.movementY * 0.003)) }
})

// --- sentuh: klik benda → bunyi + toggle langkah ---
const ray = new THREE.Raycaster()
canvas.addEventListener('click', (e) => {
  ensureAudio()
  const nd = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1)
  ray.setFromCamera(nd, camera)
  const hits = ray.intersectObjects([...trees, ...rocks], false)
  if (hits.length) {
    const h = hits[0]
    // nada dari jarak: makin dekat makin rendah
    const d = camera.position.distanceTo(h.point)
    const f = Math.max(80, Math.min(400, 1200 / (d + 1)))
    blip(f, 0.25, 'sine', 0.4)
    steps[step] = !steps[step]
    renderSteps()
    // sorot benda yang disentuh
    const m = (h.object as THREE.Points).material as THREE.PointsMaterial
    m.size = 0.2
    setTimeout(() => { m.size = 0.09 }, 140)
  }
})

function resize() {
  const w = innerWidth, h = innerHeight
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}
addEventListener('resize', resize)
resize()

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.9, 0.7, 0.2)
composer.addPass(bloom)

let last = performance.now()
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now
  // jalan
  const sp = 7 * dt
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw)
  if (keysDown.has('w') || keysDown.has('arrowup')) { px += fx * sp; pz += fz * sp }
  if (keysDown.has('s') || keysDown.has('arrowdown')) { px -= fx * sp; pz -= fz * sp }
  if (keysDown.has('a') || keysDown.has('arrowleft')) { px += Math.cos(yaw) * sp; pz -= Math.sin(yaw) * sp }
  if (keysDown.has('d') || keysDown.has('arrowright')) { px -= Math.cos(yaw) * sp; pz += Math.sin(yaw) * sp }
  // batas dunia
  const rr = Math.hypot(px, pz)
  if (rr > 40) { px *= 40 / rr; pz *= 40 / rr }
  camera.position.set(px, py, pz)
  camera.rotation.set(pitch, yaw, 0, 'YXZ')
  // napas lampu
  const t = now / 1000
  lights.forEach((l, i) => { l.intensity = 0.9 + Math.sin(t * 2 + i) * 0.35 })
  composer.render()
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)

renderSteps()

void startStop
