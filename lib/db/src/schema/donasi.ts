import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const donasiTable = pgTable("donasi", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id"),
  laporan_id: integer("laporan_id"),
  jenis: text("jenis").notNull(),
  jumlah_dana: integer("jumlah_dana"),
  nama_barang: text("nama_barang"),
  jumlah_barang: integer("jumlah_barang"),
  nama_donatur: text("nama_donatur").notNull(),
  // Pilihan donatur sendiri: tampilkan nama di halaman publik atau "Anonim".
  // Default false — donasi lama dibuat sebelum pilihan ini ada, jadi tidak
  // pernah menyetujui namanya tampil.
  tampilkan_nama: boolean("tampilkan_nama").notNull().default(false),
  // Kebutuhan yang diisi donasi barang — progres kebutuhan baru bertambah saat
  // admin menerima donasi (PATCH /donasi/:id), bukan saat dikirim.
  kebutuhan_id: integer("kebutuhan_id"),
  kontak_donatur: text("kontak_donatur"),
  pesan: text("pesan"),
  bukti_transfer_url: text("bukti_transfer_url"),
  status: text("status").notNull().default("menunggu"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDonasiSchema = createInsertSchema(donasiTable).omit({ id: true, created_at: true, status: true });
export type InsertDonasi = z.infer<typeof insertDonasiSchema>;
export type Donasi = typeof donasiTable.$inferSelect;
