import { Router } from "express";
import { db } from "@workspace/db";
import { laporanTable, kebutuhanTable, inventarisTable, penugasanTable, relawanTable, donasiTable } from "@workspace/db/schema";
import { eq, ne } from "drizzle-orm";
import { publicLaporan, publicDonasi } from "../../lib/publicFields";

const router = Router();

router.get("/transparansi/laporan", async (req, res) => {
  // Publik — laporan yang masih "menunggu" belum diverifikasi admin, jangan
  // tampil dulu di halaman transparansi. Hanya "terverifikasi" (sedang jalan)
  // dan "selesai" yang tampil.
  const laporan = await db
    .select()
    .from(laporanTable)
    .where(ne(laporanTable.status, "menunggu"))
    .orderBy(laporanTable.created_at);

  const kebutuhan = await db.select().from(kebutuhanTable);
  const penugasan = await db.select().from(penugasanTable);
  // Hanya nama — NIK/HP/alamat/KTP relawan tidak boleh ikut ke endpoint publik.
  const relawan = await db.select({ id: relawanTable.id, nama: relawanTable.nama }).from(relawanTable);
  // Halaman transparansi menjumlahkan daftar ini — hanya donasi yang sudah
  // diterima admin, sama seperti total_dana_terkumpul di /donatur/bencana-aktif.
  const donasi = await db.select().from(donasiTable).where(eq(donasiTable.status, "diterima"));

  const kebutuhanMap: Record<number, typeof kebutuhan> = {};
  for (const k of kebutuhan) {
    if (!kebutuhanMap[k.laporan_id]) kebutuhanMap[k.laporan_id] = [];
    kebutuhanMap[k.laporan_id].push(k);
  }

  const penugasanMap: Record<number, typeof penugasan> = {};
  for (const p of penugasan) {
    if (!penugasanMap[p.laporan_id]) penugasanMap[p.laporan_id] = [];
    penugasanMap[p.laporan_id].push(p);
  }

  const donasiMap: Record<number, typeof donasi> = {};
  for (const d of donasi) {
    const lid = d.laporan_id;
    if (lid == null) continue;
    if (!donasiMap[lid]) donasiMap[lid] = [];
    donasiMap[lid].push(d);
  }

  const result = laporan.reverse().map(l => {
    const pug = penugasanMap[l.id] || [];
    const relawanNama = pug
      .map(p => relawan.find(r => r.id === p.relawan_id)?.nama)
      .filter(Boolean);

    return {
      ...publicLaporan(l),
      kebutuhan: kebutuhanMap[l.id] || [],
      relawan_bertugas: relawanNama,
      donasi: (donasiMap[l.id] || []).map(publicDonasi),
      // Belum ada sumber data foto serah terima — dulu diisi foto Unsplash
      // karangan. Kosong sampai fitur Distribusi (bukti nyata) dibuat.
      foto_penyerahan: [],
    };
  });

  return res.json(result);
});

export default router;
