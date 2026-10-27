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
