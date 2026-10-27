import { Router } from "express";
import { db } from "@workspace/db";
import { inventarisTable, transaksiInventarisTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "../../middlewares/auth";
import { CreateInventarisBody, UpdateInventarisBody, CreateTransaksiInventarisBody } from "@workspace/api-zod";

const router = Router();

router.get("/inventaris", requireRole(["admin"]), async (req, res) => {
  const rows = await db.select().from(inventarisTable).orderBy(inventarisTable.nama_barang);
  return res.json(rows);
});

router.post("/inventaris", requireRole(["admin"]), async (req, res) => {
  const result = CreateInventarisBody.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Data tidak valid", errors: result.error.flatten() });
  }
  const { stok_awal, ...data } = result.data;
  const [row] = await db.insert(inventarisTable).values({
    ...data,
    stok_masuk: stok_awal,
    stok_keluar: 0,
    stok_sisa: stok_awal,
  }).returning();
  if (stok_awal > 0) {
    await db.insert(transaksiInventarisTable).values({
      inventaris_id: row.id,
      jenis: "masuk",
      jumlah: stok_awal,
      keterangan: "Stok awal",
    });
  }
  return res.status(201).json(row);
});

const handleUpdateInventaris = async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID tidak valid" });

  const result = UpdateInventarisBody.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Data tidak valid", errors: result.error.flatten() });
  }

  const [updated] = await db.update(inventarisTable)
    .set({ ...result.data, updated_at: new Date() })
    .where(eq(inventarisTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ message: "Inventaris tidak ditemukan" });
  return res.json(updated);
};

router.put("/inventaris/:id", requireRole(["admin"]), handleUpdateInventaris);
router.patch("/inventaris/:id", requireRole(["admin"]), handleUpdateInventaris);

router.post("/inventaris/:id/transaksi", requireRole(["admin"]), async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID tidak valid" });

  const result = CreateTransaksiInventarisBody.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Data tidak valid", errors: result.error.flatten() });
  }
  const body = result.data;

  const [inventaris] = await db.select().from(inventarisTable).where(eq(inventarisTable.id, id));
  if (!inventaris) return res.status(404).json({ message: "Inventaris tidak ditemukan" });
  const [transaksi] = await db.insert(transaksiInventarisTable).values({
    inventaris_id: id,
    jenis: body.jenis,
    jumlah: body.jumlah,
    keterangan: body.keterangan,
    laporan_id: body.laporan_id ?? null,
  }).returning();
  const newMasuk = body.jenis === "masuk" ? inventaris.stok_masuk + body.jumlah : inventaris.stok_masuk;
  const newKeluar = body.jenis === "keluar" ? inventaris.stok_keluar + body.jumlah : inventaris.stok_keluar;
  await db.update(inventarisTable)
    .set({ stok_masuk: newMasuk, stok_keluar: newKeluar, stok_sisa: newMasuk - newKeluar, updated_at: new Date() })
    .where(eq(inventarisTable.id, id));
  return res.status(201).json(transaksi);
});

router.get("/inventaris/:id/transaksi", requireRole(["admin"]), async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID tidak valid" });
  const rows = await db.select().from(transaksiInventarisTable)
    .where(eq(transaksiInventarisTable.inventaris_id, id))
    .orderBy(transaksiInventarisTable.created_at);
  return res.json(rows.reverse());
});

export default router;
