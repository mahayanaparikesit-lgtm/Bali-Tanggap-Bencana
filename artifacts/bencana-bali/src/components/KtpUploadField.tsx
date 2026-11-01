import { useRef, useState } from "react";
import { IdCard, Loader2, Lock, RotateCcw } from "lucide-react";
import { uploadKtp, UploadError } from "@/lib/upload";

// S4 — unggah foto KTP ke bucket privat. Yang disimpan hanya path; pratinjau
// diambil dari berkas lokal (object URL) dan hilang saat halaman ditutup.
export function KtpUploadField({
  path,
  onChange,
  label = "Foto KTP",
  hint,
}: {
  path: string | null;
  onChange: (path: string | null) => void;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pilih = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const p = await uploadKtp(file);
      setPreview(URL.createObjectURL(file));
      onChange(p);
    } catch (e) {
      setError(e instanceof UploadError ? e.message : "Gagal mengunggah foto KTP. Periksa koneksi Anda.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="mb-2 text-sm font-semibold">{label}</div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => pilih(e.target.files?.[0])} />
      {path ? (
        <div className="relative overflow-hidden rounded-[18px] border border-border bg-ink">
          {preview ? <img src={preview} alt="Pratinjau KTP" className="h-44 w-full object-cover opacity-80 blur-[3px]" />
            : <div className="grid h-28 place-items-center text-sm text-on-ink">KTP sudah terunggah</div>}
          <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-lg bg-ink/80 px-2.5 py-1.5 text-xs font-bold text-white">
            <Lock size={13} />Tersimpan privat · hanya admin
          </span>
          <button type="button" onClick={() => inputRef.current?.click()} className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-full bg-card px-3 py-2 text-xs font-extrabold">
            <RotateCcw size={14} />Ulangi
          </button>
        </div>
      ) : (
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()}
          className="flex h-[110px] w-full flex-col items-center justify-center gap-1.5 rounded-[18px] border-2 border-dashed border-border-strong bg-card text-sm font-extrabold disabled:opacity-70">
          {busy ? <Loader2 size={26} className="animate-spin" /> : <IdCard size={26} />}
          {busy ? "Mengunggah…" : "Foto KTP dengan kamera"}
          <small className="text-xs font-medium text-text2">Satu ketukan. NIK tidak perlu diketik.</small>
        </button>
      )}
      {hint && <p className="mt-2 text-xs text-text2">{hint}</p>}
      {error && <p className="mt-2 text-xs font-semibold text-destructive">{error}</p>}
    </div>
  );
}
