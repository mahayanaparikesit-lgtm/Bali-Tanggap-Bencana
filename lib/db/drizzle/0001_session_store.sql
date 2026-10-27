-- Tabel sesi untuk express-session + connect-pg-simple (app.ts memakai
-- createTableIfMissing: false). Tidak ada di schema Drizzle, jadi dibuat di
-- sini. IF NOT EXISTS: aman dijalankan di database yang sudah punya tabel ini.
-- Struktur mengikuti table.sql bawaan connect-pg-simple.
CREATE TABLE IF NOT EXISTS "session" (
	"sid" varchar NOT NULL PRIMARY KEY,
	"sess" json NOT NULL,
	"expire" timestamp(6) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
