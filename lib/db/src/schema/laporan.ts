import { pgTable, text, serial, timestamp, integer, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const laporanTable = pgTable("laporan", {
  id: serial("id").primaryKey(),
  judul: text("judul").notNull(),
  jenis_bencana: text("jenis_bencana").notNull(),
  lokasi: text("lokasi").notNull(),
  koordinat_lat: real("koordinat_lat"),
  koordinat_lng: real("koordinat_lng"),
  deskripsi: text("deskripsi").notNull(),
  nama_pelapor: text("nama_pelapor").notNull(),
  kontak_pelapor: text("kontak_pelapor").notNull(),
  jabatan_pelapor: text("jabatan_pelapor"),
  jumlah_terdampak: integer("jumlah_terdampak"),
  // Rincian warga terdampak per kelompok (wizard lapor v2). Hanya angka, tanpa
  // nama korban. jumlah_terdampak dihitung server dari kolom-kolom ini bila diisi.
  terdampak_pria: integer("terdampak_pria").notNull().default(0),
  terdampak_wanita: integer("terdampak_wanita").notNull().default(0),
  terdampak_anak: integer("terdampak_anak").notNull().default(0),
  terdampak_balita: integer("terdampak_balita").notNull().default(0),
  terdampak_lansia: integer("terdampak_lansia").notNull().default(0),
  lokasi_pengungsian: text("lokasi_pengungsian"),
  foto_urls: json("foto_urls").$type<string[]>().default([]),
  // Lama: URL publik (dipindah ke bucket privat oleh scripts/pindah-ktp, lalu dikosongkan).
  foto_ktp_url: text("foto_ktp_url"),
  // S4: path objek di bucket privat "ktp-privat" — admin membukanya lewat signed URL.
  foto_ktp_path: text("foto_ktp_path"),
  kronologi: text("kronologi"),
  target_dana: integer("target_dana"),
  // S10: akun pelapor (null untuk laporan tanpa akun) — untuk riwayat "Laporan saya".
  user_id: integer("user_id"),
  status: text("status").notNull().default("menunggu"),
  catatan_admin: text("catatan_admin"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }),
});

export const insertLaporanSchema = createInsertSchema(laporanTable).omit({ id: true, created_at: true });
export type InsertLaporan = z.infer<typeof insertLaporanSchema>;
export type Laporan = typeof laporanTable.$inferSelect;
