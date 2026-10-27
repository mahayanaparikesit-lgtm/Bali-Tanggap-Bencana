# Migrasi database (Drizzle)

Mulai Fase S, perubahan skema **tidak lagi** memakai `drizzle-kit push`. `push` langsung mengubah database yang ditunjuk `DATABASE_URL` tanpa file, riwayat, atau rollback, dan `push --force` bisa menghapus kolom. Script `push`/`push-force` sudah dihapus dari `lib/db/package.json`, dan `scripts/post-merge.sh` tidak lagi menjalankan push otomatis setelah merge.

## Alur baru

1. Ubah schema di `lib/db/src/schema/*.ts`.
2. Buat file migrasi (tidak terhubung ke database, aman dijalankan kapan saja):
   ```
   pnpm --filter @workspace/db run generate -- --name <nama-singkat>
   ```
   Perintah ini menulis `lib/db/drizzle/NNNN_<nama>.sql` dan snapshot di `lib/db/drizzle/meta/`.
   `drizzle.config.ts` mewajibkan `DATABASE_URL` terisi; untuk `generate` boleh nilai palsu, misalnya
   `DATABASE_URL=postgresql://x:x@127.0.0.1:1/x`.
3. **Periksa SQL yang dihasilkan.** Waspadai `DROP`, `ALTER ... TYPE`, dan `NOT NULL` tanpa `DEFAULT` pada tabel yang sudah berisi data.
4. Jalankan ke **database dev**:
   ```
   DATABASE_URL=<url database dev> pnpm --filter @workspace/db run migrate
   ```
   `lib/db` tidak membaca `artifacts/api-server/.env`. URL harus diberikan eksplisit, supaya tidak tertukar dengan production.
5. Uji aplikasi terhadap database dev.
6. Commit file migrasi bersama perubahan schema.
7. Production hanya setelah disetujui, dan setelah backup dari dasbor Supabase.

## File migrasi yang ada

| File | Isi |
|---|---|
| `0000_baseline.sql` | Seluruh skema saat Fase S (8 tabel), dihasilkan dari `lib/db/src/schema`. |
| `0001_session_store.sql` | Tabel `session` untuk `connect-pg-simple` (login web). Tidak ada di schema Drizzle; `IF NOT EXISTS`, jadi aman di database yang sudah punya tabelnya. |

## Database dev baru (kosong)

Cukup jalankan `migrate` (langkah 4). Kedua file akan dijalankan dan semua tabel, termasuk `session`, akan terbuat. Lalu isi data contoh:
```
DATABASE_URL=<url database dev> pnpm --filter @workspace/scripts run seed-bencana
```
(Seed mengosongkan semua tabel dulu, jadi **jangan pernah** dijalankan ke production.)

## Database production (sudah ada, dibuat lewat `push`)

Tabelnya sudah ada, jadi `0000_baseline.sql` **tidak boleh dijalankan** di sana karena `CREATE TABLE` akan gagal. Baseline perlu *ditandai* sudah diterapkan. Migrator Drizzle menentukan migrasi mana yang sudah jalan dari kolom `created_at` di tabel `drizzle.__drizzle_migrations`, yang dicocokkan dengan nilai `when` di `drizzle/meta/_journal.json`.

Langkah (belum dijalankan; butuh persetujuan):
1. Backup production dari dasbor Supabase.
2. Pastikan skema production memang sama dengan baseline. Cara read-only: `drizzle-kit pull` ke folder sementara, lalu bandingkan dengan `0000_baseline.sql`. Bila ada selisih, selesaikan dulu sebelum lanjut.
3. Tandai baseline:
   ```sql
   CREATE SCHEMA IF NOT EXISTS drizzle;
   CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
     id SERIAL PRIMARY KEY,
     hash text NOT NULL,
     created_at bigint
   );
   -- created_at = "when" milik 0000_baseline di _journal.json
   INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
   VALUES ('baseline-ditandai-manual', 1793077886235);
   ```
4. Setelah itu `migrate` ke production hanya menjalankan migrasi sesudah baseline (`0001_session_store` tidak mengubah apa pun karena tabelnya sudah ada).

## Catatan

- Jangan mengedit file migrasi yang sudah diterapkan di database mana pun; buat migrasi baru.
- Kolom baru di tabel berisi data: beri `DEFAULT` (contoh `terdampak_* integer NOT NULL DEFAULT 0`), supaya baris lama dan klien lama tetap valid.
