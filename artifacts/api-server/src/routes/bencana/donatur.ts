import { Router } from "express";
import { db } from "@workspace/db";
import { laporanTable, kebutuhanTable, relawanTable, penugasanTable, donasiTable, insertDonasiSchema } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { UpdateDonasiBody } from "@workspace/api-zod";
import { publicLaporan } from "../../lib/publicFields";
import { donasiLimiter } from "../../middlewares/rateLimit";

const router = Router();

const publicDonasiSchema = insertDonasiSchema.omit({ user_id: true });

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
    // Hanya donasi yang sudah diterima admin — yang masih "menunggu" belum
    // tentu benar-benar ditransfer, dan yang "ditolak" tidak pernah masuk.
    db.select({
      laporan_id: donasiTable.laporan_id,
      jenis: donasiTable.jenis,
      jumlah_dana: donasiTable.jumlah_dana,
    }).from(donasiTable).where(eq(donasiTable.status, "diterima")),
  ]);

  const relawanIds = [...new Set(penugasanRows.map(p => p.relawan_id).filter(Boolean) as number[])];
  const koordinatorMap: Record<number, string> = {};

  if (relawanIds.length > 0) {
    const relawanRows = await db.select({ id: relawanTable.id, nama: relawanTable.nama }).from(relawanTable);
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
    ...publicLaporan(r),
    kebutuhan: kebutuhanByLaporan[r.id] || [],
    koordinator: koordinatorMap[r.id] || null,
    // Belum ada tabel posko — daftar lama ditulis langsung di kode dan tampil
    // seolah data resmi. Kosong sampai posko dikelola admin.
    posko: [],
    total_dana_terkumpul: danaTerkumpulMap[r.id] || 0,
  }));

  return res.json(result);
});

router.post("/donasi", requireAuth, donasiLimiter, async (req, res) => {
  const result = publicDonasiSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Data tidak valid", errors: result.error.flatten() });
  }
  const data = result.data;
  const auth = (req as any).auth;

  // Jumlah negatif/nol dulu lolos skema — donasi barang negatif bahkan bisa
  // MENGURANGI jumlah_terpenuhi kebutuhan orang lain.
  for (const v of [data.jumlah_dana, data.jumlah_barang]) {
    if (v != null && (!Number.isInteger(v) || v <= 0)) {
      return res.status(400).json({ message: "Jumlah donasi harus bilangan bulat lebih dari 0" });
    }
  }

  // kebutuhan_id wajib ada DAN milik laporan yang sama — sebelumnya diterima
  // apa adanya, jadi siapa pun yang login bisa menaikkan progres kebutuhan mana pun.
  const kebutuhan_id = typeof req.body.kebutuhan_id === "number" ? req.body.kebutuhan_id : undefined;
  if (kebutuhan_id !== undefined) {
    const [keb] = await db.select({ laporan_id: kebutuhanTable.laporan_id }).from(kebutuhanTable).where(eq(kebutuhanTable.id, kebutuhan_id));
    if (!keb || keb.laporan_id !== data.laporan_id) {
      return res.status(400).json({ message: "Kebutuhan tidak ditemukan untuk lokasi ini" });
    }
  }

  // kebutuhan_id hanya disimpan untuk donasi barang. Progres kebutuhan TIDAK
  // ditambah di sini — baru saat admin menerima donasi (PATCH di bawah), sama
  // seperti dana yang baru dihitung setelah diterima.
  const [row] = await db.insert(donasiTable).values({
    ...data,
    kebutuhan_id: data.jenis === "barang" ? kebutuhan_id ?? null : null,
    user_id: auth?.userId ?? null,
  }).returning();

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

  const status = result.data.status;
  const updated = await db.transaction(async tx => {
    const [lama] = await tx.select().from(donasiTable).where(eq(donasiTable.id, id)).for("update");
    if (!lama) return null;
    const [baru] = await tx.update(donasiTable).set({ status }).where(eq(donasiTable.id, id)).returning();

    // Progres kebutuhan mengikuti status "diterima": bertambah saat donasi
    // barang diterima, berkurang lagi bila yang sudah diterima diubah statusnya.
    // Donasi lama (kebutuhan_id null) sudah dihitung saat dikirim — tidak disentuh.
    if (lama.jenis === "barang" && lama.kebutuhan_id && lama.jumlah_barang) {
      const delta = lama.status !== "diterima" && status === "diterima" ? lama.jumlah_barang
        : lama.status === "diterima" && status !== "diterima" ? -lama.jumlah_barang : 0;
      if (delta) {
        await tx.update(kebutuhanTable)
          .set({ jumlah_terpenuhi: sql`greatest(0, jumlah_terpenuhi + ${delta})` })
          .where(eq(kebutuhanTable.id, lama.kebutuhan_id));
      }
    }
    return baru;
  });

  if (!updated) return res.status(404).json({ message: "Donasi tidak ditemukan" });
  return res.json(updated);
});

export default router;
