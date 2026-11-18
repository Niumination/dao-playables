/**
 * PANDORA 樸 — implementasi mandiri.
 * Puzzle kubus 3D: 16 ubin kaca di piring, Scramble / Undo / Solve, klik sisi untuk memutar.
 * Tidak ada kode/aset/teks dari be-of-dao.
 */
import * as THREE from 'three'

const canvas = document.getElementById('c') as HTMLCanvasElement
const stat = document.getElementById('stat') as HTMLSpanElement
const movesEl = document.getElementById('moves') as HTMLSpanElement
const msgEl = document.getElementById('msg') as HTMLSpanElement
const scrambleBtn = document.getElementById('scramble') as HTMLButtonElement
const undoBtn = document.getElementById('undo') as HTMLButtonElement
const solveBtn = document.getElementById('solve') as HTMLButtonElement
const resetBtn = document.getElementById('reset') as HTMLButtonElement

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.setClearColor(0x0a0a0c, 1)

const scene = new THREE.Scene()
scene.fog = new THREE.FogExp2(0x0a0a0c, 0.06)
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
camera.position.set(0, 2.6, 4.4)
camera.lookAt(0, 0.4, 0)

const key = new THREE.PointLight(0xb08fc9, 22, 30); key.position.set(3, 4, 3); scene.add(key)
const fill = new THREE.PointLight(0x4a6a8a, 10, 30); fill.position.set(-4, 2, 2); scene.add(fill)
scene.add(new THREE.AmbientLight(0x2a2430, 1.6))

const world = new THREE.Group(); scene.add(world)
const plate = new THREE.Mesh(
  new THREE.CylinderGeometry(2.1, 2.1, 0.12, 48),
  new THREE.MeshStandardMaterial({ color: 0x1a1a20, roughness: 0.6, metalness: 0.3 }),
)
plate.position.y = -0.06
world.add(plate)
const rim = new THREE.Mesh(
  new THREE.TorusGeometry(2.1, 0.05, 8, 64),
  new THREE.MeshStandardMaterial({ color: 0x6a5a8a, roughness: 0.4, metalness: 0.6 }),
)
rim.rotation.x = Math.PI / 2
rim.position.y = 0.0
world.add(rim)

type Tile = { mesh: THREE.Mesh; home: THREE.Vector3; face: number }
const tiles: Tile[] = []
const GLASS = [0xb08fc9, 0x7fa8c9, 0xc98fa8, 0x8fc9a8]
const size = 0.46, gap = 0.04
const half = (4 * size + 3 * gap) / 2 - size / 2

function tileColor(face: number): number { return GLASS[face % GLASS.length] }

function build() {
  for (const t of tiles) { world.remove(t.mesh); t.mesh.geometry.dispose(); (t.mesh.material as THREE.Material).dispose() }
  tiles.length = 0
  let n = 0
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const face = Math.floor(n / 16 * 4)
      const g = new THREE.BoxGeometry(size, 0.08, size)
      const m = new THREE.MeshStandardMaterial({
        color: tileColor(face), roughness: 0.15, metalness: 0.1,
        transparent: true, opacity: 0.85,
        emissive: tileColor(face), emissiveIntensity: 0.15,
      })
      const mesh = new THREE.Mesh(g, m)
      const x = -half + col * (size + gap)
      const z = -half + row * (size + gap)
      mesh.position.set(x, 0.04, z)
      mesh.userData.face = face
      mesh.userData.row = row
      mesh.userData.col = col
      world.add(mesh)
      tiles.push({ mesh, home: new THREE.Vector3(x, 0.04, z), face })
      n++
    }
  }
  moves = 0; history = []
  movesEl.textContent = '0'
  msgEl.textContent = 'selaraskan 16 ubin ke satu muka'
  stat.textContent = '16 ubin · 4 muka'
}

// --- logika puzzle: tiap klik memutar 2×2 ubin di sekitarnya ---
let moves = 0
let history: { tile: Tile; from: THREE.Vector3 }[] = []
function twist(cx: number, cy: number) {
  // putar blok 2x2 di sekitar (cx,cy): ubin pada keempat kuadran ±(size+gap)/2
  const d = (size + gap) / 2
  const group = tiles.filter(t => {
    const dx = t.mesh.position.x - cx, dz = t.mesh.position.z - cy
    return Math.abs(Math.abs(dx) - d) < 0.05 && Math.abs(Math.abs(dz) - d) < 0.05
  })
  if (group.length < 4) return
  const items = group.map(t => ({ t, x: t.mesh.position.x, z: t.mesh.position.z }))
  for (const it of items) {
    // rotasi 90° searah jarum jam terhadap pusat (cx,cy)
    const dx = it.x - cx, dz = it.z - cy
    const nx = cx - dz, nz = cy + dx
    history.push({ tile: it.t, from: new THREE.Vector3(it.x, it.t.mesh.position.y, it.z) })
    it.t.mesh.position.x = nx; it.t.mesh.position.z = nz
  }
  // siklus muka: ubin yang ikut berputar berganti muka
  for (const it of items) {
    it.t.face = (it.t.face + 1) % 4
    const m = it.t.mesh.material as THREE.MeshStandardMaterial
    m.color.setHex(tileColor(it.t.face))
    m.emissive.setHex(tileColor(it.t.face))
  }
  moves++
  movesEl.textContent = String(moves)
  checkSolved()
}

function checkSolved() {
  const f = tiles[0].face
  const ok = tiles.every(t => t.face === f)
  msgEl.textContent = ok ? '✓ selesai — satu muka!' : `langkah ${moves}`
  msgEl.className = ok ? 'ok' : ''
}

function scramble() {
  const d = (size + gap) / 2
  for (let i = 0; i < 24; i++) {
    const cx = -half + Math.floor(Math.random() * 3) * (size + gap)
    const cy = -half + Math.floor(Math.random() * 3) * (size + gap)
    twist(cx + d, cy + d)
  }
  msgEl.textContent = 'acak — selesaikan!'
}

function undo() {
  const h = history.pop()
  if (!h) return
  h.tile.mesh.position.copy(h.from)
  h.tile.face = (h.tile.face + 3) % 4
  const m = h.tile.mesh.material as THREE.MeshStandardMaterial
  m.color.setHex(tileColor(h.tile.face)); m.emissive.setHex(tileColor(h.tile.face))
  moves--; movesEl.textContent = String(moves); checkSolved()
}

function solve() {
  // buat semua muka sama dengan muka ubin pertama (langkah naif: putar tiap ubin)
  while (!tiles.every(t => t.face === tiles[0].face)) {
    for (const t of tiles) {
      while (t.face !== tiles[0].face) {
        t.face = (t.face + 1) % 4
        const m = t.mesh.material as THREE.MeshStandardMaterial
        m.color.setHex(tileColor(t.face)); m.emissive.setHex(tileColor(t.face))
      }
    }
  }
  msgEl.textContent = '✓ terpecahkan'
  msgEl.className = 'ok'
}

scrambleBtn.onclick = scramble
undoBtn.onclick = undo
solveBtn.onclick = solve
resetBtn.onclick = build

// --- interaksi: klik ubin → putar 2x2 ---
const ray = new THREE.Raycaster()
canvas.addEventListener('click', (e) => {
  const nd = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1)
  ray.setFromCamera(nd, camera)
  const hit = ray.intersectObjects(tiles.map(t => t.mesh), false)
  if (hit.length) {
    const m = hit[0].object as THREE.Mesh
    const d = (size + gap) / 2
    const sx = m.position.x < 0 ? m.position.x : m.position.x - (size + gap)
    const sz = m.position.z < 0 ? m.position.z : m.position.z - (size + gap)
    twist(sx + d, sz + d)
  }
})

let yaw = 0.2
canvas.addEventListener('pointermove', (e) => {
  if (e.buttons & 1) yaw += e.movementX * 0.004
})

function resize() {
  const w = innerWidth, h = innerHeight
  renderer.setSize(w, h, false)
  camera.aspect = w / h; camera.updateProjectionMatrix()
}
addEventListener('resize', resize)
resize()
build()

function frame(now: number) {
  world.rotation.y = yaw + Math.sin(now / 6000) * 0.05
  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
