# CIRCUIT 電 — catatan reverse-engineering (mekanisme, bukan salinan)

**Sumber yang dipelajari:** perilaku publik circuit.be-of-dao.com (diamati dari luar).
**Implementasi:** ditulis dari nol di `src/`.

## Mekanisme inti (dari pengamatan perilaku)

1. Katalog sirkuit analog interaktif — pilih sirkuit → simulasi berjalan → visualisasi gelombang.
2. Sirkuit analog: LC tank, RC/RL, RLC orde-2, jaringan notch, sirkuit terkopling.
3. Output audio: respons sirkuit dibunyikan (Web Audio), pitch/texture tergantung sirkuit.

## Keputusan implementasi kami

- **Solver MNA sendiri** (`mna.ts`): stamping R/V/C/I, backward Euler untuk C & L, Gaussian elimination + partial pivoting. 16 sirkuit dirancang dari teori dasar (f₀ = 1/2π√(LC), τ = RC = L/R, ζ = R/2·√(C/L)).
- **Visual**: oscilloscope canvas 2D — grid, trace voltase probe, marker.
- **Audio**: rekaman simulasi 0,1 s di-stretch 22× + tanh soft-clip + crossfade loop → bunyi halus di Web Audio.
- **UI**: sidebar katalog + panel utama; slider amplitudo eksitasi.

## Jarak dengan sumber (sengaja dipertahankan)

- Nilai komponen dipilih sendiri (tidak dibaca dari situs).
- tidak ada drag-and-drop editor komponen (belum; versi sumber punya).
- Estetika bukan tiruan piksel — hanya nuansa gelap-monospace.

## v0.2 — instrumen (18 Nov 2026)

Setelah Audit lisensi + koreksi arah, CIRCUIT ditulis ulang dari mekanisme aslinya: **instrumen**, bukan katalog.

- **4 slot komponen**; tiap slot bisa diganti jenis R / C / L (chip), nilai di-drag (pointer).
- **Keyboard 16 nada** (a w s e d f t g y h u j k o l p) → frekuensi dasar; respons RC/LC/RLC dihitung per nada (τ=RC, f₀=1/2π√(LC), redaman e^{-πf₀t/q}).
- Trace → oscilloscope + audio Web Audio (loop halus).
- Solver MNA `mna.ts` tetap ada sebagai alat uji (dipakai versi v0.1).

## Jarak dengan sumber (sengaja dipertahankan)

- Tidak ada 61 sirkuit milik DAO (kita punya model respons generik).
- Nilai komponen bawaan dipilih sendiri; editor bukan tiruan piksel.

## Lisensi pihak ketiga

- Tidak ada pustaka eksternal untuk solver/simulasi — semua kode di `src/`.
- Build tool: Vite + TypeScript (MIT).
