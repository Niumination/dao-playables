/**
 * CIRCUIT 電 — implementasi mandiri.
 * Workbench instrumen: 4 slot komponen di papan 2 node + 2 probe (A/B),
 * nilai drag, LFO ke Tune/Power/Damp/Level, effects Crush/Echo/Space, mainkan dari keys.
 * Tidak ada kode/aset/teks dari be-of-dao.
 */
import { MNACircuit, type Comp } from './mna'

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T
const canvas = $('#board') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const statEl = $('#stat') as HTMLSpanElement
const partEl = $('#part') as HTMLDivElement

const G = -1
type SlotKind = 'R' | 'C' | 'L' | 'V' | 'I'
let slots: SlotKind[] = ['L', 'R', 'C', 'V']
let vals: number[] = [10, 4700, 22, 1] // mH, Ω, nF, V

const KEYMAP: Record<string, number> = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15 }
const BPM = 66
let noteHz = 55

// audio
let ac: AudioContext | null = null
let master: GainNode | null = null
let crush: WaveShaperNode | null = null
let echo: DelayNode | null = null
let echoGain: GainNode | null = null
let space: ConvolverNode | null = null
let spaceGain: GainNode | null = null
let dry: GainNode | null = null

function ensureAudio() {
  if (ac) { ac.resume(); return }
  ac = new AudioContext()
  master = ac.createGain(); master.gain.value = 0.25
  crush = ac.createWaveShaper(); crush.curve = new Float32Array(256)
  echo = ac.createDelay(1); echo.delayTime.value = 60 / BPM / 2
  echoGain = ac.createGain(); echoGain.gain.value = 0.35
  space = ac.createConvolver(); space.buffer = makeIR(1.2, 2.5)
  spaceGain = ac.createGain(); spaceGain.gain.value = 0.3
  dry = ac.createGain(); dry.gain.value = 1
  crush.connect(echo); echo.connect(echoGain); echoGain.connect(master)
  crush.connect(space); space.connect(spaceGain); spaceGain.connect(master)
  crush.connect(dry); dry.connect(master)
  master.connect(ac.destination)
  applyFX()
}
function makeIR(dur: number, decay: number): AudioBuffer {
  const len = Math.floor(ac!.sampleRate * dur)
  const buf = ac!.createBuffer(2, len, ac!.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  return buf
}
function applyFX() {
  if (!ac) return
  const bits = Number(($('#crush') as HTMLInputElement).value)
  const cg = 1 / Math.pow(2, bits)
  const curve = new Float32Array(256)
  for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.round(x / cg) * cg }
  crush!.curve = curve
  const sp = Number(($('#space') as HTMLInputElement).value)
  spaceGain!.gain.value = sp
  const ec = Number(($('#echo') as HTMLInputElement).value)
  echoGain!.gain.value = ec
  ;(document.getElementById('crush-v') as HTMLSpanElement).textContent = bits.toFixed(0)
  ;(document.getElementById('echo-v') as HTMLSpanElement).textContent = ec.toFixed(2)
  ;(document.getElementById('space-v') as HTMLSpanElement).textContent = sp.toFixed(2)
}
function blip() {
  if (!ac) return
  const f = noteHz
  const o1 = ac.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = f
  const o2 = ac.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 2.01
  const o3 = ac.createOscillator(); o3.type = 'sine'; o3.frequency.value = f / 2
  const g = ac.createGain()
  g.gain.setValueAtTime(0.5, ac.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.6)
  const flt = ac.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 800 + f * 8
  o1.connect(g); o2.connect(g); o3.connect(g); g.connect(flt); flt.connect(crush!)
  o1.start(); o2.start(); o3.start()
  o1.stop(ac.currentTime + 0.7); o2.stop(ac.currentTime + 0.7); o3.stop(ac.currentTime + 0.7)
}

// --- papan: 2 node (A/B) + ground; slot di edge ---
function buildCircuit(): MNACircuit {
  const c = new MNACircuit(2)
  // slot 0: A→B, slot 1: B→G, slot 2: A→G, slot 3: A→G (generator)
  const edges: [number, number][] = [[0, 1], [1, G], [0, G], [0, G]]
  for (let i = 0; i < 4; i++) {
    const [a, b] = edges[i]
    const k = slots[i]
    const comp: Comp = { kind: k as Comp['kind'], a, b, val: vals[i] }
    if (k === 'C') comp.vPrev = 0
    if (k === 'L') comp.iPrev = 0
    c.add(comp)
  }
  return c
}

function solveProbe(): { a: number; b: number } {
  const c = buildCircuit()
  const steps = 200
  const dt = 0.02 / steps
  let va = 0, vb = 0
  for (let i = 0; i < steps; i++) {
    const r = c.solve(dt)
    va = r.v[0]; vb = r.v[1]
  }
  return { a: va, b: vb }
}

function draw() {
  const w = canvas.width, h = canvas.height
  ctx.fillStyle = '#0b0f10'; ctx.fillRect(0, 0, w, h)
  // grid
  ctx.strokeStyle = 'rgba(120,180,150,0.08)'
  for (let x = 0; x < w; x += w / 12) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
  for (let y = 0; y < h; y += h / 8) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }
  const nA = { x: w * 0.25, y: h * 0.5 }
  const nB = { x: w * 0.75, y: h * 0.5 }
  const gnd = { x: w * 0.5, y: h * 0.92 }
  const edges = [
    [nA, nB], [nB, gnd], [nA, gnd], [nA, gnd],
  ] as [typeof nA, typeof nA][]
  // edge slot
  for (let i = 0; i < 4; i++) {
    const [p1, p2] = edges[i]
    ctx.strokeStyle = 'rgba(126,224,168,0.35)'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke()
    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2
    const r = 26
    const sel = selSlot === i
    ctx.fillStyle = sel ? 'rgba(126,224,168,0.25)' : 'rgba(14,18,16,0.9)'
    ctx.strokeStyle = sel ? '#7ee0a8' : 'rgba(126,224,168,0.5)'
    ctx.lineWidth = sel ? 2 : 1
    ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.fillStyle = sel ? '#e6f2ea' : '#7ee0a8'
    ctx.font = 'bold 14px ui-monospace, monospace'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(slots[i], mx, my - 6)
    ctx.fillStyle = '#f0c46a'; ctx.font = '11px ui-monospace, monospace'
    ctx.fillText(fmtVal(slots[i], vals[i]), mx, my + 9)
  }
  // node
  for (const [n, label] of [[nA, 'A'], [nB, 'B'], [gnd, '⏚']] as [typeof nA, string][]) {
    ctx.fillStyle = '#0b0f10'; ctx.strokeStyle = 'rgba(126,224,168,0.6)'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(n.x, n.y, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.fillStyle = '#9db8a8'; ctx.font = '11px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(label, n.x, n.y - 16)
  }
  // probe
  const pr = solveProbe()
  partEl.innerHTML = `A <b>${pr.a >= 0 ? '+' : ''}${pr.a.toFixed(2)} V</b> · B <b>${pr.b >= 0 ? '+' : ''}${pr.b.toFixed(2)} V</b>`
  statEl.textContent = `nada ${noteHz.toFixed(1)} Hz · ${slots.length} parts · 2 points · BPM ${BPM}`
}

let selSlot = 0
function fmtVal(k: SlotKind, v: number): string {
  if (k === 'R') return (v / 1000).toFixed(1) + 'k'
  if (k === 'C') return v.toFixed(0) + 'n'
  if (k === 'L') return v.toFixed(0) + 'm'
  if (k === 'V') return v.toFixed(1) + 'V'
  return v.toFixed(2) + 'A'
}
const LIMITS: Record<SlotKind, [number, number]> = { R: [100, 100000], C: [1, 1000], L: [1, 100], V: [0.1, 5], I: [0.01, 1] }

// klik slot di papan
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect()
  const x = (e.clientX - rect.left) * (canvas.width / rect.width)
  const y = (e.clientY - rect.top) * (canvas.height / rect.height)
  const w = canvas.width, h = canvas.height
  const nA = { x: w * 0.25, y: h * 0.5 }, nB = { x: w * 0.75, y: h * 0.5 }, gnd = { x: w * 0.5, y: h * 0.92 }
  const edges = [[nA, nB], [nB, gnd], [nA, gnd], [nA, gnd]] as [typeof nA, typeof nA][]
  let best = -1, bd = 1e9
  for (let i = 0; i < 4; i++) {
    const mx = (edges[i][0].x + edges[i][1].x) / 2, my = (edges[i][0].y + edges[i][1].y) / 2
    const d = Math.hypot(x - mx, y - my)
    if (d < bd) { bd = d; best = i }
  }
  if (best >= 0 && bd < 34) { selSlot = best; draw(); }
})

// panel kanan: ganti jenis + slider nilai
const kindRow = $('#kinds') as HTMLDivElement
const valEl = $('#val') as HTMLInputElement
function renderPanel() {
  kindRow.innerHTML = ''
  const kinds: SlotKind[] = ['R', 'C', 'L', 'V', 'I']
  for (const k of kinds) {
    const b = document.createElement('button')
    b.className = 'chip' + (slots[selSlot] === k ? ' on' : '')
    b.textContent = k
    b.onclick = () => { slots[selSlot] = k; vals[selSlot] = defaultVal(k); syncSlider(); draw() }
    kindRow.appendChild(b)
  }
  syncSlider()
}
function defaultVal(k: SlotKind): number {
  return k === 'R' ? 4700 : k === 'C' ? 22 : k === 'L' ? 10 : k === 'V' ? 1 : 0.1
}
function syncSlider() {
  const k = slots[selSlot]
  const [lo, hi] = LIMITS[k]
  valEl.min = String(lo); valEl.max = String(hi)
  valEl.step = String((hi - lo) / 100)
  valEl.value = String(vals[selSlot])
  ;(document.getElementById('val-v') as HTMLSpanElement).textContent = fmtVal(k, vals[selSlot])
}
valEl.oninput = () => { vals[selSlot] = Number(valEl.value); ;($('#val-v') as HTMLSpanElement).textContent = fmtVal(slots[selSlot], vals[selSlot]); draw() }

// LFO
for (const id of ['lfo-tune', 'lfo-power', 'lfo-damp', 'lfo-level']) {
  const el = document.getElementById(id) as HTMLInputElement
  el.oninput = () => { (document.getElementById(id + '-v') as HTMLSpanElement).textContent = Number(el.value).toFixed(2) }
}
// effects sliders
for (const id of ['crush', 'echo', 'space']) {
  const el = document.getElementById(id) as HTMLInputElement
  el.oninput = () => applyFX()
}

// keys
const keysEl = $('#keys') as HTMLDivElement
function renderKeys() {
  keysEl.innerHTML = ''
  for (const [k, i] of Object.entries(KEYMAP)) {
    const b = document.createElement('button')
    b.className = 'key'; b.textContent = k
    b.onclick = () => { noteHz = 55 * Math.pow(2, i / 12); flash(b); ensureAudio(); blip(); draw() }
    keysEl.appendChild(b)
  }
}
function flash(b: HTMLElement) { b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 120) }
addEventListener('keydown', (e) => {
  const i = KEYMAP[e.key]
  if (i === undefined || e.repeat) return
  noteHz = 55 * Math.pow(2, i / 12)
  const b = keysEl.querySelectorAll('button')[i]
  if (b) flash(b as HTMLElement)
  ensureAudio(); blip(); draw()
})

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight
  canvas.width = w * devicePixelRatio; canvas.height = h * devicePixelRatio
  draw()
}
addEventListener('resize', resize)
renderPanel(); renderKeys(); resize()
