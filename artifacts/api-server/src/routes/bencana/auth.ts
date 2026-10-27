import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, insertUserSchema } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireRole, signAuthToken, getAuthContext } from "../../middlewares/auth";
import { authLimiter } from "../../middlewares/rateLimit";

const router = Router();

// Role yang boleh dipilih sendiri lewat registrasi publik. Admin/relawan
// hanya bisa diberikan lewat jalur terproteksi (lihat PATCH /users/:id/role).
const PUBLIC_REGISTER_ROLES = ["pelapor", "donatur"];
const ALL_ROLES = ["admin", "relawan", "donatur", "pelapor"];

router.post("/auth/register", authLimiter, async (req, res) => {
  const requestedRole = PUBLIC_REGISTER_ROLES.includes(req.body?.role) ? req.body.role : "pelapor";
  const result = insertUserSchema.safeParse({ ...req.body, role: requestedRole });
  if (!result.success) {
    return res.status(400).json({ message: "Data tidak valid", errors: result.error.flatten() });
  }
  const { nama, email, password, role } = result.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    return res.status(409).json({ message: "Email sudah terdaftar" });
  }
  const password_hash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ nama, email, password_hash, role }).returning();
  const session = (req as any).session;
  session.userId = user.id;
  session.role = user.role;
  const token = signAuthToken(user.id, user.role);
  return session.save((err: any) => {
    if (err) {
      return res.status(500).json({ message: "Gagal menyimpan sesi" });
    }
    return res.status(201).json({ id: user.id, nama: user.nama, email: user.email, role: user.role, token });
  });
});

router.post("/auth/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email dan password wajib diisi" });
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    return res.status(401).json({ message: "Email atau password salah" });
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ message: "Email atau password salah" });
  }
  const session = (req as any).session;
  session.userId = user.id;
  session.role = user.role;
  const token = signAuthToken(user.id, user.role);
  return session.save((err: any) => {
    if (err) {
      return res.status(500).json({ message: "Gagal menyimpan sesi" });
    }
    return res.json({ id: user.id, nama: user.nama, email: user.email, role: user.role, token });
  });
});

router.post("/auth/logout", (req, res) => {
  // Untuk klien token (mobile), tidak ada state server yang perlu dihapus — klien
  // cukup membuang token yang tersimpan di secure storage. Untuk klien cookie (web),
  // hancurkan session seperti biasa.
  (req as any).session.destroy(() => {
    res.json({ message: "Logout berhasil" });
  });
});

router.get("/auth/me", async (req, res) => {
  const auth = getAuthContext(req);
  if (!auth) {
    return res.status(401).json({ message: "Belum login" });
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, auth.userId));
  if (!user) {
    return res.status(401).json({ message: "User tidak ditemukan" });
  }
  return res.json({ id: user.id, nama: user.nama, email: user.email, role: user.role });
});

router.patch("/users/:id/role", requireRole(["admin"]), async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID tidak valid" });
  const { role } = req.body;
  if (!ALL_ROLES.includes(role)) {
    return res.status(400).json({ message: "Role tidak valid" });
  }
  const [updated] = await db.update(usersTable)
    .set({ role })
    .where(eq(usersTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ message: "User tidak ditemukan" });
  return res.json({ id: updated.id, nama: updated.nama, email: updated.email, role: updated.role });
});

export default router;
