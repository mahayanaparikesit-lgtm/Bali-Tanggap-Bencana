import { Router, type IRouter } from "express";
import multer from "multer";
import crypto from "node:crypto";
import { supabase, UPLOAD_BUCKET, KTP_BUCKET, ensureKtpBucket } from "../lib/supabase";
import { uploadLimiter } from "../middlewares/rateLimit";

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "image/heif": ".heif",
};

// Buffer di memori, lalu diteruskan ke Supabase Storage — tidak ada lagi
// berkas yang menyentuh disk lokal server.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 6 },
  fileFilter: (_req, file, cb) => {
    if (!(file.mimetype in ALLOWED_MIME)) {
      cb(new Error("Jenis berkas tidak didukung — hanya foto (JPEG/PNG/WEBP/HEIC)."));
      return;
    }
    cb(null, true);
  },
});

const router: IRouter = Router();

// Publik (tanpa auth) dengan sengaja — pelapor darurat tanpa akun tetap harus
// bisa lampirkan foto. Dibatasi jenis file, ukuran, dan jumlah per request
// supaya tidak jadi celah penyimpanan/serving berkas sembarangan.
router.post("/uploads", uploadLimiter, (req: any, res: any) => {
  upload.array("files", 6)(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Gagal mengunggah berkas." });
    }
    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length === 0) {
      return res.status(400).json({ message: "Tidak ada berkas yang diunggah." });
    }

    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const ext = ALLOWED_MIME[file.mimetype] ?? "";
          const objectPath = `laporan/${crypto.randomUUID()}${ext}`;
          const { error } = await supabase.storage
            .from(UPLOAD_BUCKET)
            .upload(objectPath, file.buffer, {
              contentType: file.mimetype,
              upsert: false,
            });
          if (error) throw error;
          return supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(objectPath).data.publicUrl;
        }),
      );
      return res.json({ urls });
    } catch (uploadError) {
      req.log?.error({ err: uploadError }, "Supabase Storage upload failed");
      return res.status(502).json({ message: "Gagal menyimpan foto ke penyimpanan. Coba lagi." });
    }
  });
});

// S4 — satu foto KTP ke bucket privat. Publik (pelapor tanpa akun juga perlu),
// dengan batas yang sama. Yang dikembalikan path, bukan URL: klien tidak
// pernah bisa membuka ulang fotonya, hanya admin lewat signed URL.
router.post("/uploads/ktp", uploadLimiter, (req: any, res: any) => {
  upload.single("file")(req, res, async (err: any) => {
    if (err) return res.status(400).json({ message: err.message || "Gagal mengunggah berkas." });
    const file = req.file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ message: "Tidak ada berkas yang diunggah." });
    try {
      await ensureKtpBucket();
      const objectPath = `ktp/${crypto.randomUUID()}${ALLOWED_MIME[file.mimetype] ?? ""}`;
      const { error } = await supabase.storage.from(KTP_BUCKET).upload(objectPath, file.buffer, { contentType: file.mimetype, upsert: false });
      if (error) throw error;
      return res.json({ path: objectPath });
    } catch (uploadError) {
      req.log?.error({ err: uploadError }, "Upload KTP ke bucket privat gagal");
      return res.status(502).json({ message: "Gagal menyimpan foto KTP. Coba lagi." });
    }
  });
});

export default router;
