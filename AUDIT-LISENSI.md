# AUDIT-LISENSI.md — be-of-dao.com (17 Nov 2026)

## Putusan: All Rights Reserved → TULIS ULANG DARI NOL

Survei langsung ke sumber (HTTP GET per situs, komentar lisensi di HTML):

| situs | pernyataan pemilik | teks verbatim (potongan) |
|---|---|---|
| circuit.be-of-dao.com | All Rights Reserved | "CIRCUIT · 電 by DAO — © 2026 DAO. All rights reserved. **Free to play; please don't copy, re-host or sell the app.**" |
| chaos-lite.be-of-dao.com | All Rights Reserved | "Chaos · 混沌 by DAO. (c) 2026 DAO, be-of-dao.com. All rights reserved. **Personal use only; no redistribution or republishing.** See LICENSE." |
| pandora-lite.be-of-dao.com | All Rights Reserved | "PANDORA · 樸 Lite v1.1 © 2026 DAO … All rights reserved. **Please do not copy, rehost or redistribute this app.** Full version and source: patreon.com/beofdao" |
| gather.be-of-dao.com | All Rights Reserved | "All rights reserved" + redistribusi dilarang (halaman kredit) |
| wake-lite.be-of-dao.com | Patreon-gated | Modal "Thank you, Patreon members"; source & full di patreon.com/beofdao |
| be-of-dao.com (induk) | tidak ada file LICENSE | 404 di /LICENSE semua subdomain |

## Konsekuensi (sesuai kesepakatan pemilik ekosistem)

1. **TIDAK menyalin** satu pun berkas, piksel, shader, teks, atau aset dari situs sumber.
2. Yang dipelajari hanya **mekanisme/aturan** (apa yang dilakukan aplikasi), lalu **ditulis ulang dari nol** dengan implementasi sendiri.
3. **Atribusi tetap diberikan**: "Terinspirasi oleh be-of-dao (be.of.dao) — karya DAO. Rekonstruksi mandiri, bukan salinan." Di README tiap app + footer halaman.
4. Komersialisasi/penjualan ulang **tidak dilakukan**.
5. Pustaka pihak ketiga yang dipakai aplikasi sumber (Three.js, ONNX Runtime Web, TensorFlow.js, MediaPipe) semuanya **open source (MIT/Apache)** — boleh kami pakai langsung dengan atribusi standar pustaka.

## Inventaris mekanisme (untuk rekonstruksi, dari pengamatan perilaku)

| app | mekanisme inti | pustaka sumber |
|---|---|---|
| CIRCUIT 電 | 61 sirkuit elektronik interaktif (LC tank, RC, RL, RLC, Twin-T, Van der Pol, dll.), drag-and-drop komponen, audio dari simulasi | canvas/audio Web (tidak ada lib besar) |
| CHAOS 混沌 | atraktor Lorenz + partikel, canvas 2D murni | — |
| GATHER 聚 | depth model di browser (ONNX), partikel mengumpul | onnxruntime-web |
| PANDORA 樸 | scene 3D generatif | three.js r128 |
| WAKE 森 | scene 3D + pohon prosedural + bloom | three.js + EffectComposer/UnrealBloomPass |

## Status rekonstruksi

- [ ] CIRCUIT (port pertama — termurah: simulasi + audio, tanpa 3D)
- [ ] CHAOS
- [ ] GATHER
- [ ] PANDORA
- [ ] WAKE
