// Proyeksi field yang AMAN untuk endpoint publik / login-apa-saja. Semua
// endpoint yang bisa dibuka non-admin wajib lewat sini — jangan kirim baris
// tabel mentah (`...row`), karena kolom sensitif baru otomatis ikut bocor.
//
// Sengaja TIDAK dikirim: foto_ktp_url, nama/kontak/jabatan pelapor,
// catatan_admin (catatan internal admin), kontak donatur, bukti transfer,
// user_id, pesan donatur, link grup / QR penugasan.
import type { Laporan, Donasi, Penugasan } from "@workspace/db/schema";

export function publicLaporan(l: Laporan) {
  return {
    id: l.id,
    judul: l.judul,
    jenis_bencana: l.jenis_bencana,
    lokasi: l.lokasi,
    koordinat_lat: l.koordinat_lat,
    koordinat_lng: l.koordinat_lng,
    deskripsi: l.deskripsi,
    jumlah_terdampak: l.jumlah_terdampak,
    lokasi_pengungsian: l.lokasi_pengungsian,
    foto_urls: l.foto_urls,
    kronologi: l.kronologi,
    target_dana: l.target_dana,
    status: l.status,
    created_at: l.created_at,
    updated_at: l.updated_at,
  };
}

export function publicPenugasan(p: Penugasan) {
  return {
    id: p.id,
    laporan_id: p.laporan_id,
    nama_relawan: p.nama_relawan,
    detail_tugas: p.detail_tugas,
    status: p.status,
    created_at: p.created_at,
  };
}

// Belum ada flag anonim di tabel donasi (mobile mengirim "Hamba Allah" sebagai
// penanda anonim). Sementara menunggu keputusan aturan tampil: nama depan
// utuh + inisial sisanya ("Budi Santoso" → "Budi S.").
export function maskNamaDonatur(nama: string) {
  const parts = nama.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? "Anonim";
  return `${parts[0]} ${parts.slice(1).map(p => `${p[0].toUpperCase()}.`).join(" ")}`;
}

export function publicDonasi(d: Donasi) {
  return {
    id: d.id,
    laporan_id: d.laporan_id,
    jenis: d.jenis,
    jumlah_dana: d.jumlah_dana,
    nama_barang: d.nama_barang,
    jumlah_barang: d.jumlah_barang,
    nama_donatur: maskNamaDonatur(d.nama_donatur),
    status: d.status,
    created_at: d.created_at,
  };
}
