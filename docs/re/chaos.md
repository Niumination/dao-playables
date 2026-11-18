# CHAOS 混沌 — catatan reverse-engineering (mekanisme, bukan salinan)

**Sumber yang dipelajari:** perilaku publik chaos-lite.be-of-dao.com (diamati dari luar).
**Implementasi:** ditulis dari nol di `src/`.

## Mekanisme inti (dari pengamatan perilaku)

1. Atraktor Lorentz — partikel diintegrasi dengan ODE Lorenz, jejak partikel tertinggal di canvas.
2. Parameter klasik σ=10, ρ=28, β=8/3; dua lobus kupu-kupu khas.
3. Latar fade perlahan → jejak memudar, bukan clear total.
4. Proyeksi 3D→2D; sebagian variasi memakai rotasi.

## Keputusan implementasi kami

- Integrasi **RK4** (bukan Euler) untuk kestabilan atraktor.
- Proyeksi **isometrik sederhana** (rotasi 0,35 rad) — bukan tiruan kode sumber.
- HUD: fps, jumlah partikel, t; panel slider σ/ρ/β/jumlah partikel + reset jejak.
- Palet hijau mint di atas hitam, nuansa gelap; bukan tiruan piksel sumber.
- Canvas penuh layar, DPR-aware, responsif.

## Verifikasi nyata (18 Nov 2026)

- `npm run build` ✓ `index-CAsjAIcm.js` 3,00 kB; preview HTTP 200.
- Browser: fps 60, 700 partikel, t berjalan; visual (vision check) = **dua lobus kupu-kupu Lorenz** dengan inti gelap dan spiral — benar secara fisika.

## Jarak dengan sumber (sengaja)

- Tidak ada berkas/kode/aset dari situs sumber.
- Nilai parameter sama (konstanta standar σ/ρ/β — bukan "rahasia" milik siapa pun).
