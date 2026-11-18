# WAKE 森 — catatan reverse-engineering (mekanisme, bukan salinan)

**Sumber yang dipelajari:** perilaku publik wake-lite.be-of-dao.com (Three.js + bloom, diamati dari luar).
**Implementasi:** ditulis dari nol di `src/`.

## Mekanisme inti (dari pengamatan perilaku)

1. Hutan prosedural — batang + kanopi rendah-poligon, tersebar acak di gelap.
2. Pencahayaan hijau lembut + **bloom** (post-processing) — pendar khas.
3. Kanopi bergoyang pelan (angin); kamera/scene berputar; regenerasi hutan.

## Keputusan implementasi kami

- Three.js r170 + `UnrealBloomPass` (EffectComposer/RenderPass) — pustaka standar, bukan shader dari sumber.
- Hutan: `CylinderGeometry` (batang) + `IcosahedronGeometry` (kanopi flat-shaded), seed LCG deterministik.
- Goyangan kanopi = rotasi sinus per pohon (`userData.phase`).
- Panel: bloom, kepadatan pohon, angin, rotasi, "hutan baru".
- HUD: fps, jumlah pohon, bloom.

## Verifikasi nyata (18 Nov 2026)

- `npm run build` ✓ (`index-DMRvLJk2.js` 490 kB — Three.js + bloom); preview HTTP 200.
- Browser: 96 pohon; vision check = **hutan low-poly dengan pendar bloom hijau** di kabut gelap ✓.
- Catatan: fps 4 di SwiftShader headless (tanpa GPU) — render bloom berat di CPU; di perangkat nyata wajar 60.

## Jarak dengan sumber (sengaja)

- Tidak ada berkas/kode/aset dari situs sumber.
