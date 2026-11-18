# PANDORA 樸 — catatan reverse-engineering (mekanisme, bukan salinan)

**Sumber yang dipelajari:** perilaku publik pandora-lite.be-of-dao.com (Three.js, diamati dari luar).
**Implementasi:** ditulis dari nol di `src/`.

## Mekanisme inti (dari pengamatan perilaku)

1. Permukaan 3D generatif — medan ketinggian (heightmap) yang dibangun prosedural.
2. Visual low-poly / faceted; kamera mengorbit pelan; lighting lembut.
3. Parametrik (kepadatan, rotasi, skala) + regenerasi bentuk.

## Keputusan implementasi kami

- **Three.js modern (r170)** — bukan r128 milik sumber.
- Heightmap dari **value-noise 2D + fBm (5 oktaf)** sendiri (bukan Perlin dari pustaka lain).
- `PlaneGeometry` 110×110 → 12.321 titik, `flatShading: true`, `MeshStandardMaterial` ungu.
- Dua lampu titik + ambient; `FogExp2` agar tepi memudar.
- Panel parameter: kepadatan butir, rotasi, skala, tombol "bentuk baru" (seed acak).
- HUD: fps, jumlah titik, skala.

## Verifikasi nyata (18 Nov 2026)

- `npm run build` ✓ (`index-Cb80AfnT.js`); preview HTTP 200.
- Browser: 12.321 titik, permukaan low-poly ungu terlihat (vision check ✓).
- Catatan lingkungan: fps 11 di browser headless SwiftShader (tanpa GPU) — bukan masalah kode; di perangkat nyata jauh lebih tinggi.

## Jarak dengan sumber (sengaja)

- Tidak ada berkas/kode/aset dari situs sumber; noise & material milik sendiri.
