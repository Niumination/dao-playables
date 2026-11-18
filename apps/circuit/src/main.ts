/**
 * CIRCUIT 電 — implementasi mandiri.
 * Instrumen: slot ganti komponen, drag ubah nilai, mainkan dari keyboard.
 * Simulasi MNA per note (RC / LC / RLC), trace → oscilloscope + audio Web Audio.
 * Tidak ada kode/aset/teks dari be-of-dao.
 */

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T
const scope = $('#scope') as HTMLCanvasElement
const ctx = scope.getContext('2d')!
const slotsEl = $('#slots') as HTMLDivElement
const statEl = $('#stat') as HTMLSpanElement
const keyEl = $('#keys') as HTMLDivElement

type SlotKind = 'R' | 'C' | 'L'

const KEYMAP: Record<string, number> = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15 }

/** Respons natural RC/LC/RLC untuk frekuensi f (dari catatan keyboard). */
function response(kind: SlotKind, val: number, f: number, t: number): number {
  if (kind === 'R') {
    const tau = 100e-6 * val / 1e3
    return Math.exp(-t / tau) * Math.cos(2 * Math.PI * f * t) * 2
  }
  if (kind === 'C') {
    const f0 = 1 / (2 * Math.PI * Math.sqrt(100e-6 * val * 1e-6))
    return Math.exp(-t * 20) * Math.cos(2 * Math.PI * f0 * t) * 2
  }
  const f0 = 1 / (2 * Math.PI * Math.sqrt(10e-3 * (val * 1e-6)))
  const q = 8
  return Math.exp(-Math.PI * f0 * t / q) * Math.cos(2 * Math.PI * f0 * t) * 2
}

let state: SlotKind[] = ['R', 'R', 'C', 'L']
let vals: number[] = [1000, 4700, 22, 10] // Ω, Ω, nF, mH
let noteHz = 220

function renderSlots() {
  slotsEl.innerHTML = ''
  for (let i = 0; i < 4; i++) {
    const row = document.createElement('div')
    row.className = 'slot'
    row.innerHTML = `<b>slot ${i + 1}</b>`
    for (const k of ['R', 'C', 'L'] as SlotKind[]) {
      const b = document.createElement('button')
      b.className = 'chip' + (state[i] === k ? ' on' : '')
      b.textContent = k
      b.onclick = () => { state[i] = k; vals[i] = defaultVal(k); renderSlots(); rebuild() }
      row.appendChild(b)
    }
    // drag nilai
    const v = document.createElement('span')
    v.className = 'val'
    v.textContent = fmtVal(state[i], vals[i])
    let drag = false, sx = 0, sv = 0
    v.onpointerdown = (e) => { drag = true; sx = e.clientX; sv = vals[i]; v.setPointerCapture(e.pointerId) }
    v.onpointermove = (e) => {
      if (!drag) return
      const d = (e.clientX - sx) * (sv > 10 ? 0.5 : 0.02)
      vals[i] = clampVal(state[i], sv + d)
      v.textContent = fmtVal(state[i], vals[i])
    }
    v.onpointerup = () => { drag = false; rebuild() }
    row.appendChild(v)
    slotsEl.appendChild(row)
  }
}

function defaultVal(k: SlotKind): number {
  return k === 'R' ? 4700 : k === 'C' ? 22 : 10
}
function clampVal(k: SlotKind, v: number): number {
  const lim = k === 'R' ? [100, 100000] : k === 'C' ? [1, 1000] : [1, 100]
  return Math.max(lim[0], Math.min(lim[1], v))
}
function fmtVal(k: SlotKind, v: number): string {
  if (k === 'R') return (v / 1000).toFixed(1) + ' kΩ'
  if (k === 'C') return v.toFixed(0) + ' nF'
  return v.toFixed(0) + ' mH'
}

// --- trace & audio ---
function buildTrace(): Float32Array {
  const N = 4000
  const dur = 0.25
  const out = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    const t = i / N * dur
    let s = 0
    for (let j = 0; j < 4; j++) s += response(state[j], vals[j], noteHz, t) / 4
    out[i] = Math.tanh(s)
  }
  return out
}

function draw(trace: Float32Array) {
  const w = scope.width, h = scope.height
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#0b0f10'; ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(120,180,150,0.10)'
  for (let x = 0; x <= w; x += w / 10) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
  for (let y = 0; y <= h; y += h / 6) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }
  ctx.strokeStyle = 'rgba(120,180,150,0.25)'; ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h); ctx.stroke()
  ctx.strokeStyle = '#7ee0a8'; ctx.lineWidth = 2; ctx.beginPath()
  for (let i = 0; i < trace.length; i++) {
    const x = i / (trace.length - 1) * w
    const y = h / 2 - trace[i] * h * 0.42
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.stroke()
}

let audioCtx: AudioContext | null = null
let source: AudioBufferSourceNode | null = null
function playTrace() {
  if (!audioCtx) audioCtx = new AudioContext()
  if (source) { try { source.stop() } catch { /* sudah selesai */ } }
  const raw = buildTrace()
  const len = Math.floor(audioCtx.sampleRate * 2.2)
  const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate)
  const ch = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    const p = i / len * raw.length
    const i0 = Math.floor(p) % raw.length, i1 = (i0 + 1) % raw.length, fr = p - Math.floor(p)
    const s = raw[i0] * (1 - fr) + raw[i1] * fr
    const fade = Math.min(1, i / (audioCtx.sampleRate * 0.02), (len - i) / (audioCtx.sampleRate * 0.02))
    ch[i] = s * fade * 0.5
  }
  source = audioCtx.createBufferSource()
  source.buffer = buf; source.connect(audioCtx.destination); source.start()
  source.onended = () => { source = null }
}

function rebuild() {
  const tr = buildTrace()
  draw(tr)
  let fmax = 1
  for (let j = 0; j < 4; j++) if (state[j] === 'C') fmax = Math.max(fmax, 1 / (2 * Math.PI * Math.sqrt(100e-6 * vals[j] * 1e-6)))
  statEl.textContent = `nada ${noteHz.toFixed(1)} Hz · f₀ LC ${fmax.toFixed(0)} Hz · 4 slot`
}

function flashKey(b: HTMLElement) { b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 120) }

function renderKeys() {
  keyEl.innerHTML = ''
  for (const [k, i] of Object.entries(KEYMAP)) {
    const b = document.createElement('button')
    b.className = 'key'
    b.textContent = k
    b.onclick = () => { noteHz = 110 * Math.pow(2, i / 12); flashKey(b); rebuild(); playTrace() }
    keyEl.appendChild(b)
  }
}

addEventListener('resize', () => {
  scope.width = scope.clientWidth * devicePixelRatio
  scope.height = scope.clientHeight * devicePixelRatio
  draw(buildTrace())
})
scope.width = scope.clientWidth * devicePixelRatio
scope.height = scope.clientHeight * devicePixelRatio

renderSlots(); renderKeys(); rebuild()

// mainkan dari keyboard fisik
addEventListener('keydown', (e) => {
  const i = KEYMAP[e.key]
  if (i === undefined || e.repeat) return
  noteHz = 110 * Math.pow(2, i / 12)
  const b = keyEl.querySelectorAll('button')[i]
  if (b) flashKey(b as HTMLElement)
  rebuild(); playTrace()
})
