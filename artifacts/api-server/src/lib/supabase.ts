import { createClient } from "@supabase/supabase-js";

const url = process.env["SUPABASE_URL"];
const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

if (!url || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to upload files.",
  );
}

// Service-role client — server-side only, never expose this key to clients.
export const supabase = createClient(url, serviceRoleKey);

export const UPLOAD_BUCKET = "laporan-images";

// Awalan URL publik hasil POST /uploads (lihat getPublicUrl di routes/uploads.ts).
// Dipakai untuk menolak URL foto dari luar bucket kita di body laporan.
const OWN_UPLOAD_PREFIX = `${url.replace(/\/$/, "")}/storage/v1/object/public/${UPLOAD_BUCKET}/laporan/`;

export function isOwnUploadUrl(value: string): boolean {
  return value.startsWith(OWN_UPLOAD_PREFIX) && !value.includes("..");
}

// S4 — foto KTP di bucket PRIVAT. Database hanya menyimpan path objek; file
// dibuka admin lewat signed URL berumur pendek, tidak pernah lewat URL publik.
export const KTP_BUCKET = "ktp-privat";
const KTP_PATH_RE = /^ktp\/[0-9a-f-]{36}\.(jpg|png|webp|heic|heif)$/;

export function isKtpPath(value: string): boolean {
  return KTP_PATH_RE.test(value);
}

export async function signedKtpUrl(path: string | null | undefined): Promise<string | null> {
  if (!path || !isKtpPath(path)) return null;
  const { data, error } = await supabase.storage.from(KTP_BUCKET).createSignedUrl(path, 600);
  return error ? null : data.signedUrl;
}

let bucketSiap: Promise<void> | null = null;
// Buat bucket privat sekali bila belum ada (idempoten).
export function ensureKtpBucket(): Promise<void> {
  bucketSiap ??= (async () => {
    const { data } = await supabase.storage.getBucket(KTP_BUCKET);
    if (data) {
      if (data.public) throw new Error(`Bucket ${KTP_BUCKET} ternyata publik — ubah jadi privat di dasbor Supabase.`);
      return;
    }
    const { error } = await supabase.storage.createBucket(KTP_BUCKET, { public: false, fileSizeLimit: 8 * 1024 * 1024 });
    if (error && !/already exists/i.test(error.message)) throw error;
  })().catch(e => { bucketSiap = null; throw e; });
  return bucketSiap;
}
