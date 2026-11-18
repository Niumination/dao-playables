# GATHER 聚 — catatan reverse-engineering (mekanisme, bukan salinan)

**Sumber yang dipelajari:** perilaku publik gather.be-of-dao.com (diamati dari luar).
**Implementasi:** ditulis dari nol di `src/`.

## Mekanisme inti (dari pengamatan perilaku)

1. Banyak partikel bergerak di bidang 2D, tertarik ke satu titik/inti — visual "mengumpul".
2. Ada unsur kedalaman/orturan (versi sumber memakai depth + ONNX); inti ini menyimulasikan tarikan radial.
3. Jejak partikel memudar; visual penuh layar.

## Keputusan implementasi kami

- **Gravitasi titik + pengereman (damping)** di canvas 2D: a = G·m/r², v *= 0,92 per frame.
- Inti ditarik sebagai **radial gradient** lembut; radius inti bisa diubah.
- Parameter: tarikan gravitasi, pengereman, jumlah partikel, radius inti, reset.
- Palet oranye-tan di hitam; bukan tiruan piksel sumber.
- Canvas penuh, DPR-aware, responsif.

## Verifikasi nyata (18 Nov 2026)

- `npm run build` ✓ `index-Cdl6XxP2.js` 2,80 kB; preview HTTP 200.
- Browser: fps 60, 900 partikel; visual (vision check) = **awan radial terpusat** dengan gradien kepadatan tinggi ke inti dan jejak spiral — sesuai mekanisme "gather".

## Catatan lisensi/teknis

- Versi sumber memakai model kedalaman (ONNX) untuk kedalaman partikel; kami **tidak memuat model** — kedalaman disimulasikan lewat kecepatan/kepadatan, tanpa unduhan bobot.
- Tidak ada berkas/kode/aset dari situs sumber.

## v0.2 — unggah gambar → point cloud (18 Nov 2026)

Setelah koreksi arah, GATHER ditulis ulang dari mekanisme aslinya: **gambar jadi point cloud**.

- **Unggah gambar** (input file / drag-drop) → sampel grid → tiap piksel jadi titik; **kedalaman = kecerahan**.
- Slider **energi** (gather↔buyar) & **spin**; rotasi 3D sederhana + proyeksi z.
- Tanpa gambar: cincin contoh 5000 titik.
- Warna titik = warna piksel asli gambar.

## Jarak dengan sumber (sengaja dipertahankan)

- Tidak ada pemrosesan audio/mic dari sumber (versi kita murni visual + parameter).
