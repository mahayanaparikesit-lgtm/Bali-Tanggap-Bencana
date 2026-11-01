// Unggah foto asli (bukan link manual) — POST /uploads (publik, dipakai juga
// oleh alur lapor darurat tanpa akun). Dipanggil lewat fetch manual, bukan
// client generated Orval, karena skema multipart/binary tidak digenerate
// Orval dengan bersih (lihat catatan di lib/api-spec/openapi.yaml).
const BASE = import.meta.env.VITE_API_URL.replace(/\/$/, "");

export class UploadError extends Error {}

export async function uploadFiles(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];
  const form = new FormData();
  for (const f of files) form.append("files", f);

  const res = await fetch(`${BASE}/api/uploads`, { method: "POST", body: form });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new UploadError(data?.message ?? "Gagal mengunggah foto.");
  }
  const data = await res.json();
  return data.urls as string[];
}

// S4 — foto KTP ke bucket PRIVAT. Server mengembalikan path (bukan URL);
// kirim sebagai foto_ktp_path. Foto tidak bisa dibuka ulang dari klien.
export async function uploadKtp(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/api/uploads/ktp`, { method: "POST", body: form });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new UploadError(data?.message ?? "Gagal mengunggah foto KTP.");
  }
  return (await res.json()).path as string;
}
