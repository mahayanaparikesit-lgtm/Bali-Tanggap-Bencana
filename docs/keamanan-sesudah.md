# Fase S — hasil uji keamanan (2026-10-27)

Branch `fix/keamanan-data`. Commit S1–S3 dan S5–S9. S4 dan S10 belum dikerjakan (lihat bagian akhir).

## Cara uji

- Semua uji dijalankan ke API lokal yang terhubung ke **database production**. Satu-satunya SQL yang dijalankan adalah `SELECT` untuk mencari ID uji. Tidak ada query tulis.
- Token uji dibuat lokal (JWT ditandatangani dengan secret server) supaya tidak perlu login, sehingga tidak ada baris `session` yang ditulis.
- Kolom sel = kode HTTP; "⚠" diikuti **nama** field sensitif yang ikut terkirim dengan isi tidak kosong. Isi datanya tidak dicatat.
- `relawan_pemilik` = akun yang emailnya sama dengan salah satu data relawan.
- Script: `matrix.mjs` (di luar repo, read-only).

## Matriks sebelum perbaikan

| Endpoint | tamu | donatur | relawan_pemilik | admin |
|---|---|---|---|---|
| GET /transparansi/laporan | 200 ⚠ nama_pelapor, kontak_pelapor, jabatan_pelapor, catatan_admin, nama_donatur, kontak_donatur, user_id | sama | sama | sama |
| GET /laporan/aktif | 200 | 200 | 200 | 200 |
| GET /laporan/:id (menunggu) | 200 ⚠ nama_pelapor, kontak_pelapor | sama | sama | sama |
| GET /laporan/:id (terverifikasi) | 200 ⚠ nama_pelapor, kontak_pelapor, jabatan_pelapor | sama | sama | sama |
| GET /donatur/bencana-aktif | 401 | 200 ⚠ nama_pelapor, kontak_pelapor, jabatan_pelapor, catatan_admin, alamat (posko) | sama | sama |
| GET /laporan/:id/kebutuhan | 401 | 200 | 200 | 200 |
| GET /relawan/:id (milik sendiri) | 401 | 200 ⚠ nik, no_hp, email, alamat, foto_ktp_url | sama | sama |
| GET /relawan/:id (relawan lain) | 401 | 200 ⚠ nik, no_hp, email, alamat, foto_ktp_url | sama | sama |
| GET /relawan/cek-email (email sendiri) | 401 | 200 ⚠ nik, no_hp, email, alamat, foto_ktp_url | sama | sama |
| GET /relawan/cek-email (email orang lain) | 401 | 200 ⚠ nik, no_hp, email, alamat, foto_ktp_url | sama | sama |
| GET /penugasan | 401 | 200 | 200 | 200 |
| GET /dashboard/statistik | 200 | 200 | 200 | 200 |

`foto_ktp_url` pelapor tidak muncul di tabel "sebelum" hanya karena data saat ini kebetulan kosong. Strukturnya tetap ikut terkirim di `/transparansi/laporan` dan `/donatur/bencana-aktif`.

## Matriks sesudah perbaikan

| Endpoint | tamu | donatur | relawan_pemilik | admin |
|---|---|---|---|---|
| GET /transparansi/laporan | 200 ⚠ nama_donatur¹ | 200 ⚠ nama_donatur¹ | 200 ⚠ nama_donatur¹ | 200 ⚠ nama_donatur¹ |
| GET /laporan/aktif | 200 | 200 | 200 | 200 |
| GET /laporan/:id (menunggu) | **404** | **404** | **404** | 200 ⚠ nama_pelapor, kontak_pelapor² |
| GET /laporan/:id (terverifikasi) | 200 | 200 | 200 | 200 ⚠ nama_pelapor, kontak_pelapor, jabatan_pelapor² |
| GET /donatur/bencana-aktif | 401 | 200 | 200 | 200 |
| GET /laporan/:id/kebutuhan | 401 | 200 | 200 | 200 |
| GET /relawan/:id (milik sendiri) | 401 | **403** | 200 ⚠ (data sendiri) | 200 ⚠² |
| GET /relawan/:id (relawan lain) | 401 | **403** | **403** | 200 ⚠² |
| GET /relawan/cek-email (email sendiri) | 401 | **403** | 200 ⚠ (data sendiri) | 200 ⚠² |
| GET /relawan/cek-email (email orang lain) | 401 | **403** | **403** | 200 ⚠² |
| GET /penugasan | 401 | 200 | 200 | 200 |
| GET /dashboard/statistik | 200 | 200 | 200 | 200 |

¹ Disamarkan: nama depan + inisial ("Budi Santoso" → "Budi S."). Aturan final menunggu keputusan.
² Admin memang berhak melihat data lengkap.

## Uji tulis (semua ditolak sebelum menyentuh database)

| Uji | Hasil |
|---|---|
| POST /laporan ×11 dari satu IP | 10× 400, ke-11 **429** |
| POST /uploads ×61 | 60× 400, ke-61 **429** |
| POST /auth/login ×21 | 20× 400, ke-21 **429** |
| POST /laporan koordinat_lat 200 | 400 |
| POST /laporan jumlah_terdampak -5 / 2.5 | 400 / 400 |
| POST /laporan kontak 1 karakter | 400 |
| POST /laporan judul 300 karakter | 400 |
| `isOwnUploadUrl`: URL bucket sendiri / domain lain / `..` / bucket lain | diterima / ditolak / ditolak / ditolak |
| POST /donasi jumlah_barang -50 | 400 |
| POST /donasi jumlah_dana 0 | 400 |
| POST /donasi kebutuhan_id milik laporan lain | 400 |
| POST /donasi kebutuhan_id tidak ada | 400 |

## Typecheck

`pnpm run typecheck` (libs + api-server, bencana-bali, mobile, mockup-sandbox, scripts): lolos.

## Ringkasan perubahan per commit

| Item | Perubahan |
|---|---|
| S1 | Proyeksi field aman (`api-server/src/lib/publicFields.ts`) untuk `/transparansi/laporan` dan `/donatur/bencana-aktif`. |
| S2 | `GET /laporan/:id`: non-admin hanya terverifikasi/selesai (lainnya 404), field aman, penugasan tanpa link grup/QR. |
| S3 | `GET /relawan/:id` dan `/relawan/cek-email`: hanya pemilik (email akun = relawan.email) atau admin. |
| S5 | Rate limit per IP, 15 menit: laporan 10, uploads 60, auth 20, donasi 30. |
| S6 | Zod lebih ketat lewat `openapi.yaml` + codegen; URL foto wajib dari bucket sendiri. |
| S7 | `kebutuhan_id` divalidasi, jumlah donasi > 0, dana terkumpul & daftar donasi transparansi hanya status `diterima`. |
| S8 | Foto Unsplash dan daftar posko hardcoded dihapus; UI menampilkan "Belum ada data posko". |
| S9 | `generate` + `migrate` menggantikan `push`; baseline + tabel session; post-merge tanpa push. Lihat `docs/migrasi-database.md`. |

## Belum dikerjakan

- **S4 (KTP privat)**: butuh kolom baru + bucket privat baru. Kode yang memakai kolom baru akan membuat API error di database yang belum dimigrasi, sedangkan satu-satunya database saat ini adalah production. Menunggu database dev.
- **S10 (riwayat pelapor)**: belum disetujui; juga butuh migrasi.
- **File KTP lama** masih ada di bucket publik `laporan-images` dan tetap bisa dibuka lewat URL-nya sampai dipindah (bagian dari S4).
- `GET /penugasan` masih bisa dibaca semua akun yang login, termasuk `link_grup` dan `qr_code_url` penugasan relawan lain (di luar daftar S, risiko rendah).
