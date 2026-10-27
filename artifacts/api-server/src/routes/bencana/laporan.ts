import { Router } from "express";
import { db } from "@workspace/db";
import { laporanTable, kebutuhanTable, penugasanTable } from "@workspace/db/schema";
import { eq, count } from "drizzle-orm";
import { requireRole, getAuthContext } from "../../middlewares/auth";
import { CreateLaporanBody, UpdateLaporanBody, GetLaporanQueryParams, CreateKebutuhanBody } from "@workspace/api-zod";
import { publicLaporan, publicPenugasan } from "../../lib/publicFields";
import { laporanLimiter } from "../../middlewares/rateLimit";
import { isOwnUploadUrl } from "../../lib/supabase";

const router = Router();

// Status yang sudah diverifikasi admin dan boleh dilihat non-admin.
const PUBLIC_STATUSES = ["terverifikasi", "selesai"];

// Admin-only — daftar mentah termasuk foto_ktp_url & kontak_pelapor. Publik
// pakai /laporan/aktif atau /transparansi/laporan (keduanya kolom terkurasi).
router.get("/laporan", requireRole(["admin"]), async (req, res) => {
  const query = GetLaporanQueryParams.safeParse(req.query);
  const status = query.success ? query.data.status : undefined;
  const rows = await db.select().from(laporanTable)
    .where(status ? eq(laporanTable.status, status) : undefined)
    .orderBy(laporanTable.created_at);
  res.json(rows.reverse());
});

router.post("/laporan", laporanLimiter, async (req, res) => {
  const result = CreateLaporanBody.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Data tidak valid", errors: result.error.flatten() });
  }
  // Foto harus hasil POST /uploads kita sendiri — jangan simpan URL bebas
  // (bisa menunjuk ke konten pihak ketiga yang lalu tampil di halaman publik).
  const fotoAsing = [...(result.data.foto_urls ?? []), result.data.foto_ktp_url]
    .some(u => typeof u === "string" && u !== "" && !isOwnUploadUrl(u));
  if (fotoAsing) {
    return res.status(400).json({ message: "Foto harus diunggah lewat aplikasi, bukan tautan dari luar." });
  }
  const [row] = await db.insert(laporanTable).values(result.data).returning();
  return res.status(201).json(row);
});

router.get("/laporan/aktif", async (req, res) => {
  const rows = await db
    .select({
      id: laporanTable.id,
      judul: laporanTable.judul,
      jenis_bencana: laporanTable.jenis_bencana,
      lokasi: laporanTable.lokasi,
      status: laporanTable.status,
      jumlah_terdampak: laporanTable.jumlah_terdampak,
      created_at: laporanTable.created_at,
    })
    .from(laporanTable)
    // Publik — laporan yang masih "menunggu" belum diverifikasi admin, jangan
    // tampil dulu di landing page.
    .where(eq(laporanTable.status, "terverifikasi"))
    .orderBy(laporanTable.created_at);

  if (rows.length === 0) return res.json([]);

  const kebutuhanCounts = await db
    .select({
      laporan_id: kebutuhanTable.laporan_id,
      cnt: count(),
    })
    .from(kebutuhanTable)
    .groupBy(kebutuhanTable.laporan_id);

  const countMap: Record<number, number> = {};
  for (const k of kebutuhanCounts) countMap[k.laporan_id] = k.cnt;

  const result = rows.reverse().map(r => ({
    ...r,
    jumlah_kebutuhan_pending: countMap[r.id] || 0,
  }));

  return res.json(result);
});

router.get("/laporan/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID tidak valid" });

  const [laporan] = await db.select().from(laporanTable).where(eq(laporanTable.id, id));
  if (!laporan) return res.status(404).json({ message: "Laporan tidak ditemukan" });

  const penugasan = await db.select().from(penugasanTable).where(eq(penugasanTable.laporan_id, id));

  // Endpoint ini publik (dipakai landing page & Transparansi tanpa login).
  // Admin melihat baris lengkap. Selain admin: laporan "menunggu" belum
  // diverifikasi jadi dianggap tidak ada (404, bukan 403, supaya ID laporan
  // yang belum terbit tidak bisa ditebak), dan field dibatasi ke proyeksi aman.
  const auth = getAuthContext(req);
  if (auth?.role === "admin") {
    return res.json({ ...laporan, penugasan });
  }
  if (!PUBLIC_STATUSES.includes(laporan.status)) {
    return res.status(404).json({ message: "Laporan tidak ditemukan" });
  }
  return res.json({ ...publicLaporan(laporan), penugasan: penugasan.map(publicPenugasan) });
});

const handleUpdateLaporan = async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID tidak valid" });

  const result = UpdateLaporanBody.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Data tidak valid", errors: result.error.flatten() });
  }

  const [updated] = await db.update(laporanTable)
    .set({ ...result.data, updated_at: new Date() })
    .where(eq(laporanTable.id, id))
    .returning();

  if (!updated) return res.status(404).json({ message: "Laporan tidak ditemukan" });
  return res.json(updated);
};

router.put("/laporan/:id", requireRole(["admin"]), handleUpdateLaporan);
router.patch("/laporan/:id", requireRole(["admin"]), handleUpdateLaporan);

// Tambah banyak kebutuhan sekaligus (dipakai form pelapor, sengaja TANPA login
// — sama seperti POST /laporan). Endpoint ini dulunya tidak punya guard sama
// sekali (bisa dipakai siapa saja untuk bulk-insert kebutuhan ke laporan_id
// APA PUN). Guard di bawah membatasi: hanya boleh menambah kebutuhan ke
// laporan yang masih "menunggu" DAN baru dibuat <=15 menit lalu — cukup untuk
// alur pelapor (kebutuhan-bulk dipanggil langsung setelah POST /laporan di
// LaporanBaru.tsx, dalam aksi submit yang sama), tapi menutup celah pakai
// laporan_id lama/acak begitu laporan sudah diverifikasi admin atau sudah lewat
// jendela waktu wajar untuk submit awal.
const KEBUTUHAN_BULK_WINDOW_MS = 15 * 60 * 1000;

router.post("/laporan/:id/kebutuhan-bulk", laporanLimiter, async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID tidak valid" });
  if (!Array.isArray(req.body) || req.body.length === 0) return res.json([]);

  const [laporan] = await db.select().from(laporanTable).where(eq(laporanTable.id, id));
  if (!laporan) return res.status(404).json({ message: "Laporan tidak ditemukan" });

  const umurMs = Date.now() - new Date(laporan.created_at).getTime();
  if (laporan.status !== "menunggu" || umurMs > KEBUTUHAN_BULK_WINDOW_MS) {
    return res.status(403).json({ message: "Laporan sudah diproses atau terlalu lama untuk ditambah kebutuhan" });
  }

  const result = CreateKebutuhanBody.array().safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Data tidak valid", errors: result.error.flatten() });
  }

  const rows = await db.insert(kebutuhanTable).values(
    result.data.map(k => ({ ...k, laporan_id: id }))
  ).returning();
  return res.status(201).json(rows);
});

export default router;
