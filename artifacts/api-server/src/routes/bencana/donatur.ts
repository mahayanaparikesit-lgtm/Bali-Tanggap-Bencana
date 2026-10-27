import { Router } from "express";
import { db } from "@workspace/db";
import { laporanTable, kebutuhanTable, relawanTable, penugasanTable, donasiTable, insertDonasiSchema } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { UpdateDonasiBody } from "@workspace/api-zod";

const router = Router();

const publicDonasiSchema = insertDonasiSchema.omit({ user_id: true });

const POSKO_UTAMA = [
  { nama: "Posko Utama BPBD Bali", alamat: "Jl. D.I. Panjaitan No.5, Renon, Denpasar Selatan", kontak: "0361-222666", kota: "Denpasar" },
  { nama: "Posko Relawan Gianyar", alamat: "Jl. Ngurah Rai No.12, Gianyar", kontak: "0361-943111", kota: "Gianyar" },
  { nama: "Posko Bangli", alamat: "Jl. Brigjen Ngurah Rai No.2, Bangli", kontak: "0366-91016", kota: "Bangli" },
  { nama: "Posko Tabanan", alamat: "Jl. Pahlawan No.1, Tabanan", kontak: "0361-811410", kota: "Tabanan" },
];

router.get("/donatur/bencana-aktif", requireAuth, async (req, res) => {
  // Hanya tampilkan laporan yang sudah diverifikasi admin
  const rows = await db
    .select()
    .from(laporanTable)
    .where(eq(laporanTable.status, "terverifikasi"))
    .orderBy(laporanTable.created_at);

  if (rows.length === 0) return res.json([]);

  const [kebutuhanRows, penugasanRows, donasiRows] = await Promise.all([
    db.select().from(kebutuhanTable),
    db.select({ laporan_id: penugasanTable.laporan_id, relawan_id: penugasanTable.relawan_id })
      .from(penugasanTable).where(eq(penugasanTable.status, "aktif")),
    db.select({
      laporan_id: donasiTable.laporan_id,
      jenis: donasiTable.jenis,
      jumlah_dana: donasiTable.jumlah_dana,
    }).from(donasiTable),
  ]);

  const relawanIds = [...new Set(penugasanRows.map(p => p.relawan_id).filter(Boolean) as number[])];
  const koordinatorMap: Record<number, string> = {};

  if (relawanIds.length > 0) {
    const relawanRows = await db.select().from(relawanTable);
    for (const p of penugasanRows) {
      if (p.relawan_id && !koordinatorMap[p.laporan_id]) {
        const rel = relawanRows.find(r => r.id === p.relawan_id);
        if (rel) koordinatorMap[p.laporan_id] = rel.nama;
      }
    }
  }

  const kebutuhanByLaporan: Record<number, typeof kebutuhanRows> = {};
  for (const k of kebutuhanRows) {
    if (!kebutuhanByLaporan[k.laporan_id]) kebutuhanByLaporan[k.laporan_id] = [];
    kebutuhanByLaporan[k.laporan_id].push(k);
  }

  // Hitung total dana terkumpul per laporan
  const danaTerkumpulMap: Record<number, number> = {};
  for (const d of donasiRows) {
    if (d.laporan_id && d.jenis === "dana" && d.jumlah_dana) {
      danaTerkumpulMap[d.laporan_id] = (danaTerkumpulMap[d.laporan_id] || 0) + d.jumlah_dana;
    }
  }

  const result = rows.reverse().map(r => ({
    ...r,
    kebutuhan: kebutuhanByLaporan[r.id] || [],
    koordinator: koordinatorMap[r.id] || null,
    posko: POSKO_UTAMA,
    total_dana_terkumpul: danaTerkumpulMap[r.id] || 0,
  }));

  return res.json(result);
});

router.post("/donasi", requireAuth, async (req, res) => {
  const result = publicDonasiSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Data tidak valid", errors: result.error.flatten() });
  }
  const data = result.data;
  const auth = (req as any).auth;
  const [row] = await db.insert(donasiTable).values({
    ...data,
    user_id: auth?.userId ?? null,
  }).returning();

  // Jika donasi barang terkait kebutuhan tertentu, tambah jumlah_terpenuhi
  const kebutuhan_id = typeof req.body.kebutuhan_id === "number" ? req.body.kebutuhan_id : undefined;
  if (kebutuhan_id && data.jumlah_barang && data.jenis === "barang") {
    await db.update(kebutuhanTable)
      .set({ jumlah_terpenuhi: sql`jumlah_terpenuhi + ${data.jumlah_barang}` })
      .where(eq(kebutuhanTable.id, kebutuhan_id));
  }

  return res.status(201).json(row);
});

router.get("/donasi", requireRole(["admin"]), async (req, res) => {
  const rows = await db.select().from(donasiTable).orderBy(donasiTable.created_at);
  return res.json(rows.reverse());
});

// Admin menerima/menolak donasi (dana atau barang) yang masih "menunggu".
router.patch("/donasi/:id", requireRole(["admin"]), async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID tidak valid" });

  const result = UpdateDonasiBody.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Data tidak valid", errors: result.error.flatten() });
  }

  const [updated] = await db.update(donasiTable)
    .set({ status: result.data.status })
    .where(eq(donasiTable.id, id))
    .returning();

  if (!updated) return res.status(404).json({ message: "Donasi tidak ditemukan" });
  return res.json(updated);
});

export default router;
