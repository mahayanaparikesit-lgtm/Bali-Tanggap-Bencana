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
