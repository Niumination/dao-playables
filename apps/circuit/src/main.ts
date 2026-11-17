/**
 * CIRCUIT 電 — implementasi mandiri.
 * Simulasi MNA → trace voltase → oscilloscope canvas + audio Web Audio (buffer hasil simulasi).
 * Tidak ada kode/aset/teks dari be-of-dao; hanya mekanisme "sirkuit interaktif bersuara".
 */
import { MNACircuit, type Comp } from './mna'
import { CIRCUITS, type CircuitDef } from './circuits'

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T

const list = $('#list') as HTMLDivElement
const title = $('#title') as HTMLHeadingElement
const desc = $('#desc') as HTMLParagraphElement
const fchar = $('#fchar') as HTMLSpanElement
const canvas = $('#scope') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const playBtn = $('#play') as HTMLButtonElement
const excite = $('#excite') as HTMLInputElement
const exciteVal = $('#excite-val') as HTMLSpanElement
const readout = $('#readout') as HTMLSpanElement

let current: CircuitDef = CIRCUITS[0]
let trace: Float64Array = new Float64Array(0)
let audioCtx: AudioContext | null = null
let source: AudioBufferSourceNode | null = null

function cloneDef(d: CircuitDef): MNACircuit {
  const c = new MNACircuit(d.nodes)
  for (const x of d.comps) c.add({ ...x } as Comp)
  return c
}

/** Jalankan simulasi: tanggapan natural (kondisi awal C) atau langkah sumber, per jendela waktu sirkuit. */
function simulate(d: CircuitDef, amp: number): Float64Array {
  const c = cloneDef(d)
  const steps = 4000
  const dt = d.tspan / steps
  const out = new Float64Array(steps)
  const vs = c.comps.filter(x => x.kind === 'V')
  for (const v of vs) v.val = amp
  for (let i = 0; i < steps; i++) {
    const r = c.solve(dt)
    out[i] = Number.isFinite(r.v[d.probe]) ? r.v[d.probe] : 0
  }
  return out
}

function normalize(t: Float64Array): Float32Array {
  let max = 1e-9
  for (const v of t) max = Math.max(max, Math.abs(v))
  const f = new Float32Array(t.length)
  for (let i = 0; i < t.length; i++) f[i] = Math.tanh(t[i] / max * 1.2) * 0.8
  return f
}

function draw(t: Float64Array) {
  const w = canvas.width, h = canvas.height
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#0b0f10'
  ctx.fillRect(0, 0, w, h)
  // grid
  ctx.strokeStyle = 'rgba(120,180,150,0.10)'
  ctx.lineWidth = 1
  for (let x = 0; x <= w; x += w / 10) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
  for (let y = 0; y <= h; y += h / 6) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }
  ctx.strokeStyle = 'rgba(120,180,150,0.25)'
  ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke()

  let max = 1e-9
  for (const v of t) max = Math.max(max, Math.abs(v))
  ctx.strokeStyle = '#7ee0a8'
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let i = 0; i < t.length; i++) {
    const x = i / (t.length - 1) * w
    const y = h / 2 - t[i] / max * (h * 0.42)
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.stroke()
  // probe marker
  ctx.fillStyle = '#f0c46a'
  ctx.beginPath(); ctx.arc(w - 8, h / 2 - t[t.length - 1] / max * (h * 0.42), 4, 0, Math.PI * 2); ctx.fill()
}

function render(d: CircuitDef) {
  current = d
  title.textContent = d.name
  desc.textContent = d.desc
  fchar.textContent = d.fChar
  trace = simulate(d, Number(excite.value))
  draw(trace)
  const last = trace[trace.length - 1]
  readout.textContent = `V(probe) akhir = ${last.toFixed(4)} V · ${trace.length} sampel`
  for (const el of list.querySelectorAll('.item')) el.classList.toggle('active', (el as HTMLElement).dataset.id === d.id)
}

for (const d of CIRCUITS) {
  const b = document.createElement('button')
  b.className = 'item'
  b.dataset.id = d.id
  b.textContent = d.name
  b.onclick = () => render(d)
  list.appendChild(b)
}

excite.oninput = () => {
  exciteVal.textContent = Number(excite.value).toFixed(1) + ' V'
  render(current)
}

playBtn.onclick = async () => {
  if (!audioCtx) audioCtx = new AudioContext()
  if (source) { try { source.stop() } catch { /* sudah selesai */ } }
  // Naikkan pitch: 0,1 s rekaman → 2,2 s suara (loop halus)
  const raw = normalize(trace)
  const len = Math.floor(audioCtx.sampleRate * 2.2)
  const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate)
  const ch = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    const p = i / len * raw.length
    const i0 = Math.floor(p) % raw.length
    const i1 = (i0 + 1) % raw.length
    const frac = p - Math.floor(p)
    let s = raw[i0] * (1 - frac) + raw[i1] * frac
    // fade pinggir loop
    const fade = Math.min(1, i / (audioCtx.sampleRate * 0.02), (len - i) / (audioCtx.sampleRate * 0.02))
    ch[i] = s * fade * 0.5
  }
  source = audioCtx.createBufferSource()
  source.buffer = buf
  source.connect(audioCtx.destination)
  source.start()
  source.onended = () => { playBtn.textContent = '▶ Putar suara'; source = null }
  playBtn.textContent = '⏵ Memutar…'
}

window.addEventListener('resize', () => {
  canvas.width = canvas.clientWidth * devicePixelRatio
  canvas.height = canvas.clientHeight * devicePixelRatio
  draw(trace)
})
canvas.width = canvas.clientWidth * devicePixelRatio
canvas.height = canvas.clientHeight * devicePixelRatio
render(CIRCUITS[0])
