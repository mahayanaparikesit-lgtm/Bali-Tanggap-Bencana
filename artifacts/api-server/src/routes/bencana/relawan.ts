import { Router } from "express";
import { db } from "@workspace/db";
import { relawanTable } from "@workspace/db/schema";
import { eq, or } from "drizzle-orm";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { CreateRelawanBody, VerifikasiRelawanBody, GetRelawanQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/relawan", requireRole(["admin"]), async (req, res) => {
  const query = GetRelawanQueryParams.safeParse(req.query);
  const status_verifikasi = query.success ? query.data.status_verifikasi : undefined;
  const rows = await db.select().from(relawanTable)
    .where(status_verifikasi ? eq(relawanTable.status_verifikasi, status_verifikasi) : undefined)
    .orderBy(relawanTable.created_at);
  return res.json(rows.reverse());
});

router.get("/relawan/cek-email", requireAuth, async (req, res) => {
  const { email } = req.query as Record<string, string>;
  if (!email) return res.json({ terdaftar: false });
  const rows = await db.select().from(relawanTable).where(eq(relawanTable.email, email));
  if (rows.length === 0) return res.json({ terdaftar: false });
  return res.json({ terdaftar: true, relawan: rows[0] });
});

router.post("/relawan", async (req, res) => {
  const result = CreateRelawanBody.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Data tidak valid", errors: result.error.flatten() });
  }
  const body = result.data;

  // Cegah duplikat berdasarkan NIK atau email
  const existing = await db.select().from(relawanTable).where(
    body.email
      ? or(eq(relawanTable.nik, body.nik), eq(relawanTable.email, body.email))
      : eq(relawanTable.nik, body.nik)
  );

  if (existing.length > 0) {
    const dup = existing[0];
    const byNik = dup.nik === body.nik;
    return res.status(409).json({
      message: byNik
        ? "NIK ini sudah terdaftar sebagai relawan. Silakan hubungi admin jika ada kesalahan."
        : "Email ini sudah terdaftar sebagai relawan. Silakan login dengan akun yang sama.",
      relawan_id: dup.id,
    });
  }

  const [row] = await db.insert(relawanTable).values(body).returning();
  return res.status(201).json(row);
});

router.get("/relawan/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID tidak valid" });
  const [row] = await db.select().from(relawanTable).where(eq(relawanTable.id, id));
  if (!row) return res.status(404).json({ message: "Relawan tidak ditemukan" });
  return res.json(row);
});

const handleVerifikasiRelawan = async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID tidak valid" });

  const result = VerifikasiRelawanBody.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Data tidak valid", errors: result.error.flatten() });
  }

  const [updated] = await db.update(relawanTable)
    .set({
      status_verifikasi: result.data.status_verifikasi,
      catatan_verifikasi: result.data.catatan_verifikasi ?? null,
    })
    .where(eq(relawanTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ message: "Relawan tidak ditemukan" });
  return res.json(updated);
};

router.put("/relawan/:id/verifikasi", requireRole(["admin"]), handleVerifikasiRelawan);
router.patch("/relawan/:id/verifikasi", requireRole(["admin"]), handleVerifikasiRelawan);

export default router;
