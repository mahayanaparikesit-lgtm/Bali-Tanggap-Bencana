// Sekali jalan untuk database lama yang dibuat lewat `push`: tandai 0000_baseline
// sudah diterapkan supaya `migrate` hanya menjalankan migrasi sesudahnya.
// Aman diulang — tidak menyisipkan dua kali. Lihat docs/migrasi-database.md.
const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

const journal = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "drizzle", "meta", "_journal.json"), "utf8"));
const when = journal.entries.find(e => e.tag === "0000_baseline").when;

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  await c.query(`CREATE SCHEMA IF NOT EXISTS drizzle`);
  await c.query(`CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)`);
  const ada = await c.query(`select 1 from drizzle.__drizzle_migrations where created_at = $1`, [when]);
  if (ada.rowCount) console.log("Baseline sudah ditandai sebelumnya.");
  else {
    await c.query(`insert into drizzle.__drizzle_migrations (hash, created_at) values ('baseline-ditandai-manual', $1)`, [when]);
    console.log("Baseline ditandai:", when);
  }
  await c.end();
})().catch(e => { console.error("Gagal:", e.message); process.exit(1); });
