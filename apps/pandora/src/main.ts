/**
 * PANDORA 樸 — implementasi mandiri.
 * Kubus 3D 6 sisi (warna), klik sisi di peta → putar muka; studio light + tracks audio.
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
const lightEl = document.getElementById('light') as HTMLInputElement
const trackEl = document.getElementById('track') as HTMLSelectElement
const playBtn = document.getElementById('play') as HTMLButtonElement
const mapEl = document.getElementById('map') as HTMLDivElement

const SIZE = 3
const GAP = 0.08
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.setClearColor(0x0a0908)
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 100)
camera.position.set(0, 3.2, 7.5)
camera.lookAt(0, 0, 0)

// studio light
const spot = new THREE.SpotLight(0xfff1d6, 30, 40, 0.5, 0.45, 1.1)
spot.position.set(4, 7, 5)
scene.add(spot)
const amb = new THREE.AmbientLight(0x3a332c, 1.1)
scene.add(amb)
const fill = new THREE.DirectionalLight(0x8fb6d6, 0.5)
fill.position.set(-5, 3, -4)
scene.add(fill)
const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff1d6, transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide })
const beam = new THREE.Mesh(new THREE.ConeGeometry(2.6, 12, 20, 1, true), beamMat)
beam.position.set(4, 7, 5)
beam.rotation.z = 0.62
scene.add(beam)

// --- kubus ---
type Face = 'U' | 'D' | 'L' | 'R' | 'F' | 'B'
const COLORS: Record<Face, number> = { U: 0xf5f2ea, D: 0xf0c46a, L: 0xe07a4f, R: 0x3f6fd6, F: 0x4fae6f, B: 0xd63f3f }
const tiles: THREE.Mesh[] = []
const cubeGroup = new THREE.Group()
scene.add(cubeGroup)
const tileGeo = new THREE.BoxGeometry(1, 1, 1)
const stickerGeo = new THREE.PlaneGeometry(0.82, 0.82)
function axisOf(f: Face): THREE.Vector3 {
  return f === 'U' ? new THREE.Vector3(0, 1, 0) : f === 'D' ? new THREE.Vector3(0, -1, 0)
    : f === 'L' ? new THREE.Vector3(-1, 0, 0) : f === 'R' ? new THREE.Vector3(1, 0, 0)
    : f === 'F' ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 0, -1)
}
function buildCube() {
  cubeGroup.clear(); tiles.length = 0
  const span = (SIZE - 1) / 2
  for (let x = 0; x < SIZE; x++) for (let y = 0; y < SIZE; y++) for (let z = 0; z < SIZE; z++) {
    const px = (x - span) * (1 + GAP), py = (y - span) * (1 + GAP), pz = (z - span) * (1 + GAP)
    const core = new THREE.Mesh(tileGeo, new THREE.MeshPhysicalMaterial({ color: 0x14110e, roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.9 }))
    core.position.set(px, py, pz)
    core.userData.home = new THREE.Vector3(px, py, pz)
    core.userData.faces = []
    cubeGroup.add(core); tiles.push(core)
    const faces: Face[] = []
    if (x === SIZE - 1) faces.push('R')
    if (x === 0) faces.push('L')
    if (y === SIZE - 1) faces.push('U')
    if (y === 0) faces.push('D')
    if (z === SIZE - 1) faces.push('F')
    if (z === 0) faces.push('B')
    for (const f of faces) {
      const st = new THREE.Mesh(stickerGeo, new THREE.MeshStandardMaterial({ color: COLORS[f], roughness: 0.25, metalness: 0.05, emissive: COLORS[f], emissiveIntensity: 0.12 }))
      const n = axisOf(f)
      st.position.copy(n.clone().multiplyScalar(0.5 + 0.002))
      st.lookAt(n.clone().multiplyScalar(2))
      core.add(st)
      core.userData.faces.push(f)
    }
  }
}
buildCube()

// peta sisi 2D (klik = pilih muka)
function buildMap() {
  mapEl.innerHTML = ''
  const faces: Face[] = ['U', 'L', 'F', 'R', 'B', 'D']
  for (const f of faces) {
    const b = document.createElement('button')
    b.className = 'face'; b.dataset.face = f
    b.textContent = f
    b.style.background = '#' + COLORS[f].toString(16).padStart(6, '0')
    if (f === 'U') b.style.color = '#222'
    b.onclick = () => twist(f)
    mapEl.appendChild(b)
  }
}

// --- mekanisme putar muka ---
const moving = new THREE.Group()
scene.add(moving)
let moves = 0, history: { face: Face; dir: number }[] = []
let selected: Face = 'F'
function twist(face: Face, dir = 1) {
  const n = axisOf(face)
  const layer = tiles.filter(t => Math.abs(t.position.clone().sub(n.clone().multiplyScalar(n.dot(t.position))).length()) < 0.01)
  const sel = layer.length ? layer : tiles
  moving.rotation.set(0, 0, 0)
  // detach
  const detach = sel.map(t => t)
  for (const t of detach) { cubeGroup.remove(t); moving.add(t); t.position.copy(t.userData.home) }
  moving.quaternion.setFromAxisAngle(n, 0)
  const anim = { t: 0 }
  function animStep() {
    anim.t += 0.08
    const ang = Math.min(Math.PI / 2, anim.t * (Math.PI / 2))
    moving.quaternion.setFromAxisAngle(n, dir * ang)
    if (anim.t < 1) { requestAnimationFrame(animStep); return }
    moving.quaternion.setFromAxisAngle(n, dir * Math.PI / 2)
    for (const t of detach) {
      moving.remove(t)
      t.applyMatrix4(new THREE.Matrix4().makeRotationAxis(n, dir * Math.PI / 2))
      t.position.round()
      cubeGroup.add(t)
      t.userData.home = t.position.clone()
    }
    moving.rotation.set(0, 0, 0)
    moves++
    history.push({ face, dir })
    movesEl.textContent = String(moves)
    msgEl.textContent = `muka ${face} ${dir > 0 ? 'searah' : 'berlawanan'} jarum jam · ${sel.length} ubin`
    blip(face)
    checkSolved()
  }
  animStep()
}
function checkSolved() {
  const faces: Face[] = ['U', 'D', 'L', 'R', 'F', 'B']
  let flat = true
  for (const f of faces) {
    const n = axisOf(f)
    const d = n.clone().multiplyScalar((SIZE - 1) * (1 + GAP))
    const cells: THREE.Vector3[] = []
    for (const tile of tiles) {
      if (Math.abs(tile.userData.home.dot(n) - d.dot(n)) < 0.01) cells.push(tile.userData.home)
    }
    const cols = new Set<number>()
    for (const tile of tiles) {
      if (!cells.some(c => c.equals(tile.userData.home))) continue
      for (const st of tile.children) {
        const mesh = st as THREE.Mesh
        if (mesh.geometry !== stickerGeo) continue
        const world = st.position.clone().normalize().applyQuaternion(tile.quaternion)
        if (world.dot(n) > 0.99) cols.add((mesh.material as THREE.MeshStandardMaterial).color.getHex())
      }
    }
    if (cols.size > 1) { flat = false; break }
  }
  if (flat && moves > 0) { msgEl.textContent = '✔ SEMUA MUKA RATA'; win() }
  else if (moves > 0) msgEl.textContent = `belum rata · ${moves} langkah`
}
function scramble() {
  const faces: Face[] = ['U', 'D', 'L', 'R', 'F', 'B']
  let i = 0
  const n = 24
  const iv = setInterval(() => {
    if (i >= n) { clearInterval(iv); return }
    const f = faces[Math.floor(Math.random() * faces.length)]
    twist(f, Math.random() > 0.5 ? 1 : -1)
    i++
  }, 90)
  msgEl.textContent = `acak ${n} putaran…`
}
function undo() {
  const last = history.pop()
  if (!last) { msgEl.textContent = 'tidak ada langkah'; return }
  twist(last.face, -last.dir)
  history.pop() // twist menambah riwayat; buang
  moves = Math.max(0, moves - 1)
  movesEl.textContent = String(moves)
}
function solve() {
  msgEl.textContent = 'menyelesaikan…'
  let i = history.length - 1
  const iv = setInterval(() => {
    if (i < 0) { clearInterval(iv); msgEl.textContent = 'selesai'; return }
    const h = history[i]
    twist(h.face, -h.dir)
    history.pop(); history.pop()
    i--
  }, 220)
}

// --- audio ---
let ac: AudioContext | null = null, master: GainNode | null = null, playing = false, beat = 0
const TRACKS: Record<string, { bpm: number; seq: number[]; kick: number[] }> = {
  kosong: { bpm: 90, seq: [], kick: [] },
  'track 1': { bpm: 84, seq: [0, 3, 7, 10, 12, 10, 7, 3], kick: [1, 0, 0, 0, 1, 0, 0, 1] },
  'track 2': { bpm: 100, seq: [5, 5, 7, 7, 10, 10, 12, 10], kick: [1, 0, 1, 0, 1, 0, 1, 0] },
  'track 3': { bpm: 72, seq: [0, 12, 0, 12, 3, 15, 3, 15], kick: [1, 0, 0, 1, 0, 0, 1, 0] },
}
function ensureAudio() { if (!ac) { ac = new AudioContext(); master = ac.createGain(); master.gain.value = 0.25; master.connect(ac.destination) } ac.resume() }
function blip(face: Face) {
  if (!ac) return
  const f = 160 * Math.pow(2, ['U', 'D', 'L', 'R', 'F', 'B'].indexOf(face) / 6)
  const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = f
  const g = ac.createGain(); g.gain.setValueAtTime(0.35, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25)
  o.connect(g); g.connect(master!); o.start(); o.stop(ac.currentTime + 0.3)
}
function win() { if (!ac || !master) return; const ctx = ac; const out = master; [523, 659, 784, 1046].forEach((f, i) => { const o = ctx.createOscillator(); o.frequency.value = f; const g = ctx.createGain(); g.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.12); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4); o.connect(g); g.connect(out); o.start(ctx.currentTime + i * 0.12); o.stop(ctx.currentTime + i * 0.12 + 0.45) }) }
function tick() {
  if (!ac || !playing) return
  const t = TRACKS[trackEl.value] || TRACKS['track 1']
  const s = beat % 8
  if (t.kick[s]) { const o = ac.createOscillator(); o.frequency.setValueAtTime(110, ac.currentTime); o.frequency.exponentialRampToValueAtTime(36, ac.currentTime + 0.12); const g = ac.createGain(); g.gain.setValueAtTime(0.8, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2); o.connect(g); g.connect(master!); o.start(); o.stop(ac.currentTime + 0.22) }
  if (t.seq[s] !== undefined) { const o = ac.createOscillator(); o.type = 'square'; o.frequency.value = 220 * Math.pow(2, t.seq[s] / 12); const g = ac.createGain(); g.gain.setValueAtTime(0.12, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3); o.connect(g); g.connect(master!); o.start(); o.stop(ac.currentTime + 0.32) }
  beat++
  setTimeout(tick, (60 / t.bpm) * 1000)
}

// --- kontrol ---
scrambleBtn.onclick = () => { ensureAudio(); moves = 0; history = []; movesEl.textContent = '0'; scramble() }
undoBtn.onclick = () => { ensureAudio(); undo() }
solveBtn.onclick = () => { ensureAudio(); solve() }
playBtn.onclick = () => { ensureAudio(); playing = !playing; playBtn.textContent = playing ? '■ stop' : '▶ play'; if (playing) { beat = 0; tick() } }
lightEl.oninput = () => {
  const v = Number(lightEl.value)
  spot.intensity = 4 + v * 60
  beamMat.opacity = 0.02 + v * 0.12
  ;(document.getElementById('light-v') as HTMLSpanElement).textContent = v.toFixed(2)
}
mapEl.addEventListener('mouseover', e => {
  const b = (e.target as HTMLElement).closest('.face') as HTMLElement | null
  if (!b) return
  const f = b.dataset.face as Face
  if (f !== selected) { selected = f; stat.textContent = `muka terpilih ${f} · klik untuk memutar` }
})

// orbit sederhana
let drag = false, px = 0, py = 0
addEventListener('pointerdown', e => { drag = true; px = e.clientX; py = e.clientY })
addEventListener('pointerup', () => { drag = false })
addEventListener('pointermove', e => {
  if (!drag) return
  cubeGroup.rotation.y += (e.clientX - px) * 0.006
  cubeGroup.rotation.x += (e.clientY - py) * 0.004
  px = e.clientX; py = e.clientY
})

function resize() { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight) }
addEventListener('resize', resize)
buildMap(); resize()
stat.textContent = `klik muka di peta / kubus · 6 sisi · ${tiles.length} ubin`
requestAnimationFrame(function loop() {
  beam.rotation.y += 0.003
  renderer.render(scene, camera)
  requestAnimationFrame(loop)
})
