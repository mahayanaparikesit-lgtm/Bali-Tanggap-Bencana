import { rateLimit } from "express-rate-limit";

// Batas per IP untuk endpoint tulis yang bisa dipanggil tanpa login (atau
// rawan disalahgunakan). Penyimpanan di memori: cukup untuk satu proses
// server; di deploy serverless/multi-instance tiap instance menghitung
// sendiri, jadi batas efektifnya lebih longgar.
//
// Angka sengaja tidak terlalu ketat: saat bencana banyak warga bisa berbagi
// satu IP publik (CGNAT operator seluler, WiFi posko).
const LIMA_BELAS_MENIT = 15 * 60 * 1000;

function limiter(limit: number, message: string) {
  return rateLimit({
    windowMs: LIMA_BELAS_MENIT,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message },
  });
}

// Satu laporan = 1× POST /laporan (+ 1× kebutuhan-bulk dari form web).
export const laporanLimiter = limiter(10, "Terlalu banyak laporan dari jaringan ini. Coba lagi dalam 15 menit, atau hubungi 112 bila darurat.");

// Wizard mobile mengunggah satu foto per request (sampai ±7 per laporan).
export const uploadLimiter = limiter(60, "Terlalu banyak unggahan dari jaringan ini. Coba lagi dalam 15 menit.");

export const authLimiter = limiter(20, "Terlalu banyak percobaan masuk/daftar. Coba lagi dalam 15 menit.");

// Donasi barang dikirim satu POST per jenis barang.
export const donasiLimiter = limiter(30, "Terlalu banyak donasi dari jaringan ini. Coba lagi dalam 15 menit.");
