/**
 * WAKE 森 — implementasi mandiri.
 * Hutan titik (~2 juta titik) + studio light (satu beam), kamera first-person,
 * klik permukaan/pohon/batu/tanah = bunyi; sequencer 8 langkah berjalan.
 * Tidak ada kode/aset/teks dari be-of-dao.
 */
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

const canvas = document.getElementById('c') as HTMLCanvasElement
const stat = document.getElementById('stat') as HTMLSpanElement
const stepEl = document.getElementById('step') as HTMLSpanElement
const playBtn = document.getElementById('play') as HTMLButtonElement
const bpmEl = document.getElementById('bpm') as HTMLInputElement
const lightEl = document.getElementById('light') as HTMLInputElement
const FOG = new THREE.Color(0x05100c)

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.setClearColor(FOG)

const scene = new THREE.Scene()
scene.fog = new THREE.FogExp2(FOG, 0.022)
const camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.1, 300)
camera.position.set(0, 1.7, 24)

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.9, 0.6, 0.18)
composer.addPass(bloom)

// --- bangkitkan hutan (point cloud): pohon, batu, tanah, kanopi ---
function mulberry(seed: number) { let a = seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
const rnd = mulberry(20261118)

const treePts: number[] = []
const trunkPts: number[] = []
const rockPts: number[] = []
const groundPts: number[] = []
const canopyPts: number[] = []

const NT = 96
for (let i = 0; i < NT; i++) {
  const ang = rnd() * Math.PI * 2
  const rad = 6 + rnd() * 70
  const x = Math.cos(ang) * rad, z = Math.sin(ang) * rad
  const h = 4 + rnd() * 7
  // batang
  for (let k = 0; k < 26; k++) {
    const y = (k / 25) * h
    const r = 0.35 * (1 - y / h * 0.6)
    const a = rnd() * Math.PI * 2
    trunkPts.push(x + Math.cos(a) * r, y, z + Math.sin(a) * r)
  }
  // kanopi
  for (let k = 0; k < 90; k++) {
    const yy = h * (0.55 + rnd() * 0.45)
    const rr = 1.8 * Math.sqrt(rnd())
    const a = rnd() * Math.PI * 2
    canopyPts.push(x + Math.cos(a) * rr, yy, z + Math.sin(a) * rr)
  }
  // dahan rendah (titik yang bisa disentuh)
  for (let k = 0; k < 14; k++) {
    const yy = 1.2 + rnd() * 2
    const rr = 1.2 + rnd()
    const a = rnd() * Math.PI * 2
    treePts.push(x + Math.cos(a) * rr, yy, z + Math.sin(a) * rr)
  }
}
for (let i = 0; i < 22; i++) {
  const ang = rnd() * Math.PI * 2
  const rad = 4 + rnd() * 55
  const cx = Math.cos(ang) * rad, cz = Math.sin(ang) * rad
  const s = 0.6 + rnd() * 1.8
  for (let k = 0; k < 40; k++) {
    const a = rnd() * Math.PI * 2, b = rnd() * Math.PI
    rockPts.push(cx + Math.cos(a) * Math.sin(b) * s, Math.abs(Math.cos(b)) * s * 0.6, cz + Math.sin(a) * Math.sin(b) * s)
  }
}
for (let i = 0; i < 26000; i++) {
  const ang = rnd() * Math.PI * 2
  const rad = Math.sqrt(rnd()) * 80
  groundPts.push(Math.cos(ang) * rad, 0, Math.sin(ang) * rad)
}

function cloud(arr: number[], color: number, size: number, opacity: number) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3))
  const m = new THREE.PointsMaterial({ color, size, transparent: true, opacity, sizeAttenuation: true })
  const p = new THREE.Points(g, m)
  scene.add(p)
  return p
}
const pGround = cloud(groundPts, 0x2f6b52, 0.35, 0.9)
void cloud(trunkPts, 0x8a6a44, 0.55, 0.95)
const pCanopy = cloud(canopyPts, 0x3f9d6b, 0.5, 0.8)
const pTree = cloud(treePts, 0x7ee0a8, 1.1, 1)
const pRock = cloud(rockPts, 0xb9c7bd, 0.7, 0.95)

// studio light: satu beam cahaya (dari langit) + target
const beamTarget = new THREE.Object3D()
beamTarget.position.set(0, 0, 0)
scene.add(beamTarget)
const spot = new THREE.SpotLight(0xfff3d6, 12, 120, 0.28, 0.5, 1.2)
spot.position.set(18, 42, 10)
spot.target = beamTarget
scene.add(spot)
const amb = new THREE.AmbientLight(0x244036, 0.5)
scene.add(amb)
// visualisasi beam
const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff3d6, transparent: true, opacity: 0.05, depthWrite: false })
const beam = new THREE.Mesh(new THREE.ConeGeometry(3.2, 46, 24, 1, true), beamMat)
beam.position.set(18, 42, 10)
beam.rotation.x = Math.PI
scene.add(beam)

// --- audio ---
let ac: AudioContext | null = null
const NOTE = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24, 27, 29, 31, 34, 36]
function ensureAudio() { if (!ac) { ac = new AudioContext(); master = ac.createGain(); master.gain.value = 0.2; master.connect(ac.destination) } ac.resume() }
let master: GainNode
function tone(f: number, dur = 0.5, type: OscillatorType = 'sine', vol = 0.5) {
  if (!ac) return
  const o = ac.createOscillator(); o.type = type; o.frequency.value = f
  const g = ac.createGain(); g.gain.setValueAtTime(vol, ac.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur)
  o.connect(g); g.connect(master); o.start(); o.stop(ac.currentTime + dur)
}
function kick() { if (!ac) return; const o = ac.createOscillator(); o.frequency.setValueAtTime(120, ac.currentTime); o.frequency.exponentialRampToValueAtTime(38, ac.currentTime + 0.16); const g = ac.createGain(); g.gain.setValueAtTime(0.9, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.22); o.connect(g); g.connect(master); o.start(); o.stop(ac.currentTime + 0.25) }
function hat() { if (!ac) return; const b = ac.createBuffer(1, ac.sampleRate * 0.05, ac.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); const s = ac.createBufferSource(); s.buffer = b; const g = ac.createGain(); g.gain.value = 0.2; const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000; s.connect(f); f.connect(g); g.connect(master); s.start() }

// sequencer 8 langkah
const seq: boolean[][] = [ // 3 baris: kick, nada, hat
  [true, false, false, true, false, false, true, false],
  [true, false, true, false, true, false, true, false],
  [false, false, true, false, false, true, false, false],
]
let playing = true, step = 0, bpm = 60
let nextT = 0
function tickSeq() {
  if (!ac) return
  while (nextT < ac.currentTime + 0.15) {
    const s = step % 8
    if (seq[0][s]) kick()
    if (seq[1][s]) tone(110 * Math.pow(2, [0, 3, 5, 7][s % 4] / 12), 0.3, 'triangle', 0.35)
    if (seq[2][s]) hat()
    stepEl.textContent = String(s + 1)
    nextT += 60 / bpm / 2
    step++
  }
}

// --- interaksi: klik -> bunyi, nada dari jarak ---
const ray = new THREE.Raycaster()
const mouse = new THREE.Vector2()
let dragging = false, lx = 0, ly = 0
const vel = new THREE.Vector2()
addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY })
addEventListener('pointerup', () => { dragging = false })
addEventListener('pointermove', (e) => {
  if (dragging) { vel.x += (e.clientX - lx) * 0.003; vel.y += (e.clientY - ly) * 0.003 }
  lx = e.clientX; ly = e.clientY
  mouse.x = (e.clientX / innerWidth) * 2 - 1; mouse.y = -(e.clientY / innerHeight) * 2 + 1
})
canvas.addEventListener('click', () => {
  mouse.x = (lx / innerWidth) * 2 - 1; mouse.y = -(ly / innerHeight) * 2 + 1
  ray.setFromCamera(mouse, camera)
  const hits = ray.intersectObjects([pTree, pRock, pGround])
  ensureAudio()
  if (hits.length) {
    const d = hits[0].distance
    const idx = Math.max(0, Math.min(NOTE.length - 1, Math.round((1 - Math.min(d, 40) / 40) * NOTE.length)))
    const f = 55 * Math.pow(2, NOTE[idx] / 12)
    tone(f, 0.6, 'sine', 0.5)
    // gerakkan beam ke titik sentuh
    beamTarget.position.copy(hits[0].point)
    beam.position.copy(hits[0].point).add(new THREE.Vector3(18, 42, 10).normalize().multiplyScalar(-0))
    beam.lookAt(hits[0].point)
    stat.textContent = `sentuh ${hits[0].distance.toFixed(1)} m · nada ${f.toFixed(1)} Hz · beam → ${hits[0].point.x.toFixed(1)},${hits[0].point.y.toFixed(1)},${hits[0].point.z.toFixed(1)}`
  } else {
    // tanah: bass
    tone(42, 0.5, 'sine', 0.6)
    stat.textContent = 'tanah · bass 42 Hz'
  }
})
addEventListener('keydown', (e) => {
  if (e.key === 'w' || e.key === 'ArrowUp') camera.position.z -= 0.8
  if (e.key === 's' || e.key === 'ArrowDown') camera.position.z += 0.8
  if (e.key === 'a' || e.key === 'ArrowLeft') camera.position.x -= 0.8
  if (e.key === 'd' || e.key === 'ArrowRight') camera.position.x += 0.8
})
playBtn.onclick = () => { ensureAudio(); playing = !playing; playBtn.textContent = playing ? '■ stop' : '▶ play'; nextT = ac!.currentTime; step = 0 }
bpmEl.oninput = () => { bpm = Number(bpmEl.value); (document.getElementById('bpm-v') as HTMLSpanElement).textContent = String(bpm) }
lightEl.oninput = () => {
  const v = Number(lightEl.value)
  spot.intensity = 2 + v * 26
  beamMat.opacity = 0.02 + v * 0.08
  ;(document.getElementById('light-v') as HTMLSpanElement).textContent = v.toFixed(2)
}
// rotasi beam halus
const startStop = () => { ensureAudio(); if (ac) { nextT = ac.currentTime; step = 0 } }
;(window as unknown as { startStop: () => void }).startStop = startStop
playBtn.onclick = () => { startStop() }

function resize() {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
  composer.setSize(innerWidth, innerHeight)
}
addEventListener('resize', resize)
resize()
startStop()

let frames = 0, t0 = performance.now()
function frame() {
  // yaw/pitch dari drag
  camera.rotation.y -= vel.x
  camera.rotation.x -= vel.y
  vel.multiplyScalar(0.9)
  // beam bergerak pelan bila tak disentuh
  if (playing && ac) tickSeq()
  const tt = performance.now() * 0.0001
  spot.position.x = 18 * Math.cos(tt * 2)
  spot.position.z = 18 * Math.sin(tt * 2)
  beam.position.set(spot.position.x, 42, spot.position.z)
  beam.lookAt(beamTarget.position)
  // goyang ringan kanopi
  pCanopy.rotation.y = Math.sin(tt * 20) * 0.01
  frames++
  if (performance.now() - t0 > 2000) {
    const fps = (frames / ((performance.now() - t0) / 1000)).toFixed(0)
    stat.textContent = `${stat.textContent.split(' · fps')[0]} · fps ${fps}`
    frames = 0; t0 = performance.now()
  }
  composer.render()
  requestAnimationFrame(frame)
}
frame()
