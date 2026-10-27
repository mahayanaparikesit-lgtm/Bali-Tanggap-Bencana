import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

// Perubahan skema lewat file migrasi (generate → periksa SQL → migrate), bukan
// `push`. Lihat docs/migrasi-database.md. `migrate` menulis ke DATABASE_URL —
// pastikan itu database dev sebelum menjalankannya.
export default defineConfig({
  schema: "./src/schema/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});