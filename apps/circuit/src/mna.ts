/**
 * MNA solver — Modified Nodal Analysis untuk simulasi sirkuit linear & nonlinear ringan.
 * Implementasi sendiri (aturan R=V/I, KCL), bukan kode dari sumber mana pun.
 *
 * Stamping komponen ke matriks A·x = z:
 *   Resistor R antara node a,b: menambah conductance G=1/R di (a,a),(b,b) +(-G) di (a,b),(b,a)
 *   Voltage source V antara node a,b (nilai V, node b = a + V): branch current sebagai variabel ekstra
 *   Capacitor C: backward Euler → G=C/dt sebagai conductance + current source historis
 *   Inductor L: backward Euler → G=dt/L sebagai conductance
 *
 * Solver: Gaussian elimination dengan partial pivoting.
 */
export type Comp = {
  kind: 'R' | 'V' | 'C' | 'L' | 'I'
  a: number // node a (-1 = ground)
  b: number // node b (-1 = ground)
  val: number
  // state untuk C/L (voltase/arus step sebelumnya)
  vPrev?: number
  iPrev?: number
}

export class MNACircuit {
  nodes: number // jumlah node berlabel (0..nodes-1); -1 = ground
  comps: Comp[] = []

  constructor(nodes: number) {
    this.nodes = nodes
  }

  add(c: Comp) { this.comps.push(c) }

  /**
   * Selesaikan satu langkah waktu dt. Return [voltase node (nodes), arus branch V-source].
   */
  solve(dt: number): { v: Float64Array; iBranch: Float64Array } {
    const n = this.nodes
    // hitung jumlah branch voltage source
    const vsrc = this.comps.filter(c => c.kind === 'V')
    const m = n + vsrc.length
    const A: number[][] = Array.from({ length: m }, () => new Array(m).fill(0))
    const z = new Float64Array(m)

    let bi = n
    const branchIdx = new Map<Comp, number>()
    for (const c of vsrc) branchIdx.set(c, bi++)

    for (const c of this.comps) {
      const a = c.a, b = c.b
      switch (c.kind) {
        case 'R': {
          const g = 1 / Math.max(c.val, 1e-12)
          if (a >= 0) { A[a][a] += g; if (b >= 0) A[a][b] -= g }
          if (b >= 0) { A[b][b] += g; if (a >= 0) A[b][a] -= g }
          break
        }
        case 'C': {
          // backward Euler: G = C/dt, source arus = C/dt * vPrev (mengalir dari b ke a arah solver)
          const g = c.val / Math.max(dt, 1e-12)
          const vp = c.vPrev ?? 0
          if (a >= 0) { A[a][a] += g; if (b >= 0) A[a][b] -= g }
          if (b >= 0) { A[b][b] += g; if (a >= 0) A[b][a] -= g }
          if (a >= 0) z[a] += g * vp
          if (b >= 0) z[b] -= g * vp
          break
        }
        case 'L': {
          // backward Euler: G = dt/L, source arus iPrev
          const g = dt / Math.max(c.val, 1e-12)
          const ip = c.iPrev ?? 0
          if (a >= 0) { A[a][a] += g; if (b >= 0) A[a][b] -= g }
          if (b >= 0) { A[b][b] += g; if (a >= 0) A[b][a] -= g }
          if (a >= 0) z[a] -= ip
          if (b >= 0) z[b] += ip
          break
        }
        case 'I': {
          // current source: arus mengalir dari b ke a (nilai positif = masuk node a)
          if (a >= 0) z[a] -= c.val
          if (b >= 0) z[b] += c.val
          break
        }
        case 'V': {
          const k = branchIdx.get(c)!
          if (a >= 0) A[a][k] += 1
          if (b >= 0) A[b][k] -= 1
          if (a >= 0) A[k][a] += 1
          if (b >= 0) A[k][b] -= 1
          z[k] = c.val
          break
        }
      }
    }

    const x = gaussSolve(A, z)
    // simpan state C/L
    for (const c of this.comps) {
      if (c.kind === 'C') {
        const va = a(c.a, x), vb = a(c.b, x)
        c.vPrev = va - vb
      } else if (c.kind === 'L') {
        const va = a(c.a, x), vb = a(c.b, x)
        const g = dt / Math.max(c.val, 1e-12)
        // backward Euler: i_new = i_prev + (dt/L)·v_new — WAJIB diakumulasi, bukan di-reset
        c.iPrev = (c.iPrev ?? 0) + g * (va - vb)
      }
    }
    const v = new Float64Array(n)
    for (let i = 0; i < n; i++) v[i] = x[i]
    const iB = new Float64Array(vsrc.length)
    for (let k = 0; k < vsrc.length; k++) iB[k] = x[n + k]
    return { v, iBranch: iB }
  }
}

function a(node: number, x: Float64Array): number {
  return node >= 0 ? x[node] : 0
}

/** Gaussian elimination dgn partial pivoting. */
export function gaussSolve(A: number[][], z: Float64Array): Float64Array {
  const m = z.length
  const M = A.map((row, i) => [...row, z[i]])
  for (let col = 0; col < m; col++) {
    // pivot
    let piv = col
    for (let r = col + 1; r < m; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r
    if (Math.abs(M[piv][col]) < 1e-14) { continue } // singular → biarkan 0
    ;[M[col], M[piv]] = [M[piv], M[col]]
    const d = M[col][col]
    for (let r = col + 1; r < m; r++) {
      const f = M[r][col] / d
      if (f === 0) continue
      for (let c2 = col; c2 <= m; c2++) M[r][c2] -= f * M[col][c2]
    }
  }
  const x = new Float64Array(m)
  for (let r = m - 1; r >= 0; r--) {
    let s = M[r][m]
    for (let c2 = r + 1; c2 < m; c2++) s -= M[r][c2] * x[c2]
    const d = M[r][r]
    x[r] = Math.abs(d) < 1e-14 ? 0 : s / d
  }
  return x
}
