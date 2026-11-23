import { Router } from "express";
import { db } from "@workspace/db";
import { relawanTable, usersTable } from "@workspace/db/schema";
import { eq, or } from "drizzle-orm";
import { requireAuth, requireRole, getAuthContext } from "../../middlewares/auth";
import { CreateRelawanBody, VerifikasiRelawanBody, GetRelawanQueryParams } from "@workspace/api-zod";
import { isKtpPath, signedKtpUrl } from "../../lib/supabase";

const router = Router();

router.get("/relawan", requireRole(["admin"]), async (req, res) => {
  const query = GetRelawanQueryParams.safeParse(req.query);
  const status_verifikasi = query.success ? query.data.status_verifikasi : undefined;
  const rows = await db.select().from(relawanTable)
    .where(status_verifikasi ? eq(relawanTable.status_verifikasi, status_verifikasi) : undefined)
    .orderBy(relawanTable.created_at);
  // Admin: tautan sementara ke KTP di bucket privat.
  return res.json(await Promise.all(rows.reverse().map(async r => ({ ...r, foto_ktp_signed_url: await signedKtpUrl(r.foto_ktp_path) }))));
});

// Relawan tidak punya user_id FK ke users — pemilik data dicocokkan lewat email
// akun, sama seperti PATCH /penugasan/:id/lapangan.
async function emailAkun(req: any): Promise<string | null> {
  const [user] = await db.select({ email: usersTable.email }).from(usersTable).where(eq(usersTable.id, req.auth.userId));
  return user?.email ?? null;
}

const sameEmail = (a: string | null | undefined, b: string | null | undefined) =>
  !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

router.get("/relawan/cek-email", requireAuth, async (req: any, res) => {
  const { email } = req.query as Record<string, string>;
  if (!email) return res.json({ terdaftar: false });
  // Selain admin hanya boleh mengecek email akunnya sendiri — dulu siapa pun
  // yang login bisa menarik NIK/HP/alamat relawan mana pun lewat email.
  if (req.auth.role !== "admin" && !sameEmail(email, await emailAkun(req))) {
    return res.status(403).json({ message: "Tidak diizinkan" });
  }
  const rows = await db.select().from(relawanTable).where(eq(relawanTable.email, email));
  if (rows.length === 0) return res.json({ terdaftar: false });
  return res.json({ terdaftar: true, relawan: rows[0] });
});

router.post("/relawan", async (req: any, res) => {
  const result = CreateRelawanBody.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Data tidak valid", errors: result.error.flatten() });
  }
  const body = { ...result.data, nama: result.data.nama.trim(), nik: result.data.nik.trim(), no_hp: result.data.no_hp.trim(), alamat: result.data.alamat.trim() };
  if (!body.nama || !body.alamat) return res.status(400).json({ message: "Nama dan alamat wajib diisi." });
  if (!/^\d{16}$/.test(body.nik)) return res.status(400).json({ message: "NIK harus 16 digit angka." });
  if (!/^\+?\d{9,15}$/.test(body.no_hp.replace(/[\s-]/g, ""))) return res.status(400).json({ message: "Nomor HP tidak valid." });
  // Pendaftar yang login (bukan admin): email data relawan = email akunnya.
  // Akses relawan dicocokkan lewat email, jadi email orang lain tidak boleh dipakai.
  const auth = getAuthContext(req);
  if (auth && auth.role !== "admin") {
    const [akun] = await db.select({ email: usersTable.email }).from(usersTable).where(eq(usersTable.id, auth.userId));
    if (akun?.email) body.email = akun.email;
  }
  // S4: KTP relawan juga hanya lewat bucket privat (POST /uploads/ktp).
  if (body.foto_ktp_path && !isKtpPath(body.foto_ktp_path)) {
    return res.status(400).json({ message: "Foto KTP tidak valid. Unggah ulang lewat aplikasi." });
  }

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

router.get("/relawan/:id", requireAuth, async (req: any, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID tidak valid" });
  const [row] = await db.select().from(relawanTable).where(eq(relawanTable.id, id));
  if (!row) return res.status(404).json({ message: "Relawan tidak ditemukan" });
  if (req.auth.role !== "admin" && !sameEmail(row.email, await emailAkun(req))) {
    return res.status(403).json({ message: "Tidak diizinkan" });
  }
  return res.json({ ...row, foto_ktp_signed_url: await signedKtpUrl(row.foto_ktp_path) });
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
