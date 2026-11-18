# dao-playables

Rekonstruksi **mandiri** dari 5 playables interaktif [be-of-dao.com](https://be-of-dao.com) — karya DAO (© 2026).

> ⚠️ **Bukan salinan, bukan fork.** Seluruh situs sumber berlisensi *All Rights Reserved* dan melarang copy/re-host/redistribusi. Yang kami pelajari hanya **mekanismenya**; kode, shader, aset, dan teks ditulis ulang dari nol. Lihat [`AUDIT-LISENSI.md`](./AUDIT-LISENSI.md).

**Atribusi:** Terinspirasi oleh karya **be-of-dao / DAO** (be.of.dao@gmail.com · @be.of.dao · beofdao). Repo ini implementasi ulang independen; tidak ada afiliasi, endorsement, atau izin dari pemilik aslinya.

## Urutan port

| # | app | status | catatan |
|---|---|---|---|
| 1 | CIRCUIT 電 | ✅ v0.2 | **instrumen**: 4 slot R/C/L (ganti jenis + drag nilai), mainkan dari keyboard 16 nada, respons RC/LC/RLC → oscilloscope + audio |
| 2 | CHAOS 混沌 | ✅ v0.2 | **synth atraktor**: RK4 Lorenz menggerakkan pitch/filter/gain, keyboard nada, audio toggle |
| 3 | GATHER 聚 | ✅ v0.2 | **unggah gambar → point cloud** (kedalaman = kecerahan), energi buyar/gather + spin |
| 4 | PANDORA 樸 | ✅ v0.2 | **puzzle kubus**: 16 ubin kaca 4 muka, klik putar 2×2, scramble/undo/solve |
| 5 | WAKE 森 | ✅ v0.2 | **hutan point cloud**: klik pohon/batu → bunyi, sequencer 8 langkah, kamera jalan WASD |

## Prinsip

- Tulis ulang dari **aturan**, bukan dari kode/piksel sumber.
- Pustaka open source (Three.js, ONNX Runtime Web, dsb.) dipakai dengan lisensi aslinya.
- Atribusi ke DAO tampil di README tiap app dan footer halaman.
- Tidak untuk dijual / tidak ada re-host karya asli.

## Dokumen

- [`AUDIT-LISENSI.md`](./AUDIT-LISENSI.md) — bukti lisensi & putusan tulis-ulang
- `docs/re/<app>.md` — catatan reverse-engineering per app (mekanisme, parameter, keputusan desain sendiri)

Stack: TypeScript + Vite + Three.js, deploy Vercel project `dao-playables`.

Live: https://dao-playables.vercel.app

> v0.1 sempat membangun "nuansa visual" bukan mekanisme; v0.2 (18 Nov 2026) menulis ulang ke mekanisme aslinya setelah audit lisensi & koreksi arah. Lihat `docs/re/<app>.md`.
