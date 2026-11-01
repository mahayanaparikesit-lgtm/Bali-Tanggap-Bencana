// Unggah foto asli (bukan link manual) — POST /api/uploads (publik, dipakai
// juga oleh alur lapor darurat tanpa akun). React Native's FormData wants the
// object form { uri, name, type } per file, not a web File/Blob — see
// node_modules/react-native/types_generated/Libraries/Network/FormData.d.ts.
const BASE = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export class UploadError extends Error {}

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

// expo-image-picker sering mengembalikan URI tanpa ekstensi jelas di Android —
// default ke image/jpeg + .jpg kalau tidak bisa ditebak dari URI.
function inferNameAndType(uri: string, index: number): { name: string; type: string } {
  const match = /\.([a-zA-Z0-9]+)(?:\?.*)?$/.exec(uri);
  const ext = match?.[1]?.toLowerCase();
  const mime = ext ? EXT_TO_MIME[ext] : undefined;
  return {
    name: `foto-${Date.now()}-${index}.${mime ? ext : "jpg"}`,
    type: mime ?? "image/jpeg",
  };
}

export async function uploadFiles(uris: string[]): Promise<string[]> {
  if (uris.length === 0) return [];
  const form = new FormData();
  uris.forEach((uri, i) => {
    const { name, type } = inferNameAndType(uri, i);
    // TS's DOM lib types FormData.append's value as `string | Blob`, but React
    // Native's actual runtime FormData (Libraries/Network/FormData.js) accepts
    // this { uri, name, type } object form instead — hence the cast.
    form.append("files", { uri, name, type } as unknown as Blob);
  });

  let res: Response;
  try {
    res = await fetch(`${BASE}/api/uploads`, { method: "POST", body: form });
  } catch {
    throw new UploadError("Tidak bisa terhubung ke server. Periksa koneksi internet Anda.");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new UploadError(data?.message ?? "Gagal mengunggah foto.");
  }
  const data = await res.json();
  return data.urls as string[];
}

// S4 — satu foto KTP ke bucket PRIVAT. Server mengembalikan path (bukan URL);
// kirim sebagai foto_ktp_path. Foto tidak bisa dibuka ulang dari aplikasi.
export async function uploadKtp(uri: string): Promise<string> {
  const form = new FormData();
  const { name, type } = inferNameAndType(uri, 0);
  form.append("file", { uri, name, type } as unknown as Blob);
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/uploads/ktp`, { method: "POST", body: form });
  } catch {
    throw new UploadError("Tidak bisa terhubung ke server. Periksa koneksi internet Anda.");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new UploadError(data?.message ?? "Gagal mengunggah foto KTP.");
  }
  return (await res.json()).path as string;
}
