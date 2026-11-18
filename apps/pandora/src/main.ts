/**
 * PANDORA 樸 — implementasi mandiri.
 * Permukaan 3D generatif dari medan noise (Three.js), kamera orbit pelan.
 * Tidak ada kode/aset/teks dari be-of-dao; hanya mekanisme "generative 3D scene".
 */
import * as THREE from 'three'

const canvas = document.getElementById('c') as HTMLCanvasElement
const stat = document.getElementById('stat') as HTMLSpanElement
const densEl = document.getElementById('dens') as HTMLInputElement
const rotEl = document.getElementById('rot') as HTMLInputElement
const scaleEl = document.getElementById('scale') as HTMLInputElement
const regenBtn = document.getElementById('regen') as HTMLButtonElement

// --- scene dasar ---
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.setClearColor(0x08090b, 1)

const scene = new THREE.Scene()
scene.fog = new THREE.FogExp2(0x08090b, 0.09)

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100)
camera.position.set(0, 1.1, 3.2)
camera.lookAt(0, 0, 0)

// cahaya: titik ungu lembut + ambient tipis
const key = new THREE.PointLight(0xb08fc9, 18, 20)
key.position.set(2.5, 3, 2.5)
scene.add(key)
const fill = new THREE.PointLight(0x4a6a8a, 8, 20)
fill.position.set(-3, -1, 2)
scene.add(fill)
scene.add(new THREE.AmbientLight(0x2a2430, 1.4))

// --- medan noise sederhana (value noise 2D + smoothing), dipakai utk tinggi permukaan ---
function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}
function smoothNoise(x: number, y: number): number {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1)
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v
}
function fbm(x: number, y: number, oct = 4): number {
  let sum = 0, amp = 0.5, f = 1
  for (let i = 0; i < oct; i++) {
    sum += amp * smoothNoise(x * f, y * f)
    amp *= 0.5; f *= 2
  }
  return sum
}

let mesh: THREE.Mesh | null = null
let geo: THREE.BufferGeometry | null = null
let dens = 0.9
let rotSpeed = 0.25
let scaleV = 1.0
let seed = 1.0

function build() {
  if (mesh) { scene.remove(mesh); geo?.dispose() }
  const seg = 110
  geo = new THREE.PlaneGeometry(3.4, 3.4, seg, seg)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i)
    const h = fbm(x * 1.1 + seed, z * 1.1 - seed, 5)
    pos.setY(i, (h - 0.5) * dens * 1.4)
  }
  geo.computeVertexNormals()
  const mat = new THREE.MeshStandardMaterial({
    color: 0x8a7fa8,
    metalness: 0.25,
    roughness: 0.55,
    flatShading: true,
    side: THREE.DoubleSide,
  })
  mesh = new THREE.Mesh(geo, mat)
  scene.add(mesh)
}

function resize() {
  const w = innerWidth, h = innerHeight
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}

let frameCounter = 0, fps = 0, lastFpsT = performance.now(), last = lastFpsT
let t = 0

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
  t += 1 / 60
  if (mesh) {
    mesh.rotation.y = t * rotSpeed * 0.4
    mesh.rotation.x = Math.sin(t * 0.18) * 0.06
    const s = scaleV * (1 + Math.sin(t * 0.4) * 0.02)
    mesh.scale.set(s, s, s)
    key.intensity = 16 + Math.sin(t * 0.7) * 5
  }
  renderer.render(scene, camera)
  stat.textContent = `fps ${fps.toFixed(0)} · butir ${geo ? (geo.attributes.position as THREE.BufferAttribute).count : 0} · skala ${scaleV.toFixed(2)}`
  requestAnimationFrame(frame)
}

function syncLabels() {
  ;(document.getElementById('d-v') as HTMLSpanElement).textContent = dens.toFixed(2)
  ;(document.getElementById('r-v') as HTMLSpanElement).textContent = rotSpeed.toFixed(2)
  ;(document.getElementById('s-v') as HTMLSpanElement).textContent = scaleV.toFixed(2)
}

densEl.oninput = () => { dens = Number(densEl.value); syncLabels(); build() }
rotEl.oninput = () => { rotSpeed = Number(rotEl.value); syncLabels() }
scaleEl.oninput = () => { scaleV = Number(scaleEl.value); syncLabels() }
regenBtn.onclick = () => { seed = Math.random() * 100; build() }
addEventListener('resize', resize)

resize()
build()
syncLabels()
requestAnimationFrame(frame)
