# dao-playables

Rekonstruksi **mandiri** dari 5 playables interaktif [be-of-dao.com](https://be-of-dao.com) — karya DAO (© 2026).

> ⚠️ **Bukan salinan, bukan fork.** Seluruh situs sumber berlisensi *All Rights Reserved* dan melarang copy/re-host/redistribusi. Yang kami pelajari hanya **mekanismenya**; kode, shader, aset, dan teks ditulis ulang dari nol. Lihat [`AUDIT-LISENSI.md`](./AUDIT-LISENSI.md).

**Atribusi:** Terinspirasi oleh karya **be-of-dao / DAO** (be.of.dao@gmail.com · @be.of.dao · beofdao). Repo ini implementasi ulang independen; tidak ada afiliasi, endorsement, atau izin dari pemilik aslinya.

## Urutan port

| # | app | status | catatan |
|---|---|---|---|
| 1 | CIRCUIT 電 | ✅ v0.1 | 16 sirkuit; solver MNA sendiri; oscilloscope + audio |
| 2 | CHAOS 混沌 | ✅ v0.1 | atraktor Lorenz RK4, 700 partikel, panel parameter |
| 3 | GATHER 聚 | ✅ v0.1 | partikel gravitasi mengumpul ke inti, panel parameter |
| 4 | PANDORA 樸 | ✅ v0.1 | heightmap fBm Three.js, 12.321 titik, panel parameter |
| 5 | WAKE 森 | ✅ v0.1 | hutan prosedural + bloom, panel parameter |

## Prinsip

- Tulis ulang dari **aturan**, bukan dari kode/piksel sumber.
- Pustaka open source (Three.js, ONNX Runtime Web, dsb.) dipakai dengan lisensi aslinya.
- Atribusi ke DAO tampil di README tiap app dan footer halaman.
- Tidak untuk dijual / tidak ada re-host karya asli.

## Dokumen

- [`AUDIT-LISENSI.md`](./AUDIT-LISENSI.md) — bukti lisensi & putusan tulis-ulang
- `docs/re/<app>.md` — catatan reverse-engineering per app (mekanisme, parameter, keputusan desain sendiri)

Stack: TypeScript + Vite (rencana), deploy Vercel project terpisah.
