# Design — Portfolio untuk lamaran ERP Functional Consultant / IT Business Analyst

Tanggal: 2026-10-29
Status: menunggu persetujuan pemilik
Pemilik: Ferdinand Lauren

## 1. Intent

Satu situs yang membuat perekrut dan hiring manager untuk posisi entry-level **ERP
Functional Consultant / IT Business Analyst** berhenti, mengerti cara pemiliknya
berpikir dalam hitungan detik, dan mengingatnya setelah tab ditutup.

Bukan portfolio developer. Bukti yang dijual adalah **struktur berpikir**: mengamati
proses bisnis, merumuskan masalah, menulis requirement, mendefinisikan perilaku sistem,
dan memverifikasinya.

## 2. Kenapa bentuk ini

Pengamatan yang membentuk seluruh desain: pelamar entry-level untuk peran ini hampir
tidak pernah punya artefak kerja sungguhan. Yang ada biasanya daftar aplikasi CRUD dan
badge framework — yang justru membaca sebagai "developer", bukan "analis".

Pemilik punya aset yang jarang: `GYM-QR`, dengan PRD 1.166 baris (persona, journey,
state machine, FR/NFR, DDL, spesifikasi API, decision log), `docs/UAT.md` berisi 15
skenario acceptance test, design spec, 5 rencana milestone, 118 test otomatis, PHPStan
dan Pint bersih, CI.

Karena itu situs dibangun di atas satu case study dalam, bukan banyak kartu proyek.

## 3. Goals

1. Dalam 5 detik pertama, pembaca tahu: siapa orang ini, peran apa yang dilamar, dan
   bahwa dia bekerja dengan requirement, bukan hanya kode.
2. Pembaca dapat **merasakan logika sistem** lewat satu simulator interaktif yang
   dibangun dari aturan yang benar-benar tertulis di PRD.
3. Setiap klaim di halaman bisa dibuktikan dengan membuka file di repo `GYM-QR`.
4. Menambah case study baru nanti hanya menambah satu file konten, tanpa menyentuh
   kode desain.

## 4. Non-goals

- Blog, tulisan rutin, newsletter.
- CMS atau panel admin.
- Toggle bahasa (v1 satu bahasa).
- Toggle dark/light (satu tema yang dirancang benar).
- 3D, WebGL, animasi scroll panjang, parallax.
- Grafik kontribusi GitHub, progress bar skill, persentase penguasaan.
- Testimoni atau logo klien (tidak ada yang nyata).
- Analytics pihak ketiga.

## 5. Anti-goals

- **Tidak boleh terasa seperti portfolio developer.** Tidak ada headline berisi nama
  framework. Stack hanya muncul sebagai detail pendukung di akhir case study.
- **Tidak ada angka yang tidak terukur.** Tidak ada "mengurangi waktu antre 40%".
  Yang ditulis hanya yang bisa dibuka: "15 skenario UAT, 118 test otomatis, PHPStan
  bersih".
- **Tidak ada kata kerja yang tidak bisa dipertahankan di interview.** Proyek ini
  konsep berbasis observasi, bukan keterlibatan klien, dan itu dinyatakan di halaman,
  bukan disembunyikan.
- **Tidak ada animasi yang bersaing dengan isi.** Gerak hanya untuk menjelaskan
  perubahan state.

## 6. Batasan

- Statis, tanpa server. Deploy GitHub Pages lewat GitHub Actions.
- Bahasa Inggris untuk isi situs. Alasan: lamaran untuk peran ini dan pembacaan CV
  umumnya berbahasa Inggris, dan target perusahaan termasuk konsultan/SI multinasional.
  (Keputusan pemilik, bisa diubah sebelum build.)
- Target perangkat: ponsel 360 px sampai desktop 1440 px.
- Waktu build dijaga wajar: tanpa dependency yang tidak perlu.
- Konten pribadi yang belum tersedia (nama lengkap, kampus, kota, email, LinkedIn,
  CV PDF) diisi pemilik sebelum publikasi; struktur menyediakan tempatnya.

## 7. Pendekatan yang dipertimbangkan

| Opsi | Isi | Tradeoff | Hasil |
|---|---|---|---|
| 1. Dokumen hidup | Satu halaman panjang bergaya dokumen konsultan | Cepat, kredibel, tapi tidak memberi momen yang diingat; HR non-teknis bisa merasa "cuma dokumen" | Ditolak sebagai bentuk utuh, diadopsi sebagai kerangka |
| 2. Narasi observasi | Cerita scroll-linked dengan process map beranimasi | Paling mudah jadi animasi berlebih; membaca sebagai positioning developer; butuh copywriting berat | Ditolak |
| 3. Ruang keputusan | Landing singkat + artefak terbuka in-page + simulator skenario | Paling berat dibangun, tapi satu-satunya yang membuat pembaca mengalami logika sistem | **Dipilih sebagai inti** |

Keputusan: **opsi 3 dengan disiplin opsi 1**. Simulator jadi pusat, struktur dokumen
jadi kerangkanya, animasi dibatasi pada transisi state.

## 8. Struktur halaman

Satu halaman utama (`/`) dengan case study penuh di dalamnya. Halaman terpisah hanya
jika nanti ada case study kedua (`/work/<slug>`).

1. **Hero** — nama, satu kalimat posisi, status ketersediaan (magang / trainee /
   junior), tiga tautan: case study, CV, email.
   Kalimat posisi yang diusulkan: *"I turn observed business processes into explicit
   requirements — and into systems whose behaviour can be tested."*
2. **Siapa saya** — dua paragraf: latar Ilmu Komputer, ketertarikan pada proses bisnis,
   peran yang dituju, apa yang sedang dipelajari. Tanpa klaim pengalaman industri.
3. **Case study: GYM-QR** — urutan bagian:
   - Konteks: apa sistemnya, proses bisnis apa yang didukung, siapa aktornya.
   - Batas kejujuran (satu baris tegas di atas, bukan catatan kaki): konsep mandiri
     berbasis observasi, belum divalidasi pemilik gym.
   - Observasi dan masalah, dinyatakan dalam bahasa bisnis.
   - Asumsi dan pertanyaan yang masih terbuka.
   - Requirement: ringkasan FR per modul, NFR kunci.
   - **Simulator** (bagian 9).
   - Verifikasi: tabel UAT 15 skenario, apa yang lulus, apa yang belum diuji di lokasi.
   - Keputusan dan tradeoff: 2–3 keputusan yang benar-benar diambil, dengan alasan.
   - Refleksi: apa yang akan dilakukan berbeda, apa yang masih perlu dipelajari.
4. **Artefak** — empat tab, dirender dari file markdown, plus tautan "baca PRD lengkap"
   ke repo GitHub:
   - Persona dan tujuan produk
   - State machine sesi absensi dan loker
   - Matriks UAT (15 baris)
   - Katalog error API
5. **Karya lain** — daftar ringkas satu baris per proyek, label jujur:
   `Prak_WebLanjut` dan `wuish` (praktikum Web Lanjut), `UAS-DSP` dan `DSP` (Python/
   Jupyter), `BMI_Calculator` (Kotlin), `pastebin` (CSS). Tidak ada yang dinaikkan
   jadi case study.
6. **Penutup** — kontak, unduh CV, tautan GitHub, dan satu paragraf "cara saya bekerja".

## 9. Spesifikasi simulator

Tujuan: pembaca mengalami sendiri aturan yang sudah didefinisikan, bukan membaca
klaim tentangnya.

Sumber aturan (tidak boleh dikarang): PRD §3.3 (state machine sesi absensi), §3.4
(state machine loker), §7.3 (kode error), `docs/UAT.md` (AT-01 s/d AT-15).

Skenario yang disediakan (enam, cukup untuk menunjukkan kedalaman):

| Skenario | Masukan | Hasil yang ditampilkan |
|---|---|---|
| Member aktif scan di kasir | QR sah, di dalam radius, akurasi baik | `200`, sesi terbuka, entri audit, kartu muncul di dasbor |
| Member kedaluwarsa scan | QR sah, membership habis | `403 MEMBERSHIP_EXPIRED`, tanpa baris absensi, masuk daftar scan ditolak |
| Scan dari 500 m | di luar geofence | `403 GEO_OUT_OF_RANGE` |
| Scan saat sesi masih terbuka | sesi aktif | `409 SESSION_ACTIVE` + info sesi berjalan |
| Dua kasir ambil loker #05 bersamaan | dua permintaan serentak | satu `200`, satu `409 LOCKER_TAKEN`, satu pemilik |
| Kembalikan kunci | loker terisi | loker `available`, `checkout_time` terisi |

Tampilan: tiga kolom di desktop (pilihan skenario / diagram state / panel respons),
satu kolom bertumpuk di ponsel. Panel respons menampilkan status HTTP, kode error,
perubahan state, dan entri audit. Tombol "reset".

Aturan:
- Deterministik, tanpa angka acak.
- Dapat dioperasikan penuh dengan keyboard.
- Label tetap terlihat: "Concept simulation — rules taken from the PRD and UAT plan.
  No live data."
- `prefers-reduced-motion` mematikan transisi.
- Tanpa JavaScript, halaman tetap terbaca: simulator diganti daftar aturan statis yang
  sama isinya.

## 10. Model konten

```
content/
  projects/
    gym-qr.md          # frontmatter + isi case study
  artifacts/
    gym-qr-personas.md
    gym-qr-states.md
    gym-qr-uat.md
    gym-qr-errors.md
  site.yaml            # nama, posisi, tautan, status ketersediaan
```

Frontmatter `projects/*.md`: `title`, `slug`, `role`, `period`, `type`
(`concept` | `coursework` | `client`), `status`, `stack[]`, `summary`, `simulator`
(nama modul simulator atau kosong), `links{}`.

Menambah proyek baru = menambah satu file markdown. Tidak menyentuh komponen atau CSS.
`type` mengendalikan label kejujuran yang dirender otomatis (concept → "independent
concept, not client-validated").

## 11. Teknis

- **Astro** (static output) — content collections sudah menyelesaikan model konten di
  bagian 10 tanpa kode generator sendiri; hasil build statis, cocok untuk GitHub Pages.
- Simulator: satu modul TypeScript kecil berisi state machine murni (`transition(state,
  event) → {state, status, code, audit}`) plus komponen tanpa framework. State machine
  murni ini sekaligus bisa diuji dengan unit test.
- Tanpa framework UI, tanpa CSS framework. Satu file CSS dengan custom property.
- Anggaran: JS < 30 KB terkompresi, tanpa font eksternal lebih dari dua berkas.
- Deploy: GitHub Actions → GitHub Pages. `gh` CLI tidak terpasang; push manual.

## 12. Arah visual

- Terasa seperti dokumen teknis yang dirancang rapi, bukan landing page startup.
- Tipografi sebagai pembawa utama: satu sans untuk teks, satu mono untuk kode, status,
  dan label. Skala tipe tegas, lebar baris 60–72 karakter.
- Satu warna aksen untuk status dan tautan. Sisanya netral dengan kontras tinggi.
- Grid dan garis tipis seperti lembar spesifikasi; nomor bagian terlihat.
- Gerak: hanya transisi state di simulator dan reveal halus saat bagian masuk viewport.
- Detail arah seni final diserahkan ke skill `design-taste-frontend` saat implementasi.

## 13. Aksesibilitas dan performa

- WCAG 2.1 AA: kontras 4,5:1, fokus terlihat, urutan heading benar, landmark.
- Simulator: `aria-live` untuk panel respons, tombol nyata, bukan div.
- Tanpa JavaScript: konten penuh, simulator diganti tabel aturan.
- Uji di 360, 768, 1440 px; Lighthouse performance dan accessibility ≥ 95.
- Tanpa hydration mismatch: seluruh interaksi setelah load.

## 14. Verifikasi sebelum publikasi

1. `npm run build` bersih; halaman tanpa error konsol.
2. Unit test state machine simulator: enam skenario di bagian 9 menghasilkan status,
   kode, dan perubahan state yang sama dengan `docs/UAT.md`.
3. Audit klaim: setiap angka dan kata kerja di halaman dicocokkan ke file di repo
   `GYM-QR`; yang tidak ada buktinya dihapus atau diturunkan jadi batasan.
4. Uji keyboard-only untuk simulator dan navigasi.
5. Uji tampilan 360/768/1440 px dan `prefers-reduced-motion`.
6. Audit bahasa: tidak ada kata "built", "led", "delivered", "improved" untuk proyek
   yang berstatus concept atau coursework.

## 15. Yang diserahkan ke builder

- Pemilihan pasangan font dan skala tipe konkret.
- Tata letak persis tiap bagian dan komponen artefak tab.
- Struktur internal modul simulator dan nama event.
- Isi file CSS dan token.
- Rincian CI workflow.

## 16. Yang harus disediakan pemilik

- Nama lengkap, kota, kampus, tahun angkatan/lulus.
- Email, LinkedIn, tautan CV PDF.
- Konfirmasi apakah nama tampil "Ferdinand Lauren".
- Foto (opsional; tanpa foto pun desain harus utuh).
- Koreksi atas setiap kalimat yang terasa tidak sesuai dengan dirinya.

---

## 17. Revisi setelah brief pemilik (2026-10-29)

Pemilik menyerahkan brief sendiri ("The Systems Notebook"). Bagian yang berubah dari draft awal:

- Simulator berganti nama menjadi **The Decision Lab**, dengan **empat** skenario (bukan enam) dan
  panel jejak keputusan (precondition → rule → respons → state → bukti), sesuai brief §9.
- Situs dibangun dengan **Astro 5**, dua route: `/` dan `/work/<slug>`.
- Artefak ditampilkan sebagai kutipan yang dapat dibuka di halaman, bukan tab.
- **Tidak ada** toggle bahasa. Situs berbahasa Inggris penuh.
- Tambahan bagian: skills dengan status berbasis bukti, dan "other work" berlabel coursework.
- Arah visual: paper/off-white, ink hijau tua, aksen lime, Fraunces + Instrument Sans + IBM Plex Mono.

Bukti teknis yang dipakai di halaman (diukur 29 Oktober 2026, bukan dari dokumen):

- `php artisan test` → 130 passed, 849 assertions (PHP 8.3.16, MySQL 8.4.3, Redis 5.0.14).
- `pint --test` → passed. `phpstan analyse` level 6 → 1 error (`AppServiceProvider.php:67`).
- CI `main` → merah pada static analysis, test di-skip. Dicatat di halaman sebagai batas, bukan disembunyikan.
- `docs/UAT.md` tidak berisi bukti eksekusi (kolom bukti kosong). Halaman menyatakan itu.
