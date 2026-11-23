import { Router } from "express";
import { db } from "@workspace/db";
import { penugasanTable, relawanTable, usersTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole, getAuthContext } from "../../middlewares/auth";
import { CreatePenugasanBody, UpdatePenugasanBody, GetPenugasanQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/penugasan", requireAuth, async (req: any, res) => {
  const query = GetPenugasanQueryParams.safeParse(req.query);
  const { laporan_id } = req.query as Record<string, string>;

  const conditions = [];
  if (query.success && query.data.status) conditions.push(eq(penugasanTable.status, query.data.status));
  if (query.success && query.data.relawan_id !== undefined) conditions.push(eq(penugasanTable.relawan_id, query.data.relawan_id));
  if (laporan_id && !isNaN(parseInt(laporan_id))) conditions.push(eq(penugasanTable.laporan_id, parseInt(laporan_id)));

  const rows = await db.select().from(penugasanTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(penugasanTable.created_at);
  if (req.auth.role === "admin") return res.json(rows.reverse());

  // Non-admin hanya boleh melihat link grup / QR / catatan penugasannya sendiri —
  // dulu link grup WhatsApp relawan lain ikut terkirim ke semua akun yang login.
  // Identitas relawan dicocokkan lewat email, sama seperti PATCH /lapangan.
  const [user] = await db.select({ email: usersTable.email }).from(usersTable).where(eq(usersTable.id, req.auth.userId));
  const own = user?.email
    ? await db.select({ id: relawanTable.id }).from(relawanTable).where(eq(relawanTable.email, user.email))
    : [];
  const ownIds = new Set(own.map(r => r.id));
  return res.json(rows.reverse().map(p =>
    ownIds.has(p.relawan_id) ? p : { ...p, link_grup: null, qr_code_url: null, catatan: null }));
});

router.post("/penugasan", requireRole(["admin"]), async (req, res) => {
  const result = CreatePenugasanBody.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Data tidak valid", errors: result.error.flatten() });
  }
  const body = result.data;

  const [relawan] = await db.select({ nama: relawanTable.nama, status_verifikasi: relawanTable.status_verifikasi })
    .from(relawanTable)
    .where(eq(relawanTable.id, body.relawan_id));
  // Relawan kini bisa mendaftar sendiri — tugas hanya untuk yang sudah diverifikasi.
  if (!relawan) return res.status(404).json({ message: "Relawan tidak ditemukan" });
  if (relawan.status_verifikasi !== "terverifikasi") {
    return res.status(409).json({ message: "Relawan ini belum diverifikasi, jadi belum bisa ditugaskan." });
  }
  const [row] = await db.insert(penugasanTable).values({
    laporan_id: body.laporan_id,
    relawan_id: body.relawan_id,
    nama_relawan: relawan?.nama ?? "Relawan",
    detail_tugas: body.detail_tugas,
    lokasi_tugas: body.lokasi_tugas,
    link_grup: body.link_grup ?? null,
    catatan: body.catatan ?? null,
  }).returning();
  return res.status(201).json(row);
});

const handleUpdatePenugasan = async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID tidak valid" });

  const result = UpdatePenugasanBody.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Data tidak valid", errors: result.error.flatten() });
  }

  const [updated] = await db.update(penugasanTable)
    .set(result.data)
    .where(eq(penugasanTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ message: "Penugasan tidak ditemukan" });
  return res.json(updated);
};

router.put("/penugasan/:id", requireRole(["admin"]), handleUpdatePenugasan);
router.patch("/penugasan/:id", requireRole(["admin"]), handleUpdatePenugasan);

// Update terbatas oleh relawan sendiri (bukan admin) untuk penugasan miliknya —
// dipisah dari PATCH admin di atas supaya relawan tidak bisa ubah field lain
// (detail_tugas, lokasi_tugas, dst) atau penugasan relawan lain. Identitas
// relawan dicocokkan lewat email (relawan tidak punya user_id FK ke users).
// Validasi manual (bukan zod) karena api-server tidak punya zod sebagai
// dependency langsung — route lain di sini selalu pakai skema generated dari
// @workspace/api-zod, yang tidak mencakup endpoint sempit ini.
router.patch("/penugasan/:id/lapangan", requireAuth, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID tidak valid" });

  const { status, catatan } = req.body ?? {};
  if (status !== undefined && status !== "selesai") {
    return res.status(400).json({ message: "status hanya boleh 'selesai'" });
  }
  if (catatan !== undefined && catatan !== null && (typeof catatan !== "string" || catatan.length > 500)) {
    return res.status(400).json({ message: "catatan harus teks maksimal 500 karakter" });
  }
  const patch: { status?: "selesai"; catatan?: string | null } = {};
  if (status !== undefined) patch.status = status;
  if (catatan !== undefined) patch.catatan = catatan;

  const auth = getAuthContext(req)!;
  const [user] = await db.select({ email: usersTable.email }).from(usersTable).where(eq(usersTable.id, auth.userId));
  if (!user) return res.status(401).json({ message: "Belum login" });

  const [relawan] = await db.select({ id: relawanTable.id }).from(relawanTable).where(eq(relawanTable.email, user.email));
  if (!relawan) return res.status(403).json({ message: "Akun ini belum terhubung ke data relawan" });

  const [existing] = await db.select({ relawan_id: penugasanTable.relawan_id }).from(penugasanTable).where(eq(penugasanTable.id, id));
  if (!existing) return res.status(404).json({ message: "Penugasan tidak ditemukan" });
  if (existing.relawan_id !== relawan.id) return res.status(403).json({ message: "Bukan penugasan Anda" });

  const [updated] = await db.update(penugasanTable)
    .set(patch)
    .where(eq(penugasanTable.id, id))
    .returning();
  return res.json(updated);
});

export default router;
