// Read-only: bandingkan kolom tabel di database dengan 0000_baseline.sql.
// Pakai: DATABASE_URL=... node lib/db/scripts/cek-skema.cjs
const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

const sql = fs.readFileSync(path.join(__dirname, "..", "drizzle", "0000_baseline.sql"), "utf8");
const baseline = {};
for (const m of sql.matchAll(/CREATE TABLE "(\w+)" \(([\s\S]*?)\n\);/g)) {
  baseline[m[1]] = [...m[2].matchAll(/^\s*"(\w+)"/gm)].map(x => x[1]).sort();
}

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const { rows } = await c.query(
    `select table_name, column_name from information_schema.columns where table_schema='public' order by 1,2`);
  const db = {};
  for (const r of rows) (db[r.table_name] ??= []).push(r.column_name);
  let beda = 0;
  for (const [t, cols] of Object.entries(baseline)) {
    const ada = db[t];
    if (!ada) { console.log(`TABEL HILANG: ${t}`); beda++; continue; }
    const kurang = cols.filter(x => !ada.includes(x)), lebih = ada.filter(x => !cols.includes(x));
    if (kurang.length || lebih.length) { beda++; console.log(`${t}: kurang=[${kurang}] lebih=[${lebih}]`); }
  }
  console.log("Tabel lain di DB:", Object.keys(db).filter(t => !baseline[t]).join(", ") || "-");
  const mig = await c.query(`select to_regclass('drizzle.__drizzle_migrations') as t`);
  console.log("Tabel migrasi drizzle:", mig.rows[0].t ?? "belum ada");
  const n = await c.query(`select (select count(*) from laporan) l, (select count(*) from donasi) d, (select count(*) from users) u, (select count(*) from laporan where foto_ktp_url is not null and foto_ktp_url <> '') ktp`);
  console.log("Jumlah baris:", n.rows[0]);
  console.log(beda ? `SELISIH: ${beda} tabel` : "Skema SAMA dengan baseline");
  await c.end();
})().catch(e => { console.error("Gagal:", e.message); process.exit(1); });
