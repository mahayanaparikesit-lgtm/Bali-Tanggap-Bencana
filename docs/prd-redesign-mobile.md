# PRD v3 — Redesign + Layar Baru Mobile App Bali-Rief

Status: **DRAFT. Fase 0 (audit layar) dan Fase 0b (audit data) selesai. Fase S (perbaikan keamanan) sedang dikerjakan.**
Dasar fakta: audit Fase 0 terhadap `artifacts/mobile` (30 rute) dan audit Fase 0b (bagian 13).
Gambar referensi: `design-reference/` (helptrack-sheet-1/2, cyan-crowdfunding, purple-charity, smile).

Cakupan dibagi dua supaya risikonya tidak tercampur:
- **Bagian A — Redesign layar yang sudah ada.** Hanya tampilan. Alur, API, data tidak berubah.
- **Bagian B — Layar baru** (Peta, Kebutuhan, Distribusi, Riwayat Donasi, Profil baru, navigasi 5 tab). Ini fitur: butuh data dan endpoint, jadi punya audit dan gerbang sendiri.

---

## 1. Tujuan

1. Tampilan terasa dirancang dengan sengaja, bukan template.
2. Informasi darurat (status, urgensi, kebutuhan, progres) terbaca cepat, termasuk satu tangan dan di lapangan.
3. Satu sistem desain (token + komponen) dipakai semua layar.
4. Layar terasa hidup karena **data nyata**, bukan dekorasi.

## 2. Di luar cakupan

- Mengubah auth, role, atau logika `RoleGuard`.
- Mengubah alur layar yang sudah ada (Bagian A tidak menambah/menghapus layar atau aksi).
- Mengubah logika wizard lapor, **kecuali Wizard Lapor v2** (bagian 7): input berbasis ketuk, koordinat GPS, dan data korban per kelompok.
- Admin tetap di web.
- Fitur lain di bagian 8.
- Bagian B boleh menambah endpoint baca dan, jika diputuskan, tabel baru — **hanya dengan persetujuan per item** (bagian 10).

## 3. Alur yang dikunci (hasil audit)

| Kelompok | Layar yang ada | Login |
|---|---|---|
| **Tamu** | Landing (Lapor / Masuk / Daftar) → Lapor Bencana (wizard 5 langkah: jenis → lokasi → foto → keterangan → periksa & kirim; konfirmasi di layar yang sama). Transparansi (kini hanya dari tautan di layar Masuk). Masuk, Daftar (role Pelapor / Donatur) | Tidak |
| **Pelapor berakun** | Riwayat laporan saya → Detail laporan + kebutuhan. Laporan baru (wizard sama). **Catatan Fase 0b: riwayat saat ini tidak berfungsi (403), lihat bagian 13** | Ya |
| **Relawan** | Dashboard tugas aktif (status diubah sekali ketuk di dashboard; tab bar 2 item). Form daftar relawan. Profil relawan + riwayat tugas | Ya |
| **Donatur** | Tab bar 4 item: Beranda (bencana aktif), Lokasi (placeholder), Riwayat (placeholder), Profil. Alur donasi: Detail lokasi → Jenis → Uang → Pembayaran → Ringkasan → Sukses, atau Barang → Penyerahan → Ringkasan → Sukses | Ya |

Koreksi dari audit: tidak ada layar detail tugas (status diubah di dashboard; `/relawan/[id]` adalah profil). Teks landing "Daftar Relawan / Donatur" menyesatkan karena role relawan hanya diberikan admin; teksnya diperbaiki di Bagian A, jalur mendaftarnya masuk backlog.

---

# BAGIAN A — Redesign layar yang ada

## 4. Referensi

| Referensi | Dipakai | Tidak dipakai |
|---|---|---|
| **HelpTrack** | Tulang punggung: kartu ikon jenis bencana, kartu kejadian + badge, daftar dengan progres, header, tipografi | Peringatan Dini, login Google/Apple |
| **Cyan crowdfunding** | Alur donasi: grid nominal, metode bayar, tombol menempel di bawah, lencana terverifikasi | FAB yang menutupi konten |
| Smile, Purple | Ide kecil (chip nominal, baris ikon kategori) | Blob, ilustrasi 3D, gradien ungu, foto anak sebagai alat emosional |

Aturan foto: utamakan foto kondisi lokasi; tidak memajang wajah korban/anak yang bisa dikenali sebagai alat penggugah emosi.

## 5. Arah desain

### 5.1 Warna (diputuskan)
Biru/netral untuk aksi; merah hanya untuk urgensi (kejadian aktif, peringatan, stok kritis). Status selalu warna + ikon + label.
`theme.ts` memuat komentar "palet & status FIXED… merah/oranye… jangan biru/ungu" dan primary merah `#CF2317`. Komentar itu **digantikan** keputusan ini dan harus diubah di Fase 1 agar sesi berikutnya tidak mengembalikannya. Lima token status ditinjau agar merah tidak dipakai untuk status non-darurat. Perhatikan: status "Terverifikasi" kini biru (`#125CA5`); biru aksi harus jelas berbeda darinya.

### 5.2 Tipografi
Font tetap: Plus Jakarta Sans + IBM Plex Mono (sudah dimuat). Masalah utama: 23 ukuran huruf ditulis langsung (10–27, termasuk 12.5, 14.5, 15.5, 16.5). Diganti skala tetap, usulan 6 tingkat: caption 12 · body-sm 14 · body 16 · title 20 · heading 24 · display 32. Final di Fase 1.

### 5.3 Komponen
Memoles yang ada: `StatusBadge`, `ScreenHeader`, `LaporanWizard` (dirombak sebagai Wizard Lapor v2, bagian 7), `BottomBar`, `FlowHeader`, `PhotoPlaceholder`, `TabIcons`, `ComingSoon`. Tambahan: skala tipografi di `theme.ts`, tombol (primer/sekunder/bahaya), kartu kejadian, chip nominal, state kosong/loading/error. Delapan nilai hex hardcode di 4 file dipindah ke token.

### 5.4 Memperkaya tampilan tanpa dekorasi
Agar tidak polos, dengan **data nyata** saja:
- Ringkasan angka di Beranda (lokasi aktif, dana terkumpul, relawan bertugas), angka memakai IBM Plex Mono.
- Kartu kejadian: foto laporan, badge status + urgensi, waktu relatif ("2 jam lalu"), progres kebutuhan.
- Satu set ikon konsisten untuk jenis bencana dan kategori kebutuhan (tanpa emoji).
- Foto kosong memakai placeholder ikon jenis bencana, bukan kotak abu.
- Skeleton loading, pull-to-refresh, state kosong yang menyarankan aksi berikutnya (ilustrasi garis sederhana, bukan 3D).
- Transisi singkat dan haptic pada aksi penting (kirim laporan, konfirmasi donasi); menghormati reduced motion.
- Dilarang: angka, foto, atau progres karangan yang tampil seolah nyata.

### 5.5 Prinsip wajib
Touch target ≥ 44×44 pt · kontras teks ≥ 4.5:1 · status tidak hanya warna · aksi utama di bawah layar · form panjang bertahap, kegagalan kirim tidak menghilangkan data · semua daftar punya state kosong/loading/error · teks tidak dipotong tanpa jalan melihat isi penuh.

## 6. Pemetaan layar lama → baru

| Layar | Perubahan tampilan | Acuan |
|---|---|---|
| Landing | Tiga jalur jelas, teks relawan dikoreksi, tautan Transparansi | HelpTrack |
| Masuk / Daftar | Form bersih, pesan admin-ditolak tetap | HelpTrack |
| Lapor Bencana (wizard) | Dirombak penuh sebagai **Wizard Lapor v2** (Bagian B, bagian 7): input berbasis ketuk, GPS, data korban | HelpTrack |
| Riwayat & Detail laporan (pelapor) | Kartu + StatusBadge baru | HelpTrack |
| Dashboard relawan | Kartu tugas, ubah status sekali ketuk | HelpTrack |
| Form daftar relawan, Profil relawan | Form dan daftar bersih | HelpTrack |
| Beranda donatur | Kartu bencana aktif + progres + ringkasan angka | HelpTrack + Cyan |
| Detail lokasi → alur donasi (uang & barang) | Grid nominal, metode bayar, ringkasan, sukses | Cyan |
| Transparansi | Kartu laporan + dana | Cyan |
| Tab Lokasi & Riwayat donatur (placeholder) | Digantikan layar Bagian B | — |

---

# BAGIAN B — Layar baru

Aturan: tiap layar punya sumber data yang diverifikasi di **Fase 0b (audit data, read-only)** sebelum dibuat. Tidak ada data dummy yang tampil sebagai nyata.

## 7. Layar baru dan kebutuhan datanya

| Layar | Data yang dipakai | Hal yang harus dicek di Fase 0b |
|---|---|---|
| **Kebutuhan Bantuan** | Tabel `kebutuhan` (kategori, nama_item, jumlah_dibutuhkan, jumlah_terpenuhi, satuan) → progres %. Filter per kategori. Tombol "Bantu" masuk ke alur donasi barang yang sudah ada | Ada tidaknya endpoint daftar kebutuhan lintas lokasi |
| **Peta** | `laporan` (koordinat_lat/lng, jenis_bencana, status). Titik berasal dari koordinat yang ditetapkan pelapor di wizard (lihat "Alur koordinat"). Pin berwarna sesuai status/urgensi, filter chip jenis bencana, kartu kejadian terdekat + jarak (izin lokasi pengguna opsional; tanpa izin peta tetap tampil) | **Kebocoran data pribadi:** `laporan` memuat `nama_pelapor` dan `kontak_pelapor`; endpoint publik untuk peta/daftar wajib hanya mengirim field aman. Pustaka peta kompatibel Expo Go. Apakah wizard saat ini sudah mengirim koordinat atau baru teks lokasi. Laporan tanpa koordinat hanya tampil di daftar |
| **Distribusi Bantuan** | **Tabel baru (diputuskan)** untuk tahapan distribusi Pengumpulan → Pengiriman → Penyaluran. Usulan awal `distribusi` (rinci, **per item kebutuhan**): kebutuhan_id, tahap, status, jumlah, catatan, dicatat_oleh, timestamps, foto bukti opsional (hanya bila mekanisme unggah foto laporan bisa dipakai ulang). Admin mengisi dari web (halaman detail laporan admin sudah menampilkan kebutuhan); mobile hanya membaca. Progres per item = jumlah yang sudah disalurkan / jumlah dibutuhkan | Migrasi skema, endpoint tulis khusus admin + validasi Zod, endpoint baca, halaman/form admin di web. Catatan: endpoint transparansi pernah memakai `foto_penyerahan` dummy; **tidak boleh dipakai di UI** |
| **Riwayat Donasi** (menggantikan tab Riwayat) | Tabel `donasi`; status; tautan ke Transparansi | Apakah alur donasi di mobile benar-benar menyimpan donasi ke backend, atau baru tampilan |
| **Profil baru** | Hanya menu yang berfungsi: Riwayat Donasi (donatur), Laporan Saya (pelapor berakun), Profil/Riwayat Tugas (relawan), Transparansi, Keluar | Notifikasi, Favorit, FAQ tidak dibuat (tidak ada fungsinya; backlog) |
| **Navigasi 5 tab** | Beranda · Peta · **[+ Lapor]** · Bantuan · Profil | Dipasang setelah Peta dan Bantuan ada |

### Wizard Lapor v2 (mobile-first, diputuskan)
Prinsip: pelapor di lapangan, satu tangan, sinyal lemah → **ketuk, bukan ketik**. Ini berlaku untuk wizard mobile; form di web tidak diubah.

Usulan 5 langkah (jumlah final ditentukan di Fase 5, asal pengiriman tetap lewat `POST /laporan` yang sama):
1. **Jenis bencana** — kartu ikon, satu ketukan.
2. **Lokasi** — GPS otomatis + geser pin (lihat "Alur koordinat"); teks lokasi terisi otomatis bila tersedia dan bisa diedit.
3. **Foto & kondisi** — kamera satu ketukan (opsional) + chip kondisi/kebutuhan mendesak (mis. butuh evakuasi, makanan/air, medis, akses terputus, listrik padam) + catatan teks opsional. `deskripsi` disusun dari chip dan catatan, jadi tidak perlu kolom baru dan kolom wajib tetap terisi.
4. **Korban terdampak** — tombol +/− per kelompok (pria, wanita, balita, anak, lansia), semua default 0, total dihitung otomatis.
5. **Kontak, identitas & kirim** — nomor HP **wajib** (satu isian angka) + **foto KTP wajib** (kamera, satu ketukan; lihat "Verifikasi identitas pelapor"); nama opsional ("Anonim" bila kosong karena kolom nama wajib). Pelapor berakun: nama dan kontak terisi dari akun. Ringkasan satu layar sebelum kirim.

Tidak hilang data: draft tersimpan lokal di tiap langkah; bila kirim gagal, laporan tersimpan dan bisa dikirim ulang. Opsional (kompleksitas lebih tinggi, perlu dinilai di Fase 0b): kirim otomatis saat sinyal kembali.

**Data korban (fitur baru):**
- Kolom baru di `laporan`, bilangan bulat default 0: `terdampak_pria`, `terdampak_wanita`, `terdampak_balita`, `terdampak_anak`, `terdampak_lansia` (lima kelompok, diputuskan).
- `jumlah_terdampak` tetap ada dan **dihitung server** dari jumlah kolom itu (angka dari klien tidak dipercaya).
- Hanya angka agregat, **tanpa nama korban** (privasi).
- Validasi Zod: bilangan bulat ≥ 0 dengan batas atas wajar.
- Tampil di Detail Kejadian (rincian per kelompok) dan di detail laporan admin (web), supaya admin bisa merencanakan kebutuhan (mis. banyak balita → perlengkapan bayi). Tidak ada otomatisasi.
- Kolom baru default 0, jadi form web yang lama tetap bisa mengirim laporan tanpa rusak.
- Definisi (diputuskan): "korban" = terdampak per kelompok, selaras dengan `jumlah_terdampak`; status luka/meninggal/hilang tidak dicatat.

### Verifikasi identitas pelapor: KTP wajib (diputuskan; aturan penanganan wajib)
- Langkah 5 meminta **foto KTP** lewat kamera. Usulan: hanya foto, NIK tidak diketik (admin membacanya saat verifikasi), supaya tetap minim mengetik dan data yang disimpan lebih sedikit. Perlu konfirmasi (bagian 10).
- Foto diambil langsung dari kamera dan **tidak disimpan ke galeri perangkat**; hanya ada pratinjau sebelum kirim.
- Penyimpanan **privat**, bukan URL publik. Hanya admin yang bisa melihat, lewat tautan sementara. Kolom foto KTP **tidak boleh muncul** di endpoint publik, Peta, Transparansi, maupun riwayat pelapor.
- Endpoint unggah bersifat publik (pelapor tanpa login): batas ukuran dan tipe file, rate limit, validasi di server.
- Pelapor diberi tahu singkat mengapa KTP diminta, siapa yang melihat, dan berapa lama disimpan. Pengelolaannya mengacu pada UU Pelindungan Data Pribadi (UU No. 27 Tahun 2022); aspek hukumnya perlu dikonfirmasi ke ahli hukum, dokumen ini bukan nasihat hukum.
- Masa simpan (usulan): foto KTP dihapus setelah laporan selesai diverifikasi atau ditolak, dengan batas waktu yang ditentukan (mis. 30 hari).
- Aturan berlaku di server untuk semua pengirim laporan, bukan hanya mobile. Konsekuensinya form laporan di web juga perlu field foto KTP (perubahan web, ikut Fase 5).
- Catatan produk: syarat KTP bisa menghalangi pelapor yang kehilangan dokumen saat bencana dan wisatawan asing di Bali (lihat keputusan terbuka).

### Alur koordinat: dari pelapor ke titik di Peta (diputuskan)
1. Langkah lokasi di wizard: tombol "Gunakan lokasi saya" (GPS, izin diminta saat dipakai) → titik tampil di peta kecil dengan akurasi GPS. Pelapor bisa **menggeser pin** ke lokasi kejadian yang sebenarnya, karena pelapor bisa berada jauh dari kejadian. Teks lokasi (desa/alamat) tetap ada.
2. Izin ditolak atau GPS gagal: pelapor tetap bisa memilih titik manual di peta; jika tidak ada koordinat sama sekali, laporan tetap terkirim dan hanya tampil di daftar, tidak di peta.
3. Saat kirim, koordinat disimpan di `koordinat_lat` / `koordinat_lng` (kolom sudah ada). Server memvalidasi rentang koordinat karena endpoint ini publik.
4. Peta membaca laporan berkoordinat lewat endpoint publik yang hanya mengirim field aman (id, jenis, status, lat, lng, waktu, teks lokasi) — tanpa nama dan kontak pelapor.
5. **Kebijakan tampil di peta publik (diputuskan):** pelapor tanpa login bisa mengirim titik apa pun, jadi pin tampil di peta publik **hanya setelah admin memverifikasi**. Laporan yang menunggu hanya terlihat admin (web); pelapor tamu melihat laporannya sendiri di layar konfirmasi, pelapor berakun di riwayatnya.
6. `POST /laporan` mendapat pembatasan laju (rate limit) dan validasi Zod yang ketat.

### Isi tab per kelompok (disetujui)
- **Tamu:** Beranda (landing + bencana terkini), Peta, +, Bantuan, Masuk.
- **Pelapor berakun:** Beranda, Peta, +, Bantuan, Profil ("Laporan Saya" di dalam Profil).
- **Relawan:** Beranda = dashboard tugas yang sudah ada, Peta, +, Bantuan, Profil.
- **Donatur:** Beranda (bencana aktif), Peta (menggantikan Lokasi), +, Bantuan, Profil (Riwayat Donasi di dalamnya).

## 8. Backlog (tidak dikerjakan)

Halaman rekrutmen relawan · Peringatan Dini · Minta Bantuan · login Google/Apple · pencarian global · notifikasi, favorit, FAQ · mode gelap (belum ada di token).
**Celah logika terpisah:** calon relawan belum punya jalur mendaftar mandiri (role hanya dari admin, form baru terbuka setelah jadi relawan).

## 9. Rencana kerja

| Fase | Isi | Gerbang |
|---|---|---|
| 0. Audit layar | **Selesai** | — |
| 0b. Audit data Bagian B | **Selesai** (bagian 13) | Keputusan terbuka dijawab |
| S. Perbaikan keamanan | Proyeksi field aman, pembatasan akses, KTP privat, rate limit, Zod ketat, validasi donasi, hapus data karangan, alur migrasi | Diff per item; migrasi hanya ke database dev |
| 1. Fondasi (A) | Skala tipografi + token, ubah komentar `theme.ts`, pindah hex hardcode, komponen inti. Diterapkan ke **satu layar**: Beranda donatur | Dilihat di HP, disetujui |
| 2–4. Redesign (A) | Alur Donatur → Tamu & Pelapor → Relawan & Transparansi | Review per layar |
| 5. Layar baru (B) | Urutan: Kebutuhan → Wizard Lapor v2 (ketuk, GPS, data korban; migrasi kolom) → Peta → Riwayat Donasi + Profil → Distribusi (terakhir: migrasi tabel, endpoint admin, form admin di web, layar mobile) → pasang navigasi 5 tab | Review per layar; endpoint dan migrasi baru ditinjau dulu |
| 6. QA | Paritas layar, kontras, touch target, perangkat fisik | Kriteria bagian 11 |

Aturan kerja: satu layar atau alur per commit, diff ditunjukkan dulu, Bagian A dan B tidak dicampur dalam satu commit.

## 10. Keputusan

**Sudah diputuskan:** warna (biru/netral + merah urgensi) · referensi (HelpTrack + Cyan) · fitur di bagian 8 ditahan · login (pelapor tamu; relawan, donatur, admin login) · pelapor berakun dipertahankan · layar baru dibuat sekarang (Bagian B) · navigasi 5 tab + tombol Lapor tengah · tab Lokasi/Riwayat diisi (jadi Peta dan Riwayat Donasi) · mode gelap ditunda · desain Claude Design lama digantikan (kecuali ada keberatan) · Distribusi memakai tabel tahapan baru + input admin di web · isi tab per kelompok disetujui · urutan: Bagian A dulu, lalu B · Peta memakai koordinat yang ditetapkan pelapor di wizard · pin publik hanya setelah diverifikasi admin · Distribusi rinci per item kebutuhan · wizard lapor mobile berbasis ketuk (bukan ketik) dan menambah data korban per kelompok · lima kelompok korban (pria, wanita, balita, anak, lansia), arti korban = terdampak per kelompok · nomor HP pelapor wajib · foto KTP pelapor wajib · kebocoran data diperbaiki dulu sebagai Fase S.

**Masih terbuka (harus dijawab sebelum Fase 5; tidak menghalangi Fase S dan Fase 1):**
1. KTP: foto saja (usulan), atau foto + NIK diketik?
2. Pengecualian bagi yang tidak punya KTP (wisatawan asing: paspor/kartu identitas lain; pelapor yang kehilangan dokumen): boleh unggah dokumen lain, atau tetap KTP saja?
3. Pelapor berakun: KTP per laporan, atau sekali lalu tersimpan di akun (butuh kolom dan penyimpanan di akun)?
4. Masa simpan foto KTP: usulan dihapus 30 hari setelah verifikasi.
5. Aturan KTP di server berlaku untuk semua pengirim sehingga form web ikut menambah unggah KTP (usulan), atau hanya mobile?
6. Riwayat pelapor: tambah `user_id` di `laporan` + `GET /laporan/saya` (Fase S item S10), atau sembunyikan layar riwayat sementara?
7. Metode bayar: cukup tampilan (donasi tercatat "menunggu", admin mencocokkan transfer), atau disimpan / diintegrasikan dengan gateway?
8. Peta di web (Expo web): perlu versi pengganti dengan Leaflet, atau Peta hanya untuk HP?

## 11. Kriteria selesai

- Bagian A: setiap layar bagian 3 punya padanan baru; tidak ada layar/aksi hilang atau bertambah; tidak ada perubahan auth atau `RoleGuard` (wizard lapor ditangani di Bagian B).
- Bagian B: setiap layar baru memakai data nyata dari backend; **tidak ada nama atau kontak pelapor** di endpoint/tampilan publik; tidak ada data dummy tampil sebagai nyata.
- Koordinat dari wizard tersimpan ke `koordinat_lat/lng`, divalidasi server, dan pin tampil di Peta sesuai kebijakan verifikasi; `POST /laporan` punya rate limit.
- Wizard Lapor v2 bisa diselesaikan hanya dengan ketukan (mengetik hanya opsional); total terdampak dihitung server dari jumlah per kelompok; kolom baru default 0 sehingga form web lama tidak rusak; draft tidak hilang saat sinyal buruk; laporan yang dikirim tetap lewat `POST /laporan` yang sama.
- Foto KTP: tersimpan privat, tidak ada di endpoint publik mana pun (diuji dengan memanggil tiap endpoint publik tanpa login), hanya admin yang bisa membukanya, tidak masuk galeri perangkat, ada aturan masa simpan.
- Migrasi tabel distribusi diuji di database dev (bukan production); endpoint tulisnya hanya untuk admin.
- Tidak ada ukuran huruf atau warna hardcode baru; komentar "FIXED merah/oranye" di `theme.ts` sudah diganti.
- `tsc --noEmit` dan `expo export` lolos.
- Kontras 4.5:1, touch target 44 pt, status tidak hanya warna.
- Diuji di perangkat fisik: satu skenario penuh per kelompok (tamu, pelapor, relawan, donatur).

## 12. Risiko

| Risiko | Mitigasi |
|---|---|
| Peta/daftar publik membocorkan nama & kontak pelapor | Proyeksi field aman di endpoint; dicek di Fase 0b dan QA |
| Distribusi menampilkan progres karangan di app donasi | Hanya data nyata; bila tidak ada sumbernya, layar ini ditunda |
| Layar Riwayat Donasi kosong karena donasi belum tersimpan | Dicek di Fase 0b: donasi sudah tersimpan (bagian 13) |
| Sesi berikutnya mengembalikan warna merah dari komentar lama `theme.ts` | Ubah komentar di Fase 1, catat keputusan di dokumen proyek |
| Merombak `LaporanWizard` (647 baris) memutus pengiriman laporan | Dikerjakan sebagai Wizard Lapor v2 di Bagian B; uji lapor end-to-end sebelum dan sesudah; kirim tetap lewat `POST /laporan` yang sama |
| Total terdampak tidak cocok dengan jumlah per kelompok | Server menghitung `jumlah_terdampak` dari kolom per kelompok |
| Data korban dianggap data pribadi | Hanya angka agregat, tanpa nama; tidak ada identitas korban di UI publik |
| Foto KTP pelapor bocor (data pribadi sensitif, endpoint unggah publik) | Penyimpanan privat + tautan sementara untuk admin, tidak ada di proyeksi publik, batas ukuran/tipe, rate limit, masa simpan |
| Syarat KTP membuat orang enggan atau tidak bisa melapor (wisatawan asing, kehilangan dokumen) | Keputusan terbuka #2; pin publik tetap hanya setelah verifikasi sehingga laporan tetap bisa masuk |
| KTP hanya diwajibkan di mobile, form web menjadi jalan pintas | Aturan di server untuk semua pengirim; form web ikut diubah |
| Bagian B melebar jadi pengerjaan fitur besar | Gerbang per layar; Distribusi paling akhir |
| Pustaka peta butuh kunci Google Maps untuk build rilis Android | `react-native-maps` ada di Expo Go SDK 57; kunci Android diisi di `app.json` saat build rilis |
| Pelapor tanpa login mengirim titik palsu/spam yang langsung tampil di peta publik | Pin publik hanya setelah verifikasi admin, rate limit, validasi server |
| Titik GPS pelapor bukan lokasi kejadian | Pin bisa digeser pelapor; admin bisa mengoreksi saat verifikasi |
| Koordinat tepat memperlihatkan lokasi rumah atau orang | Tidak ada nama/kontak di endpoint publik; kebijakan tampil dibahas di keputusan terbuka |
| Migrasi tabel baru dijalankan ke database production saat uji | Uji migrasi di database dev terpisah; production hanya setelah disetujui |

---

## 13. Hasil Fase 0b — audit data (2026-10-27, read-only)

### 13.1 Wizard lapor mobile
- Payload `POST /laporan` (`artifacts/mobile/src/components/LaporanWizard.tsx:218-232`): judul (otomatis), jenis, lokasi, `koordinat_lat/lng`, deskripsi, nama, kontak, `jumlah_terdampak` (satu angka), `foto_urls`, `foto_ktp_url`.
- Koordinat **sudah dikirim** dari GPS (`expo-location`, `:120-127`) + reverse-geocode. Belum ada peta geser pin.
- Foto diunggah via `POST /api/uploads` (`src/lib/upload.ts:43`) ke bucket Supabase `laporan-images`; database menyimpan URL publik (`api-server/src/routes/uploads.ts:47-55`).
- Foto KTP sudah ada tapi **opsional** (`:200`), bisa dari kamera atau galeri.
- Tidak ada draft lokal; wizard tidak mengirim kebutuhan.

### 13.2 Validasi `POST /laporan`
- Zod `CreateLaporanBody` (`api-server/src/routes/bencana/laporan.ts:22`, `lib/api-zod/src/generated/api.ts:64-78`) hanya cek tipe: tanpa batas panjang, tanpa rentang koordinat, URL foto bebas.
- `status` tidak ada di schema (aman).
- **Tidak ada rate limit** di endpoint mana pun, termasuk `/uploads` publik (8 MB × 6 file per request).

### 13.3 Data sensitif di endpoint publik / login-apa-saja

| Endpoint | Akses | Data sensitif yang ikut |
|---|---|---|
| `GET /transparansi/laporan` | Publik | foto_ktp_url, nama & kontak pelapor, catatan_admin; donasi: nama & kontak donatur, bukti_transfer_url, user_id |
| `GET /laporan/:id` | Publik, semua status | nama & kontak pelapor, jabatan, catatan_admin, koordinat (KTP dibuang) |
| `GET /donatur/bencana-aktif` | Login apa saja | foto_ktp_url, nama & kontak pelapor |
| `GET /relawan/:id` | Login apa saja, ID siapa pun | NIK, no HP, alamat, foto KTP relawan |
| `GET /relawan/cek-email` | Login apa saja, email siapa pun | sama |
| `GET /penugasan` | Login apa saja | semua penugasan (risiko rendah) |
| `GET /laporan/aktif` | Publik | aman |
| `GET /dashboard/statistik` | Publik | aman (agregat) |

Foto KTP berada di bucket **publik**: siapa pun yang memegang URL bisa membukanya.

### 13.4 Kebutuhan
Belum ada endpoint lintas lokasi (hanya `GET /laporan/:id/kebutuhan`, wajib login). Kategori: `pangan, sandang, medis, tempat_tinggal, air_bersih, lainnya` (`bencana-bali/src/pages/admin/AdminLaporanDetail.tsx:24`); kolom DB teks bebas.

### 13.5 Donasi
- Tersimpan sungguhan via `POST /donasi` (status `menunggu`); admin menerima/menolak di web.
- Metode bayar hanya tampilan; tidak ada gateway, tidak ada unggah bukti dari mobile.
- Donasi barang mobile tidak mengirim `kebutuhan_id`; backend menerima `kebutuhan_id` tanpa validasi.
- `total_dana_terkumpul` menghitung semua donasi termasuk menunggu/ditolak.
- Belum ada endpoint riwayat donasi per donatur (`user_id` sudah tersimpan).

### 13.6 KTP
- KTP relawan (mobile & web) hanya isian teks "Link Google Drive".
- KTP pelapor di bucket publik; butuh mekanisme baru: bucket privat, simpan path, signed URL khusus admin, pindahkan file lama.

### 13.7 Peta
Belum ada pustaka peta di mobile (Leaflet hanya di web). `react-native-maps` termasuk Expo Go SDK 57; rilis Android butuh Google Maps API key (`androidGoogleMapsApiKey`). `react-native-maps` tidak mendukung web → perlu pengganti `.web.tsx` bila Peta dipakai di Expo web.

### 13.8 Web admin
Kebutuhan di `AdminLaporanDetail.tsx:313-380` (form tambah `:329-352`, progres `:356`, daftar per item `:357`). Form tahapan distribusi paling pas sebagai baris yang bisa dibuka per item. Web memakai hook Orval → endpoint baru butuh update `lib/api-spec` + codegen.

### 13.9 Skema & migrasi
- `laporan` sudah punya `foto_ktp_url`, `jabatan_pelapor`, `lokasi_pengungsian`, `kronologi`, `target_dana`; **tidak punya `user_id`**.
- Migrasi hanya `drizzle-kit push` / `push-force`, tanpa file migrasi/riwayat/rollback; `DATABASE_URL` menunjuk satu-satunya project Supabase.
- Kolom `terdampak_*` dan tabel `distribusi` bersifat menambah; tetap diuji di database dev.

### 13.10 Bertentangan dengan PRD
1. Riwayat pelapor berakun tidak berfungsi: `mobile/app/pelapor/index.tsx:14` memanggil `GET /laporan` (khusus admin → 403), dan `laporan` tidak punya `user_id`.
2. Kebocoran data pribadi sudah terjadi sekarang (13.3).
3. GPS dan foto KTP sudah ada; yang belum: geser pin, KTP wajib, KTP privat, larangan galeri.
4. Data karangan: `foto_penyerahan` Unsplash (`transparansi.ts:61-86`) dan daftar posko hardcoded (`donatur.ts:12-17`).
5. Dana terkumpul ikut menghitung donasi yang belum/tidak diterima.
6. Belum ada database dev.
