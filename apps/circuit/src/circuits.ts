/**
 * Definisi sirkuit — dirancang sendiri dari teori dasar (f₀ = 1/(2π√(LC)), τ = RC = L/R, ζ = R/2·√(C/L)).
 * Tidak ada nilai/komponen yang disalin dari aplikasi sumber.
 */
import type { Comp } from './mna'

export type CircuitDef = {
  id: string
  name: string
  desc: string
  nodes: number
  comps: Comp[]
  probe: number
  fChar: string
  /** jendela waktu (detik) yang digambar — dipilih agar bentuk gelombang terbaca */
  tspan: number
}

const G = -1

function f0(L: number, C: number): number {
  return 1 / (2 * Math.PI * Math.sqrt(L * C))
}
function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + ' MHz'
  if (n >= 1e3) return (n / 1e3).toFixed(2) + ' kHz'
  return n.toFixed(1) + ' Hz'
}

export const CIRCUITS: CircuitDef[] = [
  {
    id: 'lc-tank',
    name: 'LC Tank',
    desc: 'Kapasitor bermuatan melepas energi ke induktor — ayunan sinus yang meredup karena rugi.',
    nodes: 1,
    comps: [
      { kind: 'L', a: 0, b: G, val: 0.01 },
      { kind: 'C', a: 0, b: G, val: 1e-6, vPrev: 1 },
      { kind: 'R', a: 0, b: G, val: 6800 },
    ],
    probe: 0,
    fChar: `f₀ ≈ ${fmt(f0(0.01, 1e-6))}`,
    tspan: 3e-3,
  },
  {
    id: 'series-lc',
    name: 'Series LC',
    desc: 'Sumber melalui R kecil menggerakkan LC seri: respons langkah berayun tajam.',
    nodes: 2,
    comps: [
      { kind: 'V', a: 0, b: G, val: 1 },
      { kind: 'R', a: 0, b: 1, val: 12 },
      { kind: 'L', a: 1, b: 2, val: 0.02 },
      { kind: 'C', a: 2, b: G, val: 0.5e-6 },
    ],
    probe: 2,
    fChar: `f₀ ≈ ${fmt(f0(0.02, 0.5e-6))}`,
    tspan: 4e-3,
  },
  {
    id: 'rc-lp',
    name: 'RC Low-pass',
    desc: 'Tegangan kapasitor mengejar target secara eksponensial dengan τ = RC.',
    nodes: 2,
    comps: [
      { kind: 'V', a: 0, b: G, val: 1 },
      { kind: 'R', a: 0, b: 1, val: 1000 },
      { kind: 'C', a: 1, b: G, val: 0.1e-6 },
    ],
    probe: 1,
    fChar: `f_c ≈ ${fmt(1 / (2 * Math.PI * 1000 * 0.1e-6))}`,
    tspan: 8e-4,
  },
  {
    id: 'rl-rise',
    name: 'RL Rise',
    desc: 'Arus induktor menanjak; tegangan di induktor meluruh dengan τ = L/R.',
    nodes: 2,
    comps: [
      { kind: 'V', a: 0, b: G, val: 1 },
      { kind: 'R', a: 0, b: 1, val: 100 },
      { kind: 'L', a: 1, b: G, val: 0.1 },
    ],
    probe: 1,
    fChar: 'τ = L/R = 1,0 ms',
    tspan: 4e-3,
  },
  {
    id: 'rlc-damped',
    name: 'RLC Damped',
    desc: 'Orde-2 teredam sedang (ζ≈0,25): beberapa ayunan lalu tenang.',
    nodes: 3,
    comps: [
      { kind: 'V', a: 0, b: G, val: 1 },
      { kind: 'R', a: 0, b: 1, val: 50 },
      { kind: 'L', a: 1, b: 2, val: 0.01 },
      { kind: 'C', a: 2, b: G, val: 1e-6 },
    ],
    probe: 2,
    fChar: `f₀ ≈ ${fmt(f0(0.01, 1e-6))} · ζ = 0,25`,
    tspan: 3e-3,
  },
  {
    id: 'rlc-ringing',
    name: 'RLC Ringing',
    desc: 'R sangat kecil (ζ≈0,01): ayunan panjang hampir tanpa redaman.',
    nodes: 3,
    comps: [
      { kind: 'V', a: 0, b: G, val: 1 },
      { kind: 'R', a: 0, b: 1, val: 2 },
      { kind: 'L', a: 1, b: 2, val: 0.01 },
      { kind: 'C', a: 2, b: G, val: 1e-6 },
    ],
    probe: 2,
    fChar: `f₀ ≈ ${fmt(f0(0.01, 1e-6))} · ζ = 0,01`,
    tspan: 6e-3,
  },
  {
    id: 'two-stage-rc',
    name: 'Two-stage RC',
    desc: 'Dua RC bertingkat: dua eksponensial bertumpuk, tepi makin landai.',
    nodes: 3,
    comps: [
      { kind: 'V', a: 0, b: G, val: 1 },
      { kind: 'R', a: 0, b: 1, val: 1000 },
      { kind: 'C', a: 1, b: G, val: 0.1e-6 },
      { kind: 'R', a: 1, b: 2, val: 1000 },
      { kind: 'C', a: 2, b: G, val: 0.1e-6 },
    ],
    probe: 2,
    fChar: 'Kaskade 2 kutub · τ 100 µs',
    tspan: 1.2e-3,
  },
  {
    id: 'coupled-tanks',
    name: 'Coupled Tanks',
    desc: 'Dua tangki LC terkopling: energi berpindah bolak-balik antar tangki.',
    nodes: 2,
    comps: [
      { kind: 'L', a: 0, b: G, val: 0.01 },
      { kind: 'C', a: 0, b: G, val: 1e-6, vPrev: 1 },
      { kind: 'C', a: 0, b: 1, val: 0.05e-6 },
      { kind: 'L', a: 1, b: G, val: 0.01 },
      { kind: 'C', a: 1, b: G, val: 1e-6 },
    ],
    probe: 1,
    fChar: 'Transfer energi antar tangki',
    tspan: 8e-3,
  },
  {
    id: 'charge-share',
    name: 'Charge Share',
    desc: 'Dua kapasitor berbagi muatan lewat resistor: tegangan menuju rata-rata.',
    nodes: 2,
    comps: [
      { kind: 'C', a: 0, b: G, val: 1e-6, vPrev: 1 },
      { kind: 'R', a: 0, b: 1, val: 1000 },
      { kind: 'C', a: 1, b: G, val: 1e-6, vPrev: 0 },
    ],
    probe: 1,
    fChar: 'τ = R·(C₁C₂/(C₁+C₂)) = 0,5 ms',
    tspan: 3e-3,
  },
  {
    id: 'rc-ladder',
    name: 'RC Ladder (3)',
    desc: 'Tiga seksi RC: respons makin landai, fase menumpuk.',
    nodes: 4,
    comps: [
      { kind: 'V', a: 0, b: G, val: 1 },
      { kind: 'R', a: 0, b: 1, val: 1000 },
      { kind: 'C', a: 1, b: G, val: 0.047e-6 },
      { kind: 'R', a: 1, b: 2, val: 1000 },
      { kind: 'C', a: 2, b: G, val: 0.047e-6 },
      { kind: 'R', a: 2, b: 3, val: 1000 },
      { kind: 'C', a: 3, b: G, val: 0.047e-6 },
    ],
    probe: 3,
    fChar: '3 kutub bertingkat · τ 47 µs/seksi',
    tspan: 1.5e-3,
  },
  {
    id: 'divider-rc',
    name: 'Divider + C',
    desc: 'Pembagi tegangan dimuat kapasitor: DC jatuh ke separuh, transien mulus.',
    nodes: 2,
    comps: [
      { kind: 'V', a: 0, b: G, val: 5 },
      { kind: 'R', a: 0, b: 1, val: 2200 },
      { kind: 'R', a: 1, b: G, val: 2200 },
      { kind: 'C', a: 1, b: G, val: 0.22e-6 },
    ],
    probe: 1,
    fChar: 'V_out → 2,5 V · τ = 242 µs',
    tspan: 1.2e-3,
  },
  {
    id: 'lossy-lc',
    name: 'Lossy LC',
    desc: 'LC nyata dengan resistansi seri: ayunan meredup cepat.',
    nodes: 3,
    comps: [
      { kind: 'V', a: 0, b: G, val: 1 },
      { kind: 'R', a: 0, b: 1, val: 47 },
      { kind: 'L', a: 1, b: 2, val: 0.0047 },
      { kind: 'C', a: 2, b: G, val: 0.47e-6 },
    ],
    probe: 2,
    fChar: `f₀ ≈ ${fmt(f0(0.0047, 0.47e-6))}`,
    tspan: 2e-3,
  },
  {
    id: 'current-drive',
    name: 'Current-driven C',
    desc: 'Sumber arus konstan mengisi kapasitor: tegangan naik linear (ramp murni).',
    nodes: 1,
    comps: [
      { kind: 'I', a: 0, b: G, val: 1e-3 },
      { kind: 'C', a: 0, b: G, val: 1e-6 },
      { kind: 'R', a: 0, b: G, val: 1e7 },
    ],
    probe: 0,
    fChar: 'dV/dt = I/C = 1 kV/s',
    tspan: 2e-3,
  },
  {
    id: 'bridge',
    name: 'Bridge (unbalanced)',
    desc: 'Jembatan resistif tak seimbang: ada beda tegangan di diagonal.',
    nodes: 3,
    comps: [
      { kind: 'V', a: 0, b: G, val: 5 },
      { kind: 'R', a: 0, b: 1, val: 1000 },
      { kind: 'R', a: 0, b: 2, val: 1000 },
      { kind: 'R', a: 1, b: G, val: 1000 },
      { kind: 'R', a: 2, b: G, val: 1200 },
      { kind: 'C', a: 1, b: 2, val: 1e-9 },
      { kind: 'R', a: 1, b: 2, val: 1e6 },
    ],
    probe: 2,
    fChar: 'ΔV diagonal ≈ 0,23 V',
    tspan: 1e-3,
  },
  {
    id: 'tank-loaded',
    name: 'Tank + Load',
    desc: 'Tangki LC dibebani resistor: Q menurun, ayunan pendek.',
    nodes: 1,
    comps: [
      { kind: 'L', a: 0, b: G, val: 0.0022 },
      { kind: 'C', a: 0, b: G, val: 2.2e-6, vPrev: 1 },
      { kind: 'R', a: 0, b: G, val: 470 },
    ],
    probe: 0,
    fChar: `f₀ ≈ ${fmt(f0(0.0022, 2.2e-6))}`,
    tspan: 2e-3,
  },
  {
    id: 'twin-t',
    name: 'Twin-T Notch',
    desc: 'Jaringan notch klasik: pada f tertentu keluaran nyaris nol.',
    nodes: 5,
    comps: [
      { kind: 'V', a: 0, b: G, val: 1 },
      { kind: 'R', a: 0, b: 1, val: 6800 },
      { kind: 'R', a: 0, b: 2, val: 6800 },
      { kind: 'C', a: 1, b: 3, val: 0.047e-6 },
      { kind: 'C', a: 2, b: 3, val: 0.047e-6 },
      { kind: 'R', a: 3, b: G, val: 3400 },
      { kind: 'C', a: 0, b: 4, val: 0.094e-6 },
      { kind: 'R', a: 4, b: G, val: 6800 },
    ],
    probe: 3,
    fChar: `f_notch ≈ ${fmt(1 / (2 * Math.PI * 6800 * 0.047e-6))}`,
    tspan: 6e-4,
  },
]
