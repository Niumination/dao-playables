/**
 * WAKE 森 — implementasi mandiri.
 * Hutan prosedural (batang + kanopi) + post-processing bloom.
 * Tidak ada kode/aset/teks dari be-of-dao; hanya mekanisme "procedural trees + bloom".
 */
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

const canvas = document.getElementById('c') as HTMLCanvasElement
const stat = document.getElementById('stat') as HTMLSpanElement
const bloomEl = document.getElementById('bloom') as HTMLInputElement
const treesEl = document.getElementById('trees') as HTMLInputElement
const windEl = document.getElementById('wind') as HTMLInputElement
const rotEl = document.getElementById('rot') as HTMLInputElement
const regenBtn = document.getElementById('regen') as HTMLButtonElement

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.setClearColor(0x060807, 1)

const scene = new THREE.Scene()
scene.fog = new THREE.FogExp2(0x060807, 0.055)

const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 120)
camera.position.set(0, 2.2, 7)
camera.lookAt(0, 1.2, 0)

scene.add(new THREE.AmbientLight(0x2e3a34, 1.6))
const moon = new THREE.DirectionalLight(0x9fc9b8, 2.2)
moon.position.set(-4, 6, 3)
scene.add(moon)
const glow = new THREE.PointLight(0x7fc9a8, 22, 16)
glow.position.set(0, 1.2, 0)
scene.add(glow)

// ground
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(18, 48).rotateX(-Math.PI / 2),
  new THREE.MeshStandardMaterial({ color: 0x121a16, roughness: 0.95 }),
)
scene.add(ground)

// --- hutan prosedural: batang (cylinder) + kanopi (icosahedron) ---
let forest = new THREE.Group()
scene.add(forest)

let bloomStrength = 1.4
let treeDensity = 0.8
let wind = 0.5
let rotSpeed = 0.2
let seed = 3.0

function rand(): number {
  // LCG sederhana supaya regenerasi deterministik per seed
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}

function buildForest() {
  scene.remove(forest)
  forest = new THREE.Group()
  const n = Math.floor(120 * treeDensity)
  const trunkGeo = new THREE.CylinderGeometry(0.06, 0.1, 1, 6)
  const canopyGeo = new THREE.IcosahedronGeometry(0.5, 0)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3a2f28, roughness: 0.9 })
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0x2f7a5a,
    emissive: 0x144a35,
    emissiveIntensity: 0.35,
    roughness: 0.7,
    flatShading: true,
  })
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2
    const r = 1.2 + rand() * 9
    const s = 0.5 + rand() * 1.3
    const h = (1.0 + rand() * 1.6) * s
    const trunk = new THREE.Mesh(trunkGeo, trunkMat)
    trunk.scale.set(1, h, 1)
    trunk.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r)
    const canopy = new THREE.Mesh(canopyGeo, canopyMat)
    canopy.position.set(trunk.position.x, h + 0.35 * s, trunk.position.z)
    canopy.scale.setScalar(0.8 + rand() * 1.1)
    canopy.userData.phase = rand() * Math.PI * 2
    forest.add(trunk, canopy)
  }
  scene.add(forest)
}

// --- post-processing: bloom ---
const composer = new EffectComposer(renderer)
const renderPass = new RenderPass(scene, camera)
composer.addPass(renderPass)
const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), bloomStrength, 0.85, 0.25)
composer.addPass(bloomPass)

function resize() {
  const w = innerWidth, h = innerHeight
  renderer.setSize(w, h, false)
  composer.setSize(w, h)
  bloomPass.setSize(w, h)
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
  bloomPass.strength = bloomStrength * (0.9 + Math.sin(t * 0.5) * 0.1)

  // goyangan kanopi (angin)
  const canopies = forest.children.filter(o => o.userData.phase !== undefined)
  for (const c of canopies) {
    c.rotation.z = Math.sin(t * 1.4 + c.userData.phase) * wind * 0.12
    c.rotation.x = Math.cos(t * 1.1 + c.userData.phase) * wind * 0.08
  }
  forest.rotation.y = t * rotSpeed * 0.15
  glow.intensity = 18 + Math.sin(t * 0.6) * 7

  composer.render()
  stat.textContent = `fps ${fps.toFixed(0)} · pohon ${canopies.length} · bloom ${bloomStrength.toFixed(2)}`
  requestAnimationFrame(frame)
}

function syncLabels() {
  ;(document.getElementById('b-v') as HTMLSpanElement).textContent = bloomStrength.toFixed(2)
  ;(document.getElementById('t-v') as HTMLSpanElement).textContent = treeDensity.toFixed(2)
  ;(document.getElementById('w-v') as HTMLSpanElement).textContent = wind.toFixed(2)
  ;(document.getElementById('r-v') as HTMLSpanElement).textContent = rotSpeed.toFixed(2)
}

bloomEl.oninput = () => { bloomStrength = Number(bloomEl.value); syncLabels() }
treesEl.oninput = () => { treeDensity = Number(treesEl.value); syncLabels(); buildForest() }
windEl.oninput = () => { wind = Number(windEl.value); syncLabels() }
rotEl.oninput = () => { rotSpeed = Number(rotEl.value); syncLabels() }
regenBtn.onclick = () => { seed = Math.random() * 1000; buildForest() }
addEventListener('resize', resize)

resize()
buildForest()
syncLabels()
requestAnimationFrame(frame)
