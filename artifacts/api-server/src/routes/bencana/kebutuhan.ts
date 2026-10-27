import { Router } from "express";
import { db } from "@workspace/db";
import { kebutuhanTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { CreateKebutuhanBody, UpdateKebutuhanBody } from "@workspace/api-zod";

const router = Router();

router.get("/laporan/:id/kebutuhan", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID tidak valid" });
  const rows = await db.select().from(kebutuhanTable).where(eq(kebutuhanTable.laporan_id, id));
  return res.json(rows);
});

router.post("/laporan/:id/kebutuhan", requireRole(["admin"]), async (req, res) => {
  const laporan_id = parseInt(req.params.id);
  if (isNaN(laporan_id)) return res.status(400).json({ message: "ID tidak valid" });

  const result = CreateKebutuhanBody.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Data tidak valid", errors: result.error.flatten() });
  }

  const [row] = await db.insert(kebutuhanTable).values({ ...result.data, laporan_id }).returning();
  return res.status(201).json(row);
});

const handleUpdateKebutuhan = async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID tidak valid" });

  const result = UpdateKebutuhanBody.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Data tidak valid", errors: result.error.flatten() });
  }

  const [updated] = await db.update(kebutuhanTable)
    .set({ jumlah_terpenuhi: result.data.jumlah_terpenuhi })
    .where(eq(kebutuhanTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ message: "Kebutuhan tidak ditemukan" });
  return res.json(updated);
};

router.put("/kebutuhan/:id", requireRole(["admin"]), handleUpdateKebutuhan);
router.patch("/kebutuhan/:id", requireRole(["admin"]), handleUpdateKebutuhan);

export default router;
